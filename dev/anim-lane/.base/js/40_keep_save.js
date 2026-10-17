/* ---------- 改善提案 2026-10-14b §2：iPhone で記録が消えにくくする（2026-10-14 satou「すべて」） ---------- */
// 第一部の第1章・第3章をクリアして章の一覧に戻ったときに1回だけ、店主の一言で「ホーム画面に追加」（Android・PC はインストール）と「引き継ぎコードを控える」を出す。
// 卓の上（#game が見えている間）には出さない。保存は SETTINGS.keepAsk（0／1＝第1章の分を出した／2＝第3章の分も出した。「あとで」でも出したことにする）
// 章の区切りに出す窓は、ここの CQ に並べて1つずつ出す（40_rest_line・40_feedback も使う）
const CQ={q:[],add(f){this.q.push(f);cqSoon()}};
let cqT=0;
function cqSoon(){clearTimeout(cqT);cqT=setTimeout(cqRun,400)}
function cqRun(){if(!CQ.q.length)return;if(!$('moreDlg').hidden||!$('game').hidden||!$('scene').hidden)return;
  while(CQ.q.length){const f=CQ.q.shift();let shown=false;try{shown=!!f()}catch(e){console.error('[LT] cq',e)}if(shown)return}}
// 窓が閉じたら次へ。章の一覧・タイトルに戻ったときにも見る
try{new MutationObserver(()=>{if($('moreDlg').hidden)cqSoon()}).observe($('moreDlg'),{attributes:true,attributeFilter:['hidden']})}catch(e){}
LT.on('show',id=>{if(id==='chapters'||id==='title')cqSoon()});
// 章の区切りの小さな窓（顔＋一言＋ボタン）。btns は [文, 押したとき] の並び。最後のボタンは閉じるだけでもよい
function cqDlg(who,line,btns){const id='cq'+Date.now();
  mDlg(`<h3 id="mdlgH" class="cqh"><span class="ava">${avatar(who)}</span>${esc(who)}</h3><p class="cqline">${esc(line)}</p><div class="mbtns">${btns.map((b,i)=>`<button id="${id}_${i}"${i===0?' class="primary"':''}>${esc(b[0])}</button>`).join('')}</div>`);
  btns.forEach((b,i)=>{const e=$(id+'_'+i);if(e)e.onclick=()=>{mDlgClose();try{b[1]&&b[1]()}catch(x){}}});return true}
const KEEP_LINES={ios1:'ここの常連はな、店の札を手元に置いとくんだ。……ホーム画面に置いておけ。そうすりゃ、記録が消えにくい',
  inst1:'ここの常連はな、店の札を手元に置いとくんだ。……入れておけ',code3:'念のためだ。引き継ぎの札も控えておけ'};
function keepAsk(n){const k=+SETTINGS.keepAsk||0;if(ltStandalone())return false;
  if(n===1&&k<1){const ios=ltIOS();if(!ios&&!ltInstall)return false;SETTINGS.keepAsk=1;saveSettings();
    return ios?cqDlg('店主',KEEP_LINES.ios1,[['ホーム画面に追加',()=>moreInstallHint('ios')],['あとで']])
      :cqDlg('店主',KEEP_LINES.inst1,[['インストール',async()=>{const ev=ltInstall;ltInstall=null;if(!ev)return;try{await ev.prompt();await ev.userChoice}catch(e){}}],['あとで']])}
  if(n===3&&k<2&&ltIOS()){SETTINGS.keepAsk=2;saveSettings();return cqDlg('店主',KEEP_LINES.code3,[['引き継ぎコードを控える',()=>setTimeout(moreExport,50)],['あとで']])}
  return false}
// 第一部の章のクリアは saveCleared を通る（第二部は p2Win、フリーは通らない）
let KS_CLEAR=0;
{const _sc=saveCleared;saveCleared=function(n){try{if(CFG&&CFG.ch&&!CFG.ch.p2&&!CFG.ura&&!CFG.run)KS_CLEAR=n}catch(e){}return _sc.apply(this,arguments)}}
LT.on('show',id=>{if((id==='chapters'||id==='title')&&KS_CLEAR){const n=KS_CLEAR;KS_CLEAR=0;LT.emit('storyClear',n);if(n===1||n===3)CQ.add(()=>keepAsk(n))}});
