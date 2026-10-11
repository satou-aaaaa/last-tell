import sys
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC,encoding='utf8').read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a);assert n==cnt,(a[:60],n);s=s.replace(a,b)
rep("""    for(const p of pls)if(r.left<p.right&&p.left<r.right&&r.bottom>p.top+2&&r.top<p.bottom){c.style.translate=`0 ${(p.top-2-r.bottom).toFixed(1)}px`;break}})}""",
"""    let dx=0,dy=0;if(r.left<tr.left+2)dx=tr.left+2-r.left;else if(r.right>tr.right-2)dx=tr.right-2-r.right;
    for(const p of pls)if(r.left+dx<p.right&&p.left<r.right+dx&&r.bottom>p.top+2&&r.top<p.bottom){dy=p.top-2-r.bottom;break}
    if(dx||dy)c.style.translate=`${dx.toFixed(1)}px ${dy.toFixed(1)}px`})}""")
open(OUT,'w',encoding='utf8').write(s);print('ok')
