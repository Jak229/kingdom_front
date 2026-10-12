/* Core rules: upgrades, toasts, sound requests, the rocket, flanks, what the commander stands at, paying and firing. */
import {C, DEFS, GY, SHOPS, VEH, WILD, dayLen} from '../config.js';
import {tokN, tr} from '../i18n/index.js';
import {rnd} from '../util.js';
import {S, input} from '../state.js';
import {bombBoom, dropCargo, hitE} from './enemies.js';
import {assaultTarget, swapVehicle, unlockWild} from './support.js';
import {SP} from '../sprites/core.js';

/* ---------- rules ---------- */
export function reqFor(sp, lvl) {
  const r = DEFS[sp.type].req;
  return Math.max(r[lvl] || 0, sp.minHq);
}
export function canUpgrade(sp) {
  const d = DEFS[sp.type];
  return sp.level < d.max && !sp.paid && S.hq.level >= reqFor(sp, sp.level + 1);
}
export function toast(text, warn) {
  S.toast = {text, t: 3.2, warn: !!warn};
}

// sound requests: the rules only say what happened and where, the audio side decides how it sounds
export function sfx(k, x, a) {
  const q = S.sfx || (S.sfx = []);
  if (q.length < 48) q.push({k, x, a});
}
// the rocket stands on the pad outside the walls and is fuelled for a few nights; robots go for it
export function fuelNeed() {
  return (S.front || 1) > 1 ? 3 : 2;
}
export function rocketX() {
  return S.launch.x - 23.5 * SP;
}
export function rocketUp() {
  const l = S.launch;
  return l.level === 2 && l.hp > 0;
}
function rocketHp() {
  return Math.round(DEFS.launch.hp * (1 + 0.25 * ((S.front || 1) - 1)) * (S.buff.hermit ? 1.5 : 1));
}
export function hasRadar() {
  return S.wild.some(w => w.type === 'radar' && w.done);
}
export function rocketLost() {
  const l = S.launch;
  l.level = 1;
  l.hp = l.maxHp = 0;
  l.fuel = 0;
  l.paid = false;
  l.progress = 0;
  const rx = rocketX();
  S.booms.push({x: rx, life: 0.6});
  for (let i = 0; i < 34; i++) puff(rx + rnd(-20, 20), GY - rnd(10, 130), i % 2 ? 0x3a3540 : 0xff8a3c, 1);
  sfx('radio', null, {v: 'alert', d: 0.8});
  toast(tr('rocketLost'), true);
}
export function puff(x, y, color, n) {
  for (let i = 0; i < (n || 6); i++)
    S.puffs.push({x, y, vx: rnd(-40, 40), vy: rnd(-70, -10), life: rnd(0.4, 0.9), color});
}
export function dropCoin(x, y) {
  if (S.ground.length < 80)
    S.ground.push({x, y: y || GY - 30, vx: rnd(-30, 30), vy: rnd(-120, -60), landed: false});
}
export function outerWall(side) {
  let best = null;
  for (const sp of S.spots)
    if (sp.type === 'wall' && sp.level > 0 && Math.sign(sp.x - C) === side) {
      if (best === null || Math.abs(sp.x - C) > Math.abs(best - C)) best = sp.x;
    }
  return best;
}
// soldiers hold both flanks: a new rifle goes to the thinner flank, and a gap of two sends the nearest man across
export function guardSides(list, skip) {
  let l = 0,
    r = 0;
  for (const m of list)
    if (m !== skip && m.role === 'guard') {
      if (m.side < 0) l++;
      else r++;
    }
  return [l, r];
}
export function pickSide(st, skip) {
  const [l, r] = guardSides(st.people, skip),
    alt = st.hires++ % 2 ? 1 : -1;
  return l < r ? -1 : r < l ? 1 : alt;
}
export function balanceGuards() {
  const [l, r] = guardSides(S.people);
  if (Math.abs(l - r) < 2) return;
  const from = l > r ? -1 : 1;
  let best = null,
    bd = 1e9;
  for (const m of S.people)
    if (m.role === 'guard' && m.side === from) {
      const d = Math.abs(m.x - C) + (m.hurt > 0 ? 1e4 : 0);
      if (d < bd) {
        bd = d;
        best = m;
      }
    }
  best.side = -from;
  best.wait = 0;
  if (!S.night) best.tx = C + best.side * rnd(620, 1500);
}
export function nearestCamp(x) {
  return Math.abs(x - S.camps[0]) < Math.abs(x - S.camps[1]) ? S.camps[0] : S.camps[1];
}

