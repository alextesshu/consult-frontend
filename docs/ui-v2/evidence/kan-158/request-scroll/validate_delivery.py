from pathlib import Path
import hashlib
import json
import re
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[5]
OUT = Path(__file__).resolve().parent
BASE = '5b294accb50d874a013c4f7f1cb13abe8e84f341'
def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args])
def sha(data):
    return hashlib.sha256(data).hexdigest()
paths = set(git('diff', BASE, '--name-only', '-z').decode().split('\0')) - {''}
paths |= set(git('ls-files', '--others', '--exclude-standard', '-z').decode().split('\0')) - {''}
source = {'src/views/PublicProfileView.vue', 'src/views/PublicProfileView.spec.ts', 'src/styles/publicProfileV2.css', 'src/lib/profilePanelScroll.ts', 'src/lib/profilePanelScroll.spec.ts'}
assert {p for p in paths if p.startswith('src/')} == source
for p in paths:
    assert p in source or p == 'docs/ui-v2/KAN_158_REQUEST_SCROLL.md' or p.startswith('docs/ui-v2/evidence/kan-158/request-scroll/'), p
    if Path(p).suffix != '.png':
        text = (ROOT / p).read_text(encoding='utf-8')
        assert '\ufffd' not in text and '?' * 4 not in text, p
manifest = json.loads((ROOT / 'docs/ui-v2/SNAPSHOT_MANIFEST_V66_V67.json').read_text(encoding='utf-8'))
snapshot = ROOT / 'docs/ui-v2/snapshots/2026-10-23-4ff7cedd'
assert sha((snapshot / 'source.zip').read_bytes()) == manifest['sha256']
with zipfile.ZipFile(snapshot / 'source.zip') as archive:
    assert archive.testzip() is None
    for item in manifest['files']:
        assert sha(archive.read(item['path'])) == item['source_sha256']
        assert sha((snapshot / item['path']).read_bytes()) == item['imported_sha256']
browser = json.loads((OUT / 'browser-results.json').read_text(encoding='utf-8'))
actual = [r for r in browser['result'] if r['evidence'].startswith('direct')]
assert sorted(r['width'] for r in actual) == [375, 768, 1280, 1440]
assert len(browser['result']) == 6
for row in browser['result']:
    check = row['checks']
    assert check['documentY'] == 500 and check['reachedSubmit'] and check['validation'] and check['typingAndTopicsStable'] and check['wheel']
    assert check['repeatCycles'] == 2
for row in actual:
    assert not row['posts'] and not row['errors']
    assert all(n['status'] == 200 or n['path'] == '/api/auth/token/refresh/' and n['status'] == 401 for n in row['network'])
assert all(r['changedPixels'] == 0 for r in json.loads((OUT / 'v1-parity.json').read_text(encoding='utf-8')))
assert not json.loads((OUT / 'typecheck-comparison.json').read_text(encoding='utf-8'))['newDiagnostics']
assert len(json.loads((OUT / 'business-handler-parity.json').read_text(encoding='utf-8'))) == 12
report = ROOT / 'docs/ui-v2/KAN_158_REQUEST_SCROLL.md'
for ref in re.findall(r'\[[^\]]*\]\(([^)]+)\)', report.read_text(encoding='utf-8')):
    if not re.match(r'^[a-zA-Z]+:', ref):
        assert (report.parent / ref.split('#')[0]).exists(), ref
inventory = json.loads((OUT / 'files.json').read_text(encoding='utf-8'))
assert set(inventory['paths']) == paths
for item in inventory['hashes']:
    assert sha((ROOT / item['path']).read_bytes()) == item['sha256'], item['path']
print(f'PASS: {len(paths)} scoped files; source CRC/70 hashes; UTF-8/links; direct real four-width scroll/error/cycles; reduced motion; V1 parity; baseline diagnostics/handlers; exact inventory.')
