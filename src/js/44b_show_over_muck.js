/* ---------- 見せた札を捨て札の山より見せる（v88.2 レビュー） ---------- */
// 6人卓の縦で、ショーダウンで勝った左の席の見せた札（5♠）が捨て札の山（.muckpile）の下に隠れていた。
// ハンドの終わりに、見せた札と重なる山は隠す（山は飾り。札は勝ち負けの答えなので見えるほうを取る）。次のハンドで戻る。
function muckYield(){const m=document.querySelector('.felt .boardspot > .muckpile');if(!m)return;
  const on=!!(S&&S.handOver);if(!on||!m.children.length){m.classList.remove('mkyield');return}
  const R=e=>e.getBoundingClientRect(),shown=[...document.querySelectorAll('#felt .spot .hand:not(.folded):not(.muck) .card:not(.back):not(.slot)')].filter(e=>e.offsetParent).map(R);
  const hit=[...m.querySelectorAll('.muckcard')].map(R).some(a=>shown.some(b=>a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1));
  m.classList.toggle('mkyield',hit)}
LT.on('layout',()=>{try{muckYield()}catch(e){}});
// 見せた札が場札に重なるときは、その席の札を上へ逃がす（v91.2 レビュー：6人卓の縦で右の席の見せた札が川の札の上半分にかかった）
// ハンドの終わりだけ。場札は動かさない（みんなの札なので）。次のハンドで戻す
function showYieldBoard(){const hands=[...document.querySelectorAll('#felt .spot .hand')];
  const on=!!(S&&S.handOver);
  hands.forEach(h=>{if(h.dataset.syb&&(!on||h.classList.contains('folded')||h.classList.contains('muck'))){h.style.translate='';delete h.dataset.syb}});
  if(!on)return;
  const R=e=>e.getBoundingClientRect(),board=[...document.querySelectorAll('#boardCards .card:not(.slot)')].filter(e=>e.offsetParent).map(R).filter(r=>r.width>2);if(!board.length)return;
  hands.forEach(h=>{if(h.classList.contains('folded')||h.classList.contains('muck'))return;
    const cs=[...h.querySelectorAll('.card:not(.back):not(.slot)')].filter(e=>e.offsetParent);if(!cs.length)return;
    h.style.translate='';
    let need=0;cs.map(R).forEach(a=>board.forEach(b=>{if(!(a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1))return;
      const d=a.top+a.bottom<b.top+b.bottom?-(a.bottom-b.top+3):b.bottom-a.top+3;if(Math.abs(d)>Math.abs(need))need=d}));   // 場札より上にある札は上へ、下にある札は下へ
    if(!need){delete h.dataset.syb;return}
    const k=h.offsetHeight?R(h).height/h.offsetHeight:1;
    h.style.translate=`0 ${Math.round(need/(k||1))}px`;h.dataset.syb='1'})}
LT.on('layout',()=>{try{showYieldBoard()}catch(e){}});
