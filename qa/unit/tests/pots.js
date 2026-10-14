// ポットの分け方（19b_rules.js の Rules.awards・Rules.uncalled）。もとは basics の basic:pots と rules の rule:S1-ante（ブラウザで打ちながら数えていた）
'use strict';
const R = require('../ref_eval');
// 席 j：total＝このハンドで出した額（アンティ込み）、ante＝BBアンティ、sc＝役（降りた人は null）
const P = (total, ante = 0) => ({ total, ante });
const S = { hi: [4, 9], mid: [2, 10, 8, 5], lo: [1, 7, 9, 8, 6], top: [8, 14] };
const CASES = [
  ['1人が勝てば全部もらう', [P(1000), P(1000)], [S.hi, S.lo], 0, -1, [2000, 0]],
  ['引き分けは等分', [P(1000), P(1000)], [S.mid, S.mid], 0, -1, [1000, 1000]],
  ['降りた人の出した額もポットに入るが、降りた人は受け取らない', [P(1000), P(300), P(1000)], [S.lo, null, S.hi], 0, -1, [0, 0, 2300]],
  ['足りないオールインの人は、自分の出した額までのメインポットだけ（サイドポットは次に強い人）', [P(500), P(2000), P(2000)], [S.top, S.mid, S.lo], 0, -1, [1500, 3000, 0]],
  ['サイドポットが2つ：一番強い人が一番少ないとき', [P(300), P(800), P(2000), P(2000)], [S.top, S.hi, S.mid, S.lo], 0, -1, [1200, 1500, 2400, 0]],
  ['端数（100）はボタンの左の人から', [P(500), P(500), P(500)], [S.mid, S.mid, null], 2, -1, [800, 700, 0]],
  ['端数はボタンの左から（ボタンが席1なら席2が先）', [P(500), P(500), P(500)], [S.mid, null, S.mid], 1, -1, [700, 0, 800]],
  ['BBアンティ（死に金）はメインポットに入り、勝った人がもらう', [P(1000), P(2000, 1000), P(1000)], [S.hi, S.lo, S.lo], 0, -1, [4000, 0, 0]],
  ['2回めくり：1回目は段ごとに半分＋端数', [P(1500), P(1500), P(100)], [S.hi, S.lo, null], 0, 0, [1600, 0, 0]],
  ['2回めくり：2回目は段ごとの半分（端数なし）', [P(1500), P(1500), P(100)], [S.lo, S.hi, null], 0, 1, [0, 1500, 0]],
];
const UNC = [
  ['一番多く出した人に、2番目との差を返す', [P(3000), P(1000), P(0)], { i: 0, amt: 2000 }],
  ['ほかに誰も出していなければ返さない（ポットが空にならない）', [P(0), P(1000), P(0)], null],
  ['同じ額なら返さない', [P(1000), P(1000)], null],
  ['BBアンティは返さない（プロポーカー S1：全員コールのときBBにアンティが戻らない）', [P(1000), P(2000, 1000), P(1000)], null],
  ['BBアンティを除いた額で比べる（BBが一番多く賭けたときは、その差だけ返す）', [P(1000), P(4000, 1000), P(0)], { i: 1, amt: 2000 }],
];
// でたらめなハンド：決まりから外れていないか（basic:pots と同じ3つ＋チップの合計）
function randomHands(G, n) {
  const bad = { sum: [], best: [], over: [], chop: [] }; const ex = [];
  for (let t = 0; t < n; t++) {
    const np = 2 + Math.floor(G.rand() * 8), d = G.shuffle(G.fullDeck()), board = d.splice(0, 5), dealer = Math.floor(G.rand() * np), bb = (dealer + 2) % np;
    const ps = [], sc = [];
    for (let j = 0; j < np; j++) {
      const fold = G.rand() < .3, p = P(Math.floor(G.rand() * 30) * 100 + (fold ? 0 : 100), 0); if (j === bb && p.total < 200) p.total = 200;   // 残っている人は必ず何か出している
      if (j === bb) { p.ante = 100; p.total += 100 }
      ps.push(p); sc.push(fold && j !== bb ? null : G.bestN(d.splice(0, 2).concat(board)));
    }
    if (G.rand() < .3) { const k = sc.findIndex(x => x); sc.forEach((x, j) => { if (x && G.rand() < .5) sc[j] = sc[k] }) } // 引き分けを混ぜる
    const u = G.Rules.uncalled(ps); if (u) ps[u.i].total -= u.amt;
    const ri = G.rand() < .15 ? (G.rand() < .5 ? 0 : 1) : -1;
    const g = G.Rules.awards(ps, sc, dealer, ri), bet = p => p.total - p.ante, cont = sc.map((x, j) => j).filter(j => sc[j]);
    const pot = ps.reduce((a, p) => a + p.total, 0), got = g.reduce((a, x) => a + x, 0);
    const lv = [...new Set(ps.map(bet).filter(v => v > 0))];
    const tag = () => JSON.stringify({ ps, cont, dealer, ri, g });
    if (ri < 0 ? got !== pot : got > pot) { bad.sum.push(1); ex.length < 3 && ex.push('合計が合わない ' + tag()) }
    if (ri < 0) {
      const best = cont.reduce((a, b) => G.cmp(sc[a], sc[b]) >= 0 ? a : b);
      if (pot > 0 && !(g[best] > 0)) { bad.best.push(1); ex.length < 3 && ex.push('一番強い人が0 ' + tag()) }
      cont.forEach(j => { if (g[j] > 0 && cont.some(q => q !== j && G.cmp(sc[q], sc[j]) > 0 && bet(ps[q]) >= bet(ps[j]))) { bad.over.push(1); ex.length < 3 && ex.push('もっと強く同じ以上賭けた人がいるのに受け取った ' + tag()) } });
      cont.forEach(j => cont.forEach(q => { if (j < q && G.cmp(sc[j], sc[q]) === 0 && bet(ps[j]) === bet(ps[q]) && Math.abs(g[j] - g[q]) > 100 * lv.filter(v => v <= bet(ps[j])).length) { bad.chop.push(1); ex.length < 3 && ex.push('引き分けが等分でない ' + tag()) } }));
    }
  }
  return { bad, ex };
}
module.exports = G => {
  const items = [];
  if (!G.Rules) return [{ id: 'unit:pots', title: 'ポットの分け方', ok: null, detail: 'このゲームのファイルには Rules（19b_rules.js）がまだ無い' }];
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const bad = CASES.filter(([, ps, sc, dl, ri, want]) => !same(G.Rules.awards(ps, sc, dl, ri), want)).map(c => `${c[0]}（期待 ${c[5]}、実際 ${G.Rules.awards(c[1], c[2], c[3], c[4])}）`);
  items.push({ id: 'unit:pots-fixed', title: 'ポットの分け方：決まった場面（サイドポット・引き分け・端数・アンティ・2回めくり）', ok: !bad.length, detail: bad.length ? bad.join(' / ') : `${CASES.length}場面すべて期待どおり` });
  const ub = UNC.filter(([, ps, want]) => !same(G.Rules.uncalled(ps), want)).map(c => `${c[0]}（実際 ${JSON.stringify(G.Rules.uncalled(c[1]))}）`);
  items.push({ id: 'unit:uncalled', title: 'コールされなかった賭けを返す（BBアンティは返さない＝プロポーカー S1）', ok: !ub.length, detail: ub.length ? ub.join(' / ') : `${UNC.length}場面すべて期待どおり` });
  const N = 20000, r = randomHands(G, N), k = Object.values(r.bad).reduce((a, x) => a + x.length, 0);
  items.push({ id: 'unit:pots-random', title: 'ポットの分け方：でたらめな2〜9人のハンド（合計が合う、一番強い手が受け取る、強い手より多く取らない、引き分けは等分）', ok: !k,
    detail: k ? `違反 ${k}回（合計 ${r.bad.sum.length}・一番強い ${r.bad.best.length}・取りすぎ ${r.bad.over.length}・引き分け ${r.bad.chop.length}）。例: ${r.ex.join(' / ')}` : `${N}ハンド、違反0` });
  return items;
};
