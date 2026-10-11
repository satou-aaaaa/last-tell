// ライブ感の総点検 データ（2026-10-10 決定：全案。案1〜4は1.0、案5は公開後）
// 新しいファイル src/js/21c_live_table.js に入れる想定。日本語と英語を並べる。英語が無い行は入れない。
// 台詞にお金の話は入れない。「夜」は使わない。

// ---------- ディーラーの読み上げ（案3）：勝った手だけ ----------
// s は bestN() の結果 [役, ...ランク]。rank は 2..14
const RANK_JP={14:'エース',13:'キング',12:'クイーン',11:'ジャック',10:'10',9:'9',8:'8',7:'7',6:'6',5:'5',4:'4',3:'3',2:'2'};
const RANK_EN1={14:'ace',13:'king',12:'queen',11:'jack',10:'ten',9:'nine',8:'eight',7:'seven',6:'six',5:'five',4:'four',3:'three',2:'two'};
const RANK_ENS={14:'aces',13:'kings',12:'queens',11:'jacks',10:'tens',9:'nines',8:'eights',7:'sevens',6:'sixes',5:'fives',4:'fours',3:'threes',2:'twos'};
const cap=t=>t[0].toUpperCase()+t.slice(1);
function dealerRead(s,lang){const a=s[1],b=s[2];
  if(lang==='en')return [
    ()=>`${cap(RANK_EN1[a])} high`,()=>`Pair of ${RANK_ENS[a]}`,()=>`${cap(RANK_ENS[a])} and ${RANK_ENS[b]}`,()=>`Three ${RANK_ENS[a]}`,
    ()=>`Straight, ${RANK_EN1[a]} high`,()=>`Flush, ${RANK_EN1[a]} high`,()=>`${cap(RANK_ENS[a])} full of ${RANK_ENS[b]}`,()=>`Four ${RANK_ENS[a]}`,
    ()=>a===14?'Royal flush':`Straight flush, ${RANK_EN1[a]} high`][s[0]]();
  return [
    ()=>`${RANK_JP[a]}・ハイ`,()=>`${RANK_JP[a]}のワンペア`,()=>`${RANK_JP[a]}と${RANK_JP[b]}のツーペア`,()=>`${RANK_JP[a]}のスリーカード`,
    ()=>`${RANK_JP[a]}までのストレート`,()=>`${RANK_JP[a]}からのフラッシュ`,()=>`フルハウス、${RANK_JP[a]}と${RANK_JP[b]}`,()=>`${RANK_JP[a]}のフォーカード`,
    ()=>a===14?'ロイヤルフラッシュ':`${RANK_JP[a]}までのストレートフラッシュ`][s[0]]();
}

// ---------- ディーラーの声（案1・案2・案4） ----------
const LIVE_DEALER=[
  {k:'potAsk',  ja:'ポットは{n}です',              en:'The pot is {n}.'},           // ポットをタップしたとき（数える 600ms のあと）
  {k:'potWin',  ja:'ポットは{who}へ',              en:'Pot goes to {who}.'},        // 今の potCall と同じ（文字は変えない）
  {k:'blinds',  ja:'ブラインド、お願いします',      en:'Blinds, please.'},           // 第1章の最初のハンドと、席が変わった最初のハンドだけ
  {k:'action',  ja:'{who}さん',                   en:'{who}.'},                    // 相手が12秒以上考えたときだけ（案1「番です」の代わり）
  {k:'actionMe',ja:'お客様です',                   en:'Action is on you.'},         // 自分の番で8秒何もしなかったときだけ。1ハンド1回
  {k:'muck',    ja:'',                            en:''},                          // 負けた手は声なし（動きだけ）
  {k:'clock10', ja:'10秒',                        en:'Ten seconds.'},
  {k:'clock5',  ja:'5、4、3……',                   en:'Five, four, three...'},
  {k:'clockEnd',ja:'時間です',                     en:'Time.'},
];

// ---------- クロック（案4） ----------
// 言う人：そのハンドに残っていない客（降りた人・座っているだけの人）から1人。いなければフロア（黒田）。
const CLOCK_CALL=[
  {ja:'クロック、お願いします', en:'Clock, please.'},
  {ja:'すみません、クロックを',   en:'Excuse me, can we get a clock?'},
  {ja:'そろそろ、クロックで',     en:'Time to call the clock.'},
];
const CLOCK_FLOOR={ja:'フロアです。1分でお願いします', en:'Floor. You have one minute.'};

// ---------- オールインで手が開いたあとの反応（案3） ----------
// 手が開いたあとにだけ出す。強さで変えない（勝っている人も負けている人も同じ候補から選ぶ）。
// 強いキャラ（rank>=3）は「無言（…）」か腕を組む動きだけ。
const RUNOUT_REACT=[
  {ja:'……頼む',          en:'...Come on.'},
  {ja:'来るな、来るなよ',   en:"Don't come, don't come..."},
  {ja:'さあ、どうかな',     en:"Let's see."},
  {ja:'……',              en:'...'},
];
const RUNOUT_RAIL=[ // 隣の卓の声（nextv の react 枠。第7章では出さない）
  {ja:'向こうの卓、オールインだって', en:"Someone's all-in over there."},
  {ja:'お、開いたぞ',              en:"Oh, they're tabling it."},
];

// ---------- 人の出入り（案5・公開後） ----------
const SEAT_LIFE=[
  {k:'leave',   ja:'……今日はここまでだ',            en:"...That's it for today."},
  {k:'leave2',  ja:'また来るよ',                    en:"I'll be back."},
  {k:'rebuy',   ja:'フロアです。チップお持ちしました', en:'Floor. Here are your chips.'},
  {k:'sitdown', ja:'BBを置いてから入ります',          en:"I'll post the big blind."},
  {k:'colorup', ja:'小さいチップを交換します',         en:"We're coloring up the small chips."},
  {k:'break',   ja:'10分の休憩です',                 en:'Ten-minute break.'},
];

// ---------- 設定（案3・案4） ----------
const LIVE_SET=[
  {id:'btnTv',  ja:'テレビ風の表示', en:'TV-style info',
   desc:{ja:'オールイン中の勝率と、役の名前の札を出します（ライブの卓では出ません）', en:'Show win odds during all-ins and hand-name labels (not shown at a live table).'},
   val:{on:{ja:'オン',en:'On'},off:{ja:'オフ',en:'Off'}}},
  {id:'btnPre', ja:'先に選ぶ（オンライン式）', en:'Pre-select actions (online style)',
   desc:{ja:'自分の番の前に、チェック/フォールドなどを選んでおけます（ライブの卓では順番前の行動は禁止）', en:'Pick check/fold before your turn (acting out of turn is not allowed at a live table).'},
   val:{on:{ja:'オン',en:'On'},off:{ja:'オフ',en:'Off'}}},
  {id:'btnClock', ja:'クロック', en:'Clock',
   desc:{ja:'長く考えると、ほかの客がクロックを呼びます（今の「持ち時間」の置きかえ）', en:'If you think too long, another player calls the clock (replaces the old time bar).'},
   val:{on:{ja:'あり',en:'On'},off:{ja:'なし',en:'Off'}}},
];
