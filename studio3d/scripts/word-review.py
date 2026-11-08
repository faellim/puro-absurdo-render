#!/usr/bin/env python3
"""Validate real-word timestamp alignment against the recorded script."""
import json,re,sys,unicodedata,difflib
from pathlib import Path
root=Path(__file__).resolve().parents[1]
slug=sys.argv[1] if len(sys.argv)>1 else "emu-1932"
base=root/"episodes"/slug
manifest=json.loads((base/"episode.json").read_text("utf-8"))
timing=json.loads((base/"timing.json").read_text("utf-8"))
def norm(s):
 s=unicodedata.normalize("NFD",s.lower())
 s="".join(c for c in s if unicodedata.category(c)!="Mn")
 return re.findall(r"[a-z0-9]+",s)
byshot={}
for w in timing["words"]:byshot.setdefault(w["shot"],[]).append(w)
rows=[]
for shot,span in zip(manifest["shots"],timing["shots"]):
 source=norm(shot["text"]);found=byshot.get(shot["id"],[])
 heard=norm(" ".join(w["text"] for w in found))
 score=difflib.SequenceMatcher(None,source,heard,autojunk=False).ratio()
 if not found:raise RuntimeError("Missing ASR for "+shot["id"])
 if not all(span["start"]<=w["frame"]<span["end"] and w["e"]>=w["s"] for w in found):
  raise RuntimeError("Word escapes shot: "+shot["id"])
 previous=span["start"]-.01
 for w in found:
  if w["frame"]<previous-2:raise RuntimeError("Nonmonotonic word times")
  previous=w["frame"]
 rows.append({"id":shot["id"],"script_words":len(source),"asr_words":len(heard),"similarity":round(score,3)})
avg=sum(r["similarity"] for r in rows)/len(rows)
out=root/"out"/slug/"alignment_review.json"
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps({"scenes":rows,"average_similarity":round(avg,3),
"status":"PASS" if avg>=.68 else "REVIEW",
"method":"Real Edge WordBoundary or Whisper audio timestamps",
"note":"Lexical confidence is automated; fine acting still requires editorial review."},indent=2)+"\n")
print(out.read_text())
if avg<.53:raise RuntimeError("ASR transcription mismatches screenplay")
