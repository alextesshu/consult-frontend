<template>
  <section class="external-sessions" :class="{ 'external-sessions--requests-first': hasPendingGuestRequests }">
    <header class="external-sessions__hero">
      <div>
        <h1 class="title external-sessions__title">Запити та сесії без реєстрації</h1>
        <p class="muted external-sessions__subtitle">
          Окремий сценарій для запитів і сесій із клієнтами, які звертаються без створення акаунта.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet/sessions">Назад до сесій</RouterLink>
    </header>

    <section class="panel external-sessions__create-panel">
      <div class="panel__header">
        <div>
          <h2 class="panel__title">Нова сесія без реєстрації</h2>
        </div>
      </div>

      <div v-if="guestQuotaSummary" class="quota-summary" :class="{ 'quota-summary--blocked': isGuestQuotaBlocked }">
        <div class="quota-summary__title">{{ guestQuotaSummary }}</div>
        <div v-if="guestQuotaMessage" class="quota-summary__message">{{ guestQuotaMessage }}</div>
        <template v-if="isGuestQuotaBlocked">
          <RouterLink class="btn btn--ghost btn--sm quota-summary__link" to="/cabinet/billing">Перейти до тарифів</RouterLink>
        </template>
      </div>

      <div v-if="createError" class="form-error">{{ createError }}</div>

      <div class="form-grid">
        <label class="field">
          <span>Дата початку</span>
          <input
            v-model="createDraft.start_date"
            class="input"
            type="date"
            lang="uk"
            @click="openDatePicker"
            @focus="openDatePicker"
          />
        </label>

        <label class="field">
          <span>Час початку</span>
          <input
            v-model="createDraft.start_time"
            class="input"
            type="text"
            inputmode="numeric"
            maxlength="5"
            placeholder="ГГ:ХХ"
            list="external-session-time-options"
            @blur="normalizeCreateStartTime"
          />
        </label>

        <label class="field">
          <span>Тривалість (хв)</span>
          <input v-model.number="createDraft.duration_minutes" class="input" type="number" min="1" max="480" />
        </label>

        <label class="field">
          <span>Формат</span>
          <select v-model="createDraft.session_format" class="input input--select">
            <option value="online">Онлайн</option>
            <option value="offline">Офлайн</option>
          </select>
        </label>

        <label v-if="isCreateOnline" class="field">
          <span>Посилання на зустріч</span>
          <input v-model="createDraft.meeting_url" class="input" type="url" placeholder="https://meet.google.com/..." />
        </label>

        <label v-else class="field">
          <span>Локація</span>
          <input
            v-model="createDraft.offline_location_snapshot"
            class="input"
            type="text"
            placeholder="Київ, вул. ..."
          />
        </label>

        <label class="field">
          <span>Ім'я клієнта (опційно)</span>
          <input v-model="createDraft.guest_name" class="input" type="text" maxlength="120" />
        </label>
        
        <label class="field">
          <span>Ел. пошта клієнта (опційно)</span>
          <input v-model="createDraft.guest_email" class="input" type="email" maxlength="255" />
        </label>

        <label class="field">
        <span>Вартість сесії, грн</span>
        <input
          v-model="createDraft.price_amount"
          class="input"
          type="number"
          min="0"
          step="0.01"
          placeholder="Наприклад, 2000"
          />
        </label>
      </div>

      <div class="actions-row">
        <button class="btn" type="button" :disabled="createPending || isGuestQuotaBlocked" @click="submitCreate">
          {{ createPending ? 'Створюємо…' : 'Створити сесію без реєстрації' }}
        </button>
      </div>
      <datalist id="external-session-time-options">
        <option v-for="option in timeOptions" :key="option" :value="option" />
      </datalist>
    </section>

    <div class="external-sessions__operational">
      <section class="panel external-sessions__sessions-panel">
        <div class="panel__header">
          <div>
            <h2 class="panel__title">Ваші сесії без реєстрації</h2>
          </div>
        </div>

        <div v-if="listError" class="form-error">{{ listError }}</div>
        <div v-else-if="listLoading" class="muted">Завантаження сесій без реєстрації…</div>
        <div v-else-if="sessions.length === 0" class="muted">Немає сесій без реєстрації. Створіть першу сесію вище.</div>

        <div v-else class="list-grid">
          <article v-for="session in sessions" :key="session.id" class="session-card">
            <div class="session-card__main">
              <div class="session-card__time">{{ formatDateTime(session.starts_at) }}</div>
              <div class="muted">Тривалість: {{ session.duration_minutes }} хв</div>
              <div class="muted">Формат: {{ session.session_format === 'offline' ? 'Офлайн' : 'Онлайн' }}</div>
              <div v-if="session.guest_name || session.guest_email" class="muted">
                Клієнт: {{ session.guest_name || '—' }} <span v-if="session.guest_email">({{ session.guest_email }})</span>
              </div>
              <div class="status-pill" :class="session.status === 'CANCELLED' ? 'status-pill--danger' : 'status-pill--ok'">
                {{ session.status === 'CANCELLED' ? 'Скасовано' : 'Заплановано' }}
              </div>
            </div>
            <RouterLink class="btn btn--ghost btn--sm" :to="`/cabinet/external-sessions/${session.id}`">Деталі</RouterLink>
          </article>
        </div>
      </section>

      <section id="guest-requests" class="panel external-sessions__guest-requests-panel">
        <div class="panel__header">
          <div>
            <h2 class="panel__title">Запити без реєстрації</h2>
            <p class="muted">
              Нові запити очікують вашого рішення: підтвердьте час, запропонуйте інший варіант або закрийте запит.
            </p>
          </div>
        </div>

        <div v-if="requestsError" class="form-error">{{ requestsError }}</div>
        <div v-else-if="requestsLoading" class="muted">Завантаження запитів без реєстрації…</div>
        <div v-else-if="guestRequests.length === 0" class="muted">Запитів без реєстрації поки немає.</div>

        <div v-else class="list-grid">
          <div v-if="calendarRequestNotice" class="calendar-request-notice" role="status">
            {{ calendarRequestNotice }}
          </div>
          <article
            v-for="request in guestRequests"
            :key="request.id"
            :id="`guest-request-${request.id}`"
            :ref="setGuestRequestCardRef(request.id)"
            class="request-card"
            :class="{
              'request-card--expanded': isRequestDetailsOpen(request.id),
              'request-card--highlighted': isCalendarHighlightedRequest(request.id),
            }"
          >
            <div class="request-card__main">
              <div class="request-card__summary">
                <div class="request-card__summary-main">
                  <div class="request-card__title">
                    {{ isSlotlessRequest(request) ? 'Запит без обраного часу' : requestClientName(request) }}
                  </div>
                  <div v-if="!isSlotlessRequest(request)" class="request-card__requested-time">
                    <span>Запитаний час</span>
                    <strong>{{ formatRequestedSlotRange(request) }}</strong>
                  </div>
                  <div class="request-card__meta-grid">
                    <div class="muted">Клієнт: {{ requestClientName(request) }}</div>
                    <div class="muted">Контакт клієнта для відповіді: {{ requestCompactContact(request) }}</div>
                    <div v-if="requestOfferTypeLabel(request)" class="muted">
                      Тип консультації: {{ requestOfferTypeLabel(request) }}
                    </div>
                    <div v-if="request.created_at" class="muted">Створено: {{ formatDateTime(request.created_at) }}</div>
                    <div class="request-card__status-row">
                      <span class="muted">Статус:</span>
                      <span class="status-pill" :class="requestStatusClass(request.status)">
                        {{ requestStatusLabel(request) }}
                      </span>
                    </div>
                  </div>
                  <div v-if="requestTopicLabels(request).length" class="request-topic-row" aria-label="Теми запиту">
                    <span
                      v-for="topicLabel in requestTopicLabels(request)"
                      :key="topicLabel"
                      class="request-topic-chip"
                    >
                      {{ topicLabel }}
                    </span>
                  </div>
                </div>
                <button
                  class="btn btn--ghost btn--sm request-details-toggle"
                  type="button"
                  :aria-expanded="isRequestDetailsOpen(request.id)"
                  @click="toggleRequestDetails(request.id)"
                >
                  {{ isRequestDetailsOpen(request.id) ? 'Сховати деталі' : 'Показати деталі' }}
                </button>
              </div>

              <div v-if="isRequestDetailsOpen(request.id)" class="request-card__details">
                <div v-if="isSlotlessRequest(request)" class="request-card__helper">
                  Клієнт залишив запит без конкретного часу. Узгодьте час і створіть сесію вручну.
                </div>
                <div v-if="requestClientEmail(request)" class="muted">
                  Ел. пошта: {{ requestClientEmail(request) }}
                </div>
                <div v-if="requestClientPhone(request)" class="muted">
                  Телефон: {{ requestClientPhone(request) }}
                </div>
                <div class="muted">
                  Контакт клієнта для відповіді: {{ contactChannelLabel(request.contact_channel) }} · {{ request.contact_value || '—' }}
                </div>
                <div v-if="!isSlotlessRequest(request)" class="muted">
                  Запитаний час: {{ formatRequestedSlotRange(request) }}
                  <span v-if="request.duration_minutes"> · {{ request.duration_minutes }} хв</span>
                </div>
                <div class="muted">
                  Формат: {{ request.session_format === 'offline' ? 'Офлайн' : 'Онлайн' }}
                  <span v-if="request.session_format === 'offline' && request.offline_location_snapshot">
                    · {{ request.offline_location_snapshot }}
                  </span>
                </div>
                <div v-if="requestOfferTypeLabel(request)" class="muted">
                  Тип консультації: {{ requestOfferTypeLabel(request) }}
                </div>
                <div v-if="request.message" class="muted">Коментар: {{ request.message }}</div>
                <div v-if="requestDecisionAt(request)" class="muted">
                  {{ requestDecisionLabel(request.status) }}: {{ formatDateTime(requestDecisionAt(request)) }}
                </div>
              </div>

              <div v-if="request.session_id" class="request-next-step">
                <div class="muted">Запит погоджено. На основі цього запиту створено сесію.</div>
                <div class="muted">Підтвердження сесії та оплата мають окремі статуси.</div>
                <RouterLink
                  class="btn btn--ghost btn--sm"
                  :to="`/cabinet/sessions/${request.session_id}`"
                >
                  Відкрити сесію
                </RouterLink>
              </div>
              <div v-if="request.external_session_id" class="request-next-step">
                <div class="muted">Запит погоджено. На основі цього запиту створено сесію без реєстрації.</div>
                <div class="muted">Підтвердження сесії та оплата мають окремі статуси.</div>
                <RouterLink
                  class="btn btn--ghost btn--sm"
                  :to="`/cabinet/external-sessions/${request.external_session_id}`"
                >
                  Відкрити сесію без реєстрації
                </RouterLink>
                <a
                  v-if="latestInviteUrlByRequestId[request.id]"
                  class="btn btn--ghost btn--sm"
                  :href="latestInviteUrlByRequestId[request.id]"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Відкрити сторінку сесії
                </a>
                <div v-if="latestInviteUrlByRequestId[request.id]" class="muted request-invite-helper">
                  Надішліть це посилання клієнту, щоб він міг приєднатися без створення акаунта.
                </div>
              </div>
            </div>

            <div v-if="isPendingRequest(request.status)" class="request-actions">
              <template v-if="isSlotlessRequest(request)">
                <button
                  class="btn btn--ghost btn--sm"
                  type="button"
                  :disabled="isRequestActionLoading(request.id, 'create-session')"
                  @click="openSlotlessSessionModal(request)"
                >
                  Створити сесію
                </button>
                <RouterLink
                  class="btn btn--ghost btn--sm"
                  :to="scheduleRouteForRequest(request)"
                >
                  Обрати час у календарі
                </RouterLink>
                <button
                  class="btn btn--ghost btn--sm"
                  type="button"
                  :disabled="isRequestActionLoading(request.id, 'decline')"
                  @click="openDeclineRequestConfirmation(request.id, { successMessage: 'Запит відхилено.' })"
                >
                  {{ isRequestActionLoading(request.id, 'decline') ? 'Відхиляємо…' : 'Відхилити запит' }}
                </button>
              </template>
              <template v-else>
                <div v-if="needsAlternativeTime(request) && !hasActiveTimeProposal(request)" class="request-card__helper request-card__helper--warning">
                  Потрібно запропонувати інший час
                </div>
                <div v-if="hasActiveTimeProposal(request)" class="request-card__helper">
                  {{ activeTimeProposalSummary(request) }}
                </div>
                <div
                  v-if="hasActiveTimeProposal(request) && activeTimeProposalHelper(request)"
                  class="request-card__helper"
                >
                  {{ activeTimeProposalHelper(request) }}
                </div>
                <button
                  v-if="hasActiveTimeProposal(request) && shouldShowActiveTimeProposalCopyButton(request)"
                  class="btn btn--ghost btn--sm"
                  type="button"
                  @click="copyActiveTimeProposalUrl(request)"
                >
                  Скопіювати посилання
                </button>
                <div v-if="activeProposalCopyRequestId === request.id" class="muted request-card__helper">
                  Посилання скопійовано.
                </div>
                <button
                  v-if="canProposeAlternativeTime(request)"
                  class="btn btn--ghost btn--sm"
                  type="button"
                  :disabled="isRequestActionLoading(request.id, 'proposal')"
                  @click="openTimeProposalModal(request)"
                >
                  Запропонувати інший час
                </button>
                <label v-if="canApproveOriginalTime(request) && request.session_format === 'online'" class="field request-meeting-field">
                  <span>Посилання на онлайн-зустріч</span>
                  <input
                    v-model="approveMeetingUrls[request.id]"
                    class="input"
                    type="url"
                    placeholder="https://meet.google.com/..."
                    :disabled="isRequestActionLoading(request.id, 'approve')"
                  />
                </label>
                <div v-if="shouldShowApproveMeetingHint(request)" class="muted request-meeting-hint">
                  Щоб погодити онлайн-запит, додайте посилання на зустріч.
                </div>
                <button
                  v-if="canApproveOriginalTime(request)"
                  class="btn btn--ghost btn--sm"
                  type="button"
                  :disabled="isApproveRequestDisabled(request)"
                  @click="approveRequest(request)"
                >
                  {{ isRequestActionLoading(request.id, 'approve') ? 'Погоджуємо…' : 'Погодити' }}
                </button>
                <button
                  class="btn btn--ghost btn--sm"
                  type="button"
                  :disabled="isRequestActionLoading(request.id, 'decline')"
                  @click="openDeclineRequestConfirmation(request.id)"
                >
                  {{ isRequestActionLoading(request.id, 'decline') ? 'Відхиляємо…' : 'Відхилити запит' }}
                </button>
              </template>
              <div v-if="requestActionError(request.id)" class="form-error request-card__error">
                {{ requestActionError(request.id) }}
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>

    <ConfirmModal
      :open="declineConfirmationOpen"
      title="Відхилити запит?"
      message="Запит буде відхилено. Клієнт не побачить автоматичної відповіді, якщо ви не зв’яжетеся з ним окремо."
      confirm-text="Відхилити запит"
      cancel-text="Залишити запит"
      tone="danger"
      @confirm="confirmDeclineRequest"
      @cancel="closeDeclineRequestConfirmation"
    />

    <div
      v-if="proposalModalOpen"
      class="request-session-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="time-proposal-modal-title"
    >
      <button
        class="request-session-modal__backdrop"
        type="button"
        aria-label="Закрити"
        @click="closeTimeProposalModal"
      ></button>
      <div class="request-session-modal__content time-proposal-modal">
        <div class="request-session-modal__header">
          <div>
            <h2 id="time-proposal-modal-title" class="panel__title">Запропонувати інший час</h2>
            <p v-if="proposalRequest" class="muted">{{ requestClientName(proposalRequest) }}</p>
          </div>
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :disabled="proposalSaving"
            @click="closeTimeProposalModal"
          >
            Закрити
          </button>
        </div>

        <template v-if="proposalSuccessUrl">
          <div class="time-proposal-success" role="status">
            <h3>Пропозицію створено</h3>
            <label class="field">
              <span>Посилання для клієнта</span>
              <input class="input" type="text" :value="proposalSuccessUrl" readonly />
            </label>
            <div class="actions-row">
              <button class="btn" type="button" @click="copyProposalUrl">Скопіювати посилання</button>
            </div>
            <p class="muted">{{ proposalSuccessHelper }}</p>
            <p v-if="proposalCopyStatus" class="muted">{{ proposalCopyStatus }}</p>
          </div>
        </template>

        <template v-else>
          <div v-if="proposalRequest" class="time-proposal-context">
            <div class="detail-label">Запитаний час</div>
            <strong>{{ formatRequestedSlotRange(proposalRequest) }}</strong>
          </div>
          <p class="muted">
            Оберіть від 1 до 3 доступних вікон. Клієнт отримає посилання й зможе обрати один із запропонованих варіантів.
          </p>

          <div v-if="proposalError" class="form-error">{{ proposalError }}</div>
          <div v-if="proposalSlotsError" class="form-error">{{ proposalSlotsError }}</div>

          <div v-if="proposalSlotsLoading" class="muted">Завантажуємо доступні вікна…</div>
          <div v-else-if="availableProposalSlots.length === 0" class="time-proposal-empty">
            <p class="muted">Немає доступних вікон для пропозиції. Спершу створіть вікна для запису.</p>
            <RouterLink class="btn btn--ghost btn--sm" to="/cabinet/slots?tab=availability">
              Створити вікна для запису
            </RouterLink>
          </div>
          <div v-else class="time-proposal-options">
            <div class="muted">{{ selectedProposalCountLabel }}</div>
            <label
              v-for="slot in availableProposalSlots"
              :key="slot.id"
              class="time-proposal-option"
              :class="{ 'time-proposal-option--selected': isProposalSlotSelected(slot.id) }"
            >
              <input
                type="checkbox"
                :checked="isProposalSlotSelected(slot.id)"
                :disabled="proposalSaving || !canSelectProposalSlot(slot.id)"
                @change="toggleProposalSlot(slot.id)"
              />
              <span>{{ proposalSlotRange(slot) }}</span>
            </label>
          </div>

          <div class="form-grid request-session-form">
            <fieldset class="field request-session-form__wide time-proposal-format">
              <legend>Формат запропонованої сесії</legend>
              <div class="segmented-control">
                <label>
                  <input
                    v-model="proposalDraft.session_format"
                    type="radio"
                    value="online"
                    :disabled="proposalSaving"
                  />
                  <span>Онлайн</span>
                </label>
                <label>
                  <input
                    v-model="proposalDraft.session_format"
                    type="radio"
                    value="offline"
                    :disabled="proposalSaving"
                  />
                  <span>Офлайн</span>
                </label>
              </div>
              <p class="muted">
                Можна запропонувати інший формат, якщо ви домовляєтеся провести цю сесію онлайн або офлайн.
              </p>
            </fieldset>
            <label v-if="isProposalOnline" class="field">
              <span>Посилання на онлайн-зустріч</span>
              <input
                v-model="proposalDraft.meeting_url"
                class="input"
                type="url"
                placeholder="https://meet.google.com/..."
                :disabled="proposalSaving"
              />
            </label>
            <label v-else class="field">
              <span>Адреса / місце зустрічі</span>
              <input
                v-model="proposalDraft.offline_location_snapshot"
                class="input"
                type="text"
                placeholder="Київ, вул. ..."
                :disabled="proposalSaving"
              />
            </label>
            <label class="field request-session-form__wide">
              <span>Повідомлення для клієнта</span>
              <textarea
                v-model="proposalDraft.message"
                class="input"
                rows="3"
                placeholder="Наприклад: цей час уже зайнятий, оберіть один із варіантів нижче."
                :disabled="proposalSaving"
              ></textarea>
            </label>
          </div>

          <div class="actions-row">
            <button
              class="btn"
              type="button"
              :disabled="proposalSubmitDisabled"
              @click="submitTimeProposal"
            >
              {{ proposalSaving ? 'Надсилаємо…' : 'Надіслати пропозицію' }}
            </button>
          </div>
        </template>
      </div>
    </div>

    <div
      v-if="slotlessSessionModalOpen"
      class="request-session-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="slotless-session-modal-title"
    >
      <button
        class="request-session-modal__backdrop"
        type="button"
        aria-label="Закрити"
        @click="closeSlotlessSessionModal"
      ></button>
      <div class="request-session-modal__content" @pointerdown="handleSlotlessModalPointerDown">
        <div class="request-session-modal__header">
          <div>
            <h2 id="slotless-session-modal-title" class="panel__title">Створити сесію</h2>
            <p v-if="slotlessSessionRequest" class="muted">
              {{ requestClientName(slotlessSessionRequest) }}
            </p>
          </div>
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :disabled="slotlessSessionSaving"
            @click="closeSlotlessSessionModal"
          >
            Закрити
          </button>
        </div>

        <div v-if="slotlessSessionError" class="form-error">{{ slotlessSessionError }}</div>

        <div class="form-grid request-session-form">
          <DatePickerField
            ref="slotlessDatePickerRef"
            :model-value="slotlessSessionDateDisplay"
            label="Дата"
            :disabled="slotlessSessionSaving"
            @update:model-value="updateSlotlessSessionDateValue"
            @select-iso="selectSlotlessDate"
          />

          <TimeSelectField
            v-model="slotlessSessionDraft.start_time"
            label="Час початку"
            :disabled="slotlessSessionSaving"
            @click="closeSlotlessDatePicker"
            @focus="closeSlotlessDatePicker"
          />

          <label class="field">
            <span>Тривалість</span>
            <input
              v-model.number="slotlessSessionDraft.duration_minutes"
              class="input"
              type="number"
              min="1"
              max="480"
              :disabled="slotlessSessionSaving"
              @focus="closeSlotlessDatePicker"
            />
          </label>

          <label class="field">
            <span>Формат зустрічі</span>
            <select
              v-model="slotlessSessionDraft.session_format"
              class="input input--select"
              :disabled="slotlessSessionSaving"
              @click="closeSlotlessDatePicker"
              @focus="closeSlotlessDatePicker"
            >
              <option value="online">Онлайн</option>
              <option value="offline">Офлайн</option>
            </select>
          </label>

          <label v-if="isSlotlessSessionOnline" class="field">
            <span>Посилання на онлайн-зустріч</span>
            <input
              v-model="slotlessSessionDraft.meeting_url"
              class="input"
              type="url"
              placeholder="https://meet.google.com/..."
              :disabled="slotlessSessionSaving"
              @focus="closeSlotlessDatePicker"
            />
          </label>

          <label v-else class="field">
            <span>Місце зустрічі</span>
            <input
              v-model="slotlessSessionDraft.offline_location"
              class="input"
              type="text"
              placeholder="Київ, вул. ..."
              :disabled="slotlessSessionSaving"
              @focus="closeSlotlessDatePicker"
            />
          </label>
        </div>

        <div class="actions-row">
          <button
            class="btn"
            type="button"
            :disabled="slotlessSessionSaving"
            @click="submitSlotlessSession"
          >
            {{ slotlessSessionSaving ? 'Створюємо…' : 'Створити сесію' }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ConfirmModal from '../components/ConfirmModal.vue'
import DatePickerField from '../components/DatePickerField.vue'
import TimeSelectField from '../components/TimeSelectField.vue'
import { useToast } from '../composables/useToast'
import {
  apiGet,
  confirmCabinetGuestBookingRequestSession,
  createCabinetGuestBookingTimeProposal,
  createExternalSession,
  createExternalSessionInvite,
  createSessionFromCabinetGuestBookingRequest,
  declineCabinetGuestBookingRequest,
  fetchCabinetGuestBookingRequests,
  fetchExternalSessions,
  fetchSpecialistProfile,
  getApiErrorMessage,
  requestTopicLabel,
  type ExternalSessionRecord,
  type GuestBookingRequestRecord,
  type SessionFormat,
  type SpecialistProfile,
} from '../lib/api'
import { formatUkDateTimeCompact, formatUkTime } from '../lib/dateTime'
import { formatIsoDateForDisplay, parseDisplayDateToIso } from '../lib/dateFormat'
import { buildTenMinuteTimeOptions } from '../lib/timeOptions'

type CreateDraft = {
  start_date: string
  start_time: string
  duration_minutes: number
  session_format: SessionFormat
  meeting_url: string
  offline_location_snapshot: string
  guest_name: string
  guest_email: string
  price_amount: string
}
type SlotlessSessionDraft = {
  start_date: string
  start_time: string
  duration_minutes: number
  session_format: SessionFormat
  meeting_url: string
  offline_location: string
}
type ProposalSlot = {
  id: number
  start_at: string
  end_at: string
  is_booked?: boolean | null
  status?: string | null
}
type ProposalSessionFormat = 'online' | 'offline'
type ProposalDraft = {
  session_format: ProposalSessionFormat
  meeting_url: string
  offline_location_snapshot: string
  message: string
}
type RequestActionType = 'approve' | 'decline' | 'create-session' | 'proposal'
type RequestActionLoadingState = {
  approve?: boolean
  decline?: boolean
  'create-session'?: boolean
  proposal?: boolean
}
type DeclineConfirmation = {
  requestId: number
  successMessage?: string
} | null
type GuestQuotaSnapshot = {
  guest_sessions_enabled?: boolean | null
  guest_sessions_used_in_period?: number | null
  guest_sessions_limit_per_period?: number | null
  guest_sessions_period_days?: number | null
  guest_sessions_remaining?: number | null
  guest_sessions_next_available_at?: string | null
  guest_sessions_quota?: {
    used?: number | null
    limit?: number | null
    remaining?: number | null
    window_days?: number | null
    next_available_at?: string | null
  } | null
}

const PAST_SESSION_TIME_ERROR_MESSAGE = 'Неможливо створити сесію в минулому. Оберіть майбутню дату або час.'
const INVALID_SESSION_DATE_FORMAT_MESSAGE = 'Введіть дату у форматі ДД.ММ.РРРР, наприклад 25.06.2026.'
const INVALID_SESSION_TIME_FORMAT_MESSAGE = 'Оберіть час початку.'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const listLoading = ref(false)
const listError = ref('')
const requestsLoading = ref(false)
const requestsError = ref('')
const createPending = ref(false)
const createError = ref('')
const guestQuota = ref<GuestQuotaSnapshot | null>(null)
const sessions = ref<ExternalSessionRecord[]>([])
const guestRequests = ref<GuestBookingRequestRecord[]>([])
const requestActionLoading = ref<Record<number, RequestActionLoadingState>>({})
const requestActionErrors = ref<Record<number, string>>({})
const expandedRequestDetails = ref<Record<number, boolean>>({})
const approveMeetingUrls = ref<Record<number, string>>({})
const latestInviteUrlByRequestId = ref<Record<number, string>>({})
const latestProposalUrlByRequestId = ref<Record<number, string>>({})
const latestProposalNotificationStatusByRequestId = ref<Record<number, string>>({})
const activeProposalCopyRequestId = ref<number | null>(null)
const guestRequestCardRefs = ref<Record<number, HTMLElement | null>>({})
const declineConfirmation = ref<DeclineConfirmation>(null)
const slotlessSessionModalOpen = ref(false)
const slotlessSessionRequest = ref<GuestBookingRequestRecord | null>(null)
const slotlessSessionSaving = ref(false)
const slotlessSessionError = ref('')
const slotlessSessionDateDisplay = ref('')
const slotlessDatePickerRef = ref<InstanceType<typeof DatePickerField> | null>(null)
const slotlessProfileLoaded = ref(false)
const slotlessProfileTimezone = ref('')
const slotlessSessionTimezone = ref(
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Kyiv'
)
const proposalModalOpen = ref(false)
const proposalRequest = ref<GuestBookingRequestRecord | null>(null)
const proposalSlots = ref<ProposalSlot[]>([])
const proposalSlotsLoading = ref(false)
const proposalSlotsError = ref('')
const selectedProposalSlotIds = ref<number[]>([])
const proposalSaving = ref(false)
const proposalError = ref('')
const proposalSuccessUrl = ref('')
const proposalCopyStatus = ref('')
const proposalNotificationStatus = ref('')
const proposalDraft = ref<ProposalDraft>({
  session_format: 'online',
  meeting_url: '',
  offline_location_snapshot: '',
  message: '',
})

const createDraft = ref<CreateDraft>({
  start_date: '',
  start_time: '',
  duration_minutes: 60,
  session_format: 'online',
  meeting_url: '',
  offline_location_snapshot: '',
  guest_name: '',
  guest_email: '',
  price_amount: '',
})

const slotlessSessionDraft = ref<SlotlessSessionDraft>({
  start_date: '',
  start_time: '09:00',
  duration_minutes: 50,
  session_format: 'online',
  meeting_url: '',
  offline_location: '',
})

const isCreateOnline = computed(() => createDraft.value.session_format === 'online')
const isSlotlessSessionOnline = computed(() => slotlessSessionDraft.value.session_format === 'online')
const isProposalOnline = computed(() => proposalDraft.value.session_format === 'online')
const isGuestQuotaBlocked = computed(() => {
  const quota = guestQuota.value
  if (!quota) return false
  if (quota.guest_sessions_enabled === false) return true
  const used = quota.guest_sessions_used_in_period
  const limit = quota.guest_sessions_limit_per_period
  if (typeof used !== 'number' || typeof limit !== 'number') return false
  return Number.isFinite(used) && Number.isFinite(limit) && used >= limit
})
const guestQuotaSummary = computed(() => {
  const quota = guestQuota.value
  if (!quota) return ''
  if (quota.guest_sessions_enabled === false) return 'Сесії без реєстрації недоступні на вашому тарифі.'
  const used = quota.guest_sessions_quota?.used ?? quota.guest_sessions_used_in_period
  const limit = quota.guest_sessions_quota?.limit ?? quota.guest_sessions_limit_per_period
  const period = quota.guest_sessions_quota?.window_days ?? quota.guest_sessions_period_days
  if (typeof limit !== 'number') return 'Сесії без реєстрації доступні'
  if (typeof used !== 'number') return 'Сесії без реєстрації доступні'
  const periodLabel = typeof period === 'number' && Number.isFinite(period) ? period : 30
  return `Сесії без реєстрації: ${used} з ${limit} за останні ${periodLabel} днів`
})
const calendarRequestIds = computed(() => parseCalendarRequestIds(route.query.request_ids))
const calendarRequestIdSet = computed(() => new Set(calendarRequestIds.value))
const calendarHighlightedGuestRequests = computed(() =>
  guestRequests.value.filter((request) => calendarRequestIdSet.value.has(request.id))
)
const calendarRequestNotice = computed(() =>
  calendarHighlightedGuestRequests.value.length > 0 ? 'Показано запити з календаря' : ''
)
const calendarHighlightedRequestKey = computed(() =>
  calendarHighlightedGuestRequests.value.map((request) => request.id).join(',')
)
const declineConfirmationOpen = computed(() => declineConfirmation.value !== null)
const proposalOriginalSlotId = computed(() => {
  const request = proposalRequest.value
  if (!request) return null
  const snapshotId = request.slot?.id
  return typeof snapshotId === 'number' ? snapshotId : request.slot_id
})
const availableProposalSlots = computed(() => {
  const originalSlotId = proposalOriginalSlotId.value
  const unavailableStatuses = new Set(['booked', 'busy', 'occupied', 'cancelled', 'unavailable'])
  return proposalSlots.value
    .filter((slot) => {
      if (!slot || typeof slot.id !== 'number') return false
      if (originalSlotId !== null && slot.id === originalSlotId) return false
      if (slot.is_booked === true) return false
      const status = String(slot.status || '').trim().toLowerCase()
      if (unavailableStatuses.has(status)) return false
      const end = new Date(slot.end_at).getTime()
      return Number.isFinite(end) && end > Date.now()
    })
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
    .slice(0, 12)
})
const selectedProposalCountLabel = computed(() => `Обрано: ${selectedProposalSlotIds.value.length} з 3`)
const proposalSubmitDisabled = computed(() => {
  if (proposalSaving.value) return true
  if (selectedProposalSlotIds.value.length < 1) return true
  if (isProposalOnline.value) return !proposalDraft.value.meeting_url.trim()
  return !proposalDraft.value.offline_location_snapshot.trim()
})
const proposalSuccessHelper = computed(() => {
  const status = String(proposalNotificationStatus.value || '').toLowerCase()
  if (status === 'sent') {
    return 'Лист із посиланням надіслано на email клієнта. Посилання нижче можна скопіювати за потреби.'
  }
  if (status === 'failed') {
    return 'Email не вдалося надіслати. Скопіюйте посилання й надішліть клієнту вручну.'
  }
  return 'Скопіюйте посилання й надішліть клієнту через обраний канал.'
})

function formatQuotaDate(value: string | null | undefined) {
  const raw = String(value || '').trim()
  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dateOnly) return `${dateOnly[3]}.${dateOnly[2]}.${dateOnly[1]}`
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return ''
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed)
}

