/* Vehicles and wrecks: MaxxPro, Ural, BRDM-2, T-64BV, BTR-80, KrAZ, the launcher and rocket, crew heads. */
import {FAC,PAL,R,tone} from './core.js';

/* real-world vehicles, side view facing right. Polygons are filled per texel row so sloped armour reads cleanly */
function pfill(P,pts,col){let y0=1e9,y1=-1e9;for(const [,y] of pts){y0=Math.min(y0,y);y1=Math.max(y1,y);}
  for(let ty=Math.floor(y0*R);ty<Math.ceil(y1*R);ty++){const yc=(ty+.5)/R,xs=[];
    for(let i=0;i<pts.length;i++){const [ax,ay]=pts[i],[bx,by]=pts[(i+1)%pts.length];if((ay<=yc&&by>yc)||(by<=yc&&ay>yc))xs.push(ax+(yc-ay)/(by-ay)*(bx-ax));}
    xs.sort((a,b)=>a-b);for(let k=0;k+1<xs.length;k+=2){const a=Math.round(xs[k]*R),b=Math.round(xs[k+1]*R);if(b>a)P.t(a,ty,b-a,1,col);}}}
function bolts(P,x0,x1,y,step,col){for(let x=x0;x<=x1;x+=step)P.t(Math.round(x*R),Math.round(y*R),1,1,col);}
// small steel road wheel of a tracked vehicle
function roadWheel(P,cx,cy,r,f,rub,disc){P.ell(cx,cy,r,r,rub||'#2a2a26');P.ell(cx,cy,r*.68,r*.68,disc||'#5d5e54');P.ell(cx,cy,r*.25,r*.25,'#34352f');
  const a=(f%2)*Math.PI/3;for(let k=0;k<3;k++){const an=a+k*Math.PI*2/3;P.t(Math.round((cx+.5+Math.cos(an)*r*.45)*R),Math.round((cy+.5+Math.sin(an)*r*.45)*R),1,1,'#41423a');}
  P.t(Math.round((cx+.5-r*.35)*R),Math.round((cy+.5-r*.4)*R),1,1,'#8c8d80');}

/* International MaxxPro MRAP: the commander rides inside; the crew variant adds the garrison flag on the whip antenna */
export function vMaxx(P,f,crew){const C=PAL,B=C.khaki,D=C.khakiD,L=C.khakiL,G='#26241e',DD='#5e5238';
  if(crew)P.flag(3,0,f,11);else P.r(3,1,.5,10,C.greyD);
  P.r(36.5,1,.5,10,C.greyD);P.r(36.5,1,.5,.5,C.greyL);
  // V-hull below the capsule, fender wells
  pfill(P,[[13,25],[35,25],[31.5,29.6],[16.5,29.6]],G);P.r(17,28.6,14,.6,'#3c3a32');
  // armoured capsule (crew box + cab), sloped windscreen, short hood
  pfill(P,[[2,11],[2.6,10.4],[37,10.4],[40.4,15.6],[46,17.6],[47.6,19.6],[47.6,25.6],[2,25.6]],B);
  P.r(2.6,10.4,34.4,.5,L);pfill(P,[[40.4,15.6],[46,17.6],[46.2,18.1],[40.4,16.1]],L);
  P.atop(2,22,46,4,()=>{P.r(2,22.5,46,3.1,D);P.dith(2,23.6,46,2,'#6a5a3c',1);});P.r(2,22.4,46,.5,DD);
  P.r(2,17.6,38,.5,D);P.r(2,18.1,38,.5,tone(B,.08));
  // windscreen and side glass: thick armoured panes
  pfill(P,[[37.3,11.2],[38.5,11.2],[40.7,15.3],[39.5,15.3]],C.glass);P.t(Math.round(38*R),Math.round(11.8*R),1,2,C.glassL);
  P.r(31,12,6.5,5,G);P.r(31.6,12.6,5.3,3.8,C.glass);P.r(32,13,1.5,1,C.glassL);
  for(const x of [8.5,19.5]){P.r(x,12.2,4,4,G);P.r(x+.6,12.8,2.8,2.8,C.glass);P.r(x+.9,13.1,1,.8,C.glassL);}
  // panel seams, door, hinges, handle, steps
  P.r(28,11,.5,14.5,D);P.r(5.5,11,.5,14.5,D);P.r(30,11.2,.5,11,D);P.r(38.5,16,.5,6.5,D);
  for(const y of [13.5,20])P.r(29.6,y,1,1.2,G);P.r(35.5,19.3,1.6,.5,G);
  P.r(30.8,25.6,5.5,.8,G);P.r(31.2,27,4.5,.5,C.metalL);P.r(31.4,26.4,.5,1,G);P.r(35.4,26.4,.5,1,G);
  bolts(P,3,36,11.2,2.5,D);bolts(P,3,27,24,3,DD);
  // hood louvres, brush guard, headlight, mirror
  for(let i=0;i<4;i++)P.r(41.6+i*1.3,19.2,.5,3.2,D);
  P.r(46.2,23.6,2,2.6,G);P.r(46.4,23.8,1.6,.5,C.metal);P.r(47.2,19.8,.6,1.6,G);P.r(46.6,20.1,1,1,C.fireL);P.t(Math.round(47*R),Math.round(20.2*R),1,1,'#ffffff');
  P.line(37.4,11.4,40.6,9.6,G);P.r(40.6,8.6,1,2.2,G);P.r(40.8,8.8,.5,1,C.glass);
  // rear ladder and tail light
  P.r(2.2,25.6,.5,4,G);P.r(4.2,25.6,.5,4,G);for(const y of [26.8,28.3])P.r(2.2,y,2.5,.4,C.metalL);P.r(2.1,19,.6,1.3,C.redL);
  // roll of tarp, jerrycans on the roof
  P.r(4,8.4,8,2,C.canvas);P.r(4,8.4,8,.5,C.canvasL);for(const x of [6,9.5])P.r(x,8.4,.5,2,G);
  // gunner protection kit with M2
  P.r(16.6,9,11,1.5,D);P.r(16.6,9,11,.5,L);
  pfill(P,[[17.4,9],[17.4,4.6],[18.8,3.6],[25,3.6],[25,9]],B);P.r(18.8,3.6,6.2,.5,L);P.r(17.4,6.8,7.6,.4,D);
  pfill(P,[[25,9],[25,3.2],[27.4,4.2],[27.4,9]],D);P.r(25.5,5,1.4,1.4,C.glass);
  P.r(26,5.6,2.6,1.4,G);P.r(28.4,6,6.4,.6,G);P.r(28.4,6,6.4,.2,C.metalL);P.r(34.4,5.7,1.1,1.2,G);P.r(23.6,6.4,1.6,1.6,C.oliveD);
  P.ins(33.6,20.8,2);
  // wells, wheels, mud flaps
  for(const x of [11,37])P.half(x,26,5.4,1.6,G);
  P.wheel(11,31,4,f);P.wheel(37,31,4,f);P.r(4.6,26,1,4.4,G);P.r(30.6,26,1,4.4,G);}

