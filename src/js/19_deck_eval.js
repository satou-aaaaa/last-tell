/* ---------- 山札・役判定 ---------- */
function fullDeck(){const d=[];for(let s=0;s<4;s++)for(let r=2;r<=14;r++)d.push({r,s});return d}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(LT.rand()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function eval5(cs){
  const rs=cs.map(c=>c.r).sort((a,b)=>b-a);
  const flush=cs.every(c=>c.s===cs[0].s);
  const uniq=[...new Set(rs)];
  let straightHigh=0;
  if(uniq.length===5){
    if(rs[0]-rs[4]===4)straightHigh=rs[0];
    else if(rs[0]===14&&rs[1]===5)straightHigh=5;
  }
  const cnt={};rs.forEach(r=>cnt[r]=(cnt[r]||0)+1);
  const groups=Object.entries(cnt).map(([r,n])=>[+r,n]).sort((a,b)=>b[1]-a[1]||b[0]-a[0]);
  const kick=groups.map(g=>g[0]);
  if(straightHigh&&flush)return[8,straightHigh];
  if(groups[0][1]===4)return[7,...kick];
  if(groups[0][1]===3&&groups[1][1]===2)return[6,...kick];
  if(flush)return[5,...rs];
  if(straightHigh)return[4,straightHigh];
  if(groups[0][1]===3)return[3,...kick];
  if(groups[0][1]===2&&groups[1][1]===2)return[2,...kick];
  if(groups[0][1]===2)return[1,...kick];
  return[0,...rs];
}
function cmp(a,b){for(let i=0;i<Math.max(a.length,b.length);i++){const d=(a[i]||0)-(b[i]||0);if(d)return d}return 0}
/* 5〜7枚から最強の5枚（元の総当たり。速い bestN の比べ合わせ用に残す） */
function bestNSlow(cs){
  let best=null;const n=cs.length,idx=[];
  (function rec(st,k){
    if(k===5){const s=eval5(idx.map(i=>cs[i]));if(!best||cmp(s,best)>0)best=s;return}
    for(let i=st;i<=n-(5-k);i++){idx.push(i);rec(i+1,k+1);idx.pop()}
  })(0,0);
  return best;
}
/* 5〜7枚から最強の5枚（速い方式。結果は bestNSlow と同じ。動作の重さの改善 案1） */
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
/* 5枚未満でも使える「ペア系の役の段階」 */
function groupCat(cs){
  if(cs.length===5)return eval5(cs)[0];
  const cnt={};cs.forEach(c=>cnt[c.r]=(cnt[c.r]||0)+1);
  const v=Object.values(cnt).sort((a,b)=>b-a);
  if(v[0]===4)return 7;if(v[0]===3)return 3;if(v[0]===2&&v[1]===2)return 2;if(v[0]===2)return 1;return 0;
}
/* 自分の2枚が役に絡んでいない＝実質「何もない」 */
function isWeak(hand,board){
  if(board.length<3)return false;
  const mine=bestN(hand.concat(board))[0];
  return mine===0||mine<=groupCat(board);
}
function handName(s){if(s[0]===8&&s[1]===14)return'ロイヤルフラッシュ';return HAND_JP[s[0]]}
function preTier(h){
  const [a,b]=[h[0].r,h[1].r].sort((x,y)=>y-x),suited=h[0].s===h[1].s;
  if(a===b)return a>=7?2:1;
  if(a===14&&b>=11)return 2;
  if(a===13&&b===12)return 2;
  if(a===14&&suited)return 1;
  if(a>=10&&b>=10)return 1;
  if(suited&&a-b<=2&&b>=5)return 1;
  if(a===14&&b>=9)return 1;
  return 0;
}
