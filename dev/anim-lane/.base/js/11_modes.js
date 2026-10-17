// ===== 案3：章ごとの3つ星課題（見た目と称号だけ。チップも難しさも変わらない） =====
const STARS={
  1:[['クリアする',s=>1],['10ハンド以内にクリア',s=>s.handNo<=10],['一度もオールインせずにクリア',s=>!s.myAllin]],
  2:[['クリアする',s=>1],['後ろの席から3回スチールする',s=>(s.lateSteals||0)>=3],['5回フォールドで降りる',s=>(s.myFolds||0)>=5]],
  3:[['クリアする',s=>1],['ブラフで2回勝つ',s=>s.bluffs>=2],['ショーダウンで一度も負けない',s=>!s.sdLoss]],
  4:[['クリアする',s=>1],['クセを2回読む',s=>(s.reads||0)>=2],['読み宣言を1回当てる',s=>(s.declHits||0)>=1]],
  5:[['クリアする',s=>1],['チップ半分以下から元に戻す',s=>!!s.wasLow],['ショーダウンで一度も負けない',s=>!s.sdLoss]],
  6:[['クリアする',s=>1],['クロウの本物のクセで取る',s=>!!s.realtell],['ゴウを熱くさせずに勝つ',s=>!s.gouTilted]],
  7:[['クリアする',s=>1],['一度もオールインせずにクリア',s=>!s.myAllin],['20ハンド以内にクリア',s=>s.handNo<=20]]};
const STAR_KEY='shisho-stars';
// ===== ジンのアドバイス A・B・C（第7章・回想・自動進行・裏の卓の段位7以上では出さない） =====
// 第1〜3章では、ハンドや卓が終わったあとにだけ出す（jinNote(…,0) は次のハンドが始まると消える）
const jinAdviceOn=()=>!CFG.flashback&&!S.autoMe&&uraLv()<7&&!(CFG.ch&&(CFG.ch.no===7||CFG.ch.script==='final'||CFG.ch.script==='mfinal'));
function newStat(){return{hands:0,vpip:0,pfr:0,faced:0,foldToBet:0,goodFold:0,badCall:0,sdWin:0,sdLoss:0,lateSteals:0,bluffs:0}}
const ADV_KEY='shisho-advice',REVIEW_KEY='shisho-review';
// 自分の行動を記録（CPU の判断には使わない）
function advRecord(p,type,toCall){
  if(!jinAdviceOn()||!S.stat)return;const st=S.stat;S.advHand=S.advHand||{};
  if(S.street==='preflop'&&(type==='raise'||(type==='call'&&toCall>0))&&S.advHand.v!==S.handNo){S.advHand.v=S.handNo;st.vpip++}
  if(S.street==='preflop'&&type==='raise'&&S.advHand.r!==S.handNo){S.advHand.r=S.handNo;st.pfr++}
  const potB=potTotal()-toCall;
  if(toCall>0&&toCall>=potB*.5){st.faced++;if(type==='fold')st.foldToBet++}
  if(toCall>0&&(type==='fold'||type==='call')){const opps=S.players.filter(q=>q!==p&&inHand(q)).length;if(!opps)return;
    const ag=S.players[S.aggr],nw=S.aggr>0&&ag&&ag.lastType==='raise'?.6*betNarrow(toCall/Math.max(1,potB)):0;
    const pot=potTotal(),need=Math.min(toCall,p.chips)/(pot+Math.min(toCall,p.chips)),eq=equity(p.hand,S.board,opps,150,nw);
    if(type==='fold'&&need-eq>=.1){st.goodFold++;if(toCall>=BB()*3)S.goodFoldHand=S.handNo}
    if(type==='call'&&eq<need-.1)st.badCall++}}
function adviceAfterHand(){
  if(!jinAdviceOn()||!S.stat)return;S.stat.hands++;S.stat.lateSteals=S.lateSteals||0;S.stat.bluffs=S.bluffs||0;
  // 案A：降りたときのひとこと（1卓2回まで。赤ペンが出るハンドでは出さない）
  if(S.goodFoldHand===S.handNo&&S.penReady!==S.handNo&&(S.advA||0)<2&&!S.result){
    let t;const shown=S.players.some(q=>!q.human&&q.show&&q.score&&q.score[0]>=2);
    if(!S.catchUsed){S.catchUsed=true;t=P2ON()?P2_CATCH[p2Type()]:'降りるのも勝負のうちだ'}
    else if(shown)t='見ろ。あれに払うところだった';
    else t=['それでいい','安く済んだな','今のは、降りる手だ'][Math.floor(Math.random()*3)];
    S.advA=(S.advA||0)+1;jinNote(t,0);
    try{const o=JSON.parse(localStorage.getItem(ADV_KEY))||{};o.v=1;o.a=(+o.a||0)+1;localStorage.setItem(ADV_KEY,JSON.stringify(o));if(o.a>=10)grantTitle('folder')}catch(e){}}
  // 案C：相手の見立て（第5・6章、フリー、はしご、裏の卓。10ハンド目のあと）
  if(S.handNo===10&&(!CFG.ch||CFG.ura||CFG.ch.no===4||CFG.ch.no===5||CFG.ch.no===6))jinView()}
