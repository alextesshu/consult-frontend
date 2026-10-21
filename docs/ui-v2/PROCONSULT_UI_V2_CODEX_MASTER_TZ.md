# Pro Consult — UI v2: єдине майстер-ТЗ для Codex

**Версія:** 1.0 · **Дата:** 21.10.2026  
**Проєкт:** Pro Consult · **Репозиторій:** frontend (`consult-frontend`; уточнити фактичний remote у read-only preflight)  
**Технології (за вихідним ТЗ):** Vue 3, TypeScript, Vite, Pinia, Vitest  
**Вихідні матеріали:** `TZ_CODEX.md` і `Модернізація дизайну сайту ProConsult.zip` (`handoff/`).  
**Статус:** планування. **Жодне редагування, commit, push, PR, merge чи deployment не санкціоновані цим документом.**

## 0. Інструкція виконання (обов'язково)

Codex працює **малими незалежними етапами**, не переносить весь сайт за одне завдання. Для кожного етапу:

1. Перед будь-яким редагуванням прочитати `AGENTS.md`, релевантні канонічні документи, макет, поточний код та тести; надати план **3–6 пунктів**, **точний список файлів**, початковий SHA, ризики та умови приймання.
2. **Зупинитися і дочекатися окремого «так»** на конкретний етап. Попереднє загальне погодження редизайну не є дозволом на редагування всіх етапів.
3. Реалізувати **лише погоджений етап** в ізольованій гілці/worktree від актуального `origin/dev`. Не змішувати візуальні й поведінкові зміни. **Не комітити без прямого дозволу**, відповідно до `AGENTS.md`; push/PR — також лише після конкретної авторизації.
4. Прогнати вузькі тести, typecheck, diff check і manual smoke, коли середовище це дозволяє. Не називати незапущені перевірки успішними.
5. Надати результати й зупинитися перед merge/deployment. **Ніякого production/staging доступу, деплою чи workflow dispatch без окремого погодження.**

**CI budget:** відомий billing/spending-limit blocker у backend GitHub Actions. Не припускати, що frontend CI має такий самий статус: перевірити окремо, не створюючи зайвих workflow runs. Не робити проміжних push або Ready/Draft циклів задля перевірки. CI, якщо доступний і потрібен за політикою репозиторію, має оцінювати актуальний integration state. Жоден локальний тест не підмінює required remote gate.

## 1. Ціль і непорушні інваріанти

**Ціль:** впровадити новий візуальний шар UI v2, залишивши поточну логіку і повністю працездатний UI v1. Вибір версії виконується через `html[data-ui="v2"]`; default до етапу 5 — v1. `?ui=v1` примусово відображає v1, `?ui=v2` — v2.

**Заборонено без окремого функціонального ТЗ:**
- змінювати routes, API виклики/контракти, Pinia store, права, role gating, статуси з API, валідацію й бізнес-правила;
- змінювати справжні тарифи, ціни, ліміти, юридичні тексти, публічні обіцянки й статуси за допомогою placeholder-копі з макетів;
- вводити рейтинги, «топ», «перевірений спеціаліст», гарантованих клієнтів, платне ранжування, комісії з консультацій;
- усувати loading/empty/error/disabled стани, зменшувати доступність чи ламати клавіатурну навігацію;
- показувати приховані оффери або робити з вибору вільного часу автоматично підтверджену сесію;
- змінювати v1 через глобальні CSS-селектори чи незахищену розмітку;
- змінювати backend, billing, Telegram rollout або CI workflows в межах UI-міграції.

**Продуктова логіка (пріоритет над макетом):** Pro Consult — простір для ведення консультацій, а не маркетплейс; `/specialists` — opt-in пошук; гостьові запити без реєстрації; **request-first**; оффери та видимість — тільки за серверними даними; статус підтвердження сесії відокремлений від статусу оплати. Приватні нотатки/матеріали спеціаліста не стають публічними; клієнт бачить лише явно опубліковані матеріали.

## 2. Джерела істини, порядок пріоритетів

