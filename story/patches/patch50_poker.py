import os,json,sys,re
os.chdir(os.path.dirname(os.path.abspath(__file__))+'/..')
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC).read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a);assert n==cnt,(a[:90],n);s=s.replace(a,b)
EN={};TP=[]
def en(ja,e):
    k=re.sub(r'\s+',' ',ja).strip()
    EN[k]=e
def tp(ja,e):TP.append([re.sub(r'\s+',' ',ja).strip(),e])

# =========================================================
# プロのポーカープレイヤー目線の修正（research/プロポーカープレイヤー目線_実装仕様.md）
#   python3 ux/patch50_poker.py story/work47.html story/work50.html
# 当てる場所：エンジン（startHand の中身・refundUncalled・showdown・equity・cpuDecide0・calcEq）と
#             ジンの助言（senseiLine・advRecord）。patch49（UI・流れ）が触らない行だけを錨にする。
# 守ること：第1〜3章の CPU の判断・難しさ・クセの確率は変えない（CPU の修正は proAI() が真のときだけ）。
#           第7章のジンの release のクセには触れない。名前に「夜」を使わない。会話にお金の話を入れない。
# =========================================================

# =====================================================================
# 第1部：正しさの修正（全章）
# =====================================================================

# ---------------------------------------------------------------- S1. BBアンティを返さない
# startHand：全員 ante:0。BBアンティを払った人に q.ante
rep("hs:p.chips,mucked:false,shownByChoice:false,","hs:p.chips,ante:0,mucked:false,shownByChoice:false,")
rep("{const q=S.players[bb],a=Math.min(BB(),q.chips);if(a>0){q.chips-=a;q.total+=a;if(q.chips===0)q.allIn=true;",
    "{const q=S.players[bb],a=Math.min(BB(),q.chips);if(a>0){q.chips-=a;q.total+=a;q.ante=a;if(q.chips===0)q.allIn=true;")
# refundUncalled：アンティは賭けではないので、比べる額から外す
rep("function refundUncalled(){const c=S.players.filter(p=>p.total>0).sort((a,b)=>b.total-a.total);if(!c.length)return;\n  if(!c[1])return;const ex=c[0].total-c[1].total;if(ex<=0)return;",
    "const betOf=p=>p.total-(p.ante||0); // アンティを除いた、賭けた額\nfunction refundUncalled(){const c=S.players.filter(p=>p.total>0).sort((a,b)=>betOf(b)-betOf(a));if(!c.length)return;\n  if(!c[1])return;const ex=betOf(c[0])-betOf(c[1]);if(ex<=0)return;")
# showdown：段は total-ante で作り、アンティの合計は1つめの段（メインポット）に足す。2回めくりでも同じ
rep("  const levels=[...new Set(contrib.map(p=>p.total))].sort((a,b)=>a-b);",
    "  const levels=[...new Set(contrib.map(betOf))].sort((a,b)=>a-b),anteSum=contrib.reduce((a,p)=>a+(p.ante||0),0);")
rep("    let amt=0;contrib.forEach(p=>{amt+=Math.min(p.total,L)-Math.min(p.total,prev)});",
    "    let amt=L===levels[0]?anteSum:0;contrib.forEach(p=>{amt+=Math.min(betOf(p),L)-Math.min(betOf(p),prev)});")
rep("    let elig=cont.filter(p=>p.total>=L);","    let elig=cont.filter(p=>betOf(p)>=L);")

# ---------------------------------------------------------------- A2. トーナメントで2回めくり・ボムポットを出さない
rep("function twiceAskable(){return !!CFG.ch&&CFG.ch.no>=5&&",
    "function twiceAskable(){return !!CFG.ch&&!CFG.levels&&CFG.ch.no>=5&&")
rep("function startTwice(){S.twice=true;","function startTwice(){if(CFG.levels)return;S.twice=true;")
rep("goal:{type:'bust'},hint:null,tells:true,house:'bomb',\n  levels:","goal:{type:'bust'},hint:null,tells:true,\n  levels:")

