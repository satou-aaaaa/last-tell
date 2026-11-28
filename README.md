# qa-results（検査の結果の置き場所）

GitHub の自動実行（.github/workflows/qa.yml の「検査のまとめ」）が書くブランチです。手で書き換えないでください。
いつも1つのコミットだけで、履歴は持ちません。

| フォルダ | 中身 |
|---|---|
| `pr/<番号>/` | そのプルリクエストの最新の検査（14日で消える） |
| `v<版>/` | 公開した版の検査（公開のプルリクエスト publish-…。新しい8版だけ残す）。次の版の画面の比べに使う |
| `branch/<名前>/` | 手で回したときなど |

各フォルダ：`summary.md`（まずこれ）、`report.md`（全部）、`result.json`、`baseline_候補.json`、`uiux.json`、`run.txt`（どのコミット・どの実行か）、
`ui/_一覧_縦.jpg`・`_一覧_横.jpg`・`_一覧_PC.jpg`（12場面を1枚に）、`ui/<場面>_<画面>.jpg`、`ui/changes.json`（前の版から変わった画面）。

読み方：共有フォルダの `sh qa/ci_result.sh <プルリクエストの番号>`（qa/README.md）。
