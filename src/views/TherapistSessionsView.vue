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
          </div>
          <div v-else class="muted">Немає майбутніх сесій.</div>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Найближчі</div>
          <h2 class="panel__title">Заплановані сесії</h2>
        </div>
      </div>
      <EmptyState
        v-if="!loading && upcoming.length === 0"
        title="Немає запланованих сесій"
        description="Створіть вільні віконця або поділіться профілем, щоб клієнти могли записатися."
        action-text="Створити віконце"
        action-to="/cabinet/slots"
        secondary-text="Керування профілем"
        secondary-to="/cabinet/profile"
      />
      <div v-else class="session-list">
        <article
          v-for="session in upcoming"
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
                v-if="hasPendingReschedule(session.id)"
                class="status-pill status-pill--warn"
              >
                Є запит на перенос
              </div>
            </div>
            <div class="session-actions">
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
        v-if="!loading && historySessions.length === 0"
        title="Історія порожня"
        description="Після завершених або відмінених сесій тут з'явиться історія."
      />
      <div v-else class="session-list">
        <article
          v-for="session in historySessions"
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
import { apiGet, apiPatch, apiPut } from '../lib/api'
import { getApiErrorMessage } from '../lib/errors'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'
import EmptyState from '../components/EmptyState.vue'
import { fetchTherapistProfile } from '../lib/api'

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
  client_username?: string
  client_name?: string
  client_email?: string
  status: string
  created_at: string
  resolved_at: string | null
}

const upcoming = ref<Session[]>([])
const past = ref<Session[]>([])
const availableSlots = ref<Slot[]>([])
const loading = ref(false)
const error = ref('')
const actionLoading = ref<Set<number>>(new Set())
const rescheduleSessionId = ref<number | null>(null)
const rescheduleSlotId = ref<number | ''>('')
const noteSessionId = ref<number | null>(null)
const noteDraft = ref('')
const noteLoading = ref<Set<number>>(new Set())
const noteSaving = ref<Set<number>>(new Set())
const rescheduleRequests = ref<RescheduleRequest[]>([])
const requestsLoading = ref(false)
const requestLoading = ref<Set<number>>(new Set())
const highlightedSessionId = ref<number | null>(null)
const route = useRoute()
const highlightTimeoutId = ref<number | null>(null)

const statusMap: Record<string, string> = {
  SCHEDULED: 'Заплановано',
  CONFIRMED: 'Підтверджено',
  COMPLETED: 'Завершено',
  CANCELLED: 'Скасовано',
  NO_SHOW: 'Не відбулося',
  DRAFT: 'Чернетка',
}

const statusLabel = (session: Session) => {
  if (isSessionInProgress(session)) return 'В процесі'
  return statusMap[session.status] || session.status
}

const statusClass = (session: Session) => {
  if (isSessionInProgress(session)) return 'status-pill--ok'
  if (session.status === 'CONFIRMED') return 'status-pill--ok'
  if (session.status === 'SCHEDULED') return 'status-pill--warn'
  if (session.status === 'COMPLETED') return 'status-pill--muted'
  if (session.status === 'CANCELLED' || session.status === 'NO_SHOW') return 'status-pill--danger'
  return 'status-pill--muted'
}

const rescheduleStatusMap: Record<string, string> = {
  PENDING: 'Очікує підтвердження',
  APPROVED: 'Погоджено',
  DECLINED: 'Відхилено',
  CANCELLED: 'Скасовано',
}

const rescheduleStatusLabel = (status: string) => rescheduleStatusMap[status] || status

const requestStatusClass = (status: string) => {
  if (status === 'PENDING') return 'status-pill--warn'
  if (status === 'APPROVED') return 'status-pill--ok'
  if (status === 'DECLINED') return 'status-pill--danger'
  if (status === 'CANCELLED') return 'status-pill--muted'
  return 'status-pill--muted'
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

const needsConfirmation = computed(() =>
  upcoming.value.filter((session) => session.status === 'SCHEDULED')
)

const nextUpcoming = computed(() => {
  const items = upcoming.value
    .filter((session) => session.slot_start_at)
    .slice()
    .sort(
      (a, b) =>
        new Date(a.slot_start_at || '').getTime() -
        new Date(b.slot_start_at || '').getTime()
    )
  return items[0] || null
})

const canCancel = (status: string) => status === 'SCHEDULED' || status === 'CONFIRMED'
const canReschedule = (status: string) => status === 'SCHEDULED' || status === 'CONFIRMED'

const isActionLoading = (id: number) => actionLoading.value.has(id)
const isNoteLoading = (id: number) => noteLoading.value.has(id)
const isNoteSaving = (id: number) => noteSaving.value.has(id)
const isRequestLoading = (id: number) => requestLoading.value.has(id)

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
  if (!start || !end) return 'Тривалість: —'
  const startDt = new Date(start)
  const endDt = new Date(end)
  if (Number.isNaN(startDt.getTime()) || Number.isNaN(endDt.getTime())) return 'Тривалість: —'
  const minutes = Math.max(0, Math.round((endDt.getTime() - startDt.getTime()) / 60000))
  if (!minutes) return 'Тривалість: 0 хв'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const parts = []
  if (hours) parts.push(`${hours} год`)
  if (mins) parts.push(`${mins} хв`)
  return `Тривалість: ${parts.join(' ')}`
}

