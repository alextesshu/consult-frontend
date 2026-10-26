# KAN-158 consultation-offer keyboard accessibility gate

Base: `e2f4efba927907b9a1b3939d63f9b7c0d07c4c28` (2026-10-26).
Result: **PASS; recommend closing the conditional toggle-button accessibility
gate after review. No runtime defect or runtime change.**

The approved semantics remain native `button` + `aria-pressed`, not radiogroup.
The public profile follows the scoped v6.9.1 overlay
`claude-design-2026-10-26-1dbb9008`, archive SHA-256
`1dbb900845f830cc5fb9833d08f97c173f4500b05155faa00e12f723dabe152d`.
No design snapshot, pricing policy, API, backend, booking or UI v1 code changes.

## Evidence and acceptance

[Executable Chromium regression](browser.cjs), [results](results.json),
[screenshots](screenshots/).

All browser cases use isolated, synthetic intercepted APIs. The advancing clock
avoids jsdom/frozen-clock event artifacts. Desktop is 1280x900, mobile 390x900.

| Requirement | Evidence | Result |
| --- | --- | --- |
| Tab / Shift+Tab order | Real Chromium navigation: standard -> intro -> couple, then reverse | PASS |
| Enter activation | Standard and couple activated with Enter | PASS |
| Space activation | Intro activated with Space; repeated activation preserves the selected choice | PASS |
| Mutual exclusion | Zero initially; exactly one rail button pressed after every choice, including repeated choice | PASS |
| Price and summary | Final CTA summary follows all three offers; mobile bar follows every offer; actual visible bar checked after sheet close | PASS |
| Payload | Six intercepted pending requests across both widths and three booking modes; all canonical offer types covered | PASS |
| Unavailable / disabled | Missing-price intro and disabled couple service absent from accessible/focusable rail and form; submit/edit controls disabled while POST is pending; keyboard cannot dispatch a duplicate | PASS |
| Visible keyboard focus | Real :focus-visible; 2px solid navy outline at both widths | PASS |
| Accessible names | Browser getByRole finds each exact consultation label and public price; unique names | PASS |
| Panel / form / CTA / sticky sync | Selection, reopening and form edits update shared choice, pressed state and summaries | PASS |
| Request open / close | Real keyboard selection repeated after closing and reopening the request form; mobile Escape returns focus to sticky trigger | PASS |
| Modes and overflow | direct with slots, direct without slots, request_only; no document overflow, no page errors; request_only never requests slots | PASS |

Ten browser cases: six width/mode combinations, two form-keyboard cases, two
unavailable-offer cases. Each of the six main cases navigates the offer controls
with real keyboard input, then submits exactly one intercepted request. The
fake response is PENDING, not a confirmed Session. The delayed response also
checks disabled submission controls and absence of duplicate POSTs.

The rail has no separate disabled-offer prop: unavailable offers are omitted.
The tests do not fabricate a production disabled state or add new disabling
rules. Native disabled behavior is exercised on the real pending form controls;
unavailable-offer exclusion is tested independently at both widths.

The two additional form cases open without a choice, select intro using Space,
reopen the offer editor using Enter, then select couple using Enter. Form pressed
state, rail selection and summaries remain synchronized without any submission.

## Added Vitest regressions

- `PublicProfileIdentityRail.spec.ts`: native named/type=button semantics, DOM
  consultation order, sequential controlled pressed state, option emissions and
  omission of unavailable options (two tests).
- `PublicProfileView.spec.ts`: real shared state for all three offers, exactly
  one pressed button, selected price/final summary, repeat activation and no
  premature POST (one test).

jsdom does not perform native Enter/Space activation or real Tab navigation from
`fireEvent.keyDown`. Those behaviors are proved by Chromium, not inferred from
the click/DOM assertions in Vitest. CSS focus visibility is measured in Chromium.

## Validation

- Focused: **179/179 PASS**, two files.
- Full Vitest: **2033/2033 PASS**, 131 files, process exit 0.
- Production build: **PASS**; existing chunk-size warning only.
- Typecheck: exit 2 for both exact dev baseline and candidate; **9 identical
  baseline diagnostics, 0 new**.
- `git diff --check`: **PASS**.
- Runtime/UI v1 preservation: the complete diff contains only tests and this
  evidence directory; existing full-suite UI v1 coverage passes. This task does
  not claim an additional pixel-parity run.

Commands (Windows PowerShell, feature worktree):

```powershell
node node_modules/vitest/vitest.mjs run src/components/public-profile/PublicProfileIdentityRail.spec.ts src/views/PublicProfileView.spec.ts
npm run test:run -- --maxWorkers=2 --minWorkers=1
npm run build
node node_modules/vue-tsc/bin/vue-tsc.js -b --force
git diff --check
```

For browser reproduction, run a separately owned Vite preview with the explicit
fixture origin; do not reuse the user's server on 5173:

```powershell
$env:VITE_API_BASE_URL = 'http://localhost:8470/api'
node node_modules/vite/bin/vite.js --host localhost --port 5520 --strictPort
```

In another PowerShell from the feature worktree, use an already installed
Playwright package (no new project dependencies):

```powershell
$env:PLAYWRIGHT_MODULE = '<absolute path to existing playwright-core>'
$env:OFFER_PORT = '5520'
$env:OFFER_EVIDENCE = Join-Path $env:TEMP 'kan158-offer-keyboard'
node docs/ui-v2/evidence/kan-158/offer-keyboard/browser.cjs
```

Port 8470 is intercepted, not a live backend. External origins are blocked.
Anonymous refresh POSTs receive synthetic 401 responses. The harness exits
nonzero on failed assertions and writes artifacts outside the repository.

## Limits

No real backend booking or request was created. Browser role/name, keyboard and
focus checks do not certify manual screen-reader output or other browser engines.
No runtime remediation is necessary for the tested approved toggle semantics.
No merge, Ready transition, deployment, Jira or design activation is authorized
by this evidence.
