/* Rewards and shop panel in the menu (today's tasks, achievements, skins, specialists) and the award pop-up during play. */
import {C, GY, W} from '../config.js';
import {tr} from '../i18n/index.js';
import {S, mkPerson} from '../state.js';
import {pickSide, puff, sfx, toast} from '../logic/rules.js';
import {
  ACH,
  AWARDS,
  PROF,
  SKINS,
  STREAK,
  UNITS,
  achProgress,
  addReserve,
  buySkin,
  dailyTasks,
  msToNewTasks,
  onChange,
  spend,
  wearSkin
} from '../meta.js';
import {skinPreview} from '../render/skins.js';
import {AU} from '../audio.js';
import {$} from './dom.js';
import {inGame} from './menu.js';

let tab = 'tasks';

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function bar(k) {
  const b = el('div', 'bar'),
    i = el('i');
  i.style.width = Math.round(k * 100) + '%';
  b.appendChild(i);
  return b;
}
const crys = n => el('span', 'cr', String(n));

// a specialist steps out of HQ already equipped
export function deployUnit(id) {
  const u = UNITS.find(x => x.id === id);
  const m = mkPerson(C + (Math.random() < 0.5 ? -1 : 1) * (20 + Math.random() * 40), u.role, C);
  m.vet = true;
  if (u.role === 'guard') m.side = pickSide(S, m);
  S.people.push(m);
  puff(m.x, GY - 20, 0xe8c24a, 12);
  sfx('recruit', m.x);
}
// specialists bought from the title screen join when an operation starts
export function deployReserve() {
  const got = [];
  for (const u of UNITS) {
    const n = PROF.reserve[u.id] || 0;
    for (let i = 0; i < n; i++) deployUnit(u.id);
    if (n) got.push(tr('u_' + u.id) + (n > 1 ? ' ×' + n : ''));
    if (n) addReserve(u.id, -n);
  }
  if (got.length) S.later.push({t: 3.5, text: tr('u_arrived', got.join(', '))});
}

function fillTasks(box) {
  box.appendChild(el('p', 'note', tr('t_tasksNote')));
  for (const t of dailyTasks()) {
    const r = el('div', 'item' + (t.done ? ' done' : ''));
    const h = el('div', 'ih');
    h.appendChild(el('b', '', tr('task_' + t.k, t.n)));
    h.appendChild(t.done ? el('span', 'ok', '✓') : crys('+' + t.cr));
    r.appendChild(h);
    r.appendChild(bar(t.p / t.n));
    r.appendChild(el('small', '', t.p + ' / ' + t.n));
    box.appendChild(r);
  }
  const ms = msToNewTasks();
  box.appendChild(el('p', 'note', tr('t_newIn', Math.floor(ms / 3.6e6), Math.floor((ms % 3.6e6) / 6e4))));
}
function fillAch(box) {
  const got = ACH.filter(a => PROF.ach[a.id]).length;
  box.appendChild(el('p', 'note', tr('t_achGot', got, ACH.length)));
  const g = el('div', 'grid');
  for (const a of ACH) {
    const done = !!PROF.ach[a.id],
      r = el('div', 'item' + (done ? ' done' : ''));
    const h = el('div', 'ih');
    h.appendChild(el('b', '', tr('ach_' + a.id)));
    h.appendChild(done ? el('span', 'ok', '✓') : crys('+' + a.cr));
    r.appendChild(h);
    r.appendChild(el('small', '', tr('achd_' + a.id)));
    if (!done && a.stat) {
      r.appendChild(bar(achProgress(a)));
      r.appendChild(el('small', '', Math.min(a.need, PROF.st[a.stat] || 0) + ' / ' + a.need));
    }
    g.appendChild(r);
  }
  box.appendChild(g);
}
function fillShop(box) {
  const sc = window.__kg && window.__kg.scene;
  box.appendChild(el('div', 'lbl', tr('t_skins')));
  const g = el('div', 'grid skins');
  for (const s of SKINS) {
    const own = !!PROF.own[s.id],
      on = PROF.skin === s.id,
      r = el('div', 'item skin' + (on ? ' sel' : ''));
    if (sc) {
      const im = el('img');
      im.src = skinPreview(sc, s.id);
      im.alt = '';
      r.appendChild(im);
    }
    r.appendChild(el('b', '', tr('skin_' + s.id)));
    const b = el('button', 'buy');
    if (on) {
      b.textContent = tr('t_worn');
      b.disabled = true;
    } else if (own) {
      b.textContent = tr('t_wear');
      b.onclick = () => {
        wearSkin(s.id);
        AU.fx.ui.call(AU);
        renderMeta();
      };
    } else {
      b.appendChild(crys(s.cost));
      b.disabled = PROF.cr < s.cost;
      b.onclick = () => {
        if (buySkin(s.id)) AU.fx.award.call(AU);
        renderMeta();
      };
    }
    r.appendChild(b);
    g.appendChild(r);
  }
  box.appendChild(g);
  box.appendChild(el('div', 'lbl', tr('t_units')));
  box.appendChild(el('p', 'note', tr(inGame() ? 't_unitsNow' : 't_unitsLater')));
  const u = el('div', 'grid');
  for (const x of UNITS) {
    const r = el('div', 'item');
    const h = el('div', 'ih');
    h.appendChild(el('b', '', tr('u_' + x.id)));
    const n = PROF.reserve[x.id] || 0;
    if (n) h.appendChild(el('span', 'ok', tr('t_reserve', n)));
    r.appendChild(h);
    r.appendChild(el('small', '', tr('ud_' + x.id)));
    const b = el('button', 'buy');
    b.appendChild(crys(x.cost));
    b.disabled = PROF.cr < x.cost;
    b.onclick = () => {
      if (!spend(x.cost)) return;
      AU.fx.ui.call(AU);
      if (inGame()) {
        deployUnit(x.id);
        toast(tr('u_arrived', tr('u_' + x.id)));
      } else addReserve(x.id, 1);
      renderMeta();
    };
    r.appendChild(b);
    u.appendChild(r);
  }
  box.appendChild(u);
}

