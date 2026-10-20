/* ---------- ベット額と直近の5手（動画のツッコミ A5、satou 2026-10-17 12:21Z「両方出す」） ---------- */
// 1) 名札の下の行動の語（46_act_word.js の .ltact）に、その人がこの通りで前に出している額を足す（「レイズ 13,000」）
// 2) 卓の空いている所に、このハンドの直近5手の小さな記録（#vfLog）。置ける場所がなければ出さない（全部の記録は前からの「ハンドの記録」）
// 表示だけ。CPU の判断・配り札・テルは変えない。第7章・物語の一手では出さない（awQuiet と同じ）
const BL={max:5,en:{fold:'Fold',check:'Check',call:'Call',bet:'Bet',raise:'Raise',allin:'All-in',straddle:'Straddle'},
  ja:{fold:'フォールド',check:'チェック',call:'コール',bet:'ベット',raise:'レイズ',allin:'オールイン',straddle:'ストラドル'}};
const blEn=()=>typeof I18N!=='undefined'&&I18N.lang==='en';
const blQuiet=()=>typeof awQuiet==='function'?awQuiet():false;

// ===== 1) 語に額 =====
function blAmounts(){if(!S||!S.players)return;
  S.players.forEach((p,i)=>{const box=i===0?document.querySelector('#mine .me-l'):$('plate'+i);if(!box)return;
    const el=box.querySelector(':scope > .ltact');if(!el)return;
    let n=el.querySelector(':scope > .bln');
    const no=S.blNo&&S.blNo[i]===S.handNo+'|'+S.street;   // このストリートは額を付けると重なった席（blFit）
    const v=!no&&!el.hidden&&!el.classList.contains('fold')&&p.bet>0?fmt(p.bet):'';
    if(!v){if(n)n.remove();return}
    if(!n){n=document.createElement('span');n.className='bln';el.appendChild(n)}
    if(n.textContent!==v)n.textContent=v});
  blClamp()}
// 額が付いて長くなった語が画面の端から出るときは、内側へ寄せる（縦の右端の席など）
function blClamp(){document.querySelectorAll('.ltact').forEach(el=>{if(el.hidden){el.style.transform='';return}
  el.style.transform='';const r=el.getBoundingClientRect();if(!r.width)return;
  const dx=r.right>innerWidth-3?innerWidth-3-r.right:r.left<3?3-r.left:0;if(dx)el.style.transform=`translateX(${Math.round(dx)}px)`})}
// 額を付けた語がチップの山・席番号・D・吹き出し・札に重なるなら、そのストリートは額を外す（語だけに戻す。額は直近の5手に出ている）
// 46_act_word.js の awPlace（上下・左右へよける）の後に測る。v0.90 CI の重なりの決まり（チップは語の面積の4分の1まで）と同じ
function blFit(){if(!S||!S.players)return;
  const vis=e=>e&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
  const others=[...document.querySelectorAll('.llseats i:not([hidden]), #dbtn, .dbadge, .felt .spot .chipwrap, .felt .spot .mystack, #mine .mystack, #mine .mybet, #sayLayer .say.go, #plates .say.go, #potSign, #boardCards .card:not(.slot), #mine .card, #plates .cue, #dcall.go, .ltact')].filter(vis);   // .ltact：となりの席の語（v92：字を 12px にして額が付くと、となりの語にかかった）
  const hit=el=>{const a=el.getBoundingClientRect();return others.some(o=>{if(o.contains(el)||el.contains(o))return false;const c=o.getBoundingClientRect(),w=Math.min(a.right,c.right)-Math.max(a.left,c.left),h=Math.min(a.bottom,c.bottom)-Math.max(a.top,c.top);
    return w>3&&h>3&&(!/chipwrap|mystack/.test(o.className)||w*h>.2*a.width*a.height)})};
  S.players.forEach((p,i)=>{const box=i===0?document.querySelector('#mine .me-l'):$('plate'+i);const el=box&&box.querySelector(':scope > .ltact:not([hidden])');const n=el&&el.querySelector(':scope > .bln');if(!n)return;
    if(!hit(el))return;n.remove();blClamp();
    if(typeof awPlace==='function')try{awPlace()}catch(e){}
    S.blNo=S.blNo||{};S.blNo[i]=S.handNo+'|'+S.street})}
LT.on('layout',()=>{try{blFit()}catch(e){}});
// 自分の「あなたの番」（47_video_fixes.js）が自分の席番号（.llseats の 1）に重なるときは、席番号を隠す（自分の番のあいだだけ）
function blSeat0(){const s=document.querySelector('.llseats i[data-i="0"]'),t=document.querySelector('#mine .me-l > .vfturn');if(!s)return;
  if(!t||t.hidden||!t.getClientRects().length){if(s.dataset.blh){delete s.dataset.blh;s.style.visibility=''}return}
  s.style.visibility='';const a=s.getBoundingClientRect(),b=t.getBoundingClientRect();
  const ov=a.width&&a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;
  if(ov){s.style.visibility='hidden';s.dataset.blh='1'}else if(s.dataset.blh){delete s.dataset.blh}}
