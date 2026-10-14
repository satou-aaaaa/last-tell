// ルールの単体テスト（qa/unit/）を run_all.js から回す。ブラウザは使わない（2026-10-14）
'use strict';
const { run: unit } = require('../unit/run');
async function run({ file }) {
  const r = unit(file);
  return { name: 'ルールの単体テスト（ブラウザなし）', items: r.items.map(i => ({ id: i.id, title: i.title, status: i.ok === null ? 'warn' : i.ok ? 'ok' : 'fail', detail: i.detail })) };
}
module.exports = { run, noBrowser: true };
