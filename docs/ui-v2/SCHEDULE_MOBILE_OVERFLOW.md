# Specialist schedule — mobile document overflow

2026-10-24. Base: `origin/dev` **`72ddf20533f60a9dcdb883bccc640e97703bb25c`**, including Cabinet Shell PR #66. Branch: `fix/specialist-schedule-mobile-overflow`. Independent worktree; main local dev, KAN-159 and Claude worktrees were not changed. Target: one Draft PR to dev, **READY FOR REVIEW**, no merge/deployment/Jira change.

## Root cause and minimal correction

Reproduced `/cabinet/slots` before editing at 375px in both versions. The element extending the document was the **seventh `.schedule-toolbar > .day-list.day-list--mobile > button`**, not the calendar's scroll container or the already wrapping toolbar groups.

The existing max-520px rules use `display: grid; grid-template-columns: repeat(7, minmax(0, 1fr))`, `overflow: visible`, and `width: 100%` on the day buttons. At max-380px a later rule switched only the day-list display back to flex. Its inherited `flex-wrap: nowrap` and each button's `flex: 0 0 auto; width: 100%` made seven full-width buttons overflow outside the bounded parent. Min-width was already 0 on buttons; adding wrapping elsewhere would not address this cascade.

| Baseline at 375px | Day-list/button width | Seventh button bounds | Document scrollWidth |
| --- | --- | --- | --- |
| v1 | 313px each | x=1921 to 2234px | 2234px |
| v2 | 281px each | x=1745 to 2026px | 2026px |

**Correction: delete the single `display: flex` declaration in the max-380px `.day-list` rule in SlotsView.vue.** The existing seven-column grid now survives at narrow widths. Gaps, typography, labels, DOM, event handlers, toolbar behavior, calendar overflow:auto and all wider breakpoints remain unchanged. No html/body overflow hiding, API/router/auth/backend/business-logic changes or new dependency.

Design context remains snapshot `claude-design-2026-10-23-4ff7cedd`, archive SHA-256 `4ff7cedd41f829306facd154e0a2af189b2e2cce3af3c786b6e4fb913149a347`. This restores the existing responsive layout; no prototype behavior or shared-shell design was introduced.

## Chromium acceptance

Both **calendar and availability** tabs were tested for each row. The two tab results are identical for document width. [Full matrix with DOM geometry and control outcomes](evidence/schedule-mobile-overflow/matrix.json) contains 40 baseline/candidate cases.

| Viewport | Baseline v1 | Candidate v1 | Baseline v2 | Candidate v2 |
| --- | --- | --- | --- | --- |
| 375 | 2234 | **375** | 2026 | **375** |
| 390 | 390 | **390** | 390 | **390** |
| 640 | 640 | **640** | 640 | **640** |
| 768 | 768 | **768** | 768 | **768** |
| 1280 | 1280 | **1280** | 1280 | **1280** |

Every candidate has document.scrollWidth <= innerWidth, with html/body overflow-x neither hidden nor clip. Previous/next week and Today work; all seven mobile day buttons can be selected; calendar/availability status filters work. The regular-session modal opens/closes. After these interactions document bounds remain valid and no page JavaScript errors occur. The mobile day-calendar representation is visible at <=860px as before.

At 1280px both calendar tabs preserve actual internal scrolling. Calendar mode v1: clientWidth 629 / scrollWidth 700, scrollLeft 71, scrollTop 120. v2: clientWidth 585 / scrollWidth 700, scrollLeft 100, scrollTop 120. Both retain overflow:auto and scrollHeight > clientHeight. No calendar min-width or scroll rule was removed.

**V1 screenshot parity: zero changed pixels** for both tabs at 768px and 1280px, compared with exact baseline using identical fixture/time/font/render settings. [Pixel results](evidence/schedule-mobile-overflow/v1-parity.json).

Review: [v1 before 375](evidence/schedule-mobile-overflow/baseline-v1-calendar-375.png), [v1 after 375](evidence/schedule-mobile-overflow/candidate-v1-calendar-375.png), [v2 before 375](evidence/schedule-mobile-overflow/baseline-v2-calendar-375.png), [v2 after 375](evidence/schedule-mobile-overflow/candidate-v2-calendar-375.png). All candidate width/tab screenshots are retained in the evidence directory.

Browser data are explicit API fixtures, using an empty schedule to keep geometry/parity deterministic; this is layout/control acceptance, not backend scheduling workflow acceptance. Existing SlotsView business tests cover populated events, creation, filters and availability behavior. No backend test was created or changed.

## Verification

- Focused Vitest **96/96 PASS**: 91 existing SlotsView behavior tests plus five CSS-cascade regression cases. The new test catches the exact narrow-width grid/flex override, checks the 380/520px boundaries and retains the wider day scroller/calendar rules. jsdom does not measure layout; real document/element dimensions are asserted separately in Chromium.
- `npm run build`: PASS; existing large-chunk warning remains.
- `npm run typecheck -- --force`: baseline and candidate have **9 identical diagnostics, 0 new**; advisory nonzero exit retained. Baseline was run before editing at exact dev HEAD. [Comparison](evidence/schedule-mobile-overflow/typecheck-comparison.json).
- `git diff --check`, UTF-8, relative links, approved scope and evidence checksums verified before commit. Automatic CI is reported on the Draft PR for the exact pushed SHA, without manual rerun/dispatch.

Exact commands:

```powershell
npm run test:run -- src/views/SlotsView.spec.ts src/views/SlotsView.layout.spec.ts --maxWorkers=1 --minWorkers=1
npm run build
npm run typecheck -- --force
git diff --check
```

Runtime scope: **src/views/SlotsView.vue only, one deletion**. New test: **src/views/SlotsView.layout.spec.ts**. Remaining changes are this report and [evidence/checksum inventory](evidence/schedule-mobile-overflow/manifest.json).

## Reproduction

From this worktree root, start independent previews in separate PowerShell terminals:

```powershell
node node_modules/vite/bin/vite.js --config docs/ui-v2/evidence/schedule-mobile-overflow/candidate.config.mjs --host 127.0.0.1 --port 5384 --strictPort
node node_modules/vite/bin/vite.js --config docs/ui-v2/evidence/schedule-mobile-overflow/baseline.config.mjs --host 127.0.0.1 --port 5385 --strictPort
node docs/ui-v2/evidence/schedule-mobile-overflow/acceptance.cjs
```

The baseline load hook reads only SlotsView.vue from exact dev SHA through git show; other runtime files are unchanged and identical in both servers. No reset or checkout of working files occurs. The harness reuses the existing cabinet-shell fixture helper/installed Playwright module and a fixed 2026-10-22 clock. No dependencies or production configuration were changed. Owned previews are stopped after verification.
