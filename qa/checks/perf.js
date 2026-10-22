// 重さ・速さ：安いスマホ相当（CPU 4倍遅く）で、起動の時間・打っている間の引っかかり・長く遊んだあとのメモリ（レビューの仕組み 案1、2026-10-10）
//   数字は前の版の基準（baseline.json の perf）と比べる。悪くなったら ⚠️（公開は止めない）
'use strict';
const fs = require('fs');
const H = require('../lib/harness');

const SLOW = 4;

async function cdp(page, rate = SLOW) { const c = await page.context().newCDPSession(page); await c.send('Emulation.setCPUThrottlingRate', { rate }); await c.send('Performance.enable'); return c }
async function heapMB(c) { try { await c.send('HeapProfiler.collectGarbage') } catch (e) {} const m = (await c.send('Performance.getMetrics')).metrics; return Math.round((m.find(x => x.name === 'JSHeapUsedSize') || {}).value / 1e5) / 10 }

async function run({ browser, file, quick, baseline, outDir }) {
  const items = [], out = {};
  out.sizeKB = Math.round(fs.statSync(file).size / 1024);
  // 1. 起動：本物の速さ（早回しなし）、動きあり。タイトルの3ボタンが出るまで
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
    await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    const page = await ctx.newPage();
    try {
      const c = await cdp(page);
      const t0 = Date.now();
      await page.goto('file://' + require('path').resolve(file), { waitUntil: 'load' });
      out.loadMs = Date.now() - t0;
      await page.waitForFunction(() => { const t = document.getElementById('title'); return t && !t.hidden && t.offsetParent !== null }, null, { timeout: 30000 }).catch(() => {});
      out.titleMs = Date.now() - t0;
      out.heapLoadMB = await heapMB(c);
    } finally { await ctx.close() }
  }
  // 2. 打っている間（長い版だけ）：フリー6人を早回しで打ち、50ms以上の引っかかりを数える。最初の10ハンド後と最後でメモリを比べる
  //    早回しで待ち時間が縮むので、回数は「前の版と比べる」ための数字（本物の遊びの回数ではない）
  const hands = 120;
  if (!quick) {
    const { ctx, page } = await H.openGame(browser, file, { fast: 25 });
    try {
      const c = await cdp(page, 1);
      await page.evaluate(() => { window.__lt = []; try { new PerformanceObserver(l => l.getEntries().forEach(e => __lt.push(e.duration))).observe({ type: 'longtask', buffered: false }) } catch (e) {} });
      await page.evaluate(`($('freeSize').value='6',$('freeRule').value='',startFree())`);
      await H.startBot(page, { policy: 'mix', maxHands: 10 });
      await H.runUntilDone(page, { timeoutMs: 240000, stallMs: 40000 });
      out.heap10MB = await heapMB(c);
      const lt0 = await page.evaluate(() => __lt.length);
      let played = await page.evaluate(() => __bot.hands);
      const t0 = Date.now();
      while (played < hands && Date.now() - t0 < 600000) {
        await page.evaluate(n => { if (__bot.result && __bot.result !== 'limit') { __bot.restart(); try { show('title') } catch (e) {} ($('freeSize').value = '6', $('freeRule').value = '', startFree()) } else __bot.done = false; __bot.maxHands = n }, hands);
        const r = await H.runUntilDone(page, { timeoutMs: 600000, stallMs: 40000 });
        played = await page.evaluate(() => __bot.hands);
        if (r.status !== 'done') break;
      }
      const lt = await page.evaluate(k => __lt.slice(k), lt0);
      out.hands = played; out.heapEndMB = await heapMB(c);
      out.longPerHand = Math.round(lt.length / Math.max(1, played - 10) * 10) / 10;
      out.longMsPerHand = Math.round(lt.reduce((a, d) => a + d, 0) / Math.max(1, played - 10));   // 1ハンドあたり止まっていた時間の合計（v89 レビュー）
      out.longMaxMs = Math.round(Math.max(0, ...lt));
      out.errors = await page.evaluate(() => __qa.errors.slice(0, 3));
    } finally { await ctx.close() }
  }
  // 3. 動きの見張り（LT.sweep、250ms ごとに画面の動きを全部見る）の重さ（v0.97.4 レビュー）：CPU 4倍遅くで自動対戦しながら、1回の時間を測る。平均 2ms 超で ⚠️
  {
    const { ctx, page } = await H.openGame(browser, file, { fast: 20 });
    try {
      await cdp(page);
      await page.evaluate(() => { window.__sw = []; const f = LT.sweep; LT.sweep = function () { try { if (performance.now() - (this._swAt || 0) >= 240) document.getAnimations() } catch (e) {} const t = performance.now(), at = this._swAt; const r = f.apply(this, arguments); if (this._swAt !== at) __sw.push(performance.now() - t); return r } });   // 間引いた回は数えない。先にスタイルの計算を済ませておく（v0.97.7：前は getComputedStyle(根元) で済ませていたが、それは根元の分しか計算しないので、画面全体の計算が見張りの重さに入っていた。同じ getAnimations を先に呼んで済ませる。getAnimations はたまった計算を先に行い、それは次のコマでも要る分なので、見張りの重さに入れない）
      await page.evaluate(`($('freeSize').value='6',$('freeRule').value='',startFree())`);
      await H.startBot(page, { policy: 'mix', maxHands: quick ? 4 : 10 });
      await H.runUntilDone(page, { timeoutMs: 180000, stallMs: 40000 });
      const sw = await page.evaluate(() => __sw);
      out.sweepN = sw.length; out.sweepAvgMs = sw.length ? Math.round(sw.reduce((a, x) => a + x, 0) / sw.length * 100) / 100 : null; out.sweepMaxMs = sw.length ? Math.round(Math.max(...sw) * 10) / 10 : null;
    } catch (e) { out.sweepErr = String(e.message || e).slice(0, 100) } finally { await ctx.close() }
  }
  // 4. PC の光と煙（v0.98.1、PC 向けリッチ演出 案2、js/53_pc_air.js）：PC で canvas が卓の上に出て、押せない・1コマ 2ms 以内（真ん中の値）。スマホ幅では出ない
  {
    const { ctx, page } = await H.openGame(browser, file, { fast: 20, lite: false, settings: { motion: 'full' } });
    try {   // CPU を遅くしない（CI の canvas は GPU なしで描くので、遅くすると実機より何倍も重く出る）。最初の1コマ（絵の準備）を除いた真ん中の値で見る
      await page.evaluate(`($('freeSize').value='6',$('freeRule').value='',startFree())`);
      await H.startBot(page, { policy: 'mix', maxHands: 2 });
      await page.waitForTimeout(3000);
      const f0 = await page.evaluate(() => typeof PCAIR !== 'undefined' ? PCAIR.frames : 0); await page.waitForTimeout(1500);   // 測っている間にコマが進んでいるか（1コマ描いて止まったのを見のがさない。CodeRabbit PR #132）
      out.air = await page.evaluate(() => { const c = document.getElementById('pcAir'), r = c && c.getBoundingClientRect(), t = document.getElementById('table').getBoundingClientRect();
        return { has: !!c, pcw: document.documentElement.classList.contains('pcw'), on: typeof PCAIR !== 'undefined' && PCAIR.on, frames: typeof PCAIR !== 'undefined' ? PCAIR.frames : 0, ms: typeof PCAIR !== 'undefined' && PCAIR.hist && PCAIR.hist.length > 1 ? (h => Math.round(h[h.length >> 1] * 100) / 100)(PCAIR.hist.slice(1).sort((a, b) => a - b)) : null,
          face: (() => { try { const fw = c && c.parentNode && c.parentNode.querySelector('.felt-wrap'); if (!c || !fw) return 'no-top'; const cr = c.getBoundingClientRect(), fr = fw.getBoundingClientRect(); if (!(cr.height > 0)) return 'no-top'; const top = Math.floor((fr.top - cr.top) / cr.height * c.height) - 1; if (!(top > 0)) return 'no-top'; const d = c.getContext('2d').getImageData(0, 0, c.width, top).data; let m = 0; for (let i = 3; i < d.length; i += 4) m = Math.max(m, d[i]); return m } catch (e) { return 'err' } })(),
          painted: (() => { try { const fw = c && c.parentNode && c.parentNode.querySelector('.felt-wrap'); if (!c || !fw) return 0; const cr = c.getBoundingClientRect(), fr = fw.getBoundingClientRect(); const y0 = Math.max(0, Math.ceil((fr.top - cr.top) / cr.height * c.height)); if (!(c.height - y0 > 0)) return 0; const d = c.getContext('2d').getImageData(0, y0, c.width, c.height - y0).data; let m = 0; for (let i = 3; i < d.length; i += 4) m = Math.max(m, d[i]); return m } catch (e) { return 0 } })(),   // 卓の所に実際に描いているか（透明な canvas で通さない。CodeRabbit #132）
          shown: !!(c && r.width > 0 && (s => s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0)(getComputedStyle(c))), errors: __qa.errors.slice(0, 3), pe: c ? getComputedStyle(c).pointerEvents : null, cover: r ? Math.round(r.width * r.height / (t.width * t.height) * 100) : 0 } });
      await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(600);
      out.air.moved = out.air.frames - f0;
      out.air.mobileShown = await page.evaluate(() => { const c = document.getElementById('pcAir'); return !!(c && c.getBoundingClientRect().width > 0 && getComputedStyle(c).display !== 'none') });
    } catch (e) { out.airErr = String(e.message || e).slice(0, 100) } finally { await ctx.close() }
  }
  // 5. PC のディーラーの手（v0.98.4、PC 向けリッチ演出 案3、js/55_pc_hand.js）：配る・燃やし札・場札・ポットの押し出しで手が出る。顔（卓の板より上）には描かない。押せない。
  //    スマホ幅・動きを減らす設定では描かない。
  //    CI の画面は自動対戦の間ほとんどコマが進まない（手元で 3秒に 9コマ）ので、短い動き（配る 0.4秒など）を自動対戦の中で待って見ると、出ていても見のがす。
  //    そこで、フロップまで打って止め、動きの状態（S.ltDealAt・S.ltBoardAt・.llburn・.potmove）を1つずつ作って、手の絵を直接描かせて canvas を読む。
  //    ポットの押し出しは、卓の板の上端より上へ飛ぶ形も作る（手が顔の所へ出ないか＝描く所を切っているか）
  {
    const { ctx, page } = await H.openGame(browser, file, { fast: 20, lite: false, settings: { motion: 'full' } });
    try {
      await page.evaluate(`($('freeSize').value='6',$('freeRule').value='',startFree())`);
      await H.startBot(page, { policy: 'call', maxHands: 3 });
      const t0 = Date.now(); while (Date.now() - t0 < 40000 && !(await page.evaluate(() => S && S.board && S.board.length >= 3 && !S.handOver))) await page.waitForTimeout(30);
      await page.evaluate(() => clearInterval(__bot.timer)); await page.waitForTimeout(400);
      out.hand = await page.evaluate(() => {
        if (typeof PCHAND === 'undefined' || typeof pcHandFrame !== 'function') return { defined: false };
        pcHandSync(); const c = PCHAND.cv, res = {}, tb = document.getElementById('table');
        // 顔の所の境目は PCHAND.top（描く側の値）でなく、卓の板（.felt-wrap）の上端を画面から読む（描く側の計算がずれても見のがさない。PR #136 CodeRabbit）
        const read = () => { const g = c.getContext('2d'), cr = c.getBoundingClientRect(), fw = c.parentNode && c.parentNode.querySelector('.felt-wrap'), fr = fw && fw.getBoundingClientRect();
          if (!fr || !(cr.height > 0)) throw new Error('卓の板の上端が読めない');
          const top = Math.max(0, Math.min(c.height, Math.ceil((fr.top - cr.top) / cr.height * c.height))); let face = 0, low = 0;
          if (top > 0) { const d = g.getImageData(0, 0, c.width, top).data; for (let i = 3; i < d.length; i += 4) face = Math.max(face, d[i]) } else face = 255;
          if (top < c.height) { const d2 = g.getImageData(0, top, c.width, c.height - top).data; for (let i = 3; i < d2.length; i += 4) low = Math.max(low, d2[i]) }
          // 腕が相手の伏せ札・名札の上を通らないか（v0.98.4 レビュー：押し出しの腕がタロウの伏せ札の真上から下りた）。札と名札の中の 3×3 点の濃さの最大
          const cr2 = c.getBoundingClientRect(), kx = c.width / cr2.width, ky = c.height / cr2.height; let over = 0, overAt = '';
          for (const e of document.querySelectorAll('#felt .spot .hand .card:not(.slot), #plates .plate')) { if (!e.getClientRects().length) continue; const r = e.getBoundingClientRect(); if (!(r.width > 2)) continue;
            for (let a = 1; a <= 3; a++) for (let b = 1; b <= 3; b++) { const x = Math.round((r.left + r.width * a / 4 - cr2.left) * kx), y = Math.round((r.top + r.height * b / 4 - cr2.top) * ky); if (x < 0 || y < 0 || x >= c.width || y >= c.height) continue;
              const v = g.getImageData(x, y, 1, 1).data[3]; if (v > over) { over = v; overAt = (e.closest('.spot') || e).id } } }
          return { face, low, kind: PCHAND.kind, over, overAt, root: PCHAND.root ? PCHAND.root.map(Math.round) : null } };
        const run = (name, set, undo) => { const keep = { a: S.ltDealAt, o: S.ltOrder, b: S.ltBoardAt, f: S.ltBoardFrom }; PCHAND.h1 = PCHAND.h2 = null; let el = null;
          try { el = set(); for (let i = 0; i < 12; i++) pcHandFrame(performance.now()); res[name] = read() } catch (e) { res[name] = { err: String(e.message).slice(0, 80) } }
          try { if (el) el.remove(); if (undo) undo() } catch (e) {} S.ltDealAt = keep.a; S.ltOrder = keep.o; S.ltBoardAt = keep.b; S.ltBoardFrom = keep.f; for (let i = 0; i < 20; i++) pcHandFrame(performance.now()) };
        const mid = e => { const r = e.getBoundingClientRect(), t = tb.getBoundingClientRect(); return [r.left - t.left + r.width / 2, r.top - t.top + r.height / 2] };
        const fake = (cls, parent, x, y) => { const e = document.createElement('div'); e.className = cls; e.style.cssText = `position:absolute;left:${x - 30}px;top:${y - 15}px;width:60px;height:30px`; parent.appendChild(e); return e };
        run('deal', () => { S.ltOrder = ltDealOrder(); S.ltDealAt = performance.now() - 10 });
        run('board', () => { S.ltDealAt = 0; S.ltBoardFrom = 0; S.ltBoardAt = performance.now() - 10 });
        run('burn', () => { S.ltDealAt = S.ltBoardAt = 0; const dk = document.querySelector('.felt .lltools .ddeck'), p = dk ? mid(dk) : mid(document.getElementById('boardCards')); return fake('llburn', fxLayer(), p[0], p[1]) });
        run('push', () => { S.ltDealAt = S.ltBoardAt = 0; const p = mid(document.getElementById('potChips')); return fake('potmove', tb, p[0], p[1]) });
        // 卓の板の上端のすぐ上へ飛ぶチップ（顔の所）：手はそこへ出ても、上端より上には描かない
        run('pushTop', () => { S.ltDealAt = S.ltBoardAt = 0; const fw = c.parentNode.querySelector('.felt-wrap').getBoundingClientRect(), t = tb.getBoundingClientRect(); return fake('potmove', tb, t.width / 2, fw.top - t.top - 20) });
        return { defined: true, res, pe: getComputedStyle(c).pointerEvents, shown: getComputedStyle(c).display !== 'none', ms: PCHAND.hist.length > 1 ? (h => Math.round(h[h.length >> 1] * 100) / 100)(PCHAND.hist.slice().sort((a, b) => a - b)) : null, seenLive: PCHAND.seen, errors: __qa.errors.slice(0, 3) } });
      // 出ている瞬間を1枚残す（CI の画面の一覧には写らない。v0.98.4 レビュー）：ポットを押し出す手
      if (outDir && out.hand && out.hand.defined) try {
        await page.evaluate(() => { const tb = document.getElementById('table'), pc = document.getElementById('potChips'), r = pc.getBoundingClientRect(), t = tb.getBoundingClientRect(), e = document.createElement('div');
          e.className = 'potmove'; e.id = 'qaPm'; e.style.cssText = `position:absolute;left:${r.left - t.left + r.width / 2 - 30}px;top:${r.top - t.top + r.height / 2 - 15}px;width:60px;height:30px`; tb.appendChild(e);
          PCHAND.h1 = PCHAND.h2 = null; for (let i = 0; i < 12; i++) pcHandFrame(performance.now()) });
        const d = require('path').join(outDir, 'ui'); fs.mkdirSync(d, { recursive: true });
        await page.locator('#table').screenshot({ path: require('path').join(d, '演出_ディーラーの手_PC.jpg'), type: 'jpeg', quality: 70 });
        out.hand.shot = 'ui/演出_ディーラーの手_PC.jpg';
        await page.evaluate(() => { const e = document.getElementById('qaPm'); if (e) e.remove(); for (let i = 0; i < 20; i++) pcHandFrame(performance.now()) });
      } catch (e) { out.hand.shotErr = String(e.message || e).slice(0, 80) }
      await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(600);
      out.hand.mobileShown = await page.evaluate(() => { const c = document.getElementById('pcHand'); return !!(c && c.getBoundingClientRect().width > 0 && getComputedStyle(c).display !== 'none') });
    } catch (e) { out.handErr = String(e.message || e).slice(0, 100) } finally { await ctx.close() }
    // 動きを減らす設定（prefers-reduced-motion）：1ハンド打っても1コマも描かない
    const r2 = await H.openGame(browser, file, { fast: 20 });
    try { await r2.page.evaluate(`($('freeSize').value='6',$('freeRule').value='',startFree())`); await H.startBot(r2.page, { policy: 'call', maxHands: 1 }); await H.runUntilDone(r2.page, { timeoutMs: 60000, stallMs: 30000 });
      out.handLite = await r2.page.evaluate(() => typeof PCHAND !== 'undefined' ? PCHAND.frames : -1);
      // 場札をめくっている途中で動きを減らす設定になっても、めくりの印（S.ltBoardAt）を残さない（残ると PC の手が空回りした。PR #136）
      out.boardRm = await r2.page.evaluate(() => { if (!reducedMotion()) return 'rm-off'; S.ltBoardFrom = 0; S.ltBoardAt = performance.now() - 10; ltBoardAnim(); const v = S.ltBoardAt; S.ltBoardAt = 0; return v === 0 ? 'cleared' : 'left' }) } catch (e) { out.handLite = 'err' } finally { await r2.ctx.close() }
  }
  // 6. PC の大勝負の間（v0.98.5、PC 向けリッチ演出 案4、js/56_pc_big.js）：オールインがコールされた（S.runout）とき部屋を暗くし、勝負している相手の顔だけ明るく残す。
  //    フロップまで打って止め、S.runout を立てて描き直させる（入口から入る）。降りた相手の顔は暗い・残っている相手の顔は明るい・第7章の最後の手では出ない・
  //    最後の札は 1.2秒まででゆっくり（ふだんは今と同じ）・スマホ幅では出ない・動きを減らす設定ではゆっくりめくらない
  {
    const { ctx, page } = await H.openGame(browser, file, { fast: 20, lite: false, settings: { motion: 'full' } });
    try {
      await page.evaluate(`($('freeSize').value='6',$('freeRule').value='',startFree())`);
      await H.startBot(page, { policy: 'call', maxHands: 4 });
      const t0 = Date.now(); while (Date.now() - t0 < 40000 && !(await page.evaluate(() => S && S.board && S.board.length >= 3 && !S.handOver && S.players.filter(inHand).length >= 2 && S.players.some((p, i) => i > 0 && !inHand(p) && !p.out)))) await page.waitForTimeout(30);
      await page.evaluate(() => clearInterval(__bot.timer)); await page.waitForTimeout(300);
      out.big = await page.evaluate(async () => {
        if (typeof PCBIG === 'undefined' || typeof ltBoardDur !== 'function') return { defined: false };
        const r = { defined: true }, ru = S.runout; S.runout = true; render(); r.on = PCBIG.hno === S.handNo;
        await new Promise(f => setTimeout(f, 900));
        const c = document.getElementById('pcBig'); r.shown = !!(c && c.classList.contains('on') && getComputedStyle(c).display !== 'none' && getComputedStyle(c).visibility !== 'hidden'); r.op = c ? +getComputedStyle(c).opacity : null; r.pe = c ? getComputedStyle(c).pointerEvents : null;
        // 濃さ（opacity）は .7秒でふわっと変わる途中なので、印と表示で見る。暗さそのものは下の画素で見る
        // 顔の真ん中で見る（faceBox：上半身は translateX(-50%) で置いてあり、真ん中が offsetLeft）
        const at = i => { const f = typeof faceBox === 'function' ? faceBox(i) : null; if (!f || !c) return null; const x = Math.round((f.l + f.r) / 2), y = Math.round((f.t + f.b) / 2); return c.getContext('2d').getImageData(x, y, 1, 1).data[3] };
        r.lit = S.players.map((p, i) => i).filter(i => i > 0 && inHand(S.players[i])).map(at); r.dark = S.players.map((p, i) => i).filter(i => i > 0 && !inHand(S.players[i]) && !S.players[i].out).map(at);
        { const cw = document.querySelector('#table .ltcrowd.cr-big'); r.crowdBig = !!cw;   // 人数も見る（ふつうは5人、端に寄せる cr-edge は2人。CodeRabbit PR #138）
          r.crowdN = cw ? [...cw.querySelectorAll('i')].filter(e => e.getClientRects().length && getComputedStyle(e).display !== 'none').length : 0; r.crowdWant = cw && cw.classList.contains('cr-edge') ? 2 : 5 }
        S.ltBoardSlow = true; r.slow = Math.round(ltBoardDur(4)); S.ltBoardSlow = false; r.norm = Math.round(ltBoardDur(4)); r.normWant = Math.round(520 * SPEED()); r.river = LT.pcBigRiver();
        // オールインでないリバー：ポット 30BB 未満は出さない・30BB 以上は出す（CodeRabbit PR #138）
        { const ru0 = S.runout, h0 = PCBIG.hno, tt = S.players.map(p => p.total), set = v => { S.players.forEach(p => p.total = 0); S.players[0].total = v };
          S.runout = false; PCBIG.hno = -1; set(Math.floor(PCBIG.BB * BB() * .5)); r.riverLow = LT.pcBigRiver(); set(PCBIG.BB * BB() + BB()); r.riverHigh = LT.pcBigRiver();
          S.players.forEach((p, i) => p.total = tt[i]); S.runout = ru0; PCBIG.hno = h0 }
        const ch = CFG.ch, fh = S.finalHand; CFG.ch = Object.assign({}, ch || {}, { no: 7, p2: 0 }); S.finalHand = true; r.ch7 = pcBigOk(); CFG.ch = ch; S.finalHand = fh;
        S.runout = ru; r.errors = __qa.errors.slice(0, 3); return r });
      // ふわっと出る濃さは、ページの外（本当の時間）で 1.2秒待ってから読む（ページの中の時計は検査で速めてあり、900ms が 45ms になっていた。CodeRabbit PR #138）
      await page.waitForTimeout(1200); out.big.op = await page.evaluate(() => { const c = document.getElementById('pcBig'); return c ? Math.round(+getComputedStyle(c).opacity * 100) / 100 : null });
      await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(600);
      out.big.mobileShown = await page.evaluate(() => { const c = document.getElementById('pcBig'); return !!(c && c.getBoundingClientRect().width > 0 && getComputedStyle(c).display !== 'none' && c.classList.contains('on')) });
      // 同じハンドで PC の幅に戻したら、また出る（CodeRabbit PR #138：PC の外へ出て戻ると出なくなっていた）
      await page.setViewportSize({ width: 1280, height: 800 }); await page.waitForTimeout(600);
      out.big.backShown = await page.evaluate(() => { if (S.handOver) return 'over'; S.runout = true; render(); const c = document.getElementById('pcBig'); return !!(c && getComputedStyle(c).display !== 'none' && c.classList.contains('on')) });
    } catch (e) { out.bigErr = String(e.message || e).slice(0, 100) } finally { await ctx.close() }
    const r2 = await H.openGame(browser, file, { fast: 20 });
    // 動きを減らす設定：暗くするのは出る（ふわっとせずに切り替え）・ゆっくりめくりはしない（CodeRabbit PR #138）
    try { await r2.page.evaluate(`($('freeSize').value='6',$('freeRule').value='',startFree())`); await H.startBot(r2.page, { policy: 'call', maxHands: 2 });
      { const t0 = Date.now(); while (Date.now() - t0 < 40000 && !(await r2.page.evaluate(() => S && S.players && S.handNo >= 1 && !S.handOver && S.board && S.board.length >= 3))) await r2.page.waitForTimeout(30) }
      await r2.page.evaluate(() => clearInterval(__bot.timer));   // ハンドの途中で見る（始まる前は S.handOver で何もしない）
      const v = await r2.page.evaluate(() => { if (typeof LT.pcBigRiver !== 'function') return { river: 'none', shown: false }; S.runout = true; render(); const c = document.getElementById('pcBig');
        return { river: LT.pcBigRiver(), shown: !!(c && c.classList.contains('on') && c.classList.contains('still') && getComputedStyle(c).display !== 'none') } }); out.bigLite = v.river; out.bigLiteShown = v.shown } catch (e) { out.bigLite = 'err' } finally { await r2.ctx.close() }
  }
  const b = (baseline && baseline.perf) || {};
  const worse = (k, f = 1.3, add = 0) => b[k] != null && out[k] > b[k] * f + add;
  const vs = k => b[k] != null ? `（前の版 ${b[k]}）` : '';
  items.push({ id: 'perf:load', title: `起動の速さ（CPU ${SLOW}倍遅く、スマホ縦）`, status: worse('titleMs', 1.3, 300) || out.titleMs > 5000 ? 'warn' : 'ok',
    detail: `ファイル ${out.sizeKB}KB${vs('sizeKB')}、読み込み ${out.loadMs}ms、タイトルが出るまで ${out.titleMs}ms${vs('titleMs')}（目安 5000ms 以内）、メモリ ${out.heapLoadMB}MB` });
  items.push({ id: 'perf:sweep', title: `動きの見張り（LT.sweep）1回の重さ（CPU ${SLOW}倍遅く、自動対戦中、平均 2ms 以下、スタイルの計算は除く）`, status: out.sweepErr || !out.sweepN ? 'fail' : out.sweepAvgMs > 2 ? 'warn' : 'ok',
    detail: out.sweepErr ? '測れなかった：' + out.sweepErr : !out.sweepN ? '一度も動かなかった（LT.sweep が無いか、呼ばれていない）' : `平均 ${out.sweepAvgMs}ms、一番長い ${out.sweepMaxMs}ms（${out.sweepN}回）` });
  { const a = out.air || {}, bad = out.airErr || !a.pcw || !a.has || !a.shown || a.pe !== 'none' || !(a.moved > 0) || a.ms == null || a.mobileShown || a.face !== 0 || !a.on || !(a.painted > 0) || (a.errors || []).length;
    items.push({ id: 'perf:pcair', title: 'PC の光と煙：卓の上に出て押せない・顔（卓の板より上）には描かない・1コマ 2ms 以下（真ん中の値）・スマホ幅では出ない', status: bad ? 'fail' : a.ms > 2 ? 'warn' : 'ok',
      detail: out.airErr ? '測れなかった：' + out.airErr : `PC の印 ${a.pcw ? 'あり' : 'なし'}、絵 ${a.has ? (a.shown ? '出ている' : '隠れている') : '無い'}（卓の ${a.cover}%）、押せない ${a.pe === 'none' ? 'はい' : 'いいえ（' + a.pe + '）'}、描いたコマ ${a.frames}（測った 1.5秒で +${a.moved}）、1コマ 真ん中 ${a.ms}ms、スマホ幅で ${a.mobileShown ? '出てしまう' : '出ない'}、顔の所 ${a.face === 0 ? '透明' : '描いている（' + a.face + '）'}、卓の所 ${a.painted > 0 ? '描いている' : '透明（描いていない）'}、動いている ${a.on ? 'はい' : 'いいえ（止まった）'}${(a.errors || []).length ? '、エラー ' + a.errors.join(' / ') : ''}` }) }
  { const a = out.hand || {}, R = a.res || {}, K = ['deal', 'board', 'burn', 'push'], overs = Object.entries(a.res || {}).filter(([k, v]) => v.over > 24).map(([k, v]) => `${k}（${v.overAt} ${v.over}）`), rootsAll = Object.values(a.res || {}).map(v => v.root), roots = rootsAll.filter(Boolean), rootOk = roots.length >= 4 && roots.length === rootsAll.length && roots.every(r => Math.abs(r[0] - roots[0][0]) <= 3 && Math.abs(r[1] - roots[0][1]) <= 3), miss = K.filter(k => !(R[k] && R[k].low > 0 && R[k].kind === k)), face = Object.entries(R).filter(([k, v]) => v.face > 0).map(([k]) => k), errs = Object.entries(R).filter(([k, v]) => v.err).map(([k, v]) => `${k}: ${v.err}`);
    const bad = out.handErr || !a.defined || !a.shown || a.pe !== 'none' || miss.length || face.length || errs.length || !(R.pushTop && R.pushTop.kind === 'push') || a.mobileShown || out.handLite !== 0 || out.boardRm !== 'cleared' || overs.length || !rootOk || (a.errors || []).length;
    items.push({ id: 'perf:pchand', title: 'PC のディーラーの手：配る・燃やし札・場札・ポットの押し出しで出る・顔（卓の板より上）には描かない・押せない・スマホ幅と動きを減らす設定では描かない', shot: a.shot, status: bad ? 'fail' : a.ms > 2 ? 'warn' : 'ok',
      detail: out.handErr ? '測れなかった：' + out.handErr : !a.defined ? 'ディーラーの手（PCHAND・pcHandFrame）が無い版' : `${K.map(k => `${k} ${R[k] && R[k].low > 0 && R[k].kind === k ? '出た' : '出ない（' + ((R[k] || {}).kind || '何もしていない') + '）'}`).join('・')}、顔の所 ${face.length ? '描いている（' + face.join('・') + '）' : '透明（上端の上へ飛ぶチップでも）'}、押せない ${a.pe === 'none' ? 'はい' : 'いいえ（' + a.pe + '）'}、1コマ 真ん中 ${a.ms}ms、スマホ幅で ${a.mobileShown ? '出てしまう' : '出ない'}、動きを減らす設定で描いたコマ ${out.handLite}・めくりの印 ${out.boardRm === 'cleared' ? '消えた' : '残った（' + out.boardRm + '）'}、相手の札・名札の上 ${overs.length ? '通った（' + overs.join('・') + '）' : '通らない'}、腕の根元 ${rootOk ? '毎回同じ所' : 'ばらばら（' + roots.map(r => r.join(',')).join(' / ') + '）'}、自動対戦の中で出た ${Object.entries(a.seenLive || {}).map(([k, v]) => `${k} ${v}コマ`).join('・') || 'なし'}（参考：CI はコマが少ない）${errs.length ? '、エラー ' + errs.join(' / ') : ''}${(a.errors || []).length ? '、エラー ' + a.errors.join(' / ') : ''}` }) }
  { const a = out.big || {}, litBad = (a.lit || []).filter(v => v == null || v > 60), darkBad = (a.dark || []).filter(v => v == null || v < 100);
    const bad = out.bigErr || !a.defined || !a.on || !a.shown || !(a.op > .5) || a.pe !== 'none' || !(a.lit || []).length || !(a.dark || []).length || litBad.length || darkBad.length || !a.crowdBig || a.crowdN !== a.crowdWant || a.riverLow !== false || a.riverHigh !== true || !out.bigLiteShown || a.backShown !== true || !(a.slow > a.norm && a.slow <= 1200) || a.norm !== a.normWant || !a.river || a.ch7 !== false || a.mobileShown || out.bigLite !== false || (a.errors || []).length;
    items.push({ id: 'perf:pcbig', title: 'PC の大勝負の間：オールインで部屋が暗くなり、勝負している相手の顔は明るいまま・降りた相手は暗い・人だかりが大きい・最後の札は 1.2秒まで・第7章の最後の手とスマホ幅と動きを減らす設定では出ない', status: bad ? 'fail' : 'ok',
      detail: out.bigErr ? '測れなかった：' + out.bigErr : !a.defined ? '大勝負の間（PCBIG・ltBoardDur）が無い版' : `オールインで ${a.on ? '始まった' : '始まらない'}・${a.shown ? '暗い' : '暗くならない'}（濃さ ${a.op}）、残っている相手の顔の暗さ ${(a.lit || []).join('・') || 'なし'}（60 以下）、降りた相手 ${(a.dark || []).join('・') || 'なし'}（100 以上）、人だかり ${a.crowdBig ? '大きい' : 'ふつう'}（${a.crowdN}人／${a.crowdWant}人）、オールインでないリバー 30BB 未満で ${a.riverLow === false ? '出ない' : '出る'}・30BB 以上で ${a.riverHigh === true ? '出る' : '出ない'}、最後の札 ゆっくり ${a.slow}ms／ふだん ${a.norm}ms（今まで ${a.normWant}ms）、押せない ${a.pe === 'none' ? 'はい' : 'いいえ（' + a.pe + '）'}、第7章の最後の手で ${a.ch7 === false ? '出ない' : '出る'}、スマホ幅で ${a.mobileShown ? '出る' : '出ない'}、動きを減らす設定でゆっくりめくり ${out.bigLite === false ? 'しない' : 'する（' + out.bigLite + '）'}・暗くするのは ${out.bigLiteShown ? '出る（切り替えだけ）' : '出ない'}、スマホ幅から PC に戻すと ${a.backShown === true ? 'また出る' : a.backShown === false ? '出ない' : '測れない（' + a.backShown + '）'}${(a.errors || []).length ? '、エラー ' + a.errors.join(' / ') : ''}` }) }
  if (quick) return { name: '重さ・速さ', items, baselineOut: {} };
  items.push({ id: 'perf:jank', title: '打っている間の引っかかり（50ms以上止まる回数）', status: worse('longPerHand', 1.5, 0.3) ? 'warn' : 'ok',
    detail: `1ハンドあたり ${out.longPerHand}回${vs('longPerHand')}・止まった時間の合計 ${out.longMsPerHand}ms、一番長い ${out.longMaxMs}ms（${out.hands}ハンド）` });
  const grow = out.heap10MB ? Math.round((out.heapEndMB / out.heap10MB - 1) * 100) : 0;
  // v82 レビュー：% は元が小さいと大きく見える（6MB → 9MB で +50%）。終わりの MB で見る：前の版の 1.3倍+1MB を超えたら、基準が無いときは 10ハンド後から +8MB を超えたら ⚠️
  const memBad = b.heapEndMB != null ? worse('heapEndMB', 1.3, 1) : (out.heapEndMB - out.heap10MB) > 8;
  items.push({ id: 'perf:memory', title: '長く遊んでもメモリが増え続けない', status: memBad || (out.errors || []).length ? 'warn' : 'ok',
    detail: `10ハンド後 ${out.heap10MB}MB → ${out.hands}ハンド後 ${out.heapEndMB}MB${vs('heapEndMB')}（${grow >= 0 ? '+' : ''}${grow}%。目安：${b.heapEndMB != null ? '前の版の1.3倍+1MBまで' : '10ハンド後から +8MBまで'}）${(out.errors || []).length ? '。エラー: ' + out.errors.join(' / ') : ''}` });
  // 基準は長い版の値だけ残す（ハンド数で値が変わるため）
  return { name: '重さ・速さ', items, baselineOut: { perf: { sizeKB: out.sizeKB, titleMs: out.titleMs, longPerHand: out.longPerHand, hands: out.hands, heapEndMB: out.heapEndMB } } };
}
module.exports = { run };
