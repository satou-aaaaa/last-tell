// ===== その他（B-1〜B-5、A-3、C-1、C-2） =====
const SAVE_V=k=>k==='shisho-progress'?SAVE_VER:1;
const linkFor=k=>{const u=LINKS[k]||'';return I18N.lang==='en'?u.replace(/\.html$/,'-en.html'):u};
const ltOpen=u=>{try{window.LT_PLATFORM.openUrl(u)}catch(e){try{window.open(u,'_blank','noopener')}catch(x){}}};
function mStat(t){const e=$('mStat');if(e)e.textContent=t||''}
// --- 窓 ---
let mdlgBack=null;
function mDlg(html,focusSel){const d=$('moreDlg');if(d.hidden)mdlgBack=document.activeElement;$('moreDlgIn').innerHTML=html;d.hidden=false;d.scrollTop=0;
  const f=focusSel&&d.querySelector(focusSel)||d.querySelector('button');if(f)f.focus({preventScroll:true});
  d.querySelectorAll('[data-x]').forEach(b=>b.onclick=mDlgClose)}
function mDlgClose(){const d=$('moreDlg');if(d.hidden)return;d.hidden=true;$('moreDlgIn').innerHTML='';const b=mdlgBack;mdlgBack=null;if(b&&b.offsetParent&&b.focus)b.focus({preventScroll:true})}
$('moreDlg').addEventListener('click',e=>{if(e.target.id==='moreDlg')mDlgClose()});
function mMsg(title,text){mDlg(`<h3 id="mdlgH">${esc(title)}</h3><p>${esc(text)}</p><div class="mbtns"><button data-x>閉じる</button></div>`)}
// --- 中身を作る・読む ---
function saveCollect(){const data={};for(const k of SAVE_KEYS){let v=null;try{v=localStorage.getItem(k)}catch(e){}if(v==null||v==='')continue;
    try{data[k]=JSON.parse(v)}catch(e){data[k]=v}}
  return{app:'lasttell',fmt:1,ver:APP_VERSION,data}}
function saveCheck(o){if(!o||typeof o!=='object'||o.app!=='lasttell')return 'notlt';
  if(!o.data||typeof o.data!=='object'||Array.isArray(o.data))return 'bad';
  if(+o.fmt>1)return 'new';
  for(const k of SAVE_KEYS){const v=o.data[k];if(v&&typeof v==='object'&&+v.v>SAVE_V(k))return 'new'}
  return ''}
function saveSummary(o){const d=o.data||{},c=+((d['shisho-progress']||{}).cleared)||0,g=(d['shisho-titles']||{}).got,t=g&&typeof g==='object'?Object.keys(g).length:0;
  return c>0?`第${c}章までクリア、称号${t}個`:`章のクリアはまだ、称号${t}個`}
function saveApply(o){try{for(const k of SAVE_KEYS){if(Object.prototype.hasOwnProperty.call(o.data,k)){const v=o.data[k];localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v))}else localStorage.removeItem(k)}}
  catch(e){mMsg('読み込めませんでした','ブラウザに保存できませんでした。空き容量や、プライベートブラウズの設定を確かめてください。');return}
  ltTrack('transfer_import',{});setTimeout(()=>location.reload(),60)}
// --- 引き継ぎコード：LT1 + z|p + - + 本体 + - + 確認用4文字 ---
const CRC_T=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(str){let c=0xFFFFFFFF;for(let i=0;i<str.length;i++)c=CRC_T[(c^str.charCodeAt(i))&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0}
const crc4=b=>crc32(b).toString(36).padStart(4,'0').slice(-4);
function b64u(bytes){let bin='';for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function unb64u(s){const b=atob(s.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((s.length+3)%4));const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
async function zpipe(bytes,Cls){return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new Cls('deflate-raw'))).arrayBuffer())}
const canZ=()=>{try{new CompressionStream('deflate-raw');new DecompressionStream('deflate-raw');return true}catch(e){return false}};
async function codeMake(o){const raw=new TextEncoder().encode(JSON.stringify(o));let z=false,body;
  if(canZ()){try{body=b64u(await zpipe(raw,CompressionStream));z=true}catch(e){}}
  if(!z)body=b64u(raw);
  return 'LT1'+(z?'z':'p')+'-'+body+'-'+crc4(body)}
