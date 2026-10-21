# ProConsult UI v2 — пакет для розробника

## Import status and authority

Stage 0A merged in PR #49 (`7a101daede5c0f69fe806d2814e7175273c2bb7a`).
Stage 0B opt-in infrastructure passed local final review and acceptance for the tested scope. Default remains v1.
The [Master TZ](PROCONSULT_UI_V2_CODEX_MASTER_TZ.md), repository rules, current
product/API contracts, and explicit user approvals govern execution. The original
[TZ_CODEX.md](TZ_CODEX.md) and task prompts describe future work; they do not grant approval.
Page migrations, commits, push, PR, and deployment need separate authorization.

## Local validation status (2026-10-21)

- Focused attribution/uiVersion/bootstrap/CSS/App run: 113/113 PASS.
- Build passed; existing large-chunk warning remains. App spec emits jsdom's
  existing `window.scrollTo` diagnostic; the test itself passes.
- Typecheck reports 9 errors outside Stage 0B, reproduced on the unchanged
  `7a101daede5c0f69fe806d2814e7175273c2bb7a` baseline: 9 unchanged errors, 0 new.
- Browser acceptance: PASS for tested public routes and viewports (375x677,
  768x900, 1280x900, 1440x900), UI selection, refresh/SPA/history, keyboard focus,
  reduced motion, overflow, button-link colors and font fallback. Default v1
  screenshots match baseline on `/`, `/login` and `/specialists` at all four widths.
- Storage-getter P1 is fixed and browser-verified: denied getter/getItem/setItem
  cannot block mounting; default v1 and explicit v2 mount, navigate and refresh.
  Available storage preserves first-touch attribution and TTL.
- Real authenticated backend workflows were not covered. Session restore and
  permission checks used synthetic API responses; this is not full application acceptance.
- Local final review passed. Git finalization is separately authorized; Ready,
  merge, page migrations and deployment remain separately gated. Baseline typecheck debt remains.

## Reference mockups and known gaps

The seven `mockups/*.dc.html` files and four images are byte-identical reference
artifacts. They use `x-dc`, `sc-*`, `text/x-dc`, inline script/style, and original
Google Fonts/support references; they are not autonomous static HTML pages.
`support.js` is deliberately not imported. Do not serve these files as app pages,
execute their embedded logic, add their CDN dependencies, or import them into `src/`.
Without that excluded runtime, interactive preview is unavailable. Read the source
for reference; preview requires a separately reviewed approach.
The three logos under `mockups/public/brand/` match the existing production assets;
no file under the app's `public/brand/` has been replaced. `maria-koval.webp` is demo data.

Stage 0B intentionally updates the imported CSS/TypeScript: all selectors are v2-gated,
wide anchor-color overrides are removed, focus outlines are explicit, and functional
text uses existing readable tokens. CSS is imported after legacy `style.css`.
The query (`v1`/`v2`) overrides saved `pc.ui`, then exact `VITE_UI_V2 === 'true'`,
otherwise v1. Storage reads/writes fail independently without blocking bootstrap.
A failed query write uses a per-document memory override ahead of stale storage;
a denied read can reuse the last applied version. Memory is not durable across reload.
Invalid query/storage is ignored. `applyUiVersion()` runs before `createApp()` and
verification URL sanitization; successful router navigation synchronizes reactive state
and `html[data-ui]`. Aborted navigation does not change the selection.
The existing legacy-token cleanup action is guarded at its bootstrap call site so
denied storage cannot prevent cookie-based session restore. No stored token is used.
Onest 400/500/600 uses one `display=swap` stylesheet in the HTML head (available in
both versions, applied only under v2); Inter stays available to v1. Font loading is not
awaited. Failed fonts use the system fallback. No page-level redesign is included.
Rollback: open the same route with `?ui=v1`; it overrides storage and build default.
The actual v1 `UI_SHAPE_STANDARD.md` includes 6-20px radii; 2-4px also occurs in
workspace design tokens. Neither v1 rule set changes during this import.
Token/Master typography and motion rules override inconsistent inline mockup values.

## Рішення
- **Шрифт:** Onest 400/500/600. Заголовки — 500.
- **Пароль (майбутній поведінковий етап 1.3b/2.3b):** одне поле з кнопкою «Показати»; лише після окремого погодження та перевірки backend contract. На візуальних етапах confirmation і validation зберігаються.
- **Заокруглення:** шкала 8 / 12 / **16** / 24 / pill. 16px для карток і панелей, 12px для полів, pill для CTA та чипів.
- **Кольори:** лишається власна палітра (темно-синій, кремовий, м'ятний, персиковий). З Nocturne взято тільки логіку: шкалу відступів із кроком 4px, стани hover/pressed/disabled 45% і фокус `:focus-visible` (2px, відступ 2px).
- **Обсяг змін у коді:** токени й спільні компоненти. Сторінки переносяться по одній, кожна окремим PR.
- **Розгортання:** поетапне, за прапорцем `data-ui="v2"` (`?ui=v2` або `VITE_UI_V2`).

## Склад
- [CODEX_TASKS.md](CODEX_TASKS.md) — як покласти пакет у репозиторій і готові завдання для Codex на кожен PR.
- [Handoff-Spec.dc.html](mockups/Handoff-Spec.dc.html) — візуальна специфікація токенів і компонентів.
- [UI_MIGRATION_PLAN.md](../UI_MIGRATION_PLAN.md) — етапи, сторінки, smoke-перевірки, чекліст PR.
- [PATCHES.md](PATCHES.md) — що й куди вставити в коді.
- [tokens-v2.css](../../src/styles/tokens-v2.css) — усі CSS-змінні.
- [components-v2.css](../../src/styles/components-v2.css) — кнопки, поля, пароль, чипи, сегменти, теги, картки, панель запиту, хедер, кроки, розкриття.
- [uiVersion.ts](../../src/lib/uiVersion.ts) — прапорець.
- [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) — інтегрований документ: §5–12 і §15 містять v2 reference та збережені правила v1; решта без змін.

## Макети → сторінки
- `Home.dc.html` → `HomeView.vue`
- `Signup.dc.html` → `SignupView.vue`
- `Specialist-Profile.dc.html` → `PublicProfileView.vue`
- `Find-Specialist.dc.html` → `PublicTherapistsView.vue`
- `Client-Signup.dc.html` → `ClientSignupView.vue`
- `Client-Cabinet.dc.html` → `ClientDashboardView.vue`

`Home-A/B/C` і `Practice-Block-Options` — архів варіантів, у роботу не йдуть.

## Важливо
Макети показують вигляд, а не бізнес-правила. Ціни, статуси, тексти з юридичним значенням і логіку запиту/сесії беріть з поточного коду (DESIGN_SYSTEM.md §2, §4).
