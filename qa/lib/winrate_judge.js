// 勝率の判定だけ（ブラウザを使わない）。CIの高速化 案1（2026-10-17）で checks/winrate.js から分けた：
// GitHub では勝率の対戦を何個かの組に分けて同時に回し、「検査のまとめ」（tools/ci_summary.js、Playwright なし）が組の生の結果を混ぜてからここで判定する。
// 手元（--part なし）では checks/winrate.js がそのままここを呼ぶ。判定の中身は分ける前と同じ
'use strict';

// 1つの章の生の結果（組ごと）。res・tr・hbN・hbT は「i 回目 → 値」（i は種と配り札を決める番号）
const empty = ch => ({ ch, res: {}, tr: {}, hbN: {}, hbT: {}, tw: { n: 0, bad: 0, ex: [] }, rd: { n: 0, h: 0, r: [], ev: 0, en: 0, by: {} } });
function mergeRaw(a, b) {
  const o = a || empty(b.ch);
  for (const k of ['res', 'tr', 'hbN', 'hbT']) Object.assign(o[k], b[k]);
  o.tw.n += b.tw.n; o.tw.bad += b.tw.bad; o.tw.ex.push(...b.tw.ex);
  o.rd.n += b.rd.n; o.rd.h += b.rd.h; o.rd.r.push(...b.rd.r); o.rd.ev += b.rd.ev; o.rd.en += b.rd.en;
  for (const k in b.rd.by || {}) { const x = o.rd.by[k] = o.rd.by[k] || { n: 0, bb: 0, pp: 0 }; x.n += b.rd.by[k].n; x.bb += b.rd.by[k].bb; x.pp += b.rd.by[k].pp }
  return o;
}
const arr = m => Object.keys(m).map(Number).sort((a, b) => a - b).map(i => m[i]);

function judge(raw, { quick, baseline }) {
  const ch = raw.ch, items = [], tw = raw.tw, rd = raw.rd, paired = !quick && ch >= 4;
  const res = arr(raw.res), hbN = raw.hbN, hbT = raw.hbT;
  const ok = res.filter(r => r !== 'error'), w = ok.filter(r => r === 'win').length;
  const rate = ok.length ? w / ok.length : 0;
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
    const tr = arr(raw.tr);
    const tok = tr.filter(r => r !== 'error'), tw2 = tok.filter(r => r === 'win').length, trate = tok.length ? tw2 / tok.length : 0;
    const gap = Math.round((trate - rate) * 100);
    // 読みが5回未満の章は判定しない（第7・15章は決め手の相手が特別なクセなので読む札がほとんど出ない）
    // 判定：対にしたハンド（同じ回・同じハンド目＝同じ配り札）ごとの「読む − 読まない」の BB の差。平均が 0 未満で、ぶれ（標準誤差の2倍）でも説明できないときだけ ⚠️
    const dif = [];
    if (paired) Object.entries(hbT).forEach(([i, t]) => { const n0 = hbN[i] || {}; for (const k in t) if (k in n0) dif.push(t[k] - n0[k]) });
    const dm = dif.length ? dif.reduce((a, x) => a + x, 0) / dif.length : 0, dse = dif.length > 1 ? Math.sqrt(dif.reduce((a, x) => a + (x - dm) ** 2, 0) / (dif.length - 1) / dif.length) : Infinity;
    const judged = ch >= 4 && rd.n >= 5 && dif.length >= 20, low = judged && dm < 0 && dm + 2 * dse < 0;
    const avg = a => a.length ? (a.reduce((x, y) => x + y.bb, 0) / a.length).toFixed(1) : '-';
    const dv = rd.r.filter(x => x.diff), sm = rd.r.filter(x => !x.diff);
    // 読みの得の内訳（改善提案 2026-10-17 §0-1）：1対1／3人以上 × ブラフの札でコール／強い札で降りた。判定には使わない
    // ブラフの札でのコールは、こちらに役（1ペア以上・A を持つ）があったかで分ける（v88 レビュー）
    const byLine = by => { const L = { hu_bluff_made: '1対1・ブラフの札でコール（役あり）', hu_bluff_air: '1対1・ブラフの札でコール（役なし）', hu_bluff: '1対1・ブラフの札でコール', hu_strong: '1対1・強い札で降りた', multi_bluff_made: '3人以上・ブラフの札でコール（役あり）', multi_bluff_air: '3人以上・ブラフの札でコール（役なし）', multi_bluff: '3人以上・ブラフの札でコール', multi_strong: '3人以上・強い札で降りた' };
      const xs = Object.keys(L).filter(k => by && by[k] && by[k].n).map(k => `${L[k]} ${by[k].bb >= 0 ? '+' : ''}${by[k].bb.toFixed(1)}BB（${by[k].n}回、払う額／ポット ${(by[k].pp / by[k].n).toFixed(2)}）`);
      return xs.length ? '。読みの得の内訳：' + xs.join('、') : '' };
    // 読みの得：判断が変わったときの「選んだ手 − 読まない手」の EV の合計（相手の本当の札で見た勝つ見込みから）。ハンドの結果（BB）は運が大きいので参考
    const more = `。札の当たり ${rd.n ? Math.round(rd.h / rd.n * 100) : '-'}%（${rd.h}/${rd.n}）、読みの得 ${rd.ev >= 0 ? '+' : ''}${rd.ev.toFixed(1)}BB（判断が変わった ${rd.en}回、1回あたり ${rd.en ? (rd.ev / rd.en).toFixed(2) : '-'}BB）。参考：判断が変わったハンドの結果 平均 ${avg(dv)}BB（${dv.length}回）、変わらなかったハンド ${avg(sm)}BB（${sm.length}回）` + byLine(rd.by);
    items.push({ id: 'tellgap:ch' + ch, title: `第${ch}章：クセを読むと勝てるか`, status: low ? 'warn' : 'ok',
      detail: `読まない ${Math.round(rate * 100)}%（${ok.length}回）／読む ${Math.round(trate * 100)}%（${tok.length}回、札を読んだ判断 ${rd.n}回）／差 ${gap >= 0 ? '+' : ''}${gap}ポイント` +
        more + (paired ? `。同じ札で対にしたハンドの差（読む − 読まない） 平均 ${dm >= 0 ? '+' : ''}${dm.toFixed(2)}BB ±${Number.isFinite(dse) ? (2 * dse).toFixed(2) : '-'}（${dif.length}ハンド）` : '') +
        (judged ? (low ? `：第${ch}章はクセを読むと、同じ札で比べて損をしている（ぶれでは説明できない）` : '') : ch < 4 ? '（第1〜3章は数字だけ）' : '（読みが5回未満か、対にしたハンドが20未満なので判定しない）'),
      games: tr.map(r => r === 'win' ? 'W' : r === 'error' ? 'E' : r === 'nodecision' ? 'D' : 'L').join('') });
  }
  if (tw.n) items.push({ id: 'tellwin:ch' + ch, title: `第${ch}章：クセの札は相手のフロップ以降の賭け・上げのときだけ`, status: tw.bad ? 'fail' : 'ok',
    detail: `札 ${tw.n}回のうち、それ以外で出たのは ${tw.bad}回` + (tw.ex.length ? '（例：' + tw.ex.slice(0, 3).join('／') + '）' : '') });
  return { items, out: { rate, n: ok.length } };
}
module.exports = { judge, mergeRaw, empty };
