#!/usr/bin/env node
// 組み立てた shisho.html のスクリプトを確かめる（開発と設計のベストプラクティス 案2）
//   node check.js 組み立てた.html [--strict]
// 1) 文法（node --check 相当）：間違いがあれば必ず終了コード 1（ゲームが真っ白になるため）
// 2) ESLint：error があれば表示。--strict のときだけ終了コード 1（英語辞書の重複を片づけるまでは知らせるだけ）
const fs = require('fs'), path = require('path'), vm = require('vm');
const file = process.argv[2], strict = process.argv.includes('--strict');
if (!file) { console.error('使い方: node check.js 組み立てた.html [--strict]'); process.exit(2); }
const html = fs.readFileSync(file, 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const lineOf = i => html.slice(0, html.indexOf(scripts[i])).split('\n').length;
let bad = 0;
scripts.forEach((code, i) => {
  try { new vm.Script(code, { filename: `script${i}` }); }
  catch (e) {
    const m = /script\d+:(\d+)/.exec(e.stack || ''); const ln = m ? lineOf(i) + (+m[1]) - 1 : lineOf(i);
    console.error(`❌ 文法の間違い（shisho.html ${ln}行目あたり）: ${e.message}`); bad++;
  }
});
if (bad) process.exit(1);
console.log(`✅ 文法 OK（スクリプト ${scripts.length}個）`);
// 3) 動きは LT.anim で（v0.97.3：Safari で onfinish が来ない・動きが止まることがあり、「終わったら消す・見せる」が走らなかった）
//    .animate( / .onfinish= を LT.anim（00b_hooks.js）の外で書いたら止める。done は時間でも必ず1回呼ばれる
{const hits=[];scripts.forEach((code,i)=>code.split('\n').forEach((l,k)=>{if(/\.animate\(|\.onfinish\s*=/.test(l)&&!l.includes('lt-anim-ok'))hits.push(`${lineOf(i)+k}行目: ${l.trim().slice(0,90)}`)}));
  if(hits.length){console.error(`❌ 動きを .animate( / .onfinish= で直接書いている所が ${hits.length}件（LT.anim(el,kf,opts,done) を使う）`);hits.slice(0,10).forEach(h=>console.error('   '+h));process.exit(1)}
  console.log('✅ 動きは全部 LT.anim');}
// 4) 吹き出しを「よける相手」に数えるときは LT.sayOn で見えているかも見る（v0.97.8 レビュー：.say.go は動きの最後で見えなくなっても .go が残り、
//    もう見えない吹き出しを心の声の字幕がよけて右上に寄った）。'.say.go' を書いた行に LT.sayOn も say-go-ok（吹き出しそのものを扱う所）も無ければ止める
{const hits=[];scripts.forEach((code,i)=>code.split('\n').forEach((l,k)=>{if(/\.say\.go/.test(l)&&!/LT\.sayOn|say-go-ok/.test(l))hits.push(`${lineOf(i)+k}行目: ${l.trim().slice(0,90)}`)}));
  if(hits.length){console.error(`❌ 吹き出し（.say.go）をよける一覧に入れているのに、見えているか（LT.sayOn）を見ていない所が ${hits.length}件`);hits.slice(0,10).forEach(h=>console.error('   '+h));process.exit(1)}
  console.log('✅ よける吹き出しは全部 LT.sayOn を通している');}
// 4b) 右の列の配置（スマホ横・PC の横長の卓 v0.98.0）：CSS の @media でスマホ横の条件を書いたら、PC の条件も並べる。JS は SIDE_Q / LAND_Q / PCW_Q を使う
//     （片方だけ直すと、PC だけ配置が崩れる。00b_hooks.js の PCW_Q と同じ文字）
{const L='(orientation:landscape) and (max-height:520px)',PC=(/PCW_Q='([^']+)'/.exec(scripts.join('\n'))||[])[1],hits=[];
  if(!PC){console.error('❌ 00b_hooks.js の PCW_Q が見つからない');process.exit(1)}
  const css=[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n');
  for(const m of css.matchAll(/@media([^{]*)\{/g)){const q=m[1];if(q.includes(L)&&!/not all/.test(q)&&!q.includes(PC))hits.push(q.trim().slice(0,120))}
  scripts.forEach((code,i)=>code.split('\n').forEach((l,k)=>{if(l.includes("matchMedia('"+L+"')"))hits.push(`${lineOf(i)+k}行目: ${l.trim().slice(0,90)}`)}));
  if(hits.length){console.error(`❌ スマホ横の条件だけで PC（PCW_Q）が並んでいない所が ${hits.length}件（@media は「スマホ横,PC」の2つ、JS は SIDE_Q）`);hits.slice(0,10).forEach(h=>console.error('   '+h));process.exit(1)}
  console.log('✅ 右の列の配置の条件は、スマホ横と PC がそろっている');}
// 4c) 画面の条件の変わり目は mqOn(q,f) で受ける（matchMedia(...).addEventListener('change') だけだと古い Safari で動かない。PR #130 CodeRabbit）
{const hits=[];scripts.forEach((code,i)=>code.split('\n').forEach((l,k)=>{if(/addEventListener\(\s*'change'/.test(l)&&/matchMedia|\bq\./.test(l)&&!/function mqOn/.test(l))hits.push(`${lineOf(i)+k}行目: ${l.trim().slice(0,90)}`)}));
  if(hits.length){console.error(`❌ matchMedia の change を addEventListener で直接受けている所が ${hits.length}件（mqOn(q,f) を使う）`);hits.slice(0,10).forEach(h=>console.error('   '+h));process.exit(1)}
  console.log('✅ 画面の条件の変わり目は mqOn で受けている');}
// 5) ストアの説明の下書き（launch/・release/）の「公平」の段落にも、配りを変える仕組みのことが書いてある（v0.97.8 レビュー：CI からは下書きが見えないので、組み立てのときに見る）
//    配りを変える仕組みは js/54_deal_mod.js の入口 LT.dealMod('名前','hand'|'board',関数,{ja:'…',en:'…'}) に登録する（research/配り札と場札の操作_実装仕様.md §2-1・§6）。
//    説明に要る語は入口の LT.DEAL_NOTE から読む（手で持つ表はやめた。qa/checks/text.js の text:fair-note もゲームの LT.DEAL_NOTE を読む）。
//    words を持たない登録は、同じ行に「// words なし：理由」が要る。入口の無い古い版だけ、前の表（関数の名前で見る）で見る
{const root=path.join(__dirname,'..','..','..'),html=scripts.join('\n'),W={},bad=[],OLD={dealHelp:['弱い手',/weak starting hands?/i],p6Premium:['強い手',/strong hand/i]};
  const regs=html.split('\n').filter(l=>/LT\.dealMod\(\s*'/.test(l.replace(/\/\/.*$/,'')));   // コメントの中の名前は数えない
  for(const l of regs){const n=(/LT\.dealMod\(\s*'(\w+)'/.exec(l)||[])[1],w=/\{\s*ja\s*:\s*'([^']+)'\s*,\s*en\s*:\s*'([^']+)'\s*\}/.exec(l);
    if(w)W[n]=[w[1],w[2]];else if(!/\/\/\s*words なし[：:]\s*\S/.test(l))bad.push(`登録「${n}」に words（{ja:'…',en:'…'}）も「// words なし：理由」も無い`)}
  // 説明に要る語は LT.DEAL_NOTE（§8-3：細かい仕組みは書かず、調整していることを一文で。フリー対戦が公平なことも）。登録ごとの words は説明の文には求めない
  const note=/LT\.DEAL_NOTE\s*=\s*\{\s*ja\s*:\s*\[([^\]]*)\]\s*,\s*en\s*:\s*\[([^\]]*)\]\s*\}/.exec(html),q=t=>[...t.matchAll(/'([^']+)'/g)].map(m=>m[1]);
  if(regs.length&&!note)bad.push('配りを変える入口があるのに、説明に要る語（LT.DEAL_NOTE={ja:[…],en:[…]}）が無い');
  for(const k in W)delete W[k];
  if(note){const ja=q(note[1]),en=q(note[2]);ja.forEach((w,i)=>{W['DEAL_NOTE'+i]=[w,en[i]||en[0]]});en.slice(ja.length).forEach((w,i)=>{W['DEAL_NOTE_en'+i]=[ja[0],w]})}
  if(!regs.length)for(const f in OLD)if(new RegExp('function\\s+'+f+'\\s*\\(').test(html))W[f]=OLD[f];
  const has=(t,w,en)=>typeof w==='string'?(en?t.toLowerCase().includes(w.toLowerCase()):t.includes(w)):w.test(t);
  for(const [rel,en] of [['launch/ストア掲載素材.md',false],['release/ストア掲載_英語版.md',true]]){let t='';try{t=fs.readFileSync(path.join(root,rel),'utf8')}catch(e){continue}
    const para=t.split(/\n\s*\n/).find(x=>en?/shuffled/i.test(x):/シャッフル/.test(x))||'';
    if(!regs.length&&(en?/the deal is adjusted/i.test(para):para.includes('配る札を調整しています')))continue;   // 入口の無い古い版：ストアの文が「調整している」の一文（§8-3）になっていれば、それで全部を言っている
    for(const f in W){const w=W[f][en?1:0];if(!has(para,w,en))bad.push(`${rel}：「${w}」がない（${f}）`)}}
  if(bad.length){console.error(`❌ 配りを変える仕組みの説明が足りない（登録の words か、ストアの説明の下書きの公平の段落）：`);bad.forEach(b=>console.error('   '+b));process.exit(1)}
  console.log(`✅ ストアの説明の下書きにも、配り方のことが書いてある（${Object.keys(W).join('・')||'配りを変える仕組みなし'}）`);}
// 5b) 山（S.deck）と手札（○.hand）を書き換えるのは、配りを変える入口と決まった所だけ（配り変えが入口の外に増えないように。仕様 §6）。
//     組み立てたファイルには元のファイル名が残らないので、書き換えた行を囲む一番外の関数（行頭の function 名前(）で見る。
//     許す関数：10_scripted.js rig、23_house_rules.js startHand、49_play35_fixes.js dealHelp、51_play6_fixes.js p6Runout・p6Premium、54_deal_mod.js の入口の関数
//     入口（LT.DEAL_MODS=）の無い古い版は見ない（入口ができる前のボス保護は、関数の外の合図の中で山を並べ替えていた）
if(/LT\.DEAL_MODS\s*=/.test(scripts.join('\n'))){const OK=new Set(['rig','startHand','dealHelp','p6Runout','p6Premium','dmSwap','noWeakRun','lessonScene','flopConnect','readGuard']),hits=[];
  const AS=/\bS\.deck\s*=(?!=)|\.hand\s*=(?!=)|\.hand\[[^\]]+\]\s*=(?!=)/;
  scripts.forEach((code,i)=>{let fn='';code.split('\n').forEach((l,k)=>{const m=/^function\s+(\w+)\s*\(/.exec(l);if(m)fn=m[1];else if(/^\S/.test(l)&&!/^\}/.test(l))fn='';
    const c=l.replace(/\/\/.*$/,'');if(AS.test(c)&&!OK.has(fn))hits.push(`${lineOf(i)+k}行目${fn?`（${fn}）`:''}: ${l.trim().slice(0,90)}`)})});
  if(hits.length){console.error(`❌ 山（S.deck=）や手札（.hand=）を、配りを変える入口（js/54_deal_mod.js の LT.dealMod）の外で書き換えている所が ${hits.length}件`);hits.slice(0,10).forEach(h=>console.error('   '+h));process.exit(1)}
  console.log('✅ 山と手札を書き換えるのは、配りを変える入口と決まった所だけ');}
let ESLint;
try { ({ ESLint } = require(path.join(__dirname, 'node_modules', 'eslint'))); }
catch { console.log('（ESLint が入っていないので書き方チェックは飛ばしました：cd dev/tools/lint && npm ci）'); process.exit(0); }
(async () => {
  const eslint = new ESLint({ cwd: __dirname, overrideConfigFile: path.join(__dirname, 'eslint.config.mjs') });
  const code = scripts.reduce((a, s) => a.length > s.length ? a : s, '');
  const off = lineOf(scripts.indexOf(code)) - 1;
  const [r] = await eslint.lintText(code, { filePath: path.join(__dirname, 'game.js') });
  const err = r.messages.filter(m => m.severity === 2), warn = r.messages.filter(m => m.severity === 1);
  const by = {}; for (const m of err) (by[m.ruleId || '文法'] = by[m.ruleId || '文法'] || []).push(m);
  for (const [id, ms] of Object.entries(by)) {
    console.log(`${strict ? '❌' : '⚠️'} ${id}: ${ms.length}件`);
    ms.slice(0, 8).forEach(m => console.log(`   ${off + m.line}行目: ${m.message}`));
    if (ms.length > 8) console.log(`   …ほか ${ms.length - 8}件`);
  }
  console.log(`書き方: error ${err.length}件 / 知らせるだけ ${warn.length}件`);
  process.exit(strict && err.length ? 1 : 0);
})();
