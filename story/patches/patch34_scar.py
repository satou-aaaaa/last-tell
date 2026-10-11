import os,sys
os.chdir(os.path.dirname(os.path.abspath(__file__))+'/..')
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC).read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a);assert n==cnt,(a[:90],n);s=s.replace(a,b)
# キャラ絵リアル化 §3：ジンの手は「軽く握った指の背で傷をなでる」。地の文もそれに合わせる（英語も）
for a,b,ea,eb in [
 ('老人は顎の古い傷を指でなぞりながら、こちらの手札をのぞきこんだ。','老人は軽く握った指の背で顎の古い傷をなでながら、こちらの手札をのぞきこんだ。','"Tracing an old scar on his chin, the old man peers at your cards."','"Rubbing an old scar on his chin with the back of a curled finger, the old man peers at your cards."'),
 ('そう答えるジンの指は、顎の傷をなぞっていた。','そう答えるジンの指の背は、顎の傷をなでていた。',"\"As he answers, Jin's finger traces the scar on his chin.\"","\"As he answers, Jin rubs the scar on his chin with the back of his finger.\""),
 ('ジンの指が、顎の傷をなぞった。','ジンの指の背が、顎の傷をなでた。',"\"Jin's finger traces the scar on his chin.\"","\"Jin rubs the scar on his chin with the back of his finger.\"")]:
    rep('"'+a+'": '+ea,'"'+b+'": '+eb)
    assert s.count(a)>=1,a;s=s.replace(a,b)
s=s.replace('ジン：ふだんは顎の傷を人差し指でなぞる。','ジン：ふだんは軽く握った指の背で顎の傷をなでる。')
open(OUT,'w').write(s);print('ok')
