/* Progress that outlives an operation: crystals, achievements, daily special tasks, skins and specialists bought in the shop.
   Kept in CrazyGames data or localStorage like the settings; the game reports what happened through ev() and achieve(). */
import {CG} from './crazygames.js';

const KEY = 'kg-profile-v1';

// achievements: [id, crystals, lifetime counter and target] — ones without a counter are unlocked by achieve(id)
export const ACH = [
  ['night1', 5, 'night', 1],
  ['lumber10', 10, 'tree', 10],
  ['recruit25', 10, 'recruit', 25],
  ['kill100', 10, 'kill', 100],
  ['dog', 5],
  ['clean', 10],
  ['army8', 15],
  ['pillbox', 15],
  ['night10', 15, 'night', 10],
  ['day7', 20],
  ['tank', 15],
  ['boss', 20, 'boss', 1],
  ['lumber50', 25, 'tree', 50],
  ['base', 25],
  ['portal', 20, 'portal', 1],
  ['victory', 50, 'victory', 1],
  ['front3', 40],
  ['kill1000', 40, 'kill', 1000]
].map(([id, cr, stat, need]) => ({id, cr, stat, need}));

// daily special tasks: three a day are drawn from this list, progress counts across operations that day
export const TASKS = [
  {k: 'tree', n: 6, cr: 8},
  {k: 'kill', n: 40, cr: 8},
  {k: 'night', n: 3, cr: 10},
  {k: 'recruit', n: 8, cr: 6},
  {k: 'build', n: 5, cr: 8},
  {k: 'drone', n: 8, cr: 6},
  {k: 'coin', n: 60, cr: 6},
  {k: 'hq', n: 1, cr: 8},
  {k: 'clean', n: 1, cr: 12}
];

// commander vehicle paint: main colour (hue, saturation, lightness) and camouflage patches
export const SKINS = [
  {id: 'base', cost: 0},
  {id: 'desert', cost: 30, c: [38, 0.36, 0.6], camo: [[26, 0.32, 0.4]]},
  {
    id: 'forest',
    cost: 40,
    c: [92, 0.34, 0.38],
    camo: [
      [100, 0.36, 0.22],
      [30, 0.3, 0.3]
    ]
  },
  {id: 'winter', cost: 50, c: [205, 0.1, 0.84], camo: [[210, 0.06, 0.56]]},
  {
    id: 'urban',
    cost: 60,
    c: [215, 0.08, 0.5],
    camo: [
      [215, 0.08, 0.3],
      [210, 0.06, 0.68]
    ]
  },
  {id: 'night', cost: 80, c: [228, 0.2, 0.22], camo: [[228, 0.18, 0.14]]},
  {id: 'gold', cost: 150, c: [45, 0.75, 0.55], shine: true}
];

// specialists: people who arrive with their trade and a veteran's edge; bought one at a time
export const UNITS = [
  {id: 'vet', role: 'guard', cost: 10},
  {id: 'eng', role: 'builder', cost: 8},
  {id: 'qm', role: 'farmer', cost: 6}
];

function today() {
  const d = new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}
function load() {
  let p = null;
  try {
    p = JSON.parse(CG.getItem(KEY) || 'null');
  } catch (e) {}
  if (!p || typeof p !== 'object') p = {};
  p.cr = p.cr | 0;
  p.st = p.st || {};
  p.ach = p.ach || {};
  p.own = p.own || {};
  p.own.base = 1;
  if (!SKINS.some(s => s.id === p.skin)) p.skin = 'base';
  p.reserve = p.reserve || {};
  // for testing outside CrazyGames: ?cr=500 in the address sets the crystal balance
  const t = !CG.active && /[?&]cr=(\d+)/.exec(location.search);
  if (t) {
    p.cr = +t[1];
    CG.setItem(KEY, JSON.stringify(p));
  }
  return p;
}
export const PROF = load();

// what the player should be told about: crystals earned for an achievement or a task
export const AWARDS = [];
const listeners = [];
export function onChange(fn) {
  listeners.push(fn);
}
let saveT = 0;
function changed() {
  for (const fn of listeners) fn();
  if (saveT) return;
  saveT = setTimeout(() => {
    saveT = 0;
    saveProfile();
  }, 800);
}
export function saveProfile() {
  CG.setItem(KEY, JSON.stringify(PROF));
}

// today's three tasks, drawn by the date so everyone gets a fresh set after midnight
export function dailyTasks() {
  const d = today();
  if (!PROF.day || PROF.day.d !== d) {
    let h = 2166136261;
    for (const ch of d) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    const pool = TASKS.map((t, i) => i),
      pick = [];
    while (pick.length < 3) {
      h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
      pick.push(pool.splice(h % pool.length, 1)[0]);
    }
    PROF.day = {d, t: pick.map(i => ({i, p: 0, done: false}))};
    changed();
  }
  return PROF.day.t.map(x => ({...TASKS[x.i], p: x.p, done: x.done}));
}
// milliseconds until the next set of tasks
export function msToNewTasks() {
  const n = new Date(),
    m = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1);
  return m - n;
}

function award(kind, id, cr, n) {
  PROF.cr += cr;
  AWARDS.push({kind, id, cr, n});
}
export function achieve(id) {
  if (PROF.ach[id]) return;
  const a = ACH.find(x => x.id === id);
  if (!a) return;
  PROF.ach[id] = 1;
  award('ach', id, a.cr);
  changed();
}
// something happened n times: lifetime counters, today's tasks, counter achievements
export function ev(k, n) {
  n = n == null ? 1 : n;
  PROF.st[k] = (PROF.st[k] || 0) + n;
  dailyTasks();
  for (const x of PROF.day.t) {
    const t = TASKS[x.i];
    if (t.k !== k || x.done) continue;
    x.p = Math.min(t.n, x.p + n);
    if (x.p >= t.n) {
      x.done = true;
      award('task', t.k, t.cr, t.n);
    }
  }
  for (const a of ACH) if (a.stat === k && !PROF.ach[a.id] && PROF.st[k] >= a.need) achieve(a.id);
  changed();
}
export function achProgress(a) {
  if (PROF.ach[a.id]) return 1;
  return a.stat ? Math.min(1, (PROF.st[a.stat] || 0) / a.need) : 0;
}

export function spend(n) {
  if (PROF.cr < n) return false;
  PROF.cr -= n;
  changed();
  return true;
}
export function buySkin(id) {
  const s = SKINS.find(x => x.id === id);
  if (!s || PROF.own[id] || !spend(s.cost)) return false;
  PROF.own[id] = 1;
  PROF.skin = id;
  changed();
  return true;
}
export function wearSkin(id) {
  if (!PROF.own[id]) return;
  PROF.skin = id;
  changed();
}
export function addReserve(id, n) {
  PROF.reserve[id] = Math.max(0, (PROF.reserve[id] || 0) + n);
  changed();
}
