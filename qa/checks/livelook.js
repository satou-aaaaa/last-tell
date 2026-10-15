// ライブポーカーらしい見た目（2026-10-15、research/ライブポーカーらしい見た目_実装仕様.md の「できた」の条件）
//   ui.js の最後から呼ぶ（CI では Chromium と WebKit の両方で回る）
'use strict';
const H = require('../lib/harness');
const VPS = [[390, 844], [844, 390], [1280, 800]];

// 自分の番でターンかリバーまで進めて止める
async function toStreet(page, street) {
  await H.startBot(page, { policy: 'call', maxHands: 60 });
  await page.evaluate(st => { const B = __bot, t = B.tick; clearInterval(B.timer); B.timer = setInterval(function () { if (S && S.players && !S.handOver && S.toAct === 0 && S.street === st && !$('controls').hidden) { B.done = true; return } return t() }, 4) }, street);
  for (let i = 0; i < 300 && !(await page.evaluate(() => __bot.done)); i++) await page.waitForTimeout(150);
  await page.evaluate(() => clearInterval(__bot.timer)); await page.waitForTimeout(1300);
  return page.evaluate(() => __bot.done);
}

async function run({ browser, file }) {
  const items = [], add = (id, title, bad, ok, warn) => items.push({ id, title, status: bad ? (warn ? 'warn' : 'fail') : 'ok', detail: bad || ok });
  // 1) ラシャの印刷：物語の各章で店の名前（地下の賭場跡と回想は空）、英語版は英語
  for (const lang of ['ja', 'en']) {
    const { ctx, page } = await H.openGame(browser, file, { fast: 40, storage: H.UNLOCKED, lang });
    try {
      const bad = await page.evaluate(async () => {
        const out = [];
        for (let i = 0; i < CHAPTERS.length && i < 7; i++) {
          const ch = CHAPTERS[i]; try { startChapter(ch, true) } catch (e) { out.push(`第${i + 1}章 ${e.message}`); continue }
          await new Promise(r => setTimeout(r, 400)); render();
          const z = document.querySelector('.felt .potzone'), c = getComputedStyle(z, '::before').content.replace(/^"|"$/g, '');
          const fp = FELT_PRINT[ch.venue] || FELT_PRINT['港のバー「錨亭」'], want = CFG.flashback ? '' : (I18N.lang === 'en' ? fp.en : fp.ja);
          if (c === 'LAST TELL' || (c !== want && !(c === 'none' && !want))) out.push(`第${i + 1}章 ${ch.venue}: 「${c}」（期待「${want}」）`);
        }
        return out;
      });
      add(`livelook:print:${lang}`, `ラシャの印刷が店の名前（${lang}）`, bad.length ? bad.slice(0, 3).join(' / ') : '', '第1〜7章');
    } finally { await ctx.close() }
  }
  // 2) 道具・カップ・伏せ札・札の文字・バーン（フリー6人、縦・横・PC）
  for (const [w, h] of VPS) {
    const vp = `${w}x${h}`, { ctx, page } = await H.openGame(browser, file, { fast: 20, viewport: { width: w, height: h }, lite: false, storage: H.UNLOCKED, seed: 42 });
    try {
      await page.evaluate(() => { $('freeSize').value = '6'; startFree() });
      if (!(await toStreet(page, 'river'))) { add(`livelook:table:${vp}`, `卓の道具（${vp}）`, 'リバーまで進めなかった', '', true); continue }
      const r = await page.evaluate(() => {
        const R = e => e.getBoundingClientRect(), vis = e => e && e.offsetParent && R(e).width > 2, ov = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        const hit = (sel, against) => { const out = []; for (const e of document.querySelectorAll(sel)) { if (!vis(e) || e.closest('.off')) continue; const a = R(e); for (const o of document.querySelectorAll(against)) if (vis(o) && !e.contains(o) && !o.contains(e) && ov(a, R(o))) out.push((o.id || o.className).slice(0, 20)) } return out };
        const tools = document.querySelector('.felt .lltools'), cup = document.querySelector('#table > .cup');
        const backs = [...document.querySelectorAll('.felt .spot .card.back')].filter(vis), flat = backs.filter(e => !/^matrix3d/.test(getComputedStyle(e).transform) && R(e).height >= e.offsetHeight - .5).length;   // 寝かせる回転（rotateX）が付いているか。卓の遠近で見かけの高さが変わる席があるので、回転が付いていれば良い
        const txt = document.getElementById('table').innerText;
        return {
          toolsOff: !tools || tools.classList.contains('off'), tools: hit('.felt .lltools .dtray, .felt .lltools .ddeck', '#boardCards .card, .felt .spot .card, #potSign, #plates .cue'),
          cupOff: !cup || cup.classList.contains('off'), cup: hit('#table > .cup', '#acts, #askRow, #mine .mystack, #dcall.go'),
          backs: backs.length, flat, flatWho: backs.filter(e => !/^matrix3d/.test(getComputedStyle(e).transform) && R(e).height >= e.offsetHeight - .5).map(e => e.closest('.spot').id + ' ' + e.className + ' ' + getComputedStyle(e).transform.slice(0, 20) + ' ' + getComputedStyle(e).animationName), burns: S.ll && S.ll.burns || 0, words: ['勝ち +', '伏せた', 'あなたのチップ'].filter(s => txt.includes(s)),
          bg: (() => { const b = document.querySelector('.room > .backroom i'); return b ? [getComputedStyle(b).backgroundImage.slice(0, 10), getComputedStyle(b.parentNode).filter] : null })()
        };
      });
      add(`livelook:tools:${vp}`, `ラックと山が場札・札・ポット・クセに重ならない（${vp}）`, r.tools.length ? r.tools.slice(0, 4).join(', ') : r.toolsOff ? '置ける場所がなく出していない' : '', '重なりなし', !r.tools.length);
      add(`livelook:cup:${vp}`, `飲み物がボタン・答え・チップ・ディーラーの声に重ならない（${vp}）`, r.cup.length ? r.cup.join(', ') : '', r.cupOff ? '置ける場所がないので出していない' : '重なりなし');
      add(`livelook:backs:${vp}`, `相手の伏せ札が寝ている（${vp}）`, r.flat ? `${r.flat}/${r.backs}枚が立ったまま（${r.flatWho.slice(0, 2).join(' / ')}）` : '', `${r.backs}枚`);
      add(`livelook:burn:${vp}`, `場札を出すたびにバーン（${vp}）`, r.burns !== 3 ? `リバーまでで${r.burns}枚（期待3）` : '', '3枚');
      add(`livelook:words:${vp}`, `卓に「勝ち +」「伏せた」「あなたのチップ」が出ない（${vp}）`, r.words.join(', '), 'なし');
      add(`livelook:backroom:${vp}`, `店の奥は data: の絵で filter なし（${vp}）`, !r.bg ? '無い' : (!/url\("?data:/.test(r.bg[0]) ? r.bg[0] : r.bg[1] !== 'none' ? 'filter: ' + r.bg[1] : ''), 'OK');
    } finally { await ctx.close() }
  }
  // 3) ジンの席にプロテクターが出ない・第7章でめくりが出ない（第7章を数ハンド）
  {
    const { ctx, page } = await H.openGame(browser, file, { fast: 40, storage: H.UNLOCKED });
    try {
      await page.evaluate(() => { window.__ll = { jin: 0, peek: 0 }; new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.classList && n.classList.contains('oprot')) { const i = +(n.closest('.spot') || { id: 'x' }).id.replace('spot', ''); if (S.players[i] && S.players[i].name === 'ジン') __ll.jin++ } if (document.querySelector('.peekup')) __ll.peek++ }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] }); startChapter(CHAPTERS[6], true) });
      await H.startBot(page, { policy: 'call', maxHands: 6 }); await H.runUntilDone(page, { timeoutMs: 90000, stallMs: 20000 });
      const r = await page.evaluate(() => __ll);
      add('livelook:jin', 'ジンの席にプロテクターが出ない・第7章でめくりが出ない', r.jin || r.peek ? `プロテクター${r.jin}回、めくり${r.peek}回` : '', '0回');
    } finally { await ctx.close() }
  }
  // 4) めくる相手の選ばれ方が手の強さと関係しない（1000ハンド分、選ぶ処理だけを回す）
  {
    const { ctx, page } = await H.openGame(browser, file, { fast: 40, storage: H.UNLOCKED });
    try {
      await page.evaluate(() => { $('freeSize').value = '6'; startFree() }); await page.waitForTimeout(1500);
      const r = await page.evaluate(() => {
        const st = h => (h[0].r + h[1].r + (h[0].r === h[1].r ? 14 : 0)) / 42, T = window.setTimeout; window.setTimeout = () => 0;
        let d = 0, n = 0;
        try {
          for (let k = 0; k < 1000; k++) {
            const deck = []; for (let r = 2; r <= 14; r++) for (let s = 0; s < 4; s++) deck.push({ r, s });
            S.players.forEach(p => { p.folded = p.out = p.allIn = false; p.hand = [deck.splice(Math.random() * deck.length | 0, 1)[0], deck.splice(Math.random() * deck.length | 0, 1)[0]] });
            S.handOver = false; S.street = 'turn'; S.ll = {}; llPeek(); if (S.ll.peekWho == null) continue;
            const c = S.players.filter((p, i) => i && !p.human), mean = c.reduce((a, p) => a + st(p.hand), 0) / c.length;
            d += st(S.players[S.ll.peekWho].hand) - mean; n++;
          }
        } finally { window.setTimeout = T }
        return { n, diff: n ? d / n : 1 };
      });
      add('livelook:peek-random', 'めくる相手は手の強さと関係しない', Math.abs(r.diff) >= .05 || r.n < 500 ? `差 ${r.diff.toFixed(3)}（${r.n}回）` : '', `差 ${r.diff.toFixed(3)}（${r.n}回）`);
    } finally { await ctx.close() }
  }
  return { name: 'ライブポーカーらしい見た目', items };
}
module.exports = { run };
