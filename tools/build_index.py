#!/usr/bin/env python3
"""shisho.html から公開用の index.html を作る（PWA 用の頭とService Worker 登録を足す）。

使い方: python3 tools/build_index.py /mnt/project-files/story/shisho.html
- ゲーム本体（shisho.html）にすでに PWA の行が入っていれば、頭は足さずにそのままコピーする。
- 公開のたびに sw.js の VERSION を書き換えて、古い保存版を入れ替えさせる。
"""
import re, sys, datetime, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
src = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')

HEAD = '''<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="伝説の師匠に弟子入りして、相手のクセ（テル）を読む1人用のテキサスホールデム。チップはお金と交換しません。">
<meta name="theme-color" content="#0d0e13">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="apple-mobile-web-app-title" content="LAST TELL">
<!-- 一時的な修正：横向きで「勝負開始」が画面の外に出る問題。shisho.html 側で直ったら消す -->
<style id="pwa-tmpfix">.vs{overflow-y:auto;place-items:safe center}</style>
<!-- /pwa-head -->
'''
REG = '''
<!-- pwa-register -->
<script>
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
</script>
'''

if 'rel="manifest"' in src:
    out = src
else:
    out = HEAD + src.lstrip() + REG
(root / 'index.html').write_text(out, encoding='utf-8')

sw = root / 'sw.js'
stamp = datetime.datetime.now(datetime.timezone.utc).strftime('lt-%Y%m%d%H%M%S')
sw.write_text(re.sub(r"const VERSION = '[^']*';", f"const VERSION = '{stamp}';", sw.read_text(encoding='utf-8')), encoding='utf-8')
print('index.html written,', len(out), 'bytes; sw VERSION =', stamp)
