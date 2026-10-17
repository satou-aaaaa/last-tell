// ===== 相手の名前の見せ方（案2＋案3、2026-10-10 satou 決定。仕様 research/相手の名前の見せ方_実装仕様.md） =====
// ふだんの名札は名前を出さない。動いた時・声を出した時・タップした時だけ、名札の上の行に呼び名が少し出る。
// 呼び名は、知っている相手なら名前、知らない相手（顔なじみ帳のページが開く前の常連・初日の船の客）なら見た目の呼び名。
// 名札は .nm の中だけを直す（.tag／.chp／.mystack は触らない）。保存キーは増やさない。
const LOOKNAME={
  'マツ':{ja:'丸眼鏡',en:'Round specs'},'ナギ':{ja:'黄色い髪留め',en:'Yellow hair tie'},'アデ':{ja:'紺の作業着',en:'Navy workwear'},'マリア':{ja:'金のネックレス',en:'Gold necklace'},
  'ヨシオ':{ja:'角眼鏡',en:'Square specs'},'リン':{ja:'ミントのシャツ',en:'Mint tee'},'ハンナ':{ja:'緑の作業着',en:'Green workwear'},'ラジ':{ja:'からし色の上着',en:'Mustard jacket'},
  'カズ':{ja:'紫の上着',en:'Purple jacket'},'サヤ':{ja:'白いニット',en:'White knit'},'ウォルター':{ja:'茶色の上着',en:'Brown jacket'},'スミン':{ja:'銀のピアス',en:'Silver earrings'},
  'シオン':{ja:'青緑のシャツ',en:'Teal shirt'},'アキラ':{ja:'赤い上着',en:'Red jacket'},'ルカ':{ja:'巻き毛',en:'Curly hair'},'アイシャ':{ja:'青緑のスカーフ',en:'Teal scarf'},
  'ガン':{ja:'赤いシャツ',en:'Red tee'},'ドク':{ja:'口ひげ',en:'Moustache'},'ベン':{ja:'茶色のニット',en:'Brown knit'},'ミン':{ja:'橙のワッペン',en:'Orange patch'},
  'レン':{ja:'水色のシャツ',en:'Light-blue tee'},'イオリ':{ja:'灰色のニット',en:'Grey knit'},'ソフィア':{ja:'銀のネックレス',en:'Silver necklace'},'タケル':{ja:'黒いスーツ',en:'Black suit'},
  'クワメ':{ja:'黄色いシャツ',en:'Yellow tee'},'イネス':{ja:'紺のニット',en:'Navy knit'},'ラース':{ja:'赤いニット',en:'Red knit'},'ファティマ':{ja:'金のピアス',en:'Gold earrings'},
  'メイ':{ja:'桃色のシャツ',en:'Pink tee'},'オリビア':{ja:'赤縁の眼鏡',en:'Red-rimmed specs'}};
// 名乗りのひと言（知らない相手が知っている相手に変わる時に1回だけ）。お金の話・「夜」は入れない
const INTRO_LINE={
  'マツ':{ja:'マツだ。……覚えとくといい',en:'Matsu. ...Worth remembering.'},'ナギ':{ja:'ナギ！ 港で働いてるよ',en:'Nagi! I work at the docks.'},
  'アデ':{ja:'アデだ。船が出るまで、よろしく',en:'Ade. Till my ship leaves.'},'マリア':{ja:'マリアよ。ふうん、続くのね',en:"Maria. Hm, you're sticking around."},
  'ヨシオ':{ja:'ヨシオです。以後お見知りおきを',en:'Yoshio. A pleasure.'},'リン':{ja:'リン、です。よろしく……',en:"I'm Rin... nice to meet you."},
  'ハンナ':{ja:'……ハンナ。',en:'...Hanna.'},'ラジ':{ja:'ラジだ。そろそろ名前くらいはな',en:'Raj. About time we swapped names.'},
  'カズ':{ja:'カズでいいよ',en:'Just call me Kazu.'},'サヤ':{ja:'サヤです。顔、覚えました',en:'Saya. I remember your face.'},
  'ウォルター':{ja:'ウォルターだ。いい卓だな',en:'Walter. Good table.'},'スミン':{ja:'スミン。よろしく',en:'Sumin. Hey.'},
  'シオン':{ja:'シオンよ',en:'Shion.'},'アキラ':{ja:'アキラ。覚えといて',en:'Akira. Remember it.'},'ルカ':{ja:'ルカだ。また会ったな',en:'Luca. We meet again.'},
  'アイシャ':{ja:'アイシャです。よろしく',en:'Aisha. Nice to meet you.'},'ガン':{ja:'ガンだ！ がはは',en:'Gan! Ha!'},'ドク':{ja:'皆はドクと呼ぶ',en:'They call me Doc.'},
  'ベン':{ja:'ベンだ',en:'Ben.'},'ミン':{ja:'ミンっす。よろしく',en:'Min. Good to meet you.'},'レン':{ja:'あ、レンです！',en:"Oh, I'm Ren!"},
  'イオリ':{ja:'イオリ。……それだけ',en:"Iori. ...That's all."},'ソフィア':{ja:'ソフィアよ。お見知りおきを',en:'Sofia. Charmed.'},'タケル':{ja:'（メモ）タケル',en:'(note) Takeru'},
  'クワメ':{ja:'クワメだ。よろしくな',en:'Kwame. Good to meet you.'},'イネス':{ja:'イネスよ。リスボンから',en:'Inês. From Lisbon.'},
  'ラース':{ja:'ラースだ。ベルゲンから来た',en:'Lars. Came from Bergen.'},'ファティマ':{ja:'ファティマ。よろしくね',en:'Fatima. Nice to meet you.'},
  'メイ':{ja:'メイだよ。よろしく！',en:"I'm Mei. Hi!"},'オリビア':{ja:'オリビアです。いい卓ね',en:'Olivia. Lovely table.'}};
