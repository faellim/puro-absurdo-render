import manifest from "../../episodes/emu-1932/episode.json";
import timing from "../../episodes/emu-1932/timing.json";
import actingManifest from "../../episodes/emu-1932/acting.json";

export type Beat = typeof manifest.shots[number];
export type Key = {id:string; a:number; b:number; index:number; info:Beat};
export const FPS = 30;
if(timing.fps!==FPS || timing.shots.length!==manifest.shots.length)
  throw new Error("Voice timing and story manifests disagree");

export const CUTS:Key[]=timing.shots.map((shot,index)=>{
 if(shot.id!==manifest.shots[index].id)
  throw new Error("Story id mismatch: "+shot.id);
 return {id:shot.id,a:shot.start,b:shot.end,index,info:manifest.shots[index]};
});
if(CUTS.some((x,i)=>x.b<=x.a || (i>0&&x.a!==CUTS[i-1].b)) ||
   CUTS[CUTS.length-1].b!==timing.frames)
  throw new Error("Narrated scene timeline is discontinuous");

export const DURATION = timing.frames;
export type SpokenWord = {text:string;shot:string;alignment?:string;s:number;e:number;frame:number};
// Empty JSON word arrays infer never[] in TypeScript. Narration populates this at render time.
export const words: SpokenWord[] = timing.words;

export const clamp=(x:number)=>Math.max(0,Math.min(1,x));
export const smooth=(v:number)=>{const x=clamp(v);return x*x*(3-2*x)};
export const glide=(v:number)=>{const x=clamp(v);return x*x*x*(x*(6*x-15)+10)};
export const easeOut=(v:number)=>1-Math.pow(1-clamp(v),3);
export const at=(frame:number)=>{
 const clip=CUTS.find(s=>frame>=s.a&&frame<s.b)??CUTS[CUTS.length-1];
 const local=frame-clip.a,span=clip.b-clip.a;
 return {clip,local,span,u:clamp(local/Math.max(1,span-1)),seconds:local/FPS};
};

type V3 = [number,number,number];
type Plan = {eye:V3;look:V3;move:V3;lookMove?:V3;zoom:number;light:"day"|"golden";focus:number;cInf:number};
const PLANS:Record<string,Plan>={
 hook:{eye:[1,4.5,18.5],look:[.3,2.2,1],move:[-.6,.05,-1.2],zoom:1,light:"day",focus:17,cInf:6},
 setting:{eye:[8,9,22],look:[1,1,-5],move:[-2,-.8,-2.2],zoom:1,light:"day",focus:28,cInf:0},
 farmers:{eye:[-3.0,4.2,13.6],look:[-1,2,0],move:[1,.3,-1.1],zoom:1,light:"day",focus:13,cInf:6},
 plan:{eye:[2.0,4.2,14.0],look:[-1.2,2.0,0],move:[-.35,.12,-1.0],zoom:1,light:"day",focus:13,cInf:8},
 scatter:{eye:[1.2,5,20.5],look:[0,1.9,-1],move:[-.7,-.1,-2],zoom:1,light:"day",focus:21,cInf:5},
 ambush:{eye:[10.0,5,13.2],look:[4.0,1.0,-4.5],move:[-1.3,.15,-1.4],zoom:1,light:"day",focus:18,cInf:8},
 jam:{eye:[-1.2,3.9,8.8],look:[-1.3,2.0,-.2],move:[.1,.05,-1],zoom:1,light:"day",focus:9,cInf:14},
 truck:{eye:[0,3.8,18.7],look:[-3.8,1.6,2.3],move:[7.5,.1,-1],lookMove:[7.6,0,0],zoom:1,light:"day",focus:17,cInf:5},
 bumps:{eye:[1,4,19],look:[-3.6,1.8,2.3],move:[6.5,.08,-1.2],lookMove:[7.8,0,0],zoom:1,light:"day",focus:17,cInf:6},
 zigzag:{eye:[-6.5,3.7,12],look:[.5,1.0,0],move:[4.4,.1,-1.9],zoom:1,light:"day",focus:13,cInf:6},
 press:{eye:[.4,4,12.6],look:[-.1,3.1,2.8],move:[.15,0,-.35],zoom:1,light:"golden",focus:10,cInf:5},
 result:{eye:[8.6,7.8,22],look:[1,1,-2.5],move:[-2,-.7,-1.8],zoom:1,light:"golden",focus:24,cInf:0},
 ending:{eye:[1,3.7,15.8],look:[.25,2.4,2.8],move:[-.1,0,-1.3],zoom:1,light:"golden",focus:13,cInf:7}
};

export const cameraAt=(frame:number)=>{
 const {clip,u,local,span}=at(frame);
 const p=PLANS[clip.id]; if(!p)throw Error("Missing camera plan "+clip.id);
 // Four editorial motion phases: gentle entry push, 18-36f glide,
 // moving hold and a final 18-36f exit. No static camera >4f.
 const ramp=Math.min(36,Math.max(18,Math.floor(span*.23)));
 const progress=clamp(u*.18 + .53*glide((local-4)/ramp)
   + .29*glide((local-span*.70)/ramp));
 const ease=progress;
 const x=p.eye.map((v,i)=>v+p.move[i]*ease) as V3;
 // Intentionally short, damped impact on the broken mechanism and truck jolts.
 let kick=0;
 if(clip.id==="jam" && local>Math.round(span*.48)){
  const d=local-Math.round(span*.48);
  if(d<7)kick=(1-d/7)*(d%2?-.10:.10);
 }
 if(clip.id==="bumps")kick=Math.sin(local*.6)*.06;
 x[0]+=kick;x[1]+=kick*.3;
 const look=p.look.map((v,i)=>v+(p.lookMove?.[i]??0)*ease) as V3;
 const tilt=["jam","bumps","zigzag","ending"].includes(clip.id)?
  Math.sin(Math.PI*u)*(clip.id==="bumps"?.062:.045):0;
 const fov=39+Math.sin(Math.PI*u)*.7 - (["hook","jam","ending"].includes(clip.id)?1.1*glide(u):0);
 return {eye:x,look,tilt,fov,light:p.light,cInf:p.cInf,focus:p.focus,cut:clip};
};
export const marker=(frame:number,word:string,windowFrames=7)=>{
 const norm=(v:string)=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"");
 const key=norm(word);
 return words.some(w=>norm(w.text||"").includes(key) &&
  frame>=w.frame-windowFrames&&frame<=w.frame+windowFrames);
};
export const qaShots=()=>CUTS.map(s=>({id:s.id,a:s.a,b:s.b}));

/** Shot-specific acting beats: prefer real ASR/Edge word frames, and fall back
 * to a relative fraction of the *measured* shot length if a word was missed.
 * Reactions begin up to 3 frames before a spoken keyword.
 */
export const cueFrame=(id:string,terms:string[],fallback=.5)=>{
 const shot=CUTS.find(x=>x.id===id);
 if(!shot)throw new Error("Unknown acting shot "+id);
 const normalize=(x:string)=>x.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"");
 for(const term of terms){
  const found=words.find(w=>w.shot===id&&normalize(w.text||"").includes(normalize(term)));
  if(found)return Math.max(shot.a,found.frame-3);
 }
 return shot.a+Math.round((shot.b-shot.a)*fallback);
};
export const ACTING:Record<string,{terms:string[];fallback:number;action:string}[]>=actingManifest;
export const actingAt=(frame:number)=>{
 const clip=at(frame).clip, cues=ACTING[clip.id]??[];
 let result="neutral";
 for(const item of cues)if(frame>=cueFrame(clip.id,item.terms,item.fallback))result=item.action;
 return result;
};
