import React,{useMemo} from "react";
import * as THREE from "three";
import {useCurrentFrame} from "remotion";
import {LIGHTS,LOOK} from "../../reference/bridge/lights";
import {TONE,CHAR,untone} from "../../reference/bridge/shade";
import {at,cameraAt} from "./story";
const modeAt=(frame:number):"day"|"golden"=>at(frame).clip.info.light==="golden"?"golden":"day";
function sun(frame:number):[number,number,number]{
 const p=LIGHTS[modeAt(frame)],c=cameraAt(frame);
 const fw=new THREE.Vector3(c.look[0]-c.eye[0],0,c.look[2]-c.eye[2]).normalize();
 const right=new THREE.Vector3(-fw.z,0,fw.x),az=p.az*Math.PI/180,el=p.el*Math.PI/180;
 return [c.look[0]+(fw.x*Math.cos(az)+right.x*Math.sin(az))*85*Math.cos(el),
  c.look[1]+85*Math.sin(el),
  c.look[2]+(fw.z*Math.cos(az)+right.z*Math.sin(az))*85*Math.cos(el)];
}
export function updateLight(frame:number){
 const p=LIGHTS[modeAt(frame)],l=LOOK[modeAt(frame)];
 TONE.uLitCol.value.set(...p.lit);TONE.uShadeCol.value.set(...p.shade);
 TONE.uShadeLift.value.set(...p.lift);TONE.uLambert.value=p.lambert;TONE.uSideK.value=p.sideK;
 TONE.uTerm.value=p.term;TONE.uBounce.value.set(...l.bounce);TONE.uSat.value=l.sat;
 CHAR.uCharTint.value.set(...p.charTint);CHAR.uCharShade.value=p.charShade;
 CHAR.uGrad.value=p.charGrad;CHAR.uBodyGrad.value=p.bodyGrad;CHAR.uSideTint.value.set(...p.sideTint);
 return p;
}
export const Lighting:React.FC=()=>{
 const f=useCurrentFrame(),p=updateLight(f);
 return <><hemisphereLight args={[p.sky,p.ground,p.hemiI]}/>
  <ambientLight intensity={.15}/>
  <directionalLight position={sun(f)} color={p.sunCol} intensity={p.sunI} castShadow
   shadow-mapSize={[2048,2048]} shadow-camera-left={-37} shadow-camera-right={37}
   shadow-camera-top={37} shadow-camera-bottom={-37}
   shadow-camera-near={10} shadow-camera-far={240}
   shadow-bias={p.bias} shadow-normalBias={p.normalBias}/>
 </>;
};
const vert="varying vec3 vP; void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}";
const frag="varying vec3 vP;uniform vec3 colors[5];void main(){float t=degrees(asin(clamp(normalize(vP).y,-1.,1.)));vec3 c=mix(colors[0],colors[1],smoothstep(0.,3.,t));c=mix(c,colors[2],smoothstep(3.,8.,t));c=mix(c,colors[3],smoothstep(8.,16.,t));c=mix(c,colors[4],smoothstep(16.,40.,t));gl_FragColor=vec4(c,1.);}";
export const Sky:React.FC=()=>{
 const f=useCurrentFrame(),{clip}=at(f),p=cameraAt(f);
 const colors=LOOK[modeAt(f)].sky.c.map((x:string)=>untone(x));
 const material=useMemo(()=>new THREE.ShaderMaterial({uniforms:{colors:{value:colors}},
  vertexShader:vert,fragmentShader:frag,side:THREE.BackSide,depthWrite:false,depthTest:false,fog:false}),[]);
 material.uniforms.colors.value=colors;
 return <mesh position={p.eye} scale={[120,120,120]} renderOrder={-100} ref={(obj)=>{if(obj)obj.layers.set(3);}}>
  <sphereGeometry args={[1,32,16]}/><primitive object={material} attach="material" dispose={null}/>
 </mesh>;
};
