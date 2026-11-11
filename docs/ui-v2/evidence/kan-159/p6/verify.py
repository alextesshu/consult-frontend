"""Verify KAN-159 evidence and approved scope; optionally refresh derived records."""
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path

from PIL import Image, ImageChops

BASELINE = 'eeafc58381858771ab4bf1ec12e85dfb873e4c15'
ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
REPORT = ROOT / 'docs/ui-v2/KAN_159_REGISTRATION_P6.md'
SOURCE = {
    'src/components/RegistrationWizardV2.vue',
    'src/components/RegistrationWizardV2.spec.ts',
    'src/composables/useRegistrationViewport.ts',
    'src/styles/registrationP6.css',
    'src/styles/registrationP6.spec.ts',
    'src/views/SignupView.vue',
    'src/views/ClientSignupView.vue',
    'src/views/ClientSignupView.spec.ts',
}


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT).decode('utf8')


def payload(file):
    raw = file.read_bytes()
    if file.suffix in {'.png', '.webm'}:
        return raw, 'binary'
    text = raw.decode('utf-8-sig').replace('\r\n', '\n')
    assert '\ufffd' not in text, f'Invalid replacement character: {file}'
    return text.encode('utf8'), 'utf8-lf'


def save(name, value):
    (HERE / name).write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n', encoding='utf8')


def main():
    refresh = argparse.ArgumentParser()
    refresh.add_argument('--refresh', action='store_true')
    args = refresh.parse_args()
    changed = set(git('diff', BASELINE, '--name-only').splitlines())
    changed.update(git('ls-files', '--others', '--exclude-standard').splitlines())
    for name in changed:
        assert name in SOURCE or name == REPORT.relative_to(ROOT).as_posix() or name.startswith('docs/ui-v2/evidence/kan-159/p6/'), name
    files = sorted([ROOT / name for name in SOURCE] + [REPORT] + [f for f in HERE.iterdir() if f.is_file() and f.name != 'manifest.json'])
    for file in files:
        data, mode = payload(file)
        if file.suffix == '.md':
            for target in re.findall(r'\]\(([^)]+)\)', data.decode()):
                if '://' not in target and not target.startswith('#'):
                    destination = file.parent / target.split('#')[0]
                    assert destination.exists() or (args.refresh and destination.resolve() == HERE / 'manifest.json'), (file, target)
    baseline = (HERE / 'typecheck-baseline.txt').read_text(encoding='utf8')
    candidate = (HERE / 'typecheck-candidate.txt').read_text(encoding='utf8')
    diagnostics = lambda text: re.findall(r'^src/[^\n]+error TS[^\n]+', text, re.M)
    assert diagnostics(baseline) == diagnostics(candidate)
    assert len(diagnostics(candidate)) == 9
    styles = json.loads((HERE / 'v1-dom-styles.json').read_text())
    assert len(styles) == 20
    for i in range(0, len(styles), 2):
        assert styles[i]['geometryAndComputedStylesSHA256'] == styles[i + 1]['geometryAndComputedStylesSHA256']
    pixels = []
    for baseline_image in sorted(HERE.glob('baseline-*.png')):
        candidate_image = HERE / baseline_image.name.replace('baseline-', 'candidate-')
        a, b = Image.open(baseline_image).convert('RGB'), Image.open(candidate_image).convert('RGB')
        assert a.size == b.size
        delta = ImageChops.difference(a, b)
        samples = list(delta.get_flattened_data())
        pixels.append({'baseline': baseline_image.name, 'candidate': candidate_image.name, 'size': list(a.size), 'changedPixels': sum(any(pixel) for pixel in samples), 'maxChannelDelta': max(max(pixel) for pixel in samples), 'bbox': list(delta.getbbox()) if delta.getbbox() else None})
    assert len(pixels) == 10
    assert max(row['maxChannelDelta'] for row in pixels) <= 2
    if args.refresh:
        save('v1-pixel-parity.json', pixels)
    else:
        assert pixels == json.loads((HERE / 'v1-pixel-parity.json').read_text())
    inventory = []
    for file in files:
        data, mode = payload(file)
        inventory.append({'path': file.relative_to(ROOT).as_posix(), 'bytes': len(data), 'mode': mode, 'sha256': hashlib.sha256(data).hexdigest()})
    manifest = {'baseline': BASELINE, 'snapshot': 'claude-design-2026-10-23-4ff7cedd', 'archiveSHA256': '4ff7cedd41f829306facd154e0a2af189b2e2cce3af3c786b6e4fb913149a347', 'hashPolicy': 'Text hashes use UTF-8 without BOM and LF, matching normalized Git content. Binary hashes use exact bytes. Manifest excludes itself.', 'files': inventory}
    if args.refresh:
        save('manifest.json', manifest)
    else:
        assert manifest == json.loads((HERE / 'manifest.json').read_text(encoding='utf8'))
    subprocess.run(['git', 'diff', '--check'], cwd=ROOT, check=True)
    print(f'PASS: {len(files)} manifest entries; UTF-8/links/scope; 9 unchanged diagnostics; 10 V1 style/geometry pairs and pixel limits')


if __name__ == '__main__':
    main()
