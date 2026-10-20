
// =====================================================================
// v64：UI整理と操作性（案3）＋ 所持チップの見せ方（案1・2・3）
//   §A 片付け：吹き出しは1つずつ・顔の横／状況の文字は卓の上の帯／ポットの内訳は押したときだけ
//             揺さぶる・ストラドルは自分の顔の右の 💬 1つ／結果は下の欄だけ／レイズ欄の文言／設定はスイッチと「今の値 ▾」
//   §B 卓を1画面に：上のバー（≡・章の名前・ブラインドとハンド数・目標 ▾・⚙）、記録やメモは ≡ の中
//   §C 卓の外：タイトルの横画面の並び、章の一覧は1章1行、設定は「よく使う3つ」＋「くわしい設定」
//   チップ：塔の並べ方は 27_render.js、勝った分の山は 21_dealer_fx.js（ここではハンドの頭の積み直しだけ）
//   ボタンの id（btnFold・btnCall・btnRaise・quick・raisePanel）と並び・色は変えない
// =====================================================================
Object.assign(EN_DICT,{"目標":"Goal","くわしい設定":"More settings","よく使う":"Quick settings","いくらにする？":"How much?","メニュー":"Menu",
  "今の賭け":"Current bet","出す":"Pay","残り":"Left","この店で遊ぶ":"Play at this club","すべて":"Everything","少なめ":"Less",
  "めくって見る（第1・2章は表）":"Flip to see (face up in Ch.1-2)","常連度":"Regular","その他の項目":"More options","壁の写真・手に入れた服":"Wall photo / outfits",
  "メニューを閉じる":"Close menu","目標を見る":"Show goal","ポットの内訳":"Pot breakdown","テーブル":"Table","賭け":"Bets",
  "揺さぶる・ストラドル":"Needle / straddle","揺さぶる":"Needle","会話の頻度":"Chat frequency","演出の速さ":"Animation speed","カメラ演出":"Camera","手札":"Your cards","音":"Sound",
  "負けた手":"Losing hands","相手の持ち点":"Opponent chips","ふつう":"Normal","強め":"Strong","控えめ":"Subtle","オフ":"Off","オン":"On","効果音だけ":"Effects only",
  "めくって見る":"Flip to see","いつも表":"Always face up","見せる":"Show","伏せる":"Muck","だいたい":"Rough","正確":"Exact","速い":"Fast",
  "押すと、この章の勝利条件が開きます。":"Tap to open this chapter's win condition.",
  "フォールド・チェック／コール・レイズから選びます。迷ったら、左上の「≡」から役の一覧を見られます。":"Choose fold, check/call or raise. If unsure, open the hand rankings from the ≡ menu at the top left."});
// 保存されると困る見た目だけの状態（続きからの保存に入れない）
try{RS_SKIP.push('wonPile')}catch(e){}

const u64={};
const inGame=()=>!$('game').hidden;
const LAND64=()=>matchMedia('(orientation:landscape) and (max-height:520px)').matches;

// ---------- §B-1：対戦中はページを動かさない ----------
function ingameSync(){const on=!$('game').hidden;document.documentElement.classList.toggle('ingame',on);if(on&&(scrollX||scrollY))scrollTo(0,0)}
{const o=show;show=function(id){const r=o.apply(this,arguments);ingameSync();if(id!=='game'){menuClose();goalOpen(false)}return r}}
// 1画面に収めたので、ほかの処理が scrollIntoView などでずらしても元に戻す
addEventListener('scroll',()=>{if(document.documentElement.classList.contains('ingame')&&(scrollY||scrollX))scrollTo(0,0)},{passive:true});
ingameSync();

