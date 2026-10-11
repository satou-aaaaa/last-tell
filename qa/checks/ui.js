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
  { key: '第1章の会話', prep: `startChapter(CHAPTERS[0])`, waitFor: `!$('scene').hidden` },
  { key: '6人卓の相手紹介', prep: `startChapter(CHAPTERS[3],true)`, waitFor: `!$('vs').hidden` },
  { key: '第1章_自分の番', prep: `startChapter(CHAPTERS[0],true)`, myTurn: true },
  { key: 'フリー6人_自分の番', prep: `($('freeSize').value='6',startFree())`, myTurn: true },
  { key: '第5章_自分の番', prep: `startChapter(CHAPTERS[4],true)`, myTurn: true },
  { key: '第6章_自分の番', prep: `startChapter(CHAPTERS[5],true)`, myTurn: true },
  // 1対1（v65 クリエイター目線レビュー：スマホ横で相手の顔が目から上で切れていた）
  { key: '第7章_自分の番', prep: `startChapter(CHAPTERS[6],true)`, myTurn: true },
  { key: 'フリー6人_レイズを開く', prep: `($('freeSize').value='6',startFree())`, myTurn: true, after: `$('btnRaise').click()` },
  { key: 'フリー6人_ハンドの終わり', prep: `($('freeSize').value='6',startFree())`, handEnd: true },
  { key: '設定', prep: `($('freeSize').value='6',startFree())`, myTurn: true, after: `$('btnSet').click()` },
  { key: '英語_フリー6人_自分の番', prep: `($('freeSize').value='6',startFree())`, myTurn: true, lang: 'en' },
  // 主人公の画面と回想（クリエイター目線レビュー v62 の直し5）。waitFor は会話や相手紹介を先へ送りながら待つ
  { key: '名乗る', prep: `startChapter(CHAPTERS[0])`, fresh: true,
    waitFor: `(()=>{const a=$('askGo');if(a&&a.offsetParent)return true;if(!$('scene').hidden)advance();return false})()` },
  { key: '身なり', prep: `lookOpen()`, waitFor: `!$('lookDlg').hidden` },
  { key: '回想の判断', prep: `startFlashback(()=>{},'seki')`, settle: 2500,
    waitFor: `(()=>{if(!$('vs').hidden){$('vsGo').click();return false}return !!(S&&S.fbAsk&&S.toAct===0&&!S.handOver&&!$('controls').hidden)})()` },
  { key: '回想の結果', prep: `startFlashback(()=>{},'reika')`, settle: 2500,
    waitFor: `(()=>{if(!$('vs').hidden){$('vsGo').click();return false}return !!(S&&S.handOver&&S.result==='flash'&&!$('btnNext').hidden)})()` },
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
  const sel = 'button, #mine .card, #boardCards .card:not(.slot), #board2 .card:not(.slot), [id^=plate]:not(#plates)';
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
    const pts = [[.5, .5], [.25, .25], [.75, .25], [.25, .75], [.75, .75]].map(([a, b]) => [r.left + r.width * a, r.top + r.height * b]).filter(([x, y]) => x >= 0 && y >= 0 && x < W && y < Hh);
    let cov = 0, by = null;
    for (const [x, y] of pts) { const t = document.elementFromPoint(x, y); if (t && !el.contains(t) && !t.contains(el)) { cov++; by = by || t } }
    if (pts.length >= 3 && cov >= 3) {
      const b = by.closest('button,[role=dialog],.card,[id]') || by;
      out.push({ kind: '隠れ', el: desc(el), by: desc(b) });
    }
    // 文字が切れている（ボタン）
    if (el.tagName === 'BUTTON' && (el.scrollWidth > el.clientWidth + 3) && /hidden|clip/.test(getComputedStyle(el).overflow)) out.push({ kind: '文字切れ', el: desc(el) });
  }
  // ボタン同士の重なり
  const btn = imp.filter(e => e.tagName === 'BUTTON');
  for (let i = 0; i < btn.length; i++) for (let j = i + 1; j < btn.length; j++) {
    const a = btn[i].getBoundingClientRect(), b = btn[j].getBoundingClientRect();
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
  // 横スクロールが出ていないか
  if (document.scrollingElement.scrollWidth > W + 2) out.push({ kind: '横スクロール', el: 'ページ全体 ' + document.scrollingElement.scrollWidth + 'px' });
  return out;
})()`;

async function shoot(browser, file, scene, vp, dir) {
  const { ctx, page } = await H.openGame(browser, file, { viewport: vp.viewport, isMobile: vp.isMobile, hasTouch: vp.hasTouch, fast: 20, lite: false, lang: scene.lang || 'ja', seed: 1000 + SCENES.indexOf(scene),
    storage: scene.fresh ? null : H.UNLOCKED });
  try {
    await page.evaluate(scene.prep);
    const t0 = Date.now();
    if (scene.myTurn || scene.handEnd) {
      await H.startBot(page, { policy: 'call', maxHands: 99 });
      // 自分の番（またはハンドの終わり）が来たら止める
      await page.evaluate(h => { const B = __bot, t = B.tick; B.tick = function () { if (h ? (S && S.players && S.handOver && S.handNo >= 1 && !document.getElementById('btnNext').hidden) : (S && S.players && !S.handOver && S.toAct === 0 && !document.getElementById('controls').hidden)) { B.done = true; return } t() }; clearInterval(B.timer); B.timer = setInterval(B.tick, 4) }, !!scene.handEnd);
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
    const issues = await page.evaluate(INSPECT);
    const shot = path.join(dir, `${scene.key}_${vp.key}.png`);
    await page.screenshot({ path: shot });
    return { scene: scene.key, vp: vp.key, issues, shot, errors: await page.evaluate(() => __qa.errors) };
  } catch (e) {
    return { scene: scene.key, vp: vp.key, issues: [{ kind: '撮れなかった', el: String(e.message).slice(0, 80) }], shot: null, errors: [] };
  } finally { await ctx.close() }
}

async function run({ browser, file, outDir, baseline, parallel = 3 }) {
  const dir = path.join(outDir, 'ui'); fs.mkdirSync(dir, { recursive: true });
  const jobs = []; for (const s of SCENES) for (const v of VIEWPORTS) jobs.push([s, v]);
  const res = [];
  for (let i = 0; i < jobs.length; i += parallel) res.push(...await Promise.all(jobs.slice(i, i + parallel).map(([s, v]) => shoot(browser, file, s, v, dir))));
  const known = new Set((baseline && baseline.uiIssues) || []), all = [], items = [];
  for (const r of res) {
    // 基準と比べる鍵は、部品の名前だけにする（「」の中の文字や数字はチップの額などで毎回変わるため）
    const bare = d => String(d || '').replace(/「.*$/, '').replace(/\d+/g, '');
    // 何に隠れたか（by）も、配られた札やチップの額で変わるので鍵に入れない
    // 画面の大きさも鍵に入れない（同じ問題が、環境の字の幅しだいで縦かPCのどちらかに出るため）
    const keys = r.issues.map(x => `${r.scene}|${x.kind}|${bare(x.el)}`);
    all.push(...keys);
    const fresh = r.issues.filter((x, i) => !known.has(keys[i]));
    const old = r.issues.length - fresh.length;
    const txt = x => `${x.kind}: ${x.el}${x.by ? ' ← ' + x.by : ''}`;
    const status = r.errors.length ? 'fail' : fresh.length ? 'fail' : old ? 'known' : 'ok';
    items.push({ id: `ui:${r.scene}:${r.vp}`, title: `画面 ${r.scene}（${r.vp}）`, status,
      detail: (r.errors.length ? 'エラー: ' + r.errors[0] + '。' : '') + (fresh.length ? '新しい問題: ' + fresh.slice(0, 4).map(txt).join('、') + (fresh.length > 4 ? ` ほか${fresh.length - 4}件` : '') : r.issues.length ? `前からある問題 ${old}件（${r.issues.slice(0, 2).map(txt).join('、')}）` : '重なり・はみ出し・隠れなし'),
      shot: r.shot ? path.relative(outDir, r.shot) : null, issues: r.issues });
  }
  // 基準は前の基準に足していく（配られる札で毎回出たり出なかったりする問題があるため）。消すときは baseline.json を手で直す
  return { name: '画面チェック', items, baselineOut: { uiIssues: [...new Set([...known].filter(k => k.split('|').length === 3).concat(all))] } };
}
module.exports = { run, VIEWPORTS, SCENES };
