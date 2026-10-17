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
    // seed を決めたときは、配られる札などを毎回同じにする（画面チェック用）
    if (${seed === null ? 'false' : 'true'}) { let a = ${Number(seed) >>> 0 || 1}; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
    window.__qa = { errors: [], logs: [] };
    window.addEventListener('error', e => window.__qa.errors.push(String(e.message) + ' @' + (e.lineno||'')));
    window.addEventListener('unhandledrejection', e => window.__qa.errors.push('promise: ' + String(e.reason && e.reason.message || e.reason)));
    const F = ${fast};
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
  const exe = fs.existsSync('/opt/pw-browsers/chromium') ? undefined : undefined;
  // QA_BROWSER=webkit で iPhone の Safari と同じ WebKit で回す（2026-10-14 CIのチェック充実 案3）
  if (process.env.QA_BROWSER === 'webkit') return pw.webkit.launch();
  return pw.chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
}

// ゲームを開く。fonts.googleapis は止める（読み込みが止まるため）
// lite:true のときは動き（アニメーション）を止めて速く回す。画面チェックでは lite:false
async function openGame(browser, file, { viewport = { width: 1280, height: 800 }, fast = FAST, lang = 'ja', settings = {}, storage = null, isMobile = false, hasTouch = false, lite = true, seed = null, deal = null } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile, hasTouch, serviceWorkers: 'block', reducedMotion: lite ? 'reduce' : 'no-preference' });
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
  const $ = id => document.getElementById(id);
  // offsetParent は position:fixed の部品（スマホ横の操作パネルなど）で null になるので、getClientRects で見る
  const vis = el => !!el && !el.hidden && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  // 押してよいボタン（上から順に）。「やめる」「設定」などは押さない
  const CLICK = ['vsGo','twN','btnShowNo','btnIgnore','qtNo','rvOk','tourSkip','btnNoticeClose','btnAdv','btnNext','btnHelpClose','btnDailyClose','btnShareClose','btnZoomClose','btnSetClose','askGo','lkOk','nvNew']; // nvNew：v63「ポーカーを遊んだことは？」→ はじめて
  const B = window.__bot = { policy: 'random', hands: 0, decisions: 0, clicks: {}, chipErr: [], negErr: [], lastSum: null, lastNames: '', done: false, result: null, stuckAt: Date.now(), lastHand: -1, maxHands: 60, events: [], twiceSeen: [] };
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
  B.restart = function () { B.done = false; B.result = null; B.lastHand = -1; B.lastSum = null; B.lastNames = ''; B.stuckAt = Date.now(); B.games = (B.games || 1) + 1 };
  B.timer = setInterval(B.tick, 4);
})();`;

async function startBot(page, opts = {}) {
  await page.evaluate(BOT);
  await page.evaluate(o => Object.assign(window.__bot, o), opts);
}

// 終わるまで待つ。手が進まないまま stallMs 過ぎたら「止まった」とする
async function runUntilDone(page, { timeoutMs = 120000, stallMs = 15000 } = {}) {
  const t0 = Date.now();
  while (true) {
    await page.waitForTimeout(250);
    const st = await page.evaluate(() => ({ done: __bot.done, hands: __bot.hands, idle: Date.now() - __bot.stuckAt }));
    if (st.done) return { status: 'done' };
    if (st.idle > stallMs) return { status: 'stalled' };
    if (Date.now() - t0 > timeoutMs) return { status: 'timeout' };
  }
}

async function botState(page) {
  return page.evaluate(() => {
    const B = __bot;
    const vis = el => !!el && !el.hidden && el.offsetParent !== null;
    const screen = ['title', 'chapters', 'scene', 'game', 'notebook', 'more'].find(id => vis(document.getElementById(id)));
    const overlays = [...document.querySelectorAll('[role=dialog],.qin,.vsin')].filter(vis).map(e => e.id || e.className).slice(0, 5);
    return { result: B.result, games: B.games || 1, wins: B.wins || 0, hands: B.hands, decisions: B.decisions, chipErr: B.chipErr, negErr: B.negErr, events: B.events.slice(0, 10), clicks: B.clicks,
      errors: __qa.errors.slice(0, 10), twice: B.twiceSeen.length, screen, overlays,
      lastLog: [...document.querySelectorAll('#log > *')].slice(-6).map(x => x.textContent) };
  });
}

// 第1部クリア済み・操作案内を見た状態（第二部や章の一覧を開くため）
const UNLOCKED = { 'shisho-progress': JSON.stringify({ v: 1, cleared: 7 }), 'shisho-guide': JSON.stringify({ done: true }) };

// 打ち方を見る検査（rules・basics・fuzz）の乱数を、場面ごとに決まった数にする（2026-10-14 CIのチェック充実 案1）。
// 同じゲームのファイルなら、何度回しても同じ配り方・同じ CPU の迷いになる
const seedOf = (...xs) => { let h = 2166136261; for (const c of xs.join('|')) h = Math.imul(h ^ c.codePointAt(0), 16777619); return (h >>> 0) % 1e9 + 1 };

module.exports = { UNLOCKED, launch, openGame, startBot, runUntilDone, botState, pw, seedOf };
