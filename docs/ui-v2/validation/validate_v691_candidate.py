"""Validate the inactive KAN-158 v6.9.1 candidate import without executing prototype code."""
import hashlib
import json
import pathlib
import re
import stat
import subprocess
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[3]
DOCS = ROOT / 'docs/ui-v2'
BASE = '535940ffeedb108038992e93cd2cb27c0aa916be'
SNAP_ID = 'claude-design-2026-10-26-1dbb9008'
SHA = '1dbb900845f830cc5fb9833d08f97c173f4500b05155faa00e12f723dabe152d'
PREFIX = 'docs/ui-v2/snapshots/2026-10-26-1dbb9008/'
SNAP = ROOT / PREFIX
NEW_DOCS = [
    'docs/ui-v2/DESIGN_SYNC_2026-10-26_V691_CANDIDATE.md',
    'docs/ui-v2/SNAPSHOT_ACTIVATION_PROPOSAL_V691.md',
    PREFIX + 'README.md',
]


def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args])


def digest(data):
    return hashlib.sha256(data).hexdigest()


manifest = json.loads((DOCS / 'SNAPSHOT_MANIFEST_V691_CANDIDATE.json').read_text(encoding='utf-8'))
assert manifest['snapshot_id'] == SNAP_ID and manifest['sha256'] == SHA
assert manifest['status'] == 'CANDIDATE — NOT ACTIVE'
assert manifest['overlay_base_snapshot_id'] == 'claude-design-2026-10-23-4ff7cedd'
assert digest((DOCS / 'SNAPSHOT_MANIFEST_V66_V67.json').read_bytes()) == manifest['overlay_base_manifest_sha256']

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

# Coverage matrix: structure, vocabulary, PR evidence.
matrix = json.loads((DOCS / 'IMPLEMENTATION_MATRIX_V691_KAN158.json').read_text(encoding='utf-8'))
assert matrix['snapshot_id'] == SNAP_ID and matrix['sha256'] == SHA and matrix['base_sha'] == BASE
assert matrix['status'] == 'CANDIDATE — NOT ACTIVE'
ids = [row['id'] for row in matrix['rows']]
assert len(ids) == len(set(ids))
merged = {pr['pr'] for pr in matrix['merged_prs']}
assert merged == {76, 77, 78, 79, 80}
for pr in matrix['merged_prs']:
    assert (ROOT / pr['evidence']).is_file(), pr
    assert git('cat-file', '-t', pr['merge']).strip() == b'commit', pr
    assert git('merge-base', '--is-ancestor', pr['merge'], BASE) == b'', pr
for row in matrix['rows']:
    assert row['status'] in matrix['status_vocabulary'], row
    assert set(row['prs']) <= merged, row
    assert row['note'] and row['design'], row
    if row['status'].startswith('IMPLEMENTED'):
        assert row['prs'], row

# The active pointer and every existing file stay as on the base.
assert (DOCS / 'SNAPSHOT_CURRENT.json').read_bytes() == git('show', BASE + ':docs/ui-v2/SNAPSHOT_CURRENT.json')
assert json.loads((DOCS / 'SNAPSHOT_CURRENT.json').read_text(encoding='utf-8'))['snapshot_id'] == 'claude-design-2026-10-23-4ff7cedd'
for path in git('ls-tree', '-r', '--name-only', BASE, 'docs/ui-v2/snapshots').decode().splitlines():
    assert (ROOT / path).read_bytes() == git('show', BASE + ':' + path), path
changed = set(git('diff', BASE, '--name-only', '-z').decode().strip('\0').split('\0')) - {''}
untracked = set(git('ls-files', '--others', '--exclude-standard', '-z').decode().strip('\0').split('\0')) - {''}
# No existing file is modified, deleted or renamed; only new documentation files are added.
assert not git('diff', BASE, '--diff-filter=DMRT', '--name-only').strip()
for path in changed | untracked:
    assert path.startswith('docs/ui-v2/'), path

# Strict UTF-8 and existing Markdown link targets in the new documents.
for path in changed | untracked:
    p = ROOT / path
    if p.suffix in ('.md', '.json', '.py'):
        raw_text = p.read_bytes()
        text = raw_text.decode('utf-8')
        assert text.encode('utf-8') == raw_text and '\ufffd' not in text, path
for path in NEW_DOCS:
    p = ROOT / path
    for target in re.findall(r'\]\(([^)#\s]+)(?:#[^)]*)?\)', p.read_text(encoding='utf-8')):
        if '://' in target:
            continue
        assert (p.parent / target).exists(), (path, target)

print('validate_v691_candidate: PASS', len(manifest['files']), 'payloads,', len(matrix['rows']), 'matrix rows')
