"""Pixel comparison for parity/: candidate vs baseline, candidate vs control, control vs baseline."""
from pathlib import Path
from PIL import Image, ImageChops
import json

here = Path(__file__).resolve().parent


def diff(a, b):
    x = Image.open(here / a).convert('RGB')
    y = Image.open(here / b).convert('RGB')
    if x.size != y.size:
        return {'pixels': None, 'size': f'{x.size} vs {y.size}'}
    d = ImageChops.difference(x, y)
    box = d.getbbox()
    if not box:
        return {'pixels': 0}
    data = list(d.get_flattened_data())
    return {'pixels': sum(p != (0, 0, 0) for p in data), 'bbox': box, 'maxDelta': max(max(p) for p in data)}


rows = []
for p in json.loads((here / 'parity' / 'pairs.json').read_text(encoding='utf-8')):
    rows.append({k: p[k] for k in ('width', 'ui', 'route')} | {
        'candidateVsBaseline': diff(p['baseline'], p['candidate']),
        'candidateVsControl': diff(p['control'], p['candidate']),
        'controlVsBaseline': diff(p['baseline'], p['control']),
    })
exact = [r for r in rows if r['candidateVsBaseline']['pixels'] == 0 or r['candidateVsControl']['pixels'] == 0]
(here / 'parity.json').write_text(json.dumps({'pairs': len(rows), 'exact': len(exact), 'rows': rows}, indent=2) + '\n', encoding='utf-8')
print('pairs', len(rows), 'exact (vs baseline or control):', len(exact))
for r in rows:
    if r not in exact:
        print('  ', r)
