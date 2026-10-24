// LAST TELL 検査の共通部品：ゲームを開く、時間を早回しにする、自動で打つ
'use strict';
const path = require('path');
const fs = require('fs');
let pw;
try { pw = require('playwright'); } catch (e) { pw = require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright')); }

const FAST = 25; // 待ち時間を 1/25 にする

// ページが読み込まれる前に入れる：時間の早回し、エラーの記録、設定
function initScript({ fast = FAST, lang = 'ja', settings = {}, seed = null } = {}) {
  return `(() => {
    // seed を決めたときは、配られる札などを毎回同じにする（画面チェック用）。Math.random を呼んだ場所（関数と呼び元の行）ごとに別の乱数の列にする：
    //   スタックの1行目が「Error」なのは Chromium だけ（WebKit は呼ばれた関数の行から始まる）なので、それを飛ばしてから「呼び元とその呼び元」の2行を使う（CodeRabbit PR #142）
    //   1本の列だと、タイマーで動く演出が実行機の速さしだいで先に乱数を取り、同じ種でも座る人・CPU の打ち方が変わった（改善提案 2026-10-22 §0-1）
    if (${seed === null ? 'false' : 'true'}) { const S0 = ${Number(seed) >>> 0 || 1}, st = new Map(); const h = s => { let x = S0 ^ 0x9E3779B9; for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 0x01000193); return x >>> 0 };
      Math.random = () => { const L = (new Error().stack || '').split(String.fromCharCode(10)), k = L.slice(/^Error/.test(L[0]) ? 2 : 1).slice(0, 2).map(l => l.replace(/^.*[/]/, '')).join('<'); let a = st.has(k) ? st.get(k) : h(k); a = a + 0x6D2B79F5 | 0; st.set(k, a); let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
    window.__qa = { errors: [], logs: [] };
    window.addEventListener('error', e => window.__qa.errors.push(String(e.message) + ' @' + (e.lineno||'')));
    window.addEventListener('unhandledrejection', e => window.__qa.errors.push('promise: ' + String(e.reason && e.reason.message || e.reason)));
    const F = ${fast};
    window.__qaST = window.setTimeout;   // 短くしない元のタイマー（タイマーの遅れを測る lag が使う。CodeRabbit PR #154）
    if (F > 1) {
      const st = window.setTimeout, si = window.setInterval;
      window.setTimeout = (f, d, ...a) => st(f, Math.max(0, (+d || 0) / F), ...a);
      window.setInterval = (f, d, ...a) => si(f, Math.max(4, (+d || 0) / F), ...a);
    }
    try {
      const s = Object.assign({ v: 1, talk: 'on', speed: 'fast', sound: false, quiz: false, lang: '${lang}' }, ${JSON.stringify(settings)});
      localStorage.setItem('shisho-settings', JSON.stringify(s));
    } catch (e) {}
  })();`;
}

async function launch() {
  // QA_BROWSER=webkit で iPhone の Safari と同じ WebKit で回す（2026-10-14 CIのチェック充実 案3）
  if (process.env.QA_BROWSER === 'webkit') return pw.webkit.launch();
  // CHROMIUM_PATH: 入っている Chromium を使う（Claude Code のクラウドなど。scripts/setup.sh が設定する）
  return pw.chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
}

// ゲームを開く。fonts.googleapis は止める（読み込みが止まるため）
// lite:true のときは動き（アニメーション）を止めて速く回す。画面チェックでは lite:false
async function openGame(browser, file, { viewport = { width: 1280, height: 800 }, fast = FAST, lang = 'ja', settings = {}, storage = null, isMobile = false, hasTouch = false, lite = true, seed = null, deal = null, dpr = 1 } = {}) {
  // dpr：画面の細かさ（高精細のスマホは3）。ふだんは1。画質の検査（checks/sharp.js）だけが変える
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: dpr, isMobile, hasTouch, serviceWorkers: 'block', reducedMotion: lite ? 'reduce' : 'no-preference' });
  if (lite) await ctx.addInitScript(`document.addEventListener('DOMContentLoaded',()=>{const st=document.createElement('style');st.textContent='*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important}';document.head.appendChild(st)})`);
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort()); // 外への通信はしない
  await ctx.addInitScript(initScript({ fast, lang, settings, seed }));
  if (storage) await ctx.addInitScript(`(()=>{try{const s=${JSON.stringify(storage)};for(const k in s)localStorage.setItem(k,s[k])}catch(e){}})()`);
  const page = await ctx.newPage();
  page.on('pageerror', e => page.__errs = (page.__errs || []).concat(String(e.message)));
  // deal：配る札だけの種（ゲームの ?seed=、19a_seed.js）。CPU の乱数（seed）と分けるので、打ち方が違っても n ハンド目の札は同じ
  await page.goto('file://' + path.resolve(file) + (deal != null ? '?seed=' + (Number(deal) >>> 0) : ''), { waitUntil: 'load' });
  await page.waitForTimeout(300);
  return { ctx, page };
}

