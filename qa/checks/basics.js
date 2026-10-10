// ルールの基本：ノーリミットホールデムの決まりどおりに動いているか（レビューの仕組み 案1、2026-10-10）
//   出どころ: research/ノーリミットホールデムのルール.md
//   役の判定は、ゲームとは別に書いた判定（下の EVAL）と突き合わせる
'use strict';
const H = require('../lib/harness');

// ゲームとは別の役判定。7枚までを受けて [役の段階, 比べる数…] を返す（大きいほど強い）
const EVAL = `function __ev(cs){
  const best=[];let top=null;const n=cs.length;
  const five=ix=>{const c=ix.map(i=>cs[i]);const rs=c.map(x=>x.r).sort((a,b)=>b-a);
    const fl=c.every(x=>x.s===c[0].s);const u=[...new Set(rs)];
    let st=0;if(u.length===5){if(u[0]-u[4]===4)st=u[0];else if(u[0]===14&&u[1]===5&&u[4]===2)st=5}
    const m={};rs.forEach(r=>m[r]=(m[r]||0)+1);const g=Object.keys(m).map(Number).sort((a,b)=>m[b]-m[a]||b-a);const k=g.map(r=>m[r]);
    if(st&&fl)return[8,st];if(k[0]===4)return[7,g[0],g[1]];if(k[0]===3&&k[1]===2)return[6,g[0],g[1]];
    if(fl)return[5,...rs];if(st)return[4,st];if(k[0]===3)return[3,...g];if(k[0]===2&&k[1]===2)return[2,...g];if(k[0]===2)return[1,...g];return[0,...rs]};
  const c=(a,b)=>{for(let i=0;i<Math.max(a.length,b.length);i++){const d=(a[i]||0)-(b[i]||0);if(d)return d}return 0};
  for(let a=0;a<n;a++)for(let b=a+1;b<n;b++)for(let d=b+1;d<n;d++)for(let e=d+1;e<n;e++)for(let f=e+1;f<n;f++){const s=five([a,b,d,e,f]);if(!top||c(s,top)>0)top=s}
  return top}
function __cmp(a,b){for(let i=0;i<Math.max(a.length,b.length);i++){const d=(a[i]||0)-(b[i]||0);if(d)return d}return 0}`;

// 決まった手で確かめる（名前、7枚、強い順に並べた時の期待）
const FIXED = [
  ['ホイール（A-2-3-4-5）は6ハイのストレートより弱い', 'As 2d 3c 4h 5s Kd Qc', '2s 3d 4c 5h 6s Kd Qc', '<'],
  ['ロイヤルはストレートフラッシュより強い', 'As Ks Qs Js Ts 2d 3c', 'Ks Qs Js Ts 9s 2d 3c', '>'],
  ['フルハウスは3枚の方の数で比べる', '3s 3d 3c 2h 2s 9d 8c', '2s 2d 2c Ah As 9d 8c', '>'],
  ['ツーペアは3枚目（キッカー）で比べる', 'Ks Kd 7c 7h As 3d 2c', 'Ks Kd 7c 7h Qs 3d 2c', '>'],
  ['ボードが役なら引き分け（両方の手札が効かない）', '2s 3d Ac Ad Ah Ks Kd', '4s 5d Ac Ad Ah Ks Kd', '='],
  ['フラッシュは5枚全部を上から比べる', 'As 9s 7s 5s 3s Kd Qc', 'As 9s 7s 5s 2s Kd Qc', '>'],
  ['6枚の同じスートでも上の5枚で比べる', 'As Ks 9s 7s 5s 3s 2d', 'As Ks 9s 7s 4s 3s 2d', '>'],
  ['A-K-Q-J-T はストレート、K-A-2-3-4 はストレートではない', 'Ah Kd Qc Js Td 2c 3d', 'Kh Ad 2c 3s 4d 9c 8d', '>'],
];
const parse = s => s.split(' ').map(t => ({ r: '23456789TJQKA'.indexOf(t[0]) + 2, s: 'sdch'.indexOf(t[1]) }));

