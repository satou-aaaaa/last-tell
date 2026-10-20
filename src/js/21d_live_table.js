
// =====================================================================
// ライブ感の総点検（research/ライブ感の総点検_実装仕様.md、2026-10-10 決定：全案）
//   このファイルは v63 の後ろに読み込む。元のファイルは直さず、関数を包んで変える。
//   案1 卓の数字を減らす（ポット・上の行・番です・勝った額の文）／案3 テレビ中継の演出を外す／案4 クロック
//   名札の .tag と .chipwrap の数字は末尾（v65）で消す。.mystack・.chp は所持チップの担当なので触らない
// =====================================================================
if(SETTINGS.tv===undefined)SETTINGS.tv=false;   // テレビ風の表示（勝率・役の札・英語の帯）
if(SETTINGS.pre===undefined)SETTINGS.pre=false; // 先に選ぶ（オンライン式）
const tvOn=()=>!!SETTINGS.tv;
const earlyCh=()=>!!(CFG&&CFG.ch&&!CFG.ch.p2&&CFG.ch.no<=3);
function liveBody(){try{const b=document.body;b.classList.toggle('lt-tv',tvOn());
  b.classList.toggle('lt-myhand',tvOn()||earlyCh())}catch(e){}}

// ---------- データ ----------
const RANK_JP={14:'エース',13:'キング',12:'クイーン',11:'ジャック',10:'10',9:'9',8:'8',7:'7',6:'6',5:'5',4:'4',3:'3',2:'2'};
const RANK_EN1={14:'ace',13:'king',12:'queen',11:'jack',10:'ten',9:'nine',8:'eight',7:'seven',6:'six',5:'five',4:'four',3:'three',2:'two'};
const RANK_ENS={14:'aces',13:'kings',12:'queens',11:'jacks',10:'tens',9:'nines',8:'eights',7:'sevens',6:'sixes',5:'fives',4:'fours',3:'threes',2:'twos'};
function dealerRead(s,lang){const a=s[1],b=s[2],cap=t=>t[0].toUpperCase()+t.slice(1);
  if(lang==='en')return[()=>`${cap(RANK_EN1[a])} high`,()=>`Pair of ${RANK_ENS[a]}`,()=>`${cap(RANK_ENS[a])} and ${RANK_ENS[b]}`,()=>`Three ${RANK_ENS[a]}`,
    ()=>`Straight, ${RANK_EN1[a]} high`,()=>`Flush, ${RANK_EN1[a]} high`,()=>`${cap(RANK_ENS[a])} full of ${RANK_ENS[b]}`,()=>`Four ${RANK_ENS[a]}`,
    ()=>a===14?'Royal flush':`Straight flush, ${RANK_EN1[a]} high`][s[0]]();
  return[()=>`${RANK_JP[a]}・ハイ`,()=>`${RANK_JP[a]}のワンペア`,()=>`${RANK_JP[a]}と${RANK_JP[b]}のツーペア`,()=>`${RANK_JP[a]}のスリーカード`,
    ()=>`${RANK_JP[a]}までのストレート`,()=>`${RANK_JP[a]}からのフラッシュ`,()=>`フルハウス、${RANK_JP[a]}と${RANK_JP[b]}`,()=>`${RANK_JP[a]}のフォーカード`,
    ()=>a===14?'ロイヤルフラッシュ':`${RANK_JP[a]}までのストレートフラッシュ`][s[0]]()}
