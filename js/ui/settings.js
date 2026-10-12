/* Settings panel: sound, music, volumes, vibration, tutorial. */
import {SET, saveSettings} from '../settings.js';
import {tr} from '../i18n/index.js';
import {AU} from '../audio.js';
import {$} from './dom.js';
import {buzz} from './touch.js';
import {inGame, openMenu} from './menu.js';

export function syncToggles() {
  for (const [id, on] of [
    ['tSound', !AU.muted],
    ['tMusic', AU.music],
    ['tVibro', SET.vibro !== false],
    ['tTut', SET.tut !== false]
  ]) {
    const b = $(id);
    b.textContent = tr(on ? 'on' : 'off');
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
  }
  $('snd').textContent = tr('snd', tr(AU.muted ? 'off' : 'on'));
}
export function toggleSound() {
  AU.setMuted(!AU.muted);
  SET.sound = !AU.muted;
  saveSettings();
  syncToggles();
}

export function initSettings() {
  $('tTut').addEventListener('click', () => {
    SET.tut = SET.tut === false;
    saveSettings();
    syncToggles();
  });
  $('tVibro').addEventListener('click', () => {
    SET.vibro = SET.vibro === false;
    saveSettings();
    syncToggles();
    buzz(30);
  });
  // settings: master sound and music are remembered with the language
  AU.muted = SET.sound === false;
  AU.music = SET.music !== false;
  const vol01 = (v, d) => (typeof v === 'number' && v >= 0 && v <= 1 ? v : d);
  AU.musicVol = vol01(SET.musicVol, 0.7);
  AU.sfxVol = vol01(SET.sfxVol, 0.8);
  $('vMusic').value = Math.round(AU.musicVol * 100);
  $('vSfx').value = Math.round(AU.sfxVol * 100);
  // browsers only allow sound after a gesture: the first click or key starts it (the menu theme on the title screen)
  for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, () => AU.init(), true);
  document.addEventListener('click', e => {
    if (e.target.closest && e.target.closest('.card button,#corner button')) AU.fx.ui.call(AU);
  });
  // a hidden tab stops all sound (and the engine loops cannot get stuck)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && inGame()) openMenu();
    if (!AU.ctx) return;
    if (document.hidden) AU.ctx.suspend();
    else AU.ctx.resume();
  });
  $('snd').addEventListener('click', e => {
    AU.init();
    toggleSound();
    e.currentTarget.blur();
  });
  $('tSound').addEventListener('click', () => {
    AU.init();
    toggleSound();
  });
  $('tMusic').addEventListener('click', () => {
    AU.init();
    if (AU.ctx) AU.setMusic(!AU.music);
    else AU.music = !AU.music;
    SET.music = AU.music;
    saveSettings();
    syncToggles();
  });
  $('vMusic').addEventListener('input', e => {
    const v = e.target.value / 100;
    AU.init();
    if (AU.ctx) AU.setMusic(AU.music, v);
    else AU.musicVol = v;
    SET.musicVol = v;
  });
  $('vSfx').addEventListener('input', e => {
    const v = e.target.value / 100;
    AU.init();
    if (AU.ctx) AU.setSfx(v);
    else AU.sfxVol = v;
    SET.sfxVol = v;
  });
  for (const id of ['vMusic', 'vSfx'])
    $(id).addEventListener('change', () => {
      saveSettings();
      if (id === 'vSfx' && AU.ctx) AU.play({k: 'rifle', x: null});
    });
}
