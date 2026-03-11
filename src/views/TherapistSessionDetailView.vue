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
import { apiGet } from '../lib/api'
import { getApiErrorMessage } from '../lib/errors'
import { BOOKING_ERROR_FALLBACKS, BOOKING_SUCCESS_MESSAGES } from '../lib/bookingCopy'
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
  sessionEndAt as getSessionEndAt,
  sessionStartAt as getSessionStartAt,
  statusClass as getStatusClass,
  statusLabel as getStatusLabel,
  suggestionReasonLabel as getSuggestionReasonLabel,
  timeUntilLabel as getTimeUntilLabel,
  type SpecialistRecurringSummary,
  type SpecialistRescheduleRequest,
  type SpecialistRescheduleSuggestion,
  type SpecialistSlot,
} from '../lib/specialistSessions'
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

function timeUntilLabel(detail: SessionDetail) {
  return getTimeUntilLabel(detail)
}

function clientLabel(detail: SessionDetail) {
  return getClientLabel(detail)
}

function statusLabel(detail: SessionDetail) {
  return getStatusLabel(detail)
}

function statusClass(detail: SessionDetail) {
  return getStatusClass(detail)
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
  return sharedCanShowRecurringAction(detail)
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
    error.value = getApiErrorMessage(err, BOOKING_ERROR_FALLBACKS.loadSessionNote)
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
    await confirmSpecialistSessionAction(session.value.id)
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

  const { payload, error: durationError } = getActualDurationPayload(input)
  if (durationError) {
    error.value = durationError
    return
  }

  actionLoading.value = true
  error.value = ''
  try {
    await completeSpecialistSessionAction(session.value.id, payload)
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
    await cancelSpecialistSessionAction(session.value.id)
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
    await rescheduleSpecialistSessionAction(session.value.id, slotId)
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
    await saveSpecialistSessionNoteAction(sessionId.value, noteDraft.value)
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
    await approveSpecialistRescheduleRequestAction(id)
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
    await declineSpecialistRescheduleRequestAction(id)
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
