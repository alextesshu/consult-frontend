# Inquiry Phase 1 evidence

See [delivery report/fidelity matrix](../../SPECIALIST_INQUIRIES_PHASE1.md). All runtime browser data here are **API fixtures**, never real clients. Original design captures are separate and M10's sample contact is masked. All source references remain immutable.

Review `v2-{width}-{list|thread|sending}.png` for widths 375,390,640,768,1023,1024,1280,1440. Additional state screenshots cover loading, errors, empty, stale switching and CLOSED after send. `motion-1280.webm` records the normal source-timed row exit/toast; normal/reduced animation metadata are in browser-results.json. The shared tabbar/navigation purpose is intentionally retained.

`baseline-v1-*` / `candidate-v1-*` compare exact task base b2d3e3e. `incoming-baseline-v1-*` / `incoming-candidate-v1-*` compare the same body delta with #68 branding overlaid from target dev 6f91363f. Both groups have zero changed pixels on every width. The incoming V2 screenshots/JSON verify no overflow and the unchanged guest-request destination; no shared files were written or merged.

From the feature worktree root in Windows PowerShell, start candidate and baseline previews separately:

```powershell
node node_modules/vite/bin/vite.js --config docs/ui-v2/evidence/specialist-inquiries-phase1/candidate.config.mjs --host 127.0.0.1 --port 5354 --strictPort
node node_modules/vite/bin/vite.js --config docs/ui-v2/evidence/specialist-inquiries-phase1/baseline.config.mjs --host 127.0.0.1 --port 5355 --strictPort
node docs/ui-v2/evidence/specialist-inquiries-phase1/browser.cjs
node docs/ui-v2/evidence/specialist-inquiries-phase1/source.cjs
```

The fixture helper uses the already installed Playwright module from existing cabinet-shell evidence; no package was added. Baseline Vite reads only the original inquiry view through git show. source.cjs renders original HTML/support for visual acceptance; it never rewrites the design snapshot.

For prospective incoming checks, use incoming.config.mjs at 5356; in a separate terminal set `$env:INQUIRIES_BASELINE='true'` and use the same config at 5364. Then run incoming.cjs. The incoming configuration reads only App.vue/components-v2.css from pinned target Git objects. It is reference-only test tooling, never imported by production runtime.

```powershell
node node_modules/vite/bin/vite.js --config docs/ui-v2/evidence/specialist-inquiries-phase1/incoming.config.mjs --host 127.0.0.1 --port 5356 --strictPort
node docs/ui-v2/evidence/specialist-inquiries-phase1/incoming.cjs
python docs/ui-v2/evidence/specialist-inquiries-phase1/verify.py --refresh
```

Run the commands from the delivery report for unit/full/build/typecheck. A clean verification run uses verify.py without --refresh. The manifest hashes UTF-8/LF text and exact binary bytes, excluding itself. Automatic final CI status is recorded on the Draft PR to avoid a self-referential evidence commit.

Actual synchronization follow-up: `sync.cjs` checks the merged branch at 5354 against pinned dev at 5355 on 375/390/768/1280px. Start `candidate.config.mjs` on 5354 and `sync-baseline.config.mjs` on 5355. The latter reads only the original inquiry view from dev; App.vue/shared CSS are the actual merged files on both servers. This replaces the earlier prospective overlay for current acceptance. `sync-*` artifacts contain fresh focused/shell/build/typecheck results, screenshots, browser bounds and exact V1 parity. All browser API responses remain fixtures. The cabinet legacy footer is deliberately preserved from dev; no shared-shell source changes were made.

Mobile visual review: start `polish-before.config.mjs` on 5360 to render the exact view/CSS from pre-correction HEAD `6395039`; keep candidate/dev baseline on 5354/5355. Run `node docs/ui-v2/evidence/specialist-inquiries-phase1/polish.cjs` for five-width before/after captures, all filters, keyboard and empty/list/detail/sending checks. Run `browser.cjs` for the complete eight-width/state/motion regression matrix. Run `parity.cjs` last for V1 pixel comparison: both sides use the same standard Chromium rendering settings, wait for loaded messages/fonts and completed render frames, then discard an initial raster capture. No masks or pixel tolerances are applied. `polish-*` logs are the latest local test/build/typecheck evidence; older sync/original logs remain historical.
