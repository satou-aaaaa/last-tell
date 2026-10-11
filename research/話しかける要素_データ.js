// 話しかける要素 データ（2026-10-10、satou「全部よさそうですね」で全5案採用）
// 仕様：research/話しかける要素_実装仕様.md
// {n}=噂の相手、{s}=話している人、{cue}=CUE_RUMOR の文。英語の人名は今の名前の訳（t(name)）を使う。
// お金の話なし／「夜」なし。見た目・国・体のことは噂にしない（打ち方・クセ・人柄だけ）。

// ===== 案1：話題（「💬 話す」で相手を選んだあとに出す3つ） =====
const TALK_TOPICS=[
  {k:'mood', ja:'調子どう？',            en:'How’s it going?'},
  {k:'about',ja:'{n}のこと、知ってる？', en:'Know anything about {n}?'},
  {k:'self', ja:'ここ、長いの？',        en:'Been coming here long?'}
];

// クセ（cue）を噂の文にする。主語なしの動詞句（英語は三人称単数）
const CUE_RUMOR={
  glance:{ja:'自分のチップをちらっと見る', en:'glances at their own chips'},
  still: {ja:'急に動かなくなる',           en:'goes suddenly still'},
  smile: {ja:'口元が緩む',                 en:'can’t keep the corner of the mouth still'},
  stare: {ja:'こっちをじっと見てくる',     en:'stares right at you'},
  talk:  {ja:'口数が増える',               en:'starts talking more'},
  fast:  {ja:'考えずにすぐ賭ける',         en:'bets without thinking'},
  sweat: {ja:'汗をかく',                   en:'starts to sweat'}
};
// 噂の型。cat=strong（強い手のとき）／bluff（ブラフのとき）
const RUMOR_TPL={
  strong:[{ja:'{n}は、強い手のとき{cue}らしいよ', en:'They say {n} {cue} when holding something strong.'},
          {ja:'{cue}ときの{n}は、本物だって',     en:'When {n} {cue}, it’s the real thing. So I hear.'}],
  bluff: [{ja:'{n}は、ブラフのとき{cue}らしいよ', en:'They say {n} {cue} when bluffing.'},
          {ja:'{cue}ときの{n}は、たいてい嘘だって', en:'When {n} {cue}, it’s usually a lie. So I hear.'}]
};
// 打ち方の噂（LEAKS の view をそのまま使う。{n} は相手の名前に置き換え）。前置きだけここに置く
const LEAK_LEAD={ja:'打ち方の話だけど……', en:'About how they play…'};

// 話す人ごとの「当たりやすさ」。true=今のクセどおり、old=もう当てはまらないクセ、plant=わざと逆を言う、flavor=人柄の話だけ
// 合計1。ここに無い人は _（ふつうの常連）
const SRC_TRUST={
  _:      {true:.55,old:.3,plant:0,flavor:.15},
  'ソウ': {true:.9,old:0,plant:0,flavor:.1},
  'テツ': {true:.8,old:.1,plant:0,flavor:.1},
  'ドク': {true:.8,old:.15,plant:0,flavor:.05},
  'マリア':{true:.7,old:.1,plant:0,flavor:.2},
  'シオン':{true:.75,old:.15,plant:0,flavor:.1},
  'アイシャ':{true:.6,old:.2,plant:0,flavor:.2},
  'ソフィア':{true:.75,old:.15,plant:0,flavor:.1},
  'ヨシオ':{true:.45,old:.45,plant:0,flavor:.1},   // 解説好き。古い話が多い
  'カズ': {true:.35,old:.55,plant:0,flavor:.1},    // 同じ話を毎回する
  'アキラ':{true:.5,old:.35,plant:0,flavor:.15},
  'ルカ': {true:.4,old:.2,plant:.3,flavor:.1},     // liar2
  'ガン': {true:.3,old:.2,plant:.4,flavor:.1},     // ハヤトのことは盛る
  'ミン': {true:.5,old:.2,plant:.2,flavor:.1},
  'レイカ':{true:.3,old:.1,plant:.5,flavor:.1},
  'クロウ':{true:.2,old:.1,plant:.6,flavor:.1},
  'ハヤト':{true:.3,old:.2,plant:.4,flavor:.1},
  'カオル':{true:.4,old:.1,plant:.4,flavor:.1},
  'タケル':{true:.85,old:.05,plant:0,flavor:.1}    // 筆談。見ている人
};