export function renderMeta() {
  $('crBal').textContent = '';
  $('crBal').append(tr('t_balance') + ' ', crys(PROF.cr));
  for (const b of $('metaTabs').children) b.classList.toggle('sel', b.dataset.tab === tab);
  const box = $('metaBody');
  box.textContent = '';
  if (tab === 'tasks') fillTasks(box);
  else if (tab === 'ach') fillAch(box);
  else fillShop(box);
}
// login reward strip on the title screen: the days of the run, today's lit up
export function renderStreak() {
  const box = $('streak'),
    st = PROF.streak || {n: 0};
  box.textContent = '';
  box.appendChild(el('div', 'lbl', tr('st_title', st.n, STREAK.length)));
  const row = el('div', 'days');
  STREAK.forEach((cr, i) => {
    const d = el('div', 'sd' + (i < st.n - 1 ? ' got' : i === st.n - 1 ? ' now' : ''));
    d.appendChild(el('small', '', String(i + 1)));
    d.appendChild(i < st.n - 1 ? el('span', 'ok', '✓') : crys(cr));
    row.appendChild(d);
  });
  box.appendChild(row);
}
export function metaLabel() {
  const b = $('bMeta');
  b.textContent = tr('m_meta') + ' ';
  b.appendChild(crys(PROF.cr));
}

// award pop-up: one at a time, under the day counter
let cur = null;
export function syncAwards() {
  const box = $('award');
  if (cur && performance.now() < cur.until) return;
  if (!AWARDS.length) {
    if (cur) {
      box.hidden = true;
      cur = null;
    }
    return;
  }
  const a = AWARDS.shift();
  cur = {until: performance.now() + 3600};
  const K = {ach: 'aw_ach', daily: 'm_daily', login: 'aw_login'};
  $('awK').textContent = tr(K[a.kind] || 'aw_task');
  $('awT').textContent =
    a.kind === 'ach'
      ? tr('ach_' + a.id)
      : a.kind === 'daily'
        ? tr('d_goal', a.n)
        : a.kind === 'login'
          ? tr('st_day', a.n, STREAK.length)
          : tr('task_' + a.id, a.n);
  $('awR').textContent = '';
  $('awR').appendChild(crys('+' + a.cr));
  box.hidden = false;
  // right under the day counter, in canvas units
  const cv = document.querySelector('#game canvas');
  if (cv) {
    const r = cv.getBoundingClientRect(),
      k = r.width / W;
    box.style.right = Math.round(window.innerWidth - r.right + 14 * k) + 'px';
    box.style.top = Math.round(r.top + 40 * k) + 'px';
  }
  box.classList.remove('pop');
  void box.offsetWidth;
  box.classList.add('pop');
  if (AU.ctx) AU.fx.award.call(AU);
}

export function initMeta() {
  for (const b of $('metaTabs').children)
    b.addEventListener('click', () => {
      tab = b.dataset.tab;
      renderMeta();
    });
  onChange(() => {
    metaLabel();
    if (!$('pMeta').hidden) renderMeta();
  });
  metaLabel();
}
