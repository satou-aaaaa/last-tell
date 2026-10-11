// LAST TELL アプリ版の「薄い部分」。
// ゲーム本体（shisho.html）は window.LT_PLATFORM の関数を呼ぶだけで、広告・同意・計測・保存はここで扱う。
// ブラウザで開いたとき（ネイティブでないとき）は何もせず、ゲーム本体の Web 版の既定がそのまま使われる。
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { AdMob, AdmobConsentStatus, InterstitialAdPluginEvents, RewardAdPluginEvents } from '@capacitor-community/admob';
import { FirebaseAnalytics, ConsentType, ConsentStatus } from '@capacitor-firebase/analytics';
import { FirebaseCrashlytics } from '@capacitor-firebase/crashlytics';
import { FirebaseRemoteConfig } from '@capacitor-firebase/remote-config';
import { CONFIG } from './config.js';

const SAVE_PREFIX = 'shisho-';
const isNative = Capacitor.isNativePlatform();
const os = Capacitor.getPlatform(); // 'android' | 'ios' | 'web'

if (isNative) setup();

function setup() {
  const state = { consentReady: false, canRequestAds: false, privacyRequired: false, adsReady: false, handCount: 0 };

  // ---------- 1. セーブ：localStorage と Preferences を二重に持つ ----------
  // iOS は容量が足りないと WebView の localStorage を消すことがあるため、Preferences（端末の設定領域）にも写す。
  const rawSet = Storage.prototype.setItem, rawRemove = Storage.prototype.removeItem;
  Storage.prototype.setItem = function (k, v) {
    rawSet.call(this, k, v);
    if (this === localStorage && String(k).startsWith(SAVE_PREFIX)) Preferences.set({ key: k, value: String(v) }).catch(() => {});
  };
  Storage.prototype.removeItem = function (k) {
    rawRemove.call(this, k);
    if (this === localStorage && String(k).startsWith(SAVE_PREFIX)) Preferences.remove({ key: k }).catch(() => {});
  };
  restoreFromPreferences();

  // ---------- 2. 呼び口 ----------
  window.LT_PLATFORM = {
    name: os,
    openUrl: url => Browser.open({ url: absUrl(url) }),
    track: (event, params) => {
      FirebaseAnalytics.logEvent({ name: event, params: params || {} }).catch(() => {});
    },
    reportError: err => {
      const message = String(err && (err.stack || err.message) || err).slice(0, 2000);
      FirebaseCrashlytics.recordException({ message }).catch(() => {});
    },
    privacyOptionsRequired: () => state.privacyRequired,
    showPrivacyOptions: async () => {
      await AdMob.showPrivacyOptionsForm().catch(() => {});
      await refreshConsent(state);
    },
    saveFile: async (name, text) => {
      const r = await Filesystem.writeFile({ path: name, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 });
      await Share.share({ title: name, url: r.uri });
    },
    // 広告。ゲーム本体は区切りのよい所で呼ぶ。出すかどうか（頻度）はここで決める。
    adBreak: place => showInterstitial(state, place),
    showRewarded: place => showRewarded(state, place),
    canShowRewarded: () => state.adsReady,
  };

  // ---------- 3. エラー・音・戻るボタン ----------
  addEventListener('error', e => window.LT_PLATFORM.reportError(e.error || e.message));
  addEventListener('unhandledrejection', e => window.LT_PLATFORM.reportError(e.reason));
  App.addListener('pause', () => window.Sound?.pause?.());
  App.addListener('resume', () => window.Sound?.resume?.());
  App.addListener('backButton', () => {
    if (window.LT_back && window.LT_back()) return;
    if (confirm(isEn() ? 'Quit LAST TELL?' : 'LAST TELL を終了しますか？')) App.exitApp();
  });

  // ---------- 4. 起動時の同意 → 広告 → 遠隔設定 ----------
  startServices(state);
}