// 前置き（話す人の口調）。無い人は性格の型 _ から
const HEAR_LEAD={
  _:       [{ja:'{n}？ ……聞いた話だけど', en:'{n}? …Just something I heard.'}],
  'ソウ':  [{ja:'あ、あの……{n}さんのことなら、少しだけ', en:'Oh, um… about {n}, I know a little.'}],
  'テツ':  [{ja:'{n}か。いいだろう、教えてやる', en:'{n}? Fine, I’ll tell you.'}],
  'ドク':  [{ja:'……{n}のことは、昔から見とる', en:'…I’ve been watching {n} a long time.'}],
  'マリア':[{ja:'言葉より手を見るの。{n}はね', en:'Watch hands, not words. With {n}…'}],
  'シオン':[{ja:'{n}？ 手元なら見てるよ', en:'{n}? I watch their hands.'}],
  'アイシャ':[{ja:'{n}さん？ 流れを見てるとね', en:'{n}? If you watch the flow…'}],
  'ヨシオ':[{ja:'{n}はね、こう見えて……知らんけど', en:'{n}, see, looks can fool you… or not, who knows.'}],
  'カズ':  [{ja:'{n}？ この前さ、同じ卓でさ……', en:'{n}? So the other day, same table…'}],
  'ガン':  [{ja:'{n}？ 俺に聞くの、正解だぜ', en:'{n}? You asked the right guy.'}],
  'タケル':[{ja:'（メモ）{n}：', en:'(Note) {n}:'}],
  'ソフィア':[{ja:'どの港にも、{n}みたいな人はいる', en:'Every port has someone like {n}.'}],
  'クロウ':[{ja:'{n}様のことでしたら、ひとつだけ', en:'Regarding {n}, just one thing.'}],
  'レイカ':[{ja:'{n}？ 教えてあげてもいいけど', en:'{n}? I could tell you, I suppose.'}]
};

// 第1〜3章（クセの噂を出さない章）と flavor のとき：人柄の話。相手の PROFILE の1行目を使う
const FLAVOR_TPL={ja:'{n}？ {line}って聞いたよ', en:'{n}? I heard {line}.'};
// ジン・師匠のことを聞かれたとき（どの章でも。本物のテルには触れない）
const JIN_FLAVOR=[
  {ja:'ジンさんのことは、誰も聞けないんだよ', en:'Nobody asks about Jin.'},
  {ja:'昔のジンさんを知ってる人は、みんな「手を見るな、顔を見ろ」って言うね', en:'Everyone who knew Jin back then says the same: “Don’t watch the hands. Watch the face.”'},
  {ja:'ジンさん？ ……あの人の前では、噂は役に立たないよ', en:'Jin? …Rumors don’t help you against him.'}
];
// ジン・師匠本人に話しかけたとき（今と同じ）
const JIN_NOTALK={ja:'……打て。話は、あとだ', en:'…Play. Talk later.'};

