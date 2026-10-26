/* Victory and defeat card. */
import {tr} from '../i18n/index.js';
import {roman} from '../util.js';
import {S} from '../state.js';
import {nextFrontState} from '../logic/step.js';
import {clearSave, saveGame} from '../save.js';
import {AU} from '../audio.js';
import {CG} from '../crazygames.js';
import {adFailText} from './adbutton.js';
import {PURSE} from '../config.js';
import {syncCorner} from './menu.js';
import {achieve, ev} from '../meta.js';

export function gameOver() {
  if (S.over) return;
  S.over = true;
  showEnd(false);
}
export function showEnd(won) {
  if (won) {
    ev('victory');
    if (S.front + 1 >= 3) achieve('front3');
    S.nextFront = nextFrontState(S);
    saveGame(S.nextFront);
    CG.happytime();
  } else clearSave();
  S.endWon = won;
  fillEnd();
  AU.jingle(won);
  document.getElementById('menu').hidden = true;
  document.getElementById('end').hidden = false;
  syncCorner();
}
export function fillEnd() {
  const won = S.endWon,
    el = id => document.getElementById(id);
  el('nextFront').hidden = !won;
  el('bonus').hidden = !won || !CG.active || !!S.bonusGot;
  el('bonus').textContent = tr('e_bonus', BONUS);
  el('restart').classList.toggle('alt', won);
  el('endStamp').textContent = tr(won ? 'e_stampWin' : 'e_stampLose');
  const h = el('endTitle'),
    sp = document.createElement('span');
  h.textContent = tr(won ? 'e_winA' : 'e_loseA') + ' ';
  sp.textContent = tr(won ? 'e_winB' : 'e_loseB');
  h.appendChild(sp);
  let t = won
    ? tr(S.wonBy === 'portals' ? 'e_portals' : 'e_rocket', S.day, S.kills)
    : tr('e_lose', S.day, S.kills);
  if (won) {
    const c = S.nextFront.carried;
    t += tr(
      'e_carry',
      roman(S.front),
      roman(S.front + 1),
      c.g,
      c.b,
      S.dog ? tr('e_dog') : '',
      S.front,
      S.front + 1
    );
  }
  if (won && S.bonusGot) t += ' ' + tr('e_bonusGot', BONUS);
  el('endText').textContent = t;
}
// rewarded ad on the victory card: extra coins carried to the next front
const BONUS = 15;
export function initEnd() {
  const b = document.getElementById('bonus');
  b.addEventListener('click', async () => {
    if (b.disabled || !S.nextFront) return;
    b.disabled = true;
    const ok = await CG.rewarded();
    b.disabled = false;
    if (!ok) {
      // say why instead of silently doing nothing, then offer the button again
      b.textContent = adFailText();
      setTimeout(fillEnd, 3500);
      return;
    }
    if (S.bonusGot || !S.nextFront) return;
    S.bonusGot = true;
    S.nextFront.coins = Math.min(PURSE, S.nextFront.coins + BONUS);
    saveGame(S.nextFront);
    fillEnd();
  });
}
