/* Main and pause menu, language buttons, starting or continuing an operation. */
import {VERSION, W, WORLD} from '../config.js';
import {LANGS} from '../i18n/strings.js';
import {SET, saveSettings} from '../settings.js';
import {LANG, setLang, tr} from '../i18n/index.js';
import {clamp, roman} from '../util.js';
import {S, newState, setS} from '../state.js';
import {toast} from '../logic/rules.js';
import {clearSave, loadGame, readSave} from '../save.js';
import {fillEnd, initEnd} from './end.js';
import {AU} from '../audio.js';
import {CG} from '../crazygames.js';
import {$} from './dom.js';
import {layoutCorner} from './touch.js';
import {syncToggles} from './settings.js';
import {deployReserve, metaLabel, renderMeta} from './meta.js';

// menu: the same card is the title screen and the pause screen
export const inGame = () => !!(S && S.running && !S.over && !S.won);
function saveLabel(s) {
  return s.front > 1
    ? tr('saveFrontDay', roman(s.front), roman(s.day), s.front, s.day)
    : tr('saveDay', roman(s.day), s.day);
}
let confirmT = -1e9,
  panel = 'pMain';
function refreshMenu() {
  const ig = inGame(),
    sv = ig ? null : readSave(),
    st = $('start'),
    c = $('cont');
  $('resume').hidden = !ig;
  c.hidden = !sv;
  if (sv) c.textContent = tr('m_contSave', saveLabel(sv));
  const pending = ig && performance.now() - confirmT < 6000;
  st.textContent = pending
    ? tr('m_confirmNew')
    : tr(ig || sv || (S && (S.over || S.won)) ? 'm_new' : 'm_start');
  st.classList.toggle('alt', !!(ig || sv) && !pending);
  st.classList.toggle('warn', pending);
  $('menuStamp').textContent = ig ? tr('m_paused') + ' · ' + saveLabel(S) : tr('stamp');
}
function showPanel(id) {
  panel = id;
  for (const p of ['pMain', 'pHelp', 'pSet', 'pAbout', 'pMeta']) $(p).hidden = p !== id;
  $('menu').firstElementChild.scrollTop = 0;
}
export function syncCorner() {
  const play = $('menu').hidden && $('end').hidden;
  $('mbtn').hidden = !play;
  $('touch').hidden = !play;
  layoutCorner();
}
export function openMenu() {
  if (!$('end').hidden) return;
  if (inGame()) S.paused = true;
  confirmT = -1e9;
  refreshMenu();
  showPanel('pMain');
  $('menu').hidden = false;
  syncCorner();
}
function closeMenu() {
  $('menu').hidden = true;
  if (S) S.paused = false;
  syncCorner();
}

// languages
const langBox = $('langs');
export function applyLang() {
  document.documentElement.lang = LANG;
  document.title = tr('docTitle');
  document.querySelectorAll('[data-i]').forEach(e => {
    e.textContent = tr(e.dataset.i);
  });
  document.querySelectorAll('[data-ia]').forEach(e => e.setAttribute('aria-label', tr(e.dataset.ia)));
  for (const b of langBox.children) {
    const on = b.dataset.l === LANG;
    b.classList.toggle('sel', on);
    b.setAttribute('aria-pressed', String(on));
  }
  $('ver').textContent = tr('a_ver', VERSION);
  metaLabel();
  if (!$('pMeta').hidden) renderMeta();
  syncToggles();
  refreshMenu();
  if (S) {
    S.toast = null;
    if (!$('end').hidden) fillEnd();
  }
}

function begin(sv, next) {
  $('menu').hidden = true;
  $('end').hidden = true;
  syncCorner();
  if (!S) return;
  AU.init();
  if (next) setS(next);
  else if (sv) setS(loadGame(sv));
  else if (S.over || S.won) setS(newState());
  S.running = true;
  S.paused = false;
  deployReserve();
  const sc = window.__kg && window.__kg.scene;
  if (sc) {
    sc.showBanner(S.day);
    sc.camX = clamp(S.player.x - W / 2, 0, WORLD - W);
  }
  S.tut =
    !next && !sv && S.front === 1 && S.day === 1 && SET.tut !== false ? {i: 0, t: 0, x0: S.player.x} : null;
  if (!S.tut) toast(next ? tr('beginNext', roman(S.front), S.front) : sv ? tr('beginCont') : tr('beginNew'));
}

export function initMenu() {
  $('mbtn').addEventListener('click', e => {
    e.currentTarget.blur();
    openMenu();
  });
  $('resume').addEventListener('click', closeMenu);
  $('bHelp').addEventListener('click', () => showPanel('pHelp'));
  $('bSet').addEventListener('click', () => showPanel('pSet'));
  $('bAbout').addEventListener('click', () => showPanel('pAbout'));
  $('bMeta').addEventListener('click', () => {
    showPanel('pMeta');
    renderMeta();
  });
  document
    .querySelectorAll('[data-back]')
    .forEach(b => b.addEventListener('click', () => showPanel('pMain')));
  window.addEventListener('keydown', e => {
    if ((e.key !== 'Escape' && e.code !== 'KeyP') || e.repeat || !$('end').hidden) return;
    if (!$('menu').hidden) {
      if (panel !== 'pMain') showPanel('pMain');
      else if (inGame()) closeMenu();
    } else if (inGame()) openMenu();
  });
  for (const [code, name] of LANGS) {
    const b = document.createElement('button');
    b.textContent = name;
    b.lang = code;
    b.dataset.l = code;
    b.addEventListener('click', () => {
      setLang(code);
      SET.lang = code;
      saveSettings();
      applyLang();
    });
    langBox.appendChild(b);
  }
  // during a running operation "New operation" asks for a second click
  $('start').addEventListener('click', () => {
    if (inGame()) {
      if (performance.now() - confirmT > 6000) {
        confirmT = performance.now();
        refreshMenu();
        setTimeout(refreshMenu, 6100);
        return;
      }
      setS(newState());
    }
    confirmT = -1e9;
    begin();
  });
  $('cont').addEventListener('click', () => {
    const cur = readSave();
    if (cur) begin(cur);
    else begin();
  });
  // between operations is the natural break for a CrazyGames midgame ad (no-op elsewhere)
  $('restart').addEventListener('click', async () => {
    await CG.midgame();
    clearSave();
    setS(newState());
    begin();
  });
  $('nextFront').addEventListener('click', async () => {
    const nx = S.nextFront;
    if (!nx) return;
    await CG.midgame();
    begin(null, nx);
  });
  initEnd();
  $('toMenu').addEventListener('click', () => {
    $('end').hidden = true;
    openMenu();
  });
}
