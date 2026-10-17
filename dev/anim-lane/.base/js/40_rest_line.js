/* ---------- 改善提案 2026-10-14b §3：長く遊んだら、ひと息（2026-10-14 satou「すべて」） ---------- */
// 起動してから続けて60分遊んだあと、次の章の区切り（章の一覧・タイトルに戻ったとき）で、ジン（第二部はアオ）が1回だけ一言。
// 画面が隠れている間は数えない。1回の起動で1回だけ。設定 SETTINGS.rest（既定オン）で切れる。時間は保存しない
const REST={ms:0,at:performance.now(),done:false,p2:false};
function restMs(){return REST.ms+(document.hidden||REST.at==null?0:performance.now()-REST.at)}
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(REST.at!=null)REST.ms+=performance.now()-REST.at;REST.at=null}else REST.at=performance.now()});
const REST_LINES={p1:['ジン','……今日はここまでにしとけ。卓は逃げない'],p2:['アオ','今日はここまでにしよう。卓は逃げない。……ジンさんの受け売りだけどな']};
// どの部の卓から戻ったか（第二部の卓を立った・クリアした後はアオ）
LT.on('show:before',id=>{try{if(id!=='game'&&!$('game').hidden&&typeof CFG!=='undefined'&&CFG)REST.p2=!!(CFG.ch&&CFG.ch.p2)}catch(e){}});
LT.on('show',id=>{if(id!=='chapters'&&id!=='title')return;if(REST.done||SETTINGS.rest===false||restMs()<60*60000)return;
  try{if(S&&S.storyHand)return;if(CFG&&CFG.flashback)return}catch(e){}
  REST.done=true;const [who,line]=REST.p2?REST_LINES.p2:REST_LINES.p1;CQ.add(()=>cqDlg(who,line,[['わかった']]))});
// 設定（くわしい設定の中、30b_pro_fixes の B4 と同じ形）
{const det=document.querySelector('#setIn .setmore');if(det){const r=document.createElement('div');r.className='setrow';
  r.innerHTML='<div><b>長く遊んだら知らせる</b><p>60分続けて遊んだら、章の区切りで一度だけ声をかけます</p></div><button id="btnRest" class="mini"></button>';det.appendChild(r);
  const lab=()=>{$('btnRest').textContent=SETTINGS.rest===false?'知らせる：オフ':'知らせる：オン'};
  $('btnRest').onclick=()=>{SETTINGS.rest=SETTINGS.rest===false;saveSettings();lab()};lab()}}
