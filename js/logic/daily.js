/* Operation of the day: everyone gets the same map, enemy and special rule for a calendar day,
   and plays it for a record of nights held. The rule is read through mod() from state.js. */
import {C} from '../config.js';
import {hashStr, rnd} from '../util.js';
import {mkPerson, newState} from '../state.js';
import {pickSide} from './rules.js';
import {today} from '../meta.js';

// each rule has an upside and a catch; the hooks live where the rule acts (search for mod('…'))
export const MODS = ['long', 'blitz', 'rich', 'poor', 'armor', 'swarm', 'vets', 'storm'];

// today's plan: the rule, whose robots come (front I–V) and the seed for the forest
export function dailyPlan(d) {
  d = d || today();
  const h = hashStr('front-line-daily:' + d);
  return {d, m: MODS[h % MODS.length], foe: 1 + ((h >>> 8) % 5), seed: h};
}

// a fresh state for today's operation; it is always front I, only the robots are borrowed
export function newDaily(d) {
  const p = dailyPlan(d),
    s = newState(p.foe, p.seed);
  s.front = 1;
  s.foe = p.foe;
  s.daily = {d: p.d, m: p.m};
  if (p.m === 'rich') s.coins = 30;
  if (p.m === 'poor') s.coins = 5;
  // the starting vehicle's depot is already open, so the commander can swap back and forth
  const veh = p.m === 'armor' ? 'armored' : p.m === 'storm' ? 'tank' : null;
  if (veh) {
    s.player.veh = veh;
    s.wild.find(w => w.type === 'depot' && w.veh === veh).done = true;
  }
  if (p.m === 'vets')
    for (let i = 0; i < 3; i++) {
      const m = mkPerson(C + rnd(-90, 90), 'guard', C);
      m.vet = true;
      m.side = pickSide(s, m);
      s.people.push(m);
    }
  return s;
}
