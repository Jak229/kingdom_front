/* Turrets, sniper towers, mortars and shells. */
import {C, DEFS, GY} from '../config.js';
import {S} from '../state.js';
import {fire, puff, sfx, toast} from './rules.js';
import {nearestEnemy} from './people.js';
import {hitE, jammed, shellHit} from './enemies.js';

export function updTurret(sp, dt) {
  sp.jam = jammed(sp.x);
  if (sp.jam) return;
  const d = DEFS.turret;
  sp.cd -= dt;
  if (sp.cd > 0) return;
  const t = nearestEnemy(sp.x, d.range[sp.level] * (S.buff.radar ? 1.25 : 1));
  if (t) {
    sp.aim = Math.sign(t.x - sp.x) || 1;
    fire(sp.x + sp.aim * 26, GY - 68, t, d.dmg[sp.level], 0.9, 0xffd166, sp.level > 1 ? 'turret' : 'mg');
    sp.cd = d.rate[sp.level];
  }
}
export function updSniper(sp, dt) {
  const d = DEFS.sniper;
  sp.cd -= dt;
  if (sp.flash) sp.flash = Math.max(0, sp.flash - dt);
  sp.jam = jammed(sp.x);
  if (sp.jam || sp.cd > 0) return;
  const R = d.range * (S.buff.radar ? 1.25 : 1);
  let t = null,
    best = -1e9;
  for (const e of S.enemies) {
    if (e.dead) continue;
    const dd = Math.abs(e.x - sp.x);
    if (dd > R) continue;
    const pr =
      (e.fly && e.cargo
        ? 3
        : e.kind === 'jammer'
          ? 2.5
          : e.boss
            ? 2
            : e.shield > 0
              ? 1.5
              : e.brute || e.kind === 'bomber'
                ? 1
                : 0) *
        1000 -
      dd;
    if (pr > best) {
      best = pr;
      t = e;
    }
  }
  if (t) {
    sp.aim = Math.sign(t.x - sp.x) || 1;
    fire(sp.x + sp.aim * 22, GY - 98, t, d.dmg, t.fly ? 0.95 / 0.6 : 0.95, 0xffffff, 'sniper');
    sp.cd = d.rate;
    sp.flash = 0.08;
  }
}
export function updMortar(sp, dt) {
  const d = DEFS.mortar;
  sp.cd -= dt;
  sp.jam = jammed(sp.x);
  if (sp.jam || sp.cd > 0) return;
  let t = nearestEnemy(sp.x, d.range * (S.buff.radar ? 1.25 : 1), 90);
  if (t && t.fly) {
    t = null;
    let bd = d.range * (S.buff.radar ? 1.25 : 1);
    for (const e of S.enemies) {
      const dd = Math.abs(e.x - sp.x);
      if (!e.dead && !e.fly && dd >= 90 && dd < bd) {
        bd = dd;
        t = e;
      }
    }
  }
  if (t) {
    sp.aim = Math.sign(t.x - sp.x) || 1;
    const lead = t.flee ? 0 : Math.sign(C - t.x) * t.speed * 1.3;
    S.shells.push({x0: sp.x + sp.aim * 10, y0: GY - 24, x1: t.x + lead, t: 0, dur: 1.3});
    sfx('mortar', sp.x);
    sfx('whistle', t.x + lead);
    puff(sp.x + sp.aim * 12, GY - 28, 0xd8d0b8, 5);
    sp.cd = d.rate;
    sp.recoil = 0.25;
  }
}
export function updFoeFx(dt) {
  for (const s of S.eshells) {
    s.t += dt;
    if (s.t >= s.dur) {
      s.done = true;
      shellHit(s.x1);
    }
  }
  S.eshells = S.eshells.filter(s => !s.done);
  for (const z of S.emps) {
    z.t -= dt;
    z.age += dt;
  }
  S.emps = S.emps.filter(z => z.t > 0);
  if (S.later.length) {
    for (const l of S.later) l.t -= dt;
    const due = S.later.filter(l => l.t <= 0);
    S.later = S.later.filter(l => l.t > 0);
    for (const l of due) toast(l.text, l.warn);
  }
}
export function updShells(dt) {
  const d = DEFS.mortar;
  for (const s of S.shells) {
    s.t += dt;
    if (s.t >= s.dur) {
      s.done = true;
      S.booms.push({x: s.x1, life: 0.5});
      puff(s.x1, GY - 10, 0xff8a3c, 14);
      puff(s.x1, GY - 14, 0x5a5446, 10);
      for (const e of S.enemies)
        if (!e.dead && !e.fly && !(e.fall > 0) && Math.abs(e.x - s.x1) < d.blast) hitE(e, d.dmg, true);
    }
  }
  S.shells = S.shells.filter(s => !s.done);
  for (const b of S.booms) b.life -= dt;
  S.booms = S.booms.filter(b => b.life > 0);
}
