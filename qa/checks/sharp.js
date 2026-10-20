// 画質（くっきり描けているか）の検査（2026-10-19 satou「ゲームの画質が悪いように見える」「同様の問題が二度と起こらないように」）
//   ほかの画面の検査は deviceScaleFactor 1 で撮るので、高精細の画面（スマホ・PC の拡大表示）でだけ出るぼやけが写らない。
//   ここではスマホ縦（3倍）・PC（2倍）で開き、部品ごとに「画面の細かさどおりに描けているか」（下の q、細かさ）を測る。1.6 より小さければ ❌（部品が複数あれば、いちばん低い値で）。
//   v0.97 までの卓（rotateX で倒した 3D の板）の場札は 1.4〜1.5、直したあと（01m_style_sharp.css、zoom:3）は 1.75〜2.2、卓の外の自分の手札は 1.8〜2.5。
//   WebKit は zoom:3 の卓の中の部品の位置（getBoundingClientRect）がずれて返るので、卓の部品は色を塗って本当の場所を探す（rectsOf）。
//   WebKit の PC だけは全体に柔らかく（顔も 1.35〜1.49）直す手が無いので ⚠️（run の soft）。
//   顔のアップ（カメラが寄ったとき）は 1.45 より小さければ ❌。顔は柔らかい絵なので、くっきりでも 1.6〜2.2（引き伸ばしたぼやけは 1.3 前後）。
//   寄る前との比は、表情・まばたき・写る範囲で 0.77〜1.13 とぶれたので、判定に使わない（表示だけ）。
//   ui.js の最後から呼ぶ（Chromium と WebKit の両方で回る。qa.yml の組を足さなくてよい）。
'use strict';
const H = require('../lib/harness');

