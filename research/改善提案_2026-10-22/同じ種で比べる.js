const H=require('/home/claude/satou-aaaaa/last-tell/qa/lib/harness.js');
const file='/home/claude/satou-aaaaa/last-tell/index.html';
(async()=>{const b=await H.launch();const fast=+process.argv[2]||20;const throttle=+process.argv[3]||1;
for(let r=0;r<(+process.argv[4]||3);r++){const {ctx,page}=await H.openGame(b,file,{viewport:{width:1280,height:800},fast,lite:false,settings:{motion:'full'},seed:1007,deal:32,storage:H.UNLOCKED});
 if(throttle>1){const c=await ctx.newCDPSession(page);await c.send('Emulation.setCPUThrottlingRate',{rate:throttle});}
 await page.evaluate(`($('freeSize').value='6',startFree())`);
 const first=await page.evaluate(()=>S.players.map(p=>p.name).join(','));
 await H.startBot(page,{policy:'call',maxHands:99});
 const t0=Date.now();let out='';while(Date.now()-t0<60000){out=await page.evaluate(()=>S&&S.handOver&&S.handNo>=1&&!document.getElementById('btnNext').hidden?JSON.stringify({h:S.handNo,p:S.players.map(p=>p.name+':'+p.chips+(p.folded?'f':'')),board:(S.board||[]).map(c=>c.r+c.s).join(' ')}):'');if(out)break;await page.waitForTimeout(150)}
 console.log(r,'seat-start',first,'\n  ',out);await ctx.close()}
await b.close()})();
