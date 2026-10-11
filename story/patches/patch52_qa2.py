import sys
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC,encoding='utf8').read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a);assert n==cnt,(a[:60],n);s=s.replace(a,b)
# QA v60 (qa/reports/v60): ケンジの「次で取り返す」「次は取り返す」もお金の話に聞こえるので言いかえる
rep("'ケンジ':{ph:'次で取り返す',","'ケンジ':{ph:'次こそ俺の番だ',")
rep("'ケンジ':{fold:['次で取り返す','ちぇっ、降りる']}","'ケンジ':{fold:['次こそ俺の番だ','ちぇっ、降りる']}")
rep("tilt:['……今のはまぐれだ','次は取り返す。黙って見てろ']","tilt:['……今のはまぐれだ','次は俺が勝つ。黙って見てろ']")
rep('const EN_DICT={','const EN_DICT={"次こそ俺の番だ": "Next one\'s mine.", "次は俺が勝つ。黙って見てろ": "Next one\'s mine. Just watch.",')
# スマホ横：フォールドの「チェックできます」が切れる → ボタンに収まる大きさまで縮める
rep("function fitMyHand(){document.querySelectorAll('.mine .myhand,#vs:not([hidden]) .vsrole')",
    "function fitMyHand(){document.querySelectorAll('.mine .myhand,#vs:not([hidden]) .vsrole,#controls button.act small')")
# レイズ額のパネルが自分の手札と「揺さぶる」を隠す → 開いている間は、手札がパネルの上に見えるところまで画面を送る
rep("function fitMyHand(){",
"""function fitRaise(){const p=$('raisePanel'),c=$('controls');if(!p||!c)return;
  // 操作欄が画面の下に貼りつく（スマホ縦・PC）ときは、パネルを開いている間だけ貼りつきをやめ、卓の下に並べる。手札が隠れない
  const open=!p.hidden&&!$('game').hidden;
  if(!open){if(p.dataset.seen){delete p.dataset.seen;p.style.position='';c.style.position=''}return}
  if(p.dataset.seen)return;const cs=getComputedStyle(c).position;if(cs==='fixed')return;
  p.dataset.seen='1';p.style.position='static';if(cs==='sticky')c.style.position='relative';
  const r=c.getBoundingClientRect();window.scrollBy({top:r.bottom-innerHeight+6,behavior:'auto'})}
setInterval(fitRaise,150);
function fitMyHand(){""")
rep("</style>",".raisepanel .presets button{white-space:nowrap;letter-spacing:0;font-size:min(.8rem,3.3vw)}\n</style>")
open(OUT,'w',encoding='utf8').write(s);print('ok')
