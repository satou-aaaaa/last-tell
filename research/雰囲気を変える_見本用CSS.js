// 雰囲気の見本：今のゲームの上にかぶせるだけの CSS（見本用。本番は色の値と絵の色を直接変える）
const T = {};

T.now = '';
// 案1 港の午後（あたたかいフィルム）
T.a = `
:root{--bg:#1d1611;--panel:#2a2119;--panel2:#3a2d21;--ink:#f6ead6;--muted:#b9a68c;--gold:#d9a95a;--crimson:#b4532a;--line:#4a3a2a}
body{background:#1d1611!important;background-image:linear-gradient(180deg,#3b2a1b 0%,#21170f 60%,#140e09 100%)!important}
body::before{background:linear-gradient(115deg,rgba(255,196,120,.28) 0 18%,transparent 18% 24%,rgba(255,196,120,.18) 24% 34%,transparent 34%),radial-gradient(ellipse 80% 50% at 10% 0%,rgba(255,200,130,.35),transparent 70%)!important;filter:blur(6px)!important;animation:none!important}
body::after{background:repeating-linear-gradient(90deg,rgba(0,0,0,.18) 0 2px,transparent 2px 46px),linear-gradient(180deg,transparent 60%,rgba(20,12,6,.7))!important;opacity:.7!important}
.room{filter:sepia(.55) saturate(1.1) brightness(1.15) hue-rotate(-8deg)!important}
.felt{background:radial-gradient(ellipse 60% 45% at 30% 25%,rgba(255,214,150,.30),transparent 70%),radial-gradient(ellipse 70% 60% at 50% 36%,#3d5a45,#24382b 70%,#18261d 100%)!important}
.lamp{opacity:.25!important}
#busts,.hero,.sensei,.scene .who,.av{filter:sepia(.28) saturate(1.05) brightness(1.04) contrast(.96)}
#game .actionbar{background:linear-gradient(180deg,#3a2b1d,#21170f)!important}
#game button.act.fold{background:linear-gradient(180deg,#5a4836,#3a2d21)!important;color:#f0e2cc!important}
#game button.act.call{background:linear-gradient(180deg,#5d7a52,#3d5536)!important}
#game button.act.raise{background:linear-gradient(180deg,#d07a3e,#a4501f)!important}
#title .row button{background:linear-gradient(180deg,#4a3a2a,#2a2119)!important}
#title .row button.primary{background:linear-gradient(180deg,#d07a3e,#a4501f)!important}
.logo h1{color:#f6ead6!important;text-shadow:0 2px 0 rgba(0,0,0,.4)!important}
.logo .eyebrow{color:#d9a95a!important}
.say,.plate{filter:sepia(.3)}
html::after{content:"";position:fixed;inset:0;z-index:9999;pointer-events:none;background:radial-gradient(ellipse at 50% 45%,transparent 55%,rgba(40,20,5,.45)),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.13'/%3E%3C/svg%3E");mix-blend-mode:multiply}
`;
// 案2 ノワール（色を絞る、赤だけ残す）
T.b = `
:root{--bg:#0b0b0c;--panel:#141415;--panel2:#1d1d1f;--ink:#ecebe8;--muted:#8d8d8f;--gold:#d8d4cc;--crimson:#c41e2e;--line:#2a2a2c}
body{background:#060606!important;background-image:radial-gradient(ellipse 60% 50% at 50% 30%,#1c1c1d,#060606 75%)!important}
body::before{background:repeating-linear-gradient(100deg,rgba(255,255,255,.07) 0 14px,transparent 14px 34px)!important;filter:blur(3px)!important;-webkit-mask:linear-gradient(180deg,#000,transparent 70%);mask:linear-gradient(180deg,#000,transparent 70%);animation:none!important}
body::after{filter:grayscale(1) brightness(.7)!important;opacity:.6!important}
.room{filter:grayscale(1) contrast(1.3) brightness(.7)!important}
.felt{background:radial-gradient(ellipse 34% 30% at 50% 34%,rgba(255,255,255,.16),transparent 70%),radial-gradient(ellipse 70% 60% at 50% 36%,#232726,#121414 65%,#060707 100%)!important}
.lamp{filter:grayscale(1)!important;opacity:.7!important}
#busts,.hero,.sensei,.scene .who,.av,.chips,.potchips,.stack{filter:grayscale(.9) contrast(1.25) brightness(.95)}
.card.back{filter:grayscale(.2)}
#game .actionbar{background:#0b0b0c!important;box-shadow:inset 0 1px 0 #2a2a2c!important}
#game button.act.fold{background:#1d1d1f!important;color:#cfcfcf!important;box-shadow:inset 0 0 0 1px #3a3a3c!important}
#game button.act.call{background:#e9e7e2!important;color:#0b0b0c!important}
#game button.act.call small{color:#333!important}
#game button.act.raise{background:#b3121f!important}
#title .row button{background:#141415!important;box-shadow:inset 0 0 0 1px #3a3a3c!important}
#title .row button.primary{background:#b3121f!important}
.logo h1{color:#fff!important;text-shadow:none!important;letter-spacing:.12em!important}
.logo .eyebrow{color:#c41e2e!important}
.logo .subtitle{color:#bdbab3!important}
html::after{content:"";position:fixed;inset:0;z-index:9999;pointer-events:none;background:radial-gradient(ellipse 70% 60% at 50% 40%,transparent 45%,rgba(0,0,0,.7)),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.12'/%3E%3C/svg%3E")}
`;
// 案3 本物のカードルーム（明るく、飾らない）
T.c = `
:root{--bg:#1b2026;--panel:#232a32;--panel2:#2c343e;--ink:#f4f6f8;--muted:#a3adb8;--gold:#f2c14e;--crimson:#e0473c;--line:#38424e;
 --display:"Zen Kaku Gothic New","Hiragino Sans","Noto Sans JP",system-ui,sans-serif}
body{background:#2a313a!important;background-image:linear-gradient(180deg,#3a434e,#1e242b)!important}
body::before{background:radial-gradient(ellipse 18% 10% at 20% 10%,rgba(255,255,255,.35),transparent 70%),radial-gradient(ellipse 18% 10% at 50% 6%,rgba(255,255,255,.35),transparent 70%),radial-gradient(ellipse 18% 10% at 80% 10%,rgba(255,255,255,.35),transparent 70%),radial-gradient(ellipse 30% 14% at 25% 60%,rgba(40,90,140,.5),transparent 70%),radial-gradient(ellipse 30% 14% at 78% 70%,rgba(40,90,140,.5),transparent 70%)!important;filter:blur(8px)!important;animation:none!important}
body::after{display:none!important}
.room{filter:saturate(.5) brightness(1.5) blur(1px)!important}
.felt{background:radial-gradient(ellipse 80% 60% at 50% 36%,#2f6aa0,#245482 70%,#1c4369 100%)!important}
.felt .rail{filter:grayscale(1) brightness(.6)}
.lamp,.haze{opacity:0!important}
#busts{filter:brightness(1.12) contrast(1.02)}
#game .actionbar{background:#1e242b!important;box-shadow:none!important}
#game button{clip-path:none!important;border-radius:10px!important}
#game button.act.fold{background:#3a434e!important;color:#fff!important}
#game button.act.call{background:#2c8a5e!important}
#game button.act.raise{background:#e0473c!important}
#title .row button{clip-path:none!important;border-radius:10px!important;background:#2c343e!important;box-shadow:none!important}
#title .row button.primary{background:#e0473c!important}
.logo h1{font-family:var(--body)!important;font-weight:900!important;color:#fff!important;text-shadow:none!important;letter-spacing:0!important}
.logo h1 *{text-shadow:none!important;color:#fff!important}
.logo .eyebrow{color:#a3adb8!important}
.logo .subtitle{font-family:var(--body)!important;color:#f2c14e!important;letter-spacing:.2em!important}
#title::before,#title::after{display:none!important}
`;
// 案4 和モダン（漆の黒・朱・金箔）
T.d = `
:root{--bg:#0e0a09;--panel:#18110f;--panel2:#241915;--ink:#f3ece0;--muted:#a8998a;--gold:#c9a24b;--crimson:#c8322a;--line:#3a2a22}
body{background:#0e0a09!important;background-image:linear-gradient(180deg,#1a100d,#0a0706)!important}
body::before{background:radial-gradient(circle at 50% 120%,rgba(200,50,42,.35),transparent 55%),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='46' viewBox='0 0 80 46'%3E%3Cg fill='none' stroke='%23c9a24b' stroke-width='1' opacity='.16'%3E%3Cpath d='M0 46a20 20 0 0 1 40 0M40 46a20 20 0 0 1 40 0M20 23a20 20 0 0 1 40 0M-20 23a20 20 0 0 1 40 0M60 23a20 20 0 0 1 40 0M0 0a20 20 0 0 1 40 0'/%3E%3C/g%3E%3C/svg%3E") 0 0/80px 46px!important;filter:none!important;animation:none!important}
body::after{display:none!important}
.room{filter:sepia(.6) hue-rotate(-20deg) saturate(1.3) brightness(.7)!important}
.felt{background:radial-gradient(ellipse 50% 40% at 50% 30%,rgba(255,220,160,.12),transparent 70%),radial-gradient(ellipse 70% 60% at 50% 36%,#22304d,#162036 70%,#0d1424 100%)!important}
.felt .rail{filter:sepia(1) hue-rotate(-25deg) saturate(2) brightness(.55)}
#busts,.hero,.sensei,.av{filter:contrast(1.08) saturate(.9)}
#game .actionbar{background:linear-gradient(180deg,#1a100d,#0a0706)!important;box-shadow:inset 0 1px 0 #c9a24b88!important}
#game button.act.fold{background:#241915!important;color:#e9dccb!important;box-shadow:inset 0 0 0 1px #c9a24b55!important}
#game button.act.call{background:linear-gradient(180deg,#2d3b5c,#1b2640)!important;box-shadow:inset 0 0 0 1px #c9a24b88!important}
#game button.act.raise{background:linear-gradient(180deg,#d8443a,#a4231c)!important}
#title .row button{background:#18110f!important;box-shadow:inset 0 0 0 1px #c9a24b77!important}
#title .row button.primary{background:linear-gradient(180deg,#d8443a,#a4231c)!important}
.logo h1{color:#f3ece0!important;text-shadow:0 0 0 transparent!important}
.logo .eyebrow{color:#c9a24b!important}
.logo .subtitle{color:#c8322a!important}
html::after{content:"";position:fixed;inset:0;z-index:9999;pointer-events:none;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.02 .4' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.10'/%3E%3C/svg%3E");mix-blend-mode:screen}
`;

