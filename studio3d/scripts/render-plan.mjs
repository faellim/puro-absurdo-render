#!/usr/bin/env node
/**
 * Splits a narration-locked film into contiguous, non-overlapping frame slices.
 * The Remotion CLI's --frames=start-end is INCLUSIVE; endExclusive is not.
 * Exports GITHUB_OUTPUT values when invoked by GitHub Actions.
 */
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const [slug="emu-1932",indexArg="0",countArg="8"]=process.argv.slice(2);
const index=Number(indexArg),count=Number(countArg);
if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||
 !Number.isSafeInteger(index)||!Number.isSafeInteger(count)||
 count<1||count>24||index<0||index>=count)throw Error("Unsafe episode or partition");
const {fps,frames,shots}=JSON.parse(fs.readFileSync(path.join(repo,"studio3d","episodes",slug,"timing.json"),"utf8"));
if(fps!==30||!Number.isSafeInteger(frames)||frames<30||shots.at(-1).end!==frames)
 throw Error("Invalid locked timeline");
const start=Math.floor(index*frames/count);
const exclusive=Math.floor((index+1)*frames/count);
if(start>=exclusive)throw Error("Empty chunk");
const result={slug,index,chunks:count,begin:start,end:exclusive-1,exclusive,
  expected:exclusive-start,frames};
const json=JSON.stringify(result);
if(process.env.GITHUB_OUTPUT){
 const vals={begin:result.begin,end:result.end,expected:result.expected,
   part:String(index).padStart(2,"0"),frames};
 fs.appendFileSync(process.env.GITHUB_OUTPUT,Object.entries(vals).map(([k,v])=>k+"="+v).join("\n")+"\n");
}
console.log(json);
