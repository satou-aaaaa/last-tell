import sys
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC,encoding='utf8').read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a);assert n==cnt,(a[:60],n);s=s.replace(a,b)
# 低い画面（スマホ横など）で、場面の「次へ」が画面の下にはみ出すときは、人物の欄を縮めて収める
rep("setInterval(()=>{fitTable();fitMyHand();tourGuard()},300);",
"""function fitScene(){const sc=$('scene'),st=$('stage'),adv=$('btnAdv');if(!sc||sc.hidden||!st||!adv)return;
  st.style.height='';const top=sc.getBoundingClientRect().top+scrollY,need=adv.getBoundingClientRect().bottom+scrollY-top+8,room=innerHeight-Math.max(0,top-scrollY);
  if(need>room){const h=st.getBoundingClientRect().height;st.style.height=Math.max(0,Math.round(h-(need-room)))+'px'}}
setInterval(()=>{fitTable();fitMyHand();tourGuard();fitScene()},300);addEventListener('resize',fitScene);""")
rep("function advance(){if(!SC)return;","function advance(){setTimeout(fitScene,0);if(!SC)return;")
rep("</style>","@media (max-height:500px) and (orientation:landscape){#scene .lesson p{line-height:1.6;font-size:.9rem;max-width:none}#scene .lesson .lt{font-size:1.1rem}}\n</style>")
open(OUT,'w',encoding='utf8').write(s);print('ok')
