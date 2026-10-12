/* Scenery: trees and grass per season, rocks, fences, houses, landmarks. */
import {rng} from '../js/util.js';
import {PAL,R,tone} from './core.js';

export function pine(P,f){const C=PAL,D='#24331e',M='#33472a',Lc='#4a6236',H='#5f7c42';
  if(f===1){P.r(6,10,2,24,C.woodD);P.r(6,10,.5,24,C.wood);P.tl(14,28,4,18,C.woodD,2);P.tl(14,40,24,30,C.woodD,2);P.tl(14,52,6,46,C.woodD,1);P.tl(4,18,2,14,C.woodD,1);P.r(5,32,4,2,C.woodD);return;}
  P.r(7,26,2,8,C.woodD);P.r(7,26,.5,8,C.wood);P.r(6,33,4,1,C.woodD);
  for(const [t0,hh,hw] of [[0,20,6],[10,22,10],[22,24,13],[36,20,15]])for(let j=0;j<hh;j++){const w=Math.min(16,Math.round(hw*(j+1)/hh+(j%4===3?1.5:0)));
    P.t(16-w,t0+j,w*2,1,D);P.t(16-w+(j%4===3?0:1),t0+j,Math.round(w*1.1),1,M);if(j%4===2||j%4===3)P.t(16-w+1,t0+j,Math.round(w*.55),1,Lc);if(j%4===3)P.t(16-w,t0+j,2,1,H);}}
export function hedgehog(P){const C=PAL;P.line(0,9,10,0,C.metalD);P.line(1,0,11,9,C.metalD);P.r(5,0,1,10,C.metal);P.r(5,0,.5,10,C.metalL);P.r(0,9,12,1,C.metalD);P.r(3,6,.5,.5,C.rust);P.r(8,3,1,.5,C.rust);}

/* scenery: seasonal plants (one texture per season), props and landmark ruins */
const LEAF=[['#4c7a2c','#6a9a3a','#90bd52','#f2e4ee'],['#3b5c24','#52782e','#6c983c',null],['#8e4f1c','#bf7424','#e0a43e','#b23c26'],null];

export function tree(P,f,si){const C=PAL,T=(x,y,w,h,c)=>P.t(x,y,w,h,c),birch=f===1,cx=28;
  const tr=birch?'#d6d2c2':'#5a4330',trL=birch?'#f2eee2':'#7a5c40',trD=birch?'#a8a496':'#3e2e20';
  if(birch){T(cx-2,38,4,54,tr);T(cx-2,38,1,54,trL);T(cx+1,38,1,54,trD);for(let y=42;y<90;y+=4+((y*7)%4))T(cx-2+((y*3)%2),y,2+(y%3?1:0),1,'#2a2622');}
  else{T(cx-3,46,6,46,tr);T(cx-3,46,2,46,trL);T(cx+2,46,1,46,trD);T(cx-6,88,12,4,tr);T(cx-6,88,3,1,trL);T(cx-1,60,1,14,trD);T(cx,74,1,8,trD);}
  const br=birch?[[cx,50,cx-10,30],[cx,46,cx+9,26],[cx,60,cx+12,44],[cx,64,cx-12,48],[cx,40,cx-1,12]]:[[cx,52,cx-16,34],[cx,50,cx+16,32],[cx,48,cx-6,16],[cx,48,cx+6,14],[cx,60,cx+20,46],[cx,60,cx-20,48]];
  for(const [x0,y0,x1,y1] of br)P.tl(x0,y0,x1,y1,tr,2);
  const L=LEAF[si],rn=rng(birch?17:29);
  if(!L){for(const [x0,y0,x1,y1] of br){const d=x1<cx?-1:1;P.tl(x1,y1,x1+d*5,y1-7,tr,1);P.tl(x1,y1,x1-d*3,y1-8,tr,1);P.tl((x0+x1)/2,(y0+y1)/2,(x0+x1)/2+d*6,(y0+y1)/2-4,tr,1);}return;}
  const blobs=birch?[[28,22,10,13],[19,34,8,8],[37,32,8,9],[28,44,9,6]]:[[28,26,20,15],[13,37,12,10],[43,37,12,10],[28,42,17,9],[19,18,10,9],[37,17,10,9]];
  for(const [bx,by,rx,ry] of blobs)P.blob(bx+1,by+2,rx,ry,L[0]);
  for(const [bx,by,rx,ry] of blobs)P.blob(bx-1,by,rx*.84,ry*.8,L[1]);
  for(const [bx,by,rx,ry] of blobs)P.blob(bx-rx*.32,by-ry*.38,rx*.45,ry*.4,L[2]);
  const inside=(x,y)=>blobs.some(([bx,by,rx,ry])=>((x-bx)/rx)**2+((y-by)/ry)**2<.9);
  for(let i=0;i<(birch?90:170);i++){const x=Math.round(4+rn()*48),y=Math.round(4+rn()*50);if(!inside(x,y))continue;const v=rn();
    T(x,y,2,1,v<.45?L[0]:v<.8?L[2]:L[1]);if(v>.6)T(x+1,y-1,1,1,L[2]);}
  if(L[3])for(let i=0;i<(si===0?26:40);i++){const x=Math.round(6+rn()*44),y=Math.round(6+rn()*44);if(inside(x,y))T(x,y,1,1,L[3]);}
  if(si===2)for(let i=0;i<9;i++)T(cx-16+Math.round(rn()*32),90+Math.round(rn()),2,1,i%2?L[1]:L[2]);}