// ---------- §B-2：上のバー・目標・≡ の引き出し ----------
(function(){const gw=document.querySelector('#game .gwrap'),hd=document.querySelector('#game header.g');if(!gw||!hd)return;
  const bar=document.createElement('div');bar.className='tbar';bar.id='tbar';
  bar.innerHTML=`<button class="tbtn tmenu" id="btnMenu" aria-label="メニュー" aria-expanded="false" aria-controls="menuDrawer">≡</button><span class="tbmeta" id="tbMeta" data-noi18n></span><button class="tbtn tgoal" id="btnGoal" aria-expanded="false" aria-controls="goalDrop"><span>目標</span><i aria-hidden="true">▾</i></button>`;
  const t=$('gTitle');bar.insertBefore(t,bar.querySelector('#tbMeta'));
  const set=$('btnSet');set.classList.remove('ghost','small');set.classList.add('tbtn','tset');bar.appendChild(set);
  gw.insertBefore(bar,hd);
  const gd=document.createElement('div');gd.className='goaldrop';gd.id='goalDrop';gd.hidden=true;gd.appendChild($('goal'));gd.appendChild($('meta'));gw.insertBefore(gd,hd);
  const dr=document.createElement('div');dr.className='gdrawer';dr.id='menuDrawer';dr.hidden=true;dr.setAttribute('role','dialog');dr.setAttribute('aria-label','メニュー');
  dr.innerHTML=`<div class="gdin" id="menuIn"><div class="gdhead"><b>メニュー</b><button class="ghost small" id="btnMenuClose" aria-label="メニューを閉じる">×</button></div></div>`;
  gw.appendChild(dr);const box=dr.firstChild;
  const help=$('btnHelp');help.className='gditem';box.appendChild(help);
  box.appendChild($('logBox'));box.appendChild($('notesBox'));
  const q=$('btnQuit');q.className='gditem gdquit';box.appendChild(q);
  hd.hidden=true;
  $('btnMenu').onclick=()=>{dr.hidden?menuOpen():menuClose()};$('btnMenuClose').onclick=()=>menuClose(true);
  dr.addEventListener('click',e=>{if(e.target===dr)menuClose();else if(e.target.closest('#btnHelp,#btnQuit'))menuClose()},true);
  $('btnGoal').onclick=()=>goalOpen($('goalDrop').hidden);
  gd.addEventListener('click',()=>goalOpen(false));
  // 目標が進んだとき（goalcard.bump）は3秒だけ自動で開く
  new MutationObserver(()=>{if($('goal').classList.contains('bump')&&inGame())goalOpen(true,3000)}).observe($('goal'),{attributes:true,attributeFilter:['class']});
})();
function menuOpen(){const d=$('menuDrawer');if(!d)return;goalOpen(false);d.hidden=false;$('btnMenu').setAttribute('aria-expanded','true');setTimeout(()=>{const b=$('btnMenuClose');b&&b.focus({preventScroll:true})},0)}
function menuClose(focus){const d=$('menuDrawer');if(!d||d.hidden)return;d.hidden=true;$('btnMenu').setAttribute('aria-expanded','false');if(focus)$('btnMenu').focus({preventScroll:true})}
function goalOpen(on,ms){const g=$('goalDrop');if(!g)return;clearTimeout(u64.gt);g.hidden=!on;$('btnGoal').setAttribute('aria-expanded',String(!!on));
  if(on&&ms)u64.gt=setTimeout(()=>goalOpen(false),ms)}
document.addEventListener('pointerdown',e=>{const g=$('goalDrop');if(g&&!g.hidden&&!e.target.closest('#goalDrop,#btnGoal'))goalOpen(false)},true);
// 引き出しが開いている間は、卓のキー操作を止める（Esc で閉じる）
addEventListener('keydown',e=>{const d=$('menuDrawer');if(d&&!d.hidden&&inGame()){if(e.key==='Escape'){e.preventDefault();menuClose(true)}if(!e.target.closest||!e.target.closest('#menuDrawer'))e.stopPropagation();return}
  if(e.key==='Escape'&&$('goalDrop')&&!$('goalDrop').hidden)goalOpen(false)},true);
{const o=window.LT_back;window.LT_back=function(){const d=$('menuDrawer');if(d&&!d.hidden){menuClose();return true}if($('goalDrop')&&!$('goalDrop').hidden){goalOpen(false);return true}return o?o.apply(this,arguments):false}}
// 赤ペンの「ハンドの記録」を開くときは、引き出しごと開く
{const o=openPen59;openPen59=function(){menuOpen();return o.apply(this,arguments)}}
// 章の始め：最初のハンドを配るときに、目標を3秒だけ開く
{const o=startGame;startGame=function(cfg){u64.goalAuto=!(cfg&&cfg.flashback);menuClose();goalOpen(false);const r=o.apply(this,arguments);ingameSync();return r}}
// バーの数字（1,000/2,000　#12）
function tbMetaSync(){const m=$('tbMeta');if(!m||!S||!S.players)return;let t='';try{t=`${fmt(SB())}/${fmt(BB())}　#${S.handNo}`}catch(e){}if(m.textContent!==t)m.textContent=t;
  // v71（v70 レビュー）：数字だけだと何の額か分からないので、触れたとき・読み上げで「ブラインド」と出す（英語は Blinds）
  try{const l=(typeof I18N!=='undefined'&&I18N.lang==='en'?'Blinds ':'ブラインド ')+fmt(SB())+'/'+fmt(BB()),al=l+(I18N.lang==='en'?' #':'　#')+S.handNo;if(m.title!==l)m.title=l;if(m.getAttribute('aria-label')!==al)m.setAttribute('aria-label',al)}catch(e){}
  const fb=!!(typeof CFG!=='undefined'&&CFG&&CFG.flashback);m.hidden=fb}

