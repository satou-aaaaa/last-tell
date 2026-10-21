/* ---------- 初めての人向け：役の一覧・遊び方・操作の案内 ---------- */
const HANDS_HELP=[
  ['ロイヤルフラッシュ','同じマークの A・K・Q・J・10',[[14,0],[13,0],[12,0],[11,0],[10,0]]],
  ['ストレートフラッシュ','同じマークで、数字が5つ続く',[[9,1],[8,1],[7,1],[6,1],[5,1]]],
  ['フォーカード','同じ数字が4枚',[[8,0],[8,1],[8,2],[8,3],[13,0]]],
  ['フルハウス','同じ数字3枚＋同じ数字2枚',[[12,0],[12,1],[12,3],[5,2],[5,0]]],
  ['フラッシュ','同じマークが5枚（数字はばらばらでよい）',[[14,2],[11,2],[8,2],[6,2],[3,2]]],
  ['ストレート','数字が5つ続く（マークはばらばらでよい）',[[10,0],[9,2],[8,1],[7,3],[6,0]]],
  ['スリーカード','同じ数字が3枚（セット／トリップスとも呼ぶ）',[[7,0],[7,1],[7,3],[13,2],[4,0]]],
  ['ツーペア','同じ数字2枚の組が2つ',[[11,0],[11,2],[4,1],[4,3],[14,0]]],
  ['ワンペア','同じ数字が2枚',[[10,1],[10,3],[14,2],[8,0],[3,1]]],
  ['ハイカード','役なし。いちばん大きいカードで比べる',[[14,0],[12,2],[9,1],[6,3],[3,0]]],
];
const HELP_KEY='shisho-guide';
let helpTab='hands';
function showHelp(tab){
  if(tab)helpTab=tab;
  const inGame=!$('game').hidden&&S&&S.players&&S.players[0];
  const me=inGame&&S.players[0],board=inGame?S.board:[];
  const myName=me&&me.hand.length===2&&board.length>=3&&!me.folded&&(!peekOn()||me.peeked||S.handOver)?handName(bestN(me.hand.concat(board))):'';
  const tabs=[['hands','役の一覧'],['flow','ゲームの流れ'],['ctrl','操作の案内']];
  let body='';
  if(helpTab==='hands'){
    body=`<p class="hnote">上ほど強い役です。手札2枚と場の5枚、合わせて7枚のうち、いちばん強い5枚の組み合わせで勝負します。${myName?`<br>今のあなたの役：<b>${esc(myName)}</b>`:''}</p><ol class="hands">`+
      HANDS_HELP.map(([n,d,cs])=>`<li class="${n===myName?'me':''}"><div class="hn"><b>${esc(n)}</b><span>${esc(d)}</span></div><div class="hc" aria-label="${cs.map(([r,su])=>cardStr({r,s:su})).join(' ')}">${cs.map(([r,su])=>`<span class="mc${su===1||su===2?' red':''}">${rankStr(r)}<i>${SUITS[su]}</i></span>`).join('')}</div></li>`).join('')+'</ol>';
  }else if(helpTab==='flow'){
    body=`<ol class="flow">
      <li><b>ブラインド</b>ディーラーボタン（D）の左の2人が、決まった額を先に出します（小さいほうがスモール、大きいほうがビッグ）。</li>
      <li><b>手札が2枚配られる（プリフロップ）</b>手札を見て、参加するか降りるかを決めます。</li>
      <li><b>フロップ</b>場に3枚が表で出ます。もう一度、賭けるかどうかを決めます。</li>
      <li><b>ターン</b>場に4枚目が出ます。</li>
      <li><b>リバー</b>場に5枚目が出ます。最後の賭けです。</li>
      <li><b>ショーダウン</b>残った人が手札を見せ、強い役の人がポット（賭けられたチップ全部）をもらいます。途中で全員が降りたら、残った1人の勝ちです。</li>
    </ol><p class="hnote">チップは点数です。お金とは交換しません。<br>フリー対戦のカードは、毎回ふつうにシャッフルしています。物語の章では、遊びやすいように、自分に弱い手が少し来にくくしています。物語の決まった場面だけ、配られる札が決まっています（そのハンドは自動で進みます）。</p>`;
  }else{
    body=`<dl class="ctrl">
      <dt>フォールド（降りる）</dt><dd>このハンドをあきらめます。それまでに出したチップは戻りません。</dd>
      <dt>チェック</dt><dd>誰も賭けていないとき、賭けずに次の人へ回します。</dd>
      <dt>コール</dt><dd>前の人と同じ額を出して、勝負を続けます。</dd>
      <dt>ベット／レイズ</dt><dd>賭ける、または賭け額を上げます。1回押すと額を選ぶ画面が開き、もう1回押すと確定です。「½ポット」「ポット」などのボタンで、よく使う額を選べます。</dd>
      <dt>オールイン</dt><dd>持っているチップを全部賭けます。</dd>
      <dt>手札をめくる</dt><dd>伏せた手札をタップすると、自分にだけ見えます（設定で「いつも表」にもできます）。</dd>
      <dt>ジンの助言</dt><dd>テーブルの下に、ジンのひとことが出ます。第1〜4章では、何をすればよいかを教えてくれます。</dd>
      <dt>相手のクセ</dt><dd>第4章からは、相手の頭の上に「ニヤ」「タラ…」などのクセが出ます。強い手のときに出るのか、ブラフのときに出るのかを読みましょう。</dd>
      <dt>名札をタップ</dt><dd>相手の前に積んだチップが大きく見えます。色ごとの額は決まっていて、数えて足すと正確な持ち点になります。持ち点が「約○万」のときは、ディーラーに数えてもらうこともできます。</dd>
    </dl><button class="mini" id="btnTour" ${inGame?'':'disabled'}>テーブルの上で案内を見る${inGame?'':'（対戦中に使えます）'}</button>`;
  }
  const h=$('help');
  h.innerHTML=`<div class="helpin" role="document"><div class="helphead"><h2>遊び方</h2><button class="ghost small" id="btnHelpClose">閉じる</button></div>
    <div class="ntabs">${tabs.map(([k,l])=>`<button class="mini${k===helpTab?' on':''}" data-ht="${k}" aria-pressed="${k===helpTab}">${l}</button>`).join('')}</div><div class="helpbody">${body}</div></div>`;
  h.hidden=false;
  h.querySelectorAll('[data-ht]').forEach(b=>b.onclick=()=>showHelp(b.dataset.ht));
  $('btnHelpClose').onclick=()=>{h.hidden=true};
  const t=$('btnTour');if(t)t.onclick=()=>{h.hidden=true;startTour()};
}
// 卓の上の案内（初めて対戦するときに一度だけ。「？」からいつでも見られる）
const TOUR=[
  ['#mine .hold','あなたの手札','伏せた2枚をタップすると、めくって見られます。'],
  ['#boardCards','場のカード','フロップ・ターン・リバーで、全員が使えるカードが並びます。'],
  ['#potSign','ポット','このハンドで賭けられたチップの合計です。勝った人がもらいます。'],
  ['#plate1','相手','名札に持ち点が出ます。頭の上には、セリフやクセが出ます。'],
  ['#controls','あなたの番','フォールド・チェック／コール・レイズから選びます。迷ったら、上の「？」で役の一覧を見られます。'],
];
let tourI=-1;
function startTour(){tourI=0;renderTour()}
function endTour(){tourI=-1;$('tour').hidden=true;{const t=$('table');if(t&&!$('game').hidden&&t.getBoundingClientRect().top<0)window.scrollTo({top:Math.max(0,t.getBoundingClientRect().top+scrollY-4),behavior:'auto'})}document.querySelectorAll('.tourhl').forEach(e=>e.classList.remove('tourhl'));try{guideSet({done:true})}catch(e){}}
function renderTour(){
  document.querySelectorAll('.tourhl').forEach(e=>e.classList.remove('tourhl'));
  const st=TOUR[tourI];if(!st)return endTour();
  const el=document.querySelector(st[0]);if(!el||!el.getBoundingClientRect().width){tourI++;return renderTour()}
  el.classList.add('tourhl');el.scrollIntoView({block:'center',behavior:reducedMotion()?'auto':'smooth'});
  const t=$('tour');t.hidden=false;
  t.innerHTML=`<div class="tbox"><span class="tstep">${tourI+1}/${TOUR.length}</span><b>${esc(st[1])}</b><p>${esc(st[2])}</p>
    <div class="tbtns"><button class="ghost small" id="tourSkip">閉じる</button><button class="primary small" id="tourNext">${tourI===TOUR.length-1?'はじめる':'次へ'}</button></div></div>`;
  $('tourSkip').onclick=endTour;$('tourNext').onclick=()=>{tourI++;renderTour()};
  placeTour(el);setTimeout(()=>{if(tourI>=0)placeTour(el)},450);
}
function placeTour(el){const t=$('tour');if(!t||t.hidden)return;const land=innerWidth>innerHeight&&innerHeight<=500,box=t.querySelector('.tbox');
  const ctl=$('controls'),cr=ctl&&ctl.getClientRects().length?ctl.getBoundingClientRect():null,er=el.getBoundingClientRect();
  box.style.width=land?'min(100%,360px)':'';t.style.justifyItems=land?((el.id==='controls'||er.left+er.width/2>innerWidth*.55)?'start':'end'):'';
  const hit=()=>{const b=box.getBoundingClientRect();return!(b.right<er.left||b.left>er.right||b.bottom<er.top||b.top>er.bottom)};
  // まず操作ボタンのすぐ上に置き、光らせている所にかぶるなら画面の上に置く
  t.style.top='auto';t.style.bottom=(cr&&cr.top>innerHeight*.4?Math.max(12,innerHeight-cr.top+6):12)+'px';
  if(el.id==='controls'||hit()||box.getBoundingClientRect().top<0){t.style.bottom='auto';t.style.top='8px'}}
addEventListener('resize',()=>{if(tourI>=0){const st=TOUR[tourI],el=st&&document.querySelector(st[0]);if(el)placeTour(el)}});
function tourDone(){return true} // S2：自動の案内はやめた。その場の1行の案内（tips）に置きかえ