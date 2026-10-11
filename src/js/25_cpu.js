/* ---------- CPU：勝率を見積もり、性格で判断を変える ---------- */
function equity(hand,board,opps,sims,narrow){
  const known=hand.concat(board);
  const rest=fullDeck().filter(c=>!known.some(k=>k.r===c.r&&k.s===c.s));
  const need=opps*2+(5-board.length);
  let score=0;
  for(let t=0;t<sims;t++){
    for(let i=0;i<need;i++){const j=i+Math.floor(Math.random()*(rest.length-i));[rest[i],rest[j]]=[rest[j],rest[i]]}
    if(narrow>0)for(let k=0;k<3;k++){const h0=[rest[0],rest[1]];
      if(eqWeak(h0,board)){if(Math.random()>=narrow)break}
      else if(!(narrow>.45&&board.length>=3&&bestN(h0.concat(board))[0]<=1&&Math.random()<(narrow-.45)*2))break;
      for(const x of [0,1]){const j=need+Math.floor(Math.random()*(rest.length-need));[rest[x],rest[j]]=[rest[j],rest[x]]}}
    const b=board.concat(rest.slice(opps*2,need));
    const mine=bestN(hand.concat(b));
    let lose=false,ties=0;
    for(let o=0;o<opps;o++){
      const d=cmp(bestN([rest[o*2],rest[o*2+1]].concat(b)),mine);
      if(d>0){lose=true;break}
      if(d===0)ties++;
    }
    if(!lose)score+=ties?1/(ties+1):1;
  }
  return score/sims;
}
const LEAKS={'ゲン':{k:'chase',view:'{n}は、入るまで追ってくる'},'ハル':{k:'fold3b',view:'{n}は、やり返されると弱い'},'ロク':{k:'oneShot',view:'{n}は、一度しか打ってこない'},'セキ':{k:'riverFold',view:'{n}は、最後に弱い'},'ミナ':{k:'stab',view:'{n}は、待てない'},'レイカ':{k:'honestRiver',view:'{n}は、最後の一枚では嘘をつかん'},'ソウ':{k:'honestRiver',view:'{n}は、最後の一枚では嘘をつかん'},'ハヤト':{k:'heroCall',view:'あいつは、お前にだけは引かん'},'クロウ':{k:'bigPot',view:'あいつは、大きな勝負から降りられん'},'ゴウ':{k:'afterLoss',view:'{n}は、負けたすぐあとが荒い'},'ケンジ':{k:'afterLoss',view:'{n}は、負けたすぐあとが荒い'},'カオル':{k:'fitFold',view:'{n}は、外れたらすぐ降りる'},'テツ':{k:'pairStick',view:'{n}は、ペアがあれば降りない'},'ミサキ':{k:'upTight',view:'{n}は、勝っていると守りに入る'},'タロウ':{k:'shortTight',view:'{n}は、チップが減ると縮こまる'},'マツ':{k:'fold3b',view:'{n}は、やり返されると弱い'},'ナギ':{k:'chase',view:'{n}は、入るまで追ってくる'},'アデ':{k:'upTight',view:'{n}は、勝っていると守りに入る'},'マリア':{k:'fitFold',view:'{n}は、外れたらすぐ降りる'},'ヨシオ':{k:'oneShot',view:'{n}は、一度しか打ってこない'},'リン':{k:'honestRiver',view:'{n}は、最後の一枚では嘘をつかん'},'ハンナ':{k:'oneShot',view:'{n}は、一度しか打ってこない'},'ラジ':{k:'chase',view:'{n}は、入るまで追ってくる'},'カズ':{k:'afterLoss',view:'{n}は、負けたすぐあとが荒い'},'サヤ':{k:'fitFold',view:'{n}は、外れたらすぐ降りる'},'ウォルター':{k:'pairStick',view:'{n}は、ペアがあれば降りない'},'スミン':{k:'stab',view:'{n}は、待てない'},'シオン':{k:'upTight',view:'{n}は、勝っていると守りに入る'},'アキラ':{k:'riverFold',view:'{n}は、最後に弱い'},'ルカ':{k:'afterLoss',view:'{n}は、負けたすぐあとが荒い'},'アイシャ':{k:'honestRiver',view:'{n}は、最後の一枚では嘘をつかん'},'ガン':{k:'bigPot',view:'{n}は、大きな勝負から降りられん'},'ドク':{k:'honestRiver',view:'{n}は、最後の一枚では嘘をつかん'},'ベン':{k:'fold3b',view:'{n}は、やり返されると弱い'},'ミン':{k:'fitFold',view:'{n}は、外れたらすぐ降りる'},'レン':{k:'afterLoss',view:'{n}は、負けたすぐあとが荒い'},'イオリ':{k:'oneShot',view:'{n}は、一度しか打ってこない'},'ソフィア':{k:'upTight',view:'{n}は、勝っていると守りに入る'},'タケル':{k:'riverFold',view:'{n}は、最後に弱い'}};
const LEAK_NOTE={riverFold:'リバーで大きく賭けられて降りた',chase:'大きい賭けにコールして、ドローを追っていた',fold3b:'レイズし返されて降りた',oneShot:'フロップで賭けたあと、ターンで止まった',stab:'チェックされたら、弱い手でも賭けた',honestRiver:'リバーで賭けたときは、本物だった',heroCall:'あなたの賭けに、弱い手でついてきた',bigPot:'大きなポットで、最後まで降りなかった',afterLoss:'負けたすぐあとのハンドに参加した',fitFold:'フロップで外れて、すぐ降りた',pairStick:'ペアのまま、最後までついてきた',upTight:'勝っているあいだ、降りることが増えた',shortTight:'チップが減って、参加しなくなった'};
// ===== 相手の穴（案1：キャラごとに1つ）。第1〜3章とジン・台本の場面では使わない =====
const leakOn=p=>{const L=LEAKS[p.name];if(!L||p.human||p.name==='ジン'||S.scriptAI||S.finalHand||S.autoMe)return null;if(CFG.ch&&!CFG.ura&&CFG.ch.no<=3)return null;return L};
// フラッシュの4枚、または両側が空いた4枚の連続（リバーでは false）
function drawOf(hand,board){if(board.length<3||board.length>=5)return false;const cs=hand.concat(board);
  for(const su of new Set(hand.map(c=>c.s)))if(cs.filter(c=>c.s===su).length===4)return true;
  const rs=new Set(cs.map(c=>c.r));if(rs.has(14))rs.add(1);const hr=new Set(hand.map(c=>c.r).concat(hand.some(c=>c.r===14)?[1]:[]));
  for(let lo=2;lo<=10;lo++){let ok=true,mine=false;for(let r=lo;r<lo+4;r++){if(!rs.has(r)){ok=false;break}if(hr.has(r))mine=true}
    if(ok&&mine&&lo+3<14&&!rs.has(lo-1)&&!rs.has(lo+4))return true}return false}
function leakDecide(p,k,x){const{toCall,pot,rel,eq,odds,st,r,canRaise}=x,str=S.street,pre=str==='preflop',riv=str==='river',potB=pot-toCall,F={type:'fold',state:'none'},C={type:'call',state:'none'};
  switch(k){
  case'riverFold':if(riv&&toCall>0&&toCall>=potB*.5&&rel<1.8)return{d:F};break;
  case'chase':if((str==='flop'||str==='turn')&&toCall>0&&toCall<=potB&&eq<odds+st.margin&&drawOf(p.hand,S.board))return{d:C};break;
  case'fold3b':if(pre&&p.raisedPre&&toCall>0&&rel<2)return{d:F};break;
  case'oneShot':if(str==='turn'&&p.cbetFlop){if(toCall===0&&rel<st.hi)return{d:C};if(toCall>0&&rel<st.mid)return{d:F}}break;
  case'stab':if((str==='turn'||riv)&&toCall===0&&S.currentBet===0&&canRaise&&S.players.every(q=>q===p||!inHand(q)||q.acted)&&r<.7)
    return{d:{type:'raise',to:S.currentBet+Math.max(S.minRaise,Math.round(potB*.5/1000)*1000),state:rel>st.hi?'strong':'bluff'}};break;
  case'honestRiver':if(riv&&toCall===0&&rel<1)return{d:C};if(!pre&&!riv)return{st:{...st,bluff:st.bluff*1.5}};break;
  case'heroCall':if(S.aggr===0&&toCall>0)return{st:{...st,margin:st.margin-.08,defPost:0}};break;
  case'bigPot':if(riv&&toCall>0&&pot>=p.start*.6&&eq>=odds-.08&&eq<odds+st.margin)return{d:C};break;
  case'afterLoss':if(pre&&(p.lastLoss||0)>=BB()*10&&rel>.7){if(canRaise&&r<.35)return{d:{type:'raise',to:S.currentBet+Math.max(S.minRaise,BB()*2),state:'none'}};if(toCall>0)return{d:C}}break;
  case'fitFold':if(str==='flop'&&toCall>0&&isWeak(p.hand,S.board)&&!drawOf(p.hand,S.board))return{d:F};break;
  case'pairStick':if(!pre&&toCall>0&&toCall<=potB*1.2&&eq<odds+st.margin&&!isWeak(p.hand,S.board)&&bestN(p.hand.concat(S.board))[0]>=1)return{d:C};break;
  case'upTight':if(p.chips>=p.start*1.5)return{st:{...st,defPre:Math.max(st.defPre||0,1.2)}};break;
  case'shortTight':if(pre&&p.chips<=p.start*.5&&rel<1.5)return{d:toCall<=0?C:F};break}
  return null}
