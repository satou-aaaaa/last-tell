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
    if '〈呼〉' in k:TP.append([k.replace('〈呼〉','{0}'),e.replace('〈呼〉','{0}')])
    else:EN[k]=e
J=lambda x:json.dumps(x,ensure_ascii=False)
def tp(x):TP.append([re.sub(r'\s+',' ',x[0]).strip(),x[1]])

# =========================================================
# 第二部「師匠」本体（research/第二部_師匠になった主人公_実装仕様.md 段階2）
#   python3 ux/patch44_part2.py story/work43.html story/work44.html
# - 第二部の章は no:11〜15（第一部の章番号で分かれる処理に当たらないように）、p2:1〜5 が表示の番号
# - 進み具合は shisho-part2 {v:1,cleared,mentor,tell,fav,rush}（shisho-progress には触らない）
# - プレイヤーはタロウ。師匠＝第一部の主人公。顔は第5章の最後のハンドの直前まで影だけ
# =========================================================

def ln(who,ja,e,meta=None):
    en(ja,e);return "[%s,%s%s]"%(J(who),J(ja),(','+meta) if meta else '')
def lesson(t,te,b,be):
    en(t,te);en(b,be);return "{lesson:%s,body:%s}"%(J(t),J(b))
MT=lambda t:"{mt:'%s'}"%t
def arr(items):return "[\n   "+",\n   ".join(items)+"]"

