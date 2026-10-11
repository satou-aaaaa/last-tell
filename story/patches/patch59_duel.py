import sys,json
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC,encoding='utf-8').read()
def rep(a,b,cnt=1):
    global s
    assert s.count(a)==cnt,(a[:60],s.count(a));s=s.replace(a,b)
# 改善提案 §3 決着の一手（第4・5章の一騎打ち／第2・3・6章の outro 1行目）と §4 負けたときの三行（章の教え＋実際の1ハンド＋赤ペン）
# research/改善提案_2026-10-10_実装仕様.md・データ.js から。データはここに貼る（実行時に .js は読まない）
FINAL_DUEL={
 4:{'boss':'レイカ',
  'start':[{'who':'ソウ','ja':'……僕は見ています。最後は、レイカさんと','en':"...I'll watch. The last one should be with Reika."},
           {'who':'レイカ','ja':'最後の一手は、わたしが配って、わたしが打つ','en':'The last hand, I deal and I play.'}],
  'flop':{'ja':'嘘かどうか、まだ決めてないの','en':"I haven't decided yet whether I'm lying."},
  'turn':{'ja':'あの日も、こうやって配ったのよ','en':'I dealt it just like this that day.'},
  'river':{'ja':'……見て。顔じゃなくて、手を','en':'...Look. Not at my face. At my hands.'},
  'lose':{'ja':'残念。嘘は、もう少し上手につくものよ','en':'Too bad. A lie should be told a little better than that.'}},
 5:{'boss':'ハヤト',
  'start':[{'who':'テツ','ja':'おい、見ろよ。ハヤトが一対一だってよ','en':"Hey, look. Hayato's going one-on-one."},
           {'who':'ハヤト','ja':'座れ。一勝負だけ、と言ったはずだ','en':"Sit. I said one game, didn't I."}],
  'flop':{'ja':'……昔、ここでよく師匠と打った','en':'...I used to play the old man here a lot.'},
  'turn':{'ja':'あの人は、俺には一度もクセを見せなかった','en':'He never once showed me a tell.'},
  'river':None, # 第5章のリバーは今あるしかけ（ハヤトは持ち点6万以上の相手には焦らさずに開く）だけ
  'lose':{'ja':'まだだな。……焦るな、って言われなかったか','en':"Not yet. ...Didn't he tell you not to rush?"}}}
OUTRO_ALT={
 2:{'who':'ロク','ja':'……{n}から盗んだか。わしの番は、来なかったな','en':'...You stole from {n}. My turn never came.'},
 3:{'who':'セキ','ja':'{n}を騙したね。……私の番は来なかったか。それでも、見事だった','en':'You fooled {n}. ...So my turn never came. Still, well played.'},
 6:{'who':'クロウ','ja':'……見事です。最後の卓に、私はいませんでしたが','en':"...Well played. Though I wasn't at the final table."}}
REVIEW_GOAL_LINE={
 'steal':{'ja':'盗めたのは{k}回。あと{r}回だった','en':'You stole {k}. {r} more would have done it.'},
 'bluff':{'ja':'ブラフで勝てたのは{k}回。あと{r}回だった','en':'You won {k} with a bluff. {r} more would have done it.'},
 'readcall':{'ja':'嘘を見抜けたのは{k}回。あと{r}回だった','en':'You caught {k} lies. {r} more would have done it.'},
 'reach':{'ja':'目標まで、あと少しのところまで戻した','en':'You got close to where you needed to be.'}}
REVIEW_HAND_LINE={
 1:{'ja':'#{no}、{hand}で最後まで払ったな。あれは降りる手だ','en':'#{no}, you paid all the way with {hand}. That was a fold.'},
 2:{'ja':'#{no}、後ろの席で{hand}を様子見したな。あそこが盗みどころだ','en':'#{no}, you just limped {hand} from a late seat. That was the steal.'},
 3:{'ja':'#{no}、{n}が二回チェックしたのに、こっちもチェックしたな。あそこで賭けろ','en':'#{no}, {n} checked twice and you checked too. That was the spot to bet.'},
 4:{'ja':'#{no}、{n}のクセが出ていたのに降りたな。顔を見ろ','en':'#{no}, {n} showed a tell and you folded. Watch the face.'},
 5:{'ja':'#{no}、少ないチップで小さく入ったな。来るまで待て','en':'#{no}, you dribbled chips in on a short stack. Wait for it.'},
 6:{'ja':'#{no}、ブラインドが上がる前に動かなかったな。小さくなる前に仕掛けろ','en':'#{no}, you sat still before the blinds went up. Move before you shrink.'},
 12:{'ja':'#{no}、後ろの席で{hand}を様子見したな。あそこが盗みどころだ','en':'#{no}, you just limped {hand} from a late seat. That was the steal.'},
 13:{'ja':'#{no}、カイに合わせて急いだな。急ぐのは向こうだけでいい','en':'#{no}, you hurried along with Kai. Let him be the one who rushes.'},
 14:{'ja':'#{no}、ブラインドが上がる前に動かなかったな。小さくなる前に仕掛けろ','en':'#{no}, you sat still before the blinds went up. Move before you shrink.'}}
