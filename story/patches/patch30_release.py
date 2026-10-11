import os,re,json,sys
os.chdir(os.path.dirname(os.path.abspath(__file__))+'/..')
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC).read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a);assert n==cnt,(a[:90],n);s=s.replace(a,b)
# 公開に向けてゲームに入れる分（release/ゲームに入れる分_実装仕様.md）。A-1 は work28 で直っている（.vs の overflow-y:auto）

# ---------- A-1 確認 ----------
assert '.vs{position:fixed;inset:0;z-index:50;display:flex;overflow-y:auto' in s and '.vsopps.n5{' in s

# ---------- A-2 PWA の行（先頭）＋ C-6 フォントの差し替え口 ----------
assert s.startswith('<title>')
HEAD='''<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#0d0e13">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="apple-mobile-web-app-title" content="LAST TELL">
'''
s=HEAD+s
rep('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?','<!-- C-6 フォント：アプリ版はこの1行を <link rel="stylesheet" id="fontcss" href="fonts/fonts.css"> に差し替える -->\n<link rel="stylesheet" id="fontcss" href="https://fonts.googleapis.com/css2?')

# ---------- 版・リンク・アプリ版の呼び口（ファイル先頭の1か所） ----------
rep('<script>\n// ===== 英語版：画面に出る日本語','''<script>
// ===== 版とリンク（ドメインが決まったら LINKS を差し替え）=====
const APP_VERSION='0.53.0';
const LINKS={privacy:'privacy.html',terms:'terms.html',support:'support.html'};
// Web版の既定。アプリ版（Capacitor）はこれを上書きする
window.LT_PLATFORM=window.LT_PLATFORM||{
  name:'web',
  openUrl:u=>window.open(u,'_blank','noopener'),
  track:(event,params)=>{},          // 計測（C-3）
  reportError:(err)=>{},             // クラッシュ検知（C-4）
  privacyOptionsRequired:()=>false,  // 「プライバシー設定」の行を出すか（C-2）
  showPrivacyOptions:()=>{},
  saveFile:null,                     // アプリ版はファイル保存を差し替える（B-2b）
  adBreak:async()=>false,            // 広告（C-7）。Web版は何もしない
  showRewarded:async()=>false,
  canShowRewarded:()=>false,
};
function ltTrack(ev,p){try{window.LT_PLATFORM.track&&window.LT_PLATFORM.track(ev,p||{})}catch(e){}}
function ltAd(kind){try{Promise.resolve(window.LT_PLATFORM.adBreak&&window.LT_PLATFORM.adBreak(kind)).catch(()=>{})}catch(e){}}
// C-4：エラーの報告
addEventListener('error',e=>{try{window.LT_PLATFORM.reportError(e.error||e.message)}catch(x){}});
addEventListener('unhandledrejection',e=>{try{window.LT_PLATFORM.reportError(e.reason)}catch(x){}});
// ===== 英語版：画面に出る日本語''')

# ---------- B-2 保存先の一覧 ----------
rep("const SAVE_VER=1;","""// 保存先の一覧。キーを足すときはここにも足す（引き継ぎコード・ファイル保存・セーブ削除が使う）
const SAVE_KEYS=['shisho-progress','shisho-settings','shisho-notes','shisho-manners','shisho-regular','shisho-quiz','shisho-titles','shisho-stars','shisho-advice','shisho-review','shisho-ura','shisho-run','shisho-read','shisho-story','shisho-guide','shisho-daily','shisho-rumor','shisho-leaks','shisho-talk'];
const SAVE_VER=1;""")
# 本体に出てくる shisho- のキーがすべて SAVE_KEYS にあるか
_keys=set(re.findall(r"'(shisho-[a-z]+)'",s))-{'shisho-cleared'}
_sk=set(re.search(r"const SAVE_KEYS=\[([^\]]*)\]",s).group(1).replace("'","").split(','))
assert _keys<=_sk,(_keys-_sk)

# ---------- C-5 ----------
rep("document.addEventListener('visibilitychange',()=>document.hidden?Sound.pause():Sound.resume());","document.addEventListener('visibilitychange',()=>document.hidden?Sound.pause():Sound.resume());\nwindow.Sound=Sound; // C-5：アプリ側が広告の前後で Sound.pause()／Sound.resume() を呼ぶ")

