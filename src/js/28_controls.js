/* ---------- 操作 ---------- */
const NEEDLES=['その手、本当に強いの？','顔に出てるよ','さっきから考えすぎじゃない？','降りたほうがいいんじゃない？'];
// ===== 揺さぶる（5つのバリエーション） =====
// 案1：言い方を選ぶ。案5：章ごとに言い方が増える。案2：相手の格で効き方が変わる。案3：揺さぶり返される。案4：マナーの悪い客を熱くさせる
const NSTYLE={
  probe:{name:'探る',sub:'口数・口元',ch:4,cues:['talk','smile'],lines:NEEDLES,msg:'相手を探った。しゃべりすぎる相手がいるかもしれない'},
  rush:{name:'急かす',sub:'速さ・汗',ch:5,cues:['fast','sweat'],lines:['まだ？ 時間かかってるね','早くしてよ、朝になっちゃう','迷ってるなら、降りれば？'],msg:'相手を急かした。慌てる相手がいるかもしれない'},
  stare:{name:'黙って見る',sub:'動き・視線',ch:6,cues:['still','stare','glance'],lines:['（何も言わず、じっと相手を見る）'],msg:'黙って相手を見た。視線や動きが変わるかもしれない'},
  night:{name:'あの日のこと',sub:'',ch:7,cues:[],lines:['あの日のこと、覚えてる？'],msg:''}
};
const NTEACH={probe:'探れ。口の軽い奴は、自分からしゃべりすぎる',rush:'急かしてみろ。慌てる奴は、手が先に動く',stare:'黙って見ろ。見られると、目と手が勝手に動く'};
const FAKERS=['レイカ','クロウ'];
const FAKE_LINE={'レイカ':'あら、わたしを揺さぶるの？ ……ふふ','クロウ':'揺さぶりですか。……どうぞ、ご自由に'};
const RUDE_JIN=['……','口で勝とうとするな','それは、ハヤトのやり方だ','……俺は、そういう勝ち方は教えていない'];
function needleLevel(){return CFG.ch?CFG.ch.no:Math.max(4,Math.min(6,loadCleared()+1))}
function needleStyles(){const lv=needleLevel();return Object.keys(NSTYLE).filter(k=>k==='night'?(CFG.ch&&CFG.ch.no===7&&!S.nightAsked&&S.players.some(q=>q.name==='ジン'&&inHand(q))):NSTYLE[k].ch<=lv)}
function needleBoost(p,cue){if(p.name==='タケル'&&S.needleStyle!=='stare')return 0;const st=NSTYLE[S.needleStyle||'probe'];if(!st||!st.cues.includes(cue))return 0;
  const r=rankOf(p.name);return r<=2?.15:r===3?.08:0}
function needledLine(p){const r=rankOf(p.name);
  if(r<=2&&needleBoost(p,(TELLS[p.name]||{}).bluff&&TELLS[p.name].bluff.cue)+needleBoost(p,(TELLS[p.name]||{}).strong&&TELLS[p.name].strong.cue)>0)return pick(['え、ええっ？','な、なんだよ急に！','う、うるさいなあ！'])||lineFor(p.name,'needled');
  return lineFor(p.name,'needled')}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function renderNeedleMenu(open){const m=$('needleMenu'),b=$('btnNeedle');
  if(!open){m.hidden=true;b.setAttribute('aria-expanded','false');return}
  const ks=needleStyles();
  m.innerHTML=ks.map(k=>`<button data-ns="${k}" class="${k==='night'?'night':''}">${NSTYLE[k].name}${NSTYLE[k].sub?`<small>${NSTYLE[k].sub}</small>`:''}</button>`).join('');
  m.hidden=false;b.setAttribute('aria-expanded','true');
  m.querySelectorAll('[data-ns]').forEach(x=>x.onclick=()=>{renderNeedleMenu(false);doNeedle(x.dataset.ns)})}
$('btnNeedle').onclick=()=>{if(S&&S.handOver){chatOpen();return}
  // 案5：その章で新しく増えた言い方を、ジンが一度だけ教える
  if(CFG.ch&&NTEACH[Object.keys(NTEACH).find(k=>NSTYLE[k].ch===CFG.ch.no)]&&!S.needleTaught){S.needleTaught=true;const k=Object.keys(NTEACH).find(k=>NSTYLE[k].ch===CFG.ch.no);jinNote(NTEACH[k],0)}
  renderNeedleMenu($('needleMenu').hidden)};
