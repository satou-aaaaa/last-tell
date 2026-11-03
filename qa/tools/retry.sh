#!/usr/bin/env bash
# 入れる段階（npm ci・Playwright のブラウザ）を、間を空けてやり直す（2026-11-03 CI の失敗を減らす）
#   bash qa/tools/retry.sh <回数> <1回の上限秒> <コマンド…>
# 2026-10-21 main の QA（run 39683777941）で、Playwright の配り元 cdn.playwright.dev が一時的に別の証明書を返し
# （ERR_TLS_CERT_ALTNAME_INVALID）、Playwright 自身の5回のやり直しが 2秒の間に全部失敗して組ごと ❌ になった。
# 外の配り元の一時的な不調は数十秒で戻ることが多いので、15秒・30秒…と間を空けてやり直す。
# 1回ごとに上限（秒）を付けて、止まったまま組の 60分を使い切らないようにする（apt の apt_try と同じ考え）。
# 検査そのものには使わない（検査のやり直しは本物の不具合を隠すため。入れる段階だけ）。
set -u
tries=${1:?回数}; limit=${2:?1回の上限秒}; shift 2
for i in $(seq 1 "$tries"); do
  timeout "$limit" "$@" && exit 0
  code=$?
  [ "$i" -lt "$tries" ] || break
  wait=$((${QA_RETRY_WAIT:-15} * i))   # 単体テストは QA_RETRY_WAIT=0
  echo "::warning title=入れる段階のやり直し::$* が失敗した（$i 回目、終了コード $code）。${wait}秒待ってやり直す"
  sleep "$wait"
done
echo "::error title=入れる段階の失敗::$* が $tries 回とも失敗した（終了コード $code）"
exit "$code"
