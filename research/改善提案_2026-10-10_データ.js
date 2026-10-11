// 改善提案 2026-10-10 のデータ（日本語と英語）。実装仕様：research/改善提案_2026-10-10_実装仕様.md
// 第二部（第11〜15章）の「師匠」は mentorName() に置き換える（{m}）。主人公の名前は heroName()（{h}）。

// §1 三行：何も当たらないときの1行目
const REVIEW_WIN_LINE={ // 勝ったとき（章ごと）
 1:{ja:'ゲンを飛ばした。それで十分だ',en:'You busted Gen. That\'s enough.'},
 2:{ja:'三回、盗んだな。後ろの席の使い方は覚えた',en:'Three steals. You\'ve learned what the late seats are for.'},
 3:{ja:'何もない手で、二回勝った。それが仕掛けだ',en:'Two pots with nothing. That\'s how you make a move.'},
 4:{ja:'嘘を二回、見抜いた。顔を見ていたな',en:'You caught two lies. You were watching faces.'},
 5:{ja:'少ないチップから戻した。焦らなかったな',en:'Back from a short stack. You didn\'t rush.'},
 6:{ja:'最後の一人だ。……王冠の卓でな',en:'Last one standing. At the Crown, no less.'},
 7:{ja:'……読んだな',en:'...You read it.'},
 11:{ja:'ゲンを飛ばした。最初の一歩だ',en:'You busted Gen. That\'s the first step.'},
 12:{ja:'よその店で、二回盗んだ。度胸がついたな',en:'Two steals in a strange house. You\'ve got nerve now.'},
 13:{ja:'カイに勝った。急がなかったからだ',en:'You beat Kai. Because you didn\'t hurry.'},
 14:{ja:'看板持ちの卓で、最後の一人だ',en:'Last one standing at a table of sign-holders.'},
 15:{ja:'……読んだな',en:'...You read it.'},
};
const REVIEW_LOSE_LINE={ja:'……まだ、お前の打ち方は見えてこない',en:'...I can\'t see your game yet.'};

// §3 決着の一手
// 第1〜3章・第6章：決め手が相手役でなかったとき、outro の最初の1行をこれに差し替える（{n}=決め手の相手の名前）
const OUTRO_ALT={
 2:{who:'ロク',ja:'……{n}から盗んだか。わしの番は、来なかったな',en:'...You stole from {n}. My turn never came.'},
 3:{who:'セキ',ja:'{n}を騙したね。……私の番は来なかったか。それでも、見事だった',en:'You fooled {n}. ...So my turn never came. Still, well played.'},
 6:{who:'クロウ',ja:'……見事です。最後の卓に、私はいませんでしたが',en:'...Well played. Though I wasn\'t at the final table.'},
};
// 第6章で OUTRO_ALT を使ったときは、2行目（{brk:'crow'} の行）を出さない。
// 第4・5章：一騎打ち
const FINAL_DUEL={
 4:{boss:'レイカ',
  start:[ // 一騎打ちが始まるとき（卓の上の吹き出しとログ）
   {who:'ソウ',ja:'……僕は見ています。最後は、レイカさんと',en:'...I\'ll watch. The last one should be with Reika.'},
   {who:'レイカ',ja:'最後の一手は、わたしが配って、わたしが打つ',en:'The last hand, I deal and I play.'}],
  flop:{ja:'嘘かどうか、まだ決めてないの',en:'I haven\'t decided yet whether I\'m lying.'},
  turn:{ja:'あの日も、こうやって配ったのよ',en:'I dealt it just like this that day.'},
  river:{ja:'……見て。顔じゃなくて、手を',en:'...Look. Not at my face. At my hands.'},
  lose:{ja:'残念。嘘は、もう少し上手につくものよ',en:'Too bad. A lie should be told a little better than that.'}},
 5:{boss:'ハヤト',
  start:[
   {who:'テツ',ja:'おい、見ろよ。ハヤトが一対一だってよ',en:'Hey, look. Hayato\'s going one-on-one.'},
   {who:'ハヤト',ja:'座れ。一勝負だけ、と言ったはずだ',en:'Sit. I said one game, didn\'t I.'}],
  flop:{ja:'……昔、ここでよく師匠と打った',en:'...I used to play the old man here a lot.'},
  turn:{ja:'あの人は、俺には一度もクセを見せなかった',en:'He never once showed me a tell.'},
  river:null, // リバーは今あるしかけ（焦らさずに手を開く）だけ。セリフなし
  lose:{ja:'まだだな。……焦るな、って言われなかったか',en:'Not yet. ...Didn\'t he tell you not to rush?'}},
};

