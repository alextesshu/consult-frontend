"""Compare Chromium UI v1 captures against the approved #73 source baseline."""
import json
from pathlib import Path

from PIL import Image, ImageChops

root = Path(__file__).parent
source = json.loads((root / 'parity-pairs.json').read_text(encoding='utf-8'))
results = []
for pair in source['pairs']:
    before = Image.open(root / pair['before']).convert('RGB')
    after = Image.open(root / pair['after']).convert('RGB')
    changed = None
    if before.size == after.size:
        delta = ImageChops.difference(before, after)
        any_channel = ImageChops.lighter(ImageChops.lighter(delta.getchannel('R'), delta.getchannel('G')), delta.getchannel('B'))
        changed = sum(any_channel.histogram()[1:])
    results.append({**pair, 'before_size': before.size, 'after_size': after.size, 'changed_pixels': changed, 'pass': changed == 0})
(root / 'parity.json').write_text(json.dumps({'baseline': source['baseline'], 'results': results}, indent=2), encoding='utf-8')
print(json.dumps({'pairs': len(results), 'passed': sum(item['pass'] for item in results), 'changed_pixels': [item['changed_pixels'] for item in results]}))
raise SystemExit(0 if results and all(item['pass'] for item in results) else 1)