// 見える場面だけ、相手メモの「打ち方」に書く
const LEAK_KEY='shisho-leaks';
function loadLeaks(){const obj=o=>o&&typeof o==='object'&&!Array.isArray(o);
  try{const n=JSON.parse(localStorage.getItem(LEAK_KEY));if(!obj(n))return{};delete n.v;
    Object.keys(n).forEach(k=>{if(!obj(n[k])){delete n[k];return}Object.keys(n[k]).forEach(c=>{const r=n[k][c];if(!obj(r)||!LEAK_NOTE[c])delete n[k][c];else{r.seen=+r.seen||0;r.hit=+r.hit||0}})});
    return n}catch(e){return{}}}
function leakNote(name,k,hit){const n=loadLeaks();n[name]=n[name]||{};const r=n[name][k]=n[name][k]||{seen:0,hit:0};if(hit)r.hit++;else r.seen++;
  try{localStorage.setItem(LEAK_KEY,JSON.stringify({v:1,...n}))}catch(e){}renderNotes()}
function leakSeen(p,k,d){
  if(['riverFold','fold3b','fitFold','shortTight','upTight'].includes(k)){if(d.type==='fold'){leakNote(p.name,k);p.leakFold=k}}
  else if(k==='oneShot'){if(d.type==='call'&&S.currentBet===p.bet){leakNote(p.name,k);p.leakFold=k}}
  else if(k==='afterLoss'){if(d.type!=='fold'&&!p.leakAL){p.leakAL=1;leakNote(p.name,k)}}
  else if(k==='honestRiver'){if(S.street==='river'&&d.type==='raise')(p.leakPend=p.leakPend||[]).push(k)}
  else if(d.type!=='fold'&&!(p.leakPend||[]).includes(k))(p.leakPend=p.leakPend||[]).push(k)}
function leakWin(p,k){if(p.leakWonHand===S.handNo)return;p.leakWonHand=S.handNo;leakNote(p.name,k,1);if(S.stat)S.stat.leakWins=(S.stat.leakWins||0)+1;
  const w=S.leakWin=S.leakWin||{};w[p.name]=(w[p.name]||0)+1;if(w[p.name]===2){jinNote('……見つけたな。それが穴だ',1);grantTitle('leak')}}
function leakEnd(){const me=S.players[0],iw=me.won>0;
  S.players.forEach(p=>{if(p.human)return;
    (p.leakPend||[]).forEach(k=>{if(!p.show||p.folded||!p.score)return;if(k==='honestRiver'&&p.score[0]<2)return;leakNote(p.name,k);
      if(iw&&['chase','pairStick','heroCall','bigPot'].includes(k))leakWin(p,k)});
    if(p.leakFold&&p.folded&&iw&&['riverFold','fold3b','fitFold','oneShot'].includes(p.leakFold))leakWin(p,p.leakFold);
    p.lastLoss=p.total-p.won})}
const ENTER={ゲン:.6,テツ:.6,ハヤト:.7,ゴウ:.7,レイカ:.7,ソウ:.8,クロウ:.9,ロク:.9,ハル:.9,ジン:1,カオル:1,セキ:1.15,ミナ:1.15};
// 章の常連客は、主役との勝負が起きやすいよう、かなり固く入る
const enterLine=p=>p.extra?1.2:CFG.ch&&!CFG.ura&&(CFG.ch.no<=3||CFG.ch.no===7)?.8:(ENTER[p.name]||.8);
// ===== プロ目線の CPU（第4章以降・第二部・フリー・はしご・裏の卓）。第1〜3章・回想・台本のハンドでは使わない =====
const proAI=()=>!(CFG.ch&&!CFG.ura&&CFG.ch.no<=3)&&!CFG.flashback&&!S.scriptAI&&!S.finalHand&&!S.autoMe;
// 賭けの大きさ（ポットに対する割合）→ 絞る割合。½ポット=0.3、同額=0.6、2倍以上=0.85（間は直線）
function betNarrow(x){x=Math.max(0,x);return x<=.5?.6*x:x<=1?.3+.6*(x-.5):x<=2?.6+.25*(x-1):.85}
// 賭けてきた相手の手として「合わない」手：プリフロップは弱い2枚、フロップ以降はワンペア未満（場だけの役）でドローもない
const eqWeak=(h,b)=>b.length<3?preTier(h)===0:isWeak(h,b)&&!drawOf(h,b);
const OPEN_LINE={レイカ:.9,ハヤト:.9};
function proAdj(p,d,x){
  // v71（S2）：読める相手（ジン・クロウ）は、リバーでポットの1.5倍以上を賭けられたら、強い手（st.hi 以上）でなければ降りる（コールが4〜5割で揺れていた）
  if(S.street==='river'&&d.type==='call'&&x.toCall>0&&(x.st.read||0)>=.85&&x.toCall>=(potTotal()-x.toCall)*1.5&&x.rel<x.st.hi)return{type:'fold',state:'none'};
  if(S.street!=='preflop'||x.toCall<=0)return d;
  const st=x.st;
  // A1：強キャラは、自分から最初に入るときリンプしない（レイズ2.5〜3BB か、降りる）。BBのチェックはそのまま
  // v68：先にリンプした人がいても、強キャラはコールだけで入らない（1人ごとに1BB足してレイズ＝アイソレート、か降りる）。レイカ（liar）も入れた
  if(d.type==='call'&&st.noLimp&&S.street==='preflop'&&S.aggr<0&&S.raises===0){
    const limpers=S.players.filter(q=>q!==p&&!q.out&&!q.folded&&q.lastType==='call'&&q.bet>0).length;
    // v69 レビュー：レイズで入る線は入る線と分ける（レイカ・ハヤトは入る線が低く、ほぼ毎回レイズになっていた）。ストラドル卓では今の額を基準に
    const rl=Math.max(enterLine(p),OPEN_LINE[p.name]||1),base=Math.max(BB(),S.currentBet);
    if(x.rel>=rl&&x.canRaise)return{type:'raise',to:Math.max(S.currentBet+S.minRaise,Math.round(base*(2.5+Math.random()*.5+limpers)/1000)*1000),state:x.rel>st.hi?'strong':'none',rel:x.rel>st.mid};
    if(x.rel<rl)return{type:'fold',state:'none'};
    return d}
  // A1：読める相手は、3BBまでのオープンに対して、平均より強い手なら降りすぎない（v68：カオルが9割近く降りる回があったので、平均の0.85倍から守る）
  if(d.type==='fold'&&st.noLimp&&(st.read||0)>=.6&&S.raises===1&&S.currentBet<=BB()*3&&x.rel>.85)return{type:'call',state:x.rel>st.hi?'strong':'none'};
  return d}
function cpuDecide(i){const p=S.players[i];S._lk=null;const d=cpuDecide0(i);const k=S._lk;S._lk=null;if(k)leakSeen(p,k,d);return d}
function cpuDecide0(i){
  const p=S.players[i];let st=styleOf(p);
  const toCall=Math.min(S.currentBet-p.bet,p.chips);
  // 見せられた手を覚えている：あなたが賭けてきた場面だけ、降りやすさを変える
  if(CFG.tells&&S.needle===S.street&&S.aggr===0&&toCall>0&&S.needleMem){const m=S.needleMem,adj=Math.max(-.06,Math.min(.06,.02*(m.strong-m.weak)));if(adj)st={...st,margin:st.margin+adj}}
  if(S.aggr===0&&toCall>0){const a=selfAdj(p);if(a)st={...st,margin:st.margin+a}}
  if(CFG.tells&&S.shownMem&&S.aggr===0&&toCall>0){const m=S.shownMem,adj=Math.max(-.09,Math.min(.09,.03*(m.strong-m.bluff)));if(adj)st={...st,margin:st.margin+adj}}
  const opps=S.players.filter(q=>inHand(q)&&q!==p).length;
  // S2：相手が賭け・レイズしてきたら、賭けの大きさと性格（read）に応じて、相手の手を「賭け方に合う手」に絞って勝率を出す
  const pro=proAI(),ag=S.players[S.aggr];
  const narrow=pro&&toCall>0&&S.aggr>=0&&S.aggr!==i&&ag&&ag.lastType==='raise'?(st.read||0)*betNarrow(toCall/Math.max(1,potTotal()-toCall)):0;
  const eq=equity(p.hand,S.board,opps,S.street==='preflop'?200:300,narrow);
  const pot=potTotal();
  const odds=toCall/(pot+toCall);
  const rel=eq*(opps+1);
  const r=Math.random();
  p._close=toCall>0&&Math.abs(eq-(odds+st.margin))<.06;
  // B2：4ベットの上限は、とても強い手なら越えてよい（そのときはオールイン）。rel は人数を掛けた値なので、ヘッズアップでも届くよう勝率75%以上も「とても強い」
  const capped=S.raises>=3,canRaise=p.chips>toCall&&(!capped||(pro&&(rel>st.hi*1.3||eq>=.75)))&&!p.acted;
  {const L=leakOn(p);if(L){const lk=leakDecide(p,L.k,{toCall,pot,rel,eq,odds,st,r,canRaise});if(lk){S._lk=L.k;if(lk.d)return lk.d;st=lk.st}}}
  const fin=d=>pro?proAdj(p,d,{toCall,rel,st,canRaise}):d;
  // 絞ったあとのレイズは、本当に強い手（rel>hi）のときだけ
  if(canRaise&&(rel>st.hi||(capped&&pro)||(!narrow&&((rel>st.mid&&r<st.midP)||(toCall===0&&r<st.bluff))))){
    const size=Math.max(S.minRaise,Math.round(pot*(0.5+Math.random()*0.4)/1000)*1000);
    return{type:'raise',to:capped?p.bet+p.chips:S.currentBet+size,state:rel>st.hi?'strong':rel<1?'bluff':'none',rel:rel>st.mid};
  }
  if(toCall===0)return{type:'call',state:rel>st.hi?'strong':'none'};
  // 慎重な性格：レイズや賭けを受けたら、強い手以外は降りる
  if(S.street==='preflop'&&S.currentBet>BB()&&st.defPre&&rel<st.defPre)return fin({type:'fold',state:'none'});
  if(S.street!=='preflop'&&st.defPost&&rel<st.defPost)return{type:'fold',state:'none'};
  if(eq>=odds+st.margin||(toCall<=BB()&&rel>enterLine(p)))return fin({type:'call',state:rel>st.hi?'strong':'none'});
  if(st.loose&&toCall<=BB()*4&&rel>0.5)return fin({type:'call',state:rel>st.hi?'strong':'none'});
  return fin({type:'fold',state:'none'});
}