const CLOCK_CALL=['クロック、お願いします','すみません、クロックを','そろそろ、クロックで'];
const CLOCK_FLOOR='フロアです。1分でお願いします';
const RUNOUT_REACT=['……頼む','来るな、来るなよ','さあ、どうかな','……'];
try{Object.assign(EN_DICT,{
  'クロック、お願いします':'Clock, please.','すみません、クロックを':'Excuse me, can we get a clock?','そろそろ、クロックで':'Time to call the clock.',
  'フロアです。1分でお願いします':'Floor. You have one minute.','10秒':'Ten seconds.','5、4、3……':'Five, four, three...','時間です':'Time.',
  '……頼む':'...Come on.','来るな、来るなよ':"Don't come, don't come...",'さあ、どうかな':"Let's see.",'チョップです':'Chopped pot.','お客様です':'Action is on you.',
  'テレビ風の表示':'TV-style info','オールイン中の勝率と、役の名前の札、英語の帯を出します（ライブのテーブルでは出ません）':'Show win odds during all-ins, hand-name labels and the action banner (not shown at a live table).',
  'テレビ風：オン':'TV-style: On','テレビ風：オフ':'TV-style: Off','先に選ぶ（オンライン式）':'Pre-select actions (online style)',
  '自分の番の前に、チェック/フォールドなどを選んでおけます（ライブのテーブルでは順番前の行動は禁止）':'Pick check/fold before your turn (acting out of turn is not allowed at a live table).',
  '先に選ぶ：オン':'Pre-select: On','先に選ぶ：オフ':'Pre-select: Off','クロック':'Clock','クロック：あり':'Clock: On','クロック：なし':'Clock: Off',
  '長く考えると、ほかの客がクロックを呼びます。呼ばれたら1分です':'If you think too long, another player calls the clock. Then you have one minute.',
  'オフ、効果音だけ、音楽もすべて、の3段階':'Off, effects only, or everything with music.','ポットを数えてもらう':'Ask the dealer to count the pot'});
  for(let i=1;i<=40;i++)EN_DICT['レベル'+i]='Level '+i}catch(e){}

// ---------- 案1：ポットは「約」、タップでディーラーが数える ----------
const potLive=()=>{try{return approxOn()&&!(S&&S.potCounted===potTotal())}catch(e){return false}};
function potApprox(v){if(v<=0)return'0';const m=10**Math.max(0,Math.floor(Math.log10(v))-1),r=Math.round(v/m)*m;return'約'+(r>=10000?(r/10000)+'万':fmt(r))}
{const o=potCount;potCount=function(to,ms){if(!potLive())return o.apply(this,arguments);
  const pv=$('potSign')&&$('potSign').querySelector('.pv');if(!pv)return;cancelAnimationFrame(potCountT);pv.textContent=potApprox(to);if(S.potPile)S.potPile.shown=to}}
function potFix(){const ps=$('potSign');if(!ps||!S||!S.players)return;
  ps.setAttribute('role','button');ps.tabIndex=0;ps.setAttribute('aria-label','ポットを数えてもらう');
  if(!potLive())return;const pv=ps.querySelector('.pv'),sp=ps.querySelector('.ps');if(sp)sp.remove();
  if(pv){const t=potApprox((S.potPile&&S.potPile.target)||potTotal());if(pv.textContent!==t)pv.textContent=t}}
function potAsk(){if(!S||!S.players||S.handOver||!approxOn()||S.potCounting)return;const n=potTotal();if(!n)return;
  S.potCounting=true;setTimeout(()=>{S.potCounting=false;if(!S||S.handOver)return;S.potCounted=n;const pv=$('potSign').querySelector('.pv');if(pv)pv.textContent=fmt(n);
    dealerSay(I18N.lang==='en'?`The pot is ${fmt(n)}.`:`ポットは${fmt(n)}です`);log(`ポットを数えてもらった：${fmt(n)}`)},600*SPEED())}
{const ps=$('potSign');if(ps){ps.addEventListener('click',potAsk);ps.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();potAsk()}})}}

// ---------- 案1：上の行（ブラインドだけ）・通りの札・「番です」・勝った額の文 ----------
function metaFix(){const m=$('meta');if(!m||!S||!S.players)return;const tag=m.querySelector('.storytag');
  const t=`${fmt(SB())}/${fmt(BB())}`,lv=CFG.levels?`レベル${Math.min(CFG.levels.length,Math.floor((S.handNo-1)/CFG.levelHands)+1)}`:'',k=t+'|'+lv;
  if(m.dataset.lt===k&&m.firstChild&&m.firstChild.nodeType===3&&m.firstChild.textContent===t&&(!lv||m.querySelector('.ltlv')))return;m.dataset.lt=k;m.textContent=t;
  if(lv){const l=document.createElement('span');l.className='ltlv';l.textContent=lv;m.appendChild(l)}if(tag)m.appendChild(tag)}
function msgStrip(s){if(!s)return s;
  s=s.replace(/[^\s／/]+の勝ち（[^（）]*）/g,'').replace(/（\+[\d,]+）/g,'').replace(/\s*\/\s*(?=\/|$)/g,'').replace(/^\s*\/\s*/,'').trim();
  return s}
{const o=render;render=function(){if(S&&S.handOver&&S.msg)S.msg=msgStrip(S.msg);const r=o.apply(this,arguments);
  try{if(!S||!S.players)return r;liveBody();metaFix();potFix();
    const st=$('street');if(st&&!S.result&&st.textContent)st.textContent='';
    const w=$('waiting');if(w&&w.textContent)w.textContent=''}catch(e){}
  return r}}
{const o=renderControls;renderControls=function(){const r=o.apply(this,arguments);try{const w=$('waiting');if(w)w.textContent=''}catch(e){}return r}}

