import React from "react";
import * as THREE from "three";
import {useCurrentFrame} from "remotion";
import {at} from "./story";
import {Painted} from "./Materials";
const Box:React.FC<{p:[number,number,number];s:[number,number,number];c:string;r?:[number,number,number]}>=({p,s,c,r})=>
 <mesh position={p} rotation={r??[0,0,0]} castShadow receiveShadow><boxGeometry args={s}/><Painted color={c}/></mesh>;
const Rock:React.FC<{p:[number,number,number];s?:number}>=({p,s=1})=>
 <mesh position={p} rotation={[.12,.4,.05]} scale={[1.1*s,.62*s,.84*s]}><dodecahedronGeometry args={[1,0]}/><Painted color="#aa8b67"/></mesh>;
const Hay:React.FC<{p:[number,number,number];s?:number}>=({p,s=1})=><group position={p} scale={s}>
  <mesh position={[0,.72,0]} rotation={[0,.17,.05]} castShadow><cylinderGeometry args={[.9,1.14,1.38,10]}/><Painted color="#d2b68b"/></mesh>
  {[-.2,.2].map((z,i)=><Box key={i} p={[0,.75,z+.17]} s={[2.05,.08,.07]} c="#a58262"/>)}
 </group>;
const Homestead:React.FC=()=><group position={[-17,0,-12]}>
 <Box p={[0,2.85,0]} s={[7.5,5.7,5.6]} c="#d2b68b"/>
 <Box p={[0,5.7,0]} s={[8.2,.37,6.35]} c="#71505c" r={[0,0,.2]}/>
 <Box p={[-2.2,2.4,2.84]} s={[1.3,3.1,.15]} c="#827e62"/>
 {[-.1,2.25].map((x,i)=><Box key={i} p={[x,3.4,2.85]} s={[1.25,1.6,.16]} c="#9dbaca"/>)}
 <Box p={[-2.9,6.7,-.8]} s={[.85,2.4,.88]} c="#c6775c"/>
 </group>;
const PlanningDesk:React.FC=()=> <group position={[-.3,0,-1.6]}>
 <Box p={[0,1.35,0]} s={[3.1,.22,1.72]} c="#a98764"/>
 {[-1.25,1.25].flatMap(x=>[-.66,.66].map(z=><Box key={x+"-"+z} p={[x,.68,z]} s={[.16,1.3,.16]} c="#756d51"/>))}
 <mesh rotation={[-Math.PI/2,0,.09]} position={[0,1.49,0]}><planeGeometry args={[2.35,1.2]}/><meshBasicMaterial color="#f2ddaa" side={THREE.DoubleSide}/></mesh>
 <Box p={[-.2,1.503,0]} s={[1.55,.01,.045]} c="#71505c" r={[0,.22,0]}/>
 <Box p={[.4,1.54,-.2]} s={[.52,.09,.32]} c="#c6775c"/>
 </group>;
const Silo:React.FC=()=> <group position={[10.4,0,-15]}>
 <mesh position={[0,4.4,0]} castShadow><cylinderGeometry args={[2,2.05,8.8,16]}/><Painted color="#827e62"/></mesh>
 <mesh position={[0,8.8,0]} castShadow><coneGeometry args={[2.35,1.8,16]}/><Painted color="#71505c"/></mesh>
 <Box p={[0,3.5,2.08]} s={[1.1,1.8,.09]} c="#4b4c50"/>
 </group>;
const TankReeds:React.FC=()=> <group>
 {Array.from({length:38},(_,i)=>{
   const a=i*2.3999,rad=3.38+(i%5)*.23;
   const x=5.8+Math.cos(a)*rad,z=-5+Math.sin(a)*rad,h=.7+(i%7)*.12;
   return <group key={i}>
    <mesh position={[x,.4+h*.5,z]} rotation={[Math.sin(a)*.12,0,Math.cos(a)*.11]}>
      <cylinderGeometry args={[.025,.04,h,5]}/><Painted color={i%2?"#527b58":"#739568"}/>
    </mesh>
    {i%4===0&&<mesh position={[x,.7+h,z]}><sphereGeometry args={[.085,7,7]}/><Painted color="#756d51"/></mesh>}
   </group>;
 })}
 </group>;