const VPS = [
  { key: 'スマホ縦_3倍', viewport: { width: 390, height: 844 }, dpr: 3, isMobile: true, hasTouch: true },
  { key: 'PC_2倍', viewport: { width: 1280, height: 800 }, dpr: 2 },
];
const QMIN = 1.6, ZMIN = 1.45, GAP_MAX = 8;

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
//   WebKit は zoom:3 の卓の中の部品で、getBoundingClientRect も Playwright の boundingBox もずれた所を返し、
//   何もないラシャを測っていた（v0.97.0 の CI：場札 1.45・チップ 0.94 の切り抜きが空の卓。ずれは最大 70〜90px）。
//   そこで部品をいったん赤紫に塗って画面を撮り、赤紫の範囲を本当の場所とする。getBoundingClientRect とのずれは gap に残す
let gapMax = 0, paintLog = null, hitStat = null;   // hitStat：当たり判定（elementFromPoint）が描かれた場所と測った場所のどちらに従うか（v0.97.7。WebKit で場所の数字の代わりに使えるかを見る）   // paintLog：試した直しで絵が動いていないかをくらべるため、描かれた場所を順に残す
const MARK = 'sharpMark';
async function rectsOf(page, sel, n) {
  const out = [];
  const cnt = await page.evaluate(s => document.querySelectorAll(s).length, sel);
  for (let i = 0; i < cnt && out.length < n; i++) {
    const g = await page.evaluate(([s, i, M]) => { const e = document.querySelectorAll(s)[i]; if (!e || !(e.offsetParent !== null || e.tagName === 'svg') || getComputedStyle(e).visibility === 'hidden') return null;
      const st = document.createElement('style'); st.id = M; st.textContent = `[data-sharp-mark],[data-sharp-mark] *{background:#ff00ff!important;fill:#ff00ff!important;color:#ff00ff!important;box-shadow:none!important;border-color:#ff00ff!important;opacity:1!important;filter:none!important}`; document.head.appendChild(st); e.setAttribute('data-sharp-mark', '');
      const r = e.getBoundingClientRect(), felt = !!e.closest('.felt'); if (!felt) { e.removeAttribute('data-sharp-mark'); st.remove() }
      return { x: r.left, y: r.top, w: r.width, h: r.height, W: innerWidth, H: innerHeight, felt } }, [sel, i, MARK]);
    if (!g) continue;
    if (!g.felt) {   // 卓の外（手札・顔など）は getBoundingClientRect のままでずれない
      const x = Math.max(0, g.x + 2), y = Math.max(0, g.y + 2), x2 = Math.min(g.W, g.x + g.w - 2), y2 = Math.min(g.H, g.y + g.h - 2);
      if (x2 - x > 16 && y2 - y > 16) out.push({ x, y, width: x2 - x, height: y2 - y });
      continue;
    }
    await page.waitForTimeout(120);
    const shot = await page.screenshot({ scale: 'css' });
    await page.evaluate(([s, i, M]) => { const e = document.querySelectorAll(s)[i]; if (e) { e.removeAttribute('data-sharp-mark'); e.removeAttribute('data-sharp-off') } const st = document.getElementById(M); if (st) st.remove() }, [sel, i, MARK]);
    await page.waitForTimeout(120);
    const plain = await page.screenshot({ scale: 'css' });
    // 塗った画面と塗っていない画面で、変わった所のうち赤紫寄りの点の範囲（暗い幕の下でも拾えるよう、色はゆるく見る）
    const b = await page.evaluate(async ([m64, p64]) => { const load = async b64 => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const x = c.getContext('2d'); x.drawImage(im, 0, 0); return { w: c.width, h: c.height, d: x.getImageData(0, 0, c.width, c.height).data } };
      const M = await load(m64), P = await load(p64), d = M.d, q = P.d; let x1 = 1e9, y1 = 1e9, x2 = -1, y2 = -1;
      for (let y = 0; y < M.h; y++) for (let k = 0; k < M.w; k++) { const o = (y * M.w + k) * 4, r = d[o], gg = d[o + 1], bb = d[o + 2];
        if (Math.abs(r - q[o]) + Math.abs(gg - q[o + 1]) + Math.abs(bb - q[o + 2]) > 60 && r > 60 && bb > 60 && gg < .45 * Math.min(r, bb) && Math.abs(r - bb) < .35 * Math.max(r, bb)) { if (k < x1) x1 = k; if (k > x2) x2 = k; if (y < y1) y1 = y; if (y > y2) y2 = y } }
      return x2 < 0 ? null : { x: x1, y: y1, width: x2 - x1 + 1, height: y2 - y1 + 1 } }, [shot.toString('base64'), plain.toString('base64')]);
    if (paintLog) paintLog.push(b);
    if (!b) continue;
    if (hitStat) { const h = await page.evaluate(([s, i, b, g]) => { const e = document.querySelectorAll(s)[i]; if (!e) return null; const at = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === e || e.contains(t)) };
        return { p: at(b.x + b.width / 2, b.y + b.height / 2), g: at(g.x + g.w / 2, g.y + g.h / 2) } }, [sel, i, b, g]);
      if (h) { hitStat.n++; if (h.p) hitStat.p++; if (h.g) hitStat.g++ } }
    gapMax = Math.max(gapMax, Math.abs(b.x - g.x), Math.abs(b.y - g.y));
    const x = Math.max(0, b.x + 2), y = Math.max(0, b.y + 2), x2 = Math.min(g.W, b.x + b.width - 2), y2 = Math.min(g.H, b.y + b.height - 2);
    if (x2 - x > 16 && y2 - y > 16) out.push({ x, y, width: x2 - x, height: y2 - y });
  }
  return out;
}
async function measure(page, sel, n, k) {
  const out = [];
  for (const clip of await rectsOf(page, sel, n)) out.push((await sharpness(page, await page.screenshot({ clip }), k)).q);
  return { q: out.length ? Math.min(...out) : null, n: out.length };   // いちばん甘い部品で判定する（平均にすると、ぼやけた1枚が隠れる。CodeRabbit PR #107）。測れた数も返す
}
const r2 = v => v == null ? '—' : v.toFixed(2);