const VIEW={station:'{n}は何にでも入ってくる。ブラフは効かん。強い手で待て',tight:'{n}は慎重だ。賭けてきたら、たいてい本物だ',tight2:'{n}は慎重だ。賭けてきたら、たいてい本物だ',
  nit:'{n}はすぐ降りる。小さく賭けて、ブラインドを拾え',nit2:'{n}はすぐ降りる。小さく賭けて、ブラインドを拾え',liar:'{n}はよく嘘をつく。大きく賭けてきても、すぐ降りるな',liar2:'{n}はよく嘘をつく。大きく賭けてきても、すぐ降りるな',
  normal:'{n}は素直だ。手の強さどおりに賭けてくる',rude:'{n}は荒い。だが熱くなると、もっと荒くなる。そこを待て',hayato:'あいつは、賭けるときは本物だ。……熱くなったら別だがな',crow:'あいつは降りない。ブラフは打つな。手で勝て'};
function jinView(){
  if(uraLv()>=7)return;const only4=CFG.ch&&!CFG.ura&&CFG.ch.no===4;
  const ls=[];S.players.forEach(q=>{if(q.human||q.out||q.extra||q.name==='ジン')return;const lk=leakOn(q);if(only4){if(lk)ls.push(lk.view.split('{n}').join(q.name));return}
    const t=VIEW[q.styleKey];if(!t){if(lk)ls.push(lk.view.split('{n}').join(q.name));return}let l=t.split('{n}').join(q.name);
    if(CFG.ch&&!CFG.ura&&q.styleKey==='hayato'&&CFG.ch.no===5)l+='　（ジンは、それ以上何も言わなかった）';
    if(CFG.ch&&!CFG.ura&&q.styleKey==='crow'&&CFG.ch.no===6)l+='　（ジンはグラスを置いた）';ls.push(l);if(lk)ls.push(lk.view.split('{n}').join(q.name))});
  if(!ls.length)return;S.jinViews=ls;jinNote(ls.join('　／　'),1);log('ジンの見立て：'+ls.join('　／　'));renderNotes()}
// 案B：今夜の三行
const REVIEW_WIN_LINE={"1": "ゲンを飛ばした。それで十分だ", "2": "三回、盗んだな。後ろの席の使い方は覚えた", "3": "何もない手で、二回勝った。それが仕掛けだ", "4": "嘘を二回、見抜いた。顔を見ていたな", "5": "少ないチップから戻した。焦らなかったな", "6": "最後の一人だ。……王冠の卓でな", "7": "……読んだな", "11": "ゲンを飛ばした。最初の一歩だ", "12": "よその店で、二回盗んだ。度胸がついたな", "13": "カイに勝った。急がなかったからだ", "14": "看板持ちの卓で、最後の一人だ", "15": "……読んだな"};
const REVIEW_LOSE_LINE='……まだ、お前の打ち方は見えてこない';
function reviewLines(st,ch,result){
  if(!st||st.hands<5)return null;const r=[];
  r.push(st.goodFold>=2?'降りるべきところで、よく降りた':st.bluffs>=2?'仕掛けどころは、わかってきたな':st.lateSteals>=3?'後ろの席の使い方は、悪くない':st.sdWin>=3&&st.sdLoss===0?'見せ合いで、一度も負けなかったな':st.leakWins>=2?'相手の穴を、よく見ていたな':result==='win'?(REVIEW_WIN_LINE[ch]||'それでいい'):REVIEW_LOSE_LINE);
  let k='none';
  if(st.vpip/st.hands>=.6){k='loose';r.push(`参加しすぎだ。10回に${Math.round(st.vpip/st.hands*10)}回は入っている`)}
  else if(st.faced>=5&&st.foldToBet/st.faced>=.8){k='fold';r.push('大きく賭けられると、全部降りている。見透かされるぞ')}
  else if(st.badCall>=2){k='call';r.push('払いすぎだ。足りない見込みで追いかけるな')}
  else if(st.pfr===0&&st.vpip>=3){k='passive';r.push('入るときは、いつも様子見だな。自分から仕掛けろ')}
  else r.push('目立った悪いくせは、ない');
  r.push({loose:'次は、いい手だけで入ってみろ',fold:'次は、一度だけ最後まで見てみろ',call:'次は、コールの前に一度数えろ',passive:'次は、後ろの席でだけ仕掛けてみろ',none:'次は、相手の顔をもっと見ろ'}[k]);
  return reviewLesson59(r,ch,result)}
