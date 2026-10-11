import os,json,sys
os.chdir(os.path.dirname(os.path.abspath(__file__))+'/..')
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC).read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a);assert n==cnt,(a[:90],n);s=s.replace(a,b)
EN={};TP=[]
# 第4〜6章の足す客の style・持ち点（オートプレイの勝率を見て決めた。§4）
STY={'C4A':'nit','C4B':'nit2','C4C':'nit2','C5A':'nit','C5B':'nit','C5C':'liar2','C6A':'station','C6B':'tight2','C6CH':52000}
J=lambda x:json.dumps(x,ensure_ascii=False)
# 多様なキャラ（常連24人＋入港した船の客6人）。research/多様なキャラ_実装仕様.md
# モブキャラ仕様（ux/patch23_mobs.py の考え方）を土台に、差分を入れる
# ---------------------------------------------------------------- 絵
PARTS_JS=r'''const SKIN={ // [肌, 影, 唇] 明るい→暗い。影の色を肌に合わせると暗い肌でもつぶれない
  1:['#f4dcc9','#956a6e','#c8746e'], 2:['#ebc6a8','#8a5444','#b4705e'], 3:['#d8a47e','#7a4632','#a0604c'],
  4:['#bb8158','#5e3424','#8a4c3c'], 5:['#94603e','#432316','#6e3a2e'], 6:['#6e452c','#2c160c','#55302a'], 7:['#52331f','#1e0e06','#45261f'],
};
const skinOf=(n,o)=>({skin:SKIN[n][0],shade:SKIN[n][1],lip:SKIN[n][2],...(o||{})});

function genParts(c,id,SH,D){
  const H=c.hair,HD=c.hairD||c.hair;let hb=null,h=null,ex='',b='';
  const curls=(cx,cy,R,a0,a1,r,n)=>{let s='';for(let i=0;i<=n;i++){const a=(a0+(a1-a0)*i/n)*Math.PI/180;s+=`<circle cx="${(cx+R*Math.cos(a)).toFixed(1)}" cy="${(cy+R*Math.sin(a)).toFixed(1)}" r="${r}"/>`}return s};
  switch(c.hs){
    case 'short':h=`<path d="M33.6 42 Q32.4 16.4 50 15.6 Q67.6 16.4 66.4 42 Q64 30 56 27.4 Q48 30.6 40 29.6 Q35.4 34 33.6 42Z" fill="${H}"/>`;break;
    case 'crop':h=`<path d="M33.8 40 Q33.6 18 50 17 Q66.4 18 66.2 40 Q63 30 50 29 Q37 30 33.8 40Z" fill="${H}"/><path d="M33.8 40 Q33.6 18 50 17 Q66.4 18 66.2 40 Q63 30 50 29 Q37 30 33.8 40Z" fill="url(#${id}buzz)" opacity=".25"/>`;break;
    case 'bald':h='';ex+=`<path d="M33.2 47 Q32.4 38 34.6 33.4 Q35.8 39.6 36.2 47Z M66.8 47 Q67.6 38 65.4 33.4 Q64.2 39.6 63.8 47Z" fill="${H}"/>
      <ellipse cx="45" cy="22.6" rx="6" ry="2.4" fill="#fff" opacity=".16"/>`;break;
    case 'sidepart':h=`<path d="M33.4 44 Q31.8 15.6 50 14.8 Q68.2 15.6 66.6 42 Q65 28 58 25.2 Q50 23.4 41 26 Q44.4 29.6 37.4 33.4 Q34.6 38 33.4 44Z" fill="${H}"/>
      <path d="M41 26 Q47 21.4 58 22.6" fill="none" stroke="${HD}" stroke-width=".7" opacity=".7"/>`;break;
    case 'pixie':h=`<path d="M33.6 44 Q32 15.6 50 14.8 Q68 15.6 66.4 40 Q66 33 62 30 Q58 34 50 33.6 Q42 33.4 38 36.6 Q35 39 33.6 44Z" fill="${H}"/>
      <path d="M66.4 40 Q67.4 46 65.8 50 Q65 45 64.4 41Z" fill="${H}"/>`;break;
    case 'bob':hb=`<path d="M32.6 44 Q30.4 15 50 14.4 Q69.6 15 67.4 44 L68.6 64 Q66 68 60.6 66 L39.4 66 Q34 68 31.4 64Z" fill="${HD}"/>`;
      h=`<path d="M33.6 46 Q32 16.4 50 15.6 Q68 16.4 66.4 46 Q65 32 58 27 Q48 25.6 42 30 Q37 34 33.6 46Z" fill="${H}"/>
      <path d="M33.6 46 Q32.4 56 33.4 64 L37 64 Q35.6 54 36.4 44Z M66.4 46 Q67.6 56 66.6 64 L63 64 Q64.4 54 63.6 44Z" fill="${H}"/>`;break;
    case 'bangs':hb=`<path d="M32.4 44 Q29.6 13.4 50 12.8 Q70.4 13.4 67.6 44 L70.4 88 Q60 93 56 84 L44 84 Q40 93 29.6 88Z" fill="${HD}"/>`;
      h=`<path d="M33.6 46 Q32 16.4 50 15.6 Q68 16.4 66.4 46 Q66 37 64.6 34.6 L35.4 34.6 Q34 37 33.6 46Z" fill="${H}"/>
      <path d="M33.6 46 Q32.2 62 33.6 76 L36.8 75 Q35.4 60 36.4 44Z M66.4 46 Q67.8 62 66.4 76 L63.2 75 Q64.6 60 63.6 44Z" fill="${H}"/>`;break;
    case 'long':hb=`<path d="M32.4 44 Q29.6 13.4 50 12.8 Q70.4 13.4 67.6 44 L70.4 90 Q60 95 56 86 L44 86 Q40 95 29.6 90Z" fill="${HD}"/>`;
      h=`<path d="M33.4 46 Q31.6 15.4 50 14.6 Q68.4 15.4 66.6 44 Q64 26 44 24.6 Q38 30 36 40 Q34.6 42 33.4 46Z" fill="${H}"/>
      <path d="M66.6 44 Q68 62 65 80 L62.6 78 Q65 62 63.8 46Z" fill="${H}"/>`;break;
    case 'wavy':hb=`<path d="M32 44 Q29 13.4 50 12.8 Q71 13.4 68 44 Q72 52 69.4 60 Q73.6 68 70 76 Q73 84 66 90 Q60 92 58 84 L42 84 Q40 92 34 90 Q27 84 30 76 Q26.4 68 30.6 60 Q28 52 32 44Z" fill="${HD}"/>`;
      h=`<path d="M33.2 46 Q31.4 15 50 14.4 Q68.6 15 66.8 46 Q66 34 61 28.6 Q55 25.4 48 26.6 Q42 28 39 33 Q36 38 33.2 46Z" fill="${H}"/>
      <path d="M33.2 46 Q31 54 33.6 60 Q31.4 66 34.4 72 L36.6 70 Q34.6 64 36.4 58 Q34.6 52 36 46Z M66.8 46 Q69 54 66.4 60 Q68.6 66 65.6 72 L63.4 70 Q65.4 64 63.6 58 Q65.4 52 64 46Z" fill="${H}"/>`;break;
    case 'ponytail':hb=`<path d="M60 20 Q77 22 75 40 Q74 56 66.4 68 Q70 52 66.4 35 Q64.4 27 58 24Z" fill="${HD}"/>`;
      h=`<path d="M33.6 41 Q32.6 16 50 15.2 Q67.4 16 66.4 41 Q64 27 50 25.8 Q36 27 33.6 41Z" fill="${H}"/>
      <path d="M62.4 25.4 l3 -1.8 l1.2 2.8" fill="none" stroke="${c.tieC||'#b8434f'}" stroke-width="1.6" stroke-linecap="round"/>`;break;
    case 'bun':hb=`<circle cx="50" cy="13.4" r="6.4" fill="${HD}"/>`;
      h=`<path d="M33.8 42 Q32.6 16.4 50 15.6 Q67.4 16.4 66.2 42 Q64 30 54 27 Q50 26.4 46 27 Q36 30 33.8 42Z" fill="${H}"/>`;break;
    case 'curly':hb=`<g fill="${HD}">${curls(50,32,16.6,170,370,4.6,12)}</g>`;
      h=`<g fill="${H}"><path d="M33.8 40 Q33.6 18 50 17 Q66.4 18 66.2 40 Q62 31 50 30 Q38 31 33.8 40Z"/>${curls(50,33,15.4,195,345,3.6,10)}</g>`;break;
    case 'afro':hb=`<g fill="${HD}"><ellipse cx="50" cy="31" rx="22.4" ry="19.6"/>${curls(50,31,21,150,390,4.4,18)}</g>`;
      h=`<g fill="${H}"><path d="M34 40 Q34 24 50 23 Q66 24 66 40 Q62 31.6 50 31 Q38 31.6 34 40Z"/>${curls(50,30,15.6,190,350,3.4,10)}</g>`;break;
    case 'locs':{let s='';for(let i=-5;i<=5;i++){const x=50+i*3.5,len=78+((i*7+11)%5)*2.2;s+=`<rect x="${(x-1.7).toFixed(1)}" y="26" width="3.4" height="${len-26}" rx="1.7"/>`}
      hb=`<g fill="${HD}"><ellipse cx="50" cy="28" rx="18.6" ry="13.6"/>${s}</g>`;
      h=`<g fill="${H}"><path d="M33.8 41 Q33.4 17.6 50 16.6 Q66.6 17.6 66.2 41 Q63 30.4 50 29.6 Q37 30.4 33.8 41Z"/>
        <path d="M37 33 Q44 28.8 50 29.6 M50 29.6 Q57 28.8 63 33" fill="none" stroke="${HD}" stroke-width="1"/>
        ${[38,42.5,47,52,57,61.6].map(x=>`<rect x="${x-1.5}" y="${x<45||x>56?30:27.6}" width="3" height="${x<45||x>56?9:6.4}" rx="1.5"/>`).join('')}</g>`;break;}
    case 'hijab':{const S=c.scarf||c.cloth2||'#2f5a5a';hb='';
      h=`<g><path fill-rule="evenodd" d="M50 11.6 Q27.6 12.6 27 44 Q26.6 64 34.4 76 Q28 82 18 88 L14 100 L86 100 L82 88 Q72 82 65.6 76 Q73.4 64 73 44 Q72.4 12.6 50 11.6Z
        M50 24.6 Q37.4 25 37 39.6 Q37 52.6 40.4 59.6 Q44.6 67.6 50 68.6 Q55.4 67.6 59.6 59.6 Q63 52.6 63 39.6 Q62.6 25 50 24.6Z" fill="${S}"/>
        <path d="M50 24.6 Q37.4 25 37 39.6 Q37 52.6 40.4 59.6 Q44.6 67.6 50 68.6 Q55.4 67.6 59.6 59.6 Q63 52.6 63 39.6 Q62.6 25 50 24.6Z" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="1.4"/>
        <path d="M30 60 Q36 72 46 78 M70 58 Q66 70 58 77 M29 46 Q30 30 40 20" fill="none" stroke="#000" stroke-opacity=".16" stroke-width=".9"/>
        <path d="M50 11.6 Q27.6 12.6 27 44 Q30 22 50 18.6Z" fill="#fff" opacity=".1"/></g>`;break;}
  }
  if(c.greyHair&&h)h+=`<path d="${(h.match(/d="([^"]*)"/)||[])[1]||''}" fill="url(#${id}grey)" opacity="${c.greyHair}"/>`;
  if(c.streak&&h)ex+=`<path d="M44 16.6 Q40 22 38.4 30" fill="none" stroke="${c.streak}" stroke-width="1.6" stroke-linecap="round" opacity=".9"/>`;
  /* ひげ */
  if(c.beard==='full')ex+=`<path d="M35.6 50 Q36 67 44.6 73 Q50 76.4 55.4 73 Q64 67 64.4 50 Q62 59 57.6 61.6 Q54 64.6 50 64.4 Q46 64.6 42.4 61.6 Q38 59 35.6 50Z" fill="${c.beardC||HD}"/>
    <path d="M43.4 61.6 Q50 59.2 56.6 61.6 Q54 63.4 50 62.6 Q46 63.4 43.4 61.6Z" fill="${c.beardC||HD}"/>`;
  if(c.beard==='short')ex+=`<path d="M37 56 Q38.6 68 45.4 72 Q50 74.4 54.6 72 Q61.4 68 63 56 Q60 63 56 64.8 Q53 66.4 50 66.2 Q47 66.4 44 64.8 Q40 63 37 56Z" fill="${c.beardC||HD}" opacity=".9"/>
    <path d="M43.8 61.8 Q50 59.8 56.2 61.8 Q54 63 50 62.4 Q46 63 43.8 61.8Z" fill="${c.beardC||HD}"/>`;
  if(c.beard==='goatee')ex+=`<path d="M45.4 66.4 Q50 74 54.6 66.4 Q52 68 50 67.8 Q48 68 45.4 66.4Z M43.8 61.8 Q50 59.8 56.2 61.8 Q54 63 50 62.4 Q46 63 43.8 61.8Z" fill="${c.beardC||HD}"/>`;
  if(c.mustacheG)ex+=`<path d="M43.6 61.8 Q50 59.6 56.4 61.8 Q54 63.2 50 62.4 Q46 63.2 43.6 61.8Z" fill="${c.beardC||HD}" opacity=".9"/>`;
  /* めがね・耳飾り */
  const ey=(c.cy??45.4),ex0=c.cx??58;
  if(c.glasses==='round')ex+=`<g fill="#ffffff" fill-opacity=".06" stroke="${c.frame||'#2a2420'}" stroke-width=".9"><circle cx="${100-ex0}" cy="${ey}" r="6.2"/><circle cx="${ex0}" cy="${ey}" r="6.2"/></g>
    <path d="M${100-ex0+6.2} ${ey-.6} Q50 ${ey-2.2} ${ex0-6.2} ${ey-.6} M${100-ex0-6.2} ${ey-1} L34.6 ${ey-2.4} M${ex0+6.2} ${ey-1} L65.4 ${ey-2.4}" fill="none" stroke="${c.frame||'#2a2420'}" stroke-width=".8"/>`;
  if(c.glasses==='square')ex+=`<g fill="#ffffff" fill-opacity=".06" stroke="${c.frame||'#2a2420'}" stroke-width="1"><rect x="${100-ex0-6.8}" y="${ey-4.2}" width="13.6" height="8.4" rx="1.6"/><rect x="${ex0-6.8}" y="${ey-4.2}" width="13.6" height="8.4" rx="1.6"/></g>
    <path d="M${100-ex0+6.8} ${ey-1.4} L${ex0-6.8} ${ey-1.4} M${100-ex0-6.8} ${ey-1.6} L34.6 ${ey-2.6} M${ex0+6.8} ${ey-1.6} L65.4 ${ey-2.6}" fill="none" stroke="${c.frame||'#2a2420'}" stroke-width=".9"/>`;
  if(c.earring&&c.hs!=='hijab')ex+=`<circle cx="33.8" cy="56.6" r="1.2" fill="${c.earring}"/><circle cx="66.2" cy="56.6" r="1.2" fill="${c.earring}"/>`;
  /* 服 */
  const BASE=c.broad?'M2 100 Q6 80 50 78 Q94 80 98 100Z':'M8 100 L12 85 Q28 77 50 76 Q72 77 88 85 L92 100Z';
  const CL=c.cloth,CD=c.clothD||c.cloth,SHR=c.shirt||'#ece8e0';
  switch(c.outfit){
    case 'tee':b=`<path d="${BASE}" fill="${CL}"/><path d="M42 77.6 Q50 84 58 77.6" fill="none" stroke="${CD}" stroke-width="1.2"/>`;break;
    case 'suit':b=`<path d="${BASE}" fill="${CL}"/><path d="M38 77 L50 92 L62 77 L57 76 L50 85 L43 76Z" fill="${SHR}"/>
      ${c.tie?`<path d="M48.6 84 L51.4 84 L53 98 L50 100 L47 98Z" fill="${c.tie}"/>`:''}<path d="M38 77 L46 100 M62 77 L54 100" stroke="${CD}" stroke-width="1"/>`;break;
    case 'jacket':b=`<path d="${BASE}" fill="${CL}"/><path d="M40 77 L44 100 L56 100 L60 77 Q50 81 40 77Z" fill="${SHR}"/>
      <path d="M40 77 L36 84 L44 100 M60 77 L64 84 L56 100" fill="none" stroke="${CD}" stroke-width="1.2"/>`;break;
    case 'knit':b=`<path d="${BASE}" fill="${CL}"/><path d="M41 72 L59 72 L60 81 Q50 84 40 81Z" fill="${CD}"/>
      <path d="M42 75 L58 75 M41.6 78 L58.4 78" stroke="#000" stroke-opacity=".18" stroke-width=".6"/>`;break;
    case 'work':b=`<path d="${BASE}" fill="${CL}"/><path d="M40 77 L50 86 L60 77 L64 82 L50 90 L36 82Z" fill="${CD}"/><path d="M50 88 L50 100" stroke="#c8c4bc" stroke-width=".9"/>
      ${c.patch?`<rect x="60" y="88" width="9" height="5" rx="1" fill="${c.patch}"/>`:''}`;break;
    case 'dress':b=`<path d="${BASE}" fill="${CL}"/><path d="M40 76.4 Q50 83 60 76.4" fill="none" stroke="${CD}" stroke-width="1.4"/>
      ${c.necklace?`<path d="M42 78 Q50 86 58 78" fill="none" stroke="${c.necklace}" stroke-width=".7"/><circle cx="50" cy="84" r="1" fill="${c.necklace}"/>`:''}`;break;
  }
  return {hb,h,ex,b};
}'''
DEFS_JS=r'''const DIVERSE_REAL={
  /* ── 錨亭 ── */
  'マツ':{rank:1,sex:'m',age:2,...skinOf(3),hair:'#d8d4cc',hairD:'#a8a49c',brow:'#c8c4bc',iris:'#3a2a1c',
    cloth:'#5a6f8a',clothD:'#33445c',face:'s',cute:1,ew:5,eh:3.2,ir:2.6,blush:.3,hs:'bald',outfit:'knit',glasses:'round'},
  'ナギ':{rank:1,sex:'f',age:0,...skinOf(2),hair:'#2a2420',hairD:'#15110e',brow:'#2a2420',iris:'#3a2a1c',
    cloth:'#3fa0a0',clothD:'#24686a',face:'yf',cute:1,young:1,ew:6,eh:4.6,ir:3.6,cy:46.8,neck:5,blush:.35,hs:'ponytail',tieC:'#ffd166',outfit:'work',patch:'#ffd166'},
  'アデ':{rank:3,sex:'m',age:0,...skinOf(6),hair:'#141010',hairD:'#0a0808',brow:'#141010',iris:'#2a1a12',
    cloth:'#22324a',clothD:'#121c2c',face:'m',eh:2.4,neck:7.4,hs:'crop',beard:'short',beardC:'#141010',outfit:'work',patch:'#e2b65b',broad:1},
  'マリア':{rank:3,sex:'f',age:1,...skinOf(3),hair:'#1c1614',hairD:'#0e0a08',brow:'#2a2018',iris:'#2a1a12',
    cloth:'#6a2a3a',clothD:'#3a141e',face:'f',eh:2.6,hs:'bun',streak:'#cfcac2',outfit:'dress',necklace:'#e2b65b',earring:'#e2b65b'},
  /* ── 銀の扉 ── */
  'ヨシオ':{rank:2,sex:'m',age:1,...skinOf(2),hair:'#3a3328',hairD:'#1e1a14',brow:'#3a3328',iris:'#3a2a1c',
    cloth:'#c9b07a',clothD:'#8a7444',face:'w',cute:1,ew:4.6,eh:3,ir:2.4,blush:.25,hs:'sidepart',greyHair:.3,outfit:'suit',shirt:'#f2efe8',tie:'#5a2b2b',glasses:'square'},
  'リン':{rank:1,sex:'f',age:0,...skinOf(1),hair:'#1a1a22',hairD:'#0c0c12',brow:'#1a1a22',iris:'#3a2a1c',
    cloth:'#a8d8b0',clothD:'#6a9c74',face:'yf',cute:1,young:1,ew:6.2,eh:4.8,ir:3.8,cy:47,neck:5,noWing:1,blush:.4,hs:'bob',outfit:'tee'},
  'ハンナ':{rank:3,sex:'f',age:0,...skinOf(1),hair:'#e8d08a',hairD:'#b89a52',brow:'#a8884a',iris:'#5a8ab0',
    cloth:'#3a4a3a',clothD:'#1e2a1e',face:'f',eh:2.5,hs:'pixie',outfit:'work',patch:'#c8a050'},
  'ラジ':{rank:2,sex:'m',age:0,...skinOf(4),hair:'#16120e',hairD:'#0a0806',brow:'#16120e',iris:'#2a1a12',
    cloth:'#e0a040',clothD:'#a06a1a',face:'ym',cute:1,young:1,ew:5.2,eh:3.6,ir:3,cy:46.4,neck:6,blush:.15,hs:'short',mustacheG:1,outfit:'jacket',shirt:'#f2efe8'},
  /* ── 月影 ── */
  'カズ':{rank:2,sex:'m',age:0,...skinOf(2),hair:'#5a3a2a',hairD:'#2e1e14',brow:'#4a2e20',iris:'#3a2a1c',
    cloth:'#6b4a8a',clothD:'#3e2a52',face:'r',cute:1,ew:5,eh:3.4,ir:2.8,blush:.2,hs:'short',stubble:1,outfit:'jacket',shirt:'#2a2430'},
  'サヤ':{rank:2,sex:'f',age:0,...skinOf(1),hair:'#1f2a3a',hairD:'#0f1520',brow:'#1f2a3a',iris:'#3a5a8a',
    cloth:'#e9e6df',clothD:'#a8a49c',face:'yf',cute:1,young:1,ew:5.8,eh:4.2,ir:3.3,cy:46.6,neck:5,blush:.25,hs:'long',outfit:'knit',glasses:'round',frame:'#6a4a3a'},
  'ウォルター':{rank:4,sex:'m',age:2,...skinOf(6),hair:'#d8d4cc',hairD:'#a8a49c',brow:'#c8c4bc',iris:'#2a1a12',
    cloth:'#5a4a36',clothD:'#2e241a',face:'m',eh:2.3,hs:'bald',beard:'short',beardC:'#d0ccc4',outfit:'jacket',shirt:'#e8e2d4',glasses:'square',frame:'#8a7a5a'},
  'スミン':{rank:2,sex:'f',age:0,...skinOf(1),hair:'#120e10',hairD:'#060406',brow:'#120e10',iris:'#2a1a12',
    cloth:'#20222c',clothD:'#0e0f14',face:'yf',cute:1,young:1,ew:5.6,eh:4,ir:3.2,cy:46.6,neck:5,blush:.2,hs:'bangs',outfit:'tee',earring:'#cfd4e0'},
  /* ── 天空 ── */
  'シオン':{rank:3,sex:'f',age:0,...skinOf(2),hair:'#20222c',hairD:'#0e0f14',brow:'#20222c',iris:'#2a3a3a',
    cloth:'#15161d',clothD:'#08090c',face:'f',eh:2.3,hs:'bob',outfit:'suit',shirt:'#7fd1c8'},
  'アキラ':{rank:2,sex:'f',age:1,...skinOf(2),hair:'#d9a03a',hairD:'#8a5a1a',brow:'#6a4420',iris:'#a35a24',
    cloth:'#e04f6b',clothD:'#9a2a40',face:'s',cute:1,ew:5,eh:3.4,ir:2.8,blush:.25,hs:'wavy',outfit:'jacket',shirt:'#1a1a1a',earring:'#e2b65b'},
  'ルカ':{rank:2,sex:'m',age:0,...skinOf(4),hair:'#2a1c14',hairD:'#140c08',brow:'#2a1c14',iris:'#3a2a1c',
    cloth:'#2f7a4a',clothD:'#1a4a2a',face:'ym',cute:1,young:1,ew:5.2,eh:3.8,ir:3,cy:46.4,neck:6.4,blush:.15,hs:'curly',stubble:1,outfit:'work',patch:'#ffd166'},
  'アイシャ':{rank:3,sex:'f',age:0,...skinOf(4),hair:'#1a1210',brow:'#1a1210',iris:'#2a1a12',
    cloth:'#2a3550',clothD:'#141a2a',face:'f',eh:2.5,hs:'hijab',scarf:'#3e6e6a',outfit:'dress'},
  /* ── 地下 ── */
  'ガン':{rank:2,sex:'m',age:1,...skinOf(3),hair:'#1a1a1a',hairD:'#0a0a0a',brow:'#1a1a1a',iris:'#2a1a12',
    cloth:'#a3243a',clothD:'#5a1220',face:'O',cute:1,ew:5.4,eh:3.6,ir:3,blush:.3,grin:1,hs:'crop',outfit:'tee',broad:1,neck:9},
  'ドク':{rank:3,sex:'m',age:2,...skinOf(2),hair:'#d8d8d0',hairD:'#a8a8a0',brow:'#c8c8c0',iris:'#3a2a1c',
    cloth:'#2a2620',clothD:'#141210',face:'m',eh:2.2,hs:'sidepart',mustacheG:1,beardC:'#d0d0c8',outfit:'suit',shirt:'#d8d0c0'},
  'ベン':{rank:3,sex:'m',age:1,...skinOf(1),hair:'#a8a49c',hairD:'#6a665e',brow:'#8a867e',iris:'#4a6a8a',
    cloth:'#3a3026',clothD:'#1c1712',face:'m',eh:2.4,hs:'crop',stubble:1,outfit:'knit',broad:1,neck:9.6},
  'ミン':{rank:2,sex:'m',age:0,...skinOf(3),hair:'#141010',hairD:'#080606',brow:'#141010',iris:'#2a1a12',
    cloth:'#4a5a6a',clothD:'#2a3440',face:'ym',cute:1,young:1,ew:5.2,eh:3.6,ir:2.9,cy:46.4,neck:6,blush:.15,hs:'short',outfit:'work',patch:'#e06a3a'},
  /* ── 王冠 ── */
  'レン':{rank:1,sex:'m',age:0,...skinOf(2),hair:'#8a6a4a',hairD:'#4a3424',brow:'#6a4a30',iris:'#4a3424',
    cloth:'#7fb0e0',clothD:'#4a7aa8',face:'ym',cute:1,young:1,ew:5.8,eh:4.4,ir:3.4,cy:46.6,neck:5.6,blush:.3,nervous:1,hs:'short',outfit:'tee'},
  'イオリ':{rank:3,sex:'f',age:1,...skinOf(2),hair:'#5a5f6a',hairD:'#2e323a',brow:'#3a3e46',iris:'#3a3a3a',
    cloth:'#2a2d36',clothD:'#14161c',face:'f',eh:2.4,hs:'pixie',outfit:'knit'},
  'ソフィア':{rank:4,sex:'f',age:1,...skinOf(3),hair:'#2a1810',hairD:'#140b06',brow:'#2a1810',iris:'#3a2210',
    cloth:'#1a1418',clothD:'#0a0809',face:'f',eh:2.3,hs:'wavy',outfit:'dress',necklace:'#c9d3e0',earring:'#c9d3e0'},
  'タケル':{rank:4,sex:'m',age:0,...skinOf(2),hair:'#121318',hairD:'#060608',brow:'#121318',iris:'#2a2a2a',
    cloth:'#1c1d24',clothD:'#0b0c10',face:'m',eh:2.3,hs:'sidepart',outfit:'suit',shirt:'#3a3e4a'},
  /* ── 入港した船の客（案2） ── */
  'クワメ':{rank:3,sex:'m',age:0,...skinOf(7),hair:'#1a1210',hairD:'#0c0806',brow:'#1a1210',iris:'#2a1a12',
    cloth:'#e2b65b',clothD:'#a07a2a',face:'m',eh:2.4,hs:'locs',outfit:'tee',neck:7},
  'イネス':{rank:2,sex:'f',age:1,...skinOf(2),hair:'#6a3a20',hairD:'#3a1e10',brow:'#4a2a18',iris:'#4a6a3a',
    cloth:'#2a4a7a',clothD:'#162a4a',face:'s',cute:1,ew:5,eh:3.4,ir:2.8,blush:.25,hs:'curly',outfit:'knit'},
  'ラース':{rank:2,sex:'m',age:2,...skinOf(1),hair:'#e8e2d0',hairD:'#b8b2a0',brow:'#d8d2c0',iris:'#5a8ab0',
    cloth:'#b8343a',clothD:'#6a1a1e',face:'w',cute:1,ew:4.6,eh:3,ir:2.4,blush:.4,ruddy:.3,hs:'crop',beard:'full',beardC:'#e8e2d0',outfit:'knit',broad:1},
  'ファティマ':{rank:3,sex:'f',age:0,...skinOf(4),hair:'#1a1210',hairD:'#0c0806',brow:'#1a1210',iris:'#2a1a12',
    cloth:'#6a3a5a',clothD:'#3a1e30',face:'f',eh:2.5,hs:'wavy',outfit:'jacket',shirt:'#e8e2d4',earring:'#e2b65b'},
  'メイ':{rank:2,sex:'f',age:0,...skinOf(1),hair:'#16120e',hairD:'#0a0806',brow:'#16120e',iris:'#2a1a12',
    cloth:'#f0c8d0',clothD:'#b88a96',face:'yf',cute:1,young:1,ew:5.8,eh:4.2,ir:3.3,cy:46.6,neck:5,blush:.3,hs:'ponytail',tieC:'#e2b65b',outfit:'tee'},
  'オリビア':{rank:2,sex:'f',age:2,...skinOf(1),hair:'#e8e4dc',hairD:'#b8b4ac',brow:'#a8a49c',iris:'#4a6a8a',
    cloth:'#3a5a4a',clothD:'#1e3428',face:'s',cute:1,ew:5,eh:3.2,ir:2.6,blush:.3,hs:'bob',outfit:'knit',glasses:'round',frame:'#8a4a3a'},
};'''
rep("/* 案2：顔のつくりを大人の比率にした描き方（見本用。ジン・レイカ・ミナ・ゲン） */\nconst REAL={",
    "/* 多様なキャラ用の部品（髪型・服・肌の段階） */\n"+PARTS_JS+"\n/* 案2：顔のつくりを大人の比率にした描き方（見本用。ジン・レイカ・ミナ・ゲン） */\nconst REAL={")