// ===== 対戦相手との会話（案A〜E）。第4章以降とフリー対戦だけ（CFG.tells）。第1〜3章は通らない =====
const talkSet=()=>SETTINGS.talk==='off'||SETTINGS.talk==='less'?SETTINGS.talk:'on';
const talkOK=()=>!!CFG.tells&&!CFG.flashback&&talkSet()!=='off';
const talkSay=(p,line,k)=>{p.say={seq:(S.saySeq=(S.saySeq||0)+1)+(k||7000),act:'',line,talk:true};log(`${p.name}「${line}」`)};
const talkLater=(fn,ms)=>{const s0=S,h0=S.handNo;setTimeout(()=>{if(S===s0&&S.handNo===h0){fn();render()}},(reducedMotion()?0:ms)*SPEED())};
// 案A：言葉そのものがテル。言い方の種類と、キャラごとの言葉のクセ表
const SPEECH={"weak": {"call": ["まあ、たぶん負けてるけど……コール", "ついてないなあ、付き合うよ", "どうせ負けてるんだろうな……コール"], "raise": ["ついてないなあ……一応、上げとくよ", "たぶん負けてるけど、少しだけ上げる"], "allin": ["負けてるかもしれないけど……全部いく"]}, "explain": {"call": ["フラッシュ、来ちゃったかもなあ", "ペアくらいは、あるんだけどね"], "raise": ["フラッシュ、来ちゃったかもなあ。上げるよ", "ペアくらいは、あるんだけどね。上げとく", "ストレート、できてるかもよ？"], "allin": ["いい手なんだよ、本当に。全部いく"]}, "push": {"call": ["ほら、次で降りなよ", "勝負になると思う？"], "raise": ["ほら、早く降りなよ", "勝負になると思う？"], "allin": ["全部だ。早く降りなよ"]}, "unsure": {"call": ["うーん……じゃあ、コールで"], "bet": ["うーん……じゃあ、ベットで"], "raise": ["どうしようかな……上げとくか"], "allin": ["うーん……もう、全部いっちゃうか"]}, "polite": {"call": ["失礼、お付き合いします"], "raise": ["失礼、少し上げます"], "allin": ["失礼。すべて、いきます"]}};
const SPEECH_TRUTH={"ゲン": {"strong": ["weak", "unsure", "polite"], "bluff": ["explain", "push"]}, "ソウ": {"strong": ["weak", "unsure", "polite"], "bluff": ["explain", "push"]}, "ミナ": {"strong": ["weak", "unsure", "polite"], "bluff": ["explain", "push"]}, "テツ": {"strong": ["weak", "unsure", "polite"], "bluff": ["explain", "push"]}, "セキ": {"strong": ["weak", "unsure", "polite"], "bluff": ["explain", "push"]}, "クロウ": {"strong": ["weak", "unsure", "polite"], "bluff": ["explain", "push"]}, "レイカ": {"strong": ["push"], "bluff": ["weak"]}, "ハヤト": {"strong": ["polite", "push"], "bluff": ["push"]}, "ゴウ": {"strong": ["push", "weak"], "bluff": ["push", "explain"]}};
Object.assign(CUE_LABEL,{"word:weak": "言葉：弱そうに言う", "word:explain": "言葉：聞かれていない手の話をする", "word:push": "言葉：降りろと言う", "word:unsure": "言葉：迷ったふりをする", "word:polite": "言葉：急に丁寧になる"});
function speechPick(p,kind){
  if(!CFG.tells||CFG.flashback||S.scriptAI||p.human||!['raise','call','allin'].includes(kind))return'';
  const T=SPEECH_TRUTH[p.name],st=p.lastState;if(!T||(st!=='strong'&&st!=='bluff')||Math.random()>=.4)return'';
  // クロウは第6章で、半分の確率で表を入れ替える（混ぜる）
  const tab=p.name==='クロウ'&&CFG.ch&&!CFG.ura&&CFG.ch.no===6&&Math.random()<.5?{strong:T.bluff,bluff:T.strong}:T;
  const k=pick(tab[st]),L=SPEECH[k],a=kind==='raise'&&String(p.lastAct).startsWith('ベット')?(L.bet||L.raise):(L[kind]||L.raise);
  p.speech={kind:k,truth:st,hand:S.handNo};return pick(a)}
// ショーダウンで答え合わせ（言葉のクセ・自分の答え方）
function talkSD(cont){
  cont.forEach(p=>{const sp=p.speech;if(!sp||p.human||sp.hand!==S.handNo)return;p.speech=null;
    log(`答え合わせ：${p.name}の「${CUE_LABEL['word:'+sp.kind]}」は${TRUTH_JP[sp.truth]}だった`);noteTell(p.name,'word:'+sp.kind,sp.truth)});
  if(S.slowrolled>0)S.srSeen=S.handNo;
  const a=S.wordAns,me=S.players[0];if(!a||a.hand!==S.handNo)return;S.wordAns=null;
  if(me.folded||!me.score||(!me.won&&S.riverAggr!==0&&!S.runout&&SETTINGS.muck))return;
  const m=S.selfMem=S.selfMem||{big:{s:0,w:0},fast:{s:0,w:0},slow:{s:0,w:0}};m.word=m.word||{yes:{s:0,w:0},dodge:{s:0,w:0}};
  m.word[a.k][me.score[0]>=2?'s':'w']++}
// 案B：話しかけられたら答える
const QUESTIONS={"ゲン": ["なあ、エース持ってるのか？", "さあね", "持ってるよ"], "ソウ": ["あ、あの、強いですか？", "どうかな", "強いよ"], "セキ": ["君、今夜は手が入っているのかな", "さあね", "入ってるよ"], "レイカ": ["その手、本当？", "どうかな", "本当だよ"], "クロウ": ["お持ちですか", "さあ", "持ってます"], "ハヤト": ["二代目、持ってんのか？", "さあね", "持ってるよ"], "ミナ": ["ねえ、それ強いの？", "どうかな", "強いよ"], "テツ": ["おい、いい手なのか？", "さあね", "いい手だよ"], "ゴウ": ["おい新人、持ってんのか？", "さあね", "持ってるよ"], "ケンジ": ["それ、強いのか？", "どうかな", "強いよ"], "カオル": ["あなた、いい手なの？", "さあね", "いい手だよ"]};
const ASK_GLOAT={"ハヤト": "へえ。言うようになったな、二代目", "ゴウ": "口だけは一人前だな、新人"},ASK_READ={"ハヤト": "さっきも、そう言ったよな、二代目", "クロウ": "先ほども、そうおっしゃいましたね"};
SELF_WHY.word='答え方';
const askLive=()=>!!(S&&S.ask&&S.ask.hand===S.handNo&&S.ask.street===S.street&&!S.handOver);
function openAsk(a){Object.assign(a,{hand:S.handNo,street:S.street,done:false});S.ask=a;const p=S.players[a.i];if(p)talkSay(p,a.q);render()}
function askMaybe(){
  const me=S.players[0];if(!me||S.handOver||S.toAct!==0||S.autoMe||CFG.flashback||tourI>=0||!tourDone()||(preAct&&preAllowed()))return;
  if(askLive())return;
  if(duelMaybe())return;
  if(!talkOK()||S.scriptAI||S.finalHand||(S.askCount||0)>=3||S.askHand===S.handNo)return;
  const ag=S.players[S.aggr];if(!ag||ag.human||!inHand(ag)||ag.lastType!=='raise'||S.currentBet<=me.bet||ag.name==='ジン'||ag.name==='師匠')return;
  const Q=QUESTIONS[ag.name];if(!Q||Math.random()>=(talkSet()==='less'?.08:.15))return;
  S.askCount=(S.askCount||0)+1;S.askHand=S.handNo;
  openAsk({kind:'ask',i:S.aggr,q:Q[0],opts:['黙る',Q[1],Q[2]]})}
function answerAsk(k,closed){const a=S.ask;if(!a||a.done||a.hand!==S.handNo||S.handOver)return;if(!closed&&S.toAct!==0)return;a.done=true;a.ans=k;
  const p=S.players[a.i];if(!p)return;log(k===0?'あなた：（黙っている）':`あなた：「${a.opts[k]}」`);
  if(a.kind==='duel'){duelAnswer(a,k,closed);if(!closed)render();return}
  if(k===0){if(!closed)render();return}
  S.wordAns={k:k===2?'yes':'dodge',hand:S.handNo};
  if(k===2){const x=((S.selfMem||{}).word||{}).yes,h=x&&selfReader(p)?(x.s>=2&&x.w===0?1:x.w>=2&&x.s===0?-1:0):0;
    S.claim={hand:S.handNo,i:a.i,read:h>0?'honest':h<0?'weak':''};
    if(h){talkLater(()=>{p.say={seq:(S.saySeq=(S.saySeq||0)+1)+9000,act:'',line:ASK_READ[p.name]||'さっきも、そう言ったな',sub:'読み：あなたの答え方'};S.myRead={hand:S.handNo,why:'word'}},300);if(!closed)render();return}}
  const rep=ASK_GLOAT[p.name]||(rankOf(p.name)>=3?(k===2?'……そうか':'ふうん'):(k===2?'え、ほんとに？':'ずるいなあ'));
  talkLater(()=>{if(!p.folded)talkSay(p,rep,7500)},300);if(!closed)render()}
