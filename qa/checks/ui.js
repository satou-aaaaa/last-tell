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
  // アクションのわかりやすさ 案2：ディーラーの声に呼び名と席番号（.sn）。声がほかの部品に重ならないか（v91.2 レビュー）
  // clearTimeout(dcallT)：速く回すと声が 65ms で消えて元の場所に戻り、見えない #dcall を測っていた（v93 レビューの「#say5 89×3px」）
  { key: 'フリー6人_ディーラーの呼び名', prep: `($('freeSize').value='6',startFree())`, myTurn: true, street: 'flop', settle: 600,
    after: `(()=>{const i=S.players.findIndex((p,j)=>j&&!p.out&&!p.folded);awCall(i,'call',Math.max(1,S.currentBet));$('dcall').style.animationDuration='600s';clearTimeout(dcallT)})()`, measure: 'inner', sel: '#dcall', callCheck: true },
  { key: 'はじめての箱', prep: `$('btnStory').click()`, fresh: true, waitFor: `!!$('novDlg')&&!$('novDlg').hidden` },
  { key: '回想の判断', prep: `startFlashback(()=>{},'seki')`, settle: 2500,
    waitFor: `(()=>{if(!$('vs').hidden){$('vsGo').click();return false}return !!(S&&S.fbAsk&&S.toAct===0&&!S.handOver&&!$('controls').hidden)})()` },
  { key: '回想の結果', prep: `startFlashback(()=>{},'reika')`, settle: 2500,
    waitFor: `(()=>{if(!$('vs').hidden){$('vsGo').click();return false}return !!(S&&S.handOver&&S.result==='flash'&&!$('btnNext').hidden)})()` },
  // 2026-10-14 CIのチェック充実 案2：まだ撮っていなかった遊び方と画面。基準（baseline.json の uiScenes）に入るまでは、問題があっても ⚠️
  { key: '第7章_ハンドの終わり', prep: `startChapter(CHAPTERS[6],true)`, handEnd: true },
  { key: '第11章_自分の番', prep: `startP2(PART2[0],true)`, myTurn: true },
  // 第14章は5人卓（改善提案 第10回 §1。5人の並びはここだけ）
  { key: '第14章_自分の番', prep: `startP2(PART2[3],true)`, myTurn: true, street: 'flop' },
  { key: '第14章_ハンドの終わり', prep: `startP2(PART2[3],true)`, handEnd: true, showBy: 2 },   // 上の真ん中の席（カイ）が札を見せたハンドの終わりで撮る（45秒で来なければどのハンドでも）。v96.1 レビュー：ミヤコが見せる回で、カイの札が撮れていなかった
  { key: '店で遊ぶ_自分の番', prep: `startStore(CHAPTERS[0],true)`, myTurn: true, street: 'flop' },
  { key: '裏の卓_自分の番', prep: `startUra(1)`, myTurn: true },
  { key: '英語_第1章の会話', prep: `startChapter(CHAPTERS[0])`, waitFor: `!$('scene').hidden`, lang: 'en', after: `SC&&SC.lines[SC.i]&&SC.lines[SC.i].door&&advance()`, measure: 'talkFace' },
  // クセの読める範囲（js/50_read_scope.js、2026-10-18）：第4章で相手2人とも残し、レイカにクセの札を付けて「レイカだけ」の印を撮る（最後に足す：前の場面の seed を変えない）
  { key: '第4章_クセ3人以上', prep: `startChapter(CHAPTERS[3],true)`, myTurn: true, street: 'flop', settle: 900, rsCheck: true,
    after: `(()=>{try{const t={};Object.keys(TIPS).forEach(k=>t[k]=1);guideSet({tips:t});tipHide()}catch(e){}S.players.forEach(p=>{if(!p.out&&p.folded){p.folded=false;p.lastAct='';p.lastType=''}});let i=S.players.findIndex(p=>p.name==='レイカ');if(i<1)i=1;const p=S.players[i];S.tellSeq=(S.tellSeq||0)+1;p.tell={cue:'smile',meaning:'strong',truth:'strong',street:S.street,seq:S.tellSeq};render()})()` },
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
  // 席の透明な入れ物（.spot や .hand の枠）と卓の布（#felt）は、傾いた卓では手前に当たることがあるが、見た目は何も隠さない（v0.96.2：第14章の横で、見せた札が隣の席の枠に、脱落した人の名札が #felt に「隠れ」と出た）
  const effOp = t => { let o = 1; for (let e = t; e && e.nodeType === 1; e = e.parentElement) o *= +getComputedStyle(e).opacity; return o };
  const painted0 = t => effOp(t) < 0.05 || getComputedStyle(t).visibility !== 'visible';
  const seatBox = t => t.id === 'felt' || !!t.closest('#felt .spot') && !t.closest('.card, .mystack, .chipwrap, .won-pile, .muckcard, .chip, .col, svg, img');
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
    // 透明（opacity 0 の祖先がある）部品は何も隠さないので、その下を見る（v0.97.0 PR #111：第14章 PC で、写真では見えている場札 4♦ が div.card.back の下と出た）
    for (const [x, y] of pts) { const t = document.elementsFromPoint(x, y).find(t => !painted0(t)); if (t && !el.contains(t) && !t.contains(el) && !seatBox(t)) { cov++; by = by || t } }
    if (pts.length >= 3 && cov >= 3) {
      const b = by.closest('button,[role=dialog],.card,[id]') || by;
      const q = b.getBoundingClientRect(), home = b.closest('[id]');
      out.push({ kind: '隠れ', el: desc(el), by: desc(b), at: (home && home !== b ? '#' + home.id + ' の中、' : '') + [q.left, q.top, q.width, q.height].map(Math.round).join(',') + '・不透明度 ' + effOp(b).toFixed(2) });
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
  // 名札の下の行動の語（.ltact、アクションのわかりやすさ 案1）が、席番号・D・チップ・吹き出し・ポットの額・札に重ならないか（その席の伏せ札の上に重ねるのは決めた置き方なので見ない）
  if (!modal) { const okv = e => { if (!e || e.hidden || e.closest('[hidden]')) return false; const s = getComputedStyle(e); if (s.visibility === 'hidden' || s.display === 'none') return false; for (let q = e; q && q !== document.body; q = q.parentElement) { const t = getComputedStyle(q); if (t.display === 'none' || +t.opacity === 0) return false } const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2 };
    const acts = [...document.querySelectorAll('.ltact, .vfturn, .vfpos, .vfres, #vfLog:not(.off)')].filter(okv);   // .vf*：動画のツッコミの直し（2026-10-17、js/47_video_fixes.js）。#vfLog：直近の5手（js/48_bet_log.js）
    const others = [...document.querySelectorAll('.llseats i, #dbtn, .dbadge, .felt .spot .chipwrap, .felt .spot .mystack, #mine .mystack, #mine .mybet, #sayLayer .say.go, #plates .say.go, #potSign, #boardCards .card:not(.slot), #mine .card, #felt .spot .hand:not(.folded):not(.muck) .card:not(.slot):not(.back), #plates .cue, #dcall.go, .ltact, .vfturn, .vfpos, .vfres, #vfLog:not(.off), #between .acts button, #resultText')].filter(okv).concat([document.getElementById('msg')].filter(e => okv(e) && (e.textContent || '').trim()));   // #msg：上の案内の文（字があるとき。v92 レビュー）。#between：ハンドの終わりの結果の文とボタン（v96.4 レビュー：PC で直近の5手が重なった）
    for (const el of acts) { const a = el.getBoundingClientRect(); for (const o of others) { if (o === el || o.contains(el) || el.contains(o)) continue; const c = o.getBoundingClientRect();
      const w = Math.min(a.right, c.right) - Math.max(a.left, c.left), h = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
      const chip = /chipwrap|mystack/.test(o.className);   // チップの山の端に少しかかるのは読める（語の面積の4分の1まで）
      if (w > 4 && h > 4 && (!chip || w * h > .25 * a.width * a.height)) { out.push({ kind: '重なり', el: desc(el), by: desc(o) + ' ' + Math.round(w) + '×' + Math.round(h) + 'px' }); break } } }
    // 行動の語がほかの席の名札・顔に乗らないか（v91.2 レビュー：縦で「フォールド」が左の席の頭に乗った）。自分の名札・顔は見ない
    // 顔はゲームの faceBox（顔のまわりの空いた所を入れない枠）。体の箱 .body は隣の席どうしで重なるほど大きいので使わない
    const L0 = document.getElementById('sayLayer'), lr = L0 && L0.getBoundingClientRect();
    const faces = [...document.querySelectorAll('#plates .plate')].filter(okv).map(o => ({ r: o.getBoundingClientRect(), o, nm: '名札 ' + desc(o) }));
    if (lr && typeof faceBox === 'function' && typeof S !== 'undefined' && S && S.players) S.players.forEach((p, i) => { if (!i || p.out) return; const f = faceBox(i); if (f) faces.push({ r: { left: lr.left + f.l, right: lr.left + f.r, top: lr.top + f.t, bottom: lr.top + f.b }, i, nm: '顔 席' + (i + 1) }) });
    for (const el of [...document.querySelectorAll('#plates .plate > .ltact')].filter(okv)) { const a = el.getBoundingClientRect(), i = +(el.parentElement.id || '').replace('plate', '');
      // 自分の名札の名前（.nm）にもかからないか（v92.1 レビュー：縦6人卓で上下にずらした語が自分の名前を隠した）
      { const n = el.parentElement.querySelector(':scope > .nm'); if (n && vis(n)) { const c = n.getBoundingClientRect(), w = Math.min(a.right, c.right) - Math.max(a.left, c.left), h = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
        if (w > 2 && h > 2) out.push({ kind: '重なり', el: desc(el), by: '自分の名札の名前 ' + Math.round(w) + '×' + Math.round(h) + 'px' }) } }
      // 画面（#game）の左右からはみ出していないか（v93 レビュー：縦6人卓の端の席で「コール 5,0」と切れた）
      { const g = (document.getElementById('game') || document.body).getBoundingClientRect(), ox = Math.max(g.left - a.left, a.right - g.right); if (ox > 1) out.push({ kind: 'はみ出し', el: desc(el) + '（#game の外へ ' + Math.round(ox) + 'px）', rect: [a.left, a.top, a.width, a.height].map(Math.round) }) }
      for (const { r: c, o, i: fi, nm } of faces) { if (o === el.parentElement || fi === i) continue;
        const w = Math.min(a.right, c.right) - Math.max(a.left, c.left), h = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
        if (w > 4 && h > 4) { out.push({ kind: '重なり', el: desc(el), by: 'ほかの席の' + nm + ' ' + Math.round(w) + '×' + Math.round(h) + 'px' }); break } } } }
  // 相手の見せた札が場札に重ならないか（v91.2 レビュー：6人卓の縦で右の席の見せた札が川の札にかかった）
  if (!modal) { const bc = [...document.querySelectorAll('#boardCards .card:not(.slot)')].filter(e => vis(e)).map(e => e.getBoundingClientRect()).filter(r => r.width > 2);
    for (const el of [...document.querySelectorAll('#felt .spot .hand:not(.folded):not(.muck) .card:not(.slot):not(.back)')].filter(e => vis(e))) { const a = el.getBoundingClientRect();
      const b = bc.find(c => Math.min(a.right, c.right) - Math.max(a.left, c.left) > 3 && Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top) > 3);
      if (b) { out.push({ kind: '重なり', el: '見せた札 ' + desc(el.closest('.spot') || el) + ' ' + desc(el), by: '場札 ' + Math.round(Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) + 'px' }); break } } }
  // 相手の見せた札の数字の角（左上の角）が、ほかの部品の下に隠れていないか。縮めた札が小さすぎないか（v96.1 レビュー：5人卓の上の真ん中の席で、PC は名札の下に角が入り、横は 21px まで縮んで数字が読めなかった）
  if (!modal) for (const el of [...document.querySelectorAll('#felt .spot .hand:not(.folded):not(.muck) .card:not(.slot):not(.back)')].filter(e => vis(e))) { const a = el.getBoundingClientRect(); if (a.width < 3) continue;
    // 卓は3Dで傾いていて elementFromPoint は当てにならない（#felt や #busts を返す）。札の角の四角と、上に重なりうる部品の四角で比べる
    const cr = { l: a.left, t: a.top, r: a.left + Math.min(14, a.width * .35), b: a.top + Math.min(16, a.height * .45) };
    const by = [...document.querySelectorAll('#table .vfres, #boardCards .card:not(.slot), #plates .plate, #potSign:not([hidden]) .pv, #sayLayer .say.go, #plates .say.go, .llseats i:not([hidden]), .dbadge, #dbtn, #felt .spot .mystack, #felt .spot .hand:not(.folded):not(.muck) .card:not(.slot)')].filter(e => vis(e) && e !== el && e.closest('.hand') !== el.closest('.hand'))
      .find(e => { const q = e.getBoundingClientRect(); return q.width > 2 && [cr].concat(el.closest('.hand.sybs') ? [{ l: a.left + a.width * .25, r: a.right - a.width * .25, t: a.top + a.height * .25, b: a.bottom - a.height * .25 }] : []).some(c => Math.min(c.r, q.right) - Math.max(c.l, q.left) > 2 && Math.min(c.b, q.bottom) - Math.max(c.t, q.top) > 2) });   // 縮めた札（.sybs）は数字を真ん中に出すので、真ん中も見る（PR #103 のレビュー）
    if (by) { out.push({ kind: '隠れ', el: '見せた札の角 ' + desc(el.closest('.spot') || el) + ' ' + desc(el), by: desc(by) }); break }
    const h = el.closest('.hand'); if (h && h.style.scale && a.height < 27) { out.push({ kind: '小さすぎ', el: '見せた札 ' + desc(el.closest('.spot') || el) + ' ' + desc(el), by: '高さ ' + Math.round(a.height) + 'px（縮めた札は 28px 以上）' }); break } }
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
  // ポットの塔が、ポットの額（#potSign .pv）と自分の手札に重ならないか（v93 レビュー：スマホ縦で塔が額の字の後ろに立ち、下半分が伏せ札に隠れた）
  if (!modal) { const cols = [...document.querySelectorAll('#potChips .col')].filter(e => shown(e) && vis(e)).map(e => e.getBoundingClientRect()).filter(r => r.width > 2);
    const tg = [...document.querySelectorAll('#potSign:not([hidden]) .pv')].filter(e => vis(e)).map(e => [e, 'ポットの額']).concat([...document.querySelectorAll('#mine .card')].filter(e => vis(e)).map(e => [e, '自分の手札']));
    for (const [e, nm] of tg) { const q = e.getBoundingClientRect(); let w = 0, h = 0;
      for (const c of cols) { const w1 = Math.min(c.right, q.right) - Math.max(c.left, q.left), h1 = Math.min(c.bottom, q.bottom) - Math.max(c.top, q.top); if (w1 > 2 && h1 > 2 && w1 * h1 > w * h) { w = w1; h = h1 } }
      if (w > 2 && h > 2) out.push({ kind: '重なり', el: 'ポットの塔（#potChips）', by: nm + ' ' + Math.round(w) + '×' + Math.round(h) + 'px' }) }
    // v95 レビュー：第6章の縦で、ポットの額が自分の手札の上に乗った（塔×札・塔×額だけでは見つからない）
    const mc = [...document.querySelectorAll('#mine .card')].filter(e => vis(e)).map(e => e.getBoundingClientRect()).filter(r => r.width > 2);
    for (const e of [...document.querySelectorAll('#potSign:not([hidden]) .pv')].filter(e => vis(e))) { const q = e.getBoundingClientRect(); let w = 0, h = 0;
      for (const c of mc) { const w1 = Math.min(c.right, q.right) - Math.max(c.left, q.left), h1 = Math.min(c.bottom, q.bottom) - Math.max(c.top, q.top); if (w1 > 2 && h1 > 2 && w1 * h1 > w * h) { w = w1; h = h1 } }
      if (w > 2 && h > 2) out.push({ kind: '重なり', el: 'ポットの額（#potSign）', by: '自分の手札 ' + Math.round(w) + '×' + Math.round(h) + 'px' }) } }
  // クセの読める範囲：印（.rsOnly）は自分を入れて3人以上が残っているときだけ。第7章・回想・物語の決めのハンドでは出ない
  { const rv = [...document.querySelectorAll('#plates .cue .rsOnly')].filter(e => !e.hidden && vis(e));
    if (rv.length && typeof S !== 'undefined' && S && S.players) { const n = S.players.filter(p => !p.out && !p.folded).length;
      if (n < 3) out.push({ kind: '出てはいけない', el: 'クセの札の印「' + rv[0].textContent + '」', by: '残り ' + n + '人（1対1）' });
      if (typeof rsOff === 'function' && rsOff()) out.push({ kind: '出てはいけない', el: 'クセの札の印「' + rv[0].textContent + '」', by: '第7章・回想・物語の決めのハンド' }) } }
  // 横スクロールが出ていないか
  if (document.scrollingElement.scrollWidth > W + 2) out.push({ kind: '横スクロール', el: 'ページ全体 ' + document.scrollingElement.scrollWidth + 'px' });
  return out;
})()`;

// 場所の記録（本線が手元で再現できないブラウザの崩れを、数字で見るため）。ui/rects.json（WebKit は rects_WebKit.json）
// 足したいときは QA_RECTS="セレクタ,セレクタ" で増やせる
const RECT_SELS = ['#felt', '#boardCards', '#boardCards .card', '#felt .spot .hand .card', '.spot .mystack', '#mine .me-r'].concat((process.env.QA_RECTS || '').split(',').filter(Boolean));
const RECTS = `(()=>{const o={};for(const q of ${JSON.stringify(RECT_SELS)}){const a=[...document.querySelectorAll(q)].slice(0,8).map(e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e);return{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),ow:e.offsetWidth,oh:e.offsetHeight,tf:c.transform==='none'?undefined:c.transform,ts:c.transformStyle==='flat'?undefined:c.transformStyle,pv:c.perspective==='none'?undefined:c.perspective,spot:(e.closest('.spot')||{}).id,tl:e.style.translate||undefined,ca:e.dataset.ca}});if(a.length)o[q]=a}return o})()`;

async function shoot(browser, file, scene, vp, dir) {
  const { ctx, page } = await H.openGame(browser, file, { viewport: vp.viewport, isMobile: vp.isMobile, hasTouch: vp.hasTouch, fast: 20, lite: false, settings: { ...(scene.settings || {}), motion: 'full' }, lang: scene.lang || 'ja', seed: scene.seed || 1000 + SCENES.indexOf(scene), deal: scene.deal,
    storage: scene.fresh ? null : H.UNLOCKED });
  try {
    await page.evaluate(scene.prep);
    const t0 = Date.now();
    if (scene.myTurn || scene.handEnd) {
      await H.startBot(page, { policy: 'call', maxHands: 99 });
      // 自分の番（またはハンドの終わり）が来たら止める
      // street：撮る時点を決めた通り（例 'flop'＝フロップで自分の番）にする。版ごとにプリフロップ・フロップと揺れて「22% 変わった」と出ていた（改善提案 2026-10-14b §1）。30秒で来なければ、どの番でも撮る
      await page.evaluate(([h, st, sb]) => { const B = __bot, t = B.tick, t0 = Date.now(); B.tick = function () { if (h ? (S && S.players && S.handOver && S.handNo >= 1 && !document.getElementById('btnNext').hidden && (!sb || (S.players[sb] && S.players[sb].show && !S.players[sb].folded) || Date.now() - t0 > 45000)) : (S && S.players && !S.handOver && S.toAct === 0 && !document.getElementById('controls').hidden && (!st || S.street === st || Date.now() - t0 > 30000))) { B.done = true; return } t() }; clearInterval(B.timer); B.timer = setInterval(B.tick, 4) }, [!!scene.handEnd, scene.street || '', scene.showBy || 0]);
      while (!(await page.evaluate(() => __bot.done)) && Date.now() - t0 < 60000) await page.waitForTimeout(150);
      await page.evaluate(() => clearInterval(__bot.timer));
      // ハンドの終わりが60秒で来なかったら、進行中の画面をハンドの終わりとして撮らない（CodeRabbit PR #103）
      if (scene.handEnd && !(await page.evaluate(() => __bot.done))) throw new Error('ハンドの終わりを待って60秒たった');
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
      const k = await page.evaluate(() => ['cam', 'felt', 'stage'].map(id => { const e = document.getElementById(id); return e ? getComputedStyle(e).transform : '' }).concat([...document.querySelectorAll('#boardCards .card')].map(e => getComputedStyle(e).transform)).join('|'));   // 場札を配っている途中も待つ（v93.1 レビュー：WebKit PC で場札が translateY(-20px) のまま撮られた）
      if (k === last) break; last = k;
    }
    // ハンドの終わりは、ポットが勝った人へ渡り勝ち負けの札が出るまで待ってから測って撮る（最大4秒）。前は撮ってから1秒あとに状態を読み、
    // 撮った写真はポットを送る途中なのに ✅ だった（v0.97.1 レビュー：WebKit 第7章 PC・縦でポットの山と額が卓のまん中に写った）
    const readHs = () => page.evaluate(() => { const me = S.players[0], v = document.querySelector('#table > .vfres'), vr = v && v.getBoundingClientRect(), ps = $('potSign'), pc = $('potChips');
      const vis = e => !!e && !e.hidden && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && +getComputedStyle(e).opacity > .05;
      return { iWon: me.won > 0, sd: S.street === 'showdown' && !S.board2, inIt: !me.folded && !me.out, pot: S.pot || 0, won: S.players.reduce((a, p) => a + (p.won || 0), 0),
        vf: !!v, vfOn: !!(v && vis(v) && vr.width > 2 && vr.top >= 0 && vr.bottom <= innerHeight && vr.left >= 0 && vr.right <= innerWidth), vfTop: v ? v.style.top : '', vfOut: !!(v && v.classList.contains('out')), vfDone: !!(S.vf && S.vf.res),
        vfWin: !!(v && v.classList.contains('win')), vfH: v ? (v.dataset.h || '') : '', hand: S.handNo, fb: !!(typeof CFG !== 'undefined' && CFG.flashback), vfText: v ? v.textContent.slice(0, 40) : '',
        chips: pc ? [...pc.querySelectorAll('.chip')].filter(vis).length : -1, sign: vis(ps) && /\d/.test((ps && ps.textContent) || ''), quiet: typeof VF !== 'undefined' && VF.quiet ? !!VF.quiet() : null,
        shownBad: (() => { const out = []; S.players.forEach((p, i) => { if (!i || !p || p.out || p.folded || !p.show) return; const sp = $('spot' + i); if (sp && sp.querySelector('.hand.mucked-away')) return; const cs = sp ? [...sp.querySelectorAll('.hand .card')] : [];   // 負けて集められた手は見ない
          if (!cs.length) { out.push((p.name || '席' + (i + 1)) + '：札なし'); return }
          cs.forEach((c, k) => { let op = 1; for (let x = c; x && x !== document.body; x = x.parentElement) op *= +getComputedStyle(x).opacity; const r = c.getBoundingClientRect(), run = c.getAnimations ? c.getAnimations().filter(a => a.playState === 'running').map(a => a.animationName || a.transitionProperty || 'script') : [];
            if (op < .9 || r.width < 8 || run.length) out.push((p.name || '席' + (i + 1)) + ' ' + (k + 1) + '枚め：' + [op < .9 ? '不透明度 ' + op.toFixed(2) : '', r.width < 8 ? '幅 ' + Math.round(r.width) + 'px（横向きのまま）' : '', run.length ? '動きの途中 ' + run.join('/') : ''].filter(Boolean).join('・')) }) }); return out })(),
        dbg: `pushing=${!!S.potPushing} potfly=${document.querySelectorAll('#table .potfly').length} potmove=${document.querySelectorAll('#table .potmove').length}${v ? ` vf=${v.className}/${(+getComputedStyle(v).opacity).toFixed(2)}/${[vr.left, vr.top, vr.width, vr.height].map(Math.round).join(',')}` : ''} wonPile=${document.querySelectorAll('#table .won-pile').length}${S.wonPile ? '(' + Object.keys(S.wonPile.amt).join(',') + ')' : ''} anim=${document.getAnimations ? document.getAnimations().map(a => a.playState).join(',').slice(0, 60) : '?'} potPile=${S.potPile ? S.potPile.chips : '-'}` } }).catch(e => ({ err: String(e.message).slice(0, 80) }));
    const hsReady = x => !x || x.err || !((x.won > 0 && (x.chips > 0 || x.sign)) || (x.iWon && !x.quiet && !x.vfOn && !x.vfOut));
    // 何を待ったか（チップ・額・勝ち負けの札）を残す（v0.97.1 PR #112：WebKit で 1.5〜3秒待ったが、何が遅いのか分からなかった）
    const hsWhy = x => !x || x.err ? '' : [x.won > 0 && x.chips > 0 ? `チップ${x.chips}枚` : '', x.won > 0 && x.sign ? '額' : '', x.iWon && !x.quiet && !x.vfOn && !x.vfOut ? (x.vf ? '札が画面の外か透明' : '札なし') : ''].filter(Boolean).join('+');
    let hs0 = null, waitMs = 0, waitWhy = '', lastWhy = '';
    if (scene.handEnd) { const tw = Date.now(); hs0 = await readHs(); while (!hsReady(hs0) && Date.now() - tw < 4000) { const w = hsWhy(hs0); if (w && w !== lastWhy) lastWhy = w, waitWhy += (waitWhy ? ' → ' : '') + `${Date.now() - tw}ms:${w}`; await page.waitForTimeout(100); hs0 = await readHs() } waitMs = Date.now() - tw }
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
    // ディーラーの呼び名：#dcall に席番号（.sn）と「〜さん／〜の方」が入っているか
    const call = scene.callCheck ? await page.evaluate(() => { const d = $('dcall'); if (!d) return null; const sn = d.querySelector('.sn');
      return { go: d.classList.contains('go'), sn: sn ? sn.textContent : '', text: (d.textContent || '').trim().slice(0, 40), name: /(さん|の方)、/.test(d.textContent || '') } }) : null;
    // クセの読める範囲：印（.rsOnly）が出ていて 12px 以上、画面の外へ出ず、クセの札が顔・札・吹き出し・名札に重ならないか。師匠のひとことが1回出て、セーブに残るか
    // 改善提案 第11回 0-2：師匠のひとことは、はじめての人の案内（tipK）や帯の待ち（#sensei.mwait）の間は出ずに待つ（ゲームの仕様）。
    // 1回だけ測ると案内が出ている回だけ落ちるので、印の台詞が S.jinNote に入ってセーブに残るまで最大4秒待つ（100ms ごと）
    if (scene.rsCheck) await page.waitForFunction(() => { try { const sv = JSON.parse(localStorage.getItem('shisho-readscope') || 'null');
      return !!(S.jinNote && /後ろにまだ人がいる|このあとに動く人|still behind|players who act after/.test(S.jinNote.t || '') && sv && sv.seen) } catch (e) { return false } }, null, { timeout: 4000, polling: 100 }).catch(() => {});
    const rs = scene.rsCheck ? await page.evaluate(() => { const cs = [...document.querySelectorAll('#plates .cue')].filter(e => { const q = e.querySelector('.rsOnly'); return e.offsetParent && q && !q.hidden }); if (!cs.length) return { has: false };
      // v94 レビュー 3：見えている印の付いた札すべてを測る。本人の顔は目の帯（faceBox の上から 35〜55%）だけ数える
      const g = ($('game') || document.body).getBoundingClientRect(), over = []; let out = 0, fs = 99, text = '';
      cs.forEach(c => { const t = c.querySelector('.rsOnly'), r = c.getBoundingClientRect(), i = +c.dataset.bust; text = text || t.textContent; fs = Math.min(fs, parseFloat(getComputedStyle(t).fontSize)); out = Math.max(out, Math.round(Math.max(0, g.left - r.left, r.right - g.right)));
      const hit = (q, nm) => { const w = Math.min(r.right, q.right) - Math.max(r.left, q.left), h = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top); if (w > 2 && h > 2) over.push(nm + ' ' + Math.round(w) + '×' + Math.round(h) + 'px') };
      const L = $('sayLayer'), lr = L && L.getBoundingClientRect(); if (lr && typeof faceBox === 'function') S.players.forEach((p, j) => { if (!j || p.out) return; const f = faceBox(j); if (!f) return; const h = f.b - f.t;
        if (j === i) hit({ left: lr.left + f.l, right: lr.left + f.r, top: lr.top + f.t + h * .35, bottom: lr.top + f.t + h * .55 }, '本人の目 席' + (j + 1)); else hit({ left: lr.left + f.l, right: lr.left + f.r, top: lr.top + f.t, bottom: lr.top + f.b }, '顔 席' + (j + 1)) });
      document.querySelectorAll('#boardCards .card:not(.slot), #mine .card, #sayLayer .say.go, #plates .say.go, #plates .plate').forEach(e => { if (!e.offsetParent || (e.classList.contains('say') && !(e.textContent || '').trim())) return; const q = e.getBoundingClientRect(); if (q.width > 2) hit(q, e.id ? '#' + e.id : e.classList.contains('card') ? '札' : e.classList.contains('say') ? '吹き出し' : '名札') }) });
      const sv = (() => { try { return JSON.parse(localStorage.getItem('shisho-readscope') || 'null') } catch (e) { return null } })();
      return { has: true, n: cs.length, text, fs, out, over, vf: (() => { const v = $('vfLog'), se = $('sensei'); return { log: !!(v && v.children.length), on: !!(v && !v.hidden && !v.classList.contains('off')), se: !!(se && !se.hidden) } })(), line: !!(S.jinNote && /後ろにまだ人がいる|このあとに動く人|still behind|players who act after/.test(S.jinNote.t || '')), shown: /後ろにまだ人がいる|このあとに動く人|still behind|players who act after/.test(($('senseiText') || {}).textContent || '') && !!$('sensei') && !$('sensei').hidden && !$('sensei').classList.contains('mwait') && !(typeof tipK !== 'undefined' && tipK), seen: !!(sv && sv.seen), tip: typeof tipK !== 'undefined' && tipK ? String(tipK) : '', mwait: !!($('sensei') && $('sensei').classList.contains('mwait')) } }) : null;
    const rects = await page.evaluate(RECTS);
    const shot = path.join(dir, `${scene.key}_${vp.key}.png`);
    await page.screenshot({ path: shot });
    // 止まった動き（v0.97.3 レビュー：WebKit で動きが途中で止まり、終わったら消す・見せる処理が走らなかった。ポットの山・札が重なったまま・透明の「あなたの負け」）
    // 撮った時に動いている終わりのある動きを覚え、残り時間＋1秒（最大2.5秒）たっても同じ所で止まっていたら、部品と動きの名前を出す
    // 座っている相手の名札が全員見えている（v0.97.2 レビュー：WebKit PC 第14章でカイの名札が消えていたのに検査を通っていた）
    const plates = await page.evaluate(() => { try { const tb = document.getElementById('table'); if (!tb || !tb.offsetParent || (document.getElementById('game') || {}).hidden) return null; const miss = []; (S.players || []).forEach((p, i) => { if (!i || !p || p.out) return; const e = document.getElementById('plate' + i); let op = 1;
      for (let x = e; x && x !== document.body; x = x.parentElement) op *= +getComputedStyle(x).opacity;
      const r = e && e.getBoundingClientRect(), ok = e && e.offsetParent && !e.hidden && getComputedStyle(e).visibility !== 'hidden' && r.width > 2 && r.height > 2 && op > .05 && r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight;
      if (!ok) miss.push((p.name || '席' + (i + 1)) + (!e ? '（名札なし）' : !e.offsetParent || e.hidden || getComputedStyle(e).visibility === 'hidden' ? '（表示なし）' : op <= .05 ? '（透明）' : r.width <= 2 ? '（大きさ0）' : '（画面の外）')) }); return miss } catch (e) { return { err: String(e.message || e).slice(0, 80) } } }).catch(e => ({ err: String(e.message || e).slice(0, 80) }));   // 検査の失敗は ❌ にする（null は場面が対象外のときだけ。CodeRabbit PR #116）
    const stallRem = await page.evaluate(() => { try { window.__qaSt = document.getAnimations().filter(a => { const t = a.effect && a.effect.getComputedTiming(); return a.playState === 'running' && t && isFinite(t.endTime) }).map(a => { const t = a.effect.getComputedTiming(); return { a, ct: a.currentTime, rem: t.endTime - (t.localTime || 0) } }); window.__qaSt0 = performance.now(); return Math.max(0, ...window.__qaSt.map(x => { const t = x.a.effect.getComputedTiming(); return t.endTime - (t.localTime || 0) })) } catch (e) { return 'err:' + String(e.message || e).slice(0, 80) } }).catch(e => 'err:' + String(e.message || e).slice(0, 80));
    let stall = typeof stallRem === 'string' ? { err: stallRem.slice(4) } : null;
    if (typeof stallRem === 'number') { await page.waitForTimeout(Math.min(2500, stallRem + 1000));
      stall = await page.evaluate(() => { const out = []; const waited = performance.now() - window.__qaSt0; for (const x of window.__qaSt || []) { const a = x.a, el = a.effect && a.effect.target; if (a.playState !== 'running' || a.currentTime !== x.ct || !el || !el.isConnected || x.rem + 700 > waited) continue;   // ゲームの見張り（LT.sweep）が終わらせるまでの時間（残り＋300ms＋見る間隔）をすぎたものだけ
        const nm = typeof CSSTransition !== 'undefined' && a instanceof CSSTransition ? 'transition:' + a.transitionProperty : a.animationName || a.id || '動き（script）',   // CSS の transition は script の動きと分ける（v0.97.3 CI：#cam・.pupils の transition が「script」と出た）
        who = el.id ? '#' + el.id : (el.tagName.toLowerCase() + (el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : ''));
        const s = nm + '←' + who; if (!out.includes(s)) out.push(s) } return out }).catch(e => ({ err: String(e.message || e).slice(0, 80) })) }
    // 撮ったあとでもう一度、見せた札の角を測る（v96.2 レビュー：測ったあとで名札が伸び、撮った画面では札が名札の下に入っていた）
    if (scene.handEnd) for (const x of await page.evaluate(INSPECT)) if (/^見せた札の角/.test(x.el || '') && !issues.some(y => y.el === x.el && y.by === x.by)) issues.push(x);
    // 再発防止（v0.97.0）：名札は撮ったあとにも伸びる（勝ち・役の名前・フォールド）。1秒たっても見せた札の角が隠れたままなら、人にもそう見えている。
    // 前は 60ms 待ってから置き直していて、撮る・測る間に重なったまま写った。置き直しが遅い・来ないものをここで拾う
    if (scene.handEnd) { await page.waitForTimeout(1000); for (const x of await page.evaluate(INSPECT)) if (/^見せた札の角/.test(x.el || '') && !issues.some(y => y.el === x.el && y.by === x.by)) issues.push(Object.assign({}, x, { el: x.el + '（1秒後も）' })) }
    // 改善提案 第11回 0-3：WebKit の PC で、勝ったのにポットが卓のまん中に残り「あなたの勝ち」（.vfres）が出なかった（v0.97.0）。
    // WebKit の .felt の中は getBoundingClientRect が描かれる場所とずれるので、場所でなく状態で見る（両ブラウザで同じ物差し）
    // 撮ってから1秒あとの状態も残す（撮った時の状態は hs0）
    const hs = scene.handEnd ? Object.assign(await readHs(), { hs0, waitMs, waitWhy }) : null;
    let innerParts = null; if (Array.isArray(face)) { innerParts = face; face = face.length }
    const lite = await page.evaluate(() => document.documentElement.classList.contains('ltLite')).catch(() => null);   // 動き「少なめ」で撮ったか（v89 レビュー）
    return { scene: scene.key, vp: vp.key, issues, shot, rects, face, innerParts, lite, call, rs, hs, stall, plates, errors: await page.evaluate(() => __qa.errors) };
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
  // 撮影は前と同じ「3つずつ」のまま（CIの高速化 案2 の pool は WebKit でブラウザが落ちる回が増えたように見えたので、ここだけ戻した。2026-10-17）
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
    const txt = x => `${x.kind}: ${x.el}${x.by ? ' ← ' + x.by : ''}${x.at ? '（' + x.at + '）' : ''}`;   // 隠した部品の場所と不透明度も出す（PR #111：写真では隠れていない札が「隠れ」と出て、何が隠したか分からなかった）
    const status = r.errors.length ? 'fail' : fresh.length ? (isNewScene(r.scene) ? 'warn' : 'fail') : old ? 'known' : 'ok';
    items.push({ id: `ui:${r.scene}:${r.vp}`, title: `画面 ${r.scene}（${r.vp}）`, status,
      detail: (r.errors.length ? 'エラー: ' + r.errors[0] + '。' : '') + (fresh.length && isNewScene(r.scene) ? '（新しく撮り始めた場面なので ⚠️。基準を書き直すと次から ❌）' : '') + (fresh.length ? '新しい問題: ' + fresh.slice(0, 4).map(txt).join('、') + (fresh.length > 4 ? ` ほか${fresh.length - 4}件` : '') : r.issues.length ? `前からある問題 ${old}件（${r.issues.slice(0, 2).map(txt).join('、')}）` : '重なり・はみ出し・隠れなし'),
      shot: r.shot ? path.relative(outDir, r.shot) : null, issues: r.issues, lite: r.lite });
  }
  // 基準は前の基準に足していく（配られる札で毎回出たり出なかったりする問題があるため）。消すときは baseline.json を手で直す
  // 会話の話し手が箱に隠れる割合（絵の高さの 25% を超えたら ⚠️。肩の先が少しかかるのは許す）
  for (const r of res) if (r.face != null && SCENES.find(s => s.key === r.scene).measure === 'inner') items.push({ id: `ui:${r.scene === 'フリー6人_人だかり' ? 'crowd' : r.scene === 'フリー6人_ディーラーの呼び名' ? 'dcallov' : 'inner'}:${r.vp}`, title: `${r.scene === 'フリー6人_人だかり' ? '人だかりの声' : r.scene === 'フリー6人_ディーラーの呼び名' ? 'ディーラーの呼び名の声' : '心の声の字幕'}がほかの部品に重ならない（${r.vp}）`, status: r.face === 0 ? 'ok' : 'warn',
    detail: r.face < 0 ? '字幕・声が出なかった' : `重なっている部品 ${r.face}個` + (r.innerParts && r.innerParts.length ? '：' + r.innerParts.join('、') : '（ボタン・手札・場札・名札・クセの札・ディーラーの声・ポットの額・D ボタン・席番号・吹き出し）') });
  for (const r of res) if (r.rs !== undefined && SCENES.find(s => s.key === r.scene).rsCheck) { const x = r.rs || { has: false };
    items.push({ id: `ui:readscope:${r.vp}`, title: `3人以上のクセの札に「〇〇だけ」の印（12px 以上・画面の中・師匠のひとこと1回）（${r.vp}）`, status: x.has && x.fs >= 12 && !x.out && x.line && x.shown && x.seen ? 'ok' : 'fail',
      detail: !x.has ? '印が出ていない' : `「${x.text}」${x.fs}px` + (x.out ? `・画面の外へ ${x.out}px` : '') + (x.line ? '' : '・師匠のひとことが出ていない') + (x.seen ? '' : '・セーブに残っていない') + (x.line && x.seen ? '' : `（4秒待った。案内 ${x.tip || 'なし'}・帯の待ち ${x.mwait ? 'あり' : 'なし'}）`) });
    // 直近の5手（#vfLog）が、師匠の帯が出ている横画面でも出ているか（v94.2 レビュー）
    if (/横/.test(r.vp) && x.vf && x.vf.log && x.vf.se) items.push({ id: `ui:vflog-sensei:${r.vp}`, title: `師匠の帯が出ていても直近の5手が出る（${r.vp}）`, status: x.vf.on ? 'ok' : 'warn', detail: x.vf.on ? '' : '#vfLog が .off（置ける所がない）' });
    items.push({ id: `ui:readscope-over:${r.vp}`, title: `印の付いたクセの札が顔・札・吹き出し・名札に重ならない（${r.vp}）`, status: x.over && x.over.some(o => /^(#say|吹き出し)/.test(o)) ? 'fail' : x.over && x.over.length ? 'warn' : 'ok', detail: x.over && x.over.length ? x.over.slice(0, 4).join('、') : '' }) }   // v94.3 レビュー：吹き出しが印にかかるのは ❌（吹き出しは手前の層で印が読めない）。顔・札・名札は ⚠
  // ハンドの終わりの状態（0-3）：自分が勝った回は「あなたの勝ち」が画面の中にある。ポットのチップと額は勝った人へ渡って卓のまん中に残らない
  for (const r of res) if (r.hs) { const x = r.hs.hs0 || r.hs, bad = [], wait = r.hs.waitMs || 0, why = r.hs.waitWhy ? `（待ったもの ${r.hs.waitWhy}）` : '';   // 撮った時の状態で決める
    if (x.err) bad.push('状態を読めなかった：' + x.err);
    else { if (x.iWon && !x.quiet && !x.vfOn && !x.vfOut) bad.push(x.vf ? `「あなたの勝ち」が画面の外（top ${x.vfTop}）` : '「あなたの勝ち」が出ていない' + (x.vfDone ? '（出す処理は通った）' : ''));   // 静かな場面（第7章の最後など。VF.quiet）は出さない仕様
      // 前のハンドの札が残っていないか（v0.97.0 PR #111：第14章で、負けたハンドに前のハンドの「あなたの勝ち」が残っていた）
      if (x.vfOn && !x.vfOut && (x.vfWin !== x.iWon || (x.vfH && x.vfH !== String(x.hand)))) bad.push(`前のハンドの「${x.vfText}」が残っている（このハンド ${x.hand}・札 ${x.vfH || '?'}・このハンドで勝った ${x.iWon}）`);
      // 自分が最後まで残った勝負は、勝っても負けても次のハンドまで出す仕様
      if (x.sd && x.inIt && !x.iWon && !x.quiet && !x.fb && !x.vfOn && !x.vfOut) bad.push('最後まで残って負けたのに「あなたの負け」が出ていない' + (x.vfDone ? '（出す処理は通った）' : ''));
      if (x.won > 0 && x.chips > 0) bad.push(`ポットのチップ ${x.chips}枚が卓のまん中に残っている`);
      if (x.won > 0 && x.sign) bad.push('ポットの額が出たまま');
      if (bad.length) bad.push(`［${x.dbg}］`) }
    items.push({ id: `ui:handend-state:${r.scene}:${r.vp}`, title: `ハンドの終わりにポットが勝った人へ渡り、勝ったら「あなたの勝ち」が出る（${r.scene}・${r.vp}）`, status: bad.length ? 'fail' : wait > 1500 ? 'warn' : 'ok',
      detail: (bad.length ? bad.join('・') + '（4秒待っても、そろわなかった）' + why : wait > 1500 ? `ポットが渡り終わるまで ${wait}ms 待った${why}（1.5秒より長い。Mac の Safari でももたついて見える見込み）［${x.dbg}］` : wait >= 200 ? `撮る前に ${wait}ms 待った` : '') + ((r.errors || []).length ? '。ページのエラー：' + r.errors.slice(0, 2).join(' / ').slice(0, 160) : '') }) }
  for (const r of res) if (r.plates) items.push({ id: `ui:plates:${r.scene}:${r.vp}`, title: `座っている相手の名札が全員見えている（${r.scene}・${r.vp}）`, status: r.plates.err || r.plates.length ? 'fail' : 'ok', detail: r.plates.err ? '測れなかった：' + r.plates.err : r.plates.length ? '見えない名札：' + r.plates.join('、') : '' });
  // 止まった動き：ゲームが時間で終わらせるはずの動き（script の動き＝LT.anim、CSS の vfIn・ltFlop/ltTurn/ltBack・ltDeal）が止まっていたら ❌、ほかの CSS の動きは ⚠️（v0.97.3）
  // v0.97.3 レビュー後：ゲームの見張り（LT.sweep）がすべての終わりのある動きを時間で終えるので、止まった動きは種類を問わず ❌（WebKit でも）
  const STALL_OWN = /./;
  for (const r of res) if (r.stall && r.stall.err) items.push({ id: `ui:stall:${r.scene}:${r.vp}`, title: `止まったままの動きがない（${r.scene}・${r.vp}）`, status: 'fail', detail: '測れなかった：' + r.stall.err });
  else if (r.stall) { const own = r.stall.filter(x => STALL_OWN.test(x)), other = r.stall.filter(x => !STALL_OWN.test(x));
    items.push({ id: `ui:stall:${r.scene}:${r.vp}`, title: `止まったままの動きがない（${r.scene}・${r.vp}）`, status: own.length ? 'fail' : other.length ? 'warn' : 'ok',
      detail: r.stall.length ? '1秒以上進まない動き：' + r.stall.slice(0, 5).join('、') + (r.stall.length > 5 ? ` ほか${r.stall.length - 5}` : '') + (own.length ? '（LT.sweep が時間で終えるはずの動き）' : '') : '' }) }
  // 見せた相手の札が見える（不透明度 0.9 以上・幅 8px 以上・動きが終わっている。高さは卓の奥行きで 22px ほどになる札もあるので見ない）（v0.97.3 レビュー：WebKit 6人卓の縦で、勝った相手の見せた札が透明・横向きのまま。状態で見るので WebKit でも ❌）
  for (const r of res) if (r.hs && !r.hs.err) { const x = r.hs; const bad = x.shownBad || [];
    items.push({ id: `ui:shown:${r.scene}:${r.vp}`, title: `見せた相手の札が見える（${r.scene}・${r.vp}）`, status: bad.length ? 'fail' : 'ok', detail: bad.length ? '見えない札：' + bad.slice(0, 4).join('、') + '（撮って1秒あと）' : '' }) }
  for (const r of res) if (r.call !== undefined && SCENES.find(s => s.key === r.scene).callCheck) items.push({ id: `ui:dcall:${r.vp}`, title: `ディーラーが呼び名と席番号で言う（${r.vp}）`,
    status: r.call && r.call.sn && r.call.name ? 'ok' : 'fail', detail: !r.call ? '#dcall が無い' : `「${r.call.text}」` + (r.call.sn ? '' : '・席番号なし') + (r.call.name ? '' : '・呼び名なし') });
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
  // 画質（2026-10-19 satou「画質が悪いように見える」「同様の問題が二度と起こらないように」）：上の撮影は 1 倍の画面なので、
  // 高精細の画面（スマホ3倍・PC2倍）でだけ出るぼやけをここで測る（checks/sharp.js）
  //   測っている途中でブラウザが落ちたときだけ、新しいブラウザで1回やり直す（ふつうの ❌ はやり直さない。CodeRabbit PR #109）
  try { let b3 = browser.isConnected() ? browser : (own = await H.launch()); let r = await require('./sharp').run({ browser: b3, file, dir });
    if (!b3.isConnected() && r.items.some(i => i.status === 'fail')) { if (own) await own.close().catch(() => {}); b3 = own = await H.launch(); r = await require('./sharp').run({ browser: b3, file, dir }); r.items.forEach(i => { i.detail = `（ブラウザが落ちたので1回やり直した）${i.detail || ''}` }) }
    items.push(...r.items) }
  catch (e) { items.push({ id: 'sharp:error', title: '画質（高精細の画面でくっきりしているか）の検査', status: 'fail', detail: String(e && e.message || e).slice(0, 200) }) }
  finally { if (own) await own.close().catch(() => {}) }
  return { name: '画面チェック', items, baselineOut: { uiIssues: [...new Set([...known].filter(k => k.split('|').length === 3).concat(all))], uiScenes: SCENES.map(s => s.key) } };
}
module.exports = { run, VIEWPORTS, SCENES };
