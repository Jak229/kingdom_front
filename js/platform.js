/* The portal SDK the game talks to: CrazyGames or GameDistribution, both with the same interface
   (init, ads, pause and mute, saves), and both silently doing nothing outside their portal.
   The export build fixes the choice with __PLATFORM__ ('cg', 'gd' or 'none' for itch.io and other sites);
   the source version picks GameDistribution on its hosts or with ?gd in the address, CrazyGames otherwise. */
import {CG} from './crazygames.js';
import {GameDistribution} from './gamedist.js';

// no portal (itch.io and other sites): no ads, saves in localStorage
const NONE = {
  name: 'none',
  titleFirst: false,
  active: false,
  adBusy: false,
  canReward: false,
  lastError: 'none',
  init: () => Promise.resolve(),
  loaded() {},
  setPlaying() {},
  happytime() {},
  onHush() {},
  preroll: () => Promise.resolve(false),
  midgame: () => Promise.resolve(false),
  rewarded: () => Promise.resolve(false),
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

function onGD() {
  const hosts = [location.hostname, document.referrer];
  try {
    if (location.ancestorOrigins) hosts.push(...location.ancestorOrigins);
  } catch (e) {}
  return /[?&]gd\b/.test(location.search) || hosts.some(h => /gamedistribution\./i.test(String(h)));
}

// written out in full so the bundler can fold the build constant and leave the other SDKs out
export const PF =
  typeof __PLATFORM__ !== 'string'
    ? onGD()
      ? GameDistribution
      : CG
    : __PLATFORM__ === 'gd'
      ? GameDistribution
      : __PLATFORM__ === 'cg'
        ? CG
        : NONE;