# ---------------------------------------------------------------- A3. ジンの「誰も参加していない」：リンプした人を数える（第2章、文言の条件だけ）
rep("    const nobodyIn=S.players.every((p,i)=>i===0||p.bet<=BB())&&S.currentBet<=BB();",
    "    const nobodyIn=S.currentBet<=BB()&&noLimper();")
# ---------------------------------------------------------------- A4. ジンの「役ができた」：トップペア未満は「小さい役」（第1章、文言だけ）
rep("    return isWeak(me.hand,S.board)?'何もできていない。ゲン相手にブラフは効かんぞ。':'役ができた。ゲンは降りない。しっかり賭けろ。';",
    "    if(isWeak(me.hand,S.board))return'何もできていない。ゲン相手にブラフは効かんぞ。';\n"
    "    return smallMade(me.hand,S.board)?'小さい役だ。安く見られるなら見ていい。大きく賭けられたら考えろ。':'役ができた。ゲンは降りない。しっかり賭けろ。';")
# tier1 の「安く入れるなら参加していい」は、第4章以降（と裏の卓・フリー）で使うときだけ「入るならレイズで入れ」
rep("      if(t===1)return toCall<=BB()?'悪くない。安く入れるなら参加していい。':",
    "      if(t===1)return toCall<=BB()?(proAI()?'悪くない。入るならレイズで入れ。':'悪くない。安く入れるなら参加していい。'):")
HELP_JS=r"""
// A3：BB以外の誰も、プリフロップでチップを出していない（SBはブラインドだけ）。自分（席0）は数えない
function noLimper(){const live=p=>!p.out,alive=S.players.filter(live).length;
  const sb=alive===2?S.dealer:nextIdx(S.dealer,live),bb=nextIdx(sb,live);
  return S.players.every((p,i)=>i===0||p.out||i===bb||(i===sb?p.bet<=SB():p.bet===0))}
// A4：自分の札で作ったペアが、場のいちばん高いカードより低い（ボトム・ミドルペア、場より小さいポケットペア）
function smallMade(hand,board){if(board.length<3)return false;const cat=bestN(hand.concat(board))[0];if(cat>2)return false;
  const top=Math.max(...board.map(c=>c.r)),hr=hand.map(c=>c.r);
  const pairs=[...new Set(hr)].filter(r=>(hr[0]===hr[1])||board.some(c=>c.r===r));
  if(!pairs.length||(cat===2&&pairs.length>=2))return false;return Math.max(...pairs)<top}
function isLatePos(){"""
rep("\nfunction isLatePos(){",HELP_JS)
en('小さい役だ。安く見られるなら見ていい。大きく賭けられたら考えろ。',"A small hand. Look if it's cheap. If they bet big, think again.")
en('悪くない。入るならレイズで入れ。',"Not bad. If you play it, come in with a raise.")

# ---------------------------------------------------------------- B1. 振り返りの判定（賭け方に合う手に絞る・「大きく」は½ポット以上だけ）
rep("  if(toCall>0){st.faced++;if(type==='fold')st.foldToBet++}\n  if(toCall>0&&(type==='fold'||type==='call')){const opps=S.players.filter(q=>q!==p&&inHand(q)).length;if(!opps)return;\n    const pot=potTotal(),need=Math.min(toCall,p.chips)/(pot+Math.min(toCall,p.chips)),eq=equity(p.hand,S.board,opps,150);",
    "  const potB=potTotal()-toCall;\n  if(toCall>0&&toCall>=potB*.5){st.faced++;if(type==='fold')st.foldToBet++}\n  if(toCall>0&&(type==='fold'||type==='call')){const opps=S.players.filter(q=>q!==p&&inHand(q)).length;if(!opps)return;\n    const ag=S.players[S.aggr],nw=S.aggr>0&&ag&&ag.lastType==='raise'?.6*betNarrow(toCall/Math.max(1,potB)):0;\n    const pot=potTotal(),need=Math.min(toCall,p.chips)/(pot+Math.min(toCall,p.chips)),eq=equity(p.hand,S.board,opps,150,nw);")

