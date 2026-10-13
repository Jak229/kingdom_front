/* Player settings (language, sound, music, vibration, tutorial) remembered in localStorage. */
const SET_KEY = 'kg-settings-v1';
export const SET = (() => {
  try {
    const s = JSON.parse(localStorage.getItem(SET_KEY) || 'null');
    return s && typeof s === 'object' ? s : {};
  } catch (e) {
    return {};
  }
})();
export function saveSettings() {
  try {
    localStorage.setItem(SET_KEY, JSON.stringify(SET));
  } catch (e) {}
}
