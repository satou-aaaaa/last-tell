// 再発チェック：プロポーカー目線・ゲームクリエイター目線で見つかった問題が、また起きていないか
// 中身は research/プロポーカープレイヤー目線_実装仕様.md と research/プロ目線の改善_実装仕様.md の「確認」から
'use strict';
const fs = require('fs');
const H = require('../lib/harness');

// ゲームの関数を包んで、CPUの判断とショーダウンを記録する
const PROBE = `(() => {
  if (window.__probe) return; const P = window.__probe = { limp: {}, open: {}, rivBig: {}, faceOpen: {}, sdRefundBB: 0, sdHands: 0, twice: 0, twiceAsk: 0, bomb: 0, errs: [] };
  const inc = (o, k, f) => { o[k] = o[k] || { n: 0, hit: 0 }; o[k].n++; if (f) o[k].hit++ };
  const _cd = cpuDecide;
  cpuDecide = function (i) {
    try { S._lk = null } catch (e) {}
    const d = _cd.apply(this, arguments);
    try {
      if (i === 0) return d;
      // 弱点（LEAKS：クロウの「大きな勝負から降りられん」など、わざと入れた読める癖）で決めた判断は、S2 などの割合に数えない（v83 レビュー：クロウ 48%）
      if (S._lk) return d;
      const p = S.players[i], toCall = S.currentBet - p.bet, potBefore = S.players.reduce((a, q) => a + q.total, 0) - toCall;
      if (S.street === 'preflop') {
        const others = S.players.filter((q, j) => j !== i && q.bet > BB()).length; // BBより多く出した人がいない＝まだ誰も上げていない
        // 持ちチップがBB以下の人のコールは、オールインで入るしかないのでリンプに数えない（v84：クロウ 2,500 で BB 4,000 にコール → 11%）
        if (S.raises === 0 && others === 0 && toCall > 0 && p.chips > toCall) inc(P.limp, p.name, d.type === 'call');
        if (S.raises === 1 && S.players[0].raisedPre && S.currentBet <= BB() * 3 && toCall > 0) inc(P.faceOpen, p.name, d.type === 'fold');
      }
      // S2 は1対1のリバーだけ数える（v84：第14章の3〜4人の卓では、ほかの人がコール済みでポットの見込みが変わり、コールが正しいことも多い）
      if (S.street === 'river' && toCall > 0 && toCall >= potBefore * 1.5 && S.players.filter(q => !q.folded && !q.out).length === 2) inc(P.rivBig, p.name, d.type !== 'fold');
    } catch (e) { P.errs.push(e.message) }
    return d;
  };
  const _sd = showdown;
  showdown = function () { S.__sd = true; P.sdHands++; return _sd.apply(this, arguments) };
  const _ru = refundUncalled;
  refundUncalled = function () {
    const before = S.players.map(p => p.chips);
    const r = _ru.apply(this, arguments);
    try {
      if (S.__sd) {
        const logs = [...document.querySelectorAll('#log > *')].map(x => x.textContent);
        const k = logs.findIndex(t => /^ハンド #\\d+$/.test(t.trim())), cur = k < 0 ? logs : logs.slice(0, k);
        const anteLine = cur.find(t => /BBアンティ/.test(t)), bbName = anteLine && anteLine.split('：')[0];
        S.players.forEach((p, j) => { if (p.chips > before[j] && p.name === bbName && !S.players.some(q => q.allIn)) P.sdRefundBB++ });
      }
    } catch (e) { P.errs.push(e.message) }
    return r;
  };
  const _sh = startHand;
  startHand = function () { if (S) S.__sd = false; const r = _sh.apply(this, arguments);
    try { if (/ボムポット/.test((document.querySelector('#log > *') || {}).textContent || '') || [...document.querySelectorAll('#log > *')].slice(0, 6).some(x => /ボムポット！/.test(x.textContent))) P.bomb++ } catch (e) {} return r };
  setInterval(() => { try { if (S && S.twice && S.__tw !== S.handNo) { S.__tw = S.handNo; P.twice++ } if (S && !S.handOver && typeof twiceAskable === 'function' && twiceAskable() && S.__ta !== S.handNo) { S.__ta = S.handNo; P.twiceAsk++ } } catch (e) {} }, 5);
})();`;