/* T-64BV: six small road wheels, rubber skirts, Kontakt-1 bricks, IR searchlight, NSVT on the cupola, drums at the back */
export function vT64(P,f,crew){const C=PAL,B='#55652f',D='#3b4721',L='#738a41',G='#21221c',RB='#33372a',RL='#4a4f3e',TR='#262622';
  if(crew)P.flag(20.5,0,f,12);else P.r(20.5,1,.5,11,C.greyD);
  // hull
  pfill(P,[[3,14],[47,14],[58.4,18.3],[58.4,19],[55,22.4],[4,22.4],[2.6,19]],B);
  P.r(3,14,44,.5,L);pfill(P,[[47,14],[58.4,18.3],[58.4,18.8],[47,14.5]],L);
  for(let i=0;i<5;i++){const x=47.8+i*2.1,y=14.3+i*.8;P.r(x,y,1.8,.9,'#62743a');P.r(x,y+.8,1.8,.3,D);}
  P.r(5,15,4,1.4,G);for(let i=0;i<3;i++)P.r(5.4+i*1.2,15.2,.5,1,'#4a4b42');
  // rear fuel drums and unditching log
  P.ell(3,11.6,2.1,2.1,D);P.ell(3,11.6,1.3,1.3,B);P.ell(3,11.6,.4,.4,G);P.r(.9,13.4,4.2,.5,G);
  P.ell(6.6,12.6,1,1,C.wood);P.ell(6.6,12.6,.4,.4,C.woodL);
  // track run, sprocket, idler, road wheels
  P.ell(5.6,23.4,2.7,2.7,TR);P.ell(54.6,22.6,2.5,2.5,TR);P.r(5.6,26,49,2,TR);
  for(let x=5;x<55;x+=1)P.t(Math.round((x+(f%2)*.5)*R),Math.round(27.3*R),1,1,'#47473f');
  P.ell(5.6,23.4,1.7,1.7,'#4a4b42');P.ell(5.6,23.4,.6,.6,G);for(let k=0;k<6;k++){const a=k*Math.PI/3+(f%2)*.5;P.t(Math.round((6.1+Math.cos(a)*2.3)*R),Math.round((23.9+Math.sin(a)*2.3)*R),1,1,'#4a4b42');}
  P.ell(54.6,22.6,1.5,1.5,'#55564c');P.ell(54.6,22.6,.5,.5,G);
  for(const x of [12,19,26,33,40,47])roadWheel(P,x,24.6,2,f);
  // rubber skirts and fender with stowage
  pfill(P,[[8,18],[52.4,18],[55.6,20.6],[55.6,21.8],[8,21.8]],RB);P.r(8,18,44.4,.5,RL);P.r(8,21.4,47.6,.4,'#24271f');
  for(let x=13.5;x<52;x+=5.5)P.r(x,18.4,.4,3.2,'#24271f');
  P.r(6,17,51,1,D);P.r(6,17,51,.4,L);
  P.r(28,15,6,2,B);P.r(28,15,6,.4,L);P.r(28,15,.4,2,D);P.r(31,15,.4,2,D);P.r(36,15.3,4,1.7,D);P.r(36,15.3,4,.4,B);
  P.r(10,16.1,16,.4,C.metal);for(const x of [10,25.6])P.ell(x,16.2,.6,.6,C.metal);
  P.r(55,16.4,1.4,1.1,G);P.r(55.8,16.6,.6,.7,C.fireL);
  // turret: low cast dome, Kontakt-1 crown, IR searchlight, cupola with NSVT, snorkel, stowage
  P.r(19.4,10.6,6,1,C.metal);P.r(19.2,10.5,.5,1.2,G);P.r(18.4,11.6,3,2.4,D);P.r(18.4,11.6,3,.4,B);
  P.half(31,14,11,5.6,B);pfill(P,[[36,9.4],[42.6,11.4],[44.2,14],[36,14]],B);P.half(30,10.6,8,2,L);P.r(20,13.6,24,.4,D);
  for(const [x,y] of [[34.6,7.6],[37,8.1],[39.3,8.9],[41.3,10.1]]){P.r(x,y,2.1,1.3,'#62743a');P.r(x,y+1.1,2.1,.3,D);P.r(x+1.9,y,.3,1.3,D);}
  P.r(43.6,10,1.6,3.2,D);P.r(36.6,12,1.4,.6,G);P.r(36.6,12.8,1.4,.6,G);
  P.r(39.4,6.6,3.2,2.4,D);P.r(39.4,6.6,3.2,.4,L);P.r(42.4,6.9,.6,1.8,'#7a2f22');
  P.r(25,6.6,5.2,2.2,D);P.r(25,6.6,5.2,.4,L);P.r(25.6,7.6,.6,.6,C.glass);P.r(27.6,7.6,.6,.6,C.glass);
  P.r(26.2,4.4,3,1.4,G);P.r(29,4.6,8.4,.5,G);P.r(36.8,4.4,.8,.9,G);P.r(27.2,5.6,.6,1.2,G);P.r(24.8,5.2,1.6,1.2,'#3a4223');
  P.r(32.6,7.4,2.4,1.2,D);P.r(34.6,7.6,.5,.6,C.glass);
  P.ins(27.6,11.2,2);
  // 125 mm gun: thermal sleeve bands, fume extractor
  P.r(45,10,6,1.6,D);P.r(45,10,6,.4,L);for(const x of [47,49.6])P.r(x,10,.4,1.6,G);
  P.r(51,9.7,4.6,2.2,D);P.r(51,9.7,4.6,.5,L);P.r(55.6,10.3,11.4,1.1,D);P.r(55.6,10.3,11.4,.35,L);P.r(66.6,10.1,1.6,1.4,G);
  P.camo(3,6,55,16,['#46562a','#66793a'],37,26);}

