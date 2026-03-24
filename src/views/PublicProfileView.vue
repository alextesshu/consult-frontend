<template>
  <section class="public">
    <header class="public__hero">
      <div class="hero-profile">
        <div class="hero-media" v-if="profile">
          <img
            v-if="profile.photo_url"
            class="hero-photo"
            :src="profile.photo_url"
            alt="Фото спеціаліста"
          />
          <div v-else class="hero-photo-placeholder">Фото спеціаліста</div>
          <video
            v-if="profile.video_url"
            class="hero-video"
            :src="profile.video_url"
            controls
            preload="metadata"
          ></video>
        </div>

        <div class="hero-main">
          <div class="badge">Профіль спеціаліста</div>
          <h1 class="title public__title">{{ publicName || 'Профіль спеціаліста' }}</h1>
          <p v-if="profile && heroRoleLine" class="hero-main__role">{{ heroRoleLine }}</p>
          <p class="hero-main__lead">{{ profile ? heroLeadText : 'Завантаження профілю' }}</p>
          <p v-if="profile && heroSupportText" class="hero-main__support">{{ heroSupportText }}</p>
          <p v-if="profile && completedSessionsBadge" class="hero-main__sessions">
            Проведено сесій: {{ completedSessionsBadge }}
          </p>

          <div v-if="profile && heroMetaHighlights.length" class="hero-main__meta">
            <article v-for="item in heroMetaHighlights" :key="item.label" class="hero-meta-card">
              <div class="hero-meta-card__label">{{ item.label }}</div>
              <div class="hero-meta-card__value">{{ item.value }}</div>
            </article>
          </div>

          <div v-if="profile && displaySpecializationChips.length" class="hero-trust">
            <span v-for="(chip, index) in displaySpecializationChips" :key="`${chip}-${index}`">{{ chip }}</span>
          </div>
        </div>
      </div>

      <aside class="hero-cta" v-if="profile">
        <div class="hero-cta__head">
          <div class="badge badge--soft">Наступний крок</div>
          <h2 class="hero-cta__title">Запишіться на консультацію</h2>
          <p class="hero-cta__hint">
            Оберіть зручний формат знайомства і переходьте до бронювання без зайвих кроків.
          </p>
        </div>
        <div class="hero-cta__prices">
          <div v-if="introPriceDisplay" class="hero-cta__price hero-cta__price--intro">
            Ознайомча сесія: {{ introPriceDisplay }}
            <span v-if="introDurationLabel">· {{ introDurationLabel }}</span>
          </div>
          <div v-if="priceDisplay" class="hero-cta__price">
            Консультація: {{ priceDisplay }}
            <span> · {{ standardSessionDurationLabel }}</span>
          </div>
        </div>
        <div class="hero-cta__actions">
          <button class="btn btn--primary" type="button" @click="handleHeroPrimaryAction">
            {{ heroPrimaryLabel }}
          </button>
          <RouterLink
            v-if="showClientSessionsCta"
            class="btn btn--ghost"
            to="/client"
          >
            Мої сесії
          </RouterLink>
          <a v-else class="btn btn--ghost" href="#slots">Переглянути вільні вікна</a>
          <RouterLink class="btn btn--ghost" :to="feedbackLink">Відгуки</RouterLink>
        </div>
      </aside>
    </header>

    <div v-if="loading" class="muted">Завантаження...</div>
    <div v-else-if="error" class="form-error">{{ error }}</div>

    <section v-else-if="profile" class="public__grid">
      <section class="panel panel--trust" v-if="trustItems.length">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Що важливо знати</div>
            <h2 class="panel__title">Довіра і формат</h2>
            <p class="panel__lead">Ключова інформація для спокійного рішення перед першим записом.</p>
          </div>
        </div>
        <div class="trust-grid">
          <article v-for="item in trustItems" :key="item.label" class="trust-card">
            <div class="trust-card__label">{{ item.label }}</div>
            <div class="trust-card__value">{{ item.value }}</div>
          </article>
        </div>
      </section>

      <section class="panel panel--documents" v-if="publicDocuments.length">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Документи</div>
            <h2 class="panel__title">Документи та сертифікати</h2>
            <p class="panel__lead">
              Матеріали, завантажені спеціалістом для ознайомлення. PRO CONSULT не здійснює автоматичної
              верифікації їх змісту, якщо інше прямо не зазначено.
            </p>
          </div>
        </div>
        <div class="documents-grid">
          <article
            v-for="document in publicDocuments"
            :key="document.id"
            class="document-card"
            :class="{ 'document-card--file': !isImageDocument(document) }"
          >
            <div v-if="isImageDocument(document)" class="document-card__preview">
              <img
                :src="document.file_url"
                :alt="document.title"
                loading="lazy"
              />
            </div>
            <div v-else class="document-card__file-top">
              <div class="document-card__file-badge">
                {{ isPdfDocument(document) ? 'PDF' : 'DOC' }}
              </div>
              <div class="document-card__kind document-card__kind--file">{{ documentKindLabel(document.document_kind) }}</div>
            </div>
            <div class="document-card__body">
              <div v-if="isImageDocument(document)" class="document-card__kind">{{ documentKindLabel(document.document_kind) }}</div>
              <h3 class="document-card__title">{{ document.title }}</h3>
              <div v-if="document.uploaded_at" class="document-card__meta">
                Додано: {{ formatDate(document.uploaded_at) }}
              </div>
            </div>
            <a
              class="btn btn--ghost document-card__action"
              :href="document.file_url"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ isPdfDocument(document) ? 'Відкрити документ' : 'Відкрити' }}
            </a>
          </article>
        </div>
      </section>

      <section v-if="showInquiryPanel" class="panel panel--inquiry" id="inquiry">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">До бронювання</div>
            <h2 class="panel__title">{{ inquiryLeadCopy.title }}</h2>
          </div>
        </div>

        <div class="inquiry-state" :class="`inquiry-state--${inquiryLeadCopy.tone}`">
          {{ inquiryLeadCopy.body }}
        </div>

        <div v-if="inquiryLoading" class="muted">Завантажуємо запит...</div>
        <div v-else-if="inquiryError" class="form-error">{{ inquiryError }}</div>
        <template v-else>
          <div v-if="inquiryMessages.length" class="inquiry-thread">
            <article
              v-for="message in inquiryMessages"
              :key="message.id"
              class="inquiry-message"
              :class="{ 'inquiry-message--mine': isMyInquiryMessage(message.sender_id) }"
            >
              <div class="inquiry-message__author">
                {{ isMyInquiryMessage(message.sender_id) ? 'Ви' : publicName || 'Спеціаліст' }}
              </div>
              <div class="inquiry-message__body">{{ message.body }}</div>
              <div class="inquiry-message__time muted">{{ formatDate(message.created_at) }}</div>
            </article>
          </div>

          <form
            v-if="showInquiryComposer"
            class="inquiry-composer"
            @submit.prevent="submitInquiryMessage"
          >
            <label class="slot-filter__label" for="inquiryBody">Ваше повідомлення</label>
            <textarea
              id="inquiryBody"
              v-model="inquiryDraft"
              class="input inquiry-composer__textarea"
              rows="4"
              placeholder="Коротко опишіть, що хочете уточнити перед бронюванням."
              :disabled="inquirySubmitting"
            ></textarea>
            <div class="muted inquiry-composer__hint">
              Короткий запит без вкладень і термінових звернень. Це не повноцінний чат.
            </div>
            <div v-if="inquirySubmitError" class="form-error">{{ inquirySubmitError }}</div>
            <button
              class="btn btn--primary"
              type="submit"
              :disabled="inquirySubmitting || !inquiryDraft.trim()"
            >
              {{ inquirySubmitLabel }}
            </button>
          </form>
        </template>
      </section>

      <div class="panel panel--slots" id="slots">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Доступні вільні вікна</div>
            <h2 class="panel__title">Найближчі дати</h2>
          </div>
        </div>

        <div class="slot-top">
          <div class="slot-filter">
            <div class="slot-week">
              <button
                v-for="day in weekDays"
                :key="day.date"
                class="slot-day"
                :class="{ 'slot-day--active': day.date === selectedDate }"
                type="button"
                @click="selectDay(day.date)"
              >
                <span class="slot-day__label">{{ day.label }}</span>
                <span class="slot-day__date">{{ day.dateLabel }}</span>
              </button>
            </div>
            <label class="slot-filter__label" for="slotDate">Оберіть дату</label>
            <input
              id="slotDate"
              class="input slot-filter__input"
              type="date"
              v-model="selectedDate"
              :min="todayInputValue"
              ref="slotDateInput"
              @click="openDatePicker"
              @focus="openDatePicker"
            />
            <div class="muted slot-filter__hint">
              Оберіть дату, щоб переглянути доступні вільні вікна.
            </div>
            <div class="slot-format">
              <div class="slot-filter__label">Формат сесії</div>
              <div
                v-if="needsSessionFormatChoice"
                class="slot-format__options"
                role="radiogroup"
                aria-label="Формат сесії"
              >
                <label class="slot-format__option">
                  <input
                    v-model="bookingSessionFormat"
                    type="radio"
                    name="sessionFormat"
                    value="online"
                  />
                  <span>Онлайн</span>
                </label>
                <label class="slot-format__option">
                  <input
                    v-model="bookingSessionFormat"
                    type="radio"
                    name="sessionFormat"
                    value="offline"
                  />
                  <span>Офлайн</span>
                </label>
              </div>
              <div v-else class="slot-format__fixed">
                Формат визначено профілем: {{ sessionFormatLabelForBooking || '—' }}
              </div>
              <div v-if="bookingOfflineLocationHint" class="muted slot-format__hint">
                Локація офлайн-сесій: {{ bookingOfflineLocationHint }}
              </div>
            </div>
          </div>

          <aside class="slot-info" aria-label="Умови бронювання">
            <div class="slot-info__title">Перед записом</div>
            <ul class="slot-info__list">
              <li v-if="!isAuthenticated">Щоб забронювати час, увійдіть у свій кабінет клієнта.</li>
              <li v-else-if="!isClient">Бронювання доступне лише для клієнтів.</li>
              <li v-else>Бронювання доступне в кабінеті клієнта.</li>
              <li>Спеціаліст підтверджує сесію після запису.</li>
              <li>Нагадування надходять після підтвердження.</li>
            </ul>
            <RouterLink v-if="!isAuthenticated" class="btn btn--ghost btn--sm slot-info__action" to="/login">
              Увійти
            </RouterLink>
          </aside>
        </div>

        <section
          v-if="isAuthenticated && isClient"
          class="booking-gate"
          :class="{
            'booking-gate--pending': !settingAccepted,
            'booking-gate--ready': settingAccepted,
            'booking-gate--attention': settingAttention,
          }"
          aria-label="Підтвердження правил перед бронюванням"
        >
          <div class="booking-gate__content">
            <div>
              <div class="booking-gate__title">Перед записом підтвердьте сетінг</div>
              <p class="booking-gate__text">
                Відкрийте правила спеціаліста, ознайомтеся з умовами і підтвердьте згоду. Після цього можна
                натискати «Записатися» у слотах нижче.
              </p>
            </div>
            <button
              class="btn btn--ghost btn--sm booking-gate__button"
              :class="{ 'btn--pulse': settingAttention }"
              type="button"
              ref="settingButtonRef"
              @click="openSettingModal"
            >
              {{ settingAccepted ? 'Переглянути сетінг ще раз' : 'Відкрити сетінг і правила' }}
            </button>
          </div>
          <label class="setting-check booking-gate__check">
            <input type="checkbox" v-model="settingAccepted" />
            <span>Я ознайомився(-лась) і погоджуюсь з умовами бронювання</span>
          </label>
          <div class="booking-gate__hint">
            {{
              settingAccepted
                ? 'Правила підтверджено. Оберіть час і натисніть «Записатися».'
                : 'Без цього підтвердження кнопки бронювання нижче не спрацюють.'
            }}
          </div>
        </section>

        <div v-if="bookingSuccess" class="success">{{ bookingSuccess }}</div>
        <div v-if="bookingError" class="form-error">{{ bookingError }}</div>
        <div v-if="upcomingConfirmed.length" class="confirmed-block">
          <div class="confirmed-title">Підтверджені сесії у вас заплановані</div>
          <div class="confirmed-list">
            <div v-for="session in upcomingConfirmed" :key="session.id" class="confirmed-item">
            <div class="confirmed-time">{{ formatDate(session.start_at) }}</div>
              <div class="muted">{{ formatDuration(session.start_at, session.end_at) }}</div>
            </div>
          </div>
        </div>

        <div class="slot-list-heading">Вільні вікна на обрану дату</div>

        <div v-if="slotsLoading" class="muted">Завантажуємо вільні вікна</div>
        <div v-else-if="slotsError" class="form-error">{{ slotsError }}</div>
        <div v-else-if="slots.length === 0" class="muted">
          {{ noSlotsAvailable ? 'Наразі вільних віконець немає.' : 'На жаль, у цей день вільних віконець немає.' }}
        </div>
        <div v-else class="slot-list">
          <div v-for="slot in visibleSlots" :key="slot.id" class="slot-card">
            <div>
              <div class="slot-time">{{ formatDate(slot.start_at) }}</div>
              <div class="muted">{{ formatDuration(slot.start_at, slot.end_at) }}</div>
            </div>
            <button
              class="btn btn--ghost"
              :class="{ 'btn--disabled': isBookingDisabled(slot.id) }"
              type="button"
              :aria-disabled="isBookingDisabled(slot.id)"
              @click="handleBookingClick(slot.id)"
            >
              {{ bookingSlotId === slot.id ? 'Бронюємо...' : 'Записатися' }}
            </button>
          </div>
          <button
            v-if="hasMoreSlots"
            class="btn btn--ghost slot-list__toggle"
            type="button"
            @click="showAllSlots = !showAllSlots"
          >
            {{ showAllSlots ? 'Показати менше' : `Показати весь розклад (${slots.length})` }}
          </button>
        </div>

        <div class="first-session-flow">
          <article class="flow-card">
            <div class="flow-card__title">Як проходить перша сесія</div>
            <ul class="flow-card__list">
              <li>Коротке знайомство та уточнення вашого запиту.</li>
              <li>Спокійна розмова у вашому темпі без тиску.</li>
              <li>Узгодження наступних кроків наприкінці зустрічі.</li>
            </ul>
          </article>
          <article class="flow-card">
            <div class="flow-card__title">Як підготуватись</div>
            <ul class="flow-card__list">
              <li>Достатньо тихого місця й стабільного інтернету.</li>
              <li>Не потрібно готуватись “ідеально” чи щось доводити.</li>
              <li>Можна заздалегідь подумати, що зараз для вас найважливіше.</li>
            </ul>
          </article>
          <article class="flow-card">
            <div class="flow-card__title">Що буде після запису</div>
            <ul class="flow-card__list">
              <li>Сесія з'явиться у вашому кабінеті клієнта.</li>
              <li>Після підтвердження спеціаліста ви отримаєте нагадування.</li>
              <li>За потреби зможете перенести або скасувати запис у кабінеті.</li>
            </ul>
          </article>
        </div>
      </div>

      <section class="panel panel--work-format">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Формат</div>
            <h2 class="panel__title">Формат роботи</h2>
          </div>
        </div>
        <div class="work-format-grid">
          <div v-if="meetingFormatLabel" class="profile-summary__item">
            Формат зустрічей: {{ meetingFormatLabel }}
          </div>
          <div v-if="introDurationLabel" class="profile-summary__item">
            Тривалість ознайомчої сесії: {{ introDurationLabel }}
          </div>
          <div v-if="introPriceDisplay" class="profile-summary__item">
            Вартість ознайомчої сесії: {{ introPriceDisplay }}
          </div>
          <div v-if="offlineMeetingLocation" class="profile-summary__item">
            Локація офлайн-зустрічей: {{ offlineMeetingLocation }}
          </div>
          <div v-else-if="profile.location" class="profile-summary__item">
            Локація: {{ profile.location }}
          </div>
          <div v-if="priceDisplay" class="profile-summary__item">
            Консультація: {{ priceDisplay }} · {{ standardSessionDurationLabel }}
          </div>
          <div class="profile-summary__item">
            Що буде після запису: сесія з’явиться в кабінеті, після підтвердження надійде нагадування.
          </div>
        </div>
      </section>

      <section class="panel panel--about" v-if="aboutSections.length">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Про спеціаліста</div>
            <h2 class="panel__title">Про спеціаліста</h2>
            <p class="panel__lead">Познайомтеся з підходом та стилем роботи перед першою консультацією.</p>
          </div>
        </div>
        <div class="about-grid">
          <article v-for="section in aboutSections" :key="section.title" class="bio-section">
            <div class="bio-title">{{ section.title }}</div>
            <div class="bio-copy">{{ section.body }}</div>
          </article>
        </div>
      </section>

      <section class="panel panel--who" v-if="whoThisIsForText">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Кому підійде</div>
            <h2 class="panel__title">З якими запитами я працюю</h2>
          </div>
        </div>
        <div class="muted who-lead">Цей формат може підійти вам, якщо...</div>
        <div class="who-text">{{ whoThisIsForText }}</div>
        <div v-if="specializationChips.length" class="hero-trust">
          <span v-for="(chip, index) in specializationChips" :key="`${chip}-${index}`">{{ chip }}</span>
        </div>
      </section>

      <section class="panel panel--contacts" v-if="showDirectContactActions">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Зв’язок</div>
            <h2 class="panel__title">Зв’язок зі спеціалістом</h2>
          </div>
        </div>
        <div class="contact-actions">
          <a
            v-for="item in contactActions"
            :key="item.label"
            class="contact-action"
            :href="item.href"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="contact-action__label">{{ item.label }}</span>
            <span class="contact-action__value">{{ item.value }}</span>
          </a>
        </div>
      </section>

      <div class="panel panel--journal" id="journal">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Авторський журнал</div>
            <h2 class="panel__title">Статті та матеріали спеціаліста</h2>
            <p class="panel__lead">Матеріали допоможуть краще відчути стиль роботи і теми спеціаліста.</p>
          </div>
          <div class="panel__header-actions">
            <RouterLink class="btn btn--ghost btn--sm" :to="{ name: 'public-journal', params: { slug } }">
              Всі статті
            </RouterLink>
          </div>
        </div>

        <div v-if="journalLoading" class="muted">Завантажуємо журнал...</div>
        <div v-else-if="journalError" class="form-error">{{ journalError }}</div>
        <div v-else>
          <section v-if="previewCollections.length" class="profile-collections">
            <div class="profile-collections__head">
              <div class="profile-collections__title">Серії</div>
              <RouterLink class="btn btn--ghost btn--sm" :to="{ name: 'public-journal', params: { slug } }">
                Переглянути всі
              </RouterLink>
            </div>
            <div class="profile-collections__list">
              <RouterLink
                v-for="collection in previewCollections"
                :key="collection.slug"
                class="profile-collection-item"
                :to="{
                  name: 'public-journal-collection',
                  params: { specialist_slug: slug, collection_slug: collection.slug },
                }"
              >
                <div class="profile-collection-item__left">
                  <div v-if="collectionCoverUrl(collection)" class="profile-collection-item__cover">
                    <img :src="collectionCoverUrl(collection)" :alt="collection.title" />
                  </div>
                  <span class="profile-collection-item__name">{{ collection.title }}</span>
                </div>
                <span class="profile-collection-item__meta">{{ collection.posts_count }} статті</span>
              </RouterLink>
            </div>
          </section>

          <div v-if="filteredJournalPosts.length === 0" class="empty">
            <div class="empty-title">Немає статей у цій категорії</div>
            <div class="muted">Спробуйте інший фільтр або поверніться до всіх статей.</div>
            <button class="btn btn--ghost btn--sm" type="button" @click="activeCategory = 'ALL'">
              Повернути всі статті
            </button>
          </div>
          <div v-else class="journal-list">
            <div class="journal-filters" role="tablist" aria-label="Фільтр статей">
              <button
                v-for="opt in categoryOptions"
                :key="opt.key"
                type="button"
                class="filter-chip"
                :class="{ 'is-active': activeCategory === opt.key }"
                @click="activeCategory = opt.key"
              >
                {{ opt.label }}
              </button>
            </div>
            <article
              v-if="featuredPost"
              :class="[
                'journal-card',
                'journal-card--feature',
                featuredPost.is_featured ? 'journal-card--pinned' : '',
                'journal-card--closed',
              ]"
              role="button"
              tabindex="0"
              @click="navigateToPost(featuredPost)"
              @keydown.enter="navigateToPost(featuredPost)"
              @keydown.space.prevent="navigateToPost(featuredPost)"
            >
              <div class="journal-body">
                <span class="post-tag" :style="{ '--cat': categoryColor(featuredPost.category) }">
                  {{ categoryLabel(featuredPost.category) }}
                </span>
                <span v-if="featuredPost.is_featured" class="pin-badge">Закріплено</span>
                <div class="journal-title">{{ featuredPost.title }}</div>
                <div class="journal-meta">
                  {{ formatDate(featuredPost.published_at || featuredPost.created_at) }}
                  · {{ readingTime(featuredPost.summary) }} хв читання
                </div>
                <div class="journal-summary" v-if="featuredPost.summary" v-html="renderMarkdown(featuredPost.summary)"></div>
                <RouterLink
                  class="read-more"
                  :to="{ name: 'public-journal-post', params: { slug, postSlug: featuredPost.slug } }"
                  @click.stop
                >
                  Читати статтю →
                </RouterLink>
              </div>
              <div v-if="featuredPost.cover_image_url" class="journal-cover">
                <img :src="featuredPost.cover_image_url" alt="Обкладинка статті" />
              </div>
            </article>

            <div class="journal-grid">
              <article
                v-for="post in gridPosts"
                :key="post.id"
                :class="[
                  'journal-card',
                  post.is_featured ? 'journal-card--pinned' : '',
                  'journal-card--closed',
                ]"
                role="button"
                tabindex="0"
                @click="navigateToPost(post)"
                @keydown.enter="navigateToPost(post)"
                @keydown.space.prevent="navigateToPost(post)"
              >
                <div class="journal-body">
                  <span class="post-tag" :style="{ '--cat': categoryColor(post.category) }">
                    {{ categoryLabel(post.category) }}
                  </span>
                  <span v-if="post.is_featured" class="pin-badge">Закріплено</span>
                  <div class="journal-title">{{ post.title }}</div>
                  <div class="journal-meta">
                    {{ formatDate(post.published_at || post.created_at) }}
                    · {{ readingTime(post.summary) }} хв читання
                  </div>
                  <div
                    class="journal-summary"
                    v-if="post.summary"
                    v-html="renderMarkdown(post.summary)"
                  ></div>
                  <RouterLink
                    class="read-more"
                    :to="{ name: 'public-journal-post', params: { slug, postSlug: post.slug } }"
                    @click.stop
                  >
                    Читати статтю →
                  </RouterLink>
                </div>
                <div v-if="post.cover_image_url" class="journal-cover">
                  <img :src="post.cover_image_url" alt="Обкладинка статті" />
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>

      <section class="panel panel--reviews" v-if="reviews.length">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Відгуки</div>
            <h2 class="panel__title">Що кажуть клієнти</h2>
          </div>
          <RouterLink class="btn btn--ghost btn--sm" :to="feedbackLink">Усі відгуки</RouterLink>
        </div>
        <div class="reviews-list">
          <article v-for="review in reviews" :key="review.id" class="review-card">
            <div class="review-card__text">{{ review.review_text }}</div>
            <div class="review-card__meta">{{ formatDate(review.created_at) }}</div>
          </article>
        </div>
      </section>

      <section class="panel panel--footer-cta">
        <div class="closing-cta">
          <div class="closing-cta__copy">
            <h2 class="closing-cta__title">Готові зробити перший крок?</h2>
            <p class="closing-cta__subtitle">{{ closingCtaSupportLine }}</p>
          </div>
          <div class="closing-cta__actions">
            <button class="btn btn--primary" type="button" @click="handleClosingPrimaryAction">
              {{ closingPrimaryLabel }}
            </button>
            <RouterLink
              v-if="closingSecondaryKind === 'sessions'"
              class="btn btn--ghost"
              to="/client"
            >
              Мої сесії
            </RouterLink>
            <RouterLink
              v-else-if="closingSecondaryKind === 'reviews'"
              class="btn btn--ghost"
              :to="feedbackLink"
            >
              Відгуки
            </RouterLink>
            <button
              v-else-if="closingSecondaryKind === 'slots'"
              class="btn btn--ghost"
              type="button"
              @click="scrollToSlots"
            >
              Переглянути вільні вікна
            </button>
            <a
              v-else-if="closingSecondaryKind === 'contact'"
              class="btn btn--ghost"
              :href="primaryContactHref"
              target="_blank"
              rel="noopener noreferrer"
            >
              Написати спеціалісту
            </a>
          </div>
        </div>
      </section>
    </section>

    <div v-if="showBookingModal" class="setting-modal">
      <div class="setting-modal__backdrop" @click="closeBookingModal"></div>
      <div class="setting-modal__content">
        <div class="setting-modal__header">
          <h3>Ви успішно записалися</h3>
          <button class="btn btn--ghost btn--sm" type="button" @click="closeBookingModal">
            Закрити
          </button>
        </div>
        <div class="setting-modal__body">
          <div class="booking-confirm">
            Слот заброньовано. Спеціаліст має підтвердити сесію, після цього статус оновиться у вашому кабінеті.
          </div>
          <div v-if="lastBookedSlot" class="booking-slot">
            <div class="muted">Дата і час сесії</div>
            <div class="booking-slot__time">{{ formatDate(lastBookedSlot.start_at) }}</div>
            <div class="muted">{{ formatDuration(lastBookedSlot.start_at, lastBookedSlot.end_at) }}</div>
          </div>
          <div class="booking-next">
            <div class="booking-next__title">Що далі</div>
            <div class="booking-next__item">• Перевіряйте статус і деталі у кабінеті клієнта.</div>
            <div class="booking-next__item">• Після підтвердження сесії сервіс нагадає про зустріч.</div>
            <div class="booking-next__item">• Якщо плани зміняться, ви можете перенести або скасувати запис у деталях сесії.</div>
          </div>
        </div>
        <div class="setting-modal__footer">
          <RouterLink class="btn" to="/client">Перейти в кабінет</RouterLink>
          <button class="btn btn--ghost" type="button" @click="closeBookingModal">
            Закрити
          </button>
        </div>
      </div>
    </div>

    <div v-if="showSettingModal" class="setting-modal">
      <div class="setting-modal__backdrop" @click="closeSettingModal"></div>
      <div class="setting-modal__content">
        <div class="setting-modal__header">
          <h3>Сетінг</h3>
          <button class="btn btn--ghost btn--sm" type="button" @click="closeSettingModal">Закрити</button>
        </div>
        <div class="setting-modal__body">
          <div class="setting-section" v-if="platformSettingText">
            <div class="setting-title">Загальні правила простору</div>
            <div class="muted">{{ platformSettingText }}</div>
          </div>
          <div class="setting-section" v-if="therapistSettingText">
            <div class="setting-title">Сетінг спеціаліста</div>
            <div class="muted">{{ therapistSettingText }}</div>
          </div>
          <div v-if="!platformSettingText && !therapistSettingText" class="muted">
            Сетінг ще не додано.
          </div>
          <label class="setting-check setting-check--modal">
            <input type="checkbox" v-model="settingAccepted" />
            <span>Погоджуюсь з умовами</span>
          </label>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { useRoute, useRouter } from 'vue-router'
