import os,json,sys,re
os.chdir(os.path.dirname(os.path.abspath(__file__))+'/..')
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC).read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a);assert n==cnt,(a[:90],n);s=s.replace(a,b)
def cut(a,b):
    """a から b の直前までを返す（どちらも1回だけ出ること）"""
    assert s.count(a)==1,(a[:60],s.count(a));i=s.index(a);j=s.index(b,i);assert s.count(b)>=1;return s[i:j]
EN={};TP=[]
def en(ja,e):
    k=re.sub(r'\s+',' ',ja).strip()
    EN[k]=e
def tp(ja,e):TP.append([re.sub(r'\s+',' ',ja).strip(),e])

# =========================================================
# プロ目線の改善（research/プロ目線の改善_実装仕様.md）
#   python3 ux/patch49_pro.py story/work47.html story/work49.html
# 入れる順番：S1 → S2 → S3 → A2 → A1 → A6 → A5 （B1・B4 は最後に別の区切りで）
# 守ること：第1〜3章の相手・持ち点・ブラインド・勝利条件・ジンの助言・CPU・クセの確率は変えない。
#           第7章のジンの release のクセには触れない。名前に「夜」を使わない。会話にお金の話を入れない。
# 新しい保存先：shisho-resume（続きから）／shisho-stats（B1、端末の中だけ）。どちらも SAVE_KEYS に入れ、読み書きは try/catch。
# =========================================================

# ---------------------------------------------------------------- S1. 第1章の intro を5つにし、残りをハンドの合間（beats）へ
OLD_INTRO=cut("  intro:[\n   {door:1},\n","  outro:[\n   ['ゲン','参った！お前、急に固くなりやがったな'],")
MARK=re.search(r"\{mark:'[^']*'\}",OLD_INTRO).group(0)        # 今の mark をそのまま使う
LESSON=re.search(r"\{lesson:'ハンドの選び方',body:'[^']*'\}",OLD_INTRO).group(0)  # 今の body をそのまま使う
for must in ["['','雨の夜。港のはずれにあるバー「錨亭」。']","['','仕事帰りに覚えたポーカー。今日も、まるで勝てずにいる。']",
             "['ジン','ジンでいい。昔、少しだけカードをやっていた']","['店主','ジンさんが人に口を出すなんて、何年ぶりだろうね']",
             "['ジン','いいか。降りるのも勝負のうちだ']","['ジン','それと、ゲンは顔に出る。いい手が来ると、すぐにニヤける']"]:
    assert must in OLD_INTRO,must
NEW_INTRO="""  intro:[
   {door:1},
   ['','雨の夜。港のはずれにあるバー「錨亭」。'],
   ['ゲン','おう新入り、もう一勝負だ！配られた札は全部勝負、それがポーカーってもんよ！'],
   ['老人','……お前、負け方が下手だな'],
   ['老人','ゲンは何にでも参加する。だから、お前は強い手のときだけ戦えばいい。それだけで勝てる'],
  ],
  // S1：ハンドの合間の場面。n ハンド目が終わって、次を配る前に1回だけ流す（章選択から始めたときだけ。負けてやり直しでは出ない）
  beats:[
   {after:1,lines:[
     ['','仕事帰りに覚えたポーカー。今日も、まるで勝てずにいる。'],
     ['','老人は軽く握った指の背で顎の古い傷をなでながら、こちらの手札をのぞきこんだ。',%s],
     /* HOOK:ch1-after1-ao   主人公アオ仕様の2行（「指が、手元のチップの枚数を数えていた。」「……数えるな。顔を見ろ」）はここに足す */
     ['ジン','ジンでいい。昔、少しだけカードをやっていた'],
     /* HOOK:ch1-after1-name 主人公の名前仕様の「名乗る」3行（askName）はここに足す */
     ['店主','ジンさんが人に口を出すなんて、何年ぶりだろうね'],
   ]},
   {after:2,lines:[
     %s,
     ['ジン','いいか。降りるのも勝負のうちだ'],
   ]},
   {after:3,lines:[
     ['','カウンターの奥の壁には、写真が何枚も貼ってある。一枚だけ、裏返しのままだ。'],
     ['',"写真の上に、店の名前が削られた古い看板が一枚かかっている。錨亭のものではないらしい。"],
     ['ジン','それと、ゲンは顔に出る。いい手が来ると、すぐにニヤける'],
   ]},
  ],
"""%(MARK,LESSON)
assert "['','カウンターの奥の壁には、写真が何枚も貼ってある。一枚だけ、裏返しのままだ。']" in OLD_INTRO
rep(OLD_INTRO,NEW_INTRO)

# 1-3：初めて第1章を遊ぶときは名乗り札を出さず、VS だけ。beatsOn は章選択から始めたときだけ
rep("ch,nanori:!skipIntro,title:","ch,nanori:!skipIntro&&!(ch.no===1&&!loadCleared()),beatsOn:!skipIntro,title:")
# 1-2：次のハンドへの前に beat を流す
rep("  else startHand();\n};",
    "  else{const bt=pendingBeat();if(bt)return playScene(CFG.ch,bt.lines,()=>{show('game');Sound.bgm(CFG.bgm||0);render();startHand()});startHand()}\n};")
