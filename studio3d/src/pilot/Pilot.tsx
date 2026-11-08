import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { VillageWorld } from "./World";
import { ToonActor } from "./Cast";

export const Pilot: React.FC = () => {
 const {width,height}=useVideoConfig();
 return <AbsoluteFill style={{background:"#85b9db"}}>
  <ThreeCanvas width={width} height={height} camera={{fov:35,near:.1,far:120,position:[1.5,5.3,18.8]}}
    gl={{antialias:true,alpha:false}} shadows>
    <VillageWorld/>
    <ToonActor position={[0,0,2]}/>
  </ThreeCanvas>
 </AbsoluteFill>;
};