export function bush(P,f,si){const C=PAL,T=(x,y,w,h,c)=>P.t(x,y,w,h,c),rn=rng(5+f*11),L=LEAF[si];
  const bl=f===0?[[16,11,14,7],[8,13,7,5],[24,12,8,6]]:[[12,12,10,6],[22,13,9,5],[17,9,7,5]];
  if(!L){for(const [bx,by,rx] of bl)for(let k=-2;k<=2;k++)P.tl(bx,19,bx+k*rx/2.2,19-6-Math.abs(k)*1.5,'#4a3a2a',1);return;}
  for(const [bx,by,rx,ry] of bl)P.blob(bx,by+2.5,rx,ry,L[0]);
  for(const [bx,by,rx,ry] of bl)P.blob(bx-1,by+1.5,rx*.8,ry*.75,L[1]);
  for(const [bx,by,rx,ry] of bl)P.blob(bx-rx*.3,by+1.5-ry*.35,rx*.4,ry*.4,L[2]);
  for(let i=0;i<40;i++){const x=Math.round(2+rn()*28),y=Math.round(4+rn()*12),v=rn();if(bl.some(([bx,by,rx,ry])=>((x-bx)/rx)**2+((y-by)/ry)**2<.85))T(x,y,1,1,v<.5?L[0]:L[2]);}
  if(L[3]&&si===0)for(let i=0;i<8;i++)T(Math.round(4+rn()*24),Math.round(6+rn()*8),1,1,i%2?'#f0e070':L[3]);
  if(si===1&&f===1)for(let i=0;i<5;i++)T(Math.round(8+rn()*16),Math.round(7+rn()*6),1,1,'#3a3f8a');}
const GRASS=[['#6e9e3e','#8cba4e','#f0e070'],['#557f32','#6f9a3c',null],['#9a8238','#b89a48','#8a5a26'],['#8a927c','#a8ae9a',null]];
export function grass(P,f,si){const g=GRASS[si],rn=rng(31+f*7);const n=[5,7,4][f];
  for(let i=0;i<n;i++){const x=2+Math.round(rn()*11),hgt=3+Math.round(rn()*(f===1?6:4)),lean=Math.round((rn()-.5)*4);P.tl(x,9,x+lean,9-hgt,i%2?g[0]:g[1],1);if(g[2]&&i%3===0)P.t(x+lean,9-hgt,1,1,g[2]);}
  if(si===3)for(let x=1;x<15;x+=2)P.t(x,9,2,1,'#eef3f6');}
