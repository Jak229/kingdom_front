/* Entry point: the portal SDK (CrazyGames or GameDistribution) must be ready before saves and settings are read, so the game modules load after it. */
import {PF} from './platform.js';

PF.init().then(() => import('./boot.js'));
