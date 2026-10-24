# godot_render（2026-10-23）Windows 版 Forward+・3D の画質・店の光
すべて CPU で描いた絵（Compatibility は llvmpipe の OpenGL、Forward+ は lavapipe の Vulkan）。説明は game/chars/3d/README.md「描き方・3D の画質・店の光」
- 比べ_Compatibility_ForwardPlus_6人.png：顔のアップ 6 人。左から Compatibility 前（影ありランプ）／Compatibility 今（ランプの影なし・光を足す）／Forward+ 画質 低／Forward+ 画質 中（SSS）
- lineup_*.png：その元の 6 人並び（前・今・Forward+ 調整なし・低・中）
- まだらの原因_*.png：ゲン・ミナ・ハヤト（卓の大きさ）。base／影なし／法線 0／法線 0＋影なし／wrap＋影なし、と base／頭の影なし／影なし／頭の影なし＋光足し。影ありランプを切ったときだけまだらが消える
- まだら_compat_前_低_中.png：Compatibility の前と、今（低・中）
- SSS_forwardplus_低と中_切り抜き.png：Forward+ の低（SSS なし）と中（SSS、黒い背景に描いて形の絵で切り抜き）。背景を緑灰にして縁の切り抜きを確かめた
- 店の光_*.png：Stage3D.look(店) を 6 人に渡した絵（1 段 1 店）。photo_env はまだ共有に無いので photo=0。photo_env_仮の空で試し は代わりの空で通り道だけ試した絵（本物の写真ではない）
- 卓_*.png・紹介_*.png：第 4 章の卓（2D・3D）、第 2 章の相手の紹介を両方の描き方で
- 設定_3Dの画質_*.png：設定（くわしい設定）の「3D の画質」の行