rep("};\nconst RFACE={","};\n/* 多様なキャラ（店の常連24人＋入港した船の客6人） */\n"+DEFS_JS+"\nObject.assign(REAL,DIVERSE_REAL);\nconst RFACE={")
rep("  if(c.scar)ex+=`<path d=\"M54.4 66.6",
    "  if(c.hs||c.outfit){const g=genParts(c,id,SH,D);if(g.hb!=null)hairBack=g.hb;if(g.h!=null)hair=g.h;ex+=g.ex;if(g.b)body=g.b;}\n  if(c.scar)ex+=`<path d=\"M54.4 66.6")
# ---------------------------------------------------------------- データ
STORE_JP={1:'錨亭',2:'銀の扉',3:'月影',4:'天空',5:'地下',6:'王冠'}
STORE_REG_EN={1:'Anchor regular',2:'Silver Door regular',3:'Moonshade regular',4:'Skyline regular',5:'Underground regular',6:'Crown regular'}
for k,v in STORE_JP.items():EN[v+'の常連']=STORE_REG_EN[k]
# 名前, 英語, 店, style, strong, bluff, 穴, ★
M=[('マツ','Matsu',1,'nit','still','talk','fold3b',1),('ナギ','Nagi',1,'station','glance','fast','chase',1),
   ('アデ','Ade',1,'tight','still','glance','upTight',3),('マリア','Maria',1,'tight2','smile','talk','fitFold',3),
   ('ヨシオ','Yoshio',2,'normal','still','talk','oneShot',2),('リン','Rin',2,'tight2','fast','sweat','honestRiver',1),
   ('ハンナ','Hanna',2,'tight','stare','fast','oneShot',3),('ラジ','Raj',2,'station','talk','still','chase',2),
   ('カズ','Kazu',3,'normal','glance','talk','afterLoss',2),('サヤ','Saya',3,'tight','still','fast','fitFold',2),
   ('ウォルター','Walter',3,'normal','still','glance','pairStick',4),('スミン','Sumin',3,'normal','still','fast','stab',2),
   ('シオン','Shion',4,'tight','still','stare','upTight',3),('アキラ','Akira',4,'tight2','talk','glance','riverFold',2),
   ('ルカ','Luca',4,'liar2','smile','talk','afterLoss',2),('アイシャ','Aisha',4,'tight','smile','still','honestRiver',3),
   ('ガン','Gan',5,'liar2','talk','still','bigPot',2),('ドク','Doku',5,'nit','still','glance','honestRiver',3),
   ('ベン','Ben',5,'nit','still','stare','fold3b',3),('ミン','Minh',5,'liar2','fast','sweat','fitFold',2),
   ('レン','Ren',6,'station','still','sweat','afterLoss',1),('イオリ','Iori',6,'tight2','glance','fast','oneShot',3),
   ('ソフィア','Sofía',6,'tight2','still','fast','upTight',4),('タケル','Takeru',6,'tight','still','glance','riverFold',4)]
