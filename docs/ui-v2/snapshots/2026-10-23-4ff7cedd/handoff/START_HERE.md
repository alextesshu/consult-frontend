# UI v2: інструкція для Codex (почніть звідси)

Цей файл пояснює Codex, де лежать макети, ТЗ і правила, як їх читати і як брати завдання.
Людині достатньо зробити кроки з §1 один раз. Далі Codex працює з репозиторієм сам.

---

## 1. Покласти пакет у репозиторій (людина, один раз)

1. Завантажте папку `handoff/` з проєкту дизайну (кнопка завантаження → zip).
2. Розпакуйте її в корінь репозиторію `consult-frontend` так:

```
consult-frontend/
  AGENTS.md                         ← додати блок з §7
  docs/
    DESIGN_SYSTEM.md                ← замінити на handoff/frontend/docs/DESIGN_SYSTEM.md
    UI_MIGRATION_PLAN.md            ← дописати в кінець handoff/MIGRATION_PLAN_V2.md
    ui-v2/
      START_HERE.md                 ← цей файл
      README.md                     ← handoff/README.md
      TZ_CODEX.md                   ← handoff/TZ_CODEX.md      (поведінка кожного екрана)
      MIGRATION_PLAN_V2.md          ← handoff/MIGRATION_PLAN_V2.md (порядок PR, ризики, smoke)
      CODEX_TASKS.md                ← handoff/CODEX_TASKS.md   (готові тексти завдань)
      CHANGELOG.md                  ← handoff/CHANGELOG.md     (зміни + статуси екранів)
      PATCHES.md                    ← handoff/frontend/PATCHES.md (етап 0)
      mockups/                      ← уся папка handoff/mockups/ як є
        *.dc.html                   (макети екранів)
        support.js, brand-listen.js (рантайм макетів; код з них НЕ переносити)
        public/brand/*, assets/*    (лого, знаки, фото)
  src/styles/tokens-v2.css          ← handoff/frontend/src/styles/tokens-v2.css
  src/styles/components-v2.css      ← handoff/frontend/src/styles/components-v2.css
  src/lib/uiVersion.ts              ← handoff/frontend/src/lib/uiVersion.ts
  public/brand/*                    ← з handoff/mockups/public/brand/ (ті самі імена файлів)
```

3. Закомітьте одним PR «docs: UI v2 handoff package». Код не змінюється, тільки документи й ассети.

Коли дизайн оновиться, повторіть кроки 1–3 і замініть `docs/ui-v2/` повністю. Старі версії не зберігайте. Кожен ZIP містить `CHANGELOG.md`: після заміни Codex читає нові записи зверху.

---

## 2. Що де лежить

| Файл | Навіщо | Коли читати |
|---|---|---|
| `docs/ui-v2/START_HERE.md` | Цей файл: як усе влаштовано | Перед першим завданням |
| `docs/DESIGN_SYSTEM.md` §5–12 | Токени, компоненти `.pc2-*`, правила стилю | Перед будь-якою версткою |
| `src/styles/tokens-v2.css`, `components-v2.css` | Єдине джерело кольорів, радіусів, класів | Завжди під рукою |
| `docs/ui-v2/MIGRATION_PLAN_V2.md` | Порядок PR (етапи 0–8), ризик, smoke для кожного | Щоб вибрати наступне завдання |
| `docs/ui-v2/TZ_CODEX.md` | **Поведінка кожного екрана**: стани, поля API, ⚠-застереження | Для кожного завдання — розділ свого екрана |
| `docs/ui-v2/CHANGELOG.md` | Що змінилось у кожній версії пакета, статуси екранів | Після кожного оновлення пакета |
| `docs/ui-v2/CODEX_TASKS.md` | Готові промпти + спільний блок правил | Коли людина дає завдання |
| `docs/ui-v2/mockups/*.dc.html` | **Як має виглядати** (точні відступи, кольори, тексти) | Для кожного завдання — свій макет |

Пріоритет при розбіжностях:
`tokens-v2.css` > `TZ_CODEX.md` > макет > поточний код (для вигляду).
Для логіки, API і роутів пріоритет у поточного коду: макет логіку не змінює, якщо в ТЗ прямо не сказано інше.

---

## 3. Як читати макет `.dc.html`

Макет — звичайний HTML-файл. Відкривати в браузері не обов’язково, все видно з розмітки.

