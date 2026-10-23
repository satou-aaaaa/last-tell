# 検査のまとめ v0.97.1

対象: index.html（APP_VERSION 0.97.1）、短い版、GitHub 06d8be1、2026-10-20 03:18 UTC

**✅ 合格**　✅ 423　❌ 0　⚠️ 11　🟡 修正待ち・前からある 7

## ⚠️ 気にかけること

- 心の声の字幕がほかの部品に重ならない（縦_390x844）：重なっている部品 2個：dbadge 17×17px、I 7×15px
- WebKit：画面 第1章_自分の番（PC_1280x800）：（WebKit は字の幅が違うので ⚠️）新しい問題: 重なり: ポットの塔（#potChips） ← 自分の手札 40×63px、重なり: ポットの塔（#potChips） ← 自分の手札 38×63px（ui/WebKit_第1章_自分の番_PC_1280x800.jpg）
- WebKit：画面 フリー6人_心の声（縦_390x844）：（WebKit は字の幅が違うので ⚠️）新しい問題: 隠れ: div.card.red「5♦♦5♦」 ← div.card「7♣♣7♣」（#boardCards の中、147,493,40,65・不透明度 1.00）、隠れ: div.card「7♣♣7♣」 ← div.card.red「A♦♦A♦」（#boardCards の中、162,493,39,65・不透明度 1.00）（ui/WebKit_フリー6人_心の声_縦_390x844.jpg）
- WebKit：画面 フリー6人_ディーラーの呼び名（縦_390x844）：（WebKit は字の幅が違うので ⚠️）新しい問題: 隠れ: div.card「Q♠Q♠Q♠」 ← div.card.red「A♦♦A♦」（#boardCards の中、138,433,39,59・不透明度 1.00）、隠れ: div.card「A♣♣A♣」 ← div.card.red「A♦♦A♦」（#boardCards の中、138,433,39,59・不透明度 1.00）（ui/WebKit_フリー6人_ディーラーの呼び名_縦_390x844.jpg）
- WebKit：画面 第4章_クセ3人以上（横_844x390）：（WebKit は字の幅が違うので ⚠️）新しい問題: 隠れ: div.card「7♣♣7♣」 ← div.card「7♠♠7♠」（#boardCards の中、161,185,6,48・不透明度 1.00）（ui/WebKit_第4章_クセ3人以上_横_844x390.jpg）
- WebKit：画面 第4章_クセ3人以上（PC_1280x800）：（WebKit は字の幅が違うので ⚠️）新しい問題: 隠れ: div.card「7♣♣7♣」 ← div.card「7♠♠7♠」（#boardCards の中、455,321,73,83・不透明度 1.00）、隠れ: div.card「3♠♠3♠」 ← div.card「7♠♠7♠」（#boardCards の中、455,321,73,83・不透明度 1.00）（ui/WebKit_第4章_クセ3人以上_PC_1280x800.jpg）
- WebKit：ハンドの終わりにポットが勝った人へ渡り、勝ったら「あなたの勝ち」が出る（フリー6人_ハンドの終わり・PC_1280x800）：ポットが渡り終わるまで 2268ms 待った（待ったもの 10ms:額）（1.5秒より長い。Mac の Safari でももたついて見える見込み）［pushing=false potfly=0 potmove=0 vf=vfres lose/1.00/460,440,361,25 wonPile=1(1) anim=running,running,running,running,finished,finished,finished,f potPile=0］
- WebKit：ハンドの終わりにポットが勝った人へ渡り、勝ったら「あなたの勝ち」が出る（第2章_ハンドの終わり・横_844x390）：ポットが渡り終わるまで 1550ms 待った（待ったもの 14ms:額+札が画面の外か透明）（1.5秒より長い。Mac の Safari でももたついて見える見込み）［pushing=false potfly=0 potmove=0 vf=vfres win/1.00/147,238,224,25 wonPile=1(0) anim=running,running,running,running,running,finished,finished,fi potPile=0］
- WebKit：ハンドの終わりにポットが勝った人へ渡り、勝ったら「あなたの勝ち」が出る（第2章_ハンドの終わり・PC_1280x800）：（WebKit は字の幅が違うので ⚠️）ポットの額が出たまま・［pushing=true potfly=0 potmove=1 vf=vfres win/1.00/528,440,224,25 wonPile=1(0) anim=running,running,running,running,running,finished,finished,fi potPile=6］（4秒待っても、そろわなかった）（待ったもの 19ms:額）
- WebKit：ハンドの終わりにポットが勝った人へ渡り、勝ったら「あなたの勝ち」が出る（第7章_ハンドの終わり・PC_1280x800）：ポットが渡り終わるまで 1835ms 待った（待ったもの 4ms:額）（1.5秒より長い。Mac の Safari でももたついて見える見込み）［pushing=false potfly=0 potmove=0 wonPile=1(0) anim=running,running,running,running,running,finished,finished,fi potPile=0］
- WebKit：ハンドの終わりにポットが勝った人へ渡り、勝ったら「あなたの勝ち」が出る（第14章_ハンドの終わり・横_844x390）：ポットが渡り終わるまで 2278ms 待った（待ったもの 10ms:額+札が画面の外か透明）（1.5秒より長い。Mac の Safari でももたついて見える見込み）［pushing=false potfly=0 potmove=0 vf=vfres win/1.00/143,238,233,25 wonPile=1(0) anim=running,running,running,running,finished,finished,finished,f potPile=0］

