// Artifact-like CSP check: node csptest.js <dir> <out.png>
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const CSP="default-src 'none'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:";
(async()=>{const [dir,out]=process.argv.slice(2);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1000,height:760}});const errs=[];
p.on('console',m=>{if(m.type()==='error'||/Content Security/.test(m.text()))errs.push(m.text())});p.on('pageerror',e=>errs.push('ERR '+e.message));
await p.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',r=>{const f='/tmp/claude-0/w/np/package/'+new URL(r.request().url()).pathname.split('three@0.160.0/')[1];r.fulfill({body:fs.readFileSync(f),contentType:'text/javascript',headers:{'access-control-allow-origin':'*'}})});
await p.route('https://demo.local/**',r=>{const u=new URL(r.request().url()).pathname;const f=path.join(dir,u);const ct={'.html':'text/html','.js':'text/javascript','.json':'application/json','.jpg':'image/jpeg','.png':'image/png'}[path.extname(f)];
 let body=fs.readFileSync(f);if(u=='/index.html')body='<!doctype html><meta charset="utf-8">'+body;r.fulfill({body,contentType:ct,headers:{'content-security-policy':CSP}})});
await p.goto('https://demo.local/index.html');await p.waitForTimeout(10000);
await p.locator('canvas').first().screenshot({path:out});
const px=Number(require('child_process').execSync(`python3 -c "from PIL import ImageStat,Image;print(sum(ImageStat.Stat(Image.open('${out}').convert('RGB')).mean))"`).toString());
console.log(dir,'mean brightness',px.toFixed(1),'errors:',errs.slice(0,5).join(' | ')||'none');await b.close();process.exit(px>25&&!errs.some(e=>/ERR|Refused/.test(e))?0:1)})();
