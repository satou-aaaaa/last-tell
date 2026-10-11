'use strict';
const path=require('path');const H=require('/mnt/project-files/qa/lib/harness');
const file=process.argv[2],mode=process.argv[3]||'mobile';
const M=mode==='mobile'?{vp:{width:390,height:844},dpr:3,rate:4,mob:true}:mode==='land'?{vp:{width:844,height:390},dpr:3,rate:4,mob:true}:{vp:{width:1280,height:800},dpr:1,rate:1,mob:false};
const V=JSON.parse(require('fs').readFileSync(process.argv[4]||'v1.json','utf8'));
(async()=>{const browser=await H.launch();
const ctx=await browser.newContext({viewport:M.vp,deviceScaleFactor:M.dpr,isMobile:M.mob,hasTouch:M.mob,serviceWorkers:'block'});
await ctx.route(/^https?:\/\/(?!localhost)/,r=>r.abort());
await ctx.addInitScript(`try{localStorage.setItem('shisho-settings',JSON.stringify({v:1,talk:'on',speed:'normal',sound:false,quiz:false,lang:'ja',cam:'strong'}));localStorage.setItem('shisho-nv','1')}catch(e){}`);
const page=await ctx.newPage();await page.goto('file://'+path.resolve(file),{waitUntil:'load'});await page.waitForTimeout(1200);
await page.evaluate(`($('freeSize').value='6',$('freeRule').value='',startFree())`);
for(let k=0;k<60;k++){await page.evaluate(()=>{for(const id of ['vsGo','tourSkip','btnNoticeClose','btnHelpClose','btnDailyClose','askGo']){const e=document.getElementById(id);if(e&&e.getClientRects().length)e.click()}const sb=document.querySelector('.seatbtn');if(sb&&sb.getClientRects().length)sb.click()});
 if(await page.evaluate(()=>S&&S.toAct===0&&!S.handOver&&$('vs').hidden))break;await page.waitForTimeout(300)}
await page.waitForTimeout(1500);
const c=await ctx.newCDPSession(page);await c.send('Emulation.setCPUThrottlingRate',{rate:M.rate});
const res={};
for(const [k,css] of Object.entries(V)){
 await page.evaluate(css=>{let s=document.getElementById('__abl');if(!s){s=document.createElement('style');s.id='__abl';document.head.appendChild(s)}s.textContent=css},css);
 await page.waitForTimeout(700);
 const r=await page.evaluate(async()=>{const fr=[];let run=true;const f=t=>{fr.push(t);if(run)requestAnimationFrame(f)};requestAnimationFrame(f);await new Promise(r=>setTimeout(r,3500));run=false;const iv=[];for(let i=1;i<fr.length;i++)iv.push(fr[i]-fr[i-1]);const s=iv.reduce((a,b)=>a+b,0);return{fps:Math.round(iv.length/(s/1000)),slow:iv.filter(x=>x>50).length}});
 res[k]=r;console.log(k,JSON.stringify(r));
}
await browser.close()})();
