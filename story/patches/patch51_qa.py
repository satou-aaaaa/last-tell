import sys
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC,encoding='utf8').read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a);assert n==cnt,(a[:60],n);s=s.replace(a,b)
# QA v60 #2: 顔なじみ帳も引き継ぎ・ファイル保存・セーブ削除の対象に
rep("'shisho-part2','shisho-banter']","'shisho-part2','shisho-banter','shisho-mob']")
# QA v60 #11: 「完」は封筒の話のあと、エンドロールの直前に
rep("""   ['','LAST TELL　―完―'],
   ['',"翌朝。""","""   ['',"翌朝。""")
rep("""   ['',"ジンはそれ以上何も言わず、封筒をこちらの手に置いた。"]]),""","""   ['',"ジンはそれ以上何も言わず、封筒をこちらの手に置いた。"],
   ['','LAST TELL　―完―']]),""")
open(OUT,'w',encoding='utf8').write(s);print('ok')
