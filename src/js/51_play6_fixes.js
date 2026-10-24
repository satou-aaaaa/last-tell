/* ---------- 第6章「街一番のテーブル」のプレイ録画から（satou 2026-10-18 録画 2026-10-18 22-53-59.mp4） ----------
   satou さんのカード（2026-10-18）：4人で始めてクロウとの一騎打ちへ／全員30BB・ゆるめ／トーナメントだけ席は指定／強い手も配る／クイズはなくす。
   章の中身（4人・持ち点・ブラインド）は js/02_chapters.js。ここは動き：
   - ゴウ・カオルとクロウのオールインは、クロウが勝つように残りの場札を並べる（自分が降りている・いないときだけ。自分の勝負には触れない）
   - 二人が飛んでクロウと二人になったら、短い場面を挟んで一騎打ち。負けたら一騎打ちの頭からやり直せる
   - 第6章は、ときどき強い手（TT以上か AK）が来る。CPU は弱い手でレイズに付いていかず、強い手で3ベットする
   - クロウは、ほかの二人が残っているうちは、大きな賭けに勝ち目の薄い手で全部を賭けない */
// 守る相手：第6章はクロウ、第二部 第4章（第14章、王冠のトーナメント）はカイ（改善提案 第10回 §1 案A：第14章を第6章の形にそろえる）
function p6Boss(){if(typeof CFG==='undefined'||!CFG||!CFG.ch||CFG.flashback||CFG.ura||CFG.run)return null;
  if(CFG.ch.no===6&&!CFG.ch.p2)return 'クロウ';if(CFG.ch.p2===4)return 'カイ';return null}
const p6On=()=>!!p6Boss();
const p6Six=()=>p6Boss()==='クロウ';   // 第6章だけのもの（#18・#19）。強い手は第14章にも
const P6_HU=[
  ['クロダ','ゴウ様、カオル様が抜けられました。残りはお二人です。ここからはヘッズアップ、一対一です'],
  ['クロウ','……ようやく、二人きりですね'],
  ['ジン','ここからが本番だ。クロウのクセは、うのみにするな'],
];
const P14_HU=[
  ['クロダ','残りはお二人です。ここからはヘッズアップ、一対一です'],
  ['カイ','……やっと来たな。この前の続きだ'],
  ['師匠','速さに付き合うな。待てる者が、最後に残る'],
];
const P6_TXT={'クロウ':{hu:P6_HU,log:'残りは二人。クロウとの一騎打ち',hint:'クロウとの一騎打ちの頭から、やり直せます',msg:'クロウとの一騎打ちから'},
  'カイ':{hu:P14_HU,log:'残りは二人。カイとの一騎打ち',hint:'カイとの一騎打ちの頭から、やり直せます',msg:'カイとの一騎打ちから'}};
const p6T=k=>{const t=(P6_TXT[p6Boss()]||P6_TXT['クロウ'])[k];return I18N.lang==='en'&&typeof t==='string'?(EN_DICT[t]||t):t};
Object.assign(EN_DICT,{
  'ゴウ様、カオル様が抜けられました。残りはお二人です。ここからはヘッズアップ、一対一です':'Mr. Go and Ms. Kaoru are out. Two players remain. From here it is heads-up, one on one.',
  '……ようやく、二人きりですね':'...At last, just the two of us.',
  'ここからが本番だ。クロウのクセは、うのみにするな':'This is where it starts. Don\'t take Crow\'s tells at face value.',
  '一騎打ちからやり直す':'Retry from the heads-up',
  'クロウとの一騎打ちの頭から、やり直せます':'You can retry from the start of the heads-up with Crow.',
  'クロウとの一騎打ちから':'Heads-up with Crow',
  '残りはお二人です。ここからはヘッズアップ、一対一です':'Two players remain. From here it is heads-up, one on one.',
  '……やっと来たな。この前の続きだ':'...Finally. Let\'s finish what we started.',
  '速さに付き合うな。待てる者が、最後に残る':'Don\'t match his speed. The one who can wait is the one left standing.',
  'カイとの一騎打ちの頭から、やり直せます':'You can retry from the start of the heads-up with Kai.',
  'カイとの一騎打ちから':'Heads-up with Kai',
  '残りは二人。クロウとの一騎打ち':'Two left. Heads-up with Crow','残りは二人。カイとの一騎打ち':'Two left. Heads-up with Kai',
  'マック':'Muck','手を見せずに伏せた':'folded without showing',
  '先に選ぶ':'Pre-select',
});

