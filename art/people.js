/* People sprites: one human() painter, dressed differently per role. */
import {FAC,PAL,hash2,tone} from './core.js';

/* people: 11x17 art pixels (22x34 texels), facing right; frames 0-3 walk, 4-5 work. Drawn at texel level. */
export function human(P,o,f){
  const C=PAL,T=(x,y,w,h,c)=>P.t(x,y,w,h,c),wk=f>=4,b=(!wk&&f%2)?1:0,hu=o.hunch?1:0;
  const st=wk?[2,-2]:[[1,-1],[5,-4],[1,-1],[-4,5]][f],sw=(wk||o.hold)?0:[0,2,0,-2][f];
  const sleeve=tone(o.shirt,-.1),far=tone(o.shirt,-.3),tx=7+hu,ty=12+b+hu,th=23+b-ty;
  // gear on the back
  if(o.back==='bundle'){const y=11+b+hu;T(1,y+1,7,9,C.brown);T(2,y,5,1,C.brown);T(2,y+1,5,1,C.brownL);T(1,y+5,7,1,C.brownD);T(4,y+2,1,7,C.brownD);T(2,y+7,2,2,C.brownL);}
  if(o.back==='pack'){const pc=o.packCol||C.oliveD;T(2,13+b,6,9,pc);T(2,13+b,6,1,C.olive);T(3,16+b,4,4,tone(pc,-.18));T(3,16+b,4,1,C.olive);T(2,11+b,6,2,C.khakiD);T(2,11+b,6,1,C.khaki);T(5,11+b,1,2,tone(C.khakiD,-.25));}
  if(o.back==='shovel'&&!wk){P.tl(5,4+b,8,20+b,C.wood,2);T(3,b,5,5,C.greyL);T(3,b,5,1,'#d9d7cb');T(4,5+b,3,1,C.grey);T(5,6+b,1,1,C.greyD);}
  // far arm, legs, body
  if(!o.hold&&!wk)P.tl(tx+3,ty+2,tx+3-sw,ty+7,far,3);
  const legs=[[9,st[1],o.pantsD||tone(o.pants,-.22)],[11,st[0],o.pants]];
  for(const [hx,s,col] of legs){const ax=hx+s,kx=hx+Math.round(s*.5)+(s>0?1:0);P.tl(hx,21+b,kx,26+b,col,3);P.tl(kx,26+b,ax,30,col,3);}
  T(tx,ty,8,th,o.shirt);T(tx,ty,1,th,o.shirtD);T(tx+1,ty,6,1,o.shirtL||tone(o.shirt,.15));T(tx+5,ty,2,1,o.shirtD);
  if(o.coat){T(tx,ty+th-1,8,4,o.shirt);T(tx,ty+th-1,1,4,o.shirtD);for(let i=0;i<8;i++)if(i%3!==1)T(tx+i,ty+th+3,1,1,o.shirt);T(tx+4,ty+5,2,2,'#7d6a4c');T(tx+2,ty+th+1,2,1,o.shirtD);}
  if(o.camo)P.atop(0,0,11,17,()=>{for(let y=0;y<34;y++)for(let x=0;x<22;x++){const hv=hash2((x+1)>>1,(y+(x>>2))>>1);if(hv<.16)T(x,y,1,1,o.shirtD);else if(hv>.88)T(x,y,1,1,o.shirtL);}});
  for(const [hx,s] of legs){const ax=hx+s;T(ax-1,31,4,2,C.boot);T(ax+2,32,2,1,C.boot);T(ax-1,33,6,1,'#141310');T(ax-1,31,3,1,'#3d362b');}
  if(!o.hold&&!wk)T(tx+3-sw,ty+10,2,2,C.skinD);
  if(!o.coat){T(tx,21+b,8,1,o.belt||C.brownD);T(tx+5,21+b,1,1,C.goldD);}else T(tx,ty+7,8,1,o.belt);
  if(o.vest){T(tx+1,ty+2,6,th-4,o.vest);T(tx+1,ty+2,1,th-4,tone(o.vest,-.22));T(tx+1,ty+6,6,1,'#ece8d8');T(tx+1,ty+7,6,1,tone(o.vest,-.12));}
  if(o.plate){T(tx+2,ty+1,6,th-3,o.plate);T(tx+2,ty+1,6,1,tone(o.plate,.14));T(tx+3,ty+5,4,3,tone(o.plate,-.12));T(tx+5,ty+5,1,3,tone(o.plate,-.35));T(tx+2,ty+1,1,th-3,tone(o.plate,-.2));T(tx+3,ty+9,4,1,tone(o.plate,-.25));}
  // head
  const hx=8+hu*2,hy=4+b+hu,skin=C.skin,hc=o.hatCol;
  T(hx+2,hy+6,3,2,C.skinD);
  T(hx,hy,6,7,skin);T(hx+6,hy+3,1,2,skin);T(hx,hy+6,5,1,C.skinD);T(hx+1,hy+3,1,2,C.skinD);
  T(hx+4,hy+3,1,1,'#1a1612');T(hx+3,hy+2,2,1,tone(C.hair,.1));T(hx+5,hy+5,1,1,tone(C.skinD,-.15));
  if(o.hat==='helmet'){T(hx,hy-2,6,1,hc);T(hx-1,hy-1,8,2,hc);T(hx-1,hy+1,8,1,tone(hc,-.28));T(hx-1,hy+2,2,2,hc);T(hx+1,hy-2,3,1,tone(hc,.24));T(hx,hy-1,2,1,tone(hc,.14));T(hx+4,hy-1,1,1,tone(hc,-.2));T(hx+2,hy,1,1,tone(hc,-.16));T(hx+1,hy+4,1,2,'#2a2620');}
  else if(o.hat==='cap'){T(hx,hy-1,6,2,hc);T(hx+5,hy,3,1,tone(hc,-.25));T(hx+1,hy-1,3,1,tone(hc,.2));T(hx,hy+1,2,2,C.hair);}
  else if(o.hat==='hood'){T(hx-1,hy-1,6,3,hc);T(hx-1,hy+2,3,6,hc);T(hx,hy-1,4,1,tone(hc,.15));T(hx+2,hy+2,1,4,tone(hc,-.25));T(hx+3,hy+2,2,1,tone(skin,-.3));T(hx+3,hy+6,3,1,tone(C.hair,.2));}
  else{T(hx,hy-1,6,2,C.hair);T(hx,hy+1,2,3,C.hair);T(hx+1,hy-1,3,1,tone(C.hair,.2));T(hx+5,hy,1,1,C.hair);}
  // hands and what they hold
  if(o.hold==='rifle'){const ry=ty+5;
    T(tx+1,ry+2,2,2,C.skinD);
    T(3,ry+1,4,2,'#3b342a');T(3,ry,2,1,'#3b342a');T(3,ry+3,1,1,'#3b342a');
    T(7,ry,7,3,C.metalD);T(8,ry-1,5,1,C.metal);T(9,ry+3,1,2,C.metalD);T(11,ry+3,2,2,C.metalD);T(12,ry+5,2,1,C.metalD);
    T(14,ry,4,2,'#3e4a26');T(14,ry,4,1,'#556433');T(18,ry,4,1,C.metalD);T(19,ry-1,1,1,C.metalD);
    P.tl(tx+3,ty+2,tx+5,ty+5,sleeve,3);P.tl(tx+5,ty+5,15,ry+1,sleeve,2);T(15,ry+1,2,2,skin);}
  else if(o.hold==='crate'){T(12,ty+1,9,8,C.wood);T(12,ty+1,9,1,C.woodL);T(12,ty+4,9,1,C.woodD);P.tl(13,ty+2,19,ty+7,C.woodD,1);T(12,ty+1,1,8,C.woodD);T(20,ty+1,1,8,C.woodD);T(15,ty+5,3,1,C.goldD);
    P.tl(tx+3,ty+2,tx+4,ty+6,sleeve,3);T(tx+5,ty+6,2,2,skin);}
  else if(wk){const up=f===4,ex=up?18:17,ey=up?2:27;P.tl(tx+4,ty+4,ex,ey,C.wood,2);
    if(up){T(ex-1,ey-2,5,3,C.greyL);T(ex-1,ey-2,5,1,'#dcdacd');}else{T(ex-2,ey,5,3,C.greyL);T(ex-2,ey,5,1,'#dcdacd');}
    P.tl(tx+3,ty+2,tx+5,ty+(up?0:6),sleeve,3);T(tx+5,ty+(up?-1:7),2,2,skin);}
  else{P.tl(tx+3,ty+2,tx+3+sw,ty+7,sleeve,3);T(tx+3+sw,ty+10,2,2,skin);}
  if(o.patch){T(tx+3,ty+3,2,2,FAC.m);T(tx+3,ty+3,1,1,C.gold);}
}
export const PEOPLE={
  vagrant:{shirt:'#6e5a44',shirtD:'#55432f',shirtL:'#857055',pants:'#4a4033',hat:'hood',hatCol:'#5d4c38',hunch:1,back:'bundle',coat:1,belt:'#8f7f5c'},
  idle:{shirt:'#a8956a',shirtD:'#7c6c48',shirtL:'#c7b487',pants:'#4b5668',pantsD:'#394252',hat:'none'},
  guard:{shirt:'#556b2f',shirtD:'#3c4c20',shirtL:'#76904a',pants:'#45552a',hat:'helmet',hatCol:'#4b5b2d',camo:1,back:'pack',hold:'rifle',plate:'#4a5232',patch:1},
  builder:{shirt:'#6b6a45',shirtD:'#4f4e32',pants:'#45432e',hat:'helmet',hatCol:'#5d5c38',vest:'#d07a26',back:'shovel',patch:1},
  farmer:{shirt:'#8a7a4e',shirtD:'#6a5d3a',pants:'#4f4732',hat:'cap',hatCol:'#5e6a38',hold:'crate'}
};
