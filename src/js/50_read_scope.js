/* ---------- クセの読める範囲（改善提案 2026-10-18 §1 案A「台詞と印」、satou 2026-10-18 02:35Z 決定） ---------- */
// 自分を入れて3人以上が残っているハンドでクセの札が出たら、札に小さく「レイカだけ」と印を付ける（クセが教えるのは賭けた本人の手だけ）。
// 初めてのときだけ、師匠のひとこと（セーブに1回）。1対1は今まで通り。表示だけで、CPU・ボットの打ち方は変えない
// 仕様：research/クセの読める範囲_実装仕様.md
const READ_SCOPE_LINE_JA='クセで分かるのは、賭けたそいつの手だけだ。このあとに動く人の手までは分からん',READ_SCOPE_TAG_JA='{0}だけ',READ_SCOPE_TAG0_JA='この人だけ';
const RS_KEY='shisho-readscope';
if(typeof SAVE_KEYS!=='undefined'&&!SAVE_KEYS.includes(RS_KEY))SAVE_KEYS.push(RS_KEY);
// 第7章（ジンとの一騎打ち。本物のテルには触れない）・回想・物語の決めのハンドでは出さない
const rsOff=()=>!CFG||CFG.flashback||(CFG.ch&&(CFG.ch.script==='final'||(!CFG.ch.p2&&CFG.ch.no===7)))||!S||S.storyHand;
// 自分と本人のほかに、降りていない相手が1人以上
function rsMulti(p){const me=S.players[0];return !!me&&inHand(me)&&S.players.some(o=>o!==p&&!o.human&&inHand(o))}
// 印の名前は who()（まだ名乗っていない相手は見た目の呼び名。p.name をそのまま出すと名前がばれる）
// v94 レビュー 2：縦（520px 未満）は印を札と同じ行に並べる（2行だと下へ伸びて本人の目にかかる）。長い呼び名（青緑のスカーフ）は「この人だけ」に縮める
const rsNarrow=()=>innerWidth<520&&innerHeight>innerWidth;
function rsTag(p){const n=typeof who==='function'?who(p.name):'';return n&&!(rsNarrow()&&n.length>4)?READ_SCOPE_TAG_JA.replace('{0}',n):READ_SCOPE_TAG0_JA}
// v94.1 レビュー：はじめての人の案内（30b の tipShow）が師匠の帯を止めている間は言わない（見たことにもしない）。案内が消えた後の描き直しで言う
const rsTipHeld=()=>{try{const s=$('sensei');return !!(typeof tipK!=='undefined'&&tipK)||!!(s&&s.classList.contains('mwait'))}catch(e){return false}};
function rsLine(){if(S.rsSaid||rsTipHeld())return;const s=saveGet(RS_KEY,{v:1,seen:false})||{};if(s.seen)return;S.rsSaid=1;
  if(typeof uraLv==='function'&&uraLv()>=7)return;   // 裏の卓7段目からは師匠のひとことが出ないので、見たことにしない
  jinNote(READ_SCOPE_LINE_JA,0);saveSet(RS_KEY,{v:1,seen:true},1);
  // v94 レビュー 1：描き直しの中で決めるので、#senseiText はもう書かれている。もう一度描いて、このハンドのうちに出す（41_more_fun の mfBigFirst と同じ）。
  // 0 ハンド：1 にすると第4章のクセの手引きが2ハンド止まる
  setTimeout(()=>{try{render()}catch(e){}},0)}
LT.on('render',()=>{try{if(!S||!S.players)return;const off=S.handOver||rsOff();
  S.players.forEach((p,i)=>{const cb=$('cue'+i);if(!cb)return;
    const on=!off&&!!p.tell&&p.tell.meaning!=='none'&&rsMulti(p);   // クロウの手袋（meaning 'none'）には付けない
    let t=cb.querySelector('.rsOnly');   // 27_render は札の seq が変わると textContent を書き直すので、そのたびに付け直す
    if(on&&!t){t=document.createElement('small');t.className='rsOnly';cb.appendChild(t)}
    cb.classList.toggle('rsIn',on&&rsNarrow());
    if(t){if(t.hidden!==!on)t.hidden=!on;if(on){const x=rsTag(p);if(t.textContent!==x)t.textContent=x}}
    if(on)rsLine()})}catch(e){}});
LT.on('startHand',()=>{if(S)S.rsSaid=0});
// v94 レビュー 2：印の付いた札が本人の目の高さ（faceBox の上から 35〜55%）にかかるときは、札を目の上へ上げる（cuePlace の後）
function rsEyeAvoid(){const P=$('plates'),L=$('sayLayer');if(!P||!L||typeof faceBox!=='function')return;
  const pr=P.getBoundingClientRect(),z=pr.width/(P.offsetWidth||pr.width)||1,lr=L.getBoundingClientRect();
  P.querySelectorAll(':scope > .cue[data-bust]').forEach(cb=>{const t=cb.querySelector('.rsOnly');if(!t||t.hidden||!cb.offsetParent)return;
    const f=faceBox(+cb.dataset.bust);if(!f)return;const r=cb.getBoundingClientRect(),h=f.b-f.t,eT=lr.top+f.t+h*.35,eB=lr.top+f.t+h*.55;
    if(!(r.left<lr.left+f.r&&lr.left+f.l<r.right&&r.top<eB&&eT<r.bottom))return;
    const top=parseFloat(cb.style.top)||0;cb.style.top=Math.max(2,top-(r.bottom-eT+2)/z)+'px'})}