// ---------- §A-1：吹き出しは1つずつ・顔の横 ----------
function faceBox(i){const b=$('bust'+i);if(!b||!b.offsetWidth)return null;const w=b.offsetWidth,h=b.offsetHeight,cx=b.offsetLeft,top=b.offsetTop;
  return{l:cx-w*.22,r:cx+w*.22,t:top+h*.1,b:top+h*.68,cx,top,w,h}}
function sayPlace(sy){const i=+sy.id.replace('say',''),f=faceBox(i),L=$('sayLayer');sy.classList.remove('side','sl','sr');sy.style.left=sy.dataset.x||sy.style.left;sy.style.top='';
  if(!sy.dataset.x)sy.dataset.x=sy.style.left;if(sy.dataset.mw===undefined)sy.dataset.mw=sy.style.maxWidth||'';const mwBack=()=>{sy.style.removeProperty('max-width');if(sy.dataset.mw)sy.style.maxWidth=sy.dataset.mw};mwBack();if(!f||!L)return;
  const W=L.clientWidth,H=L.clientHeight,bw=sy.offsetWidth+10,bh=sy.offsetHeight,tp=(()=>{try{return sayTopPad()}catch(e){return 4}})();
  const faces=S.players.map((p,k)=>k>0&&!p.out?faceBox(k):null).filter(Boolean);
  // v75 レビュー 1：6人卓の縦では、横の席の吹き出しが奥の席の名札にかからないように、名札もよける
  const lr=L.getBoundingClientRect(),pls=[...document.querySelectorAll('#plates .plate')].filter(e=>e.offsetParent&&e.id!=='plate'+i).map(e=>{const r=e.getBoundingClientRect();return{l:r.left-lr.left,r:r.right-lr.left,t:r.top-lr.top,b:r.bottom-lr.top}}).filter(q=>q.r>q.l);
  const hit=(x,y)=>faces.concat(pls).some(q=>x<q.r&&q.l<x+bw&&y<q.b&&q.t<y+bh);
  const y=Math.max(tp,f.t+f.h*.04),cand=f.cx<W*.48?['r','l']:['l','r'];
  for(const s of cand){const x=s==='r'?f.r+4:f.l-4-bw;if(x<4||x+bw>W-4||y+bh>H*.6||hit(x,y))continue;
    sy.classList.add('side',s==='r'?'sr':'sl');sy.style.left=x.toFixed(1)+'px';sy.style.top=y.toFixed(1)+'px';return}
  // v66（テスター目線 3）：一騎打ちで横に入りきらないときは、吹き出しを細くして顔の横に置く。頭の上に置くと目と口（テル）を隠すため
  if(faces.length===1)for(const s of cand){const room=s==='r'?W-8-f.r:f.l-8;if(room<96)continue;
    const mw=Math.floor(room-10),setMw=v=>sy.style.setProperty('max-width',v+'px','important');setMw(mw);const over=sy.offsetWidth+10-room;if(over>0)setMw(mw-Math.ceil(over));
    const bw2=sy.offsetWidth+10,bh2=sy.offsetHeight,x=s==='r'?f.r+4:f.l-4-bw2;
    if(x<4||x+bw2>W-4||y+bh2>H*.6)continue;
    sy.classList.add('side',s==='r'?'sr':'sl');sy.style.left=x.toFixed(1)+'px';sy.style.top=y.toFixed(1)+'px';return}
  mwBack();
  // 横に置けないとき（6人卓など）は頭の上。顔にかかるなら横にずらす
}
// 新しい吹き出しが出たら、前の吹き出しは読み終わる時間（35_say_keep の skRead）がたってから消す。読みかけのセリフは切らない
function sayOne(cur){const now=performance.now();cur._shown=now;
  document.querySelectorAll('#sayLayer .say.go,#plates .say.go').forEach(sy=>{if(sy===cur||(sy._shown||0)>now)return;
    const need=typeof skRead==='function'?skRead(sy.textContent):1100,left=(sy._shown||0)+need-now,seq=sy.dataset.seq;
    clearTimeout(sy._off);if(left<=30){sy.classList.remove('go');return}
    sy._off=setTimeout(()=>{if(sy.dataset.seq===seq&&sy.classList.contains('go')&&cur.classList.contains('go'))sy.classList.remove('go')},left)})}
