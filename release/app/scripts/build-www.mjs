// ゲーム本体（shisho.html）からアプリに入れる www/ を作る。
// 使い方: node scripts/build-www.mjs /mnt/project-files/story/shisho.html
// - platform.js（広告・同意・計測・保存）をまとめて www/ に置き、ゲームより先に読み込ませる
// - フォントを Google Fonts から取ってきて www/fonts/ に入れ、ネットなしで表示できるようにする
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { build } from 'esbuild';

const src = process.argv[2];
if (!src) { console.error('usage: node scripts/build-www.mjs <shisho.html>'); process.exit(1); }
let html = await readFile(src, 'utf8');
await rm('www', { recursive: true, force: true });
await mkdir('www/fonts', { recursive: true });

// 1. platform.js
await build({ entryPoints: ['src/platform.js'], bundle: true, format: 'iife', minify: true, target: 'es2019', outfile: 'www/platform.js' });

// 2. フォントを同梱する
const linkRe = /<link rel="stylesheet" href="(https:\/\/fonts\.googleapis\.com\/[^"]+)">/;
const m = html.match(linkRe);
if (m) {
  const UA = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';
  let css = await (await fetch(m[1].replace(/&amp;/g, '&'), { headers: { 'User-Agent': UA } })).text();
  const urls = [...new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^)]+/g) || [])];
  let n = 0;
  for (const u of urls) {
    const name = `f${n++}.woff2`;
    const buf = Buffer.from(await (await fetch(u)).arrayBuffer());
    await writeFile(`www/fonts/${name}`, buf);
    css = css.split(u).join(name);
  }
  await writeFile('www/fonts/fonts.css', css);
  html = html.replace(linkRe, '<link rel="stylesheet" href="fonts/fonts.css">');
  console.log('fonts:', urls.length, 'files');
}

// 3. 頭を足す（Web版の PWA 用の行はアプリには不要なので入れない）
const head = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0d0e13">
<script src="platform.js"></script>
`;
if (!/<!doctype/i.test(html.slice(0, 200))) html = head + html.trimStart();
else html = html.replace(/<head>/i, '<head>\n<script src="platform.js"></script>');
// PWA の Service Worker 登録はアプリでは動かさない
html = html.replace(/navigator\.serviceWorker\.register\(/g, '(()=>Promise.resolve())(');
await writeFile('www/index.html', html);
console.log('www/index.html', html.length, 'chars');