const Roadworks:React.FC=()=> <group>
 {Array.from({length:30},(_,i)=>{
  const x=-19+i*1.3,z=i%2?3.04:5.09;
  return <mesh key={i} position={[x,.07,z]} rotation={[-Math.PI/2,0,0]}>
   <circleGeometry args={[.17+(i%3)*.08,7]}/><meshBasicMaterial color="#956c54" transparent opacity={.24}/>
  </mesh>;
 })}
 {Array.from({length:14},(_,i)=><Rock key={i} p={[-12+i*2.05,.06,6.8+(i%3)*1.3]} s={.09+(i%3)*.08}/>)}
 </group>;
const FarmProduce:React.FC=()=> <group>
 <Hay p={[-5,0,-2.2]} s={1.13}/><Hay p={[-7.35,0,-3.4]} s={.88}/>
 <Box p={[-8,1.5,1]} s={[2,3,1.8]} c="#a98764"/>
 <Box p={[-8,3.15,1]} s={[2.4,.3,2.1]} c="#d2b68b"/>
 <Rock p={[-7.3,.27,3.1]} s={.28}/>
 </group>;
const PressStudio:React.FC=()=> <group>
 <Box p={[-.1,.91,1.3]} s={[3.3,1.8,1.7]} c="#a98764"/>
 <Box p={[2,.65,-.4]} s={[1.4,1.3,1.4]} c="#827e62"/>
 <Box p={[-3.2,.5,-1]} s={[1.8,1,1.3]} c="#a58262"/>
 </group>;
/** Framing objects must retain readable silhouettes (never isolated green balls). */
const Foreground:React.FC<{id:string}>=({id})=>{
 if(!["farmers","plan","ambush","press","ending"].includes(id))return null;
 const z=id==="plan"?7.4:id==="press"?6.4:8.1;
 const TreeEdge:React.FC<{x:number;side:number}>=({x,side})=><group position={[x,0,z]}>
  <mesh position={[0,1.1,0]} rotation={[0,0,.12*side]}>
   <cylinderGeometry args={[.08,.15,2.2,7]}/><Painted color="#756d51"/>
  </mesh>
  {Array.from({length:5},(_,i)=><group key={i} position={[side*(.45+i*.18),1.1+i*.29,0]}>
   <mesh rotation={[0,0,side*(-.6+i*.07)]}>
    <cylinderGeometry args={[.018,.04,1.2,5]}/><Painted color="#a58262"/>
   </mesh>
   {Array.from({length:3},(_,j)=><mesh key={j}
      position={[side*(.27+j*.12),.26+j*.12,(j-1)*.24]}
      rotation={[.1*j,.2*i,side*.35]}>
     <sphereGeometry args={[.17,6,5]}/>
     <Painted color={j%2?"#597f62":"#739568"}/>
    </mesh>)}
  </group>)}
 </group>;
 return <group><TreeEdge x={-8.8} side={1}/><TreeEdge x={9.3} side={-1}/></group>;
};
export const SceneProps:React.FC=()=>{
 const frame=useCurrentFrame(),{clip}=at(frame),id=clip.id;
 return <>
  {["setting","result","ending","farmers"].includes(id)&&<Homestead/>}
  {["setting","result","scatter","zigzag"].includes(id)&&<Silo/>}
  {["farmers","setting","result"].includes(id)&&<FarmProduce/>}
  {id==="plan"&&<PlanningDesk/>}
  {["ambush","jam"].includes(id)&&<TankReeds/>}
  {["truck","bumps","zigzag"].includes(id)&&<Roadworks/>}
  {id==="press"&&<PressStudio/>}
  <Foreground id={id}/>
 </>;
};