// ページの中で動く自動プレイヤー。
// policy: 'random'（なんでも押す）, 'cpu'（ゲームのCPUと同じ考え方で打つ）, 'fold'（いつも降りる）
const BOT = `(() => {
  if (window.__bot) return;
  // 長い処理（50ms 以上）の回数と合計（止まったときに、ページが重くて回っていなかったかを見る。Chromium だけ）
  window.__qaLong = { n: 0, ms: 0, max: 0, ok: !!(window.PerformanceObserver && (PerformanceObserver.supportedEntryTypes || []).includes('longtask')) }; try { new PerformanceObserver(l => l.getEntries().forEach(e => { __qaLong.n++; __qaLong.ms += e.duration; __qaLong.max = Math.max(__qaLong.max, e.duration) })).observe({ entryTypes: ['longtask'] }) } catch (e) {}
  // タイマーの遅れ（WebKit は longtask を測れないので、こちらでページの詰まりを見る。2026-10-24 WebKit 第5章：50ms のタイマーが 773ms かかっていたのに「長い処理 0回」と出た）
  window.__qaLag = { n: 0, ms: 0, max: 0, last: [] }; (function lag() { const t = performance.now(); (window.__qaST || setTimeout)(() => { const d = Math.max(0, performance.now() - t - 200); const L = __qaLag; L.n++; L.ms += d; L.max = Math.max(L.max, d); L.last.push(Math.round(d)); if (L.last.length > 20) L.last.shift(); lag() }, 200) })();
  const $ = id => document.getElementById(id);
  // offsetParent は position:fixed の部品（スマホ横の操作パネルなど）で null になるので、getClientRects で見る
  const vis = el => !!el && !el.hidden && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  // 押してよいボタン（上から順に）。「やめる」「設定」などは押さない
  const CLICK = ['vsGo','twN','btnShowNo','btnIgnore','qtNo','rvOk','tourSkip','btnNoticeClose','btnAdv','btnNext','btnHelpClose','btnDailyClose','btnShareClose','btnZoomClose','btnSetClose','askGo','lkOk','nvNew']; // nvNew：v63「ポーカーを遊んだことは？」→ はじめて
  const B = window.__bot = { policy: 'random', hands: 0, decisions: 0, clicks: {}, chipErr: [], negErr: [], lastSum: null, lastNames: '', done: false, result: null, stuckAt: Date.now(), progAt: Date.now(), lastHand: -1, maxHands: 60, events: [], twiceSeen: [] };
  function sum() { return S.players.reduce((a, p) => a + p.chips, 0) }
  // ブラフの札でコールしたとき、こちらに役があったか（1ペア以上か A を持っている）（v88 レビュー：ブラフ読みのコールが損なのは役なしでもコールするからか、を分けて測る）
  B.madeOrA = (h, bd) => { try { return h.some(x => x.r === 14) || (bd.length >= 3 ? bestN(h.concat(bd))[0] >= 1 : h[0].r === h[1].r) } catch (e) { return false } };
  function decide() {
    const me = S.players[0], toCall = S.currentBet - me.bet;
    // 'tell'：クセの札を読んで打つ（改善提案 2026-10-15 §2）。見てよいのは画面に出た札（名札の cue-◯◯）と TELLS の意味だけ。相手の手札・p.tell の当たり外れは見ない
    if (B.policy === 'tell' && toCall > 0 && S.aggr > 0 && !S.scriptAI && !S.duelHand && !S.finalHand && !S.storyHand && !CFG.flashback) {
      const i = S.aggr, p = S.players[i], T = p && typeof TELLS !== 'undefined' && TELLS[p.name], bust = $('bust' + i);
      const keep = typeof TW_KEEP !== 'undefined' ? TW_KEEP : ['ジン', '師匠', 'クロウ'];
      if (T && !keep.includes(p.name) && bust && $('cue' + i)) {
        const c = ([...bust.classList].find(k => k.startsWith('cue-') && k !== 'cue-undefined') || '').slice(4);
        let m = c === T.strong.cue ? 'strong' : c === T.bluff.cue ? 'bluff' : '';
        // レイカの「逆のクセ」は、ゲームが知らせた（師匠の「今のは、わざとだ」＝ S.revSaid）あとだけ入れ替えて読む
        if (m && T.reverse && S.revSaid) m = m === 'strong' ? 'bluff' : 'strong';
        if (m) { B.reads = (B.reads || 0) + 1;
          let d;
          if (m === 'bluff') d = { type: 'call' };
          else { const h = me.hand, bd = S.board, top = bd.length ? Math.max(...bd.map(x => x.r)) : 0, cat = bd.length >= 3 ? bestN(h.concat(bd))[0] : -1;
            const tp = cat >= 2 || (cat === 1 && (h.some(x => x.r === top) || (h[0].r === h[1].r && h[0].r > top)));
            if (!tp) d = { type: 'fold' } }
          // 測るだけ（判断には使わない）：札の当たり外れと、読まない打ち手（cpuDecide）と判断が変わったか
          try { if (p.tell && p.tell.truth === m) B.hits = (B.hits || 0) + 1; const d0 = cpuDecide(0), dd = d || d0, diff = !!(d0 && dd && d0.type !== dd.type);
            const left0 = S.players.filter(q => q !== me && q !== p && !q.folded && !q.out && q.hand && q.hand.length).length;
            if (!B.rp || B.rp.hand !== S.handNo) B.rp = { hand: S.handNo, start: me.chips + me.total, diff, m, left: left0 }; else B.rp.diff = B.rp.diff || diff;
            // 読みの得（v83 レビュー）：判断が変わったとき、相手の本当の札から勝つ見込み eq を出し、EV(コール)=eq×(ポット+払う額)−払う額、降りる=0 として「選んだ手 − 読まない手」を BB で足す（測るだけ）
            if (diff) { const pay = Math.min(toCall, me.chips), pot = S.players.reduce((a, q) => a + q.total, 0), eq = B.eqVs(me.hand, S.board, S.players.filter(q => q !== me && !q.folded && q.hand).map(q => q.hand), 300);
              const ev = t => t === 'fold' ? 0 : eq * (pot + pay) - pay; const g = (ev(dd.type) - ev(d0.type)) / Math.max(1, BB()); B.evGain = (B.evGain || 0) + g; B.evN = (B.evN || 0) + 1;
              // 内訳（改善提案 2026-10-17 §0-1）：賭けた本人のほかに残っている相手の数（0＝1対1）× 札の意味。払う額／ポットも記録
              const left = S.players.filter(q => q !== me && q !== p && !q.folded && !q.out && q.hand && q.hand.length).length, k = (left ? 'multi' : 'hu') + '_' + m + (m === 'bluff' ? (B.madeOrA(me.hand, S.board) ? '_made' : '_air') : '');
              const e = (B.evBy = B.evBy || {})[k] = B.evBy[k] || { n: 0, bb: 0, pp: 0 }; e.n++; e.bb += g; e.pp += pay / Math.max(1, pot) }
            if (d) return d; if (d0 && d0.type) return d0 } catch (e) { if (d) return d } }
      }
    }
    if ((B.policy === 'cpu' || B.policy === 'tell' || (B.policy === 'mix' && Math.random() < .6)) && typeof cpuDecide === 'function') { try { const d = cpuDecide(0); if (d && d.type) return d } catch (e) { B.events.push('cpuDecide(0) error: ' + e.message) } }
    if (B.policy === 'fold') return toCall > 0 ? { type: 'fold' } : { type: 'call' };
    if (B.policy === 'call') return { type: 'call' };
    if (B.policy === 'overbet') {
      // リバーまではチェック・コール。リバーで先に打てるときはポットの2倍を賭ける
      if (S.street === 'river' && toCall <= 0) { const pot = S.players.reduce((a, p) => a + p.total, 0); return { type: 'raise', to: me.bet + Math.min(me.chips, Math.max(BB(), Math.round(pot * 2 / 1000) * 1000)) } }
      return { type: 'call' };
    }
    if (B.policy === 'open3') {
      // プリフロップで誰も入っていなければ3BBで入る。あとはチェック・コール
      if (S.street === 'preflop' && S.raises === 0) return { type: 'raise', to: Math.min(me.bet + me.chips, BB() * 3) };
      return { type: 'call' };
    }
    const r = Math.random();
    if (r < .18 && toCall > 0) return { type: 'fold' };
    if (r < .70) return { type: 'call' };
    const mr = Math.max(S.minRaise || 0, BB());
    const k = [1, 1, 2, 3, 6, 999][Math.floor(Math.random() * 6)];
    return { type: 'raise', to: Math.min(me.bet + me.chips, S.currentBet + mr * k) };
  }
  // 自分の手と、相手たちの本当の手札で、残りの場札を何度も配って勝つ見込みを出す（引き分けは分け合う）
  B.eqVs = function (hand, board, opps, sims) {
    const known = hand.concat(board, ...opps), rest = fullDeck().filter(c => !known.some(k => k.r === c.r && k.s === c.s)), need = 5 - board.length; let sc = 0;
    for (let t = 0; t < sims; t++) {
      for (let i = 0; i < need; i++) { const j = i + Math.floor(Math.random() * (rest.length - i)); [rest[i], rest[j]] = [rest[j], rest[i]] }
      const b = board.concat(rest.slice(0, need)), mine = bestN(hand.concat(b)); let lose = false, ties = 0;
      for (const o of opps) { const d = cmp(bestN(o.concat(b)), mine); if (d > 0) { lose = true; break } if (d === 0) ties++ }
      if (!lose) sc += 1 / (ties + 1);
    }
    return sc / sims;
  };
  function clickables() {
    for (const id of CLICK) { const b = $(id); if (vis(b) && !b.disabled) return b }
    // 場面・はしご・席選びなどのボタン
    for (const sel of ['#vs button', '#runBox button', '#between button:not(#btnQuit)', '#quiz button', '#scene button']) {
      const b = [...document.querySelectorAll(sel)].find(x => vis(x) && !x.disabled && !/^(runHome|btnSkip|btnPen|btnShot|btnSave|btnAlt|runShot)$/.test(x.id));
      if (b) return b;
    }
    return null;
  }
  B.tick = function () {
    B.tickN = (B.tickN || 0) + 1; B.tickAt = Date.now();   // 止まったときに、ボットのタイマーが回っていたかを見る
    // ゲームが進んでいる印（ハンド・通り・番・進める処理の回数・ボットの押した数・判断の数・場面の行）。変わったら progAt を今にする。
    // 「止まった」はハンドが終わらない時間だけでなく、この印も変わらないときにする（2026-10-24 WebKit 第5章：実行機が遅く1ハンド目が20秒を超えたが、0.5秒前にも進んでいた）
    try { const pk = (typeof S !== 'undefined' && S && S.players ? [S.handNo, S.street, S.toAct, S.procN || 0, S.handOver ? 1 : 0].join('|') : '-') + '|' + (B.totalClicks || 0) + '|' + B.decisions + '|' + (typeof SC !== 'undefined' && SC ? SC.i : '');
      if (pk !== B.progKey) { B.progKey = pk; B.progAt = Date.now() } } catch (e) {}
    if (B.done) return;
    try {
      const press = b => { const k = b.id || b.textContent.trim().slice(0, 8); B.clicks[k] = 1 + (B.clicks[k] || 0); B.totalClicks = (B.totalClicks || 0) + 1; b.click() };
      if (typeof S === 'undefined' || !S || !S.players) { const b = clickables(); if (b) press(b); return }
      // チップの合計：ハンドが終わったときに、前のハンドの終わりと比べる
      if (S.handOver && S.handNo >= 1 && S.handNo !== B.lastHand) {
        B.lastHand = S.handNo; B.hands++; B.stuckAt = Date.now();
        const names = S.players.map(p => p.name).join(',');
        const s = sum();
        S.players.forEach(p => { if (p.chips < 0 || !Number.isFinite(p.chips) || p.chips !== Math.round(p.chips)) B.negErr.push({ hand: S.handNo, name: p.name, chips: p.chips }) });
        // 台本で全員のチップを配り直したとき（第13章の最初のハンドなど）は数えない
        const reset = S.players.every(p => p.chips === p.start) || S.chipsReset === S.handNo; // 決まった札のラッシュのあとなど、ゲームが予定どおりチップを戻したハンド（v65 から S.chipsReset）
        if (B.lastSum !== null && names === B.lastNames && s !== B.expect && !reset) B.chipErr.push({ hand: S.handNo, before: B.expect, after: s, diff: s - B.expect, log: [...document.querySelectorAll('#log > *')].slice(-12).map(x => x.textContent) });
        // ハンドごとの自分の増減（BB）。読む・読まないを同じ配り札で対にして比べる（改善提案 2026-10-16 §0-2）
        { const me = S.players[0]; if (me && !reset) (B.hb = B.hb || {})[S.handNo] = (me.chips - (B.prevMe != null ? B.prevMe : me.start)) / Math.max(1, BB()); B.prevMe = me ? me.chips : null }
        if (B.rp && B.rp.hand === S.handNo) { const me = S.players[0]; (B.readRes = B.readRes || []).push({ bb: (me.chips - B.rp.start) / Math.max(1, BB()), diff: B.rp.diff, m: B.rp.m, left: B.rp.left }); B.rp = null }
        B.lastSum = s; B.lastNames = names;
        // 次のハンドで補充される分
        B.expect = s + (CFG.refill ? S.players.filter(p => !p.human && !p.extra && p.chips <= 0).reduce((a, p) => a + p.start, 0) : 0);
        // 検査だけの近道（改善提案 2026-10-17 §0-2）：weaken のときは、ハンドの終わりごとに相手のチップを 1BB までに減らす（毎晩の通しで、勝てない章の「勝ったあと」を通すため。ゲームに裏口は作らない）
        if (B.weaken && !S.result) { S.players.forEach(p => { if (!p.human && p.chips > BB()) p.chips = BB() }); B.lastSum = sum(); B.expect = B.lastSum + (CFG.refill ? S.players.filter(p => !p.human && !p.extra && p.chips <= 0).reduce((a, p) => a + p.start, 0) : 0); B.weakened = (B.weakened || 0) + 1 }
        if (S.result) { B.result = S.result; B.done = true; return }
        if (B.hands >= B.maxHands) { B.result = 'limit'; B.done = true; B.games = B.games || 1; return }
      }
      if (S.twice && !B.twiceSeen.includes(S.handNo)) B.twiceSeen.push(S.handNo);
      if (!S.handOver && S.toAct === 0 && !S.autoMe && vis($('controls'))) {
        // 人が押せるボタンがあるか（2026-10-17 第5章の回想で止まった件：「レイズ」が隠れたままで、押せるボタンが1つも無かった。ボットは act を直接呼ぶので気づかなかった）
        const can = ['btnFold', 'btnCall', 'btnRaise'].some(id => { const b = $(id); return vis(b) && !b.disabled }) || [...document.querySelectorAll('#quick button')].some(b => vis(b) && !b.disabled);
        if (!can) { const k = S.handNo + '|' + S.street + '|' + S.currentBet + '|' + (CFG.flashback ? 'fb' : '');
          if (B.nbKey !== k) { B.nbKey = k; B.nbAt = Date.now() }
          if (Date.now() - B.nbAt < 1500) return;   // 描き直しの途中の一瞬は数えない
          if (B.nbSaid !== k) { B.nbSaid = k; B.events.push('自分の番なのに押せるボタンが無い（ハンド' + S.handNo + '・' + S.street + (CFG.flashback ? '・回想' : '') + '）') } }
        if (B.firstDecisionClicks === undefined) B.firstDecisionClicks = B.totalClicks || 0; const d = decide(); B.decisions++; act(0, d.type, d.to); return }
      const b = clickables(); if (b) press(b);
    } catch (e) { B.events.push('bot: ' + e.message) }
  };
  B.restart = function () { B.done = false; B.result = null; B.lastHand = -1; B.lastSum = null; B.lastNames = ''; B.stuckAt = B.progAt = Date.now(); B.games = (B.games || 1) + 1 };
  B.timer = setInterval(B.tick, 4);
})();`;