const guestQuotaMessage = computed(() => {
  const quota = guestQuota.value
  if (!quota) return ''
  if (quota.guest_sessions_enabled === false) {
    return 'Сесії без реєстрації недоступні на вашому тарифі.'
  }
  const used = quota.guest_sessions_quota?.used ?? quota.guest_sessions_used_in_period
  const limit = quota.guest_sessions_quota?.limit ?? quota.guest_sessions_limit_per_period
  const remaining = quota.guest_sessions_quota?.remaining ?? quota.guest_sessions_remaining
  if (typeof used !== 'number' || typeof limit !== 'number' || typeof remaining !== 'number') return ''
  const nextAvailableRaw = quota.guest_sessions_quota?.next_available_at ?? quota.guest_sessions_next_available_at
  const nextAvailable = formatQuotaDate(nextAvailableRaw)
  if (remaining <= 0) {
    return nextAvailable
      ? `Ліміт вичерпано. Наступне місце звільниться ${nextAvailable}.`
      : 'Ліміт вичерпано.'
  }
  return nextAvailable
    ? `Доступно ще ${remaining}. Найближче оновлення ліміту: ${nextAvailable}.`
    : `Доступно ще ${remaining}.`
})
const timeOptions = Array.from({ length: 24 * 4 }, (_, index) => {
  const minutes = index * 15
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0')
  const mins = String(minutes % 60).padStart(2, '0')
  return `${hours}:${mins}`
})
const slotlessTimeOptions = buildTenMinuteTimeOptions()

