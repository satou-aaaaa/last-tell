// ===== 動作の重さの改善 案3：描き直しの後の位置合わせを、次のコマの頭で1回だけ（2026-10-11） =====
// 今までは render と後付けの処理が「書いてすぐ測る」をくり返し、1回打つたびに画面の形の計算が40回ほど起きていた。
// ここでは render の後に layoutSoon() を呼ぶだけにして、次のコマの頭（requestAnimationFrame）で LT.emit('layout') を1回出す。
// 'layout' の中は登録した順に動く：faceFit（30c_ui64）→ fitTags・fitMyHand → バー（barSync）→ ポットの札 → 話す欄（talkPlace）
//   → クセの札 → 吹き出しの置き場所 → fitTable → 操作案内・場面 → 掛け合いのよけ（bAvoid）。そのあと吹き出しの追いかけ（sayFollow）。
// 見回り（0.12〜0.3秒ごとに測る setInterval）はやめ、安全のため1秒ごとに layoutSoon() だけ残す。
// order.json では 35_hooks_wire.js の後（LT.wrap 済みの render・renderTalk などの合図を使う）。
const LP={raf:0,dirty:false,say:false,rendered:false,pot:false,full:true,n:0};
function lpFrame(){LP.raf=0;
  if(LP.dirty){LP.dirty=false;LP.n++;LT.emit('layout')}
  if(LP.say){let on=false;try{on=sayFollow()}catch(e){}LP.say=on&&performance.now()<LP.until}   // 顔アップの重さ 案B：決めた時間を過ぎたら止める
  if(LP.say)lpKick()}
function lpKick(){if(LP.raf)return;LP.raf=requestAnimationFrame(lpFrame);clearTimeout(LP.to);LP.to=setTimeout(()=>{if(LP.raf){cancelAnimationFrame(LP.raf);lpFrame()}},150)}
// v78：Safari（WebKit）では次のコマ（requestAnimationFrame）がしばらく来ないことがあり、位置合わせが回らず、描き直した席のチップが場札に残っていた
// （CI の rects：WebKit だけ spot1 .mystack に data-ca も translate も無い＝chipAvoid が後で一度も通っていない）。0.15秒来なければ自分で回す
// 何回呼んでも、次のコマの頭で1回だけ位置合わせをする
function layoutSoon(){LP.dirty=true;lpKick()}
// v76：札を配る動き（flip）が終わったあとにもう一度位置合わせ。WebKit では動きの途中に測った位置のまま、チップが場札に残ることがあった
document.addEventListener('animationend',e=>{try{const t=e.target;if(t&&t.classList&&t.classList.contains('card')&&t.closest('#table'))layoutSoon()}catch(x){}},true);
// 吹き出しの追いかけ（24_dokidoki_camera の sayFollow）を毎コマ回す。出ている吹き出しが無くなったら止まる
// 顔アップの重さ 案B（2026-10-11）：毎コマ追いかけるのは、カメラが動いている間（camTo から 0.8秒）と、吹き出しが出た直後（0.3秒）だけ。
// カメラが止まっていれば吹き出しも動かないので、出ている間ずっと測り直す必要はない（今までは出ている約3秒のあいだ毎コマ測っていた）
LP.until=0;
function sayWake(ms){LP.say=true;LP.until=Math.max(LP.until,performance.now()+(ms||300));lpKick()}
// ポットの札：今までどおり「頼んだ時にカメラが全体なら置く」。カメラが動き始めていても、全体の時の位置で置く
function potSignSoon(){if(typeof camState!=='undefined'&&camState.kind==='wide'){LP.pot=true;layoutSoon()}}
function potSignPlaceWide(){const s=$('potSign'),p=$('potChips'),t=$('table'),c=$('cam');if(!s||!p||!t||s.hidden)return;
  let m=null;try{m=c?new DOMMatrix(getComputedStyle(c).transform):null}catch(e){}
  if(!m||m.isIdentity){const k=camState.kind;camState.kind='wide';try{potSignPlace()}finally{camState.kind=k}return}
  // カメラが寄り始めている（または寄っている）：寄る前の位置に戻して測る（カメラは translate＋scale、原点は左上）
  const tr=t.getBoundingClientRect(),un=y=>tr.top+(y-tr.top-m.f)/m.d,pr=p.getBoundingClientRect();if(!pr.height)return;
  let b=un(pr.top)+pr.height/m.d*.6;for(const ch of p.children){const r=ch.getBoundingClientRect();if(r.height)b=Math.max(b,un(r.bottom))}
  const card=document.querySelector('#mine .card'),lim=card?card.getBoundingClientRect().top-s.offsetHeight-4:1e9;
  s.style.top=(Math.min(b+3,lim)-tr.top)+'px'}
