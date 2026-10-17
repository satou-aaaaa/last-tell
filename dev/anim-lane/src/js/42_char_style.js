/* ---------- キャラごとの打ち方の上書き（性格の型 STYLES はほかの人と共有なので、その人だけ変える） ---------- */
// カオル（第14章「慎重」）：v85 交代レビュー S2-direct で、リバーのポット2倍ベットに中くらいの手で 63% コールしていた（ジン 16%・クロウ 26%）。
// 相手の賭け方から手を絞る強さ read を .6→.85 に上げて、強いキャラ側の S2 に合わせる（S2-direct：.6 で 63%、.8 で 49%、.85 で 17%）。同じ tight2 のイオリ・ソフィア・ハルは変えない
const CHAR_STYLE={'カオル':{read:.85}};
function charStyle(name,key){const b=STYLES[key]||STYLES.normal,o=CHAR_STYLE[name];return o?{...b,...o}:b}
LT.on('startHand:before',()=>{try{if(S&&S.players)S.players.forEach(p=>{if(!p.human&&CHAR_STYLE[p.name]&&p.styleKey&&p.style===STYLES[p.styleKey])p.style=charStyle(p.name,p.styleKey)})}catch(e){}});
