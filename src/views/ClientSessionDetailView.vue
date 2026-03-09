<template>
  <section class="session-detail">
    <header class="detail-hero">
      <div>
        <div class="badge">Сесія клієнта</div>
        <h1 class="title detail-title">Деталі сесії</h1>
        <p class="muted detail-subtitle">Перегляд статусу, скасування або перенесення.</p>
      </div>
      <RouterLink class="btn btn--ghost" to="/client">Назад до кабінету</RouterLink>
    </header>

        <div v-if="loading" class="muted" style="margin-top: 12px;">Завантаження...</div>

    <section v-if="session" class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Статус</div>
          <h2 class="panel__title">{{ statusLabel(session) }}</h2>
        </div>
      </div>
      <div class="detail-grid">
        <div class="detail-card">
          <div class="detail-label">Початок</div>
          <div class="detail-value">{{ formatDateTime(session.slot_start_at) }}</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">Тривалість</div>
          <div class="detail-value">{{ formatDuration(session.slot_start_at, session.slot_end_at) }}</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">Спеціаліст</div>
          <div class="detail-value">
            {{ specialistLabel(session) }}
            <div v-if="session.therapist_email" class="muted" style="font-size: 12px;">
              {{ session.therapist_email }}
            </div>
            <div class="muted" style="font-size: 12px;">
              ID: #{{ session.therapist }}
            </div>
            <div v-if="session.therapist_public_slug" class="detail-actions">
              <RouterLink class="btn btn--ghost btn--sm" :to="`/specialist/${session.therapist_public_slug}`">
                Відкрити профіль
              </RouterLink>
              <button class="btn btn--ghost btn--sm" type="button" @click="copySpecialistLink">
                Скопіювати посилання
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="action-row">
        <button
          class="btn btn--ghost"
          type="button"
          :disabled="actionLoading || !canCancel(session.status)"
          @click="cancelSession"
        >
          Скасувати сесію
        </button>
      </div>
    </section>

    

    <section v-if="session" class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Перенесення</div>
          <h2 class="panel__title">Обрати новий слот</h2>
        </div>
      </div>
      <div class="muted" style="margin-top: 6px;">
        <span v-if="session.status === 'CONFIRMED'">
          Підтверджені сесії переносяться лише після підтвердження спеціаліста.
        </span>
        <span v-else>
          Перенесення виконується як нове бронювання зі скасуванням попередньої сесії.
        </span>
      </div>
      <div class="suggestions-block" style="margin-top: 12px;">
        <div class="muted suggestions-title">Рекомендовані варіанти перенесення</div>
        <div v-if="suggestionsLoading" class="muted">Завантаження рекомендацій...</div>
        <div v-else-if="rescheduleSuggestions.length === 0" class="muted">
          Для цієї сесії зараз немає зручних варіантів перенесення
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
          @click="applySelectedSuggestion"
        >
          {{ session.status === 'CONFIRMED' ? 'Запросити перенос для обраного варіанта' : 'Перенести на обраний варіант' }}
        </button>
      </div>
      <div v-if="slotsLoading" class="muted" style="margin-top: 10px;">Завантаження слотів...</div>
      <div v-else-if="availableSlots.length === 0" class="muted" style="margin-top: 10px;">
        Немає доступних слотів.
      </div>
        <div v-else class="slot-list">
        <div v-for="slot in availableSlots" :key="slot.id" class="slot-card">
          <div>
            <div class="slot-time">{{ formatDateTime(slot.start_at) }}</div>
            <div class="muted">{{ formatDuration(slot.start_at, slot.end_at) }}</div>
          </div>
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :disabled="actionLoading"
            @click="session.status === 'CONFIRMED' ? requestReschedule(slot.id) : rescheduleTo(slot.id)"
          >
            {{ session.status === 'CONFIRMED' ? 'Запросити перенос' : 'Перенести сюди' }}
          </button>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiGet, apiPatch, apiPost } from '../lib/api'
import { getApiErrorMessage } from '../lib/errors'
import { BOOKING_ERROR_FALLBACKS, BOOKING_SUCCESS_MESSAGES, getSuggestionReasonLabel } from '../lib/bookingCopy'
import { useToast } from '../composables/useToast'
type SessionDetail = {
  id: number
  status: string
  slot_start_at: string | null
  slot_end_at: string | null
  therapist: number
  therapist_name?: string | null
  therapist_username?: string | null
  therapist_email?: string | null
  therapist_public_slug?: string | null
  client: number
}

type PublicSlot = {
  id: number
  start_at: string
  end_at: string
}

type RescheduleSuggestion = {
  slot_id: number
  start_at: string
  end_at: string
  label: string
  reason_tag: string
}

const route = useRoute()
const router = useRouter()
const sessionId = computed(() => Number(route.params.id))
const session = ref<SessionDetail | null>(null)
const loading = ref(false)
const error = ref('')
const toast = useToast()
const actionLoading = ref(false)
const slotsLoading = ref(false)
const availableSlots = ref<PublicSlot[]>([])
const suggestionsLoading = ref(false)
const rescheduleSuggestions = ref<RescheduleSuggestion[]>([])
const selectedSuggestionSlotId = ref<number | null>(null)

watch(error, (value) => {
  if (!value) return
  toast.error(value)
  error.value = ''
})

const statusMap: Record<string, string> = {
  SCHEDULED: 'Заплановано',
  CONFIRMED: 'Підтверджено',
  COMPLETED: 'Завершено',
  CANCELLED: 'Скасовано',
  NO_SHOW: 'Не відбулося',
  DRAFT: 'Чернетка',
}