// v94.3 レビュー：印の付いた札に、ほかの席の吹き出し（WebKit 横でソウの「ついていきます」がレイカの「ニヤ レイカだけ」の右端に 14×27px）がかかるときは、
// 吹き出しを空いている横へ寄せる（入らなければ札の下へ）。吹き出しは札より手前の層なので、印が読めなくなる。追いかけ（sayFollow）が margin を書き直した後にも見る
function rsSayAvoid(){const P=$('plates'),L=$('sayLayer');if(!P||!L)return;
  const cs=[...P.querySelectorAll(':scope > .cue')].filter(cb=>{const t=cb.querySelector('.rsOnly');return t&&!t.hidden&&cb.offsetParent}).map(cb=>cb.getBoundingClientRect()).filter(r=>r.width>1);if(!cs.length)return;
  const lr=L.getBoundingClientRect(),list=[...document.querySelectorAll('#sayLayer .say.go, #plates .say.go')].filter(e=>e.offsetParent&&e.textContent.trim()),R=list.map(e=>e.getBoundingClientRect());   // 全部測ってから全部書く
  const ov=(a,b)=>a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;
  list.forEach((e,k)=>{const r=R[k];const c=cs.find(q=>ov(r,q));if(!c)return;
    const sh=(x,y)=>({left:r.left+x,right:r.right+x,top:r.top+y,bottom:r.bottom+y}),okB=q=>q.left>=lr.left+2&&q.right<=lr.right-2&&q.top>=lr.top+2&&q.bottom<=lr.bottom-2;
    // v94.4 レビュー：下へ寄せると話し手本人の口元にかかることがあった（横でレイカとソウの両方に印）。話し手の顔もよけ、印の上・顔の下も候補にする
    const i=+(e.id||'').replace(/\D/g,''),f=typeof faceBox==='function'&&i?faceBox(i):null,fr=f?{left:lr.left+f.l,right:lr.left+f.r,top:lr.top+f.t+(f.b-f.t)*.3,bottom:lr.top+f.b}:null;
    // v94.5 レビュー 1：顔の下へ寄せると話し手の名札（「ソウ」）にかかった。名札もよけ、名札の下も候補にする
    const pl=[...P.querySelectorAll(':scope > .plate[id^=plate]')].filter(x=>x.offsetParent).map(x=>[x.id,x.getBoundingClientRect()]).filter(([,q])=>q.width>1),myPl=(pl.find(([id])=>id==='plate'+i)||[])[1];
    const oth=R.filter((_,j)=>j!==k),free=q=>okB(q)&&!cs.some(z=>ov(q,z))&&!oth.some(z=>ov(q,z))&&!(fr&&ov(q,fr))&&!pl.some(([,z])=>ov(q,z));
    const C=[[c.right+3-r.left,0],[c.left-3-r.right,0],[0,c.bottom+3-r.top],[0,c.top-3-r.bottom]].concat(fr?[[0,fr.bottom+3-r.top]]:[],myPl?[[0,Math.max(myPl.bottom,fr?fr.bottom:0)+3-r.top]]:[]).sort((a,b)=>Math.abs(a[0])+Math.abs(a[1])-Math.abs(b[0])-Math.abs(b[1]));
    const m=C.find(([x,y])=>free(sh(x,y)))||C.find(([x,y])=>okB(sh(x,y)));
    // v94.5 レビュー 2：出た直後は札が大きくなる途中で、寄せ先が 0.6〜0.8 秒のあいだ上下に動く。出てから 0.8 秒は隠しておき、置き場所が決まってから見せる
    const age=performance.now()-(e._t||0);if(age<800&&!e._rsHold){e._rsHold=1;e.style.visibility='hidden';setTimeout(()=>{e._rsHold=0;e.style.visibility='';try{rsSayAvoid()}catch(_){}},800-age)}
    if(!m)return;
    if(m[0])e.style.marginLeft=((parseFloat(e.style.marginLeft)||0)+m[0]).toFixed(1)+'px';if(m[1])e.style.marginTop=((parseFloat(e.style.marginTop)||0)+m[1]).toFixed(1)+'px'})}
LT.on('layout',()=>{try{if(!$('game').hidden){rsEyeAvoid();rsSayAvoid()}}catch(e){}});
{const _sf=sayFollow;sayFollow=function(){const on=_sf.apply(this,arguments);if(on)try{rsSayAvoid()}catch(e){}return on}}