function formatDateTime(value: string | null | undefined) {
  return formatUkDateTimeCompact(value)
}

function formatRequestedSlotRange(request: GuestBookingRequestRecord) {
  if (!request.requested_slot_start) return '—'
  const endTime = formatUkTime(request.requested_slot_end, '')
  return endTime ? `${formatDateTime(request.requested_slot_start)}–${endTime}` : formatDateTime(request.requested_slot_start)
}

function parseCalendarRequestIds(value: unknown) {
  const rawValues = Array.isArray(value) ? value : [value]
  return rawValues
    .flatMap((item) => String(item || '').split(','))
    .map((item) => Number(item.trim()))
    .filter((id) => Number.isInteger(id) && id > 0)
}

function isPendingRequest(status: string | null | undefined) {
  return String(status || '').toLowerCase() === 'pending'
}

const hasPendingGuestRequests = computed(() => guestRequests.value.some((request) => isPendingRequest(request.status)))

function requestStatusLabel(request: GuestBookingRequestRecord) {
  const normalized = String(request.status || '').toLowerCase()
  if (normalized === 'pending') {
    if (!hasActiveTimeProposal(request)) return 'Потребує рішення'
    const notificationStatus = activeTimeProposalNotificationStatus(request)
    if (notificationStatus === 'sent') return 'Очікує відповідь клієнта'
    if (notificationStatus === 'failed' || notificationStatus === 'manual_required') return 'Потрібно надіслати посилання'
    return 'Очікує відповідь клієнта'
  }
  if (normalized === 'approved') return 'Погоджено'
  if (normalized === 'declined') return 'Відхилено'
  if (normalized === 'cancelled') return 'Скасовано'
  return request.status || '—'
}

