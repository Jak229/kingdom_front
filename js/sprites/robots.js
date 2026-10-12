/* Robots and animals: the first-front robots, the service dog, crows, and the later-front robots and bosses (v17). */
import {FAC,PAL,R} from './core.js';

/* enemies */
export function robot(P,f){const C=PAL,s=f%2;
  P.r(3+s,12,2,4,C.robD);P.r(7-s,12,2,4,C.robD);P.r(2+s,15,3,1,C.robD);P.r(7-s,15,3,1,C.robD);
  P.r(3.5+s,12.5,1,1,C.robL);P.r(7.5-s,12.5,1,1,C.rob);P.r(2+s,15,3,.5,'#3a3540');P.r(7-s,15,3,.5,'#3a3540');
  P.r(2,4,8,8,C.rob);P.r(2,4,8,1,C.robL);P.r(2,4,1,8,C.robL);P.r(3,9,6,1,C.robD);
  P.r(3.5,5.5,3,2.5,C.robD);for(let i=0;i<3;i++)P.r(4,6+i*.5+i*.25,2,.5,'#4c4554');// chest vent
  P.r(7,8,.5,.5,C.robL);P.r(9,10.5,.5,.5,C.robL);P.r(2.5,10.5,.5,.5,C.robD);P.r(6,10,3,1,C.rust);P.r(6.5,10,1,.5,'#a65c33');
  P.r(3,1,7,3,C.robD);P.r(3,1,7,.5,'#3a3540');P.r(5,0,1,1,C.robL);P.r(5,-.0,.5,.5,'#8c8496');
  P.r(7.5,2,2.5,.5,'#3a1a1a');// visor slit
  P.r(8,5,2,2,C.eye);P.r(9,5,.5,.5,'#ffd0a0');P.r(8,6.5,2,.5,'#b02818');
  P.r(0,6,2,4,C.robD);P.r(0,6,2,.5,C.rob);P.r(.5,9.5,1,1,C.metal);P.r(10,6,2,3,C.robD);P.r(10,6,2,.5,C.rob);P.r(11,8.5,1,1.5,C.metal);}
export function brute(P,f){const C=PAL,s=f%2;
  P.r(5+s,17,3,5,C.robD);P.r(12-s,17,3,5,C.robD);P.r(4+s,21,5,2,C.robD);P.r(11-s,21,5,2,C.robD);P.r(5.5+s,18,2,1,C.rob);P.r(12.5-s,18,2,1,C.rob);
  P.r(3,5,14,12,C.rob);P.r(3,5,14,2,C.robL);P.r(3,5,2,12,C.robL);P.r(5,13,10,2,C.robD);
  P.r(6,8,6,4,C.robD);P.r(6.5,8.5,5,3,'#2c2833');for(let i=0;i<4;i++)P.r(7+i*1.2,9,.5,2,'#4a4352');// armour plate
  for(const [x,y] of [[4,7],[15.5,7],[4,14.5],[15.5,14.5],[9,12.5]])P.r(x,y,.5,.5,'#8c8496');
  P.r(0,5,4,5,C.robD);P.r(16,5,4,5,C.robD);P.r(0,5,4,1,C.rob);P.r(16,5,4,1,C.rob);
  P.r(0,10,3,6,C.rob);P.r(17,10,3,6,C.rob);P.r(17,15,3,2,C.robD);P.r(0,15,3,2,C.robD);P.r(17.5,16.5,1,1,C.metalL);P.r(18.5,16.5,1,1,C.metalL);
  P.r(6,1,9,4,C.robD);P.r(6,1,9,.5,'#3a3540');P.r(11,3.5,5,.5,'#3a1a1a');
  P.r(13,8,4,2,C.eye);P.r(16,8,.5,.5,'#ffd0a0');P.r(13,9.5,4,.5,'#b02818');P.r(6,9,4,1,C.rust);P.r(8,0,1,1,C.robL);P.r(8,0,.5,.5,'#8c8496');}