// 案E：勝負どころの言葉の決闘（各章1回。設定がオフでも出す）
const DUEL={"4": {"q": "わたしの言葉、信じる？", "opts": ["黙る", "信じる", "信じない"], "r": ["……つまらない人", "素直ね。……それが命取りよ", "あら、疑うのね"], "jin": "レイカは逆だ。強がるときが本物で、弱そうに言うときがブラフだ"}, "5": {"q": "二代目、コールするのか？ ジンさんなら降りるぜ", "opts": ["黙る", "降りるのも勝負のうちだ", "コールする"], "r": ["……黙りかよ", "……っ。それ、師匠の口癖だろ", "来いよ。それでこそ二代目だ"], "jin": ["", "……あいつの口癖は、もともと俺の言葉だ", ""]}, "6": {"q": "拝見しましょう……と言いたいところですが", "opts": ["黙る", "強いんですか", "ブラフでしょう"], "r": ["……賢明です", "ええ、強いですよ。……本当かどうかは、別ですが", "ブラフです。……と言ったら、信じますか"], "jin": "クロウは、本当と嘘を混ぜてくる。言葉で読むな"}, "7": {"q": "あの日のこと、覚えてるか", "opts": ["黙る", "覚えてる", "忘れた"], "r": ["……そうか", "……俺もだ。忘れたことは、一度もない", "……そうか。それでいい"], "qn": "さっきの話だがな。……あの日のこと、まだ聞きたいか", "optsn": ["黙る", "聞かせて", "もういい"], "rn": ["……そうか", "あの日、俺は降りられなかった。……それだけだ", "……ああ。今は、目の前の一枚だ"]}};
function duelMaybe(){
  if(!CFG.ch||CFG.ura||CFG.run||CFG.flashback||S.duelDone)return false;const no=CFG.ch.no;if(!DUEL[no])return false;
  const me=S.players[0],toCall=S.currentBet-me.bet,ag=S.players[S.aggr],pot=potTotal(),D=DUEL[no];
  const by=n=>!!ag&&ag.name===n&&inHand(ag)&&ag.lastType==='raise'&&toCall>0;let a=null;
  if(no===4&&S.street==='river'&&by('レイカ')&&toCall>=pot*.3)a={i:S.aggr,q:D.q,opts:D.opts};
  else if(no===5&&!S.scriptAI&&by('ハヤト')&&((S.srSeen>0&&S.handNo>S.srSeen)||S.handNo>=15)&&toCall>=Math.max(BB()*5,pot*.35))a={i:S.aggr,q:D.q,opts:D.opts};
  else if(no===6&&by('クロウ')&&S.players.some(q=>!q.human&&(q.out||q.chips+q.total<=q.start*.3)))a={i:S.aggr,q:D.q,opts:D.opts};
  else if(no===7&&S.finalHand&&(S.street==='flop'||S.street==='turn')){const j=S.players.findIndex(q=>q.name==='ジン');
    if(j>0)a=S.nightAsked?{i:j,q:D.qn,opts:D.optsn,night:1}:{i:j,q:D.q,opts:D.opts}}
  if(!a)return false;S.duelDone=true;a.kind='duel';a.ch=no;openAsk(a);return true}
function duelAnswer(a,k,closed){const D=DUEL[a.ch],p=S.players[a.i];if(!D||!p)return;
  const line=(a.night?D.rn:D.r)[k];talkLater(()=>talkSay(p,line,7800),closed?600:300);
  const jn=Array.isArray(D.jin)?D.jin[k]:D.jin;if(jn)jinNote(jn,1);
  // 第5・6章は相手の判断に小さく効く。第7章はセリフだけ（本物のテルには触れない）
  if(a.ch===5&&k===1)S.duelFx={name:'ハヤト',hand:S.handNo,fold:.1};
  if(a.ch===6&&k===2)S.duelFx={name:'クロウ',hand:S.handNo,call:.1};
  if(a.ch===7&&k>0)S.nightAsked=true}
// 案C：手と手の間の雑談。相手の隠れた状態（mood）
const CHAT={"hot": ["さっきのハンド、まだ頭にきてる"], "lucky": ["今日はカードがよく来るんだ"], "hurry": ["終電まで、あと少しなんだよね"], "calm": ["いい店だろ、ここ"]},CHAT_CH={"ゲン": {"lucky": "今日はツイてるぜ！札がよく来る", "calm": "いい店だろ、ここ。酒もうまい"}, "ソウ": {"hurry": "あ、あの、明日早いんです……", "calm": "ここ、落ち着きますね"}, "セキ": {"hurry": "そろそろ帰らないと、家内に叱られる", "calm": "いい店だね、ここは"}, "レイカ": {"calm": "いいお店ね、ここ", "hot": "さっきの、まだ許してないから"}, "クロウ": {"lucky": "今夜は、カードに好かれているようです", "calm": "いい店でしょう、ここは"}, "ハヤト": {"hot": "……さっきのは、忘れてねえぞ", "hurry": "さっさと終わらせようぜ、二代目"}, "ゴウ": {"hot": "話しかけんな。今、むしゃくしゃしてんだ", "lucky": "今日は札が来る。邪魔すんなよ"}, "ロク": {"calm": "……静かでいい"}, "ミナ": {"lucky": "今日ね、カードがすっごく来るの！"}, "テツ": {"hurry": "悪い、そろそろ終電なんだ"}},CHAT_REG={"hot": "{name}、聞いてくれよ。さっきのハンド、まだ頭にきてる", "lucky": "{name}だから言うけど、今日はカードがよく来るんだ", "hurry": "{name}、実は終電まで、あと少しなんだ", "calm": "{name}、また来てくれたんだな"},CHAT_ASK=["調子はどう？", "今日はどう？"],MOOD_JP={"hot": "熱くなっている", "lucky": "気が大きい", "hurry": "早く帰りたい", "calm": "ふつう"};
const CHAT_LIARS=['レイカ','クロウ','ハヤト'];
function talkMood(p){if(!CFG.tells||!p||p.human||p.name==='ジン'||p.name==='師匠')return'calm';if(p.tilt>0)return'hot';if((p.luckyTo||0)>=S.handNo)return'lucky';if(p.hurry)return'hurry';return'calm'}
function chatOpen(){if(!S||!S.handOver||S.result)return;S.chatPick=S.chatPick===S.handNo?-1:S.handNo;render()}
function chatTo(i){const p=S.players[i];if(!p||p.out||p.human||!S.handOver||S.result||S.chatHand===S.handNo)return;
  S.chatPick=-1;S.chatHand=S.handNo;S.chatN=(S.chatN||0)+1;log(`あなた：「${pick(CHAT_ASK)}」`);
  let line;if(p.name==='ジン'||p.name==='師匠')line='……打て。話は、あとだ';
  else{const truth=talkMood(p);let said=truth;
    if(CHAT_LIARS.includes(p.name)&&rankOf(p.name)>=4&&Math.random()<.3)said=pick(['hot','lucky','hurry','calm'].filter(x=>x!==truth));
    const lv=regLevel(storeNo()),nm=nick();
    line=lv>=2&&nm?CHAT_REG[said].split('{name}').join(nm):((CHAT_CH[p.name]||{})[said]||pick(CHAT[said]));
    (S.chatLog=S.chatLog||[]).push({name:p.name,said,truth,hand:S.handNo})}
  talkLater(()=>talkSay(p,line,7700),350);render()}
// 状態が「態度」にだけ出る。どれも ±10% 前後
function talkAdj(p,d){
  if(!CFG.tells||CFG.ura||!p||p.human||S.scriptAI||S.finalHand||S.autoMe||p.name==='ジン'||p.name==='師匠'||!d)return d;
  const i=S.players.indexOf(p),toCall=Math.min(S.currentBet-p.bet,p.chips),canRaise=p.chips>toCall&&S.raises<3&&!p.acted,r=Math.random(),me=S.players[0];
  const c=S.claim;if(c&&c.hand===S.handNo&&c.i===i&&S.aggr===0&&toCall>0){
    if(c.read==='weak'&&d.type==='fold'&&r<.1)return{type:'call',state:'none'};
    if(!c.read&&rankOf(p.name)<3&&d.type==='call'&&r<.1)return{type:'fold',state:'none'}}
  const fx=S.duelFx;if(fx&&fx.hand===S.handNo&&fx.name===p.name&&toCall>0){
    if(fx.fold&&S.aggr===0&&d.type==='call'&&r<fx.fold)return{type:'fold',state:'none'};
    if(fx.call&&d.type==='fold'&&r<fx.call)return{type:'call',state:'none'}}
  const m=talkMood(p);
  if(m==='hot'&&toCall===0&&d.type==='call'&&canRaise&&r<.1)return{type:'raise',to:S.currentBet+Math.max(S.minRaise,Math.round(potTotal()*.5/1000)*1000),state:d.state==='strong'?'strong':'bluff'};
  if(m==='lucky'&&toCall>0&&d.type==='fold'&&r<.1)return{type:'call',state:'none'};
  if(m==='hurry'&&toCall>0&&d.type==='call'){if(r<.05)return{type:'fold',state:'none'};if(r<.1&&canRaise)return{type:'raise',to:p.bet+p.chips,state:d.state}}
  return d}
{const _cd=cpuDecide;cpuDecide=function(i){const d=_cd(i);try{return talkAdj(S.players[i],d)}catch(e){return d}}}
// 案D：「何持ってた？」
const WHAT_RATE={"ゲン": [0.45, 0.45, 0.9], "ソウ": [0.45, 0.45, 0.9], "ミナ": [0.45, 0.45, 0.9], "テツ": [0.4, 0.45, 0.9], "ハル": [0.45, 0.45, 0.9], "タロウ": [0.45, 0.45, 0.9], "セキ": [0.15, 0.65, 0.5], "レイカ": [0.1, 0.6, 0.3], "クロウ": [0.1, 0.6, 0.3], "ハヤト": [0, 0.2, 0.5], "ゴウ": [0, 0.2, 0.5], "_": [0.3, 0.4, 0.7]},WHAT_NO={"ハヤト": "見たけりゃ、降りるなよ。二代目", "ゴウ": "降りた奴に見せる手はねえよ", "クロウ": "それは、コールした方だけの特権です", "レイカ": "ひ・み・つ"},WHAT_SHOW=["ほら", "見せてあげる", "……これだ"],WHAT_SECRET=["さあね", "見たければ、コールすればよかった"];
function handTalk(sc,truth){let c=sc[0],r=sc[1];if(!truth){if(c>=1)c=0;else{c=1;r=pick(S.board).r}}
  return c===0?'何もなかったよ':c===1?`${rankStr(r)}のペアだよ`:`${HAND_JP[c]}だったよ`}
