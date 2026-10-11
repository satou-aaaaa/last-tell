/* ---------- 章の決まった場面（第5章のバッドビート、第7章の最後のクセ） ---------- */
const C=(r,su)=>({r,s:'♠♥♦♣'.indexOf(su)});
// 手札と場札を決める。場札は配る順（バーンカードは残りの山から）
function rig(hands,board){
  const used=[...Object.values(hands).flat(),...board],same=(a,b)=>a.r===b.r&&a.s===b.s;
  let rest=shuffle(fullDeck().filter(c=>!used.some(u=>same(u,c))));
  S.players.forEach(p=>{if(p.out)return;p.hand=hands[p.name]||[rest.pop(),rest.pop()]});
  const order=[rest.pop(),board[0],board[1],board[2],rest.pop(),board[3],rest.pop(),board[4]];
  S.deck=rest.concat(order.reverse());
}
function setupScript(){
  S.scriptAI=null;S.autoMe=false;S.finalHand=false;
  if(CFG.flashback&&flashOf()){flashScript(flashOf());return}
  if(CFG.flashback){
    rig({'若き日のジン':[C(12,'♠'),C(11,'♠')],'クロウ':[C(9,'♥'),C(9,'♣')]},[C(14,'♠'),C(7,'♠'),C(2,'♦'),C(4,'♣'),C(13,'♥')]);
    S.msg='15年前のジンとして打つ。結末は、もう決まっている';
    S.scriptAI=i=>{const p=S.players[i],tc=S.currentBet-p.bet;
      if(S.street==='river'&&tc>0&&!S.gloved){S.gloved=true;S.tellSeq=(S.tellSeq||0)+1;p.tell={cue:'glove',meaning:'none',truth:'none',street:'river',seq:S.tellSeq}}
      return{type:'call',state:'none'}};
    return}
  const sc=CFG.ch&&CFG.ch.script;if(!sc)return;
  if(CFG.ch.p2){p2Script(sc);return}
  if(sc==='badbeat'&&S.handNo===1){
    rig({'あなた':[C(14,'♠'),C(14,'♥')],'ハヤト':[C(9,'♦'),C(8,'♦')]},[C(13,'♦'),C(7,'♦'),C(2,'♣'),C(3,'♠'),C(6,'♦')]);
    S.autoMe=true;S.msg='AAが来た。……このハンドは自動で進みます';
    S.scriptAI=i=>{const p=S.players[i],tc=S.currentBet-p.bet;
      if(p.name==='ハヤト')return S.street==='preflop'&&S.currentBet<p.bet+p.chips?{type:'raise',to:p.bet+p.chips,state:'bluff'}:{type:'call',state:'none'};
      return tc>0?{type:'fold',state:'none'}:{type:'call',state:'none'}};
  }
  if(sc==='final'&&!S.finalRead&&S.handNo>=(S.finalNext||5)){
    S.finalHand=true;S.finalNext=S.handNo+3;
    dealOf59(FINAL_DEALS59[pickDeal59('7',3)],'ジン');
    S.scriptAI=i=>{const p=S.players[i],tc=S.currentBet-p.bet,pot=potTotal();
      if(S.street==='river'){
        if(!S.released){S.released=true;
          S.tellSeq=(S.tellSeq||0)+1;p.tell={cue:'release',meaning:'strong',truth:'strong',street:'river',seq:S.tellSeq};p.tellLog.push(p.tell);
          cutIn('ジン','……',true)}
        return tc>0?{type:'raise',to:p.bet+p.chips,state:'strong'}:{type:'raise',to:Math.min(p.bet+p.chips,Math.max(BB()*4,Math.round(pot/1000)*1000)),state:'strong'}}
      if(S.street==='turn'&&tc===0)return{type:'raise',to:Math.max(BB()*2,Math.round(pot/2/1000)*1000),state:'strong'};
      return{type:'call',state:'strong'}};
  }
}
// 第2・3・4・6章の回想。人の席は判断が一回だけ（reika は見るだけ）。それ以外は自動で進む
const cardOf=t=>C(+({A:14,K:13,Q:12,J:11,T:10}[t[0]]||t.slice(0,-1)),t.slice(-1));
function flashScript(F){
  const hands={};Object.keys(F.hands).forEach(n=>hands[n]=F.hands[n].map(cardOf));
  rig(hands,F.board.map(cardOf));
  S.msg=F.msg;S.autoMe=true;S.fbAsk=false;S.fbBet=false;
  const jin=S.players.find(p=>p.name==='若き日のジン');if(F.faceUp&&jin)jin.show=true;
  const st=F.choice||'river',cue=st==='flop'?'fast':st==='turn'?'still':'scar';
  S.scriptAI=i=>{const p=S.players[i],tc=S.currentBet-p.bet,pot=potTotal();
    if(p.name!=='若き日のジン')return{type:'call',state:'none'};
    if(S.street===st&&!S.fbBet){S.fbBet=true;
      S.tellSeq=(S.tellSeq||0)+1;p.tell={cue,meaning:'none',truth:'none',street:st,seq:S.tellSeq};
      if(!F.watch){S.autoMe=false;S.fbAsk=true}
      const to=st==='flop'?Math.min(p.bet+p.chips,S.currentBet+Math.max(BB(),Math.round(pot*.7/1000)*1000)):p.bet+p.chips;
      return{type:'raise',to,state:st==='river'?'bluff':'strong'}}
    return{type:'call',state:'none'}};
}
const TITLES=[
  {id:'folder',name:'降りる勇気',hint:'いい降り方を10回する',jin:'……数えていたのか。いい癖だ。'},
  {id:'ura8',name:'裏の卓の主',hint:'裏の卓で、誰か1人に8段で勝つ',jin:'……俺より強くなったかもしれんな。'},
  {id:'night',name:'朝まで',hint:'はしごで5つの卓を回りきる',jin:'朝まで勝ち続けたか。……若い頃の俺みたいだ。'},
  {id:'stars21',name:'全部の星',hint:'全部の章で星を3つずつ集める',jin:'……もう教えることはないな。'},
  {id:'twice',name:'二度めくり',hint:'2回めくって、両方とも勝つ',jin:'二度勝ったか。ツイている夜は、それでいい。'},
  {id:'soulread',name:'ソウルリード',hint:'読み宣言を5回当てる',jin:'手が見えるようになってきたな。'},
  {id:'seven2',name:'7-2で勝った',hint:'一番弱い手で勝つ',jin:'一番弱い手で勝ったか。店中が笑う夜だな。'},
  {id:'badbeat',name:'バッドビート',hint:'ターンまで勝っていたのに、最後の1枚で負ける',jin:'最後の一枚で負けたか。それもポーカーだ。'},
  {id:'aalose',name:'AAで負けた',hint:'最強の手札で負ける',jin:'AAでも負ける。だから面白い。'},
  {id:'cooler',name:'クーラー',hint:'フルハウス以上で負ける',jin:'あれは降りられん。運が悪かっただけだ。'},
  {id:'tankfold',name:'長考の末に降りた',hint:'じっくり15秒考えてから降りる',jin:'考え抜いて降りるのも、立派な一手だ。'},
  {id:'dry',name:'待てる者',hint:'8ハンド続けて、最初に降りる',jin:'来ない夜は来ない。待てる者が勝つ。'},
  {id:'onemore',name:'あとワンハンドだけ',hint:'ひとつの卓で30ハンド遊ぶ',jin:'……そろそろ終電だぞ。'},
  {id:'quads',name:'ナイスハンド',hint:'フォーカード以上で勝つ',jin:'見事だ。今夜の話題はお前だな。'},
  {id:'allin',name:'首の皮一枚',hint:'オールインして勝ち残る',jin:'首の皮一枚だな。だが生き残った。'},
  {id:'read',name:'ブラフを見抜いた',hint:'相手のブラフをコールして勝つ',jin:'見抜いたな。顔を見ていた甲斐があった。'},
  {id:'showbluff',name:'見せブラフ',hint:'降ろして勝ったブラフを相手に見せる',jin:'次からは、もう通じんぞ。'},
  {id:'seat',name:'いい席',hint:'荒い相手の左に座って勝つ',jin:'座った時点で、半分勝っている。'},
  {id:'misdeal',name:'ディーラーも人間',hint:'ディーラーのミスに立ち会う',jin:'慌てるな。慌てた奴から負ける。'},
  {id:'rules',name:'ルールに詳しい',hint:'フロアのクイズに5回正解する',jin:'ルールを知っている奴は、慌てない。'},
  {id:'kao',name:'顔なじみ',hint:'店の常連24人のページを、すべて開く',jin:'この街の客の顔は、もう覚えたな。'},
  {id:'port',name:'港の顔ぶれ',hint:'入港した船の客6人のページを、すべて開く',jin:'どこの港から来ても、卓に座れば同じ一人だ。'},
  {id:'regular',name:'常連',hint:'どこかの店で常連度★2になる',jin:'顔を覚えられるのは、悪いことじゃない。'},
  {id:'slowrolled',name:'スロウロールされた',hint:'わざとゆっくり手を見せられる',jin:'ああいう勝ち方をする奴は、いずれ客を失う。'},
  {id:'tiltwin',name:'熱くなった相手から取った',hint:'熱くなった相手に勝つ',jin:'冷めた方が勝つ。覚えておけ。'},
  {id:'gentle',name:'大人の対応',hint:'嫌な勝ち方をされても「ナイスハンド」と言う',jin:'それが一番効く。'},
  {id:'angle',name:'アングルを見た',hint:'ディーラーがずるい打ち方を止める',jin:'ルールは守る者の味方だ。'},
  {id:'mieta',name:'見えた',hint:'クセを読んで、3回当てる',jin:'顔を見ていれば、手は見える。'},
  {id:'realtell',name:'本物のテル',hint:'クロウの本当のクセが出たハンドで、クロウから取る',jin:'わざとじゃないクセは、隠せん。'},
  {id:'lastphrase',name:'最後の口癖',hint:'口癖がいつもと違う場面を、すべて見る',jin:'言えなくなった言葉にこそ、本音がある。'},
  {id:'altend',name:'もう一つの結末',hint:'最後のハンドで、降りずにコールする',jin:'……まだ半人前だな。'},
  {id:'bait',name:'わざと見せた',hint:'読まれたクセで、はじめて相手を引っかける',jin:'読ませてから、裏をかく。……覚えたな。'},
  {id:'leak',name:'穴を突く',hint:'相手の打ち方の穴を、2回突いて勝つ',jin:'……見つけたな。それが穴だ。'},
  {id:'clean',name:'無敗',hint:'一度も負けずに、第5〜7章のどれかをクリアする',jin:'負けを数えずに済んだか。上出来だ。'},
];
const TITLE_KEY='shisho-titles';