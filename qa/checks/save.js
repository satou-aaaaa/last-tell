// セーブの引き継ぎ：前の版で遊んだセーブを、新しい版で開いても残るか（レビューの仕組み 案1、2026-10-10）
//   前の版は dev/snapshots/vNN.tar.gz から組み立てる。控えが無い所（GitHub の自動実行）では飛ばす
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const H = require('../lib/harness');

const SNAP = path.join(__dirname, '../../dev/snapshots');
const minor = v => +(String(v).split('.')[1] || 0);

// 控え vNN.tar.gz を展開して1枚の HTML にする（dev/tools/build.py と同じつなぎ方）
function buildSnapshot(n) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `lt-v${n}-`));
  execFileSync('tar', ['xzf', path.join(SNAP, `v${n}.tar.gz`), '-C', dir]);
  const src = path.join(dir, 'src'), order = JSON.parse(fs.readFileSync(path.join(src, 'order.json'), 'utf8'));
  const out = path.join(dir, `v${n}.html`);
  fs.writeFileSync(out, order.map(f => fs.readFileSync(path.join(src, f), 'utf8')).join('\n'));
  return out;
}

const dump = () => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^shisho-/.test(k)) o[k] = localStorage.getItem(k) } return o };

// 第1章を最後まで打ち、フリー6人も少し打つ。できたセーブを返す
async function playAndDump(browser, file, storage) {
  const { ctx, page } = await H.openGame(browser, file, { fast: 60, storage });
  try {
    await page.evaluate('startChapter(CHAPTERS[0],true)');
    await H.startBot(page, { policy: 'cpu', maxHands: 80 });
    const r1 = await H.runUntilDone(page, { timeoutMs: 180000, stallMs: 20000 });
    const ch1 = await page.evaluate(() => __bot.result);
    await page.evaluate(() => { __bot.done = false; __bot.maxHands = 9999 }); // 章のあとの画面を押し進める
    await page.waitForTimeout(3000);
    await page.evaluate(() => { try { show('title') } catch (e) {} ($('freeSize').value = '6', startFree()) });
    await page.evaluate(() => { __bot.restart(); __bot.maxHands = __bot.hands + 5 });
    await H.runUntilDone(page, { timeoutMs: 90000, stallMs: 20000 });
    return { storage: await page.evaluate(dump), ch1, stall: r1.status !== 'done', errors: [...new Set([...(await page.evaluate(() => __qa.errors)), ...(page.__errs || [])])] };
  } finally { await ctx.close() }
}

// 新しい版で開いて、残っているか・続けて遊べるか・引き継ぎコードが往復するか
async function openInNew(browser, file, old) {
  const { ctx, page } = await H.openGame(browser, file, { fast: 60, storage: old });
  try {
    const out = { lost: [], broken: [], errors: [] };
    const now = await page.evaluate(dump);
    for (const k in old) { if (!(k in now)) out.lost.push(k); else { try { JSON.parse(now[k]) } catch (e) { out.broken.push(k) } } }
    const oc = +(JSON.parse(old['shisho-progress'] || '{}').cleared || 0);
    out.clearedOld = oc; out.clearedNew = await page.evaluate(() => loadCleared());
    // 章の一覧を開き、次の章を3ハンド打つ
    await page.evaluate(() => { try { show('chapters') } catch (e) { __qa.errors.push('章の一覧: ' + e.message) } });
    await page.waitForTimeout(300);
    const next = Math.min(oc, 6);
    await page.evaluate(n => { show('title'); startChapter(CHAPTERS[n], true) }, next);
    await H.startBot(page, { policy: 'mix', maxHands: 3 });
    const r = await H.runUntilDone(page, { timeoutMs: 90000, stallMs: 20000 });
    out.nextChapter = `第${next + 1}章 ${r.status === 'done' ? '打てた' : '止まった'}`;
    out.nextOk = r.status === 'done';
    // 引き継ぎコード：作る → 読む → 中身が同じ
    out.code = await page.evaluate(async () => {
      try {
        const o = saveCollect(), c = await codeMake(o), back = await codeRead(c);
        if (!back || back.err) return 'コードを読み戻せない（' + (back && back.err) + '）';
        const b = back.o;
        if (saveCheck(b)) return '読み戻したセーブが「' + saveCheck(b) + '」と判定された';
        return JSON.stringify(b.data) === JSON.stringify(o.data) ? '' : '読み戻した中身が違う';
      } catch (e) { return 'エラー: ' + e.message }
    });
    out.errors = [...new Set([...(await page.evaluate(() => __qa.errors)), ...(page.__errs || [])])];
    out.saveKeys = await page.evaluate(() => SAVE_KEYS);
    out.after = await page.evaluate(dump);
    return out;
  } finally { await ctx.close() }
}

