#!/usr/bin/env node
// CI（GitHub）で撮った画面を、Claude と人が少ない手間で見られる形にする（2026-10-14 検証をCIに寄せる）
//   node qa/tools/ci_shots.js <結果のフォルダ> [前の版の ui フォルダ]
// - ui/*.png を小さい JPEG にする（結果のブランチ qa-results に置くため）
// - 画面ごとの一覧 ui/_一覧_縦.jpg・_一覧_横.jpg・_一覧_PC.jpg（12場面を1枚に。まず これを見る）
// - 前の版と比べて、見た目が変わった場面を ui/changes.json に（変わった割合）と、ui/_比べ_<場面>.jpg（前｜今｜違う所）。目で見るのは変わった場面だけでよい
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const out = path.resolve(process.argv[2] || 'qa-report');
const prevDir = process.argv[3] ? path.resolve(process.argv[3]) : null;
const ui = path.join(out, 'ui');
if (!fs.existsSync(ui)) { console.log('ui/ が無いので何もしない'); process.exit(0) }
const pngs = fs.readdirSync(ui).filter(f => f.endsWith('.png')).sort();
const VPS = [['縦', '縦_390x844'], ['横', '横_844x390'], ['PC', 'PC_1280x800']];
// WebKit の組は名前に WebKit_ を付ける（Chromium の画面と混ざらないように）。前の版とは比べない
const WK = process.env.QA_BROWSER === 'webkit' ? 'WebKit_' : '';
const dataUrl = f => 'data:image/' + (f.endsWith('.png') ? 'png' : 'jpeg') + ';base64,' + fs.readFileSync(f).toString('base64');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  // 1. JPEG にする（大きさはそのまま、質 72）
  for (const f of pngs) {
    await page.setContent(`<style>body{margin:0}</style><img id=i src="${dataUrl(path.join(ui, f))}">`);
    const box = await page.$eval('#i', i => ({ w: i.naturalWidth, h: i.naturalHeight }));
    await page.setViewportSize({ width: box.w, height: box.h });
    await page.screenshot({ path: path.join(ui, WK + f.replace(/\.png$/, '.jpg')), type: 'jpeg', quality: 72 });
  }
  // 2. 前の版と比べる（縮めてから、色の差が大きい点の割合）
  const changes = {};
  if (!WK && prevDir && fs.existsSync(prevDir)) {
    for (const f of pngs) {
      const name = f.replace(/\.png$/, '.jpg'), old = path.join(prevDir, name);
      if (!fs.existsSync(old)) { changes[name] = { status: 'new' }; continue }
      const ratio = await page.evaluate(async ([a, b]) => {
        const load = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = s });
        const [ia, ib] = await Promise.all([load(a), load(b)]);
        const W = 240, H = Math.round(W * ia.naturalHeight / ia.naturalWidth);
        const px = i => { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.drawImage(i, 0, 0, W, H); return x.getImageData(0, 0, W, H).data };
        const pa = px(ia), pb = px(ib); let diff = 0;
        for (let k = 0; k < pa.length; k += 4) if (Math.abs(pa[k] - pb[k]) + Math.abs(pa[k + 1] - pb[k + 1]) + Math.abs(pa[k + 2] - pb[k + 2]) > 60) diff++;
        return diff / (W * H);
      }, [dataUrl(path.join(ui, f)), dataUrl(old)]);
      changes[name] = { status: ratio > 0.03 ? 'changed' : 'same', ratio: Math.round(ratio * 1000) / 10 };
      // 変わった画面は「前｜今｜違う所（赤）」を1枚に（CIのチェック充実 案2）。Claude はこの1枚だけ見ればよい
      if (ratio > 0.03) {
        const url = await page.evaluate(async ([a, b]) => {
          const load = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = s });
          const [now, old] = await Promise.all([load(a), load(b)]);
          const w = now.naturalWidth, h = now.naturalHeight, k = Math.min(1, 520 / w), W = Math.round(w * k), Hh = Math.round(h * k), gap = 8, top = 22;
          const c = document.createElement('canvas'); c.width = W * 3 + gap * 2; c.height = Hh + top; const x = c.getContext('2d');
          x.fillStyle = '#222'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#eee'; x.font = '14px sans-serif';
          x.fillText('前の版', 4, 16); x.fillText('今', W + gap + 4, 16); x.fillText('違う所（赤）', 2 * (W + gap) + 4, 16);
          x.drawImage(old, 0, top, W, Hh); x.drawImage(now, W + gap, top, W, Hh);
          const t = document.createElement('canvas'); t.width = W; t.height = Hh; const tx = t.getContext('2d');
          tx.drawImage(old, 0, 0, W, Hh); const po = tx.getImageData(0, 0, W, Hh).data; tx.drawImage(now, 0, 0, W, Hh); const im = tx.getImageData(0, 0, W, Hh), pn = im.data;
          for (let i = 0; i < pn.length; i += 4) {
            const d = Math.abs(pn[i] - po[i]) + Math.abs(pn[i + 1] - po[i + 1]) + Math.abs(pn[i + 2] - po[i + 2]) > 90;   // JPEG のにじみは拾わない
            if (d) { pn[i] = 255; pn[i + 1] = 40; pn[i + 2] = 40 } else { pn[i] *= .35; pn[i + 1] *= .35; pn[i + 2] *= .35 }
          }
          tx.putImageData(im, 0, 0); x.drawImage(t, 2 * (W + gap), top);
          return c.toDataURL('image/jpeg', .72);
        }, [dataUrl(path.join(ui, f)), dataUrl(old)]);
        fs.writeFileSync(path.join(ui, '_比べ_' + name), Buffer.from(url.split(',')[1], 'base64'));
      }
    }
    fs.writeFileSync(path.join(ui, 'changes.json'), JSON.stringify(changes, null, 1));
  }
  // 3. 画面の大きさごとの一覧（1枚に12場面）
  for (const [label, key] of VPS) {
    const fs_ = pngs.filter(f => f.endsWith(`_${key}.png`));
    if (!fs_.length) continue;
    const cols = label === '縦' ? 6 : label === '横' ? 3 : 4, w = label === '縦' ? 260 : label === '横' ? 420 : 400;
    const cells = fs_.map(f => {
      const c = changes[f.replace(/\.png$/, '.jpg')], mark = !c ? '' : c.status === 'new' ? ' 🆕' : c.status === 'changed' ? ` ●変化 ${c.ratio}%` : '';
      return `<figure><img src="${dataUrl(path.join(ui, f))}"><figcaption>${f.replace(`_${key}.png`, '')}<b>${mark}</b></figcaption></figure>`;
    }).join('');
    await page.setViewportSize({ width: cols * (w + 8) + 8, height: 600 });
    await page.setContent(`<style>body{margin:0;padding:4px;background:#222;font:13px sans-serif;color:#eee;display:grid;grid-template-columns:repeat(${cols},${w}px);gap:8px}figure{margin:0}img{width:100%;display:block}b{color:#fc6}</style>${cells}`);
    await page.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => i.onload = r))));
    await page.screenshot({ path: path.join(ui, `_一覧_${WK}${label}.jpg`), type: 'jpeg', quality: 70, fullPage: true });
  }
  await browser.close();
  const ch = Object.entries(changes).filter(([, c]) => c.status !== 'same');
  console.log(`JPEG ${pngs.length}枚、一覧 ${VPS.length}枚。前の版から変わった画面 ${prevDir ? ch.length : '（比べる前の版なし）'}`);
})().catch(e => { console.error(e); process.exit(1) });
