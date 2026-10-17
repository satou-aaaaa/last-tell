/* ---------- 画面切り替え ---------- */
const fitOf=no=>LOOK_FIT.find(f=>f.need===no);   // その章でもらえる服
function show(id){if(id==='title'&&$('btnRun'))$('btnRun').hidden=loadCleared()<7;if(id!=='game'&&typeof Sound!=='undefined')Sound.stop();['title','chapters','scene','game','notebook','more'].forEach(s=>$(s).hidden=s!==id);window.scrollTo(0,0)}

function showChapters(){
  const cleared=loadCleared();
  const stars=loadStars();
  const items=CHAPTERS.map(c=>{
    const open=c.no<=cleared+1,sg=stars[c.no]||[0,0,0];
    return`<li class="ch${open?'':' locked'}" style="--chc:${c.color}"><span class="no">${c.no}</span>
      <span class="t">${esc(c.title)}${c.no<=cleared?'<span class="done">クリア</span>':''}${open?`<span class="stars3" aria-label="星 ${sg.reduce((a,b)=>a+b,0)}/3">${sg.map(x=>x?'★':'☆').join('')}</span>`:''}</span>
      <span class="act">${open?`<button class="${c.no===cleared+1?'primary':''}" data-ch="${c.no}">${c.no<=cleared?'もう一度':'はじめる'}</button>`:'<span class="hint">前の章をクリア</span>'}</span>
      <span class="v">${esc(c.venue)}${c.no<=cleared?`<span class="photo">${esc(hx('壁に〈主〉の写真'))}</span>`:''}${c.no<=cleared&&fitOf(c.no)?`<span class="fitgot">服：${esc(fitOf(c.no).n)}</span>`:''}<span class="reg">常連度 ${'★'.repeat(regLevel(c.no))+'☆'.repeat(2-regLevel(c.no))}</span>${c.no<=cleared?`<button class="mini storebtn" data-store="${c.no}">この店で遊ぶ${nextAfter(c.no)?'<i class="newep">後日談</i>':''}</button><button class="mini storebtn" data-memo="${c.no}">会話を見る</button>`:''}</span>${open?`<details class="stask"><summary>星の課題</summary><ol>${STARS[c.no].map(([n],i)=>`<li class="${sg[i]?'got':''}">${esc(n)}</li>`).join('')}</ol></details>`:''}</li>`;
  }).concat(LOCKED.map(c=>`<li class="ch locked"><span class="no">${c.no}</span><span class="t">${esc(c.title)}</span>
      <span class="act"><span class="hint">準備中</span></span><span class="v">${esc(c.venue)}</span></li>`));
  $('chList').innerHTML=items.join('');
  $('chList').querySelectorAll('[data-ch]').forEach(b=>b.onclick=()=>startChapter(CHAPTERS[b.dataset.ch-1]));
  $('chList').querySelectorAll('[data-store]').forEach(b=>b.onclick=()=>startStore(CHAPTERS[b.dataset.store-1]));
  $('chList').querySelectorAll('[data-memo]').forEach(b=>b.onclick=()=>{const ch=CHAPTERS[b.dataset.memo-1];
    playScene(ch,[].concat(ch.intro,...(ch.beats||[]).map(b=>b.lines),typeof ch.outro==='function'?ch.outro():ch.outro).filter(l=>!(l&&(l.flashback||l.askName||l.look||l.gotFit))),showChapters)});
  $('answerNote').textContent=cleared>=7?'答え合わせ：「会話を見る」で、ジンのクセにまつわる場面に印が付きます。':'';
  $('protList').innerHTML=PROTECTORS.map(pr=>{const ok=pr.ch<=cleared;
    return`<button class="pbtn${SETTINGS.protector===pr.id?' on':''}" data-pid="${pr.id}" ${ok?'':'disabled'} aria-pressed="${SETTINGS.protector===pr.id}">
      <span class="pic">${pr.id?(ok?protectorSVG(pr.id):'<span class="lk">？</span>'):'<span class="lk">―</span>'}</span><span>${ok?esc(pr.name):`第${pr.ch}章で`}</span></button>`}).join('');
  $('protList').querySelectorAll('[data-pid]').forEach(b=>b.onclick=()=>{SETTINGS.protector=b.dataset.pid;saveSettings();showChapters()});
  const got=loadTitles();
  {const ok=cleared>=7,u=loadUra();$('uraBox').hidden=!ok;if(ok){
    $('uraList').innerHTML=CHAPTERS.map(c=>{const b=c.opps[0].name,r=+u.rank[b]||0,nx=Math.min(8,r+1);
      return`<li><span><b>${esc(b)}</b><span class="dan">${r}段</span></span><button class="mini" data-ura="${c.no}">${nx}段に挑む</button><details><summary>${nx}段の縛り</summary><ol>${uraRules(b,nx).map(t=>`<li>${esc(t)}</li>`).join('')}</ol></details></li>`}).join('');
    $('uraList').querySelectorAll('[data-ura]').forEach(x=>x.onclick=()=>startUra(+x.dataset.ura))}}
  {const h=$('titleList').parentElement.querySelector('h3'),pn=SETTINGS.nick;if(h){h.setAttribute('data-noi18n','');h.innerHTML=pn?esc(I18N.lang==='en'?pn+"'s records":pn+'の記録')+`<small>${esc(tr('あるある称号'))}</small>`:esc(tr('あるある称号'))}}
  $('titleList').innerHTML=TITLES.map(t=>got[t.id]?`<li class="got"><b>${esc(t.name)}</b><span>${got[t.id]}回</span></li>`:`<li><b>？？？</b><span>${esc(t.hint)}</span></li>`).join('');
  p2Render();
  try{const g1=loadTitles();$('protBox').hidden=!PROTECTORS.some(p=>p.id&&p.ch<=cleared);$('titleBox').hidden=!Object.keys(g1).some(k=>g1[k])}catch(e){}
  show('chapters');
}