function doNeedle(style){
  const st=NSTYLE[style];if(!st||S.toAct!==0||S.handOver)return;
  S.needleN=(S.needleN||0)+1;S.needle=S.street;S.needleStyle=style;S.players.forEach(q=>{q.answered=false});
  const line=pick(st.lines);log(style==='stare'?'あなた：（黙って相手を見た）':`あなた：「${line}」`);
  // 案5：第7章、ジンへの特別なひとこと（演出だけ。本物のクセの出方は変えない）
  if(style==='night'){S.nightAsked=true;S.needle=-1;const j=S.players.find(q=>q.name==='ジン');
    if(j)j.say={seq:(S.saySeq=(S.saySeq||0)+1)+5000,act:'',line:'……覚えてるさ。だから今、ここに座ってる'};S.msg='ジンは、少しだけ目を細めた';render();return}
  S.msg=st.msg;
  if(style!=='stare'&&!S.tkJin&&S.players.some(q=>q.name==='タケル'&&inHand(q))){S.tkJin=true;jinNote('あいつには、言葉は効かん。目で勝負しろ',0)}
  // 案3：揺さぶったときの自分の手を、相手が覚える
  const me=S.players[0];if(me&&me.hand&&me.hand.length===2){const opps=S.players.filter(q=>!q.human&&inHand(q)).length||1;
    const eq=equity(me.hand,S.board,opps,120);const m=S.needleMem=S.needleMem||{strong:0,weak:0};
    if(eq>=.6)m.strong++;else if(eq<.4)m.weak++;
    if(m.strong-m.weak>=3&&!S.needleRead){S.needleRead=true;jinNote('揺さぶるのは、強いときばかりだな。相手も、お前を見ているぞ',0)}}
  // 案4：マナーの悪い客を熱くさせる。ただしジンの目は冷たくなる
  const rude=S.players.filter(q=>mannerOf(q)&&inHand(q)&&!q.out);
  if(rude.length){S.rudeNeedle=(S.rudeNeedle||0)+1;
    rude.forEach(q=>{const m=mannerOf(q);if(!(q.tilt>0)&&m.tilt.hands>0&&Math.random()<.35){q.tilt=m.tilt.hands;q.say={seq:(S.saySeq=(S.saySeq||0)+1)+2000,act:'',line:lineFor(q.name,'tilt')};log(`${q.name}が熱くなっている`)}});
    const k=Math.min(RUDE_JIN.length-1,S.rudeNeedle-1);if(S.rudeNeedle===1||S.rudeNeedle===3||S.rudeNeedle===5)jinNote(RUDE_JIN[k],0)}
  render()}
$('btnStraddle').onclick=()=>{myStraddle=!myStraddle;renderControls()};
function renderSpeed(){$('btnSpeed').textContent='演出の速さ：'+(SETTINGS.speed==='fast'?'速い':'ふつう')}
$('btnSound').onclick=()=>{SETTINGS.sound=((+SETTINGS.sound||0)+1)%3;saveSettings();renderSound();if(SETTINGS.sound>=2&&CFG)Sound.bgm(CFG.bgm||0);else Sound.stop()};
renderSound();
$('btnSpeed').onclick=()=>{SETTINGS.speed=SETTINGS.speed==='fast'?'normal':'fast';saveSettings();renderSpeed()};
renderSpeed();
function peekMine(){const me=S&&S.players&&S.players[0];if(!me||me.peeked||!peekOn())return;
  const h=$('mine').querySelector('.hold.squeeze');if(!h)return;
  h.classList.add('lift');setTimeout(()=>{me.peeked=true;me.seen=null;render()},reducedMotion()?0:380*SPEED())}
