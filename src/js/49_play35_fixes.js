/* ---------- 第3〜5章のプレイ録画から（satou 2026-10-18 録画 2026-10-18 00-24-53.mp4） ---------- */
// 小さな見え方の直しだけ。CPU の判断・配り札・勝ち負けの決まり方は変えない
// #3 隣のテーブルの声：自分のテーブルをぼかして暗くし、カメラを横に振っていたので「バグった」に見えた
//    → ぼかし・暗さ・カメラの横振りをやめ、灯りと文字だけにする。見出しも日本語に
{const o=nextvShow;nextvShow=function(){
  const c=$('cam'),tr=c?c.style.transform:'',td=c?c.style.transitionDuration:'';
  const r=o.apply(this,arguments);
  try{const t=$('table');if(t&&(t.classList.contains('nvfull')||t.classList.contains('nvsoft'))){t.classList.remove('nvfull','nvsoft');t.classList.add('nvlamp');
      if(c){c.style.transitionDuration=td;c.style.transform=tr}}
    const sp=$('nextv')&&$('nextv').querySelector('span');if(sp&&sp.textContent==='NEXT TABLE')sp.textContent=I18N.lang==='en'?'Next table':'隣のテーブル'}catch(e){}
  return r}}
// #8 相手のオールインに気づけない：オールインの人の札を赤く
// #18 ストラドルのハンドは上の帯のブラインドに額を足す（1,000/2,000/4,000）
LT.on('render',()=>{try{if(!S||!S.players)return;
  S.players.forEach((p,i)=>{if(!i)return;const pl=$('plate'+i);if(pl)pl.classList.toggle('c35allin',!!(p.allIn&&!p.folded&&!p.out&&!S.handOver))});
  const m=$('tbMeta');if(m&&S.strdl&&!CFG.levels){const t=`${fmt(SB())}/${fmt(BB())}/${fmt(S.strdl)}`;if(m.textContent!==t)m.textContent=t;
    const al=I18N.lang==='en'?`Blinds ${fmt(SB())}/${fmt(BB())}, straddle ${fmt(S.strdl)}`:`ブラインド ${fmt(SB())}/${fmt(BB())}　ストラドル ${fmt(S.strdl)}`;if(m.title!==al){m.title=al;m.setAttribute('aria-label',al)}}
}catch(e){}});
// #20 クイズが急に出る：いま卓で何があったかを、問題の上に一行で
LT.on('askQuiz',id=>{try{const box=$('quiz'),q=box&&box.querySelector('.qq');if(!q||box.querySelector('.c35ctx')||!S||!S.players)return;
  const p=S.players[S.toAct],en=I18N.lang==='en';if(!p||p.human)return;
  const n=typeof who==='function'?who(p.name):p.name;
  const t=id==='tap'?(en?`Just now, ${n} tapped the table, then said “bet.”`:`いま、${n}がテーブルを叩いてから「ベット」と言いました`)
    :id==='onechip'?(en?`Just now, ${n} silently put out one big chip.`:`いま、${n}が大きいチップを1枚だけ、黙って出しました`):'';
  if(!t)return;const d=document.createElement('p');d.className='c35ctx';d.textContent=t;q.before(d)}catch(e){}});
