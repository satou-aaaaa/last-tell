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
  let stage = '';
  const items = [], add = (id, title, bad, ok, warn) => items.push({ id, title, status: bad ? (warn ? 'warn' : 'fail') : 'ok', detail: bad || ok });
  try {
  stage = '1';
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
  stage = '2';
  // 2) 道具・カップ・伏せ札・札の文字・バーン（フリー6人、縦・横・PC）
  for (const [w, h] of VPS) {
    const vp = `${w}x${h}`, { ctx, page } = await H.openGame(browser, file, { fast: 20, viewport: { width: w, height: h }, lite: false, storage: H.UNLOCKED, seed: 42 });
    try {
      await page.evaluate(() => { $('freeSize').value = '6'; startFree() });
      if (!(await toStreet(page, 'river'))) { add(`livelook:table:${vp}`, `卓の道具（${vp}）`, 'リバーまで進めなかった', '', true); continue }
      const measure = () => page.evaluate(() => {
        const R = e => e.getBoundingClientRect(), vis = e => e && e.offsetParent && R(e).width > 2, ov = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        const hit = (sel, against) => { const out = []; for (const e of document.querySelectorAll(sel)) { if (!vis(e) || e.closest('.off')) continue; const a = R(e); for (const o of document.querySelectorAll(against)) if (vis(o) && !e.contains(o) && !o.contains(e) && ov(a, R(o))) out.push((o.id || o.className).slice(0, 20)) } return out };
        const tools = document.querySelector('.felt .lltools'), cup = document.querySelector('#table > .cup');
        const backs = [...document.querySelectorAll('.felt .spot .card.back')].filter(vis), flat = backs.filter(e => !/^matrix3d/.test(getComputedStyle(e).transform) && R(e).height >= e.offsetHeight - .5).length;   // 寝かせる回転（rotateX）が付いているか。卓の遠近で見かけの高さが変わる席があるので、回転が付いていれば良い
        const txt = document.getElementById('table').innerText;
        return {
          toolsOff: !tools || tools.classList.contains('off'), tools: hit('.felt .lltools .dtray, .felt .lltools .ddeck', '#boardCards .card, .felt .spot .card, #potSign, #plates .cue'),
          cupOff: !cup || cup.classList.contains('off'), cup: hit('#table > .cup', '#acts, #askRow, #mine .mystack, #dcall.go'),
          seats: hit('.llseats i', '#dbtn, .dbadge, #boardCards .card, .felt .spot .card, #mine .card'), mf: hit('#mfInner', '.felt .boardspot > .lltools:not(.off), #potChips .chip'),
          backs: backs.length, flat, flatWho: backs.filter(e => !/^matrix3d/.test(getComputedStyle(e).transform) && R(e).height >= e.offsetHeight - .5).map(e => e.closest('.spot').id + ' ' + e.className + ' ' + getComputedStyle(e).transform.slice(0, 20) + ' ' + getComputedStyle(e).animationName), burns: S.ll && S.ll.burns || 0, words: ['勝ち +', '伏せた', 'あなたのチップ'].filter(s => txt.includes(s)),
          bg: (() => { const b = document.querySelector('.room > .backroom i'); return b ? [getComputedStyle(b).backgroundImage.slice(0, 10), getComputedStyle(b.parentNode).filter] : null })()
        };
      });
      let r = await measure();
      // 重なりが出たら 1.5秒待って測り直す（WebKit は顔アップや札の動きの途中で測ることがある。v0.86.4 CI）。残ったものだけを問題にする
      if (r.seats.length || r.tools.length || r.toolsOff || r.mf.length) { await page.waitForTimeout(1500); r = await measure() }
      add(`livelook:tools:${vp}`, `ラックと山が場札・札・ポット・クセに重ならない（${vp}）`, r.tools.length ? r.tools.slice(0, 4).join(', ') : r.toolsOff ? '置ける場所がなく出していない' : '', '重なりなし', !r.tools.length);
      add(`livelook:cup:${vp}`, `飲み物がボタン・答え・チップ・ディーラーの声に重ならない（${vp}）`, r.cup.length ? r.cup.join(', ') : '', r.cupOff ? '置ける場所がないので出していない' : '重なりなし');
      // 名札が空の席が勝ったら、顔の下の金の線（#bustN.llwin）になる（縦の6人卓。v0.85.2 レビュー）
      if (vp === '390x844') {
        const g = await page.evaluate(() => { const ho = S.handOver, won = S.players.map(p => p.won); const small = S.players.map((p, i) => i && $('plate' + i) && ($('plate' + i).offsetHeight < 16 || $('plate' + i).offsetWidth < 28) ? i : 0).filter(Boolean);
          if (!small.length) return null; try { S.handOver = true; S.players.forEach((p, i) => p.won = small.includes(i) ? 1 : 0); llWinEdge(); return small.map(i => [i, $('bust' + i).classList.contains('llwin'), $('plate' + i).classList.contains('llwin')]) } finally { S.handOver = ho; S.players.forEach((p, i) => p.won = won[i]); llWinEdge() } });
        if (g) add(`livelook:winedge-small:${vp}`, `名札が空の席が勝つと顔の下に金の線（${vp}）`, g.filter(x => !x[1] || x[2]).map(x => `席${x[0] + 1}`).join(', '), `${g.length}席`);
      }
      add(`livelook:seats:${vp}`, `席番号がD・場札・札に重ならない（${vp}）`, r.seats.slice(0, 4).join(', '), '重なりなし');
      add(`livelook:mf:${vp}`, `心の声がラック・ポットのチップに重ならない（${vp}）`, r.mf.slice(0, 4).join(', '), '重なりなし');
      add(`livelook:backs:${vp}`, `相手の伏せ札が寝ている（${vp}）`, r.flat ? `${r.flat}/${r.backs}枚が立ったまま（${r.flatWho.slice(0, 2).join(' / ')}）` : '', `${r.backs}枚`);
      add(`livelook:burn:${vp}`, `場札を出すたびにバーン（${vp}）`, r.burns !== 3 ? `リバーまでで${r.burns}枚（期待3）` : '', '3枚');
      add(`livelook:words:${vp}`, `卓に「勝ち +」「伏せた」「あなたのチップ」が出ない（${vp}）`, r.words.join(', '), 'なし');
      add(`livelook:backroom:${vp}`, `店の奥は data: の絵で filter なし（${vp}）`, !r.bg ? '無い' : (!/url\("?data:/.test(r.bg[0]) ? r.bg[0] : r.bg[1] !== 'none' ? 'filter: ' + r.bg[1] : ''), 'OK');
    } finally { await ctx.close() }
  }
  stage = '3';
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
  stage = '5';
  // 5) 大一番ほどクセが濃い（改善提案 2026-10-15b 案1）：ターン・リバーでポット15BB以上なら正しいクセが+10pt以上、それ未満・フロップは0（v85 交代レビューで追加）
  {
    const { ctx, page } = await H.openGame(browser, file, { fast: 40, storage: H.UNLOCKED });
    try {
      await page.evaluate(() => { $('freeSize').value = '6'; startFree() });
      if (!(await toStreet(page, 'turn'))) add('morefun:bigboost', '大一番でクセが濃くなる', 'ターンまで進めなかった', '', true);
      else {
        const r = await page.evaluate(() => { if (typeof mfBigBoost !== 'function') return null; const keep = S.players.map(q => q.total), st = S.street, p = S.players.find(q => !q.human && !TW_KEEP.includes(q.name));
          const pot = n => S.players.forEach((q, k) => q.total = k ? 0 : n * BB()); try {   // potTotal は const なので、各人の出した額で大きさを作る
          S.street = 'turn'; pot(20); const big = mfBigBoost(p);   // 待つあいだに持ち時間で通りが進むことがあるので、通りはここで決める
           pot(5); const small = mfBigBoost(p); pot(20); S.street = 'flop'; const flop = mfBigBoost(p); return { big, small, flop } } finally { S.players.forEach((q, k) => q.total = keep[k]); S.street = st } });
        add('morefun:bigboost', 'ターン・リバーでポット15BB以上なら正しいクセが+10pt以上、それ未満とフロップは変わらない', !r ? 'mfBigBoost が無い' : (r.big < .1 || r.small || r.flop) ? `大${r.big} 小${r.small} フロップ${r.flop}` : '', r ? `+${Math.round(r.big * 100)}pt / 0 / 0` : '');
        // 勝った人の名札の縁（satou 12:30Z「縁を金色に」）：ハンドの終わりに金の縁が1人以上・字は出さない
        await page.evaluate(() => { const B = __bot; B.done = false; clearInterval(B.timer); B.timer = setInterval(() => { if (S.handOver) { B.done = true; clearInterval(B.timer); return } B.tick() }, 4) });
        await page.waitForFunction(() => S.handOver, null, { timeout: 30000 }).catch(() => {});
        await page.waitForTimeout(300);
        const w = await page.evaluate(() => ({ over: !!S.handOver, gold: document.querySelectorAll('.llwin').length, won: S.players.filter(p => p.won > 0).length }));
        add('livelook:winedge', 'ハンドの終わりに勝った人の名札の縁が金色（第4章以降・フリー）', !w.over ? 'ハンドが終わらなかった' : w.gold !== w.won ? `金の縁 ${w.gold}人（勝った人 ${w.won}人）` : '', `${w.gold}人`, !w.over);
      }
    } finally { await ctx.close() }
  }
  stage = '4';
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
  } catch (e) {   // 途中で落ちても、それまでの結果は残し、どこで落ちたかを書く
    items.push({ id: 'livelook:error', title: 'ライブポーカーらしい見た目の検査', status: 'fail', detail: `${stage}) の途中で: ${String(e && e.message || e).slice(0, 160)}`, closed: /closed|crash/i.test(String(e && e.message)) });
  }
  // 卓の因縁（改善提案 2026-10-15b 案3）：打ち方が変わるのは、その卓の最初の5ハンドだけ。
  //   フリー6人の自分の番で、相手全員に「あなたに降ろされた」記録を入れ、あなたが5BB賭けた形にして各相手の判断を呼ぶ（乱数 0）。ハンド番号だけ 3 と 6 に変えて比べる
  try {
    const { ctx, page } = await H.openGame(browser, file, { fast: 40, seed: 11, storage: H.UNLOCKED });
    try {
      await page.evaluate(() => { $('freeSize').value = '6'; startFree() });
      if (!(await toStreet(page, 'flop'))) add('morefun:grudge', '卓の因縁：打ち方が変わるのは卓の最初の5ハンドだけ', 'フロップまで進めなかった', '', true);
      else {
        const g = await page.evaluate(() => {
          const keep = { hn: S.handNo, cb: S.currentBet, ag: S.aggr, gr: S.grudge, r: LT.rand }, out = {};
          S.grudge = Object.fromEntries(S.players.filter(p => !p.human).map(p => [p.name, 'bluffed'])); LT.rand = () => 0;
          try { for (const hn of [3, 6]) { S.handNo = hn; S.grudgeHits = []; S.aggr = 0; S.currentBet = S.players[0].bet + BB() * 5;
              S.players.forEach((p, i) => { if (!p.human && inHand(p)) for (let k = 0; k < 6; k++) try { cpuDecide(i) } catch (e) {} }); out[hn] = S.grudgeHits.length } }
          finally { S.handNo = keep.hn; S.currentBet = keep.cb; S.aggr = keep.ag; S.grudge = keep.gr; LT.rand = keep.r; S.grudgeHits = [] }
          return out });
        add('morefun:grudge', '卓の因縁：打ち方が変わるのは卓の最初の5ハンドだけ', g[6] ? `6ハンド目でも判断が変わった（${g[6]}回）` : !g[3] ? '3ハンド目で一度も変わらなかった（降りる手の相手がいなかったかも）' : '',
          `同じ場面で、3ハンド目は ${g[3]}回変わり、6ハンド目は 0回`, !g[6]);
      }
    } finally { await ctx.close() }
  } catch (e) { add('morefun:grudge', '卓の因縁：打ち方が変わるのは卓の最初の5ハンドだけ', '検査そのものが失敗：' + String(e.message).slice(0, 120), '', true) }
  // アニメーションの重さ（v89 レビュー）：CI の動きは「ふつう」に固定（harness）。卓の顔のまばたき・ジンの手・少なめでも番とクセの人は動く
  try {
    const { ctx, page } = await H.openGame(browser, file, { fast: 1, seed: 12, storage: H.UNLOCKED, lite: false, settings: { motion: 'full' } })   // fast 1：まばたきは performance.now で数えるので、時計を速めると7秒待てない;
    try {
      const r = await page.evaluate(async () => {
        const out = { lite0: document.documentElement.classList.contains('ltLite') };
        $('freeSize').value = '6'; startFree(); await new Promise(r => setTimeout(r, 900));
        // まばたき：フリー6人の卓で、7秒のあいだに卓の顔のどれかに .blk が付くか（章を続けて開いたあとは顔が描き直され続けて測れないので最初に）
        out.blink = await new Promise(res => { const t0 = performance.now(); let done = false;
          const mo = new MutationObserver(ms => { for (const m of ms) if (!done && m.target.matches && m.target.matches('.bust svg.av.blk')) { done = true; mo.disconnect(); res(Math.round(performance.now() - t0)) } });
          mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
          setTimeout(() => { if (!done) { done = true; mo.disconnect(); res(-1) } }, 7000) });
        let ch = -1;
        for (let i = 3; i < CHAPTERS.length && i < 7; i++) { try { startChapter(CHAPTERS[i], true) } catch (e) { continue }
          await new Promise(r => setTimeout(r, 900)); render(); if (document.querySelector('.bust .av .t-hand')) { ch = i; break } }
        out.ch = ch + 1;
        const h = document.querySelector('.bust .av .t-hand'); out.hand = h ? getComputedStyle(h).animationName : '';
        // 少なめ：番の人とクセの人だけ動く
        const keep = SETTINGS.motion; SETTINGS.motion = 'less'; motionApply();
        const bs = [...document.querySelectorAll('.bust')].filter(b => !b.classList.contains('turn') && ![...b.classList].some(c => c.startsWith('cue-')));
        const b = bs[0], an = () => getComputedStyle(b).animationName;
        if (b) { out.liteOff = an(); b.classList.add('turn'); out.liteTurn = an(); b.classList.remove('turn'); b.classList.add('cue-qa'); out.liteCue = an(); b.classList.remove('cue-qa') }
        out.liteHand = h ? getComputedStyle(h).animationName : '';
        out.lite1 = document.documentElement.classList.contains('ltLite');
        SETTINGS.motion = keep; motionApply();
        return out });
      const T = '動きを減らしても大事な動きは残る';
      add('anim:full', 'CI の動きの設定が「ふつう」（少なめになっていない）', r.lite0 ? 'html.ltLite が付いていた（CI が少なめで撮っている）' : '', 'ltLite なし');
      add('anim:blink', '卓の顔が7秒以内にまばたきする', r.blink < 0 ? '7秒のあいだに .blk が一度も付かなかった' : '', `${r.blink}ms で .blk`);
      add('anim:jinhand', 'ジンの手（顎をなでる）が動く', r.ch < 1 ? 'ジンの手がある章が見つからなかった' : (!r.hand || r.hand === 'none') ? `第${r.ch}章で .t-hand の動きが ${r.hand || 'なし'}` : (!r.liteHand || r.liteHand === 'none') ? `少なめで止まった（${r.liteHand}）` : '', `第${r.ch}章 ${r.hand}（少なめでも ${r.liteHand}）`);
      add('anim:lite', T + '：少なめでは番の人とクセの人だけ動く', !r.lite1 ? '少なめにしても ltLite が付かない' : (r.liteOff && r.liteOff !== 'none') ? `番でない人が動いている（${r.liteOff}）` : (!r.liteTurn || r.liteTurn === 'none') ? '番の人が止まった' : (!r.liteCue || r.liteCue === 'none') ? 'クセの人が止まった' : '', `ほか ${r.liteOff}／番 ${r.liteTurn}／クセ ${r.liteCue}`);
    } finally { await ctx.close() }
  } catch (e) { add('anim:error', '動きの検査', '検査そのものが失敗：' + String(e.message).slice(0, 120), '', true) }
  return { name: 'ライブポーカーらしい見た目', items };
}
module.exports = { run };
