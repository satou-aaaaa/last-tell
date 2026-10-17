/* ---------- チェックの手：コン、コン（2026-10-10 satou 決定 案1＋2＋3。research/チェックの見せ方_実装仕様.md）
   - チェックした人の前のラシャを、その人の決まった叩き方で叩く（叩き方は人ごとに1つ。手の強さ・乱数で変えない＝テルにしない）
   - 動きは行動が決まったあと（afterAct）に始める。CPU の判断と考える時間には触れない
   - 全員がチェックで回ったら、ディーラーが卓を1回叩いて「チェック、アラウンド」
   - 手と波紋は #fxLayer（卓の上の層）に置く。名札・.mystack・.chipwrap には触らない */
const CHECK_BY_RANK={1:{k:'palm',n:2},2:{k:'knuckle',n:2},3:{k:'knuckle',n:1},4:{k:'finger',n:1},5:{k:'finger',n:1}};
const CHECK_STYLE={
  'ゲン':{k:'fist',n:2,loud:1,say:{ja:'チェック！',en:'Check!'}},
  'タロウ':{k:'palm',n:2,say:{ja:'チェックで',en:'Check, please.'}},
  'ミナ':{k:'finger',n:1},
  'レイカ':{k:'palm',n:1},
  'ハヤト':{k:'knuckle',n:1,loud:1},
  'ゴウ':{k:'fist',n:1,loud:1},
  'ジン':{k:'finger',n:1},
  '若き日のジン':{k:'knuckle',n:2},
  'あなた':{k:'knuckle',n:2},
};
const checkStyle=name=>CHECK_STYLE[name]||CHECK_BY_RANK[rankOf(name)]||CHECK_BY_RANK[2];
const CHECK_AROUND={ja:'チェック、アラウンド',en:'Check around.'};
Object.assign(EN_DICT,{'チェック！':'Check!','チェックで':'Check, please.','チェック、アラウンド':'Check around.','ディーラー：全員チェック':'Dealer: checked around'});

