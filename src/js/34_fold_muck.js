/* ---------- フォールドの捨て札（2026-10-10 satou 決定 1.0＝案1＋2＋3。research/フォールドの見せ方_実装仕様.md）
   - 降りた人の2枚が伏せたまま前へ出て、ディーラーの手のひらが捨て札の山（ポットの右隣）へ引き寄せる
   - 捨て方は人ごとに1つ（slide／place／flick）。手の強さ・乱数で変えない（テルにしない）。番の前の「降りる準備」は入れない
   - ショーダウンで伏せる人（p.mucked）も同じ動き。誰が伏せるかは今の処理（revealThenShowdown の p.muckPlan、あなたの「伏せる」設定）のまま
   - 動きは afterAct／render のあと。CPU の判断と考える時間には触れない
   - 手と札は #fxLayer、山は場札の左隣（.boardspot の中の .muckpile）。名札・.mystack・.chipwrap には触らない */
const FOLD_BY_RANK={1:{k:'place'},2:{k:'place'},3:{k:'slide'},4:{k:'slide'},5:{k:'slide'}};
const FOLD_STYLE={
  'ゲン':{k:'flick',loud:1,tag:{ja:'降り！',en:'I\'m out!'}},
  'ゴウ':{k:'flick',loud:1},
  'ミナ':{k:'place'},
  'タロウ':{k:'place',tag:{ja:'降ります',en:'I fold.'}},
  'レイカ':{k:'slide'},
  'ハヤト':{k:'slide'},
  'ジン':{k:'slide'},
  '若き日のジン':{k:'slide'},
  'あなた':{k:'slide'},
};
const foldStyle=name=>FOLD_STYLE[name]||FOLD_BY_RANK[rankOf(name)]||FOLD_BY_RANK[3];
const FOLD_MS={slide:380,place:820,flick:460,push:320,sweep:700,gather:800};
const MUCK_MESS=[[-1.2,-.8,-14],[1,.6,22],[-.4,1.2,6],[1.4,-1,-30],[-1.6,.9,38],[.6,-1.4,-4],[.2,.3,15],[-.9,-.2,-24]];
const FOLD_GONE={ja:'降りた手',en:'Folded'};
Object.assign(EN_DICT,{'降り！':'I\'m out!','降ります':'I fold.','捨てた手':'Folded','降りた手':'Folded','伏せた':'Mucked'});

let muckHand=-1,muckN=0;const muckDone={};
// 捨て札の山は場札の左隣（卓の奥のディーラーの手元。ポットとあなたの手元から離す）
function muckPile(){const bs=document.querySelector('.felt .boardspot');if(!bs)return null;let m=bs.querySelector(':scope > .muckpile');
  if(!m){m=document.createElement('div');m.className='muckpile';m.setAttribute('aria-hidden','true');bs.appendChild(m)}return m}
function muckAdd(){const m=muckPile();if(!m||m.children.length>=12)return;const j=muckN++%MUCK_MESS.length,[x,y,a]=MUCK_MESS[j];
  const c=document.createElement('div');c.className='muckcard';const k=innerWidth<700?4:6;c.style.transform=`translate(${x*k}px,${y*k*.8}px) rotate(${a}deg)`;c.innerHTML=cardHTML({},true);m.appendChild(c)}
