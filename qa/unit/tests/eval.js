// 役の判定（19_deck_eval.js の bestN・eval5・cmp）。もとは basics の basic:eval（ブラウザの中で2万回）
'use strict';
const R = require('../ref_eval');
// 名前、7枚、7枚、強さの関係（< = >）
const FIXED = [
  ['ホイール（A-2-3-4-5）は6ハイのストレートより弱い', 'As 2d 3c 4h 5s Kd Qc', '2s 3d 4c 5h 6s Kd Qc', '<'],
  ['ロイヤルはストレートフラッシュより強い', 'As Ks Qs Js Ts 2d 3c', 'Ks Qs Js Ts 9s 2d 3c', '>'],
  ['フルハウスは3枚の方の数で比べる', '3s 3d 3c 2h 2s 9d 8c', '2s 2d 2c Ah As 9d 8c', '>'],
  ['ツーペアは3枚目（キッカー）で比べる', 'Ks Kd 7c 7h As 3d 2c', 'Ks Kd 7c 7h Qs 3d 2c', '>'],
  ['ボードが役なら引き分け（両方の手札が効かない）', '2s 3d Ac Ad Ah Ks Kd', '4s 5d Ac Ad Ah Ks Kd', '='],
  ['フラッシュは5枚全部を上から比べる', 'As 9s 7s 5s 3s Kd Qc', 'As 9s 7s 5s 2s Kd Qc', '>'],
  ['6枚の同じスートでも上の5枚で比べる', 'As Ks 9s 7s 5s 3s 2d', 'As Ks 9s 7s 4s 3s 2d', '>'],
  ['A-K-Q-J-T はストレート、K-A-2-3-4 はストレートではない', 'Ah Kd Qc Js Td 2c 3d', 'Kh Ad 2c 3s 4d 9c 8d', '>'],
  ['ツーペアが3組あれば上の2組（3組目は数えない）', 'As Ad Ks Kd Qs Qd 2c', 'As Ad Ks Kd Js Jd 3c', '>'],
  ['スリーカード2組はフルハウス（上の3枚＋下の2枚）', '9s 9d 9c 4h 4s 4d 2c', '9s 9d 9c 3h 3s 3d Kc', '>'],
  ['フォーカードは5枚目（キッカー）で比べる', '7s 7d 7c 7h As 2d 3c', '7s 7d 7c 7h Ks 2d 3c', '>'],
  ['ストレートは一番上の数だけで比べる（スートは関係ない）', '5s 6d 7c 8h 9s 2d 2c', '5h 6c 7d 8s 9h Kd Qc', '='],
  ['ストレートとフラッシュが両方あればフラッシュ', '4s 5s 6s 7d 8s Qs 2c', '4h 5d 6c 7d 8s Qh 2c', '>'],
  ['スートの強さは無い（同じ役・同じ数は引き分け）', 'As Kd Qc Jh 9s 3d 2c', 'Ah Kc Qd Js 9h 3c 2d', '='],
];
const sgn = x => x > 0 ? '>' : x < 0 ? '<' : '=';
module.exports = G => {
  const items = [];
  const bad = FIXED.filter(([, a, b, want]) => sgn(G.cmp(G.bestN(R.parse(a)), G.bestN(R.parse(b)))) !== want || sgn(R.cmp(R.ev(R.parse(a)), R.ev(R.parse(b)))) !== want);
  items.push({ id: 'unit:eval-fixed', title: '役の判定：決まった手', ok: !bad.length, detail: bad.length ? '外れた手: ' + bad.map(x => x[0]).join('、') : `${FIXED.length}組すべて期待どおり` });
  // でたらめな 5〜7枚：ゲームの判定（速い bestN、元の総当たり bestNSlow、5枚の eval5）を、別に書いた判定と比べる
  const deck = G.fullDeck(), N = 60000, ex = [];
  let catBad = 0, ordBad = 0, slowBad = 0, prev = null;
  for (let i = 0; i < N; i++) {
    const d = G.shuffle(deck.slice()), k = 5 + (i % 3), h = d.slice(0, k), g = G.bestN(h), m = R.ev(h);
    if (g[0] !== m[0]) { catBad++; if (ex.length < 3) ex.push(R.show(h) + ` ゲーム${g[0]}/別${m[0]}`) }
    if (G.cmp(g, G.bestNSlow(h)) !== 0 || (k === 5 && G.cmp(g, G.eval5(h)) !== 0)) { slowBad++; if (ex.length < 3) ex.push(R.show(h) + ' 速い判定と総当たりが違う') }
    if (prev && sgn(G.cmp(g, prev.g)) !== sgn(R.cmp(m, prev.m))) { ordBad++; if (ex.length < 3) ex.push(R.show(h) + ' と ' + R.show(prev.h) + ' の強さの順が違う') }
    prev = { g, m, h };
  }
  const n = catBad + ordBad + slowBad;
  items.push({ id: 'unit:eval-random', title: '役の判定：でたらめな5〜7枚を、別に書いた判定と比べる', ok: !n,
    detail: n ? [catBad && `役の段階が違う ${catBad}回`, ordBad && `強さの順が違う ${ordBad}回`, slowBad && `速い判定と総当たりが違う ${slowBad}回`, ex.join(' / ')].filter(Boolean).join('。') : `${N}回、役の段階・強さの順・速い判定と総当たり すべて一致` });
  return items;
};
