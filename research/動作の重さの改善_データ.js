// 動作の重さの改善 案1：そのまま入れられるコード（2026-10-11）
// src/js/19_deck_eval.js の bestN をこれに置き換える。今の bestN は名前を bestNSlow に変えて残す（qa の比べ合わせ用）。
// 返す値は今の bestN と完全に同じ（[役の段階, 比べる数字…]）。乱数を使わないので、相手の判断・難しさは変わらない。
// 確かめたこと：5〜7枚の30万手で bestNSlow と一致。equity() を同じ乱数で300場面回して全部一致（約40倍速い）。
function bestN(cs){
  const n=cs.length;if(n<5||n>7)return bestNSlow(cs);
  const cnt=new Array(15).fill(0),sm=[0,0,0,0],sc=[0,0,0,0];let bits=0;
  for(let i=0;i<n;i++){const r=cs[i].r,s=cs[i].s;cnt[r]++;sm[s]|=1<<r;sc[s]++;bits|=1<<r}
  // ストレートの一番上（A は 1 としても使う）
  const sh=m=>{if(m&(1<<14))m|=2;for(let h=14;h>=5;h--){const w=0x1f<<(h-4);if((m&w)===w)return h}return 0};
  let fs=-1;for(let s=0;s<4;s++)if(sc[s]>=5)fs=s;
  if(fs>=0){const h=sh(sm[fs]);if(h)return[8,h]}
  const quads=[],trips=[],pairs=[];
  for(let r=14;r>=2;r--){const c=cnt[r];if(c===4)quads.push(r);else if(c===3)trips.push(r);else if(c===2)pairs.push(r)}
  const top=(ex,k)=>{const o=[];for(let r=14;r>=2&&o.length<k;r--)if(cnt[r]&&!ex.includes(r))o.push(r);return o};
  if(quads.length){const q=quads[0];return[7,q,...top([q],1)]}
  if(trips.length&&(trips.length>1||pairs.length))return[6,trips[0],Math.max(trips[1]||0,pairs[0]||0)];
  if(fs>=0){const o=[5];for(let r=14;r>=2&&o.length<6;r--)if(sm[fs]&(1<<r))o.push(r);return o}
  const st=sh(bits);if(st)return[4,st];
  if(trips.length)return[3,trips[0],...top([trips[0]],2)];
  if(pairs.length>=2)return[2,pairs[0],pairs[1],...top([pairs[0],pairs[1]],1)];
  if(pairs.length)return[1,pairs[0],...top([pairs[0]],3)];
  return[0,...top([],5)];
}
