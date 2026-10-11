import sys,re
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC,encoding='utf-8').read()
def rep(a,b,cnt=1):
    global s
    assert s.count(a)==cnt,(a[:60],s.count(a));s=s.replace(a,b)
# 改善提案 §5：6時間以上あけて「続きから」を押したら、ジン（第二部は師匠）が「前回まで」をひとこと言ってから続ける
R=r'''const RECAP={
 1:{ja:'錨亭だ。ゲンは何にでも入ってくる。強い手のときだけ戦え',en:'The Anchor. Gen plays every hand. Fight only with strong ones.'},
 2:{ja:'ロクの店、銀の扉だ。盗むのは後ろの席から。あと{left}回だ',en:'Roku\'s place, the Silver Door. Steal from the late seats. {left} to go.'},
 3:{ja:'月影で、セキと打っている。何もない手でも、仕掛けどころはある。あと{left}回だ',en:'You\'re playing Seki at the Moonshadow. Even with nothing, there\'s a moment to move. {left} to go.'},
 4:{ja:'天空の卓だ。レイカは嘘をつく。顔を見て、嘘にだけ払え。あと{left}回だ',en:'The Skyline table. Reika lies. Watch her face and only pay off the lies. {left} to go.'},
 5:{ja:'ハヤトの賭場だ。AAで負けて、少ないチップからやり直している。……焦るな',en:'Hayato\'s den. Your aces got cracked and you\'re rebuilding from a short stack. ...Don\'t rush.'},
 6:{ja:'王冠のトーナメントだ。残りは{left}人。ブラインドは上がり続ける',en:'The Crown tournament. {left} players left. The blinds keep climbing.'},
 7:{ja:'……座れ。卒業試験の続きだ',en:'...Sit. The final exam isn\'t over.'},
 11:{ja:'錨亭だ。タロウがゲンと打っている。強い手だけで戦え',en:'The Anchor. Taro is playing Gen. Fight only with strong hands.'},
 12:{ja:'汐見の舫だ。よその店でも、盗むのは後ろの席から。あと{left}回だ',en:'Moyai, in Shiomi. Even in a strange house, steal from the late seats. {left} to go.'},
 13:{ja:'地下で、ハヤトの弟子のカイと打っている。急がせるのは向こうだ',en:'Down in the den, playing Hayato\'s student Kai. Let him be the one in a hurry.'},
 14:{ja:'看板持ちのトーナメントだ。残りは{left}人',en:'The sign-holders\' tournament. {left} players left.'},
 15:{ja:'……座れ。最後のテルの続きだ',en:'...Sit. We\'re not done with the last tell.'},
};'''
ja={};en={}
for m in re.finditer(r"(\d+):\{ja:'((?:[^'\\]|\\.)*)',en:'((?:[^'\\]|\\.)*)'\}",R):
    ja[int(m.group(1))]=m.group(2);en[m.group(2)]=m.group(3).replace("\\'","'")
assert len(ja)==12,len(ja)
import json
js="const RECAP="+json.dumps({str(k):v for k,v in ja.items()},ensure_ascii=False)+";\n"
js+="function recapLine(R){if(!R||R.kind!=='ch'||!(Date.now()-(+R.at||0)>6*3600e3))return null;const c=CHAPTERS[R.ch-1];const t=c&&RECAP[c.no];if(!t)return null;\n"
js+="  const g=c.goal||{},st=R.S||{},n=g.type==='steal'?st.steals:g.type==='bluff'?st.bluffs:g.type==='readcall'?st.reads:null;\n"
js+="  const left=g.n&&n!=null?Math.max(1,g.n-(+n||0)):R.P.filter(p=>!p.out&&(+p.chips||0)>0).length;\n"
js+="  return[c.p2?mentorName():'ジン',t.replace('{left}',left)]}\n"
rep("function resumeGo(R){",js+"function resumeGo(R){")
rep("{const o=showVersus;showVersus=function(done){if(typeof CFG!=='undefined'&&CFG&&CFG.resumeData){const R=CFG.resumeData;delete CFG.resumeData;$('vs').hidden=true;return resumeApply(R)}return o.apply(this,arguments)}}",
    "{const o=showVersus;showVersus=function(done){if(typeof CFG!=='undefined'&&CFG&&CFG.resumeData){const R=CFG.resumeData;delete CFG.resumeData;$('vs').hidden=true;\n"
    "  const rl=recapLine(R);if(rl){const ch=CFG.ch;return setTimeout(()=>playScene(ch,[rl],()=>{show('game');resumeApply(R)}),0)}return resumeApply(R)}return o.apply(this,arguments)}}")
# EN：{left} は数字なので、テンプレートにする
tpl=[];dic={}
for j,e in en.items():
    if '{left}' in j: tpl.append([j.replace('{left}','{0}'),e.replace('{left}','{0}')])
    else: dic[j]=e
rep('const EN_DICT={','const EN_DICT={'+json.dumps(dic,ensure_ascii=False)[1:-1]+',')
rep('const EN_TPL=[','const EN_TPL=['+json.dumps(tpl,ensure_ascii=False)[1:-1]+',')
open(OUT,'w',encoding='utf-8').write(s)
print('ok')
