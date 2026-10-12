/* Base buildings, shops, wild-land objects and carried items. */
import {FAC,PAL,R,tone} from './core.js';

export function bTent(P,f){const C=PAL;
  P.flag(3,0,f,30);
  for(let j=0;j<36;j++){const hw=(8+j/2)*R;P.t(52-hw,24+j,hw*2,1,j%8===7?C.canvasL:C.canvas);}
  P.atop(8,12,36,18,()=>{for(const s of [-1,1])for(const k of [1,2,3])P.tl(52+s*k*2,24,52+s*k*9,59,C.canvasD,1);P.dith(9,26,34,3,C.canvasD,1);});
  P.r(8,29,36,1,C.canvasD);P.tri(26,16,6,14,C.canvasD);P.r(25,18,2,12,'#2a2a1e');P.t(48,40,2,20,C.canvasL);P.t(54,40,1,20,'#3a3a2a');
  P.r(25,10,2,3,C.woodD);P.r(25,10,1,.5,C.woodL);
  P.tl(18,56,8,61,C.greyD,1);P.tl(86,56,95,61,C.greyD,1);P.t(6,60,2,2,C.woodD);P.t(95,60,2,2,C.woodD);
  P.r(46,24,6,6,C.metal);P.r(46,24,6,1,C.metalL);P.r(47,25.5,2,1.5,'#1a1c18');P.r(49.5,25.5,1,.5,'#7cff6a');P.r(47,28,4,.5,C.metalD);
  P.r(48,14,.5,10,C.greyL);P.r(48,13,.5,1,C.redL);
  P.r(36,27,5,3,C.woodD);P.r(36,27,5,.5,C.woodL);P.r(37.5,28,2,1,C.goldD);}
export function bDugout(P,f){const C=PAL;
  P.half(34,29,33,14,C.earth);P.half(34,27,30,10,C.earthL);P.half(34,22,22,5,C.grass);
  P.atop(1,15,66,15,()=>{P.speck(1,22,66,8,C.earth,13);P.speck(10,15,48,8,C.grassL,21);P.speck(4,24,60,6,'#8a7656',5);});
  for(let i=0;i<16;i++){const x=24+i*6+(i*7)%5;P.tl(x,32+(i%3),x-1,29+(i%3),C.grassL,1);P.tl(x+1,32+(i%3),x+2,30+(i%3),C.grass,1);}
  for(let i=0;i<9;i++){P.ell(10+i*6,19,2,2,C.woodL);P.ell(10+i*6,19,1,1,C.wood);P.r(10+i*6,19,1,1,C.woodD);P.r(9.5+i*6,17.5,1,.5,'#b89466');}
  P.r(27,19,14,11,C.woodD);P.r(29,21,10,9,'#1c1a14');P.r(27,19,14,1,C.woodL);
  for(let y=21;y<30;y+=2){P.r(27,y,2,.5,C.wood);P.r(39,y,2,.5,C.wood);}P.r(28,19,.5,11,C.wood);P.r(39.5,19,.5,11,C.wood);
  P.bags(1,30,4,2);P.bags(43,30,4,2);
  P.r(52,8,2,9,C.metalD);P.r(52,8,.5,9,C.metal);P.r(51,7,4,1,C.metal);P.r(54,7,.5,1,C.glassL);
  P.flag(6,4,f,13);}
export function bBunker(P,f){const C=PAL;
  P.r(4,14,62,26,C.con);P.r(4,14,62,1,C.conL);P.r(2,10,66,4,C.conD);P.r(2,10,66,1,C.conL);P.r(2,13.5,66,.5,'#5f5d55');
  P.speck(6,16,58,20,C.conD,3);for(let y=22;y<36;y+=7)P.r(4,y,62,.5,C.conD);for(let x=16;x<66;x+=12)P.r(x,14,.5,22,C.conD);P.r(4,16,62,3,C.con);
  for(const x of [10,24,40,54]){P.r(x,20,8,2,'#1a1a16');P.r(x-.5,19.5,9,.5,C.conL);P.r(x,22,8,.5,'#6a685f');}
  for(const x of [13,36,57])P.t(x*R,46,1,10,tone(C.con,-.2));
  P.r(30,28,10,12,'#24241e');P.r(29,27,12,1,C.conL);P.r(30,28,10,.5,'#3a3a32');P.r(4,36,62,4,C.conD);
  P.r(44,27,8,4,FAC.m);P.r(44,27,8,.5,FAC.l);P.ins(48,29,1);
  P.r(52,2,.5,8,C.greyL);P.ell(52,2,4,1,C.greyL);P.r(52,2,1,1,C.grey);P.r(14,4,.5,6,C.greyL);P.r(14,3,.5,1,C.redL);P.flag(20,0,f,10);
  P.dith(2,9,20,1.5,C.canvasD,0);P.dith(48,9,20,1.5,C.canvasD,1);
  P.bags(0,40,2,1);P.bags(58,40,2,1);}
