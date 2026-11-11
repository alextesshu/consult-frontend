# ProConsult UI v2 — пакет для розробника

## Рішення
- **Шрифт:** Onest 400/500/600. Заголовки — 500.
- **Пароль:** вводиться один раз, з кнопкою «Показати». Поля «повторити пароль» немає.
- **Заокруглення:** шкала 8 / 12 / **16** / 24 / pill. 16px для карток і панелей, 12px для полів, pill для CTA та чипів.
- **Кольори:** лишається власна палітра (темно-синій, кремовий, м'ятний, персиковий). З Nocturne взято тільки логіку: шкалу відступів із кроком 4px, стани hover/pressed/disabled 45% і фокус `:focus-visible` (2px, відступ 2px).
- **Обсяг змін у коді:** токени й спільні компоненти. Сторінки переносяться по одній, кожна окремим PR.
- **Розгортання:** поетапне, за прапорцем `data-ui="v2"` (`?ui=v2` або `VITE_UI_V2`).

## Склад
- `CODEX_TASKS.md` — як покласти пакет у репозиторій і готові завдання для Codex на кожен PR.
- `Handoff-Spec.dc.html` (у корені проєкту) — візуальна специфікація токенів і компонентів.
- `MIGRATION_PLAN_V2.md` — етапи, сторінки, smoke-перевірки, чекліст PR.
- `frontend/PATCHES.md` — що й куди вставити в коді.
- `frontend/src/styles/tokens-v2.css` — усі CSS-змінні.
- `frontend/src/styles/components-v2.css` — кнопки, поля, пароль, чипи, сегменти, теги, картки, панель запиту, хедер, кроки, розкриття; для кабінету — блоки сесій і вільні вікна, прапорці, бічна панель, undo-тост, приховування приватного тексту.
- `frontend/src/lib/uiVersion.ts` — прапорець.
- `frontend/docs/DESIGN_SYSTEM.md` — оновлений документ: §5–12 і §15 переписані під v2, решта без змін.

## Макети → сторінки
- `Home.dc.html` → `HomeView.vue`
- `Signup.dc.html` → `SignupView.vue`
- `Specialist-Profile.dc.html` → `PublicProfileView.vue`
- `Find-Specialist.dc.html` → `PublicTherapistsView.vue`
- `Client-Signup.dc.html` → `ClientSignupView.vue`
- `Client-Cabinet.dc.html` → `ClientDashboardView.vue`

Кабінет спеціаліста та адмінка (етап 4):
- `Cabinet-Dashboard.dc.html` → `CabinetView.vue`
- `Cabinet-Drawer.dc.html` → спільний drawer для форм (створення сесії, відповідь на запит, посилання, нотатка, поле профілю, клієнт, дії адміна)
- `Sessions.dc.html` → `TherapistSessionsView.vue`, `TherapistSessionDetailView.vue` (панель)
- `Clients.dc.html` → `TherapistClientsView.vue`, `TherapistClientWorkbookView.vue`
- `Cabinet-Mobile.dc.html` → адаптив усіх сторінок кабінету й адмінки (<768 і 768–1099)
- `For-Clients.dc.html` → новий `ForClientsView.vue` (`/for-clients`), посадкова для клієнтів
- `Admin.dc.html` → `AdminSpecialistsSearchView.vue`, `AdminSpecialistDetailView.vue`, `AdminWorkQueueView.vue`, `AdminInboxView.vue`, `AdminBillingAccessRequests*View.vue`

`Home-A/B/C`, `Practice-Block-Options` і `Specialist-Dashboard` — архів варіантів, у роботу не йдуть.

## Важливо
Макети показують вигляд, а не бізнес-правила. Ціни, статуси, тексти з юридичним значенням і логіку запиту/сесії беріть з поточного коду (DESIGN_SYSTEM.md §2, §4).

## Бренд (жовт 2026)
- Нове лого — фенек. `public/brand/`: `proconsult-logo-dark.png`, `proconsult-logo-light.png` (ті самі імена й пропорції 1040×260 — заміна без зміни коду), `proconsult-mark.png`, `proconsult-mark-light.png`, `mark-mask.png` / `wordmark-mask.png` (для CSS mask — колір задається токеном), `favicon-32.png`, `favicon-192.png`, `apple-touch-icon.png`. Старі — `public/brand/legacy/`.
- Тоновані знаки для фонів: `mark-{navy,white,sand,pale,mint,band,deep}.png`. Анімований знак — `mockups/brand-listen.js` (приклад для `BrandListen.vue`).
- Правила й варіанти використання — `mockups/Brand.dc.html`; ТЗ — `TZ_CODEX.md` §4.11.
