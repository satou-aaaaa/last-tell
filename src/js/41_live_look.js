/* ---------- ライブポーカーらしい見た目（2026-10-15、satou「全部かなりいいですね」。research/ライブポーカーらしい見た目_実装仕様.md） ---------- */
// 1.0 は案1〜案5（案5は止まった絵）。重さのため filter は使わない。動くのはバーン・めくり・飲み物だけ。
// 札の動きや小物は、手の強さ・行動・テルと関係させない（選ぶのは LT.rand だけ）。状態は S.ll にまとめる。
const FELT_PRINT={
  '港のバー「錨亭」':        {ja:'錨亭',   en:'THE ANCHOR',      sub:'THE ANCHOR ・ HARBOR BAR'},
  '錨亭、閉店後':            {ja:'錨亭',   en:'THE ANCHOR',      sub:'THE ANCHOR ・ AFTER HOURS'},
  '古いクラブ「銀の扉」':    {ja:'銀の扉', en:'SILVER DOOR',     sub:'THE SILVER DOOR ・ CLUB'},
  'ジャズクラブ「月影」':    {ja:'月影',   en:'MOONSHADE',       sub:'MOONSHADE ・ JAZZ CLUB'},
  'ホテルのラウンジ「天空」':{ja:'天空',   en:'SKYLINE',         sub:'SKYLINE ・ HOTEL LOUNGE'},
  '地下の賭場跡':            {ja:'',       en:'',                sub:''},            // 印刷なし（古いラシャ、すり切れ）
  'ポーカールーム「王冠」':    {ja:'王冠',   en:'THE CROWN',       sub:'THE CROWN ・ POKER ROOM'},
  '汐見の古い店「舫」':      {ja:'舫',     en:'MOORINGS',        sub:'MOORINGS ・ SHIOMI'},
  '月影から、地下の賭場跡へ':{ja:'月影',   en:'MOONSHADE',       sub:'MOONSHADE ・ JAZZ CLUB'},
};
// フリー対戦・はしご・日替わりなど ch.venue が無いときは「錨亭」。回想（CFG.flashback）は印刷なし。

// 案4 カップホルダーの飲み物（お酒は出さない）
const DRINK={
  '港のバー「錨亭」':'coffee', '錨亭、閉店後':'tea', '古いクラブ「銀の扉」':'soda',
  'ジャズクラブ「月影」':'tea', 'ホテルのラウンジ「天空」':'water', '地下の賭場跡':'coffee',
  'ポーカールーム「王冠」':'water', '汐見の古い店「舫」':'tea', '月影から、地下の賭場跡へ':'coffee',
};
const DRINK_LOOK={ // 上から見た丸：縁の色、中身の色
  coffee:{rim:'#e9e4da',fill:'#3b2414'}, tea:{rim:'#e9e4da',fill:'#9a5a22'},
  soda:{rim:'#9fb3b8',fill:'#6f9a98'},  water:{rim:'#9fb3b8',fill:'#7fa3a8'},   // v85 レビュー：白い丸だとボタンに見えるので、少し暗い青緑
};

// 案2 相手のプロテクター：主なキャラは決まった小物。ここに無い人は名前のハッシュで3人に1人だけ「チップ1枚」を置く
const OPP_PROTECTOR={
  'ゲン':{kind:'coin',ring:'#8d6b3a',face:'#c9a45c',label:{ja:'古いコイン',en:'old coin'}},
  'レイカ':{kind:'coin',ring:'#6d1f2a',face:'#d4a3ad',label:{ja:'口紅のふた',en:'lipstick cap'}},
  'ハヤト':{kind:'chip',ring:'#1f3d6e',face:'#e8e3d6',label:{ja:'青いチップ',en:'blue chip'}},
  'ソウ':{kind:'coin',ring:'#3c4a3f',face:'#9fb59f',label:{ja:'翡翠の石',en:'jade stone'}},
  'クロウ':{kind:'coin',ring:'#111',face:'#444',label:{ja:'黒いコイン',en:'black coin'}},
  'カイ':{kind:'chip',ring:'#7a1d24',face:'#e8e3d6',label:{ja:'赤いチップ',en:'red chip'}},
  'テツ':{kind:'coin',ring:'#5a5a5a',face:'#a9a9a9',label:{ja:'ナット',en:'hex nut'}},
  'ミナ':{kind:'coin',ring:'#8a6a9e',face:'#e3d4ff',label:{ja:'貝のボタン',en:'shell button'}},
  'ハル':{kind:'chip',ring:'#2f8a55',face:'#e8e3d6',label:{ja:'緑のチップ',en:'green chip'}},
  'ジン':null, // ジンは置かない（第7章の本物のテルの見え方を変えないため）
};

