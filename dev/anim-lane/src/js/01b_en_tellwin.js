// テルで勝てる（2026-10-14）の英語。クセの言葉は短く、ほかの文に混ざらないよう、文ごと型にする
Object.assign(EN_DICT,{
"見せてやるよ":"I'll show you.","降りて正解だったな":"Good fold.","ほら、本物だ":"See? The real thing."
});
[['口元','smile'],['口数','chatter'],['目線','glance'],['汗','sweat'],['止まった手','stillness'],['視線','stare'],['速さ','speed'],['顔','face']].forEach(([ja,en])=>EN_TPL.push(
[ja+"で{1}回取って、{2}回降りて守った。顔が見えてきたな","You took {1} pots off their "+en+", and folded {2} times to save chips. You're starting to see faces."],
[ja+"で{1}回、取ったな。あれは運じゃない","You took {1} pots off their "+en+". That wasn't luck."],
// v79（v78 レビュー 4）：1回のときの英語（"1 pots"・"1 times" にしない）。字の多い型が先に当たる
[ja+"で1回取って、1回降りて守った。顔が見えてきたな","You took a pot off their "+en+", and folded once to save chips. You're starting to see faces."],
[ja+"で1回取って、{2}回降りて守った。顔が見えてきたな","You took a pot off their "+en+", and folded {2} times to save chips. You're starting to see faces."],
[ja+"で{1}回取って、1回降りて守った。顔が見えてきたな","You took {1} pots off their "+en+", and folded once to save chips. You're starting to see faces."],
[ja+"で1回、取ったな。あれは運じゃない","You took a pot off their "+en+". That wasn't luck."]));
EN_TPL.push(["{0}回、クセを見て降りた。あれも勝ちだ","You read a tell and folded {0} times. That's a win too."],["1回、クセを見て降りた。あれも勝ちだ","You read a tell and folded once. That's a win too."]);