export function bBase(P,f){const C=PAL;
  P.r(6,26,84,38,C.con);P.r(6,26,84,1,C.conL);P.r(4,23,88,3,C.conD);P.r(4,23,88,.5,C.conL);P.speck(8,28,80,34,C.conD,5);
  for(let y=40;y<62;y+=10)P.r(6,y,84,.5,C.conD);for(let x=19;x<90;x+=13)P.r(x,26,.5,36,'#88867a');P.r(6,28,84,4,C.con);
  for(let i=0;i<6;i++){const x=10+i*13;P.r(x-.5,31.5,9,5,C.conD);P.r(x,32,8,4,C.glass);P.r(x,32,2,1,C.glassL);P.r(x+4,32,.5,4,C.metalD);P.r(x-.5,36,9,.5,C.conL);}
  for(let i=0;i<6;i++){if(i===2||i===3)continue;const x=10+i*13;P.r(x-.5,43.5,9,5,C.conD);P.r(x,44,8,4,C.glass);P.r(x,44,2,1,C.glassL);P.r(x+4,44,.5,4,C.metalD);P.r(x-.5,48,9,.5,C.conL);}
  P.r(38,46,20,18,'#2a2b25');for(let y=48;y<64;y+=3)P.r(38,y,20,.5,C.metalD);P.r(38,46,20,1,C.gold);P.r(37,45,22,1,C.conD);
  P.r(40,41,16,3,FAC.m);P.r(40,41,16,.5,FAC.l);P.ins(48,42.5,1);P.r(42,42,3,.5,PAL.white);P.r(51,42,3,.5,PAL.white);
  P.r(30,8,34,15,C.con);P.r(30,8,34,.5,C.conL);P.r(28,6,38,2,C.conD);P.r(28,6,38,.5,C.conL);P.r(34,12,26,4,C.glass);P.r(34,12,5,1,C.glassL);for(let x=40;x<60;x+=6)P.r(x,12,.5,4,C.metalD);
  P.r(32,18,6,4,C.metal);P.r(32,18,6,.5,C.metalL);for(let i=0;i<3;i++)P.r(33,19+i,4,.5,C.metalD);
  P.r(56,18,6,4,C.metal);P.r(56,18,6,.5,C.metalL);P.ell(59,20,1,1,C.metalD);
  P.r(80,0,1,23,C.metalL);P.line(76,23,80,4,C.metal);P.line(84,23,80,4,C.metal);P.r(74,2,13,2,C.greyL);P.r(74,2,13,.5,'#d4d2c6');P.r(76,10,8,.5,C.metal);
  P.r(8,20,6,3,C.metalD);P.ell(11,19,3,1,C.greyL);
  P.flag(14,4,f,19);P.bags(0,64,3,2);P.bags(78,64,3,2);}
export function bWall(P,lvl){const C=PAL;
  if(lvl===1){P.bags(1,12,3,3);}
  else if(lvl===2){P.bags(1,24,3,2);
    for(const o of [5,17]){P.line(o-4,22,o+4,12,C.metalD);P.line(o+4,22,o-4,12,C.metalD);P.line(o,23,o,11,C.metal);P.r(o,11,.5,12,C.metalL);P.r(o-1,22,2,.5,'#6a3a24');}
    for(let i=0;i<6;i++){P.ell(2+i*4,7,2,2,C.greyL);P.clr(2+i*4,7);}P.r(0,7,24,.5,C.grey);for(let i=0;i<12;i++)P.r(i*2+.5,6.5+(i%2),.5,.5,C.greyD);}
  else{P.r(1,8,22,24,C.con);P.r(1,8,22,1,C.conL);P.speck(2,10,20,20,C.conD,9);P.r(1,24,22,.5,C.conD);P.r(0,5,24,3,C.conD);P.r(0,5,24,.5,C.conL);
    P.r(12,8,.5,24,C.conD);P.r(4,15,16,2,'#151512');P.r(3.5,14.5,17,.5,C.conL);P.r(4,17,16,.5,'#6a685f');
    P.t(14,40,1,12,tone(C.con,-.2));P.t(36,44,1,8,tone(C.con,-.2));
    for(let i=0;i<24;i+=3){P.r(i,3+(i%2),2,3,C.oliveD);P.r(i,3+(i%2),1,.5,C.olive);}P.bags(0,36,4,1);P.r(1,32,22,1,C.conD);}}
