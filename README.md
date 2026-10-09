# last-tell

LAST TELL（最後のテル）のテスト公開用サイト。https://satou-aaaaa.github.io/last-tell/

- `index.html`：ゲーム本体（`story/shisho.html`）をそのままコピーしたもの（v56 から PWA の行はゲーム側に入っている）
- `privacy*.html`、`terms*.html`、`support*.html`、`licenses/`：ゲームの「その他」画面からつながるページ。index.html と同じ場所に置く
- `manifest.webmanifest`、`sw.js`、`icons/`：ホーム画面に追加して、オフラインでも遊べるようにするためのファイル

## 更新のしかた
```
python3 tools/build_index.py /mnt/project-files/story/shisho.html
git add -A && git commit -m "..." && git push origin main
```
`build_index.py` は index.html を作り直し、`sw.js` の版を書き換えます（古い保存版が入れ替わる）。
shisho.html に manifest か SW 登録が無いとき（v55 以前）は止まります。
