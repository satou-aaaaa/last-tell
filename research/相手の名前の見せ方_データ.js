// 相手の名前の見せ方（案2＋案3）のデータ 2026-10-10
// 見た目の呼び名：服・持ち物・髪型で呼ぶ。肌の色・体つき・年齢では呼ばない。
// 見た目は src/js/04_char_real.js の DIVERSE_REAL（cloth, outfit, glasses, earring, necklace, scarf など）に合わせてある。
// 卓の名札に入るよう、日本語は7文字まで、英語は14文字まで。
const LOOKNAME={
  /* 錨亭 */
  'マツ':{ja:'丸眼鏡',en:'Round specs'},
  'ナギ':{ja:'黄色い髪留め',en:'Yellow hair tie'},
  'アデ':{ja:'紺の作業着',en:'Navy workwear'},
  'マリア':{ja:'金のネックレス',en:'Gold necklace'},
  /* 銀の扉 */
  'ヨシオ':{ja:'角眼鏡',en:'Square specs'},
  'リン':{ja:'ミントのシャツ',en:'Mint tee'},
  'ハンナ':{ja:'緑の作業着',en:'Green workwear'},
  'ラジ':{ja:'からし色の上着',en:'Mustard jacket'},
  /* 月影 */
  'カズ':{ja:'紫の上着',en:'Purple jacket'},
  'サヤ':{ja:'白いニット',en:'White knit'},
  'ウォルター':{ja:'茶色の上着',en:'Brown jacket'},
  'スミン':{ja:'銀のピアス',en:'Silver earrings'},
  /* 天空 */
  'シオン':{ja:'青緑のシャツ',en:'Teal shirt'},
  'アキラ':{ja:'赤い上着',en:'Red jacket'},
  'ルカ':{ja:'巻き毛',en:'Curly hair'},
  'アイシャ':{ja:'青緑のスカーフ',en:'Teal scarf'},
  /* 地下 */
  'ガン':{ja:'赤いシャツ',en:'Red tee'},
  'ドク':{ja:'口ひげ',en:'Moustache'},
  'ベン':{ja:'茶色のニット',en:'Brown knit'},
  'ミン':{ja:'橙のワッペン',en:'Orange patch'},
  /* 王冠 */
  'レン':{ja:'水色のシャツ',en:'Light-blue tee'},
  'イオリ':{ja:'灰色のニット',en:'Grey knit'},
  'ソフィア':{ja:'銀のネックレス',en:'Silver necklace'},
  'タケル':{ja:'黒いスーツ',en:'Black suit'},
  /* 入港した船の客 */
  'クワメ':{ja:'黄色いシャツ',en:'Yellow tee'},
  'イネス':{ja:'紺のニット',en:'Navy knit'},
  'ラース':{ja:'赤いニット',en:'Red knit'},
  'ファティマ':{ja:'金のピアス',en:'Gold earrings'},
  'メイ':{ja:'桃色のシャツ',en:'Pink tee'},
  'オリビア':{ja:'赤縁の眼鏡',en:'Red-rimmed specs'},
};
// 名乗りのひと言：知らない相手が「知っている相手」に変わる瞬間に、その人の吹き出しで1回だけ出す。
// お金の話は入れない。「夜」は使わない。タケルは話さない人なので、メモ（（メモ）で始まる）で名乗る。
const INTRO_LINE={
  'マツ':{ja:'マツだ。……覚えとくといい',en:"Matsu. ...Worth remembering."},
  'ナギ':{ja:'ナギ！ 港で働いてるよ',en:"Nagi! I work at the docks."},
  'アデ':{ja:'アデだ。船が出るまで、よろしく',en:"Ade. Till my ship leaves."},
  'マリア':{ja:'マリアよ。ふうん、続くのね',en:"Maria. Hm, you're sticking around."},
  'ヨシオ':{ja:'ヨシオです。以後お見知りおきを',en:"Yoshio. A pleasure."},
  'リン':{ja:'リン、です。よろしく……',en:"I'm Rin... nice to meet you."},
  'ハンナ':{ja:'（メモ）ハンナ',en:"(note) Hanna"},
  'ラジ':{ja:'ラジだ。そろそろ名前くらいはな',en:"Raj. About time we swapped names."},
  'カズ':{ja:'カズでいいよ',en:"Just call me Kazu."},
  'サヤ':{ja:'サヤです。顔、覚えました',en:"Saya. I remember your face."},
  'ウォルター':{ja:'ウォルターだ。いい卓だな',en:"Walter. Good table."},
  'スミン':{ja:'スミン。よろしく',en:"Sumin. Hey."},
  'シオン':{ja:'シオンよ',en:"Shion."},
  'アキラ':{ja:'アキラ。覚えといて',en:"Akira. Remember it."},
  'ルカ':{ja:'ルカだ。また会ったな',en:"Luca. We meet again."},
  'アイシャ':{ja:'アイシャです。よろしく',en:"Aisha. Nice to meet you."},
  'ガン':{ja:'ガンだ！ がはは',en:"Gan! Ha!"},
  'ドク':{ja:'皆はドクと呼ぶ',en:"They call me Doc."},
  'ベン':{ja:'ベンだ',en:"Ben."},
  'ミン':{ja:'ミンっす。よろしく',en:"Min. Good to meet you."},
  'レン':{ja:'あ、レンです！',en:"Oh, I'm Ren!"},
  'イオリ':{ja:'イオリ。……それだけ',en:"Iori. ...That's all."},
  'ソフィア':{ja:'ソフィアよ。お見知りおきを',en:"Sofia. Charmed."},
  'タケル':{ja:'（メモ）タケル',en:"(note) Takeru"},
  'クワメ':{ja:'クワメだ。よろしくな',en:"Kwame. Good to meet you."},
  'イネス':{ja:'イネスよ。リスボンから',en:"Inês. From Lisbon."},
  'ラース':{ja:'ラースだ。ベルゲンから来た',en:"Lars. Came from Bergen."},
  'ファティマ':{ja:'ファティマ。よろしくね',en:"Fatima. Nice to meet you."},
  'メイ':{ja:'メイだよ。よろしく！',en:"I'm Mei. Hi!"},
  'オリビア':{ja:'オリビアです。いい卓ね',en:"Olivia. Lovely table."},
};
