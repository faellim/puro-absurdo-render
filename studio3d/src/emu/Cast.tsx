/* 2D original cast integrated as camera-facing cards in a 3D world.
 * People are drawn by the imported MIT toon engine; emus are an original drawing.
 */
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useCurrentFrame } from "remotion";
import { Pen, bodyFront, townsfolk, soldier, type Outfit, type Expr } from "../../reference/bridge/toon";
import { at, marker, smooth, actingAt, cueFrame } from "./story";
import { cameraAt } from "./story";
import { cardShade } from "../../reference/bridge/cardshade";
import { LIGHTS } from "../../reference/bridge/lights";
import { NOINK } from "../../reference/bridge/ink";

const SOLDIER:Outfit = {
 ...soldier(1),
 jacket:"#82794c", pants:"#504e41", boots:"#2e2929",
 hat:"cap", cap:"#77724a", belt:"#b5a37b", buttons:"#d5c1a0",
 rifle:false
};
const OFFICER:Outfit = {...SOLDIER,jacket:"#99804b",pants:"#534d3f",cap:"#836740",
 moustache:"#4b3430",build:"stout"};
const FARMER:Outfit = {...townsfolk(3),jacket:"#ae7860",pants:"#66523f",
 hat:"hair",hair:"#524338",skin:"#f4cd9e"};
const NEWSPAPER:Outfit = {...townsfolk(1),jacket:"#48637b",pants:"#313b4f",
 hat:"tophat",skin:"#eed2b4"};

export type HumanRole="farmer"|"officer"|"soldier"|"reporter";
const VARIANTS:Record<HumanRole,Outfit>={farmer:FARMER,officer:OFFICER,soldier:SOLDIER,reporter:NEWSPAPER};