async function session(browser, file, start, policy, hands, storage) {
  const { ctx, page } = await H.openGame(browser, file, { fast: 60, storage, seed: H.seedOf('rules', start, policy) });
  try {
    await page.evaluate(PROBE);
    const t0 = Date.now();
    let total = 0;
    while (total < hands && Date.now() - t0 < 200000) {
      await page.evaluate(s => { try { show('title') } catch (e) {} (0, eval)(s) }, start);
      if (total === 0) await H.startBot(page, { policy, maxHands: hands }); else await page.evaluate(() => __bot.restart());
      const r = await H.runUntilDone(page, { timeoutMs: 200000 - (Date.now() - t0), stallMs: 20000 });
      total = await page.evaluate(() => __bot.hands);
      if (r.status !== 'done') break;
      if (await page.evaluate(() => __bot.result === 'limit')) break;
    }
    return await page.evaluate(() => ({ ...__probe, hands: __bot.hands, errors: __qa.errors }));
  } finally { await ctx.close() }
}

const pct = (h) => h && h.n ? Math.round(h.hit / h.n * 100) : null;
function merge(a, b) { const o = JSON.parse(JSON.stringify(a)); for (const k of ['limp', 'rivBig', 'faceOpen']) for (const n in b[k]) { o[k][n] = o[k][n] || { n: 0, hit: 0 }; o[k][n].n += b[k][n].n; o[k][n].hit += b[k][n].hit } for (const k of ['sdRefundBB', 'sdHands', 'twice', 'twiceAsk', 'bomb', 'hands']) o[k] = (o[k] || 0) + (b[k] || 0); return o }

const STRONG = ['ジン', 'クロウ', 'ハヤト', 'レイカ', 'カオル'];
// 割合を見る検査は、測れた回数が少ないと1〜2回の違いで外れる（2026-10-14 PR #22 で S2 がジン 11回 45% で ❌、同じ中身の #21 は ✅）。
// 外れたキャラが MIN_N 回以上測れていれば ❌、全部それより少なければ ⚠️（CIのチェック充実 案1）
const MIN_N = 20;
const rateStatus = bad => !bad.length ? 'ok' : bad.some(x => x[2] >= MIN_N) ? 'fail' : 'warn';


// S2 の直接の測り方（v85.2 交代レビュー案）：対戦を回さず、1対1・リバー・ポットP・相手が2Pベットの場面を作って、
// 強いキャラに「中くらいの強さ」（でたらめな手に対する勝率 45〜75%）の手を配り、判断（cpuDecide0）だけを各200回呼ぶ。弱点（S._lk）で決めた判断は数えない
async function probeS2(browser, file) {
  const { ctx, page } = await H.openGame(browser, file, { fast: 40, storage: H.UNLOCKED, seed: H.seedOf('rules', 's2probe', 'direct') });
  try {
    await page.evaluate(() => { $('freeSize').value = '6'; startFree() });
    await page.waitForTimeout(1500);
    return await page.evaluate(() => {
      const out = {}, k = 1, p = S.players[k], p0 = S.players[0], saved = { name: p.name, style: p.style, styleKey: p.styleKey };
      for (const [name, sk] of [['ジン', 'jin'], ['クロウ', 'crow'], ['カオル', 'tight2']]) {
        p.name = name; p.style = typeof charStyle === 'function' ? charStyle(name, sk) : STYLES[sk]; p.styleKey = sk;   // キャラごとの上書き（42_char_style.js）も入れる
        let n = 0, call = 0, lk = 0, tries = 0;
        while (n < 200 && tries < 4000) {
          tries++;
          const deck = fullDeck(); for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(LT.rand() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]] }
          const board = deck.slice(0, 5), mine = deck.slice(5, 7), opp = deck.slice(7, 9);
          const e = equity(opp, board, 1, 120); if (e < .45 || e > .75) continue;
          const P = 10 * BB();
          S.players.forEach((q, j) => { q.folded = j !== 0 && j !== k; q.bet = 0; q.total = 0; q.chips = 200 * BB(); q.allIn = false; q.acted = false });
          S.board = board; p.hand = opp; p0.hand = mine; S.street = 'river';
          p0.total = P / 2 + 2 * P; p0.bet = 2 * P; p.total = P / 2; S.currentBet = 2 * P; S.aggr = 0; p0.lastType = 'raise'; S.raises = 1; S.toAct = k; S.handOver = false;
          S._lk = null; const d = cpuDecide0(k);
          if (S._lk) { lk++; S._lk = null; continue }
          n++; if (d.type !== 'fold') call++;
        }
        out[name] = { n, call, lk };
      }
      Object.assign(p, saved);
      return out;
    });
  } catch (e) { return { err: e.message } } finally { await ctx.close() }
}

