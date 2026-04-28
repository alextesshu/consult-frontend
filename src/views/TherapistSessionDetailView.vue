<template>
  <section class="session-detail">
    <header class="detail-hero">
      <div>
        <div class="badge">Сесія спеціаліста</div>
        <h1 class="title detail-title">Деталі сесії</h1>
        <p class="muted detail-subtitle">
          Повний контекст по сесії, дії зі статусом, перенос і приватні нотатки в одному місці.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet/sessions">Назад до списку</RouterLink>
    </header>

    <div v-if="error" class="form-error">{{ error }}</div>
    <LoadingSkeleton v-if="loading" variant="list" :count="3" />

    <template v-else-if="session">
      <section class="panel panel--summary">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Статус</div>
            <h2 class="panel__title">{{ statusLabel(session) }}</h2>
          </div>
          <div class="summary-actions">
            <button
              class="btn btn--sm"
              type="button"
              :disabled="actionLoading || session.status !== 'SCHEDULED'"
              @click="confirmSession"
            >
              Підтвердити
            </button>
            <button
              v-if="session.status === 'CONFIRMED'"
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="actionLoading"
              @click="openCompletionModal"
            >
              Завершити
            </button>
            <button
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="actionLoading || !canCancel(session.status)"
              @click="cancelSession"
            >
              Скасувати
            </button>
            <button
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="actionLoading || !canReschedule(session.status)"
              @click="toggleReschedulePanel"
            >
              {{ showReschedulePanel ? 'Сховати перенос' : 'Перенести' }}
            </button>
            <button
              v-if="canShowRecurringAction(session)"
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="actionLoading"
              @click="toggleRecurringPanel"
            >
              {{ showRecurringPanel ? 'Сховати серію' : 'Повторювати щотижня' }}
            </button>
            <button
              v-if="!isManualClientSession"
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="actionLoading || quickAddPending"
              @click="openSessionPracticeBoardModal"
            >
              {{ quickAddPending ? 'Додаємо…' : 'Додати на дошку' }}
            </button>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-card">
            <div class="detail-label">Початок</div>
            <div class="detail-value">{{ formatDateTime(sessionStartAt(session)) }}</div>
          </div>
          <div class="detail-card">
            <div class="detail-label">Тривалість</div>
            <div class="detail-value">{{ formatDuration(sessionStartAt(session), sessionEndAt(session)) }}</div>
          </div>
          <div class="detail-card">
            <div class="detail-label">Формат</div>
            <div class="detail-value">Формат: {{ sessionFormatLabel }}</div>
            <div v-if="offlineLocation" class="muted detail-meta">Локація: {{ offlineLocation }}</div>
          </div>
          <div class="detail-card">
            <div class="detail-label">Клієнт</div>
            <div class="detail-value">
              {{ clientLabel(session) }}
              <div v-if="isManualClientSession" class="manual-client-detail">
                <span class="status-pill status-pill--manual">Без кабінету</span>
                <span class="muted detail-meta">
                  Цю сесію створено для клієнта без кабінету. Підключення кабінету дасть клієнту доступ до власних сесій, нагадувань, оплати та комунікації зі спеціалістом.
                </span>
              </div>
              <div v-if="session.client_email" class="muted detail-meta">{{ session.client_email }}</div>
              <div v-if="session.client" class="muted detail-meta">ID: #{{ session.client }}</div>
            </div>
          </div>
          <div class="detail-card">
            <div class="detail-label">Поточний стан</div>
            <div class="detail-value">
              <div class="status-pill" :class="statusClass(session)">
                {{ statusLabel(session) }}
              </div>
              <div v-if="timeUntilLabel(session)" class="status-pill status-pill--warn">
                Початок через {{ timeUntilLabel(session) }}
              </div>
            </div>
          </div>
        </div>
        <div
          v-if="!isOfflineSession && (meetingUrl || isEditingMeetingLink || ['SCHEDULED', 'CONFIRMED'].includes(session.status))"
          ref="meetingCardRef"
          class="meeting-card"
          :class="{ 'meeting-card--attention': needsMeetingLinkAttention, 'meeting-card--focused': meetingLinkFocused }"
        >
          <div v-if="!isEditingMeetingLink">
            <div class="detail-label">Онлайн-зустріч</div>
            <div class="detail-value">{{ meetingProvider }}</div>
            <div class="muted detail-meta">{{ meetingSetupHint }}</div>
            <div v-if="needsMeetingLinkAttention" class="meeting-card__attention">
              <span class="status-pill status-pill--warn">Потрібно додати посилання</span>
            </div>
          </div>
          <div v-else class="field" style="width: 100%">
            <label for="meeting-link-input" class="detail-label">Посилання на онлайн-зустріч</label>
            <input
              id="meeting-link-input"
              v-model="meetingLinkDraft"
              class="input"
              placeholder="https://meet.google.com/... або https://zoom.us/..."
            />
            <div class="muted detail-meta">
              Вставте повне посилання на зустріч. Після збереження клієнт побачить кнопку «Приєднатися».
            </div>
          </div>
          <div class="meeting-card__actions">
            <template v-if="!isEditingMeetingLink">
              <a
                v-if="canJoinMeeting"
                class="btn btn--sm"
                :href="meetingUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                Приєднатися
              </a>
              <button v-if="meetingUrl" class="btn btn--ghost btn--sm" type="button" @click="copyMeetingLink">
                Скопіювати посилання
              </button>
              <button
                v-if="session && ['SCHEDULED', 'CONFIRMED'].includes(session.status)"
                :class="meetingUrl || !needsMeetingLinkAttention ? 'btn btn--ghost btn--sm' : 'btn btn--sm'"
                type="button"
                @click="toggleEditMeetingLink"
              >
                {{ meetingUrl ? 'Змінити посилання' : 'Додати посилання' }}
              </button>
            </template>
            <template v-else>
              <button
                class="btn btn--sm"
                type="button"
                :disabled="actionLoading"
                @click="saveMeetingLink"
              >
                Зберегти
              </button>
              <button
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="actionLoading"
                @click="toggleEditMeetingLink"
              >
                Скасувати
              </button>
            </template>
          </div>
        </div>
        <div v-else-if="isOfflineSession" class="meeting-card">
          <div>
            <div class="detail-label">Офлайн-сесія</div>
            <div class="detail-value">{{ offlineLocation || 'Локацію узгоджено зі спеціалістом.' }}</div>
            <div class="muted detail-meta">Для офлайн-формату посилання для приєднання не використовується.</div>
          </div>
        </div>
      </section>

      <section
        v-if="postSessionContext && session.status === 'COMPLETED' && !workspaceHasAnyAction"
        class="panel panel--next-step"
      >
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Після сесії</div>
            <h2 class="panel__title">Наступні кроки</h2>
          </div>
        </div>
        <div class="next-step-rail">
          <button v-if="canUseClientAccountFeatures" class="btn btn--sm" type="button" @click="openPostSessionWorkbook">
            Відкрити робочий зошит
          </button>
          <RouterLink v-if="canUseClientAccountFeatures" class="btn btn--ghost btn--sm" :to="postSessionClientLink">
            Відкрити клієнта
          </RouterLink>
          <RouterLink
            v-if="postSessionNextSession"
            class="btn btn--ghost btn--sm"
            :to="`/cabinet/sessions/${postSessionNextSession.id}`"
          >
            Наступна сесія: {{ formatDateTime(postSessionNextSession.slot_start_at) }}
          </RouterLink>
          <RouterLink class="btn btn--ghost btn--sm" to="/cabinet/sessions">
            Повернутись до списку
          </RouterLink>
        </div>
      </section>

      <section v-if="workspacePanelVisible" class="panel panel--workspace" data-testid="session-workspace">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Робочий простір</div>
            <h2 class="panel__title">Стан після сесії</h2>
            <p class="muted workspace-panel__hint">Стани нижче показують саме наявність вмісту.</p>
          </div>
        </div>

        <div class="workspace-summary">
          <article
            v-for="item in workspaceSummaryItems"
            :key="item.key"
            class="workspace-summary__item"
            :data-testid="`workspace-summary-${item.key}`"
          >
            <div class="workspace-summary__meta">
              <div class="workspace-summary__label">{{ item.title }}</div>
              <div v-if="item.updatedAtLabel" class="workspace-summary__updated muted">
                Оновлено: {{ item.updatedAtLabel }}
              </div>
            </div>
            <div class="status-pill" :class="item.pillClass">{{ item.statusLabel }}</div>
          </article>
        </div>

        <div v-if="workspaceHasAnyAction" class="workspace-actions" data-testid="workspace-actions">
          <section
            v-if="workspaceRequiredActions.length"
            class="workspace-actions__zone workspace-actions__zone--required"
            data-testid="workspace-zone-required"
          >
            <div class="workspace-actions__title">Потрібно зараз</div>
            <div class="workspace-actions__secondary">
              <button
                v-for="action in workspaceRequiredActions"
                :key="action.id"
                class="btn btn--sm"
                type="button"
                :data-testid="`workspace-action-${action.id}`"
                @click="action.run"
              >
                {{ action.label }}
              </button>
            </div>
          </section>
          <section
            v-if="workspaceRecommendedActions.length"
            class="workspace-actions__zone"
            data-testid="workspace-zone-recommended"
          >
            <div class="workspace-actions__title">Рекомендовано далі</div>
            <div class="workspace-actions__secondary">
              <button
                v-for="action in workspaceRecommendedActions"
                :key="action.id"
                class="btn btn--ghost btn--sm"
                type="button"
                :data-testid="`workspace-action-${action.id}`"
                @click="action.run"
              >
                {{ action.label }}
              </button>
            </div>
          </section>
          <section
            v-if="workspaceCapabilityActions.length"
            class="workspace-actions__zone"
            data-testid="workspace-zone-capability"
          >
            <div class="workspace-actions__title">Доступні дії</div>
            <div class="workspace-actions__secondary">
              <button
                v-for="action in workspaceCapabilityActions"
                :key="action.id"
                class="btn btn--ghost btn--sm"
                type="button"
                :data-testid="`workspace-action-${action.id}`"
                @click="action.run"
              >
                {{ action.label }}
              </button>
            </div>
          </section>
        </div>

        <div v-else class="muted" data-testid="workspace-no-pending">Немає дій у цьому блоці.</div>

        <div class="next-step-rail" data-testid="workspace-navigation-rail">
          <button
            v-if="canUseClientAccountFeatures"
            class="btn btn--ghost btn--sm"
            type="button"
            @click="openPostSessionWorkbook"
          >
            До робочого зошита
          </button>
          <button class="btn btn--ghost btn--sm" type="button" @click="focusSessionNote">
            До нотатки
          </button>
          <button class="btn btn--ghost btn--sm" type="button" @click="focusPaymentBlock">
            До блоку оплати
          </button>
          <RouterLink v-if="canUseClientAccountFeatures" class="btn btn--ghost btn--sm" :to="postSessionClientLink">
            До картки клієнта
          </RouterLink>
          <RouterLink class="btn btn--ghost btn--sm" to="/cabinet/sessions">
            До списку сесій
          </RouterLink>
        </div>
      </section>

      <section v-if="!isManualClientSession" ref="paymentPanelRef" class="panel">
        <SessionPaymentProofBlock
          :session-id="session.id"
          role="specialist"
          :payment-proof="session.payment_proof"
          @updated="onPaymentProofUpdated"
          @payment-details-missing="onPaymentDetailsMissing"
        />
        <div v-if="paymentProofActionError" class="payment-proof-error">
          <p>{{ paymentProofActionError }}</p>
          <button class="btn btn--ghost btn--sm" type="button" @click="openPaymentDetailsSettings">
            Перейти до реквізитів для оплати
          </button>
        </div>
      </section>

      <section v-else ref="paymentPanelRef" class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Оплата</div>
            <h2 class="panel__title">Оплата сесії</h2>
          </div>
          <span class="status-pill" :class="manualPaymentStatusClass">
            {{ manualPaymentStatusLabel }}
          </span>
        </div>

        <div v-if="manualPaymentError" class="payment-proof-error">
          <p>{{ manualPaymentError }}</p>
        </div>

        <div class="manual-payment-card">
          <div>
            <div class="detail-label">Клієнт без кабінету</div>
            <p class="muted manual-payment-card__text">
              Для клієнта без кабінету оплата ведеться вручну. Після перевірки надходження можна позначити сесію оплаченою.
            </p>
            <p v-if="manualPaymentAmountLabel" class="manual-payment-card__amount">
              {{ manualPaymentAmountLabel }}
            </p>

            <div class="manual-price-editor">
              <button
                v-if="!manualPriceEditing"
                class="btn btn--ghost btn--sm"
                type="button"
                @click="startManualPriceEdit"
              >
                Редагувати ціну
              </button>

              <div v-else class="manual-price-editor__form">
                <label class="field manual-price-editor__field">
                  Вартість сесії, грн
                  <input
                    v-model.trim="manualPriceDraft"
                    class="input"
                    type="text"
                    inputmode="decimal"
                    placeholder="Наприклад, 1600"
                  />
                </label>

                <div v-if="manualPriceError" class="form-error">
                  {{ manualPriceError }}
                </div>

                <div class="manual-price-editor__actions">
                  <button
                    class="btn btn--sm"
                    type="button"
                    :disabled="manualPriceSubmitDisabled"
                    @click="saveManualSessionPrice"
                  >
                    {{ manualPriceSaving ? 'Зберігаємо…' : 'Зберегти ціну' }}
                  </button>
                  <button
                    class="btn btn--ghost btn--sm"
                    type="button"
                    :disabled="manualPriceSaving"
                    @click="cancelManualPriceEdit"
                  >
                    Скасувати
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="manual-payment-card__actions">
            <button
              v-if="!manualPaymentPaid"
              class="btn btn--sm"
              type="button"
              :disabled="manualPaymentSaving"
              @click="markManualSessionPaymentPaid"
            >
              {{ manualPaymentSaving ? 'Підтверджуємо…' : 'Позначити оплаченою' }}
            </button>
          </div>
        </div>
        <div
          v-if="shouldShowPaymentResolutionBlock"
          class="payment-resolution-card"
          :class="{
            'payment-resolution-card--pending': !paymentResolutionIsResolved || paymentResolutionEditVisible,
            'payment-resolution-card--resolved': paymentResolutionIsResolved && !paymentResolutionEditVisible,
          }"
        >
          <div class="payment-resolution-card__header">
            <div>
              <div class="detail-label">Оплата після скасування</div>
              <h3 class="payment-resolution-card__title">{{ paymentResolutionLabel }}</h3>
            </div>
          </div>

          <p class="muted payment-resolution-card__text">
            {{ paymentResolutionDescription }}
          </p>

          <div v-if="paymentResolutionError" class="form-error">
            {{ paymentResolutionError }}
          </div>

          <p
            v-if="paymentResolutionIsResolved && session?.payment_resolution_note && !paymentResolutionEditVisible"
            class="payment-resolution-card__note-text"
          >
            {{ session.payment_resolution_note }}
          </p>

          <template v-if="paymentResolutionEditVisible">
            <label class="field payment-resolution-card__note">
              Коментар щодо рішення
              <textarea
                v-model.trim="paymentResolutionNote"
                class="input"
                rows="3"
                placeholder="Наприклад: повернено на картку, зараховано на наступну зустріч або залишено за домовленістю."
              ></textarea>
            </label>

            <div class="payment-resolution-card__actions">
              <button
                v-for="action in ['refunded', 'credited', 'retained']"
                :key="action"
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="Boolean(paymentResolutionSaving)"
                @click="savePaymentResolution(action as PaymentResolutionAction)"
              >
                {{
                  paymentResolutionSaving === action
                    ? 'Зберігаємо…'
                    : paymentResolutionActionLabel(action as PaymentResolutionAction)
                }}
              </button>
              <button
                v-if="paymentResolutionIsResolved"
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="Boolean(paymentResolutionSaving)"
                @click="cancelPaymentResolutionEditing"
              >
                Скасувати зміну
              </button>
            </div>
          </template>

          <div v-else-if="paymentResolutionIsResolved" class="payment-resolution-card__actions">
            <button class="btn btn--ghost btn--sm" type="button" @click="startPaymentResolutionEditing">
              Змінити рішення
            </button>
          </div>

          <p v-if="session?.payment_resolution_updated_at" class="muted payment-resolution-card__updated">
            Оновлено: {{ formatDateTime(session.payment_resolution_updated_at) }}
          </p>
        </div>
      </section>

      <section v-if="sessionRequests.length" class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Запити</div>
            <h2 class="panel__title">Запити на перенос</h2>
          </div>
        </div>
        <div v-if="requestsLoading" class="muted">Завантаження запитів...</div>
        <div v-else class="request-list">
          <article v-for="request in sessionRequests" :key="request.id" class="request-card">
            <div class="request-main">
              <div class="request-title">
                {{ request.client_name || request.client_username || 'Клієнт' }}
              </div>
              <div v-if="request.client_email" class="muted">{{ request.client_email }}</div>
              <div class="muted">
                Запитане вікно:
                <span v-if="request.requested_slot_start_at && request.requested_slot_end_at">
                  {{ formatDateTime(request.requested_slot_start_at) }}
                  ·
                  {{ formatDuration(request.requested_slot_start_at, request.requested_slot_end_at) }}
                </span>
                <span v-else>#{{ request.requested_slot_id }}</span>
              </div>
              <div class="status-pill" :class="requestStatusClass(request.status)">
                {{ rescheduleStatusLabel(request.status) }}
              </div>
            </div>
            <div v-if="request.status === 'PENDING'" class="request-actions">
              <button
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="isRequestLoading(request.id)"
                @click="approveRequest(request.id)"
              >
                Погодити
              </button>
              <button
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="isRequestLoading(request.id)"
                @click="declineRequest(request.id)"
              >
                Відхилити
              </button>
            </div>
          </article>
        </div>
      </section>

      <section v-if="showReschedulePanel" class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Перенесення</div>
            <h2 class="panel__title">Новий слот для сесії</h2>
          </div>
        </div>
        <div class="muted">
          Оберіть доступне вікно або скористайтеся рекомендованими варіантами переносу.
        </div>
        <div class="suggestions-block">
          <div class="muted suggestions-title">Рекомендовані варіанти</div>
          <div v-if="suggestionsLoading" class="muted">Завантаження рекомендацій...</div>
          <div v-else-if="rescheduleSuggestions.length === 0" class="muted">
            Для цієї сесії зараз немає окремих рекомендацій.
          </div>
          <div v-else class="suggestions-list">
            <button
              v-for="item in rescheduleSuggestions.slice(0, 5)"
              :key="item.slot_id"
              class="btn btn--ghost btn--sm suggestion-btn"
              :class="{ 'suggestion-btn--active': selectedSuggestionSlotId === item.slot_id }"
              type="button"
              :disabled="actionLoading"
              @click="selectSuggestedSlot(item.slot_id)"
            >
              <span>{{ formatDateTime(item.start_at) }} · {{ formatDuration(item.start_at, item.end_at) }}</span>
              <span class="muted suggestion-meta">{{ suggestionReasonLabel(item.reason_tag) }}</span>
            </button>
          </div>
          <button
            v-if="selectedSuggestionSlotId"
            class="btn btn--sm"
            type="button"
            :disabled="actionLoading"
            @click="submitSelectedSuggestion"
          >
            Підтвердити перенос
          </button>
        </div>

        <div v-if="slotsLoading" class="muted">Завантаження слотів...</div>
        <div v-else-if="availableSlots.length === 0" class="muted">Немає доступних слотів для переносу.</div>
        <div v-else class="slot-list">
          <article v-for="slot in availableSlots" :key="slot.id" class="slot-card">
            <div>
              <div class="slot-time">{{ formatDateTime(slot.start_at) }}</div>
              <div class="muted">{{ formatDuration(slot.start_at, slot.end_at) }}</div>
            </div>
            <button
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="actionLoading"
              @click="submitReschedule(slot.id)"
            >
              Перенести сюди
            </button>
          </article>
        </div>
      </section>

      <section v-if="showRecurringPanel" class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Серія</div>
            <h2 class="panel__title">Створити повторювані сесії</h2>
          </div>
        </div>
        <div class="recurring-grid">
          <label class="field">
            <span class="muted">Кількість повторів</span>
            <select v-model="recurringPreset" class="input input--select">
              <option :value="4">4 тижні</option>
              <option :value="8">8 тижнів</option>
              <option :value="12">12 тижнів</option>
              <option value="custom">Власне число</option>
            </select>
          </label>
          <label v-if="recurringPreset === 'custom'" class="field">
            <span class="muted">Власне число</span>
            <input
              v-model.number="recurringCustomOccurrences"
              class="input"
              type="number"
              min="1"
              max="52"
              step="1"
              placeholder="Наприклад, 6"
            />
          </label>
        </div>
        <div class="recurring-actions">
          <button class="btn btn--sm" type="button" :disabled="actionLoading" @click="submitRecurring">
            Створити серію
          </button>
        </div>
        <div v-if="recurringResult" class="recurring-result">
          <div class="status-pill status-pill--ok">
            Створено {{ recurringResult.created_count ?? 0 }} сесій
          </div>
          <div v-if="(recurringResult.skipped_count ?? 0) > 0" class="status-pill status-pill--warn">
            Пропущено {{ recurringResult.skipped_count ?? 0 }} через конфлікти
          </div>
          <div v-if="(recurringResult.created_dates || []).length" class="recurring-list">
            <div class="muted">Створені дати:</div>
            <ul class="recurring-ul">
              <li v-for="date in recurringResult.created_dates" :key="date">{{ formatDateTime(date) }}</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Нотатки</div>
            <h2 class="panel__title">Приватна історія по сесії</h2>
          </div>
          <div class="note-header-actions">
            <button
              v-if="canUseClientAccountFeatures"
              class="btn btn--ghost btn--sm"
              type="button"
              @click="openCurrentClientWorkbook"
            >
              &#1042;&#1110;&#1076;&#1082;&#1088;&#1080;&#1090;&#1080;&#32;&#1074;&#32;&#1086;&#1082;&#1088;&#1077;&#1084;&#1086;&#1084;&#1091;&#32;&#1074;&#1110;&#1082;&#1085;&#1110;
            </button>
          </div>
        </div>
        <div v-if="noteLoading" class="muted">Завантаження нотатки...</div>
        <div v-else-if="!noteOpen" class="note-panel note-panel--collapsed">
          <div>
            <div class="note-title">Приватна нотатка</div>
            <span class="note-badge">Зашифровано</span>
            <p class="note-helper muted">Приватна нотатка прихована. Доступ має лише спеціаліст.</p>
          </div>
          <div class="note-actions">
            <button class="btn btn--sm" type="button" @click="openPrivateNote">
              Відкрити нотатку
            </button>
          </div>
        </div>
        <div v-else class="note-panel">
          <label class="field">
            <span class="note-title">Приватна нотатка</span>
            <span class="note-badge">Зашифровано</span>
            <textarea
              ref="noteTextareaRef"
              v-model="noteDraft"
              class="input note-textarea"
              rows="6"
              placeholder="Короткий коментар по сесії та важливі спостереження."
            ></textarea>
            <span class="note-helper muted">Доступ до нотатки має лише спеціаліст.</span>
          </label>
          <div class="note-actions">
            <button class="btn btn--sm" type="button" :disabled="noteSaving" @click="saveNote">
              Зберегти
            </button>
            <button class="btn btn--ghost btn--sm" type="button" :disabled="noteSaving" @click="closePrivateNote">
              Закрити нотатку
            </button>
          </div>
        </div>
      </section>
    </template>

    <section v-else class="panel">
      <EmptyState
        title="Сесію не знайдено"
        :description="pageError || 'Перевірте посилання або поверніться до списку сесій.'"
        action-text="До списку сесій"
        action-to="/cabinet/sessions"
      />
    </section>

    <SessionCompletionModal
      :open="completionModalOpen"
      v-model="completionDurationDraft"
      :loading="actionLoading"
      :planned-duration-minutes="completionPlannedDuration"
      :error-message="completionDurationError"
      @confirm="submitCompletion"
      @cancel="closeCompletionModal"
    />
    <PracticeBoardQuickAddModal
      :open="quickAddModalOpen"
      :pending="quickAddPending"
      :error="quickAddModalError"
      subtitle="Сформулюйте наступний крок по цій сесії."
      @cancel="closeSessionPracticeBoardModal"
      @submit="submitSessionPracticeBoardQuickAdd"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  apiGet,
  apiPatch,
  apiPost,
  updateSpecialistSessionMeeting,
  type SessionFormat,
  type SessionPaymentProof,
} from '../lib/api'
import {
  BOOKING_ERROR_FALLBACKS,
  BOOKING_SUCCESS_MESSAGES,
  getBookingErrorMessage,
} from '../lib/bookingCopy'
import {
  approveSpecialistRescheduleRequest as approveSpecialistRescheduleRequestAction,
  canCancel as sharedCanCancel,
  canReschedule as sharedCanReschedule,
  canShowRecurringAction as sharedCanShowRecurringAction,
  cancelSpecialistSession as cancelSpecialistSessionAction,
  clientLabel as getClientLabel,
  completeSpecialistSession as completeSpecialistSessionAction,
  confirmSpecialistSession as confirmSpecialistSessionAction,
  createRecurringSpecialistSessions as createRecurringSpecialistSessionsAction,
  declineSpecialistRescheduleRequest as declineSpecialistRescheduleRequestAction,
  findNextUpcomingSession as getNextUpcomingSession,
  fetchSpecialistAvailableSlots as fetchSpecialistAvailableSlotsData,
  fetchSpecialistRescheduleRequests as fetchSpecialistRescheduleRequestsData,
  fetchSpecialistRescheduleSuggestions as fetchSpecialistRescheduleSuggestionsData,
  fetchSpecialistSessionNoteContent as fetchSpecialistSessionNoteContentData,
  formatSessionDateTime as sharedFormatSessionDateTime,
  formatSessionDuration as sharedFormatSessionDuration,
  parseActualDurationInput as getActualDurationPayload,
  parseRecurringOccurrences as getRecurringOccurrences,
  requestStatusClass as getRequestStatusClass,
  rescheduleSpecialistSession as rescheduleSpecialistSessionAction,
  rescheduleStatusLabel as getRescheduleStatusLabel,
  saveSpecialistSessionNote as saveSpecialistSessionNoteAction,
  sessionDurationMinutes as getSessionDurationMinutes,
  sessionEndAt as getSessionEndAt,
  sessionStartAt as getSessionStartAt,
  statusClass as getStatusClass,
  statusLabel as getStatusLabel,
  suggestedActualDurationInput as getSuggestedActualDurationInput,
  suggestionReasonLabel as getSuggestionReasonLabel,
  timeUntilLabel as getTimeUntilLabel,
  type SpecialistRecurringSummary,
  type SpecialistRescheduleRequest,
  type SpecialistRescheduleSuggestion,
  type SpecialistSlot } from '../lib/specialistSessions'
