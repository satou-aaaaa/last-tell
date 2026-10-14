#!/usr/bin/env node
// CI（GitHub）の組ごとの結果を1つにまとめる（2026-10-14 検証をCIに寄せる）
//   node qa/tools/ci_summary.js <組の結果が入ったフォルダ> <まとめの出力先>
// 入力：<フォルダ>/qa-report-*/（各組の report.md・result.json・ui/）
// 出力：report.md（全部）、summary.md（短い要約。Claude はまずこれだけ読む）、result.json、baseline_候補.json、ui/（JPEG と一覧）
// GitHub の注釈（::error / ::warning）も出すので、gh api …/check-runs/<id>/annotations でも読める。
// 環境変数 QA_MATRIX（回すはずだった組）があれば、結果の無い組（止まった・時間切れ）を ❌ にする。
'use strict';
const fs = require('fs');
const path = require('path');

const inDir = path.resolve(process.argv[2] || 'groups'), out = path.resolve(process.argv[3] || 'qa-summary');
fs.mkdirSync(path.join(out, 'ui'), { recursive: true });
const qaDir = path.join(__dirname, '..');
const baseline = fs.existsSync(path.join(qaDir, 'baseline.json')) ? JSON.parse(fs.readFileSync(path.join(qaDir, 'baseline.json'), 'utf8')) : {};
const dirs = fs.existsSync(inDir) ? fs.readdirSync(inDir).filter(d => fs.existsSync(path.join(inDir, d, 'result.json'))).sort() : [];
const groups = [], newBase = JSON.parse(JSON.stringify(baseline));
let ver = 'unknown', quick = true;
for (const d of dirs) {
  const r = JSON.parse(fs.readFileSync(path.join(inDir, d, 'result.json'), 'utf8'));
  ver = r.ver || ver; quick = r.quick;
  // WebKit（iPhone の Safari）の組：名前を分け、画面の新しい問題は ⚠️（字の幅が Chromium の基準と違うため）。止まる・エラーは ❌ のまま（案3）
  if (/webkit/i.test(d)) for (const g of r.groups) {
    g.key = 'webkit-' + g.key; g.name = 'WebKit（iPhone の Safari）：' + g.name; delete g.baselineOut;
    for (const it of g.items) { it.id = 'webkit:' + it.id; it.title = 'WebKit：' + it.title; if (it.shot) it.shot = it.shot.replace(/([^/]+)$/, 'WebKit_$1');
      if (it.status === 'fail' && /^ui:/.test(it.id.slice(7)) && !/エラー|撮れなかった/.test(it.detail)) { it.status = 'warn'; it.detail = '（WebKit は字の幅が違うので ⚠️）' + it.detail } }
  }
  for (const g of r.groups) {
    // 勝率は章ごとに別の組で回すので、一段深くまで混ぜる
    for (const [k, v] of Object.entries(g.baselineOut || {})) newBase[k] = v && typeof v === 'object' && !Array.isArray(v) && newBase[k] && typeof newBase[k] === 'object' && !Array.isArray(newBase[k]) ? { ...newBase[k], ...v } : v;
    const same = groups.find(x => x.key === g.key);
    if (same) { same.items.push(...g.items); same.secs = Math.max(same.secs || 0, g.secs || 0) } else groups.push(g);
  }
  // 画面：JPEG と一覧と changes.json だけ写す（PNG は Actions の qa-report-* に残る）
  const ui = path.join(inDir, d, 'ui');
  if (fs.existsSync(ui)) for (const f of fs.readdirSync(ui)) if (/\.(jpg|json)$/.test(f)) fs.copyFileSync(path.join(ui, f), path.join(out, 'ui', f));
  for (const f of ['uiux.json', 'lines_diff.md']) if (fs.existsSync(path.join(inDir, d, f))) fs.copyFileSync(path.join(inDir, d, f), path.join(out, f));
}
const order = ['unit', 'text', 'script', 'lines', 'ftue', 'fuzz', 'rules', 'basics', 'save', 'winrate', 'ui', 'uiux', 'a11y', 'perf'];
const rank = k => order.indexOf(k.replace(/^webkit-/, '')) + (k.startsWith('webkit-') ? 100 : 0);
groups.sort((a, b) => rank(a.key) - rank(b.key));
for (const g of groups) if (g.key === 'winrate') g.items.sort((a, b) => parseInt(a.id.replace(/\D/g, '')) - parseInt(b.id.replace(/\D/g, '')));

// 結果の無い組
const missing = [];
try {
  const done = new Set(groups.flatMap(g => g.key === 'winrate' ? g.items.map(i => 'winrate:' + i.id.replace(/\D/g, '')) : [g.key]));
  for (const m of JSON.parse(process.env.QA_MATRIX || '[]')) {
    const keys = m.only === 'winrate' ? m.ch.split(',').map(c => 'winrate:' + c) : m.only.split(',').map(k => (m.browser === 'webkit' ? 'webkit-' : '') + k);
    if (keys.some(k => !done.has(k))) missing.push(m.name);
  }
} catch (e) { }
if (missing.length) groups.unshift({ key: 'ci', name: 'CI', items: missing.map(n => ({ id: 'ci:' + n, title: `組「${n}」の結果が無い（止まった・時間切れ・入れる段階で失敗）`, status: 'fail', detail: 'Actions の画面でその組のログを見る' })) });

