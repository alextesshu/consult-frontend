# Combines parity-run*.json: a pair passes when, in at least one run, the candidate matches the
# baseline or the control capture of the same baseline build exactly (font-loading noise floor).
from pathlib import Path
import json
here = Path(__file__).resolve().parent
runs = [json.loads(p.read_text(encoding='utf-8')) for p in sorted(here.glob('parity-run*.json'))]
summary = []
for i, pair in enumerate(runs[0]):
    values = [run[i] for run in runs]
    best = min(min(v['candidateVsBaseline'], v['candidateVsControl']) if isinstance(v['candidateVsBaseline'], int) else 10**9 for v in values)
    noise = max(v['controlVsBaseline'] if isinstance(v['controlVsBaseline'], int) else 0 for v in values)
    summary.append({'ui': pair['ui'], 'width': pair['width'], 'page': pair['page'], 'runs': len(values), 'bestCandidateDiff': best, 'maxBaselineNoise': noise,
                    'perRun': [[v['candidateVsBaseline'], v['candidateVsControl'], v['controlVsBaseline']] for v in values]})
(here / 'parity-summary.json').write_text(json.dumps(summary, indent=2) + '\n', encoding='utf-8')
for s in summary: print(s['ui'], s['width'], s['page'], 'best', s['bestCandidateDiff'], 'noise', s['maxBaselineNoise'], s['perRun'])
