// チェックの見せ方（案1＋2＋3）のデータ。2026-10-10 satou 決定「おすすめで」
// 叩き方 k: 'knuckle'（指の背）| 'finger'（指先）| 'palm'（手のひら）| 'fist'（拳）
// n: 叩く回数（1か2）。loud: 音を大きく。say: チェックのときに必ず言う声（毎回同じ。手の強さで変えない）
// 決まり：叩き方は人ごとに1つだけ。乱数・手の強さ・ブラフで変えない（テルにしないため）

// rank から決める既定（強い人ほど静かで短い、弱い人ほど大きい）
const CHECK_BY_RANK={1:{k:'palm',n:2},2:{k:'knuckle',n:2},3:{k:'knuckle',n:1},4:{k:'finger',n:1},5:{k:'finger',n:1}};

// 個別に決める人（ほかは CHECK_BY_RANK）
const CHECK_STYLE={
  'ゲン':{k:'fist',n:2,loud:1,say:{ja:'チェック！',en:'Check!'}},
  'タロウ':{k:'palm',n:2,say:{ja:'チェックで',en:'Check, please.'}},
  'ミナ':{k:'finger',n:1},
  'レイカ':{k:'palm',n:1},
  'ハヤト':{k:'knuckle',n:1,loud:1},
  'ゴウ':{k:'fist',n:1,loud:1},
  'ジン':{k:'finger',n:1},
  '若き日のジン':{k:'knuckle',n:2},
  'あなた':{k:'knuckle',n:2},
};
const checkStyle=name=>CHECK_STYLE[name]||CHECK_BY_RANK[rankOf(name)]||CHECK_BY_RANK[2];

// ディーラー（全員チェックで回ったとき）
const CHECK_AROUND={ja:'チェック、アラウンド',en:'Check around.'};
// EN_DICT に足す行
const CHECK_EN={'チェック！':'Check!','チェックで':'Check, please.','チェック、アラウンド':'Check around.','ディーラー：全員チェック':'Dealer: checked around'};
