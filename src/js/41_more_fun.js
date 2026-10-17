/* ---------- ゲームをもっと面白く（改善提案 2026-10-15b、satou「全部かなりいいですね」。research/改善提案_2026-10-15b_実装仕様.md） ---------- */
// 1.0 は案1（大一番ほどクセが濃く出る）と案2（アオの心の声）。案3〜5 は公開後。
// どれも twOn() の卓（第4章以降・フリー対戦など。回想・台本・決めの一手は通らない）だけ。状態は S.mf にまとめる。
const MF={bigPotBB:15,bigBoost:.15,innerMs:2500};
const MF_LINES={bigFirst:'でかい勝負ほど、人は顔を隠せない'};
const MF_RECALL={
  glance:{strong:'……チップを見た。前に見たときは、強い手だった',bluff:'……チップを見た。あのときは、何もなかった',none:'……チップを見た。前は、特に意味はなかった'},
  still:{strong:'……指が止まった。前に見たときは、強い手だった',bluff:'……指が止まった。あのときは、何もなかった',none:'……指が止まった。前は、特に意味はなかった'},
  smile:{strong:'……また笑った。前に見たときは、強い手だった',bluff:'……また笑った。あのときは、何もなかった',none:'……また笑った。前は、特に意味はなかった'},
  stare:{strong:'……こっちを見ている。前に見たときは、強い手だった',bluff:'……こっちを見ている。あのときは、何もなかった',none:'……こっちを見ている。前は、特に意味はなかった'},
  talk:{strong:'……口数が増えた。前に見たときは、強い手だった',bluff:'……口数が増えた。あのときは、何もなかった',none:'……口数が増えた。前は、特に意味はなかった'},
  fast:{strong:'……すぐ賭けた。前に見たときは、強い手だった',bluff:'……すぐ賭けた。あのときは、何もなかった',none:'……すぐ賭けた。前は、特に意味はなかった'},
  sweat:{strong:'……汗をかいている。前に見たときは、強い手だった',bluff:'……汗をかいている。あのときは、何もなかった',none:'……汗をかいている。前は、特に意味はなかった'}};
const MF_RECALL_DOUBT='……前と同じとは、限らない';
function mfState(){return S.mf=S.mf||{miss:{},rec:{},recallHand:-1,bigHand:-1}}
LT.on('startHand',()=>{if(S&&S.handNo<=1)S.mf={miss:{},rec:{},recallHand:-1,bigHand:-1};else if(S&&S.mf)S.mf.rec={}});

// ===== 案1：大一番ほどクセが濃く出る =====
// 06_regulars.js の showTell が、正しいクセ（d.state===cat）の確率にこれを足す。小さいポット・外れのクセ・逆のクセは変えない
function mfBigBoost(p){try{
  if(!twOn()||!p||TW_KEEP.includes(p.name))return 0;
  if(S.street!=='turn'&&S.street!=='river')return 0;
  if(potTotal()<MF.bigPotBB*BB())return 0;
  mfState().bigHand=S.handNo;return MF.bigBoost}catch(e){return 0}}
// 初めて大一番でクセが出たハンドで、ジンが1行だけ言う（1セーブで1回。shisho-story の mfBig）
function mfBigFirst(p){
  if(!p||!p.tell||mfState().bigHand!==S.handNo)return;
  const t=loadStory();if(t.mfBig)return;t.mfBig=1;saveStory(t);
  const jin=S.players.find(q=>q.name==='ジン'&&!q.out);
  if(jin)talkLater(()=>talkSay(jin,MF_LINES.bigFirst),900);
  else{S.jinNote={t:MF_LINES.bigFirst,until:S.handNo+1};render()}}

