import os,re,sys
os.chdir(os.path.dirname(os.path.abspath(__file__))+'/..')
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC).read()
# satou 2026-10-09：「あの夜」ではなく「あの日」に。英語も that night → that day（「その夜」などほかの言い方は変えない）
def en(v):
    for a,b in [('that very night','that very day'),("That night's","That day's"),("that night's","that day's"),('That night','That day'),('that night','that day')]:v=v.replace(a,b)
    return v
n0=s.count('あの夜')
s=re.sub(r'("[^"\n]*あの夜[^"\n]*"\s*[:,]\s*")([^"\n]*)(")',lambda m:m.group(1)+en(m.group(2))+m.group(3),s)
s=s.replace('あの夜','あの日')
assert 'あの夜' not in s and n0>0
open(OUT,'w').write(s);print('ok',n0)
