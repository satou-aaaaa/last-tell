const pw=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
const secs=+process.argv[2]||90;
(async()=>{const b=await pw.chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({viewport:{width:1600,height:900},recordVideo:{dir:'vid',size:{width:1600,height:900}}});const p=await ctx.newPage();
const logs=[];p.on('console',m=>logs.push((Date.now()/1000).toFixed(1)+' '+m.text()));p.on('pageerror',e=>logs.push('ERR '+e.message));
const t0=Date.now();await p.goto('http://localhost:8765/index.html?auto');
await p.waitForTimeout(secs*1000);await ctx.close();await b.close();
console.log('t0',(t0/1000).toFixed(1));console.log(logs.filter(l=>!l.includes('[perf]')&&!l.includes('GL Driver')).join('\n'));
const pf=logs.filter(l=>l.includes('[perf]')).map(l=>+l.match(/fps=([\d.]+)/)[1]);console.log('fps avg',(pf.reduce((a,b)=>a+b,0)/pf.length).toFixed(1),'min',Math.min(...pf));})();
