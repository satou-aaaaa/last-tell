// 自動対戦：全モードで止まらないか、エラーが出ないか、チップの合計が合うか
'use strict';
const H = require('../lib/harness');

function modes(quick) {
  const m = [];
  for (let i = 1; i <= 7; i++) m.push({ id: `第${i}章`, start: `startChapter(CHAPTERS[${i - 1}],true)` });
  for (let i = 1; i <= 5; i++) m.push({ id: `第${10 + i}章（第二部）`, start: `startP2(PART2[${i - 1}],true)`, storage: H.UNLOCKED });
  m.push({ id: 'フリー4人', start: `($('freeSize').value='4',startFree())` });
  m.push({ id: 'フリー6人', start: `($('freeSize').value='6',startFree())` });
  for (const r of ['straddle', 'bomb', 'seven2', 'twice']) m.push({ id: `フリー6人・${r}`, start: `($('freeSize').value='6',$('freeRule').value='${r}',startFree())` });
  m.push({ id: 'フリー6人・マナーの悪い客', start: `($('freeSize').value='6',$('freeRude').checked=true,startFree())` });
  for (const i of [1, 4, 6]) m.push({ id: `店で遊ぶ（第${i}章の店）`, start: `startStore(CHAPTERS[${i - 1}],true)` });
  for (const i of [1, 6, 7]) m.push({ id: `裏の卓（第${i}章）`, start: `startUra(${i})` });
  m.push({ id: 'はしご', start: `startRun()` });
  // 英語版
  for (const x of [['第1章', 'startChapter(CHAPTERS[0],true)'], ['第6章', 'startChapter(CHAPTERS[5],true)'], ['第7章', 'startChapter(CHAPTERS[6],true)'], ['フリー6人', `($('freeSize').value='6',startFree())`], ['第11章', 'startP2(PART2[0],true)']])
    m.push({ id: `英語・${x[0]}`, start: x[1], lang: 'en', storage: H.UNLOCKED });
  return quick ? m.filter((x, i) => i % 2 === 0 || /英語/.test(x.id)) : m;
}

// 英語のとき、画面に残っている日本語を集める
const JP_SCAN = `(() => { const out = new Set(); const re = /[\\u3040-\\u30ff\\u4e00-\\u9fff]/;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) { const n = w.currentNode, t = n.nodeValue.trim(); if (!t || !re.test(t)) continue;
    const el = n.parentElement; if (!el || el.closest('script,style,[hidden]')) continue;
    const lj = el.closest('[lang]'); if (lj && lj !== document.documentElement && lj.lang === 'ja') continue;
    if (el.offsetParent === null) continue; out.add(t.slice(0, 60)) }
  return [...out] })()`;

async function runOne(browser, file, mode, hands) {
  const { ctx, page } = await H.openGame(browser, file, { lang: mode.lang || 'ja', storage: mode.storage });
  const jp = new Set();
  try {
    await page.evaluate(mode.start);
    await H.startBot(page, { policy: 'mix', maxHands: hands });
    let st;
    const t0 = Date.now();
    while (true) {
      await page.waitForTimeout(400);
      if (mode.lang === 'en') (await page.evaluate(JP_SCAN)).forEach(t => jp.add(t));
      const s = await page.evaluate(() => ({ done: __bot.done, idle: Date.now() - __bot.stuckAt }));
      if (s.done) {
        // 負け・勝ちで終わっても、ハンド数が足りなければもう一度はじめる
        const r = await page.evaluate(() => ({ res: __bot.result, hands: __bot.hands, errs: __qa.errors.length }));
        if (r.res !== 'limit' && r.hands < hands && !r.errs && Date.now() - t0 < 150000) {
          await page.evaluate(w => { if (__bot.result === 'win') __bot.wins = (__bot.wins || 0) + 1; __bot.restart(); try { show('title') } catch (e) {} ; (0, eval)(w) }, mode.start);
          continue;
        }
        st = 'done'; break
      }
      if (s.idle > 20000) { st = 'stalled'; break }
      if (Date.now() - t0 > 180000) { st = 'timeout'; break }
    }
    const b = await H.botState(page);
    return { mode: mode.id, status: st, ...b, pageErrors: page.__errs || [], jp: [...jp] };
  } catch (e) {
    return { mode: mode.id, status: 'crash', errors: [String(e.message)], chipErr: [], negErr: [], jp: [...jp] };
  } finally { await ctx.close() }
}

async function run({ browser, file, quick, baseline, parallel = 4 }) {
  const list = modes(quick), hands = quick ? 15 : 50, res = [];
  for (let i = 0; i < list.length; i += parallel) res.push(...await Promise.all(list.slice(i, i + parallel).map(m => runOne(browser, file, m, hands))));
  const items = [], known = new Set((baseline && baseline.enJapanese) || []);
  const newJp = new Set();
  for (const r of res) {
    const errs = [...new Set([...(r.errors || []), ...(r.pageErrors || []), ...(r.events || [])])];
    const bad = [];
    if (r.status === 'stalled') bad.push(`止まった（${r.hands}ハンド目、画面:${r.screen}、開いていた窓:${(r.overlays || []).join('/') || 'なし'}）`);
    if (r.status === 'timeout') bad.push('時間切れ');
    if (r.status === 'crash') bad.push('起動できなかった');
    if (errs.length) bad.push('エラー: ' + errs.slice(0, 3).join(' / '));
    if (r.chipErr.length) bad.push(`チップの合計が合わない ${r.chipErr.length}回（例: ハンド${r.chipErr[0].hand} 差 ${r.chipErr[0].diff}）`);
    if (r.negErr.length) bad.push(`チップがマイナス・小数 ${r.negErr.length}回`);
    if (r.hands < 3 && r.status === 'done' && r.result === 'limit') bad.push('ハンドがほとんど進まない');
    items.push({ id: 'fuzz:' + r.mode, title: `自動対戦 ${r.mode}`, status: bad.length ? 'fail' : 'ok',
      detail: bad.length ? bad.join('。') : `${r.games}回、計${r.hands}ハンド`, raw: bad.length ? r : undefined });
    (r.jp || []).forEach(t => { if (!known.has(t)) newJp.add(t) });
  }
  const allJp = [...new Set(res.flatMap(r => r.jp || []))];
  const oldJp = allJp.filter(t => known.has(t));
  items.push({ id: 'i18n:en', title: '英語版に残っている日本語', status: newJp.size ? 'warn' : oldJp.length ? 'known' : 'ok',
    detail: newJp.size ? `前回の基準にない日本語 ${newJp.size}件: ` + [...newJp].slice(0, 8).map(t => `「${t}」`).join('、') : oldJp.length ? `前からある ${oldJp.length}件: ` + oldJp.slice(0, 3).map(t => `「${t}」`).join('、') : '画面に日本語は残っていない', list: allJp });
  return { name: '自動対戦', items, baselineOut: { enJapanese: allJp } };
}
module.exports = { run, modes };