function requestStatusClass(status: string | null | undefined) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'pending') return 'status-pill--warn'
  if (normalized === 'approved') return 'status-pill--ok'
  if (normalized === 'declined' || normalized === 'cancelled') return 'status-pill--danger'
  return 'status-pill--muted'
}

function requestOfferTypeLabel(request: GuestBookingRequestRecord) {
  switch (String(request.offer_type || '').toLowerCase()) {
    case 'standard':
      return 'Консультація'
    case 'intro':
      return 'Ознайомча сесія'
    case 'couple':
      return 'Парна консультація'
    default:
      return ''
  }
}

function contactChannelLabel(channel: string | null | undefined) {
  const normalized = String(channel || '').toLowerCase()
  if (normalized === 'email') return 'Ел. пошта'
  if (normalized === 'phone') return 'Телефон'
  if (normalized === 'telegram') return 'Telegram'
  if (normalized === 'viber') return 'Viber'
  return channel || 'Контакт'
}

function requestCompactContact(request: GuestBookingRequestRecord) {
  const email = requestClientEmail(request)
  const phone = requestClientPhone(request)
  const normalizedChannel = String(request.contact_channel || '').toLowerCase()
  const channelLabel = normalizedChannel ? contactChannelLabel(request.contact_channel) : email ? 'Ел. пошта' : phone ? 'Телефон' : 'Контакт'
  const value = email || phone || request.contact_value
  return value ? `${channelLabel} · ${value}` : channelLabel
}

function isEmailContactRequest(request: GuestBookingRequestRecord) {
  return String(request.contact_channel || '').toLowerCase() === 'email'
}

function requestDecisionAt(request: GuestBookingRequestRecord) {
  return request.approved_at || request.declined_at || request.cancelled_at
}

function requestDecisionLabel(status: string | null | undefined) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'approved') return 'Погоджено'
  if (normalized === 'declined') return 'Відхилено'
  if (normalized === 'cancelled') return 'Скасовано'
  return 'Оновлено'
}

function isSlotlessRequest(request: GuestBookingRequestRecord) {
  if (request.is_slotless_request === true) return true
  if (request.has_slot === false) return true
  return request.slot_id == null && !request.slot && !request.requested_slot_start && !request.requested_slot_end
}

function needsAlternativeTime(request: GuestBookingRequestRecord) {
  return isPendingRequest(request.status) && !isSlotlessRequest(request) && request.needs_alternative_time === true
}

function hasActiveTimeProposal(request: GuestBookingRequestRecord) {
  return Boolean(request.active_time_proposal_id && String(request.active_time_proposal_status || '').toLowerCase() === 'sent')
}

function canProposeAlternativeTime(request: GuestBookingRequestRecord) {
  return isPendingRequest(request.status) && !isSlotlessRequest(request) && !hasActiveTimeProposal(request)
}

function canApproveOriginalTime(request: GuestBookingRequestRecord) {
  return isPendingRequest(request.status) && !isSlotlessRequest(request) && !needsAlternativeTime(request) && !hasActiveTimeProposal(request)
}

function activeTimeProposalExpiresLabel(request: GuestBookingRequestRecord) {
  const raw = String(request.active_time_proposal_expires_at || '').trim()
  if (!raw) return ''
  return formatDateTime(raw)
}

function activeTimeProposalSummary(request: GuestBookingRequestRecord) {
  const notificationStatus = activeTimeProposalNotificationStatus(request)
  let summary = 'Пропозицію часу створено'
  if (notificationStatus === 'sent') {
    summary = 'Пропозицію часу надіслано на email клієнта.'
  } else if (notificationStatus === 'failed') {
    summary = 'Пропозицію часу створено, але email не вдалося надіслати.'
  } else if (isEmailContactRequest(request) && !notificationStatus) {
    summary = 'Пропозицію часу створено для email-контакту.'
  }
  const parts = [summary]
  const count = Number(request.active_time_proposal_options_count || 0)
  if (Number.isFinite(count) && count > 0) parts.push(`Варіантів: ${count}`)
  const expires = activeTimeProposalExpiresLabel(request)
  if (expires) parts.push(`Дійсна до ${expires}`)
  return parts.join(' · ')
}

function activeTimeProposalUrl(request: GuestBookingRequestRecord) {
  return latestProposalUrlByRequestId.value[request.id] || ''
}