export function fgrass(P,f,si){const g=[['#3c5a26','#4f7230','#2c4420'],['#33502a','#44652c','#263a1c'],['#6a5626','#806a30','#4a3a1a'],['#5c6458','#727a6c','#454b40']][si],rn=rng(53+f*13);
  for(let i=0;i<[14,10,18][f];i++){const x=2+Math.round(rn()*20),hgt=4+Math.round(rn()*12),lean=Math.round((rn()-.3)*7);P.tl(x,19,x+lean,19-hgt,g[i%3],i%4===0?2:1);}
  if(si===3)for(let x=0;x<28;x+=3)P.t(x,18,3,2,'#e6ecf0');}
export function rock(P,f){const C=PAL;if(f===0){P.half(5,4,5,3,C.greyD);P.half(4,4,4,2,C.grey);P.r(2,2,2,.5,C.greyL);P.r(6,3,1,.5,C.greyL);P.r(1,4,8,.5,'#55534b');P.r(7,3.5,1.5,.5,'#5b7a33');}
  else{P.half(3,4,3,2,C.greyD);P.half(3,4,2,1,C.grey);P.half(8,4,2,1,C.greyD);P.r(2,3,1,.5,C.greyL);P.r(5,4,1,.5,'#5b7a33');}}
export function stump(P,f){const C=PAL;if(f===0){P.r(2,1,4,4,C.wood);P.r(2,1,1,4,C.woodL);P.r(5.5,1,.5,4,C.woodD);P.ell(4,1,2,0,C.woodL);P.r(3.5,1,1,.5,C.woodD);P.r(1,4,6,1,C.wood);P.r(0,4.5,1,.5,C.woodD);P.r(7,4.5,1,.5,C.woodD);}
  else{P.r(0,2,13,3,C.wood);P.r(0,2,13,.5,C.woodL);P.r(0,4,13,1,C.woodD);P.ell(13,3,1,1,C.woodL);P.r(13,3,.5,.5,C.woodD);P.r(4,2.5,3,.5,C.woodD);P.r(9,1,1,1.5,C.woodD);P.r(8.5,.5,2,.5,'#5b7a33');}}
export function pole(P,f){const C=PAL;P.r(3,4,1.5,44,C.wood);P.r(3,4,.5,44,C.woodL);P.r(4,4,.5,44,C.woodD);P.r(0,6,7.5,1,C.woodD);P.r(0,6,7.5,.5,C.wood);
  for(const x of [.5,6])P.r(x,4.5,1,1.5,'#cfd6d0');P.r(2.5,8,.5,6,C.woodD);P.line(4,10,6,6,C.woodD);for(let y=14;y<46;y+=9)P.r(3,y,1.5,.5,C.woodD);}
export function fence(P,f){const C=PAL;const posts=[1,11,21];
  for(const x of posts){const lean=f===1&&x===11?2:0;P.line(x,8,x+lean,1,C.woodD);P.r(x,1,1,.5,C.woodL);}
  if(f===0){P.r(0,3,23,1,C.wood);P.r(0,3,23,.5,C.woodL);P.r(0,6,23,1,C.wood);P.r(0,6,23,.5,C.woodL);}
  else{P.r(0,3,11,1,C.wood);P.r(0,3,11,.5,C.woodL);P.line(12,6,22,7,C.wood);P.r(0,6,8,1,C.wood);P.line(14,3,22,3,C.wood);}}
export function wire(P,f){const C=PAL;for(const x of [2,20]){P.line(x-2,8,x+2,2,C.woodD);P.line(x+2,8,x-2,2,C.woodD);}
  for(let i=0;i<5;i++){P.ell(2+i*4.5,4,2,2,C.greyD);P.clr(2+i*4.5,4);}P.r(0,4,23,.5,C.grey);for(let i=0;i<14;i++)P.r(i*1.7,3.5+(i%2),.5,.5,C.greyL);}
