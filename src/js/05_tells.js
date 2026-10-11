/* ---------- テル（クセ）：rate=その状態で出る確率、false=関係ないときに出る確率 ---------- */
const TELLS={
  'ゲン':{strong:{cue:'smile',rate:.75,false:.1},bluff:{cue:'talk',rate:.7,false:.15}},
  'ハル':{strong:{cue:'glance',rate:.7,false:.1},bluff:{cue:'sweat',rate:.7,false:.1}},
  'ロク':{strong:{cue:'still',rate:.7,false:.1},bluff:{cue:'stare',rate:.6,false:.1}},
  'セキ':{strong:{cue:'glance',rate:.7,false:.1},bluff:{cue:'talk',rate:.7,false:.15}},
  'ミナ':{strong:{cue:'smile',rate:.6,false:.15},bluff:{cue:'fast',rate:.7,false:.1}},
  'レイカ':{strong:{cue:'glance',rate:.7,false:.1},bluff:{cue:'talk',rate:.7,false:.15},reverse:true},
  'ソウ':{strong:{cue:'smile',rate:.7,false:.1},bluff:{cue:'sweat',rate:.75,false:.1}},
  'ケンジ':{strong:{cue:'glance',rate:.65,false:.1},bluff:{cue:'talk',rate:.65,false:.1}},
  'ミサキ':{strong:{cue:'smile',rate:.65,false:.1},bluff:{cue:'fast',rate:.65,false:.1}},
  'タロウ':{strong:{cue:'still',rate:.65,false:.1},bluff:{cue:'sweat',rate:.7,false:.1}},
  'ハヤト':{strong:{cue:'talk',rate:.65,false:.1},bluff:{cue:'still',rate:.65,false:.1}},
  'テツ':{strong:{cue:'smile',rate:.7,false:.1},bluff:{cue:'talk',rate:.7,false:.15}},
  'マツ':{strong:{cue:'talk',rate:.65,false:.1},bluff:{cue:'still',rate:.65,false:.1}},
  'ナギ':{strong:{cue:'glance',rate:.65,false:.1},bluff:{cue:'fast',rate:.65,false:.1}},
  'アデ':{strong:{cue:'still',rate:.65,false:.1},bluff:{cue:'glance',rate:.65,false:.1}},
  'マリア':{strong:{cue:'smile',rate:.65,false:.1},bluff:{cue:'talk',rate:.65,false:.1}},
  'ヨシオ':{strong:{cue:'talk',rate:.65,false:.1},bluff:{cue:'still',rate:.65,false:.1}},
  'リン':{strong:{cue:'fast',rate:.65,false:.1},bluff:{cue:'sweat',rate:.65,false:.1}},
  'ハンナ':{strong:{cue:'stare',rate:.65,false:.1},bluff:{cue:'fast',rate:.65,false:.1}},
  'ラジ':{strong:{cue:'talk',rate:.65,false:.1},bluff:{cue:'still',rate:.65,false:.1}},
  'カズ':{strong:{cue:'glance',rate:.65,false:.1},bluff:{cue:'talk',rate:.65,false:.1}},
  'サヤ':{strong:{cue:'still',rate:.65,false:.1},bluff:{cue:'fast',rate:.65,false:.1}},
  'ウォルター':{strong:{cue:'still',rate:.65,false:.1},bluff:{cue:'glance',rate:.65,false:.1}},
  'スミン':{strong:{cue:'still',rate:.65,false:.1},bluff:{cue:'fast',rate:.65,false:.1}},
  'シオン':{strong:{cue:'still',rate:.65,false:.1},bluff:{cue:'stare',rate:.65,false:.1}},
  'アキラ':{strong:{cue:'talk',rate:.65,false:.1},bluff:{cue:'glance',rate:.65,false:.1}},
  'ルカ':{strong:{cue:'smile',rate:.65,false:.1},bluff:{cue:'talk',rate:.65,false:.1}},
  'アイシャ':{strong:{cue:'smile',rate:.65,false:.1},bluff:{cue:'still',rate:.65,false:.1}},
  'ガン':{strong:{cue:'talk',rate:.65,false:.1},bluff:{cue:'still',rate:.65,false:.1}},
  'ドク':{strong:{cue:'still',rate:.65,false:.1},bluff:{cue:'glance',rate:.65,false:.1}},
  'ベン':{strong:{cue:'still',rate:.65,false:.1},bluff:{cue:'stare',rate:.65,false:.1}},
  'ミン':{strong:{cue:'fast',rate:.65,false:.1},bluff:{cue:'sweat',rate:.65,false:.1}},
  'レン':{strong:{cue:'still',rate:.65,false:.1},bluff:{cue:'sweat',rate:.65,false:.1}},
  'イオリ':{strong:{cue:'glance',rate:.65,false:.1},bluff:{cue:'fast',rate:.65,false:.1}},
  'ソフィア':{strong:{cue:'still',rate:.65,false:.1},bluff:{cue:'fast',rate:.65,false:.1}},
  'タケル':{strong:{cue:'still',rate:.65,false:.1},bluff:{cue:'glance',rate:.65,false:.1}},
  'クワメ':{strong:{cue:'still',rate:.65,false:.1},bluff:{cue:'glance',rate:.65,false:.1}},
  'イネス':{strong:{cue:'smile',rate:.65,false:.1},bluff:{cue:'talk',rate:.65,false:.1}},
  'ラース':{strong:{cue:'still',rate:.65,false:.1},bluff:{cue:'stare',rate:.65,false:.1}},
  'ファティマ':{strong:{cue:'glance',rate:.65,false:.1},bluff:{cue:'fast',rate:.65,false:.1}},
  'メイ':{strong:{cue:'smile',rate:.65,false:.1},bluff:{cue:'sweat',rate:.65,false:.1}},
  'オリビア':{strong:{cue:'still',rate:.65,false:.1},bluff:{cue:'talk',rate:.65,false:.1}},
  // クロウのクセは全部わざと：強いときに焦って見せ、ブラフのときに笑う（逆のクセ）
  'クロウ':{strong:{cue:'sweat',rate:.7,false:.1},bluff:{cue:'smile',rate:.7,false:.1}},
  'カオル':{strong:{cue:'glance',rate:.65,false:.1},bluff:{cue:'fast',rate:.65,false:.1}},
};
const CUE_LABEL={glove:'白い手袋の指先を直した',release:'顎の傷から手を離した',scar:'顎の傷に触れている',glance:'自分のチップをちらっと見た',still:'急に動かなくなった',smile:'口元が緩んだ',stare:'こっちをじっと見ている',
  talk:'いつもより口数が多い',fast:'考えずにすぐ賭けた',sweat:'汗をかいている'};
