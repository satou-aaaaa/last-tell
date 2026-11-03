// Lighthouse の点を何回か測って、項目ごとの真ん中の値で見る（2026-11-03 CI の失敗を減らす）
//   Lighthouse の点は、同じページでも回ごとに揺れる（とくに速さ）。1回の点で「前の版より5点下がった」を見ると、
//   揺れだけで ⚠️ になり、くり返しの ⚠️（qa/tools/ci_summary.js）で3版目に ❌ に上がりうる。
//   Lighthouse の資料は「1回でなく、何回か測った真ん中の値（median）で決める」「同じ機械で同時に測らず、順に測る」を勧めている
//   （https://github.com/GoogleChrome/lighthouse/blob/master/docs/variability.md 、Lighthouse CI の numberOfRuns）。
//   ここでは順に RUNS 回測り、項目ごとに真ん中の値を取る。基準（前の版より5点）は変えない。
'use strict';
const RUNS = 3;
// runs: [{ performance: 90, accessibility: 100, ... }, ...]（測れなかった回は入れない）。項目ごとの真ん中の値（偶数回なら真ん中2つの平均を丸める）
function medianScores(runs) {
  const out = {}, keys = [...new Set(runs.flatMap(r => Object.keys(r)))];
  for (const k of keys) {
    const v = runs.map(r => r[k]).filter(x => typeof x === 'number' && isFinite(x)).sort((a, b) => a - b);
    if (!v.length) continue;
    const m = v.length >> 1; out[k] = v.length % 2 ? v[m] : Math.round((v[m - 1] + v[m]) / 2);
  }
  return out;
}
module.exports = { RUNS, medianScores };