export function recon(P,f){const C=PAL;P.r(5,3,6,3,C.metalD);P.r(6,3,4,1,C.metal);P.r(6,3,2,.5,C.metalL);P.r(1,2,14,1,C.metalD);P.r(1,2,14,.5,C.metal);
  if(f%2){P.r(0,0,4,.5,C.greyL);P.r(12,0,4,.5,C.greyL);P.r(0,.5,4,.5,C.grey);P.r(12,.5,4,.5,C.grey);}else{P.r(1,0,2,1,C.greyL);P.r(13,0,2,1,C.greyL);}
  P.r(1.5,1,1,1,C.metalD);P.r(13.5,1,1,1,C.metalD);P.r(7,6,2,1,C.metalD);P.r(8,6,1,1,C.eye);P.r(7.5,6.5,.5,.5,C.glassL);}
export function carrier(P,f){const C=PAL;
  if(f%2){P.r(0,0,9,.5,C.greyL);P.r(19,0,9,.5,C.greyL);P.r(0,.5,9,.5,C.grey);P.r(19,.5,9,.5,C.grey);}else{P.r(2,0,5,1,C.greyL);P.r(21,0,5,1,C.greyL);}
  P.r(3,1,3,2,C.metalD);P.r(22,1,3,2,C.metalD);P.r(3,3,22,1,C.metalD);P.r(3,3,22,.5,C.metal);
  P.r(9,2,11,5,C.rob);P.r(9,2,11,1,C.robL);P.r(10,7,9,1,C.robD);P.r(17,4,2,1,C.eye);P.r(18,4,.5,.5,'#ffd0a0');P.r(12,4,1,1,C.robD);
  P.r(10,5,6,.5,C.robD);P.r(11,3,.5,.5,'#8c8496');P.r(15,3,.5,.5,'#8c8496');
  P.line(11,8,9,11,C.metalD);P.line(17,8,19,11,C.metalD);P.r(8.5,11,1.5,1,C.metalL);P.r(18.5,11,1.5,1,C.metalL);}
export function walker(P,f){const C=PAL,s=f%2;
  const leg=(x,ph)=>{const k=ph?3:-2;for(const o of [0,1,2]){P.line(x+o,21,x+o+k,29,C.robD);P.line(x+o+k,29,x+o,35,C.robD);}
    P.r(x-2,35,7,3,C.robD);P.r(x-2,35,7,.5,C.rob);P.r(x+k,28.5,2,2,C.robL);P.r(x+k+.5,29,1,1,C.metalL);P.r(x+.5,22,2,.5,C.robL);
    P.tl((x+k+3)*R,29*R,(x+3)*R,35*R,'#3a3540',1);};
  leg(9,s);leg(27,1-s);
  P.r(3,8,32,14,C.rob);P.r(3,8,32,2,C.robL);P.r(3,8,2,14,C.robL);P.r(5,19,30,3,C.robD);
  for(let x=7;x<34;x+=6)P.r(x,10.5,.5,8,'#2e2a33');for(let x=6;x<34;x+=3)P.r(x,19.5,.5,.5,'#8c8496');
  P.r(8,12,7,4,C.robD);P.r(9,13,5,2,C.rust);P.r(9.5,13,2,.5,'#b06a3a');P.r(19,12,6,3,C.robD);for(let i=0;i<3;i++)P.r(19.5,12.5+i,5,.5,'#4a4352');
  P.r(30,3,11,9,C.robD);P.r(31,3,9,1,C.robL);P.r(31,10,9,.5,'#2e2a33');P.r(34,6,6,.5,'#3a1a1a');
  P.r(36,6,4,2,C.eye);P.r(39,6,.5,.5,'#ffd0a0');P.r(36,7.5,4,.5,'#b02818');
  P.r(33,14,9,2,C.metalD);P.r(33,14,9,.5,C.metal);P.r(41,13,1,4,C.metalD);P.r(38,14,.5,2,C.metal);
  P.r(0,10,4,7,C.robD);P.r(0,10,4,.5,C.rob);P.r(15,3,3,5,C.robL);P.r(15.5,3.5,2,.5,'#8c8496');P.r(21,0,1,8,C.metalL);P.r(21,0,1,1,C.eye);}
