import os,json,sys,re
os.chdir(os.path.dirname(os.path.abspath(__file__))+'/..')
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC).read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a);assert n==cnt,(a[:90],n);s=s.replace(a,b)
EN={};TP=[]
def en(ja,e):
    k=re.sub(r'\s+',' ',ja).strip();EN[k]=e
J=lambda x:json.dumps(x,ensure_ascii=False)
def L(who,text,meta=None):
    return "['%s',%s%s]"%(who,J(text),(','+meta) if meta else '')

# =========================================================
# ストーリーを濃くする（①〜⑤）・長編の伏線3つ・第二部 段階1
# patch25_story.py を work38 に載せ直したもの。
#   python3 ux/patch39_story.py story/work38.html story/work39.html && python3 ux/patch26_anohi.py story/work39.html story/work39b.html
# 「あの夜」の行は patch26 が「あの日」（英語 that night → that day）に直す前提で、そのまま書いている。
# =========================================================

# ---- 章の扉（題名と、看板戦までの日数） ----
for no,first in [(1,"   ['','雨の夜。港のはずれにあるバー「錨亭」。'],"),(2,"   ['','路地の奥にある、銀色に塗られた重い扉。中は静かで、客は皆じっとカードを見ている。'],"),
                 (3,"   ['','サックスの音が低く流れる、地下のジャズクラブ。'],"),(4,"   ['','ホテル最上階のラウンジ。窓の外に、街の灯りが広がっている。'],"),
                 (6,"   ['','街の中心。ガラス張りのビルの最上階に、カードルーム「王冠」はある。'],"),(7,"   ['','錨亭、閉店後。店主が看板の灯りを消した。'],")]:
    rep(first,"   {door:%d},\n"%no+first)
# 第5章の頭：部の表示を「第一部　後編」に（第二部は、これから作る「師匠」の部）
rep("   {part:'第二部',title:'あの日'},\n","   {part:'第一部　後編',title:'あの日'},\n   {door:5},\n")
en('第一部　後編','Part One: Second Half')
DAYS={1:'看板戦まで　あと十日',2:'看板戦まで　あと十日',3:'看板戦まで　あと十日',4:'看板戦まで　あと十日',5:'看板戦まで　あと七日',6:'看板戦　当日'}
en('看板戦まで　あと十日','Ten days until the sign match');en('看板戦まで　あと七日','Seven days until the sign match');en('看板戦　当日','Sign match: today')

# ---- 第1章：名前のない看板 ----
a="   ['','カウンターの奥の壁には、写真が何枚も貼ってある。一枚だけ、裏返しのままだ。'],\n"
t='写真の上に、店の名前が削られた古い看板が一枚かかっている。錨亭のものではないらしい。'
rep(a,a+"   "+L('',t)+",\n");en(t,"Above the photos hangs an old sign, its shop name scraped away. It doesn't seem to belong to the Anchor.")
a="   ['','壁に掛かっていた古い錨の札が、こちらに手渡された。店主はそのお守りの錨を手札の上に置けと言う。'],\n"
t='上の看板かい？ あれは、この店ができる前からあるんだよ。どこの店のものかは、誰も知らない'
rep(a,a+"   "+L('店主',t)+",\n");en(t,"That sign up there? It was here before this bar was. Nobody knows what shop it came from.")

# ---- 第2章 outro ----
t='そういえば、さっきもジンさんのこと聞いていった人がいたよ。錨亭で弟子をとったって本当かって。若い男の人'
a="   ['ロク','弟子よ。こいつがなぜ急に消えたか、聞いたことはあるか'],\n"
rep(a,"   "+L('ハル',t)+",\n"+a);en(t,"Oh, someone was asking about Jin a little while ago. Whether it's true he took a student at the Anchor. A young man.")
t1='この街には古い決まりがある。街の5つの店の看板をそろえた者だけが、6枚目、王冠の看板戦に挑める'
t2='……王冠の先にも、卓はある。だが、それはまだ知らんでいい'
t3='次の看板戦は十日後だ。……あの日から、ちょうど15年目になる'
rep("   ['ロク','この街には古い決まりがある。店の看板を5枚そろえた者だけが、王冠の看板戦に挑める'],\n",
    "   "+L('ロク',t1)+",\n   "+L('ロク',t2)+",\n   "+L('ロク',t3)+",\n")
