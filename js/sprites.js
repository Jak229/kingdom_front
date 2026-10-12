/* Sprites come from one atlas image, assets/sprites.png, drawn by the code in art/ (see art/build.mjs).
   Every frame is named "key:frame"; SPR holds each sprite's size in art pixels and its anchor. */
import {K} from './config.js';

export const ATLAS = 'sprites';
export const SPR = {}; // key -> {w,h,frames,ox,oy,snow}
export const SP = Math.max(1, Math.round(2 * K)) / K; // world units per art pixel: every art pixel covers a whole number of screen pixels
export const R = 2, // texels per art pixel
  SPT = SP / R; // world units per texel
export const fname = (key, frame) => key + ':' + (frame || 0);

export function loadSprites(scene) {
  scene.load.atlas(ATLAS, 'assets/sprites.png', 'assets/sprites.json');
}
export function initSprites(scene) {
  const tex = scene.textures.get(ATLAS);
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  Object.assign(SPR, tex.customData.spr);
}
