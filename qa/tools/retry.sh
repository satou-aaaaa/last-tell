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
  # 上限で打ち切っても、中で sudo が起こした apt-get は残って dpkg の鍵を持ったままになる。
  # 次の回がすぐ「Could not get lock /var/lib/dpkg/lock-frontend」で落ちるので、残った apt が終わるまで待つ
  # （2026-11-26 #166 WebKit fuzz：1回目が 420秒で打ち切り → 2・3回目が鍵で数秒で ❌。同じことが 2 回あった）
  n=0; while pgrep -x apt-get >/dev/null 2>&1 || pgrep -x dpkg >/dev/null 2>&1; do
    [ "$n" -ge "${QA_APT_WAIT:-600}" ] && { echo "::warning title=入れる段階のやり直し::前の apt が ${n}秒たっても終わらない。そのままやり直す"; break; }
    [ "$n" = 0 ] && echo "前の回の apt がまだ動いているので、終わるまで待つ（最大 ${QA_APT_WAIT:-600}秒）"
    sleep 5; n=$((n + 5))
  done
done
echo "::error title=入れる段階の失敗::$* が $tries 回とも失敗した（終了コード $code）"
exit "$code"
