// ===== 顔なじみ帳：モブと同じ卓で終わったハンドの数（降りていても数える）・入港した船の客と会った日数 =====
const MOB_KEY='shisho-mob';
function loadMobAll(){try{const o=JSON.parse(localStorage.getItem(MOB_KEY))||{},ok=x=>x&&typeof x==='object'&&!Array.isArray(x);
  return{h:ok(o.h)?o.h:{},ship:ok(o.ship)?o.ship:{},sd:ok(o.sd)?o.sd:{}}}catch(e){return{h:{},ship:{},sd:{}}}}
function saveMobAll(o){try{localStorage.setItem(MOB_KEY,JSON.stringify({v:1,h:o.h,ship:o.ship,sd:o.sd}))}catch(e){}}
const loadMob=()=>loadMobAll().h;
const mobH=n=>+loadMob()[n]||0;
function mobCount(){if(!S||!S.players||CFG.flashback)return;const ms=S.players.filter(p=>!p.human&&!p.out&&MOBS[p.name]);if(!ms.length)return;
  const o=loadMobAll(),h=o.h;ms.forEach(p=>{const a=+h[p.name]||0,b=a+1;h[p.name]=b;
    if(a<10&&b>=10)log(`顔なじみ帳：${p.name}のページが開いた`);else if(a<60&&b>=60)log(`顔なじみ帳：${p.name}のことが、もう少しわかった`)});
  saveMobAll(o);
  if(Object.keys(MOBS).every(k=>(+h[k]||0)>=10))grantTitle('kao')}
// 今日入港している船の客（日付で1人。今日の1ハンドと同じ日付の決め方）
function shipToday(){const L=Object.keys(SHIP),d=dayNo(todayKey());return L[((d%L.length)+L.length)%L.length]}
function shipMet(k){const o=loadMobAll(),t=todayKey();if(o.sd[k]===t)return;o.sd[k]=t;o.ship[k]=(+o.ship[k]||0)+1;saveMobAll(o);
  if(Object.keys(SHIP).every(x=>(+o.ship[x]||0)>=1))grantTitle('port')}
// 人物タブの最後：店の常連（10ハンドで1行目、60ハンドで2行目）と、入港した船（1日で1行目、3日で2行目）
function mobNotes(n,cl){const mo=loadMobAll(),mh=mo.h;
  const tells=k=>n[k]?Object.keys(n[k]).map(c=>{const r=n[k][c],tot=r.strong+r.bluff+r.none;return`<li>「${CUE_LABEL[c]}」→ 強い手 ${r.strong}／ブラフ ${r.bluff}／意味なし ${r.none}（${tot}回）</li>`}).join(''):'';
  const card=(k,sub,l2,lk2,foot)=>{const P=PROFILE[k],tl=tells(k);
    return`<article class="pcard mob"><div class="pava">${avatar(k)}</div><div class="pbody"><h4>${esc(k)}<span class="stars">${stars(rankOf(k))}</span></h4>
      ${FULLNAME[k]?`<p class="ms fn">${esc(FULLNAME[k])}</p>`:''}<p class="ms">${esc(sub)}</p><p class="ph">「${esc(P.ph)}」</p><ul><li>${esc(P.lines[0][1])}</li>${l2?`<li>${esc(P.lines[1][1])}</li>`:`<li class="lk">${esc(lk2)}</li>`}</ul>
      ${tl?`<details><summary>見抜いたクセ</summary><ul class="tl">${tl}</ul></details>`:''}<p class="rd">${esc(foot)}</p></div></article>`};
  const lock=(sub,t)=>`<article class="pcard mob mlk"><div class="pava" aria-hidden="true">？</div><div class="pbody"><h4>？？？</h4><p class="ms">${esc(sub)}</p><ul><li class="lk">${esc(t)}</li></ul></div></article>`;
  let h=`<h3 class="nhead">店の常連</h3>`+Object.keys(MOBS).sort((a,b)=>MOBS[a].store-MOBS[b].store).map(k=>{const c=+mh[k]||0;
    if(c<10)return lock(INTRO[k][0],'？？？（同じ卓で10ハンド打つと開く）');
    return card(k,INTRO[k][0],c>=60,'？？？（同じ卓で60ハンド打つと開く）',`同じ卓で${c}ハンド`)}).join('');
  if(cl>=3||Object.keys(mo.ship).length){
    h+=`<h3 class="nhead">入港した船</h3>`+Object.keys(SHIP).map(k=>{const d=+mo.ship[k]||0,sp=SHIP[k];
      if(d<1)return lock('入港した船の客','？？？（入港した日に、フリー対戦で同じ卓に座ると開く）');
      return card(k,`${sp.port}・${sp.lang}`,d>=3,'？？？（3日会うと開く）',`会った日：${d}日`)}).join('')}
  return h}
