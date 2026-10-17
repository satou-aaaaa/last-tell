/* ---------- 動画のツッコミから（satou 2026-10-17「LAST TELL 改善案」） ---------- */
// 対局の分かりやすさ（A）と見た目（B）の小さな直し。CPU の判断・配り札・勝ち負けの決まり方は変えない。
// 状態は S.vf、保存は 'shisho-vfix'。第7章・物語の一手・回想の静けさは守る（awQuiet と同じ判定）
SAVE_KEYS.push('shisho-vfix');
const VF={en:()=>typeof I18N!=='undefined'&&I18N.lang==='en',
  quiet:()=>{try{return typeof awQuiet==='function'?awQuiet():false}catch(e){return false}},
  get:()=>saveGet('shisho-vfix',{})||{},put:o=>saveSet('shisho-vfix',Object.assign(VF.get(),o),1)};
LT.on('startHand:before',()=>{if(S)S.vf={h:S.handNo+1}});

// ===== A1：第5章の AA のハンド。「自動でコールしたことになった」→ 自分で押す =====
// オールインを受けるかは自分で決める（降りる・上げるは出さない。押せるのは「オールイン」だけ）。手札・場札・勝ち負けは今のまま
const vfBadbeat=()=>!!(CFG&&CFG.ch&&!CFG.ch.p2&&CFG.ch.script==='badbeat'&&S&&S.handNo===1&&!CFG.flashback);
LT.on('startHand',()=>{try{if(vfBadbeat()&&S.autoMe)S.msg='AAが来た。いちばん強い手札だ'}catch(e){}});
LT.on('render',()=>{try{
  // 隠した「レイズ」は、ほかの描き直し（renderControls）では戻らないので、ここで戻す。戻さないと第5章の残りと回想（押せるのが「レイズ」だけ）で進めなくなる（v0.92.3）
  {const rb=$('btnRaise');if(rb&&rb.dataset.vfHid&&!(S&&S.vf&&S.vf.ask&&S.toAct===0&&!S.handOver)){rb.hidden=false;delete rb.dataset.vfHid}}
  if(!vfBadbeat()||S.handOver)return;const me=S.players[0];
  if(S.autoMe&&S.toAct===0&&S.currentBet>me.bet&&!S.vf.ask){S.vf.ask=true;S.vf.bb=true;S.autoMe=false;S.msg='ハヤトのオールイン。AAで受けるか？';
    requestAnimationFrame(()=>{try{render()}catch(e){}})}
  const ask=!!S.vf.ask&&S.toAct===0;
  ['btnFold','btnRaise','quick','raisePanel'].forEach(id=>{const b=$(id);if(b&&ask){if(id==='btnRaise'&&!b.hidden)b.dataset.vfHid='1';b.hidden=true}});
  $('controls').classList.toggle('vfone',ask);
}catch(e){}});
LT.on('act',i=>{try{if(i===0&&S.vf&&S.vf.ask){S.vf.ask=false;$('controls').classList.remove('vfone')}}catch(e){}});

// ===== A2：あなたの番を名札の上にはっきり =====
// ===== A4：自分の席のマーク（SB・BB）。ブラインドスチールの章は「後ろの席／前の席」 =====
function vfMine(){
  const ava=document.querySelector('#mine .me-ava'),l=document.querySelector('#mine .me-l');if(!ava||!l||!S||!S.players)return;
  const me=S.players[0],quiet=VF.quiet()||!!CFG.flashback;
  // 自分の番
  let t=l.querySelector(':scope > .vfturn');
  const turn=!quiet&&!S.handOver&&S.toAct===0&&!S.autoMe&&!$('controls').hidden&&!me.folded;
  if(turn&&!t){t=document.createElement('span');t.className='vfturn';t.textContent='あなたの番';l.prepend(t)}
  if(t)t.hidden=!turn;
  // 席のマーク
  let b=ava.querySelector(':scope > .vfpos');
  const steal=!!(CFG.goal&&CFG.goal.type==='steal'),sb=S.sbI===0,bb=S.bbI===0;
  let txt='',cls='';
  if(!quiet&&!S.handOver&&!me.out){
    if(steal&&S.street==='preflop'){const late=typeof isLatePos==='function'&&isLatePos();txt=late?'後ろ':(bb?'BB':sb?'SB':'前');cls=late?' late':' early'}
    else if(S.street==='preflop'&&S.dealer!==0)txt=bb?'BB':sb?'SB':''}
  if(!txt){if(b)b.hidden=true;return}
  if(!b){b=document.createElement('span');b.className='vfpos';ava.appendChild(b)}
  b.hidden=false;if(b.textContent!==txt)b.textContent=txt;const c='vfpos'+cls;if(b.className!==c)b.className=c;
  b.title=txt==='後ろ'?'後ろの席：あとから動けるので、ブラインドスチールを仕掛けやすい':txt==='前'?'前の席：あとの人が多いので、強い手だけで':txt==='SB'?'スモールブラインド':'ビッグブラインド'}
