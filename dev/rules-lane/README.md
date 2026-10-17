# ルールの単体テスト レーン（2026-10-14）

satou さん「ポーカーのルールのテスト等は、UIからではなく、ドメインロジックをテストするコードを書けば良い」への対応。
ルールの計算を画面から切り離して `js/19b_rules.js`（`Rules.*`）にまとめ、`qa/unit/` が Node から直接確かめる。

## 本線にお願いすること
1. 書き戻し：`python3 dev/tools/lane.py writeback dev/rules-lane js/19_deck_eval.js js/19b_rules.js js/23_house_rules.js js/24_dokidoki_camera.js js/27_render.js order.json`
   - order.json は `js/19a_seed.js` の直後に `js/19b_rules.js` を足しただけ。
2. いつもどおり組み立てて `sh qa/run_all.sh`（unit が一番先に回る。数秒）。

## 変えたところ（動きは変えていない）
| ファイル | 中身 |
|---|---|
| js/19b_rules.js（新） | Rules.next・seats（SB/BBの席、デッドボタン）・raise（最低レイズ）・reopen（足りないオールイン、R-10）・raiseBounds・betOf・uncalled（返す額）・awards（サイドポット・引き分け・端数・アンティ・2回めくり） |
| js/19_deck_eval.js | 最初と最後に `// @unit-begin deck_eval` `// @unit-end deck_eval` の印だけ |
| js/23_house_rules.js | startHand の SB/BB の席の決め方 → Rules.seats |
| js/24_dokidoki_camera.js | act のレイズの決まり → Rules.raise・Rules.reopen、refundUncalled → Rules.uncalled、showdown の配り方 → Rules.awards |
| js/27_render.js | raiseBounds → Rules.raiseBounds |

## 確かめたこと
- 前のコード（そのまま写したもの）と Rules の答えを、でたらめな入力 20万回で突き合わせて全部一致（返す額・配り方・席・権利の戻り・最低レイズ）。
- `node qa/unit/run.js` 全部 ✅。わざと間違えた Rules（アンティを数える、最低ちょうどをレイズ扱いしない、サイドポットを無視、2人のSB）は全部 ❌ になる。
- ブラウザの検査（basics・rules・fuzz・ui）の結果は下に追記。
- 2026-10-14 05:30Z：組み立てた lane.html（0.75.0）で `run_all.js --only unit,basics,rules,fuzz,ui`：ok 79 / fail 0 / 🟡 4（前からある画面の問題：レイズ欄の裏の伏せ札、身なり）。unit 7秒、fuzz 401秒、rules 514秒、basics 180秒、ui 142秒（同じ機械でほかの検査と並べて回したので、ブラウザの検査の秒数は参考）。
- 画面：スマホ縦・横・PC の12場面で新しい重なり・はみ出し・隠れは無し（画面は変えていない）。
- GitHub：PR #21（qa/ と qa.yml の unit の組）は全部の組が ✅、unit の組は10秒。
