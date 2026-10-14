#!/bin/bash
# 検査のまとめをブランチ qa-results に置く（GitHub の Actions の中で使う。.github/workflows/qa.yml・playthrough.yml）
#   bash qa/tools/publish_results.sh <まとめのフォルダ> <置き場所 pr/22 など> [もう1つの置き場所 v0.75.0 など]
# qa-results はいつも1つのコミットだけ（履歴を持たない）。pr/・branch/ は14日、v<版>/ は新しい8版だけ残す。
# ほかの実行と重なったら、最新を取り直して5回までやり直す。
set -u
src=$1; key=$2; vkey=${3:-}
ws=${GITHUB_WORKSPACE:-$(pwd)}
export GIT_AUTHOR_NAME="github-actions[bot]" GIT_COMMITTER_NAME="github-actions[bot]"
export GIT_AUTHOR_EMAIL="41898282+github-actions[bot]@users.noreply.github.com" GIT_COMMITTER_EMAIL="41898282+github-actions[bot]@users.noreply.github.com"
for i in 1 2 3 4 5; do
  old=""
  git -C "$ws" fetch -q --depth 1 origin +qa-results:refs/remotes/origin/qa-results 2>/dev/null && old=$(git -C "$ws" rev-parse origin/qa-results)
  rm -rf /tmp/r && mkdir /tmp/r && git -C /tmp/r init -q
  [ -n "$old" ] && git -C "$ws" archive "$old" | tar -x -C /tmp/r
  rm -rf "/tmp/r/$key" && mkdir -p "/tmp/r/$key" && cp -r "$src"/. "/tmp/r/$key/"
  if [ -n "$vkey" ]; then rm -rf "/tmp/r/$vkey" && cp -r "/tmp/r/$key" "/tmp/r/$vkey"; fi
  for d in /tmp/r/pr/* /tmp/r/branch/*; do
    [ -f "$d/run.txt" ] || continue
    at=$(sed -n 's/^at: //p' "$d/run.txt")
    if [ -n "$at" ] && [ $(( $(date +%s) - $(date -d "$at" +%s) )) -gt 1209600 ]; then rm -rf "$d"; fi
  done
  ls -d /tmp/r/v*/ 2>/dev/null | sed 's#/tmp/r/v##; s#/$##' | sort -V | head -n -8 | while read v; do rm -rf "/tmp/r/v$v"; done
  cp "$ws/qa/tools/qa-results-README.md" /tmp/r/README.md 2>/dev/null || true
  git -C /tmp/r add -A && git -C /tmp/r commit -q -m "QA $key (${GITHUB_SHA:0:7})"
  git -C "$ws" fetch -q /tmp/r +HEAD:refs/heads/qa-results-new
  if git -C "$ws" push -q --force-with-lease="qa-results:$old" origin qa-results-new:qa-results; then
    echo "置いた: $key ${vkey:+と $vkey}"; exit 0
  fi
  sleep $((i * 5))
done
echo "::warning title=qa-results に置けなかった::5回とも ほかの実行と重なった。結果は Actions の成果物にある"
