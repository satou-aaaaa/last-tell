const FINAL_DUEL59={"4": {"boss": "レイカ", "start": [{"who": "ソウ", "ja": "……僕は見ています。最後は、レイカさんと"}, {"who": "レイカ", "ja": "最後の一手は、わたしが配って、わたしが打つ"}], "flop": {"ja": "嘘かどうか、まだ決めてないの"}, "turn": {"ja": "あの日も、こうやって配ったのよ"}, "river": {"ja": "……見て。顔じゃなくて、手を"}, "lose": {"ja": "残念。嘘は、もう少し上手につくものよ"}}, "5": {"boss": "ハヤト", "start": [{"who": "テツ", "ja": "おい、見ろよ。ハヤトが一対一だってよ"}, {"who": "ハヤト", "ja": "座れ。一勝負だけ、と言ったはずだ"}], "flop": {"ja": "……昔、ここでよくジンさんと打った"}, "turn": {"ja": "あの人のクセを知ってたのは、俺だけだった"}, "river": null, "lose": {"ja": "まだだな。……焦るな、って言われなかったか"}}};
const OUTRO_ALT59={"2": {"who": "ロク", "ja": "……{n}から盗んだか。俺の番は、来なかったな"}, "3": {"who": "セキ", "ja": "{n}を騙したね。……私の番は来なかったか。それでも、見事だった"}, "6": {"who": "クロウ", "ja": "……見事です。最後の卓に、私はいませんでしたが"}};
const REVIEW_GOAL_LINE59={"steal": "盗めたのは{k}回。あと{r}回だった", "bluff": "ブラフで勝てたのは{k}回。あと{r}回だった", "readcall": "嘘を見抜けたのは{k}回。あと{r}回だった", "reach": "目標まで、あと少しのところまで戻した"};
// 0回のときは「あと◯回だった」ではなく、目標を言い直す（v63 クリエイターレビュー 7）
const REVIEW_GOAL_ZERO59={"steal": "まだ一度も盗めていない。目標は{n}回だ", "bluff": "まだ一度もブラフで勝てていない。目標は{n}回だ", "readcall": "まだ一度も嘘を見抜けていない。目標は{n}回だ"};
const REVIEW_HAND_LINE59={"1": "#{no}、{hand}で最後まで払ったな。あれは降りる手だ", "2": "#{no}、後ろの席で{hand}を様子見したな。あそこが盗みどころだ", "3": "#{no}、{n}が二回チェックしたのに、こっちもチェックしたな。あそこで賭けろ", "4": "#{no}、{n}のクセが出ていたのに降りたな。顔を見ろ", "5": "#{no}、少ないチップで小さく入ったな。来るまで待て", "6": "#{no}、ブラインドが上がる前に動かなかったな。小さくなる前に仕掛けろ", "12": "#{no}、後ろの席で{hand}を様子見したな。あそこが盗みどころだ", "13": "#{no}、カイに合わせて急いだな。急ぐのは向こうだけでいい", "14": "#{no}、ブラインドが上がる前に動かなかったな。小さくなる前に仕掛けろ"};
const REVIEW_PEN_BTN59="#{no} を赤ペンで見る";

// ===== §3 決着の一手：第4・5章は相手役との一騎打ち =====
function duelCh59(){if(typeof CFG==='undefined'||!CFG||!CFG.ch||CFG.ura||CFG.run||CFG.flashback||CFG.ch.p2||!CHAPTERS.includes(CFG.ch))return 0;
  const no=CFG.ch.no;if(no!==4&&no!==5||!S||!S.players)return 0;
  const b=S.players.find(p=>!p.human&&p.name===FINAL_DUEL59[no].boss);return b&&(b.chips>0||CFG.refill)?no:0}
const duelBoss59=()=>{const no=duelCh59();return no?S.players.find(p=>!p.human&&p.name===FINAL_DUEL59[no].boss):null};
function say59(p,line){if(p&&line)p.say={seq:(S.saySeq=(S.saySeq||0)+1)+9900,act:'',line}}
// 勝利判定の手前（endHand）。第4章：一騎打ちで見抜いたときだけ。第5章：一騎打ちでハヤトのチップを取ったときだけ
function duelGate59(){const no=duelCh59();if(!no||S.duelDone)return true;const me=S.players[0],g=CFG.goal;
  if(S.duelHand){if(no===4||me.won>me.total){S.duelDone=true;S.finalDuel=false;return true}return false}
  if(no===4)S.reads=g.n-1;S.finalDuel=true;return false}
