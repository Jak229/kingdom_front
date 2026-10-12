/* Parallax background layers: drawn once in white, tinted per time of day and season. */
import {K} from '../config.js';

/* ---------- parallax layers: drawn once in white, tinted per time of day ---------- */
export const SEASON_TINT = [
  {c: 0x9cc070, n: 0x2a3a52, w: [0.04, 0.08, 0.2, 0.25]},
  null,
  {c: 0xc8853a, n: 0x3a3048, w: [0.05, 0.1, 0.3, 0.35]},
  {c: 0xeef2f4, n: 0x56648a, w: [0.45, 0.5, 0.55, 0.5]}
];
export const LAYERS = [
  {key: 'L1', f: 0.08, h: 240, day: 0xb4c3cc, night: 0x2a3452, dusk: 0xd8a07c},
  {key: 'L2', f: 0.2, h: 200, day: 0x98a6a4, night: 0x212a44, dusk: 0xa97b68},
  {key: 'L3', f: 0.4, h: 170, day: 0x6d7f66, night: 0x172038, dusk: 0x6e5650},
  {key: 'L4', f: 0.68, h: 110, day: 0x485740, night: 0x0f1528, dusk: 0x40363a}
];
export function makeLayers(scene) {
  const TW = 1024;
  let seed = 11;
  const r = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const g = scene.make.graphics({x: 0, y: 0, add: false});
  const SC = () => g.scaleCanvas(K, K);
  const per = (x, amp, k) => Math.sin((x / TW) * Math.PI * 2 * k);
  // L1 distant ridges
  g.clear();
  SC();
  g.fillStyle(0xffffff, 1);
  {
    const pts = [{x: 0, y: 240}];
    for (let x = 0; x <= TW; x += 8) {
      pts.push({x, y: 120 + per(x, 0, 2) * 30 + per(x, 0, 5) * 14 + per(x, 0, 11) * 5});
    }
    pts.push({x: TW, y: 240});
    g.fillPoints(pts, true);
  }
  g.fillStyle(0xe4e4e4, 1);
  {
    const pts = [{x: 0, y: 240}];
    for (let x = 0; x <= TW; x += 8) pts.push({x, y: 170 + per(x, 0, 3) * 18 + per(x, 0, 7) * 8});
    pts.push({x: TW, y: 240});
    g.fillPoints(pts, true);
  }
  g.generateTexture('L1', Math.round(TW * K), Math.round(240 * K));
  // L2 ruined town and power pylons
  g.clear();
  SC();
  g.fillStyle(0xffffff, 1);
  g.fillRect(0, 180, TW, 20);
  for (let x = 10; x < TW - 80;) {
    const w = 24 + r() * 46,
      h = 40 + r() * 110;
    g.fillStyle(0xffffff, 1);
    g.fillRect(x, 200 - h, w, h);
    if (r() < 0.5) g.fillTriangle(x, 200 - h, x + w * 0.5, 200 - h, x, 200 - h - 10 - r() * 12);
    g.fillStyle(0xd0d0d0, 1);
    for (let y = 200 - h + 8; y < 190; y += 12)
      for (let c = x + 4; c < x + w - 6; c += 10) if (r() < 0.4) g.fillRect(c, y, 4, 5);
    x += w + 6 + r() * 40;
  }
  // landmarks on the skyline: domed church, factory chimneys, a tower crane, a water tower
  g.fillStyle(0xffffff, 1);
  g.fillRect(372, 120, 44, 80);
  g.fillCircle(394, 120, 20);
  g.fillRect(392, 92, 4, 10);
  for (const [cx, h] of [
    [300, 150],
    [316, 120]
  ])
    g.fillRect(cx, 200 - h, 8, h);
  g.fillRect(270, 150, 70, 50);
  g.fillRect(842, 50, 4, 150);
  g.fillRect(790, 52, 110, 4);
  g.fillRect(890, 56, 10, 16);
  g.fillTriangle(842, 50, 846, 50, 844, 38);
  g.fillRect(950, 150, 4, 50);
  g.fillRect(970, 150, 4, 50);
  g.fillRect(944, 120, 36, 30);
  g.lineStyle(2, 0xffffff, 1);
  for (const px of [140, 620]) {
    g.lineBetween(px - 10, 200, px, 90);
    g.lineBetween(px + 10, 200, px, 90);
    g.lineBetween(px - 16, 110, px + 16, 110);
    g.lineBetween(px - 12, 130, px + 12, 130);
  }
  g.lineStyle(1, 0xffffff, 1);
  for (let i = 0; i <= 32; i++) {
    const x1 = 140 + i * 15,
      y1 = 110 + Math.sin((i / 32) * Math.PI) * 22;
    g.fillStyle(0xffffff, 1);
    g.fillRect(x1, y1, 1, 1);
  }
  g.generateTexture('L2', Math.round(TW * K), Math.round(200 * K));
  // L3 pine forest
  g.clear();
  SC();
  g.fillStyle(0xffffff, 1);
  g.fillRect(0, 140, TW, 30);
  for (let x = -10; x < TW + 10; x += 9 + r() * 9) {
    const h = 60 + r() * 70,
      w = h * 0.32;
    for (const o of [0, -TW, TW]) {
      const xx = x + o;
      g.fillTriangle(xx - w, 170 - h * 0.15, xx + w, 170 - h * 0.15, xx, 170 - h);
      g.fillTriangle(xx - w * 1.2, 170, xx + w * 1.2, 170, xx, 170 - h * 0.6);
    }
  }
  g.generateTexture('L3', Math.round(TW * K), Math.round(170 * K));
  // L4 near trees and bushes
  g.clear();
  SC();
  g.fillStyle(0xffffff, 1);
  g.fillRect(0, 96, TW, 14);
  for (let x = 0; x < TW; x += 40 + r() * 90) {
    const h = 50 + r() * 55,
      w = h * 0.3;
    for (const o of [0, -TW, TW]) {
      const xx = x + o;
      g.fillRect(xx - 2, 110 - h * 0.3, 4, h * 0.3);
      g.fillTriangle(xx - w, 110 - h * 0.25, xx + w, 110 - h * 0.25, xx, 110 - h);
      g.fillTriangle(xx - w * 1.3, 104, xx + w * 1.3, 104, xx, 110 - h * 0.55);
    }
  }
  for (let x = 0; x < TW; x += 26 + r() * 30) {
    for (const o of [0, -TW, TW]) g.fillEllipse(x + o, 104, 30 + r() * 30, 18 + r() * 10);
  }
  for (let x = 20; x < TW; x += 70 + r() * 110) {
    const h = 40 + r() * 30,
      rr = 14 + r() * 8;
    for (const o of [0, -TW, TW]) {
      const xx = x + o;
      g.fillRect(xx - 2, 110 - h, 4, h);
      g.fillCircle(xx, 110 - h, rr);
      g.fillCircle(xx - rr * 0.7, 110 - h + rr * 0.5, rr * 0.75);
      g.fillCircle(xx + rr * 0.7, 110 - h + rr * 0.4, rr * 0.8);
    }
  }
  g.generateTexture('L4', Math.round(TW * K), Math.round(110 * K));
  g.destroy();
  for (const L of LAYERS) {
    L.kx = Math.round(TW * K) / TW;
    L.ky = Math.round(L.h * K) / L.h;
  }
}
