#!/usr/bin/env python3
"""レーンの作業場所の作成と書き戻し（上書き事故を防ぐ）。
   python3 lane.py checkout 作業場所              -> src/ を 作業場所/src に写し、元の状態を 作業場所/.base に残す
   python3 lane.py writeback 作業場所 FILE...      -> 指定したファイルだけ src/ に戻す（例 js/02_chapters.js）
   python3 lane.py status 作業場所                 -> 自分が変えたファイル／その間に src/ で変わったファイルを表示
書き戻しのとき、src/ のファイルが checkout 後に変わっていたら、丸ごと上書きせず
3方向マージ（git merge-file）で自分の変更だけを今の src/ に当てる。ぶつかったら何も書かずに止まる。
書き戻した後は .base も新しくなるので、続けて作業してまた writeback できる。"""
import sys, os, shutil, subprocess, filecmp, tempfile, json
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'src')
# 改名の対応表（案3）。作業場所が古い名前のままでも、src/ の新しい名前のファイルに書き戻す
_rp = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'renames.json')
REN = {k: v for k, v in (json.load(open(_rp, encoding='utf-8')) if os.path.exists(_rp) else {}).items() if not k.startswith('_')}
def sp(f): return os.path.join(SRC, REN.get(f, f))
cmd, ws = sys.argv[1], os.path.abspath(sys.argv[2])
mine, base = os.path.join(ws, 'src'), os.path.join(ws, '.base')
def rd(p): return open(p, encoding='utf-8').read() if os.path.exists(p) else None
def files(d):
    out = []
    for r, _, fs in os.walk(d):
        out += [os.path.relpath(os.path.join(r, f), d) for f in fs]
    return sorted(out)
if cmd == 'checkout':
    if os.path.exists(mine): sys.exit('もう作業場所があります: ' + mine)
    shutil.copytree(SRC, mine); shutil.copytree(SRC, base); print('checkout:', mine); sys.exit()
if cmd == 'status':
    for f in sorted(set(files(mine)) | set(files(base)) | (set(files(SRC)) - set(REN.values()))):
        b, m, s = rd(os.path.join(base, f)), rd(os.path.join(mine, f)), rd(sp(f))
        tag = ('自分' if m != b else '') + (' src側' if s != b else '')
        if tag: print(f'{f}: {tag.strip()}')
    sys.exit()
if cmd != 'writeback': sys.exit(__doc__)
bad = []
plan = []
for f in sys.argv[3:]:
    b, m, s = rd(os.path.join(base, f)), rd(os.path.join(mine, f)), rd(sp(f))
    if m is None: bad.append(f + '：作業場所にない'); continue
    if s == b or s is None and b is None: plan.append((f, m, '上書き')); continue
    if m == b: plan.append((f, s, '変更なし')); continue
    with tempfile.TemporaryDirectory() as t:
        pm, pb, ps = (os.path.join(t, x) for x in 'mbs')
        open(pm, 'w', encoding='utf-8').write(m); open(pb, 'w', encoding='utf-8').write(b or ''); open(ps, 'w', encoding='utf-8').write(s or '')
        r = subprocess.run(['git', 'merge-file', '-p', '-L', 'mine', '-L', 'base', '-L', 'src', pm, pb, ps], capture_output=True, text=True)
        if r.returncode != 0: bad.append(f'{f}：src/ 側の変更とぶつかった（{r.returncode}か所）'); continue
        plan.append((f, r.stdout, 'マージ'))
if bad: sys.exit('書き戻しを止めました（何も書いていません）:\n  ' + '\n  '.join(bad) + '\n今の src/ を読んで、自分の変更を当て直してください。')
for f, text, how in plan:
    for p in (sp(f), os.path.join(mine, f), os.path.join(base, f)):
        os.makedirs(os.path.dirname(p), exist_ok=True); open(p, 'w', encoding='utf-8').write(text)
    print(f'{f}: {how}' + (f'（src/ では {REN[f]}）' if f in REN else ''))
