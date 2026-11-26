// 第三部〜第七部（PC 版から写した部、2026-11-26）：各部の最終章が最後まで遊べるか。
//   最終章は決まった札の「最後の勝負」になり、主人公が降りて相手のクセを読めば勝つ（64_parts.js）。
//   台本の検査（script）の中で回す（CI の列を増やさない）。
'use strict';
const H = require('../lib/harness');

async function run({ browser, file }) {
  const storage = Object.assign({}, H.UNLOCKED, { 'shisho-part2': JSON.stringify({ v: 1, cleared: 5, mentor: 'plain' }) });
  [3, 4, 5, 6].forEach(k => storage['shisho-part' + k] = JSON.stringify({ v: 1, cleared: 5 }));
  const { ctx, page } = await H.openGame(browser, file, { storage });
  const bad = [], done = [];
  try {
    const ks = await page.evaluate(() => typeof PX_KS !== 'undefined' ? PX_KS.slice() : []);
    if (!ks.length) bad.push('第三部〜第七部の表（PX_KS）が無い');
    for (const k of ks) {
      const r = await page.evaluate(async k => {
        const w = ms => new Promise(r => setTimeout(r, ms));
        const c = PX(k)[PX(k).length - 1]; startChapter(c, true); await w(600);
        const vb = $('vs') && !$('vs').hidden && $('vs').querySelector('button'); if (vb) vb.click(); await w(300);
        S.kataAt = 1; let fin = 0; const t0 = Date.now();
        while (Date.now() - t0 < 30000) {
          await w(200); if (S.finalHand) fin = 1;
          if (S.result) break;
          if (S.handOver && !$('btnNext').hidden) $('btnNext').click();
          else if (!S.handOver && S.toAct === 0) { const b = S.released && S.street === 'river' ? $('btnFold') : $('btnCall'); if (b && !b.hidden && !b.disabled) { b.click(); if (b.id === 'btnFold' && !S.players[0].folded) b.click() } }
        }
        return { k, fin, res: S.result || '', read: !!S.finalRead, label: chLab(c) };
      }, k);
      if (!r.fin) bad.push(`第${k}部：最後の勝負にならない`);
      else if (r.res !== 'win' || !r.read) bad.push(`第${k}部：降りてクセを読んでも勝ちにならない（${r.res || '終わらない'}）`);
      else done.push(r.label);
    }
    const errs = page.__errs || []; if (errs.length) bad.push('エラー: ' + errs.slice(0, 2).join(' / '));
  } finally { await ctx.close() }
  return [{ id: 'parts:final', title: '第三部〜第七部の最終章が最後まで遊べる（最後の勝負で降りてクセを読めば勝つ）', status: bad.length ? 'fail' : 'ok', detail: bad.length ? bad.join('、') : done.join('・') + ' を確認' }];
}
module.exports = { run, noBrowser: false };
