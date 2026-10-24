"""Verify the approved inquiry-only scope, immutable references and browser evidence."""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path
from PIL import Image, ImageChops

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
BASE = 'b2d3e3eb90562b000a6ffd2e35eeda8302d003b8'
SOURCE = ['src/views/SpecialistInquiriesView.vue', 'src/views/SpecialistInquiriesView.spec.ts', 'src/styles/inquiriesV2.css', 'src/styles/inquiriesV2.spec.ts']
REPORT = 'docs/ui-v2/SPECIALIST_INQUIRIES_PHASE1.md'
refresh = '--refresh' in sys.argv


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def save(name, data):
    (HERE / name).write_bytes((json.dumps(data, indent=2, ensure_ascii=False) + '\n').encode())


changed = set(git('diff', BASE, '--name-only').decode().splitlines())
changed.update(git('ls-files', '--others', '--exclude-standard').decode().splitlines())
for name in changed:
    assert name in SOURCE or name == REPORT or name.startswith('docs/ui-v2/evidence/specialist-inquiries-phase1/'), name
old = git('show', BASE + ':' + SOURCE[0]).decode()
new = (ROOT / SOURCE[0]).read_text(encoding='utf8')
assert old[old.index('<style scoped>'):] == new[new.index('<style scoped>'):]
original = old[old.index('  <section class="inquiries">'):old.rfind('</template>', 0, old.index('<script'))]
current = new[new.index('  <section v-else class="inquiries">'):new.rfind('</template>', 0, new.index('<script'))].replace('<section v-else class="inquiries">', '<section class="inquiries">', 1)
assert original == current
archive = git('show', BASE + ':docs/ui-v2/snapshots/2026-10-23-4ff7cedd/source.zip')
assert hashlib.sha256(archive).hexdigest() == '4ff7cedd41f829306facd154e0a2af189b2e2cce3af3c786b6e4fb913149a347'
browser = json.loads((HERE / 'browser-results.json').read_text())
assert len(browser['matrix']) == 8 and len(browser['states']) == 7
assert all(row['final']['scrollWidth'] <= row['width'] and not row['pageErrors'] for row in browser['matrix'])
assert all(row['passed'] and not row['pageErrors'] for row in browser['states'])
assert len(browser['motionResults']) == 2
assert len(json.loads((HERE / 'incoming-results.json').read_text())['rows']) == 8
for name in ['v1-parity.json', 'incoming-v1-parity.json']:
    rows = []
    for width in [375, 390, 640, 768, 1023, 1024, 1280, 1440]:
        prefix = 'incoming-' if name.startswith('incoming') else ''
        a, b = HERE / f'{prefix}baseline-v1-{width}.png', HERE / f'{prefix}candidate-v1-{width}.png'
        first, second = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
        assert first.size == second.size
        assert ImageChops.difference(first, second).getbbox() is None, (name, width)
        rows.append({'width': width, 'baseline': a.name, 'candidate': b.name, 'changedPixels': 0, 'maxChannelDelta': 0})
    if refresh:
        save(name, rows)
    else:
        assert rows == json.loads((HERE / name).read_text())
diagnostics = lambda file: re.findall(r'^src/[^\n]+error TS[^\n]+', (HERE / file).read_text(encoding='utf8'), re.M)
assert diagnostics('typecheck-baseline.txt') == diagnostics('typecheck-candidate.txt')
assert len(diagnostics('typecheck-candidate.txt')) == 9
files = sorted([ROOT / file for file in SOURCE + [REPORT]] + [file for file in HERE.iterdir() if file.is_file() and file.name != 'manifest.json'])
inventory = []
for file in files:
    data = file.read_bytes()
    mode = 'binary' if file.suffix in {'.png', '.webm'} else 'utf8-lf'
    if mode == 'utf8-lf':
        text = data.decode('utf-8-sig').replace('\r\n', '\n')
        assert '\ufffd' not in text
        if file.suffix == '.md':
            for target in re.findall(r'\]\(([^)]+)\)', text):
                if '://' not in target:
                    destination = (file.parent / target).resolve()
                    assert destination.exists() or (refresh and destination == HERE / 'manifest.json'), target
        data = text.encode()
    inventory.append({'path': file.relative_to(ROOT).as_posix(), 'bytes': len(data), 'mode': mode, 'sha256': hashlib.sha256(data).hexdigest()})
manifest = {'base': BASE, 'incomingDevChecked': '6f91363f6fbed0f63d6fb181a6aa45ecffb3ba00', 'hashPolicy': 'UTF-8 LF without BOM for text; exact binary bytes; manifest excludes itself.', 'files': inventory}
if refresh:
    save('manifest.json', manifest)
else:
    assert manifest == json.loads((HERE / 'manifest.json').read_text(encoding='utf8'))
subprocess.run(['git', 'diff', '--check'], cwd=ROOT, check=True)
print(f'PASS: strict scope; V1 unchanged; 16 zero-pixel pairs; 8 widths/7 states/motion; 9 baseline diagnostics; {len(inventory)} hashes')
