/* ---------- 見せた札を捨て札の山より見せる（v88.2 レビュー） ---------- */
// 6人卓の縦で、ショーダウンで勝った左の席の見せた札（5♠）が捨て札の山（.muckpile）の下に隠れていた。
// ハンドの終わりに、見せた札と重なる山は隠す（山は飾り。札は勝ち負けの答えなので見えるほうを取る）。次のハンドで戻る。
function muckYield(){const m=document.querySelector('.felt .boardspot > .muckpile');if(!m)return;
  const on=!!(S&&S.handOver);if(!on||!m.children.length){m.classList.remove('mkyield');return}
  const R=e=>e.getBoundingClientRect(),shown=[...document.querySelectorAll('#felt .spot .hand:not(.folded):not(.muck) .card:not(.back):not(.slot)')].filter(e=>e.offsetParent).map(R);
  const hit=[...m.querySelectorAll('.muckcard')].map(R).some(a=>shown.some(b=>a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1));
  m.classList.toggle('mkyield',hit)}
LT.on('layout',()=>{try{muckYield()}catch(e){}});
// 見せた札が場札に重なるときは、その席の札を上へ逃がす（v91.2 レビュー：6人卓の縦で右の席の見せた札が川の札の上半分にかかった）
// ハンドの終わりだけ。場札は動かさない（みんなの札なので）。次のハンドで戻す
// 卓の四角を画面の中に切りつめる（v0.98.1：PC の横長の卓は #table が画面の外まで広がることがあり、「卓の中」でも画面の外へ札を置いた）
function sybTB(){const r=($('table')||document.body).getBoundingClientRect(),W=innerWidth,H=innerHeight;return {left:Math.max(r.left,0),top:Math.max(r.top,0),right:Math.min(r.right,W),bottom:Math.min(r.bottom,H)}}
function showYieldBoard(){const hands=[...document.querySelectorAll('#felt .spot .hand')];
  const on=!!(S&&S.handOver);
  hands.forEach(h=>{if(h.dataset.syb&&(!on||h.classList.contains('folded')||h.classList.contains('muck'))){h.style.translate='';h.style.scale='';h.classList.remove('sybs');delete h.dataset.syb}});
  document.querySelectorAll('#plates [data-sybp]').forEach(p=>{p.style.translate='';delete p.dataset.sybp});   // 前に上へ逃がした名札を戻してから測る
  if(!on)return;
  const R=e=>e.getBoundingClientRect(),board=[...document.querySelectorAll('#boardCards .card:not(.slot), #board2 .card:not(.slot)')].filter(e=>e.offsetParent).map(R).filter(r=>r.width>2);if(!board.length)return;
  let moved=0;
  hands.forEach(h=>{if(h.classList.contains('folded')||h.classList.contains('muck'))return;
    const cs=[...h.querySelectorAll('.card:not(.back):not(.slot)')].filter(e=>e.offsetParent);if(!cs.length)return;
    h.style.translate='';h.style.scale='';h.classList.remove('sybs');
    let need=0;cs.map(R).forEach(a=>board.forEach(b=>{if(!(a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1))return;
      const d=a.top+a.bottom<b.top+b.bottom?-(a.bottom-b.top+3):b.bottom-a.top+3;if(Math.abs(d)>Math.abs(need))need=d}));const need0=need;   // 場札より上にある札は上へ、下にある札は下へ
    // v96 レビュー：5人卓では上へ逃がすと名札（と D）に札の数字の角が隠れた。名札の下から場札の上までに収まらないときは、札を縮めて収める
    let sc=1,dx=0;{const sp=h.closest('.spot'),pl=sp&&$('plate'+sp.id.replace('spot','')),q0=pl&&pl.getClientRects().length&&R(pl).width>2?R(pl):null,db=q0&&pl.querySelector('.dbadge'),qd=db&&db.getClientRects().length?R(db):null,   // 名札に付いた D（.dbadge）は名札の外にはみ出すので、名札とまとめて1つの四角で見る（v0.96.4 手元：横でカイの 9♠ に D がかかった）
      q=q0&&qd&&qd.width>2?{left:Math.min(q0.left,qd.left),right:Math.max(q0.right,qd.right),top:Math.min(q0.top,qd.top),bottom:Math.max(q0.bottom,qd.bottom)}:q0;
      if(q){const rs=cs.map(R),top=Math.min(...rs.map(r=>r.top)),bot=Math.max(...rs.map(r=>r.bottom)),bt=Math.min(...board.map(r=>r.top)),L=Math.min(...rs.map(r=>r.left)),Rt=Math.max(...rs.map(r=>r.right));
        if(L<q.right&&q.left<Rt&&top<bt&&top+need<q.bottom+1&&q.bottom<bt){const room=bt-3-(q.bottom+1),f=room/(bot-top),
            // v96.1 レビュー：札の高さは 28px より小さくしない（横画面で数字が読めなかった）。0.6倍の下限で縮めきれずに名札の下へ入る回もあった（PC）
            cH=Math.max(...rs.map(r=>r.height)),bH=Math.max(...board.map(r=>r.height)),fmin=Math.min(1,(document.documentElement.classList.contains('pcw')?Math.max(29,bH*.8+1):29)/cH);   // PC は場札の 0.8倍より小さくしない（v0.98.1 CI：第14章の PC で 33px／場札 85px まで縮んだ）
          // 名札の下へ縮めて置く先も、ほかの席の札・山・席番号にかからないか確かめる（CodeRabbit PR #105）。かかるなら下の「横へずらす」へ
          const okF=f>=fmin&&(()=>{const s1=Math.min(1,f),cx=(L+Rt)/2,l1=cx-(cx-L)*s1,r1=cx+(Rt-cx)*s1,t1=q.bottom+1,b1=t1+(bot-top)*s1;
            // ほかの名札の D（.dbadge）も入れる。名札の外にはみ出す（v0.96.4 CI：横でソウゲンの 3♥ の角が左の名札の D にかかった）
            return [...document.querySelectorAll('#felt .spot .hand:not(.folded):not(.muck) .card:not(.slot), #plates .plate, #plates .dbadge, .llseats i:not([hidden]), #dbtn, #felt .spot .mystack')].filter(e=>!h.contains(e)&&e!==pl&&!pl.contains(e)&&e.getClientRects().length).map(R).filter(r=>r.width>2).every(r=>!(l1<r.right-1&&r.left<r1-1&&t1<r.bottom-1&&r.top<b1-1))})();
          if(okF){sc=Math.min(1,f);need=q.bottom+1-top}
          else{// 名札と場札の間に入らない：28px の大きさで場札のすぐ上に置き、名札の横の空いた方へずらす
            sc=fmin;need=bt-3-top-(bot-top)*sc;
            if(top+need<q.bottom-1){const cx=(L+Rt)/2,l2=cx-(cx-L)*sc,r2=cx+(Rt-cx)*sc,T=sybTB(),
                t2=top+need,b2=t2+(bot-top)*sc,
                // ずらした先がほかの席の札・名札・席番号・チップの山（自分の席の山も。v0.96.4 手元：横でカイの札が自分の山の上へ動いた）にかからないか（v0.96.2 手元：横で左上の席の見せた札に重なった）
                av=[...document.querySelectorAll('#felt .spot .hand:not(.folded):not(.muck) .card:not(.slot), #plates .plate, .llseats i:not([hidden]), .dbadge, #dbtn, #felt .spot .mystack')].filter(e=>!h.contains(e)&&e!==pl&&e.getClientRects().length).map(R).filter(r=>r.width>2),
                clr=d=>av.every(r=>!(l2+d<r.right-1&&r.left<r2+d-1&&t2<r.bottom-1&&r.top<b2-1)),
                toL=q.left-2-r2,toR=q.right+2-l2,okL=l2+toL>=T.left+2&&clr(toL),okR=r2+toR<=T.right-2&&clr(toR);
              dx=okL&&(!okR||-toL<=toR)?toL:okR?toR:0;
              if(!dx){// 横にも置けない：札は 28px で場札のすぐ上に置き、名札のほうを上へ逃がす（20px まで。名札の数字より、見せた札の数字が大事）
                // 持ち上げた名札が本当に上がったか測る。上がらない・顔の陰に入るときは戻す（v96.4 レビュー：WebKit の PC でカイの名札が消え、札がその場所に乗った）
                const up=Math.ceil(q.bottom+1-(top+need));if(up>0&&up<=20){pl.style.translate=`0 ${-up}px`;pl.dataset.sybp='1';const pq=R(pl),mx=pq.left+pq.width/2,my=pq.top+pq.height/2,eh=document.elementFromPoint(mx,my);if(pq.bottom>top+need+1||(eh&&!pl.contains(eh)&&!h.contains(eh)&&eh.closest&&eh.closest('#busts'))){pl.style.translate='';delete pl.dataset.sybp;sc=1;need=need0}}else{sc=1;need=need0}}}}}
        // v96.2 レビュー：横の席（PC の右の席）は名札が場札の上にないので上の分かれ道に入らず、伸びた名札（勝ち・役の名前）が札の上の端にかかった。名札の下か上の、空いているほうへ札をずらす
        // 場札からよけた先（need）が名札にかかるときも
        else if(L<q.right-1&&q.left<Rt-1&&top+need<q.bottom-1&&q.top<bot+need-1){const T=sybTB(),
            av=board.concat([...document.querySelectorAll('#felt .spot .hand:not(.folded):not(.muck) .card:not(.slot), #plates .plate, .llseats i:not([hidden]), .dbadge, #dbtn, #felt .spot .mystack')].filter(e=>!h.contains(e)&&e!==pl&&e.getClientRects().length).map(R).filter(r=>r.width>2)),
            clr=d=>top+d>=T.top+2&&bot+d<=T.bottom-2&&av.every(r=>!(L<r.right-1&&r.left<Rt-1&&top+d<r.bottom-1&&r.top<bot+d-1)),
            dn=Math.ceil(q.bottom+1-top),up=Math.floor(q.top-1-bot),c=[dn,up].filter(clr).sort((x,y)=>Math.abs(x)-Math.abs(y));
          if(c.length)need=c[0]}}}   // どちらも空いていなければ、場札をよけた位置のまま   // それでも無理なら前のとおり
    // ほかの席の名札（と D）が札の角にかかるときも、空いている向きへ少しずらす（v0.96.4 CI：横で左の名札の下の端が、となりの席の 3♥ の角にかかった）
    try{const sp=h.closest('.spot'),pl=sp&&$('plate'+sp.id.replace('spot','')),rs=cs.map(R),top=Math.min(...rs.map(r=>r.top)),bot=Math.max(...rs.map(r=>r.bottom)),L=Math.min(...rs.map(r=>r.left)),Rt=Math.max(...rs.map(r=>r.right)),
        cx=(L+Rt)/2,l=cx-(cx-L)*sc+dx,r=cx+(Rt-cx)*sc+dx,t=top+need,b=t+(bot-top)*sc,
        hitOf=(arr,x,y)=>arr.filter(q=>l+x<q.right-1&&q.left<r+x-1&&t+y<q.bottom-1&&q.top<b+y-1),
        pls=[...document.querySelectorAll('#plates .plate, #plates .dbadge')].filter(e=>e!==pl&&!(pl&&pl.contains(e))&&e.getClientRects().length).map(R).filter(q=>q.width>2),
        hp=hitOf(pls,0,0);
      if(hp.length){const T=sybTB(),
          av=board.concat(pls,[...document.querySelectorAll('#felt .spot .hand:not(.folded):not(.muck) .card:not(.slot), .llseats i:not([hidden]), #dbtn, #felt .spot .mystack')].filter(e=>!h.contains(e)&&e.getClientRects().length).map(R).filter(q=>q.width>2)),
          cand=[[0,Math.max(...hp.map(q=>q.bottom))+1-t],[0,Math.min(...hp.map(q=>q.top))-1-b],[Math.max(...hp.map(q=>q.right))+1-l,0],[Math.min(...hp.map(q=>q.left))-1-r,0]]
            .filter(([x,y])=>Math.abs(x)+Math.abs(y)<=40&&l+x>=T.left+2&&r+x<=T.right-2&&t+y>=T.top+2&&b+y<=T.bottom-2&&!hitOf(av,x,y).length)
            .sort((u,v)=>Math.abs(u[0])+Math.abs(u[1])-Math.abs(v[0])-Math.abs(v[1]));
        if(cand.length){dx+=cand[0][0];need+=cand[0][1]}}}catch(e){}
    // 卓（画面の中）の左右の端から札が出るときは内側へ（v0.98.5 CI：PC の6人卓で、いちばん左の席の勝った札が画面の左の端から 3px 出た）
    try{const rs=cs.map(R).filter(r=>r.width>2);if(rs.length){const T=sybTB(),L=Math.min(...rs.map(r=>r.left)),Rt=Math.max(...rs.map(r=>r.right)),cx=(L+Rt)/2,l=cx-(cx-L)*sc+dx,r=cx+(Rt-cx)*sc+dx;
      if(l<T.left+4)dx+=T.left+4-l;else if(r>T.right-4)dx-=r-(T.right-4)}}catch(e){}
    if(!need&&!dx&&sc===1){delete h.dataset.syb;return}
    // 縮めて小さくなった札は、角の小さな数字ではなく真ん中に大きく数字とマークを出す（v96.1 レビュー：横で数字の札が真ん中のマークしか読めなかった）
    if(sc<1&&Math.max(...cs.map(e=>R(e).height))*sc<36)h.classList.add('sybs');
    const k=h.offsetHeight?R(h).height/h.offsetHeight:1;
    h.style.transformOrigin=sc<1?'50% 0':'';h.style.scale=sc<1?sc.toFixed(3):'';
    h.style.translate=`${Math.round(dx/(k||1))}px ${Math.round(need/(k||1))}px`;h.dataset.syb='1';moved=1;
    // 置いたあとの本当の位置で、もう一度ほかの名札（と D）を確かめる。先の見積もり（縮めた大きさ・遠近）がずれて角が名札にかかった（v0.97.0 手元：横の第14章でとなりの名札に 7×4px）
    try{const sp=h.closest('.spot'),pl=sp&&$('plate'+sp.id.replace('spot','')),rs=cs.map(R).filter(r=>r.width>2);if(rs.length){
      const l=Math.min(...rs.map(r=>r.left)),r=Math.max(...rs.map(r=>r.right)),t=Math.min(...rs.map(r=>r.top)),b=Math.max(...rs.map(r=>r.bottom)),
        hitOf=(arr,x,y)=>arr.filter(q=>l+x<q.right-1&&q.left<r+x-1&&t+y<q.bottom-1&&q.top<b+y-1),
        pls=[...document.querySelectorAll('#plates .plate, #plates .dbadge')].filter(e=>e!==pl&&!(pl&&pl.contains(e))&&e.getClientRects().length).map(R).filter(q=>q.width>2),
        hp=hitOf(pls,0,0);
      if(hp.length){const T=sybTB(),
          av=board.concat(pls,[...document.querySelectorAll('#felt .spot .hand:not(.folded):not(.muck) .card:not(.slot), .llseats i:not([hidden]), #dbtn, #felt .spot .mystack')].filter(e=>!h.contains(e)&&e.getClientRects().length).map(R).filter(q=>q.width>2)),
          cand=[[0,Math.max(...hp.map(q=>q.bottom))+1-t],[0,Math.min(...hp.map(q=>q.top))-1-b],[Math.max(...hp.map(q=>q.right))+1-l,0],[Math.min(...hp.map(q=>q.left))-1-r,0]]
            .filter(([x,y])=>Math.abs(x)+Math.abs(y)<=60&&l+x>=T.left+2&&r+x<=T.right-2&&t+y>=T.top+2&&b+y<=T.bottom-2&&!hitOf(av,x,y).length)
            .sort((u,v)=>Math.abs(u[0])+Math.abs(u[1])-Math.abs(v[0])-Math.abs(v[1]));
        if(cand.length){dx+=cand[0][0];need+=cand[0][1];h.style.translate=`${Math.round(dx/(k||1))}px ${Math.round(need/(k||1))}px`}}}}catch(e){}
    // 最後に、置いたあとの本当の位置で、画面（卓）の左右の端から出ていないかを確かめ、出ていれば内側へ寄せ直す（2回まで）。
    //   卓は傾いていて横と縦で縮み方が違うので、縦の比（k）で割った横のずらしでは足りなかった（v0.98.6 CI：PC の6人卓で、いちばん左の席の J♣ が画面の左の端から出た）
    try{const T=sybTB(),cur=(h.style.translate||'0px 0px').split(' ').map(v=>parseFloat(v)||0);let tx=cur[0],ty=cur[1]||0;
      for(let it=0;it<2;it++){const rs=cs.map(R).filter(r=>r.width>2);if(!rs.length)break;const l=Math.min(...rs.map(r=>r.left)),r=Math.max(...rs.map(r=>r.right)),fx=l<T.left+4?T.left+4-l:r>T.right-4?T.right-4-r:0;if(!fx)break;
        const hw=h.offsetWidth,kx=hw?R(h).width/(hw*(sc||1)):1;tx+=Math.round(fx/(kx||1))+(fx>0?1:-1);h.style.translate=`${tx}px ${ty}px`}}catch(e){}});
  // ほかの席のチップの山（.mystack）が見せた札にかかっていたら、山のほうを横へよける（v0.96.2 手元：第14章で右の席の山がカイの札に乗った。chipAvoid は札が動く前に測っている）
  try{const sh=[...document.querySelectorAll('#felt .spot .hand:not(.folded):not(.muck)')].map(h=>[h,[...h.querySelectorAll('.card:not(.back):not(.slot)')].map(R).filter(r=>r.width>2)]).filter(x=>x[1].length).map(([h,rs])=>[h,[{left:Math.min(...rs.map(r=>r.left)),right:Math.max(...rs.map(r=>r.right)),top:Math.min(...rs.map(r=>r.top)),bottom:Math.max(...rs.map(r=>r.bottom))}]]),T=sybTB();   // 札は1枚ずつでなく手札まとめて1つの四角で見る（1枚ずつだと2枚の間を行ったり来たりした）
    document.querySelectorAll('#felt .spot .mystack').forEach(m=>{const cs=[...m.querySelectorAll('.chip')].map(R).filter(r=>r.width>1);if(!cs.length)return;if(R(m).width>2)cs.push(R(m));   // 山の箱（数の札も入る）ごとよける（v0.96.3 手元：箱の端がカイの札にかかった）
      let a={l:Math.min(...cs.map(r=>r.left)),r:Math.max(...cs.map(r=>r.right)),t:Math.min(...cs.map(r=>r.top)),b:Math.max(...cs.map(r=>r.bottom))};
      for(const [h,rs] of sh){if(h.closest('.spot')===m.closest('.spot'))continue;for(const c of rs){if(!(a.l<c.right-1&&c.left<a.r-1&&a.t<c.bottom-1&&c.top<a.b-1))continue;
        const toR=c.right+3-a.l,toL=c.left-3-a.r,
          // ずらした先が場札・見せた札にかからず、卓の中にあるほうへ。どちらもだめなら動かさない（v0.96.4 手元：山を場札の上へ押し出した）
          ot=[...document.querySelectorAll('#felt .spot .mystack')].filter(e=>e!==m&&e.getClientRects().length).map(R).filter(r=>r.width>2),   // ほかの山にも重ねない（CodeRabbit PR #105）
          hit=(d,os)=>a.l+d<T.left+2||a.r+d>T.right-2||board.concat(...sh.map(x=>x[1]),os).some(q=>a.l+d<q.right-1&&q.left<a.r+d-1&&a.t<q.bottom-1&&q.top<a.b-1),
          d2=(a.l+a.r)/2>(c.left+c.right)/2?[toR,toL]:[toL,toR];
          // 山どうしが重ならない先を選ぶ。どこもなければ、札を隠すよりは山どうしが重なるほうを選ぶ
          let ds=d2.filter(d=>!hit(d,ot));if(!ds.length)ds=d2.filter(d=>!hit(d,[]));if(!ds.length)continue;const d=ds[0];
        const sp=m.closest('.spot'),kx=sp&&sp.offsetWidth?R(sp).width/sp.offsetWidth:1,[x0,y0]=(m.style.translate||'0px 0px').split(' ').map(v=>parseFloat(v)||0);
        m.style.translate=`${(x0+d/(kx||1)).toFixed(1)}px ${y0}px`;
        // 卓は3Dで倒してあるので、席の幅から出した倍率（kx）は奥行きで変わり、ずらした量が足りないことがある（v0.97.7 CI：6人卓の横で 9px 足りず、隣の見せた札の角に乗った）。
        // ずらしたあとの場所を測って、狙った場所との差を2回まで足し直す
        const goal=a.l+d,bx=()=>{const q=[...m.querySelectorAll('.chip')].map(R).filter(r=>r.width>1);if(R(m).width>2)q.push(R(m));return q.length?Math.min(...q.map(r=>r.left)):null};
        for(let it=0;it<2;it++){const nl=bx();if(nl==null)break;const res=goal-nl;if(Math.abs(res)<=1)break;const [x1]=(m.style.translate||'0px 0px').split(' ').map(v=>parseFloat(v)||0);m.style.translate=`${(x1+res/(kx||1)).toFixed(1)}px ${y0}px`}
        a={l:a.l+d,r:a.r+d,t:a.t,b:a.b}}}})}catch(e){}
  // 札を動かしたら、勝ち負けの札（.vfres）も置き直す（v96.1 CI：6人卓の縦で、動いた見せた札に .vfres がかかった）
  if(moved){const v=document.querySelector('#table .vfres');if(v&&v._place)try{v._place()}catch(e){}
    // 席番号も、動いた札の横に置き直す（v96.4 レビュー：WebKit で席番号「3」「4」が場札に乗った）
    try{if(typeof llSeatsPlace==='function')llSeatsPlace()}catch(e){}
    // 席番号が動いたら、直近の5手（#vfLog）も置き直す（v0.97.0 手元：フリー6人の縦で席番号に重なった）
    try{const v=$('vfLog');if(v&&!v.hidden&&typeof blPlace==='function')blPlace()}catch(e){}}}