# ---------------------------------------------------------------- 第1章 三代目
C1_IN=[
 "{part:'第二部',title:'師匠'}","{p2door:1}",
 ln('','王冠の看板戦から、半年。','Half a year since the sign match at the Crown.'),
 ln('','波の紋の封筒は、カウンターの引き出しにしまってある。書かれた日付まで、あと少しだ。',"The wave-crested envelope is tucked in a drawer behind the counter. The date written inside is not far off now."),
 ln('','雨の錨亭。奥の卓で、見覚えのある男が負けている。',"Rain over the Anchor. At the back table, a familiar man is losing."),
 ln('タロウ','……もうワンハンドだけ','...Just one more hand.'),
 ln('ミサキ','それ、さっきも言ってたよ','You said that a minute ago.'),
 ln('ケンジ','タロウ、今日もう何回目だよ',"Taro, how many times is that today?"),
 ln('ゲン','がっはっは！ 配られた札は全部勝負、それがポーカーってもんよ！',"Gahaha! Play every card you're dealt. That's poker!"),
 ln('','カウンターの奥で、ジンが一人で水を飲んでいる。何も言わない。',"Behind the counter, Jin sips water alone. He says nothing."),
 ln('','壁の写真は二枚。若い頃のジンと、王冠の看板を持った弟子。',"Two photos on the wall: young Jin, and his student holding the Crown's sign."),
 ln('','タロウのチップが、またゲンの前へ流れていった。',"Taro's chips slide over to Gen again."),
 ln('','隣の椅子が引かれた。座ったのは、その写真の弟子だった。ジンの弟子。二代目。',"The chair beside him scrapes back. The one who sits down is the student from the photo. Jin's student. The Second."),
 ln('タロウ','え……あの、王冠の……',"Huh... you're the one from the Crown..."),
 ln('師匠','その手は、降りる手だ',"That hand is a fold.",MT('guard')),
 ln('師匠','降りるのも勝負のうちだ。……俺も、そう教わった',"Folding is part of the game. ...That's what I was taught.",MT('guard')),
 ln('師匠','待ってるだけじゃ、ゲンには勝てない',"Just waiting won't beat Gen.",MT('attack')),
 ln('師匠','先に打ったほうが、話を決める。強い手なら、こっちから上げろ',"Whoever bets first decides the story. With a strong hand, raise first.",MT('attack')),
 ln('師匠','カードばかり見てるな',"You're only looking at your cards.",MT('read')),
 ln('師匠','手を見るな、顔を見ろ。ゲンは、いい手が来るとすぐニヤける',"Don't watch the cards, watch the face. Gen grins the moment he gets a good hand.",MT('read')),
 ln('タロウ','……教えてくれるんですか',"...You'll teach me?"),
 ln('師匠','ゲンのチップを全部取れたら、続きを教える',"Take all of Gen's chips, and I'll teach you the rest."),
 "{mentor:true}","{fav:true}",
 ln('','奥の席で、ジンがグラスを置いた。','In the back, Jin sets down his glass.'),
 ln('ジン','……教えるのは、打つより難しいぞ',"...Teaching is harder than playing."),
 lesson('三代目','The Third',
   '第二部では、タロウを操作します。隣に座る師匠は、第一部のあなたです。第一部の打ち方の記録から、師匠の教え方が決まりました。勝負のあいだ、師匠がときどき声をかけます。',
   "In Part Two you play as Taro. The mentor beside him is you from Part One. Your play record from Part One decided how the mentor teaches. During the game, the mentor will speak up now and then."),
 ln('ゲン','おう、今度は二人がかりか？ 来い来い！',"Oh, two of you now? Bring it on!"),
]
C1_OUT=[
 ln('ゲン','参った！ タロウ、お前、急に降りるようになりやがったな',"I give! Taro, you suddenly learned how to fold."),
 ln('タロウ','もうワンハンドだけ、って言いかけたら、隣でにらまれるんで',"Every time I start to say “one more hand,” someone glares at me."),
 ln('ミサキ','あはは、ジンさんと同じことしてる',"Haha, that's exactly what Jin used to do."),
 ln('','ジンは何も言わずに、グラスの水を一口飲んだ。口の端が、少しだけ上がっていた。',"Jin takes a sip of water without a word. The corner of his mouth lifts, just a little."),
 ln('店主','三代目だね。写真の場所、空けておくよ',"So he's the Third. I'll save a spot on the wall for his photo."),
 ln('師匠','まだ早い',"Too soon."),
 ln('店主','ジンさんも、昔そう言ったよ',"Jin said the same thing, back then."),
 ln('ジン','……隣の港、汐見に「舫」という古い店がある。行ってこい',"...In the next port over, Shiomi, there's an old place called the Moorings. Go."),
 ln('','帰り道。「もうワンハンドだけ」と言いかけたタロウが、自分で口を閉じた。',"On the way home, Taro starts to say “one more hand,” and closes his mouth on his own."),
 ln('師匠','今のが最後だ。……降りられる奴は、また来られる',"That was the last one. ...Those who can fold get to come back."),
 "{p2preview:2}",
]
# ---------------------------------------------------------------- 第2章 名前のない看板
C2_IN=[
 "{p2door:2}",
 ln('','朝の連絡船で一時間。となりの港町、汐見。',"An hour on the morning ferry. Shiomi, the next port town."),
 ln('','坂の上に、古い店が一軒。看板には「舫」とある。船をつなぐ綱のことだ。',"At the top of a hill stands an old shop. Its sign reads “Moorings” — the ropes that tie a ship to shore."),
 ln('タロウ','遠征なんて、初めてです',"This is my first time playing away from home."),
 ln('','扉を開けると、壁に古い看板が一枚かかっていた。店の名前が削られている。',"Inside, an old sign hangs on the wall. The shop name has been scraped off."),
 ln('タロウ','あれ……錨亭にあるのと、同じ形だ',"Wait... that's the same shape as the one at the Anchor."),
 ln('ミヤコ','気づいたかい。あれは、この店ができる前からあるのさ',"Noticed, did you? That was here before this shop was."),
 ln('ミヤコ','この辺りの古い店には、どこにも一枚ずつある。名前のない看板がね',"Every old shop along this coast has one. A sign with no name."),
 ln('ミヤコ','舫の主、ミヤコだよ。……ジンの弟子の、そのまた弟子か',"I'm Miyako, keeper of the Moorings. ...So you're the student of Jin's student."),
 ln('イネス','港に着いたら、まず一番古い店を探すの。今日はここ',"When I reach a port, I look for the oldest shop first. Today, it's this one."),
 ln('メイ','この卓も、ノートに書いておきます',"I'll write this table in my notebook too."),
 ln('ミヤコ','汐見の作法を教えとくよ。7と2で勝ったら、卓の全員がチップを出す。錨亭じゃ、とっくにやめた決まりだろ',"Here's how we do things in Shiomi. Win with a 7 and a 2, and everyone at the table pays you chips. The Anchor dropped that rule long ago, didn't it?"),
 ln('師匠','慎重な相手ほど、後ろの席から盗める。俺は、ロクの店でそう教わった',"The more careful they are, the easier to steal from the back seats. I learned that at Roku's place.",MT('guard')),
 ln('師匠','後ろの席で、誰も入っていなかったら、先に打て。話を決めるのは、こっちだ',"In a back seat with nobody in yet, bet first. We decide the story.",MT('attack')),
 ln('師匠','ミヤコさんが降りるときの顔を、先に覚えろ。盗むのは、そのあとだ',"Learn Miyako's face when she folds. Steal after that.",MT('read')),
 lesson('後ろの席から','From the back seats',
   'ディーラーボタン（D）に近い後ろの席から先にレイズすると、慎重な相手は弱い手を降ります。全員が降りれば、ブラインドを盗めます。この章では2回盗めば勝ちです。',
   "Raise first from a back seat near the dealer button (D), and careful players fold their weak hands. If everyone folds, you steal the blinds. In this chapter, steal twice to win."),
 ln('ミヤコ','……あんた、よくしゃべるね。あんたの師匠より、ずっと',"...You sure talk a lot. Much more than your own master did."),
 ln('師匠','ジンさんは、教えなかったわけじゃない。言わなかっただけだ',"Jin didn't refuse to teach. He just didn't say it out loud."),
 ln('ミヤコ','同じことさ。……さ、座りな',"Same thing. ...Now, sit."),
]
C2_OUT=[
 ln('ミヤコ','盗まれたね。……二回も',"Robbed. ...Twice."),
 ln('ミヤコ','あんたの師匠は、ジンより教え方がうるさい。でも、うるさい師匠のほうが、弟子は長持ちするもんさ',"Your teacher's noisier than Jin ever was. But students of noisy teachers tend to last longer."),
 ln('ミヤコ','ジンには、昔ここで一度だけ負けた。ジンは何もしゃべらなかった。勝っても、負けても',"I lost to Jin here once, long ago. He never said a word. Win or lose."),
 ln('タロウ','あの看板……どうして、名前が削ってあるんですか',"That sign... why was the name scraped off?"),
 ln('ミヤコ','さあね。削ったのが誰かも、わからない',"Who knows. Nobody even knows who scraped it."),
 ln('ミヤコ','ただ、ばあさんの代から言われてる。「あの看板の前では、降りる手を恥じるな」ってね',"But since my grandmother's day, we've said this: “Before that sign, never be ashamed to fold.”"),
 ln('メイ','描いておきます。名前のない看板、汐見にも一枚',"I'll sketch it. A sign with no name — one in Shiomi, too."),
 ln('ミヤコ','汐見の看板だ。持っていきな。……来月、王冠に看板持ちが集まる。あんたの師匠も呼ばれてるはずだよ',"Here's Shiomi's sign. Take it. ...Next month, sign holders gather at the Crown. Your teacher's been invited, I'm sure."),
 ln('','帰りの連絡船。タロウは、もらった看板を膝の上で何度も見ていた。',"On the ferry home, Taro keeps looking at the sign on his lap."),
 ln('師匠','……しゃべりすぎたか',"...Did I talk too much?"),
 ln('タロウ','いえ。……全部、覚えてます',"No. ...I remember all of it."),
 "{p2preview:3}",
]
# ---------------------------------------------------------------- 第3章 もう一人の師匠
C3_IN=[
 "{p2door:3}",
 ln('','ジャズクラブ「月影」。セキの隣の席で、タロウが降りる練習をしている。',"The jazz club Moonshade. In the seat beside Seki, Taro practices folding."),
 ln('セキ','うん、今のはいい降り方だ。……これで二回目だね',"Yes, that was a fine fold. ...That's twice now."),
 ln('ミナ','ねえ、聞いた？ ハヤト君も、弟子を取ったんだって',"Hey, did you hear? Hayato took a student too."),
 ln('セキ','地下で、毎日打たせているそうだよ。……ずいぶん、急がせているらしい',"They say he has him playing underground every day. ...Pushing him rather hard."),
 ln('','その足で、港の外れの古い倉庫へ向かった。',"From there they head to the old warehouse at the edge of the harbor."),
 ln('','地下の賭場跡。奥の卓に、ハヤトと、もう一人。',"The old underground card room. At the back table: Hayato, and one more."),
 ln('ハヤト','来たな、二代目。……こいつはカイ。俺の弟子だ',"There you are, Second. ...This is Kai. My student."),
 ln('カイ','どうも。あんたがタロウ？ 「もうワンハンドだけ」の',"Hey. You're Taro? Mr. “Just one more hand”?"),
 ln('タロウ','……もう言ってません',"...I don't say that anymore."),
 ln('ハヤト','一勝負やろうぜ。弟子同士だ',"Let's play. Student against student."),
 ln('','階段の上から、ジンが下りてきた。黙って、壁際の席に座る。',"Jin comes down the stairs and sits by the wall without a word."),
 ln('師匠','カイは速い。速い相手に、合わせるな。降りて、待て',"Kai is fast. Don't match his speed. Fold, and wait.",MT('guard')),
 ln('師匠','カイは先に打ってくる。……だから、こっちが打つ場所を選べ',"Kai bets first. ...So you pick where you strike.",MT('attack')),
 ln('師匠','カイは、考える前に賭ける。速さを見ろ。手は、そこに出る',"Kai bets before he thinks. Watch his speed. That's where his hand shows.",MT('read')),
 lesson('急がない','Don\'t rush',
   '相手が速く、大きく賭けてくると、こちらも急ぎたくなります。でも、勝負する手を選ぶのはあなたです。カイのチップを全部取れば勝ちです。',
   "When an opponent bets fast and big, you want to hurry too. But you are the one who chooses which hands to fight with. Take all of Kai's chips to win."),
 ln('','（最初の1ハンドは、自動で進みます）',"(The first hand plays itself.)","{rush:1}"),
 ln('カイ','先に言っとく。俺は、待つのが嫌いだ',"I'll tell you now. I hate waiting."),
]
STUMBLE=[
 ln('','タロウが、最後のチップを押し出した。',"Taro pushes out his last chips."),
 ln('','カイが手を開く。クイーンのペア。タロウの負けだ。',"Kai turns his hand over. A pair of queens. Taro has lost."),
 ln('師匠','……まだ半——',"...Still half-ba—"),
 ln('ジン','それは、俺の失敗だ。真似するな',"That was my mistake. Don't copy it."),
 ln('','師匠は、しばらく黙っていた。',"The mentor is silent for a while."),
 ln('師匠','月影では2回、ちゃんと降りた。そこだけ数えろ',"At Moonshade you folded properly, twice. Count that, and only that.",MT('guard')),
 ln('師匠','勝負に行ったのは、悪くない。行く場所を選べ。そこだけ直せ',"Going for it wasn't wrong. Choose where you go. Fix that, and only that.",MT('attack')),
 ln('師匠','カードだけ見て決めたな。次は、カイの顔を見てから決めろ',"You decided by your cards alone. Next time, look at Kai's face first.",MT('read')),
 ln('ハヤト','……今のは、数えない。座り直せ',"...That one doesn't count. Sit back down."),
 ln('ハヤト','俺も昔、同じことを言われかけた。言いかけた人は、今そこで黙ってる',"Someone almost said that to me once. He's sitting over there, keeping quiet."),
 ln('','チップが配り直された。ここからが、本番だ。',"The chips are dealt out again. Now it's for real."),
]
C3_OUT=[
 ln('カイ','……くそ。待たれた',"...Damn. He waited me out."),
 ln('ハヤト','カイ。今日は、もうワンハンドもなしだ',"Kai. Not one more hand today."),
 ln('カイ','師匠、俺……',"Master, I..."),
 ln('ハヤト','半人前、とは言わねえよ。……言われたほうがどうなるか、俺が一番知ってる',"I won't call you half-baked. ...I know better than anyone what that does to you."),
 ln('','ハヤトは、空のポケットに手を入れた。昔ジンにもらったチップは、もう二代目に渡してある。',"Hayato slips a hand into an empty pocket. The chip Jin once gave him now belongs to the Second."),
 ln('ジン','……ハヤト。来月、王冠だ。弟子を連れてこい',"...Hayato. Next month, the Crown. Bring your student."),
 ln('ハヤト','言われなくても',"You don't have to tell me."),
 ln('','帰り道、師匠は一度だけ足を止めた。',"On the way home, the mentor stops once."),
 ln('師匠','タロウ。……さっきは、悪かった',"Taro. ...About earlier. I'm sorry."),
 ln('タロウ','え？ 何がですか',"Huh? For what?"),
 ln('ジン','……聞こえていなかったなら、それでいい',"...If he didn't hear it, that's good enough."),
 "{p2preview:4}",
]
# ---------------------------------------------------------------- 第4章 孫弟子
C4_IN=[
 "{p2door:4}",
 ln('','カードルーム「王冠」。今日は、看板持ちだけの卓が立つ。',"The card room called the Crown. Today, a table opens for sign holders only."),
 ln('','汐見、霧崎、その先の港町からも、古い看板を持った人たちが集まっていた。',"From Shiomi, from Kirisaki, and from port towns farther still, holders of old signs have gathered."),
 ln('クロダ','ようこそ。本日は、港の看板持ちによるトーナメントです',"Welcome. Today's event is a tournament among the harbor's sign holders."),
 ln('クロウ','今日は、ただの客です。……誘う側からは、降りましたので',"Today I'm just a guest. ...I've folded out of making offers."),
 ln('ミヤコ','やあ。今日は盗ませないよ',"Hello again. No stealing from me today."),
 ln('カイ','この前の続きだ、タロウ',"Let's finish what we started, Taro."),
 ln('','窓際の席に、白髪の老人が座っていた。霧崎の古い店「鯨波」の主、ソウゲン。',"By the window sits a white-haired old man. Sougen, keeper of the Whale Wave, an old shop in Kirisaki."),
 ln('ソウゲン','……その座り方。ジンに習ったか',"...That way of sitting. Jin taught you?"),
 ln('師匠','はい',"Yes."),
 ln('ソウゲン','そうか。……イサナの孫弟子か',"I see. ...So you're Isana's grand-student."),
 ln('','師匠は、その名前を初めて聞いた。',"The mentor has never heard that name before."),
 ln('','観客席のジンが、グラスを持つ手を止めた。',"In the stands, Jin's hand stops halfway to his glass."),
 ln('ソウゲン','イサナは、わしの兄弟子だ。四十年前、波の紋の封を受け取って、出ていった',"Isana was my senior. Forty years ago he received an envelope with a wave crest, and left."),
 ln('ソウゲン','……あとのことは、ジンに聞け',"...Ask Jin about the rest."),
 ln('師匠','6人いれば、待つ時間も長い。降りて、ブラインドが上がる前に一度だけ行け',"With six players, the wait is long. Fold, and strike once before the blinds go up.",MT('guard')),
 ln('師匠','ブラインドが上がったら、先に打った者が残る',"Once the blinds go up, the one who bets first survives.",MT('attack')),
 ln('師匠','6人分の顔がある。……一番よくしゃべる顔から、見ろ',"There are six faces here. ...Start with the one that talks the most.",MT('read')),
 lesson('看板持ちの卓','The sign holders\' table',
   '6人のトーナメントです。ハンドが進むと、ブラインドが上がっていきます。最後の一人になれば優勝です。',
   "A six-player tournament. The blinds rise as hands go by. Be the last one standing to win."),
]
C4_OUT=[
 ln('カイ','……負けた。また、待たれた',"...Lost. Waited out again."),
 ln('','観客席の後ろで、ハヤトが立ち上がった。ジンが、その隣に並んだ。',"At the back of the stands, Hayato gets to his feet. Jin steps up beside him."),
 ln('ジン','……ハヤト',"...Hayato."),
 ln('ジン','……お前も、一人前だ',"...You're the real thing too."),
 ln('','ハヤトは何か言おうとして、やめた。黙って、カイの肩を叩いた。',"Hayato starts to say something, then stops. He just pats Kai on the shoulder."),
 ln('ハヤト','……帰るぞ、カイ。俺たちも、まだ途中だ',"...Let's go, Kai. We're still on our way too."),
 ln('ソウゲン','イサナの孫弟子の、そのまた弟子か。……長生きは、するもんだな',"The student of Isana's grand-student. ...Living long has its rewards."),
 ln('クロウ','看板を持つ者は、挑まれたら断れません。……次は、どなたが挑むのでしょうね',"One who holds a sign can't refuse a challenge. ...I wonder who will challenge next."),
 ln('','クロウの視線の先に、タロウがいた。',"Crow's gaze rests on Taro."),
 ln('タロウ','……〈呼〉。最後の試験、やってください',"...〈呼〉. Give me the final exam."),
 ln('師匠','……錨亭で待つ',"...I'll be waiting at the Anchor."),
 "{p2preview:5}",
]
# ---------------------------------------------------------------- 第5章 最後のテル
C5_IN=[
 "{p2door:5}",
 ln('','錨亭、閉店後。店主が看板の灯りを消した。',"The Anchor, after closing. The owner switches off the sign."),
 ln('店主','今度は、あんたが座る番だね',"This time, it's your turn to sit there."),
 ln('','カウンターの奥の席に、ジンが座っている。今日は、カードを持たない。',"Jin sits at the far end of the counter. Today, he holds no cards."),
 ln('','封筒に書かれた日付は、明日だった。',"The date written in the envelope is tomorrow."),
 ln('師匠','タロウ。座れ',"Taro. Sit."),
 ln('師匠','もう、一人前だ。……だから、本気で打つ',"You're the real thing now. ...So I'm playing for real."),
 ln('','ジンが、目を細めた。',"Jin narrows his eyes."),
 ln('ジン','……俺は、それを先に言えなかった',"...I could never say that first."),
 ln('師匠','ヘッズアップだ。俺と一対一で打つ',"Heads-up. You and me, one on one."),
 ln('師匠','俺にもクセがある。……見つけてみろ',"I have a tell too. ...Find it."),
 "{tellLesson:true}",
 ln('タロウ','……はい',"...Yes."),
]
FACE=[
 ln('','師匠が、初めてまっすぐにこちらを向いた。',"For the first time, the mentor looks straight at him.","{face:1}"),
 ln('師匠','……タロウ。これが、最後のハンドだ',"...Taro. This is the last hand.","{face:1}"),
]
P2_ALT=[
 ln('師匠','……コールしたか',"...You called."),
 ln('','師匠が手を開いた。9のスリーカード。',"The mentor shows his hand. Three nines."),
 ln('師匠','あのクセは、本物だ。見えていたはずだがな',"That tell was real. You should have seen it."),
 ln('師匠','……まだ早かったか。もう一度だ',"...Too early, then. Again."),
]
C5_READ=[
 ln('師匠','……降りたか',"...You folded."),
 ln('','師匠が手を開いた。9のスリーカード。降りていなければ、負けていた。',"The mentor shows his hand. Three nines. If he hadn't folded, he would have lost."),
 ln('師匠','今のが、俺のクセだ。昔、何度も読まれた。……直さずに、取っておいた',"That's my tell. People read it again and again, long ago. ...I never fixed it. I kept it."),
]
C5_BUST=[
 ln('師匠','……チップを全部取られたか。読み合い以前の話だな',"...You took all my chips. That's before reading even starts."),
 ln('師匠','まあいい。最後まで座っていたのは、お前だ',"Fine. You're the one still sitting at the end."),
]
C5_END=[
 ln('ジン','……三代目、か',"...The Third, huh."),
 ln('','ジンが、チップを一枚、指の上で転がした。王冠の帰り道に一度だけ見た、あのしぐさだ。',"Jin rolls a chip over his fingers. The same gesture seen once, on the way back from the Crown."),
 ln('','そして、声を出して笑った。錨亭の誰も、聞いたことのない笑い声だった。',"And then he laughs out loud. A laugh no one at the Anchor has ever heard."),
 ln('','錨亭の壁。写真が二枚、新しく貼られた。',"The wall of the Anchor. Two new photos go up.","{photos:1}"),
 ln('','ジン、師匠、ハヤト、タロウ。壁の写真は、四枚になった。',"Jin, the mentor, Hayato, Taro. Four photos on the wall now.","{photos:1}"),
 ln('ゲン','おう、終わったか！ 一杯やろうぜ！',"Oh, all done? Let's have a drink!"),
 ln('','翌朝。',"The next morning."),
 ln('','師匠は、波の紋の封筒を上着の内ポケットに入れた。',"The mentor slips the wave-crested envelope into his inside pocket."),
 ln('師匠','外海の卓に行ってくる。……店を頼む',"I'm going to the Open Sea Table. ...Take care of the place."),
 ln('タロウ','はい。……いってらっしゃい',"Yes. ...Have a good trip."),
 ln('ジン','……あの人に会ったら、よろしく言っておけ',"...If you meet him, give him my regards."),
 ln('','師匠の背中が、朝の港に消えていった。',"The mentor's back fades into the morning harbor."),
 ln('','その日も、タロウは錨亭の奥の卓に座った。「もうワンハンドだけ」とは、もう言わなかった。',"That day too, Taro sat at the Anchor's back table. He never said “just one more hand” again."),
 ln('','LAST TELL　第二部　―完―',"LAST TELL Part Two — The End"),
]
# 第一部の終わりから第二部の扉へ（スタッフロール）
BRIDGE="[{roll:true},{part:'第二部',title:'師匠'}]"