(function(){const L=$('sayLayer');if(!L)return;
  new MutationObserver(list=>{for(const m of list){const sy=m.target;if(!sy.classList||!sy.classList.contains('say'))continue;
    if(sy.classList.contains('go')&&m.oldValue!==null&&!/\bgo\b/.test(m.oldValue||'')){sy._lpSay=1;layoutSoon();sayWake();sayOne(sy)}}})   // 動作の重さの改善 案3：置き場所は次のコマの位置合わせで（36_layout_pass）
    .observe(L,{subtree:true,attributes:true,attributeFilter:['class'],attributeOldValue:true})})();

// ---------- §A-3：ポットの内訳は押したときだけ（2秒） ----------
$('potSign').addEventListener('click',()=>{const s=$('potSign');if(!s.querySelector('.ps'))return;s.classList.add('showps');clearTimeout(u64.pt);u64.pt=setTimeout(()=>s.classList.remove('showps'),2000)});
$('potSign').setAttribute('role','button');$('potSign').setAttribute('aria-label','ポットの内訳');$('potSign').tabIndex=0;
$('potSign').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('potSign').click()}});
// 札は前のまま押せないので（重なり判定で札を隠さない）、押した場所が札の上かどうかで見る
document.addEventListener('click',e=>{const s=$('potSign');if($('game').hidden||!s)return;if(e.target.closest&&e.target.closest('#potChips')){s.click();return}
  if(s.hidden||!s.offsetParent||e.target.closest&&e.target.closest('button,a,input,select,label,summary'))return;const r=s.getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)s.click()});

// ---------- §A-4：揺さぶる・ストラドルは自分の顔の右の 💬 1つ ----------
// 💬 を押すと今までの言い方の一覧（needleMenu）が開く。ストラドルはその中の1行。
// 揺さぶれないとき（自分の番でない・この通りでもう揺さぶった）でも、ストラドルの店なら同じ場所の 💬 からストラドルだけを開ける
(function(){const row=document.querySelector('#table .needlerow'),b=$('btnNeedle'),sd=$('btnStraddle');if(!row||!b)return;
  row.classList.add('nr64');b.classList.add('n64');
  const s=document.createElement('button');s.id='btnS64';s.className='needle n64';s.hidden=true;s.textContent='💬';s.setAttribute('aria-label','ストラドル');s.setAttribute('aria-expanded','false');
  row.appendChild(s);s.onclick=()=>{u64.sopen=!u64.sopen;needleSync()};
  const oc=b.onclick;b.onclick=function(){const r=oc.apply(this,arguments);needleSync();return r};
  if(sd){const so=sd.onclick;sd.onclick=function(){const r=so.apply(this,arguments);needleSync();return r}}})();
