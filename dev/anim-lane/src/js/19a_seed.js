// ===== 配る札の乱数に種（案5、2026-10-10） =====
// shuffle（19_deck_eval.js）は LT.rand() を使う。ハンドごとに種を作り直すので、同じ種なら同じ札が配られる。
// テスト・不具合の再現：URL に ?seed=123 を付けると、何ハンド目にどの札が配られるかが毎回同じになる
// （CPU の判断は Math.random のままなので、打ち方は毎回変わる）。
// 直近のハンドの種は LT.seeds（新しい順に最大20）。不具合報告に「ハンドの種」として使う。
(function(){
  let st=1;const mix=x=>{x=Math.imul(x^(x>>>16),0x45d9f3b);x=Math.imul(x^(x>>>16),0x45d9f3b);return(x^(x>>>16))>>>0};
  const q=(()=>{try{return new URLSearchParams(location.search).get('seed')}catch(e){return null}})();
  const base=q!=null&&/^\d+$/.test(q)?(+q>>>0):null;let n=0;
  LT.seeds=[];
  LT.seed=s=>{st=(s>>>0)||1};
  LT.rand=()=>{st=(st+0x6D2B79F5)>>>0;let t=st;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};
  LT.newHandSeed=()=>{const s=base!=null?mix(base+(++n)):(Math.random()*4294967296)>>>0;LT.seed(s);LT.seeds.unshift(s);if(LT.seeds.length>20)LT.seeds.pop();return s};
  LT.newHandSeed();
  LT.on('startHand:before',()=>LT.newHandSeed());
})();
