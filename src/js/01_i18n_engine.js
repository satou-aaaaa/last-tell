// v66（テスター目線 10）：最初の言語。設定の保存が無い（初めて開いた）ときだけ、ブラウザの言語が日本語以外なら英語で始める
const LANG0=(()=>{try{const r=localStorage.getItem('shisho-settings');if(r!==null){const o=JSON.parse(r)||{};return o.lang==='en'?'en':'ja'}}catch(e){return'ja'}
  try{const l=String((navigator.languages&&navigator.languages[0])||navigator.language||'ja');return/^ja\b/i.test(l)?'ja':'en'}catch(e){return'ja'}})();
const I18N=(()=>{
  const JP=/[぀-ヿ㐀-鿿！-～「」、。]/;
  let lang=LANG0;
  const norm=s=>s.replace(/\s+/g,' ').trim();
  const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const tpls=EN_TPL.map(([ja,en])=>{const lit=ja.replace(/\{\w+\}/g,'');
    const used=new Set();let re;try{re=new RegExp('^'+esc(ja).replace(/\\\{(\w+)\\\}/g,(m,i)=>{if(used.has(i))return '\\k<p'+i+'>';used.add(i);return '(?<p'+i+'>[\\s\\S]*?)'})+'$')}catch(e){re=null}
    return{re,en,w:lit.length}}).filter(t=>t.re&&t.w>0).sort((a,b)=>b.w-a.w);
  const keys=Object.keys(EN_DICT).filter(k=>k.length>=2&&JP.test(k)&&!/^[぀-ゟー、。！？…「」]+$/.test(k)).sort((a,b)=>b.length-a.length);
  const sub=keys.length?new RegExp(keys.map(esc).join('|'),'g'):null;
  const cache=new Map();
  const num=s=>s.replace(/([A-Za-z])\s*(さん|君|ちゃん)/g,'$1').replace(/約\s*([\d.]+)\s*万/g,(m,n)=>'~'+Math.round(parseFloat(n)*10)+'K').replace(/約\s*([\d,]+)/g,'~$1').replace(/([\d,]+)\s*万/g,(m,n)=>Math.round(parseFloat(n.replace(/,/g,''))*10)+'K')
    .replace(/([\d,]+)\s*回/g,'$1x').replace(/([\d,]+)\s*人/g,'$1 players').replace(/([\d,]+)\s*ハンド/g,'$1 hands').replace(/([\d,]+)\s*点/g,'$1 pts').replace(/第\s*(\d+)\s*章/g,'Ch.$1').replace(/([\d,]+)\s*章/g,'Ch.$1')
    .replace(/[「『]/g,'“').replace(/[」』]/g,'”').replace(/……/g,'...').replace(/…/g,'...').replace(/：/g,': ').replace(/　/g,' ').replace(/、/g,', ').replace(/。/g,'. ').replace(/！/g,'! ').replace(/？/g,'? ')
    .replace(/（/g,' (').replace(/）/g,') ').replace(/／/g,' / ').replace(/・/g,' / ').replace(/→/g,' → ').replace(/〜/g,'~').replace(/ {2,}/g,' ');
  function tr(s){
    if(lang!=='en'||typeof s!=='string'||!JP.test(s))return s;
    if(cache.has(s))return cache.get(s);
    const lead=s.match(/^\s*/)[0],tail=s.match(/\s*$/)[0],n=norm(s);let out=core(n,0);
    out=lead+out.trim()+(tail&&out.trim()?tail:'');cache.set(s,out);return out}
  function core(n,d){
    if(!n)return n;
    if(EN_DICT[n]!==undefined)return EN_DICT[n];
    if(!JP.test(n)||d>4)return n;
    {const st=n.match(/^([★☆]+) ([\s\S]+)$/);if(st)return st[1]+' '+core(st[2],d+1)}
    for(const t of tpls){const m=n.match(t.re);if(m){if(m.groups&&Object.values(m.groups).some(v=>v&&/ [／/] /.test(v)))continue;return t.en.replace(/\{(\w+)\}/g,(x,i)=>{const v=m.groups&&m.groups['p'+i];return v===undefined?'':core(v.trim(),d+1)})}}
    // 区切りでわけて訳す
    for(const sep of [' ／ ',' / ','／','\n']){if(n.includes(sep)){const parts=n.split(sep);if(parts.length>1)return parts.map(p=>core(p.trim(),d+1)).join(sep==='\n'?'\n':' / ')}}
    const q=n.match(/^([^「」]{1,14})「([\s\S]+)」$/);if(q)return core(q[1],d+1)+': “'+core(q[2],d+1)+'”';
    const qq=n.match(/^「([\s\S]+)」$/);if(qq)return '“'+core(qq[1],d+1)+'”';
    const nm=n.match(/^(\S+) (\S+)$/);if(nm&&EN_DICT[nm[2]]&&nm[2].length<=4)return core(nm[2],d+1)+', '+core(nm[1],d+1);
    // 知っている言葉を長い順に置きかえる
    let r=sub?n.replace(sub,k=>' '+EN_DICT[k]+' '):n;
    r=num(r).replace(/\s+([,.!?:)”])/g,'$1').replace(/([(“])\s+/g,'$1').replace(/ {2,}/g,' ').trim();
    if(window.__i18nlog)window.__i18nlog.push([n,r]);
    return r}
  // ---- 画面の文字 ----
  const seen=new WeakMap();const ATTR=['aria-label','title','placeholder','alt'];
  const skip=el=>{for(let e=el;e;e=e.parentElement){if(e.nodeType===1&&(e.tagName==='SCRIPT'||e.tagName==='STYLE'||e.hasAttribute('data-noi18n')))return true}return false};
  function doText(t){const cur=t.data,rec=seen.get(t);if(rec&&cur===rec.t)return;if(!JP.test(cur)){if(rec)seen.delete(t);return}
    if(skip(t.parentElement))return;const en=tr(cur);seen.set(t,{o:cur,t:en});if(en!==cur)t.data=en}
  function doAttr(el){if(skip(el))return;let rec=seen.get(el);for(const a of ATTR){const v=el.getAttribute(a);if(v==null||!JP.test(v))continue;
    rec=rec||{};rec[a]=v;const en=tr(v);if(en!==v)el.setAttribute(a,en)}if(rec)seen.set(el,rec)}
  function walk(root){if(lang!=='en')return;if(root.nodeType===3){doText(root);return}if(root.nodeType!==1&&root.nodeType!==9&&root.nodeType!==11)return;
    if(root.nodeType===1)doAttr(root);const w=document.createTreeWalker(root,5);let x;while((x=w.nextNode())){if(x.nodeType===3)doText(x);else doAttr(x)}}
  function restore(root){const w=document.createTreeWalker(root,5);let x;const all=[root];while((x=w.nextNode()))all.push(x);
    for(const n of all){const rec=seen.get(n);if(!rec)continue;if(n.nodeType===3){if(n.data===rec.t)n.data=rec.o}else for(const a of ATTR)if(rec[a]&&n.getAttribute(a)!=null&&JP.test(rec[a]))n.setAttribute(a,rec[a]);seen.delete(n)}}
  let busy=false;
  const mo=new MutationObserver(list=>{if(lang!=='en'||busy)return;busy=true;try{for(const m of list){
    if(m.type==='characterData')doText(m.target);else if(m.type==='attributes')doAttr(m.target);else m.addedNodes.forEach(walk)}}finally{busy=false}});
  function start(){mo.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:ATTR})}
  // キャンバスの文字（共有画像）
  const C2=CanvasRenderingContext2D.prototype;
  for(const f of ['fillText','strokeText','measureText']){const o=C2[f];C2[f]=function(s,...a){return o.call(this,lang==='en'?tr(String(s)):s,...a)}}
  function apply(){document.documentElement.lang=lang;document.title=lang==='en'?'LAST TELL':'LAST TELL（最後のテル）';
    if(lang==='en')walk(document.body);else restore(document.body);document.body.classList.toggle('en',lang==='en')}
  function set(l){lang=l==='en'?'en':'ja';cache.clear();apply()}
  return{tr,set,start,apply,get lang(){return lang}}
})();
const tr=s=>I18N.tr(s);