import {
  externalMeetingHint,
  externalMeetingProviderLabel,
  normalizeMeetingUrl,
} from '../lib/sessionExecution'
import { openClientWorkbookWindow } from '../lib/workbookWindow'
import { useToast } from '../composables/useToast'
import EmptyState from '../components/EmptyState.vue'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'
import PracticeBoardQuickAddModal from '../components/PracticeBoardQuickAddModal.vue'
import SessionCompletionModal from '../components/SessionCompletionModal.vue'
import SessionPaymentProofBlock from '../components/SessionPaymentProofBlock.vue'
import {
  createPracticeBoardItem,
  fetchPracticeBoards,
  resolveDefaultPracticeBoardId,
} from '../lib/specialistPracticeBoard'
import {
  noteContentStateLabel as getNoteContentStateLabel,
  workbookContentStateLabel as getWorkbookContentStateLabel,
} from '../lib/noteWorkbookCopy'

type SessionSlot = {
  start_at?: string | null
  end_at?: string | null
}

type WorkspacePaymentState = 'paid' | 'awaiting_confirmation' | 'unpaid' | 'not_applicable' | string
type WorkspaceNoteState = 'hidden' | 'missing' | 'draft' | 'completed' | string
type WorkspaceWorkbookState = 'hidden' | 'missing' | 'draft' | 'completed' | string
type WorkspaceDomain = 'payment' | 'note' | 'workbook'
type WorkspaceClassification = 'required' | 'recommended' | 'capability'
type WorkspaceUrgency = 'urgent' | 'normal' | 'low'
type WorkspaceBlockingScope = 'session' | 'client' | 'workspace' | 'none'
type WorkspaceActionCode =
  | 'OPEN_NOTE'
  | 'CONTINUE_NOTE'
  | 'COMPLETE_NOTE'
  | 'OPEN_WORKBOOK'
  | 'CONTINUE_WORKBOOK'
  | 'COMPLETE_WORKBOOK'
  | 'REVIEW_PAYMENT'
  | 'REQUEST_PAYMENT_PROOF'
  | 'UPLOAD_PAYMENT_PROOF'
  | 'CONFIRM_PAYMENT'
  | 'MARK_PAYMENT_PAID'
  | 'REQUEST_PAYMENT_CLARIFICATION'
  | 'COMPLETE_PAYMENT_REVIEW'

