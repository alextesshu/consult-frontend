# UC-01 — Unified calendar, read-only MVP (UI v2)

`/cabinet/sessions?ui=v2` shows one calendar of sessions, free public windows, guest time requests, absences and (optional) external guest sessions.

- **Views:** Week / Day / List.
- **Visibility:** layers, presets, legend, hidden-item indicator, conservative conflict warnings.
- **States:** loading, empty, error/retry, partial-source warning.
- **Phones:** Day/List with a date strip and a bottom-sheet for layers.

**Read-only:** no create, reschedule, confirm, cancel, Undo, drag-and-drop or board. A session opens its existing `/cabinet/sessions/:id` page; other items open a read-only details dialog with a navigation link to their existing management page.

Base: `origin/dev` 3085c1c. Branch `feat/uc-01-calendar-readonly`. Backend unchanged.

## Architecture

| Module | Role |
|---|---|
| `src/lib/calendarItems.ts` | `CalendarItem` model and pure normalization. See the rules below. |
| `src/lib/calendarTime.ts` | Specialist-timezone helpers on `Intl`: wall-clock parts, DST-aware local midnight → UTC, real day bounds (25.10.2026 = 25 h, 29.03.2026 = 23 h), UTC query padding. |
| `src/lib/calendarPreferencesSource.ts` | `CalendarPreferencesSource` interface for UC-00 and an in-memory implementation with the UC-00 rules. See «Preferences». |
| `src/composables/useCalendarFeed.ts` | `Promise.allSettled` over the five sources. See the behavior below. |
| `src/components/calendar-v2/` | `CalendarV2` (toolbar, presets, layers dialog/sheet, hidden banner, states, legend, read-only details), `CalendarTimeGrid` (week/desktop day: wall-clock placement, overlap lanes, absence bands, now line), `CalendarAgenda` (list and phone day), `CalendarEventChip`. |
| `src/styles/calendarV2.css` | `html[data-ui="v2"]`-gated, v2 tokens only. |
| `src/views/SpecialistSessionsEntryView.vue` + `src/router/index.ts` | `/cabinet/sessions` renders `CalendarV2` in UI v2 and the unchanged `TherapistSessionsView` in UI v1. Same path; detail route unchanged. |

`calendarItems.ts` normalization rules:
- **Sources:** `/cabinet/schedule/`, `/booking/sessions/`, `/cabinet/sessions/reschedule-requests/`, `/cabinet/availability-exceptions/`, `/cabinet/external-sessions/`.
- **Stable keys:**
  - `session:{Session.id}`;
  - `free_slot:{Slot.id}`;
  - `guest_request:slot-{Slot.id}` — the backend groups pending requests per slot; request ids are kept and never turned into sessions;
  - `absence:{id}`;
  - `external_guest_session:{id}`.
- **Session deduplication:** a Session in both APIs becomes one item; the `/booking/sessions/` row wins and the schedule adds `client_kind`.
- **Statuses:**
  - cancelled, completed and past sessions go to the `past` layer;
  - `NO_SHOW` is shown as «Не підтверджено вчасно» (it is set by the reconcile job, not proof that the client did not come).
- **Conflict warnings (display only):**
  - external guest overlap;
  - free slot during an absence (still bookable);
  - session during an absence;
  - session overlap.

`useCalendarFeed` behavior:
- Requests use UTC dates padded by one day, because the APIs filter by UTC day; items are then clipped to the local range.
- Stale responses are discarded; a range is shown from memory while it refreshes.
- Loads of the same range within 5 s share one request set. This absorbs the existing cabinet-shell remount after `/me/`; «Повторити» always refetches.
- Partial failures name the failed sources; both core sources failing shows the error state.

Hidden layers only hide items: the feed keeps them, hidden actionable items are counted in a «Приховано» banner with «Показати», and the layer button gets a dot.

## Preferences (UC-00 dependency)

