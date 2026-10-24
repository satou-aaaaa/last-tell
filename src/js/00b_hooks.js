// ===== 合図（フック）：開発と設計のベストプラクティス 案1（2026-10-10） =====
// 新しい機能は、本体の関数を包み直さず（const _sh=startHand; startHand=function…）、ここに登録する。
//   LT.on('startHand:before', fn)  … startHand の前に呼ばれる（引数は startHand と同じ）
//   LT.on('startHand', fn)         … startHand が終わった後に呼ばれる（async の関数は終わるのを待ってから）
// 合図を出す関数の一覧は js/35_hooks_wire.js（全部のファイルの後で1回だけ包む）。
// 登録した関数でエラーが出ても、ほかの登録やゲームは止まらない（console.error に出るので qa の fuzz が拾う）。
// 状態は S の下に自分の区画を作って入れる（例 S.talk={…}）。消すのも自分の startHand 合図の中で（案7）。
// v0.98.0 PC 向け（横長の卓）：スマホ横と同じ「右の列」の配置を、大きい PC の画面（マウス）でも使う。CSS の @media も同じ2つの条件（片方を変えたらもう片方も。build.py の lint が確かめる）
const LAND_Q='(orientation:landscape) and (max-height:520px)',PCW_Q='(min-width:1100px) and (min-height:640px) and (hover:hover) and (pointer:fine)',SIDE_Q=LAND_Q+', '+PCW_Q;
// WebKit（Safari・iPhone の全ブラウザ）の印 html.wk。WebKit は 3D で倒した卓の中の部品を、測った場所（getBoundingClientRect）と違う所に描く（v0.97.5 sharp:gap）。
// この印で卓を倒さずに描き（01n_style_pcwide.css。PC：Issue #131、PR #130。スマホも v0.98.8 から）、測った場所と描かれた場所をそろえる
{const ua=navigator.userAgent||'';if(/AppleWebKit/.test(ua)&&!/(Chrome|Chromium|Edg|OPR)\//.test(ua))document.documentElement.classList.add('wk')}
function mqOn(q,f){try{if(typeof q.addEventListener==='function')q.addEventListener('change',f);else if(typeof q.addListener==='function')q.addListener(f)}catch(e){}}   // 画面の条件の変わり目（古い Safari は addListener だけ）
{const q=matchMedia(PCW_Q),f=()=>document.documentElement.classList.toggle('pcw',q.matches);f();mqOn(q,f)}
const LT={_h:{},errors:0,
  on(n,f){(this._h[n]=this._h[n]||[]).push(f);return f},
  off(n,f){const a=this._h[n];if(a){const i=a.indexOf(f);if(i>=0)a.splice(i,1)}},
  emit(n,...a){const hs=this._h[n];if(!hs)return;for(const f of hs.slice()){try{f(...a)}catch(e){this.errors++;console.error('[LT]',n,e);try{window.LT_PLATFORM.reportError(e)}catch(x){}}}},
  wrap(n,fn){if(typeof fn!=='function'||fn.__lt)return fn;const L=this;
    const w=function(...a){L.emit(n+':before',...a);const r=fn.apply(this,a);
      if(r&&typeof r.then==='function')return r.then(v=>{L.emit(n,...a);return v});L.emit(n,...a);return r};
    w.__lt=n;return w},
  // 動き（Web Animations）は必ずこれで動かす（v0.97.3：Safari では onfinish が来ないこと・動きが途中で止まることがある）。
  // done は「終わった合図」と「時間（delay＋長さ＋300ms）」の早いほうで1回だけ呼ぶ。時間で来たときは動きも終わりの形にする。
  // 止めた（cancel）動きの done は呼ばない（onfinish と同じ）。build.py の lint が、これ以外で動きの関数を直接呼ぶ所を止める。
  anim(el,kf,opts,done){const a=el.animate(kf,opts);/*lt-anim-ok*/let fired=false;const fin=()=>{if(fired)return;fired=true;if(done)try{done()}catch(e){console.error('[LT.anim]',e)}};
    a.onfinish=fin;/*lt-anim-ok*/a.oncancel=()=>{fired=true};const o=typeof opts==='number'?{duration:opts}:(opts||{}),it=o.iterations==null?1:o.iterations;
    if(isFinite(it)){const ms=(+o.delay||0)+(+o.duration||0)*it+(+o.endDelay||0)+300;
      setTimeout(()=>{if(fired)return;try{if(a.playState!=='idle'&&a.playState!=='finished')a.finish()}catch(e){}if(a.playState!=='idle')fin()},ms)}
    return a},
  // CSS の animation（fill both で出てくる動き：vfIn・ltFlop/ltTurn・ltDeal）も、ms たっても動いていたら終わりの形にする
  cssFinish(el){try{if(!el||!el.isConnected||!el.getAnimations)return;el.getAnimations().forEach(a=>{const t=a.effect&&a.effect.getComputedTiming();if(t&&isFinite(t.endTime)&&a.playState==='running')a.finish()})}catch(e){}},
  cssDone(el,ms){setTimeout(()=>LT.cssFinish(el),ms)},
  // よける相手として数えてよいか。吹き出し（.say）は .go が付いたまま2.6秒の動きの最後で見えなくなるので、不透明度で見る（v0.97.8 レビュー：もう見えない吹き出しを
  // 心の声の字幕がよけて、右上に寄って折り返した）。吹き出しでなければ true。'.say.go' をよける一覧に入れるときは必ずこれも通す（lint が見る）（say-go-ok）
  // 消える途中（動きの残りが 0.5秒以下）も見えていない扱い（v0.97.9 レビュー：消えかけの吹き出しを字幕がよけ、検査は ⚠️ を出した。ゲームと検査で同じ線にする。qa/checks/ui.js の INNER_OV も同じ）
  sayOn(e){if(!e||!e.classList||!e.classList.contains('say'))return true;if(+getComputedStyle(e).opacity<=.05)return false;{const r=e.getBoundingClientRect();if(r.width<14||r.height<14||!(e.textContent||'').trim())return false}   // 中身のない・出はじめの細い吹き出し（v0.97.11 手元：#say2 が幅 4px で心の声に「重なり」）
    
    try{for(const a of e.getAnimations())if(/^say/.test(a.animationName||'')&&a.playState==='running'){const d=a.effect.getComputedTiming(),left=(d.endTime||0)-(+d.localTime||0);if(left<=500)return false}}catch(x){}return true},
  // 見張り（v0.97.3 レビュー）：画面のすべての動き（CSS の animation・transition、script の動き）を 250ms ごとに見て、
  // 最初に見た時からの残り時間＋300ms をすぎても動いていれば、終わりの形にする。Safari で動きが止まっても、透明・横向き・途中のまま残らない。
  // 一つずつ LT.cssDone を足すのでは抜けが出た（v0.97.3：見せた札の flip/flipSlow が透明のまま）ので、全部まとめて見る。終わりのない動き（infinite）と止めた動きは見ない
  _sw:typeof WeakMap!=='undefined'?new WeakMap():null,
  sweep(){if(!this._sw||!document.getAnimations)return;const now=performance.now();if(now-(this._swAt||0)<240)return;
    this._swAt=now;   // qa は setInterval を速めるので、実の時間で 240ms ごとに
    for(const a of document.getAnimations()){try{if(a.playState!=='running'){this._sw.delete(a);continue}const t=a.effect&&a.effect.getComputedTiming();if(!t||!isFinite(t.endTime))continue;
      let m=this._sw.get(a);if(!m){this._sw.set(a,m={t:now,lt:+t.localTime||0});continue}
      if(now-m.t>t.endTime-m.lt+300){this._sw.delete(a);a.finish()}}catch(e){}}}
};
// 見張りは画を描いた直後に動かす（v0.97.7：途中で呼ぶと getAnimations が画面全体のスタイルの計算をその場でさせ、手の始まりなどで1回 40ms 以上かかっていた）
// 描く前の予約は1つだけ（画面を隠している間は requestAnimationFrame が止まるので、戻ったときに何本もたまらないように。CodeRabbit PR #121）
// Safari で画が止まると requestAnimationFrame も来ない（v0.97.7 CI：WebKit で見張りが動かず、止まった動きが残った）。予約から 500ms 来なければ、待たずに見張る
let ltSwAt=0;
setInterval(()=>{const now=performance.now();if(!ltSwAt){ltSwAt=now;requestAnimationFrame(()=>setTimeout(()=>{ltSwAt=0;LT.sweep()},0))}else if(now-ltSwAt>=500)LT.sweep()},250);