export function bTurret(P,lvl){const C=PAL;
  if(lvl===1){P.line(3,43,6,14,C.wood);P.line(18,43,15,14,C.wood);P.line(5,36,16,22,C.woodD);P.line(16,36,5,22,C.woodD);P.r(5,28,12,.5,C.woodD);
    P.r(1,13,20,2,C.woodL);P.r(1,14.5,20,.5,C.woodD);P.bags(1,13,3,1);P.r(1,4,20,2,C.metal);P.r(1,4,20,.5,C.metalL);P.tri(11,0,9,4,C.metalD);P.r(2,6,1,4,C.wood);P.r(19,6,1,4,C.wood);
    P.r(10,8,11,1,C.metalD);P.r(9,7,3,3,C.metal);P.r(9,7,3,.5,C.metalL);P.r(17,9,1,1,C.metalD);P.r(12,9,1,1.5,C.metalD);P.r(6,10,3,2,C.oliveD);P.r(7,8,2,2,C.skin);P.r(6.5,7,3,1,'#4b5b2d');}
  else{P.r(8,14,4,26,C.metal);P.r(8,14,1,26,C.metalL);P.r(11.5,14,.5,26,C.metalD);for(let y=18;y<36;y+=5)P.r(8,y,4,.5,C.metalD);P.r(3,36,14,4,C.con);P.r(3,36,14,1,C.conL);P.r(5,37.5,.5,.5,C.metalD);P.r(14.5,37.5,.5,.5,C.metalD);
    P.ell(10,9,8,5,'#4a5530');P.r(2,9,16,4,'#4a5530');P.r(3,5,8,1,C.oliveL);P.r(2,11.5,16,.5,'#353d22');P.r(14,7,7,1,C.metalD);P.r(14,10,7,1,C.metalD);P.r(20,6.5,1,2,C.metal);P.r(20,9.5,1,2,C.metal);
    P.r(4,6,3,2,C.glass);P.r(4,6,1,1,'#7cff6a');P.r(9,5.5,.5,7,'#353d22');P.ins(12,10.5,1);}}
export function bMortar(P){const C=PAL;P.r(10,11,9,2,C.metalD);P.r(10,11,9,.5,C.metal);P.line(11,12,19,1,C.metalD);P.line(12,12,20,2,C.metal);P.line(16,12,18,6,C.metalD);P.r(18.5,1,1,.5,C.metalL);
  P.bags(0,14,2,2);P.bags(16,14,2,1);P.r(2,8,5,3,C.wood);P.r(2,8,5,.5,C.woodL);P.r(3.5,9,2,1,C.oliveD);for(let i=0;i<3;i++)P.r(7.5+i,9.5,.5,1.5,C.goldD);}
export function bAtgm(P){const C=PAL;P.bags(0,18,4,2);P.line(12,12,8,15,C.metalD);P.line(12,12,16,15,C.metalD);P.r(12,7,1,6,C.metalD);
  P.r(4,4,18,4,C.olive);P.r(4,4,18,1,C.oliveL);P.r(22,4,2,4,C.oliveD);P.r(10,8,4,3,C.metalD);P.r(10.5,8.5,1.5,1,C.glass);P.r(6,5,1,1,'#7cff6a');P.r(14,5,.5,3,C.oliveD);P.r(18,5,.5,3,C.oliveD);P.r(22.5,5,1,2,'#2a2a24');}
