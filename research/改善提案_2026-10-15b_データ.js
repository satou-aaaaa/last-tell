// 改善提案 2026-10-15b のデータ（日英）。research/改善提案_2026-10-15b_実装仕様.md
const MF={bigPotBB:15,bigBoost:.15,crowdPotBB:40,grudgePotBB:30,grudgeHands:5,innerMs:2500};

const MF_LINES={
  bigFirst:{who:'ジン',ja:'でかい勝負ほど、人は顔を隠せない',en:'The bigger the pot, the less a face can hide.'},
  replayAct:{call:{ja:'あなたはコールした',en:'You called.'},fold:{ja:'あなたは降りた',en:'You folded.'}},
  replayHead:{ja:'この章の読み',en:'Your read of the chapter'},
  crowdAfter:[{ja:'おお……',en:'Ooh...'},{ja:'……今の、見たか',en:'...Did you see that?'},{ja:'すげえな',en:'Wow.'}]
};

// 案2：アオの心の声。クセ × いちばん多かった答え
const MF_RECALL={
  glance:{strong:{ja:'……チップを見た。前に見たときは、強い手だった',en:'...A glance at the chips. Last time, that was a strong hand.'},
          bluff:{ja:'……チップを見た。あのときは、何もなかった',en:'...A glance at the chips. Last time, there was nothing behind it.'},
          none:{ja:'……チップを見た。前は、特に意味はなかった',en:'...A glance at the chips. Last time, it meant nothing.'}},
  still:{strong:{ja:'……指が止まった。前に見たときは、強い手だった',en:'...Frozen. Last time, that was a strong hand.'},
         bluff:{ja:'……指が止まった。あのときは、何もなかった',en:'...Frozen. Last time, there was nothing behind it.'},
         none:{ja:'……指が止まった。前は、特に意味はなかった',en:'...Frozen. Last time, it meant nothing.'}},
  smile:{strong:{ja:'……また笑った。前に見たときは、強い手だった',en:'...That smile again. Last time, it was a strong hand.'},
         bluff:{ja:'……また笑った。あのときは、何もなかった',en:'...That smile again. Last time, there was nothing behind it.'},
         none:{ja:'……また笑った。前は、特に意味はなかった',en:'...That smile again. Last time, it meant nothing.'}},
  stare:{strong:{ja:'……こっちを見ている。前に見たときは、強い手だった',en:'...Staring at me. Last time, that was a strong hand.'},
         bluff:{ja:'……こっちを見ている。あのときは、何もなかった',en:'...Staring at me. Last time, there was nothing behind it.'},
         none:{ja:'……こっちを見ている。前は、特に意味はなかった',en:'...Staring at me. Last time, it meant nothing.'}},
  talk:{strong:{ja:'……口数が増えた。前に見たときは、強い手だった',en:'...Talking more. Last time, that was a strong hand.'},
        bluff:{ja:'……口数が増えた。あのときは、何もなかった',en:'...Talking more. Last time, there was nothing behind it.'},
        none:{ja:'……口数が増えた。前は、特に意味はなかった',en:'...Talking more. Last time, it meant nothing.'}},
  fast:{strong:{ja:'……すぐ賭けた。前に見たときは、強い手だった',en:'...An instant bet. Last time, that was a strong hand.'},
        bluff:{ja:'……すぐ賭けた。あのときは、何もなかった',en:'...An instant bet. Last time, there was nothing behind it.'},
        none:{ja:'……すぐ賭けた。前は、特に意味はなかった',en:'...An instant bet. Last time, it meant nothing.'}},
  sweat:{strong:{ja:'……汗をかいている。前に見たときは、強い手だった',en:'...Sweating. Last time, that was a strong hand.'},
         bluff:{ja:'……汗をかいている。あのときは、何もなかった',en:'...Sweating. Last time, there was nothing behind it.'},
         none:{ja:'……汗をかいている。前は、特に意味はなかった',en:'...Sweating. Last time, it meant nothing.'}}
};
const MF_RECALL_DOUBT={ja:'……前と同じとは、限らない',en:'...It might not mean the same thing this time.'};