/* BRDM-2 scout car: boat hull, BPU-1 turret with KPVT, raised armoured windscreen covers */
export function vBRDM(P,f,crew){const C=PAL,B='#58682f',D='#3c4822',L='#78904a',G='#22231d';
  if(crew)P.flag(5,0,f,16);else P.r(5,1,.5,15,C.greyD);
  for(const x of [12,34])P.half(x,25.6,4.4,3.6,G);
  pfill(P,[[2.4,17.4],[9,15],[30,15],[40,19.4],[44.6,20.8],[44.4,21.8],[40.4,25.4],[6,25.4],[2,21.6]],B);
  P.atop(2,15,43,3.6,()=>P.r(2,15,43,3.6,tone(B,.07)));P.r(9,15,21,.5,L);pfill(P,[[30,15],[40,19.4],[40,19.9],[30,15.5]],L);
  P.r(3,18.6,38,.5,D);P.r(3,22.6,39,.5,D);P.atop(2,23,43,3,()=>P.dith(2,23.6,43,2,'#4a4a30',0));
  for(const x of [12,34])P.half(x,25.6,4.4,3,G);
  // windscreen with raised armour cover, side vision block
  pfill(P,[[31,15.5],[34.2,15.5],[37.6,17.6],[34.4,17.6]],C.glass);P.t(Math.round(32*R),Math.round(15.8*R),2,1,C.glassL);
  pfill(P,[[30.4,14.4],[37.6,13.7],[37.8,14.4],[30.6,15.1]],D);P.r(30.2,14.4,.6,1,G);
  P.r(26,15.8,2,1.1,G);P.r(26.3,16,1.4,.6,C.glass);
  // turret BPU-1, KPVT + PKT
  for(let y=10;y<15;y+=.5){const k=(y-10)/5;P.r(18.6-k*1.6,y,7.6+k*3.2,.5,y<10.6?L:B);}
  P.r(17.4,14.4,10.6,.6,D);P.r(19.6,9.2,2,.8,D);P.r(23,9.4,1,.6,D);
  P.r(26.6,11.4,2,2.6,D);P.r(28.6,12.2,12.4,.8,G);P.r(28.6,12.2,12.4,.25,C.metalL);P.r(40.6,12,1.2,1.2,G);P.r(28.6,11.4,4,.5,G);
  // headlight, storage box, firing port, exhaust
  P.r(40.6,18.4,1.6,1.1,G);P.r(41.6,18.6,.6,.7,C.fireL);
  P.r(13,19.4,6,2.4,D);P.r(13,19.4,6,.4,L);P.r(15.8,19.4,.4,2.4,G);
  P.ell(23.2,20.2,.7,.7,G);P.ell(23.2,20.2,.3,.3,'#4a4b42');
  for(let i=0;i<3;i++)P.r(3,18.8+i*.9,2.4,.4,G);P.r(2.6,22,1.2,1.6,G);
  bolts(P,10,29,15.6,2.5,D);
  P.ins(28.6,22.4,2);
  for(const x of [20,26]){P.r(x-1.2,25.4,2.4,1,'#1c1c19');P.r(x-.4,25.4,.8,.5,'#3a3a34');}
  P.camo(2,10,43,15,['#3f4c22','#6b7f3c'],23,22);
  P.wheel(12,26,3,f);P.wheel(34,26,3,f);}