# beat を流す前に章が終わったら（勝ち）、残りの行を outro の頭に足す
rep("showInterstitial(()=>{const ls=typeof ch.outro==='function'?ch.outro():ch.outro;",
    "const bRest=beatRest();showInterstitial(()=>{const ls=bRest.concat(typeof ch.outro==='function'?ch.outro():ch.outro);")
# 「会話を見る」でも beats の行を出す
rep("playScene(ch,[].concat(ch.intro,typeof ch.outro==='function'?ch.outro():ch.outro)",
    "playScene(ch,[].concat(ch.intro,...(ch.beats||[]).map(b=>b.lines),typeof ch.outro==='function'?ch.outro():ch.outro)")

# ---------------------------------------------------------------- S2. 自動の5ページ案内をやめる（「？ 遊び方 → 卓の上で案内を見る」からは今までどおり）
rep("  if(p.human&&!S.autoMe&&!CFG.flashback&&tourI<0&&!tourDone()){render();setTimeout(()=>{if(S===s0&&S.toAct===0&&tourI<0&&!tourDone()){Clock.stop();startTour()}},400)}\n","")
# 案内を自動で出さなくなったので「済み」扱い（掛け合い・話しかけが初回から止まらないように）
rep("function tourDone(){try{return !!(JSON.parse(localStorage.getItem(HELP_KEY))||{}).done}catch(e){return true}}",
    "function tourDone(){return true} // S2：自動の案内はやめた。その場の1行の案内（tips）に置きかえ")
# 案内を最後まで見たとき、tips の記録を消さないように混ぜて保存する
rep("localStorage.setItem(HELP_KEY,JSON.stringify({v:1,done:true}))","guideSet({done:true})")

# ---------------------------------------------------------------- S3. 続きから：保存先
rep("const SAVE_KEYS=['shisho-progress',","const SAVE_KEYS=['shisho-resume','shisho-stats','shisho-progress',")

# ---------------------------------------------------------------- A2. タイトルを3つのボタンに
NOTICE='    <div class="fnotice" id="firstNotice" role="note" hidden><p>このゲームは、ポーカーを題材にした1人用のゲームです。チップは点数で、現金や景品とは交換できません。実際のお金を賭けることを勧めるものではありません。</p><button class="ghost small" id="btnNoticeClose">閉じる</button></div>\n'
rep(NOTICE,'')
OLD_ROW=cut('      <div class="row">\n        <button class="primary" id="btnStory">ストーリー</button>','    </div>\n    <div class="hero" id="hero">')
for must in ['id="freeRule"','id="freeSize"','id="freeRude"','id="nick"','id="btnHow"','id="btnDaily"','id="btnRun"','id="btnMore"']:assert must in OLD_ROW,must
SEL_RULE=re.search(r'<label class="rulepick">フリー対戦の店ルール[\s\S]*?</label>',OLD_ROW).group(0)
SEL_SIZE=re.search(r'<label class="rulepick">フリー対戦の人数[\s\S]*?</label>',OLD_ROW).group(0)
SEL_RUDE=re.search(r'<label class="rulepick"><input type="checkbox" id="freeRude">[^<]*</label>',OLD_ROW).group(0)
NICK=re.search(r'<label class="rulepick">呼び名[\s\S]*?</label>',OLD_ROW).group(0)
NEW_ROW='''      <div class="tacts">
        <div class="row tmain"><button class="primary" id="btnStory">ストーリー</button></div>
        <div class="tpick" id="tPick" hidden><button class="tlink" id="btnPick">最初から選ぶ</button></div>
        <div class="row tsub"><button id="btnFree">フリー対戦</button><button id="btnDaily" class="tsm" hidden>今日の1ハンド</button><button id="btnRun" class="tsm" hidden>はしご</button><button id="btnMore" class="ghost">その他</button></div>
      </div>
'''+NOTICE.replace('    <div','      <div')+'''      <div class="mdlg fsetup" id="freeSetup" hidden role="dialog" aria-modal="true" aria-labelledby="fsH"><div class="mdlgin">
        <h3 id="fsH">フリー対戦</h3>
        '''+SEL_RULE+'''
        '''+SEL_SIZE+'''
        '''+SEL_RUDE+'''
        <div class="mbtns"><button class="ghost" id="btnFreeBack">戻る</button><button class="primary" id="btnFreeGo">この設定で始める</button></div>
      </div></div>
      <div hidden id="nickHold">'''+NICK+'''</div>
'''
rep(OLD_ROW,NEW_ROW)
# 「遊び方・役の一覧」は「その他」の一番上へ
rep('''    <div class="mgrid">
      <div class="mgroup"><h3>設定</h3>''','''    <div class="mgrid">
      <div class="mgroup"><h3>遊び方</h3>
        <button class="mrow" id="btnHow"><b>遊び方・役の一覧</b><small>ゲームの流れ・役・操作の案内</small></button>
      </div>
      <div class="mgroup"><h3>設定</h3>''')
en('最初から選ぶ','Choose a chapter')
en('この設定で始める','Start with these settings')
en('戻る','Back')
en('ゲームの流れ・役・操作の案内','Game flow, hand rankings, controls')
en('遊び方','How to play')
tp('続きから（第{0}章・{1}ハンド目）','Continue (Ch.{0}, hand {1})')
tp('続きから（フリー対戦・{0}ハンド目）','Continue (Free play, hand {0})')
tp('続きから（{0}・{1}ハンド目）','Continue ({0}, hand {1})')
en('前回の続きから','Picking up where you left off')

