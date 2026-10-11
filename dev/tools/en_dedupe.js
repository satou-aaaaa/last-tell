// 英語辞書（js/01_en_dict.js の EN_DICT）の重複キーのうち、使われていない前の方を消す（案2）。画面の英語は変わらない（中身が同じか確かめてから書く）。
//   node en_dedupe.js src/js/01_en_dict.js 記録.md
const fs=require('fs'),vm=require('vm');const p=process.argv[2],out=process.argv[3];
const lines=fs.readFileSync(p,'utf8').split('\n');const L=lines[2];const pre='const EN_DICT=';
if(!L.startsWith(pre)||!L.trimEnd().endsWith('};'))throw 'shape';
const body=L.slice(pre.length,L.trimEnd().length-1);
const ev=s=>vm.runInNewContext('('+s+')');const obj=ev(body);
const re=/"((?:[^"\\]|\\.)*)"\s*:\s*("(?:[^"\\]|\\.)*")/g;let m;const all=[];
while(m=re.exec(body))all.push([ev('"'+m[1]+'"'),m[0],ev(m[2])]);
const lastIdx={};all.forEach(([k],j)=>lastIdx[k]=j);
const kept=all.filter(([k],j)=>lastIdx[k]===j),removed=all.filter(([k],j)=>lastIdx[k]!==j);
const nb='{'+kept.map(x=>x[1]).join(', ')+'}';const o2=ev(nb);
const norm=o=>JSON.stringify(Object.keys(o).sort().map(k=>[k,o[k]]));
console.log({pairs:all.length,keys:Object.keys(obj).length,kept:kept.length,removed:removed.length,same:norm(o2)===norm(obj)});
if(norm(o2)!==norm(obj)||kept.length!==Object.keys(obj).length)throw 'mismatch';
lines[2]=pre+nb+';';fs.writeFileSync(p,lines.join('\n'));
const esc=s=>s.replace(/\|/g,'｜');
const md=['# 英語訳の重複（01_en_dict.js）を片づけた記録','','開発と設計のベストプラクティス 案2（2026-10-10）。同じ日本語の見出しが2回以上あったもの。JavaScript では**あとに書いた方が使われる**ので、前の方を消した。画面に出る英語は1文字も変わらない（組み立て後の辞書の中身が同じことを確かめた）。','','訳が違っていたものは下の表。直したい訳があれば、英語担当か本線が「使われている訳」を書き換える。','','| 日本語 | 使われている訳（残した） | 消した訳 |','|---|---|---|'];
const diff=removed.filter(([k,,v])=>v!==obj[k]);diff.forEach(([k,,v])=>md.push(`| ${esc(k)} | ${esc(obj[k])} | ${esc(v)} |`));
md.push('',`訳が違っていたもの：${diff.length}件／訳が同じで消しただけのもの：${removed.length-diff.length}件`);
fs.writeFileSync(out,md.join('\n')+'\n');