# ---------------------------------------------------------------- B3. 勝率表示：プリフロップは2500回（4000回は端末によって0.5秒近くかかるため）、そのハンドの中では使い回す
rep("  const need=5-S.board.length,deck=S.deck.slice(),win=live.map(()=>0);let n=0;",
    "  const need=5-S.board.length,deck=S.deck.slice(),win=live.map(()=>0);let n=0;\n"
    "  const pk=S.handNo+':'+live.map(p=>S.players.indexOf(p)).join(',');\n"
    "  if(need===5&&S.eqPre&&S.eqPre.k===pk){live.forEach((p,k)=>{p.eqDir='';p.eq=S.eqPre.v[k]});return}")
rep("  else for(let t=0;t<600;t++){const d=deck.slice(),add=[];",
    "  else for(let t=0;t<(need===5?2500:600);t++){const d=deck.slice(),add=[];")
rep("  live.forEach((p,k)=>{const v=Math.round(win[k]/n*100);p.eqDir=p.eq==null?'':v>p.eq?' up':v<p.eq?' down':'';p.eq=v});\n}",
    "  live.forEach((p,k)=>{const v=Math.round(win[k]/n*100);p.eqDir=p.eq==null?'':v>p.eq?' up':v<p.eq?' down':'';p.eq=v});\n"
    "  if(need===5)S.eqPre={k:pk,v:live.map(p=>p.eq)};\n}")

# ---------------------------------------------------------------- B4. テル：「黙る＝ブラフ／話す＝強い」の型も入れる（第4章の組は動かさない）
for nm in ['ハヤト','マツ','ヨシオ']:
    old="  '%s':{strong:{cue:'still',rate:.65,false:.1},bluff:{cue:'%s',rate:.65,false:.1}},"%(nm,'stare' if nm=='ハヤト' else 'talk')
    rep(old,"  '%s':{strong:{cue:'talk',rate:.65,false:.1},bluff:{cue:'still',rate:.65,false:.1}},"%nm)
# 第5章の噂（ハヤトのクセ）を新しい型に合わせる
rep("5:[['テツ','ハヤトが急に動かなくなったら、要注意だ','true'],['テツ','あいつがこっちをじっと見てくるときは、たいてい嘘だ','true'],",
    "5:[['テツ','ハヤトの口数が急に増えたら、要注意だ','true'],['テツ','あいつが急に黙って動かなくなったら、たいてい嘘だ','true'],")
en('ハヤトの口数が急に増えたら、要注意だ',"If Hayato suddenly starts talking more, watch out.")
en('あいつが急に黙って動かなくなったら、たいてい嘘だ',"When he suddenly goes quiet and stops moving, he's usually lying.")
BOOK='クセは人それぞれだ。本に書いてある意味を信じるな'
en(BOOK,"Every player's tells are their own. Don't trust what the books say they mean.")

# ---------------------------------------------------------------- C. ディーラーのミス 4% → 1.5%
rep("  // ディーラーのミス（第4章以降とフリー対戦）：1ハンドに4%、続けては起きない","  // ディーラーのミス（第4章以降とフリー対戦）：1ハンドに1.5%、続けては起きない")
rep("S.mistakeHand!==S.handNo-1&&Math.random()<.04){","S.mistakeHand!==S.handNo-1&&Math.random()<.015){")

# ---------------------------------------------------------------- C. ショーダウン：最後に賭けた人以外の、負けたCPUはときどき伏せて捨てる
# オールインのときは必ず見せる。第1〜3章・第4章（テルの章）・台本のハンドは今のまま全員見せる
rep("  cont.forEach(p=>log(`${p.name}：${p.hand.map(cardStr).join(' ')}（${p.hname}）`));\n  judgeDeclare();selfLearn();talkSD(cont);",
    "  if(muckOn())cont.forEach(p=>{if(p.human||p.won>0||p.allIn||S.players.indexOf(p)===S.aggr)return;if(Math.random()<.3){p.show=false;p.mucked=true}});\n"
    "  const contS=cont.filter(p=>!p.mucked||p.human);\n"
    "  cont.forEach(p=>log(p.mucked&&!p.human?`${p.name}は手を伏せて捨てた`:`${p.name}：${p.hand.map(cardStr).join(' ')}（${p.hname}）`));\n  judgeDeclare();selfLearn();talkSD(contS);")
