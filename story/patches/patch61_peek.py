import sys
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC,encoding='utf-8').read()
def rep(a,b,cnt=1):
    global s
    assert s.count(a)==cnt,(a[:60],s.count(a));s=s.replace(a,b)
# 改善提案 §6：第1・2章（とその「この店で遊ぶ」）は手札を最初から表。第3章のはじめにジンがめくり方を教える。
# 設定で自分で選んだ人（peekSet）は、その設定のまま。今までの保存には peek:true が必ず入っているので、選んだかどうかは peekSet で見る
rep("let SETTINGS={talk:'on',speed:'normal',sound:false,peek:true,",
    "let SETTINGS={talk:'on',speed:'normal',sound:false,peek:true,peekSet:false,")
rep("const myName=me&&me.hand.length===2&&board.length>=3&&!me.folded&&(!SETTINGS.peek||",
    "const myName=me&&me.hand.length===2&&board.length>=3&&!me.folded&&(!peekOn()||")
rep("const hideMine=SETTINGS.peek&&!p.peeked","const hideMine=peekOn()&&!p.peeked")
rep("if(!me||me.peeked||!SETTINGS.peek)return;","if(!me||me.peeked||!peekOn())return;")
rep("function renderPeek(){$('btnPeek').textContent='手札：'+(SETTINGS.peek?'めくって見る':'いつも表')}\n$('btnPeek').onclick=()=>{SETTINGS.peek=!SETTINGS.peek;saveSettings();",
    "function peekOn(){if(SETTINGS.peekSet)return !!SETTINGS.peek;return !(typeof CFG!=='undefined'&&CFG&&CFG.ch&&!CFG.ch.p2&&CFG.ch.no<=2)}\n"
    "function renderPeek(){$('btnPeek').textContent='手札：'+(SETTINGS.peekSet?(SETTINGS.peek?'めくって見る':'いつも表'):'めくって見る（第1・2章は表）')}\n"
    "$('btnPeek').onclick=()=>{SETTINGS.peek=SETTINGS.peekSet?!SETTINGS.peek:!peekOn();SETTINGS.peekSet=true;saveSettings();")
rep("if(SETTINGS.peek&&me.hand&&me.hand.length===2&&!me.peeked","if(peekOn()&&me.hand&&me.hand.length===2&&!me.peeked")
assert 'SETTINGS.peek&&' not in s and '!SETTINGS.peek|' not in s
rep("['','サックスの音が低く流れる、地下のジャズクラブ。'],",
    "['','サックスの音が低く流れる、地下のジャズクラブ。'],\n   ['','隣の卓の客が、配られた札の角を、指で少しだけ持ち上げて見ている。'],\n   ['ジン','ここの客は、札をそっとめくる。……真似してみろ'],")
rep('const EN_DICT={','const EN_DICT={"隣の卓の客が、配られた札の角を、指で少しだけ持ち上げて見ている。": "At the next table, a player lifts just the corner of the dealt cards with a fingertip.", "ここの客は、札をそっとめくる。……真似してみろ": "People here peel their cards gently. ...Try it.", "手札：めくって見る（第1・2章は表）": "Hole cards: peel to look (face up in Ch.1–2)",')
open(OUT,'w',encoding='utf-8').write(s)
print('ok')