# ---------- C-3 計測・C-7 広告の呼び口 ----------
rep("function startChapter(ch,skipIntro){\n","function startChapter(ch,skipIntro){\n  ltTrack('chapter_start',{ch:ch.no});\n")
rep("function startFree(){\n","function startFree(){\n  ltTrack('free_start',{size:+$('freeSize').value||4});\n")
rep("function showDaily(){","function showDaily(){ltTrack('daily_play',{});")
rep("  if(S.result){talkReveal(true);log(S.result==='win'?'目標達成':'チップがなくなった',true)}",
    "  if(S.result){talkReveal(true);log(S.result==='win'?'目標達成':'チップがなくなった',true)}\n"
    "  if((S.result==='win'||S.result==='lose')&&!S.ltSent){S.ltSent=true;if(CFG.ch&&!CFG.ura){ltTrack(S.result==='win'?'chapter_clear':'game_over',{ch:CFG.ch.no});ltAd('chapter_end')}else if(!CFG.ch&&!CFG.run&&!CFG.ura)ltAd('free_end')}")
# フリー対戦でチップが尽きたとき：アプリ版で動画を見られるときだけ「動画を見て続ける」
rep('<button id="btnNext" class="act raise">次のハンドへ</button>','<button id="btnRefill" class="act" hidden>動画を見て続ける</button>\n          <button id="btnNext" class="act raise">次のハンドへ</button>')
rep("    const alt=$('btnAlt');\n","    const alt=$('btnAlt');\n    {let ok=false;try{ok=S.result==='lose'&&!CFG.ch&&!CFG.run&&!CFG.ura&&!!(window.LT_PLATFORM.canShowRewarded&&window.LT_PLATFORM.canShowRewarded())}catch(e){}$('btnRefill').hidden=!ok}\n")

# ---------- 設定パネルの閉じる：タイトルから開いたときは「その他」に戻る ----------
rep("$('btnSetClose').onclick=()=>{$('setPanel').hidden=true;$('btnSet').focus()};","$('btnSetClose').onclick=()=>{$('setPanel').hidden=true;(!$('game').hidden||!$('mSet')?$('btnSet'):$('mSet')).focus({preventScroll:true})};")

# ---------- show() に「その他」 ----------
rep("['title','chapters','scene','game','notebook'].forEach(s=>$(s).hidden=s!==id)","['title','chapters','scene','game','notebook','more'].forEach(s=>$(s).hidden=s!==id)")

# ---------- タイトル：初回の注意・「その他」ボタン ----------
rep('''  <section id="title">
    <div class="logo">''','''  <section id="title">
    <div class="fnotice" id="firstNotice" role="note" hidden><p>このゲームは、ポーカーを題材にした1人用のゲームです。チップは点数で、現金や景品とは交換できません。実際のお金を賭けることを勧めるものではありません。</p><button class="ghost small" id="btnNoticeClose">閉じる</button></div>
    <div class="logo">''')
rep('<button id="btnRun" hidden>はしご</button>','<button id="btnRun" hidden>はしご</button>\n        <button id="btnMore" class="ghost">その他</button>')