# ---------------------------------------------------------------- 章データ
def chap(d):
    return "{"+",".join("%s:%s"%(k,v) for k,v in d.items())+"}"
CH=[
 dict(no=11,p2=1,lamp=J('#ffb15a'),bgm=1,title=J('三代目'),venue=J('港のバー「錨亭」'),color=J('#cfe6ff'),
   goalText=J('ゲンのチップを全部取る'),goal="{type:'boss'}",tells='true',
   you=60000,blinds='[1000,2000]',opps="[{name:'ゲン',style:'station',chips:60000,label:'何でも参加'}]",
   extras="[{name:'ケンジ',style:'normal',chips:60000},{name:'ミサキ',style:'normal',chips:60000}]",seatPlan="['p0','e0','e1']",
   intro=arr(C1_IN),outro=arr(C1_OUT),lose=J('弱い手で、ゲンに付き合いすぎたな')),
 dict(no=12,p2=2,lamp=J('#9fd8ff'),bgm=2,title=J('名前のない看板'),venue=J('汐見の古い店「舫」'),color=J('#d6ecff'),
   goalText=J('ブラインドを2回盗む'),goal="{type:'steal',n:2}",refill='true',tells='true',house=J('seven2'),
   you=80000,blinds='[1000,2000]',opps="[{name:'ミヤコ',style:'tight',chips:80000,label:'慎重'}]",
   extras="[{name:'イネス',style:'normal',chips:80000},{name:'メイ',style:'normal',chips:80000}]",seatPlan="['e0','p0','e1']",
   intro=arr(C2_IN),outro=arr(C2_OUT),lose=J('前の席で無理をしたな。盗むのは、後ろの席からだ')),
 dict(no=13,p2=3,lamp=J('#7fe0a8'),bgm=5,title=J('もう一人の師匠'),venue=J('月影から、地下の賭場跡へ'),color=J('#c9f2dc'),
   goalText=J('カイのチップを全部取る'),goal="{type:'boss'}",tells='true',script=J('rush'),
   you=80000,blinds='[1000,2000]',opps="[{name:'カイ',style:'kai',chips:80000,label:'速い'},{name:'ハヤト',style:'hayato',chips:80000,label:'荒い'}]",
   intro=arr(C3_IN),outro=arr(C3_OUT),lose=J('急ぐな。カイの速さに、合わせるな')),
 dict(no=14,p2=4,lamp=J('#c9a0ff'),bgm=6,title=J('孫弟子'),venue=J('カードルーム「王冠」'),color=J('#e3d4ff'),
   goalText=J('トーナメントで優勝する（最後の一人になる）'),goal="{type:'bust'}",tells='true',
   levels='[[1000,2000],[1500,3000],[2000,4000],[3000,6000],[5000,10000],[8000,16000]]',levelHands=8,
   you=80000,blinds='[1000,2000]',opps="[{name:'カイ',style:'kai',chips:50000,label:'速い'},{name:'ソウゲン',style:'nit2',chips:50000,label:'動かない'},{name:'クロウ',style:'crow',chips:50000,label:'読めない'}]",
   extras="[{name:'ミヤコ',style:'tight',chips:40000},{name:'イオリ',style:'tight2',chips:40000}]",seatPlan="['e0','p0','p1','p2','e1']",
   intro=arr(C4_IN),outro=arr(C4_OUT),lose=J('ブラインドが上がる前に、勝負どころを選べ')),
 dict(no=15,p2=5,lamp=J('#ffb15a'),bgm=7,title=J('最後のテル'),venue=J('錨亭、閉店後'),color=J('#ffe0b8'),
   goalText=J('師匠のクセを読み切る'),goal="{type:'final'}",tells='true',script=J('mfinal'),
   you=80000,blinds='[1000,2000]',opps="[{name:'師匠',style:'mentor',chips:80000,label:'二代目'}]",
   intro=arr(C5_IN),outro="()=>[].concat(S&&S.finalRead?%s:%s,%s)"%(arr(C5_READ),arr(C5_BUST),arr(C5_END)),lose=J('見えたものを信じろ。……俺のクセは、お前のためにある')),
]
for c,t in zip(CH,[('三代目','The Third'),('名前のない看板','The Sign with No Name'),('もう一人の師匠','The Other Master'),('孫弟子','Grand-Student'),('最後のテル','The Last Tell')]):en(*t)
en('汐見の古い店「舫」',"The old shop “Moorings” in Shiomi");en('月影から、地下の賭場跡へ',"From Moonshade to the underground card room")
en('ゲンのチップを全部取る',"Take all of Gen's chips");en('ブラインドを2回盗む',"Steal the blinds twice");en('カイのチップを全部取る',"Take all of Kai's chips")
en('師匠のクセを読み切る',"Read the mentor's tell to the end")
en('弱い手で、ゲンに付き合いすぎたな',"You went along with Gen on too many weak hands.");en('前の席で無理をしたな。盗むのは、後ろの席からだ',"You forced it from an early seat. Steal from the back.")
en('急ぐな。カイの速さに、合わせるな',"Don't rush. Don't match Kai's speed.");en('ブラインドが上がる前に、勝負どころを選べ',"Pick your spot before the blinds go up.")
en('見えたものを信じろ。……俺のクセは、お前のためにある',"Trust what you saw. ...My tell is there for you.")
en('速い','Fast');en('動かない','Doesn\'t move');en('二代目','The Second')
P2_JS="const PART2=[\n"+",\n".join(chap(c) for c in CH)+"];\n"
P2_JS+="const P2_STUMBLE=%s;\nconst P2_FACE=%s;\nconst P2_ALT=%s;\nconst P2_BRIDGE=%s;\n"%(arr(STUMBLE),arr(FACE),arr(P2_ALT),BRIDGE)