// ---------- 案3：テレビ中継の演出 ----------
{const o=camBand;camBand=function(){if(!tvOn())return;return o.apply(this,arguments)}}
// ボスのオールインのカットインは、章ごとに1回（フリー対戦では出さない）。最後のクセ（release）はそのまま
{const o=cutIn;cutIn=function(name,line,release){if(!release&&!tvOn()){if(!CFG.ch||S.cutDone)return;S.cutDone=true}return o.apply(this,arguments)}}
// ショーダウン：ディーラーが勝った手だけ読み上げ、そのあと「ポットは◯◯へ」
{const o=showdown;showdown=function(){if(S)S.ltShow=!tvOn();try{return o.apply(this,arguments)}finally{if(S)S.ltShow=false}}}
{const o=potCall;potCall=function(){if(!S||!S.ltShow)return o.apply(this,arguments);S.ltShow=false;
  try{const ws=S.players.filter(p=>p.won>0&&p.score);if(ws.length){const top=ws.reduce((x,y)=>cmp(y.score,x.score)>0?y:x),chop=!S.board2&&ws.filter(w=>cmp(w.score,top.score)===0).length>1,t=chop?'チョップです':dealerRead(top.score,SETTINGS.lang);
    dealerSay(t);log(`ディーラー：「${t}」`);const s0=S,h0=S.handNo;setTimeout(()=>{if(S===s0&&S.handNo===h0)o()},1400*SPEED());return}}catch(e){}
  return o.apply(this,arguments)}}
// オールインで手が開いたら、残っている相手の1人が小さく反応する（勝ち負けに関係なく同じ候補から）
{const o=calcEq;calcEq=function(){const r=o.apply(this,arguments);
  try{if(!tvOn()&&S.runout&&S.reactHand!==S.handNo){S.reactHand=S.handNo;const c=S.players.filter(p=>!p.human&&inHand(p));
    if(c.length&&Math.random()<.7){const p=c[Math.floor(Math.random()*c.length)],s0=S,h0=S.handNo;
      setTimeout(()=>{if(S!==s0||S.handNo!==h0||S.handOver)return;
        p.say={seq:(S.saySeq=(S.saySeq||0)+1)+7000,act:'',line:rankOf(p.name)>=3?'……':RUNOUT_REACT[Math.floor(Math.random()*RUNOUT_REACT.length)],talk:true};render()},500*SPEED())}}}catch(e){}
  return r}}
// 音：番の「ピンポン」と振動・勝ちのファンファーレ・心音をやめる
{const o=Sound.sfx;Sound.sfx=function(k){if(!tvOn()){if(k==='turn')return;if(k==='win')k='chip'}return o.call(this,k)}}
{const o=Sound.heart;Sound.heart=function(){if(!tvOn())return;return o.apply(this,arguments)}}
turnCue=function(){requestAnimationFrame(keepMine);const a=$('acts');a.classList.remove('cue');void a.offsetWidth;a.classList.add('cue');
  if(SETTINGS.sound&&tvOn()){Sound.sfx('turn');if(navigator.vibrate)try{navigator.vibrate(15)}catch(e){}}};

