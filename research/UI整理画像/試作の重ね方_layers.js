// 各案の「見た目の試作」：本物のゲームに CSS と少しの JS を足して撮る（ゲーム本体は変えない）
const L=[];
// ---- 案1 片付け ----
L[1]={css:`
.potsign .ps{display:none!important}
.n6 .say,.say{font-size:.66rem!important;max-width:30%!important}
.say.mk-old{display:none!important}
.t3d .needlerow{right:auto!important;left:76px!important;bottom:56px!important;translate:none!important}
.t3d .needlerow .needle{font-size:0!important;width:40px;height:40px;padding:0!important;border-radius:50%!important;display:grid;place-items:center;opacity:.9}
.t3d .needlerow .needle::before{content:'💬';font-size:18px}
#btnStraddle{display:none!important}
.raisepanel #raiseWord{font-size:.72rem!important}
.raisepanel .amtsub{display:none!important}
.raisepanel .rangelbl{display:none!important}
#game.mk-end .hud .msg{visibility:hidden}
#setIn .setrow button,#setIn button.mini{min-width:56px}
.mk-sw{display:inline-block;width:46px;height:26px;border-radius:13px;background:#2a2d38;border:1px solid #ffffff33;position:relative;vertical-align:middle}
.mk-sw::after{content:'';position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#9aa0ad;transition:none}
.mk-sw.on{background:#7a2030;border-color:#e2b65b}.mk-sw.on::after{left:22px;background:#e2b65b}
`,js:`(()=>{const s=[...document.querySelectorAll('.say')].filter(e=>getComputedStyle(e).opacity>0.05);s.slice(0,-1).forEach(e=>e.classList.add('mk-old'));
 if(S&&S.handOver)document.getElementById('game').classList.add('mk-end');
 const rw=document.getElementById('raiseWord');if(rw&&!document.getElementById('raisePanel').hidden)rw.textContent='いくらにする？';
 document.querySelectorAll('#setIn button').forEach(b=>{const m=b.textContent.match(/^(.+?)：(.+)$/);if(!m)return;const on=!/オフ|なし|しない/.test(m[2]);
  if(/オン|オフ|あり|なし/.test(m[2])&&!/^音/.test(m[1])){b.innerHTML='<span class="mk-sw'+(on?' on':'')+'"></span>';b.style.background='none';b.style.border='0';b.style.boxShadow='none'}else{b.textContent=m[2]+' ▾'}});
})()`};
// ---- 案2 卓を1画面に ----
L[2]={css:`
html,body{overflow:hidden!important}
#game header.g,#game #goal,#game #meta,#game details.logbox{display:none!important}
#game .gwrap{gap:0!important;padding-top:46px}
.mk-top{position:fixed;left:0;right:0;top:0;height:44px;z-index:40;display:flex;align-items:center;gap:10px;padding:0 12px;background:linear-gradient(180deg,#14161e,#0d0e13);border-bottom:1px solid rgba(226,182,91,.35);font-size:.78rem;color:#cfd3dc;box-sizing:border-box}
.mk-top b{color:#f3ead7;font-size:.86rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.mk-top .ib{width:34px;height:34px;display:grid;place-items:center;border:1px solid #ffffff2a;color:#f3ead7;font-size:16px;flex:none;clip-path:polygon(8% 0,100% 0,92% 100%,0 100%);background:#1c1f2a}
.mk-top .goalchip{margin-left:auto;flex:none;padding:5px 10px;border:1px solid rgba(226,182,91,.6);color:#e2b65b;font-weight:800;font-size:.72rem;letter-spacing:.08em;white-space:nowrap}
.mk-top .bl{opacity:.7;white-space:nowrap;flex:none}
#game .t3d{height:calc(100vh - 46px - var(--mkbar,132px))!important;min-height:0!important}
#game #controls,#game #between{position:fixed!important;left:50%;transform:translateX(-50%);bottom:0;width:min(560px,100%);box-sizing:border-box}
#game .sensei{position:fixed!important;left:50%;transform:translateX(-50%);width:min(536px,calc(100% - 24px));bottom:calc(var(--mkbar,132px) + 8px);z-index:32;background:rgba(10,11,16,.9)!important;border:1px solid rgba(226,182,91,.4);padding:6px 10px!important;box-sizing:border-box}
#game .sensei .ava{width:34px!important;height:34px!important}
#game .sensei p{font-size:.78rem;line-height:1.45}
#game .raisepanel{gap:6px!important}
#game .raisepanel .amtrow{grid-template-columns:44px 1fr 44px!important}
#game .raisepanel output{font-size:1.6rem!important}
@media (orientation:landscape) and (max-height:520px){
 #game .gwrap{padding-top:0}
 .mk-top{left:auto;right:0;width:var(--side);height:40px;gap:6px;padding:0 8px;z-index:45}
 .mk-top .bl{display:none}
 .mk-top .ib{width:30px;height:30px;font-size:13px}
 #game .t3d{height:calc(100vh - 8px)!important;margin-top:0}
 #game #controls,#game #between{left:auto;right:0;transform:none;width:var(--side);top:0;justify-content:flex-end}
 #game .sensei{left:auto!important;right:0!important;transform:none!important;top:44px!important;bottom:auto!important;width:var(--side)!important;max-height:none;border:0;border-left:3px solid rgba(226,182,91,.6)}
}
`,js:`(()=>{if(document.querySelector('.mk-top')||document.getElementById('game').hidden)return;const t=document.createElement('div');t.className='mk-top';
 const ttl=(document.getElementById('gTitle')||{}).textContent||'';const meta=(document.getElementById('meta')||{}).textContent||'';const m=meta.match(/([\\d,]+\\/[\\d,]+).*?(#\\d+)/);
 t.innerHTML='<span class="ib">≡</span><b>'+ttl+'</b><span class="bl">'+(m?m[1]+'　'+m[2]:'')+'</span><span class="goalchip">目標 ▾</span><span class="ib">⚙</span>';document.body.appendChild(t);
 const c=document.querySelector('#controls:not([hidden])')||document.querySelector('#between:not([hidden])');if(c)document.documentElement.style.setProperty('--mkbar',c.getBoundingClientRect().height+'px');
 scrollTo(0,0);
 const tb=document.getElementById('table');const land=innerWidth>innerHeight&&innerHeight<=520;
 if(!land&&tb&&c&&!tb.dataset.mkh){tb.dataset.mkh=1;const ro=!!c.querySelector('#raisePanel:not([hidden])');const top=tb.getBoundingClientRect().top;tb.style.setProperty('height',Math.max(380,innerHeight-top-(ro?132:c.getBoundingClientRect().height))+'px','important')}
})()`};
// ---- 案3 卓の外も整理 ----
L[3]={css:`
#title #btnHow,#title #btnDaily,#title #btnRun,#title .rulepick{display:none!important}
#title .row{display:grid!important;grid-template-columns:1fr;gap:10px!important;max-width:340px}
#title .row button{min-height:54px;font-size:1.05rem}
#title .fnotice{order:9;font-size:.72rem}
#title .logo p{display:none}
@media (orientation:landscape) and (max-height:520px){
 #title{grid-template-columns:1fr 1fr!important;padding-block:10px!important;min-height:100vh;box-sizing:border-box}
 #title .logo h1{font-size:3.2rem!important;line-height:.95}
 #title .fnotice{display:none!important}
 #title .hero{display:none!important}
 #title .row{position:absolute;right:24px;top:50%;transform:translateY(-50%);width:300px}
}
#chList li.ch{display:grid!important;grid-template-columns:40px minmax(0,1fr) auto!important;grid-template-rows:auto auto!important;gap:2px 10px!important;padding:10px 12px!important;min-height:0!important;align-items:center}
#chList li.ch .no{grid-row:1/3;font-size:1.4rem!important}
#chList li.ch .t{grid-column:2;font-size:.98rem!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex!important;gap:6px;align-items:center}
#chList li.ch .v{grid-column:2;grid-row:2;font-size:.74rem!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block!important}
#chList li.ch .v > :not(.reg){display:none!important}
#chList li.ch .v .reg{margin-left:8px;display:inline!important;border:0!important;padding:0!important}
#chList li.ch .act{grid-column:3;grid-row:1/3}
#chList li.ch .act button{min-height:40px;padding:0 12px!important;font-size:.82rem}
#chList li.ch .act::after{content:'⋯';display:inline-grid;place-items:center;width:36px;height:40px;margin-left:6px;border:1px solid #ffffff2a;color:#cfd3dc;vertical-align:middle}
#chList li.ch .done,#chList li.ch details,#chList li.ch .mk-hide{display:none!important}
#chList{gap:6px!important}
#chapters .answer,#answerNote{display:none!important}
#setIn .mk-grp{margin:14px 0 4px;font-size:.7rem;letter-spacing:.2em;color:#e2b65b;font-weight:800}
#setIn .mk-more{margin-top:10px;padding:12px;border:1px dashed #ffffff33;color:#cfd3dc;font-size:.82rem;text-align:center}
#setIn p,#setIn .sd,#setIn small{display:none!important}
`,js:`(()=>{document.querySelectorAll('#chList li.ch').forEach(li=>{li.querySelectorAll(':scope > *').forEach(x=>{if(!/^(no|t|v|act)$/.test(x.className.split(' ')[0]))x.classList.add('mk-hide')})});
 const si=document.getElementById('setIn');if(si&&!si.dataset.mk&&!document.getElementById('setPanel').hidden){si.dataset.mk=1;
  const rows=[...si.children].filter(x=>!x.classList.contains('sethead'));
  const keep=['音','演出の速さ','手札'];let shown=0;
  rows.forEach(r=>{const tx=r.textContent;const k=keep.find(w=>tx.trim().startsWith(w));if(!k)r.style.display='none';else shown++});
  const g=document.createElement('div');g.className='mk-grp';g.textContent='よく使う';si.insertBefore(g,rows[0]);
  const m=document.createElement('div');m.className='mk-more';m.textContent='くわしい設定（カメラ・立体・持ち時間・負けた手 ほか8つ） ▸';si.appendChild(m)}
})()`};
// ---- 案4 作り替え（PC・横を専用の並びに） ----
L[4]={css:`
@media (min-width:1000px){
 #game .gwrap{max-width:1180px!important;display:grid!important;grid-template-columns:minmax(0,1fr) 300px;grid-template-rows:auto 1fr;column-gap:14px;padding-top:50px}
 #game .t3d{grid-column:1;height:calc(100vh - 50px - 150px)!important}
 .mk-side{grid-column:2;grid-row:1/3;display:grid;gap:10px;align-content:start;font-size:.8rem;color:#cfd3dc;max-height:calc(100vh - 60px);overflow:hidden}
 .mk-side section{background:#12141b;border:1px solid #ffffff1c;padding:10px 12px}
 .mk-side h4{margin:0 0 6px;font-size:.7rem;letter-spacing:.2em;color:#e2b65b}
 .mk-side li{list-style:none;padding:3px 0;border-bottom:1px solid #ffffff10}
 .mk-side ul{margin:0;padding:0}
 #game #controls,#game #between{left:calc(50% - 157px)!important;width:min(866px,calc(100% - 330px))!important}
 #game .sensei{position:static!important;transform:none!important;width:auto!important;grid-column:2}
}
@media (orientation:landscape) and (max-height:520px){
 #game .acts .act{min-height:74px!important;font-size:1.05rem}
 #game #quick button{min-height:48px}
 #game .mk-lh{position:fixed;right:8px;top:48px;z-index:46;font-size:.68rem;color:#cfd3dc;border:1px solid #ffffff2a;padding:4px 8px}
}
`,js:`(()=>{if(innerWidth<1000||document.querySelector('.mk-side'))return;const g=document.querySelector('#game .gwrap');const d=document.createElement('div');d.className='mk-side';
 const logs=[...document.querySelectorAll('#log > *')].slice(-8).map(x=>'<li>'+x.textContent+'</li>').join('')||'<li>（このハンドの記録）</li>';
 const notes=[...document.querySelectorAll('#notes > *')].slice(-4).map(x=>'<li>'+x.textContent+'</li>').join('')||'<li>まだメモはない</li>';
 const goal=(document.querySelector('#goal .gm')||{}).textContent||'';
 d.innerHTML='<section><h4>目標</h4>'+goal+'</section><section><h4>ハンドの記録</h4><ul>'+logs+'</ul></section><section><h4>相手メモ</h4><ul>'+notes+'</ul></section>';g.appendChild(d);
 const tb=document.getElementById('table').getBoundingClientRect();document.querySelectorAll('#controls,#between').forEach(c=>{c.style.setProperty('left',tb.left+'px','important');c.style.setProperty('width',tb.width+'px','important');c.style.setProperty('transform','none','important')})})()`};
module.exports=L;
