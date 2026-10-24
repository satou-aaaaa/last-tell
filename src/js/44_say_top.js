/* ---------- 吹き出しを上の帯の下で止める（v88.1 レビュー） ---------- */
// 第11章の縦で、上の段の席（ゲン）の吹き出しの頭（名前）が上の帯（☰・章名・目標）の下に入って切れていた（自分の番でページが下へ流れたとき）。
// 吹き出しの追いかけ（sayFollow）は出た直後とカメラが動く間だけ回るので、止まったあとにずれた吹き出しは直らない。
// 位置合わせ（'layout'、1秒ごとの見回りとカメラの動き終わりにも来る）の最後に、上の帯の下端＋4px（帯と横に重ならなければ画面の上の端＋4px）より上に出ている吹き出しを下げる。
// 横向きでも、ゲンの吹き出しの名前が画面の上の端で切れていた（手元の画面チェックで見つけた）。
function sayTopBar(){const b=$('tbar');if(!b||b.hidden||!b.getClientRects().length)return null;   // 帯は position:fixed で offsetParent が無いので、大きさで見る
  const r=b.getBoundingClientRect();return r.height>2&&r.bottom<innerHeight/3?r:null}   // 横向きは帯が右の列にあるので、横に重なる吹き出しだけ見る
function sayClampTop(){const b=sayTopBar();
  const list=[...document.querySelectorAll('#sayLayer .say.go, #plates .say.go')].filter(e=>e.offsetParent),R=list.map(e=>e.getBoundingClientRect());   /* say-go-ok：吹き出しそのものを扱う所（よける一覧ではない） */   // 全部測ってから全部書く
  list.forEach((e,k)=>{const under=b&&R[k].right>b.left&&R[k].left<b.right,lim=under?b.bottom+4:4,d=lim-R[k].top;   // 帯の下でなくても、画面の上の端（横向き）で切れないように
    if(d>.5)e.style.marginTop=((parseFloat(e.style.marginTop)||0)+d).toFixed(1)+'px'})}
LT.on('layout',()=>{try{if(!$('game').hidden)sayClampTop()}catch(e){}});
// 追いかけ（sayFollow）の上の余白にも上の帯を数える（帯が卓に重なっている形のとき）
{const _tp=sayTopPad;sayTopPad=function(){let tp=_tp.apply(this,arguments);try{const b=sayTopBar(),t=$('table');if(b&&t){const r=t.getBoundingClientRect();if(b.left<r.right-4&&b.right>r.left+4)tp=Math.max(tp,b.bottom+4-r.top)}}catch(e){}return tp}}
// 自分の番でページが下へ流れる（スマホで操作の列を見せるため）と、上の帯は止まったまま卓だけ上がるので、吹き出しが帯の下に入る。流れたときも置き直す
addEventListener('scroll',()=>{try{if(!$('game').hidden)layoutSoon()}catch(e){}},{passive:true});
// 追いかけ（sayFollow）は位置合わせのあとに毎コマ margin を書き直し、掛け合いのよけ（bAvoid）の上向きのずれも足すので、そのあとにも止める
{const _sf=sayFollow;sayFollow=function(){const on=_sf.apply(this,arguments);if(on)try{sayClampTop()}catch(e){}return on}}