const bad = v => v == null || v < QMIN;
// ぼやけたときに試す CSS（表示だけ。判定には使わない）
const TRIES = [
  ['札の3D・動きなし', '.felt .card{transform-style:flat!important;animation:none!important;transform:none!important}'],
  ['卓の中の位置ずらしなし', '.felt .potzone,.felt .potchips,.felt .boardspot{translate:none!important}'],
  ['will-change', '.felt .boardspot{will-change:transform}'],
  ['卓を3Dにしない', '.felt{transform-style:flat!important}'],
  ['zoomなし', '.felt{zoom:1!important;inset:0!important;width:auto!important;height:auto!important;transform:rotateX(50deg)!important}'],
];
// 場所のずれを直す候補（表示だけ。判定には使わない）
const GAP_TRIES = [
  ['倒さない', '.felt{transform:scale(.333333)!important}'],
  ['卓を3Dにしない', '.felt{transform-style:flat!important}'],
  ['卓の中も全部平ら', '.felt,.felt *{transform-style:flat!important}'],
  ['遠近を卓の transform に', '.felt-wrap{perspective:none!important}.felt{transform:perspective(620px) rotateX(50deg) scale(.333333)!important}'],
  ['.table の遠近なし', '.table{perspective:none!important}'],
  ['手札の遠近なし', '.felt .spot .hand{perspective:none!important}'],
  ['zoomなし', '.felt{zoom:1!important;inset:0!important;width:auto!important;height:auto!important;transform:rotateX(50deg)!important}'],
  ['will-change', '.felt{will-change:transform}'],
  // v0.97.7 で試した「遠近を卓の perspective() にまとめる」（Chromium では差 0px）は、WebKit で絵が 160px 動いた・測れなくなったので外した
];
async function shoot(browser, file, vp, dir) {
  const k = vp.dpr; gapMax = 0; hitStat = { n: 0, p: 0, g: 0 };
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
    const own = (await measure(page, '#mine .card:not(.back)', 2, k)).q;
    const B = await measure(page, '#boardCards .card:not(.back):not(.slot)', 3, k), board = B.q, boardN = B.n;
    const chips = (await measure(page, '#potChips', 1, k)).q;
    const ownChips = (await measure(page, '#mine .mystack', 1, k)).q;   // 卓の外のチップ（くらべ用、表示だけ）
    const seatChips = (await measure(page, '.felt .spot .mystack', 2, k)).q;   // 卓の上の相手のチップ（くらべ用、表示だけ）
    // ぼやけたときだけ：どの CSS を変えるとくっきりするかを試して、結果を表示する（直し方を CI 1回で探すため。WebKit は手元で動かせない）
    let tries = null;
    if (bad(board) || bad(chips)) {
      tries = [];
      const hitNormal = hitStat; hitStat = null;   // 画質の候補を試す間の当たり判定は数えない（CodeRabbit PR #121）
      try {
      for (const [name, css] of TRIES) {
        await page.evaluate(c => { const st = document.createElement('style'); st.id = 'sharpTry'; st.textContent = c; document.head.appendChild(st) }, css);
        await page.waitForTimeout(400);
        tries.push(`${name} 場札 ${r2((await measure(page, '#boardCards .card:not(.back):not(.slot)', 3, k)).q)}・チップ ${r2((await measure(page, '#potChips', 1, k)).q)}`);
        await page.evaluate(() => document.getElementById('sharpTry').remove());
      }
      if (dir) for (const [nm, sel] of [['場札', '#boardCards .card:not(.back):not(.slot)'], ['ポットのチップ', '#potChips'], ['相手のチップ', '.felt .spot .mystack']]) {
        const c = (await rectsOf(page, sel, 1))[0]; if (c) await page.screenshot({ clip: c, path: require('path').join(dir, `画質_${process.env.QA_BROWSER || 'chromium'}_${vp.key}_${nm}.png`) }).catch(() => {});
      }
      } finally { hitStat = hitNormal }
    }
    // 顔：寄る前と、寄ったあと（カメラの動きが終わってから）
    const seat = await page.evaluate(() => { for (let i = 1; i < S.players.length; i++) { const b = document.getElementById('bust' + i); if (b && !S.players[i].out && b.querySelector('.body svg')) return i } return -1 });
    const faceSel = `#bust${seat} .body svg`;
    const face0 = seat > 0 ? (await measure(page, faceSel, 1, k)).q : null;
    let face1 = null;
    if (seat > 0 && await page.evaluate(() => typeof camTo === 'function' && !!document.getElementById('cam'))) {
      await page.evaluate(i => camTo(i, 'tell'), seat);
      for (let last = '', t1 = Date.now(); Date.now() - t1 < 4000; await page.waitForTimeout(250)) { const t = await page.evaluate(() => getComputedStyle(document.getElementById('cam')).transform); if (t === last) break; last = t }
      await page.waitForTimeout(500);
      face1 = (await measure(page, faceSel, 1, k)).q;
    }
    // 場所がずれたときだけ：どの CSS を変えると、描かれた場所と getBoundingClientRect が合うかを試して出す（v0.97.5 CI：WebKit は zoom を外しても 72〜80px ずれた。WebKit は手元で動かせない）
    let gapTries = null, hitKeep = null;
    if (gapMax > GAP_MAX) { gapTries = []; const keep = gapMax;
      hitKeep = hitStat; hitStat = null;   // 試した直しの間の当たり判定は数えない
      const gapParts = async () => { paintLog = []; await rectsOf(page, '#boardCards .card:not(.back):not(.slot)', 3); await rectsOf(page, '#potChips', 1); await rectsOf(page, '.felt .spot .mystack', 2); const r = paintLog; paintLog = null; return r };
      const base = await gapParts();   // 直しを入れる前の描かれた場所（直しで絵まで動いたら、見た目が変わる直し）
      for (const [name, css] of GAP_TRIES) {
        await page.evaluate(c => { const st = document.createElement('style'); st.id = 'sharpTry'; st.textContent = c; document.head.appendChild(st) }, css);
        await page.waitForTimeout(400); gapMax = 0;
        const now = await gapParts();   // 元の測定と同じ部品（CodeRabbit PR #119）
        // 直す前か後で見つからなかった部品があれば、動きは測れない（0px と出すと「見た目が変わらない」に見える。CodeRabbit PR #121）
        let moved = 0, incomplete = base.length !== now.length;
        base.forEach((a, i) => { const c = now[i]; if (!a || !c) { incomplete = true; return } moved = Math.max(moved, Math.abs(a.x - c.x), Math.abs(a.y - c.y), Math.abs(a.width - c.width), Math.abs(a.height - c.height)) });
        gapTries.push(`${name} ${Math.round(gapMax)}px（絵の動き ${incomplete ? '測れない' : Math.round(moved) + 'px'}）`);
        await page.evaluate(() => document.getElementById('sharpTry').remove());
      }
      gapMax = keep; await page.waitForTimeout(300) }
    const hit = hitKeep || hitStat; hitStat = null;
    return { own, board, boardN, chips, ownChips, seatChips, face0, face1, seat, tries, gap: gapMax, gapTries, hit };   // 判定は丸めない値で（CodeRabbit PR #119）。表示だけ丸める
  } finally { await ctx.close() }
}