function reviewHTML(r){return r?`<div class="ava">${avatar(P2ON()?'師匠':'ジン')}</div><b>${P2ON()?esc(mentorName()+'の三行'):'ジンの三行'}</b><ol>${r.map(t=>`<li>${esc(t)}</li>`).join('')}</ol>`:''}
function saveReview(r){if(!r)return;try{const o=JSON.parse(localStorage.getItem(REVIEW_KEY))||{};const ch=o.ch&&typeof o.ch==='object'?o.ch:{};
  if(CFG.ch&&!CFG.ura)ch[CFG.ch.no]=r;const free=CFG.ch&&!CFG.ura?(o.free||null):r;localStorage.setItem(REVIEW_KEY,JSON.stringify({v:1,ch,free}))}catch(e){}}
function loadReview(){try{const o=JSON.parse(localStorage.getItem(REVIEW_KEY))||{};return{ch:o.ch&&typeof o.ch==='object'?o.ch:{},free:Array.isArray(o.free)?o.free:null}}catch(e){return{ch:{},free:null}}}
// ===== 主人公のテル：賭ける額・考える時間・体のクセ。ショーダウンで見せた手を、相手が覚えて読む =====
// 第1〜4章では出さない。フリー対戦は常連（ランク2以上）、章・裏の卓・はしごはボス級（ランク4以上）が読む
const selfOn=()=>!CFG.flashback&&!S.autoMe&&!S.finalHand&&(!!CFG.ura||!!CFG.run||!CFG.ch||CFG.ch.no>=5);
const selfReader=p=>rankOf(p.name)>=(!CFG.ch&&!CFG.run?2:4);
const BODY_P=()=>CFG.ura||CFG.run||!CFG.ch?.3:({5:.4,6:.25,7:.1}[CFG.ch.no]||0);
function selfRecord(p,type,to){
  if(!selfOn()||type!=='raise')return;
  const pot=potTotal(),ms=S.myTurnAt?Date.now()-S.myTurnAt:5000,big=(Math.min(to,p.bet+p.chips)-p.bet)>=.75*pot;
  const b={hand:S.handNo,street:S.street,big,fast:ms<2500,slow:ms>=7000,body:false};
  const opps=S.players.filter(q=>q!==p&&inHand(q)).length;
  if(opps&&Math.random()<BODY_P()&&equity(p.hand,S.board,opps,150)>=.65){b.body=true;log('あなた：自分のチップをちらっと見た');
    if(!S.bodyNoted){S.bodyNoted=true;jinNote('今、チップを見たな。……強いときのお前のクセだ。相手も見ているぞ',1)}}
  S.myLastBet=b;(S.myBetsHand=S.myBetsHand||[]).push(b)}
let rdTimers=[];
function readClear(){rdTimers.forEach(clearTimeout);rdTimers=[];const l=$('rdLine');if(l)l.hidden=true;const c=$('rdcue');if(c)c.remove();if(S){S.readLook=-1;S.readCard=null}}
function readPt(el,tr){const r=el.getBoundingClientRect();return[r.left+r.width/2-tr.left,r.top+r.height/2-tr.top,r]}
function readLine(i,why){const b=$('bust'+i),t=$('table'),l=$('rdLine');if(!b||!l)return;const tr=t.getBoundingClientRect(),br=b.getBoundingClientRect();
  const tg=why==='body'?$('mine').querySelector('.card'):($('mine').querySelector('.mybet .stack')||$('mine').querySelector('.mybet'));if(!tg)return;
  const x1=br.left+br.width/2-tr.left,y1=br.top+br.height*.48-tr.top,[x2,y2]=readPt(tg,tr),dx=x2-x1,dy=y2-y1;
  l.style.left=x1+'px';l.style.top=y1+'px';l.style.width=Math.hypot(dx,dy)+'px';l.style.transform=`rotate(${Math.atan2(dy,dx)}rad)`;
  l.hidden=false;l.style.animation='none';void l.offsetWidth;l.style.animation=''}
function readCue(i,txt){const b=$('bust'+i),pl=$('plates');if(!b||!pl)return;let c=$('rdcue');if(!c){c=document.createElement('span');c.id='rdcue';c.className='cue rd';pl.appendChild(c)}
  const m=new DOMMatrix(getComputedStyle($('cam')||pl).transform),br=b.getBoundingClientRect(),pr=pl.getBoundingClientRect(),k=m.a||1;
  c.style.left=((br.left-pr.left)/k+br.width/k*.06)+'px';c.style.top=Math.max(4,(br.top-pr.top)/k+br.height/k*.06)+'px';c.textContent=txt;c.classList.remove('go');void c.offsetWidth;c.classList.add('go')}