const NM_SHOW=1800;   // 呼び名が出ている時間（ms）
const nmEn=()=>typeof SETTINGS!=='undefined'&&SETTINGS.lang==='en';
// 卓に着く前の「誰に聞く？」で話を聞いた相手は、名前を知っている（このページを開いている間）
const NM_ASKED={};
function knownName(n){
  if(NM_ASKED[n])return true;
  if(typeof CFG!=='undefined'&&CFG.flashback)return true;       // あの日の回想はジンの席から見ているので、全員知っている
  if(S&&S.introduced&&S.introduced[n])return true;
  if(MOBS[n])return mobH(n)>=10;                                  // 顔なじみ帳のページが開いた常連
  if(SHIP[n])return (+loadMobAll().ship[n]||0)>=2;                // 船の客は2日目から
  return true;                                                    // 物語の相手は名前で出す
}
function lookOf(n){const L=LOOKNAME[n];return L?(nmEn()?L.en:L.ja):n}
// 卓で見せる呼び名。同じ卓に同じ見た目の呼び名が2人いたら、後ろの席に番号を付ける
function who(n){
  if(knownName(n)||!LOOKNAME[n])return n;
  const lk=lookOf(n);
  if(S&&S.players){const i=S.players.findIndex(p=>p.name===n),dup=S.players.some((p,k)=>k<i&&!p.human&&p.name!==n&&!knownName(p.name)&&lookOf(p.name)===lk);
    if(dup)return lk+(nmEn()?` (seat ${i+1})`:`（${i+1}番）`)}
  return lk;
}
// 知らない相手の名前を、卓に出る文の中で呼び名に置き換える
function whoText(t){
  if(!t||!S||!S.players)return t;
  S.players.forEach(p=>{if(!p.human&&LOOKNAME[p.name]&&!knownName(p.name)&&t.includes(p.name))t=t.split(p.name).join(who(p.name))});
  return t;
}
function nmIntro(p){
  if(!S||!p||p.human||p.out||knownName(p.name)||!INTRO_LINE[p.name])return;
  S.introduced=S.introduced||{};S.introduced[p.name]=true;S.nmFlip=S.nmFlip||{};S.nmFlip[p.name]=performance.now();
  const i=S.players.indexOf(p),L=INTRO_LINE[p.name];
  if(i>0)setTimeout(()=>{if(S.players[i]===p&&!p.out)sayLine(i,nmEn()?L.en:L.ja)},400*(typeof SPEED==='function'?SPEED():1));
}
// 常連：顔なじみ帳のページが開く（10ハンド）その時に名乗る。ログに名前が出るより先に「知っている」にする
{const o=mobCount;mobCount=function(){
  try{if(S&&S.players&&!CFG.flashback)S.players.forEach(p=>{if(!p.human&&!p.out&&MOBS[p.name]&&mobH(p.name)===9&&!knownName(p.name))nmIntro(p)})}catch(e){}
  return o.apply(this,arguments)}}
// 船の客：初めて会った日の、同じ卓での3ハンド目の始めに名乗る
{const o=startHand;startHand=function(){
  const r=o.apply(this,arguments);
  try{if(S&&S.players&&!CFG.flashback){S.nmHands=S.nmHands||{};
    S.players.forEach(p=>{if(p.human||p.out||!SHIP[p.name])return;const c=S.nmHands[p.name]=(S.nmHands[p.name]||0)+1;
      if(c===3&&(+loadMobAll().ship[p.name]||0)===1)nmIntro(p)})}}catch(e){}
  return r}}