// 「ここ、長いの？」の答え（人物の話。ゲームには効かない。常連レベルで1行増やしてもよい）
const SELF_ANS={
  'マツ':{ja:'……船を降りてから、ずっとここだ', en:'…Been here since I left the ship.'},
  'ナギ':{ja:'閉店までいて、そのまま市場に行くの。長いっていうか、毎日', en:'I stay till closing and go straight to the market. Not long—just every day.'},
  'アデ':{ja:'月に一度、船が入るたびに。船は待ってくれないからね', en:'Once a month, whenever my ship is in. Ships don’t wait.'},
  'マリア':{ja:'店主とは25年。ここのことなら、だいたい知ってるわ', en:'Twenty-five years with the owner. I know most things about this place.'},
  'ヨシオ':{ja:'十年。解説させたら、ここで一番だよ。……知らんけど', en:'Ten years. Best commentator in the house. …Probably.'},
  'リン':{ja:'ハルに連れてこられただけ。見るだけ見るよ', en:'Hal dragged me here. I’ll watch, at least.'},
  'ハンナ':{ja:'入口の段差がなくなってから、毎週来てる', en:'Every week, ever since the step at the door was fixed.'},
  'ラジ':{ja:'仕事の書類が片づいた日だけ。楽しんだもん勝ちさ', en:'Only on days the paperwork’s done. Whoever has fun wins.'},
  'カズ':{ja:'長いよ。この前さ、AAで入ったのに……あ、その話はいい？', en:'Long time. So the other day, I had aces and… oh, you’ve heard it?'},
  'サヤ':{ja:'半年くらい。勝つ確率、まだ3割くらい', en:'About half a year. Still winning about 30% of the time.'},
  'ウォルター':{ja:'港を撮りに来て、30年。降りないのも、たしなみさ', en:'Came to photograph the harbor. Stayed thirty years. Not folding is good manners.'},
  'スミン':{ja:'次の曲までの休憩だけ。音を聞いてると、卓も見えるの', en:'Just between sets. Listening helps me see the table too.'},
  'シオン':{ja:'ここのディーラーの手元を見るのが好きで。ボタン、動いてないよ', en:'I like watching the dealers here. —The button hasn’t moved, by the way.'},
  'アキラ':{ja:'どこの大会にも出てるよ。この前の大会でさ……', en:'I play every tournament in town. At the last one…'},
  'ルカ':{ja:'ストラドルのある店が好きでね。押せば動く', en:'I like rooms with a straddle. Push and things move.'},
  'アイシャ':{ja:'研究の合間に。卓にも、海と同じで流れがあるの', en:'Between research. Tables have currents too, like the sea.'},
  'ガン':{ja:'ハヤトさんに会いたくて来た。……まだ名前、覚えてもらってないけど', en:'Came to meet Hayato. …He hasn’t learned my name yet.'},
  'ドク':{ja:'……ここが賭場だったころからだ。若いな', en:'…Since this was still a gambling den. You’re young.'},
  'ベン':{ja:'この倉庫、昔はわしのものだった。小さく、ゆっくりな', en:'This warehouse used to be mine. Small and slow, now.'},
  'ミン':{ja:'仕事のあと。溶接と同じで、熱いうちに', en:'After work. Like welding—while it’s hot.'},
  'レン':{ja:'大会のたびに来て、毎回出直してる。次は本気出す', en:'Every tournament, and every time I start over. Next time I’ll get serious.'},
  'イオリ':{ja:'短い勝負のときだけね。短いほうが、得意なの', en:'Only for short matches. I’m better when it’s short.'},
  'ソフィア':{ja:'遠い港で、ここの看板戦のうわさを聞いて来たの', en:'I heard about the feature match here in a faraway port.'},
  'タケル':{ja:'（メモ）生まれも育ちもこの街。目で話そう', en:'(Note) Born and raised in this town. Let’s talk with our eyes.'},
  'ゲン':{ja:'船を降りてからは、ずっと錨亭よ。酒もうまい', en:'Ever since I left the ship, it’s been the Anchor. Good drinks too.'},
  'ハル':{ja:'この席に座ると、勝てる気がするんです', en:'Whenever I sit in this seat, I feel like I can win.'},
  'ロク':{ja:'……この店を守って長い。うちの客は慎重だ', en:'…I’ve kept this place a long time. Our regulars are careful.'},
  'セキ':{ja:'月影の音と同じくらい、ここは長いね', en:'About as long as the music at Moonshade.'},
  'ミナ':{ja:'歌の休みに座るの。ふふ、負けないよ？', en:'I sit in between songs. I won’t lose, you know.'},
  'レイカ':{ja:'配る側にいたころから。……それ以上は秘密', en:'Since I was dealing. …The rest is a secret.'},
  'ソウ':{ja:'あ、レイカさんについて来て、まだ一年です', en:'Oh, I came with Reika. Only a year so far.'},
  'テツ':{ja:'地下が地下だったころからだ', en:'Since the underground really was underground.'},
  'ハヤト':{ja:'長さで勝てるなら苦労しねえよ、二代目', en:'If time spent won hands, nobody would struggle, Second.'},
  'ゴウ':{ja:'新人が気にすることじゃねえ', en:'Not your concern, rookie.'},
  'カオル':{ja:'王冠ができたときから、受付も卓もね', en:'Since the Crown opened. The front desk and the tables.'},
  'クロウ':{ja:'長さより、深さのほうでございます', en:'Not how long, but how deep.'}
};