```html
<x-dc>
  <helmet>…шрифти, @font-face…</helmet>
  <!-- РОЗМІТКА: inline-стилі = точні значення (px, hex, радіуси) -->
  <div style="padding:24px;border-radius:24px;background:#fff">
    {{ title }}                         ← дані з logic-класу нижче
    <sc-if value="{{ isEmpty }}">…</sc-if>    ← умовний блок (як v-if)
    <sc-for list="{{ items }}" as="i">…</sc-for> ← цикл (як v-for)
    <x-import component-from-global-scope="PCListen" …> ← знак «Вас почули» (BrandListen)
    <dc-import name="Cabinet-Drawer" …> ← інший макет усередині (спільний drawer)
  </div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"screen":{"options":[…]}}'>
  class Component extends DCLogic {   ← демо-логіка: стани, тексти, переходи
    renderVals() { return { title: '…', items: [...] } }
  }
</script>
```

- **Inline-стилі**: значення в макеті вже зведені до токенів. Hex-кольори переносьте через `var(--pc-*)`: таблиця відповідностей є в `DESIGN_SYSTEM.md` §5. Якщо для кольору немає токена, не вигадуйте свій: зупиніться й запитайте.
- **`data-props`** у `<script>` — перелік станів екрана, наприклад `screen: login|forgot|reset`, `access: trial|pending|…`, `loginIssue: none|unverified|blocked`. Кожне значення — окремий стан, який має бути у Vue.
- **`renderVals()`** — тексти, демо-дані й логіка переходів між станами. Тексти UI беріть звідси дослівно. Дані демо-шні: замінюйте реальними полями з API, назви полів є в `TZ_CODEX.md`.
- **`support.js`, `brand-listen.js`** — рантайм самих макетів. У застосунок не переносити. Аналог `brand-listen.js` — компонент `BrandListen` / клас `.pc2-listen` (див. `TZ_CODEX.md` §4.11).
- Ширини екранів: макети реагують на `window.innerWidth`. Брейкпоінти 768, 1024, 1180 px записані в `renderVals()` як `nar`, `single`, `wide`.

---

## 4. Карта: екран → макет → Vue → розділ ТЗ → етап плану

**Статуси дизайну** (джерело правди — ця таблиця і `CHANGELOG.md`):
- **DESIGN READY** — макет і розділ ТЗ зафіксовані, пункт плану можна брати в роботу.
- **DESIGN IN PROGRESS** — макет ще змінюється. **Не починати** реалізацію, навіть якщо файл макета вже є. Чекати, доки статус зміниться на READY у CHANGELOG.

Якщо екран READY змінився після мерджу — у CHANGELOG буде запис «оновлено після READY» з переліком змін; зроби PR-доповнення.

