#!/usr/bin/env node
// ルールの単体テスト（2026-10-14）。ブラウザを開かずに、ゲームのルールの計算だけを確かめる。数秒
//   node qa/unit/run.js [組み立てた.html | src のフォルダ]     （省略すると story/shisho.html）
// run_all.js からは「unit」として呼ばれる（qa/checks/unit.js）
'use strict';
const path = require('path');
const { load } = require('./load');
const TESTS = ['eval', 'pots', 'betting', 'seats', 'reads', 'deal', 'kata_text'];
function run(target) {
  const G = load(target), items = [];
  for (const t of TESTS) {
    const t0 = Date.now();
    try { for (const it of require('./tests/' + t)(G)) items.push({ ...it, ms: Date.now() - t0 }) }
    catch (e) { items.push({ id: 'unit:' + t + '-crash', title: t + ' のテストそのものが失敗', ok: false, detail: String(e.stack || e).slice(0, 300) }) }
  }
  return { items, blocks: G.blocks };
}
module.exports = { run };
if (require.main === module) {
  const t0 = Date.now(), target = path.resolve(process.argv[2] || path.join(__dirname, '../../story/shisho.html'));
  const r = run(target);
  for (const i of r.items) console.log(`${i.ok === null ? '⚠️' : i.ok ? '✅' : '❌'} ${i.title}：${i.detail}`);
  console.log(`\n${path.basename(target)}（読んだ部分: ${r.blocks.join(', ')}）、${((Date.now() - t0) / 1000).toFixed(1)}秒`);
  process.exit(r.items.some(i => i.ok === false) ? 1 : 0);
}
