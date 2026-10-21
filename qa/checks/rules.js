// 再発チェック：プロポーカー目線・ゲームクリエイター目線で見つかった問題が、また起きていないか
// 中身は research/プロポーカープレイヤー目線_実装仕様.md と research/プロ目線の改善_実装仕様.md の「確認」から
'use strict';
const fs = require('fs');
const H = require('../lib/harness');
const { pool } = require('../lib/pool');

// ゲームの関数を包んで、CPUの判断とショーダウンを記録する
const PROBE = `(() => {
  if (window.__probe) return; const P = window.__probe = { limp: {}, open: {}, rivBig: {}, faceOpen: {}, sdRefundBB: 0, sdHands: 0, twice: 0, twiceAsk: 0, bomb: 0, dealFreeCalls: 0, dealFreeChanged: 0, dealStoryCalls: 0, dealStoryChanged: 0, errs: [] };
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
  // 配りを変える関数（dealHelp：弱い手の引き直し、そこから呼ぶ p6Premium：強い手への入れ替え）が、フリー対戦で札を変えていないかを数える（改善提案 第12回 0-1）
  if (typeof dealHelp === 'function') { const _dh = dealHelp; dealHelp = function () { const free = !(CFG && CFG.ch), me = S && S.players && S.players[0], before = me && me.hand ? me.hand.map(c => c.r + c.s).join() : '';
    const r = _dh.apply(this, arguments); try { const after = me && me.hand ? me.hand.map(c => c.r + c.s).join() : ''; if (free) { P.dealFreeCalls++; if (after !== before) P.dealFreeChanged++ } else { P.dealStoryCalls++; if (after !== before) P.dealStoryChanged++ } } catch (e) { P.errs.push(e.message) } return r } }
  const _sh = startHand;
  startHand = function () { if (S) S.__sd = false; const r = _sh.apply(this, arguments);
    try { if (/ボムポット/.test((document.querySelector('#log > *') || {}).textContent || '') || [...document.querySelectorAll('#log > *')].slice(0, 6).some(x => /ボムポット！/.test(x.textContent))) P.bomb++ } catch (e) {} return r };
  setInterval(() => { try { if (S && S.twice && S.__tw !== S.handNo) { S.__tw = S.handNo; P.twice++ } if (S && !S.handOver && typeof twiceAskable === 'function' && twiceAskable() && S.__ta !== S.handNo) { S.__ta = S.handNo; P.twiceAsk++ } } catch (e) {} }, 5);
})();`;