| Екран | Макет | Vue | ТЗ | План | Статус |
|---|---|---|---|---|---|
| Головна, хедер/футер | Home | HomeView, App.vue | §1.x, §4.11 | 1.1–1.2 | DESIGN READY |
| Реєстрація спеціаліста | Signup | SignupView | §1.3 | 1.3 | DESIGN READY |
| Профіль спеціаліста (публічний) | Specialist-Profile | PublicProfileView | §2.1 | 2.1 | DESIGN READY |
| Для клієнтів | For-Clients | новий роут `/for-clients` | §4.11 | — | DESIGN READY |
| Пошук | Find-Specialist | PublicTherapistsView | §2.2, §4.11 | 2.2 | DESIGN READY |
| Реєстрація клієнта | Client-Signup | ClientSignupView | §2.3 | 2.3 | DESIGN READY |
| Кабінет клієнта | Client-Cabinet | ClientDashboardView | §3.1, §4.11 | 3.1 | DESIGN READY |
| Вхід, пароль, email | Auth | Login/Forgot/Reset/VerifyEmail/AccountEmailChangeConfirm | «Етап 5a» | 5a.* | DESIGN READY |
| Матеріали, Мої спеціалісти, Профіль, Відгук, Групова подія, Щоденник (клієнт) | Client-Pages | ClientMaterials/Therapists/Profile/Feedback/GroupEvent; новий ClientDiaryView | «Етап 5b» | 5b.* | DESIGN READY |
| Кабінет спеціаліста | Cabinet-Dashboard + Cabinet-Drawer | CabinetView | §4.1 | 4.1a–b | DESIGN READY |
| Сесії | Sessions | TherapistSessions/SessionDetail | §4.2 | 4.2a–c | DESIGN READY |
| Клієнти, зошит | Clients | TherapistClients/ClientWorkbook | §4.3 | 4.3a–c | DESIGN READY |
| Адмінка | Admin | Admin*View | §4.9 | 4.9a–c | DESIGN READY |
| Мобільна версія кабінетів | Cabinet-Mobile | ті самі + App.vue | §4.10 | 4.10 | DESIGN READY |
| Мобільний кабінет, ч. 2: запити, розклад, завдання, аналітика, профіль | Cabinet-Mobile-2 | Inquiries/Slots/PracticeBoard/Analytics/TherapistProfile | §4.10 «Частина 2» | 4.10 | DESIGN READY |
| Клієнт, чат, гостьові на мобільному | Client-Mobile | ClientDashboard/ClientSessionDetail/Materials/Diary/Chat/Guest* | §4.10 «Клієнт, чат, гостьові» | 4.10 (разом з 3.1, 5b.*, 9.*, 10.3) | DESIGN READY |
| Публічні сторінки на мобільному | Public-Mobile | Home/ForClients/PublicTherapists/Auth/Signup | §4.10 «Публічні сторінки» | 4.10 (разом з 1.*, 2.2–2.3, 5a) | DESIGN READY |
| Онбординг спеціаліста | Onboarding (`stage`) | OnboardingWizardView, CabinetDashboard | «Онбординг спеціаліста» | 12.1–12.2 | DESIGN READY |
| Сповіщення | Notifications | шапка, NotificationsView, NotificationSettingsView | «Сповіщення» | 12.3–12.5 | DESIGN READY · ⚠ Telegram |
| Чат | Chat (`role`) | ChatView | «Чат» | 6.1 | DESIGN READY |
| Запити | Inquiries | SpecialistInquiriesView | «Запити» | 6.2 | DESIGN READY |
| Розклад | Schedule | SlotsView, AvailabilityRulesView | «Розклад» | 6.3–6.4 | DESIGN READY |
| Профіль (редагування) | Profile-Edit | TherapistProfileView | «Профіль спеціаліста» | 7.1 | DESIGN READY |
| Тарифи | Billing | BillingView | «Тарифи і доступ» | 7.2 | DESIGN READY |
| Налаштування | Settings | SettingsHubView, NotificationSettingsView | «Налаштування» | 7.3 | DESIGN READY |
| Завдання, Відгуки, Аналітика, Групові події, Блог | Specialist-Tools (`screen`) | PracticeBoard/Reviews/Analytics/GroupEvents/AuthorJournal | «Інструменти спеціаліста» | 8.* | DESIGN READY (аналітика й блог оновлено після READY, v6.3) |
| Гостьові: сесія, пропозиція часу, група | Guest (`screen`) | ExternalGuestSessionInvite/PublicGuestBookingTimeProposal/GroupInviteJoin | «Гостьові сторінки» | 9.* | DESIGN READY |
| Блог спеціаліста, FAQ | Public-Content (`screen`) | PublicJournal*, FaqView | «Публічний контент» | 10.1–10.2 | DESIGN READY |
| Деталі сесії клієнта, гостьова сесія, запрошення в кабінет | Session-Pages (`screen`) | ClientSessionDetail, ExternalSessionDetail, ClientRecordAccountInvite | «Сесії: деталі й запрошення» | 10.3–10.5 | DESIGN READY |
| Юридичні, 403, 404 | Service-Pages (`screen`, `doc`) | Terms/Privacy/…, Forbidden, NotFound | «Службові сторінки» | 10.6–10.7 | DESIGN READY |
| Листи (10 шаблонів) | Emails (`mail`) | бекенд: core/email.py, *_notifications.py | «Листи» | 11.* | DESIGN READY |
| Чат з підтримкою | Chat (тред support), Admin (`startScreen=support`) | ChatView, AdminSupportView + бекенд | «Чат» → підтримка, «Підтримка в адмінці» | 6.5 | DESIGN READY · ⚠ бекенд (оновлено після READY, v6.1) |
| Блог: розширений редактор | Specialist-Tools (blog) | AuthorJournalView | «Інструменти» → блог | 8.6 | DESIGN READY (оновлено після READY, v6) |
| Публічний профіль — доопрацювання | Specialist-Profile (`status`, `contacts`, `question`) | PublicProfileView | §2.1 «Оновлено після READY» | 2.1a | DESIGN READY (оновлено після READY, v6) |
| Публічний профіль — мобільна | Specialist-Profile-Mobile (`screen`) | PublicProfileView | §2.1 «Мобільна < 860px» | 2.1b | DESIGN READY |
| Картка профілю в месенджерах | Share-Card | бекенд public_metadata_views | §2.1 «Картка для месенджерів» | 2.1c | DESIGN READY · ⚠ бекенд |
| Бренд, знак, порожні стани | Brand | — | §4.11 | 4.11 | DESIGN READY |
| Специфікація компонентів | Handoff-Spec | — | — | 0 | DESIGN READY |

