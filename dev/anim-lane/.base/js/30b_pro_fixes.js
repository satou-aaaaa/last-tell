
// =====================================================================
// プロ目線の改善（patch49）
//   S1 beats／S2 その場の1行の案内／S3 続きから（shisho-resume）／A2 タイトル／A1 段階的に見せる／A6 バッドビートの勝率／A5 見えた
//   B1 やめた場所の記録（shisho-stats、端末の中だけ）／B4 文字の大きさ・4色・振動
// =====================================================================

// ---------- S1：章の合間の場面（beats） ----------
// 流した beat は章ごとに shisho-story の bt:{章:[after,…]} に覚える。負けてやり直し（startChapter(ch,true)）でも、
// まだ流していない beat は流し、流したものは最初から済み（CFG.beatPre）にする。章の一覧から始めると覚えた分を消して全部流す
function beatSeen(no){const t=saveGet(STORY_KEY,{}),b=t&&t.bt&&typeof t.bt==='object'?t.bt[no]:null;return Array.isArray(b)?b.map(Number).filter(x=>x>0):[]}
function beatSeenSet(no,list){const t=saveGet(STORY_KEY,{}),o=t&&typeof t==='object'&&!Array.isArray(t)?t:{},bt=o.bt&&typeof o.bt==='object'&&!Array.isArray(o.bt)?o.bt:{};
  if(list.length)bt[no]=list;else delete bt[no];o.bt=bt;saveSet(STORY_KEY,o,1)}
function beatDoneMap(){if(S.beatDone&&typeof S.beatDone==='object')return S.beatDone;const d={};(Array.isArray(CFG.beatPre)?CFG.beatPre:[]).forEach(a=>{d[a]=1});return S.beatDone=d}
function beatMark(bs){const d=beatDoneMap();bs.forEach(b=>{d[b.after]=1});
  if(bs.length&&!CFG.ch.p2&&!CFG.ura&&CHAPTERS[CFG.ch.no-1]&&CHAPTERS[CFG.ch.no-1].beats===CFG.ch.beats){const s=beatSeen(CFG.ch.no);bs.forEach(b=>{if(!s.includes(b.after))s.push(b.after)});beatSeenSet(CFG.ch.no,s)}}
// pendingBeat：今のハンド数までで、まだ流していない beat の行をまとめて返す（流したことにする）
function pendingBeat(){
  if(typeof CFG==='undefined'||!CFG||!CFG.ch||!CFG.ch.beats||!CFG.beatsOn||!S||!S.players||S.result)return null;
  const d=beatDoneMap(),bs=CFG.ch.beats.filter(b=>b.after<=S.handNo&&!d[b.after]);
  if(!bs.length)return null;beatMark(bs);return{lines:[].concat(...bs.map(b=>b.lines))}}
// beatRest：章が beat を流す前に勝って終わったとき、残りの行（outro の頭に足す）
function beatRest(){
  if(typeof CFG==='undefined'||!CFG||!CFG.ch||!CFG.ch.beats||!CFG.beatsOn||!S)return[];
  const d=beatDoneMap(),bs=CFG.ch.beats.filter(b=>!d[b.after]);
  beatMark(bs);return[].concat(...bs.map(b=>b.lines))}
// 初めての第1章の扉の自動送りは 18_scene.js の doorAuto（v83 で1本にまとめた）