// 易しくする（satou 2026-10-17 17:13Z のカード：難易度「全体を易しく」、第5章「弱い手を減らす」）
// ストーリーの章で、自分に弱い2枚（preTier 0）が来たら、ある割合でその2枚を山の底に戻して引き直す（1回だけ）。
// 第5章は 6割、ほかの章は 3割。回想・裏の卓・はしご・フリー対戦は今のまま。台本・決まった札は後の setupScript が上書きする
const DEAL_HELP={def:.3,5:.6,6:.6};   // 第6章も 6割（satou 2026-10-18 第6章の録画 #15〜17）
// 呼ぶのは配りを変える入口（js/54_deal_mod.js の LT.dealRun('hand')）だけ。札を変えたら true。第6章・第14章の強い手（p6Premium）は入口が先に呼ぶ
function dealHelp(){
  if(!S||!S.players||!CFG||!CFG.ch||CFG.flashback||CFG.ura||CFG.run)return false;
  const me=S.players[0];if(!me||me.out||!me.hand||me.hand.length!==2||preTier(me.hand)>0)return false;
  const p=!CFG.ch.p2&&DEAL_HELP[CFG.ch.no]!=null?DEAL_HELP[CFG.ch.no]:CFG.ch.p2===4?DEAL_HELP[6]:DEAL_HELP.def;   // 第14章も第6章と同じ（2026-10-19、第6章の形にそろえた）
  if(LT.rand()>=p||S.deck.length<12)return false;
  S.deck.unshift(...me.hand);me.hand=[S.deck.pop(),S.deck.pop()];return true}
// 設定の初めの値（satou 2026-10-17 17:13Z のカード）：「先に選ぶ」（パスフォールド）は最初からオン、「カードをそろえる」は最初はオフ。
// 前の版でできた保存（先に選ぶ：オフ、そろえる：オン）は一度だけ新しい値に直す。そのあと設定で変えたものは、そのまま
SAVE_KEYS.push('shisho-p35');
{const m=saveGet('shisho-p35',{})||{};if(!m.set1){SETTINGS.pre=true;SETTINGS.tidy=false;saveSettings();saveSet('shisho-p35',Object.assign(m,{set1:1}),1);
  try{vfTidy()}catch(e){}
  try{const b=$('btnPreSet');if(b)b.textContent='先に選ぶ：オン';const t=$('btnTidy');if(t)t.textContent='カードをそろえる：オフ';if(typeof setSync==='function')setSync()}catch(e){}}}
// #19 第5章の AA のハンドで隠したレイズを戻す（スレッド「第5章で進行が止まる」の直しと同じ働き。向こうが入っても二重に戻すだけで害はない）
LT.on('render',()=>{try{if(!S)return;if(S.vf&&S.vf.ask){S.p35hid=true;return}
  if(S.p35hid){S.p35hid=false;['btnRaise','btnFold'].forEach(id=>{const b=$(id);if(b)b.hidden=false});renderControls()}}catch(e){}});

