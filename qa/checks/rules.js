// 再発チェック：プロポーカー目線・ゲームクリエイター目線で見つかった問題が、また起きていないか
// 中身は research/プロポーカープレイヤー目線_実装仕様.md と research/プロ目線の改善_実装仕様.md の「確認」から
'use strict';
const fs = require('fs');
const H = require('../lib/harness');
const { pool } = require('../lib/pool');

// ゲームの関数を包んで、CPUの判断とショーダウンを記録する
const PROBE = `(() => {
  if (window.__probe) return; const P = window.__probe = { limp: {}, open: {}, rivBig: {}, faceOpen: {}, sdRefundBB: 0, sdHands: 0, twice: 0, twiceAsk: 0, bomb: 0, dealFreeCalls: 0, dealFreeChanged: 0, dealStoryCalls: 0, dealStoryChanged: 0, dealEntry: 0, deal: {}, errs: [] };
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
  // 配りを変える仕組みが、フリー対戦で札を変えていないかを数える（改善提案 第12回 0-1）。
  // 配りを変える仕組みは全部、入口 LT.dealRun（js/54_deal_mod.js、LT.DEAL_MODS に登録）から呼ばれるので、入口の前後で全員の手札と山を比べる（research/配り札と場札の操作_実装仕様.md §6）。
  // 入口の無い古い版だけ、前の数え方（dealHelp を包む）
  const snap = () => { try { return S.players.map(p => (p.hand || []).map(c => c.r + '' + c.s).join()).join('|') + '#' + (S.deck || []).map(c => c.r + '' + c.s).join() } catch (e) { return '' } };
  if (typeof LT !== 'undefined' && typeof LT.dealRun === 'function') { P.dealEntry = 1; const _dr = LT.dealRun; LT.dealRun = function (when) { const free = !(CFG && CFG.ch), before = snap();
    const r = _dr.apply(this, arguments); try { const ch = snap() !== before; if (free) { if (when === 'hand') P.dealFreeCalls++; if (ch) P.dealFreeChanged++ } else { if (when === 'hand') P.dealStoryCalls++; if (ch) P.dealStoryChanged++ } } catch (e) { P.errs.push(e.message) } return r } }
  else if (typeof dealHelp === 'function') { const _dh = dealHelp; dealHelp = function () { const free = !(CFG && CFG.ch), me = S && S.players && S.players[0], before = me && me.hand ? me.hand.map(c => c.r + c.s).join() : '';
    const r = _dh.apply(this, arguments); try { const after = me && me.hand ? me.hand.map(c => c.r + c.s).join() : ''; if (free) { P.dealFreeCalls++; if (after !== before) P.dealFreeChanged++ } else { P.dealStoryCalls++; if (after !== before) P.dealStoryChanged++ } } catch (e) { P.errs.push(e.message) } return r } }
  // 物語の章の配り（仕様 §6・§7 の「できた」）：章ごとに、弱い手の続き・フロップの絡み・目標の場面の回数・読み勝ちのあとの負け
  if (P.dealEntry) {
    const chKey = () => CFG && CFG.ch ? (CFG.ch.p2 ? 10 + CFG.ch.p2 : CFG.ch.no) : 0, D = () => { const k = chKey(); return P.deal[k] = P.deal[k] || { hands: 0, weak2: 0, weak3: 0, flop: 0, air: 0, lesson: 0, lessonBad: 0, rg: 0, rgLost: 0, mods: {} } };
    const draw4 = (h, b) => { const cs = h.concat(b); for (let s = 0; s < 4; s++) if (cs.filter(c => c.s === s).length >= 4 && h.some(c => c.s === s)) return true;
      const rs = new Set(cs.map(c => c.r)); if (rs.has(14)) rs.add(1); for (let lo = 1; lo <= 10; lo++) { let n = 0, m = false; for (let r = lo; r < lo + 5; r++) if (rs.has(r)) { n++; if (h.some(c => c.r === r || (r === 1 && c.r === 14))) m = true } if (n >= 4 && m) return true } return false };
    LT.on('startHand', () => { try { if (!CFG.ch || !LT.dealOk('board')) return; const d = D(), me = S.players[0]; if (!me || me.out || !me.hand || me.hand.length !== 2) return; d.hands++;
      if (S.mistakeHand === S.handNo) { S.__wr = 0; return }   // ディーラーのミスで配り直したハンドは数えない
      S.__wr = preTier(me.hand) === 0 ? (S.__wr || 0) + 1 : 0; if (S.__wr === 2) d.weak2++; if (S.__wr === 3) d.weak3++ } catch (e) { P.errs.push(e.message) } });
    LT.on('nextStreet', () => { try { if (!CFG.ch || S.street !== 'flop' || !LT.dealOk('board')) return; const me = S.players[0]; if (!inHand(me)) return; const d = D(); d.flop++;
      if (isWeak(me.hand, S.board) && !draw4(me.hand, S.board)) d.air++ } catch (e) { P.errs.push(e.message) } });
    // 読み勝ち：今のストリートで残っている相手がブラフ（本当がブラフ）のクセで賭け、自分は残っていて、その時点で勝っている（入口の後に呼ばれる合図）
    LT.on('nextStreet:before', () => { try { if (!CFG.ch || !LT.dealOk('board') || S.handOver || S.board.length < 3 || S.board.length >= 5) return; const me = S.players[0]; if (!inHand(me)) return;
      const ch = CFG.ch; if (!(ch.p2 || ch.no >= 4)) return; const op = S.players.filter(p => p !== me && inHand(p)); if (!op.length) return;
      if (!op.some(p => (p.tellLog || []).some(t => t && t.truth === 'bluff' && t.street === S.street))) return;
      const m = bestN(me.hand.concat(S.board)); if (op.every(p => cmp(m, bestN(p.hand.concat(S.board))) > 0)) S.__rg = S.handNo } catch (e) { P.errs.push(e.message) } });
    // 配りを変えた記録（S.dealLog はそのハンドの間だけ。場札の分も入るよう、ハンドの終わりに数える）
    LT.on('endHand', () => { try { if (!CFG.ch || S.__dl === S.handNo) return; S.__dl = S.handNo; const d = D();
      (S.dealLog || []).forEach(x => { d.mods[x.name] = (d.mods[x.name] || 0) + 1; if (x.name === 'lessonScene') { d.lesson++; if (S.handNo % 3 === 0) d.lessonBad++ } }) } catch (e) { P.errs.push(e.message) } });
    LT.on('endHand', () => { try { if (S.__rg !== S.handNo || S.__rgDone === S.handNo) return; S.__rgDone = S.handNo; const me = S.players[0]; if (me.folded) return; const d = D(); d.rg++; if (!(me.won > 0)) d.rgLost++ } catch (e) { P.errs.push(e.message) } });
  }
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
function merge(a, b) { const o = JSON.parse(JSON.stringify(a)); for (const k of ['limp', 'rivBig', 'faceOpen']) for (const n in b[k]) { o[k][n] = o[k][n] || { n: 0, hit: 0 }; o[k][n].n += b[k][n].n; o[k][n].hit += b[k][n].hit } for (const k of ['sdRefundBB', 'sdHands', 'twice', 'twiceAsk', 'bomb', 'hands', 'dealFreeCalls', 'dealFreeChanged', 'dealStoryCalls', 'dealStoryChanged']) o[k] = (o[k] || 0) + (b[k] || 0);
  o.dealEntry = (o.dealEntry || 0) + (b.dealEntry || 0); o.deal = o.deal || {}; for (const c in b.deal || {}) { const x = o.deal[c] = o.deal[c] || { mods: {} }, y = b.deal[c]; for (const k in y) if (k === 'mods') { for (const n in y.mods) x.mods[n] = (x.mods[n] || 0) + y.mods[n] } else x[k] = (x[k] || 0) + y[k] } return o }

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

// rule:deal-variety（research/配り札と場札の操作_実装仕様.md §8-5）：決まった札の場面（第4・5章の一騎打ち、第5章の最初の1手、第7章の最後）を、ゲームの配り方（setupScript）で各20回配る。
// 同じページで続けて配る＝保存（shisho-story の deal）を引き継いで続けて遊ぶ形。最後の1手のハンド目は、卓を開き直して20回見る
async function probeVariety(browser, file) {
  const { ctx, page } = await H.openGame(browser, file, { fast: 40, storage: H.UNLOCKED, seed: H.seedOf('rules', 'variety', 'direct') });
  try {
    return await page.evaluate(async () => {
      if (typeof kataDeal !== 'function') return { none: true };
      const key = h => h.map(c => c.r + '' + c.s).join(' '), out = {};
      const boardOf = () => { const d = S.deck.slice(), b = []; while (b.length < 5) { d.pop(); const n = b.length ? 1 : 3; for (let k = 0; k < n; k++) b.push(d.pop()) } return b };
      const scenes = [['ch4', 3, () => { S.handNo = 5; S.duelHand = true }], ['ch5', 4, () => { S.handNo = 5; S.duelHand = true }], ['ch5first', 4, () => { S.handNo = 1; S.duelHand = false }], ['ch7', 6, () => { S.handNo = 9; S.finalNext = 9; S.finalRead = false; S.duelHand = false }]];
      for (const [name, ci, prep] of scenes) {
        const o = out[name] = { deals: [], picks: [], perms: [], at: [] };
        startChapter(CHAPTERS[ci], true); await new Promise(r => setTimeout(r, 300));
        for (let i = 0; i < 20; i++) {
          S.players.forEach(p => { if (!p.out) p.hand = [] }); prep(); S.dealPick59 = null; setupScript();
          const pk = S.dealPick59; if (!pk) { o.deals.push('（配られなかった）'); continue }
          o.deals.push(key(S.players[0].hand) + ' / ' + key(boardOf())); o.picks.push(pk.k); o.perms.push(pk.perm);
        }
        S.duelHand = false; S.scriptAI = null; S.finalHand = false;
      }
      // 第7章：最後の1手が何ハンド目に来るか（卓を開き直して20回）
      const at = out.ch7.at;
      for (let i = 0; i < 20; i++) { startChapter(CHAPTERS[6], true); await new Promise(r => setTimeout(r, 50));
        let h = 0; for (let n = 1; n <= 12 && !h; n++) { S.handNo = n; S.finalRead = false; setupScript(); if (S.finalHand) h = n; S.finalHand = false; S.scriptAI = null } at.push(h) }
      return out;
    });
  } catch (e) { return { err: e.message } } finally { await ctx.close() }
}

// 対戦の組（--part で分けるときの単位。結果を混ぜて見る検査ごと）：A = S1・A2、L = A1 リンプ、O = A1 オープンに降りる、R = S2
// --part k/n では FAM_PARTS の i 番目を (i % n) + 1 番目の組が回す（n=3 なら 1:A、2:L+O、3:R。それぞれ5〜7対戦）
const FAM_PARTS = [['A'], ['L', 'O'], ['R'], ['D']];   // D（物語の章の配り）は n=3 なら 1 番目の組（A と一緒）

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
    // D 物語の章の配り（research/配り札と場札の操作_実装仕様.md §6・§7）：第1〜5章をゲームの CPU と同じ考え方で（弱い手の続き・フロップの絡み・目標の場面）、
    // 第4・5章・第11〜14章をクセを読んで打つ（読み勝ちのあとに負けない）
    ...[0, 1, 2, 3, 4].map(k => [`startChapter(CHAPTERS[${k}],true)`, 'cpu', quick ? 60 : 200, , 'D']),
    ...[3, 4].map(k => [`(startChapter(CHAPTERS[${k}],true))`, 'tell', quick ? 40 : 120, , 'D']),
    ...[0, 1, 2, 3].map(k => [`startP2(PART2[${k}],true)`, 'tell', quick ? 40 : 100, st7, 'D']),
  ];
  const want = f => !part || FAM_PARTS.findIndex(g => g.includes(f)) % part.n === part.k - 1;
  const skip = unitS1 ? [0, 1] : [], EMPTY = { limp: {}, rivBig: {}, faceOpen: {}, sdRefundBB: 0, sdHands: 0, hands: 0, errs: [], errors: [] };
  const res = jobs.map(() => EMPTY), of = f => jobs.map((j, k) => k).filter(k => jobs[k][4] === f && !skip.includes(k));
  const both = (a, b) => Object.assign(merge(a, b), { errs: (a.errs || []).concat(b.errs || []), errors: (a.errors || []).concat(b.errors || []) });
  // 4つまで同時に、1つ終わったらすぐ次（CIの高速化 案2。一度に全部だと遅くなりすぎる）
  const play = async (idx, round) => { const got = await pool(idx.map(k => () => session(browser, file, jobs[k][0], jobs[k][1], jobs[k][2], jobs[k][3], round)), 4); idx.forEach((k, j) => { res[k] = round ? both(res[k], got[j]) : got[j] }) };
  const fams = ['A', 'L', 'O', 'R', 'D'].filter(want);
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
    { const FAIR_MIN = 20, f = res[jobs.findIndex(j => j[0] === `(($('freeSize').value='6',startFree()))`)], st = of('A').map(k => res[k]).reduce(merge, EMPTY);
      items.push({ id: 'rule:fair-free', title: 'フリー対戦の札は、配りを変える仕組み（入口 LT.dealRun に登録したもの全部）で変わらない',
        status: f.dealFreeCalls < FAIR_MIN ? 'fail' : f.dealFreeChanged ? 'fail' : 'ok',
        detail: !f.dealFreeCalls ? `数えられなかった（${f.dealEntry ? '入口 LT.dealRun' : 'dealHelp'} が ${f.hands}ハンドで1回も呼ばれていない。呼ぶ所が変わったら、この検査も直す）` : f.dealFreeCalls < FAIR_MIN ? `フリー対戦が ${f.dealFreeCalls}回しか配られなかった（${FAIR_MIN}回は見たい。途中で止まった？）` : `フリー対戦 ${f.dealFreeCalls}回配って、札が変わったのは ${f.dealFreeChanged}回${f.dealFreeChanged ? '（フリー対戦の札が公平でない）' : ''}（くらべ：物語の章では ${st.dealStoryCalls}回のうち ${st.dealStoryChanged}回変わった）` }) }
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
  // D 物語の章の配り（仕様 §6・§7 の「できた」の条件）
  if (want('D')) {
    { const v = await probeVariety(browser, file);
      if (v.err || v.none) items.push({ id: 'rule:deal-variety', title: '決まった札の場面が、毎回ちがう札に見える（§8）', status: 'warn', detail: v.err ? '測れなかった: ' + v.err : '型で配る仕組み（kataDeal）が無い版なので測っていない' });
      else { const bad = [], warn = [], rows = [];
        for (const [n, o] of Object.entries(v)) { const cnt = {}; o.deals.forEach(d => cnt[d] = (cnt[d] || 0) + 1); const dup = o.deals.length - Object.keys(cnt).length, rep = o.picks.filter((k, i) => i && k === o.picks[i - 1]).length, perms = new Set(o.perms).size;
          if (o.deals.includes('（配られなかった）')) bad.push(`${n} 配られなかった回がある`); if (dup >= 2) bad.push(`${n} まったく同じ札が ${dup}回`); if (rep) bad.push(`${n} 同じ型が続いた ${rep}回`);
          if (perms < 4) warn.push(`${n} スートの並び ${perms}種`); if (n === 'ch7' && new Set(o.at).size < 2) warn.push(`ch7 最後の1手のハンド目が ${[...new Set(o.at)].join('・')} だけ`);
          rows.push(`${n} ${o.deals.length}回：ちがう札 ${Object.keys(cnt).length}組、型 ${[...new Set(o.picks)].length}種（${o.picks.join('')}）、スートの並び ${perms}種` + (n === 'ch7' ? `、最後の1手のハンド目 ${[...new Set(o.at)].sort((a, b) => a - b).join('・')}` : '')) }
        items.push({ id: 'rule:deal-variety', title: '決まった札の場面が、毎回ちがう札に見える（同じ札が2回以上・同じ型が続く は ❌、スート・ハンド目が散らない は ⚠️。§8）', status: bad.length ? 'fail' : warn.length ? 'warn' : 'ok',
          detail: (bad.length ? bad.join('、') + '。' : '') + (warn.length ? warn.join('、') + '。' : '') + rows.join(' ／ ') }) } }
    const all = of('D').map(k => res[k]).reduce(merge, EMPTY), dd = all.deal || {}, name = c => c > 10 ? `第二部第${c - 10}章` : `第${c}章`, sumOf = (cs, k) => cs.reduce((a, c) => a + ((dd[c] || {})[k] || 0), 0);
    if (!all.dealEntry) items.push({ id: 'rule:deal-story', title: '物語の章の配り（入口 LT.dealRun）', status: 'warn', detail: '入口が無い版なので測っていない' });
    else {
      const c15 = [1, 2, 3, 4, 5], hands = sumOf(c15, 'hands'), w2 = c15.filter(c => c !== 1).map(c => [c, (dd[c] || {}).weak2 || 0]).filter(x => x[1]), w3 = sumOf(c15, 'weak3');
      items.push({ id: 'rule:deal-weakrun', title: '物語の章で、弱い手が続かない（2回続くのは第1章だけ、3回続くのは0回）', status: hands < 100 ? 'warn' : (w2.length || w3) ? 'fail' : 'ok',
        detail: `第1〜5章 ${hands}ハンド：弱い手が2回続いた 第1章 ${(dd[1] || {}).weak2 || 0}回${w2.length ? '、' + w2.map(x => `${name(x[0])} ${x[1]}回`).join('、') + '（第1章のほかで続いた）' : '、ほかの章 0回'}、3回続いた ${w3}回（ディーラーのミスで配り直したハンドは数えない）${hands < 100 ? '（100ハンドは見たい）' : ''}` });
      const fl = sumOf(c15, 'flop'), air = sumOf(c15, 'air'), pa = fl ? Math.round(air / fl * 100) : 0;
      items.push({ id: 'rule:deal-flop', title: 'フロップまで残ったハンドで、自分に何も絡まない割合が 25% 以下（第1〜5章）', status: fl < 60 ? 'warn' : pa > 25 ? 'fail' : 'ok',
        detail: `フロップまで残った ${fl}ハンドのうち、ペア（自分の札で）も4枚のドローも無い ${air}回（${pa}%）${fl < 60 ? '（60ハンドは見たい）' : ''}` });
      const cl = [2, 3, 4], ln = sumOf(cl, 'lesson'), lb = sumOf(cl, 'lessonBad'), lo = [1, 5].concat([11, 13, 14]).filter(c => (dd[c] || {}).lesson);
      items.push({ id: 'rule:deal-lesson', title: '章の目標の場面（lessonScene）は第2・3・4章（と第二部第2章）だけ、3ハンドのうち2ハンドまで', status: (lb || lo.length) ? 'fail' : !ln ? 'warn' : 'ok',
        detail: `第2〜4章 ${sumOf(cl, 'hands')}ハンドで ${ln}回（3の倍数のハンドで起きた ${lb}回）${lo.length ? '、ほかの章で起きた：' + lo.map(name).join('、') : ''}${ln ? '' : '（1回も起きていない）'}` });
      const rc = [4, 5, 11, 12, 13, 14], rg = sumOf(rc, 'rg'), rl = sumOf(rc, 'rgLost');
      items.push({ id: 'rule:deal-readguard', title: 'ブラフのクセにコールして、その時点で勝っていたハンドは、最後に負けない（第4・5章、第11〜14章）', status: rl ? 'fail' : rg < 3 ? 'warn' : 'ok',
        detail: `そのハンド ${rg}回のうち、最後に負けた ${rl}回${rg < 3 ? '（3回は見たい）' : ''}。章ごと：` + rc.filter(c => dd[c]).map(c => `${name(c)} ${(dd[c] || {}).rg || 0}回`).join('、') });
      items.push({ id: 'rule:deal-mods', title: '物語の章で、配りを変えた回数（参考）', status: 'ok',
        detail: Object.keys(dd).sort((a, b) => a - b).map(c => `${name(+c)} ${dd[c].hands}ハンド：` + (Object.entries(dd[c].mods || {}).map(([n, v]) => `${n} ${v}`).join('・') || 'なし')).join(' ／ ') });
    }
  }
  const errs = res.flatMap(x => (x.errs || []).concat(x.errors || []));
  if (errs.length) items.push({ id: 'rule:probe-errors', title: '再発チェック中のエラー', status: 'fail', detail: [...new Set(errs)].slice(0, 3).join(' / ') });
  return { name: 'プロポーカー目線の再発チェック', items };
}
module.exports = { run };
