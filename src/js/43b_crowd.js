/* ---------- 人だかり（改善提案 2026-10-15b 案4。satou 2026-10-17「すべて対応」で 1.0 に。research/改善提案_2026-10-15b_実装仕様.md） ---------- */
// オールインがコールされたとき（S.runout）、またはリバーでポットが 40BB 以上のとき、卓の奥に影の立ち姿が2〜3人並ぶ。
// 影は相手の上半身（.busts）より奥の層なので、札・名札・ボタンには重ならない。形と色は店の奥の客の影（41_live_look.js 案5）と同じ。
// 結果が出たら「おお……」系の小さな声が1行（#crowdSay、卓の真ん中）出て、影が消える。人だかりが出たハンドの次は、隣の卓の声を出さない。
// 第7章の最後の手と顔のアップ中は、影を左右の端だけに置く。動きは opacity と transform だけ（フィルター禁止）。回想では出さない。
const CROWD={potBB:40,afterMs:1800,lines:['おお……','……今の、見たか','すげえな']};
function crowdEl(){const tb=$('table'),rm=tb&&tb.querySelector('.room');if(!rm)return null;let c=tb.querySelector('.ltcrowd');
  if(!c){c=document.createElement('div');c.className='ltcrowd';c.setAttribute('aria-hidden','true');c.innerHTML='<i class="cr1"></i><i class="cr2"></i><i class="cr3"></i>';
}
  if(c.previousElementSibling!==rm)rm.after(c);   // 店の奥（.room）のすぐ上、相手の上半身より奥。カメラの層（#cam）ができると .room が移るので、毎回そろえる
  return c}
const crowdEdge=()=>(S.finalHand&&CFG.ch&&!CFG.ch.p2&&CFG.ch.no===7)||(typeof camState!=='undefined'&&camState&&camState.kind&&camState.kind!=='wide');
function crowdHide(){const c=document.querySelector('#table .ltcrowd');if(c){c.classList.remove('cr-on');clearTimeout(c._t)}const v=$('crowdSay');if(v){v.classList.remove('go');v.hidden=true}}
// 声は影と別の部品（#crowdSay）にして、相手の上半身・吹き出しより手前に出す。卓の真ん中で、札・名札・吹き出し・ボタン・心の声に重ならない高さを選ぶ
// （v88 レビュー：影の層の中に置いた声は、横・PC で左の席の吹き出しの後ろに隠れていた）
function crowdSay(t){const tb=$('table');if(!tb)return;let v=$('crowdSay');
  if(!v){v=document.createElement('div');v.id='crowdSay';v.className='ltcrowd-say';v.setAttribute('aria-hidden','true');tb.appendChild(v)}
  v.textContent=t;v.hidden=false;v.classList.toggle('still',reducedMotion());v.classList.remove('go');void v.offsetWidth;v.classList.add('go');crowdPlace();clearTimeout(v._p);v._p=setTimeout(()=>{try{crowdPlace()}catch(e){}},450)}   // 吹き出しが後から出たら置き直す