1. **Поточна реалізація і backend contract:** маршрути, запити, авторизація, статуси, реальні ціни, правила продукту. Для змін пароля — також `../backend/docs/AI_CONTRACT.md` (якщо доступний).
2. **`AGENTS.md` і чинні release/security правила репозиторію.**
3. **`docs/DESIGN_SYSTEM.md` §2–4:** продуктова семантика та UX safety.
4. **Це майстер-ТЗ + `TZ_CODEX.md`:** scope, етапи, gate, приймання.
5. **`docs/DESIGN_SYSTEM.md` §5–12, §15**, `src/styles/tokens-v2.css`, `src/styles/components-v2.css`: v2 вигляд/компоненти.
6. **`docs/ui-v2/mockups/*.dc.html` і `Handoff-Spec.dc.html`:** геометрія і композиція; **не** authority для текстів, цін, даних, API.
7. `docs/UI_MIGRATION_PLAN.md`, `docs/UI_SHAPE_STANDARD.md`, `docs/ui-v2/PATCHES.md`: правила перенесення.

**Колізії:** якщо джерела суперечать один одному, **STOP, наведи точні файли/діапазони та запропонуй мінімальне рішення**. Не замінюй silently діючий DESIGN_SYSTEM.md файлом з архіву, поки не перевірено, що §1–4 і всі не-v2 політики лишилися незмінні. Не копіюй source-файли поверх актуальних без порівняння diff.

## 3. Вхідний ZIP: inventory та правила імпорту

Архів має 21 файл, усі під `handoff/`:

**Документація:**
- `handoff/README.md`
- `handoff/CODEX_TASKS.md`
- `handoff/MIGRATION_PLAN_V2.md`
- `handoff/TZ_CODEX.md`
- `handoff/frontend/PATCHES.md`
- `handoff/frontend/docs/DESIGN_SYSTEM.md`

**Source:**
- `handoff/frontend/src/lib/uiVersion.ts`
- `handoff/frontend/src/styles/tokens-v2.css`
- `handoff/frontend/src/styles/components-v2.css`

**Сім HTML-макетів:**
- `handoff/mockups/Home.dc.html`
- `Signup.dc.html`
- `Specialist-Profile.dc.html`
- `Find-Specialist.dc.html`
- `Client-Signup.dc.html`
- `Client-Cabinet.dc.html`
- `Handoff-Spec.dc.html`

**Зображення:**
- `handoff/mockups/assets/maria-koval.webp` (демонстраційний спеціаліст — не production data)
- `handoff/mockups/public/brand/proconsult-logo-dark.png`
- `proconsult-logo-light.png`
- `proconsult-mark.png`

**Скрипт:** `handoff/mockups/support.js` — **не імпортувати у production bundle автоматично**. Спершу перевірити призначення, залежності, мережеві виклики та ліцензійну/безпекову придатність. Якщо потрібний для локального перегляду макетів — тримати окремо від `src/`.

**Mapping для контрольованого імпорту (не застосовувати до погодження):**

| Джерело | Місце в repo |
|---|---|
| `handoff/README.md` | `docs/ui-v2/README.md` |
| `handoff/CODEX_TASKS.md` | `docs/ui-v2/CODEX_TASKS.md` (reference; майстер-ТЗ має пріоритет щодо gates) |
| `handoff/frontend/PATCHES.md` | `docs/ui-v2/PATCHES.md` |
| `handoff/MIGRATION_PLAN_V2.md` | доповнити `docs/UI_MIGRATION_PLAN.md`, не затираючи чинного |
| `handoff/frontend/docs/DESIGN_SYSTEM.md` | **diff review** проти `docs/DESIGN_SYSTEM.md`; оновлювати лише погоджені §5–12, §15 |
| `handoff/frontend/src/styles/*.css` | `src/styles/` |
| `handoff/frontend/src/lib/uiVersion.ts` | `src/lib/uiVersion.ts` |
| сім `.dc.html` + reference images | `docs/ui-v2/mockups/` зі збереженням відносної структури |

Перевірити, чи є аналогічні файли в repo, їх hash/diff, не перезаписувати новішу функціональність. Не переносити тестові імена/демо-контент як реальні профілі.

## 4. Дизайн-контракт UI v2

- **Onest 400/500/600**. Заголовки: 500 (ніколи 700). Основний текст: 400. 600 — лише для числового акценту за дизайн-системою.
- **Фон:** плоский кремовий `--pc-bg-main` = `#FBF9F5`, без radial gradients.
- **Основна дія:** `--pc-navy-900` (фактичне значення з CSS-токенів: `#12345a`). М'ятний/персиковий — декоративні soft tints із відповідними `*-ink` для тексту, не primary CTA.
- **Радіуси:** 8px теги, 12px inputs/square controls, 16px cards/panels, 24px hero/dialog/bottom sheet, pill CTA/chips/segments.
- **Картка:** білий фон, тонка рамка `--pc-border-hair`, без тіні за замовчуванням.
- **Фокус:** видимий клавіатурний `:focus-visible` outline 2px navy, offset 2px. Disabled opacity .45, з коректною неінтерактивністю та доступним станом.
- **Анімації:** 150/200/400ms, `cubic-bezier(.4,0,.2,1)`, підтримка `prefers-reduced-motion`.
- **Spacing:** шкала 4px, змінні `--pc-space-*`; нові числові значення погоджувати на рівні токенів.
- **CSS:** використовувати `var(--pc-*)` та `.pc2-*`; не додавати нові hex і магічні px у Vue scoped styles, якщо є готовий токен. Уже наявні literals у початковому пакеті — предмет окремої нормалізації при потребі, **не розширювати scope без підстав**.
- **Екрани:** 375 / 768 / 1280 / 1440px, без горизонтального скролу; перевіряти невеликі висоти, зокрема 375×677.

