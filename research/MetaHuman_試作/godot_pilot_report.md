# MetaHuman → Godot 4.7.2 取り込み試作（Jin＝仮の顔 "Walter"）

2026-10-22。**流れの確認だけ**の試作。顔は仮（年配の白人の既製顔）で、本番の日本人の顔は作り直す。ゲームのキャラ作り（CharacterFactory）には**つないでいない**。

## 置いたもの
| 場所 | 中身 |
|---|---|
| `game/chars/_3d_pilot/jin_walter/fbx/` | Jin_Head.fbx（44MB）・Jin_Body.fbx（4.6MB）と `.import`（取り込みの設定） |
| `game/chars/_3d_pilot/jin_walter/tex/` | 使う絵 11 枚（Head/Body の Basecolor・Normal・SRMF、Eyes、Eyelashes、Teeth）。しわの絵（CM/WM）とマスクは未使用なので写していない |
| `game/chars/_3d_pilot/jin_walter/import_prune.gd` | 取り込み後に LOD と blend shape を間引く（下の「大きさ」） |
| `game/chars/_3d_pilot/jin_walter_test.tscn` / `.gd` | 見た目の確認シーン（頭＋体・材質・卓のランプ・胸から上のカメラ・撮影/計測モード） |
| `game/export_presets.cfg` | Web・Windows の `exclude_filter` に `chars/_3d_pilot/*` を足した（**書き出しに入らない**）。ほかのゲームのファイルは触っていない |

動かし方：
```
xvfb-run godot --path game --rendering-driver opengl3 res://chars/_3d_pilot/jin_walter_test.tscn -- shot=a.png [cam=face] [lod=0|2] [shape=jaw_open:1] [bone=FACIAL_C_Jaw:-12] [bench=秒]
```

## 結果
### 取り込み（ufbx）
- **頭も体も読めた**（Godot 4.7.2 標準の FBX 取り込み＝ufbx）。警告「Duplicate connection」が約 1.4 万件出るが害はなかった
- 向き：Z 上 → Y 上に自動で直る。単位はメートル。顔は +Z 向き、目の高さ y≈1.67
- 骨：頭 **875 本**（うち顔の FACIAL_* が 843 本）、体 **342 本**。頭と体は同じ骨の名前・同じ休みの形なので、同じ場所に置けば首でつながる
- 頭は LOD0〜7 の 8 つの MeshInstance3D（各 9 面＝head, teeth, saliva, eyeLeft, eyeRight, eyeshell, eyelashes, eyeEdge, cartilage。LOD2 は cartilage 無しの 8 面）。LOD0 = 34,659 頂点。体は LOD0〜3（LOD0 = 32,334 頂点）。UE の LodGroup は空の Node3D として来るだけで、**Godot は自動で切り替えない**（visible を自分で切り替える）
- 材質は名前だけ（M_GrayTexture_Head, M_Hide …）。絵はつかないので、シーンの中で面ごとに StandardMaterial3D を当てた

### blend shape（モーフ）
- Godot 上で **858 本**（全 LOD に同じ 858 本の名前が付く。LOD1 以降は中身がすべて 0 ＝ 実際に形があるのは LOD0 だけ）
- 内訳：head 737 / cartilage 76 / teeth 41（舌）/ eyeLeft・eyeRight 2 ずつ（瞳孔）
- 名前の例：`head_lod0_mesh__jaw_open`, `eye_blink_L`, `mouth_cornerPull_left`, `brow_raiseIn_L`, `eye_cheekRaise_L`, `nose_wrinkleFull_L`, `mouth_lipsPurse_UL`, `cheek_blow_left`, `neck_stretch_R`, `head_turnUp_D`、組み合わせの補正 `McornerPull_Mstretch_Jopen_L`, `MupperLipRaise_McornerDepress_Jopen_L`, `Mpurse_Mtowards_Mfunnel_Mtighten__ohTighten_UL`, `ElookUp_ElookRight_Eblink_R`, `Braise_Eblink_INL`、舌 `teeth_lod0_mesh__tongue_roll_IN`、瞳 `eyeLeft_lod0_mesh__eye_pupilWide_L`
- **ARKit の 52 形（jawOpen, eyeBlinkLeft …）ではない。MetaHuman（RigLogic）の補正の形**。名前は表情の部品に似ているが、1.0 にしても動きはごく小さい（いちばん大きい jaw_open で 8.1mm、eye_blink_L 2.1mm、mouth_cornerPull 2.0mm、brow_raiseIn 0.7mm）。顔の動きの本体は **843 本の顔の骨**で、DNA（RigLogic）が骨と補正の形を同時に動かす
  - 写真で確認：jaw_open・まばたき・笑い（cornerPull＋cheekRaise）を 1.0 にしても見た目はほぼ変わらない（godot_pilot_compat_blend_compare.png）。あごの骨 FACIAL_C_Jaw を -12° 回すと、あごは下がるが唇は閉じたまま（唇も別の骨が要る）
  - **つまり、この FBX だけではゲームで表情は作れない**。下の「次にすること」の (a)〜(c) のどれかが要る