LT.on('render',()=>{try{vfMine()}catch(e){}});

// ===== A3：演出の速さに「ゆっくり」 =====
// SPEED（05_tells.js）は speed==='slow' で 1.5 倍。ゆっくりのときは「降りたら速く回す」も効かない
function vfSpeedLab(){return SETTINGS.speed==='fast'?'速い':SETTINGS.speed==='slow'?'ゆっくり':'ふつう'}
renderSpeed=function(){$('btnSpeed').textContent='演出の速さ：'+vfSpeedLab()};
$('btnSpeed').onclick=()=>{SETTINGS.speed=SETTINGS.speed==='slow'?'fast':SETTINGS.speed==='fast'?'normal':'slow';saveSettings();renderSpeed()};
{const set=v=>()=>{SETTINGS.speed=v;saveSettings();renderSpeed()};
  SET64_SEL.btnSpeed=[['ゆっくり',()=>SETTINGS.speed==='slow',set('slow')],['ふつう',()=>SETTINGS.speed!=='fast'&&SETTINGS.speed!=='slow',set('normal')],['速い',()=>SETTINGS.speed==='fast',set('fast')]];
  const s=$('sel_btnSpeed');if(s){s.innerHTML=SET64_SEL.btnSpeed.map(([t],k)=>`<option value="${k}">${esc(t)}</option>`).join('');try{setSync()}catch(e){}}
  renderSpeed()}

// ===== A6：最初の自分の番の案内に、3つのボタンの意味 =====
TIPS.act='フォールド＝降りる。コール＝同じ額を払って続ける。レイズ＝上乗せして勝負する';

// ===== A7・A8：勝ち負けと役を、ディーラーの言葉と卓の上の一行で =====
// ライブのディーラーは「フラッシュで、○○さんの勝ちです」と言う。テレビ風の大きな札（.wstamp）は出さないまま
function vfName(p){if(p.human)return VF.en()?'You':'あなた';const n=typeof who==='function'?who(p.name):p.name;
  if(VF.en())return(typeof EN_DICT!=='undefined'&&EN_DICT[n])||n;return n+((typeof knownName!=='function'||knownName(p.name))?'さん':'の方')}
function vfHand(p){const h=p.hname||(p.score?handName(p.score):'');return VF.en()?((typeof EN_DICT!=='undefined'&&EN_DICT[h])||h):h}
potCall=function(){const ws=S.players.filter(p=>p.won>0);if(!ws.length)return;
  const sd=S.street==='showdown'&&ws.every(p=>p.show&&p.score&&!p.folded)&&!S.board2,en=VF.en();let t;
  if(sd&&ws.length===1){const w=ws[0],h=vfHand(w);t=en?`${w.human?'You win':vfName(w)+' wins'} with ${h}`:`${h}で、${vfName(w)}の勝ちです`}
  else t=en?'Pot goes to '+ws.map(w=>w.human?'you':vfName(w)).join(' and '):'ポットは'+ws.map(w=>w.human?'あなた':w.name+'さん').join('と')+'へ';
  dealerSay(t);Sound.sfx(ws.some(w=>w.human)?'win':'chip')};
