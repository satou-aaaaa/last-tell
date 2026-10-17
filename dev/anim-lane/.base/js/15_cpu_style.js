/* ---------- CPUの性格（参加・レイズ・ブラフ・降りやすさ） ---------- */
const STYLES={
  normal:{hi:1.7,mid:1.3,midP:.4,bluff:.08,margin:.03,defPre:0,defPost:0},
  station:{hi:2.1,mid:1.7,midP:.25,bluff:.02,margin:-.12,defPre:0,defPost:0,loose:true},
  tight:{hi:1.8,mid:1.5,midP:.3,bluff:.02,margin:.06,defPre:1.05,defPost:0},
  tight2:{hi:1.8,mid:1.4,midP:.35,bluff:.04,margin:.05,defPre:0.95,defPost:0},
  nit:{hi:1.9,mid:1.6,midP:.3,bluff:.01,margin:.1,defPre:1.2,defPost:1.25},
  nit2:{hi:1.8,mid:1.5,midP:.3,bluff:.02,margin:.08,defPre:1.1,defPost:1.1},
  liar:{hi:1.7,mid:1.3,midP:.4,bluff:.25,margin:.03,defPre:0,defPost:0},
  liar2:{hi:1.7,mid:1.35,midP:.35,bluff:.12,margin:.04,defPre:0,defPost:0},
  hayato:{hi:1.6,mid:1.25,midP:.45,bluff:.14,margin:.02,defPre:0,defPost:0},
  crow:{hi:1.7,mid:1.3,midP:.45,bluff:.12,margin:.03,defPre:0,defPost:0},
  jin:{hi:1.75,mid:1.35,midP:.4,bluff:.07,margin:.04,defPre:0,defPost:0},
  rude:{hi:1.6,mid:1.25,midP:.45,bluff:.12,margin:.02,defPre:0,defPost:0},
};
// S2：read＝相手が賭けてきたとき、相手の手を「賭け方に合う手」に絞る強さ（0〜1）。A1：noLimp＝最初に入るときはレイズか降りる
{const R={station:0,normal:.4,liar:.4,liar2:.4,rude:.4,tight:.6,tight2:.6,nit:.6,nit2:.6,hayato:.7,crow:.9,jin:.9};
 Object.keys(R).forEach(k=>{STYLES[k].read=R[k]});['jin','crow','hayato','tight','tight2','liar'].forEach(k=>{STYLES[k].noLimp=true})}
