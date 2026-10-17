/* ---------- 誰が何をしたか（アクションのわかりやすさ 案1＋案2、satou 2026-10-17 06:16Z） ---------- */
// 案1：名札の下に、その人の今の行動の語だけ（額なし）。案2：ディーラーが「呼び名さん、レイズ 13,000」と名前つきで言う。
// 表示だけ。CPU の判断・考える時間・テルの出方は変えない。第7章・物語の一手では出さない（静けさを守る）
const AW={words:{'チェック':'call','コール':'call','ベット':'raise','レイズ':'raise','フォールド':'fold','ストラドル':'raise'},
  en:{'チェック':'Check','コール':'Call','ベット':'Bet','レイズ':'Raise','フォールド':'Fold','ストラドル':'Straddle'}};
const awEn=()=>typeof I18N!=='undefined'&&I18N.lang==='en';
const awQuiet=()=>!!(S&&(S.storyHand||(CFG&&CFG.ch&&!CFG.ch.p2&&CFG.ch.no===7)))||!!($('game')&&$('game').classList.contains('storyfinal'));
// 出す語（無ければ ''）。オールイン・勝ち・脱落・見ている は今の札があるので出さない
function awWord(p,i){
  if(!p||p.out||p.sitOut||p.allIn||p.won>0||S.handOver||S.toAct===i||!p.lastAct)return null;
  const w=String(p.lastAct).split(' ')[0];
  const k=AW.words[w]||(p.lastType==='fold'?'fold':p.lastType==='raise'?'raise':'call');   // ゲン・タロウの癖の語（「降り！」など）もそのまま
  const t=awEn()?(AW.en[w]||(typeof EN_DICT!=='undefined'&&EN_DICT[w])||w):w;
  return {t,k};
}
function actWords(){if(!S||!S.players)return;const quiet=awQuiet();
  S.players.forEach((p,i)=>{
    const box=i===0?document.querySelector('#mine .me-l'):$('plate'+i);if(!box)return;
    let el=box.querySelector(':scope > .ltact');
    const a=quiet?null:awWord(p,i);
    // フォールドの札（.tag.act-fold）が名札に見えているときは重ねて出さない（第4章からはその札は隠れている）
    const ft=a&&a.k==='fold'&&box.querySelector('.tag.act-fold'),dup=!!ft&&ft.getClientRects().length>0&&getComputedStyle(ft).visibility!=='hidden';
    if(!a||dup){if(el&&!el.hidden){el.hidden=true;el.dataset.t=''}return}
    if(!el){el=document.createElement('span');el.className='ltact';box.appendChild(el)}
    const cls='ltact '+a.k+(el.classList.contains('up')?' up':'');if(el.className!==cls)el.className=cls;   // 置き場所（up）は awPlace が決める。描き直しで外すと一瞬下に戻ってちらつく
    if(el.dataset.t!==a.t||el.hidden){el.textContent=a.t;el.dataset.t=a.t;el.hidden=false;
      el.classList.remove('awin');void el.offsetWidth;el.classList.add('awin')}
    // 名札がほかに字を持たないとき（縦の6人卓の横の席など）は、名札は隠したまま語だけ見せる
    if(i)box.classList.toggle('awOnly',![...box.childNodes].some(n=>n!==el&&(n.textContent||'').trim()));
  })}
{const o=render;render=function(){const r=o.apply(this,arguments);try{actWords()}catch(e){}return r}}

