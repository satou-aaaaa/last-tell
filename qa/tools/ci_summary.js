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
// --part で分けた組（CIの高速化 案1）：結果の届いた「検査#組」と、勝率の生の結果（章ごとに混ぜてから判定する）
const done = new Set(), wrRaw = {};
const J = require('../lib/winrate_judge');
const knownW = (() => { try { return JSON.parse(fs.readFileSync(path.join(qaDir, 'known.json'), 'utf8')) } catch (e) { return {} } })();   // WebKit の組の修正待ち（下）
for (const d of dirs) {
  const r = JSON.parse(fs.readFileSync(path.join(inDir, d, 'result.json'), 'utf8'));
  ver = r.ver || ver; quick = r.quick;
  // WebKit（iPhone の Safari）の組：名前を分け、画面の新しい問題は ⚠️（字の幅が Chromium の基準と違うため）。止まる・エラーは ❌ のまま（案3）
  if (/webkit/i.test(d)) for (const g of r.groups) {
    g.key = 'webkit-' + g.key; g.name = 'WebKit（iPhone の Safari）：' + g.name; delete g.baselineOut;
    for (const it of g.items) { it.id = 'webkit:' + it.id; it.title = 'WebKit：' + it.title; if (it.shot) it.shot = it.shot.replace(/([^/]+)$/, 'WebKit_$1');
      if (it.status === 'fail' && /^ui:/.test(it.id.slice(7)) && !/^ui:(stall|shown|cover):/.test(it.id.slice(7)) && !/エラー|撮れなかった/.test(it.detail)) { it.status = 'warn'; it.detail = '（WebKit は字の幅が違うので ⚠️）' + it.detail }
      // WebKit だけの修正待ち：known.json に「webkit:」つきの名前で入れたものは、ここで 🟡 にする（run_all は「webkit:」をつける前に known.json を見るので当たらなかった。v0.97.5 CI）
      //   「webkit:」つきは期限（「期限 YYYY-MM-DD」）が要る。期限が無い・過ぎたものは 🟡 にしない（❌・⚠️ のまま。CodeRabbit PR #119）
      const kw = knownW[it.id], kwExp = kw && (String(kw).match(/期限\s*(\d{4}-\d{2}-\d{2})/) || [])[1], kwOk = kwExp && kwExp >= new Date().toISOString().slice(0, 10);
      if (kw && (it.status === 'fail' || it.status === 'warn')) { if (kwOk) { it.status = 'known'; it.detail += `（修正待ち：${kw}）` } else it.detail += kwExp ? `（known.json の期限 ${kwExp} が過ぎた）` : '（known.json に期限がない）' }
      else if (kw && it.status === 'ok') { it.fixed = true; it.detail += '（直った。known.json から外してよい）' } }
  }
  for (const g of r.groups) {
    done.add(g.key + (r.part ? '#' + r.part : ''));
    if (g.key === 'winrate') for (const it of g.items) done.add('winrate:' + it.id.replace(/\D/g, ''));
    for (const raw of g.partial || []) wrRaw[raw.ch] = J.mergeRaw(wrRaw[raw.ch], raw);
    delete g.partial;
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
// 分けて回した勝率を章ごとに判定する（判定の中身は手元の run_all と同じ lib/winrate_judge.js）
if (Object.keys(wrRaw).length) {
  const known = JSON.parse(fs.readFileSync(path.join(qaDir, 'known.json'), 'utf8'));
  let g = groups.find(x => x.key === 'winrate'); if (!g) groups.push(g = { key: 'winrate', name: '勝率', items: [] });
  const wr = {};
  for (const raw of Object.values(wrRaw)) {
    const j = J.judge(raw, { quick, baseline });
    for (const it of j.items) { const k = known[it.id]; if (k && it.status === 'fail') { it.status = 'known'; it.detail += `（修正待ち：${k}）` } else if (k && it.status === 'ok') { it.fixed = true; it.detail += '（直った。known.json から外してよい）' } }
    g.items.push(...j.items); wr['ch' + raw.ch] = j.out;
  }
  newBase.winrate = { ...(newBase.winrate || {}), ...wr };
}
const order = ['unit', 'text', 'script', 'lines', 'ftue', 'fuzz', 'rules', 'basics', 'save', 'winrate', 'ui', 'uiux', 'a11y', 'perf', 'site'];
const rank = k => order.indexOf(k.replace(/^webkit-/, '')) + (k.startsWith('webkit-') ? 100 : 0);
groups.sort((a, b) => rank(a.key) - rank(b.key));
for (const g of groups) if (g.key === 'winrate') g.items.sort((a, b) => parseInt(a.id.replace(/\D/g, '')) - parseInt(b.id.replace(/\D/g, '')));

// 結果の無い組
const missing = [];
try {
  for (const m of JSON.parse(process.env.QA_MATRIX || '[]')) {
    const keys = m.only === 'winrate' && m.ch ? m.ch.split(',').map(c => 'winrate:' + c) : m.only.split(',').map(k => (m.browser === 'webkit' ? 'webkit-' : '') + k + (m.part ? '#' + m.part : ''));
    if (keys.some(k => !done.has(k))) missing.push(m.name);
  }
} catch (e) { }
if (missing.length) groups.unshift({ key: 'ci', name: 'CI', items: missing.map(n => ({ id: 'ci:' + n, title: `組「${n}」の結果が無い（止まった・時間切れ・入れる段階で失敗）`, status: 'fail', detail: 'Actions の画面でその組のログを見る' })) });

const all = groups.flatMap(g => g.items);
// くり返し出る ⚠️（v0.97.4 レビュー：心の声の字幕の ⚠️ が v0.97.1・v0.97.2・v0.97.4 と出たり消えたりしながら、誰も直さなかった）
//   直近に公開した3版（ブランチ qa-results の v<版>/result.json）に同じ項目の ⚠️・❌・🟡 があれば「くり返し（n回目）」を付けて一番上に出す。
//   3回目（前の2版以上＋今）は ❌：直すか、known.json に期限付き（「期限 YYYY-MM-DD」）で入れる。期限が過ぎたら また ❌
let prevErr = '';
const prevVers = (() => { try {
  const vk = v => v.replace(/^v/, '').split('.').map(Number), cmp = (a, b) => { const x = vk(a), y = vk(b); for (let i = 0; i < 4; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); return 0 };
  if (process.env.QA_PREV_RESULTS) { const d = process.env.QA_PREV_RESULTS; return fs.readdirSync(d).filter(v => /^v\d/.test(v) && v !== 'v' + ver && fs.existsSync(path.join(d, v, 'result.json'))).sort(cmp).slice(-3).map(v => JSON.parse(fs.readFileSync(path.join(d, v, 'result.json'), 'utf8'))) }
  const git = (...a) => require('child_process').execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64e6 });   // 引数は配列で渡す（シェルを通さない）
  git('fetch', '-q', '--depth', '1', 'origin', 'qa-results');
  return git('ls-tree', '--name-only', 'origin/qa-results').split('\n').filter(v => /^v\d/.test(v) && v !== 'v' + ver).sort(cmp).slice(-3)
    .map(v => { try { return JSON.parse(git('show', `origin/qa-results:${v}/result.json`)) } catch (e) { prevErr += (prevErr ? '／' : '') + `${v} が読めない（${String(e && e.message || e).split('\n')[0].slice(0, 60)}）`; return null } }).filter(Boolean);   // 読めない版は黙って飛ばさず ⚠️ に出す（CodeRabbit PR #119）
} catch (e) { prevErr += (prevErr ? '／' : '') + String(e && e.message || e).split('\n')[0].slice(0, 120); return [] } })();   // 読めなかったことは ⚠️ で出す（CodeRabbit PR #119）
if (prevErr) { const it = { id: 'ci:repeat', title: 'くり返しの ⚠️ の検査（前の版の結果を読む）', status: 'warn', detail: '前の版の結果を読めなかった：' + prevErr };
  all.push(it); let g = groups.find(x => x.key === 'ci'); if (!g) groups.unshift(g = { key: 'ci', name: 'CI', items: [] }); g.items.push(it) }   // result.json・report.md にも残す（CodeRabbit PR #119）
