from pathlib import Path
import hashlib
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[5]
OUT = Path(__file__).resolve().parent
BASE = '7a535bd6577dc4321c05f1d65cb65ba669a7b415'
def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args])
paths = set(git('diff', BASE, '--name-only', '-z').decode().split('\0')) - {''}
paths |= set(git('ls-files', '--others', '--exclude-standard', '-z').decode().split('\0')) - {''}
source = {'src/styles/publicProfileV2.css', 'src/styles/publicProfileV2.spec.ts'}
assert {p for p in paths if p.startswith('src/')} == source
for p in paths:
    assert p in source or p == 'docs/ui-v2/KAN_158_OFFER_CONTRAST.md' or p.startswith('docs/ui-v2/evidence/kan-158/offer-contrast/'), p
    if Path(p).suffix != '.png':
        assert '\ufffd' not in (ROOT / p).read_text(encoding='utf-8'), p
d = json.loads((OUT / 'contrast-results.json').read_text(encoding='utf-8'))
assert len(d['rows']) == 64 and len(d['summaries']) == 8
assert {r['width'] for r in d['rows']} == {375, 768, 1280, 1440}
assert {r['offer'] for r in d['rows']} == {'standard', 'intro'}
for r in d['rows']:
    assert r['opacity'] == 1 and all(t['contrast'] >= 4.5 for t in r['text'])
    if r['disabled']:
        assert r['borderStyle'] == 'dashed'
    if r['state'] == 'focus':
        assert r['outline'] != 'none' and float(r['outlineWidth'].replace('px', '')) >= 2
assert all(t['contrast'] >= 4.5 for r in d['summaries'] for t in r['text'])
assert all(not r['errors'] and r['wheel'] and r['documentY'] == 500 for r in d['smoke'])
assert all(n['status'] == 200 or n['path'] == '/api/auth/token/refresh/' and n['status'] == 401 for r in d['smoke'] for n in r['network'])
assert all(r['changedPixels'] == 0 for r in json.loads((OUT / 'v1-parity.json').read_text(encoding='utf-8')))
report = ROOT / 'docs/ui-v2/KAN_158_OFFER_CONTRAST.md'
for ref in re.findall(r'\[[^\]]*\]\(([^)]+)\)', report.read_text(encoding='utf-8')):
    if not re.match(r'^[a-zA-Z]+:', ref):
        assert (report.parent / ref.split('#')[0]).exists(), ref
inventory = json.loads((OUT / 'files.json').read_text(encoding='utf-8'))
assert set(inventory['paths']) == paths
for item in inventory['hashes']:
    assert hashlib.sha256((ROOT / item['path']).read_bytes()).hexdigest() == item['sha256'], item['path']
print(f'PASS: {len(paths)} scoped files; 64 card/8 summary states AA; real four-width smoke; V1 parity; UTF-8/links/hashes; no other runtime changes.')
