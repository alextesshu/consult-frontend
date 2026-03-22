<template>
  <section class="clients">
    <header class="clients__hero">
      <div>
        <div class="badge">Клієнти</div>
        <h1 class="title clients__title">CRM спеціаліста</h1>
        <p class="muted clients__subtitle">
          Управління статусами клієнтів та доступом до активної роботи.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
    </header>

    <div v-if="error" class="form-error">{{ error }}</div>

    <section class="panel panel--reminders">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Нагадування</div>
          <h2 class="panel__title">Сесії без коментаря</h2>
        </div>
      </div>
      <LoadingSkeleton v-if="notesLoading" variant="list" :count="2" height="88px" />
      <EmptyState
        v-else-if="remindersError"
        :title="remindersErrorTitle"
        :description="remindersError"
      >
        <template #actions>
          <button class="btn btn--ghost" type="button" @click="loadPendingNotes">{{ retryLabel }}</button>
        </template>
      </EmptyState>
      <EmptyState
        v-else-if="pendingNotes.length === 0"
        :title="remindersEmptyTitle"
        :description="remindersEmptyDescription"
      />
      <div v-else class="history-list">
        <div v-for="item in pendingNotes" :key="item.sessionId" class="history-item">
          <div class="history-meta">
            <div class="history-date">{{ formatDateTime(item.slotStart) }}</div>
            <div class="muted">{{ formatDuration(item.slotStart, item.slotEnd) }}</div>
            <div class="history-status">{{ sessionStatusLabel(item.status) }}</div>
          </div>
          <div class="muted">
            {{ item.clientName || clientLabel(item.clientId) }}
          </div>
          <div class="client-actions">
            <RouterLink class="btn btn--ghost btn--sm" :to="`/cabinet/sessions#note-${item.sessionId}`">
              Додати нотатку
            </RouterLink>
            <button
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="!item.clientId || isHistoryLoading(item.clientId)"
              @click="toggleHistory(item.clientId)"
            >
              Відкрити клієнта
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Список</div>
          <h2 class="panel__title">Клієнти</h2>
        </div>
      </div>
      <div class="filters">
        <button class="btn btn--ghost btn--sm" :class="{ 'btn--active': filter === 'ALL' }" @click="setFilter('ALL')">
          Усі
        </button>
        <button class="btn btn--ghost btn--sm" :class="{ 'btn--active': filter === 'ACTIVE' }" @click="setFilter('ACTIVE')">
          Активні
        </button>
        <button class="btn btn--ghost btn--sm" :class="{ 'btn--active': filter === 'INACTIVE' }" @click="setFilter('INACTIVE')">
          Неактивні
        </button>
        <button class="btn btn--ghost btn--sm" :class="{ 'btn--active': filter === 'ARCHIVED' }" @click="setFilter('ARCHIVED')">
          Архів
        </button>
      </div>

      <LoadingSkeleton v-if="clientsLoading" variant="list" :count="4" height="110px" />
      <EmptyState
        v-else-if="clientsError"
        title="Не вдалося завантажити клієнтів"
        :description="clientsError"
      >
        <template #actions>
          <button class="btn btn--ghost" type="button" @click="loadClients">Спробувати ще раз</button>
        </template>
      </EmptyState>
      <EmptyState
        v-else-if="filteredClients.length === 0"
        title="Немає клієнтів для цього фільтра"
        description="Змініть фільтр або поверніться пізніше, коли з'являться нові клієнти."
      />
      <div v-else class="client-list">
        <article v-for="client in filteredClients" :key="relationClientId(client)" class="client-card">
          <div class="client-info">
            <div class="client-name">{{ displayClientName(client) }}</div>
            <div v-if="client.client_code" class="muted">
              Код клієнта: {{ client.client_code }}
            </div>
            <div class="muted">Статус: {{ client.state }}</div>
            <div class="muted">Остання сесія: {{ formatDateTime(client.last_session_at) }}</div>
            <div class="muted">Заплановано: {{ client.upcoming_count ?? 0 }}</div>
          </div>
          <div class="client-actions">
            <button
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="!relationClientId(client) || isHistoryLoading(relationClientId(client))"
              @click="toggleHistory(relationClientId(client))"
            >
              Приватна історія клієнта
            </button>
            <button
              v-if="client.state !== 'ARCHIVED'"
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="!relationClientId(client) || isActionLoading(relationClientId(client))"
              @click="archiveClient(relationClientId(client))"
            >
              Архівувати
            </button>
            <button
              v-else
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="!relationClientId(client) || isActionLoading(relationClientId(client))"
              @click="restoreClient(relationClientId(client))"
            >
              Відновити
            </button>
          </div>
          <div v-if="expandedClientId === relationClientId(client)" class="client-history">
            <div class="history-header">
              <div>
                <div class="history-title">Приватна історія клієнта</div>
                <div class="muted history-subtitle">Інформація зашифрована. Доступ має лише спеціаліст.</div>
              </div>
              <span class="history-badge">Зашифровано</span>
            </div>
            <div v-if="isHistoryLoading(relationClientId(client))" class="muted">Завантаження історії...</div>
            <div v-else-if="!clientHistory[relationClientId(client)]?.length" class="muted">
              Нотаток по цьому клієнту ще немає.
            </div>
            <div v-else class="history-list">
              <div v-for="item in clientHistory[relationClientId(client)]" :key="item.sessionId" class="history-item">
                <div class="history-meta">
                  <div class="history-date">{{ formatDateTime(item.slotStart) }}</div>
                  <div class="muted">{{ formatDuration(item.slotStart, item.slotEnd) }}</div>
                  <div class="history-status">{{ sessionStatusLabel(item.status) }}</div>
                </div>
                <div class="history-note" v-if="item.note">{{ item.note }}</div>
                <div class="muted" v-else>Нотаток ще немає.</div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { apiGet, apiPatch } from '../lib/api'
