from pathlib import Path
from PIL import Image, ImageChops
import json
here = Path(__file__).resolve().parent
def changed(a, b):
    x = Image.open(a).convert('RGB'); y = Image.open(b).convert('RGB')
    if x.size != y.size: return f'SIZE {x.size} vs {y.size}'
    return sum(p != (0, 0, 0) for p in ImageChops.difference(x, y).get_flattened_data())
rows = [{'width': p['width'], 'who': p['who'], 'route': p['route'], 'candidateVsBaseline': changed(p['baseline'], p['candidate']), 'candidateVsControl': changed(p['control'], p['candidate']), 'controlVsBaseline': changed(p['baseline'], p['control'])} for p in json.loads((here / 'parity' / 'pairs.json').read_text(encoding='utf-8'))]
(here / 'parity.json').write_text(json.dumps(rows, indent=2) + '\n', encoding='utf-8')
bad = [r for r in rows if r['candidateVsBaseline'] != 0 and r['candidateVsControl'] != 0]
print('pairs', len(rows), 'exact (vs baseline or control):', len(rows) - len(bad))
for r in bad: print(r)
