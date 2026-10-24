'use strict';
const path=require('path');const H=require('/mnt/project-files/qa/lib/harness');
const file=process.argv[2];const W=+process.argv[3]||1280,Hh=+process.argv[4]||800;
const VAR={none:'',nofx:'*,*::before,*::after{filter:none!important;backdrop-filter:none!important;box-shadow:none!important;text-shadow:none!important}',noanim:'*,*::before,*::after{animation-play-state:paused!important}'};
(async()=>{const browser=await H.launch();
const ctx=await browser.newContext({viewport:{width:W,height:Hh},deviceScaleFactor:1,serviceWorkers:'block'});
await ctx.route(/^https?:\/\/(?!localhost)/,r=>r.abort());
await ctx.addInitScript(`try{localStorage.setItem('shisho-settings',JSON.stringify({v:1,talk:'on',speed:'normal',sound:false,quiz:false,lang:'ja',cam:'strong'}));localStorage.setItem('shisho-nv','1')}catch(e){}
window.__fr=[];(function f(t){__fr.push(t);requestAnimationFrame(f)})(0);`);
const page=await ctx.newPage();const c=await ctx.newCDPSession(page);await c.send('Performance.enable');
await page.goto('file://'+path.resolve(file));await page.waitForTimeout(1500);
const clickAway=`(()=>{const sb=document.querySelector('.seatbtn');if(sb&&sb.getClientRects().length)sb.click();for(const id of ['vsGo','tourSkip','btnNoticeClose','btnHelpClose','btnDailyClose','askGo','nvNew','lkOk','rvOk','twN','btnShowNo','btnIgnore','qtNo']){const e=document.getElementById(id);if(e&&e.getClientRects().length)e.click()}})()`;
await page.evaluate(`($('freeSize').value='6',$('freeRule').value='',startFree())`);await page.waitForTimeout(1500);await page.evaluate(clickAway);
await page.addScriptTag({content:`setInterval(()=>{try{${clickAway};if(S&&S.toAct===0&&!S.handOver){const c=[...document.querySelectorAll('#controls button.act')].find(x=>!x.disabled&&x.getClientRects().length&&/コール|チェック/.test(x.textContent));if(c)c.click()}const n=document.getElementById('btnNext');if(n&&n.getClientRects().length&&!n.disabled)n.click()}catch(e){}},400)`});
console.log('pcw',await page.evaluate(()=>document.documentElement.className));
const metrics=async()=>Object.fromEntries((await c.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
for(let r=0;r<2;r++)for(const [k,css] of Object.entries(VAR)){
 await page.evaluate(s=>{let e=document.getElementById('__abl');if(!e){e=document.createElement('style');e.id='__abl';document.head.appendChild(e)}e.textContent=s},css);
 await page.waitForTimeout(400);
 await c.send('Tracing.start',{categories:'devtools.timeline,disabled-by-default-devtools.timeline,cc,viz',transferMode:'ReturnAsStream'});const m0=await metrics();const f0=await page.evaluate(()=>__fr.length);const t0=Date.now();
 await page.waitForTimeout(6000);const m1=await metrics();
 const ev=await new Promise(async res=>{c.once('Tracing.tracingComplete',async({stream})=>{let d='';for(;;){const r=await c.send('IO.read',{handle:stream});d+=r.data;if(r.eof)break}await c.send('IO.close',{handle:stream});const j=JSON.parse(d);res(j.traceEvents||j)});await c.send('Tracing.end')});
 const sec=(Date.now()-t0)/1000;const agg={};for(const x of ev){if(!['Paint','RasterTask','PrePaint','Layerize','Commit','Layout','UpdateLayoutTree','FunctionCall','EvaluateScript'].includes(x.name))continue;const a=agg[x.name]=agg[x.name]||0;agg[x.name]+=(x.dur||0)/1000}
 const fr=await page.evaluate(f=>__fr.slice(f),f0);const iv=[];for(let i=1;i<fr.length;i++)iv.push(fr[i]-fr[i-1]);
 const d=x=>Math.round((m1[x]-m0[x])*1000/sec);
 console.log(k.padEnd(7),'fps',Math.round(iv.length/sec),'slow>50ms',iv.filter(x=>x>50).length,'main',d('TaskDuration'),'js',d('ScriptDuration'),'style',d('RecalcStyleDuration'),'layout',d('LayoutDuration'),'|',Object.entries(agg).map(([a,b])=>a+':'+Math.round(b/sec)).join(' '));
}
await browser.close()})();
