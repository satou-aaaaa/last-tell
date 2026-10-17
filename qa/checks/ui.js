// 画面チェック：スマホ縦・スマホ横・PCで撮って、重なり・はみ出し・隠れを自動で探す
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('../lib/harness');

const VIEWPORTS = [
  { key: '縦_390x844', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  { key: '横_844x390', viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true },
  { key: 'PC_1280x800', viewport: { width: 1280, height: 800 } },
];

// 撮る場面。prep はページの中で動かす。waitFor が真になるまで待つ
const SCENES = [
  { key: 'タイトル', prep: `0`, waitFor: `!$('title').hidden`, fresh: true },
  { key: '章の一覧', prep: `showChapters()`, waitFor: `!$('chapters').hidden` },
  // 扉は自動で進まない（はじめての人の第1章だけ）ので、扉なら1つ進めて最初の会話を撮る（v83 レビュー）
  { key: '第1章の会話', prep: `startChapter(CHAPTERS[0])`, waitFor: `!$('scene').hidden`, after: `SC&&SC.lines[SC.i]&&SC.lines[SC.i].door&&advance()`, measure: 'talkFace' },
  { key: '6人卓の相手紹介', prep: `startChapter(CHAPTERS[3],true)`, waitFor: `!$('vs').hidden` },
  { key: '第1章_自分の番', prep: `startChapter(CHAPTERS[0],true)`, myTurn: true },
  { key: 'フリー6人_自分の番', prep: `($('freeSize').value='6',startFree())`, myTurn: true },
  { key: '第5章_自分の番', prep: `startChapter(CHAPTERS[4],true)`, myTurn: true },
  { key: '第6章_自分の番', prep: `startChapter(CHAPTERS[5],true)`, myTurn: true },
  // 1対1（v65 クリエイター目線レビュー：スマホ横で相手の顔が目から上で切れていた）
  { key: '第7章_自分の番', prep: `startChapter(CHAPTERS[6],true)`, myTurn: true, street: 'flop' },
  { key: 'フリー6人_レイズを開く', prep: `($('freeSize').value='6',startFree())`, myTurn: true, after: `$('btnRaise').click()` },
  // deal：配る札を固定（v88.2 レビュー：Chromium と WebKit で結果が違い比べられなかった）。配り 32・CPU の種 1007 は、左の席（相手1）があなたとのショーダウンで勝ち、あなたは残る手（ゲームが終わらない）。手元の Chromium で4回とも同じ勝ち負け
  { key: 'フリー6人_ハンドの終わり', prep: `($('freeSize').value='6',startFree())`, handEnd: true, deal: 32, seed: 1007 },
  // 場札にチップが重ならないか（v71 改善提案§1：第2章でポットの山が場札を隠していた）
  { key: '第2章_ハンドの終わり', prep: `startChapter(CHAPTERS[1],true)`, handEnd: true },
  { key: '設定', prep: `($('freeSize').value='6',startFree())`, myTurn: true, after: `$('btnSet').click()` },
  { key: '英語_フリー6人_自分の番', prep: `($('freeSize').value='6',startFree())`, myTurn: true, lang: 'en' },
  // 主人公の画面と回想（クリエイター目線レビュー v62 の直し5）。waitFor は会話や相手紹介を先へ送りながら待つ
  { key: '名乗る', prep: `startChapter(CHAPTERS[0])`, fresh: true,
    waitFor: `(()=>{const a=$('askGo');if(a&&a.offsetParent)return true;if(!$('scene').hidden)advance();return false})()` },
  { key: '身なり', prep: `lookOpen()`, waitFor: `!$('lookDlg').hidden` },
  // 改善提案 第5回 §1：はじめての人がストーリーを押すと出る「注意書き＋遊んだことは？」の箱（v82 レビュー：縦でスクロールなしに収まるか）
  // 改善提案 2026-10-15b 案2：アオの心の声（字幕）がボタン・手札・場札・クセの札・ディーラーの声に重ならないか
  { key: 'フリー6人_心の声', prep: `($('freeSize').value='6',startFree())`, myTurn: true, street: 'flop', after: `(MF.innerMs=1e7,mfInner(MF_RECALL.smile.strong))`, measure: 'inner' },
  // 改善提案 2026-10-15b 案5：章クリアの「この章の読み」（読み勝ちの見返し）。札・名前・クセが画面に収まるか（v87 レビュー）
  { key: '読み勝ちの見返し', prep: `startChapter(CHAPTERS[3],true)`, myTurn: true, street: 'flop', settle: 3400,
    after: `(MF_REPLAY.ms=1e7,(()=>{const o=S.players.find(p=>!p.human&&!p.out&&p.hand&&p.hand.length);mfReplay({pot:1,name:o.name,cue:'smile',act:'call',hand:o.hand.slice(),board:S.board.slice(),hand2:S.players[0].hand.slice()})})())` },
  // 改善提案 2026-10-15b 案4：人だかり（オールインがコールされたとき）。影と「おお……」の声が札・名札・ボタンに重ならないか
  { key: 'フリー6人_人だかり', prep: `($('freeSize').value='6',startFree())`, myTurn: true, street: 'flop', settle: 1400,
    after: `(S.runout=true,render(),S.runout=false,crowdSay(CROWD.lines[1]))`, measure: 'inner', sel: '#crowdSay' },
  { key: 'はじめての箱', prep: `$('btnStory').click()`, fresh: true, waitFor: `!!$('novDlg')&&!$('novDlg').hidden` },
  { key: '回想の判断', prep: `startFlashback(()=>{},'seki')`, settle: 2500,
    waitFor: `(()=>{if(!$('vs').hidden){$('vsGo').click();return false}return !!(S&&S.fbAsk&&S.toAct===0&&!S.handOver&&!$('controls').hidden)})()` },
  { key: '回想の結果', prep: `startFlashback(()=>{},'reika')`, settle: 2500,
    waitFor: `(()=>{if(!$('vs').hidden){$('vsGo').click();return false}return !!(S&&S.handOver&&S.result==='flash'&&!$('btnNext').hidden)})()` },
  // 2026-10-14 CIのチェック充実 案2：まだ撮っていなかった遊び方と画面。基準（baseline.json の uiScenes）に入るまでは、問題があっても ⚠️
  { key: '第7章_ハンドの終わり', prep: `startChapter(CHAPTERS[6],true)`, handEnd: true },
  { key: '第11章_自分の番', prep: `startP2(PART2[0],true)`, myTurn: true },
  { key: '店で遊ぶ_自分の番', prep: `startStore(CHAPTERS[0],true)`, myTurn: true, street: 'flop' },
  { key: '裏の卓_自分の番', prep: `startUra(1)`, myTurn: true },
  { key: '英語_第1章の会話', prep: `startChapter(CHAPTERS[0])`, waitFor: `!$('scene').hidden`, lang: 'en', after: `SC&&SC.lines[SC.i]&&SC.lines[SC.i].door&&advance()`, measure: 'talkFace' },
];

// ページの中で、見えている大事な部品を調べる
const INSPECT = `(() => {
  const W = innerWidth, Hh = innerHeight, out = [];
  const vis = el => { if (!el || el.hidden) return false; const s = getComputedStyle(el); if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) return false; const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 };
  const shown = el => { for (let e = el; e && e !== document.body; e = e.parentElement) { if (e.hidden) return false; const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false } return true };
  const desc = el => (el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '')) + (el.textContent.trim() ? '「' + el.textContent.trim().replace(/\\s+/g, ' ').slice(0, 14) + '」' : '');
  const scrollable = el => { for (let e = el.parentElement; e; e = e.parentElement) { const s = getComputedStyle(e); if (/(auto|scroll)/.test(s.overflowY + s.overflowX) && (e.scrollHeight > e.clientHeight + 2 || e.scrollWidth > e.clientWidth + 2)) return true } return document.scrollingElement.scrollHeight > Hh + 2 };
  const screenEl = ['title', 'chapters', 'scene', 'game', 'notebook', 'more'].map(id => document.getElementById(id)).find(e => e && !e.hidden);
  const root = document;
  // 調べる部品：ボタン、自分の手札、場札、相手の名札。相手の伏せ札・空の札置き場は飾りなので見ない
  const sel = 'button, #mfReplay .card, #mfReplay .mfr-lab, #mfReplay .mfr-cue, #mine .card, #boardCards .card:not(.slot), #board2 .card:not(.slot), [id^=plate]:not(#plates), #felt .spot .hand:not(.folded):not(.muck) .card:not(.back):not(.slot)';   // 相手の見せた札（v88.2 レビュー：勝った左の席の札が肩のうしろに隠れた）
  // 窓（相手紹介・設定・はしごなど）が開いているときは、その中だけを見る
  const modal = [...document.querySelectorAll('#vs, #setPanel, #runBox, #quiz, #help, #daily, #share, #moreDlg, #stackZoom, #tour, [role=dialog]')]
    .filter(e => shown(e) && vis(e)).filter(e => { const r = e.getBoundingClientRect(); return r.width * r.height > 0.5 * W * Hh })[0];
  const scope = modal || root;
  const els = [...scope.querySelectorAll(sel)].filter(el => shown(el) && vis(el) && !el.closest('#log, .log, details:not([open]) > :not(summary)'));
  const imp = els.filter(el => !el.closest('[aria-hidden=true]'));
  for (const el of imp) {
    const r = el.getBoundingClientRect();
    // はみ出し
    const offX = r.left < -2 || r.right > W + 2, offY = r.top < -2 || r.bottom > Hh + 2;
    if ((offX || offY) && !scrollable(el)) out.push({ kind: 'はみ出し', el: desc(el), rect: [r.left, r.top, r.width, r.height].map(Math.round) });
    // 隠れ：5点のうち3点以上がほかの部品の下
    // スクロールする枠の外（下へ流れて見えていない所）は「隠れ」に数えない。スクロールすれば見える（改善提案 第5回 §0-4）
    const clip = (() => { for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) { const s = getComputedStyle(e); if (/(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 2) return e.getBoundingClientRect() } return null })();
    const pts = [[.5, .5], [.25, .25], [.75, .25], [.25, .75], [.75, .75]].map(([a, b]) => [r.left + r.width * a, r.top + r.height * b]).filter(([x, y]) => x >= 0 && y >= 0 && x < W && y < Hh && (!clip || (y >= clip.top && y <= clip.bottom && x >= clip.left && x <= clip.right)));
    let cov = 0, by = null;
    for (const [x, y] of pts) { const t = document.elementFromPoint(x, y); if (t && !el.contains(t) && !t.contains(el)) { cov++; by = by || t } }
    if (pts.length >= 3 && cov >= 3) {
      const b = by.closest('button,[role=dialog],.card,[id]') || by;
      out.push({ kind: '隠れ', el: desc(el), by: desc(b) });
    }
    // 文字が切れている（ボタン）
    if (el.tagName === 'BUTTON' && (el.scrollWidth > el.clientWidth + 3) && /hidden|clip/.test(getComputedStyle(el).overflow)) out.push({ kind: '文字切れ', el: desc(el) });
  }
  // 吹き出しが上の帯（☰・章名・目標）の下に入って切れていないか（v88.1 レビュー：第11章の縦でゲンの名前が帯に隠れた）
  { const tb = document.getElementById('tbar'); if (tb && vis(tb) && !modal) { const b = tb.getBoundingClientRect().bottom;
    const q = tb.getBoundingClientRect();
    for (const sy of document.querySelectorAll('#sayLayer .say.go, #plates .say.go')) if (shown(sy) && vis(sy)) { const r = sy.getBoundingClientRect();
      if (r.top < b - 1 && r.bottom > q.top && r.right > q.left && r.left < q.right) out.push({ kind: '隠れ', el: desc(sy), by: '#tbar（上の帯）' });
      else if (r.top < -1) out.push({ kind: 'はみ出し', el: desc(sy), rect: [r.left, r.top, r.width, r.height].map(Math.round) }) } } }
  // ボタン同士の重なり。スクロールする枠の中の部品は、枠で切れて見えている部分だけで比べる（改善提案 第5回 §0-4）
  const visRect = el => { const r = el.getBoundingClientRect(); let L = r.left, T = r.top, R = r.right, B = r.bottom;
    for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) { const s = getComputedStyle(e); if (/(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 2) { const c = e.getBoundingClientRect(); L = Math.max(L, c.left); T = Math.max(T, c.top); R = Math.min(R, c.right); B = Math.min(B, c.bottom) } }
    return { left: L, top: T, right: R, bottom: B, width: Math.max(0, R - L), height: Math.max(0, B - T) } };
  const btn = imp.filter(e => e.tagName === 'BUTTON');
  for (let i = 0; i < btn.length; i++) for (let j = i + 1; j < btn.length; j++) {
    const a = visRect(btn[i]), b = visRect(btn[j]);
    if (btn[i].contains(btn[j]) || btn[j].contains(btn[i])) continue;
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (w > 0 && h > 0 && w * h > 0.15 * Math.min(a.width * a.height, b.width * b.height)) out.push({ kind: '重なり', el: desc(btn[i]), by: desc(btn[j]) });
  }
  // 相手の席の見せた手札と「勝ち」の札が、卓と画面の内側にあるか（改善提案 §2）
  {const tb = document.getElementById('table'), tr = tb && vis(tb) ? tb.getBoundingClientRect() : { left: 0, right: W, top: 0, bottom: Hh };
    const L = Math.max(0, tr.left), R = Math.min(W, tr.right);
    for (const el of [...document.querySelectorAll('#felt .spot .hand:not(.folded) .card, #plates .plate .tag')].filter(e => shown(e) && vis(e))) {
      const r = el.getBoundingClientRect();
      if (r.left < L - 2 || r.right > R + 2) out.push({ kind: 'はみ出し', el: desc(el.closest('.spot, .plate') || el) + ' ' + desc(el), rect: [r.left, r.top, r.width, r.height].map(Math.round) });
      if (el.classList.contains('tag')) { const pl = el.parentElement.getBoundingClientRect(); if (r.left < pl.left - 2 || r.right > pl.right + 2) out.push({ kind: 'はみ出し', el: '名札の外 ' + desc(el) }) }
    }}
  // 相手の名札が顔（口より上）にかかっていないか（2026-10-10 satou「顔にチップの表示がかぶっている」）
  // 卓の顔は .bust の高さに対して 目 37%・口 57%・あご 68%（.av.real、translate -6% 込み）。顔の幅は真ん中 40%
  if (!modal) for (const b of document.querySelectorAll('#busts .bust:not(.out)')) {
    if (!b.querySelector('.av.real') || !vis(b)) continue;
    const pl = document.getElementById('plate' + b.id.slice(4)); if (!pl || !shown(pl) || !vis(pl)) continue;
    const br = b.getBoundingClientRect(), r = pl.getBoundingClientRect(), mouth = br.top + br.height * .57;
    const hov = Math.min(r.right, br.right - br.width * .3) - Math.max(r.left, br.left + br.width * .3);
    if (hov > 0 && r.top < mouth - 1) out.push({ kind: '顔隠れ', el: desc(pl), by: '口より ' + Math.round(mouth - r.top) + 'px 上まで' });
  }
  // 1対1・3人の卓で、正面の相手の顔（#bust1）の上端が画面の中にあるか（v65 レビュー：スマホ横で目から上が切れていた）
  // 絵（svg）は頭の上に余白があるので、目の高さ（.bust の 37%）が画面の中で、上の帯の下にあるかを見る
  if (!modal) { const b = document.querySelector('#bust1:not(.out)'); if (b && b.querySelector('svg') && shown(b) && vis(b)) {
    const r = b.getBoundingClientRect(), eye = r.top + r.height * .37, bar = document.getElementById('tbar'), br = bar && vis(bar) ? bar.getBoundingClientRect() : null, barB = br && br.left < r.right - r.width * .3 && br.right > r.left + r.width * .3 ? br.bottom : 0; // 上の帯が顔の真ん中と横で重なるときだけ
    if (eye < Math.max(0, barB) - 8) out.push({ kind: '顔切れ', el: '#bust1 の顔', by: '目の高さが画面の上から ' + Math.round(eye) + 'px（上の帯の下端 ' + Math.round(barB) + 'px）' }) } }
  // 捨て札の山（.muckcard。pointer-events:none なので上の「隠れ」では見えない）が、自分の手札・場札・ボタン・名札の 25% 以上にかかっていないか（改善提案 2026-10-14b §1）
  if (!modal) { const mk = [...document.querySelectorAll('.muckpile .muckcard')].filter(e => shown(e) && vis(e)).map(e => e.getBoundingClientRect()).filter(r => r.width > 2);
    if (mk.length) for (const el of imp) { const r = el.getBoundingClientRect(); if (r.width * r.height < 4) continue; let n = 0;
      for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { const x = r.left + r.width * (i + .5) / 6, y = r.top + r.height * (j + .5) / 6; if (mk.some(q => x >= q.left && x <= q.right && y >= q.top && y <= q.bottom)) n++ }
      if (n / 36 >= .25) out.push({ kind: '隠れ', el: desc(el), by: '捨て札の山（.muckcard）' }) } }
  // 場札（フロップの後）の札の 15% 以上にチップ（ポットの山・賭けチップ・持ち点の塔）が重なっていないか（v71 改善提案§1）。めくる途中で細くなっている札と、飛んでいるチップは見ない
  if (!modal) { const bc0 = [...document.querySelectorAll('#boardCards .card:not(.slot), #board2 .card:not(.slot)')].filter(e => shown(e) && vis(e)), mw = Math.max(0, ...bc0.map(e => e.getBoundingClientRect().width)), bc = bc0.filter(e => e.getBoundingClientRect().width > mw * .8);
    // 1対1では、相手の伏せ札と D の札も数える（v70 レビュー：第7章で伏せ札が3枚目の場札の端に 14% かかっていた）
    const hu = !!document.getElementById('bust1') && !document.getElementById('bust2');
    if (bc.length >= 3) { const ch = [...document.querySelectorAll('#table .chip' + (hu ? ', #felt .spot:not(#spot0) .hand:not(.folded):not(.muck) .card, #dbtn' : ''))].filter(e => shown(e) && vis(e) && !e.closest('.potfly, .potmove, .wonfly, .wait')).map(e => [e, e.getBoundingClientRect()]).filter(([, r]) => r.width > 2);
      for (const c of bc) { const r = c.getBoundingClientRect(); let n = 0, by = null;
        for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const x = r.left + r.width * (i + .5) / 8, y = r.top + r.height * (j + .5) / 8, h = ch.find(([, q]) => x >= q.left && x <= q.right && y >= q.top && y <= q.bottom); if (h) { n++; by = h[0] } }
        if (n / 64 >= .15) { const w = by.closest('#potChips, .chipwrap, .mystack, .won-pile, .hand') || by; out.push({ kind: 'チップ重なり', el: '場札', by: desc(c) + ' の ' + Math.round(100 * n / 64) + '% に ' + (w.id ? '#' + w.id : (w.closest('[id]') || {}).id + ' .' + String(w.className).split(' ')[0]) }) } } } }
  // 横スクロールが出ていないか
  if (document.scrollingElement.scrollWidth > W + 2) out.push({ kind: '横スクロール', el: 'ページ全体 ' + document.scrollingElement.scrollWidth + 'px' });
  return out;
})()`;

// 場所の記録（本線が手元で再現できないブラウザの崩れを、数字で見るため）。ui/rects.json（WebKit は rects_WebKit.json）
// 足したいときは QA_RECTS="セレクタ,セレクタ" で増やせる
const RECT_SELS = ['#felt', '#boardCards', '#boardCards .card', '.spot .mystack', '#mine .me-r'].concat((process.env.QA_RECTS || '').split(',').filter(Boolean));
const RECTS = `(()=>{const o={};for(const q of ${JSON.stringify(RECT_SELS)}){const a=[...document.querySelectorAll(q)].slice(0,8).map(e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e);return{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),ow:e.offsetWidth,oh:e.offsetHeight,tf:c.transform==='none'?undefined:c.transform,ts:c.transformStyle==='flat'?undefined:c.transformStyle,pv:c.perspective==='none'?undefined:c.perspective,spot:(e.closest('.spot')||{}).id,tl:e.style.translate||undefined,ca:e.dataset.ca}});if(a.length)o[q]=a}return o})()`;

async function shoot(browser, file, scene, vp, dir) {
  const { ctx, page } = await H.openGame(browser, file, { viewport: vp.viewport, isMobile: vp.isMobile, hasTouch: vp.hasTouch, fast: 20, lite: false, lang: scene.lang || 'ja', seed: scene.seed || 1000 + SCENES.indexOf(scene), deal: scene.deal,
    storage: scene.fresh ? null : H.UNLOCKED });
  try {
    await page.evaluate(scene.prep);
    const t0 = Date.now();
    if (scene.myTurn || scene.handEnd) {
      await H.startBot(page, { policy: 'call', maxHands: 99 });
      // 自分の番（またはハンドの終わり）が来たら止める
      // street：撮る時点を決めた通り（例 'flop'＝フロップで自分の番）にする。版ごとにプリフロップ・フロップと揺れて「22% 変わった」と出ていた（改善提案 2026-10-14b §1）。30秒で来なければ、どの番でも撮る
      await page.evaluate(([h, st]) => { const B = __bot, t = B.tick, t0 = Date.now(); B.tick = function () { if (h ? (S && S.players && S.handOver && S.handNo >= 1 && !document.getElementById('btnNext').hidden) : (S && S.players && !S.handOver && S.toAct === 0 && !document.getElementById('controls').hidden && (!st || S.street === st || Date.now() - t0 > 30000))) { B.done = true; return } t() }; clearInterval(B.timer); B.timer = setInterval(B.tick, 4) }, [!!scene.handEnd, scene.street || '']);
      while (!(await page.evaluate(() => __bot.done)) && Date.now() - t0 < 60000) await page.waitForTimeout(150);
      await page.evaluate(() => clearInterval(__bot.timer));
    } else {
      while (!(await page.evaluate(scene.waitFor)) && Date.now() - t0 < 40000) await page.waitForTimeout(100);
    }
    if (scene.after) { await page.evaluate(scene.after); }
    // 回想は配り終えたあと卓が上へ寄るので、落ち着くまで長めに待つ
    await page.waitForTimeout(scene.settle || 900);
    // 番が来た直後にページが自動でスクロールすることがある（170pxほど）。スクロールが落ち着く（0.3秒動かない）まで待つ。最大3秒
    for (let last = -1, same = 0, t1 = Date.now(); same < 3 && Date.now() - t1 < 3000; await page.waitForTimeout(100)) {
      const y = await page.evaluate(() => Math.round(scrollY));
      same = y === last ? same + 1 : 0; last = y;
    }
    // カメラが止まってから測る（v88.2 レビュー：ハンドの終わりで測った瞬間だけカメラが寄っていて、#felt が1.5倍・場札が y=748 と出た）。#cam・#felt の形が2回続けて同じになるまで、最大3秒
    for (let last = '', t2 = Date.now(); Date.now() - t2 < 3000; await page.waitForTimeout(150)) {
      const k = await page.evaluate(() => ['cam', 'felt', 'stage'].map(id => { const e = document.getElementById(id); return e ? getComputedStyle(e).transform : '' }).join('|'));
      if (k === last) break; last = k;
    }
    const issues = await page.evaluate(INSPECT);
    // 会話の話し手の絵が、会話の箱にどれだけ隠れるか（絵の高さに対する割合。v82 レビュー：横で顔の下が箱に隠れていた）
    let face = null;
    if (scene.measure === 'inner') face = await page.evaluate(sel => { const e = document.querySelector(sel); if (!e || e.hidden) return -1; const r = e.getBoundingClientRect();
      return [...document.querySelectorAll('button, #mine .card, #boardCards .card:not(.slot), #felt .hand:not(.folded):not(.muck) .card, #plates .cue, #dcall.go, #potSign, #dbtn, .dbadge, .llseats i, [id^=plate]:not(#plates), #sayLayer .say.go, #plates .say.go, #mfInner:not([hidden]), #crowdSay:not([hidden])')].filter(x => x !== e && x.offsetParent && getComputedStyle(x).visibility !== 'hidden')
        .filter(x => { const q = x.getBoundingClientRect(); return q.width > 2 && r.left < q.right - 1 && q.left < r.right - 1 && r.top < q.bottom - 1 && q.top < r.bottom - 1 })
        // 何にどれだけ重なったか（v86 レビュー：「1個」だけでは画像を見ないと分からない）
        .map(x => { const q = x.getBoundingClientRect(), w = Math.min(r.right, q.right) - Math.max(r.left, q.left), h = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top);
          const nm = x.id ? '#' + x.id : x.classList.contains('say') ? '吹き出し「' + (x.textContent || '').trim().slice(0, 12) + '」' : x.tagName === 'BUTTON' ? 'ボタン「' + (x.textContent || '').trim().slice(0, 8) + '」' : (x.className || x.tagName).toString().split(' ').slice(0, 2).join('.');
          return nm + ' ' + Math.round(w) + '×' + Math.round(h) + 'px' }) }, scene.sel || '#mfInner');
    if (scene.measure === 'talkFace') face = await page.evaluate(() => { const f = document.querySelector('#stage .portrait svg'), b = $('box'); if (!f || !b) return null;
      const r = f.getBoundingClientRect(), q = b.getBoundingClientRect(); if (!r.height) return null; return Math.round(Math.max(0, Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top)) / r.height * 100) });
    const rects = await page.evaluate(RECTS);
    const shot = path.join(dir, `${scene.key}_${vp.key}.png`);
    await page.screenshot({ path: shot });
    let innerParts = null; if (Array.isArray(face)) { innerParts = face; face = face.length }
    const lite = await page.evaluate(() => document.documentElement.classList.contains('ltLite')).catch(() => null);   // 動き「少なめ」で撮ったか（v89 レビュー）
    return { scene: scene.key, vp: vp.key, issues, shot, rects, face, innerParts, lite, errors: await page.evaluate(() => __qa.errors) };
  } catch (e) {
    return { scene: scene.key, vp: vp.key, issues: [{ kind: '撮れなかった', el: String(e.message).slice(0, 80) }], shot: null, errors: [] };
  } finally { await ctx.close() }
}