$('mine').addEventListener('click',e=>{if(e.target.closest('.hold.squeeze'))peekMine()});
$('mine').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('.hold.squeeze')){e.preventDefault();peekMine()}});
/* 奥行き：マウスの位置や端末の傾きで、背景とキャラを別々にずらす */
const Depth=(()=>{
  let tx=0,ty=0,x=0,y=0,raf=0,asked=false,base=null;
  const on=()=>SETTINGS.depth&&!reducedMotion();
  function tick(){
    x+=(tx-x)*.12;y+=(ty-y)*.12;
    // 卓全体の変数を書き換えると全要素のスタイル計算が走って重いので、動かす3つだけに書く
    const t=$('table'),mv=(sel,kx,ky)=>{const el=t.querySelector(sel);if(el)el.style.translate=`${(x*kx).toFixed(1)}px ${(y*ky).toFixed(1)}px`};
    mv('.room',-16,-9);mv('.lamp',-9,-5);mv('.busts',8,3);
    raf=Math.abs(tx-x)+Math.abs(ty-y)>.003?requestAnimationFrame(tick):0;
  }
  function aim(nx,ny){
    if(!on())nx=ny=0;
    tx=Math.max(-1,Math.min(1,nx));ty=Math.max(-1,Math.min(1,ny));
    if(!raf)raf=requestAnimationFrame(tick);
  }
  addEventListener('pointermove',e=>{
    if(e.pointerType!=='mouse')return;
    const r=$('table').getBoundingClientRect();if(!r.width)return;
    aim((e.clientX-r.left)/r.width*2-1,(e.clientY-r.top)/r.height*2-1);
  },{passive:true});
  document.addEventListener('mouseleave',()=>aim(0,0));
  // 傾き：持ち始めの角度を基準にし、持ち方が変わってもゆっくり基準を戻す
  addEventListener('deviceorientation',e=>{
    if(e.gamma==null||e.beta==null)return;
    if(!base)base={b:e.beta,g:e.gamma};
    base.b+=(e.beta-base.b)*.01;base.g+=(e.gamma-base.g)*.01;
    aim((e.gamma-base.g)/18,(e.beta-base.b)/18);
  });
  // iPhone は、タップしたときに傾きの許可を求める必要がある
  function ask(){
    if(asked||!on())return;asked=true;
    const D=window.DeviceOrientationEvent;
    if(D&&typeof D.requestPermission==='function')D.requestPermission().catch(()=>{});
  }
  return{aim,ask,recenter(){base=null}};
})();
function renderDepth(){$('btnDepth').textContent='立体：'+(SETTINGS.depth?'オン':'オフ');document.body.classList.toggle('no-depth',!SETTINGS.depth);if(!SETTINGS.depth)Depth.aim(0,0)}
$('btnDepth').onclick=()=>{SETTINGS.depth=!SETTINGS.depth;saveSettings();renderDepth();Depth.ask()};
const CAM_NAME={strong:'強め',soft:'控えめ',off:'オフ'};
function renderCamBtn(){$('btnCam').textContent='カメラ演出：'+CAM_NAME[camSet()]}
$('btnCam').onclick=()=>{const o=['strong','soft','off'];SETTINGS.cam=o[(o.indexOf(camSet())+1)%3];saveSettings();renderCamBtn();if(S&&S.players)camUpdate(true)};
renderCamBtn();
(function(){const t=$('table'),c=document.createElement('div');c.className='cam';c.id='cam';t.insertBefore(c,$('busts'));c.appendChild($('busts'));c.appendChild(t.querySelector('.felt-wrap'));c.appendChild($('plates'));const L=document.createElement('div');L.className='plates saylayer';L.id='sayLayer';t.insertBefore(L,c.nextSibling)})();
renderDepth();
// ===== 隣の卓の声（案4：ピント送り）。ハンドとハンドの間だけ、6〜8ハンドに1回 =====
const NEXT_VOICES={"1": {"air": ["マスター、もう一杯", "……コール", "グラス、こっちにも頼む"], "cheer": ["オールイン！ ……入ったあ！"], "story": ["カウンターの写真、一枚だけ裏返しなの、なんでだろうな"], "react": {"win": ["おっ、ジンさんの連れてる若いのだ"]}, "big": ["フォーカード！"]}, "2": {"air": ["ディーラー交代です", "カードを新しいのに替えます"], "cheer": ["ナイスハンド！"], "story": ["ロクさん、昔はジンさんと組んでたって本当か？"], "meet": [["ゲン「おーい新入り！こっちの卓にも顔出せよ！」", 1]], "big": ["ストレートフラッシュだ！"]}, "3": {"air": ["（曲の切れ目に、拍手と小さな笑い声）"], "cheer": ["（どよめき）オールインだ！"], "story": ["ミナの歌が止まったら、誰かが勝負に出るんだってさ"], "meet": [["ロク「おや、ここでも会いましたね」", 2], ["ハル「あ、また会いましたね！」", 2]], "react": {"bluff": ["今の、何も無い手で押し切ったのか？"]}, "big": ["ストレートフラッシュだ！"]}, "4": {"air": ["ディーラー交代です", "お飲み物をお持ちしました"], "story": ["ハヤト？ あいつなら今は地下にいるって聞いたぜ"], "meet": [["セキ「……いい顔になったな」", 3], ["ミナ「この店でも、歌えたらいいのに」", 3]], "rumor": [["レイカは汗をかいたら勝負手だってさ", "old", "レイカ"]], "big": ["ロイヤルストレートフラッシュ！"]}, "5": {"air": ["おい、今のイカサマじゃねえのか ……フロア！"], "cheer": [["AAが負けたってよ。かわいそうに", "aa"], "オールイン！ ……入ったあ！"], "rumor": [["ハヤトは絶対にブラフしないって話だぜ", "old", "ハヤト"]], "big": ["殴り合い寸前！ ……フロアが走る"]}, "6": {"air": ["3卓、ブレイクです", "隣の卓で一人飛んだぞ"], "story": ["この大会、今年は人が多いな"], "rumor": [["クロウさん、本当に迷ったときだけ手袋に触るって", "true", "クロウ"]], "big": ["隣の卓、ロイヤルストレートフラッシュ！ ……店じゅうがどよめく"]}, "free": {"air": ["ディーラー交代です", "マスター、もう一杯"], "cheer": ["ナイスハンド！", "オールイン！ ……入ったあ！"], "big": ["フォーカード！"]}};
const NV_REACT={"win": ["今の勝負、向こうの若いのが取ったぞ"], "bluff": ["今の、何も無い手で押し切ったのか？"], "fold": ["あの若いの、ずいぶん我慢してるな"]},NV_SELF={"slow": {"s": "あの新顔、強いときは長く考えるよな", "w": "あの新顔、迷ってるときほど長く考えるな"}, "fast": {"s": "あの新顔、強いときはすぐ動くよな", "w": "あの新顔、手が無いときほど早いよな"}, "big": {"s": "あの新顔、強いときだけ強気に出るよな", "w": "あの新顔、強気に出るときほど怪しいな"}};
const NV={on:false,tok:0,t:0};
function nvLamp(){const L=$('nextLamp');if(L)L.classList.toggle('off',storeNo()===7)}
// その卓で出してよい声の種類（第1〜3章は噂と見抜かれのヒントなし、反応は第2章から）
function nvKinds(){if(storeNo()===7||(CFG.ch&&CFG.ch.p2===5))return[];const c=CFG.ch&&!CFG.ura?CFG.ch.no:99,k=['air','cheer','story','meet','big'];
  if(c>=2)k.push('react');if(c>=4)k.push('rumor');if(c>=5)k.push('self');return k}
function nvBlocked(){
  if(!S||!S.players||$('game').hidden||!S.handOver||S.result||S.reveal||S.finalHand||S.autoMe||CFG.flashback||S.toAct===0)return true;
  if(['toast','quiz','cutin','camBand','mieta','foolStamp'].some(id=>$(id)&&!$(id).hidden))return true;
  if($('dcall').classList.contains('go'))return true;
  const now=performance.now();return [...document.querySelectorAll('#sayLayer .say.go,#plates .say.go')].some(sy=>now-(sy._t||0)<2800)}
function nvMob(p){if(p[0]!=='air')return;const st=storeNo(),h=loadMob();
  const L=Object.keys(MOBS).filter(k=>(!st||MOBS[k].store===st)&&(+h[k]||0)>=10&&!S.players.some(q=>q.name===k));
  if(L.length&&Math.random()<.35){const k=L[Math.floor(Math.random()*L.length)];p[1]=`${k}「${PROFILE[k].ph.replace(/^（メモ）/,'')}」`}}
