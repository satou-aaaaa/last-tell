// ===== 新しい版のお知らせ（案12、2026-10-10） =====
// sw.js はネット優先なので、開き直せばいつも最新版。ただ、スマホでホーム画面から開いたままだと古い版が残る。
// 画面に戻ってきたとき（30分に1回まで）sw.js の更新を確かめ、新しい版が入ったら、
// タイトル画面にいるときだけ「新しい版があります」を出す（ハンドや会話の途中では出さない）。
(function(){
  const SAFE=['title'];let ready=false,last=Date.now(),cur='title';
  const bar=()=>document.getElementById('ltUpd');
  function paint(){
    const b=bar(),ok=ready&&SAFE.includes(cur);
    if(!ok){if(b)b.hidden=true;return}
    if(b){b.hidden=false;return}
    const d=document.createElement('div');d.id='ltUpd';d.setAttribute('role','status');
    d.innerHTML='<span>'+tr('新しい版があります')+'</span><button type="button">'+tr('読み込み直す')+'</button>';
    d.querySelector('button').onclick=()=>location.reload();document.body.appendChild(d);
  }
  LT.updateReady=()=>{ready=true;paint()}; // 検査用にも使う
  LT.on('show',id=>{cur=id;paint()});
  if(!('serviceWorker' in navigator)||!window.LT_PLATFORM||window.LT_PLATFORM.name!=='web')return;
  let had=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(had)LT.updateReady();had=true});
  const check=()=>{if(Date.now()-last<30*60e3)return;last=Date.now();
    navigator.serviceWorker.getRegistration().then(r=>r&&r.update()).catch(()=>{})};
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check()});
})();
