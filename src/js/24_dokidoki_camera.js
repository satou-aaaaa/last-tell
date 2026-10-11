/* ---------- ドキドキ演出 ---------- */
// 1. オールイン後の勝率：残りの場札を全部（多いときは無作為に）試して数える
function calcEq(){
  const live=S.players.filter(inHand);if(live.length<2)return;
  const need=5-S.board.length,deck=S.deck.slice(),win=live.map(()=>0);let n=0;
  const pk=S.handNo+':'+live.map(p=>S.players.indexOf(p)).join(',');
  if(need===5&&S.eqPre&&S.eqPre.k===pk){live.forEach((p,k)=>{p.eqDir='';p.eq=S.eqPre.v[k]});return}
  const score=b=>{const sc=live.map(p=>bestN(p.hand.concat(b)));let top=sc[0];sc.forEach(x=>{if(cmp(x,top)>0)top=x});
    const ws=sc.map((x,k)=>cmp(x,top)===0?k:-1).filter(k=>k>=0);ws.forEach(k=>win[k]+=1/ws.length);n++};
  if(need===0)score(S.board);
  else if(need===1)deck.forEach(c=>score(S.board.concat([c])));
  else if(need===2){for(let a=0;a<deck.length;a++)for(let b=a+1;b<deck.length;b++)score(S.board.concat([deck[a],deck[b]]))}
  else for(let t=0;t<(need===5?2500:600);t++){const d=deck.slice(),add=[];for(let k=0;k<need;k++)add.push(d.splice(Math.floor(Math.random()*d.length),1)[0]);score(S.board.concat(add))}
  live.forEach((p,k)=>{const v=Math.round(win[k]/n*100);p.eqDir=p.eq==null?'':v>p.eq?' up':v<p.eq?' down':'';p.eq=v});
  if(need===5)S.eqPre={k:pk,v:live.map(p=>p.eq)};
}
const eqBadge=p=>S.runout&&p.eq!=null&&!S.handOver&&!p.folded?`<span class="eqb${p.eqDir||''}">勝率 ${p.eq}%</span>`:'';
// 4. オールイン：チップの山を前へ押し出して、卓が静まり返る
function pushChips(i){
  const p=S.players[i];
  S.hold=Math.max(S.hold||0,900*SPEED());
  Sound.thud();Sound.hush(true);$('table').classList.add('hush');
  const s0=S,h0=S.handNo;
  setTimeout(()=>{if(S===s0&&S.handNo===h0&&S.stare<0){$('table').classList.remove('hush');Sound.hush(false)}},1500*SPEED());
  if(reducedMotion())return;
  const src=i===0?$('mine').querySelector('.mystack'):$('spot'+i).querySelector('.mystack'),to=potRect();
  if(!src||!to)return;const r=src.getBoundingClientRect(),tb=$('table').getBoundingClientRect();if(!r.width)return;
  const el=document.createElement('div');el.className='potfly';el.innerHTML=chipStack(p.bet,false,true);
  el.style.left=(r.left+r.width/2-tb.left)+'px';el.style.top=(r.top+r.height/2-tb.top)+'px';$('table').appendChild(el);
  const dx=(to.left+to.width/2-r.left-r.width/2)*.55,dy=(to.top+to.height/2-r.top-r.height/2)*.55;
  el.animate([{transform:'translate(-50%,-50%) scale(1)'},{transform:'translate(-50%,-50%) scale(1.15)',offset:.25},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(1)`,opacity:.9}],
    {duration:800*SPEED(),easing:'cubic-bezier(.6,0,.2,1)',fill:'forwards'}).onfinish=()=>setTimeout(()=>el.remove(),200);
}
// 3. 大事な場面の持ち時間。第1〜3章は時間が切れても自動では降りない（難しさを変えないため）
const Clock=(()=>{
  let iv=0,key='',left=0,last=0,beat=0;
  const limit=()=>uraLv()>=3?10:CFG.ch&&CFG.ch.no<=3?45:30;
  function stop(){clearInterval(iv);iv=0;key='';$('clock').hidden=true;$('clock').classList.remove('low')}
  function start(k){
    if(!SETTINGS.clock||key===k)return;stop();key=k;left=limit()*1000;last=Date.now();beat=0;
    const s0=S,h0=S.handNo;$('clock').hidden=false;draw();
    iv=setInterval(()=>{
      if(S!==s0||S.handNo!==h0||S.handOver||S.toAct!==0||$('game').hidden)return stop();
      const now=Date.now(),dt=now-last;last=now;if(document.hidden)return; // 裏に回っている間は減らさない
      left-=dt;beat-=dt;
      if(left<=15000&&beat<=0){Sound.heart();if(left<=6000&&navigator.vibrate)try{navigator.vibrate(25)}catch(e){};beat=left<=6000?520:950}
      draw();
      if(left<=0)timeUp();
    },100);
  }
  function draw(){
    const t=Math.max(0,left),c=$('clock');
    c.querySelector('i').style.transform=`scaleX(${(t/(limit()*1000)).toFixed(3)})`;
    c.querySelector('span').textContent=t>0?`持ち時間 ${Math.ceil(t/1000)}秒`:'時間です';
    c.classList.toggle('low',t<=6000);
  }
  function timeUp(){
    clearInterval(iv);iv=0;
    if(CFG.ch&&CFG.ch.no<=3){S.msg='ジン「時間だ。そろそろ決めろ」';$('msg').textContent=S.msg;return}
    const me=S.players[0],toCall=S.currentBet-me.bet;stop();
    log(toCall>0?'時間切れ：フォールド扱い':'時間切れ：チェック扱い');S.msg=toCall>0?'時間切れでフォールド':'時間切れでチェック';
    act(0,toCall>0?'fold':'call');
  }
  return{start,stop};
})();
function bigSpotForMe(){
  const me=S.players[0],toCall=S.currentBet-me.bet;
  return toCall>0&&(toCall>=me.chips||toCall>=Math.max(BB()*5,potTotal()*.5));
}
// 5. ショーダウン：相手が1枚ずつ、焦らしながら開く
function revealThenShowdown(){
  const s0=S,h0=S.handNo,ok=()=>S===s0&&S.handNo===h0;
  const cont=S.players.filter(inHand),opp=cont.filter(p=>!p.human);
  if(!opp.length||S.runout)return showdown();
  if(quizReady('order')){S.toAct=-1;render();return askQuiz('order',()=>{if(ok())revealThenShowdown()})}
  S.reveal=true;S.toAct=-1;
  // R-14：リバーで最後にベット・レイズした人から時計回りに開く。リバーで誰も賭けていなければボタンの左から
  const st0=S.riverAggr>=0?S.riverAggr:(S.dealer+1)%N(),seat=p=>(S.players.indexOf(p)-st0+N())%N();
  opp.sort((a,b)=>seat(a)-seat(b));
  S.showOrder=cont.slice().sort((a,b)=>seat(a)-seat(b)).map(p=>S.players.indexOf(p));
  if(muckOn()){const sc0=p=>bestN(p.hand.concat(S.board));let best=S.riverAggr===0?sc0(S.players[0]):null;
    opp.forEach(p=>{const x=sc0(p);
      if(best&&!p.allIn&&S.players.indexOf(p)!==S.riverAggr&&cmp(x,best)<0&&Math.random()<.3){p.muckPlan=true;return}
      if(!best||cmp(x,best)>0)best=x});
    for(let k=opp.length-1;k>=0;k--)if(opp[k].muckPlan)opp.splice(k,1)}
  // スロウロール：勝っているマナーの悪い相手が、最後にわざとゆっくり開く
  const sc=cont.map(p=>bestN(p.hand.concat(S.board)));let top=sc[0];sc.forEach(x=>{if(cmp(x,top)>0)top=x});
  const slow=!S.players[0].folded&&cont.includes(S.players[0])&&cmp(sc[cont.indexOf(S.players[0])],top)<0?
    opp.find(p=>{const m=mannerOf(p);return m&&!(p.name==='ハヤト'&&S.players[0].chips>=60000&&!uraRule('ハヤト'))&&cmp(sc[cont.indexOf(p)],top)===0&&Math.random()<m.slowroll}):null;
  if(slow){opp.splice(opp.indexOf(slow),1);opp.push(slow)}
  dealerSay('ショーダウン');render();
  let t=600*SPEED();
  opp.forEach((p,k)=>{
    const lastOne=k===opp.length-1;
    if(p===slow){
      setTimeout(()=>{if(!ok())return;p.say={seq:(S.saySeq=(S.saySeq||0)+1),line:lineFor(p.name,'slowroll'),talk:true};S.meSmug=true;render()},t);
      t+=(reducedMotion()||SETTINGS.speed==='fast'?1000:2300);
      setTimeout(()=>{if(!ok())return;S.meSmug=false;p.showN=1;p.slow=true;Sound.sfx('card');render()},t);t+=1500*SPEED();
      setTimeout(()=>{if(!ok())return;p.showN=2;Sound.sfx('card');render()},t);t+=1300*SPEED();
      setTimeout(()=>{if(!ok())return;S.slowrolled=S.players.indexOf(p)},t-10);
      return;
    }
    setTimeout(()=>{if(!ok())return;p.showN=1;Sound.sfx('card');render()},t);t+=(lastOne?1300:800)*SPEED();
    setTimeout(()=>{if(!ok())return;p.showN=2;p.slow=lastOne;Sound.sfx('card');render()},t);t+=(lastOne?1300:700)*SPEED();
  });
  setTimeout(()=>{if(!ok())return;S.reveal=false;showdown()},t);
}

function roundComplete(){
  const ca=S.players.filter(canAct);
  if(ca.length===0)return true;
  if(ca.length===1&&ca[0].bet>=S.currentBet)return true;
  return !ca.some(needs);
}
function proceed(){
  const live=S.players.filter(inHand);
  if(live.length===1)return winUncontested(live[0]);
  const hold=S.hold||0;S.hold=0;
  const s0=S,h0=S.handNo; // 章を出入りしたあとに古いタイマーが動かないように
  if(roundComplete()){
    S.toAct=-1; // 通りの区切りでは誰の番でもない（待っている間にボタンを押せないように）
    const next={preflop:'flop',flop:'turn',turn:'river'}[S.street];
    // 1. オールインで勝負がついたら、全員の手を開き、残りの場札を1枚ずつ溜めてめくる
    if(next&&!S.runout&&live.filter(p=>!p.allIn).length<=1){
      S.runout=true;live.forEach(p=>{p.show=true});calcEq();
      log('オールイン：手札を開いて、残りのカードを配ります');dealerSay('ハンドをオープン');
      if(twiceOK(live)){if(CFG.house==='twice'||(typeof hasLesson==='function'&&hasLesson('twice'))){startTwice()}
        else if(twiceAskable()){render();return askTwice(live,()=>{if(S===s0&&S.handNo===h0)proceed()})}}
      if(quizReady('allin')){render();return askQuiz('allin',()=>{if(S===s0&&S.handNo===h0)proceed()})}
    }
    render();
    const st0=S.street,go=()=>{if(S===s0&&S.handNo===h0&&S.street===st0&&!S.reveal)nextStreet()}; // 同じ通りで2回進めない
    if(S.runout&&next&&next!=='flop')
      return setTimeout(()=>{if(S!==s0||S.handNo!==h0)return;S.tease=true;render();Sound.heart();
        setTimeout(go,(next==='river'?1700:1100)*SPEED())},1000*SPEED()+hold);
    return setTimeout(go,(S.runout?1300:800)*SPEED()+hold);
  }
  render();
  const i=S.toAct,p=S.players[i];
  if(p.human&&S.myTurnKey!==S.handNo+S.street+S.currentBet){S.myTurnKey=S.handNo+S.street+S.currentBet;S.myTurnAt=Date.now();askMaybe();
    if(!S.autoMe)requestAnimationFrame(keepMine);
    if(!S.autoMe&&!CFG.flashback&&preAct&&preAllowed()){const k=S.myTurnKey;setTimeout(()=>{if(S===s0&&S.toAct===0&&S.myTurnKey===k&&!S.handOver)runPre()},250*SPEED())}
    else if(!S.autoMe)turnCue()}
  if(p.human&&S.autoMe){render();return setTimeout(()=>{if(S===s0&&S.handNo===h0&&!S.handOver&&S.toAct===0)act(0,'call')},1600*SPEED())}
  if(p.human&&bigSpotForMe()&&!S.finalHand){Clock.start(S.myTurnKey);if(approxOn()&&!S.countNoted){S.countNoted=true;jinNote('迷ったら数えさせろ。恥ずかしいことじゃない',0)}}
  if(!p.human){
    const d=(S.scriptAI&&S.scriptAI(i))||cpuDecide(i);p.lastState=d.state;
    if(d.type==='fold'&&p.name==='ロク'&&uraRule('ロク')&&S.street==='preflop'&&S.aggr===0)d.type='call';if(!S.scriptAI)showTell(i,d);
    if(p.tell&&p.tell.street===S.street){const s1=S;setTimeout(()=>{if(S===s1&&S.toAct===i)camUpdate()},650*SPEED())}
    S.camSkip=p.extra&&d.type==='fold'&&!(p.tell&&p.tell.street===S.street)?i:-1;
    const rd=S.readShow&&S.readShow.i===i&&S.readShow.hand===S.handNo&&!S.scriptAI?S.readShow:null;S.readShow=null;const rdT=rd?readSeq(i,rd):0;
    const fast=p.tell&&p.tell.cue==='fast';
    // 考えている間に、ときどきひとこと（速攻のクセのときは黙ってすぐ賭ける）
    const talk=!rd&&!fast&&!(p.tell&&p.tell.cue==='talk')&&Math.random()<.4;
    if(talk){p.say={seq:(S.saySeq=(S.saySeq||0)+1),line:thinkLine(p,S.currentBet-p.bet),talk:true}}
    // 2. 大きな賭けの前は、黙り込んでこちらをじっと見る。BGMが止まり、チップの音だけになる
    const toCall=S.currentBet-p.bet,pot=potTotal();
    const big=!fast&&S.stareKey!==S.handNo+S.street+i&&(d.type==='raise'&&(d.to>=p.bet+p.chips||d.to-p.bet>=Math.max(BB()*6,pot*.6))||d.type!=='fold'&&toCall>=Math.max(BB()*6,p.chips*.4));
    if(big){S.stareKey=S.handNo+S.street+i;const go=()=>{S.stare=i;$('table').classList.add('hush');Sound.hush(true)};
      if(rd)setTimeout(()=>{if(S===s0&&S.handNo===h0&&!S.handOver&&S.toAct===i){go();render()}},rdT);else{p.say=null;go()}}
    render();
    // アングルショット：1ハンドに1回まで。ディーラーが止めるので、得はさせない
    const mn=mannerOf(p);let angle='';
    if(mn&&!big&&!S.scriptAI&&S.angleHand!==S.handNo&&d.type==='raise'&&Math.random()<mn.angleRate){
      const tc=S.currentBet-p.bet;
      if(tc===0&&d.rel&&mn.angles.includes('faketap'))angle='faketap';
      else if(tc>0&&mn.angles.includes('onechip'))angle='onechip';
      if(angle){S.angleHand=S.handNo;d.type='call';delete d.to}
    }
    const wait=(fast?200:650+Math.random()*600+(talk&&!big?700:0)+(big?1600:0))*SPEED()*(S.camSkip===i?.5:1)+hold+rdT;
    if(angle){setTimeout(()=>{if(S===s0&&S.handNo===h0&&!S.handOver&&S.toAct===i)angleCall(i,angle)},wait);
      setTimeout(()=>{if(S===s0&&S.handNo===h0&&!S.handOver&&S.toAct===i)askQuiz(angle==='faketap'?'tap':'onechip',()=>{if(S===s0&&S.handNo===h0&&!S.handOver&&S.toAct===i){S.angleActing=i;act(i,'call');angleRuling(i,angle)}})},wait+1300*SPEED());return}
    setTimeout(()=>{if(S===s0&&S.handNo===h0&&!S.handOver&&S.toAct===i)act(i,d.type,d.to)},wait);
  }
}
function act(i,type,to){
  const p=S.players[i];
  if(S.handOver||i!==S.toAct)return;
  const toCall=S.currentBet-p.bet;
  if(p.human)penRecord(p,type==='raise'&&p.acted?'call':type,toCall);
  if(p.human)advRecord(p,type==='raise'&&p.acted?'call':type,toCall);
  if(p.human&&!(type==='raise'&&p.acted))selfRecord(p,type,to);
  if(p.human&&type==='fold'){const q=S.players.find(o=>!o.human&&inHand(o)&&o.tell&&o.tell.street===S.street&&o.tell.meaning==='strong'&&o.tell.truth==='strong'&&S.currentBet>p.bet);if(q)S.foldRead={name:q.name,cue:q.tell.cue};
    if(S.myTurnAt&&Date.now()-S.myTurnAt>=15000)grantTitle('tankfold');
    if(hasLesson('foldbb')&&S.street==='preflop'&&p.bet>0&&S.handNo-(S.fbbAt||-99)>=S.players.filter(q=>!q.out).length){const x=Math.min(p.bet,BB());p.bet-=x;p.total-=x;p.chips+=x;S.fbbAt=S.handNo;log(`降りる勇気：置いたブラインド ${fmt(x)} が戻った`)}if(S.street==='preflop')S.myPreFold=true}
  if(type==='raise'&&p.acted)type='call'; // 足りないオールインのあとは、レイズできない
  if(p.human)Clock.stop();if(p.human&&S.ask&&!S.ask.done&&S.ask.hand===S.handNo)answerAsk(0,true);
  if(S.stare===i){S.stare=-1;$('table').classList.remove('hush');Sound.hush(false)}
  if(type==='fold'){p.folded=true;p.lastAct='フォールド';p.lastType='fold';log(`${p.name}：フォールド`)}
  else if(type==='call'){
    if(toCall<=0){p.lastAct='チェック';p.lastType='call';log(`${p.name}：チェック`)}
    else{const a=post(p,toCall);p.lastAct=p.allIn?`オールイン ${fmt(p.bet)}`:`コール ${fmt(a)}`;p.lastType='call';log(`${p.name}：コール ${fmt(a)}${p.allIn?'（オールイン）':''}`)}
  }else{
    to=Math.min(to,p.bet+p.chips);
    const prev=S.currentBet;
    post(p,to-p.bet);
    if(p.bet>prev){
      const inc=p.bet-prev;
      const full=inc>=S.minRaise;if(full)S.minRaise=inc;
      S.currentBet=p.bet;S.raises++;S.aggr=i;if(S.street==='river')S.riverAggr=i;S.lastCalled=-1;
      if(p.human&&S.street!=='preflop')S.myPostAggro=true;
      if(S.street==='preflop')p.raisedPre=true;else if(S.street==='flop'&&prev===0)p.cbetFlop=true;
      // 足りないオールインは、すでに話した人にレイズの権利を戻さない（コールかフォールドだけ）
      if(full)S.players.forEach(q=>{if(q!==p)q.acted=false});
      else S.players.forEach(q=>{if(q!==p&&q.acted&&q.actBet!=null&&S.currentBet-q.actBet>=S.minRaise)q.acted=false}); // R-10
      p.lastAct=p.allIn?`オールイン ${fmt(p.bet)}`:`${prev===0?'ベット':'レイズ'} ${fmt(p.bet)}`;p.lastType='raise';log(`${p.name}：${prev===0?'ベット':'レイズ'} ${fmt(p.bet)}${p.allIn?'（オールイン）':''}`);
      dealerSay(p.allIn?'オールイン':`${prev===0?'ベット':'レイズ'}、${fmt(p.bet)}`);
    }else{p.lastAct='コール';p.lastType='call';log(`${p.name}：コール${p.allIn?'（オールイン）':''}`)}
  }
  if(p.human&&type==='call'&&toCall>0)S.lastCalled=S.aggr;
  p.acted=true;p.actBet=p.bet;
  if(type!=='fold'&&(type==='raise'||toCall>0))Sound.sfx('chip');
  afterAct(i,type,toCall);
  S.toAct=nextIdx(i,needs);
  proceed();
}
/* 行動のあと：吹き出し・動き・カットイン */
function afterAct(i,type,toCall){
  const p=S.players[i];
  let kind=type==='fold'?'fold':type==='call'?(toCall<=0?'check':'call'):'raise';
  if(p.allIn&&type!=='fold')kind='allin';
  p.actSeq=(p.actSeq||0)+1;p.actKind=kind;
  if(kind==='allin')pushChips(i);
  if(p.human)return;
  let line='';
  const st=p.lastState==='strong'?'_strong':p.lastState==='bluff'?'_bluff':'';
  if(p.tell&&p.tell.cue==='talk'&&p.tell.street===S.street&&kind!=='fold')line=lineFor(p.name,'talk');
  else if(S.needle===S.street&&!p.answered&&!(p.name==='タケル'&&S.needleStyle!=='stare')&&(p.faked===S.street||Math.random()<.7)){line=p.faked===S.street?FAKE_LINE[p.name]:needledLine(p);p.answered=true}
  else if(line=speechPick(p,kind)){}
  else if(Math.random()<talkRate(p.name)||kind==='allin')line=lineFor(p.name,(kind==='raise'||kind==='allin')?kind+st:kind);
  if(S.angleHand===S.handNo&&S.angleActing===i){S.angleActing=-1;line=''}
  p.say={seq:(S.saySeq=(S.saySeq||0)+1),act:p.lastAct,line};
  const boss=rankOf(p.name)>=3||(CFG.ch&&i===1);
  if(kind==='allin'&&boss)cutIn(p.name,lineFor(p.name,'allin'));
  camBand(kind,p.bet);
}
// ===== カメラ演出 案2 =====
const camSet=()=>SETTINGS.cam||(reducedMotion()?'soft':'strong');
const CAM_Z={mid:{port:1.5,land:1.3,pc:1.4},tell:{port:2.7,land:2.2,pc:2.4}};
const camView=()=>matchMedia('(orientation:landscape) and (max-height:520px)').matches?'land':innerWidth<700?'port':'pc';
// テルの場所：顔の中心からのずれ（顔の大きさに対する割合）。chips は相手の前のチップの山
const CAM_SPOT={sweat:{dx:.15,dy:-.18},smile:{dx:0,dy:.14},talk:{dx:0,dy:.14},stare:{dx:0,dy:-.1},still:{dx:0,dy:0,z:2},
  glance:{chips:.45,zk:.8},fast:{chips:1},glove:{dx:-.28,dy:.42},scar:{dx:.06,dy:.16},release:{dx:.06,dy:.16}};
let camState={i:-1,kind:'wide',seq:-1},camBackT=0;
function camGeom(i){const b=$('bust'+i),t=$('table');if(!b||!t)return null;const W=t.offsetWidth,H=t.offsetHeight;
  const bx=parseFloat(b.style.left)/100*W,bh=b.offsetHeight,by=b.offsetTop+bh*.45;
  // チップの山は斜めの卓の上にあるので、今のカメラの分を戻して位置を出す
  let cx=bx,cy=by+.14*H;const st=$('spot'+i)&&$('spot'+i).querySelector('.mystack .col');
  if(st){const m=new DOMMatrix(getComputedStyle($('cam')).transform),r=st.getBoundingClientRect(),tr=t.getBoundingClientRect();
    if(r.width){cx=(r.left+r.width/2-tr.left-m.e)/m.a;cy=(r.top+r.height/2-tr.top-m.f)/m.d}}
  return{W,H,bx,by,bh,cx,cy}}
function camTopPad(){const e=$('street'),t=$('table');if(!e||!t||!e.offsetParent)return 2;const r=e.getBoundingClientRect();return Math.max(2,r.bottom-t.getBoundingClientRect().top+4)}
// 動作の重さの改善 案3：毎コマの呼び出しは 36_layout_pass（sayWake）から。出ている吹き出しが無くなったら false を返し、止まる
function sayFollow(){const L=$('sayLayer'),c=$('cam');if(!L||!c||$('game').hidden)return false;
  const now=performance.now(),list=[...L.querySelectorAll('.say.go')].filter(sy=>now-(sy._t||0)<(sy.classList.contains('long')?3700:2800));if(!list.length)return false;
  list.forEach(sy=>{sy.style.marginLeft='';sy.style.marginTop=''});   // 先に全部戻してから測る（測る→書く→測る…をしない）
  const m=new DOMMatrix(getComputedStyle(c).transform),W=L.clientWidth,H=L.clientHeight,lr=L.getBoundingClientRect(),pad=4,tp=sayTopPad();
  list.forEach(sy=>{
    let dx=sy.offsetLeft*(m.a-1)+m.e,dy=sy.offsetTop*(m.d-1)+m.f;const r=sy.getBoundingClientRect();
    const l=r.left-lr.left+dx,t=r.top-lr.top+dy;
    if(l<pad)dx+=pad-l;else if(l+r.width>W-pad)dx-=l+r.width-(W-pad);
    if(t<tp)dy+=tp-t;else if(t+r.height>H-pad)dy-=t+r.height-(H-pad);
    sy._dx=dx;sy._dy=dy;sy._r={l:l+dx-(r.left-lr.left+dx-l),w:r.width,h:r.height}});
  // 吹き出しどうしが重なったら、あとの方を下へずらす
  const placed=[];list.map(sy=>{const r=sy.getBoundingClientRect();return{sy,l:r.left-lr.left+sy._dx,t:r.top-lr.top+sy._dy,w:r.width,h:r.height}}).sort((a,b)=>a.t-b.t||a.l-b.l).forEach(b=>{
    for(const a of placed)if(b.l<a.l+a.w+2&&a.l<b.l+b.w+2&&b.t<a.t+a.h+2&&a.t<b.t+b.h+2){const nt=a.t+a.h+4;b.sy._dy+=nt-b.t;b.t=nt}
    placed.push(b);b.sy.style.marginLeft=(b.sy._dx+(b.sy._ax||0)).toFixed(1)+'px';b.sy.style.marginTop=(b.sy._dy+(b.sy._ay||0)).toFixed(1)+'px'});
  return true}
function sayTopPad(){let tp=camTopPad();const m=$('msg'),t=$('table');if(S&&m&&t&&m.textContent.trim()&&m.offsetParent){const r=m.getBoundingClientRect(),tr=t.getBoundingClientRect();if(r.left<tr.right-4)tp=Math.max(tp,r.bottom-tr.top+4)}return tp}   // v71（改善提案§2）：横画面で字幕が右の列（卓の外）にあるときは数えない
(function(){const t=$('table');if(!t)return;t.style.overflow='clip';t.addEventListener('scroll',()=>{if(t.scrollTop||t.scrollLeft){t.scrollTop=0;t.scrollLeft=0}})})();
// 動作の重さの改善 案3：描き直しの後の位置合わせ（36_layout_pass）から呼ぶ。全部測ってから全部書く（中身は今までと同じ）
function fitTable(){const t=$('table');if(!t||$('game').hidden||!t.offsetParent)return;const tr=t.getBoundingClientRect();
  {const bc=[...t.querySelectorAll('#boardCards .card')].map(c=>c.getBoundingClientRect()).filter(r=>r.width),bt=bc.length?Math.min(...bc.map(r=>r.top)):1e9,bl=bc.length?Math.min(...bc.map(r=>r.left)):0,br=bc.length?Math.max(...bc.map(r=>r.right)):0;
    const tg=[];t.querySelectorAll('.felt .spot[data-c]').forEach(sp=>{const h=sp.querySelector('.hand');if(!h)return;const r=h.getBoundingClientRect();if(!r.width)return;tg.push([sp,r.left<br&&r.right>bl&&r.top<bt&&r.bottom+34>bt])});
    tg.forEach(([sp,on])=>sp.classList.toggle('cwside',on))}
  const sps=[...t.querySelectorAll('.felt .spot .chipwrap,.felt .spot .mystack')],cs=[...t.querySelectorAll('#plates .cue:not(.rd)')];
  sps.concat(cs).forEach(e=>{if(e.style.translate)e.style.translate=''});
  const pls=[...t.querySelectorAll('#plates .plate')].map(p=>p.getBoundingClientRect());
  const out=[];
  sps.forEach(sp=>{const r=sp.getBoundingClientRect();if(!r.width)return;let dx=0;
    if(r.left<tr.left+2)dx=tr.left+2-r.left;else if(r.right>tr.right-2)dx=tr.right-2-r.right;if(dx)out.push([sp,`${dx.toFixed(1)}px 0`])});
  cs.forEach(c=>{const r=c.getBoundingClientRect();if(!r.width)return;
    let dx=0,dy=0;if(r.left<tr.left+2)dx=tr.left+2-r.left;else if(r.right>tr.right-2)dx=tr.right-2-r.right;
    for(const p of pls)if(r.left+dx<p.right&&p.left<r.right+dx&&r.bottom>p.top+2&&r.top<p.bottom){dy=p.top-2-r.bottom;break}
    if(dx||dy)out.push([c,`${dx.toFixed(1)}px ${dy.toFixed(1)}px`])});
  out.forEach(([e,v])=>{e.style.translate=v})}
function fitRaise(){const p=$('raisePanel'),c=$('controls');if(!p||!c)return;
  // 操作欄が画面の下に貼りつく（スマホ縦・PC）ときは、パネルを開いている間だけ貼りつきをやめ、卓の下に並べる。手札が隠れない
  const open=!p.hidden&&!$('game').hidden;
  if(!open){if(p.dataset.seen){delete p.dataset.seen;p.style.position='';c.style.position=''}return}
  if(p.dataset.seen)return;const cs=getComputedStyle(c).position;if(cs==='fixed')return;
  p.dataset.seen='1';p.style.position='static';if(cs==='sticky')c.style.position='relative';
  const r=c.getBoundingClientRect();window.scrollBy({top:r.bottom-innerHeight+6,behavior:'auto'})}
setInterval(fitRaise,150);
function fitTags(){if($('game').hidden)return;document.querySelectorAll('#plates .plate .tag, #mine .me-l .tag').forEach(t=>{const box=t.parentElement,os=[...box.children].filter(c=>c!==t&&c.offsetWidth),w=box.id==='plates'||!os.length?box.clientWidth:Math.max(56,...os.map(c=>c.scrollWidth))+10;if(!w)return;
  if(t.dataset.fz&&t.dataset.tx===t.textContent&&t.dataset.w==w)return;t.style.fontSize='';t.dataset.tx=t.textContent;t.dataset.w=w;
  let f=parseFloat(getComputedStyle(t).fontSize),n=0;t.style.maxWidth=w+'px';while(t.scrollWidth>t.clientWidth+1&&f>7&&n++<30){f-=.5;t.style.fontSize=f+'px'}t.dataset.fz='1'})}
function fitMyHand(){document.querySelectorAll('.mine .myhand,#vs:not([hidden]) .vsrole,#controls button.act small').forEach(h=>{if(!h.textContent){h.style.fontSize='';h._fk='';return}
  const box=h.parentElement;if(!box||!box.clientWidth)return;
  // 動作の重さの改善 案3：前に合わせた時と文字・欄の幅・欄の文字の大きさが同じなら、合わせ直しても同じなので飛ばす
  const key=()=>h.textContent+'|'+box.clientWidth+'|'+getComputedStyle(box).fontSize;if(h._fk&&h._fk===key())return;
  h.style.fontSize='';let f=parseFloat(getComputedStyle(h).fontSize),k=0;
  while(h.scrollWidth>box.clientWidth+1&&f>9&&k++<12){f-=1;h.style.fontSize=f+'px'}h._fk=key()})}
addEventListener('scroll',()=>{if(tourI>=0)tourGuard()},{passive:true});
function tourGuard(){if(tourI<0)return;if($('game').hidden||(S&&(S.handOver||S.toAct!==0))){tourI=-1;$('tour').hidden=true;document.querySelectorAll('.tourhl').forEach(e=>e.classList.remove('tourhl'));return}
  const st=TOUR[tourI],el=st&&document.querySelector(st[0]);if(el&&typeof placeTour==='function')placeTour(el)}
function fitScene(){const sc=$('scene'),st=$('stage'),adv=$('btnAdv');if(!sc||sc.hidden||!st||!adv)return;
  st.style.height='';const top=sc.getBoundingClientRect().top+scrollY,need=adv.getBoundingClientRect().bottom+scrollY-top+8,room=innerHeight-Math.max(0,top-scrollY);
  if(need>room){const h=st.getBoundingClientRect().height;st.style.height=Math.max(0,Math.round(h-(need-room)))+'px'}}
// 動作の重さの改善 案3：0.3秒ごとの見回りはやめ、36_layout_pass の位置合わせ（描き直しの後・大きさが変わった時・1秒ごと）で呼ぶ
addEventListener('resize',fitScene);
function camXform(W,H,px,py,z,ay,minTy){let tx=W/2-px*z,ty=H*ay-py*z;tx=Math.min(0,Math.max(W-W*z,tx));ty=Math.min(H*.1,Math.max(H-H*z,ty));if(minTy!=null)ty=Math.max(ty,minTy);return`translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) scale(${z})`}
function camTo(i,kind){
  const c=$('cam'),t=$('table');if(!c)return;if(typeof sayWake==='function')sayWake();
  if(camSet()==='off'||kind==='wide'||i<0){c.style.transform='none';c.classList.remove('snapin');t.classList.remove('focusing');camState={i:-1,kind:'wide',seq:camState.seq,t0:0};camPlate(-1);return}
  if((kind==='tell'||kind==='me')&&camSet()!=='strong')kind='mid';
  const g=camGeom(i);if(!g)return;const v=camView(),p=S.players[i];
  let z,px,py,ay;
  if(kind==='me'){const el=$('mine').querySelector('.mybet .stack')||$('mine').querySelector('.mybet')||$('mine'),m=new DOMMatrix(getComputedStyle(c).transform),r=el.getBoundingClientRect(),tr=t.getBoundingClientRect();
    px=(r.left+r.width/2-tr.left-m.e)/m.a;py=(r.top+r.height/2-tr.top-m.f)/m.d;z=CAM_Z.tell[v];ay=.62}
  else if(kind==='tell'&&p.tell){const sp=CAM_SPOT[p.tell.cue]||{dx:0,dy:0};z=(sp.z||CAM_Z.tell[v]*(sp.zk||1));
    if(sp.chips!=null){px=g.bx+(g.cx-g.bx)*sp.chips;py=g.by+(g.cy-g.by)*sp.chips}else{px=g.bx+sp.dx*g.bh;py=g.by+sp.dy*g.bh}ay=.40}
  else{kind='mid';z=CAM_Z.mid[v]*(N()===2?.85:1);px=g.bx;py=g.by+.07*g.H;ay=.34}
  const fast=SETTINGS.speed==='fast';c.classList.toggle('snapin',kind==='tell'||kind==='me');
  c.style.transitionDuration=reducedMotion()?'0s':((kind==='tell'||kind==='me'?.32:.7)*(fast?.5:1))+'s';
  const sy=$('say'+i),minTy=kind==='mid'&&sy&&p.sayAt&&performance.now()-p.sayAt<2600?-(sy.offsetTop-(parseFloat(sy.style.marginTop)||0))*z+camTopPad():null;
  c.style.transform=camXform(g.W,g.H,px,py,z,ay,minTy);
  t.classList.add('focusing');t.classList.toggle('camme',kind==='me');t.classList.toggle('noblur',!SETTINGS.depth);camState.i=i;camState.kind=kind;camPlate(kind==='tell'?i:-1)}
// クローズのときは、その人の名札を薄くしてクセを見せる
function camPlate(i){document.querySelectorAll('#plates .plate').forEach(pl=>{const on=pl.id==='plate'+i;pl.style.opacity=on?'.12':'';pl.style.transition='opacity .2s'})}
// render のたびに：CPUの番ならその人へ、あなたの番・ショーダウン・ハンドの終わりは全体へ
function camUpdate(force){
  if(!S||!S.players||$('game').hidden)return;
  const i=S.toAct,p=i>=0?S.players[i]:null,cpu=p&&!p.human&&!S.handOver&&!S.reveal&&S.street!=='showdown'&&!S.autoMe;
  if(!cpu){clearTimeout(camBackT);if(camState.kind!=='wide'||force)camTo(-1,'wide');if(!$('camBand').hidden){clearTimeout(camBandT);camBandT=setTimeout(()=>{$('camBand').hidden=true},700*SPEED())}return}
  if(S.camSkip===i){if(camState.kind!=='wide')camTo(-1,'wide');return}
  if(camState.i!==i){clearTimeout(camBackT);camTo(i,'mid');camState.t0=performance.now()}
  // テルが出た瞬間だけ寄り直す（出ていないときは寄り直さない）
  const tl=p.tell,on=tl&&tl.street===S.street&&!p.folded;
  if(on&&camState.kind!=='me'&&tl.seq!==camState.seq&&performance.now()-(camState.t0||0)>=600*SPEED()){camState.seq=tl.seq;if(camSet()==='strong'){camTo(i,'tell');clearTimeout(camBackT);
    camBackT=setTimeout(()=>{if(camState.i===i&&camState.kind==='tell'&&S.toAct===i)camTo(i,'mid')},1300*SPEED())}}
  else if(force)camTo(i,camState.kind==='tell'?'tell':'mid')}
addEventListener('resize',()=>{if(S&&S.players)camUpdate(true)});
// レイズとオールインは帯と大きな英語の文字。コール・フォールドは小さな文字だけ
let camBandT=0;
function camBand(kind,amt){
  if(camSet()!=='strong'||!$('cutin').hidden)return;
  const b=$('camBand'),big=kind==='raise'||kind==='allin';
  const word={raise:'RAISE',allin:'ALL IN',call:'CALL',check:'CHECK',fold:'FOLD'}[kind];if(!word)return;
  b.querySelector('b').textContent=word;b.querySelector('small').textContent=big||kind==='call'?fmt(amt):'';
  b.className='camband'+(big?'':' calm');b.hidden=false;const w=b.querySelector('.word');w.style.animation='none';void w.offsetWidth;w.style.animation='';
  clearTimeout(camBandT);camBandT=setTimeout(()=>{b.hidden=true},1400*SPEED())}
function cutIn(name,line,release){$('camBand').hidden=true;
  const c=$('cutin');
  c.querySelector('.cav').innerHTML=avatar(name,'confident');
  c.querySelector('.ctext').innerHTML=release?`<b>${esc(name)}</b><span>最後のクセ</span><p>${typeof release==='string'?esc(release):'ジンの指が、顎の傷から離れた。'}</p>`:`<b>${esc(name)}</b><span>オールイン</span><p>「${esc(line)}」</p>`;
  c.hidden=false;c.classList.remove('go');void c.offsetWidth;c.classList.add('go');
  S.hold=1700;
  setTimeout(()=>{c.hidden=true},1800);
}

function nextStreet(){
  if(S.handOver||S.reveal||S.street==='showdown')return;
  gatherBets();
  S.players.forEach(p=>{p.bet=0;p.acted=false;if(!p.folded&&!p.allIn)p.lastAct=''});
  S.currentBet=0;S.minRaise=BB();S.raises=0;S.tease=false;
  if(S.street==='river')return revealThenShowdown();
  const next={preflop:'flop',flop:'turn',turn:'river'}[S.street];
  const n=next==='flop'?3:1;
  S.deck.pop();
  const dealt=[];for(let k=0;k<n;k++){const c=S.deck.pop();S.board.push(c);dealt.push(c)}
  S.street=next;
  log(`${STREET_JP[next]}：${dealt.map(cardStr).join(' ')}`);
  dealerSay(STREET_JP[next]);Sound.sfx('card');
  if(S.runout)calcEq();
  S.toAct=nextIdx(S.dealer,needs);
  proceed();
}
// コールされなかった賭けを本人へ返す（いちばん多く出した人の、2番目との差）。ほかに誰も出していないときは返さない（ポットが空にならないように）
const betOf=p=>p.total-(p.ante||0); // アンティを除いた、賭けた額
function refundUncalled(){const c=S.players.filter(p=>p.total>0).sort((a,b)=>betOf(b)-betOf(a));if(!c.length)return;
  if(!c[1])return;const ex=betOf(c[0])-betOf(c[1]);if(ex<=0)return;const p=c[0];p.total-=ex;p.chips+=ex;p.refund=ex;if(p.chips>0)p.allIn=false;log(`${p.name}に、コールされなかった ${fmt(ex)} を返した`)}
function winUncontested(p){
  const pr=potRect();refundUncalled();
  const pot=potTotal();p.chips+=pot;p.won=pot;
  S.handOver=true;S.toAct=-1;
  S.msg=`${p.name}の勝ち（+${fmt(pot)}）`;
  log(`${p.name}がポット ${fmt(pot)} を獲得`);
  if(p.human&&S.street==='preflop'&&S.aggr===0){S.steals++;if(isLatePos())S.lateSteals=(S.lateSteals||0)+1;if(CFG.goal.type==='steal')S.msg=`ブラインドを盗んだ！（+${fmt(pot)}）`}
  if(p.human&&S.street!=='preflop'&&S.myPostAggro&&isWeak(p.hand,S.board)){S.bluffs++;if(CFG.goal.type==='bluff')S.msg=`ブラフ成功！（+${fmt(pot)}）`}
  if(p.human)S.showOffer=true;
  else if(CFG.tells&&(mannerOf(p)||p.style===STYLES.liar||p.style===STYLES.liar2)&&weakNow(p.hand)&&Math.random()<.2){
    p.show=true;p.say={seq:(S.saySeq=(S.saySeq||0)+1)+4000,act:'',line:'ふふ、見せてあげる'};log(`${p.name}はブラフだった（${p.hand.map(cardStr).join(' ')}）`)}
  payHouse72();
  if(mannerOf(p)&&mannerOf(p).gloat&&S.players[0].total>=BB()*3&&Math.random()<.35)taunt(p,'gloat');
  endHand();
  potPush();potCall();
}
const muckOn=()=>proAI()&&!S.runout&&!(CFG.ch&&!CFG.ura&&!CFG.ch.p2&&CFG.ch.no===4);
function showdown(){
  refundUncalled();const pr=potRect(),potAmt=potTotal();
  S.street='showdown';
  const cont=S.players.filter(inHand);
  cont.forEach(p=>{p.show=true;p.score=bestN(p.hand.concat(S.board));p.hname=handName(p.score)});
  const contrib=S.players.filter(p=>p.total>0);
  const levels=[...new Set(contrib.map(betOf))].sort((a,b)=>a-b),anteSum=contrib.reduce((a,p)=>a+(p.ante||0),0);
  let prev=0;
  // 案8：2回めくりなら、2回目の場札を配って、ポットを半分ずつ分ける（端数は1回目へ）
  if(S.twice&&S.twiceBase){S.board2=S.twiceBase.slice();while(S.board2.length<5)S.board2.push(S.deck.pop());log(`2回目：${S.board2.slice(S.twiceBase.length).map(cardStr).join(' ')}`)}
  const runs=S.board2?[[S.board,0],[S.board2,1]]:[[S.board,-1]];
  for(const [bd,ri] of runs){
  const sc=new Map(cont.map(p=>[p,ri===1?bestN(p.hand.concat(bd)):p.score]));prev=0;
  for(const L of levels){
    let amt=L===levels[0]?anteSum:0;contrib.forEach(p=>{amt+=Math.min(betOf(p),L)-Math.min(betOf(p),prev)});
    if(ri>=0){const half=Math.floor(amt/2/100)*100;amt=ri===0?amt-half:half}
    let elig=cont.filter(p=>betOf(p)>=L);
    if(!elig.length)elig=cont;
    const top=elig.reduce((a,b)=>cmp(sc.get(a),sc.get(b))>=0?a:b);
    const seat=p=>(S.players.indexOf(p)-S.dealer-1+N())%N();
    const winners=elig.filter(p=>cmp(sc.get(p),sc.get(top))===0).sort((a,b)=>seat(a)-seat(b)); // 端数はボタンの左から
    const share=Math.floor(amt/winners.length/100)*100;
    let rem=amt-share*winners.length;
    winners.forEach((w,k)=>{const g=share+(k<Math.floor(rem/100)?100:0)+(k===0?rem%100:0);w.chips+=g;w.won+=g;if(ri>=0&&g>0){(w.runWon=w.runWon||[0,0])[ri]+=g}});
    prev=L;
  }
  if(ri===1)cont.forEach(p=>{p.hname2=handName(sc.get(p))});
  }
  if(muckOn())cont.forEach(p=>{if(p.human||p.won>0||p.allIn||S.players.indexOf(p)===S.riverAggr)return;if(p.muckPlan){p.show=false;p.mucked=true}});
  const contS=cont.filter(p=>!p.mucked||p.human);
  cont.forEach(p=>log(p.mucked&&!p.human?`${p.name}は手を伏せて捨てた`:`${p.name}：${p.hand.map(cardStr).join(' ')}（${p.hname}）`));
  judgeDeclare();selfLearn();talkSD(contS);
  {const me=S.players[0];if(cont.includes(me)&&!(!me.won&&S.riverAggr!==0&&!S.runout&&SETTINGS.muck))selfFoolCheck()}
  {const me=S.players[0];if(S.stat&&jinAdviceOn()&&cont.includes(me)){if(me.won>0)S.stat.sdWin++;else S.stat.sdLoss++}}
  contS.forEach(p=>(p.tellLog||[]).forEach(t=>{log(`答え合わせ：${p.name}の「${CUE_LABEL[t.cue]}」は${TRUTH_JP[t.truth]}だった`);noteTell(p.name,t.cue,t.truth)}));
  // B4：テルの章（第4章）で、初めて答え合わせをしたときに1回だけ
  if(CFG.ch&&!CFG.ura&&!CFG.ch.p2&&CFG.ch.no===4&&!S.bookSaid&&contS.some(p=>!p.human&&(p.tellLog||[]).length)){S.bookSaid=true;jinNote("クセは人それぞれだ。本に書いてある意味を信じるな",0)}
  if(CFG.tells||CFG.ch)renderNotes();
  const ag=S.players[S.aggr];
  if(S.aggr>0&&S.lastCalled===S.aggr&&ag&&!ag.extra&&ag.show&&S.players[0].won>0&&(ag.lastState==='bluff'||isWeak(ag.hand,S.board))){S.reads=(S.reads||0)+1;S.readMsg=true}
  const ws=S.players.filter(p=>p.won>0);
  ws.forEach(w=>log(`${w.name}が ${fmt(w.won)} を獲得`));
  S.msg=ws.map(w=>`${w.name}の勝ち（${w.hname}・+${fmt(w.won)}）`).join(' / ');
  if(S.board2){const rw=k=>cont.filter(p=>p.runWon&&p.runWon[k]>0).map(p=>p.name).join('＆')||'なし';
    S.msg=`1回目：${rw(0)}　2回目：${rw(1)}`;const me0=S.players[0];if(me0.runWon&&me0.runWon[0]>0&&me0.runWon[1]>0)grantTitle('twice');
    if(!S.twiceJin){S.twiceJin=true;jinNote('運を半分にしても、腕は半分にならん',1)}}
  if(S.readHit){S.msg=`読み的中！ ${S.msg}`;S.readHit=null}
  if(S.readMsg&&CFG.flashback)S.readMsg=false;if(S.readMsg){S.readMsg=false;S.msg=`ブラフを見抜いた！ ${S.msg}`;grantTitle('read');
    const bt=(ag.tellLog||[]).filter(t=>t.meaning==='bluff'&&t.truth==='bluff').pop();if(bt)S.mietaNow={name:ag.name,cue:bt.cue}}
  const me=S.players[0];
  if(me.show){
    if(me.won>0){
      if(me.score[0]>=7)grantTitle('quads');
      if(me.allIn)grantTitle('allin');
      const loser=cont.filter(q=>!q.human&&!q.won).pop();
      if(loser&&!CFG.flashback){loser.say={seq:(loser.actSeq||0)+1000,act:'',line:Math.random()<.5?'ナイスハンド':lineFor(loser.name,'fold')||'ナイスハンド'}}
    }else{
      const ws2=cont.filter(q=>q.won>0);
      if(me.hand[0].r===14&&me.hand[1].r===14)grantTitle('aalose');
      if(me.score[0]>=6)grantTitle('cooler');
      if(S.board.length===5&&ws2.length){const turn=b=>bestN(b.hand.concat(S.board.slice(0,4)));
        if(ws2.every(w=>cmp(turn(me),turn(w))>0))grantTitle('badbeat')}
    }
  }
  if(me.show&&!me.won&&cont.includes(me))S.sdLoss=true;
  if(me.show&&!me.won&&S.riverAggr!==0&&!S.runout&&SETTINGS.muck){me.mucked=true;log('あなたは手を伏せて捨てた')}
  payHouse72();
  S.handOver=true;S.toAct=-1;
  if(S.slowrolled>0){const sp=S.players[S.slowrolled];grantTitle('slowrolled');taunt(sp,'gloat');
    jinNote('顔に出すな。ああいう勝ち方をする奴は、もう焦っている',0)}
  else{const g=ws.find(w=>mannerOf(w)&&mannerOf(w).gloat);if(g&&me.show&&!me.won&&Math.random()<.6)taunt(g,'gloat')}
  endHand();
  potPush();potCall();
}
function endHand(){if(S&&S.players){leakEnd();mobCount()}talkEnd();
  if(CFG.ch&&CFG.ch.script==='badbeat'&&S.autoMe){S.autoMe=false;jinNote('AAでも負ける。……ここからだ。少ないチップで、一つずつ取り返せ',1);
    S.twiceUnlocked=true;const te=S.players.find(q=>q.name==='テツ');if(te)setTimeout(()=>{if(S.handOver){te.say={seq:(S.saySeq=(S.saySeq||0)+1)+8000,act:'',line:'ひでえな。……次からは、2回めくるか？'};render()}},1400*SPEED())}
  {const me=S.players[0];if(penOn()&&(S.myActs||[]).length&&(hasLesson('pen')?me.total-me.won>0:me.total-me.won>=BB()*10&&(S.penCount||0)<3))S.penReady=S.handNo}
  if(S.finalHand&&CFG.ch&&CFG.ch.p2)p2FinalEnd();
  else if(S.finalHand){const me=S.players[0];
    if(S.released&&me.folded&&S.street==='river'){S.finalRead=true;S.msg='ジンの最後のクセを読み切った';S.mietaNow={name:'ジン',cue:'release',big:true}}
    else if(S.released&&!me.folded){jinNote('見えていたはずだ。……もう一度だ',3);if(!loadStory().alt)S.altEnd=true}
    else if(!S.released&&me.folded)jinNote('降りるのが早い。最後まで見ろ',3);}
  if(CFG.ch&&CFG.ch.no===6&&!S.gouGone){const g=S.players.find(q=>q.name==='ゴウ');
    if(g&&g.chips<=0){S.gouGone=true;g.say={seq:(S.saySeq=(S.saySeq||0)+1)+5000,act:'',line:'ディーラーのせいだ！今の配り方はおかしいだろ！'};
      log('フロアの黒田が来て、ゴウを静かに店の外へ案内した');const cr=S.players.find(q=>q.name==='クロウ'&&!q.out);
      if(cr)setTimeout(()=>{if(S.handOver){cr.say={seq:(S.saySeq=(S.saySeq||0)+1)+6000,act:'',line:'この卓では、負け方も見られている'};render()}},1600*SPEED())}}
  // ティルト：マナーの悪い相手が、1ハンドで持ち点の3割以上を取られたら熱くなる
  if(S.players[0].won>0)S.players.forEach(q=>{const m=mannerOf(q);if(!m||q.won>0)return;
    if(q.tilt>0&&q.total>=BB()*5)grantTitle('tiltwin');
    if(q.hs&&q.total>=q.hs*.3&&!q.out&&m.tilt.hands>0){const was=q.tilt>0;q.tilt=m.tilt.hands;
      if(!was){q.say={seq:(S.saySeq=(S.saySeq||0)+1)+2000,act:'',line:lineFor(q.name,'tilt')};log(`${q.name}が熱くなっている`);
        jinNote(`${q.name}が熱くなった。強い手で待て`,1)}}});
  if(S.seatGood&&S.players[0].won>0&&roughOf(S.players[N()-1])&&S.players[N()-1].total>0)grantTitle('seat');
  {const me=S.players[0];if(me.allIn)S.myAllin=true;if(me.folded)S.myFolds=(S.myFolds||0)+1;if(me.chips>0&&me.chips<=me.start/2)S.wasLow=true;
   if(S.players.some(q=>q.name==='ゴウ'&&q.tilt>0))S.gouTilted=true}
  S.dryStreak=S.myPreFold?(S.dryStreak||0)+1:0;
  if(S.dryStreak>=8)grantTitle('dry');
  if(S.handNo>=30)grantTitle('onemore');
  if(S.players[0].won>0&&S.players[0].hand.length===2){const rs=S.players[0].hand.map(c=>c.r).sort((a,b)=>a-b);if(rs[0]===2&&rs[1]===7)grantTitle('seven2')}
  const me=S.players[0],g=CFG.goal,opps=S.players.slice(1).filter(p=>!p.extra||g.type==='bust');
  if(S.foldRead&&me.folded&&!S.mietaNow)S.mietaNow=S.foldRead;S.foldRead=null;
  if(S.mietaNow){const m=S.mietaNow;S.mietaNow=null;mieta(m.name,m.cue,m.big)}
  if(S.gloveHand===S.handNo&&me.won>0){const cr=S.players.find(q=>q.name==='クロウ');if(cr&&cr.total>0){grantTitle('realtell');S.realtell=true}}
  if(g.type==='flash'){S.result='flash';S.msg='';render();return}
  if(me.chips<=0)S.result='lose';
  else if(opps.every(p=>p.chips<=0)&&duelGate59()){S.result='win';if(g.type!=='bust'&&g.type!=='free')S.msg=`相手のチップを全部取った！ ${S.msg}`}
  else if(g.type==='steal'&&S.steals>=g.n)S.result='win';
  else if(g.type==='bluff'&&S.bluffs>=g.n)S.result='win';
  else if(g.type==='readcall'&&(S.reads||0)>=g.n&&duelGate59())S.result='win';
  else if(g.type==='reach'&&me.chips>=g.n&&duelGate59())S.result='win';
  else if(g.type==='final'&&S.finalRead)S.result='win';
  else if(g.type==='boss'&&S.players.some(p=>!p.human&&p.name===CFG.ch.opps[0].name&&p.chips<=0))S.result='win';
  adviceAfterHand();
  if(S.result&&!CFG.run&&jinAdviceOn()){S.review=reviewLines(S.stat,CFG.ch&&!CFG.ura?CFG.ch.no:null,S.result);saveReview(S.review)}
  if(CFG.run&&RUN)RUN.peak=Math.max(RUN.peak||0,S.players[0].chips);
  if(S.result==='win'&&CFG.ura)uraWin();
  else if(S.result==='win'&&CFG.ch)awardStars(CFG.ch.no);
  if(S.result){talkReveal(true);log(S.result==='win'?'目標達成':'チップがなくなった',true)}
  if((S.result==='win'||S.result==='lose')&&!S.ltSent){S.ltSent=true;if(CFG.ch&&!CFG.ura){ltTrack(S.result==='win'?'chapter_clear':'game_over',{ch:CFG.ch.no});ltAd('chapter_end')}else if(!CFG.ch&&!CFG.run&&!CFG.ura)ltAd('free_end')}
  noteHighlight();
  if(S.result==='lose'&&CFG.ch){const t=loadStory();t.loses[CFG.ch.no]=(+t.loses[CFG.ch.no]||0)+1;saveStory(t)}
  render();nextvTick();
}