if (prevVers.length) {
  const knownAll = (() => { try { return JSON.parse(fs.readFileSync(path.join(qaDir, 'known.json'), 'utf8')) } catch (e) { return {} } })(), today = new Date().toISOString().slice(0, 10);
  const seen = prevVers.map(r => new Set((r.groups || []).flatMap(g => g.items || []).filter(i => i.status !== 'ok').map(i => i.id)));
  for (const it of all) { if (it.status !== 'warn') continue; const n = seen.filter(s => s.has(it.id)).length; if (!n) continue;
    it.repeat = n + 1; const k = knownAll[it.id], exp = k && (String(k).match(/期限\s*(\d{4}-\d{2}-\d{2})/) || [])[1];
    // 「⚠️ だけ」と決めた検査（項目の warnOnly に、だれがいつ決めたか）は、くり返しても ❌ に上げない。くり返しの回数は出す（v0.97.5 レビュー：ゲーム内 S2）
    if (it.warnOnly) { it.detail = `くり返し（${it.repeat}回目。⚠️ だけの検査：${it.warnOnly}）：` + it.detail; continue }
    if (it.repeat >= 3 && k && exp && exp >= today)   // 期限のない登録は通さない（CodeRabbit PR #119）
      { it.status = 'known'; it.detail = `くり返し（${it.repeat}回目、修正待ち：${k}）` + it.detail }
    else if (it.repeat >= 3) { it.status = 'fail'; it.detail = `くり返しの ⚠️（${it.repeat}回目：直近${prevVers.length}版のうち${n}版にも出た）。直すか、known.json に期限付きで入れる${exp ? `（known.json の期限 ${exp} が過ぎた）` : k ? '（known.json に期限がない）' : ''}：` + it.detail }
    else it.detail = `くり返し（${it.repeat}回目）：` + it.detail } }

