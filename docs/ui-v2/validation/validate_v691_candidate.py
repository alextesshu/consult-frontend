"""Validate the KAN-158 v6.9.1 scoped overlay: import, activation and documentation, without executing prototype code."""
import hashlib
import json
import pathlib
import re
import stat
import subprocess
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[3]
DOCS = ROOT / 'docs/ui-v2'
IMPORT_BASE = '535940ffeedb108038992e93cd2cb27c0aa916be'  # registration base (#81)
ACTIVATION_BASE = '31a4488e95e70b83b921f8bdcd17955cfdbfc094'  # activation base, includes #81 and #82
BASE_SNAPSHOT = 'claude-design-2026-10-23-4ff7cedd'
SNAP_ID = 'claude-design-2026-10-26-1dbb9008'
SHA = '1dbb900845f830cc5fb9833d08f97c173f4500b05155faa00e12f723dabe152d'
ACTIVE = 'ACTIVE SCOPED OVERLAY'
PREFIX = 'docs/ui-v2/snapshots/2026-10-26-1dbb9008/'
SNAP = ROOT / PREFIX
NEW_DOCS = [
    'docs/ui-v2/DESIGN_SYNC_2026-10-26_V691_CANDIDATE.md',
    'docs/ui-v2/SNAPSHOT_ACTIVATION_PROPOSAL_V691.md',
    PREFIX + 'README.md',
]
# Documents the activation may change (SNAPSHOT_ACTIVATION_PROPOSAL_V691.md steps 1-9).
ACTIVATION_DOCS = {
    'docs/ui-v2/SNAPSHOT_CURRENT.json',
    'docs/ui-v2/SNAPSHOT_MANIFEST_V691_CANDIDATE.json',
    'docs/ui-v2/IMPLEMENTATION_MATRIX_V691_KAN158.json',
    'docs/ui-v2/DESIGN_SOURCE_INDEX.md',
    'docs/ui-v2/START_HERE.md',
    'docs/ui-v2/README.md',
    'docs/ui-v2/DESIGN_SYNC_CHECKLIST.md',
    'docs/DESIGN_SYSTEM.md',
    'docs/ui-v2/KAN_158_PUBLIC_PROFILE.md',
    'docs/ui-v2/IMPLEMENTATION_MATRIX_V66_V67.md',
    'docs/ui-v2/IMPLEMENTATION_MATRIX_V66_V67.json',
    'docs/ui-v2/CHANGELOG.md',
    'docs/ui-v2/DESIGN_SYNC_2026-10-26_V691_CANDIDATE.md',
    'docs/ui-v2/SNAPSHOT_ACTIVATION_PROPOSAL_V691.md',
    'docs/ui-v2/validation/validate_v691_candidate.py',
}
OVERLAY_LINK_DOCS = [
    'docs/ui-v2/START_HERE.md',
    'docs/ui-v2/README.md',
    'docs/ui-v2/DESIGN_SYNC_CHECKLIST.md',
    'docs/DESIGN_SYSTEM.md',
    'docs/ui-v2/KAN_158_PUBLIC_PROFILE.md',
    'docs/ui-v2/DESIGN_SOURCE_INDEX.md',
    'docs/ui-v2/CHANGELOG.md',
]


def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args])


def digest(data):
    return hashlib.sha256(data).hexdigest()


def at_base(path):
    return git('show', ACTIVATION_BASE + ':' + path)