function muckReset(){const m=document.querySelector('.felt .boardspot > .muckpile');if(m)m.innerHTML='';muckN=0}
/* ハンドの終わり：ディーラーの手のひらが山を奥へ集める */
function muckGather(){
  const m=document.querySelector('.felt .boardspot > .muckpile');if(!m||!m.children.length)return;
  if(reducedMotion()){muckReset();return}
  // 山の写しを集める動きにして、本物の山はすぐ空にする（次のハンドの捨て札と混ざらないように）
  const old=m.cloneNode(true);old.classList.add('old');m.parentNode.appendChild(old);muckReset();
  const r=fxRect(old),c=old.querySelector('.card');const cw=c?c.getBoundingClientRect().width:20;
  if(r){const L=fxLayer(),w=cw*1.1,h=w*70/60,el=document.createElement('div');el.className='foldhand';el.style.width=w+'px';el.innerHTML=handSVG('palm');L.appendChild(el);
    const P=(x,y)=>`translate(${r.x-w/2+x}px,${r.y-h+y}px) rotate(180deg)`;el.style.transformOrigin='50% 50%';
    LT.anim(el,[{opacity:0,transform:P(0,-h*.6)},{opacity:1,transform:P(0,0),offset:.3},{opacity:1,transform:P(0,-h*.7),offset:.85},{opacity:0,transform:P(0,-h*.9)}],{duration:FOLD_MS.gather*SPEED(),easing:'ease-in-out'},()=>el.remove())}
  const oy=parseFloat((old.style.translate||'').split(' ')[1])||0;LT.anim(old,[{opacity:1,translate:`0 ${oy}px`},{opacity:1,translate:`0 ${oy}px`,offset:.3},{opacity:0,translate:`0 ${oy-cw*1.2}px`}],{duration:FOLD_MS.gather*SPEED(),easing:'ease-in'},()=>old.remove());
}
/* 降りた人の札（2枚）の今の位置：CPU は席の札、あなたは手元の札 */
function foldFrom(i){
  const h=i===0?$('mine')&&$('mine').querySelector('.hold'):$('spot'+i)&&$('spot'+i).querySelector('.hand');if(!h)return[];
  return[...h.querySelectorAll('.card')].slice(0,2).map(fxRect).filter(Boolean);
}
function foldMuck(i,opt){
  opt=opt||{};const p=S.players[i];if(!p)return;const st=foldStyle(p.human?'あなた':p.name),sp=SPEED();
  const L=fxLayer(),pile=muckPile(),to=pile&&fxRect(pile);
  const from=foldFrom(i);
  try{Sound.sfx(st.loud?'flick':'slide')}catch(e){}
  if(reducedMotion()||!L||!to||!from.length){muckAdd();muckAdd();return}
  const px=to.x+to.w/2,py=to.y+to.h/2; // 山の中心
  const tw=Math.min(22,from[0].w);
  const kind=opt.showdown?'slide':st.k,mv=FOLD_MS[kind]*sp,push=FOLD_MS.push*sp,sweep=FOLD_MS.sweep*sp;
  // 押し出す手（指2本、flick は弾く手）
  {const f=from[0],w=f.w*.8,h=w*70/44,el=document.createElement('div');el.className='foldhand';el.style.width=w+'px';el.innerHTML=handSVG('two');L.appendChild(el);
    const cx=from.length>1?(from[0].x+from[1].x+from[1].w)/2:f.x+f.w/2,me=i===0;
    const P=d=>me?`translate(${cx-w/2}px,${f.y+f.h*.35+d}px)`:`translate(${cx-w/2}px,${f.y+f.h*.65-h-d}px) rotate(180deg)`;el.style.transformOrigin='50% 50%';
    LT.anim(el,[{opacity:0,transform:P(f.h*.4)},{opacity:1,transform:P(0),offset:.25},{opacity:1,transform:P(-f.h*(kind==='flick'?.55:.35)),offset:.65},{opacity:0,transform:P(-f.h*.2)}],{duration:(push+mv*.4),easing:'ease-out'},()=>el.remove())}
  from.forEach((f,k)=>{
    const el=document.createElement('div');el.className='flycard';el.style.width=f.w+'px';
    el.innerHTML=i===0&&opt.flipFrom?cardHTML(p.hand[k],false):cardHTML({},true);L.appendChild(el);
    const sx=f.x,sy=f.y,dx=px-f.w/2+(k?3:-3),dy=py-f.h/2+(k?2:-2);
    const mx=sx+(dx-sx)*.3,my=sy+(dy-sy)*.3,s1=tw/f.w;
    const spin=kind==='flick'?(k?320:290):kind==='place'?0:(k?8:-6),settle=MUCK_MESS[(muckN+k)%MUCK_MESS.length][2];
    const T=(x,y,r,s)=>`translate(${x}px,${y}px) rotate(${r}deg) scale(${s})`;
    const F=[{transform:T(sx,sy,0,1)}];
    if(i===0&&opt.flipFrom)F.push({transform:T(sx,sy,0,1)+' scaleX(0)',offset:.06});
    F.push({transform:T(mx+(kind==='flick'?(dx-sx)*.06:0),my,spin*.6,.85),offset:.38},{transform:T(mx,my,spin,.85),offset:.5},{transform:T(dx,dy,spin+settle,s1),offset:1});
    LT.anim(el,F,{duration:push+mv+sweep,easing:kind==='place'?'ease-in-out':'cubic-bezier(.3,.7,.3,1)',fill:'forwards'},()=>{el.remove();muckAdd()});
    if(i===0&&opt.flipFrom)setTimeout(()=>{el.innerHTML=cardHTML({},true)},(push+mv+sweep)*.06);
  });
  // ディーラーの手のひら（卓の奥から、札を山へ引き寄せる）
  setTimeout(()=>{const w=tw*1.2,h=w*70/60,el=document.createElement('div');el.className='foldhand';el.style.width=w+'px';el.innerHTML=handSVG('palm');L.appendChild(el);el.style.transformOrigin='50% 50%';
    const ax=from[0].x+(px-from[0].x)*.3,ay=from[0].y+(py-from[0].y)*.3+from[0].h*.4;
    const P=(x,y)=>`translate(${x-w/2}px,${y-h}px) rotate(180deg)`;
    LT.anim(el,[{opacity:0,transform:P(ax,ay-h*.4)},{opacity:1,transform:P(ax,ay),offset:.2},{opacity:1,transform:P(px,py),offset:.85},{opacity:0,transform:P(px,py-h*.5)}],{duration:sweep*1.15,easing:'ease-in-out'},()=>el.remove())},push+mv*.5);
}
/* つなぎ：render のあとで、このハンドで新しく降りた／伏せた人を探して動かす */
function goneText(p){const hide=peekOn()&&!p.peeked;const w=p.mucked&&!p.folded?'伏せた':FOLD_GONE.ja;return hide||!p.hand.length?w:w+'　'+p.hand.map(cardStr).join(' ')}
{const o=render;render=function(){const r=o.apply(this,arguments);
  try{if(!S||!S.players)return r;
    if(S.handNo!==muckHand){if(typeof muckAvoidCancel==='function')muckAvoidCancel();if(muckHand>=0)muckGather();else muckReset();muckHand=S.handNo;for(const k in muckDone)delete muckDone[k]}
    S.players.forEach((p,i)=>{if(p.out||p.sitOut)return;
      const gone=p.folded||p.mucked&&(!p.show||p.human);
      if(i===0){const h=$('mine')&&$('mine').querySelector('.hold');if(h&&gone&&muckDone[0]){h.classList.add('gone');h.dataset.gone=goneText(p)}}
      else if(gone&&muckDone[i]){const h=$('spot'+i)&&$('spot'+i).querySelector('.hand');if(h)h.classList.add('mucked-away')}
      if(!gone||muckDone[i])return;muckDone[i]=1;
      foldMuck(i,{showdown:!p.folded,flipFrom:i===0&&!(peekOn()&&!p.peeked)&&!p.mucked});
      if(i===0){const h=$('mine').querySelector('.hold');if(h){h.classList.add('gone');h.dataset.gone=goneText(p)}}
      else{const h=$('spot'+i)&&$('spot'+i).querySelector('.hand');if(h)h.classList.add('mucked-away')}
    })}catch(e){}
  return r}}
/* ゲン・タロウの「降り！」「降ります」は札（lastAct）の文字だけ。吹き出しは使わない */
{const o=afterAct;afterAct=function(i,type,toCall){const r=o.apply(this,arguments);
  try{const p=S.players[i];if(type==='fold'&&!p.human){const st=foldStyle(p.name);if(st.tag)p.lastAct=st.tag.ja}}catch(e){}return r}}
