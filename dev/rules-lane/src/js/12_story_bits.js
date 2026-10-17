/* ---------- ストーリー系の要素：負けたときの一言・次回予告・名乗り・見えた・回想・ノート・後日談 ---------- */
const STORY_KEY='shisho-story';
function loadStory(){const o=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
  try{const t=JSON.parse(localStorage.getItem(STORY_KEY))||{};return{loses:o(t.loses),brk:o(t.brk),ep:o(t.ep),mieta:+t.mieta||0,alt:!!t.alt,il:o(t.il),deal:o(t.deal),bt:o(t.bt),tempt:t.tempt==='refuse'||t.tempt==='silent'?t.tempt:undefined}}catch(e){return{loses:{},brk:{},ep:{},mieta:0,alt:false,il:{},deal:{},bt:{}}}}
function saveStory(t){try{localStorage.setItem(STORY_KEY,JSON.stringify({v:1,...t}))}catch(e){}}
// 口癖がいつもと違う場面（全部見ると称号）
const BREAKS=['hero','jin','hayato','crow','gen','roku','seki','reika','sou','hal','mina','tenshu'];
function noteBreak(id){const t=loadStory();if(t.brk[id])return;t.brk[id]=1;saveStory(t);
  if(BREAKS.every(b=>t.brk[b]))grantTitle('lastphrase')}
// 負けたときのジンの一言（同じ章で負けた回数で変わる。難しさは変えない）
function loseLine(ch){
  const t=loadStory();const n=(+t.loses[ch.no]||0);
  if(ch.p2)return mentorName()+'「'+ch.lose+'」';
  if(n<=1)return'ジン「'+ch.lose+'」';
  if(n===2)return'ジン「負けを数えるな。降りた数を数えろ」';
  if(n===3)return'ジン「3回目か。顔に出てるぞ。……'+ch.lose+'」';
  return['店主「腹が減ってちゃ勝てないよ。カレー、温めとくね」','ジン「'+ch.lose+'」','ジン「負けを数えるな。降りた数を数えろ」'][n%3];
}
// 次回予告
const PREVIEW={
  2:{boss:'ロク',sign:'銀の扉',line:'……ジン。生きていたのか'},
  3:{boss:'セキ',sign:'月影',line:'君の弟子なら、紳士的に勝負しよう'},
  4:{boss:'レイカ',sign:'天空',line:'嘘かどうかなんて、顔を見たってわからないわよ'},
  5:{boss:'ハヤト',sign:'地下の賭場跡',line:'……ジンさん。15年ぶりですね'},
  6:{boss:'クロウ',sign:'王冠',line:'看板をお持ちですね。拝見しましょう'},
  7:{boss:'ジン',sign:'錨亭、閉店後',line:'15年ぶりだ。……卒業試験をやる'},
};
// ボスの名乗り
const NANORI={'ゲン':'港の酔客','ロク':'銀の扉の主','セキ':'月影の老紳士','レイカ':'天空のディーラー','ハヤト':'ジンの元一番弟子','クロウ':'王冠の主','ジン':'師匠'};
function showNanori(name,done){
  const v=$('vs');v.innerHTML=`<div class="nanori" role="button" tabindex="0" aria-label="${esc(NANORI[name]+' '+name)}"><div class="nava">${avatar(name,'confident')}</div>
    <div class="ntxt"><span>${esc(NANORI[name])}</span><b>${esc(name)}</b></div></div>`;
  v.hidden=false;let fin=false;const go=()=>{if(fin)return;fin=true;done()};
  v.querySelector('.nanori').onclick=go;setTimeout(go,(reducedMotion()?1400:2100)*SPEED());
}
// ===== 案3：同じ誘い（第6章、ブラインドが2回目に上がる前の休憩。チップや相手の打ち方は変えない） =====
const TEMPT={ask:"クロウの誘いに、どう答える？",intro:[['',"ブラインドが上がる前の短い休憩。クロウが、あなたの席の横に立った。"],['クロウ',"いい打ち方です。……王冠の卓に、座ってみませんか"],['',"15年前、ハヤトが聞いたのと同じ言葉だった。"],['クロウ',"それから、もう一つ。ジンのクセを、教えてさしあげましょうか。15年前から、私は知っています"],['クロウ',"卒業試験があるのでしょう。答えを知っていれば、楽になりますよ"]],
  choices:[{id:'refuse',label:"断る",lines:[['クロウ',"……そうですか。今夜は、断られてばかりです"],['クロウ',"15年前、同じ卓で、断れなかった若者がいました"]]},{id:'silent',label:"黙っている",lines:[['',"あなたは何も言わず、チップをそろえた。"],['クロウ',"答えないのも、答えです。……ジンに似てきましたね"]]}]};
function temptPick(id){if(!SC)return;const c=TEMPT.choices.find(x=>x.id===id)||TEMPT.choices[1];const t=loadStory();t.tempt=c.id;saveStory(t);
  if(S)S.temptPicked=c.id;SC.picked=c.id;const i=SC.i;SC.lines=SC.lines.slice(0,i+1).concat(c.lines,SC.lines.slice(i+1));SC.i++;renderLine()}
