<template>
  <section class="profile">
    <header class="profile__hero">
      <div>
        <div class="badge">Кабінет спеціаліста</div>
        <h1 class="title profile__title">Керування публічним профілем</h1>
        <p class="muted profile__subtitle">
          Збирайте свою публічну сторінку як міні-сайт: офер, довіра, контент, контакти й медіа.
        </p>
      </div>
      <div class="profile__actions">
        <div class="toggle-chip" :class="profile.public_profile_enabled ? 'toggle-chip--on' : 'toggle-chip--off'">
          {{ profile.public_profile_enabled ? 'Публічний профіль увімкнено' : 'Публічний профіль вимкнено' }}
        </div>
        <button class="btn" type="button" :disabled="shareLoading" @click="onShareProfile">
          {{ shareLoading ? 'Підготовка...' : 'Поділитись профілем' }}
        </button>
        <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
        <div v-if="shareStatus" class="muted" style="margin-top: 6px;">{{ shareStatus }}</div>
      </div>
    </header>
    <SettingsSubnav active="profile" />

    <div v-if="showPublicProfileNotPublishedHint" class="profile-notice" role="status">
      <p class="profile-notice__text">
        Публічний профіль ще не опубліковано. Заповніть профіль і увімкніть його для перегляду.
      </p>
      <RouterLink class="btn btn--ghost btn--sm" to="/cabinet/profile">
        Перейти до налаштувань профілю
      </RouterLink>
    </div>

    <div v-if="loading" class="muted" style="margin-top: 12px;">Завантаження профілю...</div>
    <div v-else-if="error && !profileLoaded" class="form-error" style="margin-top: 12px;">{{ error }}</div>

            <form v-else class="profile-grid" @submit.prevent="onSave">
      <div v-if="error && !isDirty" class="form-error">{{ error }}</div>
      <section class="panel panel--highlight">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Крок 1</div>
            <h2 class="panel__title">Публічний профіль</h2>
            <p class="panel__hint">
              Якщо ви вже знайшли клієнта і хочете почати співпрацю — поділіться з ним посиланням
              на ваш профіль. Для цього натисніть “Поділитись профілем” або скопіюйте посилання нижче.
            </p>
          </div>
        </div>
        <div class="form" style="margin-top: 12px;">
          <label class="check" title="Якщо вимкнено — профіль не буде видно у каталозі.">
            <input v-model="profile.public_profile_enabled" type="checkbox" />
            Публічний профіль увімкнено
          </label>
          <div class="field">
            <div class="muted">Публічне посилання</div>
            <div class="slug-row">
              <code class="slug" title="Повне посилання, яким можна ділитися з клієнтами.">
                {{ publicUrl || 'Посилання буде доступне після збереження slug.' }}
              </code>
              <button
                class="btn btn--ghost"
                type="button"
                title="Скопіювати посилання в буфер обміну."
                @click="onCopyLink"
              >
                Копіювати посилання
              </button>
              <a
                v-if="isPublicProfilePublished"
                class="btn btn--ghost"
                :href="publicUrl"
                target="_blank"
                rel="noreferrer"
                title="Відкрити публічний профіль у новій вкладці."
              >
                Відкрити профіль
              </a>
              <RouterLink v-else class="btn btn--ghost" to="/cabinet/profile">
                Увімкнути публічний профіль
              </RouterLink>
              <button
                class="btn btn--ghost"
                type="button"
                :disabled="slugSaving"
                @click="startSlugEdit"
              >
                Змінити адресу
              </button>
            </div>
            <div v-if="slugEditOpen" class="slug-edit">
              <div class="slug-edit__preview">
                Попередній вигляд: <code>{{ slugPreviewPath || '/s/' }}</code>
              </div>
              <label class="field">
                <span class="muted">Нова адреса</span>
                <div class="slug-input">
                  <span class="slug-input__prefix">/s/</span>
                  <input
                    v-model.trim="slugDraft"
                    class="input"
                    type="text"
                    inputmode="text"
                    autocomplete="off"
                    spellcheck="false"
                    placeholder="ваш-slug"
                    :disabled="slugSaving"
                  />
                </div>
              </label>
              <div class="slug-edit__actions">
                <button class="btn btn--ghost btn--sm" type="button" :disabled="slugSaving" @click="cancelSlugEdit">
                  Скасувати
                </button>
                <button class="btn btn--sm" type="button" :disabled="slugSaving || !slugDraft.trim()" @click="saveSlug">
                  {{ slugSaving ? 'Збереження...' : 'Зберегти адресу' }}
                </button>
              </div>
              <div class="muted" style="font-size: 12px;">
                Використайте латинські літери, цифри або дефіс.
              </div>
              <div v-if="slugError" class="form-error">{{ slugError }}</div>
            </div>
            <div v-if="!profile.public_profile_enabled" class="muted" style="font-size: 12px;">
              Публічний профіль ще не опубліковано.
            </div>
            <div v-if="copyStatus" class="muted" style="font-size: 12px;">
              {{ copyStatus }}
            </div>
          </div>
        </div>
      </section>

      <section class="panel" id="journal">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Крок 2</div>
            <h2 class="panel__title">Основні дані</h2>
            <p class="panel__hint">Ці поля формують перше враження в каталозі та публічному профілі.</p>
          </div>
        </div>
        <div class="form form--profile-basics" style="margin-top: 12px;">
          <div class="form-group">
            <label class="field">
              <span class="field-label">Публічне ім'я</span>
              <input v-model="profile.display_name" class="input" type="text" placeholder="Напр. Олена Коваль" />
            </label>
            <label class="field">
              <span class="field-label">Професійний фокус</span>
              <select
                v-model="profile.professional_focus"
                class="input input--select"
                data-testid="professional-focus-select"
              >
                <option :value="null">Оберіть тип практики</option>
                <option v-for="option in professionalFocusOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <div class="field-help">Як ви позиціонуєте свою практику на платформі.</div>
            </label>
            <label class="field">
              <span class="field-label">Спеціалізації</span>
              <div class="chip-field">
                <div class="chip" v-for="(spec, index) in specializationList" :key="`${spec}-${index}`">
                  <span>{{ spec }}</span>
                  <button type="button" class="chip-remove" @click.stop.prevent="removeSpecialization(index)">×</button>
                </div>
                <input
                  v-model="specializationInput"
                  class="input chip-input"
                  type="text"
                  list="specializationOptions"
                  placeholder="введіть спеціалізацію"
                  @input="onSpecializationInput"
                  @keydown.enter.prevent="addSpecialization()"
                  @keydown="onSpecializationKeydown"
                />
                <datalist id="specializationOptions">
                  <option v-for="option in specializationPresetOptions" :key="option" :value="option" />
                </datalist>
              </div>
              <div class="quick-suggestions" data-testid="specialization-suggestions">
                <div class="quick-suggestions__title">Рекомендовані спеціалізації</div>
                <div class="quick-suggestions__chips">
                  <button
                    v-for="suggestion in specializationPresetOptions"
                    :key="`specialization-suggestion-${suggestion}`"
                    type="button"
                    class="quick-suggestion-chip"
                    :class="{ 'is-selected': isSpecializationSelected(suggestion) }"
                    :disabled="isSpecializationSelected(suggestion)"
                    data-testid="specialization-suggestion-chip"
                    @click="appendSpecializationSuggestion(suggestion)"
                  >
                    {{ suggestion }}
                  </button>
                </div>
              </div>
              <div v-if="showOtherSpecialization" class="chip-field" style="margin-top: 8px;">
                <input
                  v-model="otherSpecializationInput"
                  class="input chip-input"
                  type="text"
                  placeholder="Впишіть спеціалізацію"
                  @keydown.enter.prevent="addOtherSpecialization"
                />
                <button class="btn btn--ghost btn--sm" type="button" @click="addOtherSpecialization">
                  Додати
                </button>
              </div>
            </label>
            <div class="field">
              <label class="field-label" for="language-input">Мови</label>
              <div class="chip-field">
                <div class="chip" v-for="(language, index) in languageList" :key="`${language}-${index}`">
                  <span>{{ language }}</span>
                  <button
                    type="button"
                    class="chip-remove"
                    @mousedown.stop
                    @click.stop="removeLanguage(language, index)"
                  >
                    ×
                  </button>
                </div>
                <input
                  id="language-input"
                  v-model="languageInput"
                  class="input chip-input"
                  type="text"
                  list="languageOptions"
                  placeholder="введіть мову"
                  @input="onLanguageInput"
                  @keydown.enter.prevent="addLanguage()"
                  @keydown="onLanguageKeydown"
                />
                <datalist id="languageOptions">
                  <option v-for="language in languageOptions" :key="language" :value="language" />
                </datalist>
              </div>
              <div class="field-help">
                Можна додавати скільки завгодно мов. Підказки працюють за першими літерами.
              </div>
            </div>
            <label class="field">
              <span class="field-label">Локація</span>
              <input v-model="profile.location" class="input" type="text" placeholder="Місто / країна" />
            </label>
          </div>
          <div class="form-group">
            <div class="field field--format">
              <span class="field-label field-label--section">Формат консультацій</span>
              <div class="meeting-format-controls">
                <label class="check">
                  <input v-model="profile.offers_online" type="checkbox" />
                  Доступно онлайн
                </label>
                <label class="check">
                  <input v-model="profile.offers_offline" type="checkbox" />
                  Доступно офлайн
                </label>
              </div>
              <div class="field-help">
                Оберіть щонайменше один формат.
              </div>
            </div>
            <label v-if="profile.offers_offline" class="field">
              <span class="field-label">Локація для офлайн-зустрічей</span>
              <input
                v-model="profile.offline_location"
                class="input"
                type="text"
                placeholder="Напр. Київ, вул. ... або назва кабінету"
              />
            </label>
            <label class="field">
              <span class="field-label">Досвід роботи</span>
              <select v-model.number="profile.experience_years" class="input input--select" required>
                <option v-for="option in experienceOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <div class="field-help">
                Це поле обов’язкове і відображається у публічному профілі.
              </div>
            </label>
          </div>
          <div class="form-group">
            <label class="field">
              <span class="field-label">Ціна за одну стандартну консультацію</span>
              <div class="field-row">
                <input
                  v-model="profile.price"
                  class="input"
                  type="text"
                  inputmode="decimal"
                  pattern="^[0-9]*([.,][0-9]{0,2})?$"
                  placeholder="1000"
                  @input="onPriceInput"
                />
                <select v-model="profile.price_currency" class="input input--select">
                  <option value="UAH">грн</option>
                  <option value="USD">$</option>
                  <option value="EUR">€</option>
                </select>
              </div>
            </label>
            <label class="field">
              <span class="field-label">Ознайомча сесія (тривалість)</span>
              <select v-model.number="profile.intro_duration_minutes" class="input input--select">
                <option :value="15">15 хв</option>
                <option :value="30">30 хв</option>
                <option :value="45">45 хв</option>
                <option :value="60">60 хв</option>
              </select>
            </label>
            <label class="field">
              <span class="field-label">Вартість ознайомчої сесії</span>
              <div class="field-row">
                <input
                  v-model="profile.intro_price"
                  class="input"
                  type="text"
                  inputmode="decimal"
                  pattern="^[0-9]*([.,][0-9]{0,2})?$"
                  placeholder="0"
                  @input="onIntroPriceInput"
                />
                <select v-model="profile.intro_price_currency" class="input input--select">
                  <option value="UAH">грн</option>
                  <option value="USD">$</option>
                  <option value="EUR">€</option>
                </select>
              </div>
            </label>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Крок 3</div>
            <h2 class="panel__title">Секції публічного профілю</h2>
            <p class="panel__hint">
              Назви йдуть у тому самому формулюванні, яке бачать клієнти в публічному профілі.
            </p>
          </div>
        </div>
        <div class="form" style="margin-top: 12px;">
          <label class="field" for="specialistBookingRulesText">
            <span class="field-label">Умови спеціаліста перед записом</span>
            <textarea
              id="specialistBookingRulesText"
              v-model="profile.setting_text"
              class="input"
              rows="4"
              placeholder="Опишіть індивідуальні умови перед записом, які клієнт має побачити."
            ></textarea>
          </label>
          <div class="field-help">
            Клієнт бачить ці умови перед записом. Якщо оновити умови, клієнта попросять підтвердити нову версію повторно.
          </div>
        </div>
        <div class="details-stack">
          <details class="details" open>
            <summary>Про мене</summary>
            <label class="field">
              <div class="field-head">
                <span>Про мене</span>
                <label class="inline-check">
                  <input v-model="profile.show_bio_about" type="checkbox" />
                  Показувати
                </label>
              </div>
              <textarea
                v-model="profile.bio_about"
                class="input"
                rows="4"
                placeholder="Короткий опис для публічного профілю."
              ></textarea>
              <div class="field-help">Короткий опис для публічного профілю.</div>
            </label>
          </details>
          <details class="details">
            <summary>Формат роботи</summary>
            <label class="field">
              <div class="field-head">
                <span>Формат роботи</span>
                <label class="inline-check">
                  <input v-model="profile.show_bio_work" type="checkbox" />
                  Показувати
                </label>
              </div>
              <textarea
                v-model="profile.bio_work"
                class="input"
                rows="4"
                placeholder="Опишіть, як проходить консультація і чого очікувати від процесу роботи."
              ></textarea>
              <div class="field-help">Опишіть, як проходить консультація і чого очікувати від процесу роботи.</div>
            </label>
          </details>
          <details class="details">
            <summary>Спеціальності та підходи</summary>
            <label class="field">
              <div class="field-head">
                <span>Спеціальності та підходи</span>
                <label class="inline-check">
                  <input v-model="profile.show_bio_approach" type="checkbox" />
                  Показувати
                </label>
              </div>
              <textarea
                v-model="profile.bio_approach"
                class="input"
                rows="4"
                placeholder="Ваші спеціальності та підходи, які бачить клієнт у верхній частині профілю."
              ></textarea>
              <div class="field-help">
                Показуються у верхній частині публічного профілю як ваші професійні орієнтири.
              </div>
            </label>
          </details>
          <details class="details">
            <summary>Основні запити</summary>
            <label class="field">
              <div class="field-head">
                <span>Основні запити</span>
                <label class="inline-check">
                  <input v-model="profile.show_bio_for_whom" type="checkbox" />
                  Показувати
                </label>
              </div>
              <textarea
                v-model="profile.bio_for_whom"
                class="input"
                rows="4"
                placeholder="Теми, з якими до вас звертаються клієнти."
                data-testid="main-requests-textarea"
              ></textarea>
              <div class="field-help">
                Оберіть готові приклади або опишіть своїми словами, з якими темами до вас звертаються клієнти.
              </div>
            </label>
            <div class="quick-suggestions" data-testid="main-requests-suggestions">
              <div class="quick-suggestions__title">Швидко додати приклади</div>
              <div class="quick-suggestions__tabs" role="tablist" aria-label="Категорії прикладів для Основних запитів">
                <button
                  v-for="category in profileSuggestionCategories"
                  :key="`main-requests-${category.key}`"
                  type="button"
                  class="quick-suggestions__tab"
                  :class="{ 'is-active': activeMainRequestsSuggestionCategory === category.key }"
                  :data-testid="`main-requests-category-tab-${category.key}`"
                  @click="setSuggestionCategory('main_requests', category.key)"
                >
                  {{ category.label }}
                </button>
              </div>
              <div class="quick-suggestions__chips">
                <button
                  v-for="suggestion in mainRequestSuggestions"
                  :key="`main-requests-suggestion-${suggestion}`"
                  type="button"
                  class="quick-suggestion-chip"
                  :class="{ 'is-selected': isSuggestionSelected('bio_for_whom', suggestion) }"
                  :disabled="isSuggestionSelected('bio_for_whom', suggestion)"
                  data-testid="main-requests-suggestion-chip"
                  @click="appendSuggestionToField('bio_for_whom', suggestion)"
                >
                  {{ suggestion }}
                </button>
              </div>
            </div>
          </details>
          <details class="details">
            <summary>Межі роботи</summary>
            <label class="field">
              <div class="field-head">
                <span>Межі роботи</span>
                <label class="inline-check">
                  <input v-model="profile.show_bio_other" type="checkbox" />
                  Показувати
                </label>
              </div>
              <textarea
                v-model="profile.bio_other"
                class="input"
                rows="4"
                placeholder="Теми або запити, з якими ви не працюєте."
                data-testid="work-boundaries-textarea"
              ></textarea>
              <div class="field-help">
                Оберіть готові приклади або вкажіть теми й запити, з якими ви не працюєте.
              </div>
            </label>
            <div class="quick-suggestions" data-testid="work-boundaries-suggestions">
              <div class="quick-suggestions__title">Швидко додати приклади</div>
              <div class="quick-suggestions__tabs" role="tablist" aria-label="Категорії прикладів для Меж роботи">
                <button
                  v-for="category in profileSuggestionCategories"
                  :key="`work-boundaries-${category.key}`"
                  type="button"
                  class="quick-suggestions__tab"
                  :class="{ 'is-active': activeWorkBoundariesSuggestionCategory === category.key }"
                  :data-testid="`work-boundaries-category-tab-${category.key}`"
                  @click="setSuggestionCategory('work_boundaries', category.key)"
                >
                  {{ category.label }}
                </button>
              </div>
              <div class="quick-suggestions__chips">
                <button
                  v-for="suggestion in workBoundarySuggestions"
                  :key="`work-boundaries-suggestion-${suggestion}`"
                  type="button"
                  class="quick-suggestion-chip"
                  :class="{ 'is-selected': isSuggestionSelected('bio_other', suggestion) }"
                  :disabled="isSuggestionSelected('bio_other', suggestion)"
                  data-testid="work-boundaries-suggestion-chip"
                  @click="appendSuggestionToField('bio_other', suggestion)"
                >
                  {{ suggestion }}
                </button>
              </div>
            </div>
          </details>
          <details class="details">
            <summary>Освіта і професійний розвиток</summary>
            <label class="field">
              <div class="field-head">
                <span>Коротко про підготовку</span>
              </div>
              <textarea
                v-model="profile.education_summary"
                class="input"
                rows="3"
                placeholder="Коротко опишіть вашу базову підготовку та професійний фокус."
              ></textarea>
              <div class="field-help">
                Цей текст показується в секції «Освіта і професійний розвиток» у публічному профілі.
              </div>
            </label>
            <label class="field">
              <div class="field-head">
                <span>Базова освіта / програми</span>
              </div>
              <textarea
                v-model="educationItemsText"
                class="input"
                rows="4"
                placeholder="Кожен пункт з нового рядка: магістратура, спеціалізація, довгі програми."
                data-testid="education-items-textarea"
              ></textarea>
            </label>
            <label class="field">
              <div class="field-head">
                <span>Курси та професійний розвиток</span>
              </div>
              <textarea
                v-model="professionalDevelopmentItemsText"
                class="input"
                rows="4"
                placeholder="Кожен пункт з нового рядка: курси, супервізії, сертифікації, інтенсиви."
                data-testid="professional-development-items-textarea"
              ></textarea>
            </label>
          </details>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Крок 4</div>
            <h2 class="panel__title">Контакти</h2>
            <p class="panel__hint">Заповніть те, що готові показати. Видимість налаштовується нижче.</p>
          </div>
        </div>
        <div class="form" style="margin-top: 12px;">
          <label class="field">
            Email для зв'язку
            <input v-model="profile.contact_email" class="input" type="email" placeholder="hello@example.com" />
          </label>
          <label class="field">
            Телефон для зв'язку
            <input v-model="profile.contact_phone" class="input" type="text" placeholder="+380" />
          </label>
          <div class="field-row">
            <label class="field field--half">
              Messenger / Signal
              <input v-model="profile.messenger" class="input" type="text" placeholder="username або посилання" />
            </label>
            <label class="field field--half">
              Telegram
              <input v-model="profile.telegram" class="input" type="text" placeholder="@username або посилання" />
            </label>
          </div>
          <div class="field-row">
            <label class="field field--half">
              Viber
              <input v-model="profile.viber" class="input" type="text" placeholder="номер телефону" />
            </label>
            <label class="field field--half">
              WhatsApp
              <input v-model="profile.whatsapp" class="input" type="text" placeholder="номер телефону" />
            </label>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Крок 5</div>
            <h2 class="panel__title">Видимість</h2>
            <p class="panel__hint">Вмикайте тільки те, що має бути видно клієнтам у публічному профілі.</p>
          </div>
        </div>
        <div class="form" style="margin-top: 12px;">
          <label class="check">
            <input v-model="profile.show_email" type="checkbox" />
            Показувати email
          </label>
          <label class="check">
            <input v-model="profile.show_phone" type="checkbox" />
            Показувати телефон
          </label>
          <label class="check">
            <input v-model="profile.show_messenger" type="checkbox" />
            Показувати Messenger / Signal
          </label>
          <label class="check">
            <input v-model="profile.show_telegram" type="checkbox" />
            Показувати Telegram
          </label>
          <label class="check">
            <input v-model="profile.show_viber" type="checkbox" />
            Показувати Viber
          </label>
          <label class="check">
            <input v-model="profile.show_whatsapp" type="checkbox" />
            Показувати WhatsApp
          </label>
          <label class="check">
            <input v-model="profile.show_video" type="checkbox" />
            Показувати відео
          </label>
          <label class="check">
            <input v-model="profile.show_price" type="checkbox" />
            Показувати ціну
          </label>
          <label class="check">
            <input v-model="profile.show_intro_price" type="checkbox" />
            Показувати ціну ознайомчої сесії
          </label>
          <label class="check">
            <input v-model="profile.show_location" type="checkbox" />
            Показувати локацію
          </label>
          <label class="check">
            <input v-model="profile.show_photo" type="checkbox" />
            Показувати фото
          </label>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Крок 6</div>
            <h2 class="panel__title">Фото та відео</h2>
            <p class="panel__hint">Завантажте обкладинку профілю та (за потреби) відео-прев'ю.</p>
          </div>
        </div>
        <div class="media-preview media-preview--side" style="margin-top: 12px;">
          <div
            class="media-card"
            data-testid="media-card-photo"
            role="button"
            tabindex="0"
            @click="triggerPhotoSelect"
            @keydown.enter.prevent="triggerPhotoSelect"
            @keydown.space.prevent="triggerPhotoSelect"
          >
            <div class="media-title">Фото прев'ю</div>
            <div class="media-hint">JPG, PNG, WEBP • до 5 МБ</div>
            <div class="media-frame">
              <button
                v-if="photoPreviewUrl || profile.photo_url"
                class="media-remove-btn"
                :class="{ 'is-visible': photoDeleteHoverVisible }"
                data-testid="remove-photo-button"
                type="button"
                :disabled="photoDeleting || photoUploading"
                aria-label="Видалити фото профілю"
                @click.stop="onDeletePhoto"
              >
                ×
              </button>
              <img
                v-if="photoPreviewUrl || profile.photo_url"
                :src="photoPreviewUrl || profile.photo_url"
                alt="Фото профілю"
                @mouseenter="photoDeleteHoverVisible = true"
                @mouseleave="photoDeleteHoverVisible = false"
                @focus="photoDeleteHoverVisible = true"
                @blur="photoDeleteHoverVisible = false"
              />
              <div v-else class="media-empty">Фото ще не завантажено</div>
            </div>
            <div class="media-status" v-if="photoUploading">Завантаження фото...</div>
            <div class="media-status" v-if="photoDeleting">Видалення фото...</div>
            <div class="media-status media-status--error" v-if="photoMediaError">{{ photoMediaError }}</div>
            <button
              class="btn btn--ghost btn--sm"
              type="button"
              @click.stop="triggerPhotoSelect"
            >
              Змінити фото
            </button>
            <input
              ref="photoInput"
              class="input input--file is-hidden"
              type="file"
              accept="image/*"
              @change="onPhotoSelected"
            />
          </div>
          <div
            class="media-card"
            data-testid="media-card-video"
            role="button"
            tabindex="0"
            @click="triggerVideoSelect"
            @keydown.enter.prevent="triggerVideoSelect"
            @keydown.space.prevent="triggerVideoSelect"
          >
            <div class="media-title">Відео прев'ю</div>
            <div class="media-hint">MP4, MOV, WEBM • до 1 хв • до 100 МБ</div>
            <div class="media-hint media-hint--note">
              Рекомендовано: знімати у 720p або 1080p, з хорошим освітленням і чітким звуком.
            </div>
            <div class="media-frame">
              <button
                v-if="videoPreviewUrl || profile.video_url"
                class="media-remove-btn"
                :class="{ 'is-visible': videoDeleteHoverVisible }"
                data-testid="remove-video-button"
                type="button"
                :disabled="videoDeleting || videoUploading"
                aria-label="Видалити відео профілю"
                @click.stop="onDeleteVideo"
              >
                ×
              </button>
              <video
                v-if="videoPreviewUrl || profile.video_url"
                :src="videoPreviewUrl || profile.video_url"
                preload="metadata"
                controls
                @click.stop
                @mouseenter="videoDeleteHoverVisible = true"
                @mouseleave="videoDeleteHoverVisible = false"
                @focus="videoDeleteHoverVisible = true"
                @blur="videoDeleteHoverVisible = false"
              ></video>
              <div v-else class="media-empty">Відео ще не завантажено</div>
            </div>
            <div class="media-status" v-if="videoUploading">Завантаження відео...</div>
            <div class="media-status" v-if="videoDeleting">Видалення відео...</div>
            <div class="media-status media-status--error" v-if="videoMediaError">{{ videoMediaError }}</div>
            <button
              class="btn btn--ghost btn--sm"
              type="button"
              @click.stop="triggerVideoSelect"
            >
              Змінити відео
            </button>
            <input
              ref="videoInput"
              class="input input--file is-hidden"
              type="file"
              accept="video/*"
              @change="onVideoSelected"
            />
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Крок 7</div>
            <h2 class="panel__title">Документи та сертифікати</h2>
            <p class="panel__hint">
              Завантажуйте документи, які допомагають клієнтам краще зрозуміти ваш професійний шлях.
              Ви самі вирішуєте, які з них показувати у публічному профілі. Нові документи автоматично показуються першими.
            </p>
          </div>
        </div>

        <div class="documents-uploader">
          <div class="documents-uploader__grid">
            <label class="field">
              Назва документа
              <input
                v-model="newDocumentTitle"
                class="input"
                type="text"
                placeholder="Напр. Сертифікат CBT"
              />
            </label>
            <label class="field">
              Тип
              <select v-model="newDocumentKind" class="input input--select">
                <option v-for="kind in documentKindOptions" :key="kind.value" :value="kind.value">
                  {{ kind.label }}
                </option>
              </select>
            </label>
            <label class="field">
              Файл (PDF або зображення)
              <input
                ref="documentFileInput"
                class="input input--file"
                type="file"
                accept="application/pdf,image/*"
                @change="onDocumentFileSelected"
              />
            </label>
          </div>

          <label class="check">
            <input v-model="newDocumentIsPublic" type="checkbox" />
            Показувати у публічному профілі
          </label>

          <div class="documents-uploader__actions">
            <button
              class="btn"
              type="button"
              :disabled="documentUploading || !newDocumentTitle.trim() || !newDocumentFile"
              @click="onUploadDocument"
            >
              {{ documentUploading ? 'Завантаження...' : 'Завантажити документ' }}
            </button>
            <span v-if="newDocumentFile" class="muted">Обрано: {{ newDocumentFile.name }}</span>
          </div>
        </div>

        <div v-if="documentsNotice" class="muted">{{ documentsNotice }}</div>
        <div v-if="documentsError" class="form-error">{{ documentsError }}</div>
        <div v-if="documentsLoading" class="muted">Завантаження документів...</div>
        <div v-else-if="!documents.length" class="documents-empty">
          Документи ще не додані. Завантажте перший файл, щоб клієнти могли ознайомитися з вашим професійним профілем.
        </div>
        <div v-else class="documents-list">
          <article v-for="document in documents" :key="document.id" class="documents-item">
            <div class="documents-item__header">
              <div class="documents-item__meta">
                <span class="documents-kind">{{ documentKindLabel(document.document_kind) }}</span>
                <span
                  class="documents-visibility"
                  :class="document.is_public ? 'documents-visibility--public' : 'documents-visibility--private'"
                >
                  {{ document.is_public ? 'Публічний' : 'Приватний' }}
                </span>
              </div>
              <a
                class="btn btn--ghost"
                :href="document.file_url"
                target="_blank"
                rel="noopener noreferrer"
              >
                Відкрити
              </a>
            </div>

            <div class="documents-item__grid">
              <label class="field">
                Назва
                <input v-model="document.title" class="input" type="text" />
              </label>
              <label class="check">
                <input v-model="document.is_public" type="checkbox" />
                Показувати у публічному профілі
              </label>
            </div>

            <div class="documents-item__actions">
              <button
                class="btn btn--ghost"
                type="button"
                :disabled="updatingDocumentId === document.id || deletingDocumentId === document.id"
                @click="onUpdateDocument(document)"
              >
                {{ updatingDocumentId === document.id ? 'Збереження...' : 'Зберегти' }}
              </button>
              <button
                class="btn btn--danger"
                type="button"
                :disabled="updatingDocumentId === document.id || deletingDocumentId === document.id"
                @click="onDeleteDocument(document.id)"
              >
                {{ deletingDocumentId === document.id ? 'Видалення...' : 'Видалити' }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <section class="panel panel--final-check" data-testid="profile-final-public-check">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Крок 8</div>
            <h2 class="panel__title">Перевірте публічний профіль</h2>
            <p class="panel__hint">
              Відкрийте реальний публічний профіль, щоб перевірити, як його бачать клієнти.
            </p>
          </div>
        </div>
        <div class="final-check-actions">
          <a
            v-if="isPublicProfilePublished"
            class="btn"
            :href="publicUrl"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="open-public-profile-final-link"
          >
            Відкрити публічний профіль
          </a>
          <RouterLink v-else class="btn btn--ghost" to="/cabinet/profile">
            Увімкнути публічний профіль
          </RouterLink>
        </div>
        <div v-if="isPublicProfilePublished" class="muted final-check-note">
          Профіль відкриється у новій вкладці.
        </div>
        <div v-else class="muted final-check-note">
          Публічний профіль ще не опубліковано. Увімкніть його, щоб відкрити сторінку для клієнтів.
        </div>
      </section>

      <StickySaveBar
        v-if="isDirty"
        data-testid="profile-sticky-save-bar"
        :message="stickySaveMessage"
        :error="Boolean(error)"
        :saving="saving"
        @cancel="onCancelChanges"
        @save="onSave"
      />

      <div class="profile-footer">
        <button v-if="!isDirty" class="btn btn--primary" type="submit" :disabled="saving">
          {{ saving ? 'Збереження...' : 'Зберегти зміни' }}
        </button>
        <div v-if="success" class="muted">{{ success }}</div>
      </div>

    </form>

    <div v-if="cropperOpen" class="cropper-overlay">
      <div class="cropper-modal">
        <div class="cropper-header">
          <div class="cropper-title">Обрізка фото</div>
          <button class="btn btn--ghost btn--sm" type="button" @click="closeCropper">
            Скасувати
          </button>
        </div>
        <div class="cropper-body">
          <Cropper
            ref="cropperRef"
            class="cropper"
            :src="cropperSrc"
            :stencil-props="{ aspectRatio: 1 }"
            :auto-zoom="true"
          />
        </div>
        <div class="cropper-actions">
          <button class="btn btn--ghost" type="button" @click="closeCropper">
            Скасувати
          </button>
          <button class="btn" type="button" :disabled="cropSaving" @click="applyCrop">
            {{ cropSaving ? 'Збереження...' : 'Зберегти фото' }}
          </button>
        </div>
      </div>
    </div>

  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Cropper } from 'vue-advanced-cropper'