/* Ural motorcycle with a sidecar (sidecar on the far side, in shadow) and a PKM on it */
export function vUral(P,f,crew){const C=PAL,B='#4f5f2c',D='#36421e',L='#6d8040',G='#1e1f1a',X=2;
  if(crew)P.flag(1,0,f,13);
  // sidecar: wheel, tub, machine gun
  P.ell(X+15,20.5,2.6,2.6,'#141412');P.ell(X+15,20.5,1.3,1.3,'#3a3a34');
  pfill(P,[[X+7,14.6],[X+20,14],[X+23.6,15.6],[X+22,18.6],[X+9,18.6]],D);P.r(X+8,14.3,12,.5,tone(D,.2));
  P.r(X+19,12.4,1.4,2,G);P.r(X+20.4,12.8,7,.5,G);P.r(X+20.4,12.8,7,.2,C.metalL);P.r(X+20,13.3,1.6,1.2,G);
  // frame, swingarm, engine with a boxer cylinder sticking out, exhaust
  P.line(X+4,20.5,X+10,16.4,C.metal);P.line(X+10,15,X+19.6,14,G);P.line(X+11,16,X+16.8,14.6,G);
  P.r(X+9,15.6,4.4,3.4,'#3c3f3a');P.r(X+9,15.6,4.4,.5,'#5a5e58');
  P.ell(X+14.4,17.2,1.9,1.5,'#7c7f78');for(let i=0;i<4;i++)P.r(X+13+i*.8,15.9,.3,2.6,'#5c5f58');P.ell(X+14.6,17.2,.6,.6,'#3c3f3a');
  P.line(X+13.6,18.8,X+3.6,19.6,'#8e8c82');P.r(X,19,4.4,1.3,'#6b6a62');P.r(X,19,4.4,.4,'#9a988c');
  // fuel tank, saddle, fenders, fork, headlight, bars
  pfill(P,[[X+10.6,12.6],[X+16.6,12],[X+18.8,13],[X+18,14.6],[X+11,14.6]],B);P.r(X+11.4,12.6,5,.5,L);P.r(X+12.4,13.4,1.6,.8,G);
  P.r(X+6.6,12.4,4.4,1.2,G);P.r(X+7,13.6,.5,1.6,C.metal);P.r(X+3,13.4,3.4,.6,C.metal);
  P.half(X+4,17.9,3.3,1.5,B);P.half(X+22,17.9,3.1,1.5,B);
  P.line(X+19.4,11.4,X+22,20.5,C.metalL);P.line(X+20,11.4,X+22.6,20.5,C.metal);
  P.r(X+19.6,10.4,2.4,2,B);P.r(X+21.6,10.8,.6,1.2,C.fireL);P.line(X+17.4,10,X+20,10.6,G);
  P.wheel(X+4,20.5,2.5,f);P.wheel(X+22,20.5,2.5,f);
  if(crew){// rider: helmet, goggles, garrison patch
    P.line(X+11.6,11,X+15.6,12.6,C.oliveD);P.line(X+15.6,12.6,X+16.2,16.4,C.oliveD);P.r(X+15.4,16.2,2,1,C.boot);
    pfill(P,[[X+7.6,11.6],[X+8.6,5.4],[X+12,5],[X+12.6,11.6]],C.olive);P.r(X+8.4,5.6,.6,6,C.oliveD);P.r(X+9.4,7,1.2,1.2,FAC.m);P.r(X+9.6,7.2,.5,.5,C.gold);
    P.line(X+11.6,6.6,X+18.6,10,C.olive);P.r(X+18.4,9.6,1,1,C.skin);
    P.r(X+9.4,2.6,3.2,2.6,C.skin);P.half(X+10.6,3.4,2.2,1.8,'#4a5a2a');P.r(X+8.6,3.2,4.6,.5,'#3c4a22');P.r(X+11,3.6,1.8,.7,G);P.r(X+11.2,3.7,.6,.4,C.glassL);
    P.r(X+7.2,6,1.6,4,C.oliveD);}}

