/* ---------- 描画 ---------- */
function cardHTML(c,hidden,extra){
  if(!c)return'<div class="card slot"></div>';
  if(hidden)return`<div class="card back${extra||''}" aria-label="伏せたカード"></div>`;
  const red=c.s===1||c.s===2;
  const court=c.r>=11&&c.r<=13;
  const mid=court?`<span class="court"><b>${rankStr(c.r)}</b><i>${SUITS[c.s]}</i></span>`:`<span class="s${c.r===14?' ace':''}">${SUITS[c.s]}</span>`;
  return`<div class="card${red?' red':''}${extra||''}" aria-label="${cardStr(c)}"><span class="r">${rankStr(c.r)}<i>${SUITS[c.s]}</i></span>${mid}<span class="r r2">${rankStr(c.r)}<i>${SUITS[c.s]}</i></span></div>`;
}
/* 金額をチップの山に分ける */
const DENOMS=[[100000,'c6'],[50000,'c5'],[10000,'c4'],[5000,'c3'],[2500,'c2'],[1000,'c1']];
// 持ち点のチップ：色ごとの額×枚数が、持ち点とぴったり合う。数えれば正しい持ち点がわかる
const STACK_DENOMS=[[100000,'c6','紫'],[50000,'c5','金'],[10000,'c4','黒'],[5000,'c3','赤'],[2500,'c2','緑'],[1000,'c1','青'],[500,'c0','白'],[100,'c7','桃']];
// 所持チップの割り方（案1）：BBの半分のチップを20枚、その5倍を40枚まで。それより上の分だけ大きい額にまとめる
// cap は「小さい額で持つ分」の上限の割合（塔が6本を超えるときは半分にして割り直す）
const SB_DENOMS=[100,500,1000,2500,5000,10000,50000,100000];
function stackBreak(amount,bb,cap){if(!bb){try{bb=BB()}catch(e){bb=0}}bb=bb||2000;cap=cap||1;const D=SB_DENOMS;
  const base=D.filter(v=>v<=bb/2).pop()||100,mid=D.filter(v=>v<=base*5).pop(),hi=D.find(v=>v>mid)||mid;
  const n={};let a=Math.max(0,Math.round(amount)),low=a%base,rest=a-low;
  for(const v of D.filter(v=>v<base).reverse()){const k=Math.floor(low/v);if(k){n[v]=k;low-=k*v}}
  let lp=Math.min(rest,Math.round((20*base+40*mid)*cap/base)*base);lp=rest-Math.floor((rest-lp)/hi)*hi;let up=rest-lp;
  for(const v of D.filter(v=>v>=hi).reverse()){const k=Math.floor(up/v);if(k){n[v]=k;up-=k*v}}
  const m=Math.min(40,Math.floor((lp-Math.min(lp,20*base))/mid));n[mid]=(n[mid]||0)+m;n[base]=(n[base]||0)+(lp-m*mid+up)/base;
  return STACK_DENOMS.map(([v,c,nm])=>({v,c,nm,n:n[v]||0})).filter(d=>d.n>0)}
// 拡大表示：割り方は新しい stackBreak、並べ方は横一列のまま（数えやすさ優先・ずれなし）
function stackCols(amount,step,per){
  const cols=[];for(const d of stackBreak(amount))for(let i=0;i<d.n;i+=per)cols.push({c:d.c,n:Math.min(per,d.n-i)});
  // 拡大表示では5枚ごとに少し間をあけて、数えやすくする
  const g=step>=6?4:0,y=k=>k*step+Math.floor(k/5)*g+4;
  return cols.map(col=>`<span class="col" style="height:${y(col.n-1)+15}px">${Array.from({length:col.n},(_,k)=>`<span class="chip ${col.c}" style="bottom:${y(k)}px"></span>`).join('')}</span>`).join('')}
