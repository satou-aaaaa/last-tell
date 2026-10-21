// 「ブラフを見抜いた！」を出す条件（19b_rules.js の Rules.readCaught）。v0.97.12 レビュー：引き分けで出て、称号・読み勝ちの数にも入っていた
'use strict';
module.exports = G => {
  if (!G.Rules || !G.Rules.readCaught) return [{ id: 'unit:reads', title: '見抜いたの条件', ok: null, detail: 'このゲームのファイルには Rules.readCaught がまだ無い' }];
  const R = G.Rules, bad = [];
  const eq = (name, got, want) => { if (got !== want) bad.push(`${name}（期待 ${want}、実際 ${got}）`) };
  eq('ブラフをコールして自分だけが勝った → 出す', R.readCaught(4000, 0, true), true);
  eq('引き分け（自分も相手も取った） → 出さない', R.readCaught(2000, 2000, true), false);
  eq('途中ブラフで最後に役ができて分けた → 出さない', R.readCaught(1500, 1500, true), false);
  eq('自分の負け → 出さない', R.readCaught(0, 4000, true), false);
  eq('相手がブラフでなかった → 出さない', R.readCaught(4000, 0, false), false);
  return [{ id: 'unit:reads', title: '「ブラフを見抜いた！」は、コールした自分だけが勝ったときだけ（引き分け・負けでは出さない）', ok: !bad.length, detail: bad.length ? bad.join(' / ') : '5場面すべて期待どおり' }];
};