# 入港した船の客：名前, 英語, 港, 港(英), 言葉, 言葉(英), style, strong, bluff, ★
SH=[('クワメ','Kwame','テマ','Tema','英語','English','tight','still','glance',3),
    ('イネス','Inês','リスボン','Lisbon','ポルトガル語','Portuguese','normal','smile','talk',2),
    ('ラース','Lars','ベルゲン','Bergen','ノルウェー語','Norwegian','nit','still','stare',2),
    ('ファティマ','Fatima','タンジェ','Tangier','アラビア語','Arabic','tight2','glance','fast',3),
    ('メイ','Mei','シンガポール','Singapore','英語','English','normal','smile','sweat',2),
    ('オリビア','Olivia','ハリファックス','Halifax','英語','English','tight','still','talk',2)]
for r in M:EN[r[0]]=r[1]
for r in SH:EN[r[0]]=r[1];EN[r[2]]=r[3];EN[r[4]]=r[5]
# (THINK, FACING, fold, win)
SAY={
 'マツ':(('……ふむ','...Hm.'),('……ほう','...Oh?'),('……降り','...Fold.'),('年寄りにも、たまには来る','Even an old man gets one now and then.')),
 'ナギ':(('見たいなあ','I wanna see it...'),('え、来る？ 見たいじゃん','Oh, you\'re coming? Now I wanna see.'),('今日はやめとく……いや、次は見る','I\'ll sit this one out... no, next time I\'m looking.'),('ほら、見てよかった','See? Glad I looked.')),
 'ヨシオ':(('レンジ的には……','Range-wise...'),('今のはね……','So, that one...'),('理屈どおり、降り','By the book. Fold.'),('教科書どおりだね','Textbook.')),
 'リン':(('見るだけ見るよ','I\'ll just take a look.'),('わ、わ……','Wh-whoa...'),('ごめん、降りる','Sorry, I fold.'),('あ、勝っちゃった','Oh. I won.')),
 'カズ':(('前もこういうの、あってさ','This happened to me before, see.'),('来たよ、あの時と同じだ','Here it comes. Just like that time.'),('降りる。あの時も降りればよかった','Fold. Should have folded that time too.'),('……これは話さないでおく','...I won\'t tell this one.')),
 'サヤ':(('いま、だいたい3割','Right now, about 30%.'),('足りない……かな','Not enough... I think.'),('数字が降りろって','The numbers say fold.'),('計算どおり','As calculated.')),
 'シオン':(('……','...'),('……サイズ、言ってね','...Say the size, please.'),('降り。ディーラーさん、続けて','Fold. Dealer, carry on.'),('次、配って','Next hand, please.')),
 'アキラ':(('この前の大会でもさ','At the last tournament, too...'),('見られてるな、これ','People are watching this one.'),('ここは降りるのがうまいところ','A good player folds here.'),('写真、撮っといて','Someone take a picture.')),
 'ガン':(('当然、行くでしょ','Obviously I\'m in.'),('へえ、やる気？','Oh? You want to go?'),('……ちっ','...Tch.'),('降りればよかったのに','Should have folded.')),
 'ドク':(('……','...'),('……若いな','...Young.'),('……','...'),('……昔は、もっと速かった','...I used to be faster.')),
 'レン':(('次は本気出す','Next time I go all out.'),('うわ、どうしよう','Uh-oh, what do I do?'),('もう一回、出直す','I\'ll regroup and come back.'),('本気、出た！','There\'s the real me!')),
 'イオリ':(('短いほうが、得意なの','I\'m better when I\'m short.'),('……数えさせて','...Let me count.'),('まだ早い','Too early.'),('残るのは、得意なの','Staying alive is my thing.')),
 'アデ':(('出航まで、あと二時間','Two hours until we sail.'),('……計算し直す','...Let me recalculate.'),('今日はここまで。船が待ってる','That\'s it for today. The ship is waiting.'),('いい航海になりそうだ','Looks like a good voyage ahead.')),
 'マリア':(('ふうん','Hmm.'),('ふうん、そう来る','Hmm. So that\'s your move.'),('今回は通してあげる','I\'ll let this one pass.'),('顔に書いてあったよ','It was written all over your face.')),
 'ハンナ':(('……（メモをめくる）','...(flips through her notes)'),('前にも、同じ大きさだったね','You bet that same size before.'),('記録しておく','Noted.'),('メモどおり','Just like my notes said.')),
 'ラジ':(('楽しんだもん勝ちでしょ','Whoever has the most fun wins, right?'),('おっ、そう来なくちゃ','Oh, now that\'s more like it!'),('次！ 次がある','Next! There\'s always a next one.'),('ほら、楽しんだから来た','See? I had fun, so it came.')),
 'ウォルター':(('セキなら、ここで降りるだろうね','Seki would fold here, I suppose.'),('いい賭けだ。でも、私は見たい','A good bet. But I want to see it.'),('……今回はセキの勝ちだな','...Seki wins this round.'),('降りないのも、たしなみでね','Staying in is good manners too, you see.')),
 'スミン':(('次の曲までに決める','I\'ll decide before the next song.'),('え、待って','Wait, what?'),('パス！ 音、見てくる','Pass! I\'m going to check the sound.'),('ちょうどサビ','Right on the chorus.')),
 'ルカ':(('押していこう','Let\'s push.'),('いいね、波が来た','Nice, here comes a wave.'),('今は引き潮だ','The tide\'s going out for now.'),('大きい船も、押せば動く','Even a big ship moves if you push it.')),
 'アイシャ':(('潮の満ち引きと同じ','Same as the tides.'),('……見せて','...Show me.'),('ここは引く','I\'ll pull back here.'),('読んだとおりの潮','The tide I read.')),
 'ベン':(('ゆっくりでいい','No need to hurry.'),('そうか','I see.'),('若いのに譲るよ','I\'ll leave it to the young ones.'),('小さく賭けて、大きく取る','Bet small, win big.')),
 'ミン':(('熱いうちに、だね','While it\'s hot, right?'),('来たね','Here it comes.'),('冷めた。降りる','It\'s gone cold. Fold.'),('つながった','It held together.')),
 'ソフィア':(('……（長く考える）','...(thinks for a long time)'),('いい港ね。いい賭け','A good port. A good bet.'),('また来る','I\'ll be back.'),('どの港でも、同じ','Same in every port.')),
 'タケル':(('（手で「少し待って」と合図）','(signals “one moment” with his hand)'),('（メモ）いい賭け','(Note) Good bet.'),('（カードを静かに前に出す）','(quietly pushes his cards forward)'),('（小さく頭を下げる）','(gives a small bow)')),
}
PH={'マツ':('……降り','...Fold.'),'ナギ':('見たいじゃん','I wanna see!'),'ヨシオ':('今のはね……知らんけど','So, that one... or not, who knows.'),'リン':('見るだけ見るよ','I\'ll just take a look.'),
    'カズ':('この前さ、AAで入ったのに……','The other day, I had AA, and...'),'サヤ':('いま、だいたい3割','Right now, about 30%.'),'シオン':('ボタン、動いてないよ','The button didn\'t move.'),
    'アキラ':('この前の大会でさ','At the last tournament...'),'ガン':('降りていいよ？','You can fold, you know?'),'ドク':('……若いな','...Young.'),'レン':('次は本気出す','Next time I go all out.'),'イオリ':('短いほうが、得意なの','I\'m better when I\'m short.'),
    'アデ':('船は待ってくれない','The ship won\'t wait.'),'マリア':('言葉より、手を見るの','I watch hands, not words.'),'ハンナ':('同じ手は、二度通じない','The same move won\'t work twice.'),
    'ラジ':('楽しんだもん勝ち','Whoever has the most fun wins.'),'ウォルター':('降りないのも、たしなみ','Staying in is good manners too.'),'スミン':('次の曲までに','Before the next song.'),
    'ルカ':('押せば動く','Push and it moves.'),'アイシャ':('流れを見るの','I watch the current.'),'ベン':('小さく、ゆっくり','Small and slow.'),'ミン':('熱いうちに','While it\'s hot.'),
    'ソフィア':('どの港にも、卓がある','Every port has a table.'),'タケル':('（メモ）目で話そう','(Note) Let\'s talk with our eyes.'),
    'クワメ':('港ごとに、卓の音が違う','Every port\'s table sounds different.'),'イネス':('坂の多い港は、いい港','A port with many hills is a good port.'),'ラース':('雨の日だけ、大きく行く','I only go big on rainy days.'),
    'ファティマ':('荷も手も、中を見てから','Cargo or cards, I look inside first.'),'メイ':('次の港で、また','See you at the next port.'),'オリビア':('灯りは、消えても場所は変わらない','A light can go out, but it stays in the same place.')}
