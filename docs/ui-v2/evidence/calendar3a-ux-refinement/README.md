# Calendar 3a UX refinement

Base: `9ad66b27facb2892d8e999a2ae48573df18ac132`.
Design authority remains `claude-design-2026-10-23-4ff7cedd`, v6.6/v6.7,
SHA-256 `4ff7cedd41f829306facd154e0a2af189b2e2cce3af3c786b6e4fb913149a347`.
This is a narrowly authorized presentation correction, not a new calendar design.

## Attention helper

The tab badge is global: complete upcoming-session, reschedule and guest-request
sets are split into the selected week and other dates/undated requests. That
logic and the individual actions, counts, routes, retries and partial-source
semantics are unchanged. The helper now describes the actions users can take.
It explains the global scope only when there actually are actions outside the
week; arithmetic and implementation/notes-counter caveats are removed.

## Short events

Previously every grid event had a 26px minimum, while the same two-line
content/padding/badge layout needed more space. A pending 30-minute event at
16:00 could clip; adjacent 15-minute entries could visually overlap because an
hour can be only 52px. Grid event boxes now keep their exact segment duration.
The existing availability-window minimum and lane assignment are unchanged.

- Below 34px: one line with start time and compact status, e.g. `16:00 Очікує`.
- Below 50px: the same line plus a client-name line with explicit ellipsis.
- Larger entries and the mobile agenda keep their existing composition.

Full time range, client name, status and action reasons remain in the accessible
name; dense entries also have a native title. Session links still open the
existing details route. No session times, DTOs, API calls, permissions, booking
rules or authentication/cache behavior change. Availability mode still conceals
client identity. The very small desktop targets retain keyboard focus and access
to details; mobile uses the existing unconstrained agenda cards.

## Local verification

Windows Chromium 145.0.7632.6, 1280/1440/375/390px: four browser fixture cases PASS.
These are real calendar components in a local component harness with synthetic
records, not authenticated staging or complete cabinet screenshots. The sidebar
and details panel are fixtures; actual session hrefs and keyboard navigation are
checked. No API, staging, business data or external notification requests run.

The matrix includes pending 15/30/45/60-minute sessions, confirmed/cancelled
variants, long names, adjacent entries, 00:00/23:45 boundaries, scroll-to-event,
focus outline, Enter navigation and document overflow. At the dense 52px/hour
scale, event heights are 13/26/39/52px respectively; adjacent bounds do not overlap.
Vitest additionally checks a 30-minute session split at midnight into 13px segments.

Screenshots compare the same fixtures and viewport on the unchanged base and
candidate. `before/after-workday-1280.png` show short grid entries;
`before/after-actions-1280.png` show the helper. Corresponding `375` images show
the mobile agenda and responsive helper. Other screenshots and raw measurements
are preserved locally outside Git under
`_preservation/calendar3a-ux-refinement-20261108`.
The initial harness had an incorrect mobile prop binding; corrected baseline
evidence is used here. No application defect was inferred from that harness error.

Commands actually run:

```powershell
npm run test:run -- src/components/calendar-v2 src/composables/useCalendarActions.spec.ts src/composables/useCalendarFeed.spec.ts src/lib/calendarActions.spec.ts src/lib/calendarGridScale.spec.ts
npm run build
npm run typecheck -- --force
git diff --check
```

- Focused calendar/security set: **139 PASS**.
- Production build: **PASS**, existing large-chunk warning.
- Typecheck: same **9 baseline diagnostics** on base and candidate, **0 new**;
  command remains nonzero. No diagnostics are suppressed.
- No lint script, ESLint or Stylelint is configured/installed; separate lint is
  **NOT AVAILABLE**. No dependency or tooling configuration was added.
- `git diff --check`: **PASS**.

Real authenticated staging and physical-device acceptance remain pending after
a separately approved merge/deployment. UI v1 remains default and its routes,
activation flags and implementation are unchanged. No backend or deployment work
is included.