manifest = json.loads((DOCS / 'SNAPSHOT_MANIFEST_V691_CANDIDATE.json').read_text(encoding='utf-8'))
assert manifest['snapshot_id'] == SNAP_ID and manifest['sha256'] == SHA
assert manifest['status'] == ACTIVE
assert manifest['activation']['activation_base_sha'] == ACTIVATION_BASE
assert manifest['activation']['base_snapshot_remains'] == BASE_SNAPSHOT
assert manifest['overlay_base_snapshot_id'] == BASE_SNAPSHOT
assert digest((DOCS / 'SNAPSHOT_MANIFEST_V66_V67.json').read_bytes()) == manifest['overlay_base_manifest_sha256']
# Activation changes only status/activation; the registered import metadata is untouched.
registered = json.loads(at_base('docs/ui-v2/SNAPSHOT_MANIFEST_V691_CANDIDATE.json'))
assert {k: v for k, v in manifest.items() if k not in ('status', 'activation')} == {k: v for k, v in registered.items() if k not in ('status', 'activation')}

# Archive: exact copy, integrity and safe paths.
raw = (SNAP / 'source.zip').read_bytes()
assert digest(raw) == SHA and len(raw) == manifest['archive_bytes']
with zipfile.ZipFile(SNAP / 'source.zip') as archive:
    assert archive.testzip() is None
    entries = [x for x in archive.infolist() if not x.is_dir()]
    assert len(entries) == manifest['archive_entry_count'] == len(manifest['files']) == 21
    assert len({x.filename.casefold() for x in entries}) == 21
    for entry in entries:
        p = pathlib.PurePosixPath(entry.filename)
        assert not p.is_absolute() and '..' not in p.parts and ':' not in str(p) and '\\' not in str(p)
        assert p.parts[0] + '/' == manifest['archive_root']
        assert all(x.rstrip(' .') == x and not re.match(r'^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)', x, re.I) for x in p.parts)
        assert stat.S_IFMT(entry.external_attr >> 16) in (0, stat.S_IFREG)
        assert not entry.flag_bits & 1
        assert (SNAP / entry.filename).resolve().is_relative_to(SNAP.resolve())
    # Payloads: source bytes match the archive; imported bytes differ only by the recorded whitespace.
    for item in manifest['files']:
        source = archive.read(item['path'])
        imported = (SNAP / item['path']).read_bytes()
        assert digest(source) == item['source_sha256'] and len(source) == item['source_bytes'], item['path']
        assert digest(imported) == item['imported_sha256'] and len(imported) == item['imported_bytes'], item['path']
        assert item['crlf_lines_normalized'] == 0
        if item['trailing_whitespace_normalized_lines']:
            lines = source.decode('utf-8').split('\n')
            changed = [i + 1 for i, line in enumerate(lines) if line != line.rstrip(' \t')]
            assert changed == item['trailing_whitespace_normalized_lines'], item['path']
            assert '\n'.join(line.rstrip(' \t') for line in lines).encode('utf-8') == imported
        else:
            assert imported == source, item['path']
    names = {x.filename for x in entries}
assert {x.relative_to(SNAP).as_posix() for x in SNAP.rglob('*') if x.is_file()} == names | {'source.zip', 'README.md'}
for ref in manifest['supersedes_for_scope']:
    assert (ROOT / ref['v66_reference']).is_file(), ref
    assert ref['v691_reference'] in names, ref

# Pointer: v6.6 base fields byte-identical in value and order, exactly one KAN-158 overlay.
pointer = json.loads((DOCS / 'SNAPSHOT_CURRENT.json').read_text(encoding='utf-8'))
base_pointer = json.loads(at_base('docs/ui-v2/SNAPSHOT_CURRENT.json'))
assert list(pointer)[:len(base_pointer)] == list(base_pointer) and all(pointer[k] == v for k, v in base_pointer.items())
assert pointer['snapshot_id'] == BASE_SNAPSHOT and set(pointer) == set(base_pointer) | {'scoped_overlays'}
assert len(pointer['scoped_overlays']) == 1
overlay = pointer['scoped_overlays'][0]
assert overlay['snapshot_id'] == SNAP_ID and overlay['sha256'] == SHA and overlay['archive_label'] == 'v6.9.1'
assert overlay['scope'].startswith('KAN-158:')
assert (DOCS / overlay['manifest']).name == 'SNAPSHOT_MANIFEST_V691_CANDIDATE.json' and (DOCS / overlay['matrix']).is_file()
assert overlay['activated'] == manifest['activation']['activated'] and overlay['approval'] and '<' not in overlay['approval']
assert [s.split('#')[0] for s in overlay['supersedes']] == [r['v66_reference'].removeprefix('docs/ui-v2/') for r in manifest['supersedes_for_scope']]
for target in overlay['supersedes']:
    assert (DOCS / target.split('#')[0]).is_file(), target

