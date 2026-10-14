/* Starts the game after the platform SDK: applies the language, picks the input layout, boots Phaser once the pixel font is ready. */
import {H, K, W} from './config.js';
import {Main} from './scene.js';
import {initTouch, layoutCorner, setTouchMode} from './ui/touch.js';
import {initTutorialPanel} from './ui/tutorial.js';
import {initSettings} from './ui/settings.js';
import {applyLang, initMenu, syncCorner} from './ui/menu.js';

initTouch();
initTutorialPanel();
initSettings();
initMenu();
applyLang();
setTouchMode(matchMedia('(pointer:coarse)').matches);
syncCorner();
setTimeout(layoutCorner, 300);

function boot() {
  new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#0c0e14',
    width: Math.round(W * K),
    height: Math.round(H * K),
    scale: {mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH},
    render: {antialias: true, pixelArt: false},
    scene: Main
  });
}
const fontReady =
  document.fonts && document.fonts.load
    ? Promise.race([
        document.fonts.load('20px "Pixelify Sans"', 'AaБбЇїÑñÜüß'),
        new Promise(r => setTimeout(r, 1500))
      ])
    : Promise.resolve();
fontReady.then(boot, boot);
