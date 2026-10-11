import sys
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC,encoding='utf-8').read()
def rep(a,b,cnt=1):
    global s
    assert s.count(a)==cnt,(a[:60],s.count(a));s=s.replace(a,b)
# 改善提案 §2：スマホ縦の6人卓で、端の席の手札が卓の外に切れる・「勝ち +…」が名札からはみ出す・自分の「フォールド」が2行になる
# 端の席の手札：スマホ縦（幅560px未満）の6人以上の卓だけ、席の手札を卓の内側へ15%寄せる。PC・横画面は今のまま
rep("    sp.style.left=feltX(x)+'%';sp.style.top='13%';",
    "    sp.style.left=feltX(N()>=6&&innerWidth<560&&innerWidth<innerHeight?50+(x-50)*.85:x)+'%';sp.style.top='13%';")
# 名札の中の札（勝ち・行動）は名札の幅におさめる。入らないときは文字を小さくする
rep("function fitMyHand(){",
    "function fitTags(){if($('game').hidden)return;document.querySelectorAll('#plates .plate .tag, #mine .me-l .tag').forEach(t=>{const box=t.parentElement,os=[...box.children].filter(c=>c!==t&&c.offsetWidth),w=box.id==='plates'||!os.length?box.clientWidth:Math.max(56,...os.map(c=>c.scrollWidth))+10;if(!w)return;\n"
    "  if(t.dataset.fz&&t.dataset.tx===t.textContent&&t.dataset.w==w)return;t.style.fontSize='';t.dataset.tx=t.textContent;t.dataset.w=w;\n"
    "  let f=parseFloat(getComputedStyle(t).fontSize),n=0;t.style.maxWidth=w+'px';while(t.scrollWidth>t.clientWidth+1&&f>8&&n++<12){f-=.5;t.style.fontSize=f+'px'}t.dataset.fz='1'})}\n"
    "setInterval(fitTags,200);\n"
    "function fitMyHand(){")
rep("</style>","#plates .plate .tag,#mine .me-l .tag{white-space:nowrap;overflow:hidden;text-overflow:clip;box-sizing:border-box}\n@media (max-width:560px){.n6 #plates .plate .tag{padding:1px 4px}.n6 #plates .plate .tag.win{white-space:normal;line-height:1.15;text-align:center}#mine .me-l .tag{padding:1px 5px}}\n</style>")
open(OUT,'w',encoding='utf-8').write(s)
print('ok')
