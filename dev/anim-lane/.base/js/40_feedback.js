/* ---------- 改善提案 2026-10-14b §4：テスト版の感想の入口（2026-10-14 satou「すべて」） ---------- */
// URL に ?test=1 があるとき（一度付けて開いたら SETTINGS.tester に残す。?test=0 で消す）だけ、その他の画面に「感想を送る」。
// 押すと「アンケートを開く」（LINKS.survey が空の間は押せない）と「遊んだ記録をコピー」。第1章・第3章のクリア後に1回ずつ、ジンが感想を聞く（SETTINGS.fbAsk）。
// 外へは何も送らない。コピーする文に名前・ニックネーム・手札・引き継ぎコードは入れない
try{const q=new URLSearchParams(location.search).get('test');if(q==='1'&&!SETTINGS.tester){SETTINGS.tester=true;saveSettings()}else if(q==='0'&&SETTINGS.tester){SETTINGS.tester=false;saveSettings()}}catch(e){}
function fbText(){let o={};try{o=JSON.parse(localStorage.getItem(STATS_KEY))||{}}catch(e){}
  const sum=m=>Object.values(m&&typeof m==='object'?m:{}).reduce((a,b)=>a+(+b||0),0);
  const st=Object.keys(o.chStart||{}).map(Number).filter(n=>n>=1&&n<=7),reach=st.length?Math.max(...st):0;
  let p2=0;try{p2=loadP2().cleared}catch(e){}
  const qt=Object.entries(o.quit||{}).map(([k,n])=>`${/^\d+$/.test(k)?`第${k}章`:k==='store'?'店で遊ぶ':'フリー'} ${n}回`).join('、')||'なし';
  return [`LAST TELL v${APP_VERSION.split('.').slice(0,2).join('.')} test`,`章: 第一部 ${reach} まで（クリア ${loadCleared()}）／第二部 ${p2}`,
    `ハンド: ${sum(o.hands)}`,`やめた場所: ${qt}`,`画面: ${innerWidth}x${innerHeight} ${innerHeight>=innerWidth?'縦':'横'}、言葉 ${SETTINGS.lang==='en'?'en':'ja'}`].join('\n')}
function fbCopy(){const t=fbText(),done=ok=>{const e=$('fbStat');if(e)e.textContent=ok?'コピーしました。アンケートの最後に貼ってください':'コピーできませんでした'};
  const fallback=()=>{try{const a=document.createElement('textarea');a.value=t;a.setAttribute('readonly','');a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();const ok=document.execCommand('copy');a.remove();done(ok)}catch(e){done(false)}};
  try{navigator.clipboard.writeText(t).then(()=>done(true),fallback)}catch(e){fallback()}}
function fbOpen(){const u=LINKS.survey||'';
  mDlg(`<h3 id="mdlgH">感想を送る</h3><p>アンケートの最後に、遊んだ記録を貼ってください。記録には名前や手札は入りません。</p><p class="mstat" id="fbStat" aria-live="polite"></p>
    <div class="mbtns"><button data-x>閉じる</button><button id="fbCopy">遊んだ記録をコピー</button><button class="primary" id="fbSurvey"${u?'':' disabled'}>アンケートを開く</button></div>`,'#fbCopy');
  $('fbCopy').onclick=fbCopy;$('fbSurvey').onclick=()=>{if(u)ltOpen(u)}}
LT.on('show',id=>{if(id!=='more')return;let b=$('mFeedback');
  if(!b){const sup=document.querySelector('#more .mlink[data-link="support"]');if(!sup)return;b=document.createElement('button');b.className='mrow';b.id='mFeedback';
    b.innerHTML='<b>感想を送る</b><small>テスト版の感想（アンケートと遊んだ記録）</small>';sup.parentNode.insertBefore(b,sup);b.onclick=fbOpen}
  b.hidden=!SETTINGS.tester});
LT.on('storyClear',n=>{if(!SETTINGS.tester||(n!==1&&n!==3))return;const k=+SETTINGS.fbAsk||0;if((n===1&&k>=1)||(n===3&&k>=2))return;
  SETTINGS.fbAsk=n===1?1:2;saveSettings();CQ.add(()=>cqDlg('ジン','……感想を聞かせてくれ。直すのは、聞いてからだ',[['感想を送る',()=>setTimeout(fbOpen,50)],['あとで']]))});