## 勝率

- ✅ 第1章の勝率：勝率 100%（8/8、80ハンドで決着しない回は負け扱い）、基準 79%（許す幅 ±42）
- ✅ 第2章の勝率：勝率 0%（0/8、80ハンドで決着しない回は負け扱い）、基準 17%（許す幅 ±38）
- ✅ 第3章の勝率：勝率 50%（4/8、80ハンドで決着しない回は負け扱い）、基準 50%（許す幅 ±51）
- ✅ 第4章の勝率：勝率 13%（1/8、80ハンドで決着しない回は負け扱い）、基準 54%（許す幅 ±51）
- ✅ 第4章：クセの札は相手のフロップ以降の賭け・上げのときだけ：札 43回のうち、それ以外で出たのは 0回

## 台詞の変化（lines_diff.md）

足した 0行、消した 0行（全部で 1963行）。⚑ は気をつける印。



## 画面

- 一覧（まず これを見る）：ui/_一覧_縦.jpg・ui/_一覧_横.jpg・ui/_一覧_PC.jpg（iPhone の Safari は ui/_一覧_WebKit_縦.jpg ほか）
- 前の版から見た目が変わった画面 26枚（「前｜今｜違う所」を1枚にした ui/_比べ_<名前>.jpg を見る）：フリー6人_ディーラーの呼び名_縦_390x844.jpg（3.8%）、フリー6人_ハンドの終わり_PC_1280x800.jpg（11.8%）、フリー6人_ハンドの終わり_横_844x390.jpg（5.5%）、フリー6人_ハンドの終わり_縦_390x844.jpg（7.1%）、フリー6人_レイズを開く_横_844x390.jpg（3.1%）、フリー6人_人だかり_PC_1280x800.jpg（12.9%）、フリー6人_心の声_PC_1280x800.jpg（5.6%）、フリー6人_心の声_横_844x390.jpg（14.2%）、フリー6人_心の声_縦_390x844.jpg（15%）、第14章_ハンドの終わり_PC_1280x800.jpg（10.6%）、第14章_ハンドの終わり_横_844x390.jpg（24.5%）、第14章_ハンドの終わり_縦_390x844.jpg（42%）、第14章_自分の番_PC_1280x800.jpg（12%）、第14章_自分の番_横_844x390.jpg（9.1%）、第14章_自分の番_縦_390x844.jpg（32.9%）、第1章_自分の番_縦_390x844.jpg（3.2%）、第2章_ハンドの終わり_PC_1280x800.jpg（4.8%）、第2章_ハンドの終わり_横_844x390.jpg（3.7%）、第2章_ハンドの終わり_縦_390x844.jpg（3.3%）、第4章_クセ3人以上_縦_390x844.jpg（3.5%）、第6章_自分の番_横_844x390.jpg（16.5%）、第6章_自分の番_縦_390x844.jpg（18.1%）、第7章_ハンドの終わり_縦_390x844.jpg（5.5%）、英語_フリー6人_自分の番_縦_390x844.jpg（3.1%）、裏の卓_自分の番_PC_1280x800.jpg（6.1%）、裏の卓_自分の番_縦_390x844.jpg（14.3%）

全部の結果は report.md、基準を書き直すときは baseline_候補.json（qa/baseline.json に写す。本線だけ、satou さんの OK のあと）。
