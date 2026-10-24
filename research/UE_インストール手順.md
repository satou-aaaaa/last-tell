# Unreal Engine 5.8 を G: に入れる手順（satou さん用）2026-10-22

satou さんが手でやるのは ★ の所だけです。ほかは Claude がPCで準備します。

## Claude がやること（Remote Control）
- G: にフォルダを作る：`G:\UE\Engine`（エンジン）、`G:\UE\Projects`（プロジェクト）、`G:\UE\DDC`（作業中にたまる一時ファイル）
- 一時ファイルの置き場を G: にする設定：`setx UE-LocalDataCachePath G:\UE\DDC`（C: にためないため。公式の方法）
- Epic Games Launcher を開く

## ★ satou さんがやること（10分くらい。あとはダウンロード待ち）
1. Epic Games Launcher にサインインする（パスワードは satou さんが入れてください）
2. 左の「Unreal Engine」→ 上の「ライブラリ」→「エンジンのバージョン」の横の「＋」
3. 出てきた枠のバージョンが **5.8** になっているのを確かめて「インストール」→ 規約に同意
4. 「インストール先の選択」で「参照」→ **G:\UE\Engine** を選ぶ
5. 「オプション」を開き、次は**外す**（容量を減らす）：Android・iOS・Linux などのターゲットプラットフォーム、エディタのデバッグ用シンボル
6. 「適用」→「インストール」。数時間かかります。終わったら Claude に「終わった」と送ってください

## 終わったあと（Claude）
- `G:\UE\Projects\JinPilot` に空のプロジェクトを作り、MetaHuman のプラグインを有効にしておく
- 表示品質を「中」にして、エディタが開くか、どのくらいの速さで動くかを確かめる

## 出典
- インストールと入れ先の選び方：https://dev.epicgames.com/documentation/en-us/unreal-engine/install-unreal-engine
- 一時ファイル（DDC）の置き場所 `UE-LocalDataCachePath`：https://dev.epicgames.com/documentation/unreal-engine/using-derived-data-cache-in-unreal-engine