// 第7章の頭：誘いの答えと違う行は飛ばす（記録がなければ、どちらも出ない）
const lineOff=l=>Array.isArray(l)&&l[2]&&l[2].tempt&&l[2].tempt!==loadStory().tempt;
function ilSeen(n){const t=loadStory();if(!t.il[n]){t.il[n]=1;saveStory(t)}}
function ilNote(){const t=loadStory(),ks=Object.keys(INTERLUDE).filter(n=>t.il[n]);if(!ks.length)return'';
  return`<article class="rcard ilnote"><h4>そのころ</h4><p class="exnote">章のあとで見た幕間を、もう一度見られます。</p><div class="ilbtns">${ks.map(n=>`<button class="mini" data-il="${n}"><span>第${n}章のあと</span><span>${esc(INTERLUDE[n].place)}</span></button>`).join('')}</div></article>`}
{const _sh=startHand;startHand=function(){
  if(typeof CFG!=='undefined'&&CFG&&CFG.ch&&CFG.ch.no===6&&!CFG.ura&&!CFG.run&&!CFG.flashback&&CFG.levels&&CFG.levelHands&&S&&S.players&&!S.tempted&&!S.result&&S.handNo===CFG.levelHands*2&&S.players[0].chips>0){
    S.tempted=true;const s0=S,ch=CFG.ch;nextvClear();
    return playScene(ch,TEMPT.intro.concat([{choice:'tempt'}]),()=>{
      if(!s0.temptPicked){const t=loadStory();t.tempt='silent';saveStory(t)}
      if(S!==s0)return;show('game');Sound.bgm(CFG.bgm||0);if(S.handOver&&!S.result)startHand()})}
  return _sh.apply(this,arguments)}}
// ===== 案5：観客席の一言（第6章だけ。隣の卓の声と同じ出し方で、ハンドは止めない。各1回） =====
const AUD={gen:["ゲン","よし！……いや、俺は何もしてねえけどな"],seki:["セキ","ここからだよ。降りられるかね、君は"],reika:["レイカ","指を見なさい。顔じゃなくて"]};
function audTick(){
  if(!S||!S.players||typeof CFG==='undefined'||!CFG||!CFG.ch||CFG.ch.no!==6||CFG.ura||CFG.run||CFG.flashback||S.result)return;
  const me=S.players[0];if(!me||me.chips<=0)return;
  const A=S.aud=S.aud||{q:[],done:{}},push=k=>{if(!A.done[k]){A.done[k]=1;A.q.push(k)}};
  if(S.players.some(p=>!p.human&&p.chips<=0))push('gen');
  const live=S.players.filter(p=>p.chips>0),hu=live.length===2&&live.some(p=>p.name==='クロウ');
  if(hu)push('seki');
  const dealt=S.players.filter(p=>p.hand&&p.hand.length===2),tot=S.players.reduce((a,p)=>a+p.chips,0),pot=S.players.reduce((a,p)=>a+(p.total||0),0);
  if(hu&&dealt.length===2&&pot*3>tot)push('reika');
  if(!A.q.length)return;
  S.nvNext=Math.max(S.nvNext==null?0:S.nvNext,S.handNo+3);
  const s0=S,h0=S.handNo;let n=0;
  const go=()=>{if(S!==s0)return;if(S.handNo!==h0||!S.handOver||S.result)return;
    if(nvBlocked()){if(++n<5)setTimeout(go,700*SPEED());return}
    const k=A.q.shift();if(!k)return;const [w,t]=AUD[k];
    audTick.on=1;try{nextvShow('cheer',`${w}「${t}」`)}finally{audTick.on=0}};
  setTimeout(go,1200*SPEED())}
{const _nt=nextvTick;nextvTick=function(){try{audTick()}catch(e){}return _nt.apply(this,arguments)}}
// 見出し：観客席の一言のときだけ「観客席」、ほかの声はいつもの NEXT TABLE（あとから出た隣の卓の声に見出しが残らないように）
{const _nv=nextvShow;nextvShow=function(){const sp=$('nextv')&&$('nextv').querySelector('span');if(sp)sp.textContent=audTick.on?'観客席':'NEXT TABLE';return _nv.apply(this,arguments)}}
// ===== 第二部の準備：第一部の打ち方の記録（画面には出さない。ストーリーの勝負だけ数える） =====
const STYLE_KEY='shisho-style';
function loadStyle(){const z={hands:0,vpip:0,pfr:0,folds:0,foldFacingBet:0,bluffs:0,readBy:{size:0,time:0,body:0}};
  try{const o=JSON.parse(localStorage.getItem(STYLE_KEY));if(!o||typeof o!=='object')return z;
    ['hands','vpip','pfr','folds','foldFacingBet','bluffs'].forEach(k=>{z[k]=Math.max(0,+o[k]||0)});
    const r=o.readBy&&typeof o.readBy==='object'?o.readBy:{};['size','time','body'].forEach(k=>{z.readBy[k]=Math.max(0,+r[k]||0)});return z}catch(e){return z}}