// ===== §4 章の教えに当たるハンド =====
const rk59=r=>r===14?'A':r===13?'K':r===12?'Q':r===11?'J':String(r);
const hand59=h=>h&&h.length===2?h.map(c=>c.r).sort((a,b)=>b-a).map(rk59).join(''):'';
function top59(h){const [a,b]=[h[0].r,h[1].r].sort((x,y)=>y-x),su=h[0].s===h[1].s;
  return a===b||a===14||a===13&&b>=6||a>=11&&b>=8||su&&a-b<=2&&b>=5||a-b===1&&b>=6}
function lessonCh59(){if(typeof CFG==='undefined'||!CFG||!CFG.ch||CFG.ura||CFG.run||CFG.flashback)return 0;const no=CFG.ch.no;return REVIEW_HAND_LINE59[no]?no:0}
function rec59(i,type,to){if(!S||!S.players||S.handOver||i!==S.toAct)return;const p=S.players[i],H=S.h59||(S.h59={me:[]});
  const toCall=S.currentBet-p.bet,t=type==='raise'&&p.acted?'call':type;
  if(!p.human){if(t==='fold'&&!S.players[0].folded)S.lastFold59=p.name;return}
  H.me.push({st:S.street,type:t,toCall,late:S.street==='preflop'&&isLatePos(),open:S.street==='preflop'&&!S.players.some(q=>!q.human&&(q.lastType==='call'||q.lastType==='raise')),
    aggr:S.aggr>0&&S.players[S.aggr]?S.players[S.aggr].name:''});
  if(t==='raise'){S.rz59=S.rz59||{};S.rz59[S.handNo]=1}}
function lesson59(){const no=lessonCh59();if(!no||S.autoMe||!S.players)return;if(S.ls59===S.handNo)return;S.ls59=S.handNo;
  const me=S.players[0],A=(S.h59&&S.h59.me)||[],pre=A.filter(a=>a.st==='preflop'),hd=hand59(me.hand),BBx=BB();
  const winner=()=>{const w=S.players.find(q=>!q.human&&q.won>0);return w?w.name:''};
  let L=null;
  if(no===1){if(!me.folded&&S.board.length===5&&me.won===0&&me.total>0&&isWeak(me.hand,S.board)&&A.some(a=>a.st!=='preflop'&&a.toCall>0&&a.type!=='fold'))
      L={hand:hd,n:winner(),score:me.total,pen:{line:'この額なら、降りてよかった',x:''}}}
  else if(no===2||no===12){const a=pre.find(a=>a.late&&a.open&&(a.type==='call'||a.type==='fold'));if(a&&me.hand.length===2&&top59(me.hand))L={hand:hd,n:'',score:1+preTier(me.hand)}}
  else if(no===3){const f=A.filter(a=>a.st==='flop'),t=A.filter(a=>a.st==='turn'),ck=x=>x.length&&x.every(a=>a.type==='call'&&a.toCall<=0);
    if(S.board.length===5&&me.won===0&&ck(f)&&ck(t)){const o=S.players.find(q=>!q.human&&!q.out&&!q.folded)||S.players.find(q=>q.name===S.lastFold59);
      if(o)L={hand:hd,n:o.name,score:S.players.reduce((x,q)=>x+q.total,0)}}}
  else if(no===4){const a=(S.myActs||[]).filter(a=>a.tell&&a.tell.m==='bluff'&&a.type==='fold').pop();
    if(a)L={hand:hd,n:a.tell.name,score:a.pot,pen:{line:'顔を見ていたか？',x:`（${STREET_JP[a.street]}で、${a.tell.name}のクセが出ていた）`}}}
  else if(no===5){if(me.hs<=BBx*15&&me.folded&&pre.some(a=>a.type==='call'&&a.toCall>0)&&!pre.some(a=>a.type==='raise'))L={hand:hd,n:'',score:me.total}}
  else if(no===6||no===14){const rz=S.rz59||{};if(me.chips<=BBx*15&&me.hs>BBx*15&&S.handNo>=4&&![0,1,2,3].some(k=>rz[S.handNo-k])){const m=(S.mh59||{})[S.handNo-1];
      L={no:S.handNo-1,hand:m||hd,n:'',score:1}}}
  else if(no===13){const r=pre.findIndex(a=>a.type==='raise');if(r>=0&&pre.slice(r+1).some(a=>a.type==='call'&&a.toCall>0&&a.aggr==='カイ')&&me.won===0)L={hand:hd,n:'カイ',score:me.total}}
  if(L){L.no=L.no||S.handNo;(S.lessonHands=S.lessonHands||[]).push(L);if(S.lessonHands.length>12)S.lessonHands.shift()}}
