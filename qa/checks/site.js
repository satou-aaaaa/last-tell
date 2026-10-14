// 公開サイトとしての検査（2026-10-14 CIのチェック充実 案4）：テスト公開のリポジトリ（index.html のとなりに sw.js・manifest がある所）でだけ回す
//   1. manifest とアイコン：名前・start_url・display・アイコンのファイルがある
//   2. オフライン：一度開いたあと、ネットを切って開き直してもタイトルが出る（sw.js）
//   3. リンク切れ：となりの .html（プライバシー・利用規約・サポート）と index.html の、手元のファイルへのリンク
//   4. Lighthouse の点（速さ・読みやすさ・作法・検索）：QA_LIGHTHOUSE=1 のときだけ（CI）。前の版より5点以上下がったら ⚠️
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execFile } = require('child_process');
const H = require('../lib/harness');

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml' };
function serve(root) {
  return new Promise(res => {
    const srv = http.createServer((q, r) => {
      let p = decodeURIComponent(new URL(q.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(root, p);
      if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end('not found') }
      r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}

async function run({ browser, file, baseline }) {
  const root = path.dirname(path.resolve(file)), items = [];
  if (!fs.existsSync(path.join(root, 'sw.js')) || !fs.existsSync(path.join(root, 'manifest.webmanifest')))
    return { name: '公開サイト', items: [{ id: 'site:skip', title: '公開サイトとしての検査', status: 'warn', detail: 'となりに sw.js・manifest.webmanifest が無いので飛ばした（テスト公開のリポジトリの CI で回る）' }] };

  // 1. manifest
  const bad = [];
  let man = {}; try { man = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8')) } catch (e) { bad.push('manifest が JSON として読めない') }
  for (const k of ['name', 'short_name', 'start_url', 'display', 'icons']) if (!man[k]) bad.push(`manifest に ${k} が無い`);
  for (const ic of man.icons || []) if (!fs.existsSync(path.join(root, ic.src))) bad.push(`アイコン ${ic.src} が無い`);
  if (!(man.icons || []).some(i => /512/.test(i.sizes))) bad.push('512px のアイコンが無い');
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), core = ((sw.match(/const CORE = \[([^\]]*)\]/) || [])[1] || '').match(/'[^']+'/g) || [];
  for (const c of core.map(x => x.slice(1, -1).replace(/^\.\//, ''))) if (c && !fs.existsSync(path.join(root, c))) bad.push(`sw.js が保存するファイル ${c} が無い`);
  items.push({ id: 'site:manifest', title: 'ホーム画面に入れられる（manifest・アイコン・sw.js の保存ファイルがそろう）', status: bad.length ? 'fail' : 'ok', detail: bad.length ? bad.join('、') : `アイコン ${(man.icons || []).length}個、sw.js の保存ファイル ${core.length}個` });

  // 2. オフライン
  const srv = await serve(root), url = `http://localhost:${srv.address().port}/`;   // ゲームは https か localhost のときだけ sw.js を登録する
  try {
    const ctx = await browser.newContext({ serviceWorkers: 'allow' });
    let detail = '', ok = false;
    try {
      const page = await ctx.newPage();
      await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
      await page.goto(url, { waitUntil: 'load' });
      const ready = await page.evaluate(() => navigator.serviceWorker ? Promise.race([navigator.serviceWorker.ready.then(() => true), new Promise(r => setTimeout(() => r(false), 15000))]) : false);
      if (!ready) detail = 'sw.js が動き出さなかった';
      else {
        await page.waitForTimeout(1500);   // 保存（install）が終わるのを待つ
        await ctx.setOffline(true);
        await page.reload({ waitUntil: 'load' }).catch(e => { detail = '開き直せない: ' + String(e.message).slice(0, 80) });
        if (!detail) { ok = await page.evaluate(() => { const t = document.getElementById('title'); return !!t && !t.hidden }).catch(() => false); if (!ok) detail = 'ネットを切ったら、タイトルが出なかった' }
      }
    } finally { await ctx.close() }
    items.push({ id: 'site:offline', title: 'ネットが無くても開ける（一度開いたあと、オフラインで開き直してタイトルが出る）', status: ok ? 'ok' : 'fail', detail: ok ? 'オフラインで開き直してタイトルが出た' : detail });

    // 3. リンク切れ（手元のファイルへのリンクだけ。外のサイトは数だけ）
    const pages = fs.readdirSync(root).filter(f => f.endsWith('.html')), broken = []; let ext = 0;
    for (const p of pages) {
      const src = fs.readFileSync(path.join(root, p), 'utf8').replace(/<!--[\s\S]*?-->/g, '');   // コメントの中（差し替えの見本など）は見ない
      for (const m of src.matchAll(/(?:href|src)=["']([^"'#?]+)[^"']*["']/g)) {
        const u = m[1]; if (/^(https?:|mailto:|data:|javascript:|\/\/)/.test(u)) { if (/^https?:/.test(u)) ext++; continue }
        if (u.includes('${') || u.includes("'+")) continue;   // コードの中で組み立てる文字列
        if (!fs.existsSync(path.join(root, decodeURIComponent(u)))) broken.push(`${p} → ${u}`);
      }
    }
    items.push({ id: 'site:links', title: 'ページの中のリンクが切れていない（プライバシー・利用規約・サポートほか）', status: broken.length ? 'fail' : 'ok',
      detail: broken.length ? `切れている ${broken.length}件: ` + [...new Set(broken)].slice(0, 5).join('、') : `${pages.length}ページ、手元へのリンクは全部ある（外のサイトへのリンク ${ext}件は見ていない）` });

    // 4. Lighthouse
    const scores = {};
    if (process.env.QA_LIGHTHOUSE === '1') {
      try {
        // 同じプロセスでページを配っているので、待つ間も止めない（execFileSync だと配れなくなって止まる）
        const out = await new Promise((ok, ng) => execFile('npx', ['-y', 'lighthouse@12.8.2', url, '--quiet', '--output=json', '--only-categories=performance,accessibility,best-practices,seo', '--form-factor=mobile',
          '--chrome-flags=--headless=new --no-sandbox'], { env: { ...process.env, CHROME_PATH: H.pw.chromium.executablePath() }, maxBuffer: 1 << 28, timeout: 420000 }, (e, so) => e ? ng(e) : ok(String(so))));
        const j = JSON.parse(out); for (const [k, c] of Object.entries(j.categories)) scores[k] = Math.round(c.score * 100);
      } catch (e) { items.push({ id: 'site:lighthouse', title: 'Lighthouse の点', status: 'warn', detail: '測れなかった: ' + String(e.message).slice(0, 160) }) }
      if (Object.keys(scores).length) {
        const prev = (baseline && baseline.site && baseline.site.lighthouse) || {}, down = Object.entries(scores).filter(([k, v]) => prev[k] != null && v < prev[k] - 5);
        const name = { performance: '速さ', accessibility: '読みやすさ', 'best-practices': '作法', seo: '検索' };
        items.push({ id: 'site:lighthouse', title: 'Lighthouse の点（スマホ、前の版より5点以上下がらない）', status: down.length ? 'warn' : 'ok',
          detail: Object.entries(scores).map(([k, v]) => `${name[k] || k} ${v}${prev[k] != null ? `（前 ${prev[k]}）` : ''}`).join('、') });
      }
    }
    return { name: '公開サイト', items, baselineOut: Object.keys(scores).length ? { site: { lighthouse: scores } } : {} };
  } finally { srv.close() }
}
module.exports = { run };