# ---------- その他の画面 ----------
MORE='''  <!-- その他 -->
  <section id="more" hidden aria-labelledby="moreH">
    <div class="top"><h2 id="moreH">その他</h2><button class="ghost small" id="btnMoreBack">タイトルへ</button></div>
    <div class="mgrid">
      <div class="mgroup"><h3>設定</h3>
        <button class="mrow" id="mSet"><b>設定</b><small>音・会話・演出の速さなど</small></button>
        <button class="mrow" id="mInstall"><b>ホーム画面に追加</b><small>アプリのように、すぐ開けるようになります</small></button>
      </div>
      <div class="mgroup"><h3>データ</h3>
        <button class="mrow" id="mExport"><b>引き継ぎコードを出す</b><small>機種変更やアプリ版への引き継ぎに</small></button>
        <button class="mrow" id="mImport"><b>引き継ぎコードを入れる</b></button>
        <button class="mrow" id="mSaveFile"><b>セーブをファイルに保存</b><small>バックアップに</small></button>
        <button class="mrow" id="mLoadFile"><b>ファイルから読み込む</b></button>
        <button class="mrow mdanger" id="mDelete"><b>セーブを消す</b></button>
        <input type="file" id="mFile" accept=".json,application/json" hidden>
        <p class="mstat" id="mStat" aria-live="polite"></p>
        <p class="mnote" id="mWebNote">ブラウザのデータを消すとセーブも消えます。ときどきファイルに保存しておくと安心です。</p>
      </div>
      <div class="mgroup"><h3>情報</h3>
        <button class="mrow mlink" data-link="privacy"><b>プライバシーポリシー</b></button>
        <button class="mrow mlink" data-link="terms"><b>利用規約</b></button>
        <button class="mrow mlink" data-link="support"><b>お問い合わせ</b></button>
        <button class="mrow" id="mCredits"><b>クレジットとライセンス</b></button>
        <button class="mrow" id="mPrivOpt" hidden><b>プライバシー設定</b><small>広告と計測の同意を選び直す</small></button>
      </div>
    </div>
    <p class="mfoot"><span class="mver" id="mVer" data-noi18n>LAST TELL</span><span>チップは点数です。現金や景品とは交換できません。</span></p>
  </section>

'''
rep('  <!-- 章選択 -->\n',MORE+'  <!-- 章選択 -->\n')
rep('  <div class="tour" id="tour" hidden role="dialog" aria-label="操作の案内"></div>\n','  <div class="tour" id="tour" hidden role="dialog" aria-label="操作の案内"></div>\n  <div class="mdlg" id="moreDlg" hidden role="dialog" aria-modal="true" aria-labelledby="mdlgH"><div class="mdlgin" id="moreDlgIn"></div></div>\n')

CSS='''
/* ===== その他（設定・データ・情報） ===== */
.fnotice{grid-column:1/-1;display:flex;gap:10px;align-items:flex-start;margin:34px 0 0;padding:10px 12px;background:#15161df0;border:1px solid #e2b65b44;border-left:3px solid var(--gold);font-size:.8rem;line-height:1.7}
.fnotice p{margin:0;flex:1;min-width:0}
.fnotice button{flex:none}
#more{display:grid;gap:14px;align-content:start;padding-block:8px 4px}
#more .top h2{margin:0;font-family:var(--display);font-size:1.4rem;letter-spacing:.08em}
.mgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:14px;align-items:start}
.mgroup{display:grid;gap:6px;background:var(--panel);padding:12px;min-width:0}
.mgroup h3{margin:0 0 2px;font-size:.78rem;letter-spacing:.2em;color:var(--gold)}
button.mrow{clip-path:none;display:grid;gap:2px;width:100%;box-sizing:border-box;text-align:left;padding:9px 12px;min-height:48px;background:#1c1e27;border:1px solid #ffffff1c;border-radius:6px;letter-spacing:.02em;font-weight:700}
button.mrow:hover:not(:disabled){background:#252836}
.mrow b{font-size:.9rem}.mrow small{font-size:.72rem;color:var(--muted);font-weight:500;line-height:1.5}
.mrow.mlink b::after{content:" \\2197";color:var(--muted);font-weight:500}
.mrow.mdanger b{color:#ff8a98}
.mnote{margin:2px 0 0;font-size:.72rem;line-height:1.6;color:var(--muted)}
.mstat{margin:0;font-size:.78rem;color:var(--gold);min-height:0}.mstat:empty{display:none}
.mfoot{display:flex;flex-wrap:wrap;gap:4px 14px;justify-content:center;margin:0;font-size:.72rem;color:var(--muted);text-align:center}
.mver{font-family:var(--num);letter-spacing:.08em}
.mdlg{position:fixed;inset:0;z-index:85;display:flex;overflow-y:auto;overscroll-behavior:contain;padding:16px;background:rgba(5,6,10,.84)}
.mdlgin{margin:auto;width:min(100%,480px);box-sizing:border-box;background:#12131a;border:1px solid #ffffff22;padding:16px;display:grid;gap:10px;box-shadow:0 10px 30px rgba(0,0,0,.6);min-width:0}
.mdlgin h3{margin:0;font-size:1.02rem;font-family:var(--display);letter-spacing:.04em}
.mdlgin p{margin:0;font-size:.84rem;line-height:1.7}
.mdlgin .mwarn{color:#ffd59a}
.mdlgin .merr{color:#ff8a98;font-weight:700}.merr:empty{display:none}
.mcode{display:block;width:100%;box-sizing:border-box;min-height:6.5em;max-height:38vh;resize:vertical;background:#0b0c11;color:var(--ink);border:1px solid #ffffff33;border-radius:6px;padding:8px;font:500 .76rem/1.5 ui-monospace,Menlo,Consolas,monospace;word-break:break-all;overflow-wrap:anywhere;white-space:pre-wrap}
.mbtns{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}
.mbtns button{min-width:7em}
.mbtns button.danger{background:#7a1a28;color:#fff}
.msum{background:#1c1e27;padding:8px 10px;border-left:3px solid var(--gold);font-weight:700}
.mcred{display:grid;gap:10px;font-size:.84rem}
.mcred .mct{font-family:var(--display);font-size:1.05rem;color:var(--gold)}
.mcred dl{display:grid;grid-template-columns:auto minmax(0,1fr);gap:4px 14px;margin:0}
.mcred dt{color:var(--muted)}.mcred dd{margin:0}
.mcred h4{margin:0;font-size:.82rem;color:var(--muted);font-weight:700}
.mcred ul{margin:0;padding:0;list-style:none;display:grid;gap:6px}
.mcred li{display:grid;gap:1px}
.mcred li span{font-size:.74rem;color:var(--muted)}
.mcred a{color:var(--gold);font-size:.74rem}
.msteps{margin:0;padding-left:1.3em;font-size:.84rem;line-height:1.8}
@media (max-height:500px){.mdlg{padding:8px}.mdlgin{padding:12px;gap:8px}.mcode{max-height:30vh;min-height:4.5em}}
@media (prefers-reduced-motion:reduce){button.mrow{transition:none}}
'''
rep('\n</style>\n<svg width="0" height="0"',CSS+'</style>\n<svg width="0" height="0"')

