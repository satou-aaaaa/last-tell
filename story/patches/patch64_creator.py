import sys,json
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC,encoding='utf-8').read()
def rep(a,b,cnt=1):
    global s
    assert s.count(a)==cnt,(a[:60],s.count(a));s=s.replace(a,b)
# クリエイター目線レビュー v62（qa/reports/v62/creator.md「本線に渡す小さい直し」2〜4）
# 2) 回想の結果は締めの1行（F.end）だけ：勝敗の札・勝ちの額・「ブラフを見抜いた！」・負けた側のひと言・「あなたのチップ」を出さない。目標欄の「0になったら負け」も消す
# 3) 回想では自分の席に、その席の人の名前（クロウ・ロク・セキ）を出す。ジンの頭の「降りる」は負けた側のひと言（lineFor fold）だったので回想では出さない
# 4) 音がオフのまま第1章を終えたら、1回だけ「設定で音楽をオンにできます」
rep("${sub?esc(sub)+'　／　':''}自分のチップが0になったら負け</span>",
    "${g.type==='flash'?esc(sub):(sub?esc(sub)+'　／　':'')+'自分のチップが0になったら負け'}</span>")
rep("if(S.readMsg){S.readMsg=false;S.msg=`ブラフを見抜いた！ ${S.msg}`;grantTitle('read');",
    "if(S.readMsg&&CFG.flashback)S.readMsg=false;if(S.readMsg){S.readMsg=false;S.msg=`ブラフを見抜いた！ ${S.msg}`;grantTitle('read');")
rep("if(loser){loser.say=","if(loser&&!CFG.flashback){loser.say=")
rep("if(g.type==='flash'){S.result='flash';render();return}","if(g.type==='flash'){S.result='flash';S.msg='';render();return}")
rep("else if(p.won)tag=`<span class=\"tag win\">","else if(S.result==='flash')tag='';else if(p.won)tag=`<span class=\"tag win\">")
rep("$('street').textContent=S.result?(S.result==='win'?'勝利':'敗北'):STREET_JP[S.street];",
    "$('street').textContent=S.result==='flash'?'':S.result?(S.result==='win'?'勝利':'敗北'):STREET_JP[S.street];")
rep("${S.dealer===0?'<span class=\"dbadge\" title=\"ディーラー\">D</span>':''}</div>${tag}</div>",
    "${S.dealer===0?'<span class=\"dbadge\" title=\"ディーラー\">D</span>':''}</div>${CFG.flashback?`<span class=\"me-n\">${esc(p.name)}</span>`:''}${tag}</div>")
rep("<span class=\"lbl2\">あなたのチップ</span><span class=\"chp\">${fmt(p.chips)}</span>",
    "${CFG.flashback?'':`<span class=\"lbl2\">あなたのチップ</span><span class=\"chp\">${fmt(p.chips)}</span>`}")
rep(".mine .me-l{justify-self:start;display:grid;gap:4px;justify-items:start}",
    ".mine .me-l{justify-self:start;display:grid;gap:4px;justify-items:start}\n.mine .me-n{font-size:.78rem;font-weight:700;color:var(--gold,#d8b25a);letter-spacing:.06em;white-space:nowrap}")
# 4) 音楽の案内
rep('const TIPS={','const TIPS={"music": "設定で音楽をオンにできます", ')
rep("function tipWant(){const me=S.players[0];if(!me||!me.human)return'';const nv=novice();",
    "function tipWant(){const me=S.players[0];if(!me||!me.human)return'';const nv=novice();\n  if(S.handOver&&S.result==='win'&&CFG.ch&&!CFG.ch.p2&&!CFG.ura&&CFG.ch.no===1&&(+SETTINGS.sound||0)<2&&!tipSeen('music'))return'music';")
EN={"設定で音楽をオンにできます":"You can turn on music in Settings."}
# タケルの（メモ）の行：表示では（メモ）を外して訳すが、ログなどそのまま出る所のために全文の英語も入れる
EN.update({"（メモ）あなたの手。さっきも同じ動き":"(note) Your hands. Same motion as before.","（メモ）全員の手が見えるから":"(note) I can see everyone's hands from here.","（メモ）あなたも。目がいい":"(note) So was yours. Good eyes.","（メモ）五つ目は手話":"(note) My fifth is sign language.","（メモ）やっぱり":"(note) Thought so.","（メモ）見えていた。早く開けて":"(note) I saw it. Show faster.","（メモ）ケンジ、靴下が左右ちがう":"(note) Kenji, your socks don't match."})
rep('const EN_DICT={','const EN_DICT={'+json.dumps(EN,ensure_ascii=False)[1:-1]+',')
# 画面チェックで見つかった分：2人卓などで上の真ん中の席の賭けチップが場札に重なる → 場札とのすき間が足りないときは手札の左へ出す
rep("function fitTable(){const t=$('table');if(!t||$('game').hidden||!t.offsetParent)return;const tr=t.getBoundingClientRect();",
    "function fitTable(){const t=$('table');if(!t||$('game').hidden||!t.offsetParent)return;const tr=t.getBoundingClientRect();\n  {const bc=[...t.querySelectorAll('#boardCards .card')].map(c=>c.getBoundingClientRect()).filter(r=>r.width),bt=bc.length?Math.min(...bc.map(r=>r.top)):1e9,bl=bc.length?Math.min(...bc.map(r=>r.left)):0,br=bc.length?Math.max(...bc.map(r=>r.right)):0;\n    t.querySelectorAll('.felt .spot[data-c]').forEach(sp=>{const h=sp.querySelector('.hand');if(!h)return;const r=h.getBoundingClientRect();if(!r.width)return;sp.classList.toggle('cwside',r.left<br&&r.right>bl&&r.top<bt&&r.bottom+34>bt)})}")
rep(".spot[data-c] .mystack{left:100%;right:auto;margin-left:2px}",
    ".spot[data-c] .mystack{left:100%;right:auto;margin-left:2px}\n.spot.cwside .chipwrap{position:absolute;right:100%;top:0;margin-right:4px}")
# 名札の「オールイン 78,000」が縮みきらずに切れる → 縮める回数を増やす
rep("while(t.scrollWidth>t.clientWidth+1&&f>8&&n++<12)","while(t.scrollWidth>t.clientWidth+1&&f>7&&n++<30)")
open(OUT,'w',encoding='utf-8').write(s)
