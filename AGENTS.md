# AGENTS.md

<!-- AI エージェント共通の指示（Claude・Codex・Gemini・Copilot などが読む）。CLAUDE.md はこれを取り込むだけ。 -->

LAST TELL（最後のテル）のテスト公開用サイト。ゲーム本体は別の場所（`story/shisho.html`）で作り、ここには公開用のコピーを置く。更新の手順は README.md。

## 準備（最初に一度）

```bash
bash scripts/setup.sh   # Node.js（版は .nvmrc）と Python 3 を確かめ、qa/ の依存とブラウザを入れる。何度実行してもよい（Windows は Git Bash で）
```

Claude Code のクラウドセッションでは `.claude/settings.json` のフックが自動で実行する。

## push する前の確認

```bash
python3 tools/build_index.py <shisho.html>   # index.html を作り直し、sw.js の版を上げる（index.html を手で直さない）
node qa/unit/run.js   # ブラウザを使わない数秒の単体テスト（それ以外は CI の QA に任せる）
```

検査の種類と直し方は `qa/README.md`。

## 公開とマージ

- QA が全部 ✅ になった PR は Auto merge が自動でマージし、Pages（公開）と Release tag（版の印）を起こす。
  止めたいときは下書きにするか、ラベル「自動マージしない」を付ける。
  Auto merge が拾わない PR（.github/ を変えるもの、QA が回らないもの）は、CI が緑ならエージェントがマージする（satou さん 2026-10-16）。
- ブランチ `qa-results`（QA の結果置き場）と `source-backup`（ソースの控え）は消さない。

## 共通のきまり

- PR の作り方・マージの仕方は satou-aaaaa/shared-workflows の `routines/pr.md`、全体のきまりは `routines/common.md` に従う。
- CI の部品（CI失敗Issue・死活監視・ブランチ片付け・自動マージ）は shared-workflows の共通部品を呼ぶ。
  リポジトリ側の .github/workflows には呼び出しと設定値だけを書く。
- Claude 以外の AI・人が作業するときは、shared-workflows の `routines/tool-map.md`（道具の置き換え）と `routines/without-claude.md` を読む。
