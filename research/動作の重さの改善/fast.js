// 試作：速い役判定（結果は元の bestN と同じ）と、チップの山の作り直しを省く
(function(){
function fastBest(cs){
  const n=cs.length;if(n<5||n>7)return null;
  const cnt=new Array(15).fill(0),sm=[0,0,0,0],sc=[0,0,0,0];let bits=0;
  for(let i=0;i<n;i++){const r=cs[i].r,s=cs[i].s;cnt[r]++;sm[s]|=1<<r;sc[s]++;bits|=1<<r}
  const sh=m=>{if(m&(1<<14))m|=2;for(let h=14;h>=5;h--){const w=0x1f<<(h-4);if((m&w)===w)return h}return 0};
  let fs=-1;for(let s=0;s<4;s++)if(sc[s]>=5)fs=s;
  if(fs>=0){const h=sh(sm[fs]);if(h)return[8,h]}
  const quads=[],trips=[],pairs=[],singles=[];
  for(let r=14;r>=2;r--){const c=cnt[r];if(c===4)quads.push(r);else if(c===3)trips.push(r);else if(c===2)pairs.push(r);else if(c===1)singles.push(r)}
  if(quads.length){const q=quads[0];let k=0;for(let r=14;r>=2;r--)if(r!==q&&cnt[r]){k=r;break}return[7,q,k]}
  if(trips.length&&(trips.length>1||pairs.length)){const t=trips[0];const p=Math.max(trips[1]||0,pairs[0]||0);return[6,t,p]}
  if(fs>=0){const o=[5];for(let r=14;r>=2&&o.length<6;r--)if(sm[fs]&(1<<r))o.push(r);return o}
  const st=sh(bits);if(st)return[4,st];
  const top=(ex,k)=>{const o=[];for(let r=14;r>=2&&o.length<k;r--)if(cnt[r]&&!ex.includes(r))o.push(r);return o};
  if(trips.length){const t=trips[0];return[3,t,...top([t],2)]}
  if(pairs.length>=2){const a=pairs[0],b=pairs[1];return[2,a,b,...top([a,b],1)]}
  if(pairs.length){const p=pairs[0];return[1,p,...top([p],3)]}
  return[0,...top([],5)]}
window.__fastBest=fastBest;
document.addEventListener('DOMContentLoaded',()=>{
  if(window.__noFast)return;
  try{if(typeof bestN==='function'){window.__origBest=bestN;bestN=function(cs){return cs.length>=5&&cs.length<=7?fastBest(cs):__origBest(cs)}}}catch(e){}
  try{if(typeof chipStack==='function'){const o=chipStack,M=new Map();chipStack=function(a,l,b,s,sd){let bb=0;try{bb=BB()}catch(e){}const k=a+'|'+l+'|'+b+'|'+s+'|'+sd+'|'+(innerWidth<620)+'|'+bb;let v=M.get(k);if(v===undefined){v=o(a,l,b,s,sd);if(M.size>3000)M.clear();M.set(k,v)}return v}}}catch(e){}
});
})();