// ---------- 案4：持ち時間のバー → クロック ----------
(()=>{let iv=0,key='',t0=0,last=0,stage=0,callAt=0,lim=0;
  const ui=()=>$('clock');
  function stop(){clearInterval(iv);iv=0;key='';stage=0;const c=ui();if(c){c.hidden=true;c.classList.remove('low','thin')}}
  function bar(left){const c=ui();if(!c)return;c.hidden=false;c.classList.add('thin','low');c.querySelector('i').style.transform=`scaleX(${Math.max(0,left/10000).toFixed(3)})`;c.querySelector('span').textContent=''}
  function caller(){const f=S.players.filter(p=>!p.human&&!p.out&&p.folded);return f.length?f[Math.floor(Math.random()*f.length)]:null}
  function timeUp(){const me=S.players[0],toCall=S.currentBet-me.bet;stop();dealerSay('時間です');
    log(toCall>0?'時間切れ：フォールド扱い':'時間切れ：チェック扱い');S.msg=toCall>0?'時間切れでフォールド':'時間切れでチェック';act(0,toCall>0?'fold':'call')}
  function start(k){if(!SETTINGS.clock||key===k)return;stop();key=k;t0=last=Date.now();
    const ura=typeof uraLv==='function'&&uraLv()>=3,early=earlyCh();callAt=ura?5000:25000;lim=ura?20000:60000;
    const s0=S,h0=S.handNo;let el=0;
    iv=setInterval(()=>{if(S!==s0||S.handNo!==h0||S.handOver||S.toAct!==0||$('game').hidden)return stop();
      const now=Date.now(),dt=now-last;last=now;if(document.hidden)return;el+=dt;
      if(early){if(stage===0&&el>=45000){stage=1;S.msg='ジン「時間だ。そろそろ決めろ」';$('msg').textContent=S.msg}return}
      if(stage===0&&el>=callAt){stage=1;const p=caller();
        if(p){p.say={seq:(S.saySeq=(S.saySeq||0)+1)+7500,act:'',line:CLOCK_CALL[Math.floor(Math.random()*CLOCK_CALL.length)],talk:true};render()}
        setTimeout(()=>{if(S===s0&&S.handNo===h0&&S.toAct===0&&!S.handOver)dealerSay(CLOCK_FLOOR)},(p?900:0)*SPEED());log('クロックが呼ばれた（1分）')}
      if(stage>=1){const left=callAt+lim-el;
        if(stage===1&&left<=10000){stage=2;dealerSay('10秒')}
        if(stage===2&&left<=5000){stage=3;dealerSay('5、4、3……')}
        if(left<=10000)bar(left);
        if(left<=0)timeUp()}},200)}
  Clock.start=start;Clock.stop=stop})();

// ---------- 案4：「先に選ぶ」は設定でオンにしたときだけ ----------
{const o=renderPre;renderPre=function(){if(!SETTINGS.pre){const row=$('prerow');if(row)row.hidden=true;preAct='';return}return o.apply(this,arguments)}}

// ---------- 設定 ----------
{const det=document.querySelector('#setIn .setmore');
  const row=(id,name,desc)=>{const r=document.createElement('div');r.className='setrow';r.innerHTML=`<div><b>${name}</b><p>${desc}</p></div><button id="${id}" class="mini"></button>`;(det||$('setIn')).appendChild(r)};
  row('btnTv','テレビ風の表示','オールイン中の勝率と、役の名前の札、英語の帯を出します（ライブのテーブルでは出ません）');
  row('btnPreSet','先に選ぶ（オンライン式）','自分の番の前に、チェック/フォールドなどを選んでおけます（ライブのテーブルでは順番前の行動は禁止）');
  const lab=()=>{$('btnTv').textContent=tvOn()?'テレビ風：オン':'テレビ風：オフ';$('btnPreSet').textContent=SETTINGS.pre?'先に選ぶ：オン':'先に選ぶ：オフ'};
  $('btnTv').onclick=()=>{SETTINGS.tv=!SETTINGS.tv;saveSettings();lab();liveBody();try{if(S&&S.players&&!$('game').hidden)render()}catch(e){}};
  $('btnPreSet').onclick=()=>{SETTINGS.pre=!SETTINGS.pre;saveSettings();lab();try{if(S&&S.players&&!$('game').hidden)renderPre()}catch(e){}};lab();
  // 「持ち時間」を「クロック」に、音の説明から振動の話を外す
  const ck=$('btnClock'),cr=ck&&ck.closest('.setrow');if(cr){cr.querySelector('b').textContent='クロック';cr.querySelector('p').textContent='長く考えると、ほかの客がクロックを呼びます。呼ばれたら1分です'}
  renderClock=function(){$('btnClock').textContent='クロック：'+(SETTINGS.clock?'あり':'なし')};renderClock();
  const sd=$('btnSound'),sr=sd&&sd.closest('.setrow');if(sr)sr.querySelector('p').textContent='オフ、効果音だけ、音楽もすべて、の3段階'}
liveBody();

