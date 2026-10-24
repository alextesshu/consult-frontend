# KAN-161 — Specialist cabinet shell UI v2

Source: snapshot `claude-design-2026-10-23-4ff7cedd` (archive v6.6, contents v6.7).
- **Desktop:** sidebar and NAV from `handoff/mockups/Cabinet-Dashboard.dc.html`.
- **Mobile:** M1 header and tab bar, M2 «Ще» sheet from `Cabinet-Mobile.dc.html`.
- **Motion:** backdrop and sheet timings from `Cabinet-Drawer.dc.html`.
- **Other files:** `Cabinet-Mobile-2.dc.html` (M9–M14) was reviewed; it describes page content and repeats the same tab bar. `Dashboard.dc.html` does not exist in the snapshot.

Base: `origin/dev` c864fcb (Dashboard, PR #65).

## Ownership

Changed:
- `src/App.vue`:
  - adds the v2 shell branch (`useCabinetShellV2`);
  - adds the header class, fennec lockup and mobile account button;
  - wires badges and account data.
  - The legacy shell remains the `v-else` branch.
- New: `src/components/cabinet-v2/SpecialistCabinetShellV2.vue`, `src/lib/specialistCabinetNav.ts`, `src/styles/cabinetShellV2.css`.
- Tests and evidence.

Not touched:
- Registration and login, `api.ts`, `stores/auth.ts` (PR #54, KAN-159);
- `ClientDashboardView` (PR #57, KAN-160, HOLD);
- the router, guards, backend, tokens and brand assets.

When the shell applies: only when `isUiV2()` is true and the legacy `showSpecialistCabinetShell` would show, i.e. an authenticated specialist on `/cabinet*` outside the minimal shell.

## Navigation: supported vs gated

All 14 source items map to existing specialist-only routes (`requiresRole: 'SPECIALIST'`); this is verified against the real router in `specialistCabinetNav.spec.ts`.

| Source item | Route | Badge (real data only) |
|---|---|---|
| Кабінет | `/cabinet` (exact) | — |
| Профіль | `/cabinet/profile` | — |
| Клієнти | `/cabinet/clients` | — |
| Розклад | `/cabinet/slots` (+ schedule/availability paths) | — |
| Сесії | `/cabinet/sessions` | scheduled sessions awaiting confirmation (existing shell count) |
| Запити | `/cabinet/external-sessions#guest-requests` (+ `/cabinet/inquiries`) | `pending_guest_requests_count` |
| Завдання | `/cabinet/practice-board` | — |
| Відгуки | `/cabinet/reviews` | — |
| Чати | `/cabinet/chat` | `/chat/unread-count/` |
| Групові події | `/cabinet/group-events` | — (the existing page explains plan access; this item was missing from the v1 sidebar) |
| Власний блог | `/cabinet/journal` | — |
| Аналітика | `/cabinet/analytics` | — |
| Тарифи і доступ | `/cabinet/billing` | — |
| Налаштування | `/cabinet/settings` | — |

No item is gated. «Ще» shows the sum of the badges inside it, as the M2 note says.

## Fidelity matrix

| Reference | Status | Notes |
|---|---|---|
| Desktop sidebar | ✅ | 220px, `20px 12px` padding and right hair border. Items use `8px 12px`, radius 12, 14px text; the active item is filled navy; hover draws an inset `#D4CCC2` ring over `.2s`; badges are peach 20px 11/600. Avatar, account and plan are pinned to the bottom. Active state also sets `aria-current="page"`; the focus ring is visible. |
| Desktop header | ✅ with deviation | The source has no top bar: the logo sits in the sidebar. Notifications, chat, settings, the public-profile link and logout need a home, so a slim 60px v2 header carries the approved fennec lockup and these actions. The legacy gradient header, tagline and «Мій кабінет» pill are replaced. |
| M1 mobile header | ✅ | 52px with the fennec lockup at 26px, the existing bell, and a 36px account avatar that opens «Ще». |
| M1 tab bar | ✅ | Кабінет · Сесії · Клієнти · Запити · Ще. White bar, `8px 8px 22px` padding plus the iPhone safe area; 11px labels, active navy/500 on a `#DDF1EF` icon chip, 18px badges. |
| M1 tab icons | ✅ with deviation | The source draws placeholder 22px squares; simple 22px line icons in the same slot are used instead. |
| M2 «Ще» sheet | ✅ | 24px top radius, `10px 16px 30px` padding plus safe area, handle, account row (links to the public-profile preview), 2-column 52px tiles with badges, and a 48px «Вийти». It holds 10 items, not 9, because the 14-item NAV adds «Групові події». |
| Motion | ✅ | Backdrop `rgba(18,35,58,.28)` fades over `.32s ease`; the sheet uses `transform .4s cubic-bezier(.2,.8,.2,1)` (Cabinet-Drawer). It also closes on a swipe down (> 80px) as noted under M2. Sidebar hover is `.2s`. `prefers-reduced-motion` removes every transition. No other animations were added. |
| Overlay behaviour | ✅ | Escape, backdrop, swipe, item navigation, route change, logout and widening to ≥ 768px all close the sheet. Focus moves to the sheet, Tab stays inside, and focus returns to «Ще». Page scroll is locked and restored; cleanup runs on unmount. |
| Fixed elements | ✅ | The tab bar sits at z-index 40 and the sheet at 48, both below existing page modals (50–1000). Content gets bottom padding of tab bar + safe area. `StickySaveBar`, the scroll-to-top button and the footer are lifted above the tab bar. |

## Cross-page compatibility (Chromium, browser fixtures)

Checked on 15 routes at 375/390/640/768/1280/1440 (90 checks):
- **Routes:** `/cabinet`, `/cabinet/profile`, `/cabinet/clients`, `/cabinet/slots`, `/cabinet/sessions`, `/cabinet/external-sessions`, `/cabinet/inquiries`, `/cabinet/practice-board`, `/cabinet/reviews`, `/cabinet/chat`, `/cabinet/group-events`, `/cabinet/journal`, `/cabinet/analytics`, `/cabinet/billing`, `/cabinet/settings`.
- **Every check:** the v2 header is present (60px desktop, 52px mobile) and the legacy shell is gone; the sidebar shows at ≥ 768px and the tab bar at < 768px; there is an active item; no content ends behind the tab bar; no new horizontal overflow.

Found on `origin/dev`, not introduced here: `/cabinet/slots` at 375px already overflows horizontally. Its own toolbar buttons make the page 2234px wide on `origin/dev` in both v1 and v2; with this shell it is 2026px. This belongs to the Schedule page, a follow-up outside the shell.

Other checks:
- **Desktop:** keyboard Enter on a sidebar link navigates; the active indicator follows Клієнти → Групові події → browser back.
- **Roles:** a guest is sent to `/login`; a client-only user is sent to `/403` and never gets the specialist shell.
- **Results:** `acceptance.json`. API data are **browser fixtures** (`common.cjs`), not backend acceptance.

## V1 pixel parity

Routes `/cabinet`, `/cabinet/clients`, `/cabinet/sessions` and `/cabinet/settings` were captured at 375/768/1280/1440 against `origin/dev` c864fcb. There were three runs, each with a second baseline capture as a noise control (`parity-run1..3.json`, combined by `parity_summary.py` into `parity-summary.json`).

- **15 of 16 pairs:** 0 px in at least one run.
- **v1 375 `/cabinet/clients`:** best 10 px — antialiasing of one card border.
  - The same pair on the baseline differs from its own control by up to 77 px.
  - DOM geometry of all 45 elements in `main` is identical to 0.01 px.

## Verification

- **Vitest:**
  - focused set: nav 5, shell component 4, App shell integration 3, CSS contract 4;
  - the Dashboard regression suites still pass;
  - full suite: 127 files / 1936 tests passed.
- **`vue-tsc -b`:** 9 errors on both `origin/dev` c864fcb and this branch, the same set file by file.
- **`vite build`:** OK. **`git diff --check`:** OK.
- **Evidence:**
  - source: `claude-1440-shell.png`, `claude-1440-sidebar.png`, `claude-m1.png`, `claude-m2.png`;
  - Vue: `vue-1440-cabinet*.png`, `vue-375-cabinet*.png`, `vue-375-more-open.png`, `vue-375-slots-more-active.png`, `vue-1280-sidebar-hover.png`;
  - recordings: `recordings/vue-375-more.webm` (open, Escape, backdrop, swipe, navigation) and `recordings/vue-1280-navigation.webm`.