export function barrels(P,f){const C=PAL,B='#4f5a36',BR='#7a4a2a';const drum=(x,col)=>{P.r(x,1,5,8,col);P.r(x,1,5,.5,tone(col,.25));P.r(x,3.5,5,.5,tone(col,-.3));P.r(x,6.5,5,.5,tone(col,-.3));P.r(x,1,1,8,tone(col,.12));P.r(x+4.5,1,.5,8,tone(col,-.25));};
  drum(1,B);if(f===0){drum(7,BR);P.r(8,4,2,1,C.rust);}else{P.r(6,5,8,4,BR);P.r(6,5,8,.5,tone(BR,.25));P.ell(12,7,1,1,tone(BR,-.2));P.r(9,5,.5,4,tone(BR,-.3));}}
export function crates(P,f){const C=PAL,O='#4f5a30';const box=(x,y,w,h)=>{P.r(x,y,w,h,O);P.r(x,y,w,.5,tone(O,.25));P.r(x+.5,y+.5,.5,h-1,tone(O,-.25));P.r(x+w-1,y+.5,.5,h-1,tone(O,-.25));P.r(x+w/2-1,y+h/2-.5,2,.5,C.khakiL);P.r(x+1,y+h-1,w-2,.5,tone(O,-.2));};
  box(0,4,8,5);box(7,5,7,4);if(f===0)box(2,0,7,4);else{P.r(9,1,4,4,C.wood);P.r(9,1,4,.5,C.woodL);P.line(9,1,12,4,C.woodD);}}
export function tires(P){const C=PAL;for(const [x,y] of [[0,2],[5,2],[2.5,0]]){P.r(x,y+1,5,2,C.tire);P.r(x+.5,y+.5,4,.5,'#3a3a36');P.r(x+1.5,y+1.5,2,.5,'#0e0e0c');}}
export function hulk(P,f){const C=PAL;P.r(2,4,9,5,C.rob);P.r(2,4,9,1,C.robL);P.r(3,5,3,2,C.robD);P.r(5,6,4,1,C.rust);P.r(11,6,5,3,C.robD);P.r(11,6,5,.5,C.rob);P.r(14.5,7,1,1,'#5a2a20');
  P.line(0,9,3,6,C.robD);P.r(16,8,4,1,C.robD);P.r(17,7,1,1,C.robD);P.r(7,2,1,2,C.metalL);P.r(7,1.5,1,.5,'#5a2a20');P.r(1,9,19,.5,'#2a2620');}
export function house(P,f){const C=PAL,T=(x,y,w,h,c)=>P.t(x,y,w,h,c),rn=rng(101+f*7);
  P.r(4,14,56,30,C.brick);P.r(4,14,56,.5,C.brickL);
  P.atop(4,14,56,30,()=>{for(let y=28;y<88;y+=4)for(let x=8+((y/4)%2)*4;x<120;x+=8){T(x,y,1,4,C.brickD);}for(let y=31;y<88;y+=4)T(8,y,112,1,C.brickD);
    for(let i=0;i<6;i++){const x=10+rn()*96,y=30+rn()*50;P.blob(x,y,3+rn()*5,2+rn()*3,C.plaster);P.blob(x+1,y+1,2+rn()*2,1+rn()*2,C.plasterD);}P.speck(4,14,56,30,C.plasterD,9);});
  P.r(4,27,56,1,C.brickD);
  for(const x of [9,22,40,51]){P.r(x,17,6,7,'#1e1c18');P.r(x-.5,24,7,.5,C.plaster);P.r(x+2.5,17,.5,7,C.woodD);}
  for(const x of [9,40,51]){P.r(x,31,6,7,'#1e1c18');P.r(x-.5,38,7,.5,C.plaster);}
  P.r(24,31,8,13,'#1e1c18');P.r(23.5,30.5,9,.5,C.plaster);P.line(24,44,30,33,C.woodD);
  if(f===0){P.tri(32,2,30,12,'#4b3a30');P.atop(0,2,64,12,()=>{for(let x=0;x<128;x+=6)T(x,4,1,24,'#3b2c24');for(let y=8;y<28;y+=4)T(0,y,128,1,'#5e4a3c');});
    for(let i=0;i<7;i++){P.clr(38+i*2,6+i*.6,2,7-i*.5);}for(let i=0;i<4;i++)P.line(40+i*4,14,44+i*3,4+i*1.5,C.woodD);P.r(44,10,8,1,'#1a1612');
    P.r(14,4,3,6,C.brickD);P.r(14,4,3,.5,C.brickL);}
  else{for(let x=4;x<60;x+=2){const hgt=Math.round(3+Math.abs(Math.sin(x*.7))*5+(x>30&&x<48?6:0));P.clr(x,14,2,hgt);}
    P.line(10,24,22,14,C.woodD);P.r(46,18,10,1,C.woodD);}
  P.ell(48,28,4,3,'#1c1915');P.ell(46,30,2,2,'#1c1915');P.ell(51,26,2,2,'#1c1915');for(const [x,y] of [[43,27],[52,30],[47,24],[50,31.5],[44.5,31]])P.r(x,y,1,.5,C.brickL);
  for(let i=0;i<14;i++){const x=Math.round(rn()*60),r=1+rn()*3;P.half(x,43,r,r*.6,i%3?C.brickD:C.greyD);}}
