# V1 parity for /cabinet: candidate vs origin/dev baseline, with a second baseline capture as noise control.
from pathlib import Path
from PIL import Image, ImageChops
import json
here = Path(__file__).resolve().parent

def changed(a, b):
    x = Image.open(a).convert('RGB'); y = Image.open(b).convert('RGB')
    if x.size != y.size: return f'SIZE {x.size} vs {y.size}'
    return sum(p != (0, 0, 0) for p in ImageChops.difference(x, y).get_flattened_data())

rows = []
for pair in json.loads((here / 'parity' / 'pairs.json').read_text(encoding='utf-8')):
    rows.append({'width': pair['width'], 'candidateVsBaseline': changed(pair['baseline'], pair['candidate']), 'candidateVsControl': changed(pair['control'], pair['candidate']), 'controlVsBaseline': changed(pair['baseline'], pair['control'])})
(here / 'parity.json').write_text(json.dumps(rows, indent=2) + '\n', encoding='utf-8')
for r in rows: print(r)