async function codeRead(str){const s=String(str||'').replace(/\s+/g,'');const m=/^LT1([zp])-([A-Za-z0-9_-]+)-([0-9a-z]{4})$/.exec(s);
  if(!m||crc4(m[2])!==m[3])return{err:'bad'};
  try{let u=unb64u(m[2]);if(m[1]==='z'){if(!canZ())return{err:'old'};u=await zpipe(u,DecompressionStream)}
    const o=JSON.parse(new TextDecoder().decode(u));const e=saveCheck(o);return e?{err:e==='notlt'?'bad':e}:{o}}catch(e){return{err:'bad'}}}
const M_ERR={bad:'コードが正しくありません。コピーし直してください。',new:'新しい版のゲームで作られたコードです。ゲームを更新してください。',old:'このブラウザでは、このコードを読めません。ブラウザを新しくするか、ファイルで引き継いでください。'};
function confirmImport(o){mDlg(`<h3 id="mdlgH">このセーブを読み込みますか？</h3><p class="msum">${esc(saveSummary(o))}</p><p class="mwarn">今のセーブを上書きします。</p>
  <div class="mbtns"><button data-x>やめておく</button><button class="primary" id="mImpGo">上書きする</button></div>`,'[data-x]');
  $('mImpGo').onclick=()=>{$('mImpGo').disabled=true;saveApply(o)}}
async function moreExport(){mDlg(`<h3 id="mdlgH">引き継ぎコード</h3><p>機種変更やアプリ版への引き継ぎに使えます。他の人には教えないでください。</p>
  <textarea class="mcode" id="mCode" readonly rows="5" aria-label="引き継ぎコード" data-noi18n>……</textarea><p class="mstat" id="mCopied" aria-live="polite"></p>
  <div class="mbtns"><button data-x>閉じる</button><button class="primary" id="mCopy" disabled>コピー</button></div>`);
  let code='';try{code=await codeMake(saveCollect())}catch(e){}
  const ta=$('mCode');if(!ta)return;ta.value=code;$('mCopy').disabled=!code;ltTrack('transfer_export',{kind:'code'});
  ta.onfocus=()=>ta.select();
  $('mCopy').onclick=async()=>{let ok=false;try{await navigator.clipboard.writeText(code);ok=true}catch(e){}
    if(!ok){try{ta.focus();ta.select();ok=document.execCommand('copy')}catch(e){}}
    $('mCopied').textContent=ok?'コピーしました':'コピーできませんでした。コードを長押しして選んでください'}}
function moreImport(){mDlg(`<h3 id="mdlgH">引き継ぎコードを入れる</h3><p>出しておいたコードを貼り付けて「読み込む」を押してください。</p>
  <textarea class="mcode" id="mCodeIn" rows="5" aria-label="引き継ぎコード" placeholder="LT1…" spellcheck="false" autocomplete="off" autocapitalize="off"></textarea><p class="merr" id="mErr" aria-live="polite"></p>
  <div class="mbtns"><button data-x>閉じる</button><button class="primary" id="mRead">読み込む</button></div>`,'#mCodeIn');
  $('mRead').onclick=async()=>{const v=$('mCodeIn').value.trim();if(!v){$('mErr').textContent='コードを貼り付けてください。';return}
    const r=await codeRead(v);if(r.err){$('mErr').textContent=M_ERR[r.err];return}confirmImport(r.o)}}
// --- ファイル（B-2b） ---
async function saveFileOut(name,text){const P=window.LT_PLATFORM;if(P&&typeof P.saveFile==='function')return P.saveFile(name,text);
  const blob=new Blob([text],{type:'application/json'});
  try{if(navigator.canShare&&matchMedia('(pointer:coarse)').matches){const f=new File([blob],name,{type:'application/json'});if(navigator.canShare({files:[f]})){await navigator.share({files:[f],title:name});return true}}}
  catch(e){if(e&&e.name==='AbortError')return false}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.hidden=true;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);return true}
async function moreSaveFile(){const d=new Date(),p=n=>String(n).padStart(2,'0');const name=`LAST_TELL_save_${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}.json`;
  let ok=false;try{ok=await saveFileOut(name,JSON.stringify(saveCollect(),null,2))}catch(e){}
  if(ok!==false){ltTrack('transfer_export',{kind:'file'});mStat('セーブファイルを作りました：'+name)}}
$('mFile').onchange=async()=>{const f=$('mFile').files&&$('mFile').files[0];$('mFile').value='';if(!f)return;let o=null;
  try{if(f.size<5e6)o=JSON.parse(await f.text())}catch(e){}
  const e=saveCheck(o);
  if(e==='notlt'||e==='bad')return mMsg('読み込めませんでした','LAST TELL のセーブファイルではありません。');
  if(e==='new')return mMsg('読み込めませんでした','新しい版のゲームで作られたセーブです。ゲームを更新してください。');
  confirmImport(o)};
