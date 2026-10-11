import os,re,json,sys
os.chdir(os.path.dirname(os.path.abspath(__file__))+'/..')
SRC,OUT=sys.argv[1],sys.argv[2]
s=open(SRC).read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a);assert n==cnt,(a[:90],n);s=s.replace(a,b)
# キャラ絵リアル化（satou 2026-10-09 決定：research/キャラ絵リアル化_実装仕様.md）
# 案2 顔のつくりを大人に＋案1 光と影（fxLight）＋案4 生きている動き。ミナ・ゲンは案C（おちゃめ）、若いキャラは若く、ジンの手は描き直し版 A（光が当たる）。
# 試作の9人に、残りの全員（タロウ・あなた・テツ・ロク・セキ・ハヤト・クロウ・クロダ・カオル・ゴウ・若き日のジン）を同じ絵柄で足した。古い絵に戻るキャラはいない。
# 後の「多様なキャラ」パッチ用：REAL・realAvatar(name,mood,opts)・fxLight はこの名前のまま。genParts の1行は realAvatar の `if(c.scar)ex+=` の直前に入る。
FACES=r'''/* ジンの手（描き直し3回目）：軽く握った手の、人差し指の背（第二関節）で顎の傷をなでる。
   ローカル座標：拳の左上が (0,0)。幅14、高さ15。左が顔側、右下が手首。 */
function jinHand(c,id,dark){
  const SK=c.skin,SH=c.shade;
  const fist='M1.2 2.4 Q1.4 0 4.2 0 L10.6 .6 Q13.6 1 14 4 L14.2 10.6 Q14 14.4 10.4 15 L5 15 Q2 14.6 1.4 12 Q.2 11 .6 9.2 Q-.2 7.8 .6 6 Q-.2 4.2 1.2 2.4Z';
  // 指4本（上から人差し指・中指・薬指・小指）の第二〜第三関節の帯
  const bands=[[0,3.4],[3.4,6.9],[6.9,10.3],[10.3,13.4]];
  let f='';
  bands.forEach(([a,b],i)=>{
    const mid=(a+b)/2;
    f+=`<path d="M${1.2-(i===0?0:.3)} ${a+.5} Q${.2} ${mid} ${1.2} ${b-.3} L4.4 ${b-.4} Q3.6 ${mid} 4.4 ${a+.6}Z" fill="${SK}"/>`; // 折りたたんだ指先側（顔側）
    f+=`<path d="M${1.6} ${b} Q${5} ${b+.6} ${9.6} ${b-.2}" fill="none" stroke="${SH}" stroke-width=".45" opacity="${i<3?.55:0}"/>`; // 指の間のすき間
    f+=`<path d="M4.4 ${a+.6} Q3.6 ${mid} 4.4 ${b-.4}" fill="none" stroke="${SH}" stroke-width=".4" opacity=".45"/>`; // 第二関節のしわ
    f+=`<ellipse cx="${10.6+i*.25}" cy="${mid}" rx="1.3" ry="1.1" fill="#fff" opacity=".1"/>`; // 指の付け根の関節
  });
  const thumb='M13.6 11.4 Q10.6 10.2 7 11.6 Q5.4 12.4 5.6 13.6 Q6.2 14.6 8 14.2 Q11 13.6 14 14Z';
  const wrist='M6.4 14.4 Q5 19 4.4 24 L17.4 23 Q15.6 17 14.4 11.6Z';
  return `<g class="t-hand"><g transform="translate(53.6 67.4) rotate(-18) scale(1.02)">
    <path d="${wrist}" fill="${SK}"/><path d="${wrist}" fill="url(#${id}hs)"/>
    <path d="M2.6 23 L19.2 21.6 L23 40 L-1 40Z" fill="#3a2d22"/><path d="M3 22.4 L19 21 L19.3 23 L2.8 24.4Z" fill="${c.shirt}"/>
    <path d="${fist}" fill="${SK}"/>
    ${f}
    <path d="${fist}" fill="url(#${id}hf)"/>
    <path d="${thumb}" fill="${SK}"/><path d="${thumb}" fill="url(#${id}hf)" opacity=".6"/>
    <path d="M6.2 13 Q6.6 12.2 7.6 12.2 L7.6 13.6 Q6.6 13.8 6.2 13Z" fill="#f2d6c4" opacity=".8"/>
    <path d="M1.4 2.2 Q1.6 .4 4.2 .3" fill="none" stroke="#fff" stroke-width=".5" opacity=".35"/>
    ${dark?`<path d="${fist}" fill="#0b0708" opacity=".55"/><path d="${wrist}" fill="#0b0708" opacity=".6"/><path d="${thumb}" fill="#0b0708" opacity=".5"/>
      <path d="M1.2 2.4 Q1.4 0 4.2 0 L10.6 .6 Q13.6 1 14 4" fill="none" stroke="#e2b65b" stroke-width=".6" opacity=".8"/>`:''}
  </g></g>`;
}

/* 案1・3・5：今の絵（chars.js）に後から重ねる効果。案4：CSS で動かす */
const _inner=s=>{const a=s.indexOf('>')+1;return [s.slice(0,a),s.slice(a,s.lastIndexOf('</svg>'))]};
const _fid=()=>'x'+Math.random().toString(36).slice(2,8);
const _maskDefs=id=>`<filter id="${id}w"><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"/></filter>
    <mask id="${id}m" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><use href="#${id}a" filter="url(#${id}w)"/></mask>`;
/* 案1 光と影：上のランプ（暖色）＋光の反対側の影＋下からフェルトの緑の照り返し＋体は暗がりへ
   どれも「暗くする」重ね方なので、黒い髪や服が白っぽく浮かない。step=true で影を段で区切る（案5） */
function fxLight(svg,k,step){
  k=k??1;const [open,inner]=_inner(svg),id=_fid();
  const st=step?` filter="url(#${id}q)"`:'';
  return `${open}<defs>${_maskDefs(id)}
    <filter id="${id}q"><feComponentTransfer><feFuncA type="discrete" tableValues="0 0 .6 .6 .85"/></feComponentTransfer></filter>
    <radialGradient id="${id}s" cx=".26" cy=".45" r=".9" gradientTransform="translate(.26 .45) scale(1 2.2) translate(-.26 -.45)"><stop offset="${step?.44:.36}" stop-color="#160c1a" stop-opacity="0"/><stop offset="${step?.46:.66}" stop-color="#160c1a" stop-opacity="${.62*k}"/></radialGradient>
    <linearGradient id="${id}t" x1="0" y1="0" x2="0" y2="1"><stop offset=".15" stop-color="#ffe9cc" stop-opacity="0"/><stop offset=".55" stop-color="#ffe2bf" stop-opacity="${.9*k}"/><stop offset="1" stop-color="#d8b8a0" stop-opacity="${k}"/></linearGradient>
    <radialGradient id="${id}k" cx=".38" cy=".2" r=".3"><stop offset="0" stop-color="#fff2dc" stop-opacity="${.22*k}"/><stop offset="1" stop-color="#fff2dc" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#2f9a62" stop-opacity="${.16*k}"/><stop offset=".3" stop-color="#2f9a62" stop-opacity="0"/></linearGradient>
    <linearGradient id="${id}d" x1="0" y1="0" x2="0" y2="1"><stop offset=".74" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${.65*k}"/></linearGradient>
  </defs><g id="${id}a">${inner}</g>
  <g pointer-events="none">
    <rect width="100" height="100" mask="url(#${id}m)" fill="url(#${id}t)" style="mix-blend-mode:multiply"/>
    <rect width="100" height="100" mask="url(#${id}m)" fill="url(#${id}s)"${st} style="mix-blend-mode:multiply"/>
    ${step?'':`<rect width="100" height="100" mask="url(#${id}m)" fill="url(#${id}k)" style="mix-blend-mode:screen"/>`}
    <rect width="100" height="100" mask="url(#${id}m)" fill="url(#${id}g)" style="mix-blend-mode:screen"/>
    <rect width="100" height="100" mask="url(#${id}m)" fill="url(#${id}d)" style="mix-blend-mode:multiply"/>
  </g></svg>`;
}

/* 案2：顔のつくりを大人の比率にした描き方（見本用。ジン・レイカ・ミナ・ゲン） */
const REAL={
  'ジン':{rank:5,sex:'m',age:2,skin:'#d9b294',shade:'#7a4a3a',hair:'#d9d5cc',hairD:'#8c877e',brow:'#b8b2a6',iris:'#4a3a2a',lip:'#a8705e',
    cloth:'#2b2119',clothD:'#140f0b',shirt:'#d8cfbf',beard:1,scar:1,face:'m'},
  'レイカ':{rank:4,sex:'f',age:0,skin:'#ecd0bd',shade:'#8a5060',hair:'#17121c',hairD:'#050407',brow:'#231a24',iris:'#3a2418',lip:'#a3203a',
    cloth:'#5a1830',clothD:'#2a0a16',shirt:'#f2efe8',face:'f',feather:'#e2b65b'},
  /* 描き直し（2026-10-09）ミナ：20代半ばの歌手、ややかわいい */
  /* ゲン：50代の元漁師、赤ら顔、がっはっは */
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
  /* 2026-10-09 追加：残りの全員（同じ絵柄。年齢と★は仕様 §2 のとおり） */
  'タロウ':{rank:1,sex:'m',age:0,skin:'#efcfb6',shade:'#8a5a4a',hair:'#4a3b2b',hairD:'#2a2016',brow:'#3a2e22',iris:'#4a3b2b',lip:'#bf7a6e',
    cloth:'#ffc93c',clothD:'#c8962e',face:'ym',cute:1,young:1,ew:5.8,eh:4.4,ir:3.4,cy:46.8,neck:5.6,blush:.45,nervous:1},
  'あなた':{rank:2,sex:'m',age:0,skin:'#f0cfb6',shade:'#8a5446',hair:'#ff9c5b',hairD:'#b85e24',brow:'#a8561e',iris:'#c2621f',lip:'#c07a6e',
    cloth:'#2fb39a',clothD:'#1a7a68',shirt:'#f2efe8',face:'ym',cute:1,young:1,ew:5.4,eh:3.8,ir:3,cy:46.4,neck:5.8,blush:.2},
  'テツ':{rank:2,sex:'m',age:0,skin:'#e2b896',shade:'#7a4a36',hair:'#6b5a3a',hairD:'#3e321e',brow:'#4a3c24',iris:'#4a3a24',lip:'#b07462',
    cloth:'#7a8a5a',clothD:'#4a5634',shirt:'#e8e2d4',face:'r',cute:1,ew:5,eh:3.4,ir:2.8,neck:7,blush:.22,grin:1,stubble:1},
  'ロク':{rank:3,sex:'m',age:2,skin:'#e3c2a8',shade:'#6e4038',hair:'#14151c',hairD:'#07080b',brow:'#14151c',iris:'#2a2224',lip:'#9a6658',
    cloth:'#2a2c38',clothD:'#15161d',shirt:'#e8e4da',tie:'#7a1a26',glow:'#e0344a',face:'m',eh:2.2},
  'セキ':{rank:4,sex:'m',age:2,skin:'#e8cfbc',shade:'#7a5050',hair:'#b9bfd0',hairD:'#7a8092',brow:'#a8aec0',iris:'#4a5a6e',lip:'#a87068',
    cloth:'#1b1d27',clothD:'#0c0d12',shirt:'#f2f0ea',bow:'#3a4a6a',glow:'#7fc8ff',face:'s',eh:2.3},
  'ハヤト':{rank:4,sex:'m',age:0,skin:'#e2c2a8',shade:'#6e3e3a',hair:'#101118',hairD:'#050508',brow:'#14141c',iris:'#2a1a1c',lip:'#a06a5e',
    cloth:'#e9e6df',clothD:'#a8a49c',glow:'#a3243a',face:'s',eh:2.3,smirk:1},
  'クロウ':{rank:5,sex:'m',age:1,skin:'#e6cfc0',shade:'#5e4650',hair:'#0e0f14',hairD:'#040406',brow:'#101118',iris:'#3a4250',lip:'#9a6a66',
    cloth:'#121318',clothD:'#060609',shirt:'#f2f0ea',vest:'#1c1d24',tie:'#0b0c10',glow:'#c9d3e0',face:'f',eh:2.2,gloves:1},
  'クロダ':{rank:3,sex:'m',age:0,skin:'#e4c6ae',shade:'#6a4440',hair:'#16171d',hairD:'#08090c',brow:'#16171d',iris:'#2a2a30',lip:'#a06c60',
    cloth:'#0d0e12',clothD:'#050608',shirt:'#eceae4',tie:'#16171d',glow:'#9fd8ff',face:'m',eh:2.2,specs:'#3a4048'},
  'カオル':{rank:3,sex:'f',age:0,skin:'#efd3c0',shade:'#8a5466',hair:'#5a2b2b',hairD:'#2e1414',brow:'#4a2424',iris:'#4a2a2a',lip:'#a8405a',
    cloth:'#2b1830',clothD:'#140a18',glow:'#ff9fbe',face:'f',eh:2.5,noWing:0},
  'ゴウ':{rank:3,sex:'m',age:0,skin:'#dcb090',shade:'#6e3e2c',hair:'#3b2416',hairD:'#1e120a',brow:'#2e1c10',iris:'#3a2416',lip:'#9a5e4e',
    cloth:'#4a1d26',clothD:'#260c12',glow:'#ff8a3d',face:'w',eh:2.2,stubble:1,scowl:1,neck:8},
  '若き日のジン':{rank:5,sex:'m',age:1,skin:'#dfbb9c',shade:'#7a4a3a',hair:'#5b4b3c',hairD:'#2e251c',brow:'#4a3c30',iris:'#4a3a2a',lip:'#a8705e',
    cloth:'#1e1914',clothD:'#0e0b08',shirt:'#d8cfbf',scar:1,face:'m',stubble:1},
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
  const calm=!!c.smirk&&opts.tell==='strong',m=calm?'normal':mood, cute=!!c.cute;
  const smirk=!!c.smirk&&!calm&&m!=='lose'&&m!=='worried';
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
  const bd=(c.nervous&&m==='normal')?[-.8,-1.2]:(c.scowl&&(m==='normal'||m==='think'))?[1.5,-.2]:bd0;
  const bth=c.sex==='f'?(cute?1:.8):(c.rank>=5?1.6:1.3), bo=Math.max(0,(eh-2.4)*1.3);
  const bw=Math.max(5,ew);const brow=`<path transform="translate(0 ${-bo})" d="M${cx-bw+.4} ${40.6+bd[0]} Q${cx} ${38.4-bd[1]*.4} ${cx+bw+.4} ${40.2+bd[1]} L${cx+bw+.2} ${40.2+bd[1]+bth*.5} Q${cx} ${38.8+bth-bd[1]*.4} ${cx-bw+.4} ${40.6+bd[0]+bth}Z" fill="${c.brow}"/>`;
  const side=`<g transform="rotate(${c.tilt||0} ${cx} ${cy})">${eye}</g>${brow}`;
  const winkSide=`<path d="M${cx-ew} ${cy+.4} Q${cx} ${cy-2.8} ${cx+ew} ${cy+.4}" fill="none" stroke="${D}" stroke-width="1.3" stroke-linecap="round"/><path d="M${cx+ew} ${cy+.4} l1.6 -1.2 M${cx+ew-.6} ${cy+1.2} l1.8 .2" stroke="${D}" stroke-width=".7" stroke-linecap="round"/><g transform="translate(0 1.2)">${brow}</g>`;
  const doWink=c.wink&&m==='normal';
  const eyes=`<g class="eyes">${(c.browUp&&m==='normal')||(smirk&&(m==='normal'||m==='confident'))?side.replace(brow,`<g transform="translate(0 -1.6) rotate(-4 ${cx} 40)">${brow}</g>`):side}<g transform="translate(100 0) scale(-1 1)">${doWink?winkSide:side.replace(/id="${id}e"/,`id="${id}e2"`).replace(/url\(#${id}e\)/,`url(#${id}e2)`)}</g></g>`;
  /* ---- 口 ---- */
  const my=c.young?62.4:(c.sex==='f'?64.2:64.4);
  let mouthLine={normal:`M45.4 ${my} Q50 ${my+.6} 54.6 ${my}`,think:`M46.4 ${my+.3} Q50 ${my+.2} 53.8 ${my-.3}`,confident:`M45.4 ${my+.2} Q50 ${my+.8} 55 ${my-1}`,
    worried:`M46 ${my+.6} Q50 ${my-.2} 54 ${my+.6}`,win:`M44.6 ${my-.6} Q50 ${my+1.8} 55.4 ${my-.6}`,lose:`M46 ${my+.9} Q50 ${my-.1} 54 ${my+.9}`}[m];
  if(smirk&&m!=='win')mouthLine=`M45.4 ${my+.3} Q50 ${my+.8} 55.4 ${my-1.6}`;
  if(c.scowl&&m==='normal')mouthLine=`M45.6 ${my+.7} Q50 ${my-.3} 54.6 ${my+.5}`;
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
  /* テル用：口の端が上がる（smile）、口が動く（talk）。ふだんは見えない */
  const tmouth=`<path class="t-smile" d="M54.2 ${my+.2} Q55.8 ${my-.2} 56.8 ${my-1.9}" fill="none" stroke="${D}" stroke-width=".8" stroke-linecap="round" opacity="0"/>${cute?`<path class="t-smile" d="M45.8 ${my+.2} Q44.2 ${my-.2} 43.2 ${my-1.9}" fill="none" stroke="${D}" stroke-width=".8" stroke-linecap="round" opacity="0"/>`:''}<ellipse class="t-talk" cx="50" cy="${my+.9}" rx="2.8" ry="1.6" fill="#4a1c18" opacity="0"/>`;
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
  /* ---- 2026-10-09 追加：残りのキャラ（髪と服）。ここより下の1行（genParts）は後の「多様なキャラ」パッチが足す ---- */
  const BASE='M8 100 L12 85 Q28 77 50 76 Q72 77 88 85 L92 100Z';
  if(name==='タロウ'){ // 茶色の坊主頭、黄色のTシャツ、困り眉の心配性
    hair=`<path d="M33.4 42 Q32.4 16.4 50 15.6 Q67.6 16.4 66.6 42 Q65.6 33 62.4 30.4 Q60.6 33.4 57.6 32.6 Q57.4 30.4 55.8 29.4 Q52.4 32.6 48.6 32.4 Q48.8 30.4 47.8 29.4 Q44 32.8 40.6 32.4 Q41 30.6 40.6 29.8 Q35.6 34 33.4 42Z" fill="${c.hair}"/>`;
    body=`<path d="M12 100 Q16 82 50 79 Q84 82 88 100Z" fill="${c.cloth}"/><path d="M42.6 79.6 Q50 85.4 57.4 79.6" fill="none" stroke="${c.clothD}" stroke-width="1.3"/>`;
  }
  if(name==='あなた'){ // オレンジのツンツン頭、緑のジャケットに白いシャツ
    hairBack=`<path d="M37 22 L36.4 14.4 L42 17 L45 11.8 L49.8 15.8 L54.6 11.4 L57.4 16.4 L63.4 14 L63 22Z" fill="${c.hair}"/>`;
    hair=`<path d="M33.4 44 Q31.4 15.6 50 14.6 Q68.6 15.6 66.6 42 L65 34.6 L62.6 37.6 L61.6 30 L57.6 34.4 L55.6 27.6 L51.6 33 L49 26.8 L45.6 33 L42.6 28 L40.4 35 L37.6 31.4 L36.4 39 Q34.6 40.6 33.4 44Z" fill="${c.hair}"/>`;
    body=`<path d="${BASE}" fill="${c.cloth}"/><path d="M40 77 L44 100 L56 100 L60 77 Q50 81 40 77Z" fill="${c.shirt}"/>
      <path d="M40 77 L36 84 L44 100 M60 77 L64 84 L56 100" fill="none" stroke="${c.clothD}" stroke-width="1.2"/>`;
  }
  if(name==='テツ'){ // 短い髪、無精ひげ、オリーブの作業着
    hair=`<path d="M33.2 42 Q32.4 17.6 50 16.6 Q67.6 17.6 66.8 42 Q65 31 58 28.4 Q50 30.6 42 28.6 Q35.6 32 33.2 42Z" fill="${c.hair}"/>`;
    body=`<path d="${BASE}" fill="${c.cloth}"/><path d="M43 77 L50 86 L57 77Z" fill="${c.shirt}"/><path d="M40 77 L50 86 L60 77 L64 82 L50 90 L36 82Z" fill="${c.clothD}"/>
      <path d="M50 89 L50 100" stroke="#c8c4bc" stroke-width=".9"/><rect x="60" y="88" width="9" height="5" rx="1" fill="${c.clothD}"/>`;
  }
  if(name==='ロク'){ // なでつけた黒髪（こめかみに白髪）、口ひげ、濃いグレーのスーツ、赤いネクタイと赤いポケットチーフ
    hair=`<path d="M33.4 42 Q32.4 15.8 50 15 Q67.6 15.8 66.6 42 Q66 31 61.6 26.4 Q55 23 50 23.2 Q44 23 38.6 26.4 Q34.4 31 33.4 42Z" fill="${c.hair}"/>
      <path d="M38 27 Q44 19 56 18.4 M42 25 Q50 19.6 62 21.6 M46 23.6 Q54 20.6 64 25" fill="none" stroke="#4a4e60" stroke-width=".5" opacity=".7"/>
      <path d="M33.6 41 Q33.4 33 35.6 29.4 L36.8 39Z M66.4 41 Q66.6 33 64.4 29.4 L63.2 39Z" fill="#8a8c96" opacity=".75"/>`;
    ex+=`<path d="M43.2 61.6 Q50 59 56.8 61.6 Q55 63.4 50 62.4 Q45 63.4 43.2 61.6Z" fill="${c.hair}"/>`;
    body=`<path d="${SUIT}" fill="${c.cloth}"/><path d="M38 74 L50 89 L62 74 L57 73 L50 82 L43 73Z" fill="${c.shirt}"/><path d="M48.6 79.6 L51.4 79.6 L52.6 97 L50 100 L47.4 97Z" fill="${c.tie}"/>
      <path d="M38 74 L45 100 M62 74 L55 100" stroke="${c.clothD}" stroke-width="1.1"/><path d="M66 86 l6 -1.4 l-.6 2.6 l-5.2 .8Z" fill="${c.glow}" opacity=".9"/>`;
  }
  if(name==='セキ'){ // 七三の銀髪、白い口ひげ、片眼鏡（水色の反射）、紺黒のスーツに蝶ネクタイ
    hairBack=`<path d="M33 44 Q31.6 17 50 15.6 Q68.4 17 67 44 L67.4 50 Q66 46 65.6 42 L34.4 42 Q34 46 32.6 50Z" fill="${c.hairD}"/>`;
    hair=`<path d="M33.4 44 Q31.8 15.6 50 14.8 Q68.2 15.6 66.6 42 Q65 28 58 25.2 Q50 23.4 41 26 Q44.4 29.6 37.4 33.4 Q34.6 38 33.4 44Z" fill="${c.hair}"/>
      <path d="M41 26 Q47 21.4 58 22.6" fill="none" stroke="#fff" stroke-width=".7" opacity=".55"/>`;
    ex+=`<path d="M42.4 61.8 Q50 58.6 57.6 61.8 Q56 64.4 50 62.8 Q44 64.4 42.4 61.8Z" fill="${c.hair}"/>
      <circle cx="58" cy="${cy}" r="6.2" fill="${c.glow}" fill-opacity=".14" stroke="#d9dde8" stroke-width=".9"/>
      <path d="M53.6 41.8 Q56.4 40.4 59.6 41.2" fill="none" stroke="#fff" stroke-width=".6" opacity=".7"/>
      <path d="M64.2 46.6 Q67.8 60 63.6 76" fill="none" stroke="#d9dde8" stroke-width=".5" opacity=".8"/>`;
    body=`<path d="${SUIT}" fill="${c.cloth}"/><path d="M40 74 L50 85 L60 74 L56 73 L50 79 L44 73Z" fill="${c.shirt}"/>
      <path d="M43 76.4 L50 79.2 L57 76.4 L57 81.6 L50 79.6 L43 81.6Z" fill="${c.bow}"/><rect x="48.8" y="78.2" width="2.4" height="2.4" rx=".6" fill="${c.bow}"/>
      <path d="M40 74 L46 100 M60 74 L54 100" stroke="#000" stroke-opacity=".5" stroke-width="1"/>`;
  }
  if(name==='ハヤト'){ // ジンの配色を反転：乱れた黒髪、白いシャツの襟を開ける、暗い赤の光
    hairBack=`<path d="M32.6 44 Q30.2 15 50 13.6 Q69.8 15 67.4 44 L68.4 56 Q66.4 52 65.8 46 L34.2 46 Q33.6 52 31.6 56Z" fill="${c.hairD}"/>`;
    hair=`<path d="M33.2 44 Q31.4 15.4 50 14.6 Q68.6 15.4 66.8 42 L64.4 33 L62 38 L59.6 28.6 L55.6 34.4 L52.4 27.4 L48 34 L45 28.6 L41.6 35.6 L38.6 30.6 L36.4 38 Q34.6 40 33.2 44Z" fill="${c.hair}"/>`;
    body=`<path d="M6 100 L11 85 Q27 76 50 75 Q73 76 89 85 L94 100Z" fill="${c.cloth}"/>
      <path d="M44 75.4 L50 86 L56 75.4Z" fill="${c.skin}"/><path d="M44 75.4 L50 86 L56 75.4Z" fill="url(#${id}nk)"/>
      <path d="M37.6 75.8 L45 89 L50 82.4 L55 89 L62.4 75.8" fill="none" stroke="${c.clothD}" stroke-width="1.1"/>
      <path d="M44 75.4 L50 86 L56 75.4" fill="none" stroke="${c.glow}" stroke-width=".8" opacity=".85"/>`;
  }
  if(name==='クロウ'){ // 銀の髪留め、こめかみに白髪、黒のスリーピース、カラスの羽のタイピン。白い手袋は front で描く
    hairBack=`<path d="M33 44 Q31 15.4 50 14 Q69 15.4 67 44 L67.6 50 Q66.2 47 65.8 43 L34.2 43 Q33.8 47 32.4 50Z" fill="${c.hairD}"/>`;
    hair=`<path d="M33.6 42 Q32.4 15.4 50 14.6 Q67.6 15.4 66.4 40 Q64.6 27 55 23.6 Q46 22.8 40 26.6 Q35.2 31 33.6 42Z" fill="${c.hair}"/>
      <path d="M38.6 25 Q50 17.6 63.6 24.6" fill="none" stroke="${c.glow}" stroke-width=".6" opacity=".5"/>
      <path d="M33.8 41 Q33.6 34 35.4 30.6 L36.4 39Z M66.2 40 Q66.4 33 64.6 29.6 L63.6 38Z" fill="#6a6e7a" opacity=".6"/>`;
    ex+=`<rect x="58.6" y="21.4" width="8" height="2.2" rx=".9" fill="${c.glow}" transform="rotate(28 62.6 22.5)"/>`;
    body=`<path d="${SUIT}" fill="${c.cloth}"/><path d="M33 75 L50 100 L67 75 L58 74 L50 84 L42 74Z" fill="${c.vest}"/>
      <path d="M42 74 L50 84 L58 74 L55 76.6 L50 80.6 L45 76.6Z" fill="${c.shirt}"/><path d="M48.7 79.4 L51.3 79.4 L52.4 97 L50 99.6 L47.6 97Z" fill="${c.tie}" stroke="#2a2c38" stroke-width=".4"/>
      <path d="M45 88.6 Q50 86.2 56 88 Q52 89.2 50 91.2Z" fill="${c.glow}"/><path d="M33 75 L42 74 L36 100 L24 100Z M67 75 L58 74 L64 100 L76 100Z" fill="#08080b"/>`;
  }
  if(name==='クロダ'){ // 王冠のフロア：七三の黒髪、細い眼鏡、耳にイヤホン、黒いスーツ
    hair=`<path d="M33.4 43 Q31.8 15.6 50 14.8 Q68.2 15.6 66.6 42 Q65 28 58 25.2 Q50 23.4 41 26 Q44.4 29.6 37.4 33.4 Q34.6 38 33.4 43Z" fill="${c.hair}"/>
      <path d="M41 26 Q47 21.4 58 22.6" fill="none" stroke="#5a6070" stroke-width=".6" opacity=".7"/>`;
    ex+=`<g fill="#fff" fill-opacity=".05" stroke="${c.specs}" stroke-width=".7"><rect x="51.4" y="${cy-3.6}" width="13" height="7.2" rx="1.4"/><rect x="35.6" y="${cy-3.6}" width="13" height="7.2" rx="1.4"/></g>
      <path d="M48.6 ${cy-1} L51.4 ${cy-1} M35.6 ${cy-1.4} L34 ${cy-2.4} M64.4 ${cy-1.4} L66 ${cy-2.4}" stroke="${c.specs}" stroke-width=".6"/>
      <path d="M53.2 ${cy-2.6} l3.4 -.5" stroke="${c.glow}" stroke-width=".5" opacity=".8"/>
      <path d="M66.4 49.6 Q68.6 56 66.6 62 Q64.8 68 67 75" fill="none" stroke="#c8d0dc" stroke-width=".45" opacity=".8"/><circle cx="66" cy="49.4" r=".9" fill="#c8d0dc"/>`;
    body=`<path d="${SUIT}" fill="${c.cloth}"/><path d="M38 74 L50 89 L62 74 L57 73 L50 82 L43 73Z" fill="${c.shirt}"/><path d="M48.6 79.6 L51.4 79.6 L52.6 97 L50 100 L47.4 97Z" fill="${c.tie}"/>
      <path d="M38 74 L45 100 M62 74 L55 100" stroke="#000" stroke-opacity=".6" stroke-width="1.1"/><circle cx="67" cy="85" r="1" fill="${c.glow}"/>`;
  }
  if(name==='カオル'){ // 肩までのゆるいウェーブ、流した前髪、真珠の耳飾り、すみれ色のドレス
    hairBack=`<path d="M32.4 44 Q29.6 13.6 50 13 Q70.4 13.6 67.6 44 L69.6 66 Q70.4 72 64.6 71.4 L60 70 L40 70 L35.4 71.4 Q29.6 72 30.4 66Z" fill="${c.hairD}"/>`;
    hair=`<path d="M33.4 46 Q31.6 15.4 50 14.6 Q68.4 15.4 66.6 44 Q65 30 57 26 Q49 27 43 31 Q37.6 36 33.4 46Z" fill="${c.hair}"/>
      <path d="M66.6 44 Q68.4 54 66.2 62 Q68.4 58 69 50Z M33.4 46 Q31.6 54 33.8 62 Q31.4 58 31 50Z" fill="${c.hair}"/>`;
    ex+=`<circle cx="33.6" cy="57.4" r="1.2" fill="#f2e6ea"/><circle cx="66.4" cy="57.4" r="1.2" fill="#f2e6ea"/><circle cx="33.2" cy="57" r=".4" fill="#fff"/><circle cx="66" cy="57" r=".4" fill="#fff"/>`;
    body=`<path d="M8 100 L12 86 Q28 77 50 76 Q72 77 88 86 L92 100Z" fill="${c.cloth}"/><path d="M40 76.6 Q50 88 60 76.6Z" fill="${c.skin}"/><path d="M40 76.6 Q50 88 60 76.6Z" fill="url(#${id}nk)"/>
      <path d="M42.4 77.6 Q50 85 57.6 77.6" fill="none" stroke="${c.glow}" stroke-width=".5" opacity=".9"/><circle cx="50" cy="81.4" r=".9" fill="${c.glow}"/>`;
  }
  if(name==='ゴウ'){ // 盛った茶髪ともみあげ、無精ひげ、えんじのシャツの襟を開けて金の鎖
    hair=`<path d="M31.8 42 Q30.6 14.6 50 13 Q69.4 14.6 68.2 42 Q67 31 62.6 26.6 Q56 23.4 50 23.8 Q43 23.4 37.6 26.8 Q33 31 31.8 42Z" fill="${c.hair}"/>
      <path d="M36 26 Q38 13.4 52 12.2 Q64 12.6 65.4 22 Q60 17.6 51 18.2 Q42 19 36 26Z" fill="${c.hair}"/><path d="M40 21.6 Q48 15 60 16.4" fill="none" stroke="#7a5a40" stroke-width=".6" opacity=".7"/>`;
    body=`<path d="M2 100 Q6 80 50 78 Q94 80 98 100Z" fill="${c.cloth}"/><path d="M43 79 L50 88 L57 79Z" fill="${c.skin}"/><path d="M43 79 L50 88 L57 79Z" fill="url(#${id}nk)"/>
      <path d="M39.6 79 L45 90 L50 84.6 L55 90 L60.4 79" fill="none" stroke="${c.clothD}" stroke-width="1.2"/><path d="M43.6 80 Q50 89 56.4 80" fill="none" stroke="#d8b04e" stroke-width=".9"/>`;
  }
  if(name==='若き日のジン'){ // 15年前のジン：白髪の混じる前の茶色の髪、ひげはまだ無い。顎の傷はある
    hairBack=`<path d="M33 44 Q30.5 16 50 14 Q69.5 16 67 44 L67.4 54 Q65.6 48 65.8 41 Q65 23 50 22 Q35 23 34.2 41 Q34.4 48 32.6 54Z" fill="${c.hairD}"/>`;
    hair=`<path d="M33.8 38 Q32.6 15 50 13.2 Q67.4 15 66.2 38 Q64 25 57 23 Q50 21.2 43 23 Q36 25 33.8 38Z" fill="${c.hair}"/>
      <path d="M33.8 38 Q32.6 15 50 13.2 Q67.4 15 66.2 38 Q64 25 57 23 Q50 21.2 43 23 Q36 25 33.8 38Z" fill="url(#${id}grey)" opacity=".12"/>`;
    body=`<path d="${SUIT}" fill="${c.cloth}"/><path d="M30 75 L42 100 L50 87 L58 100 L70 75 L60 74 L50 85 L40 74Z" fill="${c.shirt}"/>
      <path d="M30 75 L40 74 L38 100 L26 100Z M70 75 L60 74 L62 100 L74 100Z" fill="#2a2119"/>`;
  }
  if(c.stubble&&!c.v)ex+=`<path d="${c.face==='w'?'M34.6 56 Q37 70 50 73.4 Q63 70 65.4 56 Q61 65.6 50 66.8 Q39 65.6 34.6 56Z':'M36 57 Q38 70 50 73.6 Q62 70 64 57 Q60 66 50 67 Q40 66 36 57Z'}" fill="url(#${id}stub)" opacity=".42"/>`;
  if(c.scar)ex+=`<path d="M54.4 66.6 L58.6 72.2" stroke="#a5463a" stroke-width="1.5" stroke-linecap="round"/><path d="M55.2 69.6 L57.2 68.2 M56.4 71.4 L58.4 70" stroke="#8a3f36" stroke-width=".55" opacity=".8"/>`;
  if(c.grin||c.laugh||c.blush||m==='win')ex+=`<ellipse cx="39.4" cy="55.4" rx="${c.laugh?5:4}" ry="${c.laugh?3:2.2}" fill="#e0607a" opacity="${c.blush??(c.laugh?.5:cute?.35:.15)}" filter="url(#${id}bl)"/><ellipse cx="60.6" cy="55.4" rx="${c.laugh?5:4}" ry="${c.laugh?3:2.2}" fill="#e0607a" opacity="${c.blush??(c.laugh?.5:cute?.35:.15)}" filter="url(#${id}bl)"/>`;
  if(m==='worried')ex+=`<path class="" d="M64 34 q-2.4 4.2 0 5.4 q2.4 -1.2 0 -5.4Z" fill="#cfe8f5" opacity=".85"/>`;
  if((name==='ジン'||name==='若き日のジン')&&opts.tell!=='strong')front+=jinHand(c,id,false);
  if(c.gloves)front+=crowGloves(c,id,opts.tell==='hidden');
  const ears=c.face==='O'?`<path d="M29 45 Q24.6 43.6 24.6 50 Q25 57 29.4 58Z M71 45 Q75.4 43.6 75.4 50 Q75 57 70.6 58Z" fill="${c.skin}"/>`:(c.face==='w'||c.face==='o')?`<path d="M32 43 Q27.6 41.6 27.6 48 Q28 55 32.4 56Z M68 43 Q72.4 41.6 72.4 48 Q72 55 67.6 56Z" fill="${c.skin}"/>`:`<path d="M35 44 Q31.2 42.6 31 48 Q31.4 54 35.4 55.4Z M65 44 Q68.8 42.6 69 48 Q68.6 54 64.6 55.4Z" fill="${c.skin}"/>
    <path d="M34 46 Q32.6 47.6 33.6 51 M66 46 Q67.4 47.6 66.4 51" fill="none" stroke="${SH}" stroke-width=".6" opacity=".5"/>`;
  return `<svg class="av real" viewBox="0 0 100 100" role="img" aria-label="${esc(opts.label||name)}"><defs>
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
  <g class="head"><g${smirk?' transform="rotate(-4 50 60)"':''}>
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
  ${SWEAT(64,34,'t-sweat')}${tmouth}</g></g>${front}</g></svg>`;
}
/* クロウの白い手袋（卓の上に置いた左手）。hidden=true（本当に迷ったとき）だけ、右手で左手の指先を直す */
function crowGloves(c,id,hidden){
  const W='#f4f2ee',L='#8a8c96';
  const g='M16 86 Q14 80 18 77 L30 74 Q34 74 34 77 L33 80 Q36 81 35 84 L30 88Z';
  const g2='M38 84 Q36 80 33.5 79.5 L33 77 Q32.4 75.4 34 75.2 L36 76 Q40 77 42 82 L44 90Z';
  return `<g class="t-glove"><g transform="translate(50 56) scale(.862) translate(-50 -53.5) translate(-4 15)"><g transform="translate(20 100) scale(1.4) translate(-20 -100)">
    <path d="M8 100 L16 86 L30 88 L28 100Z" fill="#0a0b0f"/><path d="M15.4 85.4 L30.6 87.4 L30.2 89 L14.6 87Z" fill="#dcdad4"/>
    <path d="${g}" fill="${W}"/><path d="${g}" fill="url(#${id}hf)"/><path d="${g}" fill="none" stroke="${L}" stroke-width=".35" opacity=".8"/>
    <path d="M20 79 L31 76.5 M21 82 L32 80 M21.6 84.6 L31.6 83" stroke="#b9bcc6" stroke-width=".45"/>
    <path d="M18.6 77.6 Q24 75.6 29.6 74.6" fill="none" stroke="#fff" stroke-width=".5" opacity=".8"/>
    ${hidden?`<path d="M36 100 L44 90 L38 84 L30 92Z" fill="#0a0b0f"/>
    <path d="${g2}" fill="${W}"/><path d="${g2}" fill="url(#${id}hf)"/><path d="${g2}" fill="none" stroke="${L}" stroke-width=".35" opacity=".8"/>
    <path d="M37 80.4 L40.6 84.4" stroke="#b9bcc6" stroke-width=".4"/>
    <circle cx="33.6" cy="77" r="2.2" fill="none" stroke="${c.glow}" stroke-width=".6" opacity=".9" filter="url(#${id}bl)"/>`:''}
  </g></g></g>`;
}
'''
# 1. avatar()：REAL にあるキャラは新しい絵（全員ある）。CHARS は★と名札の判定に残す
rep("""function avatar(name,mood,opts){
  const c=CHARS[name]||CHARS['ケンジ'];mood=MOOD_ALIAS[mood]||mood||'normal';opts=opts||{};
  return c.cool?coolAvatar(name,c,mood,opts):cuteAvatar(name,c,mood,opts);
}""","""function avatar(name,mood,opts){
  mood=MOOD_ALIAS[mood]||mood||'normal';opts=opts||{};
  const key=REAL_KEY[name]||name;           // ミナ→ミナC、ゲン→ゲンC、老人→ジン
  if(typeof REAL!=='undefined'&&REAL[key])return fxLight(realAvatar(key,mood,Object.assign({label:name},opts)));
  const c=CHARS[name]||CHARS['ケンジ'];       // REAL に無い名前だけ今の絵（今は該当なし）
  return c.cool?coolAvatar(name,c,mood,opts):cuteAvatar(name,c,mood,opts);
}
const REAL_KEY={'ミナ':'ミナC','ゲン':'ゲンC','老人':'ジン'};""")
# 2. 描き方の本体（ジンの手・光と影・REAL・RFACE・realAvatar・クロウの手袋）。今の絵（cute/coolAvatar）の後ろに置く
rep("\n/* ---------- テル（クセ）：rate=","\n/* ---------- キャラ絵リアル化（patch32） ---------- */\n"+FACES+"\n/* ---------- テル（クセ）：rate=")
# 3. CSS：生きている動き（会話の立ち絵だけ呼吸と首の揺れ。卓は今の .bust の呼吸・揺れをそのまま使う）、席アイコンはまばたきしない、テルの見え方
CSS="""
/* キャラ絵リアル化（patch32）：まばたきは卓と立ち絵だけ。テル（目線・口の端・口数・汗・固まる）は新しい顔でも見える */
.av.real .eyes{transform-origin:50% 60%;animation-name:none}
/* 新しい顔は少し小さく描かれるので、卓では顔を少し上げて名札で口元が隠れないようにする */
.bust .av.real{translate:0 -6%}
.bust .av.real .eyes,.portrait .av.real .eyes,.nava .av.real .eyes{animation-name:blink}
.bust:nth-child(4) .av.real .eyes{animation-delay:-2.6s}.bust:nth-child(5) .av.real .eyes{animation-delay:-4.1s}.bust:nth-child(6) .av.real .eyes{animation-delay:-.7s}
.portrait .av.real{animation:rBreathe 4.2s ease-in-out infinite}
.portrait .av.real .head{transform-box:view-box;transform-origin:50% 80%;animation:rSway 7.5s ease-in-out infinite}
@keyframes rBreathe{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.2%)}}
@keyframes rSway{0%,100%{transform:rotate(0)}30%{transform:rotate(.9deg)}70%{transform:rotate(-.7deg)}}
.bust.cue-glance .av.real .pupils{animation:rGlance 1.6s ease-in-out}
@keyframes rGlance{0%,100%{transform:none}25%,70%{transform:translateY(1.7px)}}
.bust.cue-still .av.real .eyes{animation:none}
.bust.cue-smile .av .t-smile{opacity:1}
.bust.cue-talk .av .t-talk{animation:rTalk .3s linear 5}
@keyframes rTalk{0%,49%{opacity:1}50%,100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.bust .av.real .eyes,.portrait .av.real .eyes,.nava .av.real .eyes,.portrait .av.real,.portrait .av.real .head,.bust.cue-glance .av.real .pupils{animation:none}
  .bust.cue-talk .av .t-talk{animation:none;opacity:1}}
"""
A="@media (prefers-reduced-motion:reduce){.av .t-sweat,.av .pupils,.av .t-hand{animation:none}}\n"
rep(A,A+CSS)
# 4. カメラの寄り先：新しい顔の汗の位置（額の右横）
rep("const CAM_SPOT={sweat:{dx:.08,dy:-.28},smile:{dx:0,dy:.2},talk:{dx:0,dy:.2},stare:{dx:0,dy:-.04},","const CAM_SPOT={sweat:{dx:.15,dy:-.18},smile:{dx:0,dy:.14},talk:{dx:0,dy:.14},stare:{dx:0,dy:-.1},")
rep("scar:{dx:.06,dy:.22},release:{dx:.06,dy:.22}};","scar:{dx:.06,dy:.16},release:{dx:.06,dy:.16}};")
open(OUT,'w').write(s);print('ok')