// ===== 案2：卓に着く前に、誰に聞くか選ぶ（第4〜7章。2人まで） =====
// kind: true／old／plant／flavor。cue・cat は答え合わせ用（flavor は無し）。leak は LEAKS の打ち方の噂
// 実行時に TELLS と照らして、true と書いたのに合わない行があれば QA で落とす（§6）
const PRE_ASK={
  4:{boss:'レイカ',people:[
    {who:'ソウ',hint:{ja:'レイカの後輩。正しいが、自信なさげ',en:'Reika’s junior. Usually right, never sure.'},
     ja:'レイカさん、強いときは自分のチップをちらっと見るんです。……たぶん',en:'When Reika’s strong, she glances at her chips. …I think.',kind:'true',cue:'glance',cat:'strong'},
    {who:'バーテンダー',hint:{ja:'店のことに詳しい',en:'Knows the place well.'},
     ja:'レイカさんは、長く座るほど読みにくくなるって、よく言われてますよ',en:'People say Reika gets harder to read the longer she sits.',kind:'true',cue:null,cat:null,note:'reverse'},
    {who:'常連',hint:{ja:'話を盛る。古い話も混ざる',en:'Exaggerates. Some stories are old.'},
     ja:'レイカは汗をかいたら勝負手だってさ',en:'Word is, when Reika sweats, she’s got it.',kind:'old',cue:'sweat',cat:'strong'},
    {who:'アキラ',hint:{ja:'今日の卓の客。大会好き',en:'At your table today. Loves tournaments.'},
     ja:'レイカさん、ブラフのときはよくしゃべるよ。大会でも見た',en:'Reika talks a lot when she’s bluffing. Saw it at a tournament.',kind:'true',cue:'talk',cat:'bluff'}]},
  5:{boss:'ハヤト',people:[
    {who:'テツ',hint:{ja:'ハヤトの昔なじみ。口は悪いが正確',en:'Hayato’s old acquaintance. Rough, but accurate.'},
     ja:'ハヤトが急に動かなくなったら、要注意だ',en:'If Hayato suddenly goes still, watch out.',kind:'true',cue:'still',cat:'strong'},
    {who:'ドク',hint:{ja:'子どものころのハヤトを知っている',en:'Knew Hayato as a kid.'},
     ja:'……あの子がこっちをじっと見るときは、たいてい嘘だ。昔からな',en:'…When that boy stares at you, it’s usually a lie. Always was.',kind:'true',cue:'stare',cat:'bluff'},
    {who:'常連',hint:{ja:'話を盛る。古い話も混ざる',en:'Exaggerates. Some stories are old.'},
     ja:'ハヤトは絶対にブラフしないって話だぜ',en:'They say Hayato never bluffs. Ever.',kind:'old',cue:null,cat:null},
    {who:'ガン',hint:{ja:'ハヤトにあこがれている',en:'Idolizes Hayato.'},
     ja:'ハヤトさんはな、汗ひとつかかずに勝つんだ。汗かいてたら、それは罠だぜ',en:'Hayato wins without breaking a sweat. If he’s sweating, it’s a trap.',kind:'plant',cue:'sweat',cat:'strong'}]},
  6:{boss:'クロウ',people:[
    {who:'カオル',hint:{ja:'王冠の受付。クロウとは長い',en:'The Crown’s front desk. Knows Crow well.'},
     ja:'クロウさんが笑ったら……どうだったかしら。誰も確かめたことがないの',en:'When Crow smiles… hm. Nobody’s ever checked.',kind:'true',cue:'smile',cat:'bluff'},
    {who:'常連',hint:{ja:'よく見ている古株',en:'An old hand who watches closely.'},
     ja:'本当に迷ったときだけ、白い手袋に触るって聞いたことがある',en:'I heard he touches his white glove only when he’s truly unsure.',kind:'true',cue:'glove',cat:null},
    {who:'ソフィア',hint:{ja:'世界の港を回るプロ',en:'A pro who travels the world’s ports.'},
     ja:'クロウ？ 大きな勝負からは降りられない人よ。どの港でも同じ',en:'Crow? He can’t walk away from a big pot. Same in every port.',kind:'true',cue:null,cat:null,leak:'bigPot'},
    {who:'イオリ',hint:{ja:'クロウと同じ卓になると、先に帰る',en:'Leaves early whenever she draws Crow’s table.'},
     ja:'クロウさん、ブラフのときは考えずにすぐ賭けるわよ。……前はそうだった',en:'Crow bets right away when he’s bluffing. …He used to, anyway.',kind:'old',cue:'fast',cat:'bluff'}]},
  7:{boss:'ジン',people:[   // 第7章は flavor と old だけ。本物のテル（release・顎の傷）には誰も触れない
    {who:'店主',hint:{ja:'錨亭の店主',en:'Owner of the Anchor.'},ja:'ジンさんの顎の傷のこと、誰も聞けないんだよ',en:'Nobody can ask Jin about the scar on his chin.',kind:'flavor'},
    {who:'ゲン',hint:{ja:'昔からの常連',en:'A regular from way back.'},ja:'ジンさんはな、降りるときだけ、ちょっと笑うんだ',en:'Jin smiles a little, only when he folds.',kind:'old',cue:'smile',cat:null},
    {who:'マリア',hint:{ja:'ジンの昔を少しだけ知っている',en:'Knows a little of Jin’s past.'},ja:'言葉より、手を見るの。……でも、あの人の手は何も言わない',en:'Watch hands, not words. …But his hands never say anything.',kind:'flavor'},
    {who:'マツ',hint:{ja:'無口な元船長',en:'A quiet former captain.'},ja:'……あの日から、あいつは同じ席にしか座らん',en:'…Since that day, he only sits in the same seat.',kind:'flavor'}]}
};
const PRE_ASK_TITLE={ja:'{venue}　あと{k}人に聞ける',en:'{venue} — you can ask {k} more'};
const PRE_ASK_DONE={ja:'もう聞けない',en:'No one else to ask'};
const PRE_ASK_JIN={ja:'噂は噂だ。誰から聞いたかも、覚えておけ',en:'A rumor is a rumor. Remember who told you, too.'};

