// 番が回るたびの「寄り」(mid) の重さ。node zoom.js <html> <mobile|land|pc> <variant> [reps]
'use strict';
const H = require('/mnt/project-files/qa/lib/harness');
const file = process.argv[2], mode = process.argv[3] || 'mobile', vname = process.argv[4] || 'base';
const V = {
  base: '',
  noblur: '.t3d.focusing .bust:not(.turn),.t3d.focusing .felt{filter:brightness(.6)!important}',
  nofilter: '.t3d.focusing .bust:not(.turn),.t3d.focusing .felt{filter:none!important}',
  nofiltertr: '.t3d .felt,.t3d .bust{transition:opacity .8s!important}',
  novig: '.t3d.focusing::before{display:none!important}',
  nosvgshadow: '.bust .body svg{filter:none!important}',
  dim: '.t3d.focusing .bust:not(.turn),.t3d.focusing .felt{filter:none!important}.t3d.focusing .bust:not(.turn){opacity:.62}.t3d .felt-wrap::after{content:"";position:absolute;inset:0;background:#000;opacity:0;transition:opacity .4s;pointer-events:none}.t3d.focusing .felt-wrap::after{opacity:.4}',
  willc: '.cam{will-change:transform}',
  combo: '.t3d.focusing .bust:not(.turn),.t3d.focusing .felt{filter:none!important}.t3d.focusing .bust:not(.turn){opacity:.62}.t3d .felt,.t3d .bust{transition:opacity .4s!important}.cam{will-change:transform}',
  camoff: '',
  dimwide: '.t3d.focusing .bust:not(.turn),.t3d.focusing .felt{filter:none!important}.t3d.focusing .bust:not(.turn){opacity:.62}.t3d .felt-wrap::after{content:"";position:absolute;inset:0;background:#000;opacity:0;transition:opacity .4s;pointer-events:none}.t3d.focusing .felt-wrap::after{opacity:.4}',
  smalldim: '.t3d.focusing .bust:not(.turn),.t3d.focusing .felt{filter:none!important}.t3d.focusing .bust:not(.turn){opacity:.62}.t3d .felt-wrap::after{content:"";position:absolute;inset:0;background:#000;opacity:0;transition:opacity .4s;pointer-events:none}.t3d.focusing .felt-wrap::after{opacity:.4}',
  midwidenf: '.t3d.focusing .bust:not(.turn),.t3d.focusing .felt{filter:none!important}',
  cut: '.cam{transition:none!important}',
  willcut: '.cam{will-change:transform;transition:none!important}',
  midwide: '',
  midsmall: '.cam{will-change:transform}',
};
const M = mode === 'm1' ? { vp: { width: 390, height: 844 }, dpr: 1, rate: 4, mob: true } : mode === 'mobile' ? { vp: { width: 390, height: 844 }, dpr: 3, rate: 4, mob: true } : mode === 'land' ? { vp: { width: 844, height: 390 }, dpr: 3, rate: 4, mob: true } : { vp: { width: 1280, height: 800 }, dpr: 1, rate: 1, mob: false };
(async () => {
  const browser = await H.launch();
  const ctx = await browser.newContext({ viewport: M.vp, deviceScaleFactor: M.dpr, isMobile: M.mob, hasTouch: M.mob, serviceWorkers: 'block', reducedMotion: 'no-preference' });
  await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  await ctx.addInitScript(`try{localStorage.setItem('shisho-settings',JSON.stringify({v:1,talk:'on',speed:'normal',sound:false,quiz:false,lang:'ja',cam:'${vname==='camoff'?'off':'strong'}'}));localStorage.setItem('shisho-nv','1')}catch(e){}`);
  const page = await ctx.newPage();
  const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto('file://' + require('path').resolve(file), { waitUntil: 'load' });
  await page.waitForTimeout(800);
  await page.evaluate(`($('freeSize').value='6',$('freeRule').value='',startFree())`);
  for (let k = 0; k < 60; k++) {
    await page.evaluate(() => { for (const id of ['vsGo','tourSkip','btnNoticeClose','btnHelpClose','btnDailyClose','askGo','nvNew','lkOk']) { const e = document.getElementById(id); if (e && e.getClientRects().length) e.click() } const sb=document.querySelector('.seatbtn'); if(sb&&sb.getClientRects().length) sb.click(); });
    const ok = await page.evaluate(() => S && S.players && S.players.length===6 && S.toAct > 0 && !S.handOver && !$('game').hidden);
    if (ok) break; await page.waitForTimeout(250);
  }
  await page.evaluate(() => { window.act = () => {}; window.proceed = () => {}; });
  if (vname==='midwide'||vname==='midwidenf'||vname==='dimwide') await page.evaluate(()=>{CAM_Z.mid={port:1,land:1,pc:1}});
  if (vname==='midsmall'||vname==='smalldim') await page.evaluate(()=>{CAM_Z.mid={port:1.15,land:1.1,pc:1.12}});
  if (V[vname]) await page.addStyleTag({ content: V[vname] });
  await page.waitForTimeout(800);
  const c = await ctx.newCDPSession(page);
  await c.send('Performance.enable');
  await c.send('Emulation.setCPUThrottlingRate', { rate: M.rate });
  const met = async () => Object.fromEntries((await c.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
  await c.send("Tracing.start",{categories:"devtools.timeline,disabled-by-default-devtools.timeline,cc,viz",transferMode:"ReturnAsStream"});const m0 = await met();
  const res = await page.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const frames = []; let run = true, last = performance.now();
    const f = now => { frames.push(now - last); last = now; if (run) requestAnimationFrame(f) }; 
    const seats = S.players.map((p, k) => k).filter(k => k > 0 && !S.players[k].out);
    camTo(-1, 'wide'); await wait(1000);
    requestAnimationFrame(f);
    const t0 = performance.now();
    // 実戦に近く：番が回る（寄る）→ 吹き出し → 次の人へ移る、を2周。最後に全体へ戻る
    for (let r = 0; r < 2; r++) for (const i of seats) {
      S.toAct = i; const p = S.players[i]; p.say = { seq: (S.saySeq = (S.saySeq || 0) + 1), act: 'コール', line: '' };
      render(); await wait(1100);
    }
    S.toAct = 0; render(); await wait(1000);
    run = false;
    const a = frames.slice(1), s = a.reduce((x, y) => x + y, 0), srt = a.slice().sort((x, y) => x - y);
    return { sec: +((performance.now() - t0) / 1000).toFixed(1), fps: Math.round(a.length / (s / 1000)), p95: Math.round(srt[Math.floor(srt.length * .95)]), max: Math.round(srt[srt.length - 1]), slow50: a.filter(x => x > 50).length, slow100: a.filter(x => x > 100).length };
  });
  const m1 = await met();const ev=[];await new Promise(ok=>{c.on("Tracing.tracingComplete",async e=>{let s="";for(;;){const r=await c.send("IO.read",{handle:e.stream});s+=r.data;if(r.eof)break}JSON.parse(s).traceEvents.forEach(x=>ev.push(x));ok()});c.send("Tracing.end")});const sum={};ev.forEach(x=>{if(x.ph==="X"&&x.dur){sum[x.name]=(sum[x.name]||0)+x.dur/1000}});const T=sum;console.log(JSON.stringify(['DRAW:'+Math.round(sum['SoftwareRenderer::DoDrawQuad']||0),'FRAMES:'+ev.filter(x=>x.name==='DirectRenderer::DrawFrame').length]));console.log(JSON.stringify(Object.entries(sum).sort((a,b)=>b[1]-a[1]).slice(0,25).map(([k,v])=>k+":"+Math.round(v)))); const d = k => Math.round((m1[k] - m0[k]) * 1000 / res.sec);
  console.log(JSON.stringify({ v: vname, mode, ...res, taskMs: d('TaskDuration'), scriptMs: d('ScriptDuration'), styleMs: d('RecalcStyleDuration'), layoutMs: d('LayoutDuration'), errs: errs.slice(0,2) }));
  await browser.close();
})();
