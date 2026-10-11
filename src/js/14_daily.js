/* ---------- 今日の1ハンド（毎日1問）と、名場面の画像 ---------- */
const PC=t=>{const su='♠♥♦♣'.indexOf(t.slice(-1)),r=t.slice(0,-1);return{r:({A:14,K:13,Q:12,J:11})[r]||+r,s:su}};
// bet：相手が賭けた額（0ならチェックで回ってきた）。answer：fold / call / raise
const DAILY=[
  {opp:'ゲン',hand:'K♥ K♦',board:'K♠ 7♣ 2♦',pot:8000,bet:0,tell:null,sit:'ゲンはチェックしてきた。',answer:'raise',why:'ゲンは何にでもついてくる。強い手なら、ちゃんと賭けて取れ。チェックで回すのはもったいない。'},
  {opp:'ロク',hand:'A♣ 5♣',board:'K♦ 9♠ 4♥ 2♣',pot:10000,bet:6000,tell:'still',sit:'ロクが6,000を賭けた。賭ける前に、ぴたりと動かなくなった。',answer:'fold',why:'ロクが固まった。あいつが動かなくなるのは、強いときだ。Aだけで付き合う理由はない。'},
  {opp:'レイカ',hand:'Q♠ Q♥',board:'J♦ 8♣ 3♠ 5♦ 2♥',pot:20000,bet:16000,tell:'talk',sit:'レイカが16,000を賭けた。いつもより口数が多い。',answer:'call',why:'しゃべりすぎるのは、ブラフのときのクセだ。QQなら十分に受けられる。'},
  {opp:'ミナ',hand:'9♥ 8♥',board:'A♥ K♥ 4♣',pot:10000,bet:2000,tell:null,sit:'ミナが小さく2,000だけ賭けた。あなたはハートがあと1枚でフラッシュ。',answer:'call',why:'2,000で12,000を取りに行ける。フラッシュになる見込みは3回に1回以上ある。安い賭けなら付き合え。'},
  {opp:'ロク',hand:'K♣ 7♦',board:'',pot:3000,bet:2000,tell:null,sit:'あなたはディーラーボタン。前の人は全員降りた。残りはロクとハル（どちらも慎重）。',answer:'raise',why:'後ろの席で、誰も参加していない。相手は慎重だ。手が弱くても、レイズで盗め。'},
  {opp:'セキ',hand:'7♣ 6♣',board:'A♠ Q♦ 8♣ 4♠ 2♥',pot:12000,bet:0,tell:null,sit:'最後のカードが出た。セキはチェックした。あなたの手は何もできていない。',answer:'raise',why:'セキは少しでも怪しいと降りる。何もないなら、ここで賭けてみろ。チェックでは絶対に勝てん。'},
  {opp:'ゲン',hand:'A♦ J♠',board:'J♥ 9♥ 6♣ 9♦',pot:14000,bet:14000,tell:'smile',sit:'ゲンが14,000を賭けた。口元が緩んでいる。',answer:'fold',why:'ゲンがニヤけた。あいつが笑うときは本物だ。Jのペアでは足りん。'},
  {opp:'クロウ',hand:'A♠ K♠',board:'A♦ 10♣ 5♥ 3♠ 8♦',pot:30000,bet:30000,tell:'smile',sit:'クロウが30,000を賭けた。かすかに笑っている。',answer:'call',why:'クロウのクセは全部わざとだ。強いときに焦って見せ、ブラフのときに笑う。笑ったなら、受けろ。'},
  {opp:'ハヤト',hand:'A♥ Q♦',board:'',pot:6000,bet:30000,tell:null,sit:'さっき大きく負けたハヤトが、配られてすぐに全部賭けてきた。熱くなっている。',answer:'call',why:'熱くなった奴は、弱い手でも突っ込んでくる。AQなら十分だ。冷めた方が勝つ。'},
  {opp:'テツ',hand:'6♠ 5♠',board:'4♠ 3♥ 7♦ K♣ 2♣',pot:15000,bet:5000,tell:null,sit:'テツが5,000を賭けた。あなたはストレートができている。',answer:'raise',why:'テツは何でもついてくる。一番強い手なら、もっと取れ。コールだけでは取り損ねる。'},
  {opp:'カオル',hand:'A♣ 9♣',board:'',pot:9000,bet:6000,tell:null,sit:'トーナメント終盤。あなたの持ち点はビッグブラインド8回分しかない。前は全員降りた。',answer:'raise',why:'チップが少ないときは、待ちすぎるな。このくらいの手なら、全部賭けて勝負しろ。'},
  {opp:'ロク',hand:'Q♥ J♣',board:'',pot:16000,bet:12000,tell:null,sit:'あなたのレイズに、慎重なロクがさらに大きくレイズしてきた。',answer:'fold',why:'慎重な奴が2回目のレイズをしたら、強い手だ。QJで付き合うと高くつく。'},
  {opp:'ソウ',hand:'10♠ 10♦',board:'A♣ 9♦ 4♠ 2♣ K♥',pot:16000,bet:12000,tell:'sweat',sit:'ソウが12,000を賭けた。汗をかいている。',answer:'call',why:'ソウの汗は、ブラフのときのクセだ。場にAとKがあっても、10のペアで受けていい。'},
  {opp:'ジン',hand:'K♦ K♣',board:'Q♠ 8♥ 3♦ 6♣ 2♠',pot:24000,bet:20000,tell:'scar',sit:'ジンが20,000を賭けた。いつものように、顎の傷に触れている。',answer:'call',why:'傷に触れているのは、迷っているときだ。いつも通りなら、KKで受けていい。……傷から手を離したときは、別だがな。'},
];
const DAILY_KEY='shisho-daily';
const todayKey=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const dayNo=k=>Math.floor(Date.UTC(+k.slice(0,4),+k.slice(5,7)-1,+k.slice(8,10))/864e5);
function loadDaily(){try{const t=JSON.parse(localStorage.getItem(DAILY_KEY))||{};return{last:String(t.last||''),streak:+t.streak||0,correct:+t.correct||0,res:t.res&&typeof t.res==='object'?t.res:{}}}catch(e){return{last:'',streak:0,correct:0,res:{}}}}
function saveDaily(t){try{localStorage.setItem(DAILY_KEY,JSON.stringify({v:1,...t}))}catch(e){}}
const dailyQ=k=>DAILY[((dayNo(k)%DAILY.length)+DAILY.length)%DAILY.length];
const choiceLabel=(q,a)=>a==='fold'?'フォールド':a==='call'?(q.bet>0?'コール':'チェック'):(q.bet>0?'レイズ':'ベット');
function showDaily(){ltTrack('daily_play',{});
  const k=todayKey(),q=dailyQ(k),t=loadDaily(),done=t.res[k];
  const cards=s=>s?s.split(' ').map(x=>cardHTML(PC(x),false,' noanim')).join(''):'<span class="dnone">まだ配られる前（プリフロップ）</span>';
  const d=$('daily');
  d.innerHTML=`<div class="dailyin"><div class="helphead"><h2>今日の1ハンド<small>${k.replace(/-/g,'/')}</small></h2><button class="ghost small" id="btnDailyClose">閉じる</button></div>
    <div class="dq"><div class="dopp"><span class="dava">${avatar(q.opp,q.tell?'think':'normal')}</span><div><b>${esc(q.opp)}</b>${q.tell?`<span class="dtell">${esc(CUE_LABEL[q.tell])}</span>`:''}</div></div>
      <p class="dsit">${esc(q.sit)}</p>
      <div class="drow"><span class="dl">場</span><div class="dcards">${cards(q.board)}</div></div>
      <div class="drow"><span class="dl">あなた</span><div class="dcards">${cards(q.hand)}</div></div>
      <p class="dpot">ポット ${fmt(q.pot)}${q.bet?`　／　相手の賭け ${fmt(q.bet)}`:''}</p></div>
    ${done?'':`<p class="dask">ジン「お前ならどうする」</p><div class="dchoice">${['fold','call','raise'].filter(a=>!(a==='fold'&&!q.bet)).map(a=>`<button class="act ${a==='fold'?'fold':a==='call'?'call':'raise'}" data-da="${a}"><b>${choiceLabel(q,a)}</b></button>`).join('')}</div>`}
    <div id="dailyRes">${done?dailyResult(q,done,t):''}</div>
    <p class="hnote">連続 ${t.streak}日　／　正解 ${t.correct}回　・　問題は日付で決まり、1日1回答えられます。</p></div>`;
  d.hidden=false;
  $('btnDailyClose').onclick=()=>{d.hidden=true};
  d.querySelectorAll('[data-da]').forEach(b=>b.onclick=()=>{
    const a=b.dataset.da,ok=a===q.answer,t2=loadDaily();if(t2.res[k])return;
    const y=new Date();y.setDate(y.getDate()-1);const yk=`${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,'0')}-${String(y.getDate()).padStart(2,'0')}`;
    t2.streak=t2.last===yk?t2.streak+1:1;t2.last=k;t2.res[k]={a,ok};if(ok)t2.correct++;
    const keys=Object.keys(t2.res).sort();while(keys.length>60)delete t2.res[keys.shift()];
    saveDaily(t2);showDaily();
  });
  const sh=$('btnDailyShare');if(sh)sh.onclick=()=>shareImage(dailyCanvas(q,loadDaily().res[k],loadDaily()),`LAST TELL 今日の1ハンド ${k}`);
}
function dailyResult(q,r,t){
  return`<div class="dres ${r.ok?'ok':'ng'}"><b>${r.ok?'正解':'残念'}</b><span>あなた：${choiceLabel(q,r.a)}　／　ジンの答え：${choiceLabel(q,q.answer)}</span>
    <p>ジン「${esc(q.why)}」</p><button class="mini" id="btnDailyShare">結果を画像にする</button></div>`;
}
/* 画像づくり（canvas）：保存するか、端末の共有画面を開くところまで */
function cvCard(x,ctx,X,Y,W,c){const H=W*1.4;ctx.save();ctx.fillStyle='#fbf8f1';ctx.strokeStyle='#00000033';ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect?ctx.roundRect(X,Y,W,H,W*.08):ctx.rect(X,Y,W,H);ctx.fill();ctx.stroke();
  const red=c.s===1||c.s===2;ctx.fillStyle=red?'#c8213a':'#16171c';ctx.textAlign='center';
  ctx.font=`bold ${W*.42}px Georgia,serif`;ctx.fillText(rankStr(c.r),X+W/2,Y+H*.45);
  ctx.font=`${W*.4}px sans-serif`;ctx.fillText(SUITS[c.s],X+W/2,Y+H*.85);ctx.restore()}