function activeTimeProposalNotificationStatus(request: GuestBookingRequestRecord) {
  return String(latestProposalNotificationStatusByRequestId.value[request.id] || '').toLowerCase()
}

function requiresManualTimeProposalDelivery(request: GuestBookingRequestRecord) {
  const notificationStatus = activeTimeProposalNotificationStatus(request)
  if (notificationStatus === 'failed' || notificationStatus === 'manual_required') return true
  return !isEmailContactRequest(request) && notificationStatus !== 'sent'
}

function activeTimeProposalHelper(request: GuestBookingRequestRecord) {
  const notificationStatus = activeTimeProposalNotificationStatus(request)
  if (notificationStatus === 'failed') return 'Скопіюйте посилання й надішліть клієнту вручну.'
  if (isEmailContactRequest(request) && !notificationStatus) {
    return 'Активна пропозиція очікує відповіді клієнта.'
  }
  if (!requiresManualTimeProposalDelivery(request)) return ''
  return activeTimeProposalUrl(request)
    ? 'Скопіюйте посилання й надішліть клієнту через обраний канал.'
    : 'Активна пропозиція очікує відповіді клієнта.'
}

function shouldShowActiveTimeProposalCopyButton(request: GuestBookingRequestRecord) {
  return requiresManualTimeProposalDelivery(request) && Boolean(activeTimeProposalUrl(request))
}

async function copyActiveTimeProposalUrl(request: GuestBookingRequestRecord) {
  const url = activeTimeProposalUrl(request)
  if (!url) return
  await navigator.clipboard.writeText(url)
  activeProposalCopyRequestId.value = request.id
}

function requestClientName(request: GuestBookingRequestRecord) {
  return request.client_name || request.guest_name || 'Клієнт'
}

function requestClientEmail(request: GuestBookingRequestRecord) {
  if (request.client_email) return request.client_email
  return String(request.contact_channel || '').toLowerCase() === 'email' ? request.contact_value || '' : ''
}

function requestClientPhone(request: GuestBookingRequestRecord) {
  if (request.client_phone) return request.client_phone
  return String(request.contact_channel || '').toLowerCase() === 'phone' ? request.contact_value || '' : ''
}

function scheduleRouteForRequest(request: GuestBookingRequestRecord) {
  const query = new URLSearchParams({
    request_id: String(request.id),
    client_name: requestClientName(request),
    contact: request.contact_value || requestClientEmail(request) || requestClientPhone(request),
    format: request.session_format === 'offline' ? 'offline' : 'online',
    source: 'public_guest_request',
  })
  return `/cabinet/slots?${query.toString()}`
}

function requestTopicLabels(request: GuestBookingRequestRecord) {
  return (request.request_topics || []).map((topic) => requestTopicLabel(topic)).filter(Boolean)
}

function isRequestDetailsOpen(id: number) {
  return expandedRequestDetails.value[id] === true
}

function isCalendarHighlightedRequest(id: number) {
  return calendarRequestIdSet.value.has(id)
}

function setGuestRequestCardRef(id: number) {
  return (element: Element | ComponentPublicInstance | null) => {
    if (element instanceof HTMLElement) {
      guestRequestCardRefs.value[id] = element
      return
    }
    delete guestRequestCardRefs.value[id]
  }
}

function toggleRequestDetails(id: number) {
  expandedRequestDetails.value = {
    ...expandedRequestDetails.value,
    [id]: !expandedRequestDetails.value[id],
  }
}

function openDeclineRequestConfirmation(requestId: number, options?: { successMessage?: string }) {
  declineConfirmation.value = {
    requestId,
    successMessage: options?.successMessage,
  }
}

function closeDeclineRequestConfirmation() {
  declineConfirmation.value = null
}

async function confirmDeclineRequest() {
  const confirmation = declineConfirmation.value
  if (!confirmation) return
  closeDeclineRequestConfirmation()
  await declineRequest(confirmation.requestId, { successMessage: confirmation.successMessage })
}

let lastScrolledCalendarRequestKey = ''

async function scrollToCalendarRequestIfReady() {
  if (requestsLoading.value) return
  const firstRequest = calendarHighlightedGuestRequests.value[0]
  if (!firstRequest) return
  const requestKey = calendarHighlightedRequestKey.value
  if (!requestKey || requestKey === lastScrolledCalendarRequestKey) return

  expandedRequestDetails.value = {
    ...expandedRequestDetails.value,
    [firstRequest.id]: true,
  }
  await nextTick()
  guestRequestCardRefs.value[firstRequest.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  lastScrolledCalendarRequestKey = requestKey
}

watch(
  () => [calendarRequestIds.value.join(','), calendarHighlightedRequestKey.value, requestsLoading.value] as const,
  () => {
    if (!calendarRequestIds.value.length) lastScrolledCalendarRequestKey = ''
    void scrollToCalendarRequestIfReady()
  },
  { immediate: true }
)

function setRequestActionLoading(id: number, action: RequestActionType, value: boolean) {
  const next = { ...requestActionLoading.value }
  const current = { ...next[id] }
  current[action] = value
  if (!current.approve && !current.decline && !current['create-session'] && !current.proposal) {
    delete next[id]
  } else {
    next[id] = current
  }
  requestActionLoading.value = next
}

function isRequestActionLoading(id: number, action: RequestActionType) {
  return Boolean(requestActionLoading.value[id]?.[action])
}

function setRequestActionError(id: number, message: string) {
  const next = { ...requestActionErrors.value }
  const normalized = String(message || '').trim()
  if (normalized) {
    next[id] = normalized
  } else {
    delete next[id]
  }
  requestActionErrors.value = next
}

function requestActionError(id: number) {
  return requestActionErrors.value[id] || ''
}

function getApiErrorCode(err: unknown) {
  const data = (err as { response?: { data?: { code?: unknown; reason_code?: unknown } } })?.response?.data
  const code = data?.code || data?.reason_code
  return typeof code === 'string' ? code : ''
}

function apiErrorDetailText(err: unknown) {
  const data = (err as { response?: { data?: unknown } })?.response?.data
  if (data && typeof data === 'object' && 'detail' in data) {
    const detail = (data as { detail?: unknown }).detail
    if (Array.isArray(detail)) return String(detail[0] || '').trim()
    if (typeof detail === 'string') return detail.trim()
  }
  if (typeof data === 'string') return data.trim()
  const message = (err as { message?: unknown })?.message
  return typeof message === 'string' ? message.trim() : ''
}

function stripTechnicalErrorPrefix(message: string) {
  return String(message || '').trim().replace(/^detail:\s*/i, '')
}

function isPastSessionTimeErrorText(message: string) {
  const compact = stripTechnicalErrorPrefix(message).toLowerCase().replace(/\s+/g, ' ')
  return compact === 'session time is in the past.' || compact === 'session time is in the past'
}

function isPastIsoDateTime(value: string) {
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) && timestamp <= Date.now()
}

function localizeGuestQuotaCreateError(err: unknown, fallback: string) {
  const code = getApiErrorCode(err)
  if (code === 'GUEST_SESSIONS_LIMIT_REACHED') {
    const nextAvailableRaw =
      guestQuota.value?.guest_sessions_quota?.next_available_at ?? guestQuota.value?.guest_sessions_next_available_at
    const nextAvailable = formatQuotaDate(nextAvailableRaw)
    return nextAvailable
      ? `Ліміт вичерпано. Наступне місце звільниться ${nextAvailable}.`
      : 'Ліміт вичерпано.'
  }
  if (code === 'GUEST_SESSIONS_DISABLED') {
    return 'Сесії без реєстрації недоступні на вашому тарифі.'
  }
  return getApiErrorMessage(err, fallback)
}

function localizeGuestRequestActionError(message: string) {
  const normalized = stripTechnicalErrorPrefix(message)
  if (!normalized) return ''

  const compact = normalized.toLowerCase().replace(/\s+/g, ' ')
  if (isPastSessionTimeErrorText(normalized)) {
    return PAST_SESSION_TIME_ERROR_MESSAGE
  }
  if (compact === 'requested slot is no longer available.' || compact === 'requested slot is no longer available') {
    return 'Цей слот більше недоступний.'
  }

  return normalized
}

function localizeGuestRequestApiError(err: unknown, fallback: string) {
  const code = getApiErrorCode(err)
  const detailText = apiErrorDetailText(err)
  if (isPastSessionTimeErrorText(detailText)) {
    return PAST_SESSION_TIME_ERROR_MESSAGE
  }
  if (code === 'MANUAL_SESSION_TIME_CONFLICT' || code === 'SESSION_OVERLAP') {
    return 'Не вдалося створити сесію: цей час перетинається з іншою сесією або недоступністю.'
  }
  if (code === 'REQUEST_SLOT_REQUIRED_FOR_APPROVAL') {
    return 'Цей запит не має обраного часу. Узгодьте час із клієнтом і створіть сесію вручну.'
  }
  return localizeGuestRequestActionError(getApiErrorMessage(err, fallback))
}

function syncApproveMeetingDrafts(payload: GuestBookingRequestRecord[]) {
  const next: Record<number, string> = {}
  payload.forEach((request) => {
    if (
      isPendingRequest(request.status) &&
      !isSlotlessRequest(request) &&
      !needsAlternativeTime(request) &&
      request.session_format === 'online'
    ) {
      next[request.id] = approveMeetingUrls.value[request.id] || ''
    }
  })
  approveMeetingUrls.value = next
}

function syncRequestActionMeta(payload: GuestBookingRequestRecord[]) {
  const pendingIds = new Set(
    payload.filter((request) => isPendingRequest(request.status)).map((request) => request.id)
  )

  const nextErrors: Record<number, string> = {}
  Object.entries(requestActionErrors.value).forEach(([key, value]) => {
    const id = Number(key)
    if (pendingIds.has(id) && value) {
      nextErrors[id] = value
    }
  })
  requestActionErrors.value = nextErrors

  const nextLoading: Record<number, RequestActionLoadingState> = {}
  Object.entries(requestActionLoading.value).forEach(([key, value]) => {
    const id = Number(key)
    if (!pendingIds.has(id)) return
    const state = {
      approve: Boolean(value?.approve),
      decline: Boolean(value?.decline),
      'create-session': Boolean(value?.['create-session']),
      proposal: Boolean(value?.proposal),
    }
    if (state.approve || state.decline || state['create-session'] || state.proposal) {
      nextLoading[id] = state
    }
  })
  requestActionLoading.value = nextLoading
}

