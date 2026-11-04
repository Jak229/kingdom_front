/* Operation of the day in the menu: the button on the title screen and its panel (rule, robots, goals, record). */
import {tr} from '../i18n/index.js';
import {roman} from '../util.js';
import {S, setS} from '../state.js';
import {dailyPlan, newDaily} from '../logic/daily.js';
import {DAILY_GOALS, PROF, dailyRec, msToNewTasks} from '../meta.js';
import {clearSave, readSave} from '../save.js';
import {$} from './dom.js';
import {begin, closeMenu, inGame} from './menu.js';

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

// title-screen button: the rule of the day, and a dot until today's first goal is reached
export function dailyLabel() {
  const p = dailyPlan(),
    r = dailyRec(),
    b = $('bDaily');
  b.textContent = '';
  b.append(el('span', '', tr('m_daily')), el('small', '', tr('mod_' + p.m)));
  b.classList.toggle('fresh', r.g === 0);
}

export function renderDaily() {
  const p = dailyPlan(),
    r = dailyRec(),
    sv = readSave(true, p.d),
    box = $('dailyBody');
  box.textContent = '';
  box.appendChild(el('div', 'lbl', tr('m_daily')));
  box.appendChild(el('p', 'note', tr('d_note')));
  const rule = el('div', 'rule');
  rule.append(
    el('small', '', tr('d_rule')),
    el('b', '', tr('mod_' + p.m)),
    el('small', '', tr('modd_' + p.m))
  );
  box.appendChild(rule);
  box.appendChild(el('p', 'note', p.foe === 1 ? tr('d_foe1') : tr('d_foeN', roman(p.foe), p.foe)));
  box.appendChild(el('div', 'lbl', tr('d_goals')));
  const g = el('div', 'goals');
  DAILY_GOALS.forEach(([n, cr], i) => {
    const done = r.g > i,
      it = el('div', 'item' + (done ? ' done' : '')),
      h = el('div', 'ih');
    h.appendChild(el('b', '', tr('d_goalT', n)));
    if (done) h.appendChild(el('span', 'ok', '✓'));
    else h.appendChild(el('span', 'cr', '+' + cr));
    it.appendChild(h);
    g.appendChild(it);
  });
  box.appendChild(g);
  box.appendChild(el('p', 'note', r.runs || r.best ? tr('d_best', r.best, r.kills) : tr('d_bestNone')));
  if (PROF.dbest) box.appendChild(el('p', 'note', tr('d_bestAll', PROF.dbest)));
  // opened from the play screen during a campaign: that operation waits at its last dawn
  const ig = inGame(),
    here = ig && !!S.daily;
  if (ig && !here) box.appendChild(el('p', 'note', tr('d_inGame')));
  const ms = msToNewTasks();
  box.appendChild(el('p', 'note', tr('d_newIn', Math.floor(ms / 3.6e6), Math.floor((ms % 3.6e6) / 6e4))));
  // play buttons sit in the panel's bottom bar, next to Back, so they stay in view on a phone
  const bt = $('dailyBtns');
  bt.textContent = '';
  if (here) {
    const c = el('button', 'go', tr('m_resume'));
    c.onclick = closeMenu;
    bt.appendChild(c);
  } else if (sv) {
    const c = el('button', 'go', tr('d_cont', roman(sv.day), sv.day));
    c.onclick = () => begin(sv);
    bt.appendChild(c);
  }
  const go = el(
    'button',
    'go' + (sv || here ? ' alt' : ''),
    tr(sv || here ? 'd_restart' : r.runs ? 'd_again' : 'd_play')
  );
  go.onclick = () => {
    clearSave(true);
    begin(null, newDaily());
  };
  bt.appendChild(go);
}

// after a lost or finished operation of the day: the same day again
export function againDaily() {
  clearSave(true);
  setS(newDaily());
}