// 案2：ディーラーの声に呼び名と席番号。第7章・物語の一手では今のまま
function awCall(i,type,toCall){
  const p=S.players[i];if(!p||p.human||awQuiet())return;
  const en=awEn(),kind=type==='fold'?'fold':type==='call'?(toCall<=0?'check':'call'):(p.allIn?'allin':'raise');
  if(type==='raise'&&!p.allIn&&p.bet<=S.currentBet&&p.lastType!=='raise')return;   // 額の足りない上げ（コール扱い）は act の言い方のまま
  // 同じストリートで続けて降りた2人目からは言わない（名札の語で分かる）
  const A=S.aw=S.aw&&S.aw.h===S.handNo&&S.aw.st===S.street?S.aw:{h:S.handNo,st:S.street,fold:false};
  if(kind==='fold'){if(A.fold)return;A.fold=true}else A.fold=false;
  const known=typeof knownName==='function'?knownName(p.name):true,nm=typeof who==='function'?who(p.name):p.name;
  const bet=p.lastAct&&/^(ベット|ストラドル)/.test(p.lastAct)?'bet':'raise';
  let t;
  if(en){const head=known?((typeof EN_DICT!=='undefined'&&EN_DICT[p.name])||p.name):`Seat ${i+1}`;
    t=head+', '+{fold:'fold',check:'check',call:'call',allin:'all-in',raise:bet==='bet'?`bet ${fmt(p.bet)}`:`raise to ${fmt(p.bet)}`}[kind]}
  else{const head=nm+(known||nm===p.name?'さん':'の方');
    t=head+'、'+{fold:'フォールド',check:'チェック',call:'コール',allin:'オールイン',raise:(bet==='bet'?'ベット ':'レイズ ')+fmt(p.bet)}[kind]}
  dealerSay(t);
  // 席番号を小さく頭に（.llseats の番号と同じ）。英語で「Seat 3」と言うときは重なるので付けない
  try{const d=$('dcall');if(d&&!CFG.flashback&&!(en&&!known)){const sn=document.createElement('span');sn.className='sn';sn.textContent=String(i+1);d.prepend(sn);if(typeof dcallPlace==='function')dcallPlace()}}catch(e){}
}
{const o=afterAct;afterAct=function(i,type,toCall){const r=o.apply(this,arguments);try{awCall(i,type,toCall)}catch(e){}return r}}

