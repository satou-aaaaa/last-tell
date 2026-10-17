// ゲームとは別に書いた役判定（qa/checks/basics.js から移した。2026-10-14）
// 7枚までを受けて [役の段階, 比べる数…] を返す（大きいほど強い）。わざと遅く素直に書いてある（総当たり）
'use strict';
function cmp(a, b) { for (let i = 0; i < Math.max(a.length, b.length); i++) { const d = (a[i] || 0) - (b[i] || 0); if (d) return d } return 0 }
function five(c) {
  const rs = c.map(x => x.r).sort((a, b) => b - a), fl = c.every(x => x.s === c[0].s), u = [...new Set(rs)];
  let st = 0; if (u.length === 5) { if (u[0] - u[4] === 4) st = u[0]; else if (u[0] === 14 && u[1] === 5 && u[4] === 2) st = 5 }
  const m = {}; rs.forEach(r => m[r] = (m[r] || 0) + 1);
  const g = Object.keys(m).map(Number).sort((a, b) => m[b] - m[a] || b - a), k = g.map(r => m[r]);
  if (st && fl) return [8, st]; if (k[0] === 4) return [7, g[0], g[1]]; if (k[0] === 3 && k[1] === 2) return [6, g[0], g[1]];
  if (fl) return [5, ...rs]; if (st) return [4, st]; if (k[0] === 3) return [3, ...g]; if (k[0] === 2 && k[1] === 2) return [2, ...g]; if (k[0] === 2) return [1, ...g]; return [0, ...rs];
}
function ev(cs) {
  let top = null; const n = cs.length;
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) for (let d = b + 1; d < n; d++) for (let e = d + 1; e < n; e++) for (let f = e + 1; f < n; f++) {
    const s = five([cs[a], cs[b], cs[d], cs[e], cs[f]]); if (!top || cmp(s, top) > 0) top = s;
  }
  return top;
}
const parse = s => s.split(' ').map(t => ({ r: '23456789TJQKA'.indexOf(t[0]) + 2, s: 'sdch'.indexOf(t[1]) }));
const show = h => h.map(c => '23456789TJQKA'[c.r - 2] + 'sdch'[c.s]).join(' ');
module.exports = { ev, cmp, five, parse, show };
