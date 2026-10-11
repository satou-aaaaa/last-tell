const path=require('path');const H=require('/mnt/project-files/qa/lib/harness');
(async()=>{const b=await H.launch();const {ctx,page}=await H.openGame(b,'base_fast.html',{});
console.log(await page.evaluate(()=>{const seed=s=>{let a=s;Math.random=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
 const fast=bestN;const spots=[];seed(1);for(let i=0;i<300;i++){const d=fullDeck();for(let k=51;k>0;k--){const j=Math.floor(Math.random()*(k+1));[d[k],d[j]]=[d[j],d[k]]}spots.push({h:d.slice(0,2),b:d.slice(2,2+[0,3,4,5][i%4]),o:1+i%5,n:[0,.3,.6][i%3]})}
 const run=()=>{seed(99);return spots.map(s=>equity(s.h,s.b,s.o,150,s.n))};
 bestN=__origBest;let t=performance.now();const A=run();const ta=performance.now()-t;bestN=fast;t=performance.now();const B=run();const tb=performance.now()-t;
 return {same:A.every((x,i)=>x===B[i]),n:A.length,origMs:Math.round(ta),fastMs:Math.round(tb)}}));
await ctx.close();await b.close()})();