type SessionWorkspaceItem = string | {
  code?: string | null
  label?: string | null
  title?: string | null
  name?: string | null
  priority?: string | null
  classification?: string | null
  urgency?: string | null
  blocking_scope?: string | null
}

type SessionWorkspace = {
  session_id?: number | null
  lifecycle_status?: string | null
  payment_state?: WorkspacePaymentState | null
  note_state?: WorkspaceNoteState | null
  workbook_state?: WorkspaceWorkbookState | null
  payment_updated_at?: string | null
  note_updated_at?: string | null
  workbook_updated_at?: string | null
  permissions?: Record<string, unknown> | null
  available_action_items?: SessionWorkspaceItem[] | null
  pending_task_items?: SessionWorkspaceItem[] | null
  available_actions?: SessionWorkspaceItem[] | null
  pending_tasks?: SessionWorkspaceItem[] | null
}

type SessionDetail = {
  id: number
  status: string
  client: number | null
  client_user_id?: number | null
  client_record_id?: number | null
  client_display_name?: string | null
  client_username?: string | null
  client_name?: string | null
  client_email?: string | null
  client_has_account?: boolean | null
  client_source?: string | null
  client_identity_type?: string | null
  therapist: number
  session_format?: SessionFormat | null
  offline_location?: string | null
  therapist_username?: string | null
  meeting_mode?: 'ONLINE' | 'OFFLINE'
  meeting_url?: string | null
  meeting_provider?: string | null
  meeting_link_ready?: boolean
  join_available?: boolean
  join_starts_at?: string | null
  join_ends_at?: string | null
  slot?: SessionSlot | number | null
  slot_start_at?: string | null
  slot_end_at?: string | null
  price_amount?: string | number | null
  price_currency?: string | null
  payment_proof?: SessionPaymentProof | null
  payment_resolution_state?: 'pending' | 'refunded' | 'credited' | 'retained' | string | null
  payment_resolution_note?: string | null
  payment_resolution_updated_at?: string | null
  workspace?: SessionWorkspace | null
}

type PaymentResolutionState = 'pending' | 'refunded' | 'credited' | 'retained' | null
type PaymentResolutionAction = 'refunded' | 'credited' | 'retained'

type PostSessionContext = {
  sessionId: number
  clientId: number | null
}

type WorkspaceSummaryItem = {
  key: WorkspaceDomain
  title: string
  statusLabel: string
  pillClass: string
  updatedAtLabel: string
}

type WorkspaceAction = {
  id: string
  label: string
  priority: number
  classification: WorkspaceClassification
  urgency: WorkspaceUrgency
  blockingScope: WorkspaceBlockingScope
  run: () => void | Promise<void>
}

const WORKSPACE_ACTION_PRIORITY: Partial<Record<WorkspaceActionCode, number>> = {
  COMPLETE_PAYMENT_REVIEW: 5,
  MARK_PAYMENT_PAID: 8,
  REQUEST_PAYMENT_CLARIFICATION: 9,
  COMPLETE_NOTE: 10,
  CONTINUE_NOTE: 10,
  REQUEST_PAYMENT_PROOF: 15,
  OPEN_NOTE: 20,
  COMPLETE_WORKBOOK: 30,
  CONTINUE_WORKBOOK: 30,
  OPEN_WORKBOOK: 40,
  REVIEW_PAYMENT: 5,
  UPLOAD_PAYMENT_PROOF: 45,
  CONFIRM_PAYMENT: 50,
}

const WORKSPACE_ACTION_LABEL: Record<WorkspaceActionCode, string> = {
  OPEN_NOTE: 'Відкрити нотатку',
  CONTINUE_NOTE: 'Продовжити нотатку',
  COMPLETE_NOTE: 'Заповнити нотатку',
  OPEN_WORKBOOK: 'Відкрити робочий зошит',
  CONTINUE_WORKBOOK: 'Продовжити робочий зошит',
  COMPLETE_WORKBOOK: 'Заповнити робочий зошит',
  REVIEW_PAYMENT: 'Перевірити оплату',
  REQUEST_PAYMENT_PROOF: 'Запросити підтвердження оплати',
  UPLOAD_PAYMENT_PROOF: 'Відкрити блок оплати',
  CONFIRM_PAYMENT: 'Відкрити блок оплати',
  MARK_PAYMENT_PAID: 'Позначити як оплачено',
  REQUEST_PAYMENT_CLARIFICATION: 'Запросити уточнення щодо оплати',
  COMPLETE_PAYMENT_REVIEW: 'Перевірити оплату',
}

