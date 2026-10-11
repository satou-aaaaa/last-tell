/* LAST TELL キャラ立ち絵（SVG）v2  2026-10-08
   shisho.html の CHARS / avatar / cuteAvatar / coolAvatar をこのファイルの中身で置き換えれば動く。
   - avatar(name, mood, opts) は今と同じく SVG 文字列を返す。opts は省略可。
   - mood: normal / think / confident / worried / win / lose
     （仕様書の ID thinking / troubled も受け付ける）
   - opts.tell: キャラ固有のテル
       ジン   'bluff'＝顎の傷に触る（ふだんの姿） / 'strong'＝触らない
       ハヤト 'strong'＝ジンと同じ静かな姿勢になる
       クロウ 'hidden'＝白い手袋の指先を直す（隠しテル）
   - 共通のテル（glance/sweat など）は今の CSS（.bust.cue-*）がそのまま効く。
     加えて .pupils（目線）と .t-sweat（汗）を置いたので、chars.css を足すと絵の中でも動く。
   - 依存：esc()（shisho.html にある）。defs は SVG ごとに持つので外の shadeHead/shadeBody は不要。 */

const CHARS={
  /* rank 1〜2：かわいい */
  'ゲン':{rank:1,hair:'#4a3020',style:'buzz',cloth:'#4f8fe0',band:'#ff6b8b',blush:1,mouth:'open',eyes:'grin',anchor:1},
  'ハル':{rank:1,hair:'#ff9fbe',style:'bob',cloth:'#ffd166',mouth:'smile',iris:'#d94f78',clip:'#ffffff'},
  '店主':{rank:1,hair:'#7a4330',style:'bun',cloth:'#ffffff',apron:1,mouth:'smile',iris:'#7a4330'},
  'タロウ':{rank:1,hair:'#4a3b2b',style:'buzz',cloth:'#ffc93c',mouth:'open',brow:'worry'},
  'ミナ':{rank:2,hair:'#8d6be0',style:'long',cloth:'#38305c',mouth:'smile',iris:'#8d6be0',star:1,lash:1},
  'ケンジ':{rank:2,hair:'#2b2d4a',style:'short',cloth:'#ff6b8b',mouth:'smile',tie:'#2b2d4a'},
  'ミサキ':{rank:2,hair:'#c0763a',style:'long',cloth:'#7fd1ff',mouth:'smile',iris:'#a35a24',lash:1},
  'ソウ':{rank:2,hair:'#5b4a8a',style:'short',cloth:'#7a2234',mouth:'smile',iris:'#5b4a8a',vest:1},
  'あなた':{rank:2,hair:'#ff9c5b',style:'spiky',cloth:'#2fb39a',mouth:'smile',iris:'#c2621f'},
  /* rank 3以上：かっこいい */
  'ロク':{rank:3,cool:'slick',hair:'#14151c',cloth:'#2a2c38',glow:'#e0344a',skin:'#e9cdb6',mustache:1,tie:'#7a1a26'},
  'セキ':{rank:4,cool:'gent',hair:'#b9bfd0',cloth:'#1b1d27',glow:'#7fc8ff',skin:'#ecd3c0',monocle:1,bow:'#3a4a6a'},
  'レイカ':{rank:4,cool:'lady',hair:'#1a1420',cloth:'#5a1830',glow:'#e2b65b',skin:'#f0d6c4',feather:1},
  'ハヤト':{rank:4,cool:'rebel',hair:'#101118',cloth:'#e9e6df',glow:'#a3243a',skin:'#e6c8b0',openShirt:1},
  'クロウ':{rank:5,cool:'crow',hair:'#0e0f14',cloth:'#121318',glow:'#c9d3e0',skin:'#ead2c2',gloves:1,tie:'#0b0c10',vest:'#1c1d24'},
  'ジン':{rank:5,cool:'master',hair:'#e9e6df',cloth:'#2b2119',glow:'#e2b65b',skin:'#e4c3a6',beard:1,scar:1},
};
CHARS['老人']=CHARS['ジン'];
const stars=n=>'★'.repeat(n)+'☆'.repeat(5-n);
const rankOf=name=>(CHARS[name]||{}).rank||2;
const MOOD_ALIAS={thinking:'think',troubled:'worried'};
function avatar(name,mood,opts){
  const c=CHARS[name]||CHARS['ケンジ'];mood=MOOD_ALIAS[mood]||mood||'normal';opts=opts||{};
  return c.cool?coolAvatar(name,c,mood,opts):cuteAvatar(name,c,mood,opts);
}
const _uid=()=>'c'+Math.random().toString(36).slice(2,8);
const SWEAT=(x,y,cls)=>`<path class="${cls||''}" d="M${x} ${y} q-4 7 0 9 q4 -2 0 -9Z" fill="#9fd8ff" stroke="#2b2d4a" stroke-width="1.2"/>`;
const _defs=id=>`<defs>
  <radialGradient id="${id}h" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/><stop offset=".75" stop-color="#000" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></radialGradient>
  <linearGradient id="${id}b" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".45" stop-color="#000" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>
  <linearGradient id="${id}s" x1="0" x2="1"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>
  <linearGradient id="${id}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>
  <filter id="${id}g" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>`;
