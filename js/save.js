/* Save at dawn, like the original, and load it back (CrazyGames cloud data or localStorage). */
import {mkPerson, newState} from './state.js';
import {CG} from './crazygames.js';

/* ---------- save at dawn, like the original ---------- */
const SAVE_KEY = 'kg-front-save-v1';
export function saveGame(st) {
  const S = st || window.__kg.S;
  return CG.setItem(
    SAVE_KEY,
    JSON.stringify({
      v: 1,
      front: S.front,
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
      people: S.people.map(m => [Math.round(m.x), m.role, m.campX, m.side, Math.round(m.off)]),
      squad: S.squad ? {x: Math.round(S.squad.x), hp: S.squad.hp, maxHp: S.squad.maxHp} : null
    })
  );
}
export function readSave() {
  try {
    const s = JSON.parse(CG.getItem(SAVE_KEY) || 'null');
    return s && s.v === 1 ? s : null;
  } catch (e) {
    return null;
  }
}
export function clearSave() {
  CG.removeItem(SAVE_KEY);
}
export function loadGame(sv) {
  const n = newState(sv.front || 1);
  for (const k of ['coins', 'day', 'hires', 'kills', 'buff', 'portalHp', 'portalDead'])
    if (sv[k] != null) n[k] = sv[k];
  Object.assign(n.player, sv.player);
  n.spots.forEach((sp, i) => Object.assign(sp, sv.spots[i] || {}));
  n.shops.forEach((sh, i) => (sh.tools = sv.shops[i] || 0));
  n.wild.forEach((w, i) => (w.done = !!sv.wild[i]));
  n.people = sv.people.map(([x, role, campX, side, off]) => {
    const m = mkPerson(x, role, campX);
    m.side = side;
    m.off = off;
    return m;
  });
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