// ===== #37・#38（第3〜5章の録画 2回目）：ポットはディーラーが色ごとにそろえて積む =====
// 前は色の混ざった塔をばらばらに散らしていた（「チップ適当」「モリモリ」）。枚数の決め方（額が大きいほど少しずつ増える）は前と同じ。
// 色は額の割り方（stackBreak）の比で配り、1色ずつ低い塔（最大8枚、縦の6人卓は6枚）にして横に並べる。多いときは奥と手前の2列
potGrow=function(pot){try{
  if(!S.potPile||S.potPile.hand!==S.handNo)potReset();
  const P=S.potPile,pile=$('potChips');if(!pile)return;
  const bb=BB()||1000,big=pot/bb,want=pot?Math.min(48,Math.round(5.5*Math.log2(big+1))):0;
  if(P.chips>=want)return;
  const g=stackBreak(pot).slice().sort((a,b)=>b.v-a.v),tot=g.reduce((a,d)=>a+d.n,0)||1;
  let cnt=g.map(d=>Math.max(1,Math.round(d.n*want/tot)));
  while(cnt.reduce((a,b)=>a+b,0)>want&&cnt.some(n=>n>1)){const k=cnt.indexOf(Math.max(...cnt));cnt[k]--}
  const tight=S.players.length>4&&innerWidth<520&&innerHeight>innerWidth,per=tight?6:8,W=190,H=78,cols=[];
  g.forEach((d,i)=>{for(let k=0;k<cnt[i];k+=per)cols.push({c:d.c,h:Math.min(per,cnt[i]-k)})});
  const maxRow=tight?6:7,rows=cols.length>maxRow?2:1,back=rows===2?cols.slice(0,Math.ceil(cols.length/2)):[],front=rows===2?cols.slice(back.length):cols;
  const old=pile.children.length;pile.innerHTML='';const news=[];
  [[back,H*.5],[front,H*.5+(rows===2?16:8)]].forEach(([row,by])=>{row.forEach((t,j)=>{
    const px=W/2+(j-(row.length-1)/2)*25,el=document.createElement('span');el.className='col';el.style.height=(11+4*(t.h-1)+4)+'px';
    el.innerHTML=Array.from({length:t.h},(_,k)=>`<span class="chip ${t.c}" style="bottom:${k*4+4}px"></span>`).join('');
    el.style.left=(px-13)+'px';el.style.top=(by-(11+4*t.h))+'px';el.style.zIndex=Math.round(by);pile.appendChild(el);news.push(el)})});
  P.chips=cnt.reduce((a,b)=>a+b,0);potSignSoon();
  // 山を積み直すと金額札が上下に動くので、ラック（道具）が金額札にかかったら置き直す（CI：WebKit 縦で金額札とラックが重なった）
  [150,700].forEach(t=>setTimeout(()=>{try{const k=document.querySelector('.felt .boardspot > .lltools:not(.off)'),g=$('potSign');if(!k||!g||g.hidden)return;
    const a=g.getBoundingClientRect(),hit=[...k.querySelectorAll('.dtray,.ddeck')].some(e=>{const b=e.getBoundingClientRect();return b.width>2&&a.width>2&&a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom});
    if(hit&&typeof llToolsPlace==='function')llToolsPlace()}catch(e){}try{c35PotTight()}catch(e){}},t*SPEED()));
  if(!old&&!reducedMotion())news.forEach((el,i)=>LT.anim(el,[{transform:'translateY(-8px)',opacity:0},{transform:'none',opacity:1}],{duration:240*SPEED(),delay:i*20*SPEED(),easing:'ease-out',fill:'backwards'}))}catch(e){}};

// ===== #36：降りた人・見ている人は、こちら（カメラ）ではなく、いま打っている人か場札のほうを見る =====
LT.on('render',()=>{try{if(!S||!S.players)return;const R=e=>{const r=e&&e.getBoundingClientRect();return r&&r.width?r.left+r.width/2:null};
  const act=S.toAct>0&&!S.handOver?$('bust'+S.toAct):null,bc=$('boardCards'),tx=(act&&!S.players[S.toAct].folded&&R(act))||R(bc);
  S.players.forEach((p,i)=>{if(!i)return;const b=$('bust'+i);if(!b)return;const away=!!(p.folded||p.out||p.sitOut);
    b.classList.toggle('c35away',away);if(!away||tx==null)return;const x=R(b);if(x==null)return;
    const gz=Math.max(-1,Math.min(1,(tx-x)/140))*1.5;b.style.setProperty('--gz',gz.toFixed(2)+'px')})}catch(e){}});