# ---------------------------------------------------------------- A1. 段階的に見せる
rep("$('notesBox').hidden=!(cfg.tells||cfg.ch);","$('notesBox').hidden=!cfg.tells;")
rep('<details class="logbox"><summary>ハンドの記録</summary>','<details class="logbox" id="logBox"><summary>ハンドの記録</summary>')
rep("renderQuick(canRaise&&!fb&&!raiseOpen);","renderQuick(canRaise&&!fb&&!raiseOpen&&!quickHide());")
rep('<section class="exbox"><h3>カードプロテクター</h3>','<section class="exbox" id="protBox"><h3>カードプロテクター</h3>')
rep('<section class="exbox"><h3>あるある称号</h3>','<section class="exbox" id="titleBox"><h3>あるある称号</h3>')
# 章選択：プロテクター・称号は1つ目を手に入れるまで欄ごと出さない（裏の卓は今までどおり第7章クリア後）
rep("  p2Render();\n  show('chapters');\n}","  p2Render();\n  try{const g1=loadTitles();$('protBox').hidden=!PROTECTORS.some(p=>p.id&&p.ch<=cleared);$('titleBox').hidden=!Object.keys(g1).some(k=>g1[k])}catch(e){}\n  show('chapters');\n}")
en('くわしい設定','More settings')

# ---------------------------------------------------------------- A6. 決まった配札のこと（遊び方 → ゲームの流れ）
A6='カードは毎回ふつうにシャッフルしています。物語の決まった場面だけ、配られる札が決まっています（そのハンドは自動で進みます）。'
rep('<p class="hnote">チップは点数です。お金とは交換しません。</p>','<p class="hnote">チップは点数です。お金とは交換しません。<br>'+A6+'</p>')
en(A6,"Cards are shuffled normally every time. Only in certain story moments are the cards set in advance (those hands play themselves).")
tp('ターンの時点で、あなたの勝率は約{0}%でした。','On the turn, your chance to win was about {0}%.')

# ---------------------------------------------------------------- A5. 見えた：低い1音
rep("  return{\n    sfx:safe(","  return{\n    low:safe(function(){if(!SFX()||paused)return;tone(196,.55,.09,'triangle')}),\n    sfx:safe(")
en('……見えたな','...You saw it.')

# ---------------------------------------------------------------- S2 の文
TIPS={'hold':['伏せた2枚をタップすると、自分にだけ見えます','Tap your two face-down cards to see them. Only you can see them.'],
      'act':['降りるか、同じ額を払って続けるかを選びます','Choose: fold, or pay the same amount to stay in.'],
      'raise':['額を選んで、もう一度押すと決まります','Pick an amount, then press again to confirm.'],
      'board':['真ん中の3枚は全員が使えるカードです','The three cards in the middle are shared by everyone.'],
      'pot':['賭けられたチップは、勝った人のものになります','All the chips bet go to the winner.']}
for k,(j,e) in TIPS.items():en(j,e)
# 掛け合い（patch47）の「（メモ）」つきの行が英語に訳されずに残っていたので、ここで足す（patch47 側で直ったら消してよい）
en('（メモ）楽しむ派、一人追加','(Note) One more for team fun.')

# ---------------------------------------------------------------- B4（任意）文字の大きさ・4色のトランプ・振動
B4={'文字の大きさ':'Text size','会話・ボタン・名札の文字を大きくします':'Makes dialogue, buttons and name plates larger',
    '4色のトランプ':'Four-color deck','♠黒・♥赤・♦青・♣緑で表示します':'Shows ♠ black, ♥ red, ♦ blue, ♣ green',
    '振動':'Vibration','スマホで、自分の番や「見えた」のときに短く振動します':'Short vibrations on your turn and on “I see it” (phones)',
    '文字：標準':'Text: Normal','文字：大':'Text: Large','4色：オフ':'4 colors: Off','4色：オン':'4 colors: On','振動：オン':'Vibration: On','振動：オフ':'Vibration: Off'}
for j,e in B4.items():en(j,e)

