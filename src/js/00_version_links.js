// ===== 版とリンク（ドメインが決まったら LINKS を差し替え）=====
const APP_VERSION='0.98.12';
const LINKS={privacy:'privacy.html',terms:'terms.html',support:'support.html',survey:'https://docs.google.com/forms/d/e/1FAIpQLSepuCk6Ob2-hwcnmLYWZLmOt-EFouCh_sYLLpP9qXJHjfCiog/viewform'};   // survey：テスト版の感想アンケート（2026-10-14 satou さんのフォーム。空にすると押せなくなる）
// Web版の既定。アプリ版（Capacitor）はこれを上書きする
window.LT_PLATFORM=window.LT_PLATFORM||{
  name:'web',
  openUrl:u=>window.open(u,'_blank','noopener'),
  track:(event,params)=>{},          // 計測（C-3）
  reportError:(err)=>{},             // クラッシュ検知（C-4）
  privacyOptionsRequired:()=>false,  // 「プライバシー設定」の行を出すか（C-2）
  showPrivacyOptions:()=>{},
  saveFile:null,                     // アプリ版はファイル保存を差し替える（B-2b）
  adBreak:async()=>false,            // 広告（C-7）。Web版は何もしない
  showRewarded:async()=>false,
  canShowRewarded:()=>false,
};
function ltTrack(ev,p){try{window.LT_PLATFORM.track&&window.LT_PLATFORM.track(ev,p||{})}catch(e){}}
function ltAd(kind){try{Promise.resolve(window.LT_PLATFORM.adBreak&&window.LT_PLATFORM.adBreak(kind)).catch(()=>{})}catch(e){}}
// C-4：エラーの報告
addEventListener('error',e=>{try{window.LT_PLATFORM.reportError(e.error||e.message)}catch(x){}});
addEventListener('unhandledrejection',e=>{try{window.LT_PLATFORM.reportError(e.reason)}catch(x){}});