import { getApiErrorMessage } from '../lib/errors'
import {
  BOOKING_ERROR_FALLBACKS,
  BOOKING_SUCCESS_MESSAGES,
  BOOKING_UI_MESSAGES,
  getBookingErrorMessage,
} from '../lib/bookingCopy'
import { getInquiryActionErrorMessage, mapInquiryStateToUi } from '../lib/inquiryCopy'
import {
  apiGet,
  apiPost,
  type BookingSessionCreatePayload,
  type SessionFormat,
  createInquiryThread,
  fetchChatThreads,
  fetchInquiryMessages,
  fetchInquiryState,
  sendInquiryMessage,
} from '../lib/api'
import { toLocalDate, toUtcRange } from '../lib/dates'
import { formatUkDateTimeCompact, formatUkDayMonth, formatUkWeekdayShort } from '../lib/dateTime'
import {
  fetchPublicSpecialistProfile,
  fetchPublicAuthorJournalPosts,
  fetchPublicJournalCollections,
  type ChatThread,
  type InquiryMessage,
  type InquiryState,
  type PublicSpecialistProfile,
  type PublicSpecialistProfileDocument,
  type PublicAuthorJournalPost,
  type PublicJournalCollectionListItem,
} from '../lib/api'
import { getCompletedSessionsBadge } from '../lib/completedSessionsBadge'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'

