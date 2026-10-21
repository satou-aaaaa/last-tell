// 配りを変える入口の計算（js/54_deal_mod.js の Rules.deal）。research/配り札と場札の操作_実装仕様.md §4・§7
// 案2 readGuard の「勝ったままの並び」探し、案1 の「何も当たらない場」「2番目か3番目のペア」、§7 B の「自分の手に絡む」
'use strict';
module.exports = G => {
  const D = G.Rules && G.Rules.deal;
  if (!D) return [{ id: 'unit:deal', title: '配りを変える入口の計算', ok: null, detail: 'このゲームのファイルには Rules.deal（js/54_deal_mod.js）がまだ無い' }];
  const S = '♠♥♦♣', c = t => ({ r: { A: 14, K: 13, Q: 12, J: 11, T: 10 }[t[0]] || +t[0], s: S.indexOf(t[1]) }), cs = s => s.split(' ').map(c);
  const out = [], bad = [];
  const eq = (name, got, want) => { if (got !== want) bad.push(`${name}（期待 ${want}、実際 ${got}）`) };
  // 絡む・当たらない
  eq('A♠K♦ に K♣7♥2♦（トップペア）→ 絡む', D.connects(cs('A♠ K♦'), cs('K♣ 7♥ 2♦')), true);
  eq('9♠8♠ に K♠4♠2♦（フラッシュの4枚）→ 絡む', D.connects(cs('9♠ 8♠'), cs('K♠ 4♠ 2♦')), true);
  eq('9♠8♦ に T♣7♥2♦（ストレートの4枚）→ 絡む', D.connects(cs('9♠ 8♦'), cs('T♣ 7♥ 2♦')), true);
  eq('A♠5♦ に 4♣3♥2♦（A を 1 に使うストレート）→ 絡む', D.connects(cs('A♠ 5♦'), cs('4♣ 3♥ 2♦')), true);
  eq('9♠8♦ に K♣K♥2♦（場だけのペア）→ 絡まない', D.connects(cs('9♠ 8♦'), cs('K♣ K♥ 2♦')), false);
  eq('9♠8♦ に K♣Q♥2♦ → 絡まない', D.connects(cs('9♠ 8♦'), cs('K♣ Q♥ 2♦')), false);
  eq('7♠6♦ に 9♣8♥2♦（場の2枚と自分の2枚でストレートの4枚）→ 絡む', D.connects(cs('7♠ 6♦'), cs('9♣ 8♥ 2♦')), true);
  eq('当たらない＝絡まない（air）', D.air(cs('9♠ 8♦'), cs('K♣ Q♥ 2♦')), true);
  // 2番目か3番目のペア
  eq('Q♠7♦ に K♣Q♥2♦（2番目）→ 中くらい', D.midPair(cs('Q♠ 7♦'), cs('K♣ Q♥ 2♦')), true);
  eq('A♠2♣ に K♣Q♥2♦（3番目）→ 中くらい', D.midPair(cs('A♠ 2♣'), cs('K♣ Q♥ 2♦')), true);
  eq('K♠7♦ に K♣Q♥2♦（トップ）→ ちがう', D.midPair(cs('K♠ 7♦'), cs('K♣ Q♥ 2♦')), false);
  eq('Q♠2♣ に K♣Q♥2♦（ツーペア）→ ちがう', D.midPair(cs('Q♠ 2♣'), cs('K♣ Q♥ 2♦')), false);
  eq('8♠8♣ に K♣Q♥2♦（手のペア）→ ちがう', D.midPair(cs('8♠ 8♣'), cs('K♣ Q♥ 2♦')), false);
  // 山の並び：場札は配る順（バーン1枚、フロップ3枚、バーン、ターン、バーン、リバー。山の後ろから）
  { const deck = cs('2♣ 3♣ 4♣ 5♣ 6♣ 7♣ 8♣ 9♣'), b = D.board(deck, []);
    eq('board：フロップは後ろから2〜4枚目', b.slice(0, 3).map(x => x.r).join(), '8,7,6'); eq('board：ターン・リバー', b.slice(3).map(x => x.r).join(), '4,2');
    eq('flop と board の頭が同じ', D.flop(deck).map(x => x.r).join(), '8,7,6');
    eq('board は山を書き換えない', deck.length, 8) }
  out.push({ id: 'unit:deal-shape', title: '配りの入口：絡む・当たらない・2番目か3番目のペア・場札の配る順', ok: !bad.length, detail: bad.length ? bad.join(' / ') : '17場面すべて期待どおり' });
  // readGuard：今勝っている自分が、探した山では最後まで勝ったまま。でたらめな場面 300 回
  { const shuf = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(G.rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a };
    let n = 0, kept = 0, same = 0, none = 0, lost = 0, mutated = 0;
    for (let t = 0; t < 4000 && n < 300; t++) {
      const d = shuf(G.fullDeck()), me = [d.pop(), d.pop()], opps = [[d.pop(), d.pop()], [d.pop(), d.pop()]].slice(0, 1 + (t % 2)), bl = 3 + (t % 3 === 0 ? 1 : 0);
      d.pop(); const board = []; for (let k = 0; k < bl; k++) board.push(d.pop());
      if (!D.ahead(me, opps, board)) continue;
      n++; const before = d.map(x => x.r + '' + x.s).join(), r = D.keepWin(d, board, me, opps, 400, shuf);
      if (d.map(x => x.r + '' + x.s).join() !== before) mutated++;
      if (!r) { none++; continue }
      if (r === d) same++; else kept++;
      if (r.length !== d.length || [...r].map(x => x.r + '' + x.s).sort().join() !== [...d].map(x => x.r + '' + x.s).sort().join()) lost++;
      if (!D.ahead(me, opps, D.board(r, board))) lost++;
    }
    out.push({ id: 'unit:deal-keepwin', title: '読み勝ちを守る（readGuard）：探した山では、最後まで勝ったまま。山の札は同じ（並びだけ）', ok: n >= 100 && !lost && !mutated,
      detail: `勝っている場面 ${n}回：そのままで勝ち ${same}回、並べ替えて勝ち ${kept}回、見つからない ${none}回、最後に負けた・札が変わった ${lost}回、元の山を書き換えた ${mutated}回` });
    // 負けている場面では何もしない（ahead が false）
    let wrong = 0, m = 0; for (let t = 0; t < 2000 && m < 200; t++) { const d = shuf(G.fullDeck()), me = [d.pop(), d.pop()], op = [d.pop(), d.pop()], b = [d.pop(), d.pop(), d.pop()];
      const a = G.cmp(G.bestN(me.concat(b)), G.bestN(op.concat(b))); if (a > 0) continue; m++; if (D.ahead(me, [op], b)) wrong++ }
    out.push({ id: 'unit:deal-ahead', title: '読み勝ちを守るのは、その時点で自分が勝っているときだけ（引き分け・負けは外す）', ok: !wrong, detail: `負け・引き分けの場面 ${m}回のうち、勝っている扱い ${wrong}回` }) }
  // pick：条件に合う2枚の位置
  { const Dk = cs('A♠ K♠ 7♦ 2♣'), k = D.pick(Dk, h => G.preTier(h) === 2, G.rand), k0 = D.pick(Dk, () => false, G.rand);
    out.push({ id: 'unit:deal-pick', title: '山から条件に合う2枚を選ぶ', ok: !!k && k.join() === '0,1' && k0 === null, detail: `AK を選んだ位置 ${k && k.join()}、合う札が無いとき ${k0}` }) }
  // §8 決まった札の型：型ごとに、数字の幅（alt）×フロップの並び6通り×スートの入れ替え24通りを全部ばらしても、形（勝つ側・自分と相手の役の種類・preTier）が型どおり
  const K = G.Rules.kata;
  if (!K) out.push({ id: 'unit:kata', title: '決まった札の型', ok: null, detail: 'このゲームのファイルには Rules.kata がまだ無い' });
  else {
    const perms = n => n <= 1 ? [[0]] : perms(n - 1).flatMap(p => [...Array(n).keys()].map(i => { const a = p.slice(); a.splice(i, 0, n - 1); return a }));
    const P4 = perms(4), P3 = perms(3), NEED = { 4: 5, 5: 5, 7: 5, bb: 3, rush: 3, mf: 3 }, badK = [], few = []; let n = 0;
    for (const key of Object.keys(NEED)) { const L = K.KATA[key] || []; if (L.length < NEED[key]) few.push(`${key} ${L.length}型（${NEED[key]}型以上）`);
      L.forEach((k, i) => { for (const alt of [''].concat(k.alt ? k.alt.split(' ') : [])) for (const ord of P3) for (const perm of P4) { n++; const v = K.apply(k, perm, alt, ord); if (!K.same(k, v)) { badK.push(`${key}[${i}] ${alt || '数字そのまま'} 並び${ord.join('')} スート${perm.join('')}${v ? '' : '（札が重なる）'}`); return } } }) }
    out.push({ id: 'unit:kata-shape', title: '決まった札の型は、ばらしても勝つ側と役の種類が型どおり（§8-1。数字の幅×フロップの並び×スート）', ok: !badK.length, detail: badK.length ? badK.slice(0, 5).join(' / ') : `${n}通り、全部型どおり` });
    out.push({ id: 'unit:kata-count', title: '型の数：第4・5章の一騎打ちと第7章の最後は5型以上、第5章の最初の1手・第二部の2場面は3型以上', ok: !few.length, detail: few.length ? few.join('、') : Object.keys(NEED).map(k => `${k} ${(K.KATA[k] || []).length}型`).join('、') });
    // 直近の型を避ける：100回続けて選んで、直近 min(3, 型の数−1) 回と同じ型が出ない。前の版の保存（数字1つ）も配列で読む
    const rep = [];
    for (const m of [3, 5]) { let rec = []; for (let t = 0; t < 100; t++) { const k = K.pick(m, rec, G.rand); if (rec.slice(-Math.min(3, m - 1)).includes(k)) rep.push(`${m}型で ${t}回目`); rec = rec.concat(k).slice(-3) } }
    const mig = [K.recent(2).join(), K.recent('1').join(), K.recent([0, 4, 2, 1]).join(), K.recent(undefined).join(), K.recent([null, 'x', 3]).join()];
    const migOk = mig.join('|') === '2|1|4,2,1||3';
    out.push({ id: 'unit:kata-pick', title: '同じ型が続かない（直近3回、型が4つ以下なら直近 型の数−1 回は選ばない）。前の版の保存（数字1つ）も読める', ok: !rep.length && migOk,
      detail: (rep.length ? '続いた：' + rep.slice(0, 3).join('、') + '。' : '3型・5型で各100回、続かなかった。') + `保存の読み方 ${mig.map(x => `[${x}]`).join(' ')}${migOk ? '' : '（期待 [2] [1] [4,2,1] [] [3]）'}` });
    // vary は型どおりのものを返す（50回でだめなら型のまま）
    let vb = 0; for (const key in K.KATA) K.KATA[key].forEach(k => { for (let t = 0; t < 20; t++) if (!K.same(k, K.vary(k, G.rand))) vb++ });
    out.push({ id: 'unit:kata-vary', title: '配るときのばらし（vary）は、いつも型どおりの札を返す', ok: !vb, detail: `${Object.values(K.KATA).reduce((a, l) => a + l.length, 0)}型×20回、型どおりでない ${vb}回` });
  }
  return out;
};
