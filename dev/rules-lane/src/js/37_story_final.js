/* ---------- 決めの一手は卓だけ（改善提案 2026-10-11 §4 案2） ---------- */
// 第4・5・7章の「物語の一手」では、操作を降りる・受ける・上げるだけにして、相手役以外の客は黙る
const STORY_FINAL_BOSS={4:'レイカ',5:'ハヤト',7:'ジン'};
const storyFinal=()=>!!(typeof S!=='undefined'&&S&&S.storyHand&&CFG.ch&&!CFG.ch.p2&&[4,5,7].includes(CFG.ch.no));
{const o=say59;say59=function(p,line){o.apply(this,arguments);if(p&&p.say&&p.say.line===line)p.say.st=true}}
{const o=render;render=function(){
  try{if(S&&S.players&&storyFinal()&&!S.handOver){const boss=STORY_FINAL_BOSS[CFG.ch.no];
    S.players.forEach(p=>{if(!p.human&&p.name!==boss&&p.say&&p.say.line&&!p.say.st)p.say=null})}}catch(e){}
  const r=o.apply(this,arguments);try{const f=storyFinal();$('controls').classList.toggle('storyfinal',f);$('game').classList.toggle('storyfinal',f)}catch(e){}
  return r}}
{const o=renderControls;renderControls=function(){const r=o.apply(this,arguments);
  try{const f=storyFinal();$('controls').classList.toggle('storyfinal',f);$('game').classList.toggle('storyfinal',f)}catch(e){}
  return r}}
// v73（v72 レビュー）：ハンドの頭で物語の一手と決まったら、前のハンドから残っている客の一言をすぐ消す（S.storyHand が立つ前の render で描かれることがあるため）
{const o=setupScript;setupScript=function(){const r=o.apply(this,arguments);
  try{if(storyFinal()){const boss=STORY_FINAL_BOSS[CFG.ch.no];S.players.forEach((p,i)=>{if(!p.human&&p.name!==boss){if(p.say&&!p.say.st)p.say=null;const sy=$('say'+i);if(sy&&!p.say)sy.classList.remove('go')}})}}catch(e){}
  return r}}