function needleSync(){const row=document.querySelector('#table .needlerow'),b=$('btnNeedle'),s=$('btnS64');if(!row||!b||!s||typeof S==='undefined'||!S||!S.players)return;
  const st=!!($('btnStraddle')&&CFG&&CFG.house==='straddle'&&!S.handOver&&!CFG.flashback),nb=!b.hidden;
  s.hidden=!(st&&!nb&&$('askRow').hidden);if(s.hidden)u64.sopen=false;
  const open=st&&((nb&&!$('needleMenu').hidden)||(!s.hidden&&!!u64.sopen));
  row.classList.toggle('open64',open);s.setAttribute('aria-expanded',String(!s.hidden&&open));
  const lab=b.dataset.mode==='chat'?'話す':st?'揺さぶる・ストラドル':'揺さぶる';if(b.getAttribute('aria-label')!==lab)b.setAttribute('aria-label',lab)}
{const o=renderControls;renderControls=function(){const r=o.apply(this,arguments);try{needleSync()}catch(e){}return r}}
{const o=renderNeedleMenu;renderNeedleMenu=function(){const r=o.apply(this,arguments);try{needleSync()}catch(e){}return r}}

// §A-6：「ポット／今の賭け・出す／残り」は数字の下に1行（−＋の間ではなく欄の幅いっぱい）
try{const sub=$('raiseSub'),row=document.querySelector('#raisePanel .amtrow');if(sub&&row)row.after(sub)}catch(e){}
// ---------- §A-1・B-3：描画のたびに ----------
{const o=render;render=function(){const r=o.apply(this,arguments);try{tbMetaSync();needleSync();if(S&&S.handOver)$('msg').textContent=''}catch(e){}return r}}

// ---------- §B-3：ジンの助言は、ボタンの欄のすぐ上に卓へ重ねる ----------
function barSync(){const gw=document.querySelector('#game .gwrap');if(!gw||!inGame())return;
  const bar=[$('controls'),$('between')].find(b=>b&&!b.hidden&&b.getClientRects().length);const h=bar?Math.round(bar.getBoundingClientRect().height):0;
  if(gw.dataset.ab!==String(h)){gw.dataset.ab=String(h);gw.style.setProperty('--ab',h+'px')}
  const se=$('sensei'),seh=se&&!se.hidden&&!se.classList.contains('mwait')&&se.getClientRects().length?Math.round(se.getBoundingClientRect().height):0,land=LAND64();
  let sh=land?seh:0,sb=land?0:seh;
  // v74：帯が「あなたのチップ」の列より上にあるとき（小さい画面）は、帯の高さでは足りないので、かかる分だけ上げる
  if(sb){try{const mr=document.querySelector('#mine .me-r');if(mr){const t=parseFloat((getComputedStyle(mr).translate.split(' ')[1])||'0')||0,need=Math.ceil(mr.getBoundingClientRect().bottom-t-se.getBoundingClientRect().top+4);if(need>sb)sb=need}}catch(e){}}
  if(gw.dataset.sh!==String(sh)){gw.dataset.sh=String(sh);gw.style.setProperty('--sh',sh+'px')}
  if(gw.dataset.sb!==String(sb)){gw.dataset.sb=String(sb);gw.style.setProperty('--sb',sb+'px');requestAnimationFrame(()=>{try{if(S)potSignPlace()}catch(e){}})}}
try{const ro=new ResizeObserver(barSync);ro.observe($('controls'));ro.observe($('between'));ro.observe($('sensei'))}catch(e){}
// v74：師匠の帯は mwait（待ってから出す）が外れた時にも「あなたのチップ」の列を上げ直す（タイマーで外れるので render が来ないことがある）
try{new MutationObserver(()=>barSync()).observe($('sensei'),{attributes:true,attributeFilter:['class','hidden']});$('sensei').addEventListener('animationend',()=>barSync())}catch(e){}
// 動作の重さの改善 案3：0.25秒ごとの見回りはやめ、位置合わせ（36_layout_pass）で呼ぶ

// ---------- §B-6：自分の番に卓へ自動スクロールしない（1画面に収まっている） ----------
// 28_controls.js の keepMine は中身を外した。24 の fitRaise のずらしは CSS で止める（レイズ欄は卓の下側に重ねる）

// ---------- 操作案内：指す先を新しいバーへ ----------
try{const k=TOUR.findIndex(t=>t[0]==='#controls');if(k>=0)TOUR[k]=[TOUR[k][0],TOUR[k][1],'フォールド・チェック／コール・レイズから選びます。迷ったら、左上の「≡」から役の一覧を見られます。'];
  if(!TOUR.some(t=>t[0]==='#btnGoal'))TOUR.splice(Math.max(0,k),0,['#btnGoal','目標','押すと、この章の勝利条件が開きます。'])}catch(e){}

