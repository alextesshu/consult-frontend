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
              class="btn btn--ghost btn--sm"
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
              @click="completeSession"
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
            <div class="detail-label">Клієнт</div>
            <div class="detail-value">
              {{ clientLabel(session) }}
              <div v-if="session.client_email" class="muted detail-meta">{{ session.client_email }}</div>
              <div class="muted detail-meta">ID: #{{ session.client }}</div>
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
        </div>
        <div v-if="noteLoading" class="muted">Завантаження нотатки...</div>
        <div v-else class="note-panel">
          <label class="field">
            <span class="note-title">Приватна нотатка</span>
            <span class="note-badge">Зашифровано</span>
            <textarea
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
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { apiGet, apiPatch, apiPost, apiPut } from '../lib/api'
import { getApiErrorMessage } from '../lib/errors'
import {
  BOOKING_ERROR_FALLBACKS,
  BOOKING_SUCCESS_MESSAGES,
  BOOKING_UI_MESSAGES,
  getSuggestionReasonLabel,
} from '../lib/bookingCopy'
import { useToast } from '../composables/useToast'
import EmptyState from '../components/EmptyState.vue'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'

type SessionSlot = {
  start_at?: string | null
  end_at?: string | null
}

type SessionDetail = {
  id: number
  status: string
  client: number
  client_username?: string | null
  client_name?: string | null
  client_email?: string | null
  therapist: number
  therapist_username?: string | null
  slot?: SessionSlot | number | null
  slot_start_at?: string | null
  slot_end_at?: string | null
}

type Slot = {
  id: number
  start_at: string
  end_at: string
  is_booked: boolean
}

type RescheduleRequest = {
  id: number
  session_id: number
  requested_slot_id: number
  requested_slot_start_at?: string | null
  requested_slot_end_at?: string | null
  client_username?: string | null
  client_name?: string | null
  client_email?: string | null
  status: string
}

type RecurringSkippedItem = {
  start_at: string
  reason: string
}

type RecurringSummary = {
  created_count: number
  skipped_count: number
  created_dates: string[]
  skipped_reasons: Array<{ reason: string; count: number }>
  skipped: RecurringSkippedItem[]
}

type SessionNotePayload = {
  content?: string
}

type RescheduleSuggestion = {
  slot_id: number
  start_at: string
  end_at: string
  label: string
  reason_tag: string
}

const route = useRoute()
const toast = useToast()
const sessionId = computed(() => Number(route.params.id))
const hasValidSessionId = computed(() => Number.isInteger(sessionId.value) && sessionId.value > 0)
const session = ref<SessionDetail | null>(null)
const loading = ref(false)
const error = ref('')
const pageError = ref('')
const actionLoading = ref(false)
const noteLoading = ref(false)
const noteSaving = ref(false)
const noteDraft = ref('')
const slotsLoading = ref(false)
const availableSlots = ref<Slot[]>([])
const suggestionsLoading = ref(false)
const rescheduleSuggestions = ref<RescheduleSuggestion[]>([])
const selectedSuggestionSlotId = ref<number | null>(null)
const requestsLoading = ref(false)
const rescheduleRequests = ref<RescheduleRequest[]>([])
const requestLoading = ref<Set<number>>(new Set())
const showReschedulePanel = ref(false)
const showRecurringPanel = ref(false)
const recurringPreset = ref<number | 'custom'>(4)
const recurringCustomOccurrences = ref<number | ''>('')
const recurringResult = ref<RecurringSummary | null>(null)

const statusMap: Record<string, string> = {
  SCHEDULED: 'Заплановано',
  CONFIRMED: 'Підтверджено',
  COMPLETED: 'Завершено',
  CANCELLED: 'Скасовано',
  NO_SHOW: 'Не відбулося',
  DRAFT: 'Чернетка',
}

const rescheduleStatusMap: Record<string, string> = {
  PENDING: 'Очікує підтвердження',
  APPROVED: 'Погоджено',
  DECLINED: 'Відхилено',
  CANCELLED: 'Скасовано',
}

const sessionRequests = computed(() =>
  session.value ? rescheduleRequests.value.filter((item) => item.session_id === session.value?.id) : []
)

