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
  let names = [], deal = { has: false };
  try {
    ({ list: names, deal } = await page.evaluate(() => {
      const out = [];
      const add = (k, v) => { if (v) out.push([k, String(v)]) };
      (typeof CHAPTERS !== 'undefined' ? CHAPTERS : []).forEach(c => { add(`第${c.no}章の題`, c.title); add(`第${c.no}章の店`, c.venue); add(`第${c.no}章の目標`, c.goalText) });
      (typeof PART2 !== 'undefined' ? PART2 : []).forEach(c => { add(`第${c.no}章の題`, c.title); add(`第${c.no}章の店`, c.venue); add(`第${c.no}章の目標`, c.goalText) });
      (typeof TITLES !== 'undefined' ? TITLES : []).forEach(t => add(`称号 ${t.id}`, t.name));
      if (typeof HOUSE !== 'undefined') for (const k in HOUSE) add(`店のルール ${k}`, HOUSE[k].name);
      document.querySelectorAll('button, h1, h2, h3, .vst, title').forEach(b => { const t = (b.textContent || '').trim(); if (t && t.length < 30) add(`ボタン・見出し ${b.id || b.tagName}`, t) });
      const __deal = { has: typeof LT !== 'undefined' && Array.isArray(LT.DEAL_MODS), note: typeof LT !== 'undefined' && LT.DEAL_NOTE || null, mods: typeof LT !== 'undefined' && Array.isArray(LT.DEAL_MODS) ? LT.DEAL_MODS.map(m => m.name) : [] };
      return { list: out, deal: __deal };
    }));
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
  // 配り方を変えているなら、遊び方のページの「公平」の説明（日英）にそのことが書いてある（改善提案 第12回 0-1：10-17 に易しくしたが、説明は「毎回ふつうにシャッフル」のままだった）
  // 配りを変える仕組みは js/54_deal_mod.js の入口 LT.dealMod に登録する。説明に要る語はゲームの LT.DEAL_NOTE（§8-3：調整していることを一文で。フリー対戦が公平なことも）。
  // 入口の無い古い版だけ、前の表（関数の名前と語）で見る
  {
    const hm = [...src.matchAll(/class="hnote">([^`]{0,800}?)<\/p>/g)].map(m => m[1]).find(t => /シャッフル/.test(t)), ja = hm || '';   // 公平の説明＝シャッフルの話をしている hnote
    // 英語は、その説明の訳（EN_DICT の「シャッフル…」の行で、日本語が今の説明と同じもの）だけを見る。ほかの所に同じ語句があっても通さない
    const enRow = [...src.matchAll(/"([^"\n]{0,600}シャッフル[^"\n]{0,600})"\s*:\s*"([^"\n]{0,1200})"/g)].find(m => ja && ja.includes(m[1])), en = enRow ? enRow[2] : '';
    let need = [], what = '';
    if (deal.has) { const N = deal.note || { ja: [], en: [] }; need = N.ja.map(w => [w, x => ja.includes(x), '日本語', w]).concat(N.en.map(w => [w, x => en.toLowerCase().includes(x.toLowerCase()), '英語', w]));
      what = deal.note ? `入口 LT.DEAL_MODS（${deal.mods.join('・')}）` : '' }
    else { const OLD = { dealHelp: ['弱い手', /weak starting hands?/i], p6Premium: ['強い手', /strong hand/i] }, has = Object.keys(OLD).filter(f => new RegExp('function\\s+' + f + '\\s*\\(').test(src));
      need = has.flatMap(f => [[OLD[f][0], x => ja.includes(x), '日本語', f], [OLD[f][1], x => x.test(en), '英語', f]]); what = has.join('・') }
    const miss = need.filter(([w, f]) => !f(w)).map(([w, , l, f]) => `${l}に「${w}」がない${w === f ? '' : `（${f}）`}`);
    const noNote = deal.has && !deal.note;
    items.push({ id: 'text:fair-note', title: '配り方を変えているときは、遊び方のページの公平の説明（日英）にそのことが書いてある',
      status: noNote ? 'fail' : !need.length ? 'ok' : !hm ? 'fail' : miss.length ? 'fail' : 'ok',
      detail: noNote ? '配りを変える入口（LT.DEAL_MODS）があるのに、説明に要る語（LT.DEAL_NOTE）が無い' : !need.length ? '配りを変える関数なし' : !hm ? '遊び方のページの説明（class="hnote"）が見つからない' : miss.length ? `配り方を変えたのに、遊び方の説明が古い：${miss.join('、')}` : `${what} あり、説明（日英）に「${need.map(x => x[0]).join('」「')}」が書いてある` });
    // 決まった札だと分かる言葉を、画面の文字とログに出さない（§8-3・8-5。satou 2026-10-21 18:33Z「固定されたものを配っていると、遊んでいる人が気付かないように」）。
    // ゲームの中の文字（コメントの外）を見る。公平の説明の文（上の hnote とその英訳）はこの検査の外
    const skip = [hm ? [src.indexOf(hm), src.indexOf(hm) + hm.length] : null, enRow ? [enRow.index, enRow.index + enRow[0].length] : null].filter(Boolean);
    const inComment = i => { const ls = src.lastIndexOf('\n', i) + 1, pre = src.slice(ls, i); if (/(^|[\s;,{}()])\/\//.test(pre)) return true; const b = src.lastIndexOf('/*', i); if (b >= 0 && b > src.lastIndexOf('*/', i)) return true; const h = src.lastIndexOf('<!--', i); return h >= 0 && h > src.lastIndexOf('-->', i) };
    const BAN = [/物語の一手/g, /決まった札/g, /自動で進みます/g, /story hand/gi, /fixed cards/gi, /plays automatically/gi], found = [];
    for (const re of BAN) for (const m of src.matchAll(re)) { if (inComment(m.index) || skip.some(([a, b]) => m.index >= a && m.index < b)) continue; found.push(src.slice(Math.max(0, m.index - 20), m.index + m[0].length + 20).replace(/\s+/g, ' ')) }
    items.push({ id: 'text:deal-hidden', title: '画面とログに、決まった札だと分かる言葉（物語の一手・決まった札・自動で進みます／story hand・fixed cards・plays automatically）が無い',
      status: found.length ? 'fail' : 'ok', detail: found.length ? `${found.length}か所：` + found.slice(0, 5).map(x => `「${x}」`).join('、') : '0か所（説明の文とコメントは見ない）' });
  }
  return { name: '文言', items, baselineOut: { moneyLines: [...lines] } };
}
module.exports = { run };
