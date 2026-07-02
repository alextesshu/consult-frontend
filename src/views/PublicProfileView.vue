<template>
  <section class="public">
    <div v-if="loading" class="muted">Завантаження...</div>
    <section v-else-if="ownerUnpublishedProfile" class="panel panel--owner-unpublished">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Публічний профіль</div>
          <h2 class="panel__title">Профіль ще не опубліковано</h2>
          <p class="panel__lead">
            Публічний профіль ще не опубліковано. Заповніть профіль і увімкніть його для перегляду.
          </p>
        </div>
      </div>
      <div class="hero-cta__actions">
        <RouterLink class="btn btn--primary" to="/cabinet/profile">Перейти до налаштувань профілю</RouterLink>
        <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
      </div>
    </section>
    <div v-else-if="error" class="form-error">{{ error }}</div>

    <section v-else-if="profile" class="public__layout">
      <section class="public__hero-col">
        <PublicProfileHeroSection
          :profile="heroMediaProfile"
          :public-name="publicName"
          hero-role-line=""
          :hero-lead-text="heroLeadText"
          :hero-support-text="heroSupportText"
          :completed-sessions-badge="completedSessionsBadge"
          :display-specialization-chips="displaySpecializationChips"
          :general-info-items="trustItems"
          :show-about-details="Boolean(aboutNarrativeText)"
          @video-action="openProfileVideoModal"
          @about-action="openAboutModal"
        />
      </section>

      <aside class="public__sidebar">
        <PublicProfileIdentityRail
          :profile="profile"
          :hero-cta-title="heroCtaTitle"
          :hero-primary-label="heroPrimaryLabel"
          :show-client-sessions-cta="showClientSessionsCta"
          :feedback-link="feedbackLink"
          :primary-action-next-step-copy="primaryActionNextStepCopy"
          :intro-price-display="introPriceDisplay"
          :intro-duration-label="introDurationLabel"
          :price-display="priceDisplay"
          :standard-session-duration-label="standardSessionDurationLabel"
          :couple-price-display="couplePriceDisplay"
          :couple-duration-label="coupleDurationLabel"
          :selected-offer-type="selectedPublicOfferType || defaultGuestBookingOfferType"
          :show-contact-actions="showDirectContactActions"
          :contact-actions="contactActions"
          :copied-contact-id="copiedContactId"
          :show-chat-cta="canMessageSpecialist"
          chat-cta-label="Написати в чат"
          :show-request-cta="showRailRequestCta"
          :request-cta-label="railRequestCtaLabel"
          :show-request-explanation="showRequestExplanation"
          :request-helper-text="railRequestHelperText"
          :request-tooltip-text="REQUEST_CTA_TOOLTIP_TEXT"
          :show-slots-cta="showRailSlotsCta"
          :show-inquiry-cta="showRailInquiryCta"
          :inquiry-cta-label="INQUIRY_BEFORE_BOOKING_CTA_LABEL"
          :show-feedback-cta="showFeedbackCta"
          @primary-action="handleHeroPrimaryAction"
          @chat-action="openClientChat"
          @request-action="handlePublicRequestAction"
          @inquiry-action="scrollToInquiry"
          @copy-contact-action="copyPublicContactValue"
          @select-offer="selectPublicOffer"
        />
      </aside>

      <section class="public__grid">
        <PublicProfileAboutSection
          :work-style-text="workStyleText"
          :work-with-text="whoThisIsForText"
          :work-with-chips="mainRequestChips"
          :who-is-not-suitable-text="whoIsNotSuitableText"
        />

        <PublicProfileTrustSection
          :education-summary="competenceEducationSummary"
          :education-items="competenceEducationItems"
          :professional-development-items="competenceProfessionalDevelopmentItems"
          :public-documents="publicDocuments"
          :is-image-document="isImageDocument"
          :is-pdf-document="isPdfDocument"
          :document-kind-label="documentKindLabel"
          :format-date="formatDate"
        />

        <section class="panel panel--profile-principles" aria-labelledby="profilePrinciplesTitle">
          <div class="panel__header">
            <div>
              <p class="panel__eyebrow">Простір практики</p>
              <h2 id="profilePrinciplesTitle" class="panel__title">Принципи профілю</h2>
              <p class="panel__lead">
                Профіль не є рейтингом або рекомендацією платформи. Спеціаліст самостійно визначає,
                яку інформацію опублікувати, які формати консультацій пропонувати, які межі роботи
                зазначити та коли приймати запити. Приватні нотатки й робочі матеріали не
                використовуються для публічного профілю або пошуку.
              </p>
            </div>
          </div>
        </section>

      <section v-if="showInquiryPanel" class="panel panel--inquiry" id="inquiry">
        <div class="panel__header">
          <div>
            <p class="panel__eyebrow">До запиту</p>
            <h2 class="panel__title">{{ inquiryLeadCopy.title }}</h2>
          </div>
        </div>

        <div class="inquiry-state" :class="`inquiry-state--${inquiryLeadCopy.tone}`">
          {{ inquiryLeadCopy.body }}
        </div>
        <article v-if="inquiryClarityCard" class="inquiry-clarity">
          <div class="inquiry-clarity__title">{{ inquiryClarityCard.title }}</div>
          <p class="inquiry-clarity__body">{{ inquiryClarityCard.body }}</p>
        </article>

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
              placeholder="Коротко опишіть, що хочете уточнити перед запитом."
              :disabled="inquirySubmitting"
            ></textarea>
            <div class="muted inquiry-composer__hint">
              Коротке питання без вкладень і термінових звернень. Це не повноцінний чат.
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

      <div v-if="publicDirectBookingEnabled" class="panel panel--slots" id="slots">
        <div class="panel__header">
          <div>
            <p class="panel__eyebrow">Доступні вільні вікна</p>
            <h2 class="panel__title">Оберіть час для запиту</h2>
            <p class="panel__lead">Оберіть доступне вікно у профілі. Спеціаліст має підтвердити цей час.</p>
          </div>
          <div v-if="showSlotHeaderActions" class="slot-request-actions">
            <button v-if="showDirectBookingRequestFallback" class="btn btn--ghost btn--sm" type="button" @click="handlePublicRequestAction">
              {{ REQUEST_GENERIC_CTA_LABEL }}
            </button>
            <button v-if="canMessageSpecialist" class="btn btn--ghost btn--sm" type="button" @click="openClientChat">
              Написати в чат
            </button>
          </div>
        </div>

        <div class="slot-top">
          <div class="slot-filter">
            <div class="slot-filter__calendar">
              <div class="booking-calendar__header">
                <button
                  class="booking-calendar__nav"
                  type="button"
                  aria-label="Попередній місяць"
                  @click="changeVisibleMonth(-1)"
                >
                  ‹
                </button>
                <div class="booking-calendar__month" aria-live="polite">{{ visibleMonthLabel }}</div>
                <button
                  class="booking-calendar__nav"
                  type="button"
                  aria-label="Наступний місяць"
                  @click="changeVisibleMonth(1)"
                >
                  ›
                </button>
              </div>
              <div class="booking-calendar__grid" role="grid" :aria-label="visibleMonthLabel">
                <div
                  v-for="dayName in calendarWeekdayHeaders"
                  :key="dayName"
                  class="booking-calendar__weekday"
                  role="columnheader"
                >
                  {{ dayName }}
                </div>
                <div
                  v-for="index in calendarLeadingBlanks"
                  :key="`blank-${index}`"
                  class="booking-calendar__blank"
                  aria-hidden="true"
                ></div>
                <button
                  v-for="day in calendarDays"
                  :key="day.date"
                  class="booking-calendar__day"
                  :class="{
                    'booking-calendar__day--available': day.isAvailable,
                    'booking-calendar__day--selected': day.isSelected,
                    'booking-calendar__day--today': day.isToday,
                  }"
                  type="button"
                  role="gridcell"
                  :aria-label="day.ariaLabel"
                  :aria-selected="day.isSelected"
                  :disabled="!day.isAvailable"
                  @click="selectCalendarDay(day.date)"
                >
                  <span class="booking-calendar__day-number">{{ day.dayNumber }}</span>
                  <span v-if="day.isAvailable" class="booking-calendar__dot" aria-hidden="true"></span>
                </button>
              </div>
            </div>
            <div class="slot-format slot-filter__format">
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

          <aside class="slot-info" aria-label="Умови запиту на час">
            <div class="slot-info__title">Перед запитом на час</div>
            <div class="slot-info__subtitle">Умови спеціаліста</div>
            <p class="slot-info__summary">{{ specialistTermsReminderSummary }}</p>
            <ul class="slot-info__list">
              <li>Правила потрібно підтвердити один раз для цього спеціаліста.</li>
              <li>Якщо умови оновляться, система попросить підтвердити їх повторно.</li>
              <li>Оплата не списується автоматично.</li>
              <li>Запит ще не є підтвердженою сесією. Нагадування надходять після підтвердження.</li>
            </ul>
          </aside>
        </div>

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

        <div class="slot-list-heading">Вільні вікна на {{ selectedDateDisplayLabel }}</div>

        <div v-if="slotsLoading" class="muted">Завантажуємо вільні вікна</div>
        <div v-else-if="slotsError" class="form-error">{{ slotsError }}</div>
        <div v-else-if="!monthHasSlots" class="slot-empty slot-empty--request muted">
          <span>У цьому місяці немає доступних вікон.</span>
          <button class="btn btn--ghost btn--sm" type="button" @click="handlePublicRequestAction">
            {{ REQUEST_GENERIC_CTA_LABEL }}
          </button>
        </div>
        <div v-else-if="slots.length === 0" class="slot-empty slot-empty--request muted">
          <span>На обрану дату немає вільного часу. Залиште запит, і спеціаліст допоможе узгодити формат та час.</span>
          <button class="btn btn--ghost btn--sm" type="button" @click="handlePublicRequestAction">
            {{ REQUEST_GENERIC_CTA_LABEL }}
          </button>
        </div>
        <div v-else class="slot-list">
          <button
            v-for="slot in visibleSlots"
            :key="slot.id"
            class="slot-card"
            :class="{ 'slot-card--busy': isSlotBusy(slot.id) }"
            type="button"
            :aria-label="slotActionLabel(slot.id)"
            :disabled="isSlotBusy(slot.id)"
            @click="handleBookingClick(slot.id)"
          >
            <div class="slot-time">{{ formatSlotTime(slot.start_at) }}</div>
          </button>
          <button
            v-if="hasMoreSlots"
            class="btn btn--ghost slot-list__toggle"
            type="button"
            @click="showAllSlots = !showAllSlots"
          >
            {{ showAllSlots ? 'Показати менше' : `Показати весь розклад (${slots.length})` }}
          </button>
        </div>

        <section
          v-if="shouldShowClientBookingRulesPrompt"
          ref="bookingRulesPromptRef"
          class="booking-gate booking-gate--pending"
          aria-label="Правила перед запитом на час"
        >
          <div class="booking-gate__title">Підтвердіть правила перед запитом на час</div>
          <p class="booking-gate__text">{{ clientBookingRulesPromptText }}</p>

          <article v-if="pendingPlatformBookingRules.length" class="booking-rules-block">
            <div class="booking-rules-block__title">Загальні правила платформи</div>
            <p
              v-for="rule in pendingPlatformBookingRules"
              :key="`platform-${rule.version}`"
              class="booking-rules-block__item"
            >
              {{ rule.text }}
            </p>
          </article>

          <article v-if="pendingSpecialistBookingRules.length" class="booking-rules-block">
            <div class="booking-rules-block__title">Умови спеціаліста</div>
            <p
              v-for="rule in pendingSpecialistBookingRules"
              :key="`specialist-${rule.version}-${rule.specialist_id || 'none'}`"
              class="booking-rules-block__item"
            >
              {{ rule.text }}
            </p>
          </article>

          <div class="booking-gate__actions">
            <button
              class="btn btn--ghost btn--sm booking-gate__button"
              type="button"
              :disabled="bookingRulesAccepting"
              @click="confirmClientBookingRules"
            >
              {{ bookingRulesConfirmLabel }}
            </button>
          </div>
        </section>

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
            <div class="flow-card__title">Що буде після запиту</div>
            <ul class="flow-card__list">
              <li>Запит з'явиться у вашому кабінеті клієнта.</li>
              <li>Після підтвердження спеціаліста ви отримаєте нагадування.</li>
              <li>За потреби зможете перенести або скасувати запит у кабінеті.</li>
            </ul>
          </article>
        </div>
      </div>

      <PublicProfileJournalPreviewSection
        :has-public-journal-posts="hasPublicJournalPosts"
        :slug="slug"
        :journal-loading="journalLoading"
        :journal-error="journalError"
        :canonical-empty-state-code="journalEmptyStateCode"
        :canonical-empty-state-title="journalCanonicalEmptyStateTitle"
        :canonical-empty-state-body="journalCanonicalEmptyStateBody"
        :preview-collections="previewCollections"
        :collection-cover-url="collectionCoverUrl"
        :filtered-journal-posts="filteredJournalPosts"
        :category-options="categoryOptions"
        :active-category="activeCategory"
        :featured-post="featuredPost"
        :grid-posts="gridPosts"
        :category-color="categoryColor"
        :category-label="categoryLabel"
        :format-date="formatDate"
        :reading-time="readingTime"
        :render-markdown="renderMarkdown"
        @set-active-category="setActiveJournalCategory"
        @navigate-to-post="navigateToPost"
      />

      <PublicProfileMediaSection
        :media-items="mediaItems"
      />

      <PublicProfileReviewsSection
        :reviews="displayReviews"
        :feedback-link="feedbackLink"
        :format-date="formatDate"
      />

      <PublicProfileFaqSection
        :faq-items="faqItems"
      />

      <PublicProfileFinalCtaSection
        :closing-cta-support-line="closingCtaSupportLine"
        :primary-action-next-step-copy="primaryActionNextStepCopy"
        :closing-primary-label="closingPrimaryLabel"
        :closing-secondary-kind="closingSecondaryKind"
        :feedback-link="feedbackLink"
        :contact-cta-label="CONTACT_CHOOSER_COPY.ctaLabel"
        :show-chat-cta="canMessageSpecialist"
        chat-cta-label="Написати в чат"
        :show-request-cta="showClosingRequestCta"
        :request-cta-label="closingRequestCtaLabel"
        :show-feedback-cta="showFeedbackCta"
        @primary-action="handleClosingPrimaryAction"
        @chat-action="openClientChat"
        @request-action="handlePublicRequestAction"
        @scroll-slots="scrollToSlots"
        @open-contact="openPublicContactCta"
      />
      </section>
    </section>

    <div v-if="showContactChooserModal" class="setting-modal">
      <div class="setting-modal__backdrop" @click="closeContactChooserModal"></div>
      <div class="setting-modal__content contact-chooser-modal">
        <div class="setting-modal__header">
          <h3>{{ CONTACT_CHOOSER_COPY.title }}</h3>
          <button class="btn btn--ghost btn--sm" type="button" @click="closeContactChooserModal">
            {{ CONTACT_CHOOSER_COPY.closeButtonLabel }}
          </button>
        </div>
        <div class="setting-modal__body">
          <p class="muted contact-chooser-modal__hint">{{ CONTACT_CHOOSER_COPY.helperText }}</p>
          <div v-if="contactActions.length" class="contact-chooser-modal__list">
            <article
              v-for="item in contactActions"
              :key="item.id"
              class="contact-chooser-modal__item"
            >
              <div class="contact-chooser-modal__meta">
                <div class="contact-chooser-modal__title">{{ item.channelLabel }}</div>
                <div v-if="item.valueText" class="contact-chooser-modal__value">{{ item.valueText }}</div>
              </div>
              <button
                class="btn btn--ghost btn--sm"
                type="button"
                @click="handleContactChooserAction(item)"
              >
                {{
                  copiedContactId === item.id
                    ? CONTACT_CHOOSER_COPY.channelActionCopiedLabel
                    : CONTACT_CHOOSER_COPY.channelActionButtonLabel
                }}
              </button>
            </article>
          </div>
          <div v-else class="muted">{{ CONTACT_CHOOSER_COPY.emptyStateText }}</div>
        </div>
      </div>
    </div>

    <div v-if="contactActionFallback" class="setting-modal">
      <div class="setting-modal__backdrop" @click="closeContactActionFallbackModal"></div>
      <div class="setting-modal__content contact-fallback-modal">
        <div class="setting-modal__header">
          <h3>{{ CONTACT_FALLBACK_COPY.title }}</h3>
          <button class="btn btn--ghost btn--sm" type="button" @click="closeContactActionFallbackModal">
            {{ CONTACT_FALLBACK_COPY.closeButtonLabel }}
          </button>
        </div>
        <div class="setting-modal__body">
          <p class="muted contact-fallback-modal__helper">{{ CONTACT_FALLBACK_COPY.helperText }}</p>
          <article class="contact-fallback-modal__contact">
            <div class="contact-fallback-modal__label">{{ contactActionFallback.channelLabel }}</div>
            <div class="contact-fallback-modal__value">{{ contactActionFallback.valueText }}</div>
          </article>
          <p class="muted contact-fallback-modal__hint">{{ contactActionFallback.manualHint }}</p>
          <div class="contact-fallback-modal__actions">
            <button class="btn btn--ghost btn--sm" type="button" @click="copyContactActionFallbackValue">
              {{ CONTACT_FALLBACK_COPY.copyButtonLabel }}
            </button>
            <button class="btn btn--ghost btn--sm" type="button" @click="retryContactActionFallback">
              {{ CONTACT_FALLBACK_COPY.retryButtonLabel }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showProfileVideoModal && profileVideoUrl" class="setting-modal">
      <div class="setting-modal__backdrop" @click="closeProfileVideoModal"></div>
      <div class="setting-modal__content profile-video-modal">
        <div class="setting-modal__header">
          <h3>Відеовізитка</h3>
          <button class="btn btn--ghost btn--sm" type="button" @click="closeProfileVideoModal">
            Закрити
          </button>
        </div>
        <div class="setting-modal__body">
          <video
            class="profile-video-modal__player"
            :src="profileVideoUrl"
            controls
            autoplay
            preload="metadata"
          ></video>
        </div>
      </div>
    </div>

    <div v-if="showAboutModal && aboutNarrativeText" class="setting-modal">
      <div class="setting-modal__backdrop" @click="closeAboutModal"></div>
      <div class="setting-modal__content about-modal">
        <div class="setting-modal__header">
          <h3>Про мене</h3>
          <button class="btn btn--ghost btn--sm" type="button" @click="closeAboutModal">
            Закрити
          </button>
        </div>
        <div class="setting-modal__body">
          <div class="about-modal__text">{{ aboutNarrativeText }}</div>
        </div>
      </div>
    </div>

    <div v-if="showGuestBookingModal" class="setting-modal">
      <div class="setting-modal__backdrop" @click="closeGuestBookingModal"></div>
      <div class="setting-modal__content guest-booking-modal">
        <div class="setting-modal__header">
          <h3>{{ guestBookingModalTitle }}</h3>
          <button class="btn btn--ghost btn--sm" type="button" @click="closeGuestBookingModal">
            Закрити
          </button>
        </div>
        <div class="setting-modal__body">
          <template v-if="guestBookingSuccess">
            <div class="success guest-booking-success" role="status">
              <strong>{{ guestBookingSuccessTitle }}</strong>
              <span>{{ guestBookingSuccessText }}</span>
            </div>
            <div class="booking-slot" v-if="guestBookingSlot">
              <div class="muted">Обраний слот</div>
              <div class="booking-slot__time">{{ selectedGuestSlotSummary }}</div>
              <div class="muted">{{ formatDuration(guestBookingSlot.start_at, guestBookingSlot.end_at) }}</div>
            </div>
            <div class="booking-next">
              <div class="booking-next__title">Що далі</div>
              <div class="booking-next__item">• Реєстрація не потрібна для цього кроку.</div>
              <div class="booking-next__item">• Це ще не підтверджена сесія.</div>
              <div v-if="guestBookingRequestSummaryCopy" class="booking-next__item">• {{ guestBookingRequestSummaryCopy }}</div>
            </div>
          </template>

          <form v-else class="guest-booking-form" novalidate @submit.prevent="submitGuestBookingRequest">
            <div class="booking-slot" v-if="guestBookingSlot">
              <div class="muted">Обраний слот</div>
              <div class="booking-slot__time">{{ selectedGuestSlotSummary }}</div>
              <div class="muted">{{ formatDuration(guestBookingSlot.start_at, guestBookingSlot.end_at) }}</div>
              <div class="muted" v-if="sessionFormatLabelForBooking">
                Формат: {{ sessionFormatLabelForBooking }}
              </div>
            </div>

            <section
              v-if="showGuestOfferSelector"
              class="guest-offer-selector"
              aria-labelledby="guestOfferSelectorTitle"
            >
              <div id="guestOfferSelectorTitle" class="guest-offer-selector__title">
                Тип консультації
              </div>
              <div class="guest-offer-selector__options">
                <button
                  v-for="offer in guestRequestOfferOptions"
                  :key="offer.type"
                  class="guest-offer-option"
                  :class="{ 'guest-offer-option--active': guestBookingForm.offer_type === offer.type }"
                  type="button"
                  :aria-pressed="guestBookingForm.offer_type === offer.type"
                  :disabled="guestBookingSubmitting"
                  @click="selectGuestBookingOffer(offer.type)"
                >
                  <span class="guest-offer-option__label">{{ offer.label }}</span>
                  <span class="guest-offer-option__meta">{{ offer.meta }}</span>
                </button>
              </div>
              <p v-if="guestOfferCompatibilityMessage" class="guest-offer-selector__hint">
                {{ guestOfferCompatibilityMessage }}
              </p>
            </section>

            <label class="setting-label" for="guestBookingName">
              Ім’я
              <input
                id="guestBookingName"
                ref="guestBookingNameInputRef"
                v-model="guestBookingForm.guest_name"
                class="input"
                :class="{ 'guest-booking-form__input--invalid': guestBookingFieldErrors.guest_name }"
                type="text"
                autocomplete="name"
                required
                :aria-describedby="guestBookingFieldErrors.guest_name ? 'guestBookingNameError' : undefined"
                :aria-invalid="guestBookingFieldErrors.guest_name ? 'true' : 'false'"
                :disabled="guestBookingSubmitting"
                @input="clearGuestBookingFieldError('guest_name')"
              />
              <span
                v-if="guestBookingFieldErrors.guest_name"
                id="guestBookingNameError"
                class="guest-booking-form__field-error"
                role="alert"
              >
                {{ guestBookingFieldErrors.guest_name }}
              </span>
            </label>

            <label class="setting-label" for="guestBookingContactChannel">
              Канал зв’язку
              <select
                id="guestBookingContactChannel"
                v-model="guestBookingForm.contact_channel"
                class="input"
                :disabled="guestBookingSubmitting"
              >
                <option
                  v-for="option in GUEST_CONTACT_CHANNEL_OPTIONS"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>

            <label class="setting-label" for="guestBookingContactValue">
              Як спеціаліст може з вами зв’язатися?
              <input
                id="guestBookingContactValue"
                ref="guestBookingContactValueInputRef"
                v-model="guestBookingForm.contact_value"
                class="input"
                :class="{ 'guest-booking-form__input--invalid': guestBookingFieldErrors.contact_value }"
                type="text"
                :placeholder="guestContactValuePlaceholder"
                autocomplete="off"
                required
                :aria-describedby="guestBookingFieldErrors.contact_value ? 'guestBookingContactValueError' : undefined"
                :aria-invalid="guestBookingFieldErrors.contact_value ? 'true' : 'false'"
                :disabled="guestBookingSubmitting"
                @input="clearGuestBookingFieldError('contact_value')"
              />
              <span
                v-if="guestBookingFieldErrors.contact_value"
                id="guestBookingContactValueError"
                class="guest-booking-form__field-error"
                role="alert"
              >
                {{ guestBookingFieldErrors.contact_value }}
              </span>
            </label>

            <section class="guest-request-topics" aria-labelledby="guestRequestTopicsTitle">
              <div class="guest-request-topics__header">
                <div id="guestRequestTopicsTitle" class="guest-request-topics__title">
                  Що хочете обговорити?
                </div>
                <p class="guest-request-topics__helper">
                  Оберіть до 3 тем.
                </p>
              </div>
              <div class="guest-request-topics__chips">
                <button
                  v-for="topic in requestTopicOptions"
                  :key="topic.value"
                  class="guest-request-topic-chip"
                  :class="{ 'guest-request-topic-chip--active': isGuestRequestTopicSelected(topic.value) }"
                  type="button"
                  :aria-pressed="isGuestRequestTopicSelected(topic.value)"
                  :disabled="isGuestRequestTopicDisabled(topic.value)"
                  @click="toggleGuestRequestTopic(topic.value)"
                >
                  {{ topic.label }}
                </button>
              </div>
              <div v-if="guestRequestTopicLimitReached" class="guest-request-topics__limit">
                Можна обрати до 3 тем.
              </div>
            </section>

            <label class="setting-label" for="guestBookingMessage">
              Опишіть запит
              <textarea
                id="guestBookingMessage"
                v-model="guestBookingForm.message"
                class="input guest-booking-form__message"
                rows="4"
                :maxlength="GUEST_REQUEST_MESSAGE_MAX_LENGTH"
                aria-describedby="guestBookingMessageCounter"
                :disabled="guestBookingSubmitting"
                placeholder="Кілька речень про те, з чим хочете звернутися."
              ></textarea>
              <span id="guestBookingMessageCounter" class="guest-booking-form__message-counter">
                {{ guestBookingForm.message.length }} / {{ GUEST_REQUEST_MESSAGE_MAX_LENGTH }}
              </span>
            </label>

            <section class="guest-request-consent" aria-labelledby="guestRequestConsentTitle">
              <h4 id="guestRequestConsentTitle" class="guest-request-consent__title">Перед надсиланням</h4>
              <p>
                Ваш запит отримає спеціаліст. Він зможе відповісти, запропонувати час
                консультації або уточнити деталі.
              </p>
              <p>Цей запит не є екстреною допомогою.</p>
            </section>

            <article v-if="shouldShowGuestBookingRulesPrompt && activePlatformBookingRules.length" class="booking-rules-block">
              <div class="booking-rules-block__title">Правила Pro Consult</div>
              <p
                v-for="rule in activePlatformBookingRules"
                :key="`guest-platform-${rule.version}`"
                class="booking-rules-block__item"
              >
                {{ rule.text }}
              </p>
            </article>

            <article v-if="shouldShowGuestBookingRulesPrompt && activeSpecialistBookingRules.length" class="booking-rules-block">
              <div class="booking-rules-block__title">Правила спеціаліста</div>
              <p
                v-for="rule in activeSpecialistBookingRules"
                :key="`guest-specialist-${rule.version}-${rule.specialist_id || 'none'}`"
                class="booking-rules-block__item"
              >
                {{ rule.text }}
              </p>
            </article>

            <label v-if="shouldShowGuestBookingRulesPrompt" class="setting-check booking-gate__check">
              <input type="checkbox" v-model="guestBookingRulesAccepted" :disabled="guestBookingSubmitting" />
              <span>{{ guestBookingRulesCheckboxLabel }}</span>
            </label>

            <div v-if="guestBookingError" class="form-error">{{ guestBookingError }}</div>

            <div class="guest-booking-form__submit">
              <button class="btn btn--primary" type="submit" :disabled="guestBookingSubmitDisabled">
                {{ guestBookingSubmitting ? 'Надсилаємо...' : 'Надіслати запит' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div v-if="showClientBookingConfirmModal" class="setting-modal">
      <div class="setting-modal__backdrop" @click="closeClientBookingConfirmModal"></div>
      <div class="setting-modal__content booking-confirm-modal">
        <div class="setting-modal__header">
          <h3>Запит на час</h3>
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :disabled="clientBookingConfirmCloseDisabled"
            @click="closeClientBookingConfirmModal"
          >
            Закрити
          </button>
        </div>
        <div class="setting-modal__body">
          <div v-if="clientBookingConfirmSlot" class="booking-slot booking-slot--details">
            <div class="booking-slot__row">
              <div class="booking-slot__label">Дата</div>
              <div class="booking-slot__value">{{ clientBookingConfirmDate }}</div>
            </div>
            <div class="booking-slot__row">
              <div class="booking-slot__label">Час</div>
              <div class="booking-slot__value">{{ clientBookingConfirmTime }}</div>
            </div>
            <div class="booking-slot__row">
              <div class="booking-slot__label">Формат</div>
              <div class="booking-slot__value">{{ clientBookingConfirmFormat }}</div>
            </div>
            <div class="booking-slot__row">
              <div class="booking-slot__label">Тривалість</div>
              <div class="booking-slot__value">{{ clientBookingConfirmDuration }}</div>
            </div>
          </div>
          <div v-else class="form-error">Обраний слот уже недоступний. Будь ласка, виберіть інший час.</div>
          <div v-if="bookingError" class="form-error">{{ bookingError }}</div>
        </div>
        <div class="setting-modal__footer">
          <button
            class="btn btn--ghost"
            type="button"
            :disabled="clientBookingConfirmCloseDisabled"
            @click="closeClientBookingConfirmModal"
          >
            Скасувати
          </button>
          <button
            class="btn btn--primary"
            type="button"
            :disabled="clientBookingConfirmSubmitDisabled"
            @click="confirmClientBookingFromModal"
          >
            {{ clientBookingConfirmSubmitLabel }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showBookingModal" class="setting-modal">
      <div class="setting-modal__backdrop" @click="closeBookingModal"></div>
      <div class="setting-modal__content">
        <div class="setting-modal__header">
          <h3>Запит на час надіслано</h3>
          <button class="btn btn--ghost btn--sm" type="button" @click="closeBookingModal">
            Закрити
          </button>
        </div>
        <div class="setting-modal__body">
          <div class="booking-confirm">
            Спеціаліст має підтвердити цей час. Це ще не підтверджена сесія, після рішення статус оновиться у вашому кабінеті.
          </div>
          <div v-if="lastBookedSlot" class="booking-slot">
            <div class="muted">Дата і час сесії</div>
            <div class="booking-slot__time">{{ formatDate(lastBookedSlot.start_at) }}</div>
            <div class="muted">{{ formatDuration(lastBookedSlot.start_at, lastBookedSlot.end_at) }}</div>
          </div>
          <div class="booking-next">
            <div class="booking-next__title">Що далі</div>
            <div class="booking-next__item">• Натискання на вільне вікно не списує оплату автоматично.</div>
            <div class="booking-next__item">• Перевіряйте статус і деталі у кабінеті клієнта.</div>
            <div class="booking-next__item">• Після підтвердження сесії сервіс нагадає про зустріч.</div>
            <div class="booking-next__item">• Якщо плани зміняться, ви можете перенести або скасувати запит у деталях сесії.</div>
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
    <ScrollToTopButton />

  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { useRoute, useRouter } from 'vue-router'
import PublicProfileAboutSection from '../components/public-profile/PublicProfileAboutSection.vue'
import PublicProfileFaqSection from '../components/public-profile/PublicProfileFaqSection.vue'
import PublicProfileFinalCtaSection from '../components/public-profile/PublicProfileFinalCtaSection.vue'
import PublicProfileHeroSection from '../components/public-profile/PublicProfileHeroSection.vue'
import PublicProfileIdentityRail from '../components/public-profile/PublicProfileIdentityRail.vue'
import PublicProfileJournalPreviewSection from '../components/public-profile/PublicProfileJournalPreviewSection.vue'
import PublicProfileMediaSection from '../components/public-profile/PublicProfileMediaSection.vue'
import PublicProfileReviewsSection from '../components/public-profile/PublicProfileReviewsSection.vue'
import PublicProfileTrustSection from '../components/public-profile/PublicProfileTrustSection.vue'
import ScrollToTopButton from '../components/ScrollToTopButton.vue'
import { getApiErrorMessage } from '../lib/errors'
import {
  BOOKING_ERROR_FALLBACKS,
  BOOKING_SUCCESS_MESSAGES,
  BOOKING_UI_MESSAGES,
  getBookingErrorCode,
  getBookingErrorMessage,
  getBookingErrorReasonCode,
} from '../lib/bookingCopy'
import { getInquiryActionErrorMessage, mapInquiryStateToUi } from '../lib/inquiryCopy'
import {
  acceptBookingRules,
  apiGet,
  apiPost,
  type BookingSessionCreatePayload,
  type ConsultationOfferType,
  type SessionFormat,
  createInquiryThread,
  fetchChatThreads,
  fetchInquiryMessages,
  fetchInquiryState,
  sendInquiryMessage,
} from '../lib/api'
import { toLocalDate } from '../lib/dates'
import {
  formatUkDateLong,
  formatUkDateTimeCompact,
  formatUkTime,
} from '../lib/dateTime'
import {
  fetchPublicSpecialistProfile,
  fetchSpecialistProfile,
  fetchPublicAuthorJournalPosts,
  fetchPublicJournalCollections,
  type ChatThread,
  type InquiryMessage,
  type InquiryState,
  type PublicContactAction,
  type PublicProfileAboutSection as PublicProfileAboutSectionData,
  type PublicProfileAboutItem,
  type PublicProfileCompetenceSection,
  type PublicProfileContactActionsSection,
  type PublicProfileFaqItem,
  type PublicProfileMediaItem,
  type PublicProfilePublicationsPreviewEmptyState,
  type PublicProfilePublicationsPreviewItem,
  type PublicProfileReviewItem,
  type PublicProfileTopicsSection,
  type PublicProfileTrustItem,
  type PublicProfileTrustSection as PublicProfileTrustSectionData,
  type PublicBookingRuleItem,
  REQUEST_TOPIC_OPTIONS,
  type PublicGuestRequestTopic,
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

type PublicGuestBookingRequestPayload = {
  slot_id?: number
  session_format: SessionFormat
  offer_type?: ConsultationOfferType
  guest_name: string
  contact_channel: GuestContactChannel
  contact_value: string
  request_topics: PublicGuestRequestTopic[]
  message?: string
}

type PublicGuestBookingRequestResponse = {
  request: {
    id: number
    status: string
    created_at: string
    next_step: string | null
  }
}

type GuestContactChannel = 'email' | 'phone' | 'telegram'
type GuestRequestTopicOption = PublicGuestRequestTopic | 'other'
type PublicConsultationOfferView = {
  type: ConsultationOfferType
  label: string
  durationMinutes: number
  priceDisplay: string
  durationLabel: string
  meta: string
}
type PublicConsultationOfferOption = PublicConsultationOfferView & {
  disabled: boolean
  helperText: string
}
const GUEST_REQUEST_MESSAGE_MAX_LENGTH = 300
const GUEST_BOOKING_GENERIC_SUCCESS_TITLE = 'Запит надіслано'
const GUEST_BOOKING_SLOT_SUCCESS_TITLE = 'Запит на обраний час надіслано'
const GUEST_BOOKING_GENERIC_SUCCESS_TEXT =
  'Спеціаліст отримає ваш запит і зможе зв’язатися з вами для узгодження часу та деталей.'
const GUEST_BOOKING_SLOT_SUCCESS_TEXT =
  'Спеціаліст підтвердить сесію або запропонує інший час.'
const GUEST_BOOKING_GENERIC_NEXT_STEP_COPY =
  'Спеціаліст відповість у зручному для вас каналі, якщо ви залишили контакт.'
const GUEST_BOOKING_SLOT_NEXT_STEP_COPY =
  'Спеціаліст побачить обраний вами час у кабінеті.'
const REQUEST_GENERIC_CTA_LABEL = 'Залишити запит'
const REQUEST_WITHOUT_SLOT_CTA_LABEL = 'Залишити запит без вибору часу'
const CHOOSE_TIME_CTA_LABEL = 'Обрати час'
const INQUIRY_BEFORE_BOOKING_CTA_LABEL = 'Поставити питання перед запитом'
const REQUEST_CTA_HELPER_TEXT =
  'Опишіть коротко, з чим хочете звернутися. Спеціаліст відповість у кабінеті й допоможе узгодити формат та час.'
const DIRECT_BOOKING_CTA_HELPER_TEXT =
  'Оберіть доступне вікно у профілі. Спеціаліст має підтвердити цей час.'
const NO_SLOTS_REQUEST_HELPER_TEXT =
  'Наразі немає доступних вікон. Ви можете залишити запит, і спеціаліст узгодить час окремо.'
const REQUEST_CTA_TOOLTIP_TEXT =
  'Запит — якщо хочете консультацію. Питання — якщо потрібно щось уточнити перед запитом.'
const CONSULTATION_OFFER_LABELS: Record<ConsultationOfferType, string> = {
  standard: 'Консультація',
  intro: 'Ознайомча сесія',
  couple: 'Парна консультація',
}
const GUEST_OFFER_DURATION_MISMATCH_MESSAGE =
  'Обраний тип консультації не відповідає тривалості вибраного часу. Оберіть інший час або залиште запит без вибору часу.'

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

type PublicReviewView = {
  id: string
  review_text: string
  created_at: string
}

type PublicFaqItemView = {
  id: string
  question: string
  answer: string
}

type PublicMediaItemView = {
  id: string
  title: string
  description: string
  kindLabel: string
  url: string
}

type JournalPreviewPost = {
  id: number
  slug: string
  title: string
  summary?: string | null
  cover_image_url?: string | null
  is_featured: boolean
  featured_order?: number
  published_at?: string | null
  created_at?: string | null
  category?: 'TIP' | 'EXPLAIN' | 'FAQ' | 'RESEARCH' | 'PRACTICE' | null
  reading_time_minutes?: number | null
}

type JournalCanonicalEmptyStateCode = Exclude<PublicProfilePublicationsPreviewEmptyState, null>

type ProfileKeyValueItem = {
  label: string
  value: string
}

type ProfileAboutSection = {
  title: string
  body: string
}

type PublicContactActionViewModel = {
  id: string
  channel: string
  channelLabel: string
  valueText: string
  actionUrl: string
  actionScheme: string
}

type ContactActionFallbackViewModel = {
  channelLabel: string
  valueText: string
  copyValue: string
  manualHint: string
  actionUrl: string
}

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToast()
const profile = ref<PublicSpecialistProfile | null>(null)
const slots = ref<PublicSlot[]>([])
const monthSlots = ref<PublicSlot[]>([])
const horizonSlots = ref<PublicSlot[]>([])
const loading = ref(false)
const slotsLoading = ref(false)
const slotsLoaded = ref(false)
const horizonSlotsLoading = ref(false)
const horizonSlotsLoaded = ref(false)
const error = ref('')
const ownerUnpublishedProfile = ref(false)
const slotsError = ref('')
const bookingError = ref('')
const bookingSuccess = ref('')
const bookingSlotId = ref<number | null>(null)
const showClientBookingConfirmModal = ref(false)
const clientBookingConfirmSlotId = ref<number | null>(null)
const showBookingModal = ref(false)
const lastBookedSlot = ref<PublicSlot | null>(null)
const showGuestBookingModal = ref(false)
const guestBookingSlot = ref<PublicSlot | null>(null)
const guestBookingSubmitting = ref(false)
const guestBookingSubmitSlotId = ref<number | null>(null)
const guestBookingError = ref('')
const guestBookingSuccess = ref<PublicGuestBookingRequestResponse['request'] | null>(null)
const guestBookingForm = ref({
  guest_name: '',
  contact_channel: 'email' as GuestContactChannel,
  contact_value: '',
  offer_type: 'standard' as ConsultationOfferType,
  message: '',
})
const guestBookingFieldErrors = ref<Record<'guest_name' | 'contact_value', string>>({
  guest_name: '',
  contact_value: '',
})
const guestBookingNameInputRef = ref<HTMLInputElement | null>(null)
const guestBookingContactValueInputRef = ref<HTMLInputElement | null>(null)
const selectedGuestRequestTopics = ref<GuestRequestTopicOption[]>([])
const bookingRulesAccepting = ref(false)
const pendingClientBookingSlotId = ref<number | null>(null)
const bookingRulesPromptRef = ref<HTMLElement | null>(null)
const guestBookingRulesAccepted = ref(false)
const showContactChooserModal = ref(false)
const contactActionFallback = ref<ContactActionFallbackViewModel | null>(null)
const showProfileVideoModal = ref(false)
const showAboutModal = ref(false)
const copiedContactId = ref('')
let contactActionFallbackTimer: number | null = null
let copiedContactTimer: number | null = null
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
const journalPosts = ref<JournalPreviewPost[]>([])
const journalCollections = ref<PublicJournalCollectionListItem[]>([])
const journalLoading = ref(false)
const journalError = ref('')
const journalEmptyStateCode = ref<JournalCanonicalEmptyStateCode | null>(null)
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
const visibleMonthStart = ref(toLocalMonthStart(new Date()))
const showAllSlots = ref(false)
const slotsPreviewLimit = 96
const bookingSessionFormat = ref<SessionFormat>('online')
const monthSlotsCache = new Map<string, PublicSlot[]>()
const didAutoShiftToFirstAvailableMonth = ref(false)
const selectedPublicOfferType = ref<ConsultationOfferType | null>(null)

const slug = computed(() => String(route.params.slug || '').trim())
const roles = computed(() => auth.me?.user.roles ?? auth.user?.roles ?? [])
const isAuthenticated = computed(() => Boolean(auth.accessToken))
const isClient = computed(() => roles.value.includes('CLIENT'))
const isGuestVisitor = computed(() => !isAuthenticated.value)
const isUnsupportedBookingRole = computed(() => isAuthenticated.value && !isClient.value)
const canBook = computed(() => isAuthenticated.value && isClient.value)
const publicBookingMode = computed(() => String(profile.value?.public_booking_mode || 'request_only').trim())
const showPublicAvailability = computed(() => Boolean(profile.value?.show_public_availability))
const isPublicSlotBookingMode = computed(() => {
  if (publicBookingMode.value !== 'direct_booking' || !showPublicAvailability.value) {
    return false
  }
  if (typeof profile.value?.public_direct_booking_enabled === 'boolean') {
    return profile.value.public_direct_booking_enabled
  }
  return true
})
const publicDirectBookingEnabled = computed(() => isPublicSlotBookingMode.value)
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
function resolveBookingRuleScope(rule: PublicBookingRuleItem): 'PLATFORM' | 'SPECIALIST' {
  return String(rule.scope || '').trim().toUpperCase() === 'PLATFORM' ? 'PLATFORM' : 'SPECIALIST'
}

const activeBookingRuleItems = computed<PublicBookingRuleItem[]>(() => {
  const items = profile.value?.booking_rules?.items || []
  return items.filter((item) => typeof item?.text === 'string' && item.text.trim().length > 0)
})

const pendingBookingRuleItems = computed(() => activeBookingRuleItems.value.filter((item) => !item.accepted))

const bookingRulesPromptEnabled = computed(() => {
  const bookingRules = profile.value?.booking_rules
  return Boolean(bookingRules?.show_prompt) && activeBookingRuleItems.value.length > 0
})

const bookingRulesReasonCodes = computed(() => {
  const codes = profile.value?.booking_rules?.reason_codes || []
  return new Set(
    codes
      .map((code) => String(code || '').trim().toUpperCase())
      .filter((code) => code.length > 0)
  )
})

const pendingPlatformBookingRules = computed(() =>
  pendingBookingRuleItems.value.filter((item) => resolveBookingRuleScope(item) === 'PLATFORM')
)
const pendingSpecialistBookingRules = computed(() =>
  pendingBookingRuleItems.value.filter((item) => resolveBookingRuleScope(item) === 'SPECIALIST')
)
const activePlatformBookingRules = computed(() =>
  activeBookingRuleItems.value.filter((item) => resolveBookingRuleScope(item) === 'PLATFORM')
)
const activeSpecialistBookingRules = computed(() =>
  activeBookingRuleItems.value.filter((item) => resolveBookingRuleScope(item) === 'SPECIALIST')
)

const shouldShowClientBookingRulesPrompt = computed(
  () => Boolean(canBook.value && bookingRulesPromptEnabled.value && pendingBookingRuleItems.value.length > 0)
)
const shouldShowGuestBookingRulesPrompt = computed(
  () => Boolean(isGuestVisitor.value && bookingRulesPromptEnabled.value)
)

const requiresPlatformRulesPrompt = computed(
  () =>
    bookingRulesReasonCodes.value.has('PLATFORM_NOT_ACCEPTED') ||
    pendingPlatformBookingRules.value.length > 0
)
const requiresSpecialistRulesPrompt = computed(
  () =>
    bookingRulesReasonCodes.value.has('SPECIALIST_NOT_ACCEPTED') ||
    pendingSpecialistBookingRules.value.length > 0
)

const clientBookingRulesPromptText = computed(() => {
  if (requiresPlatformRulesPrompt.value && requiresSpecialistRulesPrompt.value) {
    return 'Щоб надіслати запит на час до цього спеціаліста, підтвердіть актуальні правила платформи та умови спеціаліста. Повторне підтвердження знадобиться лише тоді, якщо правила платформи або умови спеціаліста оновляться.'
  }
  if (requiresPlatformRulesPrompt.value) {
    return 'Щоб надіслати запит на час до цього спеціаліста, підтвердіть актуальні правила платформи. Повторне підтвердження знадобиться лише тоді, якщо правила платформи оновляться.'
  }
  if (requiresSpecialistRulesPrompt.value) {
    return 'Щоб надіслати запит на час до цього спеціаліста, підтвердіть актуальні умови спеціаліста. Повторне підтвердження знадобиться лише тоді, якщо умови спеціаліста оновляться.'
  }
  return 'Щоб надіслати запит на час до цього спеціаліста, підтвердіть актуальні правила.'
})

const bookingRulesConfirmLabel = computed(() =>
  bookingRulesAccepting.value ? 'Підтверджуємо правила...' : 'Підтвердити правила перед запитом'
)

const guestBookingSubmitDisabled = computed(
  () =>
    guestBookingSubmitting.value ||
    (shouldShowGuestBookingRulesPrompt.value && !guestBookingRulesAccepted.value)
)
const guestRequestTopicLimitReached = computed(() => selectedGuestRequestTopics.value.length >= 3)
const requestTopicOptions: Array<{ value: GuestRequestTopicOption; label: string }> = [
  ...REQUEST_TOPIC_OPTIONS,
  { value: 'other', label: 'Інше' },
]
const guestBookingModalTitle = computed(() =>
  publicDirectBookingEnabled.value ? 'Запит на сесію' : 'Запит до мене'
)

const guestBookingRulesCheckboxLabel = computed(() => {
  const hasPlatformRules = activePlatformBookingRules.value.length > 0
  const hasSpecialistRules = activeSpecialistBookingRules.value.length > 0

  if (hasPlatformRules && hasSpecialistRules) {
    return 'Погоджуюся з правилами платформи та правилами спеціаліста'
  }
  if (hasSpecialistRules) {
    return 'Погоджуюся з правилами спеціаліста'
  }
  return 'Погоджуюся з правилами платформи'
})

const isSlotBusy = (slotId: number) =>
  bookingRulesAccepting.value ||
  bookingSlotId.value === slotId ||
  (guestBookingSubmitting.value && guestBookingSubmitSlotId.value === slotId)
const visibleSlots = computed(() => (showAllSlots.value ? slots.value : slots.value.slice(0, slotsPreviewLimit)))
const hasMoreSlots = computed(() => slots.value.length > slotsPreviewLimit)
const hasPublicJournalPosts = computed(
  () => journalPosts.value.length > 0 || Boolean(journalEmptyStateCode.value)
)
const journalCanonicalEmptyStateTitle = computed(() => {
  if (journalEmptyStateCode.value === 'JOURNAL_DISABLED') return 'Власний блог тимчасово вимкнено'
  if (journalEmptyStateCode.value === 'NO_PUBLICATIONS') return 'Поки немає публікацій'
  return ''
})
const journalCanonicalEmptyStateBody = computed(() => {
  if (journalEmptyStateCode.value === 'JOURNAL_DISABLED') {
    return 'Спеціаліст тимчасово не показує публікації на публічній сторінці.'
  }
  if (journalEmptyStateCode.value === 'NO_PUBLICATIONS') {
    return 'Коли зʼявляться нові матеріали, вони будуть доступні у цьому розділі.'
  }
  return ''
})
const matchesProfileSession = (session: ClientSession) => {
  if (!profile.value) return false
  const specialistId = profile.value.therapist_id
  const sessionSpecialist = session.therapist
  if (specialistId && sessionSpecialist) {
    return specialistId === sessionSpecialist
  }
  const profileSlug = String(profile.value.public_slug || profile.value.slug || '').trim()
  if (profileSlug && session.therapist_public_slug) {
    return profileSlug === session.therapist_public_slug
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
const hasFeedbackEligibleSession = computed(() =>
  relatedPastSessions.value.some((session) => String(session.status || '').toUpperCase() === 'COMPLETED')
)
const showFeedbackCta = computed(
  () => Boolean(isClient.value && isAuthenticated.value && hasFeedbackEligibleSession.value)
)
const showInquiryEntry = computed(() => {
  if (!isAuthenticated.value || !isClient.value || !profile.value || !inquiryState.value) return false
  if (!publicDirectBookingEnabled.value || showDirectBookingRequestFallback.value) return false
  return inquiryState.value.inquiry_status !== 'ACTIVE_CLIENT'
})
const showInquiryPanel = computed(() => {
  if (!isAuthenticated.value || !isClient.value || !profile.value) return false
  if (!publicDirectBookingEnabled.value || showDirectBookingRequestFallback.value) return false
  if (hasActiveClientRelation.value) return false
  return inquiryLoading.value || Boolean(inquiryState.value)
})
const showRailInquiryCta = computed(() => Boolean(showInquiryEntry.value && publicDirectBookingEnabled.value))
const showRailRequestCta = computed(() => {
  if (publicDirectBookingEnabled.value && !showDirectBookingRequestFallback.value) return true
  if (!canMessageSpecialist.value) return false
  return !publicDirectBookingEnabled.value || showDirectBookingRequestFallback.value
})
const showRequestExplanation = computed(
  () => !publicDirectBookingEnabled.value || showDirectBookingRequestFallback.value
)
const showRailSlotsCta = computed(() => false)
const showClosingRequestCta = computed(() => showRailRequestCta.value)
const calendarWeekdayHeaders = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
const visibleMonthLabel = computed(() => formatCalendarMonthLabel(visibleMonthStart.value))
const calendarLeadingBlanks = computed(() => {
  const firstDay = parseLocalDateValue(visibleMonthStart.value)
  return (firstDay.getDay() + 6) % 7
})
const offerFilteredMonthSlots = computed(() =>
  monthSlots.value.filter((slot) => isSlotCompatibleWithSelectedPublicOffer(slot))
)
const offerFilteredHorizonSlots = computed(() =>
  horizonSlots.value.filter((slot) => isSlotCompatibleWithSelectedPublicOffer(slot))
)
const slotsByLocalDate = computed(() => groupSlotsByLocalDate(offerFilteredMonthSlots.value))
const monthHasSlots = computed(() => offerFilteredMonthSlots.value.length > 0)
const hasSlotsInBookingHorizon = computed(() => offerFilteredHorizonSlots.value.length > 0)
const showDirectBookingRequestFallback = computed(
  () =>
    publicDirectBookingEnabled.value &&
    horizonSlotsLoaded.value &&
    !horizonSlotsLoading.value &&
    !hasSlotsInBookingHorizon.value
)
const showSlotHeaderActions = computed(() => showDirectBookingRequestFallback.value || canMessageSpecialist.value)
const railRequestCtaLabel = computed(() =>
  publicDirectBookingEnabled.value && !showDirectBookingRequestFallback.value
    ? REQUEST_WITHOUT_SLOT_CTA_LABEL
    : REQUEST_GENERIC_CTA_LABEL
)
const railRequestHelperText = computed(() =>
  showDirectBookingRequestFallback.value ? NO_SLOTS_REQUEST_HELPER_TEXT : REQUEST_CTA_HELPER_TEXT
)
const closingRequestCtaLabel = computed(() =>
  publicDirectBookingEnabled.value && !showDirectBookingRequestFallback.value
    ? REQUEST_WITHOUT_SLOT_CTA_LABEL
    : REQUEST_GENERIC_CTA_LABEL
)
const selectedDateDisplayLabel = computed(() => {
  if (!selectedDate.value) return 'обрану дату'
  return formatCalendarDateLabel(selectedDate.value)
})
const calendarDays = computed(() => {
  const firstDay = parseLocalDateValue(visibleMonthStart.value)
  const year = firstDay.getFullYear()
  const month = firstDay.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = toLocalDate(new Date())
  const days = []

  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
    const date = toLocalDate(new Date(year, month, dayNumber))
    const availableCount = slotsByLocalDate.value.get(date)?.length || 0
    days.push({
      date,
      dayNumber,
      isAvailable: availableCount > 0,
      isSelected: date === selectedDate.value,
      isToday: date === today,
      ariaLabel: `${formatCalendarDateLabel(date)}${availableCount ? `, доступно слотів: ${availableCount}` : ', немає доступних слотів'}`,
    })
  }

  return days
})
const sectionsTrust = computed(() => profile.value?.sections?.trust || null)
const sectionsAbout = computed(() => profile.value?.sections?.about || null)
const sectionsCompetence = computed(() => profile.value?.sections?.competence || null)
const sectionsTopics = computed(() => profile.value?.sections?.topics || null)
const sectionsFormats = computed(() => profile.value?.sections?.formats || null)
const sectionsContactActions = computed(() => profile.value?.sections?.contact_actions ?? null)
const sectionsReviews = computed(() => profile.value?.sections?.reviews || null)
const sectionsFaq = computed(() => profile.value?.sections?.faq || null)
const sectionsMedia = computed(() => profile.value?.sections?.media || null)

function toDisplayText(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function normalizeMultilineText(value: unknown): string {
  const text = toDisplayText(value)
  if (!text) return ''
  return text
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

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

function normalizeCompetenceItemList(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  const normalized = String(value).replace(/\r/g, '').trim()
  if (!normalized) return []
  if (normalized.includes('\n')) {
    return normalized
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return normalized
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const publicName = computed(() =>
  firstFilledText(profile.value?.public_display_name, profile.value?.display_name)
)

const heroMediaProfile = computed<{ photo_url?: string | null; video_url?: string | null } | null>(() => {
  if (!profile.value) return null
  const sectionHeroMedia = resolveSectionHeroMedia()
  return {
    photo_url: firstFilledText(sectionHeroMedia?.photoUrl, toDisplayText(profile.value.photo_url)) || null,
    video_url: firstFilledText(sectionHeroMedia?.videoUrl, toDisplayText(profile.value.video_url)) || null,
  }
})

const profileVideoUrl = computed(() => heroMediaProfile.value?.video_url || '')

function firstFilledText(...values: Array<string | null | undefined>) {
  return values
    .map((value) => (value || '').replace(/\s+/g, ' ').trim())
    .find(Boolean) || ''
}

function firstFilledMultilineText(...values: unknown[]) {
  return values
    .map((value) => normalizeMultilineText(value))
    .find(Boolean) || ''
}

function normalizeTrustItem(item: PublicProfileTrustItem | null | undefined): ProfileKeyValueItem | null {
  if (!item || typeof item !== 'object') return null
  const label = toDisplayText(item.label)
  const value = toDisplayText(item.value)
  if (!label || !value) return null
  return { label, value }
}

function normalizeAboutSection(item: PublicProfileAboutItem | null | undefined): ProfileAboutSection | null {
  if (!item || typeof item !== 'object') return null
  const title = toDisplayText(item.title)
  const body = normalizeMultilineText(item.body)
  if (!title || !body) return null
  return { title, body }
}

function normalizeTopicChip(item: unknown): string {
  if (typeof item === 'string') return item.trim()
  if (!item || typeof item !== 'object') return ''
  const value = item as Record<string, unknown>
  return toDisplayText(value.label ?? value.title ?? value.name)
}

function normalizeComparableText(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase()
}

function parseInlineBulletLabels(value: string): string[] {
  return value
    .split('\u2022')
    .map((item) => item.trim())
    .filter(Boolean)
}

function isLikelyGeneratedTopicTail(prefix: string, labels: string[]): boolean {
  if (labels.length < 2) return false
  return /[.!?:;…)]$/.test(prefix.trim())
}

function extractAppendedTopicLabels(value: unknown): string[] {
  const text = normalizeMultilineText(value)
  if (!text) return []

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const lastLine = lines[lines.length - 1] || ''
  if (lastLine.startsWith('\u2022') && lines.slice(0, -1).some((line) => !line.startsWith('\u2022'))) {
    const labels = parseInlineBulletLabels(lastLine)
    return labels.length >= 2 ? labels : []
  }

  const bulletIndex = lastLine.indexOf('\u2022')
  if (bulletIndex > 0) {
    const labels = parseInlineBulletLabels(lastLine.slice(bulletIndex))
    return isLikelyGeneratedTopicTail(lastLine.slice(0, bulletIndex), labels) ? labels : []
  }

  return []
}

function areDuplicatedTopicLabels(labels: string[], chips: string[]): boolean {
  if (!labels.length || !chips.length) return false
  const chipSet = new Set(chips.map(normalizeComparableText).filter(Boolean))
  return labels.every((label) => chipSet.has(normalizeComparableText(label)))
}

function removeDuplicatedTopicChipLine(text: string, chips: string[]): string {
  if (!text || !chips.length) return text

  const lines = text.split('\n')
  const lastContentLineIndex = lines.reduce((lastIndex, line, index) => (line.trim() ? index : lastIndex), -1)

  return lines
    .map((line, index) => {
      const trimmed = line.trim()
      if (!trimmed) return line

      if (trimmed.startsWith('\u2022')) {
        const hasParagraphBefore = lines
          .slice(0, lastContentLineIndex)
          .some((previousLine) => previousLine.trim() && !previousLine.trim().startsWith('\u2022'))
        return index === lastContentLineIndex &&
          hasParagraphBefore &&
          areDuplicatedTopicLabels(parseInlineBulletLabels(trimmed), chips)
          ? ''
          : line
      }

      const bulletIndex = line.indexOf('\u2022')
      if (bulletIndex === -1) return line

      const beforeBullets = line.slice(0, bulletIndex).trimEnd()
      const duplicatedLabels = parseInlineBulletLabels(line.slice(bulletIndex))
      if (
        !beforeBullets ||
        !isLikelyGeneratedTopicTail(beforeBullets, duplicatedLabels) ||
        !areDuplicatedTopicLabels(duplicatedLabels, chips)
      ) {
        return line
      }

      return beforeBullets
    })
    .filter((line) => line.trim())
    .join('\n')
    .trim()
}

function normalizeReviewItemFromSection(
  item: PublicProfileReviewItem | null | undefined,
  index: number
): PublicReviewView | null {
  if (!item || typeof item !== 'object') return null
  const reviewText = toDisplayText(item.review_text ?? item.text)
  if (!reviewText) return null
  const createdAt = toDisplayText(item.created_at ?? item.published_at)
  return {
    id: toDisplayText(item.id) || `section-review-${index}`,
    review_text: reviewText,
    created_at: createdAt,
  }
}

function resolveSectionReviewItems(): PublicReviewView[] {
  const source = sectionsReviews.value?.items
  if (!Array.isArray(source) || source.length === 0) return []
  return source
    .map((item, index) => normalizeReviewItemFromSection(item, index))
    .filter((item): item is PublicReviewView => Boolean(item))
}

function normalizeFaqItemFromSection(
  item: PublicProfileFaqItem | null | undefined,
  index: number
): PublicFaqItemView | null {
  if (!item || typeof item !== 'object') return null
  const question = toDisplayText(item.question ?? item.title)
  const answer = toDisplayText(item.answer ?? item.body)
  if (!question || !answer) return null
  return {
    id: toDisplayText(item.id) || `section-faq-${index}`,
    question,
    answer,
  }
}

function resolveSectionFaqItems(): PublicFaqItemView[] {
  const source = sectionsFaq.value?.items
  if (!Array.isArray(source) || source.length === 0) return []
  return source
    .map((item, index) => normalizeFaqItemFromSection(item, index))
    .filter((item): item is PublicFaqItemView => Boolean(item))
}

function resolveMediaItemUrl(item: PublicProfileMediaItem): string {
  return toDisplayText(item.url ?? item.file_url ?? item.image_url ?? item.video_url)
}

function normalizeMediaItemFromSection(
  item: PublicProfileMediaItem | null | undefined,
  index: number
): PublicMediaItemView | null {
  if (!item || typeof item !== 'object') return null
  const url = resolveMediaItemUrl(item)
  if (!url) return null
  const title = toDisplayText(item.title) || 'Матеріал'
  const description = toDisplayText(item.description)
  const kindLabel = toDisplayText(item.kind ?? item.type)
  return {
    id: toDisplayText(item.id) || `section-media-${index}`,
    title,
    description,
    kindLabel,
    url,
  }
}

function resolveSectionMediaItems(): PublicMediaItemView[] {
  const source = Array.isArray(sectionsMedia.value?.items)
    ? sectionsMedia.value?.items
    : Array.isArray(sectionsMedia.value?.assets)
      ? sectionsMedia.value?.assets
      : []
  if (!source.length) return []
  return source
    .map((item, index) => normalizeMediaItemFromSection(item, index))
    .filter((item): item is PublicMediaItemView => Boolean(item))
}

function resolveSectionHeroMedia() {
  const media = sectionsMedia.value
  if (!media || typeof media !== 'object') return null
  const photoUrl = firstFilledText(
    toDisplayText(media.hero_photo_url),
    toDisplayText(media.photo_url)
  )
  const videoUrl = firstFilledText(
    toDisplayText(media.hero_video_url),
    toDisplayText(media.video_url)
  )
  return { photoUrl, videoUrl }
}

function resolveMeetingFormatLabelFromFlags(offersOnline: boolean, offersOffline: boolean): string {
  if (offersOnline && offersOffline) return 'Онлайн та офлайн'
  if (offersOnline) return 'Онлайн'
  if (offersOffline) return 'Офлайн'
  return ''
}

const sectionTrustItems = computed<ProfileKeyValueItem[]>(() => {
  const source = sectionsTrust.value as PublicProfileTrustSectionData | null
  const explicitItems = Array.isArray(source?.items)
    ? source.items
        .map((item) => normalizeTrustItem(item))
        .filter((item): item is ProfileKeyValueItem => Boolean(item))
    : []

  const structuredItems: ProfileKeyValueItem[] = []
  if (source && typeof source.experience_years === 'number' && Number.isFinite(source.experience_years)) {
    structuredItems.push({ label: 'Досвід', value: formatExperience(source.experience_years) })
  }
  const trustLanguages = toTextList(source?.languages)
  if (trustLanguages.length) {
    structuredItems.push({ label: 'Мови', value: trustLanguages.join(', ') })
  }
  const trustLocation = toDisplayText(source?.location)
  if (trustLocation) {
    structuredItems.push({ label: 'Локація', value: trustLocation })
  }
  if (
    source &&
    typeof source.completed_sessions_count === 'number' &&
    Number.isFinite(source.completed_sessions_count)
  ) {
    const completedBadge = getCompletedSessionsBadge(source.completed_sessions_count)
    if (completedBadge) {
      structuredItems.push({ label: 'Проведені сесії', value: completedBadge })
    }
  }

  return [...explicitItems, ...structuredItems]
})

const sectionAboutSections = computed<ProfileAboutSection[]>(() => {
  const source = Array.isArray(sectionsAbout.value?.items)
    ? sectionsAbout.value?.items
    : Array.isArray(sectionsAbout.value?.sections)
      ? sectionsAbout.value?.sections
      : []
  if (!source.length) return []
  return source
    .map((item) => normalizeAboutSection(item))
    .filter((item): item is ProfileAboutSection => Boolean(item))
})

const sectionCompetenceData = computed<PublicProfileCompetenceSection | null>(() => {
  const source = sectionsCompetence.value
  if (!source || typeof source !== 'object') return null
  return source
})

const hasSectionCompetenceSource = computed(() => Boolean(sectionCompetenceData.value))

const competenceEducationSummary = computed(() => {
  if (hasSectionCompetenceSource.value) {
    return normalizeMultilineText(sectionCompetenceData.value?.education_summary || '')
  }
  return normalizeMultilineText(profile.value?.education_summary || '')
})

const competenceEducationItems = computed(() => {
  if (hasSectionCompetenceSource.value) {
    return normalizeCompetenceItemList(sectionCompetenceData.value?.education_items)
  }
  return normalizeCompetenceItemList(profile.value?.education_items)
})

const competenceProfessionalDevelopmentItems = computed(() => {
  if (hasSectionCompetenceSource.value) {
    return normalizeCompetenceItemList(sectionCompetenceData.value?.professional_development_items)
  }
  return normalizeCompetenceItemList(profile.value?.professional_development_items)
})

const sectionTopicChips = computed<string[]>(() => {
  const source = Array.isArray(sectionsTopics.value?.chips)
    ? sectionsTopics.value?.chips
    : Array.isArray(sectionsTopics.value?.items)
      ? sectionsTopics.value?.items
      : []
  if (source.length) {
    return source
      .map((item) => normalizeTopicChip(item))
      .filter(Boolean)
  }
  return toTextList(sectionsTopics.value?.specializations)
})

function normalizeTopicChipList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeTopicChip(item))
      .filter(Boolean)
  }
  return toTextList(value)
}

const sectionMainRequestChips = computed<string[]>(() => {
  const source = sectionsTopics.value as (PublicProfileTopicsSection & Record<string, unknown>) | null
  if (!source) return []

  const explicitSources = [
    source.request_chips,
    source.request_topics,
    source.client_request_chips,
    source.selected_request_chips,
    source.requestChips,
    source.requestTopics,
    source.clientRequestChips,
    source.selectedRequestChips,
  ]

  for (const candidate of explicitSources) {
    const items = normalizeTopicChipList(candidate)
    if (items.length) return items
  }

  const appendedTextSources = [
    (sectionsAbout.value as Record<string, unknown> | null)?.bio_for_whom,
    source.who_this_is_for,
    source.for_whom,
    source.text,
    source.description,
    profile.value?.bio_for_whom,
  ]
  for (const candidate of appendedTextSources) {
    const items = extractAppendedTopicLabels(candidate)
    if (items.length) return items
  }

  return []
})

type AboutNarrativeField = 'bio' | 'bio_about' | 'bio_work' | 'bio_approach' | 'bio_for_whom' | 'bio_other'

function resolveSectionAboutField(field: AboutNarrativeField): string {
  const source = sectionsAbout.value as Record<string, unknown> | null
  return normalizeMultilineText(source?.[field])
}

const sectionWhoThisIsForText = computed(() => {
  const source = sectionsTopics.value as (PublicProfileTopicsSection & Record<string, unknown>) | null
  return firstFilledMultilineText(
    resolveSectionAboutField('bio_for_whom'),
    source?.who_this_is_for,
    source?.for_whom,
    source?.text,
    source?.description
  )
})

const heroLeadText = computed(() => {
  const sectionSummary = toDisplayText(
    (sectionsAbout.value as (PublicProfileAboutSectionData & Record<string, unknown>) | null)?.public_profile_summary
  )
  const source = firstFilledText(sectionSummary, toDisplayText(profile.value?.public_profile_summary))
  if (!source) return ''
  return source.replace(/\s+/g, ' ').trim()
})

const heroSupportText = computed(() => '')

const completedSessionsBadge = computed(() => {
  return getCompletedSessionsBadge(profile.value?.completed_sessions_count)
})

const meetingFormatLabel = computed(() => {
  const sectionLabel = toDisplayText(sectionsFormats.value?.meeting_format_label)
  if (sectionLabel) return sectionLabel
  const sectionFormats = sectionsFormats.value as (Record<string, unknown> & { offers_online?: unknown; offers_offline?: unknown }) | null
  const sectionOffersOnline = typeof sectionFormats?.offers_online === 'boolean' ? sectionFormats.offers_online : null
  const sectionOffersOffline = typeof sectionFormats?.offers_offline === 'boolean' ? sectionFormats.offers_offline : null
  if (sectionOffersOnline !== null || sectionOffersOffline !== null) {
    return resolveMeetingFormatLabelFromFlags(Boolean(sectionOffersOnline), Boolean(sectionOffersOffline))
  }
  if (!profile.value) return ''
  return resolveMeetingFormatLabelFromFlags(
    Boolean(profile.value.offers_online),
    Boolean(profile.value.offers_offline)
  )
})

const offlineMeetingLocation = computed(() => {
  const sectionLocation = toDisplayText(sectionsFormats.value?.offline_location)
  if (sectionLocation) return sectionLocation
  if (!profile.value?.offers_offline) return ''
  return (profile.value.offline_location || '').trim()
})

const profileLocationDisplay = computed(() => {
  const sectionLocation = toDisplayText(sectionsFormats.value?.location)
  if (sectionLocation) return sectionLocation
  return toDisplayText(profile.value?.location)
})

const feedbackLink = computed(() => ({
  name: 'specialist-feedback',
  params: { slug: profile.value?.public_slug || profile.value?.slug || slug.value },
}))
const heroCtaTitle = computed(() => {
  if (canMessageSpecialist.value) return 'Продовжити спілкування'
  if (showDirectBookingRequestFallback.value) return 'Немає доступних вікон'
  if (!publicDirectBookingEnabled.value) return 'Залиште запит'
  return 'Оберіть формат'
})
const heroPrimaryLabel = computed(() => {
  if (!publicDirectBookingEnabled.value || showDirectBookingRequestFallback.value) return REQUEST_GENERIC_CTA_LABEL
  return CHOOSE_TIME_CTA_LABEL
})

const primaryActionNextStepCopy = computed(() => {
  if (canMessageSpecialist.value) {
    return 'Ви вже працюєте з цим спеціалістом. Можете продовжити спілкування або переглянути свої сесії.'
  }
  if (!publicDirectBookingEnabled.value) {
    return REQUEST_CTA_HELPER_TEXT
  }
  if (showDirectBookingRequestFallback.value) {
    return NO_SLOTS_REQUEST_HELPER_TEXT
  }
  if (isUnsupportedBookingRole.value) {
    return 'Запит на час доступний у ролі клієнта. Натисніть кнопку, щоб переглянути доступні вікна.'
  }
  return DIRECT_BOOKING_CTA_HELPER_TEXT
})

const closingPrimaryLabel = computed(() => {
  if (!publicDirectBookingEnabled.value || showDirectBookingRequestFallback.value) return REQUEST_GENERIC_CTA_LABEL
  return CHOOSE_TIME_CTA_LABEL
})

const closingCtaSupportLine = computed(() => {
  if (introDurationLabel.value && introPriceDisplay.value) {
    return `Ознайомча сесія: ${introDurationLabel.value} · ${introPriceDisplay.value}`
  }
  if (introPriceDisplay.value) {
    return `Ознайомча сесія: ${introPriceDisplay.value}`
  }
  if (priceDisplay.value) {
    return `Консультація: ${priceDisplay.value} · ${standardSessionDurationLabel.value}`
  }
  return 'Оберіть зручний формат і час для першого знайомства.'
})

const closingSecondaryKind = computed<'sessions' | 'reviews' | 'slots' | 'contact' | 'none'>(() => {
  if (showClientSessionsCta.value) return 'sessions'
  if (showFeedbackCta.value) return 'reviews'
  if (hasPublicContactCta.value) return 'contact'
  if (publicDirectBookingEnabled.value && !showDirectBookingRequestFallback.value) return 'none'
  return 'none'
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
  const sectionDisplay = toDisplayText(sectionsFormats.value?.price_display)
  if (sectionDisplay) return sectionDisplay
  const sectionPrice = sectionsFormats.value?.price
  if (sectionPrice !== null && sectionPrice !== undefined) {
    const fromSection = formatPriceDisplay(
      sectionPrice,
      sectionsFormats.value?.price_currency || profile.value?.price_currency
    )
    if (fromSection) return fromSection
  }
  return formatPriceDisplay(profile.value?.price, profile.value?.price_currency)
})

const introPriceDisplay = computed(() => {
  const sectionDisplay = toDisplayText(sectionsFormats.value?.intro_price_display)
  if (sectionDisplay) return sectionDisplay
  const sectionPrice = sectionsFormats.value?.intro_price
  if (sectionPrice !== null && sectionPrice !== undefined) {
    const fromSection = formatPriceDisplay(
      sectionPrice,
      sectionsFormats.value?.intro_price_currency || profile.value?.intro_price_currency
    )
    if (fromSection) return fromSection
  }
  return formatPriceDisplay(profile.value?.intro_price, profile.value?.intro_price_currency)
})

const introDurationMinutes = computed(() => {
  const sectionMinutes = sectionsFormats.value?.intro_duration_minutes
  const minutes =
    typeof sectionMinutes === 'number' && Number.isFinite(sectionMinutes)
      ? sectionMinutes
      : profile.value?.intro_duration_minutes
  return typeof minutes === 'number' && Number.isFinite(minutes) && minutes > 0
    ? Math.round(minutes)
    : 0
})

const introDurationLabel = computed(() => {
  const sectionLabel = toDisplayText(sectionsFormats.value?.intro_duration_label)
  if (sectionLabel) return sectionLabel
  if (!introDurationMinutes.value) return ''
  return `${introDurationMinutes.value} хв`
})

const coupleOfferEnabled = computed(() => {
  const sectionEnabled = sectionsFormats.value?.couple_session_enabled
  if (typeof sectionEnabled === 'boolean') return sectionEnabled
  return profile.value?.couple_session_enabled === true
})

const coupleDurationMinutes = computed(() => {
  const sectionMinutes = sectionsFormats.value?.couple_session_duration_minutes
  const minutes =
    typeof sectionMinutes === 'number' && Number.isFinite(sectionMinutes)
      ? sectionMinutes
      : profile.value?.couple_session_duration_minutes
  return typeof minutes === 'number' && Number.isFinite(minutes) && minutes > 0
    ? Math.round(minutes)
    : 0
})

const coupleDurationLabel = computed(() => {
  if (!coupleOfferEnabled.value || !coupleDurationMinutes.value) return ''
  return `${coupleDurationMinutes.value} хв`
})

const couplePriceDisplay = computed(() => {
  if (!coupleOfferEnabled.value || !coupleDurationMinutes.value) return ''
  const sectionPrice = sectionsFormats.value?.couple_session_price
  const price =
    sectionPrice !== null && sectionPrice !== undefined
      ? sectionPrice
      : profile.value?.couple_session_price
  return formatPriceDisplay(
    price,
    sectionsFormats.value?.couple_session_price_currency || profile.value?.couple_session_price_currency
  )
})

function buildOfferMeta(durationLabel: string, priceLabel: string) {
  return [durationLabel, priceLabel].filter(Boolean).join(' · ')
}

const standardOfferDurationMinutes = computed(() => {
  const sectionMinutes = sectionsFormats.value?.standard_session_duration_minutes
  const profileMinutes = profile.value?.standard_session_duration_minutes
  const minutes =
    typeof sectionMinutes === 'number' && Number.isFinite(sectionMinutes)
      ? sectionMinutes
      : profileMinutes
  return typeof minutes === 'number' && Number.isFinite(minutes) && minutes > 0
    ? Math.round(minutes)
    : standardSessionDurationMinutes.value
})

const availableGuestRequestOffers = computed<PublicConsultationOfferView[]>(() => {
  const offers: PublicConsultationOfferView[] = [
    {
      type: 'standard',
      label: CONSULTATION_OFFER_LABELS.standard,
      durationMinutes: standardOfferDurationMinutes.value,
      priceDisplay: priceDisplay.value,
      durationLabel: standardSessionDurationLabel.value,
      meta: buildOfferMeta(standardSessionDurationLabel.value, priceDisplay.value),
    },
  ]
  if (introPriceDisplay.value) {
    offers.push({
      type: 'intro',
      label: CONSULTATION_OFFER_LABELS.intro,
      durationMinutes: introDurationMinutes.value,
      priceDisplay: introPriceDisplay.value,
      durationLabel: introDurationLabel.value,
      meta: buildOfferMeta(introDurationLabel.value, introPriceDisplay.value),
    })
  }
  if (couplePriceDisplay.value && coupleDurationLabel.value) {
    offers.push({
      type: 'couple',
      label: CONSULTATION_OFFER_LABELS.couple,
      durationMinutes: coupleDurationMinutes.value,
      priceDisplay: couplePriceDisplay.value,
      durationLabel: coupleDurationLabel.value,
      meta: buildOfferMeta(coupleDurationLabel.value, couplePriceDisplay.value),
    })
  }
  return offers
})

function slotDurationMinutes(slot: PublicSlot | null) {
  if (!slot) return 0
  const start = new Date(slot.start_at).getTime()
  const end = new Date(slot.end_at).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0
  return Math.round((end - start) / 60000)
}

const selectedPublicOffer = computed(() => {
  const selected = availableGuestRequestOffers.value.find(
    (offer) => offer.type === selectedPublicOfferType.value
  )
  return selected || availableGuestRequestOffers.value[0] || null
})

function isSlotCompatibleWithOffer(slot: PublicSlot | null, offer: PublicConsultationOfferView | null) {
  if (!slot || !offer) return true
  const slotMinutes = slotDurationMinutes(slot)
  if (!slotMinutes) return false
  return slotMinutes >= offer.durationMinutes
}

function isSlotCompatibleWithSelectedPublicOffer(slot: PublicSlot | null) {
  return isSlotCompatibleWithOffer(slot, selectedPublicOffer.value)
}

const selectedGuestSlotDurationMinutes = computed(() => slotDurationMinutes(guestBookingSlot.value))

function isOfferCompatibleWithSelectedSlot(offer: PublicConsultationOfferView) {
  if (!guestBookingSlot.value) return true
  const slotMinutes = selectedGuestSlotDurationMinutes.value
  if (!slotMinutes) return false
  return offer.durationMinutes <= slotMinutes
}

const guestRequestOfferOptions = computed<PublicConsultationOfferOption[]>(() => {
  return compatibleGuestRequestOffers.value.map((offer) => ({
    ...offer,
    disabled: false,
    helperText: '',
  }))
})

const compatibleGuestRequestOffers = computed(() =>
  availableGuestRequestOffers.value.filter((offer) => isOfferCompatibleWithSelectedSlot(offer))
)

const showGuestOfferSelector = computed(
  () => availableGuestRequestOffers.value.length > 1 && !selectedPublicOfferType.value
)

const defaultGuestBookingOfferType = computed<ConsultationOfferType>(() => {
  const selected = availableGuestRequestOffers.value.find(
    (offer) => offer.type === selectedPublicOfferType.value
  )
  if (selected && isOfferCompatibleWithSelectedSlot(selected)) return selected.type
  return compatibleGuestRequestOffers.value[0]?.type || availableGuestRequestOffers.value[0]?.type || 'standard'
})

const guestOfferCompatibilityMessage = computed(() => {
  if (!guestBookingSlot.value || compatibleGuestRequestOffers.value.length > 0) return ''
  return GUEST_OFFER_DURATION_MISMATCH_MESSAGE
})

const specializationChips = computed(() => {
  if (sectionTopicChips.value.length) return sectionTopicChips.value
  return toTextList(profile.value?.specializations)
})
const displaySpecializationChips = computed(() => specializationChips.value.slice(0, 4))
const mainRequestChips = computed(() => sectionMainRequestChips.value)

const whoThisIsForText = computed(() =>
  removeDuplicatedTopicChipLine(
    normalizeMultilineText(sectionWhoThisIsForText.value || profile.value?.bio_for_whom || ''),
    mainRequestChips.value
  )
)

const whoIsNotSuitableText = computed(() => {
  const source = sectionsTopics.value as (PublicProfileTopicsSection & Record<string, unknown>) | null
  return normalizeMultilineText(
    firstFilledMultilineText(
      resolveSectionAboutField('bio_other'),
      source?.who_this_is_not_for,
      source?.who_is_not_for,
      source?.not_for_whom,
      source?.not_suitable_for,
      source?.exclusions,
      profile.value?.bio_other
    )
  )
})

function sectionAboutBodyByKeywords(keywords: string[]): string {
  if (!keywords.length || !sectionAboutSections.value.length) return ''
  const normalizedKeywords = keywords.map((keyword) => keyword.trim().toLowerCase()).filter(Boolean)
  if (!normalizedKeywords.length) return ''
  const found = sectionAboutSections.value.find((section) => {
    const body = section.body.trim().toLowerCase()
    return normalizedKeywords.some((keyword) => body.includes(keyword))
  })
  return found?.body || ''
}

const aboutNarrativeText = computed(() =>
  normalizeMultilineText(
    firstFilledMultilineText(
      resolveSectionAboutField('bio_about'),
      resolveSectionAboutField('bio'),
      sectionAboutSections.value[0]?.body,
      profile.value?.bio_about,
      profile.value?.bio,
      sectionAboutBodyByKeywords(['про мене', 'about', 'досвід'])
    )
  )
)

const workStyleText = computed(() => {
  const source = normalizeMultilineText(
    firstFilledMultilineText(
      resolveSectionAboutField('bio_work'),
      resolveSectionAboutField('bio_approach'),
      sectionAboutBodyByKeywords(['підхід', 'approach', 'метод', 'стиль', 'працюю']),
      sectionAboutSections.value[2]?.body,
      sectionAboutSections.value[1]?.body,
      profile.value?.bio_work,
      profile.value?.bio_approach
    )
  )
  if (!source) return ''
  return source === aboutNarrativeText.value ? '' : source
})

const specialistBookingTermsText = computed(() => {
  const explicitSettingText = normalizeMultilineText(profile.value?.setting_text || '')
  if (explicitSettingText) return explicitSettingText
  const uniqueRuleTexts = Array.from(
    new Set(
      activeSpecialistBookingRules.value
        .map((rule) => normalizeMultilineText(rule.text))
        .filter(Boolean)
    )
  )
  return uniqueRuleTexts.join('\n\n')
})
const specialistTermsReminderSummary = computed(() => {
  const source = specialistBookingTermsText.value.trim()
  if (!source) {
    return 'Консультація триває 50 хвилин. Скасування або перенесення можливе не пізніше ніж за 24 години до зустрічі.'
  }
  const normalized = source.replace(/\s+/g, ' ').trim()
  const firstSentence = normalized.match(/[^.!?]+[.!?]/)?.[0]?.trim() || normalized
  return firstSentence.length > 170 ? `${firstSentence.slice(0, 167).trim()}...` : firstSentence
})

const GENERAL_INFO_EXCLUDED_LABELS = new Set([
  'ознайомча сесія',
  'стандартна сесія',
  'intro session',
  'standard session',
])

function isGeneralInfoExcludedLabel(label: string): boolean {
  const normalized = label.trim().toLowerCase().replace(/\s+/g, ' ')
  return GENERAL_INFO_EXCLUDED_LABELS.has(normalized)
}

const LOCATION_INFO_LABELS = new Set([
  'локація',
  'офлайн локація',
  'location',
  'offline location',
])

function isLocationInfoLabel(label: string): boolean {
  return LOCATION_INFO_LABELS.has(label.trim().toLowerCase().replace(/\s+/g, ' '))
}

function buildFallbackTrustItems(): ProfileKeyValueItem[] {
  const items: ProfileKeyValueItem[] = []
  if (meetingFormatLabel.value) {
    items.push({ label: 'Формат зустрічей', value: meetingFormatLabel.value })
  }
  if (profile.value?.experience_years !== undefined && profile.value?.experience_years !== null) {
    items.push({ label: 'Досвід', value: formatExperience(profile.value.experience_years) })
  }
  if (languagesDisplay.value) {
    items.push({ label: 'Мови', value: languagesDisplay.value })
  }
  return items
}

function appendTrustItemIfUnique(target: ProfileKeyValueItem[], item: ProfileKeyValueItem) {
  const key = `${item.label.trim().toLowerCase()}::${item.value.trim().toLowerCase()}`
  const alreadyExists = target.some((current) => {
    const currentKey = `${current.label.trim().toLowerCase()}::${current.value.trim().toLowerCase()}`
    return currentKey === key
  })
  if (!alreadyExists) {
    target.push(item)
  }
}

const trustItems = computed<ProfileKeyValueItem[]>(() => {
  const items: ProfileKeyValueItem[] = []
  const sectionLocation = sectionTrustItems.value.find((item) => isLocationInfoLabel(item.label))?.value || ''
  sectionTrustItems.value
    .filter((item) => !isLocationInfoLabel(item.label))
    .forEach((item) => appendTrustItemIfUnique(items, item))
  buildFallbackTrustItems().forEach((item) => appendTrustItemIfUnique(items, item))
  const location = profileLocationDisplay.value || offlineMeetingLocation.value || sectionLocation
  if (location) {
    appendTrustItemIfUnique(items, { label: 'Локація', value: location })
  }
  return items.filter((item) => !isGeneralInfoExcludedLabel(item.label))
})

const publicDocuments = computed<PublicSpecialistProfileDocument[]>(() => {
  const sectionTrust = sectionsTrust.value as PublicProfileTrustSectionData | null
  const sectionDocuments = sectionTrust?.profile_documents
  const documents = Array.isArray(sectionDocuments)
    ? sectionDocuments
    : profile.value?.profile_documents || []
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

const CONTACT_CHANNEL_LABELS: Record<string, string> = {
  EMAIL: 'Email',
  TELEGRAM: 'Telegram',
  VIBER: 'Viber',
  WHATSAPP: 'WhatsApp',
  PHONE: 'Телефон',
}

const CONTACT_CHOOSER_COPY = {
  ctaLabel: 'Зв’язатися зі спеціалістом',
  title: 'Оберіть канал зв’язку',
  helperText: 'Оберіть зручний канал: це не підтверджена сесія, а прямий контакт для першого діалогу.',
  channelActionButtonLabel: 'Скопіювати',
  channelActionCopiedLabel: 'Скопійовано',
  closeButtonLabel: 'Закрити',
  emptyStateText: 'Публічні канали зв’язку поки недоступні.',
}

const CONTACT_FALLBACK_COPY = {
  title: 'Застосунок не відкрився?',
  helperText: 'Скопіюйте контакт і продовжіть вручну.',
  copyButtonLabel: 'Скопіювати контакт',
  retryButtonLabel: 'Спробувати ще раз',
  closeButtonLabel: 'Закрити',
  copySuccessText: 'Контакт скопійовано.',
  copyErrorText: 'Не вдалося скопіювати контакт.',
}

const CONTACT_ACTION_ALLOWED_SCHEMES = new Set(['http', 'https', 'mailto', 'tel', 'viber', 'whatsapp', 'tg'])
const CONTACT_ACTION_FALLBACK_CHANNELS = new Set(['EMAIL', 'PHONE', 'TELEGRAM', 'VIBER', 'WHATSAPP'])
const CONTACT_ACTION_FALLBACK_SCHEMES = new Set(['mailto', 'tel', 'viber', 'whatsapp', 'tg'])
const CONTACT_ACTION_FALLBACK_DELAY_MS = 900

const CONTACT_ACTION_FALLBACK_HINTS: Record<string, string> = {
  EMAIL:
    'Відкрийте пошту вручну, вставте email у одержувача і надішліть лист.',
  PHONE:
    'Відкрийте застосунок телефону, вставте номер і зателефонуйте вручну.',
  TELEGRAM:
    'Відкрийте Telegram вручну, вставте контакт у пошук і почніть діалог.',
  VIBER:
    'Відкрийте Viber вручну, вставте номер у пошук і почніть чат.',
  WHATSAPP:
    'Відкрийте WhatsApp вручну, вставте номер у пошук і почніть чат.',
}

function sanitizeContactActionValue(value: string | null | undefined): string {
  return String(value || '').trim()
}

function normalizeContactActionUrl(url: string | null | undefined): string {
  return String(url || '').trim()
}

function resolveContactActionScheme(url: string): string {
  const schemeMatch = url.match(/^([a-z][a-z0-9+.-]*):/i)
  if (!schemeMatch) return ''
  return String(schemeMatch[1] || '').toLowerCase()
}

function isAllowedContactActionUrl(url: string): boolean {
  const scheme = resolveContactActionScheme(url)
  if (!scheme) return false
  return CONTACT_ACTION_ALLOWED_SCHEMES.has(scheme)
}

function resolveContactActionChannelLabel(action: PublicContactAction): string {
  const safeLabel = String(action.label || '').trim()
  if (safeLabel) return safeLabel
  const channel = String(action.channel || '').trim().toUpperCase()
  return CONTACT_CHANNEL_LABELS[channel] || 'Контактний канал'
}

function normalizePublicContactAction(
  action: PublicContactAction | null | undefined,
  index: number
): PublicContactActionViewModel | null {
  if (!action) return null
  const actionUrl = normalizeContactActionUrl(action.action_url)
  if (!actionUrl || !isAllowedContactActionUrl(actionUrl)) return null
  const channel = String(action.channel || '').trim().toUpperCase()
  const valueText = sanitizeContactActionValue(action.value)
  const actionScheme = resolveContactActionScheme(actionUrl)
  return {
    id: `${channel || 'CONTACT'}-${index}`,
    channel: channel || 'CONTACT',
    channelLabel: resolveContactActionChannelLabel(action),
    valueText,
    actionUrl,
    actionScheme,
  }
}

function resolveSectionContactActionsSource(
  section: PublicProfileContactActionsSection | PublicContactAction[] | null | undefined
): PublicContactAction[] {
  if (Array.isArray(section)) return section
  if (!section || typeof section !== 'object') return []
  if (Array.isArray(section.items)) return section.items
  if (Array.isArray(section.actions)) return section.actions
  return []
}

const contactActions = computed<PublicContactActionViewModel[]>(() => {
  const sectionSource = resolveSectionContactActionsSource(sectionsContactActions.value)
  const source =
    sectionSource.length > 0
      ? sectionSource
      : Array.isArray(profile.value?.contact_actions)
        ? profile.value?.contact_actions
        : []
  if (!Array.isArray(source) || source.length === 0) return []
  return source
    .map((action, index) => normalizePublicContactAction(action, index))
    .filter((action): action is PublicContactActionViewModel => Boolean(action))
})

const displayReviews = computed<PublicReviewView[]>(() => {
  const sectionItems = resolveSectionReviewItems()
  if (sectionsReviews.value && typeof sectionsReviews.value === 'object') {
    return sectionItems
  }
  return reviews.value.map((item, index) => ({
    id: String(item.id ?? index),
    review_text: toDisplayText(item.review_text),
    created_at: toDisplayText(item.created_at),
  }))
})

const faqItems = computed<PublicFaqItemView[]>(() => resolveSectionFaqItems())
const mediaItems = computed<PublicMediaItemView[]>(() => resolveSectionMediaItems())

const showDirectContactActions = computed(() => Boolean(contactActions.value.length && !isClient.value))
const hasPublicContactCta = computed(
  () => !canMessageSpecialist.value && !showInquiryEntry.value && contactActions.value.length > 0
)

function decodeContactActionValue(value: string): string {
  const normalized = String(value || '').replace(/\+/g, '%20')
  try {
    return decodeURIComponent(normalized)
  } catch {
    return value
  }
}

function extractContactActionUrlSearchParams(url: string): URLSearchParams {
  try {
    return new URL(url).searchParams
  } catch {
    const queryIndex = url.indexOf('?')
    if (queryIndex < 0) return new URLSearchParams()
    return new URLSearchParams(url.slice(queryIndex + 1))
  }
}

function normalizeTelegramValue(value: string): string {
  const normalized = sanitizeContactActionValue(value)
  if (!normalized) return ''
  if (normalized.startsWith('@') || normalized.startsWith('+')) return normalized
  return `@${normalized}`
}

function extractContactFallbackValueFromUrl(action: PublicContactActionViewModel): string {
  const safeUrl = normalizeContactActionUrl(action.actionUrl)
  if (!safeUrl) return ''
  const scheme = action.actionScheme
  if (scheme === 'mailto') {
    const raw = safeUrl.replace(/^mailto:/i, '').split('?')[0] || ''
    return sanitizeContactActionValue(decodeContactActionValue(raw))
  }
  if (scheme === 'tel') {
    const raw = safeUrl.replace(/^tel:/i, '').split('?')[0] || ''
    return sanitizeContactActionValue(decodeContactActionValue(raw))
  }

  const params = extractContactActionUrlSearchParams(safeUrl)
  const numberLike =
    params.get('number') ||
    params.get('phone') ||
    params.get('chatURI') ||
    params.get('chat_uri') ||
    ''
  if (numberLike) {
    return sanitizeContactActionValue(decodeContactActionValue(numberLike))
  }

  const telegramDomain = params.get('domain') || params.get('username') || ''
  if (telegramDomain) {
    return normalizeTelegramValue(decodeContactActionValue(telegramDomain))
  }

  const telegramMatch = safeUrl.match(/^https?:\/\/(?:www\.)?t\.me\/([^/?#]+)/i)
  if (telegramMatch?.[1]) {
    return normalizeTelegramValue(decodeContactActionValue(telegramMatch[1]))
  }

  const whatsappMatch = safeUrl.match(/^https?:\/\/(?:www\.)?wa\.me\/([^/?#]+)/i)
  if (whatsappMatch?.[1]) {
    return sanitizeContactActionValue(decodeContactActionValue(whatsappMatch[1]))
  }

  return ''
}

function resolveContactFallbackValue(action: PublicContactActionViewModel): string {
  if (action.valueText) {
    return action.channel === 'TELEGRAM'
      ? normalizeTelegramValue(action.valueText)
      : sanitizeContactActionValue(action.valueText)
  }
  const valueFromUrl = extractContactFallbackValueFromUrl(action)
  if (valueFromUrl) return valueFromUrl
  return action.actionUrl
}

function resolveContactFallbackHint(action: PublicContactActionViewModel): string {
  return (
    CONTACT_ACTION_FALLBACK_HINTS[action.channel] ||
    'Відкрийте канал вручну і вставте контакт для продовження спілкування.'
  )
}

const GUEST_CONTACT_CHANNEL_OPTIONS: Array<{ value: GuestContactChannel; label: string }> = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Телефон' },
  { value: 'telegram', label: 'Telegram' },
]

function isGuestRequestTopicSelected(topic: GuestRequestTopicOption) {
  return selectedGuestRequestTopics.value.includes(topic)
}

function isGuestRequestTopicDisabled(topic: GuestRequestTopicOption) {
  return guestBookingSubmitting.value || (guestRequestTopicLimitReached.value && !isGuestRequestTopicSelected(topic))
}

function toggleGuestRequestTopic(topic: GuestRequestTopicOption) {
  if (guestBookingSubmitting.value) return
  if (isGuestRequestTopicSelected(topic)) {
    selectedGuestRequestTopics.value = selectedGuestRequestTopics.value.filter((item) => item !== topic)
    return
  }
  if (guestRequestTopicLimitReached.value) return
  selectedGuestRequestTopics.value = [...selectedGuestRequestTopics.value, topic]
}

const GUEST_BOOKING_UNAVAILABLE_CODES = new Set([
  'SLOT_NOT_FOUND',
  'SLOT_ALREADY_BOOKED',
  'SLOT_LOCKED_BOOKED',
  'SLOT_IN_PAST',
])

const CLIENT_BOOKING_UNAVAILABLE_CODES = new Set([
  'SLOT_NOT_FOUND',
  'SLOT_ALREADY_BOOKED',
  'SLOT_LOCKED_BOOKED',
  'SLOT_IN_PAST',
])

const SLOT_UNAVAILABLE_MESSAGE = 'Обраний слот уже недоступний. Будь ласка, виберіть інший час.'

const GUEST_BOOKING_RESTRICTED_CODES = new Set([
  'OVER_LIMIT',
  'ACTIVE_CLIENT_LIMIT_REACHED',
  'BILLING_RESTRICTED',
  'BILLING_GRACE',
  'SUSPENDED',
  'GUEST_BOOKING_DISABLED',
  'GUEST_BOOKING_RESTRICTED',
  'ENTITLEMENT_RESTRICTED',
])

const GUEST_BOOKING_DUPLICATE_OR_SPAM_CODES = new Set([
  'REQUEST_ALREADY_EXISTS',
  'REQUEST_ALREADY_PENDING',
  'DUPLICATE_REQUEST',
  'SPAM_GUARD',
  'RATE_LIMITED',
  'TOO_MANY_REQUESTS',
])

const guestContactValuePlaceholder = computed(() => {
  switch (guestBookingForm.value.contact_channel) {
    case 'phone':
      return '+380...'
    case 'telegram':
      return '@username'
    default:
      return 'name@example.com'
  }
})

const selectedGuestSlotSummary = computed(() => {
  const slot = guestBookingSlot.value
  if (!slot) return ''
  return formatDate(slot.start_at)
})

const clientBookingConfirmSlot = computed(() => {
  const slotId = clientBookingConfirmSlotId.value
  if (typeof slotId !== 'number') return null
  return slots.value.find((slot) => slot.id === slotId) || null
})

const clientBookingConfirmDate = computed(() => {
  const slot = clientBookingConfirmSlot.value
  if (!slot) return ''
  return formatUkDateLong(slot.start_at, '')
})

const clientBookingConfirmTime = computed(() => {
  const slot = clientBookingConfirmSlot.value
  if (!slot) return ''
  const startTime = formatUkTime(slot.start_at, '')
  const endTime = formatUkTime(slot.end_at, '')
  if (!startTime || !endTime) return startTime || endTime
  return `${startTime} - ${endTime}`
})

const clientBookingConfirmDuration = computed(() => {
  const slot = clientBookingConfirmSlot.value
  if (!slot) return ''
  return formatDurationPlain(slot.start_at, slot.end_at)
})

const clientBookingConfirmFormat = computed(() => {
  return sessionFormatLabelForBooking.value || 'Не вдалося визначити'
})

const clientBookingConfirmCloseDisabled = computed(() => bookingSlotId.value !== null)

const clientBookingConfirmSubmitDisabled = computed(() => {
  const slot = clientBookingConfirmSlot.value
  if (!slot) return true
  return bookingRulesAccepting.value || bookingSlotId.value === slot.id
})

const clientBookingConfirmSubmitLabel = computed(() => {
  const slot = clientBookingConfirmSlot.value
  if (slot && bookingSlotId.value === slot.id) return 'Надсилаємо запит...'
  if (bookingRulesAccepting.value) return 'Підтверджуємо правила...'
  return 'Надіслати запит на цей час'
})

const isGuestBookingSlotRequest = computed(() => Boolean(guestBookingSuccess.value && guestBookingSlot.value))
const guestBookingSuccessTitle = computed(() =>
  isGuestBookingSlotRequest.value ? GUEST_BOOKING_SLOT_SUCCESS_TITLE : GUEST_BOOKING_GENERIC_SUCCESS_TITLE
)
const guestBookingSuccessText = computed(() =>
  isGuestBookingSlotRequest.value ? GUEST_BOOKING_SLOT_SUCCESS_TEXT : GUEST_BOOKING_GENERIC_SUCCESS_TEXT
)
const guestBookingRequestSummaryCopy = computed(() => {
  if (!guestBookingSuccess.value) return ''
  return isGuestBookingSlotRequest.value ? GUEST_BOOKING_SLOT_NEXT_STEP_COPY : GUEST_BOOKING_GENERIC_NEXT_STEP_COPY
})

function shouldShowContactActionFallback(action: PublicContactActionViewModel): boolean {
  if (CONTACT_ACTION_FALLBACK_CHANNELS.has(action.channel)) return true
  return CONTACT_ACTION_FALLBACK_SCHEMES.has(action.actionScheme)
}

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
  if (inquiryState.value?.can_create_inquiry) return 'Надіслати питання'
  return 'Надіслати уточнення'
})

const inquiryClarityCard = computed<{ title: string; body: string } | null>(() => {
  if (!showInquiryComposer.value) return null
  if (inquiryState.value?.can_create_inquiry) {
    return {
      title: 'Почніть без тиску',
      body: 'Коротке питання не фіксує слот і не потребує оплати. Можна спокійно уточнити деталі перед рішенням.',
    }
  }
  return {
    title: 'Уточнення перед рішенням',
    body: 'Додавайте короткі уточнення по черзі. Після відповіді спеціаліста оберете, чи надсилати запит на час.',
  }
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

const standardSessionDurationLabel = computed(() => {
  const sectionLabel = toDisplayText(sectionsFormats.value?.standard_session_duration_label)
  if (sectionLabel) return sectionLabel
  const sectionMinutes = sectionsFormats.value?.standard_session_duration_minutes
  if (typeof sectionMinutes === 'number' && Number.isFinite(sectionMinutes) && sectionMinutes > 0) {
    return `${Math.round(sectionMinutes)} хв`
  }
  return `${standardSessionDurationMinutes.value} хв`
})

function formatDate(value: string) {
  return formatUkDateTimeCompact(value, value)
}

function formatSlotTime(value: string) {
  return formatUkTime(value)
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

function formatDurationPlain(start: string, end: string) {
  return formatDuration(start, end).replace(/^\u0422\u0440\u0438\u0432\u0430\u043b\u0456\u0441\u0442\u044c:\s*/, '').trim()
}

function parseLocalDateValue(value: string) {
  const parts = value.split('-').map((part) => Number(part))
  const yearRaw = parts[0]
  const monthRaw = parts[1]
  const dayRaw = parts[2]
  const year = Number.isFinite(yearRaw) ? yearRaw : new Date().getFullYear()
  const month = Number.isFinite(monthRaw) ? Number(monthRaw) - 1 : new Date().getMonth()
  const day = Number.isFinite(dayRaw) ? dayRaw : 1
  return new Date(Number(year), month, Number(day))
}

function toLocalMonthStart(value: Date | string) {
  const date = value instanceof Date ? value : parseLocalDateValue(value)
  return toLocalDate(new Date(date.getFullYear(), date.getMonth(), 1))
}

function toApiMonthRange(monthStart: string) {
  const firstDay = parseLocalDateValue(monthStart)
  const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0)
  return {
    date_from: toLocalDate(firstDay),
    date_to: toLocalDate(lastDay),
  }
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)
}

function toApiBookingHorizonRange() {
  const today = new Date()
  const rawHorizonDays = Number(profile.value?.public_booking_horizon_days)
  const horizonDays = Number.isFinite(rawHorizonDays) && rawHorizonDays > 0 ? rawHorizonDays : 14
  return {
    date_from: toLocalDate(today),
    date_to: toLocalDate(addDays(today, horizonDays)),
  }
}

function addMonths(monthStart: string, amount: number) {
  const date = parseLocalDateValue(monthStart)
  return toLocalMonthStart(new Date(date.getFullYear(), date.getMonth() + amount, 1))
}

function formatCalendarMonthLabel(monthStart: string) {
  const label = new Intl.DateTimeFormat('uk-UA', {
    month: 'long',
    year: 'numeric',
  }).format(parseLocalDateValue(monthStart))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatCalendarDateLabel(date: string) {
  return new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parseLocalDateValue(date))
}

function isDateInVisibleMonth(date: string) {
  if (!date) return false
  return toLocalMonthStart(date) === visibleMonthStart.value
}

function groupSlotsByLocalDate(sourceSlots: PublicSlot[]) {
  const groups = new Map<string, PublicSlot[]>()
  for (const slot of sourceSlots) {
    const date = toLocalDate(new Date(slot.start_at))
    if (!groups.has(date)) groups.set(date, [])
    groups.get(date)!.push(slot)
  }
  for (const group of groups.values()) {
    group.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
  }
  return groups
}

function syncSelectedDateSlots() {
  slots.value = [...(slotsByLocalDate.value.get(selectedDate.value) || [])]
}

function syncSelectedDateForCurrentOffer(options: { preferFirstAvailable?: boolean } = {}) {
  const groupedSlots = slotsByLocalDate.value
  const firstAvailableDate = Array.from(groupedSlots.keys()).sort()[0] || ''
  if (
    !isDateInVisibleMonth(selectedDate.value) ||
    !groupedSlots.has(selectedDate.value) ||
    (options.preferFirstAvailable && firstAvailableDate)
  ) {
    selectedDate.value = firstAvailableDate || selectedDate.value
  }
  syncSelectedDateSlots()
}

function selectCalendarDay(date: string) {
  if (!slotsByLocalDate.value.has(date)) return
  selectedDate.value = date
  showAllSlots.value = false
  syncSelectedDateSlots()
}

async function changeVisibleMonth(amount: number) {
  visibleMonthStart.value = addMonths(visibleMonthStart.value, amount)
  showAllSlots.value = false
  await loadSlots({ preferFirstAvailable: true })
}

function scrollToSlots() {
  window.location.hash = '#slots'
  focusSlotsSection()
}

function scrollToInquiry() {
  window.location.hash = '#inquiry'
  focusInquirySection()
}

function focusInquirySection() {
  document.getElementById('inquiry')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function focusSlotsSection() {
  document.getElementById('slots')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function openProfileVideoModal() {
  if (!profileVideoUrl.value) return
  showProfileVideoModal.value = true
}

function closeProfileVideoModal() {
  showProfileVideoModal.value = false
}

function openAboutModal() {
  if (!aboutNarrativeText.value) return
  showAboutModal.value = true
}

function closeAboutModal() {
  showAboutModal.value = false
}

function openClientChat() {
  if (!profile.value?.therapist_id) return
  router.push({
    name: 'client-chat',
    query: { therapist_id: String(profile.value.therapist_id) },
  })
}

function clearContactActionFallbackTimer() {
  if (contactActionFallbackTimer === null) return
  window.clearTimeout(contactActionFallbackTimer)
  contactActionFallbackTimer = null
}

function closeContactActionFallbackModal() {
  contactActionFallback.value = null
  clearContactActionFallbackTimer()
}

function scheduleContactActionFallback(action: PublicContactActionViewModel) {
  if (!shouldShowContactActionFallback(action)) return
  clearContactActionFallbackTimer()
  contactActionFallbackTimer = window.setTimeout(() => {
    contactActionFallbackTimer = null
    const valueText = resolveContactFallbackValue(action)
    contactActionFallback.value = {
      channelLabel: action.channelLabel,
      valueText,
      copyValue: valueText,
      manualHint: resolveContactFallbackHint(action),
      actionUrl: action.actionUrl,
    }
  }, CONTACT_ACTION_FALLBACK_DELAY_MS)
}

function openContactActionUrl(url: string): boolean {
  const safeUrl = normalizeContactActionUrl(url)
  if (!safeUrl || !isAllowedContactActionUrl(safeUrl)) return false
  window.open(safeUrl, '_blank', 'noopener,noreferrer')
  return true
}

function openContactAction(item: PublicContactActionViewModel, options?: { scheduleFallback?: boolean }) {
  closeContactActionFallbackModal()
  const opened = openContactActionUrl(item.actionUrl)
  if (!opened) return
  if (options?.scheduleFallback === false) return
  scheduleContactActionFallback(item)
}

function closeContactChooserModal() {
  showContactChooserModal.value = false
}

async function copyPublicContactValue(item: PublicContactActionViewModel) {
  const value = resolveContactFallbackValue(item)
  if (!value) return
  try {
    await navigator.clipboard.writeText(value)
    copiedContactId.value = item.id
    if (copiedContactTimer !== null) {
      window.clearTimeout(copiedContactTimer)
    }
    copiedContactTimer = window.setTimeout(() => {
      copiedContactId.value = ''
      copiedContactTimer = null
    }, 1800)
    toast.success('Контакт скопійовано.')
  } catch {
    toast.error('Не вдалося скопіювати контакт.')
  }
}

async function handleContactChooserAction(item: PublicContactActionViewModel) {
  await copyPublicContactValue(item)
}

function openPublicContactCta() {
  if (!hasPublicContactCta.value) return
  if (contactActions.value.length === 1) {
    openContactAction(contactActions.value[0]!)
    return
  }
  showContactChooserModal.value = true
}

async function copyContactActionFallbackValue() {
  const fallback = contactActionFallback.value
  if (!fallback?.copyValue) return
  try {
    await navigator.clipboard.writeText(fallback.copyValue)
    toast.success(CONTACT_FALLBACK_COPY.copySuccessText)
  } catch {
    toast.error(CONTACT_FALLBACK_COPY.copyErrorText)
  }
}

function retryContactActionFallback() {
  const fallback = contactActionFallback.value
  if (!fallback) return
  closeContactActionFallbackModal()
  openContactActionUrl(fallback.actionUrl)
}

function handleHeroPrimaryAction() {
  if (!publicDirectBookingEnabled.value || showDirectBookingRequestFallback.value) {
    openGuestBookingModal()
    return
  }
  scrollToSlots()
}

function handleClosingPrimaryAction() {
  if (!publicDirectBookingEnabled.value || showDirectBookingRequestFallback.value) {
    openGuestBookingModal()
    return
  }
  if (hasPublicContactCta.value) {
    openPublicContactCta()
    return
  }
  scrollToSlots()
}

function handlePublicRequestAction() {
  openGuestBookingModal()
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
  ownerUnpublishedProfile.value = false
  try {
    profile.value = await fetchPublicSpecialistProfile(slug.value)
    if (profile.value) {
      saveViewedSpecialist(profile.value)
    }
  } catch (err: any) {
    const status = Number((err as { response?: { status?: number } })?.response?.status || 0)
    if (status === 404) {
      const hasOwnerRole = (auth.me?.user.roles || auth.user?.roles || []).some((role) =>
        ['SPECIALIST', 'THERAPIST'].includes(String(role).toUpperCase())
      )
      if (auth.accessToken && hasOwnerRole) {
        try {
          const ownProfile = await fetchSpecialistProfile()
          const ownProfileSlug = String(ownProfile?.slug || ownProfile?.public_slug || '').trim()
          if (ownProfileSlug === slug.value && ownProfile?.public_profile_enabled === false) {
            ownerUnpublishedProfile.value = true
            profile.value = null
            error.value = ''
            return
          }
        } catch {
          // keep generic public error branch
        }
      }
    }
    error.value = getApiErrorMessage(err, '\u041f\u0440\u043e\u0444\u0456\u043b\u044c \u043d\u0435 \u0437\u043d\u0430\u0439\u0434\u0435\u043d\u043e.')
  } finally {
    loading.value = false
  }
}

async function loadSlots(options: { preferFirstAvailable?: boolean; forceRefresh?: boolean } = {}) {
  if (!profile.value?.therapist_id) return
  if (!publicDirectBookingEnabled.value) {
    slots.value = []
    monthSlots.value = []
    slotsError.value = ''
    slotsLoading.value = false
    slotsLoaded.value = true
    monthSlotsCache.clear()
    return
  }
  slotsLoaded.value = false
  slotsLoading.value = true
  slotsError.value = ''
  try {
    const currentMonth = visibleMonthStart.value
    const cachedSlots = options.forceRefresh ? undefined : monthSlotsCache.get(currentMonth)
    const nextMonthSlots = cachedSlots || await (async () => {
      const monthRange = toApiMonthRange(currentMonth)
      const resp = await apiGet<PublicSlot[]>('/booking/slots/', {
        params: {
          therapist_id: profile.value!.therapist_id,
          date_from: monthRange.date_from,
          date_to: monthRange.date_to,
        },
      })
      if (!Array.isArray(resp)) {
        throw new Error('Unexpected slots response')
      }
      monthSlotsCache.set(currentMonth, resp)
      return resp
    })()

    monthSlots.value = nextMonthSlots
    syncSelectedDateForCurrentOffer({ preferFirstAvailable: options.preferFirstAvailable })
  } catch {
    monthSlots.value = []
    slots.value = []
    slotsError.value = 'Не вдалося завантажити доступні слоти. Спробуйте ще раз.'
  } finally {
    slotsLoading.value = false
    slotsLoaded.value = true
  }
}

async function loadHorizonSlots() {
  if (!profile.value?.therapist_id || !publicDirectBookingEnabled.value) {
    horizonSlots.value = []
    horizonSlotsLoading.value = false
    horizonSlotsLoaded.value = true
    return
  }

  horizonSlotsLoading.value = true
  horizonSlotsLoaded.value = false
  try {
    const horizonRange = toApiBookingHorizonRange()
    const resp = await apiGet<PublicSlot[]>('/booking/slots/', {
      params: {
        therapist_id: profile.value.therapist_id,
        date_from: horizonRange.date_from,
        date_to: horizonRange.date_to,
      },
    })
    horizonSlots.value = Array.isArray(resp) ? resp : []
    if (!didAutoShiftToFirstAvailableMonth.value && horizonSlots.value.length > 0) {
      didAutoShiftToFirstAvailableMonth.value = true
      const firstMonth = toLocalMonthStart(new Date(horizonSlots.value[0]!.start_at))
      if (firstMonth !== visibleMonthStart.value) {
        visibleMonthStart.value = firstMonth
        selectedDate.value = toLocalDate(new Date(horizonSlots.value[0]!.start_at))
        showAllSlots.value = false
      }
    }
  } catch {
    horizonSlots.value = []
  } finally {
    horizonSlotsLoading.value = false
    horizonSlotsLoaded.value = true
  }
}

function formatExperience(value: number) {
  if (value === 0) return 'до року'
  if (value === 1) return '1 рік'
  if (value >= 2 && value <= 4) return `${value} роки`
  return `${value} років`
}

function normalizeJournalEmptyStateCode(
  value: PublicProfilePublicationsPreviewEmptyState | undefined
): JournalCanonicalEmptyStateCode | null {
  if (value === 'JOURNAL_DISABLED' || value === 'NO_PUBLICATIONS') return value
  return null
}

function mapLegacyJournalPost(post: PublicAuthorJournalPost): JournalPreviewPost {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    summary: post.summary || '',
    cover_image_url: post.cover_image_url || '',
    is_featured: post.is_featured,
    featured_order: post.featured_order,
    published_at: post.published_at || null,
    created_at: post.created_at || null,
    category: post.category || null,
    reading_time_minutes: null,
  }
}

function mapCanonicalJournalPost(item: PublicProfilePublicationsPreviewItem): JournalPreviewPost {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    summary: item.excerpt || '',
    cover_image_url: item.cover_image_url || '',
    is_featured: Boolean(item.is_featured),
    published_at: item.published_at || null,
    created_at: item.published_at || null,
    category: item.category || null,
    reading_time_minutes:
      typeof item.reading_time_minutes === 'number' ? item.reading_time_minutes : null,
  }
}

function resolveCanonicalPublicationsPreview() {
  const preview = profile.value?.sections?.publications_preview
  if (!preview || typeof preview !== 'object') return null
  return preview
}

async function loadJournal() {
  if (!slug.value) return
  journalLoading.value = true
  journalError.value = ''
  try {
    const canonicalPreview = resolveCanonicalPublicationsPreview()
    if (canonicalPreview) {
      const previewItems = Array.isArray(canonicalPreview.items) ? canonicalPreview.items : []
      journalPosts.value = previewItems.map(mapCanonicalJournalPost)
      journalCollections.value = []
      journalEmptyStateCode.value =
        journalPosts.value.length > 0
          ? null
          : normalizeJournalEmptyStateCode(canonicalPreview.empty_state)
      return
    }

    const [posts, collections] = await Promise.all([
      fetchPublicAuthorJournalPosts(slug.value),
      fetchPublicJournalCollections(slug.value),
    ])
    journalPosts.value = posts.map(mapLegacyJournalPost)
    journalCollections.value = collections
    journalEmptyStateCode.value = null
  } catch {
    journalPosts.value = []
    journalCollections.value = []
    journalEmptyStateCode.value = null
    journalError.value = 'Не вдалося завантажити авторський блог.'
  } finally {
    journalLoading.value = false
  }
}

async function loadReviews() {
  if (!slug.value) return
  if (sectionsReviews.value && typeof sectionsReviews.value === 'object') {
    reviews.value = []
    return
  }
  try {
    const resp = await apiGet<PublicReview[]>(`/public/specialists/${slug.value}/reviews/`, {
      params: { limit: 4 },
    })
    reviews.value = resp || []
  } catch {
    reviews.value = []
  }
}

function postCategory(post: JournalPreviewPost): Exclude<JournalCategory, 'ALL'> | null {
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

function readingTime(text: string | null | undefined, fixedMinutes?: number | null): number {
  if (typeof fixedMinutes === 'number' && Number.isFinite(fixedMinutes)) {
    return Math.max(1, Math.round(fixedMinutes))
  }
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

function setActiveJournalCategory(category: JournalCategory) {
  activeCategory.value = category
}

const featuredPost = computed(() => filteredJournalPosts.value.find((p) => p.is_featured) || null)

function navigateToPost(post: JournalPreviewPost) {
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
    inquiryError.value = getInquiryActionErrorMessage(err, 'client', 'Не вдалося завантажити запит перед сесією.')
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
      'Не вдалося надіслати запит перед сесією.'
    )
  } finally {
    inquirySubmitting.value = false
  }
}

function resetGuestBookingForm() {
  guestBookingForm.value = {
    guest_name: '',
    contact_channel: 'email',
    contact_value: '',
    offer_type: defaultGuestBookingOfferType.value,
    message: '',
  }
  selectedGuestRequestTopics.value = []
}

function selectPublicOffer(offerType: ConsultationOfferType) {
  const offer = availableGuestRequestOffers.value.find((item) => item.type === offerType)
  if (!offer) return
  selectedPublicOfferType.value = offerType
  showAllSlots.value = false
  syncSelectedDateForCurrentOffer({ preferFirstAvailable: true })
  ensureGuestBookingOfferCompatibility()
}

function selectGuestBookingOffer(offerType: ConsultationOfferType) {
  const offer = availableGuestRequestOffers.value.find((item) => item.type === offerType)
  if (!offer || !isOfferCompatibleWithSelectedSlot(offer)) return
  selectedPublicOfferType.value = offerType
  guestBookingForm.value.offer_type = offerType
}

function resolveGuestBookingOfferType() {
  const selectedOfferType = guestBookingForm.value.offer_type
  const selectedOffer = availableGuestRequestOffers.value.find((offer) => offer.type === selectedOfferType)
  if (selectedOffer && isOfferCompatibleWithSelectedSlot(selectedOffer)) {
    return selectedOfferType
  }
  return defaultGuestBookingOfferType.value
}

function ensureGuestBookingOfferCompatibility() {
  const selectedOffer = availableGuestRequestOffers.value.find(
    (offer) => offer.type === guestBookingForm.value.offer_type
  )
  if (selectedOffer && isOfferCompatibleWithSelectedSlot(selectedOffer)) return
  guestBookingForm.value.offer_type = defaultGuestBookingOfferType.value
}

function resetGuestBookingFieldErrors() {
  guestBookingFieldErrors.value = {
    guest_name: '',
    contact_value: '',
  }
}

function clearGuestBookingFieldError(field: 'guest_name' | 'contact_value') {
  if (!guestBookingFieldErrors.value[field]) return
  guestBookingFieldErrors.value = {
    ...guestBookingFieldErrors.value,
    [field]: '',
  }
}

function guestBookingRequiredFieldMessage(field: 'guest_name' | 'contact_value') {
  switch (field) {
    case 'guest_name':
      return 'Вкажіть ім’я.'
    case 'contact_value':
      return 'Вкажіть контакт для відповіді.'
    default:
      return 'Заповніть це поле.'
  }
}

function closeGuestBookingModal() {
  showGuestBookingModal.value = false
  guestBookingSlot.value = null
  guestBookingError.value = ''
  guestBookingSuccess.value = null
  guestBookingSubmitting.value = false
  guestBookingSubmitSlotId.value = null
  guestBookingRulesAccepted.value = false
  resetGuestBookingFieldErrors()
  resetGuestBookingForm()
}

function openGuestBookingModal(slotId?: number) {
  const selectedSlot =
    typeof slotId === 'number'
      ? slots.value.find((slot) => slot.id === slotId) || null
      : null
  if (typeof slotId === 'number' && !selectedSlot) {
    bookingError.value = SLOT_UNAVAILABLE_MESSAGE
    return
  }
  bookingError.value = ''
  bookingSuccess.value = ''
  guestBookingSlot.value = selectedSlot
  guestBookingError.value = ''
  guestBookingSuccess.value = null
  guestBookingSubmitSlotId.value = selectedSlot?.id || null
  guestBookingRulesAccepted.value = false
  resetGuestBookingFieldErrors()
  resetGuestBookingForm()
  showGuestBookingModal.value = true
}

function resetClientBookingConfirmModalState() {
  showClientBookingConfirmModal.value = false
  clientBookingConfirmSlotId.value = null
}

function closeClientBookingConfirmModal() {
  if (bookingSlotId.value !== null) return
  resetClientBookingConfirmModalState()
}

function openClientBookingConfirmModal(slotId: number) {
  const selectedSlot = slots.value.find((slot) => slot.id === slotId) || null
  if (!selectedSlot) {
    bookingError.value = SLOT_UNAVAILABLE_MESSAGE
    return
  }
  bookingError.value = ''
  bookingSuccess.value = ''
  clientBookingConfirmSlotId.value = slotId
  showClientBookingConfirmModal.value = true
}

function isClientBookingUnavailableError(err: unknown): boolean {
  const status = Number((err as { response?: { status?: unknown } })?.response?.status || 0)
  const code = String(getBookingErrorCode(err) || '').trim().toUpperCase()
  const reasonCode = String(getBookingErrorReasonCode(err) || '').trim().toUpperCase()

  return (
    status === 409 ||
    CLIENT_BOOKING_UNAVAILABLE_CODES.has(code) ||
    CLIENT_BOOKING_UNAVAILABLE_CODES.has(reasonCode)
  )
}

function getGuestBookingErrorCode(err: unknown): string {
  const code = (err as { response?: { data?: { code?: unknown } } })?.response?.data?.code
  return typeof code === 'string' ? code.trim().toUpperCase() : ''
}

function getGuestBookingReasonCode(err: unknown): string {
  const reasonCode = (err as { response?: { data?: { reason_code?: unknown } } })?.response?.data?.reason_code
  return typeof reasonCode === 'string' ? reasonCode.trim().toUpperCase() : ''
}

function hasGuestContactValidationError(err: unknown): boolean {
  const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data
  if (!data || typeof data !== 'object') return false
  return Boolean(data.contact_value || data.contact_channel || data.guest_name)
}

function extractGuestFieldErrors(err: unknown, field: string): string[] {
  const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data
  if (!data || typeof data !== 'object') return []
  const value = data[field]
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }
  return []
}

function hasInvalidGuestContactChannelChoice(err: unknown): boolean {
  return extractGuestFieldErrors(err, 'contact_channel').some((message) =>
    message.toLowerCase().includes('not a valid choice')
  )
}

function isGuestBookingUnavailableError(err: unknown): boolean {
  const code = getGuestBookingErrorCode(err)
  const reasonCode = getGuestBookingReasonCode(err)
  return GUEST_BOOKING_UNAVAILABLE_CODES.has(code) || GUEST_BOOKING_UNAVAILABLE_CODES.has(reasonCode)
}

function getGuestBookingErrorMessage(err: unknown): string {
  const status = Number((err as { response?: { status?: unknown } })?.response?.status || 0)
  const code = getGuestBookingErrorCode(err)
  const reasonCode = getGuestBookingReasonCode(err)

  if (
    code === 'PUBLIC_GUEST_REQUEST_OFFER_DURATION_MISMATCH' ||
    reasonCode === 'PUBLIC_GUEST_REQUEST_OFFER_DURATION_MISMATCH'
  ) {
    return GUEST_OFFER_DURATION_MISMATCH_MESSAGE
  }

  if (
    GUEST_BOOKING_UNAVAILABLE_CODES.has(code) ||
    GUEST_BOOKING_UNAVAILABLE_CODES.has(reasonCode)
  ) {
    return SLOT_UNAVAILABLE_MESSAGE
  }

  if (
    GUEST_BOOKING_RESTRICTED_CODES.has(code) ||
    GUEST_BOOKING_RESTRICTED_CODES.has(reasonCode)
  ) {
    return 'Наразі нові запити без реєстрації тимчасово недоступні для цього профілю.'
  }

  if (
    status === 429 ||
    GUEST_BOOKING_DUPLICATE_OR_SPAM_CODES.has(code) ||
    GUEST_BOOKING_DUPLICATE_OR_SPAM_CODES.has(reasonCode)
  ) {
    return 'Такий запит уже надіслано або ліміт звернень вичерпано. Спробуйте трохи пізніше.'
  }

  if (hasInvalidGuestContactChannelChoice(err)) {
    return 'Оберіть канал зв’язку зі списку: Email, Телефон або Telegram.'
  }

  if (hasGuestContactValidationError(err)) {
    return 'Перевірте ім’я та контакт: у формі є неточності.'
  }

  return 'Не вдалося надіслати запит. Спробуйте ще раз.'
}

async function createPublicGuestBookingRequest(
  profileSlug: string,
  payload: PublicGuestBookingRequestPayload
): Promise<PublicGuestBookingRequestResponse> {
  try {
    return await apiPost<PublicGuestBookingRequestResponse>(
      `/public/specialists/${profileSlug}/guest-booking-requests/`,
      payload
    )
  } catch (err: any) {
    const status = Number((err as { response?: { status?: unknown } })?.response?.status || 0)
    if (status !== 404 && status !== 405) {
      throw err
    }
  }

  return apiPost<PublicGuestBookingRequestResponse>(
    `/public/therapists/${profileSlug}/guest-booking-requests/`,
    payload
  )
}

async function submitGuestBookingRequest() {
  const slot = guestBookingSlot.value
  const profileSlug = String(profile.value?.public_slug || profile.value?.slug || slug.value).trim()
  if (!profileSlug) return

  const guestName = guestBookingForm.value.guest_name.trim()
  const contactChannelRaw = guestBookingForm.value.contact_channel.trim().toLowerCase()
  const contactValue = guestBookingForm.value.contact_value.trim()
  const message = guestBookingForm.value.message.trim()
  const isSupportedContactChannel = ['email', 'phone', 'telegram'].includes(contactChannelRaw)
  let firstInvalidField: HTMLInputElement | null = null

  resetGuestBookingFieldErrors()

  if (!guestName) {
    guestBookingFieldErrors.value.guest_name = guestBookingRequiredFieldMessage('guest_name')
    firstInvalidField = guestBookingNameInputRef.value
  }
  if (!contactValue) {
    guestBookingFieldErrors.value.contact_value = guestBookingRequiredFieldMessage('contact_value')
    if (!firstInvalidField) {
      firstInvalidField = guestBookingContactValueInputRef.value
    }
  }
  if (firstInvalidField) {
    guestBookingError.value = ''
    await nextTick()
    firstInvalidField.focus()
    return
  }
  if (!isSupportedContactChannel) {
    guestBookingError.value = 'Оберіть канал зв’язку зі списку: Email, Телефон або Telegram.'
    return
  }
  if (shouldShowGuestBookingRulesPrompt.value && !guestBookingRulesAccepted.value) {
    guestBookingError.value = BOOKING_UI_MESSAGES.acceptSettingBeforeBooking
    return
  }
  if (message.length > GUEST_REQUEST_MESSAGE_MAX_LENGTH) {
    guestBookingError.value = `Опис запиту має містити не більше ${GUEST_REQUEST_MESSAGE_MAX_LENGTH} символів.`
    return
  }

  const sessionFormat = resolvedSessionFormat.value
  if (!sessionFormat) {
    guestBookingError.value = 'Не вдалося визначити формат сесії. Оновіть сторінку та спробуйте ще раз.'
    return
  }
  if (guestBookingSlot.value && compatibleGuestRequestOffers.value.length === 0) {
    guestBookingError.value = GUEST_OFFER_DURATION_MISMATCH_MESSAGE
    return
  }
  const offerType = resolveGuestBookingOfferType()
  const selectedOffer = availableGuestRequestOffers.value.find((offer) => offer.type === offerType)
  if (guestBookingSlot.value && (!selectedOffer || !isOfferCompatibleWithSelectedSlot(selectedOffer))) {
    guestBookingError.value = GUEST_OFFER_DURATION_MISMATCH_MESSAGE
    return
  }
  const contactChannel = contactChannelRaw as GuestContactChannel

  guestBookingSubmitting.value = true
  guestBookingError.value = ''
  guestBookingSubmitSlotId.value = slot?.id || null

  try {
    const payload: PublicGuestBookingRequestPayload = {
      session_format: sessionFormat,
      guest_name: guestName,
      contact_channel: contactChannel,
      contact_value: contactValue,
      request_topics: selectedGuestRequestTopics.value.filter(
        (topic): topic is PublicGuestRequestTopic => topic !== 'other'
      ),
    }
    if (slot) {
      payload.slot_id = slot.id
    }
    if (message) {
      payload.message = message
    }
    if (showGuestOfferSelector.value || selectedPublicOfferType.value || offerType !== 'standard') {
      payload.offer_type = offerType
    }
    const response = await createPublicGuestBookingRequest(profileSlug, payload)
    guestBookingSuccess.value = response.request
    toast.success(isGuestBookingSlotRequest.value ? GUEST_BOOKING_SLOT_SUCCESS_TITLE : GUEST_BOOKING_GENERIC_SUCCESS_TITLE)
  } catch (err: any) {
    guestBookingError.value = getGuestBookingErrorMessage(err)
    toast.error(guestBookingError.value)
    if (isGuestBookingUnavailableError(err)) {
      await loadSlots({ forceRefresh: true })
    }
  } finally {
    guestBookingSubmitting.value = false
    guestBookingSubmitSlotId.value = null
  }
}

function slotActionLabel(slotId: number) {
  if (bookingRulesAccepting.value) return 'Підтверджуємо правила...'
  if (bookingSlotId.value === slotId) return 'Надсилаємо запит...'
  if (guestBookingSubmitting.value && guestBookingSubmitSlotId.value === slotId) return 'Надсилаємо...'
  return 'Надіслати запит на цей час'
}

function focusBookingRulesPrompt() {
  bookingRulesPromptRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

async function confirmClientBookingRules() {
  if (!canBook.value || !profile.value?.therapist_id || bookingRulesAccepting.value) return
  bookingError.value = ''
  bookingSuccess.value = ''
  bookingRulesAccepting.value = true
  try {
    const response = await acceptBookingRules({ specialist_id: profile.value.therapist_id })
    if (profile.value) {
      profile.value = {
        ...profile.value,
        booking_rules: response.booking_rules || {
          show_prompt: false,
          reason_codes: [],
          items: [],
        },
      }
    }
    const slotIdToBook = pendingClientBookingSlotId.value
    pendingClientBookingSlotId.value = null
    if (typeof slotIdToBook === 'number') {
      await bookSlot(slotIdToBook)
    }
  } catch (err: any) {
    bookingError.value = getApiErrorMessage(err, 'Не вдалося підтвердити правила перед запитом.')
    toast.error(bookingError.value)
  } finally {
    bookingRulesAccepting.value = false
  }
}

async function confirmClientBookingFromModal() {
  if (bookingSlotId.value !== null || bookingRulesAccepting.value) return
  const selectedSlot = clientBookingConfirmSlot.value
  if (!selectedSlot) {
    bookingError.value = SLOT_UNAVAILABLE_MESSAGE
    closeClientBookingConfirmModal()
    await loadSlots({ forceRefresh: true })
    return
  }
  if (shouldShowClientBookingRulesPrompt.value) {
    pendingClientBookingSlotId.value = selectedSlot.id
    bookingError.value = BOOKING_UI_MESSAGES.acceptSettingBeforeBooking
    closeClientBookingConfirmModal()
    focusBookingRulesPrompt()
    return
  }
  const booked = await bookSlot(selectedSlot.id)
  if (booked) {
    closeClientBookingConfirmModal()
  }
}

async function handleBookingClick(slotId: number) {
  if (isGuestVisitor.value) {
    openGuestBookingModal(slotId)
    return
  }
  if (isUnsupportedBookingRole.value) {
    bookingError.value = BOOKING_UI_MESSAGES.onlyClientsCanBook
    return
  }
  if (isSlotBusy(slotId) || bookingSlotId.value !== null) return
  openClientBookingConfirmModal(slotId)
}

async function bookSlot(slotId: number): Promise<boolean> {
  bookingError.value = ''
  bookingSuccess.value = ''
  if (!canBook.value) {
    bookingError.value = BOOKING_UI_MESSAGES.onlyClientsCanBook
    return false
  }
  if (shouldShowClientBookingRulesPrompt.value) {
    pendingClientBookingSlotId.value = slotId
    bookingError.value = BOOKING_UI_MESSAGES.acceptSettingBeforeBooking
    focusBookingRulesPrompt()
    return false
  }
  if (bookingSlotId.value !== null) {
    return false
  }
  pendingClientBookingSlotId.value = null
  const bookedSlot = slots.value.find((slot) => slot.id === slotId) || null
  if (!bookedSlot) {
    bookingError.value = SLOT_UNAVAILABLE_MESSAGE
    toast.error(bookingError.value)
    await loadSlots()
    return false
  }
  bookingSlotId.value = slotId
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
    monthSlots.value = monthSlots.value.filter((slot) => slot.id !== slotId)
    monthSlotsCache.set(
      visibleMonthStart.value,
      (monthSlotsCache.get(visibleMonthStart.value) || []).filter((slot) => slot.id !== slotId)
    )
    slots.value = slots.value.filter((slot) => slot.id !== slotId)
    if (profile.value) {
      const entry = pickSpecialist(profile.value)
      if (entry) {
        const items = getStoredSelectedSpecialists()
        const filtered = items.filter((item: any) => item.public_slug !== entry.public_slug)
        filtered.unshift(entry)
        persistSelectedSpecialists(filtered)
      }
    }
    return true
  } catch (err: any) {
    if (isClientBookingUnavailableError(err)) {
      bookingError.value = SLOT_UNAVAILABLE_MESSAGE
      resetClientBookingConfirmModalState()
      await loadSlots({ forceRefresh: true })
    } else {
      bookingError.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.bookSlot)
    }
    toast.error(bookingError.value)
    return false
  } finally {
    bookingSlotId.value = null
  }
}

function closeBookingModal() {
  showBookingModal.value = false
}

function pickSpecialist(data: PublicSpecialistProfile) {
  const profileSlug = String(data.public_slug || data.slug || '').trim()
  if (!profileSlug) return null
  return {
    therapist_id: data.therapist_id,
    public_slug: profileSlug,
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
  const entry = pickSpecialist(data)
  if (!entry) return
  const items = getStoredViewedSpecialists()
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

watch(
  [guestBookingSlot, availableGuestRequestOffers, selectedPublicOfferType],
  () => {
    if (!showGuestBookingModal.value || guestBookingSuccess.value) return
    ensureGuestBookingOfferCompatibility()
  },
  { deep: false }
)

watch(
  selectedPublicOfferType,
  () => {
    showAllSlots.value = false
    syncSelectedDateForCurrentOffer({ preferFirstAvailable: true })
  }
)

watch(slug, () => {
  profile.value = null
  slots.value = []
  monthSlots.value = []
  horizonSlots.value = []
  slotsLoaded.value = false
  horizonSlotsLoaded.value = false
  horizonSlotsLoading.value = false
  didAutoShiftToFirstAvailableMonth.value = false
  monthSlotsCache.clear()
  selectedPublicOfferType.value = null
  showGuestBookingModal.value = false
  guestBookingSlot.value = null
  guestBookingError.value = ''
  guestBookingSuccess.value = null
  guestBookingSubmitting.value = false
  guestBookingSubmitSlotId.value = null
  guestBookingRulesAccepted.value = false
  bookingRulesAccepting.value = false
  pendingClientBookingSlotId.value = null
  resetGuestBookingForm()
  showContactChooserModal.value = false
  closeContactActionFallbackModal()
  closeProfileVideoModal()
  showAllSlots.value = false
  selectedDate.value = toLocalDate(new Date())
  visibleMonthStart.value = toLocalMonthStart(selectedDate.value)
  inquiryState.value = null
  inquiryMessages.value = []
  inquiryDraft.value = ''
  inquiryError.value = ''
  inquirySubmitError.value = ''
  journalEmptyStateCode.value = null
  reviews.value = []
  loadProfile().then(async () => {
    await loadHorizonSlots()
    await loadSlots({ preferFirstAvailable: true })
    await loadInquiryState()
    await loadJournal()
    await loadReviews()
  })
  loadClientSessions()
  loadChatThreads()
})

watch(selectedDate, () => {
  showAllSlots.value = false
  if (!isDateInVisibleMonth(selectedDate.value)) {
    visibleMonthStart.value = toLocalMonthStart(selectedDate.value)
    loadSlots()
    return
  }
  syncSelectedDateSlots()
})

watch([isAuthenticated, isClient], () => {
  loadClientSessions()
  loadChatThreads()
  loadInquiryState()
  if (isAuthenticated.value && showGuestBookingModal.value) {
    closeGuestBookingModal()
  }
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
  [() => route.hash, loading, profile],
  async ([hash, isLoading, currentProfile]) => {
    if (hash !== '#slots' || isLoading || !currentProfile) return
    await nextTick()
    focusSlotsSection()
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

onBeforeUnmount(() => {
  clearContactActionFallbackTimer()
  if (copiedContactTimer !== null) {
    window.clearTimeout(copiedContactTimer)
  }
})

onMounted(async () => {
  if (!selectedDate.value) {
    selectedDate.value = toLocalDate(new Date())
  }
  await loadProfile()
  await loadHorizonSlots()
  await loadSlots({ preferFirstAvailable: true })
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
  gap: 9px;
  background: transparent;
  border-radius: 0;
  padding: clamp(7px, 1vw, 11px) 0;
  color: var(--pc-text-main);
}

.public__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(300px, 22vw, 340px);
  column-gap: clamp(10px, 1.1vw, 16px);
  row-gap: 8px;
  align-items: start;
}

.public__hero-col {
  grid-column: 1;
  min-width: 0;
}

.public__sidebar {
  grid-column: 2;
  grid-row: 1 / span 2;
  position: sticky;
  top: 24px;
  height: fit-content;
  align-self: start;
  min-width: 0;
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
  gap: 7px;
  min-width: 0;
}


.panel--slots {
  grid-column: 1 / -1;
  background: linear-gradient(
    160deg,
    color-mix(in srgb, #f8f4ec 48%, #ffffff),
    color-mix(in srgb, #fcfaf5 78%, #ffffff)
  );
  border-color: color-mix(in srgb, var(--line) 88%, #d9d0bd);
  box-shadow: var(--pc-shadow-soft);
}

.slot-request-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.panel--profile {
  grid-column: 1;
}

.panel--journal {
  grid-column: 1 / -1;
}

.panel--inquiry,
.panel--trust,
.panel--profile-principles,
.panel--documents,
.panel--work-format,
.panel--about,
.panel--who,
.panel--contacts,
.panel--reviews,
.panel--footer-cta {
  grid-column: 1 / -1;
}

.panel--contacts {
  padding: 15px 16px 16px;
  background: color-mix(in srgb, #f7f4ec 34%, #ffffff);
}

.panel--profile-principles {
  padding: 14px 16px;
  background: color-mix(in srgb, #f8f3e8 32%, #ffffff);
  border-color: color-mix(in srgb, var(--line) 86%, #d8cfbf);
}

.panel--profile-principles .panel__header {
  margin-bottom: 0;
}

.panel {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 20px;
  background: color-mix(in srgb, #ffffff 90%, var(--surface));
  display: grid;
  gap: 16px;
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

.panel__eyebrow {
  margin: 0;
  width: fit-content;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: color-mix(in srgb, var(--pc-navy-900) 78%, var(--pc-text-muted));
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
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--line) 88%, #d5ccb8);
  background: color-mix(in srgb, #f8f4ec 82%, #ffffff);
}

.slot-filter__calendar,
.slot-filter__format {
  display: grid;
  gap: 7px;
  padding: 10px 11px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--line) 90%, #e4dccd);
  background: #fff;
}

.slot-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(268px, 320px);
  gap: 10px;
  align-items: start;
}

.booking-calendar__header {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) 40px;
  align-items: center;
  gap: 8px;
}

.booking-calendar__month {
  text-align: center;
  font-size: 15px;
  font-weight: 700;
  color: var(--pc-navy-900);
}

.booking-calendar__nav {
  appearance: none;
  width: 40px;
  height: 40px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: color-mix(in srgb, var(--pc-bg-card) 92%, var(--pc-blue-soft));
  color: var(--pc-navy-900);
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.booking-calendar__nav:hover,
.booking-calendar__nav:focus-visible {
  border-color: color-mix(in srgb, var(--pc-navy-900) 30%, var(--line));
  box-shadow: 0 8px 18px rgba(18, 35, 58, 0.08);
  transform: translateY(-1px);
}

.booking-calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}

.booking-calendar__weekday {
  display: grid;
  place-items: center;
  min-height: 26px;
  font-size: 11px;
  font-weight: 700;
  color: var(--pc-text-muted);
}

.booking-calendar__blank {
  min-height: 40px;
}

.booking-calendar__day {
  border: 1px solid var(--line);
  background: color-mix(in srgb, #f7f3eb 54%, #ffffff);
  border-radius: 10px;
  min-width: 0;
  min-height: 42px;
  padding: 5px 4px;
  display: grid;
  place-items: center;
  gap: 2px;
  text-align: center;
  cursor: not-allowed;
  color: var(--pc-text-soft);
  font-weight: 600;
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.booking-calendar__day--available {
  border-color: color-mix(in srgb, var(--pc-teal-500) 28%, var(--line));
  background: color-mix(in srgb, var(--pc-teal-500) 13%, #ffffff);
  color: var(--pc-text-main);
  cursor: pointer;
}

.booking-calendar__day--available:hover,
.booking-calendar__day--available:focus-visible {
  border-color: color-mix(in srgb, var(--pc-navy-900) 26%, var(--line));
  box-shadow: 0 8px 18px rgba(18, 35, 58, 0.08);
  transform: translateY(-1px);
}

.booking-calendar__day--selected {
  border-color: color-mix(in srgb, var(--pc-navy-900) 58%, var(--border));
  background: color-mix(in srgb, var(--pc-blue-soft) 78%, #ffffff);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--pc-navy-900) 14%, transparent);
  color: var(--pc-navy-900);
}

.booking-calendar__day--today:not(.booking-calendar__day--selected) {
  border-color: color-mix(in srgb, var(--pc-peach-500) 46%, var(--line));
}

.booking-calendar__day:disabled {
  opacity: 0.68;
}

.booking-calendar__day-number {
  font-size: 13px;
  line-height: 1;
}

.booking-calendar__dot {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: var(--pc-teal-500);
}

.slot-filter__label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--pc-text-muted);
  font-weight: 700;
}

.slot-filter__hint {
  font-size: 12px;
}

.slot-format {
  display: grid;
  gap: 8px;
  margin-top: 0;
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
  padding: 7px 10px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--pc-text-main);
  font-size: 13px;
}

.slot-format__option input {
  margin: 0;
}

.slot-format__fixed {
  font-size: 13px;
  color: var(--pc-text-main);
}

.slot-format__hint {
  font-size: 12px;
}

.slot-info {
  border: 1px solid color-mix(in srgb, var(--line) 84%, #d5ccb8);
  border-radius: 14px;
  padding: 12px;
  background: color-mix(in srgb, #f2ede2 52%, #ffffff);
  display: grid;
  gap: 10px;
}

.slot-info__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--pc-navy-900);
}

.slot-info__subtitle {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--pc-text-muted);
}

.slot-info__summary {
  margin: 0;
  color: var(--pc-text-main);
  font-size: 13px;
  line-height: 1.45;
}

.slot-info__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 6px;
  color: var(--pc-text-muted);
  font-size: 12px;
  line-height: 1.45;
}

.slot-info__list li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px;
}

.slot-info__list li::before {
  content: '●';
  font-size: 8px;
  line-height: 1.8;
  color: var(--pc-teal-500);
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

.inquiry-clarity {
  display: grid;
  gap: 4px;
  border: 1px dashed color-mix(in srgb, var(--line) 82%, #d2c8b4);
  border-radius: 12px;
  padding: 10px 12px;
  background: color-mix(in srgb, #f6f1e6 50%, #ffffff);
}

.inquiry-clarity__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--deep);
}

.inquiry-clarity__body {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  color: var(--muted);
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
  background: color-mix(in srgb, #edf2e8 48%, #ffffff);
  border-color: color-mix(in srgb, #748676 18%, var(--line));
  color: color-mix(in srgb, #516754 68%, var(--muted));
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

.closing-cta__next-step {
  margin: 0;
  color: color-mix(in srgb, var(--text) 82%, var(--muted));
  font-size: 13px;
  line-height: 1.45;
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
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 8px;
}

.slot-list-heading {
  font-size: 14px;
  font-weight: 700;
  color: var(--pc-navy-900);
  margin-top: 4px;
}

.slot-list__toggle {
  justify-self: start;
  grid-column: 1 / -1;
}

.slot-card {
  appearance: none;
  border: 1px solid var(--line);
  border-radius: 12px;
  min-height: 58px;
  padding: 9px 8px;
  background: #fff;
  display: grid;
  place-items: center;
  text-align: center;
  cursor: pointer;
  transition: transform 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease, background 0.12s ease;
  font: inherit;
}

.slot-card:hover:not(:disabled),
.slot-card:focus-visible:not(:disabled) {
  border-color: color-mix(in srgb, var(--pc-navy-900) 34%, var(--line));
  background: color-mix(in srgb, var(--pc-blue-soft) 62%, #ffffff);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--pc-navy-900) 12%, transparent);
  transform: translateY(-1px);
}

.slot-card:disabled,
.slot-card--busy {
  cursor: not-allowed;
  opacity: 0.64;
  background: color-mix(in srgb, #f2f0eb 80%, #ffffff);
}

.slot-time {
  font-size: 24px;
  line-height: 1;
  font-weight: 700;
  color: var(--pc-navy-900);
}

.slot-empty {
  border: 1px dashed color-mix(in srgb, var(--line) 88%, #d4cab8);
  border-radius: 12px;
  padding: 12px;
  background: color-mix(in srgb, #f6f2e9 55%, #ffffff);
  font-size: 13px;
}

.slot-empty--request {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
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

.guest-booking-success {
  display: grid;
  gap: 4px;
}

.guest-booking-success strong {
  font-size: 15px;
  line-height: 1.25;
}

.guest-booking-success span {
  line-height: 1.45;
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
  padding: 14px;
  margin-top: 8px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, #d9a441 30%, var(--line));
  background: color-mix(in srgb, #f4e2ae 10%, #ffffff);
  }

  .booking-gate--pending {
    border-color: color-mix(in srgb, #d9a441 30%, var(--line));
    background: color-mix(in srgb, #f4e2ae 10%, #ffffff);
  }

  .booking-gate__title {
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
  }

  .booking-gate__text {
    margin: 0;
    max-width: 620px;
    color: var(--muted);
    line-height: 1.4;
    font-size: 13px;
  }

  .booking-gate__actions {
    display: flex;
    justify-content: flex-start;
  }

  .booking-gate__button {
    min-width: 240px;
  }

.booking-rules-block {
  display: grid;
  gap: 8px;
  padding: 0;
  border-radius: 10px;
  border: 0;
  background: transparent;
}

  .booking-rules-block__title {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--deep);
    font-weight: 700;
  }

.booking-rules-block__item {
  margin: 0;
  color: var(--text);
  font-size: 13px;
  line-height: 1.45;
  white-space: pre-line;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #fff;
}

  .setting-check {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--muted);
  }

  .booking-gate__check {
    font-size: 13px;
    color: var(--text);
  }

  .setting-check input {
    width: 16px;
    height: 16px;
  }

  .booking-gate__hint {
    font-size: 12px;
    color: var(--muted);
  }

  .setting-modal {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100dvh;
    box-sizing: border-box;
    padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom));
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }

  @media (max-width: 640px) {
    .booking-gate {
      padding: 12px;
    }

    .booking-gate__button {
      width: 100%;
      min-width: 0;
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
    max-height: 100%;
    min-height: 0;
    background: #fff;
    border-radius: 16px;
    border: 1px solid var(--line);
    padding: 20px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow: hidden;
    box-shadow: 0 18px 40px rgba(15, 35, 48, 0.2);
  }

  .setting-modal__header {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .setting-modal__body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    display: grid;
    gap: 12px;
    padding-right: 2px;
  }

  .setting-modal__footer {
    flex: 0 0 auto;
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;
  }

  .booking-confirm-modal {
    width: min(560px, 92vw);
  }

  .contact-chooser-modal {
    width: min(560px, 92vw);
  }

  .contact-chooser-modal__hint {
    margin: 0;
  }

  .contact-chooser-modal__list {
    display: grid;
    gap: 8px;
  }

  .contact-chooser-modal__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: #fff;
  }

  .contact-chooser-modal__meta {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .contact-chooser-modal__title {
    font-size: 14px;
    font-weight: 600;
  }

  .contact-chooser-modal__value {
    font-size: 12px;
    color: var(--muted);
    overflow-wrap: anywhere;
  }

  .contact-fallback-modal {
    width: min(560px, 92vw);
  }

  .profile-video-modal {
    width: min(780px, 94vw);
  }

  .about-modal {
    width: min(680px, 92vw);
  }

  .about-modal__text {
    color: var(--text);
    font-size: 15px;
    line-height: 1.65;
    white-space: pre-line;
  }

  .profile-video-modal__player {
    width: 100%;
    aspect-ratio: 16 / 9;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: #071821;
  }

  .contact-fallback-modal__helper {
    margin: 0;
  }

  .contact-fallback-modal__contact {
    display: grid;
    gap: 4px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: #fff;
  }

  .contact-fallback-modal__label {
    font-size: 12px;
    font-weight: 600;
  }

  .contact-fallback-modal__value {
    font-size: 13px;
    line-height: 1.4;
    color: var(--muted);
    overflow-wrap: anywhere;
  }

  .contact-fallback-modal__hint {
    margin: 0;
  }

  .contact-fallback-modal__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
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

  .booking-slot--details {
    gap: 8px;
  }

  .booking-slot__row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
  }

  .booking-slot__label {
    color: var(--muted);
  }

  .booking-slot__value {
    color: var(--ink);
    font-weight: 600;
    text-align: right;
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

  .guest-booking-modal {
    width: min(620px, 92vw);
    padding: 16px;
    gap: 10px;
  }

  .guest-booking-modal .setting-modal__body {
    gap: 8px;
    padding-right: 0;
  }

  .guest-booking-modal .booking-next {
    gap: 4px;
    padding: 8px 10px;
    border-radius: 10px;
  }

  .guest-booking-modal .booking-next__title {
    font-size: 13px;
  }

  .guest-booking-modal .booking-next__item {
    font-size: 12px;
    line-height: 1.35;
  }

  .guest-booking-modal .setting-label {
    gap: 4px;
  }

  .guest-booking-form {
    display: grid;
    gap: 9px;
    padding-bottom: max(4px, env(safe-area-inset-bottom));
  }

  .guest-booking-form__message {
    min-height: 104px;
    resize: vertical;
  }

  .guest-booking-form__input--invalid {
    border-color: #c84d44;
    box-shadow: 0 0 0 1px rgba(200, 77, 68, 0.12);
  }

  .guest-booking-form__field-error,
  .guest-booking-form__message-counter {
    color: var(--muted);
    font-size: 12px;
    line-height: 1.35;
  }

  .guest-booking-form__field-error {
    color: #b1453d;
  }

  .guest-booking-form__message-counter {
    justify-self: end;
  }

  .guest-offer-selector {
    display: grid;
    gap: 7px;
  }

  .guest-offer-selector__title {
    color: var(--ink);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.35;
  }

  .guest-offer-selector__options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 7px;
  }

  .guest-offer-option {
    min-height: 56px;
    display: grid;
    align-content: center;
    gap: 3px;
    padding: 9px 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: #fff;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.16s ease, background 0.16s ease, box-shadow 0.16s ease;
  }

  .guest-offer-option:hover,
  .guest-offer-option:focus-visible {
    border-color: color-mix(in srgb, var(--deep) 28%, var(--line));
    outline: none;
  }

  .guest-offer-option--active {
    border-color: color-mix(in srgb, var(--deep) 48%, var(--line));
    background: color-mix(in srgb, var(--accent) 16%, #ffffff);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--deep) 16%, transparent);
  }

  .guest-offer-option:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }

  .guest-offer-option__label {
    font-size: 13px;
    font-weight: 700;
    line-height: 1.3;
    color: var(--deep);
  }

  .guest-offer-option__meta {
    min-height: 16px;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.3;
  }

  .guest-offer-option__helper,
  .guest-offer-selector__hint {
    color: #9b4a3f;
    font-size: 12px;
    line-height: 1.35;
  }

  .guest-offer-selector__hint {
    margin: 0;
  }

  .guest-request-consent {
    display: grid;
    gap: 6px;
    padding: 11px 12px;
    border: 1px solid color-mix(in srgb, var(--line) 88%, #d5ccb8);
    border-radius: 12px;
    background: color-mix(in srgb, #f6f1e7 56%, #ffffff);
  }

  .guest-request-consent__title {
    margin: 0;
    color: var(--deep);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.35;
  }

  .guest-request-consent p {
    margin: 0;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.45;
  }

  .guest-booking-modal .booking-rules-block {
    gap: 6px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: #fff;
  }

  .guest-booking-modal .booking-rules-block__item {
    padding: 0;
    border: 0;
    background: transparent;
  }

  .guest-booking-form__submit {
    position: sticky;
    bottom: 0;
    z-index: 2;
    display: flex;
    justify-content: flex-end;
    padding-top: 8px;
    padding-bottom: max(2px, env(safe-area-inset-bottom));
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0),
      #fff 34%,
      #fff
    );
  }

  .guest-request-topics {
    display: grid;
    gap: 7px;
  }

  .guest-request-topics__header {
    display: grid;
    gap: 2px;
  }

  .guest-request-topics__title {
    color: var(--ink);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.35;
  }

  .guest-request-topics__helper,
  .guest-request-topics__limit {
    margin: 0;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.35;
  }

  .guest-request-topics__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .guest-request-topic-chip {
    max-width: 100%;
    min-height: 29px;
    padding: 4px 8px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: #fff;
    color: var(--ink);
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
    text-align: center;
    white-space: normal;
    cursor: pointer;
    transition: border-color 0.16s ease, background 0.16s ease, color 0.16s ease;
  }

  .guest-request-topic-chip:hover,
  .guest-request-topic-chip:focus-visible {
    border-color: color-mix(in srgb, var(--deep) 28%, var(--line));
    outline: none;
  }

  .guest-request-topic-chip--active {
    border-color: color-mix(in srgb, var(--deep) 42%, var(--line));
    background: color-mix(in srgb, var(--accent) 18%, #ffffff);
    color: var(--deep);
  }

  .guest-request-topic-chip:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

@media (max-width: 1100px) {
  .public__layout {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .public__hero-col,
  .public__sidebar,
  .public__grid {
    grid-column: 1;
    grid-row: auto;
  }

  .public__sidebar {
    position: static;
    top: auto;
    max-height: none;
    overflow: visible;
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

  .slot-list {
    grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
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

@media (max-width: 1024px) and (max-height: 560px) {
  .public {
    gap: 6px;
    padding: 4px 0;
  }

  .public__layout {
    gap: 6px;
  }

  .public__grid {
    gap: 6px;
  }
}

@media (max-width: 640px) {
  .setting-modal {
    align-items: stretch;
    padding: max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom));
  }

  .setting-modal__content {
    width: 100%;
    padding: 14px;
    border-radius: 14px;
  }

  .guest-booking-modal {
    padding: 12px;
    gap: 8px;
  }

  .guest-booking-form {
    gap: 8px;
  }

  .guest-booking-form__submit .btn {
    width: 100%;
  }

  .setting-modal__header {
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .booking-calendar__header {
    grid-template-columns: 38px minmax(0, 1fr) 38px;
  }

  .booking-calendar__nav {
    width: 38px;
    height: 38px;
  }

  .booking-calendar__grid {
    gap: 4px;
  }

  .booking-calendar__day {
    min-height: 38px;
    border-radius: 8px;
    padding: 4px 2px;
  }

  .booking-calendar__blank {
    min-height: 38px;
  }

  .slot-list {
    grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
  }
}
</style>
