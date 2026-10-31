# 検査のまとめ v0.97.1

対象: index.html（APP_VERSION 0.97.1）、短い版、GitHub efca065、2026-10-20 02:53 UTC

**✅ 合格**　✅ 419　❌ 0　⚠️ 15　🟡 修正待ち・前からある 7

## ⚠️ 気にかけること

- 強いキャラがリバーのポット2倍ベットにコールしすぎない（プロポーカー S2）：ジン コール 27%（15回）、クロウ コール 45%（11回）（40%以下・30回以上なら10%以上で ✅、外れたら ⚠️。合否は直接の測り方 S2-direct で決める）
- WebKit：英語版に残っている日本語：前回の基準にない日本語 1件: 「Jin: “負けを数えるな. 降りた数を数えろ” You can retry from the start of the」
- WebKit：画面 第1章_自分の番（横_844x390）：（WebKit は字の幅が違うので ⚠️）新しい問題: 重なり: ポットの塔（#potChips） ← 自分の手札 28×12px、重なり: ポットの塔（#potChips） ← 自分の手札 28×15px（ui/WebKit_第1章_自分の番_横_844x390.jpg）
- WebKit：画面 第1章_自分の番（PC_1280x800）：（WebKit は字の幅が違うので ⚠️）新しい問題: 重なり: ポットの塔（#potChips） ← 自分の手札 40×63px、重なり: ポットの塔（#potChips） ← 自分の手札 38×63px（ui/WebKit_第1章_自分の番_PC_1280x800.jpg）
- WebKit：画面 フリー6人_ディーラーの呼び名（縦_390x844）：（WebKit は字の幅が違うので ⚠️）新しい問題: 隠れ: div.card.red「9♦♦9♦」 ← div.card.red「2♥♥2♥」（#boardCards の中、139,433,39,59・不透明度 1.00）、隠れ: div.card「10♠♠10♠」 ← div.card.red「2♥♥2♥」（#boardCards の中、139,433,39,59・不透明度 1.00）（ui/WebKit_フリー6人_ディーラーの呼び名_縦_390x844.jpg）
- WebKit：画面 店で遊ぶ_自分の番（横_844x390）：（新しく撮り始めた場面なので ⚠️。基準を書き直すと次から ❌）新しい問題: 隠れ: div.card.red「5♦♦5♦」 ← div.card.red「9♥♥9♥」（#boardCards の中、162,195,42,45・不透明度 1.00）（ui/WebKit_店で遊ぶ_自分の番_横_844x390.jpg）
- WebKit：ディーラーの呼び名の声がほかの部品に重ならない（縦_390x844）：重なっている部品 1個：#say3 83×10px
- WebKit：ハンドの終わりにポットが勝った人へ渡り、勝ったら「あなたの勝ち」が出る（フリー6人_ハンドの終わり・縦_390x844）：ポットが渡り終わるまで 2274ms 待った（1.5秒より長い。Mac の Safari でももたついて見える見込み）［pushing=false potmove=0 wonPile=0() anim=running,running,finished,finished,finished,finished,finished potPile=0］
- WebKit：ハンドの終わりにポットが勝った人へ渡り、勝ったら「あなたの勝ち」が出る（フリー6人_ハンドの終わり・横_844x390）：ポットが渡り終わるまで 3070ms 待った（1.5秒より長い。Mac の Safari でももたついて見える見込み）［pushing=false potmove=0 wonPile=1(1) anim=running,running,running,running,finished,finished,finished,f potPile=0］
- WebKit：ハンドの終わりにポットが勝った人へ渡り、勝ったら「あなたの勝ち」が出る（第2章_ハンドの終わり・縦_390x844）：ポットが渡り終わるまで 1608ms 待った（1.5秒より長い。Mac の Safari でももたついて見える見込み）［pushing=false potmove=0 wonPile=1(0) anim=running,running,running,running,finished,finished,finished,f potPile=0］
- WebKit：ハンドの終わりにポットが勝った人へ渡り、勝ったら「あなたの勝ち」が出る（第2章_ハンドの終わり・PC_1280x800）：ポットが渡り終わるまで 3190ms 待った（1.5秒より長い。Mac の Safari でももたついて見える見込み）［pushing=false potmove=0 wonPile=1(0) anim=running,running,running,running,running,finished,finished,fi potPile=0］
- WebKit：ハンドの終わりにポットが勝った人へ渡り、勝ったら「あなたの勝ち」が出る（第7章_ハンドの終わり・PC_1280x800）：ポットが渡り終わるまで 1564ms 待った（1.5秒より長い。Mac の Safari でももたついて見える見込み）［pushing=false potmove=0 wonPile=1(0) anim=running,running,running,running,running,finished,finished,fi potPile=0］
- WebKit：ハンドの終わりにポットが勝った人へ渡り、勝ったら「あなたの勝ち」が出る（第14章_ハンドの終わり・縦_390x844）：ポットが渡り終わるまで 2104ms 待った（1.5秒より長い。Mac の Safari でももたついて見える見込み）［pushing=false potmove=0 wonPile=1(2) anim=running,running,running,finished,finished,finished,finished, potPile=0］
- WebKit：ハンドの終わりにポットが勝った人へ渡り、勝ったら「あなたの勝ち」が出る（第14章_ハンドの終わり・横_844x390）：ポットが渡り終わるまで 1847ms 待った（1.5秒より長い。Mac の Safari でももたついて見える見込み）［pushing=false potmove=0 wonPile=1(0) anim=running,running,running,running,running,running,running,runn potPile=0］
- WebKit：ハンドの終わりにポットが勝った人へ渡り、勝ったら「あなたの勝ち」が出る（第14章_ハンドの終わり・PC_1280x800）：（WebKit は字の幅が違うので ⚠️）最後まで残って負けたのに「あなたの負け」が出ていない（出す処理は通った）・［pushing=false potmove=0 wonPile=1(2) anim=running,running,running,running,running,running,running,runn potPile=0］（4秒待っても、そろわなかった）