**Обов'язковий preflight CSS:** фактичний `components-v2.css` оголошує низку `.pc2-*` селекторів без початкового `html[data-ui="v2"]` префікса; це допустимо **лише якщо жоден v1-компонент їх не використовує**. Перевірити глобальні селектори, стиль `body`, `body::before`, `html`, reset, inheritance, focus states та пріоритет імпортів. Заборонений навіть непомітний регрес v1. Ізоляція через реальний selector/клас має бути доведена тестами та smoke.

## 5. Контракт перемикача версій

Вихідний `uiVersion.ts`:
- `?ui=v1` або `?ui=v2` має найвищий пріоритет і запам'ятовується в `localStorage['pc.ui']`;
- далі коректне збережене `v1`/`v2`;
- далі `VITE_UI_V2 === 'true'` (build-time default), інакше v1;
- invalid query/storage ігнорувати, не трактувати як v2;
- `applyUiVersion()` викликається **до `createApp()`**;
- у Vue можна користуватися `isUiV2()` або селектором `html[data-ui="v2"]`.

**Додаткові gates:** безпечна обробка disabled/unavailable localStorage (privacy mode), відсутність невиправданого flash v1/v2 при початковому завантаженні, коректне перемикання при навігації SPA — перевірити фактичну поведінку й запропонувати мінімальну поправку, якщо необхідна. Не змінювати контракт мовчки.

**Важливий нюанс:** localStorage override може переважати staging `VITE_UI_V2=true`; QA має очищати `pc.ui` або явно задавати `?ui=v2` / `?ui=v1`. `VITE_UI_V2` збирається у frontend bundle й змінюється **після rebuild**, а не від редагування runtime env на сервері. Production default v1 до окремого дозволу.

## 6. План PR та контрольні точки

### Етап 0A — Імпорт handoff, без підключення UI (1 PR)

**Після окремого approval:** розпакувати тільки дозволені файли й помістити у визначені docs/styles/lib paths; порівняти/обережно інтегрувати дизайн-систему. Оновити `AGENTS.md` Canonical Documentation посиланням на `docs/ui-v2/README.md`; додати в міграційний план v2; перевірити діапазон нових файлів і що макети не імпортуються в JS bundle. **Не чіпати `main.ts`, `index.html`, routing, runtime flag чи візуальний вигляд.**

**Файли (очікувано; підтвердити в preflight):** `AGENTS.md`, `docs/DESIGN_SYSTEM.md`, `docs/UI_MIGRATION_PLAN.md`, `docs/ui-v2/**`, `src/styles/tokens-v2.css`, `src/styles/components-v2.css`, `src/lib/uiVersion.ts`. Для документації source templates дотримати існуючу структуру. **Не включати `support.js` у runtime.**

**Acceptance:** поточний UI, snapshot/build/runtime без змін; імпортовані файли точні й узгоджені; `git diff --check`; нові CSS/TS ще не підключено в app; source не був перезаписаний випадково. Якщо repo вже містить пакет — 0A перетворити на diff-only та не дублювати зміни.

### Етап 0B — Активація feature flag, v1 default (окремий PR)

- `src/main.ts`: після `./style.css` імпорт v2 tokens/components; `applyUiVersion()` до `createApp`.
- `index.html`: preconnect Google Fonts + Onest 400/500/600 з кирилицею; чинний Inter для v1 залишити.
- `.env.example`: `VITE_UI_V2=`.
- `src/lib/uiVersion.spec.ts`: query > storage > env; invalid params, v1 override, fail-safe fallback, persistence; перевірити privacy-mode storage errors.
- `docs/UI_SHAPE_STANDARD.md`: примітка на початку «лише v1; для v2 — DESIGN_SYSTEM.md §8».
- Відсутність глобальних побічних ефектів від імпорту CSS — критерій блокування.

