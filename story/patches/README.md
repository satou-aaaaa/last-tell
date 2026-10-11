# shisho.html の作り直し手順（パッチの順番）

各パッチは `python3 patchNN.py 入力.html 出力.html`。ファイル名の work番号は作業用の出力名で、パッチ番号とは別です（patch38/42/43 というパッチは無く、work38/42/43 は途中の出力名）。

- v53 = 以前の版（story/shisho-v53.html 相当）
- v54 = v53 → patch24_needle → patch27_fix
- v55 = v54 → patch28_names → patch26_anohi
- v56 = v55 → patch30_release → patch29_small → APP_VERSION 0.56.0
- v57 = v56 → patch33_rich → patch32_faces → patch34_scar → patch36_cue → patch37_myhand → 0.57.0
- v58 = v57 → patch35_diverse → patch40_fixes(当時の版) → 0.58.0
  - 注: patch40_fixes は v59 でツアー位置の修正を足したので、今の patch40 は v58 時点のものより大きい
- v59 = v58の元(work38 = v57→patch35) → patch39_story → patch26_anohi → patch40_fixes → patch41_scene → 0.59.0
- v60 = v59 → patch44_part2 → patch45_scenefit → 0.60.0
- v61 = v60 → patch46(作業) → patch47_banter → patch51_qa → patch52_qa2 → patch53_en → patch54_en → 0.61.0
- v62 = v61 の src ＋ 主人公・回想のレーン（src/js/31_hero.js, 31_flash.js ほか）＋ patch48_music → 0.62.0
- v63（作業中）= v62 → patch49_pro（v62 向けに直した版）→ patch50_poker → patch55_herobeats → patch57_review → patch58_seats → patch61_peek → patch62_recap → patch63_tutorial → patch64_creator →（patch56_rules・patch59_duel・patch60_venuebg）→ 0.63.0
  - src/ へは dev/tools/port_patch.py で写す（レーンのファイルの中身を変えるパッチは、そのレーンのファイルに直接当てる）

各版の完成品は story/shisho-vNN.html にあります。
- 音楽（保留中）= patch48_music（JSは sound48.js）。v61 以降の版に当てられる。店「舫」用に新しい曲 moyai を追加、カラスの曲は6章の最後の2段階またはクロウとの一対一で流れる。