// 3版まとめの勝率（v0.97.9 レビュー：第2章が 13%→0%→0% と3版続いたが、1版8回だと許す幅が ±38 もあり、どの版も ✅ だった）
//   今の版と直近の公開版（qa-results の v<版>/result.json）の勝ち負け（games）を足して、基準と比べる。回数が増えるので幅は 2×標準誤差（最低の 15 ポイントは付けない）
//   ⚠️ だけ（版が重なるので、くり返しで ❌ に上げない）
if (prevVers.length >= 2) {
  const prevWr = id => prevVers.slice(-2).map(r => (r.groups || []).flatMap(g => g.items || []).find(i => i.id === id)).filter(i => i && i.games);
  const g = groups.find(x => x.key === 'winrate');
  for (const it of g ? [...g.items] : []) { const m = /^winrate:ch(\d+)$/.exec(it.id); if (!m || !it.games) continue;
    const ps = prevWr(it.id); if (ps.length < 2) continue;
    const gs = [it.games, ...ps.map(i => i.games)].join('').replace(/E/g, ''), w = (gs.match(/W/g) || []).length, n = gs.length, rate = n ? w / n : 0;
    const base = baseline.winrate && baseline.winrate['ch' + m[1]]; if (!base || !n) continue;
    const se = Math.sqrt(Math.max(base.rate * (1 - base.rate), 0.05) * (1 / base.n + 1 / n)), tol = 2 * se, low3 = base.rate >= 0.1 && rate < base.rate / 3, out3 = Math.abs(rate - base.rate) > tol || low3;   // 下の線：幅の下端が 0 未満になる章（第2章 基準17%±22）は外れが出ないので、基準の 1/3 より下も ⚠️（v0.97.10 レビュー 3）
    const it3 = { id: 'winrate3:ch' + m[1], title: `第${m[1]}章の勝率（3版まとめ）`, status: out3 ? 'warn' : 'ok', warnOnly: '3版まとめは版が重なるので ⚠️ だけ（v0.97.9 レビュー）',
      detail: `勝率 ${Math.round(rate * 100)}%（${w}/${n}、今の版と ${ps.length}版前まで）、基準 ${Math.round(base.rate * 100)}%（許す幅 ±${Math.round(tol * 100)}${base.rate - tol < 0 ? `、下は基準の1/3＝${Math.round(base.rate / 3 * 100)}%` : ''}）${out3 ? `：3版続けて基準から外れている。章の強さか、打ち手（qa の自動の打ち手）を見る` : ''}` };
    g.items.splice(g.items.indexOf(it) + 1, 0, it3); all.push(it3) } }