/* BTR-80 with the spec-ops team riding on the roof */
export function vBTR80(P,f){const C=PAL,B='#56662e',D='#3b4721',L='#768d45',G='#21221c';
  for(const x of [9,14.5,20])commanderOp(P,x,4);
  for(const x of [11,20,32.5,42])P.half(x,24.4,3.7,2.8,G);
  pfill(P,[[2.4,16.6],[8.4,12.6],[46,12.6],[55.6,19],[55.6,19.8],[50,23.8],[5,23.8],[2,21]],B);
  P.atop(2,12.6,54,4.4,()=>P.r(2,12.6,54,4.4,tone(B,.07)));P.r(8.4,12.6,37.6,.5,L);pfill(P,[[46,12.6],[55.6,19],[55.4,19.5],[46,13.1]],L);
  P.r(3,17,46,.5,D);P.r(4,21.4,47,.5,D);P.atop(2,21.8,54,2.2,()=>P.dith(2,22.2,54,2,'#4a4a30',1));
  for(const x of [11,20,32.5,42])P.half(x,24.4,3.7,2.4,G);
  // driver windows with covers, headlights, nose
  pfill(P,[[47.2,13.4],[49.8,13.4],[51.3,14.5],[48.7,14.5]],C.glass);pfill(P,[[46.8,12.9],[50.2,12.6],[50.4,13.1],[47,13.4]],D);
  P.r(51.8,16.4,1.6,1.1,G);P.r(52.8,16.6,.6,.7,C.fireL);P.r(54,20,1.2,.8,G);
  // two-part side door between axles 2 and 3, firing ports, exhaust box, water jet
  P.r(23.4,13.4,5.4,8,D);P.r(23.8,13.8,4.6,3,B);P.r(23.8,17.4,4.6,3.6,B);P.r(27.4,18.8,.8,.4,G);P.r(23.4,21.4,5.4,.8,G);
  for(const x of [12,16.6,36,40.4]){P.ell(x,15,.8,.8,D);P.ell(x,15,.4,.4,G);}
  P.r(3.6,15.2,4,2,D);for(let i=0;i<3;i++)P.r(4+i*1.2,15.5,.5,1.4,G);P.r(2.4,21,1.4,1.8,G);
  P.r(10,19.2,10,.4,C.metal);bolts(P,9,45,13.2,3,D);
  // BPU-1 turret with KPVT, smoke dischargers on the back
  for(let y=9;y<12.6;y+=.5){const k=(y-9)/3.6;P.r(34.6-k*1.4,y,5+k*2.8,.5,y<9.6?L:B);}
  P.r(33,12.2,8.4,.5,D);P.r(40,10,1.8,2.4,D);P.r(41.8,10.6,13,.8,G);P.r(41.8,10.6,13,.25,C.metalL);P.r(54.6,10.4,1.2,1.2,G);P.r(41.8,9.9,3.6,.5,G);
  for(let i=0;i<3;i++)P.line(32.8-i*.3,10.8-i*.7,31.6-i*.3,10.2-i*.7,G);
  P.ins(26.1,19.2,2);
  P.camo(2,9,54,15,['#3f4c22','#6b7f3c'],53,24);
  for(const x of [11,20,32.5,42])P.wheel(x,24.5,2.5,f);}

/* KrAZ-6322 6x6 with a tarp body: long bonnet, flat front wings, spare wheel behind the cab */
export function vKrAZ(P,f){const C=PAL,B='#55662f',D='#3a4621',L='#74894a',G='#20211b',T=C.canvas,TD=C.canvasD,TL=C.canvasL;
  pfill(P,[[2,6.6],[3,5.6],[34,5.6],[35,6.6],[35,19],[2,19]],T);P.r(3,5.6,31,.6,TL);
  for(const x of [7.6,13.6,19.6,25.6,31.2]){P.r(x,6.2,.5,12.6,TD);P.r(x+.5,6.2,.4,12.6,TL);}
  for(let x=3.4;x<34;x+=3)P.r(x,17.6,.4,1.4,G);P.r(2,9.4,33,.4,TD);
  P.r(2,19,33,3,D);P.r(2,19,33,.5,L);for(let x=6;x<34;x+=6)P.r(x,19.4,.4,2.6,G);
  // spare wheel behind the cab, cab, door, mirror
  P.r(35,8.4,2.2,11,G);P.r(35.5,9,1.2,9.8,'#3a3a34');
  pfill(P,[[37,8],[44.2,8],[45.6,9.6],[45.6,21],[37,21]],B);P.r(37,8,7.2,.5,L);
  P.r(38.6,9.8,6.2,5,G);P.r(39.1,10.3,5.2,4,C.glass);P.r(39.6,10.7,1.6,1.2,C.glassL);
  P.r(38.2,9.4,.4,11.6,D);P.r(45.2,9.6,.4,11.4,D);P.r(43,16,1.4,.5,G);P.r(39.4,21,3.4,.8,G);
  P.line(45.6,10.2,47.6,9,G);P.r(47.6,8.4,.9,2.4,G);P.r(47.8,8.7,.4,1,C.glass);
  // bonnet with louvres, grille, bumper, wing over the front wheel
  pfill(P,[[45.6,13],[53.4,13.4],[55.2,14.6],[55.2,21],[45.6,21]],B);P.r(45.6,13,8,.5,L);
  for(let i=0;i<5;i++)P.r(47+i*1.2,15.4,.5,2.4,D);P.r(55.2,14.6,1.2,6.6,D);for(let y=15.2;y<21;y+=1.2)P.r(55.4,y,.8,.4,G);
  P.r(53.6,21,4.2,2.2,G);P.r(53.8,21.2,3.8,.5,C.metal);P.r(57,22.4,1,.9,C.metal);
  pfill(P,[[42,20.6],[52.2,20.6],[53,22.4],[41.4,22.4]],D);P.r(42,20.6,10.2,.4,L);
  P.r(53,18.4,1.6,1.4,G);P.r(54,18.7,.6,.8,C.fireL);
  // chassis, fuel tank, mud flaps, wells
  P.r(3,22,50,1.4,G);P.r(36.6,22,6,2.6,'#4a4e45');P.r(36.6,22,6,.5,'#6a6e62');P.r(39.4,22,.4,2.6,G);
  for(const x of [10,18.5,47])P.half(x,26,4.2,3.4,G);P.r(4.6,22.4,1,4.6,G);P.r(23.6,22.4,1,4.6,G);
  P.ins(41.6,18.2,2);
  P.camo(36,8,20,14,['#3f4c22','#6b7f3c'],61,10);
  P.wheel(10,26,3,f);P.wheel(18.5,26,3,f);P.wheel(47,26,3,f);}

