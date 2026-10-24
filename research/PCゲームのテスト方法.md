# PCゲームのテスト方法（LAST TELL Godot 版に当てはめ）

2026-10-22 調べ。対象は Godot 4.7.2 で作っている PC 版（Windows の exe、Steam は未定）。

## 結論
- **ゲームの中身の検査（ルール・CPU・物語・画面の崩れ・押せる場所・重さ）は、もう業界の基本より厚い。** Web 版と何万件も照合しているのは、ふつうの単体テストより強い。
- **足りないのは「PC という環境の違い」の検査。** 今の検査は全部、クラウドの Linux（画面なし or 仮の画面、1600×900）で動いている。実際の Windows・いろいろな GPU・画面の大きさ・キーボード操作・保存の壊れ・落ちたときの記録は、まだ何も見ていない。
- **おすすめ（お金はかからない順）：** ①検査を GitHub Actions で自動に回し、Windows の exe も起動して確かめる ②画面の大きさ 5 種類（ウルトラワイド・4K 拡大 150% を含む）で崩れを撮る ③ゲーム内に「重さ計測モード」を入れて satou の PC で 1 回測る ④保存ファイルの壊れ・古い版の検査 ⑤落ちたときに記録が残る仕組み ⑥テスターに exe を配る手順。
- **決めてもらうこと 1 つ：** コントローラー（ゲームパッド）と Steam Deck に対応するか。→ カードで聞きます。

## 1. 今やっていること（2026-10-22 時点）
| 種類 | 今あるもの | 場所 |
|---|---|---|
| ルール・役・乱数 | Web 版と 8,741 件照合 | game/tests/run_core.gd |
| CPU の判断 | 25,341 件照合 | tests/run_cpu.gd |
| ハンドの流れ・配り・物語の卓 | 580 ハンド／6,044 件／253 ハンド照合 | run_hand / run_deal / run_chapters |
| 会話・モード・英語・字・音楽 | 照合と抜けの検査 | run_talk / run_modes / run_i18n / check_fonts / check_music |
| 画面の崩れ | 23 場面 × 4 大きさで重なり・はみ出し | run_screens / shot_modes |
| 押せる場所 | 見えない入れ物が札をふさがないか | run_clicks |
| 重さ | 自動で打って 1 こまの処理が 50ms 超えで NG（処理だけ） | perf_table |
| まとめ | 16 種類を約 5 分 | tools/qa.sh（クラウドの中で手で動かす） |

Web 版のときは GitHub Actions（qa.yml、9 並列）で PR ごとに自動で回していたが、**Godot 版はまだ GitHub に入っておらず、自動では回っていない。**

## 2. 業界のやり方と、LAST TELL との差
### 2-1 自動テストと CI
- Godot では GUT か gdUnit4 が定番。gdUnit4 には公式の GitHub Action があり、Godot 4.0 以降で動き、結果を JUnit 形式で PR に出せる（出典：gdUnit4-action）。
- 今の `--script` で動かす自前の検査で十分に回っている。**入れ替える必要はない。** 足りないのは「毎回自動で回ること」だけ。
- **提案 A：** godot/ を GitHub のリポジトリに入れ、PR ごとに tools/qa.sh を Actions で回す（Linux）。Web 版の qa.yml と同じ形。
- **提案 B：** 同じ Actions で **Windows の機械（windows-latest）で exe を書き出して起動**し、「立ち上がる → 自動で 20 ハンド打つ → エラー 0 で終わる」を見る（スモークテスト）。Windows でしか起きない不具合（パスの区切り、フォント、OpenGL の初期化）を拾える。
  - 注意：Actions の Windows 機は GPU がない。描画まで見るのは無理なので「起動して最後まで回るか」だけを見る。私的リポジトリだと Windows は無料分の消費が 2 倍（公開リポジトリは無料）。

### 2-2 画面の見た目の比べ（スクリーンショット回帰）
- 今は「重なり・はみ出し」を計算で見ている。プロの現場では、**前の版の写真を「正解」として保存し、新しい写真と画素で比べて違いを出す**ことも多い（ゴールデンイメージ）。
- **提案 C：** run_screens の写真を正解として保存し、差が一定以上の場面だけ「見た目が変わった」と ⚠ を出す。意図した変更なら正解を更新。演出の乱数は種を固定して同じ絵にする。

