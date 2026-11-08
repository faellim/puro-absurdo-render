/* Puro Absurdo — Australia 1932. All sets and props are original procedural 3D. */
import React, { useMemo } from "react";
import * as THREE from "three";
import { useCurrentFrame } from "remotion";
import { useThree } from "@react-three/fiber";
import { at, cameraAt } from "./story";
import { Emu, Human } from "./Cast";
import { Painted } from "./Materials";
import { Lighting, Sky } from "./Lighting";
import {SceneProps} from "./SceneProps";

const INK="#29202b";
const mat=(color:string)=><Painted color={color}/>;

const Box:React.FC<{at:[number,number,number];sz:[number,number,number];color:string;rot?:[number,number,number]}>=({at,sz,color,rot})=>
 <mesh position={at} rotation={rot??[0,0,0]} castShadow receiveShadow>
  <boxGeometry args={sz}/>{mat(color)}
 </mesh>;

const Eucalyptus:React.FC<{at:[number,number,number];scale?:number}>=({at,scale=1})=>{
 const crowns:[[number,number,number],number,string][]=[
 [[-1.0,3.7,0],1.6,"#527b58"],[[.8,4.0,0],1.65,"#739568"],
 [[0,4.9,.35],1.45,"#597f62"],[[-.1,3.4,.75],1.43,"#8ba778"]
 ];
 return <group position={at} scale={scale}>
   <mesh position={[0,1.85,0]} rotation={[0,0,.09]} castShadow><cylinderGeometry args={[.2,.34,3.75,9]}/>{mat("#926b54")}</mesh>
   <mesh position={[-.45,3.1,0]} rotation={[0,0,-.43]}><cylinderGeometry args={[.12,.18,2.1,7]}/>{mat("#93775a")}</mesh>
   {crowns.map(([p,r,c],i)=><mesh key={i} position={p} castShadow><icosahedronGeometry args={[r,1]}/>{mat(c)}</mesh>)}
 </group>;
};

const Wheat:React.FC=()=>{
 const geo=useMemo(()=>{
  const vertices:number[]=[],colors:number[]=[];
  const rng=(v:number)=>((Math.sin(v*94.13+113.7)*43758.5453)%1+1)%1;
  const add=(a:number[],b:number[],c:number[])=>{
   vertices.push(...a,...b);
   colors.push(...c,...c);
  };
  for(let i=0;i<920;i++){
   const x=-25+rng(i*7+1)*50,z=-21+rng(i*11+5)*29;
   if((x>-9&&x<-4&&z>-10&&z<-5) || (z>1&&z<6) || (x>3&&x<8&&z>-9&&z<-1))continue;
   const h=.55+rng(i*3)*.63,y=0;
   const c=[.67+rng(i*23)*.16,.54+rng(i*17)*.16,.28+rng(i*31)*.06];
   add([x,y,z],[x+.06,h,z-.02],c);
   for(let j=0;j<3;j++){
    const q=h-.08-j*.12;
    add([x+.04,q,z],[x+.05+(-1)**j*.11,q+.19,z+.04],[.84,.67,.30]);
   }
  }
  const b=new THREE.BufferGeometry();
  b.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
  b.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
  return b;
 },[]);
 return <lineSegments geometry={geo} ref={(obj)=>{if(obj)obj.layers.set(3);}}><lineBasicMaterial vertexColors transparent opacity={.82} depthWrite={false}/></lineSegments>;
};

const Barn:React.FC=()=> <group position={[-9,0,-8.5]}>
 <Box at={[0,2.6,0]} sz={[6,5.2,4.6]} color="#c6775c"/>
 <Box at={[-1.73,2.6,2.33]} sz={[1.65,3.9,.12]} color="#4b4c50"/>
 <Box at={[1.65,3.4,2.33]} sz={[1.6,1.6,.12]} color="#d2b68b"/>
 {[-1,1].map(s=><Box key={s} at={[s*1.51,5.55,0]} sz={[3.65,.28,5.4]}
  color="#71505c" rot={[0,0,s*.65]}/>)}
 <Box at={[0,6.8,0]} sz={[.3,.7,.3]} color="#74534b"/>
