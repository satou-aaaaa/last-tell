import os,sys
os.chdir(os.path.dirname(os.path.abspath(__file__))+'/..')
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC).read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a);assert n==cnt,(a[:90],n);s=s.replace(a,b)
# 選択肢のボタンの文字は、語の途中（「よ／い」など）で折り返さない
rep(".qopts button{min-height:48px}",".qopts button{min-height:48px;word-break:keep-all;overflow-wrap:anywhere;line-break:strict;text-wrap:balance}")
open(OUT,'w').write(s);print('ok')
