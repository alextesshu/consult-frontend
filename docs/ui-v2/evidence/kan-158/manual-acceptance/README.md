# KAN-158 manual acceptance remediation

Base: `6962e9f5f04a74a7bc7604d56ffe09b0dea8ca2b` (`origin/dev`, 2026-10-27).
Design: scoped overlay `claude-design-2026-10-26-1dbb9008`, archive SHA-256
`1dbb900845f830cc5fb9833d08f97c173f4500b05155faa00e12f723dabe152d`.
The global v6.6 snapshot and overlay payloads are unchanged. Authorization
behavior is explicitly outside this task.

## Findings and minimal fixes

| Issue | Confirmed cause | Correction |
| --- | --- | --- |
| P1 time-label contrast | Pointer/touch hover gives the button a navy background, while scoped `.slot-time` also specifies navy. This is not a persistent selected-slot state. | Inherit the label color; explicit white/navy hover, focus-visible and active states. Preserve the outline and disabled behavior. White on `#12345A`: 12.62:1. No new selection state or booking step. |
| P2 mobile video badge | The 131px absolute badge is positioned over an 88x110px portrait/fallback, extending into the name column. | Below 768px, give the existing video button its own row below the photo, within the media column, with a >=44px target. Desktop/tablet composition and native dialog remain unchanged. |
| P2 blog action | The non-wrapping header shares its minimum width with a long heading/lead. The action shrinks to 41x74px at 375px. | Phone-only wrapping header, full-width heading and separate action row; preserve normal word wrapping and >=44px target. The original label becomes 96x50px. |
| P1 availability discovery | The native sheet focuses its close button and starts at the offer list. Chips are below the fold. In the fixture at 375x667, the first chip starts at y=874; on the actual staging profile it starts at y=1374. | The request sheet can reveal and focus its first available chip, or its existing no-availability request action, using only its own scrollTop. Keep the request header/close control sticky. No document scroll or auto-selection. |

Actual staging reference was inspected read-only at `/s/kendofam?ui=v2`.
All mutation requests were blocked. Public reference screenshots are retained
outside Git in `_preservation/kan158-staging-manual-reference`; no real contact
data is included in this PR. The committed screenshots use synthetic API data.

## Browser evidence

Run from the worktree root with an isolated Vite server and
`VITE_API_BASE_URL=http://127.0.0.1:8470/api`:

```powershell
$env:MANUAL_PHASE='after'
node docs/ui-v2/evidence/kan-158/manual-acceptance/browser.cjs
```

`PLAYWRIGHT_MODULE`, `MANUAL_ORIGIN` and `MANUAL_OUT` can override local tool,
server and evidence locations. No dependency was added to the application.
`before` captures were taken before runtime edits. Blog header captures were
refreshed with the exact baseline stylesheet to center the compressed header
in the viewport. They are CSS baseline evidence, not a second backend run.

| Viewport | Availability, chip states, blog | Video keyboard, close/reopen | Long names / empty / request-only | Document overflow |
| --- | --- | --- | --- | --- |
| 375x667 | PASS | PASS | PASS | None |
| 390x844 | PASS | PASS | PASS | None |
| 820x900 | PASS | PASS | PASS | None |
| 1280x900 | PASS | PASS | PASS | None |

- [Before measurements](before.json), [after assertions](after.json).
- Hero: [before 375](before-hero-375.png), [after 375](after-hero-375.png).
- Availability: [before 375](before-availability-375.png), [after 375](after-availability-375.png).
- Chip: [before 375](before-slot-375.png), [after 375](after-slot-375.png).
- Blog: [before 375](before-blog-375.png), [after 375](after-blog-375.png).
- [UI v1 pixel comparison](v1-parity.json): zero changed pixels at all four widths.
- UI v2 hero screenshots at 820/1280 also remain pixel-identical.
- First chip after opening: y=492 at 375x667; y=668 at 390x844. Both are fully visible.
- One mobile scroll container (the native dialog); page scroll remains unchanged.
- Close is reachable after revealing availability. Escape, focus return and video
  scroll lock remain functional. Footer links/legal text remain above the sticky
  bar; the existing decorative watermark can extend behind it.
- Empty mode never creates chips; request-only makes no slot availability GET.
- A longer localized blog action is tested with normal word wrapping.
- Existing offer keyboard suite: 10 scenarios PASS at 390/1280, including price,
  payload, duration-compatible slots, unavailable offers and request form controls.

## Validation

- Regression-first overlay tests: 2 failures on baseline, both pass after fix.
- Focused profile suite: **196/196 PASS**; final overlay/view recheck **182/182 PASS**.
- Full Vitest: **2035/2035 PASS**, 131 files.
- Production build: PASS; existing >500kB chunk advisory remains.
- Typecheck: 9 identical baseline diagnostics; 0 new diagnostics. Typecheck is
  not green. Existing diagnostics are in discovery/admin/client tests/views.
- `git diff --check`: PASS.

No API, duration/timezone, pricing, permission, auth or backend changes. No
staging/production deployment, real booking/request/email, Jira mutation or merge.
Browser acceptance uses Chromium and synthetic GET/POST interception; this does
not claim real backend booking acceptance. Safari, Firefox, screen-reader and
product-owner visual re-review remain manual gates.
