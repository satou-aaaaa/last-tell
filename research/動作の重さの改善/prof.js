'use strict';
const path=require('path'),fs=require('fs');const H=require('/mnt/project-files/qa/lib/harness');
const file=process.argv[2];
(async()=>{const browser=await H.launch();
const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,serviceWorkers:'block'});
await ctx.route(/^https?:\/\/(?!localhost)/,r=>r.abort());
if(process.argv[3])await ctx.addInitScript({path:process.argv[3]});
await ctx.addInitScript(`try{localStorage.setItem('shisho-settings',JSON.stringify({v:1,talk:'on',speed:'normal',sound:false,quiz:false,lang:'ja',cam:'strong'}));localStorage.setItem('shisho-nv','1')}catch(e){}
window.__lt=[];try{new PerformanceObserver(l=>l.getEntries().forEach(e=>__lt.push([Math.round(e.startTime),Math.round(e.duration)]))).observe({type:'longtask'})}catch(e){}`);
const page=await ctx.newPage();await page.goto('file://'+path.resolve(file),{waitUntil:'load'});await page.waitForTimeout(1200);
const c=await ctx.newCDPSession(page);
await page.evaluate(`($('freeSize').value='6',$('freeRule').value='',startFree())`);
const clickAway=`(()=>{const sb=document.querySelector('.seatbtn');if(sb&&sb.getClientRects().length)sb.click();for(const id of ['vsGo','tourSkip','btnNoticeClose','btnHelpClose','btnDailyClose','askGo','lkOk','rvOk','twN','btnShowNo','btnIgnore','qtNo']){const e=document.getElementById(id);if(e&&e.getClientRects().length)e.click()}if(S&&S.toAct===0&&!S.handOver){const b=[...document.querySelectorAll('#controls button.act')].find(x=>!x.disabled&&x.getClientRects().length&&/コール|チェック/.test(x.textContent));if(b)b.click()}const n=document.getElementById('btnNext');if(n&&n.getClientRects().length&&!n.disabled)n.click()})()`;
await page.addScriptTag({content:`setInterval(()=>{try{${clickAway}}catch(e){}},400)`});
await page.waitForTimeout(2000);
await c.send('Emulation.setCPUThrottlingRate',{rate:4});
await c.send('Profiler.enable');await c.send('Profiler.setSamplingInterval',{interval:500});await c.send('Profiler.start');
const m0=await page.evaluate(()=>__lt.length);
await page.waitForTimeout(15000);
const {profile}=await c.send('Profiler.stop');
console.log('long tasks',JSON.stringify(await page.evaluate(k=>__lt.slice(k),m0)));
// self time by function
const byId={};profile.nodes.forEach(n=>byId[n.id]=n);
const self={};const dt=profile.timeDeltas;const tot={};
profile.samples.forEach((s,i)=>{const n=byId[s];const k=n.callFrame.functionName+' :'+n.callFrame.lineNumber;self[k]=(self[k]||0)+(dt[i]||0)/1000});
console.log('SELF');Object.entries(self).sort((a,b)=>b[1]-a[1]).slice(0,25).forEach(([k,v])=>console.log(Math.round(v),k));
// inclusive
const parent={};profile.nodes.forEach(n=>(n.children||[]).forEach(ch=>parent[ch]=n.id));
const inc={};profile.samples.forEach((s,i)=>{const seen=new Set();let id=s;while(id){const n=byId[id];const k=n.callFrame.functionName+' :'+n.callFrame.lineNumber;if(!seen.has(k)){seen.add(k);inc[k]=(inc[k]||0)+(dt[i]||0)/1000}id=parent[id]}});
console.log('INCL');Object.entries(inc).sort((a,b)=>b[1]-a[1]).slice(0,60).forEach(([k,v])=>console.log(Math.round(v),k));
await browser.close()})();
