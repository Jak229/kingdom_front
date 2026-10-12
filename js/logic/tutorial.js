/* First-day tutorial: nine short steps from the first drive to the first dawn; each waits until the player has done it. */
import {GY, dayLen} from '../config.js';
import {SET, saveSettings} from '../settings.js';
import {tr} from '../i18n/index.js';
import {S} from '../state.js';
import {reqFor, toast} from './rules.js';
import {pipY} from '../render/helpers.js';
import {syncToggles} from '../ui/settings.js';

/* first-day tutorial: nine short steps from the first drive to the first dawn; each waits until the player has done it.
   at() is where the arrow points, show() hides a step until its moment, info steps move on by themselves */
function tutShop(k) {
  return S.shops.find(s => s.kind === k);
}
function tutVagrant() {
  let b = null,
    bd = 1e9;
  for (const m of S.people)
    if (m.role === 'vagrant') {
      const d = Math.abs(m.x - S.player.x);
      if (d < bd) {
        bd = d;
        b = m;
      }
    }
  return b && {x: b.x, y: GY - 50};
}
function tutWall() {
  let b = null,
    bd = 1e9;
  for (const sp of S.spots)
    if (sp.type === 'wall' && sp.level === 0 && !sp.paid && S.hq.level >= reqFor(sp, 1)) {
      const d = Math.abs(sp.x - S.player.x);
      if (d < bd) {
        bd = d;
        b = sp;
      }
    }
  return b && {x: b.x, y: pipY(b) - 12};
}
export const TUT = [
  {done: t => Math.abs(S.player.x - t.x0) > 140},
  {at: tutVagrant, done: () => S.people.some(m => m.role !== 'vagrant')},
  {
    at: () => ({x: tutShop('gun').x, y: GY - 88}),
    done: () => tutShop('gun').tools > 0 || S.people.some(m => m.role === 'guard')
  },
  {
    at: () =>
      S.people.filter(m => m.role !== 'vagrant').length < 2
        ? tutVagrant()
        : {x: tutShop('tool').x, y: GY - 88},
    done: () => tutShop('tool').tools > 0 || S.people.some(m => m.role === 'builder')
  },
  {at: tutWall, done: () => S.spots.some(sp => sp.type === 'wall' && (sp.paid || sp.level > 0))},
  {info: true, done: t => t.t > 12},
  {
    at: () => ({x: S.hq.x, y: pipY(S.hq) - 12}),
    show: () => S.night || S.phaseT >= dayLen() - 22,
    done: () => S.night
  },
  {done: () => !S.night && S.day > 1},
  {info: true, last: true, done: t => t.t > 16}
];
// while the first lessons run, the first day goes at half speed so nobody is rushed into the night
export function tutClock() {
  const t = S.tut;
  return t && t.i < 5 && S.day === 1 && !S.night ? 0.5 : 1;
}
export function tutStep(dt) {
  const t = S.tut;
  t.t += dt;
  if (t.i < 6 && (S.night || S.phaseT >= dayLen() - 22)) {
    t.i = 6;
    t.t = 0;
  }
  const st = TUT[t.i];
  if (!st.done(t)) return;
  if (st.last) tutEnd(false);
  else {
    t.i++;
    t.t = 0;
  }
}
export function tutEnd(skipped) {
  S.tut = null;
  SET.tut = false;
  saveSettings();
  syncToggles();
  if (skipped) toast(tr('tut_off'));
}
