"""Validate final integration evidence and the complete PR scope against dev."""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path
from PIL import Image, ImageChops

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
DEV = 'c864fcb629a372170c79b8ae33e409c4c9091f78'
PREVIOUS = '8f81967a2e5aecdd4e7024edaebc203c5c0b4f4d'
REFRESH = '--refresh' in sys.argv


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def write(name, data):
    (HERE / name).write_bytes((json.dumps(data, indent=2, ensure_ascii=False) + '\n').encode())


source = set(git('diff', PREVIOUS, DEV, '--name-only', '--', 'src').decode().splitlines())
for file in ['src/App.vue', 'src/styles/components-v2.css', 'src/styles/tokens-v2.css', 'src/router/index.ts', 'src/views/LoginView.vue']:
    assert git('show', DEV + ':' + file) == git('show', ':' + file), file
for file in ['src/views/SignupView.vue', 'src/views/ClientSignupView.vue', 'src/components/RegistrationWizardV2.vue', 'src/composables/useRegistrationViewport.ts', 'src/styles/registrationP6.css', 'src/lib/api.ts', 'src/stores/auth.ts']:
    current = (ROOT / file).read_bytes().replace(b'\r\n', b'\n')
    assert current == git('show', PREVIOUS + ':' + file), file
diagnostics = lambda file: re.findall(r'^src/[^\n]+error TS[^\n]+', (HERE / file).read_text(encoding='utf8'), re.M)
assert diagnostics('typecheck-dev.txt') == diagnostics('typecheck-candidate.txt')
assert len(diagnostics('typecheck-dev.txt')) == 9
styles = json.loads((HERE / 'v1-dom-styles.json').read_text())
assert len(styles) == 20
assert all(styles[i]['geometryAndComputedStylesSHA256'] == styles[i + 1]['geometryAndComputedStylesSHA256'] for i in range(0, 20, 2))
pixels = []
for file in sorted(HERE.glob('baseline-*.png')):
    candidate = HERE / file.name.replace('baseline-', 'candidate-')
    a, b = Image.open(file).convert('RGB'), Image.open(candidate).convert('RGB')
    assert a.size == b.size
    samples = list(ImageChops.difference(a, b).get_flattened_data())
    pixels.append({'baseline': file.name, 'candidate': candidate.name, 'size': list(a.size), 'changedPixels': sum(any(p) for p in samples), 'maxChannelDelta': max(max(p) for p in samples)})
assert len(pixels) == 10 and max(row['maxChannelDelta'] for row in pixels) <= 2
if REFRESH:
    write('v1-pixel-parity.json', pixels)
else:
    assert pixels == json.loads((HERE / 'v1-pixel-parity.json').read_text())
assert len(json.loads((HERE / 'browser-results.json').read_text())['matrix']) == 10
assert len(json.loads((HERE / 'navigation.json').read_text())) == 5
assert all(row['visible'] for row in json.loads((HERE / 'keyboard-visibility.json').read_text()))
paths = set(git('diff', DEV, '--name-only').decode().splitlines())
paths.update(git('ls-files', '--others', '--exclude-standard').decode().splitlines())
manifest_path = (HERE / 'manifest.json').relative_to(ROOT).as_posix()
paths.discard(manifest_path)
inventory = []
for name in sorted(paths):
    file = ROOT / name
    assert name.startswith('docs/ui-v2/evidence/kan-159/') or name in {'docs/ui-v2/KAN_159_REGISTRATION_P6.md', 'docs/ui-v2/KAN_159_FINAL_INTEGRATION.md'} or (name in source and name.startswith('src/')), name
    data = file.read_bytes()
    mode = 'binary' if file.suffix in {'.png', '.webm'} else 'utf8-lf'
    if mode == 'utf8-lf':
        text = data.decode('utf-8-sig').replace('\r\n', '\n')
        assert '\ufffd' not in text, name
        data = text.encode()
        if file.suffix == '.md':
            for target in re.findall(r'\]\(([^)]+)\)', text):
                if '://' not in target:
                    destination = (file.parent / target.split('#')[0]).resolve()
                    assert destination.exists() or (REFRESH and destination == HERE / 'manifest.json'), (name, target)
    inventory.append({'path': name, 'bytes': len(data), 'mode': mode, 'sha256': hashlib.sha256(data).hexdigest()})
manifest = {'devBaseline': DEV, 'startingRegistrationHEAD': PREVIOUS, 'conflicts': [], 'runtimeEditsDuringIntegration': [], 'hashPolicy': 'UTF-8 LF without BOM for text; exact binary bytes. Inventory is full PR delta versus dev; excludes this manifest.', 'files': inventory}
if REFRESH:
    write('manifest.json', manifest)
else:
    assert manifest == json.loads((HERE / 'manifest.json').read_text(encoding='utf8'))
subprocess.run(['git', 'diff', '--check'], cwd=ROOT, check=True)
print(f'PASS: {len(inventory)} inventory entries; shared dev files unchanged; registration preserved; 9 baseline diagnostics; 10 V1 pairs; UTF-8/links/scope')
