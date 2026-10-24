# Web版以外の動かし方（描画の速さ）提案（2026-10-22）

satouさん「画面の描写等のパフォーマンスを改善するために、Web版以外のものも検討できませんか？」への答えです。対象は v0.98.7（story/shisho.html）、PC 前提。

## 結論
- **アプリに包むだけ（Electron など）では、描画はほぼ速くなりません。** Electron も Windows の Tauri（WebView2）も、中身は Chrome と同じ描画エンジン（Chromium）だからです。Electron の公式資料も「Chrome より速く描ける」とは言っておらず、速さは中のコードを直すことで出す、としています。
- 速くなる本命は **描き方そのものを変えること**（卓を Canvas/WebGL＝PixiJS で描く、または Godot 等で作り直す）。ただし今の 1.7MB のコード・顔の絵・自動検査（画面の部品の位置を測る仕組み）をほぼ作り直すことになり、**数週間〜数か月かかり、1.0 が大きく遅れます。**
- **おすすめ：案A（Web版のまま、重さの元を直す ＋ satouさんの PC の設定を確認）。** Electron は Steam を出すと決めた時に作れば十分（そのときの手間は1〜2日）。

## 今の重さの元（PC 1280×800 と 1920×1080 で測定）
フリー6人卓を普通の速さで自動で打ち、相手が打つ間を測りました。測った機械には GPU が無いので、コマ数は実機よりかなり低く出ます（比べ方は正しい）。

| 中身 | 1秒あたり | 包むと変わる？ |
|---|---|---|
| 画面の絵を塗る（ラスター） | 700〜1100ms（GPUが無いので重く出る） | 変わらない。実機の Chrome も Electron も GPU で塗る |
| ゲームの計算（JS） | 60〜130ms | 変わらない（同じ JS エンジン） |
| 部品の並べ直し（スタイル・レイアウト） | 約50ms | 変わらない |
| 相手が打った瞬間の「カクッ」 | 最大 0.36 秒の止まりが12秒に約10回 | 変わらない（ゲームのコードが原因） |

- ぼかし・影を全部消す／動きを全部止める、も試しましたが差は誤差の範囲。**重さは「特定の飾り」より「画面全体を何度も塗り直していること」と「相手が打つたびの処理」**。
- 「カクッ」は前回（アニメーションの重さ 案2）で減らしましたが、PC の広い卓・リッチ演出（v0.98.x）を足したあと、まだ残っています。

## 案
| 案 | 中身 | 速くなるか | 手間・お金 | 危なさ | 評価 |
|---|---|---|---|---|---|
| **A Web版のまま直す** | ①satouさんの PC で Chrome の「ハードウェア アクセラレーション」が効いているか確認（効いていなければこれだけで大きく変わる）②PC 広い卓で「カクッ」と塗り直しの元を測って直す ③CI の重さ検査を PC の大きさ・演出ありでも測る（今はスマホ・軽い設定だけ＝見逃しの元） | ○ 「カクッ」と塗り直しに直接効く | 小（数バージョン）・無料 | 低い | ◎ おすすめ |
| B Electron で包む（Windows アプリ） | 今の shisho.html をそのまま包む。Chrome の版を固定、GPU の使い方を指定できる、他のタブや拡張に邪魔されない。Steam 版の土台にもなる | △ ほぼ同じ（PC の GPU が Chrome で無効にされている場合だけ効くことがある） | 1〜2日・無料。配るなら署名なしだと Windows の警告が出る（署名は有料） | 低い | ○ Steam を決めた時に |
| C 卓を PixiJS（Canvas/WebGL）で描き直す | 卓・カード・チップ・顔を GPU で直接描く。ボタンや会話は今のまま | ◎ 塗り直しが大きく減る | 大（数週間〜）。顔の絵・カメラ・テル演出・英語版の表示・自動検査の作り直し | 高い（テルの見え方が変わる、検査が使えない期間ができる） | △ 1.0 の後に検討 |
| D Godot / Unity で作り直す | ゲームを丸ごと別の道具で作り直す | ◎ | 特大（数か月）。Unity は条件次第で有料 | 非常に高い（Web版・今の検査をほぼ捨てる） | × |

Tauri は Windows では中身が Edge（Chromium）で Electron と同じ速さ、Mac では Safari と同じ WebKit（これまで Safari だけの表示ずれが何度も出ている）なので見送り。

## クリエイター目線の3行
- 柱：「テルを読む」に効く。読む瞬間に画面がカクつくと間合いが崩れる。
- 最初の5分：第1章の卓から効く（案A の②③）。
- 1.0 か公開後か：案A は 1.0。案B は Steam を決めたら。案C は公開後。案D は見送り。

## 出典
- Electron 公式「Performance」: https://electronjs.org/docs/latest/tutorial/performance （Chromium を同梱、速さは中のコードの直しで出す）
- Tauri 公式「Webview Versions」: https://v2.tauri.app/reference/webview-versions/ （Windows=WebView2/Chromium、Mac=WKWebView、Linux=WebKitGTK）
- web.dev「Stick to Compositor-Only Properties」: https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count （塗り直しを伴わないのは transform と opacity だけ）
- PixiJS v8: https://pixijs.com/blog/pixi-v8-launches （WebGL/WebGPU で描く 2D 描画ライブラリ）
- Godot「Exporting for the Web」: https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html
- Steam 版の前の調査: release/Steam版の調査.md（Electron＋steamworks.js がおすすめ、Steam は未決定）

## 測った道具
- /mnt/project-files/research/Web版以外の動かし方/pctrace.js（PC の大きさで卓を自動で打ち、塗り・計算・並べ直しを測る。飾りなし・動きなしの比べ付き）
