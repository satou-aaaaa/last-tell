# GitHub の効率的な使い方（LAST TELL）

2026-10-10 作成。対象はテスト公開のリポジトリ satou-aaaaa/last-tell（公開）。
ソースの正本は共有フォルダの src/ のまま（別の非公開リポジトリは作らない、2026-10-10 決定）。

## 流れ（これからの公開のしかた）
1. 本線のスレッドが `story/shisho.html` を作る
2. last-tell に新しいブランチを切り、`tools/build_index.py` で index.html を作り直してプルリクエストを出す
3. 検査（QA、#1）が自動で回る。全部 ✅ なら自動でマージされる（automerge.yml、2026-10-10 satou の依頼）。止めたいときは下書きにするか、ラベル「自動マージしない」
4. マージされると、テスト公開の更新と、版のタグ・リリース（v0.61.0 など）が自動で行われる

main への直接プッシュはやめ、必ずプルリクエストを通す。✅ を見てからマージするので、壊れた版が公開されにくくなる。

## 入れたもの（PR #2、マージ待ち）
| もの | 何が楽になるか |
|---|---|
| プルリクエストのひな形 | QA ✅・縦横PCの画面・sw の版・ネタバレや src を入れていないか、を毎回チェック欄で確かめられる |
| Issues の報告フォーム（不具合／感想・要望、日英） | テスターの報告が同じ形でそろう。端末・章・版が必ず書かれる。個人の連絡はサポートページへ案内 |
| ラベル「テスターから」「感想」（作成済み） | フォームから来たものが一覧で絞り込める |
| 版のタグとリリース（release.yml） | index.html の APP_VERSION が上がると v0.61.0 などが自動で付く。昔の版をすぐ取り出せる |
| Actions での公開（pages.yml） | 遊ぶ人に要るファイルだけを公開し、tools/ や qa/ は出さない。公開元を切り替えるまでは何もしない |
| Dependabot（Actions の部品） | checkout などを月1回まとめて更新する PR が来る。qa/ が入ったら npm も足す |
| 自動マージ（automerge.yml） | QA が全部 ✅ で、検査したコミットのままなら squash でマージし、公開とタグを起こし、ブランチを消す。フォークからの PR はしない。QA が回らない PR（index.html も qa/ も変わらないもの）は手でマージ |
| .gitattributes | プルリクエストで 85 万字の index.html の差分を畳み、見たい変更だけが見える |

## satou さんの操作が必要なもの（Claude からは変えられない設定）
必須は「PR #1 と #2 をマージ」と下の 1 だけ。2 以降はあると良いもの。
1. PR #2 をマージしたあと、Settings → Pages → Source を「GitHub Actions」にする
2. Actions → Release tag → Run workflow を1回押す（今の v0.60.0 のタグを作る）
3. Settings → Rules → Rulesets で main に「プルリクエスト必須」「強制プッシュと削除を禁止」を付ける（自分は迂回できるようにしておく）。「QA が ✅ 必須」も付けたくなるが、QA は index.html が変わるときだけ回るので、それ以外の PR（#2 のような設定の変更）が永久に待たされる。QA を全部の PR で回すようにしてから付ける
4. （不要になった）「Allow auto-merge」と「Automatically delete head branches」：自動マージと、ブランチの片付けは automerge.yml がするので、設定は変えなくてよい
5. Settings → General で Wiki と Projects をオフ（使っていない）
6. Settings → Code security で Dependabot alerts、Secret scanning、Private vulnerability reporting をオン（公開リポジトリは無料）
7. リポジトリ右上の Watch → Custom → Issues をオン（テスターの報告がメールで届く）

## 調べてわかったこと（Claude 側の作業のコツ）
- Claude のセッションからは GitHub の GraphQL が使えないので、`gh pr create` は失敗する。`gh api repos/satou-aaaaa/last-tell/pulls -f ...`（REST）で作る
- Pages・ブランチ保護・リリース作成は Claude 側の権限では変えられない／確認を求められる。設定は上の一覧で satou さんが行う
- QA の Actions は1回30分ほどかかる。公開は1日1〜2回にまとめると待ち時間が少ない（開発の効率化の提案6と同じ）
- 公開リポジトリなので Actions の時間は無料・無制限
