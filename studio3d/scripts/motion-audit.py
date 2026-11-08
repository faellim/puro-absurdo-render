#!/usr/bin/env python3
"""Stream all video frames at reduced scale to identify accidental motion pops,
held frames and shot boundary jumps. Avoid false alarms at intentional cuts.
"""
import json,sys,subprocess,collections
from pathlib import Path
import numpy as np
video,timing,out=Path(sys.argv[1]),Path(sys.argv[2]),Path(sys.argv[3])
t=json.loads(timing.read_text("utf-8"))
w,h=144,256
p=subprocess.Popen(["ffmpeg","-hide_banner","-loglevel","error","-i",str(video),
 "-map","0:v:0","-f","rawvideo","-pix_fmt","gray","-vf",f"scale={w}:{h}","-"],
 stdout=subprocess.PIPE,stderr=subprocess.PIPE)
expected=t["frames"];cuts={x["start"] for x in t["shots"][1:]}
deltas=[];dark=[];white=[];prev=None;n=0
try:
 while True:
  raw=p.stdout.read(w*h)
  if not raw:break
  if len(raw)!=w*h:raise RuntimeError("Truncated decoded frame")
  a=np.frombuffer(raw,dtype=np.uint8).astype(np.int16)
  level=float(a.mean())
  if level<6:dark.append(n)
  if level>249:white.append(n)
  if prev is not None:
   delta=float(np.abs(a-prev).mean())
   deltas.append((n,round(delta,3),n in cuts))
  prev=a;n+=1
finally:
 p.stdout.close()
code=p.wait()
if code:raise RuntimeError("FFmpeg failed decoding video")
if n!=expected:raise RuntimeError(f"Frame mismatch decoded {n} expected {expected}")
ordinary=[d for _,d,cut in deltas if not cut]
median=float(np.median(ordinary)) if ordinary else 0
limit=max(30.0,median*9)
pops=[{"frame":f,"difference":d} for f,d,cut in deltas if not cut and d>limit]
holds=[];start=None
for frame,d,cut in deltas:
 if not cut and d<.035:
  if start is None:start=frame
 elif start is not None:
  if frame-start>=12:holds.append([start,frame-1])
  start=None
if start is not None and n-start>=12:holds.append([start,n-1])
out.parent.mkdir(parents=True,exist_ok=True)
report={"expected_frames":expected,"decoded_frames":n,"fps":30,
 "motion_median":round(median,3),"unexpected_cut_threshold":round(limit,3),
 "possible_pops":pops[:60],"frozen_spans":holds[:60],
 "dark_frames":dark[:60],"white_frames":white[:60],
 "intentional_cut_count":len(cuts),
 "status":"FAIL" if dark or white else ("REVIEW" if pops or holds else "PASS_TECHNICAL"),
 "note":"Artistic cuts, flashes and poses should be reviewed by humans."}
out.write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
print(json.dumps({k:v for k,v in report.items() if k not in ("possible_pops","frozen_spans","dark_frames","white_frames")}))
if dark or white:raise SystemExit("Black or white frames must be reviewed")
