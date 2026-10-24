// ===== v0.98.5 PC 向け：大勝負の間（PC 向けリッチ演出 案4、2026-10-21 satou「全部」） =====
// PC（html.pcw）だけ。オールインがコールされたとき（S.runout）、またはリバーでポットが 30BB 以上のとき。
// ・部屋を暗くし、勝負している人（降りていない相手）の上半身にだけスポットを残す（#pcBig：上半身の層のすぐ上・卓の板の下の canvas。押せない）
// ・人だかり（43b_crowd.js）を PC の広さで大きく、人数も多く見せる（.ltcrowd.cr-big）
// ・最後の札（リバー）はゆっくりめくる（1.2秒まで。ハンドの進みは止めない。卓をクリックすると飛ばせる）。時間は ltBoardDur（21d_live_table.js）が決める
// 第7章の最後の手（ジンの本物のテル）では何もしない（顔を見せるため）。回想でも出さない。動き「少なめ」・動きを減らす設定では、暗くするのは切り替えだけ（ふわっとしない）でゆっくりめくりもしない
const PCBIG={BB:30,afterMs:1800,hno:-1,key:'',cv:null};
function pcBigOk(){try{return document.documentElement.classList.contains('pcw')&&!!S&&!!S.players&&!CFG.flashback&&!(S.finalHand&&CFG.ch&&!CFG.ch.p2&&CFG.ch.no===7)}catch(e){return false}}
function pcBigStill(){return document.documentElement.classList.contains('ltLite')||reducedMotion()}
function pcBigCv(){const cam=$('cam'),bu=$('busts');if(!cam||!bu)return null;let cv=$('pcBig');
  if(!cv){cv=document.createElement('canvas');cv.id='pcBig';cv.setAttribute('aria-hidden','true')}
  if(cv.parentNode!==cam||cv.previousElementSibling!==bu)bu.after(cv);   // 上半身（#busts）のすぐ上。卓の板（.felt-wrap）と名札はその上
  return PCBIG.cv=cv}
// 暗さを描く：全体を暗くして、勝負している相手の上半身の所を丸く抜く（座標は #cam の中。#busts と同じ箱なので、上半身の offset がそのまま使える）
function pcBigDraw(){const cv=PCBIG.cv,cam=$('cam');if(!cv||!cam)return;const W=cam.clientWidth,H=cam.clientHeight;if(!W||!H)return;
  const live=S.players.map((p,i)=>i).filter(i=>i>0&&inHand(S.players[i])),bs=live.map(i=>faceBox(i)).filter(Boolean);   // faceBox（30c_ui64.js）：上半身の真ん中は offsetLeft（translateX(-50%) で置いてある）
  const key=W+'x'+H+':'+bs.map(f=>[f.cx,f.top,f.w,f.h].join(',')).join('|');if(key===PCBIG.key)return;PCBIG.key=key;
  if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H}const g=cv.getContext('2d');g.clearRect(0,0,W,H);
  g.fillStyle='rgba(4,4,8,.62)';g.fillRect(0,0,W,H);g.globalCompositeOperation='destination-out';
  // 抜く所は縦長の楕円（横は上半身の幅の 0.36倍まで）。6人卓では上半身が重なって並ぶので、丸く大きく抜くと隣の降りた人まで明るくなった（perf:pcbig）
  for(const f of bs){const w=f.w,h=f.h,cx=f.cx,cy=f.top+h*.42,rx=w*.36,ry=h*.52;
    g.save();g.translate(cx,cy);g.scale(1,ry/rx);const sg=g.createRadialGradient(0,0,rx*.6,0,0,rx);sg.addColorStop(0,'rgba(0,0,0,1)');sg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=sg;g.fillRect(-rx,-rx,2*rx,2*rx);g.restore()}
  g.globalCompositeOperation='source-over'}
function pcBigOn(){const cv=pcBigCv();if(!cv)return;PCBIG.key='';pcBigDraw();cv.classList.toggle('still',pcBigStill());void cv.offsetWidth;cv.classList.add('on');
  const c=document.querySelector('#table .ltcrowd');if(c)c.classList.add('cr-big')}
function pcBigOff(){const cv=$('pcBig');if(cv)cv.classList.remove('on');const c=document.querySelector('#table .ltcrowd');if(c)c.classList.remove('cr-big');clearTimeout(PCBIG.t)}
// ゆっくりめくる最後の札（21d_live_table.js の ltBoardDur が読む）
// リバーを配る前（nextStreet）に呼ばれる：大勝負になっている、またはなりそう（ポット 30BB 以上・2人以上残っている）なら true
LT.pcBigRiver=()=>{try{return pcBigOk()&&!pcBigStill()&&S.players.filter(inHand).length>=2&&(PCBIG.hno===S.handNo||!!S.runout||potTotal()>=PCBIG.BB*BB())}catch(e){return false}};
LT.on('startHand',()=>{try{PCBIG.hno=-1;pcBigOff()}catch(e){}});
LT.on('render',()=>{try{
  if(!S||!S.players||S.handOver)return;
  if(PCBIG.hno===S.handNo){if(!pcBigOk()){pcBigOff();return}const cv=$('pcBig');if(cv&&cv.classList.contains('on'))pcBigDraw();else pcBigOn();return}   // 降りた人が出たら抜く所を描き直す。PC でなくなったら消し、同じハンドで PC に戻ったらまた出す（CodeRabbit PR #138）
  if(!pcBigOk())return;
  if(!(S.runout||(S.street==='river'&&potTotal()>=PCBIG.BB*BB())))return;
  if(S.players.filter(inHand).length<2)return;
  PCBIG.hno=S.handNo;pcBigOn()}catch(e){}});
LT.on('layout',()=>{try{if(PCBIG.hno===S.handNo&&$('pcBig')&&$('pcBig').classList.contains('on')){PCBIG.key='';pcBigDraw()}}catch(e){}});
LT.on('endHand',()=>{try{if(PCBIG.hno!==S.handNo)return;clearTimeout(PCBIG.t);PCBIG.t=setTimeout(()=>{try{pcBigOff()}catch(e){}},PCBIG.afterMs*Math.max(.6,SPEED()))}catch(e){}});
mqOn(matchMedia(PCW_Q),()=>{try{if(!document.documentElement.classList.contains('pcw'))pcBigOff()}catch(e){}});
// ゆっくりめくっている間に卓をクリックしたら、めくり終わりまで飛ばす（ボタンの押し方は変えない。クリックはそのままボタンにも届く）
document.addEventListener('pointerdown',e=>{try{if(!S||!S.ltBoardAt||!S.ltBoardSlow||!e.target.closest('#table'))return;
  const el=performance.now()-S.ltBoardAt,dur=ltBoardDur(S.ltBoardFrom||0);if(el<dur){S.ltBoardAt=performance.now()-dur;ltBoardAnim()}}catch(x){}},true);
