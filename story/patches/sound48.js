/* ---------- 音（WebAudio・最初はオフ）：場面で変わる音楽をコードで作る（案A・research/音楽_実装仕様.md） ---------- */
// SETTINGS.sound：0=オフ 1=効果音だけ 2=すべて（古い保存の true は 2、false は 0 として読む）
SETTINGS.sound=SETTINGS.sound===true?2:Math.max(0,Math.min(2,Math.round(+SETTINGS.sound)||0));
const Sound=(()=>{
  let ac=null,master=null,fxOut=null,rev=null,buses={},noiseBuf=null,dead=false,gest=false,probe=null;
  let cur=null,song=null,mood='normal',autoPrev='',hushOn=false,timer=0,step=0,nextT=0,hb=0,drone=null,paused=false,riffle=0,stingEnd=0,stingHand='',live=0,autoN=0;
  const SFX=()=>!dead&&+SETTINGS.sound>=1,MUS=()=>!dead&&+SETTINGS.sound>=2;
  const gameHidden=()=>{const g=$('game');return !g||g.hidden};
  const mtof=m=>440*Math.pow(2,(m-69)/12);
  const res=()=>{try{const p=ac.resume();if(p&&p.catch)p.catch(()=>{})}catch(e){}};
  try{if(navigator.userActivation&&navigator.userActivation.hasBeenActive)gest=true}catch(e){}
  // 音の入口。使えない・止められているときは null を返し、ゲームは無音のまま進む
  function ctx(){
    if(dead)return null;
    try{
      if(!ac){if(!gest)return null;const A=window.AudioContext||window.webkitAudioContext;if(!A){dead=true;return null}
        ac=new A();
        const comp=ac.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=3;comp.connect(ac.destination);
        master=ac.createGain();master.gain.value=.65;master.connect(comp);
        fxOut=ac.createGain();fxOut.gain.value=.5;fxOut.connect(comp);
        // 部屋の響き（短めにして軽く）
        rev=ac.createConvolver();const len=Math.floor(ac.sampleRate*1.8),b=ac.createBuffer(2,len,ac.sampleRate);
        for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6)}
        rev.buffer=b;const rg=ac.createGain();rg.gain.value=.32;rev.connect(rg);rg.connect(master);
        for(const k of ['drums','bass','keys','pad','lead','fx']){const g=ac.createGain();g.gain.value=1;g.connect(master);buses[k]=g}
        probe=comp;
      }
      if(ac.state==='suspended'&&!paused&&gest)res();
      return ac;
    }catch(e){dead=true;ac=null;return null}
  }
  // 鳴り終わったらつなぎを外す（長く遊んでもノードが増えないように）
  function fin(src,nodes){live++;src.onended=()=>{live--;for(const n of nodes)try{n.disconnect()}catch(e){}}}
  function out(node,bus,wet,nodes){node.connect(buses[bus]);nodes.push(node);if(wet){const s=ac.createGain();s.gain.value=wet;node.connect(s);s.connect(rev);nodes.push(s)}}
  function noise(){if(!noiseBuf){const n=Math.floor(ac.sampleRate*1.5);noiseBuf=ac.createBuffer(1,n,ac.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1}const s=ac.createBufferSource();s.buffer=noiseBuf;return s}

  /* ---- 楽器 ---- */
  function epiano(m,t,dur,v){const f=mtof(m),c=ac.createOscillator(),mo=ac.createOscillator(),mg=ac.createGain(),g=ac.createGain(),lp=ac.createBiquadFilter(),N=[c,mo,mg,lp];
    c.frequency.value=f;mo.frequency.value=f;mg.gain.setValueAtTime(f*1.6,t);mg.gain.exponentialRampToValueAtTime(f*.15,t+.6);
    mo.connect(mg);mg.connect(c.frequency);lp.type='lowpass';lp.frequency.value=2600;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(v*.35,t+.4);g.gain.exponentialRampToValueAtTime(.0001,t+dur+.4);
    c.connect(lp);lp.connect(g);out(g,'keys',.35,N);c.start(t);mo.start(t);mo.stop(t+dur+.5);c.stop(t+dur+.5);fin(c,N)}
  function piano(m,t,dur,v){const f=mtof(m),g=ac.createGain(),lp=ac.createBiquadFilter(),N=[lp];lp.type='lowpass';lp.frequency.setValueAtTime(3200,t);lp.frequency.exponentialRampToValueAtTime(900,t+1.2);
    let last=null;[1,2.001,3.003].forEach((h,i)=>{const o=ac.createOscillator();o.type=i?'sine':'triangle';o.frequency.value=f*h;const og=ac.createGain();og.gain.value=[1,.35,.12][i];o.connect(og);og.connect(lp);N.push(o,og);o.start(t);o.stop(t+dur+1.2);last=o});
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+dur+1.1);lp.connect(g);out(g,'keys',.45,N);fin(last,N)}
  function bass(m,t,dur,v){const f=mtof(m),o=ac.createOscillator(),s=ac.createOscillator(),g=ac.createGain(),lp=ac.createBiquadFilter(),N=[o,s,lp];
    o.type='triangle';o.frequency.value=f;s.type='sine';s.frequency.value=f;lp.type='lowpass';lp.frequency.setValueAtTime(900,t);lp.frequency.exponentialRampToValueAtTime(320,t+.25);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.012);g.gain.exponentialRampToValueAtTime(v*.4,t+.18);g.gain.exponentialRampToValueAtTime(.0001,t+Math.max(dur,.2));
    o.connect(lp);s.connect(lp);lp.connect(g);out(g,'bass',.08,N);o.start(t);s.start(t);s.stop(t+Math.max(dur,.2)+.05);o.stop(t+Math.max(dur,.2)+.05);fin(o,N)}
  function ride(t,v){const n=noise(),hp=ac.createBiquadFilter(),bp=ac.createBiquadFilter(),g=ac.createGain(),N=[n,hp,bp];hp.type='highpass';hp.frequency.value=6500;bp.type='peaking';bp.frequency.value=9000;bp.gain.value=8;
    g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.35);n.connect(hp);hp.connect(bp);bp.connect(g);out(g,'drums',.2,N);n.start(t,Math.random());n.stop(t+.4);fin(n,N)}
  function brush(t,v,len){const n=noise(),bp=ac.createBiquadFilter(),g=ac.createGain(),N=[n,bp];bp.type='bandpass';bp.frequency.value=2600;bp.Q.value=.6;len=len||.22;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+len*.4);g.gain.exponentialRampToValueAtTime(.0001,t+len);n.connect(bp);bp.connect(g);out(g,'drums',.25,N);n.start(t,Math.random());n.stop(t+len+.05);fin(n,N)}
  function hat(t,v){const n=noise(),hp=ac.createBiquadFilter(),g=ac.createGain(),N=[n,hp];hp.type='highpass';hp.frequency.value=8000;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.05);n.connect(hp);hp.connect(g);out(g,'drums',0,N);n.start(t,Math.random());n.stop(t+.08);fin(n,N)}
  function kick(t,v){const o=ac.createOscillator(),g=ac.createGain(),N=[o];o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(42,t+.15);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.4);o.connect(g);out(g,'drums',0,N);o.start(t);o.stop(t+.45);fin(o,N)}
  function clank(t,v){const N=[];let last=null;[1,1.47,2.09,2.76].forEach((h,i)=>{const o=ac.createOscillator(),g=ac.createGain(),bp=ac.createBiquadFilter();o.type='square';o.frequency.value=310*h;g.gain.setValueAtTime(v*(.5-i*.1),t);g.gain.exponentialRampToValueAtTime(.0001,t+.5);bp.type='bandpass';bp.frequency.value=1800;o.connect(bp);bp.connect(g);N.push(o,bp);out(g,'drums',.5,N);o.start(t);o.stop(t+.55);last=o});fin(last,N)}
  function pad(m,t,dur,v){const g=ac.createGain(),lp=ac.createBiquadFilter(),N=[lp];lp.type='lowpass';lp.frequency.value=1100;let last=null;
    [-7,7].forEach(d=>{const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=mtof(m);o.detune.value=d;o.connect(lp);N.push(o);o.start(t);o.stop(t+dur+1.6);last=o});
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+Math.min(1.2,dur*.4));g.gain.setValueAtTime(v,t+dur);g.gain.linearRampToValueAtTime(0,t+dur+1.5);lp.connect(g);out(g,'pad',.5,N);fin(last,N)}
  function horn(m,t,dur,v,dark){const o=ac.createOscillator(),lfo=ac.createOscillator(),lg=ac.createGain(),bp=ac.createBiquadFilter(),lp=ac.createBiquadFilter(),g=ac.createGain(),N=[o,lfo,lg,bp,lp];
    o.type='sawtooth';o.frequency.value=mtof(m);lfo.frequency.value=5.2;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(6,t+dur*.6);lfo.connect(lg);lg.connect(o.detune);
    bp.type='bandpass';bp.frequency.value=dark?650:1150;bp.Q.value=1.6;lp.type='lowpass';lp.frequency.setValueAtTime(600,t);lp.frequency.linearRampToValueAtTime(dark?1100:2400,t+.08);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.05);g.gain.setValueAtTime(v*.85,t+dur*.8);g.gain.linearRampToValueAtTime(0,t+dur);
    o.connect(lp);lp.connect(bp);bp.connect(g);out(g,'lead',.55,N);o.start(t);lfo.start(t);lfo.stop(t+dur+.05);o.stop(t+dur+.05);fin(o,N)}
  function box(m,t,v){const f=mtof(m),N=[];let last=null;[1,4.01,9.2].forEach((h,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f*h;g.gain.setValueAtTime([v,v*.25,v*.08][i],t);g.gain.exponentialRampToValueAtTime(.0001,t+[2.2,.6,.25][i]);o.connect(g);N.push(o);out(g,'lead',.6,N);o.start(t);o.stop(t+2.3);last=o});fin(last,N)}
  function beatI(t){[[58,.32],[52,.24]].forEach(([f,v],i)=>{const o=ac.createOscillator(),g=ac.createGain(),N=[o];o.frequency.value=f;const tt=t+i*.17;g.gain.setValueAtTime(0,tt);g.gain.linearRampToValueAtTime(v,tt+.02);g.gain.exponentialRampToValueAtTime(.0001,tt+.22);o.connect(g);out(g,'fx',0,N);o.start(tt);o.stop(tt+.25);fin(o,N)})}
  function chipI(t){[3200,2600].forEach((f,i)=>{const n=noise(),bp=ac.createBiquadFilter(),g=ac.createGain(),N=[n,bp];bp.type='bandpass';bp.frequency.value=f+Math.random()*400;bp.Q.value=4;g.gain.setValueAtTime(.35-i*.12,t+i*.06);g.gain.exponentialRampToValueAtTime(.0001,t+i*.06+.04);n.connect(bp);bp.connect(g);out(g,'fx',0,N);n.start(t+i*.06,Math.random());n.stop(t+i*.06+.05);fin(n,N)})}

  /* ---- 曲のデータ（Dマイナー基準。key で店ごとに移調） ---- */
  const PROG=[{b:38,v:[53,57,60,64]},{b:34,v:[50,53,57,60]},{b:43,v:[53,57,58,62]},{b:45,v:[55,61,65,70]}];
  const UNDER=[{b:38,v:[50,53,57,60]},{b:39,v:[51,55,58,62]},{b:38,v:[50,53,57,60]},{b:45,v:[52,55,61,64]}];
  const SKY=[{b:38,v:[54,57,61,64]},{b:35,v:[50,54,57,61]},{b:43,v:[54,57,59,62]},{b:45,v:[55,61,66,71]}]; // Dmaj9–Bm9–Gmaj9–A13
  // ジンの主題：[小節,8分の位置,音,長さ(8分)]
  const MOTIF=[[0,0,69,3],[0,3,74,1],[0,4,72,2],[0,6,69,2],[1,0,67,3],[1,3,65,1],[1,4,64,4],[2,0,62,2],[2,2,65,2],[2,4,69,2],[2,6,72,2],[3,0,70,6]];
  const SONGS={ // bgm 番号（＝店）→ 曲
    0:{bpm:112,swing:.66,key:1,prog:PROG,keys:epiano,comp:[[0,1],[3,2],[6,1]],bassS:'walk',drums:'ride'},           // フリー対戦：月影の形を少し遅く
    1:{bpm:70,swing:.6,key:0,prog:PROG,keys:epiano,comp:[[0,8]],bassS:'two',drums:'brush',motif:true},                // 錨亭
    2:{bpm:76,swing:.6,key:2,prog:PROG,keys:piano,comp:[[0,8]],bassS:'two',drums:'brush',dv:.5},                       // 銀の扉
    3:{bpm:132,swing:.66,key:3,prog:PROG,keys:epiano,comp:[[0,1],[3,2],[6,1]],bassS:'walk',drums:'ride'},              // 月影
    4:{bpm:90,swing:.5,key:0,prog:SKY,keys:piano,comp:[[0,2],[3,1],[5,3]],bassS:'pulse',drums:'pulse',padOn:true},     // 天空：王冠の形を明るく
    5:{bpm:96,swing:.5,key:-4,prog:UNDER,keys:epiano,comp:[[0,1],[6,2]],bassS:'under',drums:'under',padOn:true},      // 地下の賭場跡
    6:{bpm:84,swing:.5,key:-2,prog:PROG,keys:piano,comp:[[0,2],[3,1],[5,3]],bassS:'pulse',drums:'pulse',padOn:true},   // 王冠
    7:{bpm:72,swing:.6,key:0,prog:PROG,theme:'jin'},                                                                  // 錨亭、閉店後：ジンの主題
    memory:{bpm:66,swing:.6,key:0,prog:PROG,theme:'memory'},                                                          // 回想（オルゴール）
    crow:{bpm:92,swing:.5,key:-1,prog:UNDER,theme:'crow'},                                                            // クロウ（主題を半音下げて暗い金管）
    moyai:{bpm:66,swing:.58,key:-1,prog:PROG,keys:epiano,comp:[[0,4],[4,4]],bassS:'two',drums:'brush',dv:.6,padOn:true}, // 第二部の汐見の古い店「舫」
  };
  for(const k in SONGS)SONGS[k].id=k;
  const LV={calm:{drums:.25,bass:.8,keys:.7,pad:.6,lead:1,fx:1},normal:{drums:1,bass:1,keys:1,pad:.8,lead:1,fx:1},tension:{drums:1,bass:.9,keys:.6,pad:1,lead:0,fx:1},allin:{drums:0,bass:0,keys:0,pad:0,lead:0,fx:1}};

  // 第6章（クロウの卓）の終盤レベルと、クロウとの一騎打ち。どちらも卓に見えている情報だけで決める
  function crowNow(){
    if(!CFG||!CFG.ch||CFG.ch.no!==6||!S||!S.players)return false;
    const crow=S.players.find(p=>p.name==='クロウ');if(!crow||crow.out)return false;
    if(S.players.filter(p=>!p.out).length===2)return true;
    return !!(CFG.levels&&CFG.levelHands&&S.handNo>0&&Math.floor((S.handNo-1)/CFG.levelHands)>=CFG.levels.length-2);
  }
  function pick(n){let k=n;
    try{if(typeof CFG!=='undefined'&&CFG){if(CFG.flashback)k='memory';else if(CFG.ch&&CFG.ch.p2===2)k='moyai';else if(crowNow())k='crow'}}catch(e){}
    return SONGS[k]||SONGS[0]}

  function busTo(levels,sec){const t=ac.currentTime;for(const k in levels){const p=buses[k].gain;p.cancelScheduledValues(t);p.setValueAtTime(p.value,t);p.linearRampToValueAtTime(levels[k],t+(sec||1.2))}}
  function startDrone(){if(drone||!song)return;const t=ac.currentTime,g=ac.createGain(),k=song.key,N=[g];g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.22,t+3);
    const os=[mtof(26+k),mtof(26+k)*1.5,mtof(27+k)].map((f,i)=>{const o=ac.createOscillator();o.type=i?'sine':'triangle';o.frequency.value=f;o.detune.value=i*4;o.connect(g);o.start(t);N.push(o);return o});
    const n=noise();n.loop=true;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=220;const ng=ac.createGain();ng.gain.value=.5;n.connect(lp);lp.connect(ng);ng.connect(g);n.start(t);N.push(n,lp,ng);
    out(g,'fx',.4,N);live++;drone={g,os,n,N}}
  function stopDrone(){if(!drone||!ac)return;const d=drone;drone=null;try{const t=ac.currentTime;d.g.gain.cancelScheduledValues(t);d.g.gain.setValueAtTime(d.g.gain.value,t);d.g.gain.linearRampToValueAtTime(0,t+.8)}catch(e){}
    setTimeout(()=>{try{d.os.forEach(o=>o.stop());d.n.stop()}catch(e){}for(const x of d.N)try{x.disconnect()}catch(e){}live--},1000)}

  function scheduleStep(s,t,e8){ // s：曲の頭からの8分の数
    const V=song,bar=Math.floor(s/8),p=s%8,ch=V.prog[bar%4],k=V.key,beat=e8*2,dv=V.dv||1;
    if(mood==='allin'){ // 鼓動だけ。だんだん速く
      if(p%2===0){hb++;const every=Math.max(1,4-Math.floor(hb/8));if(hb%every===0)beatI(t)}
      if(p===5&&Math.random()<.35)chipI(t);return}
    if(mood==='tension'){ // ドラムは足のハイハットだけ、ベースは同じ音を8分で、不安な和音を伸ばす、2小節ごとに鼓動
      const tc=V.prog[3];
      if(p%2===0)hat(t,.12);
      bass(tc.b+k,t,e8*.9,.22);
      if(p===0){tc.v.forEach((m,i)=>pad(m+k-12*(i>1?1:0),t,beat*4*.95,.03));if(bar%2===0)beatI(t+beat*2)}
      if(p===6&&Math.random()<.5)chipI(t);
      return}
    if(V.theme)return themeStep(V,bar,p,t,e8);
    // ドラム
    if(V.drums==='ride'){if(p%2===0||p===3||p===7)ride(t,p%2?.07:.11);if(p===2||p===6)hat(t,.1);if(p===0&&bar%4===3)kick(t,.25)}
    else if(V.drums==='brush'){if(p%2===0)brush(t,.09*dv,beat*.9);if(p===2||p===6)brush(t,.13*dv,.12)}
    else if(V.drums==='pulse'){if(p===0||p===4)kick(t,.35);if(p%2===1)hat(t,.06);if(p===4)brush(t,.08,.3)}
    else if(V.drums==='under'){if(p===0||p===3||p===4)kick(t,.45);if(p===6)clank(t,.12);if(p%2===1)hat(t,.05)}
    // ベース
    if(V.bassS==='walk'){if(p%2===0){const nb=V.prog[(bar+1)%4].b,seq=[ch.b,ch.b+7,ch.b+(ch.v[0]%12===(ch.b+3)%12?3:4),nb+1];bass(seq[p/2]+k,t,beat*.9,.34)}}
    else if(V.bassS==='two'){if(p===0)bass(ch.b+k,t,beat*3,.36);if(p===6)bass(ch.b+7+k,t,beat,.26)}
    else if(V.bassS==='pulse'){if(p%2===0)bass(ch.b+k,t,e8*1.6,.24)}
    else{if(p===0||p===3)bass(ch.b+k,t,e8*2.5,.38);if(p===6)bass(ch.b+k+12,t,e8,.2)}
    // 和音（考え中は1拍目だけ）
    const sparse=mood==='calm';
    V.comp.forEach(([at,len],i)=>{if(p===at&&(!sparse||i===0))ch.v.forEach((m,j)=>V.keys(m+k,t+j*.012,e8*len,sparse?.045:.06))});
    if(V.padOn&&p===0)ch.v.forEach(m=>pad(m+k-12,t,beat*4*.95,.02));
    // 錨亭は8小節ごとに主題を薄く
    if(V.motif&&bar%8>=4&&!sparse)MOTIF.forEach(([b,q,m,l])=>{if(b===bar%4&&q===p)horn(m+k,t,e8*l*.95,.07)});
  }
  function themeStep(V,bar,p,t,e8){
    const ch=PROG[bar%4],beat=e8*2;
    if(V.theme==='jin'){ // 主題をはっきり。ドラムはブラシだけ
      if(p%2===0)brush(t,.07,beat*.9);if(p===2||p===6)brush(t,.11,.12);
      if(p===0)bass(ch.b,t,beat*3,.34);if(p===6)bass(ch.b+7,t,beat,.24);
      if(p===0&&mood!=='calm'||p===0&&bar%2===0)ch.v.forEach((m,j)=>epiano(m,t+j*.015,e8*7,.05));
      MOTIF.forEach(([b,q,m,l])=>{if(b===bar%4&&q===p)horn(m,t,e8*l*.95,.13)});
    }else if(V.theme==='memory'){
      MOTIF.forEach(([b,q,m,l])=>{if(b===bar%4&&q===p)box(m+12,t,.2)});
      if(p===0)box(ch.b+24,t,.05);if(p===4)box(ch.v[1]+12,t,.04);
      if(p===0)ch.v.forEach(m=>pad(m,t,beat*4*.9,.012));
    }else{ // crow：半音下げ、低く暗い金管。下で地下のリズム
      const k=-13;
      if(p===0||p===3||p===4)kick(t,.4);if(p===6)clank(t,.1);
      if(p===0||p===3)bass(UNDER[bar%4].b-1,t,e8*2.5,.36);
      if(p===0)UNDER[bar%4].v.forEach(m=>pad(m-13,t,beat*4*.95,.03));
      MOTIF.forEach(([b,q,m,l])=>{if(b===bar%4&&q===p)horn(m+k,t,e8*l*.95,.16,true)});
    }
  }
  // 見えている情報だけで場面を決める（伏せた札の強さやCPUのテルは見ない）
  function auto(){
    if(typeof S==='undefined'||!S||!S.players||gameHidden())return;
    if(cur!=null){const v=pick(cur);if(v!==song){song=v;step=Math.ceil(step/8)*8;stopDrone();if(mood==='allin')startDrone()}}
    let m='normal';
    if(S.runout&&!S.handOver)m='allin';
    else if(hushOn&&!S.handOver)m='tension';
    else if(!S.handOver&&S.toAct>=0){const me=S.players[S.toAct];
      if(me&&me.human){const tc=S.currentBet-me.bet;m=tc>0&&tc>=Math.max(BB()*6,me.chips*.4)?'tension':'calm'}}
    if(m!==autoPrev){autoPrev=m;setMood(m)}  // 変わったときだけ（setMood を外から呼んだ値は次の変化まで残る）
  }
  function tick(){
    try{
      if(!ac||!song)return;
      if((++autoN&7)===0)auto();
      const V=song,beat=60/V.bpm,e8=beat/2,now=ac.currentTime;
      if(now<stingEnd){nextT=stingEnd;step=0;return}
      if(nextT<now-.25){nextT=now+.05;step=Math.ceil(step/8)*8} // 遅れたら追いかけずに小節の頭から
      let guard=0;
      while(nextT<now+.15&&guard++<12){const p=step%2,t=nextT+(p?(V.swing-.5)*beat:0);scheduleStep(step,t,e8);step++;nextT+=e8}
    }catch(e){}
  }
  function halt(){clearInterval(timer);timer=0}
  function run(){
    halt();if(!MUS()||paused||cur==null||!ctx())return;
    try{song=pick(cur);step=0;hb=0;nextT=ac.currentTime+.08;autoPrev='';stingEnd=0;
      busTo(LV[mood]||LV.normal,.3);if(mood==='allin')startDrone();
      timer=setInterval(tick,25);tick()}catch(e){halt()}
  }
  function setMood(m){
    if(!LV[m])return;const was=mood;mood=m;if(was!==m)hb=0;
    if(!ac||!timer)return;
    try{busTo(LV[m]);if(m==='allin')startDrone();else stopDrone()}catch(e){}
  }
  // 結果の音：大きなポットだけ（小さいポットは今の効果音のまま）
  function sting(win){
    try{const c=ctx();if(!c)return false;const t=c.currentTime+.05,k=song?song.key:0;
      stingEnd=t+3.3;stopDrone();busTo(LV.normal,.25);mood='normal';hb=0;
      if(win){[50,57,61,64,69].forEach((m,i)=>epiano(m+k,t+i*.03,2.6,.07));bass(38+k,t,3,.4);[[69,0,.35],[74,.36,.35],[76,.72,.35],[81,1.08,1.6]].forEach(([m,d,l])=>horn(m+k,t+d,l,.13));ride(t,.12);ride(t+1.08,.1);[0,.12,.2,.3].forEach(d=>chipI(t+.4+d))}
      else{[53,57,60,63].forEach((m,i)=>epiano(m+k-12,t+i*.05,3.2,.06));bass(31+k,t,3.5,.42);horn(62+k,t+.5,1.1,.08,true);horn(61+k,t+1.6,1.8,.07,true)}
      return true}catch(e){return false}
  }
  function resultSting(kind){
    if(!timer||!MUS()||typeof S==='undefined'||!S||!S.handOver||!S.players)return false;
    const key=S.handNo+'|'+(CFG&&CFG.title);if(stingHand===key)return false;
    const me=S.players.find(p=>p.human);if(!me)return false;const big=BB()*15;
    if(kind==='win'&&me.won>=big){stingHand=key;return sting(true)}
    if(kind==='chip'&&!me.won&&!me.folded&&me.total>=big){stingHand=key;return sting(false)}
    return false;
  }

  /* ---- 効果音（今の音のまま） ---- */
  function tone(f,dur,vol,wave,at){
    const c=ctx();if(!c)return;const t=c.currentTime+(at||0);
    const o=c.createOscillator(),g=c.createGain();o.type=wave||'sine';o.frequency.value=f;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+Math.min(.6,dur/3));g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g);g.connect(fxOut);o.start(t);o.stop(t+dur+.05);fin(o,[o,g])}
  function click(f,vol){const c=ctx();if(!c)return;const t=c.currentTime;
    const b=c.createBuffer(1,Math.floor(c.sampleRate*.04),c.sampleRate),d=b.getChannelData(0);for(let k=0;k<d.length;k++)d[k]=(Math.random()*2-1)*Math.pow(1-k/d.length,3);
    const s=c.createBufferSource(),bp=c.createBiquadFilter(),g=c.createGain();bp.type='bandpass';bp.frequency.value=f;bp.Q.value=4;g.gain.value=vol;
    s.buffer=b;s.connect(bp);bp.connect(g);g.connect(fxOut);s.start(t);fin(s,[s,bp,g])}
  const safe=f=>function(){try{return f.apply(this,arguments)}catch(e){}};
  // 最初の操作のあとで音を始める（自動再生の制限に合わせる）
  const onGesture=()=>{gest=true;try{if(!SFX())return;if(ac){if(!paused&&ac.state==='suspended')res()}else ctx();
    if(MUS()&&!paused&&cur!=null&&!timer&&!gameHidden())run()}catch(e){}};
  try{['pointerdown','keydown','touchend'].forEach(e=>addEventListener(e,onGesture,{capture:true,passive:true}))}catch(e){}
  return{
    sfx:safe(function(kind){if(!SFX()||paused)return;
      if((kind==='win'||kind==='chip')&&resultSting(kind))return;
      if(kind==='chip'){click(3200,.5);setTimeout(()=>{if(SFX()&&!paused)click(2600,.35)},60)}
      else if(kind==='card')click(1400,.35);
      else if(kind==='turn'){tone(880,.08,.05,'sine');tone(1320,.08,.04,'sine',.07)}
      else if(kind==='win'){[523,659,784].forEach((f,j)=>tone(f,.5,.06,'triangle',j*.08))}}),
    // 静まり返る：音楽は「大きな賭け」の鳴り方にし、チップをいじる音を足す。false で普通に戻す
    hush:safe(function(on){clearInterval(riffle);riffle=0;hushOn=!!on;
      if(on){if(SFX()&&!paused)riffle=setInterval(()=>{if(!SFX()||paused){clearInterval(riffle);riffle=0;return}click(3000+Math.random()*600,.18);setTimeout(()=>{if(SFX()&&!paused)click(2700,.12)},70)},650);setMood('tension')}
      else{setMood('normal');autoPrev='';if(MUS()&&!paused&&cur!=null&&!timer&&!gameHidden())run()}}),
    murmur:safe(function(loud){if(!SFX()||paused)return;const c=ctx();if(!c)return;const t=c.currentTime,dur=loud?1.4:.8;
      const b=c.createBuffer(1,Math.floor(c.sampleRate*dur),c.sampleRate),d=b.getChannelData(0);for(let k=0;k<d.length;k++)d[k]=(Math.random()*2-1)*Math.sin(Math.PI*k/d.length);
      const s=c.createBufferSource(),lp=c.createBiquadFilter(),g=c.createGain();lp.type='lowpass';lp.frequency.value=600;g.gain.setValueAtTime(.14,t);
      if(loud){g.gain.linearRampToValueAtTime(.32,t+.2);g.gain.setValueAtTime(.32,t+.8);g.gain.linearRampToValueAtTime(.12,t+1.1)}
      s.buffer=b;s.connect(lp);lp.connect(g);g.connect(fxOut);s.start(t);fin(s,[s,lp,g])}),
    heart:safe(function(){if(!SFX()||paused)return;tone(58,.18,.3,'sine');tone(52,.2,.22,'sine',.16)}),
    thud:safe(function(){if(!SFX()||paused)return;tone(46,.6,.32,'sine');click(900,.4)}),
    // n：店の番号（CFG.bgm）。'memory' 'crow' のような名前でもよい。曲がない番号は 0 の曲
    bgm:safe(function(n){cur=n==null?0:n;mood='normal';autoPrev='';hushOn=false;stingEnd=0;halt();if(ac)stopDrone();if(!MUS()||paused)return;run()}),
    setMood:safe(function(m){setMood(m)}),
    stop:safe(function(){halt();clearInterval(riffle);riffle=0;if(ac){stopDrone();try{busTo(LV.normal,.1)}catch(e){}}mood='normal';autoPrev=''}),
    // 裏に回ったときや広告の表示中は止め、戻ったら小節の頭から再開する
    pause:safe(function(){paused=true;halt();clearInterval(riffle);riffle=0;if(ac){stopDrone();try{if(ac.state==='running')ac.suspend()}catch(e){}}}),
    resume:safe(function(){if(!paused)return;paused=false;if(ac&&SFX())res();if(MUS()&&cur!=null&&!gameHidden())run()}),
    _dbg(){let peak=0;try{if(ac&&probe){if(!probe._an){const a=ac.createAnalyser();a.fftSize=2048;probe.connect(a);probe._an=a}const d=new Float32Array(2048);probe._an.getFloatTimeDomainData(d);for(const x of d)peak=Math.max(peak,Math.abs(x))}}catch(e){}
      return{live,playing:!!timer,mood,song:song&&song.id,state:ac?ac.state:'none',peak,dead}},
  };
})();
document.addEventListener('visibilitychange',()=>document.hidden?Sound.pause():Sound.resume());
window.Sound=Sound; // C-5：アプリ側が広告の前後で Sound.pause()／Sound.resume() を呼ぶ
function renderSound(){$('btnSound').textContent='音：'+['オフ','効果音だけ','すべて'][+SETTINGS.sound||0]}