function isApproveRequestDisabled(request: GuestBookingRequestRecord) {
  if (!canApproveOriginalTime(request)) return true
  if (isRequestActionLoading(request.id, 'approve')) return true
  if (request.session_format !== 'online') return false
  return !String(approveMeetingUrls.value[request.id] || '').trim()
}

function shouldShowApproveMeetingHint(request: GuestBookingRequestRecord) {
  if (!canApproveOriginalTime(request)) return false
  if (request.session_format !== 'online') return false
  return !String(approveMeetingUrls.value[request.id] || '').trim()
}

function openDatePicker(event: Event) {
  const target = event.target as HTMLInputElement | null
  if (!target) return
  if (typeof target.showPicker === 'function') {
    try {
      target.showPicker()
    } catch {
      target.focus()
    }
    return
  }
  target.focus()
}

function normalizeTimeValue(value: string) {
  const trimmed = String(value || '').trim()
  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed)
  if (!match) return trimmed
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours > 23 || minutes > 59) return trimmed
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function normalizeCreateStartTime() {
  createDraft.value.start_time = normalizeTimeValue(createDraft.value.start_time)
}

function localDateInputValue(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function closeSlotlessDatePicker() {
  slotlessDatePickerRef.value?.closeCalendar()
}

function handleSlotlessModalPointerDown(event: PointerEvent) {
  const target = event.target as HTMLElement | null
  if (!target || target.closest('.date-picker-field')) return
  closeSlotlessDatePicker()
}

function updateSlotlessSessionDateValue(value: string) {
  slotlessSessionDateDisplay.value = value
  slotlessSessionDraft.value.start_date = parseDisplayDateToIso(value) || ''
}

function selectSlotlessDate(isoDate: string) {
  slotlessSessionDraft.value.start_date = isoDate
  slotlessSessionDateDisplay.value = formatIsoDateForDisplay(isoDate)
}

function combineDateTimeToIso(dateValue: string, timeValue: string) {
  if (!dateValue || !timeValue) return ''
  const normalizedTime = normalizeTimeValue(timeValue)
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(normalizedTime)) return ''
  const parsed = new Date(`${dateValue}T${normalizedTime}`)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString()
}

function normalizeSlotlessTimezone(value: string) {
  const normalized = String(value || '').trim()
  if (!normalized) return ''
  if (normalized === 'Europe/Kiev') return 'Europe/Kyiv'
  return normalized
}

function resolvedSlotlessSessionTimezone() {
  return (
    normalizeSlotlessTimezone(slotlessProfileTimezone.value) ||
    normalizeSlotlessTimezone(slotlessSessionTimezone.value) ||
    'Europe/Kyiv'
  )
}

function applySlotlessProfileDefaults(
  profile: Pick<SpecialistProfile, 'standard_session_duration_minutes'> & { timezone?: string | null }
) {
  const duration = Number(profile.standard_session_duration_minutes)
  const profileTimezone = normalizeSlotlessTimezone(String(profile.timezone || '').trim())
  if (Number.isFinite(duration) && duration > 0 && duration <= 480) {
    slotlessSessionDraft.value.duration_minutes = Math.round(duration)
  }
  if (profileTimezone) {
    slotlessProfileTimezone.value = profileTimezone
  }
}

async function loadSlotlessProfileDefaults() {
  if (slotlessProfileLoaded.value) return
  try {
    const profile = await fetchSpecialistProfile()
    applySlotlessProfileDefaults(profile)
  } catch {
    if (!Number.isFinite(slotlessSessionDraft.value.duration_minutes) || slotlessSessionDraft.value.duration_minutes <= 0) {
      slotlessSessionDraft.value.duration_minutes = 50
    }
  } finally {
    slotlessProfileLoaded.value = true
  }
}

function resetSlotlessSessionForm(request: GuestBookingRequestRecord) {
  const duration = Number(request.duration_minutes || slotlessSessionDraft.value.duration_minutes || 50)
  const startDate = localDateInputValue(new Date())
  slotlessSessionDraft.value = {
    start_date: startDate,
    start_time: '09:00',
    duration_minutes: Number.isFinite(duration) && duration > 0 ? Math.min(Math.round(duration), 480) : 50,
    session_format: request.session_format === 'offline' ? 'offline' : 'online',
    meeting_url: '',
    offline_location: request.offline_location_snapshot || '',
  }
  slotlessSessionDateDisplay.value = formatIsoDateForDisplay(startDate)
  slotlessSessionTimezone.value = resolvedSlotlessSessionTimezone()
  slotlessSessionError.value = ''
}

async function openSlotlessSessionModal(request: GuestBookingRequestRecord) {
  slotlessSessionRequest.value = request
  slotlessSessionModalOpen.value = true
  slotlessSessionSaving.value = false
  slotlessSessionError.value = ''
  resetSlotlessSessionForm(request)
  await loadSlotlessProfileDefaults()
  resetSlotlessSessionForm(request)
}

function closeSlotlessSessionModal() {
  if (slotlessSessionSaving.value) return
  slotlessSessionModalOpen.value = false
  slotlessSessionError.value = ''
  slotlessSessionRequest.value = null
  closeSlotlessDatePicker()
}

function validateSlotlessSessionDraft() {
  const isoDate = parseDisplayDateToIso(slotlessSessionDateDisplay.value)
  if (!isoDate) {
    return INVALID_SESSION_DATE_FORMAT_MESSAGE
  }
  slotlessSessionDraft.value.start_date = isoDate
  if (!slotlessTimeOptions.includes(slotlessSessionDraft.value.start_time)) {
    return INVALID_SESSION_TIME_FORMAT_MESSAGE
  }
  const startsAtIso = combineDateTimeToIso(
    isoDate,
    slotlessSessionDraft.value.start_time
  )
  if (!startsAtIso) return 'Вкажіть коректний час початку.'
  if (isPastIsoDateTime(startsAtIso)) return PAST_SESSION_TIME_ERROR_MESSAGE
  if (
    !Number.isFinite(slotlessSessionDraft.value.duration_minutes) ||
    slotlessSessionDraft.value.duration_minutes < 1
  ) {
    return 'Вкажіть коректну тривалість.'
  }
  return ''
}

function proposalSlotRange(slot: ProposalSlot) {
  const endTime = formatUkTime(slot.end_at, '')
  return endTime ? `${formatDateTime(slot.start_at)}–${endTime}` : formatDateTime(slot.start_at)
}

function isProposalSlotSelected(slotId: number) {
  return selectedProposalSlotIds.value.includes(slotId)
}

function canSelectProposalSlot(slotId: number) {
  return isProposalSlotSelected(slotId) || selectedProposalSlotIds.value.length < 3
}

function toggleProposalSlot(slotId: number) {
  if (proposalSaving.value) return
  if (isProposalSlotSelected(slotId)) {
    selectedProposalSlotIds.value = selectedProposalSlotIds.value.filter((id) => id !== slotId)
    return
  }
  if (selectedProposalSlotIds.value.length >= 3) return
  selectedProposalSlotIds.value = [...selectedProposalSlotIds.value, slotId]
}

function resetProposalModal(request: GuestBookingRequestRecord) {
  const requestFormat = String(request.session_format || '').toLowerCase() === 'offline' ? 'offline' : 'online'
  proposalRequest.value = request
  selectedProposalSlotIds.value = []
  proposalError.value = ''
  proposalSuccessUrl.value = ''
  proposalCopyStatus.value = ''
  proposalNotificationStatus.value = ''
  proposalDraft.value = {
    session_format: requestFormat,
    meeting_url: '',
    offline_location_snapshot: request.offline_location_snapshot || '',
    message: '',
  }
}

async function loadProposalSlots() {
  proposalSlotsLoading.value = true
  proposalSlotsError.value = ''
  try {
    const payload = await apiGet<ProposalSlot[]>('/cabinet/slots/')
    proposalSlots.value = Array.isArray(payload) ? payload : []
  } catch (err) {
    proposalSlots.value = []
    proposalSlotsError.value = getApiErrorMessage(err, 'Не вдалося завантажити вікна для пропозиції.')
  } finally {
    proposalSlotsLoading.value = false
  }
}

async function openTimeProposalModal(request: GuestBookingRequestRecord) {
  resetProposalModal(request)
  proposalModalOpen.value = true
  setRequestActionError(request.id, '')
  await loadProposalSlots()
}

function closeTimeProposalModal() {
  if (proposalSaving.value) return
  proposalModalOpen.value = false
  proposalRequest.value = null
  selectedProposalSlotIds.value = []
  proposalError.value = ''
  proposalSuccessUrl.value = ''
  proposalCopyStatus.value = ''
  proposalNotificationStatus.value = ''
}

function localizeTimeProposalError(err: unknown) {
  const code = getApiErrorCode(err)
  if (code === 'PROPOSED_SLOT_UNAVAILABLE') {
    return 'Одне з обраних вікон уже недоступне. Оновіть список і оберіть інший час.'
  }
  if (code === 'MEETING_URL_REQUIRED') return 'Додайте посилання на онлайн-зустріч.'
  if (code === 'OFFLINE_LOCATION_REQUIRED') return 'Додайте місце зустрічі.'
  if (code === 'INVALID_SESSION_FORMAT') return 'Оберіть формат сесії.'
  if (code === 'PUBLIC_GUEST_REQUEST_NOT_PENDING') return 'Цей запит уже закрито або вирішено.'
  return localizeGuestRequestActionError(getApiErrorMessage(err, 'Не вдалося створити пропозицію часу.')) || 'Не вдалося створити пропозицію часу.'
}

function markRequestTimeProposalCreated(
  requestId: number,
  proposal: {
    id?: number
    status?: string
    options_count?: number
    expires_at?: string | null
  }
) {
  guestRequests.value = guestRequests.value.map((request) =>
    request.id === requestId
      ? {
          ...request,
          active_time_proposal_id: proposal.id ?? request.active_time_proposal_id,
          active_time_proposal_status: proposal.status ?? 'sent',
          active_time_proposal_options_count: proposal.options_count ?? request.active_time_proposal_options_count,
          active_time_proposal_expires_at: proposal.expires_at ?? request.active_time_proposal_expires_at,
        }
      : request
  )
}

