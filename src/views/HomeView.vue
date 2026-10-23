<template>
  <section v-if="isUiV2()" class="pc2-home">
    <div class="pc2-home__container">
      <section class="pc2-home__hero" aria-labelledby="home-hero-title">
        <img class="pc2-home__hero-mark" :src="homeMarkNavy" alt="" width="112" height="111" aria-hidden="true">
        <p class="pc2-home__eyebrow">Для психологів, терапевтів і консультантів</p>
        <h1 id="home-hero-title">Менше адміністрування.<br>Більше уваги до клієнта.</h1>
        <p class="pc2-home__lead">Публічна сторінка, запити, сесії й нотатки — один зрозумілий шлях від першого звернення до регулярної роботи.</p>
        <div class="pc2-home__actions">
          <button v-if="isAuthenticated" class="pc2-btn pc2-btn--primary" type="button" @click="goToCabinet">Перейти до кабінету</button>
          <RouterLink v-else class="pc2-btn pc2-btn--primary" to="/signup">Створити свій простір</RouterLink>
          <RouterLink class="pc2-btn pc2-btn--secondary" to="/specialists" @click="trackClientEntryCta">Знайти спеціаліста</RouterLink>
        </div>
        <p class="pc2-home__meta">Start — 0 грн · 30 днів Pro безкоштовно · 0% комісії з консультацій</p>
      </section>

      <section class="pc2-home__journey" aria-labelledby="workflow-title">
        <h2 id="workflow-title" class="pc2-home__sr-only">Від знайомства до регулярної роботи</h2>
        <div class="pc2-home__steps" role="group" aria-label="Етапи роботи">
          <button v-for="(step, index) in journeySteps" :key="step.label" class="pc2-home__step" type="button" :aria-pressed="activeJourneyStep === index" aria-controls="home-journey-panel" @click="activeJourneyStep = index">
            <span class="pc2-home__step-number" aria-hidden="true">{{ index + 1 }}</span>{{ step.label }}
          </button>
        </div>
        <div id="home-journey-panel" class="pc2-home__journey-panel" role="region" aria-label="Опис обраного етапу" aria-live="polite" aria-atomic="true">
          <div class="pc2-home__journey-copy">
            <p class="pc2-home__eyebrow">Крок {{ activeJourneyStep + 1 }} з 4</p>
            <h2>{{ journeySteps[activeJourneyStep]!.title }}</h2>
            <p>{{ journeySteps[activeJourneyStep]!.copy }}</p>
          </div>
          <div class="pc2-home__illustration">
            <p class="pc2-home__meta">Ілюстрація роботи сервісу</p>
            <div class="pc2-home__preview" :class="`pc2-home__preview--${activeJourneyStep}`">
              <span class="pc2-home__preview-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path v-for="path in iconPaths[journeySteps[activeJourneyStep]!.icon]" :key="path" :d="path" /></svg>
              </span>
              <h3>{{ journeySteps[activeJourneyStep]!.preview }}</h3>
              <p>{{ journeySteps[activeJourneyStep]!.detail }}</p>
              <div v-if="activeJourneyStep === 0" class="pc2-home__profile-preview" aria-hidden="true">
                <span>Підхід і теми роботи</span><span>Формат і вартість</span><span class="pc2-home__preview-action">Залишити запит</span>
              </div>
              <ol v-else-if="activeJourneyStep === 1" class="pc2-home__request-preview" aria-label="Шлях звернення">
                <li>Запит</li><li>Узгодження</li><li>Сесія</li>
              </ol>
              <div v-else-if="activeJourneyStep === 2" class="pc2-home__session-preview">
                <span>Час і формат консультації</span><span>За домовленістю</span>
              </div>
              <ul v-else class="pc2-home__work-preview">
                <li>Нотатки спеціаліста <span>Приватно</span></li>
                <li>Матеріали для клієнта <span>Лише опубліковані</span></li>
                <li>Оплати <span>Ручне підтвердження</span></li>
              </ul>
              <span class="pc2-home__status">{{ journeySteps[activeJourneyStep]!.status }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="pc2-home__truth" aria-labelledby="truth-title">
        <span class="pc2-home__peek" aria-hidden="true"><img :src="homeMarkBand" alt="" width="128" height="127" loading="lazy"></span>
        <h2 id="truth-title">Чесні умови для вашої практики</h2>
        <div><h3>0% комісії</h3><p>Клієнт оплачує консультацію напряму вам.</p></div>
        <div><h3>30 днів Pro</h3><p>Спробуйте розширені можливості безкоштовно.</p></div>
        <div><h3>Без рейтингів</h3><p>Клієнт обирає за своїм запитом і вашим підходом.</p></div>
      </section>

      <section id="features" class="pc2-home__section" aria-labelledby="value-title">
        <h2 id="value-title">Усе для практики — без зайвого</h2>
        <div class="pc2-home__bento">
          <article v-for="feature in homeV2Features" :key="feature.key" class="pc2-home__feature pc2-card" :class="`pc2-home__feature--${feature.key}`">
            <div class="pc2-home__feature-copy">
              <p class="pc2-home__eyebrow">{{ feature.scope }}</p>
              <div><h3>{{ feature.title }}</h3><p>{{ feature.copy }}</p></div>
            </div>
            <div v-if="feature.key === 'profile'" class="pc2-home__mini-profile" aria-label="Ілюстрація професійної сторінки">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path v-for="path in iconPaths.profile" :key="path" :d="path" /></svg>
              <span>Ваша професійна сторінка</span><span>Підхід · теми · формат</span>
              <span class="pc2-home__preview-action">Залишити запит</span>
            </div>
            <div v-if="feature.key === 'sessions'" class="pc2-home__mini-calendar" aria-label="Ілюстрація організації сесій">
              <span>Час консультації</span><span>Посилання на зустріч</span><span>Підтвердження спеціаліста</span>
            </div>
          </article>
        </div>
      </section>

      <section class="pc2-home__blog" aria-labelledby="blog-title">
        <div><h2 id="blog-title">Дайте клієнту можливість познайомитись з вами до консультації</h2><p>Не кожен готовий звернутись одразу. Професійна сторінка і власний блог допомагають зрозуміти ваш підхід.</p></div>
        <ul class="pc2-home__blog-formats" aria-label="Можливості власного блогу">
          <li v-for="format in homeV2BlogFormats" :key="format.title" class="pc2-card"><span>{{ format.label }}</span><h3>{{ format.title }}</h3><p>{{ format.copy }}</p></li>
        </ul>
      </section>
      <section class="pc2-home__client" aria-labelledby="client-entry-title">
        <img :src="homeMarkNavy" alt="" width="56" height="55" loading="lazy" aria-hidden="true">
        <div><h2 id="client-entry-title">Шукаєте спеціаліста для себе?</h2><p>Опишіть запит і зверніться напряму. Без обов'язкової реєстрації для першого звернення.</p></div>
        <RouterLink class="pc2-btn pc2-btn--primary" to="/specialists" @click="trackClientEntryCta">Знайти спеціаліста</RouterLink>
      </section>
      <section id="pricing" class="pc2-home__pricing" aria-labelledby="pricing-title">
        <div class="pc2-home__pricing-header">
        <div class="pc2-home__heading">
          <h2 id="pricing-title" class="pc2-home__title">Тарифи</h2>
          <p class="pc2-home__lead">
            Start — для знайомства з Pro Consult і невеликої практики. Pro — для регулярної роботи з більшою кількістю клієнтів і розширеними інструментами.
          </p>
        </div>

        <div class="pc2-home__cycles" role="group" aria-label="Період оплати">
          <button
            class="pc2-home__cycle"
            :aria-pressed="billingCycle === 'monthly'"
            type="button"
            @click="billingCycle = 'monthly'"
          >
            Місяць
          </button>
          <button
            class="pc2-home__cycle"
            :aria-pressed="billingCycle === 'yearly'"
            type="button"
            @click="billingCycle = 'yearly'"
          >
            Рік
          </button>
        </div>

        </div>
        <div class="pc2-home__plans">
          <article v-for="plan in pricingPlans" :key="plan.name" class="pc2-home__plan" :class="{ 'pc2-home__plan--pro': plan.name === 'Pro' }">
            <p v-if="plan.badge" class="pc2-home__plan-badge">{{ plan.badge }}</p>
            <h3>{{ plan.name }}</h3>
            <p class="pc2-home__plan-price">{{ plan.price }}</p>
            <p class="pc2-home__plan-scenario">{{ plan.scenario }}</p>
            <p v-if="plan.helper" class="pc2-home__plan-helper">{{ plan.helper }}</p>
            <ul>
              <li v-for="feature in plan.features" :key="feature">{{ feature }}</li>
            </ul>
            <p v-if="plan.note" class="pc2-home__plan-note">{{ plan.note }}</p>
            <RouterLink class="pc2-btn pc2-btn--primary" :class="{ 'pc2-btn--secondary': plan.ghostCta }" :to="plan.ctaTo">{{ plan.ctaLabel }}</RouterLink>
          </article>
        </div>
        <article class="pc2-home__conditions" aria-labelledby="commission-title">
          <div>
            <h3 id="commission-title">Ваш дохід від консультацій залишається вашим</h3>
            <p>Pro Consult не бере відсоток із консультацій. Клієнт оплачує безпосередньо спеціалісту, а в кабінеті ви контролюєте статуси та історію оплат.</p>
            <p>Ви оплачуєте доступ до професійного простору — не комісію з кожної проведеної консультації.</p>
          </div>
        </article>
        <article class="pc2-home__conditions" aria-labelledby="trial-title">
          <div>
            <h3 id="trial-title">30 днів Pro безкоштовно</h3>
            <p>Після реєстрації ви отримуєте 30 днів доступу до розширених можливостей Pro Consult без оплати.</p>
            <p>Спробуйте Pro на своїй реальній практиці: працюйте з клієнтами, ведіть сесії, контролюйте оплати, використовуйте блог, матеріали, аналітику та інші інструменти.</p>
            <p>Після 30 днів вирішіть, що підходить саме вам: залишитись на Start, розширити ліміт клієнтів або продовжити роботу на Pro.</p>
          </div>
          <RouterLink class="pc2-btn pc2-btn--secondary" to="/signup">Спробувати Pro 30 днів безкоштовно</RouterLink>
        </article>
        <article class="pc2-home__conditions" aria-labelledby="leader-custom-title">
          <div>
            <h3 id="leader-custom-title">Потрібно більше простору для практики?</h3>
            <p>
              Для спеціалістів із більшим навантаженням можемо підібрати індивідуальний
              формат: до 60 активних клієнтів, розширена аналітика, до 3 дошок задач і
              пріоритетна підтримка.
            </p>
          </div>
          <RouterLink class="pc2-btn pc2-btn--secondary" to="/support-and-data-requests">Обговорити формат</RouterLink>
        </article>
        <article class="pc2-home__limits" aria-labelledby="pricing-details-title">
          <div>
            <h3 id="pricing-details-title">Як рахуються ліміти</h3>
            <p>
              Активний клієнт — це клієнт, з яким ви ведете поточну роботу в кабінеті.
            </p>
          </div>
          <ul>
            <li v-for="detail in pricingLimitDetails" :key="detail">{{ detail }}</li>
          </ul>
        </article>
      </section>


      <section class="pc2-home__final" aria-labelledby="home-final-title">
        <h2 id="home-final-title">Створіть свій простір за кілька хвилин</h2>
        <RouterLink v-if="!isAuthenticated" class="pc2-btn pc2-btn--primary" to="/signup">Створити свій простір</RouterLink>
        <button v-else class="pc2-btn pc2-btn--primary" type="button" @click="goToCabinet">Створити свій простір</button>
      </section>
    </div>
  </section>
  <section v-else class="home-lite">
    <div class="home-lite__container">
      <section class="home-hero reveal" aria-labelledby="home-hero-title">
        <span class="home-hero__wash home-hero__wash--teal" aria-hidden="true"></span>
        <span class="home-hero__wash home-hero__wash--peach" aria-hidden="true"></span>
        <div class="home-hero__content">
          <h1 id="home-hero-title" class="home-hero__title">
            Консультаційна практика — в одному спокійному просторі
          </h1>
          <p class="home-hero__subtitle">
            Професійно представте себе, отримуйте звернення від клієнтів і ведіть регулярну консультаційну практику — сесії, календар, клієнтів, матеріали та щоденну роботу в одному місці.
          </p>
          <ul class="home-hero__principles" aria-label="Принципи Pro Consult">
            <li>Клієнти можуть знайти вас і звернутись напряму</li>
            <li><strong>0% комісії</strong> — клієнт оплачує консультацію напряму вам</li>
            <li>Без рейтингів</li>
          </ul>
          <div class="home-hero__actions">
            <button v-if="isAuthenticated" class="btn" type="button" @click="goToCabinet">
              Перейти до кабінету
              <span class="btn__arrow" aria-hidden="true">→</span>
            </button>
            <RouterLink v-else class="btn" to="/signup">
              Створити свій простір
              <span class="btn__arrow" aria-hidden="true">→</span>
            </RouterLink>
            <RouterLink class="btn btn--ghost" to="/specialists" @click="trackClientEntryCta">
              Знайти спеціаліста
            </RouterLink>
          </div>
        </div>

        <div class="home-hero__visual" aria-hidden="true">
          <article class="product-story">
            <span class="product-story__accent product-story__accent--peach"></span>
            <span class="product-story__accent product-story__accent--teal"></span>
            <span class="product-story__accent product-story__accent--dots"></span>
            <div class="product-story__dashboard-card">
              <header class="product-story__dashboard-header">
                <span class="product-story__dashboard-title">
                  <svg class="product-story__section-icon" viewBox="0 0 24 24" focusable="false">
                    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H10l2 2h5.5A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
                  </svg>
                  <strong>Кабінет спеціаліста</strong>
                </span>
                <span class="product-story__top-actions">
                  <span class="product-story__top-status product-story__top-status--live">Сьогодні</span>
                  <span class="product-story__top-status">2 нові запити</span>
                </span>
              </header>
              <div class="product-story__dashboard-shell">
                <aside class="product-story__rail">
                  <span class="product-story__rail-icon product-story__rail-icon--profile is-active">
                    <svg viewBox="0 0 24 24" focusable="false">
                      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                      <path d="M5 20a7 7 0 0 1 14 0" />
                    </svg>
                  </span>
                  <span class="product-story__rail-icon product-story__rail-icon--request">
                    <svg viewBox="0 0 24 24" focusable="false">
                      <path d="M5 7.5A3.5 3.5 0 0 1 8.5 4h7A3.5 3.5 0 0 1 19 7.5v4A3.5 3.5 0 0 1 15.5 15H11l-4 3v-3.2A3.5 3.5 0 0 1 5 11.5v-4Z" />
                    </svg>
                  </span>
                  <span class="product-story__rail-icon product-story__rail-icon--calendar">
                    <svg viewBox="0 0 24 24" focusable="false">
                      <path d="M7 4v3M17 4v3M5 9h14" />
                      <path d="M6.5 6h11A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-9A2.5 2.5 0 0 1 6.5 6Z" />
                    </svg>
                  </span>
                  <span class="product-story__rail-icon product-story__rail-icon--document">
                    <svg viewBox="0 0 24 24" focusable="false">
                      <path d="M7 4h7l4 4v12H7V4Z" />
                      <path d="M14 4v5h4M9.5 13h5M9.5 16h5" />
                    </svg>
                  </span>
                </aside>
                <div class="product-story__dashboard-main">
                  <div class="product-story__overview-label">Огляд</div>
                  <div class="product-story__dashboard-body">
                    <div class="product-story__stat product-story__stat--teal">
                      <span>Нових запитів</span>
                      <strong>2</strong>
                      <em>за сьогодні</em>
                    </div>
                    <div class="product-story__stat product-story__stat--peach">
                      <span>Сесій цього тижня</span>
                      <strong>8</strong>
                      <em>заплановано</em>
                    </div>
                    <div class="product-story__stat product-story__stat--lavender">
                      <span>Клієнтів</span>
                      <strong>12</strong>
                      <em>активних</em>
                    </div>
                  </div>
                  <div class="product-story__requests">
                    <span>Останні запити</span>
                    <p>
                      <strong>Марія П.</strong>
                      <small>Тривога, стрес</small>
                      <em>10 хв тому</em>
                    </p>
                    <p>
                      <strong>Андрій К.</strong>
                      <small>Самооцінка</small>
                      <em>1 год тому</em>
                    </p>
                    <p>
                      <strong>Ірина С.</strong>
                      <small>Стосунки</small>
                      <em>2 год тому</em>
                    </p>
                    <span class="product-story__requests-link">Всі запити →</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="product-story__public-card">
              <header class="product-story__header">
                <span>
                  <svg class="product-story__section-icon" viewBox="0 0 24 24" focusable="false">
                    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                    <path d="M5 20a7 7 0 0 1 14 0" />
                  </svg>
                  Професійна сторінка
                </span>
              </header>
              <div class="product-story__profile">
                <img
                  class="product-story__portrait-photo"
                  :src="heroSpecialistDemo"
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <div class="product-story__copy">
                  <strong>Олена Коваль</strong>
                  <span>Психолог, гештальт-терапевт</span>
                  <div class="product-story__meta">
                    <span>12 років досвіду</span>
                    <span>Онлайн і офлайн</span>
                  </div>
                  <p>Допомагаю знаходити опору, краще розуміти себе та будувати гармонійні стосунки.</p>
                </div>
              </div>
              <div class="product-story__chips">
                <span>Тривога</span>
                <span>Самооцінка</span>
                <span>Стосунки</span>
              </div>
              <div class="product-story__profile-actions">
                <span class="product-story__profile-cta">Залишити запит</span>
                <span class="product-story__profile-save">
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path d="M7 4h7l4 4v12H7V4Z" />
                    <path d="M14 4v5h4M9.5 13h5M9.5 16h5" />
                  </svg>
                </span>
              </div>
            </div>

            <div class="product-story__request-card">
              <span class="product-story__request-icon">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M5 7.5A3.5 3.5 0 0 1 8.5 4h7A3.5 3.5 0 0 1 19 7.5v4A3.5 3.5 0 0 1 15.5 15H11l-4 3v-3.2A3.5 3.5 0 0 1 5 11.5v-4Z" />
                  <path d="M9 9h6M9 12h4" />
                </svg>
              </span>
              <span class="product-story__request-badge">2</span>
              <span class="product-story__request-label">Новий запит</span>
              <p>Клієнт залишив контакт і повідомлення.</p>
              <span class="product-story__request-action">Опрацювати →</span>
            </div>

            <div class="product-story__calendar-card">
              <span class="product-story__calendar-icon">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M7 4v3M17 4v3M5 9h14" />
                  <path d="M6.5 6h11A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-9A2.5 2.5 0 0 1 6.5 6Z" />
                </svg>
              </span>
              <span class="product-story__calendar-label">Сьогодні</span>
              <strong>15:00</strong>
              <p>Консультація з клієнтом</p>
              <span class="product-story__calendar-status">Підтверджено</span>
              <div class="product-story__time-rail">
                <span>14:00</span>
                <span class="is-current">15:00</span>
                <span>16:00</span>
                <span>17:00</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="workflow-section reveal" aria-labelledby="workflow-title">
        <div class="section-head section-head--center">
          <h2 id="workflow-title" class="section-head__title">Від першого знайомства — до регулярної роботи</h2>
          <p class="section-head__subtitle">
            Pro Consult поєднує вашу професійну сторінку з робочим простором для регулярної консультаційної практики.
          </p>
        </div>
        <div class="workflow-grid" role="list" aria-label="Від знайомства до регулярної роботи в Pro Consult">
          <article v-for="(step, index) in workflowSteps" :key="step.title" class="workflow-card" role="listitem">
            <span class="workflow-card__number">{{ index + 1 }}</span>
            <h3>{{ step.title }}</h3>
            <p>{{ step.copy }}</p>
          </article>
        </div>
      </section>

      <section class="trust-strip reveal" aria-label="Безпека старту в Pro Consult">
        <span v-for="item in trustItems" :key="item">{{ item }}</span>
      </section>

      <section id="features" class="value-section reveal" aria-labelledby="value-title">
        <div class="section-head section-head--center">
          <h2 id="value-title" class="section-head__title">
            Дві сторони одного професійного простору
          </h2>
          <p class="section-head__subtitle">
            Професійна сторінка допомагає представити себе, свій підхід і послуги клієнтам. А робочий кабінет — організувати звернення, записи, сесії, календар, матеріали та щоденну роботу з практикою.
          </p>
        </div>
        <section v-for="group in capabilityGroups" :key="group.id" class="value-group" :aria-labelledby="group.id">
          <h3 :id="group.id" class="value-group__title">{{ group.title }}</h3>
          <div class="value-grid" role="list" :aria-label="group.title">
            <article v-for="item in group.items" :key="item.title" class="value-card" role="listitem">
              <span class="icon-wrap" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path v-for="path in iconPaths[item.icon]" :key="path" :d="path"></path>
                </svg>
              </span>
              <h4>{{ item.title }}</h4>
              <p>{{ item.copy }}</p>
            </article>
          </div>
        </section>
      </section>

      <section class="blog-section reveal" aria-labelledby="blog-title">
        <div class="section-head">
          <h2 id="blog-title" class="section-head__title">Дайте клієнту можливість познайомитись з вами до консультації</h2>
        </div>
        <div class="blog-section__copy">
          <p>
            Не кожен готовий звернутись одразу.
          </p>
          <p>
            Професійна сторінка і власний блог допомагають клієнту зрозуміти, з чим ви працюєте, як мислите і чи відгукується йому ваш підхід.
          </p>
          <p>
            Публікуйте статті, відповіді на часті запитання та матеріали, які ви хочете зробити доступними клієнтам.
          </p>
        </div>
      </section>

      <section class="client-entry-section reveal" aria-labelledby="client-entry-title">
        <div>
          <h2 id="client-entry-title" class="section-head__title">Шукаєте спеціаліста?</h2>
          <p>Опишіть свій запит або оберіть напрям, перегляньте професійні сторінки й зверніться напряму до спеціаліста, який вам підходить.</p>
          <p>Без обов'язкової реєстрації для першого звернення.</p>
        </div>
        <RouterLink class="btn" to="/specialists" @click="trackClientEntryCta">Знайти спеціаліста</RouterLink>
      </section>

      <section id="pricing" class="pricing reveal" aria-labelledby="pricing-title">
        <div class="section-head section-head--center pricing-head">
          <h2 id="pricing-title" class="section-head__title pricing-title">Тарифи</h2>
          <p class="section-head__subtitle">
            Start — для знайомства з Pro Consult і невеликої практики. Pro — для регулярної роботи з більшою кількістю клієнтів і розширеними інструментами.
          </p>
        </div>

        <div class="pricing-toggle" role="group" aria-label="Період оплати">
          <button
            class="pricing-toggle__btn"
            :class="{ 'is-active': billingCycle === 'monthly' }"
            type="button"
            @click="billingCycle = 'monthly'"
          >
            Місяць
          </button>
          <button
            class="pricing-toggle__btn"
            :class="{ 'is-active': billingCycle === 'yearly' }"
            type="button"
            @click="billingCycle = 'yearly'"
          >
            Рік
          </button>
        </div>

        <div class="pricing__grid">
          <article v-for="plan in pricingPlans" :key="plan.name" class="plan-card" :class="{ 'plan-card--pro': plan.name === 'Pro' }">
            <p v-if="plan.badge" class="plan-card__badge">{{ plan.badge }}</p>
            <h3>{{ plan.name }}</h3>
            <p class="plan-card__price">{{ plan.price }}</p>
            <p class="plan-card__scenario">{{ plan.scenario }}</p>
            <p v-if="plan.helper" class="plan-card__helper">{{ plan.helper }}</p>
            <ul>
              <li v-for="feature in plan.features" :key="feature">{{ feature }}</li>
            </ul>
            <p v-if="plan.note" class="plan-card__note">{{ plan.note }}</p>
            <RouterLink class="btn" :class="{ 'btn--ghost': plan.ghostCta }" :to="plan.ctaTo">{{ plan.ctaLabel }}</RouterLink>
          </article>
        </div>
        <article class="pricing-founder" aria-labelledby="commission-title">
          <div>
            <h3 id="commission-title">Ваш дохід від консультацій залишається вашим</h3>
            <p>Pro Consult не бере відсоток із консультацій. Клієнт оплачує безпосередньо спеціалісту, а в кабінеті ви контролюєте статуси та історію оплат.</p>
            <p>Ви оплачуєте доступ до професійного простору — не комісію з кожної проведеної консультації.</p>
          </div>
        </article>
        <article class="pricing-founder" aria-labelledby="trial-title">
          <div>
            <h3 id="trial-title">30 днів Pro безкоштовно</h3>
            <p>Після реєстрації ви отримуєте 30 днів доступу до розширених можливостей Pro Consult без оплати.</p>
            <p>Спробуйте Pro на своїй реальній практиці: працюйте з клієнтами, ведіть сесії, контролюйте оплати, використовуйте блог, матеріали, аналітику та інші інструменти.</p>
            <p>Після 30 днів вирішіть, що підходить саме вам: залишитись на Start, розширити ліміт клієнтів або продовжити роботу на Pro.</p>
          </div>
          <RouterLink class="btn btn--ghost" to="/signup">Спробувати Pro 30 днів безкоштовно</RouterLink>
        </article>
        <article class="pricing-custom" aria-labelledby="leader-custom-title">
          <div>
            <h3 id="leader-custom-title">Потрібно більше простору для практики?</h3>
            <p>
              Для спеціалістів із більшим навантаженням можемо підібрати індивідуальний
              формат: до 60 активних клієнтів, розширена аналітика, до 3 дошок задач і
              пріоритетна підтримка.
            </p>
          </div>
          <RouterLink class="btn btn--ghost" to="/support-and-data-requests">Обговорити формат</RouterLink>
        </article>
        <article class="pricing-details" aria-labelledby="pricing-details-title">
          <div>
            <h3 id="pricing-details-title">Як рахуються ліміти</h3>
            <p>
              Активний клієнт — це клієнт, з яким ви ведете поточну роботу в кабінеті.
            </p>
          </div>
          <ul>
            <li v-for="detail in pricingLimitDetails" :key="detail">{{ detail }}</li>
          </ul>
        </article>
      </section>

      <section class="final-cta reveal">
        <div class="final-cta__actions">
          <RouterLink v-if="!isAuthenticated" class="btn" to="/signup">Створити свій простір</RouterLink>
          <button v-else class="btn" type="button" @click="goToCabinet">Створити свій простір</button>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { productAnalytics } from '../lib/productAnalytics'
import homeMarkNavy from '../assets/home-v2/mark-navy.png'
import homeMarkBand from '../assets/home-v2/mark-band.png'
import { isUiV2 } from '../lib/uiVersion'
import heroSpecialistDemo from '../assets/home/hero-specialist-demo.webp'

type IconKey =
  | 'profile'
  | 'booking'
  | 'session'
  | 'clients'
  | 'payments'
  | 'materials'
  | 'feedback'
  | 'analytics'
  | 'security'
  | 'support'

const router = useRouter()
const auth = useAuthStore()
const isAuthenticated = computed(() => Boolean(auth.accessToken))
const roles = computed(() => auth.me?.user.roles ?? auth.user?.roles ?? [])
const billingCycle = ref<'monthly' | 'yearly'>('monthly')
let clientEntryCtaTracked = false

// Presentation only: all navigation, pricing and attribution remain shared with v1.
const activeJourneyStep = ref(0)
const journeySteps: Array<{ label: string; title: string; copy: string; icon: IconKey; preview: string; detail: string; status: string }> = [
  { label: 'Профіль', title: 'Покажіть свою практику', copy: 'Створіть професійну сторінку: розкажіть про свій підхід, теми роботи, формат консультацій і вартість. Ви самі вирішуєте, коли її публікувати.', icon: 'profile', preview: 'Професійна сторінка', detail: 'Ваш підхід · теми роботи · формат консультацій', status: 'Публікація під вашим контролем' },
  { label: 'Запит', title: 'Знайомство починається із запиту', copy: 'Клієнт переглядає вашу сторінку й залишає звернення без обов’язкової реєстрації. Запит не є підтвердженим записом: деталі та час ви погоджуєте разом.', icon: 'booking', preview: 'Звернення від клієнта', detail: 'Запит → обговорення деталей → погодження часу', status: 'Потребує погодження' },
  { label: 'Сесія', title: 'Проведіть консультацію', copy: 'Погоджуйте час, плануйте сесії та тримайте робочий календар в одному місці. Клієнт оплачує консультацію безпосередньо вам.', icon: 'session', preview: 'Планування сесії', detail: 'Формат і час — за домовленістю зі спеціалістом', status: 'Час погоджується окремо' },
  { label: 'Подальша робота', title: 'Продовжуйте роботу з клієнтом', copy: 'Регулярні сесії, приватні нотатки, матеріали й задачі залишаються в контексті вашої роботи. Клієнту відкривається лише те, чим ви свідомо ділитеся.', icon: 'materials', preview: 'Контекст роботи', detail: 'Сесії · приватні нотатки · матеріали · задачі', status: 'Приватність під вашим контролем' },
]


// Claude snapshot 2026-10-23-265f221a: presentation only, no simulated account data.
const homeV2Features = [
  { key: 'profile', scope: 'Публічне', title: 'Професійна сторінка', copy: 'Підхід, теми, формат і вартість — на сторінці, якою зручно ділитися.' },
  { key: 'requests', scope: 'Публічне', title: 'Запит без реєстрації', copy: 'Клієнту не обов’язково мати кабінет. Запит потребує вашого погодження.' },
  { key: 'discovery', scope: 'Публічне', title: 'Блог і пошук', copy: 'Клієнти можуть познайомитися з вашим підходом і знайти вашу сторінку. Без рейтингів.' },
  { key: 'notes', scope: 'Приватне', title: 'Нотатки', copy: 'Внутрішні записи спеціаліста залишаються приватними. Матеріали для клієнта публікуються окремо.' },
  { key: 'sessions', scope: 'Приватне', title: 'Сесії та календар', copy: 'Час, посилання й підтвердження — в одному робочому просторі.' },
  { key: 'payments', scope: 'Приватне', title: 'Оплати', copy: 'Клієнт оплачує напряму вам. Тут ви фіксуєте й підтверджуєте статуси оплат.' },
]
const homeV2BlogFormats = [
  { label: 'Статті', title: 'Розкажіть про свій підхід', copy: 'Публікуйте власні тексти для знайомства з вашою практикою.' },
  { label: 'Часті питання', title: 'Поясніть, як проходить робота', copy: 'Дайте відповіді на питання перед першим зверненням.' },
  { label: 'Матеріали', title: 'Поділіться корисним', copy: 'Ви самі обираєте, що публікувати для читачів.' },
]


function trackClientEntryCta() {
  if (clientEntryCtaTracked) return
  clientEntryCtaTracked = true
  productAnalytics.capture('client_entry_cta_clicked')
}

const iconPaths: Record<IconKey, string[]> = {
  profile: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M4 20a8 8 0 0 1 16 0'],
  booking: ['M7 3v3M17 3v3M4 9h16', 'M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z'],
  session: ['M9 8.5v7l6-3.5-6-3.5Z', 'M4 6h16v12H4z'],
  clients: ['M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z', 'M16 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z', 'M3.5 20a5 5 0 0 1 9 0', 'M13 20a4 4 0 0 1 7 0'],
  payments: ['M3 7h18v10H3z', 'M3 11h18', 'M7 15h3'],
  materials: ['M7 3h7l4 4v14H7z', 'M14 3v4h4', 'M10 13h5M10 17h5'],
  feedback: ['M4 5h16v10H8l-4 4V5z', 'M8 9h8M8 12h5'],
  analytics: ['M5 19V9', 'M12 19V5', 'M19 19v-7'],
  security: ['M12 3l7 3v5c0 4.5-3 7.8-7 10-4-2.2-7-5.5-7-10V6l7-3Z', 'M9.5 12.5 11.2 14.2 14.8 10.6'],
  support: ['M12 18v2', 'M8.5 9.5a3.5 3.5 0 1 1 6.2 2.2c-.9.8-1.7 1.3-1.7 2.3v.5', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z'],
}

const capabilityGroups: Array<{
  id: string
  title: string
  items: Array<{ icon: IconKey; title: string; copy: string }>
}> = [
  {
    id: 'practice-presence-title',
    title: 'Покажіть свою практику',
    items: [
      { icon: 'profile', title: 'Професійна сторінка', copy: 'Покажіть, хто ви, з чим працюєте, як консультуєте та як до вас звернутись.' },
      { icon: 'booking', title: 'Звернення без реєстрації', copy: 'Клієнту не обов’язково створювати кабінет, щоб зробити перший крок.' },
      { icon: 'feedback', title: 'Власний блог', copy: 'Публікуйте тексти, які допомагають зрозуміти ваш підхід ще до першої консультації.' },
      { icon: 'clients', title: 'Пошук спеціалістів', copy: 'Клієнти можуть знайти спеціаліста за своїм запитом і звернутись напряму.' },
    ],
  },
  {
    id: 'practice-work-title',
    title: 'Ведіть свою практику',
    items: [
      { icon: 'session', title: 'Сесії та календар', copy: 'Плануйте консультації, погоджуйте час і тримайте робочий розклад в одному місці.' },
      { icon: 'clients', title: 'Робота з клієнтами', copy: 'Тримайте поточну консультаційну роботу в одному контексті.' },
      { icon: 'materials', title: 'Приватні нотатки та матеріали', copy: 'Внутрішні записи спеціаліста залишаються приватними, а клієнту відкривається лише те, чим ви свідомо ділитесь.' },
      { icon: 'analytics', title: 'Задачі та організація практики', copy: 'Плануйте власну роботу без окремого набору таблиць і списків.' },
      { icon: 'payments', title: 'Оплати під контролем', copy: 'Клієнт оплачує консультацію безпосередньо вам. У Pro Consult ви можете відстежувати статуси оплат, бачити їхню історію, працювати з підтвердженнями та фіксувати отримані оплати.' },
    ],
  },
]

const workflowSteps = [
  {
    title: 'Покажіть свою практику',
    copy: 'Створіть професійну сторінку: розкажіть про себе, свій підхід, теми роботи, формат консультацій і вартість.',
  },
  {
    title: 'Отримайте звернення',
    copy: 'Клієнт може знайти вас у Pro Consult або перейти за вашим посиланням, познайомитись з вами й залишити запит без реєстрації чи записатись на сесію.',
  },
  {
    title: 'Проведіть консультацію',
    copy: 'Погоджуйте час, плануйте сесії та тримайте робочий календар в одному місці.',
  },
  {
    title: 'Продовжуйте роботу з клієнтом',
    copy: 'Регулярні сесії, приватні нотатки та матеріали залишаються в контексті вашої роботи з клієнтом.',
  },
  {
    title: 'Тримайте практику в порядку',
    copy: 'Керуйте клієнтами, задачами й робочими процесами без набору розрізнених інструментів.',
  },
]

const trustItems = [
  'Діліться сторінкою у своїх каналах',
  'Клієнт може звернутись без реєстрації',
  'Без комісій з консультацій',
  'Ви самі вирішуєте, коли публікувати сторінку',
  'Start — 0 грн',
]

const pricingPlans = computed(() => [
  {
    name: 'Start',
    price: '0 грн',
    scenario: 'Для невеликої практики та знайомства з основними можливостями Pro Consult.',
    helper: '',
    badge: '',
    features: [
      'Професійна публічна сторінка',
      'Запити від клієнтів без обов’язкової реєстрації на сайті',
      'Простір для ведення сесій, календаря і ваших перших клієнтів',
      '3 активні клієнти включено',
      'Можна розширити ліміт до 6 клієнтів',
    ],
    note: '',
    ctaLabel: 'Отримати безкоштовно',
    ctaTo: '/signup',
    ghostCta: false,
  },
  {
    name: 'Pro',
    price: billingCycle.value === 'monthly' ? '990 грн/міс' : '9 900 грн/рік',
    scenario: 'Для регулярної приватної практики.',
    helper: billingCycle.value === 'yearly' ? 'Оплата за рік' : 'Оплата щомісяця',
    badge: 'Для активної практики',
    features: [
      'Усе зі Start',
      '20 активних клієнтів включено',
      'Можна розширити ліміт до 26 клієнтів',
      'Власний блог',
      'Матеріали й рекомендації для клієнтів',
      'Розширена аналітика практики',
      'Робоча дошка для кращої організації практики',
      'Приватні відгуки від клієнтів',
    ],
    note: '',
    ctaLabel: 'Обрати Pro',
    ctaTo: '/signup',
    ghostCta: false,
  },
])

const pricingLimitDetails = [
  'Для Start і Pro доступне розширення ліміту активних клієнтів.',
  'Pro Consult не бере відсоток із консультацій на жодному тарифі.',
]

const resolveCabinetRoute = () => {
  if (roles.value.includes('SPECIALIST') || roles.value.includes('THERAPIST')) return '/cabinet'
  if (roles.value.includes('CLIENT')) return '/client'
  return '/login'
}

const goToCabinet = async () => {
  if (!auth.accessToken) {
    await router.push('/login')
    return
  }
  if (!auth.me) {
    try {
      await auth.loadMe()
    } catch {
      await router.push('/login')
      return
    }
  }
  await router.push(resolveCabinetRoute())
}

let revealObserver: IntersectionObserver | null = null

function setupRevealObserver() {
  revealObserver?.disconnect()
  revealObserver = null
  const targets = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))
  if (!targets.length) return

  const hasHashOnLoad = typeof window !== 'undefined' && Boolean(window.location.hash)
  if (hasHashOnLoad || typeof IntersectionObserver === 'undefined') {
    targets.forEach((el) => el.classList.add('is-visible'))
    return
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          revealObserver?.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.02, rootMargin: '0px 0px 14% 0px' }
  )

  targets.forEach((el) => revealObserver?.observe(el))
}

