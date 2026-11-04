/* The current order on the play screen: a small strip at the top with the goal, progress and its crystals. */
import {LANG, tr} from '../i18n/index.js';
import {S} from '../state.js';
import {ORDERS} from '../logic/orders.js';
import {PROF, completeOrder} from '../meta.js';
import {$} from './dom.js';
import {inGame} from './menu.js';

let shown = '';
// called every frame: hidden during the tutorial, the operation of the day and the menus
export function syncOrders() {
  const box = $('order'),
    i = PROF.ord | 0,
    o = ORDERS[i];
  const on = !!o && inGame() && !S.tut && !S.daily && $('menu').hidden && $('end').hidden;
  if (!on) {
    if (!box.hidden) box.hidden = true;
    shown = '';
    return;
  }
  const have = Math.max(0, Math.min(o.need, o.have()));
  if (have >= o.need) {
    completeOrder(o);
    return;
  }
  const key = i + '|' + have + '|' + LANG;
  if (key === shown && !box.hidden) return;
  shown = key;
  box.hidden = false;
  $('ordK').textContent = tr('ord_label', i + 1, ORDERS.length);
  $('ordT').textContent = tr('ord_' + o.id, o.need, o.arg ? o.arg() : '');
  $('ordP').textContent = o.count ? have + ' / ' + o.need : '';
  $('ordR').textContent = '+' + o.cr;
}
