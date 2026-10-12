/* Nights and robots: waves, bosses, every robot kind and how they hit walls, people and the commander. */
import {C, GY, PORTAL, VEH, nightLen, season, seasonIdx} from '../config.js';
import {TOOL_OF, tokN, tr} from '../i18n/index.js';
import {lerp, rnd} from '../util.js';
import {S, mkPerson} from '../state.js';
import {
  dropCoin,
  fuelNeed,
  hasRadar,
  kill,
  nearestCamp,
  outerWall,
  puff,
  rocketLost,
  rocketUp,
  sfx,
  toast
} from './rules.js';
import {hitSquad, startConvoy} from './support.js';
import {saveGame} from '../save.js';
import {gameOver} from '../ui/end.js';
import {SP} from '../sprites/core.js';

/* ---------- enemies ---------- */
export function startNight() {
  S.night = true;
  S.phaseT = 0;
  S.nightT = 0;
  S.queue = [];
  if (S.convoy) {
    for (let i = 0; i < 3; i++) dropCoin(S.convoy.x, GY - 30);
    S.convoy = null;
  }
  const assault = S.day % 5 === 0;
  sfx('radio', null, {v: 'night', d: 2.6});
  if (assault) sfx('siren', C);
  const F = (S.front || 1) - 1;
  let drones = Math.round((2 + S.day * 1.6) * (1 + 0.25 * F)),
    brutes = Math.floor(S.day / 3) + F;
  if (assault) {
    drones *= 2;
    brutes += 2;
  }
  // the front's own robots take some of the small ones' places; the newest kind comes in larger numbers and is introduced once
  const front = S.front || 1,
    top = Math.min(front, 5);
  for (const k in FOE_FRONT) {
    const f0 = FOE_FRONT[k];
    if (f0 > front) continue;
    let n = Math.max(f0 === top ? 1 : 0, Math.round(drones * (f0 === top ? 0.2 : 0.12)));
    if (k === 'jammer') n = Math.min(n, 1 + Math.floor(S.day / 6));
    n = Math.min(n, drones - 1);
    if (n <= 0) continue;
    drones -= n;
    for (let i = 0; i < n; i++) S.queue.push({t: rnd(2, nightLen() * 0.55), side: i % 2 ? -1 : 1, type: k});
    if (f0 === front && !S.seen.includes(k)) {
      S.seen.push(k);
      later(5, tr('foe_' + k), true);
    }
  }
  for (let i = 0; i < drones; i++)
    S.queue.push({t: rnd(0, nightLen() * 0.5), side: i % 2 ? 1 : -1, type: 'drone'});
  for (let i = 0; i < brutes; i++)
    S.queue.push({t: rnd(4, nightLen() * 0.5), side: i % 2 ? -1 : 1, type: 'brute'});
  // from night 3 transport drones carry robots over the walls; assault nights bring the walker
  const carriers = Math.min(
    8,
    (S.day >= Math.max(1, 3 - F) ? Math.floor((S.day - 1) / 2) + 1 : 0) +
      (assault ? 2 : 0) +
      F -
      (S.day >= 3 ? 1 : 0)
  );
  for (let i = 0; i < carriers; i++)
    S.queue.push({t: rnd(3, nightLen() * 0.4), side: i % 2 ? 1 : -1, type: 'carrier'});
  const walkers = assault ? (S.day >= 10 ? 2 : 1) + (F >= 2 ? 1 : 0) : 0;
  for (let i = 0; i < walkers; i++)
    S.queue.push({t: 1 + i * 6, side: Math.random() < 0.5 ? -1 : 1, type: frontBoss(i)});
  for (const r of S.rabbits) r.dead = true;
  if (rocketUp()) {
    const n = Math.round(drones * 0.4);
    for (let i = 0; i < n; i++) S.queue.push({t: rnd(2, nightLen() * 0.6), side: 1, type: 'drone'});
    for (let i = 0; i < 1 + F; i++) S.queue.push({t: rnd(6, nightLen() * 0.5), side: 1, type: 'brute'});
    const last = (S.launch.fuel || 0) >= fuelNeed() - 1;
    if (F > 1 && last) S.queue.push({t: rnd(8, 14), side: 1, type: frontBoss(0)});
    toast(
      (assault ? tr('assaultPrefix') : '') +
        tr(last ? 'fuelNightLast' : 'fuelNight') +
        (F > 1 && last ? tr(frontBoss(0) === 'walker' ? 'fuelWalker' : 'fuelBoss') : '') +
        tr('fuelGuards'),
      true
    );
    return;
  }
  toast(
    assault
      ? frontBoss(0) === 'walker'
        ? tr('nightAssault')
        : tr('assaultPrefix') + tr('nightN', S.day)
      : tr('nightN', S.day) + (carriers ? tr('nightCarriers') : ''),
    assault
  );
}
export function startDay() {
  S.night = false;
  S.phaseT = 0;
  S.day++;
  sfx('radio', null, {v: 'dawn', d: 2.2});
  for (const e of S.enemies)
    if (!e.dead) {
      e.dead = true;
      puff(e.x, GY - 16, 0xffa040, 8);
    }
  for (const m of S.people) m.hurt = 0;
  S.emps = [];
  S.eshells = [];
  for (const cx of S.camps) {
    const n = S.people.filter(m => m.role === 'vagrant' && Math.abs(m.x - cx) < 200).length;
    for (let i = 0; i < season().recruits && n + i < 5; i++)
      S.people.push(mkPerson(cx + rnd(-50, 50), 'vagrant', cx));
  }
  for (let i = 0; i < S.hq.level; i++) dropCoin(C + rnd(-40, 40), GY - 50);
  if (S.bank.level > 0 && S.bank.saved > 0) S.bank.saved += Math.max(1, Math.floor(S.bank.saved * 0.2));
  if (S.hq.level >= 2 && S.day % 2 === 0 && season().convoy) startConvoy();
  const newSeason = seasonIdx(S.day) !== seasonIdx(S.day - 1),
    L = S.launch;
  let fm = '';
  if (rocketUp() && (L.fuel || 0) < fuelNeed()) {
    L.fuel = (L.fuel || 0) + 1;
    fm =
      L.fuel >= fuelNeed()
        ? tr('fuelDone') + tr(hasRadar() ? 'fuelReady' : 'fuelRadar')
        : tr('fuelStep', L.fuel, fuelNeed());
  }
  const saved = saveGame();
  toast(fm + (newSeason ? season().note : tr('dawn', S.day) + (saved ? tr('saved') : '')));
}
/* later fronts: from front II each front brings one new robot and its own boss; from front VI on they all come mixed */
const FOE_FRONT = {shield: 2, jumper: 3, bomber: 4, jammer: 5};
const BOSS_OF = ['walker', 'walker', 'ram', 'hive', 'howitzer', 'colossus'];
function frontBoss(i) {
  const f = S.front || 1;
  if (f < BOSS_OF.length) return i === 0 ? BOSS_OF[f] : 'walker';
  const all = ['ram', 'hive', 'howitzer', 'colossus', 'walker'];
  return all[(f + i * 2) % all.length];
}
function later(t, text, warn) {
  S.later.push({t, text, warn});
}
function bossHp() {
  return 36 + S.day * 3 + 10 * ((S.front || 1) - 1);
}
function spawnBoss(q, x) {
  const k = q.type,
    side = q.side,
    hp = Math.round(bossHp() * {ram: 1, hive: 0.7, howitzer: 0.8, colossus: 1.35}[k]);
  const e = {
    isEnemy: true,
    boss: true,
    kind: k,
    x,
    y: GY - 40,
    side,
    hp,
    maxHp: hp,
    speed: {ram: 38, hive: 52, howitzer: 34, colossus: 30}[k],
    dmg: {ram: 14, hive: 0, howitzer: 6, colossus: 10}[k],
    atk: {ram: 3.2, hive: 9, howitzer: 2, colossus: 2}[k],
    atkCd: 0,
    flee: false,
    loot: 0,
    bounty: k === 'colossus' ? 12 : 9,
    dead: false,
    anim: 0,
    wait: 0,
    back: 0,
    shT: 2,
    empT: 5,
    dropT: 2
  };
  if (k === 'hive') {
    e.fly = true;
    e.alt = e.y = GY - rnd(196, 206);
    e.dir = -side;
    e.bob = 0;
    e.hover = rnd(60, 80);
  }
  S.enemies.push(e);
  for (let i = 0; i < 3; i++) puff(x, GY - 40 - i * 20, 0xb06cff, 8);
  sfx('walkerSpawn', x);
  sfx('radio', null, {v: 'alert', d: 1.2});
  toast(tr('out_' + k, tr(side < 0 ? 'sideL' : 'sideR')), true);
}
function spawnFoe(q, x) {
  const k = q.type,
    F = (S.front || 1) - 1,
    base = 2 + Math.floor(S.day / 6) + F;
  const e = {
    isEnemy: true,
    kind: k,
    x,
    y: GY - 16,
    side: q.side,
    hp: k === 'bomber' ? 2 : k === 'jammer' ? base + 3 : k === 'jumper' ? Math.max(2, base - 1) : base,
    speed:
      k === 'shield'
        ? rnd(50, 58)
        : k === 'jumper'
          ? rnd(84, 92)
          : k === 'bomber'
            ? rnd(88, 98)
            : rnd(44, 50),
    dmg: 1,
    atk: 1,
    atkCd: 0,
    flee: false,
    loot: 0,
    dead: false,
    anim: rnd(0, 6),
    jcd: 0
  };
  if (k === 'shield') e.shield = e.shMax = 6 + 2 * Math.max(0, F - 1);
  S.enemies.push(e);
  puff(x, GY - 40, 0xb06cff, 8);
}
// every hit on a robot goes through here: a riot shield soaks small arms, heavy rounds smash it at once
export function hitE(e, dmg, heavy) {
  if (e.dead) return;
  if (e.shield > 0) {
    if (heavy) {
      e.shield = 0;
      shieldBreak(e);
      dmg = Math.max(0, dmg - 2);
    } else {
      e.shield -= dmg;
      e.shHit = 0.12;
      sfx('shieldHit', e.x);
      if (e.shield <= 0) {
        e.shield = 0;
        shieldBreak(e);
      }
      return;
    }
  }
  e.hp -= dmg;
  if (e.hp <= 0) kill(e);
}
function shieldBreak(e) {
  sfx('shieldBreak', e.x);
  const fc = Math.sign(C - e.x) || 1;
  for (let i = 0; i < 10; i++)
    S.puffs.push({
      x: e.x + fc * 8,
      y: GY - rnd(8, 28),
      vx: fc * rnd(10, 70),
      vy: rnd(-80, -20),
      life: rnd(0.4, 0.8),
      color: i % 2 ? 0x78807a : 0xb5b3a6
    });
}
function wallAhead(x, md, r) {
  let b = null,
    bd = r;
  for (const w of S.spots)
    if (w.type === 'wall' && w.level > 0 && (w.x - x) * md >= 0 && Math.abs(w.x - x) < bd) {
      bd = Math.abs(w.x - x);
      b = w;
    }
  return b;
}
function wallHit(w, dmg) {
  w.hp -= dmg;
  sfx('clang', w.x);
  puff(w.x, GY - rnd(10, 40), 0xb8ad8a, 3);
  if (w.hp <= 0) {
    w.level = 0;
    w.hp = 0;
    w.maxHp = 0;
    w.paid = false;
    w.progress = 0;
    puff(w.x, GY - 30, 0x9a927a, 16);
    sfx('collapse', w.x);
    toast(tr('wallDown'), true);
  }
}
function personHit(m) {
  if (m.role === 'guard' && S.medic.level > 0) {
    m.hurt = 1;
    m.healT = 8;
    toast(tr('woundedGuard'), true);
  } else if (m.role === 'idle') {
    m.role = 'vagrant';
    m.campX = nearestCamp(m.x);
    m.tx = m.campX;
    toast(tr('scaredIdle'), true);
  } else {
    toast(tr('toolTaken', TOOL_OF[m.role]), true);
    m.role = 'idle';
    m.task = null;
    m.farm = null;
  }
  puff(m.x, GY - 20, 0xff5a3c, 6);
  sfx('hurt', m.x);
}
// a robot reaches the commander: tokens are knocked out, half of them carried off; with no tokens left the base falls
function touchPlayer(e) {
  const p = S.player;
  if (Math.abs(p.x - e.x) >= 18 || p.hitCd > 0) return false;
  if (S.coins <= 0) {
    gameOver();
    return true;
  }
  const lose = VEH[p.veh].armor
    ? e.boss
      ? 3
      : 1
    : Math.min(S.coins, Math.max(1, Math.ceil(S.coins * (e.boss ? 0.5 : 0.35))));
  S.coins -= Math.min(S.coins, lose);
  const stolen = Math.ceil(lose / 2);
  e.loot += stolen;
  for (let i = 0; i < lose - stolen; i++) dropCoin(p.x, GY - 30);
  p.hitCd = 1.6;
  sfx('hitPlayer', p.x);
  if (!e.boss) e.flee = true;
  toast(tr(e.boss ? 'hitWalker' : 'hitRobot', tokN(lose)), true);
  return true;
}
// a bomber goes off: on contact it hits walls, people, the squad and the missile; shot down early it only hurts robots around it
export function bombBoom(x, full, self) {
  S.booms.push({x, life: 0.5});
  puff(x, GY - 12, 0xff8a3c, 16);
  puff(x, GY - 16, 0x4a4440, 10);
  if (full) {
    for (const w of S.spots) if (w.type === 'wall' && w.level > 0 && Math.abs(w.x - x) < 44) wallHit(w, 10);
    for (const m of S.people)
      if (m.role !== 'vagrant' && !(m.hurt > 0) && Math.abs(m.x - x) < 36) personHit(m);
    const p = S.player;
    if (Math.abs(p.x - x) < 40 && p.hitCd <= 0) {
      if (S.coins <= 0) {
        gameOver();
        return;
      }
      const lose = VEH[p.veh].armor ? 1 : Math.min(S.coins, Math.max(1, Math.ceil(S.coins * 0.25)));
      S.coins -= lose;
      for (let i = 0; i < lose; i++) dropCoin(p.x, GY - 30);
      p.hitCd = 1.6;
      sfx('hitPlayer', p.x);
      toast(tr('hitRobot', tokN(lose)), true);
    }
    if (S.squad && Math.abs(S.squad.x - x) < 50) hitSquad({dmg: 8});
    if (rocketUp() && Math.abs(S.launch.x - x) < 44) {
      S.launch.hp -= 10;
      if (S.launch.hp <= 0) rocketLost();
    }
  }
  for (const o of S.enemies) if (o !== self && !o.dead && !o.fly && Math.abs(o.x - x) < 44) hitE(o, 3, true);
}
// jammers and the colossus pulse silence turrets, mortars, ATGM and the sniper nearby
export function jammed(x) {
  for (const e of S.enemies)
    if (!e.dead && e.kind === 'jammer' && !(e.fall > 0) && Math.abs(e.x - x) < 210) return true;
  for (const z of S.emps) if (Math.abs(z.x - x) < z.r) return true;
  return false;
}
// where a long-range robot stops: a set distance outside the outermost wall on its side (or the missile pad)
function standoff(e, gap) {
  if (e.side > 0 && rocketUp()) return S.launch.x + gap;
  const ow = outerWall(e.side);
  return (ow !== null ? ow : C + e.side * 110) + e.side * gap;
}
function updHowitzer(e, dt) {
  const sx = standoff(e, 330);
  if ((e.x - sx) * e.side > 4) {
    e.dep = false;
    e.x += Math.sign(sx - e.x) * Math.min(Math.abs(sx - e.x), e.speed * dt);
    touchPlayer(e);
    return;
  }
  e.dep = true;
  if (e.flash > 0) e.flash -= dt;
  e.shT -= dt;
  if (e.shT > 0) return;
  e.shT = 5;
  const ow = outerWall(e.side);
  let tx;
  if (e.side > 0 && rocketUp()) tx = S.launch.x;
  else if (ow !== null) tx = ow;
  else {
    tx = C + e.side * 110;
    let bd = 760;
    for (const m of S.people)
      if (m.role === 'guard' && !(m.hurt > 0) && Math.abs(m.x - e.x) < bd) {
        bd = Math.abs(m.x - e.x);
        tx = m.x;
      }
  }
  const x1 = tx + rnd(-26, 26),
    fc = Math.sign(C - e.x) || 1;
  S.eshells.push({x0: e.x + fc * 40, y0: GY - 58, x1, t: 0, dur: 1.8});
  e.flash = 0.12;
  sfx('howitzer', e.x);
  sfx('whistle', x1);
  puff(e.x + fc * 42, GY - 60, 0xd8d0b8, 8);
}
export function shellHit(x) {
  S.booms.push({x, life: 0.5});
  puff(x, GY - 10, 0xff8a3c, 14);
  puff(x, GY - 14, 0x5a5446, 10);
  for (const w of S.spots) if (w.type === 'wall' && w.level > 0 && Math.abs(w.x - x) < 34) wallHit(w, 7);
  for (const m of S.people) if (m.role !== 'vagrant' && !(m.hurt > 0) && Math.abs(m.x - x) < 26) personHit(m);
  if (rocketUp() && Math.abs(S.launch.x - x) < 40) {
    S.launch.hp -= 7;
    if (S.launch.hp <= 0) rocketLost();
  }
  if (S.squad && Math.abs(S.squad.x - x) < 40) hitSquad({dmg: 5});
}
// the hive hangs just outside the outer wall and lets robots fall from its hatch
function updHive(e, dt) {
  const ow = outerWall(e.side),
    hx =
      e.side > 0 && rocketUp()
        ? S.launch.x + e.hover
        : (ow !== null ? ow : C + e.side * 110) + e.side * e.hover;
  e.dir = Math.sign(hx - e.x) || -e.side;
  const d = Math.abs(hx - e.x);
  e.x += e.dir * Math.min(d, e.speed * dt);
  if (d < 8) {
    e.dropT -= dt;
    if (e.dropT <= 0) {
      e.dropT = 6.5;
      hiveDrop(e);
    }
  }
  e.y = e.alt + Math.sin(e.bob * 1.3) * 5;
}
function hiveDrop(e) {
  sfx('drop', e.x);
  const F = (S.front || 1) - 1;
  const r = {
    isEnemy: true,
    x: e.x + rnd(-8, 8),
    y: 0,
    side: e.side,
    brute: false,
    hp: 2 + Math.floor(S.day / 6) + F,
    speed: rnd(62, 76),
    dmg: 1,
    atk: 1,
    atkCd: 0.6,
    flee: false,
    loot: 0,
    dead: false,
    anim: 0,
    vy: 0
  };
  r.fall = GY - (e.y + 11 * SP);
  r.y = GY - 16 - r.fall;
  S.enemies.push(r);
}
export function spawnEnemy(q) {
  if (S.portalDead[q.side < 0 ? 0 : 1]) q.side = -q.side;
  const brute = q.type === 'brute';
  const x = q.side < 0 ? S.portals[0] : S.portals[1];
  if (q.type === 'carrier') {
    const alt = GY - rnd(130, 170);
    S.enemies.push({
      isEnemy: true,
      fly: true,
      cargo: true,
      state: 'in',
      x,
      y: alt,
      alt,
      side: q.side,
      dir: -q.side,
      hp: 6 + Math.floor(S.day / 4) + ((S.front || 1) - 1),
      speed: rnd(80, 90) + S.day * 2,
      dropOff: rnd(70, 220),
      dmg: 0,
      loot: 0,
      dead: false,
      anim: rnd(0, 6),
      bob: rnd(0, 6)
    });
    puff(x, alt, 0xb06cff, 8);
    return;
  }
  if (q.type === 'walker') {
    S.enemies.push({
      isEnemy: true,
      boss: true,
      x,
      y: GY - 40,
      side: q.side,
      hp: 36 + S.day * 3 + 10 * ((S.front || 1) - 1),
      maxHp: 36 + S.day * 3 + 10 * ((S.front || 1) - 1),
      speed: 48,
      dmg: 8,
      atk: 1.8,
      atkCd: 0,
      flee: false,
      loot: 0,
      bounty: 8,
      dead: false,
      anim: 0
    });
    for (let i = 0; i < 3; i++) puff(x, GY - 40 - i * 20, 0xb06cff, 8);
    sfx('walkerSpawn', x);
    sfx('radio', null, {v: 'alert', d: 1.2});
    toast(tr(q.side < 0 ? 'walkerOutL' : 'walkerOutR'), true);
    return;
  }
  if (q.type in FOE_FRONT) {
    spawnFoe(q, x);
    return;
  }
  if (BOSS_OF.includes(q.type)) {
    spawnBoss(q, x);
    return;
  }
  S.enemies.push({
    isEnemy: true,
    x,
    y: GY - 16,
    side: q.side,
    brute,
    hp: brute ? 9 + 2 * ((S.front || 1) - 1) : 2 + Math.floor(S.day / 6) + ((S.front || 1) - 1),
    speed: brute ? 42 : rnd(62, 76),
    dmg: brute ? 3 : 1,
    atk: brute ? 1.3 : 1,
    atkCd: 0,
    flee: false,
    loot: 0,
    dead: false,
    anim: rnd(0, 6)
  });
  puff(x, GY - 40, 0xb06cff, 8);
}
function updFlyer(e, dt) {
  e.anim += dt;
  e.bob += dt;
  const home = S.portals[e.side < 0 ? 0 : 1];
  if (e.state === 'in') {
    const ow = outerWall(e.side),
      dropX =
        e.side > 0 && rocketUp()
          ? S.launch.x + (e.dropOff - 145) * 0.4
          : ow !== null
            ? ow - e.side * e.dropOff
            : C + e.side * e.dropOff;
    e.dir = Math.sign(dropX - e.x) || -e.side;
    e.x += e.dir * Math.min(Math.abs(dropX - e.x), e.speed * dt);
    if (Math.abs(e.x - dropX) < 3) {
      dropCargo(e);
      e.state = 'out';
    }
  } else {
    e.dir = Math.sign(home - e.x) || e.side;
    e.x += e.dir * e.speed * 1.3 * dt;
    if (Math.abs(e.x - home) < 12) e.dead = true;
  }
  e.y = e.alt + Math.sin(e.bob * 2) * 4;
}
// the carried robot is let go (also when the carrier is shot down) and falls to the ground
export function dropCargo(e) {
  if (!e.cargo) return;
  e.cargo = false;
  sfx('drop', e.x);
  S.enemies.push({
    isEnemy: true,
    x: e.x,
    y: e.y + 30,
    side: e.side,
    brute: false,
    hp: 2 + Math.floor(S.day / 6),
    speed: rnd(62, 76),
    dmg: 1,
    atk: 1,
    atkCd: 0.6,
    flee: false,
    loot: 0,
    dead: false,
    anim: 0,
    fall: GY - (e.y + 21 * SP),
    vy: 0
  });
  const r = S.enemies[S.enemies.length - 1];
  r.y = GY - 16 - r.fall;
}
export function updEnemy(e, dt) {
  if (e.fly) {
    if (e.kind === 'hive') {
      e.anim += dt;
      e.bob += dt;
      updHive(e, dt);
    } else updFlyer(e, dt);
    return;
  }
  e.anim += dt;
  if (e.shHit > 0) e.shHit -= dt;
  if (e.jcd > 0) e.jcd -= dt;
  if (e.fall > 0) {
    e.vy += 520 * dt;
    e.fall = Math.max(0, e.fall - e.vy * dt);
    e.y = GY - 16 - e.fall;
    if (e.fall === 0) {
      puff(e.x, GY - 4, 0x8a8270, 8);
    }
    return;
  }
  // a jumper in the air follows its arc and lands behind the wall
  if (e.jt != null) {
    e.jt += dt;
    const k = Math.min(1, e.jt / 1.05);
    e.x = lerp(e.jx0, e.jx1, k);
    e.air = Math.sin(k * Math.PI) * 64;
    e.y = GY - 16 - e.air;
    if (k >= 1) {
      e.jt = null;
      e.air = 0;
      e.y = GY - 16;
      e.jcd = 1.4;
      puff(e.x, GY - 4, 0x8a8270, 6);
      sfx('bruteStep', e.x);
    }
    return;
  }
  if (e.jcd > 0.8 && e.kind === 'jumper') return; // lands in a crouch and needs a moment to get up
  if (e.flee) {
    const out = e.x < C ? -1 : 1;
    e.x += out * e.speed * 1.4 * dt;
    if (Math.abs(e.x - C) > PORTAL) e.dead = true;
    return;
  }
  if (e.kind === 'colossus') {
    e.empT -= dt;
    if (e.empT <= 0) {
      e.empT = 10;
      S.emps.push({x: e.x, r: 290, t: 4, age: 0});
      sfx('emp', e.x);
    }
  }
  if (e.kind === 'howitzer') {
    updHowitzer(e, dt);
    return;
  }
  const q = S.squad;
  if (q && e.kind !== 'bomber' && Math.abs(q.x - e.x) < (e.boss ? 56 : e.brute ? 40 : 34)) {
    e.atkCd -= dt;
    if (e.atkCd <= 0) {
      e.atkCd = e.atk;
      hitSquad(e);
    }
    return;
  }
  if (e.guard) {
    if (!q) {
      e.dead = true;
      return;
    }
    e.x += Math.sign(q.x - e.x) * e.speed * dt;
    return;
  }
  let tx = C,
    bd = 380;
  const p = S.player,
    L = S.launch,
    rk = rocketUp();
  if (rk && e.x > L.x - 220) {
    tx = L.x;
    bd = Math.abs(e.x - L.x);
  }
  if (Math.abs(p.x - e.x) < bd) {
    bd = Math.abs(p.x - e.x);
    tx = p.x;
  }
  for (const m of S.people)
    if (m.role !== 'vagrant' && !(m.hurt > 0)) {
      const d = Math.abs(m.x - e.x);
      if (d < bd) {
        bd = d;
        tx = m.x;
      }
    }
  // a jammer stays a little outside the walls, where it silences the defences behind them
  if (e.kind === 'jammer') {
    const hx = standoff(e, 120);
    if ((e.x - hx) * e.side >= 0 && (tx - hx) * e.side < 0) tx = hx;
  }
  const md = Math.sign(tx - e.x) || e.side * -1;
  if (e.kind === 'bomber') {
    let go =
      (q && Math.abs(q.x - e.x) < 34) ||
      Math.abs(p.x - e.x) < 18 ||
      (rk && Math.abs(L.x - e.x) < 30) ||
      !!wallAhead(e.x, md, 16);
    if (!go)
      for (const m of S.people)
        if (m.role !== 'vagrant' && !(m.hurt > 0) && Math.abs(m.x - e.x) < 12) {
          go = true;
          break;
        }
    if (go) {
      e.dead = true;
      bombBoom(e.x, true, e);
      return;
    }
  }
  const reach = e.kind === 'colossus' ? 38 : e.boss ? 34 : e.brute ? 20 : 15;
  if (rk && Math.abs(L.x - e.x) < reach + 16) {
    e.atkCd -= dt;
    if (e.atkCd <= 0) {
      e.atkCd = e.atk;
      L.hp -= e.dmg;
      sfx('clang', L.x);
      puff(L.x + rnd(-18, 18), GY - rnd(10, 70), 0xb8ad8a, 3);
      if (L.hp <= 0) rocketLost();
    }
    return;
  }
  // the ram backs off, revs up and charges the wall in front of it
  if (e.kind === 'ram') {
    if (e.back > 0) {
      e.back -= dt;
      e.x -= md * 85 * dt;
      return;
    }
    if (e.wait > 0) {
      e.wait -= dt;
      return;
    }
    const w = wallAhead(e.x, md, 150);
    if (w) {
      if (Math.abs(w.x - e.x) < 26) {
        wallHit(w, e.dmg);
        sfx('ramHit', w.x);
        S.booms.push({x: w.x - md * 10, life: 0.35});
        for (let i = 0; i < 10; i++) puff(w.x - md * 8, GY - rnd(6, 50), i % 2 ? 0x9a927a : 0xb8ad8a, 1);
        e.back = 0.7;
        e.wait = 1.5;
        e.chg = false;
        return;
      }
      if (!e.chg) {
        e.chg = true;
        sfx('ramRev', e.x);
      }
      e.x += md * 170 * dt;
      return;
    }
    e.chg = false;
  }
  const w = wallAhead(e.x, md, reach);
  if (w) {
    if (e.kind === 'jumper' && e.jcd <= 0) {
      e.jt = 0;
      e.jx0 = e.x;
      e.jx1 = w.x + md * rnd(90, 120);
      sfx('jump', e.x);
      return;
    }
    e.atkCd -= dt;
    if (e.atkCd <= 0) {
      e.atkCd = e.atk;
      wallHit(w, e.dmg);
    }
    return;
  }
  if (touchPlayer(e)) return;
  for (const m of S.people)
    if (m.role !== 'vagrant' && !(m.hurt > 0) && Math.abs(m.x - e.x) < 12) {
      personHit(m);
      if (!e.boss) {
        e.flee = true;
        return;
      }
    }
  if (Math.abs(tx - e.x) > 2) e.x += md * e.speed * dt;
}