// ===== 案3：ディーラーに聞く（公開後） =====
const DEALER_TOPICS=[
  {k:'hand', ja:'{n}の手、見えた？',     en:'Did you see {n}’s cards?'},
  {k:'since',ja:'{n}、いつから座ってるの？', en:'How long has {n} been sitting here?'},
  {k:'new',  ja:'初めて見る人、いる？',   en:'Anyone new today?'}
];
const DEALER_ANS={
  hand: [{ja:'手のことは、お答えできません',en:'I can’t talk about anyone’s cards.'},{ja:'それは、ご自分の目で',en:'That you’ll have to see for yourself.'}],
  hurry:[{ja:'開店からずっとですよ。そろそろ帰るって、さっき言ってました',en:'Since we opened. Said a moment ago they’d be leaving soon.'}],
  hot:  [{ja:'さっきの大きいハンドから、ちょっと落ち着かないみたいです',en:'They’ve seemed a bit unsettled since that big hand.'}],
  calm: [{ja:'いつもどおりですよ。ゆっくりしていかれるみたいです',en:'Same as always. Looks like they’re staying a while.'}],
  lucky:[{ja:'今日はよくカードが来てるみたいですね',en:'The cards seem to be finding them today.'}],
  new:  [{ja:'{n}さんは、今日が初めてです',en:'{n} is here for the first time today.'},{ja:'今日はみなさん、顔なじみですよ',en:'Everyone here today is a familiar face.'}]
};

