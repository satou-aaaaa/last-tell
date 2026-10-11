// はじめての人の流れ（ゲームクリエイター目線 S1・S3）
'use strict';
const H = require('../lib/harness');

async function run({ browser, file }) {
  const items = [];
  // S1：まっさらなセーブで、タイトルから最初の判断まで何回押すか
  {
    const { ctx, page } = await H.openGame(browser, file, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, fast: 40 });
    try {
      let taps = 0;
      const clickIf = async id => { if (await page.evaluate(i => { const b = document.getElementById(i); return !!b && !b.hidden && b.offsetParent !== null }, id)) { await page.evaluate(i => document.getElementById(i).click(), id); taps++; await page.waitForTimeout(150); return true } return false };
      await clickIf('btnNoticeClose');
      await clickIf('btnStory');
      // 章の一覧が出たら第1章
      if (await page.evaluate(() => !document.getElementById('chapters').hidden)) { await page.evaluate(() => document.querySelector('[data-ch="1"]').click()); taps++ }
      await H.startBot(page, { policy: 'call', maxHands: 3 });
      const t0 = Date.now();
      while (Date.now() - t0 < 60000 && !(await page.evaluate(() => __bot.firstDecisionClicks !== undefined))) await page.waitForTimeout(150);
      const n = await page.evaluate(() => __bot.firstDecisionClicks);
      const total = n === undefined ? null : taps + n;
      items.push({ id: 'ftue:taps', title: 'はじめての人が最初の判断まで5回以内で着く（クリエイター目線 S1）', status: total === null ? 'fail' : total <= 5 ? 'ok' : 'fail',
        detail: total === null ? '最初の判断まで着かなかった' : `タイトルから ${total}回押して最初の判断（5回以内で合格）` });
    } finally { await ctx.close() }
  }
  // S3：章の途中で閉じて開き直すと「続きから」が出る
  {
    const { ctx, page } = await H.openGame(browser, file, { fast: 60, storage: H.UNLOCKED });
    try {
      await page.evaluate(() => startChapter(CHAPTERS[1], true));
      await H.startBot(page, { policy: 'call', maxHands: 2 });
      await H.runUntilDone(page, { timeoutMs: 60000 });
      await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(500);
      const has = await page.evaluate(() => [...document.querySelectorAll('button')].some(b => b.offsetParent !== null && /続きから|Continue/.test(b.textContent)));
      items.push({ id: 'ftue:resume', title: '章の途中で閉じても「続きから」で戻れる（クリエイター目線 S3）', status: has ? 'ok' : 'fail', detail: has ? 'タイトルに「続きから」が出た' : '開き直すと「続きから」が出ない' });
    } finally { await ctx.close() }
  }
  // 最初の判断の画面で、相手の顔（#bust1、口より上）が勝利条件の帯（.goaldrop）に隠れていない（v65 クリエイター目線レビュー）
  for (const vp of [{ key: '縦', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, { key: '横', viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true }]) {
    const { ctx, page } = await H.openGame(browser, file, { viewport: vp.viewport, isMobile: vp.isMobile, hasTouch: vp.hasTouch, fast: 1, lite: false }); // 帯は3秒で閉じるので、時間は速めない
    try {
      await page.evaluate(() => startChapter(CHAPTERS[0], true));
      await H.startBot(page, { policy: 'call', maxHands: 3 });
      // 最初の自分の番で止める（押さない）
      await page.evaluate(() => { const B = __bot, t = B.tick; B.tick = function () { if (S && S.players && !S.handOver && S.toAct === 0 && !document.getElementById('controls').hidden) { B.done = true; return } t() }; clearInterval(B.timer); B.timer = setInterval(B.tick, 4) });
      const t0 = Date.now();
      while (!(await page.evaluate(() => __bot.done)) && Date.now() - t0 < 60000) await page.waitForTimeout(100);
      await page.evaluate(() => clearInterval(__bot.timer));
      await page.waitForTimeout(300);
      const r = await page.evaluate(() => {
        const vis = e => e && !e.hidden && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && +getComputedStyle(e).opacity > 0;
        const b = document.querySelector('#bust1:not(.out)'), g = [...document.querySelectorAll('.goaldrop')].find(vis);
        if (!vis(b)) return { ok: true, why: '正面の相手がいない' };
        if (!g) return { ok: true, why: '帯は出ていない' };
        const br = b.getBoundingClientRect(), gr = g.getBoundingClientRect();
        const top = br.top, mouth = br.top + br.height * .57, L = br.left + br.width * .3, R = br.right - br.width * .3;
        const w = Math.min(R, gr.right) - Math.max(L, gr.left), h = Math.min(mouth, gr.bottom) - Math.max(top, gr.top);
        return w > 0 && h > 0 ? { ok: false, why: `帯が顔の ${Math.round(100 * h / (mouth - top))}% にかかる` } : { ok: true, why: '帯は顔にかかっていない' };
      });
      items.push({ id: 'ftue:goal-face:' + vp.key, title: `最初の判断で相手の顔が勝利条件の帯に隠れない（スマホ${vp.key}）`, status: r.ok ? 'ok' : 'fail', detail: r.why });
    } finally { await ctx.close() }
  }
  return { name: 'はじめての人の流れ', items };
}
module.exports = { run };