function saveStyle(o){try{localStorage.setItem(STYLE_KEY,JSON.stringify({v:1,...o}))}catch(e){}}
const styleOn=()=>typeof CFG!=='undefined'&&!!CFG&&!!CFG.ch&&!CFG.ura&&!CFG.run&&!CFG.flashback&&!CFG.store&&!!S&&!S.scriptAI&&!S.autoMe&&CFG.ch.no>=1&&CFG.ch.no<=7;
{const _act=act;act=function(i,type,to){
  try{if(S&&!S.handOver&&i===0&&i===S.toAct&&S.players[0].human&&styleOn()){const p=S.players[0],tc=S.currentBet-p.bet;
    const H=S.styH=S.styH&&S.styH.hand===S.handNo?S.styH:{hand:S.handNo},t=type==='raise'&&p.acted?'call':type;
    if(S.street==='preflop'){if(t==='raise'){H.vp=1;H.pr=1}else if(t==='call'&&tc>0)H.vp=1}
    if(t==='raise')H.rz=1;if(t==='fold'){H.fd=1;if(tc>0)H.ffb=1}}}catch(e){}
  return _act.apply(this,arguments)}}
{const _eh=endHand;endHand=function(){const r=_eh.apply(this,arguments);
  try{const me=S&&S.players&&S.players[0];if(me&&me.human&&styleOn()&&me.hand&&me.hand.length===2&&S.styDone!==S.handNo){S.styDone=S.handNo;
    const H=S.styH&&S.styH.hand===S.handNo?S.styH:{},o=loadStyle();o.hands++;if(H.vp)o.vpip++;if(H.pr)o.pfr++;if(H.fd)o.folds++;if(H.ffb)o.foldFacingBet++;
    if(H.rz&&!me.folded){const cs=me.hand.concat(S.board||[]);if((cs.length>=5?bestN(cs)[0]:groupCat(cs))<1)o.bluffs++}
    saveStyle(o)}}catch(e){}
  return r}}
{const _rs=readSeq;readSeq=function(i,rd){try{const k=rd&&{size:'size',fast:'time',slow:'time',body:'body'}[rd.why];if(k&&styleOn()){const o=loadStyle();o.readBy[k]++;saveStyle(o)}}catch(e){}return _rs.apply(this,arguments)}}
window.__style=()=>{const o=loadStyle(),hit={};try{const b=loadRead().byName;Object.keys(b).forEach(k=>{if(+b[k].h)hit[k]=+b[k].h})}catch(e){}return{...o,readHitBy:hit}};
// 後日談（第7章クリア後、錨亭の壁の前で）
const EPILOGUE=[
  'ゲンは今も毎晩来て、毎晩笑って帰る。最近は、ときどき降りるようになった。',
  'ロクは、銀の扉にジンの席を一つ空けている。',
  'セキは月影で一度だけ、大きなブラフを打ったらしい。',
  'レイカは、ソウに「半人前」という言葉を一度も使わない。',
  'クロウは、王冠の看板を一枚、自分の手で下ろした。',
  "最近、錨亭に新しい客が来る。『もうワンハンドだけ』が口ぐせの、心配性の男だ。",
];
// 第7章で降りずにコールしたとき：短いもう一つの結末
const ALT_END=[
  ['ジン','……コールしたか'],
  ['','ジンが手を開いた。7のスリーカード。'],
  ['ジン','傷から手を離したのは、本物だ。見えていたはずだがな'],
  ['','ジンが笑った。15年ぶりに見る、楽しそうな顔だった。'],
  ['ジン','まだ半人前だな'],
  ['ジン','もう一度だ。座れ'],
];
// 店で遊ぶたびに開く、キャラの後日談（need：クリアが必要な章）
const AFTER={
  1:[{need:1,lines:[['ゲン','その錨、大事にしろよ。……いや、別に惜しくなんかねえよ'],['ゲン','俺はな、昔は船に乗ってたんだ。腰をやって降りた日に、ここの店主があの錨を壁に掛けてくれてよ'],['店主','腹が減ってちゃ勝てないよ。ほら、カレー']]},
     {need:7,lines:[['','ゲンが、配られた札をじっと見ている。'],['ゲン','……今日は見送りだ',{brk:'gen'}],['店主','ゲンさんが降りた！？'],['ゲン','がっはっは！ジンさんの真似だよ。降りるのも勝負のうち、だろ！']]},
     {need:7,lines:[['ゲン','15年間、毎晩ジンさんの隣で飲んでたんだ。カードの話は、一回もしなかった'],['ゲン','やっと、カードを持つジンさんが見られた。……ありがとな、新入り']]}],
  2:[{need:2,lines:[['ロク','その鍵は、昔チームで使っていた倉庫の鍵だ'],['ロク','中身はもう空だ。……あいつが消えた日から']]},
     {need:2,lines:[['ハル','その席、座っていいですか？あなたの座り方、真似してるんです'],['ハル','この席、勝てる気が……あ、あなたの席でした',{brk:'hal'}],['ロク','……ハル。手札ばかり見るな'],['ハル','ロクおじさん、うるさい！']]},
     {need:7,lines:[['ロク','ジンが錨亭で、またカードを配っているらしいな'],['ロク','……今度、数えずに会いに行く']]}],
  3:[{need:3,lines:[['セキ','そのコインはね、あの日、観客席で握りしめていたものだ'],['セキ','ジン君が読まれていると気づいたのに、私は黙っていた。確証がなくてね。……十五年、そのままだ']]},
     {need:3,lines:[['ミナ','セキさん、また降りたでしょ。この曲が終わるまでに、一回くらい勝負してよ'],['セキ','降りるのも紳士のたしなみだよ'],['ミナ','それ、ジンさんの言葉の言い換えでしょ。知ってるんだから']]},
     {need:6,lines:[['セキ','今夜は、たしなみを忘れることにしよう',{brk:'seki'}],['','セキが、生まれて初めて大きなブラフを打った。相手は降りた。'],['ミナ','この曲、セキさんにあげる',{brk:'mina'}],['セキ','……君のおかげだね']]}],
  4:[{need:4,lines:[['レイカ','その羽、王冠を辞めた日に、自分で切った髪飾りなの'],['レイカ','15年前、わたしは王冠の見習いディーラーだった。あの日の決勝卓を配ったのは、わたし']]},
     {need:4,lines:[['ソウ','レイカさん、僕のこと「半人前」って一度も言わないんです'],['レイカ','言わないわ。言われた人がどうなるか、見てきたから']]},
     {need:7,lines:[['レイカ','ジンさんの最後のクセ、本物だったのね'],['レイカ','……読まれたのね、ジンさん。あの日、わたしに読めたのは、あなたの指だけだった',{brk:'reika'}]]}],
  5:[{need:5,lines:[['ハヤト','二代目か。……座れよ'],['ハヤト','そのチップ、ジンさんに初めてもらったものだ。15年、手放せなかった']]},
     {need:5,lines:[['ハヤト','王冠に行くんだろ。……クロウの手袋の指先を、見ておけ'],['ハヤト','あいつが本当に迷ったときだけ、そこに触る。俺が言えるのは、それだけだ']]},
     {need:7,lines:[['ハヤト',"クロウに誘われただろ。……俺は、断れなかった"],['ハヤト','錨亭の席、まだ空いてるか。……いや、いい。自分で聞きに行く']]}],
  6:[{need:6,lines:[['クロウ','また来てくださいましたか。拝見しましょう'],['クロウ','私の手袋のこと、気づきましたか。……あの日も、私は指先を直していました']]},
     {need:7,lines:[['クロウ','ソウ君にまた断られました。断られるのにも、慣れてきました'],['クロウ','……ジンに、よろしくお伝えください']]}],
  7:[{need:7,lines:[['ジン','座れ。今日は教えん。ただ打つだけだ'],['店主','あんたたち、楽しそうだね']]}],
};
function nextAfter(no){const list=AFTER[no]||[],t=loadStory(),cl=loadCleared();
  for(let k=0;k<list.length;k++){const id=no+'-'+k;if(!t.ep[id]&&list[k].need<=cl)return{id,lines:list[k].lines}}return null}
