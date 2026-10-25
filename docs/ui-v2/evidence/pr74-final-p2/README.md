# PR #74 final P2 corrections

Baseline: `4d2983c1fbd59850f699bb7131a55bdf322c38f2`. Two findings from the independent re-review; nothing else changed.

## P2-A — selected view had no visible state

The Day/List (and desktop Week/Day/List) buttons in «Вигляд» exposed `aria-pressed` only; both were quiet transparent buttons, so the selection was invisible without hover.

- **Fix:** `.pc2-cal__views > button[aria-pressed="true"]` uses the existing selected-strip-day treatment (`--pc-navy-900` fill, `--pc-bg-card` text, medium weight).
  - Its specificity (0,3,2) is above `.pc2-cal__btn:hover`, `.pc2-cal__btn--quiet` and `.pc2-cal__btn:disabled`, so the selection stays visible on hover and while the settings are read-only.
- **Keyboard focus:** explicit `:focus-visible` outline with the focus tokens.
- **`aria-pressed`:** unchanged.

## P2-B — the phone Week projection could persist Day

A phone shows a saved `week` as Day. Pressing that already shown Day sent `{"regular_view":"day"}`, which changed the desktop preference.

- **Fix:** `CalendarV2.setView` compares with the displayed (`effectiveView`) view. Pressing the view already on screen is a no-op on every viewport.
- **Persisted value:** never changed by the projection.

| Saved | Phone shows | Pressed | Result |
|---|---|---|---|
| week | Day | Day | no PATCH |
| day | Day | Day | no PATCH |
| list | List | Day | one PATCH `regular_view=day` |
| week | Day | List | one PATCH `regular_view=list` |

Desktop is unchanged except that pressing the already selected view no longer sends a server no-op.

## Changed files

- `src/components/calendar-v2/CalendarV2.vue` — no-op guard in `setView`.
- `src/styles/calendarV2.css` — selected and focus rules for the view buttons.
- `src/components/calendar-v2/ServerCalendarV2.spec.ts` — 10 regression tests.
- `docs/ui-v2/evidence/pr74-final-p2/` — this evidence.

The store (`src/stores/calendarPreferences.ts`, `readGeneration`), the API client, #71/#72/#73 and the backend are untouched.

## Verification

**Regression tests** (`ServerCalendarV2.spec.ts`, «regular view controls (final P2)»):
- the four-row matrix above at 375 and 390, with exact PATCH payloads/counts;
- desktop no-op plus one write;
- the selected/focus CSS rules.

Against the baseline source the new tests fail (6 of 34 in the file); with the fix all pass.

**Checks:**
- Targeted store/root/server suites: 89 passed (34 + 21 + 34).
- Full Vitest (`--maxWorkers=2 --minWorkers=1`): 143 files, 2139 passed.
- `vue-tsc -b --force`: the same 9 baseline diagnostics (AdminWorkQueue, TherapistClients, specialistDiscoveryApi), none in calendar files.
- `npm run build`: PASS (existing chunk-size warning).
- `git diff --check`: PASS.

**Browser (`browser.cjs` → `browser.json`, 10 rows, 0 problems)** — fixtures only: the preferences endpoint is a Playwright route that records every PATCH; this is not backend acceptance. The pointer is moved off the controls before every style read and screenshot.
- 375 and 390, all four matrix rows:
  - only Day/List offered;
  - the shown view is `aria-pressed` with computed `rgb(18, 52, 90)` fill and white text, the other button differs;
  - Tab from «Закрити вигляд» focuses the first view button with a solid outline;
  - PATCHes exactly as in the table;
  - no horizontal overflow, no page errors.
- 1280 desktop:
  - Week/Day/List offered;
  - pressing the selected Week: 0 PATCH;
  - Day: one PATCH `{"regular_view":"day","expected_revision":3}`, then a one-column day grid.
- URL preview (`?mode=actions`): clicking the selected preview tab, Back and Forward: 0 PATCH.

Screenshots: `screenshots/phone-375-saved-week.png`, `phone-375-saved-day.png`, `phone-390-saved-week.png`, `phone-390-saved-day.png`, `desktop-1280-view-menu.png`.

## Gates (unchanged)

PR #74 stays Draft and targets `feat/uc-02-calendar-3a`; its automatic CI does not run for a feature-branch target. Fresh normal CI on a dev-targeting PR, backend #64 billing gate and the deploy order (backend with migration 0098 first) remain.