// ---------- S2：その場で1行の案内 ----------
function guideGet(){try{const o=JSON.parse(localStorage.getItem(HELP_KEY));return o&&typeof o==='object'&&!Array.isArray(o)?o:{}}catch(e){return{}}}
function guideSet(p){try{localStorage.setItem(HELP_KEY,JSON.stringify(Object.assign(guideGet(),p,{v:1})))}catch(e){}}
const TIPS={"music": "設定で音楽をオンにできます", "check": "今は払う額がないので、そのまま次へ進めます（チェック）", "showdown": "7枚のうち一番強い5枚で比べます。光った5枚が勝った役です", "allin": "持ち点を全部賭けました。足りない分は、その人には払われません", "chop": "同じ強さなので、ポットを分けます","hold": "伏せた2枚をタップすると、自分にだけ見えます", "act": "降りるか、同じ額を払って続けるかを選びます", "raise": "額を選んで、もう一度押すと決まります", "board": "真ん中の3枚は全員が使えるカードです", "pot": "賭けられたチップは、勝った人のものになります"};
function tipSeen(k){const t=guideGet().tips;return !!(t&&typeof t==='object'&&t[k])}
function tipMark(k){const g=guideGet(),t=g.tips&&typeof g.tips==='object'&&!Array.isArray(g.tips)?g.tips:{};t[k]=1;guideSet({tips:t})}
// ジンの助言（や「見えた」）と同時に出さないよう、ジンの欄をしばらく隠す
function senseiWait(ms){const e=$('sensei');if(!e)return;e.classList.add('mwait');clearTimeout(senseiWait.t);senseiWait.t=setTimeout(()=>e.classList.remove('mwait'),ms)}
let tipK='',tipT=0,tipAt=0,tipKeep=false;
function tipEl(){let e=$('tipLine');if(!e){e=document.createElement('div');e.id='tipLine';e.className='tipline';e.setAttribute('role','status');e.hidden=true}return e}
function tipHide(){const e=$('tipLine');if(e){e.hidden=true;e.remove()}if(tipKeep){tipKeep=false;const s=$('sensei');if(s)s.classList.remove('mwait')}tipK='';clearTimeout(tipT)}
// 操作ボタンの列（横向きは右下の列）の、いちばん上に1行で入れる。列が伸びるぶんは keepMine が手札を上へ送る
const tipBar=()=>[$('controls'),$('between')].find(b=>b&&!b.hidden&&b.getClientRects().length);
function tipPlace(){const e=$('tipLine');if(!e||e.hidden)return;const bar=tipBar();if(!bar||$('game').hidden||e.parentNode!==bar)tipHide()}
const novice=()=>guideGet().novice!==false;
function tipWant(){const me=S.players[0];if(!me||!me.human)return'';const nv=novice();
  if(S.handOver&&S.result==='win'&&CFG.ch&&!CFG.ch.p2&&!CFG.ura&&CFG.ch.no===1&&(+SETTINGS.sound||0)<2&&!tipSeen('music'))return'music';
  if(nv&&!S.handOver&&!tipSeen('allin')&&S.players.some(p=>!p.out&&!p.folded&&p.chips===0&&(p.total||p.bet)>0))return'allin';
  if(nv&&S.handOver&&S.handNo>0&&S.players.filter(p=>p.won>0).length>=2&&!tipSeen('chop'))return'chop';
  if(nv&&S.handOver&&S.handNo>0&&S.players.some(p=>!p.human&&p.show&&!p.folded)&&!tipSeen('showdown'))return'showdown';
  if(!S.handOver&&!S.autoMe&&!nv){if(S.toAct===0&&raiseOpen&&!$('raisePanel').hidden&&!tipSeen('raise'))return'raise';
    if(peekOn()&&me.hand&&me.hand.length===2&&!me.peeked&&!me.folded&&!tipSeen('hold'))return'hold';return''}
  if(nv&&!S.handOver&&!S.autoMe&&S.toAct===0&&!$('controls').hidden&&me.bet>=S.currentBet&&!tipSeen('check')&&tipSeen('act'))return'check';
  if(!nv&&S.handOver)return'';
  if(!S.handOver&&!S.autoMe){
    if(S.toAct===0&&raiseOpen&&!$('raisePanel').hidden&&!tipSeen('raise'))return'raise';
    if(peekOn()&&me.hand&&me.hand.length===2&&!me.peeked&&!me.folded&&!tipSeen('hold'))return'hold';
    if(S.toAct===0&&!$('controls').hidden&&!tipSeen('act')){if(me.bet<S.currentBet)return'act';if(!tipSeen('check'))return'check'}
    if(S.board.length>=3&&!tipSeen('board'))return'board'}
  if(S.handOver&&S.handNo>0&&me.won>0&&!tipSeen('pot'))return'pot';
  return''}
