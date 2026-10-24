/* ---------- あるある称号（勝ち負けには関係しない） ---------- */
/* ---------- マナーの悪い相手（第5章以降とフリー対戦だけ。第1〜4章の勝負には出さない） ---------- */
const MANNERS={
  'ハヤト':{slowroll:.8,angles:['faketap','onechip'],angleRate:.12,gloat:true,tilt:{bluff:.3,margin:-.06,hands:4}},
  'ゴウ':{slowroll:.6,angles:['faketap','onechip'],angleRate:.15,gloat:true,tilt:{bluff:.3,margin:-.06,hands:4}},
};
const mannerOf=p=>{const m=p&&!p.human&&!(CFG.ch&&CFG.ch.no<=4)?MANNERS[p.name]||null:null;return m&&p.name==='ハヤト'&&uraRule('ハヤト')?{...m,slowroll:1,tilt:{...m.tilt,hands:0}}:m};
const styleOf=p=>{const m=mannerOf(p);return m&&p.tilt>0?{...p.style,bluff:m.tilt.bluff,margin:m.tilt.margin}:p.style};
// keep：1回だけの教えの台詞（セーブに「見た」と残すもの）。そのハンドのうちは、あとから来た別の台詞で上書きしない（後の台詞は次のハンドへ回す）
// v0.98.9 CI：第4章で「〇〇だけ」の師匠のひとことが、同じ描き直しの中で別の台詞に上書きされ、見たことになったのに一度も出なかった
const jinNote=(t,hands,keep)=>{const c=S.jinNote;if(c&&c.keep&&c.t!==t&&S.handNo<=c.until){S.jinNoteNext={t,hands};return}S.jinNote={t,until:S.handNo+(hands||0),keep:!!keep}};
LT.on('startHand',()=>{try{const n=S.jinNoteNext;if(!n)return;S.jinNoteNext=null;if(S.jinNote&&S.jinNote.keep&&S.handNo<=S.jinNote.until)return;S.jinNote={t:n.t,until:S.handNo+(n.hands||0),keep:false}}catch(e){}});
const MANNER_KEY='shisho-manners';
function bumpNice(){let n=0;try{n=+(JSON.parse(localStorage.getItem(MANNER_KEY))||{}).nice||0}catch(e){}n++;try{localStorage.setItem(MANNER_KEY,JSON.stringify({v:1,nice:n}))}catch(e){}return n}
// 煽られたあとの返し：「無視する」「ナイスハンド」。押さなくても進む
function taunt(p,kind){
  const line=lineFor(p.name,kind);if(!line)return;
  p.say={seq:(S.saySeq=(S.saySeq||0)+1)+1000,act:'',line};
  S.taunt=S.players.indexOf(p);
}
function renderTaunt(){
  $('showBox').hidden=!(S.handOver&&S.showOffer&&!S.result);
  const box=$('tauntBox');if(!box)return;
  const on=S.handOver&&S.taunt>0&&!S.result;box.hidden=!on;
}
// ディーラーがアングルショットを止める
function angleCall(i,kind){
  const p=S.players[i];
  p.say={seq:(S.saySeq=(S.saySeq||0)+1),line:lineFor(p.name,kind==='faketap'?'angleTap':'angleChip'),talk:true};render();
  if(kind==='onechip'&&!reducedMotion()){
    const src=$('spot'+i)&&$('spot'+i).querySelector('.mystack'),to=potRect(),tb=$('table').getBoundingClientRect();
    if(src&&to){const r=src.getBoundingClientRect();const el=document.createElement('div');el.className='potfly';el.innerHTML=chipStack(100000,false);
      el.style.left=(r.left+r.width/2-tb.left)+'px';el.style.top=(r.top+r.height/2-tb.top)+'px';$('table').appendChild(el);
      LT.anim(el,[{transform:'translate(-50%,-50%)'},{transform:`translate(calc(-50% + ${(to.left-r.left)*.45}px),calc(-50% + ${(to.top-r.top)*.45}px))`,opacity:.2}],{duration:700*SPEED(),fill:'forwards'},()=>el.remove())}
  }
}
function angleRuling(i,kind){
  const p=S.players[i];
  dealerSay(kind==='faketap'?'テーブルを叩いたので、チェックです':'宣言がないので、コールです');
  log(kind==='faketap'?'ディーラー：ライブでは、テーブルを叩くとチェック。取り消せない':'ディーラー：黙って大きいチップを1枚出すと、コール扱い');
  if(!S.angleSeen){S.angleSeen=true;jinNote('ああいうのを「アングル」と言う。ルールのすき間を使う打ち方だ',1)}
  if(!S.players[0].folded)grantTitle('angle');
  setTimeout(()=>{if(S.players[i]===p){p.say={seq:(S.saySeq=(S.saySeq||0)+1),line:lineFor(p.name,'caught'),talk:true};render()}},700*SPEED());
}