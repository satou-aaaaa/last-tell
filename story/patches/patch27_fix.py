import os,json,sys
os.chdir(os.path.dirname(os.path.abspath(__file__))+'/..')
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC).read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a);assert n==cnt,(a[:90],n);s=s.replace(a,b)
TP=[]
# 1. VS画面：相手4人・5人の並べ方。画面より高いときはスクロールでき、「勝負開始」まで必ず届く
rep(".vs{position:fixed;inset:0;z-index:50;display:grid;place-items:center;padding:16px;",".vs{position:fixed;inset:0;z-index:50;display:flex;overflow-y:auto;overscroll-behavior:contain;padding:16px;")
rep(".vsin{width:min(100%,720px);",".vsin{margin:auto;width:min(100%,720px);")
rep("@media (max-width:480px){.vsopps.n3 .vsq{display:none}",
 ".vsopps.n4{grid-template-columns:repeat(4,minmax(0,1fr))}\n.vsopps.n5{grid-template-columns:repeat(5,minmax(0,1fr))}\n"
 ".vsopps.n4 .vsava,.vsopps.n5 .vsava{width:min(100%,96px)}.vsopps.n5 .vsq{font-size:.7rem}\n"
 "@media (max-width:700px){.vsopps.n4{grid-template-columns:repeat(2,minmax(0,1fr))}.vsopps.n5{grid-template-columns:repeat(6,minmax(0,1fr))}.vsopps.n5 .vscard{grid-column:span 2}.vsopps.n5 .vscard:nth-child(4){grid-column:2/span 2}\n"
 "  .vsopps.n4 .vsq,.vsopps.n5 .vsq,.vsopps.n5 .vsrole span{display:none}.vsopps.n4 .vsava,.vsopps.n5 .vsava{width:min(100%,64px)}.vsopps.n4 .vscard,.vsopps.n5 .vscard{padding:6px 4px 8px}.vsopps.n5 .vsname{font-size:.9rem}}\n"
 "@media (max-height:500px){.vsin{gap:6px}.vsv{font-size:1.8rem}.vsopps{grid-template-columns:repeat(var(--vn,3),minmax(0,1fr))!important}.vsopps .vscard{grid-column:auto!important;padding:4px 4px 6px}.vsopps .vsava{width:min(100%,52px)}.vsopps .vsq,.vsopps .vsrole span{display:none}.vsname{font-size:.85rem}.vsgoal{font-size:.8rem;padding:4px 10px}}\n"
 "@media (max-width:480px){.vsopps.n3 .vsq{display:none}")
rep('<div class="vsopps n${opps.length}">','<div class="vsopps n${opps.length}" style="--vn:${opps.length}">')
# 2. 卓の中が勝手にスクロールして、相手の顔と名札が上に消えることがあった（手札にフォーカスが移ったときなど）。卓は常に0の位置に戻す
rep("function camXform(","(function(){const t=$('table');if(!t)return;t.style.overflow='clip';t.addEventListener('scroll',()=>{if(t.scrollTop||t.scrollLeft){t.scrollTop=0;t.scrollLeft=0}})})();\nfunction camXform(")
# 2b. 使い方の案内を閉じたら、卓の上端まで画面を戻す（案内で下へ送られたままだと相手の顔が見えない）
rep("function endTour(){tourI=-1;$('tour').hidden=true;","function endTour(){tourI=-1;$('tour').hidden=true;{const t=$('table');if(t&&!$('game').hidden&&t.getBoundingClientRect().top<0)window.scrollTo({top:Math.max(0,t.getBoundingClientRect().top+scrollY-4),behavior:'auto'})}")
# 3. 卓の外へはみ出す賭け額・チップを内側へ寄せる。テルの印が名札に重なったら札の上へ
rep("function camXform(",r'''function fitTable(){const t=$('table');if(!t||$('game').hidden||!t.offsetParent)return;const tr=t.getBoundingClientRect();
  t.querySelectorAll('.felt .spot .chipwrap,.felt .spot .mystack').forEach(sp=>{sp.style.translate='';const r=sp.getBoundingClientRect();if(!r.width)return;let dx=0;
    if(r.left<tr.left+2)dx=tr.left+2-r.left;else if(r.right>tr.right-2)dx=tr.right-2-r.right;if(dx)sp.style.translate=`${dx.toFixed(1)}px 0`});
  const pls=[...t.querySelectorAll('#plates .plate')].map(p=>p.getBoundingClientRect());
  t.querySelectorAll('#plates .cue:not(.rd)').forEach(c=>{c.style.translate='';const r=c.getBoundingClientRect();if(!r.width)return;
    for(const p of pls)if(r.left<p.right&&p.left<r.right&&r.bottom>p.top+2&&r.top<p.bottom){c.style.translate=`0 ${(p.top-2-r.bottom).toFixed(1)}px`;break}})}
setInterval(fitTable,300);addEventListener('resize',fitTable);
function camXform(''')
# 4. 6人卓の名札：チップ数を折り返さない。小さい画面ではボタンの下の文字と「あなたのチップ」を小さく
rep(".n6 .plate .nm{white-space:nowrap}",".n6 .plate .nm{white-space:nowrap}\n.n6 .plate .chp{white-space:nowrap}\n@media (max-width:400px){.n6 .plate .chp{font-size:.62rem}.n6 .plate .nm{font-size:.64rem}button.act small{font-size:.66rem;letter-spacing:0}.mine .lbl2{white-space:nowrap;font-size:.62rem}}\n@media (max-width:420px){.n6 .felt .spot:not(#spot0) .mystack{display:none}}\n#raiseWord{white-space:normal;text-wrap:balance}")
# 5. 額を選ぶ枠がポットを隠しても、ポットの額が見えるように枠の見出しに入れる
rep("$('raiseWord').textContent=S.currentBet===0?'いくら賭ける？':`いくらにする？（今の賭け ${fmt(S.currentBet)}）`;",
    "$('raiseWord').textContent=S.currentBet===0?`いくら賭ける？（ポット ${fmt(potTotal())}）`:`いくらにする？（ポット ${fmt(potTotal())}／今の賭け ${fmt(S.currentBet)}）`;")
TP=[['いくら賭ける？（ポット {0}）','How much? (pot {0})'],['いくらにする？（ポット {0}／今の賭け {1}）','Raise to? (pot {0} / current bet {1})']]
rep('const EN_TPL=[','const EN_TPL='+json.dumps(TP,ensure_ascii=False)[:-1]+',')
open(OUT,'w').write(s);print('ok')
