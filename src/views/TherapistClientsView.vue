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
    <div v-if="loading" class="muted" style="margin-top: 12px;">Завантаження...</div>

    <section class="panel panel--reminders">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Нагадування</div>
          <h2 class="panel__title">Сесії без коментаря</h2>
        </div>
      </div>
      <div v-if="notesLoading" class="muted">Завантаження...</div>
      <div v-else-if="pendingNotes.length === 0" class="muted">
        Усі завершені сесії мають коментарі.
      </div>
      <div v-else class="history-list">
        <div v-for="item in pendingNotes" :key="item.sessionId" class="history-item">
          <div class="history-meta">
            <div class="history-date">{{ formatDateTime(item.slotStart) }}</div>
            <div class="muted">{{ formatDuration(item.slotStart, item.slotEnd) }}</div>
            <div class="history-status">{{ item.status }}</div>
          </div>
          <div class="muted">
            {{ clientLabel(item.clientId) }}
          </div>
          <div class="client-actions">
            <RouterLink class="btn btn--ghost btn--sm" :to="`/cabinet/sessions#note-${item.sessionId}`">
              Додати нотатку
            </RouterLink>
            <button
              class="btn btn--ghost btn--sm"
              type="button"
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

      <div v-if="filteredClients.length === 0 && !loading" class="muted">
        Немає клієнтів для цього фільтра.
      </div>
      <div v-else class="client-list">
        <article v-for="client in filteredClients" :key="client.client" class="client-card">
          <div class="client-info">
            <div class="client-name">
              {{ client.client_username || ('\u041a\u043b\u0456\u0454\u043d\u0442 #' + client.client) }}
            </div>
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
              :disabled="isHistoryLoading(client.client)"
              @click="toggleHistory(client.client)"
            >
              Приватна історія клієнта
            </button>
            <button
              v-if="client.state !== 'ARCHIVED'"
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="isActionLoading(client.client)"
              @click="archiveClient(client.client)"
            >
              Архівувати
            </button>
            <button
              v-else
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="isActionLoading(client.client)"
              @click="restoreClient(client.client)"
            >
              Відновити
            </button>
          </div>
          <div v-if="expandedClientId === client.client" class="client-history">
            <div class="history-header">
              <div>
                <div class="history-title">Приватна історія клієнта</div>
                <div class="muted history-subtitle">Інформація зашифрована. Доступ має лише спеціаліст.</div>
              </div>
              <span class="history-badge">Зашифровано</span>
            </div>
            <div v-if="isHistoryLoading(client.client)" class="muted">Завантаження історії...</div>
            <div v-else-if="!clientHistory[client.client]?.length" class="muted">
              Нотаток по цьому клієнту ще немає.
            </div>
            <div v-else class="history-list">
              <div v-for="item in clientHistory[client.client]" :key="item.sessionId" class="history-item">
                <div class="history-meta">
                  <div class="history-date">{{ formatDateTime(item.slotStart) }}</div>
                  <div class="muted">{{ formatDuration(item.slotStart, item.slotEnd) }}</div>
                  <div class="history-status">{{ item.status }}</div>
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
import { getApiErrorMessage } from '../lib/errors'

type ClientState = {
  id: number
  client: number
  state: 'CREATED' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  last_session_at: string | null
  upcoming_count: number
  client_username?: string
  client_code?: string
}


type SessionItem = {
  id: number
  client: number
  status: string
  slot_start_at: string
  slot_end_at: string
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
}

type HistoryItem = {
  sessionId: number
  slotStart: string
  slotEnd: string
  status: string
  note: string
}

const clients = ref<ClientState[]>([])
const loading = ref(false)
const error = ref('')
const filter = ref<'ALL' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'>('ALL')
const actionLoading = ref<Set<number>>(new Set())
const expandedClientId = ref<number | null>(null)
const historyLoading = ref<Set<number>>(new Set())
const clientHistory = ref<Record<number, HistoryItem[]>>({})
const sessionsCache = ref<SessionItem[] | null>(null)
const notesLoading = ref(false)
const pendingNotes = ref<PendingNoteItem[]>([])

const filteredClients = computed(() => {
  if (filter.value === 'ALL') return clients.value
  return clients.value.filter((client) => client.state === filter.value)
})

const clientIndex = computed(() => {
  const map = new Map<number, ClientState>()
  clients.value.forEach((client) => {
    map.set(client.client, client)
  })
  return map
})

const isActionLoading = (id: number) => actionLoading.value.has(id)
const isHistoryLoading = (id: number) => historyLoading.value.has(id)

function setFilter(value: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED') {
  filter.value = value
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
  return client?.client_username || `Клієнт #${clientId}`
}

async function loadClients() {
  loading.value = true
  error.value = ''
  try {
    const resp = await apiGet<ClientState[]>('/cabinet/clients/')
    clients.value = resp || []
  } catch (err: any) {
    error.value = getApiErrorMessage(err, '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0437\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0438\u0442\u0438 \u043a\u043b\u0456\u0454\u043d\u0442\u0456\u0432')
  } finally {
    loading.value = false
  }
}

async function archiveClient(id: number) {
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
  try {
    const sessions = await loadSessionsIfNeeded()
    const completed = sessions
      .filter((item) => item.status === 'COMPLETED')
      .sort((a, b) => b.slot_start_at.localeCompare(a.slot_start_at))
      .slice(0, 20)

    const missing: PendingNoteItem[] = []
    for (const session of completed) {
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
        missing.push({
          sessionId: session.id,
          clientId: session.client,
          slotStart: session.slot_start_at,
          slotEnd: session.slot_end_at,
          status: session.status,
        })
      }
      if (missing.length >= 6) break
    }
    pendingNotes.value = missing
  } catch (err: any) {
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити нагадування')
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
      .filter((item) => item.client == clientId)
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
  font-size: 12px;
}

.history-date {
  font-weight: 600;
}

.history-status {
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 11px;
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
