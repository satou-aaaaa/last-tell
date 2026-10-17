/* ---------- 会話シーン ---------- */
let SC=null;
/* ---------- 会話の背景：店ごとに canvas で描く（改善提案 §7） ---------- */
const VENUE_BG={'港のバー「錨亭」':'anchor','錨亭、閉店後':'anchor_closed','古いクラブ「銀の扉」':'silver','ジャズクラブ「月影」':'moon',
 'ホテルのラウンジ「天空」':'sky','地下の賭場跡':'den','カードルーム「王冠」':'crown','汐見の古い店「舫」':'moyai','月影から、地下の賭場跡へ':'moon'};
// 会話の途中で店が変わる章：この言葉で始まる地の文から、次の背景にする
const VENUE_BG_SHIFT={'月影から、地下の賭場跡へ':['地下の賭場跡。','den']};
// 幕間（そのころ）は、いちばん近い店の背景
const VENUE_BG_IL={'銀の扉、閉店後':'silver','地下の賭場跡':'den','王冠、最上階':'crown','錨亭の前':'anchor'};
const VBG_CACHE={},VBG_MS={},VBG={base:null,cur:null,o:'',up:false,fin:false,shift:null};
function venueDraw(x,W,H,key,up){
  let sd=7;for(const c of key)sd=(sd*31+c.charCodeAt(0))%2147483647;
  const r=()=>(sd=(sd*16807)%2147483647)/2147483647;
  const L=W>H,M=Math.min(W,H),cx=W/2,PI2=Math.PI*2;
  const fr=(c,a,b,w,h)=>{x.fillStyle=c;x.fillRect(a,b,w,h)};
  const glow=(gx,gy,rad,rgb,a)=>{const g=x.createRadialGradient(gx,gy,0,gx,gy,rad);g.addColorStop(0,`rgba(${rgb},${a})`);g.addColorStop(.35,`rgba(${rgb},${a*.35})`);g.addColorStop(1,`rgba(${rgb},0)`);x.fillStyle=g;x.fillRect(0,0,W,H)};
  const line=(a,b,c,d,col,w)=>{x.strokeStyle=col;x.lineWidth=w||1;x.beginPath();x.moveTo(a,b);x.lineTo(c,d);x.stroke()};
  const ell=(ex,ey,rx,ry,col)=>{x.fillStyle=col;x.beginPath();x.ellipse(ex,ey,rx,ry,0,0,PI2);x.fill()};
  const BASE={anchor:['#2a2119','#0c0a09'],anchor_closed:['#1a1612','#070606'],silver:['#1d1f27','#08090c'],moon:['#211720','#09070a'],
    sky:['#101829','#05070c'],den:['#1b1c1a','#070807'],crown:['#1b1827','#08070c'],moyai:['#1e2021','#08090a']}[key]||['#1a1a1e','#08080a'];
  const g0=x.createLinearGradient(0,0,0,H);g0.addColorStop(0,BASE[0]);g0.addColorStop(1,BASE[1]);x.fillStyle=g0;x.fillRect(0,0,W,H);
  const lamp=(lx,ly,rgb,a,rad)=>{line(lx,0,lx,ly-M*.03,'rgba(30,26,22,.9)',1.5);x.fillStyle='#16130f';x.beginPath();x.moveTo(lx-M*.03,ly);x.lineTo(lx+M*.03,ly);x.lineTo(lx+M*.015,ly-M*.03);x.lineTo(lx-M*.015,ly-M*.03);x.fill();
    ell(lx,ly+1,M*.022,M*.006,`rgba(${rgb},.8)`);glow(lx,ly+M*.02,rad||M*.55,rgb,a)};
  const D={
   anchor(closed){
    for(let i=0;i<W;i+=M*.07)line(i,0,i,H*.7,'rgba(0,0,0,.22)',1);
    // 削られた古い看板（錨亭のものではない）
    const sw=Math.min(W*.62,M*.95),sh=M*.075,sx=cx-sw/2,sy=H*.05;fr('#3a2b1e',sx,sy,sw,sh);fr('#4a3727',sx,sy,sw,2);
    x.strokeStyle='rgba(0,0,0,.45)';x.strokeRect(sx+.5,sy+.5,sw-1,sh-1);
    for(let k=0;k<26;k++){const a=sx+sw*.18+r()*sw*.64,b=sy+sh*.25+r()*sh*.5;line(a,b,a+M*.02+r()*M*.025,b-M*.008+r()*M*.016,'rgba(170,140,105,.28)',1)}
    // 壁の写真。1枚だけ裏返し（第7章のあとだけ表）
    const n=L?7:5,pw=M*.085,ph=pw*1.24,gap=Math.min((W*.86-n*pw)/(n-1),pw*.7),tw=n*pw+(n-1)*gap,dn=n-2;
    for(let k=0;k<n;k++){const px=cx-tw/2+k*(pw+gap),py=H*.17+(k%2)*M*.02;
      if(k===dn&&!up){fr('#2a231d',px,py,pw,ph);x.strokeStyle='#5a4a3a';x.lineWidth=1;x.strokeRect(px+.5,py+.5,pw-1,ph-1);fr('rgba(160,150,130,.25)',px+pw*.3,py-2,pw*.4,5)}
      else{fr(k===dn?'#c2b394':'#9c917c',px,py,pw,ph);fr(k===dn?'#4e4538':'#3e382f',px+pw*.1,py+pw*.1,pw*.8,pw*.8);
        ell(px+pw*.5,py+pw*.42,pw*.13,pw*.15,'rgba(120,108,90,.8)');x.fillStyle='rgba(120,108,90,.8)';x.fillRect(px+pw*.28,py+pw*.6,pw*.44,pw*.3);
        if(k===dn&&up)glow(px+pw/2,py+ph/2,M*.18,'230,200,150',.22)}}
    // 酒瓶の棚
    for(const shy of [H*.46,H*.6]){fr('#3b2a1b',0,shy,W,M*.012);fr('rgba(0,0,0,.35)',0,shy+M*.012,W,M*.01);
      for(let bx=M*.03;bx<W-M*.04;bx+=M*.045+r()*M*.03){const bh=M*(.07+r()*.06),bw=M*(.026+r()*.012);
        x.fillStyle=`hsla(${20+r()*120|0},${18+r()*16|0}%,${16+r()*14|0}%,.95)`;x.fillRect(bx,shy-bh,bw,bh);x.fillRect(bx+bw*.32,shy-bh-M*.03,bw*.36,M*.03);
        fr('rgba(255,240,220,.1)',bx+bw*.18,shy-bh+3,1.5,bh*.7)}}
    // カウンター
    const ct=H*.72;fr('#2b1c12',0,ct,W,H-ct);fr('#5a3c25',0,ct-M*.022,W,M*.022);fr('rgba(255,210,160,.12)',0,ct-M*.022,W,1.5);
    for(let i=M*.12;i<W;i+=M*.24)line(i,ct+M*.04,i,H,'rgba(0,0,0,.35)',2);
    if(closed){fr('rgba(0,0,0,.56)',0,0,W,H);lamp(W*(L?.64:.6),H*.34,'235,175,105',.34,M*.6)}
    else{const xs=L?[.2,.5,.8]:[.22,.78];xs.forEach(f=>lamp(W*f,H*.34,'235,175,105',.2,M*.5));
      for(let k=0;k<(L?5:3);k++){const sx2=W*(k+.5)/(L?5:3);fr('#140d08',sx2-1.5,H*.86,3,H*.14);ell(sx2,H*.86,M*.05,M*.014,'#1d130c')}}
   },
   silver(){
    for(let i=0;i<W;i+=M*.05)fr(((i/(M*.05))|0)%2?'rgba(255,255,255,.018)':'rgba(0,0,0,.08)',i,0,M*.05,H*.86);
    fr('#121318',0,H*.66,W,H*.2);line(0,H*.66,W,H*.66,'rgba(170,170,190,.18)',2);
    const dw=Math.min(W*.4,M*.62),dh=H*.62,dx=cx-dw/2,dy=H*.24;
    fr('#2a2c36',dx-M*.03,dy-M*.03,dw+M*.06,dh+M*.03);fr('#1c1d25',dx,dy,dw,dh);
    x.strokeStyle='rgba(165,170,190,.32)';x.lineWidth=2;
    for(const [a,b,c,d] of [[.1,.06,.8,.36],[.1,.48,.8,.44]])x.strokeRect(dx+dw*a,dy+dh*b,dw*c,dh*d);
    for(let k=0;k<7;k++)for(const yy of [.04,.96])ell(dx+dw*(.12+k*.127),dy+dh*yy,1.8,1.8,'rgba(180,180,200,.4)');
    x.strokeStyle='rgba(190,190,205,.55)';x.lineWidth=2.5;x.beginPath();x.arc(dx+dw*.84,dy+dh*.5,M*.022,0,PI2);x.stroke();
    fr('rgba(225,200,150,.22)',dx+dw-2,dy,2,dh);
    fr('#0d0e12',0,H*.86,W,H*.14);fr('rgba(225,200,150,.06)',dx,H*.86,dw,H*.14);
    for(const f of [-1,1]){const lx=cx+f*(dw/2+M*.16),ly=H*.38;fr('#3a3326',lx-M*.012,ly,M*.024,M*.05);
      x.fillStyle='#4a4232';x.beginPath();x.moveTo(lx-M*.03,ly);x.lineTo(lx+M*.03,ly);x.lineTo(lx+M*.018,ly-M*.04);x.lineTo(lx-M*.018,ly-M*.04);x.fill();
      glow(lx,ly-M*.02,M*.38,'216,196,138',.26)}
    glow(cx,0,M*.55,'190,190,215',.08);
   },
   moon(){
    const sl=W*.05,sr=W*.95,top=H*.06;
    for(let i=sl;i<sr;i+=M*.04){const g=x.createLinearGradient(i,0,i+M*.04,0);g.addColorStop(0,'#2c1421');g.addColorStop(.5,'#3e1d2e');g.addColorStop(1,'#22101a');x.fillStyle=g;x.fillRect(i,top,M*.04,H*.62)}
    fr('rgba(0,0,0,.35)',sl,top,sr-sl,M*.05);
    const st=H*.68;fr('#26161e',0,st,W,M*.05);fr('rgba(220,150,180,.18)',0,st,W,1.5);fr('#100a0d',0,st+M*.05,W,H);
    // スポット（色は抑えた桃色）
    x.fillStyle='rgba(190,110,150,.10)';x.beginPath();x.moveTo(cx-M*.05,0);x.lineTo(cx+M*.05,0);x.lineTo(cx+M*.32,st);x.lineTo(cx-M*.32,st);x.fill();
    glow(cx,st,M*.4,'190,110,150',.2);glow(cx,H*.02,M*.3,'210,130,170',.22);
    // ピアノ
    const px=L?W*.2:W*.14,py=st,pw=M*.36;x.fillStyle='#0a0608';x.beginPath();x.moveTo(px-pw*.5,py-M*.13);x.lineTo(px+pw*.35,py-M*.13);
    x.quadraticCurveTo(px+pw*.6,py-M*.14,px+pw*.55,py-M*.2);x.lineTo(px-pw*.4,py-M*.3);x.closePath();x.fill();
    line(px-pw*.4,py-M*.3,px+pw*.1,py-M*.42,'#0a0608',3);fr('#0a0608',px-pw*.45,py-M*.13,pw*.9,M*.03);
    for(const f of [-.4,.3])fr('#0a0608',px+pw*f,py-M*.1,M*.012,M*.1);
    line(px-pw*.45,py-M*.13,px+pw*.45,py-M*.13,'rgba(210,150,180,.28)',1);
    // マイク
    const mx=L?W*.62:W*.66;line(mx,st,mx,st-M*.26,'#1a1014',2);ell(mx,st-M*.27,M*.012,M*.016,'#2a1a22');line(mx-M*.04,st,mx+M*.04,st,'#1a1014',2);
    // 手前の小さな卓とろうそく
    for(let k=0;k<(L?4:2);k++){const tx=W*(k+.5)/(L?4:2),ty=H*.88;ell(tx,ty,M*.08,M*.02,'#1a1015');fr('#120a0e',tx-1.5,ty,3,H*.12);ell(tx,ty-M*.012,M*.005,M*.01,'#e8b070');glow(tx,ty-M*.012,M*.12,'232,170,110',.22)}
   },
   sky(){
    const wt=H*.05,wb=H*.72,hz=H*.5;
    const g=x.createLinearGradient(0,wt,0,wb);g.addColorStop(0,'#0a1020');g.addColorStop(.55,'#18223a');g.addColorStop(1,'#0c111e');x.fillStyle=g;x.fillRect(0,wt,W,wb-wt);
    for(let k=0;k<70;k++)ell(r()*W,wt+r()*(hz-wt)*.8,.6,.6,`rgba(200,210,235,${.15+r()*.3})`);
    for(let bx=0;bx<W;){const bw=M*(.04+r()*.09),bh=M*(.04+r()*.2);fr('#0a0e19',bx,hz-bh+M*.04,bw,wb-hz+bh);
      for(let k=0;k<bw*bh/90;k++)if(r()<.5)fr(r()<.75?`rgba(240,${190+r()*40|0},${130+r()*60|0},${.25+r()*.45})`:`rgba(180,210,240,${.3+r()*.4})`,bx+2+r()*(bw-4),hz-bh+M*.05+r()*bh,1.6,1.6);bx+=bw+M*.005}
    for(let k=0;k<260;k++)fr(`rgba(245,${185+r()*50|0},${120+r()*70|0},${.2+r()*.5})`,r()*W,hz+M*.05+r()*(wb-hz-M*.05),1.4,1.4);
    glow(cx,hz+M*.08,M*.7,'120,140,190',.08);
    const nw=L?5:3;for(let k=0;k<=nw;k++)fr('#121827',W*k/nw-3,wt,6,wb-wt);
    fr('#121827',0,wt-3,W,6);fr('#121827',0,H*.3,W,3);fr('#141a29',0,wb,W,M*.02);
    fr('#080a11',0,wb+M*.02,W,H);
    const rg=x.createLinearGradient(0,wb,0,H);rg.addColorStop(0,'rgba(120,140,190,.08)');rg.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=rg;x.fillRect(0,wb+M*.02,W,H);
    x.fillStyle='#0f1320';x.beginPath();x.roundRect?x.roundRect(cx-M*.42,H*.84,M*.84,M*.09,M*.03):x.rect(cx-M*.42,H*.84,M*.84,M*.09);x.fill();
    ell(cx,H*.8,M*.13,M*.025,'#151b2b');ell(cx+M*.02,H*.79,M*.012,M*.012,'rgba(230,190,130,.5)');
   },
   den(){
    for(let k=0;k<(W*H/260|0);k++)fr(`rgba(${r()<.5?'255,255,255':'0,0,0'},${r()*.05})`,r()*W,r()*H,2,2);
    for(let row=0,yy=H*.16;yy<H*.78;yy+=H*.16,row++){line(0,yy,W,yy,'rgba(0,0,0,.4)',1.5);for(let xx=(row%2)*M*.18;xx<W;xx+=M*.36)line(xx,yy,xx,yy+H*.16,'rgba(0,0,0,.3)',1.5)}
    for(let k=0;k<6;k++){const sx=r()*W,g=x.createLinearGradient(0,0,0,H*.6);g.addColorStop(0,'rgba(0,0,0,.18)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(sx,0,M*(.02+r()*.05),H*.6)}
    fr('#262622',0,H*.05,W,M*.025);for(let k=M*.1;k<W;k+=M*.3)fr('#1a1a17',k,H*.05-M*.01,M*.015,M*.045);
    fr('#0c0d0c',0,H*.78,W,H*.22);
    x.fillStyle='rgba(255,214,150,.07)';x.beginPath();x.moveTo(cx-M*.02,H*.3);x.lineTo(cx+M*.02,H*.3);x.lineTo(cx+M*.5,H*.86);x.lineTo(cx-M*.5,H*.86);x.fill();
    const tw=L?W*.36:W*.82;ell(cx,H*.86,tw*.55,M*.06,'#1e140d');ell(cx,H*.855,tw*.5,M*.05,'#1d3127');ell(cx,H*.855,tw*.3,M*.03,'rgba(120,150,110,.12)');
    for(const f of [-1,1])fr('#0f0f0d',cx+f*tw*.62-M*.02,H*.8,M*.04,M*.15);
    line(cx,0,cx,H*.3-M*.012,'#3a3a34',1.5);fr('#2a2a24',cx-M*.008,H*.3-M*.022,M*.016,M*.012);
    glow(cx,H*.3,M*.75,'255,212,150',.3);ell(cx,H*.3,M*.012,M*.014,'#f4e2b2');
   },
   crown(){
    for(let i=M*.1;i<W;i+=M*.26){x.strokeStyle='rgba(190,160,100,.16)';x.lineWidth=1.5;x.strokeRect(i,H*.18,M*.18,H*.42)}
    fr('#100e18',0,H*.62,W,H*.38);line(0,H*.62,W,H*.62,'rgba(190,160,100,.25)',2);
    for(const f of [.04,.96]){fr('#14121c',W*f-M*.04,0,M*.08,H*.62);fr('rgba(190,160,100,.12)',W*f-M*.04,0,2,H*.62)}
    const cy=H*.16;line(cx,0,cx,cy-M*.04,'#5a4a2c',2);
    for(const [ry,rx,n] of [[0,M*.06,6],[M*.035,M*.11,10],[M*.07,M*.15,14]]){x.strokeStyle='rgba(190,160,100,.4)';x.lineWidth=1.2;x.beginPath();x.ellipse(cx,cy+ry,rx,rx*.22,0,0,PI2);x.stroke();
      for(let k=0;k<n;k++){const a=k/n*PI2;const px=cx+Math.cos(a)*rx,py=cy+ry+Math.sin(a)*rx*.22;ell(px,py,1.6,1.6,'#f2dca8');line(px,py,px,py+M*.022,'rgba(230,220,200,.35)',1)}}
    glow(cx,cy+M*.03,M*.7,'250,215,155',.22);
    const tx=cx,ty=H*.84,rx=L?W*.42:W*.62,ry=M*.13;ell(tx,ty,rx,ry,'#2a1c12');ell(tx,ty-2,rx*.92,ry*.84,'#162334');
    x.strokeStyle='rgba(200,170,100,.35)';x.lineWidth=1.5;x.beginPath();x.ellipse(tx,ty-2,rx*.92,ry*.84,0,0,PI2);x.stroke();
    ell(tx,ty-4,rx*.5,ry*.4,'rgba(120,150,190,.08)');
    for(let k=0;k<5;k++){const a=Math.PI*(1.15+k*.175),chx=tx+Math.cos(a)*rx*1.04,chy=ty+Math.sin(a)*ry*1.1;fr('#0c0a12',chx-M*.03,chy-M*.09,M*.06,M*.09)}
    for(let k=0;k<6;k++){const a=k/6*PI2+.3,sx=tx+Math.cos(a)*rx*.62,sy=ty-2+Math.sin(a)*ry*.55;for(let j=0;j<3;j++)ell(sx,sy-j*2.5,M*.014,M*.005,j===2?'#6a5a7a':'#3a3046')}
   },
   moyai(){
    const ph=M*.065;for(let yy=0,k=0;yy<H*.74;yy+=ph,k++){fr(k%2?'#23211e':'#1d1b19',0,yy,W,ph);line(0,yy,W,yy,'rgba(0,0,0,.5)',1.5);
      for(let j=0;j<3;j++){const gy=yy+r()*ph;line(0,gy,W,gy+r()*4-2,'rgba(255,240,220,.025)',1)}
      for(let xx=r()*M*.4;xx<W;xx+=M*(.4+r()*.4))line(xx,yy,xx,yy+ph,'rgba(0,0,0,.4)',1)}
    // 古い看板（名前は読めない）
    const sw=Math.min(W*.5,M*.8),sh=M*.1,sx=cx-sw/2,sy=H*.1;line(sx+sw*.15,0,sx+sw*.15,sy,'rgba(140,120,90,.5)',2);line(sx+sw*.85,0,sx+sw*.85,sy,'rgba(140,120,90,.5)',2);
    fr('#3a3024',sx,sy,sw,sh);x.strokeStyle='rgba(0,0,0,.5)';x.strokeRect(sx+.5,sy+.5,sw-1,sh-1);
    for(let k=0;k<4;k++)fr('rgba(160,140,110,.14)',sx+sw*(.2+k*.17),sy+sh*.3,sw*.1,sh*.4);
    // 綱
    x.strokeStyle='rgba(150,128,96,.55)';x.lineWidth=3;x.beginPath();x.moveTo(0,H*.3);x.quadraticCurveTo(cx,H*.42,W,H*.3);x.stroke();
    x.setLineDash([3,4]);x.strokeStyle='rgba(60,48,34,.6)';x.stroke();x.setLineDash([]);
    const rx=L?W*.12:W*.16,ry=H*.5;for(let k=0;k<6;k++){x.strokeStyle=`rgba(${130-k*6},${110-k*5},${84-k*4},.55)`;x.lineWidth=2.5;x.beginPath();x.arc(rx,ry,M*(.025+k*.012),0,PI2);x.stroke()}
    // 丸窓と、船の灯り
    const wx=L?W*.84:W*.82,wy=H*.42,wr=M*.08;ell(wx,wy,wr*1.2,wr*1.2,'#4a3e2c');ell(wx,wy,wr,wr,'#16222e');ell(wx-wr*.3,wy-wr*.3,wr*.4,wr*.4,'rgba(140,170,200,.08)');
    const lx=L?W*.3:W*.5,ly=H*.24;line(lx,H*.34,lx,ly,'#2a241c',2);fr('#2a2218',lx-M*.018,ly,M*.036,M*.05);fr('#d9a868',lx-M*.01,ly+M*.01,M*.02,M*.03);glow(lx,ly+M*.025,M*.5,'225,170,105',.26);
    fr('#16120e',0,H*.74,W,H*.26);fr('#2c2318',0,H*.74,W,M*.02);
   }
  };
  if(key==='anchor'||key==='anchor_closed')D.anchor(key==='anchor_closed');else if(D[key])D[key]();
  // 色を抑えて、寒色に寄せる
  fr('rgba(14,20,32,.22)',0,0,W,H);
  const vg=x.createRadialGradient(cx,H*.45,M*.25,cx,H*.45,Math.max(W,H)*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.72)');x.fillStyle=vg;x.fillRect(0,0,W,H);
}
function venueBG(key,o,up){
  const id=key+'_'+o+(up?'_up':'');if(id in VBG_CACHE)return VBG_CACHE[id];
  const t0=performance.now();let u='';
  try{const c=document.createElement('canvas');c.width=o==='L'?640:360;c.height=o==='L'?400:640;const x=c.getContext('2d');
    if(x){venueDraw(x,c.width,c.height,key,up);u=c.toDataURL('image/jpeg',.82)}}catch(e){u=''}
  VBG_MS[id]=Math.round((performance.now()-t0)*10)/10;return VBG_CACHE[id]=u}
function venueBGApply(key){
  const sc=$('scene');if(!sc)return;VBG.cur=key||null;VBG.o=innerWidth>innerHeight?'L':'P';
  const up=key==='anchor_closed'&&VBG.up,u=key?venueBG(key,VBG.o,up):'';
  if(!u){sc.classList.remove('vbg');sc.style.removeProperty('--vbg');delete sc.dataset.vbg;return}
  sc.style.setProperty('--vbg',`url("${u}")`);sc.classList.add('vbg');sc.dataset.vbg=key+(up?':up':'')}
function venueBGSet(ch,lines){
  try{VBG.base=ch&&VENUE_BG[ch.venue]||null;VBG.shift=ch&&VENUE_BG_SHIFT[ch.venue]||null;VBG.up=false;
    VBG.fin=!!(ch&&ch.no===7&&!ch.p2&&Array.isArray(lines)&&lines.includes(P2_BRIDGE[0]));venueBGApply(VBG.base)}catch(e){}}
function venueBGLine(l){
  try{const a=Array.isArray(l),m=a&&l[2]||{},t=a&&typeof l[1]==='string'?l[1]:'';let k=VBG.base;
    if(m.il&&INTERLUDE[m.il])k=VENUE_BG_IL[INTERLUDE[m.il].place]||k;
    else{if(VBG.shift&&t.startsWith(VBG.shift[0]))VBG.base=k=VBG.shift[1];
      if(VBG.fin&&!VBG.up&&t.includes('裏返しだった一枚の写真が')){VBG.up=true;VBG.cur=null}}
    if(k!==VBG.cur)venueBGApply(k)}catch(e){}}
// canvas と JPEG の初期化を、空いた時間に先に済ませておく（1枚目の描画を 50ms 以内に）
(window.requestIdleCallback||setTimeout)(()=>{try{const c=document.createElement('canvas');c.width=64;c.height=40;const x=c.getContext('2d');for(const k of ['anchor','den'])venueDraw(x,64,40,k,false);c.toDataURL('image/jpeg',.8)}catch(e){}});
addEventListener('resize',()=>{try{const sc=$('scene');if(VBG.cur&&sc&&!sc.hidden&&(innerWidth>innerHeight?'L':'P')!==VBG.o)venueBGApply(VBG.cur)}catch(e){}});
document.head.appendChild(Object.assign(document.createElement('style'),{textContent:
  '#scene.vbg{isolation:isolate}'+
  '#scene.vbg::before{content:"";position:absolute;inset:-12px;z-index:-1;pointer-events:none;background:var(--vbg) center/cover no-repeat;filter:blur(3px) brightness(.6)}'+
  '#scene.vbg::after{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:linear-gradient(180deg,color-mix(in srgb,var(--venue) 12%,transparent),transparent 45%,rgba(8,9,12,.5) 88%)}'}));
function playScene(ch,lines,done){
  SC={ch,lines,i:0,done};venueBGSet(ch,lines);
  document.documentElement.style.setProperty('--venue',ch.color);
  SC.vh=`<span class="vchip">${chLab(ch)}　${esc(ch.title)}</span><span class="vn">${esc(ch.venue)}</span>`;$('venue').innerHTML=SC.vh;
  show('scene');renderLine();
}
function renderLine(){
  const l=SC.lines[SC.i];venueBGLine(l);
  {const il=Array.isArray(l)&&l[2]&&l[2].il;$('scene').classList.toggle('il',!!il);
   if(il&&INTERLUDE[il]){if(SC.ilOn!==il){SC.ilOn=il;$('venue').innerHTML=`<span class="vchip">そのころ</span><span class="vn">${esc(INTERLUDE[il].place)}</span>`}ilSeen(il)}
   else if(SC.ilOn){SC.ilOn=0;if(SC.vh)$('venue').innerHTML=SC.vh}}
  if(l&&!Array.isArray(l)&&p2Line(l)){}
  else if(l&&l.part){setStage(null);$('stage').className='stage part';
    $('box').innerHTML=`<div class="partcard"><span>${esc(l.part)}</span><b>${esc(l.title)}</b></div>`}
  else if(l&&l.preview){const pv=PREVIEW[l.preview],nc=CHAPTERS[l.preview-1];
    $('stage').className='stage preview';$('stage').innerHTML=`<div class="portrait sil">${avatar(pv.boss)}</div><div class="sign">${esc(pv.sign)}</div>`;
    $('box').innerHTML=`<span class="lesson-tag">次回</span><div class="lesson"><div class="lt">第${nc.no}章　${esc(nc.title)}</div><p>「${esc(pv.line)}」</p></div>`}
  else if(l&&l.door){setStage(null);$('stage').className='stage part';const c=CHAPTERS[l.door-1],dd=DOOR_DAYS[l.door];
    $('box').innerHTML=`<div class="partcard door"><span>第${l.door}章</span><b>${esc(c.title)}</b>${dd?`<em>${esc(dd)}</em>`:''}${l.cap?`<p class="doorcap">${esc(l.cap)}</p>`:''}</div>`;
    // 改善提案 第5回 §1：はじめての第1章の扉だけ自動で次へ（押せばすぐ進む）。添え文を読む時間を取るので SPEED では縮めない（v82 レビュー）
    clearTimeout(SC._dt);if(doorAuto(l)){const at=SC.i,me=SC;SC._dt=setTimeout(()=>{if(SC===me&&SC.i===at&&!$('scene').hidden)advance()},l.cap?3500:1800)}}
  else if(l&&l.choice){$('box').innerHTML=`<div class="line narr">${esc(TEMPT.ask)}</div><div class="tchoice">${TEMPT.choices.map(c=>`<button class="ghost" data-tc="${c.id}">${esc(c.label)}</button>`).join('')}</div>`;
    $('box').querySelectorAll('[data-tc]').forEach(b=>b.onclick=e=>{e.stopPropagation();temptPick(b.dataset.tc)})}
  else if(l&&l.epilogue){setStage(null);
    $('box').innerHTML=`<span class="lesson-tag">その後</span><ul class="epi">${EPILOGUE.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`}
  else if(!Array.isArray(l)){
    setStage(SC.ch&&SC.ch.p2?'師匠':'ジン');
    $('box').innerHTML=`<span class="lesson-tag">${SC.ch&&SC.ch.p2?'二代目の教え':'師匠の教え'}</span><div class="lesson"><div class="lt">${esc(l.lesson)}</div><p>${esc(l.body)}</p></div>`;
  }else{
    const [who,text]=l,prev=SC.i>0&&Array.isArray(SC.lines[SC.i-1])?SC.lines[SC.i-1][0]:null;
    if(who&&who!==prev&&!(l[2]&&l[2].voice))setStage(who);
    else if(!who)setStage(null);
    const cute=rankOf(who)<3;
    const meta=l[2]||{};if(meta.brk)noteBreak(meta.brk);
    const mark=meta.mark&&loadCleared()>=7?`<div class="amark"><b>答え合わせ</b>${esc(meta.mark)}</div>`:'';
    $('box').innerHTML=`${who?`<span class="nametag${cute?' cute':''}">${esc(who==='師匠'?mentorName():who)}${l[2]&&l[2].voice?`<small class="voice">（${esc(l[2].voice)}）</small>`:''}${CHARS[who]&&!(l[2]&&l[2].voice)?`<span class="stars">${stars(rankOf(who))}</span>`:''}</span>`:''}<div class="line${who?'':' narr'}">${who?'「'+esc(text)+'」':esc(text)}</div>${mark}`;
  }
  p2After(l);
  $('btnAdv').textContent=SC.i===SC.lines.length-1?'進む':'次へ';$('btnAdv').hidden=!!(l&&l.choice&&!SC.picked)||doorAuto(l);$('scene').classList.toggle('epil',!!(l&&l.epilogue));
}
function doorAuto(l){try{return !!(l&&l.door===1&&SC.ch&&SC.ch.no===1&&!SC.ch.p2&&!loadCleared())}catch(e){return false}}
function setStage(who){
  const st=$('stage');
  if(!who){st.className='stage';st.innerHTML='';return}
  st.className='stage '+(rankOf(who)>=3?'cool':'cute');
  st.innerHTML=`<div class="portrait">${avatar(who)}</div>`;
}
function advance(){setTimeout(fitScene,0);if(!SC)return;{const c=SC.lines[SC.i];if(c&&c.choice&&!SC.picked){temptPick('silent');return}}SC.i++;while(SC.i<SC.lines.length&&lineOff(SC.lines[SC.i]))SC.i++;if(SC.i>=SC.lines.length){const d=SC.done;SC=null;d();return}
  const l=SC.lines[SC.i];
  // 回想：会話の途中で1ハンドだけ打ち、終わったら続きに戻る
  if(l&&l.flashback){const sc=SC;SC=null;startFlashback(()=>{SC=sc;document.documentElement.style.setProperty('--venue',sc.ch.color);show('scene');advance()},l.flashback===true?'jin':l.flashback);return}
  renderLine()}
$('btnAdv').onclick=advance;
$('box').onclick=e=>{if(e.target.closest&&e.target.closest('[data-tc]'))return;const c=SC&&SC.lines[SC.i];if(c&&c.choice&&!SC.picked)return;advance()};
$('box').onkeydown=e=>{if(e.target!==e.currentTarget)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();advance()}};
$('btnSkip').onclick=()=>{if(!SC)return;const d=SC.done;SC=null;d()};

// ===== 案6：噂（第4章から。章の前に、店の人や常連から聞ける） =====
// kind: true=正しい、old=古い噂（もう当てはまらない）、plant=わざと流された噂、flavor=手がかりではない
const RUMORS={
  4:[['ソウ','レイカさん、強いときは自分のチップをちらっと見るんです。……たぶん','true'],['ソウ','長く打っていると、レイカさんのクセは逆になるって、先輩が言ってました','true'],['常連','レイカは汗をかいたら勝負手だってさ','old']],
  5:[['テツ','ハヤトの口数が急に増えたら、要注意だ','true'],['テツ','あいつが急に黙って動かなくなったら、たいてい嘘だ','true'],['常連','ハヤトは絶対にブラフしないって話だぜ','old']],
  6:[['カオル','クロウさん、汗をかいたら勝負手だって噂よ','plant'],['カオル','クロウさんが笑ったら……どうだったかしら。誰も確かめたことがないの','true'],['常連','本当に迷ったときだけ、白い手袋に触るって聞いたことがある','true']],
  7:[['店主','ジンさんの顎の傷のこと、誰も聞けないんだよ','flavor'],['ゲン','ジンさんはな、降りるときだけ、ちょっと笑うんだ','old'],['店主','昔のジンさんを知ってる人は、みんな同じことを言うよ。「手を見るな、顔を見ろ」ってね','flavor']]};
const RUMOR_KEY='shisho-rumor';
function loadRumor(){try{const o=JSON.parse(localStorage.getItem(RUMOR_KEY))||{};return o.heard&&typeof o.heard==='object'?o.heard:{}}catch(e){return{}}}
function rumorScene(ch,go){
  const R=RUMORS[ch.no];if(!R||ch.no<4)return go();
  const n=1+(regLevel(ch.no)>=1?1:0),pool=R.slice();const got=[];
  while(got.length<n&&pool.length)got.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
  const boss=ch.opps[0].name,h=loadRumor();h[boss]=h[boss]||[];got.forEach(r=>{if(!h[boss].includes(r[1]))h[boss].push(r[1])});
  try{localStorage.setItem(RUMOR_KEY,JSON.stringify({v:1,heard:h}))}catch(e){}
  playScene(ch,[['','店に入ると、噂話が耳に入ってきた。']].concat(got.map(r=>[r[0],r[1]])).concat([['ジン','噂は噂だ。最後は自分の目で確かめろ']]),go)}
// 主役と常連客を、主役が上側の中央寄りに来る順で並べる
function chSeats(ch){const P=ch.opps.map(o=>({...o}));if(!ch.extras)return P;const E=ch.extras.map(o=>({...o,extra:true}));return ch.seatPlan.map(k=>(k[0]==='p'?P:E)[+k.slice(1)])}
function startChapter(ch,skipIntro){
  if(ch&&ch.p2)return startP2(ch,skipIntro);
  ltTrack('chapter_start',{ch:ch.no});
  // beats：やり直しでも、まだ流していない beat があれば流す（流したものは beatPre で済みにする。30b_pro_fixes.js）
  const bA=(ch.beats||[]).map(b=>b.after),bPre=skipIntro?beatSeen(ch.no).filter(a=>bA.includes(a)):[];
  if(!skipIntro&&bA.length)beatSeenSet(ch.no,[]);
  const go=()=>startGame({
    ch,nanori:!skipIntro&&!(ch.no===1&&!loadCleared()),beatsOn:!skipIntro||bA.some(a=>!bPre.includes(a)),beatPre:bPre,title:`第${ch.no}章　${ch.venue}`,blinds:ch.blinds,
    seats:[{name:'あなた',chips:ch.you,human:true}].concat(chSeats(ch)),
    goal:ch.goal,hint:ch.hint,refill:!!ch.refill,tells:!!ch.tells,house:ch.house||null,lamp:ch.lamp,bgm:ch.bgm,lore:ch.lore||'',levels:ch.levels||null,levelHands:ch.levelHands||0});
  skipIntro?go():playScene(ch,ch.intro,()=>rumorScene(ch,go));
}
// クリアした店で遊ぶ：その店の照明・音・相手で、フリー対戦のルール
function startStore(ch,skipEp){
  const ep=!skipEp&&nextAfter(ch.no);
  if(ep){const t=loadStory();t.ep[ep.id]=1;saveStory(t);return playScene(ch,ep.lines,()=>startStore(ch,true))}
  startGame({ch:null,store:ch.no,title:`フリー対戦（${ch.venue}）`,blinds:[1000,2000],goal:{type:'free'},hint:null,refill:false,tells:true,house:ch.house||null,lamp:ch.lamp,bgm:ch.bgm,
    seats:[{name:'あなた',chips:100000,human:true}].concat(ch.opps.map(o=>({...o,chips:100000})))});
}
function startFree(){
  ltTrack('free_start',{size:+$('freeSize').value||4});
  startGame({ch:null,title:'フリー対戦'+($('freeSize').value==='6'?'（6人卓）':'')+(HOUSE[$('freeRule').value]?'（'+HOUSE[$('freeRule').value].name+'）':''),blinds:[1000,2000],goal:{type:'free'},hint:null,refill:false,tells:true,house:$('freeRule').value||null,lamp:'#e2b65b',bgm:0,
    seats:[{name:'あなた',chips:100000,human:true},{name:'ケンジ',style:'normal',chips:100000},{name:'ミサキ',style:'normal',chips:100000}].concat(freeSeats())});
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
  return(rude?[{name:'ゴウ',style:'rude'}]:[]).concat(got).map(o=>({...o,chips:100000}))
}