function nvPick(){
  const V=NEXT_VOICES[storeNo()]||NEXT_VOICES.free,ks=nvKinds();if(!ks.length)return null;
  const used=S.nvUsed=S.nvUsed||[],ok=t=>!used.includes(t),one=a=>a[Math.floor(Math.random()*a.length)];
  const need=n=>n==null||(n==='aa'?!!S.twiceUnlocked:loadCleared()>=n);
  const pool=k=>(V[k]||[]).map(e=>Array.isArray(e)?e:[e]).filter(e=>ok(e[0])&&(k==='rumor'?S.players.some(q=>q.name===e[2]&&!q.out):need(e[1])));
  const me=S.players[0];let R=S.nvRes;if(R==='bluff'&&!(me.show||me.shownByChoice))R=null;
  if(ks.includes('react')&&R){const L=((V.react||{})[R]||[]).concat(NV_REACT[R]||[]).filter(ok);if(L.length&&Math.random()<.6){if(R==='fold')S.nvFoldRun=0;return['react',one(L)]}}
  if(ks.includes('self')&&selfOn()){const m=S.selfMem||{},hon=x=>x&&x.s>=2&&x.w===0?1:x&&x.w>=2&&x.s===0?-1:0;
    const L=['slow','fast','big'].map(k=>{const h=hon(m[k]);return h?NV_SELF[k][h>0?'s':'w']:null}).filter(t=>t&&ok(t));if(L.length&&Math.random()<.5)return['self',one(L)]}
  if(ks.includes('big')&&!S.nvBig&&Math.random()<.2){const L=pool('big');if(L.length)return['big',one(L)[0]]}
  if(ks.includes('rumor')&&Math.random()<.45){const L=pool('rumor');if(L.length){const e=one(L);return['rumor',e[0],e[2]]}}
  const rest=['air','cheer','story','meet'].filter(k=>ks.includes(k)).flatMap(k=>pool(k).map(e=>[k,e[0]]));
  return rest.length?one(rest):null}
function nextvTick(){
  if(!S||!S.players||SETTINGS.nextv===false||!nvKinds().length)return;
  const me=S.players[0],pot=S.players.reduce((a,p)=>a+(p.total||0),0),bl=(S.bluffs||0)>(S.nvBl||0);S.nvBl=S.bluffs||0;
  S.nvFoldRun=me.folded?(S.nvFoldRun||0)+1:0;
  S.nvRes=me.won>0&&pot>=BB()*20?'win':bl?'bluff':S.nvFoldRun>=5?'fold':null;
  if(S.nvNext==null)S.nvNext=S.handNo+5+Math.floor(Math.random()*3);
  if(S.handNo<S.nvNext||S.result||CFG.flashback||S.finalHand||S.autoMe)return;
  const s0=S,h0=S.handNo;let n=0;
  const go=()=>{if(S!==s0||S.handNo!==h0||!S.handOver||S.result||SETTINGS.nextv===false)return;
    // 何か出ているときは少し待つ。それでも空かなければ、この回は見送る（次のハンドの終わりにまた見る）
    if(nvBlocked()){if(++n<4)setTimeout(go,700*SPEED());return}
    const p=nvPick();if(!p)return;nvMob(p);S.nvNext=S.handNo+6+Math.floor(Math.random()*3);
    (S.nvUsed=S.nvUsed||[]).push(p[1]);if(p[0]==='big')S.nvBig=1;nextvShow(p[0],p[1],p[2])};
  setTimeout(go,1800*SPEED())}
function nextvShow(kind,text,who){
  const t=$('table'),el=$('nextv');if(!t||!el)return;nextvClear();
  const cs=camSet(),mode=reducedMotion()?'sub':cs==='off'?'lamp':cs==='soft'?'soft':'full',big=kind==='big';
  el.querySelector('b').textContent=text;el.classList.add('on');
  NV.on=true;const tok=++NV.tok;t.classList.add('nvfocus','nv'+mode);t.classList.toggle('nvbig',big);
  if(mode==='full'){const c=$('cam'),W=t.offsetWidth,H=t.offsetHeight,z=big?1.07:1.04,px=W*.75,py=H*.2;
    c.classList.remove('snapin');c.style.transitionDuration=(.5*SPEED())+'s';c.style.transform=`translate(${(px*(1-z)).toFixed(1)}px,${(py*(1-z)).toFixed(1)}px) scale(${z})`}
  if(Sound.murmur)Sound.murmur(kind==='cheer'||big);
  if(kind==='rumor'&&who){const h=loadRumor(),line='隣の卓で聞いた：'+text;h[who]=h[who]||[];if(!h[who].includes(line))h[who].push(line);
    try{localStorage.setItem(RUMOR_KEY,JSON.stringify({v:1,heard:h}))}catch(e){}log(line)}
  clearTimeout(NV.t);NV.t=setTimeout(()=>{if(NV.tok===tok)nextvClear()},(big?3500:2800)*SPEED())}
function nextvClear(){clearTimeout(NV.t);const el=$('nextv');if(el)el.classList.remove('on');if(!NV.on)return;NV.on=false;
  const t=$('table');if(t)t.classList.remove('nvfocus','nvfull','nvsoft','nvlamp','nvsub','nvbig');camUpdate(true)}