REVIEW_PEN_BTN={'ja':'#{no} を赤ペンで見る','en':'See #{no} in red pen'}
WATCH=('見ている','Watching')
DUEL_TITLE=('{0}との一騎打ち','Heads-up with {0}')

J=lambda v:json.dumps(v,ensure_ascii=False)
def jaOnly(x):
    if x is None:return None
    if isinstance(x,list):return [jaOnly(y) for y in x]
    if isinstance(x,dict):return {k:(jaOnly(v) if k!='en' else None) for k,v in x.items() if k!='en'}
    return x
data=('const FINAL_DUEL59='+J({str(k):jaOnly(v) for k,v in FINAL_DUEL.items()})+';\n'
 'const OUTRO_ALT59='+J({str(k):{'who':v['who'],'ja':v['ja']} for k,v in OUTRO_ALT.items()})+';\n'
 'const REVIEW_GOAL_LINE59='+J({k:v['ja'] for k,v in REVIEW_GOAL_LINE.items()})+';\n'
 'const REVIEW_HAND_LINE59='+J({str(k):v['ja'] for k,v in REVIEW_HAND_LINE.items()})+';\n'
 'const REVIEW_PEN_BTN59='+J(REVIEW_PEN_BTN['ja'])+';\n')

js=data+r"""
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
    r[0]=REVIEW_GOAL_LINE59[t].split('{k}').join(k).split('{r}').join(Math.max(1,(g.n||0)-k))}
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
"""

# ===== 配り札固定（案B-1・B-3）research/配り札固定_実装仕様.md・データ.js =====
DUEL_DEALS={
 4:[{'hero':['K♥','J♣'],'boss':['Q♠','T♠'],'board':['J♦','9♠','4♠','2♥','3♦']},
    {'hero':['8♣','8♦'],'boss':['A♥','5♥'],'board':['K♥','7♥','3♣','T♠','2♦']},
    {'hero':['A♦','9♣'],'boss':['6♠','5♠'],'board':['9♥','8♦','2♠','K♣','Q♥']}],
 5:[{'hero':['Q♣','Q♦'],'boss':['A♠','J♠'],'board':['T♦','6♣','3♥','8♠','2♣']},
    {'hero':['7♠','7♥'],'boss':['5♦','4♦'],'board':['9♣','6♦','2♠','K♥','J♣']},
    {'hero':['A♣','Q♠'],'boss':['J♥','T♥'],'board':['Q♥','8♥','3♣','2♠','5♦']}]}
FINAL_DEALS=[{'hero':['A♣','K♦'],'boss':['7♥','7♠'],'board':['A♠','7♦','2♣','9♥','4♠']},
 {'hero':['K♠','Q♠'],'boss':['J♣','T♣'],'board':['K♦','Q♣','9♥','8♦','3♠']},
 {'hero':['J♥','J♦'],'boss':['A♥','A♣'],'board':['9♠','5♣','2♥','3♦','K♣']}]
