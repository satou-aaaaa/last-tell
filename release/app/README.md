# LAST TELL アプリ版（Capacitor）のひな形

作成：2026-10-09。ゲーム本体（`story/shisho.html`）をそのまま包んで、Android と iPhone のアプリにするためのプロジェクト。
**まだストアには何も登録していない。** 広告IDは Google のテスト用なので、本物の広告は出ない。

## 中身

| 場所 | 中身 |
|---|---|
| `src/platform.js` | アプリ版だけで動く部分：同意画面（UMP）→ iPhone の追跡許可（ATT）→ AdMob、Firebase（計測・クラッシュ・遠隔設定）、戻るボタン、裏に回ったときの音、セーブの二重保存（Preferences）、ファイル保存、強制アップデート |
| `src/config.js` | 本番前に差し替える値（広告ID、ストアのURL、広告の頻度） |
| `scripts/build-www.mjs` | shisho.html から `www/` を作る。platform.js を先に読ませ、フォント（490ファイル、約12MB）を同梱してネットなしで表示できるようにする |
| `capacitor.config.json` | アプリID `com.satou.lasttell`（仮）、名前、背景色 |
| `android/`、`ios/` | Capacitor が作ったネイティブのプロジェクト。AdMob のテスト用アプリID、追跡許可の説明文、暗号化の申告（なし）を設定済み |
| `assets/` | 仮アイコン（文字だけの LT）と起動画面。各サイズは生成済み |

ゲーム本体は、ブラウザで開いたときは `platform.js` が何もしないので、Web版とアプリ版で同じファイルを使える。
ゲーム本体に必要な呼び口（`LT_PLATFORM`、`LT_back`、`window.Sound`）は [ゲームに入れる分_実装仕様.md](../ゲームに入れる分_実装仕様.md) の C に書いた。

## 確認したこと（2026-10-09）
- `www/` をブラウザで開いて、ゲームが動き、エラーがなく、**外部への通信が1件もない**（フォントも同梱分で表示）こと。
- `npx cap add android` / `ios` でネイティブのプロジェクトが作れること。
- **Android のビルド（APK）はまだ試せていない。** この作業環境から Google のダウンロード先につながらず、Android SDK を入れられないため。satouさんの PC で Android Studio を使って初めて確かめることになる。

## 動かし方（satouさんの PC で）
1. Node.js（v22 以上）と Android Studio を入れる。iPhone 版は Mac と Xcode が必要（なければ後回し）。
2. このフォルダで `npm install`
3. `npm run sync`（shisho.html から www/ を作り、ネイティブ側に写す）
4. `npm run android` で Android Studio が開く → ▶ で実機かエミュレーターに入れる

## 本番の前にやること（取り消せない／お金が絡むので、satouさんの確認後）
| やること | 誰が | メモ |
|---|---|---|
| **アプリID（パッケージ名）を決める** | satou | 一度ストアに出すと変えられない。今は仮の `com.satou.lasttell` |
| Firebase のプロジェクトを作り、`google-services.json`（Android）と `GoogleService-Info.plist`（iOS）を入れる | satou（Google アカウントで） | 入れるまで計測・クラッシュ検知は動かない（ゲームは動く） |
| Crashlytics の Gradle プラグインを有効にする | Claude | Firebase の設定ファイルが入ってから |
| AdMob のアカウントとアプリを登録し、`config.js` と AndroidManifest / Info.plist のIDを本物に替える | satou → Claude | テスト中は必ずテストIDのまま |
| AdMob の「プライバシーとメッセージ」で EU 向けの同意画面と、追跡許可の前置き画面を作る | satou（管理画面） | |
| Remote Config に `min_version`（文字）と `interstitial_every`（数）を作る | Claude（Firebase に入れてもらえれば） | |
| 署名の鍵を作り、Play App Signing に登録 | satou | 鍵とパスワードは2か所にバックアップ |
| 米国の州法の年齢確認（Play Age Signals、Declared Age Range） | Claude | [ストア申告の回答案.md](../ストア申告の回答案.md) 5章。プラグインの対応を見て入れる |

## 広告の出し方（案）
収益化調査のとおり、毎ハンドではなく区切りで出す。
- インタースティシャル：章のクリア／負け、フリー対戦の終了のとき `LT_PLATFORM.adBreak(place)` を呼ぶ。3回に1回だけ出る（Remote Config で変えられる）。第1章の途中には出さない。
- リワード：フリー対戦でチップが尽きたとき「動画を見て続ける」。`LT_PLATFORM.canShowRewarded()` が true のときだけボタンを出す。
- 広告を消す買い切りは、アプリ内課金が必要になるので今は入れない（入れると住所の公開などが増える）。

## あとで良くするところ
- フォントを、ゲームで実際に使う文字だけに絞る（12MB → 1〜2MB の見込み、推測）。
- 同意の結果を Firebase に渡す部分は簡易版（同意したら4項目とも許可）。項目ごとに分けるなら、UMP が保存する IAB の文字列を読む。