const llEasy=()=>!!(CFG&&CFG.ch&&!CFG.ch.p2&&CFG.ch.no<=3);   // 第1〜3章は練習：数字の大きさを今のまま

// ===== 案3：札を文字に =====
// 「勝ち +」「フォールド」「伏せた」「あなたのチップ」の札は CSS で隠す（01e_style_live_look.css）。ここでは #game に章の印を付けるだけ
function llMark(){const g=$('game');if(g)g.classList.toggle('ll-easy',llEasy())}
LT.on('startHand:before',()=>{try{llMark();if(S)S.ll={}}catch(e){}});
LT.on('render',()=>{try{llMark()}catch(e){}});

// ===== 案1：道具と印刷 =====
// ラシャの印刷：店の名前（回想は空、地下の賭場跡は空でラシャがすり切れている）
function llPrint(){const f=$('felt'),z=f&&f.querySelector('.potzone');if(!z)return;
  const v=CFG&&CFG.ch&&CFG.ch.venue||'',fp=CFG.flashback?{ja:'',en:'',sub:''}:(FELT_PRINT[v]||FELT_PRINT['港のバー「錨亭」']);
  const en=I18N.lang==='en',big=en?fp.en:fp.ja,sub=en?(fp.sub.split('・')[1]||'').trim():fp.sub;
  if(z.dataset.print!==big)z.dataset.print=big;if(z.dataset.sub!==sub)z.dataset.sub=sub;
  f.classList.toggle('worn',!CFG.flashback&&!!v&&FELT_PRINT[v]&&!fp.ja)}
// 席番号：ディーラーの声・名前の重なりと同じ番号（自分が1、配列の順）。15px の丸を席の札の横（卓側）に置く。札・名札・チップに重なるなら出さない
function llSeats(){const tb=$('table');if(!tb||!S||!S.players)return;
  let L=tb.querySelector(':scope > .llseats');if(CFG.flashback){if(L)L.remove();return}
  const k=String(S.players.length);if(L&&L.dataset.k===k)return;
  if(!L){L=document.createElement('div');L.className='llseats';L.setAttribute('aria-hidden','true');tb.appendChild(L)}
  L.dataset.k=k;L.innerHTML=S.players.map((p,i)=>`<i data-i="${i}" data-n="${i+1}"></i>`).join('')}   // 数字は ::before（飾りなので読み上げ・文字の検査に入れない）
