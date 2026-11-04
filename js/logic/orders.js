/* Orders after the tutorial: one goal at a time, so a new commander always knows what to do next.
   Progress is kept in the profile (an order done once stays done); each one pays crystals. */
import {C, DEFS} from '../config.js';
import {S} from '../state.js';

const guards = () => S.people.filter(m => m.role === 'guard').length;
const built = t => S.spots.some(sp => sp.type === t && sp.level > 0);
const flank = sd => S.spots.some(sp => sp.type === 'wall' && sp.level > 0 && Math.sign(sp.x - C) === sd);

// have(): progress now; need: the target; arg(): what the text names
export const ORDERS = [
  {id: 'hq', cr: 5, need: 2, have: () => S.hq.level, arg: () => DEFS.hq.name[2]},
  {id: 'guards', cr: 5, need: 3, have: guards, count: true},
  {id: 'walls', cr: 5, need: 2, have: () => (flank(-1) ? 1 : 0) + (flank(1) ? 1 : 0)},
  {id: 'build', cr: 5, need: 1, have: () => (built('farm') ? 1 : 0), arg: () => DEFS.farm.name[1]},
  {id: 'night', cr: 8, need: 3, have: () => S.day - 1, count: true},
  {id: 'build', cr: 8, need: 1, have: () => (built('turret') ? 1 : 0), arg: () => DEFS.turret.name[1]},
  {id: 'veh', cr: 8, need: 1, have: () => (S.player.veh !== 'jeep' ? 1 : 0)},
  {id: 'hq', cr: 10, need: 3, have: () => S.hq.level, arg: () => DEFS.hq.name[3]},
  {id: 'guards', cr: 10, need: 6, have: guards, count: true},
  {id: 'night', cr: 15, need: 7, have: () => S.day - 1, count: true}
];
