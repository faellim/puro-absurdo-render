#!/usr/bin/env node
/**
 * Validates all emitted chunks before final concatenation.
 * Requires ffprobe, ensures exactly N sequential pieces and the expected count.
 */
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {execFileSync} from "node:child_process";
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const [slug="emu-1932",source="out/studio3d/chunks",countArg="8"]=process.argv.slice(2);
if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw Error("Invalid slug");
const count=Number(countArg);
if(!Number.isSafeInteger(count)||count<1||count>24)throw Error("Invalid chunk count");
const {frames}=JSON.parse(fs.readFileSync(path.join(repo,"studio3d","episodes",slug,"timing.json"),"utf8"));
const directory=path.resolve(repo,source);
if(!directory.startsWith(repo+path.sep))throw Error("Unsafe path");
let total=0;const list=[];
for(let i=0;i<count;i++){
 const name="part-"+String(i).padStart(2,"0")+".mp4";
 const file=path.join(directory,name);
 if(!fs.existsSync(file)||!fs.statSync(file).size)throw Error("Missing "+file);
 const metadata=JSON.parse(execFileSync("ffprobe",["-v","error","-select_streams","v:0",
  "-show_entries","stream=nb_frames,width,height,r_frame_rate","-of","json",file],{encoding:"utf8"}));
 const item=metadata.streams?.[0],actual=Number(item?.nb_frames);
 const expected=Math.floor((i+1)*frames/count)-Math.floor(i*frames/count);
 if(item?.r_frame_rate!=="30/1"||actual!==expected)throw Error("Frame count mismatch "+name+" expected="+expected+" got="+actual);
 if(i===0)console.log("Chunk resolution",item.width,item.height);
 total+=actual;
 // Explicit absolute path is safe because the trusted directory comes from the checked-out repo.
 const escaped=file.replace(/'/g,"'\\''");
 list.push("file '"+escaped+"'");
}
if(total!==frames)throw Error("Total frame mismatch");
const target=path.join(directory,"concat.txt");
fs.writeFileSync(target,list.join("\n")+"\n");
console.log(JSON.stringify({files:count,frames,duration:frames/30,list:target}));