// ===== 案2：「前にも見た」アオの心の声 =====
function mfRecall(p){
  if(!twOn()||!p||!p.tell||TW_KEEP.includes(p.name))return;
  const cue=p.tell.cue,st=mfState();
  if(!MF_RECALL[cue]||String(cue).startsWith('word:')||st.recallHand===S.handNo)return;
  const r=(loadNotes()[p.name]||{})[cue];if(!r)return;
  const tot=r.strong+r.bluff+r.none;if(tot<2)return;
  const top=Math.max(r.strong,r.bluff,r.none),ties=['strong','bluff','none'].filter(k=>r[k]===top);
  const truth=ties.length>1?'none':ties[0];
  st.recallHand=S.handNo;st.rec[p.name+'|'+cue]=truth;
  mfInner((st.miss[p.name]||0)>=2?MF_RECALL_DOUBT:MF_RECALL[cue][truth])}
// 思い出した答えと、答え合わせの本当の答えが違ったら、その卓の間だけ数える（2回で「前と同じとは限らない」）
{const _nt=noteTell;noteTell=function(name,cue,truth){try{const st=S&&S.mf,k=name+'|'+cue;
  if(st&&st.rec&&st.rec[k]!==undefined){if(st.rec[k]!==truth)st.miss[name]=(st.miss[name]||0)+1;delete st.rec[k]}}catch(e){}
  return _nt.apply(this,arguments)}}
// 字幕：卓の下の方、場札と自分の手札の間に出す。ボタン・手札・クセの札・ディーラーの声に重なる場所は避ける
function mfInner(text){const tb=$('table');if(!tb||!text)return;
  let el=$('mfInner');if(!el){el=document.createElement('div');el.id='mfInner';el.className='mfinner';el.setAttribute('aria-live','polite');tb.appendChild(el)}
  el.textContent=text;el.hidden=false;el.classList.toggle('still',reducedMotion());el.classList.remove('go');void el.offsetWidth;el.classList.add('go');
  if(reducedMotion())log(text);
  mfPlace();clearTimeout(el._p);el._p=setTimeout(()=>{try{mfPlace()}catch(e){}},900);   // 札が配り終わって止まってから、もう1回置き直す
  clearTimeout(el._t);el._t=setTimeout(()=>{el.classList.remove('go');el.hidden=true},MF.innerMs*(typeof SPEED==='function'?Math.max(.6,SPEED()):1))}
