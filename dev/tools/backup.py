#!/usr/bin/env python3
"""ソースと資料の控えを1つの zip にする（開発と設計のベストプラクティス 案15）。
   python3 backup.py [出す場所]   -> 出す場所/LAST_TELL_控え_YYYYMMDD.zip（既定 /mnt/project-files/backup/）。新しい4つだけ残す
   入れるもの：src、dev（tools と文書、snapshots）、research・qa・release・launch・prerelease 等の文章とコード、README
   入れないもの：動画・画像・qa の結果・node_modules・story の古い版（src と snapshots から組み立て直せる）"""
import sys, os, zipfile, datetime, glob
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'backup')
DIRS = ['src', 'dev', 'research', 'qa', 'release', 'launch', 'prerelease', 'mobile', 'monetization', 'art', 'story/patches']
EXT = {'.js', '.md', '.json', '.css', '.html', '.py', '.sh', '.mjs', '.gz', '.txt'}
SKIP = ('node_modules', os.sep + 'reports' + os.sep, os.sep + '_runs' + os.sep)
os.makedirs(OUT, exist_ok=True)
name = os.path.join(OUT, 'LAST_TELL_控え_%s.zip' % datetime.date.today().strftime('%Y%m%d'))
n = 0
with zipfile.ZipFile(name + '.tmp', 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for f in ['README.md']: z.write(os.path.join(ROOT, f), f); n += 1
    for d in DIRS:
        for r, ds, fs in os.walk(os.path.join(ROOT, d)):
            if any(s in r + os.sep for s in SKIP): continue
            for f in fs:
                p = os.path.join(r, f)
                if os.path.splitext(f)[1].lower() in EXT: z.write(p, os.path.relpath(p, ROOT)); n += 1
os.replace(name + '.tmp', name)
for old in sorted(glob.glob(os.path.join(OUT, 'LAST_TELL_控え_*.zip')))[:-4]: os.remove(old)
print(name, n, 'files', os.path.getsize(name) // 1024, 'KB')
