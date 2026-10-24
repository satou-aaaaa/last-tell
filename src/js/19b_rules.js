// @unit-begin rules
// ===== ルールの計算（2026-10-14 ルールの単体テスト） =====
// 画面・S・CFG に触らない、ノーリミットホールデムの決まりだけ。ゲーム（20_state・23_house_rules・24_dokidoki_camera・27_render）はここを呼ぶ。
// qa/unit/ が Node から直接読み込んで確かめる（ブラウザを開かない）。ここには画面やゲームの状態を読むコードを入れない。
// 使ってよいのは 19_deck_eval.js の関数（cmp など）だけ。
const Rules={
  // i の次の席から回って、ok(j) が真の最初の席（なければ -1）
  next(n,i,ok){for(let k=1;k<=n;k++){const j=(i+k)%n;if(ok(j))return j}return -1},
  // SB・BB の席。live[j]＝その席が今のハンドに座っているか。deadBtn はトーナメント（BB が必ず1つずつ進む）
  // 返す dealer・sbSeat は次のハンドへ持ち越す値。sb が -1 なら SB の席が空いている（デッドボタン）
  seats(live,dealer,deadBtn,sbSeat,bbSeat){
    const n=live.length,nx=i=>Rules.next(n,i,j=>live[j]),alive=live.filter(Boolean).length;
    let sb=alive===2?dealer:nx(dealer),bb=nx(sb);
    if(deadBtn){const b2=nx(bbSeat);
      if(alive===2){bb=b2;sb=nx(b2);dealer=sb;sbSeat=sb}
      else{const d2=sbSeat>=0?sbSeat:dealer,s2=bbSeat;
        if(b2!==s2&&b2!==d2){bb=b2;sbSeat=s2;dealer=d2;sb=live[s2]?s2:-1}
        else{dealer=nx(dealer);sb=nx(dealer);bb=nx(sb);sbSeat=sb}}}
    else sbSeat=sb;
    return{dealer,sb,bb,sbSeat}},
  // prev まで上がっている所へ bet まで出したとき：上げ幅、ちゃんとしたレイズか（前の上げ幅以上）、次の最低の上げ幅
  raise(prev,minRaise,bet){const inc=bet-prev,full=inc>=minRaise;return{inc,full,minRaise:full?inc:minRaise}},
  // レイズのあと、もう一度話す（レイズもできる）ようになる席。足りないオールインは、話し終えた人に権利を戻さない。
  // ただし、その人が最後に話してから足りないオールインが重なって、ちゃんとしたレイズの幅に届いたら戻す（R-10）
  reopen(ps,i,full,cur,minRaise){const o=[];ps.forEach((q,j)=>{if(j!==i&&(full||(q.acted&&q.actBet!=null&&cur-q.actBet>=minRaise)))o.push(j)});return o},
  // 自分がレイズするときに選べる額（オールインより上は選べない）
  raiseBounds(cur,minRaise,bet,chips){const maxTo=bet+chips;return{minTo:Math.min(cur+minRaise,maxTo),maxTo}},
  // アンティを除いた、賭けた額（BBアンティは死に金なので、だれのものでもない）
  // 「ブラフを見抜いた！」を出してよいか：コールした自分が勝ち、賭けた相手は何も取らなかった（分けたときは出さない。v0.97.12 レビュー：第14章で引き分けなのに出た）
  readCaught:(meWon,agWon,bluffy)=>meWon>0&&!(agWon>0)&&!!bluffy,
  betOf:p=>p.total-(p.ante||0),
  // コールされなかった賭け：いちばん多く出した人の、2番目との差。ほかに誰も出していないときは返さない
  uncalled(ps){const b=Rules.betOf,c=ps.map((p,j)=>j).filter(j=>ps[j].total>0).sort((x,y)=>b(ps[y])-b(ps[x]));
    if(c.length<2)return null;const amt=b(ps[c[0]])-b(ps[c[1]]);return amt>0?{i:c[0],amt}:null},
  // ショーダウンでポットを分ける。sc[j]＝その席の役（降りた人は null）。サイドポットは賭けた額の段ごと、
  // アンティは一番下の段に入る。同じ役なら等分（100単位）、端数はボタンの左から。
  // ri：-1 ふつう、0／1 は2回めくりの1回目／2回目（段ごとに半分ずつ、端数は1回目）。返すのは席ごとの受け取る額
  awards(ps,sc,dealer,ri){
    const n=ps.length,b=Rules.betOf,g=new Array(n).fill(0),all=ps.map((p,j)=>j);
    const contrib=all.filter(j=>ps[j].total>0),cont=all.filter(j=>sc[j]!=null);
    const levels=[...new Set(contrib.map(j=>b(ps[j])))].sort((x,y)=>x-y),anteSum=contrib.reduce((a,j)=>a+(ps[j].ante||0),0);
    const seat=j=>(j-dealer-1+n)%n;let prev=0;
    for(const L of levels){
      let amt=L===levels[0]?anteSum:0;contrib.forEach(j=>{amt+=Math.min(b(ps[j]),L)-Math.min(b(ps[j]),prev)});
      if(ri>=0){const half=Math.floor(amt/2/100)*100;amt=ri===0?amt-half:half}
      let elig=cont.filter(j=>b(ps[j])>=L);
      if(!elig.length)elig=cont;
      const top=elig.reduce((x,y)=>cmp(sc[x],sc[y])>=0?x:y);
      const winners=elig.filter(j=>cmp(sc[j],sc[top])===0).sort((x,y)=>seat(x)-seat(y));
      const share=Math.floor(amt/winners.length/100)*100,rem=amt-share*winners.length;
      winners.forEach((w,k)=>{g[w]+=share+(k<Math.floor(rem/100)?100:0)+(k===0?rem%100:0)});
      prev=L}
    return g}
};
// @unit-end rules