type PublicSlot = {
  id: number
  start_at: string
  end_at: string
}

type ClientSession = {
  id: number
  status: string
  therapist?: number
  therapist_public_slug?: string | null
  slot?: { start_at: string; end_at: string } | null
  slot_start_at?: string | null
  slot_end_at?: string | null
}

type PublicReview = {
  id: number
  review_text: string
  created_at: string
}

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToast()
const profile = ref<PublicSpecialistProfile | null>(null)
const slots = ref<PublicSlot[]>([])
const loading = ref(false)
const slotsLoading = ref(false)
const error = ref('')
const slotsError = ref('')
const noSlotsAvailable = ref(false)
const bookingError = ref('')
const bookingSuccess = ref('')
const bookingSlotId = ref<number | null>(null)
const showBookingModal = ref(false)
const lastBookedSlot = ref<PublicSlot | null>(null)
const settingAccepted = ref(false)
const showSettingModal = ref(false)
const settingAttention = ref(false)
const settingButtonRef = ref<HTMLElement | null>(null)
let settingAttentionTimer: number | null = null
const clientSessions = ref<ClientSession[]>([])
const pastClientSessions = ref<ClientSession[]>([])
const chatThreads = ref<ChatThread[]>([])
const inquiryState = ref<InquiryState | null>(null)
const inquiryMessages = ref<InquiryMessage[]>([])
const inquiryLoading = ref(false)
const inquiryError = ref('')
const inquiryDraft = ref('')
const inquirySubmitError = ref('')
const inquirySubmitting = ref(false)
const journalPosts = ref<PublicAuthorJournalPost[]>([])
const journalCollections = ref<PublicJournalCollectionListItem[]>([])
const journalLoading = ref(false)
const journalError = ref('')
const reviews = ref<PublicReview[]>([])
type JournalCategory = 'ALL' | 'TIP' | 'EXPLAIN' | 'FAQ' | 'RESEARCH' | 'PRACTICE'
const activeCategory = ref<JournalCategory>('ALL')
const categoryOptions: { key: JournalCategory; label: string }[] = [
  { key: 'ALL', label: 'Усі' },
  { key: 'TIP', label: 'Порада' },
  { key: 'EXPLAIN', label: 'Пояснення' },
  { key: 'PRACTICE', label: 'Практика' },
  { key: 'RESEARCH', label: 'Дослідження' },
  { key: 'FAQ', label: 'FAQ' },
]
const selectedDate = ref('')
const slotDateInput = ref<HTMLInputElement | null>(null)
const showAllSlots = ref(false)
const slotsPreviewLimit = 5
const bookingSessionFormat = ref<SessionFormat>('online')

const slug = computed(() => String(route.params.slug || '').trim())
const roles = computed(() => auth.me?.user.roles ?? auth.user?.roles ?? [])
const isAuthenticated = computed(() => Boolean(auth.accessToken))
const isClient = computed(() => roles.value.includes('CLIENT'))
const canBook = computed(() => isAuthenticated.value && isClient.value)
const hasOnlineBooking = computed(() => Boolean(profile.value?.offers_online))
const hasOfflineBooking = computed(() => Boolean(profile.value?.offers_offline))
const needsSessionFormatChoice = computed(
  () => hasOnlineBooking.value && hasOfflineBooking.value
)
const resolvedSessionFormat = computed<SessionFormat | null>(() => {
  if (needsSessionFormatChoice.value) return bookingSessionFormat.value
  if (hasOnlineBooking.value && !hasOfflineBooking.value) return 'online'
  if (!hasOnlineBooking.value && hasOfflineBooking.value) return 'offline'
  return null
})
const sessionFormatLabelForBooking = computed(() => {
  if (resolvedSessionFormat.value === 'online') return 'Онлайн'
  if (resolvedSessionFormat.value === 'offline') return 'Офлайн'
  return ''
})
const bookingOfflineLocationHint = computed(() => {
  if (resolvedSessionFormat.value !== 'offline') return ''
  return offlineMeetingLocation.value
})
const isBookingDisabled = (slotId: number) =>
  !canBook.value || bookingSlotId.value === slotId || !settingAccepted.value
const visibleSlots = computed(() => (showAllSlots.value ? slots.value : slots.value.slice(0, slotsPreviewLimit)))
const hasMoreSlots = computed(() => slots.value.length > slotsPreviewLimit)
const matchesProfileSession = (session: ClientSession) => {
  if (!profile.value) return false
  const specialistId = profile.value.therapist_id
  const sessionSpecialist = session.therapist
  if (specialistId && sessionSpecialist) {
    return specialistId === sessionSpecialist
  }
  if (profile.value.public_slug && session.therapist_public_slug) {
    return profile.value.public_slug === session.therapist_public_slug
  }
  return false
}
const relatedUpcomingSessions = computed(() => clientSessions.value.filter((session) => matchesProfileSession(session)))
const relatedPastSessions = computed(() => pastClientSessions.value.filter((session) => matchesProfileSession(session)))
const upcomingConfirmed = computed(() => {
  return relatedUpcomingSessions.value
    .filter((session) => (session.status || '') === 'CONFIRMED')
    .map((session) => {
      const slot = session.slot || null
      return {
        id: session.id,
        start_at: slot?.start_at || session.slot_start_at || '',
        end_at: slot?.end_at || session.slot_end_at || '',
      }
    })
    .filter((item) => item.start_at && item.end_at)
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
})
const profileChatThread = computed(() => {
  if (!profile.value?.therapist_id) return null
  return chatThreads.value.find((thread) => thread.therapist_id === profile.value?.therapist_id) || null
})
const hasActiveClientRelation = computed(() => {
  if (!isClient.value || !isAuthenticated.value) return false
  return inquiryState.value?.inquiry_status === 'ACTIVE_CLIENT' || Boolean(profileChatThread.value)
})
const canMessageSpecialist = computed(() => Boolean(isClient.value && isAuthenticated.value && hasActiveClientRelation.value))
const hasClientHistoryWithSpecialist = computed(
  () => relatedUpcomingSessions.value.length > 0 || relatedPastSessions.value.length > 0
)
const showClientSessionsCta = computed(
  () => Boolean(isClient.value && isAuthenticated.value && hasClientHistoryWithSpecialist.value)
)
const showInquiryEntry = computed(() => {
  if (!isAuthenticated.value || !isClient.value || !profile.value || !inquiryState.value) return false
  return inquiryState.value.inquiry_status !== 'ACTIVE_CLIENT'
})
const showInquiryPanel = computed(() => {
  if (!isAuthenticated.value || !isClient.value || !profile.value) return false
  if (hasActiveClientRelation.value) return false
  return inquiryLoading.value || Boolean(inquiryState.value)
})
const weekDays = computed(() => {
  const base = new Date()
  const days: Array<{ date: string; label: string; dateLabel: string }> = []
  for (let i = 0; i < 10; i += 1) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    const date = toLocalDate(d)
    const label = formatUkWeekdayShort(d)
    const dateLabel = formatUkDayMonth(d)
    days.push({ date, label, dateLabel })
  }
  return days
})
const platformSettingText = computed(() => profile.value?.platform_setting_text || '')
const therapistSettingText = computed(() => profile.value?.setting_text || '')