en(t1,"This town has an old rule. Only one who holds the signs of the town's five houses may challenge for the sixth: the Crown's sign.")
en(t2,"...There are tables beyond the Crown. But you don't need to know that yet.")
en(t3,"The next sign match is in ten days. ...Exactly fifteen years since that day.")
a="   ['','そう答えるジンの指の背は、顎の傷をなでていた。',{mark:'「ない」と言いながら、傷に触れていた。本当は、まだ迷っていた'}],\n"
t='……あの夜、あいつは降りなかった。降りろと言えなかったのは、俺だ'
rep(a,a+"   "+L('ロク',t)+",\n");en(t,"...That night, he didn't fold. And I'm the one who couldn't tell him to.")
rep("   {preview:3},\n","   ...ilLines(2),\n   {preview:3},\n")

# ---- 第3章 ----
a="   ['ミナ','セキさん、また降りる気でしょ。わたしは、この曲が終わるまでに勝つね'],\n"
t='さっきまで、隅の席で一曲だけ聴いていった人がいたの。ジンさんの弟子は、もう来たかって'
rep(a,a+"   "+L('ミナ',t)+",\n");en(t,"Someone sat in the corner for just one song a little while ago. Asked whether Jin's student had come yet.")
a="   ['','ジンの指の背が、顎の傷をなでた。',{mark:'あの日の話になると、傷に触れる。ハヤトのことを考えているときのクセだった'}],\n"
t1='私は降りすぎた。ジン君は降りなさすぎた。……どちらも、負けだったね'
t2='昔ね、海の向こうから来たお客さんがいたの。誰とも話さないで、セキさんにだけ勝って帰ったんだって'
rep(a,a+"   "+L('セキ',t1)+",\n   "+L('ミナ',t2)+",\n")
en(t1,"I folded too much. Jin folded too little. ...We both lost, didn't we.")
en(t2,"Long ago a guest came from across the sea. He never said a word to anyone, beat only Seki, and left.")
rep("   {preview:4},\n","   ...ilLines(3),\n   {preview:4},\n")

# ---- 第4章 outro ----
a="   ['レイカ','ジンさんにもクセがあった。誰も知らないはずのね'],\n"
t1='ジンさんは、あの夜に勝っていたら、この街にはいなかった人よ'
t2='降りる人の指は、迷わないの'
rep(a,a+"   "+L('レイカ',t1)+",\n   "+L('レイカ',t2)+",\n")
en(t1,"If Jin had won that night, he wouldn't be in this town now.");en(t2,"The fingers of someone who folds don't hesitate.")
a="   ['レイカ','次は地下よ。あそこには、ジンさんの昔のお弟子さんがいる'],\n"
t='あの……さっき地下の人から連絡があって、あなたが何枚目か、聞かれました'
rep(a,a+"   "+L('ソウ',t)+",\n");en(t,"Um... someone from the underground called just now. They asked how many signs you have.")
rep("   {preview:5},\n","   ...ilLines(4),\n   {preview:5},\n")

# ---- 第5章 outro ----
a="   ['','ジンの指が、顎の傷に触れた。20年前、裏の賭場で少年のハヤトをかばったときの傷だ。'],\n"
t='降りたのは、俺のほうだ。師匠から'
rep(a,a+"   "+L('ハヤト',t)+",\n");en(t,"I'm the one who folded. I folded on my master.")
a="   ['ハヤト','一つだけ教えておく。クロウのクセは、全部わざとだ。信じるな'],\n"
t='クロウが欲しいのは看板じゃない。看板の先だ'
rep(a,a+"   "+L('ハヤト',t)+",\n");en(t,"Crow doesn't want the signs. He wants what's past them.")

# ---- 第6章 intro ----
a="   ['','5枚の看板を見せると、黒服の男が静かに扉を開けた。'],\n"
t='15年前と同じ日。同じビルの、同じ卓。'
rep(a,"   "+L('',t)+",\n"+a);en(t,"The same day as fifteen years ago. The same building, the same table.")
a="   ['','観客席に、ロクの姿があった。ジンの隣に、何も言わずに座る。'],\n"
t1='その隣に、ゲンとセキ、レイカ。いちばん後ろの壁際に、ハヤトが立っていた。'
t2='新入りの晴れ舞台だ。見逃せねえよ'
rep(a,a+"   "+L('',t1)+",\n   "+L('ゲン',t2)+",\n")
en(t1,"Beside him, Gen, Seki, and Reika. Against the back wall stood Hayato.");en(t2,"The rookie's big stage. Wouldn't miss it.")
# ---- 第6章 outro ----
a="   ['クロウ','ジンは15年前、あのブラフを降りていれば勝っていた。それでも降りなかった。あれが彼の打ち方です'],\n"
t1='看板をすべて持つ者だけが、外海の卓に呼ばれます。ジンは、そこへ行くはずでした'
t2='私は、勝ちから降りられませんでした'
rep(a,a+"   "+L('クロウ',t1)+",\n   "+L('クロウ',t2)+",\n")
en(t1,"Only one who holds every sign is called to the Open Sea Table. Jin was meant to go there.");en(t2,"I couldn't fold out of winning.")
a="   ['クロウ','ようやく、負けることができました'],\n"
t='看板を持つ者は、挑まれたら断れません。15年前のジンのように'
rep(a,a+"   "+L('クロウ',t)+",\n");en(t,"One who holds a sign can't refuse a challenge. Just like Jin, fifteen years ago.")
a="   ['','ビルを出ると、ジンが壁にもたれて待っていた。'],\n"
t1='……ジン。お前の打ち方だ';t2='壁際にいたハヤトは、何も言わずに先に出ていった。'
rep(a,"   "+L('ロク',t1)+",\n   "+L('',t2)+",\n"+a)
en(t1,"...Jin. That's your way of playing.");en(t2,"Hayato, by the wall, left first without a word.")
rep("   {preview:7},\n","   ...ilLines(6),\n   {preview:7},\n")