export function dog(P,f){const C=PAL,B='#5e4129',D='#33251a',T='#a8794a';
  if(f===4){P.r(4,3,4,5,B);P.r(5,4,2,4,T);P.r(3,7,7,2,B);P.r(8,0,4,4,B);P.r(11,2,3,2,T);P.r(13,2,.5,.5,C.black);P.r(9,0,1,1,D);P.r(10,0,.5,1,D);P.r(10.5,1.5,.5,.5,C.black);P.r(4,4,3,1,FAC.m);P.r(5,4.5,.5,.5,C.gold);P.r(1,7,2,1,B);P.r(0,6,1,1,B);return;}
  if(f>=5){const up=f===6;P.r(2,2,8,3,B);P.r(3,2,5,1,D);P.r(3,4,6,1,T);P.r(4,2,3,2,FAC.m);P.r(9,4,3,3,B);P.r(11,6,2,2,T);P.r(12,7,.5,.5,C.black);P.r(10,3,1,1,D);
    P.line(0,0,2,2,B);P.r(2,5,1,4,B);P.r(4,5,1,4,B);P.r(8,6,1,3,B);P.r(up?10:9,up?6:7,1,2,B);return;}
  const L=[[3,5,8,10],[2,4,9,11],[3,5,8,10],[4,5,8,9]][f%4];
  P.r(2,3,9,3,B);P.r(3,3,6,1,D);P.r(3,5,7,1,T);P.r(5,3,3,2,FAC.m);P.r(6,3.5,.5,.5,C.gold);
  P.r(10,1,3,3,B);P.r(12,2,2,2,T);P.r(13.5,2,.5,.5,C.black);P.r(10,0,1,1,D);P.r(11,0,.5,1,D);P.r(11.5,2,.5,.5,C.black);P.line(0,1,2,3,B);
  for(const x of L){P.r(x,6,1,3,B);P.r(x,8.5,1,.5,D);}}
export function crow(P,f){const C=PAL,K1='#1b1b1f',K2='#34343c';
  if(f<2){const pk=f===1;P.r(1,1+(pk?1:0),4,2,K1);P.r(1.5,1+(pk?1:0),2,.5,K2);P.r(4,pk?2.5:.5,2,1.5,K1);P.r(6,pk?3.5:1,1,.5,'#3a3426');P.r(5,pk?2.5:.5,.5,.5,'#c9b070');P.r(0,2+(pk?.5:0),1.5,.5,K1);P.r(2,3,.5,2,'#3a3426');P.r(3.5,3,.5,2,'#3a3426');return;}
  const up=f===2;P.r(1,2,5,1.5,K1);P.r(5.5,1.5,1.5,1,K1);P.r(7,2,.5,.5,'#3a3426');P.r(0,2.5,1,.5,K1);
  if(up){P.line(2,2,1,0,K1);P.line(3,2,4,0,K2);}else{P.line(2,3,1,4,K1);P.line(3,3,4,4,K2);}}

/* vehicles: facing right; crew variants carry the commander and the garrison flag */

/* ---------- later-front robots (v17): all face right like the others ---------- */
// draws another sprite shifted by (dx,dy) art pixels
function shift(P,dx,dy){return {r:(x,y,w,h,c)=>P.r(x+dx,y+dy,w,h,c),line:(a,b,c2,d,col)=>P.line(a+dx,b+dy,c2+dx,d+dy,col)};}
const HAZ='#c9a227',HAZD='#1d1b18',CYAN='#5fd6d0',CYANL='#b8fff8';
// shield bearer: a riot slab on the arm; frames 0-1 whole, 2-3 cracked, 4-5 shield gone
export function shieldbot(P,f){const C=PAL,s=f%2,st=f>>1;
  robot(P,s);
  if(st===2){P.r(10,6.5,2.5,1.5,C.metalD);P.r(12,6,1,2.5,C.metal);P.r(12.5,6.5,.5,.5,C.metalL);return;}
  P.r(10,7,2,1.5,C.robD);// forearm to the grip
  P.r(11,1,5,14,C.metal);P.r(11,1,5,1,C.metalL);P.r(11,1,1,14,C.metalL);P.r(11,14,5,1,C.metalD);P.r(15.5,1,.5,14,C.metalD);
  P.r(12.5,3.5,3,1.5,'#14120f');P.r(13,4,1.5,.5,C.eye);// viewport
  for(const y of [2,7.5,12.5]){P.r(12,y,.5,.5,C.metalL);P.r(14.5,y,.5,.5,C.metalD);}
  P.r(11,9.5,5,1.5,HAZ);for(let i=0;i<3;i++)P.r(11.5+i*1.6,9.5,.6,1.5,HAZD);
  if(st===1){P.line(12,1,13.5,5,'#1a1a18');P.line(13.5,5,12.5,8.5,'#1a1a18');P.line(13.5,5,15.5,7,'#1a1a18');P.line(14,11,15.5,13.5,'#1a1a18');
    P.clr(15,1,1,2);P.clr(11,13.5,1.5,1.5);P.r(13.5,5,.5,.5,C.metalL);}}
