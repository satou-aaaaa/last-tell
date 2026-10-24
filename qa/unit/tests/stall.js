// 検査の「止まった」の判定（qa/lib/stall.js）。ゲームではなく検査そのもののテスト（2026-10-24 WebKit 第5章の見かけの止まり）
'use strict';
const { stallKind, HARD_MS } = require('../../lib/stall');
module.exports = () => {
  const bad = [], S = 20000;
  const want = (name, st, exp, ms = S) => { const got = stallKind(st, ms); if (got !== exp) bad.push(`${name}（期待 ${exp || '進んでいる'}、実際 ${got || '進んでいる'}）`) };
  want('ハンドが20秒以内に終わっている', { idle: 5000, prog: 5000 }, '');
  want('ハンドもゲームも20秒進まない＝止まった', { idle: 21000, prog: 21000 }, 'stalled');
  want('10/24 の WebKit 第5章：ハンドは21秒終わらないが、0.5秒前にも進んでいた', { idle: 21000, prog: 500 }, '');
  want('進む印が変わり続けても、ハンドが2分終わらない＝同じ所を回っている', { idle: HARD_MS + 1000, prog: 200 }, 'stalled');
  want('stallMs が長い検査（60秒）は、その3倍までは待つ', { idle: 150000, prog: 200 }, '', 60000);
  want('stallMs が長い検査（60秒）でも、3倍を超えたら止まった', { idle: 181000, prog: 200 }, 'stalled', 60000);
  return [{ id: 'unit:stall', title: '検査の「止まった」の判定（ハンドが終わらない時間と、ゲームが最後に進んだ時間の両方で見る）', ok: !bad.length, detail: bad.length ? bad.join(' / ') : '6場面すべて期待どおり' }];
};
