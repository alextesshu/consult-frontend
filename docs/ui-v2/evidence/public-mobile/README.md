# Public Mobile P1–P6 — delivery evidence

Source: `handoff/mockups/Public-Mobile.dc.html` (+ `Home`, `For-Clients`, `Find-Specialist`, `Auth`, `Signup`, `Client-Signup`).

## Source verification

- New archive `Модернізація дизайну сайту ProConsult (v6.7).zip`: SHA-256 `4422db6c5fe2a93e937765830c1744a47a341f461fb85b3893aab47b4d930b15`, 70 entries, CRC OK (`unzip -t`).
- Compared byte-for-byte with snapshot `claude-design-2026-10-23-4ff7cedd` (`docs/ui-v2/snapshots/2026-10-23-4ff7cedd/handoff`).
  - Identical: `Public-Mobile`, `Home`, `For-Clients`, `Find-Specialist`, `Auth`, `Signup`, `Client-Signup`, `DESIGN_SYSTEM.md`, `TZ_CODEX.md`, `CHANGELOG.md`, `BACKEND_DECISIONS.md`.
  - Differ: `Clients`, `Sessions`, `Service-Pages` (trailing whitespace only, already recorded in the snapshot README); `Specialist-Tools` (one line, line 531: `₴` → `грн`). None of these are P1–P6 sources.
- Result: the imported snapshot is used as-is. No snapshot was added or overwritten.

## Fidelity matrix

