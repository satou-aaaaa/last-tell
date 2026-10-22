// 型で配る場面の台詞に、札の名前が直接書かれていないか（2026-10-22）
// 型（js/54_deal_mod.js の Rules.kata）は配るたびに数字・マーク・並びを変える。だから台詞に「AA」「セット」「フラッシュ」と
// 書くと、配られた札と合わなくなる（v0.98.11 で直した第5章の AA/KK/QQ）。札に合わせたい台詞は Rules.kata.bbLine のように配った札から作る。
// 見るもの：第4・5章の一騎打ち（FINAL_DUEL59）、型を配る台本の中の文字（kataDeal の後ろ）、型の章のあらすじ（RECAP 4・5・7・13・15）、
//   第5章の最初の1手のうわさ（NEXT_VOICES の 'aa'）、型の相手（ハヤト・レイカ・ジン・カイ・師匠）の負かしたときのひとこと（LINES の gloat）。
// 回想（FLASH）は札が決まっているので見ない。
'use strict';
const vm = require('vm');
const CARD = /(?<![A-Za-z0-9])(?:[AKQJT][AKQJT2-9]?s?|[2-9]{2})(?![A-Za-z0-9])|ペア|セット|トリップス|フラッシュ|ストレート|フルハウス|フォーカード|エース|キング|クイーン|ジャック|ハート|スペード|ダイヤ|クラブ|[♠♥♦♣]/;
const JA = /[ぁ-んァ-ン一-龯]/;
const EN_CARD = /\b(?:aces?|kings?|queens?|jacks?|tens?|pairs?|sets?|trips|flush(?:es)?|straights?|full house|quads)\b/i;   // 英訳（EN_DICT）の札の名前。CARD に /i を付けると英語の a まで拾うので分ける
const BOSSES = ['ハヤト', 'レイカ', 'ジン', 'カイ', '師匠'];
function objAt(text, name) {   // const NAME={...} の {...} を括弧の数で切り出す（文字列の中の括弧も数えないように）
  const i = text.indexOf('const ' + name + '=');
  if (i < 0) return null;
  let j = text.indexOf('{', i), d = 0, q = null;
  for (let k = j; k < text.length; k++) {
    const c = text[k];
    if (q) { if (c === '\\') k++; else if (c === q) q = null; continue }
    if (c === '"' || c === "'" || c === '`') q = c;
    else if (c === '{') d++;
    else if (c === '}' && --d === 0) return text.slice(j, k + 1);
  }
  return null;
}
const evalObj = src => { try { return vm.runInNewContext('(' + src + ')', {}) } catch (e) { return null } };
function strings(o, out, where) {
  if (typeof o === 'string') out.push([where, o]);
  else if (Array.isArray(o)) o.forEach((v, i) => strings(v, out, where + '[' + i + ']'));
  else if (o && typeof o === 'object') for (const k of Object.keys(o)) strings(o[k], out, where + '.' + k);
  return out;
}
module.exports = G => {
  const text = G.text || '';
  if (!text.includes('kataDeal(')) return [{ id: 'unit:kata-text', title: '型で配る場面の台詞に札の名前が無い', ok: null, detail: '型（kataDeal）が無い版なので見ない' }];
  const lines = [], gone = [];
  const duel = evalObj(objAt(text, 'FINAL_DUEL59') || '');
  if (duel) strings(duel, lines, '一騎打ち'); else gone.push('FINAL_DUEL59');
  const recap = evalObj(objAt(text, 'RECAP') || '');
  if (recap) for (const k of ['4', '5', '7', '13', '15']) if (recap[k]) lines.push(['あらすじ ' + k, recap[k]]); else gone.push('RECAP ' + k);
  else gone.push('RECAP');
  const nv = evalObj(objAt(text, 'NEXT_VOICES') || '');
  if (nv) strings(nv, [], 'うわさ').forEach(([w, s], i, all) => { if (s === 'aa' && i > 0) lines.push([all[i - 1][0], all[i - 1][1]]) });
  else gone.push('NEXT_VOICES');
  const L = evalObj(objAt(text, 'LINES') || '');
  if (L) for (const b of BOSSES) if (L[b] && L[b].gloat) strings(L[b].gloat, lines, b + ' の gloat');
  if (!L) gone.push('LINES');
  // 型を配る台本：kataDeal(…) から、その場面の終わり（次の if(sc=== か、行頭の }）まで。注釈（// …）は除く
  for (const m of text.matchAll(/kataDeal\('(\w+)'/g)) {
    if (m[1] === 'bb') continue;   // 第5章の最初の1手は unit:kata-line が配った札ごとに見る
    let seg = text.slice(m.index, m.index + 4000);
    const end = seg.search(/\n\s*if\(sc===|\n\}/); if (end > 0) seg = seg.slice(0, end);
    seg = seg.replace(/\/\/[^\n]*/g, '');
    for (const s of seg.matchAll(/'([^'\n]*)'|`([^`\n]*)`/g)) lines.push(['台本 ' + m[1], s[1] || s[2] || '']);
  }
  // 英訳も見る（日本語の台詞に対応する EN_DICT の訳。CodeRabbit #149）
  const en = evalObj(objAt(text, 'EN_DICT') || '');
  if (!en) gone.push('EN_DICT');
  const checked = lines.filter(([, s]) => JA.test(s)).flatMap(([w, s]) => [[w, s, CARD]].concat(en && typeof en[s] === 'string' ? [[w + '（英語）', en[s], EN_CARD]] : []));
  const bad = checked.filter(([, s, re]) => re.test(s)).map(([w, s, re]) => `${w}「${s.slice(0, 30)}」（${s.match(re)[0]}）`);
  return [{ id: 'unit:kata-text', title: '型で配る場面の台詞に札の名前が無い（配る札が毎回変わるため）', ok: !bad.length && !gone.length,
    detail: gone.length ? '見る場所が見つからない：' + gone.join('、') : bad.length ? bad.slice(0, 5).join(' / ') + (bad.length > 5 ? ` ほか${bad.length - 5}件` : '') : `${checked.length}行を見た（英訳 ${checked.length - lines.filter(([, s]) => JA.test(s)).length}行を含む）` }];
};