function cvBase(title,sub){
  const cv=document.createElement('canvas');cv.width=1200;cv.height=675;const ctx=cv.getContext('2d');
  const g=ctx.createLinearGradient(0,0,1200,675);g.addColorStop(0,'#1a1d28');g.addColorStop(1,'#07080b');ctx.fillStyle=g;ctx.fillRect(0,0,1200,675);
  ctx.fillStyle='#1d5c45';ctx.beginPath();ctx.ellipse(600,470,560,230,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#e2b65b';ctx.lineWidth=4;ctx.stroke();
  ctx.fillStyle='#d7263d';ctx.fillRect(0,0,14,675);
  ctx.textAlign='left';ctx.fillStyle='#e2b65b';ctx.font='800 30px sans-serif';ctx.fillText('LAST TELL　最後のテル',48,62);
  ctx.fillStyle='#fff';ctx.font='900 54px sans-serif';ctx.fillText(title,48,132);
  ctx.fillStyle='#cfd3dc';ctx.font='600 28px sans-serif';ctx.fillText(sub,48,178);
  return{cv,ctx};
}
function dailyCanvas(q,r,t){
  const {cv,ctx}=cvBase('今日の1ハンド　'+(r&&r.ok?'正解！':'挑戦した'),`${todayKey().replace(/-/g,'/')}　相手：${q.opp}　連続${t.streak}日`);
  const b=q.board?q.board.split(' ').map(PC):[],h=q.hand.split(' ').map(PC);
  b.forEach((c,k)=>cvCard(0,ctx,300+k*124,290,108,c));
  h.forEach((c,k)=>cvCard(0,ctx,476+k*130,480,118,c));
  ctx.fillStyle='#fff';ctx.font='700 26px sans-serif';ctx.textAlign='left';ctx.fillText(`${q.sit.length>34?q.sit.slice(0,33)+'…':q.sit}　あなたなら、どうする？`,48,240);
  return cv;
}
function hlCanvas(h){
  const {cv,ctx}=cvBase(h.head,h.sub);
  h.board.forEach((c,k)=>cvCard(0,ctx,300+k*124,290,108,c));
  h.hand2.forEach((c,k)=>cvCard(0,ctx,476+k*130,480,118,c));
  if(h.quote){ctx.fillStyle='#e2b65b';ctx.font='700 28px sans-serif';ctx.textAlign='left';ctx.fillText(h.quote,48,240)}
  return cv;
}
function shareImage(cv,text){
  const sh=$('share'),url=cv.toDataURL('image/png'),name='last-tell-'+Date.now()+'.png';
  sh.innerHTML=`<div class="sharein"><div class="helphead"><h2>画像</h2><button class="ghost small" id="btnShareClose">閉じる</button></div>
    <img src="${url}" alt="${esc(text)}"><div class="row"><button class="primary" id="btnSave">画像を保存する</button><button id="btnShareGo" hidden>共有する</button></div>
    <p class="hnote">保存できないときは、画像を長押しして保存してください。</p></div>`;
  sh.hidden=false;text=tr(text);$('btnShareClose').onclick=()=>{sh.hidden=true};
  const note=sh.querySelector('.hnote');
  // 保存：claude.ai の中では downloads 機能で確認を出して保存する。それ以外（アプリにしたとき）はふつうのダウンロード
  $('btnSave').onclick=async()=>{
    const bl=await new Promise(r=>cv.toBlob(r,'image/png'));if(!bl)return;
    let dl=null;try{dl=window.claude&&typeof window.claude.use==='function'?await window.claude.use('downloads'):null}catch(e){dl=null}
    if(dl){try{await dl.save({filename:name,data:bl});note.textContent='保存しました。'}catch(e){if(e&&e.code!=='declined')note.textContent='ここでは保存できませんでした。画像を長押しして保存してください。'}return}
    const a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)};
  cv.toBlob(bl=>{if(!bl)return;let f=null;try{f=new File([bl],name,{type:'image/png'})}catch(e){}
    if(f&&navigator.canShare&&navigator.canShare({files:[f]})){const b=$('btnShareGo');if(!b)return;b.hidden=false;
      b.onclick=()=>navigator.share({files:[f],text}).catch(()=>{})}},'image/png');
}
// 名場面：大きく勝ったハンド、クセを読んだハンド、章のクリアを覚えておく
function noteHighlight(){
  const me=S.players[0];if(CFG.flashback||!me.hand.length)return;
  const where=CFG.ch?`${chLab(CFG.ch)}　${CFG.ch.venue}`:CFG.title;
  let head='';
  if(S.result==='win'&&CFG.ch)head=`${chLab(CFG.ch)}クリア`;
  else if(me.won>0&&me.show&&me.score&&me.score[0]>=6)head=`${handName(me.score)}で +${fmt(me.won)}`;
  else if(me.won>0&&S.lastMieta===S.handNo)head=`見えた！ クセを読んで +${fmt(me.won)}`;
  else if(me.won>=BB()*5&&me.allIn&&me.show)head=`オールインで勝ち残った +${fmt(me.won)}`;
  else if(me.won>=BB()*15)head=`大きなポットを取った +${fmt(me.won)}`;
  if(!head){S.hl=null;return}
  S.hl={hand:S.handNo,head,sub:where,board:S.board.slice(),hand2:me.hand.slice(),quote:S.result==='win'&&CFG.ch?'ジン「'+['','弱い手で突っ込まなくなった。それだけのことだ','今のが最後だ。……盗み方は、覚えたな','……少しは、わかってきたな','……半人前だが、目はいい','……お前は、焦るな','……あと一つだ','一人前だ'][CFG.ch.no]+'」':''};if(CFG.ch&&CFG.ch.p2&&S.hl.quote)S.hl.quote=p2Quote(CFG.ch);
}
/* カードプロテクター：章クリアでもらえる見た目だけのお守り */
const PROTECTORS=[
  {id:'',name:'なし',ch:0},
  {id:'anchor',name:'錨',ch:1},
  {id:'key',name:'銀の鍵',ch:2},
  {id:'moon',name:'月のコイン',ch:3},
  {id:'feather',name:'天空の羽',ch:4},
  {id:'lastchip',name:'最後のチップ',ch:5},
  {id:'crown',name:'王冠の看板',ch:6},
  {id:'photo',name:'二枚の写真',ch:7},
];
function protectorSVG(id){
  const coin=(fill,ring,inner)=>`<svg viewBox="0 0 60 60" aria-hidden="true"><ellipse cx="30" cy="33" rx="27" ry="24" fill="#0006"/><circle cx="30" cy="29" r="26" fill="${ring}"/><circle cx="30" cy="29" r="22" fill="${fill}" stroke="#0004" stroke-width="1.5"/>${inner}</svg>`;
  if(id==='anchor')return coin('#3a3f4a','#b98c3f','<g fill="none" stroke="#e8d3a0" stroke-width="3" stroke-linecap="round"><circle cx="30" cy="15" r="3.5"/><path d="M30 19v22M22 25h16M17 33q3 10 13 10q10 0 13-10"/></g>');
  if(id==='key')return coin('#cfd6e2','#8d97a8','<g fill="none" stroke="#4d5668" stroke-width="3" stroke-linecap="round"><circle cx="22" cy="29" r="6"/><path d="M28 29h15M38 29v6M43 29v5"/></g>');
  if(id==='moon')return coin('#e6c66c','#a67d2a','<path d="M35 13a16 16 0 1 0 0 32a13 13 0 1 1 0-32z" fill="#fff6d6" stroke="#8a6620" stroke-width="1.5"/>');
  if(id==='feather')return coin('#f4efe4','#d7263d','<path d="M40 14q-18 4-20 26l-4 6M20 40q12-2 18-16M22 33l8-2M25 26l8-2" fill="none" stroke="#c8213a" stroke-width="2.6" stroke-linecap="round"/>');
  if(id==='lastchip')return coin('#2f6f5f','#1b3d33','<circle cx="30" cy="29" r="13" fill="none" stroke="#c9f2dc" stroke-width="3" stroke-dasharray="4 3"/><text x="30" y="34" text-anchor="middle" font-size="13" font-weight="800" fill="#c9f2dc">1</text>');
  if(id==='crown')return coin('#2b1f3d','#c9a0ff','<path d="M17 38l-2-16 9 8 6-12 6 12 9-8-2 16z" fill="#e2b65b" stroke="#7a5a1a" stroke-width="1.5"/>');
  if(id==='photo')return coin('#3a2f26','#ffb15a','<rect x="15" y="18" width="13" height="17" fill="#f2e6cf" transform="rotate(-8 21 26)"/><rect x="31" y="19" width="13" height="17" fill="#f2e6cf" transform="rotate(7 37 27)"/>');
  return'';
}
/* ハンドの合間の噂話（勝負とは関係ない雑談） */
const GOSSIP={
  1:[['店主','ゲンさんは毎晩来て、毎晩負けて帰るんだよ'],['ゲン','このお守りの錨じゃないと勝てねえんだよな'],['店主','名物のカレー、あとで食べていきな'],['店主','腹が減ってちゃ勝てないよ']],
  2:[['常連','ロクさん、昔はジンさんと組んでたらしいよ'],['ハル','この席、勝てる気がするんだよね'],['常連','あっちの卓、さっきフォーカードが出たってさ'],['ロク','……数えてから言え']],
  3:[['常連','セキさんはね、十年前の大会で準優勝したんだって'],['ミナ','このコイン、手札に置くと落ち着くの'],['常連','演奏が終わると、卓が荒れるんだよなあ'],['ミナ','この曲が終わるまでに勝つね']],
  4:[['ソウ','レイカさん、ディーラーのときは絶対に表情を変えないんです'],['常連','このラウンジ、朝まで卓が立つらしいね'],['ソウ','あ、あとワンハンドだけ……']],
  5:[['テツ','ハヤトは勝つとすぐ帰るんだ。今日は珍しく座ってるな'],['テツ','ここは昔、クロウの持ち物だったらしいぜ'],['テツ','地下は電波が入らねえんだよな']],
  6:[['クロダ','当店では、負け方も含めてお客様を見ております'],['カオル','クロウさんの前だと、みんな背筋が伸びるのよ'],['カオル','あの看板、全部で6枚あるんですって']],
  7:[['店主','カレー、温めなおしておくね'],['店主','この店でジンさんが打つのは、15年ぶりだよ']],
  0:[['ケンジ','あっちの卓で、7-2で勝った人がいるらしいよ'],['ミサキ','この席、さっきから当たりが続いてるんだよね'],['ミサキ','あれ、減ってない？'],['タロウ','もうワンハンドだけ……']],
};

