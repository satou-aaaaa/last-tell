// アニメーションの重さ 案1（2026-10-17）：まばたきを「数秒おきに0.28秒だけ」動かす（01f_style_anim_lite.css）。
// 今までは目に4.6秒の動きをずっと流していて、止まっている間も毎コマ顔の絵を描き直していた。
// まばたきする顔：今までと同じ（かわいい絵の顔はどこでも、リアルの顔は卓・会話・名前の顔だけ）。テル「じっと動かない」（.cue-still）の間はしない
const AL={next:new WeakMap(),sel:'svg.av:not(.real), .bust svg.av.real, .portrait svg.av.real, .nava svg.av.real'};
function alBlinkTick(){
  if(document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const now=performance.now();
  document.querySelectorAll(AL.sel).forEach(sv=>{
    let t=AL.next.get(sv);
    if(t===undefined){AL.next.set(sv,now+800+Math.random()*4200);return}   // 顔ごとにずらす（LT.rand は配る札の乱数なので使わない）
    if(now<t)return;
    AL.next.set(sv,now+3000+Math.random()*3200);                           // 次は3〜6秒あと（今の4.6秒おきと同じくらい）
    if(sv.closest('.cue-still')||!sv.getClientRects().length)return;
    sv.classList.add('blk');
    setTimeout(()=>sv.classList.remove('blk'),320);
  });
}
setInterval(alBlinkTick,400);

// アニメーションの重さ 案2（2026-10-17）：CSS の :has()（19か所）を、ここで付ける目印の class に置き換えた。
// :has() は卓の中の部品が変わるたびに広い範囲で当てはまりを調べ直すので、相手が打つたびの止まる時間の約4割になっていた。
// 目印は部品が変わった直後（MutationObserver：同じ処理の終わり、画面を描く前）に付け直すので、見え方は今と同じ
function alHasSync(){
  const b=document.body,g=$('game'),tt=$('title');
  if(b&&tt)b.classList.toggle('ltTitle',!tt.hidden);
  document.querySelectorAll('.t3d').forEach(t=>{t.classList.toggle('hasP3',!!t.querySelector('#plate3'));t.classList.toggle('hu1',!!t.querySelector('#bust1')&&!t.querySelector('#bust2'))});
  document.querySelectorAll('.plate').forEach(p=>{p.classList.toggle('pEqb',!!p.querySelector('.eqb'));p.classList.toggle('pHn',!!p.querySelector('.handname'));p.classList.toggle('pWin',!!p.querySelector('.tag.win'))});
  if(g){const rp=$('raisePanel'),se=g.querySelector('.gwrap>.sensei');g.classList.toggle('rpOpen',!!rp&&!rp.hidden);g.classList.toggle('seOn',!!se&&!se.hidden)}
  document.querySelectorAll('#between .acts').forEach(a=>a.classList.toggle('acts3',[...a.children].filter(c=>c.classList.contains('act')&&!c.hidden).length>=3));
}
{let q=false;const kick=()=>{if(q)return;q=true;queueMicrotask(()=>{q=false;try{alHasSync()}catch(e){}})};
  const mo=new MutationObserver(kick),o={subtree:true,childList:true,attributes:true,attributeFilter:['hidden']};   // 名札の中身（.tag.win・.eqb・.handname）は作り直し（childList）で変わる
  for(const id of ['title','game'])try{const e=$(id);if(e)mo.observe(e,id==='title'?{attributes:true,attributeFilter:['hidden']}:o)}catch(e){}
  try{alHasSync()}catch(e){}}

// 案5（2026-10-17）：設定「動き」（自動・ふつう・少なめ）。自動は、卓に着いて最初の数秒のなめらかさを測り、遅い端末なら少なめにする（その回だけ。毎回測り直す）
const ALM={auto:null,sampling:false};
const motionSet=()=>['auto','full','less'].includes(SETTINGS.motion)?SETTINGS.motion:'auto';
function motionApply(){const lite=motionSet()==='less'||(motionSet()==='auto'&&ALM.auto===true);document.documentElement.classList.toggle('ltLite',lite)}
function motionSample(){
  if(ALM.auto!==null||ALM.sampling||motionSet()!=='auto'||document.hidden)return;
  const g=$('game');if(!g||g.hidden)return;
  ALM.sampling=true;const iv=[];let last=0,t0=0;
  const f=t=>{if(document.hidden||g.hidden){ALM.sampling=false;return}   // 途中で隠れたら、次の機会に測り直す
    if(!t0)t0=t;else iv.push(t-last);last=t;
    if(t-t0<4000){requestAnimationFrame(f);return}
    ALM.sampling=false;iv.sort((a,b)=>a-b);const med=iv[Math.floor(iv.length/2)]||16;
    ALM.auto=med>40;   // 1秒に25コマより少ない端末は少なめにする
    motionApply()};
  setTimeout(()=>requestAnimationFrame(f),1500)}   // 卓を作った直後の重い1回は数えない
LT.on('startHand',()=>{try{motionSample()}catch(e){}});
// 設定の行（くわしい設定の中、「立体」の近く）
(function(){const box=$('setIn');if(!box)return;const det=box.querySelector('.setmore')||box;
  const r=document.createElement('div');r.className='setrow';r.id='rowMotion';
  r.innerHTML='<div><b>動き</b><p>少なめにすると、背景や待っている相手の動きを止めて軽くします。自動は、動きが重い端末だけ少なめにします</p></div>';
  const s=document.createElement('select');s.className='selpick';s.id='selMotion';s.setAttribute('aria-label','動き');
  s.innerHTML='<option value="auto">自動</option><option value="full">ふつう</option><option value="less">少なめ</option>';
  s.value=motionSet();s.onchange=()=>{SETTINGS.motion=s.value;saveSettings();motionApply()};r.appendChild(s);
  const dep=$('btnDepth'),after=dep&&dep.closest('.setrow');if(after&&after.parentElement)after.after(r);else det.appendChild(r);
  ['btnSet','mSet'].forEach(id=>{const b=$(id);if(b)b.addEventListener('click',()=>{s.value=motionSet()})})})();
motionApply();
