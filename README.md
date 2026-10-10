# last-tell

LAST TELL（最後のテル）のテスト公開用サイト。https://satou-aaaaa.github.io/last-tell/

- `index.html`：ゲーム本体（`story/shisho.html`）をそのままコピーしたもの（v56 から PWA の行はゲーム側に入っている）
- `privacy*.html`、`terms*.html`、`support*.html`、`licenses/`：ゲームの「その他」画面からつながるページ。index.html と同じ場所に置く
- `manifest.webmanifest`、`sw.js`、`icons/`：ホーム画面に追加して、オフラインでも遊べるようにするためのファイル

## 更新のしかた
1. 新しいブランチで index.html を作り直す
   ```
   git checkout -b v0.61
   python3 tools/build_index.py /mnt/project-files/story/shisho.html
   git add -A && git commit -m "テスト公開を v0.61 にする" && git push -u origin v0.61
   ```
2. プルリクエストを出す（ひな形の「確かめたこと」を埋める）。検査（QA）が ✅ になったらマージする
3. マージすると自動で次のことが起きる
   - テスト公開が更新される（Pages）
   - 版の印（タグ `v0.61.0`）とリリースが作られる（Release tag）。過去の版はリリースの一覧から取り出せる

`build_index.py` は index.html を作り直し、`sw.js` の版を書き換えます（古い保存版が入れ替わる）。
shisho.html に manifest か SW 登録が無いとき（v55 以前）は止まります。

## テスターからの報告
Issues の「不具合の報告」「感想・要望」から書いてもらいます（日本語・英語の両方の欄があります）。
Issues は誰でも見られるので、個人的な連絡はサポートページへ案内しています。

## このリポジトリの GitHub の仕組み
- `.github/pull_request_template.md`：プルリクエストのひな形
- `.github/ISSUE_TEMPLATE/`：テスター向けの報告フォーム
- `.github/workflows/pages.yml`：テスト公開（Settings → Pages の公開元が「GitHub Actions」のときだけ動く。遊ぶ人に要るファイルだけを出す）
- `.github/workflows/release.yml`：版が上がったらタグとリリースを作る
- `.github/dependabot.yml`：Actions の部品を月1回新しくする
- `.gitattributes`：index.html の差分をプルリクエストで畳む