// ===== 案4：聞いた話をぶつける（公開後） =====
const CONFRONT_MENU={ja:'聞いた話：{rumor}',en:'What I heard: {rumor}'};
const CONFRONT_HIT={  // 当たっていた
  _:      [{ja:'……誰に聞いたの',en:'…Who told you that?'},{ja:'な、なんのことだよ',en:'W-what are you talking about?'}],
  'レイカ':[{ja:'……誰に聞いたの',en:'…Who told you?'}],
  'クロウ':[{ja:'ほう。よく調べておいでで',en:'Oh? You’ve done your homework.'}],
  'ハヤト':[{ja:'へえ。誰の入れ知恵だ、二代目',en:'Huh. Who’s been coaching you, Second?'}]
};
const CONFRONT_MISS={  // 外れていた
  _:      [{ja:'へえ、そんな話になってるんだ',en:'Huh. So that’s the story going around.'},{ja:'ふうん。それ、誰の話？',en:'Hm. Whose story is that?'}]
};
const CONFRONT_SEALED={ja:'{n}は、この卓ではもうそのクセを見せなくなった',en:'{n} won’t show that habit again at this table.'};
const CONFRONT_JIN={ja:'口で勝とうとするな',en:'Don’t try to win with your mouth.'};

// ===== 案5：話を交換する（公開後） =====
const TRADE_ASK={ja:'教えてもいい。代わりに、{t}のクセ、何か見つけた？',en:'I could tell you. In return—found any habits on {t}?'};
const TRADE_OPTS=[{ja:'やめとく',en:'Never mind'},{ja:'教える：{t}は{note}',en:'Tell: {t} {note}'}];
const TRADE_NO={ja:'そう。じゃあ、この話はなし',en:'Fine. Then no deal.'};
const TRADE_NOTICED=[
  {ja:'……俺のこと、誰かに話したろ',en:'…You told someone about me, didn’t you?'},
  {ja:'わたしのクセ、誰かから聞いたでしょう',en:'You heard about my habits from someone, didn’t you?'}
];
const TRADE_TRADERS=['シオン','ヨシオ','ガン','ミン','ルカ','ソフィア','カオル'];  // 交換を持ちかける人（このうち同じ卓にいる人だけ）

// ===== 実装時に足したもの（2026-10-10、src/js/33_talk_hear.js と同じ） =====
// 打ち方の噂（LEAKS の種類ごと。ジンの見立てとは別の、常連の言い方）
const LEAK_RUMOR={
  chase:{ja:'{n}は、入るまで追ってくるって',en:'{n} chases until the card comes, they say.'},
  fold3b:{ja:'{n}は、やり返されると弱いらしいよ',en:'{n} folds when you raise back, they say.'},
  oneShot:{ja:'{n}は、一度しか打ってこないって',en:'{n} only fires once, they say.'},
  riverFold:{ja:'{n}は、最後に弱いらしいよ',en:'{n} gets weak on the last card, they say.'},
  stab:{ja:'{n}は、待てない人だって',en:'{n} can’t wait, they say.'},
  honestRiver:{ja:'{n}は、最後の一枚では嘘をつかないらしいよ',en:'{n} doesn’t lie on the last card, they say.'},
  heroCall:{ja:'{n}は、気に入らない相手には引かないって',en:'{n} never backs down from someone they don’t like, they say.'},
  bigPot:{ja:'{n}は、大きな勝負から降りられないらしいよ',en:'{n} can’t fold in a big pot, they say.'},
  afterLoss:{ja:'{n}は、負けたすぐあとが荒いって',en:'{n} gets wild right after losing, they say.'},
  fitFold:{ja:'{n}は、外れたらすぐ降りるらしいよ',en:'{n} folds fast when they miss, they say.'},
  pairStick:{ja:'{n}は、ペアがあれば降りないって',en:'{n} won’t fold a pair, they say.'},
  upTight:{ja:'{n}は、勝っていると守りに入るらしいよ',en:'{n} plays safe when ahead, they say.'},
  shortTight:{ja:'{n}は、チップが減ると縮こまるって',en:'{n} shrinks up when short on chips, they say.'}
};
const FLAVOR_NONE={ja:'{n}？ ……よく知らないんだ',en:'{n}? …I don’t really know.'};
