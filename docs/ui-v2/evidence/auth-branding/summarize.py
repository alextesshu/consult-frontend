# Branding matrix + header-height regression check, candidate vs origin/dev baseline (browser fixtures).
import json
from pathlib import Path
here = Path(__file__).resolve().parent
cand = json.loads((here / 'branding-candidate.json').read_text(encoding='utf-8'))
base = {(r['width'], r['who'], r['ui'], r['route']): r for r in json.loads((here / 'branding-baseline.json').read_text(encoding='utf-8'))}
name = lambda xs: ','.join(x.split('@')[0] for x in xs) or '-'
problems, matrix = [], {}
for r in cand:
    k = (r['width'], r['who'], r['ui'], r['route']); b = base[k]
    hdr, ftr = name(r['headerLogos']), name(r['footerLogos'])
    cabinet = r['path'].startswith('/cabinet')
    if r['ui'] == 'v1':
        # v1 must stay exactly as on origin/dev (desktop logo, mobile mark, dark/light footer variants).
        ok = all(x == '-' or x.startswith('proconsult-') and not 'fennec' in x for x in (hdr + ',' + ftr).split(','))
        same = r['headerLogos'] == b['headerLogos'] and r['footerLogos'] == b['footerLogos'] and r['headerH'] == b['headerH']
        if not (ok and same): problems.append(('v1 changed', k, hdr, ftr))
    else:
        ok = hdr == 'proconsult-fennec-header.svg' and (ftr == 'proconsult-fennec-lockup.svg' or cabinet)
        if not ok: problems.append(('v2 not fennec', k, hdr, ftr))
        if r['headerH'] != b['headerH']: problems.append(('header height changed', k, b['headerH'], r['headerH']))
        if cabinet and (r['headerLogos'] != b['headerLogos'] or r['footerLogos'] != b['footerLogos']): problems.append(('cabinet changed', k))
        if not cabinet and r['who'] != 'guest' and not all(x.split('@')[1].endswith('x32') for x in r['headerLogos']): problems.append(('lockup size', k, r['headerLogos']))
    if r['overflow'] is False and base[k]['overflow'] is not False: problems.append(('new overflow', k))
    matrix.setdefault((r['ui'], r['who']), set()).add((hdr, ftr if not cabinet else f'cabinet:{ftr}'))
(here / 'branding-summary.json').write_text(json.dumps({'problems': [list(map(str, p)) for p in problems], 'matrix': {f'{u} {w}': sorted(map(list, v)) for (u, w), v in matrix.items()}}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('rows', len(cand), 'problems', len(problems))
for p in problems[:20]: print(p)
for (u, w), v in sorted(matrix.items()): print(u, w, sorted(v))