async function run({ browser, file, outDir, baseline, parallel = 3 }) {
  const dir = path.join(outDir, 'ui'); fs.mkdirSync(dir, { recursive: true });
  // QA_SCENES=人だかり,心の声 のように名前の一部を渡すと、その場面だけ撮る（手元で1場面だけ確かめるとき）
  const only = (process.env.QA_SCENES || '').split(',').filter(Boolean);
  const jobs = []; for (const s of SCENES) if (!only.length || only.some(o => s.key.includes(o))) for (const v of VIEWPORTS) jobs.push([s, v]);
  const res = [];
  for (let i = 0; i < jobs.length; i += parallel) res.push(...await Promise.all(jobs.slice(i, i + parallel).map(([s, v]) => shoot(browser, file, s, v, dir))));
  // ページやブラウザが途中で閉じた場面は、1回だけ撮り直す（WebKit でたまに起きる。ブラウザごと落ちていたら開き直す）
  let own = null;
  for (let i = 0; i < res.length; i++) {
    const x = res[i].issues && res[i].issues[0];
    if (!(res[i].shot === null && x && x.kind === '撮れなかった' && /closed|crash/i.test(x.el))) continue;
    if (!own) own = await H.launch();   // 撮り直しはいつも新しいブラウザで（WebKit は落ちる前に調子が悪くなっていて、同じブラウザで撮り直しても落ちた：v0.86.4 CI）
    const [s, v] = jobs[i];
    res[i] = await shoot(own || browser, file, s, v, dir);
    res[i].retried = true;
  }
  if (own) await own.close().catch(() => {});
  const rects = {}; for (const r of res) if (r.rects) rects[`${r.scene}_${r.vp}`] = r.rects;
  fs.writeFileSync(path.join(dir, process.env.QA_BROWSER === 'webkit' ? 'rects_WebKit.json' : 'rects.json'), JSON.stringify(rects));
  const known = new Set((baseline && baseline.uiIssues) || []), all = [], items = [];
  // 基準を作ったときに撮っていなかった場面（uiScenes が無い古い基準では、案2で足した場面）
  const ADDED = ['第7章_ハンドの終わり', '第11章_自分の番', '店で遊ぶ_自分の番', '裏の卓_自分の番', '英語_第1章の会話'];
  const isNewScene = k => baseline && baseline.uiScenes ? !baseline.uiScenes.includes(k) : ADDED.includes(k);
  for (const r of res) {
    // 基準と比べる鍵は、部品の名前だけにする（「」の中の文字や数字はチップの額などで毎回変わるため）
    const bare = d => String(d || '').replace(/「.*$/, '').replace(/\d+/g, '');
    // 何に隠れたか（by）も、配られた札やチップの額で変わるので鍵に入れない
    // 画面の大きさも鍵に入れない（同じ問題が、環境の字の幅しだいで縦かPCのどちらかに出るため）
    if (r.lite) r.issues.push({ kind: '動き少なめ', el: 'html.ltLite（CI は「ふつう」で撮るはず）' });
    const keys = r.issues.map(x => `${r.scene}|${x.kind}|${bare(x.el)}`);
    all.push(...keys);
    const fresh = r.issues.filter((x, i) => !known.has(keys[i]));
    const old = r.issues.length - fresh.length;
    const txt = x => `${x.kind}: ${x.el}${x.by ? ' ← ' + x.by : ''}`;
    const status = r.errors.length ? 'fail' : fresh.length ? (isNewScene(r.scene) ? 'warn' : 'fail') : old ? 'known' : 'ok';
    items.push({ id: `ui:${r.scene}:${r.vp}`, title: `画面 ${r.scene}（${r.vp}）`, status,
      detail: (r.errors.length ? 'エラー: ' + r.errors[0] + '。' : '') + (fresh.length && isNewScene(r.scene) ? '（新しく撮り始めた場面なので ⚠️。基準を書き直すと次から ❌）' : '') + (fresh.length ? '新しい問題: ' + fresh.slice(0, 4).map(txt).join('、') + (fresh.length > 4 ? ` ほか${fresh.length - 4}件` : '') : r.issues.length ? `前からある問題 ${old}件（${r.issues.slice(0, 2).map(txt).join('、')}）` : '重なり・はみ出し・隠れなし'),
      shot: r.shot ? path.relative(outDir, r.shot) : null, issues: r.issues, lite: r.lite });
  }
  // 基準は前の基準に足していく（配られる札で毎回出たり出なかったりする問題があるため）。消すときは baseline.json を手で直す
  // 会話の話し手が箱に隠れる割合（絵の高さの 25% を超えたら ⚠️。肩の先が少しかかるのは許す）
  for (const r of res) if (r.face != null && SCENES.find(s => s.key === r.scene).measure === 'inner') items.push({ id: `ui:${r.scene === 'フリー6人_人だかり' ? 'crowd' : 'inner'}:${r.vp}`, title: `${r.scene === 'フリー6人_人だかり' ? '人だかりの声' : '心の声の字幕'}がほかの部品に重ならない（${r.vp}）`, status: r.face === 0 ? 'ok' : 'warn',
    detail: r.face < 0 ? '字幕・声が出なかった' : `重なっている部品 ${r.face}個` + (r.innerParts && r.innerParts.length ? '：' + r.innerParts.join('、') : '（ボタン・手札・場札・名札・クセの札・ディーラーの声・ポットの額・D ボタン・席番号・吹き出し）') });
  for (const r of res) if (r.face != null && SCENES.find(s => s.key === r.scene).measure === 'talkFace') items.push({ id: `ui:talkFace:${r.scene}:${r.vp}`, title: `会話の話し手が箱に隠れない（${r.scene}・${r.vp}）`, status: r.face > 25 ? 'warn' : 'ok',
    detail: `話し手の絵の ${r.face}% が会話の箱に隠れている（目安 25%まで）` });
  // ライブポーカーらしい見た目（2026-10-15）の「できた」の条件。Chromium と WebKit の両方で回るように、ここから呼ぶ
  // WebKit でページやブラウザが途中で閉じたときは、ブラウザを開き直して1回だけやり直す（撮影と同じ。v85.2 の CI で2回続けて起きた）
  try {
    let ll = (await require('./livelook').run({ browser: browser.isConnected() ? browser : (own = await H.launch()), file })).items;
    if (ll.some(x => x.id === 'livelook:error' && x.closed)) { const b2 = await H.launch(); try { ll = (await require('./livelook').run({ browser: b2, file })).items.map(x => ({ ...x, detail: (x.detail || '') + '（ブラウザを開き直した2回目）' })) } finally { await b2.close().catch(() => {}) } }
    items.push(...ll.map(({ closed, ...x }) => x));
  } catch (e) { items.push({ id: 'livelook:error', title: 'ライブポーカーらしい見た目の検査', status: 'fail', detail: String(e && e.message || e).slice(0, 200) }) }
  finally { if (own) await own.close().catch(() => {}) }
  return { name: '画面チェック', items, baselineOut: { uiIssues: [...new Set([...known].filter(k => k.split('|').length === 3).concat(all))], uiScenes: SCENES.map(s => s.key) } };
}
module.exports = { run, VIEWPORTS, SCENES };
