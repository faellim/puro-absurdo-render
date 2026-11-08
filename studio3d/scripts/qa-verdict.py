#!/usr/bin/env python3
"""Convert short_qa.py's human-readable checks into a compact pass/warn/stop verdict.
Not an artistic approval: movement, expressions and style still need human review.
"""
import json, re, sys
from pathlib import Path

report=Path(sys.argv[1])
output=Path(sys.argv[2]) if len(sys.argv)>2 else report.parent/"verdict.json"
s=report.read_text("utf-8")
m=re.search(r"FRAMES (\d+); black (\[[^\]]*\]); unplanned white (\[[^\]]*\]); frozen spans >=12f (\[[^\n]*\])",s)
if not m:raise SystemExit("Incomplete QA frame report")
import ast
frames=int(m.group(1))
black=ast.literal_eval(m.group(2))
white=ast.literal_eval(m.group(3))
frozen=ast.literal_eval(m.group(4))
audio=next((line for line in s.splitlines() if line.startswith("LOUDNESS ")),None)
pops=next((line for line in s.splitlines() if line.startswith("POPS ")),None)
issues=[]
if black:issues.append({"severity":"critical","kind":"black","frames":black[:20]})
if white:issues.append({"severity":"warning","kind":"white","frames":white[:20]})
if frozen:issues.append({"severity":"warning","kind":"frozen","spans":frozen[:20]})
if not audio or audio=="LOUDNESS ":issues.append({"severity":"critical","kind":"missing_loudness"})
status="FAIL" if any(i["severity"]=="critical" for i in issues) else ("REVIEW" if issues else "PASS_TECHNICAL")
output.write_text(json.dumps({"status":status,"frames":frames,"issues":issues,
 "note":"PASS_TECHNICAL does not constitute artistic acceptance.",
 "pops":pops},indent=2)+"\n")
print(output.read_text())
if status=="FAIL":sys.exit(2)