const LL_SEAT_NEAR=64;   // 席番号の丸の上の端は、名札の下の端から 64px 以内（ふだんは 40px ほど）
function llSeatsPlace(){const L=document.querySelector('#table > .llseats'),tb=$('table');if(!L||!tb)return;
  const T=tb.getBoundingClientRect(),vis=e=>e&&e.offsetParent&&e.getBoundingClientRect().width>2,R=e=>e.getBoundingClientRect(),z=15;
  const av=[...document.querySelectorAll('.felt .spot .card, .felt .spot .mystack, .felt .spot .chipwrap, #plates .plate, #plates .cue, #boardCards .card, #potSign, #mine .card, #mine .me-ava, #mine .mystack, #mine .mybet, #dbtn, .dbadge, .felt .boardspot > .lltools:not(.off), #table > .cup:not(.off), #busts .bust .body, #mine .vfturn:not([hidden]), #plates .plate > .ltact:not([hidden]), #table > .vfres')].filter(vis).map(R);   // 「あなたの番」・勝ち負けの札（v96 CI：縦の5人卓で .vfres に席番号が重なった）（v91.1 CI：PC で自分の席番号が重なった）
  const ok=(x,y)=>x>=T.left&&x+z<=T.right&&y>=T.top&&y+z<=T.bottom&&!av.some(q=>x-1<q.right&&q.left<x+z+1&&y-1<q.bottom&&q.top<y+z+1);   // 1px あける：置く位置を整数に丸めると 0.5px 札にかかる（v0.97.2 CI：7×0px）
  const hard=[...document.querySelectorAll('#dbtn, .dbadge, #boardCards .card, .felt .spot .card, #mine .card, #plates .cue, #mine .vfturn:not([hidden]), #plates .plate > .ltact:not([hidden]), #table > .vfres')].filter(vis).map(R);
  const okCorner=(x,y)=>x>=T.left&&x+z<=T.right&&y>=T.top&&!hard.some(q=>x-1<q.right&&q.left<x+z+1&&y-1<q.bottom&&q.top<y+z+1);
  [...L.children].forEach(el=>{const i=+el.dataset.i,p=S.players[i];let h=i?$('spot'+i)&&$('spot'+i).querySelector('.hand'):$('mine')&&$('mine').querySelector('.hold');
    let r=vis(h)&&h.querySelector('.card')?R(h):null;
    if(!r&&i){const sp=$('spot'+i);if(sp){const q=R(sp);r={left:q.left+q.width/2-14,right:q.left+q.width/2+14,top:q.top,bottom:q.top+20,height:20}}}
    if(!r||!p||p.out){el.hidden=true;return}
    const cy=r.top+(r.height-z)/2,cs=i?[[r.left-z-6,cy],[r.right+6,cy]]:[];
    // 名札から離れすぎた横は使わない（v0.98.7 レビュー：ターンを配る途中で、席の札の箱が場札の列まで伸びて測られ、③④ が場札の上に出た）
    const pl=i&&$('plate'+i),pr=vis(pl)?R(pl):null,near=([x,y])=>!pr||y<=pr.bottom+LL_SEAT_NEAR;
    let c=cs.find(([x,y])=>near([x,y])&&ok(x,y));
    // 横に場所がなければ名札（自分は顔）の左上の角に重ねて付ける（席の札のように）
    // 横に場所がなければ名札（自分は顔）の左上、だめなら右上の角に重ねる。D・場札・札に重なるなら出さない（v85 レビュー）
    if(!c){const t=i?$('plate'+i):$('mine')&&$('mine').querySelector('.me-ava');if(vis(t)){const q=R(t);c=[[q.left-z/2,q.top-z/2],[q.right-z/2,q.top-z/2]].find(([x,y])=>okCorner(x,y))}}
    el.hidden=!c;if(c){el.style.left=(c[0]-T.left).toFixed(0)+'px';el.style.top=(c[1]-T.top).toFixed(0)+'px'}})}
// ディーラーの道具：チップのラックと伏せた山（場札のまわりの空いている所。動かない絵）
function llTools(){const bs=document.querySelector('.felt .boardspot');if(!bs)return;
  if(CFG.flashback){const o=bs.querySelector(':scope > .lltools');if(o)o.remove();return}
  if(bs.querySelector(':scope > .lltools'))return;
  const t=document.createElement('div');t.className='lltools';t.setAttribute('aria-hidden','true');
  t.innerHTML=`<div class="dtray"><i></i><i></i><i></i><i></i><i></i></div><div class="ddeck">${cardHTML({},true)}</div>`;bs.appendChild(t)}
// バーン：場札を出すたびに、山から捨て札の山へ伏せた札が1枚滑る（ハンドの終わりの片付けで一緒に消える）
function llBurn(){if(CFG.flashback||typeof muckAdd!=='function')return;(S.ll=S.ll||{}).burns=(S.ll.burns||0)+1;
  const dk=document.querySelector('.felt .lltools .ddeck'),pile=muckPile();
  const a=dk&&fxRect(dk),b=pile&&fxRect(pile),L=fxLayer();
  if(reducedMotion()||!a||!b||!L||!dk.offsetParent||dk.closest('.off')){muckAdd();return}
  const el=document.createElement('div');el.className='llburn';el.innerHTML=cardHTML({},true);L.appendChild(el);
  const w=a.w,P=(x,y,r)=>`translate(${x-w/2}px,${y}px) rotate(${r}deg)`;el.style.width=w+'px';
  LT.anim(el,[{transform:P(a.x+a.w/2,a.y,0)},{transform:P(b.x+b.w/2,b.y+b.h/2-w*.7,-14)}],{duration:220*Math.max(.6,SPEED()),easing:'ease-out'},()=>{el.remove();muckAdd()})}
