// 紹介動画（ストア用 30秒・縦）を、今のゲームの画面から撮る（改善提案 2026-10-14b §5）
//   node qa/tools/record_trailer.js [ゲームのファイル] [--lang ja|en] [--min 8]
//   出力：launch/動画/trailer_<lang>.mp4（886×1920）と、場面の時刻 trailer_<lang>.json
// 撮り方：443×960 の画面を録画して、2倍（886×1920）に広げる → 錨亭のジン（会話）→ 第4章の卓で「相手が賭けてクセが出た → コールして勝った（答え合わせ）」のハンドが出るまで打つ
//   → タイトル。ffmpeg で場面を切り出してつなぎ、絵コンテ A の文字を重ねる。アプリの画面だけ（作った絵は足さない）
// 毎回は撮らない。版を決めたときだけ手で回す
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const H = require('../lib/harness');
const args = process.argv.slice(2), opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null };
const file = path.resolve(args.find(a => !a.startsWith('--') && ![opt('--lang'), opt('--min')].includes(a)) || path.join(__dirname, '../../story/shisho.html'));
const lang = opt('--lang') || 'ja', maxMin = +(opt('--min') || 8);
const OUT = path.join(__dirname, '../../launch/動画'), TMP = path.join(OUT, '_tmp_' + lang);
const FONT = ['/usr/share/fonts/opentype/ipafont-gothic/ipagp.ttf', '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'].find(f => fs.existsSync(f));
// 重ねる文字（絵コンテ A。日本語・英語）
const CAP = {
  ja: { jin: '伝説は、港のバーで飲んでいた。', table: '相手の顔を読む、テキサスホールデム', tell: 'クセを読め。', call: '嘘だと思ったら、コール。', win: '読みが当たれば、勝てる。', title: 'LAST TELL ‐ 最後のテル' },
  en: { jin: 'The legend was drinking at a harbor bar.', table: "Texas Hold'em, played by reading faces", tell: 'Read the tell.', call: "If it's a lie, call.", win: 'Read it right, and you win.', title: 'LAST TELL' } }[lang];