import {
  createProfileDocument,
  deleteProfileDocument,
  fetchSpecialistProfile,
  fetchProfileDocuments,
  updateProfileDocument,
  updateSpecialistProfile,
  uploadProfilePhoto,
  uploadProfileVideo,
  type SpecialistProfileDocument,
  type SpecialistProfile,
} from '../lib/api'
import SettingsSubnav from '../components/SettingsSubnav.vue'
import StickySaveBar from '../components/StickySaveBar.vue'
import { useDirtySnapshot } from '../composables/useDirtySnapshot'
import {
  profileSuggestionCategories,
  profileSuggestionCategoryKeywords,
  profileSuggestionPresets,
  type SuggestionCategoryKey,
  type SuggestionSectionKey,
} from '../constants/profileSuggestionPresets'
import {
  normalizeProfessionalFocus,
  professionalFocusOptions,
  type ProfessionalFocus,
} from '../constants/professionalFocus'
import { getSpecializationPresets } from '../constants/specializationPresets'

const loading = ref(true)
const route = useRoute()
const profileLoaded = ref(false)
const saving = ref(false)
const error = ref('')
const success = ref('')
const copyStatus = ref('')
const shareStatus = ref('')
const shareLoading = ref(false)
const slugEditOpen = ref(false)
const slugDraft = ref('')
const slugSaving = ref(false)
const slugError = ref('')
const photoUploading = ref(false)
const videoUploading = ref(false)
const photoPreviewUrl = ref('')
const videoPreviewUrl = ref('')
const photoInput = ref<HTMLInputElement | null>(null)
const videoInput = ref<HTMLInputElement | null>(null)
const cropperOpen = ref(false)
const cropperSrc = ref('')
const cropperRef = ref<any>(null)
const cropSaving = ref(false)
const cropFileName = ref('profile-photo.jpg')
const photoDeleteHoverVisible = ref(false)
const videoDeleteHoverVisible = ref(false)
const photoDeleting = ref(false)
const videoDeleting = ref(false)
const photoMediaError = ref('')
const videoMediaError = ref('')
const documents = ref<SpecialistProfileDocument[]>([])
const documentsLoading = ref(false)
const documentsError = ref('')
const documentsNotice = ref('')
const documentUploading = ref(false)
const updatingDocumentId = ref<number | null>(null)
const deletingDocumentId = ref<number | null>(null)
const documentFileInput = ref<HTMLInputElement | null>(null)
const newDocumentTitle = ref('')
const newDocumentKind = ref('CERTIFICATE')
const newDocumentIsPublic = ref(true)
const newDocumentFile = ref<File | null>(null)
const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const MAX_VIDEO_BYTES = 100 * 1024 * 1024
const ALLOWED_PHOTO_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const ALLOWED_PHOTO_EXT = new Set(['jpg', 'jpeg', 'png', 'webp'])
const ALLOWED_VIDEO_MIME = new Set(['video/mp4', 'video/quicktime', 'video/webm'])
const ALLOWED_VIDEO_EXT = new Set(['mp4', 'mov', 'webm'])
const languageOptions = [
  'Українська',
  'Російська',
  'English',
  'Polski',
  'Deutsch',
  'Français',
  'Español',
  'Italiano',
  'Português',
  'Čeština',
  'Slovenčina',
]

