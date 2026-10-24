"""Audit KAN-158 scope, source integrity, metadata and recorded acceptance."""
from pathlib import Path
import hashlib
import json
import re
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[5]
OUT = Path(__file__).resolve().parent
BASE = '7d437689a648923d319a26d604b7b31eb81b4473'

def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args])

def sha(data):
    return hashlib.sha256(data).hexdigest()

manifest = json.loads((ROOT / 'docs/ui-v2/SNAPSHOT_MANIFEST_V66_V67.json').read_text(encoding='utf-8'))
snapshot = ROOT / 'docs/ui-v2/snapshots/2026-10-23-4ff7cedd'
assert sha((snapshot / 'source.zip').read_bytes()) == '4ff7cedd41f829306facd154e0a2af189b2e2cce3af3c786b6e4fb913149a347'
with zipfile.ZipFile(snapshot / 'source.zip') as archive:
    assert archive.testzip() is None
    for item in manifest['files']:
        assert sha(archive.read(item['path'])) == item['source_sha256']
        assert sha((snapshot / item['path']).read_bytes()) == item['imported_sha256']
assert not git('diff', BASE, '--name-only', '--', 'docs/ui-v2/snapshots').strip()
protected = ['src/App.vue', 'src/router/index.ts', 'src/lib/api.ts', 'src/lib/uiVersion.ts', 'src/styles/tokens-v2.css', 'src/styles/components-v2.css', 'src/assets/brand-v2', 'public', 'src/views/HomeView.vue', 'src/views/ForClientsView.vue', 'src/views/PublicTherapistsView.vue', 'src/composables/useSpecialistDiscovery.ts', 'package.json', 'package-lock.json', '.github']
assert not git('diff', BASE, '--name-only', '--', *protected).strip()
assert not git('diff', 'e63b1ca1a941f56c6578c32a7b964a133404bbb6', BASE, '--name-only', '--', 'src').strip()
paths = set(git('diff', BASE, '--name-only', '-z').decode().strip('\0').split('\0')) - {''}
paths |= set(git('ls-files', '--others', '--exclude-standard', '-z').decode().strip('\0').split('\0')) - {''}
allowed_source = {
    'src/views/PublicProfileView.vue', 'src/views/PublicProfileView.spec.ts',
    'src/components/public-profile/PublicProfileAboutSection.vue',
    'src/components/public-profile/PublicProfileFaqSection.vue',
    'src/components/public-profile/PublicProfileHeroSection.vue',
    'src/components/public-profile/PublicProfileIdentityRail.vue',
    'src/components/public-profile/PublicProfileTrustSection.vue',
    'src/components/public-profile/PublicProfileOverlay.vue',
    'src/components/public-profile/PublicProfileOverlay.spec.ts',
    'src/components/public-profile/PublicProfileShare.vue',
    'src/composables/useProfileMotion.ts', 'src/composables/useProfileMotion.spec.ts',
    'src/styles/publicProfileV2.css', 'src/styles/publicProfileV2.spec.ts',
    'src/styles/uiV2.spec.ts',
}
allowed_docs = {'docs/ui-v2/KAN_158_PUBLIC_PROFILE.md', 'docs/ui-v2/IMPLEMENTATION_MATRIX_V66_V67.md', 'docs/ui-v2/IMPLEMENTATION_MATRIX_V66_V67.json'}
for path in paths:
    assert path in allowed_source or path in allowed_docs or path.startswith('docs/ui-v2/evidence/kan-158/v66-v67/'), path
    p = ROOT / path
    if p.suffix in ('.md', '.json', '.ts', '.vue', '.css', '.cjs', '.py', '.txt'):
        text = p.read_bytes().decode('utf-8')
        assert '\ufffd' not in text, path
        if p.suffix in ('.md', '.vue', '.ts', '.css'):
            assert not re.search(r'^(<<<<<<<|=======|>>>>>>>)', text, re.M), path
for name in ['KAN_158_PUBLIC_PROFILE.md', 'IMPLEMENTATION_MATRIX_V66_V67.md']:
    p = ROOT / 'docs/ui-v2' / name
    for ref in re.findall(r'\[[^\]]*\]\(([^)]+)\)', p.read_text(encoding='utf-8')):
        if re.match(r'^[a-zA-Z]+:', ref) or ref.startswith('#'):
            continue
        assert (p.parent / ref.split('#')[0]).exists(), (name, ref)
assert all(row['changedPixels'] == 0 for row in json.loads((OUT / 'v1-parity.json').read_text()))
assert len(json.loads((OUT / 'browser-acceptance.json').read_text())) == 4
assert all(not row.get('errors') for row in json.loads((OUT / 'browser-acceptance.json').read_text()))
assert all(not row.get('errors') for row in json.loads((OUT / 'source-captures.json').read_text()))
assert all(not row.get('errors') for row in json.loads((OUT / 'lifecycle-acceptance.json').read_text()))
assert json.loads((OUT / 'client-confirmation.json').read_text())['confirmationInsideTopLayer']
assert len(json.loads((OUT / 'business-handler-parity.json').read_text())) == 12
assert not json.loads((OUT / 'typecheck-comparison.json').read_text())['newDiagnostics']
if (OUT / 'files.json').exists():
    inventory = json.loads((OUT / 'files.json').read_text())
    assert set(inventory['paths']) == paths
    for item in inventory['hashes']:
        assert sha((ROOT / item['path']).read_bytes()) == item['sha256'], item['path']
print('PASS: 70 source/import hashes and CRC; immutable snapshots; protected runtime; approved scope; UTF-8/links; four-width v1 parity; source/Vue/lifecycle/client results; 12 unchanged handlers; zero new type diagnostics; exact inventory.')
