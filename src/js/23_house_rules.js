/* ---------- 店ごとのハウスルール ---------- */
const HOUSE={
  straddle:{name:'ストラドル',desc:'ビッグブラインドの次の人は、配る前にBBの2倍を置いてもよい（置いた人は、プリフロップで最後にアクションできる）'},
  bomb:{name:'ボムポット',desc:'5ハンドに1回、全員がBBの2倍を出し合い、フロップから始める'},
  seven2:{name:'7-2ゲーム',desc:'7と2の手で勝つと、ほかの全員からBBの2倍のボーナス'},
  twice:{name:'2回めくり',desc:'オールインで手が決まったら、残りの場札を2回めくって、ポットを半分ずつ分ける'},
};
let myStraddle=false;
// ===== 案8：2回めくり =====
// 2人のオールインだけ。台本のハンド（第5章のバッドビート、第7章の最後のハンド、回想）には使わない
function twiceOK(live){return live.length===2&&live.some(p=>p.human)&&!S.autoMe&&!S.finalHand&&!CFG.flashback&&S.board.length<5}
function twiceAskable(){return !!CFG.ch&&!CFG.levels&&CFG.ch.no>=5&&SETTINGS.twiceAsk!==false&&(CFG.ch.no>5||S.twiceUnlocked)}
function startTwice(){if(CFG.levels)return;S.twice=true;S.twiceBase=S.board.slice();log('2回めくります');dealerSay('2回めくります')}
const TWICE_CAREFUL=['ロク','ハル','セキ','ミナ','カオル','タロウ','テツ','ソウ'];
let twiceTermSeen=false;
function askTwice(live,then){
  const opp=live.find(p=>!p.human),box=$('quiz');let done=false;
  const fin=yes=>{if(done)return;done=true;clearTimeout(t);box.hidden=true;
    if(yes){const ok=Math.random()<(TWICE_CAREFUL.includes(opp.name)?.8:mannerOf(opp)?.2:.5);
      opp.say={seq:(S.saySeq=(S.saySeq||0)+1)+7000,act:'',line:ok?'いいだろう、2回だ':'1回で決めよう'};
      if(ok)startTwice();else log(`${opp.name}は1回めくりを選んだ`)}
    then()};
  const q1=twiceTermSeen?'オールインです。残りの場札を2回めくって、ポットを半分ずつ分けますか？':'オールインです。2回めくり（ランイットツワイス）にしますか？ 残りの場札を2回めくって、ポットを半分ずつ分けます。';twiceTermSeen=true;
  box.innerHTML=`<div class="qin twicebox"><p class="qq">${q1}</p><div class="qopts"><button id="twY">2回めくる</button><button id="twN">1回でいい</button></div></div>`;
  box.hidden=false;$('twY').onclick=()=>fin(true);$('twN').onclick=()=>fin(false);
  const t=setTimeout(()=>fin(false),10000)}
function payHouse72(){
  if(CFG.house!=='seven2'&&!hasLesson('seven2'))return;
  const is72=p=>{const rs=p.hand.map(c=>c.r).sort((a,b)=>a-b);return rs[0]===2&&rs[1]===7};
  const ws=S.players.filter(p=>p.won>0&&is72(p));if(ws.length!==1)return;
  const w=ws[0];
  let got=0;
  S.players.forEach(p=>{if(p===w||p.out)return;const a=Math.min(p.chips,BB()*(hasLesson('seven2')?4:2));p.chips-=a;got+=a});
  w.chips+=got;w.won+=got;
  log(`7-2ゲーム！ ${w.name}が全員からボーナス ${fmt(got)}`);
  S.msg=`7-2ゲーム！ ${w.name}にボーナス +${fmt(got)}　/　${S.msg}`;
  if(w.hand&&w.show===false&&!w.human)w.show=true;
}
function post(p,amt){const a=Math.max(0,Math.min(amt,p.chips));p.chips-=a;p.bet+=a;p.total+=a;if(p.chips===0)p.allIn=true;return a}

