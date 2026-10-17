/* ---------- 相手の顔をタップすると反応する（2026-10-10 satou 決定。1.0 は案1〜3） ----------
   案1 目が合う（声なし・ハンド中も）／案2 ハンドの合間のひと言（1〜3回目）／案3 ナイスハンド・大負け・来たばかり
   反応は「キャラ・押した回数・場面（ハンド中／合間）・みんなに見えた出来事」だけで決める。
   手札・勝率・p.tell は見ない（テルにしない）。お金の話はしない。研究：research/相手をタップすると反応_実装仕様.md */
// a: 動き。l: 合間のひと言 1〜3回目（null はこちらを見ない）。nh: ナイスハンドへの返事。lost: 大きく負けた後。greet: 来たばかり
const TAP_REACT={
  'ゲン':{a:'grin',l:['お、なんだい','顔に何かついてるか？','……あんまり見るなって'],nh:'へへ、たまたまだ',lost:'……次だ、次',greet:'よう'},
  'ハル':{a:'nod',l:['ん？','なになに？','もう、見すぎ'],nh:'ありがと！',lost:'うう……次こそ',greet:'こんにちは'},
  '店主':{a:'nod',l:['どうしたの','楽しんでる？','ほら、前を見て'],nh:'あら、どうも',lost:'やられちゃった',greet:'いらっしゃい'},
  'タロウ':{a:'grin',l:['えっ、僕？','な、なんですか','……緊張するなあ'],nh:'ど、どうも！',lost:'あー……',greet:'よろしくです'},
  'ミナ':{a:'nod',l:['どうかした？','集中しなきゃ','……ほら、配られるよ'],nh:'ありがとう',lost:'……今のは痛いな',greet:'よろしくね'},
  'ケンジ':{a:'grin',l:['おっ','なんだよ、照れるな','次いこうぜ'],nh:'サンキュー',lost:'まいったな',greet:'どうも'},
  'ミサキ':{a:'away',l:['……何か？','……どうも',null],nh:'……ありがと',lost:'……',greet:'（会釈）'},
  'ソウ':{a:'nod',l:['やあ','ここ、いい店でしょう','次が配られますよ'],nh:'どうも、ありがとう',lost:'いやあ、やられました',greet:'どうも'},
  'テツ':{a:'grin',l:['おう','どうした','よそ見してると配られるぞ'],nh:'へへ、どうも',lost:'ちくしょう',greet:'おう、よろしく'},
  'ロク':{a:'brow',l:['……なんだ','見てても、何も変わらねえよ','しつこいな'],nh:'ああ',lost:'……チッ',greet:'（軽くあごを上げる）'},
  'セキ':{a:'nod',l:['何か御用かな','落ち着いて、次を待ちなさい',null],nh:'ありがとう',lost:'見事だった',greet:'（静かに会釈）'},
  'レイカ':{a:'brow',l:['何？','見ても、何も出ないわよ','しつこい人は嫌い'],nh:'ありがと',lost:'……まあいいわ',greet:'（目だけで会釈）'},
  'ハヤト':{a:'glare',l:['あ？','見てる暇があったら打てよ','ケンカ売ってんのか'],nh:'当然だろ',lost:'……うるせえ',greet:'……ふん'},
  'クロウ':{a:'still',l:['……','用があるなら言え',null],nh:'（軽く指を上げる）',lost:'……',greet:'（目を合わせない）'},
  'ジン':{a:'still',l:['……前を見ろ','見るなら、打ってる時に見ろ',null],nh:'……ああ',lost:'……',greet:'（小さくうなずく）'},
  '若き日のジン':{a:'look',l:['……何だ','次を見ろ',null],nh:'……ああ',lost:'……',greet:'（うなずく）'},
  'クロダ':{a:'still',l:['……','何か用か',null],nh:'……',lost:'……',greet:'（目を合わせない）'},
  'カオル':{a:'brow',l:['あら、何かしら','見ても、変わらないわよ','もういいでしょう'],nh:'ふふ、ありがと',lost:'やられたわね',greet:'（微笑んで会釈）'},
  'ゴウ':{a:'glare',l:['……あ？','なに見てんだ','次は容赦しねえぞ'],nh:'ふん',lost:'……覚えとけ',greet:'……'}
};
TAP_REACT['老人']=TAP_REACT['ジン'];
// 名前の無い相手（店の常連・船の客など）は型で分ける
const TAP_TYPE={
  cool:{a:'look',l:['……','何か？',null],nh:'どうも',lost:'……',greet:'（軽く会釈）'},
  easy:{a:'nod',l:['どうも','何か？','……見すぎだよ'],nh:'ありがとう',lost:'今のは参った',greet:'よろしく'},
  rough:{a:'glare',l:['あ？','見てんじゃねえよ',null],nh:'ふん',lost:'……チッ',greet:'……'}
};
const TAP_NH='ナイスハンド';
// 動き（svg に重ねる。motion() と同じやり方）。[下へ%, 回転deg, 大きさ, 横へ%]
const TAP_MOVE={
  look:[[0,0,1,0],[2,0,1.04,0],[2,0,1.04,0],[0,0,1,0]],
  glare:[[0,0,1,0],[4,0,1.08,0],[4,0,1.08,0],[0,0,1,0]],
  away:[[0,0,1,0],[0,-6,1,-4],[0,-6,1,-4],[0,0,1,0]],
  nod:[[0,0,1,0],[3,0,1,0],[0,0,1,0],[2,0,1,0],[0,0,1,0]],
  grin:[[0,0,1,0],[0,4,1,0],[1.5,-2,1,0],[0,3,1,0],[0,0,1,0]],
  still:[[0,0,1,0],[0,0,1,0],[0,0,1,1.2],[0,0,1,1.2],[0,0,1,0]],
  brow:[[0,0,1,0],[0,-3,1.03,0],[0,-3,1.03,0],[0,0,1,0]]
};
function tapOf(p){return TAP_REACT[p.name]||(typeof MANNERS!=='undefined'&&MANNERS[p.name]?TAP_TYPE.rough:rankOf(p.name)>=3?TAP_TYPE.cool:TAP_TYPE.easy)}
// 声を出さない場面：第7章（ジンとの勝負）、第二部の最後、最後のハンド、回想、台本の手
function tapQuiet(){return !!(CFG.flashback||CFG.ch&&(CFG.ch.no===7||CFG.ch.p2===5)||S.finalHand||S.scriptAI||S.autoMe)}
// 反応しない時：相手の番、テルのアップ・見せ場、ほかの画面が上にある時
function tapBlocked(p,i){
  if(!S||!S.players||!p||p.human||p.out||p.sitOut||$('game').hidden)return true;
  if(!S.handOver&&S.toAct===i)return true;
  if(S.stare>=0||S.readLook>=0||camState.kind!=='wide'&&camState.i===i)return true;
  if(typeof bBlocked==='function'&&bBlocked())return true;
  return ['vs','help','setPanel','stackZoom','moreDlg','review'].some(id=>$(id)&&!$(id).hidden)}
