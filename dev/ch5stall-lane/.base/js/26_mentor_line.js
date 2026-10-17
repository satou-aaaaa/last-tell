/* ---------- 師匠のひとこと ---------- */
// A3：BB以外の誰も、プリフロップでチップを出していない（SBはブラインドだけ）。自分（席0）は数えない
function noLimper(){const live=p=>!p.out,alive=S.players.filter(live).length;
  const sb=S.sbI!=null?S.sbI:(alive===2?S.dealer:nextIdx(S.dealer,live)),bb=S.bbI!=null?S.bbI:nextIdx(sb,live);
  return S.players.every((p,i)=>i===0||p.out||i===bb||(i===sb?p.bet<=SB():p.bet===0))}
// A4：自分の札で作ったペアが、場のいちばん高いカードより低い（ボトム・ミドルペア、場より小さいポケットペア）
function smallMade(hand,board){if(board.length<3)return false;const cat=bestN(hand.concat(board))[0];if(cat>2)return false;
  const top=Math.max(...board.map(c=>c.r)),hr=hand.map(c=>c.r);
  const pairs=[...new Set(hr)].filter(r=>(hr[0]===hr[1])||board.some(c=>c.r===r));
  if(!pairs.length||(cat===2&&pairs.length>=2))return false;return Math.max(...pairs)<top}
function isLatePos(){
  // ディーラー、またはディーラーの直前の席
  const live=S.players.map((p,i)=>i).filter(i=>!S.players[i].out);
  if(S.dealer===0)return true;
  return live.length>=3&&nextIdx(0,p=>!p.out)===S.dealer;
}
function senseiLine(){
  if(uraLv()>=7)return'';
  if(S.jinNote&&S.handNo<=S.jinNote.until)return S.jinNote.t;
  if(!CFG.hint||S.handOver||S.toAct!==0)return'';
  const me=S.players[0],toCall=S.currentBet-me.bet;
  if(CFG.hint==='hand'){
    if(S.street==='preflop'){
      let t=preTier(me.hand);
      // v66（レビュー 6）：1対1では A・K を含む手は弱くない。助言の文だけ（CPU・勝率の preTier は変えない）
      if(t===0&&S.players.filter(p=>!p.out).length===2&&me.hand.some(c=>c.r>=13))t=1;
      if(t===2)return'いい手だ。勝負しろ。';
      if(t===1)return toCall<=BB()?(proAI()?'悪くない。入るならレイズで入れ。':'悪くない。安く入れるなら参加していい。'):'悪くない手だが、大きく賭けられたら考えろ。';
      return toCall<=0?'弱い手だ。ただで見られるならチェックでいい。':'弱い手だ。降りろ。ゲンにくれてやれ。';
    }
    if(isWeak(me.hand,S.board))return'何もできていない。ゲンは降りない。弱い手で賭けるな。';
    return smallMade(me.hand,S.board)?'小さい役だ。安く見られるなら見ていい。大きく賭けられたら考えろ。':'役ができた。ゲンは降りない。しっかり賭けろ。';
  }
  if(CFG.hint==='position'){
    if(S.street!=='preflop')return'スチールはプリフロップで決めろ。ここからは手の強さで勝負だ。';
    const nobodyIn=S.currentBet<=BB()&&noLimper();
    if(isLatePos()&&nobodyIn)return'後ろの席で、誰も参加していない。手が弱くても、レイズでスチールしろ。';
    if(isLatePos())return'誰かが先に参加した。スチールはやめて、強い手だけで行け。';
    return preTier(me.hand)===2?'前の席だが、いい手だ。参加していい。':'前の席は不利だ。強い手以外は降りろ。';
  }
  if(CFG.hint==='tell'){
    if(S.revSaid===S.handNo+':'+S.street)return'……今のは、わざとだ。クセを信じすぎるな。';
    const t=S.players.map((q,j)=>({q,j})).filter(o=>!o.q.human&&o.q.tell&&o.q.tell.street===S.street&&!o.q.folded);
    if(t.length){
      const {q}=t[t.length-1];
      if(S.handNo>=8&&S.handNo%3)return'さっきのクセ、意味は覚えているか。自分で読め。';
      return q.tell.meaning==='strong'?`見たか。${q.name}が${CUE_LABEL[q.tell.cue]}。強いぞ。`
        :`見たか。${q.name}が${CUE_LABEL[q.tell.cue]}。ブラフかもしれん。`;
    }
    if(S.street==='preflop')return'相手の顔を見ろ。賭ける前に、何かが出る。';
    return toCall>0?'相手が賭けてきた。そのとき何が出ていたか思い出せ。':'手がなければ無理するな。チェックで様子を見ろ。';
  }
  if(CFG.hint==='bluff'){
    if(S.street==='preflop')return'フロップを見てから仕掛けろ。安く入れるなら参加していい。';
    const weak=isWeak(me.hand,S.board);
    if(weak&&toCall<=0)return'何もない。だが相手も迷っている。賭けてみろ。';
    if(weak)return'相手が打ってきた。今回は引け。';
    return'手ができた。普通に勝負しろ。';
  }
  return'';
}
