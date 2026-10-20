// カードのマーク 案C（2026-10-19 satou が A+B+C+D を選択）：4色のトランプを最初からオンにする。
// 設定で自分で切り替えた人（保存に c4 がある人）はそのまま
if(SETTINGS.c4===undefined){SETTINGS.c4=true;try{b4Apply()}catch(e){}}