/* 手の絵（指先が上。CPU は 180 度回して、卓の奥から手前へ伸ばす） */
function handSVG(k){
  const sk='var(--hskin)',sk2='var(--hskin2)',sl='var(--hsleeve)';
  if(k==='finger')return`<svg viewBox="0 0 40 70" aria-hidden="true"><rect x="12" y="40" width="16" height="30" fill="${sl}"/><path d="M10 44 Q8 30 14 28 L26 28 Q32 30 30 44 Z" fill="${sk2}"/><rect x="17" y="2" width="7" height="30" rx="3.5" fill="${sk}"/></svg>`;
  if(k==='palm')return`<svg viewBox="0 0 60 70" aria-hidden="true"><rect x="20" y="52" width="20" height="18" fill="${sl}"/><path d="M8 30 Q6 10 14 8 L46 8 Q54 10 52 30 L44 54 L16 54 Z" fill="${sk}"/><path d="M14 10 V26 M24 6 V24 M34 6 V24 M44 10 V26" stroke="${sk2}" stroke-width="1.5"/></svg>`;
  if(k==='fist')return`<svg viewBox="0 0 60 70" aria-hidden="true"><rect x="18" y="48" width="24" height="22" fill="${sl}"/><path d="M8 22 Q8 8 20 8 L42 8 Q54 8 52 24 L48 50 L14 50 Z" fill="${sk2}"/><path d="M12 12 h36" stroke="${sk}" stroke-width="7" stroke-linecap="round"/></svg>`;
  if(k==='two')return`<svg viewBox="0 0 44 70" aria-hidden="true"><rect x="13" y="44" width="18" height="26" fill="${sl}"/><path d="M10 48 Q8 34 14 32 L30 32 Q36 34 34 48 Z" fill="${sk2}"/><rect x="14" y="4" width="7" height="32" rx="3.5" fill="${sk}"/><rect x="23" y="6" width="7" height="30" rx="3.5" fill="${sk}"/></svg>`;
  return`<svg viewBox="0 0 50 70" aria-hidden="true"><rect x="16" y="46" width="18" height="24" fill="${sl}"/><path d="M8 22 Q8 10 16 10 L34 10 Q42 10 42 22 L38 48 L12 48 Z" fill="${sk}"/><g fill="${sk2}"><circle cx="14" cy="14" r="3.4"/><circle cx="21.5" cy="12" r="3.6"/><circle cx="29" cy="12" r="3.6"/><circle cx="36" cy="14" r="3.4"/></g></svg>`;
}
const HAND_W={finger:.62,knuckle:.9,palm:1.05,fist:1.0,two:.72}; // 札1枚の幅に対する手の幅
/* 卓の上の層。#table の直下（カメラの外）に1つだけ作る */
function fxLayer(){let L=$('fxLayer');const t=$('table');if(!L&&t){L=document.createElement('div');L.id='fxLayer';L.className='fxlayer';L.setAttribute('aria-hidden','true');t.appendChild(L)}return L}
function fxRect(el){const t=$('table');if(!el||!t)return null;const r=el.getBoundingClientRect(),tr=t.getBoundingClientRect();if(!r.width&&!r.height)return null;return{x:r.left-tr.left,y:r.top-tr.top,w:r.width,h:r.height}}
/* 席の「前」（札の手前、ポット側）の点と、札1枚の幅 */
function seatFront(i){
  if(i===0){const h=$('mine')&&$('mine').querySelector('.hold');const r=fxRect(h);if(!r)return null;const c=h.querySelector('.card'),cw=c?c.getBoundingClientRect().width:40;
    return{x:r.x+r.w/2,y:r.y-4,cw:Math.min(cw,44),me:1}}
  const sp=$('spot'+i),h=sp&&sp.querySelector('.hand');const r=fxRect(h);if(!r)return null;const c=h.querySelector('.card'),cw=c?c.getBoundingClientRect().width:28;
  return{x:r.x+r.w/2,y:r.y+r.h+Math.max(4,cw*.18),cw}
}
let knockKey='';
function knockAt(pt,st,opt){
  opt=opt||{};const L=fxLayer();if(!L||!pt)return;const n=st.n||1,hard=st.k==='fist'||!!st.loud,sp=SPEED();
  const gap=(st.k==='fist'?230:st.k==='palm'?260:190)*sp;
  const ring=k=>{const r=document.createElement('div');r.className='knockring';const d=pt.cw*(st.k==='fist'?1.3:st.k==='finger'?.6:.95);
    r.style.width=r.style.height=d+'px';r.style.transform=`translate(${pt.x-d/2}px,${pt.y-d/2}px)`;L.appendChild(r);
    r.animate([{opacity:.85,transform:`translate(${pt.x-d/2}px,${pt.y-d/2}px) scale(.25)`},{opacity:0,transform:`translate(${pt.x-d/2}px,${pt.y-d/2}px) scale(1.5)`}],{duration:460*sp,easing:'ease-out'}).onfinish=()=>r.remove()};
  for(let k=0;k<n;k++)setTimeout(()=>{try{Sound.sfx(hard?'knockHard':'knock')}catch(e){}if(!reducedMotion())ring(k)},180*sp+k*gap+gap*.45);
  if(reducedMotion())return;
  const w=Math.max(18,pt.cw*(HAND_W[st.k]||.9)*1.15),h=w*70/(st.k==='finger'?40:st.k==='two'?44:st.k==='knuckle'?50:60);
  const el=document.createElement('div');el.className='knockhand';el.style.width=w+'px';el.innerHTML=handSVG(st.k);L.appendChild(el);
  // 指先が pt に来る位置。あなたは下から（回さない）、相手と卓の奥のディーラーは上から（180度）
  const up=!!pt.me,lift=h*(st.k==='fist'?.32:st.k==='finger'?.16:.24);
  const base=up?`translate(${pt.x-w/2}px,${pt.y}px)`:`translate(${pt.x-w/2}px,${pt.y-h}px)`;
  const rot=up?'':' rotate(180deg)',o=up?'50% 0':'50% 50%';el.style.transformOrigin=o;
  const pos=d=>`${base} translateY(${up?d:-d}px)${rot}`;
  const dur=180*sp+n*gap+240*sp,F=[{opacity:0,transform:pos(lift*1.6),offset:0},{opacity:1,transform:pos(lift),offset:180*sp/dur}];
  for(let k=0;k<n;k++){F.push({opacity:1,transform:pos(0),offset:(180*sp+k*gap+gap*.45)/dur});if(k<n-1)F.push({opacity:1,transform:pos(lift),offset:(180*sp+(k+1)*gap)/dur})}
  F.push({opacity:1,transform:pos(lift),offset:(dur-120*sp)/dur},{opacity:0,transform:pos(lift*1.6),offset:1});
  el.animate(F,{duration:dur,easing:'ease-out'}).onfinish=()=>el.remove();
}
function knockCheck(i){
  if(!S||!S.players)return;const p=S.players[i];if(!p||p.out||p.sitOut)return;
  const key=S.handNo+':'+S.street+':'+i;if(knockKey===key)return;knockKey=key;
  knockAt(seatFront(i),checkStyle(p.human?'あなた':p.name));
}
/* 全員チェックで回ったか（プリフロップは BB のチェックなので出さない） */
let aroundKey='';
function checkAroundDue(){
  if(!S||!S.players||S.runout||S.handOver||S.street==='preflop'||S.street==='showdown'||S.currentBet!==0)return false;
  const live=S.players.filter(p=>inHand(p)&&!p.sitOut);if(live.length<2)return false;
  return live.every(p=>p.allIn||p._chk===S.handNo+':'+S.street);
}
function checkAround(){
  const key=S.handNo+':'+S.street;if(aroundKey===key)return;aroundKey=key;
  const pz=document.querySelector('.felt .potzone'),r=fxRect(pz),c=document.querySelector('#boardCards .card');
  const cw=c?c.getBoundingClientRect().width*.9:30;
  if(r)knockAt({x:r.x+r.w*.5,y:r.y+Math.min(10,r.h*.2),cw},{k:'palm',n:1});
  dealerSay(CHECK_AROUND.ja);log('ディーラー：全員チェック');
  S.hold=Math.max(S.hold||0,500*SPEED());
}
/* つなぎ：afterAct のあとで叩く。ゲン・タロウの声は札（lastAct）だけ。吹き出しは使わない（ゲンの talk テルと混ざらないため） */
{const o=afterAct;afterAct=function(i,type,toCall){const r=o.apply(this,arguments);
  try{const p=S.players[i];if(type==='call'&&toCall<=0&&!p.allIn){p._chk=S.handNo+':'+S.street;
      const st=checkStyle(p.human?'あなた':p.name);if(st.say&&!p.human)p.lastAct=st.say.ja;
      if(!(S.angleHand===S.handNo&&S._tapKnock===i))knockCheck(i)}}catch(e){}
  return r}}
{const o=proceed;proceed=function(){try{if(checkAroundDue()&&roundComplete())checkAround()}catch(e){}return o.apply(this,arguments)}}
/* アングル「テーブルを叩いたのでチェック」：叩く手を見せる（act のあとでもう一度は叩かない） */
{const o=angleCall;angleCall=function(i,kind){const r=o.apply(this,arguments);
  try{if(kind==='faketap'){S._tapKnock=i;knockCheck(i)}}catch(e){}return r}}
