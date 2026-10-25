# UC-02 — Unified calendar 3a (UI v2)

Calendar 3a over the UC-01 read-only calendar: next-action card, «Вигляд» menu instead of «Шари», three modes («Робочий день» / «Доступність» / «Потребує дії») and the new week grid. Sources: `handoff/CALENDAR_3A_SPEC.md`, `handoff/PROMPT_CALENDAR_3A.md`, `Calendar-UX.dc.html` #3a, `Cabinet-Dashboard.dc.html`, `DESIGN_SYSTEM.md`.

Base: `feat/uc-01-calendar-readonly` 02516d3 (PR #72). Branch `feat/uc-02-calendar-3a`. Backend unchanged, UI v1 unchanged, no new API, no mutations: every action button only navigates to an existing page.

## What changed

| Module | Role |
|---|---|
| `src/lib/calendarModes.ts` | Modes, labels, spec descriptions, layer sets per mode, deviation list, `?mode=` parsing (`actions` alias). |
| `src/lib/calendarWindows.ts` | Groups free slots into windows. See «Windows». |
| `src/lib/calendarActions.ts` | Global action list, week split, next-action card choice, relative time. See «Actions». |
| `src/composables/useCalendarActions.ts` | `Promise.allSettled` over three existing GETs; `complete` only when all three loaded. |
| `src/lib/calendarItems.ts` | Spec §6 text markers (`? Підтвердити`, `! Посилання`, `⇄ Перенесення`, `Запит`, `✎ Нотатки`, `Не підтв. вчасно`, `Зовнішня`, `Скасовано`, `Відсутність`); `missingLink` for future confirmed online sessions with `meeting_link_ready === false`; layer labels «Вільні слоти», «Запити». |
| `src/lib/calendarPreferencesSource.ts` | Adds `mode` / `setMode`. Still the temporary in-memory fallback. See «Preferences». |
| `src/components/calendar-v2/CalendarV2.vue` | 3a root: card, date navigation, «Вигляд ▾», mode tablist (roving tabindex, arrows/Home/End), description, deviation chips, aria-live, mobile header with ≡, date strip, panel per mode, read-only details. |
| `CalendarNextAction.vue` | Card states: loading / action / next session today / quiet «Сьогодні сесій немає» / none. |
| `CalendarViewMenu.vue` | Popover under its trigger (desktop) or bottom sheet (phone): fixed header with the title and «Закрити вигляд» (44 px on phones), a body that scrolls on its own while the page behind is locked, safe-area padding; layer checkboxes with counts for the selected period and a «змінено» tag, «Скинути до режиму», marker legend, Esc and focus return. |
| `CalendarActionsList.vue` | «Цей тиждень» / «Поза цим тижнем» groups, counter explanation, retry. |
| `CalendarTimeGrid.vue`, `CalendarEventChip.vue`, `CalendarAgenda.vue` | 3a grid: day summaries, adaptive visible hours with «Показати всю добу», window blocks, external overlay, muted «Зайнято» in availability, tablet weekend column, phone day agenda. |
| `src/styles/calendarV2.css` | `html[data-ui="v2"]`-gated; v2 tokens plus the spec values (radius 20, hour 52 px, now line `#d9822b`, today header `#eef2f8`). |

### Modes

- **Робочий день:** sessions and requests at full strength; free time only as «N вільні вікна» in day headers. No single free slots in the grid.
- **Доступність:** free windows are the main blocks («09:00–12:50 · 4 слоти»); sessions muted to «Зайнято» without names; a window opens a read-only dialog with its slots and a link to `/cabinet/slots?tab=availability`.
- **Потребує дії:** compact list. The tab badge is the global count, shown only when all three sources loaded.

### Windows

Two slots join when all of these hold:
- the next one starts at most 15 minutes after the previous ends (covers the 10-minute buffer);
- nothing busy (session, request, absence, external session) lies in the gap;
- both are on the same local day.

Gaps and busy periods split windows.

### Actions

One action per reason, all from complete sources:

| Kind | Source |
|---|---|
| confirm | `SCHEDULED` in `GET /booking/sessions/?upcoming=true` |
| missing_link | `CONFIRMED` online session with `meeting_link_ready === false` (same GET) |
| reschedule | pending item in `/cabinet/sessions/reschedule-requests/` |
| request | `PENDING` item in `/cabinet/guest-booking-requests/` |

Counts and links:
- The selected-week and outside-week groups always add up to the badge.
- Links go to `/cabinet/sessions/{id}` or `/cabinet/external-sessions#guest-requests`.
- Past sessions without notes keep the «✎ Нотатки» marker in the grid but are **not** counted (see backend gates).

Next-action card priority (always across all weeks, never limited to the week on screen):
1. The nearest future dated action — «Найближча з усіх дій · …».
2. Otherwise the nearest session: today → «Наступна сесія · …»; later → quiet card.
3. Otherwise none.

When the card's item lies outside the selected week, the card adds «поза вибраним тижнем». On phones the card is one column: the full name and reason stay readable and the button (44 px) sits under them.

### Visible hours and time zone

- **Visible hours:** 09–18 by default, widened to the week's events (all-day absences excluded). The bar «Показано HH:00–HH:00 — поза цим часом подій немає» has a «Показати всю добу» toggle.
- **Grid scale** (`src/lib/calendarGridScale.ts`):
  - at least 4 visible hours around the events: the missing hours are split before and after, inside 00:00–24:00; an empty week shows 09:00–18:00;
  - 52–80 px per hour: the grid fills the height cap `min(70vh, 720px)` when that stays within the band, otherwise hours stay at 52 px and the timeline scrolls;
  - events and availability windows keep their true position and duration (a 50-minute session is 67 px at 80 px/h); a very short event gets 26 px but never spills past the grid body;
  - dashed half-hour lines from 64 px per hour.
- **Scrolling:** the timeline scroller has no `overscroll-behavior`, so wheel and touch scrolling chain to the page when the timeline fits or is at its first/last position; the grid body clips its own lines (`overflow: clip`) so a fitting timeline never overflows by 1 px. No wheel or touch handlers.
- **Empty days:** a day with nothing visible is labelled by what was loaded for it, not by what is visible:

  | Day | Label |
  |---|---|
  | busy time (session, request, absence, external) and no free slots, «Доступність» | «Немає вільних слотів · є зайняті події» |
  | busy time hidden by «Вигляд» layers | «Є зайняті події — приховані у «Вигляді»» |
  | only free time hidden («Робочий день») | «Сесій немає · є вільний час» |
  | nothing busy, no slots (cancelled / «не підтверджено вчасно» sessions are not busy) | «Порожній день» |

  The same rule applies to the tablet weekend column and the phone day.
- **Time zone:** `Europe/Kyiv` until UC-00, because the profile API has no time zone. DST (25.10.2026, 25-hour day) is covered by UC-01 helpers and tests.

## Preferences and UC-00 compatibility

UC-00 (backend #64, frontend #71) is still Draft. The calendar does not call `/cabinet/settings/calendar/`.

**Current behavior:**
- `createLocalCalendarPreferences()` is a clearly marked **temporary in-memory** fallback.
- No new `localStorage`.
- The mode survives only in the tab and in `?mode=`. The UI says so: «Тимчасово: режим і вигляд діють лише в цій вкладці…».

**Mapping to the UC-00 contract:**

| 3a mode | UC-00 `preset` | Layers |
|---|---|---|
| Робочий день | `workday` | UC-00 `workday` layer set |
| Доступність | `availability` | UC-00 `availability` layer set |
| Потребує дії | `needs_action` | UC-00 `needs_action` layer set (view `list`) |
| — | `all`, `custom` | shown as mode «Робочий день» with deviation chips |

**Contract gap:**
- Under UC-00 rules, a single layer change turns `preset` into `custom` and loses which mode it deviated from.
- 3a needs that base mode for the «змінено» tags, chips and «Скинути до режиму».
- The fallback keeps `mode` separately.
- UC-00 needs either a `mode` / `base_preset` field or a rule keeping the preset label with a deviation flag.
- The 3a default mode is `workday`; the UC-00 backend default is `all`.

## Backend gates

1. **Notes-missing global count:** the notes-reminder API is paginated without a total, so «✎ Нотатки» cannot join the global badge.
2. **UC-00 deploy:** server-side mode and layer sync, plus the `mode`/`base_preset` contract adjustment above.
3. **Specialist time zone:** the profile API has no time zone field yet.

## Follow-ups (not in this PR)

- Navigation badge «Календар N+M» and the dashboard link «Усі в календарі →» both need `App.vue` / `CabinetView` changes outside the calendar.
- Inline confirm / add link from the card (spec) stays out: this iteration has no mutations.

## Evidence

All data are **browser fixtures** (Playwright routes shaped like the existing endpoints, fake auth). This is not backend acceptance.

**Fixture time:**
- `NOW` = Thu 22.10.2026 16:50 Kyiv; the week ends with the DST change.
- A timed fixture absence covers 00:00–02:00 on 22 Oct, so the visible range is 00:00–19:00. This is correct behavior for that data.

**Acceptance — `acceptance.cjs` → `acceptance.json`: 21 rows, 0 problems.**

Matrix:
- 375 / 390 / 440 / 768 / 1280 / 1440 × three modes;
- «Вигляд» menu at 1440 (popover) and 375 (bottom sheet).

Checks:
- no horizontal overflow;
- no page errors;
- no non-GET requests;
- touch targets ≥ 44 px on phones;
- tablet weekend column at 768 and no folded weekend at ≥ 1280;
- windows in availability with no names;
- no single windows in workday;
- badge 6 and groups «Цей тиждень 4 дії | Поза цим тижнем 2 дії»;
- Esc returns focus to «Вигляд»;
- deviation chip «+ зовнішні гостьові»;
- UI v1 `/cabinet/sessions` still renders «Сесії» without the calendar.

Screenshots: `screenshots/v2-{375,390,440,768,1280,1440}-{workday,availability,actions}.png`, `v2-{1440,375}-view-menu.png`, `v2-{1440,375}-deviation-chip.png`.

**Parity — `parity.cjs` + `compare.py` → `parity.json`: 10/10 pixel-identical.**
- Compared against `origin/dev` 3085c1c: v1 `/cabinet/sessions`, `/cabinet`, `/cabinet/slots` and v2 `/cabinet`, `/cabinet/slots` at 375 and 1280.
- The first run had one font-antialiasing diff spread over all text of v1 `/cabinet` 375; the rerun was exact.
- PNGs are not committed.

**Review corrections — `corrections.cjs` → `corrections.json`: 16 rows, 0 problems.**
- Grid height at 1440 / 1280 / 768 for 1, 5 and 12 hours of events and the full day: no inner scroll for short ranges, at least 300 px, the full day has 25 hour labels and scrolls; no event is hidden. (Re-run with the final scale below.)
- Empty labels in «Доступність»: Wed 21 (completed session, no slots) → «Немає вільних слотів · є зайняті події»; Mon 19 (only a cancelled session) → «Порожній день»; Fri 23 → no label.
- Next-action card at 1440 / 768 / 390 / 375: «Найближча з усіх дій · …», «поза вибраним тижнем» on the next week, the name is not truncated, the phone button is 44 px tall.
- Phone sheet at 375×600 and 390×844: header and 44×44 close visible, the sheet body scrolls (375×600) while the page does not, page scroll lock set and released, Esc and «Закрити вигляд» return focus to «Вигляд календаря», no horizontal overflow.
- No non-GET requests.
- Screenshots: `screenshots/corr-1440-grid-{1h,5h,12h,fullday}.png`, `corr-1440-availability-empty-labels.png`, `corr-{1440,768,390,375}-next-action.png`, `corr-{375x600,390x844}-view-sheet.png`.

**Real-backend smoke — `real-backend-smoke.cjs` → `real-backend-smoke.json`: 0 problems.**

Setup:
- **Backend:** an unmodified `origin/dev` 9f11568 backend in a temporary worktree, on loopback.
- **Database:** a disposable local database, seeded through the ORM on 25.10.2026 (Sunday, the DST day):
  - a completed session on Friday 23 — the only item of the current week;
  - next week: a confirmed online session without a meeting link, three adjacent free slots, a session waiting for confirmation, a timed absence.
- **Login:** the real login flow with locally generated test credentials, never printed or committed.

Result:
- the current week (one completed 50-minute session) shows 10:00–14:00 at 80 px/h: a 320 px grid without inner scroll;
- a real mouse wheel over that timeline scrolls the page by 240 px and leaves the timeline at `scrollTop` 0;
- in «Доступність» Friday reads «Немає вільних слотів · є зайняті події», the other days «Порожній день»;
- the card shows the next week's missing link with «поза вибраним тижнем»; the badge is 2;
- next week: one window «12:00–14:50, 3 слоти» and two sessions muted to «Зайнято»; a 7-hour range (09:00–16:00) at 80 px/h = 560 px;
- only GET requests to calendar sources (plus the existing token refresh); zero page errors.

Afterwards the database, credentials and worktree were removed.

Screenshots: `screenshots/real-backend-1440-{workday-sparse,availability-empty,next-week}.png`.

**Final UX — `final-ux.cjs` → `final-ux-before.json` (7ebc16b) and `final-ux-after.json`: 0 writes, 0 page errors.**

The same script ran against the previous HEAD (7ebc16b, served from a temporary worktree) and the final code. Grid at 1440 × 900:

| Week | Before: range · px/h · grid | After: range · px/h · grid | 50-min event before → after |
|---|---|---|---|
| empty | 09–18 · 70 · 630 | 09–18 · 70 · 630 | — |
| one 50-min session | 10–11 · 630 · 630 | 09–13 · 80 · 320 | 525 → 67 px |
| two sessions 6 h apart | 09–16 · 90 · 630 | 09–16 · 80 · 560 | 75 → 67 px |
| 5 hours | 09–14 · 126 · 630 | 09–14 · 80 · 400 | 105 → 67 px |
| 12 hours | 07–19 · 52.5 · 630 | 07–19 · 52.5 · 630 | 44 → 44 px |
| early + late (06:00, 21:00) | 06–22 · 52 · 832, scrolls | same | 43 → 43 px |
| 3 overlapping | 10–12 · 315 · 630 | 09–13 · 80 · 320, 2 lanes | 263 → 67 px |
| sparse «Доступність» (session + 14:00–15:50 window) | 10–16 · 105 · 630, window 193 px | 10–16 · 80 · 480, window 147 px | — |
| full day | 00–24 · 52 · 1248, scrolls | same | — |

Real mouse wheel (`page.mouse.wheel`, 240 px) at 1440 and 1280. Pointer over an empty cell, a session, an availability window, near the top and near the bottom edge; `window.scrollY` and timeline `scrollTop` measured:

| Case | Before | After |
|---|---|---|
| sparse timeline fits, wheel down from the page top | timeline took it (scrollTop +1, 1 px overflow) or page moved, depending on point | page scrolls (+119 / +150 px), scrollTop 0 — 10/10 |
| sparse timeline fits, wheel up from the page end | nothing moved — 10/10 | page scrolls up, scrollTop 0 — 10/10 |
| dense timeline, middle | timeline scrolls, page still | timeline scrolls (+179), page still — 10/10 |
| dense timeline at its bottom, wheel down | nothing moved — 10/10 | page scrolls — 10/10 |
| dense timeline at its top, wheel up | nothing moved — 8/8 | page scrolls up — 8/8 |

Touch (real `touchStart → touchMove → touchEnd` drag over the calendar): page scrolls at 375 / 390 / 440 (+201…209 px), also after closing the «Вигляд» sheet (`html` overflow restored to `''`). At 768 the drag over the grid moved the page 0 px before and 206 px after. Keyboard: focusing the last event of a dense week keeps it inside the timeline; End scrolls the page (+330 px).

Screenshots: `screenshots/final-1440-grid-{empty,one50,twoApart,five,twelve,earlyLate,overlap,fullday,sparse-availability}.png`, `final-1440-dense-after-wheel.png`.

**Recording:** a 1440 recording of mode switching and the popover was captured locally and is not committed.

## Tests

- **New:** `calendarModes.spec.ts` (3), `calendarWindows.spec.ts` (6), `calendarActions.spec.ts` (5), `calendarGridScale.spec.ts` (5), `useCalendarActions.spec.ts` (2).
- **Rewritten:** `calendarPreferencesSource.spec.ts` (5), `CalendarV2.spec.ts` (21).
- **Extended:** `calendarItems.spec.ts` (+1).

Covered:
- the 15-slot grouping with gaps and buffer;
- events outside visible hours;
- action priority and fallback;
- global vs selected-week counts, and no badge on a failed source;
- presets and layers;
- phone and tablet;
- DST week;
- `?mode=` deep link with no mutations;
- grid scale: empty week, one 50-minute session, sessions hours apart, 12 hours, early + late, overlapping lanes, availability windows, full day;
- scroll chaining: no `overscroll-behavior` on the timeline and a clipped grid body (CSS regression test);
- empty-day labels (unit and desktop/phone);
- next-action scope on another week;
- phone sheet close control, scroll lock and focus return.