// ピント送りの間は、ふだんのカメラを動かさない
{const _cu=camUpdate;camUpdate=function(f){if(NV.on)return;return _cu.apply(this,arguments)}}
function renderLive(){
  $('btnMuck').textContent='負けた手：'+(SETTINGS.muck?'伏せる':'見せる');
  $('btnCount').textContent='相手の持ち点：'+(SETTINGS.count==='exact'?'正確':'だいたい');
  $('btnQuiz').textContent='ルールクイズ：'+(SETTINGS.quiz?'出す':'出さない');
  $('btnNextv').textContent=SETTINGS.nextv!==false?'隣の卓の声：あり':'隣の卓の声：なし';
}
$('btnNextv').onclick=()=>{SETTINGS.nextv=SETTINGS.nextv===false;saveSettings();renderLive();if(SETTINGS.nextv===false)nextvClear()};
$('btnMuck').onclick=()=>{SETTINGS.muck=!SETTINGS.muck;saveSettings();renderLive()};
$('btnCount').onclick=()=>{SETTINGS.count=SETTINGS.count==='exact'?'approx':'exact';saveSettings();renderLive();if(S&&S.players)render()};
$('btnQuiz').onclick=()=>{SETTINGS.quiz=!SETTINGS.quiz;saveSettings();renderLive()};
renderLive();
$('nick').value=nick();$('nick').oninput=()=>{SETTINGS.nick=$('nick').value.slice(0,8);saveSettings()};
function renderClock(){$('btnClock').textContent='持ち時間：'+(SETTINGS.clock?'あり':'なし')}
$('btnClock').onclick=()=>{SETTINGS.clock=!SETTINGS.clock;saveSettings();renderClock();if(!SETTINGS.clock)Clock.stop();else if(S&&S.players&&S.toAct===0&&!S.handOver&&bigSpotForMe())Clock.start(S.myTurnKey)};
renderClock();
function peekOn(){if(SETTINGS.peekSet)return !!SETTINGS.peek;return !(typeof CFG!=='undefined'&&CFG&&CFG.ch&&!CFG.ch.p2&&CFG.ch.no<=2)}
function renderPeek(){$('btnPeek').textContent='手札：'+(SETTINGS.peekSet?(SETTINGS.peek?'めくって見る':'いつも表'):'めくって見る（第1・2章は表）')}
$('btnPeek').onclick=()=>{SETTINGS.peek=SETTINGS.peekSet?!SETTINGS.peek:!peekOn();SETTINGS.peekSet=true;saveSettings();renderPeek();if(S&&S.players)render()};
renderPeek();

// ===== ボタンまわり（UX調査 A〜I） =====
// 見た目と操作だけを変える。CPUの打ち方と勝敗の決まり方には触れない
let quickPick=0,allinArm='',allinTimer=0,preAct='',preAmt=-1;
const preAllowed=()=>!CFG.flashback&&!(CFG.ch&&CFG.ch.no<=3);
function quickValues(){
  const me=S.players[0],{minTo,maxTo}=raiseBounds(),bb=BB(),half=bb/2;
  const cl=v=>Math.max(minTo,Math.min(maxTo,Math.round(v/half)*half));
  let L;
  if(S.street==='preflop'){
    const open=S.currentBet<=bb;
    L=open?[['2.5BB',2.5*bb],['3BB',3*bb],['4BB',4*bb]]:[['2.5倍',2.5*S.currentBet],['3倍',3*S.currentBet],['4倍',4*S.currentBet]];
  }else{const pot=potTotal(),toCall=S.currentBet-me.bet,base=pot+toCall;
    L=[['⅓ポット',S.currentBet+base/3],['½ポット',S.currentBet+base/2],['¾ポット',S.currentBet+base*.75]]}
  // v66（レビュー 2）：はじめての人と第1〜3章は「2.5BB・⅓ポット」などの用語ではなく「小さめ／ふつう／大きめ」（下に金額）
  const easy=(typeof novice==='function'&&novice())||!!(CFG.ch&&CFG.ch.no<=3&&!CFG.flashback);if(easy)L=L.map(([n,v],k)=>[['小さめ','ふつう','大きめ'][k]||n,v]);
  const seen=new Set();return L.map(([n,v])=>[n,cl(v)]).filter(([n,v])=>{if(seen.has(v))return false;seen.add(v);return true})}
function renderQuick(show){
  const q=$('quick');if(!show){q.hidden=true;return}
  const vals=quickValues();q.hidden=!vals.length;
  q.innerHTML=vals.map(([n,v],k)=>`<button data-qv="${v}" class="${quickPick===v?'on':''}" aria-pressed="${quickPick===v}">${n}<i>${fmt(v)}</i><kbd class="k">${k+1}</kbd></button>`).join('');
  q.querySelectorAll('[data-qv]').forEach(b=>b.onclick=()=>pickQuick(+b.dataset.qv))}
function pickQuick(v){
  if(quickPick===v){return confirmRaise()}
  quickPick=v;raiseOpen=false;$('raiseRange').value=v;renderControls()}
function isAllinRaise(v){const me=S.players[0];return v>=me.bet+me.chips}
function armAllin(id){
  if(SETTINGS.allinConfirm===false)return false;
  if(allinArm===id)return false;
  allinArm=id;clearTimeout(allinTimer);allinTimer=setTimeout(()=>{allinArm='';if(S&&S.players)renderControls()},3000);
  renderControls();return true}
function clearArm(){allinArm='';clearTimeout(allinTimer)}
function confirmRaise(){
  const v=+$('raiseRange').value;
  if(isAllinRaise(v)&&armAllin('raise'))return;
  clearArm();raiseOpen=false;quickPick=0;buzz();act(0,'raise',v)}
function buzz(){if(SETTINGS.sound&&navigator.vibrate)try{navigator.vibrate(8)}catch(e){}}
// A：（v64）卓とボタンが1画面に収まったので、自分の番に卓へ自動でスクロールしない。名前は呼び出し元のために残す
const LAND=()=>matchMedia('(orientation:landscape) and (max-height:520px)').matches;
function keepMine(){}
// I：自分の番の合図
function turnCue(){requestAnimationFrame(keepMine);const a=$('acts');a.classList.remove('cue');void a.offsetWidth;a.classList.add('cue');
  if(SETTINGS.sound){Sound.sfx('turn');if(navigator.vibrate)try{navigator.vibrate(15)}catch(e){}}}
