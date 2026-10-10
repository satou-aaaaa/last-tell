// 使いやすさ（UI/UX）の数字：押しやすさ・文字の読みやすさ・1画面に収まるか・大事な部品が最初の画面にあるか・ごちゃごちゃ度
// 2026-10-10 satou「UI/UXのレビューも都度やるように」。手順は qa/UIUXレビューの手順.md
// ui.js（重なり・はみ出し・隠れ）と同じ場面・同じ画面の大きさで測る。前の版より悪くなったら ⚠️
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('../lib/harness');
const { VIEWPORTS, SCENES } = require('./ui');

// ページの中で測る
const MEASURE = `(() => {
  const W = innerWidth, Hh = innerHeight, mobile = W < 900 || Hh < 500;
  const shown = el => { for (let e = el; e && e !== document.documentElement; e = e.parentElement) { if (e.hidden) return false; const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity < .05) return false } return true };
  const box = el => el.getBoundingClientRect();
  const vis = el => { if (!el || !shown(el)) return false; const r = box(el); return r.width > 2 && r.height > 2 };
  const desc = el => el.id ? '#' + el.id : el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\\s+/)[0] : '');
  const inView = el => { const r = box(el); return r.top >= -2 && r.left >= -2 && r.bottom <= Hh + 2 && r.right <= W + 2 };
  // 窓が開いていれば、その中だけを見る（ui.js と同じ）
  const modal = [...document.querySelectorAll('#vs, #setPanel, #runBox, #quiz, #help, #daily, #share, #moreDlg, #stackZoom, #tour, [role=dialog]')]
    .filter(vis).filter(e => { const r = box(e); return r.width * r.height > 0.5 * W * Hh })[0];
  const scope = modal || document;
  const btns = [...scope.querySelectorAll('button, [role=button], select, input:not([type=hidden])')].filter(vis).filter(e => !e.closest('#log, .log'));
  const m = {};
  // 1. 1画面に収まるか（ページの高さ ÷ 画面の高さ）
  m.screens = Math.round(document.scrollingElement.scrollHeight / Hh * 100) / 100;
  // 2. 押しやすい大きさ：スマホは 44px、PC は 24px（WCAG 2.5.8）より小さいもの
  const minT = mobile ? 44 : 24;
  const small = btns.filter(e => { const r = box(e); return Math.min(r.width, r.height) < minT - .5 });
  m.smallTargets = small.length; m.smallList = small.slice(0, 6).map(e => { const r = box(e); return desc(e) + ' ' + Math.round(r.width) + '×' + Math.round(r.height) });
  // 3. 押せる部品の数（ごちゃごちゃ度）。画面の中に見えているものだけ
  m.buttons = btns.filter(inView).length;
  // 4. 文字だけで中身が分からないボタン（記号だけで aria-label も title も無い）
  const unl = btns.filter(e => e.tagName === 'BUTTON' && !/[\\p{L}\\p{N}]/u.test(e.textContent) && !e.getAttribute('aria-label') && !e.title);
  m.unlabeled = unl.length; m.unlabeledList = unl.slice(0, 6).map(e => desc(e) + '「' + e.textContent.trim().slice(0, 4) + '」');
  // 5・6. 文字の大きさと、背景との明るさの差（コントラスト）
  const lum = c => { const v = c.slice(0, 3).map(x => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4) }); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2] };
  const rgba = s => { const a = (s.match(/[\\d.]+/g) || []).map(Number); return a.length >= 3 ? [a[0], a[1], a[2], a.length > 3 ? a[3] : 1] : null };
  const bgOf = el => { let acc = null; for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.backgroundImage && s.backgroundImage !== 'none') return null; const c = rgba(s.backgroundColor); if (c && c[3] > .5) return c } return [0, 0, 0, 1] };
  const tiny = [], low = []; let texts = 0;
  const walker = document.createTreeWalker(scope === document ? document.body : scope, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let n; (n = walker.nextNode());) {
    const el = n.parentElement; if (!el || seen.has(el) || !n.textContent.trim() || /^(SCRIPT|STYLE|SVG|TEXT)$/i.test(el.tagName) || el.closest('svg')) continue;
    seen.add(el);
    if (!vis(el) || !inView(el)) continue;
    const s = getComputedStyle(el), fs = parseFloat(s.fontSize), fg = rgba(s.color);
    texts++;
    if (fs < 12) tiny.push(desc(el) + '「' + n.textContent.trim().slice(0, 8) + '」' + fs + 'px');
    const bg = bgOf(el); if (!fg || !bg || fg[3] < .3) continue;
    const L1 = lum(fg), L2 = lum(bg), cr = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
    const big = fs >= 24 || (fs >= 18.6 && +s.fontWeight >= 700);
    if (cr < (big ? 3 : 4.5)) low.push(desc(el) + '「' + n.textContent.trim().slice(0, 8) + '」' + cr.toFixed(1));
  }
  m.texts = texts; m.tinyText = tiny.length; m.tinyList = tiny.slice(0, 6); m.lowContrast = low.length; m.lowList = low.slice(0, 6);
  // 7. 大事な部品が、スクロールせずに最初の画面にあるか
  const need = [];
  if (!document.getElementById('title').hidden) need.push('#btnStory', '#btnFree', '#btnMore');
  const ctl = document.getElementById('controls');
  if (ctl && vis(ctl) && !modal) need.push('#btnFold', '#btnCall', '#btnRaise', '#mine .card', '[id^=plate]:not(#plates)');
  if (document.getElementById('raisePanel') && vis(document.getElementById('raisePanel'))) need.push('[id^=plate]:not(#plates)');
  const miss = [];
  for (const sel of [...new Set(need)]) { const els = [...document.querySelectorAll(sel)].filter(vis); if (!els.length) continue; for (const e of els) if (!inView(e)) miss.push(desc(e)) }
  m.offFirstView = miss.length; m.offList = [...new Set(miss)].slice(0, 6);
  // 8. 同時に出ている吹き出し
  m.bubbles = [...document.querySelectorAll('.say')].filter(vis).length;
  return m;
})()`;