// reviewLines の続き：負けたときだけ、1行目を目標まであと何回か、2行目を実際の1ハンドに
function reviewLesson59(r,ch,result){try{
  if(result!=='lose'||!ch||!REVIEW_HAND_LINE59[ch]||typeof S==='undefined'||!S||!S.players||!CFG||!CFG.goal)return r;
  const g=CFG.goal,t=g.type;
  if(REVIEW_GOAL_LINE59[t]){const k=Math.min(g.n||0,t==='steal'?S.steals||0:t==='bluff'?S.bluffs||0:t==='readcall'?S.reads||0:0);
    r[0]=(k===0&&REVIEW_GOAL_ZERO59[t]?REVIEW_GOAL_ZERO59[t]:REVIEW_GOAL_LINE59[t]).split('{k}').join(k).split('{r}').join(Math.max(1,(g.n||0)-k)).split('{n}').join(g.n||0)}
  const L=(S.lessonHands||[]).reduce((a,b)=>!a||b.score>a.score?b:a,null);
  if(L){r[1]=REVIEW_HAND_LINE59[ch].split('{no}').join(L.no).split('{hand}').join(L.hand||'').split('{n}').join(L.n||'');
    Object.defineProperty(r,'pen',{value:{no:L.no,line:L.pen?L.pen.line:r[1],x:L.pen?L.pen.x:''},enumerable:false})}
  }catch(e){}return r}
function penLi59(no){const l=$('log');return l&&!($('logBox')&&$('logBox').hidden)?l.querySelector(`li.hd[data-h59="${no}"]`):null}
{const o=reviewHTML;reviewHTML=function(r){let h=o.apply(this,arguments);
  if(r&&r.pen&&penLi59(r.pen.no)){reviewHTML.pen=r.pen;h+=`<button class="mini penbtn59" data-no="${r.pen.no}">${esc(REVIEW_PEN_BTN59.split('{no}').join(r.pen.no))}</button>`}return h}}
function openPen59(pen){const hd=penLi59(pen.no);if(!hd)return;$('logBox').open=true;
  const L=$('log');L.querySelectorAll('.hl59').forEach(x=>x.classList.remove('hl59'));
  hd.classList.add('hl59');for(let e=hd.previousElementSibling;e&&!e.classList.contains('hd');e=e.previousElementSibling)e.classList.add('hl59');
  if(!hd.previousElementSibling||!hd.previousElementSibling.classList.contains('pen59')){const li=document.createElement('li');li.className='pen59 hl59';
    li.textContent=`赤ペン：${pen.line}`;if(pen.x){const sp=document.createElement('span');sp.textContent=pen.x;li.appendChild(sp)}hd.before(li)}
  try{hd.scrollIntoView({block:'center',behavior:reducedMotion()?'auto':'smooth'})}catch(e){}}
$('review').addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.penbtn59');if(b&&reviewHTML.pen&&String(reviewHTML.pen.no)===b.dataset.no)openPen59(reviewHTML.pen)});
// startHand の頭：一騎打ちなら相手役以外は席を立つ（配らない・ブラインドなし）。終わったら戻す
{const o=startHand;startHand=function(){
  try{if(S&&S.players){S.h59={me:[]};S.storyHand=false;S.lastFold59='';const b=S.finalDuel&&!S.result&&!(duelCh59()===5&&S.handNo<3)?duelBoss59():null;S.duelHand=!!b;
    S.players.forEach(p=>{p.sitOut=!!b&&!p.human&&p!==b})}}catch(e){}
  const r=o.apply(this,arguments);
  try{if(S&&S.players){const hd=$('log').querySelector('li.hd');if(hd&&!hd.dataset.h59)hd.dataset.h59=S.handNo;
    if(S.storyHand)log(STORY_HAND_LOG59);const m=S.mh59=S.mh59||{};m[S.handNo]=hand59(S.players[0].hand);delete m[S.handNo-5];
    if(S.duelHand){const no=duelCh59(),D=FINAL_DUEL59[no],b=duelBoss59();S.duelSaid={};
      D.start.forEach(l=>{const q=S.players.find(p=>p.name===l.who);say59(q,l.ja);log(`${l.who}「${l.ja}」`)});
      const t=`${D.boss}との一騎打ち`;log(t);if(!S.msg)S.msg=t;render()}}}catch(e){}
  return r}}