// ===== v93 レビュー 1：スマホ縦はポットの塔と額・自分の伏せ札の間が狭い =====
// 塔の下が自分の伏せ札にかかるときは、場札の下端より下の範囲で塔を上げる。額が塔に重なるときは、額を塔の左へ（入らなければ右へ）ずらす。
// 横・PC は前のまま（額は塔の下に離れている）。位置合わせ（36_layout_pass）の後に毎回直す。値が変わらなければ書かない
// v95.1：額の数字（.pv）を、塔・自分の札・場札のどれにもかからず #game の中に収まる一番近い所へ置く（縦・横・PC 共通）。cols はよける塔の柱の場所
function c35SignFit(s,cols,g){const R=e=>e.getBoundingClientRect(),set=(e,k,v)=>{if(e&&e.style[k]!==v)e.style[k]=v};
  const kl=s.style.marginLeft,kt=s.style.marginTop;s.style.marginLeft='';s.style.marginTop='';const m0=parseFloat(getComputedStyle(s).marginTop)||0,ks=R(s).height/(s.offsetHeight||1)||1;
  const pv=[...s.querySelectorAll('.pv')].map(R).filter(r=>r.width>2),tg=pv.length?pv:[R(s)];s.style.marginLeft=kl;s.style.marginTop=kt;
  const avoid=cols.concat([...document.querySelectorAll('#mine .card')].map(R).filter(r=>r.width>2),typeof boardRects==='function'?boardRects():[]);
  const fit=(x,y)=>tg.every(a=>a.left+x>=g.left+4&&a.right+x<=g.right-4&&a.top+y>=g.top+2&&a.bottom+y<=g.bottom-2&&!avoid.some(r=>Math.min(r.right,a.right+x)-Math.max(r.left,a.left+x)>-2&&Math.min(r.bottom,a.bottom+y)-Math.max(r.top,a.top+y)>-2));
  let best=null;if(!fit(0,0)){for(let y=-80;y<=60;y+=2)for(let x=-200;x<=200;x+=4){const c=Math.abs(x)+Math.abs(y);if((!best||c<best[2])&&fit(x,y))best=[x,y,c]}}
  const [dx,dy]=best||[0,0];set(s,'marginLeft',dx?Math.round(dx/ks)+'px':'');set(s,'marginTop',dy?Math.round(m0+dy/ks)+'px':'')}