**Acceptance:** `?ui=v1` візуально та функціонально незмінний; `?ui=v2` фон #FBF9F5, Onest 400, navy focus; test/typecheck/build, браузерні smoke на 375/1280, клавіатурна навігація. Якщо Onest/CDN не завантажується, fallback залишається читабельним.

### Етап 1 — Публічна частина (кожна позиція — окремий PR)

**1.1 Header/Footer, `src/App.vue`** за `<header>` з `Home.dc.html`: `.pc2-header` 76px, logo 40px, вкладки «Для спеціалістів / Для клієнтів», `.pc2-btn--primary`. Навігація, авторизовані ролі, мобільне меню і чинний footer — без зміни логіки. 375px без обрізання лого, накладання кнопок, горизонтального скролу. Якщо footer не має макета — лише погоджені токени без нових блоків.

**1.2 Home, `src/views/HomeView.vue`** за `Home.dc.html`: hero → схема «сторінка → запит → сесія → робота» з живою демонстраційною карткою → блок практики (варіант 2c, якщо він є в канонічному макеті) → актуальні тарифи → фінальний CTA. Ціни, SLA, CTA routes, реальні тексти тарифів — із чинного коду. Reduced-motion. Продуктові обіцянки тільки підтверджені.

**1.3a Signup visual, `src/views/SignupView.vue`**: `.pc2-input--lg`, `.pc2-password`, `.pc2-chips`, `.pc2-steps`, primary block CTA; **не видаляти confirmation field та не змінювати валідацію на цьому етапі**. Макет показує кінцевий стан, але працюючий стан 1.3a може тимчасово мати зайве поле.

**1.3b Signup behavior, окремий явно погоджений PR:** після read-only перевірки `../backend/docs/AI_CONTRACT.md` і фактичного payload прибрати «Повторіть пароль» та її validation **лише якщо backend цього не вимагає**; ім'я, email, пароль, одне питання chip «спеціалізація»; інші питання — в існуючий onboarding **тільки якщо він реально це підтримує**. Тести валідації, backend errors, redirect. Якщо backend потребує confirmation або немає шляху для поля — STOP із конкретним контрактним blocker.

### Етап 2 — Публічна частина клієнта (кожна позиція — окремий PR)

**2.1 Specialist profile, `src/views/PublicProfileView.vue` і `src/components/public-profile/*.vue`** за `Specialist-Profile.dc.html`: desktop grid `minmax(0,1fr) 380px`; sticky `.pc2-request-panel`, top 96px; нижче 860px — mobile bottom sheet із коректним focus management, overlay, scroll locking, escape/close. Панель: оффер → вільний час → контакт. **Не створювати автоматично підтверджену сесію, не показувати приховані оффери, не обіцяти слот як бронювання; парна консультація лише якщо налаштована**. Slug/visibility/API без змін. Перевірити slotless та гостьові запити.

**2.2 Discovery/search, `src/views/PublicTherapistsView.vue`, `src/components/PublicSpecialistCard.vue`** за `Find-Specialist.dc.html`: filters `.pc2-chips`, cards `.pc2-card.pc2-card--interactive`; opt-in правила пошуку, debounce, min query, фільтри, пагінація, empty/error/loading — без зміни; без рейтингів і «найкращих».

**2.3a Client signup visual, `src/views/ClientSignupView.vue`** за `Client-Signup.dc.html`, без змін форми/validation; **2.3b Client signup behavior** — окремий PR після підтвердження backend contract, аналогічно 1.3b. Гостьовий запит без реєстрації зберегти.

### Етап 3 — Кабінет клієнта (1 PR)

**3.1 `src/views/ClientDashboardView.vue`** за `Client-Cabinet.dc.html`: hero найближчої сесії (радіус 24px), матеріали `.pc2-card--interactive`, статуси `.pc2-tag--*`. Лише опубліковані матеріали, приватні нотатки недоступні, оплата та підтвердження — різні статуси. Сесійні посилання й дозволи незмінні.

### Етап 4 — Кабінет спеціаліста (одна сторінка — один PR)

Порядок: **dashboard → sessions → session detail → clients → client detail → calendar → billing → settings → admin**. Макетів для цих сторінок немає; **не вигадувати UX структури чи нові блоки**. Замінювати лише візуальні класи кнопок, інпутів, карток, тегів, радіуси, типографіку. Перед кожною сторінкою перевірити фактичну назву файлу. Зберегти ролі, статуси, приватність, форми й різні permission gates. Admin — окремо, лише якщо підтверджено сферу змін.