function findTarget() {
  const p = S.player;
  let best = null,
    bd = 1e9;
  for (const v of S.people)
    if (v.role === 'vagrant') {
      const d = Math.abs(v.x - p.x);
      if (d < 30 && d < bd) {
        bd = d;
        best = {kind: 'vagrant', obj: v};
      }
    }
  if (best) return best;
  for (const sp of S.spots) {
    const d = Math.abs(sp.x - p.x);
    const r =
      sp.type === 'hq'
        ? 70
        : sp.type === 'farm' || sp.type === 'launch'
          ? 62
          : sp.type === 'barracks'
            ? 42
            : 36;
    if (d < r && d < bd) {
      bd = d;
      best = {kind: 'spot', obj: sp};
    }
  }
  for (const sh of S.shops) {
    const d = Math.abs(sh.x - p.x);
    if (d < 38 && d < bd) {
      bd = d;
      best = {kind: 'shop', obj: sh};
    }
  }
  for (const w of S.wild) {
    if (w.type === 'cache') continue;
    const d = Math.abs(w.x - p.x);
    if (d < 46 && d < bd) {
      bd = d;
      best = {kind: 'wild', obj: w};
    }
  }
  return best;
}
function targetInfo(t) {
  if (!t) return null;
  if (t.kind === 'vagrant') return {payable: true, cost: 1, text: tr('recruit')};
  if (t.kind === 'wild') {
    const w = t.obj;
    if (w.type === 'depot') {
      const vn = VEH[w.veh].name;
      if (!w.done) return {payable: true, cost: w.cost, text: tr('depotBuy', vn)};
      if (S.player.veh === w.veh)
        return {payable: true, cost: 0, action: 'swap', to: 'jeep', text: tr('swapBack', VEH.jeep.name)};
      return {payable: true, cost: 0, action: 'swap', to: w.veh, text: tr('swapTo', vn)};
    }
    const d = WILD[w.type];
    if (w.done) return {payable: false, text: tr('wildDone', d.name, d.desc)};
    return {payable: true, cost: d.cost, text: tr('wildBuy', d.name, d.desc)};
  }
  if (t.kind === 'shop') {
    const sh = t.obj,
      d = SHOPS[sh.kind];
    if (S.hq.level < sh.minHq)
      return {payable: false, text: tr('shopLocked', d.name, DEFS.hq.name[sh.minHq])};
    if (sh.tools >= 4) return {payable: false, text: tr('shopFull', d.name)};
    return {payable: true, cost: d.cost, text: tr('shopGive', d.name, d.tool)};
  }
  const sp = t.obj,
    d = DEFS[sp.type];
  if (sp.paid) return {payable: false, text: tr('waitSapper', d.name[sp.level + 1])};
  if (sp.type === 'bank' && sp.level > 0) {
    if (S.coins <= 2 && sp.saved > 0) return {payable: false, text: tr('bankGive')};
    return {payable: true, cost: 1, action: 'deposit', text: tr('bankDeposit', tokN(sp.saved || 0))};
  }
  if (sp.type === 'barracks' && sp.level > 0) {
    const q = S.squad;
    if (!q) return {payable: true, cost: 6, action: 'squad', text: tr('squadForm')};
    if (S.night) return {payable: false, text: tr('squadNight')};
    if (q.mode === 'assault') return {payable: false, text: tr('squadAssault')};
    if (q.mode === 'return') return {payable: false, text: tr('squadReturn')};
    const pi = assaultTarget();
    if (pi < 0) return {payable: false, text: tr('portalsDead')};
    if (S.phaseT > dayLen() - 55) return {payable: false, text: tr('tooLate')};
    return {
      payable: true,
      cost: 4,
      action: 'assault',
      text: tr(pi === 0 ? 'assaultL' : 'assaultR', Math.ceil(q.hp), q.maxHp)
    };
  }
  if (sp.type === 'launch' && sp.level === 2) {
    const need = fuelNeed(),
      f = sp.fuel || 0,
      hp = tr('rocketHp', Math.ceil(sp.hp), sp.maxHp);
    if (f < need) return {payable: false, text: tr('rocketFuel', f, need) + hp};
    if (!hasRadar()) return {payable: false, text: tr('rocketNeedRadar') + hp};
    return {payable: true, cost: d.cost[3], text: tr('rocketStrike')};
  }
  if (sp.level >= d.max) return {payable: false, text: d.name[sp.level]};
  const rq = reqFor(sp, sp.level + 1);
  if (sp.type === 'launch' && sp.level === 1 && S.hq.level >= rq)
    return {payable: true, cost: d.cost[2], text: tr('rocketDeliver', fuelNeed())};
  if (S.hq.level < rq) return {payable: false, text: tr('needHq', d.name[sp.level + 1], DEFS.hq.name[rq])};
  return {
    payable: true,
    cost: d.cost[sp.level + 1],
    text: sp.type === 'hq' ? tr('hqUp', d.name[sp.level + 1]) : d.name[sp.level + 1]
  };
}
function refund() {
  if (S.paying && S.paying.pending > 0) {
    S.coins += S.paying.pending;
    S.paying.pending = 0;
  }
  S.paying = null;
}

