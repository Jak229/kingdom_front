/* World size, seasons and the rule tables: buildings (DEFS), shops, vehicles and wild-land objects.
   Names and descriptions are attached by i18n/index.js, so this file holds numbers only. */
import {S} from './state.js';

export const W = 960,
  H = 540,
  GY = 440,
  WORLD = 8000,
  C = 4000,
  PORTAL = 2600;
// K = how many real screen pixels one game unit gets, so the canvas is never upscaled
export const K = Math.max(
  0.5,
  // capped at 3: past that the canvas gets huge on 4K and high-DPI phone screens for no visible gain
  Math.min(3, Math.min(window.innerWidth / W, window.innerHeight / H) * (window.devicePixelRatio || 1))
);
export const PURSE = 40,
  SEASON_DAYS = 3;
// seasons change every three days, like the original: winter has no harvest and long nights
export const SEASONS = [
  {day: 90, night: 55, farm: 1.5, rain: 0.35, recruits: 2, convoy: true},
  {day: 100, night: 50, farm: 1, rain: 0.15, recruits: 1, convoy: true},
  {day: 85, night: 65, farm: 1, rain: 0.45, recruits: 1, convoy: true},
  {day: 70, night: 75, farm: 0, rain: 0, snow: 0.6, recruits: 0, convoy: false}
];
export function seasonIdx(d) {
  return Math.floor(((d || 1) - 1) / SEASON_DAYS) % 4;
}
export function season() {
  return SEASONS[seasonIdx(S ? S.day : 1)];
}
export function dayLen() {
  return season().day;
}
export function nightLen() {
  return season().night;
}
export const VEH = {
  jeep: {speed: 140, fast: 250},
  moto: {speed: 195, fast: 350},
  armored: {speed: 125, fast: 215, armor: true, gun: {range: 250, dmg: 1, rate: 0.8}},
  tank: {speed: 85, fast: 135, armor: true, cannon: {range: 420, dmg: 5, rate: 2.4, blast: 42}}
};
export const WILD = {
  depot: {},
  tower: {cost: 6},
  radar: {cost: 8},
  hermit: {cost: 5},
  dog: {cost: 1},
  cache: {}
};

export const DEFS = {
  hq: {cost: [0, 0, 5, 9, 14], req: [0, 0, 1, 1, 1], time: [0, 0, 10, 14, 18], max: 4},
  wall: {cost: [0, 2, 4, 6], req: [0, 1, 2, 3], hp: [0, 10, 22, 40], time: [0, 5, 7, 9], max: 3},
  turret: {
    cost: [0, 4, 6],
    req: [0, 2, 3],
    time: [0, 7, 9],
    max: 2,
    range: [0, 300, 340],
    dmg: [0, 1, 2],
    rate: [0, 0.9, 0.6]
  },
  mortar: {cost: [0, 6], req: [0, 3], time: [0, 9], max: 1, range: 640, rate: 3.2, dmg: 3, blast: 48},
  atgm: {cost: [0, 6], req: [0, 3], time: [0, 8], max: 1, range: 470, rate: 4, dmg: 6},
  barracks: {cost: [0, 8], req: [0, 3], time: [0, 12], max: 1},
  bank: {cost: [0, 3], req: [0, 2], time: [0, 6], max: 1},
  farm: {cost: [0, 4], req: [0, 2], time: [0, 7], max: 1},
  sniper: {cost: [0, 7], req: [0, 3], time: [0, 10], max: 1, range: 620, rate: 2.6, dmg: 5},
  medic: {cost: [0, 5], req: [0, 2], time: [0, 8], max: 1},
  launch: {cost: [0, 20, 12, 6], req: [0, 4, 4, 4], time: [0, 16, 10, 3], max: 3, hp: 120}
};
export const SHOPS = {
  gun: {role: 'guard', cost: 3, color: 0x4b5a2e},
  tool: {role: 'builder', cost: 2, color: 0x5d5a3a},
  agro: {role: 'farmer', cost: 3, color: 0x6b5a35}
};

export const VERSION = 22;