const languagesDisplay = computed(() => {
  const value = profile.value?.languages
  if (!value) return ''
  if (Array.isArray(value)) return value.join(', ')
  return value
})

function toTextList(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const specializationChips = computed(() => toTextList(profile.value?.specializations))
const displaySpecializationChips = computed(() => specializationChips.value.slice(0, 6))

const publicName = computed(() => formatPublicName(profile.value?.display_name) || profile.value?.display_name || '')

function firstFilledText(...values: Array<string | null | undefined>) {
  return values
    .map((value) => (value || '').replace(/\s+/g, ' ').trim())
    .find(Boolean) || ''
}

function toSnippet(value: string, maxLength = 220) {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (!normalized) return ''
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`
}

const heroRoleLine = computed(() => {
  if (!profile.value) return ''
  const parts: string[] = []
  const specializationLine = displaySpecializationChips.value.slice(0, 2).join(', ')
  if (specializationLine) parts.push(specializationLine)
  if (profile.value.location) parts.push(profile.value.location)
  return parts.join(' · ')
})

const heroLeadText = computed(() => {
  const source = firstFilledText(profile.value?.bio_about, profile.value?.bio, profile.value?.bio_work)
  if (!source) return 'Спеціаліст описує формат роботи та допомагає зробити перший крок у зручному для вас темпі.'
  return toSnippet(source, 250)
})

const heroSupportText = computed(() => {
  const source = firstFilledText(profile.value?.bio_approach, profile.value?.bio_work, profile.value?.bio_for_whom)
  if (!source) return ''
  const lead = heroLeadText.value
  const normalizedSource = toSnippet(source, 180)
  if (normalizedSource === lead) return ''
  return normalizedSource
})

const completedSessionsBadge = computed(() => {
  return getCompletedSessionsBadge(profile.value?.completed_sessions_count)
})

const meetingFormatLabel = computed(() => {
  if (!profile.value) return ''
  const hasOnline = Boolean(profile.value.offers_online)
  const hasOffline = Boolean(profile.value.offers_offline)
  if (hasOnline && hasOffline) return 'Онлайн та офлайн'
  if (hasOnline) return 'Онлайн'
  if (hasOffline) return 'Офлайн'
  return ''
})

const offlineMeetingLocation = computed(() => {
  if (!profile.value?.offers_offline) return ''
  return (profile.value.offline_location || '').trim()
})

const heroMetaHighlights = computed(() => {
  if (!profile.value) return []
  const items: Array<{ label: string; value: string }> = []
  if (profile.value.experience_years !== undefined && profile.value.experience_years !== null) {
    items.push({ label: 'Досвід', value: formatExperience(profile.value.experience_years) })
  }
  if (languagesDisplay.value) {
    items.push({ label: 'Мови', value: languagesDisplay.value })
  }
  if (introDurationLabel.value) {
    items.push({ label: 'Ознайомча сесія', value: introDurationLabel.value })
  }
  if (introPriceDisplay.value) {
    items.push({ label: 'Вартість старту', value: introPriceDisplay.value })
  } else if (priceDisplay.value) {
    items.push({ label: 'Консультація', value: priceDisplay.value })
  }
  return items.slice(0, 4)
})

const feedbackLink = computed(() => ({
  name: 'specialist-feedback',
  params: { slug: profile.value?.public_slug || slug.value },
}))
const heroPrimaryLabel = computed(() => {
  if (canMessageSpecialist.value) return 'Написати повідомлення'
  if (showInquiryEntry.value) {
    return inquiryState.value?.inquiry_exists ? 'Уточнити деталі' : 'Поставити запитання'
  }
  return 'Записатися на ознайомчу сесію'
})

const closingPrimaryLabel = computed(() => {
  if (canMessageSpecialist.value) return 'Написати спеціалісту'
  if (showInquiryEntry.value) {
    return inquiryState.value?.inquiry_exists ? 'Уточнити деталі' : 'Поставити запитання'
  }
  return 'Записатися на ознайомчу сесію'
})

const closingCtaSupportLine = computed(() => {
  if (introDurationLabel.value && introPriceDisplay.value) {
    return `Ознайомча сесія: ${introDurationLabel.value} · ${introPriceDisplay.value}`
  }
  if (introPriceDisplay.value) {
    return `Ознайомча сесія: ${introPriceDisplay.value}`
  }
  if (introDurationLabel.value) {
    return `Ознайомча сесія: ${introDurationLabel.value}`
  }
  if (priceDisplay.value) {
    return `Консультація: ${priceDisplay.value} · ${standardSessionDurationLabel.value}`
  }
  return 'Оберіть зручний формат і час для першого знайомства.'
})

const closingSecondaryKind = computed<'sessions' | 'reviews' | 'slots' | 'contact'>(() => {
  if (showClientSessionsCta.value) return 'sessions'
  if (canMessageSpecialist.value) return 'reviews'
  if (showInquiryEntry.value) return 'slots'
  if (primaryContactHref.value) return 'contact'
  return 'reviews'
})

function formatPriceAmount(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const raw = String(value).trim()
  if (!raw) return ''
  return raw.replace(/([.,])00$/, '')
}

function formatPriceDisplay(value: string | number | null | undefined, currency?: string | null): string {
  const amount = formatPriceAmount(value)
  if (!amount) return ''
  const code = (currency || 'UAH').toUpperCase()
  if (code === 'UAH') return `${amount} грн`
  if (code === 'USD') return `$${amount}`
  if (code === 'EUR') return `€${amount}`
  return `${amount} ${code}`
}

const priceDisplay = computed(() => {
  return formatPriceDisplay(profile.value?.price, profile.value?.price_currency)
})

const introPriceDisplay = computed(() => {
  return formatPriceDisplay(profile.value?.intro_price, profile.value?.intro_price_currency)
})

const introDurationLabel = computed(() => {
  const minutes = profile.value?.intro_duration_minutes
  if (!minutes) return ''
  return `${minutes} хв`
})

const aboutSections = computed(() => {
  if (!profile.value) return []
  return [
    { title: 'Про мене', body: profile.value.bio_about || profile.value.bio || '' },
    { title: 'Як я працюю', body: profile.value.bio_work || '' },
    { title: 'Мій підхід', body: profile.value.bio_approach || '' },
  ].filter((section) => section.body)
})

const whoThisIsForText = computed(() => profile.value?.bio_for_whom || '')

const trustItems = computed(() => {
  if (!profile.value) return []
  const items: Array<{ label: string; value: string }> = []
  if (meetingFormatLabel.value) {
    items.push({ label: 'Формат зустрічей', value: meetingFormatLabel.value })
  }
  if (profile.value.experience_years !== undefined && profile.value.experience_years !== null) {
    items.push({ label: 'Досвід', value: formatExperience(profile.value.experience_years) })
  }
  if (languagesDisplay.value) items.push({ label: 'Мови', value: languagesDisplay.value })
  if (offlineMeetingLocation.value) {
    items.push({ label: 'Офлайн локація', value: offlineMeetingLocation.value })
  } else if (profile.value.location) {
    items.push({ label: 'Локація', value: profile.value.location })
  }
  if (introDurationLabel.value) items.push({ label: 'Ознайомча сесія', value: introDurationLabel.value })
  if (standardSessionDurationLabel.value) {
    items.push({ label: 'Стандартна сесія', value: standardSessionDurationLabel.value })
  }
  return items
})

const publicDocuments = computed<PublicSpecialistProfileDocument[]>(() => {
  const documents = profile.value?.profile_documents || []
  return documents
    .filter((item) => Boolean(item?.file_url && item?.title))
    .map((item) => ({
      ...item,
      title: item.title.trim(),
      document_kind: normalizeDocumentKind(item.document_kind),
    }))
    .sort((a, b) => new Date(b.uploaded_at || '').getTime() - new Date(a.uploaded_at || '').getTime())
})

function normalizeDocumentKind(kind: string | null | undefined): string {
  const normalized = String(kind ?? '').trim().toUpperCase()
  if (!normalized) return 'OTHER'
  if (normalized === 'LICENSE') return 'LICENCE'
  return normalized
}

function documentKindLabel(kind: string): string {
  switch (normalizeDocumentKind(kind)) {
    case 'CERTIFICATE':
      return 'Сертифікат'
    case 'DIPLOMA':
      return 'Диплом'
    case 'LICENCE':
      return 'Ліцензія'
    default:
      return 'Документ'
  }
}

function documentFileExtension(fileUrl: string): string {
  const beforeHash = (fileUrl || '').split('#')[0] ?? ''
  const cleanUrl = beforeHash.split('?')[0] ?? ''
  const dotIndex = cleanUrl.lastIndexOf('.')
  if (dotIndex < 0) return ''
  return cleanUrl.slice(dotIndex + 1).toLowerCase()
}

function isPdfDocument(document: PublicSpecialistProfileDocument): boolean {
  if ((document.document_kind || '').toUpperCase() === 'PDF') return true
  return documentFileExtension(document.file_url) === 'pdf'
}

function isImageDocument(document: PublicSpecialistProfileDocument): boolean {
  const extension = documentFileExtension(document.file_url)
  return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'avif'].includes(extension)
}

function normalizeTelegramHref(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://t.me/${trimmed.replace(/^@/, '')}`
}

function normalizeWhatsAppHref(value: string) {
  const digits = value.replace(/[^\d+]/g, '')
  if (!digits) return ''
  if (/^https?:\/\//i.test(value.trim())) return value.trim()
  return `https://wa.me/${digits.replace('+', '')}`
}

function normalizeViberHref(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `viber://chat?number=${trimmed.replace(/[^\d+]/g, '')}`
}

const contactActions = computed(() => {
  if (!profile.value) return []
  const items: Array<{ label: string; value: string; href: string }> = []
  if (profile.value.contact_email) {
    items.push({
      label: 'Email',
      value: profile.value.contact_email,
      href: `mailto:${profile.value.contact_email}`,
    })
  }
  if (profile.value.contact_phone) {
    const phone = profile.value.contact_phone
    items.push({
      label: 'Телефон',
      value: phone,
      href: `tel:${phone.replace(/[^\d+]/g, '')}`,
    })
  }
  if (profile.value.telegram) {
    items.push({
      label: 'Telegram',
      value: profile.value.telegram,
      href: normalizeTelegramHref(profile.value.telegram),
    })
  }
  if (profile.value.whatsapp) {
    items.push({
      label: 'WhatsApp',
      value: profile.value.whatsapp,
      href: normalizeWhatsAppHref(profile.value.whatsapp),
    })
  }
  if (profile.value.viber) {
    items.push({
      label: 'Viber',
      value: profile.value.viber,
      href: normalizeViberHref(profile.value.viber),
    })
  }
  if (profile.value.messenger) {
    const messenger = profile.value.messenger
    items.push({
      label: 'Messenger / Signal',
      value: messenger,
      href: /^https?:\/\//i.test(messenger) ? messenger : `https://m.me/${messenger.replace(/^@/, '')}`,
    })
  }
  return items.filter((item) => Boolean(item.href))
})

const showDirectContactActions = computed(() => Boolean(contactActions.value.length && !isClient.value))

const primaryContactHref = computed(() =>
  !canMessageSpecialist.value && !showInquiryEntry.value && showDirectContactActions.value
    ? contactActions.value[0]?.href || ''
    : ''
)

const inquiryLeadCopy = computed(() => {
  const state = inquiryState.value
  if (!state) {
    return mapInquiryStateToUi({
      status: 'NOT_CREATED',
      actor: 'client',
      mode: 'entry',
    })
  }

  const reasonCode = state.inquiry_exists
    ? state.can_client_send
      ? null
      : state.client_send_reason_code
      : state.can_create_inquiry
        ? null
        : state.create_reason_code

  if (
    state.inquiry_exists &&
    state.inquiry_status === 'OPEN' &&
    state.can_client_send === false &&
    state.client_send_reason_code === 'FOLLOW_UP_REQUIRES_SPECIALIST_REPLY'
  ) {
    const hasSpecialistReply = inquiryMessages.value.some((message) => !isMyInquiryMessage(message.sender_id))
    const lastMessage = inquiryMessages.value[inquiryMessages.value.length - 1] || null

    if (hasSpecialistReply && lastMessage && isMyInquiryMessage(lastMessage.sender_id)) {
      return {
        title: 'Уточнення надіслано',
        body: 'Ваше уточнення надіслано. Очікуйте відповіді спеціаліста.',
        tone: 'info' as const,
      }
    }
  }

  return mapInquiryStateToUi({
    status: state.inquiry_status,
    reasonCode,
    actor: 'client',
    mode: state.inquiry_exists ? 'thread' : 'entry',
  })
})

const showInquiryComposer = computed(() => {
  if (!inquiryState.value) return false
  if (inquiryState.value.can_create_inquiry) return true
  return Boolean(inquiryState.value.inquiry_exists && inquiryState.value.can_client_send)
})

const inquirySubmitLabel = computed(() => {
  if (inquiryState.value?.can_create_inquiry) return 'Надіслати запит'
  return 'Надіслати уточнення'
})

const standardSessionDurationMinutes = computed(() => {
  const durations = slots.value
    .map((slot) => {
      const start = new Date(slot.start_at).getTime()
      const end = new Date(slot.end_at).getTime()
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0
      return Math.round((end - start) / 60000)
    })
    .filter((minutes) => minutes > 0 && minutes <= 300)

  if (!durations.length) return 50

  const freq = new Map<number, number>()
  for (const minutes of durations) {
    freq.set(minutes, (freq.get(minutes) || 0) + 1)
  }
  let winner = durations[0] ?? 50
  let maxCount = 0
  for (const [minutes, count] of freq.entries()) {
    if (count > maxCount || (count === maxCount && minutes < winner)) {
      winner = minutes
      maxCount = count
    }
  }
  return winner
})

const standardSessionDurationLabel = computed(() => `${standardSessionDurationMinutes.value} хв`)

function formatPublicName(value?: string) {
  if (!value) return ''
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0]
  const first = parts[0]
  const last = parts[parts.length - 1]
  if (!last) return first
  const initial = last.charAt(0).toUpperCase()
  return `${first} ${initial}.`
}

function formatDate(value: string) {
  return formatUkDateTimeCompact(value, value)
}

function formatDuration(start: string, end: string) {
  const startDt = new Date(start)
  const endDt = new Date(end)
  if (Number.isNaN(startDt.getTime()) || Number.isNaN(endDt.getTime())) return ''
  const minutes = Math.max(0, Math.round((endDt.getTime() - startDt.getTime()) / 60000))
  if (!minutes) return '\u0422\u0440\u0438\u0432\u0430\u043b\u0456\u0441\u0442\u044c: 0 \u0445\u0432'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const parts = []
  if (hours) parts.push(`${hours} \u0433\u043e\u0434`)
  if (mins) parts.push(`${mins} \u0445\u0432`)
  return `\u0422\u0440\u0438\u0432\u0430\u043b\u0456\u0441\u0442\u044c: ${parts.join(' ')}`
}

function slotMatchesLocalDate(slot: PublicSlot, date: string) {
  return toLocalDate(new Date(slot.start_at)) === date
}

function toUtcDayRangeForLocalDate(date: string) {
  const localStart = new Date(`${date}T00:00:00`)
  const localEnd = new Date(`${date}T23:59:59.999`)
  return toUtcRange(localStart, localEnd)
}

function toDateInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

const todayInputValue = toDateInputValue(new Date())

function openDatePicker() {
  const input = slotDateInput.value
  if (!input) return
  if (typeof input.showPicker === 'function') {
    input.showPicker()
  } else {
    input.focus()
  }
}

function selectDay(date: string) {
  selectedDate.value = date
  showAllSlots.value = false
}

function scrollToSlots() {
  window.location.hash = '#slots'
  document.getElementById('slots')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function scrollToInquiry() {
  window.location.hash = '#inquiry'
  focusInquirySection()
}

function focusInquirySection() {
  document.getElementById('inquiry')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function openClientChat() {
  if (!profile.value?.therapist_id) return
  router.push({
    name: 'client-chat',
    query: { therapist_id: String(profile.value.therapist_id) },
  })
}

function handleHeroPrimaryAction() {
  if (canMessageSpecialist.value) {
    openClientChat()
    return
  }
  if (showInquiryEntry.value) {
    scrollToInquiry()
    return
  }
  scrollToSlots()
}

function handleClosingPrimaryAction() {
  if (canMessageSpecialist.value) {
    openClientChat()
    return
  }
  if (showInquiryEntry.value) {
    scrollToInquiry()
    return
  }
  scrollToSlots()
}

function isMyInquiryMessage(senderId: number) {
  return senderId === auth.me?.user.id
}

async function loadProfile() {
  if (!slug.value) {
    error.value = 'Потрібен slug профілю.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    profile.value = await fetchPublicSpecialistProfile(slug.value)
    if (profile.value) {
      saveViewedSpecialist(profile.value)
    }
  } catch (err: any) {
    error.value = getApiErrorMessage(err, '\u041f\u0440\u043e\u0444\u0456\u043b\u044c \u043d\u0435 \u0437\u043d\u0430\u0439\u0434\u0435\u043d\u043e.')
  } finally {
    loading.value = false
  }
}

async function loadSlots() {
  if (!profile.value?.therapist_id) return
  slotsLoading.value = true
  slotsError.value = ''
  noSlotsAvailable.value = false
  try {
    const selectedLocalDate = selectedDate.value || toLocalDate(new Date())
    const utcDayRange = toUtcDayRangeForLocalDate(selectedLocalDate)
    const resp = await apiGet<PublicSlot[]>('/booking/slots/', {
      params: {
        therapist_id: profile.value.therapist_id,
        date_from: utcDayRange.date_from,
        date_to: utcDayRange.date_to,
      },
    })
    const list = (resp || []).filter((slot) => slotMatchesLocalDate(slot, selectedLocalDate))
    slots.value = list
    if (!list.length) {
      const anyResp = await apiGet<PublicSlot[]>('/booking/slots/', {
        params: { therapist_id: profile.value.therapist_id },
      })
      noSlotsAvailable.value = !(anyResp && anyResp.length)
    }
  } catch {
    slots.value = []
    slotsError.value = 'Не вдалося завантажити вільні вікна.'
  } finally {
    slotsLoading.value = false
  }
}

function formatExperience(value: number) {
  if (value === 0) return 'до року'
  if (value === 1) return '1 рік'
  if (value >= 2 && value <= 4) return `${value} роки`
  return `${value} років`
}

async function loadJournal() {
  if (!slug.value) return
  journalLoading.value = true
  journalError.value = ''
  try {
    const [posts, collections] = await Promise.all([
      fetchPublicAuthorJournalPosts(slug.value),
      fetchPublicJournalCollections(slug.value),
    ])
    journalPosts.value = posts
    journalCollections.value = collections
  } catch {
    journalPosts.value = []
    journalCollections.value = []
    journalError.value = 'Не вдалося завантажити авторський журнал.'
  } finally {
    journalLoading.value = false
  }
}

async function loadReviews() {
  if (!slug.value) return
  try {
    const resp = await apiGet<PublicReview[]>(`/public/specialists/${slug.value}/reviews/`, {
      params: { limit: 4 },
    })
    reviews.value = resp || []
  } catch {
    reviews.value = []
  }
}

function postCategory(post: PublicAuthorJournalPost): Exclude<JournalCategory, 'ALL'> | null {
  const v = (post as { category?: string })?.category
  if (v === 'TIP' || v === 'EXPLAIN' || v === 'FAQ' || v === 'RESEARCH' || v === 'PRACTICE') return v
  return null
}

function categoryLabel(cat?: string) {
  switch (cat) {
    case 'TIP':
      return 'Порада'
    case 'EXPLAIN':
      return 'Пояснення'
    case 'FAQ':
      return 'FAQ'
    case 'RESEARCH':
      return 'Дослідження'
    case 'PRACTICE':
      return 'Практика'
    default:
      return 'Порада'
  }
}

function categoryColor(cat?: string) {
  switch (cat) {
    case 'TIP':
      return '#2b7a6f'
    case 'EXPLAIN':
      return '#355c7d'
    case 'FAQ':
      return '#6b5b95'
    case 'RESEARCH':
      return '#9c6b2f'
    case 'PRACTICE':
      return '#2f6f9c'
    default:
      return '#2b7a6f'
  }
}

function readingTime(text: string | null | undefined): number {
  if (!text) return 1
  const words = text.trim().split(/\s+/).length
  const minutes = Math.ceil(words / 200)
  return Math.max(1, minutes)
}

function renderMarkdown(text?: string | null) {
  if (!text) return ''
  const raw = marked.parse(text, { breaks: true }) as string
  return DOMPurify.sanitize(raw)
}

const filteredJournalPosts = computed(() => {
  if (activeCategory.value === 'ALL') return journalPosts.value
  return journalPosts.value.filter((p) => postCategory(p) === activeCategory.value)
})

const featuredPost = computed(() => filteredJournalPosts.value.find((p) => p.is_featured) || null)

function navigateToPost(post: PublicAuthorJournalPost) {
  if (!slug.value || !post.slug) return
  router.push({
    name: 'public-journal-post',
    params: { slug: slug.value, postSlug: post.slug },
    query: {
      from: 'profile',
      cat: activeCategory.value,
      open: String(post.id),
    },
  })
}

const gridPosts = computed(() =>
  featuredPost.value
    ? filteredJournalPosts.value.filter((p) => p.id !== featuredPost.value?.id)
    : filteredJournalPosts.value
)
const previewCollections = computed(() => journalCollections.value.slice(0, 3))

function collectionCoverUrl(collection: PublicJournalCollectionListItem): string {
  if (collection.cover_image_url) return collection.cover_image_url
  const firstPreviewSlug = collection.preview_posts?.[0]?.slug
  if (!firstPreviewSlug) return ''
  return journalPosts.value.find((post) => post.slug === firstPreviewSlug)?.cover_image_url || ''
}

async function loadClientSessions() {
  if (!isAuthenticated.value || !isClient.value) {
    clientSessions.value = []
    pastClientSessions.value = []
    return
  }
  try {
    const resp = await apiGet<ClientSession[]>('/booking/sessions/', {
      params: { upcoming: true },
    })
    clientSessions.value = resp || []
    const pastResp = await apiGet<ClientSession[]>('/booking/sessions/', {
      params: { upcoming: false },
    })
    pastClientSessions.value = pastResp || []
  } catch {
    clientSessions.value = []
    pastClientSessions.value = []
  }
}

async function loadChatThreads() {
  if (!isAuthenticated.value || !isClient.value) {
    chatThreads.value = []
    return
  }
  try {
    chatThreads.value = await fetchChatThreads()
  } catch {
    chatThreads.value = []
  }
}

async function loadInquiryMessages() {
  if (!inquiryState.value?.inquiry_id) {
    inquiryMessages.value = []
    return
  }
  try {
    inquiryMessages.value = await fetchInquiryMessages(inquiryState.value.inquiry_id, { limit: 50 })
  } catch {
    inquiryMessages.value = []
    inquiryError.value = 'Не вдалося завантажити історію запиту.'
  }
}

async function loadInquiryState() {
  if (!isAuthenticated.value || !isClient.value || !profile.value?.therapist_id) {
    inquiryLoading.value = false
    inquiryState.value = null
    inquiryMessages.value = []
    inquiryDraft.value = ''
    inquiryError.value = ''
    inquirySubmitError.value = ''
    return
  }

  inquiryLoading.value = true
  inquiryError.value = ''
  try {
    inquiryState.value = await fetchInquiryState(profile.value.therapist_id)
    inquirySubmitError.value = ''
    if (inquiryState.value.inquiry_exists && inquiryState.value.inquiry_id) {
      await loadInquiryMessages()
    } else {
      inquiryMessages.value = []
    }
  } catch (err: any) {
    inquiryState.value = null
    inquiryMessages.value = []
    inquiryError.value = getInquiryActionErrorMessage(err, 'client', 'Не вдалося завантажити запит до бронювання.')
  } finally {
    inquiryLoading.value = false
  }
}

async function submitInquiryMessage() {
  const body = inquiryDraft.value.trim()
  if (!body || !profile.value?.therapist_id || !inquiryState.value) return

  inquirySubmitting.value = true
  inquirySubmitError.value = ''
  try {
    if (inquiryState.value.can_create_inquiry) {
      await createInquiryThread({
        specialist_id: profile.value.therapist_id,
        body,
      })
      toast.success('Запит надіслано.')
    } else if (inquiryState.value.inquiry_id && inquiryState.value.can_client_send) {
      await sendInquiryMessage(inquiryState.value.inquiry_id, body)
      toast.success('Уточнення надіслано.')
    } else {
      inquirySubmitError.value = inquiryLeadCopy.value.body
      return
    }
    inquiryDraft.value = ''
    await loadInquiryState()
  } catch (err: any) {
    inquirySubmitError.value = getInquiryActionErrorMessage(
      err,
      'client',
      'Не вдалося надіслати запит до бронювання.'
    )
  } finally {
    inquirySubmitting.value = false
  }
}

function flashSettingButton() {
  settingAttention.value = false
  if (settingAttentionTimer) {
    window.clearTimeout(settingAttentionTimer)
  }
  settingAttention.value = true
  settingButtonRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  settingAttentionTimer = window.setTimeout(() => {
    settingAttention.value = false
    settingAttentionTimer = null
  }, 900)
}

function handleBookingClick(slotId: number) {
  if (!canBook.value) {
    bookSlot(slotId)
    return
  }
  if (bookingSlotId.value === slotId) return
  if (!settingAccepted.value) {
    bookingError.value = BOOKING_UI_MESSAGES.acceptSettingBeforeBooking
    flashSettingButton()
    return
  }
  bookSlot(slotId)
}

async function bookSlot(slotId: number) {
  bookingError.value = ''
  bookingSuccess.value = ''
  if (!canBook.value) {
    bookingError.value = BOOKING_UI_MESSAGES.onlyClientsCanBook
    return
  }
  if (!settingAccepted.value) {
    bookingError.value = BOOKING_UI_MESSAGES.acceptSettingBeforeBooking
    openSettingModal()
    return
  }
  bookingSlotId.value = slotId
  const bookedSlot = slots.value.find((slot) => slot.id === slotId) || null
  try {
    const payload: BookingSessionCreatePayload = {
      slot_id: slotId,
      setting_accepted: true,
    }
    if (resolvedSessionFormat.value) {
      payload.session_format = resolvedSessionFormat.value
    }
    await apiPost('/booking/sessions/', payload)
    bookingSuccess.value = BOOKING_SUCCESS_MESSAGES.sessionBooked
    toast.success(bookingSuccess.value)
    lastBookedSlot.value = bookedSlot
    showBookingModal.value = true
    slots.value = slots.value.filter((slot) => slot.id !== slotId)
    if (profile.value) {
      const entry = pickSpecialist(profile.value)
      const items = getStoredSelectedSpecialists()
      const filtered = items.filter((item: any) => item.public_slug !== entry.public_slug)
      filtered.unshift(entry)
      persistSelectedSpecialists(filtered)
    }
  } catch (err: any) {
    bookingError.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.bookSlot)
    toast.error(bookingError.value)
  } finally {
    bookingSlotId.value = null
  }
}

function closeBookingModal() {
  showBookingModal.value = false
}

function openSettingModal() {
  showSettingModal.value = true
}

function closeSettingModal() {
  showSettingModal.value = false
}

function pickSpecialist(data: PublicSpecialistProfile) {
  return {
    therapist_id: data.therapist_id,
    public_slug: data.public_slug,
    display_name: data.display_name,
    location: data.location,
    languages: data.languages,
    price: data.price,
    price_currency: data.price_currency,
    photo_url: data.photo_url,
  }
}

function getStoredSelectedSpecialists() {
  const raw =
    localStorage.getItem('selectedSpecialists') || localStorage.getItem('selectedTherapists')
  const legacy = localStorage.getItem('selectedTherapist')
  try {
    if (raw) return JSON.parse(raw)
    if (legacy) return [JSON.parse(legacy)]
  } catch {
    return []
  }
  return []
}

function persistSelectedSpecialists(items: any[]) {
  localStorage.setItem('selectedSpecialists', JSON.stringify(items))
  localStorage.setItem('selectedTherapists', JSON.stringify(items))
  const first = items[0] ?? null
  if (first) {
    localStorage.setItem('selectedTherapist', JSON.stringify(first))
  } else {
    localStorage.removeItem('selectedTherapist')
  }
}

function getStoredViewedSpecialists() {
  const raw = localStorage.getItem('viewedSpecialists') || localStorage.getItem('viewedTherapists')
  try {
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persistViewedSpecialists(items: any[]) {
  localStorage.setItem('viewedSpecialists', JSON.stringify(items))
  localStorage.setItem('viewedTherapists', JSON.stringify(items))
}

function saveViewedSpecialist(data: PublicSpecialistProfile) {
  if (!data.public_slug) return
  const items = getStoredViewedSpecialists()
  const entry = pickSpecialist(data)
  const filtered = items.filter((item: any) => item.public_slug !== entry.public_slug)
  filtered.unshift(entry)
  persistViewedSpecialists(filtered.slice(0, 8))
}

watch(
  [hasOnlineBooking, hasOfflineBooking],
  ([hasOnline, hasOffline]) => {
    if (hasOnline && !hasOffline) {
      bookingSessionFormat.value = 'online'
      return
    }
    if (!hasOnline && hasOffline) {
      bookingSessionFormat.value = 'offline'
      return
    }
    if (hasOnline && hasOffline && !['online', 'offline'].includes(bookingSessionFormat.value)) {
      bookingSessionFormat.value = 'online'
    }
  },
  { immediate: true }
)

watch(slug, () => {
  profile.value = null
  slots.value = []
  showAllSlots.value = false
  selectedDate.value = toLocalDate(new Date())
  inquiryState.value = null
  inquiryMessages.value = []
  inquiryDraft.value = ''
  inquiryError.value = ''
  inquirySubmitError.value = ''
  loadProfile().then(async () => {
    await loadSlots()
    await loadInquiryState()
  })
  loadClientSessions()
  loadChatThreads()
  loadJournal()
  loadReviews()
})

watch(selectedDate, () => {
  slots.value = []
  showAllSlots.value = false
  loadSlots()
})

watch([isAuthenticated, isClient], () => {
  loadClientSessions()
  loadChatThreads()
  loadInquiryState()
})

watch(
  [() => route.hash, showInquiryPanel],
  async ([hash, canShowInquiry]) => {
    if (hash !== '#inquiry' || !canShowInquiry) return
    await nextTick()
    focusInquirySection()
  },
  { immediate: true }
)

watch(
  () => route.query.cat,
  (value) => {
    const key = String(value || 'ALL')
    if (['ALL', 'TIP', 'EXPLAIN', 'FAQ', 'RESEARCH', 'PRACTICE'].includes(key)) {
      activeCategory.value = key as JournalCategory
    }
  },
  { immediate: true }
)

onMounted(async () => {
  if (!selectedDate.value) {
    selectedDate.value = toLocalDate(new Date())
  }
  await loadProfile()
  await loadSlots()
  await loadClientSessions()
  await loadChatThreads()
  await loadInquiryState()
  await loadJournal()
  await loadReviews()
})
</script>

<style scoped>
.public {
  display: grid;
  gap: 18px;
}

.public__hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 350px;
  align-items: start;
  gap: 18px;
  background: linear-gradient(
    140deg,
    color-mix(in srgb, var(--color-primary-100) 65%, #ffffff),
    color-mix(in srgb, var(--color-neutral-100) 52%, #ffffff)
  );
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 20px 22px;
  box-shadow: var(--shadow);
}

.hero-profile {
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
  gap: 18px;
  min-width: 0;
}

.hero-media {
  width: 100%;
  max-width: 280px;
  display: grid;
  gap: 10px;
  align-content: start;
}

.hero-photo {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: #fff;
}

.hero-photo-placeholder {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 16px;
  border: 1px dashed var(--line);
  display: grid;
  place-items: center;
  font-size: 12px;
  color: var(--muted);
  background: rgba(255, 255, 255, 0.65);
}

.hero-video {
  width: 100%;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: #0f2b3a;
}

.public__title {
  font-size: clamp(30px, 4vw, 40px);
  line-height: 1.15;
}

.hero-main {
  display: grid;
  gap: 12px;
  align-content: start;
  min-width: 0;
}

.hero-main__role {
  margin: -2px 0 0;
  font-size: 14px;
  color: color-mix(in srgb, var(--text) 72%, var(--muted));
  font-weight: 600;
}

.hero-main__lead {
  margin: 0;
  font-size: 16px;
  line-height: 1.66;
  color: var(--deep);
  max-width: 66ch;
}

.hero-main__support {
  margin: -4px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--muted);
}

.hero-main__sessions {
  margin: -2px 0 0;
  font-size: 14px;
  line-height: 1.5;
  font-weight: 600;
  color: color-mix(in srgb, var(--text) 86%, var(--muted));
}

.hero-main__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.hero-meta-card {
  border: 1px solid color-mix(in srgb, var(--line) 86%, #ffffff);
  border-radius: var(--radius-sm);
  padding: 9px 10px;
  background: color-mix(in srgb, #ffffff 80%, var(--surface));
  display: grid;
  gap: 2px;
}

.hero-meta-card__label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--muted);
}

.hero-meta-card__value {
  font-weight: 600;
  color: var(--ink);
}

.hero-trust {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hero-trust span {
  padding: 6px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid var(--line);
  font-size: 12px;
}

.hero-cta {
  width: 100%;
  min-width: 0;
  max-width: 350px;
  display: grid;
  gap: 12px;
  border: 1px solid color-mix(in srgb, var(--line) 64%, #fff);
  background: rgba(255, 255, 255, 0.9);
  border-radius: var(--radius-md);
  padding: 14px 14px 15px;
}

.hero-cta__head {
  display: grid;
  gap: 6px;
}

.hero-cta__title {
  margin: 0;
  font-size: 22px;
  line-height: 1.25;
}

.hero-cta__hint {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--muted);
}

.hero-cta__prices {
  display: grid;
  gap: 8px;
}

.hero-cta__price {
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: #fff;
  font-size: 13px;
  font-weight: 600;
}

.hero-cta__price--intro {
  border-color: color-mix(in srgb, var(--color-primary-500) 20%, var(--line));
}

.hero-cta__actions {
  display: grid;
  gap: 8px;
}

.hero-cta__actions .btn {
  width: 100%;
}

.public__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}

.panel--slots {
  grid-column: 1 / -1;
}

.panel--profile {
  grid-column: 1;
}

.panel--journal {
  grid-column: 1 / -1;
}

.panel--inquiry,
.panel--trust,
.panel--documents,
.panel--work-format,
.panel--about,
.panel--who,
.panel--contacts,
.panel--reviews,
.panel--footer-cta {
  grid-column: 1 / -1;
}

.panel {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 18px 18px 20px;
  background: color-mix(in srgb, #ffffff 90%, var(--surface));
  display: grid;
  gap: 14px;
}

.panel--footer-cta {
  padding: 12px;
  gap: 8px;
}

.panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 6px;
}

.panel__header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.panel__header > div {
  display: grid;
  gap: 6px;
}

.panel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
}

.panel__lead {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.55;
  max-width: 78ch;
}

.slot-filter {
  display: grid;
  gap: 5px;
  padding: 10px;
  border-radius: 12px;
  border: 1px dashed color-mix(in srgb, var(--line) 84%, #d5ccb8);
  background: color-mix(in srgb, #f8f4ec 78%, #ffffff);
}

.slot-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 320px);
  gap: 10px;
  align-items: start;
}

.slot-week {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
}

.slot-day {
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 10px;
  padding: 5px 8px;
  display: grid;
  gap: 2px;
  min-width: 58px;
  text-align: center;
  cursor: pointer;
  color: var(--ink);
  font-weight: 400;
}

.slot-day__label {
  text-transform: uppercase;
  font-size: 9px;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.slot-day__date {
  font-size: 11px;
}

.slot-day--active {
  border-color: color-mix(in srgb, var(--primary) 40%, var(--border));
  background: color-mix(in srgb, var(--primary) 12%, transparent);
}

.slot-filter__label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
  font-weight: 600;
}

.slot-filter__input {
  max-width: 220px;
}

.slot-filter__hint {
  font-size: 11px;
}

.slot-format {
  display: grid;
  gap: 6px;
  margin-top: 2px;
}

.slot-format__options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.slot-format__option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 9px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--ink);
  font-size: 13px;
}

.slot-format__option input {
  margin: 0;
}

.slot-format__fixed {
  font-size: 13px;
  color: var(--ink);
}

.slot-format__hint {
  font-size: 12px;
}

.slot-info {
  border: 1px solid color-mix(in srgb, var(--line) 84%, #d5ccb8);
  border-radius: 12px;
  padding: 10px 12px;
  background: color-mix(in srgb, #f4efe3 46%, #ffffff);
  display: grid;
  gap: 8px;
}

.slot-info__title {
  font-size: 13px;
  font-weight: 700;
  color: var(--deep);
}

.slot-info__list {
  margin: 0;
  padding-left: 16px;
  display: grid;
  gap: 4px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.4;
}

.slot-info__action {
  justify-self: start;
}

.first-session-flow {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.inquiry-state {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--line);
  font-size: 14px;
}

.inquiry-state--info {
  background: color-mix(in srgb, #2f6b4f 12%, #ffffff);
}

.inquiry-state--warning {
  background: rgba(194, 75, 75, 0.08);
}

.inquiry-state--neutral {
  background: color-mix(in srgb, #e9e3d7 45%, #ffffff);
}

.inquiry-thread {
  display: grid;
  gap: 10px;
}

.inquiry-message {
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: #fff;
}

.inquiry-message--mine {
  background: color-mix(in srgb, #dbeadf 50%, #ffffff);
}

.inquiry-message__author {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}

.inquiry-message__body {
  white-space: pre-line;
  line-height: 1.5;
}

.inquiry-message__time {
  font-size: 12px;
}

.inquiry-composer {
  display: grid;
  gap: 10px;
}

.inquiry-composer__textarea {
  min-height: 120px;
  resize: vertical;
}

.inquiry-composer__hint {
  font-size: 12px;
}

.flow-card {
  border: 1px solid var(--line);
  border-radius: 12px;
  background: linear-gradient(180deg, color-mix(in srgb, #f5f0e4 55%, #ffffff), #fff);
  padding: 12px;
  display: grid;
  gap: 8px;
}

.flow-card__title {
  font-weight: 600;
  color: var(--deep);
}

.flow-card__list {
  margin: 0;
  padding-left: 16px;
  display: grid;
  gap: 6px;
  color: var(--muted);
  font-size: 13px;
}

.badge--soft {
  background: color-mix(in srgb, #e4e9dc 62%, #f8f3e9);
  border-color: color-mix(in srgb, #6f8b73 26%, var(--line));
  color: color-mix(in srgb, #3f5945 82%, var(--text));
}

.profile-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.work-format-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.profile-summary__item {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 12px;
  background: color-mix(in srgb, #f8f3e8 58%, #ffffff);
  font-size: 13px;
}

.profile-contact {
  display: grid;
  gap: 8px;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px;
  background: #fff;
}

.profile-contact__list {
  display: grid;
  gap: 6px;
  font-size: 13px;
}

.about-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.who-lead {
  margin-top: -4px;
}

.who-text {
  white-space: pre-line;
  font-size: 16px;
  line-height: 1.5;
  color: var(--deep);
}

.trust-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.trust-card {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--color-primary-100) 22%, #ffffff);
  display: grid;
  gap: 4px;
}

.trust-card__label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.trust-card__value {
  font-weight: 600;
}

.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.document-card {
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 12px;
  background: #fff;
  display: grid;
  gap: 10px;
}

.document-card--file {
  gap: 8px;
  background: color-mix(in srgb, #f8f3e8 38%, #ffffff);
}

.document-card__preview {
  width: 100%;
  height: clamp(160px, 24vw, 240px);
  border-radius: 12px;
  border: 1px solid var(--line);
  overflow: hidden;
  background: color-mix(in srgb, #f4efe2 58%, #ffffff);
  padding: 8px;
}

.document-card__preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  border-radius: 8px;
}

.document-card__file-top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.document-card__file-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6a573f;
  border: 1px solid #dccdb4;
  background: color-mix(in srgb, #efe1c9 76%, #ffffff);
}

.document-card__body {
  display: grid;
  gap: 4px;
}

.document-card__kind {
  width: fit-content;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #5f5345;
  border: 1px solid #e6dccb;
  background: #f5efe3;
}

.document-card__title {
  margin: 0;
  font-size: 17px;
  line-height: 1.35;
}

.document-card__meta {
  font-size: 12px;
  color: var(--muted);
}

.document-card__kind--file {
  margin: 0;
}

.document-card__action {
  justify-self: start;
}

.contact-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.contact-action {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 12px;
  display: grid;
  gap: 4px;
  text-decoration: none;
  color: inherit;
  background: #fff;
}

.contact-action:hover {
  border-color: color-mix(in srgb, var(--primary) 32%, var(--line));
  background: color-mix(in srgb, #eef2e8 56%, #ffffff);
}

.contact-action__label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.contact-action__value {
  font-weight: 600;
}

.reviews-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.review-card {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px;
  background: #fff;
  display: grid;
  gap: 10px;
}

.review-card__text {
  line-height: 1.5;
}

.review-card__meta {
  color: var(--muted);
  font-size: 12px;
}

.closing-cta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  border: 1px solid color-mix(in srgb, var(--primary) 24%, var(--line));
  border-radius: var(--radius-md);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, #f7f2e7 76%, #ffffff),
    color-mix(in srgb, #f2eee2 64%, #ffffff)
  );
  padding: 14px 16px;
}

.closing-cta__copy {
  display: grid;
  gap: 4px;
}

.closing-cta__title {
  margin: 0;
  font-size: 24px;
  line-height: 1.22;
  font-family: var(--font-display);
}

.closing-cta__subtitle {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.5;
}

.closing-cta__actions {
  display: grid;
  gap: 8px;
  min-width: 280px;
}

.profile-bio {
  display: grid;
  gap: 12px;
}

.bio-section {
  display: grid;
  gap: 8px;
  border: 1px solid color-mix(in srgb, var(--line) 84%, #ffffff);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  background: color-mix(in srgb, #ffffff 78%, var(--surface));
}

.bio-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--deep);
  font-weight: 600;
}

.bio-copy {
  color: color-mix(in srgb, var(--text) 88%, var(--muted));
  line-height: 1.72;
  white-space: pre-line;
}

.slot-list {
  display: grid;
  gap: 8px;
}

.slot-list-heading {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: var(--muted);
  margin-top: 2px;
}

.slot-list__toggle {
  justify-self: start;
}

.slot-card {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 8px 10px;
  background: color-mix(in srgb, #f5f0e4 38%, #ffffff);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.slot-time {
  font-weight: 600;
}

.first-session-flow {
  margin-top: 8px;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: 10px;
  padding: 8px 10px;
}

.success {
  color: #0f5132;
  background: #d1e7dd;
  border: 1px solid #badbcc;
  border-radius: 10px;
  padding: 8px 10px;
}

.hint {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  border: 1px dashed color-mix(in srgb, var(--line) 82%, #d0c6b2);
  color: var(--muted);
  background: color-mix(in srgb, #f4efe3 44%, #ffffff);
}

.panel--journal {
  display: grid;
  gap: 12px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, #f8f2e6 58%, #ffffff),
    color-mix(in srgb, #f4eee1 35%, #ffffff)
  );
}

.profile-collections {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 12px;
  background: #fff;
  display: grid;
  gap: 10px;
}

.profile-collections__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.profile-collections__title {
  font-size: 16px;
  font-weight: 700;
}

.profile-collections__list {
  display: grid;
  gap: 8px;
}

.profile-collection-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 8px 10px;
  color: inherit;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.85);
}

.profile-collection-item__left {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.profile-collection-item__cover {
  width: 42px;
  height: 30px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--line);
  background: var(--color-neutral-50, #f7f8f9);
  flex-shrink: 0;
}

.profile-collection-item__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.profile-collection-item:hover {
  border-color: rgba(43, 122, 111, 0.35);
  background: rgba(43, 122, 111, 0.06);
}

.profile-collection-item__name {
  font-size: 14px;
  font-weight: 600;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-collection-item__meta {
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
}

.journal-list {
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr;
}

.journal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  align-items: start;
  grid-auto-rows: 1fr;
}

.journal-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 2px 0 12px;
}

.filter-chip {
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.75);
  border-radius: 10px;
  padding: 7px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.filter-chip:hover {
  border-color: color-mix(in srgb, var(--primary) 34%, var(--line));
  box-shadow: 0 8px 18px rgba(16, 33, 50, 0.08);
}

.filter-chip.is-active {
  background: rgba(43, 122, 111, 0.12);
  border-color: rgba(43, 122, 111, 0.35);
}

.empty {
  display: grid;
  gap: 10px;
  padding: 16px 18px;
  border-radius: 12px;
  border: 1px dashed var(--line);
  background: #fff;
}

.empty-title {
  font-weight: 600;
}

.post-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(8px);
  color: var(--cat, #2b7a6f);
}

.post-tag::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.9;
}

.pin-badge {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(43, 122, 111, 0.12);
  border: 1px solid rgba(43, 122, 111, 0.25);
  color: #2b7a6f;
  width: fit-content;
  margin-top: 8px;
}

.journal-card--pinned {
  border-color: rgba(43, 122, 111, 0.35);
  box-shadow: 0 8px 20px rgba(43, 122, 111, 0.08);
}

.journal-card {
  display: grid;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 20px;
  background: #fff;
  overflow: hidden;
  gap: 18px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  height: auto;
  align-items: start;
  animation: journalFade 0.35s ease;
}

.journal-card:hover {
  border-color: color-mix(in srgb, var(--primary) 40%, var(--line));
  box-shadow: 0 8px 22px rgba(16, 33, 50, 0.1);
}

.journal-card--feature {
  grid-template-columns: 1fr minmax(240px, 320px);
  padding: 24px;
  grid-column: 1 / -1;
}

  .journal-card--feature .journal-cover img {
    max-height: none;
  }

.journal-card--feature .journal-title {
  font-size: 28px;
  line-height: 1.25;
}

.journal-card--feature .journal-summary {
  font-size: 16px;
  -webkit-line-clamp: 3;
}

  .journal-cover {
    background: var(--color-neutral-50, #f7f8f9);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 12px;
    border-radius: 12px;
    position: relative;
    aspect-ratio: 3 / 2;
    overflow: hidden;
  }

  .journal-cover img {
    width: 100%;
    height: auto;
    display: block;
    height: 100%;
    object-fit: cover;
    object-position: 50% 35%;
    transition: transform 0.4s ease;
  }

.journal-card:hover .journal-cover img {
  transform: scale(1.03);
}

  .journal-body {
    display: grid;
    gap: 10px;
    padding: 0;
  }

.journal-title {
  font-weight: 600;
  font-size: 22px;
  line-height: 1.33;
}

  .journal-meta {
    font-size: 14px;
    color: #8a8a8a;
  }

.journal-summary {
  font-size: 15px;
  line-height: 1.6;
  color: #555;
  max-width: 560px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

  .journal-full {
    margin-top: 10px;
    white-space: pre-wrap;
    color: var(--color-neutral-800);
  }

.read-more {
  margin-top: 6px;
  align-self: flex-start;
  font-size: 14px;
  font-weight: 600;
  color: #2b7a6f;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
}

.read-more:hover {
  text-decoration: underline;
}

  .journal-card--closed {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    align-items: start;
  }

  .journal-card--closed .journal-cover {
    grid-column: 2;
    grid-row: 1;
  }

  .journal-card--closed .journal-body {
    grid-column: 1;
    grid-row: 1;
  }

  .journal-card--closed .journal-cover img {
    max-height: none;
  }

  .journal-card--open {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    align-items: start;
  }

  .journal-grid .journal-card {
    grid-template-columns: 1fr 180px;
    padding: 18px 18px 18px 16px;
    height: 100%;
    align-content: start;
  }

  .journal-grid .journal-cover {
    height: 100%;
    align-items: center;
    aspect-ratio: auto;
  }

  .journal-grid .journal-cover img {
    height: 100%;
    object-fit: contain;
  }

  .journal-grid .journal-cover img {
    max-height: 140px;
  }

  .journal-grid .journal-title {
    font-size: 20px;
    line-height: 1.3;
  }

  .journal-grid .journal-summary {
    -webkit-line-clamp: 2;
  }

  .journal-card--open .journal-cover {
    grid-column: 2;
    grid-row: 1;
  }

  .journal-card--open .journal-body {
    grid-column: 1;
    grid-row: 1;
    padding-right: 6px;
  }

  .journal-card--open .journal-cover {
    aspect-ratio: auto;
    align-items: flex-start;
  }

  .journal-card--open .journal-cover img {
    height: auto;
    max-height: 600px;
    object-fit: contain;
  }

  .journal-card--open .journal-body {
    padding-right: 18px;
  }

  .journal-card--open .journal-readmore {
    margin-top: 16px;
  }

  @media (max-width: 900px) {
    .journal-grid {
      grid-template-columns: 1fr;
    }

    .journal-grid .journal-card {
      grid-template-columns: 1fr;
    }

    .journal-grid .journal-cover img {
      max-height: 200px;
    }

    .journal-card--open,
    .journal-card--closed,
    .journal-card--feature {
      grid-template-columns: 1fr;
      padding: 18px;
    }

    .journal-card--open .journal-cover,
    .journal-card--closed .journal-cover {
      padding: 10px 12px;
    }

    .journal-card--feature .journal-cover img {
      max-height: 220px;
    }
  }

  @keyframes journalFade {
    from {
      opacity: 0;
      transform: translateY(10px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .rating-pill {
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    background: rgba(31, 122, 76, 0.16);
    color: #1f7a4c;
  }

  .confirmed-block {
    margin-top: 14px;
    border: 1px dashed color-mix(in srgb, var(--line) 82%, #d4cab8);
    border-radius: 12px;
    padding: 12px;
    background: color-mix(in srgb, #f3ede0 42%, #ffffff);
    display: grid;
    gap: 8px;
  }

  .confirmed-title {
    font-weight: 600;
    font-size: 13px;
  }

  .confirmed-list {
    display: grid;
    gap: 8px;
  }

  .confirmed-item {
    display: grid;
    gap: 2px;
    padding: 8px 10px;
    border-radius: 10px;
    background: #fff;
    border: 1px solid var(--line);
  }

  .confirmed-time {
    font-weight: 600;
  }

  .booking-gate {
    display: grid;
    gap: 12px;
    padding: 14px 16px;
    margin-bottom: 16px;
    border-radius: 12px;
    border: 1px solid color-mix(in srgb, var(--primary) 18%, var(--line));
    background: color-mix(in srgb, var(--primary) 6%, #ffffff);
  }

  .booking-gate--pending {
    border-color: color-mix(in srgb, #d9a441 40%, var(--line));
    background: color-mix(in srgb, #f4e2ae 18%, #ffffff);
  }

  .booking-gate--ready {
    border-color: color-mix(in srgb, #1f7a4c 30%, var(--line));
    background: color-mix(in srgb, #1f7a4c 8%, #ffffff);
  }

.booking-gate--attention {
  box-shadow: 0 0 0 3px rgba(85, 132, 102, 0.16);
}

  .booking-gate__content {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .booking-gate__title {
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 4px;
  }

  .booking-gate__text {
    margin: 0;
    max-width: 720px;
    color: var(--muted);
    line-height: 1.45;
  }

  .booking-gate__button {
    flex-shrink: 0;
  }

  .setting-check {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--muted);
  }

  .booking-gate__check {
    font-size: 14px;
    color: var(--text);
  }

  .setting-check input {
    width: 16px;
    height: 16px;
  }

  .booking-gate__hint {
    font-size: 13px;
    color: var(--muted);
  }

  .setting-check--modal {
    margin-top: 16px;
  }

  .btn--disabled {
    opacity: 0.55;
    cursor: not-allowed;
    pointer-events: auto;
  }

  .btn--disabled:hover {
    transform: none;
  }

.btn--pulse {
  animation: pulse-attention 0.9s ease-in-out;
  box-shadow: 0 0 0 0 rgba(85, 132, 102, 0.28);
}

  @keyframes pulse-attention {
    0% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(85, 132, 102, 0.28);
    }
    50% {
      transform: scale(1.02);
      box-shadow: 0 0 0 10px rgba(85, 132, 102, 0);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(85, 132, 102, 0);
    }
  }

  .setting-modal {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: grid;
    place-items: center;
  }

  @media (max-width: 640px) {
    .booking-gate {
      padding: 12px;
    }

    .booking-gate__content {
      align-items: stretch;
    }

    .booking-gate__button {
      width: 100%;
    }
  }

  .setting-modal__backdrop {
    position: absolute;
    inset: 0;
    background: rgba(7, 24, 33, 0.45);
  }

  .setting-modal__content {
    position: relative;
    z-index: 1;
    width: min(640px, 92vw);
    background: #fff;
    border-radius: 16px;
    border: 1px solid var(--line);
    padding: 20px;
    display: grid;
    gap: 16px;
    box-shadow: 0 18px 40px rgba(15, 35, 48, 0.2);
  }

  .setting-modal__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .setting-modal__body {
    display: grid;
    gap: 12px;
  }

  .booking-checklist {
    display: grid;
    gap: 6px;
    padding: 10px 12px;
    border-radius: 12px;
    background: color-mix(in srgb, #dfeadd 48%, #ffffff);
    border: 1px solid var(--line);
  }

  .booking-checklist__item {
    font-weight: 500;
  }

  .booking-confirm {
    color: var(--ink);
    font-weight: 500;
    padding: 10px 12px;
    border-radius: 12px;
    background: color-mix(in srgb, #e5efdf 52%, #ffffff);
    border: 1px solid var(--line);
  }

  .booking-slot {
    display: grid;
    gap: 4px;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid var(--line);
    background: #fff;
  }

  .booking-slot__time {
    font-weight: 600;
  }

  .booking-next {
    display: grid;
    gap: 6px;
    padding: 10px 12px;
    border-radius: 12px;
    background: color-mix(in srgb, #f3ede1 42%, #ffffff);
    border: 1px dashed color-mix(in srgb, var(--line) 82%, #d1c7b4);
  }

  .booking-next__title {
    font-weight: 600;
    color: var(--deep);
  }

  .booking-next__item {
    color: var(--muted);
    font-size: 13px;
  }

  .setting-section {
    display: grid;
    gap: 6px;
  }

  .setting-title {
    font-weight: 600;
  }

  .setting-label {
    display: grid;
    gap: 6px;
    font-size: 13px;
    color: var(--muted);
  }

@media (max-width: 960px) {
  .public__hero {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .hero-profile {
    grid-template-columns: 1fr;
  }

  .hero-media {
    width: 100%;
    max-width: 320px;
  }

  .hero-main {
    width: 100%;
  }

  .hero-main__meta {
    grid-template-columns: 1fr;
  }

  .hero-cta {
    width: 100%;
    max-width: 100%;
  }

  .public__grid {
    grid-template-columns: 1fr;
  }

  .profile-summary {
    grid-template-columns: 1fr;
  }

  .work-format-grid {
    grid-template-columns: 1fr;
  }

  .slot-top {
    grid-template-columns: 1fr;
  }

  .about-grid,
  .trust-grid,
  .documents-grid,
  .contact-actions,
  .reviews-list {
    grid-template-columns: 1fr;
  }

  .closing-cta {
    grid-template-columns: 1fr;
  }

  .closing-cta__actions {
    min-width: 0;
  }

  .first-session-flow {
    grid-template-columns: 1fr;
  }
}
</style>
