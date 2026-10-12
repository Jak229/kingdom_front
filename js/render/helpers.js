/* Drawing helpers for the scene: sprite-pixel coordinates, window lights, portals, scaffolds, robot frames, glow. */
import {DEFS, GY} from '../config.js';
import {rnd} from '../util.js';
import {S} from '../state.js';
import {SP, SPR} from '../sprites/core.js';

/* ---------- rendering ---------- */
/* sprite-pixel helpers: column/row of a sprite to world coordinates */
export function spx(key, x, c, flip) {
  const s = SPR[key],
    fw = s.w + 2,
    t = flip ? fw - 2 - c : c + 1;
  return x + (t - Math.floor(fw / 2)) * SP;
}
export function spy(key, y, r) {
  return y - (SPR[key].h - r) * SP;
}
export function spc(key, x, c, flip) {
  return spx(key, x, c, flip) + SP / 2;
}
export function lit(fx, key, x, y, rects, col, a, flip) {
  if (a <= 0.01) return;
  fx.fillStyle(col, a);
  for (const [c, r, w, h] of rects)
    fx.fillRect(flip ? spx(key, x, c + w - 1, true) : spx(key, x, c), spy(key, y, r), w * SP, h * SP);
}
export const LIT = {
  hq1: [[25, 18, 2, 12]],
  hq2: [[29, 21, 10, 9]],
  hq3: [
    [10, 20, 8, 2],
    [24, 20, 8, 2],
    [40, 20, 8, 2],
    [54, 20, 8, 2],
    [30, 28, 10, 12]
  ],
  hq4: [
    [34, 12, 26, 4],
    ...[0, 1, 2, 3, 4, 5].map(i => [10 + i * 13, 32, 8, 4]),
    ...[0, 1, 4, 5].map(i => [10 + i * 13, 44, 8, 4])
  ],
  wall3: [[4, 15, 16, 2]],
  hermit: [[9, 16, 6, 5]]
};
export const SPOT_KEY = {
  sniper: () => 'sniper',
  medic: () => 'medic',
  wall: l => 'wall' + l,
  turret: l => 'turret' + l,
  mortar: () => 'mortar',
  atgm: () => 'atgm',
  bank: () => 'bank',
  barracks: () => 'barracks',
  farm: () => 'supply',
  launch: () => 'launch',
  hq: l => 'hq' + l
};
export function flame(fx, x, y, t, seed) {
  const h = 6 + Math.sin(t * 14 + seed) * 2 + Math.random() * 3;
  fx.fillStyle(0xff7a22, 0.95);
  fx.fillRect(x - 4, y - h, 8, h);
  fx.fillStyle(0xffc84a, 1);
  fx.fillRect(x - 2, y - h * 0.7, 4, h * 0.7);
  fx.fillStyle(0xfff0b0, 1);
  fx.fillRect(x - 1, y - h * 0.35, 2, h * 0.35);
}
export function drawPortal(fx, x, dark, i) {
  if (S.portalDead[i]) {
    fx.fillStyle(0x3a3a34, 0.9);
    fx.fillTriangle(x - 26, GY, x + 26, GY, x, GY - 18);
    if (Math.random() < 0.2)
      S.puffs.push({x: x + rnd(-10, 10), y: GY - 16, vx: rnd(-6, 6), vy: -30, life: 1.2, color: 0x6a6a62});
    return;
  }
  const t = performance.now() / 400,
    a = 0.35 + 0.55 * dark;
  if (S.portalHp[i] < 40) {
    fx.fillStyle(0x000000, 0.6);
    fx.fillRect(x - 24, GY - 100, 48, 4);
    fx.fillStyle(0xc77dff, 1);
    fx.fillRect(x - 24, GY - 100, (48 * S.portalHp[i]) / 40, 4);
  }
  fx.fillStyle(0x5b1e8a, a * 0.6);
  fx.fillEllipse(x, GY - 42, 44, 84);
  fx.lineStyle(2, 0xc77dff, a);
  fx.strokeEllipse(x, GY - 42, 44 + Math.sin(t) * 4, 84 + Math.cos(t) * 4);
  fx.lineStyle(1, 0xe0b0ff, a * 0.7);
  fx.strokeEllipse(x, GY - 42, 26 + Math.cos(t * 1.3) * 4, 58 + Math.sin(t * 1.3) * 6);
}
export function drawScaffold(g, sp) {
  const key = SPOT_KEY[sp.type](Math.max(1, sp.level + 1)),
    hh = SPR[key].h * SP,
    ww = Math.min(140, SPR[key].w * SP);
  g.lineStyle(2, 0xc9a441, 0.9);
  g.strokeRect(sp.x - ww / 2, GY - hh, ww, hh);
  for (let y = GY - hh; y < GY; y += 16) g.lineBetween(sp.x - ww / 2, y, sp.x + ww / 2, y);
  g.lineBetween(sp.x - ww / 2, GY, sp.x + ww / 2, GY - hh);
  g.fillStyle(0x000000, 0.6);
  g.fillRect(sp.x - 20, GY - hh - 12, 40, 5);
  g.fillStyle(0xd9b44a, 1);
  g.fillRect(sp.x - 20, GY - hh - 12, 40 * sp.progress, 5);
}
export function pipY(o) {
  const k = SPOT_KEY[o.type];
  if (!k) return GY - 74;
  const h =
    o.type === 'launch'
      ? 78
      : Math.max(SPR[k(Math.max(1, o.level))].h, SPR[k(Math.min(DEFS[o.type].max, o.level + 1))].h);
  return GY - h * SP - 14;
}