# ---- 第7章 intro：誘いの答えで、ジンの一言が変わる（記録がなければ出ない） ----
a="   ['ジン','15年ぶりだ。……卒業試験をやる'],\n"
t1='クロウに誘われたそうだな。……断ったか';t2='クロウに誘われたそうだな。黙っていたか。……それでいい'
rep(a,"   "+L('ジン',t1,"{tempt:'refuse'}")+",\n   "+L('ジン',t2,"{tempt:'silent'}")+",\n"+a)
en(t1,"I hear Crow made you an offer. ...You turned him down?");en(t2,"I hear Crow made you an offer. You kept quiet? ...Good.")
# ---- 第7章 outro：窓の外の顔、完のあとの招待状 ----
a="   {epilogue:true},\n   ['','そのとき、錨亭の扉が開いた。'],\n"
t='窓の外に、見覚えのある顔がいくつも並んでいた。誰も、中には入ってこなかった。'
rep(a,"   {epilogue:true},\n   "+L('',t)+",\n   ['','そのとき、錨亭の扉が開いた。'],\n");en(t,"Outside the window, a row of familiar faces. None of them came in.")
INV=[('','翌朝。錨亭のカウンターに、封筒が一通届いていた。宛名は、王冠の看板の主。',"The next morning, an envelope sat on the Anchor's counter, addressed to the holder of the Crown's sign."),
     ('','封には、波の紋が押されている。',"It was sealed with a wave crest."),
     ('ジン','……あの人も、この封を受け取った',"...He got this same envelope, once."),
     ('','ジンはそれ以上何も言わず、封筒をこちらの手に置いた。',"Jin said nothing more, and placed it in your hand.")]
rep("   ['','LAST TELL　―完―']]),","   ['','LAST TELL　―完―'],\n"+",\n".join("   "+L(w,j) for w,j,_ in INV)+"]),")
for w,j,e in INV:en(j,e)
# ---- 後日談の最後：タロウ（第二部への橋） ----
a="  'クロウは、王冠の看板を一枚、自分の手で下ろした。',\n"
t='最近、錨亭に新しい客が来る。『もうワンハンドだけ』が口ぐせの、心配性の男だ。'
rep(a,a+"  "+J(t)+",\n");en(t,"Lately a new customer comes to the Anchor: a worrier whose favorite words are “just one more hand.”")
# ---- 第5章の店の後日談（第7章クリア後） ----
a="     {need:7,lines:[['ハヤト','錨亭の席、まだ空いてるか。"
t='クロウに誘われただろ。……俺は、断れなかった'
rep(a,"     {need:7,lines:[['ハヤト',%s],['ハヤト','錨亭の席、まだ空いてるか。"%J(t));en(t,"Crow made you an offer, didn't he. ...I couldn't say no.")

