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
  return pw.chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
}

// ゲームを開く。fonts.googleapis は止める（読み込みが止まるため）
// lite:true のときは動き（アニメーション）を止めて速く回す。画面チェックでは lite:false
async function openGame(browser, file, { viewport = { width: 1280, height: 800 }, fast = FAST, lang = 'ja', settings = {}, storage = null, isMobile = false, hasTouch = false, lite = true, seed = null } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile, hasTouch, serviceWorkers: 'block', reducedMotion: lite ? 'reduce' : 'no-preference' });
  if (lite) await ctx.addInitScript(`document.addEventListener('DOMContentLoaded',()=>{const st=document.createElement('style');st.textContent='*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important}';document.head.appendChild(st)})`);
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort()); // 外への通信はしない
  await ctx.addInitScript(initScript({ fast, lang, settings, seed }));
  if (storage) await ctx.addInitScript(`(()=>{try{const s=${JSON.stringify(storage)};for(const k in s)localStorage.setItem(k,s[k])}catch(e){}})()`);
  const page = await ctx.newPage();
  page.on('pageerror', e => page.__errs = (page.__errs || []).concat(String(e.message)));
  await page.goto('file://' + path.resolve(file), { waitUntil: 'load' });
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
  function decide() {
    const me = S.players[0], toCall = S.currentBet - me.bet;
    if ((B.policy === 'cpu' || (B.policy === 'mix' && Math.random() < .6)) && typeof cpuDecide === 'function') { try { const d = cpuDecide(0); if (d && d.type) return d } catch (e) { B.events.push('cpuDecide(0) error: ' + e.message) } }
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
        B.lastSum = s; B.lastNames = names;
        // 次のハンドで補充される分
        B.expect = s + (CFG.refill ? S.players.filter(p => !p.human && !p.extra && p.chips <= 0).reduce((a, p) => a + p.start, 0) : 0);
        if (S.result) { B.result = S.result; B.done = true; return }
        if (B.hands >= B.maxHands) { B.result = 'limit'; B.done = true; B.games = B.games || 1; return }
      }
      if (S.twice && !B.twiceSeen.includes(S.handNo)) B.twiceSeen.push(S.handNo);
      if (!S.handOver && S.toAct === 0 && !S.autoMe && vis($('controls'))) { if (B.firstDecisionClicks === undefined) B.firstDecisionClicks = B.totalClicks || 0; const d = decide(); B.decisions++; act(0, d.type, d.to); return }
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

module.exports = { UNLOCKED, launch, openGame, startBot, runUntilDone, botState, pw };