# ---------------------------------------------------------------- 師匠の型・クセ
TYPES={'guard':('守りの師匠','The Guarding Mentor','降りるのも勝負のうちだ','Folding is part of the game.'),
       'attack':('攻めの師匠','The Attacking Mentor','先に打ったほうが、話を決める','Whoever bets first decides the story.'),
       'read':('読みの師匠','The Reading Mentor','手を見るな、顔を見ろ','Don\'t watch the cards, watch the face.'),
       'plain':('ふつうの師匠','The Steady Mentor','降りるのも勝負のうちだ','Folding is part of the game.')}
for k,(a,b,c,d) in TYPES.items():en(a,b);en(c,d)
BASIS=[('第一部で降りた割合　{0}%','Folds in Part One: {0}%'),('第一部で自分から上げた割合　{0}%','Raises first in Part One: {0}%'),
       ('第一部でクセを読み当てた回数　{0}回','Tells read correctly in Part One: {0}'),('第一部の記録が少ないので、ジンと同じ教え方から始める',"Not much Part One record, so the mentor starts out teaching the way Jin did"),
       ('第一部の記録から、まっすぐな教え方になった',"From the Part One record, the mentor teaches in a straightforward way")]
for a,b in BASIS:
    if '{0}' in a:tp([a,b])
    else:en(a,b)
en('あなたの打ち方が、師匠になる','Your way of playing becomes the mentor');en('師匠の口ぐせ','The mentor\'s saying')
OPEN={'guard':('弱い手は降りろ。……降りた回数を、数えておけ',"Fold the weak hands. ...Keep count of your folds."),
      'attack':('いい手が来たら、こっちから上げろ。待つのは、そのあとだ',"When a good hand comes, raise first. Wait after that."),
      'read':('賭ける前に、相手の顔を一回見ろ',"Before you bet, look at their face once.")}
CATCH={'guard':('降りるのも勝負のうちだ',"Folding is part of the game."),'attack':('いい降り方だ。次は、先に打て',"Good fold. Next time, bet first."),
       'read':('顔を見て降りたな。それでいい',"You folded after reading the face. Good.")}
for d in (OPEN,CATCH):
    for k,(a,b) in d.items():en(a,b)
TELLW={'size':'賭ける額','time':'賭ける早さ','body':'チップを見る目線'}
CUE_OF={'size':'size','time':'fast','body':'glance'}
CUT={'glance':('師匠が、自分のチップをちらっと見た。',"The mentor glances at his own chips."),'fast':('師匠が、考えずにすぐ賭けた。',"The mentor bets instantly, without thinking."),
     'size':('師匠が、いつもと違う大きさで賭けた。',"The mentor bets an unusual size.")}
for k,(a,b) in CUT.items():en(a,b)
en('最後のテル','The Last Tell')
tp(['第一部で、師匠がいちばん多く相手に読まれたクセは「{0}」です。師匠は、そのクセをまだ直していません。本物か、罠か。読み切って決めましょう。',
           "In Part One, the tell opponents read most often on the mentor was “{0}.” He still hasn't fixed it. Real, or a trap? Read it through and decide."])
en('いつもと違う大きさで賭けた','bet an unusual size')
NOUN={'still':'固まり方','glance':'チップを見る目','smile':'口元','stare':'視線','talk':'口数','fast':'速い賭け方','sweat':'汗','scar':'傷に触れる指','glove':'手袋の指先','release':'傷から離れる指'}
NOUN_EN={'still':'freeze','glance':'glance at the chips','smile':'mouth','stare':'stare','talk':'chatter','fast':'snap bets','sweat':'sweat','scar':'finger on the scar','glove':'glove fingertips','release':'finger leaving the scar'}
for k in NOUN:en(NOUN[k],NOUN_EN[k])
tp(['{0}の{1}は、何度も見た。……顔は、嘘をつけない',"{0}'s {1}... I saw it many times. ...A face can't lie."])
tp(['師匠の型：{0}','Mentor type: {0}']);tp(['第二部　第{0}章　{1}','Part Two, Ch.{0}: {1}']);tp(['第二部　第{0}章クリア','Part Two, Ch.{0} cleared'])
tp(['第二部　第{0}章','Part Two, Ch.{0}']);tp(['{0}の三行',"{0}'s three lines"])
en('師匠のクセを読み切った',"You read the mentor's tell to the end");en('師匠は、静かにチップをそろえている……',"The mentor quietly squares his chips...")
en('降りるのが早い。最後まで見ろ',"You folded too early. Watch to the end.")
en('二代目の教え',"The Second's lesson");en('第二部','Part Two');en('師匠','The Mentor')
en('第7章をクリアすると、第一部のあなたがタロウの師匠になります。','After you clear Chapter 7, you from Part One become Taro\'s mentor.')
en('第一部のあなたが、タロウの師匠になります。','You from Part One become Taro\'s mentor.')
en('次回','Next time')
PREV={2:('ミヤコ','汐見「舫」','あんたの師匠より、よくしゃべるね'),3:('カイ','地下の賭場跡','俺は、待つのが嫌いだ'),4:('ソウゲン','王冠','……その座り方。ジンに習ったか'),5:('師匠','錨亭、閉店後','もう、一人前だ。……だから、本気で打つ')}
en('汐見「舫」','Shiomi “Moorings”');en('地下の賭場跡','The underground card room')
en('あんたの師匠より、よくしゃべるね','You talk more than your own master did.');en('俺は、待つのが嫌いだ','I hate waiting.')
# スタッフロール
ROLL=['錨亭','銀の扉','月影','天空','地下','王冠']
en('地下','Underground');en('第一部　弟子','Part One: The Student');en('そして、あなた','and you');en('名前のない看板','The Sign with No Name')
CAST=['ジン','ゲン','店主','ロク','ハル','セキ','ミナ','レイカ','ソウ','ハヤト','テツ','クロウ','クロダ','カオル','ゴウ','タロウ']
en('タップで飛ばせます','Tap to skip')
# 称号
TT=[('sandaime','三代目','第二部をクリアする','三代目か。……あいつも、師匠の顔になったな。','The Third','Clear Part Two',"The Third, huh. ...He's got a mentor's face now too."),
    ('uketsugi','受け継いだクセ','第二部の最終章で、師匠のクセを読み切って降りる','師匠のクセを読んだか。……俺のときと、同じ顔をしていたぞ。','An Inherited Tell',"Read the mentor's tell and fold in Part Two's final chapter","You read your mentor's tell. ...You had the same face I saw back then."),
    ('hanninmae','半人前と言わない','第二部を一度も負けずにクリアする','……一度も言わずに済んだか。あいつは、俺より上手く教えたな。','Never Half-Baked','Clear Part Two without losing once',"...Never had to say it once. He taught better than I did.")]
for i,n,h,j,ne,he,je in TT:en(n,ne);en(h,he);en(j,je)
# 新しい人：名乗り・紹介・クセ・口ぐせ
NEW={'ミヤコ':('Miyako','汐見「舫」の主','Keeper of Shiomi\'s Moorings','さ、座りな','Now, sit.'),
     'カイ':('Kai','ハヤトの弟子','Hayato\'s student','俺は、待つのが嫌いだ','I hate waiting.'),
     'ソウゲン':('Sougen','霧崎「鯨波」の主','Keeper of Kirisaki\'s Whale Wave','その座り方、誰に習った','Who taught you to sit like that?'),
     '師匠':('The Mentor','王冠の看板の主','Holder of the Crown\'s sign','もう、一人前だ。……だから、本気で打つ',"You're the real thing now. ...So I'm playing for real.")}
for k,(a,b,c,d,e) in NEW.items():
    if k!='師匠':en(k,a)
    en(b,c);en(d,e)
