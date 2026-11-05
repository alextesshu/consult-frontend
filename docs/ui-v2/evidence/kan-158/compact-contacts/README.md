# KAN-158 post-merge polish: compact external contacts

Base: `origin/dev` `15505c48d7d7260b96f57586344220ee63faf085` (merged PR #79).
Branch/worktree: `feat/kan-158-compact-external-contacts` / `_kan158_compact_contacts`.

## Scope

Explicitly approved compact-list polish. The only runtime file changed is
`src/styles/publicProfileV2.css`; associated CSS contract test and this evidence
are included. Contact component, copy handler/action objects, warning, booking,
flow/sticky observer, header, editor and API contracts remain byte-identical to base.

One tinted parent card contains a compact list with subtle separators. Individual
row backgrounds, rounded borders and large insets are removed. Copy buttons keep
their actual >=44px touch targets. Label/value share the left track when the card
has room; a named container query gives the value a full row below the button on
narrow cards. Full text and natural wrapping remain; no collapsed/hidden contacts
or nested scroll container is introduced.

No snapshot/index/pointer changes. The active canonical snapshot remains
`claude-design-2026-10-23-4ff7cedd`, archive SHA-256
`4ff7cedd41f829306facd154e0a2af189b2e2cce3af3c786b6e4fb913149a347`.
This polish follows the current user-approved compact-list requirements, not a
new design-source import.

## Measured before/after

Same seven synthetic long contacts and same browser/viewport on baseline and
candidate, including long email, Telegram, primary/secondary/Viber/WhatsApp
numbers and 149 characters without spaces. All three booking modes have the same
contact-card heights:

| Width / height | Current dev | Compact card | Reduction |
| --- | ---: | ---: | ---: |
| 375/390 x 812 | 913.5px | 733.5px | 19.7% |
| 768/820 x 900 | 826.8px | 473.3px | 42.8% |
| 1100/1280/1440 x 900 | 891.1px | 557.1px | 37.5% |
| 1280 x 600 | 891.1px | 557.1px | 37.5% |

Two-contact desktop card: **334.4 -> 227.8px**; existing sticky positioning is
preserved in all three modes. The adaptive flow/sticky algorithm itself is unchanged.

[Results](browser.json), [harness](browser.cjs), before/after screenshots in
`screenshots/`. Complete pages:

- [Desktop before](screenshots/before-full-1280.png) / [after](screenshots/after-full-1280.png)
- [Phone before](screenshots/before-full-375.png) / [after](screenshots/after-full-375.png)

## Browser acceptance

Chromium: **24 before/after comparisons PASS** at all seven required widths,
plus 1280x600, for direct-with-slots, direct-without-slots and request_only.

- Every value matches the fixture exactly. Range.getClientRects() measures actual
  line wrapping; all primary/secondary/Viber/WhatsApp numbers remain on one line.
- Value tracks satisfy the prior readability regression guard (>=240px where
  applicable), never a single-character column. Long unbroken values remain full.
- Every copy button's width and height are measured >=44px; hit-testing and exact
  copied value are verified for all 168 candidate buttons after document scrolling.
- Parent card is separate from the booking panel, overflow remains visible and
  scrollHeight/clientHeight show no card-owned scrollbar. No document overflow.
- Candidate rows have zero border radius and transparent backgrounds; the parent
  card remains. Each case is at least 10% shorter than the exact baseline.
- Three short-card checks preserve sticky behavior.
- **UI v1 parity: 21/21 pairs, zero changed pixels** against the same dev baseline.

All APIs are explicitly intercepted fixtures, not real Django E2E. No real request
or external message is created. Nonlocal requests are blocked; data are synthetic.
The clock starts from a fixed date but advances, preserving native Vue events.

## Verification

- Focused: **179 PASS** (170 profile, 8 CSS, 1 external-contact component).
- Production build: **PASS**, existing chunk-size warning only.
- Typecheck: **9 baseline diagnostics, zero new**; full output identical to an
  untouched-base run. Exit 2 is not described as a clean typecheck PASS.
- `git diff --check`: **PASS**.
- Full Vitest: **131 files / 2027 PASS**, 147.15 seconds.
- Automatic CI terminal result is recorded separately in the delivery report.

```powershell
node node_modules/vitest/vitest.mjs run src/styles/publicProfileV2.spec.ts src/components/public-profile/PublicProfileExternalContacts.spec.ts src/views/PublicProfileView.spec.ts
npm run test:run -- --maxWorkers=2 --minWorkers=1
npm run build
node node_modules/vue-tsc/bin/vue-tsc.js -b --force
node docs/ui-v2/evidence/kan-158/compact-contacts/browser.cjs
git diff --check
```

Browser harness expects candidate localhost:5490 and baseline localhost:5491,
both configured with intercepted API localhost:8470/api. Baseline uses a separate
owned detached worktree at the recorded dev SHA. Raw v1 pairs are outside Git in
`%TEMP%/compact-contacts-parity`; computed parity is in browser.json.

No backend, design snapshot, Jira, Ready transition, merge or deployment changes.