PROF={
 'マツ':(('錨亭の常連。ゲンが乗っていた船の、元の船長','An Anchor regular. Once the captain of the boat Gen worked on.'),('ゲンより先に船を降り、ゲンより先に錨亭にいた','He left the sea before Gen did, and was at the Anchor before Gen was.')),
 'ナギ':(('魚市場の配達。閉店まで粘って、そのまま仕事に行く','Delivers for the fish market. Stays until closing, then goes straight to work.'),('ゲンに打ち方を習ったことは、誰にも言っていない','She has never told anyone that Gen taught her to play.')),
 'ヨシオ':(('銀の扉に十年通う、解説好き','Has come to the Silver Door for ten years. Loves to explain.'),('ロクにだけは、一度も教えたことがない','Roku is the one person he has never explained anything to.')),
 'リン':(('台湾から来た留学生。ハルの同級生で、ハルに連れてこられた','An exchange student from Taiwan. Haru\'s classmate; Haru brought her here.'),('席にこだわらないので、ハルとよくもめる','She doesn\'t care where she sits, so she and Haru often argue.')),
 'カズ':(('月影の常連。同じ話を毎回する。ミナは結末を先に言える','A Moonshade regular. Tells the same story every time. Mina can say the ending before he does.'),('本当は、あの手で降りられたことに気づいている','Deep down, he knows he could have folded that hand.')),
 'サヤ':(('確率で降りる学生','A student who folds by the odds.'),('セキに「確率で降りる人は、確率で負ける」と言われ、意味を考えている','Seki told her, “Those who fold by the odds lose by the odds.” She is still thinking about what it means.')),
 'シオン':(('天空のディーラーの手元を、レイカの次によく見ている','After Reika, the one who watches the Skyline dealer\'s hands most closely.'),('怒るのはミスのときだけ。負けたときは何も言わない','Only gets angry at mistakes. Says nothing when she loses.')),
 'アキラ':(('名前を売りたくて、どの店の大会にも出ている','Enters every house\'s tournament, hoping to make a name.'),('夢は、王冠の看板戦を一番前で見ること','Dreams of watching the Crown\'s sign match from the front row.')),
 'ガン':(('ハヤトにあこがれて地下に来た','Came underground because he looks up to Hayato.'),('ハヤトには、まだ名前を覚えてもらっていない','Hayato still doesn\'t know his name.')),
 'ドク':(('地下にいちばん長くいる客','The customer who has been underground the longest.'),('子どものころのハヤトを知っている','He knew Hayato as a boy.')),
 'レン':(('王冠の大会に毎回出て、毎回出直す','Enters every Crown tournament, and regroups every time.'),('出直すたびに、降りる回数が少しずつ増えている','Every time he regroups, he folds a little more often.')),
 'イオリ':(('チップが少なくなってから強くなる','Gets stronger once her chips run low.'),('王冠の大会で、クロウと同じ卓になると、なぜか先に帰る','At Crown tournaments, whenever she draws Crow\'s table, she somehow leaves first.')),
 'アデ':(('ナイジェリア出身。月に一度入港する貨物船の機関士','From Nigeria. An engineer on a cargo ship that docks once a month.'),('出航の二時間前になると、どんな手でも降りる','Two hours before sailing, he folds any hand.')),
 'マリア':(('フィリピン出身。港の船の通訳で、4つの言葉を話す','From the Philippines. An interpreter for the ships in port; she speaks four languages.'),('店主とは25年の付き合い。ジンの昔を少しだけ知っている','She has known the Owner for 25 years, and knows a little about Jin\'s past.')),
 'ハンナ':(('ドイツ出身。古い船の家具を直す職人。車いすで来る','From Germany. She restores furniture from old ships. She comes in a wheelchair.'),('銀の扉の入口の段差は、ロクが黙って直した','Roku quietly fixed the step at the Silver Door\'s entrance.')),
 'ラジ':(('インド出身の通関士。港の荷物の書類を毎日見ている','A customs broker from India. He reads the port\'s cargo papers every day.'),('ヨシオの解説を、いちばん楽しそうに聞く','Of everyone, he enjoys Yoshio\'s explanations the most.')),
 'ウォルター':(('アメリカ出身の写真家。30年前に港を撮りに来て、住みついた','A photographer from the United States. He came to shoot the port 30 years ago and stayed.'),('セキの将棋仲間。二人はいつも逆の打ち方をする','Seki\'s shogi partner. At the table, the two always play opposite ways.')),
 'スミン':(('韓国出身。月影の音響係。休憩のあいだだけ卓に座る','From Korea. The Moonshade\'s sound engineer. She only sits in during breaks.'),('ミナの声を、いちばん近くで聞いている','She hears Mina\'s voice from closer than anyone.')),
 'ルカ':(('日系ブラジル人の三世。港のタグボートの船長','A third-generation Japanese Brazilian. Captain of a tugboat in the port.'),('ストラドルのある店が好き。天空にはそのために通う','He likes houses with a straddle. That is why he comes to the Skyline.')),
 'アイシャ':(('マレーシア出身。港の大学で海の流れを研究している','From Malaysia. She studies ocean currents at the port university.'),('卓ではいつも温かいお茶。レイカと好きな茶葉が同じ','Always has warm tea at the table. She and Reika like the same tea leaves.')),
 'ベン':(('イギリス出身の元船大工。大柄で、静か','A former shipwright from England. Big and quiet.'),('賭場跡の倉庫の、昔の持ち主。新しい客が困っていると、黙って席を詰める','He once owned the warehouse where the old gambling den was. When a newcomer looks lost, he quietly makes room.')),
 'ミン':(('ベトナム出身。造船所の溶接工','From Vietnam. A welder at the shipyard.'),('ガンに何度あおられても、ターンまでは動かない','No matter how often Gan needles him, he doesn\'t move before the turn.')),
 'ソフィア':(('メキシコ出身。世界の港の大会を回るプロ','From Mexico. A pro who travels to tournaments in ports around the world.'),('王冠の看板戦のうわさを、遠い港で聞いて来た','She heard about the Crown\'s sign match in a faraway port, and came.')),
 'タケル':(('この街の生まれ。耳が聞こえず、手話と筆談で話す','Born in this town. He is Deaf, and talks in sign language and in writing.'),('声のクセは効かない。目と手は、だれよりもよく見ている','Voice tells don\'t work on him. He watches eyes and hands more closely than anyone.')),
 'クワメ':(('テマから来た貨物船の機関長','Chief engineer of a cargo ship from Tema.'),('この街の卓の音が、いちばん静かだと言う','He says this town\'s tables are the quietest he has heard.')),
 'イネス':(('リスボンの航海士','A navigator from Lisbon.'),('港に着くと、まず一番古い店を探す','When she reaches a port, the first thing she looks for is the oldest house.')),
 'ラース':(('ベルゲンの漁船の船長','Captain of a fishing boat from Bergen.'),('雨の日のほうが、なぜか強い','Somehow, he is stronger on rainy days.')),
 'ファティマ':(('タンジェの積み荷の検査官','A cargo inspector from Tangier.'),('一度も、開けずに通したことがない','She has never once let anything through unopened.')),
 'メイ':(('航海士の見習い。初めての長い航海','An apprentice navigator on her first long voyage.'),('寄った港の卓を、ノートに全部書いている','She writes down every table in every port in her notebook.')),
 'オリビア':(('引退した灯台守。貨物船に乗せてもらって旅をしている','A retired lighthouse keeper, traveling as a guest on a cargo ship.'),('錨亭の看板の灯りを、海から見たことがある','She has seen the Anchor\'s sign light from the sea.')),
}
FULL={'アデ':'Adewale Adeyemi','マリア':'Maria Santos','ハンナ':'Hanna Becker','ラジ':'Rajesh Mehta','ウォルター':'Walter Brooks','スミン':'Kim Su-min',
      'ルカ':'Lucas Nakamura','アイシャ':'Aisha Rahman','ベン':'Ben Carter','ミン':'Nguyen Van Minh','ソフィア':'Sofía Ramírez','タケル':'Saeki Takeru'}
