#!/usr/bin/env python3
"""Compare our measured look to source SKILL.md's published numeric targets.
A directional comparison: cannot replace artist/verifier approval.
"""
import json,sys
from pathlib import Path
source=Path(sys.argv[1]);out=Path(sys.argv[2])
data=json.loads(source.read_text("utf-8"))
metrics=data.get("metrics",[])
if len(metrics)<13:raise SystemExit("Need one still from each of 13 scenes")
targets={"frame_details":{"min_edge_energy":.008,"min_bottom_stddev":.025},
 "day_linear_luma_proxy":{"expected_range":[.08,.7]},
 "reference":{"day_median_display_luma":.57,"character_face_brightness":.93,
 "world_ink_near_px":5.1,"world_ink_far_px":3.3,
 "visual_duration_dof_fraction":.333,"color_grade":"neutral"},
 "domains":["motion","depth","textures","characters","lighting","outlines","grade"]}
warnings=[]
for row in metrics:
 if row["edge_energy"]<.012:warnings.append(f"{row['frame']}: low detail/edge energy")
 if row["bottom_stddev"]<.035:warnings.append(f"{row['frame']}: low foreground contrast")
 if not .04<=row["median_linear_y"]<=.8:warnings.append(f"{row['frame']}: unusual median brightness")
 if row["saturation_p90"]>.94:warnings.append(f"{row['frame']}: highly saturated area")
report={"source":"mromidev/claude-animated-shorts SKILL.md + references/reports/",
 "frames_compared":len(metrics),"targets":targets,"warnings":warnings,
 "status":"REVIEW" if warnings else "PASS_MEASUREMENT",
 "human_review_required":["acting and foot contact","prop occlusion","camera continuity",
 "readable facial expressions","silhouette shape","shadow palette","depth perspective"],
 "limit":"No copyrighted reference frames reproduced. Metrics cannot certify a style match."}
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
md=["# Auditoria visual dirigida pelos sete estudos originais","",
 f"Quadros medidos: {len(metrics)}. Advertências: {len(warnings)}.","",
 "## Revisão humana obrigatória",*["- "+x for x in report["human_review_required"]],
 "","## Alertas",*(["- "+x for x in warnings] if warnings else ["Sem alertas numéricos."]),
 "","**Aprovação numérica não significa equivalência artística.**"]
out.with_suffix(".md").write_text("\n".join(md)+"\n",encoding="utf-8")
print(json.dumps({"frames":len(metrics),"warnings":len(warnings),"status":report["status"]}))
