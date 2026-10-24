/* ---------- 配りを変える入口（research/配り札と場札の操作_実装仕様.md §2-1・§4・§7。satou 2026-10-21 18:21Z「両方よさそうです」、18:26Z「おすすめでお願いします」） ----------
   配りを変える仕組みは、必ずここに登録する（LT.dealMod）。フリー対戦・はしご・裏の卓・回想では何も呼ばない（LT.dealOk）。
   when：'hand'＝配った直後（23_house_rules.js の startHand から LT.dealRun('hand')。この後の setupScript が決まった札の場面を上書きする）
         'board'＝場札を配る前（nextStreet:before）
   words：遊び方の説明（13_beginner.js）とストアの説明（launch/ストア掲載素材.md・release/ストア掲載_英語版.md）に要る語 {ja,en}。
   qa/checks/text.js（ブラウザで LT.DEAL_MODS を読む）と dev/tools/lint/check.js（組み立てたファイルの LT.dealMod( の行を読む）が、全部書いてあるか見る。
   words を持たない登録は、同じ行に「// words なし：理由」を書く（lint が見る）。
   山（S.deck）と手札（p.hand）を書き換えてよいのは、この入口と決まったファイルだけ（lint が見る）。勝ちは配らない：場面・手札・フロップだけ。
   ターン・リバーは readGuard（正しく読んでコールした後）とボス保護（自分の結果は変えない）だけが触る。 */

