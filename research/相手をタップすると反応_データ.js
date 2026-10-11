// 相手をタップすると反応 データ（2026-10-10）。ゲームに入っている形は src/js/26b_tap_react.js（日本語）と src/js/01b_en_tap.js（英語）
// 案4・案5（公開後）のデータは下の TAP_LATER
const TAP_REACT={
  'ゲン':{a:'grin',l:['お、なんだい','顔に何かついてるか？','……あんまり見るなって'],nh:'へへ、たまたまだ',lost:'……次だ、次',greet:'よう'},
  'ハル':{a:'nod',l:['ん？','なになに？','もう、見すぎ'],nh:'ありがと！',lost:'うう……次こそ',greet:'こんにちは'},
  '店主':{a:'nod',l:['どうしたの','楽しんでる？','ほら、前を見て'],nh:'あら、どうも',lost:'やられちゃった',greet:'いらっしゃい'},
  'タロウ':{a:'grin',l:['えっ、僕？','な、なんですか','……緊張するなあ'],nh:'ど、どうも！',lost:'あー……',greet:'よろしくです'},
  'ミナ':{a:'nod',l:['どうかした？','集中しなきゃ','……ほら、配られるよ'],nh:'ありがとう',lost:'……今のは痛いな',greet:'よろしくね'},
  'ケンジ':{a:'grin',l:['おっ','なんだよ、照れるな','次いこうぜ'],nh:'サンキュー',lost:'まいったな',greet:'どうも'},
  'ミサキ':{a:'away',l:['……何か？','……どうも',null],nh:'……ありがと',lost:'……',greet:'（会釈）'},
  'ソウ':{a:'nod',l:['やあ','ここ、いい店でしょう','次が配られますよ'],nh:'どうも、ありがとう',lost:'いやあ、やられました',greet:'どうも'},
  'テツ':{a:'grin',l:['おう','どうした','よそ見してると配られるぞ'],nh:'へへ、どうも',lost:'ちくしょう',greet:'おう、よろしく'},
  'ロク':{a:'brow',l:['……なんだ','見てても、何も変わらねえよ','しつこいな'],nh:'ああ',lost:'……チッ',greet:'（軽くあごを上げる）'},
  'セキ':{a:'nod',l:['何か御用かな','落ち着いて、次を待ちなさい',null],nh:'ありがとう',lost:'見事だった',greet:'（静かに会釈）'},
  'レイカ':{a:'brow',l:['何？','見ても、何も出ないわよ','しつこい人は嫌い'],nh:'ありがと',lost:'……まあいいわ',greet:'（目だけで会釈）'},
  'ハヤト':{a:'glare',l:['あ？','見てる暇があったら打てよ','ケンカ売ってんのか'],nh:'当然だろ',lost:'……うるせえ',greet:'……ふん'},
  'クロウ':{a:'still',l:['……','用があるなら言え',null],nh:'（軽く指を上げる）',lost:'……',greet:'（目を合わせない）'},
  'ジン':{a:'still',l:['……前を見ろ','見るなら、打ってる時に見ろ',null],nh:'……ああ',lost:'……',greet:'（小さくうなずく）'},
  '若き日のジン':{a:'look',l:['……何だ','次を見ろ',null],nh:'……ああ',lost:'……',greet:'（うなずく）'},
  'クロダ':{a:'still',l:['……','何か用か',null],nh:'……',lost:'……',greet:'（目を合わせない）'},
  'カオル':{a:'brow',l:['あら、何かしら','見ても、変わらないわよ','もういいでしょう'],nh:'ふふ、ありがと',lost:'やられたわね',greet:'（微笑んで会釈）'},
  'ゴウ':{a:'glare',l:['……あ？','なに見てんだ','次は容赦しねえぞ'],nh:'ふん',lost:'……覚えとけ',greet:'……'}
};
TAP_REACT['老人']=TAP_REACT['ジン'];
// 名前の無い相手（店の常連・船の客など）は型で分ける
const TAP_TYPE={
  cool:{a:'look',l:['……','何か？',null],nh:'どうも',lost:'……',greet:'（軽く会釈）'},
  easy:{a:'nod',l:['どうも','何か？','……見すぎだよ'],nh:'ありがとう',lost:'今のは参った',greet:'よろしく'},
  rough:{a:'glare',l:['あ？','見てんじゃねえよ',null],nh:'ふん',lost:'……チッ',greet:'……'}
};
const TAP_NH='ナイスハンド';