SAY={'ミヤコ':(['ふん','さて、どうするかね'],['よく来るね'],['ここは引くよ'],['舫は、ほどけないよ'],['全部だよ']),
     'カイ':(['……','早く'],['来いよ'],['ちっ、次だ'],['待たないのが、俺の打ち方だ'],['全部いく']),
     'ソウゲン':(['……ふむ','……'],['……ほう'],['……降り'],['長生きは、するもんだ'],['……全部だ']),
     '師匠':(['……','……ふむ'],['……来たか'],['降りる'],['まだ、譲らん'],['全部だ'])}
SAY_EN={'ふん':'Hmph.','さて、どうするかね':'Now, what to do...','よく来るね':'You do keep coming.','ここは引くよ':'I\'ll back off here.','舫は、ほどけないよ':'A mooring doesn\'t come loose.','全部だよ':'All of it.',
        '早く':'Hurry up.','来いよ':'Come on.','ちっ、次だ':'Tch. Next.','待たないのが、俺の打ち方だ':'Not waiting is how I play.','全部いく':'All in.',
        '……ふむ':'...Hm.','……ほう':'...Oh?','……降り':'...Fold.','長生きは、するもんだ':'Living long has its rewards.','……全部だ':'...All of it.',
        '……来たか':'...Here it comes.','降りる':'Fold.','まだ、譲らん':'Not handing it over yet.','全部だ':'All of it.'}
for k,v in SAY_EN.items():en(k,v)

# ---------------------------------------------------------------- 絵（patch35 と同じ部品で）
ART=r'''Object.assign(REAL,{
  '師匠':{rank:4,sex:'m',age:1,skin:'#f0cfb6',shade:'#8a5446',lip:'#b8705e',hair:'#d9783a',hairD:'#8a4418',brow:'#9a4e1c',iris:'#c2621f',
    cloth:'#1f6f60',clothD:'#0f4038',face:'m',eh:2.4,hs:'sidepart',outfit:'jacket',shirt:'#f2efe8',stubble:1},
  'カイ':{rank:2,sex:'m',age:0,...skinOf(3),hair:'#1a1a1a',hairD:'#0a0a0a',brow:'#1a1a1a',iris:'#3a2a1c',
    cloth:'#c8343a',clothD:'#7a1a1e',face:'ym',cute:1,young:1,ew:5.2,eh:3.4,ir:2.9,cy:46.4,neck:6,blush:.12,hs:'short',outfit:'tee',earring:'#cfd4e0'},
  'ミヤコ':{rank:3,sex:'f',age:2,...skinOf(2),hair:'#d8d4cc',hairD:'#a8a49c',brow:'#b8b2a6',iris:'#3a2a1c',
    cloth:'#2a4a5a',clothD:'#142a34',face:'f',eh:2.4,hs:'bun',outfit:'knit',glasses:'square',frame:'#6a4a3a',earring:'#e2b65b'},
  'ソウゲン':{rank:4,sex:'m',age:2,...skinOf(3),hair:'#e8e4dc',hairD:'#b8b4ac',brow:'#d0ccc4',iris:'#2a1a12',
    cloth:'#3a3430',clothD:'#1e1a18',face:'m',eh:2.2,hs:'ponytail',tieC:'#3a3430',beard:'goatee',beardC:'#e8e2d0',outfit:'jacket',shirt:'#d8d0c0'},
});
// タロウは章が進むと少しずつ変わる（第2〜3章：上着、第4〜5章：落ち着いた顔。rank は 2 まで）
REAL['タロウ2']={...REAL['タロウ'],blush:.35,outfit:'jacket',cloth:'#3a4a6a',clothD:'#1e2a40',shirt:'#ffc93c'};
REAL['タロウ3']={...REAL['タロウ'],rank:2,blush:.2,nervous:0,eh:3.9,ir:3.1,outfit:'jacket',cloth:'#2a3a5a',clothD:'#141e34',shirt:'#ffc93c'};
Object.assign(CHARS,{'師匠':{rank:4},'カイ':{rank:2},'ミヤコ':{rank:3},'ソウゲン':{rank:4}});
'''