function makeSurface(width:number,height:number){
 const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=2;
 return tex;
}
function humanTex(tex:THREE.CanvasTexture,role:HumanRole,face:Expr,frame:number,seed:number,activity:string){
 const canvas=tex.image as HTMLCanvasElement;
 const g=canvas.getContext("2d");
 if(!g)throw Error("Canvas unavailable");
 g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,600,1000);
 const pen=new Pen(g);
 bodyFront(pen,VARIANTS[role],{
  mode:activity==="walk"?"stroll":"stand",phase:frame*.28+seed*.017,seed,
  expr:face,look:activity==="point"?-.4:role==="officer"?-.24:.18,
  blink:(frame+seed*7)%(48+seed%26)<4,
  tilt:activity==="bump"?Math.sin(frame*.65)*.085:
       activity==="walk"?Math.sin(frame*.28+seed)*.045:activity==="react"?-.06:0,
  headTilt:activity==="react"||activity==="point"?-.14:0,
  wave:activity==="wave"?.54:activity==="point"?.24:undefined,
  light:-.67
 });
 tex.needsUpdate=true;
}
function emuTex(tex:THREE.CanvasTexture,frame:number,seed:number,running:boolean,flip:boolean,face:"alert"|"calm"|"smug"|"startled"){
 const c=tex.image as HTMLCanvasElement;
 const g=c.getContext("2d");if(!g)throw Error("Cannot draw emu");
 g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,440,780);
 if(flip){g.translate(440,0);g.scale(-1,1);}
 const step=running?Math.sin(frame*.38+seed)*48:Math.sin(frame*.07+seed)*8;
 const bob=running?Math.abs(Math.sin(frame*.35+seed))*9:Math.sin(frame*.1+seed)*2;
 g.translate(0,bob);
 g.lineCap="round";g.lineJoin="round";
 const line=(pts:[number,number][],w:number,color:string)=>{
  g.beginPath();g.moveTo(pts[0][0],pts[0][1]);
  for(const [x,y] of pts.slice(1))g.lineTo(x,y);g.lineWidth=w;g.strokeStyle=color;g.stroke();
 };
 // Feather tuft and back contour: layered surfaces, never a stiff oval.
 for(let i=0;i<12;i++){
  const a=i*2.4, x=100+Math.sin(a)*104, y=430+Math.cos(a)*78;
  g.beginPath();g.ellipse(x,y,70,104,a*.16,0,Math.PI*2);
  g.fillStyle=i%2?"#6b5652":"#584a48";g.fill();
 }
 for(let i=0;i<2;i++){
  const lx=i===0?145:240;
  line([[lx,510],[lx+step*(i===0?1:-1),608],[lx+step*(i===0?1:-1),758]],27,"#403b3a");
  line([[lx,515],[lx+step*(i===0?1:-1),608],[lx+step*(i===0?1:-1),758]],18,"#6d625c");
  line([[lx+step*(i===0?1:-1),758],[lx+step*(i===0?1:-1)+55,764]],15,"#332e2b");
 }
 // Neck curves upward into narrow head. Body has broken-up painterly feather patches.
 g.beginPath();g.ellipse(195,434,154,122,-.16,0,Math.PI*2);
 g.fillStyle="#6c5853";g.fill();g.strokeStyle="#352b31";g.lineWidth=12;g.stroke();
 for(let i=0;i<42;i++){
  const angle=i*2.399, rr=Math.sqrt((i+1)/43),x=195+rr*Math.cos(angle)*138,y=430+rr*Math.sin(angle)*109;
  line([[x-8,y-10],[x+4,y+10]],5,i%3?"#867069":"#473d3e");
 }
 line([[287,409],[300,342],[306,274],[294,214],[296,135]],60,"#342c36");
 line([[287,409],[300,342],[306,274],[294,214],[296,135]],43,"#6c6361");
 // Bluish dark head with pointy crest and pronounced beak.
 g.beginPath();g.ellipse(294,128,54,64,-.1,0,Math.PI*2);
 g.fillStyle="#40435c";g.fill();g.strokeStyle="#292939";g.lineWidth=11;g.stroke();
 for(let j=0;j<7;j++)line([[262+j*9,84],[260+j*9,50+(j%2)*15]],7,"#2d313e");
 g.beginPath();g.moveTo(337,127);g.lineTo(405,145);g.lineTo(344,156);g.closePath();
 g.fillStyle="#8b827b";g.fill();g.strokeStyle="#34313b";g.lineWidth=7;g.stroke();
 if(running&&Math.sin(frame*.18+seed)>.72){
  g.beginPath();g.moveTo(340,157);g.lineTo(389,168);g.lineTo(344,165);g.closePath();
  g.fillStyle="#70626a";g.fill();
 }
 const blink=face==="startled"?false:(frame+seed*3)%(62+(seed%17))<3;
 if(blink)line([[303,117],[327,114]],7,"#211f2a");
 else {
  g.beginPath();g.ellipse(317,116,12,14,0,0,Math.PI*2);g.fillStyle="#fcf5df";g.fill();
  g.beginPath();g.ellipse(320,117,7,9,0,0,Math.PI*2);g.fillStyle="#17191e";g.fill();
 }
 if(face==="alert"||face==="startled"){
  line([[290,95],[323,90]],face==="startled"?9:7,"#25252d");
  g.beginPath();g.arc(319,116,22,-2.0,0,false);g.strokeStyle="#201d2a";g.lineWidth=4;g.stroke();
 }
 if(face==="smug"){
  // Last-beat wink and upturned beak: the bird is the punchline.
  line([[303,121],[327,118]],6,"#2b2531");
  line([[340,159],[359,159],[381,151]],4,"#292632");
 }
 if(face==="startled"){
  g.beginPath();g.ellipse(321,116,16,17,0,0,Math.PI*2);
  g.fillStyle="#f7f1de";g.fill();g.strokeStyle="#26202b";g.lineWidth=3;g.stroke();
  g.beginPath();g.ellipse(323,114,6,8,0,0,Math.PI*2);
  g.fillStyle="#1b1923";g.fill();
 }
 // Sparse dark feather streaks break flat wing fill.
 for(let i=0;i<11;i++){
  const t=i/11,spread=Math.sin(t*Math.PI);
  line([[103+i*8,420-spread*22],[92+i*8,439+spread*15]],2.5,i%2?"#4f403f":"#9b8272");
 }
 // Small side wing gives a visible run silhouette.
 g.beginPath();g.ellipse(149+step*.11,431,73,48,-.2,0,Math.PI*2);
 g.fillStyle="#75605c";g.fill();g.strokeStyle="#43343b";g.lineWidth=7;g.stroke();
 tex.needsUpdate=true;
}
/** Layered soft contact shadow, visually grounded but never a hard disk. */
function Shadow({x,z,size=.8}:{x:number;z:number;size?:number}){
 return <group position={[x,.029,z]} rotation={[-Math.PI/2,0,0]}>
  {[1.42,1.04,.74].map((k,i)=><mesh key={i} position={[0,0,i*.002]} ref={(obj)=>{if(obj)obj.layers.set(NOINK);}}>
   <circleGeometry args={[size*k,32]}/>
   <meshBasicMaterial color="#362c32" transparent opacity={[.035,.06,.08][i]} depthWrite={false}/>
  </mesh>)}
 </group>;
}
/** Artist-made Canvas2D portrait on a yaw-facing *lit* quad, not an unlit Sprite.
 * NOINK skips the 3D edge pass and avoids double outlines; shadows use alpha cutout.
 */