| | Scenario | Status | Implemented | Not implemented / gate |
|---|---|---|---|---|
| P1 | Home (mobile) | Done | Centered hero, existing fennec at 44px in a 72px `#EEF4FA` circle (rings and breathing animation kept), full-width actions «Створити простір безкоштовно» (`/signup`) and «Як це працює» (`/#how-it-works`), horizontal snap strip (cards at 82%, `scroll-snap-type: x mandatory`) with dots that follow the real scroll position and work from the keyboard, single-column bento and pricing. | Header: 60px, «Створити» → `/signup` (integrated, see P2). Strip cards use the four production journey steps rather than the mock's draft copy (D1). |
| P2 | Header + menu | Done (integrated in `App.vue`) | < 768px guest UI v2 header: 60px, 30px logo, one context action (specialist pages «Створити» → `/signup`; `/for-clients`, `/specialists` and specialist-owned pages «Увійти» → `/login`; hidden when it points to the current page), 44px two-line burger. The burger opens `PublicMobileMenuV2`: audience switch, 56px rows with →, CTA by audience («Створити простір» → `/signup` / «Створити кабінет клієнта» → `/signup-client») and «Увійти». It closes from the button, ×, Escape, the backdrop, item navigation, route change and widening to ≥ 768px, with scroll lock, focus trap, focus on × and focus return to the burger. Full screen up to 420px (the source frame); on wider phones (640px) it is a 420px panel with a visible backdrop. 768–1100px keeps the existing inline disclosure menu. | «Блог» is left out because no public route exists (D2). Specialist-owned pages keep the restricted inline menu («Вхід» only), with no product promotion. The menu has no animation in the source, so reduced motion needs nothing extra. |
| P3 | For Clients | Done | Teal gradient hero, search card stacked in a column (52px field and 52px «Знайти спеціаліста»), horizontal topic strip, numbered step list with 32px circles; existing typing demo kept; desktop preview cards hidden < 768px; search still sends `?q=` / `request_group` like desktop. | Header «Увійти» → `/login` (integrated, see P2). |
| P4 | Discovery + filter sheet | Done (supported filters only) | Sticky search bar under the header, filter button whose counter counts real applied filters, topic/direction chip strip, compact cards (64px photo, role, name, «format · location · price», two topics, «Профіль →»), bottom sheet (72%, backdrop `opacity .3s`, sheet `transform .4s cubic-bezier(.2,.8,.2,1)`, `translateY(105%)`) with «Спосіб пошуку» and «Формат», «Скинути», and «Показати N» from the live API total. | Price, «Коли», language, «Найближче: …» and nearest-time sorting: the API has no such fields or parameters (G2). |
| P5 | Login | Done (supported methods only) | UI v2 login following Auth.dc.html with P5 mobile layout: «Вхід» title, full-width role switch, 54px fields, «Забули пароль?» in the label, «Показати» toggle, «Увійти», role-dependent footer link; same `auth.login`, redirect and error mapping as v1. Desktop UI v2 uses the Auth.dc form column. | «Посилання на email» (magic link) and «Запам’ятати мене на 30 днів» have no backend contract (G3). The Auth.dc desktop illustration shows sample account data (G4). The source's 56px logo-only header on auth pages is not applied; `/login` uses the P2 header with «Створити» (G1). |
| P6 | Signup step 2 | Blocked | — | The 3-step wizard («Крок N з 3», direction step, «Далі») exists only in PR #54 (KAN-159), which depends on the registration contract v2 in backend PR #63. `SignupView`/`ClientSignupView` on `dev` have one step, so P6 has no markup to style here (G5). |

## Integration gates

- **G1 — auth header.** P5/P6 use a 56px logo-only header in the source. That would mean hiding the shell header on `/login` and `/signup*`; it is not done here.
- **G2 — discovery API.** The filters «Ціна за сесію», «Коли» and «Мова», the «Найближче: <date>» line and «спершу з найближчим вільним часом» need new fields or parameters in the discovery API before any UI is built.
- **G3 — auth API.** Magic-link login and «remember me» need backend support.
- **G4 — product copy.** The Auth.dc desktop illustration («Чекає у вашому кабінеті», «3 сесії…») looks like real account data and would need «приклад» labels approved first.
- **G5 — KAN-159 / PR #54.** Once #54 is merged, P6 means applying the P6 header (‹ and «Крок N з 3 · <step>»), the three progress bars and a sticky «Далі» footer to its `.pc2-steps` and `.pc2-practices` markup, for both signup views.

## Deliberate discrepancies

- **D1.** P1 strip copy uses the production `journeySteps` (the same copy as Home.dc.html desktop), not the mobile draft. The draft's «Клієнт обирає вільне вікно, ви підтверджуєте» and «реквізити в листі» would be unverified claims.
- **D2.** Menu items map to existing targets only: `/#how-it-works`, `/#features`, `/#pricing`, `/faq`. For clients: `/specialists`, `/for-clients#clients-journey-title`, `/for-clients#clients-faq-title`.
- **D3.** Home keeps its token-only color rule (`homeV2.spec`): the eyebrow uses `--pc-teal-ink` and secondary text uses `--pc-text-muted` instead of the mock hex values `#2F8C86`, `#5A6578` and `#8B95A7`.
- **D4.** The P4 sheet format options are «Онлайн / Офлайн / Будь-який» (the mock labels). The card has no «від» before the price because the API returns a single price.
- **D5.** The P5 client subtitle drops «й ваш щоденник» because there is no such client feature.

## Verification

- Vitest, focused (new and changed specs): 51/51. Full suite: 116 files, 1860 tests passed.
- `vue-tsc -b`: 9 errors on both `origin/dev` and this branch, all in unrelated files. No new errors.
- `vite build`: OK (only the existing chunk-size warning). `git diff --check`: OK.
- Chromium acceptance (`acceptance.cjs`, results in `acceptance.json`) at 375/390/640/768/1280/1440:
  - no horizontal overflow on any page, v1 or v2;
  - P4 sheet: 72% height, exact transitions, Enter opens it, focus is trapped, Escape and a backdrop tap close it, focus returns, scroll is locked and restored, the counter updates, back and forward restore the filters, the bar stays sticky under the header, no transitions under reduced motion;
  - P1: 72px circle and 44px mark, swiping moves the dots, the keyboard dot works, «Як це працює» goes to the anchor;
  - P3: `?q=` hand-off;
  - P5: 54px fields, role footer, 401 alert.
- P2 in the real app (`menu-captures.cjs`, results in `menu-acceptance.json`) at 375/390/640/768/1280:
  - 60px header, 30px logo, 44px burger and exactly one visible action below 768px; `Створити → /signup` on Home, `Увійти → /login` on For Clients and Discovery;
  - Enter opens the menu, focus lands on ×, Tab stays inside, Escape closes it and returns focus to the burger; × closes it; the backdrop closes it at 640px; «Тарифи» goes to `/#pricing` and closes it;
  - scroll lock is set and removed; no overflow; at 768/1280 the inline menu stays and no dialog appears; no transitions under reduced motion.
- API data in the browser checks are **browser fixtures** (`common.cjs`), not backend acceptance.
- Pixel parity against `origin/dev` 7d43768, three runs (`parity-run1..3.json`, combined in `parity-summary.json` by `parity_summary.py`), each with a second baseline capture as a noise control. Font loading makes text glyphs differ between captures of the *same* build, so a pair passes when at least one run matches exactly. All 25 pairs pass with 0 px:
  - UI v2 desktop at 768/1280/1440 (Home, For Clients, Discovery): 0 px; 8 of 9 pairs are 0 in every run.
  - UI v1 at 375/768/1280/1440 (Home, `/for-clients` → Home redirect, Discovery, Login): 0 px; Home and Login are 0 in every run.
  - Discovery differs by 19–50 px of card-border antialiasing, and the baseline differs from its own control by the same amount. The v1 `/for-clients` redirect scrolls to an anchor and varies between captures of the same build.
- Recordings: `recordings/claude-p4-sheet.webm` (source), `vue-375-p4-sheet.webm`, `vue-375-p1-strip.webm`, `vue-375-p2-menu.webm`.
- Screenshots: `claude-p1…p6.png` and `claude-p4-sheet-*.png` (source); `vue-<width>-<page>.png` at every width; `vue-375-*-full.png`; `vue-*-discovery-sheet*.png`; `vue-*-menu-*.png` (real app); `vue-<width>-header-*.png`.
