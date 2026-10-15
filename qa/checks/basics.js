// ルールの基本：ノーリミットホールデムの決まりどおりに動いているか（レビューの仕組み 案1、2026-10-10）
//   出どころ: research/ノーリミットホールデムのルール.md
//   ショーダウンの配り方は、ゲームとは別に書いた役判定（qa/unit/ref_eval.js）で確かめる
'use strict';
const H = require('../lib/harness');

// 役の判定（basic:eval）は 2026-10-14 からブラウザを使わない単体テストへ移した：qa/unit/tests/eval.js（別に書いた判定は qa/unit/ref_eval.js）
const REF = require('../unit/ref_eval');
// ブラウザの中で使う別の役判定（PROBE の中だけで使う。ゲームの cmp などは上書きしない）
const EVAL = `const [__ev,__cmp]=(()=>{${REF.five}\n${REF.cmp}\n${REF.ev}\nreturn [ev,cmp]})();`;

// ゲームの関数を包んで、打つたびに決まりを確かめる
const PROBE = `(() => {
  if (window.__bp) return; ${EVAL}
  const P = window.__bp = { acts: 0, raises: 0, minRaiseBad: [], reopenBad: [], blindBad: [], orderBad: [], sd: 0, sdBad: [], errs: [], checkBlinds: true };
  const nm = i => S.players[i] ? S.players[i].name : '?';
  let key = '', closed = {}, closedAt = {}, first = true;
  const _sh = startHand;
  startHand = function () {
    const r = _sh.apply(this, arguments);
    try {
      key = ''; closed = {}; closedAt = {}; first = true; P.order0 = S.players.map(q => q.name).join(',') + '|' + S.dealer;
      const live = p => !p.out, alive = S.players.filter(live).length;
      const sb = alive === 2 ? S.dealer : nextIdx(S.dealer, live), bb = nextIdx(sb, live);
      const p1 = S.players[sb], p2 = S.players[bb];
      if (P.checkBlinds && !CFG.house && alive >= 2 && S.street === 'preflop') {
        if (p1.bet !== Math.min(SB(), p1.hs)) P.blindBad.push('ハンド' + S.handNo + ' SB ' + p1.name + ' ' + p1.bet);
        if (p2.bet !== Math.min(BB(), p2.hs)) P.blindBad.push('ハンド' + S.handNo + ' BB ' + p2.name + ' ' + p2.bet);
      }
    } catch (e) { P.errs.push('startHand: ' + e.message) }
    return r;
  };
  const _act = act;
  act = function (i, type, to) {
    if (!S || S.handOver || i !== S.toAct) return _act.apply(this, arguments);
    let pre = null;
    try {
      const k = S.handNo + ':' + S.street;
      if (k !== key) {
        key = k; closed = {}; closedAt = {};
        // 最初に話す人：プリフロップはBBの左（2人ならボタン＝SB）、フロップ以降はボタンの左
        // 席を選び直して並びが変わったハンド（前の対戦の待ち時間が残ったまま次を始めたとき）は数えない
        if (P.checkBlinds && !CFG.house && !S.scriptAI && P.order0 === S.players.map(q => q.name).join(',') + '|' + S.dealer) {
          const live = p => !p.out, alive = S.players.filter(live).length;
          const sb = alive === 2 ? S.dealer : nextIdx(S.dealer, live), bb = nextIdx(sb, live);
          const exp = S.street === 'preflop' ? nextIdx(bb, canAct) : nextIdx(S.dealer, canAct);
          const can = S.players.filter(canAct).length;
          if (can >= 2 && exp !== i && !(S.street === 'preflop' && S.players.some(q => q.lastAct && /ストラドル/.test(q.lastAct)))) P.orderBad.push('ハンド' + S.handNo + ' ' + S.street + ' ' + nm(i) + '（はず: ' + nm(exp) + '）' + (window.__bpDebug ? ' D' + S.dealer + ' ' + S.players.map(q => q.name + ':' + q.bet + (q.out ? 'x' : '') + (q.allIn ? 'A' : '')).join(' ') : ''));
        }
      }
      const p = S.players[i];
      pre = { cb: S.currentBet, mr: S.minRaise, bet: p.bet, closed: !!closed[i], street: S.street, hand: S.handNo };
    } catch (e) { P.errs.push('act前: ' + e.message) }
    const r = _act.apply(this, arguments);
    try {
      if (pre) {
        P.acts++;
        const p = S.players[i];
        if (p.bet > pre.cb) {
          P.raises++;
          const inc = p.bet - pre.cb, need = pre.cb === 0 ? BB() : pre.mr;
          if (!p.allIn && inc < need) P.minRaiseBad.push('ハンド' + pre.hand + ' ' + p.name + ' ' + pre.cb + '→' + p.bet + '（最低 +' + need + '）');
          if (pre.closed) P.reopenBad.push('ハンド' + pre.hand + ' ' + p.name + ' ' + pre.cb + '→' + p.bet + '（足りないオールインのあとに再レイズ）');
          if (inc >= need) S.players.forEach((q, j) => { if (j !== i) closed[j] = false });
          // 足りないオールインが重なって、話し終えた人が最後に話したときからちゃんとしたレイズの幅に届いたら、その人には権利が戻る（R-10、19b_rules.js の reopen）
          else S.players.forEach((q, j) => { if (j !== i && closed[j] && closedAt[j] != null && p.bet - closedAt[j] >= pre.mr) closed[j] = false });
        }
        closed[i] = true; closedAt[i] = S.players[i].bet;
      }
    } catch (e) { P.errs.push('act後: ' + e.message) }
    return r;
  };
  const _sd = showdown;
  showdown = function () {
    const r = _sd.apply(this, arguments);
    try {
      if (S.board2 || S.board.length < 5) return r;
      P.sd++;
      const cont = S.players.filter(inHand), sc = new Map(cont.map(p => [p, __ev(p.hand.concat(S.board))]));
      // 1. 一番強い手の人は、何かしら受け取る
      const best = cont.reduce((a, b) => __cmp(sc.get(a), sc.get(b)) >= 0 ? a : b);
      if (!(best.won > 0)) P.sdBad.push('ハンド' + S.handNo + ' 一番強い ' + best.name + '（' + sc.get(best).join(',') + '）が0');
      // 賭けた額はゲームと同じく total からアンティ（BBアンティは死に金）を引いたもので比べる
      const bet = p => (p.total || 0) - (p.ante || 0);
      const levels = [...new Set(S.players.map(bet).filter(v => v > 0))];
      const info = () => ' [' + S.players.map(p => p.name + ':total' + p.total + '/ante' + (p.ante || 0) + '/won' + (p.won || 0) + (inHand(p) ? '' : '/降り')).join(' ') + ' board ' + JSON.stringify(S.board) + ']';
      // 2. 自分より強い手で、自分以上に賭けた人がいるなら、受け取れない
      cont.forEach(p => { if (p.won > 0 && cont.some(q => q !== p && __cmp(sc.get(q), sc.get(p)) > 0 && bet(q) >= bet(p))) P.sdBad.push('ハンド' + S.handNo + ' ' + p.name + ' が ' + p.won + ' 受け取ったが、もっと強く・同じ以上賭けた人がいる' + info()) });
      // 3. 同じ強さで同じだけ賭けた人どうしは、ほぼ同じ額（端数は段ごとに100、ボタンの左の人へ行くので 100×段の数まで）
      cont.forEach(p => cont.forEach(q => { if (p !== q && __cmp(sc.get(p), sc.get(q)) === 0 && bet(p) === bet(q) && Math.abs(p.won - q.won) > 100 * levels.filter(v => v <= bet(p)).length) P.sdBad.push('ハンド' + S.handNo + ' 引き分けの ' + p.name + ' ' + p.won + ' と ' + q.name + ' ' + q.won + info()) }));
    } catch (e) { P.errs.push('showdown: ' + e.message) }
    return r;
  };
})();`;

