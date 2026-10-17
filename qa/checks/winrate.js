// 勝率：第1〜4章を「ゲームのCPUと同じ考え方」で打って、前の版の基準と比べる
// 長い版（--full）では第5〜7章と第二部（第11〜15章）も記録する。こちらは変わっても ⚠️ だけ（レビューの仕組み 案1、2026-10-10）
// 乱数は回ごとに固定する（CIの見直し 案3）：i 回目はいつも同じ配り方なので、同じ版なら何度回しても同じ勝率。基準と違えば本当に変わった
// --ch 1,2 で章を選べる（GitHub では章ごとに別の組で同時に回す）
'use strict';
const H = require('../lib/harness');
const os = require('os');
const { pool } = require('../lib/pool');
const J = require('../lib/winrate_judge');
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
    if (rd) { try { const x = await page.evaluate(() => ({ n: __bot.reads || 0, h: __bot.hits || 0, r: __bot.readRes || [], ev: __bot.evGain || 0, en: __bot.evN || 0, by: __bot.evBy || {} })); rd.n += x.n; rd.h += x.h; rd.r.push(...x.r); rd.ev += x.ev; rd.en += x.en;
      const by = rd.by = rd.by || {}; for (const k in x.by) { const a = by[k] = by[k] || { n: 0, bb: 0, pp: 0 }; a.n += x.by[k].n; a.bb += x.by[k].bb; a.pp += x.by[k].pp } } catch (e) {} }
    // 手は進んでいるのに時間切れ → 80ハンドで決着しない回と同じく「決着なし」（負け扱い）。止まった（stalled）ときだけエラー
    return r.status === 'done' ? b.result : r.status === 'timeout' ? 'nodecision' : 'error';
  } catch (e) { return 'error' } finally { await ctx.close() }
}

// 1回の対戦にかかるおおよその時間（分、v0.89 の CI から）。組に分けるときの配り方にだけ使う。章が増えたら足す（無い章は 1）
const COST = { 1: 1.2, 2: 2.0, 3: 1.1, 4: .85, 5: .4, 6: .9, 7: .4, 11: .65, 12: .85, 13: .55, 14: 1.5, 15: .3 };
const cost = ch => COST[ch] || 1;

// 同時に開く数はCPUの数に合わせる（GitHubの実行機は2〜4コアで、6つ同時だと遅すぎて止まった扱いになる）
// --part k/n（CIの高速化 案1、2026-10-17）：全部の章の対戦を1列に並べて n 個の組に順に配り、組ごとの生の結果（partial）を返す。
// 判定は「検査のまとめ」が組を混ぜてから lib/winrate_judge.js で行う（種と配り札は i 回目で決まるので、どの組で回しても同じ）
async function run({ browser, file, quick, baseline, chapters, part = null, parallel = Math.max(1, Math.min(6, os.cpus().length - 1)) }) {
  const N = quick ? 8 : 24, maxHands = 80, items = [], out = {};
  const all = quick ? [1, 2, 3, 4] : [1, 2, 3, 4, 5, 6, 7, 11, 12, 13, 14, 15];
  const raws = {}, tasks = [];
  for (const ch of chapters ? all.filter(c => chapters.includes(c)) : all) {
    const raw = raws[ch] = J.empty(ch);
    // 第4〜6章は「読む・読まない」の差を確かめるので 24回＋24回（改善提案 2026-10-15b 案1 の「できた」の条件）
    const nN = !quick && ch >= 4 ? (ch <= 6 ? 24 : TELL_N) : N;
    // 第4章から（読み比べを判定する章）は配る札をゲームの ?seed= で決めて、読む方と同じ札で対にする（改善提案 2026-10-16 §0-2）
    const paired = !quick && ch >= 4, dealOf = i => paired ? ((ch * 1000 + i + 1) * 100003) >>> 0 : null;
    const base = i => playOnce(browser, file, ch, maxHands, ch * 1000 + i + 1, raw.tw, 'cpu', null, dealOf(i), raw.hbN[i] = {});
    for (let i = 0; i < nN; i++) tasks.push({ ch, k: tasks.length, go: async () => {
      let r = await base(i);
      // 途中で止まった回は1度だけやり直す（実行機が混んでいただけのことがある）
      if (r === 'error') r = await base(i);
      raw.res[i] = r } });
    // 同じ章をクセを読む打ち手でも回す。第4章からは読まない方と同じ種・同じ配り札（i 回目どうしを対にする）。第1〜3章は別の並び（+500）
    if (!quick) for (let i = 0, nT = ch >= 4 ? (ch <= 6 ? 24 : TELL_N) : TELL_N13; i < nT; i++)
      tasks.push({ ch, k: tasks.length, go: async () => { raw.tr[i] = await playOnce(browser, file, ch, maxHands, ch * 1000 + (paired ? 0 : 500) + i + 1, null, 'tell', raw.rd, dealOf(i), raw.hbT[i] = {}) } });
  }
  // 重い対戦から先に、いちばん軽い組へ1つずつ配る（CIの高速化 案1）。1つ終わったらすぐ次（案2）
  tasks.sort((x, y) => cost(y.ch) - cost(x.ch) || x.ch - y.ch || x.k - y.k);
  const load = Array(part ? part.n : 1).fill(0), my = [];
  for (const t of tasks) { const g = load.indexOf(Math.min(...load)); load[g] += cost(t.ch); if (!part || g === part.k - 1) my.push(t.go) }
  await pool(my, parallel);
  if (part) return { name: '勝率', items, partial: Object.values(raws) };
  for (const raw of Object.values(raws)) { const j = J.judge(raw, { quick, baseline }); items.push(...j.items); out['ch' + raw.ch] = j.out }
  return { name: '勝率', items, baselineOut: { winrate: out } };
}
module.exports = { run };
