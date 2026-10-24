// ===== v0.98.4 PC 向け：ディーラーの手（PC 向けリッチ演出 案3、2026-10-21 satou「全部」） =====
// PC（html.pcw）だけ。卓の奥（卓の板の上端より下）から手が出て、配る・燃やし札を置く・場札を開く・ポットを勝った人へ押し出す。
// 手は今の札とチップの動きを後から追って描くだけ（待ち時間・配る速さは何も変えない。タイマーも足さない）。
// 描く所は卓の板（.felt-wrap）の上端より下だけ（顔に手がかからない。第7章のジンの本物のテルの場面も同じ）。
// 止める：動き「少なめ」（html.ltLite）・prefers-reduced-motion・画面が隠れている間・PC でないとき（何も描かない）。
// 何を追っているかを PCHAND.kind に、描いた回数を PCHAND.seen に残す（qa/checks/perf.js の perf:pchand が見る）
const PCHAND={on:false,raf:0,cv:null,g:null,w:0,h:0,x:0,y:0,a:0,rot:0,vis:0,kind:'',seen:{},frames:0,ms:0,hist:[],top:0,idleAt:0};
function pcHandOn(){return document.documentElement.classList.contains('pcw')&&!!$('table')&&!$('game').hidden&&!CFG.flashback}
function pcHandStill(){return document.documentElement.classList.contains('ltLite')||reducedMotion()||document.hidden}
function pcHandMake(){const tb=$('table');if(!tb)return null;let cv=$('pcHand');
  if(!cv){cv=document.createElement('canvas');cv.id='pcHand';cv.setAttribute('aria-hidden','true');
    const fw=tb.querySelector('.felt-wrap'),par=fw?fw.parentNode:tb,after=$('pcAir')&&$('pcAir').parentNode===par?$('pcAir'):fw;par.insertBefore(cv,after?after.nextSibling:null)}   // カメラ（#cam）の中で、光と煙（#pcAir）の上・名札（.plates）の下
  PCHAND.cv=cv;PCHAND.g=cv.getContext('2d');return cv}
function pcHandSize(){const cv=PCHAND.cv,tb=$('table');if(!cv||!tb)return;const w=Math.max(1,tb.clientWidth),h=Math.max(1,tb.clientHeight);
  if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}PCHAND.w=w;PCHAND.h=h}
// 画面の座標 → canvas の座標（#cam が顔に寄って拡大していても合う）
function pcHandMap(){const c=PCHAND.cv.getBoundingClientRect();if(!(c.width>0&&c.height>0))return null;const kx=PCHAND.w/c.width,ky=PCHAND.h/c.height;
  return{pt:(x,y)=>[(x-c.left)*kx,(y-c.top)*ky],k:kx}}
