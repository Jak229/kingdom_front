/* GameDistribution HTML5 SDK: preroll on the first Play / Continue, midrolls between operations,
   rewarded ads, pause and mute while an ad runs. Same interface as crazygames.js (see platform.js).
   The SDK is loaded once at startup. The game id comes from the export build (--gd-id=...),
   or from the address GameDistribution serves the game at (html5.gamedistribution.com/<id>/). */

const SDK_URL = 'https://html5.api.gamedistribution.com/main.min.js';
const BUILD_ID = typeof __GD_ID__ === 'string' ? __GD_ID__ : '';

let sdk = null, // window.gdsdk once SDK_READY fired
  adBusy = false,
  rewardReady = false,
  rewardWatched = false,
  prerollDone = false,
  sdkPaused = false,
  onStart = null, // finishes the ad in progress when SDK_GAME_START arrives
  hushFn = () => {};

function gameId() {
  if (BUILD_ID) return BUILD_ID;
  const q = /[?&]gd=([0-9a-f]{32})/i.exec(location.search),
    p = /\/([0-9a-f]{32})(\/|$)/i.exec(location.pathname);
  return (q && q[1]) || (p && p[1]) || '';
}

function preloadReward() {
  if (!sdk || typeof sdk.preloadAd !== 'function') return;
  sdk
    .preloadAd('rewarded')
    .then(() => (rewardReady = true))
    .catch(() => {
      rewardReady = false;
      setTimeout(preloadReward, 60e3);
    });
}

function onEvent(ev) {
  switch (ev && ev.name) {
    case 'SDK_READY':
      sdk = window.gdsdk;
      preloadReward();
      break;
    case 'SDK_GAME_PAUSE':
      // an ad starts: the scene stops stepping the game (PF.adBusy) and the sound goes quiet
      sdkPaused = true;
      hushFn(true);
      break;
    case 'SDK_GAME_START':
      sdkPaused = false;
      hushFn(false);
      if (onStart) onStart();
      break;
    case 'SDK_REWARDED_WATCH_COMPLETE':
      rewardWatched = true;
      break;
  }
}

export const GameDistribution = {
  name: 'gd',
  // GameDistribution wants the preroll on a Play button, so the first visit opens the title menu instead of the tutorial
  titleFirst: true,
  get active() {
    return !!sdk;
  },
  // true while an ad covers the game: the scene does not step the game logic
  get adBusy() {
    return adBusy || sdkPaused;
  },
  get canReward() {
    return !!sdk && rewardReady && !adBusy;
  },
  // loads the SDK and waits for SDK_READY (at most 6 s; ads still work if it comes later)
  init() {
    return new Promise(ok => {
      window.GD_OPTIONS = {
        gameId: gameId(),
        onEvent(ev) {
          onEvent(ev);
          if (ev && (ev.name === 'SDK_READY' || ev.name === 'SDK_ERROR')) ok();
        }
      };
      if (!document.getElementById('gamedistribution-jssdk')) {
        const s = document.createElement('script');
        s.id = 'gamedistribution-jssdk';
        s.src = SDK_URL;
        s.onerror = ok;
        document.head.appendChild(s);
      }
      setTimeout(ok, 6000);
    });
  },
  loaded() {},
  setPlaying() {},
  happytime() {},
  onHush(fn) {
    hushFn = fn;
  },
  lastError: '',
  // shows an ad ('interstitial' or 'rewarded'); resolves true when it played (a rewarded one: watched to the end)
  ad(type) {
    if (!sdk || adBusy || typeof sdk.showAd !== 'function') return Promise.resolve(false);
    const rew = type === 'rewarded';
    if (rew && !rewardReady) {
      this.lastError = 'none';
      return Promise.resolve(false);
    }
    this.lastError = '';
    adBusy = true;
    rewardWatched = false;
    if (rew) rewardReady = false;
    return new Promise(done => {
      let shown = false,
        ended = false;
      const end = ok => {
        if (ended) return;
        ended = true;
        onStart = null;
        adBusy = false;
        sdkPaused = false;
        hushFn(false);
        if (rew) preloadReward();
        done(rew ? rewardWatched : ok);
      };
      // the promise of showAd can settle before the ad closes: wait for SDK_GAME_START when the game was paused
      onStart = () => {
        if (shown) end(true);
      };
      const safety = setTimeout(() => end(shown), 120e3);
      const fin = ok => {
        clearTimeout(safety);
        end(ok);
      };
      let p;
      try {
        p = rew ? sdk.showAd('rewarded') : sdk.showAd();
      } catch (e) {
        p = Promise.reject(e);
      }
      Promise.resolve(p).then(
        () => {
          shown = true;
          if (!sdkPaused) fin(true);
          else
            onStart = () => {
              clearTimeout(safety);
              end(true);
            };
        },
        err => {
          const c = String((err && (err.message || err.code)) || err || '').toLowerCase();
          console.warn('[GameDistribution] ' + type + ' ad error:', err);
          this.lastError = c.includes('block') ? 'adblock' : 'none';
          fin(false);
        }
      );
    });
  },
  // the first Play / Continue of the visit shows the preroll; later starts go on at once
  preroll() {
    if (prerollDone || !sdk) return Promise.resolve(false);
    prerollDone = true;
    return this.ad('interstitial');
  },
  midgame() {
    prerollDone = true;
    return this.ad('interstitial');
  },
  rewarded() {
    return this.ad('rewarded');
  },
  // saves stay in localStorage on GameDistribution
  getItem(k) {
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  },
  setItem(k, v) {
    try {
      localStorage.setItem(k, v);
      return true;
    } catch (e) {
      return false;
    }
  },
  removeItem(k) {
    try {
      localStorage.removeItem(k);
    } catch (e) {}
  }
};