// ---------- ハンドの頭：目標を3秒・崩れた山を塔へ戻す ----------
{const o=startHand;startHand=function(){try{wonClearAll()}catch(e){}const r=o.apply(this,arguments);
  try{if(u64.goalAuto&&S&&S.players&&!CFG.flashback&&inGame()){u64.goalAuto=false;if(!(CFG.ch&&CFG.ch.no===1&&!CFG.ch.p2))goalOpen(true,3000)}}catch(e){}return r}} // v66（レビュー 3）：第1章は「勝負開始」の画面で目標を見たばかりなので、最初のハンドで帯を開かない（ゲンの顔を隠すため）

// ---------- §A-7・C-3：設定（よく使う3つ＋くわしい設定。2択はスイッチ、3択以上は「今の値 ▾」） ----------
const SET64_SEL={
  btnPeek:[['いつも表（はじめの設定）',()=>!SETTINGS.peekSet,()=>{SETTINGS.peekSet=false;delete SETTINGS.peek;saveSettings();renderPeek();if(S&&S.players)render()}],['めくって見る',()=>!!SETTINGS.peekSet&&!!SETTINGS.peek],['いつも表',()=>!!SETTINGS.peekSet&&!SETTINGS.peek]],
  btnSound:[['オフ',()=>(+SETTINGS.sound||0)===0],['効果音だけ',()=>(+SETTINGS.sound||0)===1],['すべて',()=>(+SETTINGS.sound||0)===2]],
  btnSpeed:[['ふつう',()=>SETTINGS.speed!=='fast'],['速い',()=>SETTINGS.speed==='fast']],
  btnCam:[['強め',()=>camSet()==='strong'],['控えめ',()=>camSet()==='soft'],['オフ',()=>camSet()==='off']],
  btnMuck:[['見せる',()=>!SETTINGS.muck],['伏せる',()=>!!SETTINGS.muck]],
  btnCount:[['だいたい',()=>SETTINGS.count!=='exact'],['正確',()=>SETTINGS.count==='exact']],
  btnTalk:[['オン',()=>talkSet()==='on'],['少なめ',()=>talkSet()==='less'],['オフ',()=>talkSet()==='off']]};
const SET64_SW={btnDepth:()=>!!SETTINGS.depth,btnClock:()=>!!SETTINGS.clock,btnQuiz:()=>!!SETTINGS.quiz,btnAllin:()=>SETTINGS.allinConfirm!==false,btnFoldFast:()=>SETTINGS.foldFast!==false,
  btnNovice:()=>{try{return novice()}catch(e){return true}},btnFont:()=>SETTINGS.font==='big',btnC4:()=>!!SETTINGS.c4,btnVib:()=>SETTINGS.vib!==false,btnNextv:()=>SETTINGS.nextv!==false};
(function(){const box=$('setIn');if(!box)return;const det=box.querySelector('.setmore')||(()=>{const d=document.createElement('details');d.className='setmore';d.innerHTML='<summary>くわしい設定</summary>';box.appendChild(d);return d})();
  const rowOf=id=>{const b=$(id);return b&&b.closest('.setrow')};
  const q=document.createElement('div');q.className='setq';q.innerHTML='<h3 class="seth">よく使う</h3>';
  ['btnPeek','btnSound','btnSpeed'].forEach(id=>{const r=rowOf(id);if(r)q.appendChild(r)});
  box.insertBefore(q,box.querySelector('.sethead').nextSibling);
  // 残りは全部「くわしい設定」へ（呼び名・プレイヤーネーム・身なりも）
  [...box.children].forEach(el=>{if(el===q||el===det||el.classList.contains('sethead'))return;if(el.classList.contains('setrow'))det.appendChild(el)});
  box.appendChild(det);
  // 3択以上：今の値だけを出し、押すと選べる（ネイティブの選択）
  Object.keys(SET64_SEL).forEach(id=>{const b=$(id);if(!b)return;const r=b.closest('.setrow');if(!r)return;
    const s=document.createElement('select');s.className='selpick';s.id='sel_'+id;const nm=r.querySelector('b');if(nm)s.setAttribute('aria-label',nm.textContent);
    s.innerHTML=SET64_SEL[id].map(([t],k)=>`<option value="${k}">${esc(t)}</option>`).join('');
    s.onchange=()=>{const o=SET64_SEL[id][+s.value];if(!o)return;if(o[2])o[2]();else for(let n=0;n<5&&!o[1]();n++)b.click();setSync()};
    b.classList.add('setorig');b.after(s)});
  // 2択：スイッチ
  Object.keys(SET64_SW).forEach(id=>{const b=$(id);if(!b||!b.closest('#setIn'))return;b.classList.add('sw64');b.setAttribute('role','switch');
    b.addEventListener('click',()=>setTimeout(setSync,0))});
  ['btnSet','mSet'].forEach(id=>{const b=$(id);if(b)b.addEventListener('click',()=>{setSync();const d=box.querySelector('.setmore');if(d)d.open=false})});
  setSync()})();
