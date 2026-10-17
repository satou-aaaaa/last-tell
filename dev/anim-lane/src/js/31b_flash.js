/* ---------- 回想（第2・3・4・6章）の画面と操作：ストーリーレーン ---------- */
// 判断が一回だけの回想では「降りる・受ける」だけを出す。回想は称号に数えない
{
  const _rc=renderControls,_rg=renderGoal,_gt=grantTitle,_act=act;
  renderControls=function(){_rc.apply(this,arguments);
    const F=flashOf(),ask=!!(F&&F.choice&&S&&S.fbAsk&&!S.handOver&&S.toAct===0);
    $('controls').classList.toggle('fbchoice',ask);
    if(!F)return;
    if(ask){$('btnFold').hidden=false;$('btnCall').hidden=false;$('btnFold').disabled=false;$('btnFold').querySelector('small').textContent='降りる'}
    if(S.handOver&&S.result==='flash'){$('resultText').textContent=F.end;$('betweenHint').textContent=''}};
  renderGoal=function(){_rg.apply(this,arguments);
    if(!flashOf())return;const gm=$('goal').querySelector('.gm');if(gm&&gm.textContent!=='15年前')gm.textContent='15年前'};
  grantTitle=function(){if(typeof CFG!=='undefined'&&CFG&&CFG.flashback)return;return _gt.apply(this,arguments)};
  // ボタンでも、持ち時間切れでも、ここを通る
  act=function(i,type,to){const F=flashOf();
    if(F&&F.choice&&i===0&&S.fbAsk&&!S.handOver&&S.toAct===0&&(type==='fold'||type==='call')){S.fbAsk=false;S.autoMe=true;
      if(type==='fold'&&F.crowCall){Clock.stop();S.msg=FLASH_CROW_FOLD[1];log(FLASH_CROW_FOLD[1]);render();const s0=S,h0=S.handNo;
        setTimeout(()=>{if(S===s0&&S.handNo===h0&&!S.handOver&&S.toAct===0)_act(0,'call')},2600*SPEED());return}
      if(type==='fold')S.autoMe=false}
    return _act.apply(this,arguments)};
}