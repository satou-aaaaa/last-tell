#!/usr/bin/env node
// LAST TELL 変更後の検査をまとめて回す
//   node run_all.js [ゲームのファイル] [--quick|--full] [--only fuzz,ui,...] [--out 出力先]
//   node run_all.js [ゲームのファイル] --official [--full] [--update-baseline]   ← 版の正式な結果（本線だけ）
//   node run_all.js --list                                                    ← 検査の一覧
// 結果の置き場所（CIの見直し 案1、2026-10-10）：ふだんは qa/reports/_runs/<日時>_<ファイル名>/（毎回別、上書きしない）。
// qa/reports/v<版>/ と baseline.json に書くのは --official のときだけ。
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./lib/harness');

const CHECKS = [
  ['text', './checks/text'], ['script', './checks/script'], ['ftue', './checks/ftue'], ['fuzz', './checks/fuzz'], ['rules', './checks/rules'], ['basics', './checks/basics'], ['save', './checks/save'], ['winrate', './checks/winrate'], ['ui', './checks/ui'], ['uiux', './checks/uiux'], ['a11y', './checks/a11y'], ['perf', './checks/perf'],
];
const args = process.argv.slice(2);
if (args.includes('--list')) { console.log(CHECKS.map(c => c[0]).join('\n')); process.exit(0) }
const flag = n => args.includes(n);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null };
const file = path.resolve(args.find(a => !a.startsWith('--') && ![opt('--only'), opt('--out'), opt('--changed'), opt('--src'), opt('--ch')].includes(a)) || path.join(__dirname, '../story/shisho.html'));
const quick = !flag('--full');
let only = opt('--only') ? opt('--only').split(',') : null;
// --changed vNN：控え vNN から変わった src のファイルに関係する検査だけ（作業の途中用。公開の前は付けずに全部）
const changed = opt('--changed') ? require('./lib/changed').pick(opt('--changed'), path.resolve(opt('--src') || path.join(__dirname, '../src'))) : null;
if (changed) {
  console.log(`${opt('--changed')} から変わったファイル：\n` + changed.changed.map(f => `  ${f} → ${changed.why[f] || ''}`).join('\n'));
  if (changed.checks) only = only ? only.filter(k => changed.checks.includes(k)) : changed.checks;
  console.log(`回す検査：${only ? only.join(', ') : '全部'}\n`);
}
const src = fs.readFileSync(file, 'utf8');
const ver = (src.match(/APP_VERSION='([^']+)'/) || [])[1] || 'unknown';
const label = 'v' + ver.split('.').slice(1, 2).join('') + (quick ? '' : '_full') + (changed ? '_changed' : '');
const official = flag('--official');
if (official && (changed || only || opt('--out') || opt('--ch'))) { console.error('--official は全部の検査を回すときだけ使えます（--changed・--only・--out とは一緒に使わない）'); process.exit(2) }
if (flag('--update-baseline') && !official) { console.error('基準（baseline.json）を書き直すのは --official のときだけです'); process.exit(2) }
const runsDir = path.join(__dirname, 'reports', '_runs');
// 1日より前の _runs は消す
if (fs.existsSync(runsDir)) for (const d of fs.readdirSync(runsDir)) {
  const p = path.join(runsDir, d);
  try { if (Date.now() - fs.statSync(p).mtimeMs > 864e5) fs.rmSync(p, { recursive: true, force: true }) } catch (e) { }
}
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
const outDir = path.resolve(opt('--out') || (official ? path.join(__dirname, 'reports', label)
  : path.join(runsDir, `${stamp}_${path.basename(file, '.html')}_${label}_${process.pid}`)));
fs.mkdirSync(outDir, { recursive: true });
// 同じ版の --official が同時に2つ走らないようにする（後から来たほうを止める）
const lockPath = path.join(outDir, '.running');
if (official) {
  try { fs.writeFileSync(lockPath, String(process.pid), { flag: 'wx' }) } catch (e) {
    const pid = Number(fs.readFileSync(lockPath, 'utf8')); let alive = false;
    try { process.kill(pid, 0); alive = true } catch (e2) { }
    if (alive) { console.error(`${label} の正式な検査はもう走っています（pid ${pid}）。終わるのを待ってください`); process.exit(2) }
    fs.writeFileSync(lockPath, String(process.pid));
  }
  process.on('exit', () => { try { fs.unlinkSync(lockPath) } catch (e) { } });
}
console.log('結果の置き場所: ' + outDir);
const basePath = path.join(__dirname, 'baseline.json');
const baseline = fs.existsSync(basePath) ? JSON.parse(fs.readFileSync(basePath, 'utf8')) : null;
const known = JSON.parse(fs.readFileSync(path.join(__dirname, 'known.json'), 'utf8'));


(async () => {
  const t0 = Date.now();
  const browser = await H.launch();
  const groups = [], newBase = Object.assign({}, baseline || {});
  for (const [key, mod] of CHECKS) {
    if (only && !only.includes(key)) continue;
    const t = Date.now();
    process.stdout.write(`… ${key} `);
    try {
      const r = await require(mod).run({ browser, file, quick, baseline, outDir, chapters: opt('--ch') ? opt('--ch').split(',').map(Number) : null });
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
  md += `対象: ${path.basename(file)}（APP_VERSION ${ver}）、${quick ? '短い版（毎回）' : '長い版（公開前）'}${changed ? `、変えた所だけ（${only ? only.join(',') : '全部'}）` : ''}、${mins}分\n\n`;
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
  if (official && (flag('--update-baseline') || !baseline)) { fs.writeFileSync(basePath, JSON.stringify({ madeFrom: ver, madeAt: new Date().toISOString(), ...newBase }, null, 1)); console.log('基準（baseline.json）を書き直した') }
  console.log(`\n${cnt('fail') ? '不合格' : '合格'}  ok ${cnt('ok')} / fail ${cnt('fail')} / warn ${cnt('warn')} / known ${cnt('known')}\n報告: ${path.join(outDir, 'report.md')}`);
  for (const i of fails) console.log('  ❌ ' + i.title + '：' + i.detail);
  // GitHub の自動実行では、不合格を注釈として出す（ログを開かなくても見える）
  if (process.env.GITHUB_ACTIONS) for (const i of fails) console.log(`::error title=${i.title.replace(/[\r\n:,]/g, ' ')}::${String(i.detail).replace(/\r?\n/g, ' ').slice(0, 900)}`);
  process.exit(cnt('fail') ? 1 : 0);
})();
