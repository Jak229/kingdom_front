/* Current language, tr() lookup, and getters that give the rule tables their translated names. */
import {DEFS, SEASONS, SHOPS, VEH, WILD} from '../config.js';
import {STR} from './strings.js';
import {SET} from '../settings.js';

// browser language decides on the first visit (Belarusian and Kazakh readers get Russian), the menu choice is remembered
function detectLang() {
  const list =
    navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
  for (const x of list) {
    const c = String(x).toLowerCase().slice(0, 2);
    if (STR[c]) return c;
    if (c === 'be' || c === 'kk') return 'ru';
  }
  return 'en';
}
export let LANG = STR[SET.lang] ? SET.lang : detectLang();
function L_() {
  return STR[LANG] || STR.en;
}
export function tr(k, ...a) {
  let s = L_()[k];
  if (s == null) s = STR.en[k];
  if (s == null) return k;
  return String(s).replace(/\{(\d)\}/g, (m, i) => a[i]);
}
export function tokN(n) {
  return tr(n === 1 ? 'tok1' : 'tok', n);
}
function tb(sec, k) {
  const o = L_()[sec];
  return o && o[k] != null ? o[k] : STR.en[sec][k];
}
// names on the data tables read the current language, so the rules code keeps using d.name, d.desc, VEH[k].name…
for (const k in DEFS) Object.defineProperty(DEFS[k], 'name', {get: () => tb('b', k)});
for (const k in SHOPS)
  ['name', 'tool', 'sign'].forEach((f, i) =>
    Object.defineProperty(SHOPS[k], f, {get: () => tb('shop', k)[i]})
  );
for (const k in WILD)
  ['name', 'sign', 'desc'].forEach((f, i) =>
    Object.defineProperty(WILD[k], f, {get: () => tb('wild', k)[i]})
  );
for (const k in VEH) Object.defineProperty(VEH[k], 'name', {get: () => tb('veh', k)});
SEASONS.forEach((s, i) =>
  ['name', 'note'].forEach((f, j) => Object.defineProperty(s, f, {get: () => tb('season', i)[j]}))
);
export const TOOL_OF = {};
for (const k of ['guard', 'builder', 'farmer'])
  Object.defineProperty(TOOL_OF, k, {get: () => tb('toolOf', k)});
export function setLang(code) {
  LANG = code;
}