function renderNotes(){
  const n=loadNotes(),rows=[];
  Object.keys(n).forEach(name=>Object.keys(n[name]).forEach(cue=>{
    const r=n[name][cue],tot=r.strong+r.bluff+r.none;
    rows.push(`<li><b>${esc(name)}</b>「${CUE_LABEL[cue]}」→ 強い手 ${r.strong}／ブラフ ${r.bluff}／意味なし ${r.none}（${tot}回）</li>`);
  }));
  if(S&&S.jinViews)S.jinViews.forEach(t=>rows.unshift(`<li><b>ジンの見立て</b> ${esc(t)}</li>`));
  {const lk=loadLeaks();Object.keys(lk).forEach(name=>{const ks=Object.keys(lk[name]).filter(k=>lk[name][k].seen>0).sort((a,b)=>lk[name][b].seen-lk[name][a].seen);
    if(ks.length)rows.push(`<li class="leakrow"><b>${esc(name)}</b> <span>打ち方：${LEAK_NOTE[ks[0]]}</span>（${lk[name][ks[0]].seen}回）</li>`)})}
  if(typeof talkRows==='function')rows.push(...talkRows());
  $('notes').innerHTML=rows.length?rows.join(''):'<li>まだ記録はありません。手が見えたときに、出ていたクセを自動で書き込みます。</li>';
}
/* 考えているあいだにクセを見せる */
/* 第4章からは全員、第1〜3章は一般キャラ（★1〜2）だけクセが出る。CPUの打ち方は変えない */
const tellsOn=p=>CFG.tells||(!!CFG.ch&&rankOf(p.name)<=2);
function showTell(i,d){
  const p=S.players[i];p.tell=null;
  // 裏の卓：ジンは一度だけ、ブラフのときにわざと「傷から手を離す」
  if(p.name==='ジン'&&uraRule('ジン')&&!S.jinTrap&&d.state==='bluff'&&S.street!=='preflop'){S.jinTrap=true;S.tellSeq=(S.tellSeq||0)+1;p.tell={cue:'release',meaning:'strong',truth:'bluff',street:S.street,seq:S.tellSeq,rev:true};p.tellLog.push(p.tell);if(reducedMotion())log(`${p.name}：${CUE_LABEL.release}`);return}
  const T=TELLS[p.name];if(!tellsOn(p)||!T)return;
  const rev=revOn(p);
  // 案2：レイカとクロウは、揺さぶられると、わざと嘘のクセを見せることがある
  if(S.needle===S.street&&FAKERS.includes(p.name)&&(d.state==='strong'||d.state==='bluff')&&!p.faked&&Math.random()<.25){
    const opp=d.state==='strong'?'bluff':'strong';p.faked=S.street;S.tellSeq=(S.tellSeq||0)+1;
    p.tell={cue:T[opp].cue,meaning:opp,truth:d.state,street:S.street,seq:S.tellSeq,fake:true};p.tellLog.push(p.tell);
    if(reducedMotion())log(`${p.name}：${CUE_LABEL[p.tell.cue]}`);return}
  let shown=null;
  for(const cat of ['strong','bluff']){
    const t=T[cat];let prob=d.state===cat?t.rate:t.false;
    if(d.state===cat&&typeof mfBigBoost==='function')prob=Math.min(.95,prob+mfBigBoost(p));   // 改善提案 2026-10-15b 案1：大一番（15BB 以上のターン・リバー）ほど正しいクセが出やすい
    if(uraLv()>=2)prob*=.8;if(d.state===cat&&hasLesson('face'))prob=Math.min(.95,prob+.15);
    if(S.needle===S.street)prob=Math.min(.95,prob+needleBoost(p,t.cue));
    if(Math.random()<prob){shown=cat;break}
  }
  if(!shown){
    // クロウの本物のクセ：本当に迷ったときだけ、手袋の指先を直す（手の強さとは関係ない）
    if(p.name==='クロウ'&&p._close&&Math.random()<(uraRule('クロウ')?.3:.6)){S.tellSeq=(S.tellSeq||0)+1;p.tell={cue:'glove',meaning:'none',truth:d.state,street:S.street,seq:S.tellSeq};p.tellLog.push(p.tell);S.gloveHand=S.handNo;
      if(reducedMotion())log(`${p.name}：${CUE_LABEL.glove}`)}
    return}
  const cueCat=rev?(shown==='strong'?'bluff':'strong'):shown;
  S.tellSeq=(S.tellSeq||0)+1;
  p.tell={cue:T[cueCat].cue,meaning:cueCat,truth:d.state,street:S.street,seq:S.tellSeq,rev};
  p.tellLog.push(p.tell);
  if(rev&&!S.revSaid){S.revSaid=S.handNo+':'+S.street}
  if(reducedMotion())log(`${p.name}：${CUE_LABEL[p.tell.cue]}`);
}
