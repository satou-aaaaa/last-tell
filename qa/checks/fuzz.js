// 自動対戦：全モードで止まらないか、エラーが出ないか、チップの合計が合うか
'use strict';
const H = require('../lib/harness');
const { pool } = require('../lib/pool');

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
  // 第5章の1ハンド目（AA のハンド。オールインを自分で受ける）のあとに、終わりの回想（若き日のジンとして打つ）。2026-10-17 回想で止まった件の再現
  m.push({ id: '第5章→回想', start: `(startChapter(CHAPTERS[4],true),window.__fb5=1,LT.on('startHand',()=>{if(window.__fb5===1&&S.handNo===2&&!CFG.flashback){window.__fb5=2;setTimeout(()=>startFlashback(()=>{window.__fb5=1;try{__bot.restart()}catch(e){}startChapter(CHAPTERS[4],true)},'jin'),0)}}))` });
  // 英語版
  for (const x of [['第1章', 'startChapter(CHAPTERS[0],true)'], ['第6章', 'startChapter(CHAPTERS[5],true)'], ['第7章', 'startChapter(CHAPTERS[6],true)'], ['フリー6人', `($('freeSize').value='6',startFree())`], ['第11章', 'startP2(PART2[0],true)']])
    m.push({ id: `英語・${x[0]}`, start: x[1], lang: 'en', storage: H.UNLOCKED });
  return quick ? m.filter((x, i) => i % 2 === 0 || /英語|回想/.test(x.id)) : m;
}

// 英語のとき、画面に残っている日本語を集める
const JP_SCAN = `(() => { const out = new Set(); const re = /[\\u3040-\\u30ff\\u4e00-\\u9fff]/;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) { const n = w.currentNode, t = n.nodeValue.trim(); if (!t || !re.test(t)) continue;
    const el = n.parentElement; if (!el || el.closest('script,style,[hidden]')) continue;
    const lj = el.closest('[lang]'); if (lj && lj !== document.documentElement && lj.lang === 'ja') continue;
    if (el.offsetParent === null) continue; out.add(t.slice(0, 60)) }
  return [...out] })()`;

// 1つのモードに使える時間。長い版（50ハンド）と WebKit は遅いので長めにする。
// 時間切れでも、ハンドが進んでいてエラー・チップのずれが無ければ止まってはいないので ✅（何ハンドまで進んだかを書く）
const LIMIT = (quick) => (quick ? 180 : 420) * (process.env.QA_BROWSER === 'webkit' ? 1.5 : 1) * 1000;
const ENOUGH = 15;

async function runOne(browser, file, mode, hands, limit) {
  const { ctx, page } = await H.openGame(browser, file, { lang: mode.lang || 'ja', storage: mode.storage, seed: H.seedOf('fuzz', mode.id, mode.lang || 'ja') });
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
        if (r.res !== 'limit' && r.hands < hands && !r.errs && Date.now() - t0 < limit - 30000) {
          await page.evaluate(w => { if (__bot.result === 'win') __bot.wins = (__bot.wins || 0) + 1; __bot.restart(); try { show('title') } catch (e) {} ; (0, eval)(w) }, mode.start);
          continue;
        }
        st = 'done'; break
      }
      if (s.idle > 20000) { st = 'stalled'; break }
      if (Date.now() - t0 > limit) { st = 'timeout'; break }
    }
    const b = await H.botState(page);
    // 止まったときは、ページのタイマーが動いているかも測る（3秒待って来なければ -1）
    let timerMs = null; if (st === 'stalled') try { timerMs = await page.evaluate(() => new Promise(r => { const t = Date.now(); setTimeout(() => r(Date.now() - t), 50); setTimeout(() => r(-1), 3000) })) } catch (e) {}
    return { mode: mode.id, status: st, ...b, timerMs, pageErrors: page.__errs || [], jp: [...jp] };
  } catch (e) {
    return { mode: mode.id, status: 'crash', errors: [String(e.message)], chipErr: [], negErr: [], jp: [...jp] };
  } finally { await ctx.close() }
}

