# LAST TELL 名前の重複調査（2026-10-08）

対象：アプリ名「LAST TELL（ラストテル）」、ストア表記案「LAST TELL ‐ 師匠とホールデム」

## 結論

Web 検索で調べた範囲では、同じ名前・ほぼ同じ名前の商標やアプリは見つからなかった。
ただし **J-PlatPat とストア内の検索そのものは、この環境から開けなかった**。下の「未確認の部分」を参照。

## 1. 商標（第9類・第41類）

| 調べた先 | 方法 | 結果 |
|---|---|---|
| J-PlatPat（日本） | 直接アクセス | **開けなかった**（JavaScript で動く画面のため、ページ本体を読み込めない） |
| 米国の商標（Justia の USPTO データ検索） | 「last tell」で検索 | 「LAST TELL」と同じ・近い商標はなし。近いのは「TELL TELL」（広告コピー制作、ゲームと無関係） |
| Web 全体 | 「"LAST TELL" trademark」「"ラストテル"」で検索 | 同名の商標登録の記載は見つからず。「ラストテル」の日本語ヒットは辞書・競走馬（ラステラ）などで無関係 |

参考：ゲーム分野で「TELL」を含む有名な名前に Telltale（テルテール、ゲーム会社）がある。語の組み合わせも読みも違うので、混同のおそれは低いと考える（推測であり法的判断ではない）。

## 2. App Store / Google Play

| 調べた先 | 方法 | 結果 |
|---|---|---|
| App Store | iTunes 検索 API / ストアページ | **開けなかった**（この環境の通信制限で拒否） |
| Google Play | ストアの検索ページ | **開けなかった**（ストア側がロボットの読み込みを拒否） |
| Web 検索（apps.apple.com・play.google.com に限定） | 「"Last Tell"」 | 同名のアプリは見つからず。出てきたのは TellMee、TELL - A world of stories、LastLight など別名のアプリだけ |
| Web 全体（Steam・itch.io なども） | 「"Last Tell" game」「"Last Tell" app poker」 | 同名のゲームは見つからず。ポーカー系の近い名前は「Poker Tells: Holdem Coach」くらい（名前の重なりは "Tell" のみ） |

## 未確認の部分（ご自身で数分で確認できます）

1. **J-PlatPat**：https://www.j-platpat.inpit.go.jp/ →「商標」→「商標検索」→ 称呼（単純文字列検索）に「ラストテル」、区分に「9」「41」を入れて検索。念のため「ラストテール」「ラスト」+「テル」の近い読みも。
2. **App Store**：iPhone の App Store アプリで「LAST TELL」「ラストテル」を検索。
3. **Google Play**：Play ストアアプリで同じく検索。

この3つで何も出なければ、名前はそのまま進めてよいと考える。出願するかどうかは別の判断（自分で出願する場合の費用目安は ../prerelease/リリース前調査.md の「3. アプリ名と商標」）。

## 出典

- https://trademarks.justia.com/search?q=last+tell
- https://apps.apple.com/us/app/tellmee/id6759203968
- https://apps.apple.com/us/app/-/id1497729889
- https://apps.apple.com/app/id6754295447
- https://chrome-stats.com/d/id6760679623 （Poker Tells: Holdem Coach）
- https://m-jockey.co.jp/keiba-navi/hose/2011106242/ （「ラストテル」検索のヒット。実際は競走馬ラステラ）
