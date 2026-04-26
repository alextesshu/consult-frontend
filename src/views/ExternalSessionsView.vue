<template>
  <section class="external-sessions">
    <header class="external-sessions__hero">
      <div>
        <div class="badge">Гостьові сесії</div>
        <h1 class="title external-sessions__title">Гостьові сесії</h1>
        <p class="muted external-sessions__subtitle">
          Окремий розділ для гостьових сесій без змішування з основним сценарієм бронювання.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
    </header>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Створення</div>
          <h2 class="panel__title">Нова гостьова сесія</h2>
        </div>
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
          <span>Ім'я гостя (опційно)</span>
          <input v-model="createDraft.guest_name" class="input" type="text" maxlength="120" />
        </label>

        <label class="field">
          <span>Ел. пошта гостя (опційно)</span>
          <input v-model="createDraft.guest_email" class="input" type="email" maxlength="255" />
        </label>
      </div>

      <div class="actions-row">
        <button class="btn" type="button" :disabled="createPending" @click="submitCreate">
          {{ createPending ? 'Створюємо…' : 'Створити гостьову сесію' }}
        </button>
      </div>
      <datalist id="external-session-time-options">
        <option v-for="option in timeOptions" :key="option" :value="option" />
      </datalist>
    </section>

    <div class="external-sessions__operational">
      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Список</div>
            <h2 class="panel__title">Ваші гостьові сесії</h2>
          </div>
        </div>

        <div v-if="listError" class="form-error">{{ listError }}</div>
        <div v-else-if="listLoading" class="muted">Завантаження гостьових сесій…</div>
        <div v-else-if="sessions.length === 0" class="muted">Немає гостьових сесій. Створіть першу сесію вище.</div>

        <div v-else class="list-grid">
          <article v-for="session in sessions" :key="session.id" class="session-card">
            <div class="session-card__main">
              <div class="session-card__time">{{ formatDateTime(session.starts_at) }}</div>
              <div class="muted">Тривалість: {{ session.duration_minutes }} хв</div>
              <div class="muted">Формат: {{ session.session_format === 'offline' ? 'Офлайн' : 'Онлайн' }}</div>
              <div v-if="session.guest_name || session.guest_email" class="muted">
                Гість: {{ session.guest_name || '—' }} <span v-if="session.guest_email">({{ session.guest_email }})</span>
              </div>
              <div class="status-pill" :class="session.status === 'CANCELLED' ? 'status-pill--danger' : 'status-pill--ok'">
                {{ session.status === 'CANCELLED' ? 'Скасовано' : 'Заплановано' }}
              </div>
            </div>
            <RouterLink class="btn btn--ghost btn--sm" :to="`/cabinet/external-sessions/${session.id}`">Деталі</RouterLink>
          </article>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Запити</div>
            <h2 class="panel__title">Гостьові запити</h2>
          </div>
        </div>

        <div v-if="requestsError" class="form-error">{{ requestsError }}</div>
        <div v-else-if="requestsLoading" class="muted">Завантаження гостьових запитів…</div>
        <div v-else-if="guestRequests.length === 0" class="muted">Гостьових запитів поки немає.</div>

        <div v-else class="list-grid">
          <article v-for="request in guestRequests" :key="request.id" class="request-card">
            <div class="request-card__main">
              <div class="request-card__title">
                {{ request.guest_name || 'Гість' }}
              </div>
              <div class="muted">
                Контакт: {{ contactChannelLabel(request.contact_channel) }} · {{ request.contact_value || '—' }}
              </div>
              <div class="muted">
                Запитаний слот: {{ formatDateTime(request.requested_slot_start) }}
                <span v-if="request.duration_minutes"> · {{ request.duration_minutes }} хв</span>
              </div>
              <div class="muted">
                Формат: {{ request.session_format === 'offline' ? 'Офлайн' : 'Онлайн' }}
                <span v-if="request.session_format === 'offline' && request.offline_location_snapshot">
                  · {{ request.offline_location_snapshot }}
                </span>
              </div>
              <div v-if="request.message" class="muted">Коментар: {{ request.message }}</div>
              <div class="status-pill" :class="requestStatusClass(request.status)">
                {{ requestStatusLabel(request.status) }}
              </div>
              <div v-if="requestDecisionAt(request)" class="muted">
                {{ requestDecisionLabel(request.status) }}: {{ formatDateTime(requestDecisionAt(request)) }}
              </div>
              <div v-if="request.external_session_id" class="muted">На основі цього запиту створено гостьову сесію.</div>
              <div v-if="request.external_session_id" class="request-next-step">
                <RouterLink
                  class="btn btn--ghost btn--sm"
                  :to="`/cabinet/external-sessions/${request.external_session_id}`"
                >
                  Відкрити гостьову сесію
                </RouterLink>
                <a
                  v-if="latestInviteUrlByRequestId[request.id]"
                  class="btn btn--ghost btn--sm"
                  :href="latestInviteUrlByRequestId[request.id]"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Гостьове посилання
                </a>
              </div>
            </div>

            <div v-if="isPendingRequest(request.status)" class="request-actions">
              <label v-if="request.session_format === 'online'" class="field request-meeting-field">
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
                @click="declineRequest(request.id)"
              >
                {{ isRequestActionLoading(request.id, 'decline') ? 'Відхиляємо…' : 'Відхилити' }}
              </button>
              <div v-if="requestActionError(request.id)" class="form-error request-card__error">
                {{ requestActionError(request.id) }}
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '../composables/useToast'
import {
  approveCabinetGuestBookingRequest,
  createExternalSession,
  declineCabinetGuestBookingRequest,
  fetchCabinetGuestBookingRequests,
  fetchExternalSessions,
  getApiErrorMessage,
  type ExternalSessionRecord,
  type GuestBookingRequestRecord,
  type SessionFormat,
} from '../lib/api'
import { formatUkDateTimeCompact } from '../lib/dateTime'