// クセの札：相手の胸像の右上（今まで render の中で決めていた位置と同じ式）。全部測ってから全部書く
// v73（改善提案 2026-10-14 §1）：ディーラーの声（#dcall）がクセの札（.cue）に重なるときは、声を左上へ寄せる（札は動かさない）
function dcallPlace(){const d=$('dcall');if(!d)return;if(!d.classList.contains('go')){d.classList.remove('dleft','dwrap');d.style.top='';d.style.maxWidth='';return}
  const R=e=>e.getBoundingClientRect(),cs=[...document.querySelectorAll('#plates > .cue')].filter(c=>!c.hidden&&c.offsetParent).map(R).filter(r=>r.width>1);
  d.classList.remove('dleft','dwrap');d.style.top='';d.style.maxWidth='';if(!cs.length)return;
  const hit=r=>c=>{const w=Math.min(r.right,c.right)-Math.max(r.left,c.left),h=Math.min(r.bottom,c.bottom)-Math.max(r.top,c.top);return w>0&&h>0};
  const r0=R(d);if(!cs.some(hit(r0)))return;
  // 左上へ（札を優先）。左の吹き出し（客の一言）にかかるときは、吹き出しの上へ少し上げる（顔の上へは下げない：顔の奥に隠れるため）
  d.classList.add('dleft');{const rl=R(d),hc=cs.filter(hit(rl));if(hc.length){const mw=Math.min(...hc.map(c=>c.left))-rl.left-6;if(mw>80){d.style.maxWidth=Math.round(mw)+'px';d.classList.add('dwrap')}}}   // 長い声（役の名前など）が左から札に届くときは2行に
  const r1=R(d),says=[...document.querySelectorAll('#sayLayer .say,#plates .say')].filter(e=>e.offsetParent&&+getComputedStyle(e).opacity>.05).map(R).filter(r=>r.width>1&&hit(r1)(r));
  if(!says.length)return;const pr=(d.offsetParent||document.body).getBoundingClientRect(),top=Math.min(...says.map(c=>c.top))-r1.height-4-pr.top;
  if(top>=2)d.style.top=Math.round(top)+'px'}
function cuePlace(){const P=$('plates');if(!P)return;const cs=[...P.querySelectorAll(':scope > .cue[data-bust]')];if(!cs.length)return;
  // v74 レビュー：#plates はカメラの中で一緒に拡大されるので、画面の上の長さを拡大の分で割る（寄っている間に札が顔から離れていた）
  const pr=P.getBoundingClientRect(),z=pr.width/(P.offsetWidth||pr.width)||1,out=[];
  cs.forEach(cb=>{const b=$('bust'+cb.dataset.bust);if(!b)return;const br=b.getBoundingClientRect();
    out.push([cb,(pr.right-br.right+br.width*.06)/z+'px',Math.max(4,(br.top-pr.top+br.height*.06)/z)+'px'])});
  out.forEach(([cb,r,t])=>{cb.style.right=r;cb.style.top=t})}
// v79（v78 レビュー 2）：ジンの一言の帯が、あと少しの幅で2行になると卓（自分の手札）にかかる（Safari は字が少し広い）。2px までなら字を小さくして1行に収める。収まらない長い文は2行のまま
function senseiFit(){const p=$('senseiText'),b=$('sensei');if(!p||!b||b.hidden||!p.offsetParent)return;const k=p.textContent+'|'+p.clientWidth;if(p._sk===k)return;
  p.style.fontSize='';const cs=getComputedStyle(p),f0=parseFloat(cs.fontSize),lh=parseFloat(cs.lineHeight)||f0*1.45;
  if(p.scrollHeight>lh*1.5){let f=f0;while(f>f0-2&&p.scrollHeight>lh*1.5){f-=.5;p.style.fontSize=f+'px'}if(p.scrollHeight>lh*1.5)p.style.fontSize=''}
  p._sk=k}
// v80（改善提案 2026-10-14b §1 の検査で見つかった）：横画面で、捨て札の山が「黙る・さあね…」（左下の .needlerow）の上に乗る。乗るときだけ山をボタンの上へ上げる
function muckAvoid(){const mp=document.querySelector('.felt .boardspot > .muckpile');if(!mp)return;if(mp.style.translate)mp.style.translate='';
  const cs=[...mp.querySelectorAll('.muckcard')].map(e=>e.getBoundingClientRect()).filter(r=>r.width>2);if(!cs.length)return;
  const bs=[...document.querySelectorAll('.needlerow button')].filter(b=>b.offsetParent&&+getComputedStyle(b).opacity>.05).map(b=>b.getBoundingClientRect()).filter(r=>r.width>2);if(!bs.length)return;
  const L=Math.min(...cs.map(r=>r.left)),Rr=Math.max(...cs.map(r=>r.right)),T=Math.min(...cs.map(r=>r.top)),B=Math.max(...cs.map(r=>r.bottom));
  const hit=bs.filter(q=>L<q.right&&q.left<Rr&&T<q.bottom&&q.top<B);if(!hit.length)return;
  const sp=mp.parentElement,k=sp.getBoundingClientRect().height/(sp.offsetHeight||1)||1,top=Math.min(...bs.map(q=>q.top));
  mp.style.translate=`0px ${(-(B-top+6)/k).toFixed(1)}px`}