# ---- 幕間のデータ（CHAPTERS より前に置く） ----
INTERLUDE={
 2:('銀の扉、閉店後',"The Silver Door, after closing",[
   ('','最後の客が帰った。ロクは灯りを半分だけ落とし、古い電話の受話器を取った。',None,"The last guest left. Roku dimmed half the lights and picked up the receiver of an old phone."),
   ('ロク','……俺だ。ジンが、弟子を連れてきた',None,"...It's me. Jin brought a student."),
   ('セキ','……そうか。十五年かかったね','電話',"...I see. It took fifteen years."),
   ('ロク','次はお前の店だ',None,"Your place is next."),
   ('セキ','わかった。紳士的に迎えよう','電話',"Understood. I'll welcome them like a gentleman."),
   ('','ロクは受話器を置いて、空になった倉庫の鍵の場所を、しばらく見ていた。',None,"Roku put down the receiver and stared for a while at the spot where the key to the empty warehouse used to hang.")]),
 3:('地下の賭場跡',None,[
   ('','古い倉庫の地下。客のいない卓で、若い男が一人でカードを配っている。',None,"Beneath an old warehouse. At an empty table, a young man deals cards to no one."),
   ('テツ','ハヤト、聞いたか。錨亭のジンさんが弟子を取ったってよ',None,"Hayato, you hear? Jin from the Anchor took a student."),
   ('ハヤト','……知ってる。今夜、もう三軒目だ',None,"...I know. That's the third house tonight."),
   ('','ハヤトは配った2枚を見ないまま、表に返した。エースが2枚。そして、黙って捨てた。',None,"Without looking, Hayato flipped the two cards he'd dealt. Two aces. He threw them away without a word."),
   ('ハヤト','三日後に来る。あの人なら、そうする',None,"They'll come in three days. That's what he'd do.")]),
 4:('王冠、最上階',"The Crown, top floor",[
   ('','ガラス張りの部屋。クロウが白い手袋の指先を直している。',None,"A glass-walled room. Crow is adjusting the fingertips of his white gloves."),
   ('クロダ','天空から知らせです。ジンの弟子が、4枚目を取りました',None,"Word from the Skyline. Jin's student took the fourth sign."),
   ('クロウ','錨亭、銀の扉、月影、天空。……15年前と、同じ順番ですね',None,"The Anchor, the Silver Door, Moonshade, the Skyline. ...The same order as fifteen years ago."),
   ('クロダ','次は地下です。ハヤトが待っています',None,"The underground is next. Hayato is waiting."),
   ('クロウ','そうですか。……拝見しましょう',None,"I see. ...Let us see.")]),
 6:('錨亭の前',"Outside the Anchor",[
   ('','雨が上がった港。錨亭の看板には、まだ灯りがついている。',None,"The rain has stopped over the harbor. The Anchor's sign is still lit."),
   ('','王冠を先に出た若い男が、店の前に立っていた。ハヤトだ。',None,"A young man who left the Crown early stands in front of the bar. It's Hayato."),
   ('','扉に手をかけて、離した。もう一度かけて、また離した。',None,"He puts his hand on the door, then lets go. Again, and lets go again."),
   ('ハヤト','……まだ、だな',None,"...Not yet."),
   ('','ハヤトは来た道を戻っていった。ポケットの中で、何かを握りしめたまま。',None,"Hayato walks back the way he came, gripping something in his pocket.")]),
}
il_js="const INTERLUDE={\n"+"".join("  %d:{place:%s,lines:[\n%s]},\n"%(n,J(p),",\n".join("    "+L(w,j,("{voice:'%s'}"%v) if v else None) for w,j,v,_ in ls)) for n,(p,pe,ls) in INTERLUDE.items())+"};\n"
for n,(p,pe,ls) in INTERLUDE.items():
    if pe:en(p,pe)
    for w,j,v,e in ls:en(j,e)
en('そのころ','Meanwhile');en('（電話）','(phone)')
il_js+="""const ilLines=n=>INTERLUDE[n].lines.map(l=>[l[0],l[1],Object.assign({},l[2]||{},{il:n})]);
// 章の扉：題名と、看板戦までの日数（第7章は出さない）
const DOOR_DAYS=%s;
"""%J({str(k):v for k,v in DAYS.items()})
rep("   ========================================================= */\nconst CHAPTERS=[","   ========================================================= */\n// 幕間「そのころ」：主人公がいない場所の場面（章のあと、次回予告の前）\n"+il_js+"const CHAPTERS=[")

# ---- 同じ誘い・観客席の一言・打ち方の記録 ----
TEMPT_INTRO=[('','ブラインドが上がる前の短い休憩。クロウが、あなたの席の横に立った。',"A short break before the blinds go up. Crow comes to stand beside your seat."),
  ('クロウ','いい打ち方です。……王冠の卓に、座ってみませんか',"You play well. ...Would you like a seat at the Crown's table?"),
  ('','15年前、ハヤトが聞いたのと同じ言葉だった。',"The same words Hayato heard fifteen years ago."),
  ('クロウ','それから、もう一つ。ジンのクセを、教えてさしあげましょうか。15年前から、私は知っています',"And one more thing. Shall I tell you Jin's tell? I've known it for fifteen years."),
  ('クロウ','卒業試験があるのでしょう。答えを知っていれば、楽になりますよ',"You have a final exam, don't you? Knowing the answer would make it easy.")]
TEMPT_CH=[('refuse','断る','Refuse',[('クロウ','……そうですか。今夜は、断られてばかりです',"...I see. I keep getting turned down tonight."),('クロウ','15年前、同じ卓で、断れなかった若者がいました',"Fifteen years ago, at this same table, there was a young man who couldn't say no.")]),
  ('silent','黙っている','Stay silent',[('','あなたは何も言わず、チップをそろえた。',"You say nothing and straighten your chips."),('クロウ','答えないのも、答えです。……ジンに似てきましたね',"Silence is an answer too. ...You're starting to resemble Jin.")])]
