#!/usr/bin/env python3
"""renames.json の改名を src/ に当てる（案3）。本線だけが使う（order.json を変えるため）。
   python3 rename.py [SRCDIR]       -> ファイル名と order.json を変え、組み立てが1文字も変わらないことを確かめる
   中身は変えない。確かめに失敗したら元に戻す。"""
import sys, os, json, subprocess, tempfile
here = os.path.dirname(os.path.abspath(__file__))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, '..', '..', 'src')
REN = {k: v for k, v in json.load(open(os.path.join(here, 'renames.json'), encoding='utf-8')).items() if not k.startswith('_')}
def build(out): subprocess.run([sys.executable, os.path.join(here, 'build.py'), SRC, out, '--no-check'], check=True, capture_output=True)
t = tempfile.mkdtemp(); before, after = os.path.join(t, 'a.html'), os.path.join(t, 'b.html')
build(before)
op = os.path.join(SRC, 'order.json'); order_txt = open(op, encoding='utf-8').read(); order = json.loads(order_txt)
done = []
for old, new in REN.items():
    po, pn = os.path.join(SRC, old), os.path.join(SRC, new)
    if not os.path.exists(po): print('とばす（もう無い）:', old); continue
    if os.path.exists(pn): sys.exit('止めました：新しい名前がもうある ' + new)
    os.rename(po, pn); done.append((po, pn)); order = [new if x == old else x for x in order]
    print(old, '->', new)
json.dump(order, open(op, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
build(after)
if open(before, encoding='utf-8').read() != open(after, encoding='utf-8').read():
    for po, pn in reversed(done): os.rename(pn, po)
    open(op, 'w', encoding='utf-8').write(order_txt); sys.exit('組み立てが変わったので元に戻しました')
print('組み立ては1文字も変わっていません（%d件）' % len(done))