// 相手をタップすると反応（2026-10-10）の英語
Object.assign(EN_DICT,{
"お、なんだい":"Oh, what is it?","顔に何かついてるか？":"Something on my face?","……あんまり見るなって":"...Quit staring, will you.","へへ、たまたまだ":"Heh, just luck.","……次だ、次":"...Next one. Next.","よう":"Hey.",
"ん？":"Hm?","なになに？":"What, what?","もう、見すぎ":"Okay, that's enough staring.","ありがと！":"Thanks!","うう……次こそ":"Ugh... next time.","こんにちは":"Hello.",
"どうしたの":"What's up?","楽しんでる？":"Having fun?","ほら、前を見て":"Come on, eyes on the table.","あら、どうも":"Oh, thank you.","やられちゃった":"Got me there.","いらっしゃい":"Welcome.",
"えっ、僕？":"Huh, me?","な、なんですか":"W-what is it?","……緊張するなあ":"...You're making me nervous.","ど、どうも！":"Th-thanks!","あー……":"Ahh...","よろしくです":"Nice to meet you.",
"どうかした？":"Something wrong?","集中しなきゃ":"I need to focus.","……ほら、配られるよ":"...Look, they're dealing.","ありがとう":"Thank you.","……今のは痛いな":"...That one hurt.",
"おっ":"Oh?","なんだよ、照れるな":"What, you're making me blush.","次いこうぜ":"Let's go, next hand.","サンキュー":"Thanks.","まいったな":"Well, that stings.","どうも":"Hey.",
"……何か？":"...Yes?","……どうも":"...Hello.","……ありがと":"...Thanks.","（会釈）":"(nods politely)",
"やあ":"Hi there.","ここ、いい店でしょう":"Nice place, isn't it?","次が配られますよ":"Next hand's coming.","どうも、ありがとう":"Thank you kindly.","いやあ、やられました":"Ah, you got me there.",
"おう":"Yo.","どうした":"What's up?","よそ見してると配られるぞ":"Look away and you'll miss the deal.","へへ、どうも":"Heh, thanks.","ちくしょう":"Damn it.","おう、よろしく":"Yo, good to meet you.",
"……なんだ":"...What.","見てても、何も変わらねえよ":"Staring won't change anything.","しつこいな":"You're persistent.","ああ":"Yeah.","（軽くあごを上げる）":"(lifts his chin slightly)",
"何か御用かな":"Can I help you?","落ち着いて、次を待ちなさい":"Calm down. Wait for the next hand.","見事だった":"Well played.","（静かに会釈）":"(nods quietly)",
"何？":"What?","見ても、何も出ないわよ":"Looking won't get you anything.","しつこい人は嫌い":"I don't like pushy people.","ありがと":"Thanks.","……まあいいわ":"...Fine.","（目だけで会釈）":"(acknowledges you with her eyes)",
"あ？":"Huh?","見てる暇があったら打てよ":"If you've got time to stare, play.","ケンカ売ってんのか":"You looking for a fight?","当然だろ":"Obviously.","……うるせえ":"...Shut up.",
"用があるなら言え":"If you want something, say it.","（軽く指を上げる）":"(raises a finger slightly)","（目を合わせない）":"(doesn't meet your eyes)",
"……前を見ろ":"...Eyes forward.","見るなら、打ってる時に見ろ":"If you're going to watch, watch while they play.",
"……何だ":"...What.","次を見ろ":"Watch the next hand.","（うなずく）":"(nods)","何か用か":"Need something?",
"あら、何かしら":"Oh, what is it?","見ても、変わらないわよ":"Looking won't change anything.","もういいでしょう":"That's enough, isn't it?","ふふ、ありがと":"Heh, thanks.","やられたわね":"You got me.","（微笑んで会釈）":"(smiles and nods)",
"……あ？":"...Huh?","なに見てんだ":"What are you looking at?","次は容赦しねえぞ":"No mercy next time.","……覚えとけ":"...Remember this.",
"何か？":"Yes?","（軽く会釈）":"(nods lightly)","……見すぎだよ":"...You're staring.","今のは参った":"That one got me.","よろしく":"Nice to meet you.","見てんじゃねえよ":"Quit looking at me.",

});

// ---- 公開後（案4・案5）----
const TAP_LATER={
  dealer:{ja:'お客様、ほどほどに',en:'Easy on the staring, please.'},   // 案4：同じハンドで同じ相手を4回
  // 案5：顔なじみになった後の1回目（合間）。無い人は TAP_REACT の l[0]
  bond:{
    'ゲン':{ja:'よう、アオ',en:'Hey, Ao.'},
    'レイカ':{ja:'また来たのね',en:'Back again, I see.'},
    'ハヤト':{ja:'……また、お前か',en:'...You again.'},
    'ロク':{ja:'今日はどうだ',en:"How's today treating you?"},
    'セキ':{ja:'元気そうだね',en:'You look well.'},
    'クロウ':{ja:'（目で軽くうなずく）',en:'(nods slightly with his eyes)'},
    cool:{ja:'（軽く手を上げる）',en:'(raises a hand slightly)'},
    easy:{ja:'また会ったね',en:'We meet again.'},
    rough:{ja:'……ふん、またか',en:'...Hmph. You again.'}
  }
};