function readSeq(i,rd){
  readClear();const s0=S,h0=S.handNo,p=S.players[i],sp=SPEED(),ok=()=>S===s0&&S.handNo===h0&&S.toAct===i&&!S.handOver;
  const at=(ms,f)=>rdTimers.push(setTimeout(()=>{if(ok())f();else readClear()},ms*sp));
  log(`${p.name}は、あなたのくせを読んでいる`);
  at(400,()=>{S.readLook=i;render();if(rd.why==='size'||rd.why==='body')readLine(i,rd.why)});
  at(900,()=>{readCue(i,rd.why==='fast'||rd.why==='slow'?'……':'じっ');S.readCard=READ_LOOK[rd.why](p.name);
    if(camSet()==='strong'){$('rdLine').hidden=true;camTo(i,'me')}render()});
  at(2300,()=>{const c=$('rdcue');if(c)c.remove();$('rdLine').hidden=true;S.readCard=null;S.readLook=-1;if(camState.kind==='me')camTo(i,'mid');render()});
  at(2700,()=>{const L=(SELF_READ_CH[p.name]||SELF_READ)[rd.why]||SELF_READ[rd.why];
    p.say={seq:(S.saySeq=(S.saySeq||0)+1)+9000,act:'',line:rd.reread?'今度は……本物か？':(L[rd.dir]||SELF_READ[rd.why][rd.dir]),sub:`読み：${SELF_WHY[rd.why]} → ${SELF_DIR[rd.dir]}`};
    S.myRead={hand:S.handNo,why:rd.why};render()});
  return 2700*sp}
// 案3：読ませてから裏をかく。強いと読んで降りた相手に弱い手を見せる／弱いと読んでコールした相手に強い手で勝つ
function selfFoolCheck(){const me=S.players[0];if(!me.score||!(S.readsHand||[]).length)return;
  const strong=me.score[0]>=2,r=S.readsHand.find(r=>{const q=S.players[r.i];return q&&!q.out&&(r.dir==='strong'?q.folded&&!strong:!q.folded&&strong)});if(!r)return;
  const q=S.players[r.i];(S.selfFooled=S.selfFooled||{})[q.name+r.why]=S.handNo+(rankOf(q.name)>=5?4:8);(S.selfReread=S.selfReread||{})[q.name+r.why]=1;
  q.fooled=S.handNo;q.say={seq:(S.saySeq=(S.saySeq||0)+1)+9500,act:'',line:FOOL_SAY[q.name]||'……わざとか'};
  S.foolTag={hand:S.handNo,text:FOOL_TAG[r.why](q.name)};log(`${q.name}を引っかけた`);
  const st=$('foolStamp');st.hidden=false;st.style.animation='none';void st.offsetWidth;st.style.animation='';clearTimeout(st._t);st._t=setTimeout(()=>{st.hidden=true},1400*SPEED());
  grantTitle('bait');if(!S.foolJin){S.foolJin=1;jinNote('読ませてから、裏をかく。それが本当のテルの使い方だ',0)}}
function selfLearn(){
  const me=S.players[0];if(me.folded||!me.score||(!me.won&&S.riverAggr!==0&&!S.runout&&SETTINGS.muck)||!(S.myBetsHand||[]).length)return;
  const strong=me.score[0]>=2,m=S.selfMem=S.selfMem||{big:{s:0,w:0},fast:{s:0,w:0},slow:{s:0,w:0}};
  S.myBetsHand.forEach(b=>{for(const k of ['big','fast','slow'])if(b[k])m[k][strong?'s':'w']++})}
const SELF_WHY={size:'賭ける額',fast:'賭ける早さ',slow:'考える時間',body:'チップを見る目線'},SELF_DIR={strong:'強い',weak:'弱い'};
const SELF_READ={size:{strong:'その額……強いときの額だ',weak:'その額……前に外したときと同じだ'},fast:{strong:'迷わず賭けたな。持ってる顔だ',weak:'早すぎる。持ってないときの早さだ'},
  slow:{strong:'長く考えてから大きく来た。本物だな',weak:'迷いが長い。自信がないんだろう'},body:{strong:'今、チップを見た。いい手が来たな'}};
// 口調を変えるキャラ。読んだ中身（何を見て、強い／弱いのどちらか）は必ず言う
const SELF_READ_CH={ハヤト:{size:{strong:'その額……強いときの額だろ、二代目',weak:'その額、外したときと同じだぜ、二代目'},fast:{strong:'迷わず来たな。持ってるだろ、二代目',weak:'早すぎだぜ、二代目。持ってないな'},
    slow:{strong:'長く考えて大きく来た。本物だな、二代目',weak:'迷いが長いぜ、二代目。自信ないんだろ'},body:{strong:'今チップ見ただろ、二代目。いい手だな'}},
  クロウ:{size:{strong:'その額……強いときの額ですね',weak:'その額……外したときと同じですね'},fast:{strong:'迷いがありませんね。お持ちでしょう',weak:'早すぎますね。お持ちでない'},
    slow:{strong:'長考の末に大きく。本物ですね',weak:'迷いが長い。自信がおありでない'},body:{strong:'今、チップをご覧になった。いい手ですね'}}};
