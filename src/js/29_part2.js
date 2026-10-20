// ===== 第二部「師匠」 =====
const PART2=[
{no:11,p2:1,lamp:"#ffb15a",bgm:1,title:"三代目",venue:"港のバー「錨亭」",color:"#cfe6ff",goalText:"ゲンのチップを全部取る",goal:{type:'boss'},tells:true,you:60000,blinds:[1000,2000],opps:[{name:'ゲン',style:'station',chips:60000,label:'何でも参加'}],extras:[{name:'ケンジ',style:'normal',chips:60000},{name:'ミサキ',style:'normal',chips:60000}],seatPlan:['p0','e0','e1'],intro:[
   {part:'第二部',title:'師匠'},
   {p2door:1},
   ["","王冠の看板戦から、半年。"],
   ["","波の紋の封筒は、カウンターの引き出しにしまってある。書かれた日付まで、あと少しだ。"],
   ["","雨の錨亭。奥の卓で、見覚えのある男が負けている。"],
   ["タロウ","……もうワンハンドだけ"],
   ["ミサキ","それ、さっきも言ってたよ"],
   ["ケンジ","タロウ、今日もう何回目だよ"],
   ["ゲン","がっはっは！ 配られた札は全部勝負、それがポーカーってもんよ！"],
   ["","カウンターの奥で、ジンが一人で水を飲んでいる。何も言わない。"],
   ["","壁の写真は二枚。若い頃のジンと、王冠の看板を持った弟子。"],
   ["","タロウのチップが、またゲンの前へ流れていった。"],
   ["","隣の椅子が引かれた。座ったのは、その写真の弟子だった。ジンの弟子。二代目。"],
   ["タロウ","え……あの、王冠の……"],
   ["師匠","その手は、降りる手だ",{mt:'guard'}],
   ["師匠","降りるのも勝負のうちだ。……俺も、そう教わった",{mt:'guard'}],
   ["師匠","待ってるだけじゃ、ゲンには勝てない",{mt:'attack'}],
   ["師匠","先に打ったほうが、話を決める。強い手なら、こっちから上げろ",{mt:'attack'}],
   ["師匠","カードばかり見てるな",{mt:'read'}],
   ["師匠","手を見るな、顔を見ろ。ゲンは、いい手が来るとすぐニヤける",{mt:'read'}],
   ["タロウ","……教えてくれるんですか"],
   ["師匠","ゲンのチップを全部取れたら、続きを教える"],
   {mentor:true},
   {fav:true},
   ["","奥の席で、ジンがグラスを置いた。"],
   ["ジン","……教えるのは、打つより難しいぞ"],
   {lesson:"三代目",body:"ここからは、お前がタロウだ。隣に座る俺は、第一部のお前だ。第一部での打ち方が、そのまま俺の教え方になった。勝負のあいだ、ときどき口を出すぞ。"},
   ["ゲン","おう、今度は二人がかりか？ 来い来い！"]],outro:[
   ["ゲン","まいった！ タロウ、お前、急に降りるようになりやがったな"],
   ["タロウ","もうワンハンドだけ、って言いかけたら、隣でにらまれるんで"],
   ["ミサキ","あはは、ジンさんと同じことしてる"],
   ["","ジンは何も言わずに、グラスの水を一口飲んだ。口の端が、少しだけ上がっていた。"],
   ["店主","三代目だね。写真の場所、空けておくよ"],
   ["師匠","まだ早い"],
   ["店主","ジンさんも、昔そう言ったよ"],
   ["ジン","……隣の港、汐見（しおみ）に「舫（もやい）」という古い店がある。行ってこい"],
   ["","帰り道。「もうワンハンドだけ」と言いかけたタロウが、自分で口を閉じた。"],
   ["師匠","今のが最後だ。……降りられる奴だけが、明日も打てる"],
   {p2preview:2}],lose:"弱い手で、ゲンに付き合いすぎたな"},
{no:12,p2:2,lamp:"#9fd8ff",bgm:2,title:"名前のない看板",venue:"汐見の古い店「舫」",color:"#d6ecff",goalText:"ブラインドスチールを2回決める",goal:{type:'steal',n:2},refill:true,tells:true,house:"seven2",you:80000,blinds:[1000,2000],opps:[{name:'ミヤコ',style:'tight',chips:80000,label:'慎重'}],extras:[{name:'イネス',style:'normal',chips:80000},{name:'メイ',style:'normal',chips:80000}],seatPlan:['e0','p0','e1'],intro:[
   {p2door:2},
   ["","朝の連絡船で一時間。となりの港町、汐見。"],
   ["","坂の上に、古い店が一軒。看板には「舫」とある。船をつなぐ綱のことだ。"],
   ["タロウ","遠征なんて、初めてです"],
   ["","扉を開けると、壁に古い看板が一枚かかっていた。店の名前が削られている。"],
   ["タロウ","あれ……錨亭にあるのと、同じ形だ"],
   ["ミヤコ","気づいたかい。あれは、この店ができる前からあるのさ"],
   ["ミヤコ","この辺りの古い店には、どこにも一枚ずつある。名前のない看板がね"],
   ["ミヤコ","舫の主、ミヤコだよ。……ジンの弟子の、そのまた弟子か"],
   ["イネス","港に着いたら、まず一番古い店を探すの。今日はここ"],
   ["メイ","この卓も、ノートに書いておきます"],
   ["ミヤコ","汐見の作法を教えとくよ。7と2で勝ったら、卓の全員がチップを出す。錨亭じゃ、とっくにやめた決まりだろ"],
   ["師匠","慎重な相手ほど、後ろの席からのスチールが通る。俺は、ロクの店でそう教わった",{mt:'guard'}],
   ["師匠","後ろの席で、誰も入っていなかったら、先に打て。話を決めるのは、こっちだ",{mt:'attack'}],
   ["師匠","ミヤコさんが降りるときの顔を、先に覚えろ。スチールは、そのあとだ",{mt:'read'}],
   {lesson:"後ろの席から",body:"ディーラーボタン（D）に近い後ろの席から先にレイズすれば、慎重な相手は弱い手を降りる。全員が降りれば、ブラインドスチールだ。この店では、2回決めれば勝ちだ。"},
   ["ミヤコ","……あんた、よくしゃべるね。あんたの師匠より、ずっと"],
   ["師匠","ジンさんは、教えなかったわけじゃない。言わなかっただけだ"],
   ["ミヤコ","同じことさ。……さ、座りな"]],outro:[
   ["ミヤコ","ブラインドを持っていかれたね。……二回も"],
   ["ミヤコ","あんたの師匠は、ジンより教え方がうるさい。でも、うるさい師匠のほうが、弟子は長持ちするもんさ"],
   ["ミヤコ","ジンには、昔ここで一度だけ負けた。ジンは何もしゃべらなかった。勝っても、負けても"],
   ["タロウ","あの看板……どうして、名前が削ってあるんですか"],
   ["ミヤコ","さあね。削ったのが誰かも、わからない"],
   ["ミヤコ","ただ、ばあさんの代から言われてる。「あの看板の前では、降りる手を恥じるな」ってね"],
   ["メイ","描いておきます。名前のない看板、汐見にも一枚"],
   ["ミヤコ","汐見の看板だ。持っていきな。……来月、王冠に看板持ちが集まる。あんたの師匠も呼ばれてるはずだよ"],
   ["","帰りの連絡船。タロウは、もらった看板を膝の上で何度も見ていた。"],
   ["師匠","……しゃべりすぎたか"],
   ["タロウ","いえ。……全部、覚えてます"],
   {p2preview:3}],lose:"前の席で無理をしたな。スチールは、後ろの席からだ"},
{no:13,p2:3,lamp:"#7fe0a8",bgm:5,title:"もう一人の師匠",venue:"月影から、地下の賭場跡へ",color:"#c9f2dc",goalText:"カイのチップを全部取る",goal:{type:'boss'},tells:true,script:"rush",you:80000,blinds:[1000,2000],opps:[{name:'カイ',style:'kai',chips:80000,label:'速い'},{name:'ハヤト',style:'hayato',chips:80000,label:'荒い'}],intro:[
   {p2door:3},
   ["","ジャズクラブ「月影」。セキの隣の席で、タロウが降りる練習をしている。"],
   ["セキ","うん、今のはいい降り方だ。……これで二回目だね"],
   ["ミナ","ねえ、聞いた？ ハヤト君も、弟子を取ったんだって"],
   ["セキ","地下で、毎日打たせているそうだよ。……ずいぶん、急がせているらしい"],
   ["","その足で、港の外れの古い倉庫へ向かった。"],
   ["","地下の賭場跡。奥の卓に、ハヤトと、もう一人。"],
   ["ハヤト","来たな、二代目。……こいつはカイ。俺の弟子だ"],
   ["カイ","どうも。あんたがタロウ？ 「もうワンハンドだけ」の"],
   ["タロウ","……もう言ってません"],
   ["ハヤト","一勝負やろうぜ。弟子同士だ"],
   ["","階段の上から、ジンが下りてきた。黙って、壁際の席に座る。"],
   ["師匠","カイは速い。速い相手に、合わせるな。降りて、待て",{mt:'guard'}],
   ["師匠","カイは先に打ってくる。……だから、こっちが打つ場所を選べ",{mt:'attack'}],
   ["師匠","カイは、考える前に賭ける。速さを見ろ。手は、そこに出る",{mt:'read'}],
   {lesson:"急がない",body:"相手が速く、大きく賭けてくると、こっちも急ぎたくなる。だが、勝負する手を選ぶのはお前だ。カイのチップを全部取れば勝ちだ。"},
   ["","（最初の1ハンドは、自動で進みます）",{rush:1}],
   ["カイ","先に言っとく。俺は、待つのが嫌いだ"]],outro:[
   ["カイ","……くそ。待たれた"],
   ["ハヤト","カイ。今日は、もうワンハンドもなしだ"],
   ["カイ","師匠、俺……"],
   ["ハヤト","半人前、とは言わねえよ。……言われたほうがどうなるか、俺が一番知ってる"],
   ["","ハヤトは、空のポケットに手を入れた。昔ジンにもらったチップは、もう二代目に渡してある。"],
   ["ジン","……ハヤト。来月、王冠だ。弟子を連れてこい"],
   ["ハヤト","言われなくても"],
   ["","帰り道、師匠は一度だけ足を止めた。"],
   ["師匠","タロウ。……さっきは、悪かった"],
   ["タロウ","え？ 何がですか"],
   ["ジン","……聞こえていなかったなら、それでいい"],
   {p2preview:4}],lose:"急ぐな。カイの速さに、合わせるな"},
{no:14,p2:4,lamp:"#c9a0ff",bgm:6,title:"孫弟子",venue:"ポーカールーム「王冠」",color:"#e3d4ff",goalText:"トーナメントで優勝する（最後の一人になる）",goal:{type:'bust'},tells:true,levels:[[1000,2000],[1500,3000],[2000,4000],[2500,5000],[3000,6000],[4000,8000],[5000,10000]],levelHands:6,you:60000,blinds:[1000,2000],opps:[{name:'カイ',style:'kai',chips:60000,label:'速い'},{name:'ソウゲン',style:'nit2',chips:60000,label:'動かない'},{name:'クロウ',style:'crow',chips:60000,label:'読めない'}],extras:[{name:'ミヤコ',style:'tight',chips:60000}],seatPlan:['e0','p0','p1','p2'],intro:[
   {p2door:4},
   ["","ポーカールーム「王冠」。今日は、看板持ちだけの卓が立つ。"],
   ["","汐見、霧崎、その先の港町からも、古い看板を持った人たちが集まっていた。"],
   ["クロダ","ようこそ。本日は、港の看板持ちによるトーナメントです"],
   ["クロダ","お席はこちらでお決めしています。あなたは1番のお席へどうぞ"],
   ["クロウ","今日は、ただの客です。……誘う側からは、降りましたので"],
   ["ミヤコ","やあ。今日はスチールさせないよ"],
   ["カイ","この前の続きだ、タロウ"],
   ["","窓際の席に、白髪の老人が座っていた。霧崎の古い店「鯨波」の主、ソウゲン。"],
   ["ソウゲン","……その座り方。ジンに習ったか"],
   ["師匠","はい"],
   ["ソウゲン","そうか。……イサナの孫弟子か"],
   ["","師匠は、その名前を初めて聞いた。"],
   ["","観客席のジンが、グラスを持つ手を止めた。"],
   ["ソウゲン","イサナは、わしの兄弟子だ。四十年前、波の紋の封を受け取って、出ていった"],
   ["ソウゲン","……あとのことは、ジンに聞け"],
   ["師匠","5人いれば、待つ時間も長い。降りて、ブラインドが上がる前に一度だけ行け",{mt:'guard'}],
   ["師匠","ブラインドが上がったら、先に打った者が残る",{mt:'attack'}],
   ["師匠","5人分の顔がある。……一番よくしゃべる顔から、見ろ",{mt:'read'}],
   {lesson:"看板持ちのテーブル",body:"5人のトーナメントだ。ハンドが進むと、ブラインドが上がっていく。最後の一人になれば優勝だ。"}],outro:[
   ["カイ","……負けた。また、待たれた"],
   ["","観客席の後ろで、ハヤトが立ち上がった。ジンが、その隣に並んだ。"],
   ["ジン","……ハヤト"],
   ["ジン","……お前も、一人前だ"],
   ["","ハヤトは何か言おうとして、やめた。黙って、カイの肩を叩いた。"],
   ["ハヤト","……帰るぞ、カイ。俺たちも、まだ途中だ"],
   ["ソウゲン","イサナの孫弟子の、そのまた弟子か。……長生きは、するもんだな"],
   ["クロウ","看板を持つ者は、挑まれたら断れません。……次は、どなたが挑むのでしょうね"],
   ["","クロウの視線の先に、タロウがいた。"],
   ["タロウ","……〈呼〉。最後の試験、やってください"],
   ["師匠","……錨亭で待つ"],
   {p2preview:5}],lose:"ブラインドが上がる前に、勝負どころを選べ"},
{no:15,p2:5,lamp:"#ffb15a",bgm:7,title:"最後のテル",venue:"錨亭、閉店後",color:"#ffe0b8",goalText:"師匠のクセを読み切る",goal:{type:'final'},tells:true,script:"mfinal",you:80000,blinds:[1000,2000],opps:[{name:'師匠',style:'mentor',chips:80000,label:'二代目'}],intro:[
   {p2door:5},
   ["","錨亭、閉店後。店主が看板の灯りを消した。"],
   ["店主","今度は、あんたが座る番だね"],
   ["","カウンターの奥の席に、ジンが座っている。今日は、カードを持たない。"],
   ["","封筒に書かれた日付は、明日だった。"],
   ["師匠","タロウ。座れ"],
   ["師匠","もう、一人前だ。……だから、本気で打つ"],
   ["","ジンが、目を細めた。"],
   ["ジン","……俺は、それを先に言えなかった"],
   ["師匠","ヘッズアップだ。俺と一対一で打つ"],
   ["師匠","俺にもクセがある。……見つけてみろ"],
   {tellLesson:true},
   ["タロウ","……はい"]],outro:()=>[].concat(S&&S.finalRead?[
   ["師匠","……降りたか"],
   ["","師匠が手を開いた。9のスリーカード。降りていなければ、負けていた。"],
   ["師匠","今のが、俺のクセだ。昔、何度も読まれた。……直さずに、取っておいた"]]:[
   ["師匠","……チップを全部取られたか。読み合い以前の話だな"],
   ["師匠","まあいい。最後まで座っていたのは、お前だ"]],[
   ["ジン","……三代目、か"],
   ["","ジンが、チップを一枚、指の上で転がした。王冠の帰り道に一度だけ見た、あのしぐさだ。"],
   ["","そして、声を出して笑った。錨亭の誰も、聞いたことのない笑い声だった。"],
   ["","錨亭の壁。写真が二枚、新しく貼られた。",{photos:1}],
   ["","ジン、師匠、ハヤト、タロウ。壁の写真は、四枚になった。",{photos:1}],
   ["ゲン","おう、終わったか！ 一杯やろうぜ！"],
   ["","翌朝。"],
   ["","師匠は、波の紋の封筒を上着の内ポケットに入れた。"],
   ["師匠","外海の卓に行ってくる。……店を頼む"],
   ["タロウ","はい。……いってらっしゃい"],
   ["ジン","……あの人に会ったら、よろしく言っておけ"],
   ["","師匠の背中が、朝の港に消えていった。"],
   ["","その日も、タロウは錨亭の奥の卓に座った。「もうワンハンドだけ」とは、もう言わなかった。"],
   ["","LAST TELL　第二部　―完―"]]),lose:"見えたものを信じろ。……俺のクセは、お前のためにある"}];
