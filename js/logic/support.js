/* ATGM, spec ops squad, finance office, supply convoy, vehicles, the service dog and wild-land objects. */
import {C, DEFS, GY, PURSE, VEH, WILD, WORLD, dayLen} from '../config.js';
import {tokN, tr} from '../i18n/index.js';
import {rnd} from '../util.js';
import {S, input} from '../state.js';
import {dropCoin, fire, outerWall, puff, rocketUp, sfx, toast} from './rules.js';
import {nearestEnemy} from './people.js';
import {hitE, jammed} from './enemies.js';
import {SP} from '../sprites.js';
import {achieve, ev} from '../meta.js';

/* ---------- ATGM, spec ops, finance, convoy ---------- */
export function assaultTarget() {
  if (!S.portalDead[1]) return 1;
  if (!S.portalDead[0]) return 0;
  return -1;
}
export function updAtgm(sp, dt) {
  const d = DEFS.atgm;
  sp.cd -= dt;
  sp.jam = jammed(sp.x);
  if (sp.jam || sp.cd > 0) return;
  let t = null,
    bd = d.range * (S.buff.radar ? 1.25 : 1);
  for (const e of S.enemies)
    if (!e.dead && e.boss && Math.abs(e.x - sp.x) < bd) {
      bd = Math.abs(e.x - sp.x);
      t = e;
    }
  if (!t)
    for (const e of S.enemies)
      if (!e.dead && (e.brute || e.shield > 0) && Math.abs(e.x - sp.x) < bd) {
        bd = Math.abs(e.x - sp.x);
        t = e;
      }
  if (!t) t = nearestEnemy(sp.x, bd);
  if (t) {
    sp.aim = Math.sign(t.x - sp.x) || 1;
    S.missiles.push({x: sp.x + sp.aim * 16, y: GY - 40, t, dmg: d.dmg});
    sfx('atgm', sp.x);
    puff(sp.x - sp.aim * 14, GY - 40, 0xd8d0b8, 6);
    sp.cd = d.rate;
  }
}
export function updMissiles(dt) {
  for (const m of S.missiles) {
    const tx = m.t.x,
      ty = m.t.isPortal ? GY - 40 : m.t.y || GY - 16,
      dx = tx - m.x,
      dy = ty - m.y,
      dist = Math.hypot(dx, dy);
    if (m.t.dead && !m.t.isPortal) {
      m.done = true;
      puff(m.x, m.y, 0x9a9a90, 6);
      continue;
    }
    if (dist < 10) {
      m.done = true;
      S.booms.push({x: m.x, life: 0.4});
      puff(m.x, GY - 14, 0xff8a3c, 12);
      if (m.t.isPortal) {
        S.portalHp[m.t.i] -= m.dmg;
      } else {
        hitE(m.t, m.dmg, true);
      }
      continue;
    }
    const sp = 460 * dt;
    m.x += (dx / dist) * sp;
    m.y += (dy / dist) * sp;
    if (Math.random() < 0.7) S.puffs.push({x: m.x, y: m.y, vx: 0, vy: -8, life: 0.5, color: 0xbdb8a8});
  }
  S.missiles = S.missiles.filter(m => !m.done);
}
export function updSquad(dt) {
  const q = S.squad;
  if (!q) return;
  q.anim += dt;
  q.cd -= dt;
  let tx = q.x;
  if (S.night) {
    if (q.mode === 'assault' || q.mode === 'return') q.mode = 'home';
    q.pick -= dt;
    if (q.pick <= 0) {
      q.pick = 3;
      let l = 0,
        r = 0;
      for (const e of S.enemies)
        if (!e.dead) {
          if (e.x < C) l++;
          else r++;
        }
      q.side = l > r ? -1 : r > l ? 1 : q.side;
    }
    const ow = outerWall(q.side);
    tx = rocketUp() ? S.launch.x - 60 : ow !== null ? ow - q.side * 70 : C + q.side * 170;
    if (q.cd <= 0) {
      const t = nearestEnemy(q.x, 330);
      if (t) {
        q.dir = Math.sign(t.x - q.x) || 1;
        fire(q.x + q.dir * 30, GY - 36, t, 2, 0.9, 0xffe08a, 'kpvt');
        q.cd = 0.5;
      }
    }
  } else if (q.mode === 'assault') {
    const pi = q.target,
      px = S.portals[pi],
      dirToBase = pi === 0 ? 1 : -1;
    if (S.portalDead[pi] || S.phaseT > dayLen() - 24) {
      q.mode = 'return';
    } else {
      tx = px + dirToBase * 230;
      if (q.cd <= 0) {
        const g = nearestEnemy(q.x, 300);
        if (g) {
          q.dir = Math.sign(g.x - q.x) || 1;
          fire(q.x + q.dir * 30, GY - 36, g, 2, 0.9, 0xffe08a, 'kpvt');
          q.cd = 0.45;
        } else if (Math.abs(q.x - px) < 300) {
          q.dir = Math.sign(px - q.x);
          const hit = Math.random() < 0.9;
          S.tracers.push({
            x1: q.x + q.dir * 30,
            y1: GY - 36,
            x2: px,
            y2: GY - 40,
            life: 0.12,
            color: 0xffe08a
          });
          sfx('kpvt', q.x);
          if (hit) S.portalHp[pi] -= 1.5;
          q.cd = 0.45;
        }
      }
      q.spawnCd = (q.spawnCd || 0) - dt;
      if (Math.abs(q.x - px) < 420 && q.spawnCd <= 0) {
        q.spawnCd = Math.max(1.4, 3.2 - S.day * 0.1);
        S.enemies.push({
          isEnemy: true,
          guard: true,
          x: px,
          y: GY - 16,
          side: pi === 0 ? -1 : 1,
          brute: Math.random() < 0.2,
          hp: 3,
          speed: 60,
          dmg: 2,
          atk: 1,
          atkCd: 0,
          flee: false,
          loot: 0,
          dead: false,
          anim: 0
        });
        puff(px, GY - 40, 0xb06cff, 8);
      }
      if (S.portalHp[pi] <= 0) {
        S.portalDead[pi] = true;
        S.portalHp[pi] = 0;
        ev('portal');
        sfx('portalDie', px);
        sfx('radio', null, {v: 'order', d: 1});
        for (let i = 0; i < 30; i++)
          puff(px + rnd(-20, 20), GY - rnd(10, 80), i % 2 ? 0xc77dff : 0xff8a3c, 1);
        S.booms.push({x: px, life: 0.5});
        for (let i = 0; i < 6; i++) dropCoin(px + dirToBase * rnd(30, 90), GY - 40);
        q.mode = 'return';
        if (S.portalDead[0] && S.portalDead[1]) {
          S.wonBy = 'portals';
          S.won = true;
          S.winT = 3;
          toast(tr('bothPortals'));
        } else toast(tr('portalDown'));
      }
    }
  }
  if (!S.night && q.mode === 'return') {
    tx = S.barracks.x + 30;
    if (Math.abs(q.x - tx) < 4) q.mode = 'home';
  }
  if (!S.night && q.mode === 'home') {
    tx = S.barracks.x + 30;
    q.hp = Math.min(q.maxHp, q.hp + (S.medic.level > 0 ? 4 : 2) * dt);
  }
  if (q.mode !== 'assault') {
    for (const e of S.enemies)
      if (e.guard && !e.dead) {
        e.dead = true;
        puff(e.x, GY - 16, 0xb06cff, 6);
      }
  }
  const dx = tx - q.x;
  if (Math.abs(dx) > 2) {
    q.x += Math.sign(dx) * Math.min(Math.abs(dx), 115 * dt);
    if (!(q.cd > 0.2)) q.dir = Math.sign(dx);
    q.moving = true;
  } else q.moving = false;
}
export function hitSquad(e) {
  const q = S.squad;
  q.hp -= e.dmg;
  puff(q.x, GY - 24, 0xff8a3c, 4);
  if (q.hp <= 0) {
    S.squad = null;
    for (let i = 0; i < 20; i++) puff(q.x + rnd(-30, 30), GY - rnd(5, 40), i % 2 ? 0x333333 : 0xff8a3c, 1);
    S.booms.push({x: q.x, life: 0.5});
    sfx('radio', null, {v: 'alert', d: 0.6});
    toast(tr('btrLost'), true);
  }
}
export function updBank() {
  const b = S.bank,
    p = S.player;
  if (b.level > 0 && b.saved > 0 && S.coins <= 2 && !input.pay && Math.abs(p.x - b.x) < 40) {
    const n = Math.min(b.saved, PURSE - S.coins);
    b.saved -= n;
    S.coins += n;
    puff(b.x, GY - 30, 0xd9b44a, 10);
    toast(tr('bankPaid', tokN(n)));
  }
}
export function startConvoy() {
  const fromLeft = S.portalDead[0] || !S.portalDead[1] ? Math.random() < 0.5 : false;
  S.convoy = {x: fromLeft ? -80 : WORLD + 80, dir: fromLeft ? 1 : -1, state: 'in', t: 0, anim: 0};
  sfx('radio', null, {v: 'convoy'});
  toast(tr('convoy'));
}
export function updConvoy(dt) {
  const v = S.convoy;
  if (!v) return;
  v.anim += dt;
  if (v.state === 'in') {
    const stop = C - v.dir * 120;
    v.x += v.dir * 220 * dt;
    if ((stop - v.x) * v.dir <= 0) {
      v.x = stop;
      v.state = 'unload';
      v.t = 0;
      sfx('truckHorn', v.x);
    }
  } else if (v.state === 'unload') {
    v.t += dt;
    if (v.t > 1.5) {
      for (let i = 0; i < 6; i++) dropCoin(v.x + rnd(-20, 20), GY - 30);
      v.state = 'out';
      v.dir = -v.dir;
    }
  } else {
    v.x += v.dir * 240 * dt;
    if (v.x < -120 || v.x > WORLD + 120) S.convoy = null;
  }
}