ASK='クロウの誘いに、どう答える？';en(ASK,"How do you answer Crow's offer?")
for w,j,e in TEMPT_INTRO:en(j,e)
for i,l,le,ls in TEMPT_CH:
    en(l,le)
    for w,j,e in ls:en(j,e)
AUD=[('gen','ゲン','よし！……いや、俺は何もしてねえけどな',"Yes! ...Not that I did anything."),('seki','セキ','ここからだよ。降りられるかね、君は',"This is where it starts. Can you fold, I wonder?"),('reika','レイカ','指を見なさい。顔じゃなくて',"Watch the fingers. Not the face.")]
for k,w,j,e in AUD:en(j,e)
en('観客席','AUDIENCE')
tempt_js="const TEMPT={ask:%s,intro:[%s],\n  choices:[%s]};\n"%(J(ASK),",".join(L(w,j) for w,j,_ in TEMPT_INTRO),",".join("{id:'%s',label:%s,lines:[%s]}"%(i,J(l),",".join(L(w,j) for w,j,_ in ls)) for i,l,_,ls in TEMPT_CH))
aud_js="const AUD={%s};\n"%",".join("%s:[%s,%s]"%(k,J(w),J(j)) for k,w,j,_ in AUD)
NB_H='そのころ';NB_P='章のあとで見た幕間を、もう一度見られます。';en(NB_P,"Watch the interludes you've seen after each chapter again.")
TP.append(["第{0}章のあと","After Ch.{0}"])
JS=r"""// ===== 案3：同じ誘い（第6章、ブラインドが2回目に上がる前の休憩。チップや相手の打ち方は変えない） =====
"""+tempt_js+r"""function temptPick(id){if(!SC)return;const c=TEMPT.choices.find(x=>x.id===id)||TEMPT.choices[1];const t=loadStory();t.tempt=c.id;saveStory(t);
  if(S)S.temptPicked=c.id;SC.picked=c.id;const i=SC.i;SC.lines=SC.lines.slice(0,i+1).concat(c.lines,SC.lines.slice(i+1));SC.i++;renderLine()}
// 第7章の頭：誘いの答えと違う行は飛ばす（記録がなければ、どちらも出ない）
const lineOff=l=>Array.isArray(l)&&l[2]&&l[2].tempt&&l[2].tempt!==loadStory().tempt;
function ilSeen(n){const t=loadStory();if(!t.il[n]){t.il[n]=1;saveStory(t)}}
function ilNote(){const t=loadStory(),ks=Object.keys(INTERLUDE).filter(n=>t.il[n]);if(!ks.length)return'';
  return`<article class="rcard ilnote"><h4>そのころ</h4><p class="exnote">章のあとで見た幕間を、もう一度見られます。</p><div class="ilbtns">${ks.map(n=>`<button class="mini" data-il="${n}"><span>第${n}章のあと</span><span>${esc(INTERLUDE[n].place)}</span></button>`).join('')}</div></article>`}
{const _sh=startHand;startHand=function(){
  if(typeof CFG!=='undefined'&&CFG&&CFG.ch&&CFG.ch.no===6&&!CFG.ura&&!CFG.run&&!CFG.flashback&&CFG.levels&&CFG.levelHands&&S&&S.players&&!S.tempted&&!S.result&&S.handNo===CFG.levelHands*2&&S.players[0].chips>0){
    S.tempted=true;const s0=S,ch=CFG.ch;nextvClear();
    return playScene(ch,TEMPT.intro.concat([{choice:'tempt'}]),()=>{
      if(!s0.temptPicked){const t=loadStory();t.tempt='silent';saveStory(t)}
      if(S!==s0)return;show('game');Sound.bgm(CFG.bgm||0);if(S.handOver&&!S.result)startHand()})}
  return _sh.apply(this,arguments)}}
// ===== 案5：観客席の一言（第6章だけ。隣の卓の声と同じ出し方で、ハンドは止めない。各1回） =====
"""+aud_js+r"""function audTick(){
  if(!S||!S.players||typeof CFG==='undefined'||!CFG||!CFG.ch||CFG.ch.no!==6||CFG.ura||CFG.run||CFG.flashback||S.result)return;
  const me=S.players[0];if(!me||me.chips<=0)return;
  const A=S.aud=S.aud||{q:[],done:{}},push=k=>{if(!A.done[k]){A.done[k]=1;A.q.push(k)}};
  if(S.players.some(p=>!p.human&&p.chips<=0))push('gen');
  const live=S.players.filter(p=>p.chips>0),hu=live.length===2&&live.some(p=>p.name==='クロウ');
  if(hu)push('seki');
  const dealt=S.players.filter(p=>p.hand&&p.hand.length===2),tot=S.players.reduce((a,p)=>a+p.chips,0),pot=S.players.reduce((a,p)=>a+(p.total||0),0);
  if(hu&&dealt.length===2&&pot*3>tot)push('reika');
  if(!A.q.length)return;
  S.nvNext=Math.max(S.nvNext==null?0:S.nvNext,S.handNo+3);
  const s0=S,h0=S.handNo;let n=0;
  const go=()=>{if(S!==s0)return;if(S.handNo!==h0||!S.handOver||S.result)return;
    if(nvBlocked()){if(++n<5)setTimeout(go,700*SPEED());return}
    const k=A.q.shift();if(!k)return;const [w,t]=AUD[k];
    audTick.on=1;try{nextvShow('cheer',`${w}「${t}」`)}finally{audTick.on=0}};
  setTimeout(go,1200*SPEED())}
{const _nt=nextvTick;nextvTick=function(){try{audTick()}catch(e){}return _nt.apply(this,arguments)}}
// 見出し：観客席の一言のときだけ「観客席」、ほかの声はいつもの NEXT TABLE（あとから出た隣の卓の声に見出しが残らないように）
{const _nv=nextvShow;nextvShow=function(){const sp=$('nextv')&&$('nextv').querySelector('span');if(sp)sp.textContent=audTick.on?'観客席':'NEXT TABLE';return _nv.apply(this,arguments)}}
// ===== 第二部の準備：第一部の打ち方の記録（画面には出さない。ストーリーの勝負だけ数える） =====
const STYLE_KEY='shisho-style';
function loadStyle(){const z={hands:0,vpip:0,pfr:0,folds:0,foldFacingBet:0,bluffs:0,readBy:{size:0,time:0,body:0}};
  try{const o=JSON.parse(localStorage.getItem(STYLE_KEY));if(!o||typeof o!=='object')return z;
    ['hands','vpip','pfr','folds','foldFacingBet','bluffs'].forEach(k=>{z[k]=Math.max(0,+o[k]||0)});
    const r=o.readBy&&typeof o.readBy==='object'?o.readBy:{};['size','time','body'].forEach(k=>{z.readBy[k]=Math.max(0,+r[k]||0)});return z}catch(e){return z}}
function saveStyle(o){try{localStorage.setItem(STYLE_KEY,JSON.stringify({v:1,...o}))}catch(e){}}
const styleOn=()=>typeof CFG!=='undefined'&&!!CFG&&!!CFG.ch&&!CFG.ura&&!CFG.run&&!CFG.flashback&&!CFG.store&&!!S&&!S.scriptAI&&!S.autoMe&&CFG.ch.no>=1&&CFG.ch.no<=7;
{const _act=act;act=function(i,type,to){
  try{if(S&&!S.handOver&&i===0&&i===S.toAct&&S.players[0].human&&styleOn()){const p=S.players[0],tc=S.currentBet-p.bet;
    const H=S.styH=S.styH&&S.styH.hand===S.handNo?S.styH:{hand:S.handNo},t=type==='raise'&&p.acted?'call':type;
    if(S.street==='preflop'){if(t==='raise'){H.vp=1;H.pr=1}else if(t==='call'&&tc>0)H.vp=1}
    if(t==='raise')H.rz=1;if(t==='fold'){H.fd=1;if(tc>0)H.ffb=1}}}catch(e){}
  return _act.apply(this,arguments)}}
{const _eh=endHand;endHand=function(){const r=_eh.apply(this,arguments);
  try{const me=S&&S.players&&S.players[0];if(me&&me.human&&styleOn()&&me.hand&&me.hand.length===2&&S.styDone!==S.handNo){S.styDone=S.handNo;
    const H=S.styH&&S.styH.hand===S.handNo?S.styH:{},o=loadStyle();o.hands++;if(H.vp)o.vpip++;if(H.pr)o.pfr++;if(H.fd)o.folds++;if(H.ffb)o.foldFacingBet++;
    if(H.rz&&!me.folded){const cs=me.hand.concat(S.board||[]);if((cs.length>=5?bestN(cs)[0]:groupCat(cs))<1)o.bluffs++}
    saveStyle(o)}}catch(e){}
  return r}}
{const _rs=readSeq;readSeq=function(i,rd){try{const k=rd&&{size:'size',fast:'time',slow:'time',body:'body'}[rd.why];if(k&&styleOn()){const o=loadStyle();o.readBy[k]++;saveStyle(o)}}catch(e){}return _rs.apply(this,arguments)}}
window.__style=()=>{const o=loadStyle(),hit={};try{const b=loadRead().byName;Object.keys(b).forEach(k=>{if(+b[k].h)hit[k]=+b[k].h})}catch(e){}return{...o,readHitBy:hit}};
"""
rep("// 後日談（第7章クリア後、錨亭の壁の前で）\nconst EPILOGUE=[",JS+"// 後日談（第7章クリア後、錨亭の壁の前で）\nconst EPILOGUE=[")

