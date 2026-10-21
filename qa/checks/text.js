// 文言のチェック：satou さんの決めごと（「夜」を名前に使わない、「あの夜」と書かない、会話にお金の話を入れない）
'use strict';
const fs = require('fs');
const H = require('../lib/harness');

// 会話にお金の話：金額＋負け/勝ち/借り、円、借金、給料、家賃など
const MONEY = /([0-9０-９一二三四五六七八九十百千]+\s*(万|千)\s*(円|も|負け|勝ち|勝っ|負け|すっ|溶か|借り))|[0-9０-９]+円|借金|給料|家賃|ローン|取り返す|負けが込/;

async function run({ browser, file, baseline }) {
  const src = fs.readFileSync(file, 'utf8'), items = [];
  // 1. あの夜
  const anoyoru = (src.match(/あの夜/g) || []).length;
  items.push({ id: 'text:anoyoru', title: '「あの夜」を使っていない（「あの日」にする）', status: anoyoru ? 'fail' : 'ok', detail: anoyoru ? `${anoyoru}か所` : '0か所' });
  // 2. 名前に「夜」：章・店・称号・店のルール・ボタン・見出し
  const { ctx, page } = await H.openGame(browser, file, { storage: H.UNLOCKED });
  let names = [];
  try {
    names = await page.evaluate(() => {
      const out = [];
      const add = (k, v) => { if (v) out.push([k, String(v)]) };
      (typeof CHAPTERS !== 'undefined' ? CHAPTERS : []).forEach(c => { add(`第${c.no}章の題`, c.title); add(`第${c.no}章の店`, c.venue); add(`第${c.no}章の目標`, c.goalText) });
      (typeof PART2 !== 'undefined' ? PART2 : []).forEach(c => { add(`第${c.no}章の題`, c.title); add(`第${c.no}章の店`, c.venue); add(`第${c.no}章の目標`, c.goalText) });
      (typeof TITLES !== 'undefined' ? TITLES : []).forEach(t => add(`称号 ${t.id}`, t.name));
      if (typeof HOUSE !== 'undefined') for (const k in HOUSE) add(`店のルール ${k}`, HOUSE[k].name);
      document.querySelectorAll('button, h1, h2, h3, .vst, title').forEach(b => { const t = (b.textContent || '').trim(); if (t && t.length < 30) add(`ボタン・見出し ${b.id || b.tagName}`, t) });
      return out;
    });
  } finally { await ctx.close() }
  const yoru = names.filter(([k, v]) => /夜/.test(v));
  items.push({ id: 'text:yoru-names', title: '名前（章の題・店・称号・ボタン）に「夜」がない', status: yoru.length ? 'fail' : 'ok',
    detail: yoru.length ? yoru.slice(0, 6).map(([k, v]) => `${k}「${v}」`).join('、') : `${names.length}個の名前を確認、0件` });
  // 3. 会話のお金の話：['名前','セリフ'] の形と、lines: の文字列から探す
  const lines = new Set();
  const re = /\[\s*["'][^"'\]]{0,8}["']\s*,\s*["']([^"'\n]{2,200})["']/g;
  let m; while ((m = re.exec(src))) if (MONEY.test(m[1])) lines.add(m[1].slice(0, 60));
  const re2 = /lines\s*:\s*\[([^\]]{0,4000})\]/g;
  while ((m = re2.exec(src))) (m[1].match(/["']([^"'\n]{2,200})["']/g) || []).forEach(s => { s = s.slice(1, -1); if (MONEY.test(s)) lines.add(s.slice(0, 60)) });
  const known = new Set((baseline && baseline.moneyLines) || []);
  const fresh = [...lines].filter(x => !known.has(x));
  items.push({ id: 'text:money', title: '会話にお金の話がない', status: fresh.length ? 'fail' : lines.size ? 'known' : 'ok',
    detail: fresh.length ? '新しく見つかったセリフ: ' + fresh.slice(0, 5).map(x => `「${x}」`).join('、') : lines.size ? `前から基準に入っている ${lines.size}件（中身を見て、問題なければそのまま）: ` + [...lines].slice(0, 3).map(x => `「${x}」`).join('、') : '0件', list: [...lines] });
  // 配り方を変える関数があるなら、遊び方のページの「公平」の説明（日英）にそのことが書いてある（改善提案 第12回 0-1：10-17 に易しくしたが、説明は「毎回ふつうにシャッフル」のままだった）
  // 配りを変える関数を足したら DEAL_CHANGERS にも足す
  { // 配りを変える関数と、説明に書くべき語（日・英）。配りを変える関数を足したら、ここにも足す（v0.97.8 レビュー：p6Premium の「強い手への入れ替え」が説明に無かった）
    const DEAL_CHANGERS = { dealHelp: ['弱い手', /weak starting hands?/i], p6Premium: ['強い手', /strong hand/i] },
      has = Object.keys(DEAL_CHANGERS).filter(f => new RegExp('function\\s+' + f + '\\s*\\(').test(src));
    const hm = [...src.matchAll(/class="hnote">([^`]{0,800}?)<\/p>/g)].map(m => m[1]).find(t => /シャッフル/.test(t)), ja = hm || '';   // 公平の説明＝シャッフルの話をしている hnote
    // 英語は、その説明の訳（EN_DICT の「シャッフル…」の行で、日本語が今の説明と同じもの）だけを見る。ほかの所に同じ語句があっても通さない
    const enRow = [...src.matchAll(/"([^"\n]{0,600}シャッフル[^"\n]{0,600})"\s*:\s*"([^"\n]{0,1200})"/g)].find(m => ja && ja.includes(m[1])), en = enRow ? enRow[2] : '';
    const miss = has.flatMap(f => { const [j, e] = DEAL_CHANGERS[f]; return [...(ja.includes(j) ? [] : [`日本語に「${j}」がない（${f}）`]), ...(e.test(en) ? [] : [`英語に ${e} がない（${f}）`])] });
    items.push({ id: 'text:fair-note', title: '配り方を変えているときは、遊び方のページの公平の説明（日英）にそのことが書いてある',
      status: !has.length ? 'ok' : !hm ? 'fail' : miss.length ? 'fail' : 'ok',
      detail: !has.length ? '配りを変える関数なし' : !hm ? '遊び方のページの説明（class="hnote"）が見つからない' : miss.length ? `配り方を変えたのに、遊び方の説明が古い：${miss.join('、')}` : `${has.join('・')} あり、説明（日英）に全部書いてある` }) }
  return { name: '文言', items, baselineOut: { moneyLines: [...lines] } };
}
module.exports = { run };