async function startBot(page, opts = {}) {
  await page.evaluate(BOT);
  await page.evaluate(o => Object.assign(window.__bot, o), opts);
}

const { stallKind, STATE_JS, HARD_MS } = require('./stall');

// 終わるまで待つ。手が進まないまま stallMs 過ぎたら「止まった」とする
async function runUntilDone(page, { timeoutMs = 120000, stallMs = 15000 } = {}) {
  const t0 = Date.now(), tks = []; let starved = 0;
  while (true) {
    await page.waitForTimeout(250);
    const st = await page.evaluate(STATE_JS);
    tks.push([Date.now(), st.tk]); while (tks.length > 2 && tks[1][0] < Date.now() - 20000) tks.shift();
    if (st.done) return { status: 'done' };
    // ボットのタイマー（4ms ごと）が 20秒で 200回も回っていないときは、ゲームが止まったのでなくページ全体が詰まっている（実行機が混んでいる）。
    // 自動対戦（checks/fuzz.js）と同じく 60秒まで待ち足す（PR #128 の CI：rules のフリー対戦が1ハンド目で「止まった」が、長い処理が合計19秒だった）
    if (stallKind(st, stallMs)) { if (st.tk - tks[0][1] < 200) { if (!starved) starved = Date.now(); if (Date.now() - starved < 60000) continue } return { status: 'stalled', starvedMs: starved ? Date.now() - starved : 0 } }   // 待ち足すのは実際の時間で60秒まで（CodeRabbit PR #128）
    if (Date.now() - t0 > timeoutMs) return { status: 'timeout' };
  }
}

