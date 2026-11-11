"""Validate schedule layout evidence and inventory, without changing runtime."""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path
from PIL import Image, ImageChops

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
BASE = '72ddf20533f60a9dcdb883bccc640e97703bb25c'
REPORT = 'docs/ui-v2/SCHEDULE_MOBILE_OVERFLOW.md'
SOURCE = ['src/views/SlotsView.vue', 'src/views/SlotsView.layout.spec.ts']
refresh = '--refresh' in sys.argv
old = subprocess.check_output(['git', 'show', BASE + ':src/views/SlotsView.vue'], cwd=ROOT).decode('utf8')
new = (ROOT / SOURCE[0]).read_text(encoding='utf8')
assert old.replace('  .day-list {\n    display: flex;\n    gap: 2px;', '  .day-list {\n    gap: 2px;') == new
matrix = json.loads((HERE / 'matrix.json').read_text())
assert len(matrix) == 40
for row in matrix:
    if row['label'] == 'candidate':
        assert row['scrollWidth'] <= row['width']
        assert row['htmlOverflowX'] not in ['hidden', 'clip'] and row['bodyOverflowX'] not in ['hidden', 'clip']
        assert not row['pageErrors']
        assert row['controls']['weekNavigation'] and row['controls']['filters']
        if row['width'] <= 860:
            assert row['controls']['allSevenDaysAccessible']
        else:
            assert row['controls']['calendarInternalScroll']['top'] > 0
for row in json.loads((HERE / 'v1-parity.json').read_text()):
    a, b = Image.open(HERE / row['baseline']).convert('RGB'), Image.open(HERE / row['candidate']).convert('RGB')
    assert a.size == b.size and ImageChops.difference(a, b).getbbox() is None
    assert row['changedPixels'] == 0
diagnostics = lambda name: re.findall(r'^src/[^\n]+error TS[^\n]+', (HERE / name).read_text(encoding='utf8'), re.M)
assert diagnostics('typecheck-baseline.txt') == diagnostics('typecheck-candidate.txt')
assert len(diagnostics('typecheck-candidate.txt')) == 9
files = sorted([ROOT / name for name in SOURCE + [REPORT]] + [p for p in HERE.iterdir() if p.is_file() and p.name != 'manifest.json'])
inventory = []
for file in files:
    data = file.read_bytes()
    mode = 'binary' if file.suffix == '.png' else 'utf8-lf'
    if mode == 'utf8-lf':
        text = data.decode('utf-8-sig').replace('\r\n', '\n')
        assert '\ufffd' not in text
        if file.suffix == '.md':
            for link in re.findall(r'\]\(([^)]+)\)', text):
                if '://' not in link:
                    target = (file.parent / link).resolve()
                    assert target.exists() or (refresh and target == HERE / 'manifest.json'), link
        data = text.encode()
    inventory.append({'path': file.relative_to(ROOT).as_posix(), 'bytes': len(data), 'mode': mode, 'sha256': hashlib.sha256(data).hexdigest()})
manifest = {'base': BASE, 'hashPolicy': 'UTF-8 LF without BOM for text; exact binary bytes; excludes manifest itself.', 'files': inventory}
if refresh:
    (HERE / 'manifest.json').write_bytes((json.dumps(manifest, indent=2) + '\n').encode())
else:
    assert manifest == json.loads((HERE / 'manifest.json').read_text())
subprocess.run(['git', 'diff', '--check'], cwd=ROOT, check=True)
print(f'PASS: one runtime declaration deleted; 20 candidate layouts; four zero-pixel parity pairs; nine baseline diagnostics; {len(inventory)} inventory entries')