// 塔の並べ方（案2）：20枚ずつの塔。高い額は奥の列、小さい額は手前の列。1〜2枚の端数は寝かせて手前に置く
// ずれは「席番号＋持ち点」から作る乱数なので、描き直しても形が変わらない
function stackPlan(amount){let g=stackBreak(amount),cut=false;
  const towers=gs=>gs.reduce((a,d)=>{let n=d.n;if(n>=4&&n%20&&n%20<3)n-=n%20;return a+Math.ceil(n/20)},0);
  if(towers(g)>6){g=stackBreak(amount,0,.5);if(towers(g)>6)cut=true}
  const back=[],front=[],half=g.length>1?Math.ceil(g.length/2):0;
  g.forEach((d,i)=>{const arr=i<half?back:front;let n=d.n,loose=0;if(n>=4&&n%20&&n%20<3){loose=n%20;n-=loose}
    for(let k=0;k<n;k+=20)arr.push({c:d.c,h:Math.min(20,n-k)});if(loose)front.push({c:d.c,h:loose,loose:true})});
  if(cut){let left=6;[back,front].forEach(a=>{for(let k=0;k<a.length;k++){if(a[k].loose)continue;if(left>0)left--;else{a.splice(k,1);k--}}})}
  return{back,front,cut}}
function stackTowers(amount,step,seed){const P=stackPlan(amount);let s=Math.abs(Math.round(seed||0))%2147483646+1;
  const rnd=()=>{s=(s*16807)%2147483647;return(s-1)/2147483646};
  const col=t=>{if(t.loose)return`<span class="col loose">${Array.from({length:t.h},(_,k)=>`<span class="chip ${t.c} flat" style="bottom:${(k*1.5).toFixed(1)}px;left:${(rnd()*6-3).toFixed(1)}px;transform:rotate(${(rnd()*40-20).toFixed(0)}deg)"></span>`).join('')}</span>`;
    return`<span class="col" style="height:${(t.h-1)*step+15}px;translate:${(rnd()*2-1).toFixed(1)}px 0">${Array.from({length:t.h},(_,k)=>`<span class="chip ${t.c}" style="bottom:${k*step+4}px;left:${(rnd()*1.6-.8).toFixed(1)}px"></span>`).join('')}</span>`};
  return`${P.back.length?`<span class="trow back">${P.back.map(col).join('')}</span>`:''}<span class="trow front">${P.front.map(col).join('')}</span>`}
// 動作の重さの改善 案2(a)：同じ引数・同じ BB・同じ画面幅の区分なら同じ文字列なので、作った結果を覚えておく
const CHIPSTACK_MEMO=new Map();
// 動作の重さの改善 案3：innerWidth を読むと画面の形の計算が走るので、画面の幅の区分は大きさが変わった時だけ読む
let VW_NARROW=innerWidth<620;addEventListener('resize',()=>{VW_NARROW=innerWidth<620});
function chipStack(amount,label,big,small,seed){
  if(!amount)return'';
  let bb=0;try{bb=BB()}catch(e){bb=0}
  const k=amount+'|'+label+'|'+big+'|'+small+'|'+seed+'|'+(VW_NARROW)+'|'+bb+'|'+(typeof I18N!=='undefined'?I18N.lang:'');
  let v=CHIPSTACK_MEMO.get(k);
  // 改善提案 第5回 §0-2：1つ数KBあるので、覚えるのは最近使った200個まで（古いものから捨てる。3000個だと長く遊ぶとメモリが増え続けた）
  if(v===undefined){v=chipStackRaw(amount,label,big,small,seed);if(CHIPSTACK_MEMO.size>=200)CHIPSTACK_MEMO.delete(CHIPSTACK_MEMO.keys().next().value)}else CHIPSTACK_MEMO.delete(k);
  CHIPSTACK_MEMO.set(k,v);
  return v}