/* 9K72 «Эльбрус»: MAZ-543 launcher. Frame 0: erector boom down (travel), frame 1: boom up beside the rocket on the rear launch table */
export function bLaunch(P,f){const C=PAL,B='#55652f',D='#3a4621',L='#738a41',G='#1f201b',M=C.metal,ML=C.metalL,MD=C.metalD;
  // launch table at the rear, jacks to the ground
  P.r(2.6,59.6,11.4,2,MD);P.r(2.6,59.6,11.4,.5,ML);for(const x of [3.6,12])P.r(x,61.6,1,6.4,MD);for(const x of [3,11.4])P.r(x,67.6,2.2,1,G);
  // chassis and deck stowage
  P.r(4,60,52,2.4,G);pfill(P,[[14,55.6],[48,55.6],[48,61.4],[14,61.4]],B);P.r(14,55.6,34,.5,L);
  for(const x of [20,27,34,41])P.r(x,56,.4,5.4,D);P.r(22,57.4,4,2.4,D);P.r(36,57.2,4,2.6,'#4a4e45');P.r(36,57.2,4,.5,'#6a6e62');
  // MAZ-543 fibreglass cab: rounded nose, two windows, door
  pfill(P,[[47.6,49.6],[58.6,49.6],[61.6,52.6],[62.4,56],[62.4,63.2],[47.6,63.2]],B);P.r(47.6,49.6,11,.5,L);
  pfill(P,[[55,51],[58.4,51],[60.8,53.4],[60.8,55.6],[55,55.6]],C.glass);P.r(55.6,51.6,1.6,1,C.glassL);
  P.r(49.4,51,4.6,4.6,C.glass);P.r(49.8,51.4,1.4,1,C.glassL);P.r(49,50.6,5.4,.4,G);P.r(54.4,50.6,.4,5.4,G);
  P.r(48.8,50.6,.4,12.6,D);P.r(54.6,56.2,.4,7,D);P.r(52.6,58,1.4,.5,G);P.r(61.4,59.6,1,1,C.fireL);P.r(61,61.6,1.6,1.6,G);
  P.r(47,62.4,16,1,G);
  for(const x of [21,30,45,54])P.half(x,65.6,4.6,3.6,G);
  P.ins(51.4,60,2);
  P.camo(4,49,59,14,['#3f4c22','#6b7f3c'],71,26);
  if(f){// erector boom upright with clamps toward the rocket, hydraulic ram
    for(const x of [13.6,16.4]){P.r(x,7,.8,53,M);P.r(x,7,.3,53,ML);}for(let y=8;y<58;y+=4){P.tl(14.4*R,y*R,16.4*R,(y+4)*R,MD,1);P.tl(16.4*R,y*R,14.4*R,(y+4)*R,MD,1);}
    P.r(13,5.8,4.6,1.6,MD);P.r(13,5.8,4.6,.5,ML);for(const y of [16,34,50]){P.r(10.6,y,3,1,MD);P.r(10.4,y-.4,.6,1.8,G);}
    P.line(17,42,25,56.6,ML);P.line(17.6,42.4,25.6,56.8,MD);}
  else{// boom folded along the deck on its cradle
    P.r(10,52.6,38,.8,M);P.r(10,54.6,38,.8,M);for(let x=10;x<47;x+=3)P.tl(x*R,52.6*R,(x+3)*R,55.4*R,MD,1);P.r(46,52,2,4,MD);P.r(30,55.4,2,1.6,MD);}
  for(const x of [21,30,45,54])P.wheel(x,65.6,3.5,0);}
