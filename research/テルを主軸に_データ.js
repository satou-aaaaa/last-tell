// テルで勝てる（2026-10-14）のデータ。実物は src/js/39_tell_win.js と src/js/01b_en_tellwin.js
// 案3：見せたがりのキャラが自分から手を見せるときの一言
const TW_SHOW_LINES=[
  {ja:'見せてやるよ',en:"I'll show you."},
  {ja:'降りて正解だったな',en:'Good fold.'},
  {ja:'ほら、本物だ',en:'See? The real thing.'},
];
// 案3：自分からは見せない人（今の「何持ってた？」の答えのまま）
const TW_NOSHOW=['ジン','師匠','レイカ','クロウ'];
// 案4：ジンの三行の1行目。{cue} はいちばん多く当てたクセの言葉
const TW_CUE_WORD={smile:{ja:'口元',en:'smile'},talk:{ja:'口数',en:'chatter'},glance:{ja:'目線',en:'glance'},sweat:{ja:'汗',en:'sweat'},
  still:{ja:'止まった手',en:'stillness'},stare:{ja:'視線',en:'stare'},fast:{ja:'速さ',en:'speed'}};
const TW_REVIEW=[
  {when:'取った＋守った',ja:'{cue}で{n}回取って、{m}回降りて守った。顔が見えてきたな',en:"You took {n} pots off their {cue}, and folded {m} times to save chips. You're starting to see faces."},
  {when:'取っただけ',ja:'{cue}で{n}回、取ったな。あれは運じゃない',en:"You took {n} pots off their {cue}. That wasn't luck."},
  {when:'守っただけ',ja:'{m}回、クセを見て降りた。あれも勝ちだ',en:"You read a tell and folded {m} times. That's a win too."},
];
// 案2：ターン・リバーで弱い手（rel<0.7）のCPUが大きく賭ける確率 = min(0.4, style.bluff×2.5+0.05)
// 例：liar 0.25→0.40、hayato 0.14→0.40、normal 0.08→0.25、tight 0.02→0.10、nit 0.01→0.075
// 案5（公開後）：見抜かれた相手が熱くなる一言
const TW_TILT_LINES=[
  {ja:'……もう一回だ',en:'...One more.'},
  {ja:'次は、そうはいかない',en:"Won't happen again."},
];