// jumper: thin body on two coil springs; 0-1 walk, 2 squat, 3 in the air
export function jumper(P,f){const C=PAL,s=f%2,sq=f===2,air=f===3,dy=sq?3:0;
  const spring=(lx,top,bot)=>{for(let y=top;y<bot;y+=1){const o=((y|0)%2)?.6:-.2;P.r(lx+o,y,1.8,.5,C.greyL);P.r(lx+o,y+.5,1.8,.5,C.greyD);}};
  const foot=(lx)=>{P.r(lx-.8,17.5,3.2,1.5,C.robD);P.r(lx-.8,17.5,3.2,.5,C.rob);};
  if(air){spring(3,10,16);spring(7.2,10,16);P.r(2.2,16,3,1.2,C.robD);P.r(6.4,16,3,1.2,C.robD);}
  else{const a=sq?0:s*.6,b=sq?0:-s*.6;spring(3.2+a,10+dy,17.5);spring(7+b,10+dy,17.5);foot(3.4+a);foot(7.2+b);}
  P.r(2.5,3+dy,7,7,C.rob);P.r(2.5,3+dy,7,1,C.robL);P.r(2.5,3+dy,1,7,C.robL);P.r(3.5,9+dy,5,1,C.robD);
  P.r(2.5,6.5+dy,7,1.2,HAZ);for(let i=0;i<3;i++)P.r(3.2+i*2.2,6.5+dy,.8,1.2,HAZD);
  P.r(3.5,0+dy,6,3,C.robD);P.r(3.5,0+dy,6,.5,'#3a3540');P.r(7,1+dy,2,1,C.eye);P.r(8.5,1+dy,.5,.5,'#ffd0a0');
  if(air){P.r(1,1,1.5,4,C.robD);P.r(9.5,1,1.5,4,C.robD);P.r(1,.5,1.5,.5,C.robL);P.r(9.5,.5,1.5,.5,C.robL);}
  else{P.r(1,4+dy,1.5,4,C.robD);P.r(9.5,4+dy,1.5,4,C.robD);P.r(1,7.5+dy,1.5,.5,C.metal);P.r(9.5,7.5+dy,1.5,.5,C.metal);}}
// bomber: a rolling sphere with a warning lamp on a short stalk; 4 roll frames
export function bomber(P,f){const C=PAL,a=f*Math.PI/4;
  P.ell(5.5,7,5.5,5.5,C.rob);
  P.atop(0,1,12,12,()=>{P.ell(3.5,4.5,3.5,2.5,C.robL);P.ell(7.5,10.5,4.5,2.5,C.robD);
    for(const k of [0,1]){const b=a+k*Math.PI/2,cx=5.5,cy=7,dx=Math.cos(b)*6,dy=Math.sin(b)*6;P.line(cx-dx,cy-dy,cx+dx,cy+dy,'#2a2630');}
    const b=a+Math.PI/4;for(let i=0;i<3;i++){const t=b+i*.22;P.r(5.5+Math.cos(t)*4.6-.5,7+Math.sin(t)*4.6-.5,1.2,1.2,i%2?HAZD:'#d0782a');}
    P.r(4.5,6,2,2,C.robD);P.r(5,6.5,1,1,'#8c8496');});
  P.r(5,0,1.2,1.6,C.metalD);P.r(4.6,0,2,1,C.metal);}
// jammer: a robot with a generator pack and a dish on a mast
export function jammer(P,f){const C=PAL,s=f%2;
  robot(shift(P,1,7),s);
  P.r(0,9,3,8,C.metalD);P.r(0,9,3,.5,C.metal);for(let i=0;i<3;i++)P.r(.4,10.5+i*2.2,2.2,.8,CYAN);
  P.r(4.5,2,1,6,C.metalL);P.r(5,2,.5,6,C.metal);
  P.r(5.5,0,1,5,C.grey);P.r(6.5,.5,1,4,C.greyL);P.r(7.5,1.5,.5,2,C.greyL);P.r(6.5,2.25,3,.5,C.metalL);
  P.r(9.5,1.75,1.5,1.5,s?CYANL:CYAN);P.r(0,7,4,1,C.robD);}