// 案3：卓の因縁。bluffed=あなたがブラフで降ろした、caught=相手のブラフを見抜いた、lost=相手に負けた
const MF_GRUDGE={
  'ゲン':{bluffed:{ja:'この前のブラフ、忘れてないからな',en:'I haven\'t forgotten that bluff.'},caught:{ja:'……あのときは見抜かれたな。今日は違うぞ',en:'You saw through me last time. Not today.'},lost:{ja:'よう。また、もらいに来たのか',en:'Hey. Back for another lesson?'}},
  'ハル':{bluffed:{ja:'あれ、ブラフだったんでしょ。わかってるんだから',en:'That was a bluff, wasn\'t it. I know now.'},caught:{ja:'うう、前のは見られてた……',en:'Ugh, you caught me last time...'},lost:{ja:'今日も、いい勝負しようね',en:'Let\'s have another good one today.'}},
  'ロク':{bluffed:{ja:'……前の一枚、まだ考えている',en:'...I\'m still thinking about that last hand.'},caught:{ja:'見抜いたつもりか。一度だけだ',en:'You think you read me. That was once.'},lost:{ja:'……座れ。続きだ',en:'...Sit. Let\'s continue.'}},
  'セキ':{bluffed:{ja:'あのときは、きれいに降ろされましたね',en:'You moved me off that pot quite cleanly.'},caught:{ja:'前は、たしなみを欠きました。今日は気をつけます',en:'I forgot my manners last time. I\'ll be careful today.'},lost:{ja:'またご一緒できて、うれしいですよ',en:'A pleasure to sit with you again.'}},
  'ミナ':{bluffed:{ja:'前のあれ、ブラフだったよね？ 次は降りないよ',en:'That was a bluff last time, right? I won\'t fold next time.'},caught:{ja:'前のは見られちゃった。今日は顔に出さない',en:'You read me last time. Not showing it today.'},lost:{ja:'また会ったね。今日も、取らせてもらう',en:'We meet again. I\'ll be taking pots today too.'}},
  'レイカ':{bluffed:{ja:'わたしを降ろしたこと、覚えてるわよ',en:'I remember you making me fold.'},caught:{ja:'見抜いた気でいるのね。……面白い',en:'So you think you can read me. Interesting.'},lost:{ja:'あら。また負けに来たの？',en:'Oh. Here to lose again?'}},
  'ソウ':{bluffed:{ja:'あ、あのときの……お、落ち着け……',en:'Oh, from that time... c-calm down...'},caught:{ja:'前のは、ば、ばれてた……',en:'Last time, y-you saw it...'},lost:{ja:'こ、今日もよろしくお願いします',en:'G-good to play with you again.'}},
  'ケンジ':{bluffed:{ja:'前の、やられたよ。今日はコールするからな',en:'You got me last time. I\'m calling today.'},caught:{ja:'見られてたか。仕事でもよく言われる',en:'You saw it, huh. I hear that at work too.'},lost:{ja:'よっ。今日も一勝負',en:'Hey. Another round today.'}},
  'ハヤト':{bluffed:{ja:'……前の、ブラフだったろ。わかってる',en:'...That was a bluff last time. I know.'},caught:{ja:'一回見抜いたくらいで、いい気になるなよ',en:'Don\'t get cocky from reading me once.'},lost:{ja:'……二代目。今日も、取る',en:'...Second. I\'m taking it again today.'}},
  '_':{bluffed:{ja:'この前は、うまく降ろされたな',en:'You moved me off that pot nicely last time.'},caught:{ja:'前のは、見抜かれたな',en:'You saw through me last time.'},lost:{ja:'また会ったな',en:'We meet again.'}}
};
