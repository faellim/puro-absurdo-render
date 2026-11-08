import React, { useMemo } from "react";
import * as THREE from "three";
import { useCurrentFrame } from "remotion";
import { Pen, bodyFront, type Expr, type Outfit } from "../../reference/bridge/toon";

const merchant: Outfit = {
  jacket: "#365663", pants: "#253948", boots: "#25202b", hat: "tophat", 
  skin: "#ffe0c1", buttons: "#dfbc78", belt: "#c7b28d", moustache: "#53372a", build: "adult"
};

/** Draws authentic 2D bean-head actors from the imported MIT toon engine onto a 3D billboard.
 * Frame-indexed texture and deterministic posing: same frame => same picture in GitHub Actions. */
export const ToonActor: React.FC<{ position?: [number, number, number] }> = ({ position=[0,0,1.5] }) => {
  const frame=useCurrentFrame();
  const expression: Expr = frame<45?"neutral":frame<90?"shock":frame<132?"nervous":"grin";
  const canvasTex = useMemo(() => {
    const canvas=document.createElement("canvas");canvas.width=600;canvas.height=1000;
    const context=canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D unavailable");
    context.clearRect(0,0,600,1000);
    const pen=new Pen(context);
    const phase=frame*.14;
    bodyFront(pen,merchant,{
      mode:frame>95&&frame<130?"stroll":"stand",
      phase,expr:expression,
      seed:17,
      look:frame<50?.2:frame<120?-.8:.4,
      blink: frame%73<4,
      headTilt:frame>44&&frame<85?-.10:.03,
      tilt: frame>90&&frame<125?-.06:0,
      wave:frame>128?0.35:undefined,
      light:-.55,
    });
    const texture=new THREE.CanvasTexture(canvas);
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=4;
    return texture;
  },[frame,expression]);
  const x=position[0]+(frame>100?Math.min(1,(frame-100)/70)*.65:0);
  const bob=Math.sin(frame*.10)*.035;
  return <>
    <mesh position={[x,.026,position[2]]} rotation={[-Math.PI/2,0,0]} receiveShadow>
      <circleGeometry args={[.47,32]} />
      <meshBasicMaterial color="#493442" transparent opacity={.27} depthWrite={false} />
    </mesh>
    <mesh position={[x,2.2+bob,position[2]]} rotation={[0,0,Math.sin(frame*.035)*.014]} castShadow>
      <planeGeometry args={[2.72,4.53]} />
      <meshBasicMaterial map={canvasTex} transparent alphaTest={.035} depthWrite={false} side={THREE.DoubleSide} toneMapped={false}/>
    </mesh>
  </>;
};
