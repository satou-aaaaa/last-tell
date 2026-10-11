#!/usr/bin/env python3
"""今までの形のパッチ（python3 patchNN.py 入力.html 出力.html）を、src/ にそのまま当てる。
   python3 apply_patch.py SRCDIR patchNN.py [パッチへ渡す追加の引数...]
中身：src/ を1枚に組み立てる → パッチを当てる → 見出しで src/ に分け直す → 組み立て直して、パッチの出力と1文字も違わないか確かめる。
違ったら src/ は元のまま残す（見出しコメントをパッチが消した・変えたときなど）。"""
import sys, os, subprocess, tempfile, shutil
T = os.path.dirname(os.path.abspath(__file__))
src, patch, extra = sys.argv[1], sys.argv[2], sys.argv[3:]
tmp = tempfile.mkdtemp()
a, b, s2 = os.path.join(tmp, 'a.html'), os.path.join(tmp, 'b.html'), os.path.join(tmp, 'src')
run = lambda *c: subprocess.run(c, check=True)
run(sys.executable, os.path.join(T, 'build.py'), src, a)
run(sys.executable, os.path.abspath(patch), a, b, *extra)
run(sys.executable, os.path.join(T, 'split.py'), b, s2)
r = subprocess.run([sys.executable, os.path.join(T, 'build.py'), s2, os.path.join(tmp, 'c.html'), b])
if r.returncode: sys.exit('分け直しが合わないので src/ は変えていません: ' + tmp)
shutil.rmtree(src); shutil.copytree(s2, src); shutil.rmtree(tmp)
print('src/ に当てました:', os.path.basename(patch))