const WORKSPACE_LEGACY_ENGLISH_LABELS: Record<WorkspaceActionCode, Set<string>> = {
  OPEN_NOTE: new Set(['open note']),
  CONTINUE_NOTE: new Set(['continue note']),
  COMPLETE_NOTE: new Set(['complete note']),
  OPEN_WORKBOOK: new Set(['open workbook']),
  CONTINUE_WORKBOOK: new Set(['continue workbook']),
  COMPLETE_WORKBOOK: new Set(['complete workbook']),
  REVIEW_PAYMENT: new Set(['review payment', 'do payment review']),
  REQUEST_PAYMENT_PROOF: new Set(['request payment proof']),
  UPLOAD_PAYMENT_PROOF: new Set(['upload payment proof']),
  CONFIRM_PAYMENT: new Set(['confirm payment']),
  MARK_PAYMENT_PAID: new Set(['mark payment paid']),
  REQUEST_PAYMENT_CLARIFICATION: new Set([
    'request payment clarification',
    'request payment clarifications',
  ]),
  COMPLETE_PAYMENT_REVIEW: new Set(['complete payment review']),
}

const KNOWN_WORKSPACE_ACTION_CODES = new Set<WorkspaceActionCode>([
  'OPEN_NOTE',
  'CONTINUE_NOTE',
  'COMPLETE_NOTE',
  'OPEN_WORKBOOK',
  'CONTINUE_WORKBOOK',
  'COMPLETE_WORKBOOK',
  'REVIEW_PAYMENT',
  'REQUEST_PAYMENT_PROOF',
  'UPLOAD_PAYMENT_PROOF',
  'CONFIRM_PAYMENT',
  'MARK_PAYMENT_PAID',
  'REQUEST_PAYMENT_CLARIFICATION',
  'COMPLETE_PAYMENT_REVIEW',
])

const route = useRoute()
const router = useRouter()
const toast = useToast()
const sessionId = computed(() => Number(route.params.id))
const hasValidSessionId = computed(() => Number.isInteger(sessionId.value) && sessionId.value > 0)
const session = ref<SessionDetail | null>(null)
const loading = ref(false)
const error = ref('')
const pageError = ref('')
const actionLoading = ref(false)
const completionModalOpen = ref(false)
const completionDurationDraft = ref('')
const completionDurationError = ref('')
const noteLoading = ref(false)
const noteSaving = ref(false)
const noteOpen = ref(false)
const noteDraft = ref('')
const noteTextareaRef = ref<HTMLTextAreaElement | null>(null)
const slotsLoading = ref(false)
const availableSlots = ref<SpecialistSlot[]>([])
const suggestionsLoading = ref(false)
const rescheduleSuggestions = ref<SpecialistRescheduleSuggestion[]>([])
const selectedSuggestionSlotId = ref<number | null>(null)
const requestsLoading = ref(false)
const rescheduleRequests = ref<SpecialistRescheduleRequest[]>([])
const requestLoading = ref<Set<number>>(new Set())
const showReschedulePanel = ref(false)
const showRecurringPanel = ref(false)
const recurringPreset = ref<number | 'custom'>(4)
const recurringCustomOccurrences = ref<number | ''>('')
const recurringResult = ref<SpecialistRecurringSummary | null>(null)
const postSessionContext = ref<PostSessionContext | null>(null)
const postSessionNextSession = ref<Pick<SessionDetail, 'id' | 'status' | 'slot' | 'slot_start_at'> | null>(null)
const isEditingMeetingLink = ref(false)
const meetingLinkDraft = ref('')
const paymentProofActionError = ref('')
const paymentPanelRef = ref<HTMLElement | null>(null)
const manualPaymentSaving = ref(false)
const manualPaymentError = ref('')
const paymentResolutionSaving = ref<PaymentResolutionAction | null>(null)
const paymentResolutionError = ref('')
const paymentResolutionNote = ref('')
const paymentResolutionEditing = ref(false)
const manualPriceEditing = ref(false)
const manualPriceDraft = ref('')
const manualPriceSaving = ref(false)
const manualPriceError = ref('')
const meetingCardRef = ref<HTMLElement | null>(null)
const meetingLinkFocused = ref(false)
const quickAddPending = ref(false)
const quickAddModalOpen = ref(false)
const quickAddModalError = ref('')

function normalizeSessionFormat(detail: SessionDetail | null): SessionFormat {
  if (!detail) return 'online'
  if (detail.session_format === 'offline') return 'offline'
  if (detail.session_format === 'online') return 'online'
  if (detail.meeting_mode === 'OFFLINE') return 'offline'
  return 'online'
}

const sessionFormat = computed<SessionFormat>(() => normalizeSessionFormat(session.value))
const isOfflineSession = computed(() => sessionFormat.value === 'offline')
const sessionFormatLabel = computed(() => (isOfflineSession.value ? 'Офлайн' : 'Онлайн'))
const offlineLocation = computed(() => {
  if (!isOfflineSession.value) return ''
  return (session.value?.offline_location || '').trim()
})
const meetingUrl = computed(() => normalizeMeetingUrl(session.value?.meeting_url))
const canJoinMeeting = computed(() =>
  Boolean(!isOfflineSession.value && session.value?.join_available && meetingUrl.value)
)
const meetingProvider = computed(() =>
  externalMeetingProviderLabel(session.value?.meeting_provider, meetingUrl.value)
)
const meetingHint = computed(() => {
  if (!session.value || !meetingUrl.value) return ''
  return externalMeetingHint(session.value)
})
const meetingSetupHint = computed(() => {
  if (meetingHint.value) return meetingHint.value
  return 'Додайте посилання на Google Meet, Zoom або іншу платформу для онлайн-зустрічі.'
})

const needsMeetingLinkAttention = computed(() =>
  Boolean(session.value && !isOfflineSession.value && session.value.status === 'CONFIRMED' && !meetingUrl.value)
)

const isManualClientSession = computed(() => {
  const detail = session.value
  if (!detail) return false
  if (detail.client_identity_type === 'manual') return true
  if (detail.client_source === 'manual') return true
  return detail.client_has_account === false && Boolean(detail.client_record_id)
})

const canUseClientAccountFeatures = computed(() => Boolean(session.value?.client && !isManualClientSession.value))

const postSessionClientLink = computed(() => {
  const clientId = postSessionContext.value?.clientId ?? session.value?.client ?? null
  if (!clientId) return '/cabinet/clients'
  return `/cabinet/clients?client=${clientId}&autoOpen=1`
})

const sessionRequests = computed(() =>
  session.value ? rescheduleRequests.value.filter((item) => item.session_id === session.value?.id) : []
)

const workspace = computed<SessionWorkspace | null>(() => session.value?.workspace || null)

const manualPaymentProof = computed(() => session.value?.payment_proof || null)

const manualPaymentPaid = computed(() => {
  return String(manualPaymentProof.value?.status || '').toUpperCase() === 'MARKED_PAID'
})

const manualPaymentStatusLabel = computed(() => {
  return manualPaymentPaid.value ? 'Оплачено' : 'Не оплачено'
})

const manualPaymentStatusClass = computed(() => {
  return manualPaymentPaid.value ? 'status-pill--ok' : 'status-pill--muted'
})

const manualPaymentAmountLabel = computed(() => {
  const amount = session.value?.price_amount
  if (amount === null || amount === undefined || amount === '') return ''

  const currency = String(session.value?.price_currency || 'UAH').toUpperCase()
  const numericAmount = Number(amount)
  const formattedAmount = Number.isFinite(numericAmount)
    ? new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 }).format(numericAmount)
    : String(amount)

  return `${formattedAmount} ${currency === 'UAH' ? 'грн' : currency}`
})

const paymentResolutionState = computed<PaymentResolutionState>(() => {
  const value = String(session.value?.payment_resolution_state || '').toLowerCase()

  if (value === 'pending') return 'pending'
  if (value === 'refunded') return 'refunded'
  if (value === 'credited') return 'credited'
  if (value === 'retained') return 'retained'

  return null
})

const shouldShowPaymentResolutionBlock = computed(() => {
  return Boolean(paymentResolutionState.value)
})

const paymentResolutionIsResolved = computed(() => {
  return ['refunded', 'credited', 'retained'].includes(paymentResolutionState.value || '')
})

const paymentResolutionEditVisible = computed(() => {
  if (paymentResolutionState.value === 'pending') return true
  return paymentResolutionIsResolved.value && paymentResolutionEditing.value
})

const paymentResolutionLabel = computed(() => {
  if (paymentResolutionState.value === 'pending') return 'Потребує рішення щодо оплати'
  if (paymentResolutionState.value === 'refunded') return 'Оплату повернено'
  if (paymentResolutionState.value === 'credited') return 'Зараховано на майбутню сесію'
  if (paymentResolutionState.value === 'retained') return 'Оплату залишено за домовленістю'

  return ''
})

const paymentResolutionDescription = computed(() => {
  if (paymentResolutionState.value === 'pending') {
    return 'Сесію скасовано, але оплату було підтверджено. Оберіть, як обробити оплату.'
  }

  if (paymentResolutionState.value === 'refunded') {
    return 'Спеціаліст позначив оплату як повернену клієнту.'
  }

  if (paymentResolutionState.value === 'credited') {
    return 'Оплату позначено як зараховану на майбутню сесію.'
  }

  if (paymentResolutionState.value === 'retained') {
    return 'Оплату позначено як залишену за домовленістю.'
  }

  return ''
})

function paymentResolutionActionLabel(action: PaymentResolutionAction) {
  if (action === 'refunded') return 'Позначити як повернену'
  if (action === 'credited') return 'Зарахувати на майбутню сесію'
  if (action === 'retained') return 'Залишити за домовленістю'

  return 'Зберегти рішення'
}

function syncPaymentResolutionDraft(detail: SessionDetail | null) {
  paymentResolutionNote.value = detail?.payment_resolution_note || ''
  paymentResolutionEditing.value = false
  paymentResolutionError.value = ''
}

function startPaymentResolutionEditing() {
  if (!paymentResolutionIsResolved.value) return
  paymentResolutionNote.value = session.value?.payment_resolution_note || ''
  paymentResolutionError.value = ''
  paymentResolutionEditing.value = true
}

function cancelPaymentResolutionEditing() {
  paymentResolutionNote.value = session.value?.payment_resolution_note || ''
  paymentResolutionError.value = ''
  paymentResolutionEditing.value = false
}

const manualPriceSubmitDisabled = computed(() => {
  return manualPriceSaving.value || !session.value
})

const workspacePanelVisible = computed(() => Boolean(workspace.value))

const workspacePaymentState = computed<WorkspacePaymentState | null>(() => workspace.value?.payment_state || null)
const workspaceNoteState = computed<WorkspaceNoteState | null>(() => workspace.value?.note_state || null)
const workspaceWorkbookState = computed<WorkspaceWorkbookState | null>(() => workspace.value?.workbook_state || null)

