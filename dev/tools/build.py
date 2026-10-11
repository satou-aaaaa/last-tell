#!/usr/bin/env python3
"""src/ のファイルを order.json の順につないで、1枚の shisho.html を作る。
   python3 build.py SRCDIR OUT.html [比べる元.html] [--strict] [--no-check]
   組み立てたあと lint/check.js で確かめる（開発と設計のベストプラクティス 案2）。
   文法の間違いがあれば OUT.html を書き換えずに止まる。--strict は書き方の error でも止まる。"""
import sys, os, json, hashlib, subprocess, shutil
flags = {a for a in sys.argv[1:] if a.startswith('--')}
args = [a for a in sys.argv[1:] if not a.startswith('--')]
SRC, OUT = args[0], args[1]
order = json.load(open(os.path.join(SRC, 'order.json')))
s = '\n'.join(open(os.path.join(SRC, n), encoding='utf-8').read() for n in order)
tmp = OUT + '.building'
open(tmp, 'w', encoding='utf-8').write(s)
if '--no-check' not in flags and shutil.which('node'):
    chk = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'lint', 'check.js')
    r = subprocess.run(['node', chk, tmp] + (['--strict'] if '--strict' in flags else []))
    if r.returncode != 0:
        os.remove(tmp); sys.exit('止めました：' + OUT + ' は書き換えていません')
os.replace(tmp, OUT)
print(OUT, len(s.encode()), 'bytes', hashlib.sha256(s.encode()).hexdigest()[:12])
if len(args) > 2:
    ref = open(args[2], encoding='utf-8').read()
    print('元と同じ' if ref == s else '元と違う！'); sys.exit(0 if ref == s else 1)