const isRequestLoading = (id: number) => requestLoading.value.has(id)

watch(error, (value) => {
  if (!value) return
  toast.error(value)
  error.value = ''
})

function sessionStartAt(detail: SessionDetail) {
  if (detail.slot && typeof detail.slot === 'object') {
    return detail.slot.start_at || detail.slot_start_at || null
  }
  return detail.slot_start_at || null
}

function sessionEndAt(detail: SessionDetail) {
  if (detail.slot && typeof detail.slot === 'object') {
    return detail.slot.end_at || detail.slot_end_at || null
  }
  return detail.slot_end_at || null
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return value
  return dt.toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatDuration(start?: string | null, end?: string | null) {
  if (!start || !end) return '—'
  const startDt = new Date(start)
  const endDt = new Date(end)
  if (Number.isNaN(startDt.getTime()) || Number.isNaN(endDt.getTime())) return '—'
  const minutes = Math.max(0, Math.round((endDt.getTime() - startDt.getTime()) / 60000))
  if (!minutes) return '0 хв'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const parts = []
  if (hours) parts.push(`${hours} год`)
  if (mins) parts.push(`${mins} хв`)
  return parts.join(' ')
}

function isSessionInProgress(detail: SessionDetail) {
  if (detail.status !== 'CONFIRMED') return false
  const start = sessionStartAt(detail)
  const end = sessionEndAt(detail)
  if (!start || !end) return false
  const startValue = new Date(start).getTime()
  const endValue = new Date(end).getTime()
  if (Number.isNaN(startValue) || Number.isNaN(endValue)) return false
  const now = Date.now()
  return now >= startValue && now <= endValue
}

function timeUntilLabel(detail: SessionDetail) {
  const start = sessionStartAt(detail)
  if (!start) return ''
  const startValue = new Date(start).getTime()
  if (Number.isNaN(startValue)) return ''
  const diffMs = startValue - Date.now()
  if (diffMs <= 0) return ''
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin > 120) return ''
  if (diffMin < 60) return `${diffMin} хв`
  const hours = Math.floor(diffMin / 60)
  const mins = diffMin % 60
  return mins ? `${hours} год ${mins} хв` : `${hours} год`
}

function clientLabel(detail: SessionDetail) {
  return detail.client_name || detail.client_username || `#${detail.client}`
}

function statusLabel(detail: SessionDetail) {
  if (isSessionInProgress(detail)) return 'В процесі'
  return statusMap[detail.status] || detail.status
}

function statusClass(detail: SessionDetail) {
  if (isSessionInProgress(detail)) return 'status-pill--ok'
  if (detail.status === 'CONFIRMED') return 'status-pill--ok'
  if (detail.status === 'SCHEDULED') return 'status-pill--warn'
  if (detail.status === 'COMPLETED') return 'status-pill--muted'
  if (detail.status === 'CANCELLED' || detail.status === 'NO_SHOW') return 'status-pill--danger'
  return 'status-pill--muted'
}

function rescheduleStatusLabel(status: string) {
  return rescheduleStatusMap[status] || status
}

function requestStatusClass(status: string) {
  if (status === 'PENDING') return 'status-pill--warn'
  if (status === 'APPROVED') return 'status-pill--ok'
  if (status === 'DECLINED') return 'status-pill--danger'
  return 'status-pill--muted'
}

function suggestionReasonLabel(reasonTag: string) {
  return getSuggestionReasonLabel(reasonTag)
}

function canCancel(status: string) {
  return status === 'SCHEDULED' || status === 'CONFIRMED'
}

function canReschedule(status: string) {
  return status === 'SCHEDULED' || status === 'CONFIRMED'
}

function canShowRecurringAction(detail: SessionDetail) {
  if (!canReschedule(detail.status)) return false
  const start = sessionStartAt(detail)
  if (!start) return false
  const startValue = new Date(start).getTime()
  if (Number.isNaN(startValue)) return false
  return startValue - Date.now() >= 24 * 60 * 60 * 1000
}