# ---- 保存：見た幕間 il と、誘いの答え tempt ----
rep("return{loses:o(t.loses),brk:o(t.brk),ep:o(t.ep),mieta:+t.mieta||0,alt:!!t.alt}}catch(e){return{loses:{},brk:{},ep:{},mieta:0,alt:false}}}",
    "return{loses:o(t.loses),brk:o(t.brk),ep:o(t.ep),mieta:+t.mieta||0,alt:!!t.alt,il:o(t.il),tempt:t.tempt==='refuse'||t.tempt==='silent'?t.tempt:undefined}}catch(e){return{loses:{},brk:{},ep:{},mieta:0,alt:false,il:{}}}}")

# ---- 会話の表示：扉・選択肢・幕間・電話の声 ----
rep("  document.documentElement.style.setProperty('--venue',ch.color);\n  $('venue').innerHTML=`<span class=\"vchip\">第${ch.no}章　${esc(ch.title)}</span><span class=\"vn\">${esc(ch.venue)}</span>`;\n  show('scene');renderLine();",
    "  document.documentElement.style.setProperty('--venue',ch.color);\n  SC.vh=`<span class=\"vchip\">第${ch.no}章　${esc(ch.title)}</span><span class=\"vn\">${esc(ch.venue)}</span>`;$('venue').innerHTML=SC.vh;\n  show('scene');renderLine();")
