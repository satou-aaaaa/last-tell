#!/usr/bin/env python3
"""shisho.html から公開用の index.html を作る。

使い方: python3 tools/build_index.py /mnt/project-files/story/shisho.html
- v56 からゲーム本体に doctype・viewport・manifest・アイコン・SW登録が入ったので、そのままコピーする。
- PWA の行が無い古い shisho.html は受け付けない（頭を二重に足さないため）。
- 公開のたびに sw.js の VERSION を書き換えて、古い保存版を入れ替えさせる。
- アクセス計測（GoatCounter）のタグを <title> のすぐ後ろに足す（shisho.html には </head> が無い）（ゲーム本体は変えない。公開サイトのときだけ数える）。
- 共有フォルダの qa/（変更後の検査）があれば、リポジトリの qa/ にも写す。GitHub の自動実行（.github/workflows/qa.yml）がそれを回す。
"""
import re, sys, datetime, pathlib, shutil

root = pathlib.Path(__file__).resolve().parent.parent
src = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')

if 'rel="manifest"' not in src or "register('sw.js')" not in src:
    sys.exit('shisho.html に manifest か SW 登録がありません。v56 以降のファイルを使ってください。')

# アクセス計測（GoatCounter）。Cookie は使わない。数えるのは公開サイト（satou-aaaaa.github.io）で開いたときだけで、
# 手元・CI の検査（localhost）や自動操作のブラウザ（navigator.webdriver）では読み込まない。
# ?utm_source=youtube などの付いたURLから来た人は、GoatCounter の画面で「どこから来たか」に分けて出る。
# 数字は https://last-tell.goatcounter.com で見る。サイトコードを変えたら COUNTER_CODE も変える。
COUNTER_CODE = 'last-tell'
COUNTER_MARK = '<!-- access-counter -->'
COUNTER_TAG = COUNTER_MARK + '''<script>
(function () {
  if (location.hostname !== 'satou-aaaaa.github.io' || navigator.webdriver) return;
  window.goatcounter = { path: function (p) { return p.split('?')[0]; } };
  var gc = document.createElement('script');
  gc.async = true; gc.src = 'https://gc.zgo.at/count.js';
  gc.setAttribute('data-goatcounter', 'https://''' + COUNTER_CODE + '''.goatcounter.com/count');
  document.head.appendChild(gc);
})();
</script>
'''
if COUNTER_MARK not in src:
    if '</title>' not in src:
        sys.exit('shisho.html に </title> がありません。')
    src = src.replace('</title>', '</title>\n' + COUNTER_TAG.rstrip('\n'), 1)
(root / 'index.html').write_text(src, encoding='utf-8')

sw = root / 'sw.js'
stamp = datetime.datetime.now(datetime.timezone.utc).strftime('lt-%Y%m%d%H%M%S')
sw.write_text(re.sub(r"const VERSION = '[^']*';", f"const VERSION = '{stamp}';", sw.read_text(encoding='utf-8')), encoding='utf-8')
print('index.html written,', len(src), 'chars; sw VERSION =', stamp)

qa_src = pathlib.Path(sys.argv[1]).resolve().parent.parent / 'qa'
if qa_src.is_dir():
    # 写す前に、リポジトリ（main）の方が新しい qa/ のファイルが無いか見る。共有フォルダの古い写しで上書きすると、
    # 別の PR で main に入った検査の直しが消える（2026-10-20：#108 の harness.js・site.js・ci_shots.js が共有フォルダに無かった）
    import subprocess
    def git(*a):
        return subprocess.run(['git', '-C', str(root), *a], capture_output=True, text=True).stdout
    newer = []
    for f in git('ls-files', 'qa').split():
        s = qa_src / f[3:]
        if not s.is_file():
            continue
        main = subprocess.run(['git', '-C', str(root), 'show', f'origin/main:{f}'], capture_output=True).stdout
        if not main or main == s.read_bytes():
            continue
        t = git('log', '-1', '--format=%ct', 'origin/main', '--', f).strip()
        if t and int(t) > s.stat().st_mtime:
            newer.append(f)
    if newer:
        sys.exit('main の方が新しい qa/ のファイルがあります。共有フォルダへ戻してから（git show origin/main:<ファイル> > 共有フォルダ）もう一度：\n  ' + '\n  '.join(newer))
    shutil.copytree(qa_src, root / 'qa', dirs_exist_ok=True, ignore=shutil.ignore_patterns('reports', 'node_modules', 'qa-summary', 'qa-report*', 'groups'))
    print('qa/ copied from', qa_src)