// ストリートごとの相手役の一言
{const o=nextStreet;nextStreet=function(){
  try{if(S&&S.duelHand&&!S.handOver&&!S.reveal&&S.street!=='showdown'&&S.street!=='river'){const nx={preflop:'flop',flop:'turn',turn:'river'}[S.street],D=FINAL_DUEL59[duelCh59()],b=duelBoss59();
    if(nx==='flop'&&D)D.start.forEach(l=>{const q=S.players.find(p=>p.name===l.who);if(q&&q!==b&&q.say&&q.say.line===l.ja)q.say=null});
    if(D&&b&&!b.folded&&D[nx]&&!S.duelSaid[nx]){S.duelSaid[nx]=1;say59(b,D[nx].ja)}}}catch(e){}
  return o.apply(this,arguments)}}
// 手番の記録（§4）
{const o=act;act=function(i,type,to){try{rec59(i,type,to)}catch(e){}return o.apply(this,arguments)}}
// endHand：前に章の教えのハンドを判定、後で一騎打ちの続き・決め手の相手（§3 第2・3・6章）
{const o=endHand;endHand=function(){
  try{if(S&&S.players&&S.eh59!==S.handNo)lesson59()}catch(e){}
  const first=S&&S.eh59!==S.handNo;if(S)S.eh59=S.handNo;
  const r=o.apply(this,arguments);
  try{if(first&&S&&S.players){const me=S.players[0],no=duelCh59();
    if(S.duelHand&&S.result!=='win'){const lost=me.won-me.total<0;S.duelLost=lost;
      if(lost){const b=duelBoss59(),D=FINAL_DUEL59[no||CFG.ch.no];if(b&&D){say59(b,D.lose.ja);log(`${b.name}「${D.lose.ja}」`)}}}
    if(S.result){S.finalDuel=false}
    else if(!no)S.finalDuel=false;
    else if(no===4)S.finalDuel=(S.reads||0)>=CFG.goal.n-1&&!(S.duelHand&&S.duelLost);
    else S.finalDuel=me.chips>=CFG.goal.n;
    if(S.result==='win'&&CFG.ch&&!CFG.ura&&!CFG.ch.p2&&OUTRO_ALT59[CFG.ch.no]){
      const op=S.players.filter(q=>!q.human&&!q.out&&!q.folded&&q.hand.length),c=op.find(q=>q.chips<=0)||op[0];
      S.clinchFrom=c?c.name:(S.lastFold59||null)}
    if(S.duelHand)render()}}catch(e){}
  return r}}
// 決め手が相手役でなかったら、outro の1行目を差し替える（第6章は {brk:'crow'} の行を出さない）
{const o=playScene;playScene=function(ch,lines,done){
  try{const A=ch&&OUTRO_ALT59[ch.no];
    if(A&&!ch.p2&&typeof S!=='undefined'&&S&&S.result==='win'&&S.clinchFrom&&!S.outroAlt59&&S.clinchFrom!==A.who&&CFG&&CFG.ch===ch&&Array.isArray(lines)&&Array.isArray(ch.outro)){
      const i=lines.indexOf(ch.outro[0]);
      if(i>=0){S.outroAlt59=true;lines=lines.slice();lines[i]=[A.who,A.ja.split('{n}').join(S.clinchFrom)];
        if(ch.no===6){const j=lines.findIndex(l=>Array.isArray(l)&&l[2]&&l[2].brk==='crow');if(j>=0)lines.splice(j,1)}
        const a=[...arguments];a[1]=lines;return o.apply(this,a)}}}catch(e){}
  return o.apply(this,arguments)}}
