// 配りを変える入口の計算（js/54_deal_mod.js の Rules.deal）。research/配り札と場札の操作_実装仕様.md §4・§7
// 案2 readGuard の「勝ったままの並び」探し、案1 の「何も当たらない場」「2番目か3番目のペア」、§7 B の「自分の手に絡む」
'use strict';
module.exports = G => {
  const D = G.Rules && G.Rules.deal;
  // 入口（@unit-begin deal_mod）がある版で Rules.deal・pick・Rules.kata・KATA が欠けたら ❌（ゲームは守りなしで呼ぶので、欠けると配りで止まる。CodeRabbit #133）。入口の無い古い版だけ ⚠️ で飛ばす
  const cur = (G.blocks || []).includes('deal_mod');
  if (!D || (cur && typeof D.pick !== 'function')) return [{ id: 'unit:deal', title: '配りを変える入口の計算', ok: cur ? false : null, detail: cur ? '入口（deal_mod）があるのに Rules.deal' + (D ? '.pick' : '') + ' が無い' : 'このゲームのファイルには Rules.deal（js/54_deal_mod.js）がまだ無い' }];
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
  if (!K || (cur && !K.KATA)) out.push({ id: 'unit:kata', title: '決まった札の型', ok: cur ? false : null, detail: cur ? '入口（deal_mod）があるのに Rules.kata' + (K ? '.KATA' : '') + ' が無い' : 'このゲームのファイルには Rules.kata がまだ無い' });
  else {
    const perms = n => n <= 1 ? [[0]] : perms(n - 1).flatMap(p => [...Array(n).keys()].map(i => { const a = p.slice(); a.splice(i, 0, n - 1); return a }));
    const P4 = perms(4), P3 = perms(3), NEED = { 4: 5, 5: 5, 7: 5, bb: 3, rush: 3, mf: 3 }, badK = [], few = []; let n = 0;
    for (const key of Object.keys(NEED)) { const L = K.KATA[key] || []; if (L.length < NEED[key]) few.push(`${key} ${L.length}型（${NEED[key]}型以上）`);
      L.forEach((k, i) => { for (const alt of [''].concat(k.alt ? k.alt.split(' ') : [])) for (const ord of P3) for (const perm of P4) { n++; const v = K.apply(k, perm, alt, ord); if (!K.same(k, v)) { badK.push(`${key}[${i}] ${alt || '数字そのまま'} 並び${ord.join('')} スート${perm.join('')}${v ? '' : '（札が重なる）'}`); return } } }) }
    out.push({ id: 'unit:kata-shape', title: '決まった札の型は、ばらしても勝つ側と役の種類が型どおり（§8-1。数字の幅×フロップの並び×スート）', ok: !badK.length, detail: badK.length ? badK.slice(0, 5).join(' / ') : `${n}通り、全部型どおり` });
    out.push({ id: 'unit:kata-count', title: '型の数：第4・5章の一騎打ちと第7章の最後は5型以上、第5章の最初の1手・第二部の2場面は3型以上', ok: !few.length, detail: few.length ? few.join('、') : Object.keys(NEED).map(k => `${k} ${(K.KATA[k] || []).length}型`).join('、') });
    // 札と台詞が合う（Godot 移植の報告 2026-10-22：第5章の最初の1手は AA・KK・QQ のどれかなのに、台詞が「AAが来た」に決め打ちだった）。
    //   第5章の最初の1手（bb）の型を全部ばらして、自分の手札の名前（AA など）の台詞が日本語・英語とも揃っていて、台詞の中の名前が手札と同じ
    if (typeof K.pairName === 'function' && K.BB_LINES) { const miss = [], seen = new Set();
      (K.KATA.bb || []).forEach((k, i) => { for (const alt of [''].concat(k.alt ? k.alt.split(' ') : [])) for (const ord of P3) for (const perm of P4) { const v = K.apply(k, perm, alt, ord); if (!v) continue;
        const nm = K.pairName(v.h), L = nm && K.BB_LINES[nm]; seen.add(nm || '（ペアでない）');
        if (!L) { miss.push(`bb[${i}] ${alt || '数字そのまま'} → ${nm || 'ペアでない'} の台詞が無い`); continue }
        for (const key of ['deal', 'ask', 'jin']) { const x = L[key]; if (!x || !x[0] || !x[1] || !x[0].includes(nm) || K.bbLine(v.h, key) !== x[0]) miss.push(`${nm} の ${key}：${x ? x[0] : '無い'}`) } } });
      out.push({ id: 'unit:kata-line', title: '第5章の最初の1手：配られた手札と台詞（AA・KK・QQ）が合う', ok: !miss.length, detail: miss.length ? [...new Set(miss)].slice(0, 5).join(' / ') : `出る手札 ${[...seen].join('・')}、どれも日本語・英語の台詞あり` }) }
    else if (cur) out.push({ id: 'unit:kata-line', title: '第5章の最初の1手：配られた手札と台詞が合う', ok: false, detail: 'Rules.kata.pairName・BB_LINES が無い（台詞が手札に合わせられない）' });
    // 直近の型を避ける：200回続けて選んで、直近 ex(型の数) 回と同じ型が出ない。3型以上では次の型がいつも1つに決まらない（周期的に回らない。v0.98.2 の 012012…）。前の版の保存（数字1つ）も配列で読む
    const rep = [], cyc = [], exOf = m => typeof K.ex === 'function' ? K.ex(m) : Math.min(3, m - 1);
    for (const m of [3, 4, 5]) { let rec = []; const seq = []; for (let t = 0; t < 200; t++) { const k = K.pick(m, rec, G.rand); if (rec.slice(-exOf(m)).includes(k) || (rec.length && rec[rec.length - 1] === k)) rep.push(`${m}型で ${t}回目`); seq.push(k); rec = rec.concat(k).slice(-3) }
      const next = {}; for (let i = 1; i < seq.length; i++) (next[seq[i - 1]] = next[seq[i - 1]] || new Set()).add(seq[i]);
      if (Object.values(next).every(v => v.size < 2)) cyc.push(`${m}型 ${seq.slice(0, 12).join('')}…`) }
    const mig = [K.recent(2).join(), K.recent('1').join(), K.recent([0, 4, 2, 1]).join(), K.recent(undefined).join(), K.recent([null, 'x', 3]).join()];
    const migOk = mig.join('|') === '2|1|4,2,1||3';
    out.push({ id: 'unit:kata-pick', title: '同じ型が続かず、決まった順にも回らない（直近 型の数−2 回まで外す。3型なら直前の1つ）。前の版の保存（数字1つ）も読める', ok: !rep.length && !cyc.length && migOk,
      detail: (rep.length ? '続いた：' + rep.slice(0, 3).join('、') + '。' : '3型・4型・5型で各200回、続かなかった。') + (cyc.length ? '決まった順に回った：' + cyc.join('、') + '。' : '') + `保存の読み方 ${mig.map(x => `[${x}]`).join(' ')}${migOk ? '' : '（期待 [2] [1] [4,2,1] [] [3]）'}` });
    // vary は型どおりのものを返す（50回でだめなら型のまま）
    let vb = 0; for (const key in K.KATA) K.KATA[key].forEach(k => { for (let t = 0; t < 20; t++) if (!K.same(k, K.vary(k, G.rand))) vb++ });
    out.push({ id: 'unit:kata-vary', title: '配るときのばらし（vary）は、いつも型どおりの札を返す', ok: !vb, detail: `${Object.values(K.KATA).reduce((a, l) => a + l.length, 0)}型×20回、型どおりでない ${vb}回` });
  }
  return out;
};
