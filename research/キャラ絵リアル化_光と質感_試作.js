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
/* 案3 質感：髪の毛束（髪の形の中だけ）＋肌と服の細かい粒子 */
function fxTexture(svg,hairColors){
  const [open,inner0]=_inner(svg),id=_fid();let n=0,seed=7;
  const r=()=>(seed=(seed*9301+49297)%233280)/233280;
  const strandsIn=(d)=>{const cid=`${id}c${n++}`;let s='';
    for(let i=0;i<46;i++){const x0=38+r()*24,y0=8+r()*10,x1=16+r()*68,y1=30+r()*66,cxp=(x0+x1)/2+(r()-.5)*16,cyp=(y0+y1)/2-6;
      s+=`<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} Q${cxp.toFixed(1)} ${cyp.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}" stroke="${i%3?'#000':'#fff'}" stroke-opacity="${i%3?.22:.2}" stroke-width="${(.22+r()*.3).toFixed(2)}" fill="none"/>`;}
    return `<clipPath id="${cid}"><path d="${d}"/></clipPath><g clip-path="url(#${cid})">${s}</g>`;};
  let inner=inner0;
  (hairColors||[]).forEach(hc=>{inner=inner.replace(new RegExp(`(<path d="([^"]+)" fill="${hc}"[^>]*/>)`,'g'),(all,tag,d)=>tag+strandsIn(d));});
  return `${open}<defs>${_maskDefs(id)}
    <filter id="${id}n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -2 0 0 0 1.25"/></filter>
    <filter id="${id}n2" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".12 .8" numOctaves="2" seed="5"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -2.4 0 0 0 1.4"/></filter>
  </defs><g id="${id}a">${inner}</g>
  <g pointer-events="none">
    <rect width="100" height="100" mask="url(#${id}m)" filter="url(#${id}n)" opacity=".1"/>
  </g></svg>`;
}
/* 案5 階調塗り：太い輪郭線をやめて、光と影を段で区切った面で塗る */
function fxTone(svg){
  const s=svg.replace(/<(path|ellipse|circle|rect)\b([^>]*)>/g,(all,tag,attrs)=>{
    const f=(attrs.match(/fill="([^"]*)"/)||[])[1];
    if(!f||f==='none')return all;
    return `<${tag}${attrs.replace(/ stroke="[^"]*"| stroke-width="[^"]*"/g,'')}>`;
  });
  return fxLight(s,1.4,true);
}