// 場札を出す前（本物の順）。リバーのあと（ショーダウンへ）とハンドの終わりは出さない
LT.on('nextStreet:before',()=>{try{if(S&&!S.handOver&&!S.reveal&&['preflop','flop','turn'].includes(S.street))llBurn()}catch(e){}});
LT.on('render',()=>{for(const f of [llPrint,llSeats,llTools])try{f()}catch(e){}});
// 置き場所：捨て札の山の左 → 場札の下の真ん中 → 場札の右 → 場札の上 → 場札の下（右・左）。場札・相手の札・ポット・クセの札・名札・手元に重ならない最初の場所。どこも重なるなら出さない
function llToolsPlace(){const t=document.querySelector('.felt .boardspot > .lltools'),bs=t&&t.parentNode,bd=$('boardCards'),tb=$('table');if(!t||!bd||!tb)return;
  t.classList.remove('off','vert');t.style.left=t.style.top='';t.style.scale='';
  const B=bs.getBoundingClientRect(),sx=B.width/(bs.offsetWidth||1)||1,sy=B.height/(bs.offsetHeight||1)||1,T=tb.getBoundingClientRect();
  const vis=e=>e&&e.offsetParent&&e.getBoundingClientRect().width>2,mp=document.querySelector('.felt .boardspot > .muckpile'),m=mp&&mp.getBoundingClientRect();
  // 場札は箱より大きく描かれることがある（遠近）ので、箱と札を合わせた四角で測る
  const cr=[...bd.querySelectorAll('.card')].filter(vis).map(e=>e.getBoundingClientRect()),d0=bd.getBoundingClientRect();
  cr.push(d0);const d={left:Math.min(...cr.map(q=>q.left)),right:Math.max(...cr.map(q=>q.right)),top:Math.min(...cr.map(q=>q.top)),bottom:Math.max(...cr.map(q=>q.bottom))};{const fc=[...bd.querySelectorAll('.card')].filter(vis).map(e=>e.getBoundingClientRect()).sort((a,b)=>a.left-b.left);if(fc.length>=2){const st=fc[1].left-fc[0].left;d.right=Math.max(d.right,fc[0].left+st*4+fc[0].width)}}   // まだ出ていない場札の場所も空けておく
  d.left-=8;d.right+=8;d.top-=8;d.bottom+=10;d.width=d.right-d.left;d.height=d.bottom-d.top;   // 札が少し持ち上がる・カメラが寄ることがあるので余白
  const av=[...document.querySelectorAll('#boardCards .card, #board2 .card, .felt .spot .card, .felt .spot .mystack, .felt .spot .chipwrap, #potSign, #potChips .chip, #plates .cue, #plates .plate, #mine .hold, #mine .card, #mine .mystack, #mine .me-ava, #mine .chp, #mine .mybet .chip, .muckpile .muckcard, #dcall.go, #sensei, #busts .bust .body, #table > .vfres')].filter(vis).map(e=>e.getBoundingClientRect());
  let w,h;const ok=(x,y)=>x>=T.left+4&&x+w<=T.right-4&&y>=T.top&&!av.some(q=>x<q.right+4&&q.left-4<x+w&&y<q.bottom+4&&q.top-4<y+h);   // 4px あける
  const size=()=>{const r=t.getBoundingClientRect();w=r.width;h=r.height};size();
  const mc=[...document.querySelectorAll('.felt .boardspot > .muckpile .muckcard')].filter(vis).map(e=>e.getBoundingClientRect()),mb=Math.max(d.bottom,...mc.map(q=>q.bottom));
  const cands=()=>{const cs=[];if(m)cs.push([m.left-34*sx-w,m.top-h/2],[Math.max(T.left+6,m.left-w/2),mb+6]);   // 捨て札の山の左、山の下
    cs.push([d.left+(d.width-w)/2,d.bottom+8],[d.right+12,d.top+(d.height-h)/2],[d.left+(d.width-w)/2,d.top-h-8],[d.left,d.top-h-8],[d.right-w,d.bottom+8],[d.left,d.bottom+8],[d.right-w,d.top-h-8],[d.left-12-w,d.top+(d.height-h)/2]);return cs};
  let cs=cands(),c=cs.find(([x,y])=>ok(x,y));
  // 横に置けないとき（スマホ横など）は、ラックを縦にして場札の左右のすき間へ
  if(!c){t.classList.add('vert');size();const my=d.top+(d.height-h)/2;cs=[[d.left-8-w,my],[d.right+8,my]];if(m)cs.push([(m.right+d.left-w)/2,my]);c=cs.find(([x,y])=>ok(x,y))}
  // v95.3 レビュー：縦の6人卓のリバーで置けない回が多い。消す前に 0.7 倍に縮めて（横・縦の順に）もう一度探す。左上を軸に縮めるので、測った場所がそのまま左上になる
  if(!c){t.style.transformOrigin='0 0';t.style.scale='.7';for(const v of [false,true]){t.classList.toggle('vert',v);size();cs=cands();if(v){const my=d.top+(d.height-h)/2;cs.push([d.left-8-w,my],[d.right+8,my]);if(m)cs.push([(m.right+d.left-w)/2,my])}c=cs.find(([x,y])=>ok(x,y));if(c)break}}
  if(!c){t.style.scale='';t.classList.remove('vert');t.classList.add('off');return}
  t.style.left=((c[0]-B.left)/sx).toFixed(1)+'px';t.style.top=((c[1]-B.top)/sy).toFixed(1)+'px';
  // 卓の奥行き（遠近）で、置いた場所が測った場所からずれることがある（v96 レビュー：横で 16px 右にずれて .vfres にかかった）。ずれた分を1回だけ戻し、それでも何かにかかるなら出さない
  {const r=t.getBoundingClientRect(),ex=c[0]-r.left,ey=c[1]-r.top;if(Math.abs(ex)>1||Math.abs(ey)>1){t.style.left=(parseFloat(t.style.left)+ex/sx).toFixed(1)+'px';t.style.top=(parseFloat(t.style.top)+ey/sy).toFixed(1)+'px';
    const q=t.getBoundingClientRect();if(av.some(a=>q.left<a.right&&a.left<q.right&&q.top<a.bottom&&a.top<q.bottom)){t.style.scale='';t.classList.remove('vert');t.classList.add('off')}}}}