const experienceLabel = (value: number) => {
  if (value === 0) return 'до року'
  if (value === 1) return '1 рік'
  if (value >= 2 && value <= 4) return `${value} роки`
  return `${value} років`
}

const experienceOptions = Array.from({ length: 31 }, (_, value) => ({
  value,
  label: experienceLabel(value),
}))

const languageInput = ref('')
const languageList = ref<string[]>([])
const specializationInput = ref('')
const specializationList = ref<string[]>([])
const showOtherSpecialization = ref(false)
const otherSpecializationInput = ref('')
const disallowedLanguages = new Set<string>()
const selectedMainRequestsSuggestionCategory = ref<SuggestionCategoryKey | null>(null)
const selectedWorkBoundariesSuggestionCategory = ref<SuggestionCategoryKey | null>(null)
const educationItemsText = ref('')
const professionalDevelopmentItemsText = ref('')

function toStringList(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) => String(item || '').trim())
          .filter(Boolean)
      )
    )
  }
  return String(value)
    .split(/\r?\n|[,;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function listToMultilineText(value: unknown): string {
  const list = toStringList(value)
  return list.join('\n')
}

function multilineTextToList(value: string): string[] {
  return Array.from(
    new Set(
      String(value || '')
        .replace(/\r/g, '\n')
        .split('\n')
        .map((line) => line.replace(/^[\s•*–—-]+/, '').trim())
        .filter(Boolean)
    )
  )
}

function normalizeDocumentKind(value: string | null | undefined): string {
  const normalized = String(value ?? '').trim().toUpperCase()
  if (!normalized) return 'OTHER'
  if (normalized === 'LICENSE') return 'LICENCE'
  return normalized
}

const documentKindOptions = [
  { value: 'CERTIFICATE', label: 'Сертифікат' },
  { value: 'DIPLOMA', label: 'Диплом' },
  { value: 'LICENCE', label: 'Ліцензія' },
  { value: 'OTHER', label: 'Інший документ' },
]

function getCreateApiDocumentKind(kind: string): string | undefined {
  const normalized = normalizeDocumentKind(kind)
  if (normalized === 'LICENCE') return 'OTHER'
  if (normalized === 'OTHER') return 'OTHER'
  return normalized || undefined
}

function isInvalidDocumentKindError(err: unknown): boolean {
  const data = (err as { response?: { data?: unknown } })?.response?.data
  if (!data || typeof data !== 'object' || !('document_kind' in data)) return false
  const message = (data as { document_kind?: unknown }).document_kind
  if (Array.isArray(message)) {
    return message.some((item) => String(item).toLowerCase().includes('valid choice'))
  }
  return String(message ?? '').toLowerCase().includes('valid choice')
}

async function createDocumentWithKindFallback(payload: {
  file: File
  title: string
  document_kind: string
  is_public: boolean
}) {
  const apiKind = getCreateApiDocumentKind(payload.document_kind)
  try {
    return await createProfileDocument({
      file: payload.file,
      title: payload.title,
      document_kind: apiKind,
      is_public: payload.is_public,
    })
  } catch (err) {
    if (!isInvalidDocumentKindError(err)) {
      throw err
    }
    return await createProfileDocument({
      file: payload.file,
      title: payload.title,
      is_public: payload.is_public,
    })
  }
}

function setPreviewUrl(target: { value: string }, file?: File | null) {
  if (target.value) {
    URL.revokeObjectURL(target.value)
  }
  target.value = file ? URL.createObjectURL(file) : ''
}

function triggerPhotoSelect() {
  photoInput.value?.click()
}

function triggerVideoSelect() {
  videoInput.value?.click()
}

function openCropper(file: File) {
  if (cropperSrc.value) {
    URL.revokeObjectURL(cropperSrc.value)
  }
  cropperSrc.value = URL.createObjectURL(file)
  cropFileName.value = file.name || 'profile-photo.jpg'
  cropperOpen.value = true
}

function closeCropper() {
  cropperOpen.value = false
  if (cropperSrc.value) {
    URL.revokeObjectURL(cropperSrc.value)
  }
  cropperSrc.value = ''
  cropFileName.value = 'profile-photo.jpg'
}

function getCroppedFile(): Promise<File> {
  const result = cropperRef.value?.getResult?.()
  const canvas = result?.canvas
  if (!canvas) {
    return Promise.reject(new Error('Cropper not ready'))
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob: Blob | null) => {
        if (!blob) {
          reject(new Error('Не вдалося обрізати фото'))
          return
        }
        resolve(
          new File([blob], cropFileName.value || 'profile-photo.jpg', {
            type: blob.type || 'image/jpeg',
          })
        )
      },
      'image/jpeg',
      0.92
    )
  })
}

