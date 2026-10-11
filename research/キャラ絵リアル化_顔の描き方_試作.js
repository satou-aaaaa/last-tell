/* 案2：顔のつくりを大人の比率にした描き方（見本用。ジン・レイカ・ミナ・ゲン） */
const REAL={
  'ジン':{rank:5,sex:'m',age:2,skin:'#d9b294',shade:'#7a4a3a',hair:'#d9d5cc',hairD:'#8c877e',brow:'#b8b2a6',iris:'#4a3a2a',lip:'#a8705e',
    cloth:'#2b2119',clothD:'#140f0b',shirt:'#d8cfbf',beard:1,scar:1,face:'m'},
  'レイカ':{rank:4,sex:'f',age:0,skin:'#ecd0bd',shade:'#8a5060',hair:'#17121c',hairD:'#050407',brow:'#231a24',iris:'#3a2418',lip:'#a3203a',
    cloth:'#5a1830',clothD:'#2a0a16',shirt:'#f2efe8',face:'f',feather:'#e2b65b'},
  'ミナ':{rank:2,sex:'f',age:0,skin:'#f2d8c6',shade:'#946070',hair:'#5a4a86',hairD:'#2c2148',brow:'#4a3c6a',iris:'#6a54a8',lip:'#c46a7a',
    cloth:'#2c2848',clothD:'#15132a',face:'r',cute:1},
  'ゲン':{rank:1,sex:'m',age:1,skin:'#e3b08c',shade:'#8a4a32',hair:'#3a2a1c',hairD:'#1c140c',brow:'#3a2a1c',iris:'#3a2a1c',lip:'#b0705a',
    cloth:'#3f6fae',clothD:'#1f3a62',face:'r',cute:1,grin:1,band:'#b8434f'},
  /* 描き直し（2026-10-09）ミナ：20代半ばの歌手、ややかわいい */
  'ミナA':{rank:2,sex:'f',age:0,skin:'#f5ddcc',shade:'#9a6476',hair:'#7a62c8',hairD:'#3e2f72',brow:'#5a4890',iris:'#7458c0',lip:'#d0707e',
    cloth:'#3e3878',clothD:'#211c4c',face:'o',cute:1,v:'A',ew:6.4,eh:4.9,ir:3.9,tilt:4,noWing:1,blush:.34,cy:47,cx:58.6},
  'ミナB':{rank:2,sex:'f',age:0,skin:'#f3dac8',shade:'#94607a',hair:'#8d6be0',hairD:'#45338a',brow:'#5a4890',iris:'#6e52b8',lip:'#c8667a',
    cloth:'#463c78',clothD:'#241e48',face:'s',cute:1,v:'B',ew:5.2,eh:3.3,ir:2.7,tilt:2,blush:.2},
  /* ゲン：50代の元漁師、赤ら顔、がっはっは */
  'ゲンA':{rank:1,sex:'m',age:1,skin:'#d99a72',shade:'#7a3a26',hair:'#4a3020',hairD:'#241810',brow:'#3a2618',iris:'#2e2016',lip:'#a85a48',
    cloth:'#4f8fe0',clothD:'#2a5590',face:'O',cute:1,grin:1,laugh:1,band:'#e8607e',neck:10,ruddy:.6,grey:1,v:'A',ew:6,eh:4.6,ir:3.6,blush:.7,cx:59.4,cy:47,chins:1},
  'ゲンB':{rank:1,sex:'m',age:1,skin:'#d6976e',shade:'#7a3a26',hair:'#4a3020',hairD:'#241810',brow:'#3a2618',iris:'#2e2016',lip:'#a85a48',
    cloth:'#4f8fe0',clothD:'#2a5590',face:'w',cute:1,laugh:1,band:'#e8607e',neck:9.4,ruddy:.45,mustache:1,stubble:1,grey:1,v:'B',ew:4.4,eh:2.6,ir:2.3,blush:.42},
  /* おちゃめ（ウインク＋いたずらっぽい口） */
  'ミナC':{rank:2,sex:'f',age:0,skin:'#f6dfce',shade:'#9a6476',hair:'#8a6ee0',hairD:'#45338a',brow:'#5a4890',iris:'#7458c0',lip:'#d6707e',
    cloth:'#3e3878',clothD:'#211c4c',face:'yf',cute:1,young:1,v:'A',ew:6.2,eh:4.7,ir:3.7,tilt:3,noWing:1,blush:.36,cy:46.6,cx:58.4,wink:1,tongue:1},
  'ゲンC':{rank:1,sex:'m',age:1,skin:'#dc9c72',shade:'#7a3a26',hair:'#4a3020',hairD:'#241810',brow:'#3a2618',iris:'#2e2016',lip:'#a85a48',
    cloth:'#4f8fe0',clothD:'#2a5590',face:'O',cute:1,laugh:1,band:'#ff6b8b',neck:10,ruddy:.6,grey:1,v:'A',ew:6,eh:4.6,ir:3.6,blush:.7,cx:59.4,cy:47,chins:1,wink:1,browUp:1},
  /* 老若男女の顔ぶれ */
  'ソウ':{rank:2,sex:'m',age:0,skin:'#f0d4c0',shade:'#8a5a5a',hair:'#5b4a8a',hairD:'#2e2448',brow:'#3e3260',iris:'#4a3a6a',lip:'#c07a72',
    cloth:'#7a2234',clothD:'#3e0f1a',shirt:'#f2efe8',face:'ym',cute:1,young:1,ew:5.4,eh:3.9,ir:3.1,cy:46.6,neck:5.4,blush:.25,nervous:1},
  'ハル':{rank:1,sex:'f',age:0,skin:'#f8e2d2',shade:'#a0647a',hair:'#ff9fbe',hairD:'#c8608a',brow:'#c86a8a',iris:'#d94f78',lip:'#e07a8a',
    cloth:'#ffd166',clothD:'#c8962e',face:'yf',cute:1,young:1,ew:6.4,eh:5,ir:3.9,cy:47,cx:58.6,neck:5,noWing:1,blush:.4},
  'ミサキ':{rank:2,sex:'f',age:0,skin:'#f3d8c4',shade:'#946068',hair:'#c0763a',hairD:'#7a4420',brow:'#8a5430',iris:'#a35a24',lip:'#cc6a6e',
    cloth:'#7fd1ff',clothD:'#3e8ab8',face:'yf',cute:1,young:1,ew:5.6,eh:3.9,ir:3.1,cy:46.4,neck:5.2,blush:.24,tilt:-2},
  'ケンジ':{rank:2,sex:'m',age:0,skin:'#ecc9b0',shade:'#7a4a46',hair:'#2b2d4a',hairD:'#15162a',brow:'#22243c',iris:'#2b2d4a',lip:'#b0726a',
    cloth:'#ff6b8b',clothD:'#b83a5a',tie:'#2b2d4a',face:'ym',cute:1,young:1,ew:5,eh:3.4,ir:2.8,cy:46.2,neck:6,blush:.15},
  '店主':{rank:1,sex:'f',age:2,skin:'#ecc8ae',shade:'#8a5048',hair:'#7a4330',hairD:'#4a2a1e',brow:'#6a3c2a',iris:'#7a4330',lip:'#c06a62',
    cloth:'#ffffff',clothD:'#c8c4bc',face:'s',cute:1,ew:5.2,eh:3.4,ir:2.8,neck:6,blush:.3,grey:1,warm:1},
};
const RFACE={
  yf:'M34.6 42 Q34.6 19.4 50 19 Q65.4 19.4 65.4 42 Q65.4 53 62 60.6 Q57 68.8 50 70 Q43 68.8 38 60.6 Q34.6 53 34.6 42Z',
  ym:'M34.2 41 Q34.2 19 50 18.6 Q65.8 19 65.8 41 Q65.8 52 63 59.6 Q58.6 68.4 50 70.4 Q41.4 68.4 37 59.6 Q34.2 52 34.2 41Z',
  m:'M34 40 Q34 18 50 17.5 Q66 18 66 40 Q66.5 50 64 58 Q61 67.5 54 72.6 Q50 74.8 46 72.6 Q39 67.5 36 58 Q33.5 50 34 40Z',
  f:'M34.6 40 Q34.6 18.5 50 18 Q65.4 18.5 65.4 40 Q65.4 51 62.4 59 Q57.6 68.6 50 73 Q42.4 68.6 37.6 59 Q34.6 51 34.6 40Z',
  s:'M33.8 41 Q33.8 18.6 50 18.2 Q66.2 18.6 66.2 41 Q66.2 53 62.6 61.4 Q57.8 70.4 50 72 Q42.2 70.4 37.4 61.4 Q33.8 53 33.8 41Z',
  w:'M31 42 Q31 18.4 50 17.8 Q69 18.4 69 42 Q69.8 54 67 62 Q62 71.4 50 72.4 Q38 71.4 33 62 Q30.2 54 31 42Z',
  O:'M28 46 Q28 21 50 20.4 Q72 21 72 46 Q72.6 59 67 66 Q60 72.6 50 72.8 Q40 72.6 33 66 Q27.4 59 28 46Z',
  o:'M31.4 44 Q31.4 20 50 19.4 Q68.6 20 68.6 44 Q69 57.6 63.6 65.6 Q57.8 72.4 50 72.8 Q42.2 72.4 36.4 65.6 Q31 57.6 31.4 44Z',
  r:'M33.2 42 Q33.2 19 50 18.5 Q66.8 19 66.8 42 Q66.8 55 62.4 63.4 Q57.4 71.6 50 72.6 Q42.6 71.6 37.6 63.4 Q33.2 55 33.2 42Z',
};
function realAvatar(name,mood,opts){
  const c=REAL[name];mood=mood||'normal';opts=opts||{};
  const id='r'+Math.random().toString(36).slice(2,8),F=RFACE[c.face],D='#120d10',SH=c.shade;
  const m=mood, cute=!!c.cute;
  /* ---- 目 ---- 右目を描いて左は鏡写し */
  const ew=c.ew??(cute?5.2:4.4), eh=c.eh??(cute?3.4:(c.sex==='f'?2.6:2.2)), ir=c.ir??(cute?2.7:2.05), cx=c.cx??58, cy=c.cy??45.4;
  const open={think:.85,worried:1.05,lose:.15,win:cute?.15:.8,confident:.8}[m]??1;
  const top=`M${cx-ew} ${cy+.2} Q${cx-.6} ${cy-eh*open*1.25} ${cx+ew} ${cy-.2}`;
  const bot=`Q${cx+.4} ${cy+eh*.8} ${cx-ew} ${cy+.2}`;
  let eye;
  if(open<.3||(c.grin&&m!=='worried'&&m!=='think')){
    // 笑って細くなった目
    eye=`<path d="M${cx-ew} ${cy+.6} Q${cx} ${cy-2.4} ${cx+ew} ${cy+.6}" fill="none" stroke="${D}" stroke-width="1.1" stroke-linecap="round"/>
      <path d="M${cx+ew+.4} ${cy+.4} l2 -.8 M${cx+ew+.4} ${cy+1.4} l2 .4" stroke="${SH}" stroke-width=".45" opacity=".6"/>`;
  }else{
    const gx=opts.gaze||0;
    eye=`<clipPath id="${id}e"><path d="${top} ${bot}Z"/></clipPath>
      <path d="${top} ${bot}Z" fill="#ece5dc"/>
      <g clip-path="url(#${id}e)"><g class="pupils">
        <circle cx="${cx+.2+gx}" cy="${cy-.1}" r="${ir}" fill="${c.iris}"/>
        <circle cx="${cx+.2+gx}" cy="${cy-.1}" r="${ir}" fill="url(#${id}ir)"/>
        <circle cx="${cx+.2+gx}" cy="${cy-.1}" r="${ir*.45}" fill="${D}"/>
        <circle cx="${cx+.9+gx}" cy="${cy-.9}" r="${cute?.9:.55}" fill="#fff" opacity=".95"/>
        ${cute?`<circle cx="${cx-.6+gx}" cy="${cy+.9}" r=".45" fill="#fff" opacity=".7"/>`:''}
      </g><path d="${top}" fill="none" stroke="${D}" stroke-opacity=".35" stroke-width="2.4"/></g>
      <path d="${top}" fill="none" stroke="${D}" stroke-width="${c.sex==='f'?1.3:1}" stroke-linecap="round"/>
      ${c.sex==='f'&&!c.noWing?`<path d="M${cx+ew-.4} ${cy-.4} l2.2 -1.4" stroke="${D}" stroke-width="1" stroke-linecap="round"/>`:''}
      <path d="M${cx-ew+.6} ${cy+.9} ${bot.replace('Q','Q')}" fill="none" stroke="${SH}" stroke-width=".45" opacity=".5"/>
      <path d="M${cx-ew+.6} ${cy-eh*open*.9-.9} Q${cx} ${cy-eh*open*1.6-1.4} ${cx+ew-.2} ${cy-eh*open*.8-.9}" fill="none" stroke="${SH}" stroke-width=".55" opacity="${eh>4||c.young?0:.55}"/>`;
  }
  /* ---- 眉 ---- */
  let bd0={normal:[0,0],think:[.8,-.8],confident:[.9,1],worried:[-1,-1.6],win:[-.4,0],lose:[.6,-1.2]}[m]||[0,0];
  const bd=(c.nervous&&m==='normal')?[-.8,-1.2]:bd0;
  const bth=c.sex==='f'?(cute?1:.8):(c.rank>=5?1.6:1.3), bo=Math.max(0,(eh-2.4)*1.3);
  const bw=Math.max(5,ew);const brow=`<path transform="translate(0 ${-bo})" d="M${cx-bw+.4} ${40.6+bd[0]} Q${cx} ${38.4-bd[1]*.4} ${cx+bw+.4} ${40.2+bd[1]} L${cx+bw+.2} ${40.2+bd[1]+bth*.5} Q${cx} ${38.8+bth-bd[1]*.4} ${cx-bw+.4} ${40.6+bd[0]+bth}Z" fill="${c.brow}"/>`;
  const side=`<g transform="rotate(${c.tilt||0} ${cx} ${cy})">${eye}</g>${brow}`;
  const winkSide=`<path d="M${cx-ew} ${cy+.4} Q${cx} ${cy-2.8} ${cx+ew} ${cy+.4}" fill="none" stroke="${D}" stroke-width="1.3" stroke-linecap="round"/><path d="M${cx+ew} ${cy+.4} l1.6 -1.2 M${cx+ew-.6} ${cy+1.2} l1.8 .2" stroke="${D}" stroke-width=".7" stroke-linecap="round"/><g transform="translate(0 1.2)">${brow}</g>`;
  const doWink=c.wink&&m==='normal';
  const eyes=`<g class="eyes">${c.browUp&&m==='normal'?side.replace(brow,`<g transform="translate(0 -1.6) rotate(-4 ${cx} 40)">${brow}</g>`):side}<g transform="translate(100 0) scale(-1 1)">${doWink?winkSide:side.replace(/id="${id}e"/,`id="${id}e2"`).replace(/url\(#${id}e\)/,`url(#${id}e2)`)}</g></g>`;
  /* ---- 口 ---- */
  const my=c.young?62.4:(c.sex==='f'?64.2:64.4);
  const mouthLine={normal:`M45.4 ${my} Q50 ${my+.6} 54.6 ${my}`,think:`M46.4 ${my+.3} Q50 ${my+.2} 53.8 ${my-.3}`,confident:`M45.4 ${my+.2} Q50 ${my+.8} 55 ${my-1}`,
    worried:`M46 ${my+.6} Q50 ${my-.2} 54 ${my+.6}`,win:`M44.6 ${my-.6} Q50 ${my+1.8} 55.4 ${my-.6}`,lose:`M46 ${my+.9} Q50 ${my-.1} 54 ${my+.9}`}[m];
  let mouth=`<path d="M45.6 ${my} Q47.6 ${my-1.5} 50 ${my-.8} Q52.4 ${my-1.5} 54.4 ${my} Q50 ${my+.3} 45.6 ${my}Z" fill="${c.lip}" opacity="${c.sex==='f'?1:.55}"/>
    <path d="M46.2 ${my+.3} Q50 ${my+3.2} 53.8 ${my+.3} Q50 ${my+1} 46.2 ${my+.3}Z" fill="${c.lip}" opacity="${c.sex==='f'?.85:.4}"/>
    ${c.sex==='f'?`<ellipse cx="50.8" cy="${my+1.5}" rx="1.4" ry=".45" fill="#fff" opacity=".35"/>`:''}
    <path d="${mouthLine}" fill="none" stroke="${D}" stroke-width=".8" stroke-linecap="round" opacity=".85"/>`;
  if(c.grin&&(m==='normal'||m==='win'||m==='confident'))mouth=`<path d="M44.4 ${my-1} Q50 ${my+5.4} 55.6 ${my-1} Q50 ${my+.4} 44.4 ${my-1}Z" fill="#5a2620"/><path d="M45.4 ${my-.6} Q50 ${my+.5} 54.6 ${my-.6} L54 ${my+.8} Q50 ${my+1.4} 46 ${my+.8}Z" fill="#f2ede4"/>`;
  if(c.laugh&&(m==='normal'||m==='win'||m==='confident'))mouth=`<path d="M42.6 ${my-1.6} Q50 ${my+8.4} 57.4 ${my-1.6} Q50 ${my-.2} 42.6 ${my-1.6}Z" fill="#4a1c18"/>
    <path d="M43.8 ${my-1.2} Q50 ${my+.2} 56.2 ${my-1.2} L55.4 ${my+.9} Q50 ${my+1.8} 44.6 ${my+.9}Z" fill="#f2ede4"/>
    <path d="M45.6 ${my+4} Q50 ${my+2.2} 54.4 ${my+4} Q50 ${my+6.6} 45.6 ${my+4}Z" fill="#c25a5a"/>
    <path d="M42.6 ${my-1.6} Q50 ${my-.2} 57.4 ${my-1.6}" fill="none" stroke="${D}" stroke-width=".7" opacity=".7"/>`;
  if(c.tongue&&m==='normal')mouth=`<path d="M46 ${my-.4} Q50.4 ${my+3.2} 54.6 ${my-.8} Q50.4 ${my+.8} 46 ${my-.4}Z" fill="#6a2a2a"/>
    <path d="M50.6 ${my+.9} Q51.8 ${my+3.6} 53.6 ${my+2.6} Q54.2 ${my+.8} 53.4 ${my+.2}Z" fill="#e0707a"/>
    <path d="M46 ${my-.4} Q50.4 ${my+1.2} 54.6 ${my-.8}" fill="none" stroke="${D}" stroke-width=".7" opacity=".7"/>`;
  /* ---- 鼻 ---- */
  const nose=`<path d="M51.2 44.5 Q52.4 51 53.6 55.6 L51.6 56.4 Q51 50.6 50.2 44.6Z" fill="${SH}" opacity=".22"/>
    <path d="M47 57.6 Q50 ${cute?59:59.6} 53.2 57.6" fill="none" stroke="${SH}" stroke-width=".7" opacity=".6"/>
    <ellipse cx="48.2" cy="57.7" rx=".9" ry=".45" fill="${D}" opacity=".45"/><ellipse cx="51.9" cy="57.7" rx=".9" ry=".45" fill="${D}" opacity=".45"/>
    <circle cx="49.6" cy="55.8" r="1" fill="#fff" opacity=".28"/>
    ${c.ruddy?`<ellipse cx="50" cy="56.4" rx="3" ry="2.2" fill="#d8404a" opacity="${c.ruddy}" filter="url(#${id}bl)"/>`:''}`;
  /* ---- しわ（年齢） ---- */
  let lines='';
  if(c.age>=1)lines+=`<path d="M45.8 58.6 Q43.4 61.6 44 66 M54.2 58.6 Q56.6 61.6 56 66" fill="none" stroke="${SH}" stroke-width=".6" opacity="${c.age>=2?.55:.35}"/>`;
  if(c.age>=2)lines+=`<path d="M41 28.6 Q50 27.4 59 28.6 M42.4 31.4 Q50 30.4 57.6 31.4" fill="none" stroke="${SH}" stroke-width=".5" opacity=".4"/>
    <path d="M38.4 48.4 Q42 50 45.6 48.4 M54.4 48.4 Q58 50 61.6 48.4" fill="none" stroke="${SH}" stroke-width=".5" opacity=".45"/>`;
  /* ---- 髪・服・飾り ---- */
  let hairBack='',hair='',body='',ex='',front='';
  const SUIT='M4 100 L10 84 Q26 74 50 73 Q74 74 90 84 L96 100Z';
  if(name==='ジン'){
    hairBack=`<path d="M33 44 Q30.5 16 50 14 Q69.5 16 67 44 L67.4 54 Q65.6 48 65.8 41 Q65 23 50 22 Q35 23 34.2 41 Q34.4 48 32.6 54Z" fill="${c.hairD}"/>`;
    hair=`<path d="M33.8 38 Q32.6 15 50 13.2 Q67.4 15 66.2 38 Q64 25 57 23 Q50 21.2 43 23 Q36 25 33.8 38Z" fill="${c.hair}"/>`;
    ex+=`<path d="M36.8 57 Q37.8 68 45.6 73.6 Q50 76 54.4 73.6 Q62.2 68 63.2 57 Q61.2 62.4 57.4 64.2 Q54 66.6 50 66.4 Q46 66.6 42.6 64.2 Q38.8 62.4 36.8 57Z" fill="${c.hair}" opacity=".92"/>
      <path d="M44.4 62.6 Q50 60.6 55.6 62.6 Q53 63.6 50 63 Q47 63.6 44.4 62.6Z" fill="${c.hair}"/>
      <path d="M36.8 57 Q37.8 68 45.6 73.6 Q50 76 54.4 73.6 Q62.2 68 63.2 57 Q61.2 62.4 57.4 64.2 Q54 66.6 50 66.4 Q46 66.6 42.6 64.2 Q38.8 62.4 36.8 57Z" fill="url(#${id}sd)" opacity=".7"/>`;
    body=`<path d="${SUIT}" fill="${c.cloth}"/><path d="M30 75 L42 100 L50 87 L58 100 L70 75 L60 74 L50 85 L40 74Z" fill="${c.shirt}"/>
      <path d="M30 75 L40 74 L38 100 L26 100Z M70 75 L60 74 L62 100 L74 100Z" fill="#3a2d22"/>`;
  }else if(name==='レイカ'){
    hairBack=`<path d="M32 42 Q29.6 13 50 12.4 Q70.4 13 68 42 L71.6 92 Q63 97 58.6 86 L41.4 86 Q37 97 28.4 92Z" fill="${c.hairD}"/>`;
    hair=`<path d="M33.6 46 Q31.6 15 50 14.4 Q68.4 15 66.6 42 Q63 26 54 23.6 Q47 30 41.4 37 Q37.6 43 33.6 46Z" fill="${c.hair}"/>
      <path d="M66.6 42 Q67.6 60 66 72 L63.4 70 Q65 58 64.2 44Z" fill="${c.hair}"/>`;
    ex+=`<circle cx="33.6" cy="56.4" r="1.3" fill="${c.feather}"/><circle cx="33.2" cy="56" r=".5" fill="#fff" opacity=".6"/>
      <g transform="translate(64 23) rotate(38)"><path d="M0 0 Q3.6 -8 .8 -16 Q-3.4 -8 0 0Z" fill="${c.feather}"/><path d="M0 0 L.6 -14.4" stroke="${D}" stroke-width=".4"/></g>`;
    body=`<path d="${SUIT}" fill="${c.cloth}"/><path d="M38 74 L50 91 L62 74 L58 73 L50 83 L42 73Z" fill="${c.shirt}"/><path d="M46 77 L50 79 L54 77 L54 81 L50 79.5 L46 81Z" fill="${D}"/>`;
  }else if(name==='ミナ'){
    hairBack=`<path d="M32.4 44 Q29.6 13.6 50 13 Q70.4 13.6 67.6 44 Q70 56 68.4 66 Q71 74 66 80 Q60 82 58 76 L42 76 Q40 82 34 80 Q29 74 31.6 66 Q30 56 32.4 44Z" fill="${c.hairD}"/>`;
    hair=`<path d="M33.4 44 Q31.4 15.4 50 14.6 Q68.6 15.4 66.6 44 Q64.6 34 60 30 Q58 34 54 34.6 Q55.6 30 54.4 27 Q49 33 41 34.4 Q43.4 31 44 28 Q37 33 33.4 44Z" fill="${c.hair}"/>`;
    ex+=`<path d="M60.6 22.2 l.9 2 l2.1 .3 l-1.6 1.4 l.4 2.1 l-1.8 -1.1 l-1.8 1.1 l.4 -2.1 l-1.6 -1.4 l2.1 -.3Z" fill="#cfd4e0"/>`;
    body=`<path d="${SUIT}" fill="${c.cloth}"/><path d="M40 74 Q50 80 60 74 L60 77 Q50 83 40 77Z" fill="${c.clothD}"/>`;
  }else if(name==='ゲン'){
    hairBack='';
    hair=`<path d="M33.8 40 Q33.6 18 50 17 Q66.4 18 66.2 40 Q63 30 50 29 Q37 30 33.8 40Z" fill="${c.hair}"/>
      <path d="M33.8 40 Q33.6 18 50 17 Q66.4 18 66.2 40 Q63 30 50 29 Q37 30 33.8 40Z" fill="url(#${id}buzz)" opacity=".22"/>`;
    ex+=`<path d="M33.2 35.4 Q50 26.4 66.8 35.4 L66.8 40.4 Q50 31.4 33.2 40.4Z" fill="${c.band}"/><path d="M33.2 37.6 Q50 28.8 66.8 37.6" fill="none" stroke="#000" stroke-opacity=".18" stroke-width=".5"/>
      <path d="M33.6 37 Q28.6 36 27.4 40.6 Q31 39.6 33.4 40Z" fill="${c.band}"/>`;
    body=`<path d="M10 100 Q14 82 50 80 Q86 82 90 100Z" fill="${c.cloth}"/><path d="M42 80.6 L50 90 L58 80.6" fill="none" stroke="${c.clothD}" stroke-width="1.2"/>
      <g transform="translate(64 91)" stroke="#d2a94e" stroke-width="1.2" fill="none" stroke-linecap="round"><circle cx="0" cy="-3" r="1.1"/><path d="M0 -1.8 V4 M-2.4 0 H2.4 M-3.2 2.4 Q0 5.6 3.2 2.4"/></g>`;
  }
  if(name.startsWith('ミナ')&&c.v){
    if(c.v==='A'){ // ゆるいウェーブのロング、ふんわり前髪、ステージの濃紺ドレス（ハイネック＋小さなきらめき）
      hairBack=`<path d="M32 44 Q29 13.4 50 12.8 Q71 13.4 68 44 Q72 52 69.4 60 Q73.6 68 70 76 Q73 84 66 90 Q60 92 58 84 L42 84 Q40 92 34 90 Q27 84 30 76 Q26.4 68 30.6 60 Q28 52 32 44Z" fill="${c.hairD}"/>`;
      hair=`<path d="M33 46 Q31 15 50 14.4 Q69 15 67 46 Q65.6 36 62 31 Q60 35.4 56.4 34.6 Q57.2 31.4 55.6 29.4 Q52 34 47 34.2 Q47.6 31.6 46.6 29.6 Q42 34.6 38.6 34 Q39.6 31 39.4 29.8 Q34.6 36 33 46Z" fill="${c.hair}"/>
        <path d="M33 46 Q32 56 34.6 64 Q31.6 58 31.4 50Z M67 46 Q68 56 65.4 64 Q68.4 58 68.6 50Z" fill="${c.hair}"/>`;
      ex+=`<circle cx="32.4" cy="57" r="1.1" fill="#d9dcf0"/><circle cx="67.6" cy="57" r="1.1" fill="#d9dcf0"/>`;
      body=`<path d="M8 100 L12 86 Q28 76 50 75 Q72 76 88 86 L92 100Z" fill="${c.cloth}"/><path d="M42 75.6 Q50 79 58 75.6 L58 79 Q50 82.6 42 79Z" fill="${c.clothD}"/>
        <g fill="#cfd4ff" opacity=".7"><circle cx="30" cy="90" r=".5"/><circle cx="38" cy="94" r=".4"/><circle cx="62" cy="91" r=".5"/><circle cx="70" cy="95" r=".4"/><circle cx="50" cy="96" r=".45"/><circle cx="22" cy="96" r=".35"/><circle cx="78" cy="92" r=".35"/></g>`;
    }else{ // 長いストレートを片側に流す、斜め前髪、小さな星の髪留め
      hairBack=`<path d="M32.4 44 Q29.6 13 50 12.6 Q70.4 13 67.6 44 L70 88 Q60 94 56 84 L44 84 Q40 92 31 86 L32.4 60Z" fill="${c.hairD}"/>`;
      hair=`<path d="M33.4 48 Q31.4 15 50 14.4 Q68.6 15 66.6 42 Q64 30 56 26 Q50 33 43 37 Q37 41 33.4 48Z" fill="${c.hair}"/>
        <path d="M33.4 48 Q30.6 64 33 80 L36.6 78 Q34.6 64 36 50Z" fill="${c.hair}"/>`;
      ex+=`<path d="M60.6 22.2 l.9 2 l2.1 .3 l-1.6 1.4 l.4 2.1 l-1.8 -1.1 l-1.8 1.1 l.4 -2.1 l-1.6 -1.4 l2.1 -.3Z" fill="#e2c26b"/>`;
      body=`<path d="M8 100 L12 86 Q28 76 50 75 Q72 76 88 86 L92 100Z" fill="${c.cloth}"/><path d="M40 75.4 L50 84 L60 75.4" fill="none" stroke="#8d6be0" stroke-width=".9" opacity=".7"/>`;
    }
  }
  if(name.startsWith('ゲン')&&c.v){
    // 短く刈った髪（白髪まじり）、ピンクの鉢巻き（横で結ぶ）、太い首、がっしりした肩、青いシャツ
    hair=`<path d="M31.6 40 Q31.4 17.6 50 16.6 Q68.6 17.6 68.4 40 Q65 29.4 50 28.4 Q35 29.4 31.6 40Z" fill="${c.hair}"/>
      <path d="M31.6 40 Q31.4 17.6 50 16.6 Q68.6 17.6 68.4 40 Q65 29.4 50 28.4 Q35 29.4 31.6 40Z" fill="url(#${id}grey)" opacity=".1"/>`;
    ex+=`<path d="M31 35.6 Q50 25.6 69 35.6 L69 41.4 Q50 31.4 31 41.4Z" fill="${c.band}"/><path d="M31 38.2 Q50 28.4 69 38.2" fill="none" stroke="#000" stroke-opacity=".18" stroke-width=".5"/>
      <path d="M68.6 36 Q73 33 76.4 35 Q74 37.6 69 39.6Z M69 38.4 Q74 40 75.6 44.6 Q71.6 43.6 68.8 41Z" fill="${c.band}"/><circle cx="69.6" cy="37.8" r="1.6" fill="${c.band}"/>`;
    if(c.face==='O'){hair+=`<path d="${hair.match(/d="([^"]*)"/)[1]}" fill="url(#${id}hr)"/>`;const W=t=>`<g transform="translate(50 0) scale(1.16 1) translate(-50 2.6)">${t}</g>`;hair=W(hair);ex=W(ex);}
    if(c.chins)ex+=`<path d="M41 75.6 Q50 79 59 75.6" fill="none" stroke="${SH}" stroke-width=".6" opacity=".5"/>`;
    if(c.stubble)ex+=`<path d="M36 58 Q38 70 50 73.6 Q62 70 64 58 Q60 66 50 67 Q40 66 36 58Z" fill="url(#${id}stub)" opacity=".5"/>`;
    if(c.mustache)ex+=`<path d="M43.6 61.8 Q50 59.6 56.4 61.8 Q54 63.2 50 62.4 Q46 63.2 43.6 61.8Z" fill="${c.hairD}" opacity=".85"/>`;
    body=`<path d="M2 100 Q6 80 50 78 Q94 80 98 100Z" fill="${c.cloth}"/><path d="M40 79 L50 90 L60 79" fill="none" stroke="${c.clothD}" stroke-width="1.4"/>
      <path d="M40 79 L50 90 L60 79 L58 78.4 L50 86.6 L42 78.4Z" fill="${c.skin}"/>
      <g transform="translate(66 91)" stroke="#d2a94e" stroke-width="1.2" fill="none" stroke-linecap="round"><circle cx="0" cy="-3" r="1.1"/><path d="M0 -1.8 V4 M-2.4 0 H2.4 M-3.2 2.4 Q0 5.6 3.2 2.4"/></g>`;
  }
  if(name==='ソウ'){ // 紫がかった短髪、少し跳ねた前髪、赤いディーラーベスト＋白シャツ＋蝶ネクタイ
    hair=`<path d="M33.4 42 Q32 16.6 50 15.8 Q68 16.6 66.6 42 Q65 32 61 28.6 L60 33 Q57 29 55.4 27.4 L54 32.4 Q50.6 28.2 48 27.6 L46.4 32.8 Q43.6 29 41 29 L40.4 34 Q36 35.6 33.4 42Z" fill="${c.hair}"/>`;
    body=`<path d="M10 100 L14 85 Q28 77 50 76 Q72 77 86 85 L90 100Z" fill="${c.shirt}"/><path d="M14 85 Q28 77 40 76.6 L46 100 L10 100Z M86 85 Q72 77 60 76.6 L54 100 L90 100Z" fill="${c.cloth}"/>
      <path d="M44 78.6 L50 81 L56 78.6 L56 83 L50 81.4 L44 83Z" fill="#111"/>`;
  }
  if(name==='ハル'){ // ピンクのボブ、ぱっつん前髪、白い髪留め、黄色の服
    hairBack=`<path d="M32.6 44 Q30.4 15 50 14.4 Q69.6 15 67.4 44 L68.6 64 Q66 68 60.6 66 L39.4 66 Q34 68 31.4 64Z" fill="${c.hairD}"/>`;
    hair=`<path d="M33.6 46 Q32 16.4 50 15.6 Q68 16.4 66.4 46 Q66 36 64.6 33.6 L35.4 33.6 Q34 36 33.6 46Z" fill="${c.hair}"/>
      <path d="M33.6 46 Q32.4 56 33.4 64 L37 64 Q35.6 54 36.4 44Z M66.4 46 Q67.6 56 66.6 64 L63 64 Q64.4 54 63.6 44Z" fill="${c.hair}"/>`;
    ex+=`<path d="M57 25 L65 28" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;
    body=`<path d="M12 100 Q16 82 50 79 Q84 82 88 100Z" fill="${c.cloth}"/><path d="M43 79.6 Q50 84 57 79.6" fill="none" stroke="${c.clothD}" stroke-width="1"/>`;
  }
  if(name==='ミサキ'){ // 栗色のロング、横分け、水色の服
    hairBack=`<path d="M32.4 44 Q29.6 13.4 50 12.8 Q70.4 13.4 67.6 44 L70.4 90 Q60 95 56 86 L44 86 Q40 95 29.6 90Z" fill="${c.hairD}"/>`;
    hair=`<path d="M33.4 46 Q31.6 15.4 50 14.6 Q68.4 15.4 66.6 44 Q64 26 44 24.6 Q38 30 36 40 Q34.6 42 33.4 46Z" fill="${c.hair}"/>
      <path d="M66.6 44 Q68 62 65 80 L62.6 78 Q65 62 63.8 46Z" fill="${c.hair}"/>`;
    body=`<path d="M10 100 Q14 82 50 79 Q86 82 90 100Z" fill="${c.cloth}"/><path d="M42 79.6 Q50 85 58 79.6" fill="none" stroke="${c.clothD}" stroke-width="1"/>`;
  }
  if(name==='ケンジ'){ // 紺の短髪、ピンクのシャツ、ゆるめたネクタイ
    hair=`<path d="M33.6 42 Q32.4 16.4 50 15.6 Q67.6 16.4 66.4 42 Q64 30 56 27.4 Q48 30.6 40 29.6 Q35.4 34 33.6 42Z" fill="${c.hair}"/>`;
    body=`<path d="M8 100 L12 85 Q28 77 50 76 Q72 77 88 85 L92 100Z" fill="${c.cloth}"/><path d="M41 76.6 L47 84 L50 80 L53 84 L59 76.6" fill="none" stroke="${c.clothD}" stroke-width="1.1"/>
      <path d="M49 82.4 L52 82.4 L53.6 96 L50.6 99 L48 96Z" fill="${c.tie}" transform="rotate(7 50 84)"/>`;
  }
  if(name==='店主'){ // 白髪まじりの茶色のおだんご、白いシャツにエプロン
    hair=`<path d="M33.8 42 Q32.6 16.4 50 15.6 Q67.4 16.4 66.2 42 Q64 30 54 27 Q50 26.4 46 27 Q36 30 33.8 42Z" fill="${c.hair}"/>
      <path d="M33.8 42 Q32.6 16.4 50 15.6 Q67.4 16.4 66.2 42 Q64 30 54 27 Q50 26.4 46 27 Q36 30 33.8 42Z" fill="url(#${id}grey)" opacity=".18"/>`;
    hairBack=`<circle cx="50" cy="14" r="5.6" fill="${c.hair}"/><circle cx="50" cy="14" r="5.6" fill="url(#${id}grey)" opacity=".15"/>`;
    body=`<path d="M8 100 L12 85 Q28 77 50 76 Q72 77 88 85 L92 100Z" fill="${c.cloth}"/><path d="M34 100 L36 86 Q50 89 64 86 L66 100Z" fill="#e88aa0"/>
      <path d="M42 77 L50 84 L58 77" fill="none" stroke="${c.clothD}" stroke-width="1"/>`;
  }
  if(c.scar)ex+=`<path d="M54.4 66.6 L58.6 72.2" stroke="#a5463a" stroke-width="1.5" stroke-linecap="round"/><path d="M55.2 69.6 L57.2 68.2 M56.4 71.4 L58.4 70" stroke="#8a3f36" stroke-width=".55" opacity=".8"/>`;
  if(c.grin||c.laugh||c.blush||m==='win')ex+=`<ellipse cx="39.4" cy="55.4" rx="${c.laugh?5:4}" ry="${c.laugh?3:2.2}" fill="#e0607a" opacity="${c.blush??(c.laugh?.5:cute?.35:.15)}" filter="url(#${id}bl)"/><ellipse cx="60.6" cy="55.4" rx="${c.laugh?5:4}" ry="${c.laugh?3:2.2}" fill="#e0607a" opacity="${c.blush??(c.laugh?.5:cute?.35:.15)}" filter="url(#${id}bl)"/>`;
  if(m==='worried')ex+=`<path class="" d="M64 34 q-2.4 4.2 0 5.4 q2.4 -1.2 0 -5.4Z" fill="#cfe8f5" opacity=".85"/>`;
  if(name==='ジン'&&opts.tell!=='strong')front+=jinHand(c,id,opts.handDark);
  const ears=c.face==='O'?`<path d="M29 45 Q24.6 43.6 24.6 50 Q25 57 29.4 58Z M71 45 Q75.4 43.6 75.4 50 Q75 57 70.6 58Z" fill="${c.skin}"/>`:(c.face==='w'||c.face==='o')?`<path d="M32 43 Q27.6 41.6 27.6 48 Q28 55 32.4 56Z M68 43 Q72.4 41.6 72.4 48 Q72 55 67.6 56Z" fill="${c.skin}"/>`:`<path d="M35 44 Q31.2 42.6 31 48 Q31.4 54 35.4 55.4Z M65 44 Q68.8 42.6 69 48 Q68.6 54 64.6 55.4Z" fill="${c.skin}"/>
    <path d="M34 46 Q32.6 47.6 33.6 51 M66 46 Q67.4 47.6 66.4 51" fill="none" stroke="${SH}" stroke-width=".6" opacity=".5"/>`;
  return `<svg class="av" viewBox="0 0 100 100" role="img" aria-label="${name}"><defs>
    <clipPath id="${id}f"><path d="${F}"/></clipPath>
    <radialGradient id="${id}ir" cx=".5" cy=".5" r=".5"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
    <linearGradient id="${id}sd" x1="0" x2="1"><stop offset=".45" stop-color="${SH}" stop-opacity="0"/><stop offset="1" stop-color="${SH}" stop-opacity=".75"/></linearGradient>
    <linearGradient id="${id}hs" x1="0" x2="1"><stop offset=".3" stop-color="${SH}" stop-opacity="0"/><stop offset="1" stop-color="${SH}" stop-opacity=".6"/></linearGradient>
    <linearGradient id="${id}hf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".5" stop-color="${SH}" stop-opacity=".05"/><stop offset="1" stop-color="${SH}" stop-opacity=".55"/></linearGradient>
    <linearGradient id="${id}nk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SH}" stop-opacity=".75"/><stop offset=".6" stop-color="${SH}" stop-opacity=".2"/></linearGradient>
    <radialGradient id="${id}fh" cx=".38" cy=".22" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}bd" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset=".5" stop-color="#000" stop-opacity=".15"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></linearGradient>
    <linearGradient id="${id}hr" x1=".2" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>
    <pattern id="${id}buzz" width="1" height="1" patternUnits="userSpaceOnUse"><circle cx=".5" cy=".5" r=".22" fill="#000"/></pattern>
    <pattern id="${id}grey" width="1.3" height="1.3" patternUnits="userSpaceOnUse"><circle cx=".4" cy=".4" r=".3" fill="#d8d4cc"/></pattern>
    <pattern id="${id}stub" width="1.1" height="1.1" patternUnits="userSpaceOnUse"><circle cx=".5" cy=".5" r=".22" fill="#2a1a12"/></pattern>
    <filter id="${id}bl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
    <filter id="${id}bl2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.8"/></filter>
  </defs>
  <g transform="translate(50 53.5) scale(1.16) translate(-50 -56)">
  ${hairBack}${hairBack?hairBack.replace(/fill="[^"]*"/,`fill="url(#${id}hr)"`):''}
  ${body}<path d="${body.match(/d="([^"]*)"/)[1]}" fill="url(#${id}bd)"/>
  ${(()=>{const w=c.neck||6.6,d=`M${50-w} 64 L${50-w} 80 Q50 84.6 ${50+w} 80 L${50+w} 64Z`;return `<path d="${d}" fill="${c.skin}"/><path d="${d}" fill="url(#${id}nk)"/>`})()}
  <g class="head">
    ${ears}
    <path d="${F}" fill="${c.skin}"/>
    <g clip-path="url(#${id}f)">
      <path d="${F}" fill="url(#${id}sd)"/>
      <rect x="0" y="0" width="100" height="100" fill="url(#${id}fh)"/>
      <ellipse cx="42" cy="44.6" rx="6.4" ry="3.4" fill="${SH}" opacity="${c.young?.1:.22}" filter="url(#${id}bl)"/>
      <ellipse cx="58" cy="44.6" rx="6.4" ry="3.4" fill="${SH}" opacity="${c.young?.12:.28}" filter="url(#${id}bl)"/>
      <ellipse cx="40" cy="55" rx="5" ry="3.4" fill="#e8806a" opacity="${cute?.22:.12}" filter="url(#${id}bl2)"/>
      <ellipse cx="60" cy="55" rx="5" ry="3.4" fill="#e8806a" opacity="${cute?.2:.1}" filter="url(#${id}bl2)"/>
      <ellipse cx="50" cy="${c.face==='r'?24:22}" rx="18" ry="6" fill="${SH}" opacity=".35" filter="url(#${id}bl2)"/>
    </g>
    ${c.young?`<g transform="translate(50 56) scale(.86) translate(-50 -57)" opacity=".85">${nose}</g>`:nose}${lines}${eyes}${mouth}${hair}${hair&&!hair.startsWith('<g')?`<path d="${hair.match(/d="([^"]*)"/)[1]}" fill="url(#${id}hr)"/>`:''}${ex}
  </g>${front}</g></svg>`;
}
