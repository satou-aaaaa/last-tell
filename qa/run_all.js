#!/usr/bin/env node
// LAST TELL 変更後の検査をまとめて回す
//   node run_all.js [ゲームのファイル] [--quick|--full] [--only fuzz,ui,...] [--update-baseline] [--out 出力先]
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./lib/harness');

const args = process.argv.slice(2);
const flag = n => args.includes(n);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null };
const file = path.resolve(args.find(a => !a.startsWith('--') && a !== opt('--only') && a !== opt('--out')) || path.join(__dirname, '../story/shisho.html'));
const quick = !flag('--full');
const only = opt('--only') ? opt('--only').split(',') : null;
const src = fs.readFileSync(file, 'utf8');
const ver = (src.match(/APP_VERSION='([^']+)'/) || [])[1] || 'unknown';
const label = 'v' + ver.split('.').slice(1, 2).join('') + (quick ? '' : '_full');
const outDir = path.resolve(opt('--out') || path.join(__dirname, 'reports', label));
fs.mkdirSync(outDir, { recursive: true });
const basePath = path.join(__dirname, 'baseline.json');
const baseline = fs.existsSync(basePath) ? JSON.parse(fs.readFileSync(basePath, 'utf8')) : null;
const known = JSON.parse(fs.readFileSync(path.join(__dirname, 'known.json'), 'utf8'));

const CHECKS = [
  ['text', './checks/text'], ['ftue', './checks/ftue'], ['fuzz', './checks/fuzz'], ['rules', './checks/rules'], ['winrate', './checks/winrate'], ['ui', './checks/ui'],
];

(async () => {
  const t0 = Date.now();
  const browser = await H.launch();
  const groups = [], newBase = Object.assign({}, baseline || {});
  for (const [key, mod] of CHECKS) {
    if (only && !only.includes(key)) continue;
    const t = Date.now();
    process.stdout.write(`… ${key} `);
    try {
      const r = await require(mod).run({ browser, file, quick, baseline, outDir });
      Object.assign(newBase, r.baselineOut || {});
      groups.push({ key, ...r, secs: Math.round((Date.now() - t) / 1000) });
    } catch (e) {
      groups.push({ key, name: key, items: [{ id: key + ':crash', title: `${key} の検査そのものが失敗`, status: 'fail', detail: String(e.stack || e).slice(0, 300) }] });
    }
    console.log(`${Math.round((Date.now() - t) / 1000)}秒`);
  }
  await browser.close();

  // 既知の問題（修正待ち）を区別する
  for (const g of groups) for (const it of g.items) {
    const k = known[it.id];
    if (k && it.status === 'fail') { it.status = 'known'; it.detail += `（修正待ち：${k}）` }
    else if (k && it.status === 'ok') { it.fixed = true; it.detail += '（直った。known.json から外してよい）' }
  }
  const all = groups.flatMap(g => g.items);
  const cnt = s => all.filter(i => i.status === s).length;
  const icon = { ok: '✅', fail: '❌', warn: '⚠️', known: '🟡' };
  const mins = Math.round((Date.now() - t0) / 6000) / 10;
  let md = `# 検査の結果 ${label}（${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC）\n\n`;
  md += `対象: ${path.basename(file)}（APP_VERSION ${ver}）、${quick ? '短い版（毎回）' : '長い版（公開前）'}、${mins}分\n\n`;
  md += `**${cnt('fail') ? '❌ 不合格' : '✅ 合格'}**　✅ ${cnt('ok')}　❌ ${cnt('fail')}　⚠️ ${cnt('warn')}　🟡 修正待ち・前からある ${cnt('known')}\n\n`;
  const fails = all.filter(i => i.status === 'fail');
  if (fails.length) { md += `## 直すもの\n\n` + fails.map(i => `- ${i.title}：${i.detail}${i.shot ? `（[画像](${i.shot})）` : ''}`).join('\n') + '\n\n' }
  const fixed = all.filter(i => i.fixed);
  if (fixed.length) md += `## 直ったもの\n\n` + fixed.map(i => `- ${i.title}`).join('\n') + '\n\n';
  for (const g of groups) {
    md += `## ${g.name}${g.secs ? `（${g.secs}秒）` : ''}\n\n| | 項目 | 結果 |\n|---|---|---|\n`;
    md += g.items.map(i => `| ${icon[i.status]} | ${i.title} | ${String(i.detail).replace(/\|/g, '／').replace(/\n/g, ' ')}${i.shot ? ` [画像](${i.shot})` : ''} |`).join('\n') + '\n\n';
  }
  md += `---\n- ✅ 合格　❌ 新しく起きた問題（公開を止める）　⚠️ 気にかけること　🟡 修正待ち（known.json）か、前の版からある問題（baseline.json）\n`;
  md += `- 目で見て判断することは別：大きな変更のときは、変わった所だけテスター・プロ・クリエイター目線で見る（qa/README.md）\n`;
  fs.writeFileSync(path.join(outDir, 'report.md'), md);
  fs.writeFileSync(path.join(outDir, 'result.json'), JSON.stringify({ label, ver, quick, groups }, null, 1));
  if (flag('--update-baseline') || !baseline) { fs.writeFileSync(basePath, JSON.stringify({ madeFrom: ver, madeAt: new Date().toISOString(), ...newBase }, null, 1)); console.log('基準（baseline.json）を書き直した') }
  console.log(`\n${cnt('fail') ? '不合格' : '合格'}  ok ${cnt('ok')} / fail ${cnt('fail')} / warn ${cnt('warn')} / known ${cnt('known')}\n報告: ${path.join(outDir, 'report.md')}`);
  for (const i of fails) console.log('  ❌ ' + i.title + '：' + i.detail);
  // GitHub の自動実行では、不合格を注釈として出す（ログを開かなくても見える）
  if (process.env.GITHUB_ACTIONS) for (const i of fails) console.log(`::error title=${i.title.replace(/[\r\n:,]/g, ' ')}::${String(i.detail).replace(/\r?\n/g, ' ').slice(0, 900)}`);
  process.exit(cnt('fail') ? 1 : 0);
})();
