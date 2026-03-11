<template>
  <section class="sessions">
    <header class="sessions__hero">
      <div>
        <div class="badge">Сесії спеціаліста</div>
        <h1 class="title sessions__title">Керуйте сесіями</h1>
        <p class="muted sessions__subtitle">
          Список запланованих і минулих сесій. Дії доступні одразу.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
    </header>

    <div v-if="error" class="form-error">{{ error }}</div>
    <LoadingSkeleton v-if="loading" variant="list" :count="3" />

    <section class="panel panel--priority">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Пріоритет</div>
          <h2 class="panel__title">Майбутні сесії</h2>
        </div>
      </div>
      <div class="priority-grid">
        <div class="priority-card">
          <div class="priority-title">Очікують підтвердження</div>
          <div class="priority-value">
            {{ needsConfirmation.length }}
          </div>
          <div class="muted">Підтвердьте найближчі сесії, щоб уникнути “Не відбулося”.</div>
          <div v-if="needsConfirmation.length" class="priority-list">
            <div
              v-for="session in needsConfirmation.slice(0, 3)"
              :key="session.id"
              class="priority-item"
            >
              <div>
                <div class="priority-time">{{ formatDateTime(session.slot_start_at) }}</div>
                <div class="muted">{{ session.client_name || session.client_username || `#${session.client}` }}</div>
              </div>
              <button
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="isActionLoading(session.id)"
                @click="confirmSession(session.id)"
              >
                Підтвердити
              </button>
            </div>
          </div>
        </div>
        <div class="priority-card">
          <div class="priority-title">Найближча сесія</div>
          <div v-if="nextUpcoming" class="priority-next">
            <div class="priority-time">{{ formatDateTime(nextUpcoming.slot_start_at) }}</div>
            <div class="muted">
              Клієнт: {{ nextUpcoming.client_name || nextUpcoming.client_username || `#${nextUpcoming.client}` }}
            </div>
            <div class="status-pill" :class="statusClass(nextUpcoming)">
              {{ statusLabel(nextUpcoming) }}
            </div>
            <div v-if="timeUntilLabel(nextUpcoming)" class="status-pill status-pill--warn">
              Початок через {{ timeUntilLabel(nextUpcoming) }}
            </div>
            <RouterLink class="btn btn--ghost btn--sm" :to="`/cabinet/sessions/${nextUpcoming.id}`">
              Деталі сесії
            </RouterLink>
          </div>
          <div v-else class="muted">Немає майбутніх сесій.</div>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Фільтри</div>
          <h2 class="panel__title">Пошук потрібних сесій</h2>
        </div>
        <button
          v-if="hasActiveSessionFilters"
          class="btn btn--ghost btn--sm"
          type="button"
          @click="clearSessionFilters"
        >
          Скинути фільтри
        </button>
      </div>
      <div class="session-filters">
        <label class="field session-filters__field">
          <span class="muted">Статус</span>
          <select v-model="statusFilter" class="input input--select">
            <option
              v-for="option in sessionStatusFilterOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </label>
        <label class="field session-filters__field">
          <span class="muted">Дата</span>
          <input v-model="dateFilter" class="input" type="date" />
        </label>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Найближчі</div>
          <h2 class="panel__title">Заплановані сесії</h2>
        </div>
      </div>
      <div v-if="needsConfirmation.length" class="new-bookings-banner">
        <div>
          Нові бронювання: <strong>{{ needsConfirmation.length }}</strong>
        </div>
        <button class="btn btn--ghost btn--sm" type="button" @click="needsConfirmation[0] && focusSession(needsConfirmation[0].id)">
          Перейти до першого
        </button>
      </div>
      <EmptyState
        v-if="!loading && filteredUpcomingSessions.length === 0"
        title="Немає запланованих сесій"
        description="Створіть вільні віконця або поділіться профілем, щоб клієнти могли записатися."
        action-text="Створити віконце"
        action-to="/cabinet/slots"
        secondary-text="Керування профілем"
        secondary-to="/cabinet/profile"
      />
      <div v-else class="session-list">
        <article
          v-for="session in filteredUpcomingSessions"
          :key="session.id"
          :id="`session-${session.id}`"
          class="session-card session-card--with-photo"
          :class="{ 'session-card--highlight': highlightedSessionId === session.id }"
          @mouseenter="clearHighlight(session.id)"
        >
          <div class="session-summary">
            <div class="session-info">
              <div class="session-time">{{ formatDateTime(session.slot_start_at) }}</div>
              <div class="muted">{{ formatDuration(session.slot_start_at, session.slot_end_at) }}</div>
              <div class="muted">
                Клієнт: {{ session.client_name || session.client_username || `#${session.client}` }}
              </div>
              <div v-if="session.client_email" class="muted">Пошта: {{ session.client_email }}</div>
              <div class="status-pill" :class="statusClass(session)">
                {{ statusLabel(session) }}
              </div>
              <div
                v-if="timeUntilLabel(session)"
                class="status-pill status-pill--warn"
              >
                Початок через {{ timeUntilLabel(session) }}
              </div>
              <div
                v-if="session.status === 'SCHEDULED'"
                class="status-pill status-pill--danger"
              >
                Потрібне підтвердження
              </div>
              <div
                v-if="session.status === 'SCHEDULED'"
                class="status-pill status-pill--new"
              >
                Нова заявка
              </div>
              <div
                v-if="hasPendingReschedule(session.id)"
                class="status-pill status-pill--warn"
              >
                Є запит на перенос
              </div>
            </div>
            <div class="session-actions">
              <RouterLink class="btn btn--ghost btn--sm" :to="`/cabinet/sessions/${session.id}`">
                Деталі
              </RouterLink>
              <button
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="isActionLoading(session.id) || session.status !== 'SCHEDULED'"
                @click="confirmSession(session.id)"
              >
                Підтвердити
              </button>
              <button
                v-if="session.status === 'CONFIRMED'"
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="isActionLoading(session.id)"
                @click="completeSession(session.id)"
              >
                Завершити
              </button>
              <button
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="isActionLoading(session.id) || !canCancel(session.status)"
                @click="cancelSession(session.id)"
              >
                Скасувати
              </button>
              <button
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="isActionLoading(session.id) || !canReschedule(session.status) || hasPendingReschedule(session.id)"
                @click="toggleReschedule(session.id)"
              >
                Перенести
              </button>
              <button
                v-if="canShowRecurringAction(session)"
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="isActionLoading(session.id)"
                @click="toggleRecurring(session.id)"
              >
                Повторювати щотижня
              </button>
            </div>
          </div>
          <div class="session-photo-wrap">
            <img
              v-if="therapistPhotoUrl"
              :src="therapistPhotoUrl"
              alt="Фото спеціаліста"
              class="session-photo"
            />
            <div v-else class="session-photo session-photo--empty">Фото</div>
          </div>
          <div v-if="rescheduleSessionId === session.id" class="reschedule-panel">
            <label class="field">
              Нове вільне віконце
              <select v-model.number="rescheduleSlotId" class="input input--select">
                <option value="">Оберіть вільне віконце</option>
                <option v-for="slot in availableSlots" :key="slot.id" :value="slot.id">
                  {{ formatDateTime(slot.start_at) }} ? {{ formatDuration(slot.start_at, slot.end_at) }}
                </option>
              </select>
            </label>
            <div class="suggestions-block">
              <div class="muted suggestions-title">Рекомендовані варіанти перенесення</div>
              <div v-if="isSuggestionsLoading(session.id)" class="muted">
                Завантаження рекомендацій...
              </div>
              <div v-else-if="(rescheduleSuggestions[session.id] || []).length === 0" class="muted">
                Не вдалося знайти відповідні варіанти перенесення
              </div>
              <div v-else class="suggestions-list">
                <button
                  v-for="item in (rescheduleSuggestions[session.id] || []).slice(0, 5)"
                  :key="item.slot_id"
                  class="btn btn--ghost btn--sm suggestion-btn"
                  type="button"
                  @click="selectSuggestedSlot(item.slot_id)"
                >
                  <span>{{ formatDateTime(item.start_at) }} · {{ formatDuration(item.start_at, item.end_at) }}</span>
                  <span class="muted suggestion-meta">{{ suggestionReasonLabel(item.reason_tag) }}</span>
                </button>
              </div>
              <div class="muted">
                Найближчі доступні вікна для цієї сесії
              </div>
            </div>
            <div class="reschedule-actions">
              <button
                class="btn btn--sm"
                type="button"
                :disabled="isActionLoading(session.id) || !rescheduleSlotId"
                @click="submitReschedule(session.id)"
              >
                Підтвердити перенос
              </button>
              <button class="btn btn--ghost btn--sm" type="button" @click="closeReschedule">
                Скасувати
              </button>
            </div>
          </div>
          <div v-if="recurringSessionId === session.id" class="recurring-panel">
            <label class="field">
              Кількість повторів
              <select v-model="recurringPreset" class="input input--select">
                <option :value="4">4 тижні</option>
                <option :value="8">8 тижнів</option>
                <option :value="12">12 тижнів</option>
                <option value="custom">Власне число</option>
              </select>
            </label>
            <label v-if="recurringPreset === 'custom'" class="field">
              Вкажіть кількість (1-52)
              <input
                v-model.number="recurringCustomOccurrences"
                type="number"
                min="1"
                max="52"
                step="1"
                class="input"
                placeholder="Наприклад, 6"
              />
            </label>
            <div class="recurring-actions">
              <button
                class="btn btn--sm"
                type="button"
                :disabled="isActionLoading(session.id)"
                @click="submitRecurring(session.id)"
              >
                Створити серію
              </button>
              <button class="btn btn--ghost btn--sm" type="button" @click="closeRecurring">
                Скасувати
              </button>
            </div>

            <div v-if="recurringResult[session.id]" class="recurring-result">
              <div class="status-pill status-pill--ok">
                Створено {{ recurringResult[session.id]?.created_count ?? 0 }} сесій
              </div>
              <div
                v-if="(recurringResult[session.id]?.skipped_count ?? 0) > 0"
                class="status-pill status-pill--warn"
              >
                Пропущено {{ recurringResult[session.id]?.skipped_count ?? 0 }} через конфлікти
              </div>

              <div v-if="(recurringResult[session.id]?.created_dates || []).length" class="recurring-list">
                <div class="muted">Створені дати:</div>
                <ul class="recurring-ul">
                  <li v-for="date in (recurringResult[session.id]?.created_dates || [])" :key="date">
                    {{ formatDateTime(date) }}
                  </li>
                </ul>
              </div>

              <div v-if="(recurringResult[session.id]?.skipped || []).length" class="recurring-list">
                <div class="muted">Пропущені дати:</div>
                <ul class="recurring-ul">
                  <li v-for="item in (recurringResult[session.id]?.skipped || [])" :key="`${item.start_at}-${item.reason}`">
                    {{ formatDateTime(item.start_at) }} - {{ recurringReasonLabel(item.reason) }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Запити</div>
          <h2 class="panel__title">Перенесення сесій</h2>
        </div>
      </div>
      <div v-if="requestsLoading" class="muted">Завантаження запитів...</div>
      <EmptyState
        v-else-if="rescheduleRequests.length === 0"
        title="Немає нових запитів"
        description="Коли клієнти попросять перенести сесію — тут з'явиться запит."
      />
      <div v-else class="request-list">
        <article v-for="req in rescheduleRequests" :key="req.id" class="request-card">
          <div class="request-info">
            <div class="request-title">
              Сесія #{{ req.session_id }} · {{ req.client_name || req.client_username || "Клієнт" }}
            </div>
            <div v-if="req.client_email" class="muted">Пошта: {{ req.client_email }}</div>
            <div class="muted">
              Запитане вільне віконце:
              <span v-if="req.requested_slot_start_at && req.requested_slot_end_at">
                {{ formatDateTime(req.requested_slot_start_at) }}
                · {{ formatDuration(req.requested_slot_start_at, req.requested_slot_end_at) }}
              </span>
              <span v-else>#{{ req.requested_slot_id }}</span>
            </div>
            <div class="status-pill" :class="requestStatusClass(req.status)">
              {{ rescheduleStatusLabel(req.status) }}
            </div>
          </div>
          <div class="request-actions">
            <RouterLink class="btn btn--ghost btn--sm" :to="`/cabinet/sessions/${req.session_id}`">
              Деталі сесії
            </RouterLink>
            <button
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="isRequestLoading(req.id)"
              @click="approveRequest(req.id)"
            >
              Погодити
            </button>
            <button
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="isRequestLoading(req.id)"
              @click="declineRequest(req.id)"
            >
              Відхилити
            </button>
          </div>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Минулі</div>
          <h2 class="panel__title">Історія</h2>
        </div>
      </div>
      <EmptyState
        v-if="!loading && filteredHistorySessions.length === 0"
        title="Історія порожня"
        description="Після завершених або відмінених сесій тут з'явиться історія."
      />
      <div v-else class="session-list">
        <article
          v-for="session in filteredHistorySessions"
          :key="session.id"
          :id="`session-${session.id}`"
          class="session-card"
          :class="{ 'session-card--highlight': highlightedSessionId === session.id }"
          @mouseenter="clearHighlight(session.id)"
        >
          <div class="session-info">
            <div class="session-time">{{ formatDateTime(session.slot_start_at) }}</div>
            <div class="muted">{{ formatDuration(session.slot_start_at, session.slot_end_at) }}</div>
            <div class="muted">
              Клієнт: {{ session.client_name || session.client_username || `#${session.client}` }}
            </div>
            <div v-if="session.client_email" class="muted">Пошта: {{ session.client_email }}</div>
            <div class="status-pill" :class="statusClass(session)">
              {{ statusLabel(session) }}
            </div>
          </div>
          <div class="session-actions">
            <RouterLink class="btn btn--ghost btn--sm" :to="`/cabinet/sessions/${session.id}`">
              Деталі
            </RouterLink>
          </div>
        </article>
      </div>
    </section>

    <div v-if="noteSessionId" class="note-modal">
      <div class="note-modal__backdrop" @click="closeNote"></div>
      <div class="note-modal__content">
        <div class="note-modal__header">
          <div>
            <div class="note-title">Коментар після сесії</div>
            <div class="muted">Оновіть приватну історію клієнта.</div>
          </div>
          <button class="btn btn--ghost btn--sm" type="button" @click="closeNote">
            Закрити
          </button>
        </div>
        <div class="note-panel">
          <label class="field">
            <span class="note-title">Приватна історія клієнта</span>
            <span class="note-badge">Зашифровано</span>
            <textarea
              v-model="noteDraft"
              class="input note-textarea"
              rows="5"
              placeholder="Короткий коментар по сесії та важливі нотатки."
            ></textarea>
            <div class="note-helper muted">Інформація зашифрована. Доступ має лише спеціаліст.</div>
          </label>
          <div class="note-actions">
            <button
              class="btn btn--sm"
              type="button"
              :disabled="noteSessionId ? isNoteSaving(noteSessionId) : false"
              @click="noteSessionId ? saveNote(noteSessionId) : null"
            >
              Зберегти
            </button>
            <button class="btn btn--ghost btn--sm" type="button" @click="closeNote">
              Закрити
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { apiGet, fetchSpecialistProfile, type SpecialistProfile } from '../lib/api'
import { getApiErrorMessage } from '../lib/errors'
import { BOOKING_ERROR_FALLBACKS, BOOKING_SUCCESS_MESSAGES } from '../lib/bookingCopy'
import {
  approveSpecialistRescheduleRequest as approveSpecialistRescheduleRequestAction,
  canCancel as sharedCanCancel,
  canReschedule as sharedCanReschedule,
  canShowRecurringAction as sharedCanShowRecurringAction,
  cancelSpecialistSession as cancelSpecialistSessionAction,
  completeSpecialistSession as completeSpecialistSessionAction,
  confirmSpecialistSession as confirmSpecialistSessionAction,
  createRecurringSpecialistSessions as createRecurringSpecialistSessionsAction,
  declineSpecialistRescheduleRequest as declineSpecialistRescheduleRequestAction,
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
  statusClass as getStatusClass,
  statusLabel as getStatusLabel,
  suggestionReasonLabel as getSuggestionReasonLabel,
  timeUntilLabel as getTimeUntilLabel,
  type SpecialistRecurringSummary,
  type SpecialistRescheduleRequest,
  type SpecialistRescheduleSuggestion,
  type SpecialistSessionLike,
  type SpecialistSlot,
} from '../lib/specialistSessions'
import { useToast } from '../composables/useToast'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'
import EmptyState from '../components/EmptyState.vue'

type Session = {
  id: number
  status: string
  client: number
  client_username?: string
  client_name?: string
  client_email?: string
  therapist: number
  therapist_username?: string
  slot: number | null
  slot_start_at: string | null
  slot_end_at: string | null
}

type Slot = SpecialistSlot
type RescheduleRequest = SpecialistRescheduleRequest
type RecurringSummary = SpecialistRecurringSummary
type RescheduleSuggestion = SpecialistRescheduleSuggestion

type SessionStatusFilter =
  | 'ALL'
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'

const sessionStatusFilterOptions: Array<{ value: SessionStatusFilter; label: string }> = [
  { value: 'ALL', label: 'Усі статуси' },
  { value: 'SCHEDULED', label: 'Заплановано' },
  { value: 'CONFIRMED', label: 'Підтверджено' },
  { value: 'COMPLETED', label: 'Завершено' },
  { value: 'CANCELLED', label: 'Скасовано' },
  { value: 'NO_SHOW', label: 'Не відбулося' },
]

const upcoming = ref<Session[]>([])
const past = ref<Session[]>([])
const availableSlots = ref<Slot[]>([])
const loading = ref(false)
const error = ref('')
const actionLoading = ref<Set<number>>(new Set())
const rescheduleSessionId = ref<number | null>(null)
const rescheduleSlotId = ref<number | ''>('')
const rescheduleSuggestions = ref<Record<number, RescheduleSuggestion[]>>({})
const suggestionsLoading = ref<Set<number>>(new Set())
const recurringSessionId = ref<number | null>(null)
const recurringPreset = ref<number | 'custom'>(4)
const recurringCustomOccurrences = ref<number | ''>('')
const recurringResult = ref<Record<number, RecurringSummary>>({})
const noteSessionId = ref<number | null>(null)
const noteDraft = ref('')
const noteLoading = ref<Set<number>>(new Set())
const noteSaving = ref<Set<number>>(new Set())
const therapistPhotoUrl = ref('')
const rescheduleRequests = ref<RescheduleRequest[]>([])
const requestsLoading = ref(false)
const requestLoading = ref<Set<number>>(new Set())
const highlightedSessionId = ref<number | null>(null)
const statusFilter = ref<SessionStatusFilter>('ALL')
const dateFilter = ref('')
const route = useRoute()
const toast = useToast()
const highlightTimeoutId = ref<number | null>(null)

const statusLabel = (session: Session) => {
  return getStatusLabel(session as SpecialistSessionLike)
}

const statusClass = (session: Session) => {
  return getStatusClass(session as SpecialistSessionLike)
}

const rescheduleStatusLabel = (status: string) => getRescheduleStatusLabel(status)

const requestStatusClass = (status: string) => {
  return getRequestStatusClass(status)
}

const pendingRescheduleSessions = computed(() => {
  const ids = new Set<number>()
  rescheduleRequests.value.forEach((req) => {
    if (req.status === 'PENDING') {
      ids.add(req.session_id)
    }
  })
  return ids
})

const hasPendingReschedule = (sessionId: number) =>
  pendingRescheduleSessions.value.has(sessionId)

const hasActiveSessionFilters = computed(
  () => statusFilter.value !== 'ALL' || Boolean(dateFilter.value)
)

const historySessions = computed(() => {
  const ids = new Set<number>()
  const history = [...upcoming.value, ...past.value]
    .filter((session) =>
      ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(session.status)
    )
    .filter((session) => {
      if (ids.has(session.id)) return false
      ids.add(session.id)
      return true
    })
  return history
})

const upcomingSorted = computed(() => {
  return upcoming.value
    .slice()
    .sort((a, b) => {
      const aPriority = a.status === 'SCHEDULED' ? 0 : 1
      const bPriority = b.status === 'SCHEDULED' ? 0 : 1
      if (aPriority !== bPriority) return aPriority - bPriority
      const aStart = new Date(a.slot_start_at || '').getTime()
      const bStart = new Date(b.slot_start_at || '').getTime()
      return aStart - bStart
    })
})

function sessionDateValue(session: Session) {
  if (!session.slot_start_at) return ''
  return session.slot_start_at.slice(0, 10)
}

function matchesSessionFilters(session: Session) {
  if (statusFilter.value !== 'ALL' && session.status !== statusFilter.value) {
    return false
  }
  if (dateFilter.value && sessionDateValue(session) !== dateFilter.value) {
    return false
  }
  return true
}

const filteredUpcomingSessions = computed(() =>
  upcomingSorted.value.filter((session) => matchesSessionFilters(session))
)

const filteredHistorySessions = computed(() =>
  historySessions.value.filter((session) => matchesSessionFilters(session))
)

const needsConfirmation = computed(() =>
  upcomingSorted.value.filter((session) => session.status === 'SCHEDULED')
)

const nextUpcoming = computed(() => {
  const items = upcomingSorted.value
    .filter((session) => session.slot_start_at)
    .slice()
    .sort(
      (a, b) =>
        new Date(a.slot_start_at || '').getTime() -
        new Date(b.slot_start_at || '').getTime()
    )
  return items[0] || null
})

const canCancel = (status: string) => sharedCanCancel(status)
const canReschedule = (status: string) => sharedCanReschedule(status)

const canShowRecurringAction = (session: Session) => {
  return sharedCanShowRecurringAction(session as SpecialistSessionLike, hasPendingReschedule(session.id))
}

const recurringReasonLabelMap: Record<string, string> = {
  SLOT_UNAVAILABLE: 'На цю дату вже немає вільного вікна',
  SLOT_ALREADY_BOOKED: 'Це вікно вже зайняте',
  CLIENT_TIME_CONFLICT: 'У клієнта вже є інша сесія на цей час',
}

function recurringReasonLabel(reason: string) {
  return recurringReasonLabelMap[reason] || reason
}

function suggestionReasonLabel(reasonTag: string) {
  return getSuggestionReasonLabel(reasonTag)
}

const isActionLoading = (id: number) => actionLoading.value.has(id)
const isNoteSaving = (id: number) => noteSaving.value.has(id)
const isRequestLoading = (id: number) => requestLoading.value.has(id)
const isSuggestionsLoading = (id: number) => suggestionsLoading.value.has(id)

function formatDateTime(value?: string | null) {
  return sharedFormatSessionDateTime(value)
}

function formatDuration(start?: string | null, end?: string | null) {
  return sharedFormatSessionDuration(start, end, {
    empty: 'Тривалість: —',
    prefix: 'Тривалість: ',
  })
}

function timeUntilLabel(session: Session) {
  return getTimeUntilLabel(session as SpecialistSessionLike)
}

function parseSessionIdFromHash(hash: string): number | null {
  if (!hash) return null
  const match = hash.match(/session-(\d+)/)
  if (!match) return null
  const id = Number(match[1])
  return Number.isFinite(id) ? id : null
}

function parseNoteIdFromHash(hash: string): number | null {
  if (!hash) return null
  const match = hash.match(/note-(\d+)/)
  if (!match) return null
  const id = Number(match[1])
  return Number.isFinite(id) ? id : null
}

async function scrollToHighlightedSession() {
  const id = parseSessionIdFromHash(route.hash)
  if (!id) return
  highlightedSessionId.value = id
  if (highlightTimeoutId.value !== null) {
    window.clearTimeout(highlightTimeoutId.value)
    highlightTimeoutId.value = null
  }
  await nextTick()
  const el = document.getElementById(`session-${id}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  highlightTimeoutId.value = window.setTimeout(() => {
    highlightedSessionId.value = null
    highlightTimeoutId.value = null
  }, 8000)
}

function clearHighlight(id: number) {
  if (highlightedSessionId.value === id) {
    highlightedSessionId.value = null
  }
}

async function focusSession(id: number) {
  highlightedSessionId.value = id
  await nextTick()
  const el = document.getElementById(`session-${id}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

function clearSessionFilters() {
  statusFilter.value = 'ALL'
  dateFilter.value = ''
}

async function loadSessions() {
  loading.value = true
  error.value = ''
  try {
    const [upcomingResp, pastResp] = await Promise.all([
      apiGet<Session[]>('/booking/sessions/', { params: { upcoming: true } }),
      apiGet<Session[]>('/booking/sessions/', { params: { upcoming: false } }),
    ])
    upcoming.value = upcomingResp || []
    past.value = pastResp || []
  } catch (err: any) {
    error.value = getApiErrorMessage(err, BOOKING_ERROR_FALLBACKS.loadSessions)
  } finally {
    loading.value = false
  }
}

async function loadTherapistProfilePhoto() {
  try {
    const data: SpecialistProfile | null = await fetchSpecialistProfile()
    therapistPhotoUrl.value = data?.photo_url || ''
  } catch {
    therapistPhotoUrl.value = ''
  }
}

async function loadSlots() {
  try {
    availableSlots.value = await fetchSpecialistAvailableSlotsData()
  } catch {
    availableSlots.value = []
  }
}

function setActionLoading(id: number, value: boolean) {
  const next = new Set(actionLoading.value)
  if (value) {
    next.add(id)
  } else {
    next.delete(id)
  }
  actionLoading.value = next
}

function setNoteLoading(id: number, value: boolean) {
  const next = new Set(noteLoading.value)
  if (value) {
    next.add(id)
  } else {
    next.delete(id)
  }
  noteLoading.value = next
}

function setNoteSaving(id: number, value: boolean) {
  const next = new Set(noteSaving.value)
  if (value) {
    next.add(id)
  } else {
    next.delete(id)
  }
  noteSaving.value = next
}

function setRequestLoading(id: number, value: boolean) {
  const next = new Set(requestLoading.value)
  if (value) {
    next.add(id)
  } else {
    next.delete(id)
  }
  requestLoading.value = next
}

function setSuggestionsLoading(id: number, value: boolean) {
  const next = new Set(suggestionsLoading.value)
  if (value) {
    next.add(id)
  } else {
    next.delete(id)
  }
  suggestionsLoading.value = next
}

async function confirmSession(id: number) {
  setActionLoading(id, true)
  error.value = ''
  try {
    await confirmSpecialistSessionAction(id)
    await loadSessions()
    toast.success(BOOKING_SUCCESS_MESSAGES.sessionConfirmed)
  } catch (err: any) {
    error.value = getApiErrorMessage(err, BOOKING_ERROR_FALLBACKS.confirmSession)
  } finally {
    setActionLoading(id, false)
  }
}

async function completeSession(id: number) {
  const input = window.prompt('Вкажіть фактичну тривалість (хв). Порожньо — стандартна тривалість.')
  if (input === null) return

  const { payload, error: durationError } = getActualDurationPayload(input)
  if (durationError) {
    error.value = durationError
    return
  }

  setActionLoading(id, true)
  error.value = ''
  try {
    await completeSpecialistSessionAction(id, payload)
    await loadSessions()
    await openNoteModal(id)
    toast.success(BOOKING_SUCCESS_MESSAGES.sessionCompleted)
  } catch (err: any) {
    error.value = getApiErrorMessage(err, BOOKING_ERROR_FALLBACKS.completeSession)
  } finally {
    setActionLoading(id, false)
  }
}

async function cancelSession(id: number) {
  setActionLoading(id, true)
  error.value = ''
  try {
    await cancelSpecialistSessionAction(id)
    await loadSessions()
    toast.success(BOOKING_SUCCESS_MESSAGES.sessionCancelled)
  } catch (err: any) {
    error.value = getApiErrorMessage(err, BOOKING_ERROR_FALLBACKS.cancelSession)
  } finally {
    setActionLoading(id, false)
  }
}

async function loadRescheduleSuggestions(id: number) {
  setSuggestionsLoading(id, true)
  try {
    rescheduleSuggestions.value = {
      ...rescheduleSuggestions.value,
      [id]: await fetchSpecialistRescheduleSuggestionsData(id),
    }
  } catch {
    rescheduleSuggestions.value = {
      ...rescheduleSuggestions.value,
      [id]: [],
    }
  } finally {
    setSuggestionsLoading(id, false)
  }
}

async function toggleReschedule(id: number) {
  if (rescheduleSessionId.value === id) {
    closeReschedule()
    return
  }
  rescheduleSessionId.value = id
  rescheduleSlotId.value = ''
  recurringSessionId.value = null
  await loadRescheduleSuggestions(id)
}

function closeReschedule() {
  rescheduleSessionId.value = null
  rescheduleSlotId.value = ''
}

function selectSuggestedSlot(slotId: number) {
  rescheduleSlotId.value = slotId
}

function toggleRecurring(id: number) {
  if (recurringSessionId.value === id) {
    closeRecurring()
    return
  }
  recurringSessionId.value = id
  recurringPreset.value = 4
  recurringCustomOccurrences.value = ''
  rescheduleSessionId.value = null
}

function closeRecurring() {
  recurringSessionId.value = null
}

function recurringOccurrencesValue() {
  return getRecurringOccurrences(recurringPreset.value, recurringCustomOccurrences.value)
}

async function submitReschedule(id: number) {
  if (!rescheduleSlotId.value) return
  setActionLoading(id, true)
  error.value = ''
  try {
    await rescheduleSpecialistSessionAction(id, Number(rescheduleSlotId.value))
    closeReschedule()
    await Promise.all([loadSessions(), loadSlots()])
    toast.success(BOOKING_SUCCESS_MESSAGES.sessionRescheduled)
  } catch (err: any) {
    error.value = getApiErrorMessage(err, BOOKING_ERROR_FALLBACKS.rescheduleSession)
  } finally {
    setActionLoading(id, false)
  }
}

async function submitRecurring(id: number) {
  const occurrences = recurringOccurrencesValue()
  if (!occurrences) {
    error.value = 'Вкажіть кількість повторів від 1 до 52.'
    return
  }
  setActionLoading(id, true)
  error.value = ''
  try {
    const resp = await createRecurringSpecialistSessionsAction(id, occurrences)
    recurringResult.value = {
      ...recurringResult.value,
      [id]: resp,
    }
    await Promise.all([loadSessions(), loadSlots()])
    const skipped = resp?.skipped_count || 0
    const created = resp?.created_count || 0
    if (skipped > 0) {
      toast.success(`Створено ${created} сесій, пропущено ${skipped}.`)
    } else {
      toast.success(BOOKING_SUCCESS_MESSAGES.recurringSeriesCreated)
    }
  } catch (err: any) {
    error.value = getApiErrorMessage(err, BOOKING_ERROR_FALLBACKS.createRecurringSession)
  } finally {
    setActionLoading(id, false)
  }
}


async function loadNote(id: number) {
  setNoteLoading(id, true)
  error.value = ''
  try {
    noteDraft.value = await fetchSpecialistSessionNoteContentData(id)
  } catch (err: any) {
    error.value = getApiErrorMessage(err, BOOKING_ERROR_FALLBACKS.loadSessionNote)
  } finally {
    setNoteLoading(id, false)
  }
}

async function saveNote(id: number) {
  setNoteSaving(id, true)
  error.value = ''
  try {
    await saveSpecialistSessionNoteAction(id, noteDraft.value)
    closeNote()
    toast.success(BOOKING_SUCCESS_MESSAGES.noteSaved)
  } catch (err: any) {
    error.value = getApiErrorMessage(err, BOOKING_ERROR_FALLBACKS.saveSessionNote)
  } finally {
    setNoteSaving(id, false)
  }
}

async function openNoteModal(id: number) {
  noteSessionId.value = id
  noteDraft.value = ''
  await loadNote(id)
}

function closeNote() {
  noteSessionId.value = null
  noteDraft.value = ''
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

async function approveRequest(id: number) {
  setRequestLoading(id, true)
  error.value = ''
  try {
    await approveSpecialistRescheduleRequestAction(id)
    await Promise.all([loadSessions(), loadSlots(), loadRescheduleRequests(), loadTherapistProfilePhoto()])
    toast.success(BOOKING_SUCCESS_MESSAGES.rescheduleRequestApproved)
  } catch (err: any) {
    error.value = getApiErrorMessage(err, BOOKING_ERROR_FALLBACKS.approveRescheduleRequest)
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
    error.value = getApiErrorMessage(err, BOOKING_ERROR_FALLBACKS.declineRescheduleRequest)
  } finally {
    setRequestLoading(id, false)
  }
}

async function openNoteFromHash() {
  const id = parseNoteIdFromHash(route.hash)
  if (!id) return
  await openNoteModal(id)
}

onMounted(async () => {
  await Promise.all([loadSessions(), loadSlots(), loadRescheduleRequests(), loadTherapistProfilePhoto()])
  await scrollToHighlightedSession()
  await openNoteFromHash()
})

watch(
  () => route.hash,
  async () => {
    await scrollToHighlightedSession()
    await openNoteFromHash()
  }
)

onBeforeUnmount(() => {
  if (highlightTimeoutId.value !== null) {
    window.clearTimeout(highlightTimeoutId.value)
  }
})
</script>

<style scoped>
.sessions {
  display: grid;
  gap: 18px;
}

.sessions__hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  background: linear-gradient(135deg, rgba(8, 113, 201, 0.16), rgba(7, 47, 71, 0.06));
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 22px 24px;
  box-shadow: var(--shadow);
}

.sessions__title {
  font-size: 32px;
}

.sessions__subtitle {
  max-width: 520px;
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
  }

  .panel--priority {
    background: linear-gradient(135deg, rgba(8, 113, 201, 0.08), rgba(7, 47, 71, 0.04));
  }

  .priority-grid {
    display: grid;
    gap: 14px;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }

  .priority-card {
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 14px;
    background: #fff;
    display: grid;
    gap: 10px;
  }

  .priority-title {
    font-weight: 600;
  }

  .priority-value {
    font-size: 28px;
    font-family: var(--font-display);
  }

  .priority-list {
    display: grid;
    gap: 8px;
  }

  .priority-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px;
    border-radius: 12px;
    background: rgba(8, 113, 201, 0.05);
  }

  .priority-time {
    font-weight: 600;
  }

.priority-next {
  display: grid;
  gap: 6px;
}

.session-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  align-items: end;
}

.session-filters__field {
  margin: 0;
}

.badge--soft {
  background: rgba(8, 113, 201, 0.12);
}

.session-list {
  display: grid;
  gap: 12px;
  margin-top: 10px;
}

.session-card {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 14px;
  background: #fff;
  display: grid;
  gap: 12px;
}

.session-card--with-photo {
  grid-template-columns: minmax(0, 1fr) 140px;
  align-items: start;
}

.session-summary {
  display: grid;
  gap: 12px;
}

.session-info {
  display: grid;
  gap: 6px;
}

.session-time {
  font-weight: 600;
}

.status-pill {
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: rgba(7, 47, 71, 0.08);
  color: #13455e;
}

.status-pill--ok {
  background: rgba(31, 122, 76, 0.18);
  color: #1f7a4c;
}

.status-pill--warn {
  background: rgba(217, 164, 65, 0.18);
  color: #a57011;
}

.status-pill--muted {
  background: rgba(7, 47, 71, 0.08);
  color: #13455e;
}

.status-pill--danger {
  background: rgba(194, 75, 75, 0.18);
  color: #a03838;
}

.status-pill--new {
  background: rgba(8, 113, 201, 0.16);
  color: #0c4c77;
}

.new-bookings-banner {
  margin-top: 6px;
  padding: 10px 12px;
  border: 1px solid rgba(8, 113, 201, 0.3);
  border-radius: 12px;
  background: rgba(8, 113, 201, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.session-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.session-photo-wrap {
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
}

.session-photo {
  width: 120px;
  height: 120px;
  border-radius: 16px;
  object-fit: cover;
  border: 1px solid var(--line);
  background: rgba(7, 47, 71, 0.04);
}

.session-photo--empty {
  display: grid;
  place-items: center;
  font-size: 12px;
  color: rgba(7, 47, 71, 0.6);
}

.session-card--highlight {
  border-color: rgba(8, 113, 201, 0.55);
  box-shadow: 0 0 0 2px rgba(8, 113, 201, 0.18);
  background: rgba(8, 113, 201, 0.04);
}

.btn--sm {
  padding: 6px 10px;
  font-size: 13px;
}

.reschedule-panel {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  border: 1px dashed rgba(47, 63, 73, 0.2);
  background: rgba(7, 47, 71, 0.04);
  grid-column: 1 / -1;
}

.reschedule-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.suggestions-block {
  display: grid;
  gap: 8px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid rgba(7, 47, 71, 0.12);
  background: rgba(7, 47, 71, 0.03);
}

.suggestions-title {
  font-weight: 600;
}

.suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-btn {
  display: grid;
  gap: 2px;
  text-align: left;
}

.suggestion-meta {
  font-size: 11px;
}

.recurring-panel {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  border: 1px dashed rgba(8, 113, 201, 0.35);
  background: rgba(8, 113, 201, 0.05);
  grid-column: 1 / -1;
}

.recurring-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.recurring-result {
  display: grid;
  gap: 8px;
}

.recurring-list {
  display: grid;
  gap: 4px;
}

.recurring-ul {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 4px;
}

.input--select {
  min-width: 220px;
}

.note-panel {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(47, 63, 73, 0.12);
  background: #fbfbfb;
  grid-column: 1 / -1;
}

.note-textarea {
  min-height: 120px;
  resize: vertical;
}

.note-title {
  display: inline-block;
  margin-right: 8px;
}

.note-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(47, 63, 73, 0.08);
  border: 1px solid rgba(47, 63, 73, 0.16);
  color: #3b4a52;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.note-helper {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.4;
}

  .note-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .note-modal {
    position: fixed;
    inset: 0;
    z-index: 50;
  }

  .note-modal__backdrop {
    position: absolute;
    inset: 0;
    background: rgba(8, 18, 24, 0.35);
  }

  .note-modal__content {
    position: relative;
    max-width: 560px;
    margin: 10vh auto 0;
    background: #fff;
    border-radius: 18px;
    border: 1px solid var(--line);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
    padding: 18px;
    display: grid;
    gap: 12px;
  }

  .note-modal__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

.request-list {
  display: grid;
  gap: 12px;
  margin-top: 10px;
}

.request-card {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 14px;
  background: #fff;
  display: grid;
  gap: 12px;
}

.request-info {
  display: grid;
  gap: 6px;
}

.request-title {
  font-weight: 600;
}

.request-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: 10px;
  padding: 8px 10px;
}

@media (max-width: 860px) {
  .sessions__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .new-bookings-banner {
    flex-direction: column;
    align-items: flex-start;
  }

  .session-card--with-photo {
    grid-template-columns: 1fr;
  }

  .session-photo-wrap {
    justify-content: flex-start;
  }
}
</style>