function whatAsk(){if(!S.handOver||S.whatOffer!==S.handNo||S.whatDone)return;S.whatDone=true;const p=S.players[S.whatWho];if(!p){render();return}
  log('あなた：「何持ってた？」');let line;
  if(p.name==='ジン'||p.name==='師匠')line='降りた手は、見なくていい';
  else{const w=WHAT_RATE[p.name]||WHAT_RATE._,r=Math.random(),mm=S.shownMem=S.shownMem||{bluff:0,strong:0},hm=mm[p.name]=mm[p.name]||{honest:0,lie:0};
    if(r<w[0]){p.show=true;line=pick(WHAT_SHOW);log(`${p.name}の手：${p.hand.map(cardStr).join(' ')}`);talkNote(p.name,'honest');hm.honest++;renderNotes()}
    else if(r<w[0]+w[1]){const truth=Math.random()<w[2];line=handTalk(bestN(p.hand.concat(S.board)),truth);
      (S.claims=S.claims||[]).push({name:p.name,said:line,truth,real:p.hand.map(cardStr).join(' '),hand:S.handNo})}
    else{line=WHAT_NO[p.name]||pick(WHAT_SECRET);talkNote(p.name,'secret');renderNotes()}}
  talkLater(()=>talkSay(p,line,7600),300);render()}
// 答え合わせ（6ハンドたったら、またはテーブルの終わりに）
const TALK_KEY='shisho-talk';
function loadTalk(){try{const n=JSON.parse(localStorage.getItem(TALK_KEY));if(!n||typeof n!=='object'||Array.isArray(n))return{};delete n.v;
  Object.keys(n).forEach(k=>{const r=n[k];if(!r||typeof r!=='object'||Array.isArray(r)){delete n[k];return}['honest','lie','secret','chatTrue','chatLie'].forEach(t=>r[t]=+r[t]||0)});return n}catch(e){return{}}}
function talkNote(name,k){const n=loadTalk(),r=n[name]=n[name]||{honest:0,lie:0,secret:0,chatTrue:0,chatLie:0};r[k]=(+r[k]||0)+1;try{localStorage.setItem(TALK_KEY,JSON.stringify({v:1,...n}))}catch(e){}}
function talkRows(){const n=loadTalk(),rows=[];Object.keys(n).forEach(name=>{const r=n[name];
  if(r.honest+r.lie+r.secret>0){const lb=r.honest+r.lie<2?'まだ分からない':r.lie===0?'正直に言う人':r.honest===0?'嘘を言う人':r.lie>r.honest?'嘘が多い人':'だいたい正直な人';
    rows.push(`<li class="talkrow"><b>${esc(name)}</b> <span>「何持ってた？」：${lb}</span> <span>（正直 ${r.honest}／嘘 ${r.lie}／教えない ${r.secret}）</span></li>`)}
  if(r.chatTrue+r.chatLie>0)rows.push(`<li class="talkrow"><b>${esc(name)}</b> <span>雑談：本当 ${r.chatTrue}／嘘 ${r.chatLie}</span></li>`)});return rows}
function talkReveal(all){if(!S)return;let any=false;
  S.chatLog=(S.chatLog||[]).filter(c=>{if(!all&&S.handNo-c.hand<6)return true;any=true;const lie=c.said!==c.truth;talkNote(c.name,lie?'chatLie':'chatTrue');
    if(lie)log(`答え合わせ：${c.name}の雑談は嘘だった（本当は「${MOOD_JP[c.truth]}」）`);return false});
  S.claims=(S.claims||[]).filter(c=>{if(!all&&S.handNo-c.hand<6)return true;any=true;talkNote(c.name,c.truth?'honest':'lie');
    const mm=S.shownMem=S.shownMem||{bluff:0,strong:0},hm=mm[c.name]=mm[c.name]||{honest:0,lie:0};hm[c.truth?'honest':'lie']++;
    log(`答え合わせ：${c.name}の「${c.said}」は${c.truth?'本当':'嘘'}だった（${c.real}）`);return false});
  if(any)renderNotes()}
// ハンドの終わり：状態の更新、「何持ってた？」を出すか
function talkEnd(){if(!S||!S.players)return;talkReveal(false);const me=S.players[0];
  if(CFG.tells)S.players.forEach(q=>{if(q.human||q.out)return;if(q.won-q.total>=Math.max(BB()*12,(q.hs||q.start)*.3))q.luckyTo=S.handNo+3;
    if(S.handNo>=12&&!q.hurry&&Math.random()<.06)q.hurry=true});
  if(talkOK()&&!S.whatDone&&S.street!=='showdown'&&me.folded&&!me.out&&!S.myPreFold&&S.board.length>=3){
    const w=S.players.findIndex(q=>!q.human&&q.won>0&&!q.show);if(w>0){S.whatOffer=S.handNo;S.whatWho=w}}}
function renderTalk(){if(!S||!S.players)return;const row=$('askRow'),b=$('btnNeedle'),wb=$('whatBox');if(!row||!b)return;row._bp=0;
  const a=S.ask,live=askLive(),show=live&&!a.done&&S.toAct===0;row.hidden=!show;
  if(show&&row.dataset.k!==a.hand+a.street+a.q){row.dataset.k=a.hand+a.street+a.q;row.innerHTML=a.opts.map((o,k)=>`<button class="needle ask${k===0?' quiet':''}" data-ak="${k}">${esc(o)}</button>`).join('')}
  if(live){b.hidden=true;renderNeedleMenu(false)}
  const chat=S.handOver&&!S.result&&talkOK()&&(S.chatN||0)<3&&S.chatHand!==S.handNo&&S.players.some(q=>!q.human&&!q.out);
  const mode=S.handOver?'chat':'needle';if(b.dataset.mode!==mode){b.dataset.mode=mode;b.textContent=mode==='chat'?'💬 話す':'💬 揺さぶる'}
  if(S.handOver){b.hidden=!chat;b.setAttribute('aria-expanded',String(chat&&S.chatPick===S.handNo));$('table').classList.toggle('talkpick',chat&&S.chatPick===S.handNo)}
  else $('table').classList.remove('talkpick');
  if(wb)wb.hidden=!(S.handOver&&!S.result&&S.whatOffer===S.handNo&&!S.whatDone);
  layoutSoon();if(S.handOver&&S.chatPick===S.handNo&&!$('talkPicks'))talkPicks();else if(!(S.handOver&&S.chatPick===S.handNo)&&$('talkPicks'))$('talkPicks').remove()}
// プレートの横に小さく「話す」。プレートを押すとチップの拡大が開くので、ボタンは卓の上の別の層に置く
function talkPicks(){const t=$('table');let box=$('talkPicks');const on=S&&S.players&&S.handOver&&!S.result&&S.chatPick===S.handNo&&S.chatHand!==S.handNo&&!$('game').hidden;
  if(!on){if(box)box.remove();return}
  if(!box){box=document.createElement('div');box.id='talkPicks';box.className='talkpicks';box.setAttribute('role','group');box.setAttribute('aria-label','話しかける相手を選ぶ');t.appendChild(box)}
  const tr0=t.getBoundingClientRect();
  S.players.forEach((p,i)=>{if(p.human)return;let bt=box.querySelector(`[data-talk="${i}"]`);
    if(p.out){if(bt)bt.remove();return}
    if(!bt){bt=document.createElement('button');bt.className='talkpick';bt.dataset.talk=i;bt.setAttribute('aria-label',`${p.name}に話す`);bt.textContent='話す';box.appendChild(bt)}
    const pl=$('plate'+i);if(!pl)return;const r=pl.getBoundingClientRect();
    bt.style.left=Math.max(30,Math.min(tr0.width-30,r.left+r.width/2-tr0.left)).toFixed(1)+'px';bt.style.top=Math.max(2,r.top-tr0.top+2).toFixed(1)+'px'});
  requestAnimationFrame(talkPicks)}