rep("  cont.forEach(p=>(p.tellLog||[]).forEach(t=>{log(`答え合わせ：${p.name}の「${CUE_LABEL[t.cue]}」は${TRUTH_JP[t.truth]}だった`);noteTell(p.name,t.cue,t.truth)}));",
    "  contS.forEach(p=>(p.tellLog||[]).forEach(t=>{log(`答え合わせ：${p.name}の「${CUE_LABEL[t.cue]}」は${TRUTH_JP[t.truth]}だった`);noteTell(p.name,t.cue,t.truth)}));\n"
    "  // B4：テルの章（第4章）で、初めて答え合わせをしたときに1回だけ\n"
    "  if(CFG.ch&&!CFG.ura&&!CFG.ch.p2&&CFG.ch.no===4&&!S.bookSaid&&contS.some(p=>!p.human&&(p.tellLog||[]).length)){S.bookSaid=true;jinNote(%s,0)}"%json.dumps(BOOK,ensure_ascii=False))
tp('{0}は手を伏せて捨てた','{0} mucked their hand face down')

# ---------------------------------------------------------------- C. 第6章：レン・ソフィアは途中から参加（持ち点が違う理由）
rep("  if(S.handNo===1)log('基本ルール：スモールブラインド・ビッグブラインド・BBアンティ（BBの人が全員分のアンティを払う）');",
    "  if(S.handNo===1)log('基本ルール：スモールブラインド・ビッグブラインド・BBアンティ（BBの人が全員分のアンティを払う）');\n"
    "  if(S.handNo===1&&CFG.ch&&!CFG.ch.p2&&CFG.ch.no===6&&S.players.some(p=>p.name==='レン')&&S.players.some(p=>p.name==='ソフィア'))log('レンとソフィアは、途中から参加した。持ち点が少ないのは、そのためだ');")
en('レンとソフィアは、途中から参加した。持ち点が少ないのは、そのためだ',"Ren and Sofia joined partway through. That's why their stacks are smaller.")

# ---------------------------------------------------------------- C. 用語
# 初回だけ「2回めくり（ランイットツワイス）」
rep("  box.innerHTML=`<div class=\"qin twicebox\"><p class=\"qq\">オールインです。残りの場札を2回めくって、ポットを半分ずつ分けますか？</p>",
    "  const q1=twiceTermSeen?'オールインです。残りの場札を2回めくって、ポットを半分ずつ分けますか？':'オールインです。2回めくり（ランイットツワイス）にしますか？ 残りの場札を2回めくって、ポットを半分ずつ分けます。';twiceTermSeen=true;\n"
    "  box.innerHTML=`<div class=\"qin twicebox\"><p class=\"qq\">${q1}</p>")
rep("function askTwice(live,then){","let twiceTermSeen=false;\nfunction askTwice(live,then){")
en('オールインです。2回めくり（ランイットツワイス）にしますか？ 残りの場札を2回めくって、ポットを半分ずつ分けます。',
   "You're all-in. Run it twice? The rest of the board is dealt twice and the pot is split in half.")
# 役の一覧：スリーカードに（セット／トリップス）
rep("  ['スリーカード','同じ数字が3枚',","  ['スリーカード','同じ数字が3枚（セット／トリップスとも呼ぶ）',")
en('同じ数字が3枚（セット／トリップスとも呼ぶ）','Three cards of the same rank (also called a set or trips)')
# 英語の直し（今ある訳を置きかえる）
rep('["{0}に、コールされなかった {1} を返した", "{1} uncalled, returned to {0}"]','["{0}に、コールされなかった {1} を返した", "Uncalled bet of {1} returned to {0}"]')
rep('"ハンドをオープン": "Show hands"','"ハンドをオープン": "Players, please show your hands"')