// 置き場所（v0.90 の確認）：横画面ではチップの山・前に出したチップが名札のすぐ下に来るので、重なるときは名札の上（胸元）へ。
// どちらも重なるなら、重なりの小さい方。見えている語があるときだけ測る
function awPlace(){
  const els=[...document.querySelectorAll('#plates .plate > .ltact:not([hidden])')];if(!els.length)return;
  const vis=e=>e&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
  // チップの山の端に少しかかるのは読めるので軽く、席番号・D・吹き出し・札・ほかの席の名札・語と顔は重く数える（v91.2 レビュー：縦で左の席の頭に乗った）
  const av=[...document.querySelectorAll('.felt .spot .chipwrap, .felt .spot .mystack, #dbtn, .dbadge, .llseats i:not([hidden]), #sayLayer .say.go, #plates .say.go, #potSign, #boardCards .card:not(.slot), #plates .cue, #plates .plate, #plates .plate > .ltact:not([hidden]), #sayLayer .say, #plates .say')].filter(e=>vis(e)&&(!e.classList.contains('say')||+getComputedStyle(e).opacity>.05))
    .map(e=>{const r=e.getBoundingClientRect(),pl=e.closest('.plate'),bu=e.closest('.bust');return {r,el:e,k:/chipwrap|mystack/.test(e.className)?1:/dbadge/.test(e.className)||e.id==='dbtn'?8:4,pl,bu}}).filter(o=>o.r.width>1);
  // 吹き出しは .go に限らず、見えている物はすべて（v92 CI：出し終わって残った #say1 に「フォールド」がかかった）
  // ほかの席の顔（顔のまわりの空いた所は入れない faceBox。体の箱 .body は隣の席どうしで重なるほど大きいので使わない）
  {const L0=$('sayLayer'),lr=L0&&L0.getBoundingClientRect();if(lr&&typeof faceBox==='function')S.players.forEach((p,i)=>{if(!i||p.out)return;const f=faceBox(i);
    if(f)av.push({r:{left:lr.left+f.l,right:lr.left+f.r,top:lr.top+f.t,bottom:lr.top+f.b},k:4,bu:$('bust'+i)})})}
  // 今の場所で重ならなければ動かさない（測り直しを少なく）。重なるときは、名札の下のまま左右にずらす（0・±8・±14・±20・±28px）のを先に、
  // それでも重なるときだけ名札の上を試す（上は最後。v91.2 レビュー：席によって上と下に分かれて読みにくい）
  const gr=($('game')||document.body).getBoundingClientRect();
  els.forEach(el=>{const own=el.parentNode,i=String(own.id||'').replace('plate',''),ownB=$('bust'+i);
    const mine=av.filter(o=>o.el!==own&&o.el!==el&&!(ownB&&o.bu===ownB));   // 自分の名札の中の D（.dbadge）は避ける。名札そのものと自分の顔だけ外す
    // 自分の名札の名前と額の行は重く数える（v92.1 レビュー：縦6人卓で上下にずらした語が自分の名前を隠した）
    own.querySelectorAll(':scope > .nm, :scope > .chp').forEach(e=>{if(vis(e)){const r=e.getBoundingClientRect();if(r.width>1)mine.push({r,el:e,k:6})}});
    mine.forEach(o=>{if(o.el&&o.el.classList.contains('ltact'))o.r=o.el.getBoundingClientRect()});   // 先に置いたほかの席の語は、動かした後の場所で数える
    // 画面（#game）の左右からはみ出す分も重く数える（v93 レビュー：縦6人卓の端の席で「コール 5,0」と切れた）
    const cost=r=>mine.reduce((a,{r:q,k})=>{const w=Math.min(r.right,q.right)-Math.max(r.left,q.left),h=Math.min(r.bottom,q.bottom)-Math.max(r.top,q.top);return a+(w>0&&h>0?w*h*k:0)},0)+Math.max(0,gr.left+2-r.left,r.right-(gr.right-2))*(r.bottom-r.top)*8;
    // まわりと名札が前に測ったときと同じなら探し直さない（v92.2 CI：避けられない重なりがあると毎回100通り測り直して WebKit が落ちた）
    const pr=own.getBoundingClientRect(),key=[pr.left,pr.top,gr.left,gr.right,el.textContent,...mine.map(o=>o.r.left+','+o.r.top+','+o.r.width+','+o.r.height)].map(v=>typeof v==='number'?Math.round(v):v).join('|');
    if(el._awK===key)return;
    const c0=cost(el.getBoundingClientRect());if(!c0&&!el.classList.contains('up')){el._awK=key;return}
    let best={c:Infinity,up:false,dx:0,dy:0};
    // それでもかかるときだけ、少し上下にもずらす（v92.1 CI：残った #say1 に「フォールド」が 5px かかった）。上下は margin（下に付く .up は margin-bottom で同じ向きに動く。transform は blClamp が使う）
    out:for(const dy of [0,6,10,14])for(const up of [false,true])for(const dx of [0,-8,8,-14,14,-20,20,-28,28,-36,36,-44,44]){if(!dy&&Math.abs(dx)>28)continue;   // 上下は名札から離れる向きだけ（下の語は下へ、上の語は上へ）
      el.classList.toggle('up',up);el.style.marginLeft=dx?dx+'px':'';const yy=up?-dy:dy;el.style.marginTop=yy?yy+'px':'';el.style.marginBottom=yy?-yy+'px':'';
      const c=cost(el.getBoundingClientRect())+(up?.5:0)+(dy?.3:0);if(c<best.c)best={c,up,dx,dy:yy};if(c<1)break out}
    el.classList.toggle('up',best.up);el.style.marginLeft=best.dx?best.dx+'px':'';el.style.marginTop=best.dy?best.dy+'px':'';el.style.marginBottom=best.dy?-best.dy+'px':'';el._awK=key})}
LT.on('layout',()=>{try{awPlace()}catch(e){}});
{const o=actWords;actWords=function(){const r=o.apply(this,arguments);try{if(typeof layoutSoon==='function'&&document.querySelector('#plates .plate > .ltact:not([hidden])'))layoutSoon()}catch(e){}return r}}
