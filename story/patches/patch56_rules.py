import os,json,sys,re
os.chdir(os.path.dirname(os.path.abspath(__file__))+'/..')
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC).read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a);assert n==cnt,(a[:90],n);s=s.replace(a,b)
EN={}
def en(ja,e):
    k=re.sub(r'\s+',' ',ja).strip()
    EN[k]=e

# =========================================================
# ルールの修正（research/ノーリミットホールデムのルール.md：R-14・R-10・R-06）
#   python3 ux/patch56_rules.py story/v63a.html story/x56.html
# 守ること：第1〜3章の CPU の判断・難しさ・クセの確率は変えない。第7章のジンの release のクセには触れない。
#           R-33（7-2のボーナス）は変えない。
# =========================================================

# ---------------------------------------------------------------- R-14. ショーダウンで見せる順番・伏せる判定は「リバーで最後に攻めた人」
# S.riverAggr：リバーで最後にベット・レイズした人（いなければ -1）。S.aggr はほかの判定（読み・ブラフ）のために残す
rep("msg:'',aggr:-1,myPostAggro:false,","msg:'',aggr:-1,riverAggr:-1,myPostAggro:false,")
rep("S.raises=0;S.aggr=-1;S.lastCalled=-1;","S.raises=0;S.aggr=-1;S.riverAggr=-1;S.lastCalled=-1;")
rep("hs:p.chips,ante:0,mucked:false,","hs:p.chips,ante:0,mucked:false,muckPlan:false,")
rep("S.currentBet=p.bet;S.raises++;S.aggr=i;S.lastCalled=-1;",
    "S.currentBet=p.bet;S.raises++;S.aggr=i;if(S.street==='river')S.riverAggr=i;S.lastCalled=-1;")
# 開く順番：リバーで最後に攻めた人から時計回り。いなければボタンの左から
# 先に見せた手に負けている CPU は、伏せて捨てることがある（最初に見せる人・リバーで攻めた人・オールインの人は見せる）
rep("""  // 最後に攻めた人から開く。いなければボタンの左から
  const seat=p=>(S.players.indexOf(p)-S.dealer-1+N())%N();
  opp.sort((a,b)=>seat(a)-seat(b));
  const ag=S.players[S.aggr];if(ag&&opp.includes(ag)){opp.splice(opp.indexOf(ag),1);opp.unshift(ag)}
""","""  // R-14：リバーで最後にベット・レイズした人から時計回りに開く。リバーで誰も賭けていなければボタンの左から
  const st0=S.riverAggr>=0?S.riverAggr:(S.dealer+1)%N(),seat=p=>(S.players.indexOf(p)-st0+N())%N();
  opp.sort((a,b)=>seat(a)-seat(b));
  S.showOrder=cont.slice().sort((a,b)=>seat(a)-seat(b)).map(p=>S.players.indexOf(p));
  if(muckOn()){const sc0=p=>bestN(p.hand.concat(S.board));let best=S.riverAggr===0?sc0(S.players[0]):null;
    opp.forEach(p=>{const x=sc0(p);
      if(best&&!p.allIn&&S.players.indexOf(p)!==S.riverAggr&&cmp(x,best)<0&&Math.random()<.3){p.muckPlan=true;return}
      if(!best||cmp(x,best)>0)best=x});
    for(let k=opp.length-1;k>=0;k--)if(opp[k].muckPlan)opp.splice(k,1)}
""")
# showdown：伏せるのは、開くときに決めた人だけ（リバーで攻めた人は伏せない）
rep("  if(muckOn())cont.forEach(p=>{if(p.human||p.won>0||p.allIn||S.players.indexOf(p)===S.aggr)return;if(Math.random()<.3){p.show=false;p.mucked=true}});",
    "  if(muckOn())cont.forEach(p=>{if(p.human||p.won>0||p.allIn||S.players.indexOf(p)===S.riverAggr)return;if(p.muckPlan){p.show=false;p.mucked=true}});")
# あなたが負けたとき伏せられるのは、リバーで最後に攻めた人でないとき（selfLearn・selfFoolCheck・showdown・言葉の答え合わせ）
rep("S.aggr!==0&&!S.runout&&SETTINGS.muck","S.riverAggr!==0&&!S.runout&&SETTINGS.muck",4)
# クイズの説明
rep("why:'最後にベットした人からです。誰もベットしていなければ、ボタンの左から'},",
    "why:'リバーで最後にベット・レイズした人からです。リバーで誰も賭けていなければ、ボタンの左から'},")
