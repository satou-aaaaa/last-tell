/* キャラ造形の作りこみ（PC向け・試作 2026-10-22）
   realAvatar() が作った SVG の文字列に、あとから細部を書き足す。今の絵の形・テルの部品（.pupils .t-smile .t-hand など）は変えない。
   ぼかしフィルタは使わない（重さ対策）。やわらかい陰はすべて放射グラデーションで描く。
   f = {face, hair, cloth, lid}  … 案1 顔の彫り / 案2 髪の毛束 / 案3 服の生地 / 案4 まぶたで閉じるまばたき */
(function(){
const num=s=>(s.match(/-?\d*\.?\d+/g)||[]).map(Number);
const bbox=d=>{const n=num(d);let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(let i=0;i+1<n.length;i+=2){x0=Math.min(x0,n[i]);x1=Math.max(x1,n[i]);y0=Math.min(y0,n[i+1]);y1=Math.max(y1,n[i+1])}return{x0,y0,x1,y1}};
const hex=h=>{h=h.replace('#','');if(h.length===3)h=h.split('').map(x=>x+x).join('');return[0,2,4].map(i=>parseInt(h.slice(i,i+2),16))};
const mix=(a,b,t)=>{const A=hex(a),B=hex(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')};
const rnd=seed=>()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const hash=s=>{let h=7;for(const ch of s)h=(h*31+ch.charCodeAt(0))>>>0;return h};

/* 共通のグラデーション（1枚の SVG に1組） */
const defs=(id,c)=>`<radialGradient id="${id}Dk"><stop offset="0" stop-color="${c.shade}" stop-opacity="1"/><stop offset="1" stop-color="${c.shade}" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}Lt"><stop offset="0" stop-color="#fff6ea" stop-opacity="1"/><stop offset="1" stop-color="#fff6ea" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}Rd"><stop offset="0" stop-color="#d8505a" stop-opacity="1"/><stop offset="1" stop-color="#d8505a" stop-opacity="0"/></radialGradient>
<pattern id="${id}Pr" width="1.7" height="1.5" patternUnits="userSpaceOnUse"><circle cx=".4" cy=".5" r=".16" fill="${c.shade}"/><circle cx="1.2" cy="1.2" r=".12" fill="#fff"/></pattern>
<pattern id="${id}Wv" width="1.2" height="1.2" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="1.2" height=".38" fill="#fff"/></pattern>
<pattern id="${id}Wv2" width="1.2" height="1.2" patternUnits="userSpaceOnUse" patternTransform="rotate(-55)"><rect width="1.2" height=".3" fill="#000"/></pattern>`;
const soft=(id,k,x,y,rx,ry,op)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#${id}${k})" opacity="${op}"/>`;

/* 案1 顔の彫り：こめかみ・頬骨・目のくぼみ・鼻筋・人中・あごの下・肌のきめ。光は左上（fxLight と同じ向き） */
function faceLayer(id,c){
  const f=c.sex==='f',y=!!c.young,old=(c.age||0)>=2,cut=c.cute;
  let s='';
  s+=soft(id,'Dk',35.5,37,4,7,.32)+soft(id,'Dk',64.5,37,4,7,.42);                  // こめかみ
  s+=soft(id,'Dk',46.6,46.6,2.2,2.6,.32)+soft(id,'Dk',53.4,46.6,2.2,2.6,.36);        // 目頭のくぼみ
  s+=soft(id,'Dk',42,42.6,6.4,2.6,.22)+soft(id,'Dk',58,42.6,6.4,2.6,.26);            // まぶたの上のくぼみ
  s+=soft(id,'Lt',40.4,50.6,5.4,2.6,f?.2:.16)+soft(id,'Lt',59.6,50.6,4.6,2.4,.1);    // 頬骨の光
  if(!y&&!cut)s+=soft(id,'Dk',38.6,57,3.6,4.8,.2)+soft(id,'Dk',61.6,57,3.6,4.8,.34); // 頬骨の下の影
  s+=`<path d="M50.3 43.6 Q50.6 49 50.9 54.4" fill="none" stroke="#fff6ea" stroke-width=".9" stroke-linecap="round" opacity=".16"/>`; // 鼻筋の光
  s+=soft(id,'Dk',52.6,56.8,2.6,1.6,.32);                                            // 鼻の右下の影
  // 人中の線は大きく出すと「線」に見えるので入れない
  s+=soft(id,'Dk',50,67.4,4.2,1.5,.3)+soft(id,'Lt',49.4,70.2,2.8,1.3,.16);           // 下唇の下の影・あごの光
  s+=soft(id,'Dk',50,74,12,3.4,.36);                                                 // あごの下（首へ落ちる影）
  if(!cut)s+=soft(id,'Rd',41,55,4,2.4,f?.08:.04)+soft(id,'Rd',59,55,4,2.4,f?.07:.03); // 血色
  if(old)s+=`<path d="M40.6 51.4 Q42.6 53 45 52.4 M59.4 51.4 Q57.4 53 55 52.4" fill="none" stroke="${c.shade}" stroke-width=".4" opacity=".35"/>`; // 目の下のたるみ
  s+=`<rect width="100" height="100" fill="url(#${id}Pr)" opacity="${y||cut?.04:.07}"/>`; // 肌のきめ
  return s;
}
/* 案1 目：虹彩のすじ・ふちの濃い輪・2つめの光・下まつげ・上まぶたの厚み */
function irisDetail(id,cx,cy,r,c){
  const R=rnd(hash(id+cx));let s=`<circle cx="${cx}" cy="${cy}" r="${(r-.12).toFixed(2)}" fill="none" stroke="#000" stroke-width=".28" opacity=".55"/>`;
  const lt=mix(c.iris||'#443322','#ffffff',.45);
  let d='';for(let i=0;i<14;i++){const a=i/14*Math.PI*2+R()*.2,r0=r*.48,r1=r*(.82+R()*.12);
    d+=`M${(cx+Math.cos(a)*r0).toFixed(2)} ${(cy+Math.sin(a)*r0).toFixed(2)}L${(cx+Math.cos(a)*r1).toFixed(2)} ${(cy+Math.sin(a)*r1).toFixed(2)}`}
  s+=`<path d="${d}" stroke="${lt}" stroke-width=".14" opacity=".55"/>`;
  s+=`<circle cx="${(cx-r*.42).toFixed(2)}" cy="${(cy+r*.4).toFixed(2)}" r="${(r*.16).toFixed(2)}" fill="#fff" opacity=".35"/>`;
  return s;
}
/* 案2 髪：毛束のすじ（明・暗）・つやの帯・生え際のうぶ毛 */
function hairLayer(id,k,d,c){
  const b=bbox(d),R=rnd(hash(d)),w=b.x1-b.x0,h=b.y1-b.y0;if(w<6||h<6)return'';
  const lt=mix(c.hair,'#ffffff',.42),dk=mix(c.hairD||c.hair,'#000000',.35),top=b.y0+1;
  const crownX=50+(R()-.5)*4;let s=`<clipPath id="${id}hc${k}"><path d="${d}"/></clipPath><g clip-path="url(#${id}hc${k})">`;
  const n=Math.round(Math.min(46,w*1.6));
  // すじは色ごとに1本のパスにまとめる（要素の数を減らして描き直しを軽くする）
  let L='',K='';
  for(let i=0;i<n;i++){const t=i/(n-1),x=b.x0-2+t*(w+4)+(R()-.5)*1.6;
    const sx=crownX+(x-crownX)*.3+(R()-.5)*2,sy=top+R()*h*.12,ey=top+h*(.55+R()*.55);
    const seg=`M${sx.toFixed(1)} ${sy.toFixed(1)}Q${(sx+(x-sx)*.75).toFixed(1)} ${(top+h*.3).toFixed(1)} ${x.toFixed(1)} ${ey.toFixed(1)}`;
    if(i%3===0)K+=seg;else L+=seg}
  s+=`<path d="${L}" fill="none" stroke="${lt}" stroke-width=".3" stroke-linecap="round" opacity=".26"/><path d="${K}" fill="none" stroke="${dk}" stroke-width=".5" stroke-linecap="round" opacity=".36"/>`;
  // つやの帯（頭の丸みに沿った弧）
  s+=`<path d="M${b.x0+w*.12} ${top+h*.32} Q${b.x0+w*.42} ${top+h*.12} ${b.x0+w*.7} ${top+h*.26}" fill="none" stroke="${lt}" stroke-width="3.2" stroke-linecap="round" opacity=".14"/>
`;
  return s+'</g>';
}
/* 案3 服：生地の織り目・肩のふちの光・しわ・縫い目 */
function clothLayer(id,k,d,c){
  const b=bbox(d);if(b.y1-b.y0<8)return'';
  return `<clipPath id="${id}cc${k}"><path d="${d}"/></clipPath><g clip-path="url(#${id}cc${k})">
    <rect x="0" y="0" width="100" height="100" fill="url(#${id}Wv)" opacity=".06"/><rect x="0" y="0" width="100" height="100" fill="url(#${id}Wv2)" opacity=".1"/>
    <path d="${d}" fill="none" stroke="#fff3df" stroke-width="1.6" opacity=".16"/>
    <path d="M26 79 Q30 88 28 100 M74 79 Q70 88 72 100 M36 77 Q39 84 37 92 M64 77 Q61 84 63 92" fill="none" stroke="#000" stroke-width="1.1" opacity=".22"/>
    <path d="M27 78.6 Q31 87.6 29 100 M73 78.6 Q69 87.6 71 100" fill="none" stroke="#fff" stroke-width=".35" opacity=".14"/>
    <path d="M14 86 Q22 80 33 77.4 M86 86 Q78 80 67 77.4" fill="none" stroke="#000" stroke-width=".3" stroke-dasharray=".8 .6" opacity=".35"/>
  </g>`;
}

window.detailSVG=function(svg,name,f){
  const key=(typeof REAL_KEY!=='undefined'&&REAL_KEY[name])||name,c=(typeof REAL!=='undefined'&&REAL[key]);if(!c||!f)return svg;
  const m=svg.match(/<clipPath id="(r\w+)f">/);if(!m)return svg;const id=m[1];
  const add=defs(id,c);
  svg=svg.replace('<defs>','<defs>'+add);
  if(f.face){
    const k=`clip-path="url(#${id}f)">`,i=svg.indexOf(k);
    if(i>0){const j=svg.indexOf('</g>',i);svg=svg.slice(0,j)+faceLayer(id,c)+svg.slice(j)}
    svg=svg.replace(/(<circle cx="([\d.-]+)" cy="([\d.-]+)" r="([\d.]+)" fill="url\(#\w+ir\)"\/>)/g,(a,_,x,y,r)=>a+irisDetail(id,+x,+y,+r,c));
    // 下まつげ・上まぶたの厚み（目の上の線をもう1本、少し上に薄く）
    svg=svg.replace(/(<path d="(M[\d.\s-]+Q[\d.\s-]+)" fill="none" stroke="#120d10" stroke-width="(1\.3|1)" stroke-linecap="round"\/>)/g,(a,_,d)=>{
      const n=num(d);return a+`<path d="M${n[0]+.4} ${n[1]-.5} Q${n[2]} ${n[3]-1.1} ${n[4]-.4} ${n[5]-.6}" fill="none" stroke="#120d10" stroke-width=".5" opacity=".35"/>`+
        (c.sex==='f'?`<path d="M${n[4]-.6} ${n[5]-.2} l1.1 -1.3 M${n[4]-1.8} ${n[5]-.8} l.7 -1.4 M${n[4]-3.2} ${n[5]-1.2} l.3 -1.3" stroke="#120d10" stroke-width=".35" stroke-linecap="round" opacity=".8"/>`:'')});
    // 唇：下唇のつや＋口の端の影（男性にも）
    svg=svg.replace(/(<path d="M46\.2 ([\d.]+) Q50 [\d.]+ 53\.8 [\d.]+ Q50 [\d.]+ 46\.2 [\d.]+Z" fill="[^"]+" opacity="[\d.]+"\/>)/,(a,_,y)=>a+
      `<ellipse cx="49.2" cy="${(+y+1.3).toFixed(1)}" rx="1.6" ry=".42" fill="#fff" opacity="${c.sex==='f'?.22:.12}"/>`+soft(id,'Dk',45.4,+y-.1,1.2,1,.4)+soft(id,'Dk',54.6,+y-.1,1.2,1,.4));
  }
  if(f.hair){let k=0;const H=[c.hair,c.hairD].filter(Boolean);
    svg=svg.replace(/<path d="([^"]+)" fill="(#[0-9a-fA-F]{3,6})"( opacity="[\d.]+")?\/>/g,(a,d,col)=>H.includes(col)&&!/buzz|grey|stub/.test(a)&&!c.bald?a+hairLayer(id,k++,d,c):a);}
  if(f.cloth){let k=0;
    svg=svg.replace(/<path d="([^"]+)" fill="(#[0-9a-fA-F]{3,6})"\/>/g,(a,d,col)=>col===c.cloth&&k<2?a+clothLayer(id,k++,d,c):a);}
  if(f.lid){ // 案4：白目の上に肌色のまぶたを置き、まばたきで上から下りてくる
    svg=svg.replace(/(<g clip-path="url\(#\w+e2?\)">)/g,`$1<rect class="lid" x="40" y="27.8" width="30" height="13" fill="${c.skin}"/><rect class="lid" x="40" y="40.2" width="30" height=".8" fill="${c.shade}" opacity=".6"/>`);
    svg=svg.replace('class="av real"','class="av real lidblink"');
  }
  return svg;
};
})();


/* 案5 卓に置いた手（描き直し 2026-10-22：関節・爪・親指・影のある手）。kind = riffle / clasp / guard / one */
(function(){
/* 写実寄りの手（手の甲を上、指先がこちら向き）。ローカル座標：手首の中心 (0,0)、指先は +y。right=本人の右手（画面では左側に置く、親指は画面右） */
function rhand(o){
  const {skin:S,shade:D,id,right=true,curl=.5,age=0,nail='#e9c3b4'}=o;
  const sx=right?1:-1;
  const lt='#fff4e8';
  // 指：付け根の x、長さ（3節）、太さ。curl が大きいほど先の節が短く見える（こちらへ曲がって奥行きが縮む）
  const F=[[-5.9,[5.4,3.4,2.6],3.9],[-1.9,[6,3.8,2.8],4.1],[2.1,[5.6,3.5,2.6],3.9],[5.9,[4.4,2.8,2.2],3.3]];
  const kn=y=>12.6; // 付け根の高さ
  let fing='',crease='',nails='',kh='';
  F.forEach(([x,L,w],i)=>{
    const ky=kn()+[.5,0,.4,1.4][i];
    const l1=L[0],l2=L[1]*(1-curl*.35),l3=L[2]*(1-curl*.5);
    const sp=-(x)*.06; // 指先は少し外に開く
    const y1=ky+l1,y2=y1+l2,y3=y2+l3;
    const x1=x+sp*1,x2=x+sp*1.6,x3=x+sp*2;
    const w0=w,w1=w*.92,w2=w*.84,w3=w*.74;
    // 指の輪郭（左右の縁を通って先を丸く）
    fing+=`<path d="M${x-w0/2} ${ky-1.5} C${x-w0/2} ${ky+l1*.5} ${x1-w1/2} ${y1-1} ${x1-w1/2} ${y1}
      C${x1-w1/2} ${y1+l2*.5} ${x2-w2/2} ${y2-.6} ${x2-w2/2} ${y2}
      C${x2-w2/2} ${y2+l3*.6} ${x3-w3/2} ${y3} ${x3} ${y3+.2}
      C${x3+w3/2} ${y3} ${x2+w2/2} ${y2+l3*.6} ${x2+w2/2} ${y2}
      C${x2+w2/2} ${y2-.6} ${x1+w1/2} ${y1+l2*.5} ${x1+w1/2} ${y1}
      C${x1+w1/2} ${y1-1} ${x+w0/2} ${ky+l1*.5} ${x+w0/2} ${ky-1.5}Z" fill="${S}"/>`;
    // 指の側面の影（外側）と、中央の光
    fing+=`<path d="M${x+w0/2-.2} ${ky} C${x+w0/2-.2} ${ky+l1*.5} ${x1+w1/2-.3} ${y1-1} ${x1+w1/2-.3} ${y1} C${x1+w1/2-.3} ${y1+l2*.5} ${x2+w2/2-.3} ${y2-.6} ${x2+w2/2-.3} ${y2}" fill="none" stroke="${D}" stroke-width=".9" opacity=".35"/>`;
    fing+=`<path d="M${x-.5} ${ky+1} L${x1-.4} ${y1-.6}" stroke="${lt}" stroke-width="1" stroke-linecap="round" opacity=".16"/>`;
    fing+=`<path d="M${x2-w2/2} ${y2-.2} L${x2+w2/2} ${y2-.2} L${x3+w3/2} ${y3+.2} L${x3-w3/2} ${y3+.2}Z" fill="${D}" opacity="${.12+curl*.18}"/>`;
    // 関節のしわ（第二・第一関節）
    crease+=`<path d="M${x1-w1*.32} ${y1-.1} Q${x1} ${y1+.5} ${x1+w1*.32} ${y1-.1} M${x1-w1*.22} ${y1+.6} Q${x1} ${y1+1} ${x1+w1*.2} ${y1+.6}" fill="none" stroke="${D}" stroke-width=".28" opacity="${.45+age*.15}"/>
      <path d="M${x2-w2*.28} ${y2-.1} Q${x2} ${y2+.35} ${x2+w2*.28} ${y2-.1}" fill="none" stroke="${D}" stroke-width=".25" opacity=".4"/>`;
    // 爪（先の節の上。曲がっているほど長く見える）
    const nl=Math.max(1.6,l3*.8),nw=w3*.72;
    nails+=`<path d="M${x3-nw/2} ${y3-nl+.2} Q${x3} ${y3-nl-.5} ${x3+nw/2} ${y3-nl+.2} L${x3+nw/2-.1} ${y3-.5} Q${x3} ${y3+.1} ${x3-nw/2+.1} ${y3-.5}Z" fill="${nail}"/>
      <path d="M${x3-nw/2+.3} ${y3-.75} Q${x3} ${y3-.3} ${x3+nw/2-.3} ${y3-.75}" fill="none" stroke="#fff" stroke-width=".35" opacity=".55"/>
      <path d="M${x3-nw*.15} ${y3-nl+.2} L${x3-nw*.2} ${y3-1}" stroke="#fff" stroke-width=".35" opacity=".45" stroke-linecap="round"/>`;
    // 指の付け根の関節（ナックル）の光と影
    kh+=`<ellipse cx="${x}" cy="${ky-.6}" rx="${w0*.4}" ry=".9" fill="${lt}" opacity=".1"/><path d="M${x-w0*.45} ${ky+.9} Q${x} ${ky+1.8} ${x+w0*.45} ${ky+.9}" fill="none" stroke="${D}" stroke-width=".35" opacity=".35"/>`;
  });
  // 手の甲
  const back=`M-6.2 -2 C-6.8 3 -8.4 7.6 -8.2 12.2 Q-8 14 -6 13.8 Q0 12.6 6.2 14.4 Q8.6 14.6 8.4 12 C8.2 7.6 7.4 3 6.2 -2Z`;
  // 親指（内側＝本人の右手なら +x 側）：甲の横から出て、斜め下へ。先の爪は横から見える
  const thumb=`M6.4 2 C9.6 3.6 11.4 6.6 11.4 10 C11.4 12.6 10.6 15 9.4 16.2 Q8.2 17.2 7.4 16.2 C7 14.8 7.6 13 7.2 11 C6.8 8.8 5.8 7.6 5 6.6Z`;
  const tnail=`M9.4 13.4 Q11.2 13.6 11.1 15 Q10.6 16.4 9.5 16.4 Q9 15.2 9.4 13.4Z`;
  const tend=[[-4.6,-1],[-1.6,0],[1.6,0],[4.4,-1]].map(([x,a],i)=>`<path d="M${x*.5} 0 Q${x*.75+a} 6 ${F[i][0]} 11.6" fill="none" stroke="${lt}" stroke-width=".5" opacity="${.05+age*.05}"/>`).join('');
  const veins=age>=1?`<path d="M-2 1 Q-3.4 6 -1.6 9 Q-.4 11 -2 14 M1.6 2 Q2.6 6 1.2 10" fill="none" stroke="#6a7a9a" stroke-width=".55" opacity="${.18*age}"/>`:'';
  return `<g transform="scale(${sx} 1)">
    <defs>
      <linearGradient id="${id}bk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".35" stop-color="#000" stop-opacity=".08"/><stop offset=".8" stop-color="#fff" stop-opacity=".06"/></linearGradient>
      <linearGradient id="${id}sd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${D}" stop-opacity=".5"/><stop offset=".3" stop-color="${D}" stop-opacity="0"/><stop offset=".75" stop-color="${D}" stop-opacity="0"/><stop offset="1" stop-color="${D}" stop-opacity=".35"/></linearGradient>
      <radialGradient id="${id}cs"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse cx="1" cy="17" rx="13" ry="5" fill="url(#${id}cs)"/>
    <ellipse cx="0" cy="24.5" rx="10" ry="2.6" fill="url(#${id}cs)" opacity=".8"/>
    <path d="${thumb}" fill="${S}"/><path d="${thumb}" fill="url(#${id}sd)"/>
    <path d="M7.4 7 C9 8.6 9.8 10.6 9.6 13" fill="none" stroke="${D}" stroke-width=".35" opacity=".4"/>
    <path d="${tnail}" fill="${nail}"/><path d="M9.9 14 Q10.6 14.2 10.8 15" stroke="#fff" stroke-width=".3" opacity=".5" fill="none"/>
    ${fing}
    <path d="${back}" fill="${S}"/>
    <path d="${back}" fill="url(#${id}sd)"/>
    ${tend}${veins}${kh}
    <path d="${back}" fill="url(#${id}bk)"/>
    ${crease}${nails}
    <path d="M-9.4 -12 L9.4 -12 L8 0 L-8 0Z" fill="${o.cloth}"/><path d="M-8.2 -1.6 L8.2 -1.6 L8 .4 L-8 .4Z" fill="${o.cuff||'#e8e2d6'}"/>
    <path d="M-8 .4 L8 .4" stroke="#000" stroke-width=".6" opacity=".35"/>
  </g>`;
}

function chips(x,y,n,col,cls){let s=`<g class="${cls||''}">`;for(let i=0;i<n;i++){const yy=y-i*1.3;
  s+=`<ellipse cx="${x}" cy="${yy+.7}" rx="4.2" ry="1.4" fill="#000" opacity=".35"/><ellipse cx="${x}" cy="${yy}" rx="4.2" ry="1.4" fill="${col}"/><ellipse cx="${x}" cy="${yy}" rx="4.2" ry="1.4" fill="none" stroke="#fff" stroke-width=".45" stroke-dasharray="1 1.2" opacity=".8"/>`}
  return s+'</g>'}
window.handsSVG=function(name,kind){
  const key=(typeof REAL_KEY!=='undefined'&&REAL_KEY[name])||name,c=REAL[key];if(!c)return'';const id='h'+Math.random().toString(36).slice(2,7);
  const o=r=>({skin:c.gloves?'#202026':c.skin,shade:c.gloves?'#000':c.shade,nail:c.gloves?'#2a2a30':undefined,id:id+(r?'r':'l'),right:r,curl:.55,age:c.age||0,cloth:c.cloth,cuff:c.shirt||c.clothD});
  const H=(x,y,rot,r,sc)=>`<g transform="translate(${x} ${y}) rotate(${rot}) scale(${(sc||.82)*1.3})">${rhand(o(r))}</g>`;
  let body='';
  if(kind==='riffle')body=chips(66,27,5,'#2e4f8a')+chips(77,28,4,'#8a2e3a')+H(28,1,10,true)+`<g class="riffle">${chips(66,20.5,1,'#2e4f8a','rchip')}</g>`+H(68,0,-8,false,.78);
  else if(kind==='clasp')body=chips(82,28,6,'#2e4f8a')+H(34,1,14,true)+H(66,1,-14,false);
  else if(kind==='one')body=H(34,2,8,true)+chips(70,28,6,'#2e4f8a')+chips(80,28,3,'#8a2e3a');
  else body=`<g transform="translate(55 20) rotate(-6) scale(1.3)"><rect x="-5" y="-4" width="8" height="11" rx="1" fill="#7a1820" stroke="#fff" stroke-width=".4"/><rect x="-1" y="-3.6" width="8" height="11" rx="1" fill="#7a1820" stroke="#fff" stroke-width=".4"/></g>`+H(56,1,-4,false,.8)+chips(22,28,5,'#8a2e3a')+chips(32,28,3,'#2e4f8a');
  return `<svg class="hands" viewBox="0 0 100 34" aria-hidden="true"><defs><linearGradient id="${id}rl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2416"/><stop offset=".4" stop-color="#20140c"/><stop offset="1" stop-color="#0d0805"/></linearGradient></defs>
    <rect x="0" y="0" width="100" height="34" fill="#14402a"/>
    <rect x="0" y="0" width="100" height="5" fill="url(#${id}rl)"/>${body}</svg>`;
};
})();

/* 画風の案（試作）。realAvatar の SVG に、画風ごとの手を加える */
(function(){
const hex=h=>{h=h.replace('#','');if(h.length===3)h=h.split('').map(x=>x+x).join('');return[0,2,4].map(i=>parseInt(h.slice(i,i+2),16))};
const mix=(a,b,t)=>{const A=hex(a),B=hex(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')};
const partRe=(col)=>new RegExp(`(<path d="[^"]+" fill="${col}")(\\s*/>|( opacity="[\\d.]+")\\s*/>)`,'g');
function defsAdd(svg,d){return svg.replace('<defs>','<defs>'+d)}
window.styleSVG=function(svg,name,style){
  const key=(typeof REAL_KEY!=='undefined'&&REAL_KEY[name])||name,c=REAL[key];const m=svg.match(/<clipPath id="(r\w+)f">/);if(!c||!m)return svg;const id=m[1];
  if(style==='real'){ // 写実：線を細く薄く、光と影を強く（明暗の差で形を見せる）
    svg=detailSVG(svg,name,{face:1,hair:1,cloth:1,lid:1});
    svg=svg.replace(/stroke="#120d10" stroke-width="(1\.3|1\.1|1)"/g,(a,w)=>`stroke="#120d10" stroke-width="${(+w*.62).toFixed(2)}"`);
    svg=svg.replace(/(stroke="#120d10" stroke-width="\.8" stroke-linecap="round" opacity=")\.85/g,'$1.5');
    const k=`clip-path="url(#${id}f)">`,i=svg.indexOf(k);
    if(i>0){const j=svg.indexOf('</g>',i);svg=svg.slice(0,j)+
      `<rect width="100" height="100" fill="url(#${id}KS)"/><rect width="100" height="100" fill="url(#${id}KR)"/><ellipse cx="43" cy="40" rx="9" ry="13" fill="url(#${id}Lt)" opacity=".3"/><ellipse cx="50" cy="58" rx="3.4" ry="2.4" fill="url(#${id}Dk)" opacity=".35"/><ellipse cx="50" cy="31" rx="13" ry="5" fill="url(#${id}Lt)" opacity=".14"/>`+svg.slice(j)}
    svg=defsAdd(svg,`<linearGradient id="${id}KS" x1="0" y1="0" x2="1" y2="0"><stop offset=".44" stop-color="${c.shade}" stop-opacity="0"/><stop offset=".6" stop-color="${c.shade}" stop-opacity=".55"/><stop offset=".78" stop-color="#1a0c10" stop-opacity=".62"/><stop offset="1" stop-color="#0a0406" stop-opacity=".8"/></linearGradient>
      <linearGradient id="${id}KR" x1="0" y1="0" x2="1" y2="0"><stop offset="0.3" stop-color="#ffe6c8" stop-opacity=".3"/><stop offset=".36" stop-color="#ffe6c8" stop-opacity="0"/></linearGradient>`);
    return svg;
  }
  if(style==='cg'){const AZ=window.AZ||225; // CG風：顔・髪・服をそれぞれ立体として光を計算（拡散光＋つや）
    const F=(n,blur,sc,ex,sp)=>`<filter id="${id}${n}" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="${blur}" result="h"/>
      <feDiffuseLighting in="h" surfaceScale="${sc}" diffuseConstant="1.12" lighting-color="#fff4e6" result="d"><feDistantLight azimuth="${AZ}" elevation="58"/></feDiffuseLighting>
      <feSpecularLighting in="h" surfaceScale="${sc}" specularConstant="${sp}" specularExponent="${ex}" lighting-color="#fff" result="s"><feDistantLight azimuth="${AZ}" elevation="62"/></feSpecularLighting>
      <feComposite in="SourceGraphic" in2="d" operator="arithmetic" k1=".7" k2=".4" result="lit"/>
      <feComposite in="s" in2="SourceAlpha" operator="in" result="s2"/>
      <feComposite in="lit" in2="s2" operator="arithmetic" k2="1" k3="1" result="o"/>
      <feComposite in="o" in2="SourceAlpha" operator="in"/></filter>`;
    svg=defsAdd(svg,F('Fs',3.2,4,22,.35)+F('Hs',2,5,14,.55)+F('Cs',2.6,4,30,.25));
    const add=(col,f)=>{svg=svg.replace(partRe(col),(a,b,e)=>a.includes('filter=')?a:`${b} filter="url(#${id}${f})"${e}`)};
    add(c.skin,'Fs');add(c.hair,'Hs');if(c.hairD)add(c.hairD,'Hs');add(c.cloth,'Cs');
    svg=svg.replace(/stroke="#120d10" stroke-width="(1\.3|1)"/g,'stroke="#120d10" stroke-width=".8"');
    return detailSVG(svg,name,{lid:1});
  }
  if(style==='noir'){ // 劇画・ノワール：細部を足し、光は fxLight(svg,1.3,true)（影を段で区切る）で描く
    svg=detailSVG(svg,name,{hair:1,cloth:1,lid:1});
    // 顔の右側に、輪郭に沿った硬い影（顔の形を左へずらして光の当たる面にする）＋影の中の斜線
    const fd=(svg.match(new RegExp(`<clipPath id="${id}f">\\s*<path d="([^"]+)"`))||[])[1];
    const k=`clip-path="url(#${id}f)">`,i=svg.indexOf(k);
    if(fd&&i>0){const j=i+k.length;const sh=mix(c.skin,c.shade,.62);
      svg=svg.slice(0,j)+`<rect width="100" height="100" fill="${sh}"/><rect width="100" height="100" fill="url(#${id}Hx)" opacity=".35"/><path d="${fd}" transform="translate(-5.5 -1.5)" fill="${c.skin}"/>`+svg.slice(j);
      svg=svg.replace('<defs>',`<defs><pattern id="${id}Hx" width="1.3" height="1.3" patternUnits="userSpaceOnUse" patternTransform="rotate(-50)"><rect width="1.3" height=".32" fill="#1a0c10"/></pattern>`)}
    return svg;
  }
  if(style==='paint'){ // 油絵：ふちを筆でゆらし、キャンバスの目を重ねる
    svg=detailSVG(svg,name,{face:1,hair:1,cloth:1,lid:1});
    svg=defsAdd(svg,`<filter id="${id}Pt" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale=".9" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feTurbulence type="fractalNoise" baseFrequency="1.6 .35" numOctaves="2" seed="8" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 .5  0 0 0 0 .45  0 0 0 0 .4  0 0 0 .55 -.18" result="t2"/>
      <feComposite in="t2" in2="d" operator="in" result="t3"/><feBlend in="d" in2="t3" mode="overlay"/></filter>`);
    return svg.replace(/<g class="head">/,`<g class="head" filter="url(#${id}Pt)">`).replace(/(<g transform="translate\(50 [\d.]+\) scale\([\d.]+\) translate\(-50 -[\d.]+\)">)/,`$1<g filter="url(#${id}Pt)">`).replace(/<g class="head"/,'</g><g class="head"');
  }
  return svg;
};
})();
