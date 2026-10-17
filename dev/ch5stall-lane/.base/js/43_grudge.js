/* ---------- 卓の因縁（改善提案 2026-10-15b 案3。satou 2026-10-17「すべて対応」で 1.0 に。research/改善提案_2026-10-15b_実装仕様.md） ---------- */
// 30BB 以上のポットで「あなたがブラフで降ろした」「相手のブラフをコールで見抜いた」「相手に負けた」を、相手ごとに覚える（shisho-grudge）。
// 次に同じ相手と卓に着いたら、最初のハンドで一言（同じ記録につき1回）。その卓の最初の5ハンドだけ、相手の打ち方が少し変わる。
// 記録はどの卓でも（台本・回想・決めの一手は除く）。一言と打ち方の変化は twOn() の卓だけ（第1〜3章は記録だけ）。ジン・師匠・クロウは対象外。
const GRUDGE_KEY='shisho-grudge',GRUDGE={potBB:30,hands:5,skip:['ジン','師匠','クロウ']};
if(typeof SAVE_KEYS!=='undefined'&&!SAVE_KEYS.includes(GRUDGE_KEY))SAVE_KEYS.push(GRUDGE_KEY);
const MF_GRUDGE={
  'ゲン':{bluffed:'この前のブラフ、忘れてないからな',caught:'……あのときは見抜かれたな。今日は違うぞ',lost:'よう。また、もらいに来たのか'},
  'ハル':{bluffed:'あれ、ブラフだったんでしょ。わかってるんだから',caught:'うう、前のは見られてた……',lost:'今日も、いい勝負しようね'},
  'ロク':{bluffed:'……前の一枚、まだ考えている',caught:'見抜いたつもりか。一度だけだ',lost:'……座れ。続きだ'},
  'セキ':{bluffed:'あのときは、きれいに降ろされましたね',caught:'前は、たしなみを欠きました。今日は気をつけます',lost:'またご一緒できて、うれしいですよ'},
  'ミナ':{bluffed:'前のあれ、ブラフだったよね？ 次は降りないよ',caught:'前のは見られちゃった。今日は顔に出さない',lost:'また会ったね。今日も、取らせてもらう'},
  'レイカ':{bluffed:'わたしを降ろしたこと、覚えてるわよ',caught:'見抜いた気でいるのね。……面白い',lost:'あら。また負けに来たの？'},
  'ソウ':{bluffed:'あ、あのときの……お、落ち着け……',caught:'前のは、ば、ばれてた……',lost:'こ、今日もよろしくお願いします'},
  'ケンジ':{bluffed:'前の、やられたよ。今日はコールするからな',caught:'見られてたか。仕事でもよく言われる',lost:'よっ。今日も一勝負'},
  'ハヤト':{bluffed:'……前の、ブラフだったろ。わかってる',caught:'一回見抜いたくらいで、いい気になるなよ',lost:'……二代目。今日も、取る'},
  '_':{bluffed:'この前は、うまく降ろされたな',caught:'前のは、見抜かれたな',lost:'また会ったな'}};
function grudgeLoad(){const o=saveGet(GRUDGE_KEY,null);return o&&typeof o==='object'&&o.who&&typeof o.who==='object'?o:{v:1,who:{}}}
function grudgeSave(o){saveSet(GRUDGE_KEY,o,1)}
const grudgeRec=()=>!!S&&!!S.players&&!CFG.flashback&&!S.scriptAI&&!S.storyHand&&!S.finalHand;

// ハンドの終わり：30BB 以上のポットだけ見る。新しい出来事で上書き（言った印も消える）
LT.on('endHand',()=>{try{
  if(!grudgeRec())return;const me=S.players[0];if(!me||potTotal()<GRUDGE.potBB*BB())return;
  const opps=S.players.filter(p=>!p.human&&!GRUDGE.skip.includes(p.name)&&(p.total||0)>0);if(!opps.length)return;
  const live=S.players.filter(p=>!p.folded&&!p.out),sd=live.length>=2,ch=CFG.ch?(CFG.ch.p2?10+CFG.ch.p2:CFG.ch.no):0,ev={};
  if(!sd&&me.won>0&&!me.folded&&S.aggr===0){
    // bluffed：あなたが賭けて降ろし、あなたの手は弱かった（どの手が相手でも勝つ見込み 35% 未満）
    if(equity(me.hand,S.board,1,200,0)<.35)opps.filter(p=>p.folded).forEach(p=>{ev[p.name]='bluffed'})}
  if(sd&&!me.folded){
    if(me.won>0)opps.filter(p=>!p.folded&&S.players.indexOf(p)===S.aggr&&(p.tellLog||[]).some(t=>t.truth==='bluff')).forEach(p=>{ev[p.name]='caught'});
    else opps.filter(p=>!p.folded&&p.won>0).forEach(p=>{ev[p.name]='lost'})}
  const ks=Object.keys(ev);if(!ks.length)return;
  const o=grudgeLoad();ks.forEach(k=>{o.who[k]={t:ev[k],ch}});grudgeSave(o)}catch(e){}});

// 卓の最初のハンド：記録があって、まだ言っていない相手が一言。効果はその卓の最初の5ハンドだけ
LT.on('startHand',()=>{try{
  if(!S||!S.players||S.handNo>1)return;S.grudge={};
  if(!twOn())return;const o=grudgeLoad();let said=0,n=0;
  S.players.forEach(p=>{const r=o.who[p.name];if(p.human||p.out||!r||r.said||GRUDGE.skip.includes(p.name))return;
    const L=(MF_GRUDGE[p.name]||MF_GRUDGE._)[r.t];if(!L)return;
    S.grudge[p.name]=r.t;r.said=1;said=1;const k=n++;talkLater(()=>{if(!p.out)talkSay(p,L)},1400+k*1600)});
  if(said)grudgeSave(o)}catch(e){}});

// 打ち方（39_tell_win.js と同じく cpuDecide を包む。戻り値を変えるので合図ではなく包み直す）
//   bluffed：あなたが賭けたとき、降りの 25% をコールに／caught：ブラフの大きな賭けを半分に／lost：ブラフの大きな賭けを 1.5倍に
{const _cd=cpuDecide;cpuDecide=function(i){const d=_cd.apply(this,arguments);
  try{const p=S.players[i],g=S.grudge&&p&&S.grudge[p.name];
    if(!g||!d||p.human||S.handNo>GRUDGE.hands||!twOn())return d;
    const hit=x=>{(S.grudgeHits=S.grudgeHits||[]).push(S.handNo);return x};   // 検査用：変えたハンドの番号（qa livelook の morefun:grudge）
    const me=S.players[0],toCall=S.currentBet-p.bet;
    if(g==='bluffed'&&d.type==='fold'&&S.aggr===0&&toCall>0&&p.chips>0&&LT.rand()<.25)return hit({type:'call'});
    if(g==='caught'&&d.type==='raise'&&d.state==='bluff'&&LT.rand()<.5)return hit({type:'call'});
    if(g==='lost'&&d.type==='call'&&toCall===0&&inHand(me)&&(S.street==='turn'||S.street==='river')&&p.chips>BB()*2&&LT.rand()<twBluffRate(p)*.5){
      const opps=S.players.filter(q=>q!==p&&inHand(q)).length;
      if(opps&&equity(p.hand,S.board,opps,150,0)*(opps+1)<.7){const pot=potTotal(),size=Math.max(S.minRaise||BB(),Math.round(pot*(.7+LT.rand()*.3)/1000)*1000);
        return hit({type:'raise',to:S.currentBet+Math.min(p.chips,size),state:'bluff'})}}
    return d}catch(e){return d}}}