// ---------- 案2：ディーラーが進める（シャッフル・1枚ずつ配る・バーン・伏せたフロップをめくる） ----------
//   動きは render のたびに作り直されるので、「始まってからの時間」で負の遅れを付けて、途中から続ける
//   配る順・速さは手の強さに関係なく、いつも同じ（SB から時計回りに2周）
const LT_DEAL=()=>(SETTINGS.speed==='fast'?35:70);
function ltDealOrder(){const n=S.players.length,o=[];let i=nextIdx(S.dealer,p=>!p.out);if(i<0)return o;
  const seen=new Set();while(!seen.has(i)){seen.add(i);o.push(i);i=nextIdx(i,p=>!p.out);if(i<0)break}return o}
{const o=startHand;startHand=function(){const rm=reducedMotion();if(S&&!rm){S.ltDealAt=performance.now()+300*SPEED();S.ltOrder=null}
  const r=o.apply(this,arguments);
  try{if(S&&S.players&&!rm){S.ltBoardAt=0;const s0=S,h0=S.handNo,n=ltDealOrder().length;
      for(let k=0;k<7;k++)setTimeout(()=>{if(S===s0&&S.handNo===h0)Sound.sfx('card')},k*40); // シャッフル
      for(let k=0;k<2*n;k++)setTimeout(()=>{if(S===s0&&S.handNo===h0)Sound.sfx('card')},300*SPEED()+k*LT_DEAL())}}catch(e){}
  return r}}
function ltDealAnim(){if(!S||!S.ltDealAt||!S.players)return;if(!S.ltOrder||!S.ltOrder.length)S.ltOrder=ltDealOrder();const now=performance.now(),n=S.ltOrder.length,el=now-S.ltDealAt,end=(2*n)*LT_DEAL()+400;
  if(el>end){S.ltDealAt=0;S.ltOrder.forEach(i=>{const h=i===0?$('mine')&&$('mine').querySelector('.hold'):$('spot'+i)&&$('spot'+i).querySelector('.hand');if(h)h.querySelectorAll(':scope > .card').forEach(c=>LT.cssFinish(c))});return}   // 配り終わり：動きが止まっていても終わりの形に（v0.97.3 Safari）
  S.ltOrder.forEach((i,j)=>{const h=i===0?$('mine')&&$('mine').querySelector('.hold'):$('spot'+i)&&$('spot'+i).querySelector('.hand');if(!h)return;
    [...h.querySelectorAll(':scope > .card')].slice(0,2).forEach((c,r)=>{const d=(r*n+j)*LT_DEAL()-el;
      c.style.animation=`ltDeal ${260}ms cubic-bezier(.2,.7,.3,1) ${Math.round(d)}ms both`})})}
// バーン：通りが進むたびに、伏せた札を1枚、捨て札の山へ
{const o=nextStreet;nextStreet=function(){const n0=S&&S.board?S.board.length:0,at=S?S.ltBoardAt:0;if(S&&!reducedMotion()){S.ltBoardAt=performance.now();S.ltBoardFrom=n0}
  const r=o.apply(this,arguments);
  try{if(S&&S.board){if(S.board.length>n0){if(typeof muckAdd==='function')muckAdd()}else if(S.ltBoardFrom===n0)S.ltBoardAt=at}}catch(e){}
  return r}}
function ltBoardAnim(){if(!S||!S.ltBoardAt||reducedMotion())return;const el=performance.now()-S.ltBoardAt,from=S.ltBoardFrom||0,flop=from===0,
    dur=(flop?1000:520)*SPEED();if(el>dur+50){S.ltBoardAt=0;[...$('boardCards').children].forEach(c=>{LT.cssFinish(c);LT.cssFinish(c.querySelector(':scope > .ltbk'))});return}   // めくり終わり：Safari で動きが途中で止まって札が重なったまま残った（v0.97.2 CI）。終わりの形にする
  // 動作の重さの改善 案3：札の幅は先に全部測ってから書く（書く→測るをくり返さない）
  const cs=[...$('boardCards').children].map((c,k)=>[c,k]).filter(([c,k])=>!(k<from||k>=S.board.length||c.classList.contains('slot')||c.classList.contains('back')));
  cs.forEach(([c])=>{if(!c.querySelector(':scope > .ltbk')){const b=document.createElement('i');b.className='card back ltbk';b.setAttribute('aria-hidden','true');c.appendChild(b)}});
  const ws=cs.map(([c])=>c.getBoundingClientRect().width||40);
  cs.forEach(([c,k],j)=>{
    const w=ws[j],sx=flop?-(k-from)*(w+4):0;c.style.setProperty('--ltsx',sx+'px');
    c.style.animation=`${flop?'ltFlop':'ltTurn'} ${Math.round(dur)}ms ease-in-out ${Math.round(-el)}ms both`;
    c.querySelector(':scope > .ltbk').style.animation=`${flop?'ltBack':'ltBackT'} ${Math.round(dur)}ms linear ${Math.round(-el)}ms both`;})}