export function chapel(P,f){const C=PAL,T=(x,y,w,h,c)=>P.t(x,y,w,h,c),rn=rng(77);
  P.r(2,30,30,34,C.plaster);P.r(2,30,30,.5,'#cfc6ae');P.tri(17,20,15,10,'#5e4e44');P.r(2,29,30,1,'#4a3c34');
  P.r(30,8,12,56,C.plaster);P.r(30,8,12,.5,'#cfc6ae');P.r(41,8,1,56,C.plasterD);P.r(30,8,1,56,'#cfc6ae');
  P.tri(36,0,7,8,'#5e4e44');P.clr(37,0,6,4);P.r(29,7,14,1,'#4a3c34');
  for(const y of [12,26]){P.r(33,y,6,8,'#1a1816');P.ell(36,y,3,2,'#1a1816');}P.r(35,14,2,3,C.goldD);P.r(35.5,13.5,1,.5,C.metalD);
  for(const x of [6,14,22]){P.r(x,40,5,12,'#1a1816');P.ell(x+2,40,2,2,'#1a1816');P.r(x+2,40,.5,12,C.plasterD);}
  P.r(33,48,6,16,'#1a1816');P.ell(36,48,3,3,'#1a1816');
  P.atop(2,8,40,56,()=>{P.speck(2,8,40,56,C.plasterD,23);for(let i=0;i<6;i++)P.blob(8+rn()*70,20+rn()*100,2+rn()*3,1+rn()*2,C.brickL);for(let y=60;y<128;y+=10)T(4,y,60,1,C.plasterD);});
  P.ell(10,34,3,2,'#1c1915');P.ell(12,32,2,1,'#1c1915');for(const [x,y] of [[6.5,34],[14,33],[10,31]])P.r(x,y,1,.5,C.brick);P.clr(2,30,4,4);P.clr(2,34,2,3);
  for(let i=0;i<10;i++){const x=Math.round(rn()*30),r=1+rn()*2.5;P.half(x,63,r,r*.6,i%2?C.plasterD:C.greyD);}}
export function wagon(P,f){const C=PAL;
  if(f===0){const W='#743a2a',WD='#55291e',WL='#8e4c36';P.r(2,2,52,14,W);P.r(2,2,52,1,WL);for(let x=4;x<54;x+=3){P.r(x,3,.5,13,WD);}P.r(20,4,14,11,WD);P.r(20.5,4.5,6,10,W);P.r(27,4.5,6,10,W);P.r(26.5,4,.5,11,'#3a1a12');P.r(30,9,1,1,C.metalD);
    P.camo(2,2,52,14,['#5c4a3c',C.rust],211,14);P.r(8,6,6,3,'#c8c0a8');P.r(9,7,4,.5,WD);}
  else{const W='#3c3e3a',WL='#5c5e58';P.ell(27,9,25,6,W);P.r(4,4,46,11,W);P.ell(27,7,22,3,WL);P.r(4,8.5,46,.5,'#2a2c28');P.r(26,1,3,3,W);P.r(26,1,3,.5,WL);P.r(2,15,52,1,C.metalD);P.camo(2,2,52,14,[C.rust,'#2a2c28'],213,10);}
  P.r(1,16,54,1.5,C.metalD);for(const x of [8,14,42,48]){P.ell(x,19,2,2,'#2a2a26');P.r(x,19,1,1,'#6c6c64');}P.r(6,17,10,1,C.metalD);P.r(40,17,10,1,C.metalD);P.r(0,16,1,1,C.metal);P.r(55,16,1,1,C.metal);}
