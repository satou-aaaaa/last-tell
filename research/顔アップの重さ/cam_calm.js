// 顔アップの重さ 案1（提案 2026-10-11）：普段の番（テルも大きな賭けもない番）は寄らず、全体のまま。
// 寄るのは「テルが出た番」と「大きな賭けの前にじっと見る番（S.stare）」だけ。テルのアップ・帯・文字はそのまま。
// 24_dokidoki_camera.js の camUpdate の `if(S.camSkip===i){...}` の次の行に、次の1行を足すのと同じ。
//   if(!camWorth(i)){clearTimeout(camBackT);if(camState.kind!=='wide')camTo(-1,'wide');return}
function camWorth(i){const p=S.players[i];if(!p)return false;const tl=p.tell;return !!(tl&&tl.street===S.street&&!p.folded)||S.stare===i}