// E：先行入力
function renderPre(){
  const me=S.players[0],row=$('prerow');
  const ok=preAllowed()&&!S.handOver&&S.toAct!==0&&me&&inHand(me)&&!me.allIn&&!S.runout&&!S.autoMe;
  row.hidden=!ok;if(!ok){if(S.handOver||!me||!inHand(me))preAct='';return}
  const toCall=Math.min(S.currentBet-me.bet,me.chips);
  if(preAct==='call'&&toCall!==preAmt)preAct='';
  $('preCF').setAttribute('aria-pressed',preAct==='cf');$('preCall').setAttribute('aria-pressed',preAct==='call');
  $('preCF').textContent=toCall<=0?'チェック/フォールド':'フォールド';
  $('preCall').textContent=toCall<=0?'チェック':toCall>=me.chips?'オールインでコール':`コール ${fmt(toCall)}`;
  $('preCall').dataset.amt=toCall}
function runPre(){
  if(!preAct)return false;const me=S.players[0],toCall=Math.min(S.currentBet-me.bet,me.chips),p=preAct;preAct='';
  if(p==='cf'){act(0,toCall<=0?'call':'fold');return true}
  if(p==='call'&&toCall===preAmt){act(0,'call');return true}
  return false}
$('btnPen').onclick=()=>{const r=penReview();S.penReady=-1;S.penCount=(S.penCount||0)+1;$('btnPen').hidden=true;
  const h=$('betweenHint');h.textContent=`${P2ON()?mentorName():'ジン'}「${r.line}」${r.x}`;h.classList.add('penline');log(`赤ペン：${r.line}${r.x}`)};
$('preCF').onclick=()=>{preAct=preAct==='cf'?'':'cf';renderPre()};
$('preCall').onclick=()=>{if(preAct==='call')preAct='';else{preAct='call';preAmt=+$('preCall').dataset.amt}renderPre()};
// G：設定パネル
const SET_ROWS=[['btnCam','カメラ演出','相手の番にその人へ寄ります。強めは、クセが出た瞬間にも寄り直します'],['btnPeek','手札','自分の手札を、指でめくって見るか、いつも表にしておくか'],['btnSound','音','オフ、効果音だけ、音楽もすべて、の3段階。音があるときは、自分の番に短く振動します'],['btnSpeed','演出の速さ','カードを配る速さや、相手が考える時間'],['btnDepth','立体','画面を傾けると卓が少し動きます'],['btnClock','持ち時間','大きな勝負のときに、考える時間の目安を出します'],['btnMuck','負けた手','ショーダウンで負けたとき、手を伏せるか見せるか'],['btnCount','相手の持ち点','相手のチップを、だいたいで出すか、正確に出すか'],['btnQuiz','ルールクイズ','フロアのルールクイズを出すかどうか'],['btnAllin','オールイン確認','オールインのときだけ、もう一度押して確定します'],['btnTalk','会話','相手から話しかけられたり、手と手の間に話したりします。オフでも、物語の場面は出ます']];
(function(){const box=$('setIn'),old=document.querySelector('#game .settings');
  const ab=document.createElement('button');ab.id='btnAllin';ab.className='mini';old.appendChild(ab);const tb=document.createElement('button');tb.id='btnTalk';tb.className='mini';old.appendChild(tb);
  SET_ROWS.forEach(([id,name,desc])=>{const b=$(id);if(!b)return;const r=document.createElement('div');r.className='setrow';
    r.innerHTML=`<div><b>${name}</b><p>${desc}</p></div>`;r.appendChild(b);box.appendChild(r)})})();