JS=r'''// ===== 第二部「師匠」 =====
'''+P2_JS+ART+r'''STYLES.kai={hi:1.55,mid:1.2,midP:.5,bluff:.16,margin:0,defPre:0,defPost:0};
STYLES.mentor={...STYLES.jin};
Object.assign(ENTER,{'カイ':.65,'ミヤコ':1,'ソウゲン':1.1,'師匠':1});
Object.assign(TELLS,{'ミヤコ':{strong:{cue:'still',rate:.65,false:.1},bluff:{cue:'talk',rate:.65,false:.1}},
  'カイ':{strong:{cue:'stare',rate:.65,false:.1},bluff:{cue:'fast',rate:.7,false:.1}},
  'ソウゲン':{strong:{cue:'glance',rate:.6,false:.1},bluff:{cue:'still',rate:.6,false:.1}}});
Object.assign(NANORI,'''+J({k:NEW[k][1] for k in NEW})+r''');
Object.assign(INTRO,'''+J({k:[NEW[k][1],NEW[k][3]] for k in NEW})+r''');
Object.assign(THINK,'''+J({k:SAY[k][0] for k in SAY})+r''');
Object.assign(FACING,'''+J({k:SAY[k][1] for k in SAY})+r''');
Object.assign(LINES,'''+J({k:{'fold':SAY[k][2],'win':SAY[k][3],'allin':SAY[k][4]} for k in SAY})+r''');
CUE_LABEL.size='いつもと違う大きさで賭けた';CUE_SFX.size='ドン';CAM_SPOT.size={chips:1};
const P2_TYPES='''+J({k:[a,c] for k,(a,b,c,d) in TYPES.items()})+r''';
const P2_OPEN='''+J({k:v[0] for k,v in OPEN.items()})+r''',P2_CATCH='''+J({k:v[0] for k,v in CATCH.items()})+r''';
const P2_TELLW='''+J(TELLW)+''',P2_CUE='''+J(CUE_OF)+''',P2_CUT='''+J({k:v[0] for k,v in CUT.items()})+''',P2_NOUN='''+J(NOUN)+r''';
const P2_PREV='''+J({k:{'boss':v[0],'sign':v[1],'line':v[2]} for k,v in PREV.items()})+r''';
const P2_ROLL='''+J(ROLL)+''',P2_CAST='''+J(CAST)+r''';
TITLES.push('''+",".join("{id:'%s',name:%s,hint:%s,jin:%s}"%(i,J(n),J(h),J(j)) for i,n,h,j,_,_,_ in TT)+r''');
// ---- 進み具合（shisho-part2。shisho-progress とは別） ----
const P2_KEY='shisho-part2';
function loadP2(){const z={cleared:0,mentor:'',tell:'',fav:'',rush:0};
  try{const o=JSON.parse(localStorage.getItem(P2_KEY));if(!o||typeof o!=='object')return z;
    z.cleared=Math.max(0,Math.min(5,Math.floor(+o.cleared||0)));z.mentor=P2_TYPES[o.mentor]?o.mentor:'';z.tell=P2_TELLW[o.tell]?o.tell:'';
    z.fav=typeof o.fav==='string'?o.fav.slice(0,12):'';z.rush=o.rush?1:0;z.basis=typeof o.basis==='string'?o.basis.slice(0,80):'';return z}catch(e){return z}}
function saveP2(o){try{localStorage.setItem(P2_KEY,JSON.stringify({v:1,...o}))}catch(e){}}
// 師匠の型とクセは、第二部を始めたときに一度だけ決める（shisho-style が無い・壊れている・少ないときは「ふつう」）
function p2Init(){const st=loadP2();if(st.mentor)return st;
  let o;try{o=window.__style()}catch(e){o=null}if(!o||typeof o!=='object')o={hands:0,readBy:{},readHitBy:{}};
  const h=+o.hands||0,rb=o.readBy||{},hit=o.readHitBy||{},hits=Object.values(hit).reduce((a,b)=>a+(+b||0),0);let m='plain',basis='';
  if(h<30)basis='第一部の記録が少ないので、ジンと同じ教え方から始める';
  else if((+o.folds||0)/h>=.6){m='guard';basis='第一部で降りた割合　'+Math.round(o.folds/h*100)+'%'}
  else if((+o.pfr||0)/h>=.25){m='attack';basis='第一部で自分から上げた割合　'+Math.round(o.pfr/h*100)+'%'}
  else if(hits>=8){m='read';basis='第一部でクセを読み当てた回数　'+hits+'回'}
  else basis='第一部の記録から、まっすぐな教え方になった';
  const ks=['size','time','body'],mx=Math.max(...ks.map(k=>+rb[k]||0)),top=ks.filter(k=>(+rb[k]||0)===mx);
  st.tell=mx>0&&top.length===1?top[0]:'body';
  let fav='',fb=0;Object.keys(hit).forEach(k=>{if((+hit[k]||0)>fb&&k.length<=12){fb=+hit[k];fav=k}});
  st.mentor=m;st.fav=fav;st.basis=basis;saveP2(st);return st}
const p2Type=()=>{const m=loadP2().mentor;return m==='attack'||m==='read'?m:'guard'};
const mentorName=()=>nick()||'師匠';
const callName=()=>nick()?nick()+'さん':'師匠';
const P2ON=()=>typeof CFG!=='undefined'&&!!CFG&&!!CFG.ch&&!!CFG.ch.p2;
function chLab(c){return c&&c.p2?'第二部　第'+c.p2+'章':'第'+(c?c.no:'')+'章'}
// 場面の行：型で分かれる行と、記録から作る行
function p2Expand(lines){const t=p2Type(),st=loadP2(),out=[];
  (lines||[]).forEach(l=>{
    if(Array.isArray(l)){const m=l[2]||{};if(m.mt&&m.mt!==t)return;if(m.rush&&st.rush)return;
      out.push(l[1].includes('〈呼〉')?[l[0],l[1].split('〈呼〉').join(callName()),l[2]]:l);return}
    if(l&&l.fav){const f=st.fav;if(!f)return;const T=TELLS[f],cue=T&&T.strong&&T.strong.cue,nn=P2_NOUN[cue];if(!nn)return;
      out.push(['師匠',`${f}の${nn}は、何度も見た。……顔は、嘘をつけない`]);return}
    if(l&&l.tellLesson){out.push({lesson:'最後のテル',body:`第一部で、師匠がいちばん多く相手に読まれたクセは「${SELF_WHY[{time:'fast'}[st.tell]||st.tell||'body']}」です。師匠は、そのクセをまだ直していません。本物か、罠か。読み切って決めましょう。`});return}
    out.push(l)});
  return out}
// 師匠の顔は、第5章の最後のハンドの直前まで出さない（影だけ）
let P2FACE=false;
function P2K(p){return p&&p.name==='師匠'&&P2FACE?'F':''}
{const _av=avatar;avatar=function(name,mood,opts){
  if(name==='師匠'&&!P2FACE)return _av('師匠','normal').replace('<svg','<svg style="filter:brightness(0) drop-shadow(0 0 6px rgba(226,182,91,.6))" data-sil="1"');
  return _av.apply(this,arguments)}}
// 第二部の場面・勝負のあいだだけ、タロウの絵を章に合わせる
function p2Ctx(ch){const n=ch&&ch.p2||0;
  if(n>=4){REAL_KEY['タロウ']='タロウ3';CHARS['タロウ'].rank=2}else if(n>=2){REAL_KEY['タロウ']='タロウ2';CHARS['タロウ'].rank=1}else{delete REAL_KEY['タロウ'];CHARS['タロウ'].rank=1}}
{const _ps=playScene;playScene=function(ch,lines,done){p2Ctx(ch);if(!(ch&&ch.p2===5))P2FACE=false;return _ps.apply(this,arguments)}}
{const _sg=startGame;startGame=function(cfg){p2Ctx(cfg&&cfg.ch);if(!(cfg&&cfg.ch&&cfg.ch.p2===5))P2FACE=false;
  const r=_sg.apply(this,arguments);try{$('senseiAva').innerHTML=avatar(cfg&&cfg.ch&&cfg.ch.p2?'師匠':'ジン')}catch(e){}return r}}
function startP2(ch,skipIntro){
  ltTrack('chapter_start',{ch:ch.no});const st=p2Init();P2FACE=false;
  const m=loadStyle(),h=m.hands>=30?m.hands:0,vp=h?Math.min(.6,Math.max(.15,m.vpip/h)):.3,pr=h?Math.min(.35,Math.max(.04,m.pfr/h)):.12,bl=h?Math.min(.12,m.bluffs/h):.05;
  STYLES.mentor={hi:1.7,mid:1.42-vp*.4,midP:Math.min(.55,.3+pr),bluff:Math.max(.05,.04+bl),margin:.05-vp*.06,defPre:0,defPost:0};ENTER['師匠']=Math.max(.75,1.2-vp);
  const rush=ch.script==='rush'&&!st.rush;
  const go=()=>startGame({ch,nanori:!skipIntro,rush,title:`${chLab(ch)}　${ch.venue}`,blinds:ch.blinds,
    seats:[{name:'タロウ',chips:rush?20000:ch.you,human:true}].concat(chSeats(ch)),
    goal:ch.goal,hint:null,refill:!!ch.refill,tells:!!ch.tells,house:ch.house||null,lamp:ch.lamp,bgm:ch.bgm,lore:'',levels:ch.levels||null,levelHands:ch.levelHands||0});
  skipIntro?go():playScene(ch,p2Expand(ch.intro),go)}
// 台本のハンド：第3章の急ぎすぎた1ハンド、第5章の最後のハンド
function p2Script(sc){
  if(sc==='rush'&&CFG.rush&&S.handNo===1&&!S.rushDone){
    rig({'タロウ':[C(14,'♥'),C(11,'♥')],'カイ':[C(12,'♠'),C(12,'♦')]},[C(13,'♣'),C(8,'♦'),C(3,'♠'),C(6,'♣'),C(2,'♥')]);
    S.autoMe=true;S.rushHand=1;S.msg='タロウは、勝負を急いでいる。……このハンドは自動で進みます';
    S.scriptAI=i=>{const p=S.players[i],tc=S.currentBet-p.bet;
      if(p.name==='カイ')return S.street==='preflop'&&S.currentBet<p.bet+p.chips?{type:'raise',to:p.bet+p.chips,state:'strong'}:{type:'call',state:'strong'};
      return tc>0?{type:'fold',state:'none'}:{type:'call',state:'none'}};return true}
  if(sc==='mfinal'&&!S.finalRead&&S.handNo>=(S.finalNext||6)){
    S.finalHand=true;S.finalNext=S.handNo+3;const cue=P2_CUE[loadP2().tell]||'glance';S.p2cue=cue;
    rig({'タロウ':[C(14,'♣'),C(13,'♦')],'師匠':[C(9,'♥'),C(9,'♠')]},[C(14,'♠'),C(9,'♦'),C(2,'♣'),C(11,'♥'),C(4,'♠')]);
    S.msg='師匠は、静かにチップをそろえている……';
    S.scriptAI=i=>{const p=S.players[i],tc=S.currentBet-p.bet,pot=potTotal();
      if(S.street==='river'){
        if(!S.released){S.released=true;S.tellSeq=(S.tellSeq||0)+1;p.tell={cue,meaning:'strong',truth:'strong',street:'river',seq:S.tellSeq};p.tellLog.push(p.tell);
          cutIn('師匠','……',P2_CUT[cue]);if(reducedMotion())log(`師匠：${CUE_LABEL[cue]}`)}
        return tc>0?{type:'raise',to:p.bet+p.chips,state:'strong'}:{type:'raise',to:Math.min(p.bet+p.chips,Math.max(BB()*4,Math.round(pot/1000)*1000)),state:'strong'}}
      if(S.street==='turn'&&tc===0)return{type:'raise',to:Math.max(BB()*2,Math.round(pot/2/1000)*1000),state:'strong'};
      return{type:'call',state:'strong'}};return true}
  return false}
function p2FinalEnd(){const me=S.players[0];
  if(S.released&&me.folded&&S.street==='river'){S.finalRead=true;S.msg='師匠のクセを読み切った';S.mietaNow={name:'師匠',cue:S.p2cue||'glance',big:true}}
  else if(S.released&&!me.folded)S.p2alt=true;
  else if(!S.released&&me.folded)jinNote('降りるのが早い。最後まで見ろ',3)}
{const _sh=startHand;startHand=function(){
  if(P2ON()&&S&&S.players&&S.handOver&&!S.result){const ch=CFG.ch,s0=S;
    // 第3章：急ぎすぎた1ハンドのあと、師匠のつまずき（1回だけ）
    if(S.rushLost&&!S.rushDone){S.rushDone=true;const st=loadP2();st.rush=1;saveP2(st);nextvClear();
      return playScene(ch,p2Expand(P2_STUMBLE),()=>{if(S!==s0)return;
        S.players.forEach(p=>{if(p.human){p.chips=p.start=ch.you}else p.chips=p.start;p.out=false});S.rushLost=false;
        show('game');Sound.bgm(CFG.bgm||0);render();startHand()})}
    // 第5章：最後のハンドの直前に、初めて師匠の顔を見せる
    if(ch.script==='mfinal'&&!S.finalRead&&!S.faceShown&&S.handNo+1>=(S.finalNext||6)){S.faceShown=true;P2FACE=true;nextvClear();
      return playScene(ch,P2_FACE,()=>{if(S!==s0)return;show('game');Sound.bgm(CFG.bgm||0);render();startHand()})}}
  const r=_sh.apply(this,arguments);
  try{if(P2ON()&&S.handNo===1&&!S.autoMe&&CFG.ch.script!=='mfinal')jinNote(P2_OPEN[p2Type()],1)}catch(e){}
  return r}}
{const _eh=endHand;endHand=function(){
  const rl=P2ON()&&S&&S.rushHand===S.handNo&&S.players[0].chips<=0;if(rl)S.players[0].chips=1;
  const r=_eh.apply(this,arguments);
  if(rl){S.players[0].chips=0;S.rushLost=true;S.autoMe=false;S.msg='タロウの負けだ';render()}
  return r}}
function p2Quote(ch){return mentorName()+'「'+(typeof ch.outro==='function'?'もう、一人前だ':({1:'今のが最後だ。……降りられる奴は、また来られる',2:'……しゃべりすぎたか',3:'タロウ。……さっきは、悪かった',4:'……錨亭で待つ'})[ch.p2])+'」'}
function p2Win(){const ch=CFG.ch,st=loadP2();st.cleared=Math.max(st.cleared,ch.p2);saveP2(st);
  if(ch.p2===5){P2FACE=true;grantTitle('sandaime');if(S.finalRead)grantTitle('uketsugi');
    const L=loadStory().loses;if(!PART2.some(c=>+L[c.no]))grantTitle('hanninmae')}
  showInterstitial(()=>playScene(ch,p2Expand(typeof ch.outro==='function'?ch.outro():ch.outro),showChapters))}
// 章を選ぶ：第二部の列（第7章クリアで開く）
function p2Render(){const box=$('p2Box');if(!box)return;const ok=loadCleared()>=7;box.hidden=!ok;if(!ok)return;
  const st=loadP2(),cl=st.cleared;
  $('p2Note').textContent=st.mentor?'師匠の型：'+P2_TYPES[st.mentor][0]:'第一部のあなたが、タロウの師匠になります。';
  $('chList2').innerHTML=PART2.map(c=>{const open=c.p2<=cl+1;
    return`<li class="ch p2${open?'':' locked'}" style="--chc:${c.color}"><span class="no">${c.p2}</span>
      <span class="t">${esc(c.title)}${c.p2<=cl?'<span class="done">クリア</span>':''}</span>
      <span class="act">${open?`<button class="${c.p2===cl+1?'primary':''}" data-p2="${c.p2}">${c.p2<=cl?'もう一度':'はじめる'}</button>`:'<span class="hint">前の章をクリア</span>'}</span>
      <span class="v">${esc(c.venue)}${c.p2<=cl?`<button class="mini storebtn" data-p2memo="${c.p2}">会話を見る</button>`:''}</span></li>`}).join('');
  $('chList2').querySelectorAll('[data-p2]').forEach(b=>b.onclick=()=>startP2(PART2[b.dataset.p2-1]));
  $('chList2').querySelectorAll('[data-p2memo]').forEach(b=>b.onclick=()=>{const ch=PART2[b.dataset.p2memo-1];p2Init();P2FACE=false;
    playScene(ch,p2Expand([].concat(ch.intro,typeof ch.outro==='function'?ch.outro():ch.outro)),showChapters)})}
// 会話の表示：スタッフロール・扉・師匠の型・次回・顔・写真
function p2Line(l){const st=$('stage'),bx=$('box');
  if(l.roll){st.className='stage roll';
    st.innerHTML=`<div class="signs">${P2_ROLL.map((n,k)=>`<span class="sg" style="--k:${k}">${esc(n)}</span>`).join('')}<span class="sg nl" style="--k:6" aria-label="名前のない看板"></span></div>`;
    bx.innerHTML=`<span class="lesson-tag">第一部　弟子</span><div class="credits">${P2_CAST.map(n=>`<span>${esc(n)}</span>`).join('')}<span class="you">そして、あなた</span></div><p class="rollskip">タップで飛ばせます</p>`;
    const sc=SC,i=SC.i;clearTimeout(p2Line.t);p2Line.t=setTimeout(()=>{if(SC===sc&&SC.i===i)advance()},reducedMotion()?6000:10500);return true}
  if(l.p2door){const c=PART2[l.p2door-1];setStage(null);st.className='stage part';
    bx.innerHTML=`<div class="partcard door"><span>${esc(chLab(c))}</span><b>${esc(c.title)}</b></div>`;return true}
  if(l.mentor){const s2=p2Init(),T=P2_TYPES[s2.mentor]||P2_TYPES.plain;setStage('師匠');
    bx.innerHTML=`<span class="lesson-tag">あなたの打ち方が、師匠になる</span><div class="mcard"><b class="mt">${esc(T[0])}</b><span class="mb">${esc(s2.basis||'')}</span><span class="mq"><small>師匠の口ぐせ</small>「${esc(T[1])}」</span></div>`;return true}
  if(l.p2preview){const pv=P2_PREV[l.p2preview],nc=PART2[l.p2preview-1];
    st.className='stage preview';st.innerHTML=`<div class="portrait sil">${avatar(pv.boss)}</div><div class="sign">${esc(pv.sign)}</div>`;
    bx.innerHTML=`<span class="lesson-tag">次回</span><div class="lesson"><div class="lt">${esc(chLab(nc))}　${esc(nc.title)}</div><p>「${esc(pv.line)}」</p></div>`;return true}
  return false}
function p2After(l){const m=Array.isArray(l)&&l[2]||{},st=$('stage');
  if(m.face){P2FACE=true;if(!l[0]){st.className='stage cool face first';st.innerHTML=`<div class="portrait">${avatar('師匠','confident')}</div>`}else st.classList.add('face')}
  if(m.photos&&!st.classList.contains('photos')){st.className='stage photos';
    st.innerHTML=`<div class="ph4">${['ジン','師匠','ハヤト','タロウ'].map((n,k)=>{const f=P2FACE;P2FACE=true;const a=avatar(n,'win');P2FACE=f;return`<figure class="photo4" style="--r:${[-3,2,-1.5,3][k]}deg"><div class="pimg">${a}</div><figcaption>${esc(n==='師匠'?mentorName():n)}</figcaption></figure>`}).join('')}</div>`}}
'''
rep("// ===== その他（B-1〜B-5、A-3、C-1、C-2） =====",JS+"// ===== その他（B-1〜B-5、A-3、C-1、C-2） =====")