# Acceptance matrix: decisions recorded, nothing unmeasured presented as validated.
matrix = json.loads((DOCS / 'IMPLEMENTATION_MATRIX_V691_KAN158.json').read_text(encoding='utf-8'))
assert matrix['snapshot_id'] == SNAP_ID and matrix['sha256'] == SHA and matrix['base_sha'] == IMPORT_BASE
assert matrix['status'] == ACTIVE and matrix['activation']['activation_base_sha'] == ACTIVATION_BASE
assert matrix['final_ux_audit']['remediation']['merge'] == 'bb417701890642992b1952be4bcecdc7ff41441a'
assert 'No manual Safari, Firefox or screen-reader acceptance' in matrix['final_ux_audit']['not_claimed']
rows = {row['id']: row for row in matrix['rows']}
assert len(rows) == len(matrix['rows'])
merged = {pr['pr'] for pr in matrix['merged_prs']}
assert merged == {76, 77, 78, 79, 80, 82}
for pr in matrix['merged_prs']:
    assert (ROOT / pr['evidence']).is_file(), pr
    assert git('cat-file', '-t', pr['merge']).strip() == b'commit', pr
    assert git('merge-base', '--is-ancestor', pr['merge'], ACTIVATION_BASE) == b'', pr
for row in matrix['rows']:
    assert row['status'] in matrix['status_vocabulary'], row
    assert row['status'] not in ('OPEN DIFFERENCE', 'CONTRACT RESOLVED DIFFERENCE', 'NOT IMPLEMENTED'), row['id']
    assert set(row['prs']) <= merged, row
    assert row['note'] and row['design'], row
    if row['status'].startswith('IMPLEMENTED'):
        assert row['prs'], row
    if row['status'].startswith('APPROVED'):
        assert row['decision'].startswith('Accepted at activation 2026-10-26.'), row['id']
expected = {
    'final-cta-choose-format-link': 'APPROVED OMISSION',
    'accessibility-offers-radiogroup': 'APPROVED SEMANTIC DIFFERENCE',
    'experience-languages': 'APPROVED DIFFERENCE',
    'video-dialog': 'IMPLEMENTED',
    'accessibility-slots-focus-motion': 'PARTIALLY VERIFIED',
    'component-tokens': 'NOT RE-AUDITED',
    'section-nav': 'NOT RE-AUDITED',
    'continue-step-and-two-line-summary': 'IMPLEMENTED WITH APPROVED DIFFERENCE',
    'external-contacts-card': 'IMPLEMENTED WITH APPROVED DIFFERENCE',
}
for row_id, status in expected.items():
    assert rows[row_id]['status'] == status, (row_id, rows[row_id]['status'])
assert 'radiogroup parity' not in rows['accessibility-offers-radiogroup']['decision'].replace('not radiogroup parity', '')
assert rows['accessibility-offers-radiogroup']['open_conditions'], 'keyboard-test condition must stay visible until evidenced'
assert rows['video-dialog']['prs'] == [82]
assert rows['accessibility-slots-focus-motion']['verified'] and rows['accessibility-slots-focus-motion']['unverified']
assert all(rows[r]['decision'] for r in ('continue-step-and-two-line-summary', 'external-contacts-card'))

