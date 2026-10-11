import os,sys
os.chdir(os.path.dirname(os.path.abspath(__file__))+'/..')
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC).read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a);assert n==cnt,(a[:90],n);s=s.replace(a,b)
# UIリッチ化（案1〜5）：見た目と演出だけ。ルール・操作・文言・キャラの絵には触れない
NOISE="url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")"
GRAIN="url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .35 0 0 0 0 .3 0 0 0 0 .2 0 0 0 .13 0'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E\")"
CSS=r"""
/* ===== UIリッチ化（案1〜5） ===== */
:root{--noise:__NOISE__;--grain:__GRAIN__}
/* 案1：卓の素材と光 */
.t3d{background:radial-gradient(ellipse 55% 30% at 50% -4%,rgba(255,214,150,.16),transparent 70%),radial-gradient(ellipse 90% 60% at 50% 18%,color-mix(in srgb,var(--venue) 65%,#000),#07080b 75%)}
.felt{background:radial-gradient(ellipse 48% 40% at 50% 30%,rgba(255,226,170,.20),transparent 70%),var(--noise),radial-gradient(ellipse 70% 60% at 50% 36%,#1d5a4d,#0f3029 70%,#0a211c 100%);
  background-size:auto,140px 140px,auto;background-blend-mode:normal,soft-light,normal;box-shadow:none}
.felt .rail{position:absolute;inset:0;border-radius:inherit;pointer-events:none;
  box-shadow:inset 0 0 0 1.5px #3a2a14,inset 0 0 0 3px #c79a4c,inset 0 0 0 4.5px #1a0f09,inset 0 0 0 7px #3b2417,inset 0 0 0 10px #5b3a26,inset 0 0 0 14px #7a5038,
    inset 0 0 0 17px #5b3a26,inset 0 0 0 20px #2a1810,inset 0 0 0 21px rgba(0,0,0,.65),inset 0 12px 16px 21px rgba(0,0,0,.5)}
.felt .rail::after{content:"";position:absolute;inset:0;border-radius:inherit;border:20px solid transparent;background:var(--noise) border-box;background-size:120px 120px;opacity:.4;
  -webkit-mask:linear-gradient(#000 0 0) padding-box,linear-gradient(#000 0 0) border-box;-webkit-mask-composite:xor;
  mask:linear-gradient(#000 0 0) padding-box exclude,linear-gradient(#000 0 0) border-box}
.felt .rail::before{content:"";position:absolute;inset:25px;border-radius:inherit;border:1.5px dashed rgba(226,182,91,.35)}
.felt::before{border:1.5px solid rgba(226,182,91,.32);box-shadow:0 0 0 4px rgba(226,182,91,.06),inset 0 0 0 4px rgba(226,182,91,.04)}
.felt .potzone{position:relative;border:1.5px solid rgba(226,182,91,.32);box-shadow:0 0 0 4px rgba(226,182,91,.06)}
.felt .potzone::before{content:"LAST TELL";position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font:800 22px/1 var(--display);letter-spacing:.5em;padding-left:.5em;color:rgba(226,182,91,.16);white-space:nowrap;pointer-events:none;text-shadow:0 1px 0 rgba(0,0,0,.35)}
.t3d .rlamp{position:absolute;inset:0;z-index:2;pointer-events:none;mix-blend-mode:soft-light;
  background:radial-gradient(ellipse 46% 50% at 50% 42%,color-mix(in srgb,var(--lamp,#e2b65b) 30%,rgba(255,236,200,.5)),transparent 70%)}
.t3d .haze{position:absolute;inset:-10%;z-index:2;pointer-events:none;opacity:.5;
  background:radial-gradient(ellipse 30% 12% at 30% 34%,rgba(210,220,235,.10),transparent 70%),radial-gradient(ellipse 26% 10% at 72% 26%,rgba(210,220,235,.08),transparent 70%);
  animation:lhaze 14s ease-in-out infinite alternate}
@keyframes lhaze{to{transform:translate(4%,-2%) scale(1.08)}}
/* 案2：カードとチップ */
.card:not(.back):not(.slot){background:var(--grain),linear-gradient(170deg,#fbf8f0,#ece5d5);background-size:90px 90px,auto;
  box-shadow:inset 0 0 0 1px rgba(0,0,0,.12),0 1px 0 #e2dbcb,0 2px 0 #cfc6b2,0 3px 0 #b9af99,0 8px 14px rgba(0,0,0,.55)}
.card:not(.back):not(.slot)::before{content:"";position:absolute;inset:7%;border-radius:4%/3%;box-shadow:inset 0 0 0 1px currentColor;opacity:.16;pointer-events:none}
.card .r{font-family:var(--display);font-weight:800}
.card .s{text-shadow:0 1px 0 rgba(255,255,255,.85),0 -1px 0 rgba(0,0,0,.18)}
.card.back{background:
    radial-gradient(ellipse 30% 20% at 50% 50%,#e2b65b 0 44%,#7a1220 47% 60%,transparent 63%),
    repeating-linear-gradient(45deg,rgba(226,182,91,.24) 0 1px,transparent 1px 6px),
    repeating-linear-gradient(-45deg,rgba(226,182,91,.24) 0 1px,transparent 1px 6px),
    linear-gradient(160deg,#8f1426,#5a0c18)}
.card.back::after{background:linear-gradient(115deg,transparent 30%,rgba(255,236,190,.34) 45%,transparent 60%) no-repeat,linear-gradient(125deg,rgba(255,255,255,.35),rgba(255,255,255,0) 40%);
  background-size:300% 100%,auto;background-position:120% 0,0 0;animation:lsheen 5s ease-in-out infinite}
@keyframes lsheen{0%,55%{background-position:120% 0,0 0}85%,100%{background-position:-20% 0,0 0}}
.chip{background:
  radial-gradient(ellipse at 50% 50%,color-mix(in srgb,var(--c) 70%,#fff) 0 25%,rgba(255,255,255,.9) 27% 31%,var(--c) 33% 37%,transparent 39%),
  repeating-conic-gradient(from 8deg,#f6f2e8 0 18deg,var(--c) 18deg 45deg);
  box-shadow:inset 0 0 0 1px rgba(0,0,0,.25),inset 0 1px 1px rgba(255,255,255,.4),0 2px 0 var(--d),0 3.5px 0 color-mix(in srgb,var(--d) 65%,#000),0 4.5px 3px rgba(0,0,0,.45)}
.chip.c0{background:radial-gradient(ellipse at 50% 50%,#f4efe3 0 25%,#2f5fa0 27% 30%,#ece6d6 32% 37%,transparent 39%),repeating-conic-gradient(from 8deg,#2f5fa0 0 14deg,#ece6d6 14deg 45deg)}
/* 案3：ボタンと名札 */
#game .actionbar{background:linear-gradient(180deg,rgba(255,255,255,.05),transparent 40%),var(--noise),linear-gradient(180deg,#171922,#0b0c11);background-size:auto,140px 140px,auto;
  background-blend-mode:normal,soft-light,normal;border-top:0;box-shadow:inset 0 1.5px 0 rgba(226,182,91,.6),0 -4px 16px rgba(215,38,61,.25),0 -8px 24px rgba(0,0,0,.45)}
#game button.act{position:relative;overflow:hidden;color:#fff;text-shadow:0 1px 0 rgba(0,0,0,.45);background:linear-gradient(180deg,#3a3d4b,#20222c 60%,#191a22);
  box-shadow:inset 0 2px 0 rgba(255,255,255,.2),inset 0 -3px 0 rgba(0,0,0,.35);transition:transform .1s,filter .1s}
#game button.act small{color:#ffe1a0;opacity:1;letter-spacing:0;border-top:1px solid rgba(255,255,255,.2);padding-top:2px;min-width:3.5em}
#game button.act small:empty{border-top-color:transparent}
#game button.act.fold{background:linear-gradient(180deg,#3a3d4b,#20222c 60%,#191a22);color:#d6d7de}
#game button.act.fold small{color:#a9abb8}
#game button.act.call{background:linear-gradient(180deg,#3f8b77,#25594c 60%,#1c4a3f)}
#game button.act.raise{background:linear-gradient(180deg,#f04a5f,#c01f34 55%,#9b1729)}
#game button.act.raise.open{background:linear-gradient(180deg,#f7dc95,#e2b65b 55%,#b98a35);color:#111;text-shadow:none}
#game button.act.raise.open small{color:#3a2a0a;border-top-color:rgba(0,0,0,.2)}
#game button.act.confirm small{color:#3a2a0a}
#game button.act:hover:not(:disabled){filter:brightness(1.1)}
#game button.act:active:not(:disabled){transform:translateY(2px);filter:brightness(1.15)}
#game button.act::after,#game .quick button::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.3) 50%,transparent 65%);transform:translateX(-120%)}
#game button.act.zap::after,#game .quick button.zap::after{animation:lsweep .4s ease-out}
@keyframes lsweep{to{transform:translateX(120%)}}
#game .quick button{position:relative;overflow:hidden;background:linear-gradient(180deg,#3a2029,#25141a 60%,#1d1015);border-color:#ff3d5a55;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),inset 0 -2px 0 rgba(0,0,0,.3)}
#game .quick button i{color:#ffe1a0;opacity:1}
#game .quick button.on{background:linear-gradient(180deg,#f7dc95,#e2b65b 55%,#b98a35);color:#111}
#game .quick button.on i{color:#3a2a0a}
#game .quick button:active{transform:translateY(2px)}
#game .raisepanel{background:linear-gradient(180deg,#191b25,#0d0e13)}
.plate{background:linear-gradient(180deg,rgba(32,34,46,.95),rgba(10,11,16,.95));box-shadow:inset 0 0 0 1px rgba(226,182,91,.38),inset 0 2px 0 rgba(255,255,255,.06)}
.plate .nm{font-family:var(--display);font-weight:800;letter-spacing:.12em}
.n6 .plate .nm{letter-spacing:.04em}
.plate .chp{letter-spacing:.04em}
.plate.turn{background:linear-gradient(180deg,rgba(78,60,20,.97),rgba(30,22,8,.97));box-shadow:inset 0 0 0 2px var(--gold),inset 0 0 12px rgba(226,182,91,.45)}
.potsign.slim{background:linear-gradient(180deg,rgba(24,22,30,.95),rgba(0,0,0,.9));border:0;box-shadow:inset 0 0 0 1px rgba(226,182,91,.6);padding-inline:16px;
  clip-path:polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)}
/* 案4：動きの手ざわり */
@property --oa{syntax:'<angle>';inherits:false;initial-value:0deg}
.plate.turn::after{content:"";position:absolute;inset:0;pointer-events:none;padding:2px;
  background:conic-gradient(from var(--oa),transparent 0 290deg,rgba(255,240,200,.25) 320deg,#fff2c8 352deg,transparent 360deg);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);
  animation:lorbit 2.6s linear infinite}
@keyframes lorbit{to{--oa:360deg}}
.mine .me-ava::after{content:"";position:absolute;inset:-5px;pointer-events:none;padding:3px;opacity:var(--ron,0);
  background:conic-gradient(var(--rc,#e2b65b) calc(var(--rp,1)*360deg),rgba(226,182,91,.14) 0);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0)}
.mine:not(.turn) .me-ava::after{display:none}
.potsign .pv{display:inline-block}
.potsign .pv.bump{animation:lbump .5s cubic-bezier(.2,1.6,.4,1)}
@keyframes lbump{40%{transform:scale(1.18);color:#fff3c8;text-shadow:0 0 10px rgba(226,182,91,.9)}}
.card.win{translate:0 -7px;transition:translate .3s ease-out;box-shadow:0 0 0 2px var(--gold),0 0 16px rgba(226,182,91,.75),0 12px 16px rgba(0,0,0,.5)}
.spot .card.win{translate:0 -5px}
.card .wgl{position:absolute;inset:0;border-radius:inherit;pointer-events:none;overflow:hidden;
  background:linear-gradient(110deg,transparent 30%,rgba(255,244,210,.85) 48%,transparent 62%) no-repeat;background-size:250% 100%;background-position:150% 0;animation:lglint .9s .15s ease-in-out both}
@keyframes lglint{to{background-position:-60% 0}}
.wstamp{position:absolute;left:50%;z-index:6;transform:translate(-50%,-50%);pointer-events:none;white-space:nowrap;font:800 1.25rem/1.3 var(--display);letter-spacing:.3em;
  padding:3px 22px 3px calc(22px + .3em);color:#1a1206;background:linear-gradient(100deg,#9c7224,#f7dc95 40%,#c69437 60%,#f2d58a);
  clip-path:polygon(10px 0,100% 0,calc(100% - 10px) 100%,0 100%);filter:drop-shadow(0 4px 6px rgba(0,0,0,.6));animation:lstamp 1.6s ease-in-out forwards;max-width:94%;overflow:hidden;text-overflow:ellipsis}
.en .wstamp{letter-spacing:.14em;padding-left:calc(22px + .14em)}
.n6 .wstamp{font-size:1.05rem}
@keyframes lstamp{0%{opacity:0;transform:translate(-50%,-50%) scale(1.5)}15%,82%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(1)}}
.lwipe{position:fixed;top:0;bottom:0;left:0;width:100%;z-index:95;pointer-events:none;overflow:hidden}
.lwipe::before{content:"";position:absolute;top:0;bottom:0;left:-30%;width:160%;
  background:linear-gradient(110deg,transparent 0 22%,var(--crimson) 22% 26%,#07080c 26% 74%,var(--crimson) 74% 78%,transparent 78%);
  transform:translateX(-100%);animation:lwipe .45s cubic-bezier(.6,0,.4,1) forwards}
.lwipe.fast::before{animation-duration:.25s}
@keyframes lwipe{to{transform:translateX(100%)}}
/* 案5：タイトル */
#title{isolation:isolate}
#title::before{content:"";position:absolute;left:-16px;right:-16px;top:0;height:34%;z-index:-1;opacity:.55;pointer-events:none;
  background:repeating-linear-gradient(90deg,transparent 0 22px,rgba(255,200,120,.22) 22px 29px,transparent 29px 44px,rgba(120,170,200,.14) 44px 49px,transparent 49px 66px) 0 0/100% 70% no-repeat,
   linear-gradient(transparent 70%,rgba(255,200,120,.35) 70% 72%,transparent 72%);
  filter:blur(3px);-webkit-mask:linear-gradient(90deg,transparent,#000 25%,#000 75%,transparent);mask:linear-gradient(90deg,transparent,#000 25%,#000 75%,transparent)}
#title::after{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse 50% 45% at 72% 30%,rgba(255,190,110,.12),transparent 70%),var(--noise);background-size:auto,160px 160px;opacity:.5;mix-blend-mode:overlay}
body:has(#title:not([hidden]))::before{opacity:.45}
body:has(#title:not([hidden]))::after{opacity:.6}
.logo h1{color:#fff4e0;text-shadow:0 0 3px #fff,0 0 12px rgba(255,214,150,.9),0 0 32px rgba(226,182,91,.6)}
.logo h1 span{color:#ffd9de;text-shadow:0 0 3px #fff,0 0 12px rgba(255,80,100,.95),0 0 32px rgba(215,38,61,.7)}
.logo h1 .fl{color:inherit;text-shadow:inherit;animation:lflicker 6s steps(1) infinite}
@keyframes lflicker{0%,100%{opacity:1}62%{opacity:.25}63%{opacity:1}65%{opacity:.4}66%{opacity:1}}
#title .row button{position:relative;overflow:hidden;background:linear-gradient(180deg,#2c2f3d,#14161e);box-shadow:inset 0 0 0 1.5px rgba(226,182,91,.45),inset 0 2px 0 rgba(255,255,255,.12)}
#title .row button.primary{background:linear-gradient(180deg,#f04a5f,#b41c30);box-shadow:inset 0 2px 0 rgba(255,255,255,.3),inset 0 -2px 0 rgba(0,0,0,.25)}
#title .row button.primary::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.35) 50%,transparent 65%);transform:translateX(-120%);animation:lmsweep 4s ease-in-out infinite}
@keyframes lmsweep{0%,72%{transform:translateX(-120%)}86%,100%{transform:translateX(120%)}}
#title .row button:hover:not(:disabled){filter:brightness(1.15)}
.hero .tfan{display:none}
@media (min-width:621px){
  .hero .tfan{display:block;position:absolute;right:0;top:4%;width:34%;aspect-ratio:1;z-index:0;pointer-events:none}
  .hero .tfan .card{--cw:min(64px,13vw);position:absolute;left:50%;bottom:6%;transform-origin:50% 120%;animation:none}
  .hero .tfan .card:nth-child(1){transform:translateX(-50%) rotate(-18deg)}
  .hero .tfan .card:nth-child(2){transform:translateX(-50%) rotate(0deg)}
  .hero .tfan .card:nth-child(3){transform:translateX(-50%) rotate(18deg);animation:lpeek 6s ease-in-out infinite}
  .hero>svg,.hero>.av{position:relative;z-index:1}
}
@keyframes lpeek{0%,40%,100%{transform:translateX(-50%) rotate(18deg)}55%,85%{transform:translateX(-38%) rotate(24deg) translateY(-6px)}}
.hero .tagname{z-index:2}
@media (orientation:landscape) and (max-height:520px){
  #game .actionbar{box-shadow:inset 1.5px 0 0 rgba(226,182,91,.6),-4px 0 16px rgba(215,38,61,.25),-8px 0 24px rgba(0,0,0,.45)}
}
@media (prefers-reduced-motion:reduce){
  .t3d .haze,.card.back::after,.plate.turn::after,.potsign .pv.bump,.card .wgl,.wstamp,.lwipe::before,.logo h1 .fl,#title .row button.primary::after,.hero .tfan .card,#game button.act.zap::after,#game .quick button.zap::after{animation:none!important}
  .lwipe{display:none}.card.win{transition:none}
}
""".replace('__NOISE__',NOISE).replace('__GRAIN__',GRAIN)
rep("</style>",CSS+"</style>")
# マークアップ：レールと刷り込みのロゴ（フェルトの中）、看板の T（ちらつき）
rep('<div class="felt" id="felt">','<div class="felt" id="felt"><div class="rail" aria-hidden="true"></div>')
rep('<h1 lang="en">LAST<br><span>TELL</span></h1>','<h1 lang="en">LAS<span class="fl">T</span><br><span>TELL</span></h1>')
JS=r"""
/* ===== UIリッチ化（案1〜5）の演出 ===== */
(function(){
  const t=$('table'),cam=$('cam');
  if(t&&cam){const lp=document.createElement('div');lp.className='rlamp';lp.setAttribute('aria-hidden','true');const hz=document.createElement('div');hz.className='haze';hz.setAttribute('aria-hidden','true');
    cam.after(lp);lp.after(hz)}
  // タイトル：カードの扇（PC と横向きだけ）
  const h=$('hero');if(h)h.insertAdjacentHTML('afterbegin','<div class="tfan" aria-hidden="true">'+cardHTML({},true,' noanim')+cardHTML({r:14,s:0},false,' noanim')+cardHTML({r:13,s:1},false,' noanim')+'</div>');
  // 押したとき、光が左から右へ一度流れる
  document.addEventListener('pointerdown',e=>{const b=e.target.closest&&e.target.closest('#game button.act,#game .quick button');if(!b||b.disabled||reducedMotion())return;
    b.classList.remove('zap');void b.offsetWidth;b.classList.add('zap');setTimeout(()=>b.classList.remove('zap'),450)},{passive:true});
  // 自分の名札（顔）の周りの持ち時間の輪：時計バーの長さを写す
  const ck=$('clock'),mine=$('mine');
  if(ck&&mine){const sync=()=>{const m=/scaleX\(([\d.]+)\)/.exec(ck.querySelector('i').style.transform||'');mine.style.setProperty('--rp',m?m[1]:'1');
      mine.style.setProperty('--ron',ck.hidden?'0':'1');mine.style.setProperty('--rc',ck.classList.contains('low')?'#d7263d':'#e2b65b')};
    new MutationObserver(sync).observe(ck,{attributes:true,subtree:true,attributeFilter:['style','class','hidden']});sync()}
})();
// 場面転換のぬぐい
let lwipeAt=0;
function lastWipe(){if(reducedMotion())return;const n=performance.now();if(n-lwipeAt<400)return;lwipeAt=n;
  const d=document.createElement('div');d.className='lwipe'+(SETTINGS.speed==='fast'?' fast':'');d.setAttribute('aria-hidden','true');document.body.appendChild(d);setTimeout(()=>d.remove(),SETTINGS.speed==='fast'?320:520)}
{const o=$('btnNext').onclick;$('btnNext').onclick=function(e){lastWipe();return o.call(this,e)}}
{const o=playScene;playScene=function(){lastWipe();return o.apply(this,arguments)}}
{const o=startChapter;startChapter=function(){lastWipe();return o.apply(this,arguments)}}
{const o=renderLine;renderLine=function(){const l=SC&&SC.lines[SC.i];if(l&&l.part)lastWipe();return o.apply(this,arguments)}}
// ポットの数字が増えたとき、一瞬ふくらむ
{const o=potCount;potCount=function(to,ms){const P=S&&S.potPile,from=P?P.shown||0:0;const r=o.apply(this,arguments);
  if(to>from&&!reducedMotion()){const pv=$('potSign').querySelector('.pv');if(pv){pv.classList.remove('bump');void pv.offsetWidth;pv.classList.add('bump')}}return r}}
// 勝ち札：勝った手に使われたカードを浮かせ、光を1回走らせる。役名の札を出す
function winCards(p){const cs=p.hand.concat(S.board);if(cs.length<5||!p.score)return[];let got=null;const idx=[];
  (function rec(st,k){if(got)return;if(k===5){if(cmp(eval5(idx.map(i=>cs[i])),p.score)===0)got=idx.slice();return}for(let i=st;i<=cs.length-(5-k);i++){idx.push(i);rec(i+1,k+1);idx.pop()}})(0,0);
  if(!got)return[];const c=p.score[0];
  if(c===0)return[got.reduce((a,i)=>cs[i].r>cs[a].r?i:a,got[0])];
  if(c===1||c===2||c===3||c===7){const n={};got.forEach(i=>n[cs[i].r]=(n[cs[i].r]||0)+1);return got.filter(i=>n[cs[i].r]>=2)}
  return got}
function winFx(){
  if(!S||!S.players||!S.handOver||S.street!=='showdown'||S.board2||S.board.length<3)return;
  const ws=S.players.filter(p=>p.won>0&&p.show&&p.score&&!p.folded&&p.hand.length===2);if(!ws.length)return;
  const first=S.wfxHand!==S.handNo;if(first){S.wfxHand=S.handNo;S.wfxT=performance.now()}
  const fresh=performance.now()-S.wfxT<400;
  ws.forEach(p=>{const i=S.players.indexOf(p),hold=i===0?$('mine').querySelectorAll('.hold .card'):($('spot'+i)?$('spot'+i).querySelectorAll('.hand .card'):[]),bd=$('boardCards').children;
    winCards(p).forEach(j=>{const el=j<2?hold[j]:bd[j-2];if(!el||el.classList.contains('win')||el.classList.contains('back'))return;el.classList.add('win');
      if(fresh){const g=document.createElement('i');g.className='wgl';g.setAttribute('aria-hidden','true');el.appendChild(g)}})});
  if(first){const top=ws.reduce((a,b)=>cmp(b.score,a.score)>0?b:a);const name=handName(top.score);
    setTimeout(()=>{if(!S||S.wfxHand!==S.handNo||$('game').hidden)return;const tb=$('table').getBoundingClientRect(),bc=$('boardCards').getBoundingClientRect();if(!bc.height)return;
      const old=$('table').querySelector('.wstamp');if(old)old.remove();
      const d=document.createElement('div');d.className='wstamp';d.setAttribute('aria-hidden','true');d.textContent=name;d.style.top=Math.round(bc.bottom-tb.top+20)+'px';$('table').appendChild(d);
      setTimeout(()=>d.remove(),1650)},380*SPEED())}}
{const o=render;render=function(){const r=o.apply(this,arguments);try{winFx()}catch(e){}return r}}
"""
rep("\n</script>\n<script>","\n"+JS+"</script>\n<script>")
open(OUT,'w').write(s);print('ok')
