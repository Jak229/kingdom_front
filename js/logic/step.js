/* One simulation tick for the whole world, plus darkness and moving on to the next front. */
import {C, GY, PURSE, VEH, WORLD, dayLen, nightLen} from '../config.js';
import {clamp, rnd} from '../util.js';
import {S, input, mkPerson, mod, newState} from '../state.js';
import {balanceGuards, handlePay, pickSide, puff, rocketUp, rocketX} from './rules.js';
import {tutClock, tutStep} from './tutorial.js';
import {updPerson} from './people.js';
import {spawnEnemy, startDay, startNight, updEnemy} from './enemies.js';
import {updFoeFx, updMortar, updShells, updSniper, updTurret} from './defences.js';
import {updAtgm, updBank, updConvoy, updDog, updMissiles, updSquad, updWild} from './support.js';
import {showEnd} from '../ui/end.js';
import {ev} from '../meta.js';

/* ---------- main step ---------- */
export function step(dt) {
  if (!S.running || S.over || S.paused) return;
  if (S.won) {
    if (S.wonBy === 'portals') {
      S.winT += dt;
      for (const q of S.puffs) {
        q.life -= dt;
      }
      if (S.winT > 5 && !S.endShown) {
        S.endShown = true;
        showEnd(true);
      }
      return;
    }
    S.winT += dt;
    S.rocketY += S.winT * 120 * dt;
    if (Math.random() < 0.8) puff(rocketX() + rnd(-6, 6), GY - 28 - S.rocketY, 0xffb347, 2);
    if (S.winT > 4 && !S.endShown) {
      S.endShown = true;
      showEnd(true);
    }
    return;
  }
  const p = S.player;
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (dir) {
    const vs = VEH[p.veh];
    p.dir = dir;
    p.x = clamp(p.x + dir * (input.fast ? vs.fast : vs.speed) * dt, 40, WORLD - 40);
    p.anim += dt * (input.fast ? 2 : 1);
  }
  p.hitCd -= dt;
  handlePay(dt);
  S.phaseT += dt * tutClock();
  if (!S.night && S.phaseT >= dayLen()) startNight();
  else if (S.night && S.phaseT >= nightLen()) startDay();
  if (S.tut) tutStep(dt);
  if (S.night) {
    S.nightT += dt;
    for (let i = S.queue.length - 1; i >= 0; i--)
      if (S.queue[i].t <= S.nightT) {
        spawnEnemy(S.queue[i]);
        S.queue.splice(i, 1);
      }
  }
  // enemy recon drones fly over in daytime (soldiers shoot them down for scrap)
  if (!S.night) {
    S.rabbitCd -= dt;
    // «Swarm» day: twice as many recon drones (and their scrap)
    if (S.rabbitCd <= 0 && S.rabbits.length < (mod('swarm') ? 10 : 5)) {
      const sd = Math.random() < 0.5 ? -1 : 1;
      S.rabbits.push({
        x: C + sd * rnd(620, 2400),
        y: GY - rnd(70, 140),
        tx: 0,
        ty: 0,
        hp: 1,
        cd: rnd(1, 3),
        dead: false,
        anim: 0
      });
      S.rabbitCd = mod('swarm') ? rnd(2, 4) : rnd(4, 8);
    }
  }
  for (const r of S.rabbits) {
    r.anim += dt;
    r.cd -= dt;
    if (r.cd <= 0) {
      r.tx = clamp(r.x + rnd(-140, 140), 300, WORLD - 300);
      r.ty = GY - rnd(70, 140);
      r.cd = rnd(2, 4);
    }
    if (r.tx) {
      r.x += (r.tx - r.x) * Math.min(1, dt * 0.8);
      r.y += (r.ty - r.y) * Math.min(1, dt * 0.8);
    }
  }
  S.rabbits = S.rabbits.filter(r => !r.dead);
  balanceGuards();
  for (const m of S.people) updPerson(m, dt);
  for (const e of S.enemies) if (!e.dead) updEnemy(e, dt);
  if (S.over) return;
  updSquad(dt);
  updMissiles(dt);
  updBank();
  updConvoy(dt);
  updWild(dt);
  updDog(dt);
  if (rocketUp() && Math.random() < dt * 3)
    S.puffs.push({
      x: rocketX() + rnd(-6, 6),
      y: GY - rnd(26, 34),
      vx: rnd(-20, 20),
      vy: rnd(-30, -10),
      life: rnd(0.6, 1.1),
      color: 0xe8eef0
    });
  if (S.won) return;
  for (const sp of S.spots) {
    if (sp.type === 'atgm' && sp.level > 0) updAtgm(sp, dt);
    if (sp.type === 'sniper' && sp.level > 0) updSniper(sp, dt);
    if (sp.type === 'turret' && sp.level > 0) updTurret(sp, dt);
    else if (sp.type === 'mortar' && sp.level > 0) updMortar(sp, dt);
    if (sp.recoil) sp.recoil = Math.max(0, sp.recoil - dt);
  }
  updShells(dt);
  updFoeFx(dt);
  S.enemies = S.enemies.filter(e => !e.dead);
  for (const c of S.ground) {
    if (!c.landed) {
      c.vy += 420 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      if (c.y >= GY - 4) {
        c.y = GY - 4;
        c.landed = true;
      }
    } else if (Math.abs(c.x - p.x) < 22 && S.coins < PURSE) {
      c.taken = true;
      S.coins++;
      ev('coin');
    }
  }
  S.ground = S.ground.filter(c => !c.taken);
  for (const t of S.tracers) t.life -= dt;
  S.tracers = S.tracers.filter(t => t.life > 0);
  for (const q of S.puffs) {
    q.life -= dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.vy += 60 * dt;
  }
  S.puffs = S.puffs.filter(q => q.life > 0);
  if (S.toast) {
    S.toast.t -= dt;
    if (S.toast.t <= 0) S.toast = null;
  }
}

export function darkness() {
  if (!S) return 0;
  if (S.night) return 1;
  if (S.phaseT < 6) return S.day === 1 ? 0 : 1 - S.phaseT / 6;
  const dl = dayLen();
  if (S.phaseT > dl - 9) return (S.phaseT - (dl - 9)) / 9;
  return 0;
}
// after a victory the commander moves on to the next front with part of the team
export function nextFrontState(o) {
  const n = newState((o.front || 1) + 1);
  n.coins = Math.min(PURSE, o.coins + 10);
  n.kills = o.kills;
  let g = 0,
    b = 0;
  // specialists bought with crystals are the first to come along
  const team = [...o.people].sort((x, y) => (y.vet ? 1 : 0) - (x.vet ? 1 : 0));
  for (const m of team) {
    if (m.role === 'guard' && g < 4) g++;
    else if (m.role === 'builder' && b < 2) b++;
    else continue;
    const p = mkPerson(C + rnd(-90, 90), m.role, C);
    if (m.vet) p.vet = true;
    if (m.role === 'guard') p.side = pickSide(n, p);
    n.people.push(p);
  }
  if (o.dog) {
    n.wild.find(w => w.type === 'dog').done = true;
    n.buff.dog = true;
    n.dog = {x: n.player.x - 40, dir: 1, anim: 0, mode: 'follow', digCd: 30, barkCd: 0, t: 0, moving: false};
  }
  n.carried = {g, b};
  return n;
}
