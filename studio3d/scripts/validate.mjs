#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const slug=process.argv[2]||"emu-1932";
if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw Error("Invalid slug");
const get=(p)=>JSON.parse(fs.readFileSync(path.join(root,"episodes",slug,p),"utf8"));
const episode=get("episode.json"),t=get("timing.json");
if(episode.id!==slug||episode.fps!==30||t.fps!==30)throw Error("Invalid frame rate or slug");
if(episode.shots.length<8||episode.shots.length>30)throw Error("Missing narrative beats");
if(t.shots.length!==episode.shots.length)throw Error("Narrative and voice mismatched");
let next=0;
for(let i=0;i<episode.shots.length;i++){
 const s=episode.shots[i],a=t.shots[i];
 if(!s.text||s.text.length<20||!s.id||!s.scene)throw Error("Missing script "+i);
 if(s.id!==a.id||a.start!==next||a.end<=next)throw Error("Incorrect shot "+i);
 next=a.end;
}
if(next!==t.frames)throw Error("Final frame mismatch");
if(t.words.length){
 let last=-1;
 for(const w of t.words){
  if(!w.text||!Number.isFinite(w.s)||!Number.isFinite(w.e)||w.s<0||
    w.e<=w.s||w.s<last-.1||w.e>t.frames/30+.01)
    throw Error("Invalid word timing "+JSON.stringify(w));
  last=w.s;
 }
}
const voice=path.join(root,"out",slug,"voice.wav");
if(process.argv.includes("--generated")){
 if(!t.words.length||!fs.existsSync(voice))throw Error("Generated speech or words missing");
 if(t.words.length<episode.shots.length*4)throw Error("Too few word boundaries");
 const q=get("timing.json");
 if(q.words[0].frame>=q.frames)throw Error("First word out of range");
}
console.log(JSON.stringify({episode:slug,shots:episode.shots.length,frames:t.frames,
 duration_seconds:+(t.frames/30).toFixed(2),words:t.words.length,voice:fs.existsSync(voice)},null,2));
