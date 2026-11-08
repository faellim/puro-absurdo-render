import React, {useEffect,useLayoutEffect,useMemo} from "react";
import {AbsoluteFill,getInputProps,useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useThree} from "@react-three/fiber";
import {EffectComposer} from "@react-three/postprocessing";
import * as THREE from "three";
import {BloomEffect,BlendFunction,ToneMappingEffect,ToneMappingMode} from "postprocessing";
import {InkPass,noInkFallback} from "../../reference/bridge/ink";
import {LensBlur} from "../../reference/bridge/lensblur";
import {GradeEffect,GRADES,gradeFor} from "../../reference/bridge/grade";
import {at,cameraAt} from "./story";
import {EmuWorld} from "./World";

const FilmPost:React.FC=()=>{
 const f=useCurrentFrame();
 const {scene,camera}=useThree();
 const effects=useMemo(()=>{
  const ink=new InkPass(scene,camera as THREE.PerspectiveCamera,{
   widthNear:5.1,widthFar:3.3,strength:.95,color:"#030303",fadeNear:80,fadeFar:300
  });
  const lens=new LensBlur({maxCoC:24,nearScale:1.2});
  const bloom=new BloomEffect({blendFunction:BlendFunction.ADD,intensity:.5,luminanceThreshold:1.0,mipmapBlur:true,levels:6,radius:.6});
  const tone=new ToneMappingEffect({mode:ToneMappingMode.NEUTRAL});
  const grade=new GradeEffect(GRADES.day,.55);
  return {ink,lens,bloom,tone,grade};
 },[camera,scene]);
 useLayoutEffect(()=>{noInkFallback(scene);},[scene,f]); // Assign NOINK after shot meshes are committed.
 useEffect(()=>()=>{effects.ink.dispose();effects.lens.dispose();},[effects]);
 const plan=cameraAt(f);
 effects.lens.focus=plan.focus;
 effects.lens.cInf=plan.cInf;
 gradeFor(effects.grade,plan.light);
 effects.grade.amount=plan.light==="day"?.55:.48;
 return <EffectComposer multisampling={4}>
  <primitive object={effects.ink} dispose={null}/>
  <primitive object={effects.lens.pre} dispose={null}/>
  <primitive object={effects.lens.main} dispose={null}/>
  <primitive object={effects.bloom} dispose={null}/>
  <primitive object={effects.tone} dispose={null}/>
  <primitive object={effects.grade} dispose={null}/>
 </EffectComposer>;
};

/** Render draft frames at a true 540x960 WebGL buffer, not merely a downscaled
 * screenshot of a full 1080x1920 WebGL render. Keep 1.0 for final FullHD. */
const rendererDpr=()=>{
 const p=getInputProps() as {renderer?:{dpr?:number}};
 const n=p.renderer?.dpr??0.5;
 if(n!==0.5&&n!==1&&Math.abs(n-4/3)>.001)throw Error("renderer.dpr must be .5, 1 or 4/3");
 return n;
};
export const EmuWar:React.FC=()=>{
 const f=useCurrentFrame();
 const {clip,local}=at(f);
 // A very short editorial flash on the punch word, not a long white frame.
 const hookEnd=at(0).clip.b;
 const hookFlash=f>=hookEnd&&f<hookEnd+4?[1,.72,.4,.15][f-hookEnd]:0;
 const impact=clip.id==="jam"&&local>=Math.round((clip.b-clip.a)*.47)&&local<Math.round((clip.b-clip.a)*.47)+3;
 const flash=hookFlash||(impact ? .22 : 0);
 return <AbsoluteFill style={{background:"#9fc6db"}}>
  <ThreeCanvas width={1080} height={1920} dpr={rendererDpr()}
     camera={{fov:39,near:.1,far:180,position:[2,5,18]}}
     gl={{antialias:false,alpha:false,powerPreference:"high-performance"}}
     shadows>
   <EmuWorld/>
   <FilmPost/>
  </ThreeCanvas>
  {flash>0&&<AbsoluteFill style={{background:"#fff5e4",opacity:flash}}/>}
 </AbsoluteFill>;
};
