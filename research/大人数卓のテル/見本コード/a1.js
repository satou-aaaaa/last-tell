(function(){const port=()=>matchMedia('(orientation:portrait) and (max-width:699px)').matches;
function fix(){if(!port()||N()<6)return;const cam=document.getElementById('cam');let side=document.getElementById('bustsSide');
 if(!side){side=document.createElement('div');side.id='bustsSide';side.className='busts side';cam.insertBefore(side,document.getElementById('plates'))}
 ['1','5'].forEach(k=>{const b=document.getElementById('bust'+k);if(b&&b.parentElement!==side)side.appendChild(b)});
 const sp=i=>document.getElementById('spot'+i);
 const P={1:[18,31],5:[82,31],2:[29,13],3:[50,13],4:[71,13]};
 for(const k in P){const e=sp(k);if(e){e.style.left=feltX(P[k][0])+'%';e.style.top=P[k][1]+'%'}}
 ['1','5'].forEach(k=>{const s=document.getElementById('say'+k);if(s){s.style.left=(k==='1'?15:85)+'%'}});}
const o=buildSeats;buildSeats=function(){const s=document.getElementById('bustsSide');if(s)s.innerHTML='';const r=o.apply(this,arguments);fix();return r};fix();})();
