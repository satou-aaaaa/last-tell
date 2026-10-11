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
// v65：見た目の呼び名が入っても訳されるように（第6章の途中参加の一文、4人で分けたポット）
EN_TPL.push(
["{0}と{1}は、途中から参加した。持ち点が少ないのは、そのためだ","{0} and {1} joined partway through. That's why their stacks are smaller."],
["ポットは{0}と{1}と{2}と{3}へ","Pot goes to {0}, {1}, {2} and {3}"]);
// v67：タケルの仕草（名乗る前は見た目の呼び名が入る）
EN_TPL.push(
["{0}が、手で「少し待って」と合図した","{0} signals with a hand: \"one moment.\""],
["{0}が、カードを静かに前に出した","{0} quietly slides the cards forward."],
["{0}が、小さく頭を下げた","{0} gives a small bow."]);