// ram: tracked hull with a beam and a spiked head
export function ram(P,f){const C=PAL,s=f%2;
  P.r(3,17,32,7,'#1e1e1c');P.ell(4,20.5,3,3.5,'#1e1e1c');P.ell(34,20.5,3,3.5,'#1e1e1c');
  for(let x=2+s*1.5;x<36;x+=3){P.r(x,16.8,1.4,.6,'#45423d');P.r(x,23.5,1.4,.5,'#45423d');}
  for(let i=0;i<6;i++){const cx=5+i*5.8;P.ell(cx,20.5,2,2,'#4a433d');P.r(cx-.5,20,1.5,1.5,'#6c6c64');P.r(cx+(s?.5:-.5),20.5,.5,.5,'#2b2724');}
  P.r(4,8,30,9,C.rob);P.r(4,8,30,1.5,C.robL);P.r(4,8,1.5,9,C.robL);P.r(4,15,30,2,C.robD);
  for(let i=0;i<6;i++)P.r(34+i*.5,9+i,1,8-i,C.rob);P.r(34,9,1,.5,C.robL);
  P.r(9,11,7,3,C.rust);P.r(9.5,11,3,.5,'#b06a3a');P.r(20,12,9,.5,'#2e2a33');for(let x=7;x<34;x+=4)P.r(x,15.5,.5,.5,'#8c8496');
  P.r(17,3,11,5,C.robD);P.r(17,3,11,.5,'#3a3540');P.r(22,5,5,1,C.eye);P.r(26,5,.5,.5,'#ffd0a0');P.r(22,6,5,.5,'#b02818');
  P.r(7,1,2,7,C.metalD);P.r(6.5,1,3,1,C.metal);P.r(11,3,1.5,5,C.metalD);P.r(10.5,3,2.5,.8,C.metal);
  P.r(34,11,8,3,C.metalD);P.r(34,11,8,1,C.metalL);
  P.r(41,7,3,10,C.metal);P.r(41,7,1,10,C.metalL);P.r(43.5,7,.5,10,C.metalD);
  for(let i=0;i<4;i++)P.r(41,8+i*2.5,3,1.2,i%2?HAZD:HAZ);
  for(const y of [8,11.5,15])P.r(44,y,2,1,C.metalL);}
// hive: a slow flying mothership with four rotors and a glowing hatch
export function hive(P,f){const C=PAL,s=f%2;
  for(const x of [8,18,34,44]){P.r(x,1.5,1,3,C.metalD);if(s){P.r(x-5,1,11,.5,C.greyL);P.r(x-5,1.5,11,.5,C.grey);}else P.r(x-2.5,.5,6,1,C.greyL);P.r(x-.5,1.5,2,1,C.metal);}
  P.r(6,4,40,1.5,C.metalD);P.r(6,4,40,.5,C.metal);
  P.ell(25.5,11,22,6.5,C.rob);
  P.atop(0,4,52,18,()=>{P.ell(23,8,17,2.5,C.robL);P.r(0,15,52,3,C.robD);});
  for(let i=0;i<6;i++){P.r(10+i*5,10.5,1.5,1.5,'#7a4bb0');P.r(10.25+i*5,10.75,.5,.5,'#c99cff');}
  P.r(18,16.5,14,3,C.robD);P.r(19,18.5,12,1.5,'#3a2550');P.r(20,19,10,1,'#b06cff');
  P.r(39,8,6,3,C.robD);P.r(40,9,4,1,C.eye);P.r(43.5,9,.5,.5,'#ffd0a0');
  P.r(4,12,3,2,C.metalD);P.r(46,13,3,1,C.metalD);P.r(24,2,1,2.5,C.metalL);P.r(24,1.5,1,.8,C.eye);}
