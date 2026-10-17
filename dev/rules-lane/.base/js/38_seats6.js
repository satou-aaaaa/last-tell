/* ---------- 大人数卓のテル（2026-10-14 satou 決定 案1＋案2。research/大人数卓のテル_実装仕様.md） ---------- */
// 案1：スマホ縦の6人卓は「卓を囲む並び」。奥に3人（24/50/76%）、左右の手前に1人ずつ。
//   左右の2人は今の .busts の層だと卓の後ろに隠れるので、卓より手前の層 #bustsSide へ移す（id はそのまま）。
//   20_state.js の buildSeats は変えず、描き直しの後の位置合わせ（合図 'layout'）で並べ直す。向きが変わったら元に戻す。
// 案2：テルが出た人は約2秒、身を乗り出す（.lean）。表示だけで、テルの出る確率や CPU は変えない。
const SEAT6={x:{1:11,2:24,3:50,4:76,5:89},spot:{1:[20,26],2:[34,11],3:[50,11],4:[66,11],5:[80,26]},say:{1:27,2:24,4:76,5:73}};
const seat6Port=()=>matchMedia('(orientation:portrait) and (max-width:699px)').matches;
function seat6Side(){let s=$('bustsSide');if(!s){const cam=$('cam');if(!cam)return null;s=document.createElement('div');s.id='bustsSide';s.className='busts side';cam.insertBefore(s,$('plates'));
  s.addEventListener('click',e=>{const b=e.target.closest('.bust');if(b&&typeof tapFace==='function')tapFace(+b.id.replace('bust',''))})}return s}
// 元の値を覚えてから書く／戻す
function seat6Set(el,prop,v){if(!el)return;const k='r6'+prop;if(el.dataset[k]===undefined)el.dataset[k]=el.style[prop];el.style[prop]=v}
function seat6Back(el,prop){if(!el)return;const k='r6'+prop;if(el.dataset[k]!==undefined){el.style[prop]=el.dataset[k];delete el.dataset[k]}}
function seats6(){const T=$('table');if(!T||!S||!S.players||$('game').hidden)return;
  const on=N()>=6&&seat6Port(),side=seat6Side();if(!side)return;
  // buildSeats で作り直された後は、古い左右の2人を消す（新しい2人は #busts の中にいる）
  if(document.querySelector('#busts>#bust1'))side.innerHTML='';
  if(on===T.classList.contains('ring6')&&(!on||side.children.length))return;
  T.classList.toggle('ring6',on);
  for(let i=1;i<=5;i++){const b=$('bust'+i),pl=$('plate'+i),sy=$('say'+i),sp=$('spot'+i);
    if(on){seat6Set(b,'left',SEAT6.x[i]+'%');seat6Set(pl,'left',SEAT6.x[i]+'%');
      if(sy&&SEAT6.say[i]){seat6Set(sy,'left',SEAT6.say[i]+'%');if(sy.dataset.x!==undefined)sy.dataset.x=SEAT6.say[i]+'%'}
      if(sp){seat6Set(sp,'left',feltX(SEAT6.spot[i][0])+'%');seat6Set(sp,'top',SEAT6.spot[i][1]+'%')}
      if((i===1||i===5)&&b&&b.parentElement!==side)side.appendChild(b)}
    else{seat6Back(b,'left');seat6Back(pl,'left');if(sy){seat6Back(sy,'left');if(sy.dataset.x!==undefined)sy.dataset.x=sy.style.left}seat6Back(sp,'left');seat6Back(sp,'top')}}
  if(!on){const B=$('busts');[...side.children].forEach(b=>{const n=+b.id.replace('bust','');n===1?B.insertBefore(b,B.firstChild):B.appendChild(b)})}}
// 案2：新しいテル（seq が変わった時）だけ乗り出す。テルで寄っている人（カメラの寄り）には重ねない
function lean6(){if(!S||!S.players||N()<6||reducedMotion())return;
  S.players.forEach((p,i)=>{if(!i)return;const b=$('bust'+i),tl=p.tell;if(!b||!tl||tl.street!==S.street||p.folded||S.handOver)return;
    if(b._leanSeq===tl.seq)return;b._leanSeq=tl.seq;
    if(typeof camState!=='undefined'&&camState.i===i&&camState.kind!=='wide')return;
    b.classList.add('lean');clearTimeout(b._leanT);b._leanT=setTimeout(()=>b.classList.remove('lean'),2000*SPEED())})}
LT.on('layout',()=>{try{seats6()}catch(e){}try{lean6()}catch(e){}});
LT.on('startHand:before',()=>{document.querySelectorAll('.bust.lean').forEach(b=>b.classList.remove('lean'))});