# =====================================================================
# 第2部：CPU の打ち方（第4章以降・第二部・フリー・はしご・裏の卓。第1〜3章は proAI() が偽なので今のまま）
# =====================================================================

# ---------------------------------------------------------------- STYLES に read（賭け方を読む強さ）と noLimp（自分から最初に入るときリンプしない）
rep("  rude:{hi:1.6,mid:1.25,midP:.45,bluff:.12,margin:.02,defPre:0,defPost:0},\n};",
    "  rude:{hi:1.6,mid:1.25,midP:.45,bluff:.12,margin:.02,defPre:0,defPost:0},\n};\n"
    "// S2：read＝相手が賭けてきたとき、相手の手を「賭け方に合う手」に絞る強さ（0〜1）。A1：noLimp＝最初に入るときはレイズか降りる\n"
    "{const R={station:0,normal:.4,liar:.4,liar2:.4,rude:.4,tight:.6,tight2:.6,nit:.6,nit2:.6,hayato:.7,crow:.9,jin:.9};\n"
    " Object.keys(R).forEach(k=>{STYLES[k].read=R[k]});['jin','crow','hayato','tight','tight2'].forEach(k=>{STYLES[k].noLimp=true})}")
rep("STYLES.mentor={...STYLES.jin};","STYLES.mentor={...STYLES.jin};STYLES.kai.read=.6;")

# ---------------------------------------------------------------- equity に narrow：相手の1人目（賭けた人）の弱い手を、確率 narrow で配り直す（最大3回）
# 大きな賭け（narrow>0.45、だいたいポット同額以上）には、ワンペアの手も (narrow-0.45)×2 の確率で配り直す（2倍ポットのコールを2〜3割に近づけるため）
rep("function equity(hand,board,opps,sims){","function equity(hand,board,opps,sims,narrow){")
rep("    for(let i=0;i<need;i++){const j=i+Math.floor(Math.random()*(rest.length-i));[rest[i],rest[j]]=[rest[j],rest[i]]}\n    const b=board.concat(rest.slice(opps*2,need));",
    "    for(let i=0;i<need;i++){const j=i+Math.floor(Math.random()*(rest.length-i));[rest[i],rest[j]]=[rest[j],rest[i]]}\n"
    "    if(narrow>0)for(let k=0;k<3;k++){const h0=[rest[0],rest[1]];\n"
    "      if(eqWeak(h0,board)){if(Math.random()>=narrow)break}\n"
    "      else if(!(narrow>.45&&board.length>=3&&bestN(h0.concat(board))[0]<=1&&Math.random()<(narrow-.45)*2))break;\n"
    "      for(const x of [0,1]){const j=need+Math.floor(Math.random()*(rest.length-need));[rest[x],rest[j]]=[rest[j],rest[x]]}}\n"
    "    const b=board.concat(rest.slice(opps*2,need));")

