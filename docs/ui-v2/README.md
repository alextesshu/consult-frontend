# ProConsult UI v2 — пакет для розробника

## Import status and authority

Stage 0A only: local reference import, awaiting review. UI v2 is not active.
The [Master TZ](PROCONSULT_UI_V2_CODEX_MASTER_TZ.md), repository rules, current
product/API contracts, and explicit user approvals govern execution. The original
[TZ_CODEX.md](TZ_CODEX.md) and task prompts describe future work; they do not grant approval.
Stage 0B, page migrations, commits, push, PR, and deployment need separate authorization.

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

Imported CSS/TypeScript is byte-identical and unused by the application. Known
localStorage errors, non-reactive SPA selection, link/button specificity, and unscoped
`.pc2-*` selectors remain Stage 0B work. Source comments mentioning original handoff
paths are preserved for hash fidelity; repository paths are linked below.
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
