/* ===== 主人公（2026-10-10 主人公レーン）：名前・アオ・身なり =====
   仕様：research/主人公の名前_実装仕様.md、主人公アオ_実装仕様.md、主人公の見た目を変える_実装仕様.md
   ・主人公の名前は既定「アオ」。第1章でジンに聞かれたときだけ変えられる（SETTINGS.hero）。
   ・プレイヤーネーム（SETTINGS.nick）は物語の外（タイトルのあいさつ・記録の見出し）だけで使う。
   ・文の中の〈主〉は、表示の直前に主人公の名前へ置き換える。地の文には名前を書かない。
   ・身なり（SETTINGS.look）は表示だけ。勝ち負け・テル・CPUの読みには関わらない。 */
var HERO='アオ',HERO_EN='Ao';   // 既定の名前はここ1か所で変える
function heroName(){let h='';try{h=SETTINGS.hero}catch(e){}return h||(typeof I18N!=='undefined'&&I18N.lang==='en'?HERO_EN:HERO)}
const hx=s=>typeof s==='string'&&s.includes('〈主〉')?s.split('〈主〉').join(heroName()):s;
// 名前の整え方：制御文字・見えない文字・向きを変える文字を消し、全角6文字／半角12文字まで
function cleanNick(s){
  s=String(s||'').normalize('NFC')
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u2069\ufeff]/g,'')
    .replace(/\s+/g,' ').trim();
  const seg=typeof Intl!=='undefined'&&Intl.Segmenter?[...new Intl.Segmenter('ja',{granularity:'grapheme'}).segment(s)].map(x=>x.segment):[...s];
  let w=0,out='';for(const g of seg){const cw=/^[\x20-\x7e｡-ﾟ]$/.test(g)?1:2;if(w+cw>12)break;w+=cw;out+=g}
  return out.trim()}
// 読み込んだ設定を確かめる（引き継ぎコードで入ったものも、読み込み直後にここを通る）
SETTINGS.nick=cleanNick(SETTINGS.nick);SETTINGS.hero=cleanNick(SETTINGS.hero);
if(SETTINGS.look)SETTINGS.look=lookClean(SETTINGS.look);

/* ---- 物語に足す行（文字列で場所を探して差し込む。見つからなければ何もしない） ---- */
(function(){
  const C=n=>CHAPTERS[n-1],at=(a,t)=>a.findIndex(l=>Array.isArray(l)&&typeof l[1]==='string'&&l[1].includes(t));
  const ins=(a,t,ls,after)=>{const i=at(a,t);if(i>=0)a.splice(after?i+1:i,0,...ls);return i>=0};
  // 章の最後（予告やその頃の場面の前）に置く
  const tail=(a,ls)=>{let i=a.findIndex(l=>l&&!Array.isArray(l)&&l.preview||Array.isArray(l)&&l[2]&&l[2].il);if(i<0)i=a.length;a.splice(i,0,...ls)};
  const c1=C(1),c1A=[c1.intro,...(c1.beats||[]).map(b=>b.lines)],insA=(t,ls,after)=>c1A.some(a=>ins(a,t,ls,after));
  for(const a of c1A){const i=at(a,'仕事帰りに覚えたポーカー');if(i>=0){a.splice(i,1,
    ['','倉庫で一日、積み荷の数を数えてきた。数なら、間違えない。'],
    ['','……なのに、仕事帰りに覚えたポーカーでは、今日もまるで勝てずにいる。']);break}}
  insA('こちらの手札をのぞきこんだ',[['','指が、手元のチップの枚数を数えていた。'],['老人','……数えるな。顔を見ろ']],true);
  insA('ジンでいい。',[['ジン','……お前は'],{askName:1},['ゲン','〈主〉か。覚えたぞ！']],true);
  ins(c1.outro,'うちの壁に写真を一枚',[['店主','写真を撮るよ。身なりを整えといで'],{look:1}],true);
  const c2=C(2).outro;
  ins(c2,'銀の扉の看板と',[['ロク','〈主〉、か。……覚えておこう']]);
  ins(c2,'時計は午前0時を回っている',[['','荷の数なら、いつも合う。今日の負けは、数では説明がつかなかった。']]);
  tail(c2,[{gotFit:2}]);
  const c3=C(3).outro;
  ins(c3,'時計は午前1時',[['ミナ','〈主〉、また来てね']]);
  ins(c3,'ブラフは、降りられる奴にしか',[['','指が、またチップを数えかけた。やめて、相手の顔を見た。']]);
  tail(c3,[{gotFit:3}]);
  const c4=C(4).outro;
  ins(c4,'これは餞別。天空の羽よ',[['レイカ','〈主〉、だったわね。覚えておくわ']]);
  ins(c4,'……半人前だが、目はいい',[['','気づけば、賭けた額ではなく、レイカの顔を見ていた。']]);
  tail(c4,[{gotFit:4}]);
  const c5=C(5).outro;
  ins(c5,'長い沈黙のあと',[['','倉庫の帳面のようには、ジンの過去は合わなかった。']]);
  ins(c5,'帰り道、ジンはしばらく黙っていた',[['テツ','……〈主〉、顔を上げろ。次がある']]);
  tail(c5,[{gotFit:5}]);
  const c6=C(6).outro;
  ins(c6,'……ジン。お前の打ち方だ',[['ロク','〈主〉。……いい看板の主になったな']],true);
  ins(c6,'錨亭に戻るぞ。……あと一つだ',[['','数えなくても、残りのチップの枚数は分かっていた。']]);
  tail(c6,[{gotFit:6}]);
  // 第7章は outro が関数なので、できた行に足す
  const c7=C(7),o7=c7.outro;
  if(typeof o7==='function')c7.outro=function(){const a=o7.apply(this,arguments).slice();
    {const i=at(a,'ジンが初めて、あなたの名前を呼んだ');if(i>=0)a[i]=['','ジンが初めて、名前を呼んだ。']}
    ins(a,'ジンが手を開いた。スリーカード',[['','チップを数えずに、カードを返していた。']],true);
    ins(a,'あなたの写真の隣に',[['','ここにいていい、と言われた気がした。']],true);
    ins(a,'奥の卓に、灯りがついた',[{gotFit:7}],true);
    return a};
})();

