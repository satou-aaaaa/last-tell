// 賭け方の決まり（19b_rules.js の Rules.raise・Rules.reopen・Rules.raiseBounds）。もとは basics の basic:minraise・basic:reopen（打ちながら数えていた）
'use strict';
module.exports = G => {
  if (!G.Rules) return [{ id: 'unit:betting', title: '賭け方の決まり', ok: null, detail: 'このゲームのファイルには Rules（19b_rules.js）がまだ無い' }];
  const R = G.Rules, items = [], bad = [];
  const eq = (name, got, want) => { if (JSON.stringify(got) !== JSON.stringify(want)) bad.push(`${name}（期待 ${JSON.stringify(want)}、実際 ${JSON.stringify(got)}）`) };
  // 最低レイズ（BB 200）
  eq('最初のベットは BB 以上でちゃんとしたベット', R.raise(0, 200, 200), { inc: 200, full: true, minRaise: 200 });
  eq('BB 200 に 600 へレイズ：上げ幅 400 が次の最低', R.raise(200, 200, 600), { inc: 400, full: true, minRaise: 400 });
  eq('600 に 1000 へ：上げ幅 400 はちょうど最低', R.raise(600, 400, 1000), { inc: 400, full: true, minRaise: 400 });
  eq('600 に 900 へのオールイン：足りないので最低の幅は 400 のまま', R.raise(600, 400, 900), { inc: 300, full: false, minRaise: 400 });
  eq('レイズで選べる最低：今の額＋最低の幅', R.raiseBounds(600, 400, 0, 5000), { minTo: 1000, maxTo: 5000 });
  eq('持ち点が足りなければ、選べるのはオールインまで', R.raiseBounds(600, 400, 200, 600), { minTo: 800, maxTo: 800 });
  eq('すでに出した分も含めて上限', R.raiseBounds(600, 400, 200, 3000), { minTo: 1000, maxTo: 3200 });
  // レイズの権利が戻るか
  const ps = (...a) => a.map(([acted, actBet]) => ({ acted, actBet }));
  eq('ちゃんとしたレイズ：ほかの全員がもう一度話す', R.reopen(ps([true, 200], [true, 200], [false, null]), 1, true, 600, 400), [0, 2]);
  eq('足りないオールイン：もう話した人には戻らない（まだ話していない人は、もともと話す）', R.reopen(ps([true, 1000], [true, 1300], [false, null]), 1, false, 1300, 1000), []);
  eq('足りないオールインが重なって、話した後から最低の幅に届いたら戻る（R-10）', R.reopen(ps([true, 1000], [true, 1500], [true, 2100]), 2, false, 2100, 1000), [0]);
  eq('重なっても届かなければ戻らない', R.reopen(ps([true, 1000], [true, 1500], [true, 1900]), 2, false, 1900, 1000), []);
  items.push({ id: 'unit:betting', title: '賭け方の決まり：最低レイズ、足りないオールインでレイズの権利が戻らない（重なって届けば戻る R-10）、選べる額', ok: !bad.length, detail: bad.length ? bad.join(' / ') : '11場面すべて期待どおり' });
  return items;
};