function startHand(){nextvClear();if(typeof CFG!=='undefined'&&CFG)nvLamp();preAct='';readClear();if(S){S.readsHand=[];S.readShow=null;S.myRead=null;S.foolTag=null;S.readLook=-1;S.myActs=[];S.myBetsHand=[];S.myLastBet=null;S.twice=false;S.twiceBase=null;S.board2=null;S.declare=null;S.declGuess=null;if(S.players)S.players.forEach(q=>{q.runWon=null;q.hname2=''})}if(S&&S.players)S.players.forEach(q=>{q.faked=null});quickPick=0;clearArm();
  if(CFG.refill)S.players.forEach(p=>{if(!p.human&&!p.extra&&p.chips<=0){p.chips=p.start;log(`${p.name}がチップを補充して席に戻った`)}});
  if(S.rebuyMain){S.rebuyMain=false;S.players.forEach(p=>{if(!p.human&&!p.extra&&p.chips<=0){p.chips=p.start;S.chipsReset=S.handNo+1;log(`${p.name}がチップを買い足して席に戻った`)}})}   // 相手役がほかの客に飛ばされたとき（endHand の byOther）
  S.players.forEach(p=>{p.out=p.chips<=0||!!p.sitOut});
  S.handNo++;if(typeof muckAvoidCancel==='function')muckAvoidCancel();   // 前のハンドの捨て札の山の置き直しを取り消す（CodeRabbit PR #105）
  // トーナメント：決まったハンド数ごとにブラインドが上がる
  if(CFG.levels){const lv=Math.min(CFG.levels.length-1,Math.floor((S.handNo-1)/CFG.levelHands));
    if(CFG.blinds!==CFG.levels[lv]){const up=S.handNo>1;CFG.blinds=CFG.levels[lv];if(up){log(`ブラインドが上がった：${SB()}/${BB()}`);dealerSay('ブラインドが上がります')}}}
  const deadBtn=!!CFG.levels&&S.bbSeat>=0&&S.players[S.bbSeat]!=null;
  if(!deadBtn)S.dealer=nextIdx(S.dealer,p=>!p.out);
  S.showOffer=false;if(S.shownMem&&S.handNo>0&&S.handNo%6===0){S.shownMem.bluff=Math.max(0,S.shownMem.bluff-1);S.shownMem.strong=Math.max(0,S.shownMem.strong-1)}S.taunt=-1;S.slowrolled=-1;S.meSmug=false;S.angleActing=-1;S.players.forEach(p=>{if(p.tilt>0&&S.handNo>0&&p.tiltHand!==S.handNo){p.tiltHand=S.handNo;p.tilt--}});S.needle=null;S.runout=false;S.tease=false;S.reveal=false;S.stare=-1;S.stareKey='';$('table').classList.remove('hush');Sound.hush(false);Clock.stop();S.myPreFold=false;S.myTurnAt=0;S.myTurnKey='';S.deck=shuffle(fullDeck());S.board=[];S.released=false;S.street='preflop';S.handOver=false;S.msg='';S.raises=0;S.aggr=-1;S.riverAggr=-1;S.lastCalled=-1;S.myPostAggro=false;
  S.players.forEach(p=>{Object.assign(p,{hand:p.out?[]:[S.deck.pop(),S.deck.pop()],folded:p.out,allIn:false,
    bet:0,total:0,acted:false,show:false,won:0,refund:0,hname:'',raisedPre:false,cbetFlop:false,leakPend:[],leakFold:'',leakAL:0,lastAct:'',lastType:'',seen:null,actKind:'',say:null,peeked:false,tell:null,tellLog:[],lastState:'',answered:false,hs:p.chips,ante:0,mucked:false,muckPlan:false,shownByChoice:false,counting:false,showN:0,slow:false,eq:null,eqDir:'',seenArr:null})});
  try{if(typeof dealHelp==='function')dealHelp()}catch(e){}   // 易しくする：自分に弱い手が来にくい（js/49_play35_fixes.js）。台本・決まった札はこの後で上書きされる
  setupScript();
  // ディーラーのミス（第4章以降とフリー対戦）：1ハンドに1.5%、続けては起きない
  let mq='';
  if(CFG.tells&&!S.scriptAI&&S.handNo>1&&S.mistakeHand!==S.handNo-1&&Math.random()<.015){
    S.mistakeHand=S.handNo;const r=Math.random(),lv=S.players.filter(p=>!p.out),cpu=lv.filter(p=>!p.human);
    if(r<.2){lv.forEach(p=>S.deck.push(...p.hand));shuffle(S.deck);lv.forEach(p=>{p.hand=[S.deck.pop(),S.deck.pop()]});
      dealerSay('ミスディールです。配り直します');log('ミスディール：カードを集めて、配り直した');S.msg='ミスディール。配り直します'}
    else if(lv.length){const me0=S.players[0],who=(r<.7||me0.out)&&cpu.length?cpu[Math.floor(Math.random()*cpu.length)]:me0.out?lv[0]:me0,k=Math.floor(Math.random()*2),c=who.hand[k];
      who.hand[k]=S.deck.pop();mq='exposed';dealerSay('失礼しました、交換します');
      log(`配るときに${who.human?'あなた':who.name}のカードが表になった（${cardStr(c)}）。交換した。このカードはもう出ない`);S.msg=`表になったカード：${cardStr(c)}（もう出ません）`}
    {const si=S.players.find(q=>q.name==='シオン'&&!q.out);if(si)si.say={seq:(S.saySeq=(S.saySeq||0)+1)+9700,act:'',line:mq?'今の、表になってたよ':'配り直し、ね'}}
    grantTitle('misdeal');if(!S.misNoted){S.misNoted=true;jinNote('ディーラーも人間だ。見えたカードは覚えておけ',0)}
  }
  const live=p=>!p.out;
  const alive=S.players.filter(live).length;
  // SB・BB の席の決め方は 19b_rules.js（Rules.seats）
  const st=Rules.seats(S.players.map(live),S.dealer,deadBtn,S.sbSeat,S.bbSeat),sb=st.sb,bb=st.bb;S.dealer=st.dealer;S.sbSeat=st.sbSeat;
  S.bbSeat=bb;S.sbI=sb;S.bbI=bb;
  log(`ハンド #${S.handNo}`,true);
  if(CFG.tells)$('table').style.setProperty('--night',Math.min(.35,S.handNo*.015).toFixed(3));
  if(S.handNo===1)log('基本ルール：スモールブラインド・ビッグブラインド・BBアンティ（BBの人が全員分のアンティを払う）');
  if(S.handNo===1&&CFG.ch&&!CFG.ch.p2&&CFG.ch.no===6&&S.players.some(p=>p.name==='レン')&&S.players.some(p=>p.name==='ソフィア'))log('レンとソフィアは、途中から参加した。持ち点が少ないのは、そのためだ');
  if(S.handNo===1&&(CFG.house||CFG.lore)){
    const h=HOUSE[CFG.house];
    const note=h?`この店のルール：${h.name}（${h.desc}）`:CFG.lore;
    log(note);S.msg=h?`この店のルール：${h.name}`:'';
  }
  if(CFG.house==='bomb'&&S.handNo%5===0&&alive>=2){
    const ante=BB()*2;
    S.players.forEach(p=>{if(p.out)return;const a=Math.min(ante,p.chips);p.chips-=a;p.total+=a;if(p.chips===0)p.allIn=true});
    log(`ボムポット！ 全員が ${fmt(ante)} ずつ出して、フロップから始める`);
    S.msg='ボムポット！ 全員参加でフロップから';dealerSay('ボムポット');
    S.currentBet=0;S.minRaise=BB();
    return nextStreet();
  }
  if(sb>=0){post(S.players[sb],SB());log(`${S.players[sb].name}：スモールブラインド ${SB()}`)}else log('SBの席は空いている。このハンドはSBなし（デッドボタン）');
  post(S.players[bb],BB());log(`${S.players[bb].name}：ビッグブラインド ${fmt(BB())}`);
  // BBアンティ：BBの人が全員分のアンティ（BBと同額）をまとめてポットに入れる
  {const q=S.players[bb],a=Math.min(BB(),q.chips);if(a>0){q.chips-=a;q.total+=a;q.ante=a;if(q.chips===0)q.allIn=true;log(`${q.name}：BBアンティ ${fmt(a)}`)}}
  S.currentBet=Math.max(...S.players.map(p=>p.bet));S.minRaise=BB();
  S.toAct=nextIdx(bb,needs);
  S.strdl=0;
  if(CFG.house==='straddle'&&alive>=3){
    const u=S.players[S.toAct];
    const want=u.human?myStraddle:(u.chips>BB()*6&&Math.random()<.35);
    if(want){post(u,BB()*2);S.strdl=BB()*2;u.lastAct=`ストラドル ${fmt(BB()*2)}`;u.lastType='raise';
      log(`${u.name}：ストラドル ${fmt(BB()*2)}`);S.msg=`${u.name}がストラドル（${fmt(BB()*2)}）`;
      S.currentBet=Math.max(...S.players.map(p=>p.bet));S.minRaise=BB()*2;S.toAct=nextIdx(S.toAct,needs);if(!mq)mq='straddle'}
  }
  if(CFG.ch&&CFG.ch.no===7&&!S.msg)S.msg=S.finalHand?'ジンは、いつものように、あごの傷に触れている……':'ジンは、あごの傷に触れている';
  const go=()=>{S.hold=startBanter();proceed()};
  mq?askQuiz(mq,go):go();
}