// ===== #10〜13 クロウとゴウ・カオルのオールイン：残りの場札はクロウが勝つ並びに =====
// 場札を配る前（nextStreet:before）に、山の残りを並べ替える（1ハンドに1回）。
// 自分もオールインに入っているときは、自分とほかの人の勝ち負け（誰に勝って誰に負けるか）が元の並びと同じになる並びだけを使う＝自分の結果は変えない
function p6Board(deck){const d=deck.slice(),b=S.board.slice();while(b.length<5){d.pop();const n=b.length?1:3;for(let k=0;k<n;k++)b.push(d.pop())}return b}
// 呼ぶのは配りを変える入口（js/54_deal_mod.js の LT.dealMod('bossRunout','board',…)）。並べ替えたら true
function p6Runout(){
  if(!p6On()||S.p6hu||S.board.length>=5)return false;
  const live=S.players.filter(inHand),me=S.players[0],mine=live.includes(me),bs=live.find(p=>p.name===p6Boss());
  // 第14章：自分が降りた勝負で、カイが持ち点の半分以上を入れていれば、オールインでなくても次の札からカイが勝つ並びに（自分の結果には関わらない。
  // カイは自分から大きく打つので、オールインの前に決まることが多い。小さな勝負は並べ替えない＝カイが勝ちすぎない）
  const deep=!S.runout&&!mine&&!p6Six()&&bs&&bs.total>=bs.chips&&bs.chips<=BB()*15;   // 残りが少ない＝負ければ飛ぶときだけ（勝ちすぎて一騎打ちが重くならないように）
  if(deep){const k=S.handNo+':'+S.board.length;if(S.p6rig===k)return false;S.p6rig=k}
  else{if(!S.runout||S.p6rig===S.handNo)return false;S.p6rig=S.handNo}
  const cr=live.find(p=>p.name===p6Boss());if(!cr||live.filter(p=>!p.human).length<2)return false;
  const sg=x=>x>0?1:x<0?-1:0,meVs=b=>{const m=bestN(me.hand.concat(b));return live.filter(p=>p!==me).map(p=>sg(cmp(m,bestN(p.hand.concat(b))))).join()};
  const base=mine?meVs(p6Board(S.deck)):'';
  const won=d=>{const b=p6Board(d),c=bestN(cr.hand.concat(b));return live.every(p=>p===cr||p.human||cmp(c,bestN(p.hand.concat(b)))>0)&&(!mine||meVs(b)===base)};
  if(won(S.deck))return false;
  for(let t=0;t<400;t++){const d=shuffle(S.deck.slice());if(won(d)){S.deck=d;return true}}
  return false;
}