(async () => {
  fs.mkdirSync(TMP, { recursive: true });
  const b = await H.launch();
  const ctx = await b.newContext({ viewport: { width: 443, height: 960 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block',
    recordVideo: { dir: TMP, size: { width: 443, height: 960 } } });
  const t0 = Date.now(); // 録画は画面を作ったときから始まる
  await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  await ctx.addInitScript(`try{localStorage.setItem('shisho-settings',JSON.stringify({v:1,lang:'${lang}',sound:false,talk:'on',speed:'normal',peek:false,peekSet:true}));localStorage.setItem('shisho-progress',JSON.stringify({v:1,cleared:3}))}catch(e){}`);
  const page = await ctx.newPage(); const T = () => (Date.now() - t0) / 1000, ev = {};
  await page.goto('file://' + file, { waitUntil: 'load' }); await page.waitForTimeout(800);
  // 1. 錨亭のジン（第1章の始まりの会話）
  await page.evaluate(() => startChapter(CHAPTERS[0]));
  await page.waitForTimeout(500); await page.evaluate(() => { const b = $('btnAdv'); if (b && b.offsetParent) b.click() });
  await page.waitForTimeout(700); ev.jin = T(); await page.waitForTimeout(4200);
  // 2. 第4章の卓。自分はいつもコール（チェック）。相手が賭けてクセが出たら記録し、そのハンドで自分が勝ったら、そこを使う
  await page.evaluate(() => { startChapter(CHAPTERS[3], true); window.__tv = { tells: [], hands: [] };
    const _s = showTell; showTell = function (i, d) { const r = _s.apply(this, arguments); try { const p = S.players[i]; if (p && p.tell && !TW_KEEP.includes(p.name)) __tv.tells.push({ hand: S.handNo, name: p.name, cue: p.tell.cue || '', t: Date.now() }) } catch (e) {} return r };
    LT.on('startHand', () => __tv.hands.push({ hand: S.handNo, t: Date.now() }));
    // 勝ったハンドは画面に結果が出たまま 3.5秒止める（自動の打ち手を待たせる）
    LT.on('endHand', () => { try { const me = S.players[0], w = me.won > 0 && !me.folded && S.street === 'showdown'; __tv.hands.push({ hand: S.handNo, end: Date.now(), won: w }); if (w) window.__hold = Date.now() + 3500 } catch (e) {} }) });
  await H.startBot(page, { policy: 'call', maxHands: 400 });
  await page.evaluate(() => { const B = __bot; clearInterval(B.timer); B.timer = setInterval(() => { if (Date.now() < (window.__hold || 0)) return; B.tick() }, 120) });
  const tAt0 = Date.now(); let pick = null;
  while (Date.now() - tAt0 < maxMin * 60000 && !pick) { await page.waitForTimeout(1500);
    const tv = await page.evaluate(() => window.__tv);
    for (const h of tv.hands.filter(h => h.end && h.won)) { const tl = tv.tells.find(x => x.hand === h.hand); const st = tv.hands.find(x => x.hand === h.hand && x.t);
      if (tl && st) { pick = { start: (st.t - t0) / 1000, tell: (tl.t - t0) / 1000, end: (h.end - t0) / 1000, who: tl.name, cue: tl.cue }; break } }
    if (await page.evaluate(() => __bot.done)) await page.evaluate(() => { startChapter(CHAPTERS[3], true); __bot.restart() }) }
  if (pick) await page.waitForTimeout(3500);
  // 3. タイトル
  await page.evaluate(() => show('title')); await page.waitForTimeout(400); ev.title = T(); await page.waitForTimeout(5000);
  const vid = await page.video().path(); await ctx.close(); await b.close();
  fs.writeFileSync(path.join(OUT, `trailer_${lang}.json`), JSON.stringify({ ev, pick }, null, 1));
  if (!pick) { console.log('クセ→コール→勝ちのハンドが出なかった。--min を増やしてもう一度'); process.exit(1) }
  // 切り出し：ジン 4秒、卓（そのハンドの始まりから勝ちの後 2.5秒まで。長いときはクセの 8秒前から）、タイトル 3秒
  const s0 = Math.max(pick.start, pick.tell - 6), e0 = pick.end + 2.5, cut = [[ev.jin, 4], [s0, e0 - s0], [ev.title, 3]];
  const tot = cut.reduce((a, c) => a + c[1], 0), tT = 4 + (pick.tell - s0), tE = 4 + (pick.end - s0);
  const esc = s => s.replace(/\\/g, '\\\\').replace(/'/g, "\u2019").replace(/:/g, '\\:').replace(/,/g, '\\,');
  const dt = (txt, a, z, y) => `drawtext=fontfile=${FONT}:text='${esc(txt)}':fontsize=46:fontcolor=white:borderw=4:bordercolor=black@0.85:x=(w-text_w)/2:y=${y}:enable='between(t,${a.toFixed(2)},${z.toFixed(2)})'`;
  const caps = [dt(CAP.jin, 0, 4, 'h*0.08'), dt(CAP.table, 4, Math.min(tT, 4 + 4), 'h*0.08'), dt(CAP.tell, tT, tT + 3, 'h*0.08'), dt(CAP.call, tT + 3, Math.max(tT + 4, tE - 0.5), 'h*0.08'),
    dt(CAP.win, tE - 0.5, tot - 3, 'h*0.08'), dt(CAP.title, tot - 3, tot, 'h*0.86')].join(',');
  const fc = cut.map((c, i) => `[0:v]trim=start=${c[0].toFixed(2)}:duration=${c[1].toFixed(2)},setpts=PTS-STARTPTS[v${i}]`).join(';') + ';' + cut.map((_, i) => `[v${i}]`).join('') + `concat=n=${cut.length}:v=1:a=0[cv];[cv]scale=886:1920:flags=lanczos,${caps},fps=30,format=yuv420p[o]`;
  const mp4 = path.join(OUT, `trailer_${lang}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', vid, '-filter_complex', fc, '-map', '[o]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-movflags', '+faststart', mp4]);
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(`${mp4}  ${tot.toFixed(1)}秒（卓 ${pick.who} のクセ ${pick.cue}）`);
})().catch(e => { console.error(e); process.exit(1) });