</group>;

const Windmill:React.FC<{frame:number}>=({frame})=><group position={[7.8,0,-13]}>
 <mesh position={[0,4.3,0]} castShadow><cylinderGeometry args={[.15,.68,8.3,4]}/>{mat("#d3bb9f")}</mesh>
 <mesh position={[0,8.4,.18]}><sphereGeometry args={[.45,10,9]}/>{mat("#6d6262")}</mesh>
 <group position={[0,8.4,.65]} rotation={[0,0,frame*.009]}>
  {Array.from({length:6},(_,i)=><group rotation={[0,0,i*Math.PI/3]} key={i}>
   <Box at={[0,2.06,0]} sz={[.12,3.5,.07]} color="#766251"/>
   <Box at={[.24,2.8,0]} sz={[.7,1.2,.065]} color="#ded4bb"/>
  </group>)}
 </group>
</group>;

const FarmFence:React.FC=()=> <group>
 {[-9,-6,-3,0,3,6,9].map((x,i)=><group key={i}>
  <Box at={[x,.75,-2.8]} sz={[.16,1.5,.16]} color="#a58262"/>
  <Box at={[x,.68,7.2]} sz={[.16,1.36,.16]} color="#a58262"/>
 </group>)}
 {[.65,1.15].map(y=><React.Fragment key={y}>
  <Box at={[0,y,-2.8]} sz={[20,.13,.13]} color="#a98764"/>
  <Box at={[0,y,7.2]} sz={[20,.13,.13]} color="#aa8b67"/>
 </React.Fragment>)}
 </group>;

const Pool:React.FC=()=> <group position={[5.8,.06,-5]}>
 <mesh rotation={[-Math.PI/2,0,0]}><circleGeometry args={[3.1,48]}/>
  <meshToonMaterial color="#578f9f" side={THREE.DoubleSide}/>
 </mesh>
 <mesh position={[0,.02,0]} rotation={[-Math.PI/2,0,0]}>
  <ringGeometry args={[3,3.27,48]}/><meshBasicMaterial color="#d2b78f" side={THREE.DoubleSide}/>
 </mesh>
</group>;

const Truck:React.FC<{frame:number}>=({frame})=>{
 const {clip,u}=at(frame);
 const bump=clip.id==="bumps"?Math.sin(frame*.65)*.15:Math.sin(frame*.09)*.04;
 const x=-5+u*9;
 return <group position={[x,.36+bump,2.3]} rotation={[0,-.15,bump*.3]}>
  <Box at={[0,1.15,0]} sz={[5.6,.4,2.35]} color="#756d51"/>
  <Box at={[-1.64,2.35,0]} sz={[2.23,2.0,2.28]} color="#827e62"/>
  <Box at={[.98,1.85,0]} sz={[2.8,1.0,2.2]} color="#6c7858"/>
  <Box at={[-1.6,2.75,1.16]} sz={[1.4,.82,.06]} color="#9dbaca"/>
  <Box at={[-1.6,2.75,-1.16]} sz={[1.4,.82,.06]} color="#9dbaca"/>
  {[-1.7,1.7].flatMap(xx=>[-1.23,1.23].map((zz,i)=><group key={xx+"-"+i} position={[xx,.56,zz]}>
   <mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.66,.66,.22,16]}/>{mat("#302c30")}</mesh>
   <mesh position={[0,0,zz>0?.13:-.13]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.26,.26,.23,16]}/>{mat("#b8ae92")}</mesh>
  </group>))}
  <Box at={[-2.85,1.38,0]} sz={[.2,.7,1.9]} color="#474842"/>
  {/* stylized spare wheel and toolbox; no firing animations */}
  <Box at={[2.25,1.5,0]} sz={[.6,.8,1.9]} color="#4b5346"/>
 </group>;
};