function recurringOccurrencesValue() {
  if (recurringPreset.value === 'custom') {
    const value = Number(recurringCustomOccurrences.value)
    if (!Number.isInteger(value) || value < 1 || value > 52) {
      return null
    }
    return value
  }
  return recurringPreset.value
}

function setRequestLoading(id: number, value: boolean) {
  const next = new Set(requestLoading.value)
  if (value) next.add(id)
  else next.delete(id)
  requestLoading.value = next
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
  try {
    session.value = await apiGet<SessionDetail>(`/booking/sessions/${sessionId.value}/`)
  } catch (err: any) {
    session.value = null
    pageError.value = getApiErrorMessage(err, BOOKING_ERROR_FALLBACKS.loadSession)
  } finally {
    loading.value = false
  }
}

async function loadSlots() {
  slotsLoading.value = true
  try {
    const resp = await apiGet<Slot[]>('/cabinet/slots/')
    const now = Date.now()
    availableSlots.value = (resp || []).filter((slot) => {
      const start = new Date(slot.start_at).getTime()
      return !slot.is_booked && !Number.isNaN(start) && start > now
    })
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
    const resp = await apiGet<{ suggestions?: RescheduleSuggestion[] }>(
      `/booking/sessions/${sessionId.value}/reschedule-suggestions/`
    )
    rescheduleSuggestions.value = resp?.suggestions || []
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
    const resp = await apiGet<SessionNotePayload | null>(`/cabinet/sessions/${sessionId.value}/note/`)
    noteDraft.value = resp?.content || ''
  } catch (err: any) {
    if (err?.response?.status === 404) {
      noteDraft.value = ''
    } else {
      error.value = getApiErrorMessage(err, BOOKING_ERROR_FALLBACKS.loadSessionNote)
    }
  } finally {
    noteLoading.value = false
  }
}

async function loadRescheduleRequests() {
  requestsLoading.value = true
  try {
    const resp = await apiGet<RescheduleRequest[]>('/cabinet/sessions/reschedule-requests/')
    rescheduleRequests.value = resp || []
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
  await loadSession()
  if (!session.value) return
  await Promise.all([loadSlots(), loadRescheduleSuggestions(), loadNote(), loadRescheduleRequests()])
}

async function refreshSessionContext() {
  await Promise.all([loadSession(), loadSlots(), loadRescheduleSuggestions(), loadRescheduleRequests()])
}

async function confirmSession() {
  if (!session.value) return
  actionLoading.value = true
  error.value = ''
  try {
    await apiPatch(`/booking/sessions/${session.value.id}/confirm/`)
    await refreshSessionContext()
    toast.success(BOOKING_SUCCESS_MESSAGES.sessionConfirmed)
  } catch (err: any) {
    error.value = getApiErrorMessage(err, BOOKING_ERROR_FALLBACKS.confirmSession)
  } finally {
    actionLoading.value = false
  }
}

async function completeSession() {
  if (!session.value) return
  const input = window.prompt('Вкажіть фактичну тривалість (хв). Порожньо - стандартна тривалість.')
  if (input === null) return

  let payload: Record<string, number> | undefined
  if (input.trim()) {
    const minutes = Number(input)
    if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 480) {
      error.value = BOOKING_UI_MESSAGES.invalidDuration
      return
    }
    payload = { actual_duration_minutes: Math.round(minutes) }
  }

  actionLoading.value = true
  error.value = ''
  try {
    await apiPatch(`/booking/sessions/${session.value.id}/complete/`, payload)
    await Promise.all([refreshSessionContext(), loadNote()])
    toast.success(BOOKING_SUCCESS_MESSAGES.sessionCompleted)
  } catch (err: any) {
    error.value = getApiErrorMessage(err, BOOKING_ERROR_FALLBACKS.completeSession)
  } finally {
    actionLoading.value = false
  }
}