// --- セーブを消す（B-3） ---
function moreDelete(){mDlg(`<h3 id="mdlgH">セーブを消しますか？</h3><p class="mwarn">すべての進み具合・設定・メモが消えます。元に戻せません。先に引き継ぎコードを出しておくこともできます。</p>
  <div class="mbtns"><button id="mDelCode">引き継ぎコードを出す</button><button data-x>やめておく</button><button class="danger" id="mDelGo" disabled>消す</button></div>`,'[data-x]');
  setTimeout(()=>{const b=$('mDelGo');if(b)b.disabled=false},1000);
  $('mDelCode').onclick=moreExport;
  $('mDelGo').onclick=()=>{$('mDelGo').disabled=true;try{for(const k of SAVE_KEYS)localStorage.removeItem(k)}catch(e){}setTimeout(()=>location.reload(),60)}}
// --- クレジット（B-4） ---
function moreCredits(){const F=[['Shippori Mincho B1','© 2021 The Shippori Mincho Project Authors','OFL_shipporiminchob1.txt'],['Zen Kaku Gothic New','© 2022 The Zen Kaku Gothic Project Authors','OFL_zenkakugothicnew.txt'],['Oswald','© 2016 The Oswald Project Authors','OFL_oswald.txt']];
  mDlg(`<h3 id="mdlgH">クレジットとライセンス</h3><div class="mcred"><p class="mct">LAST TELL（最後のテル）</p>
  <dl><dt>制作</dt><dd>satou</dd><dt>シナリオ・絵・プログラム</dt><dd>satou</dd><dt>効果音</dt><dd>ゲーム内で合成（自作）</dd></dl>
  <h4>フォント</h4><ul>${F.map(([n,c,f])=>`<li><b>${n}</b><span>${c}</span><a href="licenses/${f}" target="_blank" rel="noopener" data-lic>ライセンス全文</a></li>`).join('')}</ul>
  <p>いずれも SIL Open Font License 1.1 で使用しています。</p>
  <p>テストプレイに協力してくださった皆さん、ありがとうございました。</p>
  <p class="mnote">このゲームに登場する人物・店・団体はすべて架空のものです。<br>チップは点数で、現金や景品とは交換できません。</p></div>
  <div class="mbtns"><button data-x>閉じる</button></div>`);
  $('moreDlgIn').querySelectorAll('[data-lic]').forEach(a=>a.onclick=e=>{e.preventDefault();ltOpen(a.getAttribute('href'))})}
