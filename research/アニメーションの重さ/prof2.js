// LAST TELL 場面ごとの重さを測る
// node scenes.js <html> <mobile|pc> [extraCssFile] [extraJsFile]
'use strict';
const fs = require('fs'), path = require('path');
const H = require('/mnt/project-files/qa/lib/harness');
const file = process.argv[2], mode = process.argv[3] || 'mobile';
const extraCss = process.argv[4] && process.argv[4] !== '-' ? fs.readFileSync(process.argv[4], 'utf8') : '';
const extraJs = process.argv[5] ? fs.readFileSync(process.argv[5], 'utf8') : '';
const M = mode === 'mobile' ? { vp: { width: 390, height: 844 }, dpr: 3, rate: 4, mob: true } : mode === 'land' ? { vp: { width: 844, height: 390 }, dpr: 3, rate: 4, mob: true } : { vp: { width: 1280, height: 800 }, dpr: 1, rate: 1, mob: false };
(async () => {
  const browser = await H.launch();
  const ctx = await browser.newContext({ viewport: M.vp, deviceScaleFactor: M.dpr, isMobile: M.mob, hasTouch: M.mob, serviceWorkers: 'block', reducedMotion: 'no-preference' });
  await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  await ctx.addInitScript(`try{localStorage.setItem('shisho-settings',JSON.stringify({v:1,talk:'on',speed:'normal',sound:false,quiz:false,lang:'ja',cam:'strong'}));localStorage.setItem('shisho-nv','1')}catch(e){}
    window.__lt=[];try{new PerformanceObserver(l=>l.getEntries().forEach(e=>__lt.push([performance.now(),e.duration]))).observe({type:'longtask'})}catch(e){}
    window.__fr=[];(function f(t){__fr.push(t);requestAnimationFrame(f)})(0);`);
  if (extraJs) await ctx.addInitScript(extraJs);
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  const c = await ctx.newCDPSession(page);
  await c.send('Performance.enable');
  await c.send('Emulation.setCPUThrottlingRate', { rate: M.rate });
  const t0 = Date.now();
  await page.goto('file://' + path.resolve(file), { waitUntil: 'load' });
  const loadMs = Date.now() - t0;
  if (extraCss) await page.addStyleTag({ content: extraCss });
  await page.waitForTimeout(1500);
  await c.send('Emulation.setCPUThrottlingRate',{rate:M.rate});
  const metrics = async () => Object.fromEntries((await c.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
  const out = { mode, loadMs, scenes: {} };
  async function measure(name, ms, during) {
    const m0 = await metrics();
    const s = await page.evaluate(() => ({ f: __fr.length, l: __lt.length, t: performance.now() }));
    if (during) await during(); else await page.waitForTimeout(ms);
    const e = await page.evaluate(s => ({ fr: __fr.slice(s.f), lt: __lt.slice(s.l).map(x => x[1]), t: performance.now() - s.t, nodes: document.getElementsByTagName('*').length, anim: document.getAnimations().filter(a => a.playState === 'running').length }), s);
    const m1 = await metrics();
    const d = k => Math.round((m1[k] - m0[k]) * 1000);
    const iv = []; for (let i = 1; i < e.fr.length; i++) iv.push(e.fr[i] - e.fr[i - 1]);
    const srt = iv.slice().sort((a, b) => a - b);
    const sec = e.t / 1000;
    out.scenes[name] = { sec: +sec.toFixed(1), fps: Math.round(iv.length / sec), p95: Math.round(srt[Math.floor(srt.length * .95)] || 0), slowFrames: iv.filter(x => x > 50).length,
      longTasks: e.lt.length, longMax: Math.round(Math.max(0, ...e.lt)),
      // CPU の使い方（1秒あたり ms）
      scriptMsPerS: Math.round(d('ScriptDuration') / sec), styleMsPerS: Math.round(d('RecalcStyleDuration') / sec), layoutMsPerS: Math.round(d('LayoutDuration') / sec), taskMsPerS: Math.round(d('TaskDuration') / sec),
      layouts: Math.round((m1.LayoutCount - m0.LayoutCount) / sec), styles: Math.round((m1.RecalcStyleCount - m0.RecalcStyleCount) / sec), nodes: e.nodes, anims: e.anim };
  }
  const clickAway = `(()=>{const sb=document.querySelector('.seatbtn');if(sb&&sb.getClientRects().length)sb.click();for(const id of ['vsGo','tourSkip','btnNoticeClose','btnHelpClose','btnDailyClose','askGo','nvNew','lkOk','rvOk','twN','btnShowNo','btnIgnore','qtNo']){const e=document.getElementById(id);if(e&&e.getClientRects().length)e.click()}})()`;
  // 3. 卓：フリー6人を普通の速さで自動で打つ
  await page.evaluate(`show('title')`).catch(() => {});
  await page.waitForTimeout(500);
  await page.evaluate(`($('freeSize').value='6',$('freeRule').value='',startFree())`);
  await page.waitForTimeout(1500);
  await page.evaluate(clickAway);
  await page.addScriptTag({ content: `window.__autoMe=setInterval(()=>{try{${clickAway};const b=document.getElementById('btnCall')||document.getElementById('btnCheck');if(S&&S.toAct===0&&!S.handOver){const c=[...document.querySelectorAll('#controls button.act')].find(x=>!x.disabled&&x.getClientRects().length&&/コール|チェック|call|check/i.test(x.textContent));if(c)c.click()}const n=document.getElementById('btnNext');if(n&&n.getClientRects().length&&!n.disabled)n.click()}catch(e){}},400)` });
  await c.send('Profiler.enable');await c.send('Profiler.setSamplingInterval',{interval:200});await c.send('Profiler.start');
  await c.send('Tracing.start',{categories:'devtools.timeline,disabled-by-default-devtools.timeline',transferMode:'ReturnAsStream'});
  await measure('卓（自分の番待ち・相手が打つ）', 12000);
  const ev=await new Promise(async res=>{c.once('Tracing.tracingComplete',async({stream})=>{let d='';for(;;){const r=await c.send('IO.read',{handle:stream});d+=r.data;if(r.eof)break}res(JSON.parse(d).traceEvents||JSON.parse(d))});await c.send('Tracing.end')});
  const {profile}=await c.send('Profiler.stop');
  // self time by function
  const byId={};for(const n of profile.nodes)byId[n.id]=n;const self={};const dt=profile.timeDeltas;
  profile.samples.forEach((id,i)=>{const n=byId[id];const k=n.callFrame.functionName+'@'+n.callFrame.lineNumber;self[k]=(self[k]||0)+(dt[i]||0)/1000});
  const par={};for(const n of profile.nodes)for(const ch of (n.children||[]))par[ch]=n.id;
  const tsl=[];let tt=profile.startTime;profile.samples.forEach((id,i)=>{tt+=dt[i];tsl.push([tt,id])});
  const longs=ev.filter(x=>x.name==='RunTask'&&x.dur>150000);const incl={};let tot=0;
  for(const [ts,id] of tsl){if(!longs.some(t=>ts>=t.ts&&ts<=t.ts+t.dur))continue;tot+=0.2;const seen=new Set();let n=id;while(n){const f=byId[n].callFrame;const k=f.functionName+'@'+f.lineNumber;if(!seen.has(k)){seen.add(k);incl[k]=(incl[k]||0)+0.2}n=par[n]}}
  console.error('IN LONG TASKS total',Math.round(tot),'\n'+Object.entries(incl).sort((a,b)=>b[1]-a[1]).slice(0,45).map(([k,v])=>k+' '+Math.round(v)).join('\n'));
  console.error('TOP SELF', Object.entries(self).sort((a,b)=>b[1]-a[1]).slice(0,25).map(([k,v])=>k+' '+Math.round(v)).join('\n'));
  // long tasks breakdown: for each RunTask >200ms, sum child event types
  const tasks=ev.filter(x=>x.name==='RunTask'&&x.dur>200000);
  for(const t of tasks.slice(0,12)){const ch={};for(const x of ev){if(x.tid!==t.tid||x.ts<t.ts||x.ts>t.ts+t.dur||!x.dur||x===t)continue;if(['FunctionCall','TimerFire','EvaluateScript','Layout','UpdateLayoutTree','Paint','EventDispatch','FireAnimationFrame','v8.compile','MajorGC','MinorGC','V8.GC_SCAVENGER'].includes(x.name)){ch[x.name]=(ch[x.name]||0)+x.dur/1000}}
   const fn=ev.find(x=>x.tid===t.tid&&x.ts>=t.ts&&x.name==='FunctionCall'&&x.args&&x.args.data);console.error('LONG',Math.round(t.dur/1000),JSON.stringify(Object.fromEntries(Object.entries(ch).map(([k,v])=>[k,Math.round(v)]))),fn?fn.args.data.functionName+':'+fn.args.data.lineNumber:'')}
  // 自分の番でじっと考えている間
  await page.evaluate(`clearInterval(__autoMe)`);
  await page.waitForFunction(`S&&S.toAct===0&&!S.handOver`, null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(600);
  await measure('卓（自分の番で考え中）', 5000);
  // 章の切り替え：第1章→第2章（会話が出るまで）
  await page.evaluate(`show('title')`).catch(() => {});
  await page.waitForTimeout(500);
  const sw0 = Date.now();
  await page.evaluate(`startChapter(CHAPTERS[1])`);
  await page.waitForFunction(`!$('scene').hidden||!$('game').hidden`, null, { timeout: 15000 }).catch(() => {});
  out.chapterSwitchMs = Date.now() - sw0;
  out.errors = errs.slice(0, 5);
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