const Tripod:React.FC=()=><group position={[-1.65,0,0]}>
 <mesh position={[0,1.32,0]}><cylinderGeometry args={[.09,.12,2.5,9]}/>{mat("#4b4642")}</mesh>
 {[-1,0,1].map((n)=><mesh key={n} position={[.18*Math.cos(n*2),.65,.18*Math.sin(n*2)]} rotation={[.4*Math.sin(n*2),0,.4*Math.cos(n*2)]}>
  <cylinderGeometry args={[.035,.07,1.45,7]}/>{mat("#5b4943")}
 </mesh>)}
 <Box at={[.05,2.55,0]} sz={[1.1,.33,.34]} color="#5c5250"/>
 <mesh rotation={[0,0,Math.PI/2]} position={[1.02,2.55,0]}>
  <cylinderGeometry args={[.09,.09,1.42,8]}/>{mat("#4e484c")}
 </mesh>
 <mesh rotation={[0,0,Math.PI/2]} position={[.0,2.85,0]}>
  <cylinderGeometry args={[.53,.53,.15,16]}/>{mat("#5c5550")}
 </mesh>
 </group>;

const Newspaper:React.FC=()=>{
 const tex=useMemo(()=>{
  const c=document.createElement("canvas");c.width=512;c.height=620;
  const g=c.getContext("2d")!;
  g.fillStyle="#f7e9c9";g.fillRect(0,0,512,620);
  g.fillStyle="#493d36";g.font="bold 47px Georgia";g.textAlign="center";
  g.fillText("NOTÍCIAS",256,82);
  g.fillRect(30,110,452,7);
  g.font="bold 43px Georgia";g.fillText("GUERRA DOS",256,175);
  g.fillText("EMUS",256,228);
  g.strokeStyle="#55483f";g.lineWidth=6;g.strokeRect(65,250,380,270);
  g.beginPath();g.ellipse(266,389,86,91,0,0,Math.PI*2);g.stroke();
  g.beginPath();g.moveTo(285,330);g.lineTo(310,273);g.lineTo(332,350);g.stroke();
  for(let i=0;i<4;i++)g.fillRect(50,552+i*15,410-(i%2)*40,5);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
 },[]);
 return <mesh position={[-.1,3.25,2.8]} rotation={[.05,-.18,-.04]}>
  <planeGeometry args={[3,3.6]}/><meshBasicMaterial map={tex} side={THREE.DoubleSide}/>
 </mesh>;
};

const Dust:React.FC<{frame:number}>=({frame})=>{
 const {u,clip}=at(frame);
 const show=["truck","bumps","scatter","zigzag"].includes(clip.id);
 if(!show)return null;
 return <group>
  {Array.from({length:23},(_,i)=>{
   const phi=i*2.399,vel=.09+(i%5)*.02, tt=(frame*vel+i)%48/48;
   return <mesh key={i} position={[-4+u*9+Math.cos(phi)*tt*2.5,.18+tt*.9,2.5+Math.sin(phi)*tt*2]}>
    <sphereGeometry args={[.16+(i%4)*.035,7,6]}/>
    <meshBasicMaterial transparent opacity={(1-tt)*.24} color="#c49a70" depthWrite={false}/>
   </mesh>
  })}
 </group>;
};