function mfPlace(){const el=$('mfInner'),tb=$('table');if(!el||el.hidden||!tb)return;
  el.classList.remove('side');el.style.left='';el.style.width='';   // 右の列に出していても、卓の中の幅で測り直す
  const T=tb.getBoundingClientRect(),h=el.offsetHeight||28,vis=e=>e&&e.offsetParent&&e.getBoundingClientRect().width>2;
  const avoid=[...document.querySelectorAll('#table button, #felt .card, .felt .spot .hand:not(.folded):not(.muck) .card, #plates .cue, #plates .plate, #dcall.go, #mine .card, #controls, .felt .boardspot > .lltools:not(.off), #potChips .chip, #dbtn, .dbadge, .llseats i')].filter(vis).map(e=>e.getBoundingClientRect());
  // D ボタンと席番号（.llseats i）も避ける（v86.4 レビュー：横で D と席4・5を隠した）
  // 吹き出しは読めなくなるので重みを4倍に（v85.2 レビュー：「うう、降ります」の真上に乗った）。吹き出しは #sayLayer と #plates の両方に出る
  avoid.push(...[...document.querySelectorAll('#sayLayer .say.go, #plates .say.go')].filter(vis).map(e=>{const r=e.getBoundingClientRect();return{left:r.left-4,right:r.right+4,top:r.top-4,bottom:r.bottom+4,k:4}}));
  // ポットの額も読めなくなるので吹き出しと同じ重み（v86.2 レビュー：スマホ縦で「ポット 約1万」の真上に乗った）
  {const ps=$('potSign');if(vis(ps)){const r=ps.getBoundingClientRect();avoid.push({left:r.left-2,right:r.right+2,top:r.top-2,bottom:r.bottom+2,k:4})}}
  // 横向きは右の操作の列（指示の箱の下・ボタンの上）に空きがあれば、まずそこに出す（v85.2 レビュー。v86.4 レビュー：卓の上だと D と席番号を隠すので先に試す）
  const C=$('controls'),sn=$('sensei');
  const shown=e=>e&&!e.hidden&&e.getBoundingClientRect().width>2;   // #controls は position:fixed で offsetParent が無いので、大きさで見る
  if(innerWidth>innerHeight&&shown(C)){const c=C.getBoundingClientRect();
    if(c.left>=T.right-2){const top0=shown(sn)?sn.getBoundingClientRect().bottom+8:T.top+8,y=c.top-h-10;
      if(y>=top0){el.classList.add('side');el.style.left=c.left.toFixed(0)+'px';el.style.width=c.width.toFixed(0)+'px';el.style.top=y.toFixed(0)+'px';return}}}
  const bd=$('boardCards'),mine=$('mine'),bb=vis(bd)?bd.getBoundingClientRect():null,mr=vis(mine)?mine.getBoundingClientRect():null;
  if(bb)avoid.push(bb);   // 配っている途中の札は飛んでくる位置にあるので、場札の枠ごと避ける（まだ配る前でも）
  const ys=[];if(bb&&mr&&mr.top-bb.bottom>h+4)ys.push((bb.bottom+mr.top-h)/2);if(mr)ys.push(mr.top-h-6);if(bb){ys.push(bb.bottom+6);ys.push(bb.top-h-6)}ys.push(T.top+8,T.top+T.height*.62,T.top+T.height*.75);if(mr)ys.push(mr.top-h-40);   // スマホ縦で下が詰まっているときは卓の上の端
  // 重ならない場所がなければ、重なる面積がいちばん小さい場所
  const w=el.offsetWidth,L=el.getBoundingClientRect().left,cost=y=>avoid.reduce((a,r)=>a+(r.k||1)*Math.max(0,Math.min(L+w,r.right)-Math.max(L,r.left))*Math.max(0,Math.min(y+h,r.bottom)-Math.max(y,r.top)),0);
  let best=ys[0],bc=Infinity;for(const y of ys){const c=cost(y);if(c<bc){bc=c;best=y}if(!c)break}
  // まだ少し重なるなら、その近くを 4px ずつ上下にずらして重ならない所を探す（v86.3 レビュー：縦で吹き出しの上の余白に 3px）
  if(bc>0){const b0=best;for(let d=4;d<=48&&bc>0;d+=4)for(const y of [b0-d,b0+d]){if(y<T.top+2||y+h>T.bottom-2)continue;const c=cost(y);if(c<bc){bc=c;best=y}if(!c)break}}
  el.style.top=(best-T.top).toFixed(0)+'px'}
LT.on('layout',()=>{try{mfPlace()}catch(e){}});
// 心の声が出ているあいだに吹き出しが後から出たら置き直す（v85.1 レビュー：横でケンジの「チェック！」と重なった）
{let mfT=0;const mo=window.MutationObserver&&new MutationObserver(ms=>{const el=$('mfInner');if(!el||el.hidden||mfT)return;
    if(!ms.some(m=>m.target.classList&&m.target.classList.contains('say')||[...m.addedNodes].some(n=>n.classList&&n.classList.contains('say'))))return;   // 吹き出し以外の変化（名札の付け替えなど）は見ない
    mfT=setTimeout(()=>{mfT=0;try{mfPlace()}catch(e){}},60);   // rAF は WebKit で止まることがあるので setTimeout。60ms に1回まで
    clearTimeout(mo._t2);mo._t2=setTimeout(()=>{try{mfPlace()}catch(e){}},450)});   // 吹き出しは出たあと 0.2秒ほど動き（せり上がり・よけ）、そのあと止まった位置でもう1回（v86 レビュー：PC 6人でミサキの吹き出しの角に数px）
  if(mo)['sayLayer','plates'].forEach(id=>{const n=$(id);if(n)mo.observe(n,{subtree:true,attributes:true,attributeFilter:['class','style'],childList:true})})}   // style：出たあとに吹き出しが動く（よけ・追いかけ）ときも（v86.1 CI：PC で #say1 に 31×6px）