async function session(browser, file, start, policy, hands, opts = {}) {
  const { ctx, page } = await H.openGame(browser, file, { fast: 60, storage: opts.storage, seed: H.seedOf('basics', start, policy) });
  try {
    await page.evaluate(PROBE);
    if (opts.noBlindCheck) await page.evaluate(() => { __bp.checkBlinds = false });
    const t0 = Date.now();
    for (let g = 0; Date.now() - t0 < 200000; g++) {
      await page.evaluate(s => { try { show('title') } catch (e) {} (0, eval)(s) }, start);
      if (g === 0) await H.startBot(page, { policy, maxHands: hands }); else await page.evaluate(() => __bot.restart());
      const r = await H.runUntilDone(page, { timeoutMs: 200000 - (Date.now() - t0), stallMs: 20000 });
      if (r.status !== 'done' || await page.evaluate(() => __bot.result === 'limit' || __bot.hands >= __bot.maxHands)) break;
    }
    return await page.evaluate(() => ({ ...__bp, hands: __bot.hands, errors: __qa.errors }));
  } finally { await ctx.close() }
}

async function run({ browser, file, quick }) {
  const items = [];
  // 役の判定は qa/unit（unit:eval-fixed・unit:eval-random）へ移した。ここは打ちながら確かめる（ゲームが決まりを正しく呼んでいるか）
  // 2. 打ちながら確かめる
  const H1 = quick ? 30 : 100, F6 = `($('freeSize').value='6',$('freeRule').value='',startFree())`, F4 = `($('freeSize').value='4',$('freeRule').value='',startFree())`;
  const jobs = [[F6, 'random', H1], [F6, 'mix', H1], [F4, 'random', H1], ['startChapter(CHAPTERS[0],true)', 'random', H1, { noBlindCheck: true }]];
  if (!quick) jobs.push(['startChapter(CHAPTERS[5],true)', 'random', H1, { noBlindCheck: true }], ['startP2(PART2[3],true)', 'random', H1, { noBlindCheck: true, storage: H.UNLOCKED }]);
  const res = [];
  for (let i = 0; i < jobs.length; i += 4) res.push(...await Promise.all(jobs.slice(i, i + 4).map(j => session(browser, file, j[0], j[1], j[2], j[3] || {}))));
  const sum = k => res.reduce((a, r) => a + (Array.isArray(r[k]) ? r[k].length : +r[k] || 0), 0), ex = k => res.flatMap(r => r[k]).slice(0, 3).join(' / ');
  const hands = sum('hands'), acts = sum('acts'), raises = sum('raises'), sd = sum('sd');
  const row = (id, title, k, ok) => items.push({ id, title, status: sum(k) ? 'fail' : 'ok', detail: sum(k) ? `${sum(k)}回。例: ${ex(k)}` : ok });
  row('basic:minraise', 'レイズは前のレイズ幅以上（オールインを除く）、最初のベットはBB以上', 'minRaiseBad', `${hands}ハンド、レイズ・ベット ${raises}回、違反0`);
  row('basic:reopen', '足りないオールインは、もう話した人にレイズの権利を戻さない', 'reopenBad', `${acts}回の判断、違反0`);
  row('basic:blinds', 'SBとBBが正しい席から正しい額で出る（2人のときはボタンがSB）', 'blindBad', `フリー対戦 ${hands}ハンドで違反0`);
  row('basic:order', '最初に話す人が正しい（プリフロップはBBの左、フロップからはボタンの左）', 'orderBad', '違反0');
  row('basic:pots', 'ショーダウンの配り方が正しい（一番強い手が受け取る、強い手より多く取らない、引き分けは等分）', 'sdBad', `ショーダウン ${sd}回、違反0`);
  const errs = [...new Set(res.flatMap(r => [...(r.errs || []), ...(r.errors || [])]))];
  if (errs.length) items.push({ id: 'basic:probe-errors', title: 'ルールの基本を確かめている間のエラー', status: 'fail', detail: errs.slice(0, 3).join(' / ') });
  return { name: 'ルールの基本（ノーリミットホールデム）', items };
}
module.exports = { run, EVAL };