JS=r'''
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
'''
rep("document.querySelectorAll('[data-home]').forEach(b=>b.onclick=()=>show('title'));\n</script>","document.querySelectorAll('[data-home]').forEach(b=>b.onclick=()=>show('title'));\n"+JS+"</script>")
assert s.rstrip().endswith('</script>')
# ---------- A-2 Service Worker（https・localhost のときだけ。file:// や Artifact の中では何もしない） ----------
s=s.rstrip()+'''
<script>
try{if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')&&window.self===window.top&&(!window.LT_PLATFORM||window.LT_PLATFORM.name==='web')){
  addEventListener('load',()=>{try{navigator.serviceWorker.register('sw.js').catch(()=>{})}catch(e){}});
}}catch(e){}
</script>
'''

EN={
'その他':'More','データ':'Data','情報':'Info',
'音・会話・演出の速さなど':'Sound, chat, animation speed and more',
'ホーム画面に追加':'Add to Home Screen','アプリのように、すぐ開けるようになります':'Open it in one tap, like an app',
'引き継ぎコードを出す':'Get transfer code','機種変更やアプリ版への引き継ぎに':'For moving to a new device or the app version',
'引き継ぎコードを入れる':'Enter transfer code','セーブをファイルに保存':'Save to file','バックアップに':'For backups',
'ファイルから読み込む':'Load from file','セーブを消す':'Delete save data',
'ブラウザのデータを消すとセーブも消えます。ときどきファイルに保存しておくと安心です。':"Clearing your browser data also deletes your save. Saving to a file now and then keeps it safe.",
'プライバシーポリシー':'Privacy Policy','利用規約':'Terms of Use','お問い合わせ':'Contact & Support',
'クレジットとライセンス':'Credits & Licenses','プライバシー設定':'Privacy settings','広告と計測の同意を選び直す':'Change your consent for ads and analytics',
'チップは点数です。現金や景品とは交換できません。':'Chips are points only. They cannot be exchanged for money or prizes.',
'このゲームは、ポーカーを題材にした1人用のゲームです。チップは点数で、現金や景品とは交換できません。実際のお金を賭けることを勧めるものではありません。':'This is a single-player game themed on poker. Chips are points only and cannot be exchanged for money or prizes. It does not encourage gambling with real money.',
'やめておく':'Cancel',
'引き継ぎコード':'Transfer code','機種変更やアプリ版への引き継ぎに使えます。他の人には教えないでください。':"Use this to move your progress to a new device or the app version. Don't share it with anyone.",
'コピー':'Copy','コピーしました':'Copied','コピーできませんでした。コードを長押しして選んでください':"Couldn't copy. Press and hold the code to select it.",
'出しておいたコードを貼り付けて「読み込む」を押してください。':'Paste the code you saved, then tap “Load”.',
'読み込む':'Load','コードを貼り付けてください。':'Please paste a code.',
'コードが正しくありません。コピーし直してください。':"That code isn't valid. Please copy it again.",
'新しい版のゲームで作られたコードです。ゲームを更新してください。':'This code was made by a newer version of the game. Please update the game.',
'このブラウザでは、このコードを読めません。ブラウザを新しくするか、ファイルで引き継いでください。':"This browser can't read this code. Update your browser, or transfer with a save file instead.",
'このセーブを読み込みますか？':'Load this save?','今のセーブを上書きします。':'This will overwrite your current save.','上書きする':'Overwrite',
'読み込めませんでした':"Couldn't load",'LAST TELL のセーブファイルではありません。':'This is not a LAST TELL save file.',
'新しい版のゲームで作られたセーブです。ゲームを更新してください。':'This save was made by a newer version of the game. Please update the game.',
'ブラウザに保存できませんでした。空き容量や、プライベートブラウズの設定を確かめてください。':"Couldn't write to browser storage. Check free space and private browsing settings.",
'セーブを消しますか？':'Delete save data?',
'すべての進み具合・設定・メモが消えます。元に戻せません。先に引き継ぎコードを出しておくこともできます。':"All progress, settings and notes will be deleted. This can't be undone. You can get a transfer code first.",
'消す':'Delete',
'LAST TELL（最後のテル）':'LAST TELL','制作':'Created by','シナリオ・絵・プログラム':'Story, art & code','効果音':'Sound effects','ゲーム内で合成（自作）':'Synthesized in-game',
'フォント':'Fonts','ライセンス全文':'Full license text','いずれも SIL Open Font License 1.1 で使用しています。':'Used under the SIL Open Font License 1.1.',
'テストプレイに協力してくださった皆さん、ありがとうございました。':'Thank you to everyone who helped playtest.',
'このゲームに登場する人物・店・団体はすべて架空のものです。':'All characters, venues and organizations in this game are fictional.',
'チップは点数で、現金や景品とは交換できません。':'Chips are points only and cannot be exchanged for money or prizes.',
'Safari の下（iPad は上）にある共有ボタンを押します':'Tap the Share button at the bottom of Safari (top on iPad)',
'「ホーム画面に追加」を選びます':'Choose “Add to Home Screen”','右上の「追加」を押します':'Tap “Add” in the top right',
'ホーム画面のアイコンから開くと、画面いっぱいで遊べます。':'Open it from the Home Screen icon to play full screen.',
'ブラウザのメニューから「アプリをインストール」（または「ホーム画面に追加」）を選んでください。':'Open your browser menu and choose “Install app” (or “Add to Home screen”).',
'動画を見て続ける':'Watch a video to continue',
}
TP=[['第{0}章までクリア、称号{1}個','Cleared through Ch.{0}, {1} titles'],['章のクリアはまだ、称号{0}個','No chapters cleared yet, {0} titles'],
    ['セーブファイルを作りました：{0}','Save file created: {0}']]
for k in EN: assert '夜' not in k
rep('const EN_DICT={','const EN_DICT='+json.dumps(EN,ensure_ascii=False)[:-1]+',')
rep('const EN_TPL=[','const EN_TPL='+json.dumps(TP,ensure_ascii=False)[:-1]+',')
open(OUT,'w').write(s);print('ok')
