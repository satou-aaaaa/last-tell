/* ---------- セリフが途中で切れないように（2026-10-10 satou 報告「セリフのやりとりが途中で切れたりしている」）
   1. 吹き出しは1人1つなので、読み終わる前に同じ人の次のセリフ（打つときのひとこと・考えるひとこと）が来ると、前のセリフが消えていた。
      読むのに要る時間（文字数から）がたつまで、次のセリフを待たせてから出す。掛け合いのセリフを待たせている間に打つときのひとことが来たら、掛け合いのほうを出す。
   2. ハンドの頭の掛け合いの途中で、ほかの人が打ち始めて割り込んでいた（自分が先に打つ席だと、掛け合いの分の待ち時間が使われずに消えていた）。
      自分が打ったとき、掛け合いが残っていれば、次の CPU はその分だけ待つ。
   3. 掛け合いの途中で「次のハンドへ」を押すと、残りが消えていた。残りは次のハンドの頭で続ける（問いかけの組は 25_cpu の答え待ちに任せる）。
   状態は S.sayKeep（掛け合いの進み）と SK（吹き出しごとの表示時刻）。合図は LT.on（js/00b_hooks.js）。 */
const SK={shown:{},held:[],pend:{},tm:0};
function skRead(line){const n=String(line||'').replace(/[…。、！？!?「」（）\s]/g,'').length;return Math.min(2800,Math.max(1100,400+120*n))}
// 1. render の前に、まだ読み終わっていない吹き出しの人は、前のセリフのまま描かせる（render の後で戻す）
LT.on('render:before',()=>{SK.held=[];
  if(typeof S==='undefined'||!S||!S.players||$('game').hidden)return;
  const now=performance.now(),hk=S.handNo+':';let wake=1e9;
  S.players.forEach((p,i)=>{const sy=$('say'+i),sh=SK.shown[i],pd=SK.pend[i];
    if(pd&&(!pd.key.startsWith(hk)||sh&&sh.say===pd.say))delete SK.pend[i];
    else if(pd&&p.say!==pd.say&&!(p.say&&p.say.bt))p.say=pd.say;   // 待たせている掛け合いを、打つときのひとことで消さない
    if(!p.say||!p.say.line||!sy||!sh||sy.dataset.seq!==sh.key||!sh.key.startsWith(hk))return;
    if(sy.dataset.seq===hk+p.say.seq||p.say.line===sh.say.line)return;
    const left=sh.t+sh.need-now;
    if(left>30){if(p.say.bt)SK.pend[i]={key:hk+p.say.seq,say:p.say};SK.held.push([p,p.say]);p.say=sh.say;wake=Math.min(wake,left)}});
  if(wake<1e9){clearTimeout(SK.tm);SK.tm=setTimeout(()=>{try{render()}catch(e){}},wake+20)}});
LT.on('render',()=>{
  SK.held.forEach(([p,s])=>{p.say=s});SK.held=[];
  if(typeof S==='undefined'||!S||!S.players)return;const now=performance.now();
  S.players.forEach((p,i)=>{const sy=$('say'+i);if(!p.say||!p.say.line||!sy)return;const key=S.handNo+':'+p.say.seq;
    if(sy.dataset.seq===key&&sy.classList.contains('go')&&(!SK.shown[i]||SK.shown[i].key!==key))SK.shown[i]={key,say:p.say,t:now,need:skRead(p.say.line)}})});
// 2・3. 掛け合いが今どこまで進んだかを S.sayKeep に持つ（中身は 25_cpu の bSay と同じ。進みを数える所だけ足した）
bSay=function(lines,ok,done){const s0=S,h0=S.handNo,gap=1900*SPEED();let k=0,tries=0;   // 第6章の録画 #33：1.5秒では読めない
  const run={live:!S.handOver,ask:!!done,gap,get rest(){return lines.slice(k)},on:true};S.sayKeep=run;
  const stop=()=>{run.on=false;if(s0.sayKeep===run)s0.sayKeep=null};
  const step=()=>{if(S!==s0||S.handNo!==h0||!ok())return stop();
    if(k>=lines.length){stop();if(done)done();return}
    if(bBlocked()){if(++tries<15)setTimeout(step,400);else stop();return}
    const [n,line]=lines[k++],i=S.players.findIndex(p=>p.name===n&&!p.human);
    if(i<0)return step();const p=S.players[i];p.say={seq:(S.saySeq=(S.saySeq||0)+1),line,talk:true,bt:true};
    try{const to=typeof btTo==='function'?btTo(lines,n):'';if(to)p.say.sub=to}catch(e){}   // 第6章の録画 #35：誰に話しているか（js/51_play6_fixes.js）
    render();setTimeout(step,gap)};
  step();return lines.length*gap};
// 2. 自分が打ったとき、ハンドの頭の掛け合いが残っていれば、次の CPU は残りの分（最後の1行を読む時間も）待つ
LT.on('act:before',i=>{try{const run=S.sayKeep,p=S.players[i];
  if(p&&p.human&&!S.handOver&&i===S.toAct&&run&&run.on&&run.live)S.hold=Math.max(S.hold||0,(run.rest.length+1)*run.gap)}catch(e){}});
// 3. 掛け合いの途中で次のハンドを配ったら、残りを次のハンドの頭へ持ちこす
LT.on('startHand:before',()=>{try{const run=S&&S.sayKeep;if(run&&run.on&&!run.ask){
  const rest=run.rest.filter(x=>S.players.some(p=>p.name===x[0]&&!p.human));if(rest.length)S.bSilent=(S.bSilent||[]).concat(rest)}}catch(e){}});
