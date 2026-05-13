<template>
  <section class="external-sessions">
    <header class="external-sessions__hero">
      <div>
        <h1 class="title external-sessions__title">Сесії без реєстрації</h1>
        <p class="muted external-sessions__subtitle">
          Окремий сценарій для сесій із клієнтами, які записуються без створення акаунта.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet/sessions">Назад до сесій</RouterLink>
    </header>

    <section class="panel">
      <div class="panel__header">
        <div>
          <h2 class="panel__title">Нова сесія без реєстрації</h2>
        </div>
      </div>

      <div v-if="guestQuotaSummary" class="quota-summary" :class="{ 'quota-summary--blocked': isGuestQuotaBlocked }">
        <div class="quota-summary__title">{{ guestQuotaSummary }}</div>
        <template v-if="isGuestQuotaBlocked">
          <div class="quota-summary__message">{{ guestQuotaBlockMessage }}</div>
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
      <section class="panel">
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

      <section class="panel">
        <div class="panel__header">
          <div>
            <h2 class="panel__title">Запити без реєстрації</h2>
          </div>
        </div>

        <div v-if="requestsError" class="form-error">{{ requestsError }}</div>
        <div v-else-if="requestsLoading" class="muted">Завантаження запитів без реєстрації…</div>
        <div v-else-if="guestRequests.length === 0" class="muted">Запитів без реєстрації поки немає.</div>

        <div v-else class="list-grid">
          <article v-for="request in guestRequests" :key="request.id" class="request-card">
            <div class="request-card__main">
              <div class="request-card__title">
                {{ request.guest_name || 'Клієнт' }}
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
              <div v-if="request.external_session_id" class="muted">На основі цього запиту створено сесію без реєстрації.</div>
              <div v-if="request.external_session_id" class="request-next-step">
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
                  Посилання без реєстрації
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
  apiGet,
  approveCabinetGuestBookingRequest,
  createExternalSession,
  createExternalSessionInvite,
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
  price_amount: string
}
type RequestActionType = 'approve' | 'decline'
type RequestActionLoadingState = {
  approve?: boolean
  decline?: boolean
}
type GuestQuotaSnapshot = {
  guest_sessions_enabled?: boolean | null
  guest_sessions_used_in_period?: number | null
  guest_sessions_limit_per_period?: number | null
  guest_sessions_period_days?: number | null
}

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
  price_amount: '',
})

const isCreateOnline = computed(() => createDraft.value.session_format === 'online')
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
  const used = quota.guest_sessions_used_in_period
  const limit = quota.guest_sessions_limit_per_period
  const period = quota.guest_sessions_period_days
  if (typeof limit !== 'number') return 'Сесії без реєстрації доступні'
  if (typeof used !== 'number') return 'Сесії без реєстрації доступні'
  const periodLabel = typeof period === 'number' && Number.isFinite(period) ? period : 30
  return `Сесії без реєстрації: ${used} з ${limit} за ${periodLabel} днів`
})
const guestQuotaBlockMessage = computed(() => {
  if (guestQuota.value?.guest_sessions_enabled === false) {
    return 'Сесії без реєстрації недоступні на вашому тарифі.'
  }
  return 'Ви використали доступні сесії без реєстрації за поточний період. Щоб створити нову сесію без реєстрації, дочекайтесь оновлення ліміту або змініть тариф.'
})
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

function getApiErrorCode(err: unknown) {
  const data = (err as { response?: { data?: { code?: unknown; reason_code?: unknown } } })?.response?.data
  const code = data?.code || data?.reason_code
  return typeof code === 'string' ? code : ''
}

function localizeGuestQuotaCreateError(err: unknown, fallback: string) {
  const code = getApiErrorCode(err)
  if (code === 'GUEST_SESSIONS_LIMIT_REACHED') {
    return 'Ліміт сесій без реєстрації вичерпано. Ви використали доступні сесії без реєстрації за поточний період. Щоб створити нову сесію без реєстрації, дочекайтесь оновлення ліміту або змініть тариф.'
  }
  if (code === 'GUEST_SESSIONS_DISABLED') {
    return 'Сесії без реєстрації недоступні на вашому тарифі.'
  }
  return getApiErrorMessage(err, fallback)
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
        : 'Ліміт сесій без реєстрації вичерпано. Ви використали доступні сесії без реєстрації за поточний період. Щоб створити нову сесію без реєстрації, дочекайтесь оновлення ліміту або змініть тариф.'
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
    toast.success('Запит без реєстрації погоджено.')
    await Promise.all([loadGuestRequests(), loadSessions()])
  } catch (err) {
    const message = getApiErrorMessage(err, 'Не вдалося погодити запит без реєстрації.')
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
    toast.success('Запит без реєстрації відхилено.')
    await loadGuestRequests()
  } catch (err) {
    const message = getApiErrorMessage(err, 'Не вдалося відхилити запит без реєстрації.')
    setRequestActionError(requestId, localizeGuestRequestActionError(message))
  } finally {
    setRequestActionLoading(requestId, 'decline', false)
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

  .request-actions {
    min-width: unset;
    width: 100%;
  }
}
</style>
