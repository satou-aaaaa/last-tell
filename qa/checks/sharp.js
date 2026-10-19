// 画質（くっきり描けているか）の検査（2026-10-19 satou「ゲームの画質が悪いように見える」「同様の問題が二度と起こらないように」）
//   ほかの画面の検査は deviceScaleFactor 1 で撮るので、高精細の画面（スマホ・PC の拡大表示）でだけ出るぼやけが写らない。
//   ここではスマホ縦（3倍）・PC（2倍）で開き、部品ごとに「画面の細かさどおりに描けているか」（下の q、細かさ）を測る。1.6 より小さければ ❌（部品が複数あれば、いちばん低い値で）。
//   v0.97 までの卓（rotateX で倒した 3D の板）の場札は 1.4〜1.5、直したあと（01m_style_sharp.css、zoom:3）は 1.75〜2.2、卓の外の自分の手札は 1.8〜2.5。
//   顔のアップ（カメラが寄ったとき）は 1.45 より小さければ ❌。顔は柔らかい絵なので、くっきりでも 1.6〜2.2（引き伸ばしたぼやけは 1.3 前後）。
//   寄る前との比は、表情・まばたき・写る範囲で 0.77〜1.13 とぶれたので、判定に使わない（表示だけ）。
//   ui.js の最後から呼ぶ（Chromium と WebKit の両方で回る。qa.yml の組を足さなくてよい）。
'use strict';
const H = require('../lib/harness');

const VPS = [
  { key: 'スマホ縦_3倍', viewport: { width: 390, height: 844 }, dpr: 3, isMobile: true, hasTouch: true },
  { key: 'PC_2倍', viewport: { width: 1280, height: 800 }, dpr: 2 },
];
const QMIN = 1.6, ZMIN = 1.45;

// 画像（PNG の Buffer）を、ページの canvas で測る。
//   v：輪郭の急さ（となりの点との明るさの差の上位 0.5% ÷ 部品の明るさの幅）
//   q：v ÷「同じ画像を 1/k に縮めて戻した画像」の v。画面の細かさ（k 倍）どおりに描けていれば 1.7〜2.2、
//      ブラウザが低い解像度で描いて引き伸ばしていると 1.3 前後（縮めて戻してもほとんど変わらない＝細かさが無い）
async function sharpness(page, buf, k) {
  return page.evaluate(async ([b64, k]) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
    const W = im.naturalWidth, Hh = im.naturalHeight, cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c };
    const A = cv(W, Hh), a = A.getContext('2d'); a.drawImage(im, 0, 0);
    const sm = cv(Math.max(1, Math.round(W / k)), Math.max(1, Math.round(Hh / k))), s = sm.getContext('2d'); s.imageSmoothingQuality = 'high'; s.drawImage(im, 0, 0, sm.width, sm.height);
    const B = cv(W, Hh), b = B.getContext('2d'); b.imageSmoothingQuality = 'high'; b.drawImage(sm, 0, 0, W, Hh);
    const edge = x => { const d = x.getImageData(0, 0, W, Hh).data, L = new Float32Array(W * Hh); for (let i = 0; i < W * Hh; i++) L[i] = .299 * d[i * 4] + .587 * d[i * 4 + 1] + .114 * d[i * 4 + 2];
      const g = []; for (let y = 0; y < Hh; y++) for (let j = 0; j < W; j++) { const i = y * W + j; if (j + 1 < W) g.push(Math.abs(L[i + 1] - L[i])); if (y + 1 < Hh) g.push(Math.abs(L[i + W] - L[i])) }
      const o = Array.from(L).sort((p, q) => p - q), rng = o[Math.floor(o.length * .99)] - o[Math.floor(o.length * .01)]; g.sort((p, q) => p - q); return g[Math.floor(g.length * .995)] / Math.max(rng, 1) };
    const v = edge(a), v1 = edge(b); return { v, q: v / Math.max(v1, 1e-3), w: W, h: Hh };
  }, [buf.toString('base64'), k]);
}
// 部品の四角（縁の2pxは除き、画面の外は切る）。見えていて、ある程度の大きさがあるものだけ
const rectsOf = (page, sel, n) => page.evaluate(([s, n]) => [...document.querySelectorAll(s)].filter(e => e.offsetParent !== null || e.tagName === 'svg').filter(e => getComputedStyle(e).visibility !== 'hidden')
  .map(e => { const r = e.getBoundingClientRect(), x = Math.max(0, r.left + 2), y = Math.max(0, r.top + 2), x2 = Math.min(innerWidth, r.right - 2), y2 = Math.min(innerHeight, r.bottom - 2); return { x, y, width: x2 - x, height: y2 - y } })
  .filter(r => r.width > 16 && r.height > 16).slice(0, n), [sel, n]);
async function measure(page, sel, n, k) {
  const out = [];
  for (const clip of await rectsOf(page, sel, n)) out.push((await sharpness(page, await page.screenshot({ clip }), k)).q);
  return out.length ? Math.min(...out) : null;   // いちばん甘い部品で判定する（平均にすると、ぼやけた1枚が隠れる。CodeRabbit PR #107）
}
const r2 = v => v == null ? '—' : v.toFixed(2);