function vfResult(){
  if(!S||!S.handOver||!S.vf||S.vf.res||(CFG.flashback&&(CFG.flash==='jin'||!S.players.some(p=>p.show&&!p.human)))||VF.quiet()||$('game').hidden)return;   // 回想も、相手の手が開いたら勝ち負けと役を出す（録画 #9）。ジンの席の回想は除く
  const ws=S.players.filter(p=>p.won>0);if(!ws.length)return;S.vf.res=1;
  const me=S.players[0],sd=S.street==='showdown'&&!S.board2,iWon=me.won>0,inIt=!me.folded&&!me.out;
  if(!sd&&!iWon)return;   // ほかの人どうしで決まったハンドは、名札の語とディーラーの声で足りる
  const en=VF.en(),w=iWon?me:ws.reduce((a,b)=>b.won>a.won?b:a),h=sd?vfHand(w):'';
  let main,sub='';
  if(iWon){main=en?'You win':'あなたの勝ち';sub=`+${fmt(me.won)}`}
  else{main=en?`${vfName(w)} wins`:`${vfName(w)}の勝ち`;if(inIt)sub=en?'You lose':'あなたの負け'}
  if(ws.length>1){main=en?'Split pot':'引き分け（ポットを分ける）';sub=iWon?`+${fmt(me.won)}`:''}
  const tb=$('table'),bc=$('boardCards');if(!tb||!bc)return;
  const old=tb.querySelector('.vfres');if(old)old.remove();
  const d=document.createElement('div');d.className='vfres'+(iWon?' win':'');d.setAttribute('role','status');
  d.innerHTML=`<b>${esc(main)}</b>${h?`<span class="h">${esc(h)}</span>`:''}${sub?`<span class="n">${esc(sub)}</span>`:''}`;
  const place=()=>{const T=tb.getBoundingClientRect(),B=bc.getBoundingClientRect();if(!B.height)return;d.style.top=Math.round(B.bottom-T.top+6)+'px'};
  tb.appendChild(d);place();setTimeout(()=>{try{place()}catch(e){}},300);
  const s0=S;setTimeout(()=>{d.classList.add('out');setTimeout(()=>d.remove(),400)},2800);
  LT.on('startHand:before',function rm(){d.remove();LT.off('startHand:before',rm)});
}
LT.on('render',()=>{try{vfResult()}catch(e){}});

// ===== A9：フロアのクイズは「ルールを覚える」ためと一言。設定でオフにできる =====
LT.on('askQuiz',()=>{try{const em=document.querySelector('#quiz .qhead em');if(em&&!document.querySelector('#quiz .vfqwhy')){const p=document.createElement('p');p.className='vfqwhy';
  p.textContent='店のルールを覚えるためのクイズです。勝ち負けには関係ありません（設定でオフにできます）';em.closest('.qhead').after(p)}}catch(e){}});

// ===== A10：手を見せるかの意味 =====
{const sb=$('showBox');if(sb&&!sb.querySelector('.vfwhy')){const s=document.createElement('small');s.className='vfwhy';s.textContent='見せなければ、相手に手の内を知られません';sb.appendChild(s)}}

// ===== B1：カードとチップをそろえて置く（設定。はじめはオン） =====
if(SETTINGS.tidy===undefined)SETTINGS.tidy=true;
const vfTidy=()=>document.body.classList.toggle('lt-tidy',SETTINGS.tidy!==false);vfTidy();
{const box=$('setIn'),det=box&&box.querySelector('.setmore');
  if(det&&!$('btnTidy')){const b=document.createElement('button');b.id='btnTidy';b.className='mini sw64';b.setAttribute('role','switch');
    const r=document.createElement('div');r.className='setrow';r.innerHTML='<div><b>カードをそろえて置く</b><p>捨て札・手札を整えて置きます。オフにすると、本物のテーブルのように少し散らばります</p></div>';r.appendChild(b);
    const sp=$('btnSpeed'),after=sp&&sp.closest('.setrow');(after&&after.parentNode===det?after:null)?after.after(r):det.appendChild(r);
    const lab=()=>{b.textContent='カードをそろえる：'+(SETTINGS.tidy!==false?'オン':'オフ')};lab();
    b.onclick=()=>{SETTINGS.tidy=SETTINGS.tidy===false;saveSettings();vfTidy();lab();setTimeout(setSync,0)};
    SET64_SW.btnTidy=()=>SETTINGS.tidy!==false;try{setSync()}catch(e){}}}