// round：境目で回数を足すとき（案3）の何回り目か。0 は今までと同じ種
async function session(browser, file, start, policy, hands, storage, round = 0) {
  const { ctx, page } = await H.openGame(browser, file, { fast: 60, storage, seed: round ? H.seedOf('rules', start, policy, 'r' + round) : H.seedOf('rules', start, policy) });
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
function merge(a, b) { const o = JSON.parse(JSON.stringify(a)); for (const k of ['limp', 'rivBig', 'faceOpen']) for (const n in b[k]) { o[k][n] = o[k][n] || { n: 0, hit: 0 }; o[k][n].n += b[k][n].n; o[k][n].hit += b[k][n].hit } for (const k of ['sdRefundBB', 'sdHands', 'twice', 'twiceAsk', 'bomb', 'hands', 'dealFreeCalls', 'dealFreeChanged', 'dealStoryCalls', 'dealStoryChanged']) o[k] = (o[k] || 0) + (b[k] || 0); return o }

const STRONG = ['ジン', 'クロウ', 'ハヤト', 'レイカ', 'カオル'];
// 割合を見る検査は、測れた回数が少ないと1〜2回の違いで外れる（2026-10-14 PR #22 で S2 がジン 11回 45% で ❌、同じ中身の #21 は ✅）。
// 外れたキャラが MIN_N 回以上測れていれば ❌、全部それより少なければ ⚠️（CIのチェック充実 案1）
const MIN_N = 20;
const rateStatus = bad => !bad.length ? 'ok' : bad.some(x => x[2] >= MIN_N) ? 'fail' : 'warn';
// 境目かどうか（CIの高速化 案3、2026-10-17）：割合が合格の線を外れたが、回数が MIN_N 未満か、線との差がぶれ（標準誤差の2倍）の内。
// そのときは同じ打ち方をもう一回り（別の種で）足してから決める。前は外れるたびに CI 全体（約25分）をやり直していた（v0.89.1 で7回）
const unsure = (hit, n, line) => { const p = hit / Math.max(1, n); return n < MIN_N || Math.abs(p - line) <= 2 * Math.sqrt(Math.max(p * (1 - p), .02) / Math.max(1, n)) };
const MORE = '（境目だったので、同じ打ち方をもう一回り足して決めた）';


// S2 の直接の測り方（v85.2 交代レビュー案）：対戦を回さず、1対1・リバー・ポットP・相手が2Pベットの場面を作って、
// 強いキャラに「中くらいの強さ」（でたらめな手に対する勝率 45〜75%）の手を配り、判断（cpuDecide0）だけを各200回呼ぶ。弱点（S._lk）で決めた判断は数えない
async function probeS2(browser, file, round = 0) {
  const { ctx, page } = await H.openGame(browser, file, { fast: 40, storage: H.UNLOCKED, seed: round ? H.seedOf('rules', 's2probe', 'direct', 'r' + round) : H.seedOf('rules', 's2probe', 'direct') });
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

// 対戦の組（--part で分けるときの単位。結果を混ぜて見る検査ごと）：A = S1・A2、L = A1 リンプ、O = A1 オープンに降りる、R = S2
// --part k/n では FAM_PARTS の i 番目を (i % n) + 1 番目の組が回す（n=3 なら 1:A、2:L+O、3:R。それぞれ5〜7対戦）
const FAM_PARTS = [['A'], ['L', 'O'], ['R']];

async function run({ browser, file, quick, part = null }) {
  // リバーの2倍ベット（S2）は、短い版でも強いキャラごとに20回ほど測れるように多めに打つ（CIのチェック充実 案1）
  const H1 = quick ? 25 : 80, H2 = quick ? 60 : 120, items = [];
  const st7 = H.UNLOCKED;
  // S1（BBアンティが返らない）は、ゲームに Rules（19b_rules.js）が入っていれば単体テスト unit:uncalled で確かめる（2026-10-14）
  const unitS1 = fs.readFileSync(file, 'utf8').includes('// @unit-begin rules');
  const jobs = [
    ['startChapter(CHAPTERS[0],true)', 'call', H1, , 'A'],
    [`($('freeSize').value='6',startFree())`, 'call', H1, , 'A'],
    ['startChapter(CHAPTERS[5],true)', 'random', H1, , 'A'],
    ['startP2(PART2[3],true)', 'random', H1, st7, 'A'],
    ['startUra(6)', 'random', H1, , 'A'],
    ['startChapter(CHAPTERS[3],true)', 'fold', H1, , 'L'],
    ['startChapter(CHAPTERS[5],true)', 'fold', H1, , 'L'],
    ['startChapter(CHAPTERS[6],true)', 'fold', H1, , 'L'],
    [`($('freeSize').value='6',startFree())`, 'fold', H1, , 'L'],
    ['startChapter(CHAPTERS[5],true)', 'overbet', H2, , 'R'],
    ['startChapter(CHAPTERS[6],true)', 'overbet', H2, , 'R'],
    [`($('freeSize').value='6',startFree())`, 'overbet', H2, , 'R'],
    ['startChapter(CHAPTERS[5],true)', 'open3', H1, , 'O'],
    ['startChapter(CHAPTERS[6],true)', 'open3', H1, , 'O'],
    [`($('freeSize').value='6',startFree())`, 'open3', H1, , 'O'],
    // S2：クロウ・カオルは第14章の卓にいる。ほかの卓だけでは12回・8回しか測れず揺れていた（v83 レビュー）ので、第14章でも2倍ベットを打つ
    ['startP2(PART2[3],true)', 'overbet', H2, st7, 'R'],
    // v84 から S2 は1対1のリバーだけ数えるので、クロウは11回しか測れなかった（v85 交代レビュー）。第14章をもう1回打って20回以上にする（かっこで包んで種を変える）
    ['(startP2(PART2[3],true))', 'overbet', H2, st7, 'R'],
    // フリー対戦の札が公平か（改善提案 第12回 0-1）：200ハンド配って、配りを変える関数が1回も札を変えないこと。降りるだけなので速い（かっこで包んで種を変える）
    [`(($('freeSize').value='6',startFree()))`, 'fold', quick ? 60 : 200, , 'A'],
  ];
  const want = f => !part || FAM_PARTS.findIndex(g => g.includes(f)) % part.n === part.k - 1;
  const skip = unitS1 ? [0, 1] : [], EMPTY = { limp: {}, rivBig: {}, faceOpen: {}, sdRefundBB: 0, sdHands: 0, hands: 0, errs: [], errors: [] };
  const res = jobs.map(() => EMPTY), of = f => jobs.map((j, k) => k).filter(k => jobs[k][4] === f && !skip.includes(k));
  const both = (a, b) => Object.assign(merge(a, b), { errs: (a.errs || []).concat(b.errs || []), errors: (a.errors || []).concat(b.errors || []) });
  // 4つまで同時に、1つ終わったらすぐ次（CIの高速化 案2。一度に全部だと遅くなりすぎる）
  const play = async (idx, round) => { const got = await pool(idx.map(k => () => session(browser, file, jobs[k][0], jobs[k][1], jobs[k][2], jobs[k][3], round)), 4); idx.forEach((k, j) => { res[k] = round ? both(res[k], got[j]) : got[j] }) };
  const fams = ['A', 'L', 'O', 'R'].filter(want);
  await play(fams.flatMap(of), 0);
  const sum = f => of(f).map(k => res[k]).reduce(merge, EMPTY);
  // 割合の検査の行：[名前, %, 回数, 当たった回数]
  const rowsOf = (o, min) => STRONG.filter(n => o[n] && o[n].n >= min).map(n => [n, pct(o[n]), o[n].n, o[n].hit]);
  const judge = {
    L: () => { const r = rowsOf(sum('L').limp, 8); return { r, more: !r.length || r.some(x => x[1] > 10 && unsure(x[3], x[2], .10)) } },
    O: () => { const r = rowsOf(sum('O').faceOpen, 8); return { r, more: !r.length || r.some(x => x[1] > 80 && unsure(x[3], x[2], .80)) } },
    // S2 は打って数える方では合否を決めない（下）ので、回数は足さない
    R: () => ({ r: rowsOf(sum('R').rivBig, 6), more: false }),
  };
  // 案3：境目の検査だけ、同じ打ち方をもう一回り足す（足した組はまとめて同時に回す）
  const added = fams.filter(f => judge[f] && judge[f]().more);
  if (added.length) await play(added.flatMap(of), 1);
  const note = f => added.includes(f) ? MORE : '';
  if (want('A')) {
    // 途中で止まって数ハンドしか見ていないのに通さない（CodeRabbit PR #122）。負けて早く終わることもあるので、目標の数ではなく最低の数にする
    { const FAIR_MIN = 20, f = res[jobs.length - 1], st = of('A').map(k => res[k]).reduce(merge, EMPTY);
      items.push({ id: 'rule:fair-free', title: 'フリー対戦の札は、配りを変える関数（弱い手の引き直し・強い手への入れ替え）で変わらない',
        status: f.dealFreeCalls < FAIR_MIN ? 'fail' : f.dealFreeChanged ? 'fail' : 'ok',
        detail: !f.dealFreeCalls ? `数えられなかった（dealHelp が ${f.hands}ハンドで1回も呼ばれていない。呼ぶ所が変わったら、この検査も直す）` : f.dealFreeCalls < FAIR_MIN ? `フリー対戦が ${f.dealFreeCalls}回しか配られなかった（${FAIR_MIN}回は見たい。途中で止まった？）` : `フリー対戦 ${f.dealFreeCalls}回配って、札が変わったのは ${f.dealFreeChanged}回${f.dealFreeChanged ? '（フリー対戦の札が公平でない）' : ''}（くらべ：物語の章では ${st.dealStoryCalls}回のうち ${st.dealStoryChanged}回変わった）` }) }
    const [s1, s1b, tour6, tour14, ura6] = res;
    // S1 BBアンティ
    const a = merge(s1, s1b);
    if (!unitS1) items.push({ id: 'rule:S1-ante', title: 'BBアンティがショーダウンでBBに返らない（プロポーカー S1）', status: a.sdRefundBB ? 'fail' : 'ok',
      detail: `全員コールのショーダウン ${a.sdHands}回のうち、アンティがBBに返った ${a.sdRefundBB}回` });
    // A2 トーナメント
    const t = merge(merge(tour6, tour14), ura6);
    items.push({ id: 'rule:A2-twice', title: 'トーナメント（第6章・第14章・裏の卓）で2回めくりが出ない（プロポーカー A2）', status: (t.twice || t.twiceAsk) ? 'fail' : 'ok',
      detail: `${t.hands}ハンドで、2回めくりの提案 ${t.twiceAsk}回、実施 ${t.twice}回` });
    items.push({ id: 'rule:A2-bomb', title: '第6章でボムポットが出ない（プロポーカー A2）', status: tour6.bomb ? 'fail' : 'ok', detail: `第6章 ${tour6.hands}ハンドでボムポット ${tour6.bomb}回` });
  }
  // A1 リンプ
  if (want('L')) {
    const limpStrong = judge.L().r, badLimp = limpStrong.filter(x => x[1] > 10);
    items.push({ id: 'rule:A1-limp', title: '強いキャラが最初にコールだけで入らない（プロポーカー A1）', status: !limpStrong.length ? 'warn' : rateStatus(badLimp),
      detail: (limpStrong.length ? limpStrong.map(x => `${x[0]} ${x[1]}%（${x[2]}回）`).join('、') + '（10%以下で合格）' : '測れる回数が足りない') + note('L') });
  }
  // A1 後半：3BBのオープンに降りすぎない
  if (want('O')) {
    const foldStrong = judge.O().r, badFold = foldStrong.filter(x => x[1] > 80);
    items.push({ id: 'rule:A1-faceopen', title: '強いキャラが3BBのオープンに降りすぎない（プロポーカー A1）', status: !foldStrong.length ? 'warn' : rateStatus(badFold),
      detail: (foldStrong.length ? foldStrong.map(x => `${x[0]} 降りる ${x[1]}%（${x[2]}回）`).join('、') + '（80%以下で合格）' : '測れる回数が足りない') + note('O') });
  }
  // S2 リバーの大きなベット
  if (want('R')) {
    const callStrong = judge.R().r;
    // 打って数える方は ⚠️ だけ。合否は下の直接の測り方で決める。強い手での正しいコールも数えるので、中くらいの手だけを見る直接の測り方と食い違う
    // （satou 2026-10-17「直接測定で判断」：降りすぎ＝v0.89.1 でジン 8%（49回）、コールしすぎ＝回数を足すとクロウ 48%（29回））
    const badCall = callStrong.filter(x => x[1] > 40), lowCall = callStrong.filter(x => x[2] >= 30 && x[1] < 10);
    items.push({ id: 'rule:S2-overbet', warnOnly: '2026-10-17 satou：ゲーム内の S2 は ⚠️ だけ。合否は直接の測り方 S2-direct で決める', title: '強いキャラがリバーのポット2倍ベットにコールしすぎない（プロポーカー S2）', status: !callStrong.length || badCall.length || lowCall.length ? 'warn' : 'ok',
      detail: (callStrong.length ? callStrong.map(x => `${x[0]} コール ${x[1]}%（${x[2]}回）`).join('、') + '（40%以下・30回以上なら10%以上で ✅、外れたら ⚠️。合否は直接の測り方 S2-direct で決める）' : '測れる回数が足りない') });
    // S2 の直接の測り方（10%以上40%以下で合格）。境目なら別の種でもう200回ずつ足す（案3）
    let d = await probeS2(browser, file), more = '';
    const rowsD = d => Object.entries(d).map(([n, x]) => [n, Math.round(100 * x.call / Math.max(1, x.n)), x.n, x.lk, x.call]);
    if (!d.err && rowsD(d).some(x => (x[1] > 40 && unsure(x[4], x[2], .40)) || (x[1] < 10 && unsure(x[4], x[2], .10)))) {
      const d2 = await probeS2(browser, file, 1);
      if (!d2.err) { for (const n in d2) if (d[n]) { d[n].n += d2[n].n; d[n].call += d2[n].call; d[n].lk += d2[n].lk } more = '（境目だったので、別の配り方でもう200回ずつ足して決めた）' }
    }
    if (d.err) items.push({ id: 'rule:S2-direct', title: 'リバーの2倍ベットに中くらいの手でコールする割合（直接、プロポーカー S2）', status: 'warn', detail: '測れなかった: ' + d.err });
    else { const rows = rowsD(d); const bad = rows.filter(x => x[1] > 40 || x[1] < 10);   // 降りすぎ（10%未満）もここで止める（上の打って数える方は ⚠️ だけ）
      items.push({ id: 'rule:S2-direct', title: 'リバーの2倍ベットに中くらいの手でコールする割合（直接、プロポーカー S2）', status: bad.length ? 'fail' : 'ok',   // v0.86.0 でカオルを直したので合否にする（v85 交代レビュー）
        detail: rows.map(x => `${x[0]} ${x[1]}%（${x[2]}回${x[3] ? `、弱点で決めた${x[3]}回は除く` : ''}）`).join('、') + '（でたらめな手への勝率45〜75%の手。10%以上40%以下で合格）' + more }) }
  }
  const errs = res.flatMap(x => (x.errs || []).concat(x.errors || []));
  if (errs.length) items.push({ id: 'rule:probe-errors', title: '再発チェック中のエラー', status: 'fail', detail: [...new Set(errs)].slice(0, 3).join(' / ') });
  return { name: 'プロポーカー目線の再発チェック', items };
}
module.exports = { run };
