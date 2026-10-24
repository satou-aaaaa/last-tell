// ルールの計算だけを Node に読み込む（ブラウザを開かない）。2026-10-14 ルールの単体テスト
//   load(組み立てた.html か src のフォルダ) → { bestN, cmp, eval5, …, Rules }
// ゲームの中の「// @unit-begin 名前」〜「// @unit-end 名前」の間だけを取り出して、空の箱（vm）の中で動かす。
// 画面（document）やゲームの状態（S・CFG）は箱に無いので、間に入れたコードがそれに触ると、ここでエラーになる。
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
// 印が無い古い版（v0.74 まで）でも、役の判定だけは見出しから取り出せる
const OLD_EVAL = /\/\* ---------- 山札・役判定 ---------- \*\/[\s\S]*?(?=\n\/\/ ===== 配る札の乱数に種)/;
const NAMES = ['fullDeck', 'shuffle', 'eval5', 'cmp', 'bestNSlow', 'bestN', 'groupCat', 'isWeak', 'preTier', 'Rules'];
function blocks(text) {
  const out = {};
  for (const m of text.matchAll(/\/\/ @unit-begin (\w+)[^\n]*\n([\s\S]*?)\/\/ @unit-end \1/g)) out[m[1]] = m[2];
  if (!out.deck_eval) { const m = text.match(OLD_EVAL); if (m) out.deck_eval = m[0] }
  return out;
}
function load(target) {
  let text;
  if (fs.statSync(target).isDirectory()) {
    const order = JSON.parse(fs.readFileSync(path.join(target, 'order.json'), 'utf8'));
    text = order.filter(f => f.endsWith('.js')).map(f => fs.readFileSync(path.join(target, f), 'utf8')).join('\n');
  } else text = fs.readFileSync(target, 'utf8');
  const b = blocks(text);
  if (!b.deck_eval) throw new Error('役の判定（19_deck_eval.js）が見つからない');
  // 乱数は種を固定する（毎回同じ結果になるように）
  let st = 12345;
  const rand = () => { st = (st + 0x6D2B79F5) >>> 0; let t = st; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 };
  const box = vm.createContext({ LT: { rand }, HAND_JP: ['ハイカード', 'ワンペア', 'ツーペア', 'スリーカード', 'ストレート', 'フラッシュ', 'フルハウス', 'フォーカード', 'ストレートフラッシュ'] });
  const code = Object.values(b).join('\n') + `\n;({${NAMES.map(n => `${n}:typeof ${n}==='undefined'?undefined:${n}`).join(',')}})`;
  const g = vm.runInContext(code, box, { filename: 'unit-blocks.js' });
  g.rand = rand; g.blocks = Object.keys(b); g.text = text;
  return g;
}
module.exports = { load };
