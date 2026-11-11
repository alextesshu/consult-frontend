"""Validate KAN-154 reference import without executing prototype code."""
import collections
import hashlib
import html.parser
import json
import pathlib
import re
import stat
import subprocess
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[3]
DOCS = ROOT / 'docs/ui-v2'
BASE = 'e63b1ca1a941f56c6578c32a7b964a133404bbb6'
PREFIX = 'docs/ui-v2/snapshots/2026-10-23-4ff7cedd/'
SNAP = ROOT / PREFIX

def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args])

def digest(data):
    return hashlib.sha256(data).hexdigest()

manifest = json.loads((DOCS / 'SNAPSHOT_MANIFEST_V66_V67.json').read_text(encoding='utf-8'))
assert digest((SNAP / 'source.zip').read_bytes()) == manifest['sha256']
with zipfile.ZipFile(SNAP / 'source.zip') as archive, zipfile.ZipFile(DOCS / 'snapshots/2026-10-23-7570f1ad/source.zip') as old:
    assert archive.testzip() is None
    assert len(archive.infolist()) == 70
    assert len({x.filename.casefold() for x in archive.infolist()}) == 70
    for entry in archive.infolist():
        p = pathlib.PurePosixPath(entry.filename)
        assert not p.is_absolute() and '..' not in p.parts and ':' not in str(p) and '\\' not in str(p)
        assert all(x.rstrip(' .') == x and not re.match(r'^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)', x, re.I) for x in p.parts)
        assert stat.S_IFMT(entry.external_attr >> 16) in (0, stat.S_IFREG, stat.S_IFDIR)
        assert not entry.flag_bits & 1
        assert (SNAP / entry.filename).resolve().is_relative_to(SNAP.resolve())
    counts = collections.Counter()
    for item in manifest['files']:
        source = archive.read(item['path'])
        imported = (SNAP / item['path']).read_bytes()
        assert digest(source) == item['source_sha256'] and len(source) == item['source_bytes']
        assert digest(imported) == item['imported_sha256'] and len(imported) == item['imported_bytes']
        if item['trailing_whitespace_normalized_lines']:
            lines = source.decode('utf-8').splitlines(keepends=True)
            changed = [i + 1 for i, line in enumerate(lines) if line.rstrip('\r\n').endswith((' ', '\t'))]
            assert changed == item['trailing_whitespace_normalized_lines']
            normalized = ''.join(line.rstrip('\r\n').rstrip(' \t') + line[len(line.rstrip('\r\n')):] for line in lines).encode()
            assert normalized == imported
        else:
            assert imported == source
        counts['added' if item['path'] not in old.namelist() else 'unchanged' if old.read(item['path']) == source else 'modified'] += 1
    assert counts == {'added': 8, 'modified': 25, 'unchanged': 37}
    assert not set(old.namelist()) - set(archive.namelist())
    assert {x.relative_to(SNAP).as_posix() for x in SNAP.rglob('*') if x.is_file()} == set(archive.namelist()) | {'source.zip', 'README.md'}
assert digest((DOCS / 'SNAPSHOT_MANIFEST_V5.json').read_bytes()) == manifest['previous_manifest_sha256']
# All previous snapshots and their tracked bytes remain identical to base.
for path in git('ls-tree', '-r', '--name-only', BASE, 'docs/ui-v2/snapshots').decode().splitlines():
    assert (ROOT / path).read_bytes() == git('show', BASE + ':' + path), path
# Only new references and explicitly allowed canonical documents may change.
paths = set(git('diff', BASE, '--name-only', '-z').decode().strip('\0').split('\0')) - {''}
paths |= set(git('ls-files', '--others', '--exclude-standard', '-z').decode().strip('\0').split('\0')) - {''}
allowed = {'docs/DESIGN_SYSTEM.md'}
for path in paths:
    assert path in allowed or path.startswith('docs/ui-v2/'), path
    assert not path.startswith('docs/ui-v2/snapshots/') or path.startswith(PREFIX), path
    assert not path.endswith(('IMPLEMENTATION_MATRIX_V5.md', 'IMPLEMENTATION_MATRIX_V5.json', 'SNAPSHOT_MANIFEST_V5.json')), path