const P2_STUMBLE=[
   ["","タロウが、最後のチップを押し出した。"],
   ["","カイが手を開く。クイーンのペア。タロウの負けだ。"],
   ["師匠","……まだ半——"],
   ["ジン","それは、俺の失敗だ。真似するな"],
   ["","師匠は、しばらく黙っていた。"],
   ["師匠","月影では2回、ちゃんと降りた。そこだけ数えろ",{mt:'guard'}],
   ["師匠","勝負に行ったのは、悪くない。行く場所を選べ。そこだけ直せ",{mt:'attack'}],
   ["師匠","カードだけ見て決めたな。次は、カイの顔を見てから決めろ",{mt:'read'}],
   ["ハヤト","……今のは、数えない。座り直せ"],
   ["ハヤト","俺も昔、同じことを言われかけた。言いかけた人は、今そこで黙ってる"],
   ["","チップが配り直された。ここからが、本番だ。"]];
const P2_FACE=[
   ["","師匠が、初めてまっすぐにこちらを向いた。",{face:1}],
   ["師匠","……タロウ。これが、最後のハンドだ",{face:1}]];
const P2_ALT=[
   ["師匠","……コールしたか"],
   ["","師匠が手を開いた。9のスリーカード。"],
   ["師匠","あのクセは、本物だ。見えていたはずだがな"],
   ["師匠","……まだ早かったか。もう一度だ"]];