function c35PotTight(){const p=$('potChips'),s=$('potSign');if(!p)return;
  const tight=S&&S.players&&innerWidth<520&&innerHeight>innerWidth;   // v94：6人卓に限らない（第4章の縦で塔が伏せ札にかかった）
  const set=(e,k,v)=>{if(e&&e.style[k]!==v)e.style[k]=v};
  if(!tight){set(p,'top','');set(p,'left','');set(p,'scale','');set(p,'visibility','');set(p,'transformOrigin','');set(s,'marginLeft','');
    // v94.5 CI：横で塔の下端が額の上に 3px かかった（Chromium 第1章_自分の番）。額が塔の下にあって重なるときは、額を重なった分だけ下げる
    if(!s||s.hidden){set(s,'marginTop','');return}
    // v95 CI・レビュー：横・PC でも額が塔や自分の札にかかった。額の数字で測り、かからない一番近い所へ
    c35SignFit(s,[...p.querySelectorAll('.col')].map(e=>e.getBoundingClientRect()).filter(r=>r.width>1),($('game')||document.body).getBoundingClientRect());return}
  // v95.2 CI：縦の6人卓のリバーで、potClear が場札の下へ下げた塔が伏せ札の後ろに入った（上げる・寄せる・縮めるを別々に決めていたので、組み合わせなら入る所を見落とした）。
  // 縦は塔の置き場所をここでまとめて決める。動かす前の場所で、伏せ札・場札・自分の顔と持ち点にかからなければそのまま。
  // かかるときは、縮める（1〜0.55倍）・上下・左右を合わせて一番近い所へ。どこにも無ければ塔は出さない（額は出したまま）。縦では potClear の下げ（translate）は使わない
  const R=e=>e.getBoundingClientRect(),g=R($('game')||document.body),ps=p.style;
  for(const k of['scale','top','left','translate','visibility','transformOrigin'])if(ps[k])ps[k]='';
  const lc=[...p.querySelectorAll('.col')].map(R).filter(r=>r.width>1);
  if(lc.length){const pr=R(p),k=pr.height/(p.offsetHeight||1)||1,pc=(pr.left+pr.right)/2,Ty=Math.min(...lc.map(r=>r.top)),L0=Math.min(...lc.map(r=>r.left));
    const av=[...document.querySelectorAll('#mine .card')].map(R).filter(r=>r.width>2).concat(typeof boardRects==='function'?boardRects():[],[...document.querySelectorAll('#mine .me-l,#mine .me-r')].map(R).filter(r=>r.width>2));
    const fits=(f,x,y)=>lc.every(c=>{const l=pc+(c.left-pc)*f+x,r=pc+(c.right-pc)*f+x,t=Ty+(c.top-Ty)*f+y,b=Ty+(c.bottom-Ty)*f+y;
      return l>=g.left+4&&r<=g.right-4&&t>=g.top+2&&b<=g.bottom-2&&av.every(a=>!(l<a.right+2&&a.left-2<r&&t<a.bottom+3&&a.top-2<b))});
    if(!fits(1,0,0)){let bs=null;
      for(let i=0;i<=9;i++){if(bs&&i*10>=bs[3])break;const f=1-i*.05;for(let y=-120;y<=120;y+=4)for(let x=-360;x<=360;x+=4){const c=Math.abs(x)+Math.abs(y)+i*10;if(bs&&c>=bs[3])continue;if(fits(f,x,y))bs=[f,x,y,c]}}
      if(!bs)ps.visibility='hidden';
      else{const [f,x,y]=bs;if(f<.999){ps.transformOrigin=`50% ${((Ty-pr.top)/k).toFixed(1)}px`;ps.scale=f.toFixed(3)}
        // 縮める軸を変えると卓の拡大（transform）の軸も動き、卓は遠近がついているので、動かした量と画面での量が合わない。置いてから測って、ずれを数回で詰める
        const at=()=>{const q=[...p.querySelectorAll('.col')].map(R).filter(r=>r.width>1);return[Math.min(...q.map(r=>r.left)),Math.min(...q.map(r=>r.top)),q]};
        let tx=pc+(L0-pc)*f+x,ty=Ty+y,sl=0,st=0,[l,t,q]=at(),kx=k,ky=k;
        for(let n=0;n<6;n++){
          // 置けたか測る。まだ何かにかかっていれば、動かした向きにかかった分だけ先へ
          if(Math.abs(tx-l)<=.5&&Math.abs(ty-t)<=.5){let ox=0,oy=0;for(const c of q)for(const a of av){const w=Math.min(c.right,a.right+2)-Math.max(c.left,a.left-2),h=Math.min(c.bottom,a.bottom+3)-Math.max(c.top,a.top-2);if(w>0&&h>0){if(y&&h<=w)oy=Math.max(oy,h);else if(x)ox=Math.max(ox,w);else oy=Math.max(oy,h)}}
            if(!ox&&!oy)break;tx+=ox*(x<0?-1:1);ty+=oy*(y>0?1:-1)}
          const nl=sl+(tx-l)/kx,nt=st+(ty-t)/ky;ps.left=nl.toFixed(1)+'px';ps.top=nt.toFixed(1)+'px';const [l2,t2,q2]=at();
          if(Math.abs(nl-sl)>2&&Math.abs(l2-l)>1)kx=(l2-l)/(nl-sl);if(Math.abs(nt-st)>2&&Math.abs(t2-t)>1)ky=(t2-t)/(nt-st);sl=nl;st=nt;l=l2;t=t2;q=q2}
        if(Math.abs(sl)<.5)ps.left='';if(Math.abs(st)<.5)ps.top=''}}}
  if(!s||s.hidden){set(s,'marginLeft','');set(s,'marginTop','');return}
  // v95 レビュー：第6章の縦で、額を塔からよけた先が自分の手札の上だった。塔（動かした後の場所）・自分の札・場札を全部よける
  c35SignFit(s,ps.visibility?[]:[...p.querySelectorAll('.col')].map(R).filter(r=>r.width>1),g);
  // ずらした額がラック（道具）にかかったら、ラックを置き直す（ラックは額を避けて置く。v0.93.1 CI：WebKit 縦で額がラックに重なった）
  const k2=document.querySelector('.felt .boardspot > .lltools:not(.off)');if(!k2)return;const a=R(s);
  if([...k2.querySelectorAll('.dtray,.ddeck')].some(e=>{const b=R(e);return b.width>2&&a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom})&&typeof llToolsPlace==='function')llToolsPlace()}
