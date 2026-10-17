// ===== エラーの記録（案11、2026-10-10） =====
// 起きたエラーを端末の中に最大20件ためる（外へは送らない）。その他画面の「不具合を報告」でコピーして、お問い合わせに貼ってもらう。
// アプリ版の reportError（Crashlytics など）がある場合も、先に記録してからそちらを呼ぶ。
SAVE_KEYS.push('shisho-errlog');
const ERRLOG_KEY='shisho-errlog',ERRLOG_MAX=20;
(function(){
  const P=window.LT_PLATFORM,orig=P.reportError;
  P.reportError=function(err){
    try{
      const m=String(err&&err.message||err).slice(0,200),at=String(err&&err.stack||'').split('\n').slice(1,3).map(s=>s.trim()).join(' / ').slice(0,300);
      const vis=id=>{const e=document.getElementById(id);return e&&!e.hidden&&e.offsetParent!==null};
      const sc=['game','scene','title','chapters','more','notebook'].find(vis)||'';
      const o=saveGet(ERRLOG_KEY,{v:1,list:[]});const L=Array.isArray(o.list)?o.list:[];
      const same=L.find(x=>x.m===m&&x.at===at&&x.ver===APP_VERSION);
      if(same){same.n=(same.n||1)+1;same.t=new Date().toISOString()}
      else{L.unshift({t:new Date().toISOString(),m,at,ver:APP_VERSION,sc,
        ch:typeof CFG!=='undefined'&&CFG&&CFG.ch?(CFG.ch.id||CFG.ch.title||''):'',
        hand:typeof S!=='undefined'&&S?S.handNo:null,seed:LT.seeds&&LT.seeds[0]||null,n:1})}
      saveSet(ERRLOG_KEY,{v:1,list:L.slice(0,ERRLOG_MAX)});
    }catch(e){}
    try{orig&&orig.apply(this,arguments)}catch(e){}
  };
})();
function errlogText(){
  const L=(saveGet(ERRLOG_KEY,{v:1,list:[]}).list)||[];
  const head=`LAST TELL ${APP_VERSION} / ${navigator.userAgent} / ${innerWidth}x${innerHeight}`;
  if(!L.length)return head+'\n'+tr('エラーの記録はありません');
  return head+'\n'+L.map((x,i)=>`#${i+1} ${x.t} ×${x.n||1} v${x.ver} ${x.sc}${x.ch?' '+x.ch:''}${x.hand!=null?' hand'+x.hand:''}${x.seed?' seed'+x.seed:''}\n  ${x.m}\n  ${x.at}`).join('\n');
}
function errlogCopy(){
  const t=errlogText(),n=((saveGet(ERRLOG_KEY,{v:1,list:[]}).list)||[]).length,st=document.getElementById('mStat');
  const done=ok=>{if(st)st.textContent=ok?tr('コピーしました')+`（${n}）。`+tr('「お問い合わせ」に貼って送ってください'):tr('コピーできませんでした')};
  const fallback=()=>{try{const a=document.createElement('textarea');a.value=t;a.setAttribute('readonly','');a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();const ok=document.execCommand('copy');a.remove();done(ok)}catch(e){done(false)}};
  try{navigator.clipboard.writeText(t).then(()=>done(true),fallback)}catch(e){fallback()}
}
LT.on('show',id=>{
  if(id!=='more'||document.getElementById('mReport'))return;
  const sup=document.querySelector('#more .mlink[data-link="support"]');if(!sup)return;
  const b=document.createElement('button');b.className='mrow';b.id='mReport';
  b.innerHTML='<b>'+tr('不具合を報告')+'</b><small>'+tr('起きたエラーの記録をコピーします。「お問い合わせ」に貼ってください')+'</small>';
  b.onclick=errlogCopy;sup.after(b);
});