const DUEL_DEALS59={"4": [{"hero": ["K♥", "J♣"], "boss": ["Q♠", "T♠"], "board": ["J♦", "9♠", "4♠", "2♥", "3♦"]}, {"hero": ["8♣", "8♦"], "boss": ["A♥", "5♥"], "board": ["K♥", "7♥", "3♣", "T♠", "2♦"]}, {"hero": ["A♦", "9♣"], "boss": ["6♠", "5♠"], "board": ["9♥", "8♦", "2♠", "K♣", "Q♥"]}], "5": [{"hero": ["Q♣", "Q♦"], "boss": ["A♠", "J♠"], "board": ["T♦", "6♣", "3♥", "8♠", "2♣"]}, {"hero": ["7♠", "7♥"], "boss": ["5♦", "4♦"], "board": ["9♣", "6♦", "2♠", "K♥", "J♣"]}, {"hero": ["A♣", "Q♠"], "boss": ["J♥", "T♥"], "board": ["Q♥", "8♥", "3♣", "2♠", "5♦"]}]};
const FINAL_DEALS59=[{"hero": ["A♣", "K♦"], "boss": ["7♥", "7♠"], "board": ["A♠", "7♦", "2♣", "9♥", "4♠"]}, {"hero": ["K♠", "Q♠"], "boss": ["J♣", "T♣"], "board": ["K♦", "Q♣", "9♥", "8♦", "3♠"]}, {"hero": ["J♥", "J♦"], "boss": ["A♥", "A♣"], "board": ["9♠", "5♣", "2♥", "3♦", "K♣"]}];
const STORY_HAND_TAG59="物語の一手",STORY_HAND_LOG59="このハンドは、物語のために決まった札で配られます";

// 前回と違うパターンを選んで shisho-story.deal に残す
function pickDeal59(key,n){const t=loadStory();t.deal=t.deal||{};const prev=t.deal[key];let k=Math.floor(Math.random()*n);
  if(n>1&&prev!==undefined&&k===+prev)k=(k+1+Math.floor(Math.random()*(n-1)))%n;t.deal[key]=k;saveStory(t);S.dealPick59={key,k};return k}
function dealOf59(d,boss){rig({[S.players[0].name]:d.hero.map(cardOf),[boss]:d.boss.map(cardOf)},d.board.map(cardOf))}
function revOn(p){const T=TELLS[p.name];return !!T&&!!T.reverse&&(S.handNo>=10||p.chips<p.start/2||uraRule(p.name))}
// 一騎打ちの相手役：ブラフで押し切りにくる（降りなければこちらの勝ち）
function duelAI59(i){const p=S.players[i],b=duelBoss59();if(!b||p!==b)return null;const tc=S.currentBet-p.bet,pot=potTotal(),all=p.bet+p.chips;
  const tell=()=>{if(S.duelTold||!tellsOn(p))return;const T=TELLS[p.name];if(!T)return;S.duelTold=true;const rev=revOn(p),cue=rev?T.strong.cue:T.bluff.cue;
    S.tellSeq=(S.tellSeq||0)+1;p.tell={cue,meaning:rev?'strong':'bluff',truth:'bluff',street:'river',seq:S.tellSeq,rev};p.tellLog.push(p.tell);
    if(reducedMotion())log(`${p.name}：${CUE_LABEL[cue]}`)};
  if(S.street==='preflop')return S.currentBet<=BB()&&all>BB()*3?{type:'raise',to:BB()*3,state:'bluff'}:{type:'call',state:'bluff'};
  if(S.street==='river'){if(all<=S.currentBet)return{type:'call',state:'bluff'};tell();return{type:'raise',to:all,state:'bluff'}}
  if(tc>0||all<=S.currentBet)return{type:'call',state:'bluff'};
  return{type:'raise',to:Math.min(all,Math.max(BB(),Math.round(pot*2/3/1000)*1000)),state:'bluff'}}
{const o=setupScript;setupScript=function(){const r=o.apply(this,arguments);
  try{if(S.duelHand&&!CFG.flashback){const no=duelCh59();if(no){dealOf59(DUEL_DEALS59[no][pickDeal59(String(no),3)],FINAL_DUEL59[no].boss);S.scriptAI=duelAI59;S.duelTold=false}}
    S.storyHand=!!(S.scriptAI&&CFG.ch&&!CFG.ura&&!CFG.flashback&&!CFG.run)}catch(e){}
  return r}}
// 「物語の一手」：ハンド番号の横
{const o=render;render=function(){const r=o.apply(this,arguments);
  try{const m=$('meta');if(m&&S&&S.storyHand&&!m.querySelector('.storytag')){const t=document.createElement('span');t.className='storytag';t.textContent=STORY_HAND_TAG59;m.appendChild(t)}}catch(e){}
  return r}}