const pcHandMid=r=>r&&r.width>0?[r.left+r.width/2,r.top+r.height/2]:null;
function pcHandSeat(i){const h=i===0?$('mine')&&$('mine').querySelector('.hold'):$('spot'+i)&&$('spot'+i).querySelector('.hand');return h&&h.getBoundingClientRect()}
// 今どこへ手を出すか：[{x,y,rot}]（画面の座標）。何もしていなければ空
function pcHandTarget(){const out=[],now=performance.now(),dk=document.querySelector('.felt .lltools .ddeck'),home=pcHandMid(dk&&dk.getBoundingClientRect())||pcHandMid($('boardCards')&&$('boardCards').getBoundingClientRect());
  if(!home||!S||!S.players)return{kind:'',pts:out,home};
  // 1) ポットを押し出す（.potmove が飛んでいる間、その後ろに両手）
  const pm=[...document.querySelectorAll('#table > .potmove')].map(e=>e.getBoundingClientRect()).filter(r=>r.width>0);
  if(pm.length){const r=pm[0],c=pcHandMid(r),side=Math.max(22,r.width*.45);   // 片手で、ディーラーの側（左）からチップを押す（v0.98.4 レビュー：両腕が相手の伏せ札の上から下りて、その人が取りに来たように見えた）
    out.push({x:c[0]-side,y:c[1],rot:0});return{kind:'push',pts:out,home}}
  // 2) 燃やし札（.llburn が山から捨て札へ滑っている間）
  const bn=document.querySelector('#fxLayer .llburn');if(bn){const c=pcHandMid(bn.getBoundingClientRect());if(c){out.push({x:c[0],y:c[1]-6,rot:.25});return{kind:'burn',pts:out,home}}}
  // 3) 場札を開く（21d_live_table.js の ltBoardDur と同じ時間）
  if(S.ltBoardAt&&S.board){const el=now-S.ltBoardAt,from=S.ltBoardFrom||0,dur=ltBoardDur(from);
    if(el>=0&&el<=dur){const cs=[...$('boardCards').children].slice(from,S.board.length).map(e=>e.getBoundingClientRect()).filter(r=>r.width>0);
      if(cs.length){const p=Math.min(1,el/dur),k=Math.min(cs.length-1,Math.floor(p*cs.length)),c=pcHandMid(cs[k]);out.push({x:c[0],y:c[1]-cs[k].height*.1,rot:0});return{kind:'board',pts:out,home,skip:$('boardCards').children[from+k]}}}}
  // 4) 配る（ltDealAnim と同じ順と間：LT_DEAL ごとに1枚、2周）。手は山の所で、配る先へ少し向いて手首を返す
  if(S.ltDealAt&&S.ltOrder&&S.ltOrder.length){const n=S.ltOrder.length,el=now-S.ltDealAt,iv=LT_DEAL(),k=Math.floor(el/iv);
    if(el>=-300*SPEED()&&k<2*n){const kk=Math.max(0,k),sr=pcHandSeat(S.ltOrder[kk%n]),t=pcHandMid(sr);
      if(t){const dx=t[0]-home[0],dy=t[1]-home[1],ph=el<0?0:(el%iv)/iv,f=.08+.1*Math.sin(Math.PI*ph);out.push({x:home[0]+dx*f,y:home[1]+dy*f,rot:Math.atan2(-dx,Math.max(40,dy))*.6});return{kind:'deal',pts:out,home}}}}
  return{kind:'',pts:out,home}}
// 腕の根元（ディーラーの席）：卓の左の端の外、山の高さ。どの動きでも同じ所から腕が出る（v0.98.4 レビュー：腕が相手の席の間から出て、相手の手に見えた）
// 手は「ディーラーの持ち場」（場札の上の端より下）から上へ出さない。上へ出すと腕が相手の伏せ札・名札の上を通る
function pcHandRoot(home){const tb=$('table');if(!tb||!home)return null;const r=tb.getBoundingClientRect(),b=pcHandMid($('boardCards')&&$('boardCards').getBoundingClientRect());return{x:r.left-40,y:(b?b[1]:home[1])+18}}   // 高さは場札の列（山の位置で変えない。v0.98.6 レビュー：山が右のハンドだけ根元が上の席側に見えた）
// 腕・手を描かない所（v0.98.6 レビュー：袖が場札3枚を横切り、手が自分の手札の上に出た）：場札・自分の手札・ポットの額。手だけは、いま開いている場札の上には出てよい
function pcHandHoles(skip){const out=[],add=e=>{if(!e||(skip&&skip.contains(e))||!e.getClientRects().length)return;const r=e.getBoundingClientRect();if(r.width>2&&r.height>2)out.push(r)};
  document.querySelectorAll('#boardCards .card:not(.slot), #mine .hold .card, #potSign').forEach(add);return out}
// 手を自分の手札より下（手前）へ出さない：手札の上の端（画面の座標）。無ければ制限なし
function pcHandFloor(){const cs=[...document.querySelectorAll('#mine .hold .card')].map(e=>e.getBoundingClientRect()).filter(r=>r.width>2);return cs.length?Math.min(...cs.map(r=>r.top)):1e9}
function pcHandZoneTop(){const b=$('boardCards'),cs=b?[...b.children].map(e=>e.getBoundingClientRect()).filter(r=>r.width>0):[];if(!cs.length)return -1e9;const t=Math.min(...cs.map(r=>r.top)),h=Math.max(...cs.map(r=>r.height));return t-h*.15}
// 手を1つ描く（canvas の座標。指は下＝手前を向く。s：大きさ、al：濃さ）
// 袖（黒いベスト）は arm の向き（手首から腕の根元へ、まっすぐ）に len の長さ、手は rot の向き。袖を手の向きで傾けない（v0.98.6 レビュー：配るときに手首を返すと腕ごと傾き、根元が上の席側に見えた）
function pcHandSleeve(g,x,y,arm,s,al,len){g.save();g.globalAlpha=al;g.translate(x,y);g.rotate(arm);g.scale(s,s);
  const L=Math.max(40,len||100),sl=g.createLinearGradient(0,-24,0,-L);sl.addColorStop(0,'rgba(21,21,26,1)');sl.addColorStop(Math.max(.01,1-60/L),'rgba(21,21,26,.92)');sl.addColorStop(1,'rgba(21,21,26,0)');g.fillStyle=sl;
  g.beginPath();g.moveTo(-16,-24);g.lineTo(16,-24);g.lineTo(19,-L);g.lineTo(-19,-L);g.closePath();g.fill();g.restore()}