// 選択肢と「話す」は、自分の手札・ポットの表示より上に出す
function talkPlace(){const row=$('askRow'),b=$('btnNeedle');row.style.translate='';b.style.translate='';
  const nr=b.parentElement,mr=$('mine').querySelector('.me-r');nr.style.translate='';
  const sd=$('btnStraddle');if(sd)sd.style.display=row.hidden?'':'none';
  if(mr&&mr.offsetParent){const vis=[...nr.children].filter(x=>!x.hidden&&x.offsetParent);if(vis.length){const m=mr.getBoundingClientRect();let top=Infinity,bot=-Infinity,l=Infinity,rr=-Infinity;vis.forEach(x=>{const q=x.getBoundingClientRect();top=Math.min(top,q.top);bot=Math.max(bot,q.bottom);l=Math.min(l,q.left);rr=Math.max(rr,q.right)});
    let dy=0;if(rr>m.left&&l<m.right&&bot>m.top-4)dy=bot-m.top+6;
    const ps=$('potSign');if(dy&&ps&&!ps.hidden&&ps.offsetParent){const q=ps.getBoundingClientRect();if(q.right>l&&q.left<rr&&bot-dy>q.top-4&&top-dy<q.bottom+4)dy=bot-q.top+6}
    if(dy>0)nr.style.translate=`0 ${(-dy).toFixed(1)}px`}}
  const tgt=!row.hidden?row:(S.handOver&&!b.hidden&&b.dataset.mode==='chat')?b:null;if(!tgt)return;
  const r=tgt.getBoundingClientRect();let lim=Infinity;const hold=$('mine').querySelector('.hold');if(hold&&hold.offsetParent)lim=hold.getBoundingClientRect().top;
  const ps=$('potSign');if(ps&&!ps.hidden&&ps.offsetParent){const q=ps.getBoundingClientRect();if(q.right>r.left&&q.left<r.right)lim=Math.min(lim,q.top)}
  const dy=r.bottom-(lim-6);if(dy>0&&lim<Infinity)tgt.style.translate=`0 ${(-dy).toFixed(1)}px`;
  // v67：上げた 💬 が捨て札の山（.muckpile）に重なるときは、山の右へずらす（ストア画像 ss05・ss08）
  if(tgt===b)try{const mc=[...document.querySelectorAll('.felt .boardspot > .muckpile .muckcard')].map(x=>x.getBoundingClientRect());
    if(mc.length){const q=b.getBoundingClientRect(),P={left:Math.min(...mc.map(x=>x.left)),right:Math.max(...mc.map(x=>x.right)),top:Math.min(...mc.map(x=>x.top)),bottom:Math.max(...mc.map(x=>x.bottom))};
      if(P.left<q.right&&q.left<P.right&&P.top<q.bottom&&q.top<P.bottom){const tx=P.right+4-q.left,tb=$('table').getBoundingClientRect();
        if(q.right+tx<tb.right-4)b.style.translate=`${tx.toFixed(1)}px ${(dy>0&&lim<Infinity?-dy:0).toFixed(1)}px`}}}catch(e){}}
$('askRow').addEventListener('click',e=>{const x=e.target.closest('[data-ak]');if(x)answerAsk(+x.dataset.ak)});
$('table').addEventListener('click',e=>{const x=e.target.closest('[data-talk]');if(x){e.stopPropagation();chatTo(+x.dataset.talk)}});
$('btnWhat').onclick=()=>whatAsk();
// ---- 掛け合いの仕組み（読むだけの飾り。CPU の判断・テル・読み・クイズ・図鑑には一切つながない） ----
const BANTER_KEY='shisho-banter';
// 第一部の主人公を「新入り」「ジンの弟子」「二代目」などと呼ぶ組は、第二部（主人公＝タロウ）では出さない
(function(){const P1=/新入り|新人|ジンの弟子|ジンさんの弟子|二代目|先輩/;
  const txt=b=>[].concat(b.l||[],b.q?[b.q]:[],...(b.r||[]),b.mem||[]).map(x=>x[1]).join('/');
  const mark=b=>{if(!b.p2&&P1.test(txt(b)))b.p1=1};
  BANTER_ANY.forEach(mark);BANTER_PROG.forEach(mark);BANTER_ASK.forEach(mark);
  Object.keys(BANTER_REACT).forEach(k=>BANTER_REACT[k].forEach((b,i)=>{b.id='r-'+k+'-'+i;mark(b)}));
  const n={};BANTER_PROG.forEach(b=>{n[b.key]=n[b.key]||0;b.id='p-'+b.key+'-'+(n[b.key]++)})})();
Object.assign(TK_GEST,{"（小さく笑って、メモを閉じる）":"タケルが、小さく笑ってメモを閉じた","（両手で、小さく拍手する）":"タケルが、両手で小さく拍手した","（目を閉じて、首を小さく振る）":"タケルが、目を閉じて首を小さく振った"});
function bLoad(){const z={v:1,seen:{},side:{}};
  try{const o=JSON.parse(localStorage.getItem(BANTER_KEY));if(o&&typeof o==='object'){
    if(o.seen&&typeof o.seen==='object')for(const k of Object.keys(o.seen)){const n=Math.floor(+o.seen[k]);if(n>0)z.seen[k]=Math.min(n,99999)}
    if(o.side&&typeof o.side==='object')for(const k of Object.keys(o.side)){const n=+o.side[k];if(n===0||n===1||n===2)z.side[k]=n}}}catch(e){}
  return z}
function bSave(z){try{localStorage.setItem(BANTER_KEY,JSON.stringify({v:1,seen:z.seen,side:z.side}))}catch(e){}}
const bNames=b=>[...new Set((b.l||[]).map(x=>x[0]).concat(b.q?[b.q[0]]:[]))];
const bSig=b=>(b.l||[]).map(x=>x[0]+x[1]).join('|');
const bP2=()=>typeof P2ON==='function'&&P2ON();
const bP2c=()=>{try{return typeof loadP2==='function'?loadP2().cleared:0}catch(e){return 0}};
const bCl=()=>{try{return loadCleared()}catch(e){return 0}};
// 出してよい場面か（第7章・第二部の最終章・回想・最後のハンド・自動の手・案内中・決まった筋のハンドは出さない）
function bOn(){return !!(S&&S.players&&typeof CFG!=='undefined'&&CFG&&!CFG.flashback&&!(CFG.ch&&(CFG.ch.no===7||CFG.ch.p2===5))&&!S.finalHand&&!S.autoMe&&!S.scriptAI&&tourI<0&&tourDone())}
function bState(){return S.ban=S.ban||{used:{},sig:{},trig:{},first:'',last:-9,rest:-9,ask:0,mem:{},streak:null,mefold:-99}}
const bSeat=()=>S.players.filter(p=>!p.human&&!p.out&&p.chips>0).map(p=>p.name);
function bFit(b,extra){if(b.p1&&bP2())return false;if(b.p2&&!bP2())return false;
  const seat=bSeat();return bNames(b).every(n=>seat.includes(n)||n===extra)}
const B_RECENT=[];   // この起動中に出た組の id（新しい順に最大40）。卓が替わっても、すぐ同じ組に戻らないように
const bRecent=b=>B_RECENT.includes(b.id);
function bFresh(b){const B=bState();return !B.used[b.id]&&!B.sig[bSig(b)]}
// 既読の少ないものから。前の掛け合いの最初の話し手とは別の人で始める（残る限り）
function bLeast(L){if(!L.length)return null;const B=bState(),z=bLoad();
  let C=L.filter(b=>!bRecent(b));if(!C.length)C=L;const C1=C.filter(b=>b.l[0][0]!==B.first);if(C1.length)C=C1;
  const m=Math.min(...C.map(b=>+z.seen[b.id]||0));C=C.filter(b=>(+z.seen[b.id]||0)===m);
  return C[Math.floor(Math.random()*C.length)]}
function bAny(){return BANTER_ANY.filter(b=>bFresh(b)&&bFit(b))}
function bProg(){const cl=bCl(),c2=bP2c();
  return BANTER_PROG.filter(b=>bFresh(b)&&bFit(b)&&(b.need==null||cl>=b.need)&&(b.until==null||cl<b.until)&&(b.p2need==null||c2>=b.p2need)&&(b.p2until==null||c2<b.p2until))}
function bReactPick(rx){const B=bState();if((B.trig[rx.k]||0)>=2)return null;
  const C=(BANTER_REACT[rx.k]||[]).filter(b=>bFresh(b)&&!bRecent(b)&&(b.sub?b.sub===rx.s:!bNames(b).includes(rx.s))&&bFit(b,rx.k==='bust'?rx.s:''));
  const p=bLeast(C);if(p)B.trig[rx.k]=(B.trig[rx.k]||0)+1;return p}
function bMark(b){const B=bState(),z=bLoad();z.seen[b.id]=(+z.seen[b.id]||0)+1;bSave(z);B.used[b.id]=1;B.sig[bSig(b)]=1;B.first=b.l[0][0];B_RECENT.unshift(b.id);B_RECENT.length=Math.min(B_RECENT.length,40);
  if(window.__banLog)window.__banLog.push({id:b.id,hand:S.handNo,ctx:CFG.ch?(CFG.ch.p2?'p'+CFG.ch.p2:'c'+CFG.ch.no):CFG.store?'s'+CFG.store:'free'})}
