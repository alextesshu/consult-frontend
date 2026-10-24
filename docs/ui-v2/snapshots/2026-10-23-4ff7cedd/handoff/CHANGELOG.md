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
| Specialist-Profile.dc.html | DESIGN READY · оновлено після READY (v6) | 2.1, 2.1a |
| Specialist-Profile-Mobile.dc.html | DESIGN READY (новий, v6.2) | 2.1b |
| Share-Card.dc.html | DESIGN READY (новий, v6.2) · ⚠ бекенд | 2.1c |
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
| Admin.dc.html | DESIGN READY · оновлено після READY (v6.1) | 6.5 |
| Cabinet-Mobile.dc.html | DESIGN READY | 4.10 |
| Cabinet-Mobile-2.dc.html | DESIGN READY (новий, v6.4) | 4.10 |
| Client-Mobile.dc.html | DESIGN READY (новий, v6.5) | 4.10, 3.1, 5b.*, 9.*, 10.3 |
| Onboarding.dc.html | DESIGN READY (новий, v6.6) | 12.1–12.2 |
| Notifications.dc.html | DESIGN READY (новий, v6.6) · ⚠ бекенд (Telegram) | 12.3–12.5 |
| Public-Mobile.dc.html | DESIGN READY (новий, v6.6) | 1.*, 2.2–2.3, 5a, 4.10 |
| Chat.dc.html | DESIGN READY · оновлено після READY (v6) | 6.5 |
| Inquiries.dc.html | DESIGN READY | |
| Schedule.dc.html | DESIGN READY | |
| Profile-Edit.dc.html | DESIGN READY | |
| Billing.dc.html | DESIGN READY | |
| Settings.dc.html | DESIGN READY | |
| Specialist-Tools.dc.html | DESIGN READY · оновлено після READY (v6, v6.3) | 8.4, 8.6 |
| Guest.dc.html | DESIGN READY | |
| Brand.dc.html | DESIGN READY | |
| Handoff-Spec.dc.html | DESIGN READY | |
| Public-Content.dc.html (блог, FAQ) | DESIGN READY | 10.1–10.2 |
| Session-Pages.dc.html | DESIGN READY | 10.3–10.5 |
| Service-Pages.dc.html | DESIGN READY | 10.6–10.7 |
| Тур | не потрібен — редірект на головну | — |
| Emails.dc.html | DESIGN READY | 11.1–11.4 |
| Чат з підтримкою (Chat) | DESIGN READY · ⚠ бекенд | 6.5 |
| Блог — розширений редактор (Specialist-Tools) | DESIGN READY | 8.6 |
| Публічний профіль — доопрацювання | DESIGN READY | 2.1a |

---

## 2026-10-23 · v6.7 — вирівнювання макетів (без нових екранів)
Зміни лише в текстах і дрібницях — **оновлено після READY** для всіх перелічених; якщо змерджено, PR-доповнення одним комітом «copy consistency».
- **Домен:** усюди `proconsult.space`; адреса профілю — `proconsult.space/s/<slug>` (було `proconsult.ua/<slug>`). Admin, Client-Pages, Inquiries, Onboarding, Profile-Edit, Session-Pages, Share-Card, Specialist-Profile(-Mobile), ТЗ.
- **Валюта:** «грн» після числа (було «₴» у кабінеті): Cabinet-Dashboard, Cabinet-Drawer, Cabinet-Mobile(-2), Clients, Sessions, Notifications, Specialist-Tools.
- **Апостроф:** один символ ’ (U+2019) в усіх текстах.
- **Undo в тостах:** завжди «Скасувати» (було «Повернути» в Chat, Schedule, Session-Pages, Settings, Specialist-Tools).
- **Меню спеціаліста:** 14 пунктів з «Групові події» також у Cabinet-Dashboard, Clients, Sessions.
- **Дія запису:** «Залишити запит» замість «Записатися» (Public-Content, кнопка в редакторі блогу) — це запит, не автоматичний запис.
- Іконка відгуку в Notifications — літера «В» замість символу ★.
- Auth, Client-Pages — дрібний фікс `componentDidUpdate` у макеті (на Vue не впливає).

## 2026-10-23 · v6.6 — онбординг і сповіщення
- Новий макет `Public-Mobile.dc.html` — **DESIGN READY**: P1 Головна, P2 меню, P3 Для клієнтів, P4 Пошук з листом фільтрів, P5 Вхід, P6 Реєстрація. ТЗ 4.10 → «Публічні сторінки». Робити в PR відповідної сторінки; якщо змерджено — PR-доповнення.
- Напрям «Психіатр» замінено на «Психоаналітик / -иня» (`psychoanalyst`) — Onboarding, Profile-Edit (**оновлено після READY**), Public-Mobile. ТЗ — «Термінологія напрямів».
- Новий макет `Onboarding.dc.html` — **DESIGN READY**: майстер з 3 обовʼязкових кроків (фото й хто ви, ціни й формати, умови запису), можна пропустити; кабінет з чеклістом і ручною публікацією. План — 12.1–12.2.
- Новий макет `Notifications.dc.html` — **DESIGN READY**: дзвіночок обох ролей (чати й запити — лише бейджами в меню), сторінка «Усі сповіщення», налаштування з колонкою Telegram, повідомлення бота. План — 12.3–12.5. Telegram — після рішення в `BACKEND_DECISIONS.md`.
- `Settings.dc.html` (вкладка «Сповіщення») — **оновлено після READY**: колонка Telegram і картка підключення беруться з `Notifications.dc.html` N4 (сам Settings.dc.html не змінено — N4 має пріоритет).

