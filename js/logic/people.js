/* Vagrants, soldiers, builders and farmers: wandering, working, shooting, getting hurt. */
import {C, DEFS, GY, SHOPS, season} from '../config.js';
import {rnd} from '../util.js';
import {S} from '../state.js';
import {completeSpot, dropCoin, fire, outerWall, pickSide, puff, rocketUp, sfx} from './rules.js';
import {achieve, ev} from '../meta.js';

/* ---------- people ---------- */
// a tree comes down: a stump stays, sometimes with a token in the chips, and the ground there can be built on
function fell(t) {
  t.st = 2;
  t.chop = 1;
  t.fall = 0; // the scene animates the fall
  sfx('treeFall', t.x);
  puff(t.x, GY - 30, 0x6a8a3a, 14);
  puff(t.x, GY - 8, 0xc8a46a, 8);
  if (Math.random() < 0.5) dropCoin(t.x, GY - 30);
  ev('tree');
}
function wander(m, cx, r, dt) {
  if (Math.abs(m.x - m.tx) < 3) {
    m.cd -= dt;
    if (m.cd <= 0) {
      m.tx = cx + rnd(-r, r);
      m.cd = rnd(1.5, 4);
    }
  }
}
export function nearestEnemy(x, range, minR) {
  let b = null,
    bd = range;
  for (const e of S.enemies) {
    if (e.dead) continue;
    const d = Math.abs(e.x - x);
    if (d < bd && d >= (minR || 0)) {
      bd = d;
      b = e;
    }
  }
  return b;
}
export function updPerson(m, dt) {
  m.anim += dt;
  m.working = false;
  if (m.role === 'vagrant') {
    if (Math.abs(m.x - m.campX) > 120) m.tx = m.campX + rnd(-60, 60);
    wander(m, m.campX, 70, dt);
  } else if (m.role === 'idle') {
    let sh = null,
      bd = 1e9;
    for (const s of S.shops)
      if (s.tools > 0) {
        const d = Math.abs(s.x - m.x);
        if (d < bd) {
          bd = d;
          sh = s;
        }
      }
    if (sh) {
      m.tx = sh.x;
      if (Math.abs(m.x - sh.x) < 4) {
        sh.tools--;
        m.role = SHOPS[sh.kind].role;
        puff(m.x, GY - 20, 0xb8d080, 6);
        if (m.role === 'guard') {
          m.side = pickSide(S, m);
          if (S.people.filter(o => o.role === 'guard').length >= 8) achieve('army8');
        }
      }
    } else wander(m, C, 170, dt);
  } else if (m.role === 'guard' && m.hurt > 0) {
    const md = S.medic;
    m.tx = md.x + (m.off - 20) * 0.3;
    if (Math.abs(m.x - m.tx) < 6) {
      m.healT -= dt;
      if (m.healT <= 0) {
        m.hurt = 0;
        puff(m.x, GY - 24, 0x8fd16a, 8);
      }
    }
  } else if (m.role === 'guard') {
    if (S.night) {
      const ow = outerWall(m.side);
      m.tx =
        m.side > 0 && rocketUp()
          ? S.launch.x - 34 - m.off
          : ow !== null
            ? ow - m.side * (26 + m.off)
            : C + m.side * (110 + m.off);
    } else {
      if (Math.abs(m.tx - C) < 380 && Math.abs(m.x - m.tx) < 3) m.tx = C + m.side * rnd(620, 1500);
      if (Math.abs(m.x - m.tx) < 3) {
        m.wait = (m.wait || 0) + dt;
        if (m.wait > rnd(2, 6)) {
          m.wait = 0;
          m.tx = C + m.side * rnd(620, 1500);
        }
      }
    }
    m.shotCd = (m.shotCd || 0) - dt;
    if (m.shotCd <= 0) {
      // a veteran (bought in the shop) sees further, aims better and hits harder
      const gr = (S.buff.tower ? 370 : 300) + (m.vet ? 40 : 0);
      let t = nearestEnemy(m.x, gr);
      if (!t && !S.night) {
        let bd = 240;
        for (const r of S.rabbits) {
          const d = Math.abs(r.x - m.x);
          if (!r.dead && d < bd) {
            bd = d;
            t = r;
          }
        }
      }
      if (t) {
        m.dir = Math.sign(t.x - m.x) || 1;
        fire(
          m.x + m.dir * 8,
          GY - 17,
          t,
          m.vet && t.isEnemy ? 2 : 1,
          Math.min(
            0.98,
            (t.isEnemy ? (S.buff.tower ? 0.96 : 0.85) : S.buff.tower ? 0.7 : 0.55) + (m.vet ? 0.08 : 0)
          )
        );
        m.shotCd = (t.isEnemy ? 1 : 1.5) * (m.vet ? 0.75 : 1);
        m.aimT = 0.3;
      }
    }
  } else if (m.role === 'builder') {
    if (S.night) {
      m.task = null;
      wander(m, C, 90, dt);
    } else {
      const valid = sp =>
        sp &&
        (sp.paid ||
          (((sp.type === 'wall' && sp.level > 0) || (sp.type === 'launch' && sp.level === 2)) &&
            sp.hp < sp.maxHp));
      // marked trees are jobs too: whichever is nearest
      const tree = o => o && o.st === 1;
      if (!(m.task && (m.task.type ? valid(m.task) : tree(m.task)))) {
        m.task = null;
        let bd = 1e9;
        for (const sp of S.spots)
          if (valid(sp)) {
            const d = Math.abs(sp.x - m.x);
            if (d < bd) {
              bd = d;
              m.task = sp;
            }
          }
        for (const tw of S.trees)
          if (tree(tw)) {
            const d = Math.abs(tw.x - m.x);
            if (d < bd) {
              bd = d;
              m.task = tw;
            }
          }
      }
      const sp = m.task,
        pace = m.vet ? 1.75 : 1;
      if (sp && !sp.type) {
        // chopping: stand beside the trunk on the base side
        m.tx = sp.x + (sp.x < C ? 1 : -1) * (10 + m.off * 0.2);
        if (Math.abs(m.x - m.tx) < 6) {
          m.working = true;
          m.dir = Math.sign(sp.x - m.x) || 1;
          sp.chop += (dt / 4) * pace;
          if (Math.random() < dt * 5) puff(sp.x + rnd(-6, 6), GY - rnd(6, 20), 0xc8a46a, 1);
          if (sp.chop >= 1) fell(sp);
        }
      } else if (sp) {
        m.tx = sp.x + (m.off - 20) * 0.4;
        if (Math.abs(m.x - m.tx) < 6) {
          m.working = true;
          if (sp.paid) {
            sp.progress += (dt / DEFS[sp.type].time[sp.level + 1]) * pace;
            if (sp.progress >= 1) completeSpot(sp);
          } else sp.hp = Math.min(sp.maxHp, sp.hp + (S.buff.hermit ? 6 : 3) * dt * pace);
          if (Math.random() < dt * 6) puff(sp.x + rnd(-12, 12), GY - rnd(10, 40), 0xb5a988, 1);
        }
      } else wander(m, C, 200, dt);
    }
  } else if (m.role === 'farmer') {
    if (!m.farm || m.farm.level < 1) {
      m.farm = null;
      let bc = 2;
      for (const sp of S.spots)
        if (sp.type === 'farm' && sp.level > 0) {
          const c = S.people.filter(o => o.farm === sp).length;
          if (c < bc) {
            bc = c;
            m.farm = sp;
          }
        }
    }
    // a quartermaster from the shop works faster and keeps some supply coming in winter
    const rate = (season().farm || (m.vet ? 0.5 : 0)) * (m.vet ? 1.45 : 1);
    if (S.night || !m.farm || !rate) wander(m, C, 100, dt);
    else {
      m.tx = m.farm.x + (m.off - 20) * 1.1;
      if (Math.abs(m.x - m.tx) < 4) {
        m.working = true;
        m.work += dt;
        if (m.work >= 8 / rate) {
          m.work = 0;
          dropCoin(m.farm.x + rnd(-20, 20), GY - 34);
        }
      }
    }
  }
  const dx = m.tx - m.x;
  if (Math.abs(dx) > 1.5) {
    const sp = m.speed * (m.role === 'vagrant' ? 0.7 : 1) * (S.night && m.role !== 'vagrant' ? 1.5 : 1);
    m.x += Math.sign(dx) * Math.min(Math.abs(dx), sp * dt);
    if (!m.aimT || m.aimT <= 0) m.dir = Math.sign(dx);
    m.moving = true;
  } else m.moving = false;
  if (m.aimT) m.aimT -= dt;
}
