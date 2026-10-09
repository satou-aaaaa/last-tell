#!/usr/bin/env python3
"""shisho.html から公開用の index.html を作る。

使い方: python3 tools/build_index.py /mnt/project-files/story/shisho.html
- v56 からゲーム本体に doctype・viewport・manifest・アイコン・SW登録が入ったので、そのままコピーする。
- PWA の行が無い古い shisho.html は受け付けない（頭を二重に足さないため）。
- 公開のたびに sw.js の VERSION を書き換えて、古い保存版を入れ替えさせる。
"""
import re, sys, datetime, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
src = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')

if 'rel="manifest"' not in src or "register('sw.js')" not in src:
    sys.exit('shisho.html に manifest か SW 登録がありません。v56 以降のファイルを使ってください。')
(root / 'index.html').write_text(src, encoding='utf-8')

sw = root / 'sw.js'
stamp = datetime.datetime.now(datetime.timezone.utc).strftime('lt-%Y%m%d%H%M%S')
sw.write_text(re.sub(r"const VERSION = '[^']*';", f"const VERSION = '{stamp}';", sw.read_text(encoding='utf-8')), encoding='utf-8')
print('index.html written,', len(src), 'chars; sw VERSION =', stamp)