async function measure(browser, file, scene, vp) {
  const { ctx, page } = await H.openGame(browser, file, { viewport: vp.viewport, isMobile: vp.isMobile, hasTouch: vp.hasTouch, fast: 20, lite: true, lang: scene.lang || 'ja', seed: 1000 + SCENES.indexOf(scene),
    storage: scene.fresh ? null : H.UNLOCKED });
  try {
    await page.evaluate(scene.prep);
    const t0 = Date.now();
    if (scene.myTurn || scene.handEnd) {
      await H.startBot(page, { policy: 'call', maxHands: 99 });
      await page.evaluate(h => { const B = __bot, t = B.tick; B.tick = function () { if (h ? (S && S.players && S.handOver && S.handNo >= 1 && !document.getElementById('btnNext').hidden) : (S && S.players && !S.handOver && S.toAct === 0 && !document.getElementById('controls').hidden)) { B.done = true; return } t() }; clearInterval(B.timer); B.timer = setInterval(B.tick, 4) }, !!scene.handEnd);
      while (!(await page.evaluate(() => __bot.done)) && Date.now() - t0 < 60000) await page.waitForTimeout(150);
      await page.evaluate(() => clearInterval(__bot.timer));
    } else {
      while (!(await page.evaluate(scene.waitFor)) && Date.now() - t0 < 20000) await page.waitForTimeout(100);
    }
    if (scene.after) await page.evaluate(scene.after);
    await page.waitForTimeout(500);
    return { scene: scene.key, vp: vp.key, m: await page.evaluate(MEASURE) };
  } catch (e) {
    return { scene: scene.key, vp: vp.key, err: String(e.message).slice(0, 80) };
  } finally { await ctx.close() }
}

