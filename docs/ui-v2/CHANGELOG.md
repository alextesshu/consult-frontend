## Canonical reference pointer — 2026-10-26 (KAN-158 scoped overlay)

`claude-design-2026-10-26-1dbb9008` (v6.9.1, SHA-256 `1dbb900845f830cc5fb9833d08f97c173f4500b05155faa00e12f723dabe152d`) is active as a **scoped overlay** for the KAN-158 UI v2 public specialist profile and the profile-editor short-description field only. `claude-design-2026-10-23-4ff7cedd` (v6.6/v6.7) stays the base for every other UI v2 screen. See the [pointer](SNAPSHOT_CURRENT.json), [audit](DESIGN_SYNC_2026-10-26_V691_CANDIDATE.md) and [acceptance matrix](IMPLEMENTATION_MATRIX_V691_KAN158.json).

Accepted differences: no «Обрати формат» / «Змінити» links in the final CTA; offer toggle buttons with `aria-pressed` instead of a radiogroup (keyboard-test condition still open); «Досвід» / «Мови» shown when the API supplies them; a slot click opens the request form directly; the compact contacts card from #80. The final UX audit's video-dialog P2 was remediated in #82. No source chronology was rewritten.

## Canonical reference pointer - 2026-10-24

Current supplied archive is v6.6 with contents through v6.7. Read the [exact frozen changelog](snapshots/2026-10-23-4ff7cedd/handoff/CHANGELOG.md), [audit](DESIGN_SYNC_2026-10-24_V66_V67.md) and [current entry point](START_HERE.md). The v5 source body below is retained as history; its IN PROGRESS/current-task claims are superseded. No source chronology was rewritten.

---

# UI v2 — журнал змін пакета

Codex: після кожного оновлення `docs/ui-v2/` прочитай нові записи зверху і звір із тим, що вже зроблено.
- Статус **DESIGN READY** — можна брати. **DESIGN IN PROGRESS** — не починати.
- Запис «оновлено після READY» — макет/ТЗ змінились після того, як екран був готовий: якщо пункт уже змерджено, зроби PR-доповнення лише з переліченими змінами.

Формат запису: дата · версія · зміни · статуси · зачеплені пункти плану.

## Поточні статуси екранів

| Макет | Статус | План |
|---|---|---|
| Home.dc.html | DESIGN READY | |
| Signup.dc.html | DESIGN READY | |
| Specialist-Profile.dc.html | DESIGN READY | |
| For-Clients.dc.html | DESIGN READY | |
| Find-Specialist.dc.html | DESIGN READY | |
| Client-Signup.dc.html | DESIGN READY | |
| Client-Cabinet.dc.html | DESIGN READY | |
| Auth.dc.html | DESIGN READY | |
| Client-Pages.dc.html | DESIGN READY | |
| Cabinet-Dashboard.dc.html | DESIGN READY | |
| Cabinet-Drawer.dc.html | DESIGN READY | |
| Sessions.dc.html | DESIGN READY | |
| Clients.dc.html | DESIGN READY | |
| Admin.dc.html | DESIGN READY | |
| Cabinet-Mobile.dc.html | DESIGN READY | |
| Chat.dc.html | DESIGN READY | |
| Inquiries.dc.html | DESIGN READY | |
| Schedule.dc.html | DESIGN READY | |
| Profile-Edit.dc.html | DESIGN READY | |
| Billing.dc.html | DESIGN READY | |
| Settings.dc.html | DESIGN READY | |
| Specialist-Tools.dc.html | DESIGN READY | |
| Guest.dc.html | DESIGN READY | |
| Brand.dc.html | DESIGN READY | |
| Handoff-Spec.dc.html | DESIGN READY | |
| Public-Content.dc.html (блог, FAQ) | DESIGN READY | 10.1–10.2 |
| Session-Pages.dc.html | DESIGN READY | 10.3–10.5 |
| Service-Pages.dc.html | DESIGN READY | 10.6–10.7 |
| Тур | не потрібен — редірект на головну | — |
| Emails.dc.html | DESIGN READY | 11.1–11.4 |
| Чат з підтримкою | DESIGN IN PROGRESS | — |
| Блог — розширений редактор | DESIGN IN PROGRESS | (8.6 брати за поточним макетом) |
| Публічний профіль — доопрацювання | DESIGN IN PROGRESS (огляд) | 2.1 брати за поточним макетом |

---

## 2026-10-23 · v5 — листи
- Новий макет `Emails.dc.html` — **DESIGN READY**: 10 листів у єдиному HTML-шаблоні. ТЗ «Листи», план — етап 11 (бекенд: `html_message` + базовий шаблон, plain text лишається).
- Лендинг «Психологічна підтримка» — без окремого макета, ТЗ: верстка `Find-Specialist` з іншим H1 і передобраними темами.
- Email підтримки — support@proconsult.space.
- **DESIGN IN PROGRESS** (не брати): чат з підтримкою (потрібна модель на бекенді), розширений редактор блогу, доопрацювання публічного профілю. Поточні макети 8.6 і 2.1 лишаються READY — після доопрацювання буде запис «оновлено після READY».

## 2026-10-23 · v4 — публічний контент, деталі сесій, службові
- Нові макети — **DESIGN READY**: `Public-Content.dc.html` (блог спеціаліста: список/допис/добірка; FAQ), `Session-Pages.dc.html` (деталі сесії клієнта, гостьова сесія у спеціаліста, запрошення в кабінет), `Service-Pages.dc.html` (юридичні сторінки, 403, 404) + `mockups/legal-texts.json`.
- ТЗ: розділи «Публічний контент», «Сесії: деталі й запрошення», «Службові сторінки». План: етап 10 (10.1–10.7).
- ⚠ бекенд/рішення: умови скасування для клієнта; перенос історії гостьових сесій у кабінет; 404 замість редіректу `/:pathMatch`.
- Тур: окремої сторінки не буде (`/tour` → `/#how-it-works`).
- Тепер усі сторінки роутера мають макет.
- Email підтримки в макетах — support@proconsult.space (FAQ, Підтримка й дані).

## 2026-10-23 · v3
- Додано статуси DESIGN READY / DESIGN IN PROGRESS: таблиця вище і колонка «Статус» у `START_HERE.md` §4.
- `CHANGELOG.md` тепер входить у кожен ZIP і кладеться в `docs/ui-v2/`.

## 2026-10-23 · v2 — гостьові сторінки
- Новий макет `Guest.dc.html` — **DESIGN READY**. Розділ ТЗ «Гостьові сторінки», етап 9 у плані (9.3 гостьовий перегляд — ⚠ бекенд).

## 2026-10-23 · v1 — базова версія пакета
- Етапи 0–8 у `MIGRATION_PLAN_V2.md`, макети в `mockups/`, ТЗ у `TZ_CODEX.md` — **DESIGN READY**.
- Меню спеціаліста: 14 пунктів, «Задачі» → «Завдання», додано «Групові події» (зачіпає 4.1, 6.*, 7.*, 8.*).
- `START_HERE.md` — інструкція для Codex.