onMounted(setupRevealObserver)
watch(isUiV2, setupRevealObserver, { flush: 'post' })

onBeforeUnmount(() => {
  revealObserver?.disconnect()
  revealObserver = null
})
</script>

<style scoped>
.home-lite {
  position: relative;
  isolation: isolate;
  overflow-x: hidden;
  padding: 28px 0 68px;
}

.home-lite::before {
  content: '';
  position: absolute;
  inset: -160px 0 0;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(1200px 540px at 16% 8%, rgba(17, 89, 69, 0.11), transparent 72%),
    radial-gradient(960px 420px at 88% 14%, rgba(219, 120, 39, 0.09), transparent 74%),
    linear-gradient(180deg, rgba(245, 247, 242, 0.86) 0%, rgba(247, 248, 251, 0.96) 100%);
}

.home-lite__container {
  width: min(var(--pc-container-wide), calc(100% - 48px));
  margin: 0 auto;
  display: grid;
  gap: 46px;
}

.home-hero {
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-2xl);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), var(--pc-bg-main));
  box-shadow: var(--pc-shadow-card);
  padding: clamp(24px, 3.6vw, 48px);
  display: grid;
  grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);
  gap: clamp(22px, 3vw, 38px);
  align-items: center;
  overflow: hidden;
}