// 掛け合いの吹き出しが、クセの札・カード・チップ・ボタンにかからないよう、少し横か上へずらす（クセの札は吹き出しより奥の層にあるため）
// 位置そのものは sayFollow が毎フレーム決める。ここではずらす量（_ax,_ay）だけを決め、sayFollow がそれを足す
function bAvoid(){const L=$('sayLayer');if(!L||$('game').hidden)return false;const R=e=>e.getBoundingClientRect();
  const ss=[...L.querySelectorAll('.say')],live=e=>e.classList.contains('bt')&&e.classList.contains('go')&&performance.now()-(e._t||0)<3700;
  ss.forEach(e=>{if(!live(e))e._ax=e._ay=0});
  const act=ss.filter(live);if(!act.length)return false;
  // 必ずよける：クセの札・場札・自分の手札・チップ・ポット・ボタン・ほかの吹き出し／できればよける：相手の伏せ札・名札
  const q=sel=>[...document.querySelectorAll(sel)].filter(e=>e.offsetParent&&R(e).width);
  const hard=q('#plates .cue,#boardCards .card,#mine .card,.chipwrap .chips,#potSign,#acts button,#askRow button,#street').concat(q('#msg').filter(e=>e.textContent.trim())).map(R),soft=q('.spot .card,#plates .plate').map(R);
  const tb=R($('table')),top=(()=>{try{return sayTopPad()}catch(e){return 2}})();const C=[];for(let dy=-40;dy<=48;dy+=8)for(let dx=-120;dx<=120;dx+=8)C.push([dx,dy]);C.sort((a,b)=>Math.abs(a[0])+2*Math.abs(a[1])-Math.abs(b[0])-2*Math.abs(b[1]));
  act.forEach(e=>{const r=R(e),ax=e._ax||0,ay=e._ay||0,oth=ss.filter(x=>x!==e&&x.classList.contains('go')&&performance.now()-(x._t||0)<3700).map(R);
    const ov=(L,x,y)=>L.some(o=>r.left+x<o.right-1&&o.left<r.right+x-1&&r.top+y<o.bottom-1&&o.top<r.bottom+y-1);
    const hitH=(x,y)=>ov(hard,x,y),sft=(x,y)=>ov(soft,x,y)||ov(oth,x,y);
    const h0=hitH(0,0);if(!h0&&!sft(0,0))return;   // 今の場所で何にもかからなければ、動かさない
    const okB=(X,Y)=>r.left+X>=tb.left+2&&r.right+X<=tb.right-2&&r.top+Y>=tb.top+top&&r.bottom+Y<=tb.bottom-2;
    for(const full of [true,false]){if(!full&&!h0)return;   // 伏せ札・名札だけなら、よけ場所がなければそのまま
      for(const [x,y] of C){const X=x-ax,Y=y-ay;if(!okB(X,Y))continue;if(!hitH(X,Y)&&(!full||!sft(X,Y))){e._ax=x;e._ay=y;return}}}});
  return true}
// クセの札は小さい所から大きくなり、カメラも寄るので、掛け合いの吹き出しが出ているあいだは 0.3 秒ごとに見直す
let bAvT=0;const bAvLoop=()=>{clearTimeout(bAvT);let on=false;try{on=bAvoid()}catch(e){}if(on)bAvT=setTimeout(bAvLoop,300)};
// 動作の重さの改善 案3：描き直しの直後ではなく、位置合わせ（36_layout_pass）の最後に1回目を回す（クセの札の位置が決まってから測る）
// カットイン・クイズ・案内などが出ているあいだは待つ
function bBlocked(){return tourI>=0||['toast','quiz','cutin','camBand','mieta','foolStamp'].some(id=>$(id)&&!$(id).hidden)||$('game').hidden}
// 1行ずつ吹き出しで出す。gap は今と同じ 1500ms × SPEED()
function bSay(lines,ok,done){const s0=S,h0=S.handNo,gap=1500*SPEED();let k=0,tries=0;
  const step=()=>{if(S!==s0||S.handNo!==h0||!ok())return;
    if(k>=lines.length){if(done)done();return}
    if(bBlocked()){if(++tries<15)setTimeout(step,400);return}
    const [n,line]=lines[k++],i=S.players.findIndex(p=>p.name===n&&!p.human);
    if(i<0)return step();const p=S.players[i];p.say={seq:(S.saySeq=(S.saySeq||0)+1),line,talk:true,bt:true};render();setTimeout(step,gap)};
  step();return lines.length*gap}
// ハンドの頭：案2（反応）→ 案3（物語）→ 案1（ふだん）
function startBanter(){
  if(!S||!S.players)return 0;
  const rx=S.bReact;S.bReact=null;const sil=S.bSilent;S.bSilent=null;
  if(!bOn())return 0;
  const B=bState(),talk=talkSet(),h0=S.handNo,ok=()=>!S.handOver||S.handNo===h0;
  if(sil&&sil.length){B.last=S.handNo;return bSay(sil,ok)}
  let pick=null;
  if(rx&&talk!=='off'&&Math.random()<.7)pick=bReactPick(rx);
  if(!pick&&B.rest!==S.handNo&&B.last!==S.handNo-1&&Math.random()<.35){
    // 案3：候補があれば 40% で優先。ただし、ふだんの組より何度も見ているときは譲る（同じ組がすぐ繰り返さないように）
    const A=bAny(),z=bLoad(),sn=b=>+z.seen[b.id]||0,am=A.length?Math.min(...A.map(sn)):1e9;
    if(talk!=='off'){const P=bProg().filter(b=>sn(b)<=am);if(P.length&&Math.random()<.4)pick=bLeast(P)}
    if(!pick)pick=bLeast(A)}
  if(!pick)return 0;
  bMark(pick);B.last=S.handNo;return bSay(pick.l,()=>S.handNo===h0)}
// ---- 案2：直前のハンドで起きたこと（みんなに見えたことだけ）を、次のハンドの頭に使う ----
function bDetect(){
  const P=S.players,me=P[0],B=bState(),sd=S.street==='showdown';
  const won=P.filter(p=>p.won>0),pot=won.reduce((a,p)=>a+p.won,0),tot=P.reduce((a,p)=>a+Math.max(0,p.chips),0);
  const one=won.length===1?won[0]:null;
  if(one&&!one.human){B.streak=B.streak&&B.streak.name===one.name?{name:one.name,n:B.streak.n+1}:{name:one.name,n:1}}else B.streak=null;
  const bossName=CFG.ch&&CFG.ch.opps?CFG.ch.opps[0].name:CFG.store&&CHAPTERS[CFG.store-1]?CHAPTERS[CFG.store-1].opps[0].name:'';
  const tp=S.taunt>0?P[S.taunt]:null,sr=S.slowrolled>0?P[S.slowrolled]:null;
  let r=null;
  if(sr||(tp&&mannerOf(tp)))r={k:'slow',s:(sr||tp).name};
  if(!r){const b=P.find(p=>!p.human&&p.chips<=0&&p.hs>0);if(b)r={k:'bust',s:b.name}}
  if(!r&&bossName&&me.won>0){const bp=P.find(p=>!p.human&&p.name===bossName&&p.hs>0);
    if(bp&&((sd&&!bp.folded&&bp.show)||(bp.folded&&S.aggr===0)))r={k:'meboss',s:bp.name}}
  if(!r&&sd&&S.runout&&S.board.length===5&&one){const live=P.filter(p=>!p.folded&&p.hand&&p.hand.length===2&&p.show);
    if(live.length>=2){const t=p=>bestN(p.hand.concat(S.board.slice(0,4)));if(live.some(q=>q!==one&&cmp(t(q),t(one))>0))r={k:'suckout',s:one.human?'':one.name}}}
  if(!r&&sd&&S.aggr>0){const ag=P[S.aggr];if(ag&&!ag.human&&ag.show&&!ag.mucked&&!ag.folded&&ag.score&&ag.score[0]<=1)r={k:'bluff',s:ag.name}}
  if(!r&&pot>0&&tot>0&&pot>=tot*.4){const w=won.slice().sort((a,b)=>b.won-a.won)[0];r={k:'bigpot',s:w.human?'':w.name}}
  if(!r&&B.streak&&B.streak.n>=3){r={k:'streak',s:B.streak.name};B.streak=null}
  if(!r&&sd&&!S.board2&&won.length>=2&&won.every(w=>w.score&&cmp(w.score,won[0].score)===0))r={k:'split',s:''};
  if(!r&&(S.dryStreak||0)>=5&&S.handNo-B.mefold>=6){r={k:'mefold',s:''};B.mefold=S.handNo}
  S.bReact=r}
// ---- 案4：ハンドの合間に、主人公も巻き込む。選んでも勝ち負け・打ち方・テルには何も起きない ----
const bAskOK=()=>!CFG.ch||CFG.ch.no>=4;
const bAskFit=a=>bFit({p1:a.p1,p2:a.p2,l:a.l.concat([a.q])});
function bGapFree(){return S.handOver&&!S.result&&!bBlocked()&&!NV.on&&!($('tauntBox')&&!$('tauntBox').hidden)&&S.chatPick!==S.handNo}
function bGap(){
  if(!bOn()||S.result||!S.handOver||talkSet()!=='on')return;
  const B=bState();if(B.last===S.handNo)return;
  const z=bLoad(),seat=bSeat();
  const M=BANTER_ASK.filter(a=>a.mem&&!B.mem[a.id]&&(z.side[a.id]===0||z.side[a.id]===1)&&bAskFit(a)&&seat.includes(a.mem[z.side[a.id]][0]));
  const h0=S.handNo,s0=S;let n=0;
  if(M.length&&Math.random()<.5){const a=M[Math.floor(Math.random()*M.length)],line=a.mem[z.side[a.id]];
    const go=()=>{if(S!==s0||S.handNo!==h0||!S.handOver||S.result)return;if(!bGapFree()){if(++n<5)setTimeout(go,600*SPEED());return}
      B.mem[a.id]=1;B.last=h0;B.rest=h0+1;B.first=line[0];if(window.__banLog)window.__banLog.push({id:'m-'+a.id,hand:h0});bSay([line],()=>S.handOver)};
    return setTimeout(go,700*SPEED())}
  if(B.ask||S.handNo<6||!bAskOK()||Math.random()>=.15)return;
  const A=BANTER_ASK.filter(a=>bAskFit(a)&&z.side[a.id]!==0&&z.side[a.id]!==1);if(!A.length)return;
  const a=bLeast(A);if(!a)return;B.ask=1;
  const go=()=>{if(S!==s0||S.handNo!==h0||!S.handOver||S.result){B.ask=0;return}
    if(!bGapFree()){if(++n<5)setTimeout(go,600*SPEED());else B.ask=0;return}
    B.last=h0;B.rest=h0+1;B.first=a.l[0][0];S.bAsk={a,hand:h0,stage:0};
    bSay(a.l.concat([a.q]),()=>S.handOver&&S.bAsk&&S.bAsk.a===a,()=>{if(!S.bAsk||S.bAsk.a!==a)return;S.bAsk.stage=1;
      const z2=bLoad();z2.seen[a.id]=(+z2.seen[a.id]||0)+1;bSave(z2);if(window.__banLog)window.__banLog.push({id:a.id,hand:h0});render()})};
  setTimeout(go,700*SPEED())}
