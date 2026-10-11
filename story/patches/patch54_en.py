import sys
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC,encoding='utf-8').read()
def rep(a,b,cnt=1):
    global s
    assert s.count(a)==cnt,(a[:60],s.count(a));s=s.replace(a,b)
# 掛け合い：ハンナのメモの英語（patch47 の最後の手直し分）
rep('const EN_DICT={','const EN_DICT={"（メモ）楽しむ派、一人追加": "(note) One more for team fun.",')
open(OUT,'w',encoding='utf-8').write(s)
print('ok')