rep("function renderLine(){\n  const l=SC.lines[SC.i];\n",
    "function renderLine(){\n  const l=SC.lines[SC.i];\n"
    "  {const il=Array.isArray(l)&&l[2]&&l[2].il;$('scene').classList.toggle('il',!!il);\n"
    "   if(il&&INTERLUDE[il]){if(SC.ilOn!==il){SC.ilOn=il;$('venue').innerHTML=`<span class=\"vchip\">そのころ</span><span class=\"vn\">${esc(INTERLUDE[il].place)}</span>`}ilSeen(il)}\n"
    "   else if(SC.ilOn){SC.ilOn=0;if(SC.vh)$('venue').innerHTML=SC.vh}}\n")
rep("  else if(l&&l.epilogue){setStage(null);",
    "  else if(l&&l.door){setStage(null);$('stage').className='stage part';const c=CHAPTERS[l.door-1],dd=DOOR_DAYS[l.door];\n"
    "    $('box').innerHTML=`<div class=\"partcard door\"><span>第${l.door}章</span><b>${esc(c.title)}</b>${dd?`<em>${esc(dd)}</em>`:''}</div>`}\n"
    "  else if(l&&l.choice){$('box').innerHTML=`<div class=\"line narr\">${esc(TEMPT.ask)}</div><div class=\"tchoice\">${TEMPT.choices.map(c=>`<button class=\"ghost\" data-tc=\"${c.id}\">${esc(c.label)}</button>`).join('')}</div>`;\n"
    "    $('box').querySelectorAll('[data-tc]').forEach(b=>b.onclick=e=>{e.stopPropagation();temptPick(b.dataset.tc)})}\n"
    "  else if(l&&l.epilogue){setStage(null);")
rep("    if(who&&who!==prev)setStage(who);","    if(who&&who!==prev&&!(l[2]&&l[2].voice))setStage(who);")
rep("<span class=\"nametag${cute?' cute':''}\">${esc(who)}${CHARS[who]?","<span class=\"nametag${cute?' cute':''}\">${esc(who)}${l[2]&&l[2].voice?`<small class=\"voice\">（${esc(l[2].voice)}）</small>`:''}${CHARS[who]&&!(l[2]&&l[2].voice)?")
rep("function advance(){if(!SC)return;SC.i++;if(SC.i>=SC.lines.length){const d=SC.done;SC=null;d();return}",
    "function advance(){if(!SC)return;{const c=SC.lines[SC.i];if(c&&c.choice&&!SC.picked){temptPick('silent');return}}SC.i++;while(SC.i<SC.lines.length&&lineOff(SC.lines[SC.i]))SC.i++;if(SC.i>=SC.lines.length){const d=SC.done;SC=null;d();return}")
