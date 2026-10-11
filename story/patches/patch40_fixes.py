import sys
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC,encoding='utf8').read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a);assert n==cnt,(a[:60],n);s=s.replace(a,b)
# (2) 章の最初のクイズが render より先に出ても、勝利条件が空にならないように
rep("  $('goal').dataset.k='';\n  show('game');","  $('goal').dataset.k='';try{renderGoal()}catch(e){}\n  show('game');")
rep("  const s0=S,qz=QUIZ[id],box=$('quiz');","  const s0=S,qz=QUIZ[id],box=$('quiz');try{renderGoal()}catch(e){}")
# (1) 初回ツアーがハンドの終わりまで残って「次のハンドへ」に重ならないように。終わっていなければ次の自分の番でまた出る
rep("setInterval(()=>{fitTable();fitMyHand()},300);",
"""addEventListener('scroll',()=>{if(tourI>=0)tourGuard()},{passive:true});
function tourGuard(){if(tourI<0)return;if($('game').hidden||(S&&(S.handOver||S.toAct!==0))){tourI=-1;$('tour').hidden=true;document.querySelectorAll('.tourhl').forEach(e=>e.classList.remove('tourhl'));return}
  const st=TOUR[tourI],el=st&&document.querySelector(st[0]);if(el&&typeof placeTour==='function')placeTour(el)}
setInterval(()=>{fitTable();fitMyHand();tourGuard()},300);""")
# (3)(4) 折り返し
rep("</style>","#btnShot{white-space:nowrap;letter-spacing:0}@media(max-height:500px){#btnShot{font-size:.8rem;padding-left:.5em;padding-right:.5em}}\n#quiz .qopts button{white-space:nowrap;letter-spacing:0;font-size:clamp(.78rem,3.8vw,1rem)}\n</style>")
# (5) ツアーの箱を、光らせている場所や操作ボタンにかぶらない側へ置く（スマホ横で「フォールド」を覆っていた）
rep("  $('tourSkip').onclick=endTour;$('tourNext').onclick=()=>{tourI++;renderTour()};\n}",
"  $('tourSkip').onclick=endTour;$('tourNext').onclick=()=>{tourI++;renderTour()};\n  placeTour(el);setTimeout(()=>{if(tourI>=0)placeTour(el)},450);\n}\n"
"function placeTour(el){const t=$('tour');if(!t||t.hidden)return;const land=innerWidth>innerHeight&&innerHeight<=500,box=t.querySelector('.tbox');\n"
"  const ctl=$('controls'),cr=ctl&&ctl.getClientRects().length?ctl.getBoundingClientRect():null,er=el.getBoundingClientRect();\n"
"  box.style.width=land?'min(100%,360px)':'';t.style.justifyItems=land?((el.id==='controls'||er.left+er.width/2>innerWidth*.55)?'start':'end'):'';\n"
"  const hit=()=>{const b=box.getBoundingClientRect();return!(b.right<er.left||b.left>er.right||b.bottom<er.top||b.top>er.bottom)};\n"
"  // まず操作ボタンのすぐ上に置き、光らせている所にかぶるなら画面の上に置く\n"
"  t.style.top='auto';t.style.bottom=(cr&&cr.top>innerHeight*.4?Math.max(12,innerHeight-cr.top+6):12)+'px';\n"
"  if(el.id==='controls'||hit()||box.getBoundingClientRect().top<0){t.style.bottom='auto';t.style.top='8px'}}\n"
"addEventListener('resize',()=>{if(tourI>=0){const st=TOUR[tourI],el=st&&document.querySelector(st[0]);if(el)placeTour(el)}});")
open(OUT,'w',encoding='utf8').write(s);print('ok')
