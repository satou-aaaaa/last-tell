// 重さ・速さ：安いスマホ相当（CPU 4倍遅く）で、起動の時間・打っている間の引っかかり・長く遊んだあとのメモリ（レビューの仕組み 案1、2026-10-10）
//   数字は前の版の基準（baseline.json の perf）と比べる。悪くなったら ⚠️（公開は止めない）
'use strict';
const fs = require('fs');
const H = require('../lib/harness');

const SLOW = 4;

async function cdp(page, rate = SLOW) { const c = await page.context().newCDPSession(page); await c.send('Emulation.setCPUThrottlingRate', { rate }); await c.send('Performance.enable'); return c }
async function heapMB(c) { try { await c.send('HeapProfiler.collectGarbage') } catch (e) {} const m = (await c.send('Performance.getMetrics')).metrics; return Math.round((m.find(x => x.name === 'JSHeapUsedSize') || {}).value / 1e5) / 10 }

async function run({ browser, file, quick, baseline }) {
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
      out.longMaxMs = Math.round(Math.max(0, ...lt));
      out.errors = await page.evaluate(() => __qa.errors.slice(0, 3));
    } finally { await ctx.close() }
  }
  const b = (baseline && baseline.perf) || {};
  const worse = (k, f = 1.3, add = 0) => b[k] != null && out[k] > b[k] * f + add;
  const vs = k => b[k] != null ? `（前の版 ${b[k]}）` : '';
  items.push({ id: 'perf:load', title: `起動の速さ（CPU ${SLOW}倍遅く、スマホ縦）`, status: worse('titleMs', 1.3, 300) || out.titleMs > 5000 ? 'warn' : 'ok',
    detail: `ファイル ${out.sizeKB}KB${vs('sizeKB')}、読み込み ${out.loadMs}ms、タイトルが出るまで ${out.titleMs}ms${vs('titleMs')}（目安 5000ms 以内）、メモリ ${out.heapLoadMB}MB` });
  if (quick) return { name: '重さ・速さ', items, baselineOut: {} };
  items.push({ id: 'perf:jank', title: '打っている間の引っかかり（50ms以上止まる回数）', status: worse('longPerHand', 1.5, 0.3) ? 'warn' : 'ok',
    detail: `1ハンドあたり ${out.longPerHand}回${vs('longPerHand')}、一番長い ${out.longMaxMs}ms（${out.hands}ハンド）` });
  const grow = out.heap10MB ? Math.round((out.heapEndMB / out.heap10MB - 1) * 100) : 0;
  items.push({ id: 'perf:memory', title: '長く遊んでもメモリが増え続けない', status: grow > 50 || (out.errors || []).length ? 'warn' : 'ok',
    detail: `10ハンド後 ${out.heap10MB}MB → ${out.hands}ハンド後 ${out.heapEndMB}MB（${grow >= 0 ? '+' : ''}${grow}%、目安 +50%まで）${(out.errors || []).length ? '。エラー: ' + out.errors.join(' / ') : ''}` });
  // 基準は長い版の値だけ残す（ハンド数で値が変わるため）
  return { name: '重さ・速さ', items, baselineOut: { perf: { sizeKB: out.sizeKB, titleMs: out.titleMs, longPerHand: out.longPerHand, hands: out.hands } } };
}
module.exports = { run };
