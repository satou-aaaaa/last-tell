// 通しで遊ぶ（2026-10-14 CIのチェック充実 案5）：まっさらなセーブから、会話も飛ばさずに第1章→第7章→第二部（第11〜15章）へ続けて進む。
//   見ること：止まらない・エラーが出ない・勝つと次の章が開く・セーブが次の章へ引き継がれる
//   ボットはゲームの CPU と同じ考え方で打つ。負けたら同じセーブからやり直す（1章に TRIES 回まで）。勝てないのはボットの弱さなので ⚠️、止まる・エラー・章が開かないは ❌
//   1時間ほどかかるので、毎回の CI では回さない。.github/workflows/playthrough.yml が毎晩 main で回す
'use strict';
const H = require('../lib/harness');

const TRIES = process.env.QA_PLAY_TRIES ? +process.env.QA_PLAY_TRIES : 10, HANDS = 150;   // QA_PLAY_TRIES=0 で、すぐ「相手を減らした11回目」だけを試せる
const ORDER = process.env.QA_PLAY_CH ? process.env.QA_PLAY_CH.split(',').map(Number) : [1, 2, 3, 4, 5, 6, 7, 11, 12, 13, 14, 15];   // QA_PLAY_CH=1,2 で一部だけ

async function playChapter(browser, file, ch, storage, seed, weaken) {
  const { ctx, page } = await H.openGame(browser, file, { fast: 60, storage, seed });
  try {
    await page.evaluate(n => n > 10 ? startP2(PART2[n - 11]) : startChapter(CHAPTERS[n - 1]), ch);
    await H.startBot(page, { policy: 'cpu', maxHands: HANDS, weaken: !!weaken });
    const r = await H.runUntilDone(page, { timeoutMs: HANDS * 8000, stallMs: 30000 });
    const b = await H.botState(page);
    // 勝ったら「次へ」を押して、締めの会話を最後まで送る（章の一覧かタイトルに戻るまで）。ここで進みが保存される
    let back = false;
    if (b.result === 'win') for (const t0 = Date.now(); Date.now() - t0 < 90000 && !back; await page.waitForTimeout(120)) {
      back = await page.evaluate(() => {
        const vis = el => !!el && !el.hidden && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
        if ((vis($('chapters')) || vis($('title'))) && !vis($('scene'))) return true;
        // 締めの会話の中の回想の卓は、人の手番で止まる。ボットはもう止まっているので、押せる方を押す（改善提案 2026-10-16 §0-1）
        //   第2・3・4・6章の回想は「降りる・受ける」の判断（受ける）、第5章のジンの回想は「上げる」だけ
        if (typeof CFG !== 'undefined' && CFG && CFG.flashback && S && S.players && !S.handOver && S.toAct === 0) { const k = ['btnCall', 'btnCheck', 'btnRaise'].map(id => $(id)).find(x => vis(x) && !x.disabled); if (k) { k.click(); return false } }
        const b = ['lkOk', 'askGo', 'vsGo', 'rvOk', 'btnNoticeClose', 'btnNext', 'btnAdv'].map(id => $(id)).find(x => vis(x) && !x.disabled)
          || [...document.querySelectorAll('#scene button, #between button:not(#btnQuit), [role=dialog] button')].find(x => vis(x) && !x.disabled && !/^(btnSkip|btnShot|btnSave|btnPen)$/.test(x.id));
        if (b) b.click(); else if (vis($('scene')) && typeof advance === 'function') advance();
        return false;
      });
    }
    let where = '';
    if (b.result === 'win' && !back) { r.status = 'stalled-outro';
      where = await page.evaluate(() => { const vis = el => !!el && !el.hidden && el.getClientRects().length > 0;
        return '見えている画面: ' + ['title', 'chapters', 'scene', 'game', 'between', 'vs'].filter(id => vis($(id))).join('・') + '、押せるボタン: ' + [...document.querySelectorAll('button')].filter(x => vis(x) && !x.disabled).map(x => x.id || x.textContent.trim().slice(0, 8)).slice(0, 12).join('・') + (typeof S !== 'undefined' && S && S.players ? `、卓: 手番 ${S.toAct}・${S.street}・終わり ${!!S.handOver}・回想 ${!!(typeof CFG !== 'undefined' && CFG && CFG.flashback)}・判断待ち ${!!S.fbAsk}・自動 ${!!S.autoMe}` : '') }) }
    await page.waitForTimeout(800);
    const after = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])));
    return { status: r.status, where, result: b.result, hands: b.hands, errors: [...new Set([...(b.chipErr || []).map(e => 'チップの合計 ' + e.diff), ...(await page.evaluate(() => __qa.errors))])].slice(0, 3), after };
  } catch (e) { return { status: 'error', result: null, hands: 0, errors: [String(e.message).slice(0, 160)], after: null } } finally { await ctx.close() }
}
const cleared2 = st => { try { return JSON.parse((st || {})['shisho-part2'] || '{}').cleared || 0 } catch (e) { return 0 } };
const cleared = st => { try { return JSON.parse((st || {})['shisho-progress'] || '{}').cleared || 0 } catch (e) { return 0 } };