// ゲームの関数を包んで、打つたびに決まりを確かめる
const PROBE = `(() => {
  if (window.__bp) return; ${EVAL}
  const P = window.__bp = { acts: 0, raises: 0, minRaiseBad: [], reopenBad: [], blindBad: [], orderBad: [], sd: 0, sdBad: [], errs: [], checkBlinds: true };
  const nm = i => S.players[i] ? S.players[i].name : '?';
  let key = '', closed = {}, first = true;
  const _sh = startHand;
  startHand = function () {
    const r = _sh.apply(this, arguments);
    try {
      key = ''; closed = {}; first = true; P.order0 = S.players.map(q => q.name).join(',') + '|' + S.dealer;
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
        key = k; closed = {};
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
        }
        closed[i] = true;
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
      // 2. 自分より強い手で、自分以上に出した人がいるなら、受け取れない
      cont.forEach(p => { if (p.won > 0 && cont.some(q => q !== p && __cmp(sc.get(q), sc.get(p)) > 0 && q.total >= p.total)) P.sdBad.push('ハンド' + S.handNo + ' ' + p.name + ' が ' + p.won + ' 受け取ったが、もっと強く・同じ以上出した人がいる') });
      // 3. 同じ強さで同じだけ出した人どうしは、ほぼ同じ額（端数100まで）
      cont.forEach(p => cont.forEach(q => { if (p !== q && __cmp(sc.get(p), sc.get(q)) === 0 && p.total === q.total && Math.abs(p.won - q.won) > 100) P.sdBad.push('ハンド' + S.handNo + ' 引き分けの ' + p.name + ' ' + p.won + ' と ' + q.name + ' ' + q.won) }));
    } catch (e) { P.errs.push('showdown: ' + e.message) }
    return r;
  };
})();`;

async function session(browser, file, start, policy, hands, opts = {}) {
  const { ctx, page } = await H.openGame(browser, file, { fast: 60, storage: opts.storage });
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
  // 1. 役の判定：決まった手と、でたらめな7枚を、別に書いた判定と比べる
  const { ctx, page } = await H.openGame(browser, file);
  let ev;
  try {
    ev = await page.evaluate(([EV, fixed, n]) => {
      (0, eval)(EV);
      const deck = () => { const d = []; for (let s = 0; s < 4; s++) for (let r = 2; r <= 14; r++) d.push({ r, s }); return d };
      const sgn = x => x > 0 ? '>' : x < 0 ? '<' : '=';
      const fixedBad = fixed.filter(([t, a, b, want]) => sgn(cmp(bestN(a), bestN(b))) !== want || sgn(__cmp(__ev(a), __ev(b))) !== want).map(x => x[0]);
      let catBad = 0, ordBad = 0, ex = [], prev = null;
      for (let i = 0; i < n; i++) {
        const d = deck(); for (let j = d.length - 1; j > 0; j--) { const k = Math.floor(Math.random() * (j + 1));[d[j], d[k]] = [d[k], d[j]] }
        const h = d.slice(0, 7), g = bestN(h), m = __ev(h);
        if (g[0] !== m[0]) { catBad++; if (ex.length < 3) ex.push(h.map(c => c.r + 'shdc'[c.s]).join(' ') + ' ゲーム' + g[0] + '/別' + m[0]) }
        if (prev && sgn(cmp(g, prev.g)) !== sgn(__cmp(m, prev.m))) { ordBad++; if (ex.length < 3) ex.push('並び順が違う') }
        prev = { g, m };
      }
      return { fixedBad, catBad, ordBad, ex, n };
    }, [EVAL, FIXED.map(([t, a, b, w]) => [t, parse(a), parse(b), w]), quick ? 20000 : 100000]);
  } finally { await ctx.close() }
  const evBad = ev.fixedBad.length + ev.catBad + ev.ordBad;
  items.push({ id: 'basic:eval', title: '役の判定が正しい（決まった8つの手＋でたらめな7枚を別の判定と比べる）', status: evBad ? 'fail' : 'ok',
    detail: evBad ? [ev.fixedBad.length ? '外れた手: ' + ev.fixedBad.join('、') : '', ev.catBad ? `役の段階が違う ${ev.catBad}回` : '', ev.ordBad ? `強さの順が違う ${ev.ordBad}回` : '', ev.ex.join(' / ')].filter(Boolean).join('。') : `決まった手 ${FIXED.length}個、でたらめな7枚 ${ev.n}回、全部一致` });

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
