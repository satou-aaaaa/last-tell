import os,re,json,sys
os.chdir(os.path.dirname(os.path.abspath(__file__))+'/..')
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC).read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a);assert n==cnt,(a[:90],n);s=s.replace(a,b)
def repall(a,b):
    global s
    assert a in s,a;s=s.replace(a,b)
# satou 2026-10-09：「夜」が入った名前は別の名前に。お金を思わせる2つのセリフは使わない（仕様：夜の名前とセリフの差し替え）
# 英語（辞書の値）を先に直す
for a,b in [('"一夜を勝ち抜いた。外は、もう朝だ": "','"五つの卓を勝ち抜いた。外は、もう朝だ": "')]:
    pass
repall('一夜を勝ち抜いた。外は、もう朝だ','五つの卓を勝ち抜いた。外は、もう朝だ')
s=re.sub(r'("五つの卓を勝ち抜いた。外は、もう朝だ[^"]*": ")[^"]*(")',r'\1You beat all five tables. Outside, it\'s already morning.\2',s)
repall('一夜（ひとよ）','はしご')
repall('一夜','はしご')
for a,b in [('"One Night: fell at table {0}"','"Table Hop: fell at table {0}"'),('"One Night: table {0}, {1}"','"Table Hop: table {0}, {1}"'),('"One Night: won till dawn"','"Table Hop: won till dawn"'),('"One Night"','"Table Hop"')]:
    repall(a,b)
s=re.sub(r'("はしごで5つの卓を回りきる": ")[^"]*(")',r'\1Clear all 5 tables in Table Hop\2',s)
repall("name:'負けなしの夜'","name:'無敗'");repall('"負けなしの夜": "Unbeaten night"','"無敗": "Undefeated"')
repall("name:'カードが来ない夜'","name:'待てる者'");repall('"カードが来ない夜": "Card-dead night"','"待てる者": "The Patient One"')
repall("'今夜は取り返すぜ'","'今日は俺の日だぜ'");repall('"今夜は取り返すぜ": "I\'m winning it back tonight."','"今日は俺の日だぜ": "Today\'s my day."')
s=re.sub(r'"仕事帰りに覚えたポーカーで、今夜も負けが込んでいる。": "[^"]*"','"仕事帰りに覚えたポーカー。今日も、まるで勝てずにいる。": "Poker I picked up after work. Again today, I can\'t win a hand."',s)
repall('仕事帰りに覚えたポーカーで、今夜も負けが込んでいる。','仕事帰りに覚えたポーカー。今日も、まるで勝てずにいる。')
for bad in ['一夜','今夜は取り返す','負けが込','カードが来ない夜','負けなしの夜']: assert bad not in s,bad
# E-12：対戦中の「やめる」は確認してから（間違えて触っても章が終わらない）
rep("$('btnQuit').onclick=()=>{\n","$('btnQuit').onclick=()=>{\n  if(S&&S.players&&!S.result&&!S.quitOk&&!$('game').hidden){const box=$('runBox');box.innerHTML=`<div class=\"qin runbox\"><p class=\"qq\">やめますか？</p><p>ここまでの勝負は残りません。</p><div class=\"qopts\"><button id=\"qtNo\">続ける</button><button id=\"qtYes\">やめる</button></div></div>`;box.hidden=false;\n    $('qtNo').onclick=()=>{box.hidden=true;$('btnQuit').focus({preventScroll:true})};$('qtYes').onclick=()=>{box.hidden=true;S.quitOk=true;$('btnQuit').onclick()};$('qtNo').focus({preventScroll:true});return}\n")
EN={'やめますか？':'Quit?','ここまでの勝負は残りません。':"Your progress at this table won't be kept."}
rep('const EN_DICT={','const EN_DICT='+json.dumps(EN,ensure_ascii=False)[:-1]+',')
open(OUT,'w').write(s);print('ok')