// 「見えた」：クセを読んで当てた瞬間
function mieta(name,cue,big){
  if(typeof CFG!=='undefined'&&CFG&&CFG.flashback)return;
  if(S)S.lastMieta=S.handNo;const t=loadStory();t.mieta++;saveStory(t);if(t.mieta>=3)grantTitle('mieta');
  const el=$('mieta');el.className='mieta'+(big?' big':'');
  el.innerHTML=`${big?`<div class="mava">${avatar(name)}</div>`:''}<div class="mtx"><b>見えた</b><span>${esc(name)}の「${esc(CUE_LABEL[cue]||'')}」</span></div>`;
  el.hidden=false;void el.offsetWidth;el.classList.add('go');Sound.sfx&&Sound.sfx('card');
  clearTimeout(mieta.t);mieta.t=setTimeout(()=>{el.hidden=true},(big?2600:1500)*(reducedMotion()?.7:1));
}
/* 回想：あの日を、全員の席から打つ。jin は第5章（15年前のジンとして、クロウとの最後のハンド）。
   ほかは第2・3・4・6章の章末。どれも結末は決まっていて、勝敗・称号・記録には数えない */
const FLASH={
 roku:{title:'15年前　王冠の控え室',seats:[{name:'ロク',chips:80000,human:true},{name:'若き日のジン',chips:80000}],
   hands:{'ロク':['Q♠','Q♦'],'若き日のジン':['A♦','K♥']},board:['K♣','7♦','2♠','9♣','4♥'],
   choice:'flop',msg:'ロクとして打つ。降りても、受けてもいい',end:'ロクは、何も言わなかった'},
 seki:{title:'15年前　王冠の看板戦・準決勝',seats:[{name:'セキ',chips:60000,human:true},{name:'若き日のジン',chips:80000}],
   hands:{'セキ':['A♥','J♥'],'若き日のジン':['9♦','4♦']},board:['A♣','9♠','4♥','6♠','2♣'],
   choice:'turn',msg:'セキとして打つ。降りても、受けてもいい',end:'セキの、あの日はここで終わった'},
 reika:{title:'15年前　決勝の最後の一手（ディーラー席から）',seats:[{name:'クロウ',chips:100000,human:true},{name:'若き日のジン',chips:80000}],
   watch:true,faceUp:true,msg:'レイカとして配る。ジンの指を見ていればいい',end:'誰かが、答えを教えている'},
 crow:{title:'15年前　決勝の最後の一手（クロウの席から）',seats:[{name:'クロウ',chips:100000,human:true},{name:'若き日のジン',chips:80000}],
   choice:'river',crowCall:true,msg:'クロウとして打つ。答えは、もう知っている',end:'勝ったのに、勝っていなかった'},
};
// あの日の最後の一手は一つだけ。レイカとクロウの席からも、第5章と同じカード
FLASH.reika.hands=FLASH.crow.hands={'若き日のジン':['Q♠','J♠'],'クロウ':['9♥','9♣']};
FLASH.reika.board=FLASH.crow.board=['A♠','7♠','2♦','4♣','K♥'];
const FLASH_CROW_FOLD=['','降りようとした手を、クロウ自身が止めた。答えを知っている勝負から、降りることはできなかった。'];
const flashId=()=>typeof CFG!=='undefined'&&CFG&&CFG.flashback?(FLASH[CFG.flash]?CFG.flash:'jin'):'';
const flashOf=()=>{const id=flashId();return id&&id!=='jin'?FLASH[id]:null};
function startFlashback(done,id){
  const F=FLASH[id];
  if(!F){
    startGame({ch:null,flashback:true,flash:'jin',onDone:done,title:'15年前　王冠・看板戦の決勝卓',blinds:[1000,2000],goal:{type:'flash'},hint:null,refill:false,tells:false,house:null,lamp:'#c9a0ff',bgm:6,lore:'',
      seats:[{name:'若き日のジン',chips:80000,human:true},{name:'クロウ',style:'crow',chips:100000,label:'王冠の主'}]});
    return}
  startGame({ch:null,flashback:true,flash:id,onDone:done,title:F.title,blinds:[1000,2000],goal:{type:'flash'},hint:null,refill:false,tells:false,house:null,lamp:'#c9a0ff',bgm:6,lore:'',
    seats:F.seats.map(x=>Object.assign({},x))});
}
function flashTo(){const me=S.players[0],pot=potTotal();
  if(S.street==='river')return me.bet+me.chips;
  if(S.street==='preflop')return Math.min(me.bet+me.chips,BB()*3);
  return Math.min(me.bet+me.chips,S.currentBet+Math.max(BB(),Math.round(pot*.6/1000)*1000))}