const READ_LOOK={size:n=>`${n}が、あなたの賭けた額を見ている`,body:n=>`${n}が、あなたの目線を見ている`,fast:n=>`${n}が、あなたの間（ま）を計っている`,slow:n=>`${n}が、あなたの間（ま）を計っている`};
const FOOL_SAY={ハヤト:'……わざとかよ、二代目',クロウ:'……お見事。拝見しました'};
const FOOL_TAG={size:n=>`${n}は、もう額では読まない`,fast:n=>`${n}は、もう間では読まない`,slow:n=>`${n}は、もう間では読まない`,body:n=>`${n}は、もう目線では読まない`};
const SELF_JIN={size:'賭ける額でバレている。強いときだけ大きく賭けるな',fast:'すぐ賭けるくせを読まれている。考える時間を揃えろ',slow:'考える時間で読まれている。迷う時間も、いつも同じにしろ',body:'チップを見るくせは、強い相手ほど見逃さない'};
function selfAdj(p){
  const L=S.myLastBet;if(!selfOn()||!L||L.hand!==S.handNo||L.street!==S.street||!selfReader(p))return 0;
  const m=S.selfMem||{},hon=x=>x&&x.s>=2&&x.w===0?1:x&&x.w>=2&&x.s===0?-1:0;let adj=0,why='';
  const off=k=>((S.selfFooled||{})[p.name+k]||0)>S.handNo;
  if(L.big&&!off('size')){const h=hon(m.big);if(h){adj+=h>0?.05:-.05;why='size'}}
  if(L.fast&&!off('fast')){const h=hon(m.fast);if(h){adj+=h>0?.04:-.04;why=why||'fast'}}
  if(L.slow&&!off('slow')){const h=hon(m.slow);if(h){adj+=h>0?.04:-.04;why=why||'slow'}}
  if(L.body&&!off('body')){adj+=.05;why=why||'body'}
  adj=Math.max(-.08,Math.min(.08,adj));
  if(adj&&why){const i=S.players.indexOf(p),dir=adj>0?'strong':'weak';
    S.readsHand=S.readsHand||[];if(!S.readsHand.some(r=>r.i===i&&r.why===why))S.readsHand.push({i,why,dir});
    const k=why+p.name,last=(S.selfSaid=S.selfSaid||{})[k];
    // 見せるのは1ハンドに1回まで。同じ相手・同じクセでも、3ハンド空ければまた見せる
    if(S.readShownHand!==S.handNo&&(last==null||S.handNo-last>3)){S.selfSaid[k]=S.handNo;S.readShownHand=S.handNo;
      const rr=S.selfReread&&S.selfReread[p.name+why];if(rr)delete S.selfReread[p.name+why];
      S.readShow={i,why,dir,hand:S.handNo,reread:!!rr}}
    else S.myRead={hand:S.handNo,why};
    if(!(S.selfJin||{})[why]){(S.selfJin=S.selfJin||{})[why]=1;jinNote(SELF_JIN[why],1)}}
  return adj}
// ===== 案4：裏の卓（第7章のあと。ボスと縛りつきで再戦し、段位を上げる。本編には影響しない） =====
const URA_LV=['相手のチップ +25%','クセの出る確率 −20%','持ち時間が10秒','ボスの縛り','ブラインドが5ハンドごとに上がる','自分のチップ −20%','ジンのヒントなし','相手のチップ さらに +50%'];
const BOSS_RULE={'ゲン':'プリフロップでレイズできない（コールかフォールドだけ）','ロク':'ロクは、スチールに降りない','セキ':'自分の手札の1枚が、フロップまで伏せたまま','レイカ':'最初から逆のクセ','ハヤト':'ハヤトは熱くならず、毎回スロウロールしてくる','クロウ':'手袋のクセが半分しか出ない','ジン':'傷のクセが一度だけ、わざと逆に出る'};
const URA_LEVELS=[[1000,2000],[1500,3000],[2000,4000],[3000,6000],[5000,10000],[8000,16000]];
const URA_KEY='shisho-ura';
// ===== 案5：はしご（5つの卓を順に回る。卓の合間にジンの教えを1つ選ぶ。教えはチップでもお金でも買えない） =====
const RUN_TABLES=[1,2,3,4,6],RUN_GOAL=[80000,120000,170000,230000,300000],RUN_BLINDS=[[1000,2000],[1500,3000],[2000,4000],[3000,6000],[4000,8000]];
const RUN_REG=[{name:'ケンジ',style:'normal'},{name:'ミサキ',style:'normal'},{name:'タロウ',style:'normal'}];
const LESSONS=[{id:'face',name:'顔を見ろ',desc:'クセの出る確率 +15%'},{id:'foldbb',name:'降りる勇気',desc:'プリフロップで降りたとき、1周に1回だけ、置いたブラインドが戻る'},
  {id:'seat',name:'後ろの席',desc:'毎卓、最初の席を自分で選べる'},{id:'rumor',name:'噂好き',desc:'卓ごとに噂を1つ聞ける'},
  {id:'twice',name:'二度めくり',desc:'オールインで手が決まったら、いつも2回めくる'},{id:'pen',name:'赤ペン',desc:'負けたハンドのあと、赤ペンが毎回出る'},{id:'seven2',name:'一杯おごり',desc:'7と2で勝つと、ほかの全員からBBの4倍'}];
