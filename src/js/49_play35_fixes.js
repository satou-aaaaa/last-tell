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
const DEAL_HELP={def:.3,5:.6};
function dealHelp(){
  if(!S||!S.players||!CFG||!CFG.ch||CFG.flashback||CFG.ura||CFG.run)return;
  const me=S.players[0];if(!me||me.out||!me.hand||me.hand.length!==2||preTier(me.hand)>0)return;
  const p=!CFG.ch.p2&&DEAL_HELP[CFG.ch.no]!=null?DEAL_HELP[CFG.ch.no]:DEAL_HELP.def;
  if(LT.rand()>=p||S.deck.length<12)return;
  S.deck.unshift(...me.hand);me.hand=[S.deck.pop(),S.deck.pop()]}
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
    if(hit&&typeof llToolsPlace==='function')llToolsPlace()}catch(e){}},t*SPEED()));
  if(!old&&!reducedMotion())news.forEach((el,i)=>el.animate([{transform:'translateY(-8px)',opacity:0},{transform:'none',opacity:1}],{duration:240*SPEED(),delay:i*20*SPEED(),easing:'ease-out',fill:'backwards'}))}catch(e){}};

// ===== #36：降りた人・見ている人は、こちら（カメラ）ではなく、いま打っている人か場札のほうを見る =====
LT.on('render',()=>{try{if(!S||!S.players)return;const R=e=>{const r=e&&e.getBoundingClientRect();return r&&r.width?r.left+r.width/2:null};
  const act=S.toAct>0&&!S.handOver?$('bust'+S.toAct):null,bc=$('boardCards'),tx=(act&&!S.players[S.toAct].folded&&R(act))||R(bc);
  S.players.forEach((p,i)=>{if(!i)return;const b=$('bust'+i);if(!b)return;const away=!!(p.folded||p.out||p.sitOut);
    b.classList.toggle('c35away',away);if(!away||tx==null)return;const x=R(b);if(x==null)return;
    const gz=Math.max(-1,Math.min(1,(tx-x)/140))*1.5;b.style.setProperty('--gz',gz.toFixed(2)+'px')})}catch(e){}});

// ===== v93 レビュー 1：スマホ縦はポットの塔と額・自分の伏せ札の間が狭い =====
// 塔の下が自分の伏せ札にかかるときは、場札の下端より下の範囲で塔を上げる。額が塔に重なるときは、額を塔の左へ（入らなければ右へ）ずらす。
// 横・PC は前のまま（額は塔の下に離れている）。位置合わせ（36_layout_pass）の後に毎回直す。値が変わらなければ書かない
function c35PotTight(){const p=$('potChips'),s=$('potSign');if(!p)return;
  const tight=S&&S.players&&S.players.length>4&&innerWidth<520&&innerHeight>innerWidth;
  const set=(e,k,v)=>{if(e&&e.style[k]!==v)e.style[k]=v};
  if(!tight){set(p,'top','');set(s,'marginLeft','');return}
  // 測るのは、ここで上げた分（top）と potClear が下げた分（translate）を除いた元の場所。両方を足して測ると、上げる・下げるが毎回ふくらんでいく
  const R=e=>e.getBoundingClientRect(),k=R(p).height/(p.offsetHeight||1)||1,cur=(parseFloat(p.style.top)||0)+(parseFloat((p.style.translate||'').split(' ')[1])||0);
  const cols=[...p.querySelectorAll('.col')].map(R).filter(r=>r.width>1).map(r=>({left:r.left,right:r.right,top:r.top-cur*k,bottom:r.bottom-cur*k}));
  let up=0;if(cols.length){const card=[...document.querySelectorAll('#mine .card')].map(R).filter(r=>r.width>2),ct=card.length?Math.min(...card.map(r=>r.top)):1e9;
    const B=Math.max(...cols.map(r=>r.bottom)),T=Math.min(...cols.map(r=>r.top)),over=B-(ct-2);
    if(over>0){const bc=typeof boardRects==='function'?boardRects():[],bb=bc.length?Math.max(...bc.map(r=>r.bottom)):-1e9;up=Math.max(0,Math.min(over,T-(bb+3)))}}
  const nt=up?(-up/k).toFixed(1)+'px':'';set(p,'top',nt);
  if(!s||s.hidden||!cols.length)return set(s,'marginLeft','');
  const ml=parseFloat(s.style.marginLeft)||0,sr0=R(s),sr={left:sr0.left-ml,right:sr0.right-ml,top:sr0.top,bottom:sr0.bottom},g=R($('game')||document.body);
  const cs=up?cols.map(r=>({left:r.left,right:r.right,top:r.top-up,bottom:r.bottom-up})):[...p.querySelectorAll('.col')].map(R).filter(r=>r.width>1),hit=cs.some(r=>r.left<sr.right&&sr.left<r.right&&r.top<sr.bottom&&sr.top<r.bottom);
  if(!hit)return set(s,'marginLeft','');
  const L=Math.min(...cs.map(r=>r.left)),Rr=Math.max(...cs.map(r=>r.right));
  let dx=L-4-sr.right;if(sr.left+dx<g.left+4){const d2=Rr+4-sr.left;dx=sr.right+d2<=g.right-4?d2:g.left+4-sr.left}
  set(s,'marginLeft',Math.round(dx)+'px');
  // ずらした額がラック（道具）にかかったら、ラックを置き直す（ラックは額を避けて置く。v0.93.1 CI：WebKit 縦で額がラックに重なった）
  const k2=document.querySelector('.felt .boardspot > .lltools:not(.off)');if(!k2)return;const a=R(s);
  if([...k2.querySelectorAll('.dtray,.ddeck')].some(e=>{const b=R(e);return b.width>2&&a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom})&&typeof llToolsPlace==='function')llToolsPlace()}
LT.on('layout',()=>{try{c35PotTight()}catch(e){}});
