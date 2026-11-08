#!/usr/bin/env python3
"""Numerical look inspection. This does not assert perfect artistic equivalence."""
import json,sys
from pathlib import Path
import numpy as np
from PIL import Image
root=Path(sys.argv[1])
out=Path(sys.argv[2]) if len(sys.argv)>2 else root/"look-metrics.json"
files=sorted(root.glob("frame-*.jpg"))
if len(files)<7:raise SystemExit("Expected at least seven scene stills")
rows=[];critical=[]
for fn in files:
 x=np.asarray(Image.open(fn).convert("RGB"),dtype=np.float32)/255
 lin=np.where(x<=.04045,x/12.92,((x+.055)/1.055)**2.4)
 y=.2126*lin[:,:,0]+.7152*lin[:,:,1]+.0722*lin[:,:,2]
 hi=x.max(axis=2);lo=x.min(axis=2);sat=(hi-lo)/(hi+1e-3)
 gray=.2126*x[:,:,0]+.7152*x[:,:,1]+.0722*x[:,:,2]
 grad=np.abs(np.diff(gray,axis=0)).mean()+np.abs(np.diff(gray,axis=1)).mean()
 row=dict(frame=fn.stem,width=x.shape[1],height=x.shape[0],
  median_linear_y=round(float(np.median(y)),3),
  p5_linear_y=round(float(np.percentile(y,5)),3),
  saturation_p90=round(float(np.percentile(sat,90)),3),
  edge_energy=round(float(grad),4),
  bottom_stddev=round(float(np.std(y[int(y.shape[0]*.43):])),3))
 rows.append(row)
 if row["bottom_stddev"]<.025:critical.append(fn.name+": foreground almost flat")
 if row["edge_energy"]<.008:critical.append(fn.name+": missing scene detail")
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps({"frames":len(rows),"metrics":rows,
 "reference_targets":{"day_median_luminance_approx":.57,
 "note":"Different color spaces; use comparison as directional, not automatic artistic approval."},
 "critical":critical,"status":"PASS_TECHNICAL" if not critical else "FAIL"},indent=2)+"\n")
md=["# Look QA — Puro Absurdo",
 "Review of measured frames against seven original reference domains.",
 "The technical pass is not an artistic equivalence claim.","",
 "| Frame | Median luma | P5 | Saturation P90 | Edges | Subject contrast |",
 "|---|---:|---:|---:|---:|---:|"]
for r in rows:md.append(f'| {r["frame"]} | {r["median_linear_y"]} | {r["p5_linear_y"]} | {r["saturation_p90"]} | {r["edge_energy"]} | {r["bottom_stddev"]} |')
md+=["","## Errors",*(["- "+x for x in critical] if critical else ["No empty frames detected."]),
 "","## Human review",
 "Inspect contact of feet, reaction timing, readable props, scene depth and camera continuity.",
 "Original seven studies retained under studio3d/reference/reports/."]
out.with_suffix(".md").write_text("\n".join(md)+"\n")
print(json.dumps({"frames":len(rows),"critical":critical}))
if critical:raise SystemExit(2)