// ===== CPU の打ち方（第6章だけ） =====
function p6Cpu(i,d){
  if(!p6On()||!d||!S||!S.players)return d;
  const p=S.players[i],me=S.players[0],pre=S.street==='preflop',toCall=S.currentBet-p.bet,bb=BB();
  if(!p||p.human||!p.hand||p.hand.length!==2)return d;
  const stage1=!S.p6hu&&S.players.filter(q=>q.chips>0||q.allIn).length>2;
  // 守る相手（クロウ／カイ）：ほかの客が残っているうちは、大きな賭けに、勝ち目の薄い手で全部を賭けない（一騎打ちまで残る）
  if(p.name===p6Boss()&&stage1&&S.aggr!==i&&d.type!=='fold'&&toCall>0&&toCall>=p.chips*.5){
    const eq=equity(p.hand,S.board,S.players.filter(q=>q!==p&&inHand(q)).length,200);
    if(eq<.6){const f=Object.assign({},d,{type:'fold'});delete f.to;return f}}
  // 第14章のカイは自分から大きく打つ：持ち点の半分以上を賭ける・上げるのも、勝ち目6割からだけ（足りなければ、払える分で付くか降りる）
  // 自分が入っている勝負では7割5分から（自分に飛ばされて一騎打ちの前に消えることを減らす）。
  // 自分が降りた勝負の river は、相手の手に負けるなら大きく払わない（場札がもう並べ替えられないので）
  // 細ったカイ（10BB以下）は、自分が降りたあとの preflop で全部を押す（場札はカイが勝つ並び＝ほかの客から取り返す。ブラインドで細って自分に飛ばされるのを減らす）
  if(p.name===p6Boss()&&!p6Six()&&stage1&&pre&&!inHand(me)&&p.chips+p.bet<=bb*10&&p.chips>toCall)return Object.assign({},d,{type:'raise',to:p.bet+p.chips});
  const bossBig=p.name===p6Boss()&&!p6Six()&&stage1&&(d.type==='raise'?d.to-p.bet:d.type==='call'?toCall:0)>=p.chips*.5;
  if(bossBig&&!inHand(me)&&S.board.length>=5&&S.players.some(q=>q!==p&&inHand(q)&&cmp(bestN(q.hand.concat(S.board)),bestN(p.hand.concat(S.board)))>0)){
    const f=Object.assign({},d,{type:toCall>0?'fold':'call'});delete f.to;return f}
  if(bossBig&&(d.type==='raise'||inHand(me)&&S.aggr!==i)){
    const eq=equity(p.hand,S.board,S.players.filter(q=>q!==p&&inHand(q)).length,200);
    if(eq<(inHand(me)?.75:.6)){const f=Object.assign({},d,{type:toCall>0&&toCall<p.chips*.5?'call':toCall>0?'fold':'call'});delete f.to;return f}}
  if(!p6Six())return d;   // ここから下は第6章だけ
  // #18 めちゃくちゃな手で参加しない：レイズに、弱い2枚では付いていかない（ゴウは荒いので半分は付いていく）
  // 強いキャラ（クロウ・カオル）は、3BBまでのオープンには元の打ち方で守る（プロポーカー A1：降りすぎない）
  // v0.96.4：カオルもここで弱い2枚を8割捨てていたので、A1 の検査で降りる 81〜84% になっていた。25_cpu.js の A1 と同じ条件で外す
  const a1=styleOf(p),a1Def=a1.noLimp&&(a1.read||0)>=.6&&S.raises===1&&S.currentBet<=bb*3;
  if(pre&&d.type!=='fold'&&toCall>0&&S.currentBet>bb&&!a1Def&&preTier(p.hand)===0&&Math.random()>(p.name==='ゴウ'?.5:.2)){const f=Object.assign({},d,{type:'fold'});delete f.to;return f}
  // #19 強い手（AA〜77、AK・AQ・AJ、KQ）は、1回のレイズには3ベットで返す
  if(pre&&S.raises===1&&toCall>0&&d.type==='call'&&preTier(p.hand)===2&&p.chips>toCall*2&&Math.random()<.65){
    const half=bb/2,to=Math.min(p.bet+p.chips,Math.round(S.currentBet*3/half)*half);if(to>S.currentBet)return Object.assign({},d,{type:'raise',to})}
  return d}
{const _cd=cpuDecide;cpuDecide=function(i){const d=_cd(i);try{return p6Cpu(i,d)}catch(e){return d}}}

// ===== #16・#17 ときどき強い手（配りを変える入口 js/54_deal_mod.js から呼ぶ。配ったら true） =====
// 8ハンド強い手が来ていなければ、4割で山から TT 以上のペアか AK を選んで、自分の2枚と入れ替える
function p6Premium(){
  if(!p6On()||!S||!S.players)return false;const me=S.players[0];   // 第14章も（2026-10-19 コーディネーター経由：satou 10-17「全体を易しくしてよい」、前の第14章の勝率 約4割に戻す）
  if(!me||me.out||!me.hand||me.hand.length!==2)return false;   // v0.97.9：前は上の // の続きに入っていて効いていなかった
  if(preTier(me.hand)===2){S.p6prem=S.handNo;return false}
  const k14=!p6Six();if(S.handNo-(S.p6prem||0)<(k14?6:8)||LT.rand()>(k14?.5:.4))return false;   // 第14章は少し多め（6ハンドに5割。5人・30BB で前の第14章の勝率 約4割に戻す）
  const D=S.deck,c=[];for(let a=0;a<D.length;a++)for(let b=a+1;b<D.length;b++){const x=D[a],y=D[b];if((x.r===y.r&&x.r>=10)||(x.r+y.r===27&&Math.max(x.r,y.r)===14))c.push([a,b])}
  if(!c.length)return false;const [a,b]=c[Math.floor(LT.rand()*c.length)],old=me.hand;me.hand=[D[a],D[b]];D[a]=old[0];D[b]=old[1];S.p6prem=S.handNo;return true}

