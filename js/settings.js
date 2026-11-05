/* Player settings (language, sound, music, vibration, tutorial) remembered in CrazyGames data or localStorage. */
import {PF} from './platform.js';

const SET_KEY = 'kg-settings-v1';
export const SET = (() => {
  try {
    const s = JSON.parse(PF.getItem(SET_KEY) || 'null');
    return s && typeof s === 'object' ? s : {};
  } catch (e) {
    return {};
  }
})();
export function saveSettings() {
  PF.setItem(SET_KEY, JSON.stringify(SET));
}