## 勝率

- ✅ 第1章の勝率：勝率 75%（6/8、80ハンドで決着しない回は負け扱い）、基準 79%（許す幅 ±42）
- ✅ 第2章の勝率：勝率 25%（2/8、80ハンドで決着しない回は負け扱い）、基準 17%（許す幅 ±38）
- ✅ 第3章の勝率：勝率 38%（3/8、80ハンドで決着しない回は負け扱い）、基準 50%（許す幅 ±51）
- ✅ 第4章の勝率：勝率 63%（5/8、80ハンドで決着しない回は負け扱い）、基準 54%（許す幅 ±51）
- ✅ 第4章：クセの札は相手のフロップ以降の賭け・上げのときだけ：札 69回のうち、それ以外で出たのは 0回

## 台詞の変化（lines_diff.md）

足した 0行、消した 0行（全部で 1963行）。⚑ は気をつける印。



## 画面

- 一覧（まず これを見る）：ui/_一覧_縦.jpg・ui/_一覧_横.jpg・ui/_一覧_PC.jpg（iPhone の Safari は ui/_一覧_WebKit_縦.jpg ほか）
- 前の版から見た目が変わった画面 29枚（「前｜今｜違う所」を1枚にした ui/_比べ_<名前>.jpg を見る）：フリー6人_ディーラーの呼び名_PC_1280x800.jpg（12.7%）、フリー6人_ディーラーの呼び名_横_844x390.jpg（4.5%）、フリー6人_ディーラーの呼び名_縦_390x844.jpg（3.2%）、フリー6人_ハンドの終わり_PC_1280x800.jpg（11.8%）、フリー6人_ハンドの終わり_横_844x390.jpg（16.9%）、フリー6人_ハンドの終わり_縦_390x844.jpg（30.1%）、フリー6人_レイズを開く_縦_390x844.jpg（3%）、フリー6人_人だかり_PC_1280x800.jpg（3.5%）、フリー6人_人だかり_横_844x390.jpg（3.4%）、フリー6人_人だかり_縦_390x844.jpg（9.3%）、フリー6人_心の声_PC_1280x800.jpg（4.3%）、フリー6人_心の声_横_844x390.jpg（14.2%）、フリー6人_心の声_縦_390x844.jpg（31.3%）、店で遊ぶ_自分の番_PC_1280x800.jpg（10.4%）、第14章_ハンドの終わり_PC_1280x800.jpg（10.2%）、第14章_ハンドの終わり_横_844x390.jpg（14.9%）、第14章_ハンドの終わり_縦_390x844.jpg（19.5%）、第14章_自分の番_PC_1280x800.jpg（11.1%）、第14章_自分の番_横_844x390.jpg（12.5%）、第14章_自分の番_縦_390x844.jpg（12.4%）、第1章_自分の番_縦_390x844.jpg（3%）、第2章_ハンドの終わり_PC_1280x800.jpg（5.2%）、第2章_ハンドの終わり_横_844x390.jpg（3.9%）、第2章_ハンドの終わり_縦_390x844.jpg（14%）、第6章_自分の番_横_844x390.jpg（16.6%）、第7章_ハンドの終わり_縦_390x844.jpg（4%）、英語_フリー6人_自分の番_縦_390x844.jpg（3.6%）、裏の卓_自分の番_PC_1280x800.jpg（10%）、裏の卓_自分の番_縦_390x844.jpg（13.6%）

全部の結果は report.md、基準を書き直すときは baseline_候補.json（qa/baseline.json に写す。本線だけ、satou さんの OK のあと）。