async function run({ browser, file, quick }) {
  const items = [];
  const src = fs.readFileSync(file, 'utf8'), ver = (src.match(/APP_VERSION='([^']+)'/) || [])[1] || '0.0.0';
  // 1. 新しい版で遊んで、保存される鍵が全部 SAVE_KEYS（引き継ぎ・セーブを消す の対象）に入っているか
  const fresh = await playAndDump(browser, file, null);
  const keys = await (async () => { const { ctx, page } = await H.openGame(browser, file); try { return await page.evaluate(() => SAVE_KEYS) } finally { await ctx.close() } })();
  const missing = Object.keys(fresh.storage).filter(k => !keys.includes(k));
  items.push({ id: 'save:keys', title: '保存される鍵が全部、引き継ぎコードと「セーブを消す」に入っている（SAVE_KEYS）', status: missing.length ? 'fail' : 'ok',
    detail: missing.length ? `入っていない鍵: ${missing.join('、')}` : `遊んで出来た鍵 ${Object.keys(fresh.storage).length}個、SAVE_KEYS ${keys.length}個` });
  if (fresh.errors.length) items.push({ id: 'save:play-errors', title: 'セーブを作るために遊んだときのエラー', status: 'fail', detail: fresh.errors.slice(0, 3).join(' / ') });

  // 2. 前の版のセーブ
  const snaps = fs.existsSync(SNAP) ? fs.readdirSync(SNAP).map(f => (/^v(\d+)\.tar\.gz$/.exec(f) || [])[1]).filter(Boolean).map(Number).filter(n => n < minor(ver)).sort((a, b) => b - a) : [];
  if (!snaps.length) {
    items.push({ id: 'save:carry', title: '前の版のセーブを新しい版で開ける', status: 'warn', detail: '前の版の控え（dev/snapshots/）が無いので飛ばした' });
    return { name: 'セーブの引き継ぎ', items };
  }
  for (const n of quick ? snaps.slice(0, 1) : snaps) {
    let bad = [], detail = '';
    try {
      const old = await playAndDump(browser, buildSnapshot(n), null);
      const r = await openInNew(browser, file, old.storage);
      if (r.lost.length) bad.push(`消えた鍵: ${r.lost.join('、')}`);
      if (r.broken.length) bad.push(`読めなくなった鍵: ${r.broken.join('、')}`);
      if (r.clearedNew < r.clearedOld) bad.push(`章の進み ${r.clearedOld} → ${r.clearedNew}`);
      if (!r.nextOk) bad.push(r.nextChapter);
      if (r.code) bad.push('引き継ぎコード: ' + r.code);
      if (r.errors.length) bad.push('エラー: ' + r.errors.slice(0, 3).join(' / '));
      detail = `v${n} で第1章${old.ch1 === 'win' ? 'をクリアした' : 'を打った'}セーブ（鍵 ${Object.keys(old.storage).length}個、第${r.clearedOld}章まで）→ ${ver} で開いて、進み 第${r.clearedNew}章まで、${r.nextChapter}、引き継ぎコードの往復 ${r.code ? '✕' : 'OK'}`;
    } catch (e) { bad.push('検査が失敗: ' + String(e.message).slice(0, 200)) }
    items.push({ id: `save:carry-v${n}`, title: `v${n} のセーブを新しい版で開ける（消えない・進みが戻らない・続けて遊べる）`, status: bad.length ? 'fail' : 'ok', detail: bad.length ? bad.join('。') : detail });
  }
  return { name: 'セーブの引き継ぎ', items };
}
module.exports = { run, buildSnapshot };