.home-hero__content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}

.home-hero__eyebrow,
.section-head__eyebrow {
  margin: 0;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--pc-text-muted);
  font-weight: 700;
}

.home-hero__title {
  margin: 0 0 16px;
  font-size: clamp(38px, 3.65vw, 48px);
  line-height: 1.06;
  letter-spacing: -0.026em;
  color: var(--pc-navy-950);
  max-width: 680px;
}

.home-hero__subtitle {
  margin: 0 0 26px;
  max-width: 600px;
  font-size: clamp(14px, 1vw, 16px);
  line-height: 1.58;
  color: color-mix(in srgb, var(--text) 76%, #526672);
}

.home-hero__principles {
  margin: 0 0 28px;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 9px;
  font-size: 13.5px;
  line-height: 1.55;
  color: color-mix(in srgb, var(--pc-navy-900) 68%, #476472);
  font-weight: 500;
  max-width: 620px;
}

.home-hero__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 30px;
}

.final-cta__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.home-hero__actions .btn,
.final-cta .btn,
.plan-card .btn {
  min-height: 44px;
  padding: 0 18px;
  border-radius: var(--radius-sm);
  font-weight: 700;
}

.home-hero__actions .btn,
.final-cta .btn,
.plan-card .btn:not(.btn--ghost) {
  background: var(--pc-navy-900);
  border-color: var(--pc-navy-900);
  color: #fff;
  box-shadow: 0 12px 26px rgba(18, 52, 90, 0.16);
}

.home-hero__actions .btn--ghost,
.final-cta .btn--ghost,
.plan-card .btn--ghost {
  background: rgba(255, 255, 255, 0.82);
  border-color: var(--pc-border-strong);
  color: var(--pc-navy-900);
  box-shadow: none;
}

.client-entry-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin: 0;
  padding: 24px;
  border: 1px solid color-mix(in srgb, var(--pc-navy-900) 18%, var(--pc-border));
  border-radius: var(--pc-radius-card);
  background: linear-gradient(135deg, var(--pc-bg-card), color-mix(in srgb, var(--pc-teal-soft) 70%, #ffffff));
}

.client-entry-section .section-head__title {
  margin: 0;
}

.client-entry-section p {
  max-width: 720px;
  margin: 8px 0 0;
  color: var(--pc-text-muted);
}

.plan-card .btn {
  min-height: 40px;
  font-size: 16px;
}

.hero-trust {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hero-trust li {
  font-size: 13px;
  color: var(--pc-navy-900);
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-pill);
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.78);
}

.home-hero__visual {
  min-width: 0;
  min-height: 420px;
  position: relative;
}

.product-story {
  position: relative;
  z-index: 2;
  display: grid;
  width: min(100%, 690px);
  min-height: 520px;
  margin-left: auto;
  background:
    radial-gradient(420px 240px at 94% 18%, rgba(143, 203, 200, 0.34), transparent 70%),
    radial-gradient(360px 230px at 6% 92%, rgba(247, 183, 126, 0.26), transparent 72%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0));
}

.product-story__accent {
  position: absolute;
  z-index: 0;
  pointer-events: none;
  border-radius: 999px;
}

.product-story__accent--peach {
  width: 156px;
  height: 156px;
  top: 14px;
  right: -28px;
  background: radial-gradient(circle, rgba(247, 183, 126, 0.42), rgba(247, 183, 126, 0.06) 70%);
}

.product-story__accent--teal {
  width: 118px;
  height: 118px;
  right: -18px;
  bottom: 122px;
  background: radial-gradient(circle, rgba(143, 203, 200, 0.38), rgba(143, 203, 200, 0.06) 72%);
}

.product-story__dashboard-card,
.product-story__public-card,
.product-story__request-card,
.product-story__calendar-card {
  border: 1px solid color-mix(in srgb, var(--pc-border) 86%, #fff);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 26px 70px rgba(18, 35, 58, 0.16);
}

.product-story__dashboard-card {
  position: absolute;
  z-index: 1;
  top: 18px;
  right: 0;
  display: grid;
  gap: 14px;
  width: min(86%, 540px);
  min-height: 340px;
  border-radius: 28px;
  padding: 24px;
  background:
    radial-gradient(380px 190px at 84% 20%, rgba(170, 183, 228, 0.2), transparent 70%),
    radial-gradient(340px 180px at 22% 0%, rgba(143, 203, 200, 0.18), transparent 68%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.94), rgba(245, 247, 242, 0.82));
  border: 1px solid rgba(18, 52, 90, 0.07);
  box-shadow: 0 28px 76px rgba(18, 35, 58, 0.13);
  backdrop-filter: blur(8px);
  opacity: 0.9;
}

.product-story__dashboard-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  color: var(--pc-navy-950);
}

.product-story__dashboard-mark {
  width: 34px;
  height: 34px;
  display: grid;
  grid-template-columns: repeat(2, 5px);
  gap: 4px;
  place-items: center;
  border-radius: var(--radius-sm);
  background: rgba(143, 203, 200, 0.18);
  color: var(--pc-navy-900);
}

.product-story__dashboard-mark i {
  width: 5px;
  height: 5px;
  border-radius: 2px;
  background: var(--pc-navy-900);
}