function renderAllin(){$('btnAllin').textContent='オールイン確認：'+(SETTINGS.allinConfirm===false?'なし':'あり')}
$('btnAllin').onclick=()=>{SETTINGS.allinConfirm=SETTINGS.allinConfirm===false;saveSettings();renderAllin()};renderAllin();
function renderTalkSet(){$('btnTalk').textContent='会話：'+({on:'オン',less:'少なめ',off:'オフ'})[talkSet()]}
$('btnTalk').onclick=()=>{const o=['on','less','off'];SETTINGS.talk=o[(o.indexOf(talkSet())+1)%3];saveSettings();renderTalkSet();if(S&&S.players)render()};renderTalkSet();
$('btnSet').onclick=()=>{$('setPanel').hidden=false;$('btnSetClose').focus()};
$('btnSetClose').onclick=()=>{$('setPanel').hidden=true;(!$('game').hidden||!$('mSet')?$('btnSet'):$('mSet')).focus({preventScroll:true})};
$('setPanel').onclick=e=>{if(e.target.id==='setPanel')$('setPanel').hidden=true};
// H：キーボード
document.addEventListener('keydown',e=>{
  if($('game').hidden||e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.target.closest&&e.target.closest('input,select,textarea'))return;
  if(!$('setPanel').hidden){if(e.key==='Escape')$('setPanel').hidden=true;return}
  const dialogs=['runBox','vs','quiz','help','daily','share','tour'].some(id=>$(id)&&!$(id).hidden);if(dialogs)return;
  const k=e.key.toLowerCase(),vis=id=>{const b=$(id);return b&&!b.hidden&&!b.disabled&&b.offsetParent};
  if(S&&S.handOver){if((k==='enter'||k===' ')&&vis('btnNext')&&e.target===document.body){e.preventDefault();$('btnNext').click()}return}
  if(!S||S.toAct!==0)return;
  if(k==='f'&&vis('btnFold')){e.preventDefault();$('btnFold').click()}
  else if((k==='c'||(k===' '&&e.target===document.body))&&vis('btnCall')){e.preventDefault();$('btnCall').click()}
  else if(k==='r'&&vis('btnRaise')){e.preventDefault();if(!raiseOpen)$('btnRaise').click();else{raiseOpen=false;renderControls()}}
  else if(k==='enter'&&(raiseOpen||quickPick)&&e.target===document.body){e.preventDefault();$('btnRaise').click()}
  else if(k==='escape'&&(raiseOpen||quickPick)){raiseOpen=false;quickPick=0;clearArm();renderControls()}
  else if(/^[1-5]$/.test(k)){const n=+k-1;
    if(raiseOpen){const b=document.querySelectorAll('.presets [data-q]')[n];if(b){e.preventDefault();b.click()}}
    else{const b=document.querySelectorAll('#quick [data-qv]')[n];if(b&&!$('quick').hidden){e.preventDefault();b.click()}}}
  else if((k==='arrowup'||k==='arrowdown')&&raiseOpen){e.preventDefault();nudge(k==='arrowup'?1:-1)}
});
$('btnFold').onclick=()=>{raiseOpen=false;quickPick=0;clearArm();buzz();act(0,'fold')};
document.querySelectorAll('#declRow [data-dg]').forEach(b=>b.onclick=()=>{const g=+b.dataset.dg;S.declGuess=S.declGuess===g?null:g;renderControls()});
$('btnCall').onclick=()=>{const me=S.players[0];if(!CFG.flashback&&S.currentBet-me.bet>=me.chips&&me.chips>0&&armAllin('call'))return;clearArm();if(!$('declRow').hidden&&S.declGuess!=null)S.declare={target:S.aggr,guess:S.declGuess};raiseOpen=false;quickPick=0;buzz();act(0,'call')};
$('btnRaise').onclick=()=>{
  if(CFG.flashback){act(0,'raise',flashTo());return}
  if(!raiseOpen&&!quickPick){raiseOpen=true;clearArm();renderControls();return}
  confirmRaise();
};
$('raiseRange').oninput=()=>{clearArm();updateRaiseLabel()};
const nudge=d=>{const r=$('raiseRange');r.value=Math.max(+r.min,Math.min(+r.max,+r.value+d*BB()/2));clearArm();updateRaiseLabel()};
$('btnMinus').onclick=()=>nudge(-1);
$('btnPlus').onclick=()=>nudge(1);
document.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{
  const me=S.players[0];
  $('raiseRange').value=presetValues(potTotal(),S.currentBet-me.bet)[b.dataset.q];clearArm();updateRaiseLabel();
});
function openStackZoom(i){const p=S&&S.players[i];if(!p||p.out||!p.chips)return;const z=$('stackZoom');
  z.innerHTML=`<div class="szin"><h3>${esc(p.name)}の前のチップ</h3><div class="zstack">${stackCols(p.chips,7,20)}</div>
    <div class="legend">${STACK_DENOMS.map(([v,c])=>`<span><i><span class="chip ${c}" style="bottom:0"></span></i>${fmt(v)}</span>`).join('')}</div>
    <p class="zhint">色ごとに数えて足すと、持ち点になります。5枚ずつ少しあけて積んであり、1本は最大20枚です。</p><div class="zbtns">${approxOn()?'<button class="mini" id="btnZoomCount">ディーラーに数えてもらう</button>':''}<button class="mini" id="btnZoomClose">閉じる</button></div></div>`;z.dataset.i=i;
  z.hidden=false;$('btnZoomClose').focus()}
$('stackZoom').addEventListener('click',e=>{if(e.target.id==='btnZoomCount'){$('stackZoom').hidden=true;dealerCount(+$('stackZoom').dataset.i)}
  else if(e.target.id==='stackZoom'||e.target.id==='btnZoomClose')$('stackZoom').hidden=true});
addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('stackZoom').hidden)$('stackZoom').hidden=true});
$('felt').addEventListener('click',e=>{const m=e.target.closest('.spot .mystack');if(!m)return;const sp=m.closest('.spot');openStackZoom(+sp.id.replace('spot',''))});
function dealerCount(i){const p=S.players[i];if(!p||p.out||p.counting)return;
  p.counting=true;render();
  setTimeout(()=>{p.counting=false;p.counted=p.chips;dealerSay(`${p.name}さん、${fmt(p.chips)}です`);log(`カウント：${p.name} ${fmt(p.chips)}`);render()},600*SPEED());
}
$('plates').addEventListener('click',e=>{const pl=e.target.closest('.plate');if(!pl)return;openStackZoom(+pl.id.replace('plate',''))});
$('btnShowNo').onclick=()=>{S.showOffer=false;render()};
$('btnShowYes').onclick=()=>{
  const me=S.players[0];S.showOffer=false;me.show=true;me.shownByChoice=true;
  const bluff=weakNow(me.hand);
  if(!me.score){me.score=S.board.length>=3?bestN(me.hand.concat(S.board)):[0];selfLearn();selfFoolCheck()}
  log(`あなたは手を見せた（${me.hand.map(cardStr).join(' ')}）`);
  if(CFG.tells){const m=S.shownMem=S.shownMem||{bluff:0,strong:0};m[bluff?'bluff':'strong']++;
    const o=S.players.filter(q=>!q.human&&!q.out);const w=o[Math.floor(Math.random()*o.length)];
    if(w)w.say={seq:(S.saySeq=(S.saySeq||0)+1)+4000,act:'',line:bluff?'……覚えておく':'やっぱりな'}}
  if(bluff)grantTitle('showbluff');
  if(!S.showNoted){S.showNoted=true;jinNote(bluff?'見せるな。情報はただでやるな':'……悪くない使い方だ',0)}
  render()};