// 案2(b)：書く前に前回の文字列と比べ、同じなら書かない（書いた後に中身を動かす処理は、今のまま残っていてよいものだけ）
function setHTMLIfChanged(el,h,key){key=key===undefined?h:key;if(el._h===key&&el.firstChild)return false;el._h=key;el.innerHTML=h;return true}
// 顔の絵（avatar）は描くたびに SVG の id が乱数で変わるので、比べる時だけその id を消す（id に使われた文字だけを消すので、絵の違いは残る）
function htmlKeyNoIds(h){const ids=new Set();h.replace(/id="([xrc][0-9a-z]{6})/g,(m,t)=>{ids.add(t);return m});let k=h;ids.forEach(t=>{k=k.split(t).join('#')});return k}
function chipStackRaw(amount,label,big,small,seed){
  if(!amount)return'';
  if(small)return`<span class="stack exact tw" aria-label="${fmt(amount)}">${stackTowers(amount,VW_NARROW?3:4,seed)}</span>`;
  let rest=amount,chips=[];
  for(const [v,cls] of (small?DENOMS.filter(d=>d[0]<=10000):DENOMS)){while(rest>=v&&chips.length<(big?40:24)){chips.push(cls);rest-=v}}
  const cols=[];for(let i=0;i<chips.length;i+=8)cols.push(chips.slice(i,i+8));
  const step=VW_NARROW?3:4;
  const html=cols.slice(0,big?5:3).map(col=>`<span class="col" style="height:${11+step*(col.length-1)+4}px">${
    col.map((cls,k)=>`<span class="chip ${cls}" style="bottom:${k*step+4}px;left:${(((k*7+col.length*3)%5)-2)*.5}px"></span>`).join('')}</span>`).join('');
  return`<span class="stack" aria-label="${fmt(amount)}">${html}${label!==false?`<span class="amt-label">${fmt(amount)}</span>`:''}</span>`;
}
function renderGoal(){
  const g=CFG.goal,el=$('goal');
  if(!g||!S||!S.players||!S.players.length)return;   // はしごの卓を作る前の仮の状態
  let main,cnt=null,sub='';
  if(g.type==='free'){main='最後の一人になる';sub='相手全員のチップを取ったら優勝'}
  else if(g.type==='flash'){main='15年前の決勝卓';sub='この手の結末は、もう決まっている'}
  else{main=CFG.goalText||CFG.ch.goalText;
    if(g.type==='reach')sub=`今の持ち点 ${fmt(S.players[0].chips)}　／　または、相手全員のチップを取る`;
    else if(g.type==='final')sub=P2ON()?'または、師匠のチップを全部取る':'または、ジンのチップを全部取る';
    else if(g.type!=='bust'&&g.type!=='boss'){cnt=Math.min(g.type==='steal'?S.steals:g.type==='readcall'?(S.reads||0):S.bluffs,g.n);sub='または、相手全員のチップを取る'}}
  const pips=cnt===null?'':`<span class="pips" aria-label="${cnt}/${g.n}">${Array.from({length:g.n},(_,k)=>`<i class="${k<cnt?'on':''}"></i>`).join('')}<b>${cnt}/${g.n}</b></span>`;
  const key=main+cnt+sub;
  if(el.dataset.k===key)return;
  const bump=el.dataset.k&&cnt!==null&&el.dataset.cnt!==String(cnt);
  el.dataset.k=key;el.dataset.cnt=String(cnt);
  el.innerHTML=`<span class="gl">勝利条件</span><span class="gm">${esc(main)}</span>${pips}<span class="gs">${g.type==='flash'?esc(sub):(sub?esc(sub)+'　／　':'')+'自分のチップが0になったら負け'}</span>`;
  if(bump&&!reducedMotion()){el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump')}
}
function goalLabel(){
  const g=CFG.goal;
  if(g.type==='free')return'最後の一人になる';
  if(g.type==='flash')return'15年前の決勝卓';
  if(g.type==='bust'||g.type==='reach'||g.type==='final'||g.type==='boss')return'目標：'+(CFG.goalText||CFG.ch.goalText);
  const n=g.type==='steal'?S.steals:g.type==='readcall'?(S.reads||0):S.bluffs;
  return`目標：${CFG.ch.goalText}（${Math.min(n,g.n)}/${g.n}）`;
}
function render(){
  // はしごの卓を作る前の仮の状態（教えを選ぶ窓が開いている間）は、前の卓の「次へ」を隠して何も描かない
  if(!S||!S.players||!S.players.length){$('between').hidden=true;return}
  renderGoal();
  $('meta').textContent=`ブラインド ${fmt(SB())}/${fmt(BB())}　ハンド #${S.handNo}`+(CFG.levels&&Math.floor((S.handNo-1)/CFG.levelHands)<CFG.levels.length-1?`　次の上昇まで ${CFG.levelHands-((S.handNo-1)%CFG.levelHands)}ハンド`:'');
  S.players.forEach((p,i)=>{
    let tag;
    if(p.out)tag=p.sitOut?'<span class="tag watch">見ている</span>':'<span class="tag">脱落</span>';
    else if(S.result==='flash')tag='';else if(p.won)tag=`<span class="tag win">勝ち +${fmt(p.won)}</span>`;
    else if(S.toAct===i&&!p.human)tag='<span class="tag think">考え中…</span>';
    else if(p.lastAct){const [w,n]=p.lastAct.split(' ').map((x,k)=>k&&p.lastAct.startsWith('オールイン')&&N()>=4?'':x);tag=`<span class="tag act-${p.lastType}">${w}${n?` <b>${n}</b>`:''}</span>`}
    else tag='';
    const reveal=p.human||p.show;
    const anim=p.seen===reveal?' noanim':'';
    const seenNow=reveal;setTimeout(()=>{p.seen=seenNow},0);
    // 相手の手札は1枚ずつ開くことがある。開いた瞬間のカードだけめくる動きを付ける
    const shownN=reveal?2:(p.showN||0),prevArr=p.seenArr||[];
    const cardAnim=k=>{const now=k<shownN;return prevArr[k]===now?' noanim':now&&p.slow&&(k===1||mannerOf(p))?' slowflip':''};
    const nowArr=[0,1].map(k=>k<shownN);setTimeout(()=>{p.seenArr=nowArr},0);
    const turn=S.toAct===i;
    if(i===0){
      const hideMine=peekOn()&&!p.peeked&&!p.folded&&!S.handOver&&!p.out,seki=uraRule('セキ')&&S.board.length<3&&!S.handOver&&!p.folded;
      const live=!hideMine&&!p.out&&S.board.length>=3&&!p.folded?(p.hname||handName(bestN(p.hand.concat(S.board)))):'';
      $('mine').className='mine'+(turn?' turn':'');
      const wp0=$('mine').querySelector('.won-pile');
      const mh=`
        <div class="mybet"><div class="chipwrap up${slideKey(p,i)}">${chipStack(p.bet)}</div></div>
        <div class="me-l"><div class="me-ava">${avatar(p.name,moodOf(p,0))}${S.dealer===0?'<span class="dbadge" title="ディーラー">D</span>':''}</div>${CFG.flashback?`<span class="me-n">${esc(p.name)}</span>`:''}${tag}</div>
        <div class="hold${p.folded?' folded':''}${hideMine?' squeeze':''}${p.mucked?' mucked':''}" ${hideMine?'role="button" tabindex="0" aria-label="手札をめくる"':''}>${p.hand.map((c,k)=>cardHTML(c,hideMine||(seki&&k===1),anim)).join('')}${hideMine&&p.hand.length?'<span class="peekhint">タップしてめくる</span>':''}${SETTINGS.protector&&p.hand.length&&!p.folded?`<span class="protector">${protectorSVG(SETTINGS.protector)}</span>`:''}</div>
        <div class="me-r"><div class="mystack" aria-hidden="true">${chipStack(p.chips-wonPend(i),false,false,true,i*7919+p.chips)}</div>${CFG.flashback?'':`<span class="lbl2">あなたのチップ</span><span class="chp">${fmt(p.chips)}</span>`}<span class="myhand">${live}</span>${seki?'':eqBadge(p)}</div>`;
      if(setHTMLIfChanged($('mine'),mh,htmlKeyNoIds(mh))&&wp0)$('mine').querySelector('.mystack').appendChild(wp0);
      return;
    }
    const b=$('bust'+i),m=moodOf(p,i),bd=b.querySelector('.body');
    b.className=`bust ${rankOf(p.name)>=3?'cool':'cute'}${turn?' turn':''}${turn&&!p.human?' think':''}${S.stare===i&&turn?' stare':''}${S.readLook===i?' look':''}${p.folded&&!p.out?' folded':''}${p.out?' out':''}${p.sitOut?' watch':''}`;
    const tc=p.tell&&p.tell.street===S.street&&!S.handOver&&!p.folded?p.tell.cue:'',tl=p.name==='ジン'&&tc==='release'?'strong':p.name==='ハヤト'&&tc==='still'?'strong':p.name==='クロウ'&&tc==='glove'?'hidden':'';
    if(bd.dataset.mood!==m+tl+P2K(p)){bd.innerHTML=avatar(p.name,m,{tell:tl});bd.dataset.mood=m+tl+P2K(p)}
    if(p.actKind&&bd.dataset.seq!==String(p.actSeq)){bd.dataset.seq=String(p.actSeq);motion(bd,p.actKind,rankOf(p.name)>=3)}
    const wk=S.handNo+':'+p.won;if(p.won>0&&bd.dataset.win!==wk){bd.dataset.win=wk;motion(bd,'win',rankOf(p.name)>=3)}
    const showCue=p.tell&&p.tell.street===S.street&&!S.handOver&&!p.folded;
    b.classList.toggle('cue-'+(p.tell&&p.tell.cue),!!showCue);
    // クセの札は名札と同じ層に置き、吹き出しより手前に出す（吹き出しに隠れないように）
    let cb=$('cue'+i);
    if(showCue){if(!cb){cb=document.createElement('span');cb.className='cue';cb.id='cue'+i;$('plates').appendChild(cb)}
      cb.dataset.bust=String(i);   // 位置は描き直しの後の位置合わせ（36_layout_pass の cuePlace）で決める
      cb.classList.toggle('blue',p.tell.cue==='sweat'||p.tell.cue==='fast');
      if(cb.dataset.seq!==String(p.tell.seq)){cb.dataset.seq=String(p.tell.seq);cb.textContent=CUE_SFX[p.tell.cue];cb.title=CUE_LABEL[p.tell.cue];
        cb.classList.remove('go');void cb.offsetWidth;cb.classList.add('go')}}
    else if(cb)cb.remove();
    const sy=$('say'+i),pl=$('plate'+i);
    if(p.say&&sy.dataset.seq!==S.handNo+':'+p.say.seq){sy.dataset.seq=S.handNo+':'+p.say.seq;
      const tk=p.name==='タケル';if(tk&&p.say.line&&p.say.line[0]==='（'&&!p.say.line.startsWith('（メモ）')){S.msg=TK_GEST[p.say.line]||('タケル'+p.say.line);sy.classList.remove('go','memo')}
      else if(p.say.line){sy.classList.toggle('memo',tk);sy.textContent=tk?p.say.line.replace(/^（メモ）/,''):p.say.line;if(p.say.sub){const sm=document.createElement('small');sm.className='rd';sm.textContent=p.say.sub;sy.appendChild(sm)}sy._ax=sy._ay=0;sy.classList.remove('go');sy.classList.toggle('bt',!!p.say.bt);sy.classList.toggle('long',!!p.say.bt&&p.say.line.length>=20);sy.style.clipPath='';if(p.say.bt){const cp=getComputedStyle(sy).clipPath;if(cp&&cp.startsWith('polygon'))sy.style.clipPath=cp.replace(/([ ,(])82%/g,(m,a)=>a+'calc(100% - 9px)').replace(/([ ,(])18%/g,(m,a)=>a+'9px')}void sy.offsetWidth;sy.classList.add('go');p.sayAt=sy._t=performance.now();if(camState.i===i&&camState.kind==='mid')camTo(i,'mid')}
      if(!p.say.talk){pl.classList.add('flash');setTimeout(()=>pl.classList.remove('flash'),700)}}
    pl.className='plate'+(turn?' turn':'')+(!p.out?' countable':'')+(pl.classList.contains('flash')?' flash':'');pl.title=approxOn()?'タップでチップを見る・ディーラーが数えます':'タップでチップを見る';
    const ph=`<span class="nm">${esc(p.name)}<span class="stars">${stars(rankOf(p.name))}</span>${SHIP[p.name]&&!CFG.ch?`<small class="lang">${SHIP[p.name].lang}</small>`:''}</span>
      <span class="chp">${p.counting?'数えています…':approxOn()&&!p.out&&p.chips>0&&p.counted!==p.chips?'約'+approx(p.chips):fmt(p.chips)}</span>${tag}${N()>=4&&S.dealer===i?'<span class="dbadge" title="ディーラー">D</span>':''}${p.hname?`<span class="handname">${p.hname}</span>`:''}${eqBadge(p)}`;
    // 書かなかった時：名前を隠している間（33_names の nmAfterRender）に .nm から消えた .lang だけ戻す（名前を出す時に .lang を使うため）
    if(!setHTMLIfChanged(pl,ph)&&SHIP[p.name]&&!CFG.ch){const nm=pl.querySelector('.nm');if(nm&&!nm.querySelector('.lang'))nm.insertAdjacentHTML('beforeend',`<small class="lang">${SHIP[p.name].lang}</small>`)}
    const sp=$('spot'+i),mk=p.folded&&!p.out&&sp.dataset.muck!==String(S.handNo);if(mk)sp.dataset.muck=String(S.handNo);
    const lx=parseFloat(sp.style.left);sp.dataset.side=lx<50?'l':'r';if(Math.abs(lx-50)<1)sp.dataset.c='1';
    const wp=sp.querySelector('.won-pile');
    const sh=`<div class="mystack" aria-hidden="true">${p.out?'':chipStack(p.chips-wonPend(i),false,false,true,i*7919+p.chips)}</div><div class="hand${p.folded&&!p.out?' folded':''}${mk?' muck':''}">${p.hand.map((c,k)=>cardHTML(c,k>=shownN,cardAnim(k))).join('')}</div><div class="chipwrap${slideKey(p,i)}">${chipStack(p.bet)}</div>`;
    if(setHTMLIfChanged(sp,sh)&&wp)sp.querySelector('.mystack').appendChild(wp);
  });
  placeDealer();
  $('street').textContent=S.result==='flash'?'':S.result?(S.result==='win'?'勝利':'敗北'):STREET_JP[S.street];
  const bk=S.board.map(cardStr).join(',')+(S.tease?'+t':'');
  {const L=S.myLastBet,t=$('myTell');let tx='',rc=true;
    if(S.foolTag&&S.foolTag.hand===S.handNo)tx=S.foolTag.text;else if(S.readCard&&!S.handOver)tx=S.readCard;else if(S.myRead&&S.myRead.hand===S.handNo&&!S.handOver)tx='読まれた：'+SELF_WHY[S.myRead.why];
    else{rc=false;if(L&&L.body&&L.hand===S.handNo&&!S.handOver)tx='自分のチップをちらっと見た'}
    if(tx&&typeof whoText==='function')tx=whoText(tx);   // 名乗っていない相手は呼び名で
    t.hidden=!tx;t.classList.toggle('read',rc);if(tx&&t.textContent!==tx)t.textContent=tx}
  {const b2=$('board2');if(S.board2){const k2=S.board2.map(cardStr).join();if(b2.dataset.k!==k2){b2.innerHTML=S.board2.map(c=>cardHTML(c)).join('');b2.dataset.k=k2}b2.hidden=false}else if(!b2.hidden){b2.hidden=true;b2.dataset.k=''}}
  if($('boardCards').dataset.k!==bk||!S.board.length){$('boardCards').innerHTML=[0,1,2,3,4].map(k=>S.tease&&k===S.board.length?cardHTML({},true,' tease'):cardHTML(S.board[k])).join('');$('boardCards').dataset.k=bk}
  const pot=potTotal()-S.players.reduce((a,p)=>a+p.bet,0);
  const paid=S.handOver&&S.players.some(p=>p.won>0);
  const pk=paid?'paid':String(pot);
  if(!S.potPile||S.potPile.hand!==S.handNo)potReset();
  if(!paid&&!S.potLand)potGrow(pot);
  const live=potTotal()-pot;
  if(!S.potPushing){$('potSign').hidden=paid||!potTotal();
    const ps=live>0&&pot>0?`<span class="ps">卓 ${fmt(pot)}＋賭け ${fmt(live)}</span>`:'';
    if($('potSign').dataset.k!==pk+'|'+ps||!$('potSign').querySelector('.pv')){$('potSign').dataset.k=pk+'|'+ps;$('potSign').innerHTML=`<span class="pl">ポット</span><span class="pv">${fmt(S.potPile.shown||0)}</span>${ps}`}
    if(!paid&&S.potPile.target!==potTotal()){S.potPile.target=potTotal();potCount(potTotal(),520)}potSignSoon()}
  $('msg').textContent=S.handOver?'':(S.msg||'');
  const line=senseiLine();
  $('sensei').hidden=!line;$('senseiText').textContent=line;
  renderControls();renderTaunt();renderTalk();camUpdate();
}
// 案3：勝った分の山がまだ崩れたまま（または飛んでいる途中）の席は、その分を塔から引いて描く（山のチップと合わせて持ち点）
function wonPend(i){const W=S&&S.wonPile;if(!W||W.hand!==S.handNo||!S.handOver)return 0;return W.amt[i]&&!W.done[i]?W.amt[i]:0}
let raiseOpen=false;
function raiseBounds(){
  const me=S.players[0];return Rules.raiseBounds(S.currentBet,S.minRaise,me.bet,me.chips);
}
function renderControls(){
  const me=S.players[0];
  const myTurn=!S.handOver&&S.toAct===0;
  $('controls').hidden=S.handOver||!!S.autoMe;
  $('between').hidden=!S.handOver;
  if(S.handOver){
    raiseOpen=false;if(S.keptHand!==S.handNo){S.keptHand=S.handNo;requestAnimationFrame(keepMine)}
    $('btnShot').hidden=!(S.hl&&S.hl.hand===S.handNo);
    const alt=$('btnAlt');
    {let ok=false;try{ok=S.result==='lose'&&!CFG.ch&&!CFG.run&&!CFG.ura&&!!(window.LT_PLATFORM.canShowRewarded&&window.LT_PLATFORM.canShowRewarded())}catch(e){}$('btnRefill').hidden=!ok}
    if(S.result==='flash'){
      $('resultText').textContent='……あの日、ジンは負けた';$('btnNext').textContent='続きへ';alt.hidden=true;
      $('betweenHint').textContent='クロウは、迷わずにコールした。';
    }
    {const rv=$('review'),on=!!(S.result&&S.review&&!CFG.run);rv.hidden=!on;if(on&&rv.dataset.k!==String(S.handNo)){rv.dataset.k=String(S.handNo);rv.innerHTML=reviewHTML(S.review)}}
    if(S.result==='flash'){}else if(S.result==='win'){
      $('resultText').textContent=CFG.ch||CFG.run?'目標達成！':'あなたの優勝です';
      $('btnNext').textContent=CFG.run?(CFG.run.t>=4?'結果を見る':'次の卓へ'):CFG.ura?'裏の卓へ戻る':CFG.ch?'先へ進む':'もう一度遊ぶ';
      alt.hidden=!!CFG.ch||!!CFG.run;alt.textContent='タイトルへ';
      $('betweenHint').textContent=CFG.ura?`${CFG.ura.boss}に${CFG.ura.level}段で勝った`:'';
    }else if(S.result==='lose'){
      $('resultText').textContent='チップがなくなった';
      $('btnNext').textContent=CFG.run?'結果を見る':'もう一度挑戦';
      alt.hidden=false;alt.textContent=CFG.ch?'章を選ぶ':'タイトルへ';$('btnPen').hidden=true;
      $('betweenHint').textContent=CFG.ch?loseLine(CFG.ch):'';
    }else{
      $('resultText').textContent=typeof whoText==='function'?whoText(S.msg||''):(S.msg||'');  // 名乗っていない相手は呼び名で（#msg と同じ）
      $('btnNext').textContent='次のハンドへ';alt.hidden=true;$('btnPen').hidden=S.penReady!==S.handNo;
      let gp=GOSSIP[storeNo()]||[];const lv=regLevel(storeNo()),nm=nick();
      if(lv>=1&&nm&&GOSSIP_REG[storeNo()]&&Math.random()<.5){gp=[].concat(GOSSIP_REG[storeNo()][1],lv>=2?GOSSIP_REG[storeNo()][2]:[]).map(([w,t])=>[w,t.split('{name}').join(nm)])}
      $('betweenHint').classList.remove('penline');
      if(S.handNo%3===0&&gp.length){const g=gp[(S.handNo/3)%gp.length];$('betweenHint').textContent=`${g[0]}「${g[1]}」`}
      else $('betweenHint').textContent='';  // v66（uiux）：持ち点は卓の「あなたのチップ」に出ているので、ここでは二重に出さない
    }
    return;
  }
  $('acts').hidden=!myTurn;$('waitrow').hidden=myTurn;$('review').hidden=true;
  if(!myTurn){raiseOpen=false;quickPick=0;clearArm();$('declRow').hidden=true;renderNeedleMenu(false);$('btnNeedle').hidden=true;$('raisePanel').hidden=true;renderQuick(false);
    $('waiting').textContent=S.toAct>0?`${S.players[S.toAct].name}の番です`:'次のカードを配っています…';renderPre();return}
  $('prerow').hidden=true;
  const toCall=Math.min(S.currentBet-me.bet,me.chips);
  $('btnCall').querySelector('b').textContent=allinArm==='call'?'オールイン':toCall<=0?'チェック':toCall>=me.chips?'オールイン':'コール';
  $('btnCall').classList.toggle('confirm',allinArm==='call');
  $('btnCall').querySelector('small').textContent=allinArm==='call'?'もう一度押す':toCall<=0?'':fmt(toCall);
  const {minTo,maxTo}=raiseBounds();
  const canRaise=me.chips>toCall&&!me.acted&&!(uraRule('ゲン')&&S.street==='preflop');
  $('btnRaise').disabled=!canRaise;
  $('btnNeedle').hidden=!(CFG.tells&&S.toAct===0&&!S.handOver&&S.needle!==S.street&&S.players.some(q=>!q.human&&inHand(q)));
  if(askLive())$('btnNeedle').hidden=true;if($('btnNeedle').hidden)renderNeedleMenu(false);
  $('btnStraddle').hidden=CFG.house!=='straddle';
  $('btnStraddle').textContent=`ストラドル：${myStraddle?'する':'しない'}`;$('btnStraddle').title='次に順番が来たらストラドルを置く';
  $('btnFold').disabled=toCall<=0;
  $('btnFold').querySelector('small').textContent=toCall<=0?'チェックできます':'降りる';
  const fb=!!CFG.flashback;$('btnFold').hidden=fb;$('btnCall').hidden=fb;if(fb)$('btnNeedle').hidden=true;
  renderQuick(canRaise&&!fb&&!raiseOpen&&!quickHide());
  {const show=declOn()&&S.street==='river'&&toCall>0&&S.aggr>0&&!fb;$('declRow').hidden=!show;if(!show)S.declGuess=null;
   document.querySelectorAll('#declRow [data-dg]').forEach(b=>b.setAttribute('aria-pressed',String(S.declGuess===+b.dataset.dg)))}
  if(fb){$('btnRaise').disabled=false;raiseOpen=false;$('raisePanel').hidden=true;$('btnRaise').classList.remove('open');
    $('btnRaise').querySelector('b').textContent=S.street==='river'?'全部賭ける':S.street==='preflop'?'レイズ':'ベット';
    $('btnRaise').querySelector('small').textContent=fmt(flashTo()-me.bet);return}
  const range=$('raiseRange');
  range.min=minTo;range.max=maxTo;
  range.step=BB()/2;
  if(!raiseOpen&&!quickPick)range.value=Math.min(maxTo,Math.max(minTo,S.currentBet===0?Math.round(potTotal()/2/1000)*1000:S.currentBet*3-me.bet*0));
  $('raisePanel').hidden=!raiseOpen;
  $('btnRaise').classList.toggle('open',raiseOpen);
  $('raiseWord').textContent='いくらにする？';
  $('rMin').textContent='';$('rMax').textContent='';
  updateRaiseLabel();
}
function updateRaiseLabel(){
  const me=S.players[0],v=+$('raiseRange').value,all=v>=me.bet+me.chips;
  const word=S.currentBet===0?'ベット':'レイズ';
  const pay=v-me.bet;
  $('raiseAmt').textContent=fmt(v);
  // 見出しの下に小さく1行：ポット・今の賭け・出すチップ・残り
  $('raiseSub').innerHTML=`<span>ポット</span> ${fmt(potTotal())}${S.currentBet>0?`／<span>今の賭け</span> ${fmt(S.currentBet)}`:''}　<span>出す</span> <b>${fmt(pay)}</b>／<span>残り</span> ${fmt(me.chips-pay)}`;
  const sel=raiseOpen||quickPick,arm=allinArm==='raise';
  $('btnRaise').querySelector('b').textContent=arm?'オールイン':sel?(all?'オールイン':word):word;
  $('btnRaise').querySelector('small').textContent=arm?'もう一度押す':sel?`${fmt(v)} で確定`:'額を選ぶ';
  $('btnRaise').classList.toggle('open',!!sel&&!arm);$('btnRaise').classList.toggle('confirm',arm);
  const pot=potTotal(),toCall=S.currentBet-me.bet;
  const q=presetValues(pot,toCall);
  const names={min:'最小',half:'½ポット',threeq:'¾ポット',pot:'ポット',all:'全額'};
  document.querySelectorAll('[data-q]').forEach(b=>{b.classList.toggle('on',q[b.dataset.q]===v);b.innerHTML=`${names[b.dataset.q]}<i>${fmt(q[b.dataset.q])}</i>`});
}
function presetValues(pot,toCall){
  const {minTo,maxTo}=raiseBounds(),clamp=v=>Math.max(minTo,Math.min(maxTo,Math.round(v/1000)*1000));
  const base=pot+toCall;
  return{min:minTo,half:clamp(S.currentBet+base/2),threeq:clamp(S.currentBet+base*.75),pot:clamp(S.currentBet+base),all:maxTo};
}
function log(text,head){
  const li=document.createElement('li');li.textContent=text;if(head)li.className='hd';
  $('log').prepend(li);
}