function pcHandPalm(g,x,y,rot,s,al){g.save();g.globalAlpha=al;g.translate(x,y);g.rotate(rot);g.scale(s,s);
  g.fillStyle='#15151a';g.fillRect(-16,-34,32,10);   // 袖の先（手首の上）
  g.fillStyle='#f1efe9';g.fillRect(-15,-32,30,8);   // 白い袖口
  const sk=g.createLinearGradient(-15,0,15,0);sk.addColorStop(0,'#b88a68');sk.addColorStop(.5,'#cf9f7c');sk.addColorStop(1,'#a97b5b');g.fillStyle=sk;
  g.beginPath();g.roundRect(-14,-25,28,26,8);g.fill();   // 手の甲
  for(let i=0;i<4;i++){g.beginPath();g.roundRect(-13+i*7,-4,6,18-Math.abs(i-1.5)*2.5,3);g.fill()}   // 指
  g.beginPath();g.roundRect(10,-18,6,15,3);g.fill();   // 親指
  g.fillStyle='rgba(0,0,0,.18)';for(let i=1;i<4;i++)g.fillRect(-13+i*7-1,-2,1,10);   // 指のすき間
  g.restore()}
// 描いた所から holes の四角を消す（場札が2枚の部品で重なっていても消し残さない。evenodd の切り抜きだと重なった所が描けてしまった）
function pcHandErase(g,m,holes){if(!holes.length)return;g.save();g.globalCompositeOperation='destination-out';g.fillStyle='#000';for(const r of holes){const a=m.pt(r.left,r.top),b=m.pt(r.right,r.bottom);g.fillRect(a[0],a[1],b[0]-a[0],b[1]-a[1])}g.restore()}
const pcHandAng=a=>Math.atan2(Math.sin(a),Math.cos(a));   // -π〜π にそろえる（角度を追うとき、反対回りに一周しない）
function pcHandFrame(t){const g=PCHAND.g,W=PCHAND.w,H=PCHAND.h;if(!g||!W)return false;const t0=performance.now();
  const m=pcHandMap();if(!m){g.clearRect(0,0,W,H);return false}
  const fw=PCHAND.cv.parentNode&&PCHAND.cv.parentNode.querySelector('.felt-wrap'),fr=fw&&fw.getBoundingClientRect();
  if(!fr||!(fr.height>0)){g.clearRect(0,0,W,H);return false}
  const top=Math.max(0,Math.ceil(m.pt(0,fr.top)[1])+1);PCHAND.top=top;
  const T=pcHandTarget(),busy=T.pts.length>0;PCHAND.kind=T.kind;PCHAND.skip=T.skip||null;
  // 手の大きさは場札1枚の幅に合わせる
  const bc=$('boardCards')&&[...$('boardCards').children].find(e=>e.getBoundingClientRect().width>0),cw=bc?bc.getBoundingClientRect().width*m.k:40,s=Math.max(.7,Math.min(1.8,cw/34));
  const rs=pcHandRoot(T.home),rc=rs?m.pt(rs.x,rs.y):null,zt=m.pt(0,pcHandZoneTop())[1];PCHAND.root=rc;
  const fl=m.pt(0,pcHandFloor())[1]-18*s;   // 手（指先まで）を自分の手札にかけない
  const goal=T.pts.map(p=>{const q=m.pt(p.x,p.y),y=Math.max(zt,Math.min(q[1],fl));return{x:q[0],y,tw:p.rot*.3}});
  // なめらかに追う（1コマで 45%）。何もしていない間はその場で薄く消える。消えていた手は、次の動きの所に出る（卓の上を横切らない）
  const step=(o,q)=>{if(q){if(o.a<.05){o.x=q.x;o.y=q.y;o.tw=q.tw}else{o.x+=(q.x-o.x)*.45;o.y+=(q.y-o.y)*.45;o.tw+=pcHandAng(q.tw-o.tw)*.45}o.a+=(1-o.a)*.35}else o.a*=.75;if(o.a<.02)o.a=0};
  const h1=PCHAND.h1||(PCHAND.h1={x:0,y:0,tw:0,a:0});step(h1,goal[0]);PCHAND.h2=null;   // 手は1つ（v0.98.6 レビュー：手札の上に手首から先だけの手が残っていた）
  g.clearRect(0,0,W,H);
  let drawn=false;PCHAND.drawnN=0;PCHAND.sleeveEnd=null;
  if(h1.a>0){const arm=rc?Math.atan2(rc[1]-h1.y,rc[0]-h1.x)+Math.PI/2:0,len=rc?Math.hypot(rc[0]-h1.x,rc[1]-h1.y)/s:100;
    g.save();g.beginPath();g.rect(0,top,W,H-top);g.clip();   // 顔（卓の板の上端より上）には描かない
    pcHandSleeve(g,h1.x,h1.y,arm,s,h1.a,len);pcHandErase(g,m,pcHandHoles(null));   // 袖は場札・手札・ポットの額の下をくぐる
    pcHandPalm(g,h1.x,h1.y,arm+h1.tw,s,h1.a);pcHandErase(g,m,pcHandHoles(T.skip||null));g.restore();   // 手は、いま開いている場札の上だけ出てよい
    PCHAND.sleeveEnd=rc?[h1.x+Math.sin(arm)*len*s,h1.y-Math.cos(arm)*len*s]:null;drawn=true;PCHAND.drawnN=1}
  if(busy&&drawn)PCHAND.seen[T.kind]=(PCHAND.seen[T.kind]||0)+1;
  const ms=performance.now()-t0;PCHAND.frames++;PCHAND.hist.push(ms);if(PCHAND.hist.length>60)PCHAND.hist.shift();PCHAND.ms=PCHAND.ms?PCHAND.ms*.9+ms*.1:ms;
  return busy||drawn}