function setSync(){Object.keys(SET64_SEL).forEach(id=>{const s=$('sel_'+id);if(!s)return;const L=SET64_SEL[id];let k=L.findIndex(o=>{try{return o[1]()}catch(e){return false}});if(k<0)k=0;
    if(id==='btnPeek')s.options[0].hidden=s.options[0].disabled=!!SETTINGS.peekSet;if(s.value!==String(k))s.value=String(k)});
  Object.keys(SET64_SW).forEach(id=>{const b=$(id);if(!b||!b.classList.contains('sw64'))return;let v=false;try{v=SET64_SW[id]()}catch(e){}b.setAttribute('aria-checked',String(!!v))})}

// ---------- §C-2：章の一覧は1章1行 ----------
// 左に番号、中に「題名 ★★☆」と小さな行「店の名前・常連度」、右に主ボタンと「⋯」。⋯ の中：この店で遊ぶ／会話を見る／星の課題／壁の写真・手に入れた服
function chCompact(list){if(!list)return;const ans=$('answerNote')?$('answerNote').textContent:'';
  list.querySelectorAll(':scope > li.ch').forEach(li=>{if(li.classList.contains('c64'))return;li.classList.add('c64');
    const t=li.querySelector('.t'),v=li.querySelector('.v'),act=li.querySelector('.act');
    li.querySelectorAll('.t .done').forEach(e=>e.remove());
    {const st=li.querySelector('.t .stars3');if(st&&v){v.prepend(st)}}
    if(t){const tt=document.createElement('span');tt.className='tt';[...t.childNodes].filter(n=>n.nodeType===3&&n.data.trim()).forEach(n=>tt.appendChild(n));t.prepend(tt);if(!tt.textContent)tt.remove()}
    const menu=document.createElement('div');menu.className='chmenu';
    const add=el=>{if(el)menu.appendChild(el)};
    if(v){v.querySelectorAll('.storebtn').forEach(b=>{add(b);if(b.dataset.memo&&ans){const p=document.createElement('p');p.className='chans';p.textContent=ans;add(p)}});
      const ph=[...v.querySelectorAll('.photo,.fitgot')];if(ph.length){const w=document.createElement('div');w.className='chgot';ph.forEach(x=>w.appendChild(x));add(w)}}
    add(li.querySelector('.stask'));
    // 「店の名前・常連度」の小さな行
    if(v){const reg=v.querySelector('.reg');if(reg){reg.textContent=reg.textContent.replace(/^常連度\s*/,'');const lb=document.createElement('span');lb.className='reglb';lb.textContent='常連度';reg.prepend(lb)}}
    if(menu.children.length){const d=document.createElement('details');d.className='chmore';d.innerHTML='<summary aria-label="その他の項目">⋯</summary>';d.appendChild(menu);
      (act||li).after(d);d.addEventListener('toggle',()=>{if(d.open)list.parentElement.querySelectorAll('details.chmore[open]').forEach(x=>{if(x!==d)x.open=false})})}
    else{const sp=document.createElement('span');sp.className='chmore none';(act||li).after(sp)}})}
{const o=showChapters;showChapters=function(){const r=o.apply(this,arguments);try{chCompact($('chList'));chCompact($('chList2'));$('answerNote').hidden=true}catch(e){}return r}}
document.addEventListener('pointerdown',e=>{if(e.target.closest&&e.target.closest('details.chmore'))return;document.querySelectorAll('details.chmore[open]').forEach(d=>d.open=false)},true);