// 名札・吹き出し・卓の文
function nmAfterRender(){
  if(!S||!S.players)return;
  const now=performance.now(),heads=typeof N==='function'&&N()===2;let next=0,flip=false;
  S.nmSeen=S.nmSeen||{};
  S.players.forEach((p,i)=>{
    if(p.human||i===0)return;
    const pl=$('plate'+i),sy=$('say'+i);if(!pl)return;
    const st=S.nmSeen[i]&&S.nmSeen[i].name===p.name?S.nmSeen[i]:(S.nmSeen[i]={name:p.name,act:p.actSeq,say:p.say&&p.say.seq,until:0});
    if(p.actSeq!==st.act){st.act=p.actSeq;if(p.actKind&&!p.sitOut)st.until=now+NM_SHOW}
    const sq=p.say&&p.say.line?p.say.seq:st.say;
    if(sq!==st.say){st.say=sq;st.until=now+NM_SHOW}
    const on=now<st.until&&!p.sitOut,nm=pl.querySelector('.nm');
    if(nm){const kn=knownName(p.name),lang=nm.querySelector('.lang');
      if(on){const t=who(p.name),fl=S.nmFlip&&now-(S.nmFlip[p.name]||-1e9)<1200;
        nm.innerHTML='';nm.append(t);if(lang)nm.append(lang);
        if(!st.shown)flip=true;nm.className='nm nm-on'+(kn?'':' nm-look')+(fl?' nm-flip':'')+(st.shown?'':' nm-in');st.shown=true;
        next=next?Math.min(next,st.until):st.until}
      else{if(st.shown)flip=true;nm.className='nm nm-off';nm.textContent='';st.shown=false}}
    if(pl.title&&!pl.title.startsWith(who(p.name)+'：'))pl.title=who(p.name)+'：'+pl.title;
    // 吹き出しの頭に小さく呼び名（1対1の卓では付けない）
    if(sy&&!heads&&sy.textContent&&!sy.querySelector('.nmwho')&&p.say&&p.say.line){
      const b=document.createElement('b');b.className='nmwho';b.textContent=who(p.name);sy.prepend(b)}
  });
  const m=$('msg');if(m&&m.textContent){const t=whoText(m.textContent);if(t!==m.textContent)m.textContent=t}
  // 名前の行が出たり消えたりして名札の幅が変わったら、アクションの札の縮め方もすぐ直す（fitTags は200msごと）
  if(flip)layoutSoon();   // 動作の重さの改善 案3：fitTags は次のコマの位置合わせ（36_layout_pass）で
  clearTimeout(S.nmT);if(next)S.nmT=setTimeout(()=>render(),Math.max(30,next-now+30));
}
{const o=render;render=function(){const r=o.apply(this,arguments);try{nmAfterRender()}catch(e){}return r}}
// 名札をタップした時も呼び名を出す（今のタップ＝チップを見る、と同じタップ）
$('plates').addEventListener('click',e=>{const pl=e.target.closest&&e.target.closest('.plate');if(!pl||!S||!S.nmSeen)return;
  const i=+pl.id.replace('plate','');const st=S.nmSeen[i];if(st){st.until=performance.now()+NM_SHOW;setTimeout(()=>render(),0)}},true);
{const o=openStackZoom;openStackZoom=function(i){const r=o.apply(this,arguments);
  try{const p=S.players[i],h=$('stackZoom')&&$('stackZoom').querySelector('h3')||document.querySelector('.szin h3');if(p&&h)h.textContent=whoText(h.textContent)}catch(e){}return r}}
// オールインの切り出し：知らない相手は呼び名で
{const o=cutIn;cutIn=function(name){const r=o.apply(this,arguments);try{const b=$('cutin').querySelector('.ctext b');if(b&&b.textContent===name)b.textContent=who(name)}catch(e){}return r}}
// 卓のログ（ハンドの記録）にも、知らない相手は呼び名で書く
{const o=log;log=function(text,head){return o.call(this,whoText(text),head)}}
// 対戦の始めの相手紹介：知らない相手は呼び名で
{const o=showVersus;showVersus=function(done){const r=o.apply(this,arguments);
  try{const opps=S.players.filter(p=>!p.human);document.querySelectorAll('#vs .vscard .vsname').forEach((el,k)=>{const p=opps[k];if(!p||knownName(p.name))return;
    const s=el.querySelector('.stars');el.textContent=who(p.name);if(s)el.append(s)})}catch(e){}return r}}
// 見た目の呼び名を英語の辞書にも丸ごと入れる（「紺のニット」が「紺の Knit」と半分だけ訳されないように）
try{Object.keys(LOOKNAME).forEach(k=>{const L=LOOKNAME[k];if(L&&L.ja&&L.en&&EN_DICT[L.ja]===undefined)EN_DICT[L.ja]=L.en})}catch(e){}
