// ===== v0.98.1 PC 向け：部屋の光と煙（PC 向けリッチ演出 案2、2026-10-21 satou「全部」） =====
// PC（html.pcw）だけ。卓の上に canvas を1枚重ね、ランプの光の円錐（ゆっくり揺れる）・流れる煙・ポットのチップの光の反射・外側の暗さを描く。
// 光の色は章の --lamp（20_state.js が章ごとに入れる）。遊び方は何も変えない（押せない・何も隠さない）。
// 止める：動き「少なめ」（html.ltLite）・prefers-reduced-motion・画面が隠れている間は、1枚だけ描いて止める。
// 顔（#busts）の上には描かない（卓の板の上端より下だけ）。カメラが顔に寄っている間（camState.i>=0）は煙をさらに薄くする。
// 重さ：30コマ/秒まで、描く大きさは画面の半分（ぼかした絵なので足りる）。1コマにかかった時間を PCAIR.ms に残す（qa が見る）
const PCAIR={sk:'',puff:null,vig:null,on:false,ms:0,frames:0,raf:0,last:0,cv:null,g:null,w:0,h:0,puffs:[],t0:0};
function pcAirOn(){return document.documentElement.classList.contains('pcw')&&!!$('table')&&!$('game').hidden}
function pcAirStill(){return document.documentElement.classList.contains('ltLite')||reducedMotion()||document.hidden}
function pcAirMake(){const tb=$('table');if(!tb)return null;let cv=$('pcAir');
  if(!cv){cv=document.createElement('canvas');cv.id='pcAir';cv.setAttribute('aria-hidden','true');
    const fw=tb.querySelector('.felt-wrap'),par=fw?fw.parentNode:tb;par.insertBefore(cv,fw?fw.nextSibling:null)}   // カメラ（#cam）の中で、卓の布の上・名札（.plates）の下
  PCAIR.cv=cv;PCAIR.g=cv.getContext('2d');return cv}
function pcAirSize(){const cv=PCAIR.cv,tb=$('table');   // 大きさは卓（#table）と同じ（#cam は卓いっぱい）
 if(!cv||!tb)return;const w=Math.max(1,Math.round(tb.clientWidth/2)),h=Math.max(1,Math.round(tb.clientHeight/2));
  if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}PCAIR.w=w;PCAIR.h=h;
  if(!PCAIR.puffs.length){let s=7;const R=()=>(s=(s*16807)%2147483647)/2147483647;
    for(let i=0;i<28;i++)PCAIR.puffs.push({x:R(),y:.08+R()*.6,r:.06+R()*.12,v:.004+R()*.01,p:R()*6.3})}}
function pcAirSprites(){const W=PCAIR.w,H=PCAIR.h;if(PCAIR.sk===W+'x'+H)return;PCAIR.sk=W+'x'+H;   // 煙の粒と外側の暗さは、大きさが変わったときだけ描いておく（毎コマ作ると重い）
  const pf=document.createElement('canvas');pf.width=pf.height=64;const pg=pf.getContext('2d'),sm=pg.createRadialGradient(32,32,0,32,32,32);sm.addColorStop(0,'rgba(205,205,195,1)');sm.addColorStop(1,'rgba(205,205,195,0)');pg.fillStyle=sm;pg.fillRect(0,0,64,64);PCAIR.puff=pf;
  const vc=document.createElement('canvas');vc.width=W;vc.height=H;const vg2=vc.getContext('2d'),vg=vg2.createRadialGradient(W/2,H*.5,Math.min(W,H)*.35,W/2,H*.5,Math.max(W,H)*.72);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.45)');vg2.fillStyle=vg;vg2.fillRect(0,0,W,H);PCAIR.vig=vc}