// --part k/n（CIの高速化 案1）：モードを n 個の組に分ける。英語のモードは「英語版に残っている日本語」をまとめて見るので、全部 最後の組に入れる。
// ほかのモードは、その時いちばん少ない組に1つずつ足す（組ごとの数がそろう）
function split(list, part) {
  if (!part) return list;
  const en = list.filter(m => m.lang === 'en'), cnt = Array(part.n).fill(0), out = [];
  cnt[part.n - 1] = en.length; if (part.k === part.n) out.push(...en);
  for (const m of list.filter(m => m.lang !== 'en')) { const g = cnt.indexOf(Math.min(...cnt)); cnt[g]++; if (g === part.k - 1) out.push(m) }
  return out;
}

async function run({ browser, file, quick, baseline, parallel = 4, part = null }) {
  // WebKit は Safari だけの崩れ・止まりを見るのが目的なので、いつも短い版で回す（長い版は Chromium だけ）
  if (process.env.QA_BROWSER === 'webkit') quick = true;
  const list = split(modes(quick), part), hands = quick ? 15 : 50, limit = LIMIT(quick);
  const res = await pool(list.map(m => () => runOne(browser, file, m, hands, limit)), parallel);
  const hasEn = list.some(m => m.lang === 'en');
  const items = [], known = new Set((baseline && baseline.enJapanese) || []);
  const newJp = new Set();
  for (const r of res) {
    const errs = [...new Set([...(r.errors || []), ...(r.pageErrors || []), ...(r.events || [])])];
    const bad = [];
    if (r.status === 'stalled') { const g = r.gs; bad.push(`止まった（${r.hands}ハンド目、画面:${r.screen}、開いていた窓:${(r.overlays || []).join('/') || 'なし'}${g ? `、ハンド${g.hand}・${g.street}・番${g.toAct}${g.over ? '・終わり' : ''}${g.ctrl ? '・ボタンあり' : ''}・ボットの最後の動き${Math.round(g.sinceTick / 1000)}秒前（${g.ticks}回）・行動 ${g.acted}${g.hidden ? '・裏のタブ' : ''}${g.lt ? '・長い処理 ' + g.lt : ''}${g.sc ? '・場面 ' + g.sc : ''}${g.btns ? '・ボタン ' + g.btns : ''}` : ''}${r.timerMs != null ? `、50ms のタイマー ${r.timerMs < 0 ? '来ない' : r.timerMs + 'ms'}` : ''}${r.lastLog && r.lastLog.length ? '、最後の記録「' + r.lastLog.slice(-2).join('／') + '」' : ''}）`) }
    if (r.status === 'timeout' && !(r.hands >= Math.min(ENOUGH, hands) && !errs.length && !r.chipErr.length && !r.negErr.length)) bad.push(`時間切れ（${r.hands}ハンドまで）`);
    if (r.status === 'crash') bad.push('起動できなかった');
    if (errs.length) bad.push('エラー: ' + errs.slice(0, 3).join(' / '));
    if (r.chipErr.length) bad.push(`チップの合計が合わない ${r.chipErr.length}回（例: ハンド${r.chipErr[0].hand} 差 ${r.chipErr[0].diff}）`);
    if (r.negErr.length) bad.push(`チップがマイナス・小数 ${r.negErr.length}回`);
    if (r.hands < 3 && r.status === 'done' && r.result === 'limit') bad.push('ハンドがほとんど進まない');
    items.push({ id: 'fuzz:' + r.mode, title: `自動対戦 ${r.mode}`, status: bad.length ? 'fail' : 'ok',
      detail: bad.length ? bad.join('。') : `${r.games}回、計${r.hands}ハンド` + (r.status === 'timeout' ? `（${limit / 1000}秒で打ち切り。止まってはいない）` : ''), raw: bad.length ? r : undefined });
    (r.jp || []).forEach(t => { if (!known.has(t)) newJp.add(t) });
  }
  const allJp = [...new Set(res.flatMap(r => r.jp || []))];
  const oldJp = allJp.filter(t => known.has(t));
  if (hasEn) items.push({ id: 'i18n:en', title: '英語版に残っている日本語', status: newJp.size ? 'warn' : oldJp.length ? 'known' : 'ok',
    detail: newJp.size ? `前回の基準にない日本語 ${newJp.size}件: ` + [...newJp].slice(0, 8).map(t => `「${t}」`).join('、') : oldJp.length ? `前からある ${oldJp.length}件: ` + oldJp.slice(0, 3).map(t => `「${t}」`).join('、') : '画面に日本語は残っていない', list: allJp });
  return { name: '自動対戦', items, baselineOut: hasEn ? { enJapanese: allJp } : {} };
}
module.exports = { run, modes };