async function botState(page) {
  return page.evaluate(() => {
    const B = __bot;
    // ボットと同じ見え方（offsetParent は position:fixed の操作パネルで null になり、PC 幅で「ボタンなし」と出ていた。2026-10-24）
    const vis = el => !!el && !el.hidden && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
    const screen = ['title', 'chapters', 'scene', 'game', 'notebook', 'more'].find(id => vis(document.getElementById(id)));
    const overlays = [...document.querySelectorAll('[role=dialog],.qin,.vsin')].filter(vis).map(e => e.id || e.className).slice(0, 5);
    return { result: B.result, games: B.games || 1, wins: B.wins || 0, hands: B.hands, decisions: B.decisions, chipErr: B.chipErr, negErr: B.negErr, events: B.events.slice(0, 10), clicks: B.clicks,
      errors: __qa.errors.slice(0, 10), twice: B.twiceSeen.length, screen, overlays,
      lastLog: [...document.querySelectorAll('#log > *')].slice(-6).map(x => x.textContent),
      // 止まった場所を調べるため（2026-10-17 WebKit の1ハンド目の止まり）
      gs: (typeof S !== 'undefined' && S && S.players) ? { hand: S.handNo, street: S.street, toAct: S.toAct, over: !!S.handOver, autoMe: !!S.autoMe, ctrl: vis(document.getElementById('controls')),
        sinceTick: Date.now() - (B.tickAt || 0), ticks: B.tickN || 0, acted: S.players.map(p => p.lastAct || '-').join(','), hidden: document.hidden,
        lt: !window.__qaLong ? '' : __qaLong.ok === false ? 'このブラウザでは測れない' : Math.round(__qaLong.ms / 1000) + "秒/" + __qaLong.n + "回（最長" + Math.round(__qaLong.max) + 'ms）',
        // 200ms のタイマーの遅れ（最近20回の平均と最大）と、ハンドが終わってから・ゲームが最後に進んでからの時間
        lag: window.__qaLag && __qaLag.last.length ? '平均' + Math.round(__qaLag.last.reduce((a, b) => a + b, 0) / __qaLag.last.length) + 'ms・最大' + Math.max(...__qaLag.last) + 'ms' : '',
        idle: Math.round((Date.now() - B.stuckAt) / 1000), prog: Math.round((Date.now() - (B.progAt || B.stuckAt)) / 100) / 10,
        // 相手の番の予約（proceed の最後・相手の動きのタイマー）と、待ちを延ばす値（v0.98.9 WebKit 第5章：相手の番のまま止まった）
        pr: S.procAt ? Math.round((Date.now() - S.procAt) / 100) / 10 + '秒前' + (S.procN ? '（' + S.procN + '回）' : '') : 'なし',
        cq: S.cpuQ ? '席' + S.cpuQ.i + '・ハンド' + S.cpuQ.h + '・待ち' + S.cpuQ.w + 'ms・' + Math.round((Date.now() - S.cpuQ.at) / 100) / 10 + '秒前' + (S.cpuQ.ran ? '・動いた' : '・まだ') : 'なし',
        fl: ['hold', 'stare', 'reveal', 'runout', 'angleActing', 'tease'].filter(k => S[k] != null && S[k] !== false && S[k] !== 0 && S[k] !== -1).map(k => k + '=' + String(S[k]).slice(0, 12)).join(' ') + (S.scriptAI ? ' scriptAI' : '') + (typeof CFG !== 'undefined' && CFG.flashback ? ' flashback' : ''),
        sc: (typeof SC !== 'undefined' && SC) ? (SC.i + '/' + (SC.lines ? SC.lines.length : '?')) : '', btns: [...document.querySelectorAll('#scene button, #vs button, #between button')].filter(vis).map(b => b.id || b.textContent.trim().slice(0, 6)).slice(0, 5).join('/') } : null };
  });
}

// 第1部クリア済み・操作案内を見た状態（第二部や章の一覧を開くため）
const UNLOCKED = { 'shisho-progress': JSON.stringify({ v: 1, cleared: 7 }), 'shisho-guide': JSON.stringify({ done: true }) };

// 打ち方を見る検査（rules・basics・fuzz）の乱数を、場面ごとに決まった数にする（2026-10-14 CIのチェック充実 案1）。
// 同じゲームのファイルなら、何度回しても同じ配り方・同じ CPU の迷いになる
const seedOf = (...xs) => { let h = 2166136261; for (const c of xs.join('|')) h = Math.imul(h ^ c.codePointAt(0), 16777619); return (h >>> 0) % 1e9 + 1 };

module.exports = { UNLOCKED, launch, openGame, startBot, runUntilDone, botState, pw, seedOf, stallKind, STATE_JS, HARD_MS };
