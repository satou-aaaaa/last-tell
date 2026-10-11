#!/usr/bin/env python3
"""src/ の控えを取る・前の控えとの違いを出す（リポジトリを使わない代わり）。
   python3 snapshot.py save SRCDIR vNN        -> dev/snapshots/vNN.tar.gz
   python3 snapshot.py diff SRCDIR vNN        -> vNN の控えと今の src/ の違い（ファイルごとの行数）
   python3 snapshot.py diff SRCDIR vNN FILE   -> そのファイルの差分（unified diff）"""
import sys, os, tarfile, difflib, io
HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'snapshots')
cmd, src, ver = sys.argv[1:4]
p = os.path.join(HERE, ver + '.tar.gz')
if cmd == 'save':
    os.makedirs(HERE, exist_ok=True)
    with tarfile.open(p, 'w:gz') as t: t.add(src, arcname='src')
    print(p, os.path.getsize(p), 'bytes'); sys.exit()
old = {}
with tarfile.open(p) as t:
    for m in t.getmembers():
        if m.isfile(): old[m.name[4:]] = t.extractfile(m).read().decode('utf-8')
new = {}
for root, _, fs in os.walk(src):
    for f in fs:
        q = os.path.join(root, f); new[os.path.relpath(q, src)] = open(q, encoding='utf-8').read()
only = sys.argv[4] if len(sys.argv) > 4 else None
for name in sorted(set(old) | set(new)):
    if only and name != only: continue
    a, b = old.get(name, '').split('\n'), new.get(name, '').split('\n')
    if a == b: continue
    d = list(difflib.unified_diff(a, b, ver + '/' + name, 'now/' + name, lineterm=''))
    if only: print('\n'.join(d))
    else: print(f"{name}: +{sum(1 for l in d if l[:1]=='+' and l[:3]!='+++')} -{sum(1 for l in d if l[:1]=='-' and l[:3]!='---')}")