/* R-17 rocket: olive body, lighter warhead, roll markings, four fins */
export function bRocket(P){const C=PAL,R0='#6d7548',RL='#8c956a',RD='#4c5233',W='#d8d4c4',K=C.black;
  P.tri(5,0,2.5,7,RL);P.r(5,.4,.5,5,'#b8bea0');
  P.r(3,7,5,43,R0);P.r(3,7,5,11,RL);P.r(3,7,1,43,tone(R0,.18));P.r(7,7,1,43,RD);P.r(3,17.6,5,.4,RD);
  P.r(3,22,5,1,FAC.m);P.r(3,22,5,.3,FAC.l);P.ins(5.5,27,1);
  for(let y=30;y<48;y+=6)P.r(3,y,5,.3,RD);
  P.r(3,40,2.5,2,K);P.r(5.5,40,2.5,2,W);P.r(3,42,2.5,2,W);P.r(5.5,42,2.5,2,K);
  pfill(P,[[3,44],[3,52],[0,53.4],[0,48.4]],RD);pfill(P,[[8,44],[11,48.4],[11,53.4],[8,52]],RD);P.r(5,46,1,6,RD);
  P.r(3.4,50,4.2,3,C.metalD);P.r(4,53,3,2,C.metal);P.r(4,53,3,.4,C.metalL);P.r(4.6,55,1.8,1,C.metalD);}

/* scenery wrecks: UAZ-469, BMP-1, Mi-8, PAZ bus */
export function wreckCar(P){const C=PAL,B='#5a3a28',D='#2b2420',G='#1a1714';
  pfill(P,[[3,7],[23,7],[23.4,6.6],[30.6,7.4],[32.6,9],[32.6,12.6],[3,12.6]],B);P.r(23.4,6.6,7,.5,'#7a5236');
  P.tl(4*R,7*R,5*R,3*R,'#3a3530',1);P.tl(5*R,3*R,21*R,2.6*R,'#3a3530',1);P.tl(14*R,7*R,13.4*R,3*R,'#3a3530',1);
  P.r(22,2.4,.7,4.6,'#4a3a30');P.tl(22*R,2.4*R,25*R,1.6*R,'#4a3a30',1);
  P.r(12,7.6,5,4.4,G);P.r(12,7.6,5,.5,'#3a2a20');P.r(17.6,7.6,.5,4.6,D);P.r(24,7.4,7,.4,D);for(let y=8.6;y<12;y+=1)P.r(32.2,y,.5,.5,G);
  P.ell(2,9.6,1.6,2.2,'#2c2a26');P.ell(2,9.6,.7,1,'#4a443a');
  P.camo(2,5,31,8,[D,'#6e4a32',C.rust,C.char],91,30);
  for(const x of [8,27]){P.half(x,13.6,3.4,3,G);P.ell(x,13.2,2.1,2.1,'#3a332c');P.ell(x,13.2,1.1,1.1,'#6a5e50');P.ell(x,13.2,.4,.4,G);}
  P.r(0,15.5,34,.5,'#3a3630');}
export function wreckTank(P){const C=PAL,B='#4a4a38',D='#2c2a24',G='#161512';
  // BMP-1 with a thrown track: low hull, ribbed glacis, small turret with the 73 mm gun and the ATGM rail
  pfill(P,[[3,10.6],[34,10.6],[53.4,14],[53.4,14.6],[48.6,17],[4,17],[3,15.6]],B);P.r(3,10.6,31,.5,'#6a6a52');
  for(let i=0;i<9;i++){const x=35+i*2,y=10.9+i*.35;P.r(x,y,.5,2,D);}
  P.r(4,13.6,44,.5,D);for(let i=0;i<4;i++){P.ell(9+i*4.5,12.6,.6,.6,G);P.r(8.6+i*4.5,11.2,.9,.6,D);}
  for(let y=7;y<10.6;y+=.5){const k=(y-7)/3.6;P.r(26-k*1.4,y,5+k*2.8,.5,B);}P.r(25,10.2,8,.5,D);
  P.line(31,8.4,40,9.8,D);P.r(39.6,9.4,1.2,1.2,G);P.r(30.6,7.4,4,.5,D);P.r(27,6.4,2.4,.8,D);
  P.r(2,16.6,50,2.4,'#22201c');P.r(0,19,9,1,'#2a2824');for(let x=0;x<9;x+=1)P.r(x,19,.5,.5,'#3a3830');
  P.camo(2,6,52,11,[D,'#6a4630','#5c5c46',C.char],77,26);
  for(const x of [9,16.4,23.8,31.2,38.6,46])roadWheel(P,x,16.6,2.3,0,'#3a332c','#5a5448');P.r(20,9.6,4,1,'#3a1a10');P.r(0,19.6,56,.4,'#3a3630');}
