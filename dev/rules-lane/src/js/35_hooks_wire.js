// ===== 合図をつなぐ（案1）：order.json で全部の js の後に置く =====
// いちばん外側で1回だけ包み、LT.emit('名前:before') と LT.emit('名前') を出す。
// 今ある包み直し（各ファイルの const _sh=startHand; …）はこの内側でそのまま動く。触る機会に LT.on へ移す。
// 合図を足すときは、この行に関数名を足すだけ。
startHand=LT.wrap('startHand',startHand);
endHand=LT.wrap('endHand',endHand);
act=LT.wrap('act',act);
render=LT.wrap('render',render);
playScene=LT.wrap('playScene',playScene);
advance=LT.wrap('advance',advance);
show=LT.wrap('show',show);
renderTalk=LT.wrap('renderTalk',renderTalk);
