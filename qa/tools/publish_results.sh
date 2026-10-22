#!/bin/bash
# 検査のまとめをブランチ qa-results に置く（GitHub の Actions の中で使う。.github/workflows/qa.yml・playthrough.yml）
#   bash qa/tools/publish_results.sh <まとめのフォルダ> <置き場所 pr/22 など> [もう1つの置き場所 v0.75.0 など]
# qa-results はいつも1つのコミットだけ（履歴を持たない）。pr/・branch/ は14日、v<版>/ は新しい8版だけ残す。
# ほかの実行と重なったら、最新を取り直して5回までやり直す。
# qa-results は 1GB を超える（画面の写真が多い）ので、中身（blob）は落とさず、木（tree）だけ取って組み替える。
# 落とすのは古さを見る run.txt だけ（CIの時間短縮 2026-10-22。前は毎回 1GB を落として約2分半かかっていた）。
set -u
src=$1; key=$2; vkey=${3:-}
ws=${GITHUB_WORKSPACE:-$(pwd)}
export GIT_AUTHOR_NAME="github-actions[bot]" GIT_COMMITTER_NAME="github-actions[bot]"
export GIT_AUTHOR_EMAIL="41898282+github-actions[bot]@users.noreply.github.com" GIT_COMMITTER_EMAIL="41898282+github-actions[bot]@users.noreply.github.com"
# 日本語の名前を "…" で囲ませない（囲まれると名前の比べがずれる）
g() { git -C "$ws" -c core.quotepath=off "$@"; }
for i in 1 2 3 4 5; do
  old=""
  g fetch -q --depth 1 --filter=blob:none origin +qa-results:refs/remotes/origin/qa-results 2>/dev/null && old=$(g rev-parse origin/qa-results)
  export GIT_INDEX_FILE=/tmp/qa-results.index
  rm -f "$GIT_INDEX_FILE"
  if [ -n "$old" ]; then g read-tree "$old"; else g read-tree --empty; fi
  # 置き場所を入れ替える
  g rm -r -q -f --cached --ignore-unmatch -- "$key" >/dev/null
  [ -n "$vkey" ] && g rm -r -q -f --cached --ignore-unmatch -- "$vkey" >/dev/null
  # 載せる段で失敗したら置かない（消しただけの木を push しない）
  fail() { unset GIT_INDEX_FILE; echo "::warning title=qa-results に置けなかった::$1。結果は Actions の成果物にある"; exit 0; }
  { rm -rf /tmp/qa-w && mkdir -p "/tmp/qa-w/$key" && cp -r "$src"/. "/tmp/qa-w/$key/"; } || fail "まとめを写せなかった"
  git --git-dir="$ws/.git" --work-tree=/tmp/qa-w -C /tmp/qa-w add -A -f -- "$key" || fail "git add に失敗した"
  if [ -n "$vkey" ]; then
    # 同じ中身を v<版>/ にも載せる（read-tree --prefix は全部の blob を落とすので使わない）
    g ls-files -s -z -- "$key/" | sed -z "s#\t$key/#\t$vkey/#" | g update-index -z --index-info || fail "$vkey に写せなかった"
  fi
  # pr/・branch/ の14日より古いもの（run.txt の at で見る。run.txt の中身だけまとめて取る）
  now=$(date +%s)
  # 今回の $key/run.txt はまだ origin に無いので除く（混ざるとまとめ取りが失敗し、1件ずつ取りに行って遅くなる）
  runs=$(g ls-files -s -z -- 'pr/*/run.txt' 'branch/*/run.txt' | tr '\0' '\n' | awk -F'\t' -v k="$key/run.txt" '$2 != k {split($1, a, " "); print a[2]"\t"$2}')
  oids=$(printf '%s\n' "$runs" | cut -f1 | grep . || true)
  [ -n "$oids" ] && [ -n "$old" ] && g -c fetch.negotiationAlgorithm=noop fetch -q --no-tags --no-write-fetch-head --filter=blob:none origin $oids 2>/dev/null
  printf '%s\n' "$runs" | while IFS=$'\t' read -r oid path; do
    [ -n "$oid" ] || continue
    d=${path%/run.txt}
    [ "$d" = "$key" ] && continue
    at=$(g cat-file blob "$oid" 2>/dev/null | sed -n 's/^at: //p')
    if [ -n "$at" ] && [ $(( now - $(date -d "$at" +%s) )) -gt 1209600 ]; then g rm -r -q -f --cached -- "$d" >/dev/null; fi
  done
  # v<版>/ は新しい8版だけ
  g ls-files -z -- 'v*' | tr '\0' '\n' | cut -d/ -f1 | sort -u | sed 's/^v//' | sort -V | head -n -8 | while read -r v; do g rm -r -q -f --cached -- "v$v" >/dev/null; done
  if [ -f "$ws/qa/tools/qa-results-README.md" ]; then
    g update-index --add --cacheinfo "100644,$(g hash-object -w qa/tools/qa-results-README.md),README.md"
  fi
  tree=$(g write-tree --missing-ok)   # 無い blob を取りに行かせない
  commit=$(echo "QA $key (${GITHUB_SHA:0:7})" | g commit-tree "$tree")
  unset GIT_INDEX_FILE
  if g push -q --force-with-lease="qa-results:$old" origin "$commit:refs/heads/qa-results"; then
    echo "置いた: $key ${vkey:+と $vkey}"; exit 0
  fi
  sleep $((i * 5))
done
echo "::warning title=qa-results に置けなかった::5回とも ほかの実行と重なった。結果は Actions の成果物にある"