STORY_HAND_TAG={'ja':'物語の一手','en':'Story hand'}
STORY_HAND_LOG={'ja':'このハンドは、物語のために決まった札で配られます','en':'This hand is dealt from set cards, for the story.'}
jsB=('const DUEL_DEALS59='+json.dumps({str(k):v for k,v in DUEL_DEALS.items()},ensure_ascii=False)+';\nconst FINAL_DEALS59='+json.dumps(FINAL_DEALS,ensure_ascii=False)+';\n'
 'const STORY_HAND_TAG59='+json.dumps(STORY_HAND_TAG['ja'],ensure_ascii=False)+',STORY_HAND_LOG59='+json.dumps(STORY_HAND_LOG['ja'],ensure_ascii=False)+';\n')+r"""
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
"""
js=js+jsB
# 一騎打ちのとき、相手役以外は配らない（out と同じ扱い。チップはそのまま）
rep("S.players.forEach(p=>{p.out=p.chips<=0});","S.players.forEach(p=>{p.out=p.chips<=0||!!p.sitOut});")
# 勝利判定：第4・5章は一騎打ちを通す
rep("else if(g.type==='readcall'&&(S.reads||0)>=g.n)S.result='win';","else if(g.type==='readcall'&&(S.reads||0)>=g.n&&duelGate59())S.result='win';")
rep("else if(opps.every(p=>p.chips<=0)){S.result='win';","else if(opps.every(p=>p.chips<=0)&&duelGate59()){S.result='win';")
rep("else if(g.type==='reach'&&me.chips>=g.n)S.result='win';","else if(g.type==='reach'&&me.chips>=g.n&&duelGate59())S.result='win';")
# 席の表示：「見ている」
rep("if(p.out)tag='<span class=\"tag\">脱落</span>';","if(p.out)tag=p.sitOut?'<span class=\"tag watch\">見ている</span>':'<span class=\"tag\">脱落</span>';")
rep("${p.folded&&!p.out?' folded':''}${p.out?' out':''}`;","${p.folded&&!p.out?' folded':''}${p.out?' out':''}${p.sitOut?' watch':''}`;")
# reviewLines を延ばす（置き換えない）
rep("none:'次は、相手の顔をもっと見ろ'}[k]);\n  return r}","none:'次は、相手の顔をもっと見ろ'}[k]);\n  return reviewLesson59(r,ch,result)}")
rep("rig({'あなた':[C(14,'♣'),C(13,'♦')],'ジン':[C(7,'♥'),C(7,'♠')]},[C(14,'♠'),C(7,'♦'),C(2,'♣'),C(9,'♥'),C(4,'♠')]);","dealOf59(FINAL_DEALS59[pickDeal59('7',3)],'ジン');")
rep("const rev=!!T.reverse&&(S.handNo>=10||p.chips<p.start/2||uraRule(p.name));","const rev=revOn(p);")
rep("il:o(t.il),tempt:","il:o(t.il),deal:o(t.deal),tempt:")
rep("return{loses:{},brk:{},ep:{},mieta:0,alt:false,il:{}}}}","return{loses:{},brk:{},ep:{},mieta:0,alt:false,il:{},deal:{}}}}")
rep(".bust.out{opacity:.2}",".bust.out{opacity:.2}\n.bust.out.watch{opacity:.5;filter:grayscale(.6)}\n.tag.watch{background:transparent;color:var(--muted);font-weight:700}\n"
    ".review .penbtn59{grid-column:1/-1;justify-self:start;margin-top:4px;color:#ff9a9a;border-color:#ff9a9a66}\n.log li.hl59{background:#ff5a5a14}\n.log li.pen59{color:#ff9a9a;font-weight:700}\n.meta .storytag{display:inline-block;margin-left:8px;padding:0 6px;border:1px solid #ffffff2e;border-radius:4px;font-size:.68rem;letter-spacing:0;color:var(--muted);font-family:inherit;white-space:nowrap;vertical-align:1px}")
rep("    return _act.apply(this,arguments)};\n}\n\n</script>","    return _act.apply(this,arguments)};\n}\n"+js+"\n</script>")
# 英語
en={}
for v in FINAL_DUEL.values():
    for l in v['start']:en[l['ja']]=l['en']
    for k in('flop','turn','river','lose'):
        if v[k]:en[v[k]['ja']]=v[k]['en']
en[OUTRO_ALT[6]['ja']]=OUTRO_ALT[6]['en'];en[REVIEW_GOAL_LINE['reach']['ja']]=REVIEW_GOAL_LINE['reach']['en'];en[WATCH[0]]=WATCH[1];en[STORY_HAND_TAG['ja']]=STORY_HAND_TAG['en'];en[STORY_HAND_LOG['ja']]=STORY_HAND_LOG['en']
tpl=[[DUEL_TITLE[0],DUEL_TITLE[1]]]
def T(ja,en_,keys):
    for i,k in enumerate(keys):ja=ja.replace('{'+k+'}','{%d}'%i);en_=en_.replace('{'+k+'}','{%d}'%i)
    return [ja,en_]
for c in(2,3):tpl.append(T(OUTRO_ALT[c]['ja'],OUTRO_ALT[c]['en'],['n']))
for k in('steal','bluff','readcall'):tpl.append(T(REVIEW_GOAL_LINE[k]['ja'],REVIEW_GOAL_LINE[k]['en'],['k','r']))
seen=set()
for v in REVIEW_HAND_LINE.values():
    if v['ja'] in seen:continue
    seen.add(v['ja']);keys=[k for k in('no','hand','n') if '{'+k+'}' in v['ja']];tpl.append(T(v['ja'],v['en'],keys))
tpl.append(T(REVIEW_PEN_BTN['ja'],REVIEW_PEN_BTN['en'],['no']))
rep('const EN_DICT={','const EN_DICT={'+json.dumps(en,ensure_ascii=False)[1:-1]+',')
rep('const EN_TPL=[','const EN_TPL=['+json.dumps(tpl,ensure_ascii=False)[1:-1]+',')
open(OUT,'w',encoding='utf-8').write(s)
print('ok')