for k in SAY:
    for ja,en in SAY[k]:EN[ja]=en
for k in PH:EN[PH[k][0]]=PH[k][1]
for k in PROF:
    for ja,en in PROF[k]:EN[ja]=en
# タケルのメモ（（メモ）を外した文）と、しぐさの字幕
EN.update({'いい賭け':'Good bet.','目で話そう':'Let\'s talk with our eyes.'})
GEST={'（手で「少し待って」と合図）':('タケルが、手で「少し待って」と合図した','Takeru signals “one moment” with his hand.'),
      '（カードを静かに前に出す）':('タケルが、カードを静かに前に出した','Takeru quietly pushes his cards forward.'),
      '（小さく頭を下げる）':('タケルが、小さく頭を下げた','Takeru gives a small bow.')}
for k,(ja,en) in GEST.items():EN[ja]=en
names=[r[0] for r in M]
# CHARS（★と名札の判定に rank だけ）
rep("  /* chars.js に無い5人","  /* 店の常連24人と入港した船の客6人（絵は REAL。ここは★だけ） */\n  "+",".join(f"'{r[0]}':{{rank:{r[7]}}}" for r in M)+",\n  "+",".join(f"'{r[0]}':{{rank:{r[9]}}}" for r in SH)+",\n  /* chars.js に無い5人")
mobs=','.join(f"'{r[0]}':{{store:{r[2]},style:'{r[3]}'}}" for r in M)
ships=','.join(f"'{r[0]}':{{port:'{r[2]}',lang:'{r[4]}',style:'{r[6]}'}}" for r in SH)
rep("CHARS['老人']=CHARS['ジン'];",
    "CHARS['老人']=CHARS['ジン'];\n// 店の常連（モブ）。store: 1錨亭 2銀の扉 3月影 4天空 5地下 6王冠\nconst MOBS={"+mobs+"};\n// 入港した船の客（フリー対戦だけ、第3章クリア後。日付で1人）\nconst SHIP={"+ships+"};")