function tapMove(i,kind){const b=$('bust'+i),svg=b&&b.querySelector('.av');const K=TAP_MOVE[kind];
  if(!svg||!svg.animate||!K||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  svg.animate(K.map(([y,r,s,x])=>({transform:`translate(${x}%,${y}%) rotate(${r}deg) scale(${s})`})),{duration:kind==='nod'?900:1400,easing:'ease-in-out'})}
function tapSay(p,line){if(!line)return;p.say={seq:(S.saySeq=(S.saySeq||0)+1),act:'',line,talk:true,tap:true};render()}
// あなたの「ナイスハンド」は、自分の手の上に小さく出す
function tapMe(line){const t=$('table');let m=$('tapMe');if(!m){m=document.createElement('div');m.id='tapMe';m.className='tapme';m.setAttribute('aria-live','polite');t.appendChild(m)}
  m.textContent=`あなた：「${line}」`;m.classList.remove('go');void m.offsetWidth;m.classList.add('go');clearTimeout(m._t);m._t=setTimeout(()=>m.classList.remove('go'),1900)}
// 大きく負けた人：ショーダウンまで残って、取れず、自分のチップの3割以上（または10BB以上）を入れた
const tapLost=p=>S.handOver&&!p.folded&&!(p.won>0)&&p.total>0&&p.total>=Math.max(BB()*10,(p.chips+p.total)*.3);
// 来たばかり：卓の最初のハンド、または補充して席に戻ったハンド
const tapNew=p=>S.handNo<=1||p.tapBack===S.handNo;
function tapFace(i){const p=S&&S.players&&S.players[i];if(tapBlocked(p,i))return;
  // 「話す」で相手を選んでいる途中なら、顔のタップ＝その相手を選ぶ
  if(S.handOver&&S.chatPick===S.handNo&&typeof chatTo==='function'){chatTo(i);return}
  const r=tapOf(p),now=performance.now();
  if(S.nmSeen&&S.nmSeen[i])S.nmSeen[i].until=now+(typeof NM_SHOW!=='undefined'?NM_SHOW:1800);   // 名前の見せ方 案3（js/33_names.js）：顔のタップでも呼び名を出す
  render();
  const busy=p.say&&now-(p.sayAt||0)<2600;
  if(!S.handOver||S.result||tapQuiet()){tapMove(i,r.a);render();return}   // 案1：ハンド中は声なし
  const G=S.tapGap&&S.tapGap.h===S.handNo?S.tapGap:(S.tapGap={h:S.handNo,n:{},done:{}});
  // 案3：その場の出来事（1人1回ずつ）
  if(p.won>0&&!G.done[p.name]){G.done[p.name]=1;tapMe(TAP_NH);setTimeout(()=>{if(S.handOver&&S.players[i]===p){tapMove(i,r.a);tapSay(p,r.nh)}},500);return}
  if(tapLost(p)&&!G.done[p.name]){G.done[p.name]=1;tapMove(i,'away');if(!busy)tapSay(p,r.lost);return}
  if(tapNew(p)&&!G.done[p.name]){G.done[p.name]=1;tapMove(i,'nod');if(!busy)tapSay(p,r.greet);return}
  // 案2：合間のひと言。3回目のあと（null の後）はこちらを見ない
  const k=G.n[p.name]=(G.n[p.name]||0)+1,line=r.l[k-1];
  if(k>3||k>1&&r.l[k-2]===null||line===null){render();return}
  tapMove(i,r.a);if(!busy)tapSay(p,line)}
$('busts').addEventListener('click',e=>{const b=e.target.closest('.bust');if(!b)return;tapFace(+b.id.replace('bust',''))});
{const _sh=startHand;startHand=function(){const was=S&&S.players?S.players.map(p=>p.out):[];const r=_sh.apply(this,arguments);
  try{S.players.forEach((p,k)=>{if(was[k]&&!p.out)p.tapBack=S.handNo})}catch(e){}return r}}