# ---------------------------------------------------------------- 既存の処理へのつなぎ
# 章の番号の表示
rep("SC.vh=`<span class=\"vchip\">第${ch.no}章　${esc(ch.title)}</span>","SC.vh=`<span class=\"vchip\">${chLab(ch)}　${esc(ch.title)}</span>")
rep("  const where=CFG.ch?`第${CFG.ch.no}章　${CFG.ch.venue}`:CFG.title;","  const where=CFG.ch?`${chLab(CFG.ch)}　${CFG.ch.venue}`:CFG.title;")
rep("  if(S.result==='win'&&CFG.ch)head=`第${CFG.ch.no}章クリア`;","  if(S.result==='win'&&CFG.ch)head=`${chLab(CFG.ch)}クリア`;")
rep("[CFG.ch.no]+'」':''};","[CFG.ch.no]+'」':''};if(CFG.ch&&CFG.ch.p2&&S.hl.quote)S.hl.quote=p2Quote(CFG.ch);")
# 第二部の章は startP2 へ
rep("function startChapter(ch,skipIntro){\n","function startChapter(ch,skipIntro){\n  if(ch&&ch.p2)return startP2(ch,skipIntro);\n")
# 台本
rep("  const sc=CFG.ch&&CFG.ch.script;if(!sc)return;\n","  const sc=CFG.ch&&CFG.ch.script;if(!sc)return;\n  if(CFG.ch.p2){p2Script(sc);return}\n")
rep("  if(S.finalHand){const me=S.players[0];\n    if(S.released&&me.folded",
    "  if(S.finalHand&&CFG.ch&&CFG.ch.p2)p2FinalEnd();\n  else if(S.finalHand){const me=S.players[0];\n    if(S.released&&me.folded")
rep("  else if(g.type==='final'&&S.finalRead)S.result='win';\n",
    "  else if(g.type==='final'&&S.finalRead)S.result='win';\n  else if(g.type==='boss'&&S.players.some(p=>!p.human&&p.name===CFG.ch.opps[0].name&&p.chips<=0))S.result='win';\n")
rep("const jinAdviceOn=()=>!CFG.flashback&&!S.autoMe&&uraLv()<7&&!(CFG.ch&&(CFG.ch.no===7||CFG.ch.script==='final'));",
    "const jinAdviceOn=()=>!CFG.flashback&&!S.autoMe&&uraLv()<7&&!(CFG.ch&&(CFG.ch.no===7||CFG.ch.script==='final'||CFG.ch.script==='mfinal'));")
rep("if(!S.catchUsed){S.catchUsed=true;t='降りるのも勝負のうちだ'}","if(!S.catchUsed){S.catchUsed=true;t=P2ON()?P2_CATCH[p2Type()]:'降りるのも勝負のうちだ'}")
# 勝利条件の表示
rep("    else if(g.type==='final')sub='または、ジンのチップを全部取る';\n    else if(g.type!=='bust'){",
    "    else if(g.type==='final')sub=P2ON()?'または、師匠のチップを全部取る':'または、ジンのチップを全部取る';\n    else if(g.type!=='bust'&&g.type!=='boss'){")
en('タロウは、勝負を急いでいる。……このハンドは自動で進みます',"Taro is in a hurry to fight. ...This hand plays itself.");en('タロウの負けだ',"Taro has lost.")
en('または、師匠のチップを全部取る',"Or take all the mentor's chips")
rep("  if(g.type==='bust'||g.type==='reach'||g.type==='final')return'目標：'","  if(g.type==='bust'||g.type==='reach'||g.type==='final'||g.type==='boss')return'目標：'")
# 店の番号（常連度・隣の卓の声）は第二部では使わない。閉店後の錨亭は隣の卓の声なし
rep("const storeNo=()=>CFG.ch?CFG.ch.no:CFG.store||0;","const storeNo=()=>CFG.ch?(CFG.ch.p2?0:CFG.ch.no):CFG.store||0;")
rep("function nvKinds(){if(storeNo()===7)return[];","function nvKinds(){if(storeNo()===7||(CFG.ch&&CFG.ch.p2===5))return[];")
# 会話：第二部の行、師匠の教え、師匠の名前
rep("  if(l&&l.part){setStage(null);$('stage').className='stage part';","  if(l&&!Array.isArray(l)&&p2Line(l)){}\n  else if(l&&l.part){setStage(null);$('stage').className='stage part';")
rep("    setStage('ジン');\n    $('box').innerHTML=`<span class=\"lesson-tag\">師匠の教え</span>",
    "    setStage(SC.ch&&SC.ch.p2?'師匠':'ジン');\n    $('box').innerHTML=`<span class=\"lesson-tag\">${SC.ch&&SC.ch.p2?'二代目の教え':'師匠の教え'}</span>")