# TELLS（rate .65 / false .1）
rep("  // クロウのクセは全部わざと","".join(f"  '{r[0]}':{{strong:{{cue:'{r[4]}',rate:.65,false:.1}},bluff:{{cue:'{r[5]}',rate:.65,false:.1}}}},\n" for r in M)
    +"".join(f"  '{r[0]}':{{strong:{{cue:'{r[7]}',rate:.65,false:.1}},bluff:{{cue:'{r[8]}',rate:.65,false:.1}}}},\n" for r in SH)+"  // クロウのクセは全部わざと",cnt=s.count("  // クロウのクセは全部わざと"))
assert s.count("'マツ':{strong:{cue:")==1,s.count("'マツ':{strong:{cue:")
# THINK / FACING / LINES（船の客は口ぐせだけ）
rep("  _cute:['えーっと……','どうしよう'],_cool:['……','ふむ'],","  "+",".join(f"'{j}':{J([SAY[j][0][0]])}" for j in names)+",\n  "+",".join(f"'{r[0]}':{J([PH[r[0]][0]])}" for r in SH)+",\n  _cute:['えーっと……','どうしよう'],_cool:['……','ふむ'],")
rep("  _cute:['うわ、大きい！'],_cool:['……大きく来たな'],","  "+",".join(f"'{j}':{J([SAY[j][1][0]])}" for j in names)+",\n  _cute:['うわ、大きい！'],_cool:['……大きく来たな'],")
rep("  _cute:{needled:","".join(f"  '{j}':{{fold:{J([SAY[j][2][0]])},win:{J([SAY[j][3][0]])}}},\n" for j in names)+"  _cute:{needled:")
# INTRO（VS の紹介）
SHIP_ROLE='入港した船の客'
rep("  'ジン':['師匠','俺の手を読んでみろ'],","".join(f"  '{r[0]}':{J([STORE_JP[r[2]]+'の常連',PH[r[0]][0]])},\n" for r in M)
    +"".join(f"  '{r[0]}':{J([SHIP_ROLE.replace('{0}',r[2]),PH[r[0]][0]])},\n" for r in SH)+"  'ジン':['師匠','俺の手を読んでみろ'],")
# LEAKS（view は今の文）。船の客は穴なし
VIEW={'fold3b':'{n}は、やり返されると弱い','chase':'{n}は、入るまで追ってくる','oneShot':'{n}は、一度しか打ってこない','honestRiver':'{n}は、最後の一枚では嘘をつかん','afterLoss':'{n}は、負けたすぐあとが荒い',
      'fitFold':'{n}は、外れたらすぐ降りる','upTight':'{n}は、勝っていると守りに入る','riverFold':'{n}は、最後に弱い','bigPot':'{n}は、大きな勝負から降りられん','pairStick':'{n}は、ペアがあれば降りない','stab':'{n}は、待てない'}