const RUN_KEY='shisho-run';let RUN=null;
function loadRun(){try{const o=JSON.parse(localStorage.getItem(RUN_KEY))||{};return{best:+o.best||0,pts:+o.pts||0,plays:+o.plays||0}}catch(e){return{best:0,pts:0,plays:0}}}
function hasLesson(id){return !!(CFG&&CFG.run&&RUN&&RUN.lessons.includes(id))}
function startRun(){RUN={t:0,chips:50000,lessons:[],stat:newStat()};const r=loadRun();r.plays++;try{localStorage.setItem(RUN_KEY,JSON.stringify({v:1,...r}))}catch(e){}
  show('game');CFG={run:{t:0},blinds:RUN_BLINDS[0]};S={players:[],handOver:true,handNo:0};$('between').hidden=true;pickLesson(runTable)}  // 仮の CFG にもブラインドを置く（卓を作る前に BB() を読む処理があっても止まらない）
function runBox(html){const box=$('runBox');box.innerHTML=`<div class="qin runbox">${html}</div>`;box.hidden=false;return box}
function pickLesson(then){
  const left=LESSONS.filter(l=>!RUN.lessons.includes(l.id));if(RUN.lessons.length>=4||!left.length)return then();
  const opts=shuffle(left.slice()).slice(0,3);
  const box=runBox(`<p class="qq">ジンの教えを1つ選べ（${RUN.lessons.length+1}/4）</p><div class="lessons">${opts.map(l=>`<button data-ls="${l.id}"><b>${esc(l.name)}</b><small>${esc(l.desc)}</small></button>`).join('')}</div>`);
  box.querySelectorAll('[data-ls]').forEach(b=>b.onclick=()=>{RUN.lessons.push(b.dataset.ls);box.hidden=true;then()})}
function runTable(){
  const t=RUN.t,ch=CHAPTERS[RUN_TABLES[t]-1],goal={type:'reach',n:RUN_GOAL[t]},goalText=`${fmt(RUN_GOAL[t])}点に届く`;
  const pool=ch.opps.map(o=>({name:o.name,style:o.style,label:o.label})).concat(RUN_REG.filter(r=>!ch.opps.some(o=>o.name===r.name)));
  const n=2+(Math.random()<.5?1:0),opps=[pool[0]].concat(shuffle(pool.slice(1)).slice(0,n-1));
  const houses=['','straddle','bomb','seven2'],house=houses[Math.floor(Math.random()*houses.length)]||null,oc=Math.round((40000+t*20000)/1000)*1000;
  const go=()=>startGame({ch:null,run:{t},title:`はしご　${t+1}卓目　${ch.venue}`,blinds:RUN_BLINDS[t],goal,goalText,hint:null,refill:false,tells:true,house,lamp:ch.lamp,bgm:ch.bgm,
    seats:[{name:'あなた',chips:RUN.chips,human:true}].concat(opps.map(o=>({...o,chips:oc})))});
  if(!hasLessonRun('rumor'))return go();
  const cand=opps.filter(o=>TELLS[o.name]),o=cand[Math.floor(Math.random()*cand.length)];if(!o)return go();
  playScene(ch,[['店主',`${o.name}さん、強い手のときは「${CUE_LABEL[TELLS[o.name].strong.cue]}」って噂だよ`]],go)}
function hasLessonRun(id){return !!(RUN&&RUN.lessons.includes(id))}
function runSave(clear){const r=loadRun(),me=S.players&&S.players[0];r.best=Math.max(r.best,RUN.t+(clear?0:0));r.pts=Math.max(r.pts,me?me.chips:0);
  try{localStorage.setItem(RUN_KEY,JSON.stringify({v:1,...r}))}catch(e){}return r}
function runNext(){RUN.chips=S.players[0].chips;RUN.peak=Math.max(RUN.peak||0,RUN.chips);RUN.t++;runSave();
  if(RUN.t>=RUN_TABLES.length)return runOver(true);pickLesson(runTable)}
function runCanvas(clear){
  const {cv,ctx}=cvBase('はしご　'+(clear?'朝まで勝ち続けた':`${RUN.t+1}卓目で力尽きた`),`最高 ${fmt(RUN.peak||0)}点　教え：${RUN.lessons.map(id=>LESSONS.find(l=>l.id===id).name).join('、')||'なし'}`);
  RUN_TABLES.forEach((no,k)=>{const x=200+k*200,on=k<RUN.t;ctx.beginPath();ctx.arc(x,420,46,0,Math.PI*2);ctx.fillStyle=on?'#e2b65b':'#2a2c36';ctx.fill();ctx.lineWidth=4;ctx.strokeStyle='#e2b65b';ctx.stroke();
    ctx.fillStyle=on?'#111':'#e2b65b';ctx.font='800 36px sans-serif';ctx.textAlign='center';ctx.fillText(String(k+1),x,433);
    ctx.fillStyle='#fff';ctx.font='600 22px sans-serif';ctx.fillText(CHAPTERS[no-1].venue.replace(/^.*「|」$/g,''),x,510)});
  return cv}
