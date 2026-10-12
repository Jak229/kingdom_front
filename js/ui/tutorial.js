/* Tutorial panel above the game. */
import {W} from '../config.js';
import {LANG, tr} from '../i18n/index.js';
import {S} from '../state.js';
import {TUT, tutEnd} from '../logic/tutorial.js';
import {AU} from '../audio.js';
import {$} from './dom.js';
import {TOUCH, buzz} from './touch.js';
import {inGame} from './menu.js';

// tutorial panel: rebuilt when the step, language or input changes; its bottom edge (in game units) pushes toasts down
export let TUT_BOTTOM = 0,
  tutKey = '';
function fillTut(el, k) {
  const m = TOUCH ? {move: '◀ ▶', fast: '»', pay: '★'} : {move: '← →', fast: 'Shift', pay: '↓'};
  el.textContent = '';
  tr(k)
    .split(/\[(move|fast|pay)\]/)
    .forEach((x, i) => {
      if (i % 2) {
        const kb = document.createElement('kbd');
        kb.textContent = m[x];
        el.appendChild(kb);
      } else if (x) el.appendChild(document.createTextNode(x));
    });
}
export function layoutTut() {
  const el = $('tut'),
    cv = document.querySelector('#game canvas');
  if (!cv || el.hidden) {
    TUT_BOTTOM = 0;
    return;
  }
  const r = cv.getBoundingClientRect(),
    k = r.width / W;
  el.style.left = Math.round(r.left + r.width / 2) + 'px';
  el.style.top = Math.round(r.top + 36 * k) + 'px';
  el.style.width = Math.round(Math.min(500, r.width - 2 * Math.max(110 * k, 64))) + 'px';
  TUT_BOTTOM = (el.getBoundingClientRect().bottom - r.top) / k;
}
export function syncTut() {
  const el = $('tut'),
    t = S && S.tut,
    st = t && TUT[t.i];
  const vis = !!(st && inGame() && $('menu').hidden && $('end').hidden && (!st.show || st.show()));
  if (!vis) {
    if (!el.hidden) {
      el.hidden = true;
      TUT_BOTTOM = 0;
    }
    return;
  }
  const key = t.i + '|' + LANG + '|' + TOUCH;
  let fresh = el.hidden;
  el.hidden = false;
  if (key !== tutKey) {
    const prev = tutKey ? +tutKey.split('|')[0] : -1;
    tutKey = key;
    fresh = true;
    if (prev >= 0 && prev < t.i && AU.ctx) {
      AU.fx.ui.call(AU);
      buzz(15);
    }
    fillTut($('tutText'), 'tut' + t.i);
    const nx = $('tutNext');
    nx.hidden = !st.info;
    nx.textContent = tr(st.last ? 'tut_done' : 'tut_next');
    $('tutSkip').hidden = !!st.last;
    [...$('tutDots').children].forEach((e, i) => {
      e.className = i < t.i ? 'on' : i === t.i ? 'cur' : '';
    });
  }
  if (fresh) layoutTut();
}

export function initTutorialPanel() {
  (function () {
    const d = $('tutDots');
    for (let i = 0; i < TUT.length; i++) d.appendChild(document.createElement('i'));
  })();
  $('tutSkip').addEventListener('click', e => {
    e.currentTarget.blur();
    if (S && S.tut) tutEnd(true);
  });
  $('tutNext').addEventListener('click', e => {
    e.currentTarget.blur();
    const t = S && S.tut;
    if (!t) return;
    if (TUT[t.i].last) tutEnd(false);
    else {
      t.i++;
      t.t = 0;
    }
  });
}
