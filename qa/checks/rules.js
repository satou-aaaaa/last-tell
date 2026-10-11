// 再発チェック：プロポーカー目線・ゲームクリエイター目線で見つかった問題が、また起きていないか
// 中身は research/プロポーカープレイヤー目線_実装仕様.md と research/プロ目線の改善_実装仕様.md の「確認」から
'use strict';
const H = require('../lib/harness');

// ゲームの関数を包んで、CPUの判断とショーダウンを記録する
const PROBE = `(() => {
  if (window.__probe) return; const P = window.__probe = { limp: {}, open: {}, rivBig: {}, faceOpen: {}, sdRefundBB: 0, sdHands: 0, twice: 0, twiceAsk: 0, bomb: 0, errs: [] };
  const inc = (o, k, f) => { o[k] = o[k] || { n: 0, hit: 0 }; o[k].n++; if (f) o[k].hit++ };
  const _cd = cpuDecide;
  cpuDecide = function (i) {
    const d = _cd.apply(this, arguments);
    try {
      if (i === 0) return d;
      const p = S.players[i], toCall = S.currentBet - p.bet, potBefore = S.players.reduce((a, q) => a + q.total, 0) - toCall;
      if (S.street === 'preflop') {
        const others = S.players.filter((q, j) => j !== i && q.bet > BB()).length; // BBより多く出した人がいない＝まだ誰も上げていない
        if (S.raises === 0 && others === 0 && toCall > 0) inc(P.limp, p.name, d.type === 'call');
        if (S.raises === 1 && S.players[0].raisedPre && S.currentBet <= BB() * 3 && toCall > 0) inc(P.faceOpen, p.name, d.type === 'fold');
      }
      if (S.street === 'river' && toCall > 0 && toCall >= potBefore * 1.5) inc(P.rivBig, p.name, d.type !== 'fold');
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
  const { ctx, page } = await H.openGame(browser, file, { fast: 60, storage });
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

async function run({ browser, file, quick }) {
  const H1 = quick ? 25 : 80, items = [];
  const st7 = H.UNLOCKED;
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
    ['startChapter(CHAPTERS[5],true)', 'overbet', H1],
    ['startChapter(CHAPTERS[6],true)', 'overbet', H1],
    [`($('freeSize').value='6',startFree())`, 'overbet', H1],
    ['startChapter(CHAPTERS[5],true)', 'open3', H1],
    ['startChapter(CHAPTERS[6],true)', 'open3', H1],
    [`($('freeSize').value='6',startFree())`, 'open3', H1],
  ];
  // 4つずつ回す（一度に全部だと遅くなりすぎる）
  const res = [];
  for (let i = 0; i < jobs.length; i += 4) res.push(...await Promise.all(jobs.slice(i, i + 4).map(j => session(browser, file, j[0], j[1], j[2], j[3]))));
  const [s1, s1b, tour6, tour14, ura6, lim4, lim6, lim7, free6, ob6, ob7, obF, op6, op7, opF] = res;
  // S1 BBアンティ
  const a = merge(s1, s1b);
  items.push({ id: 'rule:S1-ante', title: 'BBアンティがショーダウンでBBに返らない（プロポーカー S1）', status: a.sdRefundBB ? 'fail' : 'ok',
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
  items.push({ id: 'rule:A1-limp', title: '強いキャラが最初にコールだけで入らない（プロポーカー A1）', status: !limpStrong.length ? 'warn' : badLimp.length ? 'fail' : 'ok',
    detail: limpStrong.length ? limpStrong.map(x => `${x[0]} ${x[1]}%（${x[2]}回）`).join('、') + '（10%以下で合格）' : '測れる回数が足りない' });
  // A1 後半：3BBのオープンに降りすぎない
  const O = [op6, op7, opF].reduce(merge);
  const foldStrong = STRONG.filter(n => O.faceOpen[n] && O.faceOpen[n].n >= 8).map(n => [n, pct(O.faceOpen[n]), O.faceOpen[n].n]);
  const badFold = foldStrong.filter(x => x[1] > 80);
  items.push({ id: 'rule:A1-faceopen', title: '強いキャラが3BBのオープンに降りすぎない（プロポーカー A1）', status: !foldStrong.length ? 'warn' : badFold.length ? 'fail' : 'ok',
    detail: foldStrong.length ? foldStrong.map(x => `${x[0]} 降りる ${x[1]}%（${x[2]}回）`).join('、') + '（80%以下で合格）' : '測れる回数が足りない' });
  // S2 リバーの大きなベット
  const R = [ob6, ob7, obF].reduce(merge);
  const callStrong = STRONG.filter(n => R.rivBig[n] && R.rivBig[n].n >= 6).map(n => [n, pct(R.rivBig[n]), R.rivBig[n].n]);
  const badCall = callStrong.filter(x => x[1] > 40);
  items.push({ id: 'rule:S2-overbet', title: '強いキャラがリバーのポット2倍ベットにコールしすぎない（プロポーカー S2）', status: !callStrong.length ? 'warn' : badCall.length ? 'fail' : 'ok',
    detail: callStrong.length ? callStrong.map(x => `${x[0]} コール ${x[1]}%（${x[2]}回）`).join('、') + '（40%以下で合格）' : '測れる回数が足りない' });
  const errs = [s1, s1b, tour6, tour14, ura6, lim4, lim6, lim7, free6, ob6, ob7, obF, op6, op7, opF].flatMap(x => (x.errs || []).concat(x.errors || []));
  if (errs.length) items.push({ id: 'rule:probe-errors', title: '再発チェック中のエラー', status: 'fail', detail: [...new Set(errs)].slice(0, 3).join(' / ') });
  return { name: 'プロポーカー目線の再発チェック', items };
}
module.exports = { run };
