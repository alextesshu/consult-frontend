# PR #79 — long-contact layout regression

Reviewed baseline: `11d12cce6a245172f998b88eb375a501840fac98`.
Same branch/worktree: `feat/kan-158-responsive-contacts` / `_kan158_phase2_responsive`.
This supplements the original PR C evidence; no active design pointer changes.

## Reproduction and root cause

Read-only inspection of the supplied local URL found the same row failure:
the additional-phone value had a 0px content track and approximately 291px text
height. No actual contact values or screenshots from that local account are
published here. Local localhost:5173 reported marker `965f5e72` and still placed
contacts inside the booking panel. It therefore was not the PR #79 DOM/layout.
That parent's scrollbar must not be mistaken for a new card-owned scrollbar.

Independently reproduced against the exact PR #79 HEAD using seven synthetic
contacts, including long email, Telegram, primary/secondary phone, Viber,
WhatsApp, and a 149-character unbroken value. The three-column row allocated
auto-width tracks to the label and copy affordance, leaving insufficient width
for the middle value. At 1280px: secondary phone 94.17px / two lines;
unbroken Messenger value 110.84px / nine lines. A larger contact set also
outgrew the sticky rail's viewport budget.

[before.json](before.json) records the same geometry checks on the clean baseline:
24 width/mode/height cases, **171 failed layout assertions** in total. Baseline
source is an owned detached worktree; no runtime edits there.

## Fix and invariants

- Each row is a semantic list item with separate label, full-width value and
  an actual copy button. Label and button share the first row; value spans both
  grid columns below them. No track can compress a phone to one character.
- Long unbroken text wraps naturally; no truncation, ellipsis, normalization,
  or altered copy payload. Existing external action URLs and handlers remain.
- Card has natural height, visible overflow and no inner scroll container.
- If a desktop card consumes more than half the usable viewport, the rail
  becomes static document flow, reserving usable space for booking rather than
  collapsing the panel. Short cards retain the existing sticky presentation.
- ResizeObserver and resize listener keep this presentation in sync; both are
  cleaned up on unmount. Tablet/phone and v1 retain their respective layout rules.
- Card stays outside the booking panel; booking scroll, payload, visibility,
  permissions, offer selection and the 160-character editor are unchanged.

## Actual browser geometry regression

[Harness](browser.cjs), [after.json](after.json), [normal-flow.json](normal-flow.json).
Chromium: 375, 390, 768, 820, 1100, 1280, 1440px, plus 1280x600;
direct-with-slots, direct-without-slots and request_only.

All **24 long-contact cases PASS**:

- Value text unchanged, measured content width **>=261px** across this matrix.
- All primary/secondary/Viber/WhatsApp numbers occupy exactly **one text line**,
  measured using Range.getClientRects(), not just DOM presence.
- Long email/unbroken text uses readable multi-line runs; all 168 copy-button
  clicks pass bounds/hit-testing and copy the exact expected synthetic value.
- Buttons are reached by normal document scrolling, centered clear of fixed
  header/phone CTA. Copy toast is dismissed through its UI between clicks.
- No document overflow; no card scrollHeight/clientHeight overflow; card CSS
  overflow remains visible; card is outside the booking panel in every case.
- Long cards use document flow even in low desktop viewport; no private API writes.

At 1280px after: every value track is **334px**; secondary phone one line,
Telegram one line, unbroken Messenger three lines. Card natural height includes
seven full contacts; it is not constrained to fit a single viewport.

UI v1 long-contact parity: **21/21 pairs, zero changed pixels** against PR #79
baseline. Existing PR C flow acceptance was also rerun with the new actual copy
button: **30 responsive + 30 interactions + 3 short-desktop PASS**, plus another
**30/30 v1 pairs at zero changed pixels**. Raw regular-flow screenshots stay in
the owned temporary output; previous committed PR C screenshots remain intact.

All API responses are isolated fixtures. No real specialist request, account
mutation, external message, staging or production operation occurred. The local
account diagnostic was read-only and recorded only labels/lengths/geometry.

## Validation

- Focused Vitest: **178 PASS** (170 profile, 7 CSS, 1 new contact component).
- Full Vitest: **131 files / 2026 PASS**, 145.66 seconds.
- Build: **PASS**, existing chunk-size warning only.
- Typecheck: **9 baseline diagnostics, zero new**, complete output identical to
  the pre-fix baseline; exit 2 is not represented as a clean PASS.
- `git diff --check`: **PASS**.

```powershell
node node_modules/vitest/vitest.mjs run src/views/PublicProfileView.spec.ts src/styles/publicProfileV2.spec.ts src/components/public-profile/PublicProfileExternalContacts.spec.ts
npm run test:run -- --maxWorkers=2 --minWorkers=1
npm run build
node node_modules/vue-tsc/bin/vue-tsc.js -b --force
```

Harness uses candidate localhost:5480 and baseline localhost:5481, with intercepted
API localhost:8470. Set `CONTACT_LAYOUT_PHASE=before` for baseline measurement,
`after` for enforced geometry/copy/parity checks. Existing PR C harness now supports
`PRC_CANDIDATE_PORT`, `PRC_BASELINE_PORT`, `PRC_EVIDENCE_OUT` for isolated reruns.

After screenshots: `screenshots/after-*.png`; complete synthetic pages:

- [Desktop direct](screenshots/after-full-direct-1280-900.png)
- [Desktop request_only](screenshots/after-full-request-1280-900.png)
- [Phone](screenshots/after-full-direct-375-812.png)

No new PR, Ready transition, merge, deployment, backend or Jira changes.