en('リバーで最後にベット・レイズした人からです。リバーで誰も賭けていなければ、ボタンの左から',
   'The last player to bet or raise on the river shows first. If no one bet on the river, start left of the button.')

# ---------------------------------------------------------------- R-10. 足りないオールインが続いて合計がフルレイズ以上なら、話した人に権利が戻る（TDA 49-A）
# 話したときの額 p.actBet を覚えておき、今の額との差が最低レイズ以上になった人だけ acted を戻す
rep("      if(full)S.players.forEach(q=>{if(q!==p)q.acted=false});",
    "      if(full)S.players.forEach(q=>{if(q!==p)q.acted=false});\n"
    "      else S.players.forEach(q=>{if(q!==p&&q.acted&&q.actBet!=null&&S.currentBet-q.actBet>=S.minRaise)q.acted=false}); // R-10")
rep("  p.acted=true;\n  if(type!=='fold'&&(type==='raise'||toCall>0))Sound.sfx('chip');",
    "  p.acted=true;p.actBet=p.bet;\n  if(type!=='fold'&&(type==='raise'||toCall>0))Sound.sfx('chip');")

# ---------------------------------------------------------------- R-06. トーナメントはデッドボタン（TDA 34・36-B）
# BBは毎ハンド必ず1つ左へ。前のBBの席がSB（飛んでいればSBなし）、前のSBの席がボタン（空いた席のこともある）。
# 2人になったら、前のハンドでBBでなかった人がBB、もう1人がボタン兼SB（同じ人が2回続けてBBを払わない）
rep("  S.dealer=nextIdx(S.dealer,p=>!p.out);\n",
    "  const deadBtn=!!CFG.levels&&S.bbSeat>=0&&S.players[S.bbSeat]!=null;\n"
    "  if(!deadBtn)S.dealer=nextIdx(S.dealer,p=>!p.out);\n")
rep("  const sb=alive===2?S.dealer:nextIdx(S.dealer,live);\n  const bb=nextIdx(sb,live);\n",
    "  let sb=alive===2?S.dealer:nextIdx(S.dealer,live),bb=nextIdx(sb,live);\n"
    "  if(deadBtn){const b2=nextIdx(S.bbSeat,live);\n"
    "    if(alive===2){bb=b2;sb=nextIdx(b2,live);S.dealer=sb;S.sbSeat=sb}\n"
    "    else{const d2=S.sbSeat>=0?S.sbSeat:S.dealer,s2=S.bbSeat;\n"
    "      if(b2!==s2&&b2!==d2){bb=b2;S.sbSeat=s2;S.dealer=d2;sb=live(S.players[s2])?s2:-1}\n"
    "      else{S.dealer=nextIdx(S.dealer,live);sb=nextIdx(S.dealer,live);bb=nextIdx(sb,live);S.sbSeat=sb}}}\n"
    "  else S.sbSeat=sb;\n"
    "  S.bbSeat=bb;S.sbI=sb;S.bbI=bb;\n")
rep("  post(S.players[sb],SB());log(`${S.players[sb].name}：スモールブラインド ${SB()}`);",
    "  if(sb>=0){post(S.players[sb],SB());log(`${S.players[sb].name}：スモールブラインド ${SB()}`)}else log('SBの席は空いている。このハンドはSBなし（デッドボタン）');")
en('SBの席は空いている。このハンドはSBなし（デッドボタン）','The small blind seat is empty. No small blind this hand (dead button).')
# A3 の「リンプした人がいない」も、このハンドのSB・BBを使う
rep("  const sb=alive===2?S.dealer:nextIdx(S.dealer,live),bb=nextIdx(sb,live);\n  return S.players.every(",
    "  const sb=S.sbI!=null?S.sbI:(alive===2?S.dealer:nextIdx(S.dealer,live)),bb=S.bbI!=null?S.bbI:nextIdx(sb,live);\n  return S.players.every(")

rep('const EN_DICT={','const EN_DICT='+json.dumps(EN,ensure_ascii=False)[:-1]+',')
open(OUT,'w').write(s);print('ok',len(EN))