// main の QA が ❌ のまま（v0.97.9 レビュー：main の ❌ の Issue #124 が開いたまま、次の版の PR が ✅ で出ていった）
//   ラベル ci-failure の開いた Issue があれば、PR のまとめの一番上に「main の CI ❌ のまま（#番号）」を出す。読めなかったら ⚠️（黙って飛ばさない）
//   QA だけでなく、公開・リンク・サイトの見張りなどの Issue も出す（どれも main が壊れたままという知らせ。CodeRabbit PR #125 で QA だけと誤って読める題を直した）
let mainRed = '';
if (process.env.GITHUB_ACTIONS && process.env.GITHUB_REPOSITORY) {
  const tok = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
  try {
    // ページをたどる（PR も Issue の一覧に混ざるので、PR を除く前に全部読む。CodeRabbit PR #125）
    const raw = [];
    for (let pg = 1; pg <= 10; pg++) {
      const a = ['-sfS', '--max-time', '20', '-H', 'Accept: application/vnd.github+json', ...(tok ? ['-H', 'Authorization: Bearer ' + tok] : []), `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/issues?labels=ci-failure&state=open&per_page=100&page=${pg}`];
      const page = JSON.parse(require('child_process').execFileSync('curl', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64e6 }));   // 100件の本文が 1MB（既定）を超えても読めるように（CodeRabbit PR #125）
      raw.push(...page); if (page.length < 100) break }
    const iss = raw.filter(i => !i.pull_request);
    if (iss.length) { mainRed = iss.map(i => `#${i.number}「${String(i.title).slice(0, 40)}」`).join('、');
      // PR では、どの Issue も「本文に Closes #番号」か「Issue に人（ボットでない）の書き込み＝直さない理由」が無ければ ❌（v0.98.5 レビュー：#131・#139 と2回、決まりを書いただけでは守られなかった）
      //   本文を直しても CI は回り直さない（qa.yml の types）ので、Closes は PR を作るときに書く。main への push では ⚠️ のまま
      let ev = {}; try { ev = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')) } catch (e) {}
      const pr = ev.pull_request, body = String(pr && pr.body || ''), unhandled = [];
      if (pr) for (const i of iss) {
        if (new RegExp(`\\b(close[sd]?|fix(e[sd])?|resolve[sd]?)\\s+#${i.number}\\b`, 'i').test(body)) continue;
        let cm = []; try { const a = ['-sfS', '--max-time', '20', '-H', 'Accept: application/vnd.github+json', ...(tok ? ['-H', 'Authorization: Bearer ' + tok] : []), `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/issues/${i.number}/comments?per_page=100`];
          cm = JSON.parse(require('child_process').execFileSync('curl', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64e6 })) } catch (e) { cm = null }
        if (cm && cm.some(c => c.user && c.user.type !== 'Bot')) continue;
        unhandled.push(`#${i.number}${cm ? '' : '（書き込みを読めなかった）'}`) }
      const it = unhandled.length ? { id: 'ci:main-red', title: 'main の CI が ❌ のまま', status: 'fail', detail: `開いている CI 失敗の Issue：${mainRed}。${unhandled.join('・')} は、この PR の本文に「Closes #番号」も、Issue に直さない理由の書き込みも無い。直すなら PR の本文に「Closes #番号」、直さないなら Issue に理由を書いてから CI を回し直す` }
        : { id: 'ci:main-red', title: 'main の CI が ❌ のまま', status: 'warn', warnOnly: 'Issue を閉じれば消える（v0.97.9 レビュー）', detail: `開いている CI 失敗の Issue：${mainRed}。${pr ? 'どれもこの PR の本文の Closes か Issue の理由の書き込みがある' : 'この PR で直すなら本文に「Closes #番号」、直さないなら Issue に理由を書く'}` };
      all.push(it); let g = groups.find(x => x.key === 'ci'); if (!g) groups.unshift(g = { key: 'ci', name: 'CI', items: [] }); g.items.push(it) }
  } catch (e) { const it = { id: 'ci:main-red', title: 'main の CI が ❌ のままかの確認', status: 'warn', detail: 'CI 失敗の Issue を読めなかった：' + String(e && e.message || e).split('\n')[0].slice(0, 120) };
    all.push(it); let g = groups.find(x => x.key === 'ci'); if (!g) groups.unshift(g = { key: 'ci', name: 'CI', items: [] }); g.items.push(it) }
}

const cnt = s => all.filter(i => i.status === s).length;
const icon = { ok: '✅', fail: '❌', warn: '⚠️', known: '🟡' };
const fails = all.filter(i => i.status === 'fail'), warns = all.filter(i => i.status === 'warn').sort((a, b) => (b.repeat || 0) - (a.repeat || 0)), fixed = all.filter(i => i.fixed);   // くり返しの ⚠️ を上に
const line = i => `- ${i.title}：${String(i.detail).replace(/\n/g, ' ')}${i.shot ? `（${i.shot.replace(/\.png$/, '.jpg')}）` : ''}`;
const sha = (process.env.GITHUB_SHA || '').slice(0, 7), when = new Date().toISOString().slice(0, 16).replace('T', ' ');
const head = (mainRed ? `> **⚠️ main の CI ❌ のまま（${mainRed}）**\n\n` : '') + `対象: index.html（APP_VERSION ${ver}）、${quick ? '短い版' : '長い版（公開前）'}、GitHub ${sha}、${when} UTC\n\n` +
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