// 札が配られる動きの途中で測ると小さく出るので、動きが終わったころにもう1回
// 置き場所の計算は、ハンド・通り・画面の大きさ・席の数・答え待ちが変わったときだけ（毎回の layout では測らない。v85 レビュー：重さ）
let llPlaceT=0,llPlaceK='';
const llKey=()=>S?[S.handNo,S.street,S.handOver?1:0,S.board.length,innerWidth,innerHeight,S.players.length,S.toAct===0?1:0,document.body.classList.contains('en')?1:0,S.players.map(p=>(p.show?1:0)+(p.folded?2:0)+(p.mucked?4:0)).join('')].join('|'):'';   // 見せた札・降りた札で席の札の場所が変わるので、そのときも置き直す（v89.1 CI：WebKit 縦で勝った札に席番号が重なった）
function llPlaceAll(){try{llToolsPlace()}catch(e){}try{llCupPlace()}catch(e){}try{llSeatsPlace()}catch(e){}}
// 鍵が同じでも、席番号が D・場札・札・行動の語に重なっていたら置き直す（1秒に1回まで。v91 CI：WebKit 横で札が後から動いて重なったまま残った）
let llSeatChkAt=0;
function llSeatsBad(){const L=document.querySelector('#table > .llseats');if(!L)return false;const R=e=>e.getBoundingClientRect(),vis=e=>e&&e.offsetParent&&R(e).width>2;
  const nums=[...L.children].filter(e=>!e.hidden&&vis(e)).map(R);if(!nums.length)return false;
  const hard=[...document.querySelectorAll('#dbtn, .dbadge, #boardCards .card, .felt .spot .card, #mine .card, #mine .vfturn:not([hidden]), #plates .plate > .ltact:not([hidden]), #table > .vfres')].filter(vis).map(R);
  if(nums.some(a=>hard.some(q=>a.left<q.right&&q.left<a.right&&a.top<q.bottom&&q.top<a.bottom)))return true;
  // 名札から離れすぎていても置き直す（v0.98.7 レビュー：配る途中の箱で測って、場札の列の高さに残った）
  return [...L.children].some(e=>{if(e.hidden||!vis(e))return false;const i=+e.dataset.i,pl=i&&$('plate'+i);return !!(pl&&vis(pl)&&R(e).top>R(pl).bottom+LL_SEAT_NEAR)})}