async function run({ browser, file }) {
  const items = [];
  let storage = { 'shisho-guide': JSON.stringify({ done: true }) };
  for (const ch of ORDER) {
    let got = null, tries = 0, bad = [];
    for (; tries < TRIES && !got; tries++) {
      const r = await playChapter(browser, file, ch, storage, H.seedOf('playthrough', ch, tries));
      if (r.status === 'stalled' || r.status === 'error') bad.push(`${tries + 1}回目で止まった（${r.hands}ハンド）`);
      if (r.status === 'stalled-outro') bad.push('勝ったあとの締めの会話が終わらない（章の一覧・タイトルに戻らない）。' + r.where);
      if (r.errors.length) bad.push('エラー: ' + r.errors.join(' / '));
      if (r.result === 'win') got = r;
      if (bad.length) break;
    }
    // 10回勝てなかった章は、11回目だけ相手のチップを 1BB に減らして打ち、締めの会話・見返し・次の章へのつなぎを最後まで通す（改善提案 2026-10-17 §0-2）
    let weak = false;
    if (!got && !bad.length) { const r = await playChapter(browser, file, ch, storage, H.seedOf('playthrough', ch, TRIES), true);
      if (r.status === 'stalled' || r.status === 'error') bad.push(`${TRIES + 1}回目（相手を減らして）で止まった（${r.hands}ハンド）`);
      if (r.status === 'stalled-outro') bad.push(`${TRIES + 1}回目（相手を減らして）勝ったあとの締めの会話が終わらない（章の一覧・タイトルに戻らない）。` + r.where);
      if (r.errors.length) bad.push('エラー: ' + r.errors.join(' / '));
      if (r.result === 'win' && !bad.length) { got = r; weak = true } }
    const name = ch > 10 ? `第二部 第${ch}章` : `第${ch}章`;
    if (bad.length) { items.push({ id: `play:ch${ch}`, title: `通しで遊ぶ：${name}`, status: 'fail', detail: bad.join('。') }); break }
    if (!got) {
      // 勝てないのはボットの弱さ。進みだけを書いて（勝ったことにして）、次の章へ続ける
      items.push({ id: `play:ch${ch}`, title: `通しで遊ぶ：${name}`, status: 'warn', detail: `${TRIES}回打って勝てなかった（ボットの弱さ）。進みだけ書いて次の章へ続けた` });
      storage = { ...storage };
      if (ch <= 7) { let p = {}; try { p = JSON.parse(storage['shisho-progress'] || '{}') } catch (e) { } storage['shisho-progress'] = JSON.stringify({ ...p, v: p.v || 1, cleared: Math.max(ch, +p.cleared || 0) }) }
      else { let p = {}; try { p = JSON.parse(storage['shisho-part2'] || '{}') } catch (e) { } storage['shisho-part2'] = JSON.stringify({ ...p, cleared: Math.max(ch - 10, +p.cleared || 0) }) }
      continue;
    }
    const before = ch > 10 ? cleared2(storage) + 10 : cleared(storage), now = ch > 10 ? cleared2(got.after) + 10 : cleared(got.after);
    const opened = now >= ch;
    // 第15章のあとは、エンディングを通ってタイトル（か章の一覧）に戻り、第二部の cleared が 5 になっていること
    const end = ch === 15 ? (cleared2(got.after) >= 5 ? '。エンディングを通ってタイトルに戻った（第二部 cleared 5）' : '') : '';
    items.push({ id: `play:ch${ch}`, title: `通しで遊ぶ：${name}`, status: opened ? (weak ? 'warn' : 'ok') : 'fail',
      detail: (weak ? `${TRIES}回打って勝てなかった（ボットの弱さ）。${TRIES + 1}回目（相手を減らして）勝った（${got.hands}ハンド）。締めまで通った` : `${tries}回目で勝った（${got.hands}ハンド）。締めまで通った`) + `。進み 第${before}章 → 第${now}章まで` + end + (opened ? '' : '。勝ったのに次の章が開かない') });
    if (!opened) break;
    storage = got.after;
  }
  return { name: '通しで遊ぶ', items };
}
module.exports = { run, onlyWhenAsked: true };   // --only playthrough のときだけ回す