.product-story__top-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.product-story__top-actions > i {
  width: 16px;
  height: 16px;
  border: 2px solid color-mix(in srgb, var(--pc-navy-900) 70%, #fff);
  border-radius: 999px;
}

.product-story__top-actions > i:nth-child(2) {
  position: relative;
  border-radius: 4px 4px 7px 7px;
}

.product-story__top-actions > i:nth-child(2)::after {
  content: '';
  position: absolute;
  top: -7px;
  right: -7px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 0 2px #fff;
}

.product-story__dashboard-dot {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 34%, #fff 0 13%, transparent 14%),
    linear-gradient(145deg, #f2b37b, #8fcbc8);
  box-shadow: 0 10px 22px rgba(18, 35, 58, 0.12);
}

.product-story__dashboard-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(150px, 0.74fr);
  gap: 14px;
  opacity: 0.58;
}

.product-story__rail {
  position: absolute;
  left: 18px;
  top: 74px;
  bottom: 20px;
  display: grid;
  align-content: start;
  gap: 14px;
  width: 38px;
  border-radius: 16px;
  padding: 10px 7px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: inset 0 0 0 1px rgba(18, 52, 90, 0.06);
}

.product-story__rail span {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background:
    linear-gradient(90deg, transparent 45%, color-mix(in srgb, var(--pc-navy-900) 60%, #fff) 45% 55%, transparent 55%),
    linear-gradient(0deg, transparent 45%, color-mix(in srgb, var(--pc-navy-900) 60%, #fff) 45% 55%, transparent 55%);
  opacity: 0.42;
}

.product-story__rail span.is-active {
  background:
    linear-gradient(90deg, transparent 45%, #2255ff 45% 55%, transparent 55%),
    linear-gradient(0deg, transparent 45%, #2255ff 45% 55%, transparent 55%),
    color-mix(in srgb, var(--pc-teal-100) 76%, #fff);
  opacity: 1;
}

.product-story__dashboard-header,
.product-story__rail {
  display: none;
}

.product-story__dashboard-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.product-story__dashboard-body,
.product-story__requests {
  filter: saturate(0.9);
}

.product-story__stat,
.product-story__schedule {
  display: grid;
  gap: 4px;
  border-radius: var(--radius-lg);
  padding: 14px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(18, 52, 90, 0.06);
}

.product-story__stat--teal {
  background: linear-gradient(145deg, color-mix(in srgb, var(--pc-teal-100) 78%, #fff), rgba(255, 255, 255, 0.92));
}

.product-story__stat--peach {
  background: linear-gradient(145deg, color-mix(in srgb, var(--pc-peach-100) 78%, #fff), rgba(255, 255, 255, 0.92));
}

.product-story__stat span,
.product-story__schedule span,
.product-story__requests span {
  color: var(--pc-text-muted);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.product-story__stat strong,
.product-story__schedule strong {
  color: var(--pc-navy-950);
  font-size: 28px;
  line-height: 1;
}

.product-story__schedule {
  grid-column: 1 / -1;
  grid-template-columns: 1fr auto;
  align-items: center;
}

.product-story__requests {
  display: grid;
  gap: 9px;
  border-radius: var(--radius-lg);
  padding: 12px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(18, 52, 90, 0.06);
}

.product-story__requests p {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: center;
  margin: 0;
  border-radius: 12px;
  padding: 9px 10px;
  background: color-mix(in srgb, #eef3ff 72%, #fff);
  color: var(--pc-navy-900);
  font-size: 13px;
}

.product-story__requests p strong {
  font-weight: 700;
}

.product-story__requests p em {
  color: var(--pc-text-muted);
  font-size: 11px;
  font-style: normal;
}

.product-story__public-card {
  position: absolute;
  z-index: 3;
  left: 0;
  bottom: 40px;
  display: grid;
  gap: 16px;
  width: min(72%, 470px);
  border-radius: 24px;
  padding: clamp(16px, 2.2vw, 24px);
  background:
    radial-gradient(420px 220px at 90% 0%, rgba(143, 203, 200, 0.2), transparent 70%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(250, 247, 242, 0.9));
  box-shadow: 0 34px 90px rgba(18, 35, 58, 0.22);
}

.product-story__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.product-story__header span {
  display: inline-flex;
  width: max-content;
  border-radius: var(--radius-pill);
  padding: 7px 10px;
  background: color-mix(in srgb, var(--pc-teal-100) 72%, #fff);
  font-size: 14px;
  line-height: 1.2;
  letter-spacing: 0;
  text-transform: none;
  color: color-mix(in srgb, var(--pc-navy-900) 82%, #008375);
  font-weight: 600;
}

.product-story__profile {
  display: grid;
  grid-template-columns: minmax(118px, 150px) minmax(0, 1fr);
  gap: 16px;
  align-items: center;
}

.product-story__portrait-photo {
  display: block;
  width: 100%;
  max-width: 150px;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  object-position: center 24%;
  flex: 0 0 auto;
  border-radius: 22px;
  background: #f7efe7;
  border: 1px solid rgba(13, 47, 83, 0.08);
  box-shadow:
    0 22px 48px rgba(18, 35, 58, 0.14),
    inset 0 0 0 1px rgba(255, 255, 255, 0.42);
}

.product-story__copy {
  min-width: 0;
  display: grid;
  align-content: center;
  gap: 6px;
}

.product-story__copy strong {
  color: var(--pc-navy-950);
  font-size: clamp(24px, 2.2vw, 34px);
  line-height: 1;
}

.product-story__copy span,
.product-story__copy p {
  margin: 0;
  color: color-mix(in srgb, var(--text) 76%, #445966);
  line-height: 1.45;
}

.product-story__copy span {
  font-weight: 700;
  color: var(--pc-navy-900);
}

.product-story__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.product-story__chips span {
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  border: 1px solid color-mix(in srgb, var(--pc-border) 84%, #fff);
  border-radius: var(--radius-pill);
  padding: 0 10px;
  background: rgba(255, 255, 255, 0.78);
  color: var(--pc-navy-900);
  font-size: 12px;
  font-weight: 700;
}

.product-story__profile-actions {
  display: grid;
  grid-template-columns: 1fr 42px;
  gap: 10px;
}

.product-story__profile-actions button {
  min-height: 42px;
  border: 1px solid var(--pc-navy-900);
  border-radius: var(--radius-sm);
  background: var(--pc-navy-900);
  color: #fff;
  font-weight: 800;
  box-shadow: 0 14px 26px rgba(18, 52, 90, 0.18);
}

.product-story__profile-actions span {
  border: 1px solid color-mix(in srgb, var(--pc-border) 82%, #fff);
  border-radius: var(--radius-sm);
  background:
    linear-gradient(90deg, transparent 42%, var(--pc-navy-900) 42% 58%, transparent 58%),
    linear-gradient(0deg, transparent 42%, var(--pc-navy-900) 42% 58%, transparent 58%),
    rgba(255, 255, 255, 0.78);
}

.product-story__request-card {
  position: absolute;
  z-index: 4;
  right: 18px;
  bottom: 142px;
  display: grid;
  gap: 8px;
  width: 198px;
  border-radius: 22px;
  padding: 15px;
  background:
    radial-gradient(180px 110px at 100% 0%, rgba(143, 203, 200, 0.24), transparent 70%),
    rgba(255, 255, 255, 0.96);
  box-shadow: 0 28px 62px rgba(18, 35, 58, 0.18);
}

.product-story__calendar-card {
  position: absolute;
  z-index: 4;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  border-radius: 22px;
  padding: 14px;
}

.product-story__request-icon,
.product-story__calendar-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: color-mix(in srgb, var(--pc-teal-100) 82%, #fff);
}

.product-story__request-icon::before,
.product-story__calendar-icon::before {
  content: '';
  width: 18px;
  height: 18px;
  border: 2px solid var(--pc-navy-900);
}

.product-story__request-icon::before {
  border-radius: 50% 50% 46% 46%;
  border-top-color: transparent;
}

.product-story__calendar-icon {
  background: color-mix(in srgb, #ede8ff 80%, #fff);
}

.product-story__calendar-icon::before {
  border-radius: 5px;
}

.product-story__request-label,
.product-story__calendar-label {
  color: var(--pc-text-muted);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.product-story__request-card strong,
.product-story__calendar-card strong {
  color: var(--pc-navy-950);
  line-height: 1.25;
}

.product-story__calendar-card strong {
  grid-column: 1;
  font-size: 34px;
  letter-spacing: -0.04em;
}

.product-story__calendar-card p {
  grid-column: 1;
  margin: 0;
  color: var(--pc-navy-900);
  font-weight: 700;
  line-height: 1.35;
}

.product-story__request-card p {
  margin: 0;
  color: color-mix(in srgb, var(--text) 74%, #445966);
  line-height: 1.45;
  font-size: 13px;
}

.product-story__request-card button {
  min-height: 34px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--pc-teal-100) 82%, #fff);
  color: var(--pc-navy-900);
  font-weight: 700;
}

.product-story__calendar-card {
  right: -10px;
  bottom: -2px;
  width: 228px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(245, 247, 242, 0.9));
  box-shadow: 0 28px 62px rgba(83, 71, 140, 0.16);
}

.product-story__time-rail {
  grid-column: 2;
  grid-row: 1 / span 4;
  display: grid;
  gap: 8px;
  align-content: center;
  padding-left: 12px;
  border-left: 1px solid color-mix(in srgb, var(--pc-border) 74%, #fff);
}

.product-story__time-rail span {
  color: var(--pc-text-muted);
  font-size: 12px;
}

.product-story__time-rail .is-current {
  color: var(--pc-navy-900);
  font-weight: 800;
}

.home-hero {
  position: relative;
  grid-template-columns: minmax(0, 0.82fr) minmax(0, 1.18fr);
  gap: clamp(28px, 4vw, 62px);
  align-items: center;
  min-height: min(680px, calc(100vh - 128px));
  border: 0;
  border-radius: 0;
  padding: clamp(36px, 5vw, 64px) 0 clamp(30px, 4.4vw, 58px);
  background:
    radial-gradient(740px 360px at 72% 8%, rgba(247, 183, 126, 0.13), transparent 72%),
    radial-gradient(720px 360px at 18% 88%, rgba(143, 203, 200, 0.15), transparent 72%);
  box-shadow: none;
  overflow: visible;
}

.home-hero__wash {
  position: absolute;
  z-index: 0;
  pointer-events: none;
  border-radius: 999px;
  filter: blur(1px);
}

.home-hero__wash--teal {
  width: 240px;
  height: 240px;
  left: -150px;
  bottom: 12%;
  background: radial-gradient(circle, rgba(143, 203, 200, 0.34), rgba(143, 203, 200, 0));
}

.home-hero__wash--peach {
  width: 300px;
  height: 300px;
  right: -160px;
  top: 4%;
  background: radial-gradient(circle, rgba(247, 183, 126, 0.28), rgba(247, 183, 126, 0));
}

.home-hero__content,
.home-hero__visual {
  position: relative;
  z-index: 1;
}

.home-hero__eyebrow {
  width: max-content;
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  border: 1px solid rgba(32, 139, 122, 0.16);
  border-radius: var(--radius-pill);
  padding: 8px 14px;
  background: color-mix(in srgb, var(--pc-teal-100) 76%, #fff);
  color: color-mix(in srgb, var(--pc-navy-900) 72%, #008375);
  box-shadow: 0 10px 28px rgba(39, 131, 119, 0.1);
}

.home-hero__eyebrow-icon {
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  color: #008375;
}

.home-hero__eyebrow-icon svg,
.hero-feature-tile__icon svg {
  width: 100%;
  height: 100%;
}

.home-hero__eyebrow-icon path,
.hero-feature-tile__icon path {
  stroke: currentcolor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.home-hero__support {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  max-width: 56ch;
  font-size: 14px;
  font-weight: 600;
  color: color-mix(in srgb, var(--pc-navy-900) 78%, #3c5966);
}

.home-hero__support span {
  width: 18px;
  height: 18px;
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 50%;
  margin-top: 1px;
  background: #1aa785;
  color: #fff;
}

.home-hero__support span::before {
  content: '';
  width: 8px;
  height: 5px;
  border-left: 2px solid currentcolor;
  border-bottom: 2px solid currentcolor;
  transform: rotate(-45deg) translate(1px, -1px);
}

.home-hero__actions .btn {
  min-height: 48px;
  border-radius: var(--radius-sm);
  padding: 0 20px;
  gap: 10px;
}

.home-hero__actions .btn--ghost {
  background: rgba(255, 255, 255, 0.72);
  border-color: rgba(18, 52, 90, 0.14);
  box-shadow: 0 12px 28px rgba(18, 35, 58, 0.06);
}

.btn__arrow {
  font-size: 18px;
  line-height: 1;
}

.btn__play {
  position: relative;
  width: 24px;
  height: 24px;
  display: inline-grid;
  place-items: center;
  border: 1px solid rgba(18, 52, 90, 0.18);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.72);
}

.btn__play::before {
  content: '';
  width: 0;
  height: 0;
  margin-left: 2px;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 7px solid currentcolor;
}

.hero-features {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(5, minmax(72px, 1fr));
  gap: 10px;
}

.hero-feature-tile {
  min-height: 98px;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 8px;
  border: 1px solid rgba(18, 52, 90, 0.09);
  border-radius: 16px;
  padding: 10px 8px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 16px 36px rgba(18, 35, 58, 0.08);
  color: var(--pc-navy-900);
  text-align: center;
  font-size: 12px;
  font-weight: 750;
  line-height: 1.22;
}

.hero-feature-tile__icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  border: 1px solid rgba(18, 52, 90, 0.08);
}

.hero-feature-tile__icon--teal {
  background: color-mix(in srgb, var(--pc-teal-100) 82%, #fff);
  color: #007c72;
}

.hero-feature-tile__icon--blue {
  background: #eef4ff;
  color: #21508f;
}

.hero-feature-tile__icon--peach {
  background: color-mix(in srgb, var(--pc-peach-100) 72%, #fff);
  color: #a15c20;
}

.hero-feature-tile__icon--violet {
  background: #f0ecff;
  color: #5b46a5;
}

.hero-feature-tile__icon--green {
  background: #eaf8f2;
  color: #14805f;
}

.home-hero__visual {
  min-height: clamp(500px, 46vw, 620px);
}

.product-story {
  width: min(100%, 760px);
  min-height: clamp(500px, 46vw, 620px);
  background: none;
}

.product-story__accent--peach {
  width: 230px;
  height: 230px;
  top: 0;
  right: -86px;
  background: radial-gradient(circle, rgba(247, 183, 126, 0.42), rgba(247, 183, 126, 0.08) 70%);
}

.product-story__accent--teal {
  width: 150px;
  height: 150px;
  right: -52px;
  bottom: 132px;
  background: radial-gradient(circle, rgba(143, 203, 200, 0.52), rgba(143, 203, 200, 0.06) 72%);
}

.product-story__accent--dots {
  width: 116px;
  height: 130px;
  right: -12px;
  top: 184px;
  border-radius: 0;
  background-image: radial-gradient(rgba(32, 116, 108, 0.4) 1.2px, transparent 1.2px);
  background-size: 12px 12px;
  opacity: 0.42;
}

.product-story__dashboard-card,
.product-story__public-card,
.product-story__request-card,
.product-story__calendar-card {
  border: 1px solid rgba(18, 52, 90, 0.08);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 30px 80px rgba(18, 35, 58, 0.13);
  backdrop-filter: blur(10px);
}

.product-story__dashboard-card {
  top: 24px;
  right: 4px;
  width: min(86%, 620px);
  min-height: 430px;
  gap: 16px;
  border-radius: 26px;
  padding: 18px;
  background:
    radial-gradient(420px 220px at 92% 10%, rgba(247, 183, 126, 0.16), transparent 70%),
    radial-gradient(360px 220px at 0% 18%, rgba(143, 203, 200, 0.14), transparent 70%),
    rgba(255, 255, 255, 0.94);
  opacity: 1;
}

.product-story__dashboard-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  min-height: 34px;
  color: var(--pc-navy-950);
}

.product-story__dashboard-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  justify-self: start;
  flex: 0 0 auto;
  min-width: 0;
}

.product-story__dashboard-header strong {
  font-size: 14px;
  line-height: 1.2;
  font-weight: 600;
}

.product-story__top-actions {
  display: inline-flex;
  align-items: center;
  justify-content: end;
  gap: 8px;
}

.product-story__top-status {
  min-height: 26px;
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(18, 52, 90, 0.08);
  border-radius: var(--radius-sm);
  padding: 0 9px;
  background: rgba(255, 255, 255, 0.72);
  color: color-mix(in srgb, var(--pc-navy-900) 72%, #526a78);
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.product-story__top-status--live {
  background: color-mix(in srgb, var(--pc-teal-100) 78%, #fff);
  color: #14695f;
}

.product-story__top-icon {
  position: relative;
  width: 26px;
  height: 26px;
  display: inline-grid;
  place-items: center;
  border: 1px solid rgba(18, 52, 90, 0.1);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.72);
  color: var(--pc-navy-900);
}

.product-story__top-icon--search::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 7px;
  width: 8px;
  height: 8px;
  border: 2px solid currentcolor;
  border-radius: 50%;
}

.product-story__top-icon--search::after {
  content: '';
  position: absolute;
  right: 7px;
  bottom: 7px;
  width: 6px;
  height: 2px;
  border-radius: 999px;
  background: currentcolor;
  transform: rotate(45deg);
}

.product-story__top-icon--notification::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 6px;
  width: 9px;
  height: 11px;
  border: 2px solid currentcolor;
  border-radius: 8px 8px 5px 5px;
}

.product-story__top-icon--notification::after {
  content: '2';
  position: absolute;
  right: -4px;
  top: -5px;
  width: 14px;
  height: 14px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #ef4444;
  color: #fff;
  font-size: 8px;
  font-weight: 800;
  box-shadow: 0 0 0 2px #fff;
}

.product-story__top-icon--avatar {
  width: 30px;
  height: 30px;
  border: 0;
  background:
    radial-gradient(circle at 50% 34%, #fff 0 12%, transparent 13%),
    linear-gradient(145deg, #f3c193, #8fcbc8);
  box-shadow: 0 10px 22px rgba(18, 35, 58, 0.12);
}

.product-story__dashboard-shell {
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 14px;
  opacity: 1;
}

.product-story__rail {
  position: relative;
  inset: auto;
  display: grid;
  align-content: start;
  justify-items: center;
  gap: 14px;
  width: 44px;
  min-height: 332px;
  border-radius: 16px;
  padding: 12px 8px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: inset 0 0 0 1px rgba(18, 52, 90, 0.06);
}

.product-story__rail span {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  background:
    linear-gradient(90deg, transparent 45%, color-mix(in srgb, var(--pc-navy-900) 58%, #fff) 45% 55%, transparent 55%),
    linear-gradient(0deg, transparent 45%, color-mix(in srgb, var(--pc-navy-900) 58%, #fff) 45% 55%, transparent 55%),
    rgba(255, 255, 255, 0.72);
  opacity: 0.45;
}

.product-story__rail span.is-active {
  background:
    linear-gradient(90deg, transparent 45%, var(--pc-navy-900) 45% 55%, transparent 55%),
    linear-gradient(0deg, transparent 45%, var(--pc-navy-900) 45% 55%, transparent 55%),
    color-mix(in srgb, var(--pc-teal-100) 78%, #fff);
  opacity: 1;
}

.product-story__rail .product-story__rail-icon {
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.72);
  color: color-mix(in srgb, var(--pc-navy-900) 58%, #fff);
}

.product-story__rail .product-story__rail-icon.is-active {
  background: color-mix(in srgb, var(--pc-teal-100) 78%, #fff);
  color: var(--pc-navy-900);
}

.product-story__rail-icon svg,
.product-story__section-icon,
.product-story__dashboard-mark svg,
.product-story__request-icon svg,
.product-story__calendar-icon svg,
.product-story__profile-save svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentcolor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.product-story__dashboard-main {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.product-story__overview-label,
.product-story__requests > span:first-child {
  color: var(--pc-navy-950);
  font-size: 12px;
  font-weight: 800;
}

.product-story__dashboard-body {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  filter: none;
}

.product-story__stat {
  min-height: 106px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  align-items: start;
  gap: 7px;
  border-radius: 16px;
  padding: 14px;
  border: 1px solid rgba(18, 52, 90, 0.06);
}

.product-story__stat--teal {
  background: linear-gradient(145deg, #eefaf7, rgba(255, 255, 255, 0.94));
}

.product-story__stat--peach {
  background: linear-gradient(145deg, #fff4ea, rgba(255, 255, 255, 0.94));
}

.product-story__stat--lavender {
  background: linear-gradient(145deg, #f1efff, rgba(255, 255, 255, 0.94));
}

.product-story__stat span {
  color: color-mix(in srgb, var(--pc-navy-900) 68%, #657380);
  font-size: 11px;
  letter-spacing: 0;
  text-transform: none;
}

.product-story__stat strong {
  align-self: center;
  font-size: 30px;
}

.product-story__stat em {
  color: color-mix(in srgb, var(--pc-navy-900) 72%, #62717a);
  font-size: 10px;
  font-style: normal;
  font-weight: 700;
}

.product-story__requests {
  gap: 8px;
  margin-left: clamp(150px, 18vw, 220px);
  border-radius: 18px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.72);
  filter: none;
}

.product-story__requests p {
  position: relative;
  grid-template-columns: 1fr auto;
  gap: 2px 8px;
  min-height: 48px;
  padding: 9px 10px 9px 42px;
  background: linear-gradient(145deg, #f4f7ff, rgba(255, 255, 255, 0.92));
  font-size: 12px;
}

.product-story__requests p::before {
  content: '';
  position: absolute;
  left: 11px;
  top: 11px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 36%, var(--pc-navy-900) 0 10%, transparent 11%),
    radial-gradient(circle at 50% 88%, transparent 0 28%, var(--pc-navy-900) 29% 36%, transparent 37%),
    color-mix(in srgb, var(--pc-teal-100) 80%, #fff);
}

.product-story__requests p small {
  grid-column: 1;
  color: color-mix(in srgb, var(--text) 70%, #697780);
  font-size: 11px;
}

.product-story__requests p em {
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: center;
  font-size: 10px;
}

.product-story__requests-link {
  justify-self: end;
  color: var(--pc-navy-900);
  font-size: 11px;
  font-weight: 800;
}

.product-story__public-card {
  left: 0;
  bottom: 46px;
  width: min(55%, 386px);
  gap: 15px;
  border-radius: 24px;
  padding: 18px;
  background:
    radial-gradient(300px 180px at 94% 4%, rgba(143, 203, 200, 0.22), transparent 72%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(250, 247, 242, 0.92));
  box-shadow: 0 34px 82px rgba(18, 35, 58, 0.18);
}

.product-story__header span {
  gap: 6px;
  padding: 7px 10px;
  background: color-mix(in srgb, var(--pc-teal-100) 76%, #fff);
  color: color-mix(in srgb, var(--pc-navy-900) 78%, #008375);
  letter-spacing: 0;
}

.product-story__profile {
  grid-template-columns: 1fr;
  gap: 13px;
}

.product-story__portrait-photo {
  width: 100%;
  max-width: none;
  max-height: 250px;
  aspect-ratio: 1.42 / 1;
  object-position: center 24%;
  border-radius: 18px;
  box-shadow:
    0 20px 42px rgba(18, 35, 58, 0.12),
    inset 0 0 0 1px rgba(255, 255, 255, 0.42);
}

.product-story__copy {
  gap: 7px;
}

.product-story__copy strong {
  font-size: clamp(26px, 2.5vw, 34px);
}

.product-story__copy p {
  font-size: 13px;
  line-height: 1.45;
}

.product-story__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.product-story__meta span {
  min-height: 24px;
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-pill);
  padding: 0 9px;
  background: rgba(255, 255, 255, 0.72);
  color: color-mix(in srgb, var(--pc-navy-900) 72%, #4f6570);
  font-size: 11px;
  font-weight: 750;
}

.product-story__chips span {
  background: color-mix(in srgb, var(--pc-teal-100) 72%, #fff);
  border-color: rgba(32, 139, 122, 0.12);
}

.product-story__profile-actions {
  grid-template-columns: 1fr 42px;
  position: relative;
}

.product-story__profile-actions .product-story__profile-cta {
  position: relative;
  z-index: 1;
  min-height: 44px;
  display: inline-grid;
  place-items: center;
  padding: 0 12px;
  border: 1px solid var(--pc-navy-900);
  border-radius: var(--radius-sm);
  background: var(--pc-navy-900);
  color: #fff;
  font-weight: 800;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  box-shadow: 0 14px 26px rgba(18, 52, 90, 0.18);
}

.product-story__profile-actions .product-story__profile-save {
  position: relative;
  border: 1px solid color-mix(in srgb, var(--pc-border) 82%, #fff);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.86);
}

.product-story__profile-save::before {
  content: none;
  position: absolute;
  inset: 10px 13px;
  border: 2px solid var(--pc-navy-900);
  border-top-width: 7px;
  border-radius: 3px 3px 6px 6px;
}

.product-story__profile-save {
  display: grid;
  place-items: center;
  color: var(--pc-navy-900);
}

.product-story__request-card {
  right: 208px;
  bottom: 0;
  width: 178px;
  gap: 9px;
  border-radius: 20px;
  padding: 16px;
  background:
    radial-gradient(170px 110px at 100% 0%, rgba(143, 203, 200, 0.28), transparent 70%),
    rgba(255, 255, 255, 0.96);
}

.product-story__request-icon,
.product-story__calendar-icon {
  width: 44px;
  height: 44px;
}

.product-story__request-icon {
  position: relative;
}

.product-story__request-icon::before,
.product-story__calendar-icon::before {
  content: none;
  border-color: var(--pc-navy-900);
}

.product-story__request-icon::before {
  border-top-color: transparent;
}

.product-story__request-icon,
.product-story__calendar-icon {
  color: var(--pc-navy-900);
}

.product-story__request-badge {
  position: absolute;
  right: 14px;
  top: 12px;
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  box-shadow: 0 0 0 2px #fff;
}

.product-story__request-action {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--pc-teal-100) 84%, #fff);
  color: var(--pc-navy-900);
  font-size: 12px;
  font-weight: 800;
}

.product-story__calendar-card {
  right: 4px;
  bottom: 4px;
  width: 220px;
  grid-template-columns: 1fr auto;
  padding: 17px;
  border-radius: 22px;
  background:
    radial-gradient(180px 110px at 15% 10%, rgba(170, 183, 228, 0.26), transparent 72%),
    rgba(255, 255, 255, 0.96);
}

.product-story__calendar-card strong {
  font-size: 34px;
}

.product-story__calendar-card p {
  font-size: 14px;
}

.product-story__calendar-status {
  grid-column: 1;
  width: max-content;
  border-radius: var(--radius-pill);
  padding: 5px 9px;
  background: color-mix(in srgb, var(--pc-teal-100) 78%, #fff);
  color: #14805f;
  font-size: 11px;
  font-weight: 800;
}

.product-story__time-rail {
  gap: 9px;
  padding-left: 14px;
}

.product-story__time-rail .is-current {
  position: relative;
  padding: 5px 8px;
  border-radius: 8px;
  background: #eef7f5;
}

.product-story__time-rail .is-current::before {
  content: '';
  position: absolute;
  left: -16px;
  top: 4px;
  bottom: 4px;
  width: 3px;
  border-radius: 999px;
  background: #1aa785;
}

.home-hero {
  min-height: 0;
  height: clamp(536px, calc(100vh - 170px), 590px);
  padding: clamp(14px, 2.1vw, 26px) 0 clamp(16px, 2.2vw, 26px);
  gap: clamp(22px, 3vw, 44px);
}

.home-hero__eyebrow {
  padding: 6px 11px;
  margin-bottom: 12px;
}

.home-hero__support {
  gap: 8px;
  max-width: 52ch;
  font-size: 12px;
  line-height: 1.25;
  font-weight: 750;
  margin-bottom: 14px;
}

.home-hero__actions .btn {
  min-height: 42px;
  padding: 0 16px;
}

.hero-features {
  margin-top: 0;
  gap: 8px;
}

.hero-feature-tile {
  min-height: 68px;
  gap: 5px;
  border-radius: 13px;
  padding: 7px 6px;
  font-size: 10px;
}

.hero-feature-tile__icon {
  width: 27px;
  height: 27px;
  border-radius: 9px;
}

.home-hero__visual {
  min-height: 0;
  height: clamp(500px, calc(100vh - 190px), 548px);
  padding-left: clamp(10px, 1.2vw, 22px);
}

.product-story {
  width: min(100%, 700px);
  min-height: 0;
  height: 100%;
  margin-left: auto;
}

.product-story__dashboard-card {
  top: 0;
  right: 0;
  width: min(84%, 604px);
  min-height: 360px;
  padding: 14px;
}

.product-story__rail {
  min-height: 260px;
}

.product-story__dashboard-body {
  gap: 8px;
}

.product-story__stat {
  min-height: 72px;
  padding: 10px;
}

.product-story__stat strong {
  font-size: 24px;
}

.product-story__requests {
  gap: 7px;
  margin-left: clamp(118px, 13vw, 166px);
  padding: 10px;
}

.product-story__requests p {
  min-height: 38px;
  padding-block: 7px;
}

.product-story__public-card {
  left: -24px;
  bottom: 30px;
  width: min(47%, 322px);
  gap: 10px;
  padding: 14px;
}

.product-story__portrait-photo {
  max-height: 178px;
  aspect-ratio: 1.56 / 1;
}

.product-story__copy {
  gap: 5px;
}

.product-story__copy strong {
  font-size: clamp(22px, 2vw, 27px);
}

.product-story__copy span,
.product-story__copy p {
  line-height: 1.36;
}

.product-story__copy p {
  font-size: 11px;
}

.product-story__meta {
  gap: 6px;
}

.product-story__meta span {
  min-height: 22px;
  padding: 0 8px;
  font-size: 10px;
}

.product-story__chips {
  gap: 6px;
}

.product-story__chips span {
  min-height: 24px;
  padding: 0 8px;
  font-size: 10px;
}

.product-story__profile-actions .product-story__profile-cta {
  min-height: 38px;
}

.product-story__request-card {
  right: 188px;
  bottom: 2px;
  width: 154px;
  gap: 6px;
  padding: 12px;
}

.product-story__request-icon,
.product-story__calendar-icon {
  width: 36px;
  height: 36px;
}

.product-story__request-card p {
  font-size: 11px;
  line-height: 1.35;
}

.product-story__request-action {
  min-height: 32px;
}

.product-story__calendar-card {
  right: -10px;
  bottom: 4px;
  width: 184px;
  padding: 13px;
}

.product-story__calendar-card strong {
  font-size: 27px;
}

.product-story__calendar-card p {
  font-size: 12px;
}

.product-story__time-rail {
  gap: 7px;
  padding-left: 11px;
}

.hero-blob {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
}

.hero-blob--teal {
  width: 180px;
  height: 180px;
  top: -12px;
  right: 4%;
  background: radial-gradient(circle at 30% 30%, rgba(143, 203, 200, 0.6), rgba(143, 203, 200, 0.14));
}

.hero-blob--peach {
  width: 210px;
  height: 210px;
  left: 8%;
  bottom: 2%;
  background: radial-gradient(circle at 32% 32%, rgba(247, 183, 126, 0.48), rgba(247, 183, 126, 0.12));
}

.hero-dot-grid {
  position: absolute;
  right: 18%;
  bottom: 4%;
  width: 120px;
  height: 94px;
  background-image: radial-gradient(rgba(18, 52, 90, 0.26) 1.1px, transparent 1.1px);
  background-size: 12px 12px;
  opacity: 0.3;
}

.preview-card {
  position: absolute;
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 20px 44px rgba(18, 35, 58, 0.12);
  overflow: hidden;
}

.preview-card header {
  border-bottom: 1px solid var(--pc-border);
  padding: 10px 12px;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--pc-text-muted);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(250, 247, 242, 0.8));
}

.preview-card img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-card--dashboard {
  inset: 0 10% 26% 0;
  z-index: 3;
}

.preview-card--profile {
  width: 36%;
  top: 7%;
  right: 0;
  z-index: 4;
}

.preview-card--booking {
  width: 40%;
  right: 2%;
  bottom: 4%;
  z-index: 5;
}

.preview-card--payments {
  width: 39%;
  left: 9%;
  bottom: -2%;
  z-index: 4;
}

.how__row,
.value-grid,
.differentiation__grid,
.pricing__grid,
.testimonials__grid {
  display: grid;
  gap: 14px;
}

.how-step,
.value-card,
.difference-card,
.plan-card,
.testimonial-card {
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--pc-shadow-soft);
}

.icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(143, 203, 200, 0.18);
  color: var(--pc-navy-900);
  border: 1px solid rgba(18, 52, 90, 0.14);
  flex: 0 0 auto;
}

.icon-wrap--soft {
  background: linear-gradient(145deg, rgba(143, 203, 200, 0.2), rgba(247, 183, 126, 0.16));
}

.icon-wrap svg {
  width: 20px;
  height: 20px;
}

.icon-wrap path {
  stroke: currentcolor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.benefit-chip__label,
.how-step h3,
.value-card h4,
.difference-card h3,
.plan-card h3,
.section-head__title,
.final-cta__title {
  margin: 0;
  color: var(--pc-navy-950);
}

.benefit-chip__label,
.how-step h3,
.value-card h4,
.difference-card h3,
.plan-card h3 {
  font-size: 16px;
  line-height: 1.2;
}

.how-step p,
.value-card p,
.difference-card p,
.testimonial-card p,
.profile-promo__copy p,
.final-cta p {
  margin: 0;
  line-height: 1.55;
  color: color-mix(in srgb, var(--text) 78%, #445966);
}

.section-head {
  display: grid;
  gap: 8px;
}

.section-head--center {
  text-align: center;
}

.section-head__title {
  font-size: clamp(30px, 2.8vw, 42px);
  line-height: 1.14;
  letter-spacing: -0.028em;
}

.section-head__subtitle {
  margin: 0;
  max-width: 66ch;
  color: color-mix(in srgb, var(--text) 80%, #465f6b);
  line-height: 1.5;
}

.section-head--center .section-head__subtitle {
  margin-inline: auto;
}

.how,
.workflow-section,
.value-section,
.blog-section,
.differentiation,
.inside-section,
.pricing,
.testimonials,
.final-cta,
.profile-promo {
  display: grid;
  gap: 22px;
}

.how {
  gap: 14px;
}

.pricing {
  scroll-margin-top: 96px;
}

.value-grid,
.workflow-grid,
.differentiation__grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.workflow-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.value-grid {
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
}

.value-group + .value-group {
  margin-top: 24px;
}

.value-group__title {
  margin: 0 0 14px;
  color: var(--pc-navy-950);
}

.value-card,
.difference-card {
  display: grid;
  align-content: start;
  gap: 12px;
  min-height: 100%;
  padding: 18px;
}

.workflow-card {
  display: grid;
  align-content: start;
  gap: 6px;
  border: 1px solid rgba(18, 52, 90, 0.09);
  border-radius: var(--radius-sm);
  padding: 12px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 18px 44px rgba(18, 35, 58, 0.07);
}

.workflow-card__number {
  width: 26px;
  height: 26px;
  display: inline-grid;
  place-items: center;
  border-radius: 10px;
  background: color-mix(in srgb, var(--pc-teal-100) 78%, #fff);
  color: #007c72;
  font-weight: 800;
}

.workflow-card h3 {
  margin: 0;
  color: var(--pc-navy-950);
  font-size: 16px;
  line-height: 1.28;
}

.workflow-card p {
  margin: 0;
  color: var(--text-2);
  font-size: 14px;
  line-height: 1.45;
}

.trust-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(18, 52, 90, 0.08);
  border-radius: var(--radius-md);
  padding: 14px;
  background: color-mix(in srgb, var(--pc-cream) 74%, #fff);
}

.trust-strip span {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  border: 1px solid rgba(32, 139, 122, 0.14);
  border-radius: var(--radius-xs);
  padding: 5px 10px;
  background: rgba(255, 255, 255, 0.72);
  color: color-mix(in srgb, var(--pc-navy-900) 82%, #2e6b65);
  font-size: 13px;
  font-weight: 700;
}

.difference-card {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.94), rgba(245, 247, 242, 0.78));
}

.blog-section {
  border: 1px solid color-mix(in srgb, var(--pc-border) 86%, #fff);
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.72);
  box-shadow: var(--pc-shadow-soft);
}

.blog-section {
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  gap: clamp(18px, 3vw, 34px);
  align-items: start;
  padding: clamp(22px, 3vw, 34px);
}

.blog-section__copy {
  display: grid;
  gap: 14px;
}

.blog-section__copy p {
  margin: 0;
  color: color-mix(in srgb, var(--text) 80%, #445966);
  line-height: 1.58;
}

.how__row {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 4px;
  align-items: start;
}

.how-step {
  padding: 4px 2px;
  display: grid;
  gap: 7px;
  text-align: center;
  place-items: center;
  position: relative;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.how-step .icon-wrap {
  width: 80px;
  height: 80px;
  background: #fff;
  border-color: color-mix(in srgb, var(--pc-navy-900) 20%, #dfe8ef);
}

.how-step .icon-wrap svg {
  width: 32px;
  height: 32px;
}

.how-step__connector {
  position: absolute;
  top: 31px;
  right: -12px;
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
  color: color-mix(in srgb, var(--pc-navy-900) 56%, #99adba);
}

.how-step:last-child .how-step__connector {
  display: none;
}

.how__title {
  font-size: clamp(24px, 2vw, 30px);
  letter-spacing: -0.02em;
}

.how__intro {
  margin: 0 auto;
  max-width: 66ch;
  text-align: center;
  color: color-mix(in srgb, var(--text) 80%, #465f6b);
  line-height: 1.5;
}

.benefit-chips {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}

.benefit-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 6px 12px;
  border: 1px solid color-mix(in srgb, var(--pc-border) 85%, #fff);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
}

.benefit-chip__icon {
  width: 24px;
  height: 24px;
}

.benefit-chip__icon svg {
  width: 14px;
  height: 14px;
}

.benefit-chip__label {
  font-size: 13px;
  line-height: 1.3;
  white-space: nowrap;
}

.how-step h3 {
  max-width: 20ch;
  font-size: 15px;
  line-height: 1.25;
}

.how-step p {
  max-width: 22ch;
  font-size: 13px;
  line-height: 1.45;
}

.profile-promo {
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  align-items: center;
  gap: clamp(16px, 2.6vw, 28px);
  padding: clamp(10px, 1.8vw, 16px) 0;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.profile-promo__copy {
  display: grid;
  gap: 10px;
}

.profile-promo__copy p {
  max-width: 56ch;
}

.profile-promo__points {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 220px));
  gap: 10px;
}

.profile-point {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 6px 10px;
  border: 1px solid color-mix(in srgb, var(--pc-border) 84%, #fff);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.74);
}

.profile-point__icon {
  width: 24px;
  height: 24px;
}

.profile-point__icon svg {
  width: 14px;
  height: 14px;
}

.profile-point__text {
  font-size: 13px;
  line-height: 1.3;
  color: var(--pc-navy-950);
}

.profile-promo__preview {
  position: relative;
  min-width: 0;
  min-height: 340px;
}

.booking-preview {
  border: 1px solid color-mix(in srgb, var(--pc-border) 88%, #fff);
  border-radius: var(--radius-xl);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.94), rgba(245, 247, 242, 0.9));
  box-shadow: var(--pc-shadow-soft);
  overflow: hidden;
}

.booking-preview__header {
  border-bottom: 1px solid var(--pc-border);
  padding: 10px 12px;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--pc-text-muted);
  background: rgba(255, 255, 255, 0.88);
}

.booking-preview__body {
  padding: 12px;
  display: grid;
  gap: 10px;
}

.booking-preview--profile {
  width: min(100%, 480px);
}

.booking-preview--calendar {
  position: absolute;
  right: 0;
  bottom: -18px;
  width: min(86%, 370px);
}

.profile-mini {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 10px;
  align-items: center;
}

.profile-mini__avatar {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-weight: 700;
  color: #1d7f84;
  background: linear-gradient(145deg, rgba(143, 203, 200, 0.25), rgba(170, 183, 228, 0.25));
  border: 1px solid rgba(18, 52, 90, 0.12);
}

.profile-mini__name,
.profile-mini__role,
.profile-mini__snippet {
  margin: 0;
}

.profile-mini__name {
  font-size: 15px;
  line-height: 1.25;
  color: var(--pc-navy-950);
  font-weight: 700;
}

.profile-mini__role {
  font-size: 12px;
  line-height: 1.4;
  color: var(--pc-text-muted);
}

.profile-mini__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.profile-mini__chips span {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--pc-border) 82%, #fff);
  background: rgba(255, 255, 255, 0.82);
  font-size: 11px;
  color: var(--pc-navy-900);
}

.profile-mini__snippet {
  font-size: 12px;
  line-height: 1.45;
  color: color-mix(in srgb, var(--text) 80%, #445966);
}

.profile-mini__cta {
  min-height: 34px;
  width: 100%;
  border-radius: var(--radius-sm);
  border: 1px solid var(--pc-navy-900);
  background: var(--pc-navy-900);
  color: #fff;
  font-weight: 600;
}

.calendar-mini__top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  color: var(--pc-navy-900);
  font-weight: 600;
}

.calendar-mini__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
  font-size: 11px;
  color: var(--pc-text-muted);
}

.calendar-mini__grid span {
  min-height: 22px;
  display: grid;
  place-items: center;
}

.calendar-mini__grid .is-selected {
  color: #fff;
  background: var(--pc-navy-900);
  border-radius: 999px;
  font-weight: 700;
}

.calendar-mini__slots {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.calendar-mini__slots button {
  min-height: 30px;
  border: 1px solid color-mix(in srgb, var(--pc-border) 80%, #fff);
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.86);
  color: var(--pc-navy-900);
  font-size: 12px;
  font-weight: 600;
}

.session-mini__item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  align-items: center;
  min-height: 36px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--pc-teal-100) 72%, #fff);
  color: var(--pc-navy-900);
}

.session-mini__item strong {
  font-size: 13px;
}

.session-mini__item span {
  font-size: 12px;
  line-height: 1.35;
}

.pricing-toggle {
  justify-self: center;
  display: inline-flex;
  gap: 6px;
  padding: 4px;
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.86);
}

.pricing-toggle__btn {
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--pc-text-muted);
  cursor: pointer;
}

.pricing-toggle__btn.is-active {
  border-color: var(--pc-teal-500);
  background: var(--pc-teal-100);
  color: var(--pc-navy-900);
  font-weight: 700;
}

.pricing__grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 16px;
  max-width: 940px;
  width: 100%;
  margin-inline: auto;
}

.pricing-founder,
.pricing-custom {
  display: flex;
  gap: 18px;
  align-items: center;
  justify-content: space-between;
  margin: 18px auto 0;
  max-width: 920px;
  padding: 18px;
  border: 1px solid color-mix(in srgb, var(--pc-teal-500) 22%, transparent);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(135deg, rgba(242, 248, 247, 0.96), rgba(255, 250, 239, 0.9)),
    #fff;
  color: var(--muted);
}

.pricing-custom {
  margin-top: 12px;
  background:
    radial-gradient(320px 150px at 100% 0%, rgba(143, 203, 200, 0.18), transparent 70%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(242, 248, 247, 0.9));
}

.pricing-details {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: 18px;
  margin: 18px auto 0;
  max-width: 920px;
  padding: 18px;
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.86);
  color: var(--muted);
}

.pricing-details h3 {
  margin: 0 0 6px;
  color: var(--pc-navy-950);
}

.pricing-details p,
.pricing-details ul {
  margin: 0;
}

.pricing-details ul {
  display: grid;
  gap: 8px;
  padding-left: 18px;
}

.pricing-founder h3,
.pricing-custom h3 {
  margin: 0 0 6px;
  color: var(--pc-navy-950);
}

.pricing-founder p,
.pricing-custom p {
  margin: 0;
  line-height: 1.5;
}

.pricing-founder p + p {
  margin-top: 8px;
}

.plan-card {
  display: flex;
  flex-direction: column;
  align-self: start;
  gap: 10px;
  padding: 22px;
  min-height: 0;
  border-color: color-mix(in srgb, var(--pc-border) 88%, #d8e0e6);
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(252, 253, 252, 0.94)),
    #fff;
  box-shadow: 0 22px 58px rgba(18, 35, 58, 0.09);
}

.plan-card ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
  color: color-mix(in srgb, var(--text) 76%, #415763);
  font-size: 15px;
  line-height: 1.42;
}

.plan-card li {
  position: relative;
  padding-left: 22px;
}

.plan-card li::before {
  content: '✓';
  position: absolute;
  left: 0;
  top: 0.04em;
  color: #2c7f7b;
  font-weight: 700;
}

.plan-card__price {
  margin: 0;
  font-size: 31px;
  line-height: 1.12;
  font-weight: 800;
  color: var(--pc-navy-950);
}

.plan-card__helper {
  margin: -2px 0 2px;
  font-size: 13px;
  color: var(--pc-text-muted);
}

.plan-card__scenario,
.plan-card__note {
  margin: 0;
  color: var(--pc-text-muted);
  font-size: 15px;
}

.plan-card__scenario {
  line-height: 1.45;
}

.plan-card__note {
  line-height: 1.45;
}

.plan-card__badge {
  margin: -22px -22px 8px;
  min-height: 36px;
  display: grid;
  place-items: center;
  border-top-left-radius: 18px;
  border-top-right-radius: 18px;
  background: linear-gradient(90deg, var(--pc-navy-900), #173f68);
  color: #fff;
  font-size: 13px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  font-weight: 700;
}

.plan-card--pro {
  border-color: rgba(18, 52, 90, 0.32);
  background:
    radial-gradient(260px 150px at 92% 10%, rgba(143, 203, 200, 0.24), transparent 72%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(246, 252, 251, 0.94)),
    #fff;
  box-shadow: 0 24px 62px rgba(15, 45, 80, 0.15);
  transform: translateY(-4px);
}

.pricing-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr);
  gap: clamp(18px, 2.2vw, 28px);
  align-items: start;
}

.pricing-layout__left {
  display: grid;
  gap: 12px;
}

.pricing-head {
  gap: 6px;
}

.pricing-title {
  font-size: clamp(24px, 2vw, 30px);
  line-height: 1.2;
  letter-spacing: -0.02em;
  max-width: none;
}

.pricing-layout__right {
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-xl);
  background: linear-gradient(140deg, rgba(255, 255, 255, 0.95), rgba(245, 247, 242, 0.88));
  box-shadow: var(--pc-shadow-soft);
  padding: 14px;
  display: grid;
  gap: 10px;
}

.pricing-promo__title {
  margin: 0;
  color: var(--pc-navy-950);
  font-size: clamp(24px, 2vw, 30px);
  line-height: 1.2;
}

.pricing-promo__copy {
  margin: 0;
  color: color-mix(in srgb, var(--text) 80%, #445966);
  line-height: 1.5;
}

.pricing-promo__preview {
  position: relative;
  min-height: 300px;
}

.pricing-booking-preview--profile {
  width: min(100%, 420px);
}

.pricing-booking-preview--calendar {
  width: min(85%, 320px);
  right: -2px;
  bottom: -8px;
}

.testimonials__grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.testimonial-card {
  display: grid;
  gap: 12px;
  padding: 20px;
}

.testimonial-card__quote {
  font-size: 18px;
  line-height: 1.5;
}

.testimonial-card__author {
  font-size: 14px;
  color: var(--pc-text-muted);
}

.final-cta {
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-2xl);
  padding: clamp(18px, 2.4vw, 28px);
  background:
    radial-gradient(440px 220px at 86% 16%, rgba(143, 203, 200, 0.2), transparent 72%),
    radial-gradient(460px 250px at 12% 90%, rgba(247, 183, 126, 0.18), transparent 72%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), var(--pc-bg-main));
  box-shadow: var(--pc-shadow-card);
  place-items: center;
}

.final-cta__title {
  font-size: clamp(30px, 3vw, 44px);
  line-height: 1.1;
  letter-spacing: -0.03em;
  max-width: 18ch;
}

.reveal {
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.45s ease, transform 0.45s ease;
}

.reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 1080px) {
  .how__row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .value-grid,
  .differentiation__grid,
  .pricing__grid,
  .testimonials__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .pricing-layout {
    grid-template-columns: 1fr;
  }

  .blog-section {
    grid-template-columns: 1fr;
  }

  .pricing-layout__right {
    order: 2;
  }

  .pricing-layout__left {
    order: 1;
  }

  .pricing-promo__preview {
    min-height: auto;
    display: grid;
    gap: 10px;
  }

  .pricing-booking-preview--profile,
  .pricing-booking-preview--calendar {
    position: relative;
    width: 100%;
    right: auto;
    bottom: auto;
    margin: 0;
  }

  .profile-promo {
    grid-template-columns: 1fr;
    padding: 6px 0 2px;
  }

  .profile-promo__points {
    grid-template-columns: 1fr;
  }

  .profile-promo__preview {
    min-height: auto;
  }

  .booking-preview--calendar {
    position: relative;
    right: auto;
    bottom: auto;
    width: min(100%, 370px);
    margin-top: 10px;
    margin-left: auto;
  }

  .how-step .icon-wrap {
    width: 74px;
    height: 74px;
  }

  .how-step__connector {
    display: none;
  }
}

@media (max-width: 1024px) {
  .product-story__portrait-photo {
    width: clamp(120px, 18vw, 150px);
    border-radius: 20px;
  }
}

@media (max-width: 820px) {
  .benefit-chip__label {
    white-space: normal;
  }
}

@media (max-width: 920px) {
  .home-hero {
    grid-template-columns: 1fr;
  }

  .home-hero__visual {
    min-height: auto;
    padding-left: 0;
  }

  .product-story {
    margin: 0;
    width: 100%;
    min-height: 430px;
  }

  .product-story__dashboard-card {
    width: min(100%, 560px);
  }

  .product-story__public-card {
    width: min(78%, 430px);
  }
}

@media (max-width: 720px) {
  .product-story__portrait-photo {
    width: min(42vw, 150px);
    border-radius: 18px;
  }
}

@media (max-width: 680px) {
  .home-lite {
    padding: 14px 0 48px;
  }

  .home-lite__container {
    width: min(100% - 24px, var(--pc-container-wide));
    gap: 30px;
  }

  .client-entry-section {
    align-items: flex-start;
    flex-direction: column;
    gap: 16px;
    margin: 16px 0 30px;
    padding: 22px;
  }

  .home-hero {
    padding: 20px 16px;
  }

  .home-hero__title {
    font-size: clamp(32px, 9.8vw, 40px);
    line-height: 1.07;
  }

  .home-hero__actions,
  .final-cta__actions {
    width: 100%;
  }

  .home-hero__actions .btn,
  .final-cta .btn {
    width: 100%;
  }

  .home-hero__visual {
    min-height: auto;
    display: grid;
    gap: 10px;
  }

  .product-story {
    display: grid;
    gap: 12px;
    min-height: auto;
  }

  .product-story__dashboard-card,
  .product-story__request-card,
  .product-story__calendar-card {
    position: relative;
    inset: auto;
    width: 100%;
  }

  .product-story__dashboard-card {
    min-height: auto;
    order: 2;
  }

  .product-story__dashboard-body {
    grid-template-columns: 1fr;
  }

  .product-story__schedule {
    grid-column: auto;
  }

  .product-story__requests {
    width: 100%;
  }

  .product-story__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .product-story__public-card {
    position: relative;
    inset: auto;
    order: 1;
    width: 100%;
    padding: 14px;
  }

  .product-story__profile {
    grid-template-columns: 1fr;
  }

  .product-story__portrait-photo {
  width: min(100%, 180px);
  max-width: 180px;
  }

  .product-story__request-card {
    order: 3;
  }

  .product-story__calendar-card {
    order: 4;
  }

  .value-grid,
  .differentiation__grid,
  .pricing__grid,
  .testimonials__grid,
  .how__row {
    grid-template-columns: 1fr;
  }

  .pricing-layout__right {
    padding: 12px;
  }

  .how-step {
    border: 1px solid var(--pc-border);
    border-radius: var(--radius-xl);
    background: rgba(255, 255, 255, 0.92);
    box-shadow: var(--pc-shadow-soft);
    padding: 14px 10px;
  }

  .how-step__connector {
    display: none;
  }

  .benefit-chips {
    justify-content: flex-start;
  }

  .profile-promo__preview {
    display: grid;
    gap: 10px;
  }

  .booking-preview--profile,
  .booking-preview--calendar {
    width: 100%;
    position: relative;
    margin: 0;
  }
}

@media (max-width: 1180px) {
  .home-hero {
    grid-template-columns: minmax(0, 0.78fr) minmax(0, 1.22fr);
    gap: clamp(20px, 2.5vw, 32px);
  }

  .home-hero__title {
    font-size: clamp(36px, 3.7vw, 48px);
  }

  .product-story {
    width: min(100%, 680px);
  }

  .product-story__public-card {
    width: min(48%, 310px);
  }

  .product-story__request-card {
    right: 176px;
  }
}

@media (max-width: 1024px) {
  .product-story__portrait-photo {
    width: 100%;
    max-width: none;
  }
}

@media (max-width: 920px) {
  .workflow-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .home-hero {
    grid-template-columns: 1fr;
    min-height: auto;
    height: auto;
    padding-top: 30px;
  }

  .home-hero__title,
  .home-hero__subtitle,
  .home-hero__support {
    max-width: 660px;
  }

  .hero-features {
    grid-template-columns: repeat(5, minmax(82px, 1fr));
  }

  .home-hero__visual {
    height: 500px;
    min-height: 0;
  }

  .product-story {
    width: min(100%, 700px);
    min-height: 0;
    height: 100%;
    margin: 0 auto;
  }
}

@media (max-width: 760px) {
  .hero-features {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .product-story__dashboard-card {
    width: min(92%, 620px);
  }

  .product-story__public-card {
    width: min(55%, 330px);
    left: 0;
  }

  .product-story__request-card {
    right: 174px;
    width: 158px;
  }

  .product-story__calendar-card {
    width: 190px;
    right: 0;
  }
}

@media (max-width: 680px) {
  .workflow-grid {
    grid-template-columns: 1fr;
  }

  .pricing-founder,
  .pricing-custom {
    align-items: stretch;
    flex-direction: column;
  }

  .pricing-details {
    grid-template-columns: 1fr;
  }

  .pricing-founder .btn,
  .pricing-custom .btn {
    justify-content: center;
  }

  .home-hero {
    padding: 22px 0 4px;
  }

  .home-hero__eyebrow {
    width: fit-content;
    padding: 7px 11px;
    font-size: 10px;
  }

  .home-hero__title {
    font-size: clamp(32px, 9.8vw, 40px);
    line-height: 1.07;
  }

  .home-hero__actions .btn {
    justify-content: center;
  }

  .hero-features {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero-feature-tile {
    min-height: 70px;
    grid-template-columns: auto 1fr;
    align-content: center;
    justify-items: start;
    text-align: left;
  }

  .home-hero__visual {
    min-height: auto;
    height: auto;
  }

  .product-story {
    display: grid;
    gap: 0;
    min-height: auto;
    height: auto;
  }

  .product-story__accent {
    display: none;
  }

  .product-story__dashboard-card,
  .product-story__public-card,
  .product-story__request-card,
  .product-story__calendar-card {
    position: relative;
    inset: auto;
    width: 100%;
  }

  .product-story__public-card {
    display: none;
  }

  .product-story__dashboard-card {
    order: 1;
    min-height: auto;
    padding: 14px;
  }

  .product-story__request-card,
  .product-story__calendar-card {
    display: none;
  }

  .product-story__dashboard-shell {
    grid-template-columns: 1fr;
  }

  .product-story__rail {
    display: none;
  }

  .product-story__dashboard-body {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .product-story__overview-label,
  .product-story__requests {
    display: none;
  }

  .product-story__stat {
    min-height: 86px;
    padding: 10px 8px;
  }

  .product-story__stat strong {
    font-size: 25px;
  }

  .product-story__profile {
    grid-template-columns: 1fr;
  }

  .product-story__portrait-photo {
    width: 100%;
    max-width: none;
    max-height: none;
    aspect-ratio: 4 / 3;
  }
}

@media (max-width: 420px) {
  .hero-features {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .product-story__dashboard-header {
    grid-template-columns: auto 1fr;
  }

  .product-story__top-actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }

  .product-story__dashboard-shell {
    grid-template-columns: 1fr;
  }

  .product-story__rail {
    display: none;
  }
}

</style>

<style>
/* Home v2 is opt-in. Legacy scoped styles above remain unchanged. */
html[data-ui="v2"] .pc2-home { background: var(--pc-bg-main); color: var(--pc-text-body); font-family: var(--pc-font); padding-bottom: var(--pc-space-20); }
html[data-ui="v2"] .pc2-home__container { max-width: var(--pc-container); margin-inline: auto; padding-inline: var(--pc-gutter); }
html[data-ui="v2"] .pc2-home #pricing,
html[data-ui="v2"] .pc2-home #client-entry-title { scroll-margin-top: var(--pc-header-anchor-offset); }
html[data-ui="v2"] .pc2-home h1,
html[data-ui="v2"] .pc2-home h2,
html[data-ui="v2"] .pc2-home h3 { color: var(--pc-text-main); font-weight: var(--pc-fw-medium); }
html[data-ui="v2"] .pc2-home h2 { font-size: var(--pc-fs-h1); }
html[data-ui="v2"] .pc2-home h3 { font-size: var(--pc-fs-h3); }
html[data-ui="v2"] .pc2-home p { margin-block: var(--pc-space-4); }
html[data-ui="v2"] .pc2-home__hero { text-align: center; padding-block: var(--pc-section-y) var(--pc-space-12); }
html[data-ui="v2"] .pc2-home__hero h1 { font-size: var(--pc-fs-display); line-height: var(--pc-lh-tight); letter-spacing: var(--pc-ls-display); margin: var(--pc-space-6) auto; max-width: 18ch; }
html[data-ui="v2"] .pc2-home__lead { max-width: 65ch; margin-inline: auto; font-size: var(--pc-fs-lead); }
html[data-ui="v2"] .pc2-home__eyebrow { color: var(--pc-text-muted); font-size: var(--pc-fs-small); font-weight: var(--pc-fw-medium); }
html[data-ui="v2"] .pc2-home__meta { color: var(--pc-text-muted); font-size: var(--pc-fs-small); }
html[data-ui="v2"] .pc2-home__actions { display: flex; justify-content: center; gap: var(--pc-space-3); flex-wrap: wrap; margin-block: var(--pc-space-8) var(--pc-space-5); }
html[data-ui="v2"] .pc2-home__steps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--pc-space-2); padding-bottom: var(--pc-space-6); }
html[data-ui="v2"] .pc2-home__step { position: relative; display: flex; flex-direction: column; align-items: center; gap: var(--pc-space-3); min-height: var(--pc-control-h); padding: var(--pc-space-2); border: 0; border-radius: var(--pc-radius-sm); background: var(--pc-bg-main); color: var(--pc-text-muted); font: inherit; cursor: pointer; }
html[data-ui="v2"] .pc2-home__step-number { display: grid; place-items: center; position: relative; width: var(--pc-space-10); height: var(--pc-space-10); flex-shrink: 0; border-radius: var(--pc-radius-pill); background: var(--pc-bg-sunk); }
html[data-ui="v2"] .pc2-home__step[aria-pressed="true"] { color: var(--pc-text-main); }
html[data-ui="v2"] .pc2-home__step[aria-pressed="true"] .pc2-home__step-number { background: var(--pc-navy-900); color: var(--pc-bg-card); }
html[data-ui="v2"] .pc2-home__step:hover:not([aria-pressed="true"]) { background: var(--pc-teal-100); border-color: var(--pc-teal-ink); }
html[data-ui="v2"] .pc2-home__journey-panel { display: grid; grid-template-columns: 1fr 1fr; gap: var(--pc-space-8); padding: var(--pc-space-10); border: 1px solid var(--pc-border-hair); border-radius: var(--pc-radius-lg); background: var(--pc-bg-card); }
html[data-ui="v2"] .pc2-home__journey-copy { min-width: 0; align-self: center; }
html[data-ui="v2"] .pc2-home__journey-copy h2 { margin-block: var(--pc-space-4); }
html[data-ui="v2"] .pc2-home__illustration { min-width: 0; min-height: calc(var(--pc-space-20) * 4); background: var(--pc-bg-soft); border-radius: var(--pc-radius-md); padding: var(--pc-space-6); display: grid; align-content: center; }
html[data-ui="v2"] .pc2-home__preview { min-width: 0; padding: var(--pc-space-6); background: var(--pc-bg-card); border: 1px solid var(--pc-border-hair); border-radius: var(--pc-radius-md); box-shadow: var(--pc-shadow-sm); }
html[data-ui="v2"] .pc2-home__preview-icon { display: grid; place-items: center; width: var(--pc-space-12); height: var(--pc-space-12); background: var(--pc-teal-200); color: var(--pc-teal-ink); border-radius: var(--pc-radius-sm); }
html[data-ui="v2"] .pc2-home__preview-icon svg,
html[data-ui="v2"] .pc2-home__feature-icon { width: var(--pc-space-6); height: var(--pc-space-6); }
html[data-ui="v2"] .pc2-home__status { display: inline-block; padding: var(--pc-space-2) var(--pc-space-3); background: var(--pc-peach-100); color: var(--pc-peach-ink); border-radius: var(--pc-radius-xs); font-size: var(--pc-fs-small); }
html[data-ui="v2"] .pc2-home__truth { position: relative; align-items: start; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--pc-space-6); background: var(--pc-navy-900); color: var(--pc-bg-card); border-radius: var(--pc-radius-lg); padding: var(--pc-space-12); margin-top: var(--pc-space-12); }
html[data-ui="v2"] .pc2-home__truth h2 { grid-column: 1 / -1; margin: 0; color: inherit; }
html[data-ui="v2"] .pc2-home__truth h3 { color: inherit; font-size: var(--pc-fs-h1); margin: var(--pc-space-4) 0; }
html[data-ui="v2"] .pc2-home__section,
html[data-ui="v2"] .pc2-home__blog,
html[data-ui="v2"] .pc2-home__pricing { margin-block: var(--pc-section-y); }
html[data-ui="v2"] .pc2-home__capabilities { margin-top: var(--pc-space-10); }
html[data-ui="v2"] .pc2-home__bento { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--pc-space-4); }
html[data-ui="v2"] .pc2-home__feature { display: flex; justify-content: space-between; gap: var(--pc-space-6); padding: var(--pc-space-8); min-width: 0; min-height: calc(var(--pc-space-20) * 2 + var(--pc-space-16)); }
html[data-ui="v2"] .pc2-home__feature--profile,
html[data-ui="v2"] .pc2-home__feature--sessions { grid-column: span 2; }
html[data-ui="v2"] .pc2-home__feature-icon { color: var(--pc-teal-ink); }
html[data-ui="v2"] .pc2-home__blog { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: var(--pc-space-16); }
html[data-ui="v2"] .pc2-home__client { display: flex; flex-wrap: wrap; align-items: center; gap: var(--pc-space-6); padding: var(--pc-space-10); background: var(--pc-teal-100); color: var(--pc-teal-ink); border-radius: var(--pc-radius-lg); }
html[data-ui="v2"] .pc2-home__client > div { flex: 1; }
html[data-ui="v2"] .pc2-home__client > a { flex-shrink: 0; }
html[data-ui="v2"] .pc2-home__heading { flex: 1; }
html[data-ui="v2"] .pc2-home__cycles { display: flex; align-self: flex-end; justify-content: center; gap: var(--pc-space-1); padding: var(--pc-space-1); background: var(--pc-bg-sunk); border-radius: var(--pc-radius-pill); }
html[data-ui="v2"] .pc2-home__cycle { min-height: var(--pc-control-h); padding-inline: var(--pc-space-6); border: 1px solid transparent; border-radius: var(--pc-radius-pill); background: none; color: var(--pc-text-main); font: inherit; cursor: pointer; }
html[data-ui="v2"] .pc2-home__cycle[aria-pressed="true"] { background: var(--pc-bg-card); color: var(--pc-navy-900); box-shadow: var(--pc-shadow-sm); }
html[data-ui="v2"] .pc2-home__cycle:hover { border-color: var(--pc-navy-900); }
html[data-ui="v2"] .pc2-home__plans { display: grid; grid-template-columns: 1fr 1fr; gap: var(--pc-space-6); }
html[data-ui="v2"] .pc2-home__plan { display: flex; flex-direction: column; align-items: flex-start; padding: var(--pc-space-10); border: 1px solid var(--pc-border-hair); border-radius: var(--pc-radius-lg); background: var(--pc-bg-card); }
html[data-ui="v2"] .pc2-home__plan--pro { background: var(--pc-navy-900); color: var(--pc-bg-card); }
html[data-ui="v2"] .pc2-home__plan--pro h3 { color: inherit; }
html[data-ui="v2"] .pc2-home__plan-price { font-size: var(--pc-fs-h1); font-weight: var(--pc-fw-strong); line-height: var(--pc-lh-head); }
html[data-ui="v2"] .pc2-home__plan-badge { font-size: var(--pc-fs-small); padding: var(--pc-space-2) var(--pc-space-3); background: var(--pc-peach-200); color: var(--pc-peach-ink); border-radius: var(--pc-radius-pill); }
html[data-ui="v2"] .pc2-home__plan ul { padding-left: var(--pc-space-5); margin-bottom: var(--pc-space-8); }
html[data-ui="v2"] .pc2-home__plan li { padding-block: var(--pc-space-2); }
html[data-ui="v2"] .pc2-home__plan > a { margin-top: auto; }
html[data-ui="v2"] .pc2-home__plan--pro > a { background: var(--pc-bg-card); color: var(--pc-navy-900); border-color: var(--pc-bg-card); }
html[data-ui="v2"] .pc2-home__plan--pro > a:hover { background: var(--pc-teal-200); border-color: var(--pc-teal-200); }
html[data-ui="v2"] .pc2-home__conditions,
html[data-ui="v2"] .pc2-home__limits { margin-top: var(--pc-space-6); padding: var(--pc-space-8); background: var(--pc-bg-soft); border-radius: var(--pc-radius-md); }
html[data-ui="v2"] .pc2-home__conditions > a { margin-top: var(--pc-space-4); }
html[data-ui="v2"] .pc2-home__final { text-align: center; padding-block: var(--pc-space-20); border-top: 1px solid var(--pc-border-hair); }
html[data-ui="v2"] .pc2-home__final h2 { max-width: 24ch; margin: 0 auto var(--pc-space-8); }
html[data-ui="v2"] .pc2-home :focus-visible { outline: var(--pc-focus-width) solid var(--pc-navy-900); outline-offset: var(--pc-focus-offset); }
html[data-ui="v2"] .pc2-home__plan--pro :focus-visible,
html[data-ui="v2"] .pc2-home__step[aria-pressed="true"]:focus-visible { outline-color: var(--pc-navy-900); box-shadow: 0 0 0 var(--pc-space-1) var(--pc-bg-card); }
html[data-ui="v2"] .pc2-home__sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
html[data-ui="v2"] .pc2-home__hero-mark { display: block; width: calc(var(--pc-space-24) + var(--pc-space-4)); height: auto; margin: 0 auto var(--pc-space-8); }
html[data-ui="v2"] .pc2-home__steps { position: relative; }
html[data-ui="v2"] .pc2-home__step::before { content: ''; position: absolute; left: 0; right: 0; top: calc(var(--pc-space-5) + var(--pc-space-2)); height: 1px; background: var(--pc-border-hair); }
html[data-ui="v2"] .pc2-home__step:first-child::before { left: 50%; }
html[data-ui="v2"] .pc2-home__step:last-child::before { right: 50%; }
html[data-ui="v2"] .pc2-home__step-number { border: 1px solid var(--pc-border); transition: background var(--pc-dur) var(--pc-ease), color var(--pc-dur) var(--pc-ease); }
html[data-ui="v2"] .pc2-home__profile-preview,
html[data-ui="v2"] .pc2-home__mini-calendar { display: grid; gap: var(--pc-space-3); }
html[data-ui="v2"] .pc2-home__profile-preview > span,
html[data-ui="v2"] .pc2-home__mini-calendar > span { padding: var(--pc-space-3); border-radius: var(--pc-radius-sm); background: var(--pc-bg-soft); font-size: var(--pc-fs-small); }
html[data-ui="v2"] .pc2-home__preview-action { display: block; padding: var(--pc-space-3); border-radius: var(--pc-radius-pill); background: var(--pc-navy-900); color: var(--pc-bg-card); font-size: var(--pc-fs-meta); text-align: center; }
html[data-ui="v2"] .pc2-home__profile-preview .pc2-home__preview-action { background: var(--pc-navy-900); }
html[data-ui="v2"] .pc2-home__request-preview { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--pc-space-2); padding: 0; margin-block: var(--pc-space-6); list-style: none; font-size: var(--pc-fs-meta); }
html[data-ui="v2"] .pc2-home__request-preview li { border-top: var(--pc-space-1) solid var(--pc-border); padding-top: var(--pc-space-2); overflow-wrap: anywhere; }
html[data-ui="v2"] .pc2-home__request-preview li:first-child { border-color: var(--pc-navy-900); }
html[data-ui="v2"] .pc2-home__session-preview { display: grid; gap: var(--pc-space-3); padding: var(--pc-space-5); margin-block: var(--pc-space-5); border-radius: var(--pc-radius-md); background: var(--pc-navy-900); color: var(--pc-bg-card); font-size: var(--pc-fs-small); }
html[data-ui="v2"] .pc2-home__work-preview { display: grid; gap: var(--pc-space-3); padding: 0; list-style: none; font-size: var(--pc-fs-small); }
html[data-ui="v2"] .pc2-home__work-preview li { display: flex; flex-wrap: wrap; gap: var(--pc-space-2); justify-content: space-between; padding-bottom: var(--pc-space-3); border-bottom: 1px solid var(--pc-border-hair); }
html[data-ui="v2"] .pc2-home__work-preview span { color: var(--pc-teal-ink); }
html[data-ui="v2"] .pc2-home__peek { position: absolute; right: var(--pc-space-16); bottom: 100%; width: calc(var(--pc-space-16) * 2); height: var(--pc-space-16); overflow: hidden; pointer-events: none; }
html[data-ui="v2"] .pc2-home__peek img { display: block; width: 100%; height: auto; }
html[data-ui="v2"] .pc2-home__truth > div { border-top: 1px solid var(--pc-border-strong); }
html[data-ui="v2"] .pc2-home__feature-copy { display: flex; flex-direction: column; justify-content: space-between; gap: var(--pc-space-6); min-width: 0; }
html[data-ui="v2"] .pc2-home__feature h3 { margin: 0; }
html[data-ui="v2"] .pc2-home__feature p { font-size: var(--pc-fs-small); }
html[data-ui="v2"] .pc2-home__feature--requests { background: var(--pc-teal-100); color: var(--pc-teal-ink); }
html[data-ui="v2"] .pc2-home__feature--requests h3,
html[data-ui="v2"] .pc2-home__feature--requests .pc2-home__eyebrow { color: var(--pc-teal-ink); }
html[data-ui="v2"] .pc2-home__feature--payments { background: var(--pc-peach-100); color: var(--pc-peach-ink); }
html[data-ui="v2"] .pc2-home__feature--payments h3,
html[data-ui="v2"] .pc2-home__feature--payments .pc2-home__eyebrow { color: var(--pc-peach-ink); }
html[data-ui="v2"] .pc2-home__feature--sessions { background: var(--pc-navy-900); color: var(--pc-bg-card); }
html[data-ui="v2"] .pc2-home__feature--sessions h3,
html[data-ui="v2"] .pc2-home__feature--sessions .pc2-home__eyebrow { color: inherit; }
html[data-ui="v2"] .pc2-home__mini-profile,
html[data-ui="v2"] .pc2-home__mini-calendar { flex: 0 0 45%; min-width: 0; font-size: var(--pc-fs-small); }
html[data-ui="v2"] .pc2-home__mini-profile { display: grid; gap: var(--pc-space-3); align-content: center; padding: var(--pc-space-4); background: var(--pc-bg-soft); border-radius: var(--pc-radius-md); }
html[data-ui="v2"] .pc2-home__mini-profile svg { width: var(--pc-space-10); height: var(--pc-space-10); color: var(--pc-teal-ink); }
html[data-ui="v2"] .pc2-home__mini-calendar { align-content: center; }
html[data-ui="v2"] .pc2-home__mini-calendar > span { background: var(--pc-navy-800); }
html[data-ui="v2"] .pc2-home__blog-formats { display: grid; gap: var(--pc-space-3); padding: 0; margin: 0; list-style: none; }
html[data-ui="v2"] .pc2-home__blog-formats li { padding: var(--pc-space-5) var(--pc-space-6); }
html[data-ui="v2"] .pc2-home__blog-formats span { font-size: var(--pc-fs-meta); color: var(--pc-text-muted); }
html[data-ui="v2"] .pc2-home__blog-formats h3 { font-size: var(--pc-fs-lead); margin-block: var(--pc-space-2); }
html[data-ui="v2"] .pc2-home__blog-formats p { font-size: var(--pc-fs-small); margin-bottom: 0; }
html[data-ui="v2"] .pc2-home__client > img { width: calc(var(--pc-space-12) + var(--pc-space-2)); height: auto; flex-shrink: 0; }
html[data-ui="v2"] .pc2-home__client > div { flex-basis: 50%; }
html[data-ui="v2"] .pc2-home__client h2 { font-size: var(--pc-fs-h2); color: var(--pc-teal-ink); }
html[data-ui="v2"] .pc2-home__client p { font-size: var(--pc-fs-ui); }
html[data-ui="v2"] .pc2-home__pricing-header { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--pc-space-8); margin-bottom: var(--pc-space-8); }
@media (max-width: 900px) {
  html[data-ui="v2"] .pc2-home__mini-profile,
  html[data-ui="v2"] .pc2-home__mini-calendar { flex-basis: 45%; }
  html[data-ui="v2"] .pc2-home__journey-panel { padding: var(--pc-space-6); gap: var(--pc-space-6); }
  html[data-ui="v2"] .pc2-home__bento { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-flow: dense; }
  html[data-ui="v2"] .pc2-home__blog { gap: var(--pc-space-6); }
  html[data-ui="v2"] .pc2-home__client { gap: var(--pc-space-5); }
}
@media (max-width: 600px) {
  html[data-ui="v2"] .pc2-home__hero { padding-top: var(--pc-space-12); }
  html[data-ui="v2"] .pc2-home__actions { flex-direction: column; }
  html[data-ui="v2"] .pc2-home__step { flex-direction: column; gap: var(--pc-space-2); border-radius: var(--pc-radius-md); }
  html[data-ui="v2"] .pc2-home__journey-panel,
  html[data-ui="v2"] .pc2-home__truth,
  html[data-ui="v2"] .pc2-home__bento,
  html[data-ui="v2"] .pc2-home__blog,
  html[data-ui="v2"] .pc2-home__plans { grid-template-columns: 1fr; }
  html[data-ui="v2"] .pc2-home__feature--profile,
  html[data-ui="v2"] .pc2-home__feature--sessions { grid-column: auto; }
  html[data-ui="v2"] .pc2-home__truth,
  html[data-ui="v2"] .pc2-home__feature,
  html[data-ui="v2"] .pc2-home__client,
  html[data-ui="v2"] .pc2-home__plan,
  html[data-ui="v2"] .pc2-home__conditions,
  html[data-ui="v2"] .pc2-home__limits { padding: var(--pc-space-6); }
  html[data-ui="v2"] .pc2-home__preview { padding: var(--pc-space-5); }
}
@media (max-width: 600px) {
  html[data-ui="v2"] .pc2-home__hero-mark { width: calc(var(--pc-space-20) + var(--pc-space-2)); }
  html[data-ui="v2"] .pc2-home__step { font-size: var(--pc-fs-meta); padding-inline: 0; }
  html[data-ui="v2"] .pc2-home__feature { min-height: 0; }
  html[data-ui="v2"] .pc2-home__feature--profile,
  html[data-ui="v2"] .pc2-home__feature--sessions { flex-direction: column; }
  html[data-ui="v2"] .pc2-home__client > div { flex-basis: calc(100% - var(--pc-space-20)); }
  html[data-ui="v2"] .pc2-home__client > a { width: 100%; }
  html[data-ui="v2"] .pc2-home__pricing-header { flex-direction: column; align-items: flex-start; }
  html[data-ui="v2"] .pc2-home__cycles { align-self: flex-start; }
}
@media (prefers-reduced-motion: reduce) {
  html[data-ui="v2"] .pc2-home *,
  html[data-ui="v2"] .pc2-home *::before,
  html[data-ui="v2"] .pc2-home *::after { animation: none; transition: none; scroll-behavior: auto; }
}
</style>