// @unit-begin deal_mod（qa/unit/tests/deal.js が Node から読む。画面や S・CFG に触らない。19_deck_eval.js の関数と Rules だけ）
Rules.deal={
  // 山の残りから場札5枚（配る順。バーンは1枚ずつ捨てる。24_dokidoki_camera.js の nextStreet と同じ）
  board(deck,board){const d=deck.slice(),b=board.slice();while(b.length<5){d.pop();const n=b.length?1:3;for(let k=0;k<n;k++)b.push(d.pop())}return b},
  // 次に配るフロップ（まだ場札が無いとき）
  flop(deck){const n=deck.length;return[deck[n-2],deck[n-3],deck[n-4]]},
  // 自分の札を含む4枚のフラッシュ／4枚のストレート
  draw4(h,b){const cs=h.concat(b);for(let s=0;s<4;s++)if(cs.filter(c=>c.s===s).length>=4&&h.some(c=>c.s===s))return true;
    const rs=new Set(cs.map(c=>c.r));if(rs.has(14))rs.add(1);const mine=r=>h.some(c=>c.r===r||(r===1&&c.r===14));
    for(let lo=1;lo<=10;lo++){let n=0,m=false;for(let r=lo;r<lo+5;r++)if(rs.has(r)){n++;if(mine(r))m=true}if(n>=4&&m)return true}return false},
  // 自分の札が絡んでいる：自分の札でペア以上（場だけのペアは数えない）か、4枚のドロー
  connects(h,b){return !isWeak(h,b)||Rules.deal.draw4(h,b)},
  // 相手に何も当たっていない（ブラフが通りやすい場）：自分の札でペア以上が無く、4枚のドローも無い
  air(h,b){return !Rules.deal.connects(h,b)},
  // フロップで2番目か3番目のペア（自分の2枚はペアでない。もう1枚は場に無い）
  midPair(h,f){if(h[0].r===h[1].r)return false;const fr=[...new Set(f.map(c=>c.r))].sort((a,b)=>b-a);if(fr.length!==3)return false;
    const on=h.filter(c=>fr.includes(c.r));return on.length===1&&fr.indexOf(on[0].r)>0&&bestN(h.concat(f))[0]===1},
  // 自分の役が相手全員に勝っている
  ahead(me,opps,b){const m=bestN(me.concat(b));return opps.every(o=>cmp(m,bestN(o.concat(b)))>0)},
  // 案2：今勝っている自分が、残りの場札でも勝ったままになる山。今の山のままでよければ deck をそのまま、見つからなければ null（51_play6_fixes.js の won() と同じ探し方）
  keepWin(deck,board,me,opps,tries,shuf){const ok=d=>Rules.deal.ahead(me,opps,Rules.deal.board(d,board));
    if(ok(deck))return deck;for(let t=0;t<tries;t++){const d=shuf(deck.slice());if(ok(d))return d}return null},
  // 山 D から、ok(2枚) を満たす2枚の位置をでたらめに1組（無ければ null）
  pick(D,ok,rnd){const c=[];for(let a=0;a<D.length;a++)for(let b=a+1;b<D.length;b++)if(ok([D[a],D[b]]))c.push([a,b]);return c.length?c[Math.floor(rnd()*c.length)]:null},
};
// 決まった札の型（§8）：h＝自分、b＝相手役、d＝場札（配る順：フロップ3枚・ターン・リバー）、alt＝数字の幅（'Q>8'＝Q を 8 にする。1回に1つ、使わないこともある）。
// 配るたびに、スートの入れ替え（24通り）・数字の幅・フロップの3枚の並び（6通り）をばらし、形（shape）が型と同じか確かめる（最大50回、だめなら型のまま）。
// 4＝第4章の一騎打ち（レイカのブラフ、降りなければ自分の勝ち）、5＝第5章の一騎打ち（ハヤト）、7＝第7章の最後（ジンが強い、降りるのが正解）、
// bb＝第5章の最初の1手（自分にオーバーペア、リバーでハヤトのフラッシュ）、rush＝第二部第3章の急ぐ1手（カイにペア）、mf＝第二部第5章の最後（師匠にセット）。
// 数字の幅は、組み立ての前に全部の組み合わせを評価関数で確かめてある（qa/unit/tests/deal.js が毎回確かめる）
Rules.kata={
  KATA:{
  '4':[{h:'K♥ J♣',b:'Q♠ T♠',d:'J♦ 9♠ 4♠ 2♥ 3♦',alt:'Q>8 9>5 9>8 4>6 2>6 3>5'},
    {h:'8♣ 8♦',b:'A♥ 5♥',d:'K♥ 7♥ 3♣ T♠ 2♦',alt:'8>9 5>4 K>Q 3>4 3>Q 2>4'},
    {h:'A♦ 9♣',b:'6♠ 5♠',d:'9♥ 8♦ 2♠ K♣ Q♥',alt:'9>T 5>7 8>4 2>4 K>J Q>4'},
    {h:'Q♦ T♣',b:'8♥ 7♥',d:'T♥ 6♥ 2♣ K♠ 3♦',alt:'Q>J 8>5 7>9 6>5 2>5 3>4'},
    {h:'A♠ J♥',b:'9♣ 8♣',d:'J♣ T♦ 4♣ 2♠ 5♥',alt:'J>Q 9>6 8>7 T>7 4>6 2>6'}],
  '5':[{h:'Q♣ Q♦',b:'A♠ J♠',d:'T♦ 6♣ 3♥ 8♠ 2♣',alt:'Q>K T>5 6>5 3>5 8>4 2>4'},
    {h:'7♠ 7♥',b:'5♦ 4♦',d:'9♣ 6♦ 2♠ K♥ J♣',alt:'7>8 4>3 9>T 6>T 2>T K>Q'},
    {h:'A♣ Q♠',b:'J♥ T♥',d:'Q♥ 8♥ 3♣ 2♠ 5♦',alt:'A>K J>K 8>6 3>4 2>4 5>4'},
    {h:'J♠ J♣',b:'A♦ 3♦',d:'T♦ 8♠ 2♦ 5♣ K♠',alt:'J>Q 3>7 T>7 8>9 2>7 5>6'},
    {h:'K♦ T♠',b:'Q♣ J♣',d:'K♣ 9♥ 4♣ 2♦ 6♠',alt:'K>A 9>5 4>3 4>8 2>7 6>5'}],
  '7':[{h:'A♣ K♦',b:'7♥ 7♠',d:'A♠ 7♦ 2♣ 9♥ 4♠',alt:'A>Q 7>T 2>6 9>3 9>T 4>6'},
    {h:'K♠ Q♠',b:'J♣ T♣',d:'K♦ Q♣ 9♥ 8♦ 3♠',alt:'9>A 8>4 8>6 8>A 3>4 3>6'},
    {h:'J♥ J♦',b:'A♥ A♣',d:'9♠ 5♣ 2♥ 3♦ K♣',alt:'J>T 9>7 5>6 2>4 2>8 3>7'},
    {h:'Q♥ J♥',b:'K♣ K♠',d:'Q♠ 8♦ 3♣ 6♥ 2♠',alt:'Q>9 8>4 8>T 3>9 6>7 2>5'},
    {h:'A♥ T♦',b:'T♣ T♥',d:'A♦ T♠ 5♣ 8♠ 2♦',alt:'A>J 5>3 5>J 8>6 8>Q 2>7'}],
  bb:[{h:'A♠ A♥',b:'9♦ 8♦',d:'K♦ 7♦ 2♣ 3♠ 6♦',alt:'9>T K>J 7>T 2>T 3>5 6>4'},
    {h:'K♣ K♥',b:'8♠ 7♠',d:'Q♠ 6♠ 2♦ 4♣ 3♠',alt:'K>A 7>9 Q>T 6>T 2>J 4>J'},
    {h:'Q♦ Q♣',b:'T♥ 9♥',d:'J♥ 5♥ 2♠ 8♣ 4♥',alt:'Q>K T>A J>3 5>3 2>6 8>7'}],
  rush:[{h:'A♥ J♥',b:'Q♠ Q♦',d:'K♣ 8♦ 3♠ 6♣ 2♥',alt:'Q>7 8>4 8>T 3>9 6>7 2>5'},
    {h:'K♠ Q♠',b:'J♥ J♣',d:'A♦ 7♣ 4♥ 9♦ 2♠',alt:'J>8 7>5 4>3 4>T 9>6 2>5'},
    {h:'A♦ T♦',b:'T♠ T♣',d:'9♥ 6♣ 3♠ Q♦ 2♣',alt:'A>8 9>4 6>4 3>4 Q>J 2>7'}],
  mf:[{h:'A♣ K♦',b:'9♥ 9♠',d:'A♠ 9♦ 2♣ J♥ 4♠',alt:'A>Q 9>T 2>7 J>3 J>T 4>6'},
    {h:'K♥ Q♣',b:'6♣ 6♦',d:'K♠ 6♥ 3♦ T♣ 2♠',alt:'K>A 6>5 3>8 T>5 T>9 2>7'},
    {h:'Q♠ J♠',b:'8♥ 8♣',d:'Q♦ 8♠ 4♥ 2♣ 7♦',alt:'Q>9 J>T 4>5 4>T 2>9 7>5'}]

  },
  rk(t){return{A:14,K:13,Q:12,J:11,T:10}[t]||+t},
  card(t){return{r:Rules.kata.rk(t.slice(0,-1)),s:'♠♥♦♣'.indexOf(t.slice(-1))}},
  cards(s){return s.split(' ').map(Rules.kata.card)},
  // 型の形：2人の preTier、フロップ・ターン・リバーごとの勝ち負け・役の種類（ワンペアはトップ以上か）
  shape(h,b,bd){const top=(x,s)=>s[0]===1?(s[1]>=Math.max(...x.map(c=>c.r))?'t':'l'):'';
    return preTier(h)+','+preTier(b)+'/'+[3,4,5].map(n=>{const x=bd.slice(0,n),a=bestN(h.concat(x)),c=bestN(b.concat(x)),d=cmp(a,c);return[d>0?1:d<0?-1:0,a[0]+top(x,a),c[0]+top(x,c)].join()}).join('|')},
  // perm：スートの入れ替え（長さ4）、alt：'Q>8' か ''、ord：フロップ3枚の並び。札が重なれば null
  apply(k,perm,alt,ord){const m={};if(alt){const [a,b]=alt.split('>');m[Rules.kata.rk(a)]=Rules.kata.rk(b)}
    const f=c=>({r:m[c.r]||c.r,s:perm[c.s]}),h=Rules.kata.cards(k.h).map(f),b=Rules.kata.cards(k.b).map(f),d0=Rules.kata.cards(k.d).map(f),bd=[d0[ord[0]],d0[ord[1]],d0[ord[2]],d0[3],d0[4]];
    const all=h.concat(b,bd);if(new Set(all.map(c=>c.r*4+c.s)).size!==all.length)return null;return{h,b,bd}},
  base(k){return Rules.kata.apply(k,[0,1,2,3],'',[0,1,2])},
  same(k,v){const o=Rules.kata.base(k);return !!v&&Rules.kata.shape(v.h,v.b,v.bd)===Rules.kata.shape(o.h,o.b,o.bd)},
  perm(n,rnd){const a=[...Array(n).keys()];for(let i=n-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a},
  vary(k,rnd){const alts=[''].concat(k.alt?k.alt.split(' '):[]);
    for(let t=0;t<50;t++){const perm=Rules.kata.perm(4,rnd),alt=alts[Math.floor(rnd()*alts.length)],ord=Rules.kata.perm(3,rnd),v=Rules.kata.apply(k,perm,alt,ord);
      if(Rules.kata.same(k,v))return Object.assign(v,{perm,alt,ord})}
    return Object.assign(Rules.kata.base(k),{perm:[0,1,2,3],alt:'',ord:[0,1,2]})},
  // 保存の「直近の型」を配列に（前の版は数字1つ）。最大3つ、古い順
  recent(v){const a=Array.isArray(v)?v:v===undefined||v===null||v===''?[]:[v];return a.filter(x=>typeof x==='number'||typeof x==='string'&&x.trim()!=='').map(x=>+x).filter(x=>Number.isInteger(x)&&x>=0).slice(-3)},
  // 直近に使った型を避けて選ぶ（直近 ex(n) 回。いつも2つ以上から選べるように 型の数−2 回まで。3型なら直前の1つだけ外す。v0.98.2 は 型の数−1 回で、3型が 012012… と決まった順に回った）
  ex(n){return Math.max(1,Math.min(3,n-2))},
  // 第5章の最初の1手の台詞は、配られた手札（型と数字の幅で AA・KK・QQ になる）に合わせる（Godot 移植の報告 2026-10-22：KK・QQ でも「AAが来た」と出ていた）。
  //   qa/unit/tests/deal.js が、型の全部のばらし方で手札に合う台詞があるかを確かめる
  pairName(h){if(!h||h.length!==2||h[0].r!==h[1].r)return null;const l={14:'A',13:'K',12:'Q',11:'J',10:'T'}[h[0].r]||String(h[0].r);return l+l},
  BB_LINES:{
    AA:{deal:['AAが来た。いちばん強い手札だ','Pocket aces. The best starting hand there is.'],ask:['ハヤトのオールイン。AAで受けるか？','Hayato is all-in. Call with your aces?'],jin:['AAでも負ける。……ここからだ。少ないチップで、一つずつ取り返せ','Even aces lose. ...This is where it starts. Win it back with a short stack, one pot at a time.']},
    KK:{deal:['KKが来た。2番目に強い手札だ','Pocket kings. The second-best starting hand.'],ask:['ハヤトのオールイン。KKで受けるか？','Hayato is all-in. Call with your kings?'],jin:['KKでも負ける。……ここからだ。少ないチップで、一つずつ取り返せ','Even kings lose. ...This is where it starts. Win it back with a short stack, one pot at a time.']},
    QQ:{deal:['QQが来た。3番目に強い手札だ','Pocket queens. The third-best starting hand.'],ask:['ハヤトのオールイン。QQで受けるか？','Hayato is all-in. Call with your queens?'],jin:['QQでも負ける。……ここからだ。少ないチップで、一つずつ取り返せ','Even queens lose. ...This is where it starts. Win it back with a short stack, one pot at a time.']}},
  // 手札に合う台詞（日本語）。合う台詞が無いときは AA の台詞にせず、手札の名前を入れない言い方にする
  bbLine(h,k){const n=Rules.kata.pairName(h),L=n&&Rules.kata.BB_LINES[n];return L?L[k][0]:{deal:'強いペアが来た',ask:'ハヤトのオールイン。受けるか？',jin:'強い手でも負ける。……ここからだ。少ないチップで、一つずつ取り返せ'}[k]},
  pick(n,recent,rnd){const ex=recent.slice(-Rules.kata.ex(n)),c=[];for(let i=0;i<n;i++)if(!ex.includes(i))c.push(i);const l=c.length?c:[...Array(n).keys()];return l[Math.floor(rnd()*l.length)]},
};
// @unit-end deal_mod
try{Object.values(Rules.kata.BB_LINES).forEach(L=>Object.values(L).forEach(([ja,en])=>{EN_DICT[ja]=en}));Object.assign(EN_DICT,{'強いペアが来た':'A strong pair.','ハヤトのオールイン。受けるか？':'Hayato is all-in. Call?','強い手でも負ける。……ここからだ。少ないチップで、一つずつ取り返せ':'Even strong hands lose. ...This is where it starts. Win it back with a short stack, one pot at a time.'})}catch(e){}

// 遊び方（13_beginner.js）とストアの説明（launch/ストア掲載素材.md・release/ストア掲載_英語版.md）の公平の段落に要る語（§8-3：細かい仕組みは書かず、調整していることを一文で。
// フリー対戦が公平なことも書く）。qa/checks/text.js と dev/tools/lint/check.js がこれを読む。登録ごとの words は仕組みの説明（今は説明の文には求めない）
LT.DEAL_NOTE={ja:['配る札を調整しています','フリー対戦'],en:['the deal is adjusted','free play']};
LT.DEAL_MODS=[];
LT.dealMod=(name,when,fn,words)=>LT.DEAL_MODS.push({name,when,fn,words});
// 'hand' のときは S.scriptAI・S.finalHand がまだ前のハンドの値（setupScript がこの後で決める）なので見ない。決まった札の場面は setupScript が上書きする
LT.dealOk=when=>{try{return !!(S&&S.players&&CFG&&CFG.ch&&!CFG.flashback&&!CFG.ura&&!CFG.run&&!S.duelHand&&(when==='hand'||!S.scriptAI&&!S.finalHand))}catch(e){return false}};
LT.dealRun=when=>{if(when==='hand'&&S)S.dealLog=[];if(!LT.dealOk(when))return;
  const D=S.dealDone=S.dealDone||{};S.dealLog=S.dealLog||[];
  for(const m of LT.DEAL_MODS){if(m.when!==when||D[m.name]===S.handNo)continue;   // 1ハンドに同じ仕組みは1回まで
    try{if(m.fn()){D[m.name]=S.handNo;S.dealLog.push({h:S.handNo,name:m.name})}}catch(e){console.error('[dealMod]',m.name,e)}}};
LT.on('nextStreet:before',()=>{if(S&&!S.handOver&&!S.reveal&&['preflop','flop','turn'].includes(S.street))LT.dealRun('board')});

const dmRnd=()=>LT.rand();
// 目標の場面で自分に配った2枚（直近3回。数字とスートで比べる。ページを開いている間だけ）
const DM_MINE=[],dmKey=h=>h.map(c=>c.r*4+c.s).sort((a,b)=>a-b).join();
const dmShuf=a=>shuffle(a);
// この卓の今のハンドの席（startHand の Rules.seats と同じ引数。Rules.seats は何も書き換えない）
function dmSeats(){const dead=!!CFG.levels&&S.bbSeat>=0&&S.players[S.bbSeat]!=null;return Rules.seats(S.players.map(p=>!p.out),S.dealer,dead,S.sbSeat,S.bbSeat)}
// 手札1人分を、山から ok を満たす2枚と入れ替える（元の2枚は山の底へ）
function dmSwap(p,ok){const D=S.deck,k=Rules.deal.pick(D,ok,dmRnd);if(!k)return false;const nw=[D[k[0]],D[k[1]]];D.splice(k[1],1);D.splice(k[0],1);D.unshift(...p.hand);p.hand=nw;return true}
// 弱い手が続いたとき、次は遊べる手以上にする回数（第1章は2回まで続いてよい）
const dmWeakMax=()=>CFG.ch&&!CFG.ch.p2&&CFG.ch.no===1?2:1;
const dmNeedPlay=()=>(S.weakRun||0)>=dmWeakMax();

// ===== 手札：強い手（第6章・第14章。中身は js/51_play6_fixes.js） =====
LT.dealMod('p6Premium','hand',p6Premium,{ja:'強い手',en:'strong hand'});
// ===== 手札：弱い手の引き直し（中身は js/49_play35_fixes.js）。強い手を配ったハンドは引き直さない =====
LT.dealMod('dealHelp','hand',()=>S.dealDone.p6Premium!==S.handNo&&dealHelp(),{ja:'弱い手',en:'weak starting hands'});

// ===== §7 A noWeakRun：弱い手は続けない =====
function noWeakRun(){const me=S.players[0];if(!me||me.out||!me.hand||me.hand.length!==2||preTier(me.hand)>0||!dmNeedPlay()||S.deck.length<12)return false;
  return dmSwap(me,h=>preTier(h)>=1)}
LT.dealMod('noWeakRun','hand',noWeakRun,{ja:'遊べる手が来やすい',en:'playable hands'});
// 続いた弱い手の数（配り終わった後の手で数える。決まった札の場面・一騎打ち・第7章の最後は数えない）
LT.on('startHand',()=>{try{if(!LT.dealOk('board'))return;const me=S.players[0];if(!me||me.out||!me.hand||me.hand.length!==2)return;
  S.weakRun=preTier(me.hand)===0?(S.weakRun||0)+1:0}catch(e){}});

// ===== 案1・§7 C lessonScene：章の目標の場面（第2・3・4章と第二部第2章。3ハンドのうち2ハンド） =====
function lessonKind(){const ch=CFG.ch,g=CFG.goal;if(!ch||!g)return'';
  if(!(ch.p2?ch.p2===2:[2,3,4].includes(ch.no)))return'';
  const t=g.type,n=t==='steal'?S.steals:t==='bluff'?S.bluffs:t==='readcall'?(S.reads||0):-1;
  return ['steal','bluff','readcall'].includes(t)&&n>=0&&n<(g.n||0)?t:''}
function lessonScene(){const kind=lessonKind();if(!kind||S.handNo%3===0)return false;
  const ps=S.players,me=ps[0];if(!me||me.out||!me.hand||me.hand.length!==2||S.deck.length<20)return false;
  const st=dmSeats(),opps=ps.filter(p=>!p.out&&!p.human);if(!opps.length)return false;
  if(kind==='steal'){   // 自分がボタン（3人卓では最初に動く）のとき、ブラインドの人に弱い手
    if(st.dealer!==0)return false;let ch=false;
    [st.sb,st.bb].filter((j,k,a)=>j>0&&a.indexOf(j)===k).forEach(j=>{const p=ps[j];if(p&&!p.out&&preTier(p.hand)>0&&dmSwap(p,h=>preTier(h)===0))ch=true});
    if(ch)S.lesson={kind,h:S.handNo};return ch}
  // bluff：自分が最後に動ける席（ボタン）。readcall：相手の1人に弱い手、自分にフロップで2番目か3番目のペア
  const mine=kind==='readcall',who=mine?[me,...opps]:opps;if(kind==='bluff'&&st.dealer!==0)return false;
  const need=dmNeedPlay(),pool=who.flatMap(p=>p.hand).concat(S.deck);
  for(let t=0;t<300;t++){const d=dmShuf(pool.slice()),hs=who.map(()=>[d.pop(),d.pop()]),f=Rules.deal.flop(d);
    const ok=mine?(hs.slice(1).some(h=>preTier(h)===0)&&Rules.deal.midPair(hs[0],f)&&(!need||preTier(hs[0])>=1)&&!DM_MINE.includes(dmKey(hs[0])))   // 直近3回と同じ2枚は配らない（§8-1）
      :(hs.every(h=>preTier(h)===0)&&hs.every(h=>Rules.deal.air(h,f)));
    if(ok){who.forEach((p,k)=>{p.hand=hs[k]});S.deck=d;S.lesson={kind,h:S.handNo};if(mine){DM_MINE.push(dmKey(hs[0]));DM_MINE.splice(0,DM_MINE.length-3)}return true}}
  return false}
LT.dealMod('lessonScene','hand',lessonScene,{ja:'章の目標',en:'chapter goal'});

// ===== §7 B flopConnect：フロップを自分の手に絡める（フロップを配る前だけ。相手の手は変えない） =====
function flopConnect(){const me=S.players[0];if(S.street!=='preflop'||S.board.length||!me||!inHand(me)||me.hand[0].r===me.hand[1].r||S.deck.length<8)return false;
  if(LT.rand()>=.6)return false;
  const opps=S.players.filter(p=>p!==me&&inHand(p)),bl=S.lesson&&S.lesson.h===S.handNo&&S.lesson.kind==='bluff';
  // 第3章の目標の場面（相手に絡まない場札）と同じハンドなら、両方が合う並びだけ。合わなければ目標の場面のまま
  const ok=d=>{const f=Rules.deal.flop(d);return Rules.deal.connects(me.hand,f)&&(!bl||opps.every(p=>Rules.deal.air(p.hand,f)))};
  if(Rules.deal.connects(me.hand,Rules.deal.flop(S.deck)))return false;
  for(let t=0;t<300;t++){const d=dmShuf(S.deck.slice());if(ok(d)){S.deck=d;return true}}
  return false}
LT.dealMod('flopConnect','board',flopConnect,{ja:'場札が自分の手に絡みやすい',en:'the flop connects with your hand'});

// ===== 案2 readGuard：相手のブラフのテルにコールして、その時点で勝っていれば、残りの場札で逆転されない（第4章以降の物語の章） =====
function readGuard(){const ch=CFG.ch;if(!ch||!(ch.p2||ch.no>=4)||S.board.length<3||S.board.length>=5)return false;
  const me=S.players[0];if(!me||!inHand(me))return false;
  const opps=S.players.filter(p=>p!==me&&inHand(p));if(!opps.length)return false;
  // 今のストリートで、残っている CPU がブラフ（本当がブラフ。見せかけのクセも含む）でクセを出して賭け、自分は降りずに残っている
  if(!opps.some(p=>(p.tellLog||[]).some(t=>t&&t.truth==='bluff'&&t.street===S.street)))return false;
  if(!Rules.deal.ahead(me.hand,opps.map(p=>p.hand),S.board))return false;
  S.rgHold=S.handNo;
  const d=Rules.deal.keepWin(S.deck,S.board,me.hand,opps.map(p=>p.hand),400,dmShuf);
  if(!d||d===S.deck)return false;S.deck=d;return true}
LT.dealMod('readGuard','board',readGuard,{ja:'クセを読んで',en:'read a tell'});

// ===== ボス保護（第6章・第14章。中身は js/51_play6_fixes.js）。readGuard の後に呼ぶ（自分の結果は元の並びと同じものだけを使うので、読み勝ちも残る） =====
LT.dealMod('bossRunout','board',p6Runout);   // words なし：ほかの客どうしの勝負の場札だけで、自分の結果は変えない

// ===== §8 決まった札を型で配る（第5章の最初の1手・第4・5章の一騎打ち・第7章の最後・第二部第3章の急ぐ1手・第5章の最後。回想は今のまま） =====
// 型を選んで（直近の型は避ける。保存 shisho-story の deal に {"7":[2,0,4]} の形で直近3つ）、ばらして、rig（10_scripted.js）で配る
function kataDeal(key,boss){const L=Rules.kata.KATA[key];if(!L)return;
  let k=0;try{const t=loadStory();t.deal=t.deal||{};const rec=Rules.kata.recent(t.deal[key]);k=Rules.kata.pick(L.length,rec,dmRnd);t.deal[key]=rec.concat(k).slice(-3);saveStory(t)}catch(e){}
  const v=Rules.kata.vary(L[k],dmRnd);S.dealPick59={key,k,alt:v.alt,perm:v.perm.join(''),ord:v.ord.join('')};
  rig({[S.players[0].name]:v.h,[boss]:v.b},v.bd)}
// 最後の1手が来るハンド目（その卓で1回決める）
function kataAt(lo,hi){if(S.kataAt==null)S.kataAt=lo+Math.floor(LT.rand()*(hi-lo+1));return S.kataAt}
