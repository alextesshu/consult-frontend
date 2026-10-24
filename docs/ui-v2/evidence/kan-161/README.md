# KAN-161 — Specialist Cabinet Dashboard UI v2

Source: snapshot `claude-design-2026-10-23-4ff7cedd`, `handoff/mockups/Cabinet-Dashboard.dc.html` (desktop) and `Cabinet-Mobile.dc.html` M1 (< 768px). `Cabinet-Drawer`, `Cabinet-Mobile-2` and `Specialist-Tools` were reviewed for scope and gates. Base: `origin/dev` 80af437 (includes PR #64).

## Ownership and preflight

- Changed: `CabinetView.vue` (new `v-if="uiV2"` template branch plus v2 view-models appended to the script; v1 template and all loaders, routes and business logic unchanged), and new dashboard-only files: `specialistDashboardV2.ts`, `useDashboardMotion.ts`, `specialistDashboardV2.css`, plus tests.
- `heroSessionsSettled` is one new flag set in the existing `loadSessionsForHero` finally block. It stops v2 from flashing the empty hero before the first sessions request.
- Not touched:
  - `App.vue`, the router, `api.ts` and `stores/auth.ts` (KAN-159 / PR #54 changes `api.ts` and `auth.ts`);
  - KAN-160 (PR #57, `ClientDashboardView`);
  - Login and registration, tokens and brand assets, backend.
- Data comes only from the existing cabinet APIs:
  - `/booking/sessions/` (upcoming and past);
  - `/cabinet/work-queue/`;
  - `/cabinet/practice-analytics/?range=` (7d / 30d / 90d);
  - `/cabinet/entitlements/`;
  - `/cabinet/onboarding-state/`;
  - `/me/`;
  - `/chat/threads/` for client names.

## Visual fidelity matrix

| Source block | Status | Vue implementation | Not shown, and why |
|---|---|---|---|
| Hero «Наступна сесія» | ✅ | Navy card, 40px name, 88px start time; «Показати таймер» starts a real countdown and is remembered in `pc:dashboard:hideTimer`, like the source. «Приєднатися» is enabled only when the server `join_available` flag, the meeting URL and `canJoinExternalMeeting` all allow it. «Відкрити сесію» → `/cabinet/sessions/:id`; «+ Нова сесія» → `/cabinet/slots?action=create-session`. The live state uses the existing hero signal. | Session ordinal («7-ма сесія»), session topics, blurred «Остання нотатка» and the first name in the greeting: none are in the session or `/me/` DTOs (G2). |
| Today strip | ✅ | Work-queue `today_sessions`: time, client, real status (Завершено / Наступна / Підтверджено / Потребує підтвердження) and a peach dot for completed sessions without a note (`has_note`). | — |
| «Потребує уваги» | ✅ (deep links) | Cards are built from the hero signal (needs confirmation or missing link), guest-request previews (with or without a time, topics), unconfirmed payments, note reminders and product updates. Tag colours follow the source. The badge shows the real total; a «Ще N пунктів» line covers items without a preview. Empty state uses the approved fennec. | In-place «Прийняти / Інший час / Запропонувати час / Підтвердити оплату», drawers, leave animation and undo toast: no inline mutation API is approved here, so every action deep-links to the existing page (G3). |
| «Готовність до звернень» | ✅ | Onboarding-state DTO: ring n/total, steps, «Заповнити →» links to each step's route, and the existing primary CTA. When ready it collapses to the green «Профіль опублікований…» line, as in the source. | Inline profile drawer and «Опублікувати профіль» mutation (G3). |
| «Практика» | ✅ | 7 / 30 / 90-day segmented control (existing request): completed sessions, new requests, paid and unconfirmed amounts by currency, and the active-client bar from entitlements. | No invented totals; amounts are shown only when the API returns them. |
| «Попереду» | ✅ | Upcoming sessions after today: weekday and date, time, client, linked. | — |
| Loading / empty / error | ✅ | Source skeleton (340px hero, two 320px blocks) pulsing at .9s; empty hero, empty queue, inline errors with «Повторити» for sessions, the work queue, analytics and onboarding; the expired-trial notice is kept. | — |
| Motion | ✅ | Reveal: opacity .6s and transform .8s `cubic-bezier(.2,.7,.2,1)` with scale .985; columns delayed .15s and .25s. Pulse dot at 1s / .9s; count-up 900ms easeOutCubic (replays on range change); ring `stroke-dashoffset .8s`; hover lift on cards. `prefers-reduced-motion`: content visible at once, no transitions, no pulse, final numbers. | — |
| Mobile M1 (< 768px) | ✅ | One column: hero (26px name, 40px time, 2×48px actions, horizontal 118px session strip) → queue (44px full-width buttons) → readiness collapsed to a row → practice → upcoming. The date line is hidden as in M1; «+ Нова сесія» is kept. | Bottom tab bar and avatar header belong to the shell (G1). |
| Sidebar NAV (14 items) | ⛔ shell gate | Existing `App.vue` sidebar and «Розділи кабінету» drawer unchanged. | G1. |

## Gates

- **G1 — shared shell (`App.vue`).**
  - Restyle the v2 specialist sidebar to match the source (logo, 14 items including «Групові події», avatar and plan footer).
  - Hide the v1 authenticated top header on cabinet pages.
  - Replace the «Розділи кабінету» drawer with the M1 bottom tab bar («Кабінет / Сесії / Клієнти / Запити / Ще») and the M2 «Ще» sheet.
  - These affect every cabinet page, so they belong in a separate shell delivery. No other open PR touches `App.vue`.
- **G2 — backend fields for the hero:** session ordinal per client, session topics, last-note preview (the source blurs it for privacy) and a display first name in `/me/`.
- **G3 — inline actions:** accepting a request, proposing times, confirming payment, adding a link or note, editing profile steps and publishing from the dashboard. These need approved mutation contracts, the Cabinet-Drawer flows (focus, Escape, dirty state) and a real undo. Until then the dashboard deep-links to the existing pages.
- **G4 — product copy:** the source's join hint «Посилання вже в клієнта» and «Стане активною за 10 хв до початку» imply server behaviour; the existing, verified hints are used instead.

## Verification

- Vitest:
  - focused set: 5 files / 95 tests (`CabinetView.v2.spec`, `CabinetView.spec` v1 regression, helpers, motion, CSS contract);
  - full suite: 124 files / 1920 tests passed.
- `vue-tsc -b`: 9 errors on both `origin/dev` 80af437 and this branch, the same set file by file.
- `vite build`: OK. `git diff --check`: OK.
- Chromium (`acceptance.cjs`, results in `acceptance.json`; API data are **browser fixtures**, not backend acceptance; clock fixed to Thu 22 Oct 15:50 Europe/Kyiv like the source):
  - **Layout:** at 375/390/640/768/1280/1440 there is no overflow; the mobile and desktop typography, button heights and readiness variants are asserted.
  - **Hero:** the countdown ticks and the timer choice persists after reload.
  - **Practice:** the 7 / 30 / 90-day range works from the keyboard (Enter); `aria-pressed` updates.
  - **Links:** every link goes to `/cabinet/...` or the meeting URL.
  - **Reduced motion:** content is visible at once.
  - **Roles:** a guest is sent to `/login`; a client-only user is sent to `/403` and never sees the dashboard.
  - **States:** skeleton, empty hero and queue, and the analytics error.
- V1 pixel parity of `/cabinet?ui=v1` against `origin/dev` at 375/768/1280/1440: 0 px at every width; the noise control is also 0 (`parity.json`).
- Evidence:
  - source: `claude-1280|1440-loading|dashboard.png`, `claude-m1-mobile.png`;
  - Vue: `vue-<width>-dashboard.png`, `vue-375|1440-dashboard-full.png`, `vue-1280-timer|loading|empty-error.png`;
  - recordings: `recordings/claude-1440-dashboard.webm`, `vue-1440-dashboard.webm`, `vue-375-dashboard.webm`.