### 大きさ・取り込みの時間（この機械、4 コア）
| 条件 | 取り込み | 頭の .scn |
|---|---|---|
| 初期設定のまま（858 形 × 8 LOD、自動 LOD 作成・影用メッシュあり） | 4分22秒 | **1.14 GB**（読み込み 3.5 秒・メモリ 1.2GB） |
| `import_prune.gd`（LOD0 と LOD2 だけ・基本の形 294 本だけ・自動 LOD/影用メッシュ/アニメなし） | 4分07秒 | **194 MB** |
| 体（4 LOD・形なし） | 数秒 | 2.2 MB |
- Godot は blend shape を「全頂点ぶんの配列」で持つ（差分だけを持たない）。858 本 × 3.5 万頂点 × 8 LOD でふくらむ。間引いても 294 本で GPU のバッファ約 **211MB**
- 取り込みの時間は ufbx の読み込みと 858 本の処理がほとんどで、間引きでは縮まない。**この FBX をゲームのプロジェクトに置くと、まっさらな取り込み（setup.sh・CI）が約 4 分のび、.godot に約 200MB 増える**
- 絵：VRAM 圧縮＋ミップマップにした（初期は「Lossless」で 3D には不向き）。法線マップは UE（DirectX 式）なので `normal_map_invert_y=true`

### 材質（SRMF の読み方＝推定）
- `*_SRMF.png`：**R＝Specular（鏡面の強さ、毛穴の凹凸入り）/ G＝Roughness（粗さ。鼻・唇まわりが別の値）/ B＝Metallic（全部 0）/ A＝Fuzz（産毛。唇・まぶたは 0）**。チャンネルを絵で見て判断。粗さは G を `roughness_texture_channel=GREEN` で直接使う（別の絵は作らない）
- 肌：Basecolor＋Normal＋粗さ（G）、**SSS（subsurf_scatter, skin_mode, 強さ 0.35）は Forward+ だけ効く**。Compatibility は SSS が無い（警告が出て無視される）ので、代わりに弱い rim
- 目：Eyes_Color＋Normal、eyeshell は透明（α0.04）で照り返しだけ、まつげは Eyelashes_Color の α で alpha scissor（0.3）＋両面
- saliva・eyeEdge・cartilage は透明にして消した（UE では透ける細工）。歯は Teeth_Color/Normal
- 照明：卓のランプ（暖色のスポット、前上、影あり）＋寒色の弱い補助光＋後ろの縁の光、背景は暗い色。カメラは胸から上（fov 30°、1.2m）

### 描画
- **Compatibility（opengl3、README と同じ撮り方）：動く**。ゲームのプロジェクトを手元に写して（.godot なし）まっさらに取り込み（全体 4分17秒、間引きも効いた）、その中でもこのシーンが撮れることを確かめた。書き出しで本当に外れるかは、書き出し用テンプレートを入れていないので未確認（exclude_filter の追加だけ）
- **Forward+（Vulkan、lavapipe＝CPU の Vulkan）：この入れ物でも動いた**（mesa-vulkan-drivers を入れて `VK_ICD_FILENAMES=…/lvp_icd.json`）。SSS が効いて肌がやわらかい