const workspaceSummaryItems = computed<WorkspaceSummaryItem[]>(() => {
  if (!workspace.value) return []

  const items: WorkspaceSummaryItem[] = []
  const paymentState = workspacePaymentState.value
  const noteState = workspaceNoteState.value
  const workbookState = workspaceWorkbookState.value

  if (!isManualClientSession.value && paymentState && paymentState !== 'not_applicable') {
    items.push({
      key: 'payment',
      title: 'Оплата',
      statusLabel: paymentStateLabel(paymentState),
      pillClass: paymentStateClass(paymentState),
      updatedAtLabel: formatWorkspaceUpdatedAt(workspace.value.payment_updated_at),
    })
  }

  if (noteState) {
    items.push({
      key: 'note',
      title: 'Нотатка',
      statusLabel: noteStateLabel(noteState),
      pillClass: noteStateClass(noteState),
      updatedAtLabel: formatWorkspaceUpdatedAt(workspace.value.note_updated_at),
    })
  }

  if (!isManualClientSession.value && workbookState) {
    items.push({
      key: 'workbook',
      title: 'Робочий зошит',
      statusLabel: workbookStateLabel(workbookState),
      pillClass: noteStateClass(workbookState),
      updatedAtLabel: formatWorkspaceUpdatedAt(workspace.value.workbook_updated_at),
    })
  }

  return items
})

type WorkspaceSurface = 'pending' | 'available'
type NormalizedWorkspaceActionItem = {
  code: string
  label: string
  classification: WorkspaceClassification
  urgency: WorkspaceUrgency
  blockingScope: WorkspaceBlockingScope
}

const WORKSPACE_URGENCY_ORDER: Record<WorkspaceUrgency, number> = {
  urgent: 0,
  normal: 1,
  low: 2,
}

const workspacePendingItems = computed<NormalizedWorkspaceActionItem[]>(() => {
  if (!workspace.value) return []
  const source =
    workspace.value.pending_task_items?.length
      ? workspace.value.pending_task_items
      : workspace.value.pending_tasks
  const items = normalizeWorkspaceItems(source, 'pending')
  if (items.length > 0) return items
  return deriveWorkspaceFallbackPendingItems({
    noteState: workspaceNoteState.value,
    workbookState: workspaceWorkbookState.value,
    paymentState: workspacePaymentState.value,
  })
})

const workspaceAvailableItems = computed<NormalizedWorkspaceActionItem[]>(() => {
  if (!workspace.value) return []
  const source =
    workspace.value.available_action_items?.length
      ? workspace.value.available_action_items
      : workspace.value.available_actions
  return normalizeWorkspaceItems(source, 'available')
})

const workspaceRequiredActions = computed<WorkspaceAction[]>(() => {
  return buildWorkspaceActions(workspacePendingItems.value)
    .filter((item) => item.classification === 'required')
    .sort(compareWorkspaceActions)
})

const workspaceRecommendedActions = computed<WorkspaceAction[]>(() => {
  return buildWorkspaceActions(workspacePendingItems.value)
    .filter((item) => item.classification === 'recommended')
    .sort(compareWorkspaceActions)
})

const workspaceCapabilityActions = computed<WorkspaceAction[]>(() => {
  const consumedIds = new Set([
    ...workspaceRequiredActions.value.map((item) => item.id),
    ...workspaceRecommendedActions.value.map((item) => item.id),
  ])
  return buildWorkspaceActions(workspaceAvailableItems.value)
    .filter((item) => item.classification === 'capability')
    .filter((item) => !consumedIds.has(item.id))
    .sort(compareWorkspaceActions)
})

const workspaceHasAnyAction = computed(
  () =>
    workspaceRequiredActions.value.length > 0 ||
    workspaceRecommendedActions.value.length > 0 ||
    workspaceCapabilityActions.value.length > 0
)

const completionPlannedDuration = computed(() => {
  if (!session.value) return null
  return getSessionDurationMinutes(session.value)
})

const isRequestLoading = (id: number) => requestLoading.value.has(id)

watch(error, (value) => {
  if (!value) return
  toast.error(value)
  error.value = ''
})

function openWorkbookWindow(clientId: number) {
  openClientWorkbookWindow(clientId)
}

function openCurrentClientWorkbook() {
  const clientId = session.value?.client
  if (!clientId || isManualClientSession.value) return
  openWorkbookWindow(clientId)
}

function sessionStartAt(detail: SessionDetail) {
  return getSessionStartAt(detail)
}

function sessionEndAt(detail: SessionDetail) {
  return getSessionEndAt(detail)
}

function formatDateTime(value?: string | null) {
  return sharedFormatSessionDateTime(value)
}

function formatDuration(start?: string | null, end?: string | null) {
  return sharedFormatSessionDuration(start, end)
}