// howitzer: a crab platform with a long barrel; 0-1 walk, 2 dug in and firing
export function howitzer(P,f){const C=PAL,s=f%2,dep=f===2;
  const leg=(hx,kx,fx)=>{for(const o of [0,.8]){P.line(hx+o,20,kx+o,24,C.robD);P.line(kx+o,24,fx+o,29,C.robD);}P.r(kx-.2,23.4,1.6,1.6,C.robL);P.r(fx-1,28.5,3.5,1.5,C.robD);P.r(fx-1,28.5,3.5,.5,C.rob);};
  if(dep){leg(11,6,3);leg(17,14,12);leg(27,30,31);leg(33,38,41);}
  else{const a=s?1.5:-1.5;leg(11,8+a,6+a);leg(17,15-a,15-a);leg(27,29-a,29-a);leg(33,36+a,37+a);}
  P.r(7,12,28,9,C.rob);P.r(7,12,28,1.5,C.robL);P.r(7,12,1.5,9,C.robL);P.r(7,19,28,2,C.robD);
  P.r(10,15,8,2.5,C.rust);P.r(10.5,15,3,.5,'#b06a3a');for(let x=9;x<34;x+=4)P.r(x,19.5,.5,.5,'#8c8496');
  for(let i=0;i<3;i++)P.r(21+i*3,14.5,.6,3.5,'#2e2a33');
  P.r(18,7,12,6,C.robD);P.r(18,7,12,.5,'#3a3540');P.r(25,9,4,1,C.eye);P.r(28.5,9,.5,.5,'#ffd0a0');
  if(dep){for(const o of [0,1,1.8])P.line(28,8.5+o,40,0+o,C.metalD);P.line(28,8.5,40,0,C.metal);P.r(39,0,3,3,C.metal);P.r(39,0,3,.6,C.metalL);P.r(41.5,0,.5,3,C.metalD);}
  else{for(const o of [0,1,1.8])P.line(29,9+o,43,6+o,C.metalD);P.line(29,9,43,6,C.metal);P.r(42,5,3,4,C.metal);P.r(42,5,3,.6,C.metalL);P.r(44.5,5,.5,4,C.metalD);}
  P.r(15,4,2,3,C.metalD);P.r(14.5,4,3,.8,C.metal);}
// colossus: an upright titan with a pulse coil on its back, a reactor core in the chest and an arm cannon
export function colossus(P,f){const C=PAL,s=f%2;
  const leg=(x,ph)=>{const k=ph?2:-1.5;P.r(x,29,6,8,C.robD);P.r(x+.5,29,1.2,8,C.rob);P.r(x+k-.5,36,7,3,C.robL);P.r(x+k+1,36.5,3,2,C.metalL);
    P.r(x+k,39,6,7,C.robD);P.r(x+k+.5,39,1.2,7,C.rob);P.r(x+k-1.5,45,9,3,C.robD);P.r(x+k-1.5,45,9,.6,C.rob);};
  leg(10,s);leg(22,1-s);
  P.r(8,26,22,4,C.robD);P.r(8,26,22,.6,C.rob);
  P.r(5,0,7,11,C.metalD);P.r(5,0,7,.6,C.metal);for(let i=0;i<4;i++){P.r(4,1.5+i*2.4,9,1,CYAN);P.r(4,2.5+i*2.4,9,.4,'#2b6e6a');}
  P.r(7,9,24,18,C.rob);P.r(7,9,24,2,C.robL);P.r(7,9,2,18,C.robL);P.r(9,24,22,3,C.robD);
  for(let x=10;x<30;x+=4)P.r(x,24.5,.5,.5,'#8c8496');P.r(10,19,4,3,C.rust);P.r(10.5,19,2,.5,'#b06a3a');
  P.r(15,12,9,8,C.robD);P.r(16,13,7,6,'#173b3a');P.r(17,14,5,4,CYAN);P.r(18,14.5,2,1.5,CYANL);
  P.r(15,1,11,8,C.robD);P.r(15,1,11,.6,'#3a3540');P.r(16,7,9,.5,'#2e2a33');P.r(19,4,6,.6,'#3a1a1a');P.r(19,4.5,5,1.5,C.eye);P.r(23.5,4.5,.5,.5,'#ffd0a0');P.r(19,6,5,.5,'#b02818');
  P.r(1,8,8,6,C.robD);P.r(1,8,8,1,C.rob);P.r(2,10,.5,.5,'#8c8496');P.r(2,14,5,10,C.robD);P.r(1.5,23,6,4,C.rob);P.r(1.5,23,6,.6,C.robL);
  P.r(28,8,9,6,C.robD);P.r(28,8,9,1,C.rob);P.r(35,10,.5,.5,'#8c8496');P.r(30,14,5,8,C.robD);
  P.r(30,20,10,4,C.metalD);P.r(30,20,10,.8,C.metal);P.r(39,19.5,1.5,5,C.metalD);P.r(34,21,.6,3,C.metal);
  P.r(26,0,1,2,C.metalL);P.r(26,0,1,.8,C.eye);}