function crowdPlace(){const v=$('crowdSay'),tb=$('table');if(!v||v.hidden||!tb)return;
  v.style.left='';v.style.right='';   // 真ん中に戻して幅を測る
  const T=tb.getBoundingClientRect(),h=v.offsetHeight||22,w=v.offsetWidth,vis=e=>e&&e.getClientRects().length&&e.getBoundingClientRect().width>2&&getComputedStyle(e).visibility!=='hidden',R=e=>e.getBoundingClientRect();
  const av=[...document.querySelectorAll('#table button, #felt .card, .felt .spot .hand:not(.folded):not(.muck) .card, #plates .cue, #plates .plate, [id^=plate]:not(#plates), #dcall.go, #mine .card, #potChips .chip, #dbtn, .dbadge, .llseats i, .felt .boardspot > .lltools:not(.off)')].filter(vis).map(e=>{const r=R(e);return{left:r.left-2,right:r.right+2,top:r.top-2,bottom:r.bottom+2}});
  av.push(...[...document.querySelectorAll('#sayLayer .say.go, #plates .say.go, #mfInner:not([hidden]), #potSign')].filter(vis).map(e=>{const r=R(e);return{left:r.left-4,right:r.right+4,top:r.top-4,bottom:r.bottom+4,k:4}}));
  // 相手の顔（目と口）も避ける（v89 レビュー：iPhone の横で、真ん中の人の口元にかかっていた）
  {const L0=$('sayLayer'),lr=L0&&R(L0);if(lr&&typeof faceBox==='function')S.players.forEach((p,i)=>{if(!i||p.out)return;const f=faceBox(i);if(f)av.push({left:lr.left+f.l,right:lr.left+f.r,top:lr.top+f.t,bottom:lr.top+f.b,k:3})})}
  const bd=$('boardCards'),bb=vis(bd)?R(bd):null,ys=[];
  if(bb){ys.push(bb.top-h-6,bb.bottom+6)}ys.push(T.top+6,T.top+T.height*.45,T.top+T.height*.55);
  const xs=[T.left+(T.width-w)/2,T.left+T.width*.25-w/2,T.left+T.width*.75-w/2].map(x=>Math.max(T.left+4,Math.min(T.right-4-w,x)));   // 真ん中が埋まっていれば左右も試す
  const cost=(x,y)=>av.reduce((a,r)=>a+(r.k||1)*Math.max(0,Math.min(x+w,r.right)-Math.max(x,r.left))*Math.max(0,Math.min(y+h,r.bottom)-Math.max(y,r.top)),0);
  let bx=xs[0],by=ys[0],bc=Infinity;const tryAt=(x,y)=>{if(y<T.top+2||y+h>T.bottom-2)return;const c=cost(x,y);if(c<bc){bc=c;bx=x;by=y}};
  for(const x of xs){for(const y of ys){tryAt(x,y);if(!bc)break}if(!bc)break}
  if(bc>0){const x0=bx,y0=by;for(let d=4;d<=60&&bc>0;d+=4)for(const y of [y0-d,y0+d])tryAt(x0,y)}
  v.style.top=(by-T.top).toFixed(0)+'px';if(Math.abs(bx-xs[0])>1){v.style.left=(bx-T.left).toFixed(0)+'px';v.style.right='auto'}}
LT.on('layout',()=>{try{crowdPlace()}catch(e){}});
LT.on('startHand',()=>{try{crowdHide()}catch(e){}});
LT.on('render',()=>{try{
  if(!S||!S.players||CFG.flashback||S.handOver)return;
  const c0=document.querySelector('#table .ltcrowd');if(c0&&c0.classList.contains('cr-on'))c0.classList.toggle('cr-edge',crowdEdge());
  if(S.crowdHand===S.handNo)return;
  if(!(S.runout||(S.street==='river'&&potTotal()>=CROWD.potBB*BB())))return;
  S.crowdHand=S.handNo;S.nvNext=Math.max(S.nvNext||0,S.handNo+2);   // このハンドの終わりと次のハンドの終わりは、隣の卓の声を出さない
  const c=crowdEl();if(!c)return;c.classList.toggle('cr-n3',LT.rand()<.5);c.classList.toggle('cr-edge',crowdEdge());c.classList.toggle('cr-still',reducedMotion());
  void c.offsetWidth;c.classList.add('cr-on')}catch(e){}});
LT.on('endHand',()=>{try{
  const c=document.querySelector('#table .ltcrowd');if(!c||!c.classList.contains('cr-on')||S.crowdHand!==S.handNo)return;
  const t=CROWD.lines[Math.floor(LT.rand()*CROWD.lines.length)];crowdSay(t);
  if(reducedMotion())log(t);
  clearTimeout(c._t);c._t=setTimeout(()=>crowdHide(),CROWD.afterMs*(typeof SPEED==='function'?Math.max(.6,SPEED()):1))}catch(e){}});