// ===== B2：ショーダウン・ハンドの終わりは、お守り（カードプロテクター）を手札の横へよける =====
LT.on('render',()=>{try{const h=document.querySelector('#mine .hold');if(!h||!S||!S.players)return;const me=S.players[0];
  h.classList.toggle('vfaside',!!(S.handOver||S.street==='showdown'||S.reveal||S.runout||me.show))}catch(e){}});

// ===== B6・B7：星と赤い札の意味（席の案内で、最初の3回だけ） =====
LT.on('showVersus',()=>{try{const g=document.querySelector('#vs .vsgoal');if(!g||document.querySelector('#vs .vfstars'))return;
  const n=+VF.get().stars||0;if(n>=3)return;VF.put({stars:n+1});
  const p=document.createElement('p');p.className='vfstars';p.textContent='★は強さ（5つが最強）。★4つからは赤い札、いちばん手ごわい相手です';g.before(p)}catch(e){}});

// ===== B8・D3・D4：場面が変わるときは、毎回ワイプと見出し =====
// 回想（15年前）に入るとき：大きく「15年前／○○として打つ」
const vfTitleCard=(top,big,small)=>{try{lastWipe()}catch(e){}
  const old=document.querySelector('.vfcard');if(old)old.remove();
  const d=document.createElement('div');d.className='vfcard';d.setAttribute('role','status');
  d.innerHTML=`<span>${esc(top)}</span><b>${esc(big)}</b>${small?`<em>${esc(small)}</em>`:''}`;
  document.body.appendChild(d);const go=()=>{d.classList.add('out');setTimeout(()=>d.remove(),450)};d.onclick=go;setTimeout(go,2600)};
LT.on('startHand',()=>{try{if(!CFG.flashback||S.handNo!==1)return;const me=S.players[0],nm=me&&me.name||'';
  const t=String(CFG.title||'15年前').split('　');vfTitleCard(t[0]||'15年前',`${nm}として打つ`,t[1]||'')}catch(e){}});
// 「そのころ」の場面に入るとき：暗転と見出し
LT.on('renderLine',()=>{try{if(!SC)return;const l=SC.lines[SC.i],il=Array.isArray(l)&&l[2]&&l[2].il;
  if(!il){SC.vfIl=0;return}if(SC.vfIl===il||!INTERLUDE[il])return;SC.vfIl=il;vfTitleCard('そのころ',INTERLUDE[il].place,'')}catch(e){}});

// ===== E3：お守り（カードプロテクター）を手に入れた場面に、絵と一言 =====
LT.on('renderLine',()=>{try{if(!SC)return;const l=SC.lines[SC.i];if(!Array.isArray(l)||typeof l[1]!=='string'||!/お守り/.test(l[1]))return;
  const no=SC.ch&&SC.ch.no,pr=typeof PROTECTORS!=='undefined'&&PROTECTORS.find(x=>x.ch===no);if(!pr)return;
  const box=$('box');if(!box||box.querySelector('.vfprot'))return;
  const d=document.createElement('div');d.className='vfprot';
  d.innerHTML=`<span class="pic">${protectorSVG(pr.id)}</span><span><b>${esc(pr.name)}</b><small>カードプロテクター：自分の手札の上に置くお守り。章の一覧の「カードプロテクター」で選べます</small></span>`;box.appendChild(d)}catch(e){}});

// ===== D6：人だかりの声は誰の声か分かるように =====
CROWD.lines=CROWD.lines.map(t=>'（周りの客）'+t);