function normalizeClientDisplay(value?: string | null) {
  const normalized = value?.trim() || ''
  if (!normalized) return ''
  if (/^#?\d+$/i.test(normalized)) return ''
  if (/^(client|клієнт)\s*#?\d+$/i.test(normalized)) return ''
  return normalized
}

function timeUntilLabel(detail: SessionDetail) {
  return getTimeUntilLabel(detail)
}

function clientLabel(detail: SessionDetail) {
  const preferred = normalizeClientDisplay(detail.client_display_name)
  if (preferred) return preferred
  const name = normalizeClientDisplay(detail.client_name)
  if (name) return name
  const username = normalizeClientDisplay(detail.client_username)
  if (username) return username
  if (isManualClientSession.value && detail.client_record_id) return `Клієнт #${detail.client_record_id}`
  if (!detail.client) return 'Клієнт'
  return getClientLabel(detail as SessionDetail & { client: number })
}

function statusLabel(detail: SessionDetail) {
  return getStatusLabel(detail)
}

function statusClass(detail: SessionDetail) {
  return getStatusClass(detail)
}

function formatWorkspaceUpdatedAt(value?: string | null) {
  if (!value) return ''
  return sharedFormatSessionDateTime(value)
}

function paymentStateLabel(state: WorkspacePaymentState) {
  if (state === 'paid') return 'Оплачено'
  if (state === 'awaiting_confirmation') return 'Очікує підтвердження'
  if (state === 'unpaid') return 'Не оплачено'
  if (state === 'not_applicable') return 'Не застосовується'
  return state
}

function paymentStateClass(state: WorkspacePaymentState) {
  if (state === 'paid') return 'status-pill--ok'
  if (state === 'awaiting_confirmation') return 'status-pill--warn'
  if (state === 'unpaid') return 'status-pill--muted'
  return 'status-pill--muted'
}

function noteStateLabel(state: WorkspaceNoteState | WorkspaceWorkbookState) {
  return getNoteContentStateLabel(state)
}

function workbookStateLabel(state: WorkspaceWorkbookState) {
  return getWorkbookContentStateLabel(state)
}

function noteStateClass(state: WorkspaceNoteState | WorkspaceWorkbookState) {
  if (state === 'completed') return 'status-pill--ok'
  if (state === 'draft') return 'status-pill--warn'
  if (state === 'missing') return 'status-pill--muted'
  if (state === 'hidden') return 'status-pill--muted'
  return 'status-pill--muted'
}

function normalizeWorkspaceItems(items: SessionWorkspaceItem[] | null | undefined, surface: WorkspaceSurface) {
  if (!items || !Array.isArray(items)) return []
  return items
    .map((item) => {
      if (typeof item === 'string') {
        const code = item.trim().toUpperCase()
        if (!code) return null
        return {
          code,
          label: item.trim(),
          classification: defaultWorkspaceClassification(code, surface),
          urgency: defaultWorkspaceUrgency(null),
          blockingScope: defaultWorkspaceBlockingScope(code),
        }
      }
      if (!item || typeof item !== 'object') return null
      const rawCode = typeof item.code === 'string' ? item.code : ''
      const rawLabel =
        typeof item.label === 'string'
          ? item.label
          : typeof item.title === 'string'
            ? item.title
            : typeof item.name === 'string'
              ? item.name
              : ''
      const code = rawCode.trim().toUpperCase()
      const label = rawLabel.trim()
      if (!code) return null
      const priority = typeof item.priority === 'string' ? item.priority : null
      return {
        code,
        label,
        classification: normalizeWorkspaceClassification(item.classification, code, surface),
        urgency: normalizeWorkspaceUrgency(item.urgency, priority),
        blockingScope: normalizeWorkspaceBlockingScope(item.blocking_scope, code),
      }
    })
    .filter((item): item is NormalizedWorkspaceActionItem => Boolean(item))
}

function deriveWorkspaceFallbackPendingItems({
  noteState,
  workbookState,
  paymentState,
}: {
  noteState: WorkspaceNoteState | null
  workbookState: WorkspaceWorkbookState | null
  paymentState: WorkspacePaymentState | null
}) {
  const codes: WorkspaceActionCode[] = []

  if (noteState === 'draft' || noteState === 'missing') codes.push('COMPLETE_NOTE')

  if (workbookState === 'draft' || workbookState === 'missing') codes.push('COMPLETE_WORKBOOK')

  if (paymentState === 'awaiting_confirmation' || paymentState === 'unpaid') {
    codes.push('COMPLETE_PAYMENT_REVIEW')
  }

  return codes.map((code) => ({
    code,
    label: '',
    classification: defaultWorkspaceClassification(code, 'pending'),
    urgency: 'normal' as WorkspaceUrgency,
    blockingScope: defaultWorkspaceBlockingScope(code),
  }))
}

function defaultWorkspaceClassification(code: string, surface: WorkspaceSurface): WorkspaceClassification {
  if (surface === 'available') return 'capability'
  if (code === 'UPLOAD_PAYMENT_PROOF' || code === 'COMPLETE_PAYMENT_REVIEW') return 'required'
  return 'recommended'
}

function normalizeWorkspaceClassification(
  classification: unknown,
  code: string,
  surface: WorkspaceSurface
): WorkspaceClassification {
  if (classification === 'required' || classification === 'recommended' || classification === 'capability') {
    return classification
  }
  return defaultWorkspaceClassification(code, surface)
}

function defaultWorkspaceUrgency(priority: string | null): WorkspaceUrgency {
  if (priority === 'high') return 'urgent'
  if (priority === 'medium') return 'normal'
  return 'low'
}

function normalizeWorkspaceUrgency(urgency: unknown, priority: string | null): WorkspaceUrgency {
  if (urgency === 'urgent' || urgency === 'normal' || urgency === 'low') return urgency
  return defaultWorkspaceUrgency(priority)
}

function defaultWorkspaceBlockingScope(code: string): WorkspaceBlockingScope {
  const normalizedCode = code.trim().toUpperCase()
  if (normalizedCode.includes('NOTE') || normalizedCode.includes('WORKBOOK')) return 'workspace'
  if (
    normalizedCode === 'REQUEST_PAYMENT_PROOF' ||
    normalizedCode === 'REQUEST_PAYMENT_CLARIFICATION' ||
    normalizedCode === 'UPLOAD_PAYMENT_PROOF'
  ) {
    return 'client'
  }
  if (normalizedCode.includes('PAYMENT')) return 'session'
  return 'none'
}

function normalizeWorkspaceBlockingScope(blockingScope: unknown, code: string): WorkspaceBlockingScope {
  if (
    blockingScope === 'session' ||
    blockingScope === 'client' ||
    blockingScope === 'workspace' ||
    blockingScope === 'none'
  ) {
    return blockingScope
  }
  return defaultWorkspaceBlockingScope(code)
}
function isWorkspaceActionCode(code: string): code is WorkspaceActionCode {
  return KNOWN_WORKSPACE_ACTION_CODES.has(code as WorkspaceActionCode)
}

function normalizeWorkspaceLabelValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function isUserFacingWorkspaceLabel(label: string, code: WorkspaceActionCode) {
  const trimmed = label.trim()
  if (!trimmed) return false
  if (trimmed.toUpperCase() === code) return false
  if (/^[A-Z0-9_]+$/.test(trimmed)) return false

  const normalized = normalizeWorkspaceLabelValue(trimmed)
  if (WORKSPACE_LEGACY_ENGLISH_LABELS[code].has(normalized)) return false

  const hasCyrillic = /[А-Яа-яІіЇїЄєҐґ]/.test(trimmed)
  const hasLatin = /[A-Za-z]/.test(trimmed)
  if (hasLatin && !hasCyrillic) return false

  return true
}

function resolveWorkspaceActionLabel(code: WorkspaceActionCode, rawLabel: string) {
  if (isUserFacingWorkspaceLabel(rawLabel, code)) {
    return rawLabel.trim()
  }
  return WORKSPACE_ACTION_LABEL[code]
}

function hasWorkspaceActionPermission(code: WorkspaceActionCode) {
  const permissions = workspace.value?.permissions
  if (!permissions || typeof permissions !== 'object') return true
  const permissionKeysByCode: Record<WorkspaceActionCode, string[]> = {
    OPEN_NOTE: ['can_view_note', 'can_edit_note', 'can_open_note'],
    CONTINUE_NOTE: ['can_edit_note', 'can_open_note'],
    COMPLETE_NOTE: ['can_edit_note', 'can_view_note'],
    OPEN_WORKBOOK: ['can_view_workbook', 'can_edit_workbook', 'can_open_workbook'],
    CONTINUE_WORKBOOK: ['can_edit_workbook', 'can_open_workbook'],
    COMPLETE_WORKBOOK: ['can_edit_workbook', 'can_view_workbook'],
    REVIEW_PAYMENT: ['can_review_payment', 'can_mark_payment_paid'],
    REQUEST_PAYMENT_PROOF: ['can_request_payment_proof'],
    UPLOAD_PAYMENT_PROOF: ['can_upload_payment_proof', 'can_review_payment'],
    CONFIRM_PAYMENT: ['can_confirm_payment', 'can_mark_payment_paid'],
    MARK_PAYMENT_PAID: ['can_mark_payment_paid'],
    REQUEST_PAYMENT_CLARIFICATION: ['can_request_payment_clarification'],
    COMPLETE_PAYMENT_REVIEW: ['can_mark_payment_paid', 'can_request_payment_clarification'],
  }
  const keys = permissionKeysByCode[code]
  const knownValues = keys
    .map((key) => permissions[key])
    .filter((value): value is boolean => typeof value === 'boolean')
  if (!knownValues.length) return true
  return knownValues.some(Boolean)
}
function canRunWorkspaceActionForState(
  code: WorkspaceActionCode,
  {
    noteState,
    workbookState,
    paymentState,
  }: {
    noteState: WorkspaceNoteState | null
    workbookState: WorkspaceWorkbookState | null
    paymentState: WorkspacePaymentState | null
  }
) {
  if (code === 'OPEN_NOTE' || code === 'CONTINUE_NOTE') {
    return Boolean(noteState && noteState !== 'hidden')
  }
  if (code === 'COMPLETE_NOTE') {
    return Boolean(noteState && (noteState === 'missing' || noteState === 'draft'))
  }
  if (code === 'OPEN_WORKBOOK' || code === 'CONTINUE_WORKBOOK') {
    return Boolean(workbookState && workbookState !== 'hidden')
  }
  if (code === 'COMPLETE_WORKBOOK') {
    return Boolean(workbookState && (workbookState === 'missing' || workbookState === 'draft'))
  }
  return Boolean(paymentState && paymentState !== 'paid' && paymentState !== 'not_applicable')
}
function isManualUnsupportedWorkspaceAction(code: WorkspaceActionCode, blockingScope: WorkspaceBlockingScope) {
  if (!isManualClientSession.value) return false
  if (code.includes('WORKBOOK')) return true
  if (code.includes('PAYMENT')) return true
  return blockingScope === 'client'
}
function runWorkspaceAction(code: WorkspaceActionCode) {
  if (code === 'OPEN_NOTE' || code === 'CONTINUE_NOTE' || code === 'COMPLETE_NOTE') {
    return () => focusSessionNote()
  }
  if (code === 'OPEN_WORKBOOK' || code === 'CONTINUE_WORKBOOK' || code === 'COMPLETE_WORKBOOK') {
    return () => openPostSessionWorkbook()
  }
  return () => focusPaymentBlock()
}
function resolveWorkspaceActionByCode(
  item: NormalizedWorkspaceActionItem,
  state: {
    noteState: WorkspaceNoteState | null
    workbookState: WorkspaceWorkbookState | null
    paymentState: WorkspacePaymentState | null
  }
): WorkspaceAction | null {
  const code = item.code
  if (!isWorkspaceActionCode(code)) return null
  if (isManualUnsupportedWorkspaceAction(code, item.blockingScope)) return null
  if (!hasWorkspaceActionPermission(code)) return null
  if (!canRunWorkspaceActionForState(code, state)) return null
  return {
    id: code.toLowerCase(),
    label: resolveWorkspaceActionLabel(code, item.label),
    priority: WORKSPACE_ACTION_PRIORITY[code] ?? 100,
    classification: item.classification,
    urgency: item.urgency,
    blockingScope: item.blockingScope,
    run: runWorkspaceAction(code),
  }
}
function buildWorkspaceActions(items: NormalizedWorkspaceActionItem[]): WorkspaceAction[] {
  const noteState = workspaceNoteState.value
  const workbookState = workspaceWorkbookState.value
  const paymentState = workspacePaymentState.value
  const actions: WorkspaceAction[] = []
  const seenCodes = new Set<string>()
  for (const item of items) {
    const code = item.code
    if (seenCodes.has(code)) continue
    seenCodes.add(code)
    const nextAction = resolveWorkspaceActionByCode(item, {
      noteState,
      workbookState,
      paymentState,
    })
    if (!nextAction) continue
    actions.push(nextAction)
  }
  return actions
}
function compareWorkspaceActions(a: WorkspaceAction, b: WorkspaceAction) {
  const urgencyDiff = WORKSPACE_URGENCY_ORDER[a.urgency] - WORKSPACE_URGENCY_ORDER[b.urgency]
  if (urgencyDiff !== 0) return urgencyDiff
  return a.priority - b.priority
}
function rescheduleStatusLabel(status: string) {
  return getRescheduleStatusLabel(status)
}

function requestStatusClass(status: string) {
  return getRequestStatusClass(status)
}

function suggestionReasonLabel(reasonTag: string) {
  return getSuggestionReasonLabel(reasonTag)
}

function canCancel(status: string) {
  return sharedCanCancel(status)
}

function canReschedule(status: string) {
  return sharedCanReschedule(status)
}

function canShowRecurringAction(detail: SessionDetail) {
  if (isManualClientSession.value) return false
  return sharedCanShowRecurringAction(detail)
}

async function copyMeetingLink() {
  if (!meetingUrl.value) return
  try {
    await navigator.clipboard.writeText(meetingUrl.value)
    toast.success('Посилання на зустріч скопійовано.')
  } catch {
    toast.error('Не вдалося скопіювати посилання на зустріч.')
  }
}

function recurringOccurrencesValue() {
  return getRecurringOccurrences(recurringPreset.value, recurringCustomOccurrences.value)
}

function setRequestLoading(id: number, value: boolean) {
  const next = new Set(requestLoading.value)
  if (value) next.add(id)
  else next.delete(id)
  requestLoading.value = next
}

async function syncSessionWorkspaceAfterPaymentMutation() {
  if (!hasValidSessionId.value) return
  try {
    const latest = await apiGet<SessionDetail>(`/booking/sessions/${sessionId.value}/`)
    session.value = latest
    syncPaymentResolutionDraft(latest)
  } catch {
    // Keep current UI state if background sync fails.
  }
}

async function onPaymentProofUpdated(nextPaymentProof: SessionPaymentProof) {
  if (!session.value) return
  paymentProofActionError.value = ''
  session.value = {
    ...session.value,
    payment_proof: nextPaymentProof,
  }
  await syncSessionWorkspaceAfterPaymentMutation()
}

async function markManualSessionPaymentPaid() {
  if (!session.value || !isManualClientSession.value || manualPaymentSaving.value) return

  manualPaymentSaving.value = true
  manualPaymentError.value = ''

  try {
    const nextPaymentProof = await apiPost<SessionPaymentProof>(
      `/booking/sessions/${session.value.id}/payment-proof/mark-paid/`,
      {
        specialist_note: 'Оплату підтверджено вручну.',
      }
    )

    await onPaymentProofUpdated(nextPaymentProof)
    toast.success('Оплату позначено як підтверджену.')
  } catch (err: any) {
    manualPaymentError.value = getBookingErrorMessage(
      err,
      'Не вдалося позначити оплату як підтверджену.'
    )
  } finally {
    manualPaymentSaving.value = false
  }
}

function startManualPriceEdit() {
  if (!session.value || !isManualClientSession.value) return

  manualPriceDraft.value = String(session.value.price_amount ?? '')
  manualPriceError.value = ''
  manualPriceEditing.value = true
}

function cancelManualPriceEdit() {
  if (manualPriceSaving.value) return

  manualPriceEditing.value = false
  manualPriceDraft.value = ''
  manualPriceError.value = ''
}

async function saveManualSessionPrice() {
  if (!session.value || !isManualClientSession.value || manualPriceSaving.value) return

  manualPriceSaving.value = true
  manualPriceError.value = ''

  const normalizedAmount = manualPriceDraft.value.trim().replace(',', '.')

  try {
    const updatedSession = await apiPatch<SessionDetail>(
      `/booking/sessions/${session.value.id}/price/`,
      {
        price_amount: normalizedAmount || null,
        price_currency: 'UAH',
      }
    )

    session.value = updatedSession
    manualPriceEditing.value = false
    manualPriceDraft.value = ''
    toast.success('Вартість сесії оновлено.')
  } catch (err: any) {
    manualPriceError.value = getBookingErrorMessage(
      err,
      'Не вдалося оновити вартість сесії.'
    )
  } finally {
    manualPriceSaving.value = false
  }
}

function focusPaymentBlock() {
  paymentPanelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

async function savePaymentResolution(action: PaymentResolutionAction) {
  if (!session.value || paymentResolutionSaving.value) return

  paymentResolutionSaving.value = action
  paymentResolutionError.value = ''

  try {
    const updatedSession = await apiPatch<SessionDetail>(
      `/booking/sessions/${session.value.id}/payment-resolution/`,
      {
        resolution: action,
        note: paymentResolutionNote.value.trim(),
      }
    )

    session.value = updatedSession
    syncPaymentResolutionDraft(updatedSession)
    toast.success('Рішення щодо оплати оновлено.')
  } catch (err: any) {
    paymentResolutionError.value = getBookingErrorMessage(
      err,
      'Не вдалося зберегти рішення щодо оплати.'
    )
  } finally {
    paymentResolutionSaving.value = null
  }
}

let meetingFocusTimer: number | null = null

function clearMeetingFocusTimer() {
  if (meetingFocusTimer === null) return
  window.clearTimeout(meetingFocusTimer)
  meetingFocusTimer = null
}

function normalizeFocusQuery() {
  const raw = route.query.focus
  const value = Array.isArray(raw) ? raw[0] : raw
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

async function focusMeetingLinkBlockIfRequested() {
  if (normalizeFocusQuery() !== 'meeting_link') return
  meetingLinkFocused.value = true
  await nextTick()
  const card = meetingCardRef.value

  if (card && typeof card.scrollIntoView === 'function') {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  clearMeetingFocusTimer()
  meetingFocusTimer = window.setTimeout(() => {
    meetingLinkFocused.value = false
    meetingFocusTimer = null
  }, 1600)

  const nextQuery = { ...route.query }
  delete nextQuery.focus
  void router.replace({ query: nextQuery })
}

function onPaymentDetailsMissing(message: string) {
  paymentProofActionError.value = message
}

function openPaymentDetailsSettings() {
  router.push({ path: '/cabinet/settings', query: { tab: 'payment-details' } })
}

async function loadSession() {
  if (!hasValidSessionId.value) {
    session.value = null
    pageError.value = 'Некоректний ідентифікатор сесії.'
    return
  }
  loading.value = true
  error.value = ''
  pageError.value = ''
  paymentProofActionError.value = ''
  try {
    const nextSession = await apiGet<SessionDetail>(`/booking/sessions/${sessionId.value}/`)
    session.value = nextSession
    syncPaymentResolutionDraft(nextSession)
  } catch (err: any) {
    session.value = null
    syncPaymentResolutionDraft(null)
    pageError.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.loadSession)
  } finally {
    loading.value = false
  }
}

async function loadSlots() {
  slotsLoading.value = true
  try {
    availableSlots.value = await fetchSpecialistAvailableSlotsData()
  } catch {
    availableSlots.value = []
  } finally {
    slotsLoading.value = false
  }
}

async function loadRescheduleSuggestions() {
  if (!sessionId.value) return
  suggestionsLoading.value = true
  try {
    rescheduleSuggestions.value = await fetchSpecialistRescheduleSuggestionsData(sessionId.value)
  } catch {
    rescheduleSuggestions.value = []
  } finally {
    suggestionsLoading.value = false
  }
}

async function loadNote() {
  if (!sessionId.value) return
  noteLoading.value = true
  error.value = ''
  try {
    noteDraft.value = await fetchSpecialistSessionNoteContentData(sessionId.value)
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.loadSessionNote)
  } finally {
    noteLoading.value = false
  }
}

async function loadRescheduleRequests() {
  requestsLoading.value = true
  try {
    rescheduleRequests.value = await fetchSpecialistRescheduleRequestsData()
  } catch {
    rescheduleRequests.value = []
  } finally {
    requestsLoading.value = false
  }
}

async function loadPage() {
  selectedSuggestionSlotId.value = null
  recurringResult.value = null
  showReschedulePanel.value = false
  showRecurringPanel.value = false
  quickAddModalOpen.value = false
  quickAddModalError.value = ''
  noteOpen.value = false
  postSessionContext.value = null
  postSessionNextSession.value = null
  closeCompletionModal(true)
  await loadSession()
  if (!session.value) return
  await Promise.all([loadSlots(), loadRescheduleSuggestions(), loadNote(), loadRescheduleRequests()])
  await focusMeetingLinkBlockIfRequested()
}

async function refreshSessionContext() {
  await Promise.all([loadSession(), loadSlots(), loadRescheduleSuggestions(), loadRescheduleRequests()])
  await focusMeetingLinkBlockIfRequested()
}

async function confirmSession() {
  if (!session.value) return
  actionLoading.value = true
  error.value = ''
  try {
    await confirmSpecialistSessionAction(session.value.id)
    await refreshSessionContext()
    toast.success(BOOKING_SUCCESS_MESSAGES.sessionConfirmed)
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.confirmSession)
  } finally {
    actionLoading.value = false
  }
}

function openCompletionModal() {
  if (!session.value) return
  completionModalOpen.value = true
  completionDurationDraft.value = getSuggestedActualDurationInput(session.value)
  completionDurationError.value = ''
}

function closeCompletionModal(force = false) {
  if (!force && actionLoading.value) return
  completionModalOpen.value = false
  completionDurationDraft.value = ''
  completionDurationError.value = ''
}

async function loadPostSessionNextSession(completedSessionId: number) {
  try {
    const upcoming = await apiGet<Array<Pick<SessionDetail, 'id' | 'status' | 'slot' | 'slot_start_at'>>>(
      '/booking/sessions/',
      { params: { upcoming: true } }
    )
    postSessionNextSession.value = getNextUpcomingSession(upcoming || [], {
      excludeSessionId: completedSessionId,
    })
  } catch {
    postSessionNextSession.value = null
  }
}

async function focusSessionNote() {
  noteOpen.value = true
  await nextTick()
  const input = noteTextareaRef.value
  if (!input) return
  input.scrollIntoView({ behavior: 'smooth', block: 'center' })
  input.focus()
}

async function openPrivateNote() {
  noteOpen.value = true
  await nextTick()
  noteTextareaRef.value?.focus()
}

function closePrivateNote() {
  if (noteSaving.value) return
  noteOpen.value = false
}

async function openPostSessionWorkbook() {
  const clientId = postSessionContext.value?.clientId ?? session.value?.client ?? null
  if (clientId) {
    openWorkbookWindow(clientId)
    return
  }
  await focusSessionNote()
}

async function submitCompletion() {
  if (!session.value) return
  const completionTargetId = session.value.id
  const { payload, error: durationError } = getActualDurationPayload(completionDurationDraft.value)
  if (durationError) {
    completionDurationError.value = durationError
    return
  }

  actionLoading.value = true
  error.value = ''
  completionDurationError.value = ''
  try {
    await completeSpecialistSessionAction(completionTargetId, payload)
    await Promise.all([refreshSessionContext(), loadNote(), loadPostSessionNextSession(completionTargetId)])
    postSessionContext.value = {
      sessionId: completionTargetId,
      clientId: session.value?.client ?? null,
    }
    closeCompletionModal(true)
    toast.success(BOOKING_SUCCESS_MESSAGES.sessionCompleted)
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.completeSession)
  } finally {
    actionLoading.value = false
  }
}

async function cancelSession() {
  if (!session.value) return
  actionLoading.value = true
  error.value = ''
  try {
    await cancelSpecialistSessionAction(session.value.id)
    await refreshSessionContext()
    toast.success(BOOKING_SUCCESS_MESSAGES.sessionCancelled)
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.cancelSession)
  } finally {
    actionLoading.value = false
  }
}

