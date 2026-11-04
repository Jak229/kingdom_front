/* The game state S (everything that is saved or simulated), the input flags and a fresh state for a new front.
   S is replaced on a new game; other modules read it as a live binding and replace it with setS(). */
import {C, PORTAL} from './config.js';
import {rnd, rng} from './util.js';

export let S = null;
// forest belts (distance from HQ) that hold the second and third rings of defences
export const FOREST = [
  [720, 1070],
  [1250, 1610]
];
export const input = {left: false, right: false, pay: false, fast: false};

export function mkPerson(x, role, campX) {
  return {
    x,
    role,
    campX,
    tx: x,
    side: x < C ? -1 : 1,
    cd: rnd(0, 2),
    work: 0,
    anim: rnd(0, 6),
    dir: 1,
    speed: rnd(40, 50),
    off: rnd(0, 40),
    task: null,
    farm: null,
    working: false
  };
}
// seed: trees of the operation of the day are drawn by the date instead of the front
export function newState(front, seed) {
  front = front || 1;
  const s = {
    front,
    coins: 14,
    day: 1,
    phaseT: 0,
    night: false,
    nightT: 0,
    over: false,
    won: false,
    running: false,
    player: {x: C + 60, dir: 1, hitCd: 0, payCd: 0, anim: 0},
    spots: [],
    shops: [],
    people: [],
    enemies: [],
    rabbits: [],
    ground: [],
    tracers: [],
    puffs: [],
    shells: [],
    booms: [],
    missiles: [],
    queue: [],
    eshells: [],
    emps: [],
    later: [],
    seen: [],
    squad: null,
    convoy: null,
    portalHp: [40, 40],
    portalDead: [false, false],
    toast: null,
    paying: null,
    rabbitCd: 2,
    hires: 0,
    rocketY: 0,
    winT: 0,
    kills: 0
  };
  const add = (type, dx, minHq, level) => {
    const sp = {
      type,
      x: C + dx,
      level: level || 0,
      minHq: minHq || 0,
      paid: false,
      pending: 0,
      progress: 0,
      hp: 0,
      maxHp: 0,
      cd: 0,
      aim: dx < 0 ? -1 : 1
    };
    s.spots.push(sp);
    return sp;
  };
  s.hq = add('hq', 0, 0, 1);
  for (const sd of [-1, 1]) {
    add('wall', sd * 560, 1);
    add('wall', sd * 920, 2);
    add('wall', sd * 1360, 3);
    add('turret', sd * 520, 2);
    add('turret', sd * 880, 3);
    add('mortar', sd * 650, 3);
    add('atgm', sd * 780, 3);
  }
  add('farm', -410, 2);
  add('farm', 360, 2);
  s.bank = add('bank', -295, 2);
  s.barracks = add('barracks', 245, 3);
  s.launch = add('launch', 1530, 4);
  // added later: kept at the end so older saves still line up
  s.medic = add('medic', 455, 2);
  for (const sd of [-1, 1]) add('sniper', sd * 1000, 3);
  s.shops = [
    {kind: 'gun', x: C - 130, tools: 0, minHq: 1, pending: 0},
    {kind: 'tool', x: C + 150, tools: 0, minHq: 1, pending: 0},
    {kind: 'agro', x: C - 215, tools: 0, minHq: 2, pending: 0}
  ];
  s.camps = [C - 1690, C + 1690];
  s.portals = [C - PORTAL, C + PORTAL];
  s.buff = {};
  s.player.veh = 'jeep';
  s.wild = [
    {type: 'tower', x: C - 2050},
    {type: 'depot', x: C - 2330, veh: 'armored', cost: 10},
    {type: 'hermit', x: C - 3200},
    {type: 'cache', x: C - 3650, coins: 12},
    {type: 'depot', x: C + 1950, veh: 'moto', cost: 4},
    {type: 'radar', x: C + 2200},
    {type: 'cache', x: C + 2400, coins: 8},
    {type: 'depot', x: C + 3300, veh: 'tank', cost: 20},
    {type: 'cache', x: C + 3700, coins: 12},
    {type: 'cache', x: C - 1950, coins: 6},
    {type: 'dog', x: C - 1180}
  ];
  for (const w of s.wild) {
    w.pending = 0;
    w.done = false;
    if (front % 2 === 0) w.x = 2 * C - w.x;
  }
  // the forest round the base: outer positions stand among trees that sappers have to clear first
  s.trees = [];
  const rf = rng(seed || front * 131 + 7);
  for (const sd of [-1, 1])
    for (const [a, b] of FOREST)
      for (let d = a + rf() * 20; d < b; d += 30 + rf() * 18)
        s.trees.push({
          x: Math.round(C + sd * d),
          pine: rf() < 0.45,
          f: rf() < 0.8 ? 0 : 1,
          flip: rf() < 0.5,
          st: 0,
          chop: 0,
          pending: 0
        });
  for (const cx of s.camps)
    for (let i = 0; i < 3; i++) s.people.push(mkPerson(cx + rnd(-60, 60), 'vagrant', cx));
  s.people.push(mkPerson(C - 320, 'vagrant', s.camps[0]));
  s.people.push(mkPerson(C + 300, 'vagrant', s.camps[1]));
  return s;
}

// the special rule of today's operation is in force (see logic/daily.js)
export const mod = id => !!(S && S.daily && S.daily.m === id);

export function setS(v) {
  S = v;
}