JS=r'''
// =====================================================================
// プロ目線の改善（patch49）
//   S1 beats／S2 その場の1行の案内／S3 続きから（shisho-resume）／A2 タイトル／A1 段階的に見せる／A6 バッドビートの勝率／A5 見えた
//   B1 やめた場所の記録（shisho-stats、端末の中だけ）／B4 文字の大きさ・4色・振動
// =====================================================================

// ---------- S1：章の合間の場面（beats） ----------
// pendingBeat：今のハンド数までで、まだ流していない beat の行をまとめて返す（流したことにする）
function pendingBeat(){
  if(typeof CFG==='undefined'||!CFG||!CFG.ch||!CFG.ch.beats||!CFG.beatsOn||!S||!S.players||S.result)return null;
  const d=S.beatDone=S.beatDone&&typeof S.beatDone==='object'?S.beatDone:{},bs=CFG.ch.beats.filter(b=>b.after<=S.handNo&&!d[b.after]);
  if(!bs.length)return null;bs.forEach(b=>{d[b.after]=1});return{lines:[].concat(...bs.map(b=>b.lines))}}
// beatRest：章が beat を流す前に勝って終わったとき、残りの行（outro の頭に足す）
function beatRest(){
  if(typeof CFG==='undefined'||!CFG||!CFG.ch||!CFG.ch.beats||!CFG.beatsOn||!S)return[];
  const d=S.beatDone=S.beatDone&&typeof S.beatDone==='object'?S.beatDone:{},bs=CFG.ch.beats.filter(b=>!d[b.after]);
  bs.forEach(b=>{d[b.after]=1});return[].concat(...bs.map(b=>b.lines))}
// 初めての第1章：扉は少し待って自動で進む（タップしてもよい）
{const o=renderLine;renderLine=function(){const r=o.apply(this,arguments);
  try{const l=SC&&SC.lines[SC.i];if(l&&l.door===1&&SC.ch&&SC.ch.no===1&&!SC.ch.p2&&!loadCleared()){const sc=SC,i=SC.i;setTimeout(()=>{if(SC===sc&&SC.i===i)advance()},1800)}}catch(e){}
  return r}}

// ---------- S2：その場で1行の案内 ----------
function guideGet(){try{const o=JSON.parse(localStorage.getItem(HELP_KEY));return o&&typeof o==='object'&&!Array.isArray(o)?o:{}}catch(e){return{}}}
function guideSet(p){try{localStorage.setItem(HELP_KEY,JSON.stringify(Object.assign(guideGet(),p,{v:1})))}catch(e){}}
const TIPS=__TIPS__;
function tipSeen(k){const t=guideGet().tips;return !!(t&&typeof t==='object'&&t[k])}
function tipMark(k){const g=guideGet(),t=g.tips&&typeof g.tips==='object'&&!Array.isArray(g.tips)?g.tips:{};t[k]=1;guideSet({tips:t})}
// ジンの助言（や「見えた」）と同時に出さないよう、ジンの欄をしばらく隠す
function senseiWait(ms){const e=$('sensei');if(!e)return;e.classList.add('mwait');clearTimeout(senseiWait.t);senseiWait.t=setTimeout(()=>e.classList.remove('mwait'),ms)}
let tipK='',tipT=0,tipAt=0;
function tipEl(){let e=$('tipLine');if(!e){e=document.createElement('div');e.id='tipLine';e.className='tipline';e.setAttribute('role','status');e.hidden=true}return e}
function tipHide(){const e=$('tipLine');if(e){e.hidden=true;e.remove()}tipK='';clearTimeout(tipT)}
// 操作ボタンの列（横向きは右下の列）の、いちばん上に1行で入れる。列が伸びるぶんは keepMine が手札を上へ送る
const tipBar=()=>[$('controls'),$('between')].find(b=>b&&!b.hidden&&b.getClientRects().length);
function tipPlace(){const e=$('tipLine');if(!e||e.hidden)return;const bar=tipBar();if(!bar||$('game').hidden||e.parentNode!==bar)tipHide()}
function tipWant(){const me=S.players[0];if(!me||!me.human)return'';
  if(!S.handOver&&!S.autoMe){
    if(S.toAct===0&&raiseOpen&&!$('raisePanel').hidden&&!tipSeen('raise'))return'raise';
    if(SETTINGS.peek&&me.hand&&me.hand.length===2&&!me.peeked&&!me.folded&&!tipSeen('hold'))return'hold';
    if(S.toAct===0&&!$('controls').hidden&&!tipSeen('act'))return'act';
    if(S.board.length>=3&&!tipSeen('board'))return'board'}
  if(S.handOver&&S.handNo>0&&me.won>0&&!tipSeen('pot'))return'pot';
  return''}
function tipShow(k){const bar=tipBar();if(!bar)return;tipMark(k);tipK=k;tipAt=performance.now();const e=tipEl();e.textContent=TIPS[k];bar.insertBefore(e,bar.firstChild);e.hidden=false;
  try{requestAnimationFrame(keepMine)}catch(x){}
  const jin=$('sensei')&&!$('sensei').hidden&&($('senseiText').textContent||'').trim(),ms=jin?1500:3000;if(jin)senseiWait(ms);
  clearTimeout(tipT);tipT=setTimeout(tipHide,ms)}
function tipTick(){try{
  if(tipK){tipPlace();return}
  if(typeof S==='undefined'||!S||!S.players||typeof CFG==='undefined'||!CFG||CFG.flashback||$('game').hidden||tourI>=0)return;
  if(['vs','quiz','help','setPanel','runBox','cutin','mieta','tour','stackZoom'].some(id=>$(id)&&!$(id).hidden))return;
  const k=tipWant();if(k)tipShow(k)}catch(e){}}
setInterval(tipTick,250);
document.addEventListener('pointerdown',()=>{if(tipK&&performance.now()-tipAt>250)tipHide()},true);
addEventListener('resize',()=>{if(tipK)tipPlace()});

// ---------- S3：続きから（shisho-resume） ----------
// 山札・手札・場のカードは残さない。ハンドの途中で落ちたら、そのハンドの開始時のチップから配り直す
const RESUME_KEY='shisho-resume';
const RS_SKIP=['players','deck','board','board2','twiceBase','hl','potPile','review','result','handOver','toAct','street','msg','currentBet','minRaise','raises','aggr',
  'ask','bAsk','bReact','readShow','mietaNow','foldRead','hold','jinNote','quitOk','reviewShown','p2alt','altEnd','ltSent','keptHand','myTurnKey','myTurnAt','wfxHand','wfxT','bbEq'];
function rsKind(){if(typeof CFG==='undefined'||!CFG||CFG.flashback||CFG.ura||CFG.run||CFG.resumeData)return'';
  if(CFG.ch)return !CFG.ch.p2&&CHAPTERS.includes(CFG.ch)?'ch':'';
  return CFG.goal&&CFG.goal.type==='free'?(CFG.store?'store':'free'):''}
function rsJSON(v){try{const j=JSON.stringify(v);return j!==undefined&&j.length<60000?JSON.parse(j):undefined}catch(e){return undefined}}
function resumeSave(){try{const kind=rsKind();if(!kind||!S||!S.players||S.result||!S.handOver)return;
  const cfg={};Object.keys(CFG).forEach(k=>{if(k==='ch'||k==='onDone'||k==='seats'||k==='resumeData')return;const v=rsJSON(CFG[k]);if(v!==undefined)cfg[k]=v});
  const st={};Object.keys(S).forEach(k=>{if(RS_SKIP.includes(k))return;const v=S[k];if(typeof v==='function')return;const j=rsJSON(v);if(j!==undefined)st[k]=j});
  const P=S.players.map(p=>{const o={styleKey:p.styleKey,label:p.label||'',extra:!!p.extra,human:!!p.human};
    Object.keys(p).forEach(k=>{const v=p[k];if(v===null||['number','string','boolean'].includes(typeof v))o[k]=v});return o});
  localStorage.setItem(RESUME_KEY,JSON.stringify({v:1,at:Date.now(),kind,ch:kind==='ch'?CFG.ch.no:0,cfg,S:st,P}))}catch(e){}}
function resumeClear(){try{localStorage.removeItem(RESUME_KEY)}catch(e){}}
function resumeLoad(){try{const R=JSON.parse(localStorage.getItem(RESUME_KEY));
  if(!R||typeof R!=='object'||R.v!==1||!Array.isArray(R.P)||R.P.length<2||!R.P[0]||!R.P[0].human||!R.S||typeof R.S!=='object'||!(+R.S.handNo>=0)||!R.cfg||typeof R.cfg!=='object')return null;
  if(R.P.some(p=>!p||typeof p.name!=='string'||!(+p.chips>=0))||!(+R.P[0].chips>0))return null;
  if(R.kind==='ch'){const c=CHAPTERS[(+R.ch)-1];if(!c||c.no!==+R.ch||c.no>loadCleared()+1)return null}
  else if(R.kind!=='free'&&R.kind!=='store')return null;
  return R}catch(e){return null}}
function resumeLabel(R){const h=(+R.S.handNo||0)+1;return R.kind==='ch'?`続きから（第${R.ch}章・${h}ハンド目）`:`続きから（フリー対戦・${h}ハンド目）`}
function resumeGo(R){
  const cfg=Object.assign({},R.cfg,{ch:R.kind==='ch'?CHAPTERS[R.ch-1]:null,nanori:false,resumeData:R,
    seats:R.P.map(p=>({name:p.name,style:p.styleKey||'normal',chips:+p.chips||0,human:!!p.human,label:p.label||'',extra:!!p.extra}))});
  try{startGame(cfg)}catch(e){resumeClear();show('title')}}
// VS・席選び・名乗りを出さずに、保存したチップと状態を戻して次のハンドを配る
function resumeApply(R){
  S.players.forEach((p,i)=>{const q=R.P[i];if(!q||q.name!==p.name)return;Object.keys(q).forEach(k=>{if(k==='styleKey'||k==='human'||k==='name')return;p[k]=q[k]})});
  Object.keys(R.S).forEach(k=>{S[k]=R.S[k]});S.handOver=true;S.result=null;S.toAct=-1;
  if(S.stat==null)S.stat=newStat();
  log('前回の続きから');try{$('goal').dataset.k='';renderGoal()}catch(e){}render();
  const bt=pendingBeat();if(bt)return playScene(CFG.ch,bt.lines,()=>{show('game');Sound.bgm(CFG.bgm||0);render();startHand()});
  startHand()}
{const o=showVersus;showVersus=function(done){if(typeof CFG!=='undefined'&&CFG&&CFG.resumeData){const R=CFG.resumeData;delete CFG.resumeData;$('vs').hidden=true;return resumeApply(R)}return o.apply(this,arguments)}}
// 別の勝負を始めたら消す（回想は第7章の会話の中なので消さない）
{const o=startGame;startGame=function(cfg){if(!(cfg&&(cfg.resumeData||cfg.flashback)))resumeClear();const r=o.apply(this,arguments);
  try{$('logBox').hidden=loadCleared()<1;tipHide()}catch(e){}return r}}
{const o=startChapter;startChapter=function(){resumeClear();return o.apply(this,arguments)}}
// 保存：ハンドの開始時（前のハンドの終わりの状態＝そのハンドの開始時のチップ）と、ハンドが終わったとき
{const o=startHand;startHand=function(){try{if(S&&S.players&&S.handOver&&!S.result)resumeSave()}catch(e){}return o.apply(this,arguments)}}
document.addEventListener('visibilitychange',()=>{try{if(document.hidden&&S&&S.players&&S.handOver&&!S.result&&!$('game').hidden)resumeSave()}catch(e){}});
// 「やめる」で確かめて抜けたら消す
{const o=$('btnQuit').onclick;$('btnQuit').onclick=function(){const r=o.apply(this,arguments);
  try{if(S&&S.quitOk&&!S.quitDone){S.quitDone=true;resumeClear();if(typeof CFG!=='undefined'&&CFG&&!CFG.flashback)statBump('quit',CFG.ch?CFG.ch.no:CFG.store?'store':'free')}}catch(e){}return r}}

// ---------- A2：タイトル ----------
function titleRefresh(){try{const R=resumeLoad(),b=$('btnStory');b.textContent=R?resumeLabel(R):'ストーリー';$('tPick').hidden=!R;
  $('btnDaily').hidden=loadCleared()<1;$('btnRun').hidden=loadCleared()<7}catch(e){}}
{const o=show;show=function(id){const r=o.apply(this,arguments);if(id==='title'){titleRefresh();if($('freeSetup'))$('freeSetup').hidden=true}if(id!=='game')tipHide();return r}}
$('btnStory').onclick=()=>{const R=resumeLoad();if(R)return resumeGo(R);if(!loadCleared())return startChapter(CHAPTERS[0]);showChapters()};
$('btnPick').onclick=()=>showChapters();
// フリー対戦：押したあとの小さな画面で設定する（前回の設定を覚えておく）
function freeApply(){const f=SETTINGS.free;if(!f||typeof f!=='object')return;try{
  if([...$('freeRule').options].some(o=>o.value===f.rule))$('freeRule').value=f.rule;if(f.size==='4'||f.size==='6')$('freeSize').value=f.size;$('freeRude').checked=!!f.rude}catch(e){}}
freeApply();
$('btnFree').onclick=()=>{freeApply();$('freeSetup').hidden=false;$('btnFreeGo').focus({preventScroll:true})};
$('btnFreeGo').onclick=()=>{SETTINGS.free={rule:$('freeRule').value,size:$('freeSize').value,rude:!!$('freeRude').checked};saveSettings();$('freeSetup').hidden=true;startFree()};
$('btnFreeBack').onclick=()=>{$('freeSetup').hidden=true;$('btnFree').focus({preventScroll:true})};
$('freeSetup').addEventListener('click',e=>{if(e.target.id==='freeSetup')$('freeSetup').hidden=true});
addEventListener('keydown',e=>{if(e.key==='Escape'&&$('freeSetup')&&!$('freeSetup').hidden){e.preventDefault();$('freeSetup').hidden=true}});
{const o=window.LT_back;window.LT_back=()=>{if($('freeSetup')&&!$('freeSetup').hidden){$('freeSetup').hidden=true;return true}return o()}}
$('btnHow').onclick=()=>showHelp('flow');
// 注意書き：閉じたら最初のボタンへ（今までどおり初回だけ）
titleRefresh();

// ---------- A1：段階的に見せる ----------
// ベット額の候補（2.5BB など）は第1章の3ハンド目から
function quickHide(){return !!(typeof CFG!=='undefined'&&CFG&&CFG.ch&&CFG.ch.no===1&&!CFG.ch.p2&&!CFG.ura&&S&&S.handNo<=2)}
// 設定：よく使うもの（音・手札・オールイン確認）だけ出し、残りは「くわしい設定」に畳む。呼び名は第1章クリア後に出す
{const box=$('setIn');if(box){
  const det=document.createElement('details');det.className='setmore';det.innerHTML='<summary>くわしい設定</summary>';
  const keep=['btnSound','btnPeek','btnAllin'];
  [...box.querySelectorAll('.setrow')].forEach(r=>{const b=r.querySelector('button');if(b&&!keep.includes(b.id))det.appendChild(r)});
  const nr=document.createElement('div');nr.className='setrow nickrow';nr.id='nickRow';const nl=$('nick')&&$('nick').closest('label');if(nl){nl.classList.remove('rulepick');nr.appendChild(nl)}
  box.appendChild(nr);box.appendChild(det);const h=$('nickHold');if(h)h.remove()}}
function setRefresh(){try{$('nickRow').hidden=loadCleared()<1}catch(e){}}
{const o=$('btnSet').onclick;$('btnSet').onclick=function(){setRefresh();return o.apply(this,arguments)}}
{const o=$('mSet').onclick;$('mSet').onclick=function(){setRefresh();return o.apply(this,arguments)}}
setRefresh();

// ---------- A6：第5章のバッドビートのあと、ターンの時点の勝率を1行出す ----------
function eqAtTurn(live){const b4=S.board.slice(0,4),known=live.flatMap(p=>p.hand).concat(b4),same=(a,c)=>a.r===c.r&&a.s===c.s;
  const rest=fullDeck().filter(c=>!known.some(k=>same(k,c)));let w=0,n=0;
  rest.forEach(c=>{const b=b4.concat([c]),sc=live.map(p=>bestN(p.hand.concat(b)));let top=sc[0];sc.forEach(x=>{if(cmp(x,top)>0)top=x});
    const ws=sc.map((x,k)=>cmp(x,top)===0?k:-1).filter(k=>k>=0);if(ws.includes(0))w+=1/ws.length;n++});
  return n?Math.round(w/n*100):0}
{const o=render;render=function(){const r=o.apply(this,arguments);
  try{if(S&&S.bbEq&&S.bbEq.hand===S.handNo&&S.handOver&&!S.result){const h=$('betweenHint');if(h)h.textContent=`ターンの時点で、あなたの勝率は約${S.bbEq.v}%でした。`}}catch(e){}
  return r}}

// ---------- A5：「見えた」を一番気持ちよく ----------
// 周りを0.3秒だけ暗くし、相手の顔と頭の上のクセだけ明るく残す。低い1音と短い振動。第7章の本物のクセ（big）には触れない
{const o=mieta;mieta=function(name,cue,big){const r=o.apply(this,arguments);
  try{if(!big){const el=$('mieta'),rm=reducedMotion();
    if(!rm){const i=S.players.findIndex(p=>p.name===name),bu=i>0&&$('bust'+i),br=bu&&bu.getBoundingClientRect();
      if(br&&br.width){const sp=document.createElement('div');sp.className='mspot';sp.setAttribute('aria-hidden','true');
        const cx=br.left+br.width/2,cy=br.top+br.height*.38,R=Math.max(64,Math.min(br.width*.62,170));
        sp.style.background=`radial-gradient(circle at ${cx.toFixed(0)}px ${cy.toFixed(0)}px,transparent 0,transparent ${R.toFixed(0)}px,rgba(0,0,0,.82) ${(R*1.45).toFixed(0)}px)`;
        document.body.appendChild(sp);setTimeout(()=>sp.remove(),520);
        el.classList.add('mwait');setTimeout(()=>{el.classList.remove('mwait','go');void el.offsetWidth;el.classList.add('go')},300);
        clearTimeout(mieta.t);mieta.t=setTimeout(()=>{el.hidden=true},300+1500)}}
    try{Sound.low&&Sound.low()}catch(e){}
    if(SETTINGS.vib!==false&&navigator.vibrate)try{navigator.vibrate(15)}catch(e){}
    senseiWait((rm?1050:1800));
    // 第4章で初めて当てたときだけ、ジンの一言（「見えた」のあとに出る）
    if(typeof CFG!=='undefined'&&CFG&&CFG.ch&&CFG.ch.no===4&&!CFG.ch.p2&&!CFG.ura&&!guideGet().m4){guideSet({m4:1});jinNote('……見えたな',1);render()}}}catch(e){}
  return r}}

// ---------- B1：やめた場所が分かる最小限の記録（端末の中だけ。外には送らない。引き継ぎコードに入る） ----------
const STATS_KEY='shisho-stats';
function statBump(f,k,n){try{let o=JSON.parse(localStorage.getItem(STATS_KEY));if(!o||typeof o!=='object'||Array.isArray(o))o={};
  if(!o.firstPlay)o.firstPlay=new Date().toISOString();const m=o[f]&&typeof o[f]==='object'&&!Array.isArray(o[f])?o[f]:{};m[k]=(+m[k]||0)+(n||1);o[f]=m;
  localStorage.setItem(STATS_KEY,JSON.stringify(Object.assign(o,{v:1})))}catch(e){}}
{const o=ltTrack;ltTrack=function(ev,p){try{const c=p&&p.ch;if(c){if(ev==='chapter_start')statBump('chStart',c);else if(ev==='chapter_clear')statBump('chWin',c);else if(ev==='game_over')statBump('chLose',c)}}catch(e){}return o.apply(this,arguments)}}

// ハンドの終わり：続きからの保存（勝ち負けが決まったら消す）・A6 の勝率・B1 のハンド数
{const o=endHand;endHand=function(){const r=o.apply(this,arguments);
  try{if(S&&S.players){
    if(S.result==='win'||S.result==='lose')resumeClear();else if(!S.result)resumeSave();
    if(CFG.ch&&CFG.ch.script==='badbeat'&&!CFG.ch.p2&&S.handNo===1&&!S.bbEq&&S.board.length===5){const me=S.players[0],live=S.players.filter(inHand);
      if(live.includes(me)&&live.length>=2&&!(me.won>0)){S.bbEq={hand:S.handNo,v:eqAtTurn(live)};senseiWait(2200);render()}}
    if(CFG.ch&&!CFG.ura&&!CFG.run&&!CFG.flashback)statBump('hands',CFG.ch.no)}}catch(e){}
  return r}}

// ---------- B4：読みやすさ（その他 → 設定 → くわしい設定。初期値は今の見た目） ----------
function b4Apply(){const d=document.documentElement;d.classList.toggle('fbig',SETTINGS.font==='big');d.classList.toggle('c4',!!SETTINGS.c4)}
{const det=document.querySelector('#setIn .setmore');if(det){
  const row=(id,name,desc)=>{const r=document.createElement('div');r.className='setrow';r.innerHTML=`<div><b>${name}</b><p>${desc}</p></div><button id="${id}" class="mini"></button>`;det.appendChild(r)};
  row('btnFont','文字の大きさ','会話・ボタン・名札の文字を大きくします');row('btnC4','4色のトランプ','♠黒・♥赤・♦青・♣緑で表示します');row('btnVib','振動','スマホで、自分の番や「見えた」のときに短く振動します');
  const lab=()=>{$('btnFont').textContent=SETTINGS.font==='big'?'文字：大':'文字：標準';$('btnC4').textContent=SETTINGS.c4?'4色：オン':'4色：オフ';$('btnVib').textContent=SETTINGS.vib===false?'振動：オフ':'振動：オン'};
  $('btnFont').onclick=()=>{SETTINGS.font=SETTINGS.font==='big'?'':'big';saveSettings();b4Apply();lab();try{if(S&&S.players&&!$('game').hidden)render()}catch(e){}};
  $('btnC4').onclick=()=>{SETTINGS.c4=!SETTINGS.c4;saveSettings();b4Apply();lab()};
  $('btnVib').onclick=()=>{SETTINGS.vib=SETTINGS.vib===false;saveSettings();lab()};lab()}}
b4Apply();
// 振動オフのときは、どこから呼ばれても振動しない
try{if(navigator.vibrate){const v=navigator.vibrate.bind(navigator);navigator.vibrate=function(p){return SETTINGS.vib===false?false:v(p)}}}catch(e){}
'''
JS=JS.replace('__TIPS__',json.dumps({k:v[0] for k,v in TIPS.items()},ensure_ascii=False))
rep("{const o=render;render=function(){const r=o.apply(this,arguments);try{winFx()}catch(e){}return r}}\n",
    "{const o=render;render=function(){const r=o.apply(this,arguments);try{winFx()}catch(e){}return r}}\n"+JS)

