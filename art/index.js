/* The list of every sprite: key, size in art pixels, frame count and the painter that draws it.
   art/build.mjs runs this in a browser and packs the result into assets/sprites.png. */
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

export function makeSprites() {
  const H = (k, o) => pxSprite('p_' + k, 11, 17, 6, (P, f) => human(P, o, f));
  for (const k in PEOPLE) H(k, PEOPLE[k]);
  pxSprite('robot', 12, 16, 2, robot);
  pxSprite('carrier', 28, 12, 2, carrier);
  pxSprite('dog', 14, 9, 7, dog);
  pxSprite('walker', 42, 38, 2, walker);
  pxSprite('brute', 20, 23, 2, brute);
  pxSprite('recon', 16, 7, 2, recon);
  pxSprite('shieldbot', 17, 16, 6, shieldbot);
  pxSprite('jumper', 12, 19, 4, jumper);
  pxSprite('bomber', 12, 13, 4, bomber);
  pxSprite('jammer', 15, 23, 2, jammer);
  pxSprite('ram', 46, 24, 2, ram);
  pxSprite('hive', 52, 22, 2, hive);
  pxSprite('howitzer', 46, 30, 3, howitzer);
  pxSprite('colossus', 41, 48, 2, colossus);
  pxSprite('crow', 8, 5, 4, crow, {rim: 0.08});
  pxSprite('v_jeep', 48, 36, 2, (P, f) => vMaxx(P, f, true));
  pxSprite('e_jeep', 48, 36, 1, (P, f) => vMaxx(P, 0, false));
  pxSprite('v_moto', 32, 24, 2, (P, f) => vUral(P, f, true));
  pxSprite('e_moto', 32, 24, 1, (P, f) => vUral(P, 0, false));
  pxSprite('v_armored', 46, 30, 2, (P, f) => vBRDM(P, f, true));
  pxSprite('e_armored', 46, 30, 1, (P, f) => vBRDM(P, 0, false));
  pxSprite('v_tank', 70, 28, 2, (P, f) => vT64(P, f, true));
  pxSprite('e_tank', 70, 28, 1, (P, f) => vT64(P, 0, false));
  pxSprite('btr', 58, 28, 2, vBTR80);
  pxSprite('truck', 58, 30, 2, vKrAZ);
  pxSprite('hq1', 54, 31, 2, bTent);
  pxSprite('hq2', 68, 30, 2, bDugout);
  pxSprite('hq3', 70, 40, 2, bBunker);
  pxSprite('hq4', 96, 64, 2, bBase);
  for (let l = 1; l <= 3; l++) pxSprite('wall' + l, 24, [0, 12, 24, 36][l], 1, P => bWall(P, l));
  pxSprite('turret1', 22, 44, 1, P => bTurret(P, 1));
  pxSprite('turret2', 22, 40, 1, P => bTurret(P, 2));
  pxSprite('mortar', 22, 14, 1, bMortar);
  pxSprite('atgm', 26, 18, 1, bAtgm);
  pxSprite('bank', 28, 24, 1, bBank);
  pxSprite('medic', 30, 20, 1, bMedic);
  pxSprite('sniper', 22, 58, 1, bSniper);
  pxSprite('barracks', 43, 25, 1, bBarracks);
  pxSprite('supply', 60, 28, 1, bSupply);
  pxSprite('launch', 64, 70, 2, bLaunch);
  pxSprite('rocket', 11, 56, 1, bRocket);
  for (const k of ['gun', 'tool', 'agro']) pxSprite('shop_' + k, 36, 23, 1, P => bShop(P, k));
  pxSprite('camp', 62, 26, 2, bCamp);
  pxSprite('depot', 62, 34, 1, bDepot);
  pxSprite('tower', 22, 68, 2, bTower);
  pxSprite('radar', 34, 40, 3, bRadar);
  pxSprite('hermit', 42, 30, 1, bHermit);
  pxSprite('stake', 5, 11, 2, bStake);
  pxSprite('boards', 21, 11, 1, bBoards);
  pxSprite('item_gun', 8, 3, 1, iGun);
  pxSprite('item_tool', 5, 7, 1, iTool);
  pxSprite('item_agro', 6, 4, 1, iAgro);
  pxSprite('bar', 5, 1, 1, iBar);
  pxSprite('pine', 16, 34, 2, pine);
  pxSprite('hedgehog', 12, 10, 1, hedgehog);
  pxSprite('cache', 12, 9, 1, P => bCache(P, false));
  pxSprite('cache_open', 12, 9, 1, P => bCache(P, true));
  // scenery
  pxSeason('tree', 28, 46, 2, tree, {grain: 0.08});
  pxSeason('bush', 16, 10, 2, bush, {grain: 0.08});
  pxSeason('grass', 8, 5, 3, grass, {outline: false, rim: 0.1});
  pxSeason('fgrass', 14, 10, 3, fgrass, {outline: false, rim: 0.06, grain: 0});
  pxSprite('rock', 11, 5, 2, rock);
  pxSprite('stump', 15, 5, 2, stump);
  pxSprite('pole', 8, 48, 1, pole);
  pxSprite('fence', 24, 9, 2, fence);
  pxSprite('wire', 24, 9, 1, wire);
  pxSprite('barrels', 14, 9, 2, barrels);
  pxSprite('crates', 14, 9, 2, crates);
  pxSprite('tires', 10, 5, 1, tires);
  pxSprite('wreck_car', 34, 16, 1, wreckCar);
  pxSprite('wreck_tank', 56, 20, 1, wreckTank);
  pxSprite('hulk', 20, 10, 1, hulk);
  pxSprite('house', 64, 44, 2, house);
  pxSprite('chapel', 44, 64, 1, chapel);
  pxSprite('heli', 62, 24, 1, heli);
  pxSprite('wagon', 56, 22, 2, wagon);
  pxSprite('wtower', 26, 62, 1, wtower);
  pxSprite('station', 86, 36, 1, station);
  pxSprite('bus', 52, 22, 1, bus);
  pxSprite('container', 48, 20, 2, container);
  pxSprite('silo', 34, 60, 1, silo);
  pxSprite('barn', 58, 38, 1, barn);
  pxSprite('pylon', 30, 90, 1, pylon);
  pxSprite('billboard', 40, 32, 1, billboard);
  pxSprite('hay', 14, 9, 1, hay);
}
