/* Save at dawn, like the original, and load it back (CrazyGames cloud data or localStorage). */
import {mkPerson, newState} from './state.js';
import {newDaily} from './logic/daily.js';
import {CG} from './crazygames.js';

/* ---------- save at dawn, like the original ---------- */
const SAVE_KEY = 'kg-front-save-v1',
  // the operation of the day has its own slot, so it never overwrites the campaign
  DAILY_KEY = 'kg-daily-save-v1';
export function saveGame(st) {
  const S = st || window.__kg.S;
  return CG.setItem(
    S.daily ? DAILY_KEY : SAVE_KEY,
    JSON.stringify({
      v: 1,
      front: S.front,
      foe: S.foe,
      daily: S.daily,
      coins: S.coins,
      day: S.day,
      hires: S.hires,
      kills: S.kills,
      buff: S.buff,
      portalHp: S.portalHp,
      portalDead: S.portalDead,
      player: {x: Math.round(S.player.x), veh: S.player.veh, dir: S.player.dir},
      spots: S.spots.map(sp => ({
        level: sp.level,
        hp: sp.hp,
        maxHp: sp.maxHp,
        saved: sp.saved || 0,
        paid: sp.paid,
        progress: sp.progress,
        fuel: sp.fuel || 0
      })),
      shops: S.shops.map(sh => sh.tools),
      wild: S.wild.map(w => w.done),
      trees: S.trees.map(t => (t.st === 2 ? 2 : t.st === 1 ? 1 : 0)),
      people: S.people.map(m => [Math.round(m.x), m.role, m.campX, m.side, Math.round(m.off), m.vet ? 1 : 0]),
      squad: S.squad ? {x: Math.round(S.squad.x), hp: S.squad.hp, maxHp: S.squad.maxHp} : null
    })
  );
}
// daily: the saved operation of the day d (one from another day is of no use)
export function readSave(daily, d) {
  try {
    const s = JSON.parse(CG.getItem(daily ? DAILY_KEY : SAVE_KEY) || 'null');
    if (!s || s.v !== 1) return null;
    return !daily || (s.daily && s.daily.d === d) ? s : null;
  } catch (e) {
    return null;
  }
}
export function clearSave(daily) {
  CG.removeItem(daily ? DAILY_KEY : SAVE_KEY);
}
export function loadGame(sv) {
  const n = sv.daily ? newDaily(sv.daily.d) : newState(sv.front || 1);
  n.front = sv.front || 1;
  if (sv.daily) n.daily = {...sv.daily};
  for (const k of ['coins', 'day', 'hires', 'kills', 'buff', 'portalHp', 'portalDead'])
    if (sv[k] != null) n[k] = sv[k];
  Object.assign(n.player, sv.player);
  n.spots.forEach((sp, i) => Object.assign(sp, sv.spots[i] || {}));
  n.shops.forEach((sh, i) => (sh.tools = sv.shops[i] || 0));
  n.wild.forEach((w, i) => (w.done = !!sv.wild[i]));
  n.people = sv.people.map(([x, role, campX, side, off, vet]) => {
    const m = mkPerson(x, role, campX);
    m.side = side;
    m.off = off;
    if (vet) m.vet = true;
    return m;
  });
  // saves from before the forest: trees standing on anything already built or ordered are gone
  if (sv.trees) n.trees.forEach((t, i) => (t.st = sv.trees[i] || 0));
  else
    for (const t of n.trees)
      if (n.spots.some(sp => (sp.level > 0 || sp.paid) && Math.abs(sp.x - t.x) < 60)) t.st = 2;
  for (const t of n.trees) if (t.st === 2) t.chop = 1;
  if (n.wild.some(w => w.type === 'dog' && w.done))
    n.dog = {x: n.player.x - 40, dir: 1, anim: 0, mode: 'follow', digCd: 30, barkCd: 0, t: 0, moving: false};
  if (sv.squad)
    n.squad = {
      x: sv.squad.x,
      hp: sv.squad.hp,
      maxHp: sv.squad.maxHp,
      mode: 'home',
      cd: 0,
      anim: 0,
      dir: 1,
      side: 1,
      pick: 0
    };
  return n;
}