---

## 5. Як брати завдання (Codex)

1. Людина називає пункт плану, наприклад «6.2 Запити».
2. Прочитай:
   - рядок 6.2 у `MIGRATION_PLAN_V2.md`;
   - розділ «Запити» в `TZ_CODEX.md`;
   - макет `mockups/Inquiries.dc.html`, розмітку й `renderVals()`;
   - поточний `SpecialistInquiriesView.vue` і його `.spec.ts`.
3. Відповідай **планом**, ще нічого не змінюючи:
   - список файлів;
   - які стани з `data-props` / ТЗ ти реалізуєш;
   - що з макета **не** робиш і чому (немає API, окремий PR);
   - які тести додаєш або змінюєш.
4. Чекай «так». Потім роби тільки цей пункт.
5. В кінці:
   - `npm run test` для зачеплених spec;
   - `vue-tsc`;
   - `git diff --check`;
   - перелік змінених файлів;
   - чекліст з `MIGRATION_PLAN_V2.md` (v1 не змінився, 375/768/1280, клавіатура, стани).

### Статус екрана
Перед планом перевір статус у §4. DESIGN IN PROGRESS → не бери, відповідай «екран ще в дизайні».

### Позначка ⚠ у ТЗ
Усі ⚠ зібрані в `BACKEND_DECISIONS.md`. Пункт з ⚠ бери лише якщо там стоїть ✅.
Вона означає, що макет вимагає того, чого немає на бекенді: вхід за посиланням, щоденник, поля завдань, список «Мої спеціалісти» тощо. Тоді:
- **не вигадуй API і не імітуй дані**;
- зроби візуальну частину без цієї функції (кнопка прихована, вкладка вимкнена);
- у відповіді опиши, яких ендпоінтів або полів бракує. Це піде окремим завданням для бекенду.

### Чого не робити
- Не переносити JS-логіку з `renderVals()` як є. Це демо, у Vue є store й API.
- Не копіювати inline-стилі в компоненти. Тільки класи `.pc2-*` і `var(--pc-*)`. Якщо класу бракує, запропонуй додати його в `components-v2.css`.
- Не змінювати роути, валідацію, юридичні тексти (умови, політика, видалення даних), поки ТЗ прямо цього не каже.
- Не прибирати v1. Усе нове вмикається під `html[data-ui="v2"]` / `isUiV2()` до етапу 5 плану.
- Не використовувати `scrollIntoView` для навігації всередині сторінок. Прокручуйте контейнер (`el.scrollTo`).

---

## 6. Шаблон завдання (людина → Codex)

```
Контекст: UI v2. Прочитай docs/ui-v2/START_HERE.md (§3, §5), docs/DESIGN_SYSTEM.md §5–12,
src/styles/tokens-v2.css, src/styles/components-v2.css.

Завдання: пункт <N> з docs/ui-v2/MIGRATION_PLAN_V2.md — <назва>.
Макет: docs/ui-v2/mockups/<Файл>.dc.html (стани з data-props: <перелік або «усі»>).
ТЗ: docs/ui-v2/TZ_CODEX.md, розділ «<назва розділу>».
Vue: <файли>.

Спершу план і список файлів (§5 п.3), потім чекай «так».
```

Готові заповнені завдання для етапів 0–4 є в `CODEX_TASKS.md` §3. Для етапів 5a–8 користуйтеся шаблоном вище.

---

## 7. Блок для `AGENTS.md` (вставити в «Canonical Documentation»)

```
- UI v2 migration — start at `docs/ui-v2/START_HERE.md`.
  Mockups: `docs/ui-v2/mockups/*.dc.html` (inline styles = exact values; logic in <script data-dc-script> is demo only).
  Behaviour per screen: `docs/ui-v2/TZ_CODEX.md`. Order/risks: `docs/ui-v2/MIGRATION_PLAN_V2.md`.
  Never invent APIs for items marked ⚠ — implement the visual part, list missing endpoints.
```