/* ---- 場面：〈主〉の置き換えと、主人公の行（名乗る・身なり・服） ---- */
{const _ps=playScene;playScene=function(ch,lines,done){
  const got=+SETTINGS.fitNote||0,cl=loadCleared();
  lines=(lines||[]).filter(l=>!(l&&l.gotFit&&(got>=l.gotFit||cl<l.gotFit)));   // 写しを渡す（〈主〉は表示の直前に置き換える）
  return _ps.call(this,ch,lines,done)}}
function heroLine(l){const st=$('stage'),bx=$('box');
  if(l.askName){setStage('ジン');SC.askPending=true;
    bx.innerHTML=`<div class="askname"><label class="askl" for="askHero">名前</label><input id="askHero" type="text" autocomplete="off" enterkeyhint="done" data-noi18n value="${esc(heroName())}" aria-label="主人公の名前"><button class="primary" id="askGo">名乗る</button></div>`;
    const inp=$('askHero'),go=e=>{if(e)e.stopPropagation();const v=cleanNick(inp.value);SETTINGS.hero=v&&v!==HERO&&v!==HERO_EN?v:'';saveSettings();SC.askPending=false;advance()};
    bx.querySelector('.askname').onclick=e=>e.stopPropagation();
    $('askGo').onclick=go;inp.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter'&&!e.isComposing){e.preventDefault();go()}};
    if(!(matchMedia&&matchMedia('(pointer:coarse)').matches))setTimeout(()=>{if($('askHero'))$('askHero').focus({preventScroll:true})},0);
    return true}
  if(l.look){st.className='stage';st.innerHTML=`<div class="portrait heroshot">${avatar('あなた','win')}</div>`;
    bx.innerHTML=`<div class="line narr">${esc('写真が一枚、壁に貼られた。')}</div>`;
    if(!SETTINGS.lookSeen){SC.lookPending=true;lookOpen('ch1',()=>{SETTINGS.lookSeen=1;saveSettings();if(SC){SC.lookPending=false;renderLine()}})}
    return true}
  if(l.gotFit){setStage(null);SETTINGS.fitNote=Math.max(+SETTINGS.fitNote||0,l.gotFit);saveSettings();
    bx.innerHTML=`<div class="line narr">${esc('新しい服をもらった。「身なり」で着られる。')}</div>`;return true}
  return false}
{const _pl=p2Line;p2Line=function(l){return heroLine(l)||_pl.apply(this,arguments)}}
{const _rl=renderLine;renderLine=function(){if(SC){const c=SC.lines[SC.i];if(Array.isArray(c)&&typeof c[1]==='string'&&c[1].includes('〈主〉'))SC.lines[SC.i]=[c[0],hx(c[1])].concat(c.slice(2))}
  _rl.apply(this,arguments);const l=SC&&SC.lines[SC.i];if(l&&l.askName&&SC.askPending)$('btnAdv').hidden=true}}
{const _ad=advance;advance=function(){if(SC){const l=SC.lines[SC.i];if(l&&l.askName&&SC.askPending)return;if(SC.lookPending||!$('lookDlg').hidden)return}return _ad.apply(this,arguments)}
 $('btnAdv').onclick=advance}