/* 同じ形に陰影を重ねる */
const _shade=(svg,url,op)=>svg?svg.replace(/fill="[^"]*"/,`fill="url(#${url})"${op?` opacity="${op}"`:''}`).replace(/ stroke="[^"]*"| stroke-width="[^"]*"| stroke-linejoin="[^"]*"| stroke-linecap="[^"]*"/g,''):'';

/* ===== かわいい：rank 1 は頭が大きいちびキャラ、rank 2 は少し大人びる ===== */
function cuteAvatar(name,c,mood,opts){
  const id=_uid(),L='#2b2d4a',SK='#ffe2cc',r2=c.rank>=2;
  const sw=`stroke="${L}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"`;
  let back='',eyes='',ex='',mouth='',fx='';
  if(c.style==='long')back=`<path d="M20 50 Q18 16 50 14 Q82 16 80 50 L84 92 Q50 98 16 92Z" fill="${c.hair}" ${sw}/>`;
  if(c.style==='bob')back=`<path d="M20 50 Q18 16 50 14 Q82 16 80 50 L81 70 Q70 74 64 68 L36 68 Q30 74 19 70Z" fill="${c.hair}" ${sw}/>`;
  if(c.style==='bun')back=`<circle cx="50" cy="10" r="9" fill="${c.hair}" ${sw}/>`;
  const fringe={
    short:`<path d="M21 48 Q19 13 50 12 Q81 13 79 48 Q72 30 60 31 Q55 24 46 31 Q32 29 21 48Z" fill="${c.hair}" ${sw}/>`,
    long:`<path d="M21 50 Q20 14 50 13 Q80 14 79 50 Q68 32 50 28 Q38 38 21 50Z" fill="${c.hair}" ${sw}/>`,
    bob:`<path d="M21 50 Q20 14 50 13 Q80 14 79 50 Q64 38 48 30 Q36 40 21 50Z" fill="${c.hair}" ${sw}/>`,
    bun:`<path d="M21 46 Q21 15 50 15 Q79 15 79 46 Q66 28 50 27 Q34 28 21 46Z" fill="${c.hair}" ${sw}/>`,
    buzz:`<path d="M22 40 Q24 15 50 15 Q76 15 78 40 Q50 28 22 40Z" fill="${c.hair}" ${sw}/>`,
    spiky:`<path d="M20 48 L17 26 L30 30 L32 12 L44 25 L54 8 L59 25 L72 12 L70 30 L83 27 L79 48 Q64 32 50 34 Q36 32 20 48Z" fill="${c.hair}" ${sw}/>`,
  }[c.style];
  const iris=c.iris||L,ry=r2?6.4:7.4,iy=r2?5.2:6.2;
  const bigEyes=(dx,dy)=>`<g class="eyes"><ellipse cx="39" cy="54" rx="5.6" ry="${ry}" fill="#fff" stroke="${L}" stroke-width="1.8"/><ellipse cx="61" cy="54" rx="5.6" ry="${ry}" fill="#fff" stroke="${L}" stroke-width="1.8"/>
    <g class="pupils"><ellipse cx="${39+dx}" cy="${54+dy}" rx="4.6" ry="${iy}" fill="${iris}"/><ellipse cx="${61+dx}" cy="${54+dy}" rx="4.6" ry="${iy}" fill="${iris}"/>
    <circle cx="${41+dx}" cy="${51+dy}" r="2.2" fill="#fff"/><circle cx="${63+dx}" cy="${51+dy}" r="2.2" fill="#fff"/></g>
    ${c.lash?`<path d="M32.5 49 L35 46.5 M67.5 49 L65 46.5" ${sw} stroke-width="1.8"/>`:''}</g>`;
  const blushO=c.blush||mood==='win'?.95:.6;
  const browN=c.brow==='worry'?`<path d="M32 45 L45 42 M68 45 L55 42" ${sw} stroke-width="2"/>`:'';
  if(mood==='think'){eyes=bigEyes(1.6,-2);mouth=`<ellipse cx="52" cy="66" rx="2.6" ry="2" fill="#ff7a8a" ${sw}/>`;
    fx=`<text x="80" y="22" font-size="16" font-weight="900" fill="#e2b65b" stroke="${L}" stroke-width=".8">?</text>`}
  else if(mood==='confident'){eyes=bigEyes(0,0)+`<path d="M31 41 L46 46 M69 41 L54 46" ${sw} stroke-width="3"/>`;
    mouth=`<path d="M42 63 Q50 72 58 63Z" fill="#ff7a8a" ${sw}/>`;fx=`<path d="M82 30 l6 -6 M84 38 l8 -2 M80 22 l2 -8" stroke="#ff5f86" stroke-width="2.4" stroke-linecap="round"/>`}
  else if(mood==='worried'){eyes=bigEyes(0,1)+`<path d="M31 46 L45 41 M69 46 L55 41" ${sw}/>`;
    mouth=`<path d="M43 67 q3.5 -4 7 0 q3.5 4 7 0" fill="none" ${sw}/>`;fx=SWEAT(78,30)}
  else if(mood==='win'){eyes=`<g class="eyes"><path d="M32 56 Q39 46 46 56 M54 56 Q61 46 68 56" fill="none" ${sw} stroke-width="3"/></g>`;
    mouth=`<path d="M41 62 Q50 75 59 62Z" fill="#ff7a8a" ${sw}/>`;
    fx=`<path d="M12 22 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2Z M86 14 l1.6 4.4 l4.4 1.6 l-4.4 1.6 l-1.6 4.4 l-1.6 -4.4 l-4.4 -1.6 l4.4 -1.6Z" fill="#ffd34d" stroke="${L}" stroke-width="1"/>`}
  else if(mood==='lose'){eyes=`<g class="eyes"><path d="M33 52 Q39 58 45 52 M55 52 Q61 58 67 52" fill="none" ${sw} stroke-width="2.6"/></g>`;
    mouth=`<path d="M44 68 Q50 63 56 68" fill="none" ${sw}/>`;
    fx=`<path d="M37 58 q-3 8 0 12 q3 -4 0 -12Z M63 58 q-3 8 0 12 q3 -4 0 -12Z" fill="#9fd8ff" stroke="${L}" stroke-width="1"/>`}
  else{
    if(c.eyes==='grin')eyes=`<g class="eyes"><path d="M34 54 Q40 46 46 54 M54 54 Q60 46 66 54" fill="none" ${sw}/></g>`;
    else eyes=bigEyes(0,0)+browN;
    mouth={smile:`<path d="M46 66 Q50 69 54 66" fill="none" ${sw}/>`,open:`<path d="M44 64 Q50 73 56 64Z" fill="#ff7a8a" ${sw}/>`}[c.mouth];
  }
  ex+=`<ellipse cx="31" cy="63" rx="5" ry="2.8" fill="#ff9fb3" opacity="${blushO}"/><ellipse cx="69" cy="63" rx="5" ry="2.8" fill="#ff9fb3" opacity="${blushO}"/>`;
  if(c.band)ex+=`<path d="M21 38 Q50 27 79 38 L79 44 Q50 33 21 44Z" fill="${c.band}" ${sw}/>`;
  if(c.clip)ex+=`<path d="M64 26 L74 30" stroke="${c.clip}" stroke-width="3" stroke-linecap="round"/><path d="M64 26 L74 30" stroke="${L}" stroke-width="1" stroke-linecap="round" opacity=".4"/>`;
  if(c.star)ex+=`<path d="M70 24 l1.8 4 l4.3 .5 l-3.2 3 l.9 4.3 l-3.8 -2.2 l-3.8 2.2 l.9 -4.3 l-3.2 -3 l4.3 -.5Z" fill="#ffd34d" stroke="${L}" stroke-width="1"/>`;
  let body=`<path d="M24 100 Q26 82 50 81 Q74 82 76 100Z" fill="${c.cloth}" ${sw}/>`,deco='';
  if(c.apron)deco+=`<path d="M38 100 L39 87 Q50 90 61 87 L62 100Z" fill="#ffb3c6" ${sw}/>`;
  if(c.vest)deco+=`<path d="M44 82 L50 92 L56 82 L58 100 L42 100Z" fill="#f4f1ea" ${sw} stroke-width="1.6"/><path d="M45 85 L50 88 L55 85 L55 89 L50 87.5 L45 89Z" fill="#111" />`;
  if(c.tie)deco+=`<path d="M47 82 L53 82 L52.5 86 L55 97 L50 100 L45 97 L47.5 86Z" fill="${c.tie}" ${sw} stroke-width="1.4" transform="rotate(8 50 86)"/>`;
  if(c.anchor)deco+=`<g transform="translate(62 89)" stroke="#e2b65b" stroke-width="1.6" fill="none" stroke-linecap="round"><circle cx="0" cy="-3.5" r="1.4"/><path d="M0 -2 V5 M-3 0 H3 M-4 3 Q0 7 4 3"/></g>`;
  return`<svg class="av" viewBox="0 0 100 100" role="img" aria-label="${esc(name)}">${_defs(id)}${back}${_shade(back,id+'h')}${body}${_shade(body,id+'b')}${deco}
    <g class="head"><ellipse cx="18" cy="55" rx="4" ry="6" fill="${SK}" ${sw}/><ellipse cx="82" cy="55" rx="4" ry="6" fill="${SK}" ${sw}/>
    <ellipse cx="50" cy="50" rx="${r2?30:31}" ry="${r2?30.5:30}" fill="${SK}" ${sw}/><ellipse cx="50" cy="50" rx="${r2?30:31}" ry="${r2?30.5:30}" fill="url(#${id}h)"/>${fringe}${_shade(fringe,id+'h')}${eyes}${mouth}${ex}${fx}
    ${SWEAT(76,34,'t-sweat')}</g></svg>`;
}

/* ===== かっこいい：細い顔、鋭い目、強い陰影、縁の光。表情は静か。rank が上がるほど影が深い ===== */
function coolAvatar(name,c,mood,opts){
  const id=_uid(),D='#0b0c10',G=c.glow,SK=c.skin,deep=c.rank>=5?1:c.rank>=4?.8:.6;
  const ln=`stroke="${D}" stroke-width="1.5" stroke-linejoin="round"`;
  const tell=opts.tell||'';
  // ハヤトの「強い手」：ジンと同じ静かな顔に戻る
  const calm=name==='ハヤト'&&tell==='strong';
  let hairBack='',hair='',ex='',front='',body='',tilt='';
  const FACE='M30 40 Q30 20 51 19 Q71 20 71 40 L69 54 Q65 67 51 73 Q37 67 33 54Z';
  const SUIT='M4 100 L10 83 Q26 73 50 72 Q74 73 90 83 L96 100Z';
  body=`<path d="${SUIT}" fill="${c.cloth}" ${ln}/><path d="${SUIT}" fill="url(#${id}b)" opacity="${.7+deep*.3}"/>`;
  switch(c.cool){
  case 'master': // ジン：銀髪、あごひげ、顎の傷、古いジャケット
    hairBack=`<path d="M27 40 Q24 14 52 12 Q78 14 76 38 L80 60 L72 52 L74 70 L66 58 Z" fill="${c.hair}" ${ln}/>`;
    hair=`<path d="M28 38 Q30 16 54 15 Q74 17 74 34 Q64 24 50 26 L56 22 Q42 22 34 32 L38 26 Q30 30 28 38Z" fill="${c.hair}" ${ln}/>`;
    ex+=`<path d="M37 63 Q39 78 51 84 Q63 78 65 63 Q59 69 51 68 Q43 69 37 63Z" fill="${c.hair}" ${ln}/><path d="M37 63 Q39 78 51 84 Q63 78 65 63 Q59 69 51 68 Q43 69 37 63Z" fill="url(#${id}v)" opacity=".5"/>`;
    body+=`<path d="M30 74 L42 100 L50 86 L58 100 L70 74 L60 73 L50 84 L40 73Z" fill="#d8cfbf" ${ln}/><path d="M30 74 L40 73 L38 100 L26 100Z M70 74 L60 73 L62 100 L74 100Z" fill="#3a2d22" ${ln}/>`;
    break;
  case 'rebel': // ハヤト：黒髪、白シャツ、ジンの配色を反転
    hairBack=`<path d="M27 44 Q22 14 52 12 Q80 13 76 42 L78 56 L71 48Z" fill="${c.hair}" ${ln}/>`;
    hair=`<path d="M28 42 Q26 15 53 14 Q76 15 74 38 L70 30 L66 40 L62 27 L56 36 L52 26 L46 37 L42 28 L36 42 L34 34Z" fill="${c.hair}" ${ln}/>`;
    body=`<path d="${SUIT}" fill="${c.cloth}" ${ln}/><path d="${SUIT}" fill="url(#${id}b)"/>
      <path d="M36 73 L44 88 L50 80 L56 88 L64 73" fill="none" stroke="${D}" stroke-width="1.4"/>
      <path d="M44 73 L50 82 L56 73 L56 76 L50 86 L44 76Z" fill="${SK}"/><path d="M44 73 L50 82 L56 73" fill="none" stroke="${G}" stroke-width="1"/>`;
    if(!calm)tilt='rotate(-4 51 60)';
    break;
  case 'crow': // クロウ：黒髪＋銀の髪留め、スリーピース、白手袋、カラスの羽のタイピン
    hairBack=`<path d="M28 40 Q26 14 52 13 Q78 14 74 40 L74 50 L70 40Z" fill="${c.hair}" ${ln}/>`;
    hair=`<path d="M29 38 Q30 15 53 15 Q74 16 73 36 Q66 22 54 21 Q42 21 34 29 Q31 33 29 38Z" fill="${c.hair}" ${ln}/>
      <path d="M40 22 Q54 18 68 26" fill="none" stroke="#c9d3e0" stroke-width="1.1" opacity=".7"/>
      <rect x="64" y="25" width="9" height="2.6" rx="1" fill="#c9d3e0" transform="rotate(28 68 26)" ${ln} stroke-width=".6"/>`;
    body+=`<path d="M32 74 L50 100 L68 74 L58 73 L50 84 L42 73Z" fill="${c.vest}" ${ln}/>
      <path d="M42 73 L50 84 L58 73 L55 76 L50 80 L45 76Z" fill="#f2f0ea"/>
      <path d="M48.5 79 L51.5 79 L52.5 98 L50 100 L47.5 98Z" fill="${c.tie}" stroke="#2a2c38" stroke-width=".6"/>
      <path d="M45 88 Q50 86 56 88 Q52 89 50 91Z" fill="#c9d3e0"/>
      <path d="M32 74 L42 73 L36 100 L24 100Z M68 74 L58 73 L64 100 L76 100Z" fill="#0a0b0f" ${ln}/>`;
    break;
  case 'lady': // レイカ：黒髪、羽の髪飾り、ディーラー服
    hairBack=`<path d="M26 42 Q22 12 52 12 Q80 13 76 44 L82 92 L60 80 L40 80 L20 92Z" fill="${c.hair}" ${ln}/>`;
    hair=`<path d="M29 44 Q28 16 52 15 Q75 16 73 40 Q66 24 50 24 Q40 30 36 50 Q32 46 29 44Z" fill="${c.hair}" ${ln}/>`;
    ex+=`<circle cx="31" cy="60" r="2" fill="${G}"/><path d="M46.5 64.5 Q51 66.5 55 64.5" fill="none" stroke="#b0203a" stroke-width="2.2" stroke-linecap="round"/>`;
    ex+=`<g transform="translate(70 24) rotate(35)"><path d="M0 0 Q4 -9 1 -18 Q-4 -9 0 0Z" fill="${G}" stroke="${D}" stroke-width=".7"/><path d="M0 0 L.6 -16" stroke="${D}" stroke-width=".6"/></g>`;
    body+=`<path d="M38 73 L50 90 L62 73 L58 72 L50 82 L42 72Z" fill="#f2f0ea" ${ln}/><path d="M46 76 L50 78 L54 76 L54 80 L50 78.5 L46 80Z" fill="${D}"/>`;
    break;
  case 'gent': // セキ：銀髪、片眼鏡、蝶ネクタイ
    hair=`<path d="M29 40 Q28 16 52 15 Q74 16 73 38 Q70 26 60 24 Q46 22 38 28 Q34 32 29 40Z" fill="${c.hair}" ${ln}/><path d="M60 24 Q66 22 70 30" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.2"/>`;
    ex+=`<path d="M42 62 Q46 59 50 61 Q54 59 58 62 Q54 64 50 62.5 Q46 64 42 62Z" fill="${c.hair}" ${ln}/>`;
    ex+=`<circle cx="58" cy="48" r="6.5" fill="${G}" fill-opacity=".18" stroke="#d9dde8" stroke-width="1.6"/><path d="M64.5 49 Q67 62 63 76" fill="none" stroke="#d9dde8" stroke-width="1"/>`;
    body+=`<path d="M40 73 L50 84 L60 73 L56 72 L50 78 L44 72Z" fill="#f2f0ea" ${ln}/><path d="M43 76 L50 79 L57 76 L57 82 L50 79.5 L43 82Z" fill="${c.bow}" ${ln} stroke-width="1"/>`;
    break;
  default: // ロク：なでつけた黒髪、口ひげ
    hair=`<path d="M28 42 Q24 14 54 14 Q76 16 74 40 Q72 28 62 25 L44 26 Q34 30 28 42Z" fill="${c.hair}" ${ln}/><path d="M44 26 Q36 34 34 46 L30 40Z" fill="${c.hair}"/>`;
    ex+=`<path d="M41 62 L50 59.5 L59 62 L56 63.5 L50 61.5 L44 63.5Z" fill="${c.hair}"/>`;
    body+=`<path d="M40 73 L50 86 L60 73 L56 72 L50 79 L44 72Z" fill="#e8e4da" ${ln}/><path d="M48.6 78 L51.4 78 L52.4 97 L50 100 L47.6 97Z" fill="${c.tie}"/>`;
  }
  const m=calm?'normal':mood;
  const glowOp={think:.45,confident:1,win:1,worried:.7,lose:.25}[m]??.9;
  let brows={normal:'M33 42 L47 43.5 M67 42 L53 43.5',think:'M34 44 L47 45 M66 42.5 L53 45',confident:'M33 41 L47 44.5 M67 41 L53 44.5',
    worried:'M33 44 L47 41.5 M67 44 L53 41.5',win:'M33 42 L47 43.5 M67 42 L53 43.5',lose:'M34 45 L47 44 M66 45 L53 44'}[m]||'M33 42 L47 43.5 M67 42 L53 43.5';
  // ハヤトはふだん片眉を上げて見下ろす
  if(name==='ハヤト'&&!calm&&(m==='normal'||m==='confident'))brows='M33 40 L47 43.5 M67 43 L53 44.5';
  let eyes;
  if(m==='lose')eyes=`<g class="eyes"><path d="M36 48.5 L46 48 M54 48 L64 48.5" stroke="${D}" stroke-width="2"/></g>`;
  else eyes=`<g class="eyes"><path d="M35 47 L46 45.5 L45 49.5 L37 50Z M65 47 L54 45.5 L55 49.5 L63 50Z" fill="${D}"/>
    <g class="pupils"><path d="M40 46.6 L44 46.2 L43.6 49 L40.6 49.3Z M60 46.6 L56 46.2 L56.4 49 L59.4 49.3Z" fill="${G}" opacity="${glowOp}" ${m==='confident'||m==='win'?`filter="url(#${id}g)"`:''}/></g></g>`;
  eyes+=`<path d="${brows}" stroke="${D}" stroke-width="${c.rank>=5?2.8:2.5}" stroke-linecap="round"/>`;
  let mouth={confident:'M45 65 Q51 66.5 57 62.5',win:'M45 64.5 Q51 67 57 62',worried:'M47 64.5 Q51 66.5 55 64.5',lose:'M46 66 Q51 64 56 66'}[m]||'M46 64.5 L55 64';
  if(name==='ハヤト'&&!calm&&m!=='lose'&&m!=='worried')mouth='M45 64.5 Q50 65.5 57 61.5'; // 片方だけ上がる皮肉な口
  if(c.scar)ex+=`<path d="M54 66 L59 72.5" stroke="#b5463a" stroke-width="2.3" stroke-linecap="round"/><path d="M55 70 L57.5 68.2 M56.6 72 L59.2 70.2" stroke="#9a4a40" stroke-width=".9" opacity=".8"/>`;
  let fx='';
  if(m==='worried')fx=SWEAT(72,34);
  if(m==='win')fx=`<path d="M68 40 l1.4 3.6 l3.6 1.4 l-3.6 1.4 l-1.4 3.6 l-1.4 -3.6 l-3.6 -1.4 l3.6 -1.4Z" fill="${G}"/>`;

  /* キャラ固有のテル（手） */
  if(c.cool==='master'&&tell!=='strong'){ // ジン：ふだんは顎の傷を人差し指でなぞる。強い手のときだけ触らない
    front+=`<g class="t-hand"><g transform="translate(57.6 68.8) scale(1.45) translate(-57.6 -68.8)">
      <path d="M60 100 L82 100 L74 84 L64 86Z" fill="#3a2d22" ${ln}/>
      <path d="M64 86 Q60 82 61 78 L56.8 71 Q56 69.2 57.6 68.8 Q59.2 68.6 60.4 70.6 L63.6 75.4 Q65 73.2 68 74.4 Q72 76 74 84Z" fill="${SK}" ${ln} stroke-width="1.2"/>
      <path d="M64 86 Q60 82 61 78 L56.8 71 Q56 69.2 57.6 68.8 Q59.2 68.6 60.4 70.6 L63.6 75.4 Q65 73.2 68 74.4 Q72 76 74 84Z" fill="url(#${id}s)"/>
      <path d="M63.5 79 Q66 78.5 68 80 M65 82 Q67.5 81.5 69.6 83" fill="none" stroke="${D}" stroke-width=".8" opacity=".6"/></g></g>`;
  }
  if(c.gloves){ // クロウ：白い手袋。隠しテルでは指先を直す
    const hidden=tell==='hidden';
    front+=`<g class="t-glove"><g transform="translate(20 100) scale(1.4) translate(-20 -100)">
      <path d="M8 100 L16 86 L30 88 L28 100Z" fill="#0a0b0f" ${ln}/>
      <path d="M16 86 Q14 80 18 77 L30 74 Q34 74 34 77 L33 80 Q36 81 35 84 L30 88Z" fill="#f4f2ee" ${ln} stroke-width="1.1"/>
      <path d="M20 79 L31 76.5 M21 82 L32 80" stroke="#b9bcc6" stroke-width=".7"/>
      ${hidden?`<path d="M36 100 L44 90 L38 84 L30 92Z" fill="#0a0b0f" ${ln}/>
      <path d="M38 84 Q36 80 33.5 79.5 L33 77 Q32.4 75.4 34 75.2 L36 76 Q40 77 42 82 L44 90Z" fill="#f4f2ee" ${ln} stroke-width="1.1"/>
      <circle cx="33.6" cy="77" r="2.4" fill="none" stroke="${G}" stroke-width=".9" opacity=".9" filter="url(#${id}g)"/>`:''}</g></g>`;
  }
  /* 縁の光（リムライト）：あごの線と髪の外側。rank が高いほど強い */
  const rim=`<path d="M71 40 L69 54 Q65 67 51 73" fill="none" stroke="${G}" stroke-width="${1+deep*.6}" stroke-opacity="${.6+deep*.35}"/>`;
  const rimBody=`<path d="M90 83 L96 100" fill="none" stroke="${G}" stroke-width="1.4" stroke-opacity="${.4+deep*.4}"/>`;
  return`<svg class="av" viewBox="0 0 100 100" role="img" aria-label="${esc(name)}">${_defs(id)}
    ${hairBack}${_shade(hairBack,id+'h')}
    ${body}${rimBody}
    <path d="M44 62 L44 75 L50 80 L56 75 L56 62Z" fill="${SK}" ${ln}/><path d="M44 62 L44 75 L50 80 L56 75 L56 62Z" fill="url(#${id}v)"/>
    <g class="head"${tilt?` transform="${tilt}"`:''}>
    <path d="${FACE}" fill="${SK}" ${ln}/>
    <path d="${FACE}" fill="url(#${id}s)" opacity="${deep}"/>
    <path d="${FACE}" fill="url(#${id}h)" opacity=".8"/>
    <path d="M51 49 L49 58 L52 58.5" fill="none" stroke="${D}" stroke-width="1.2" stroke-opacity=".6"/>
    <path d="${mouth}" fill="none" stroke="${D}" stroke-width="1.6" stroke-linecap="round"/>
    ${eyes}${hair}${_shade(hair,id+'h')}${ex}${fx}${rim}
    ${SWEAT(72,32,'t-sweat')}</g>${front}
  </svg>`;
}