export function bMedic(P){const C=PAL,T='#c9c3a8',TD='#a39d84',TL='#e0dbc4',G='#2f8a4a';
  for(let j=0;j<24;j++){const hw=(6+j/2)*R;P.t(30-hw,12+j,hw*2,1,j%8===7?TL:T);}
  P.atop(1,6,28,13,()=>{for(const s of [-1,1])P.tl(30+s*4,12,30+s*14,36,TD,1);});
  P.r(1,18,28,2,TD);P.r(13,11,4,9,'#3a3428');P.t(26,24,2,16,'#4a4434');
  P.r(19,9,5,5,G);P.r(21,9.5,1,4,PAL.white);P.r(19.5,11,4,1,PAL.white);
  P.r(14,0,.5,6,C.greyL);P.r(14.5,0,5,3,PAL.white);P.r(16.5,.5,1,2,G);P.r(15,1,4,1,G);
  P.r(24,16,6,1,C.olive);P.r(24,16,6,.5,C.oliveL);P.r(24,17,.5,1,C.woodD);P.r(29.5,17,.5,1,C.woodD);P.r(26,15,2,1,PAL.white);}
export function bSniper(P){const C=PAL;
  P.line(3,57,6,14,C.wood);P.line(4,57,7,14,C.wood);P.line(18,57,15,14,C.wood);P.line(17,57,14,14,C.wood);
  for(let y=22;y<54;y+=10){P.line(6,y,15,y+8,C.woodD);P.line(15,y,6,y+8,C.woodD);}
  for(let y=17;y<57;y+=5){P.r(9,y,4,1,C.woodL);P.r(9,y+.5,4,.5,C.wood);}
  P.r(1,12,20,2,C.woodL);P.r(1,14,20,1,C.woodD);for(let x=2;x<20;x+=3)P.r(x,12,.5,2,C.wood);
  P.r(0,2,22,3,C.canvasD);P.dith(0,4,22,2,C.canvas,0);P.r(0,2,22,.5,C.canvas);P.r(1,5,1,7,C.wood);P.r(20,5,1,7,C.wood);
  P.r(4,9,9,3,C.olive);P.r(4,9,9,1,C.oliveL);P.camo(4,9,9,3,[C.oliveD],61,4);P.r(12,8,3,3,C.skin);P.r(12,7,3,2,'#4b5b2d');P.r(13.5,8.5,.5,.5,C.black);
  P.r(11,10,11,1,C.metalD);P.r(21,9,1,1,C.metalD);P.r(15,9,2,1,C.metal);P.r(15,9,1,.5,C.glassL);P.r(19,11,.5,1.5,C.metalD);}
export function bBank(P){const C=PAL;P.r(2,6,24,18,C.con);P.r(2,6,24,.5,C.conL);P.r(0,3,28,3,C.conD);P.r(0,3,28,.5,C.conL);P.r(2,8,24,2,C.gold);P.r(2,8,24,.5,'#f2d777');
  P.speck(2,10,24,14,C.conD,17);P.r(8,12,12,12,C.metal);P.r(8,12,12,.5,C.metalL);P.ell(14,17,3,3,C.metalD);P.ell(14,17,2,2,C.metal);P.r(13,17,3,1,C.gold);
  for(const [x,y] of [[9,13],[18.5,13],[9,22.5],[18.5,22.5]])P.r(x,y,.5,.5,C.metalL);
  P.r(4,13,3,3,C.glass);P.r(21,13,3,3,C.glass);P.r(4,13,1,1,C.glassL);P.r(21,13,1,1,C.glassL);P.r(4,14.5,3,.5,C.metalD);P.r(21,14.5,3,.5,C.metalD);}
export function bBarracks(P){const C=PAL;P.half(21,24,21,16,C.olive);P.half(21,24,19,14,C.oliveL);P.half(21,24,18,13,C.olive);
  P.atop(0,8,43,17,()=>{for(let x=4;x<40;x+=4)P.r(x,8,.5,17,C.oliveD);for(let x=6;x<40;x+=4)P.r(x,8,.5,17,'#6a7f3b');});
  P.r(15,13,12,12,C.oliveD);P.r(17,15,8,10,'#1d1f16');P.r(17,15,8,.5,'#2e3122');P.r(4,17,6,4,C.glass);P.r(32,17,6,4,C.glass);P.r(4,17,2,1,C.glassL);P.r(32,17,2,1,C.glassL);
  P.r(14,6,14,3,FAC.d);P.r(14,6,14,.5,FAC.l);P.r(16,7,10,1,FAC.m);P.ins(21,7.5,1);P.r(20,23,2,2,C.woodD);}
