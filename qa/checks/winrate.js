// 勝率：第1〜4章を「ゲームのCPUと同じ考え方」で打って、前の版の基準と比べる
// 長い版（--full）では第5〜7章と第二部（第11〜15章）も記録する。こちらは変わっても ⚠️ だけ（レビューの仕組み 案1、2026-10-10）
// 乱数は回ごとに固定する（CIの見直し 案3）：i 回目はいつも同じ配り方なので、同じ版なら何度回しても同じ勝率。基準と違えば本当に変わった
// --ch 1,2 で章を選べる（GitHub では章ごとに別の組で同時に回す）
'use strict';
const H = require('../lib/harness');
const os = require('os');
// クセを読むと勝てるか（改善提案 2026-10-15 §2）：第4〜7章・第11〜15章で「読まない」と「読む」（policy 'tell'）を比べる。
// 2026-10-16 §0-2 から判定は同じ配り札で対にしたハンドの BB の差（勝率の差は参考。章の勝ち負け24回の差はほぼ札の運だった）
// 回数：第4章から（長い版）は 読まない12回＋読む12回（全体の回数は今の24回のまま）。第1〜3章は基準と比べるので読まない24回のまま、読むのは4回だけ足す（数字だけ、+3分ほど）
const TELL_N = 12, TELL_N13 = 4;

// テルを主軸に（js/39_tell_win.js 案1）：CFG.tells の卓では、クセの札が出るのは「相手がフロップ以降で賭けた・上げた」ときだけ（改善提案 2026-10-14b §1）。
// showTell を外から包んで、札が出たときの通り（street）と動き（d.type）を数える。特別なクセ（TW_KEEP：本物のテル・手袋）と、台本の手は数えない
const TW_WATCH = () => { try { if (typeof showTell !== 'function' || typeof TW_KEEP === 'undefined') return; window.__tw = { n: 0, bad: 0, ex: [] }; const _s = showTell;
  showTell = function (i, d) { const r = _s.apply(this, arguments); try { const p = S.players[i];
    if (p && p.tell && CFG.tells && !CFG.flashback && !S.scriptAI && !S.storyHand && !S.finalHand && !TW_KEEP.includes(p.name)) { __tw.n++;
      if (S.street === 'preflop' || !d || d.type !== 'raise') { __tw.bad++; if (__tw.ex.length < 3) __tw.ex.push(p.name + ' ' + S.street + ' ' + (d && d.type)) } } } catch (e) {} return r } } catch (e) {} };

async function playOnce(browser, file, ch, maxHands, seed, tw, policy = 'cpu', rd, deal = null, hb = null) {
  const { ctx, page } = await H.openGame(browser, file, { fast: 60, storage: ch > 10 ? H.UNLOCKED : null, seed, deal });
  try {
    await page.evaluate(n => n > 10 ? startP2(PART2[n - 11], true) : startChapter(CHAPTERS[n - 1], true), ch);
    await page.evaluate(TW_WATCH);
    const twGet = async () => { try { const t = await page.evaluate(() => window.__tw || null); if (t && tw) { tw.n += t.n; tw.bad += t.bad; tw.ex.push(...t.ex) } } catch (e) {} };
    await H.startBot(page, { policy, maxHands });
    // 上限は手数に合わせる（1ハンド約4秒、ブラウザがコアを分け合うと遅くなるので2倍見る）。本当に止まったのは stallMs で分かる
    const r = await H.runUntilDone(page, { timeoutMs: maxHands * 8000, stallMs: 20000 });
    const b = await H.botState(page); await twGet();
    if (hb) { try { Object.assign(hb, await page.evaluate(() => __bot.hb || {})) } catch (e) {} }
    if (rd) { try { const x = await page.evaluate(() => ({ n: __bot.reads || 0, h: __bot.hits || 0, r: __bot.readRes || [], ev: __bot.evGain || 0, en: __bot.evN || 0 })); rd.n += x.n; rd.h += x.h; rd.r.push(...x.r); rd.ev += x.ev; rd.en += x.en } catch (e) {} }
    // 手は進んでいるのに時間切れ → 80ハンドで決着しない回と同じく「決着なし」（負け扱い）。止まった（stalled）ときだけエラー
    return r.status === 'done' ? b.result : r.status === 'timeout' ? 'nodecision' : 'error';
  } catch (e) { return 'error' } finally { await ctx.close() }
}