async function applyCrop() {
  cropSaving.value = true
  photoUploading.value = true
  error.value = ''
  try {
    const file = await getCroppedFile()
    setPreviewUrl(photoPreviewUrl, file)
    const data = await uploadProfilePhoto(file)
    closeCropper()
    if (data && typeof data === 'object') {
      Object.assign(profile, normalizeProfile(data))
      setPreviewUrl(photoPreviewUrl, null)
    }
    success.value = 'Фото завантажено.'
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити фото')
  } finally {
    cropSaving.value = false
    photoUploading.value = false
  }
}

function getApiErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object') {
    const status = (err as { response?: { status?: number } }).response?.status
    if (status === 401) {
      return 'Сесія завершилась. Увійдіть знову.'
    }
    const data = (err as { response?: { data?: unknown } }).response?.data
    if (data && typeof data === 'object' && 'detail' in data) {
      const detail = (data as { detail?: string }).detail
      if (detail) return detail
    }
    if (typeof data === 'string' && data.trim()) {
      const text = data.trim()
      if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
        return 'Помилка сервера. Спробуйте пізніше.'
      }
      return text
    }
    if (data && typeof data === 'object') {
      const [field, messages] = Object.entries(data as Record<string, unknown>)[0] || []
      if (field && Array.isArray(messages) && messages[0]) {
        return `${field}: ${messages[0]}`
      }
      if (field && typeof messages === 'string') {
        return `${field}: ${messages}`
      }
    }
    const message = (err as { message?: string }).message
    if (message) return message
  }
  return fallback
}

function documentKindLabel(kind: string): string {
  const normalized = normalizeDocumentKind(kind)
  const option = documentKindOptions.find((item) => item.value === normalized)
  if (option) return option.label
  return normalized || 'Документ'
}

function normalizeDocument(document: SpecialistProfileDocument): SpecialistProfileDocument {
  const parsedSortOrder = Number(document.sort_order)
  return {
    ...document,
    title: (document.title || '').trim() || 'Без назви',
    file_url: document.file_url || '',
    document_kind: normalizeDocumentKind(document.document_kind),
    is_public: Boolean(document.is_public),
    sort_order: Number.isFinite(parsedSortOrder) ? Math.max(0, Math.trunc(parsedSortOrder)) : 0,
    uploaded_at: document.uploaded_at || '',
    source: document.source || '',
  }
}

function sortProfileDocuments(list: SpecialistProfileDocument[]): SpecialistProfileDocument[] {
  return [...list].sort((a, b) => {
    const aTime = new Date(a.uploaded_at || '').getTime()
    const bTime = new Date(b.uploaded_at || '').getTime()
    if (aTime !== bTime) return bTime - aTime
    return b.id - a.id
  })
}

function resetDocumentForm() {
  newDocumentTitle.value = ''
  newDocumentKind.value = 'CERTIFICATE'
  newDocumentIsPublic.value = true
  newDocumentFile.value = null
  if (documentFileInput.value) {
    documentFileInput.value.value = ''
  }
}

function onDocumentFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null
  newDocumentFile.value = file
  if (file && !newDocumentTitle.value.trim()) {
    const fileNameWithoutExt = file.name.replace(/\.[^.]+$/, '').trim()
    if (fileNameWithoutExt) {
      newDocumentTitle.value = fileNameWithoutExt
    }
  }
}