### 重さ（Compatibility、1280×720。**CPU で描く llvmpipe なので絶対値は当てにならない。比べるだけ**）
| 条件 | 1こま平均 | 三角形 | 描画呼び出し |
|---|---|---|---|
| 頭なし（体だけ） | 24.7ms | 6.1万 | 1 |
| 頭 LOD2 | 39.2ms | 7.8万 | 9 |
| 頭 LOD0 | 52.9ms | 12.5万 | 10 |
| 頭 LOD0＋形 3 本を 1.0 | 51.8ms | 12.5万 | 10 |
| 顔のアップ LOD0 / LOD2 | 66.7ms / 44.2ms | | |
- 頭 LOD0 は LOD2 の約 1.6 倍の三角形。顔のアップで描く画素が増えると重くなる（CPU 描画なので画素の数がきく）。本物の GPU では 1 人ならまず問題にならない量だが、**卓に 5 人並べる**なら LOD の切り替えは要る
- メモリ：GPU のバッファ 211MB（ほとんど blend shape）、絵 43MB（VRAM 圧縮後）、プロセス全体（RSS、llvmpipe 込み）約 600MB。**1 人あたり約 250MB の GPU メモリ**。5 人なら 1.2GB を超えるので、形の本数を絞るのが前提

## 写真（research/MetaHuman_試作/）
| ファイル | 中身 |
|---|---|
| godot_pilot_compat_bust.png | Compatibility・胸から上（体は A ポーズのまま） |
| godot_pilot_compat_face.png | Compatibility・顔のアップ |
| godot_pilot_compat_face_blend_jaw_open.png / _blink.png / _smile.png | blend shape を 1.0（ほぼ変わらない） |
| godot_pilot_compat_blend_compare.png | 上の 4 枚を並べたもの（ふつう・jaw_open・まばたき・笑い） |
| godot_pilot_compat_face_jawbone.png | あごの骨 −12° ＋ jaw_open（あごが下がる） |
| godot_pilot_compat_bust_armsdown_broken.png | 腕を骨だけで下ろすと肩に穴が開く例（肩の補正骨が追いつかない） |
| godot_pilot_forward_bust.png / _face.png / _face_jawbone.png | Forward+（lavapipe）・SSS あり |

## 問題
1. **表情が blend shape だけでは出ない**（顔は 843 本の骨＋RigLogic）。いちばん大きな問題
2. blend shape が重い：初期のままだと 1.14GB。間引いても 194MB／GPU 211MB
3. 取り込み 4 分：プロジェクトのまっさらな取り込み・CI が遅くなる
4. 体が A ポーズ。骨だけで腕を下ろすと肩に穴（補正骨も RigLogic/ポーズドライバ頼み）。座った姿勢の動きを UE 側で焼いて持ってくる必要
5. まつげが細く薄い・目が少し明るすぎる・あごの黒いしみ（元の Basecolor の年齢表現かもしれない）：材質の詰めは顔を作り直してから
6. しわの絵（CM1-3/WM1-3）とマスクは未使用（UE の表情に合わせて混ぜるもの。表情の方法が決まってから）
7. 首の境目（頭と体の継ぎ目）はこの画角ではほぼ見えないが、光によっては色の差が出る
8. Compatibility（今のゲームの描画）は SSS が無い。肌の質は Forward+ のほうがはっきり良い。Web 版は Compatibility のままなので、3D は PC 版だけ Forward+ にするかの判断が要る

## 次にすること（案）
- 表情の作り方を決める（どれか）：
  - (a) **UE 側でテル（smile, stare, sweat …）ごとの表情・動きを骨のアニメとして焼いて FBX で書き出す**（顔の骨 843 本のアニメ。Godot でそのまま再生できる。いちばん確実）
  - (b) UE 側で ARKit 52 形などの「表情そのもの」の形を焼いて書き出す（骨を使わず blend shape だけで動かす。本数を 52 前後にすれば大きさも軽い）
  - (c) RigLogic（DNA の計算）を Godot の GDExtension に移す（自由度は最大だが手間も最大）
- blend shape は使う分だけに絞る（取り込み時の `import_prune.gd` の残す名前を表にする）。LOD は 0〜2 程度と 1 つ遠景
- 座った姿勢（腕を卓の上）を UE で焼いて体ごと書き出す
- 本番の日本人の顔で作り直し、材質（まつげ・目・しわの絵）を詰める
- Character を継承した 3D 版のシーン（SubViewport に 3D）を `chars/<名前>.tscn` で置く形は、上が決まってから