// 答え：0・1＝選択肢、2＝黙る。時間切れ（次のハンドを配った）も黙ると同じ
function bAnswer(k,late){const st=S.bAsk;if(!st||st.stage!==1)return;const a=st.a;st.stage=2;S.bAsk=null;
  const z=bLoad();z.side[a.id]=k;bSave(z);
  const lines=(a.r[k]||[]).filter(x=>S.players.some(p=>p.name===x[0]&&!p.human));
  if(late){S.bSilent=lines;return}
  log(k===2?'あなた：（黙っている）':`あなた：「${a.o[k]}」`);render();
  const h0=S.handNo;setTimeout(()=>bSay(lines,()=>S.handOver&&S.handNo===h0),350*SPEED())}
{const _eh=endHand;endHand=function(){const r=_eh.apply(this,arguments);try{if(S&&S.players&&!S.result&&bOn()){bDetect();bGap()}else if(S)S.bReact=null}catch(e){}return r}}
{const _sh=startHand;startHand=function(){try{if(S&&S.bAsk){if(S.bAsk.stage===1)bAnswer(2,true);else S.bAsk=null}}catch(e){}return _sh.apply(this,arguments)}}
// 3つのボタンは「揺さぶる」の場所（今の答え方の列）に、同じ見た目で出す
{const _rt=renderTalk;renderTalk=function(){const r=_rt.apply(this,arguments);try{
  const row=$('askRow'),b=$('btnNeedle'),st=S&&S.bAsk;if(!row||!b)return r;
  if(st&&st.stage===1&&S.handOver&&!S.result&&st.hand===S.handNo){const a=st.a,key='b'+a.id+S.handNo;
    if(row.dataset.k!==key){row.dataset.k=key;row.innerHTML=[a.o[0],a.o[1],'黙る'].map((o,k)=>`<button class="needle ask${k===2?' quiet':''}" data-bk="${k}">${esc(o)}</button>`).join('')}
    row.hidden=false;row.classList.add('bask');b.hidden=true;$('table').classList.remove('talkpick');row._bp=1;layoutSoon()}
  else{row.classList.remove('bask');if(row.dataset.k&&row.dataset.k[0]==='b'&&!askLive()){row.hidden=true;row.dataset.k='';row.innerHTML=''}}}catch(e){}return r}}
// 3つのボタンが場札・自分の手札・チップ・ポット表示にかからない場所を探して、少しずらす
function bPlace(row){row.style.translate='';const R=e=>e.getBoundingClientRect(),r0=R(row),tb=R($('table'));if(!r0.width)return;
  const obs=[...document.querySelectorAll('#boardCards .card,#mine .card,#mine .mystack,#mine .hold,#potSign,.chipwrap .chips,.spot .card,#board2 .card')].filter(e=>e.offsetParent&&R(e).width).map(R);
  const bc=[...document.querySelectorAll('#boardCards .card')].filter(e=>e.offsetParent).map(R);
  const hit=(x,y)=>obs.some(o=>r0.left+x<o.right&&o.left<r0.right+x&&r0.top+y<o.bottom&&o.top<r0.bottom+y);
  const inT=(x,y)=>r0.left+x>=tb.left+4&&r0.right+x<=tb.right-2&&r0.top+y>=tb.top+2&&r0.bottom+y<=tb.bottom-2;
  const ys=[0];if(bc.length){const bb=Math.max(...bc.map(o=>o.bottom)),bt=Math.min(...bc.map(o=>o.top));ys.push(bb+4-r0.top,bt-4-r0.bottom)}
  for(const y of ys)for(let x=0;x>=-(r0.left-tb.left);x-=12){if(inT(x,y)&&!hit(x,y)){if(x||y)row.style.translate=`${x.toFixed(1)}px ${y.toFixed(1)}px`;return}}}
// v71（改善提案§1）：席の前の賭けチップ（.chipwrap）と持ち点の塔（.mystack。自分の欄の分も）、1対1では相手の伏せ札・D の札も（v70 レビュー）、場札にかかるときは、bPlace と同じく空いた所を探して席の側へ寄せる。
// 寄せる向きは「場札の真ん中→席」、横（席のある側・反対側）、縦（席の側・反対側）の順。席の札・名札・ポットの山にかからない、いちばん近い所。位置合わせ（36_layout_pass）で fitTable の後に呼ぶ
function chipAvoid(){const MS='#mine .mybet .chipwrap,#mine .mystack,.felt .spot .hand,#dbtn';document.querySelectorAll(MS).forEach(e=>{if(e.style.translate)e.style.translate=''});   // 自分の欄・相手の伏せ札・D の札は fitTable が戻さないので、ここで戻す
  const R=e=>e.getBoundingClientRect(),vis=r=>r.width>1,bc=boardRects();if(!bc.length)return;
  const box=rs=>({left:Math.min(...rs.map(r=>r.left)),right:Math.max(...rs.map(r=>r.right)),top:Math.min(...rs.map(r=>r.top)),bottom:Math.max(...rs.map(r=>r.bottom))}),B=box(bc),bx=(B.left+B.right)/2,by=(B.top+B.bottom)/2,tb=R($('table'));
  const on=(a,dx,dy,os,m)=>os.some(o=>a.left+dx<o.right+m&&o.left-m<a.right+dx&&a.top+dy<o.bottom+m&&o.top-m<a.bottom+dy);
  const pot=[...document.querySelectorAll('#potChips .chip,#potSign')].map(R).filter(vis);
  const parts=w=>w.id==='dbtn'?[w]:[...w.querySelectorAll(w.classList.contains('hand')?'.card':'.chip')];
  const ws=[...document.querySelectorAll('.felt .spot .chipwrap,.felt .spot .mystack,#mine .mybet .chipwrap,#mine .mystack'+(N()===2?',.felt .spot .hand:not(.folded):not(.muck),#dbtn':''))].map(w=>{const cs=parts(w).map(R).filter(vis);return cs.length?[w,box(cs)]:null}).filter(x=>x&&on(x[1],0,0,bc,1));
  const out=[];ws.forEach(([w,a])=>{const sp=w.id==='dbtn'?w:w.closest('.spot')||$('mine'),sr=R(sp),kx=sr.width/(sp.offsetWidth||1)||1,ky=sr.height/(sp.offsetHeight||1)||1;
    const own=[...sp.querySelectorAll('.hand:not(.folded):not(.muck) .card,.mystack .chip,.chipwrap .chip')].filter(e=>!w.contains(e)).map(R).filter(vis).concat([...document.querySelectorAll('#plates .plate,#mine .card,#dbtn')].filter(e=>e!==w).map(R).filter(vis)),obs=bc.concat(pot);
    let ux=sr.left+sr.width/2-bx,uy=sr.top+sr.height/2-by;const n=Math.hypot(ux,uy)||1;ux/=n;uy/=n;const sx=ux<0?-1:1,fw=document.querySelector('.felt-wrap'),top=sp.id==='mine'||!fw||parts(w)[0]===w||w.classList.contains('hand')?tb.top:Math.max(tb.top,R(fw).top);   // 席のチップは卓の縁より奥（相手の体の前）へは出さない（伏せ札・D の札は今までどおり）
    // まず席の札・名札にもかからない所。無ければ（狭い卓）場札とポットにかからないことだけを守る。卓の真ん中（席と反対）へ寄せるのは最後（ポットの山に見えるため）
    let best=null;for(const soft of [1,0])if(!best)for(const [vx,vy,pen] of [[ux,uy,1],[sx,0,1],[-sx,0,1],[0,uy<0?-1:1,1],[0,uy<0?1:-1,2.5]])for(let t=4;t<=Math.max(150,tb.width*.5);t+=4){const dx=vx*t,dy=vy*t;
      if(a.left+dx<tb.left+2||a.right+dx>tb.right-2||a.top+dy<top+2||a.bottom+dy>tb.bottom-2)break;
      if(!on(a,dx,dy,obs,2)&&!(soft&&on(a,dx,dy,own,0))){if(!best||t*pen<best[2])best=[dx,dy,t*pen];break}}
    if(!best)return;const [x0,y0]=(w.style.translate||'0px 0px').split(' ').map(v=>parseFloat(v)||0);
    out.push([w,x0,y0,best[0]/kx,best[1]/ky])});
  // 卓の傾き（奥ほど小さく見える）で、動いた量が足りない・出すぎることがある。場札にまだかかっていれば少し大きく（2回まで）、卓の外へ出たら少しずつ戻す
  const tr=(w,x0,y0,mx,my,f)=>{w.style.translate=`${(x0+mx*f).toFixed(1)}px ${(y0+my*f).toFixed(1)}px`},bx_=w=>{const cs=parts(w).map(R).filter(vis);return cs.length?box(cs):null};
  const outT=b=>b&&(b.left<tb.left||b.right>tb.right||b.bottom>tb.bottom),onB=b=>b&&on(b,0,0,bc,1);
  out.forEach(o=>tr(...o,1));
  out.forEach(([w,x0,y0,mx,my])=>{let f=1;for(let k=0;k<2&&onB(bx_(w));k++){f+=.3;tr(w,x0,y0,mx,my,f);if(outT(bx_(w))){f-=.3;tr(w,x0,y0,mx,my,f);break}}
    for(;f>.45&&outT(bx_(w));){f-=.15;tr(w,x0,y0,mx,my,f)}})}
$('askRow').addEventListener('click',e=>{const x=e.target.closest('[data-bk]');if(x){e.stopPropagation();bAnswer(+x.dataset.bk)}});

function cpuAct(i){if(S.handOver||S.toAct!==i)return;const d=cpuDecide(i);act(i,d.type,d.to)}