function pcAirLamp(){const v=(($('table')||{}).style||{getPropertyValue:()=>''}).getPropertyValue('--lamp').trim()||'#e2b65b';
  const m=/^#?([0-9a-f]{6})$/i.exec(v);if(!m)return[226,182,91];const n=parseInt(m[1],16);return[n>>16&255,n>>8&255,n&255]}
function pcAirDraw(t){const g=PCAIR.g,W=PCAIR.w,H=PCAIR.h;if(!g||!W)return;const t0=performance.now();
  g.clearRect(0,0,W,H);const [r,gg,b]=pcAirLamp(),still=pcAirStill(),s=still?0:t/1000;
  // 顔（#busts）には何も重ねない：卓の板（.felt-wrap）の上端より下だけに描く（第7章のジンの本物のテルも隠さない。v0.98.1 CI で WebKit の顔のアップが 1.44 に下がった）
  const fw=PCAIR.cv.parentNode&&PCAIR.cv.parentNode.querySelector('.felt-wrap'),top0=fw&&PCAIR.cv.parentNode.offsetHeight?Math.max(0,Math.round(fw.offsetTop/PCAIR.cv.parentNode.offsetHeight*H)):0;
  g.save();g.beginPath();g.rect(0,top0,W,H-top0);g.clip();
  let close=false;try{close=typeof camState!=='undefined'&&camState.i>=0}catch(e){}
  // ランプの光の円錐（上から卓へ）。揺れは横に ±1.5%
  const lx=W*(.5+.015*Math.sin(s*.55)),top=top0,bot=Math.max(top0+1,H*.62),wt=W*.05,wb=W*.46;
  g.save();g.globalCompositeOperation='lighter';
  const cg=g.createLinearGradient(0,top,0,bot);cg.addColorStop(0,`rgba(${r},${gg},${b},.10)`);cg.addColorStop(1,`rgba(${r},${gg},${b},0)`);
  g.fillStyle=cg;g.beginPath();g.moveTo(lx-wt,top);g.lineTo(lx+wt,top);g.lineTo(lx+wb,bot);g.lineTo(lx-wb,bot);g.closePath();g.fill();
  // 卓の上の光だまり
  const pg=g.createRadialGradient(lx,H*.62,H*.02,lx,H*.62,W*.36);pg.addColorStop(0,`rgba(${r},${gg},${b},.10)`);pg.addColorStop(1,`rgba(${r},${gg},${b},0)`);g.fillStyle=pg;g.fillRect(0,0,W,H);
  // ポットのチップの光の反射（ゆっくり明滅）
  const pc=$('potChips'),tb=$('table');if(pc&&tb&&pc.getClientRects().length){const a=pc.getBoundingClientRect(),q=tb.getBoundingClientRect();
    if(a.width>4){const x=(a.left+a.width*.42-q.left)/2,y=(a.top+a.height*.2-q.top)/2,k=.18+.12*Math.sin(s*1.7);
      const sg=g.createRadialGradient(x,y,0,x,y,Math.max(6,a.width*.12));sg.addColorStop(0,`rgba(255,244,220,${k})`);sg.addColorStop(1,'rgba(255,244,220,0)');g.fillStyle=sg;g.fillRect(x-40,y-40,80,80)}}
  g.restore();
  // 煙（顔に寄っている間は薄く）
  pcAirSprites();g.globalAlpha=close?.012:.035;
  for(const p of PCAIR.puffs){const x=((p.x+s*p.v)%1.2-.1)*W,y=(p.y+.02*Math.sin(s*.4+p.p))*H,rr=p.r*W;g.drawImage(PCAIR.puff,x-rr,y-rr,2*rr,2*rr)}
  g.globalAlpha=1;
  // 外側の暗さ（光の届かない所）
  g.drawImage(PCAIR.vig,0,0);g.restore();PCAIR.top=top0;
  const ms=performance.now()-t0;PCAIR.ms=PCAIR.ms?PCAIR.ms*.9+ms*.1:ms;PCAIR.frames++;(PCAIR.hist||(PCAIR.hist=[])).push(ms);if(PCAIR.hist.length>60)PCAIR.hist.shift()}   // hist：qa が真ん中の値を見る（最初の1コマは絵の準備で重い）
function pcAirLoop(t){PCAIR.raf=0;if(!PCAIR.on)return;
  if(t-PCAIR.last>=33){PCAIR.last=t;try{pcAirDraw(t)}catch(e){PCAIR.on=false;throw e}}
  if(!pcAirStill())PCAIR.raf=requestAnimationFrame(pcAirLoop)}
function pcAirSync(){const on=pcAirOn();
  if(!on){if(PCAIR.on){PCAIR.on=false;cancelAnimationFrame(PCAIR.raf);PCAIR.raf=0}const cv=$('pcAir');if(cv)cv.hidden=true;return}
  if(!PCAIR.cv||!PCAIR.cv.isConnected)pcAirMake();if(!PCAIR.cv)return;PCAIR.cv.hidden=false;pcAirSize();
  PCAIR.on=true;if(pcAirStill()){cancelAnimationFrame(PCAIR.raf);PCAIR.raf=0;pcAirDraw(0)}else if(!PCAIR.raf)PCAIR.raf=requestAnimationFrame(pcAirLoop)}
LT.on('layout',()=>{try{pcAirSync()}catch(e){}});
LT.on('startHand',()=>{try{pcAirSync()}catch(e){}});
LT.on('render',()=>{try{if(!PCAIR.on||!PCAIR.cv||!PCAIR.cv.isConnected)pcAirSync()}catch(e){}});   // 卓が見えた最初の描き直しで始める（startHand の時は卓がまだ隠れている）
document.addEventListener('visibilitychange',()=>{try{pcAirSync()}catch(e){}});
mqOn(matchMedia(PCW_Q),()=>{try{pcAirSync()}catch(e){}});
try{new MutationObserver(()=>{try{pcAirSync()}catch(e){}}).observe(document.documentElement,{attributes:true,attributeFilter:['class']})}catch(e){}
