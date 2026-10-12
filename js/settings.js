/* Player settings (language, sound, music, vibration, tutorial) remembered in CrazyGames data or localStorage. */
import {CG} from './crazygames.js';

const SET_KEY = 'kg-settings-v1';
export const SET = (() => {
  try {
    const s = JSON.parse(CG.getItem(SET_KEY) || 'null');
    return s && typeof s === 'object' ? s : {};
  } catch (e) {
    return {};
  }
})();
export function saveSettings() {
  CG.setItem(SET_KEY, JSON.stringify(SET));
}
