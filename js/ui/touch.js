/* Touch screens: drive pad, throttle, hold-to-pay, corner buttons, full screen and the rotate card. */
import {W} from '../config.js';
import {SET} from '../settings.js';
import {tr} from '../i18n/index.js';
import {S} from '../state.js';
import {$} from './dom.js';
import {layoutTut} from './tutorial.js';
import {inGame, openMenu} from './menu.js';

/* touch screens: a drive pad you can slide across, throttle (or double-tap an arrow), hold-to-pay, compact corner buttons */
export const touch = {left: false, right: false, pay: false, fast: false, dash: false};
export let TOUCH = false;
export function setTouchMode(on) {
  TOUCH = on;
  document.documentElement.classList.toggle('touch', on);
  $('rVibro').hidden = !(on && navigator.vibrate);
  layoutCorner();
  syncRotate();
}
export function buzz(ms) {
  if (TOUCH && SET.vibro !== false && navigator.vibrate)
    try {
      navigator.vibrate(ms);
    } catch (_) {}
}
// the round corner buttons sit in the side bar when the screen is wider than the game, else under the token counter
export function layoutCorner() {
  const c = $('corner'),
    cv = document.querySelector('#game canvas');
  if (!TOUCH || !cv) {
    c.style.top = c.style.left = '';
    return;
  }
  const r = cv.getBoundingClientRect(),
    k = r.width / W;
  if (r.left >= 56) {
    c.style.left = Math.round((r.left - 44) / 2) + 'px';
    c.style.top = Math.round(r.top + 10) + 'px';
  } else {
    c.style.left = Math.round(r.left + 10) + 'px';
    c.style.top = Math.round(r.top + 58 * k) + 'px';
  }
}
// inside a game portal's iframe the portal owns full screen, so the game never switches to it by itself there
const EMBED = (() => {
  try {
    return window.top !== window.self;
  } catch (_) {
    return true;
  }
})();
// full screen (Android and desktop browsers; not available on iPhone) with the landscape lock where the browser allows it
const fsOK = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
const fsOn = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
function goFull() {
  if (!fsOK || fsOn()) return;
  const el = document.documentElement,
    f = el.requestFullscreen || el.webkitRequestFullscreen;
  try {
    const r = f.call(el, {navigationUI: 'hide'});
    const lock = () => {
      if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
    };
    if (r && r.then) r.then(lock, () => {});
    else lock();
  } catch (_) {}
}
function leaveFull() {
  if (!fsOn()) return;
  try {
    (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  } catch (_) {}
}
function syncFs() {
  const b = $('fsbtn'),
    on = fsOn();
  b.classList.toggle('on', on);
  b.dataset.ia = on ? 'fsOff' : 'fsOn';
  b.setAttribute('aria-label', tr(b.dataset.ia));
  setTimeout(layoutCorner, 250);
}
// upright phone: ask to turn it (the game pauses behind the card); it can be dismissed for the session
const portrait = matchMedia('(orientation: portrait)');
let rotSkip = false;
function syncRotate() {
  const show = TOUCH && portrait.matches && !rotSkip;
  $('rotate').hidden = !show;
  if (show && typeof inGame === 'function' && inGame() && !S.paused) openMenu();
}

export function initTouch() {
  (function () {
    const pad = $('pad'),
      L = $('tl'),
      R = $('tr'),
      T = $('touch');
    let pid = null,
      lastT = 0,
      lastD = 0;
    const set = d => {
      touch.left = d < 0;
      touch.right = d > 0;
      L.classList.toggle('on', d < 0);
      R.classList.toggle('on', d > 0);
    };
    const dirAt = x => {
      const b = pad.getBoundingClientRect();
      return x < b.left + b.width / 2 ? -1 : 1;
    };
    pad.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (pid !== null) return;
      pid = e.pointerId;
      try {
        pad.setPointerCapture(pid);
      } catch (_) {}
      const d = dirAt(e.clientX),
        now = performance.now();
      touch.dash = d === lastD && now - lastT < 350;
      T.classList.toggle('dash', touch.dash);
      lastT = now;
      lastD = d;
      set(d);
      buzz(8);
    });
    pad.addEventListener('pointermove', e => {
      if (e.pointerId !== pid) return;
      const d = dirAt(e.clientX);
      if (d < 0 !== touch.left) {
        set(d);
        touch.dash = false;
        T.classList.remove('dash');
      }
    });
    const up = e => {
      if (e.pointerId !== pid) return;
      pid = null;
      set(0);
      touch.dash = false;
      T.classList.remove('dash');
    };
    pad.addEventListener('pointerup', up);
    pad.addEventListener('pointercancel', up);
    for (const [id, key] of [
      ['tp', 'pay'],
      ['tf', 'fast']
    ]) {
      const el = $(id);
      let p = null;
      el.addEventListener('pointerdown', e => {
        e.preventDefault();
        p = e.pointerId;
        try {
          el.setPointerCapture(p);
        } catch (_) {}
        touch[key] = true;
        el.classList.add('on');
        buzz(8);
      });
      const off = e => {
        if (e.pointerId !== p) return;
        p = null;
        touch[key] = false;
        el.classList.remove('on');
      };
      el.addEventListener('pointerup', off);
      el.addEventListener('pointercancel', off);
    }
  })();
  // no browser menu on right click or long press anywhere in the game
  document.addEventListener('contextmenu', e => e.preventDefault());
  // in an iframe keys only reach the game while it has focus: take it back on every click or tap
  window.addEventListener('pointerdown', () => window.focus(), true);
  // focus moved away (another tab, the portal page around the iframe): let go of every held button
  window.addEventListener('blur', () => {
    for (const k in touch) touch[k] = false;
    document.querySelectorAll('#touch .on').forEach(el => el.classList.remove('on'));
  });
  // a coarse pointer, or the first finger on the screen, switches the touch layout on
  window.addEventListener(
    'pointerdown',
    e => {
      if (e.pointerType === 'touch' && !TOUCH) setTouchMode(true);
    },
    true
  );
  window.addEventListener('resize', () => {
    for (const ms of [80, 400])
      setTimeout(() => {
        layoutCorner();
        layoutTut();
      }, ms);
  });
  $('fsbtn').hidden = !fsOK;
  $('fsbtn').addEventListener('click', e => {
    e.currentTarget.blur();
    fsOn() ? leaveFull() : goFull();
  });
  document.addEventListener('fullscreenchange', syncFs);
  document.addEventListener('webkitfullscreenchange', syncFs);
  for (const id of ['start', 'cont', 'resume'])
    $(id).addEventListener('click', () => {
      if (TOUCH && !EMBED) goFull();
    });
  window.addEventListener('keydown', e => {
    if (e.code === 'KeyF' && !e.repeat && !e.ctrlKey && !e.metaKey) {
      fsOn() ? leaveFull() : goFull();
    }
  });
  if (portrait.addEventListener) portrait.addEventListener('change', syncRotate);
  else portrait.addListener(syncRotate);
  $('rotGo').addEventListener('click', () => {
    rotSkip = true;
    syncRotate();
  });
}
