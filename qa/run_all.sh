#!/bin/sh
# 使い方: sh qa/run_all.sh [ゲームのファイル] [--full]
#   何も付けない → 短い版（毎回の変更で回す、15分ほど）
#   --full       → 長い版（公開の前に回す）
cd "$(dirname "$0")" && node run_all.js "$@"
