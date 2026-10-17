/* ライブポーカーらしい見た目（2026-10-15 決定：全案）のデータ。
   ゲーム担当はこのまま src/js/41_live_look.js の先頭に入れてよい。 */

// 案1 ラシャの印刷：ch.venue（日本語のまま）をキーにする。big は大きい字、sub は小さい英字の行
const FELT_PRINT={
  '港のバー「錨亭」':        {ja:'錨亭',   en:'THE ANCHOR',      sub:'THE ANCHOR ・ HARBOR BAR'},
  '錨亭、閉店後':            {ja:'錨亭',   en:'THE ANCHOR',      sub:'THE ANCHOR ・ AFTER HOURS'},
  '古いクラブ「銀の扉」':    {ja:'銀の扉', en:'SILVER DOOR',     sub:'THE SILVER DOOR ・ CLUB'},
  'ジャズクラブ「月影」':    {ja:'月影',   en:'MOONSHADE',       sub:'MOONSHADE ・ JAZZ CLUB'},
  'ホテルのラウンジ「天空」':{ja:'天空',   en:'SKYLINE',         sub:'SKYLINE ・ HOTEL LOUNGE'},
  '地下の賭場跡':            {ja:'',       en:'',                sub:''},            // 印刷なし（古いラシャ、すり切れ）
  'カードルーム「王冠」':    {ja:'王冠',   en:'THE CROWN',       sub:'THE CROWN ・ CARD ROOM'},
  '汐見の古い店「舫」':      {ja:'舫',     en:'MOORINGS',        sub:'MOORINGS ・ SHIOMI'},
  '月影から、地下の賭場跡へ':{ja:'月影',   en:'MOONSHADE',       sub:'MOONSHADE ・ JAZZ CLUB'},
};
// フリー対戦・はしご・日替わりなど ch.venue が無いときは「錨亭」。回想（CFG.flashback）は印刷なし。

// 案4 カップホルダーの飲み物（お酒は出さない）
const DRINK={
  '港のバー「錨亭」':'coffee', '錨亭、閉店後':'tea', '古いクラブ「銀の扉」':'soda',
  'ジャズクラブ「月影」':'tea', 'ホテルのラウンジ「天空」':'water', '地下の賭場跡':'coffee',
  'カードルーム「王冠」':'water', '汐見の古い店「舫」':'tea', '月影から、地下の賭場跡へ':'coffee',
};
const DRINK_LOOK={ // 上から見た丸：縁の色、中身の色
  coffee:{rim:'#e9e4da',fill:'#3b2414'}, tea:{rim:'#e9e4da',fill:'#9a5a22'},
  soda:{rim:'#9fb3b8',fill:'#cfe3e0'},  water:{rim:'#9fb3b8',fill:'#dfe9ec'},
};

// 案2 相手のプロテクター：主なキャラは決まった小物。ここに無い人は名前のハッシュで3人に1人だけ「チップ1枚」を置く
const OPP_PROTECTOR={
  'ゲン':{kind:'coin',ring:'#8d6b3a',face:'#c9a45c',label:{ja:'古いコイン',en:'old coin'}},
  'レイカ':{kind:'coin',ring:'#6d1f2a',face:'#d4a3ad',label:{ja:'口紅のふた',en:'lipstick cap'}},
  'ハヤト':{kind:'chip',ring:'#1f3d6e',face:'#e8e3d6',label:{ja:'青いチップ',en:'blue chip'}},
  'ソウ':{kind:'coin',ring:'#3c4a3f',face:'#9fb59f',label:{ja:'翡翠の石',en:'jade stone'}},
  'クロウ':{kind:'coin',ring:'#111',face:'#444',label:{ja:'黒いコイン',en:'black coin'}},
  'カイ':{kind:'chip',ring:'#7a1d24',face:'#e8e3d6',label:{ja:'赤いチップ',en:'red chip'}},
  'テツ':{kind:'coin',ring:'#5a5a5a',face:'#a9a9a9',label:{ja:'ナット',en:'hex nut'}},
  'ミナ':{kind:'coin',ring:'#8a6a9e',face:'#e3d4ff',label:{ja:'貝のボタン',en:'shell button'}},
  'ハル':{kind:'chip',ring:'#2f8a55',face:'#e8e3d6',label:{ja:'緑のチップ',en:'green chip'}},
  'ジン':null, // ジンは置かない（第7章の本物のテルの見え方を変えないため）
};