### 2-3 画面の大きさ・解像度
- 今の設定は 1600×900 基準、stretch=canvas_items・aspect=keep。**keep はウルトラワイド（21:9）だと左右が黒い帯になる。** Godot の公式説明では、横に広い画面に広げたいときは aspect=expand を使う（出典：Godot Multiple resolutions）。黒帯で良いか、卓を広げるかは見た目で決める。
- 業界のチェック表（Steam Deck の基準など）では、**一番小さい字が 1280×800 で 9px 未満にならない**ことが求められる（出典：Steam Deck compat）。
- **提案 D：** 写真を撮る大きさを 4 → 5 種類に：1280×720、1920×1080、2560×1440、3440×1440（ウルトラワイド）、3840×2160。あわせて「一番小さい字の高さ」を測る検査を足す。窓モード⇄全画面の切り替え、Alt+Tab で戻ったときに止まらないかも見る（出典：Snoopgame の PC QA の落とし穴 #5）。
- Windows の「表示スケール 150%」の PC では、Godot の窓がぼやけたり小さくなったりしないか、satou の PC で 1 回確認（自動ではできない）。

### 2-4 重さ（フレーム時間）
- 業界では「低・中・高スペック、GPU は NVIDIA / AMD / Intel 内蔵を混ぜた表」で測る（出典：Snoopgame #1、QAwerk）。Steam Deck の基準は 1280×800 で 30fps。
- 今の perf_table は**処理だけ**で、描画（GPU）は測っていない。
- **提案 E：** ゲームに「重さ計測モード」（起動オプション `-- bench`）を入れる。卓を自動で 2 分打ち、1 こまの時間（処理＋描画）の平均・一番遅い 1%・50ms 超えの回数を `user://bench.txt` に書く。satou の PC で 1 回、できれば内蔵 GPU のノート PC でも 1 回。テスターにも同じものを頼める。
- 描画方式は Compatibility（OpenGL 3.3）。古い・相性の悪い Windows のドライバで真っ黒・落ちることがあるので、Godot の「OpenGL がだめなら Direct3D 経由（ANGLE）に切り替える」設定が有効か確かめる（要確認：プロジェクト設定 rendering/gl_compatibility の fallback）。

### 2-5 入力（マウス・キーボード・ゲームパッド）
- 今はマウスだけ想定（project.godot に入力の割り当てなし）。
- PC ゲームの QA では入力の種類ごとに別の通しをする（キーボードだけ、コントローラーだけ、途中で抜き差し）（出典：Snoopgame #4）。
- Steam Deck「Verified」には**コントローラーだけで全部遊べる**、画面のボタン表示がコントローラーに合う、文字入力は画面キーボード、が必要（出典：Steam Deck compat）。
- → 対応する範囲は satou に決めてもらう（下の「決めること」）。

### 2-6 Windows の書き出し
- 今は exe 1 つにデータを埋め込む設定（embed_pck=true）、署名なし。
- Godot の公式説明：**埋め込みはウイルス対策ソフトの誤検知を招くことがあり、Steam で配るときだけにすすめる**。署名すると SmartScreen の警告が減るが、証明書は有料（出典：Godot Exporting for Windows）。
- **提案 F：** テスターに直接 exe を配るあいだは embed_pck=false（exe と .pck の 2 つを zip）にする。署名は有料なので今はしない（「詳細情報 → 実行」の案内をテスター向けに書く）。Steam で出すならあとで埋め込みに戻せる。
- あわせて、管理者でない Windows アカウント・日本語の入ったユーザー名・空きの少ないドライブで起動できるかを最初のテストで見る（出典：Snoopgame #7）。

