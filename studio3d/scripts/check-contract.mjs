#!/usr/bin/env node
/** Regression gate for the source-inspired cinematic pipeline.
 * Assert real implementation wiring, not merely file existence.
 */
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const slug=process.argv[2]??"emu-1932";
const file=(p)=>fs.readFileSync(path.join(ROOT,p),"utf8");
const spec=JSON.parse(file("episodes/"+slug+"/episode.json"));
const acting=JSON.parse(file("episodes/"+slug+"/acting.json"));
const world=file("src/emu/World.tsx");
const cast=file("src/emu/Cast.tsx");
const film=file("src/emu/EmuFilm.tsx");
const story=file("src/emu/story.ts");
const materials=file("src/emu/Materials.tsx");
const lights=file("src/emu/Lighting.tsx");
const audio=file("audio/build.py");
const checks=[];
const requireCheck=(name,pass)=>{checks.push({name,pass:!!pass});if(!pass)throw new Error("CINEMA_CONTRACT: "+name);};
const ids=spec.shots.map(s=>s.id);
requireCheck("13 unique scenes",ids.length===13&&new Set(ids).size===13);
requireCheck("Portuguese narration",spec.language==="pt-BR");
requireCheck("every scene has 3D set",world.includes("<SceneProps/>"));
requireCheck("physically lit 2D character cards",cast.includes("cardShade(")&&cast.includes("NOINK"));
requireCheck("2-tone world and textured surfaces",materials.includes("twoTone(")&&materials.includes("ctex("));
requireCheck("camera-aware day/sunset lighting",lights.includes("LOOK[")&&lights.includes("LIGHTS["));
requireCheck("gradient sky plus depth fog",world.includes("<Sky/>")&&world.includes('attach="fog"'));
requireCheck("cinematic post chain",["InkPass","LensBlur","BloomEffect","ToneMappingEffect","GradeEffect"].every(k=>film.includes(k)));
requireCheck("4x multisampling and safe no-ink",film.includes("multisampling={4}")&&film.includes("noInkFallback(scene)"));
requireCheck("camera continuously directed",world.includes("cameraAt(f)")&&world.includes("camera.updateProjectionMatrix()"));
requireCheck("fov wired into camera",world.includes(".fov=x.fov")&&story.includes("const fov="));
requireCheck("word boundary acting system",story.includes("import actingManifest")&&story.includes("cueFrame("));
requireCheck("speech-ducked original sound",audio.includes("voice_rms")&&audio.includes("nctl")&&audio.includes("stereo_wav"));
requireCheck("all acting scenes exist",Object.keys(acting).every(id=>ids.includes(id)));
requireCheck("acting events have valid timing",Object.values(acting).every(cues=>Array.isArray(cues)&&cues.length>0&&cues.every(c=>c.terms?.length&&Number.isFinite(c.fallback)&&c.fallback>=0&&c.fallback<=1&&typeof c.action==="string")));
requireCheck("source is used for style, not frame reuse",!world.includes("references/frames")&&!world.includes("references/sheets"));
console.log(JSON.stringify({result:"PASS",checked:checks.length,checks},null,2));