// ---------- v66：相手の顔（目から口）を卓の上で切らない（テスター目線 3、横画面の一騎打ち） ----------
// 胸像の下の端はふだん卓の高さの 37%。大きい胸像（一騎打ち・強いキャラ）や背の低い卓（スマホ横）では頭が上に切れるので、
// 下の端を名札の手前まで下げ、それでも入らなければ少し小さくする。顔の比率は qa/checks/ui.js と同じ（目 37%・口 57%、頭の上 20%）。
// 動作の重さの改善 案3：描き直しの後の位置合わせ（36_layout_pass の合図 'layout'）で呼ぶ。全部戻す→全部測る→全部書く（中身は今までと同じ）
function faceFit(){const B=$('busts'),P=$('plates');if(!B||!P||$('game').hidden||!B.clientHeight)return;
  const H=B.clientHeight,pr0=P.getBoundingClientRect(),k=pr0.height/(P.offsetHeight||1)||1,m=Math.max(6,H*.02);
  // 縮める前の高さ（h0）は、胸像の作り・置き場所・卓の大きさが前と同じなら前に測った値を使う（戻して測り直すと形の計算が増えるため）。
  // 1秒ごとの見回りと画面の大きさが変わった時は、全部戻して測り直す（LP.full）
  const full=typeof LP!=='undefined'&&LP.full,bs=[...B.querySelectorAll('.bust')],keyOf=b=>{const bd=b.querySelector('.body');return b.className+'|'+(bd&&bd.dataset.mood)+'|'+b.style.left+'|'+B.clientWidth+'|'+H};
  bs.forEach(b=>{if((b.style.bottom||b.style.maxWidth)&&(full||b._ffk!==keyOf(b))){b.style.bottom='';b.style.maxWidth='';b._ffmw=b._ffbt=''}});
  const out=bs.map(b=>{const pl=$('plate'+b.id.slice(4));if(!pl||!pl.offsetParent)return[b,'',''];
    const kb=keyOf(b),pt=(pl.getBoundingClientRect().top-pr0.top)/k-4,h0=b.style.maxWidth&&b._ffk===kb&&b._ffh0?b._ffh0:b.offsetHeight,base=H*.37;
    // v71（改善提案§2）：横画面の1対1は、胸像の上の端を画面の中に入れる（上端は胸像の高さの6%下＝絵の頭の上の分も入れる。口は名札の上）。縁と名札は CSS で下げてある
    const hu=LAND64()&&N()===2,h=hu?Math.min(h0,(pt-m)/.63):Math.min(h0,(pt-m)/.37),bot=hu?Math.max(base,h*1.06+1):Math.max(base,.8*h+m);
    b._ffk=kb;b._ffh0=h0;
    if(!(h>40))return[b,'',''];
    return[b,h<h0-1?h.toFixed(1)+'px':'',bot>base+1?(H-bot).toFixed(1)+'px':'']});
  // 前と同じ値なら書かない
  out.forEach(([b,mw,bt])=>{if((b._ffmw||'')!==mw||!mw!==!b.style.maxWidth){b.style.maxWidth=mw;b._ffmw=mw}if((b._ffbt||'')!==bt||!bt!==!b.style.bottom){b.style.bottom=bt;b._ffbt=bt}});
  // 卓が見える前（相手紹介の間など）に出た吹き出しは置き場所が決まっていないので、見えてから1回だけ置き直す
  document.querySelectorAll('#sayLayer .say.go').forEach(sy=>{if(sy._fitSeq===sy.dataset.seq||sy.classList.contains('side'))return;sy._fitSeq=sy.dataset.seq;try{sayPlace(sy);sy._lpSay=0}catch(e){}})}
LT.on('layout',()=>{try{faceFit()}catch(e){}});

// ---------- v66：「やめる」の確認を開くときは、操作の案内を閉じる（テスター目線 8） ----------
{const q=$('btnQuit');if(q)q.addEventListener('click',()=>{try{if(typeof tourI!=='undefined'&&tourI>=0)endTour()}catch(e){}},true)}
