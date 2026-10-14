#!/bin/sh
# 作業途中のゲームを GitHub（CI）で検査する（2026-10-14 検証をCIに寄せる）。手元で run_all を回す代わりに使う。
#   sh qa/ci_check.sh <作った.html> <名前>        例: sh qa/ci_check.sh /tmp/lane.html fold-fast
# - last-tell に check-<名前> ブランチを作り（あれば上書き）、index.html と共有フォルダの qa/ を入れて、下書きのプルリクエストを出す
#   （下書きなので自動マージされない。公開もされない）。同じ名前で2回目からは同じプルリクエストに積む
# - 最後に PR 番号を出す。そのあと subscribe_pr_activity でその PR を見張り、CI が終わった知らせが来たら
#   sh qa/ci_result.sh <番号> [--shots] で読む（sleep で待たない）
# - 使い終わったら（書き戻したら）プルリクエストを閉じる：gh api -X PATCH repos/satou-aaaaa/last-tell/pulls/<番号> -f state=closed
#   ブランチは閉じたあとに消してよい
# 公開の版は今までどおり本線が publish-v<版> ブランチで出す（こちらは長い版で回る）。
set -e
R=satou-aaaaa/last-tell
html=$1; name=$2
[ -f "$html" ] && [ -n "$name" ] || { echo "使い方: sh qa/ci_check.sh <作った.html> <名前>"; exit 2; }
Q=$(cd "$(dirname "$0")" && pwd)
work=${TMPDIR:-/tmp}/lt-check-$name-$$
git clone -q --depth 1 "https://github.com/$R" "$work"
cd "$work"
br=check-$name
git checkout -q -b "$br"
python3 tools/build_index.py "$(cd "$(dirname "$html")" && pwd)/$(basename "$html")" > /dev/null
# build_index.py は html のとなりの ../qa を写すので、共有フォルダの qa/ を改めて写す
rsync -a --delete --exclude reports --exclude node_modules "$Q/" qa/ 2>/dev/null || { rm -rf qa && cp -r "$Q" qa && rm -rf qa/reports qa/node_modules; }
git add -A
ver=$(grep -o "APP_VERSION='[^']*'" index.html | head -1 | cut -d"'" -f2)
git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -q -m "検査だけ（$name、v$ver）" || true
git push -q -f origin "$br"
pr=$(gh api "repos/$R/pulls?state=open&head=${R%%/*}:$br" --jq '.[0].number // empty')
if [ -z "$pr" ]; then
  pr=$(gh api "repos/$R/pulls" -f title="検査だけ: $name（v$ver）" -f head="$br" -f base=main -F draft=true \
    -f body="作業途中のゲームを CI で検査するためのプルリクエストです。マージしません（qa/ci_check.sh が作った。使い終わったら閉じる）。" --jq .number)
fi
cd / && rm -rf "$work"
echo "PR #$pr（https://github.com/$R/pull/$pr）。CI が終わったら: sh $Q/ci_result.sh $pr"