function pcHandLoop(t){PCHAND.raf=0;if(!PCHAND.on)return;let more=false;try{more=pcHandFrame(t)}catch(e){PCHAND.on=false;throw e}
  if(more)PCHAND.idleAt=0;else if(!PCHAND.idleAt)PCHAND.idleAt=t;
  if(!pcHandStill()&&(more||t-PCHAND.idleAt<300))PCHAND.raf=requestAnimationFrame(pcHandLoop)}   // 何もしていない間は止まる（次の配り・場札・ポットで pcHandWake が起こす）
function pcHandClear(){const cv=$('pcHand');if(cv){const g=cv.getContext('2d');g.clearRect(0,0,cv.width,cv.height)}PCHAND.h1=PCHAND.h2=null}
function pcHandSync(){const on=pcHandOn()&&!pcHandStill();
  if(!on){if(PCHAND.on){PCHAND.on=false;cancelAnimationFrame(PCHAND.raf);PCHAND.raf=0}pcHandClear();const cv=$('pcHand');if(cv)cv.hidden=!pcHandOn();return}
  if(!PCHAND.cv||!PCHAND.cv.isConnected)pcHandMake();if(!PCHAND.cv)return;PCHAND.cv.hidden=false;pcHandSize();PCHAND.on=true}
// 起こす：手が要る動きが始まった・続いているとき
function pcHandWake(){try{pcHandSync();if(!PCHAND.on||PCHAND.raf)return;
  const busy=(S&&(S.ltDealAt||S.ltBoardAt))||document.querySelector('#table > .potmove, #fxLayer .llburn');if(busy){PCHAND.idleAt=0;PCHAND.raf=requestAnimationFrame(pcHandLoop)}}catch(e){}}
LT.on('layout',()=>{try{pcHandSync()}catch(e){}});
LT.on('startHand',pcHandWake);
LT.on('nextStreet',pcHandWake);
LT.on('render',pcHandWake);
setInterval(()=>{if(PCHAND.on&&!PCHAND.raf&&!$('game').hidden)pcHandWake()},150);   // ポットの押し出し（potPush）は render の後に始まるので、ここで拾う
document.addEventListener('visibilitychange',()=>{try{pcHandSync()}catch(e){}});
mqOn(matchMedia(PCW_Q),()=>{try{pcHandSync()}catch(e){}});
