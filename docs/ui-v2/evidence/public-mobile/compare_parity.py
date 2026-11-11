# Pixel parity of origin/dev (baseline) vs candidate, plus baseline vs a second baseline capture
# (control) that measures rendering noise of the same build on the same server.
from pathlib import Path
from PIL import Image, ImageChops
import json
out = Path(__file__).resolve().parent / 'parity'

def changed(x, y):
    a = Image.open(out / x).convert('RGB'); b = Image.open(out / y).convert('RGB')
    if a.size != b.size: return f'SIZE {a.size} vs {b.size}'
    return sum(p != (0, 0, 0) for p in ImageChops.difference(a, b).get_flattened_data())

results = []
for pair in json.loads((out / 'pairs.json').read_text(encoding='utf-8')):
    key = f"{pair['ui']}-{pair['width']}-{pair['page']}"
    results.append({**pair, 'candidateVsBaseline': changed(f'baseline-{key}.png', f'candidate-{key}.png'), 'controlVsBaseline': changed(f'baseline-{key}.png', f'control-{key}.png'), 'candidateVsControl': changed(f'control-{key}.png', f'candidate-{key}.png')})
(out.parent / 'parity.json').write_text(json.dumps(results, indent=2) + chr(10), encoding='utf-8')
for r in results: print(r['ui'], r['width'], r['page'], r['candidateVsBaseline'], r['candidateVsControl'], r['controlVsBaseline'])
