# PC の CI を充実させる案（LAST TELL Godot 版、2026-10-23）

## 結論
PC のランナーは「本物の画面・本物の GPU（GTX 1070）・本物の Windows」で動いているので、GitHub の機械ではできなかった検査ができる。
おすすめは次の順で入れること。全部お金はかからない。

| 順 | 何を足すか | どこで・いつ | 見つかる不具合の例 | PR ごとに増える時間 |
|---|---|---|---|---|
| 1 | Windows でも画面の要る検査を回す（今は全部「⏭ 飛ばした」） | Windows・PR ごと | Windows の字の出方・3D の卓・カードのずれ | +5 分ほど |
| 2 | Windows の配布版（LastTell.exe）を書き出して、実際に起動・対戦・終了 | Windows・PR ごと | 配布版だけ落ちる・部品が抜ける（Linux では前に見つけた種類の Windows 版） | +3 分ほど |
| 3 | OpenGL が弱い PC 向けの代わりの描き方（ANGLE＝Direct3D 経由）でも起動 | Windows・PR ごと | ノート PC の内蔵 GPU で真っ黒・落ちる | +1 分 |
| 4 | 書き出した exe を Windows Defender で調べる | Windows・PR ごと | テスターの PC でウイルス扱いされて消される | +1 分 |
| 5 | 窓まわり：1280×720／1280×800（Steam Deck の大きさ）／1920×1080／横長 2560×1080 で起動、全画面⇄窓（F11）、最小化→戻す、別の窓に切り替えて戻る | Windows・PR ごと | 横長画面の黒帯の中の崩れ、全画面の切り替えで落ちる・固まる | +2 分 |
| 6 | 本物の GPU での重さ（画面ありで 1 分打って、こま落ち・引っかかり） | Windows・PR ごと（⚠ だけ、NG にはしない） | 新しい演出で急に重くなった | +2 分 |
| 7 | 起動の速さ（タイトルが出るまでの秒数）を毎回記録 | Windows・PR ごと（⚠ だけ） | 素材を足して起動が遅くなった | +数秒 |
| 8 | 長く遊ぶ検査（1 時間自動で打って、メモリの増え方・エラー・落ち） | Windows と Linux・毎晩（main） | 長く遊ぶと重くなる・落ちる | PR には足さない |
| 9 | 保存中に強制終了しても、次に起動したら続きから遊べるか | Windows・PR ごと | 電源が落ちたら保存が壊れた | +1 分 |
| あと | コントローラー（Xbox のパッドは PC にある）、Steam の機能、Steam Deck（Proton） | Steam に出すと決めてから | — | — |

## PC の様子（2026-10-23 に調べた）
- Windows 10 Home 22H2、Core i7-8700、メモリ 32GB、GeForce GTX 1070（ドライバ 582.78）。E: の空き 234GB。
- ランナーは satou さんのログオン中の画面で動いているので、窓を出す検査ができる。
- Godot 4.7.2 は Vulkan・Direct3D 12・OpenGL のどれでも問題なく起動した。ゲームは OpenGL（Compatibility）を使う。
- 画面は 2 台（どちらも 1920×1080、拡大率 100%）。Xbox 360 のパッドがつながっている。Steam は E:\Steam。Windows Defender は動いている。
- WSL の Ubuntu からも GPU が見える。

## 気をつけること
- **検査の窓が satou さんの画面に出る。** 1〜6 を回すあいだ（PR ごとに 10 分ほど）、ゲームの窓が開いたり閉じたりする。
  右側の 2 台目の画面に出し、前に出てこないようにする。
  PC を使っているときにじゃまなら、「検査の窓を出さない」時間を決めることもできる（そのあいだは今まで通り画面なしだけ回す）。
- 長く遊ぶ検査（8）は、夜に PC が付いていないと回らない。付いたときに順に回る。
- 6・7 は PC の使い方（ほかのゲームを動かしている等）で数字がゆれるので、⚠ だけにして NG にしない。数字は qa-results に残し、急に悪くなったら知らせる。

## PC ゲームならではのもの（調べた結果）
- **Steam Deck の審査**では、1280×800 で一番小さい字が 9px 以上（12px をすすめる）、30fps 以上、コントローラーだけで全部遊べる、などが見られる。今の字の大きさの検査は 1280×720 で 12px 未満を NG にしているので、字は満たしている。5 で 1280×800 も見るようにする。コントローラーは Steam に出すと決めてから。
- **ウイルス対策ソフトの誤検知**：Godot で作った exe は Windows Defender に誤ってウイルス扱いされることがある（Godot 公式フォーラムでも報告あり）。テスターに配る前に 4 で見つけ、出たら Microsoft に誤検知として報告する。
- **OpenGL の弱い PC**：Godot の Compatibility は、OpenGL が使えない Windows の PC では Direct3D 経由（ANGLE）に切り替えて動く。3 でその道も確かめる。
- **窓の扱い**：全画面の切り替え、最小化、別の窓への切り替え、横長や大きい画面は、PC ゲームでよく壊れる所（GitHub の機械の画面には窓の管理がないので確かめられなかった）。

## 出典
- Steamworks「Steam Deck 互換性の審査」：https://partner.steamgames.com/doc/steamdeck/compat
- Godot 公式「Command line tutorial」（--rendering-driver・--resolution・--position など）：https://docs.godotengine.org/en/4.4/tutorials/editor/command_line_tutorial.html
- Godot 公式「Exporting for Windows」：https://docs.godotengine.org/en/4.4/tutorials/export/exporting_for_windows.html
- Godot フォーラム「Windows Defender が Godot の exe を危険と言う」：https://forum.godotengine.org/t/windows-defender-warns-me-that-the-godot-4-6-3-executable-is-dangerous/139517
- Godot フォーラム「GitHub Actions の機械では Vulkan が動かない」：https://forum.godotengine.org/t/how-can-the-official-godot-build-run-in-github-actions-without-encountering-errors-with-the-vulkan-driver/86611
- 前の調べ：research/PCゲームのテスト方法.md