export function wtower(P){const C=PAL,T='#6a6e66',TL='#8a8e84',TD='#4a4e46';
  for(const [x0,x1] of [[4,8],[22,18]])P.line(x0,61,x1,22,C.metalD);for(let y=28;y<60;y+=10){P.tl(5*R+(60-y)/10,y*R,21*R-(60-y)/10,(y+10)*R,C.metal,1);P.tl(21*R-(60-y)/10,y*R,5*R+(60-y)/10,(y+10)*R,C.metal,1);}
  P.r(2,6,22,16,T);P.r(2,6,22,1,TL);P.r(2,6,2,16,TL);P.r(22,6,2,16,TD);for(let y=10;y<22;y+=4)P.r(2,y,22,.5,TD);P.tri(13,0,12,6,TD);P.r(12,0,2,1,C.metal);
  P.camo(2,6,22,16,[C.rust,'#5a5e56'],51,10);P.r(18,8,.5,50,C.metalD);for(let y=24;y<60;y+=2)P.r(17.5,y,1.5,.5,C.metal);P.r(2,21,22,1,TD);P.r(6,12,8,3,'#c8c0a8');P.r(7,13,6,.5,TD);}
export function station(P){const C=PAL,T=(x,y,w,h,c)=>P.t(x,y,w,h,c);
  P.r(0,4,58,5,'#d8d2c0');P.r(0,4,58,.5,'#f0ece0');P.r(0,7,58,2,'#2f6e6a');P.r(0,8.5,58,.5,'#1d4744');P.clr(40,4,6,2);P.line(40,6,46,9,'#8a8476');
  for(const x of [6,48]){P.r(x,9,3,27,C.conL);P.r(x,9,1,27,'#e0dccc');P.r(x+2.5,9,.5,27,C.conD);}
  for(const x of [18,32]){P.r(x,26,6,10,'#c8c0a8');P.r(x,26,6,.5,'#e8e2d0');P.r(x+1,28,4,3,'#1e1c18');P.r(x+1,32,4,.5,C.greyD);P.r(x+6,30,1,4,'#2a2a26');P.r(x-1,35,8,1,C.conD);}
  P.r(60,14,24,22,'#bdb6a2');P.r(60,14,24,.5,'#d8d2c0');P.r(58,12,28,2,C.conD);P.r(64,20,10,9,'#1e1c18');P.r(76,22,5,14,'#1e1c18');P.line(64,20,70,26,'#9cbcc4');
  P.atop(58,12,28,24,()=>{P.speck(58,12,28,24,'#8e8774',41);});
  P.r(70,0,1,12,C.metal);P.r(64,0,13,6,'#c8c0a8');P.r(64,0,13,.5,'#e8e2d0');P.r(66,2,9,2,'#2f6e6a');P.clr(73,4,4,2);
  P.r(0,35,86,1,'#4a4a42');}
export function container(P,f){const C=PAL,col=f?'#8a4e2a':'#46617a',D=tone(col,-.3),L=tone(col,.2);
  P.r(0,0,48,20,col);P.r(0,0,48,.5,L);P.r(0,19.5,48,.5,D);for(let x=2;x<46;x+=2)P.r(x,1,.5,18,D);P.r(0,0,1,20,D);P.r(47,0,1,20,D);
  P.r(40,1,.5,18,'#1a1a18');for(const x of [42,45])P.r(x,4,.5,13,C.metalD);P.camo(0,0,48,20,[C.rust,D],91+f,12);P.r(6,6,12,4,L);P.r(7,7,10,1,D);}