async function shoot(browser, file, vp) {
  const k = vp.dpr;
  const { ctx, page } = await H.openGame(browser, file, { viewport: vp.viewport, isMobile: vp.isMobile, hasTouch: vp.hasTouch, dpr: vp.dpr, fast: 20, lite: false, settings: { motion: 'full' }, seed: 1001, storage: H.UNLOCKED });
  try {
    await page.evaluate(`startChapter(CHAPTERS[1],true)`);
    await H.startBot(page, { policy: 'call', maxHands: 99 });
    // フロップで自分の番になったら止める（場札3枚・自分の手札・相手の顔がそろう）
    await page.evaluate(() => { const B = __bot, t = B.tick; B.tick = function () { if (S && S.players && !S.handOver && S.toAct === 0 && S.street === 'flop' && !document.getElementById('controls').hidden) { B.done = true; return } t() }; clearInterval(B.timer); B.timer = setInterval(B.tick, 4) });
    const t0 = Date.now(); while (!(await page.evaluate(() => __bot.done)) && Date.now() - t0 < 60000) await page.waitForTimeout(150);
    await page.evaluate(() => clearInterval(__bot.timer));
    if (!(await page.evaluate(() => __bot.done))) throw new Error('フロップの自分の番が60秒で来なかった');
    await page.waitForTimeout(1500);
    const own = await measure(page, '#mine .card:not(.back)', 2, k);
    const board = await measure(page, '#boardCards .card:not(.back):not(.slot)', 3, k);
    const chips = await measure(page, '#potChips', 1, k);
    const ownChips = await measure(page, '#mine .mystack', 1, k);   // 卓の外のチップ（くらべ用）
    const seatChips = await measure(page, '.felt .spot .mystack', 2, k);   // 卓の上の相手のチップ（表示だけ。ポットのチップだけが甘いのか、卓のチップ全部かを見分ける）
    // 顔：寄る前と、寄ったあと（カメラの動きが終わってから）
    const seat = await page.evaluate(() => { for (let i = 1; i < S.players.length; i++) { const b = document.getElementById('bust' + i); if (b && !S.players[i].out && b.querySelector('.body svg')) return i } return -1 });
    const faceSel = `#bust${seat} .body svg`;
    const face0 = seat > 0 ? await measure(page, faceSel, 1, k) : null;
    let face1 = null;
    if (seat > 0 && await page.evaluate(() => typeof camTo === 'function' && !!document.getElementById('cam'))) {
      await page.evaluate(i => camTo(i, 'tell'), seat);
      for (let last = '', t1 = Date.now(); Date.now() - t1 < 4000; await page.waitForTimeout(250)) { const t = await page.evaluate(() => getComputedStyle(document.getElementById('cam')).transform); if (t === last) break; last = t }
      await page.waitForTimeout(500);
      face1 = await measure(page, faceSel, 1, k);
    }
    return { own, board, chips, ownChips, seatChips, face0, face1, seat };
  } finally { await ctx.close() }
}

async function run({ browser, file }) {
  const items = [];
  for (const vp of VPS) {
    let r;
    try { r = await shoot(browser, file, vp) } catch (e) { items.push({ id: `sharp:${vp.key}`, title: `画質を測れた（${vp.key}）`, status: 'fail', detail: String(e.message).slice(0, 120) }); continue }
    // チップは CSS のグラデーションで描くので、ブラウザによっては卓の外でも柔らかい（v0.97.0 CI：WebKit だけポットのチップ 1.27〜1.50）。
    // 卓のせいでぼやけたときだけ ❌ にするため、チップは「卓の外の自分のチップ」の 0.85 倍より下で、かつ QMIN 未満のときに ❌
    const bad = v => v != null && v < QMIN, chipBad = v => bad(v) && !(r.ownChips != null && v >= r.ownChips * .85), ref = `（くらべ：自分の手札 ${r2(r.own)}、自分のチップ ${r2(r.ownChips)}、相手のチップ ${r2(r.seatChips)}）`;
    items.push({ id: `sharp:table:${vp.key}`, title: `卓の上の札・チップがくっきり描けている（${vp.key}、細かさ ${QMIN} 以上。チップは卓の外のチップの 0.85 倍以上でも可）`, status: r.board == null ? 'warn' : r.chips == null || bad(r.board) || chipBad(r.chips) ? 'fail' : 'ok',   // フロップではポットに必ずチップがある。測れなければ ❌
      detail: r.board == null ? '場札が見つからなかった' : `場札 ${r2(r.board)}、ポットのチップ ${r2(r.chips)} ${ref}${bad(r.board) || chipBad(r.chips) ? '。ぼやけている：ブラウザが低い解像度で描いて引き伸ばしている（3D で倒した卓、拡大など）' : ''}` });
    // 顔は柔らかい絵（グラデーション）なので、場札より低い目安（ZMIN）で見る。寄る前の値は表示だけ
    items.push({ id: `sharp:zoom:${vp.key}`, title: `顔のアップでもくっきりしている（${vp.key}、細かさ ${ZMIN} 以上）`, status: r.face1 == null ? 'fail' : r.face1 < ZMIN ? 'fail' : 'ok',
      detail: r.face1 == null ? `顔かカメラが見つからなかった（席 ${r.seat}）` : `寄る前 ${r2(r.face0)} → 寄ったあと ${r2(r.face1)}` });
  }
  return { name: '画質（高精細の画面でくっきりしているか）', items };
}
module.exports = { run, VPS, QMIN, ZMIN };