type CreateDraft = {
  start_date: string
  start_time: string
  duration_minutes: number
  session_format: SessionFormat
  meeting_url: string
  offline_location_snapshot: string
  guest_name: string
  guest_email: string
}
type RequestActionType = 'approve' | 'decline'
type RequestActionLoadingState = {
  approve?: boolean
  decline?: boolean
}

const router = useRouter()
const toast = useToast()

const listLoading = ref(false)
const listError = ref('')
const requestsLoading = ref(false)
const requestsError = ref('')
const createPending = ref(false)
const createError = ref('')
const sessions = ref<ExternalSessionRecord[]>([])
const guestRequests = ref<GuestBookingRequestRecord[]>([])
const requestActionLoading = ref<Record<number, RequestActionLoadingState>>({})
const requestActionErrors = ref<Record<number, string>>({})
const approveMeetingUrls = ref<Record<number, string>>({})
const latestInviteUrlByRequestId = ref<Record<number, string>>({})

const createDraft = ref<CreateDraft>({
  start_date: '',
  start_time: '',
  duration_minutes: 60,
  session_format: 'online',
  meeting_url: '',
  offline_location_snapshot: '',
  guest_name: '',
  guest_email: '',
})

const isCreateOnline = computed(() => createDraft.value.session_format === 'online')
const timeOptions = Array.from({ length: 24 * 4 }, (_, index) => {
  const minutes = index * 15
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0')
  const mins = String(minutes % 60).padStart(2, '0')
  return `${hours}:${mins}`
})

function formatDateTime(value: string | null | undefined) {
  return formatUkDateTimeCompact(value)
}

function isPendingRequest(status: string | null | undefined) {
  return String(status || '').toLowerCase() === 'pending'
}

function requestStatusLabel(status: string | null | undefined) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'pending') return 'Очікує рішення'
  if (normalized === 'approved') return 'Погоджено'
  if (normalized === 'declined') return 'Відхилено'
  if (normalized === 'cancelled') return 'Скасовано'
  return status || '—'
}

function requestStatusClass(status: string | null | undefined) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'pending') return 'status-pill--warn'
  if (normalized === 'approved') return 'status-pill--ok'
  if (normalized === 'declined' || normalized === 'cancelled') return 'status-pill--danger'
  return 'status-pill--muted'
}