const statusLabel = (detail: SessionDetail) => {
  if (isSessionInProgress(detail)) return 'В процесі'
  return statusMap[detail.status] || detail.status
}

const canCancel = (status: string) => status === 'SCHEDULED' || status === 'CONFIRMED'

function suggestionReasonLabel(reasonTag: string) {
  return getSuggestionReasonLabel(reasonTag)
}

function specialistLabel(detail: SessionDetail) {
  const name = detail.therapist_name || detail.therapist_username
  if (name) return name
  return `#${detail.therapist}`
}

async function copySpecialistLink() {
  if (!session.value?.therapist_public_slug) return
  const url = `${window.location.origin}/specialist/${session.value.therapist_public_slug}`
  try {
    await navigator.clipboard.writeText(url)
    toast.success('Посилання скопійовано.')
  } catch {
    toast.error('Не вдалося скопіювати посилання.')
  }
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

function isSessionInProgress(detail: SessionDetail) {
  if (detail.status !== 'CONFIRMED') return false
  if (!detail.slot_start_at || !detail.slot_end_at) return false
  const start = new Date(detail.slot_start_at).getTime()
  const end = new Date(detail.slot_end_at).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return false
  const now = Date.now()
  return now >= start && now <= end
}

async function loadSession() {
  if (!sessionId.value) return
  loading.value = true
  error.value = ''
  try {
    const resp = await apiGet<SessionDetail>(`/booking/sessions/${sessionId.value}/`)
    session.value = resp
  } catch (err: any) {
    error.value = getApiErrorMessage(err, BOOKING_ERROR_FALLBACKS.loadSession)
  } finally {
    loading.value = false
  }
}

async function loadSlots() {
  if (!session.value) return
  slotsLoading.value = true
  try {
    const resp = await apiGet<PublicSlot[]>('/booking/slots/', {
      params: { therapist_id: session.value.therapist, date_from: new Date().toISOString().slice(0, 10) },
    })
    availableSlots.value = (resp || []).filter((slot) => slot.id)
  } catch {
    availableSlots.value = []
  } finally {
    slotsLoading.value = false
  }
}

async function loadRescheduleSuggestions() {
  if (!session.value) return
  suggestionsLoading.value = true
  try {
    const resp = await apiGet<{ suggestions?: RescheduleSuggestion[] }>(
      `/booking/sessions/${session.value.id}/reschedule-suggestions/`
    )
    rescheduleSuggestions.value = resp?.suggestions || []
  } catch {
    rescheduleSuggestions.value = []
  } finally {
    suggestionsLoading.value = false
  }
}

async function cancelSession() {
  if (!session.value) return
  actionLoading.value = true
  error.value = ''
  try {
    await apiPatch(`/booking/sessions/${session.value.id}/cancel/`)
    await loadSession()
  } catch (err: any) {
    error.value = getApiErrorMessage(err, BOOKING_ERROR_FALLBACKS.cancelSession)
    return
  } finally {
    actionLoading.value = false
  }
  toast.success(BOOKING_SUCCESS_MESSAGES.sessionCancelled)
}

async function rescheduleTo(slotId: number) {
  if (!session.value) return
  actionLoading.value = true
  error.value = ''
  try {
    await apiPost('/booking/sessions/', { slot_id: slotId })
    await apiPatch(`/booking/sessions/${session.value.id}/cancel/`)
    toast.success(BOOKING_SUCCESS_MESSAGES.sessionRescheduled)
    await loadSession()
    router.push('/client')
  } catch (err: any) {
    error.value = getApiErrorMessage(err, BOOKING_ERROR_FALLBACKS.rescheduleSession)
  } finally {
    actionLoading.value = false
  }
}

async function requestReschedule(slotId: number) {
  if (!session.value) return
  actionLoading.value = true
  error.value = ''
  try {
    await apiPost(`/booking/sessions/${session.value.id}/reschedule-request/`, {
      slot_id: slotId,
    })
    toast.success(BOOKING_SUCCESS_MESSAGES.rescheduleRequestSent)
    router.push('/client')
  } catch (err: any) {
    error.value = getApiErrorMessage(err, BOOKING_ERROR_FALLBACKS.sendRescheduleRequest)
  } finally {
    actionLoading.value = false
  }
}

function selectSuggestedSlot(slotId: number) {
  selectedSuggestionSlotId.value = slotId
}

async function applySelectedSuggestion() {
  if (!session.value || !selectedSuggestionSlotId.value) return
  if (session.value.status === 'CONFIRMED') {
    await requestReschedule(selectedSuggestionSlotId.value)
    return
  }
  await rescheduleTo(selectedSuggestionSlotId.value)
}

onMounted(async () => {
  await loadSession()
  await Promise.all([loadSlots(), loadRescheduleSuggestions()])
})
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

.badge--soft {
  background: rgba(8, 113, 201, 0.12);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.detail-card {
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(7, 47, 71, 0.1);
  background: rgba(7, 47, 71, 0.04);
}

.detail-label {
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.detail-value {
  margin-top: 6px;
  font-weight: 600;
}

.detail-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-row {
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
  margin-top: 12px;
}

.slot-card {
  border: 1px solid var(--line);
  border-radius: 12px;
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

.btn--sm {
  padding: 6px 10px;
  font-size: 13px;
}

@media (max-width: 860px) {
  .detail-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