async function run({ browser, file, dir }) {
  const items = [];
  // WebKit の PC（Mac の Safari）は、卓の外の顔も 1.35〜1.49 と全体に柔らかく、卓の CSS をどう変えても値が変わらなかった（2026-10-19 #109）。
  // 直す手が無いので ⚠️ にとどめる。iPhone（WebKit のスマホ縦）と Chromium は ❌ のまま
  const soft = vp => process.env.QA_BROWSER === 'webkit' && vp.key === 'PC_2倍';
  const st = (vp, s) => s === 'fail' && soft(vp) ? 'warn' : s;
  for (const vp of VPS) {
    let r;
    try { r = await shoot(browser, file, vp, dir) } catch (e) { items.push({ id: `sharp:${vp.key}`, title: `画質を測れた（${vp.key}）`, status: 'fail', detail: String(e.message).slice(0, 120) }); continue }
    // フロップなので、場札3枚とポットのチップは必ずある。測れなければ ❌（見逃しを防ぐ。CodeRabbit PR #106）
    const ref = `（くらべ：自分の手札 ${r2(r.own)}、自分のチップ ${r2(r.ownChips)}、相手のチップ ${r2(r.seatChips)}）`;
    const miss = [r.boardN < 3 && `場札が ${r.boardN} 枚しか測れなかった（3枚のはず）`, r.chips == null && 'ポットのチップが見つからなかった'].filter(Boolean).join('、');   // 足りないものは全部出す（CodeRabbit PR #106）
    const why = miss || (bad(r.board) || bad(r.chips) ? '。ぼやけている：ブラウザが低い解像度で描いて引き伸ばしている（3D で倒した卓、preserve-3d、拡大など）' : '');
    items.push({ id: `sharp:table:${vp.key}`, title: `卓の上の札・チップがくっきり描けている（${vp.key}、細かさ ${QMIN} 以上）`, status: miss ? 'fail' : st(vp, why ? 'fail' : 'ok'),   // 測れないときは WebKit の PC でも ❌
      detail: `場札 ${r2(r.board)}（${r.boardN}枚）、ポットのチップ ${r2(r.chips)} ${ref}${why && !why.startsWith('。') ? '：' : ''}${why}${r.tries ? `（試した直し：${r.tries.join('、')}）` : ''}${why && !miss && soft(vp) ? '（Mac の Safari は全体に柔らかく、直す手が無いので ⚠️）' : ''}` });
    // 卓の中の部品が、getBoundingClientRect の場所に描かれているか（v0.97.4 レビュー：WebKit で最大 81px ずれ、場所の数字で場札をよける処理がすべて外れた）。
    // 色を塗って探した本当の場所とのずれが GAP_MAX を超えたら ❌（どのブラウザでも。前は表示だけだった）
    items.push({ id: `sharp:gap:${vp.key}`, title: `卓の中の部品が、測った場所に描かれている（${vp.key}、ずれ ${GAP_MAX}px 以下）`, status: r.gap > GAP_MAX ? 'fail' : 'ok',
      detail: `ずれ 最大 ${Math.round(r.gap)}px${r.hit && r.hit.n ? `、当たり判定が部品に当たる：描かれた場所 ${r.hit.p}/${r.hit.n}・測った場所 ${r.hit.g}/${r.hit.n}` : ''}${r.gapTries ? `（試した直し：${r.gapTries.join('、')}）` : ''}` });
    // 顔は柔らかい絵（グラデーション）なので、場札より低い目安（ZMIN）で見る。寄る前の値は表示だけ
    items.push({ id: `sharp:zoom:${vp.key}`, title: `顔のアップでもくっきりしている（${vp.key}、細かさ ${ZMIN} 以上）`, status: r.face1 == null ? 'fail' : st(vp, r.face1 < ZMIN ? 'fail' : 'ok'),
      detail: r.face1 == null ? `顔かカメラが見つからなかった（席 ${r.seat}）` : `寄る前 ${r2(r.face0)} → 寄ったあと ${r2(r.face1)}` });
  }
  return { name: '画質（高精細の画面でくっきりしているか）', items };
}
module.exports = { run, VPS, QMIN, ZMIN, GAP_MAX };
