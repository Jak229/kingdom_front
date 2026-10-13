/* Victory and defeat card. */
import {tr} from '../i18n/index.js';
import {roman} from '../util.js';
import {S} from '../state.js';
import {nextFrontState} from '../logic/step.js';
import {clearSave, saveGame} from '../save.js';
import {AU} from '../audio.js';
import {syncCorner} from './menu.js';

export function gameOver() {
  if (S.over) return;
  S.over = true;
  showEnd(false);
}
export function showEnd(won) {
  if (won) {
    S.nextFront = nextFrontState(S);
    saveGame(S.nextFront);
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
  el('endText').textContent = t;
}