import EmptyState from '../components/EmptyState.vue'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'
import { formatUkDateTimeCompact } from '../lib/dateTime'
import { getApiErrorMessage } from '../lib/errors'

type ClientState = {
  id: number
  client?: number
  client_id?: number
  state: 'CREATED' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  last_session_at: string | null
  upcoming_count: number
  client_name?: string
  client_username?: string
  client_code?: string
}


type SessionItem = {
  id: number
  client?: number
  client_id?: number
  status: string
  slot_start_at: string
  slot_end_at: string
  client_name?: string | null
  client_username?: string | null
  client_code?: string | null
}

type SessionNotePayload = {
  content?: string
}

type PendingNoteItem = {
  sessionId: number
  clientId: number
  slotStart: string
  slotEnd: string
  status: string
  clientName?: string
}

type HistoryItem = {
  sessionId: number
  slotStart: string
  slotEnd: string
  status: string
  note: string
}

const clients = ref<ClientState[]>([])
const clientsLoading = ref(false)
const clientsError = ref('')
const error = ref('')
const filter = ref<'ALL' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'>('ALL')
const actionLoading = ref<Set<number>>(new Set())
const expandedClientId = ref<number | null>(null)
const historyLoading = ref<Set<number>>(new Set())
const clientHistory = ref<Record<number, HistoryItem[]>>({})
const sessionsCache = ref<SessionItem[] | null>(null)
const notesLoading = ref(false)
const remindersError = ref('')
const pendingNotes = ref<PendingNoteItem[]>([])
const retryLabel = '\u0421\u043f\u0440\u043e\u0431\u0443\u0432\u0430\u0442\u0438 \u0449\u0435 \u0440\u0430\u0437'
const remindersErrorTitle = '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0437\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0438\u0442\u0438 \u043d\u0430\u0433\u0430\u0434\u0443\u0432\u0430\u043d\u043d\u044f'
const remindersEmptyTitle = '\u0423\u0441\u0456 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u0456 \u0441\u0435\u0441\u0456\u0457 \u043c\u0430\u044e\u0442\u044c \u043a\u043e\u043c\u0435\u043d\u0442\u0430\u0440\u0456'
const remindersEmptyDescription = '\u041d\u043e\u0432\u0456 \u043d\u0430\u0433\u0430\u0434\u0443\u0432\u0430\u043d\u043d\u044f \u0437\u0027\u044f\u0432\u043b\u044f\u0442\u044c\u0441\u044f \u043f\u0456\u0441\u043b\u044f \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u043d\u044f \u0441\u0435\u0441\u0456\u0439 \u0431\u0435\u0437 \u043d\u043e\u0442\u0430\u0442\u043a\u0438.'

const filteredClients = computed(() => {
  if (filter.value === 'ALL') return clients.value
  return clients.value.filter((client) => client.state === filter.value)
})

const clientIndex = computed(() => {
  const map = new Map<number, ClientState>()
  clients.value.forEach((client) => {
    const id = relationClientId(client)
    if (id > 0) map.set(id, client)
  })
  return map
})

const isActionLoading = (id: number) => actionLoading.value.has(id)
const isHistoryLoading = (id: number) => historyLoading.value.has(id)
function relationClientId(client: Pick<ClientState, 'client' | 'client_id'>) {
  return Number(client.client ?? client.client_id ?? 0)
}

function relationSessionClientId(session: Pick<SessionItem, 'client' | 'client_id'>) {
  return Number(session.client ?? session.client_id ?? 0)
}

