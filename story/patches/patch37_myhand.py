import sys
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC,encoding='utf8').read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a);assert n==cnt,(a[:60],n);s=s.replace(a,b)
rep(".myhand{font-family:var(--display);font-weight:800;color:var(--gold);font-size:.9rem;min-height:1.2em}",
    ".myhand{font-family:var(--display);font-weight:800;color:var(--gold);font-size:.9rem;min-height:1.2em;white-space:nowrap}")
# shrink the hand name to fit its column instead of wrapping one letter onto a second line
rep("setInterval(fitTable,300);",
"""function fitMyHand(){document.querySelectorAll('.mine .myhand,#vs:not([hidden]) .vsrole').forEach(h=>{if(!h.textContent){h.style.fontSize='';return}
  const box=h.parentElement;if(!box||!box.clientWidth)return;h.style.fontSize='';let f=parseFloat(getComputedStyle(h).fontSize),k=0;
  while(h.scrollWidth>box.clientWidth+1&&f>9&&k++<12){f-=1;h.style.fontSize=f+'px'}})}
setInterval(()=>{fitTable();fitMyHand()},300);""")
# 375px: keep these short labels on one line
rep("</style>","@media(max-width:400px){#btnShot{font-size:.78rem;letter-spacing:0;white-space:nowrap}.vsrole{letter-spacing:0;white-space:nowrap}}\n</style>")
# EN: a leading star prefix (stars earned this hand) should not block the templates
rep("    if(!JP.test(n)||d>4)return n;\n    for(const t of tpls)","    if(!JP.test(n)||d>4)return n;\n    {const st=n.match(/^([★☆]+) ([\\s\\S]+)$/);if(st)return st[1]+' '+core(st[2],d+1)}\n    for(const t of tpls)")
open(OUT,'w',encoding='utf8').write(s);print('ok')