LT.on('layout',()=>{try{showYieldBoard()}catch(e){}
  // 見せた札は開く動きのあとで場所が決まる。layout が来ないこともあるので、ハンドの終わりに2回だけ測り直す（v96 レビュー：PC で名札に札の角が残った）
  try{if(S&&S.handOver&&S._sybT!==S.handNo){S._sybT=S.handNo;[700,1600].forEach(t=>setTimeout(()=>{try{if(S&&S.handOver)showYieldBoard()}catch(e){}},t))}}catch(e){}});
// chipAvoid は見せた札の位置（translate）を戻してからチップの山を置く。ハンドの終わりは、そのあとで見せた札を置き直し、山もよけ直す（v0.96.2 手元：横で右の席の山がカイの札に乗った）
if(typeof chipAvoid==='function'){const _ca=chipAvoid;chipAvoid=function(){const r=_ca.apply(this,arguments);try{if(S&&S.handOver)showYieldBoard()}catch(e){}return r}}
// v96.2 レビュー：ハンドの終わりに名札が伸びる（名前を出した金の枠 .nm-on）と、置き直したあとで札が名札の下に入った。名札の大きさが変わったら置き直す
// ResizeObserver は描く前に呼ばれるので、待たずにその場で置き直す（v0.97.0 手元：60ms 待つ間に撮られ、名札が札の角にかかって写った。名札の位置しか変えないので、ここから大きさは変わらず、くり返さない）
if(typeof ResizeObserver==='function'){let _sybQ=0;const _sybRO=new ResizeObserver(()=>{if(!_sybQ)_sybQ=requestAnimationFrame(()=>{_sybQ=0;try{if(S&&S.handOver)showYieldBoard()}catch(e){}})});   // v0.97.12：中で書くと「ResizeObserver loop」のエラーになるので、次のコマの頭で（描く前なので見た目は同じ）
  const _sybObs=()=>{document.querySelectorAll('#plates .plate').forEach(p=>{if(!p._sybRO){p._sybRO=1;_sybRO.observe(p)}})};
  LT.on('layout',()=>{try{_sybObs()}catch(e){}})}
