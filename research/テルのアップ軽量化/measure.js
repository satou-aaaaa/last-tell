// テルのアップ演出の重さを測る：スマホ縦 390x844・DPR3・CPU4倍遅く
'use strict';
const H = require('/mnt/project-files/qa/lib/harness');
const file = process.argv[2], label = process.argv[3] || '', extraCss = process.argv[4] || '', tilt = process.argv[5] !== 'notilt';
(async () => {
  const browser = await H.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block', reducedMotion: 'no-preference' });
  await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  await ctx.addInitScript(H.initScript ? '' : '');
  await ctx.addInitScript(`try{localStorage.setItem('shisho-settings',JSON.stringify({v:1,talk:'on',speed:'normal',sound:false,quiz:false,lang:'ja',cam:'strong'}))}catch(e){}`);
  const page = await ctx.newPage();
  await page.goto('file://' + require('path').resolve(file), { waitUntil: 'load' });
  await page.waitForTimeout(800);
  await page.evaluate(`($('freeSize').value='6',$('freeRule').value='',startFree())`);
  // 相手紹介などを閉じて、CPUの番まで進める
  for (let k = 0; k < 40; k++) {
    await page.evaluate(() => { for (const id of ['vsGo','tourSkip','btnNoticeClose','btnHelpClose','btnDailyClose','askGo']) { const e = document.getElementById(id); if (e && e.offsetParent) e.click() } const sb=document.querySelector('.seatbtn'); if(sb&&sb.offsetParent) sb.click(); const bc=document.getElementById('btnCall'); if(S&&S.toAct===0&&bc&&!bc.disabled&&bc.offsetParent) bc.click(); });
    const ok = await page.evaluate(() => S && S.players && S.toAct > 0 && !S.handOver);
    if (ok) break; await page.waitForTimeout(250);
  }
  // ゲームを止める（CPUが打たないように）
  await page.evaluate(() => { window.act = () => {}; window.proceed = () => {}; });
  if (extraCss) await page.addStyleTag({ content: extraCss });
  await page.waitForTimeout(500);
  const c = await ctx.newCDPSession(page);
  await c.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const res = await page.evaluate(async (tilt) => {
    const i = S.toAct, p = S.players[i];
    p.tell = p.tell || { cue: 'sweat', street: S.street, seq: 99 };
    const frames = [];let run = true, last = performance.now();
    const f = now => { frames.push(now - last); last = now; if (run) requestAnimationFrame(f) };
    // 手で持ったスマホの傾き（小さな揺れ）を 60回/秒
    let tt = 0; const iv = tilt ? setInterval(() => { tt++; const e = new Event('deviceorientation'); e.beta = 40 + Math.sin(tt / 9) * 1.5 + Math.random() * .4; e.gamma = Math.sin(tt / 13) * 1.5 + Math.random() * .4; dispatchEvent(e) }, 16) : 0;
    const wait = ms => new Promise(r => setTimeout(r, ms));
    camTo(-1, 'wide'); await wait(1200);
    requestAnimationFrame(f);
    const mark = {};
    mark.a = frames.length; camTo(i, 'mid'); await wait(1000);   // 寄る
    mark.b = frames.length; camTo(i, 'tell'); await wait(1300);  // テルへ寄り直す
    mark.c = frames.length; camTo(i, 'mid'); await wait(800);    // 戻る
    mark.d = frames.length; camTo(-1, 'wide'); await wait(900);
    run = false; clearInterval(iv);
    const st = arr => { const a = arr.slice(1); const s = a.reduce((x, y) => x + y, 0); const srt = a.slice().sort((x, y) => x - y);
      return { fps: Math.round(a.length / (s / 1000)), avg: Math.round(s / a.length), p95: Math.round(srt[Math.floor(srt.length * .95)] || 0), max: Math.round(srt[srt.length - 1] || 0), slow: a.filter(x => x > 50).length } };
    return { all: st(frames), mid: st(frames.slice(mark.a, mark.b)), tell: st(frames.slice(mark.b, mark.c)), cue: p.tell.cue };
  }, tilt);
  console.log(JSON.stringify({ label, tilt, ...res }));
  await browser.close();
})();
