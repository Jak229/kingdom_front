/* Builds every sprite texture once when the scene starts. */
import {pxSeason, pxSprite} from './core.js';
import {PEOPLE, human} from './people.js';
import {
  bomber,
  brute,
  carrier,
  colossus,
  crow,
  dog,
  hive,
  howitzer,
  jammer,
  jumper,
  ram,
  recon,
  robot,
  shieldbot,
  walker
} from './robots.js';
import {
  bLaunch,
  bRocket,
  bus,
  heli,
  vBRDM,
  vBTR80,
  vKrAZ,
  vMaxx,
  vT64,
  vUral,
  wreckCar,
  wreckTank
} from './vehicles.js';
import {
  bAtgm,
  bBank,
  bBarracks,
  bBase,
  bBoards,
  bBunker,
  bCache,
  bCamp,
  bDepot,
  bDugout,
  bHermit,
  bMedic,
  bMortar,
  bRadar,
  bShop,
  bSniper,
  bStake,
  bSupply,
  bTent,
  bTower,
  bTurret,
  bWall,
  iAgro,
  iBar,
  iGun,
  iTool
} from './buildings.js';
import {
  barn,
  barrels,
  billboard,
  bush,
  chapel,
  container,
  crates,
  fence,
  fgrass,
  grass,
  hay,
  hedgehog,
  house,
  hulk,
  pine,
  pole,
  pylon,
  rock,
  silo,
  station,
  stump,
  tires,
  tree,
  wagon,
  wire,
  wtower
} from './scenery.js';