async function onUploadDocument() {
  const normalizedTitle = String(newDocumentTitle.value ?? '').trim()
  if (!newDocumentFile.value || !normalizedTitle) {
    documentsError.value = 'Додайте назву та файл документа.'
    return
  }
  documentUploading.value = true
  documentsError.value = ''
  documentsNotice.value = ''
  try {
    const selectedKind = normalizeDocumentKind(newDocumentKind.value)
    const created = await createDocumentWithKindFallback({
      file: newDocumentFile.value,
      title: normalizedTitle,
      document_kind: selectedKind,
      is_public: newDocumentIsPublic.value,
    })
    documents.value = sortProfileDocuments([...documents.value, normalizeDocument(created)])
    const savedKind = normalizeDocumentKind(created.document_kind)
    documentsNotice.value =
      savedKind === selectedKind
        ? 'Документ завантажено.'
        : 'Документ завантажено. Тип документа автоматично узгоджено з API.'
    resetDocumentForm()
  } catch (err) {
    documentsError.value = getApiErrorMessage(err, 'Не вдалося завантажити документ.')
  } finally {
    documentUploading.value = false
  }
}

async function onUpdateDocument(document: SpecialistProfileDocument) {
  updatingDocumentId.value = document.id
  documentsError.value = ''
  documentsNotice.value = ''
  try {
    const updated = await updateProfileDocument(document.id, {
      title: String(document.title ?? '').trim(),
      is_public: document.is_public,
    })
    documents.value = sortProfileDocuments(
      documents.value.map((item) => (item.id === document.id ? normalizeDocument(updated) : item))
    )
    documentsNotice.value = 'Документ оновлено.'
  } catch (err) {
    documentsError.value = getApiErrorMessage(err, 'Не вдалося оновити документ.')
  } finally {
    updatingDocumentId.value = null
  }
}

async function onDeleteDocument(documentId: number) {
  deletingDocumentId.value = documentId
  documentsError.value = ''
  documentsNotice.value = ''
  try {
    await deleteProfileDocument(documentId)
    documents.value = documents.value.filter((item) => item.id !== documentId)
    documentsNotice.value = 'Документ видалено.'
  } catch (err) {
    documentsError.value = getApiErrorMessage(err, 'Не вдалося видалити документ.')
  } finally {
    deletingDocumentId.value = null
  }
}

function normalizeDecimal(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null
  const normalized = String(value).trim().replace(',', '.')
  if (!normalized) return null
  if (normalized === '.') return null
  return normalized.endsWith('.') ? normalized.slice(0, -1) || null : normalized
}

function sanitizeNumericInput(value: string): string {
  const normalized = value.replace(',', '.').replace(/[^\d.]/g, '')
  const firstDotIndex = normalized.indexOf('.')
  if (firstDotIndex < 0) return normalized

  const integerPartRaw = normalized.slice(0, firstDotIndex)
  const fractionalRaw = normalized.slice(firstDotIndex + 1).replace(/\./g, '')
  const integerPart = integerPartRaw || '0'
  const fractionalPart = fractionalRaw.slice(0, 2)
  if (!fractionalRaw && normalized.endsWith('.')) {
    return `${integerPart}.`
  }
  return fractionalPart ? `${integerPart}.${fractionalPart}` : integerPart
}

function onPriceInput(event: Event) {
  const target = event.target as HTMLInputElement
  const next = sanitizeNumericInput(target.value)
  profile.price = next
  if (target.value !== next) {
    target.value = next
  }
}

function onIntroPriceInput(event: Event) {
  const target = event.target as HTMLInputElement
  const next = sanitizeNumericInput(target.value)
  profile.intro_price = next
  if (target.value !== next) {
    target.value = next
  }
}

function buildProfilePayload() {
  return {
    public_profile_enabled: profile.public_profile_enabled,
    display_name: profile.display_name,
    professional_focus: normalizeProfessionalFocus(profile.professional_focus),
    setting_text: (profile.setting_text || '').trim(),
    bio_about: profile.bio_about,
    bio_work: profile.bio_work,
    bio_approach: profile.bio_approach,
    bio_for_whom: profile.bio_for_whom,
    bio_other: profile.bio_other,
    education_summary: (profile.education_summary || '').trim(),
    education_items: multilineTextToList(educationItemsText.value),
    professional_development_items: multilineTextToList(professionalDevelopmentItemsText.value),
    show_bio_about: profile.show_bio_about,
    show_bio_work: profile.show_bio_work,
    show_bio_approach: profile.show_bio_approach,
    show_bio_for_whom: profile.show_bio_for_whom,
    show_bio_other: profile.show_bio_other,
    offers_online: profile.offers_online,
    offers_offline: profile.offers_offline,
    offline_location: profile.offers_offline ? profile.offline_location.trim() : '',
    experience_years: profile.experience_years,
    specializations: specializationList.value,
    languages: languageList.value,
    location: profile.location,
    price: normalizeDecimal(profile.price),
    price_currency: profile.price_currency || 'UAH',
    intro_duration_minutes: profile.intro_duration_minutes,
    intro_price: normalizeDecimal(profile.intro_price),
    intro_price_currency: profile.intro_price_currency || 'UAH',
    contact_email: profile.contact_email,
    contact_phone: profile.contact_phone,
    messenger: profile.messenger,
    telegram: profile.telegram,
    viber: profile.viber,
    whatsapp: profile.whatsapp,
    show_email: profile.show_email,
    show_phone: profile.show_phone,
    show_messenger: profile.show_messenger,
    show_telegram: profile.show_telegram,
    show_viber: profile.show_viber,
    show_whatsapp: profile.show_whatsapp,
    show_video: profile.show_video,
    show_price: profile.show_price,
    show_intro_price: profile.show_intro_price,
    show_location: profile.show_location,
    show_photo: profile.show_photo,
  }
}

const profile = reactive<SpecialistProfile>({
  id: 0,
  public_profile_enabled: false,
  slug: '',
  public_profile_path: '',
  public_profile_url: '',
  public_slug: '',
  last_slug_rotated_at: null,
  offers_online: true,
  offers_offline: false,
  offline_location: '',
  professional_focus: null,
  display_name: '',
  setting_text: '',
  bio_about: '',
  bio_work: '',
  bio_approach: '',
  bio_for_whom: '',
  bio_other: '',
  education_summary: '',
  education_items: [],
  professional_development_items: [],
  show_bio_about: true,
  show_bio_work: true,
  show_bio_approach: true,
  show_bio_for_whom: true,
  show_bio_other: true,
  specializations: '',
  languages: '',
  location: '',
  experience_years: 0,
  price: '',
  price_currency: 'UAH',
  intro_duration_minutes: 30,
  intro_price: '',
  intro_price_currency: 'UAH',
  contact_email: '',
  contact_phone: '',
  messenger: '',
  telegram: '',
  viber: '',
  whatsapp: '',
  photo_url: '',
  video_url: '',
  show_email: false,
  show_phone: false,
  show_messenger: false,
  show_telegram: false,
  show_viber: false,
  show_whatsapp: false,
  show_video: false,
  show_price: false,
  show_intro_price: false,
  show_location: false,
  show_photo: false,
})

function normalizePublicProfilePath(value: string | null | undefined): string {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw)
      return parsed.pathname || ''
    } catch {
      return ''
    }
  }
  return raw.startsWith('/') ? raw : `/${raw}`
}

function normalizePublicProfileUrl(value: string | null | undefined): string {
  return String(value || '').trim()
}