export function silo(P){const C=PAL,S='#a8a89a',SD='#7a7a6e',SL='#c8c8ba';
  P.r(2,10,14,50,S);P.half(9,10,7,5,S);P.r(2,10,2,50,SL);P.r(14,10,2,50,SD);for(let y=14;y<60;y+=6)P.r(2,y,14,.5,SD);
  P.r(18,22,14,38,S);P.half(25,22,7,4,S);P.r(18,22,2,38,SL);P.r(30,22,2,38,SD);for(let y=26;y<60;y+=6)P.r(18,y,14,.5,SD);
  P.camo(2,4,30,56,[C.rust,'#8a8a7c'],61,16);P.r(16,12,2,1,C.metalD);P.line(16,12,18,22,C.metalD);
  for(let y=14;y<60;y+=2)P.r(11,y,2,.5,C.metalD);P.r(11,12,.5,48,C.metalD);P.r(12.5,12,.5,48,C.metalD);}
export function barn(P){const C=PAL,W='#7a3e2a',WD='#58291b',WL='#94503a';
  P.r(4,16,50,22,W);for(let x=5;x<54;x+=2.5)P.r(x,16,.5,22,WD);P.r(4,16,50,.5,WL);
  P.tri(29,2,27,9,'#4a4844');P.r(2,10,54,6,'#4a4844');P.r(2,10,54,.5,'#6a6862');P.atop(2,2,54,14,()=>{for(let y=6;y<32;y+=3)P.t(0,y,120,1,'#3a3834');});
  P.clr(34,2,10,6);P.clr(37,8,6,3);P.line(34,9,44,3,C.woodD);P.line(36,10,40,4,C.woodD);
  P.r(20,22,16,16,WD);P.r(20,22,16,.5,WL);P.line(20,22,35,37,WL);P.line(35,22,20,37,WL);P.r(27.5,22,1,16,'#3a1a10');
  P.r(26,12,6,4,'#1a1612');P.camo(4,16,50,22,['#5c4a3c','#9a5a3a'],43,14);}
export function pylon(P){const C=PAL;
  P.line(2,89,12,20,C.metal);P.line(27,89,17,20,C.metal);P.line(12,20,14,2,C.metal);P.line(17,20,15,2,C.metal);
  for(let y=86;y>22;y-=8){const k=(89-y)/69*10;P.tl((2+k)*R,y*R,(27-k)*R,(y-8)*R,C.metalD,1);P.tl((27-k)*R,y*R,(2+k)*R,(y-8)*R,C.metalD,1);P.r(2+k,y,25-2*k,.5,C.metalD);}
  for(const y of [12,22]){P.r(1,y,28,1,C.metal);P.r(1,y,28,.5,C.metalL);for(const x of [1.5,27])P.r(x,y+1,1,3,'#b8c4c0');}P.r(13,4,4,.5,C.metalD);P.r(14.5,0,1,2,C.metal);}
export function billboard(P){const C=PAL;P.r(6,18,1.5,14,C.metal);P.r(32,18,1.5,14,C.metal);P.line(7,30,33,20,C.metalD);
  P.r(0,2,40,17,'#c8c0a8');P.r(0,2,40,.5,'#e8e2d0');P.r(1,3,38,15,'#5d8aa0');P.r(1,12,38,6,'#6f8a4c');P.half(10,12,6,4,'#8aa060');P.r(24,5,12,3,'#e8e2d0');P.r(25,9,9,1.5,'#e8c060');
  P.camo(0,2,40,17,['#9a9282','#c8c0a8',C.rust],93,10);P.clr(32,2,8,5);P.line(32,7,36,2,'#8a8476');P.r(0,18.5,40,.5,'#7a7466');}
export function hay(P){const C=PAL;P.ell(7,4,6,4,'#b89a48');P.ell(6,3,5,3,'#d0b25a');P.ell(4.5,2,2,1.5,'#e0c672');P.r(0,8.5,14,.5,'#8a7034');
  P.atop(0,0,14,9,()=>{for(let i=0;i<6;i++)P.tl(2+i*4,2+((i*5)%9),6+i*4,4+((i*5)%9),'#9a7c38',1);});}
