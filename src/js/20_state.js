/* ---------- 状態 ---------- */
let S,CFG;
const N=()=>S.players.length;
const inHand=p=>!p.out&&!p.folded;
const canAct=p=>inHand(p)&&!p.allIn;
const needs=p=>canAct(p)&&(!p.acted||p.bet<S.currentBet);
function nextIdx(i,pred){for(let k=1;k<=N();k++){const j=(i+k)%N();if(pred(S.players[j]))return j}return -1}
const potTotal=()=>S.players.reduce((a,p)=>a+p.total,0);
const SB=()=>CFG.blinds[0],BB=()=>CFG.blinds[1];

function startGame(cfg){
  CFG=cfg;
  S={players:cfg.seats.map(s=>({styleKey:s.style||'normal',name:s.name,chips:s.chips,start:s.chips,style:STYLES[s.style||'normal'],label:s.label||'',extra:!!s.extra,
      hand:[],folded:false,allIn:false,bet:0,total:0,acted:false,human:!!s.human,out:false,show:false,won:0,hname:''})),
     dealer:Math.floor(Math.random()*cfg.seats.length),board:[],deck:[],street:'preflop',currentBet:0,minRaise:BB(),
     toAct:-1,handOver:true,result:null,handNo:0,raises:0,msg:'',aggr:-1,riverAggr:-1,myPostAggro:false,steals:0,bluffs:0};
  S.stat=cfg.run&&typeof RUN!=='undefined'&&RUN?(RUN.stat=RUN.stat||newStat()):newStat();
  buildSeats();
  $('gTitle').textContent=cfg.title;
  $('log').innerHTML='';
  $('notesBox').hidden=!cfg.tells;renderNotes();
  $('dcall').classList.remove('go');$('dcall').textContent='';
  $('table').classList.toggle('flashback',!!cfg.flashback);$('mieta').hidden=true;
  $('table').style.setProperty('--lamp',cfg.lamp||'#e2b65b');$('table').style.setProperty('--night','0');$('toast').hidden=true;Depth.recenter();
  {const st=storeNo();if(st){const r=loadReg();r.visits[st]=(+r.visits[st]||0)+1;saveReg(r);const lv=regLevel(st);
    if(lv>=2){log('店の人が「いつもの」を出してくれた');grantTitle('regular')}}}
  if(SETTINGS.protector){const pr=PROTECTORS.find(x=>x.id===SETTINGS.protector);if(pr)log(`いつもの「${pr.name}」を手札の上に置いた`)}
  Sound.bgm(cfg.bgm||0);
  $('goal').dataset.k='';try{renderGoal()}catch(e){}
  show('game');
  showVersus(()=>pickSeat(()=>{if(S.handNo===0)startHand()}));
}
/* 対戦の始めの相手紹介 */
const INTRO={
  'ゲン':['港の酔客','配られた札は全部勝負！'],
  'ロク':['銀の扉の主','うちの客は慎重だ。簡単には崩れんよ'],
  'ハル':['銀の扉の常連','この席、勝てる気がするんです'],
  'セキ':['月影の老紳士','紳士的に勝負しよう'],
  'ミナ':['月影の常連','ふふ、負けないよ？'],
  'レイカ':['読めないディーラー','嘘かどうか、顔を見たってわからないわよ'],
  'ソウ':['見習いディーラー','よ、よろしくお願いします！'],
  'ケンジ':['強気な常連','今日は俺の日だぜ'],
  'ミサキ':['気ままな常連','よろしくね'],
  'タロウ':['慎重な常連','もうワンハンドだけ……'],
  'ゴウ':['感じの悪い客','新人か。授業料、置いていけよ'],
  'ハヤト':['ジンの元一番弟子','二代目か。一勝負だけ、付き合ってやるよ'],
  'テツ':['地下の常連','ハヤトに勝てる奴なんて、見たことねえぞ'],
  'クロウ':['王冠の主','ようこそ、王冠へ。看板は入口で拝見しました'],
  'カオル':['王冠の常連','クロウさんの前では、みんな静かになるの'],
  'マツ':["錨亭の常連", "……降り"],
  'ナギ':["錨亭の常連", "見たいじゃん"],
  'アデ':["錨亭の常連", "船は待ってくれない"],
  'マリア':["錨亭の常連", "言葉より、手を見るの"],
  'ヨシオ':["銀の扉の常連", "今のはね……知らんけど"],
  'リン':["銀の扉の常連", "見るだけ見るよ"],
  'ハンナ':["銀の扉の常連", "同じ手は、二度通じない"],
  'ラジ':["銀の扉の常連", "楽しんだもん勝ち"],
  'カズ':["月影の常連", "この前さ、AAで入ったのに……"],
  'サヤ':["月影の常連", "いま、だいたい3割"],
  'ウォルター':["月影の常連", "降りないのも、たしなみ"],
  'スミン':["月影の常連", "次の曲までに"],
  'シオン':["天空の常連", "ボタン、動いてないよ"],
  'アキラ':["天空の常連", "この前の大会でさ"],
  'ルカ':["天空の常連", "押せば動く"],
  'アイシャ':["天空の常連", "流れを見るの"],
  'ガン':["地下の常連", "降りていいよ？"],
  'ドク':["地下の常連", "……若いな"],
  'ベン':["地下の常連", "小さく、ゆっくり"],
  'ミン':["地下の常連", "熱いうちに"],
  'レン':["王冠の常連", "次は本気出す"],
  'イオリ':["王冠の常連", "短いほうが、得意なの"],
  'ソフィア':["王冠の常連", "どの港にも、卓がある"],
  'タケル':["王冠の常連", "（メモ）目で話そう"],
  'クワメ':["入港した船の客", "港ごとに、卓の音が違う"],
  'イネス':["入港した船の客", "坂の多い港は、いい港"],
  'ラース':["入港した船の客", "雨の日だけ、大きく行く"],
  'ファティマ':["入港した船の客", "荷も手も、中を見てから"],
  'メイ':["入港した船の客", "次の港で、また"],
  'オリビア':["入港した船の客", "灯りは、消えても場所は変わらない"],
  'ジン':['師匠','俺の手を読んでみろ'],
};
function showVersus(done){
  if(CFG.flashback){$('vs').hidden=true;return done()}
  const boss=CFG.ch&&CFG.ch.opps[0].name;
  if(CFG.nanori&&NANORI[boss]&&!CFG.nanoriShown){CFG.nanoriShown=true;return showNanori(boss,()=>showVersus(done))}
  const v=$('vs'),opps=S.players.filter(p=>!p.human);
  v.innerHTML=`<div class="vsin">
    <div class="vshead"><span class="vsv">${esc(opps.length>1?'お待たせしました。席へご案内します':'お待たせしました。テーブルへどうぞ')}</span><span class="vst">${esc(CFG.title)}</span></div>
    <div class="vsopps n${opps.length}" style="--vn:${opps.length}">${opps.map((p,k)=>{const r=rankOf(p.name),it=INTRO[p.name]||['','']; return`
      <div class="vscard ${r>=3?'cool':'cute'}${r>=4?' rk4':''}" style="animation-delay:${(k*.18).toFixed(2)}s">
        <div class="vsava">${avatar(p.name,r>=3?'confident':'normal')}</div>
        <div class="vsname">${esc(p.name)}<span class="stars">${stars(r)}</span></div>
        <div class="vsrole">${esc(it[0])}${p.label?`<span>${esc(p.label)}</span>`:''}</div>
        <div class="vsq">「${esc(it[1])}」</div>
        <div class="vschips">持ち点 ${approxOn()?'約'+approx(p.chips):fmt(p.chips)}</div></div>`}).join('')}</div>
    <div class="vsgoal"><span>勝利条件</span>${esc(CFG.goal.type==='free'?'最後の一人になる':CFG.goalText||CFG.ch.goalText)}</div>
    <button class="primary" id="vsGo">座る</button></div>`;
  v.hidden=false;
  let closed=false;const close=()=>{if(closed)return;closed=true;v.hidden=true;done()};
  $('vsGo').onclick=()=>{Depth.ask();close()};$('vsGo').focus({preventScroll:true});
}
/* 卓の配置：相手は奥、自分は手前。x は画面の横位置(%) */
const LAYOUT={1:[50],2:[26,74],3:[17,50,83],4:[14,38,62,86],5:[12,31,50,69,88]};   // 4：第14章の5人卓（改善提案 第10回 §1）
const feltX=x=>(x+32)/164*100;
function buildSeats(){
  const xs=LAYOUT[N()-1];$('table').classList.toggle('n6',N()>=6);$('table').classList.toggle('n5',N()===5);
  $('busts').innerHTML='';$('plates').innerHTML='';$('sayLayer').innerHTML='';
  $('felt').querySelectorAll('.spot').forEach(e=>e.remove());
  S.players.forEach((p,i)=>{
    if(i===0){
      const sp=document.createElement('div');sp.className='spot';sp.id='spot0';sp.style.left='37%';sp.style.top='34%';
      $('felt').appendChild(sp);return;
    }
    const x=xs[i-1],r=rankOf(p.name),solo=N()===2;
    const w=(solo?52:N()===3?36:N()>=6?23:N()===5?25:28)+r*(solo?3:N()>=5?1:2);
    $('busts').insertAdjacentHTML('beforeend',`<div class="bust ${r>=3?'cool':'cute'}${r>=4?' rk4':''}" id="bust${i}" style="left:${x}%;width:${w}%"><div class="body" style="animation-delay:-${(i*1.1).toFixed(1)}s">${avatar(p.name)}</div></div>`);
    $('sayLayer').insertAdjacentHTML('beforeend',`<div class="say${x<30?' l':x>70?' r':''}" id="say${i}" style="left:${x}%;max-width:${N()>=6?30:N()===5?28:N()===4?31:44}%"></div>`);
    $('plates').insertAdjacentHTML('beforeend',`<div class="plate" id="plate${i}" style="left:${x}%"></div>`);
    const sp=document.createElement('div');sp.className='spot';sp.id='spot'+i;
    sp.style.left=feltX(N()>=6&&innerWidth<560&&innerWidth<innerHeight?50+(x-50)*.85:x)+'%';sp.style.top='13%';
    $('felt').appendChild(sp);
  });
}
function moodOf(p,i){
  if(p.out)return'lose';
  if(p.fooled===S.handNo&&S.handOver)return'lose';
  if(p.won>0)return'win';
  if(S.handOver&&p.show)return'lose';
  if(p.folded)return'worried';
  if(S.toAct===i&&!p.human)return'think';
  if(p.human&&S.meSmug)return'confident';
  if(p.tilt>0&&!p.human&&mannerOf(p))return'worried';
  if(p.actKind==='raise'||p.actKind==='allin')return'confident';
  return'normal';
}
/* チップが置かれた瞬間だけすべり込ませる */
function slideKey(p,i){const k=S.handNo+':'+S.street+':'+p.bet;if(p.bet&&p._slid!==k){p._slid=k;return' slide'}return''}
function motion(el,kind,cool){
  const svg=el.querySelector('.av');if(!svg||!svg.animate||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const K={raise:[[0,0,1],[7,0,1.08],[0,0,1]],allin:[[0,0,1],[9,0,1.12],[2,0,1.04],[0,0,1]],call:[[0,0,1],[3,0,1],[0,0,1]],check:[[0,0,1],[2,0,1],[0,0,1]],
    fold:[[0,0,1],[5,-4,.98],[0,0,1]],win:cool?[[0,0,1],[4,0,1],[0,0,1],[3,0,1],[0,0,1]]:[[0,0,1],[-12,0,1],[0,0,1],[-7,0,1],[0,0,1]]}[kind];
  if(!K)return;
  LT.anim(svg,K.map(([y,r,s])=>({transform:`translateY(${y}%) rotate(${r}deg) scale(${s})`})),{duration:kind==='win'?900:kind==='allin'?800:500,easing:'ease-out'});
}
function placeDealer(){
  const d=$('dbtn'),sp=$('spot'+S.dealer);
  d.hidden=S.dealer===0;if(!sp||S.dealer===0)return;
  const l=parseFloat(sp.style.left),t=parseFloat(sp.style.top);
  // 相手のチップの山は内側にあるので、ボタンは外側（中央の人は左）
  // 相手が3人のときは卓が混むので、ボタンは名札に付ける（plateの .dbadge）
  if(N()>=4){d.hidden=true;return}
  const out=Math.abs(l-50)<1?-8:(l<50?-7:7);
  d.style.left=(l+out)+'%';d.style.top=(t+1-(matchMedia('(min-width:700px)').matches?3:0))+'%';
}
