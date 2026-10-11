import os,json,sys
os.chdir(os.path.dirname(os.path.abspath(__file__))+'/..')
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC).read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a);assert n==cnt,(a[:90],n);s=s.replace(a,b)
# 右下のボタンの列（揺さぶる・ストラドル・答えの選択肢）が自分のチップの数字に重なるときは、列ごとチップの上へ上げる
rep("function talkPlace(){const row=$('askRow'),b=$('btnNeedle');row.style.translate='';b.style.translate='';",
    "function talkPlace(){const row=$('askRow'),b=$('btnNeedle');row.style.translate='';b.style.translate='';\n"
    "  const nr=b.parentElement,mr=$('mine').querySelector('.me-r');nr.style.translate='';\n"
    "  const sd=$('btnStraddle');if(sd)sd.style.display=row.hidden?'':'none';\n"
    "  if(mr&&mr.offsetParent){const vis=[...nr.children].filter(x=>!x.hidden&&x.offsetParent);if(vis.length){const m=mr.getBoundingClientRect();let top=Infinity,bot=-Infinity,l=Infinity,rr=-Infinity;vis.forEach(x=>{const q=x.getBoundingClientRect();top=Math.min(top,q.top);bot=Math.max(bot,q.bottom);l=Math.min(l,q.left);rr=Math.max(rr,q.right)});\n"
    "    let dy=0;if(rr>m.left&&l<m.right&&bot>m.top-4)dy=bot-m.top+6;\n"
    "    const ps=$('potSign');if(dy&&ps&&!ps.hidden&&ps.offsetParent){const q=ps.getBoundingClientRect();if(q.right>l&&q.left<rr&&bot-dy>q.top-4&&top-dy<q.bottom+4)dy=bot-q.top+6}\n"
    "    if(dy>0)nr.style.translate=`0 ${(-dy).toFixed(1)}px`}}")
open(OUT,'w').write(s);print('ok')
