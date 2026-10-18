// LAST TELL のオフライン用 Service Worker。
// ゲーム本体（index.html）はネット優先：つながるときは常に最新版、つながらないときは保存した版で起動する。
// プライバシーポリシー・利用規約・サポート（日本語・英語）とフォントのライセンス全文も最初に保存し、オフラインでも開けるようにする。
// 保存していないページをオフラインで開いたときは、ゲームではなく「オフラインです」を出す。
// アイコンとフォントは保存した版を優先する。
// VERSION は tools/build_index.py が公開のたびに書き換える。
const VERSION = 'lt-20261018073415';
// ゲームから開くページを足したら、ここにも足す（qa/checks/pages.js が、足りないと ❌ にする）
const CORE = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png',
  './privacy.html', './terms.html', './support.html', './privacy-en.html', './terms-en.html', './support-en.html', './style.css',
  './licenses/OFL_shipporiminchob1.txt', './licenses/OFL_zenkakugothicnew.txt', './licenses/OFL_oswald.txt'];

// 保存していないページをオフラインで開いたとき
const OFFLINE = '<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
  + '<title>オフラインです | LAST TELL</title></head><body style="font-family:sans-serif;padding:2em;line-height:1.7">'
  + '<p>オフラインです。ネットにつながってから、もう一度開いてください。</p><p lang="en">You are offline. Please try again when you are connected.</p>'
  + '<p><a href="./">LAST TELL</a></p></body></html>';
const offline = () => new Response(OFFLINE, { status: 503, headers: { 'content-type': 'text/html; charset=utf-8' } });

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== 'lt-fonts').map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google Fonts：一度読み込んだら端末に残し、オフラインでも同じ文字で表示する
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open('lt-fonts').then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') c.put(req, res.clone());
      return res;
    }));
    return;
  }
  if (url.origin !== location.origin) return;

  // ページ：ネット優先、だめなら保存した版。ゲーム本体の代わりに出すのは、トップ（./ と ./index.html）を開いたときだけ
  if (req.mode === 'navigate') {
    const scope = new URL(self.registration.scope).pathname;
    const isTop = url.pathname === scope || url.pathname === scope + 'index.html';
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true })
      .then(r => r || (isTop ? caches.match('./index.html') : undefined))
      .then(r => r || offline())));
    return;
  }

  // そのほか（アイコンなど）：保存した版を優先
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  })));
});
