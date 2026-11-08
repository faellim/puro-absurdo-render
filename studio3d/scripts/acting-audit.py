#!/usr/bin/env python3
"""Evaluate speech-grounded acting markers from the SAME acting.json used by story.ts.
Measures exact hit vs fallback rather than treating approximate offsets as precise.
"""
import json, re, sys, unicodedata
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
slug=sys.argv[1] if len(sys.argv)>1 else "emu-1932"
data=ROOT/"episodes"/slug
timeline=json.loads((data/"timing.json").read_text("utf-8"))
cue_map=json.loads((data/"acting.json").read_text("utf-8"))
scenes={x["id"]:x for x in timeline["shots"]}
def norm(s):
 s=unicodedata.normalize("NFD",str(s).lower())
 return re.sub(r"[^a-z0-9]","", "".join(c for c in s if unicodedata.category(c)!="Mn"))
rows=[]
for id,cues in cue_map.items():
 if id not in scenes: raise ValueError("Unknown shot in acting manifest: "+id)
 shot=scenes[id]
 tokens=[w for w in timeline["words"] if w["shot"]==id]
 if not tokens:raise RuntimeError("Missing narration tokens for "+id)
 for cue in cues:
  terms=cue["terms"]
  if not terms or not (0<=cue["fallback"]<=1):raise ValueError("Invalid acting cue")
  match=next((w for term in terms for w in tokens if norm(term) in norm(w["text"])),None)
  origin=int(match["frame"]) if match else shot["start"]+round((shot["end"]-shot["start"])*cue["fallback"])
  planned=max(shot["start"],origin-3) if match else origin
  rows.append({"shot":id,"action":cue["action"],"terms":terms,
    "matched_word":match["text"] if match else None,"method":"word-boundary" if match else "fractional-fallback",
    "word_frame":int(match["frame"]) if match else None,"acting_frame":planned,
    "anticipated_frames":3 if match and match["frame"]-3>=shot["start"] else max(0,origin-shot["start"]) if match else None})
if not rows:raise ValueError("No acting cues")
exact=sum(x["method"]=="word-boundary" for x in rows)
report={"total":len(rows),"exact":exact,"fallback":len(rows)-exact,"coverage":round(exact/len(rows),3),
  "status":"PASS" if exact/len(rows)>=.65 else "REVIEW",
  "note":"Automatic timing provenance, not proof of artistic performance.","cues":rows}
out=ROOT/"out"/slug;out.mkdir(parents=True,exist_ok=True)
(out/"acting_audit.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
lines=["# Atuação sincronizada com narração","",f"Correspondências exatas: {exact}/{len(rows)} ({report['coverage']:.1%}).",
"","| Cena | Atuação | Palavra | Quadro | Método |","|---|---|---|---:|---|"]
for item in rows:
 lines.append(f"| {item['shot']} | {item['action']} | {item['matched_word'] or '—'} | {item['acting_frame']} | {item['method']} |")
(out/"acting_audit.md").write_text("\n".join(lines)+"\n",encoding="utf-8")
print(json.dumps({k:v for k,v in report.items() if k!="cues"},ensure_ascii=False))
if exact/len(rows)<.35:raise SystemExit("Insufficient word grounded acting cues")