assert not git('diff', BASE, '--diff-filter=D', '--name-only').strip()
# Strict UTF-8 for all changed text, including source payloads.
for path in paths:
    p = ROOT / path
    if p.suffix in ('.md', '.json', '.html', '.js', '.ts', '.css', '.py'):
        raw = p.read_bytes()
        text = raw.decode('utf-8')
        assert text.encode('utf-8') == raw and '\ufffd' not in text, path
# Check newly written canonical Markdown links. Frozen source documents contain
# installation-path examples, not canonical repository-relative links.
for path in paths:
    p = ROOT / path
    if p.suffix != '.md' or path.startswith(PREFIX + 'handoff/'):
        continue
    text = p.read_text(encoding='utf-8')
    if path in {'docs/DESIGN_SYSTEM.md', 'docs/ui-v2/CHANGELOG.md', 'docs/ui-v2/TZ_CODEX.md', 'docs/ui-v2/MIGRATION_PLAN_V2.md'}:
        text = text.split('\n---\n', 1)[0]
    text = re.sub(r'```.*?```', '', text, flags=re.S)
    for target in re.findall(r'\[[^\]]*\]\(([^)]+)\)', text):
        if re.match(r'^[a-zA-Z]+:', target) or target.startswith('#'):
            continue
        target = target.strip('<>').split('#')[0]
        assert (p.parent / target).resolve().exists(), (path, target)
# Static HTML references: known missing prototype edit target remains evidence.
class Links(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []
    def handle_starttag(self, tag, attrs):
        self.refs.extend(v for k, v in attrs if k in ('href', 'src', 'poster') and v)
missing = set()
for p in (SNAP / 'handoff/mockups').glob('*.html'):
    parser = Links()
    parser.feed(p.read_text(encoding='utf-8'))
    for ref in parser.refs:
        if ref.startswith(('#', '/', 'http:', 'https:', 'mailto:', 'tel:', 'data:')) or '{{' in ref or '${' in ref:
            continue
        target = ref.split('#')[0].split('?')[0]
        if not (p.parent / target).exists():
            missing.add((p.name, ref))
assert missing == {('Specialist-Profile.dc.html', 'Specialist-Cabinet.dc.html')}, missing
readiness = json.loads((DOCS / 'DESIGN_READINESS_V66_V67.json').read_text(encoding='utf-8'))
matrix = json.loads((DOCS / 'IMPLEMENTATION_MATRIX_V66_V67.json').read_text(encoding='utf-8'))
assert readiness['ready_count'] == len(matrix['pages']) == 36
assert {x['reference'] for x in readiness['html_references']} == {x['reference'] for x in matrix['pages']}
for p in matrix['pages']:
    assert (DOCS / p['source_path']).exists()
source_decisions = (SNAP / 'handoff/BACKEND_DECISIONS.md').read_text(encoding='utf-8')
assert len(re.findall(r'^\| \d+ \|', source_decisions, flags=re.M)) == 20
assert not re.search(r'^\| \d+ .*✅', source_decisions, flags=re.M)
for pr in json.loads((DOCS / 'PR_EVIDENCE_V66_V67.json').read_text(encoding='utf-8'))['frontend']:
    if pr['state'] == 'MERGED':
        assert subprocess.run(['git', '-C', str(ROOT), 'merge-base', '--is-ancestor', pr['mergeCommit']['oid'], BASE]).returncode == 0
# When staged, verify Git will preserve the imported bytes and exact archive.
indexed = set(git('diff', '--cached', '--name-only').decode().splitlines())
for path in indexed:
    if path.startswith(PREFIX):
        assert git('show', ':' + path) == (ROOT / path).read_bytes(), path
inventory = DOCS / 'DESIGN_SYNC_V66_V67_FILES.json'
if inventory.exists():
    expected = set(json.loads(inventory.read_text(encoding='utf-8'))['paths'])
    actual = paths if paths else set(git('diff', BASE, 'HEAD', '--name-only').decode().splitlines())
    assert actual == expected, (actual - expected, expected - actual)
print('PASS: archive/CRC/paths; 70 payload hashes; exact ZIP; normalization; 8/25/37 diff; historical bytes; docs scope; UTF-8; canonical links; source refs (1 documented defect); 36 READY/matrix; 20 unresolved decisions; merged ancestry; staged snapshot bytes; inventory.')