CSS=r'''
/* ===== patch49：プロ目線の改善 ===== */
/* A2 タイトル：ロゴとボタンを先に。注意書きはボタンの下で一段小さく */
#title .tacts{display:grid;gap:10px;justify-items:start}
#title .tacts .row{gap:8px}
#title .tmain button{min-width:12em;font-size:1.05rem;padding-block:12px}
#title .tsub button.tsm{font-size:.8rem;padding:8px 12px}
#title .tpick{margin-top:-4px}
#title .tsub button.tsm.newdot{padding-right:20px}
#title .tsub button.tsm.newdot::after{top:4px;right:4px}
@media (max-height:500px) and (orientation:landscape){#title{padding-block:10px 4px}#title .logo{gap:8px}#title .logo h1{font-size:2.3rem}#title .logo>p{display:none}#title .logo .subtitle{margin:0}}
#betweenHint{text-wrap:balance;word-break:auto-phrase}
.tauntbox{flex-wrap:wrap}.tauntbox span,.tauntbox button{white-space:nowrap}
#title .tlink{background:none;border:0;box-shadow:none;color:var(--muted);font-size:.82rem;text-decoration:underline;text-underline-offset:3px;padding:2px 4px;cursor:pointer}
#title .tlink:hover{color:var(--ink)}
#title .logo .fnotice{margin:4px 0 0;font-size:.72rem;line-height:1.6;padding:8px 10px}
#title .logo .fnotice button{font-size:.75rem}
#title .logo .fnotice p{border:0;padding:0;max-width:none;line-height:1.6;color:inherit}
.fsetup .mdlgin{gap:4px}
.fsetup .rulepick{margin-top:8px;font-size:.88rem;opacity:1;flex-wrap:wrap}
.fsetup .mbtns{margin-top:12px}
/* A1 設定：くわしい設定・呼び名 */
.setmore{border-top:1px solid #ffffff14;padding-top:6px}
.setmore summary{cursor:pointer;font-size:.88rem;font-weight:700;padding:6px 0;color:var(--muted)}
.setmore[open] summary{color:var(--ink)}
.nickrow{display:block}
.nickrow label{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:.85rem}
/* S2 その場の1行の案内 */
.tipline{box-sizing:border-box;padding:7px 12px;margin:0;background:rgba(12,13,18,.94);border:1px solid rgba(226,182,91,.6);border-left:3px solid var(--gold);
  color:var(--ink);font-size:.84rem;line-height:1.5;font-weight:700;pointer-events:none;box-shadow:0 4px 14px rgba(0,0,0,.5);text-wrap:balance;word-break:auto-phrase;animation:tipIn .25s ease-out}
@keyframes tipIn{from{opacity:0;translate:0 6px}to{opacity:1;translate:0 0}}
.sensei.mwait{visibility:hidden}
/* A5 見えた：周りを暗くするスポットライト */
.mspot{position:fixed;inset:0;z-index:59;pointer-events:none;animation:mspot .5s ease-out forwards}
@keyframes mspot{0%{opacity:0}15%{opacity:1}60%{opacity:1}100%{opacity:0}}
.mieta.mwait{visibility:hidden}
/* B4 文字の大きさ・4色のトランプ */
html.fbig #box .line,html.fbig #box .nametag,html.fbig #box .lesson p{font-size:1.15em}
html.fbig #game .acts button.act b{font-size:1.15em}
html.fbig #plates .plate{font-size:1.15em}
html.fbig #senseiText{font-size:1.15em}
html.c4 .card[aria-label^="♦"],html.c4 .card[aria-label^="♦"] *{color:#2f7de1!important}
html.c4 .card[aria-label^="♣"],html.c4 .card[aria-label^="♣"] *{color:#1d8a45!important}
@media (prefers-reduced-motion:reduce){.tipline{animation:none}.mspot{display:none}}
'''
rep("</style>",CSS+"</style>")

rep('const EN_DICT={','const EN_DICT='+json.dumps(EN,ensure_ascii=False)[:-1]+',')
rep('const EN_TPL=[','const EN_TPL='+json.dumps(TP,ensure_ascii=False)[:-1]+',')
open(OUT,'w').write(s);print('ok',len(EN),len(TP))
