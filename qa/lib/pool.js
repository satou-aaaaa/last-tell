// 同時に回す数を決めて、1つ終わったらすぐ次を始める（CIの高速化 案2、2026-10-17）。
// 前は「n個ずつ、全部終わるまで待ってから次のn個」だったので、遅い1つに合わせて残りが待っていた。結果は元の順で返す
'use strict';
async function pool(tasks, n) {
  const out = new Array(tasks.length); let next = 0;
  const worker = async () => { while (next < tasks.length) { const i = next++; out[i] = await tasks[i]() } };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(n, tasks.length)) }, worker));
  return out;
}
// --part k/n（CIの高速化 案1）：GitHub で1つの検査を n 個の組に分けて同時に回す。part は { k, n }（k は 1 から）
const parsePart = s => { const m = /^(\d+)\/(\d+)$/.exec(s || ''); if (!m) return null; const k = +m[1], n = +m[2]; return k >= 1 && k <= n ? { k, n } : null };
// i 番目の仕事がこの組の分か（順に配る）
const mine = (part, i) => !part || i % part.n === part.k - 1;
module.exports = { pool, parsePart, mine };
