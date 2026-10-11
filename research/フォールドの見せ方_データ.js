// フォールドの見せ方（全案）のデータ。2026-10-10 satou 決定「全てよさそうです」
// 1.0：案1（伏せて前へ）＋案2（キャラごとの捨て方）＋案3（ディーラーが集める）
// 公開後：案4（札をはらって降りる設定）＋案5（フォールドにまつわる出来事）
// 捨て方 k: 'slide'（指2本で低く速く）| 'place'（2枚を揃えてそっと置く）| 'flick'（指で弾く。札が回る）
// tag: 降りたときの札の文字（毎回同じ。手の強さで変えない。吹き出しは使わない）
// 決まり：捨て方は人ごとに1つだけ。乱数・手の強さ・ブラフ・テルの有無で変えない

// rank から決める既定（強い人ほど静かで短い、弱い人ほど大きい）
const FOLD_BY_RANK={1:{k:'place'},2:{k:'place'},3:{k:'slide'},4:{k:'slide'},5:{k:'slide'}};

// 個別に決める人（ほかは FOLD_BY_RANK）
const FOLD_STYLE={
  'ゲン':{k:'flick',loud:1,tag:{ja:'降り！',en:'I\'m out!'}},
  'ゴウ':{k:'flick',loud:1},
  'ミナ':{k:'place'},
  'タロウ':{k:'place',tag:{ja:'降ります',en:'I fold.'}},
  'レイカ':{k:'slide'},
  'ハヤト':{k:'slide'},
  'ジン':{k:'slide'},
  '若き日のジン':{k:'slide'},
  'あなた':{k:'slide'},
};
const foldStyle=name=>FOLD_STYLE[name]||FOLD_BY_RANK[rankOf(name)]||FOLD_BY_RANK[3];

// 動きの長さ（ms、SPEED() を掛ける）
const FOLD_MS={slide:380,place:820,flick:460,push:320,sweep:700,gather:800};

// 捨て札の山で札が重なる位置と角度（[x%, y%, 度]。山の中心からのずれ。順に使い回す。乱数は使わない）
const MUCK_MESS=[[-1.2,-.8,-14],[1,.6,22],[-.4,1.2,6],[1.4,-1,-30],[-1.6,.9,38],[.6,-1.4,-4],[.2,.3,15],[-.9,-.2,-24]];

// あなたの捨てた手の文字
const FOLD_GONE={ja:'捨てた手',en:'Folded'};

// 案5（公開後）：フォールドにまつわる出来事の台詞
const FOLD_EVENT={
  oot:{dealer:{ja:'まだ番ではありません。降りは有効です',en:'It\'s not your turn yet. The fold stands.'},
       log:{ja:'ディーラー：番の前に降りても、降りは取り消せない',en:'Dealer: a fold out of turn still stands.'}},
  expose:{dealer:{ja:'見えた札は、皆さんに見せます',en:'An exposed card is shown to everyone.'},
       log:{ja:'ディーラー：捨てるときに見えた札は、全員に見せる',en:'Dealer: a card exposed while folding is shown to the whole table.'}},
};
// 案5 を起こすキャラと割合（第4章以降・フリー対戦のみ。第7章では起こさない）
const FOLD_EVENT_WHO={'ゲン':{oot:.04},'タロウ':{expose:.04},'ゴウ':{expose:.03}};

// 案4（公開後）：設定の行
const FOLD_SWIPE_SET={ja:['札をはらって降りる','自分の札を上へはらうとフォールドします（ボタンもそのまま使えます）'],
  en:['Swipe to fold','Swipe your cards upward to fold (the button still works).']};

// EN_DICT に足す行
const FOLD_EN={'降り！':'I\'m out!','降ります':'I fold.','捨てた手':'Folded',
  'まだ番ではありません。降りは有効です':'It\'s not your turn yet. The fold stands.',
  '見えた札は、皆さんに見せます':'An exposed card is shown to everyone.',
  'ディーラー：番の前に降りても、降りは取り消せない':'Dealer: a fold out of turn still stands.',
  'ディーラー：捨てるときに見えた札は、全員に見せる':'Dealer: a card exposed while folding is shown to the whole table.',
  '札をはらって降りる':'Swipe to fold','自分の札を上へはらうとフォールドします（ボタンもそのまま使えます）':'Swipe your cards upward to fold (the button still works).'};