const EKEY = {
  shield: 'shieldbot',
  jumper: 'jumper',
  bomber: 'bomber',
  jammer: 'jammer',
  ram: 'ram',
  hive: 'hive',
  howitzer: 'howitzer',
  colossus: 'colossus'
};
export const EYE = {
  robot: [8, 5, 12],
  brute: [14, 8, 18],
  walker: [37, 6, 26],
  shieldbot: [8, 5, 12],
  jumper: [7.5, 1, 10],
  bomber: [5.5, 0, 9],
  jammer: [9.5, 12, 12],
  ram: [24, 5, 18],
  howitzer: [26.5, 9, 14],
  colossus: [21.5, 4.5, 24]
};
export function ekey(e) {
  return EKEY[e.kind] || (e.boss ? 'walker' : e.brute ? 'brute' : 'robot');
}
export function eframe(e) {
  const k = e.kind,
    a = e.anim;
  if (k === 'shield') return (((a * 6) | 0) % 2) + 2 * (e.shield <= 0 ? 2 : e.shield < e.shMax / 2 ? 1 : 0);
  if (k === 'jumper') return e.jt != null ? 3 : e.jcd > 1.15 ? 2 : ((a * 7) | 0) % 2;
  if (k === 'bomber') return ((a * 12) | 0) % 4;
  if (k === 'howitzer') return e.dep ? 2 : ((a * 4) | 0) % 2;
  if (k === 'ram') return ((a * 8) | 0) % 2;
  if (k === 'colossus') return ((a * 2.4) | 0) % 2;
  return ((a * (e.boss ? 3 : 6)) | 0) % 2;
}
export function bossBar(g, e, by, w) {
  g.fillStyle(0x000000, 0.6);
  g.fillRect(e.x - w / 2, by, w, 5);
  g.fillStyle(0xff5a5a, 1);
  g.fillRect(e.x - w / 2, by, (w * Math.max(0, e.hp)) / e.maxHp, 5);
}
export function glow(L, x, y, r, c, a) {
  if (a <= 0.002) return;
  const n = r > 40 ? 12 : 5;
  for (let i = n; i >= 1; i--) {
    L.fillStyle(c, (a * 1.4) / n);
    L.fillCircle(x, y, r * Math.pow(i / n, 1.3));
  }
}
