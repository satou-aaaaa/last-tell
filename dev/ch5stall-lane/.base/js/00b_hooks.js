// ===== 合図（フック）：開発と設計のベストプラクティス 案1（2026-10-10） =====
// 新しい機能は、本体の関数を包み直さず（const _sh=startHand; startHand=function…）、ここに登録する。
//   LT.on('startHand:before', fn)  … startHand の前に呼ばれる（引数は startHand と同じ）
//   LT.on('startHand', fn)         … startHand が終わった後に呼ばれる（async の関数は終わるのを待ってから）
// 合図を出す関数の一覧は js/35_hooks_wire.js（全部のファイルの後で1回だけ包む）。
// 登録した関数でエラーが出ても、ほかの登録やゲームは止まらない（console.error に出るので qa の fuzz が拾う）。
// 状態は S の下に自分の区画を作って入れる（例 S.talk={…}）。消すのも自分の startHand 合図の中で（案7）。
const LT={_h:{},errors:0,
  on(n,f){(this._h[n]=this._h[n]||[]).push(f);return f},
  off(n,f){const a=this._h[n];if(a){const i=a.indexOf(f);if(i>=0)a.splice(i,1)}},
  emit(n,...a){const hs=this._h[n];if(!hs)return;for(const f of hs.slice()){try{f(...a)}catch(e){this.errors++;console.error('[LT]',n,e);try{window.LT_PLATFORM.reportError(e)}catch(x){}}}},
  wrap(n,fn){if(typeof fn!=='function'||fn.__lt)return fn;const L=this;
    const w=function(...a){L.emit(n+':before',...a);const r=fn.apply(this,a);
      if(r&&typeof r.then==='function')return r.then(v=>{L.emit(n,...a);return v});L.emit(n,...a);return r};
    w.__lt=n;return w}
};