PRO_JS=r"""
// ===== プロ目線の CPU（第4章以降・第二部・フリー・はしご・裏の卓）。第1〜3章・回想・台本のハンドでは使わない =====
const proAI=()=>!(CFG.ch&&!CFG.ura&&CFG.ch.no<=3)&&!CFG.flashback&&!S.scriptAI&&!S.finalHand&&!S.autoMe;
// 賭けの大きさ（ポットに対する割合）→ 絞る割合。½ポット=0.3、同額=0.6、2倍以上=0.85（間は直線）
function betNarrow(x){x=Math.max(0,x);return x<=.5?.6*x:x<=1?.3+.6*(x-.5):x<=2?.6+.25*(x-1):.85}
// 賭けてきた相手の手として「合わない」手：プリフロップは弱い2枚、フロップ以降はワンペア未満（場だけの役）でドローもない
const eqWeak=(h,b)=>b.length<3?preTier(h)===0:isWeak(h,b)&&!drawOf(h,b);
// A1：まだ誰も参加していない（BB以外は誰もコールしていない・レイズもない。ストラドルは数えない）
const preOpen=p=>S.street==='preflop'&&S.aggr<0&&!S.players.some(q=>q!==p&&!q.out&&q.lastType==='call'&&q.bet>0);
function proAdj(p,d,x){
  if(S.street!=='preflop'||x.toCall<=0)return d;
  const st=x.st;
  // A1：強キャラは、自分から最初に入るときリンプしない（レイズ2.5〜3BB か、降りる）。BBのチェックはそのまま
  if(d.type==='call'&&st.noLimp&&preOpen(p)){
    if(x.rel>=enterLine(p)&&x.canRaise)return{type:'raise',to:Math.max(S.currentBet+S.minRaise,Math.round(BB()*(2.5+Math.random()*.5)/1000)*1000),state:x.rel>st.hi?'strong':'none',rel:x.rel>st.mid};
    if(x.rel<enterLine(p))return{type:'fold',state:'none'};
    return d}
  // A1：読める相手は、3BBまでのオープンに対して、平均より強い手なら降りすぎない
  if(d.type==='fold'&&(st.read||0)>=.6&&S.raises===1&&S.currentBet<=BB()*3&&x.rel>1)return{type:'call',state:x.rel>st.hi?'strong':'none'};
  return d}
function cpuDecide(i){"""
rep("\nfunction cpuDecide(i){",PRO_JS)

OLD_CPU=r"""  const opps=S.players.filter(q=>inHand(q)&&q!==p).length;
  const eq=equity(p.hand,S.board,opps,S.street==='preflop'?200:300);
  const pot=potTotal();
  const odds=toCall/(pot+toCall);
  const rel=eq*(opps+1);
  const r=Math.random();
  p._close=toCall>0&&Math.abs(eq-(odds+st.margin))<.06;
  const canRaise=p.chips>toCall&&S.raises<3&&!p.acted;
  {const L=leakOn(p);if(L){const lk=leakDecide(p,L.k,{toCall,pot,rel,eq,odds,st,r,canRaise});if(lk){S._lk=L.k;if(lk.d)return lk.d;st=lk.st}}}
  if(canRaise&&(rel>st.hi||(rel>st.mid&&r<st.midP)||(toCall===0&&r<st.bluff))){
    const size=Math.max(S.minRaise,Math.round(pot*(0.5+Math.random()*0.4)/1000)*1000);
    return{type:'raise',to:S.currentBet+size,state:rel>st.hi?'strong':rel<1?'bluff':'none',rel:rel>st.mid};
  }
  if(toCall===0)return{type:'call',state:rel>st.hi?'strong':'none'};
  // 慎重な性格：レイズや賭けを受けたら、強い手以外は降りる
  if(S.street==='preflop'&&S.currentBet>BB()&&st.defPre&&rel<st.defPre)return{type:'fold',state:'none'};
  if(S.street!=='preflop'&&st.defPost&&rel<st.defPost)return{type:'fold',state:'none'};
  if(eq>=odds+st.margin||(toCall<=BB()&&rel>enterLine(p)))return{type:'call',state:rel>st.hi?'strong':'none'};
  if(st.loose&&toCall<=BB()*4&&rel>0.5)return{type:'call',state:rel>st.hi?'strong':'none'};
  return{type:'fold',state:'none'};
}"""
NEW_CPU=r"""  const opps=S.players.filter(q=>inHand(q)&&q!==p).length;
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
}"""
rep(OLD_CPU,NEW_CPU)

# ショーダウンで伏せるのは、CPU の修正と同じ範囲（ただし第4章は全員見せる）
rep("\nfunction showdown(){","\nconst muckOn=()=>proAI()&&!S.runout&&!(CFG.ch&&!CFG.ura&&!CFG.ch.p2&&CFG.ch.no===4);\nfunction showdown(){")

rep('const EN_DICT={','const EN_DICT='+json.dumps(EN,ensure_ascii=False)[:-1]+',')
rep('const EN_TPL=[','const EN_TPL='+json.dumps(TP,ensure_ascii=False)[:-1]+',')
open(OUT,'w').write(s);print('ok',len(EN),len(TP))