const LitCard:React.FC<{tex:THREE.Texture;x:number;y:number;z:number;w:number;h:number;shadow?:boolean}>=
 ({tex,x,y,z,w,h,shadow=false})=>{
 const frame=useCurrentFrame();
 const camera=cameraAt(frame);
 const yaw=Math.atan2(camera.eye[0]-x,camera.eye[2]-z);
 const material=useMemo(()=>cardShade(new THREE.MeshLambertMaterial({
    map:tex,alphaTest:.35,side:THREE.DoubleSide,transparent:false
 })),[tex]);
 const depth=useMemo(()=>new THREE.MeshDepthMaterial({map:tex,alphaTest:.35,side:THREE.DoubleSide}),[tex]);
 useEffect(()=>()=>{material.dispose();depth.dispose();},[material,depth]);
 return <mesh position={[x,y,z]} rotation={[0,yaw,0]} receiveShadow castShadow={shadow}
   customDepthMaterial={depth} ref={(obj)=>{if(obj)obj.layers.set(NOINK);}} renderOrder={1}>
   <planeGeometry args={[w,h]}/>
   <primitive object={material} attach="material" dispose={null}/>
 </mesh>;
};

export const Human:React.FC<{role:HumanRole;id:number;x:number;z:number;s?:number}> = ({role,id,x,z,s=1})=>{
 const f=useCurrentFrame();const {clip,local}=at(f);
 const act=actingAt(f);
 const activity=clip.id==="truck"||clip.id==="bumps"?"bump":
  act==="point"?"point":act==="shock"||act==="surprised"?"react":
  clip.id==="press"?"wave":["farmers","ambush","plan"].includes(clip.id)?"walk":"stand";
 let face:Expr="neutral";
 if(act==="shock"||act==="surprised")face="shock";
 else if(act==="dazed"||act==="drive")face="dazed";
 else if(act==="grin")face="grin";
 else if(act==="nervous"||act==="point")face="nervous";
 else if(["farmers","ambush","press"].includes(clip.id))face=role==="officer"?"stern":"nervous";
 if(clip.id==="hook"&&role==="officer"&&f<cueFrame("hook",["soldados"],.52))face="stern";
 if(clip.id==="plan"&&role==="officer"&&act==="neutral")face="grin";
 const tex=useMemo(()=>makeSurface(600,1000),[role,id]);
 humanTex(tex,role,face,f,id*11+3,activity);
 useEffect(()=>()=>tex.dispose(),[tex]);
 const shake=activity==="bump"?Math.sin(f*.7)*.1:0;
 // A repeatable 2-step cycle: the travelling body eases between planted poses;
 // feet do not accelerate continuously during the contact interval.
 const phase=local*.28+id*.3;
 const cycle=phase/(Math.PI*2);
 const grounded=Math.floor(cycle*2);
 const frac=cycle*2-grounded;
 const transfer=smooth((frac-.36)/.55);
 const stride=activity==="walk"?Math.min(1.12,(grounded+transfer)*.135):0;
 const xpos=x+(clip.id==="truck"?Math.min(local/120,1)*.8:stride);
 return <>
  <Shadow x={xpos} z={z} size={.68*s}/>
  <LitCard tex={tex} x={xpos} y={2.16*s+shake} z={z}
   w={2.62*s} h={4.35*s} shadow={clip.info.light==="golden"}/>
 </>;
};

export const Emu:React.FC<{id:number;x:number;z:number;s?:number}> = ({id,x,z,s=1})=>{
 const f=useCurrentFrame();const {clip,local,u}=at(f);
 const runs=["hook","scatter","truck","bumps","zigzag"].includes(clip.id);
 const seed=id*13+7;
 const stride=runs?local*.052:local*.012;
 let dx=0,dz=0;
 if(clip.id==="scatter"||clip.id==="zigzag"){
  dx=(id%2===0?1:-1)*u*(3.8+id*.36)+Math.sin(stride+id)*.9;
  dz=-u*(2.7+(id%3))*.7;
 }else if(clip.id==="truck"||clip.id==="bumps"){
  dx=u*(2.0+id*.3);dz=-.15*u;
 }else if(clip.id==="ending")dx=Math.sin(f*.02)*.14;
 const actualX=x+dx,actualZ=z+dz;
 const tex=useMemo(()=>makeSurface(440,780),[id]);
 const act=actingAt(f);
 const mood: "alert"|"calm"|"smug"|"startled" =
   clip.id==="ending"?"smug":
   clip.id==="jam"&&act==="shock"?"startled":
   ["hook","scatter","zigzag"].includes(clip.id)?"alert":"calm";
 emuTex(tex,f,seed,runs,id%2===0,mood);
 useEffect(()=>()=>tex.dispose(),[tex]);
 const pulse=runs?Math.sin(f*.32+id)*.05:0;
 return <>
  <Shadow x={actualX} z={actualZ} size={.57*s}/>
  <LitCard tex={tex} x={actualX} y={(1.79+pulse)*s} z={actualZ}
    w={2.17*s} h={3.62*s} shadow={clip.info.light==="golden"}/>
 </>;
};