export function bSupply(P){const C=PAL;
  for(let j=0;j<28;j++){const hw=(10+j)*R/1;P.t(60-hw,12+j,hw*2,1,j%6===5?C.canvasL:C.canvas);}
  P.r(4,20,52,8,C.canvas);for(let x=6;x<56;x+=6){P.r(x,20,.5,8,C.canvasD);P.r(x+.5,20,.5,8,C.canvasL);}P.r(4,20,52,.5,C.canvasD);
  P.r(24,16,12,12,'#24241a');P.r(24,16,12,.5,'#3a3a28');
  for(const [x,y] of [[2,22],[9,22],[5,16],[44,22],[51,22],[48,16]]){P.r(x,y,7,6,C.wood);P.r(x,y,7,1,C.woodL);P.line(x,y,x+6,y+5,C.woodD);P.r(x+.5,y+.5,.5,5,C.woodD);P.r(x+6,y+.5,.5,5,C.woodD);P.r(x+2.5,y+2,2,.5,C.goldD);}
  P.r(30,10,.5,6,C.greyL);P.r(30.5,10,4,2.5,FAC.m);P.r(30.5,12,4,.5,PAL.white);}
export function bShop(P,kind){const C=PAL;const col={gun:[C.olive,C.oliveD,C.oliveL],tool:['#6f6a4a','#4f4b33','#8a8462'],agro:[C.brown,C.brownD,C.brownL]}[kind];
  P.r(2,8,32,20,col[0]);for(let x=4;x<34;x+=3){P.r(x,9,.5,19,col[1]);P.r(x+.5,9,.5,19,tone(col[0],.08));}P.r(2,8,32,1,col[2]);
  for(let i=0;i<8;i++){P.r(i*4+1,4,4,4,i%2?C.white:col[1]);P.r(i*4+1,7.5,4,.5,tone(i%2?C.white:col[1],-.2));}P.r(1,7,34,1,C.woodD);P.r(1,3.5,34,.5,C.woodD);
  P.r(7,13,22,8,'#1e1d16');P.r(7,13,22,.5,'#2e2c22');P.r(5,21,26,2,C.wood);P.r(5,21,26,1,C.woodL);P.r(6,23,.5,4,C.woodD);P.r(29.5,23,.5,4,C.woodD);
  P.r(31,10,2,3,C.metalD);P.r(31.5,10.5,1,1,C.fireL);}
export function bCamp(P,f){const C=PAL;P.tri(14,8,12,18,'#5c6a8a');P.atop(2,8,25,18,()=>{P.tl(28,16,10,52,'#45506a',1);P.tl(30,16,46,52,'#45506a',1);P.speck(2,10,25,15,'#6e7c9c',9);});P.tri(14,16,3,10,'#2a2c34');
  P.tri(48,6,13,20,C.canvas);P.atop(35,6,27,20,()=>{P.tl(96,12,80,52,C.canvasD,1);P.tl(96,12,112,52,C.canvasD,1);P.dith(36,23,25,2,C.canvasD,0);});P.tri(48,14,3,12,'#242418');
  P.flag(30,1,f,25);
  P.r(26,20,6,6,C.metal);P.r(26,20,6,1,C.metalL);P.r(26.5,22,5,.5,C.metalD);P.r(26.5,24,5,.5,C.metalD);
  P.r(20,24,4,2,C.woodD);P.r(20,24,4,.5,C.woodL);P.r(52,23,5,3,C.olive);P.r(52,23,5,.5,C.oliveL);}
export function bDepot(P){const C=PAL;P.r(2,4,2,30,C.metal);P.r(2,4,.5,30,C.metalL);P.r(58,4,2,30,C.metal);P.r(58,4,.5,30,C.metalL);P.r(0,2,62,3,C.oliveD);P.dith(0,5,62,3,C.olive,0);
  for(let x=0;x<62;x+=5)P.line(x,5,x+3,9,C.oliveD);P.camo(0,2,62,8,['#6a7c3a','#2f3b1a'],83,30);for(let x=3;x<60;x+=7)P.r(x,9,.5,2,C.oliveD);P.r(20,33,22,1,'#4a4a3e');}