// 測る項目。worse = 前の版より悪いか、target = 目標を満たすか
const METRICS = [
  { key: 'offFirstView', title: '大事な部品（3つのボタン・自分の手・相手の名札・タイトルの3ボタン）が最初の画面にある', unit: '個が外', list: 'offList', target: v => v === 0 },
  { key: 'smallTargets', title: '押しやすい大きさ（スマホ44px・PC24px以上）', unit: '個が小さい', list: 'smallList', target: v => v === 0 },
  { key: 'tinyText', title: '文字の大きさ（12px以上）', unit: '個が小さい', list: 'tinyList', target: v => v === 0 },
  { key: 'lowContrast', title: '文字と背景の明るさの差（4.5:1以上、大きい字は3:1）', unit: '個が足りない', list: 'lowList', target: v => v === 0 },
  { key: 'unlabeled', title: '記号だけのボタンに名前（aria-label か title）がある', unit: '個に名前が無い', list: 'unlabeledList', target: v => v === 0 },
  { key: 'screens', title: '対戦中の画面が1画面に収まる（UI整理 案3の条件）', unit: '画面ぶんの高さ', game: true, target: v => v <= 1.01, max: true },
  { key: 'buttons', title: '最初の画面で押せる部品の数（ごちゃごちゃ度）', unit: '個', target: () => true, max: true },
  { key: 'bubbles', title: '吹き出しが同時に2つ以上出ていない', unit: '個', target: v => v <= 1, max: true },
];
const GAME = /自分の番|レイズを開く|ハンドの終わり/;

async function run({ browser, file, outDir, baseline, parallel = 3 }) {
  const jobs = []; for (const s of SCENES) for (const v of VIEWPORTS) jobs.push([s, v]);
  const res = [];
  for (let i = 0; i < jobs.length; i += parallel) res.push(...await Promise.all(jobs.slice(i, i + parallel).map(([s, v]) => measure(browser, file, s, v))));
  fs.writeFileSync(path.join(outDir, 'uiux.json'), JSON.stringify(res, null, 1));
  const base = (baseline && baseline.uiux) || {}, out = {}, items = [];
  for (const M of METRICS) {
    const rows = res.filter(r => r.m && (!M.game || GAME.test(r.scene)));
    const val = r => r.m[M.key];
    // 合計（max の項目は一番悪い値）を前の版と比べる
    const now = M.max ? Math.max(0, ...rows.map(val)) : rows.reduce((a, r) => a + val(r), 0);
    out[M.key] = now;
    const was = base[M.key];
    const bad = rows.filter(r => !M.target(val(r)));
    const worse = was !== undefined && now > was + (M.key === 'screens' ? .05 : M.key === 'buttons' ? 2 : M.max ? 0 : Math.max(2, Math.ceil(was * .05)));  // 配られる札で少し揺れるので、合計は5%か2個までは同じとみなす
    const status = worse ? 'warn' : bad.length ? 'known' : 'ok';
    const top = bad.sort((a, b) => val(b) - val(a)).slice(0, 3).map(r => `${r.scene}（${r.vp.split('_')[0]}）${val(r)}${M.unit}${M.list && r.m[M.list].length ? '：' + r.m[M.list].slice(0, 3).join('、') : ''}`);
    items.push({ id: 'uiux:' + M.key, title: M.title, status,
      detail: `${M.max ? '一番多い' : '合計'} ${now}${was !== undefined ? `（前の版 ${was}）` : ''}${worse ? '。前の版より悪くなった' : ''}${top.length ? '。' + top.join('／') : ''}` });
  }
  const errs = res.filter(r => r.err);
  if (errs.length) items.push({ id: 'uiux:err', title: '使いやすさを測れなかった場面', status: 'warn', detail: errs.map(r => `${r.scene}（${r.vp}）${r.err}`).slice(0, 4).join('、') });
  return { name: '使いやすさの数字（UI/UX）', items, baselineOut: { uiux: out } };
}
module.exports = { run, METRICS };