async function run({ browser, file, quick }) {
  // リバーの2倍ベット（S2）は、短い版でも強いキャラごとに20回ほど測れるように多めに打つ（CIのチェック充実 案1）
  const H1 = quick ? 25 : 80, H2 = quick ? 60 : 120, items = [];
  const st7 = H.UNLOCKED;
  // S1（BBアンティが返らない）は、ゲームに Rules（19b_rules.js）が入っていれば単体テスト unit:uncalled で確かめる（2026-10-14）
  const unitS1 = fs.readFileSync(file, 'utf8').includes('// @unit-begin rules');
  const jobs = [
    ['startChapter(CHAPTERS[0],true)', 'call', H1],
    [`($('freeSize').value='6',startFree())`, 'call', H1],
    ['startChapter(CHAPTERS[5],true)', 'random', H1],
    ['startP2(PART2[3],true)', 'random', H1, st7],
    ['startUra(6)', 'random', H1],
    ['startChapter(CHAPTERS[3],true)', 'fold', H1],
    ['startChapter(CHAPTERS[5],true)', 'fold', H1],
    ['startChapter(CHAPTERS[6],true)', 'fold', H1],
    [`($('freeSize').value='6',startFree())`, 'fold', H1],
    ['startChapter(CHAPTERS[5],true)', 'overbet', H2],
    ['startChapter(CHAPTERS[6],true)', 'overbet', H2],
    [`($('freeSize').value='6',startFree())`, 'overbet', H2],
    ['startChapter(CHAPTERS[5],true)', 'open3', H1],
    ['startChapter(CHAPTERS[6],true)', 'open3', H1],
    [`($('freeSize').value='6',startFree())`, 'open3', H1],
    // S2：クロウ・カオルは第14章の卓にいる。ほかの卓だけでは12回・8回しか測れず揺れていた（v83 レビュー）ので、第14章でも2倍ベットを打つ
    ['startP2(PART2[3],true)', 'overbet', H2, st7],
    // v84 から S2 は1対1のリバーだけ数えるので、クロウは11回しか測れなかった（v85 交代レビュー）。第14章をもう1回打って20回以上にする（かっこで包んで種を変える）
    ['(startP2(PART2[3],true))', 'overbet', H2, st7],
  ];
  // 4つずつ回す（一度に全部だと遅くなりすぎる）
  const res = [];
  const skip = unitS1 ? [0, 1] : [], EMPTY = { limp: {}, rivBig: {}, faceOpen: {}, sdRefundBB: 0, sdHands: 0, hands: 0, errs: [], errors: [] };
  const todo = jobs.filter((j, k) => !skip.includes(k)), got = [];
  for (let i = 0; i < todo.length; i += 4) got.push(...await Promise.all(todo.slice(i, i + 4).map(j => session(browser, file, j[0], j[1], j[2], j[3]))));
  jobs.forEach((j, k) => res.push(skip.includes(k) ? EMPTY : got.shift()));
  const [s1, s1b, tour6, tour14, ura6, lim4, lim6, lim7, free6, ob6, ob7, obF, op6, op7, opF, ob14, ob14b] = res;
  // S1 BBアンティ
  const a = merge(s1, s1b);
  if (!unitS1) items.push({ id: 'rule:S1-ante', title: 'BBアンティがショーダウンでBBに返らない（プロポーカー S1）', status: a.sdRefundBB ? 'fail' : 'ok',
    detail: `全員コールのショーダウン ${a.sdHands}回のうち、アンティがBBに返った ${a.sdRefundBB}回` });
  // A2 トーナメント
  const t = merge(merge(tour6, tour14), ura6);
  items.push({ id: 'rule:A2-twice', title: 'トーナメント（第6章・第14章・裏の卓）で2回めくりが出ない（プロポーカー A2）', status: (t.twice || t.twiceAsk) ? 'fail' : 'ok',
    detail: `${t.hands}ハンドで、2回めくりの提案 ${t.twiceAsk}回、実施 ${t.twice}回` });
  items.push({ id: 'rule:A2-bomb', title: '第6章でボムポットが出ない（プロポーカー A2）', status: tour6.bomb ? 'fail' : 'ok', detail: `第6章 ${tour6.hands}ハンドでボムポット ${tour6.bomb}回` });
  // A1 リンプ
  const L = [lim4, lim6, lim7, free6].reduce(merge);
  const limpStrong = STRONG.filter(n => L.limp[n] && L.limp[n].n >= 8).map(n => [n, pct(L.limp[n]), L.limp[n].n]);
  const badLimp = limpStrong.filter(x => x[1] > 10);
  items.push({ id: 'rule:A1-limp', title: '強いキャラが最初にコールだけで入らない（プロポーカー A1）', status: !limpStrong.length ? 'warn' : rateStatus(badLimp),
    detail: limpStrong.length ? limpStrong.map(x => `${x[0]} ${x[1]}%（${x[2]}回）`).join('、') + '（10%以下で合格）' : '測れる回数が足りない' });
  // A1 後半：3BBのオープンに降りすぎない
  const O = [op6, op7, opF].reduce(merge);
  const foldStrong = STRONG.filter(n => O.faceOpen[n] && O.faceOpen[n].n >= 8).map(n => [n, pct(O.faceOpen[n]), O.faceOpen[n].n]);
  const badFold = foldStrong.filter(x => x[1] > 80);
  items.push({ id: 'rule:A1-faceopen', title: '強いキャラが3BBのオープンに降りすぎない（プロポーカー A1）', status: !foldStrong.length ? 'warn' : rateStatus(badFold),
    detail: foldStrong.length ? foldStrong.map(x => `${x[0]} 降りる ${x[1]}%（${x[2]}回）`).join('、') + '（80%以下で合格）' : '測れる回数が足りない' });
  // S2 リバーの大きなベット
  const R = [ob6, ob7, obF, ob14, ob14b].reduce(merge);
  const callStrong = STRONG.filter(n => R.rivBig[n] && R.rivBig[n].n >= 6).map(n => [n, pct(R.rivBig[n]), R.rivBig[n].n]);
  // 降りすぎ（10%未満）は、打って数えた回数が少なく揺れが大きいので ⚠️ だけ。合否は下の直接の測り方で決める（satou 2026-10-17「直接測定で判断」：v0.89.1 で CPU を変えずにジン 8%（49回）が出た）
  const badCall = callStrong.filter(x => x[1] > 40), lowCall = callStrong.filter(x => x[2] >= 30 && x[1] < 10);
  items.push({ id: 'rule:S2-overbet', title: '強いキャラがリバーのポット2倍ベットにコールしすぎない（プロポーカー S2）', status: !callStrong.length ? 'warn' : badCall.length ? rateStatus(badCall) : lowCall.length ? 'warn' : 'ok',
    detail: callStrong.length ? callStrong.map(x => `${x[0]} コール ${x[1]}%（${x[2]}回）`).join('、') + `（40%以下で合格。30回以上測れて10%未満なら降りすぎの ⚠️。外れたキャラが${MIN_N}回未満しか測れていなければ ⚠️）` : '測れる回数が足りない' });
  // S2 の直接の測り方（40%を超えたら ❌）
  {
    const d = await probeS2(browser, file);
    if (d.err) items.push({ id: 'rule:S2-direct', title: 'リバーの2倍ベットに中くらいの手でコールする割合（直接、プロポーカー S2）', status: 'warn', detail: '測れなかった: ' + d.err });
    else { const rows = Object.entries(d).map(([n, x]) => [n, Math.round(100 * x.call / Math.max(1, x.n)), x.n, x.lk]); const bad = rows.filter(x => x[1] > 40 || x[1] < 10);   // 降りすぎ（10%未満）もここで止める（上の打って数える方は ⚠️ だけ）
      items.push({ id: 'rule:S2-direct', title: 'リバーの2倍ベットに中くらいの手でコールする割合（直接、プロポーカー S2）', status: bad.length ? 'fail' : 'ok',   // v0.86.0 でカオルを直したので合否にする（v85 交代レビュー）
        detail: rows.map(x => `${x[0]} ${x[1]}%（${x[2]}回${x[3] ? `、弱点で決めた${x[3]}回は除く` : ''}）`).join('、') + '（でたらめな手への勝率45〜75%の手。10%以上40%以下で合格）' }) }
  }
  const errs = [s1, s1b, tour6, tour14, ura6, lim4, lim6, lim7, free6, ob6, ob7, obF, op6, op7, opF, ob14, ob14b].flatMap(x => (x.errs || []).concat(x.errors || []));
  if (errs.length) items.push({ id: 'rule:probe-errors', title: '再発チェック中のエラー', status: 'fail', detail: [...new Set(errs)].slice(0, 3).join(' / ') });
  return { name: 'プロポーカー目線の再発チェック', items };
}
module.exports = { run };