function tipShow(k){const bar=tipBar();if(!bar)return;tipMark(k);tipK=k;tipAt=performance.now();const e=tipEl();e.textContent=k==='check'&&I18N.lang!=='en'?TIPS[k].replace('そのまま','そ\u2060の\u2060ま\u2060ま'):TIPS[k];bar.insertBefore(e,bar.firstChild);e.hidden=false;
  try{requestAnimationFrame(keepMine)}catch(x){}
  // v66（レビュー 3）：はじめての人の「act」の案内は、最初に操作ボタンを押すまで出しておく。ジンの助言はそのあと
  // v68（v67 レビュー 3）：最初の判断で払う額が 0 なら「act」ではなく「check」の案内を先に出し、同じように押すまで出しておく
  if((k==='act'||k==='check'&&!tipSeen('act'))&&novice()){tipKeep=true;clearTimeout(tipT);clearTimeout(senseiWait.t);const s=$('sensei');if(s)s.classList.add('mwait');return}
  const jin=$('sensei')&&!$('sensei').hidden&&($('senseiText').textContent||'').trim(),ms=jin?1500:3000;if(jin)senseiWait(ms);
  clearTimeout(tipT);tipT=setTimeout(tipHide,ms)}
function tipTick(){try{
  if(tipK){tipPlace();return}
  if(typeof S==='undefined'||!S||!S.players||typeof CFG==='undefined'||!CFG||CFG.flashback||$('game').hidden||tourI>=0)return;
  if(['vs','quiz','help','setPanel','runBox','cutin','mieta','tour','stackZoom'].some(id=>$(id)&&!$(id).hidden))return;
  const k=tipWant();if(k)tipShow(k)}catch(e){}}
setInterval(tipTick,250);
document.addEventListener('pointerdown',e=>{if(tipK&&performance.now()-tipAt>250&&(!tipKeep||(e.target.closest&&e.target.closest('#controls'))))tipHide()},true);
LT.on('act',i=>{if(i===0&&tipKeep)tipHide()});
addEventListener('resize',()=>{if(tipK)tipPlace()});
// はじめての人：第1章の最初のハンドが終わったら、役の一覧を1回だけ開く
setInterval(()=>{try{if(typeof S==='undefined'||!S||!S.players||!S.handOver||S.handNo<1||$('game').hidden)return;
  if(typeof CFG==='undefined'||!CFG||!CFG.ch||CFG.ch.no!==1||CFG.ch.p2||CFG.flashback)return;const g=guideGet();if(g.novice!==true||g.handsShown)return;
  if(['vs','quiz','help','setPanel','cutin','mieta','tour'].some(id=>$(id)&&!$(id).hidden))return;guideSet({handsShown:1});showHelp('hands')}catch(e){}},600);
// 「ポーカーは初めて？」：タイトルの「ストーリー」から初めて始めるときだけ（1回だけ聞く）
// 改善提案 第5回 §1：最初の注意書き（#firstNotice の文をそのまま）も、この箱の上に一緒に出す。only=true は注意書きだけ（フリー対戦などから始める人）
function askNovice(go,only){const seen=!!SETTINGS.seenNotice,ask=!only&&guideGet().novice===undefined;if(!ask&&seen)return go();
  let d=$('novDlg');if(!d){d=document.createElement('div');d.id='novDlg';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');
    d.innerHTML=`<div class="novbox"><p class="novnote" id="nvNote"></p><b id="nvQ">ポーカーを遊んだことは？</b><div class="novbtns"><button class="primary" id="nvNew">はじめて</button><button class="ghost" id="nvYes">ある</button><button class="primary" id="nvOk">閉じる</button></div><p id="nvSub">あとで設定（くわしい設定）から変えられます</p></div>`;document.body.appendChild(d)}
  $('nvNote').textContent=$('firstNotice').querySelector('p').textContent;$('nvNote').hidden=seen;
  ['nvQ','nvNew','nvYes','nvSub'].forEach(id=>$(id).hidden=!ask);$('nvOk').hidden=ask;
  d.hidden=false;const done=v=>{if(v!==undefined)guideSet({novice:v});if(!SETTINGS.seenNotice){SETTINGS.seenNotice=true;saveSettings()}d.hidden=true;try{novLab()}catch(e){}go()};
  $('nvNew').onclick=()=>done(true);$('nvYes').onclick=()=>done(false);$('nvOk').onclick=()=>done();setTimeout(()=>$(ask?'nvNew':'nvOk').focus({preventScroll:true}),0)}
