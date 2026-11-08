/** Hand-painted original farm surfaces integrated with reference two-tone shader. */
import React from "react";
import * as THREE from "three";
import {ctex,rep} from "../../reference/bridge/paint";
import {twoTone} from "../../reference/bridge/shade";
const palette=new Map<string,THREE.MeshLambertMaterial>();
function earth(){
 return ctex("emu-earth-v2",768,768,(g,r)=>{
  g.fillStyle="#e9dcc3";g.fillRect(0,0,768,768);
  for(let i=0;i<6200;i++){const x=r()*768,y=r()*768,z=.5+r()*4;g.fillStyle=r()>.5?"rgba(119,82,55,.10)":"rgba(255,246,219,.16)";g.beginPath();g.ellipse(x,y,z*(.5+r()),z,r()*6.28,0,6.283);g.fill();}
  for(let i=0;i<120;i++){const x=r()*768,y=r()*768;g.strokeStyle="rgba(111,122,71,.24)";g.lineWidth=1+r()*2;g.lineCap="round";for(let j=0;j<3;j++){g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+8*(r()-.5),y-9,x+12*(r()-.5),y-18-r()*15);g.stroke();}}
 });
}
function road(){
 return ctex("emu-road-v2",768,768,(g,r)=>{
  g.fillStyle="#f1dac2";g.fillRect(0,0,768,768);
  for(let i=0;i<8500;i++){g.fillStyle=r()>.6?"rgba(108,77,56,.14)":"rgba(255,252,227,.23)";g.fillRect(r()*768,r()*768,2+r()*7,1+r()*3);}
  for(let i=0;i<15;i++){g.strokeStyle="rgba(115,88,66,.10)";g.lineWidth=3+r()*7;g.beginPath();g.moveTo(r()*768,i*51);g.bezierCurveTo(r()*768,i*51+25,r()*768,i*51+40,r()*768,i*51+50);g.stroke();}
 });
}
function timber(){
 return ctex("emu-timber-v2",1024,512,(g,r)=>{
  g.fillStyle="#f1d2ab";g.fillRect(0,0,1024,512);
  for(let n=0;n<10;n++){const y=n*51.2;g.fillStyle=n%2?"#f7d9ac":"#edcaa0";g.fillRect(0,y,1024,50);g.fillStyle="rgba(88,55,45,.26)";g.fillRect(0,y+48,1024,3);g.fillStyle="rgba(255,252,217,.42)";g.fillRect(0,y+2,1024,3);
   for(let i=0;i<24;i++){const x=r()*1024,yy=y+6+r()*38;g.strokeStyle=r()>.4?"rgba(123,69,43,.12)":"rgba(255,247,203,.3)";g.lineWidth=.5+r()*1.7;g.beginPath();g.moveTo(x,yy);g.bezierCurveTo(x+15,yy+r()*3,x+35,yy-r()*3,x+80+r()*150,yy);g.stroke();}
   for(let x=80;x<1024;x+=170){const xx=x+Math.round(r()*28);g.fillStyle="rgba(75,55,48,.35)";g.beginPath();g.arc(xx,y+10,2.5,0,6.28);g.fill();g.beginPath();g.arc(xx,y+39,2.5,0,6.28);g.fill();}
  }
 });
}
function roof(){
 return ctex("emu-roof-v2",768,768,(g,r)=>{
  g.fillStyle="#e4c3bb";g.fillRect(0,0,768,768);
  for(let j=0;j<24;j++){const y=j*32;g.fillStyle=j%2?"rgba(77,58,79,.16)":"rgba(255,238,222,.18)";g.fillRect(0,y,768,30);g.strokeStyle="rgba(79,61,73,.29)";g.lineWidth=2;g.beginPath();g.moveTo(0,y+31);g.lineTo(768,y+31);g.stroke();
   for(let i=0;i<18;i++){const x=i*44+(j%2?22:0);g.strokeStyle="rgba(68,51,67,.22)";g.beginPath();g.moveTo(x,y);g.lineTo(x,y+31);g.stroke();}}
  for(let i=0;i<170;i++){g.fillStyle="rgba(255,250,227,.11)";g.fillRect(r()*768,r()*768,10+r()*55,1+r()*2);}
 });
}
const paints:Record<string,()=>THREE.Texture>={
 "#b59a66":()=>rep(earth(),8,8),"#c49b73":()=>rep(road(),7,2),
 "#c6775c":()=>rep(timber(),2,2),"#d2b68b":()=>rep(timber(),1,1),
 "#71505c":()=>rep(roof(),2,2),"#a58262":()=>rep(timber(),1,1),
 "#a98764":()=>rep(timber(),3,1),"#aa8b67":()=>rep(timber(),3,1),
 "#756d51":()=>rep(timber(),1,1),"#827e62":()=>rep(timber(),1,1)
};
export function materialFor(color:string){
 let m=palette.get(color);
 if(!m){m=twoTone(new THREE.MeshLambertMaterial({color,...(paints[color]?{map:paints[color]()}:{}),side:THREE.FrontSide}));palette.set(color,m);}
 return m;
}
export const Painted:React.FC<{color:string}>=({color})=><primitive object={materialFor(color)} attach="material" dispose={null}/>;