export function bTower(P,f){const C=PAL;P.line(2,67,10,4,C.metalL);P.line(18,67,10,4,C.metalL);for(let y=60;y>8;y-=8){const k=(67-y)/63*8;P.tl((2+k)*R,y*R,(18-k)*R,(y-8)*R,C.metal,1);P.tl((18-k)*R,y*R,(2+k)*R,(y-8)*R,C.metal,1);P.r(2+k,y,16-2*k,.5,C.metalD);}
  P.r(10,0,.5,6,C.greyL);P.ell(6,14,2,4,C.greyL);P.ell(6,14,1,3,C.grey);P.ell(14,22,2,3,C.greyL);P.ell(14,22,1,2,C.grey);P.r(13,58,9,10,C.metal);P.r(13,58,9,1,C.metalL);P.r(15,61,4,2,'#1a1c18');P.r(16,61.5,1,.5,'#7cff6a');P.r(10,0,1,1,f%2?C.redL:C.red);}
export function bRadar(P,f){const C=PAL;P.r(4,28,26,12,'#6a6c5c');P.r(4,28,26,1,'#8a8c7a');P.r(8,32,6,3,'#1a1a16');P.r(8,32,6,.5,'#3a3a30');P.r(18,31,8,9,'#2a2a24');P.r(18,31,8,.5,'#4a4a40');P.r(16,16,2,12,C.metal);P.r(16,16,.5,12,C.metalL);
  for(let x=6;x<30;x+=5)P.r(x,29,.5,11,'#5a5c4e');P.r(27,26,2,2,C.metalD);
  const w=[13,9,4][f%3];P.ell(17,12,w,4,C.greyL);P.ell(17,12,Math.max(1,w-2),2,C.grey);P.r(17,4,1,8,C.metalD);P.r(17,4,1,1,C.redL);}
export function bHermit(P){const C=PAL;P.r(4,12,30,18,C.wood);for(let y=13;y<30;y+=3){P.r(4,y,30,.5,C.woodD);P.r(4,y+.5,30,.5,C.woodL);}P.r(4,12,1,18,C.woodD);P.r(33,12,1,18,C.woodD);
  P.tri(19,2,18,10,C.rust);P.atop(1,2,37,10,()=>{for(let x=2;x<74;x+=4)P.t(x,4,1,20,'#6f3a22');P.speck(1,2,37,10,'#a35a32',3);});P.r(1,11,36,1,C.woodD);
  P.r(9,16,6,5,'#ffd27a');P.r(11,16,1,5,C.woodD);P.r(9,18,6,.5,C.woodD);P.r(8.5,15.5,7,.5,C.woodL);P.r(22,18,7,12,'#2a2014');P.r(22,18,7,.5,C.woodL);P.r(27.5,24,.5,.5,C.gold);
  P.r(28,0,3,8,C.metal);P.r(28,0,3,.5,C.metalL);P.r(35,22,6,8,C.metal);P.ell(38,22,3,2,C.metalL);P.r(36,24,4,.5,C.metalD);P.r(36,27,4,.5,C.metalD);}
export function bCache(P,open){const C=PAL;if(open){P.r(1,6,10,3,C.woodD);P.line(1,5,5,8,C.wood);return;}P.r(1,3,10,6,C.wood);P.r(1,3,10,1,C.woodL);P.line(1,3,10,8,C.woodD);P.r(5,5,2,1,C.goldD);P.dith(0,1,12,3,C.oliveD,0);}
export function bStake(P,f){const C=PAL;P.r(2,4,1,7,C.wood);P.r(2,4,.5,7,C.woodL);P.r(0,0,5,4,f?C.grey:C.gold);P.r(0,0,5,1,f?C.greyL:C.fireL);P.r(2,2,1,1,f?C.greyD:C.goldD);}
export function bBoards(P){const C=PAL;for(let i=0;i<20;i++){P.r(i,Math.round(i*9/19),2,2,C.wood);P.r(i,9-Math.round(i*9/19),2,2,C.woodL);}P.r(4,2,1,1,C.metalD);P.r(16,2,1,1,C.metalD);}
export function iGun(P){const C=PAL;P.r(0,0,8,1,C.metalD);P.r(0,0,8,.5,C.metal);P.r(0,1,3,2,C.wood);P.r(4,1,1,2,C.metalD);}
export function iTool(P){const C=PAL;P.r(1,1,1,6,C.wood);P.r(0,0,3,2,C.greyL);P.r(3,4,2,3,C.oliveD);}
export function iAgro(P){const C=PAL;P.r(0,0,6,4,C.wood);P.r(0,0,6,1,C.woodL);P.line(0,0,5,3,C.woodD);}
export function iBar(P){const C=PAL;P.r(0,0,5,1,C.gold);P.r(0,0,2,.5,C.fireL);}