LT.on('layout',()=>{try{blSeat0()}catch(e){}});
LT.on('render',()=>{try{blSeat0()}catch(e){}});
{const o=actWords;actWords=function(){const r=o.apply(this,arguments);try{blAmounts()}catch(e){}return r}}

// ===== 2) 直近の5手 =====
function blName(i){const p=S.players[i];if(p.human)return blEn()?'You':'あなた';
  const known=typeof knownName==='function'?knownName(p.name):true,nm=typeof who==='function'?who(p.name):p.name;
  if(blEn())return known?((typeof EN_DICT!=='undefined'&&EN_DICT[p.name])||p.name):nm;
  return nm}
function blPush(i,type,toCall){const p=S.players[i];if(!p)return;
  const L=S.bl&&S.bl.h===S.handNo?S.bl:(S.bl={h:S.handNo,a:[]});
  const bet=/^(ベット|ストラドル)/.test(p.lastAct||'')?'bet':'raise';
  const k=type==='fold'?'fold':p.allIn?'allin':type==='call'||p.lastType==='call'?(toCall<=0?'check':'call'):bet;
  L.a.push({i,k,n:k==='fold'||k==='check'?'':fmt(p.bet),st:S.street});if(L.a.length>BL.max)L.a.shift();
  blRender()}
// act の前の「払う額」を覚えておき、act の後で記録する（チェックの語はキャラの言い方に変わることがあるので語では見ない）
LT.on('act:before',(i)=>{try{const p=S&&S.players&&S.players[i];S.blPre=p&&!S.handOver&&i===S.toAct?{i,toCall:S.currentBet-p.bet,h:S.handNo}:null}catch(e){}});
LT.on('act',(i,type)=>{try{const q=S.blPre;S.blPre=null;if(!q||q.i!==i||q.h!==S.handNo)return;const p=S.players[i];if(!p||!p.acted&&type!=='fold')return;blPush(i,type,q.toCall)}catch(e){}});
LT.on('startHand',()=>{try{S.bl={h:S.handNo,a:[]};blRender()}catch(e){}});

function blBox(){let b=$('vfLog');
  if(!b){const tb=$('table');if(!tb)return null;b=document.createElement('ol');b.id='vfLog';b.className='vflog';b.setAttribute('aria-label',blEn()?'Last actions':'直近の5手');b.hidden=true;document.body.appendChild(b)}
  return b}
function blRender(){const b=blBox();if(!b)return;
  const L=S&&S.bl&&S.bl.h===S.handNo?S.bl.a:[];
  if(!L.length||blQuiet()||!$('game')||$('game').hidden||(CFG&&CFG.flashback)){b.hidden=true;b.innerHTML='';return}
  const en=blEn(),W=en?BL.en:BL.ja,cls={fold:'fold',check:'call',call:'call',bet:'raise',raise:'raise',allin:'raise'};
  b.innerHTML=L.map(e=>`<li class="${cls[e.k]}"><span class="nm"></span><b>${W[e.k]}</b>${e.n?`<i>${e.n}</i>`:''}</li>`).join('');
  [...b.children].forEach((li,j)=>{li.querySelector('.nm').textContent=blName(L[j].i)});
  b.hidden=false;blPlace();clearTimeout(blPlace.t);blPlace.t=setTimeout(blPlace,450)}