// v95.2 レビュー：ラックとカップは置いたときの塔・場札をよけるが、そのあと塔が動いた（c35PotTight）・場札がずれたときに置き直していなかった
// （縦の6人卓のリバーで、ラックが塔に、カップがリバーの札に乗った）。塔を置いた後に毎回確かめ、かかっていれば置き直す。置けなければ今どおり出さない
function c35ToolsChk(){const R=e=>e.getBoundingClientRect(),vis=e=>e&&e.offsetParent&&getComputedStyle(e).visibility!=='hidden'&&R(e).width>2,
    hit=(a,bs)=>bs.some(b=>a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom);
  const tw=[...document.querySelectorAll('#potChips .chip')].filter(vis).map(R),bc=[...document.querySelectorAll('#boardCards .card')].filter(vis).map(R);
  const t=document.querySelector('.felt .boardspot > .lltools:not(.off)');
  if(t&&[...t.querySelectorAll('.dtray,.ddeck')].filter(vis).some(e=>hit(R(e),tw.concat(bc)))&&typeof llToolsPlace==='function')llToolsPlace();
  const c=document.querySelector('#table > .cup:not(.off)');
  if(vis(c)&&hit(R(c),bc.concat([...document.querySelectorAll('#potChips .chip, #mine .mystack')].filter(vis).map(R)))&&typeof llCupPlace==='function')llCupPlace()}   // 自分のチップの山が増えて飲み物にかかったときも置き直す（v0.96.4 CI：PC で飲み物 × 自分の山）
{const f=c35PotTight;c35PotTight=function(){f();try{c35ToolsChk()}catch(e){}}}
// v0.96 CI（PC）：ポットの塔が描き直しの合図なしに伸びて、ラックに重なったまま残った。塔が変わったら少しおいて確かめ直す
{let mo=null,tm=0;LT.on('layout',()=>{const pc=$('potChips');if(!pc||typeof MutationObserver==='undefined'||(mo&&mo.el===pc))return;if(mo)mo.disconnect();
  mo=new MutationObserver(()=>{clearTimeout(tm);tm=setTimeout(()=>{try{c35ToolsChk()}catch(e){}},120)});mo.el=pc;mo.observe(pc,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']})})}
// v95 CI：縦で塔が自分の札に 4px かかったまま残った（札が配られて動き終わる前に測った）。位置合わせの 0.45 秒後にもう一度測る
// 山を積み直すと額が後から動く（potSignSoon）ので、上の 150/700ms でも直す（CI：第6章 横で額が塔に 13×4px）
// 額の数字は数え上げ（potCount）で後から幅が広がるので、額の大きさが変わったときにも直す（v95 CI：第6章 横で 13×4px）
// ResizeObserver の中では書かず次のコマで（中で額の幅を変えると、帯・名札を見張る ResizeObserver へ続き「ResizeObserver loop」のエラーになる。v0.97.12 の自動対戦）
{let c35RO=null;LT.on('layout',()=>{try{const s=$('potSign'),v=s&&s.querySelector('.pv');if(s&&typeof ResizeObserver!=='undefined'&&(!c35RO||c35RO.el!==s||c35RO.v!==v)){if(c35RO)c35RO.disconnect();c35RO=new ResizeObserver(()=>{if(!c35RO.q)c35RO.q=requestAnimationFrame(()=>{c35RO.q=0;try{c35PotTight()}catch(e){}})});c35RO.el=s;c35RO.v=v;c35RO.observe(s);if(v)c35RO.observe(v)}}catch(e){}})}
let c35PT=0;LT.on('layout',()=>{try{c35PotTight()}catch(e){}clearTimeout(c35PT);c35PT=setTimeout(()=>{try{c35PotTight()}catch(e){}},450)});
