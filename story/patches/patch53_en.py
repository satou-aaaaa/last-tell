import sys
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC,encoding='utf-8').read()
def rep(a,b,cnt=1):
    global s
    assert s.count(a)==cnt,(a[:60],s.count(a));s=s.replace(a,b)
# 3回負けたときのジンのセリフ（英語で半分日本語が残っていた）
rep('const EN_TPL=[','const EN_TPL=[["3回目か。顔に出てるぞ。……{0}", "Third time, huh? It\'s on your face. ...{0}"],["{0}＆{1}＆{2}", "{0}, {1} & {2}"],["{0}＆{1}", "{0} & {1}"],')
# 2回めくりの結果：勝った人を「と」でつなぐと英語で「あなたと」が残る
rep(".map(p=>p.name).join('と')||'なし';",".map(p=>p.name).join('＆')||'なし';")
open(OUT,'w',encoding='utf-8').write(s)
print('ok')