// --- ホーム画面に追加（A-3） ---
let ltInstall=null;
const ltStandalone=()=>{try{return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch(e){return false}};
const ltIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
addEventListener('beforeinstallprompt',e=>{e.preventDefault();ltInstall=e});
addEventListener('appinstalled',()=>{ltInstall=null;moreRows()});
function moreInstallHint(kind){if(kind==='ios')mDlg(`<h3 id="mdlgH">ホーム画面に追加</h3><ol class="msteps"><li>Safari の下（iPad は上）にある共有ボタンを押します</li><li>「ホーム画面に追加」を選びます</li><li>右上の「追加」を押します</li></ol><p class="mnote">ホーム画面のアイコンから開くと、画面いっぱいで遊べます。</p><div class="mbtns"><button data-x>閉じる</button></div>`);
  else mDlg(`<h3 id="mdlgH">ホーム画面に追加</h3><p>ブラウザのメニューから「アプリをインストール」（または「ホーム画面に追加」）を選んでください。</p><div class="mbtns"><button data-x>閉じる</button></div>`)}
$('mInstall').onclick=async()=>{if(ltInstall){const ev=ltInstall;ltInstall=null;try{await ev.prompt();await ev.userChoice}catch(e){}moreRows();return}moreInstallHint(ltIOS()?'ios':'menu')};
// --- 画面 ---
function moreRows(){const P=window.LT_PLATFORM||{},web=P.name==='web';
  $('mInstall').hidden=!web||ltStandalone();$('mWebNote').hidden=!web;
  let po=false;try{po=!!(P.privacyOptionsRequired&&P.privacyOptionsRequired())}catch(e){}$('mPrivOpt').hidden=!po;
  $('mVer').textContent='LAST TELL v'+APP_VERSION.split('.').slice(0,2).join('.')}
function showMore(){mStat('');moreRows();show('more');$('moreH').focus&&$('btnMoreBack').focus({preventScroll:true})}
$('btnMore').onclick=showMore;$('btnMoreBack').onclick=()=>{show('title');$('btnMore').focus({preventScroll:true})};
$('mSet').onclick=()=>{$('setPanel').hidden=false;$('btnSetClose').focus()};
$('mExport').onclick=moreExport;$('mImport').onclick=moreImport;$('mSaveFile').onclick=moreSaveFile;$('mLoadFile').onclick=()=>$('mFile').click();
$('mDelete').onclick=moreDelete;$('mCredits').onclick=moreCredits;
$('mPrivOpt').onclick=()=>{try{window.LT_PLATFORM.showPrivacyOptions()}catch(e){}};
document.querySelectorAll('#more [data-link]').forEach(b=>b.onclick=()=>ltOpen(linkFor(b.dataset.link)));
// 設定パネルはタイトルからも開くので、卓の外に置く
document.querySelector('.wrap').appendChild($('setPanel'));
$('btnSound').addEventListener('click',()=>{if($('game').hidden)Sound.stop()});
addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(!$('moreDlg').hidden){e.preventDefault();mDlgClose()}else if(!$('setPanel').hidden&&$('game').hidden){e.preventDefault();$('btnSetClose').click()}});
// --- 初回だけの注意（B-5） ---
$('firstNotice').hidden=!!SETTINGS.seenNotice;
$('btnNoticeClose').onclick=()=>{SETTINGS.seenNotice=true;saveSettings();$('firstNotice').hidden=true;$('btnStory').focus({preventScroll:true})};
// --- ブラウザに消されにくくする（B-2c） ---
try{const st=navigator.storage;if(st&&st.persist)Promise.resolve(st.persisted?st.persisted():false).then(p=>p||st.persist()).catch(()=>{})}catch(e){}
// --- アプリ版：動画を見て続ける（C-7） ---
$('btnRefill').onclick=async()=>{const b=$('btnRefill');b.disabled=true;let ok=false;try{ok=await window.LT_PLATFORM.showRewarded('refill')}catch(e){}b.disabled=false;
  if(ok&&S&&S.result==='lose'&&!CFG.ch){const me=S.players[0];me.chips=(CFG.seats&&CFG.seats[0]&&CFG.seats[0].chips)||100000;S.result=null;S.review=null;S.msg='';render()}};
// --- Android の戻るボタン（C-1）：閉じたら true、タイトルなら false ---
window.LT_back=()=>{const H=id=>{const e=$(id);return !!e&&!e.hidden};
  if(H('moreDlg')){mDlgClose();return true}
  if(H('setPanel')){$('btnSetClose').click();return true}
  if(H('tour')){endTour();return true}
  for(const id of ['help','daily','share','stackZoom'])if(H(id)){$(id).hidden=true;return true}
  if(H('quiz')||H('vs'))return true;
  if(H('runBox')){const n=$('qtNo');if(n)n.click();return true}
  if(H('game')){$('btnQuit').click();return true}
  if(H('notebook')||H('scene')){showChapters();return true}
  if(H('chapters')||H('more')){show('title');return true}
  return false};
moreRows();

