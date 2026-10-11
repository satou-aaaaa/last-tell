'use strict';
const path=require('path'),fs=require('fs');const H=require('/mnt/project-files/qa/lib/harness');
(async()=>{const browser=await H.launch();
const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,serviceWorkers:'block'});
await ctx.route(/^https?:\/\/(?!localhost)/,r=>r.abort());
await ctx.addInitScript(`try{localStorage.setItem('shisho-settings',JSON.stringify({v:1,talk:'on',speed:'normal',sound:false,quiz:false,lang:'ja',cam:'strong'}));localStorage.setItem('shisho-nv','1')}catch(e){}`);
if(process.argv[3])await ctx.addInitScript({path:process.argv[3]});
const page=await ctx.newPage();await page.goto('file://'+path.resolve(process.argv[2]),{waitUntil:'load'});await page.waitForTimeout(1200);
await page.evaluate(`($('freeSize').value='6',$('freeRule').value='',startFree())`);
const clickAway=`(()=>{const sb=document.querySelector('.seatbtn');if(sb&&sb.getClientRects().length)sb.click();for(const id of ['vsGo','tourSkip','btnNoticeClose','btnHelpClose','btnDailyClose','askGo','lkOk','rvOk','twN','btnShowNo','btnIgnore','qtNo']){const e=document.getElementById(id);if(e&&e.getClientRects().length)e.click()}if(S&&S.toAct===0&&!S.handOver){const b=[...document.querySelectorAll('#controls button.act')].find(x=>!x.disabled&&x.getClientRects().length&&/コール|チェック/.test(x.textContent));if(b)b.click()}const n=document.getElementById('btnNext');if(n&&n.getClientRects().length&&!n.disabled)n.click()})()`;
await page.addScriptTag({content:`setInterval(()=>{try{${clickAway}}catch(e){}},400)`});
await page.waitForTimeout(2500);
const c=await ctx.newCDPSession(page);await c.send('Emulation.setCPUThrottlingRate',{rate:4});
await browser.startTracing(page,{path:'t2.json',categories:['devtools.timeline','disabled-by-default-devtools.timeline']});
await page.waitForTimeout(10000);await browser.stopTracing();await browser.close();
const ev=JSON.parse(fs.readFileSync('t2.json')).traceEvents.filter(e=>e.ph==='X'&&e.dur);
const main=ev.filter(e=>e.name==='RunTask'&&e.dur>200000);
const tid=main.length?main[0].tid:0;
const agg={};let tot=0;
for(const t of main){tot+=t.dur;for(const e of ev){if(e.tid!==t.tid||e.ts<t.ts||e.ts+e.dur>t.ts+t.dur||e===t)continue;if(['UpdateLayoutTree','Layout','ParseHTML','Paint','PrePaint','HitTest','Layerize','RecalculateStyles','IntersectionObserverController::computeIntersections','UpdateLayer','V8.GC_MC_BACKGROUND_MARKING','MinorGC','MajorGC'].includes(e.name)){agg[e.name]=(agg[e.name]||0)+e.dur}}}
console.log('long tasks',main.length,'total ms',Math.round(tot/1000));
Object.entries(agg).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(k,Math.round(v/1000)));
// biggest UpdateLayoutTree: elementCount
const ult=ev.filter(e=>e.name==='UpdateLayoutTree'&&e.dur>20000).sort((a,b)=>b.dur-a.dur).slice(0,5).map(e=>[Math.round(e.dur/1000),JSON.stringify(e.args).slice(0,200)]);console.log(ult);
})();