const CUE_SFX={glove:'スッ',release:'……',scar:'傷',glance:'ちらっ',still:'…',smile:'ニヤ',stare:'じっ',talk:'ペラペラ',fast:'サッ',sweat:'タラ…'};
const TRUTH_JP={strong:'強い手',bluff:'ブラフ',none:'特に意味なし'};
const SET_KEY='shisho-settings';
let SETTINGS={talk:'on',speed:'normal',sound:false,peek:true,peekSet:false,protector:'',depth:true,clock:true,muck:true,count:'approx',quiz:true,nick:'',lang:LANG0,cam:'',nextv:true};
try{const o=JSON.parse(localStorage.getItem(SET_KEY))||{};delete o.v;Object.assign(SETTINGS,o)}catch(e){}
function saveSettings(){try{localStorage.setItem(SET_KEY,JSON.stringify({v:1,...SETTINGS}))}catch(e){}}
const SPEED=()=>SETTINGS.speed==='fast'?.5:1;
const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const NOTE_KEY='shisho-notes';
function loadNotes(){
  const obj=o=>o&&typeof o==='object'&&!Array.isArray(o);
  try{const n=JSON.parse(localStorage.getItem(NOTE_KEY));if(!obj(n))return{};delete n.v;
    Object.keys(n).forEach(k=>{if(!obj(n[k])){delete n[k];return}
      Object.keys(n[k]).forEach(c=>{const r=n[k][c];if(!obj(r)||!CUE_LABEL[c])delete n[k][c];else['strong','bluff','none'].forEach(t=>r[t]=+r[t]||0)})});
    return n}catch(e){return{}}}
function noteTell(name,cue,truth){
  const n=loadNotes();n[name]=n[name]||{};n[name][cue]=n[name][cue]||{strong:0,bluff:0,none:0};n[name][cue][truth]++;
  try{localStorage.setItem(NOTE_KEY,JSON.stringify({v:1,...n}))}catch(e){}
}