function toggleReschedulePanel() {
  showReschedulePanel.value = !showReschedulePanel.value
  if (showReschedulePanel.value) {
    showRecurringPanel.value = false
  }
}

function toggleRecurringPanel() {
  showRecurringPanel.value = !showRecurringPanel.value
  if (showRecurringPanel.value) {
    showReschedulePanel.value = false
  }
}

function selectSuggestedSlot(slotId: number) {
  selectedSuggestionSlotId.value = slotId
}

async function submitReschedule(slotId: number) {
  if (!session.value) return
  actionLoading.value = true
  error.value = ''
  try {
    await rescheduleSpecialistSessionAction(session.value.id, slotId)
    selectedSuggestionSlotId.value = null
    await refreshSessionContext()
    toast.success(BOOKING_SUCCESS_MESSAGES.sessionRescheduled)
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.rescheduleSession)
  } finally {
    actionLoading.value = false
  }
}

async function submitSelectedSuggestion() {
  if (!selectedSuggestionSlotId.value) return
  await submitReschedule(selectedSuggestionSlotId.value)
}

async function submitRecurring() {
  if (!session.value) return
  const occurrences = recurringOccurrencesValue()
  if (!occurrences) {
    error.value = 'Вкажіть кількість повторів від 1 до 52.'
    return
  }

  actionLoading.value = true
  error.value = ''
  try {
    recurringResult.value = await createRecurringSpecialistSessionsAction(session.value.id, occurrences)
    await Promise.all([loadSession(), loadSlots()])
    const skipped = recurringResult.value?.skipped_count || 0
    const created = recurringResult.value?.created_count || 0
    if (skipped > 0) {
      toast.success(`Створено ${created} сесій, пропущено ${skipped}.`)
    } else {
      toast.success(BOOKING_SUCCESS_MESSAGES.recurringSeriesCreated)
    }
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.createRecurringSession)
  } finally {
    actionLoading.value = false
  }
}

async function saveNote() {
  if (!sessionId.value) return
  noteSaving.value = true
  error.value = ''
  try {
    await saveSpecialistSessionNoteAction(sessionId.value, noteDraft.value)
    toast.success(BOOKING_SUCCESS_MESSAGES.noteSaved)
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.saveSessionNote)
  } finally {
    noteSaving.value = false
  }
}

async function approveRequest(id: number) {
  setRequestLoading(id, true)
  error.value = ''
  try {
    await approveSpecialistRescheduleRequestAction(id)
    await refreshSessionContext()
    toast.success(BOOKING_SUCCESS_MESSAGES.rescheduleRequestApproved)
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.approveRescheduleRequest)
  } finally {
    setRequestLoading(id, false)
  }
}

async function declineRequest(id: number) {
  setRequestLoading(id, true)
  error.value = ''
  try {
    await declineSpecialistRescheduleRequestAction(id)
    await loadRescheduleRequests()
    toast.success(BOOKING_SUCCESS_MESSAGES.rescheduleRequestDeclined)
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.declineRescheduleRequest)
  } finally {
    setRequestLoading(id, false)
  }
}

function toggleEditMeetingLink() {
  isEditingMeetingLink.value = !isEditingMeetingLink.value
  if (isEditingMeetingLink.value) {
    meetingLinkDraft.value = session.value?.meeting_url || ''
  } else {
    meetingLinkDraft.value = ''
  }
}

async function saveMeetingLink() {
  if (!session.value) return

  const normalized = meetingLinkDraft.value.trim()

  actionLoading.value = true
  error.value = ''

  try {
    await updateSpecialistSessionMeeting(session.value.id, {
      meeting_mode: normalized ? 'ONLINE' : 'OFFLINE',
      meeting_url: normalized || null,
    })
    await loadSession()
    toast.success('Посилання на зустріч оновлено.')
    isEditingMeetingLink.value = false
    meetingLinkDraft.value = ''
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, 'Не вдалося оновити посилання на зустріч.')
  } finally {
    actionLoading.value = false
  }
}

function openSessionPracticeBoardModal() {
  if (isManualClientSession.value) return
  quickAddModalError.value = ''
  quickAddModalOpen.value = true
}

function closeSessionPracticeBoardModal() {
  if (quickAddPending.value) return
  quickAddModalError.value = ''
  quickAddModalOpen.value = false
}

async function submitSessionPracticeBoardQuickAdd(title: string) {
  if (!session.value || quickAddPending.value) return
  quickAddPending.value = true
  quickAddModalError.value = ''
  try {
    const boards = await fetchPracticeBoards()
    const boardId = resolveDefaultPracticeBoardId(boards)
    await createPracticeBoardItem({
      ...(boardId ? { board_id: boardId } : {}),
      title: title.trim(),
      related_client_id: session.value.client || null,
      related_session_id: session.value.id,
      source_type: 'session',
      source_id: session.value.id,
    })
    quickAddModalOpen.value = false
    toast.success('Задачу додано на дошку')
  } catch (err: any) {
    quickAddModalError.value = getBookingErrorMessage(err, 'Не вдалося додати задачу на дошку.')
  } finally {
    quickAddPending.value = false
  }
}