rep("<span class=\"nametag${cute?' cute':''}\">${esc(who)}","<span class=\"nametag${cute?' cute':''}\">${esc(who==='師匠'?mentorName():who)}")
rep("  $('btnAdv').textContent=SC.i===SC.lines.length-1?'進む':'次へ';","  p2After(l);\n  $('btnAdv').textContent=SC.i===SC.lines.length-1?'進む':'次へ';")
# 顔を見せたら、卓の絵も描き直す
rep("if(bd.dataset.mood!==m+tl){bd.innerHTML=avatar(p.name,m,{tell:tl});bd.dataset.mood=m+tl}","if(bd.dataset.mood!==m+tl+P2K(p)){bd.innerHTML=avatar(p.name,m,{tell:tl});bd.dataset.mood=m+tl+P2K(p)}")
# 最後のクセのカットイン（文を渡せるように）
rep("<span>最後のクセ</span><p>ジンの指が、顎の傷から離れた。</p>`","<span>最後のクセ</span><p>${typeof release==='string'?esc(release):'ジンの指が、顎の傷から離れた。'}</p>`")
# 師匠の声：負けたとき・席選び・赤ペン・三行
rep("  const t=loadStory();const n=(+t.loses[ch.no]||0);\n  if(n<=1)return'ジン「'+ch.lose+'」';","  const t=loadStory();const n=(+t.loses[ch.no]||0);\n  if(ch.p2)return mentorName()+'「'+ch.lose+'」';\n  if(n<=1)return'ジン「'+ch.lose+'」';")
rep("<p class=\"seatjin\"><span class=\"qava\">${avatar('ジン')}</span>ジン「","<p class=\"seatjin\"><span class=\"qava\">${avatar(P2ON()?'師匠':'ジン')}</span>${P2ON()?esc(mentorName()):'ジン'}「")
rep("h.textContent=`ジン「${r.line}」${r.x}`;","h.textContent=`${P2ON()?mentorName():'ジン'}「${r.line}」${r.x}`;")
rep("function reviewHTML(r){return r?`<div class=\"ava\">${avatar('ジン')}</div><b>ジンの三行</b>","function reviewHTML(r){return r?`<div class=\"ava\">${avatar(P2ON()?'師匠':'ジン')}</div><b>${P2ON()?esc(mentorName()+'の三行'):'ジンの三行'}</b>")
# 師匠は、ジンと同じく会話で揺さぶられない
rep("function talkMood(p){if(!CFG.tells||!p||p.human||p.name==='ジン')","function talkMood(p){if(!CFG.tells||!p||p.human||p.name==='ジン'||p.name==='師匠')")
rep("  let line;if(p.name==='ジン')line='……打て。話は、あとだ';","  let line;if(p.name==='ジン'||p.name==='師匠')line='……打て。話は、あとだ';")
rep("S.scriptAI||S.finalHand||S.autoMe||p.name==='ジン'||!d)return d;","S.scriptAI||S.finalHand||S.autoMe||p.name==='ジン'||p.name==='師匠'||!d)return d;")
rep("  if(p.name==='ジン')line='降りた手は、見なくていい';","  if(p.name==='ジン'||p.name==='師匠')line='降りた手は、見なくていい';")
rep("S.currentBet<=me.bet||ag.name==='ジン')return;","S.currentBet<=me.bet||ag.name==='ジン'||ag.name==='師匠')return;")
# 勝ち・負け・コール後のもう一つの結末
rep("  if(S.altEnd){S.altEnd=false;","  if(S.p2alt){S.p2alt=false;const ch=CFG.ch,lost=S.result==='lose';\n    return playScene(ch,P2_ALT,()=>{if(lost)startChapter(ch,true);else{show('game');Sound.bgm(CFG.bgm||0);startHand()}})}\n  if(S.altEnd){S.altEnd=false;")
rep("  if(S.result==='win'&&CFG.ch){\n    const ch=CFG.ch;if(ch.no>=5","  if(S.result==='win'&&CFG.ch&&CFG.ch.p2)p2Win();\n  else if(S.result==='win'&&CFG.ch){\n    const ch=CFG.ch;if(ch.no>=5")
# 第7章のあと：スタッフロール → 第二部の扉 → タイトル
rep("    showInterstitial(()=>playScene(ch,typeof ch.outro==='function'?ch.outro():ch.outro,showChapters));",
    "    showInterstitial(()=>{const ls=typeof ch.outro==='function'?ch.outro():ch.outro;if(ch.no===7)playScene(ch,ls.concat(P2_BRIDGE),()=>show('title'));else playScene(ch,ls,showChapters)});")
# 章を選ぶ画面
rep('    <ul class="chapters" id="chList"></ul>\n','    <ul class="chapters" id="chList"></ul>\n    <section class="p2box" id="p2Box" hidden><h3 class="p2head"><span>第二部</span><b>師匠</b></h3><p class="exnote" id="p2Note"></p><ul class="chapters" id="chList2"></ul></section>\n')
rep("  show('chapters');\n}\n\n/* ---------- 会話シーン ---------- */","  p2Render();\n  show('chapters');\n}\n\n/* ---------- 会話シーン ---------- */")
# 保存
rep("'shisho-talk','shisho-style'];","'shisho-talk','shisho-style','shisho-part2'];")
# ---------------------------------------------------------------- 見た目
CSS=r"""
/* ---- 第二部 ---- */
.p2box{margin-top:16px;display:grid;gap:8px}
.p2head{margin:0;display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;border-bottom:1px solid var(--line);padding-bottom:6px}
.p2head span{color:var(--gold);font-size:.85rem;letter-spacing:.35em;font-weight:800}
.p2head b{font-family:var(--display);font-size:1.5rem;letter-spacing:.2em}
body.en .p2head span,body.en .p2head b{letter-spacing:.06em}
.p2box .exnote{margin:0}
.ch.p2{border-left-color:#7fc8ff}
.ch.p2.locked{border-left-color:var(--line)}
.stage.roll{background:radial-gradient(ellipse at 50% 55%,rgba(226,182,91,.12),transparent 70%);align-items:center}
.stage.roll .signs{display:flex;flex-wrap:wrap;justify-content:center;align-content:center;gap:10px 12px;max-width:min(560px,100%);padding:8px}
.stage.roll .sg{font-family:var(--display);font-weight:800;font-size:clamp(.95rem,3.6vw,1.25rem);padding:6px 12px;min-width:4.6em;min-height:2.2em;text-align:center;
  border:1.5px solid var(--gold);color:var(--gold);background:rgba(0,0,0,.55);opacity:.14;white-space:nowrap;animation:sgOn 2.6s ease-in-out both;animation-delay:calc(var(--k)*1.35s)}
.stage.roll .sg.nl{border-style:dashed;animation-name:sgLast;animation-duration:2.4s}
@keyframes sgOn{0%{opacity:.14;box-shadow:none}25%{opacity:1;color:#fff4d8;box-shadow:0 0 18px rgba(226,182,91,.75),inset 0 0 10px rgba(226,182,91,.35)}65%{opacity:1}100%{opacity:.22;box-shadow:none}}
@keyframes sgLast{0%{opacity:.14}100%{opacity:.7;box-shadow:0 0 12px rgba(226,182,91,.4)}}
.credits{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:.92rem;color:var(--ink);line-height:1.6}
.credits span{white-space:nowrap}.credits .you{color:var(--gold);font-weight:800}
.rollskip{margin:8px 0 0;font-size:.75rem;color:var(--muted)}
.mcard{display:grid;justify-items:center;text-align:center;gap:6px;padding:4px 0}
.mcard .mt{font-family:var(--display);font-size:clamp(1.3rem,5.4vw,1.8rem);letter-spacing:.1em}
.mcard .mb{color:var(--muted);font-size:.86rem;text-wrap:balance;word-break:auto-phrase}
.mcard .mq{color:var(--gold);font-weight:800;text-wrap:balance;word-break:auto-phrase}
.mcard .mq small{display:block;font-size:.7rem;color:var(--muted);letter-spacing:.2em;font-weight:700}
.stage.face.first .portrait{animation:faceIn 1.4s ease-out}
@keyframes faceIn{0%{filter:brightness(0);opacity:.6}100%{filter:none;opacity:1}}
.stage.photos{align-items:center;background:linear-gradient(180deg,#3a2a20,#20160f)}
.ph4{display:flex;justify-content:center;align-items:center;gap:clamp(6px,2vw,16px);height:100%;width:100%;padding:8px}
.photo4{margin:0;flex:0 1 22%;max-width:150px;height:min(100%,210px);display:flex;flex-direction:column;background:#efe6d2;padding:5px 5px 0;box-shadow:0 4px 12px rgba(0,0,0,.6);transform:rotate(var(--r))}
.photo4 .pimg{flex:1;min-height:0;background:#2a2620;overflow:hidden;display:flex;justify-content:center;align-items:flex-end}
.photo4 .pimg svg{height:100%;width:auto;max-width:100%}
.photo4 figcaption{color:#3a2a1c;font-size:.72rem;font-weight:800;text-align:center;padding:2px 0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@media (max-height:500px) and (min-aspect-ratio:3/2){.stage.photos .ph4{justify-content:flex-end;padding-right:16px}.photo4{max-width:96px}}
@media (max-height:500px){.stage.roll{align-items:flex-end}.stage.roll .signs{gap:6px 8px;padding:4px}.stage.roll .sg{font-size:.8rem;padding:3px 8px;min-height:1.8em}}
.ch.p2 .t,.ch.p2 .v{word-break:auto-phrase}
.ch.p2 .v{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px}
.ch.p2 .v .storebtn{margin-left:0;white-space:nowrap}
.ch.p2 .done{white-space:nowrap}
.ch.p2 .act .hint{display:inline-block;max-width:7.5em;font-size:.78rem;line-height:1.35;text-align:right}
@media(max-width:480px){.ch.p2{gap:2px 10px;padding:12px}.ch.p2 .act button{padding-inline:10px}}
@media (prefers-reduced-motion:reduce){.stage.roll .sg{animation:none;opacity:1}.stage.face .portrait{animation:none}}
"""
rep(".epi{margin:6px 0 0;padding-left:1.1em;line-height:1.8}",".epi{margin:6px 0 0;padding-left:1.1em;line-height:1.8}"+CSS)

rep('const EN_DICT={','const EN_DICT='+json.dumps(EN,ensure_ascii=False)[:-1]+',')
rep('const EN_TPL=[','const EN_TPL='+json.dumps(TP,ensure_ascii=False)[:-1]+',')
open(OUT,'w').write(s);print('ok',len(EN),len(TP))
