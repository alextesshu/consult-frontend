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
| `CalendarViewMenu.vue` | Popover under its trigger (desktop) or bottom sheet (phone): layer checkboxes with counts for the selected period and a «змінено» tag, «Скинути до режиму», marker legend, Esc and focus return. |
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

Next-action card priority:
1. The nearest future dated action.
2. Otherwise the nearest session: today → «Наступна…»; later → quiet card.
3. Otherwise none.

### Visible hours and time zone

- **Visible hours:** 09–18 by default, widened to the week's events (all-day absences excluded). The bar «Показано HH:00–HH:00 — поза цим часом подій немає» has a «Показати всю добу» toggle.
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

**Acceptance — `acceptance.cjs` → `acceptance.json`: 18 rows, 0 problems.**

Matrix:
- 375 / 390 / 768 / 1280 / 1440 × three modes;
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

Screenshots: `screenshots/v2-{375,390,768,1280,1440}-{workday,availability,actions}.png`, `v2-{1440,375}-view-menu.png`, `v2-{1440,375}-deviation-chip.png`.

**Parity — `parity.cjs` + `compare.py` → `parity.json`: 10/10 pixel-identical.**
- Compared against `origin/dev` 3085c1c: v1 `/cabinet/sessions`, `/cabinet`, `/cabinet/slots` and v2 `/cabinet`, `/cabinet/slots` at 375 and 1280.
- The first run had one font-antialiasing diff spread over all text of v1 `/cabinet` 375; the rerun was exact.
- PNGs are not committed.

**Recording:** a 1440 recording of mode switching and the popover was captured locally and is not committed.

## Tests

- **New:** `calendarModes.spec.ts` (3), `calendarWindows.spec.ts` (5), `calendarActions.spec.ts` (5), `useCalendarActions.spec.ts` (2).
- **Rewritten:** `calendarPreferencesSource.spec.ts` (5), `CalendarV2.spec.ts` (11).
- **Extended:** `calendarItems.spec.ts` (+1).

Covered:
- the 15-slot grouping with gaps and buffer;
- events outside visible hours;
- action priority and fallback;
- global vs selected-week counts, and no badge on a failed source;
- presets and layers;
- phone and tablet;
- DST week;
- `?mode=` deep link with no mutations.