UC-00 (backend #64, frontend #71) is not merged or deployed, so the calendar does not call `/cabinet/settings/calendar/`.

**Current behavior:**
- `createLocalCalendarPreferences()` uses the documented UC-00 defaults and rules:
  - presets set their layer collections;
  - `needs_action` switches to the list;
  - an individual layer change makes the preset `custom`;
  - at least one layer stays visible.
- The values live in memory only (no localStorage).
- The UI says they apply to this tab only and are not synced. It also names the timezone used: `Europe/Kyiv`, the documented backend default.
- The cabinet profile API does not expose the specialist timezone. UC-00 does, read-only from the profile.

**After #64/#71 are merged and deployed:** a server-backed `CalendarPreferencesSource` (`synced: true`, `timezoneSource: 'server'`) replaces the local one. The calendar components do not change.

## Verification

### Vitest
- **Calendar suites:**
  - `calendarTime` 7, `calendarItems` 11, `calendarPreferencesSource` 4, `useCalendarFeed` 6, `CalendarV2` 10, entry view 2;
  - all pass, three consecutive runs stable.
- **Regression set:**
  - existing `TherapistSessionsView`, `SpecialistSessionsFlow`, router, `app.spec` (cabinet shell) and the calendar suites: 235 passed before the final dedupe change;
  - the final full-suite result is in the PR.
- **Component coverage:**
  - desktop Week/Day/List and date navigation;
  - presets, including «Потребує дії» → List;
  - layer toggling and the last-layer guard;
  - hidden banner and «Показати»;
  - read-only details with focus return and Escape;
  - no mutation buttons, no POST/PATCH;
  - loading/error/retry/empty;
  - partial source failure;
  - phones: Day default, Day/List only, date strip.

### Browser matrix (`acceptance.cjs` → `acceptance.json`, Chromium, browser fixtures)
Widths: 375 / 390 / 768 / 1024 / 1280 / 1440. Result: **0 problems**.

Every width:
- no horizontal overflow;
- no page errors;
- events rendered;
- **zero non-GET API requests**.

Per width:
- **Desktop:** week grid default.
- **Phones:**
  - Day default, no week grid, 7-day strip;
  - all calendar controls ≥ 44 px.

Interactions:
- at 1440: Day, List, «Потребує дії», details dialog;
- at 375: strip day select and List;
- at 1440 and 375: layers dialog/sheet and hidden banner.

Also checked:
- UI v1 `/cabinet/sessions` still shows the existing «Сесії» page;
- a session link reaches `/cabinet/sessions/6`.

The fixture week is 19–25.10.2026 and includes:
- the DST change;
- every session status;
- a guest client;
- grouped guest requests;
- free windows, one of them during an absence;
- an external guest session overlapping a session;
- a pending reschedule request.

### Unchanged pages (`parity.cjs` + `compare.py` → `parity.json`)
UI v1 `/cabinet/sessions`, `/cabinet`, `/cabinet/slots` and UI v2 `/cabinet`, `/cabinet/slots`, at 375 and 1280, against `origin/dev` 3085c1c: **10/10 pixel-identical**.

Every capture waited for the page heading, fonts, network idle, finished animations and a stable height; there was no fixed delay after a cold start. Full-page PNGs are kept outside the repository; `pairs.json` lists them.

### Real-backend smoke (`real-backend-smoke.cjs` → `real-backend-smoke.json`, `screenshots/real-backend-1440-week.png`)
Setup:
- **Backend:** an unmodified `origin/dev` 9f11568 backend in a temporary worktree, on loopback.
- **Database:** a disposable local database, seeded through the ORM, relative to the current time on 25.10.2026 (the DST day):
  - a confirmed session;
  - a completed session without a note;
  - a free slot at 03:00 EET, right after the change;
  - an absence;
  - an overlapping external guest session.
- **Login:** the real login flow with locally generated test credentials, never printed or committed.

Result:
- 3 events, correct wall-clock times across DST;
- the external layer toggles;
- 2 conflict warnings;
- every calendar source requested exactly once;
- **zero writes**, zero page errors.

Afterwards the database, credentials and worktree were removed.

## Limitations and backend dependencies

- **Preferences sync and server timezone** need UC-00 (#64, #71) merged and deployed. Until then preferences are per tab and the timezone is `Europe/Kyiv`.
- **Payment state:** the session list has no unpaid indicator distinct from not-applicable. «Потребує дії» therefore uses only:
  - awaiting confirmation;
  - pending reschedule request;
  - pending guest request;
  - completed without a note (`has_note === false`).
- **Unbounded lists:** absences and external guest sessions are fetched in full (no date filter on the backend) and clipped on the client.
- **Not shown in the grid:**
  - slot-less guest requests (no time);
  - group events.
- **The repeated hour of a DST change** (03:00–04:00 on 25.10) is laid out by wall clock; two items an hour apart in real time can sit side by side. The printed times stay exact.
- **No mutations by design:** quick create, context actions, drag-and-drop and Undo are later UC tasks.