/* ===== UIリッチ化（案1〜5）の演出 ===== */
(function(){
  const t=$('table'),cam=$('cam');
  if(t&&cam){const lp=document.createElement('div');lp.className='rlamp';lp.setAttribute('aria-hidden','true');const hz=document.createElement('div');hz.className='haze';hz.setAttribute('aria-hidden','true');
    cam.after(lp);lp.after(hz)}
  // タイトル：カードの扇（PC と横向きだけ）
  const h=$('hero');if(h)h.insertAdjacentHTML('afterbegin','<div class="tfan" aria-hidden="true">'+cardHTML({},true,' noanim')+cardHTML({r:14,s:0},false,' noanim')+cardHTML({r:13,s:1},false,' noanim')+'</div>');
  // 押したとき、光が左から右へ一度流れる
  document.addEventListener('pointerdown',e=>{const b=e.target.closest&&e.target.closest('#game button.act,#game .quick button');if(!b||b.disabled||reducedMotion())return;
    b.classList.remove('zap');void b.offsetWidth;b.classList.add('zap');setTimeout(()=>b.classList.remove('zap'),450)},{passive:true});
  // 自分の名札（顔）の周りの持ち時間の輪：時計バーの長さを写す
  const ck=$('clock'),mine=$('mine');
  if(ck&&mine){const sync=()=>{const m=/scaleX\(([\d.]+)\)/.exec(ck.querySelector('i').style.transform||'');mine.style.setProperty('--rp',m?m[1]:'1');
      mine.style.setProperty('--ron',ck.hidden?'0':'1');mine.style.setProperty('--rc',ck.classList.contains('low')?'#d7263d':'#e2b65b')};
    new MutationObserver(sync).observe(ck,{attributes:true,subtree:true,attributeFilter:['style','class','hidden']});sync()}
})();
// 場面転換のぬぐい
let lwipeAt=0;
function lastWipe(){if(reducedMotion())return;const n=performance.now();if(n-lwipeAt<400)return;lwipeAt=n;
  const d=document.createElement('div');d.className='lwipe'+(SETTINGS.speed==='fast'?' fast':'');d.setAttribute('aria-hidden','true');document.body.appendChild(d);setTimeout(()=>d.remove(),SETTINGS.speed==='fast'?320:520)}
{const o=$('btnNext').onclick;$('btnNext').onclick=function(e){lastWipe();return o.call(this,e)}}
{const o=playScene;playScene=function(){lastWipe();return o.apply(this,arguments)}}
{const o=startChapter;startChapter=function(){lastWipe();return o.apply(this,arguments)}}
{const o=renderLine;renderLine=function(){const l=SC&&SC.lines[SC.i];if(l&&l.part)lastWipe();return o.apply(this,arguments)}}
// ポットの数字が増えたとき、一瞬ふくらむ
{const o=potCount;potCount=function(to,ms){const P=S&&S.potPile,from=P?P.shown||0:0;const r=o.apply(this,arguments);
  if(to>from&&!reducedMotion()){const pv=$('potSign').querySelector('.pv');if(pv){pv.classList.remove('bump');void pv.offsetWidth;pv.classList.add('bump')}}return r}}
// 勝ち札：勝った手に使われたカードを浮かせ、光を1回走らせる。役名の札を出す
function winCards(p){const cs=p.hand.concat(S.board);if(cs.length<5||!p.score)return[];let got=null;const idx=[];
  (function rec(st,k){if(got)return;if(k===5){if(cmp(eval5(idx.map(i=>cs[i])),p.score)===0)got=idx.slice();return}for(let i=st;i<=cs.length-(5-k);i++){idx.push(i);rec(i+1,k+1);idx.pop()}})(0,0);
  if(!got)return[];const c=p.score[0];
  if(c===0)return[got.reduce((a,i)=>cs[i].r>cs[a].r?i:a,got[0])];
  if(c===1||c===2||c===3||c===7){const n={};got.forEach(i=>n[cs[i].r]=(n[cs[i].r]||0)+1);return got.filter(i=>n[cs[i].r]>=2)}
  return got}
function winFx(){
  if(!S||!S.players||!S.handOver||S.street!=='showdown'||S.board2||S.board.length<3)return;
  const ws=S.players.filter(p=>p.won>0&&p.show&&p.score&&!p.folded&&p.hand.length===2);if(!ws.length)return;
  const first=S.wfxHand!==S.handNo;if(first){S.wfxHand=S.handNo;S.wfxT=performance.now()}
  const fresh=performance.now()-S.wfxT<400;
  ws.forEach(p=>{const i=S.players.indexOf(p),hold=i===0?$('mine').querySelectorAll('.hold .card'):($('spot'+i)?$('spot'+i).querySelectorAll('.hand .card'):[]),bd=$('boardCards').children;
    winCards(p).forEach(j=>{const el=j<2?hold[j]:bd[j-2];if(!el||el.classList.contains('win')||el.classList.contains('back'))return;el.classList.add('win');
      if(fresh){const g=document.createElement('i');g.className='wgl';g.setAttribute('aria-hidden','true');el.appendChild(g)}})});
  if(first){const top=ws.reduce((a,b)=>cmp(b.score,a.score)>0?b:a);const name=handName(top.score);
    setTimeout(()=>{if(!S||S.wfxHand!==S.handNo||$('game').hidden)return;const tb=$('table').getBoundingClientRect(),bc=$('boardCards').getBoundingClientRect();if(!bc.height)return;
      const old=$('table').querySelector('.wstamp');if(old)old.remove();
      const d=document.createElement('div');d.className='wstamp';d.setAttribute('aria-hidden','true');d.textContent=name;d.style.top=Math.round(bc.bottom-tb.top+20)+'px';$('table').appendChild(d);
      setTimeout(()=>d.remove(),1650)},380*SPEED())}}
{const o=render;render=function(){const r=o.apply(this,arguments);try{winFx()}catch(e){}return r}}