/* ジンのノート */
const PROFILE={
  'ジン':{ph:'降りるのも勝負のうちだ',ch:1,lines:[[1,'錨亭で飲んでいる老人。「昔、少しだけカードをやっていた」'],[2,'15年前に、突然姿を消した。ロクの昔の相棒'],[4,'傷に触れるのは、迷っているとき。触れないときは、迷いがない'],[5,'顎の傷は20年前、少年のハヤトをかばってできた'],[5,'クセを漏らしたのがハヤトだと、あの日のうちに気づいていた'],[6,'あの日、ブラフを降りずに負けた。降りることを教えたのは、自分にできなかったからだ'],[7,'最後のクセは本物だった。強い手のとき、傷から手を離す']]},
  'ゲン':{ph:'配られた札は全部勝負！',ch:1,lines:[[1,'港の酔客。毎晩負けて、毎晩笑って帰る'],[1,'元漁師。腰を痛めて船を降りた。錨のお守りは、その日に店主が壁に掛けてくれたもの'],[7,'15年間、毎晩錨亭でジンの隣に座っていた']]},
  '店主':{ph:'腹が減ってちゃ勝てないよ',ch:1,lines:[[1,'錨亭の女主人。名物はカレー。ジンを叱れる、ただ一人の人'],[7,'15年前、行き場のなくなったジンを、何も聞かずに錨亭に置いた']]},
  'ロク':{ph:'……数えてから言え',ch:2,lines:[[2,'銀の扉の主。15年前、ジンの相棒だった'],[2,'チームの金庫番。鍵のお守りは、昔の倉庫の鍵'],[6,'本当は、ジンに「相談してほしかった」と言いたかった']]},
  'ハル':{ph:'この席、勝てる気がする',ch:2,lines:[[2,'銀の扉の常連の大学生。ロクの姪'],[2,'手札ばかり見るのは、自信がないから']]},
  'セキ':{ph:'降りるのも紳士のたしなみだよ',ch:3,lines:[[3,'月影の老紳士。十年前の大会で準優勝'],[3,'あの日、観客席で、ジンが読まれていると気づいたのに黙っていた'],[3,'口癖は、若い頃にジンから聞いた言葉の言い換え']]},
  'ミナ':{ph:'この曲が終わるまでに勝つね',ch:3,lines:[[3,'月影の歌手。休憩時間に卓で遊ぶ'],[3,'セキに、降りるのをやめさせたいと思っている']]},
  'レイカ':{ph:'読めるものなら読んでみなさい',ch:4,lines:[[4,'天空のディーラー。わざと逆のクセを見せる'],[4,'15年前、王冠の見習いディーラーとして、あの日の決勝卓を配った'],[4,'羽のお守りは、王冠を辞めた日に自分で切った髪飾りの羽']]},
  'ソウ':{ph:'落ち着け、落ち着け……',ch:4,lines:[[4,'天空の見習いディーラー。クセが正直すぎる'],[6,'クロウの誘いを断った。「レイカさんの卓で、一人前になりたい」']]},
  'ハヤト':{ph:'勝ちは勝ちだ',ch:5,lines:[[5,'ジンの元一番弟子。クロウの下で地下の賭場を任されていた'],[5,'マナーの悪さは、焦りのクセ。本当に強い手のときだけ、ジンと同じように静かになる'],[5,'クセを売ったのは「師匠が負ければ、自分を見てくれる」と思ったから'],[7,'本当に欲しかったのは、ジンの「一人前だ」の一言']]},
  'テツ':{ph:'',ch:5,lines:[[5,'地下の常連。ハヤトに勝てる奴を見たことがない']]},
  'クロウ':{ph:'拝見しましょう',ch:6,lines:[[6,'王冠の主。街の看板を5枚まで集めた'],[6,'見せるクセは全部わざと。本当に迷ったときだけ、白い手袋の指先を直す'],[6,'15年前の勝ちを、本人が一番許していなかった']]},
  'カオル':{ph:'',ch:6,lines:[[6,'王冠の常連。クロウの前では背筋が伸びる']]},
  'ゴウ':{ph:'',ch:6,lines:[[6,'感じの悪い客。負けるとディーラーのせいにする']]},
  'クロダ':{ph:'',ch:6,lines:[[6,'王冠のフロア。店の責任者で、もめごとを静かに収める']]},
  'ケンジ':{ph:'次こそ俺の番だ',ch:0,lines:[[0,'負けを取り返そうとする会社員。強気は焦りの裏返し']]},
  'ミサキ':{ph:'あれ、減ってない？',ch:0,lines:[[0,'気ままに見えて、実は一番うまい。チップの増減にすぐ気づく']]},
  'タロウ':{ph:'もうワンハンドだけ……',ch:0,lines:[[0,'心配性。ジンに会う前のあなたに、少し似ている']]},
  'マツ':{ph:"……降り",ch:1,mob:1,lines:[[1,"錨亭の常連。ゲンが乗っていた船の、元の船長"],[1,"ゲンより先に船を降り、ゲンより先に錨亭にいた"]]},
  'ナギ':{ph:"見たいじゃん",ch:1,mob:1,lines:[[1,"魚市場の配達。閉店まで粘って、そのまま仕事に行く"],[1,"ゲンに打ち方を習ったことは、誰にも言っていない"]]},
  'アデ':{ph:"船は待ってくれない",ch:1,mob:1,lines:[[1,"ナイジェリア出身。月に一度入港する貨物船の機関士"],[1,"出航の二時間前になると、どんな手でも降りる"]]},
  'マリア':{ph:"言葉より、手を見るの",ch:1,mob:1,lines:[[1,"フィリピン出身。港の船の通訳で、4つの言葉を話す"],[1,"店主とは25年の付き合い。ジンの昔を少しだけ知っている"]]},
  'ヨシオ':{ph:"今のはね……知らんけど",ch:2,mob:1,lines:[[2,"銀の扉に十年通う、解説好き"],[2,"ロクにだけは、一度も教えたことがない"]]},
  'リン':{ph:"見るだけ見るよ",ch:2,mob:1,lines:[[2,"台湾から来た留学生。ハルの同級生で、ハルに連れてこられた"],[2,"席にこだわらないので、ハルとよくもめる"]]},
  'ハンナ':{ph:"同じ手は、二度通じない",ch:2,mob:1,lines:[[2,"ドイツ出身。古い船の家具を直す職人。車いすで来る"],[2,"銀の扉の入口の段差は、ロクが黙って直した"]]},
  'ラジ':{ph:"楽しんだもん勝ち",ch:2,mob:1,lines:[[2,"インド出身の通関士。港の荷物の書類を毎日見ている"],[2,"ヨシオの解説を、いちばん楽しそうに聞く"]]},
  'カズ':{ph:"この前さ、AAで入ったのに……",ch:3,mob:1,lines:[[3,"月影の常連。同じ話を毎回する。ミナは結末を先に言える"],[3,"本当は、あの手で降りられたことに気づいている"]]},
  'サヤ':{ph:"いま、だいたい3割",ch:3,mob:1,lines:[[3,"確率で降りる学生"],[3,"セキに「確率で降りる人は、確率で負ける」と言われ、意味を考えている"]]},
  'ウォルター':{ph:"降りないのも、たしなみ",ch:3,mob:1,lines:[[3,"アメリカ出身の写真家。30年前に港を撮りに来て、住みついた"],[3,"セキの将棋仲間。二人はいつも逆の打ち方をする"]]},
  'スミン':{ph:"次の曲までに",ch:3,mob:1,lines:[[3,"韓国出身。月影の音響係。休憩のあいだだけ卓に座る"],[3,"ミナの声を、いちばん近くで聞いている"]]},
  'シオン':{ph:"ボタン、動いてないよ",ch:4,mob:1,lines:[[4,"天空のディーラーの手元を、レイカの次によく見ている"],[4,"怒るのはミスのときだけ。負けたときは何も言わない"]]},
  'アキラ':{ph:"この前の大会でさ",ch:4,mob:1,lines:[[4,"名前を売りたくて、どの店の大会にも出ている"],[4,"夢は、王冠の看板戦を一番前で見ること"]]},
  'ルカ':{ph:"押せば動く",ch:4,mob:1,lines:[[4,"日系ブラジル人の三世。港のタグボートの船長"],[4,"ストラドルのある店が好き。天空にはそのために通う"]]},
  'アイシャ':{ph:"流れを見るの",ch:4,mob:1,lines:[[4,"マレーシア出身。港の大学で海の流れを研究している"],[4,"卓ではいつも温かいお茶。レイカと好きな茶葉が同じ"]]},
  'ガン':{ph:"降りていいよ？",ch:5,mob:1,lines:[[5,"ハヤトにあこがれて地下に来た"],[5,"ハヤトには、まだ名前を覚えてもらっていない"]]},
  'ドク':{ph:"……若いな",ch:5,mob:1,lines:[[5,"地下にいちばん長くいる客"],[5,"子どものころのハヤトを知っている"]]},
  'ベン':{ph:"小さく、ゆっくり",ch:5,mob:1,lines:[[5,"イギリス出身の元船大工。大柄で、静か"],[5,"賭場跡の倉庫の、昔の持ち主。新しい客が困っていると、黙って席を詰める"]]},
  'ミン':{ph:"熱いうちに",ch:5,mob:1,lines:[[5,"ベトナム出身。造船所の溶接工"],[5,"ガンに何度あおられても、ターンまでは動かない"]]},
  'レン':{ph:"次は本気出す",ch:6,mob:1,lines:[[6,"王冠の大会に毎回出て、毎回出直す"],[6,"出直すたびに、降りる回数が少しずつ増えている"]]},
  'イオリ':{ph:"短いほうが、得意なの",ch:6,mob:1,lines:[[6,"チップが少なくなってから強くなる"],[6,"王冠の大会で、クロウと同じ卓になると、なぜか先に帰る"]]},
  'ソフィア':{ph:"どの港にも、卓がある",ch:6,mob:1,lines:[[6,"メキシコ出身。世界の港の大会を回るプロ"],[6,"王冠の看板戦のうわさを、遠い港で聞いて来た"]]},
  'タケル':{ph:"（メモ）目で話そう",ch:6,mob:1,lines:[[6,"この街の生まれ。耳が聞こえず、手話と筆談で話す"],[6,"声のクセは効かない。目と手は、だれよりもよく見ている"]]},
  'クワメ':{ph:"港ごとに、卓の音が違う",ch:3,ship:1,lines:[[3,"テマから来た貨物船の機関長"],[3,"この街の卓の音が、いちばん静かだと言う"]]},
  'イネス':{ph:"坂の多い港は、いい港",ch:3,ship:1,lines:[[3,"リスボンの航海士"],[3,"港に着くと、まず一番古い店を探す"]]},
  'ラース':{ph:"雨の日だけ、大きく行く",ch:3,ship:1,lines:[[3,"ベルゲンの漁船の船長"],[3,"雨の日のほうが、なぜか強い"]]},
  'ファティマ':{ph:"荷も手も、中を見てから",ch:3,ship:1,lines:[[3,"タンジェの積み荷の検査官"],[3,"一度も、開けずに通したことがない"]]},
  'メイ':{ph:"次の港で、また",ch:3,ship:1,lines:[[3,"航海士の見習い。初めての長い航海"],[3,"寄った港の卓を、ノートに全部書いている"]]},
  'オリビア':{ph:"灯りは、消えても場所は変わらない",ch:3,ship:1,lines:[[3,"引退した灯台守。貨物船に乗せてもらって旅をしている"],[3,"錨亭の看板の灯りを、海から見たことがある"]]},
};
const FULLNAME={"アデ": "Adewale Adeyemi", "マリア": "Maria Santos", "ハンナ": "Hanna Becker", "ラジ": "Rajesh Mehta", "ウォルター": "Walter Brooks", "スミン": "Kim Su-min", "ルカ": "Lucas Nakamura", "アイシャ": "Aisha Rahman", "ベン": "Ben Carter", "ミン": "Nguyen Van Minh", "ソフィア": "Sofía Ramírez", "タケル": "Saeki Takeru"};
// 相関図：線は章をクリアすると増える
const REL_NODES={'ジン':[50,52],'ハヤト':[15,20],'クロウ':[85,20],'ロク':[9,52],'セキ':[38,90],'レイカ':[91,52],'店主':[14,84],'ゲン':[86,84]};
const REL_EDGES=[['ジン','ロク','相棒',2],['ジン','セキ','友人',3],['セキ','クロウ','あの日を見ていた',3],['レイカ','クロウ','あの日の卓を配った',4],['ジン','ハヤト','師弟',5],['ハヤト','クロウ','クセを売った',5],['ジン','クロウ','あの日の相手',6],['ジン','店主','15年かくまった',7],['ジン','ゲン','15年の飲み相手',7]];
let noteTab='people';
function showNotebook(tab){
  if(tab)noteTab=tab;
  const cl=loadCleared(),n=loadNotes();
  const tabs=[['people','人物'],['rules','店のルール'],['words','ジンの言葉'],['map','相関図']];
  let body='';
  if(noteTab==='people'){
    body=Object.keys(PROFILE).filter(k=>!PROFILE[k].mob&&!PROFILE[k].ship&&PROFILE[k].ch<=cl+1).map(k=>{const P=PROFILE[k];
      const tl=n[k]?Object.keys(n[k]).map(c=>{const r=n[k][c],tot=r.strong+r.bluff+r.none;return`<li>「${CUE_LABEL[c]}」→ 強い手 ${r.strong}／ブラフ ${r.bluff}／意味なし ${r.none}（${tot}回）</li>`}).join(''):'';
      return`<article class="pcard"><div class="pava">${avatar(k)}</div><div class="pbody"><h4>${esc(k)}<span class="stars">${stars(rankOf(k))}</span></h4>
        ${P.ph?`<p class="ph">「${esc(P.ph)}」</p>`:''}<ul>${P.lines.map(([c,t])=>c<=cl?`<li>${esc(t)}</li>`:`<li class="lk">？？？（第${c}章をクリアすると開く）</li>`).join('')}</ul>
        ${tl?`<details><summary>見抜いたクセ</summary><ul class="tl">${tl}</ul></details>`:''}${(()=>{const rm=loadRumor()[k];return rm&&rm.length?`<details><summary>噂</summary><ul class="tl rumor">${rm.map(x=>`<li>「${esc(x)}」</li>`).join('')}</ul></details>`:''})()}${(()=>{const d=loadRead().byName[k];return d&&d.t?`<p class="rd">読み宣言 ${d.h}/${d.t}</p>`:''})()}</div></article>`}).join('');
    body+=mobNotes(n,cl);
  }else if(noteTab==='rules'){
    body=CHAPTERS.filter(c=>c.no<=cl+1).map(c=>{const ls=[].concat(c.intro,...(c.beats||[]).map(b=>b.lines)).filter(l=>!Array.isArray(l)&&l.lesson),h=HOUSE[c.house];
      return`<article class="rcard"><h4>第${c.no}章　${esc(c.venue)}</h4>${h?`<p class="hr">店のルール：${esc(h.name)}（${esc(h.desc)}）</p>`:c.lore?`<p class="hr">${esc(c.lore)}</p>`:''}
        ${ls.map(l=>`<details><summary>${esc(l.lesson)}</summary><p>${esc(l.body)}</p></details>`).join('')}</article>`}).join('');
  }else if(noteTab==='words'){
    const got=loadTitles();
    body=CHAPTERS.filter(c=>c.no<=cl).map(c=>{const ws=[].concat(c.intro,...(c.beats||[]).map(b=>b.lines),typeof c.outro==='function'?[]:c.outro).filter(l=>Array.isArray(l)&&l[0]==='ジン'&&l[1].length>=6&&!(l[2]&&l[2].tempt)).map(l=>l[1]);
      return`<article class="rcard"><h4>第${c.no}章　${esc(c.title)}</h4><ul>${ws.map(w=>`<li>「${esc(w)}」</li>`).join('')}</ul></article>`}).join('')
      +(()=>{const R=loadReview(),it=Object.keys(R.ch).sort((a,b)=>a-b).map(k=>[`第${k}章`,R.ch[k]]).concat(R.free?[['フリー対戦・裏の卓',R.free]]:[]);
        return it.length?`<article class="rcard"><h4>これまでの三行</h4>${it.map(([h,r])=>`<details><summary>${esc(h)}</summary><ol>${r.map(t=>`<li>${esc(t)}</li>`).join('')}</ol></details>`).join('')}</article>`:''})()
      +`<article class="rcard"><h4>称号をもらったとき</h4><ul>${TITLES.filter(t=>got[t.id]).map(t=>`<li>「${esc(t.jin)}」<small>（${esc(t.name)}）</small></li>`).join('')||'<li class="lk">まだありません</li>'}</ul></article>`;
    if(!cl)body='<p class="lk">第1章をクリアすると、ジンの言葉が書き込まれます。</p>'+body;
  }else{
    const seen=e=>e[3]<=cl,on=k=>k==='ジン'||REL_EDGES.some(e=>seen(e)&&(e[0]===k||e[1]===k));
    const P=k=>REL_NODES[k];
    body=`<svg class="relmap" viewBox="0 0 100 100" role="img" aria-label="15年前からの関係">
      ${REL_EDGES.map(e=>{const a=P(e[0]),b=P(e[1]);if(!seen(e))return`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="off"/>`;
        const k=REL_EDGES.filter(seen).indexOf(e)+1,mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;
        return`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/><circle cx="${mx}" cy="${my}" r="2.8" class="enum"/><text x="${mx}" y="${my+1.1}" class="el">${k}</text>`}).join('')}
      ${Object.keys(REL_NODES).map(k=>{const [x,y]=P(k);return`<g class="nd${on(k)?'':' off'}"><circle cx="${x}" cy="${y}" r="7.5"/><text x="${x}" y="${y+1.2}">${on(k)?esc(k):'？'}</text></g>`}).join('')}
    </svg><ol class="rellist">${REL_EDGES.filter(seen).map(e=>`<li>${esc(e[0])}と${esc(e[1])}：${esc(e[2])}</li>`).join('')}</ol><p class="exnote">章をクリアするたびに、15年前の関係が少しずつ書き込まれます。</p>`+ilNote();
  }
  $('noteBody').innerHTML=body;
  $('noteTabs').innerHTML=tabs.map(([k,l])=>`<button class="mini${k===noteTab?' on':''}" data-nt="${k}" aria-pressed="${k===noteTab}">${l}</button>`).join('');
  $('noteTabs').querySelectorAll('[data-nt]').forEach(b=>b.onclick=()=>showNotebook(b.dataset.nt));
  $('noteBody').querySelectorAll('[data-il]').forEach(b=>b.onclick=()=>{const n=+b.dataset.il;playScene(CHAPTERS[n-1],ilLines(n),()=>showNotebook('map'))});
  show('notebook');
}