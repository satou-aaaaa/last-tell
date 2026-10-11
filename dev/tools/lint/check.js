#!/usr/bin/env node
// 組み立てた shisho.html のスクリプトを確かめる（開発と設計のベストプラクティス 案2）
//   node check.js 組み立てた.html [--strict]
// 1) 文法（node --check 相当）：間違いがあれば必ず終了コード 1（ゲームが真っ白になるため）
// 2) ESLint：error があれば表示。--strict のときだけ終了コード 1（英語辞書の重複を片づけるまでは知らせるだけ）
const fs = require('fs'), path = require('path'), vm = require('vm');
const file = process.argv[2], strict = process.argv.includes('--strict');
if (!file) { console.error('使い方: node check.js 組み立てた.html [--strict]'); process.exit(2); }
const html = fs.readFileSync(file, 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const lineOf = i => html.slice(0, html.indexOf(scripts[i])).split('\n').length;
let bad = 0;
scripts.forEach((code, i) => {
  try { new vm.Script(code, { filename: `script${i}` }); }
  catch (e) {
    const m = /script\d+:(\d+)/.exec(e.stack || ''); const ln = m ? lineOf(i) + (+m[1]) - 1 : lineOf(i);
    console.error(`❌ 文法の間違い（shisho.html ${ln}行目あたり）: ${e.message}`); bad++;
  }
});
if (bad) process.exit(1);
console.log(`✅ 文法 OK（スクリプト ${scripts.length}個）`);
let ESLint;
try { ({ ESLint } = require(path.join(__dirname, 'node_modules', 'eslint'))); }
catch { console.log('（ESLint が入っていないので書き方チェックは飛ばしました：cd dev/tools/lint && npm ci）'); process.exit(0); }
(async () => {
  const eslint = new ESLint({ cwd: __dirname, overrideConfigFile: path.join(__dirname, 'eslint.config.mjs') });
  const code = scripts.reduce((a, s) => a.length > s.length ? a : s, '');
  const off = lineOf(scripts.indexOf(code)) - 1;
  const [r] = await eslint.lintText(code, { filePath: path.join(__dirname, 'game.js') });
  const err = r.messages.filter(m => m.severity === 2), warn = r.messages.filter(m => m.severity === 1);
  const by = {}; for (const m of err) (by[m.ruleId || '文法'] = by[m.ruleId || '文法'] || []).push(m);
  for (const [id, ms] of Object.entries(by)) {
    console.log(`${strict ? '❌' : '⚠️'} ${id}: ${ms.length}件`);
    ms.slice(0, 8).forEach(m => console.log(`   ${off + m.line}行目: ${m.message}`));
    if (ms.length > 8) console.log(`   …ほか ${ms.length - 8}件`);
  }
  console.log(`書き方: error ${err.length}件 / 知らせるだけ ${warn.length}件`);
  process.exit(strict && err.length ? 1 : 0);
})();
