const H=require('/mnt/project-files/qa/lib/harness');
const who=process.argv[2]||'ゲン',out=process.argv[3]||'gen',mood=process.argv[4]||'normal';
(async()=>{const b=await H.launch();const ctx=await b.newContext({viewport:{width:1000,height:1000},deviceScaleFactor:1});
await ctx.route(/^https?:\/\/(?!localhost)/,r=>r.abort());
const p=await ctx.newPage();await p.goto('file:///mnt/project-files/story/shisho.html');await p.waitForTimeout(1000);
const svg=await p.evaluate(([w,m])=>avatar(w,m),[who,mood]);
const q=await ctx.newPage();await q.setContent(`<html style="background:transparent"><body style="margin:0;background:transparent"><div id="fx">${svg}</div><style>#fx svg{width:1000px;height:1000px;display:block}*{animation:none!important}</style></body></html>`);
const set=async(o)=>q.evaluate(o=>{const sv=document.querySelector('#fx svg');sv.querySelectorAll('.t-smile').forEach(e=>e.style.opacity=o.smile?1:0);sv.querySelectorAll('.t-talk').forEach(e=>e.style.opacity=o.talk?1:0);sv.querySelectorAll('.t-sweat').forEach(e=>e.style.opacity=0);
 sv.querySelectorAll('g.eyes').forEach(e=>{e.style.transformBox='fill-box';e.style.transformOrigin='center';e.style.transform=o.blink?'scaleY(.08)':''});},o);
for(const [n,o] of [['base',{}],['smile',{smile:1}],['talk',{talk:1}],['blink',{blink:1}]]){await set(o);await q.waitForTimeout(100);await q.screenshot({path:`assets/${out}_${n}.png`,clip:{x:0,y:0,width:1000,height:1000},omitBackground:true})}
await b.close()})();
