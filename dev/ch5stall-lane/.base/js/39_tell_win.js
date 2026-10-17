/* ---------- テルで勝てる（2026-10-14 satou 決定「全部」。research/テルを主軸に_実装仕様.md） ---------- */
// 操作はポーカーのまま。テルを読んだ人が勝てるようにする。どれも CFG.tells の卓（第4章以降・フリー対戦など）だけ。第1〜3章は通らない。
// cpuDecide と showTell は戻り値・中身を変える必要があるので、合図（LT.on）ではなく包み直す（合図は戻り値を変えられない）。
const TW_KEEP=['ジン','師匠','クロウ'];                 // 特別なクセ（本物のテル・手袋）は今のまま
const TW_NOSHOW=['ジン','師匠','レイカ','クロウ'];       // 案3：自分からは見せない
const twOn=()=>!!CFG.tells&&!CFG.flashback&&!!S&&!S.scriptAI&&!S.storyHand&&!S.finalHand;
function twState(){return S.tw=S.tw||{won:0,saved:0,cue:{}}}

// 案1：テルは「相手がフロップ以降で賭けた・上げた」ときだけ出す。当たる確率（TELLS）は変えない
{const _st=showTell;showTell=function(i,d){const p=S.players[i];
  if(twOn()&&p&&!TW_KEEP.includes(p.name)&&(S.street==='preflop'||!d||d.type!=='raise')){p.tell=null;return}
  return _st.apply(this,arguments)}}

// 案2：弱い手のCPUが、ターン・リバーで性格に応じて大きく賭ける（ブラフ）。そのときは案1の場面なのでクセが出る
const twBluffRate=p=>Math.min(.4,((styleOf(p)||{}).bluff||.08)*2.5+.05);
{const _cd=cpuDecide;cpuDecide=function(i){const d=_cd.apply(this,arguments);
  try{const p=S.players[i],me=S.players[0];
    if(!twOn()||!p||p.human||TW_KEEP.includes(p.name)||!d||d.type!=='call'||!inHand(me))return d;
    if(S.street!=='turn'&&S.street!=='river')return d;
    const toCall=S.currentBet-p.bet;if(toCall!==0||p.chips<=BB()*2)return d;
    if(Math.random()>=twBluffRate(p))return d;
    const opps=S.players.filter(q=>q!==p&&inHand(q)).length;if(!opps)return d;
    const rel=equity(p.hand,S.board,opps,150,0)*(opps+1);if(rel>=.7)return d;
    const pot=potTotal(),size=Math.max(S.minRaise||BB(),Math.round(pot*(.7+Math.random()*.3)/1000)*1000);
    return{type:'raise',to:S.currentBet+Math.min(p.chips,size),state:'bluff'}}
  catch(e){return d}}}

// 案3：「何持ってた？」で見せた手も答え合わせに使う
function twCheck(p){if(!p||!p.show||!(p.tellLog||[]).length||p._twChecked===S.handNo)return;p._twChecked=S.handNo;
  p.tellLog.forEach(t=>{if(!CUE_LABEL[t.cue])return;log(`答え合わせ：${p.name}の「${CUE_LABEL[t.cue]}」は${TRUTH_JP[t.truth]}だった`);noteTell(p.name,t.cue,t.truth)});renderNotes()}
{const _wa=whatAsk;whatAsk=function(){const p=S&&S.players&&S.players[S.whatWho];const r=_wa.apply(this,arguments);try{if(twOn())twCheck(p)}catch(e){}return r}}

// 案3：見せたがりのキャラは、強いクセで降ろしたとき、聞かなくても3回に1回くらい手を見せる
// 案4：その卓で「クセで取った」「クセで降りて守った」を数える（ジンの三行に使う）
LT.on('endHand:before',()=>{if(!S||!S.players)return;S._twFold=S.foldRead||null});
LT.on('endHand',()=>{if(!twOn()||!S.players)return;const me=S.players[0],tw=twState();
  if(me.won>0&&!me.folded){const q=S.players.find(o=>!o.human&&o.show&&(o.tellLog||[]).some(t=>t.meaning==='bluff'&&t.truth==='bluff'));
    if(q){tw.won++;const t=q.tellLog.filter(t=>t.meaning==='bluff'&&t.truth==='bluff').pop();tw.cue[t.cue]=(tw.cue[t.cue]||0)+1;twBest(q,t.cue,'call')}}
  const f=S._twFold;S._twFold=null;if(!f||!me.folded)return;tw.saved++;
  {const o=S.players.find(o=>!o.human&&o.name===f.name);if(o)twBest(o,f.cue,'fold')}
  const q=S.players.find(o=>!o.human&&o.name===f.name&&o.won>0&&!o.show);if(!q||TW_NOSHOW.includes(q.name))return;
  // window.__twShow はテストで見せる確率を上げるときだけ使う
  const w=WHAT_RATE[q.name]||WHAT_RATE._||[0,0,0];if(w[0]<.3||Math.random()>=(window.__twShow||1/3))return;
  q.show=true;S.whatDone=true;if(tw.best&&tw.best.who===q&&tw.best.handNo===S.handNo)tw.best.shown=true;log(`${q.name}の手：${q.hand.map(cardStr).join(' ')}`);
  talkLater(()=>{talkSay(q,pick(TW_SHOW_LINES),7700);twCheck(q)},300);render()});
// 改善提案 2026-10-15b 案5（読み勝ちの見返し）：その卓でいちばんポットが大きかった「クセで取った／クセで降りて守った」1ハンドを残す（41_more_fun.js の mfReplay が章クリアで見せる）
function twBest(o,cue,act){const tw=twState(),pot=S.players.reduce((a,p)=>a+(p.total||0),0);if(tw.best&&tw.best.pot>=pot)return;
  tw.best={pot,name:o.name,cue,act,hand:(o.hand||[]).slice(),board:S.board.slice(),hand2:S.players[0].hand.slice(),handNo:S.handNo,who:o}}
const TW_SHOW_LINES=['見せてやるよ','降りて正解だったな','ほら、本物だ'];

// 案4：ジンの三行の1行目を、クセで勝った話にする（数字の表は出さない）
const TW_CUE_WORD={smile:'口元',talk:'口数',glance:'目線',sweat:'汗',still:'止まった手',stare:'視線',fast:'速さ'};
function twLine(){const tw=S&&S.tw;if(!tw||(!tw.won&&!tw.saved))return'';
  const c=Object.keys(tw.cue).sort((a,b)=>tw.cue[b]-tw.cue[a])[0],word=TW_CUE_WORD[c]||'顔';
  if(tw.won&&tw.saved)return`${word}で${tw.won}回取って、${tw.saved}回降りて守った。顔が見えてきたな`;
  if(tw.won)return`${word}で${tw.won}回、取ったな。あれは運じゃない`;
  return`${tw.saved}回、クセを見て降りた。あれも勝ちだ`}
{const _rl=reviewLines;reviewLines=function(st,ch,result){const r=_rl.apply(this,arguments);try{const l=st===(S&&S.stat)&&CFG.tells&&result!=='lose'?twLine():'';if(r&&l)r[0]=l}catch(e){}return r}}
LT.on('startHand',()=>{if(S&&S.handNo<=1)S.tw={won:0,saved:0,cue:{}}});
