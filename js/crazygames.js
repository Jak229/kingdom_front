/* CrazyGames HTML5 SDK v3: loading and gameplay signals, midgame and rewarded ads, cloud saves.
   Everything no-ops outside CrazyGames, so GitHub Pages and local play work as before.
   The SDK is only fetched on a crazygames.com page, or with ?cg in the URL for local testing. */

const SDK_URL = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';

let sdk = null, // window.CrazyGames.SDK once init() finished in a real environment
  playing = false,
  adBusy = false,
  hushFn = () => {};

function onCrazyGames() {
  const hosts = [location.hostname, document.referrer];
  try {
    if (location.ancestorOrigins) hosts.push(...location.ancestorOrigins);
  } catch (e) {}
  return /\bcg\b|crazygames/.test(location.search) || hosts.some(h => /crazygames\./i.test(String(h)));
}

function loadScript() {
  return new Promise((ok, fail) => {
    const s = document.createElement('script');
    s.src = SDK_URL;
    s.onload = ok;
    s.onerror = fail;
    document.head.appendChild(s);
    setTimeout(fail, 8000);
  });
}

export const CG = {
  get active() {
    return !!sdk;
  },
  // resolves once the SDK is ready (or straight away when we are not on CrazyGames)
  async init() {
    if (!onCrazyGames()) return;
    try {
      await loadScript();
      const s = window.CrazyGames && window.CrazyGames.SDK;
      if (!s) return;
      await s.init();
      if (s.environment === 'disabled') return;
      sdk = s;
      sdk.game.loadingStart();
    } catch (e) {
      sdk = null;
    }
  },
  loaded() {
    if (sdk) sdk.game.loadingStop();
  },
  // called every frame; only sends a signal when the state flips
  setPlaying(on) {
    on = !!on && !adBusy;
    if (!sdk || on === playing) return;
    playing = on;
    if (on) sdk.game.gameplayStart();
    else sdk.game.gameplayStop();
  },
  happytime() {
    if (sdk) sdk.game.happytime();
  },
  // the audio module registers how to silence the game for an ad
  onHush(fn) {
    hushFn = fn;
    if (sdk && sdk.game.settings) {
      hushFn(!!sdk.game.settings.muteAudio);
      sdk.game.addSettingsChangeListener(st => hushFn(!!st.muteAudio || adBusy));
    }
  },
  // shows an ad; resolves true when it played to the end
  ad(type) {
    if (!sdk || adBusy) return Promise.resolve(false);
    return new Promise(done => {
      const muted = () => !!(sdk.game.settings && sdk.game.settings.muteAudio);
      const end = ok => {
        adBusy = false;
        hushFn(muted());
        done(ok);
      };
      try {
        sdk.ad.requestAd(type, {
          adStarted: () => {
            adBusy = true;
            if (playing) {
              playing = false;
              sdk.game.gameplayStop();
            }
            hushFn(true);
          },
          adFinished: () => end(true),
          adError: () => end(false)
        });
      } catch (e) {
        end(false);
      }
    });
  },
  midgame() {
    return this.ad('midgame');
  },
  rewarded() {
    return this.ad('rewarded');
  },
  // key/value store: CrazyGames cloud data when available, localStorage otherwise
  getItem(k) {
    try {
      return sdk ? sdk.data.getItem(k) : localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  },
  setItem(k, v) {
    try {
      if (sdk) sdk.data.setItem(k, v);
      else localStorage.setItem(k, v);
      return true;
    } catch (e) {
      return false;
    }
  },
  removeItem(k) {
    try {
      if (sdk) sdk.data.removeItem(k);
      else localStorage.removeItem(k);
    } catch (e) {}
  }
};
