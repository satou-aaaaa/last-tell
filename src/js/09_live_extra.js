/* ---------- 追加のライブ要素：常連・見せる/伏せる・カウント・フロア・ディーラーのミス・席選び ---------- */
const REG_KEY='shisho-regular';
function loadReg(){try{const r=JSON.parse(localStorage.getItem(REG_KEY));return r&&typeof r.visits==='object'?{visits:r.visits||{},seat:r.seat&&typeof r.seat==='object'?r.seat:{}}:{visits:{},seat:{}}}catch(e){return{visits:{},seat:{}}}}
function saveReg(r){try{localStorage.setItem(REG_KEY,JSON.stringify({v:1,...r}))}catch(e){}}
const regLevel=n=>{const v=+(loadReg().visits[n]||0);return v>=8?2:v>=3?1:0};
const storeNo=()=>CFG.ch?(CFG.ch.p2?0:CFG.ch.no):CFG.store||0;
const nick=()=>heroName();   // 物語の中で呼ばれるのは主人公の名前（既定アオ）。プレイヤーネーム SETTINGS.nick は物語の外だけ（31_hero.js）
// 店ごとの常連向けのひとこと（{name} は主人公の名前）
const GOSSIP_REG={
  1:{1:[['店主','{name}、今日も来たね']],2:[['店主','いつものカレー、大盛りにしといたよ'],['ゲン','おう{name}、また来たのか！']]},
  2:{1:[['ハル','{name}さん、こんばんは']],2:[['ロク','{name}か。……いつもの席は空けてある']]},
  3:{1:[['ミナ','あ、{name}だ']],2:[['セキ','やあ{name}君。今夜も紳士的にいこう']]},
  4:{1:[['ソウ','{name}さん、いらっしゃいませ！']],2:[['レイカ','あら{name}。もう常連の顔ね']]},
};
const weakNow=h=>S.board.length<3?preTier(h)===0:isWeak(h,S.board);
function approx(v){if(v<=0)return'0';const m=10**Math.floor(Math.log10(v)),r=Math.round(v/m)*m;return r>=10000?(r/10000)+'万':fmt(r)}
const approxOn=()=>!!CFG.tells&&!CFG.levels&&SETTINGS.count!=='exact';   // 第6章の録画 #27・#28：トーナメントは持ち点を正確に出す（約○万だとずれて BB が分からない）
// フロアのルールクイズ。正解・不正解で勝敗は変わらない
const QUIZ={
  tap:{q:'テーブルを叩いてから「ベットだ」と言った。どうなる？',opts:['チェック','ベット'],a:0,why:'多くの店では、テーブルを叩いたらチェックです。取り消せません'},
  onechip:{q:'大きいチップを1枚、黙って出した。どうなる？',opts:['コール','レイズ'],a:0,why:'多くの店では、宣言がなければコールです'},
  string:{q:'チップを2回に分けて出した。有効なのは？',opts:['最初の分だけ','全部'],a:0,why:'一度に出さないと上乗せになりません'},
  exposed:{q:'配るときにカードが表向きになった。どうする？',opts:['交換する','そのまま使う'],a:0,why:'多くの店では、見えたカードは使わずに交換します'},
  speak:{q:'「ストレートだ」と言ったが、見せた手はワンペアだった。どう判定する？',opts:['見せた手で判定','言った役で判定'],a:0,why:'「カードがしゃべる」。見せた手で判定します'},
  order:{q:'ショーダウン。誰から手を見せる？',opts:['最後にベットした人','ボタンに近い人'],a:0,why:'リバーで最後にベット・レイズした人からです。リバーで誰も賭けていなければ、ボタンの左から'},
  straddle:{q:'ストラドルを置いた人は、プリフロップでいつアクションする？',opts:['最後','最初'],a:0,why:'ストラドルは「3枚目のブラインド」なので、プリフロップは最後にアクションします'},
  allin:{q:'オールインで勝負が決まった。手札は？',opts:['全員が見せる','見せなくてよい'],a:0,why:'多くの店では、オールインで勝負が決まったら全員が手を見せます'},
};
const QUIZ_KEY='shisho-quiz';
function loadQuiz(){try{const q=JSON.parse(localStorage.getItem(QUIZ_KEY));return q&&typeof q==='object'?{correct:+q.correct||0,solved:q.solved&&typeof q.solved==='object'?q.solved:{}}:{correct:0,solved:{}}}catch(e){return{correct:0,solved:{}}}}
const quizReady=id=>SETTINGS.quiz&&QUIZ[id]&&!loadQuiz().solved[id]&&!(S.quizAsked||{})[id];
function askQuiz(id,then){
  if(!quizReady(id))return then();
  (S.quizAsked=S.quizAsked||{})[id]=true;
  const s0=S,qz=QUIZ[id],box=$('quiz');try{renderGoal()}catch(e){}
  dealerSay('フロア！');
  box.innerHTML=`<div class="qin"><div class="qhead"><span class="qava">${avatar('クロダ','normal')}</span><span><b>フロアの黒田</b><em>どうなると思いますか？</em></span></div>
    <p class="qq">${esc(qz.q)}</p><div class="qopts">${qz.opts.map((o,k)=>`<button data-k="${k}">${esc(o)}</button>`).join('')}</div></div>`;
  box.hidden=false;
  box.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{
    const ok=+b.dataset.k===qz.a,st=loadQuiz();
    if(ok){st.correct++;st.solved[id]=true}
    try{localStorage.setItem(QUIZ_KEY,JSON.stringify({v:1,...st}))}catch(e){}
    if(ok&&st.correct>=5)grantTitle('rules');
    log(`フロア：${qz.why}`);
    box.querySelector('.qin').innerHTML=`<div class="qhead"><span class="qava">${avatar('クロダ',ok?'confident':'normal')}</span><span><b>${ok?'正解です':'残念、ちがいます'}</b><em>正解は「${esc(qz.opts[qz.a])}」</em></span></div>
      <p class="qq">${esc(qz.why)}</p><button class="primary" id="qGo">続ける</button>`;
    $('qGo').onclick=()=>{box.hidden=true;if(S===s0)then()};$('qGo').focus({preventScroll:true});
  });
}
// 席選び：選んだ相手の「左」に座る＝その人のすぐあとに動く
const seatWho=n=>typeof who==='function'?who(n):n;   // 名乗っていない相手は見た目の呼び名で
const roughOf=p=>{const st=p.style||{};return st.bluff>=.12||st.midP>=.45||!!st.loose};
function pickSeat(done){
  const opps=S.players.slice(1);
  if(opps.length<2||(CFG.ch&&CFG.ch.no<=4)||(CFG.run&&!hasLesson('seat')))return done();
  if(CFG.levels){log('席：フロアが決めた席に座った（トーナメント）');return done()}   // 第6章の録画 #43：トーナメントは席が指定される
  const v=$('vs'),store=storeNo(),reg=loadReg(),usual=regLevel(store)>=1?reg.seat[store]:'';
  const rough=opps.some(roughOf);
  v.innerHTML=`<div class="vsin seatpick"><div class="vshead"><span class="vst">席を選ぶ</span></div>
    <p class="seatjin"><span class="qava">${avatar(P2ON()?'師匠':'ジン')}</span>${P2ON()?esc(mentorName()):'ジン'}「${rough?'荒い奴の左に座れ。あいつが動いてから決められる':'好きな席に座れ。誰のあとに動くかで、見えるものが変わる'}」</p>
    <div class="seats">${opps.map((p,k)=>`<button class="seatbtn" data-k="${k}"><span class="sava">${avatar(p.name)}</span>
      <b>${esc(seatWho(p.name))}の左</b><span>${esc(seatWho(p.name))}のすぐあとに動く</span>${roughOf(p)?'<i class="rough">荒い</i>':''}${usual===p.name?'<i>いつもの席</i>':''}</button>`).join('')}</div></div>`;
  v.hidden=false;
  v.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{
    const k=+b.dataset.k,pick=opps[k];
    S.players=[S.players[0]].concat(opps.slice(k+1),opps.slice(0,k+1));
    S.dealer=Math.floor(Math.random()*S.players.length);
    S.seatGood=roughOf(pick);
    if(rough)jinNote(S.seatGood?'それでいい':`${seatWho(opps.find(roughOf).name)}の動きを、先に見られなくなるぞ`,1);
    if(store){const r=loadReg();r.seat[store]=pick.name;saveReg(r)}
    log(`席：${pick.name}の左に座った`);
    buildSeats();v.hidden=true;done();
  });
}