// 本番に出す前に差し替えるところ。いまの広告IDは Google のテスト用（本物の広告は出ない）。
export const CONFIG = {
  adsTesting: true,
  adUnits: {
    android: { interstitial: 'ca-app-pub-3940256099942544/1033173712', rewarded: 'ca-app-pub-3940256099942544/5224354917' },
    ios: { interstitial: 'ca-app-pub-3940256099942544/4411468910', rewarded: 'ca-app-pub-3940256099942544/1712485313' },
  },
  interstitialEvery: 3,            // adBreak を3回呼ぶごとに1回出す。Remote Config の interstitial_every で上書き
  siteBase: 'https://satou-aaaaa.github.io/last-tell/', // ポリシー等の置き場所。ドメインが決まったら差し替え
  storeUrl: {
    android: 'https://play.google.com/store/apps/details?id=com.satou.lasttell',
    ios: 'https://apps.apple.com/app/idXXXXXXXXXX',
  },
};