// showTell を包む（39_tell_win.js と同じやり方）：元の showTell のあとに、出たクセがあれば案1のジンの一言と案2の心の声
{const _st=showTell;showTell=function(i,d){const p=S.players[i],before=p&&p.tell&&p.tell.seq;const r=_st.apply(this,arguments);
  try{if(p&&p.tell&&p.tell.seq!==before&&!p.human){mfBigFirst(p);mfRecall(p)}}catch(e){}return r}}

// 案5 読み勝ちの見返し（satou 2026-10-16「読み勝ちの見返し」を 1.0 に）：章をクリアしたとき、ジンの三行の前に、
// その章でいちばん大きかった「クセで取った／クセで降りて守った」1ハンドを4秒で（顔 → クセ → あなたの判断 → 開いた手札）。タップで即とばす。
// 出さない：読み勝ち0回・第1〜3章・第7章・ストーリーの最後の手で決まった章・裏の卓・はしご。S.tw.best は 39_tell_win.js の twBest が残す
const MF_REPLAY={ms:5500,you:'あなた',board:'場の札',act:{call:'あなたはコールした',fold:'あなたは降りた'},head:'この章の読み',skip:'タップでとばす'};
function mfReplayOk(){const ch=CFG&&CFG.ch;if(!S||S.result!=='win'||!ch||CFG.ura||CFG.run||CFG.flashback||S.storyHand||S.finalHand)return false;
  if(!ch.p2&&(ch.no<=3||ch.no===7))return false;return !!(S.tw&&S.tw.best&&(S.tw.won||S.tw.saved))}
function mfReplay(b){let el=$('mfReplay');if(!el){el=document.createElement('div');el.id='mfReplay';el.className='mfreplay';el.setAttribute('role','dialog');el.setAttribute('aria-label',MF_REPLAY.head);document.body.appendChild(el)}
  const open=b.act==='call'||b.shown,grp=(l,h,c)=>h&&`<div class="mfr-grp${c||''}"><div class="mfr-lab">${l}</div><div class="mfr-row">${h}</div></div>`,cards=(a,h)=>(a||[]).map(c=>cardHTML(c,h)).join('');
  el.innerHTML=`<div class="mfr-box"><div class="mfr-head">${MF_REPLAY.head}</div>`+
    `<div class="mfr-face mfr-s1">${avatar(b.name,'normal')}<div class="mfr-name">${esc(b.name)}</div></div>`+
    `<div class="mfr-cue mfr-s2">${esc(CUE_LABEL[b.cue]||'')}</div>`+
    `<div class="mfr-act mfr-s3">${MF_REPLAY.act[b.act]||''}</div>`+
    `<div class="mfr-cards mfr-s4">${grp(esc(b.name),cards(b.hand,!open),' mfr-opp')||''}${grp(MF_REPLAY.board,cards(b.board),' mfr-board')||''}${grp(MF_REPLAY.you,cards(b.hand2))||''}</div>`+
    `<div class="mfr-skip">${MF_REPLAY.skip}</div></div>`;
  el.hidden=false;el.classList.toggle('still',reducedMotion());
  const close=()=>{clearTimeout(el._t);el.onclick=null;el.hidden=true;el.innerHTML=''};
  el.onclick=close;el._t=setTimeout(close,MF_REPLAY.ms)}
LT.on('endHand',()=>{try{if(!mfReplayOk()||S.mfReplayed)return;S.mfReplayed=true;mfReplay(S.tw.best)}catch(e){}});