function isSessionInProgress(session: Session) {
  if (session.status !== 'CONFIRMED') return false
  if (!session.slot_start_at || !session.slot_end_at) return false
  const start = new Date(session.slot_start_at).getTime()
  const end = new Date(session.slot_end_at).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return false
  const now = Date.now()
  return now >= start && now <= end
}

function timeUntilLabel(session: Session) {
  if (!session.slot_start_at) return ''
  const start = new Date(session.slot_start_at).getTime()
  if (Number.isNaN(start)) return ''
  const diffMs = start - Date.now()
  if (diffMs <= 0) return ''
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin > 120) return ''
  if (diffMin < 60) return `${diffMin} хв`
  const hours = Math.floor(diffMin / 60)
  const mins = diffMin % 60
  return mins ? `${hours} год ${mins} хв` : `${hours} год`
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
    error.value = getApiErrorMessage(err, '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0437\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0438\u0442\u0438 \u0441\u0435\u0441\u0456\u0457')
  } finally {
    loading.value = false
  }
}

async function loadTherapistProfilePhoto() {
  try {
    const data = await fetchTherapistProfile()
    therapistPhotoUrl.value = data?.photo_url || ''
  } catch {
    therapistPhotoUrl.value = ''
  }
}

async function loadSlots() {
  try {
    const resp = await apiGet<Slot[]>('/cabinet/slots/')
    const now = Date.now()
    availableSlots.value = (resp || []).filter((slot) => {
      const start = new Date(slot.start_at).getTime()
      return !slot.is_booked && !Number.isNaN(start) && start > now
    })
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

async function confirmSession(id: number) {
  setActionLoading(id, true)
  error.value = ''
  try {
    await apiPatch(`/booking/sessions/${id}/confirm/`)
    await loadSessions()
  } catch (err: any) {
    error.value = err?.response?.data?.detail || 'Не вдалося підтвердити сесію'
  } finally {
    setActionLoading(id, false)
  }
}

async function completeSession(id: number) {
  const input = window.prompt('Вкажіть фактичну тривалість (хв). Порожньо — стандартна тривалість.')
  if (input === null) return

  let payload: Record<string, number> | undefined
  if (input.trim()) {
    const minutes = Number(input)
    if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 480) {
      error.value = 'Некоректна тривалість. Вкажіть 1–480 хв.'
      return
    }
    payload = { actual_duration_minutes: Math.round(minutes) }
  }

  setActionLoading(id, true)
  error.value = ''
  try {
    await apiPatch(`/booking/sessions/${id}/complete/`, payload)
    await loadSessions()
    await openNoteModal(id)
  } catch (err: any) {
    error.value = err?.response?.data?.detail || 'Не вдалося завершити сесію'
  } finally {
    setActionLoading(id, false)
  }
}

async function cancelSession(id: number) {
  setActionLoading(id, true)
  error.value = ''
  try {
    await apiPatch(`/booking/sessions/${id}/cancel/`)
    await loadSessions()
  } catch (err: any) {
    error.value = err?.response?.data?.detail || 'Не вдалося скасувати сесію'
  } finally {
    setActionLoading(id, false)
  }
}

function toggleReschedule(id: number) {
  if (rescheduleSessionId.value === id) {
    closeReschedule()
    return
  }
  rescheduleSessionId.value = id
  rescheduleSlotId.value = ''
}

function closeReschedule() {
  rescheduleSessionId.value = null
  rescheduleSlotId.value = ''
}

async function submitReschedule(id: number) {
  if (!rescheduleSlotId.value) return
  setActionLoading(id, true)
  error.value = ''
  try {
    await apiPatch(`/booking/sessions/${id}/reschedule/`, {
      slot_id: rescheduleSlotId.value,
    })
    closeReschedule()
    await Promise.all([loadSessions(), loadSlots()])
  } catch (err: any) {
    error.value = err?.response?.data?.detail || 'Не вдалося перенести сесію'
  } finally {
    setActionLoading(id, false)
  }
}


async function loadNote(id: number) {
  setNoteLoading(id, true)
  error.value = ''
  try {
    const resp = await apiGet(`/cabinet/sessions/${id}/note/`)
    noteDraft.value = resp?.content || ''
  } catch (err: any) {
    if (err?.response?.status === 404) {
      noteDraft.value = ''
    } else {
    error.value = err?.response?.data?.detail || 'Не вдалося погодити запит'
    }
  } finally {
    setNoteLoading(id, false)
  }
}

async function saveNote(id: number) {
  setNoteSaving(id, true)
  error.value = ''
  try {
    await apiPut(`/cabinet/sessions/${id}/note/`, { content: noteDraft.value })
    closeNote()
  } catch (err: any) {
    error.value = err?.response?.data?.detail || 'Не вдалося погодити запит'
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
    const resp = await apiGet<RescheduleRequest[]>(
      '/cabinet/sessions/reschedule-requests/'
    )
    rescheduleRequests.value = resp || []
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
    await apiPatch(`/cabinet/sessions/reschedule-requests/${id}/approve/`)
    await Promise.all([loadSessions(), loadSlots(), loadRescheduleRequests(), loadTherapistProfilePhoto()])
  } catch (err: any) {
    error.value = err?.response?.data?.detail || 'Не вдалося погодити запит'
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
  } catch (err: any) {
    error.value = err?.response?.data?.detail || 'Не вдалося відхилити запит'
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

  .session-card--with-photo {
    grid-template-columns: 1fr;
  }

  .session-photo-wrap {
    justify-content: flex-start;
  }
}
</style>
