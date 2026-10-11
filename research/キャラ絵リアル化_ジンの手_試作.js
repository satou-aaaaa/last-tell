/* ジンの手（描き直し3回目）：軽く握った手の、人差し指の背（第二関節）で顎の傷をなでる。
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