async function cancelSession() {
  if (!session.value) return
  actionLoading.value = true
  error.value = ''
  try {
    await apiPatch(`/booking/sessions/${session.value.id}/cancel/`)
    await refreshSessionContext()
    toast.success(BOOKING_SUCCESS_MESSAGES.sessionCancelled)
  } catch (err: any) {
    error.value = getApiErrorMessage(err, BOOKING_ERROR_FALLBACKS.cancelSession)
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
    await apiPatch(`/booking/sessions/${session.value.id}/reschedule/`, { slot_id: slotId })
    selectedSuggestionSlotId.value = null
    await refreshSessionContext()
    toast.success(BOOKING_SUCCESS_MESSAGES.sessionRescheduled)
  } catch (err: any) {
    error.value = getApiErrorMessage(err, BOOKING_ERROR_FALLBACKS.rescheduleSession)
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
    recurringResult.value = await apiPost<RecurringSummary>(
      `/booking/sessions/${session.value.id}/create-recurring/`,
      {
        frequency: 'weekly',
        occurrences,
      }
    )
    await Promise.all([loadSession(), loadSlots()])
    const skipped = recurringResult.value?.skipped_count || 0
    const created = recurringResult.value?.created_count || 0
    if (skipped > 0) {
      toast.success(`Створено ${created} сесій, пропущено ${skipped}.`)
    } else {
      toast.success(BOOKING_SUCCESS_MESSAGES.recurringSeriesCreated)
    }
  } catch (err: any) {
    error.value = getApiErrorMessage(err, BOOKING_ERROR_FALLBACKS.createRecurringSession)
  } finally {
    actionLoading.value = false
  }
}

async function saveNote() {
  if (!sessionId.value) return
  noteSaving.value = true
  error.value = ''
  try {
    await apiPut(`/cabinet/sessions/${sessionId.value}/note/`, { content: noteDraft.value })
    toast.success(BOOKING_SUCCESS_MESSAGES.noteSaved)
  } catch (err: any) {
    error.value = getApiErrorMessage(err, BOOKING_ERROR_FALLBACKS.saveSessionNote)
  } finally {
    noteSaving.value = false
  }
}

async function approveRequest(id: number) {
  setRequestLoading(id, true)
  error.value = ''
  try {
    await apiPatch(`/cabinet/sessions/reschedule-requests/${id}/approve/`)
    await refreshSessionContext()
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
    await apiPatch(`/cabinet/sessions/reschedule-requests/${id}/decline/`)
    await loadRescheduleRequests()
    toast.success(BOOKING_SUCCESS_MESSAGES.rescheduleRequestDeclined)
  } catch (err: any) {
    error.value = getApiErrorMessage(err, BOOKING_ERROR_FALLBACKS.declineRescheduleRequest)
  } finally {
    setRequestLoading(id, false)
  }
}

watch(
  sessionId,
  async () => {
    await loadPage()
  },
  { immediate: true }
)
</script>

<style scoped>
.session-detail {
  display: grid;
  gap: 18px;
}

.detail-hero {
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

.detail-title {
  font-size: 32px;
}

.detail-subtitle {
  max-width: 620px;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 18px;
  background: #fff;
  display: grid;
  gap: 14px;
}

.panel--summary {
  background: linear-gradient(135deg, rgba(8, 113, 201, 0.08), rgba(7, 47, 71, 0.03));
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

.badge--soft {
  background: rgba(8, 113, 201, 0.12);
}

.summary-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.detail-card {
  padding: 12px 14px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(7, 47, 71, 0.1);
  background: rgba(7, 47, 71, 0.04);
  display: grid;
  gap: 6px;
}

.detail-label {
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.detail-value {
  display: grid;
  gap: 8px;
  font-weight: 600;
}

.detail-meta {
  font-size: 12px;
  font-weight: 400;
}

.status-pill {
  width: fit-content;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
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

.request-list {
  display: grid;
  gap: 12px;
}

.request-card {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 14px;
  background: #fff;
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
  border-radius: var(--radius-md);
  border: 1px solid rgba(7, 47, 71, 0.12);
  background: rgba(7, 47, 71, 0.03);
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
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  background: rgba(7, 47, 71, 0.04);
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
  border-radius: var(--radius-sm);
  background: rgba(47, 63, 73, 0.08);
  border: 1px solid rgba(47, 63, 73, 0.16);
  color: #3b4a52;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.note-textarea {
  min-height: 140px;
  resize: vertical;
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
</style>
