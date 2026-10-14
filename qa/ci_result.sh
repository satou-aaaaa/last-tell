#!/bin/sh
# GitHub（CI）で回った検査の結果を読む（2026-10-14 検証をCIに寄せる）。Claude のスレッドは検査を自分で回さず、これで読む。
#   sh qa/ci_result.sh <PR番号>            CI の各組の ✅/❌ と、まとめ（summary.md）を出す。まだ回っていれば「回っている」と出して終わる（終了コード 3）
#   sh qa/ci_result.sh <PR番号> --shots    画面の一覧3枚（縦・横・PC）と、前の版から変わった画面を手元に落として、場所を出す
#   sh qa/ci_result.sh <PR番号> --report   全部の結果（report.md）も出す
#   sh qa/ci_result.sh v0.75.0 [--shots]   公開した版の結果（qa-results の v<版>/）
#   sh qa/ci_result.sh nightly             毎晩の「通しで遊ぶ」の結果
#   sh qa/ci_result.sh <PR番号> --save v75 共有フォルダの qa/reports/v75/ に summary・report・result・画面を写す（版の正式な結果。本線だけ）
# 終了コード：0 合格、1 不合格、3 まだ回っている、2 読めない
# 待つときは sleep で待たない：subscribe_pr_activity で CI の終わりを知らせてもらい、知らせが来てから1回だけ読む。
R=satou-aaaaa/last-tell
Q=$(cd "$(dirname "$0")" && pwd)
arg=$1; shift
shots=; report=; save=
while [ $# -gt 0 ]; do case $1 in --shots) shots=1;; --report) report=1;; --save) save=$2; shift;; esac; shift; done
get() { gh api -H 'Accept: application/vnd.github.raw' "repos/$R/contents/$1?ref=qa-results" 2>/dev/null; }

case $arg in
  v[0-9]*) dir=$arg ;;
  nightly) dir=nightly ;;   # 毎晩の「通しで遊ぶ」
  [0-9]*)
    dir=pr/$arg
    sha=$(gh api "repos/$R/pulls/$arg" --jq .head.sha) || { echo "PR #$arg が読めない"; exit 2; }
    runs=$(gh api "repos/$R/commits/$sha/check-runs?per_page=100" --jq '.check_runs[] | select(.app.slug=="github-actions") | [.name, .status, (.conclusion // "-"), .id] | @tsv')
    [ -z "$runs" ] && { echo "PR #$arg（${sha%${sha#???????}}）の CI はまだ始まっていない"; exit 3; }
    echo "## CI（PR #$arg、${sha%${sha#???????}}）"
    echo "$runs" | awk -F'\t' '{ m = $2!="completed" ? "…" : $3=="success" ? "✅" : $3=="skipped" ? "－" : "❌"; print m, $1 }'
    if echo "$runs" | awk -F'\t' '$2!="completed"' | grep -q .; then echo; echo "まだ回っている（終わったら知らせが来る）"; exit 3; fi
    # まとめが置けなかったときに備えて、注釈も出す（❌ と ⚠️）
    sid=$(echo "$runs" | awk -F'\t' '$1=="検査のまとめ"{print $4}' | head -1)
    got=$(get "$dir/run.txt" | sed -n 's/^sha: //p')
    if [ "$got" != "$sha" ]; then
      echo; echo "qa-results に、このコミットのまとめが無い（$got）。注釈だけ出す："
      for id in $(echo "$runs" | awk -F'\t' '$3!="success"{print $4}') $sid; do
        gh api "repos/$R/check-runs/$id/annotations" --jq '.[] | "- [\(.annotation_level)] \(.title // ""): \(.message)"' 2>/dev/null
      done
      echo "$runs" | awk -F'\t' '$3!="success" && $3!="skipped"' | grep -q . && exit 1 || exit 0
    fi ;;
  *) echo "使い方: sh qa/ci_result.sh <PR番号|v版> [--shots] [--report] [--save v<版>]"; exit 2 ;;
esac

echo
get "$dir/summary.md" || { echo "$dir の結果が qa-results に無い"; exit 2; }
[ -n "$report" ] && { echo; get "$dir/report.md"; }

if [ -n "$shots" ] || [ -n "$save" ]; then
  if [ -n "$save" ]; then out=$Q/reports/$save; else out=${TMPDIR:-/tmp}/qa-ci/$(echo "$dir" | tr / -); fi
  mkdir -p "$out/ui"
  for f in summary.md report.md result.json baseline_候補.json uiux.json lines_diff.md run.txt; do get "$dir/$f" > "$out/$f" || rm -f "$out/$f"; done
  list="_一覧_縦.jpg _一覧_横.jpg _一覧_PC.jpg changes.json"
  # 変わった画面は「前｜今｜違う所」の1枚（_比べ_…）だけ落とす。--save のときは全部
  if [ -n "$save" ]; then list=$(gh api "repos/$R/contents/$dir/ui?ref=qa-results" --jq '.[].name')
  else list="$list $(get "$dir/ui/changes.json" | node -e "const c=JSON.parse(require('fs').readFileSync(0,'utf8')||'{}');console.log(Object.keys(c).filter(k=>c[k].status!=='same').map(k=>c[k].status==='new'?k:'_比べ_'+k).join(' '))" 2>/dev/null)"; fi
  for f in $list; do get "$dir/ui/$f" > "$out/ui/$f" || rm -f "$out/ui/$f"; done
  echo; echo "画面と結果の置き場所: $out"; ls "$out/ui" | sed 's/^/  /'
fi
grep -q '❌ 不合格' "${out:-/dev/null}/summary.md" 2>/dev/null && exit 1
get "$dir/summary.md" | grep -q '❌ 不合格' && exit 1 || exit 0