const P2_BRIDGE=[{roll:true},{part:'第二部',title:'師匠'}];
Object.assign(REAL,{
  '師匠':{...heroReal(true,LOOK_DEF),rank:4},   // 年を取ったアオ。描くたびに「身なり」から作り直す（avatar）
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
STYLES.kai={hi:1.55,mid:1.2,midP:.5,bluff:.16,margin:0,defPre:0,defPost:0};
STYLES.mentor={...STYLES.jin};STYLES.kai.read=.6;
Object.assign(ENTER,{'カイ':.65,'ミヤコ':1,'ソウゲン':1.1,'師匠':1});
Object.assign(TELLS,{'ミヤコ':{strong:{cue:'still',rate:.65,false:.1},bluff:{cue:'talk',rate:.65,false:.1}},
  'カイ':{strong:{cue:'stare',rate:.65,false:.1},bluff:{cue:'fast',rate:.7,false:.1}},
  'ソウゲン':{strong:{cue:'glance',rate:.6,false:.1},bluff:{cue:'still',rate:.6,false:.1}}});
Object.assign(NANORI,{"ミヤコ": "汐見「舫」の主", "カイ": "ハヤトの弟子", "ソウゲン": "霧崎「鯨波」の主", "師匠": "王冠の看板の主"});
Object.assign(INTRO,{"ミヤコ": ["汐見「舫」の主", "さ、座りな"], "カイ": ["ハヤトの弟子", "俺は、待つのが嫌いだ"], "ソウゲン": ["霧崎「鯨波」の主", "その座り方、誰に習った"], "師匠": ["王冠の看板の主", "もう、一人前だ。……だから、本気で打つ"]});
Object.assign(THINK,{"ミヤコ": ["ふん", "さて、どうするかね"], "カイ": ["……", "早く"], "ソウゲン": ["……ふむ", "……"], "師匠": ["……", "……ふむ"]});
Object.assign(FACING,{"ミヤコ": ["よく来るね"], "カイ": ["来いよ"], "ソウゲン": ["……ほう"], "師匠": ["……来たか"]});
Object.assign(LINES,{"ミヤコ": {"fold": ["ここは引くよ"], "win": ["舫は、ほどけないよ"], "allin": ["全部だよ"]}, "カイ": {"fold": ["ちっ、次だ"], "win": ["待たないのが、俺の打ち方だ"], "allin": ["全部いく"]}, "ソウゲン": {"fold": ["……降り"], "win": ["長生きは、するもんだ"], "allin": ["……全部だ"]}, "師匠": {"fold": ["降りる"], "win": ["まだ、譲らん"], "allin": ["全部だ"]}});
CUE_LABEL.size='いつもと違う大きさで賭けた';CUE_SFX.size='ドン';CAM_SPOT.size={chips:1};
const P2_TYPES={"guard": ["守りの師匠", "降りるのも勝負のうちだ"], "attack": ["攻めの師匠", "先に打ったほうが、話を決める"], "read": ["読みの師匠", "手を見るな、顔を見ろ"], "plain": ["ふつうの師匠", "降りるのも勝負のうちだ"]};
const P2_OPEN={"guard": "弱い手は降りろ。……降りた回数を、数えておけ", "attack": "いい手が来たら、こっちから上げろ。待つのは、そのあとだ", "read": "賭ける前に、相手の顔を一回見ろ"},P2_CATCH={"guard": "降りるのも勝負のうちだ", "attack": "いい降り方だ。次は、先に打て", "read": "顔を見て降りたな。それでいい"};
const P2_TELLW={"size": "賭ける額", "time": "賭ける早さ", "body": "チップを見る目線"},P2_CUE={"size": "size", "time": "fast", "body": "glance"},P2_CUT={"glance": "師匠が、自分のチップをちらっと見た。", "fast": "師匠が、考えずにすぐ賭けた。", "size": "師匠が、いつもと違う大きさで賭けた。"},P2_NOUN={"still": "固まり方", "glance": "チップを見る目", "smile": "口元", "stare": "視線", "talk": "口数", "fast": "速い賭け方", "sweat": "汗", "scar": "傷に触れる指", "glove": "手袋の指先", "release": "傷から離れる指"};
const P2_PREV={"2": {"boss": "ミヤコ", "sign": "汐見「舫」", "line": "あんたの師匠より、よくしゃべるね"}, "3": {"boss": "カイ", "sign": "地下の賭場跡", "line": "俺は、待つのが嫌いだ"}, "4": {"boss": "ソウゲン", "sign": "王冠", "line": "……その座り方。ジンに習ったか"}, "5": {"boss": "師匠", "sign": "錨亭、閉店後", "line": "もう、一人前だ。……だから、本気で打つ"}};
const P2_ROLL=["錨亭", "銀の扉", "月影", "天空", "地下", "王冠"],P2_CAST=["ジン", "ゲン", "店主", "ロク", "ハル", "セキ", "ミナ", "レイカ", "ソウ", "ハヤト", "テツ", "クロウ", "クロダ", "カオル", "ゴウ", "タロウ"];
TITLES.push({id:'sandaime',name:"三代目",hint:"第二部をクリアする",jin:"三代目か。……あいつも、師匠の顔になったな。"},{id:'uketsugi',name:"受け継いだクセ",hint:"第二部の最終章で、師匠のクセを読み切って降りる",jin:"師匠のクセを読んだか。……俺のときと、同じ顔をしていたぞ。"},{id:'hanninmae',name:"半人前と言わない",hint:"第二部を一度も負けずにクリアする",jin:"……一度も言わずに済んだか。あいつは、俺より上手く教えたな。"});
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
const mentorName=()=>heroName();
const callName=()=>heroName()+'さん';   // 英語では翻訳器が「さん」を落とす
const P2ON=()=>typeof CFG!=='undefined'&&!!CFG&&!!CFG.ch&&!!CFG.ch.p2;
function chLab(c){return c&&c.p2?'第二部　第'+c.p2+'章':'第'+(c?c.no:'')+'章'}
// 場面の行：型で分かれる行と、記録から作る行
function p2Expand(lines){const t=p2Type(),st=loadP2(),out=[];
  (lines||[]).forEach(l=>{
    if(Array.isArray(l)){const m=l[2]||{};if(m.mt&&m.mt!==t)return;if(m.rush&&st.rush)return;
      out.push(l[1].includes('〈呼〉')?[l[0],l[1].split('〈呼〉').join(callName()),l[2]]:l);return}
    if(l&&l.fav){const f=st.fav;if(!f)return;const T=TELLS[f],cue=T&&T.strong&&T.strong.cue,nn=P2_NOUN[cue];if(!nn)return;
      out.push(['師匠',`${f}の${nn}は、何度も見た。……顔は、嘘をつけない`]);return}
    if(l&&l.tellLesson){out.push({lesson:'最後のテル',body:`第一部で、俺がいちばん多く相手に読まれたクセは「${SELF_WHY[{time:'fast'}[st.tell]||st.tell||'body']}」だ。そのクセは、まだ直していない。本物か、罠か。読み切って決めろ。`});return}
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
        S.players.forEach(p=>{if(p.human){p.chips=p.start=ch.you}else p.chips=p.start;p.out=false});S.rushLost=false;S.chipsReset=S.handNo+1;  // 台本で全員のチップを配り直した（自動検査はこのハンドの増減を数えない）
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
function p2Quote(ch){return mentorName()+'「'+(typeof ch.outro==='function'?'もう、一人前だ':({1:'今のが最後だ。……降りられる奴だけが、明日も打てる',2:'……しゃべりすぎたか',3:'タロウ。……さっきは、悪かった',4:'……錨亭で待つ'})[ch.p2])+'」'}
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
    bx.innerHTML=`<span class="lesson-tag">第一部　弟子</span><div class="credits">${P2_CAST.map(n=>`<span>${esc(n)}</span>`).join('')}<span class="you">${esc(hx('そして、〈主〉'))}</span></div><p class="rollskip">タップで飛ばせます</p>`;
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