// 1秒に1回のときに外れた分は、1秒たったところで1回だけ測る（v92.2 CI：配った札の上に席番号が残った。その後 layout が来なかった）
function llSeatChk(){llSeatChkAt=Date.now();clearTimeout(llSeatChk.t);llSeatChk.t=0;try{if(llSeatsBad())llSeatsPlace()}catch(e){}}
LT.on('layout',()=>{const k=llKey();if(k===llPlaceK){const w=1000-(Date.now()-llSeatChkAt);if(w<=0)llSeatChk();else if(!llSeatChk.t)llSeatChk.t=setTimeout(llSeatChk,w);return}llPlaceK=k;llPlaceAll();clearTimeout(llPlaceT);llPlaceT=setTimeout(llPlaceAll,900)});

// ===== 案2：相手の伏せ札 =====
// 寝かせた2枚の上に、主なキャラは自分の小物。ほかの人は名前で決まる3人に1人だけチップ1枚。ジンは置かない
const LL_CHIP=['#e8e3d6','#a8323a','#2a5aa0','#2f8a55','#2a2a2a'];
const llHash=s=>[...String(s)].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);
function llProt(name){if(name in OPP_PROTECTOR)return OPP_PROTECTOR[name];
  const h=llHash(name);return h%3===0?{kind:'chip',ring:LL_CHIP[(h>>3)%5],face:'#e8e3d6'}:null}
function llProtectors(){if(!S||!S.players||CFG.flashback)return;
  S.players.forEach((p,i)=>{if(!i||p.human)return;const h=$('spot'+i)&&$('spot'+i).querySelector('.hand');if(!h)return;
    const pr=!p.out&&!p.folded&&p.hand.length&&!h.querySelector('.card:not(.back)')&&llProt(p.name),o=h.querySelector(':scope > .oprot');
    if(!pr){if(o)o.remove();return}if(o)return;
    const e=document.createElement('span');e.className='oprot '+pr.kind;e.setAttribute('aria-hidden','true');
    e.style.setProperty('--ring',pr.ring);e.style.setProperty('--face',pr.face);h.appendChild(e)})}
// めくって見直す：フロップかターンのあと、残っている相手から乱数だけで1人（手の強さ・行動・テルとは関係させない）。1ハンド1回、第7章は出さない
function llPeek(){if(!S||S.handOver||CFG.flashback||(CFG.ch&&CFG.ch.no===7&&!CFG.ch.p2))return;
  const ll=S.ll=S.ll||{};if(ll.peekHand===S.handNo)return;
  if(S.street!=='flop'&&S.street!=='turn')return;
  if(S.street==='flop'&&LT.rand()<.5)return;                                  // フロップで出なければターンで
  const c=S.players.map((p,i)=>i).filter(i=>i&&!S.players[i].human&&!S.players[i].folded&&!S.players[i].out&&!S.players[i].allIn);if(!c.length)return;
  ll.peekHand=S.handNo;const i=c[Math.floor(LT.rand()*c.length)];ll.peekWho=i;
  if(reducedMotion())return;
  setTimeout(()=>{const h=$('spot'+i)&&$('spot'+i).querySelector('.hand:not(.folded)');if(!h||!h.querySelector('.card.back'))return;
    h.classList.add('peekup');setTimeout(()=>h.classList.remove('peekup'),800)},600)}
LT.on('nextStreet',()=>{try{llPeek()}catch(e){}});
LT.on('render',()=>{try{llProtectors()}catch(e){}});