async function submitTimeProposal() {
  const request = proposalRequest.value
  if (!request) return
  proposalError.value = ''
  if (selectedProposalSlotIds.value.length < 1) {
    proposalError.value = 'Оберіть хоча б одне доступне вікно.'
    return
  }
  if (isProposalOnline.value && !proposalDraft.value.meeting_url.trim()) {
    proposalError.value = 'Додайте посилання на онлайн-зустріч.'
    return
  }
  if (!isProposalOnline.value && !proposalDraft.value.offline_location_snapshot.trim()) {
    proposalError.value = 'Додайте місце зустрічі.'
    return
  }

  proposalSaving.value = true
  setRequestActionLoading(request.id, 'proposal', true)
  setRequestActionError(request.id, '')
  try {
    const response = await createCabinetGuestBookingTimeProposal(request.id, {
      slot_ids: selectedProposalSlotIds.value,
      session_format: proposalDraft.value.session_format,
      message: proposalDraft.value.message.trim(),
      meeting_url: isProposalOnline.value ? proposalDraft.value.meeting_url.trim() : '',
      offline_location_snapshot: isProposalOnline.value ? '' : proposalDraft.value.offline_location_snapshot.trim(),
    })
    proposalSuccessUrl.value = response.proposal.proposal_url
    proposalNotificationStatus.value = String(response.proposal.client_notification_status || '')
    latestProposalUrlByRequestId.value[request.id] = response.proposal.proposal_url
    latestProposalNotificationStatusByRequestId.value[request.id] = String(response.proposal.client_notification_status || '')
    proposalCopyStatus.value = ''
    toast.success('Пропозицію часу створено.')
    await loadGuestRequests()
    markRequestTimeProposalCreated(request.id, response.proposal)
  } catch (err) {
    const message = localizeTimeProposalError(err)
    proposalError.value = message
    setRequestActionError(request.id, message)
  } finally {
    proposalSaving.value = false
    setRequestActionLoading(request.id, 'proposal', false)
  }
}

async function copyProposalUrl() {
  const url = proposalSuccessUrl.value
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
    proposalCopyStatus.value = 'Посилання скопійовано.'
  } catch {
    proposalCopyStatus.value = 'Не вдалося скопіювати посилання.'
  }
}

async function loadSessions() {
  listLoading.value = true
  listError.value = ''
  try {
    const payload = await fetchExternalSessions()
    sessions.value = (payload || [])
      .slice()
      .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
  } catch (err) {
    listError.value = getApiErrorMessage(err, 'Не вдалося завантажити сесії без реєстрації.')
    sessions.value = []
  } finally {
    listLoading.value = false
  }
}

async function loadGuestRequests() {
  requestsLoading.value = true
  requestsError.value = ''
  try {
    const payload = await fetchCabinetGuestBookingRequests()
    guestRequests.value = (payload || [])
      .slice()
      .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    syncRequestActionMeta(guestRequests.value)
    syncApproveMeetingDrafts(guestRequests.value)
  } catch (err) {
    requestsError.value = getApiErrorMessage(err, 'Не вдалося завантажити запити без реєстрації.')
    guestRequests.value = []
    approveMeetingUrls.value = {}
  } finally {
    requestsLoading.value = false
  }
}

async function loadGuestQuota() {
  try {
    const payload = await apiGet<GuestQuotaSnapshot>('/cabinet/entitlements/')
    guestQuota.value = payload && typeof payload === 'object' ? payload : null
  } catch {
    guestQuota.value = null
  }
}

function validateCreateDraft() {
  const startsAtIso = combineDateTimeToIso(createDraft.value.start_date, createDraft.value.start_time)
  if (!startsAtIso) return 'Вкажіть коректний час початку.'
  if (isPastIsoDateTime(startsAtIso)) return PAST_SESSION_TIME_ERROR_MESSAGE
  if (!Number.isFinite(createDraft.value.duration_minutes) || createDraft.value.duration_minutes < 1) {
    return 'Вкажіть коректну тривалість.'
  }
  if (isCreateOnline.value && !createDraft.value.meeting_url.trim()) {
    return 'Для онлайн-сесії додайте посилання на зустріч.'
  }
  if (!isCreateOnline.value && !createDraft.value.offline_location_snapshot.trim()) {
    return 'Для офлайн-сесії вкажіть локацію.'
  }
  return ''
}

async function submitCreate() {
  createError.value = ''
  if (isGuestQuotaBlocked.value) {
    createError.value =
      guestQuota.value?.guest_sessions_enabled === false
        ? 'Сесії без реєстрації недоступні на вашому тарифі.'
        : guestQuotaMessage.value || 'Ліміт сесій без реєстрації вичерпано.'
    return
  }
  const validationError = validateCreateDraft()
  if (validationError) {
    createError.value = validationError
    return
  }

  createPending.value = true
  try {
    const payload = {
      starts_at: combineDateTimeToIso(createDraft.value.start_date, createDraft.value.start_time),
      duration_minutes: createDraft.value.duration_minutes,
      session_format: createDraft.value.session_format,
      meeting_url: isCreateOnline.value ? createDraft.value.meeting_url.trim() || null : null,
      offline_location_snapshot: isCreateOnline.value
        ? null
        : createDraft.value.offline_location_snapshot.trim() || null,
      guest_name: createDraft.value.guest_name.trim() || null,
      guest_email: createDraft.value.guest_email.trim() || null,
      price_amount: String(createDraft.value.price_amount ?? '').trim() || null,
      price_currency: 'UAH',
    }

    const created = await createExternalSession(payload)

    try {
      await createExternalSessionInvite(created.id)
      toast.success('Сесію без реєстрації створено. Посилання для клієнта готове.')
    } catch (inviteErr) {
      toast.warning(
        getApiErrorMessage(
          inviteErr,
          'Сесію без реєстрації створено, але посилання для клієнта не вдалося створити автоматично. Його можна створити в деталях сесії.'
        )
      )
    }

    await Promise.all([loadSessions(), loadGuestQuota()])
    await router.push(`/cabinet/external-sessions/${created.id}`)
  } catch (err) {
    createError.value = localizeGuestQuotaCreateError(err, 'Не вдалося створити сесію без реєстрації.')
    const code = getApiErrorCode(err)
    if (code === 'GUEST_SESSIONS_LIMIT_REACHED' || code === 'GUEST_SESSIONS_DISABLED') {
      await loadGuestQuota()
    }
  } finally {
    createPending.value = false
  }
}

async function approveRequest(request: GuestBookingRequestRecord) {
  if (!isPendingRequest(request.status)) return
  if (isSlotlessRequest(request)) {
    setRequestActionError(
      request.id,
      'Цей запит не має обраного часу. Узгодьте час із клієнтом і створіть сесію вручну.'
    )
    return
  }
  if (needsAlternativeTime(request)) {
    setRequestActionError(request.id, 'Цей час уже зайнятий. Запропонуйте клієнту інший час.')
    return
  }
  if (hasActiveTimeProposal(request)) {
    setRequestActionError(request.id, 'Очікуємо відповідь клієнта на активну пропозицію часу.')
    return
  }
  setRequestActionError(request.id, '')
  const meetingUrl = String(approveMeetingUrls.value[request.id] || '').trim()
  if (request.session_format === 'online' && !meetingUrl) {
    setRequestActionError(request.id, 'Для онлайн-запиту перед погодженням додайте посилання на зустріч.')
    return
  }

  setRequestActionLoading(request.id, 'approve', true)
  try {
    await confirmCabinetGuestBookingRequestSession(
      request.id,
      request.session_format === 'online' ? { meeting_url: meetingUrl } : {}
    )
    toast.success('Запит погоджено. Сесію створено.')
    await Promise.all([loadGuestRequests(), loadSessions()])
  } catch (err) {
    setRequestActionError(request.id, localizeGuestRequestApiError(err, 'Не вдалося погодити запит без реєстрації.'))
  } finally {
    setRequestActionLoading(request.id, 'approve', false)
  }
}

async function declineRequest(requestId: number, options?: { successMessage?: string }) {
  setRequestActionError(requestId, '')
  setRequestActionLoading(requestId, 'decline', true)
  try {
    await declineCabinetGuestBookingRequest(requestId)
    toast.success(options?.successMessage || 'Запит без реєстрації відхилено.')
    await loadGuestRequests()
  } catch (err) {
    setRequestActionError(requestId, localizeGuestRequestApiError(err, 'Не вдалося відхилити запит без реєстрації.'))
  } finally {
    setRequestActionLoading(requestId, 'decline', false)
  }
}

async function submitSlotlessSession() {
  const request = slotlessSessionRequest.value
  if (!request) return

  slotlessSessionError.value = ''
  const validationError = validateSlotlessSessionDraft()
  if (validationError) {
    slotlessSessionError.value = validationError
    return
  }

  const startsAtIso = combineDateTimeToIso(
    slotlessSessionDraft.value.start_date,
    slotlessSessionDraft.value.start_time
  )
  const duration = Number(slotlessSessionDraft.value.duration_minutes)
  const endsAtIso = new Date(new Date(startsAtIso).getTime() + duration * 60000).toISOString()

  slotlessSessionSaving.value = true
  setRequestActionError(request.id, '')
  setRequestActionLoading(request.id, 'create-session', true)
  try {
    await createSessionFromCabinetGuestBookingRequest(request.id, {
      starts_at: startsAtIso,
      ends_at: endsAtIso,
      timezone: resolvedSlotlessSessionTimezone(),
      session_format: slotlessSessionDraft.value.session_format,
      meeting_url: slotlessSessionDraft.value.meeting_url.trim(),
      offline_location: slotlessSessionDraft.value.offline_location.trim(),
    })
    slotlessSessionSaving.value = false
    closeSlotlessSessionModal()
    toast.success('Запит погоджено. Сесію створено.')
    await Promise.all([loadGuestRequests(), loadSessions()])
  } catch (err) {
    const message = localizeGuestRequestApiError(err, 'Не вдалося створити сесію.')
    slotlessSessionError.value = message
    setRequestActionError(request.id, message)
  } finally {
    slotlessSessionSaving.value = false
    setRequestActionLoading(request.id, 'create-session', false)
  }
}

