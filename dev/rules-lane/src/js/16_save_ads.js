/* ---------- 進行の保存（消えても困らない範囲） ---------- */
const SAVE_KEY='shisho-progress';
// 保存先の一覧。キーを足すときはここにも足す（引き継ぎコード・ファイル保存・セーブ削除が使う）
const SAVE_KEYS=['shisho-resume','shisho-stats','shisho-progress','shisho-settings','shisho-notes','shisho-manners','shisho-regular','shisho-quiz','shisho-titles','shisho-stars','shisho-advice','shisho-review','shisho-ura','shisho-run','shisho-read','shisho-story','shisho-guide','shisho-daily','shisho-rumor','shisho-leaks','shisho-talk','shisho-style','shisho-part2','shisho-banter','shisho-mob'];
const SAVE_VER=1; // セーブ形式の版番号。形を変えたら上げて、読み込み時に移し替える
function loadCleared(){try{return +(JSON.parse(localStorage.getItem(SAVE_KEY))||{}).cleared||0}catch(e){return 0}}
function saveCleared(n){try{localStorage.setItem(SAVE_KEY,JSON.stringify({v:SAVE_VER,cleared:Math.max(n,loadCleared())}))}catch(e){}}

/* ---------- 広告の差し込み位置（今は何もしない） ----------
   本番では AdSense H5 Games Ads の adBreak() をここで呼ぶ。章の区切りだけで出す。 */
function showInterstitial(done){Sound.pause();const fin=()=>{Sound.resume();done()};fin()} // 広告を入れるときは、閉じたあとに fin() を呼ぶ

const SUITS=['♠','♥','♦','♣'];
const STREET_JP={preflop:'プリフロップ',flop:'フロップ',turn:'ターン',river:'リバー',showdown:'ショーダウン'};
const HAND_JP=['ハイカード','ワンペア','ツーペア','スリーカード','ストレート','フラッシュ','フルハウス','フォーカード','ストレートフラッシュ'];
const $=id=>document.getElementById(id);
const fmt=n=>n.toLocaleString('ja-JP');
const rankStr=r=>({14:'A',13:'K',12:'Q',11:'J'})[r]||String(r);
const cardStr=c=>SUITS[c.s]+rankStr(c.r);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