function contactChannelLabel(channel: string | null | undefined) {
  const normalized = String(channel || '').toLowerCase()
  if (normalized === 'email') return 'Ел. пошта'
  if (normalized === 'phone') return 'Телефон'
  if (normalized === 'telegram') return 'Telegram'
  return channel || 'Контакт'
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

function setRequestActionLoading(id: number, action: RequestActionType, value: boolean) {
  const next = { ...requestActionLoading.value }
  const current = { ...next[id] }
  current[action] = value
  if (!current.approve && !current.decline) {
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

function localizeGuestRequestActionError(message: string) {
  const normalized = String(message || '').trim()
  if (!normalized) return ''

  const compact = normalized.toLowerCase().replace(/\s+/g, ' ')
  if (compact === 'requested slot is no longer available.' || compact === 'requested slot is no longer available') {
    return 'Цей слот більше недоступний.'
  }

  return normalized
}

function syncApproveMeetingDrafts(payload: GuestBookingRequestRecord[]) {
  const next: Record<number, string> = {}
  payload.forEach((request) => {
    if (isPendingRequest(request.status) && request.session_format === 'online') {
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
    }
    if (state.approve || state.decline) {
      nextLoading[id] = state
    }
  })
  requestActionLoading.value = nextLoading
}

function isApproveRequestDisabled(request: GuestBookingRequestRecord) {
  if (isRequestActionLoading(request.id, 'approve')) return true
  if (request.session_format !== 'online') return false
  return !String(approveMeetingUrls.value[request.id] || '').trim()
}

function shouldShowApproveMeetingHint(request: GuestBookingRequestRecord) {
  if (!isPendingRequest(request.status)) return false
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

function combineDateTimeToIso(dateValue: string, timeValue: string) {
  if (!dateValue || !timeValue) return ''
  const normalizedTime = normalizeTimeValue(timeValue)
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(normalizedTime)) return ''
  const parsed = new Date(`${dateValue}T${normalizedTime}`)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString()
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
    listError.value = getApiErrorMessage(err, 'Не вдалося завантажити гостьові сесії.')
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
    requestsError.value = getApiErrorMessage(err, 'Не вдалося завантажити гостьові запити.')
    guestRequests.value = []
    approveMeetingUrls.value = {}
  } finally {
    requestsLoading.value = false
  }
}

function validateCreateDraft() {
  const startsAtIso = combineDateTimeToIso(createDraft.value.start_date, createDraft.value.start_time)
  if (!startsAtIso) return 'Вкажіть коректний час початку.'
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
    }

    const created = await createExternalSession(payload)
    toast.success('Гостьову сесію створено.')
    await loadSessions()
    await router.push(`/cabinet/external-sessions/${created.id}`)
  } catch (err) {
    createError.value = getApiErrorMessage(err, 'Не вдалося створити гостьову сесію.')
  } finally {
    createPending.value = false
  }
}

async function approveRequest(request: GuestBookingRequestRecord) {
  if (!isPendingRequest(request.status)) return
  setRequestActionError(request.id, '')
  const meetingUrl = String(approveMeetingUrls.value[request.id] || '').trim()
  if (request.session_format === 'online' && !meetingUrl) {
    setRequestActionError(request.id, 'Для онлайн-запиту перед погодженням додайте посилання на зустріч.')
    return
  }

  setRequestActionLoading(request.id, 'approve', true)
  try {
    const response = await approveCabinetGuestBookingRequest(
      request.id,
      request.session_format === 'online' ? { meeting_url: meetingUrl } : {}
    )
    latestInviteUrlByRequestId.value = {
      ...latestInviteUrlByRequestId.value,
      [request.id]: response.invite?.invite_url || '',
    }
    toast.success('Гостьовий запит погоджено.')
    await Promise.all([loadGuestRequests(), loadSessions()])
  } catch (err) {
    const message = getApiErrorMessage(err, 'Не вдалося погодити гостьовий запит.')
    setRequestActionError(request.id, localizeGuestRequestActionError(message))
  } finally {
    setRequestActionLoading(request.id, 'approve', false)
  }
}

async function declineRequest(requestId: number) {
  setRequestActionError(requestId, '')
  setRequestActionLoading(requestId, 'decline', true)
  try {
    await declineCabinetGuestBookingRequest(requestId)
    toast.success('Гостьовий запит відхилено.')
    await loadGuestRequests()
  } catch (err) {
    const message = getApiErrorMessage(err, 'Не вдалося відхилити гостьовий запит.')
    setRequestActionError(requestId, localizeGuestRequestActionError(message))
  } finally {
    setRequestActionLoading(requestId, 'decline', false)
  }
}

onMounted(async () => {
  await Promise.all([loadSessions(), loadGuestRequests()])
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
  background: linear-gradient(135deg, rgba(8, 113, 201, 0.16), rgba(7, 47, 71, 0.06));
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 22px 24px;
  box-shadow: var(--shadow);
}

.external-sessions__title {
  font-size: 32px;
}

.external-sessions__subtitle {
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

.external-sessions__operational {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  align-items: start;
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

.list-grid {
  display: grid;
  gap: 12px;
}

.session-card {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
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

.request-card {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 12px;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.request-card__main {
  display: grid;
  gap: 6px;
}

.request-card__title {
  font-weight: 700;
}

.request-actions {
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
  flex-wrap: wrap;
  gap: 8px;
}

.request-card__error {
  margin-top: 2px;
}

.status-pill {
  width: fit-content;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.status-pill--ok {
  background: rgba(31, 122, 76, 0.18);
  color: #1f7a4c;
}

.status-pill--warn {
  background: rgba(176, 123, 16, 0.18);
  color: #8b5f00;
}

.status-pill--danger {
  background: rgba(194, 75, 75, 0.18);
  color: #a03838;
}

.status-pill--muted {
  background: rgba(109, 117, 139, 0.14);
  color: #4b5563;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: var(--radius-sm);
  padding: 8px 10px;
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
  }

  .session-card {
    flex-direction: column;
  }

  .request-card {
    flex-direction: column;
  }

  .request-actions {
    min-width: unset;
    width: 100%;
  }
}
</style>