// ストーリー以外（フリー対戦・今日の1ハンド・はしご）から始める人にも、始める前に注意書きを1回だけ
document.addEventListener('click',e=>{if(SETTINGS.seenNotice)return;const b=e.target.closest&&e.target.closest('#btnFree,#btnDaily,#btnRun');if(!b)return;
  e.stopPropagation();e.preventDefault();askNovice(()=>b.click(),true)},true);
{const det=document.querySelector('#setIn .setmore');if(det){const r=document.createElement('div');r.className='setrow';
  r.innerHTML=`<div><b>初めての人向けの案内</b><p>ルールの1行の案内を、初めての場面ごとに出します</p></div><button id="btnNovice" class="mini"></button>`;det.appendChild(r);
  $('btnNovice').onclick=()=>{guideSet({novice:!novice()});novLab()};novLab()}}
function novLab(){const b=$('btnNovice');if(b)b.textContent=novice()?'案内：オン':'案内：オフ'}


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
const RECAP={"1": "錨亭だ。ゲンは何にでも入ってくる。強い手のときだけ戦え", "2": "ロクの店、銀の扉だ。盗むのは後ろの席から。あと{left}回だ", "3": "月影で、セキと打っている。何もない手でも、仕掛けどころはある。あと{left}回だ", "4": "天空の卓だ。レイカは嘘をつく。顔を見て、嘘にだけ払え。あと{left}回だ", "5": "ハヤトの賭場だ。AAで負けて、少ないチップからやり直している。……焦るな", "6": "王冠のトーナメントだ。残りは{left}人。ブラインドは上がり続ける", "7": "……座れ。卒業試験の続きだ", "11": "錨亭だ。タロウがゲンと打っている。強い手だけで戦え", "12": "汐見の舫だ。よその店でも、盗むのは後ろの席から。あと{left}回だ", "13": "地下で、ハヤトの弟子のカイと打っている。急がせるのは向こうだ", "14": "看板持ちのトーナメントだ。残りは{left}人", "15": "……座れ。最後のテルの続きだ"};
function recapLine(R){if(!R||R.kind!=='ch'||!(Date.now()-(+R.at||0)>6*3600e3))return null;const c=CHAPTERS[R.ch-1];const t=c&&RECAP[c.no];if(!t)return null;
  const g=c.goal||{},st=R.S||{},n=g.type==='steal'?st.steals:g.type==='bluff'?st.bluffs:g.type==='readcall'?st.reads:null;
  const left=g.n&&n!=null?Math.max(1,g.n-(+n||0)):R.P.filter(p=>!p.out&&(+p.chips||0)>0).length;
  return[c.p2?mentorName():'ジン',t.replace('{left}',left)]}
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
{const o=showVersus;showVersus=function(done){if(typeof CFG!=='undefined'&&CFG&&CFG.resumeData){const R=CFG.resumeData;delete CFG.resumeData;$('vs').hidden=true;
  const rl=recapLine(R);if(rl){const ch=CFG.ch;return setTimeout(()=>playScene(ch,[rl],()=>{show('game');resumeApply(R)}),0)}return resumeApply(R)}return o.apply(this,arguments)}}
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
$('btnStory').onclick=()=>{const R=resumeLoad();if(R)return resumeGo(R);if(!loadCleared())return askNovice(()=>startChapter(CHAPTERS[0]));showChapters()};
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