// 台詞の変化：前の版と比べて、足した・変えた・消した台詞を話す人ごとに並べる（2026-10-14 CIのチェック充実 案6）
//   版ごとのレビュー（クリエイター目線・交代レビュー）は、ゲームのファイルを読まずに lines_diff.md だけを読めばよい
//   前の版：QA_PREV_HTML（CI では main の index.html）の最初のもの。手元では --prev は無いので飛ばす
'use strict';
const fs = require('fs');
const path = require('path');
const S = require('./script');

async function run({ browser, file, outDir }) {
  const prev = (process.env.QA_PREV_HTML || '').split(',').filter(Boolean).map(x => x.split('=')).find(([, f]) => f && fs.existsSync(f));
  if (!prev) return { name: '台詞の変化', items: [{ id: 'lines:diff', title: '前の版から変わった台詞の一覧', status: 'warn', detail: '比べる前の版（QA_PREV_HTML）が無いので飛ばした。CI では main の index.html と比べる' }] };
  const [now, old] = [await S.collect(browser, file), await S.collect(browser, prev[1])];
  const key = ([w, t]) => w + '\t' + t;
  const oldSet = new Set(old.map(key)), nowSet = new Set(now.map(key));
  const added = [...new Map(now.filter(l => !oldSet.has(key(l))).map(l => [key(l), l])).values()];
  const removed = [...new Map(old.filter(l => !nowSet.has(key(l))).map(l => [key(l), l])).values()];
  // 気をつける印：英語にならない、一人称が早見表と違う、言ってはいけない言い方、長い、お金・「夜」
  const strip = t => t.replace(/「[^」]*」/g, '');
  const flags = ([who, t, jp]) => {
    const f = [];
    if (jp) f.push('英語なし');
    const own = S.FIRST[who]; if (own && S.FP.some(w => w !== own && strip(t).includes(w) && !(/^(わたし|あたし)$/.test(own) && w === 'わし'))) f.push('一人称');
    for (const [w, re, why] of S.NEVER) if (who === w && re.test(strip(t))) f.push(why);
    if (t.length > 70) f.push(`${t.length}字`);
    if (/[0-9０-９一二三四五六七八九十百千]+\s*(万|円|ドル)|負けてる|勝ってる額/.test(t)) f.push('お金？');
    if (/夜/.test(t)) f.push('「夜」');
    return f;
  };
  const by = list => { const m = {}; for (const l of list) (m[l[0]] = m[l[0]] || []).push(l); return m };
  let md = `# 台詞の変化（前の版 v0.${prev[0]} → 今）\n\n足した ${added.length}行、消した ${removed.length}行（全部で ${now.length}行）。⚑ は気をつける印。\n\n`;
  const flagged = added.filter(l => flags(l).length);
  if (flagged.length) md += `## ⚑ 印の付いた新しい台詞（${flagged.length}行）\n\n` + flagged.map(l => `- ${l[0]}「${l[1]}」 ⚑${flags(l).join('・')}`).join('\n') + '\n\n';
  if (added.length) md += `## 足した・変えた台詞\n\n` + Object.entries(by(added)).map(([w, ls]) => `### ${w}（${ls.length}）\n` + ls.map(l => `- 「${l[1]}」${flags(l).length ? ' ⚑' + flags(l).join('・') : ''}`).join('\n')).join('\n\n') + '\n\n';
  if (removed.length) md += `## 消えた台詞（変えた台詞の前の形を含む）\n\n` + Object.entries(by(removed)).map(([w, ls]) => `### ${w}（${ls.length}）\n` + ls.map(l => `- 「${l[1]}」`).join('\n')).join('\n\n') + '\n';
  fs.writeFileSync(path.join(outDir, 'lines_diff.md'), md);
  return { name: '台詞の変化', items: [{ id: 'lines:diff', title: '前の版から変わった台詞の一覧（lines_diff.md）', status: flagged.length ? 'warn' : 'ok',
    detail: `v0.${prev[0]} から 足した ${added.length}行・消した ${removed.length}行` + (flagged.length ? `。印の付いた新しい台詞 ${flagged.length}行: ` + flagged.slice(0, 3).map(l => `${l[0]}「${l[1].slice(0, 20)}」⚑${flags(l).join('・')}`).join('、') : '') }] };
}
module.exports = { run };
