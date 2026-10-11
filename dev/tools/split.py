#!/usr/bin/env python3
"""shisho.html を src/ の小さなファイルに分ける（切り替えのときに1回だけ使う）。
   python3 split.py shisho.html OUTDIR
区切りは行番号ではなく見出しコメントの文字で探すので、v61 以降にもそのまま使える。
見つからない見出しは飛ばし、前のファイルに含める。分けた後、build.py で元と1文字も違わないか確かめる。"""
import sys, os, json
SRC, OUT = sys.argv[1], sys.argv[2]
L = open(SRC, encoding='utf-8').read().split('\n')
# (ファイル名, その行の頭に来る文字)  上から順に探す
CUTS = [
 ('00_head.html',            None),
 ('01_style.css',            '<style>'),          # この行の次から
 ('02_body.html',            '</style>'),
 ('js/00_version_links.js',  '// ===== 版とリンク'),
 ('js/01_en_dict.js',        '// ===== 英語版'),
 ('js/01_i18n_engine.js',    'const I18N=(()=>{'),
 ('js/02_chapters.js',       '/* ====='),
 ('js/03_char_art.js',       '/* ---------- キャラの立ち絵'),
 ('js/04_char_real.js',      '/* ---------- キャラ絵リアル化'),
 ('js/05_tells.js',          '/* ---------- テル（クセ）'),
 ('js/06_regulars.js',       '// ===== 顔なじみ帳'),
 ('js/07_talk_banter.js',    '/* ---------- 対戦中のおしゃべり'),
 ('js/08_titles_manners.js', '/* ---------- あるある称号'),
 ('js/09_live_extra.js',     '/* ---------- 追加のライブ要素'),
 ('js/10_scripted.js',       '/* ---------- 章の決まった場面'),
 ('js/11_modes.js',          '// ===== 案3：章ごとの3つ星課題'),
 ('js/12_story_bits.js',     '/* ---------- ストーリー系の要素'),
 ('js/13_beginner.js',       '/* ---------- 初めての人向け'),
 ('js/14_daily.js',          '/* ---------- 今日の1ハンド'),
 ('js/15_cpu_style.js',      '/* ---------- CPUの性格'),
 ('js/16_save_ads.js',       '/* ---------- 進行の保存'),
 ('js/17_screens.js',        '/* ---------- 画面切り替え'),
 ('js/18_scene.js',          '/* ---------- 会話シーン'),
 ('js/19_deck_eval.js',      '/* ---------- 山札・役判定'),
 ('js/20_state.js',          '/* ---------- 状態'),
 ('js/21_dealer_fx.js',      '/* ---------- ディーラーの声'),
 ('js/22_sound.js',          '/* ---------- 音（WebAudio'),
 ('js/23_house_rules.js',    '/* ---------- 店ごとのハウスルール'),
 ('js/24_dokidoki_camera.js','/* ---------- ドキドキ演出'),
 ('js/25_cpu.js',            '/* ---------- CPU：勝率を見積もり'),
 ('js/26_mentor_line.js',    '/* ---------- 師匠のひとこと'),
 ('js/27_render.js',         '/* ---------- 描画'),
 ('js/28_controls.js',       '/* ---------- 操作'),
 ('js/29_part2.js',          '// ===== 第二部「師匠」'),
 ('js/30_others.js',         '// ===== その他（B-1'),
 ('99_tail.html',            '</script>'),
]
starts, pos = [], 0
for name, mark in CUTS:
    if mark is None: starts.append((name, 0)); continue
    for i in range(pos, len(L)):
        if L[i].startswith(mark):
            s = i + 1 if mark == '<style>' else i
            if mark == '</script>' and i < len(L) - 10: continue  # 最後の方の </script> だけ
            starts.append((name, s)); pos = i + 1; break
    else:
        print('見出しが見つからない（前のファイルに含める）:', name, file=sys.stderr)
order = []
for k, (name, s) in enumerate(starts):
    e = starts[k + 1][1] if k + 1 < len(starts) else len(L)
    p = os.path.join(OUT, name); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8').write('\n'.join(L[s:e]))
    order.append(name)
json.dump(order, open(os.path.join(OUT, 'order.json'), 'w'), ensure_ascii=False, indent=1)
print(len(order), 'files')
