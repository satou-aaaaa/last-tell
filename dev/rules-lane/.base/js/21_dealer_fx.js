/* ---------- ディーラーの声・演出 ---------- */
let dcallT=0;
function dealerSay(text){
  const d=$('dcall');d.textContent=text;d.style.animationDuration=(1.3*SPEED())+'s';d.classList.remove('go');void d.offsetWidth;d.classList.add('go');try{if(typeof dcallPlace==='function'){dcallPlace();setTimeout(()=>{try{if(d.classList.contains('go'))dcallPlace()}catch(e){}},250*SPEED())}}catch(e){}
  clearTimeout(dcallT);dcallT=setTimeout(()=>d.classList.remove('go'),1300*SPEED());
}
/* ポットのチップを勝った人の席へすべらせる */
function potFly(from,amount){
  if(!from||!amount||reducedMotion())return;
  const tb=$('table').getBoundingClientRect();
  const ws=S.players.map((p,i)=>i).filter(i=>S.players[i].won>0);
  ws.forEach(i=>{
    const tgt=i===0?$('mine').querySelector('.me-r'):$('plate'+i);if(!tgt)return;
    const r=tgt.getBoundingClientRect();
    const el=document.createElement('div');el.className='potfly';el.innerHTML=chipStack(Math.round(amount/ws.length/1000)*1000||amount,false);
    el.style.left=(from.left+from.width/2-tb.left)+'px';el.style.top=(from.top+from.height/2-tb.top)+'px';
    $('table').appendChild(el);
    const dx=r.left+r.width/2-from.left-from.width/2,dy=r.top+r.height/2-from.top-from.height/2;
    el.animate([{transform:'translate(-50%,-50%)',opacity:1},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.7)`,opacity:.2}],
      {duration:700*SPEED(),easing:'cubic-bezier(.5,0,.3,1)',fill:'forwards'}).onfinish=()=>el.remove();
  });
}
function potCall(){const ws=S.players.filter(p=>p.won>0);if(!ws.length)return;
  dealerSay('ポットは'+ws.map(w=>w.human?'あなた':w.name+'さん').join('と')+'へ');Sound.sfx(ws.some(w=>w.human)?'win':'chip')}
function camSnapWide(){const c=$('cam');if(!c||camState.kind==='wide')return;c.classList.add('instant');camTo(-1,'wide');void c.offsetWidth;requestAnimationFrame(()=>c.classList.remove('instant'))}
function gatherBets(){camSnapWide();
  if(reducedMotion())return;
  const to=$('potChips').getBoundingClientRect(),tb=$('table').getBoundingClientRect();
  const tx=to.left+to.width/2,ty=to.top+to.height/2;
  S.players.forEach((p,i)=>{
    if(!p.bet)return;
    const src=(i===0?$('mine').querySelector('.mybet .stack'):$('spot'+i).querySelector('.chipwrap .stack'));if(!src)return;
    const r=src.getBoundingClientRect();if(!r.width)return;
    const el=document.createElement('div');el.className='potfly';el.innerHTML=chipStack(p.bet,false);
    el.style.left=(r.left+r.width/2-tb.left)+'px';el.style.top=(r.top+r.height/2-tb.top)+'px';
    $('table').appendChild(el);src.style.visibility='hidden';
    const lx=tx+(Math.random()*2-1)*to.width*.3-r.left-r.width/2,ly=ty+(Math.random()*2-1)*to.height*.25-r.top-r.height/2;S.potLand=(S.potLand||0)+1;const h0=S.handNo;
    el.animate([{transform:'translate(-50%,-50%)'},{transform:`translate(calc(-50% + ${lx}px),calc(-50% + ${ly}px))`,offset:.85},{transform:`translate(calc(-50% + ${lx}px),calc(-50% + ${ly-5}px))`,offset:.93},{transform:`translate(calc(-50% + ${lx}px),calc(-50% + ${ly}px))`}],
      {duration:620*SPEED(),easing:'cubic-bezier(.5,0,.3,1)',fill:'forwards'}).onfinish=()=>{el.remove();S.potLand=Math.max(0,(S.potLand||0)-1);if(!S.potLand&&S.handNo===h0&&!S.handOver)potGrow(potTotal()-S.players.reduce((a,p)=>a+p.bet,0))};
  });
}
// 山はハンドごとに作り直す。乱数はハンド番号から作るので、描き直しても形が変わらない
function potReset(){const e=$('potChips');if(e)e.innerHTML='';if(S)S.potPile={hand:S.handNo,chips:0,seed:(S.handNo*7919+(S.players?S.players.length:0)*131)%2147483646+1,shown:S.potPile?S.potPile.shown:0}}
function potRnd(){const P=S.potPile;P.seed=(P.seed*16807)%2147483647;return(P.seed-1)/2147483646}
function potGrow(pot){
  if(!S.potPile||S.potPile.hand!==S.handNo)potReset();
  const P=S.potPile,pile=$('potChips'),bb=BB()||1000,big=pot/bb,want=pot?Math.min(60,Math.round(5.5*Math.log2(big+1))):0;
  if(P.chips>=want)return;
  const mix=big<8?['c1','c1','c2','c3']:big<30?['c1','c3','c4','c2','c4']:['c4','c5','c3','c4','c6','c1','c4'];
  // v71（改善提案§1）：山は箱の上の端（場札の下端の側）より上に積まない。縦の6人卓は空きが少ないので、段を低く・横に広く
  const tight=S.players.length>4&&innerWidth<520&&innerHeight>innerWidth,W=190,H=78,news=[];let have=P.chips;
  while(have<want){const h=Math.min(want-have,1+Math.floor(potRnd()*(big<8?2:tight?2:4)));
    let x,y;do{x=potRnd()*2-1;y=potRnd()*2-1}while(x*x+y*y>1);
    const lo=11+4*h,spread=Math.min(1,.45+big/60),px=W/2+x*W*(tight?.52:.42)*spread,py=(H+lo)/2+y*(H-lo)/2*(tight?.7:.9)*spread;
    const el=document.createElement('span');el.className='col';el.style.height=(11+4*(h-1)+4)+'px';
    el.innerHTML=Array.from({length:h},(_,k)=>`<span class="chip ${mix[Math.floor(potRnd()*mix.length)]}" style="bottom:${k*4+4}px;left:${(potRnd()*3-1.5).toFixed(1)}px"></span>`).join('');
    el.style.left=(px-13)+'px';el.style.top=(py-(11+4*h))+'px';el.style.zIndex=Math.round(py);
    if(h===1&&potRnd()<.35)el.style.transform=`rotate(${(potRnd()*30-15).toFixed(0)}deg)`;
    pile.appendChild(el);news.push(el);have+=h}
  P.chips=have;potSignSoon();
  if(!reducedMotion())news.forEach((el,i)=>el.animate([{transform:(el.style.transform||'')+' translateY(-10px)',opacity:0},{transform:el.style.transform||'none',opacity:1}],{duration:260*SPEED(),delay:i*25*SPEED(),easing:'cubic-bezier(.3,1.4,.5,1)',fill:'backwards'}))}
// v71（改善提案§1）：場札の置き場（5枚の列ごと。1枚でも配ったら、まだ配っていない場所にもチップを置かない）。札は卓から立てて見せる・めくる時に少し浮くので、横は列の箱・縦は札の上下で見る
// （めくる途中で細くなっている札は使わない）
function boardRects(){return['boardCards','board2'].map(id=>$(id)).filter(e=>e&&!e.hidden&&e.offsetParent&&e.querySelector('.card:not(.slot)')).map(e=>{const r=e.getBoundingClientRect(),ks=[...e.children].map(c=>c.getBoundingClientRect()),mw=Math.max(0,...ks.map(c=>c.width)),cs=ks.filter(c=>c.width>mw*.8);
  return{left:r.left,right:r.right,top:Math.min(r.top,...cs.map(c=>c.top)),bottom:Math.max(r.bottom,...cs.map(c=>c.bottom)),width:r.width}}).filter(r=>r.width>1)}
// v71（改善提案§1）：それでもポットの山が場札にかかるとき（助言の帯で山が上がる・卓が低い横画面など）は、山ごと場札の下端より下へずらす。
// 位置合わせ（36_layout_pass）で fitTable の後に呼ぶ。ずらした量が変わったら金額札も置き直す
function potClear(){const p=$('potChips');if(!p)return;const was=p.style.translate||'';if(was)p.style.translate='';
  let v='';if(p.children.length){const R=e=>e.getBoundingClientRect(),bc=boardRects();
    const cs=[...p.querySelectorAll('.chip')].map(R).filter(r=>r.width>1);let d=0;
    if(bc.length&&cs.length)for(let k=0;k<3;k++){let n=d;for(const c of cs)for(const b of bc)if(c.left<b.right&&b.left<c.right&&c.top+d<b.bottom+2&&b.top<c.bottom+d)n=Math.max(n,b.bottom+3-c.top);if(n===d)break;d=n}
    if(d>0){const pr=R(p),k=pr.height/(p.offsetHeight||1)||1;v=`0px ${(d/k).toFixed(1)}px`}}
  if(v)p.style.translate=v;if(v!==was&&typeof LP!=='undefined'){LP.pot=true;layoutSoon()}}
// 金額札は平らな卓の外（2D）に置き、山の真下へ合わせる
function potSignPlace(){const s=$('potSign'),p=$('potChips'),t=$('table');if(!s||!p||!t||s.hidden||camState.kind!=='wide')return;const pr=p.getBoundingClientRect(),tr=t.getBoundingClientRect();if(!pr.height)return;
  // 実際に積んだチップの下端の少し下。自分のカードにかかるときは、カードの上へ逃がす
  let b=pr.top+pr.height*.6;for(const c of p.children){const r=c.getBoundingClientRect();if(r.height)b=Math.max(b,r.bottom)}
  const card=document.querySelector('#mine .card'),lim=card?card.getBoundingClientRect().top-s.offsetHeight-4:1e9;
  s.style.top=(Math.min(b+3,lim)-tr.top)+'px'}
addEventListener('resize',()=>{if(S)potSignPlace()});
// 金額札の数字を数え上げる（v71 改善提案§3：1ずつ回すと卓に無い額が見えるので、いちばん小さいチップ 1,000 単位で5段に分けて増やす）
let potCountT=0;
function potCount(to,ms){const pv=$('potSign').querySelector('.pv');if(!pv)return;const P=S.potPile||{};const from=P.shown||0;cancelAnimationFrame(potCountT);
  if(reducedMotion()||!ms||from===to){pv.textContent=fmt(to);P.shown=to;return}
  const t0=performance.now(),d=ms*SPEED();const f=now=>{const k=Math.min(1,(now-t0)/d);const q=Math.floor((1-Math.pow(1-k,3))*5)/5,v=k>=1?to:from+Math.round((to-from)*q/1000)*1000;P.shown=v;   // 数え上げ中に .pv が作り直されても、新しい方に書く（v71 レビュー）
    const el=$('potSign').querySelector('.pv');if(el)el.textContent=fmt(v);if(k<1)potCountT=requestAnimationFrame(f)};potCountT=requestAnimationFrame(f)}
// 配当：山ごと勝った人へ押し出す（分けるときは、山を交互に分けて飛ばす）
// 案3：山は名札へ飛ばして消すのではなく、勝った人の前のチップ（.mystack）の手前に残す。
//   山の中身は勝った額ちょうどのチップ（崩れたまま）。塔はその分を引いて描くので、数えれば持ち点に合う。
//   強いキャラ（rank3以上）とアオは 900ms 後に塔へ積み直す。弱いキャラは次のハンドの配りの前に積み直す
function wonNeat(i){const p=S.players[i];return !!p&&(i===0||rankOf(p.name)>=3)}
function wonTarget(i){const st=i===0?$('mine').querySelector('.mystack'):$('spot'+i)&&$('spot'+i).querySelector('.mystack');
  if(!st||!st.getClientRects().length||!st.getBoundingClientRect().width)return null;return st}
// 勝った額ちょうどのチップを、ばらして置く（乱数は席とハンドから。描き直しても同じ形）
function wonPileFill(st,i,amt){let pile=st.querySelector('.won-pile');if(!pile){pile=document.createElement('span');pile.className='won-pile';st.appendChild(pile)}
  let s=(S.handNo*9973+i*131+amt)%2147483646+1;const rnd=()=>{s=(s*16807)%2147483647;return(s-1)/2147483646};
  const chips=[];stackBreak(amt).forEach(d=>{for(let k=0;k<d.n;k++)chips.push(d.c)});
  const n=chips.length,W=Math.min(70,22+n*2.2);
  pile.innerHTML=chips.map((c,k)=>{let x,y;do{x=rnd()*2-1;y=rnd()*2-1}while(x*x+y*y>1);
    return`<span class="chip ${c}" style="left:${(W/2+x*W/2-13).toFixed(1)}px;top:${(9+y*8-Math.min(6,k/8)).toFixed(1)}px;transform:rotate(${(rnd()*50-25).toFixed(0)}deg);z-index:${Math.round(10+y*8)}"></span>`}).join('');
  pile.style.width=W+'px';pile.dataset.i=i;return pile}
// 山を塔へ吸い込ませてから、塔を新しい持ち点で描き直す
function wonRestack(i,quick){const W=S&&S.wonPile;if(!W||W.done[i])return;W.done[i]=true;
  const st=wonTarget(i),pile=(i===0?$('mine'):$('spot'+i))&&(i===0?$('mine'):$('spot'+i)).querySelector('.won-pile');
  if(pile&&!quick&&!reducedMotion()&&st){const tb=$('table').getBoundingClientRect(),tw=st.querySelector('.trow')||st,tr=tw.getBoundingClientRect(),tx=tr.left+tr.width/2,ty=tr.top+4;
    // 塔の描き直しで山が消えても動きが続くよう、卓の上の層に写してから吸い込ませる
    [...pile.children].forEach((c,k)=>{const r=c.getBoundingClientRect();if(!r.width)return;const f=document.createElement('div');f.className='potfly wonfly';f.innerHTML=`<span class="chip ${[...c.classList].filter(x=>/^c\d$/.test(x)).join(' ')}"></span>`;
      f.style.left=(r.left+r.width/2-tb.left)+'px';f.style.top=(r.top+r.height/2-tb.top)+'px';$('table').appendChild(f);
      f.animate([{transform:'translate(-50%,-50%) '+(c.style.transform||''),opacity:1},{transform:`translate(calc(-50% + ${(tx-r.left-r.width/2).toFixed(1)}px),calc(-50% + ${(ty-r.top-r.height/2).toFixed(1)}px))`,opacity:.15}],
        {duration:450*SPEED(),delay:k*30*SPEED(),easing:'ease',fill:'both'}).onfinish=()=>f.remove()})}
  if(pile)pile.remove();if(S&&S.players)render()}
// 次のハンドの最初（配る前）：崩れた山を全部塔へ戻す
function wonClearAll(){const W=S&&S.wonPile;if(W)Object.keys(W.amt).forEach(i=>{if(!W.done[i])wonRestack(+i)});
  document.querySelectorAll('#table .won-pile').forEach(e=>e.remove());if(S)S.wonPile=null}
function potPush(){camSnapWide();
  const pile=$('potChips'),ws=S.players.map((p,i)=>i).filter(i=>S.players[i].won>0);
  const done=()=>{pile.innerHTML='';if(S.potPile)S.potPile.chips=0;S.potPushing=false;$('potSign').hidden=true};
  // 勝った分の山：いまの塔から引く額（見えない間も、山の中のチップは数に入る）
  const W=S.wonPile={hand:S.handNo,amt:{},done:{}};
  ws.forEach(i=>{const st=wonTarget(i);if(!st||reducedMotion()){W.done[i]=true;return}W.amt[i]=S.players[i].won;wonPileFill(st,i,W.amt[i]).classList.add('wait')});
  render();
  if(!ws.length||!pile.children.length||reducedMotion()){done();ws.forEach(i=>{if(!W.done[i]){const p=document.querySelector(`.won-pile[data-i="${i}"]`);if(p)p.classList.remove('wait');if(wonNeat(i))setTimeout(()=>{if(S.wonPile===W)wonRestack(i)},900*SPEED())}});return}
  const tb=$('table').getBoundingClientRect(),pr=pile.getBoundingClientRect();if(!pr.width){done();Object.keys(W.amt).forEach(i=>wonRestack(+i,true));return}
  S.potPushing=true;$('potSign').hidden=false;potCount(0,500);
  const kids=[...pile.children],groups=ws.map(()=>document.createElement('div'));
  kids.forEach((c,k)=>groups[k%ws.length].appendChild(c));
  let left=groups.length;
  groups.forEach((g,gi)=>{const i=ws[gi],wp=document.querySelector(`.won-pile[data-i="${i}"]`),tgt=wp||(i===0?$('mine').querySelector('.me-r'):$('plate'+i));
    g.className='potmove';g.style.left=(pr.left-tb.left)+'px';g.style.top=(pr.top-tb.top)+'px';$('table').appendChild(g);
    // 卓は斜めに見えているので、はじめは山の見た目の大きさに合わせてから飛ばす
    const sx=(pr.width/190).toFixed(3),sy=(pr.height/78).toFixed(3);g.style.transformOrigin='0 0';
    const r=tgt?tgt.getBoundingClientRect():pr,dx=r.left+r.width/2-pr.left-pr.width/2,dy=r.top+r.height/2-pr.top-pr.height/2,n=Math.hypot(dx,dy)||1;
    const fx=r.left+r.width/2-pr.left-.55*95,fy=r.top+r.height/2-pr.top-.55*39;
    const land=()=>{g.remove();if(wp&&S.wonPile===W){wp.classList.remove('wait');if(wonNeat(i))setTimeout(()=>{if(S.wonPile===W)wonRestack(i)},900*SPEED())}if(--left===0)done()};
    g.animate([{transform:`scale(${sx},${sy})`,opacity:1},{transform:`translate(${(-dx/n*6).toFixed(1)}px,${(-dy/n*6).toFixed(1)}px) scale(${sx},${sy})`,opacity:1,offset:.18},{transform:`translate(${fx.toFixed(1)}px,${fy.toFixed(1)}px) scale(.55)`,opacity:wp?.9:.1}],
      {duration:750*SPEED(),easing:'cubic-bezier(.6,0,.3,1)',fill:'forwards'}).onfinish=land})}
function potRect(){const e=$('potChips');const r=e&&e.getBoundingClientRect();return r&&r.width?r:null}