### Етап 5 — Глобальний rollout і видалення v1 (заборонено без окремої команди)

За `MIGRATION_PLAN_V2.md`: staging `VITE_UI_V2=true` щонайменше тиждень зі smoke за шаблоном; production default v2 лише після acceptance й окремого дозволу, `?ui=v1` ще працює як fallback; **тільки після двох стабільних релізів** окремим рішенням видаляти v1 markup, Inter та legacy tokens. Не поспішати з видаленням v1.

## 7. Мінімальні перевірки для кожного PR

**Автоматизовані:**
- вузький `npx vitest run <релевантні spec файли>` (не запускати вигаданий шлях);
- `npx vue-tsc --noEmit` або офіційний project typecheck;
- `git diff --check`;
- релевантний build/lint за наявною конфігурацією;
- перевірка, що в новому diff немає неузгоджених hex/px або неізольованих глобальних стилів;
- regression-тести поведінки для 1.3b/2.3b, профілю і дозволів.

**Ручні/browser smoke (у звіті відділяти реально виконане від запланованого):**
- `?ui=v1`, `?ui=v2`, чистий storage/default; перехід/refresh; базові role-based flows;
- ширини 375, 768, 1280, 1440px, короткий viewport 375×677;
- Tab, Shift+Tab, Escape, focus-visible, читабельні labels, aria-expanded/pressed/modal;
- reduced motion, відсутність overflow, мобільне меню, bottom sheet;
- loading/empty/error/disabled; авторизація/перенаправлення/помилки API;
- реальні CTA, тарифи, приватність, request-first та payment/confirmation status.

**Rollback:** v1 зберігається без DB міграцій і має бути доступним навіть якщо v2 окрема сторінка некоректна. Якщо регресія v1 — PR BLOCKED. Зміни frontend build-time env вимагають rebuild; staging/production deployment лише за спеціальним operational approval.

## 8. Документація та завершення етапу

Після кожного прийнятого PR: дотриматися існуючих `docs/HANDOFF_RULES.md`; оновити `docs/PHASE_CLOSE_SUMMARIES.md` та `docs/HANDOFF.md` (якщо існують і правила дійсно цього вимагають), відмітити виконаний етап у `docs/UI_MIGRATION_PLAN.md`. Не змінювати документацію незавершених етапів на DONE.

**Стандарт звіту Codex:**

```
UI V2 STAGE <N> — PREFLIGHT READY / BLOCKED
Baseline dev SHA:
Checked sources / exact source collisions:
Plan (3–6 steps):
Exact files proposed:
Risks, v1 isolation and rollback:
Acceptance / tests proposed:
STOP — awaiting approval to edit.
```

Після дозволеної реалізації:

```
UI V2 STAGE <N> — IMPLEMENTED / BLOCKED
Files changed:
Branch / HEAD (if authorized):
Tests run / pass / skipped / blocked:
Visual smoke v1 vs v2 (widths, keyboard):
Business invariants checked:
What was intentionally not changed:
Remaining release gates:
STOP — no automatic merge/deployment.
```

## 9. Найближче завдання Codex — тільки read-only Stage 0 preflight

**ПРОМПТ ДЛЯ ПОЧАТКУ:**

> У репозиторії Pro Consult frontend проведи **strict read-only UI v2 Stage 0 preflight** за документом `PROCONSULT_UI_V2_CODEX_MASTER_TZ.md` та архівом `Модернізація дизайну сайту ProConsult.zip`. Спершу перевір `AGENTS.md` і актуальний `origin/dev` (без перемикання чи редагування), зістав усі handoff-матеріали з чинними файлами. Окремо перевір розбіжності `DESIGN_SYSTEM.md`, глобальну ізоляцію CSS v1/v2, безпеку `support.js`, контракти перемикача query/localStorage/env і відсутність неочікуваних source assets. Виріши, чи справді потрібні 0A і 0B, або 0A вже виконаний. Надай точну мапу імпорту, план 3–6 кроків і файли для першого вузького PR. **Не редагуй, не створюй гілок/PR, не коміть, не запускай Actions і не виконуй deployment. STOP на погодженні.**

---

**Примітка про джерела:** цей документ синтезує обидва надані матеріали. Додаткові захисні gates (небезпека імпорту `support.js`, scoped CSS, приватний storage, build-time env, CI budget, rollback і явні approvals) — інженерні вимоги для безпечного впровадження, а не цитати з оригінального ТЗ.
