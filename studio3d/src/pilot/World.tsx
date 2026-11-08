import React, { useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useCurrentFrame } from "remotion";

const INK="#241926";
const paint=(color:string)=> <meshToonMaterial color={color} />;

const InkBox:React.FC<{size:[number,number,number];at:[number,number,number];color:string}> = ({size,at,color})=>{
 const edges=useMemo(()=>new THREE.EdgesGeometry(new THREE.BoxGeometry(...size)),[...size]);
 return <group position={at}><mesh castShadow receiveShadow><boxGeometry args={size}/>{paint(color)}</mesh>
  <lineSegments geometry={edges}><lineBasicMaterial color={INK} transparent opacity={.84}/></lineSegments></group>;
};

const House:React.FC<{x:number;z:number;houseColor:string;seed:number}>=({x,z,houseColor,seed})=>{
 const w=3.0+seed*.12, h=4.0+seed*.45;
 return <group position={[x,0,z]}>
  <InkBox size={[w,h,2.6]} at={[0,h/2,0]} color={houseColor}/>
  <mesh position={[0,h+.57,0]} rotation={[0,Math.PI/4,0]} castShadow>
   <coneGeometry args={[2.36,1.25,4]}/>{paint(seed%2?"#b75f48":"#734453")}
  </mesh>
  <InkBox size={[.83,1.55,.06]} at={[0,.80,1.34]} color="#684b44"/>
  {[-1,1].map(side=><group key={side} position={[side*.92,h-1.23,1.34]}>
    <mesh><planeGeometry args={[.76,.86]}/><meshBasicMaterial color="#88c7df"/></mesh>
    <mesh position={[0,0,.006]}><boxGeometry args={[.085,.96,.04]}/>{paint("#f3e0b8")}</mesh>
    <mesh position={[0,0,.006]}><boxGeometry args={[.84,.075,.04]}/>{paint("#f3e0b8")}</mesh>
    </group>)}
  </group>;
};

const Tree:React.FC<{position:[number,number,number];size:number}>=({position,size})=><group position={position} scale={size}>
 <mesh position={[0,.65,0]} castShadow><cylinderGeometry args={[.12,.16,1.35,7]}/>{paint("#75523f")}</mesh>
 {[1.5,2.0,2.5].map((y,i)=><mesh key={i} position={[0,y,0]} castShadow>
  <coneGeometry args={[.97-i*.18,1.4,7]}/>{paint(i===1?"#43896a":"#3b755c")}
 </mesh>)}
</group>;

const Boat:React.FC<{f:number}>=({f})=><group position={[-1.6+Math.sin(f*.012)*.35,.22,-12.2]}>
 <mesh position={[0,0,0]} scale={[2.4,.55,1.0]}><sphereGeometry args={[1,12,8]}/>{paint("#6c4c46")}</mesh>
 <mesh position={[0,1.25,0]}><cylinderGeometry args={[.055,.075,2.7,7]}/>{paint("#594438")}</mesh>
 <mesh position={[.55,1.35,0]} rotation={[0,0,-.28]}>
  <planeGeometry args={[1.4,2.0]}/><meshBasicMaterial color="#f8efd5" side={THREE.DoubleSide}/>
 </mesh>
</group>;

const CharacterCamera:React.FC=()=>{
 const {camera}=useThree();const frame=useCurrentFrame();
 const u=Math.min(1,frame/179),ease=u*u*(3-2*u);
 // Slow physical dolly and lateral parallax; no random float.
 camera.position.set(1.5-1.7*ease,5.3-.32*ease,18.8-2.1*ease);
 camera.lookAt(0,2.8,0);
 camera.updateProjectionMatrix();
 return null;
};

export const VillageWorld:React.FC=()=>{
 const f=useCurrentFrame();
 return <>
  <color attach="background" args={["#85b9db"]}/>
  <fog attach="fog" args={["#c7cbd4",21,60]}/>
  <CharacterCamera/>
  <hemisphereLight args={["#d9efff","#8b6d8c",1.75]}/>
  <ambientLight intensity={.45}/>
  <directionalLight position={[-9,15,8]} intensity={2.2} color="#ffe4b9" castShadow
   shadow-mapSize={[1024,1024]} shadow-camera-left={-18} shadow-camera-right={18}
   shadow-camera-top={18} shadow-camera-bottom={-18}/>
  <mesh position={[0,-.2,0]} rotation={[-Math.PI/2,0,0]} receiveShadow>
   <planeGeometry args={[130,130]}/>{paint("#86a978")}
  </mesh>
  <InkBox size={[22,.13,7.2]} at={[0,-.08,3.1]} color="#bfa58a"/>
  {/* Paved path in front of 3D buildings */}
  {Array.from({length:9},(_,i)=><InkBox key={i} size={[2.22,.10,1.15]} at={[-8.8+i*2.18,.035,4.5]} color={i%2?"#b7a598":"#d2bfa7"}/>)}
  <House x={-5.0} z={-5.1} houseColor="#deb18d" seed={0}/>
  <House x={-.6} z={-6.2} houseColor="#d8ba9d" seed={2}/>
  <House x={4.35} z={-5.9} houseColor="#bd8898" seed={3}/>
  <Tree position={[-8.6,0,-3.9]} size={1.5}/>
  <Tree position={[8.8,0,-4.2]} size={1.55}/>
  {/* Water background visible through an opening on the right */}
  <mesh position={[0,-.13,-10.6]} rotation={[-Math.PI/2,0,0]}>
   <planeGeometry args={[130,25]}/><meshToonMaterial color="#71a8bc" side={THREE.DoubleSide}/>
  </mesh>
  <Boat f={f}/>
 </>;
};
