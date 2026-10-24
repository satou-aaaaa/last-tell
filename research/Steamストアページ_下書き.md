# Steam ストアページの下書き（PC 版・Godot）

作成：2026-10-23（ドラえもん）。**下書きだけ**です。Steamworks への登録・支払い・入力はしていません。
元にした物：[release/Steam版の調査.md](../release/Steam版の調査.md)（10-09、Web/Electron の頃）、[release/ストア掲載_英語版.md](../release/ストア掲載_英語版.md)、[release/ストア申告の回答案.md](../release/ストア申告の回答案.md)。
今の中身（Godot の PC 版・本物の大きさの卓・3D の人・声・ディーラーのイズミ）に合わせて書き直しました。

確かめた公式の説明：
- 説明文の決まり：[Steamworks「Description」](https://partner.steamgames.com/doc/store/page/description)：短い説明は書式なしで数百字。「発売中」など時期の言葉は入れない。説明文にリンク・偽のボタン・ほかの製品の宣伝は入れない
- タグ：[Steamworks「Steam Tags」](https://partner.steamgames.com/doc/store/tags)：発売前に 5 つ以上、おすすめは 20 まで（見えるのも効くのも上位 20）。上の 5 つで何のゲームか分かるように、具体的な物を上に
- 画像：[Steamworks「Store Graphical Assets」](https://partner.steamgames.com/doc/store/assets/standard)：下の表
- AI の申告：[Steamworks「Content Survey」](https://partner.steamgames.com/doc/gettingstarted/contentsurvey)：遊ぶ人が見る・聞く、AI で作った物（絵・音・文・翻訳）を書く。ゲーム中にその場で AI が作る物は、出してはいけない物を出さない仕組みも書く

---

## 1. 名前
- 日本語：**LAST TELL（最後のテル）**
- 英語：**LAST TELL**（副題を付けるなら「LAST TELL: Poker Mentor」。10-09 の英語版の案）

## 2. 短い説明（Short Description）
日本語（約 120 字）：
```
消えた伝説の打ち手・ジンに弟子入りし、港町のポーカークラブを一軒ずつ回るテキサスホールデムの物語。本物の大きさの卓に座り、相手の顔とクセ（テル）を見て、嘘を見抜く。初めてでも、ジンが一手ずつ教えます。
```
英語（約 260 字）：
```
Apprentice yourself to Jin, a poker legend who vanished fifteen years ago, and take on the harbor town's clubs one table at a time. Sit at a life-size table, read your opponents' faces and tells, and see through the bluff. New to poker? Jin teaches you, one hand at a time.
```

## 3. このゲームについて（About This Game）
日本語：
```
港のはずれのバーで、負けてばかりの新人が、ひとりの老人に出会う。
「……負け方も知らねえのか」
男の名はジン。十五年前、卓から消えた伝説の打ち手だった。

LAST TELL は、ひとりで遊ぶテキサスホールデムの物語です。ジンに弟子入りし、街のポーカークラブを一軒ずつ回ります。

■ 師匠がとなりにいる
ポーカーが初めてでも大丈夫。第1章では、ジンが役の強さと降りどきを一手ずつ教えます。章ごとに、ブラインドを盗む、ブラフ、嘘を見抜く、と新しい勝ち方を覚えます。

■ テル（クセ）を読む
強い手のときにチップへ目が行く。弱いときに急に口数が増える。
相手にはみな、手の内がにじむクセがあります。顔としぐさを見て、ブラフを見抜いてください。

■ 本物のポーカールームの卓
本物の大きさの卓に座った目線で、カードは布の上をすべり、チップは手で押し出されます。卓を回すディーラーもいます。

■ 店ごとの決まり
港のバー、古いクラブ、ジャズクラブ、ホテルのラウンジ。店にはそれぞれ主と、ストラドルなどの決まりがあります。

■ 十五年前、何があったのか
どの店でも、ジンの昔なじみが「あの日」のことをほのめかします。ジンはなぜ卓を離れたのか。題名の「LAST TELL」の意味は。

■ 公平で、買って強くなる物はありません
物語の章では、話が進むように配る札を調整しています。フリー対戦では毎回公平に切ります。お金で強くなる物はありません。チップはお金や景品に換えられません。

このゲームには模擬的なギャンブルが含まれます。現実のお金や景品を得ることはできません。
```
英語：release/ストア掲載_英語版.md の Full description を元に、次の 2 か所を今の中身に替える。
- 「■ A REAL CARD ROOM TABLE：Sit at a life-size table at eye level. Cards slide across the felt, chips are pushed in by hand, and a dealer runs the game.」を足す
- 章の数は、発売時の中身どおりに書く（「Part 1 and Part 2, 12 chapters」など。決まったら直す）

書くときに守ること（satou さんの決まり）：会話の中でお金の話はしない／「あの夜」ではなく「あの日」／題名・名前に「夜」を使わない／ジンの本物のテル（第7章）は書かない。

## 4. タグ（上から重い順、20）
| 順 | タグ | 理由 |
|---|---|---|
| 1 | Poker | いちばん具体的なジャンル |
| 2 | Card Game | |
| 3 | Story Rich | 物語が中心 |
| 4 | Singleplayer | |
| 5 | Gambling | 同じ種類のゲームに付いている（模擬ギャンブル） |
| 6 | Strategy | |
| 7 | Psychological | 相手を読む |
| 8 | Atmospheric | |
| 9 | Noir | 港町・夜の店の雰囲気（説明文では「夜」を題名に使わないだけで、タグは雰囲気の名前） |
| 10 | Realistic | 本物の大きさの卓・3D の人 |
| 11 | 3D | |
| 12 | Turn-Based | |
| 13 | Tabletop | |
| 14 | Mystery | 十五年前の出来事 |
| 15 | Drama | |
| 16 | Simulation | |
| 17 | Casual | 初めてでも遊べる |
| 18 | Indie | ひとりで作っている |
| 19 | Dark | 落ち着いた暗めの色 |
| 20 | Japan | 舞台・登場人物が日本 |

（タグの名前は Steam の一覧にある物だけ選べる。登録したあと Tag Wizard で、同じ種類のゲーム〔Prominence Poker など〕のタグと見比べて直す）

## 5. 必要なスペック（案）
2026-10-23 に決めた重さの目安（gamedev-best-practices：1 こま 16.7ms、最低 GTX 1050 Ti / Iris Xe・メモリ 8GB）から。**satou さんの PC と、低めの PC で測ってから確定**する。
| | 最低 | おすすめ |
|---|---|---|
| OS | Windows 10 64-bit | Windows 11 64-bit |
| CPU | 4 コア 2.5GHz 以上（Intel Core i5 第 6 世代 / Ryzen 3 1200 くらい）（推測） | 6 コア（Core i5 第 10 世代 / Ryzen 5 3600 くらい）（推測） |
| メモリ | 8 GB | 16 GB |
| グラフィック | GeForce GTX 1050 Ti / Intel Iris Xe（Vulkan 1.0 か DirectX 12） | GeForce GTX 1660 / Radeon RX 5600 以上 |
| ストレージ | 2 GB の空き（いまの 3D 試遊版は exe 109MB＋データ 689MB） | SSD |
| 備考 | 3D の人・卓は Godot の Forward+ で描く。対応していない PC では自動で軽い描き方（Compatibility）になる | |

## 6. AI の使い方の申告（内容アンケートの第 3 節）の文案
ゲームを作る途中で AI を使った（Pre-Generated）。遊んでいる間に AI が何かを作ることはない（Live-Generated なし）。
日本語：
```
このゲームの開発には、生成 AI（Anthropic の Claude）を使っています。プログラム、物語と会話の文、英語への翻訳、2D の人物の絵（コードで描く絵）、音楽（コードで鳴らす曲）を、開発者が AI と一緒に作り、すべて開発者が確認して直しています。
3D の人物は Epic Games の MetaHuman で作りました。卓と店の写真素材は Poly Haven・ambientCG の CC0 素材です。
遊んでいる間に AI が文や絵を作ることはありません。
```
英語：
```
This game was developed with the help of generative AI (Anthropic's Claude). The program code, story and dialogue text, English translation, 2D character art (drawn in code) and music (synthesized in code) were made by the developer together with AI, and all of it was reviewed and edited by the developer.
The 3D characters were made with Epic Games' MetaHuman. Table and venue photo materials are CC0 assets from Poly Haven and ambientCG.
No AI generates content while the game is running.
```
- 声（ボイス）を入れたら、その作り方（AI の声か、人の声か）をここに足す。
- 書く中身は「本当に使った物を全部・正直に」。あとから足した物があれば申告を直す。

## 7. 内容アンケート（年齢区分）の答えの要点
release/ストア申告の回答案.md の答えを、PC 版でもそのまま使える。PC 版で変わる所だけ：
- 広告：なし（Steam は広告で稼ぐゲームを禁止。PC 版にはもともと入れていない）
- ギャンブル：模擬的なギャンブルあり。現実のお金・景品に換えられない。チップを売らない
- お酒：バーが舞台（飲み物が卓にある）。飲むことをすすめる表現はない
- 性・暴力：なし

## 8. 用意する画像（[公式](https://partner.steamgames.com/doc/store/assets/standard) の大きさ）
| 物 | 大きさ | 要る？ | メモ |
|---|---|---|---|
| ヘッダー | 920×430 | 要る | 絵と題名のロゴだけ（ほかの字は入れない） |
| 小さいカプセル | 462×174 | 要る | ロゴがほぼいっぱいに。小さくても読めること |
| メインのカプセル | 1232×706 | 要る | ストアの最初のページの回る枠 |
| 縦長のカプセル | 748×896 | 要る | セールのページ |
| スクリーンショット | 1920×1080 以上（16:9）を 5 枚以上 | 要る | 遊んでいる画面だけ（宣伝の字・賞は入れない）。4 枚以上は「全年齢向け」に |
| ページの背景 | 1438×810 | 任意 | 無ければ最後のスクリーンショットから作られる |
| ライブラリーの絵（縦長・ヒーロー・ロゴ） | 別のページ | 要る | 登録のあと公式の「Library Assets」で大きさを確かめる |

スクリーンショットの候補（全部入りの試遊版ができたら撮る）：①第1章 錨亭でジンと座る ②テルの瞬間（「見えた」） ③本物の大きさの卓（6 人卓）④ディーラーとカードがすべる所 ⑤第4章 ホテルのラウンジ ⑥会話の場面 ⑦章の一覧。

## 9. satou さんに決めてもらうこと（どれも朝にまとめて）
1. Steam に出すか、出すならいつ「近日公開」のページを出すか（登録料 100 ドル。払うのは satou さん本人）
2. 値段の目安
3. 英語名を「LAST TELL」だけにするか、副題を付けるか
4. 必要なスペックは、satou さんの PC と低めの PC で測ってから決める（測り方は bench.bat）