onMounted(async () => {
  await Promise.all([loadSessions(), loadGuestRequests(), loadGuestQuota()])
})
</script>

<style scoped>
.external-sessions {
  display: grid;
  gap: 18px;
}

.external-sessions__hero {
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

.external-sessions__hero > * {
  position: relative;
  z-index: 1;
}

.external-sessions__hero::after {
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

.external-sessions__title {
  margin: 8px 0 8px;
  color: var(--pc-navy-950);
  font-size: 32px;
  line-height: 1.15;
}

.external-sessions__subtitle {
  max-width: 520px;
  color: var(--pc-text-muted);
  line-height: 1.55;
}


.external-sessions__hero .btn {
  border-radius: var(--pc-radius-control);
  font-weight: 700;
}

.external-sessions__hero .btn--ghost {
  border-color: var(--pc-border);
  background: #fff;
  color: var(--pc-navy-900);
}

.panel {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-panel);
  padding: 18px;
  background: #fff;
  box-shadow: var(--pc-shadow-soft);
  display: grid;
  gap: 14px;
}

.external-sessions__operational {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  align-items: start;
}

.external-sessions--requests-first .external-sessions__operational {
  display: contents;
}

.external-sessions--requests-first .external-sessions__guest-requests-panel {
  order: 1;
}

.external-sessions--requests-first .external-sessions__create-panel {
  order: 2;
}

.external-sessions--requests-first .external-sessions__sessions-panel {
  order: 3;
}

.external-sessions__guest-requests-panel {
  scroll-margin-top: 18px;
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
}

.form-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
}

.actions-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.form-grid .input,
.request-meeting-field .input {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
}

.actions-row .btn:not(.btn--ghost) {
  border-color: var(--pc-navy-900);
  border-radius: var(--pc-radius-control);
  background: linear-gradient(180deg, var(--pc-navy-900), var(--pc-navy-950));
  color: #fff;
  font-weight: 700;
}

.quota-summary {
  display: grid;
  gap: 8px;
  align-items: start;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
  background: color-mix(in srgb, var(--pc-blue-soft) 48%, #ffffff);
  padding: 12px;
  color: var(--pc-navy-900);
}

.quota-summary--blocked {
  border-color: color-mix(in srgb, var(--pc-danger, #b42318) 30%, var(--pc-border));
  background: color-mix(in srgb, #fff1f1 70%, #ffffff);
}

.quota-summary__title {
  font-weight: 700;
}

.quota-summary__message {
  color: var(--pc-text-muted);
  line-height: 1.5;
}

.quota-summary__link {
  justify-self: start;
}

.actions-row .btn:not(.btn--ghost):hover,
.actions-row .btn:not(.btn--ghost):focus-visible {
  border-color: var(--pc-navy-950);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--pc-navy-900) 92%, #000000),
    var(--pc-navy-950)
  );
  color: #fff;
}

.list-grid {
  display: grid;
  gap: 12px;
}

.calendar-request-notice {
  width: fit-content;
  border: 1px solid color-mix(in srgb, var(--pc-navy-900) 18%, var(--pc-border));
  border-radius: var(--pc-radius-control);
  background: color-mix(in srgb, var(--pc-blue-soft) 66%, #ffffff);
  color: var(--pc-navy-900);
  padding: 8px 10px;
  font-size: 13px;
  font-weight: 700;
}

.session-card {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-card);
  padding: 12px;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.session-card__main {
  display: grid;
  gap: 6px;
}

.session-card__time {
  font-weight: 700;
}

.session-card > .btn--ghost {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
  background: #fff;
  color: var(--pc-navy-900);
  box-shadow: none;
  font-weight: 700;
}

.session-card > .btn--ghost:hover,
.session-card > .btn--ghost:focus-visible {
  border-color: color-mix(in srgb, var(--pc-navy-900) 24%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-primary-soft) 55%, #ffffff);
  color: var(--pc-navy-900);
}

.request-card {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-card);
  padding: 12px;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.request-card--highlighted {
  border-color: color-mix(in srgb, var(--pc-navy-900) 30%, var(--pc-border));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--pc-blue-soft) 72%, transparent);
}

.request-card__main {
  display: grid;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.request-card__title {
  font-weight: 700;
}

.request-card__summary {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.request-card__summary-main {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.request-card__requested-time {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
  color: var(--pc-text-muted);
}

.request-card__requested-time strong {
  color: var(--pc-navy-900);
  font-weight: 700;
}

.request-card__meta-grid {
  display: grid;
  gap: 6px 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.request-card__meta-grid .muted {
  min-width: 0;
  overflow-wrap: anywhere;
}

.request-card__status-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.request-card__details {
  display: grid;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid var(--pc-border);
}

.request-details-toggle {
  flex: 0 0 auto;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
  background: #fff;
  color: var(--pc-navy-900);
  box-shadow: none;
  font-weight: 700;
}

.request-card__helper {
  max-width: 620px;
  color: var(--pc-text-muted);
  line-height: 1.45;
}

.request-card__helper--warning {
  color: #8a4b00;
  font-weight: 700;
}

.request-topic-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.request-topic-chip {
  padding: 4px 8px;
  border: 1px solid color-mix(in srgb, var(--pc-navy-900) 16%, var(--pc-border));
  border-radius: var(--pc-radius-control);
  background: color-mix(in srgb, var(--pc-blue-soft) 58%, #ffffff);
  color: var(--pc-navy-900);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
}

.request-actions {
  flex: 0 0 240px;
  min-width: 240px;
  display: grid;
  gap: 8px;
}

.request-meeting-field {
  margin-bottom: 2px;
}

.request-meeting-hint {
  margin-top: -2px;
}

.request-next-step {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.request-invite-helper {
  flex-basis: 100%;
  line-height: 1.4;
}

.request-card__error {
  margin-top: 2px;
}

.status-pill {
  width: fit-content;
  padding: 6px 10px;
  border: 1px solid transparent;
  border-radius: var(--pc-radius-control);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 700;
}

.status-pill--ok {
  border-color: color-mix(in srgb, var(--pc-navy-900) 20%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-blue-soft) 76%, #ffffff);
  color: var(--pc-navy-900);
}

.status-pill--warn {
  border-color: color-mix(in srgb, var(--pc-yellow-600, #d9a441) 32%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-yellow-soft) 72%, #ffffff);
  color: var(--pc-navy-900);
}

.status-pill--danger {
  border-color: color-mix(in srgb, #b42318 28%, var(--pc-border));
  background: color-mix(in srgb, #fff1f1 80%, #ffffff);
  color: #9f1d15;
}

.status-pill--muted {
  border-color: color-mix(in srgb, var(--pc-navy-900) 14%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-surface) 88%, #ffffff);
  color: var(--pc-text-muted);
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: var(--radius-sm);
  padding: 8px 10px;
}

.external-price-currency__value {
  display: flex;
  align-items: center;
  min-height: 40px;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
  color: var(--text);
  background: #f8fafc;
  cursor: default;
}

.request-session-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 18px;
}

.request-session-modal__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(17, 24, 39, 0.48);
}

.request-session-modal__content {
  position: relative;
  z-index: 1;
  width: min(860px, calc(100vw - 36px));
  max-height: calc(100vh - 36px);
  overflow: visible;
  display: grid;
  gap: 16px;
  padding: 18px;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-card);
  background: #fff;
  box-shadow: var(--pc-shadow-soft);
}

.request-session-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.request-session-form {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.request-session-form__wide {
  grid-column: 1 / -1;
}

.time-proposal-modal {
  overflow: auto;
}

.time-proposal-context {
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
  background: color-mix(in srgb, var(--pc-blue-soft) 56%, #ffffff);
}

.time-proposal-options {
  display: grid;
  gap: 8px;
}

.time-proposal-format {
  border: 0;
  padding: 0;
  margin: 0;
}

.time-proposal-format legend {
  margin: 0 0 8px;
  color: var(--pc-navy-900);
  font-weight: 700;
}

.segmented-control {
  display: inline-flex;
  width: fit-content;
  overflow: hidden;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
  background: #fff;
}

.segmented-control label {
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  padding: 0 14px;
  cursor: pointer;
  color: var(--pc-muted);
  font-weight: 700;
}

.segmented-control label + label {
  border-left: 1px solid var(--pc-border);
}

.segmented-control input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.segmented-control label:has(input:checked) {
  background: color-mix(in srgb, var(--pc-blue-soft) 70%, #ffffff);
  color: var(--pc-navy-950);
}

.time-proposal-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
  background: #fff;
  color: var(--pc-navy-900);
  cursor: pointer;
  font-weight: 700;
}

.time-proposal-option--selected {
  border-color: color-mix(in srgb, var(--pc-navy-900) 30%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-blue-soft) 70%, #ffffff);
}

.time-proposal-option input {
  width: 16px;
  height: 16px;
}

.time-proposal-empty,
.time-proposal-success {
  display: grid;
  gap: 10px;
}

.time-proposal-success h3 {
  margin: 0;
  color: var(--pc-navy-950);
}

@media (max-width: 1100px) {
  .external-sessions__operational {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .external-sessions__hero {
    flex-direction: column;
    align-items: flex-start;
    padding: 14px 16px;
    gap: 10px;
  }

  .external-sessions__hero::after {
    display: none;
  }

  .external-sessions__title {
    font-size: 26px;
    margin: 4px 0;
    line-height: 1.16;
  }

  .external-sessions__subtitle {
    margin: 0;
    font-size: 13px;
    line-height: 1.32;
    max-width: 100%;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .session-card {
    flex-direction: column;
  }

  .request-card {
    flex-direction: column;
  }

  .request-card__summary {
    flex-direction: column;
  }

  .request-card__meta-grid {
    grid-template-columns: 1fr;
  }

  .request-details-toggle {
    width: 100%;
  }

  .request-actions {
    min-width: unset;
    width: 100%;
  }

  .request-session-form {
    grid-template-columns: 1fr;
  }

  .request-session-modal__content {
    width: min(520px, 100%);
    overflow: auto;
  }

  .request-session-modal__header {
    flex-direction: column;
  }
}
</style>