export function handlePay(dt) {
  const p = S.player;
  p.payCd -= dt;
  if (!input.pay) S.swapLatch = false;
  const t = findTarget();
  S.target = t;
  S.targetInfo = targetInfo(t);
  if (S.paying && (!input.pay || !t || t.obj !== S.paying)) refund();
  if (!input.pay || !t || !S.targetInfo.payable || p.payCd > 0) return;
  if (S.coins <= 0 && S.targetInfo.action !== 'swap') {
    if (!S.toast || S.toast.text !== tr('noTokens')) toast(tr('noTokens'), true);
    return;
  }
  if (S.targetInfo.action === 'swap') {
    if (!S.swapLatch) {
      swapVehicle(t.obj, S.targetInfo.to);
    }
    return;
  }
  p.payCd = 0.22;
  S.coins--;
  if (S.targetInfo.action === 'deposit') {
    t.obj.saved = (t.obj.saved || 0) + 1;
    puff(t.obj.x, GY - 30, 0xd9b44a, 3);
    return;
  }
  if (t.kind === 'vagrant') {
    sfx('recruit', t.obj.x);
    t.obj.role = 'idle';
    t.obj.cd = 0;
    puff(t.obj.x, GY - 20, 0xd9b44a, 8);
    p.payCd = 0.4;
    return;
  }
  const o = t.obj;
  o.pending++;
  S.paying = o;
  if (o.pending >= S.targetInfo.cost) {
    o.pending = 0;
    S.paying = null;
    p.payCd = 0.45;
    if (t.kind === 'shop') {
      o.tools++;
      sfx('equip', o.x);
      puff(o.x, GY - 50, 0xd9b44a, 8);
    } else if (t.kind === 'wild') unlockWild(o);
    else if (S.targetInfo.action === 'squad') {
      S.squad = {x: o.x + 30, hp: 30, maxHp: 30, mode: 'home', cd: 0, anim: 0, dir: 1, side: 1, pick: 0};
      puff(o.x, GY - 20, 0xd9b44a, 12);
      sfx('radio', null, {v: 'order'});
      toast(tr('squadFormed'));
    } else if (S.targetInfo.action === 'assault') {
      S.squad.mode = 'assault';
      S.squad.target = assaultTarget();
      sfx('radio', null, {v: 'order'});
      toast(tr('squadGo'));
    } else {
      o.paid = true;
      o.progress = 0;
      puff(o.x, GY - 40, 0xd9b44a, 10);
      sfx('order', o.x);
      if (!S.people.some(m => m.role === 'builder')) toast(tr('needSapper'));
    }
  }
}

export function completeSpot(sp) {
  sp.level++;
  sp.paid = false;
  sp.progress = 0;
  const d = DEFS[sp.type];
  if (sp.type === 'wall') {
    sp.maxHp = sp.hp = Math.round(d.hp[sp.level] * (S.buff.hermit ? 1.5 : 1));
  }
  puff(sp.x, GY - 40, 0xe8e4c8, 12);
  sfx(sp.type === 'hq' ? 'hqUp' : 'built', sp.x);
  if (sp.type === 'hq') {
    toast(tr('hqOpens', d.name[sp.level], tr('opens' + sp.level)));
  } else if (sp.type === 'launch' && sp.level === 2) {
    sp.fuel = 0;
    sp.maxHp = sp.hp = rocketHp();
    sfx('radio', null, {v: 'rocket'});
    toast(tr('rocketOnPad', fuelNeed()), true);
  } else if (sp.type === 'launch' && sp.level === 3) {
    S.won = true;
    S.winT = 0;
    sfx('rocket', rocketX());
    toast(tr('launchGo'));
  } else toast(tr('built', d.name[sp.level]));
}

export function kill(target) {
  if (target.dead) return;
  target.dead = true;
  if (target.isEnemy) {
    S.kills++;
    sfx(
      target.boss ? 'walkerDie' : target.fly ? 'droneDie' : target.brute ? 'bruteDie' : 'robotDie',
      target.x
    );
    puff(target.x, target.y || GY - 16, 0xff5a3c, 10);
    for (let i = 0; i < target.loot + (target.bounty || 0); i++)
      dropCoin(target.x, target.fly ? target.y : GY - 20);
    if (target.fly) {
      dropCargo(target);
      for (let i = 0; i < 8; i++) puff(target.x + rnd(-12, 12), target.y, i % 2 ? 0x333333 : 0xff8a3c, 1);
    }
    if (target.boss) {
      S.booms.push({x: target.x, life: 0.5});
      for (let i = 0; i < 24; i++)
        puff(target.x + rnd(-30, 30), GY - rnd(10, 70), i % 2 ? 0x3a3540 : 0xff8a3c, 1);
      toast(tr(target.kind ? 'down_' + target.kind : 'walkerDown'));
    }
    if (target.kind === 'bomber') bombBoom(target.x, false, target);
  } else {
    puff(target.x, target.y, 0x55574f, 8);
    dropCoin(target.x, target.y);
    sfx('droneDie', target.x);
  }
}
export function fire(x0, y0, target, dmg, acc, color, snd) {
  sfx(snd || 'rifle', x0);
  const hit = Math.random() < acc * (target.fly ? 0.6 : 1);
  S.tracers.push({
    x1: x0,
    y1: y0,
    x2: target.x + (hit ? 0 : rnd(-14, 14)),
    y2: target.y + (hit ? 0 : rnd(-10, 10)),
    life: 0.12,
    color: color || 0xfff1a6
  });
  if (!hit) return;
  hitE(target, dmg, dmg >= 3);
}
