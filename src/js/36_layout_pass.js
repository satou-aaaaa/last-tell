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
  if(LP.say){let on=false;try{on=sayFollow()}catch(e){}LP.say=on}
  if(LP.say)lpKick()}
function lpKick(){if(!LP.raf)LP.raf=requestAnimationFrame(lpFrame)}
// 何回呼んでも、次のコマの頭で1回だけ位置合わせをする
function layoutSoon(){LP.dirty=true;lpKick()}
// 吹き出しの追いかけ（24_dokidoki_camera の sayFollow）を毎コマ回す。出ている吹き出しが無くなったら止まる
function sayWake(){LP.say=true;lpKick()}
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
function cuePlace(){const P=$('plates');if(!P)return;const cs=[...P.querySelectorAll(':scope > .cue[data-bust]')];if(!cs.length)return;
  const pr=P.getBoundingClientRect(),out=[];
  cs.forEach(cb=>{const b=$('bust'+cb.dataset.bust);if(!b)return;const br=b.getBoundingClientRect();
    out.push([cb,(pr.right-br.right+br.width*.06)+'px',Math.max(4,br.top-pr.top+br.height*.06)+'px'])});
  out.forEach(([cb,r,t])=>{cb.style.right=r;cb.style.top=t})}
const lpTry=f=>{try{f()}catch(e){console.error('[LT] layout',e)}};
// 順番：測るだけのもの・書くことが少ないものを先に、書いてから測るもの（fitTable・吹き出しの追いかけ）を後に。faceFit は 30c_ui64 で先に登録してある
LT.on('layout',()=>{const gameOn=!$('game').hidden;
  if(gameOn){
    lpTry(fitTags);lpTry(fitMyHand);lpTry(barSync);
    if(LP.pot){LP.pot=false;lpTry(potSignPlaceWide)}
    lpTry(()=>{talkPlace();const row=$('askRow');if(row&&row._bp&&!row.hidden&&typeof bPlace==='function')bPlace(row)});
    lpTry(cuePlace);
    // 吹き出しの置き場所（30c_ui64 の sayPlace）。faceFit がもう置いたものは飛ばす
    document.querySelectorAll('#sayLayer .say').forEach(sy=>{if(!sy._lpSay)return;sy._lpSay=0;if(sy.classList.contains('go'))lpTry(()=>sayPlace(sy))});
    lpTry(fitTable);lpTry(potClear);lpTry(chipAvoid);   // v71（改善提案§1）：場札にチップをかけない（ポットの山→席の賭けチップの順）
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