// §4 負けたときの三行
const REVIEW_GOAL_LINE={ // 1行目：目標まであと何回か（{k}=できた回数、{r}=残り）
 steal:{ja:'盗めたのは{k}回。あと{r}回だった',en:'You stole {k}. {r} more would have done it.'},
 bluff:{ja:'ブラフで勝てたのは{k}回。あと{r}回だった',en:'You won {k} with a bluff. {r} more would have done it.'},
 readcall:{ja:'嘘を見抜けたのは{k}回。あと{r}回だった',en:'You caught {k} lies. {r} more would have done it.'},
 reach:{ja:'目標まで、あと少しのところまで戻した',en:'You got close to where you needed to be.'} // 数字は出さない（お金の話に聞こえないように）,
};
const REVIEW_HAND_LINE={ // 2行目：実際の1ハンド（{no}=ハンド番号、{hand}=手札「K9」、{n}=相手）
 1:{ja:'#{no}、{hand}で最後まで払ったな。あれは降りる手だ',en:'#{no}, you paid all the way with {hand}. That was a fold.'},
 2:{ja:'#{no}、後ろの席で{hand}を様子見したな。あそこが盗みどころだ',en:'#{no}, you just limped {hand} from a late seat. That was the steal.'},
 3:{ja:'#{no}、{n}が二回チェックしたのに、こっちもチェックしたな。あそこで賭けろ',en:'#{no}, {n} checked twice and you checked too. That was the spot to bet.'},
 4:{ja:'#{no}、{n}のクセが出ていたのに降りたな。顔を見ろ',en:'#{no}, {n} showed a tell and you folded. Watch the face.'},
 5:{ja:'#{no}、少ないチップで小さく入ったな。来るまで待て',en:'#{no}, you dribbled chips in on a short stack. Wait for it.'},
 6:{ja:'#{no}、ブラインドが上がる前に動かなかったな。小さくなる前に仕掛けろ',en:'#{no}, you sat still before the blinds went up. Move before you shrink.'},
 12:{ja:'#{no}、後ろの席で{hand}を様子見したな。あそこが盗みどころだ',en:'#{no}, you just limped {hand} from a late seat. That was the steal.'},
 13:{ja:'#{no}、カイに合わせて急いだな。急ぐのは向こうだけでいい',en:'#{no}, you hurried along with Kai. Let him be the one who rushes.'},
 14:{ja:'#{no}、ブラインドが上がる前に動かなかったな。小さくなる前に仕掛けろ',en:'#{no}, you sat still before the blinds went up. Move before you shrink.'},
};
const REVIEW_PEN_BTN={ja:'#{no} を赤ペンで見る',en:'See #{no} in red pen'};

// §5 前回までの話（「続きから」で6時間以上あけたとき。{left}=残り回数・残り人数。持ち点の数字はセリフに入れない）
const RECAP={
 1:{ja:'錨亭だ。ゲンは何にでも入ってくる。強い手のときだけ戦え',en:'The Anchor. Gen plays every hand. Fight only with strong ones.'},
 2:{ja:'ロクの店、銀の扉だ。盗むのは後ろの席から。あと{left}回だ',en:'Roku\'s place, the Silver Door. Steal from the late seats. {left} to go.'},
 3:{ja:'月影で、セキと打っている。何もない手でも、仕掛けどころはある。あと{left}回だ',en:'You\'re playing Seki at the Moonshadow. Even with nothing, there\'s a moment to move. {left} to go.'},
 4:{ja:'天空の卓だ。レイカは嘘をつく。顔を見て、嘘にだけ払え。あと{left}回だ',en:'The Skyline table. Reika lies. Watch her face and only pay off the lies. {left} to go.'},
 5:{ja:'ハヤトの賭場だ。AAで負けて、少ないチップからやり直している。……焦るな',en:'Hayato\'s den. Your aces got cracked and you\'re rebuilding from a short stack. ...Don\'t rush.'},
 6:{ja:'王冠のトーナメントだ。残りは{left}人。ブラインドは上がり続ける',en:'The Crown tournament. {left} players left. The blinds keep climbing.'},
 7:{ja:'……座れ。卒業試験の続きだ',en:'...Sit. The final exam isn\'t over.'},
 11:{ja:'錨亭だ。タロウがゲンと打っている。強い手だけで戦え',en:'The Anchor. Taro is playing Gen. Fight only with strong hands.'},
 12:{ja:'汐見の舫だ。よその店でも、盗むのは後ろの席から。あと{left}回だ',en:'Moyai, in Shiomi. Even in a strange house, steal from the late seats. {left} to go.'},
 13:{ja:'地下で、ハヤトの弟子のカイと打っている。急がせるのは向こうだ',en:'Down in the den, playing Hayato\'s student Kai. Let him be the one in a hurry.'},
 14:{ja:'看板持ちのトーナメントだ。残りは{left}人',en:'The sign-holders\' tournament. {left} players left.'},
 15:{ja:'……座れ。最後のテルの続きだ',en:'...Sit. We\'re not done with the last tell.'},
};
// 話し手：第一部はジン、第二部は師匠（mentorName()）

// §6 手札をめくる（第3章 intro の、店に入ったあとの1行）
const PEEK_LINES=[
 ['','隣の卓の客が、配られた札の角を、指で少しだけ持ち上げて見ている。'],
 ['ジン','ここの客は、札をそっとめくる。……真似してみろ'],
];
const PEEK_EN={'隣の卓の客が、配られた札の角を、指で少しだけ持ち上げて見ている。':'At the next table, a player lifts just the corner of the dealt cards with a fingertip.',
 'ここの客は、札をそっとめくる。……真似してみろ':'People here peel their cards gently. ...Try it.'};

// §7 会話の背景（店ごと）
const VENUE_BG={
 '港のバー「錨亭」':'anchor', '錨亭、閉店後':'anchor_closed', '古いクラブ「銀の扉」':'silver', 'ジャズクラブ「月影」':'moon',
 'ホテルのラウンジ「天空」':'sky', '地下の賭場跡':'den', 'カードルーム「王冠」':'crown',
 '汐見の古い店「舫」':'moyai', '月影から、地下の賭場跡へ':'den',
};
