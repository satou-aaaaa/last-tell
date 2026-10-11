import sys,json
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC,encoding='utf-8').read()
def rep(a,b,cnt=1):
    global s
    assert s.count(a)==cnt,(a[:60],s.count(a));s=s.replace(a,b)
# 改善提案 §1：ジンの三行。勝った章でけなさない・1行目と2行目が逆のことを言わない（research/改善提案_2026-10-10_実装仕様.md）
WIN={1:('ゲンを飛ばした。それで十分だ',"You busted Gen. That's enough."),
 2:('三回、盗んだな。後ろの席の使い方は覚えた',"Three steals. You've learned what the late seats are for."),
 3:('何もない手で、二回勝った。それが仕掛けだ',"Two pots with nothing. That's how you make a move."),
 4:('嘘を二回、見抜いた。顔を見ていたな','You caught two lies. You were watching faces.'),
 5:('少ないチップから戻した。焦らなかったな',"Back from a short stack. You didn't rush."),
 6:('最後の一人だ。……王冠の卓でな','Last one standing. At the Crown, no less.'),
 7:('……読んだな','...You read it.'),
 11:('ゲンを飛ばした。最初の一歩だ',"You busted Gen. That's the first step."),
 12:('よその店で、二回盗んだ。度胸がついたな',"Two steals in a strange house. You've got nerve now."),
 13:('カイに勝った。急がなかったからだ',"You beat Kai. Because you didn't hurry."),
 14:('看板持ちの卓で、最後の一人だ','Last one standing at a table of sign-holders.'),
 15:('……読んだな','...You read it.')}
LOSE=('……まだ、お前の打ち方は見えてこない',"...I can't see your game yet.")
js='const REVIEW_WIN_LINE='+json.dumps({str(k):v[0] for k,v in WIN.items()},ensure_ascii=False)+";\nconst REVIEW_LOSE_LINE='"+LOSE[0]+"';\n"
rep("function reviewLines(st){\n  if(!st||st.hands<5)return null;const r=[];",
    js+"function reviewLines(st,ch,result){\n  if(!st||st.hands<5)return null;const r=[];")
rep(":'……今夜は、いいところを探すほうが難しい');",
    ":result==='win'?(REVIEW_WIN_LINE[ch]||'それでいい'):REVIEW_LOSE_LINE);")
rep("else r.push('目立った悪いくせは、ない。……今夜はな');","else r.push('目立った悪いくせは、ない');")
rep("S.review=reviewLines(S.stat);","S.review=reviewLines(S.stat,CFG.ch&&!CFG.ura?CFG.ch.no:null,S.result);")
en={v[0]:v[1] for v in WIN.values()};en[LOSE[0]]=LOSE[1];en['目立った悪いくせは、ない']='No bad habits stand out.'
rep('const EN_DICT={','const EN_DICT={'+json.dumps(en,ensure_ascii=False)[1:-1]+',')
open(OUT,'w',encoding='utf-8').write(s)
print('ok')
