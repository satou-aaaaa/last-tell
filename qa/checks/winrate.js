// 勝率：第1〜4章を「ゲームのCPUと同じ考え方」で打って、前の版の基準と比べる
// 長い版（--full）では第5〜7章と第二部（第11〜15章）も記録する。こちらは変わっても ⚠️ だけ（レビューの仕組み 案1、2026-10-10）
'use strict';
const H = require('../lib/harness');
const os = require('os');

async function playOnce(browser, file, ch, maxHands) {
  const { ctx, page } = await H.openGame(browser, file, { fast: 60, storage: ch > 10 ? H.UNLOCKED : null });
  try {
    await page.evaluate(n => n > 10 ? startP2(PART2[n - 11], true) : startChapter(CHAPTERS[n - 1], true), ch);
    await H.startBot(page, { policy: 'cpu', maxHands });
    const r = await H.runUntilDone(page, { timeoutMs: 240000, stallMs: 20000 });
    const b = await H.botState(page);
    return r.status === 'done' ? b.result : 'error';
  } catch (e) { return 'error' } finally { await ctx.close() }
}

// 同時に開く数はCPUの数に合わせる（GitHubの実行機は2〜4コアで、6つ同時だと遅すぎて止まった扱いになる）
async function run({ browser, file, quick, baseline, parallel = Math.max(1, Math.min(6, os.cpus().length - 1)) }) {
  const N = quick ? 8 : 24, maxHands = 80, items = [], out = {};
  for (const ch of quick ? [1, 2, 3, 4] : [1, 2, 3, 4, 5, 6, 7, 11, 12, 13, 14, 15]) {
    const jobs = Array.from({ length: N }, () => () => playOnce(browser, file, ch, maxHands));
    const res = [];
    for (let i = 0; i < jobs.length; i += parallel) res.push(...await Promise.all(jobs.slice(i, i + parallel).map(f => f())));
    // 途中で止まった回は1度だけ1つずつやり直す（実行機が混んでいただけのことがある）
    for (let i = 0; i < res.length; i++) if (res[i] === 'error') res[i] = await playOnce(browser, file, ch, maxHands);
    const ok = res.filter(r => r !== 'error'), w = ok.filter(r => r === 'win').length;
    const rate = ok.length ? w / ok.length : 0;
    out['ch' + ch] = { rate, n: ok.length };
    const base = baseline && baseline.winrate && baseline.winrate['ch' + ch];
    let status = 'ok', detail = `勝率 ${Math.round(rate * 100)}%（${w}/${ok.length}、80ハンドで決着しない回は負け扱い）`;
    if (res.length - ok.length) { status = 'fail'; detail += `。${res.length - ok.length}回は途中で止まった` }
    if (base) {
      // 回数が少ないので、ぶれの幅（標準誤差の2.5倍、最低15ポイント）を超えたときだけ「変わった」とする
      const se = Math.sqrt(Math.max(base.rate * (1 - base.rate), 0.05) * (1 / base.n + 1 / Math.max(ok.length, 1)));
      const tol = Math.max(0.15, 2.5 * se);
      detail += `、基準 ${Math.round(base.rate * 100)}%（許す幅 ±${Math.round(tol * 100)}）`;
      if (Math.abs(rate - base.rate) > tol && ch <= 3) status = 'fail';
      else if (Math.abs(rate - base.rate) > tol) status = 'warn';
    } else detail += '、基準なし（今回の値を基準にする）';
    items.push({ id: 'winrate:ch' + ch, title: `第${ch}章の勝率`, status, detail });
  }
  return { name: '勝率', items, baselineOut: { winrate: out } };
}
module.exports = { run };