// ===== 案5：店の奥（止まった絵） =====
// 左右の端 18% ずつに、ランプの光・遠くの卓・客の影。canvas に1回だけ描いて data: の絵にする（毎フレーム描かない、filter なし）
const LL_BACK={};
function llBackDraw(lamp,side){const c=document.createElement('canvas'),W=180,H=400;c.width=W;c.height=H;const x=c.getContext('2d');if(!x)return'';
  const X=v=>side==='r'?W-v:v;
  // ランプの光の円錐
  const g=x.createLinearGradient(0,40,0,300);g.addColorStop(0,lamp+'55');g.addColorStop(1,lamp+'00');x.fillStyle=g;
  x.beginPath();x.moveTo(X(70),40);x.lineTo(X(98),40);x.lineTo(X(160),300);x.lineTo(X(8),300);x.closePath();x.fill();
  x.fillStyle=lamp+'cc';x.beginPath();x.ellipse(X(84),40,16,5,0,0,Math.PI*2);x.fill();
  x.strokeStyle='rgba(0,0,0,.6)';x.lineWidth=2;x.beginPath();x.moveTo(X(84),0);x.lineTo(X(84),36);x.stroke();
  // 遠くの卓：木の縁と緑のラシャ
  x.fillStyle='#3a2616';x.beginPath();x.ellipse(X(84),300,78,20,0,0,Math.PI*2);x.fill();
  x.fillStyle='#1f5a3c';x.beginPath();x.ellipse(X(84),299,70,16,0,0,Math.PI*2);x.fill();
  // 客の影（頭と肩だけ）：卓の奥に2人、手前に1人
  x.fillStyle='rgba(6,6,10,.92)';
  for(const [cx,cy,s] of [[44,272,.9],[120,268,.85],[150,330,1.15]]){const px=X(cx);
    x.beginPath();x.ellipse(px,cy-24*s,11*s,13*s,0,0,Math.PI*2);x.fill();
    x.beginPath();x.moveTo(px-30*s,cy+22*s);x.quadraticCurveTo(px-28*s,cy-8*s,px,cy-10*s);x.quadraticCurveTo(px+28*s,cy-8*s,px+30*s,cy+22*s);x.closePath();x.fill()}
  try{return c.toDataURL('image/png')}catch(e){return''}}