function runOver(clear){
  const me=S.players&&S.players[0];RUN.peak=Math.max(RUN.peak||0,me?me.chips:0);const r=runSave(clear);if(clear)grantTitle('night');
  const box=runBox(`<p class="qq">${clear?'五つの卓を勝ち抜いた。外は、もう朝だ':`${RUN.t+1}卓目で、チップがなくなった`}</p>
    <div class="runmap">${RUN_TABLES.map((x,k)=>`<i class="${k<RUN.t?'on':''}"></i>`).join('')}</div>
    ${(()=>{const r=jinAdviceOn()?reviewLines(RUN.stat):null;return r?`<div class="review">${reviewHTML(r)}</div>`:''})()}
    <ul><li>回った卓：${RUN.t}/5</li><li>教え：${RUN.lessons.map(id=>esc(LESSONS.find(l=>l.id===id).name)).join('、')||'なし'}</li><li>これまでの最高：${r.best}卓</li></ul>
    <div class="qopts"><button id="runShot">画像にする</button><button id="runAgain">もう一度</button><button id="runHome">タイトルへ</button></div>`);
  $('runShot').onclick=()=>shareImage(runCanvas(clear),'LAST TELL　はしご');
  $('runAgain').onclick=()=>{box.hidden=true;startRun()};$('runHome').onclick=()=>{box.hidden=true;RUN=null;show('title')}}
function loadUra(){try{const o=JSON.parse(localStorage.getItem(URA_KEY))||{};return{rank:o.rank&&typeof o.rank==='object'?o.rank:{}}}catch(e){return{rank:{}}}}
const uraLv=()=>CFG&&CFG.ura?CFG.ura.level:0;
const uraRule=name=>uraLv()>=4&&CFG.ura.boss===name;
function uraRules(boss,lv){return URA_LV.slice(0,lv).map((t,k)=>k===3?`ボスの縛り：${BOSS_RULE[boss]}`:t)}
function startUra(no){
  const ch=CHAPTERS[no-1],boss=ch.opps[0].name,lv=Math.min(8,(+loadUra().rank[boss]||0)+1);
  const mul=1+(lv>=1?.25:0)+(lv>=8?.5:0),fin=ch.goal.type==='final';
  const goal=fin?{type:'bust'}:ch.goal,goalText=fin?'ジンのチップを全部取る':ch.goalText;
  startGame({ch:{...ch,script:null,goal,goalText},ura:{boss,level:lv,no},nanori:false,title:`裏の卓　${boss}　${lv}段`,blinds:ch.blinds,
    seats:[{name:'あなた',chips:lv>=6?Math.round(ch.you*.8/1000)*1000:ch.you,human:true}].concat(ch.opps.map(o=>({...o,chips:Math.round(o.chips*mul/1000)*1000}))),
    goal,goalText,hint:null,refill:!!ch.refill,tells:true,house:ch.house||null,lamp:ch.lamp,bgm:ch.bgm,lore:'',
    levels:lv>=5?(ch.levels||URA_LEVELS):(ch.levels||null),levelHands:lv>=5?5:(ch.levelHands||0)})}
function uraWin(){const u=loadUra(),b=CFG.ura.boss;u.rank[b]=Math.max(+u.rank[b]||0,CFG.ura.level);
  try{localStorage.setItem(URA_KEY,JSON.stringify({v:1,rank:u.rank}))}catch(e){}
  S.msg=`${b}に${CFG.ura.level}段で勝った！ ${S.msg}`;if(CFG.ura.level>=8)grantTitle('ura8')}
// ===== 案7：ジンの赤ペン（大きく負けたハンドのあと、一番損だった判断を1つだけ） =====
const penOn=()=>!CFG.flashback&&!S.autoMe&&(CFG.ch?CFG.ch.no>=4:true);
function penRecord(p,type,toCall){
  if(!penOn())return;const opps=S.players.filter(q=>q!==p&&inHand(q)).length;if(!opps)return;
  const q=S.players.find(o=>!o.human&&inHand(o)&&o.tell&&o.tell.street===S.street&&o.tell.truth===o.tell.meaning&&o.tell.meaning!=='none');
  (S.myActs=S.myActs||[]).push({street:S.street,type,toCall:Math.max(0,toCall),pot:potTotal(),eq:equity(p.hand,S.board,opps,200),tell:q?{name:q.name,m:q.tell.meaning}:null})}
