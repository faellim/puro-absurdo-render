#!/usr/bin/env node
import fs from "node:fs";
const [slug="emu-1932",out="out/studio3d/emu-shots.json"]=process.argv.slice(2);
if(!/^[a-z0-9-]+$/.test(slug))throw Error("Unsafe slug");
const base=JSON.parse(fs.readFileSync("studio3d/episodes/"+slug+"/timing.json","utf8"));
const metadata={shots:base.shots.map(s=>({id:s.id,a:s.start,b:s.end})),
 planned:[]};
const dirname=out.slice(0,out.lastIndexOf("/"));
fs.mkdirSync(dirname,{recursive:true});
fs.writeFileSync(out,JSON.stringify(metadata,null,2));
console.log("QA shot timings saved:",out);
