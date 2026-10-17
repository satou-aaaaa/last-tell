// 実戦：フリー6人・普通の速さ・自分は自動でコール。CPUが打つ間 15秒の重さと、寄った回数
'use strict';
const H = require('/mnt/project-files/qa/lib/harness');
const file = process.argv[2], label = process.argv[3]||file;
(async () => {
  const browser = await H.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block', reducedMotion: 'no-preference' });
  await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  await ctx.addInitScript(`{let a=12345;Math.random=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}try{localStorage.setItem('shisho-settings',JSON.stringify({v:1,talk:'on',speed:'normal',sound:false,quiz:false,lang:'ja',cam:'strong'}));localStorage.setItem('shisho-nv','1')}catch(e){}
   window.__raf={};const __r=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=function(cb){const n=(cb.name||'anon')+':'+String(cb).slice(0,60).replace(/\s+/g,' ');return __r(t=>{const a=performance.now();try{cb(t)}finally{const d=performance.now()-a;const o=__raf[n]||(__raf[n]=[0,0]);o[0]++;o[1]+=d}})};window.__fr=[];(function f(t){__fr.push(t);requestAnimationFrame(f)})(0);`);
  const page = await ctx.newPage(); const errs=[]; page.on('pageerror',e=>errs.push(e.message));
  await page.goto('file://' + require('path').resolve(file), { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  await page.evaluate(`($('freeSize').value='6',$('freeRule').value='',startFree())`);
  const clickAway = `(()=>{const sb=document.querySelector('.seatbtn');if(sb&&sb.getClientRects().length)sb.click();for(const id of ['vsGo','tourSkip','btnNoticeClose','btnHelpClose','btnDailyClose','askGo','nvNew','lkOk','rvOk','twN','btnShowNo','btnIgnore','qtNo']){const e=document.getElementById(id);if(e&&e.getClientRects().length)e.click()}})()`;
  await page.waitForTimeout(1500);
  await page.addScriptTag({ content: `window.__sf=[0,0,0];window.__le=[0,0];const __sf0=sayFollow;window.sayFollow=function(){const a=performance.now();const r=__sf0();__sf[0]++;__sf[1]+=performance.now()-a;if(r&&camState.kind==='wide')__sf[2]++;return r};
  LT.on('layout',()=>{});window.__z={mid:0,tell:0,wide:0};const __ct=camTo;window.camTo=function(i,k){if(camState.kind!==k||camState.i!==i)__z[k==='me'?'tell':k]=(__z[k]||0)+1;return __ct.apply(this,arguments)};
    window.__autoMe=setInterval(()=>{try{${clickAway};if(S&&S.toAct===0&&!S.handOver){const c=[...document.querySelectorAll('#controls button.act')].find(x=>!x.disabled&&x.getClientRects().length&&/コール|チェック|call|check/i.test(x.textContent));if(c)c.click()}const n=document.getElementById('btnNext');if(n&&n.getClientRects().length&&!n.disabled)n.click()}catch(e){}},400)` });
  await page.waitForTimeout(2000);
  const c = await ctx.newCDPSession(page);
  await c.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await c.send("Tracing.start",{categories:"devtools.timeline,disabled-by-default-devtools.timeline",transferMode:"ReturnAsStream"});
  const s = await page.evaluate(() => { for(const k in __raf)delete __raf[k];__sf[0]=__sf[1]=__sf[2]=0;__z={mid:0,tell:0,wide:0}; return { f: __fr.length, t: performance.now() } });
  await page.waitForTimeout(20000);
  const e = await page.evaluate(s => ({ fr: __fr.slice(s.f), t: performance.now() - s.t, raf: Object.entries(__raf).sort((a,b)=>b[1][1]-a[1][1]).slice(0,8).map(([k,v])=>k+' n'+v[0]+' '+Math.round(v[1])+'ms'), sf: __sf.map(Math.round), z: __z, hands: S.handNo }), s);
  const ev=[];await new Promise(ok=>{c.on("Tracing.tracingComplete",async x=>{let str="";for(;;){const r=await c.send("IO.read",{handle:x.stream});str+=r.data;if(r.eof)break}JSON.parse(str).traceEvents.forEach(y=>ev.push(y));ok()});c.send("Tracing.end")});
  const sum={};ev.forEach(x=>{if(x.ph==="X"&&x.dur)sum[x.name]=(sum[x.name]||0)+x.dur/1000});
  const iv=[];for(let i=1;i<e.fr.length;i++)iv.push(e.fr[i]-e.fr[i-1]);const srt=iv.slice().sort((a,b)=>a-b);
  console.log(JSON.stringify(Object.entries(sum).filter(([k])=>!/Draw|Display|Software|Renderer|Pipeline|Graphics|Viz|viz/.test(k)).sort((a,b)=>b[1]-a[1]).slice(0,22).map(([k,v])=>k+":"+Math.round(v))));console.log(JSON.stringify({label,fps:Math.round(iv.length/(e.t/1000)),p95:Math.round(srt[Math.floor(srt.length*.95)]),slow50:iv.filter(x=>x>50).length,slow100:iv.filter(x=>x>100).length,max:Math.round(srt[srt.length-1]),raster:Math.round(sum.RasterTask||0),paint:Math.round(sum.Paint||0),zoom:e.z,sayFollow:e.sf,raf:e.raf,errs:errs.slice(0,2)}));
  await browser.close();
})();