// ===== #13 二人になったら一騎打ち。#9 負けたら一騎打ちの頭から =====
{const _sh=startHand;startHand=function(){
  try{if(p6On()&&S&&S.players&&!S.p6hu&&!S.result&&!CFG.p6retry&&CFG.levels){
    const alive=S.players.filter(p=>p.chips>0);
    if(alive.length===2&&alive[0].human&&alive[1].name===p6Boss()){
      const lv=Math.min(CFG.levels.length-1,Math.floor(S.handNo/CFG.levelHands));
      S.p6hu=1;CFG.p6snap={me:alive[0].chips,crow:alive[1].chips,levels:CFG.levels.slice(lv)};
      const s0=S,ch=CFG.ch;nextvClear();log(P6_TXT[p6Boss()].log,true);
      return playScene(ch,P6_TXT[p6Boss()].hu,()=>{if(S!==s0)return;show('game');Sound.bgm(CFG.bgm||0);if(S.handOver&&!S.result)startHand()})}}}catch(e){}
  return _sh.apply(this,arguments)}}
function p6Retry(){
  try{lastWipe()}catch(e){}
  const ch=CFG.ch,sn=CFG.p6snap,bn=p6Boss(),me=S&&S.players&&S.players[0]&&S.players[0].name||'あなた',
    crow=ch.opps.find(o=>o.name===bn)||{name:bn,style:bn==='カイ'?'kai':'crow'};
  startGame(Object.assign({},CFG,{seats:[{name:me,chips:sn.me,human:true},Object.assign({},crow,{chips:sn.crow})],
    levels:sn.levels.slice(),blinds:sn.levels[0],beatsOn:false,beatPre:[],nanori:false,p6snap:sn,p6retry:1}));
  if(S){S.p6hu=1;S.msg=p6T('msg')}}
{const o=$('btnNext').onclick;$('btnNext').onclick=function(e){
  if(p6On()&&CFG.p6snap&&S&&S.result==='lose')return p6Retry();return o.call(this,e)}}

// ===== 画面の小さな直し（毎回の描画のあと） =====
LT.on('render',()=>{try{
  if(!S||!S.players||typeof CFG==='undefined'||!CFG)return;const en=I18N.lang==='en';
  // 負けたとき：一騎打ちからやり直せることを、ボタンと一行で
  if(p6On()&&CFG.p6snap&&S.handOver&&S.result==='lose'){const t=en?'Retry from the heads-up':'一騎打ちからやり直す';if($('btnNext').textContent!==t)$('btnNext').textContent=t;
    const h=$('betweenHint'),l=p6T('hint');if(h&&!h.textContent.includes(l))h.textContent=(h.textContent?h.textContent+'　':'')+l}
  // #27 トーナメントでは、自分のチップの横に BB の数
  if(CFG.levels){const c=$('mine')&&$('mine').querySelector('.chp');if(c){let b=$('mine').querySelector('.p6bb');const t=`${Math.floor(S.players[0].chips/BB())}BB`;
    if(!b){b=document.createElement('span');b.className='p6bb';c.after(b)}if(b.textContent!==t)b.textContent=t}}
  // #26 ショーダウンで手を見せずに伏せた人に「マック」と一言
  if(S.handOver)S.players.forEach(p=>{if(p.human||!p.mucked||p.folded||p.p6mk===S.handNo)return;p.p6mk=S.handNo;
    p.say={seq:(S.saySeq=(S.saySeq||0)+1)+9800,act:'',line:en?'Muck':'マック',sub:en?'folded without showing':'手を見せずに伏せた'};setTimeout(()=>{try{render()}catch(e){}},0)});
  // #34 台詞の記録：卓で出た台詞を「ハンドの記録」に残す
  S.players.forEach(p=>{const s=p.say;if(!s||!s.line||p.human||s.p6log)return;s.p6log=1;
    const n=typeof who==='function'?who(p.name):p.name;log(`${n}「${s.line}」`)});
}catch(e){}});
// #35 掛け合いで、誰に話しているか（js/35_say_keep.js の bSay から呼ぶ）。相手がひとりのときだけ「→ ○○へ」
function btTo(lines,n){const o=[...new Set(lines.map(l=>l[0]).filter(x=>x&&x!==n))];if(o.length!==1)return'';
  const q=S.players.find(p=>p.name===o[0]);if(!q)return'';const w=typeof who==='function'?who(q.name):q.name;return I18N.lang==='en'?`→ to ${w}`:`→ ${w}へ`}

