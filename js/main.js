/* Entry point: the CrazyGames SDK must be ready before saves and settings are read, so the game modules load after it. */
import {CG} from './crazygames.js';

CG.init().then(() => import('./boot.js'));