module.exports = T;
const X={
a:`.card.back{background:#e9dcc3!important;background-image:repeating-linear-gradient(45deg,#8a5a34 0 2px,transparent 2px 7px),repeating-linear-gradient(-45deg,#8a5a34 0 2px,transparent 2px 7px)!important;background-clip:padding-box!important;box-shadow:inset 0 0 0 3px #e9dcc3,0 4px 8px rgba(0,0,0,.4)!important}
.tbar{background:linear-gradient(180deg,#3a2b1d,#21170f)!important;border-bottom-color:#d9a95a77!important}
.tipline{background:#2a2119!important;border-color:#d9a95a!important}
.quick button{background:#3a2d21!important}`,
b:`html::after{background:radial-gradient(ellipse 80% 55% at 50% 35%,transparent 50%,rgba(0,0,0,.55)),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.10'/%3E%3C/svg%3E")!important;height:62%!important}
.card.back{background:#111!important;background-image:linear-gradient(135deg,transparent 46%,#c41e2e 46% 54%,transparent 54%),repeating-linear-gradient(0deg,#2a2a2a 0 1px,transparent 1px 5px)!important;box-shadow:inset 0 0 0 3px #e8e6e1,inset 0 0 0 4px #111,0 4px 10px rgba(0,0,0,.6)!important}
.tbar{background:#0b0b0c!important;border-bottom-color:#2a2a2c!important}
.tipline{background:#111!important;border-color:#c41e2e!important}
.quick button{background:#1d1d1f!important;box-shadow:inset 0 0 0 1px #3a3a3c!important}
.potsign{filter:grayscale(1)}`,
c:`.card.back{background:#fff!important;background-image:radial-gradient(circle,#245482 1.2px,transparent 1.5px)!important;background-size:6px 6px!important;box-shadow:inset 0 0 0 3px #fff,inset 0 0 0 5px #245482,0 3px 6px rgba(0,0,0,.35)!important}
.tbar{background:#1e242b!important;border-bottom:1px solid #38424e!important}
.tbar button{clip-path:none!important;border-radius:8px!important}
.tipline{background:#232a32!important;border-color:#f2c14e!important}
.quick button{background:#2c343e!important;clip-path:none!important;border-radius:8px!important}
.potsign{background:#1e242b!important}`,
d:`.card.back{background:#a4231c!important;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='9' viewBox='0 0 16 9'%3E%3Cpath d='M0 9a4 4 0 0 1 8 0M8 9a4 4 0 0 1 8 0M4 4.5a4 4 0 0 1 8 0M-4 4.5a4 4 0 0 1 8 0M12 4.5a4 4 0 0 1 8 0' fill='none' stroke='%23e7c46a' stroke-width='.8'/%3E%3C/svg%3E")!important;background-size:12px 7px!important;box-shadow:inset 0 0 0 3px #a4231c,inset 0 0 0 4px #e7c46a,0 4px 10px rgba(0,0,0,.5)!important}
.tbar{background:#120c0a!important;border-bottom-color:#c9a24b88!important}
.tipline{background:#18110f!important;border-color:#c8322a!important}
.quick button{background:#241915!important;box-shadow:inset 0 0 0 1px #c9a24b55!important}`};
for(const k in X)module.exports[k]+=X[k];