function extractCanonicalSlug(pathOrUrl: string | null | undefined): string {
  const path = normalizePublicProfilePath(pathOrUrl)
  if (!path) return ''
  const match = path.match(/^\/s\/([^/?#]+)/i)
  if (!match?.[1]) return ''
  return match[1].trim()
}

const resolvedSlug = computed(() => {
  const direct = String(profile.slug || profile.public_slug || '').trim()
  if (direct) return direct
  const fromPath = extractCanonicalSlug(profile.public_profile_path)
  if (fromPath) return fromPath
  return extractCanonicalSlug(profile.public_profile_url)
})

const publicPath = computed(() => {
  const fromPath = normalizePublicProfilePath(profile.public_profile_path)
  if (fromPath) return fromPath
  const fromUrl = normalizePublicProfilePath(profile.public_profile_url)
  if (fromUrl) return fromUrl
  if (!resolvedSlug.value) return ''
  return `/s/${resolvedSlug.value}`
})

const publicUrl = computed(() => {
  const fromUrl = normalizePublicProfileUrl(profile.public_profile_url)
  if (fromUrl) return fromUrl
  if (!publicPath.value) return ''
  return `${window.location.origin}${publicPath.value}`
})

const slugPreviewPath = computed(() => {
  const nextSlug = slugDraft.value.trim() || resolvedSlug.value
  if (!nextSlug) return ''
  return `/s/${nextSlug}`
})

const isPublicProfilePublished = computed(() => Boolean(profile.public_profile_enabled && publicUrl.value))
const showPublicProfileNotPublishedHint = computed(
  () => route.query.public_profile === 'unpublished' && !profile.public_profile_enabled
)

type SuggestionFieldKey = 'bio_for_whom' | 'bio_other'

function normalizeSuggestionToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/^[\s•*–—-]+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function getSuggestionSet(field: SuggestionFieldKey): Set<string> {
  return new Set(
    String(profile[field] || '')
      .split(/\r?\n/)
      .map((line) => normalizeSuggestionToken(line))
      .filter(Boolean)
  )
}

function isSuggestionSelected(field: SuggestionFieldKey, suggestion: string): boolean {
  return getSuggestionSet(field).has(normalizeSuggestionToken(suggestion))
}

function appendSuggestionToField(field: SuggestionFieldKey, suggestion: string) {
  if (isSuggestionSelected(field, suggestion)) return
  const line = `• ${suggestion}`
  const current = String(profile[field] || '').replace(/\s+$/, '')
  profile[field] = current ? `${current}\n${line}` : line
}

const preferredSuggestionCategory = computed<SuggestionCategoryKey>(() => {
  const normalizedSpecializations = specializationList.value.map((item) => item.toLowerCase())
  for (const category of profileSuggestionCategories) {
    if (category.key === 'general') continue
    const keywords = profileSuggestionCategoryKeywords[category.key]
    if (
      keywords.some((keyword) =>
        normalizedSpecializations.some((specialization) => specialization.includes(keyword))
      )
    ) {
      return category.key
    }
  }
  return 'general'
})

const activeMainRequestsSuggestionCategory = computed<SuggestionCategoryKey>(
  () => selectedMainRequestsSuggestionCategory.value || preferredSuggestionCategory.value
)

const activeWorkBoundariesSuggestionCategory = computed<SuggestionCategoryKey>(
  () => selectedWorkBoundariesSuggestionCategory.value || preferredSuggestionCategory.value
)

const mainRequestSuggestions = computed(
  () => profileSuggestionPresets.main_requests[activeMainRequestsSuggestionCategory.value]
)

const workBoundarySuggestions = computed(
  () => profileSuggestionPresets.work_boundaries[activeWorkBoundariesSuggestionCategory.value]
)
const specializationPresetOptions = computed(() => getSpecializationPresets(profile.professional_focus))

function setSuggestionCategory(section: SuggestionSectionKey, category: SuggestionCategoryKey) {
  if (section === 'main_requests') {
    selectedMainRequestsSuggestionCategory.value = category
    return
  }
  selectedWorkBoundariesSuggestionCategory.value = category
}
type ProfileFormSnapshot = {
  public_profile_enabled: boolean
  display_name: string
  professional_focus: ProfessionalFocus | null
  setting_text: string
  bio_about: string
  bio_work: string
  bio_approach: string
  bio_for_whom: string
  bio_other: string
  education_summary: string
  education_items_text: string
  professional_development_items_text: string
  show_bio_about: boolean
  show_bio_work: boolean
  show_bio_approach: boolean
  show_bio_for_whom: boolean
  show_bio_other: boolean
  offers_online: boolean
  offers_offline: boolean
  offline_location: string
  experience_years: number
  specializations: string[]
  languages: string[]
  location: string
  price: string
  price_currency: string
  intro_duration_minutes: number
  intro_price: string
  intro_price_currency: string
  contact_email: string
  contact_phone: string
  messenger: string
  telegram: string
  viber: string
  whatsapp: string
  show_email: boolean
  show_phone: boolean
  show_messenger: boolean
  show_telegram: boolean
  show_viber: boolean
  show_whatsapp: boolean
  show_video: boolean
  show_price: boolean
  show_intro_price: boolean
  show_location: boolean
  show_photo: boolean
}

function createProfileFormSnapshot(): ProfileFormSnapshot {
  return {
    public_profile_enabled: profile.public_profile_enabled,
    display_name: profile.display_name || '',
    professional_focus: normalizeProfessionalFocus(profile.professional_focus),
    setting_text: profile.setting_text || '',
    bio_about: profile.bio_about || '',
    bio_work: profile.bio_work || '',
    bio_approach: profile.bio_approach || '',
    bio_for_whom: profile.bio_for_whom || '',
    bio_other: profile.bio_other || '',
    education_summary: profile.education_summary || '',
    education_items_text: educationItemsText.value,
    professional_development_items_text: professionalDevelopmentItemsText.value,
    show_bio_about: profile.show_bio_about,
    show_bio_work: profile.show_bio_work,
    show_bio_approach: profile.show_bio_approach,
    show_bio_for_whom: profile.show_bio_for_whom,
    show_bio_other: profile.show_bio_other,
    offers_online: profile.offers_online,
    offers_offline: profile.offers_offline,
    offline_location: profile.offline_location || '',
    experience_years: profile.experience_years,
    specializations: [...specializationList.value],
    languages: [...languageList.value],
    location: profile.location || '',
    price: profile.price || '',
    price_currency: profile.price_currency || 'UAH',
    intro_duration_minutes: profile.intro_duration_minutes,
    intro_price: profile.intro_price || '',
    intro_price_currency: profile.intro_price_currency || 'UAH',
    contact_email: profile.contact_email || '',
    contact_phone: profile.contact_phone || '',
    messenger: profile.messenger || '',
    telegram: profile.telegram || '',
    viber: profile.viber || '',
    whatsapp: profile.whatsapp || '',
    show_email: profile.show_email,
    show_phone: profile.show_phone,
    show_messenger: profile.show_messenger,
    show_telegram: profile.show_telegram,
    show_viber: profile.show_viber,
    show_whatsapp: profile.show_whatsapp,
    show_video: profile.show_video,
    show_price: profile.show_price,
    show_intro_price: profile.show_intro_price,
    show_location: profile.show_location,
    show_photo: profile.show_photo,
  }
}

const dirtySnapshot = useDirtySnapshot<ProfileFormSnapshot>(createProfileFormSnapshot)

function applyProfileFormSnapshot(snapshot: ProfileFormSnapshot) {
  const {
    education_items_text,
    professional_development_items_text,
    ...profileSnapshot
  } = snapshot
  Object.assign(profile, {
    ...profileSnapshot,
    education_items: multilineTextToList(education_items_text),
    professional_development_items: multilineTextToList(professional_development_items_text),
    specializations: [...profileSnapshot.specializations],
    languages: [...profileSnapshot.languages],
  })
  educationItemsText.value = education_items_text
  professionalDevelopmentItemsText.value = professional_development_items_text
  specializationList.value = [...profileSnapshot.specializations]
  languageList.value = [...profileSnapshot.languages]
  specializationInput.value = ''
  showOtherSpecialization.value = false
  otherSpecializationInput.value = ''
  languageInput.value = ''
}

const isDirty = computed(() => dirtySnapshot.hasSavedSnapshot.value && dirtySnapshot.isDirty.value)

const stickySaveMessage = computed(() => error.value || 'Є незбережені зміни')

function onCancelChanges() {
  if (saving.value) return
  const savedSnapshot = dirtySnapshot.getSavedSnapshot()
  if (!savedSnapshot) return
  applyProfileFormSnapshot(savedSnapshot)
  error.value = ''
  success.value = ''
}

async function loadProfile() {
  loading.value = true
  documentsLoading.value = true
  error.value = ''
  documentsNotice.value = ''
  documentsError.value = ''
  try {
    const profileData = await fetchSpecialistProfile()
    profileLoaded.value = true
    Object.assign(profile, normalizeProfile(profileData))
    languageList.value = sanitizeLanguages(toList(profile.languages))
    specializationList.value = toList(profile.specializations)
    educationItemsText.value = listToMultilineText(profile.education_items)
    professionalDevelopmentItemsText.value = listToMultilineText(
      profile.professional_development_items
    )
    specializationInput.value = ''
    showOtherSpecialization.value = false
    otherSpecializationInput.value = ''
    languageInput.value = ''
    slugDraft.value = resolvedSlug.value
    slugEditOpen.value = false
    slugError.value = ''
    selectedMainRequestsSuggestionCategory.value = null
    selectedWorkBoundariesSuggestionCategory.value = null
    dirtySnapshot.markSaved()
    setPreviewUrl(photoPreviewUrl, null)
    setPreviewUrl(videoPreviewUrl, null)
    resetDocumentForm()
  } catch (err) {
    profileLoaded.value = false
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити профіль')
  } finally {
    loading.value = false
  }

  if (error.value) {
    documents.value = []
    documentsLoading.value = false
    return
  }

  try {
    const documentData = await fetchProfileDocuments()
    documents.value = sortProfileDocuments(documentData.map(normalizeDocument))
  } catch (err) {
    documents.value = []
    documentsError.value = getApiErrorMessage(err, 'Не вдалося завантажити документи.')
  } finally {
    documentsLoading.value = false
  }
}

async function onSave() {
  saving.value = true
  success.value = ''
  error.value = ''
  if (!profile.offers_online && !profile.offers_offline) {
    error.value = 'Оберіть щонайменше один формат консультацій: онлайн або офлайн.'
    saving.value = false
    return
  }
  try {
    if (showOtherSpecialization.value && otherSpecializationInput.value.trim()) {
      addOtherSpecialization()
    }
    const data = await updateSpecialistProfile(buildProfilePayload())
    Object.assign(profile, normalizeProfile(data))
    languageList.value = sanitizeLanguages(toList(profile.languages))
    specializationList.value = toList(profile.specializations)
    educationItemsText.value = listToMultilineText(profile.education_items)
    professionalDevelopmentItemsText.value = listToMultilineText(
      profile.professional_development_items
    )
    specializationInput.value = ''
    showOtherSpecialization.value = false
    otherSpecializationInput.value = ''
    languageInput.value = ''
    slugDraft.value = resolvedSlug.value
    dirtySnapshot.markSaved()
    success.value = 'Збережено.'
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося зберегти')
  } finally {
    saving.value = false
  }
}

function startSlugEdit() {
  slugDraft.value = resolvedSlug.value
  slugEditOpen.value = true
  slugError.value = ''
}

function cancelSlugEdit() {
  slugEditOpen.value = false
  slugDraft.value = resolvedSlug.value
  slugError.value = ''
}

function mapSlugUpdateError(err: unknown): string {
  const payload = (err as { response?: { data?: any } })?.response?.data
  const code =
    String(payload?.code || '').trim() ||
    String(payload?.slug?.[0]?.code || '').trim() ||
    String(payload?.slug?.[0] || '').trim()
  if (code === 'SLUG_INVALID') {
    return 'Некоректний формат адреси. Використайте латинські літери, цифри або дефіс.'
  }
  if (code === 'SLUG_RESERVED') {
    return 'Ця адреса недоступна. Спробуйте інший варіант.'
  }
  if (code === 'SLUG_TAKEN') {
    return 'Ця адреса вже зайнята. Спробуйте іншу.'
  }
  return ''
}

async function saveSlug() {
  const nextSlug = slugDraft.value.trim()
  if (!nextSlug) {
    slugError.value = 'Некоректний формат адреси. Використайте латинські літери, цифри або дефіс.'
    return
  }
  slugSaving.value = true
  slugError.value = ''
  error.value = ''
  success.value = ''
  copyStatus.value = ''
  shareStatus.value = ''
  try {
    const data = await updateSpecialistProfile({ slug: nextSlug })
    Object.assign(profile, normalizeProfile(data))
    slugDraft.value = resolvedSlug.value
    slugEditOpen.value = false
    success.value = 'Адресу профілю оновлено.'
  } catch (err) {
    slugError.value = mapSlugUpdateError(err) || getApiErrorMessage(err, 'Не вдалося оновити адресу')
  } finally {
    slugSaving.value = false
  }
}

async function onCopyLink() {
  copyStatus.value = ''
  if (!profile.public_profile_enabled) {
    copyStatus.value = 'Публічний профіль ще не опубліковано. Увімкніть його в налаштуваннях.'
    return
  }
  if (!publicUrl.value) {
    copyStatus.value = 'Публічного посилання ще немає.'
    return
  }
  try {
    await navigator.clipboard.writeText(publicUrl.value)
    copyStatus.value = 'Скопійовано.'
  } catch {
    copyStatus.value = 'Не вдалося скопіювати.'
  }
}

async function onShareProfile() {
  shareStatus.value = ''
  if (!profile.public_profile_enabled) {
    shareStatus.value = 'Публічний профіль ще не опубліковано. Увімкніть його в налаштуваннях.'
    return
  }
  if (!publicUrl.value) {
    shareStatus.value = 'Публічного посилання ще немає.'
    return
  }
  shareLoading.value = true
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Профіль спеціаліста', url: publicUrl.value })
      shareStatus.value = 'Посилання на профіль надіслано.'
      return
    }
    await navigator.clipboard.writeText(publicUrl.value)
    shareStatus.value = 'Посилання скопійовано.'
  } catch {
    shareStatus.value = 'Не вдалося поділитись посиланням.'
  } finally {
    shareLoading.value = false
  }
}

async function onPhotoSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  error.value = ''
  photoMediaError.value = ''
  if (!isAllowedFileType(file, ALLOWED_PHOTO_MIME, ALLOWED_PHOTO_EXT)) {
    photoMediaError.value = 'Підтримуються формати JPG, PNG, WEBP.'
    input.value = ''
    return
  }
  if (file.size > MAX_PHOTO_BYTES) {
    photoMediaError.value = 'Фото перевищує допустимий розмір 5 МБ.'
    input.value = ''
    return
  }
  openCropper(file)
  input.value = ''
}

