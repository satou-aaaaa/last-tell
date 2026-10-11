import sys,json
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC,encoding='utf-8').read()
def rep(a,b,cnt=1):
    global s
    assert s.count(a)==cnt,(a[:60],s.count(a));s=s.replace(a,b)
# チュートリアル（research/チュートリアルの要否.md、satou「入れる」2026-10-10）：
# 1) その場の1行の案内に check・showdown・allin・chop を足す  2) ストーリーを初めて始めるときだけ「ポーカーは初めて？」と聞く
#    はじめて → 案内を全部出し、第1章の最初のハンドのあとで役の一覧を1回開く／ある → hold と raise だけ。くわしい設定でオン・オフ（shisho-guide.novice）
NEW={"check":"誰も賭けていないので、払わずに次へ進めます（チェック）",
     "showdown":"7枚のうち一番強い5枚で比べます。光った5枚が勝った役です",
     "allin":"持ち点を全部賭けました。足りない分は、その人には払われません",
     "chop":"同じ強さなので、ポットを分けます"}
EN={NEW['check']:"No one has bet, so you can move on without paying (check).",
    NEW['showdown']:"The best 5 of the 7 cards are compared. The glowing 5 are the winning hand.",
    NEW['allin']:"They bet everything. They can't win more than they put in from each player.",
    NEW['chop']:"The hands are equal, so the pot is split.",
    'ポーカーを遊んだことは？':'Have you played poker before?','ある':'Yes','はじめて':'First time',
    '初めての人向けの案内':'Tips for beginners','ルールの1行の案内を、初めての場面ごとに出します':'Shows a one-line tip the first time each situation comes up.',
    '案内：オン':'Tips: on','案内：オフ':'Tips: off','あとで設定（くわしい設定）から変えられます':'You can change this later in More settings.'}
rep('const TIPS={"hold"','const TIPS={'+json.dumps(NEW,ensure_ascii=False)[1:-1]+',"hold"')
rep("function tipWant(){const me=S.players[0];if(!me||!me.human)return'';\n  if(!S.handOver&&!S.autoMe){",
    "const novice=()=>guideGet().novice!==false;\n"
    "function tipWant(){const me=S.players[0];if(!me||!me.human)return'';const nv=novice();\n"
    "  if(nv&&!S.handOver&&!tipSeen('allin')&&S.players.some(p=>!p.out&&!p.folded&&p.chips===0&&(p.total||p.bet)>0))return'allin';\n"
    "  if(nv&&S.handOver&&S.handNo>0&&S.players.filter(p=>p.won>0).length>=2&&!tipSeen('chop'))return'chop';\n"
    "  if(nv&&S.handOver&&S.handNo>0&&S.players.some(p=>!p.human&&p.show&&!p.folded)&&!tipSeen('showdown'))return'showdown';\n"
    "  if(!S.handOver&&!S.autoMe&&!nv){if(S.toAct===0&&raiseOpen&&!$('raisePanel').hidden&&!tipSeen('raise'))return'raise';\n"
    "    if(peekOn()&&me.hand&&me.hand.length===2&&!me.peeked&&!me.folded&&!tipSeen('hold'))return'hold';return''}\n"
    "  if(nv&&!S.handOver&&!S.autoMe&&S.toAct===0&&!$('controls').hidden&&me.bet>=S.currentBet&&!tipSeen('check')&&tipSeen('act'))return'check';\n"
    "  if(!nv&&S.handOver)return'';\n"
    "  if(!S.handOver&&!S.autoMe){")
JS=r"""
// はじめての人：第1章の最初のハンドが終わったら、役の一覧を1回だけ開く
setInterval(()=>{try{if(typeof S==='undefined'||!S||!S.players||!S.handOver||S.handNo<1||$('game').hidden)return;
  if(typeof CFG==='undefined'||!CFG||!CFG.ch||CFG.ch.no!==1||CFG.ch.p2||CFG.flashback)return;const g=guideGet();if(g.novice!==true||g.handsShown)return;
  if(['vs','quiz','help','setPanel','cutin','mieta','tour'].some(id=>$(id)&&!$(id).hidden))return;guideSet({handsShown:1});showHelp('hands')}catch(e){}},600);
// 「ポーカーは初めて？」：タイトルの「ストーリー」から初めて始めるときだけ（1回だけ聞く）
function askNovice(go){if(guideGet().novice!==undefined)return go();
  let d=$('novDlg');if(!d){d=document.createElement('div');d.id='novDlg';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');
    d.innerHTML=`<div class="novbox"><b>ポーカーを遊んだことは？</b><div class="novbtns"><button class="primary" id="nvNew">はじめて</button><button class="ghost" id="nvYes">ある</button></div><p>あとで設定（くわしい設定）から変えられます</p></div>`;document.body.appendChild(d)}
  d.hidden=false;const done=v=>{guideSet({novice:v});d.hidden=true;try{novLab()}catch(e){}go()};$('nvNew').onclick=()=>done(true);$('nvYes').onclick=()=>done(false);setTimeout(()=>$('nvNew').focus({preventScroll:true}),0)}
{const det=document.querySelector('#setIn .setmore');if(det){const r=document.createElement('div');r.className='setrow';
  r.innerHTML=`<div><b>初めての人向けの案内</b><p>ルールの1行の案内を、初めての場面ごとに出します</p></div><button id="btnNovice" class="mini"></button>`;det.appendChild(r);
  $('btnNovice').onclick=()=>{guideSet({novice:!novice()});novLab()};novLab()}}
function novLab(){const b=$('btnNovice');if(b)b.textContent=novice()?'案内：オン':'案内：オフ'}
"""
rep("addEventListener('resize',()=>{if(tipK)tipPlace()});","addEventListener('resize',()=>{if(tipK)tipPlace()});"+JS)
rep("if(!loadCleared())return startChapter(CHAPTERS[0]);showChapters()};","if(!loadCleared())return askNovice(()=>startChapter(CHAPTERS[0]));showChapters()};")
rep("</style>","#novDlg{position:fixed;inset:0;z-index:80;display:grid;place-items:center;background:rgba(5,6,10,.72);padding:16px}#novDlg[hidden]{display:none}\n#novDlg .novbox{background:#14161d;border:1px solid #ffffff22;border-left:3px solid var(--gold);padding:18px 20px;max-width:340px;width:100%;display:grid;gap:12px}\n#novDlg .novbtns{display:flex;gap:10px;flex-wrap:wrap}#novDlg p{margin:0;font-size:.78rem;color:var(--muted)}\n</style>")
rep('const EN_DICT={','const EN_DICT={'+json.dumps(EN,ensure_ascii=False)[1:-1]+',')
open(OUT,'w',encoding='utf-8').write(s)
print('ok')