export function swapVehicle(w, to) {
  S.swapLatch = true;
  sfx('swap', S.player.x);
  S.player.veh = to;
  puff(S.player.x, GY - 20, 0xd9b44a, 10);
  toast(to === 'jeep' ? tr('swapJeep', VEH.jeep.name) : tr('swapOther', VEH[to].name));
}
export function unlockWild(w) {
  w.done = true;
  w.pending = 0;
  puff(w.x, GY - 40, 0xd9b44a, 14);
  if (w.type === 'depot') {
    if (w.veh === 'tank') achieve('tank');
    swapVehicle(w, w.veh);
    return;
  }
  if (w.type === 'dog') achieve('dog');
  S.buff[w.type] = true;
  sfx('unlock', w.x);
  if (w.type === 'dog')
    S.dog = {x: w.x, dir: 1, anim: 0, mode: 'follow', digCd: rnd(25, 40), barkCd: 0, t: 0, moving: false};
  if (w.type === 'hermit') {
    for (const sp of S.spots)
      if (sp.type === 'wall' && sp.level > 0) {
        sp.maxHp = Math.round(sp.maxHp * 1.5);
        sp.hp = Math.round(sp.hp * 1.5);
      }
  }
  toast(tr('wildDone', WILD[w.type].name, WILD[w.type].desc));
}
export function updDog(dt) {
  const d = S.dog,
    p = S.player;
  if (!d) return;
  d.anim += dt;
  d.barkCd -= dt;
  let tx = p.x - p.dir * 46;
  if (d.mode === 'dig') {
    d.t -= dt;
    tx = d.x;
    if (Math.random() < dt * 10) puff(d.x + d.dir * 10, GY - 4, 0x6a5638, 1);
    if (d.t <= 0) {
      d.mode = 'follow';
      const n = 1 + (Math.random() < 0.4 ? 1 : 0);
      for (let i = 0; i < n; i++) dropCoin(d.x + d.dir * 12, GY - 20);
      toast(tr('dogDig', tokN(n)));
    }
  } else if (!S.night) {
    d.digCd -= dt;
    if (d.digCd <= 0 && Math.abs(d.x - C) > 650 && Math.abs(d.x - p.x) < 80) {
      d.mode = 'dig';
      d.t = 2.2;
      d.digCd = rnd(35, 60);
    }
  }
  const e = nearestEnemy(d.x, 340);
  if (e && d.barkCd <= 0) {
    d.barkCd = 1.1;
    d.bark = 0.4;
    d.dir = Math.sign(e.x - d.x) || d.dir;
    sfx('bark', d.x);
  }
  if (d.bark) d.bark = Math.max(0, d.bark - dt);
  const dx = tx - d.x;
  if (d.mode !== 'dig' && Math.abs(dx) > 14) {
    const sp = Math.min(380, 90 + Math.abs(dx) * 2.2);
    d.x += Math.sign(dx) * Math.min(Math.abs(dx), sp * dt);
    if (!d.bark) d.dir = Math.sign(dx);
    d.moving = true;
  } else d.moving = false;
}
export function updWild(dt) {
  const p = S.player;
  for (const w of S.wild)
    if (w.type === 'cache' && !w.done && Math.abs(w.x - p.x) < 24) {
      w.done = true;
      for (let i = 0; i < w.coins; i++) dropCoin(w.x + rnd(-10, 10), GY - 40);
      puff(w.x, GY - 20, 0xd9b44a, 12);
      sfx('cache', w.x);
      toast(tr('cacheFound', tokN(w.coins)));
    }
  const v = VEH[p.veh];
  p.gunCd = (p.gunCd || 0) - dt;
  if (v.gun && p.gunCd <= 0) {
    const t = nearestEnemy(p.x, v.gun.range);
    if (t) {
      fire(
        p.x + (Math.sign(t.x - p.x) || 1) * 18.5 * SP,
        GY - 17.4 * SP,
        t,
        v.gun.dmg,
        0.85,
        0xffe08a,
        'kpvt'
      );
      p.gunCd = v.gun.rate;
    }
  }
  if (v.cannon && p.gunCd <= 0) {
    let t = null,
      bd = v.cannon.range;
    for (const e of S.enemies)
      if (!e.dead && !e.fly && (e.x - p.x) * p.dir > 0 && Math.abs(e.x - p.x) < bd) {
        bd = Math.abs(e.x - p.x);
        t = e;
      }
    if (t) {
      const bx = t.x;
      sfx('cannon', p.x);
      S.tracers.push({
        x1: p.x + p.dir * 33 * SP,
        y1: GY - 17.2 * SP,
        x2: bx,
        y2: GY - 14,
        life: 0.15,
        color: 0xffcf6a
      });
      S.booms.push({x: bx, life: 0.45});
      puff(bx, GY - 12, 0xff8a3c, 14);
      puff(p.x + p.dir * 34 * SP, GY - 17.2 * SP, 0xd8d0b8, 8);
      for (const e of S.enemies)
        if (!e.dead && !e.fly && Math.abs(e.x - bx) < v.cannon.blast) hitE(e, v.cannon.dmg, true);
      p.gunCd = v.cannon.rate;
      p.recoil = 0.25;
    }
  }
  if (p.recoil) p.recoil = Math.max(0, p.recoil - dt);
}