export function makeSprites(scene) {
  const H = (k, o) => pxSprite(scene, 'p_' + k, 11, 17, 6, (P, f) => human(P, o, f));
  for (const k in PEOPLE) H(k, PEOPLE[k]);
  pxSprite(scene, 'robot', 12, 16, 2, robot);
  pxSprite(scene, 'carrier', 28, 12, 2, carrier);
  pxSprite(scene, 'dog', 14, 9, 7, dog);
  pxSprite(scene, 'walker', 42, 38, 2, walker);
  pxSprite(scene, 'brute', 20, 23, 2, brute);
  pxSprite(scene, 'recon', 16, 7, 2, recon);
  pxSprite(scene, 'shieldbot', 17, 16, 6, shieldbot);
  pxSprite(scene, 'jumper', 12, 19, 4, jumper);
  pxSprite(scene, 'bomber', 12, 13, 4, bomber);
  pxSprite(scene, 'jammer', 15, 23, 2, jammer);
  pxSprite(scene, 'ram', 46, 24, 2, ram);
  pxSprite(scene, 'hive', 52, 22, 2, hive);
  pxSprite(scene, 'howitzer', 46, 30, 3, howitzer);
  pxSprite(scene, 'colossus', 41, 48, 2, colossus);
  pxSprite(scene, 'crow', 8, 5, 4, crow, {rim: 0.08});
  pxSprite(scene, 'v_jeep', 48, 36, 2, (P, f) => vMaxx(P, f, true));
  pxSprite(scene, 'e_jeep', 48, 36, 1, (P, f) => vMaxx(P, 0, false));
  pxSprite(scene, 'v_moto', 32, 24, 2, (P, f) => vUral(P, f, true));
  pxSprite(scene, 'e_moto', 32, 24, 1, (P, f) => vUral(P, 0, false));
  pxSprite(scene, 'v_armored', 46, 30, 2, (P, f) => vBRDM(P, f, true));
  pxSprite(scene, 'e_armored', 46, 30, 1, (P, f) => vBRDM(P, 0, false));
  pxSprite(scene, 'v_tank', 70, 28, 2, (P, f) => vT64(P, f, true));
  pxSprite(scene, 'e_tank', 70, 28, 1, (P, f) => vT64(P, 0, false));
  pxSprite(scene, 'btr', 58, 28, 2, vBTR80);
  pxSprite(scene, 'truck', 58, 30, 2, vKrAZ);
  pxSprite(scene, 'hq1', 54, 31, 2, bTent);
  pxSprite(scene, 'hq2', 68, 30, 2, bDugout);
  pxSprite(scene, 'hq3', 70, 40, 2, bBunker);
  pxSprite(scene, 'hq4', 96, 64, 2, bBase);
  for (let l = 1; l <= 3; l++) pxSprite(scene, 'wall' + l, 24, [0, 12, 24, 36][l], 1, P => bWall(P, l));
  pxSprite(scene, 'turret1', 22, 44, 1, P => bTurret(P, 1));
  pxSprite(scene, 'turret2', 22, 40, 1, P => bTurret(P, 2));
  pxSprite(scene, 'mortar', 22, 14, 1, bMortar);
  pxSprite(scene, 'atgm', 26, 18, 1, bAtgm);
  pxSprite(scene, 'bank', 28, 24, 1, bBank);
  pxSprite(scene, 'medic', 30, 20, 1, bMedic);
  pxSprite(scene, 'sniper', 22, 58, 1, bSniper);
  pxSprite(scene, 'barracks', 43, 25, 1, bBarracks);
  pxSprite(scene, 'supply', 60, 28, 1, bSupply);
  pxSprite(scene, 'launch', 64, 70, 2, bLaunch);
  pxSprite(scene, 'rocket', 11, 56, 1, bRocket);
  for (const k of ['gun', 'tool', 'agro']) pxSprite(scene, 'shop_' + k, 36, 23, 1, P => bShop(P, k));
  pxSprite(scene, 'camp', 62, 26, 2, bCamp);
  pxSprite(scene, 'depot', 62, 34, 1, bDepot);
  pxSprite(scene, 'tower', 22, 68, 2, bTower);
  pxSprite(scene, 'radar', 34, 40, 3, bRadar);
  pxSprite(scene, 'hermit', 42, 30, 1, bHermit);
  pxSprite(scene, 'stake', 5, 11, 2, bStake);
  pxSprite(scene, 'boards', 21, 11, 1, bBoards);
  pxSprite(scene, 'item_gun', 8, 3, 1, iGun);
  pxSprite(scene, 'item_tool', 5, 7, 1, iTool);
  pxSprite(scene, 'item_agro', 6, 4, 1, iAgro);
  pxSprite(scene, 'bar', 5, 1, 1, iBar);
  pxSprite(scene, 'pine', 16, 34, 2, pine);
  pxSprite(scene, 'hedgehog', 12, 10, 1, hedgehog);
  pxSprite(scene, 'cache', 12, 9, 1, P => bCache(P, false));
  pxSprite(scene, 'cache_open', 12, 9, 1, P => bCache(P, true));
  // scenery
  pxSeason(scene, 'tree', 28, 46, 2, tree, {grain: 0.08});
  pxSeason(scene, 'bush', 16, 10, 2, bush, {grain: 0.08});
  pxSeason(scene, 'grass', 8, 5, 3, grass, {outline: false, rim: 0.1});
  pxSeason(scene, 'fgrass', 14, 10, 3, fgrass, {outline: false, rim: 0.06, grain: 0});
  pxSprite(scene, 'rock', 11, 5, 2, rock);
  pxSprite(scene, 'stump', 15, 5, 2, stump);
  pxSprite(scene, 'pole', 8, 48, 1, pole);
  pxSprite(scene, 'fence', 24, 9, 2, fence);
  pxSprite(scene, 'wire', 24, 9, 1, wire);
  pxSprite(scene, 'barrels', 14, 9, 2, barrels);
  pxSprite(scene, 'crates', 14, 9, 2, crates);
  pxSprite(scene, 'tires', 10, 5, 1, tires);
  pxSprite(scene, 'wreck_car', 34, 16, 1, wreckCar);
  pxSprite(scene, 'wreck_tank', 56, 20, 1, wreckTank);
  pxSprite(scene, 'hulk', 20, 10, 1, hulk);
  pxSprite(scene, 'house', 64, 44, 2, house);
  pxSprite(scene, 'chapel', 44, 64, 1, chapel);
  pxSprite(scene, 'heli', 62, 24, 1, heli);
  pxSprite(scene, 'wagon', 56, 22, 2, wagon);
  pxSprite(scene, 'wtower', 26, 62, 1, wtower);
  pxSprite(scene, 'station', 86, 36, 1, station);
  pxSprite(scene, 'bus', 52, 22, 1, bus);
  pxSprite(scene, 'container', 48, 20, 2, container);
  pxSprite(scene, 'silo', 34, 60, 1, silo);
  pxSprite(scene, 'barn', 58, 38, 1, barn);
  pxSprite(scene, 'pylon', 30, 90, 1, pylon);
  pxSprite(scene, 'billboard', 40, 32, 1, billboard);
  pxSprite(scene, 'hay', 14, 9, 1, hay);
}
