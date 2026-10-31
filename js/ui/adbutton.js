/* CrazyGames rewarded ad during play: a corner button that pauses the game, shows an ad and pays supply tokens. */
import {PURSE} from '../config.js';
import {tokN, tr} from '../i18n/index.js';
import {S} from '../state.js';
import {toast} from '../logic/rules.js';
import {CG} from '../crazygames.js';
import {$} from './dom.js';
import {inGame} from './menu.js';

const REWARD = 10,
  COOLDOWN = 150e3, // between two rewarded ads that played
  RETRY = 30e3; // after an ad that could not play
let readyAt = 0,
  busy = false;

// why an ad did not play, in the player's language
export function adFailText() {
  return tr(CG.lastError === 'adblock' ? 'ad_block' : CG.lastError === 'cooldown' ? 'ad_wait' : 'ad_none');
}

// called every frame: the button shows only on CrazyGames, while playing, when the purse has room and the cooldown is over
export function syncAdButton() {
  const b = $('adbtn'),
    show =
      CG.active &&
      !busy &&
      inGame() &&
      !S.paused &&
      $('menu').hidden &&
      S.coins < PURSE &&
      performance.now() >= readyAt;
  if (b.hidden === !show) return;
  b.hidden = !show;
  if (show) {
    b.textContent = tr('ad_btn', tokN(REWARD));
    b.setAttribute('aria-label', b.textContent);
    b.dataset.s = '+' + REWARD;
  }
}

export function initAdButton() {
  $('adbtn').addEventListener('click', async e => {
    e.currentTarget.blur();
    if (busy || !inGame()) return;
    busy = true;
    $('adbtn').hidden = true;
    S.paused = true;
    const ok = await CG.rewarded();
    busy = false;
    if ($('menu').hidden) S.paused = false;
    readyAt = performance.now() + (ok ? COOLDOWN : RETRY);
    if (ok) {
      S.coins = Math.min(PURSE, S.coins + REWARD);
      toast(tr('ad_got', tokN(REWARD)));
    } else toast(adFailText(), true);
  });
}
