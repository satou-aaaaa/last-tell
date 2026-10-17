// ===== 保存の読み書き（案4、2026-10-10） =====
// 新しいコードは localStorage を直接さわらず、saveGet / saveSet を使う。キーは SAVE_KEYS（16_save_ads.js）にも足す。
// 形は今までどおり {v:版, …中身}。読むときに版が古ければ SAVE_MIGRATE[キー][古い版] を順に当てて新しい形にする。
//   例：SAVE_MIGRATE['shisho-talk']={1:o=>({...o,v:2,heard:o.heard||[]})}  …版1を版2に
// 読めない・壊れているときは初期値を返す（ゲームは止めない）。書けないとき（容量・プライベートモード）は false を返す。
const SAVE_MIGRATE={};
function saveGet(key,def,ver){
  let raw=null;try{raw=localStorage.getItem(key)}catch(e){return def}
  if(raw==null)return def;
  let o;try{o=JSON.parse(raw)}catch(e){console.warn('[save] 読めない保存', key);return def}
  if(!o||typeof o!=='object'||Array.isArray(o))return o;
  const M=SAVE_MIGRATE[key]||{};let v=+o.v||1;ver=ver||v;
  while(v<ver){if(!M[v]){console.warn('[save] 移し替えがない', key, v);return def}
    try{o=M[v](o)}catch(e){console.warn('[save] 移し替えに失敗', key, v, e);return def}
    const nv=+o.v||v+1;v=nv>v?nv:v+1}
  return o}
function saveSet(key,val,ver){
  try{const o=val&&typeof val==='object'&&!Array.isArray(val)?Object.assign({},val,{v:ver||+val.v||1}):val;
    localStorage.setItem(key,JSON.stringify(o));return true}catch(e){return false}}