const FarmSet:React.FC<{frame:number}>=({frame})=>{
 const {clip}=at(frame);
 const golden=clip.info.light==="golden";
 const showTruck=["truck","bumps"].includes(clip.id);
 const showTripod=["plan","jam","ambush"].includes(clip.id);
 return <>
  <fog attach="fog" args={[golden?"#efb489":"#b8d0ec",golden?50:25,golden?380:300]}/>
  <Sky/>
  <Lighting/>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.11,0]} receiveShadow>
    <planeGeometry args={[190,190]}/>{mat("#b59a66")}
  </mesh>
  {/* A continuous physical dirt road with perspective. */}
  {["hook","setting","farmers","truck","bumps","press","result"].includes(clip.id)&&<Box at={[0,-.025,4.15]} sz={[65,.14,5.5]} color="#c49b73"/>}
  {Array.from({length:8},(_,i)=><mesh key={i} position={[-20+i*5,.07,4.0]} rotation={[-Math.PI/2,0,0]}>
   <circleGeometry args={[.38+(i%3)*.3,7]}/>
   <meshBasicMaterial color="#aa795d" transparent opacity={.45}/>
  </mesh>)}
  <Wheat/>
  {/* Reuse the same geographic farm, but never repeat identical hero silhouettes
      in every camera shot. The pond, road, barn and windmill are intentional sets. */}
  {["hook","setting","farmers","plan","press","result"].includes(clip.id)&&<Barn/>}
  {["setting","scatter","result","ending"].includes(clip.id)&&<Windmill frame={frame}/>}
  {["setting","ambush","jam","zigzag"].includes(clip.id)&&<Pool/>}
  {["hook","setting","farmers","plan","scatter","result","ending"].includes(clip.id)&&<FarmFence/>}
  <Eucalyptus at={[-15,0,-13]} scale={1.45}/>
  <Eucalyptus at={[15,0,-14]} scale={1.7}/>
  <Eucalyptus at={[20,0,3]} scale={1.08}/>
  <Eucalyptus at={[-19,0,9]} scale={1.18}/>
  <SceneProps/>
  {showTruck&&<Truck frame={frame}/>}
  {showTripod&&<Tripod/>}
  {clip.id==="press"&&<Newspaper/>}
  <Dust frame={frame}/>
 </>;
};

const EmuFlock:React.FC=()=>{
 const f=useCurrentFrame();const {clip}=at(f);
 if(["farmers","plan","press"].includes(clip.id))return null;
 const count=clip.id==="ending"?1:clip.id==="hook"?1:clip.id==="jam"?4:clip.id==="scatter"||clip.id==="zigzag"?6:7;
 return <>{Array.from({length:count},(_,i)=>{
  const near=clip.id==="ending";
  const migration=clip.id==="scatter"||clip.id==="zigzag";
  const hero=clip.id==="hook";
  const x=near ? .2 : hero ? .3 : migration ? -3.2+(i%4)*2.15 : -5+i%5*2.55;
  const z=near ? 2.8 : hero ? .7 : migration ? -2.6-Math.floor(i/4)*3.1 : -1.8-Math.floor(i/5)*4+(i%3)*.3;
  const s=near ? 1.5 : hero ? 1.32 : Math.max(.67,1.05-Math.floor(i/5)*.2);
  return <Emu id={i} x={x} z={z} s={s} key={i}/>;
 })}</>;
};

const Humans:React.FC=()=>{
 const f=useCurrentFrame();const {clip}=at(f);
 if(["setting","scatter","zigzag","ending","result"].includes(clip.id))return null;
 const farmer=["farmers","plan","ambush"].includes(clip.id);
 return <>
  {farmer&&<Human role="farmer" id={1} x={-4} z={2.0} s={.98}/>}
  <Human role={clip.id==="press"?"reporter":"officer"} id={2} x={clip.id==="press"?-3.6:-1.2} z={2.9} s={1.0}/>
  <Human role="soldier" id={3} x={2.6} z={2} s={.89}/>
  {["ambush","jam","hook"].includes(clip.id)&&<Human role="soldier" id={4} x={5.4} z={-1} s={.76}/>}
 </>;
};

const Director:React.FC=()=>{
 const f=useCurrentFrame(),{camera}=useThree(),x=cameraAt(f);
 camera.position.set(...x.eye);camera.lookAt(...x.look);camera.rotateZ(x.tilt);
 (camera as THREE.PerspectiveCamera).fov=x.fov;
 camera.updateProjectionMatrix();
 return null;
};

export const EmuWorld:React.FC=()=>{
 const f=useCurrentFrame();
 return <>
  <Director/>
  <FarmSet frame={f}/>
  <EmuFlock/>
  <Humans/>
 </>;
};
