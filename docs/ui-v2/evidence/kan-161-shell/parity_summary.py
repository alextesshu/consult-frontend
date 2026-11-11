# Combines parity-run*.json: a pair passes when, in at least one run, the candidate matches the baseline
# or the control capture of the same origin/dev build exactly (rendering-noise floor).
from pathlib import Path
import json
here = Path(__file__).resolve().parent
runs = [json.loads(p.read_text(encoding='utf-8')) for p in sorted(here.glob('parity-run*.json'))]
summary = []
for i, pair in enumerate(runs[0]):
    values = [run[i] for run in runs]
    best = min(min(v['candidateVsBaseline'], v['candidateVsControl']) for v in values)
    noise = max(v['controlVsBaseline'] for v in values)
    summary.append({'width': pair['width'], 'route': pair['route'], 'runs': len(values), 'bestCandidateDiff': best, 'maxBaselineNoise': noise,
                    'perRun': [[v['candidateVsBaseline'], v['candidateVsControl'], v['controlVsBaseline']] for v in values]})
(here / 'parity-summary.json').write_text(json.dumps(summary, indent=2) + '\n', encoding='utf-8')
for s in summary: print(s['width'], s['route'], 'best', s['bestCandidateDiff'], 'noise', s['maxBaselineNoise'], s['perRun'])