## 2026-10-23 · v6.5 — клієнт на мобільному
- Новий макет `Client-Mobile.dc.html` — **DESIGN READY**: C1 Головна, C2 Деталі сесії, C3 Матеріали, C4 Щоденник, C5–C6 Чат, C7 Гостьова сторінка. ТЗ 4.10 → «Клієнт, чат, гостьові». Мобільну розкладку робити в тому ж PR, що й десктопну сторінку (3.1, 5b.*, 6 чат, 9.*, 10.3); якщо вже змерджено — PR-доповнення.

## 2026-10-23 · v6.4 — мобільний кабінет, частина 2
- Новий макет `Cabinet-Mobile-2.dc.html` — **DESIGN READY**: M9 Запити, M10 тред запиту, M11 Розклад + лист «Додати вікно», M12 Завдання, M13 Аналітика, M14 Редагування профілю; правила для блогу й решти інструментів. ТЗ 4.10 → «Частина 2». Робити разом з відповідним десктопним PR або одразу після нього.

## 2026-10-23 · v6.3 — аналітика
- `Specialist-Tools.dc.html` (analytics) — **оновлено після READY**: порівняння з попереднім періодом, 4 KPI з дельтами (дохід, скасування), воронка «перегляд → запит → перша сесія → 3+ сесії», джерела запитів, графік поверх попереднього періоду, популярні години, поради з блокуванням для Start, порожній стан. Пропси `analyticsPlan`, `analyticsEmpty`.
- План 8.4 — якщо змерджено, PR-доповнення. Воронка й джерела — після рішень у `BACKEND_DECISIONS.md` (п. 14–16); решту можна робити одразу на наявних API.

## 2026-10-23 · v6.2 — мобільний профіль, рішення для бекенду
- Новий макет `Specialist-Profile-Mobile.dc.html` — **DESIGN READY**: публічний профіль < 860px — нижня панель запису, лист запису, «Про мене» на весь екран, «Поділитися» (navigator.share / лист). ТЗ 2.1 → «Мобільна < 860px». План — 2.1b.
- Новий макет `Share-Card.dc.html` — **DESIGN READY**: OG-картка профілю 1200×630 (з фото / без фото), квадрат 1080×1080, схеми превʼю, мапа полів. ТЗ 2.1 → «Картка для месенджерів». План — 2.1c.
- Новий файл `BACKEND_DECISIONS.md` — усі ⚠ з ТЗ одним списком (12 пунктів). Пункт плану з ⚠ не брати, доки в колонці «Рішення» немає ✅.

## 2026-10-23 · v6.1 — підтримка в адмінці
- `Admin.dc.html` — **оновлено після READY**: новий екран «Підтримка» (`startScreen=support`) — черга звернень з фільтрами й «Лише мої», тред з контекстом користувача, призначення виконавця, внутрішні нотатки, шаблони, «Відповісти і закрити». Решта екранів адмінки без змін.
- ТЗ: «Чат» → «Підтримка в адмінці». План: 6.5 розширено адмін-частиною. ⚠ бекенд: поля `assignee`, `first_response_at`, тип повідомлення `note`.
- Статус — **DESIGN READY**.

## 2026-10-23 · v6 — чат підтримки, блог, публічний профіль
- `Chat.dc.html` — **оновлено після READY**: тред «Підтримка Pro Consult» для обох ролей (закріплений, без архівації, чипи теми, підпис оператора). ⚠ бекенд: `SupportThread`/`SupportMessage`. План — 6.5.
- `Specialist-Tools.dc.html` (blog) — **оновлено після READY**: список-таблиця з вкладками й пошуком, вкладка «Добірки» з порядком, редактор окремим екраном з акордеоном налаштувань (рубрика, добірки, обкладинка/закріплення, slug + SEO), відкладена публікація. План — 8.6 (якщо змерджено — PR-доповнення).
- `Specialist-Profile.dc.html` — **оновлено після READY**: панель запису з власною прокруткою; канал відповіді Email/Telegram/Телефон; умови перед записом + згода; питання до першої сесії; інші контакти; «Поділитися»; кнопка «Поділитися профілем» у hero (копіювати, Telegram, Instagram, Facebook, Threads); модалка «Про мене»; стани «не опубліковано» (`status=preview|hidden`). План — 2.1a.
- Статуси: усі три — **DESIGN READY**. Екранів у статусі DESIGN IN PROGRESS немає.

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