// ショーダウン：ポットが動いたあと、負けて開いていた手をディーラーが集める（伏せる人は今の処理のまま）
function ltLosersAway(){if(!S||!S.handOver||S.street!=='showdown'||!S.ltLoseAt||performance.now()<S.ltLoseAt)return;
  S.players.forEach((p,i)=>{if(i===0||p.out||p.folded||p.won>0||!p.show)return;const h=$('spot'+i)&&$('spot'+i).querySelector('.hand');
    if(!S.ltLoseDone)S.ltLoseDone={};if(!S.ltLoseDone[i]){S.ltLoseDone[i]=1;if(typeof foldMuck==='function')try{foldMuck(i,{showdown:true})}catch(e){}}
    if(h)h.classList.add('mucked-away')})}
{const o=potCall;potCall=function(){const r=o.apply(this,arguments);try{if(S&&S.street==='showdown'){S.ltLoseAt=performance.now()+900*SPEED();const s0=S,h0=S.handNo;
  setTimeout(()=>{if(S===s0&&S.handNo===h0&&S.handOver&&!$('game').hidden)render()},950*SPEED())}}catch(e){}return r}}
{const o=render;render=function(){const r=o.apply(this,arguments);try{if(S&&S.players&&!reducedMotion()){ltDealAnim();ltBoardAnim()}ltLosersAway()}catch(e){}return r}}
// 配っている間も動きを続けるため、短い間だけ描き直す
setInterval(()=>{try{if(S&&S.players&&(S.ltDealAt||S.ltBoardAt)&&!$('game').hidden){ltDealAnim();ltBoardAnim()}}catch(e){}},120);

// ---------- 案1（v65）：名札の行動の札と、賭けたチップの横の数字を消す ----------
// 残す札：脱落・見ている・フォールド（状態なので）、オールイン（額なし）、勝ち（額なし）。
// 行動した瞬間は、名札が0.7秒光るだけ（台詞のないチェック・コールでも）。
function ltTags(){if(!S||!S.players)return;
  document.querySelectorAll('#table .chipwrap .amt-label').forEach(e=>e.remove());
  S.players.forEach((p,i)=>{const pl=i===0?null:$('plate'+i),t=i===0?document.querySelector('#mine .me-l .tag'):pl&&pl.querySelector('.tag');
    if(pl&&p.actSeq&&pl.dataset.ltact!==String(p.actSeq)){const first=pl.dataset.ltact===undefined;pl.dataset.ltact=String(p.actSeq);
      if(!first&&!p.out){pl.classList.add('flash');setTimeout(()=>pl.classList.remove('flash'),700)}}
    if(!t||p.out)return;
    if(t.classList.contains('win')){t.textContent=I18N.lang==='en'?'Won':'勝ち';return}
    if(p.allIn&&!p.folded){t.textContent=I18N.lang==='en'?'All-in':'オールイン';return}
    if(p.folded&&t.classList.contains('act-fold'))return;
    t.remove()})}
{const o=render;render=function(){const r=o.apply(this,arguments);try{ltTags()}catch(e){}return r}}
// 上のバー（UI案3）も、ハンド番号を出さずブラインドだけ。大会はレベル
if(typeof tbMetaSync==='function'){const o=tbMetaSync;tbMetaSync=function(){const r=o.apply(this,arguments);try{const m=$('tbMeta');if(m&&S&&S.players){
  const lv=CFG.levels?Math.min(CFG.levels.length,Math.floor((S.handNo-1)/CFG.levelHands)+1):0,t=`${fmt(SB())}/${fmt(BB())}`+(lv?(I18N.lang==='en'?`　Lv${lv}`:`　レベル${lv}`):'');
  if(m.textContent!==t)m.textContent=t;
  const al=(I18N.lang==='en'?'Blinds ':'ブラインド ')+t;if(m.title!==al)m.title=al;if(m.getAttribute('aria-label')!==al)m.setAttribute('aria-label',al)}}catch(e){}return r}}   // v75 レビュー 3：数字だけの欄に「ブラインド」
