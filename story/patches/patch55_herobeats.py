import sys
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC,encoding='utf-8').read()
def rep(a,b,cnt=1):
    global s
    assert s.count(a)==cnt,(a[:60],s.count(a));s=s.replace(a,b)
# 主人公の第1章の行：S1 で intro の後ろ半分がハンドの合間（beats）へ移ったので、intro と beats の両方から探す
rep("  const c1=C(1);\n  {const i=at(c1.intro,'仕事帰りに覚えたポーカー');if(i>=0)c1.intro.splice(i,1,",
    "  const c1=C(1),c1A=[c1.intro,...(c1.beats||[]).map(b=>b.lines)],insA=(t,ls,after)=>c1A.some(a=>ins(a,t,ls,after));\n  for(const a of c1A){const i=at(a,'仕事帰りに覚えたポーカー');if(i>=0){a.splice(i,1,")
rep("    ['','……なのに、仕事帰りに覚えたポーカーでは、今日もまるで勝てずにいる。'])}",
    "    ['','……なのに、仕事帰りに覚えたポーカーでは、今日もまるで勝てずにいる。']);break}}")
rep("  ins(c1.intro,'こちらの手札をのぞきこんだ',","  insA('こちらの手札をのぞきこんだ',")
rep("  ins(c1.intro,'ジンでいい。',","  insA('ジンでいい。',")
open(OUT,'w',encoding='utf-8').write(s)
print('ok')