/* ---- 身なりの画面 ---- */
const LOOK_HS_N={short:'短髪',sidepart:'横分け',crop:'刈り上げ',bob:'ボブ',ponytail:'ひとつ結び',curly:'巻き毛',afro:'アフロ',locs:'ロックス'};
const LOOK_GL_N={'':'なし',round:'丸',square:'四角'};
const LOOK_SIGN={2:'銀の扉',3:'月影',4:'天空',5:'地下の賭場',6:'王冠'};
const LOOK_SIX=[LOOK_DEF,{face:'B',skin:6,hs:'locs',hair:1,gl:'',fit:'silver'},{face:'A',skin:4,hs:'crop',hair:1,gl:'square',fit:'moon'},
  {face:'B',skin:3,hs:'bob',hair:2,gl:'round',fit:'anchor'},{face:'A',skin:5,hs:'curly',hair:1,gl:'',fit:'sky'},{face:'B',skin:2,hs:'ponytail',hair:3,gl:'',fit:'crown'}];
const fitHint=f=>f.need>=7?'卒業試験に受かるともらえる':`${LOOK_SIGN[f.need]}の看板を取るともらえる`;
let LK=null,lookDone=null,lookOm=0,lookFrom='';
(function(){const d=document.createElement('div');d.className='lookdlg';d.id='lookDlg';d.hidden=true;
  d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-labelledby','lookH');
  const row=(id,label)=>`<div class="lrow"><b>${label}</b><div class="lchips" id="${id}"></div></div>`;
  d.innerHTML=`<div class="lookin"><div class="lookhead"><h2 id="lookH">身なり</h2><p class="lookcap" id="lookCap"></p></div>
    <div class="lookbody"><div class="lookpic"><div class="lphoto"><div class="lpic" id="lookPic" role="img" aria-label="選んだ見た目"></div><span>錨亭の壁</span></div></div>
    <div class="lookopts">${row('lkFace','顔立ち')}${row('lkSkin','肌')}${row('lkHs','髪型')}${row('lkHair','髪の色')}${row('lkGl','眼鏡')}${row('lkFit','服')}<p class="lnote" id="lkNote" aria-live="polite"></p></div></div>
    <div class="lookfoot"><button class="ghost" id="lkOm">おまかせ</button><button class="ghost" id="lkReset">初期のアオに戻す</button><button class="primary" id="lkOk">決める</button></div></div>`;
  document.querySelector('.wrap').appendChild(d);
  const chips=(el,items,key)=>{$(el).innerHTML=items.map(([v,label,col,lock])=>`<button type="button" class="${col?'sw':''}${lock?' lk':''}" ${col?`style="background:${col}"`:''} data-v="${v}" aria-label="${esc(label)}${lock?'（'+esc(lock)+'）':''}" title="${esc(label)}">${col?'':(lock?'🔒 ':'')+esc(label)}</button>`).join('');
    $(el).querySelectorAll('button').forEach(b=>b.onclick=()=>{const v=b.dataset.v;
      if(b.classList.contains('lk')){$('lkNote').textContent=tr(fitHint(LOOK_FIT.find(f=>f.id===v)));return}
      LK[key]=key==='skin'||key==='hair'?+v:v;$('lkNote').textContent='';lookDraw()})};
  lookChips=()=>{chips('lkFace',[['A','顔立ちA'],['B','顔立ちB']],'face');
    chips('lkSkin',[1,2,3,4,5,6,7].map(i=>[i,'肌'+i,SKIN[i][0]]),'skin');
    chips('lkHs',LOOK_HS.map(k=>[k,LOOK_HS_N[k]]),'hs');
    chips('lkHair',LOOK_HAIR.map((h,i)=>[i,h[2],h[0]]),'hair');
    chips('lkGl',LOOK_GL.map(k=>[k,LOOK_GL_N[k]]),'gl');
    chips('lkFit',LOOK_FIT.map(f=>[f.id,f.n,'',fitOpen(f)?'':fitHint(f)]),'fit')};
  $('lkOm').onclick=()=>{lookOm=(lookOm+1)%LOOK_SIX.length;const o={...LOOK_SIX[lookOm]};const f=LOOK_FIT.find(x=>x.id===o.fit);if(!f||!fitOpen(f))o.fit='anchor';LK=o;$('lkNote').textContent='';lookDraw()};
  $('lkReset').onclick=()=>{LK={...LOOK_DEF};lookOm=0;$('lkNote').textContent='';lookDraw()};
  $('lkOk').onclick=()=>lookClose(true);
  d.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();lookClose(lookFrom==='ch1')}
    else if(e.key==='Tab'){const f=[...d.querySelectorAll('button')].filter(b=>b.offsetParent);if(!f.length)return;
      if(e.shiftKey&&document.activeElement===f[0]){e.preventDefault();f[f.length-1].focus()}else if(!e.shiftKey&&document.activeElement===f[f.length-1]){e.preventDefault();f[0].focus()}}};
})();
var lookChips;
function lookDraw(){REAL['アオ']=heroReal(false,LK);$('lookPic').innerHTML=fxLight(realAvatar('アオ','normal',{label:'あなた'}));
  [['lkFace','face'],['lkSkin','skin'],['lkHs','hs'],['lkHair','hair'],['lkGl','gl'],['lkFit','fit']].forEach(([el,k])=>
    $(el).querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(String(LK[k])===b.dataset.v))))}
