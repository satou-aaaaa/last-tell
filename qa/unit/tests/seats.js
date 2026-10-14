// SB・BB の席とボタン（19b_rules.js の Rules.seats・Rules.next）。もとは basics の basic:blinds（フリー対戦で打ちながら見ていた）
'use strict';
module.exports = G => {
  if (!G.Rules) return [{ id: 'unit:seats', title: 'SB・BB の席', ok: null, detail: 'このゲームのファイルには Rules（19b_rules.js）がまだ無い' }];
  const R = G.Rules, bad = [], T = true, F = false;
  const eq = (name, got, want) => { const g = {}; for (const k in want) g[k] = got[k]; if (JSON.stringify(g) !== JSON.stringify(want)) bad.push(`${name}（期待 ${JSON.stringify(want)}、実際 ${JSON.stringify(got)}）`) };
  eq('6人：ボタンの左が SB、その左が BB', R.seats([T, T, T, T, T, T], 0, F, -1, -1), { sb: 1, bb: 2 });
  eq('席の終わりから最初へ回る', R.seats([T, T, T, T, T, T], 5, F, -1, -1), { sb: 0, bb: 1 });
  eq('2人のときはボタンが SB', R.seats([T, F, T, F], 2, F, -1, -1), { sb: 2, bb: 0 });
  eq('抜けた席は飛ばす', R.seats([T, F, T, T, F, T], 0, F, -1, -1), { sb: 2, bb: 3 });
  eq('ボタンの移り方（抜けた席は飛ばす）', { d: R.next(6, 3, j => [T, T, T, T, F, T][j]) }, { d: 5 });
  // トーナメント（デッドボタン）：BB は必ず1つずつ進む
  eq('トーナメント：前の BB の次が BB、前の BB が SB、前の SB がボタン', R.seats([T, T, T, T, T], 1, T, 2, 3), { dealer: 2, sb: 3, bb: 4, sbSeat: 3 });
  eq('トーナメント：前の BB の人が飛んだら SB は空き（デッドボタン）', R.seats([T, T, T, F, T], 1, T, 2, 3), { dealer: 2, sb: -1, bb: 4, sbSeat: 3 });
  eq('トーナメント：2人になったら BB の次が BB、ボタンが SB', R.seats([T, F, T, F], 0, T, 0, 2), { dealer: 2, sb: 2, bb: 0 });
  return [{ id: 'unit:seats', title: 'SB・BB の席とボタンの移り方（2人のときはボタンが SB、トーナメントは BB が1つずつ進む）', ok: !bad.length, detail: bad.length ? bad.join(' / ') : '8場面すべて期待どおり' }];
};
