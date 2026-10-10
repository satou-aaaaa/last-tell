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
  { key: 'フリー6人_レイズを開く', prep: `($('freeSize').value='6',startFree())`, myTurn: true, after: `$('btnRaise').click()` },
  { key: 'フリー6人_ハンドの終わり', prep: `($('freeSize').value='6',startFree())`, handEnd: true },
  { key: '設定', prep: `($('freeSize').value='6',startFree())`, myTurn: true, after: `$('btnSet').click()` },
  { key: '英語_フリー6人_自分の番', prep: `($('freeSize').value='6',startFree())`, myTurn: true, lang: 'en' },
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
      while (!(await page.evaluate(scene.waitFor)) && Date.now() - t0 < 20000) await page.waitForTimeout(100);
    }
    if (scene.after) { await page.evaluate(scene.after); }
    await page.waitForTimeout(900);
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
    const keys = r.issues.map(x => `${r.scene}|${r.vp}|${x.kind}|${bare(x.el)}`);
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
  return { name: '画面チェック', items, baselineOut: { uiIssues: [...new Set([...known].filter(k => k.split('|').length === 4).concat(all))] } };
}
module.exports = { run, VIEWPORTS, SCENES };
