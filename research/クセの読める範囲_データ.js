// クセの読める範囲（改善提案 2026-10-18 §1 案A、satou 2026-10-18 02:35Z 決定）の台詞と印。日本語と英語を並べる
const READ_SCOPE_LINE={ja:'クセは賭けた本人のことしか教えん。後ろにまだ人がいるぞ',en:"A tell only speaks for the one who bet. Someone's still behind them."};
// 印：{0} は who(p.name)（名前を知らない相手は見た目の呼び名）。who が無いときだけ2つ目
const READ_SCOPE_TAG=[{ja:'{0}だけ',en:'{0} only'},{ja:'この人だけ',en:'this one only'}];
const READ_SCOPE_LINE_JA=READ_SCOPE_LINE.ja, READ_SCOPE_TAG_JA=READ_SCOPE_TAG[0].ja;