watch(
  sessionId,
  async () => {
    await loadPage()
  },
  { immediate: true }
)

watch(
  () => route.query.focus,
  async () => {
    await focusMeetingLinkBlockIfRequested()
  }
)
</script>

<style scoped>
.session-detail {
  display: grid;
  gap: 20px;
  padding: 4px 0 8px;
  background:
    radial-gradient(760px 360px at 8% -4%, color-mix(in srgb, var(--pc-blue-soft) 66%, transparent), transparent 70%),
    radial-gradient(700px 380px at 92% 2%, color-mix(in srgb, var(--pc-peach-100) 72%, transparent), transparent 72%);
}

.detail-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 22px;
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--pc-bg-card) 90%, var(--pc-blue-soft)),
      color-mix(in srgb, var(--pc-bg-card) 84%, var(--pc-peach-100))
    );
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-lg);
  padding: 24px;
  box-shadow: var(--pc-shadow-card);
}

.detail-title {
  margin: 4px 0 0;
  font-size: 32px;
  color: var(--pc-navy-950);
}

.detail-subtitle {
  margin: 10px 0 0;
  max-width: 620px;
  color: color-mix(in srgb, var(--pc-navy-900) 72%, var(--muted));
}

.panel {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-lg);
  padding: 18px 18px 20px;
  background: color-mix(in srgb, var(--pc-bg-card) 94%, #ffffff);
  display: grid;
  gap: 15px;
  box-shadow: var(--pc-shadow-soft);
}

.panel--summary {
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--pc-bg-card) 92%, var(--pc-blue-soft)),
      color-mix(in srgb, var(--pc-bg-card) 90%, #ffffff)
    );
}

.panel--next-step {
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--pc-bg-card) 94%, var(--pc-blue-soft)),
      color-mix(in srgb, var(--pc-bg-card) 88%, var(--pc-peach-100))
    );
}

.panel--workspace {
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--pc-bg-card) 94%, var(--pc-blue-soft)),
      color-mix(in srgb, var(--pc-bg-card) 88%, var(--pc-blue-soft))
    );
}

.workspace-panel__hint {
  margin: 6px 0 0;
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
  color: var(--pc-navy-950);
}

.badge--soft {
  border: 1px solid color-mix(in srgb, var(--pc-navy-900) 20%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-bg-card) 86%, var(--pc-blue-soft));
  color: var(--pc-navy-900);
}

.summary-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.next-step-rail {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.note-header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.workspace-summary {
  display: grid;
  gap: 10px;
}

.workspace-summary__item {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-md);
  background: color-mix(in srgb, var(--pc-bg-card) 92%, var(--pc-blue-soft));
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.workspace-summary__meta {
  display: grid;
  gap: 2px;
}

.workspace-summary__label {
  font-size: 14px;
  font-weight: 600;
  color: var(--pc-navy-900);
}

.workspace-summary__updated {
  font-size: 12px;
}

.workspace-actions {
  display: grid;
  gap: 12px;
  border: 1px solid color-mix(in srgb, var(--pc-navy-900) 18%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-bg-card) 91%, var(--pc-blue-soft));
  border-radius: var(--pc-radius-md);
  padding: 12px 12px 13px;
}

.workspace-actions__zone {
  display: grid;
  gap: 8px;
}

.workspace-actions__zone--required {
  border: 1px solid color-mix(in srgb, var(--pc-warning) 24%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-yellow-soft) 62%, #ffffff);
  border-radius: var(--pc-radius-sm);
  padding: 10px;
}

.workspace-actions__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--pc-navy-900);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.workspace-actions__secondary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.detail-card {
  padding: 12px 14px;
  border-radius: var(--pc-radius-md);
  border: 1px solid var(--pc-border);
  background: color-mix(in srgb, var(--pc-bg-card) 90%, #ffffff);
  display: grid;
  gap: 6px;
}

.detail-label {
  font-size: 12px;
  color: color-mix(in srgb, var(--pc-navy-900) 64%, var(--muted));
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.detail-value {
  display: grid;
  gap: 8px;
  font-weight: 600;
  color: var(--pc-navy-950);
}

.detail-meta {
  font-size: 12px;
  font-weight: 400;
}

.manual-client-detail {
  display: grid;
  gap: 6px;
}

.meeting-card {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  flex-wrap: wrap;
  padding: 12px 14px;
  border-radius: var(--pc-radius-md);
  border: 1px solid color-mix(in srgb, var(--pc-navy-900) 22%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-bg-card) 90%, var(--pc-blue-soft));
}

.meeting-card--attention {
  border-color: color-mix(in srgb, var(--pc-warning) 38%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-yellow-soft) 72%, #ffffff);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--pc-warning) 16%, transparent);
}

.meeting-card__attention {
  margin-top: 6px;
}

.meeting-card--focused {
  box-shadow: 0 0 0 3px rgba(18, 52, 90, 0.16), var(--pc-shadow-soft);
}

.meeting-card__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.status-pill {
  width: fit-content;
  padding: 6px 10px 7px;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-sm);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: color-mix(in srgb, var(--pc-bg-card) 82%, var(--pc-blue-soft));
  color: var(--pc-navy-950);
}

.status-pill--ok {
  border-color: color-mix(in srgb, var(--pc-success) 30%, transparent);
  background: color-mix(in srgb, var(--pc-teal-100) 78%, #ffffff);
  color: #1b6f4a;
}

.status-pill--warn {
  background: var(--pc-yellow-soft);
  color: var(--pc-warning);
  border-color: color-mix(in srgb, var(--pc-warning) 26%, transparent);
}

.status-pill--muted {
  background: color-mix(in srgb, var(--pc-bg-card) 82%, var(--pc-border));
  color: var(--pc-navy-800);
}

.status-pill--danger {
  border-color: color-mix(in srgb, var(--pc-danger) 34%, transparent);
  background: color-mix(in srgb, var(--pc-danger) 10%, #ffffff);
  color: #a03838;
}

.status-pill--manual {
  border: 1px solid color-mix(in srgb, var(--pc-peach-300) 54%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-peach-100) 70%, #ffffff);
  color: var(--pc-navy-900);
}

.request-list {
  display: grid;
  gap: 12px;
}

.request-card {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-lg);
  padding: 14px;
  background: color-mix(in srgb, var(--pc-bg-card) 92%, #ffffff);
  display: grid;
  gap: 12px;
}

.request-main {
  display: grid;
  gap: 6px;
}

.request-title {
  font-weight: 600;
}

.request-actions,
.recurring-actions,
.note-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.suggestions-block,
.note-panel {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: var(--pc-radius-md);
  border: 1px solid var(--pc-border);
  background: color-mix(in srgb, var(--pc-bg-card) 90%, #ffffff);
}

.suggestions-title {
  font-weight: 600;
}

.suggestions-list {
  display: grid;
  gap: 8px;
}

.suggestion-btn {
  display: grid;
  gap: 2px;
  text-align: left;
}

.suggestion-btn--active {
  border-color: rgba(8, 113, 201, 0.45);
  background: rgba(8, 113, 201, 0.08);
}

.suggestion-meta {
  font-size: 11px;
}

.slot-list {
  display: grid;
  gap: 10px;
}

.slot-card {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-md);
  padding: 10px 12px;
  background: color-mix(in srgb, var(--pc-bg-card) 90%, #ffffff);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.slot-time {
  font-weight: 600;
}

.recurring-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.recurring-result,
.recurring-list {
  display: grid;
  gap: 8px;
}

.recurring-ul {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 4px;
}

.note-title {
  display: inline-block;
  margin-right: 8px;
}

.note-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--pc-radius-sm);
  background: color-mix(in srgb, var(--pc-bg-card) 86%, var(--pc-yellow-soft));
  border: 1px solid color-mix(in srgb, var(--pc-warning) 30%, var(--pc-border));
  color: var(--pc-navy-900);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.note-textarea {
  min-height: 140px;
  resize: vertical;
  border-color: color-mix(in srgb, var(--pc-navy-900) 24%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-bg-card) 94%, #ffffff);
}

.note-helper {
  font-size: 12px;
  line-height: 1.4;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: var(--radius-sm);
  padding: 8px 10px;
}

.manual-price-editor {
  margin-top: 10px;
}

.manual-price-editor__form {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}

.manual-price-editor__field {
  max-width: 300px;
}

.manual-price-editor__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.manual-payment-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: flex-start;
  border: 1px solid color-mix(in srgb, var(--pc-navy-900) 22%, var(--pc-border));
  border-radius: var(--pc-radius-md);
  padding: 14px;
  background: color-mix(in srgb, var(--pc-bg-card) 90%, var(--pc-blue-soft));
}

.manual-payment-card__text {
  margin: 4px 0 0;
}

.manual-payment-card__amount {
  margin: 10px 0 0;
  color: var(--pc-navy-950);
  font-size: clamp(20px, 2.6vw, 26px);
  font-weight: 800;
  line-height: 1.2;
}

.manual-payment-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.payment-resolution-card {
  display: grid;
  gap: 12px;
  margin-top: 16px;
  border-radius: var(--pc-radius-lg);
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--pc-warning) 26%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-yellow-soft) 36%, white);
}

.payment-resolution-card--pending {
  border-color: color-mix(in srgb, var(--pc-warning) 34%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-yellow-soft) 66%, #ffffff);
}

.payment-resolution-card--resolved {
  border-color: color-mix(in srgb, var(--pc-navy-900) 22%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-bg-card) 90%, var(--pc-blue-soft));
}

.payment-resolution-card__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.payment-resolution-card__title {
  margin: 2px 0 0;
  color: var(--pc-navy-950);
  font-size: 18px;
}

.payment-resolution-card__text {
  margin: 0;
}

.payment-resolution-card__note {
  max-width: 640px;
}

.payment-resolution-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.payment-resolution-card__updated {
  margin: 0;
  font-size: 13px;
}

@media (max-width: 760px) {
  .manual-payment-card {
    grid-template-columns: 1fr;
  }

  .manual-payment-card__actions {
    justify-content: flex-start;
  }

  .payment-resolution-card__actions .btn {
    width: 100%;
  }
}

.payment-proof-error {
  margin-top: 8px;
  display: grid;
  gap: 8px;
  border: 1px solid #f5c2c0;
  background: #fdecea;
  border-radius: var(--radius-sm);
  padding: 10px;
}

.payment-proof-error p {
  margin: 0;
  color: #8a1f18;
}

.btn--sm {
  padding: 6px 10px;
  font-size: 13px;
}

@media (max-width: 860px) {
  .detail-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .panel__header {
    flex-direction: column;
  }

  .summary-actions {
    justify-content: flex-start;
  }

  .slot-card {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 430px) {
  .session-detail {
    gap: 14px;
    padding: 0 0 6px;
  }

  .detail-hero {
    padding: 12px 14px;
    gap: 10px;
  }

  .detail-title {
    font-size: 24px;
    margin: 2px 0 0;
    line-height: 1.16;
  }

  .detail-subtitle {
    margin-top: 6px;
    font-size: 13px;
    line-height: 1.35;
    max-width: 100%;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .panel {
    padding: 13px 13px 15px;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .summary-actions .btn,
  .meeting-card__actions .btn,
  .next-step-rail .btn,
  .note-actions .btn,
  .request-actions .btn {
    width: 100%;
  }
}
</style>