// ハンドの終わりのあいだ 0.5秒ごとに、チップの山がほかの席の見せた札にかかっていないかを見て、かかっていたら置き直す（1ハンドに3回まで）
// （v0.97.5 CI：6人卓の横で、700ms・1600ms の測り直しのあとに山が見せた札の角にかかったまま残った。時間で決めた回数だけでは、あとの動きに追いつかない）
setInterval(()=>{try{if(!S||!S.handOver||$('game').hidden)return;if(S._sybW!==S.handNo){S._sybW=S.handNo;S._sybN=0}if(S._sybN>=3)return;
  const R=e=>e.getBoundingClientRect(),sh=[...document.querySelectorAll('#felt .spot .hand:not(.folded):not(.muck) .card:not(.back):not(.slot)')].map(c=>[c.closest('.spot'),R(c)]).filter(x=>x[1].width>2);if(!sh.length)return;
  const bad=[...document.querySelectorAll('#felt .spot .mystack')].some(m=>{const a=R(m),sp=m.closest('.spot');return a.width>2&&sh.some(([s,c])=>s!==sp&&a.left<c.right-1&&c.left<a.right-1&&a.top<c.bottom-1&&c.top<a.bottom-1)});
  // 見せた札が画面の左右から出ていても置き直す（v0.98.6 CI：PC の6人卓で、いちばん左の席の勝った札が、置いたあとの動きで画面の左の端から出た。手元では起きず CI だけで起きる）
  const off=!bad&&sh.some(([s,c])=>c.left<1||c.right>innerWidth-1);
  if(bad||off){S._sybN++;showYieldBoard()}}catch(e){}},500);