// 同時に開く数はCPUの数に合わせる（GitHubの実行機は2〜4コアで、6つ同時だと遅すぎて止まった扱いになる）
async function run({ browser, file, quick, baseline, chapters, parallel = Math.max(1, Math.min(6, os.cpus().length - 1)) }) {
  const N = quick ? 8 : 24, maxHands = 80, items = [], out = {};
  const all = quick ? [1, 2, 3, 4] : [1, 2, 3, 4, 5, 6, 7, 11, 12, 13, 14, 15];
  for (const ch of chapters ? all.filter(c => chapters.includes(c)) : all) {
    const tw = { n: 0, bad: 0, ex: [] };
    // 第4〜6章は「読む・読まない」の差を確かめるので 24回＋24回（改善提案 2026-10-15b 案1 の「できた」の条件）
    const nN = !quick && ch >= 4 ? (ch <= 6 ? 24 : TELL_N) : N;
    // 第4章から（読み比べを判定する章）は配る札をゲームの ?seed= で決めて、読む方と同じ札で対にする（改善提案 2026-10-16 §0-2）
    const paired = !quick && ch >= 4, dealOf = i => paired ? ch * 1000 + i + 1 : null, hbN = [], hbT = [];
    const jobs = Array.from({ length: nN }, (_, i) => () => playOnce(browser, file, ch, maxHands, ch * 1000 + i + 1, tw, 'cpu', null, dealOf(i), hbN[i] = {}));
    const res = [];
    for (let i = 0; i < jobs.length; i += parallel) res.push(...await Promise.all(jobs.slice(i, i + parallel).map(f => f())));
    // 途中で止まった回は1度だけ1つずつやり直す（実行機が混んでいただけのことがある）
    for (let i = 0; i < res.length; i++) if (res[i] === 'error') res[i] = await playOnce(browser, file, ch, maxHands, ch * 1000 + i + 1, tw, 'cpu', null, dealOf(i), hbN[i] = {});
    const ok = res.filter(r => r !== 'error'), w = ok.filter(r => r === 'win').length;
    const rate = ok.length ? w / ok.length : 0;
    out['ch' + ch] = { rate, n: ok.length };
    const base = baseline && baseline.winrate && baseline.winrate['ch' + ch];
    let status = 'ok', detail = `勝率 ${Math.round(rate * 100)}%（${w}/${ok.length}、80ハンドで決着しない回は負け扱い）`;
    const nd = res.filter(r => r === 'nodecision').length;
    if (nd) detail += `。${nd}回は時間内に決着せず（負け扱い）`;
    if (res.length - ok.length) { status = 'fail'; detail += `。${res.length - ok.length}回は途中で止まった` }
    if (base) {
      // 回数が少ないので、ぶれの幅（標準誤差の2.5倍、最低15ポイント）を超えたときだけ「変わった」とする
      const se = Math.sqrt(Math.max(base.rate * (1 - base.rate), 0.05) * (1 / base.n + 1 / Math.max(ok.length, 1)));
      const tol = Math.max(0.15, 2.5 * se);
      detail += `、基準 ${Math.round(base.rate * 100)}%（許す幅 ±${Math.round(tol * 100)}）`;
      if (Math.abs(rate - base.rate) > tol && ch <= 3) status = 'fail';
      else if (Math.abs(rate - base.rate) > tol) status = 'warn';
    } else detail += '、基準なし（今回の値を基準にする）';
    items.push({ id: 'winrate:ch' + ch, title: `第${ch}章の勝率`, status, detail, games: res.map(r => r === 'win' ? 'W' : r === 'error' ? 'E' : r === 'nodecision' ? 'D' : 'L').join('') });
    if (!quick) {
      // 同じ章をクセを読む打ち手でも回す。第4章からは読まない方と同じ種・同じ配り札（i 回目どうしを対にする）。第1〜3章は別の並び（+500）
      const rd = { n: 0, h: 0, r: [], ev: 0, en: 0 }, tj = Array.from({ length: ch >= 4 ? (ch <= 6 ? 24 : TELL_N) : TELL_N13 }, (_, i) => () => playOnce(browser, file, ch, maxHands, ch * 1000 + (paired ? 0 : 500) + i + 1, null, 'tell', rd, dealOf(i), hbT[i] = {}));
      const tr = [];
      for (let i = 0; i < tj.length; i += parallel) tr.push(...await Promise.all(tj.slice(i, i + parallel).map(f => f())));
      const tok = tr.filter(r => r !== 'error'), tw2 = tok.filter(r => r === 'win').length, trate = tok.length ? tw2 / tok.length : 0;
      const gap = Math.round((trate - rate) * 100);
      // 読みが5回未満の章は判定しない（第7・15章は決め手の相手が特別なクセなので読む札がほとんど出ない）
      // 判定：対にしたハンド（同じ回・同じハンド目＝同じ配り札）ごとの「読む − 読まない」の BB の差。平均が 0 未満で、ぶれ（標準誤差の2倍）でも説明できないときだけ ⚠️
      const dif = [];
      if (paired) hbT.forEach((t, i) => { const n0 = hbN[i] || {}; for (const k in t) if (k in n0) dif.push(t[k] - n0[k]) });
      const dm = dif.length ? dif.reduce((a, x) => a + x, 0) / dif.length : 0, dse = dif.length > 1 ? Math.sqrt(dif.reduce((a, x) => a + (x - dm) ** 2, 0) / (dif.length - 1) / dif.length) : Infinity;
      const judged = ch >= 4 && rd.n >= 5 && dif.length >= 20, low = judged && dm < 0 && dm + 2 * dse < 0;
      const avg = a => a.length ? (a.reduce((x, y) => x + y.bb, 0) / a.length).toFixed(1) : '-';
      const dv = rd.r.filter(x => x.diff), sm = rd.r.filter(x => !x.diff);
      // 読みの得：判断が変わったときの「選んだ手 − 読まない手」の EV の合計（相手の本当の札で見た勝つ見込みから）。ハンドの結果（BB）は運が大きいので参考
      const more = `。札の当たり ${rd.n ? Math.round(rd.h / rd.n * 100) : '-'}%（${rd.h}/${rd.n}）、読みの得 ${rd.ev >= 0 ? '+' : ''}${rd.ev.toFixed(1)}BB（判断が変わった ${rd.en}回、1回あたり ${rd.en ? (rd.ev / rd.en).toFixed(2) : '-'}BB）。参考：判断が変わったハンドの結果 平均 ${avg(dv)}BB（${dv.length}回）、変わらなかったハンド ${avg(sm)}BB（${sm.length}回）`;
      items.push({ id: 'tellgap:ch' + ch, title: `第${ch}章：クセを読むと勝てるか`, status: low ? 'warn' : 'ok',
        detail: `読まない ${Math.round(rate * 100)}%（${ok.length}回）／読む ${Math.round(trate * 100)}%（${tok.length}回、札を読んだ判断 ${rd.n}回）／差 ${gap >= 0 ? '+' : ''}${gap}ポイント` +
          more + (paired ? `。同じ札で対にしたハンドの差（読む − 読まない） 平均 ${dm >= 0 ? '+' : ''}${dm.toFixed(2)}BB ±${Number.isFinite(dse) ? (2 * dse).toFixed(2) : '-'}（${dif.length}ハンド）` : '') +
          (judged ? (low ? `：第${ch}章はクセを読むと、同じ札で比べて損をしている（ぶれでは説明できない）` : '') : ch < 4 ? '（第1〜3章は数字だけ）' : '（読みが5回未満か、対にしたハンドが20未満なので判定しない）'),
        games: tr.map(r => r === 'win' ? 'W' : r === 'error' ? 'E' : r === 'nodecision' ? 'D' : 'L').join('') });
    }
    if (tw.n) items.push({ id: 'tellwin:ch' + ch, title: `第${ch}章：クセの札は相手のフロップ以降の賭け・上げのときだけ`, status: tw.bad ? 'fail' : 'ok',
      detail: `札 ${tw.n}回のうち、それ以外で出たのは ${tw.bad}回` + (tw.ex.length ? '（例：' + tw.ex.slice(0, 3).join('／') + '）' : '') });
  }
  return { name: '勝率', items, baselineOut: { winrate: out } };
}
module.exports = { run };