async function onVideoSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  videoMediaError.value = ''
  if (!isAllowedFileType(file, ALLOWED_VIDEO_MIME, ALLOWED_VIDEO_EXT)) {
    videoMediaError.value = 'Підтримуються формати MP4, MOV, WEBM.'
    input.value = ''
    return
  }
  if (file.size > MAX_VIDEO_BYTES) {
    videoMediaError.value = 'Відео перевищує допустимий розмір 100 МБ.'
    input.value = ''
    return
  }
  setPreviewUrl(videoPreviewUrl, file)
  videoUploading.value = true
  error.value = ''
  try {
    const data = await uploadProfileVideo(file)
    Object.assign(profile, normalizeProfile(data))
    setPreviewUrl(videoPreviewUrl, null)
    success.value = 'Відео завантажено.'
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити відео')
  } finally {
    videoUploading.value = false
    input.value = ''
  }
}

async function onDeletePhoto() {
  if (photoDeleting.value || photoUploading.value) return
  error.value = ''
  photoMediaError.value = ''
  success.value = ''
  photoDeleting.value = true
  try {
    const data = await updateSpecialistProfile({ photo_url: '' })
    Object.assign(profile, normalizeProfile(data))
    setPreviewUrl(photoPreviewUrl, null)
    photoDeleteHoverVisible.value = false
    success.value = 'Фото видалено.'
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося видалити фото')
  } finally {
    photoDeleting.value = false
  }
}

async function onDeleteVideo() {
  if (videoDeleting.value || videoUploading.value) return
  error.value = ''
  videoMediaError.value = ''
  success.value = ''
  videoDeleting.value = true
  try {
    const data = await updateSpecialistProfile({ video_url: '' })
    Object.assign(profile, normalizeProfile(data))
    setPreviewUrl(videoPreviewUrl, null)
    videoDeleteHoverVisible.value = false
    success.value = 'Відео видалено.'
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося видалити відео')
  } finally {
    videoDeleting.value = false
  }
}

function normalizeProfile(data: SpecialistProfile): SpecialistProfile {
  const canonicalSlug = String(data.slug || data.public_slug || '').trim()
  const canonicalPath =
    normalizePublicProfilePath(data.public_profile_path) ||
    (canonicalSlug ? `/s/${canonicalSlug}` : '')
  const canonicalUrl =
    normalizePublicProfileUrl(data.public_profile_url) ||
    (canonicalPath ? `${window.location.origin}${canonicalPath}` : '')

  return {
    ...data,
    slug: canonicalSlug,
    public_slug: String(data.public_slug || canonicalSlug).trim(),
    public_profile_path: canonicalPath,
    public_profile_url: canonicalUrl,
    offers_online: typeof data.offers_online === 'boolean' ? data.offers_online : true,
    offers_offline: typeof data.offers_offline === 'boolean' ? data.offers_offline : false,
    offline_location: data.offline_location || '',
    professional_focus: normalizeProfessionalFocus(data.professional_focus),
    display_name: data.display_name || '',
    setting_text: data.setting_text || '',
    bio_about: data.bio_about || '',
    bio_work: data.bio_work || '',
    bio_approach: data.bio_approach || '',
    bio_for_whom: data.bio_for_whom || '',
    bio_other: data.bio_other || '',
    education_summary: data.education_summary || '',
    education_items: toStringList(data.education_items),
    professional_development_items: toStringList(data.professional_development_items),
    show_bio_about: data.show_bio_about ?? true,
    show_bio_work: data.show_bio_work ?? true,
    show_bio_approach: data.show_bio_approach ?? true,
    show_bio_for_whom: data.show_bio_for_whom ?? true,
    show_bio_other: data.show_bio_other ?? true,
    specializations: toStringValue(data.specializations),
    languages: toStringValue(data.languages),
    location: data.location || '',
    experience_years: typeof data.experience_years === 'number' ? data.experience_years : 0,
    price: data.price || '',
    price_currency: data.price_currency || 'UAH',
    intro_duration_minutes: typeof data.intro_duration_minutes === 'number' ? data.intro_duration_minutes : 30,
    intro_price: data.intro_price || '',
    intro_price_currency: data.intro_price_currency || 'UAH',
    contact_email: data.contact_email || '',
    contact_phone: data.contact_phone || '',
    messenger: data.messenger || '',
    telegram: data.telegram || '',
    viber: data.viber || '',
    whatsapp: data.whatsapp || '',
    photo_url: data.photo_url || '',
    video_url: data.video_url || '',
    show_telegram: data.show_telegram ?? false,
    show_viber: data.show_viber ?? false,
    show_whatsapp: data.show_whatsapp ?? false,
    show_intro_price: data.show_intro_price ?? false,
  }
}

function addLanguage() {
  const raw = languageInput.value.trim()
  if (!raw) return
  const cleaned = raw.replace(/,+$/, '').trim()
  if (!cleaned) {
    languageInput.value = ''
    return
  }
  const existing = new Set(languageList.value.map((item) => item.toLowerCase()))
  if (disallowedLanguages.has(cleaned.toLowerCase())) {
    languageInput.value = ''
    return
  }
  if (!existing.has(cleaned.toLowerCase())) {
    languageList.value = [...languageList.value, cleaned]
  }
  languageInput.value = ''
}

function removeLanguage(language: string, index: number) {
  if (index >= 0 && index < languageList.value.length && languageList.value[index] === language) {
    languageList.value.splice(index, 1)
    return
  }
  const fallbackIndex = languageList.value.findIndex((item) => item === language)
  if (fallbackIndex >= 0) {
    languageList.value.splice(fallbackIndex, 1)
  }
}

function onLanguageKeydown(event: KeyboardEvent) {
  if (event.key === ',') {
    event.preventDefault()
    addLanguage()
  }
}

function onLanguageInput() {
  const value = languageInput.value.trim()
  if (!value) return
  if (languageOptions.includes(value)) {
    addLanguage()
  }
}

function getFileExtension(fileName: string) {
  const normalized = fileName.trim().toLowerCase()
  const idx = normalized.lastIndexOf('.')
  if (idx === -1 || idx === normalized.length - 1) return ''
  return normalized.slice(idx + 1)
}

function isAllowedFileType(file: File, allowedMime: Set<string>, allowedExt: Set<string>) {
  const mime = (file.type || '').toLowerCase()
  if (mime && allowedMime.has(mime)) return true
  const extension = getFileExtension(file.name)
  return Boolean(extension && allowedExt.has(extension))
}

function addSpecialization() {
  const value = specializationInput.value.trim()
  appendSpecializationValue(value)
  specializationInput.value = ''
}

function appendSpecializationValue(value: string) {
  if (!value) return
  if (value.toLowerCase() === 'інше') {
    showOtherSpecialization.value = true
    otherSpecializationInput.value = ''
    return
  }
  if (!specializationList.value.includes(value)) {
    specializationList.value.push(value)
  }
}

function addOtherSpecialization() {
  const value = otherSpecializationInput.value.trim()
  if (!value) return
  if (!specializationList.value.includes(value)) {
    specializationList.value.push(value)
  }
  otherSpecializationInput.value = ''
  showOtherSpecialization.value = false
}

function removeSpecialization(index: number) {
  if (index < 0 || index >= specializationList.value.length) return
  specializationList.value.splice(index, 1)
}

function onSpecializationKeydown(event: KeyboardEvent) {
  if (event.key === ',') {
    event.preventDefault()
    addSpecialization()
  }
}

function onSpecializationInput() {
  const value = specializationInput.value.trim()
  if (!value) return
  if (value.toLowerCase() === 'інше') {
    addSpecialization()
    return
  }
  if (specializationPresetOptions.value.includes(value)) {
    addSpecialization()
  }
}

function isSpecializationSelected(value: string): boolean {
  return specializationList.value.includes(value)
}

function appendSpecializationSuggestion(value: string) {
  appendSpecializationValue(value)
}

function toStringValue(value: string | string[] | null | undefined): string {
  if (!value) return ''
  if (Array.isArray(value)) return value.join(', ')
  if (value === '[]') return ''
  return String(value)
}

function toList(value: string | string[] | null | undefined): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean)
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function sanitizeLanguages(list: string[]): string[] {
  return list.filter((item) => !disallowedLanguages.has(item.trim().toLowerCase()))
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.profile {
  display: grid;
  gap: 18px;
}

.profile-notice {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid color-mix(in srgb, var(--primary) 20%, var(--border));
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--primary) 6%, #ffffff);
}

.profile-notice__text {
  margin: 0;
  color: var(--text);
}

.profile__hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 92% 70%, color-mix(in srgb, var(--pc-peach-100) 70%, transparent) 0 120px, transparent 121px),
    linear-gradient(135deg, #ffffff 0%, color-mix(in srgb, var(--pc-primary-soft) 70%, #ffffff) 54%, color-mix(in srgb, var(--pc-yellow-soft) 45%, #ffffff) 100%);
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-panel);
  padding: 24px;
  box-shadow: var(--pc-shadow-soft);
}

.profile__hero > * {
  position: relative;
  z-index: 1;
}

.profile__hero::after {
  content: "";
  position: absolute;
  right: -44px;
  bottom: -58px;
  width: 180px;
  height: 180px;
  border-radius: 999px;
  background: rgba(247, 183, 126, 0.18);
  pointer-events: none;
}

.profile__title {
  margin: 8px 0 8px;
  color: var(--pc-navy-950);
  font-size: 32px;
  line-height: 1.15;
}

.profile__subtitle {
  max-width: 520px;
  color: var(--pc-text-muted);
  line-height: 1.55;
}

