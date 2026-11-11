"""UI v1 pixel parity: candidate vs origin/dev baseline screenshots written by browser.cjs."""
import json
from pathlib import Path

from PIL import Image, ImageChops

here = Path(__file__).resolve().parent
rows = []
for baseline in sorted((here / "screenshots").glob("v1-baseline-*.png")):
    candidate = baseline.with_name(baseline.name.replace("v1-baseline-", "v1-candidate-", 1))
    a = Image.open(baseline).convert("RGB")
    b = Image.open(candidate).convert("RGB")
    name = baseline.stem.replace("v1-baseline-", "")
    if a.size != b.size:
        rows.append({"page": name, "size": [a.size, b.size]})
        continue
    diff = ImageChops.difference(a, b)
    box = diff.getbbox()
    changed = sum(1 for p in diff.get_flattened_data() if p != (0, 0, 0)) if box else 0
    rows.append({"page": name, "changedPixels": changed, "bbox": box})
(here / "parity.json").write_text(json.dumps(rows, indent=2) + "\n", encoding="utf-8")
for row in rows:
    print(row)