/* 行動に合わせたひとこと（なければ性格別の定番） */
const LINES={
  'ゲン':{raise:['よっしゃ、上乗せだ！','いい札が来たぜ！'],call:['ええい、コールだ！','付き合うぜ！'],check:['様子見だ'],fold:['ちぇっ、今回は降りる'],allin:['全部だ！ぜーんぶ賭けるぜ！'],win:['がっはっは！']},
  'ハル':{raise:['ここは攻めます！'],call:['うーん、ついていきます'],check:['チェックで'],fold:['ご、ごめんなさい…降ります'],allin:['えいっ、全部！'],win:['やった！']},
  'ロク':{rate:.5,raise_strong:['……'],raise_bluff:['見せてもらおうか'],talk:['どうした、ジンの弟子。迷っているのか'],raise:['見せてもらおうか'],call:['……受けよう','……数えてから言え'],check:['……'],fold:['今は引く'],allin:['ここで終わりだ、ジンの弟子'],win:['甘いな']},
  'セキ':{raise_strong:['少し上げさせてもらうよ'],raise_bluff:['今夜はツイているようでね、もう少し上げよう'],talk:['いやあ、いい夜だ。こんな夜は不思議と手が入るものでね、もう少し上げさせてもらうよ'],raise:['少し上げさせてもらうよ'],call:['お付き合いしよう'],check:['どうぞ'],fold:['ここは降りておこう','降りるのも紳士のたしなみだよ'],allin:['紳士の勝負も、ここまでだ'],win:['失礼、いただくよ']},
  'ミナ':{talk:['ねえねえ、今の手どう？わたしはね、すっごくいいの！だから上げるね'],raise:['ふふ、上げるね'],call:['いいよ'],check:['チェック'],fold:['パス'],allin:['全部いくよ'],win:['ごちそうさま']},
  'レイカ':{raise_strong:['レイズ','読めるものなら読んでみなさい'],raise_bluff:['もう少し上げようかしら','読めるものなら読んでみなさい'],talk:['あら、怖い顔。わたしの手が気になる？教えてあげてもいいけど……そうね、上げておくわ'],raise:['上げるわ'],call:['受けるわ'],check:['チェック'],fold:['今回は譲るわ'],allin:['全部よ。読めるものなら読んでみなさい'],win:['ふふ、ごちそうさま'],needled:['揺さぶりのつもり？かわいいわね']},
  'ソウ':{raise_strong:['あ、上げます！'],raise_bluff:['え、えっと……上げます'],talk:['いや、あの、これはですね、その、たぶんいい手なので、上げます、はい'],raise:['上げます'],call:['ついていきます'],check:['チェックです'],fold:['降ります……'],allin:['ぜ、全部いきます！'],win:['や、やった……！'],needled:['え、えっ……そんなこと言われても……']},
  'ゴウ':{rate:.85,raise:['ほら、上げるぞ','ついてこれるか？'],call:['見てやるよ'],check:['ほらよ'],fold:['ちっ、くれてやる'],allin:['全部だ。降りな'],win:['悪いな、また俺だ'],
    gloat:['おいおい、それでコールするか？','ごちそうさん。授業料だな','顔に出てたぜ、新人'],slowroll:['いい手だな。……勝ったと思ったか？','さあ、何だと思う？'],
    tilt:['……今のはまぐれだ','次は俺が勝つ。黙って見てろ'],angleTap:['（トントン）……いや、ベットだ'],angleChip:['（黙って大きいチップを1枚すべらせる）'],caught:['……チッ'],nice:['……ふん']},
  'ケンジ':{fold:['次こそ俺の番だ','ちぇっ、降りる']},
  'テツ':{raise:['いくぜ！'],call:['付き合うぜ'],check:['チェック'],fold:['今回はパス'],allin:['全部だ！'],win:['よっしゃ！']},
  'クロウ':{rate:.5,raise:['少し上げましょう'],raise_strong:['少し上げましょう'],raise_bluff:['今夜は、手が入る夜でしてね'],call:['拝見しましょう'],check:['どうぞ'],fold:['お譲りします'],allin:['では、すべて'],win:['いい勝負でした']},
  'カオル':{raise:['上げるわ'],call:['いいわよ'],check:['チェック'],fold:['降りるわ'],allin:['全部よ'],win:['ふふ']},
  'ジン':{rate:.4,raise:['上げる'],call:['受ける'],check:['……'],fold:['降りる'],allin:['全部だ'],win:['まだまだだな']},
  'ハヤト':{rate:.8,raise:['師匠の弟子なら、ついてこいよ'],call:['見てやるよ'],check:['ほらよ'],fold:['今回はくれてやる'],allin:['全部だ。降りろよ'],win:['これが俺の打ち方だ','勝ちは勝ちだ'],gloat:['ジンさんの真似事か？','AAでも負ける。運がないな','勝ちは勝ちだ'],slowroll:['いい手だな。……勝ったと思ったか？'],tilt:['……今のはまぐれだ','……勝ちは、勝ちだろうが'],angleTap:['（トントン）……いや、ベットだ'],angleChip:['（黙って大きいチップを1枚すべらせる）'],caught:['……チッ'],nice:['……ふん']},
  'マツ':{fold:["……降り"],win:["年寄りにも、たまには来る"]},
  'ナギ':{fold:["今日はやめとく……いや、次は見る"],win:["ほら、見てよかった"]},
  'アデ':{fold:["今日はここまで。船が待ってる"],win:["いい航海になりそうだ"]},
  'マリア':{fold:["今回は通してあげる"],win:["顔に書いてあったよ"]},
  'ヨシオ':{fold:["理屈どおり、降り"],win:["教科書どおりだね"]},
  'リン':{fold:["ごめん、降りる"],win:["あ、勝っちゃった"]},
  'ハンナ':{fold:["記録しておく"],win:["メモどおり"]},
  'ラジ':{fold:["次！ 次がある"],win:["ほら、楽しんだから来た"]},
  'カズ':{fold:["降りる。あの時も降りればよかった"],win:["……これは話さないでおく"]},
  'サヤ':{fold:["数字が降りろって"],win:["計算どおり"]},
  'ウォルター':{fold:["……今回はセキの勝ちだな"],win:["降りないのも、たしなみでね"]},
  'スミン':{fold:["パス！ 音、見てくる"],win:["ちょうどサビ"]},
  'シオン':{fold:["降り。ディーラーさん、続けて"],win:["次、配って"]},
  'アキラ':{fold:["ここは降りるのがうまいところ"],win:["写真、撮っといて"]},
  'ルカ':{fold:["今は引き潮だ"],win:["大きい船も、押せば動く"]},
  'アイシャ':{fold:["ここは引く"],win:["読んだとおりの潮"]},
  'ガン':{fold:["……ちっ"],win:["降りればよかったのに"]},
  'ドク':{fold:["……"],win:["……昔は、もっと速かった"]},
  'ベン':{fold:["若いのに譲るよ"],win:["小さく賭けて、大きく取る"]},
  'ミン':{fold:["冷めた。降りる"],win:["つながった"]},
  'レン':{fold:["もう一回、出直す"],win:["本気、出た！"]},
  'イオリ':{fold:["まだ早い"],win:["残るのは、得意なの"]},
  'ソフィア':{fold:["また来る"],win:["どの港でも、同じ"]},
  'タケル':{fold:["（カードを静かに前に出す）"],win:["（小さく頭を下げる）"]},
  _cute:{needled:['う、うるさいなあ！'],raise:['いくよ！'],call:['ついていく！'],check:['チェック！'],fold:['うう、降ります'],allin:['オールイン！'],win:['勝ったー！']},
  _cool:{needled:['安い挑発だ'],raise:['上げる'],call:['受けよう'],check:['……'],fold:['降りる'],allin:['全部だ'],win:['悪くない']},
};
function lineFor(name,kind){
  const L=LINES[name]||{},D=rankOf(name)>=3?LINES._cool:LINES._cute;
  const arr=L[kind]||(kind.includes('_')?L[kind.split('_')[0]]:null)||D[kind.split('_')[0]]||[];
  return arr[Math.floor(Math.random()*arr.length)]||'';
}
const talkRate=name=>(LINES[name]&&LINES[name].rate)||.75;