rep("'タロウ':{k:'shortTight',view:'{n}は、チップが減ると縮こまる'}};",
    "'タロウ':{k:'shortTight',view:'{n}は、チップが減ると縮こまる'},"+",".join(f"'{r[0]}':{{k:'{r[6]}',view:'{VIEW[r[6]]}'}}" for r in M)+"};")
TP.append(["{0}は、大きな勝負から降りられん","{0} can't fold in a big pot"])
# 性別のない英語に（同じ穴を男女どちらも持つので）
rep('"{0} gets careful when she\'s ahead"','"{0} gets careful when ahead"')
rep('"{0} folds as soon as she misses"','"{0} folds as soon as the flop misses"')
# PROFILE（mob:1 / ship:1。人物タブの最後に、会った数で開く）
rep("};\n// 相関図","".join(f"  '{r[0]}':{{ph:{J(PH[r[0]][0])},ch:{r[2]},mob:1,lines:[[{r[2]},{J(PROF[r[0]][0][0])}],[{r[2]},{J(PROF[r[0]][1][0])}]]}},\n" for r in M)
    +"".join(f"  '{r[0]}':{{ph:{J(PH[r[0]][0])},ch:3,ship:1,lines:[[3,{J(PROF[r[0]][0][0])}],[3,{J(PROF[r[0]][1][0])}]]}},\n" for r in SH)+"};\nconst FULLNAME="+J(FULL)+";\n// 相関図")
# TITLES
rep("  {id:'regular',","  {id:'kao',name:'顔なじみ',hint:'店の常連24人のページを、すべて開く',jin:'この街の客の顔は、もう覚えたな。'},\n  {id:'port',name:'港の顔ぶれ',hint:'入港した船の客6人のページを、すべて開く',jin:'どこの港から来ても、卓に座れば同じ一人だ。'},\n  {id:'regular',")
EN.update({'顔なじみ':'Familiar Face','店の常連24人のページを、すべて開く':'Open the pages of all 24 house regulars','この街の客の顔は、もう覚えたな。':'You know every face in this town now.',
  '港の顔ぶれ':'Faces of the Port','入港した船の客6人のページを、すべて開く':'Open the pages of all 6 guests from the ships','どこの港から来ても、卓に座れば同じ一人だ。':'Whatever port they come from, at the table they\'re just one more player.'})
# ---------------------------------------------------------------- 顔なじみ帳の記録
rep("function renderNotes(){",
"""// ===== 顔なじみ帳：モブと同じ卓で終わったハンドの数（降りていても数える）・入港した船の客と会った日数 =====
const MOB_KEY='shisho-mob';
function loadMobAll(){try{const o=JSON.parse(localStorage.getItem(MOB_KEY))||{},ok=x=>x&&typeof x==='object'&&!Array.isArray(x);
  return{h:ok(o.h)?o.h:{},ship:ok(o.ship)?o.ship:{},sd:ok(o.sd)?o.sd:{}}}catch(e){return{h:{},ship:{},sd:{}}}}
function saveMobAll(o){try{localStorage.setItem(MOB_KEY,JSON.stringify({v:1,h:o.h,ship:o.ship,sd:o.sd}))}catch(e){}}
const loadMob=()=>loadMobAll().h;
const mobH=n=>+loadMob()[n]||0;
function mobCount(){if(!S||!S.players||CFG.flashback)return;const ms=S.players.filter(p=>!p.human&&!p.out&&MOBS[p.name]);if(!ms.length)return;
  const o=loadMobAll(),h=o.h;ms.forEach(p=>{const a=+h[p.name]||0,b=a+1;h[p.name]=b;
    if(a<10&&b>=10)log(`顔なじみ帳：${p.name}のページが開いた`);else if(a<60&&b>=60)log(`顔なじみ帳：${p.name}のことが、もう少しわかった`)});
  saveMobAll(o);
  if(Object.keys(MOBS).every(k=>(+h[k]||0)>=10))grantTitle('kao')}
// 今日入港している船の客（日付で1人。今日の1ハンドと同じ日付の決め方）
function shipToday(){const L=Object.keys(SHIP),d=dayNo(todayKey());return L[((d%L.length)+L.length)%L.length]}
function shipMet(k){const o=loadMobAll(),t=todayKey();if(o.sd[k]===t)return;o.sd[k]=t;o.ship[k]=(+o.ship[k]||0)+1;saveMobAll(o);
  if(Object.keys(SHIP).every(x=>(+o.ship[x]||0)>=1))grantTitle('port')}
function renderNotes(){""")
TP+= [["顔なじみ帳：{0}のページが開いた","Familiar faces: {0}'s page is open"],["顔なじみ帳：{0}のことが、もう少しわかった","Familiar faces: you learned a little more about {0}"]]
rep("function endHand(){if(S&&S.players)leakEnd();talkEnd();","function endHand(){if(S&&S.players){leakEnd();mobCount()}talkEnd();")
# ---------------------------------------------------------------- 人物タブ
rep("    body=Object.keys(PROFILE).filter(k=>PROFILE[k].ch<=cl+1).map(k=>{const P=PROFILE[k];",
    "    body=Object.keys(PROFILE).filter(k=>!PROFILE[k].mob&&!PROFILE[k].ship&&PROFILE[k].ch<=cl+1).map(k=>{const P=PROFILE[k];")
old_tail="""${(()=>{const d=loadRead().byName[k];return d&&d.t?`<p class="rd">読み宣言 ${d.h}/${d.t}</p>`:''})()}</div></article>`}).join('');
  }else if(noteTab==='rules'){"""
rep(old_tail,"""${(()=>{const d=loadRead().byName[k];return d&&d.t?`<p class="rd">読み宣言 ${d.h}/${d.t}</p>`:''})()}</div></article>`}).join('');
    body+=mobNotes(n,cl);
  }else if(noteTab==='rules'){""")
rep("function renderNotes(){","""// 人物タブの最後：店の常連（10ハンドで1行目、60ハンドで2行目）と、入港した船（1日で1行目、3日で2行目）
function mobNotes(n,cl){const mo=loadMobAll(),mh=mo.h;
  const tells=k=>n[k]?Object.keys(n[k]).map(c=>{const r=n[k][c],tot=r.strong+r.bluff+r.none;return`<li>「${CUE_LABEL[c]}」→ 強い手 ${r.strong}／ブラフ ${r.bluff}／意味なし ${r.none}（${tot}回）</li>`}).join(''):'';
  const card=(k,sub,l2,lk2,foot)=>{const P=PROFILE[k],tl=tells(k);
    return`<article class="pcard mob"><div class="pava">${avatar(k)}</div><div class="pbody"><h4>${esc(k)}<span class="stars">${stars(rankOf(k))}</span></h4>
      ${FULLNAME[k]?`<p class="ms fn">${esc(FULLNAME[k])}</p>`:''}<p class="ms">${esc(sub)}</p><p class="ph">「${esc(P.ph)}」</p><ul><li>${esc(P.lines[0][1])}</li>${l2?`<li>${esc(P.lines[1][1])}</li>`:`<li class="lk">${esc(lk2)}</li>`}</ul>
      ${tl?`<details><summary>見抜いたクセ</summary><ul class="tl">${tl}</ul></details>`:''}<p class="rd">${esc(foot)}</p></div></article>`};
  const lock=(sub,t)=>`<article class="pcard mob mlk"><div class="pava" aria-hidden="true">？</div><div class="pbody"><h4>？？？</h4><p class="ms">${esc(sub)}</p><ul><li class="lk">${esc(t)}</li></ul></div></article>`;
  let h=`<h3 class="nhead">店の常連</h3>`+Object.keys(MOBS).sort((a,b)=>MOBS[a].store-MOBS[b].store).map(k=>{const c=+mh[k]||0;
    if(c<10)return lock(INTRO[k][0],'？？？（同じ卓で10ハンド打つと開く）');
    return card(k,INTRO[k][0],c>=60,'？？？（同じ卓で60ハンド打つと開く）',`同じ卓で${c}ハンド`)}).join('');
  if(cl>=3||Object.keys(mo.ship).length){
    h+=`<h3 class="nhead">入港した船</h3>`+Object.keys(SHIP).map(k=>{const d=+mo.ship[k]||0,sp=SHIP[k];
      if(d<1)return lock('入港した船の客','？？？（入港した日に、フリー対戦で同じ卓に座ると開く）');
      return card(k,`${sp.port}・${sp.lang}`,d>=3,'？？？（3日会うと開く）',`会った日：${d}日`)}).join('')}
  return h}
function renderNotes(){""")
EN.update({'店の常連':'House regulars','入港した船':'Ships in port','入港した船の客':'Ship\'s guest','？？？（同じ卓で10ハンド打つと開く）':'??? (Unlocks after 10 hands at the same table)',
  '？？？（同じ卓で60ハンド打つと開く）':'??? (Unlocks after 60 hands at the same table)','？？？（入港した日に、フリー対戦で同じ卓に座ると開く）':'??? (Unlocks when you share a Free Play table on a day their ship is in)',
  '？？？（3日会うと開く）':'??? (Unlocks after meeting on 3 days)'})
