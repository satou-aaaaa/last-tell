'use strict';
// 止まったかの判定（自動対戦 fuzz と runUntilDone で同じものを使う。片方だけ直して食い違わないように）
// - ハンドが stallMs 終わらず、かつゲームの進む印（progAt）も stallMs 変わらない → 止まった
// - 印が変わり続けていても、ハンドが HARD_MS 終わらない → 止まった（同じ所を回り続ける止まりを見のがさない）
// 2026-10-24 WebKit 第5章：CI の実行機が遅く、1ハンド目が20秒を超えたのを「止まった」としていた（0.5秒前にも進む処理が動いていた）
const HARD_MS = 120000;
const STATE_JS = () => ({ done: __bot.done, hands: __bot.hands || 0, idle: Date.now() - __bot.stuckAt, prog: Date.now() - (__bot.progAt || __bot.stuckAt), tk: __bot.tickN || 0 });
function stallKind(st, stallMs) {
  if (st.idle <= stallMs) return '';
  if (st.prog > stallMs) return 'stalled';
  if (st.idle > Math.max(HARD_MS, stallMs * 3)) return 'stalled';
  return '';
}
module.exports = { stallKind, STATE_JS, HARD_MS };
