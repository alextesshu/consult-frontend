# UI v2 — завдання для Codex

> Reference prompts only. Stage 0A imports artifacts without activation.
> [Master TZ](PROCONSULT_UI_V2_CODEX_MASTER_TZ.md) and explicit approvals take precedence.
> The current import omits `support.js`; interactive mockup preview is unavailable.

## 1. Покласти пакет у репозиторій (один раз, вручну)

```
frontend/
  docs/
    DESIGN_SYSTEM.md            ← інтегрувати §5–12 і §15, явно зберігши v1; §1–4 не змінювати
    UI_MIGRATION_PLAN.md        ← дописати в кінець вміст handoff/MIGRATION_PLAN_V2.md
    ui-v2/
      README.md                 ← handoff/README.md
      PATCHES.md                ← handoff/frontend/PATCHES.md
      CODEX_TASKS.md            ← цей файл
      mockups/                  ← Home, Signup, Specialist-Profile, Find-Specialist,
                                   Client-Signup, Client-Cabinet, Handoff-Spec (.dc.html)
                                   + public/brand/*, assets/*
  src/styles/tokens-v2.css      ← як є
  src/styles/components-v2.css  ← як є
  src/lib/uiVersion.ts          ← як є
```

Макети `.dc.html` — reference source з `x-dc`/`sc-*` та inline-стилями. Виключений `support.js` потрібен для їх інтерактивного runtime; у застосунок макети не підключати. Значення звіряти з токенами й Master TZ.

В `AGENTS.md`, у розділ «Canonical Documentation», додати рядок:
```
- UI v2 migration: `docs/ui-v2/README.md` (tokens, components, mockups, task prompts)
```

## 2. Як давати завдання

- **Одне завдання на один PR із плану.** Не просіть «перенести все» — Codex почне міняти логіку.
- Кожне завдання починається з однакового блоку правил (нижче). Після нього — конкретне завдання.
- Спершу просіть план і список файлів, редагувати — після вашого «так» (це вже прописано в AGENTS.md).
- До кожного завдання про сторінку прикладайте скриншот макета: Codex краще звіряє вигляд з картинкою.

### Спільний блок правил (вставляти на початок кожного завдання)
```
Контекст: UI v2 міграція. Прочитай docs/ui-v2/README.md, docs/DESIGN_SYSTEM.md §5–12,
src/styles/tokens-v2.css, src/styles/components-v2.css.
Правила:
- Тільки візуал. Не змінюй роути, API-виклики, store, валідацію, тексти з юридичним змістом.
- v1 має виглядати як раніше: нова розмітка/стилі тільки під html[data-ui="v2"] або isUiV2().
- Кольори, розміри, радіуси — лише через var(--pc-*). Жодних нових hex.
- Класи — з components-v2.css (.pc2-*). Якщо бракує — запропонуй додати туди, не в компонент.
- Заголовки font-weight 500, не 700.
- Збережи loading / empty / error / disabled стани.
- Спершу план і точний список файлів, потім чекай підтвердження.
- В кінці: npm run test (вузько), vue-tsc, git diff --check; перелік змінених файлів.
```

## 3. Готові завдання

**Етап 0B — інфраструктура (окреме погодження після 0A)**
```
Застосуй docs/ui-v2/PATCHES.md: підключи tokens-v2.css і components-v2.css у main.ts після style.css,
виклич applyUiVersion() до createApp, додай Onest в index.html, VITE_UI_V2 в .env.example.
Додай src/lib/uiVersion.spec.ts (порядок: query > localStorage > env, невалідні значення ігноруються).
Додай примітку «v1 only» на початок docs/UI_SHAPE_STANDARD.md.
Перевір: ?ui=v1 — без змін; ?ui=v2 — пласкe кремове тло #FBF9F5, Onest 400, фокус-рамка navy.
```

**1.1 — публічний хедер**
```
Під v2 перероби публічний topbar у App.vue за .pc2-header (макет docs/ui-v2/mockups/Home.dc.html, <header>).
Посилання, умови показу для ролей і мобільне меню не змінюй.
```

**1.2 — головна**
```
HomeView.vue під v2 за mockups/Home.dc.html. Секції: hero, схема «сторінка → запит → сесія → робота»
з живою карткою, блок практики, тарифи, фінальний CTA. Тексти тарифів і ціни — з поточного коду, не з макета.
Анімації — тільки з DESIGN_SYSTEM.md §12 «Motion», з урахуванням prefers-reduced-motion.
```

**1.3a — реєстрація спеціаліста (візуал)**
```
SignupView.vue під v2 за mockups/Signup.dc.html: .pc2-input--lg, .pc2-password з кнопкою «Показати/Сховати»,
.pc2-chips, .pc2-steps. Поля й валідацію поки не змінюй.
```

**1.3b — реєстрація спеціаліста (поведінка, окремий PR)**
```
Прибери поле «Повторіть пароль» з SignupView.vue та його валідацію; лиши ім'я, email, пароль
і одне питання (спеціалізація, chips). Перевір, що бекенд не вимагає password_confirmation
(..\backend\docs\AI_CONTRACT.md). Онови тести реєстрації.
```

**2.1 — профіль спеціаліста**
```
PublicProfileView.vue і components/public-profile/* під v2 за mockups/Specialist-Profile.dc.html.
Сітка minmax(0,1fr) 380px, .pc2-request-panel (липка; <860px — нижній лист).
Критично: request-first (вибір вікна = запит, не підтверджена сесія), приховані оффери не показувати,
slug-роут і правила видимості не чіпати.
```

**2.2 — пошук / 2.3 — реєстрація клієнта / 3.1 — кабінет клієнта**
```
<View>.vue під v2 за mockups/<Макет>.dc.html. [для 2.3 — як 1.3a + 1.3b окремими PR]
[для 2.2 — без рейтингів і «топ»; фільтри й пагінація як були]
[для 3.1 — тільки опубліковані матеріали; підтвердження сесії й оплата — окремі статуси]
```

**Етап 4 — кабінет спеціаліста (по одній сторінці)**
```
<View>.vue: без зміни структури заміни кнопки/поля/картки/теги на .pc2-*, радіуси за шкалою §8,
заголовки 500. Нових макетів немає — не вигадуй нові блоки.
```

## 4. Після кожного PR
- Перевірити `?ui=v1` і `?ui=v2` на ширині 375 і 1280.
- Після приймання завершеного етапу — короткий запис у `docs/PHASE_CLOSE_SUMMARIES.md` і оновлення «Active Work» у `docs/HANDOFF.md` (за HANDOFF_RULES.md).