const lpTry=f=>{try{f()}catch(e){console.error('[LT] layout',e)}};
// 順番：測るだけのもの・書くことが少ないものを先に、書いてから測るもの（fitTable・吹き出しの追いかけ）を後に。faceFit は 30c_ui64 で先に登録してある
LT.on('layout',()=>{const gameOn=!$('game').hidden;
  if(gameOn){
    lpTry(fitTags);lpTry(fitMyHand);lpTry(barSync);
    if(LP.pot){LP.pot=false;lpTry(potSignPlaceWide)}
    lpTry(()=>{talkPlace();const row=$('askRow');if(row&&row._bp&&!row.hidden&&typeof bPlace==='function')bPlace(row)});
    lpTry(cuePlace);lpTry(dcallPlace);
    // 吹き出しの置き場所（30c_ui64 の sayPlace）。faceFit がもう置いたものは飛ばす
    document.querySelectorAll('#sayLayer .say').forEach(sy=>{if(!sy._lpSay)return;sy._lpSay=0;if(sy.classList.contains('go'))lpTry(()=>sayPlace(sy))});
    // v75 レビュー 1：卓の大きさが変わって（レイズの欄を開くなど）横に置いた吹き出しが名札にかかったら置き直す
    {const R0=($('table')||document.body).getBoundingClientRect(),pr=[...document.querySelectorAll('#plates .plate')].filter(e=>e.offsetParent).map(e=>[e.id,e.getBoundingClientRect()]);if(pr.length)document.querySelectorAll('#sayLayer .say.go.side').forEach(sy=>{const r=sy.getBoundingClientRect(),me='plate'+sy.id.replace('say','');const k=(sy.dataset.seq||'')+'|'+Math.round(R0.height);if(sy._rpK===k)return;if(pr.some(([id,q])=>id!==me&&r.left<q.right&&q.left<r.right&&r.top<q.bottom&&q.top<r.bottom)){sy._rpK=k;lpTry(()=>sayPlace(sy))}})}   // 同じ吹き出し・同じ卓の高さでは1回だけ（置き場が無いときに毎コマ置き直さない）
    lpTry(senseiFit);lpTry(muckAvoid);lpTry(fitTable);lpTry(potClear);lpTry(chipAvoid);lpTry(barSync);   // v71（改善提案§1）：場札にチップをかけない（ポットの山→席の賭けチップの順）
  }else{lpTry(fitMyHand);lpTry(barSync)}   // 相手紹介（#vs）は卓が出る前
  lpTry(tourGuard);lpTry(fitScene);
  if(LP.rendered){LP.rendered=false;if(gameOn)lpTry(bAvLoop)}
  LP.full=false});
LT.on('render',()=>{LP.rendered=true;layoutSoon();sayWake()});
['renderTalk','playScene','advance','show','startHand','act'].forEach(n=>LT.on(n,layoutSoon));
addEventListener('resize',()=>{LP.full=true;layoutSoon()});
// 描き直し以外で形が変わる時：押した・入力した（レイズの額、引き出し、相手紹介の「勝負」など）、ジンの助言の出入り、フォントの読み込み
['click','input','keydown'].forEach(t=>document.addEventListener(t,()=>layoutSoon(),{capture:true,passive:true}));
try{const mo=new MutationObserver(()=>layoutSoon());['sensei','vs','scene','game','tour','controls','between'].forEach(id=>{const e=$(id);if(e)mo.observe(e,{attributes:true,attributeFilter:['hidden','class']})})}catch(e){}
// v71（改善提案§1）：場札が配られた・めくり終わった時（描き直しを通らない）も合わせ直す。チップが新しい場札にかかったままにしない
try{const mb=new MutationObserver(()=>layoutSoon());['boardCards','board2'].forEach(id=>{const e=$(id);if(e){mb.observe(e,{childList:true,subtree:true});e.addEventListener('animationend',()=>layoutSoon())}})}catch(e){}
try{const c=$('cam');if(c)c.addEventListener('transitionend',e=>{if(e.target===c)layoutSoon()})}catch(e){}   // v71：カメラが寄り終わった・戻り終わった時も
try{document.fonts&&document.fonts.addEventListener('loadingdone',()=>layoutSoon())}catch(e){}
// 安全のための見回り：1秒ごとに1回だけ
setInterval(()=>{if(!document.hidden){LP.full=true;layoutSoon()}},1000);
layoutSoon();