TP+= [["同じ卓で{0}ハンド","{0} hands at the same table"],["会った日：{0}日","Days met: {0}"]]
CSS="""
/* 多様なキャラ：人物タブの店の常連・入港した船、タケルのメモ、名札の言葉 */
.nhead{margin:10px 0 0;font-size:.9rem;color:var(--gold);border-bottom:1px solid #ffffff22;padding-bottom:4px;grid-column:1/-1}
.pcard.mlk .pava{display:grid;place-items:center;font-size:1.6rem;font-weight:900;color:var(--muted)}
.pcard.mlk h4{color:var(--muted)}
.pcard .ms{margin:0 0 2px;font-size:.74rem;color:var(--muted);overflow-wrap:anywhere}
.say.memo,.say.memo.l,.say.memo.r{background:#f2efe8;color:#2a2420;clip-path:none;border-radius:2px;padding:5px 10px 6px;box-shadow:0 2px 8px rgba(0,0,0,.45);rotate:-2.5deg;border:1px solid #d8d2c4}
.nm .lang{display:inline-block;margin-left:4px;padding:0 4px;border-radius:3px;font-size:.58rem;font-weight:700;line-height:1.4;letter-spacing:0;color:#cfe3ff;background:rgba(80,120,170,.35);vertical-align:1px;white-space:nowrap}
"""
assert s.count('</style>')>=1;s=s.replace('</style>',CSS+'</style>',1)
# ---------------------------------------------------------------- 第4〜6章：足す客（タロウは座らない）
# 6人卓案B：足す客は慎重寄り（勝率が下がったら style を変える。§4）
rep("  extras:[{name:'ケンジ',style:'nit',chips:80000,label:'常連'},{name:'ミサキ',style:'nit2',chips:80000,label:'常連'},{name:'タロウ',style:'nit',chips:80000,label:'常連'}],seatPlan:['e0','p0','p1','e1','e2'],",
    "  extras:[{name:'シオン',style:'@@C4A@@',chips:80000},{name:'アキラ',style:'@@C4B@@',chips:80000},{name:'アイシャ',style:'@@C4C@@',chips:80000}],seatPlan:['e0','p0','p1','e1','e2'],")
rep("  extras:[{name:'ケンジ',style:'nit',chips:80000,label:'常連'},{name:'タロウ',style:'nit',chips:80000,label:'常連'},{name:'ミサキ',style:'nit2',chips:80000,label:'常連'}],seatPlan:['e0','p0','p1','e1','e2'],",
    "  extras:[{name:'ドク',style:'@@C5A@@',chips:80000},{name:'ベン',style:'@@C5B@@',chips:80000},{name:'ミン',style:'@@C5C@@',chips:80000}],seatPlan:['e0','p0','p1','e1','e2'],")
rep("  extras:[{name:'ミサキ',style:'nit',chips:52000,label:'常連'},{name:'ケンジ',style:'nit2',chips:52000,label:'常連'}],seatPlan:['e0','p0','p1','p2','e1'],",
    "  extras:[{name:'レン',style:'@@C6A@@',chips:@@C6CH@@},{name:'ソフィア',style:'@@C6B@@',chips:@@C6CH@@}],seatPlan:['e0','p0','p1','p2','e1'],")
for k,v in STY.items():s=s.replace('@@'+k+'@@',str(v))
# ---------------------------------------------------------------- フリー対戦
rep("""    seats:[{name:'あなた',chips:100000,human:true},{name:'ケンジ',style:'normal',chips:100000},
           {name:'ミサキ',style:'normal',chips:100000},$('freeRude').checked?{name:'ゴウ',style:'rude',chips:100000}:{name:'タロウ',style:'normal',chips:100000}]
      .concat($('freeSize').value==='6'?[{name:'テツ',style:'station',chips:100000},{name:'ソウ',style:'liar2',chips:100000}]:[])});""",
"""    seats:[{name:'あなた',chips:100000,human:true},{name:'ケンジ',style:'normal',chips:100000},{name:'ミサキ',style:'normal',chips:100000}].concat(freeSeats())});
}
// 残りの席：クリアした店の常連＋タロウ（6人卓はテツ・ソウも）から毎回ランダム。第3章クリア後は、空いた席の1つに今日の船の客（6人卓は必ず、4人卓は2回に1回）
let freeShipN=0;
function freeSeats(){const six=$('freeSize').value==='6',rude=$('freeRude').checked,cl=loadCleared();
  const fill=[{name:'タロウ',style:'normal'}].concat(six?[{name:'テツ',style:'station'},{name:'ソウ',style:'liar2'}]:[]);
  const cand=Object.keys(MOBS).filter(k=>MOBS[k].store<=cl).map(k=>({name:k,style:MOBS[k].style})).concat(fill);
  let n=(six?3:1)-(rude?1:0),ship=null;const got=[];
  if(cl>=3&&n>0&&(six||(freeShipN++)%2===0)){const k=shipToday();ship={name:k,style:SHIP[k].style};n--}
  while(got.length<n&&cand.length)got.push(cand.splice(Math.floor(Math.random()*cand.length),1)[0]);
  fill.forEach(f=>{if(got.length<n&&!got.some(g=>g.name===f.name))got.push(f)});
  if(ship){got.splice(Math.floor(Math.random()*(got.length+1)),0,ship);shipMet(ship.name)}
  return(rude?[{name:'ゴウ',style:'rude'}]:[]).concat(got).map(o=>({...o,chips:100000}))""")
# 名札：船の客は名前の横に言葉の名前（フリー対戦だけ）
rep("pl.innerHTML=`<span class=\"nm\">${esc(p.name)}<span class=\"stars\">${stars(rankOf(p.name))}</span></span>",
    "pl.innerHTML=`<span class=\"nm\">${esc(p.name)}<span class=\"stars\">${stars(rankOf(p.name))}</span>${SHIP[p.name]&&!CFG.ch?`<small class=\"lang\">${SHIP[p.name].lang}</small>`:''}</span>")
# ---------------------------------------------------------------- タケル：ひとことはメモ、（ ）のしぐさは地の文の字幕
rep("      if(p.say.line){sy.textContent=p.say.line;",
    "      const tk=p.name==='タケル';if(tk&&p.say.line&&p.say.line[0]==='（'&&!p.say.line.startsWith('（メモ）')){S.msg=TK_GEST[p.say.line]||('タケル'+p.say.line);sy.classList.remove('go','memo')}\n      else if(p.say.line){sy.classList.toggle('memo',tk);sy.textContent=tk?p.say.line.replace(/^（メモ）/,''):p.say.line;")
rep("function sayLine(i,line){","const TK_GEST="+J({k:v[0] for k,v in GEST.items()})+";\nfunction sayLine(i,line){")
# 揺さぶる（声をかける系）はタケルに効かない。黙って見るだけは効く。ジンが一度だけ言う
rep("function needleBoost(p,cue){","function needleBoost(p,cue){if(p.name==='タケル'&&S.needleStyle!=='stare')return 0;")
rep("  else if(S.needle===S.street&&!p.answered&&(p.faked===S.street||Math.random()<.7)){",
    "  else if(S.needle===S.street&&!p.answered&&!(p.name==='タケル'&&S.needleStyle!=='stare')&&(p.faked===S.street||Math.random()<.7)){")
rep("  S.msg=st.msg;\n  // 案3：揺さぶったときの自分の手を、相手が覚える",
    "  S.msg=st.msg;\n  if(style!=='stare'&&!S.tkJin&&S.players.some(q=>q.name==='タケル'&&inHand(q))){S.tkJin=true;jinNote('あいつには、言葉は効かん。目で勝負しろ',0)}\n  // 案3：揺さぶったときの自分の手を、相手が覚える")
EN['あいつには、言葉は効かん。目で勝負しろ']='Words won\'t work on him. Fight with your eyes.'
# ---------------------------------------------------------------- シオン：ディーラーのミスがあった卓で、ひとこと（判定と頻度は変えない）
rep("    grantTitle('misdeal');if(!S.misNoted){",
    "    {const si=S.players.find(q=>q.name==='シオン'&&!q.out);if(si)si.say={seq:(S.saySeq=(S.saySeq||0)+1)+9700,act:'',line:mq?'今の、表になってたよ':'配り直し、ね'}}\n    grantTitle('misdeal');if(!S.misNoted){")
EN.update({'今の、表になってたよ':'That one was face up.','配り直し、ね':'A redeal. Right.'})
# ---------------------------------------------------------------- 隣の卓の声：開いている、その店の常連の名前を時々付ける
rep("    const p=nvPick();if(!p)return;","    const p=nvPick();if(!p)return;nvMob(p);")
rep("function nvPick(){",
"""function nvMob(p){if(p[0]!=='air')return;const st=storeNo(),h=loadMob();
  const L=Object.keys(MOBS).filter(k=>(!st||MOBS[k].store===st)&&(+h[k]||0)>=10&&!S.players.some(q=>q.name===k));
  if(L.length&&Math.random()<.35){const k=L[Math.floor(Math.random()*L.length)];p[1]=`${k}「${PROFILE[k].ph.replace(/^（メモ）/,'')}」`}}
function nvPick(){""")
# ---------------------------------------------------------------- 英語
rep('const EN_DICT={','const EN_DICT='+json.dumps(EN,ensure_ascii=False)[:-1]+',')
rep('const EN_TPL=[','const EN_TPL='+json.dumps(TP,ensure_ascii=False)[:-1]+',')
open(OUT,'w').write(s);print('ok')
