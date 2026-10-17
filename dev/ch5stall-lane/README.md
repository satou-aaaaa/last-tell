# 第5章の回想で止まる件のレーン（2026-10-17）
- 直したファイル：src/js/47_video_fixes.js だけ（A1 の render フックで隠した #btnRaise に data-vfHid を付け、ask が終わったら hidden を戻す）
- 書き戻し：python3 dev/tools/lane.py writeback dev/ch5stall-lane js/47_video_fixes.js（3方向マージ）
- 検査：CI PR #74（検査だけ）。qa/lib/harness.js（自分の番に押せるボタンが無いと ❌）と qa/checks/fuzz.js（モード「第5章→回想」）は共有フォルダの qa/ に直接入れた