rep("  $('btnAdv').textContent=SC.i===SC.lines.length-1?'進む':'次へ';",
    "  $('btnAdv').textContent=SC.i===SC.lines.length-1?'進む':'次へ';$('btnAdv').hidden=!!(l&&l.choice&&!SC.picked);$('scene').classList.toggle('epil',!!(l&&l.epilogue));")
rep("$('box').onclick=advance;","$('box').onclick=e=>{if(e.target.closest&&e.target.closest('[data-tc]'))return;const c=SC&&SC.lines[SC.i];if(c&&c.choice&&!SC.picked)return;advance()};")
rep("$('box').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){","$('box').onkeydown=e=>{if(e.target!==e.currentTarget)return;if(e.key==='Enter'||e.key===' '){")
# ジンのノート：相関図の下に「そのころ」を見返す欄。ジンの言葉には、誘いの分かれ道の行を入れない
rep("少しずつ書き込まれます。</p>`;","少しずつ書き込まれます。</p>`+ilNote();")
rep("$('noteTabs').querySelectorAll('[data-nt]').forEach(b=>b.onclick=()=>showNotebook(b.dataset.nt));",
    "$('noteTabs').querySelectorAll('[data-nt]').forEach(b=>b.onclick=()=>showNotebook(b.dataset.nt));\n  $('noteBody').querySelectorAll('[data-il]').forEach(b=>b.onclick=()=>{const n=+b.dataset.il;playScene(CHAPTERS[n-1],ilLines(n),()=>showNotebook('map'))});")
rep("filter(l=>Array.isArray(l)&&l[0]==='ジン'&&l[1].length>=6)","filter(l=>Array.isArray(l)&&l[0]==='ジン'&&l[1].length>=6&&!(l[2]&&l[2].tempt))")
# ---- 見た目 ----
rep(".epi{margin:6px 0 0;padding-left:1.1em;line-height:1.8}",".epi{margin:6px 0 0;padding-left:1.1em;line-height:1.8}\n"
 ".partcard.door span{letter-spacing:.3em}\n"
 ".partcard.door b{font-size:clamp(1.15rem,5.6vw,1.9rem);letter-spacing:.08em;text-align:center;text-wrap:balance;word-break:auto-phrase;max-width:100%;line-height:1.35}\n"
 ".partcard.door em{font-style:normal;font-variant-numeric:tabular-nums;color:var(--gold);letter-spacing:.2em;font-size:.88rem;font-weight:700;border-top:1px solid var(--line);padding-top:6px;margin-top:2px;text-align:center}\n"
 "body.en .partcard.door em,body.en .partcard.door span{letter-spacing:.08em}\n"
 "#scene.il{background:linear-gradient(180deg,#2a3440,#12161c 80%)}\n"
 "#scene.il .stage{filter:saturate(.6) brightness(.92)}\n"
 "#scene.il .stage.cool::before{background:linear-gradient(110deg,transparent 30%,#4d5d70 30% 46%,transparent 46%)}\n"
 "#scene.epil .stage{height:clamp(0px,6vh,48px)}\n"
 "@media (max-height:500px){#scene.epil .stage{height:0}#scene.epil .epi{columns:2;column-gap:28px;line-height:1.6}#scene.epil .epi li{break-inside:avoid;margin-bottom:4px}}\n"
 "#scene.il .box{background:rgba(24,30,38,.95)}\n"
 "#scene.il .nametag,#scene.il .nametag.cute{background:#8fa3b8;color:#10151b}\n"
 "#scene.il .venue .vchip{background:#56687c}\n"
 "#scene.il .venue{z-index:4;text-shadow:0 1px 4px #000,0 0 10px #000}\n"
 "#scene.il .line.narr{color:#b9c4cf}\n"
 ".nametag .voice{font-size:.72rem;font-weight:700;margin-left:-6px}\n"
 ".tchoice{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px}\n"
 ".tchoice button{min-height:44px;min-width:7.5em;padding:8px 16px;font-weight:800}\n"
 ".ilbtns{display:flex;flex-wrap:wrap;gap:8px}\n"
 ".ilbtns button{display:grid;gap:2px;text-align:left;min-height:44px;padding:6px 12px}\n"
 ".ilbtns button span:last-child{font-size:.75rem;color:var(--muted)}")

# ---- 保存先の一覧（patch30）：打ち方の記録のキーも引き継ぎ・削除の対象にする ----
rep("'shisho-talk'];\nconst SAVE_VER=1;","'shisho-talk','shisho-style'];\nconst SAVE_VER=1;")

rep('const EN_DICT={','const EN_DICT='+json.dumps(EN,ensure_ascii=False)[:-1]+',')
rep('const EN_TPL=[','const EN_TPL='+json.dumps(TP,ensure_ascii=False)[:-1]+',')
open(OUT,'w').write(s);print('ok',len(EN))