function isEn() { try { return document.documentElement.lang === 'en' || JSON.parse(localStorage.getItem('shisho-settings') || '{}').lang === 'en'; } catch { return false; } }
function absUrl(u) { return /^https?:/.test(u) ? u : CONFIG.siteBase + u.replace(/^\.?\//, ''); }

// localStorage が空なのに Preferences に残っていれば戻して、読み直す
async function restoreFromPreferences() {
  const hasLocal = Object.keys(localStorage).some(k => k.startsWith(SAVE_PREFIX));
  const { keys } = await Preferences.keys();
  const saved = keys.filter(k => k.startsWith(SAVE_PREFIX));
  if (hasLocal) {
    // 初回：今の localStorage を Preferences に写す
    if (!saved.length) for (const k of Object.keys(localStorage)) if (k.startsWith(SAVE_PREFIX)) await Preferences.set({ key: k, value: localStorage.getItem(k) });
    return;
  }
  if (!saved.length) return;
  for (const k of saved) { const { value } = await Preferences.get({ key: k }); if (value != null) Storage.prototype.setItem.call(localStorage, k, value); }
  location.reload();
}

async function startServices(state) {
  // EU などでは同意を取るまで計測を止めておく
  await setAnalyticsConsent(false);
  await refreshConsent(state, true);
  if (os === 'ios') {
    const { status } = await AdMob.trackingAuthorizationStatus().catch(() => ({ status: 'denied' }));
    if (status === 'notDetermined') await AdMob.requestTrackingAuthorization().catch(() => {});
  }
  if (state.canRequestAds) {
    await AdMob.initialize({
      initializeForTesting: CONFIG.adsTesting,
      tagForChildDirectedTreatment: false,
      maxAdContentRating: 'MatureAudience',
    }).catch(() => {});
    state.adsReady = true;
    listenAds();
    prepareAds();
  }
  await remoteConfig();
}

async function refreshConsent(state, showFormIfNeeded = false) {
  try {
    let info = await AdMob.requestConsentInfo();
    if (showFormIfNeeded && info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) info = await AdMob.showConsentForm();
    state.canRequestAds = info.canRequestAds;
    state.privacyRequired = info.privacyOptionsRequirementStatus === 'REQUIRED';
    const ok = info.status === AdmobConsentStatus.OBTAINED || info.status === AdmobConsentStatus.NOT_REQUIRED;
    await setAnalyticsConsent(ok && info.canRequestAds);
  } catch (e) {
    state.canRequestAds = false;
  }
}

// 同意の結果を Firebase の同意モード v2 に渡す（簡易版：同意画面で「同意」なら4つとも許可）
async function setAnalyticsConsent(granted) {
  const status = granted ? ConsentStatus.Granted : ConsentStatus.Denied;
  for (const type of [ConsentType.AnalyticsStorage, ConsentType.AdStorage, ConsentType.AdUserData, ConsentType.AdPersonalization]) {
    await FirebaseAnalytics.setConsent({ type, status }).catch(() => {});
  }
}

// ---------- 広告 ----------
function adId(kind) { return CONFIG.adUnits[os][kind]; }
let interstitialLoaded = false, rewardLoaded = false;
function prepareAds() {
  AdMob.prepareInterstitial({ adId: adId('interstitial'), isTesting: CONFIG.adsTesting }).then(() => interstitialLoaded = true).catch(() => {});
  AdMob.prepareRewardVideoAd({ adId: adId('rewarded'), isTesting: CONFIG.adsTesting }).then(() => rewardLoaded = true).catch(() => {});
}
function listenAds() {
  // 広告の表示中はゲームの音を止める（ゲーム本体が window.Sound を出しておく）
  AdMob.addListener(InterstitialAdPluginEvents.Showed, () => window.Sound?.pause?.());
  AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => { window.Sound?.resume?.(); interstitialLoaded = false; prepareAds(); });
  AdMob.addListener(RewardAdPluginEvents.Showed, () => window.Sound?.pause?.());
  AdMob.addListener(RewardAdPluginEvents.Dismissed, () => { window.Sound?.resume?.(); rewardLoaded = false; prepareAds(); });
}

async function showInterstitial(state, place) {
  if (!state.adsReady || !interstitialLoaded) return false;
  state.handCount++;
  if (state.handCount % CONFIG.interstitialEvery !== 0) return false;
  try { await AdMob.showInterstitial(); window.LT_PLATFORM.track('ad_interstitial', { place }); return true; } catch { return false; }
}
async function showRewarded(state, place) {
  if (!state.adsReady || !rewardLoaded) return false;
  try { const r = await AdMob.showRewardVideoAd(); window.LT_PLATFORM.track('ad_reward_watched', { place }); return !!r; } catch { return false; }
}

// ---------- 遠隔設定（強制アップデート・広告の頻度） ----------
async function remoteConfig() {
  try {
    await FirebaseRemoteConfig.fetchAndActivate();
    const every = (await FirebaseRemoteConfig.getNumber({ key: 'interstitial_every' })).value;
    if (every > 0) CONFIG.interstitialEvery = every;
    const min = (await FirebaseRemoteConfig.getString({ key: 'min_version' })).value;
    const { version } = await App.getInfo();
    if (min && newer(min, version)) {
      const msg = isEn() ? 'A new version is available. Please update to keep playing.' : '新しい版があります。更新してから遊んでください。';
      if (confirm(msg)) Browser.open({ url: CONFIG.storeUrl[os] });
    }
  } catch { /* オフラインなどでは既定値のまま */ }
}
function newer(a, b) {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) { if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0); }
  return false;
}
