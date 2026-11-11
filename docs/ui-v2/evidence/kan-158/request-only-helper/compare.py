"""Pixel comparison of candidate vs baseline (origin/dev) screenshots from browser.cjs.

Expected: zero changed pixels for direct-booking scenarios (beyond the baseline-vs-control noise
measured on the same pages); for request_only only the request card changes.
"""
import json
from pathlib import Path

from PIL import Image, ImageChops

here = Path(__file__).resolve().parent
shots = here / "screenshots"
def measure(a, b):
    diff = ImageChops.difference(a, b)
    box = diff.getbbox()
    changed = sum(1 for p in diff.get_flattened_data() if p != (0, 0, 0)) if box else 0
    return {"changedPixels": changed, "bbox": box}


rows = []
for baseline in sorted(shots.glob("baseline-*.png")):
    candidate = shots / baseline.name.replace("baseline-", "candidate-", 1)
    a = Image.open(baseline).convert("RGB")
    b = Image.open(candidate).convert("RGB")
    _, scenario, version, width = baseline.stem.split("-")
    if a.size != b.size:
        rows.append({"scenario": scenario, "version": version, "width": int(width), "size": [a.size, b.size]})
        continue
    row = {"scenario": scenario, "version": version, "width": int(width), **measure(a, b)}
    control = shots / baseline.name.replace("baseline-", "control-", 1)
    if control.exists():
        row["controlVsBaseline"] = measure(a, Image.open(control).convert("RGB"))
    rows.append(row)
(here / "parity.json").write_text(json.dumps(rows, indent=2) + "\n", encoding="utf-8")
for row in rows:
    print(row)