const all = groups.flatMap(g => g.items);
const cnt = s => all.filter(i => i.status === s).length;
const icon = { ok: '✅', fail: '❌', warn: '⚠️', known: '🟡' };
const fails = all.filter(i => i.status === 'fail'), warns = all.filter(i => i.status === 'warn'), fixed = all.filter(i => i.fixed);
const line = i => `- ${i.title}：${String(i.detail).replace(/\n/g, ' ')}${i.shot ? `（${i.shot.replace(/\.png$/, '.jpg')}）` : ''}`;
const sha = (process.env.GITHUB_SHA || '').slice(0, 7), when = new Date().toISOString().slice(0, 16).replace('T', ' ');
const head = `対象: index.html（APP_VERSION ${ver}）、${quick ? '短い版' : '長い版（公開前）'}、GitHub ${sha}、${when} UTC\n\n` +
  `**${fails.length ? '❌ 不合格' : '✅ 合格'}**　✅ ${cnt('ok')}　❌ ${fails.length}　⚠️ ${warns.length}　🟡 修正待ち・前からある ${cnt('known')}\n\n`;

// 画面の変化
let changes = {};
try { changes = JSON.parse(fs.readFileSync(path.join(out, 'ui', 'changes.json'), 'utf8')) } catch (e) { }
const changed = Object.entries(changes).filter(([, c]) => c.status !== 'same');
const shotsMd = fs.existsSync(path.join(out, 'ui', '_一覧_縦.jpg'))
  ? `## 画面\n\n- 一覧（まず これを見る）：ui/_一覧_縦.jpg・ui/_一覧_横.jpg・ui/_一覧_PC.jpg${fs.existsSync(path.join(out, 'ui', '_一覧_WebKit_縦.jpg')) ? '（iPhone の Safari は ui/_一覧_WebKit_縦.jpg ほか）' : ''}\n` +
    (Object.keys(changes).length ? `- 前の版から見た目が変わった画面 ${changed.length}枚（「前｜今｜違う所」を1枚にした ui/_比べ_<名前>.jpg を見る）${changed.length ? '：' + changed.map(([f, c]) => `${f}${c.status === 'new' ? '（新）' : `（${c.ratio}%）`}`).join('、') : '（目で見るのは不要）'}\n` : '- 前の版の画面が無いので、変化は比べていない\n')
  : '';

let sum = `# 検査のまとめ v${ver}\n\n` + head;
if (fails.length) sum += `## ❌ 直すもの\n\n${fails.map(line).join('\n')}\n\n`;
if (warns.length) sum += `## ⚠️ 気にかけること\n\n${warns.map(line).join('\n')}\n\n`;
if (fixed.length) sum += `## 直ったもの（known.json から外す）\n\n${fixed.map(i => `- ${i.title}`).join('\n')}\n\n`;
const wr = (groups.find(g => g.key === 'winrate') || { items: [] }).items;
if (wr.length) sum += `## 勝率\n\n${wr.map(i => `- ${icon[i.status]} ${i.title}：${i.detail}`).join('\n')}\n\n`;
try { const ld = fs.readFileSync(path.join(out, 'lines_diff.md'), 'utf8').split('\n'); sum += `## 台詞の変化（lines_diff.md）\n\n` + ld.slice(2, 40).join('\n') + (ld.length > 40 ? `\n…（続きは lines_diff.md、${ld.length}行）` : '') + '\n\n' } catch (e) { }
sum += shotsMd + `\n全部の結果は report.md、基準を書き直すときは baseline_候補.json（qa/baseline.json に写す。本線だけ、satou さんの OK のあと）。\n`;

let md = `# 検査の結果 v${ver}（GitHub）\n\n` + head;
if (fails.length) md += `## 直すもの\n\n${fails.map(line).join('\n')}\n\n`;
if (fixed.length) md += `## 直ったもの\n\n${fixed.map(i => `- ${i.title}`).join('\n')}\n\n`;
for (const g of groups) {
  md += `## ${g.name}${g.secs ? `（${g.secs}秒）` : ''}\n\n| | 項目 | 結果 |\n|---|---|---|\n`;
  md += g.items.map(i => `| ${icon[i.status]} | ${i.title} | ${String(i.detail).replace(/\|/g, '／').replace(/\n/g, ' ')}${i.shot ? ` ${i.shot.replace(/\.png$/, '.jpg')}` : ''} |`).join('\n') + '\n\n';
}
md += shotsMd;
md += `\n---\n- ✅ 合格　❌ 新しく起きた問題（公開を止める）　⚠️ 気にかけること　🟡 修正待ち（known.json）か、前の版からある問題（baseline.json）\n`;

fs.writeFileSync(path.join(out, 'summary.md'), sum);
fs.writeFileSync(path.join(out, 'report.md'), md);
fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify({ label: 'v' + ver, ver, quick, sha: process.env.GITHUB_SHA || '', groups }, null, 1));
fs.writeFileSync(path.join(out, 'baseline_候補.json'), JSON.stringify({ ...newBase, madeFrom: ver, madeAt: new Date().toISOString(), madeBy: 'GitHub ' + sha }, null, 1));
fs.writeFileSync(path.join(out, 'ver.txt'), ver + '\n');

if (process.env.GITHUB_ACTIONS) {
  const esc = s => String(s).replace(/%/g, '%25').replace(/\r?\n/g, ' ').replace(/::/g, '：');
  const t = s => esc(s).replace(/[,:]/g, ' ').slice(0, 120);
  console.log(`::notice title=QA v${ver}::${fails.length ? '不合格' : '合格'} ok ${cnt('ok')} / fail ${fails.length} / warn ${warns.length} / known ${cnt('known')}。画面の変化 ${changed.length}枚${changed.length ? '：' + changed.slice(0, 12).map(([f]) => f).join('、') : ''}`);
  for (const i of fails.slice(0, 10)) console.log(`::error title=${t(i.title)}::${esc(i.detail).slice(0, 900)}`);
  for (const i of warns.slice(0, 10)) console.log(`::warning title=${t(i.title)}::${esc(i.detail).slice(0, 900)}`);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, sum);
}
console.log(sum);
process.exit(fails.length ? 1 : 0);
