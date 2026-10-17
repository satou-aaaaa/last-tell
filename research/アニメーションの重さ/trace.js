'use strict';
const path=require('path');const H=require('/mnt/project-files/qa/lib/harness');
const file=process.argv[2];const mode=process.argv[3]||'mobile';
const M=mode==='mobile'?{vp:{width:390,height:844},dpr:3,rate:4,mob:true}:mode==='land'?{vp:{width:844,height:390},dpr:3,rate:4,mob:true}:{vp:{width:1280,height:800},dpr:1,rate:1,mob:false};
const VAR=process.env.VAR?JSON.parse(process.env.VAR):{none:'',breathe:'.bust .body',blink:'g.eyes',haze:'.haze',bokeh:'body,body::before,body::after',thand:'.t-hand',all:'*,*::before,*::after'};
(async()=>{const browser=await H.launch();
const ctx=await browser.newContext({viewport:M.vp,deviceScaleFactor:M.dpr,isMobile:M.mob,hasTouch:M.mob,serviceWorkers:'block',reducedMotion:'no-preference'});
await ctx.route(/^https?:\/\/(?!localhost)/,r=>r.abort());
await ctx.addInitScript(`try{localStorage.setItem('shisho-settings',JSON.stringify({v:1,talk:'on',speed:'normal',sound:false,quiz:false,lang:'ja',cam:'strong'}));localStorage.setItem('shisho-nv','1')}catch(e){}
window.__fr=[];(function f(t){__fr.push(t);requestAnimationFrame(f)})(0);
window.__tm={};const st=setTimeout,si=setInterval;const tag=(f,d,k)=>{const n=k+String(d)+':'+String(f).slice(0,60).replace(/\\s+/g,' ');return function(){__tm[n]=(__tm[n]||0)+1;return f.apply(this,arguments)}};
window.setTimeout=(f,d,...a)=>typeof f==='function'?st(tag(f,d,'T'),d,...a):st(f,d,...a);window.setInterval=(f,d,...a)=>typeof f==='function'?si(tag(f,d,'I'),d,...a):si(f,d,...a);`);
const page=await ctx.newPage();const c=await ctx.newCDPSession(page);await c.send('Performance.enable');await c.send('Emulation.setCPUThrottlingRate',{rate:M.rate});
await page.goto('file://'+path.resolve(file));await page.waitForTimeout(1500);
const clickAway=`(()=>{const sb=document.querySelector('.seatbtn');if(sb&&sb.getClientRects().length)sb.click();for(const id of ['vsGo','tourSkip','btnNoticeClose','btnHelpClose','btnDailyClose','askGo','nvNew','lkOk','rvOk','twN','btnShowNo','btnIgnore','qtNo']){const e=document.getElementById(id);if(e&&e.getClientRects().length)e.click()}})()`;
await page.evaluate(`($('freeSize').value='6',$('freeRule').value='',startFree())`);await page.waitForTimeout(1500);await page.evaluate(clickAway);
await page.waitForFunction(`S&&S.toAct===0&&!S.handOver`,null,{timeout:30000}).catch(()=>{});await page.waitForTimeout(1500);
// freeze turn clock so we stay idle
const metrics=async()=>Object.fromEntries((await c.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
const rounds=+process.argv[4]||2;const res={};
for(let r=0;r<rounds;r++)for(const [k,sel] of Object.entries(VAR)){
 await page.evaluate(s=>{let e=document.getElementById('__abl');if(!e){e=document.createElement('style');e.id='__abl';document.head.appendChild(e)}e.textContent=s?s+'{animation-play-state:paused!important}':''},sel);
 await page.waitForTimeout(400);
 await c.send('Tracing.start',{categories:'devtools.timeline,disabled-by-default-devtools.timeline,cc,viz',transferMode:'ReturnAsStream'});const m0=await metrics();const f0=await page.evaluate(()=>(__tm={},__fr.length));const t0=Date.now();
 await page.waitForTimeout(3000);
 const m1=await metrics();
 const ev=await new Promise(async res=>{c.once('Tracing.tracingComplete',async({stream})=>{let d='';for(;;){const r=await c.send('IO.read',{handle:stream});d+=r.data;if(r.eof)break}await c.send('IO.close',{handle:stream});res(JSON.parse(d).traceEvents||JSON.parse(d))});await c.send('Tracing.end')});
 const agg={};for(const x of ev){if(!['Paint','RasterTask','PrePaint','UpdateLayoutTree','Layerize','Commit','Layout','AnimationFrame::Render','ScheduledAction','UpdateLayer','PaintImage','Decode Image'].includes(x.name))continue;const a=agg[x.name]=agg[x.name]||{n:0,ms:0};a.n++;if(x.dur)a.ms+=x.dur/1000}
 const tr=Object.entries(agg).map(([k,v])=>k+':'+v.n+"/"+Math.round(v.ms/3)+"ms").join(' ');const e=await page.evaluate(f=>({fr:__fr.slice(f),tm:__tm}),f0);const sec=(Date.now()-t0)/1000;
 const iv=[];for(let i=1;i<e.fr.length;i++)iv.push(e.fr[i]-e.fr[i-1]);
 const d=x=>Math.round((m1[x]-m0[x])*1000/sec);
 (res[k]=res[k]||[]).push({fps:Math.round(iv.length/sec),task:d('TaskDuration'),style:d('RecalcStyleDuration'),layout:d('LayoutDuration'),script:d('ScriptDuration'),styles:Math.round((m1.RecalcStyleCount-m0.RecalcStyleCount)/sec),tr});
 if(r===0&&k==='none')console.log('timers/3s',JSON.stringify(e.tm,null,1));
}
const still=await page.evaluate(`S&&S.toAct===0&&!S.handOver`);console.log('still own turn',still);
for(const[k,v]of Object.entries(res))console.log(k.padEnd(8),v.map(x=>`fps${x.fps} task${x.task} style${x.style}(${x.styles}) lay${x.layout} js${x.script}\n      ${x.tr}`).join(' | '));
await browser.close()})();