export function heli(P){const C=PAL,B='#4f5a48',D='#2e342a',L='#6c7a62',G='#151513',MD=C.metalD;
  // Mi-8 on its belly: broken tail boom, glazed nose, portholes, engine cowling, drooping blades
  pfill(P,[[1,14.6],[12.6,12.2],[12.6,15.6],[1,17.4]],B);P.r(0,9.6,3,6,B);P.tl(1*R,9.6*R,3.6*R,6.6*R,MD,1);P.r(12.6,12,1.2,4,G);
  pfill(P,[[14,9],[46,8.6],[52,9],[57,11],[60,14.6],[60,18],[57,21],[14,21]],B);P.r(14,9,32,.5,L);P.r(14,20,43,1,D);
  pfill(P,[[52.4,9.6],[56.8,11.4],[58.8,14],[53,14]],C.glass);P.tl(55*R,10.4*R,55.6*R,14*R,G,1);P.r(56,15,2.6,2,C.glass);P.r(53.6,10.4,1.2,1,C.glassL);
  pfill(P,[[24,8.8],[27,4.8],[46,4.8],[48,8.8]],B);P.r(27,4.8,19,.5,L);P.ell(47,6.6,1,1.5,G);P.r(24.4,6,2,2,G);
  P.r(34.2,2.4,3,2.6,MD);P.tl(36*R,3*R,61*R,10.6*R,MD,2);P.tl(35*R,3*R,8*R,5.4*R,MD,2);
  for(let i=0;i<5;i++){P.ell(19+i*4.6,12.2,.9,.9,'#1e2422');P.r(18.8+i*4.6,11.8,.4,.4,'#5a6a6a');}
  P.r(44,10.4,4,9,G);P.r(44,10.4,4,.4,D);
  pfill(P,[[21,15.6],[33,15.6],[34.6,17.2],[33,19],[21,19],[19.6,17.4]],L);P.r(21,18.6,12,.4,D);
  P.line(48,21,50,23.4,MD);P.ell(50.4,23,1,1,G);P.line(24,21,22,23.4,MD);P.ell(21.8,23,1.1,1.1,G);
  P.camo(0,4,61,18,[D,'#3a2e24','#6a4630'],131,20);P.ins(40,16.4,2);P.r(0,23.6,62,.4,'#3a3630');}
export function bus(P){const C=PAL,B='#a88d44',BD='#7a6530',BL='#c8ad62',D='#2b2723';
  // PAZ-3205: rounded front, big windows, faded yellow paint over rust
  pfill(P,[[2,3.6],[3,2.6],[45.6,2.6],[48.8,4.6],[51,8.4],[51,18.2],[2,18.2]],B);P.r(3,2.6,42.6,.6,BL);
  P.r(2,14.6,49,3.6,BD);P.r(2,12.6,49,.8,'#d8d2bc');
  for(const x of [4.6,12.4,20.2,28]){P.r(x,4.8,6.6,5.6,D);P.r(x+.6,5.4,5.4,4.4,'#22282a');P.r(x+1,5.8,1.4,1,'#5a6a6a');}
  P.r(35.8,4.8,4.6,5.6,D);P.r(36.4,5.4,3.4,4.4,'#22282a');
  pfill(P,[[42.6,4.4],[46.8,4.4],[50.2,8.6],[50.2,10.4],[42.6,10.4]],'#22282a');P.tl(44*R,5*R,47*R,9.6*R,'#5a6a6a',1);
  P.r(41.4,4.8,.6,12.8,D);P.r(48,16.6,3.4,1.6,D);P.ell(49.4,13.8,.8,.8,'#4a443a');
  P.camo(1,2,51,16,[tone(D,.25),'#8a6434','#7a6a3c'],71,16);
  P.half(10,19,3.8,3.4,D);P.half(40,19,3.8,3.4,D);
  P.ell(10,18.6,2.8,2.8,'#2c2a26');P.ell(10,18.6,1.2,1.2,'#5a5448');P.ell(40,19.4,2.2,2.2,'#3a352c');P.ell(40,19.4,.8,.8,'#5a5448');
  P.r(0,21.5,52,.5,'#3a3630');}
function commander(P,x,y){const C=PAL;
  P.r(x,y+4,5,6,C.olive);P.r(x,y+4,1,6,C.oliveD);P.r(x+1,y+4,3,.5,C.oliveL);P.r(x+1,y+5,1,1,FAC.m);
  P.r(x+1,y,4,4,C.skin);P.r(x+1,y+3.5,3,.5,C.skinD);P.r(x+3.5,y+1.5,.5,.5,C.black);P.r(x+5,y+1.5,.5,1,C.skin);P.r(x+1,y+1.5,.5,1,C.skinD);
  P.r(x,y-1,5,1.5,FAC.m);P.r(x+4,y-.5,1.5,1,FAC.m);P.r(x+.5,y-1,2,.5,FAC.l);P.r(x+1,y-.5,.5,.5,C.gold);
  P.r(x+4,y+6,4,1,C.oliveD);P.r(x+7.5,y+6,.5,1,C.skin);}
function crewHead(P,x,y){const C=PAL;P.r(x+1,y+1,4,4,C.skin);P.r(x+1,y+4.5,3,.5,C.skinD);P.r(x+3.5,y+2.5,.5,.5,C.black);P.r(x,y,5,1.5,FAC.m);P.r(x+4,y+.5,1.5,1,FAC.m);P.r(x+.5,y,2,.5,FAC.l);P.r(x+1,y+.5,.5,.5,C.gold);}
function commanderOp(P,x,y){const C=PAL;P.r(x,y+3,4,6,'#1c1d1a');P.r(x,y+3,4,.5,'#33352f');P.r(x,y,4,4,'#202020');P.r(x+.5,y,3,.5,'#3a3a36');P.r(x+2.5,y+1.5,1.5,1,C.skin);P.r(x+3,y+1.5,.5,.5,C.black);P.r(x+1,y+5,.5,2,'#3a3a36');}