function penReview(){
  let best=null;const pct=x=>Math.round(x*100);
  for(const a of S.myActs||[]){const need=a.toCall>0?a.toCall/(a.pot+a.toCall):0;let c=null;
    if(a.type==='call'&&a.toCall>0&&a.eq<need-.1)c={d:need-.1-a.eq,line:'この額なら、降りてよかった',x:`（${STREET_JP[a.street]}でコール：勝つ見込み ${pct(a.eq)}%、必要なのは ${pct(need)}%）`};
    else if(a.type==='fold'&&a.eq>need+.15)c={d:a.eq-need-.15,line:'ここは、降りなくてよかった',x:`（${STREET_JP[a.street]}でフォールド：勝つ見込み ${pct(a.eq)}%、必要なのは ${pct(need)}%）`};
    if(a.tell&&((a.tell.m==='strong'&&a.type!=='fold'&&a.toCall>0)||(a.tell.m==='bluff'&&a.type==='fold'))){const t={d:.2,line:'顔を見ていたか？',x:`（${STREET_JP[a.street]}で、${a.tell.name}のクセが出ていた）`};if(!c||t.d>c.d)c=t}
    if(c&&(!best||c.d>best.d))best=c}
  return best||{line:'運が悪かっただけだ。打ち方は悪くない',x:''}}
// ===== 案2：読み宣言（当ててもチップは増えない。勝ち負けにも関係しない） =====
const READ_KEY='shisho-read';
function loadRead(){try{const o=JSON.parse(localStorage.getItem(READ_KEY))||{};return{tries:+o.tries||0,hits:+o.hits||0,byName:o.byName&&typeof o.byName==='object'?o.byName:{}}}catch(e){return{tries:0,hits:0,byName:{}}}}
const DECL_JP=['役なし','ワンペア','ツーペア以上'];
const declOn=()=>!CFG.flashback&&(CFG.ch?CFG.ch.no>=4:!!CFG.tells);
function judgeDeclare(){const d=S.declare;S.declare=null;if(!d)return;const t=S.players[d.target];if(!t||!t.show||!t.score)return;
  const cat=Math.min(2,t.score[0]),hit=cat===d.guess,r=loadRead();r.tries++;if(hit)r.hits++;
  const b=r.byName[t.name]=r.byName[t.name]||{t:0,h:0};b.t=(+b.t||0)+1;if(hit)b.h=(+b.h||0)+1;
  try{localStorage.setItem(READ_KEY,JSON.stringify({v:1,...r}))}catch(e){}
  if(hit){S.declHits=(S.declHits||0)+1;log(`読み的中：${t.name}は${DECL_JP[cat]}だった`);S.readHit={name:t.name};if(r.hits>=5)grantTitle('soulread')}
  else{log(`読みは外れた：${t.name}は${DECL_JP[cat]}だった`);if(!S.declMissNoted){S.declMissNoted=true;jinNote('外れたか。……手を見るな、顔を見ろ',1)}}}
function loadStars(){try{const o=JSON.parse(localStorage.getItem(STAR_KEY))||{};const ch=o.ch&&typeof o.ch==='object'?o.ch:{};
  const r={};for(let k=1;k<=7;k++){const a=Array.isArray(ch[k])?ch[k]:[];r[k]=[0,1,2].map(i=>a[i]?1:0)}return r}catch(e){const r={};for(let k=1;k<=7;k++)r[k]=[0,0,0];return r}}
function starCount(st){return Object.values(st).reduce((a,x)=>a+x.reduce((b,y)=>b+y,0),0)}
function awardStars(no){const L=STARS[no];if(!L)return;const st=loadStars(),got=[];
  L.forEach(([name,f],i)=>{let ok=false;try{ok=!!f(S)}catch(e){}if(ok&&!st[no][i]){st[no][i]=1;got.push(name)}});
  try{localStorage.setItem(STAR_KEY,JSON.stringify({v:1,ch:st}))}catch(e){}
  if(got.length){log(`星を手に入れた：${got.join('、')}`);S.msg=`${'★'.repeat(got.length)} ${S.msg}`}
  if(starCount(st)>=21)grantTitle('stars21')}
function loadTitles(){try{const t=JSON.parse(localStorage.getItem(TITLE_KEY));return t&&typeof t==='object'&&t.got&&typeof t.got==='object'?t.got:{}}catch(e){return{}}}
function grantTitle(id){
  const got=loadTitles();const t=TITLES.find(x=>x.id===id);if(!t)return;
  const first=!got[id];got[id]=(got[id]||0)+1;
  try{localStorage.setItem(TITLE_KEY,JSON.stringify({v:1,got}))}catch(e){}
  if(!first)return;
  log(`称号「${t.name}」を手に入れた`);
  const el=$('game').hidden?$('toast2'):$('toast');el.innerHTML=`<span class="tava">${avatar('ジン')}</span><span><b>称号「${esc(t.name)}」</b><em>ジン「${esc(t.jin)}」</em></span>`;
  el.hidden=false;el.classList.remove('go');void el.offsetWidth;el.classList.add('go');
  clearTimeout(grantTitle.t);grantTitle.t=setTimeout(()=>{el.hidden=true},4200);
}