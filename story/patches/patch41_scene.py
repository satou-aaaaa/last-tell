import sys
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC,encoding='utf8').read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a);assert n==cnt,(a[:60],n);s=s.replace(a,b)
# スマホ横で、場面の「次へ」「スキップ」が画面の下にはみ出さないように。375幅では店の名前を人物の上に出す
rep("</style>","""@media (max-height:500px) and (orientation:landscape){#scene .stage{height:min(30vh,360px)}#scene .scene-btns{position:sticky;bottom:6px;z-index:6}}
#scene .venue{z-index:12;text-shadow:0 1px 4px #000,0 0 10px #000}
</style>""")
open(OUT,'w',encoding='utf8').write(s);print('ok')