function setFilter(value: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED') {
  filter.value = value
}

function formatDateTime(value?: string | null) {
  return formatUkDateTimeCompact(value)
}

const SESSION_STATUS_LABELS: Record<string, string> = {
  COMPLETED: '\u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u043e',
  CONFIRMED: '\u041f\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043d\u043e',
  SCHEDULED: '\u0417\u0430\u043f\u043b\u0430\u043d\u043e\u0432\u0430\u043d\u043e',
  CANCELLED: '\u0421\u043a\u0430\u0441\u043e\u0432\u0430\u043d\u043e',
  NO_SHOW: '\u041d\u0435 \u0432\u0456\u0434\u0431\u0443\u043b\u043e\u0441\u044f',
}

function sessionStatusLabel(status: string) {
  return SESSION_STATUS_LABELS[status] || status
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

function setHistoryLoading(id: number, value: boolean) {
  const next = new Set(historyLoading.value)
  if (value) {
    next.add(id)
  } else {
    next.delete(id)
  }
  historyLoading.value = next
}

function formatDuration(start?: string | null, end?: string | null) {
  if (!start || !end) return ''
  const s = new Date(start)
  const e = new Date(end)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return ''
  const minutes = Math.max(0, Math.round((e.getTime() - s.getTime()) / 60000))
  if (minutes < 60) return `${minutes} хв`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} год ${rest} хв` : `${hours} год`
}

function clientLabel(clientId: number) {
  const client = clientIndex.value.get(clientId)
  const normalized = normalizeClientName(client?.client_name || client?.client_username)
  if (normalized) return normalized
  if (client?.client_code) return `ID: ${client.client_code}`
  return '\u041a\u043b\u0456\u0454\u043d\u0442'
}
function normalizeClientName(value?: string | null) {
  const name = value?.trim() || ''
  if (!name) return ''
  if (/^#?\d+$/i.test(name)) return ''
  if (/^(client|\u043a\u043b\u0456\u0454\u043d\u0442)\s*#?\d+$/i.test(name)) return ''
  return name
}
function displayClientName(client: Pick<ClientState, 'client' | 'client_name' | 'client_username' | 'client_code'>) {
  const normalized = normalizeClientName(client.client_name || client.client_username)
  if (normalized) return normalized
  if (client.client_code) return `ID: ${client.client_code}`
  return '\u041a\u043b\u0456\u0454\u043d\u0442'
}

async function loadClients() {
  clientsLoading.value = true
  clientsError.value = ''
  try {
    const resp = await apiGet<ClientState[]>('/cabinet/clients/')
    clients.value = resp || []
  } catch (err: any) {
    clients.value = []
    clientsError.value = getApiErrorMessage(err, 'Спробуйте ще раз або оновіть сторінку.')
  } finally {
    clientsLoading.value = false
  }
}

async function archiveClient(id: number) {
  if (!id) return
  setActionLoading(id, true)
  error.value = ''
  try {
    await apiPatch(`/cabinet/clients/${id}/archive/`)
    await loadClients()
  } catch (err: any) {
    error.value = getApiErrorMessage(err, '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0430\u0440\u0445\u0456\u0432\u0443\u0432\u0430\u0442\u0438 \u043a\u043b\u0456\u0454\u043d\u0442\u0430')
  } finally {
    setActionLoading(id, false)
  }
}

async function restoreClient(id: number) {
  if (!id) return
  setActionLoading(id, true)
  error.value = ''
  try {
    await apiPatch(`/cabinet/clients/${id}/restore/`)
    await loadClients()
  } catch (err: any) {
    error.value = getApiErrorMessage(err, '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0432\u0456\u0434\u043d\u043e\u0432\u0438\u0442\u0438 \u043a\u043b\u0456\u0454\u043d\u0442\u0430')
  } finally {
    setActionLoading(id, false)
  }
}

async function loadSessionsIfNeeded() {
  if (sessionsCache.value) return sessionsCache.value
  const resp = await apiGet<SessionItem[]>('/booking/sessions/')
  sessionsCache.value = resp || []
  return sessionsCache.value
}

async function loadPendingNotes() {
  notesLoading.value = true
  remindersError.value = ''
  try {
    const sessions = await loadSessionsIfNeeded()
    const completed = sessions
      .filter((item) => item.status === 'COMPLETED')
      .sort((a, b) => b.slot_start_at.localeCompare(a.slot_start_at))
      .slice(0, 20)
    const missing: PendingNoteItem[] = []
    for (const session of completed) {
      const sessionClientId = relationSessionClientId(session)
      if (!sessionClientId) continue
      let note = ''
      try {
        const resp = await apiGet<SessionNotePayload | null>(`/cabinet/sessions/${session.id}/note/`)
        note = resp?.content || ''
      } catch (err: any) {
        if (err?.response?.status !== 404) {
          throw err
        }
      }
      if (!note.trim()) {
        const mappedClient = clientIndex.value.get(sessionClientId)
        const sessionClientName = normalizeClientName(session.client_name || session.client_username)
        const mappedClientName = normalizeClientName(mappedClient?.client_name || mappedClient?.client_username)
        missing.push({
          sessionId: session.id,
          clientId: sessionClientId,
          slotStart: session.slot_start_at,
          slotEnd: session.slot_end_at,
          status: session.status,
          clientName: sessionClientName || mappedClientName || undefined,
        })
      }
      if (missing.length >= 6) break
    }
    pendingNotes.value = missing
  } catch (err: any) {
    pendingNotes.value = []
    remindersError.value = getApiErrorMessage(
      err,
      '\u0421\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0449\u0435 \u0440\u0430\u0437 \u0430\u0431\u043e \u043e\u043d\u043e\u0432\u0456\u0442\u044c \u0442\u0440\u043e\u0445\u0438 \u043f\u0456\u0437\u043d\u0456\u0448\u0435.'
    )
  } finally {
    notesLoading.value = false
  }
}

async function loadHistory(clientId: number) {
  setHistoryLoading(clientId, true)
  error.value = ''
  try {
    const sessions = await loadSessionsIfNeeded()
    const items = sessions
      .filter((item) => relationSessionClientId(item) === clientId)
      .sort((a, b) => b.slot_start_at.localeCompare(a.slot_start_at))
      .slice(0, 5)

    const history: HistoryItem[] = []
    for (const session of items) {
      let note = ''
      try {
        const resp = await apiGet<SessionNotePayload | null>(`/cabinet/sessions/${session.id}/note/`)
        note = resp?.content || ''
      } catch (err: any) {
        if (err?.response?.status !== 404) {
          throw err
        }
      }
      history.push({
        sessionId: session.id,
        slotStart: session.slot_start_at,
        slotEnd: session.slot_end_at,
        status: session.status,
        note,
      })
    }
    clientHistory.value = { ...clientHistory.value, [clientId]: history }
  } catch (err: any) {
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити нотатки клієнта')
  } finally {
    setHistoryLoading(clientId, false)
  }
}

async function toggleHistory(clientId: number) {
  if (!clientId) return
  if (expandedClientId.value == clientId) {
    expandedClientId.value = null
    return
  }
  expandedClientId.value = clientId
  if (!clientHistory.value[clientId]) {
    await loadHistory(clientId)
  }
}

onMounted(async () => {
  await loadClients()
  await loadPendingNotes()
})
</script>

<style scoped>
.clients {
  display: grid;
  gap: 18px;
}

.clients__hero {
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

.clients__title {
  font-size: 32px;
}

.clients__subtitle {
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

.panel--reminders {
  background: linear-gradient(135deg, rgba(8, 113, 201, 0.08), rgba(7, 47, 71, 0.04));
}

.badge--soft {
  background: rgba(8, 113, 201, 0.12);
}

.filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn--active {
  border-color: #0b4a7d;
  color: #0b4a7d;
  background: #eef6ff;
}

.client-list {
  display: grid;
  gap: 12px;
  margin-top: 10px;
}

.client-card {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 14px;
  background: #fff;
  display: grid;
  gap: 12px;
}

.client-info {
  display: grid;
  gap: 6px;
}

.client-name {
  font-weight: 600;
}

.client-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.client-history {
  border-top: 1px solid rgba(47, 63, 73, 0.12);
  padding-top: 12px;
  display: grid;
  gap: 10px;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.history-title {
  font-weight: 600;
}

.history-subtitle {
  font-size: 12px;
}

.history-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(47, 63, 73, 0.08);
  border: 1px solid rgba(47, 63, 73, 0.16);
  color: #3b4a52;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.history-list {
  display: grid;
  gap: 10px;
}

.history-item {
  padding: 10px 12px;
  border-radius: 12px;
  background: #f7f8fa;
  border: 1px solid rgba(47, 63, 73, 0.08);
  display: grid;
  gap: 6px;
}

.history-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  font-size: 12px;
}

.history-date {
  font-weight: 600;
}

.history-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 20px;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid rgba(90, 103, 114, 0.22);
  background: rgba(90, 103, 114, 0.08);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-transform: none;
  line-height: 1.2;
  color: #5a6772;
}

.history-note {
  white-space: pre-wrap;
  line-height: 1.5;
}

.btn--sm {
  padding: 6px 10px;
  font-size: 13px;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: 10px;
  padding: 8px 10px;
}

@media (max-width: 860px) {
  .clients__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