### 2-7 保存
- 保存は `user://save.json`（Web 版と同じキー）。
- 業界でよく出るのは「途中で落ちた・電源が切れた・古い版の保存・壊れた保存」の読み込み不具合（出典：Snoopgame #3）。
- **提案 G：** 検査に「壊れた JSON・空ファイル・Web 版の古い形・未来の版の保存」を読ませても落ちない、を足す。書き込みは一度別名に書いてから置き換える（途中で落ちても壊れない）。
- Steam Cloud：Steam で出すなら、コードを変えない「Auto-Cloud」で `%APPDATA%\Godot\app_userdata\LAST TELL\` を同期できる。2 台の PC で行き来する確認手順が公式にある（出典：Steam Cloud）。画面設定など PC ごとの値は同期するファイルに入れない、が公式の注意。今の save.json に解像度などを入れないようにしておく。

### 2-8 落ちたときの記録（クラッシュ報告）
- 今は何もない。テスターの PC で落ちても理由がわからない。
- 無料でできる最小：Godot の「ログをファイルに書く」設定を有効にし（`user://logs/`）、起動時に前回が異常終了だったら「ログを送ってください」とフォルダを開くボタンを出す。
- 本格的には Sentry の Godot 用 SDK がある。スクリプトのエラーと Windows の本体の落ち方（ミニダンプ）を自動で集められる（出典：Sentry for Godot）。外にデータを送るので、使うならプライバシーポリシーを直し、送る前に同意を取る。無料枠あり（料金は使う前に確認）。→ テスター版はまず「ログ保存＋送ってもらう」で十分。

### 2-9 テスター（プレイテスト・ベータ）
- 既に launch/観察テストの手順.md・テストプレイ計画.md・感想アンケートがある（Web 版向け）。
- Steam の「Playtest」は無料で、ストアのページから申し込み、人数を区切って招待できる。ただし秘密にはできない（NDA なし）。Steam 版の登録（有料）が前提（出典：Steam Playtest）。ベータ用の「ブランチ」でテスト版だけ配ることもできる（出典：Steam Branches）。
- **提案 H：** Steam を決めるまでは、zip の exe を知り合いのテスターに直接渡す。手順書に「重さ計測モード」「ログの場所」「PC の情報（GPU・画面の大きさ）を書く欄」を足す。

## 3. おすすめの順番（全部お金なし）
| 順 | やること | 担当の目安 |
|---|---|---|
| 1 | godot/ を GitHub に入れ、qa.sh を Actions で自動に（A） | Godot の移植の中心スレッド |
| 2 | Windows で exe を起動して 20 ハンド回すスモークテスト（B） | 同上 |
| 3 | 画面 5 大きさ＋一番小さい字の検査（D）、テスター配布は embed_pck=false（F） | 同上 |
| 4 | 保存の壊れ検査と安全な書き込み（G）、ログ保存と異常終了の案内（2-8） | 同上 |
| 5 | 重さ計測モード（E）→ satou の PC で 1 回 | 同上＋satou |
| 6 | 写真の正解比べ（C） | 画面がほぼ固まってから |
| 7 | テスター手順書を PC 版向けに直す（H） | テスト公開の前 |
| あと | コントローラー・Steam Deck、Steam Cloud、Sentry、署名 | 決めてから |

## 4. 決めたこと（2026-10-22 12:43Z satou「おすすめで進めて」）
- §3 の順番で全部進める。入力は「キーボードだけで全部遊べる」まで。コントローラー・Steam Deck は Steam に出すと決めてから。実装は Godot 移植の中心スレッド。

## 4b. 元の問い
- **コントローラーと Steam Deck に対応するか。** おすすめは「キーボードで全部遊べるようにしておく（コントローラーはあとから足しやすくなる）」。Steam に出すと決めたらコントローラーと Deck を足す。

## 出典
- gdUnit4 公式 GitHub Action：https://github.com/MikeSchulze/gdUnit4-action
- Godot 公式「Multiple resolutions」：https://docs.godotengine.org/en/4.4/tutorials/rendering/multiple_resolutions.html
- Godot 公式「Exporting for Windows」：https://docs.godotengine.org/en/4.4/tutorials/export/exporting_for_windows.html
- Godot 公式「Command line tutorial」：https://docs.godotengine.org/en/4.5/learning/editor/command_line_tutorial.html
- Steamworks「Steam Deck 互換性の審査」：https://partner.steamgames.com/doc/steamdeck/compat
- Steamworks「Steam Playtest」：https://partner.steamgames.com/doc/features/playtest
- Steamworks「Branches」：https://partner.steamgames.com/doc/store/application/branches
- Steamworks「Steam Cloud」：https://partner.steamgames.com/doc/features/cloud
- Sentry for Godot：https://docs.sentry.io/platforms/godot
- Snoopgame「Top 7 Pitfalls in PC Game QA」：https://snoopgame.com/blog/top-7-pitfalls-in-pc-game-qa-and-how-to-avoid-them/
- QAwerk「Game Compatibility Testing」：https://qawerk.com/blog/game-compatibility-testing/
