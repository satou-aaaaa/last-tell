/* LAST TELL 多様なキャラ用の部品（2026-10-09 試作）
   realAvatar（research/キャラ絵リアル化_顔の描き方_試作.js）に「名前ごとの分岐」を書かなくても、
   REAL の定義に hs（髪型）・outfit（服）などを書くだけで描けるようにする。

   使い方：realAvatar の中、`if(c.scar)ex+=...` の行の直前に次の1行を足す。
     if(c.hs||c.outfit){const g=genParts(c,id,SH,D);if(g.hb!=null)hairBack=g.hb;if(g.h!=null)hair=g.h;ex+=g.ex;if(g.b)body=g.b;}

   REAL に書けるもの（すべて省略可）
     hs     : 'short' 'crop' 'bald' 'sidepart' 'pixie' 'bob' 'bangs' 'long' 'wavy' 'ponytail' 'bun' 'curly' 'afro' 'locs' 'hijab'
     outfit : 'tee' 'suit' 'jacket' 'knit' 'work' 'dress'
     broad  : 1 で肩幅を広く（体格の大きい人）
     beard  : 'full' 'short' 'goatee'   stubble:1   mustache:1（既存）
     glasses: 'round' 'square'
     earring: 色      greyHair: 0〜1（白髪の量）   streak: 色（ひと筋の色）
     scarf  : 色（hijab のときの色。無ければ cloth2）  shirt: 中のシャツの色
   肌の色は SKIN の7段階から選ぶ（skin と shade を組で使う。下を参照）。 */

const SKIN={ // [肌, 影, 唇] 明るい→暗い。影の色を肌に合わせると暗い肌でもつぶれない
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
}