$('btnIgnore').onclick=()=>{S.taunt=-1;jinNote('それでいい',0);render()};
$('btnNice').onclick=()=>{const p=S.players[S.taunt];S.taunt=-1;if(p){p.say={seq:(S.saySeq=(S.saySeq||0)+1)+3000,act:'',line:lineFor(p.name,'nice')}}
  log('あなた：「ナイスハンド」');if(bumpNice()>=3)grantTitle('gentle');render()};
$('btnNext').onclick=()=>{
  // はしご：教えを選ぶ窓・結果の窓が開いている間や、次の卓を作る前の仮の状態では何もしない（前の卓の「次へ」が残っていても進めない）
  if(CFG.run&&(!S||!S.players||!S.players.length||!$('runBox').hidden))return;
  if(CFG.ura&&(S.result==='win'||S.result==='lose'))return S.result==='win'?showChapters():startUra(CFG.ura.no);
  if(CFG.run&&(S.result==='win'||S.result==='lose'))return S.result==='win'?runNext():runOver(false);
  if(S.result==='flash'){const d=CFG.onDone;$('table').classList.remove('flashback');d&&d();return}
  if(S.p2alt){S.p2alt=false;const ch=CFG.ch,lost=S.result==='lose';
    return playScene(ch,P2_ALT,()=>{if(lost)startChapter(ch,true);else{show('game');Sound.bgm(CFG.bgm||0);startHand()}})}
  if(S.altEnd){S.altEnd=false;const t=loadStory();t.alt=true;saveStory(t);grantTitle('altend');const ch=CFG.ch,lost=S.result==='lose';
    return playScene(ch,ALT_END,()=>{if(lost)startChapter(ch,true);else{show('game');Sound.bgm(CFG.bgm||0);startHand()}})}
  if(S.result==='win'&&CFG.ch&&CFG.ch.p2)p2Win();
  else if(S.result==='win'&&CFG.ch){
    const ch=CFG.ch;if(ch.no>=5&&!(+loadStory().loses[ch.no]))grantTitle('clean');saveCleared(ch.no);
    const bRest=beatRest();showInterstitial(()=>{const ls=bRest.concat(typeof ch.outro==='function'?ch.outro():ch.outro);if(ch.no===7)playScene(ch,ls.concat(P2_BRIDGE),()=>show('title'));else playScene(ch,ls,showChapters)});
  }else if(S.result==='win')startFree();
  else if(S.result==='lose')CFG.ch?startChapter(CFG.ch,true):startFree();
  else{const bt=pendingBeat();if(bt)return playScene(CFG.ch,bt.lines,()=>{show('game');Sound.bgm(CFG.bgm||0);render();startHand()});startHand()}
};
$('btnAlt').onclick=()=>{S.handOver=true;CFG.ch?showChapters():show('title')};
$('btnQuit').onclick=()=>{
  if(S&&S.players&&!S.result&&!S.quitOk&&!$('game').hidden){const box=$('runBox');box.innerHTML=`<div class="qin runbox"><p class="qq">やめますか？</p><p>ここまでの勝負は残りません。</p><div class="qopts"><button id="qtNo">続ける</button><button id="qtYes">やめる</button></div></div>`;box.hidden=false;
    $('qtNo').onclick=()=>{box.hidden=true;$('btnQuit').focus({preventScroll:true})};$('qtYes').onclick=()=>{box.hidden=true;S.quitOk=true;$('btnQuit').onclick()};$('qtNo').focus({preventScroll:true});return}
  if(!CFG.ch&&!CFG.run&&!CFG.store&&S&&S.stat&&!S.result&&!S.reviewShown&&jinAdviceOn()){const r=reviewLines(S.stat);
    if(r){S.reviewShown=true;saveReview(r);Clock.stop();S.handOver=true;S.toAct=-1;$('vs').hidden=true;$('quiz').hidden=true;
      const box=$('runBox');box.innerHTML=`<div class="qin runbox"><p class="qq">卓を立った</p><div class="review">${reviewHTML(r)}</div><div class="qopts"><button id="rvOk">タイトルへ</button></div></div>`;box.hidden=false;
      $('rvOk').onclick=()=>{box.hidden=true;show('title')};return}}
$('vs').hidden=true;$('quiz').hidden=true;Clock.stop();S.handOver=true;S.toAct=-1;CFG.ch||CFG.store?showChapters():show('title')};
$('btnStory').onclick=showChapters;
function renderLang(){const b=$('btnLang');b.textContent=SETTINGS.lang==='en'?'日本語':'English';b.setAttribute('aria-label',SETTINGS.lang==='en'?'日本語にする':'Switch to English');b.lang=SETTINGS.lang==='en'?'ja':'en'}
$('btnLang').onclick=()=>{SETTINGS.lang=SETTINGS.lang==='en'?'ja':'en';saveSettings();I18N.set(SETTINGS.lang);renderLang()};
renderLang();I18N.start();I18N.apply();
$('btnRun').onclick=startRun;$('btnRun').hidden=loadCleared()<7;
$('btnHow').onclick=()=>showHelp('flow');$('btnDaily').onclick=showDaily;
$('btnShot').onclick=()=>{if(S.hl)shareImage(hlCanvas(S.hl),'LAST TELL　'+S.hl.head)};
if(!loadDaily().res[todayKey()])$('btnDaily').classList.add('newdot');$('btnHelp').onclick=()=>showHelp('hands');
$('btnNote').onclick=()=>showNotebook();$('btnNoteBack').onclick=showChapters;
$('hero').insertAdjacentHTML('afterbegin',avatar('ジン'));
$('senseiAva').innerHTML=avatar('ジン');
$('btnFree').onclick=startFree;
document.querySelectorAll('[data-home]').forEach(b=>b.onclick=()=>show('title'));