# v6.6 matrix: only the three overlay annotations are added; historical text is kept.
v66 = json.loads((DOCS / 'IMPLEMENTATION_MATRIX_V66_V67.json').read_text(encoding='utf-8'))
v66_base = json.loads(at_base('docs/ui-v2/IMPLEMENTATION_MATRIX_V66_V67.json'))
annotated = set()
for page, old in zip(v66['pages'], v66_base['pages'], strict=True):
    extra = page.pop('kan158_overlay', None)
    assert page == old, old['reference']
    if extra:
        assert extra['snapshot_id'] == SNAP_ID
        annotated.add(old['reference'])
assert {k: v for k, v in v66.items() if k != 'pages'} == {k: v for k, v in v66_base.items() if k != 'pages'}
assert annotated == {'Specialist-Profile.dc.html', 'Specialist-Profile-Mobile.dc.html', 'Profile-Edit.dc.html'}
md_new = (DOCS / 'IMPLEMENTATION_MATRIX_V66_V67.md').read_text(encoding='utf-8').split('\n')
md_old = at_base('docs/ui-v2/IMPLEMENTATION_MATRIX_V66_V67.md').decode('utf-8').split('\n')
assert len(md_new) == len(md_old)
changed_lines = [(o, n) for o, n in zip(md_old, md_new) if o != n]
assert len(changed_lines) == 3
for old, new in changed_lines:
    assert new.startswith(old[:-2] + ' **Overlay:** ') and SNAP_ID in new and new.endswith(' |')

# Canonical documents reference the overlay; registration-time documents only gain a status banner.
for path in OVERLAY_LINK_DOCS:
    assert SNAP_ID in (ROOT / path).read_text(encoding='utf-8'), path
for path in ('docs/ui-v2/DESIGN_SYNC_2026-10-26_V691_CANDIDATE.md', 'docs/ui-v2/SNAPSHOT_ACTIVATION_PROPOSAL_V691.md'):
    new, old = (ROOT / path).read_text(encoding='utf-8'), at_base(path).decode('utf-8')
    title, rest = old.split('\n', 1)
    assert new.startswith(title + '\n\n> **Activated 2026-10-26**') and new.endswith(rest.lstrip('\n')), path

# Scope: frozen snapshots untouched, only listed documents changed, nothing outside docs/.
for path in git('ls-tree', '-r', '--name-only', ACTIVATION_BASE, 'docs/ui-v2/snapshots').decode().splitlines():
    assert (ROOT / path).read_bytes() == at_base(path), path
changed = set(git('diff', ACTIVATION_BASE, '--name-only', '-z').decode().strip('\0').split('\0')) - {''}
untracked = set(git('ls-files', '--others', '--exclude-standard', '-z').decode().strip('\0').split('\0')) - {''}
assert not untracked, untracked
assert changed <= ACTIVATION_DOCS, changed - ACTIVATION_DOCS
assert not git('diff', ACTIVATION_BASE, '--diff-filter=ADRT', '--name-only').strip()
assert not git('diff', ACTIVATION_BASE, '--name-only', '--', 'src', 'public', 'package.json', 'package-lock.json', 'vite.config.ts', 'index.html', 'tsconfig.json').strip()

# Strict UTF-8 and existing Markdown link targets.
for path in changed:
    p = ROOT / path
    if p.suffix in ('.md', '.json', '.py'):
        raw_text = p.read_bytes()
        text = raw_text.decode('utf-8')
        assert text.encode('utf-8') == raw_text and chr(0xFFFD) not in text, path
for path in sorted(set(NEW_DOCS) | {p for p in changed if p.endswith('.md')}):
    p = ROOT / path
    for target in re.findall(r'\]\(([^)#\s]+)(?:#[^)]*)?\)', p.read_text(encoding='utf-8')):
        if '://' in target:
            continue
        assert (p.parent / target).exists(), (path, target)

print('validate_v691_candidate: PASS', len(manifest['files']), 'payloads,', len(matrix['rows']), 'matrix rows,', len(changed), 'changed documents, 1 scoped overlay')