.profile__hero .badge {
  background: color-mix(in srgb, var(--pc-blue-soft) 82%, #ffffff);
  border-color: color-mix(in srgb, var(--pc-navy-900) 22%, var(--pc-border));
  color: var(--pc-navy-900);
}

.profile__actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.profile__actions .btn {
  border-radius: var(--pc-radius-control);
  font-weight: 700;
}

.profile__actions .btn--ghost {
  border-color: var(--pc-border);
  background: #fff;
  color: var(--pc-navy-900);
}

.profile :deep(.settings-subnav__link) {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
  background: #fff;
  color: var(--pc-text-muted);
}

.profile :deep(.settings-subnav__link:hover),
.profile :deep(.settings-subnav__link:focus-visible) {
  border-color: color-mix(in srgb, var(--pc-navy-900) 28%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-blue-soft) 76%, #ffffff);
  color: var(--pc-navy-900);
}

.profile :deep(.settings-subnav__link.is-active) {
  border-color: color-mix(in srgb, var(--pc-navy-900) 36%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-primary-soft) 80%, #ffffff);
  color: var(--pc-navy-900);
}

.toggle-chip {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.toggle-chip--on {
  background: color-mix(in srgb, var(--pc-navy-900) 10%, #ffffff);
  color: var(--pc-navy-900);
}

.toggle-chip--off {
  background: rgba(194, 75, 75, 0.2);
  color: #a03838;
}

.profile-grid {
  display: grid;
  gap: 16px;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 18px;
  background: #fff;
  display: grid;
  gap: 14px;
}

.panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.panel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 500;
  color: color-mix(in srgb, var(--text-2) 92%, #ffffff);
}

.panel__hint {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: color-mix(in srgb, var(--muted) 88%, #5e6b74);
  max-width: 640px;
}

.panel__meta {
  font-size: 12px;
  color: var(--muted);
}

.badge--soft {
  background: rgba(8, 113, 201, 0.12);
}

.panel--highlight {
  background: linear-gradient(135deg, #ffffff 0%, #f1f7ff 100%);
}

.details-stack {
  display: grid;
  gap: 10px;
}

.details {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 12px;
  background: #fdfaf6;
}

.details summary {
  cursor: pointer;
  font-weight: 600;
}

.details[open] summary {
  margin-bottom: 10px;
}

.field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.inline-check {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--muted);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
  color: var(--muted);
}

.contact {
  display: grid;
  gap: 6px;
  font-size: 13px;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.panel--final-check {
  background: linear-gradient(135deg, #ffffff 0%, #f7fbff 100%);
  border-style: dashed;
}

.final-check-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.final-check-note {
  margin-top: -4px;
  font-size: 13px;
}

.profile-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
}

.contacts-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 520px);
  gap: 16px;
  align-items: start;
}

.media-preview {
  display: grid;
  gap: 16px;
  width: 100%;
}

.media-preview--side {
  grid-template-columns: repeat(2, minmax(0, 240px));
  align-items: stretch;
  justify-content: start;
}

.media-preview--side .media-card {
  width: 100%;
}

.media-card {
  border: 1px dashed var(--line);
  border-radius: 16px;
  padding: 10px;
  background: #fdfaf6;
  display: grid;
  gap: 10px;
  grid-template-rows: auto 1fr auto;
  min-height: 200px;
}

.media-title {
  font-size: 13px;
  color: var(--muted);
}

.media-hint {
  font-size: 12px;
  color: var(--muted);
}

.media-hint--note {
  margin-top: -6px;
}

.media-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: #fff;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.media-frame img,
.media-frame video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 12px;
}

.media-remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.85);
  background: rgba(15, 43, 58, 0.8);
  color: #fff;
  font-size: 18px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
  z-index: 3;
}

.media-remove-btn:hover {
  background: rgba(15, 43, 58, 0.95);
}

.media-remove-btn:focus-visible {
  opacity: 1;
  pointer-events: auto;
  outline: 2px solid #fff;
  outline-offset: 1px;
}

.media-card:hover .media-remove-btn,
.media-card:focus-within .media-remove-btn,
.media-remove-btn.is-visible {
  opacity: 1;
  pointer-events: auto;
}

@media (hover: none) {
  .media-remove-btn {
    opacity: 1;
    pointer-events: auto;
  }
}

.cropper-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 27, 43, 0.55);
  display: grid;
  place-items: center;
  padding: 24px;
  z-index: 80;
}

.cropper-modal {
  width: min(720px, 92vw);
  background: #fff;
  border-radius: 18px;
  box-shadow: var(--shadow);
  display: grid;
  gap: 12px;
  padding: 16px;
  max-height: min(90vh, 820px);
}

.cropper-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.cropper-title {
  font-weight: 600;
}

.cropper-body {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  overflow: hidden;
  background: #f3f6f7;
  max-height: 60vh;
}

.cropper {
  width: 100%;
  height: 100%;
}

.cropper-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.media-empty {
  font-size: 12px;
  color: var(--muted);
  text-align: center;
  padding: 12px;
}

.media-status {
  font-size: 12px;
  color: var(--muted);
}

.media-status--error {
  color: #a63535;
}

.form--profile-basics {
  gap: 14px;
}

.form-group {
  display: grid;
  gap: 12px;
}

.form-group + .form-group {
  margin-top: 2px;
  padding-top: 14px;
  border-top: 1px solid color-mix(in srgb, var(--line) 72%, #ffffff);
}

.field-label {
  display: inline-block;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
  color: color-mix(in srgb, var(--text-2) 90%, #ffffff);
}

.field-label--section {
  margin-bottom: 1px;
}

.field-help {
  font-size: 12px;
  line-height: 1.5;
  color: color-mix(in srgb, var(--muted) 85%, #667580);
}

.quick-suggestions {
  margin-top: 10px;
  border: 1px dashed color-mix(in srgb, var(--line) 82%, #ffffff);
  border-radius: 12px;
  padding: 10px;
  background: color-mix(in srgb, #f7fbff 70%, #ffffff);
  display: grid;
  gap: 8px;
}

.quick-suggestions__title {
  font-size: 12px;
  font-weight: 600;
  color: color-mix(in srgb, var(--text-2) 84%, #ffffff);
}

.quick-suggestions__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.quick-suggestions__tab {
  border: 1px solid color-mix(in srgb, var(--line) 86%, #ffffff);
  background: #fff;
  color: color-mix(in srgb, var(--text-2) 84%, #ffffff);
  border-radius: 10px;
  padding: 5px 9px;
  font-size: 12px;
  line-height: 1.25;
  cursor: pointer;
}

.quick-suggestions__tab.is-active {
  border-color: color-mix(in srgb, var(--primary) 36%, #ffffff);
  background: color-mix(in srgb, var(--primary) 14%, #ffffff);
  color: color-mix(in srgb, var(--primary) 88%, #143248);
}

.quick-suggestions__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.quick-suggestion-chip {
  border: 1px solid color-mix(in srgb, var(--line) 88%, #ffffff);
  background: #fff;
  color: color-mix(in srgb, var(--text-2) 84%, #ffffff);
  border-radius: 10px;
  padding: 5px 9px;
  font-size: 12px;
  line-height: 1.25;
  cursor: pointer;
}

.quick-suggestion-chip.is-selected,
.quick-suggestion-chip:disabled {
  border-color: color-mix(in srgb, var(--primary) 32%, #ffffff);
  background: color-mix(in srgb, var(--primary) 12%, #ffffff);
  color: color-mix(in srgb, var(--primary) 85%, #143248);
  cursor: default;
}

.check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  line-height: 1.35;
  color: color-mix(in srgb, var(--text-2) 82%, #ffffff);
}

.check input[type="checkbox"] {
  margin: 0;
  accent-color: color-mix(in srgb, var(--primary) 78%, #124a66);
}

.form--profile-basics .input::placeholder {
  color: color-mix(in srgb, var(--muted) 62%, #ffffff);
}

.field-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.field--format {
  gap: 7px;
}

.meeting-format-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 4px 0 2px;
}

.field--half {
  margin: 0;
}

.input--file {
  padding: 10px 12px;
}

.input--select {
  min-width: 120px;
}

.documents-uploader {
  display: grid;
  gap: 10px;
  border: 1px dashed var(--line);
  border-radius: 14px;
  padding: 12px;
  background: #fdfaf6;
}

.documents-uploader__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.documents-uploader__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.documents-empty {
  border: 1px dashed var(--line);
  border-radius: 12px;
  padding: 12px;
  color: var(--muted);
  background: #fff;
}

.documents-list {
  display: grid;
  gap: 12px;
}

.documents-item {
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 12px;
  background: #fff;
  display: grid;
  gap: 10px;
}

.documents-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.documents-item__meta {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.documents-kind {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 999px;
  background: #f3efe6;
  border: 1px solid #e8dfd1;
  font-size: 12px;
  color: #5f5345;
}

.documents-visibility {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid transparent;
}

.documents-visibility--public {
  background: rgba(31, 122, 76, 0.12);
  border-color: rgba(31, 122, 76, 0.22);
  color: #1f7a4c;
}

.documents-visibility--private {
  background: rgba(97, 102, 110, 0.12);
  border-color: rgba(97, 102, 110, 0.2);
  color: #4f5861;
}

.documents-item__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.documents-item__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.is-hidden {
  display: none;
}

.chip-field {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f7f4ef;
  border: 1px solid var(--line);
  font-size: 12px;
}

.chip-remove {
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  color: var(--muted);
}

.chip-input {
  min-width: 220px;
  flex: 1;
}

.slug-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.slug {
  display: inline-flex;
  padding: 8px 12px;
  border-radius: 12px;
  background: #f7f4ef;
  border: 1px dashed var(--line);
  font-size: 13px;
}

.slug-edit {
  margin-top: 10px;
  display: grid;
  gap: 10px;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 12px;
  background: #fff;
}

.slug-edit__preview {
  font-size: 12px;
  color: var(--muted);
}

.slug-edit__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.slug-input {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}

.slug-input__prefix {
  padding: 0 10px;
  font-size: 13px;
  color: var(--muted);
  border-right: 1px solid var(--line);
  background: #f7f4ef;
  min-height: 38px;
  display: inline-flex;
  align-items: center;
}

.slug-input .input {
  border: 0;
  border-radius: 0;
  min-height: 38px;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: 10px;
  padding: 8px 10px;
}

@media (max-width: 980px) {
  .contacts-grid {
    grid-template-columns: 1fr;
  }

  .media-preview--side {
    grid-template-columns: 1fr;
  }

  .field-row {
    grid-template-columns: 1fr;
  }

  .documents-uploader__grid,
  .documents-item__grid {
    grid-template-columns: 1fr;
  }

  .profile__hero {
    flex-direction: column;
    align-items: flex-start;
    padding: 14px 16px;
    gap: 10px;
  }

  .profile__hero::after {
    display: none;
  }

  .profile__hero > div:first-child {
    width: 100%;
    min-width: 0;
  }

  .profile__title {
    font-size: 26px;
    margin: 4px 0;
    line-height: 1.16;
  }

  .profile__subtitle {
    max-width: 100%;
    margin: 0;
    font-size: 13px;
    line-height: 1.32;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .profile__actions {
    width: 100%;
    justify-content: flex-start;
    align-items: flex-start;
    min-width: 0;
  }

  .profile__actions .btn,
  .profile__actions .btn.btn--ghost {
    max-width: 100%;
  }

  .toggle-chip {
    max-width: 100%;
    white-space: normal;
    overflow-wrap: anywhere;
  }

}

@media (max-width: 640px) {
  .profile__hero {
    border-radius: var(--pc-radius-panel);
    padding: 12px 14px;
    gap: 10px;
  }

  .profile__title {
    font-size: 24px;
    margin: 4px 0;
    line-height: 1.16;
  }

  .profile__subtitle {
    margin: 0;
    font-size: 13px;
    line-height: 1.35;
    max-width: 100%;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .profile__title {
    font-size: 26px;
    line-height: 1.15;
  }

  .profile__actions {
    display: grid;
    width: 100%;
    gap: 10px;
  }

  .profile__actions .btn,
  .profile__actions .btn.btn--ghost,
  .profile__actions .toggle-chip {
    width: 100%;
  }
}
</style>