// ===== #33 相手のオールインは、次の人が動く前に一拍おく（気づいたらオールインしていた） =====
LT.on('act:before',(i,type,to)=>{try{const p=S.players[i];if(!p||p.human||S.handOver||i!==S.toAct)return;
  if(type==='raise'&&Math.min(to,p.bet+p.chips)>=p.bet+p.chips||type==='call'&&S.currentBet-p.bet>=p.chips)S.hold=Math.max(S.hold||0,900*SPEED())}catch(e){}});

// ===== #32 噂：章の最初のハンドで、聞いた噂を一つだけ思い出させる =====
LT.on('startHand',()=>{try{if(!S||S.handNo!==1||typeof CFG==='undefined'||!CFG||!CFG.ch||CFG.ch.p2||CFG.flashback||CFG.ura||CFG.run||CFG.p6retry||CFG.ch.no<4)return;
  const boss=CFG.ch.opps[0].name,h=(loadRumor()[boss]||[]);if(!h.length)return;const t=h[Math.floor(Math.random()*h.length)];
  jinNote(I18N.lang==='en'?`What you heard: “${(EN_DICT[t]||t)}” Check it with your own eyes.`:`聞いた噂：「${t}」。本当かどうかは、自分の目で確かめろ`,0)}catch(e){}});

// ===== #42 ルールクイズはなくす（satou のカード）。店のルールはディーラーの一言とジンの説明で =====
SETTINGS.quiz=false;   // askQuiz は quizReady が偽ならすぐ先へ進む（js/09_live_extra.js）
{const b=$('btnQuiz'),r=b&&b.closest('.setrow');if(r)r.hidden=true;else if(b)b.hidden=true}

// ===== #49 テーブルを叩く手：ゴウは拳ではなく指の節で軽く =====
if(typeof CHECK_STYLE!=='undefined'&&CHECK_STYLE['ゴウ'])CHECK_STYLE['ゴウ']={k:'knuckle',n:1};

// ===== #24 の続き：手札を表にしたので、額を選ぶ枠が自分の札の上にかぶるとき（縦・PC）は、枠の中に小さく自分の2枚を出す =====
// 枠の下に隠れた札は見えないまま重ねず、隠しておく（枠を閉じれば戻る）
function p6RaiseHand(){const P=$('raisePanel'),M=$('mine');if(!P||!M)return;
  const open=!P.hidden&&!!P.offsetParent;let box=$('p6hand');
  const cs=[...M.querySelectorAll('.card')].filter(c=>!c.classList.contains('back')&&c.offsetParent);
  let under=false;if(open&&cs.length){const pr=P.getBoundingClientRect();under=cs.some(c=>{const r=c.getBoundingClientRect(),w=Math.min(r.right,pr.right)-Math.max(r.left,pr.left),h=Math.min(r.bottom,pr.bottom)-Math.max(r.top,pr.top);if(w>0&&h>0&&w*h>r.width*r.height*.3)return true;const x=r.left+r.width/2,y=r.top+r.height/2,t=document.elementFromPoint(x,y);return !!t&&P.contains(t)||(x>pr.left&&x<pr.right&&y>pr.top&&y<pr.bottom)})}
  M.classList.toggle('p6under',under);
  if(!under){if(box)box.hidden=true;return}
  const me=S.players[0];if(!me||!me.hand||!me.hand.length){if(box)box.hidden=true;return}
  if(!box){box=document.createElement('div');box.id='p6hand';box.className='p6hand';const row=P.querySelector('.amtrow');(row||P).before(box)}
  const lab=I18N.lang==='en'?'Your hand':'あなたの手';
  const html=`<small>${esc(lab)}</small>`+me.hand.map(c=>`<span class="p6c${c.s===1||c.s===2?' red':''}" aria-label="${esc(cardStr(c))}">${esc(rankStr(c.r))}${SUITS[c.s]}</span>`).join('');
  if(box.innerHTML!==html)box.innerHTML=html;box.hidden=false}
LT.on('render',()=>{try{p6RaiseHand()}catch(e){}});
{const b=$('btnRaise');if(b)b.addEventListener('click',()=>{setTimeout(()=>{try{p6RaiseHand()}catch(e){}},0);setTimeout(()=>{try{p6RaiseHand()}catch(e){}},350)})}
