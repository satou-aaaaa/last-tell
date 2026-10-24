// ===== v0.98.7 PC 向け：チップと札の手ざわり（PC 向けリッチ演出 案5、2026-10-21 satou「全部」） =====
// PC（html.pcw）だけ。
//   - 賭けたチップは、その人の持ち点の塔から卓の上へ投げられ、少し行き過ぎて戻って止まる。
//   - 止まったあと、列のいちばん上のチップがいくつか横へ滑り落ちて、少し散らばる。
//   - 散らばり方は、ハンド・ストリート・席から決める。描き直しても同じ形のまま。
//   - ストリートの終わりには、今までどおりディーラーが集める（gatherBets）。
//   - 札の厚みと影、滑って止まる動きは CSS（01r_style_pctouch.css）。
// 動きが終わったら layoutSoon を呼び、よける処理（吹き出し・直近の5手）に測り直させる。
//   札の分は 36_layout_pass.js の animationend が呼ぶ。
// 止める：動き「少なめ」（html.ltLite）・prefers-reduced-motion・PC でないとき。チップは動かさず、散らばりも付けない。
// 投げた回数・散らした数・layoutSoon を呼んだ回数を PCTOUCH に残す（qa/checks/perf.js の perf:pctouch が見る）
// 場札をめくる動きの速さの付き方（21d_live_table.js の ltBoardAnim が使う）。PC は終わりで減速して止まる。スマホは今までどおり
function ltCardEase(){return document.documentElement.classList.contains('pcw')&&!reducedMotion()?'cubic-bezier(.12,.85,.22,1)':'ease-in-out'}
const PCTOUCH={thrown:0,scat:0,lay:0,errors:0};
function pcTouchOk(){const h=document.documentElement;return h.classList.contains('pcw')&&!h.classList.contains('ltLite')&&!reducedMotion()}
// 席ごとの賭けチップ（.chipwrap）と、投げる元の持ち点の塔
function pcTouchWraps(){const out=[];if(!S||!S.players)return out;
  S.players.forEach((p,i)=>{const w=i===0?$('mine')&&$('mine').querySelector('.mybet .chipwrap'):$('spot'+i)&&$('spot'+i).querySelector('.chipwrap');
    if(w&&w.querySelector('.stack .chip'))out.push({i,w,src:i===0?$('mine').querySelector('.mystack'):$('spot'+i).querySelector('.mystack')})});return out}
// 決まった形の乱数（ハンド・ストリート・席・額から）
function pcTouchRnd(i){let s=((S.handNo||0)*7919+(String(S.street||'').length+1)*104729+i*15485863+((S.players[i]||{}).bet||0)%2147483)%2147483646+1;
  return()=>{s=(s*16807)%2147483647;return(s-1)/2147483646}}
// 列のいちばん上のチップを、横へ滑り落として卓の上に置く。ほかのチップは少しずらす。chips の translate だけを使い、置き場（.chipwrap）の大きさは変えない
function pcTouchScatter(w,i){const st=w.querySelector('.stack');if(!st||st.dataset.pcs)return[];st.dataset.pcs='1';
  const r=pcTouchRnd(i),moved=[];
  let first=true;   // 2枚以上ある列の最初の1つは必ず、ほかの列は半分ほど、いちばん上が滑り落ちる
  st.querySelectorAll('.col').forEach(col=>{const cs=[...col.querySelectorAll('.chip')],go=cs.length>=2&&(first||r()<.5);if(cs.length>=2)first=false;cs.forEach((c,k)=>{
    if(k===cs.length-1&&go){const side=r()<.5?-1:1,dx=side*(6+r()*3),dy=k*4,rot=(r()*24-12).toFixed(0);   // 列の上から卓の高さ（4px×段）まで落とす
      c.dataset.pcsTo=`${dx.toFixed(1)}px ${dy}px`;c.dataset.pcsRot=rot+'deg';c.style.zIndex='0';moved.push(c)}
    else if(k>0){c.style.translate=`${(r()*2-1).toFixed(1)}px 0px`}})});
  PCTOUCH.scat+=moved.length;return moved}
// 散らしたチップは塔が止まったあとも動いている（330ms 後に始まり、最後の1枚は 570ms 以降に止まる）。最後の1枚が止まったときにも測り直す（CodeRabbit PR #143）
function pcTouchLay(){PCTOUCH.lay++;try{layoutSoon()}catch(e){}}
function pcTouchPlace(moved,anim){moved.forEach((c,n)=>{const to=c.dataset.pcsTo,rot=c.dataset.pcsRot;
  if(!anim){c.style.translate=to;c.style.rotate=rot;return}
  LT.anim(c,[{translate:'0px 0px',rotate:'0deg'},{translate:to,rotate:rot}],{duration:240*SPEED(),delay:(330+n*40)*SPEED(),easing:'cubic-bezier(.2,.8,.3,1)',fill:'backwards'},()=>{c.style.translate=to;c.style.rotate=rot;if(n===moved.length-1)pcTouchLay()});
  c.style.translate=to;c.style.rotate=rot})}
function pcTouchRender(){if(!pcTouchOk())return;
  for(const {i,w,src} of pcTouchWraps()){const st=w.querySelector('.stack');if(!st)continue;
    const fresh=w.classList.contains('slide')&&!w.dataset.pct;const moved=pcTouchScatter(w,i);
    if(!fresh){pcTouchPlace(moved,false);continue}
    w.dataset.pct='1';const a=st.getBoundingClientRect(),b=src&&src.getBoundingClientRect();
    if(!(a.width>0)||!b||!(b.width>0)){pcTouchPlace(moved,false);continue}
    const k=st.offsetWidth?a.width/st.offsetWidth:1,dx=(b.left+b.width/2-a.left-a.width/2)/k,dy=(b.top+b.height/2-a.top-a.height/2)/k;   // #cam が寄って拡大していても、元の大きさの px で動かす
    PCTOUCH.thrown++;pcTouchPlace(moved,true);
    LT.anim(st,[{transform:`translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) rotate(-10deg) scale(.9)`,opacity:.55},{transform:`translate(${(-dx*.05).toFixed(1)}px,${(-dy*.05).toFixed(1)}px) rotate(3deg)`,opacity:1,offset:.7},{transform:'none',opacity:1}],
      {duration:480*SPEED(),easing:'cubic-bezier(.22,.7,.28,1)'},pcTouchLay)}}
LT.on('render',()=>{try{pcTouchRender()}catch(e){PCTOUCH.errors++;console.error('[pcTouch]',e)}});