function llBackroom(){const tb=$('table'),rm=tb&&tb.querySelector(':scope > .room');if(!rm)return;
  const lamp=(tb.style.getPropertyValue('--lamp')||'#e2b65b').trim(),k=CFG.flashback?'':lamp;let b=rm.querySelector(':scope > .backroom');
  if(!k){if(b)b.remove();return}
  if(b&&b.dataset.k===k)return;
  if(!/^#[0-9a-f]{6}$/i.test(lamp))return;
  if(!LL_BACK[k])LL_BACK[k]={l:llBackDraw(lamp,'l'),r:llBackDraw(lamp,'r')};
  if(!b){b=document.createElement('div');b.className='backroom';b.setAttribute('aria-hidden','true');b.innerHTML='<i class="l"></i><i class="r"></i>';rm.appendChild(b)}
  b.dataset.k=k;b.children[0].style.backgroundImage=`url(${LL_BACK[k].l})`;b.children[1].style.backgroundImage=`url(${LL_BACK[k].r})`}
LT.on('render',()=>{try{llBackroom()}catch(e){}});

// ===== 案4：レールと飲み物 =====
// 自分の前に革のレールの弧、カップホルダーに店ごとの飲み物（お酒は出さない）。右下 → 左下 → 自分のチップの上 → 左。どこも重なるなら出さない
function llRail(){const tb=$('table');if(!tb)return;
  let r=tb.querySelector(':scope > .nrail');
  if(CFG.flashback){if(r)r.remove();const c=tb.querySelector(':scope > .cup');if(c)c.remove();return}
  if(!r){r=document.createElement('div');r.className='nrail';r.setAttribute('aria-hidden','true');const m=$('mine');tb.insertBefore(r,m||null)}
  const v=CFG&&CFG.ch&&CFG.ch.venue||'',d=DRINK[v]||DRINK['港のバー「錨亭」'],L=DRINK_LOOK[d];
  let c=tb.querySelector(':scope > .cup');
  if(!c){c=document.createElement('div');c.className='cup';c.setAttribute('aria-hidden','true');c.innerHTML='<i></i>';tb.insertBefore(c,r.nextSibling)}
  if(c.dataset.d!==d){c.dataset.d=d;c.style.setProperty('--rim',L.rim);c.style.setProperty('--fill',L.fill)}}
function llCupPlace(){const c=document.querySelector('#table > .cup'),tb=$('table');if(!c||!tb)return;
  const vis=e=>e&&e.offsetParent&&e.getBoundingClientRect().width>2,T=tb.getBoundingClientRect(),W=30;
  const av=[...document.querySelectorAll('#mine .mystack, #mine .card, #mine .chp, #mine .myhand, #mine .me-ava, #mine .tag, #mine .mybet, #acts, #askRow, #dcall.go, #controls, #sensei, #potSign, #btnNeedle, #btnStraddle, .felt .spot .card, #boardCards .card, #potChips .chip')].filter(vis).map(e=>e.getBoundingClientRect());
  const ok=(x,y)=>y+W<=T.bottom&&!av.some(q=>x<q.right&&q.left<x+W&&y<q.bottom&&q.top<y+W);
  const ms=$('mine')&&$('mine').querySelector('.mystack'),M=vis(ms)?ms.getBoundingClientRect():null;
  const cs=[[T.right-14-W,T.bottom-14-W],[T.left+14,T.bottom-14-W]];if(M){cs.push([M.right-W,M.top-W-8],[M.left-W-10,M.bottom-W])}
  const p=cs.find(([x,y])=>ok(x,y));c.classList.toggle('off',!p);if(p){c.style.left=(p[0]-T.left).toFixed(0)+'px';c.style.top=(p[1]-T.top).toFixed(0)+'px'}}
LT.on('render',()=>{try{llRail()}catch(e){}});

// ===== ハンドの終わり：勝った人の名札の縁だけ金色（第4章以降。字は出さない。次のハンドで消える）=====
// v85 レビュー、satou 2026-10-15 12:30Z「縁を金色に」。引き分けなら全員、自分なら顔の枠
function llWinEdge(){
  const on=S&&S.handOver&&S.players&&!llEasy();
  // アニメーションの重さ 案2（2026-10-17）：ハンドの途中は、付いている縁を外すだけ（測らない）。
  // 今までは打つたびに6人分の名札の大きさを測っていて、描き直しの直後に画面の計算をやり直させていた
  if(!on){document.querySelectorAll('.llwin').forEach(e=>e.classList.remove('llwin'));return}
  // ハンドの終わり：先に全員分を測ってから、まとめて付ける
  const R=S.players.map((p,i)=>{const t=i?$('plate'+i):$('mine')&&$('mine').querySelector('.me-ava');
    // 名札が空（縦の6人卓の横の席など）だと縁が小さな四角になるので、そのときは顔の下に金の線（v85.1 レビュー）
    return {t,b:i&&$('bust'+i),w:p.won>0,small:i&&t&&(t.offsetHeight<16||t.offsetWidth<28)}});
  R.forEach(({t,b,w,small})=>{if(b)b.classList.toggle('llwin',w&&!!small);if(t)t.classList.toggle('llwin',w&&!small)})}
LT.on('render',()=>{try{llWinEdge()}catch(e){}});
LT.on('endHand',()=>{try{llWinEdge()}catch(e){}});
// 名前の行が消えて名札が小さくなったとき（描き直しを待たずに位置合わせだけが走る）も測り直す。ハンドの終わりだけ（v89 レビュー：縦の6人卓で勝った横の席の名札が金の縁だけの四角に）
LT.on('layout',()=>{try{if(S&&S.handOver)llWinEdge()}catch(e){}});

// 字の無い名札（縦の6人卓の横の席など）は小さな黒い四角に見えるので隠す（番が来ているときは出す。v85.2 レビュー）
LT.on('render',()=>{try{const over=!!(S&&S.handOver);document.querySelectorAll('#plates .plate').forEach(pl=>{const e=!pl.textContent.trim();pl.classList.toggle('llempty',e);
  // ハンドの終わりは番の人がいないので、名札に残った .turn を外す（v89 レビュー：6人卓・縦の左右の席。最後にオールインした人の名札は、名前が消えると金の縁と光だけの小さな四角になっていた）
  if(over)pl.classList.remove('turn')})}catch(e){}});