// 置き場所：画面の上の帯（#tbar）のすぐ下。横・PC は右の列の上、縦は左上か右上。顔・名札・吹き出し・札・ボタンに重なるなら出さない
function blPlace(){const b=$('vfLog');if(!b||b.hidden&&!b.children.length)return;
  const vis=e=>e&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
  const bar=$('tbar'),B=vis(bar)?bar.getBoundingClientRect():{left:0,right:innerWidth,bottom:0};
  // 吹き出しは .go（出ている途中）に限らず、見えている物はすべて（メモの吹き出し .memo など。v92 確認）
  const sayVis=e=>{const c=getComputedStyle(e);return +c.opacity>.05};
  const av=[...document.querySelectorAll('#busts .bust .body, #busts .bust .face, #plates .plate, #plates .cue, #sayLayer .say.go, #plates .say.go, .say.go, #crowdSay, #dcall.go, #boardCards .card, .felt .spot .card, #potSign, .llseats i:not([hidden]), #controls, #between .betweenrow, #between .acts button, #resultText, #sensei:not([hidden]), #mfInner, #quiz:not([hidden]), .vfturn:not([hidden]), .ltact:not([hidden])')].filter(vis).map(e=>e.getBoundingClientRect()).filter(r=>r.width>1&&r.height>1)
    .concat([$('msg')].filter(e=>e&&vis(e)&&(e.textContent||'').trim()).map(e=>e.getBoundingClientRect()))   // 上の案内の文（字があるとき。v92 レビュー：縦で重なった）
    .concat([...document.querySelectorAll('#sayLayer .say:not(.go), #plates .say:not(.go)')].filter(e=>vis(e)&&sayVis(e)).map(e=>e.getBoundingClientRect()).filter(r=>r.width>14&&r.height>14));   // 中身のない吹き出し（12px ほど）は数えない
  b.style.visibility='hidden';b.hidden=false;b.classList.remove('off');b.style.left='0px';b.style.top='0px';   // .off（display:none）のまま測ると大きさ 0 で「置ける」になり、出る・隠れるをくり返していた（v92 確認）
  const w=b.offsetWidth,h=b.offsetHeight,y=B.bottom+6;
  // 卓の枠（#game）の中だけに置く（v92 レビュー：PC で枠の外の暗い所に出た）
  const G=vis($('game'))?$('game').getBoundingClientRect():{left:0,right:innerWidth,bottom:innerHeight};
  const ok=(x,y)=>x>=Math.max(4,G.left+4)&&x+w<=Math.min(innerWidth,G.right)-4&&y+h<=Math.min(innerHeight,G.bottom)-4&&!av.some(q=>x<q.right&&q.left<x+w&&y<q.bottom&&q.top<y+h);
  // 席番号（.llseats i）も入れる。見せた札を動かしたあと席番号が置き直されるので（v0.97.0 手元：フリー6人の縦で席番号に重なった）
  // ハンドの終わりは #controls が隠れ、#between（結果の文と「次のハンドへ」）が出る。上の av に入れた（v96.4 レビュー：PC で直近の5手が「ブラフを見抜いた！」と「次のハンドへ」に重なった）
  const cs=[[B.left+4,y],[B.right-4-w,y]];
  // 師匠の帯（#sensei）が #tbar のすぐ下にあると上の2つはふさがる（v94.2 レビュー：横で直近の5手が消えた）。帯の下の左右も試す
  {const se=$('sensei');if(se&&!se.hidden&&vis(se)){const r=se.getBoundingClientRect();cs.push([r.left,r.bottom+6],[r.right-w,r.bottom+6])}}
  const c=cs.find(([x,y])=>ok(x,y));
  b.classList.toggle('off',!c);b.style.visibility='';
  if(c){b.style.left=Math.round(c[0])+'px';b.style.top=Math.round(c[1])+'px'}}
LT.on('layout',()=>{try{blClamp()}catch(e){}try{if($('vfLog')&&!$('vfLog').hidden)blPlace()}catch(e){}});
// 画面を離れたら（章の一覧へ戻るなど）隠す
LT.on('show',()=>{try{const b=$('vfLog');if(b&&$('game')&&$('game').hidden){b.hidden=true}}catch(e){}});
// 吹き出しが後から出たら置き直す（41_more_fun.js の心の声と同じやり方。rAF は WebKit で止まることがあるので setTimeout）
// 名札の下の行動の語（46_act_word.js の awPlace）も同じときに置き直す（v92 確認：吹き出しが後から出て語にかかった）
{let blT=0;const both=()=>{try{const b=$('vfLog');if(b&&!b.hidden)blPlace()}catch(e){}try{if(typeof awPlace==='function')awPlace()}catch(e){}try{const d=$('dcall');if(d&&d.classList.contains('go')&&typeof dcallPlace==='function')dcallPlace()}catch(e){}};   // ディーラーの声も、後から出た吹き出しから離す（v92 レビュー）
  const mo=window.MutationObserver&&new MutationObserver(ms=>{if(blT)return;
    if(!ms.some(m=>m.target.classList&&m.target.classList.contains('say')||[...m.addedNodes].some(n=>n.classList&&n.classList.contains('say'))))return;
    both();blT=setTimeout(()=>{blT=0;both()},60);   // すぐに1回（吹き出しが出たそのコマで直近5手をよける）、60ms 後にもう1回
    clearTimeout(mo._t2);mo._t2=setTimeout(both,450);clearTimeout(mo._t3);mo._t3=setTimeout(both,900)});
  const go=()=>{if(mo)['sayLayer','plates'].forEach(id=>{const n=$(id);if(n)mo.observe(n,{subtree:true,attributes:true,attributeFilter:['class','style'],childList:true})})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go()}
// ディーラーの声が出たら置き直す（声の上に直近の5手が乗らないよう。重なるならその間は .off で隠れ、声が消えたあとの layout で戻る。v92 確認：横で声に重なった）
{const o=dealerSay;dealerSay=function(){const r=o.apply(this,arguments);try{if($('vfLog')&&!$('vfLog').hidden){blPlace();clearTimeout(blPlace.d);blPlace.d=setTimeout(()=>{try{blPlace()}catch(e){}},300)}}catch(e){}return r}}