function lookOpen(from,done){lookFrom=from||'';lookDone=done||null;LK=lookClean(SETTINGS.look);
  {const f=LOOK_FIT.find(x=>x.id===LK.fit);if(!fitOpen(f))LK.fit='anchor'}
  lookChips();$('lkNote').textContent='';$('lookCap').textContent=from==='ch1'?tr('店主「写真を撮るよ。身なりを整えといで」'):'';
  $('lookDlg').hidden=false;lookDraw();setTimeout(()=>$('lkOk').focus({preventScroll:true}),0)}
function lookClose(save){if(save){SETTINGS.look=lookClean(LK);saveSettings()}
  $('lookDlg').hidden=true;REAL['アオ']=heroReal(false);const d=lookDone;lookDone=null;d&&d()}

/* ---- 設定パネル：プレイヤーネーム（物語の外）と「身なりを整える」 ---- */
(function(){const box=$('setIn'),inp=$('nick');
  const mk=(name,desc,el,id)=>{const r=document.createElement('div');r.className='setrow';if(id)r.id=id;r.innerHTML=`<div><b>${name}</b><p>${desc}</p></div>`;r.appendChild(el);return r};
  const lb=document.createElement('button');lb.className='mini';lb.id='btnLook';lb.textContent='身なりを整える';
  lb.onclick=()=>{$('setPanel').hidden=true;lookOpen('set',()=>{if(!$('chapters').hidden)showChapters();$('btnLook').focus({preventScroll:true});$('setPanel').hidden=false})};
  box.appendChild(mk('身なり','主人公の顔立ち・髪・服を選びます（見た目だけ）。服は章をクリアするともらえます',lb,'rowLook'));
  if(inp){const old=inp.closest('label');inp.removeAttribute('maxlength');inp.setAttribute('maxlength','24');inp.placeholder='なし';inp.setAttribute('data-noi18n','');
    inp.setAttribute('aria-label','プレイヤーネーム');inp.className='pname';inp.value=SETTINGS.nick||'';
    inp.oninput=()=>{SETTINGS.nick=cleanNick(inp.value);saveSettings();heroGreet()};
    inp.onchange=()=>{inp.value=SETTINGS.nick||''};
    box.insertBefore(mk('プレイヤーネーム','タイトル画面と記録で使います。物語の中では呼ばれません。この端末の中だけに保存します',inp,'rowPname'),box.children[1]||null);
    if(old&&old!==inp)old.remove()}
  const sync=()=>{$('rowLook').hidden=loadCleared()<1;if(inp&&document.activeElement!==inp)inp.value=SETTINGS.nick||''};sync();
  ['btnSet','mSet'].forEach(id=>{const b=$(id);if(b)b.addEventListener('click',sync)})})();

/* ---- タイトルのあいさつ（プレイヤーネームがあるときだけ） ---- */
(function(){const sub=document.querySelector('#title .subtitle');if(!sub)return;const p=document.createElement('p');p.id='pGreet';p.className='pgreet';p.hidden=true;p.setAttribute('data-noi18n','');sub.after(p)})();
function heroGreet(){const p=$('pGreet');if(!p)return;const n=SETTINGS.nick;p.hidden=!n;p.textContent=n?(I18N.lang==='en'?`Welcome back, ${n}.`:`おかえりなさい、${n}さん`):''}
{const _sh=show;show=function(id){_sh.apply(this,arguments);if(id==='title')heroGreet()}}
heroGreet();
if($('btnLang'))$('btnLang').addEventListener('click',()=>setTimeout(heroGreet,0));
