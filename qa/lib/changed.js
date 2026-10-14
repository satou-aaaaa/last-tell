// 変えたファイルから、回す検査を選ぶ（開発スピード 案2、2026-10-10）
//   node run_all.js 作ったファイル.html --changed v62 [--src 作業場所/src]
//   → dev/snapshots/v62.tar.gz と src を比べ、変わったファイルに関係する検査だけを回す。
//   全部の検査は、版を出す前に1回（--changed なし）で回す。
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// 安い検査（合わせて20秒ほど）はいつも回す
const ALWAYS = ['text', 'script', 'ftue', 'a11y', 'perf'];

// [ファイル名に合う正規表現, 回す検査]（上から順に全部見る。どれにも合わなければ全部）
const RULES = [
  [/\.css$|^0[02]_.*\.html$|^99_tail\.html$/, ['ui', 'uiux']],
  [/^js\/.*\.js$/, ['fuzz']], // JS を変えたら、止まらない・エラーが出ないかは必ず見る
  [/^js\/(0[3-4]|09|1[378]|21|22|24|26|27|28|29|30|31)[a-z]?_/, ['ui', 'uiux']], // 絵・画面・演出・ボタン
  [/^js\/(01b?_en|01_i18n|0[5-8]|12|26)[a-z]?_/, ['script']], // セリフ・英語（英語の取りこぼしは fuzz が見る）
  [/^js\/16[a-z]?_/, ['save']], // 保存キー
  [/^js\/(11|19|20|23)[a-z]?_/, ['basics', 'rules']], // ポーカーの進め方・ルール
  [/^js\/(02|10|14|15|25)[a-z]?_/, ['winrate', 'rules', 'basics']], // CPU・章・配り札（第1〜3章の勝率を守る）
  [/^js\/(00|01|17|18|29|31)[a-z]?_/, ['save']], // 進み・名前・身なり（引き継ぎに関わる）
];
const KNOWN = /^(js\/\d\d[a-z]?_[a-z0-9_]+\.js|\d\d[a-z]?_[a-z0-9_]+\.(css|html)|order\.json)$/;

function readSnapshot(ver) {
  const p = path.join(__dirname, '../../dev/snapshots', ver + '.tar.gz');
  if (!fs.existsSync(p)) throw new Error('控えがない: ' + p);
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'snap-'));
  execFileSync('tar', ['xzf', p, '-C', tmp]);
  return path.join(tmp, 'src');
}
function list(d) {
  const out = [];
  (function walk(r) { for (const f of fs.readdirSync(r)) { const q = path.join(r, f); fs.statSync(q).isDirectory() ? walk(q) : out.push(path.relative(d, q).split(path.sep).join('/')) } })(d);
  return out;
}

// 変わったファイルと、回す検査を返す
function pick(ver, srcDir) {
  const old = readSnapshot(ver), files = new Set([...list(old), ...list(srcDir)]), changed = [];
  for (const f of files) {
    const a = path.join(old, f), b = path.join(srcDir, f);
    const x = fs.existsSync(a) ? fs.readFileSync(a) : null, y = fs.existsSync(b) ? fs.readFileSync(b) : null;
    if (!x || !y || !x.equals(y)) changed.push(f);
  }
  fs.rmSync(path.dirname(old), { recursive: true, force: true });
  const checks = new Set(ALWAYS), why = {};
  let all = false;
  for (const f of changed) {
    if (f === 'order.json') { ['fuzz', 'ui', 'uiux', 'save'].forEach(c => checks.add(c)); continue } // 新しいファイルは、そのファイル自身でも選ばれる
    if (!KNOWN.test(f)) { all = true; why[f] = '全部（分からないファイル）'; continue }
    const rules = RULES.filter(([re]) => re.test(f));
    if (/\.js$/.test(f) && rules.length < 2) { all = true; why[f] = '全部（どの検査に関わるか決めていないファイル）'; continue }
    const hit = [...new Set(rules.flatMap(([, c]) => c))];
    hit.forEach(c => checks.add(c));
    why[f] = hit.join(',') || '安い検査だけ';
  }
  return { changed, checks: all ? null : [...checks], why };
}
module.exports = { pick };
