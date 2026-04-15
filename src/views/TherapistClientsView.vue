<template>
  <section class="clients">
    <header class="clients__hero">
      <div>
        <div class="badge">Клієнти</div>
        <h1 class="title clients__title">Робота з клієнтами</h1>
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

    <section class="panel panel--clients">
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

      <div class="clients-search">
        <label class="clients-search__label" for="clients-search-input">Швидкий пошук</label>
        <input
          id="clients-search-input"
          v-model.trim="searchQuery"
          class="input clients-search__input"
          type="search"
          placeholder="Ім'я, код або номер клієнта"
          autocomplete="off"
        />
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
        <article
          v-for="client in filteredClients"
          :id="clientCardDomId(relationClientId(client))"
          :key="relationClientId(client)"
          class="client-card"
          :class="{ 'client-card--targeted': targetedClientId === relationClientId(client) }"
          tabindex="-1"
        >
          <div class="client-info">
            <div class="client-name">{{ displayClientName(client) }}</div>
            <div v-if="client.client_code" class="muted">
              Код клієнта: {{ client.client_code }}
            </div>
            <div class="muted">Статус: {{ client.state }}</div>
            <div class="muted">Остання сесія: {{ formatDateTime(client.last_session_at) }}</div>
            <div class="muted">Заплановано: {{ client.upcoming_count ?? 0 }}</div>
            <div class="muted">{{ latestNoteSummary(client) }}</div>
            <div class="muted">{{ workbookSummary(client) }}</div>
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
            <RouterLink
              v-if="client.latest_session_note_session_id"
              class="btn btn--ghost btn--sm"
              :to="`/cabinet/sessions#note-${client.latest_session_note_session_id}`"
            >
              Відкрити нотатку
            </RouterLink>
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
            <div class="workbook-block">
              <div class="workbook-block__header">
                <div>
                  <div class="workbook-block__title">Робочий зошит клієнта</div>
                  <div class="muted">{{ workbookSummary(client) }}</div>
                </div>
                <div class="workbook-block__controls">
                  <button
                    class="btn btn--ghost btn--sm"
                    type="button"
                    @click="openWorkbookWindow(relationClientId(client))"
                  >
                    Відкрити в окремому вікні
                  </button>
                  <button class="btn btn--ghost btn--sm" type="button" @click="toggleWorkbook(relationClientId(client))">
                    {{ isWorkbookExpanded(relationClientId(client)) ? 'Згорнути зошит' : 'Розгорнути зошит' }}
                  </button>
                </div>
              </div>
              <div v-if="workbookSavedMessage[relationClientId(client)]" class="workbook-success">
                {{ workbookSavedMessage[relationClientId(client)] }}
              </div>
              <div v-if="isJournalLoading(relationClientId(client))" class="muted">Завантаження робочого зошита...</div>
              <div v-else-if="!isWorkbookExpanded(relationClientId(client))" class="muted">
                Зошит згорнуто для конфіденційності.
              </div>
              <template v-else>
                <textarea
                  v-model="clientJournalDrafts[relationClientId(client)]"
                  class="input workbook-textarea"
                  rows="10"
                  placeholder="Основні спостереження, динаміка, плани та робочі гіпотези по клієнту."
                ></textarea>
                <div class="workbook-actions">
                  <button
                    class="btn btn--sm"
                    type="button"
                    :disabled="isJournalSaving(relationClientId(client))"
                    @click="saveClientJournal(relationClientId(client))"
                  >
                    Зберегти робочий зошит
                  </button>
                </div>
              </template>
            </div>
            <div class="history-list-title">Нотатки по сесіях</div>
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
                <div class="muted">{{ historyNoteSummary(item) }}</div>
                <div class="history-actions">
                  <RouterLink class="btn btn--ghost btn--sm" :to="`/cabinet/sessions#note-${item.sessionId}`">
                    Відкрити нотатку
                  </RouterLink>
                  <RouterLink class="btn btn--ghost btn--sm" :to="`/cabinet/clients/${relationClientId(client)}/workbook`">
                    Відкрити робочий зошит
                  </RouterLink>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { apiGet, apiPatch, fetchChatThreads, type ChatThread } from '../lib/api'
import EmptyState from '../components/EmptyState.vue'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'
import { formatUkDateTimeCompact } from '../lib/dateTime'
import { getApiErrorMessage } from '../lib/errors'
import { openClientWorkbookWindow } from '../lib/workbookWindow'
import {
  fetchSpecialistClientJournalContent as fetchSpecialistClientJournalContentData,
  saveSpecialistClientJournal as saveSpecialistClientJournalAction,
} from '../lib/specialistSessions'

type ClientState = {
  id: number
  client?: number
  client_id?: number
  state: 'CREATED' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  last_session_at: string | null
  upcoming_count: number
  client_name?: string
  client_username?: string
  client_display_name?: string
  display_name?: string
  client_first_name?: string
  client_last_name?: string
  first_name?: string
  last_name?: string
  client_code?: string
  client_journal_content?: string
  client_journal_updated_at?: string | null
  has_client_journal_content?: boolean
  has_workbook_content?: boolean | null
  workbook_updated_at?: string | null
  latest_session_note_at?: string | null
  latest_session_note_session_id?: number | null
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
  client_display_name?: string | null
  display_name?: string | null
  client_first_name?: string | null
  client_last_name?: string | null
  first_name?: string | null
  last_name?: string | null
  client_code?: string | null
  has_note?: boolean | null
  note_updated_at?: string | null
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
  hasNote: boolean
  noteUpdatedAt: string | null
}

type NameSource = {
  client_name?: string | null
  client_username?: string | null
  client_display_name?: string | null
  display_name?: string | null
  client_first_name?: string | null
  client_last_name?: string | null
  first_name?: string | null
  last_name?: string | null
}

type SessionMetadataSource = NameSource & {
  id?: number | null
  session?: number | null
  session_id?: number | null
  client?: number | null
  client_id?: number | null
  status?: string | null
  slot_start_at?: string | null
  slot_end_at?: string | null
  has_note?: boolean | null
  note_updated_at?: string | null
}

type ListResponse<T> = T[] | { results?: T[] } | null | undefined

const clients = ref<ClientState[]>([])
const clientsLoading = ref(false)
const clientsError = ref('')
const error = ref('')
const filter = ref<'ALL' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'>('ALL')
const searchQuery = ref('')
const actionLoading = ref<Set<number>>(new Set())
const expandedClientId = ref<number | null>(null)
const targetedClientId = ref<number | null>(null)
const historyLoading = ref<Set<number>>(new Set())
const clientHistory = ref<Record<number, HistoryItem[]>>({})
const clientJournalDrafts = ref<Record<number, string>>({})
const workbookExpanded = ref<Record<number, boolean>>({})
const workbookSavedMessage = ref<Record<number, string>>({})
const sessionsCache = ref<SessionItem[] | null>(null)
const sessionClientNames = ref<Record<number, string>>({})
const chatClientNames = ref<Record<number, string>>({})
const journalLoading = ref<Set<number>>(new Set())
const journalSaving = ref<Set<number>>(new Set())
const notesLoading = ref(false)
const remindersError = ref('')
const pendingNotes = ref<PendingNoteItem[]>([])
const retryLabel = '\u0421\u043f\u0440\u043e\u0431\u0443\u0432\u0430\u0442\u0438 \u0449\u0435 \u0440\u0430\u0437'
const remindersErrorTitle = '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0437\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0438\u0442\u0438 \u043d\u0430\u0433\u0430\u0434\u0443\u0432\u0430\u043d\u043d\u044f'
const remindersEmptyTitle = '\u0423\u0441\u0456 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u0456 \u0441\u0435\u0441\u0456\u0457 \u043c\u0430\u044e\u0442\u044c \u043a\u043e\u043c\u0435\u043d\u0442\u0430\u0440\u0456'
const remindersEmptyDescription = '\u041d\u043e\u0432\u0456 \u043d\u0430\u0433\u0430\u0434\u0443\u0432\u0430\u043d\u043d\u044f \u0437\u0027\u044f\u0432\u043b\u044f\u0442\u044c\u0441\u044f \u043f\u0456\u0441\u043b\u044f \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u043d\u044f \u0441\u0435\u0441\u0456\u0439 \u0431\u0435\u0437 \u043d\u043e\u0442\u0430\u0442\u043a\u0438.'
const initialDeepLinkClientId = parseClientDeepLinkClientId(window.location.search)
let clientCardHighlightTimer: number | null = null

const filteredClients = computed(() => {
  const byStatus =
    filter.value === 'ALL' ? clients.value : clients.value.filter((client) => client.state === filter.value)
  const query = normalizeSearchValue(searchQuery.value)
  if (!query) return byStatus
  return byStatus.filter((client) => matchesClientSearch(client, query))
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
const isJournalLoading = (id: number) => journalLoading.value.has(id)
const isJournalSaving = (id: number) => journalSaving.value.has(id)
const isWorkbookExpanded = (id: number) => Boolean(workbookExpanded.value[id])
function relationClientId(client: Pick<ClientState, 'client' | 'client_id'>) {
  return Number(client.client ?? client.client_id ?? 0)
}

function relationSessionClientId(session: Pick<SessionItem, 'client' | 'client_id'>) {
  return Number(session.client ?? session.client_id ?? 0)
}

function rememberSessionClientNames(sessions: SessionItem[]) {
  const next = { ...sessionClientNames.value }
  sessions.forEach((session) => {
    const id = relationSessionClientId(session)
    if (!id || next[id]) return
    const normalized = preferredClientName(session)
    if (normalized) next[id] = normalized
  })
  sessionClientNames.value = next
}

function rememberChatClientNames(threads: ChatThread[]) {
  const next = { ...chatClientNames.value }
  threads.forEach((thread) => {
    const id = Number(thread.client_id || 0)
    const normalized = normalizeClientName(thread.other_user?.display_name || '')
    if (!id || !normalized) return
    next[id] = normalized
  })
  chatClientNames.value = next
}

function normalizeSearchValue(value?: string | number | null) {
  return String(value ?? '').trim().toLowerCase()
}

function matchesClientSearch(client: ClientState, query: string) {
  const searchable = [
    displayClientName(client),
    normalizeClientName(client.client_name),
    normalizeClientName(client.client_username),
    client.client_code,
    relationClientId(client),
    client.id,
  ]
  return searchable.map((item) => normalizeSearchValue(item)).some((item) => item.includes(query))
}

function parseClientDeepLinkClientId(search: string) {
  const params = new URLSearchParams(search)
  const value = Number(params.get('client'))
  const autoOpen = params.get('autoOpen')
  const shouldAutoOpen = autoOpen == null || autoOpen === '1' || autoOpen.toLowerCase() === 'true'
  if (!shouldAutoOpen || !Number.isFinite(value) || value <= 0) return null
  return value
}

function clientCardDomId(clientId: number) {
  return `client-card-${clientId}`
}

function clearClientCardHighlightTimer() {
  if (clientCardHighlightTimer == null) return
  window.clearTimeout(clientCardHighlightTimer)
  clientCardHighlightTimer = null
}

function markClientCardAsTargeted(clientId: number) {
  targetedClientId.value = clientId
  clearClientCardHighlightTimer()
  clientCardHighlightTimer = window.setTimeout(() => {
    if (targetedClientId.value === clientId) {
      targetedClientId.value = null
    }
    clientCardHighlightTimer = null
  }, 2400)
}

async function focusClientCard(clientId: number) {
  await nextTick()
  const element = document.getElementById(clientCardDomId(clientId))
  if (!(element instanceof HTMLElement)) return
  element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  element.focus({ preventScroll: true })
  markClientCardAsTargeted(clientId)
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

function setJournalLoading(id: number, value: boolean) {
  const next = new Set(journalLoading.value)
  if (value) {
    next.add(id)
  } else {
    next.delete(id)
  }
  journalLoading.value = next
}

function setJournalSaving(id: number, value: boolean) {
  const next = new Set(journalSaving.value)
  if (value) {
    next.add(id)
  } else {
    next.delete(id)
  }
  journalSaving.value = next
}

function toggleWorkbook(clientId: number) {
  workbookExpanded.value = {
    ...workbookExpanded.value,
    [clientId]: !isWorkbookExpanded(clientId),
  }
  workbookSavedMessage.value = {
    ...workbookSavedMessage.value,
    [clientId]: '',
  }
}

function openWorkbookWindow(clientId: number) {
  openClientWorkbookWindow(clientId)
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
  const fromChat = chatClientNames.value[clientId]
  if (fromChat) return fromChat
  const normalized = preferredClientName(client)
  if (normalized) return normalized
  const fromSessions = sessionClientNames.value[clientId]
  if (fromSessions) return fromSessions
  if (client?.client_code) return `Код: ${client.client_code}`
  if (clientId > 0) return `Клієнт #${clientId}`
  return '\u041a\u043b\u0456\u0454\u043d\u0442'
}
function isMetadataEndpointUnsupported(err: any) {
  const status = Number(err?.response?.status || 0)
  return status === 404 || status === 405 || status === 501
}

function listFromResponse<T>(payload: ListResponse<T>) {
  if (Array.isArray(payload)) return payload
  const withResults = payload as { results?: T[] } | null | undefined
  if (Array.isArray(withResults?.results)) return withResults.results
  return []
}

function toPositiveNumber(...candidates: Array<number | string | null | undefined>) {
  for (const candidate of candidates) {
    const value = Number(candidate)
    if (Number.isFinite(value) && value > 0) return value
  }
  return 0
}

function resolveHasWorkbookContent(
  client?: Pick<ClientState, 'has_workbook_content' | 'has_client_journal_content' | 'client_journal_content'> | null
) {
  if (!client) return false
  if (typeof client.has_workbook_content === 'boolean') return client.has_workbook_content
  if (typeof client.has_client_journal_content === 'boolean') return client.has_client_journal_content
  return Boolean((client.client_journal_content || '').trim())
}

function workbookUpdatedAt(client?: Pick<ClientState, 'workbook_updated_at' | 'client_journal_updated_at'> | null) {
  return client?.workbook_updated_at || client?.client_journal_updated_at || null
}

function workbookSummary(client: ClientState) {
  if (!resolveHasWorkbookContent(client)) return '\u0420\u043e\u0431\u043e\u0447\u0438\u0439 \u0437\u043e\u0448\u0438\u0442 \u0449\u0435 \u043f\u043e\u0440\u043e\u0436\u043d\u0456\u0439.'
  const updatedAt = workbookUpdatedAt(client)
  if (!updatedAt) return '\u0423 \u0440\u043e\u0431\u043e\u0447\u043e\u043c\u0443 \u0437\u043e\u0448\u0438\u0442\u0456 \u0454 \u0437\u0430\u043f\u0438\u0441\u0438.'
  return `\u041e\u0441\u0442\u0430\u043d\u043d\u0454 \u043e\u043d\u043e\u0432\u043b\u0435\u043d\u043d\u044f: ${formatDateTime(updatedAt)}`
}

function latestNoteSummary(client: ClientState) {
  if (!client.latest_session_note_at) return '\u041d\u043e\u0442\u0430\u0442\u043e\u043a \u0449\u0435 \u043d\u0435\u043c\u0430\u0454.'
  return `\u041e\u0441\u0442\u0430\u043d\u043d\u044f \u043d\u043e\u0442\u0430\u0442\u043a\u0430: ${formatDateTime(client.latest_session_note_at)}`
}

function historyNoteSummary(item: Pick<HistoryItem, 'hasNote' | 'noteUpdatedAt'>) {
  if (!item.hasNote) return '\u041d\u043e\u0442\u0430\u0442\u043a\u0438 \u0449\u0435 \u043d\u0435\u043c\u0430\u0454.'
  if (!item.noteUpdatedAt) return '\u041d\u043e\u0442\u0430\u0442\u043a\u0430 \u0434\u043e\u0434\u0430\u043d\u0430.'
  return `\u041d\u043e\u0442\u0430\u0442\u043a\u0443 \u043e\u043d\u043e\u0432\u043b\u0435\u043d\u043e ${formatDateTime(item.noteUpdatedAt)}.`
}

function mapPendingNoteItem(source: SessionMetadataSource): PendingNoteItem | null {
  const sessionId = toPositiveNumber(source.session_id, source.session, source.id)
  const clientId = toPositiveNumber(source.client_id, source.client)
  if (!sessionId || !clientId) return null
  return {
    sessionId,
    clientId,
    slotStart: source.slot_start_at || '',
    slotEnd: source.slot_end_at || '',
    status: source.status || 'COMPLETED',
    clientName: preferredClientName(source) || undefined,
  }
}

function mapHistoryItem(source: SessionMetadataSource): HistoryItem | null {
  const sessionId = toPositiveNumber(source.session_id, source.session, source.id)
  if (!sessionId) return null
  return {
    sessionId,
    slotStart: source.slot_start_at || '',
    slotEnd: source.slot_end_at || '',
    status: source.status || 'COMPLETED',
    hasNote: Boolean(source.has_note),
    noteUpdatedAt: source.note_updated_at || null,
  }
}

function normalizeClientName(value?: string | null) {
  const name = value?.trim() || ''
  if (!name) return ''
  if (/^#?\d+$/i.test(name)) return ''
  if (/^(client|\u043a\u043b\u0456\u0454\u043d\u0442)\s*#?\d+$/i.test(name)) return ''
  return name
}

function fullName(first?: string | null, last?: string | null) {
  const merged = [first?.trim() || '', last?.trim() || ''].filter(Boolean).join(' ')
  return normalizeClientName(merged)
}

function preferredClientName(source?: NameSource | null) {
  if (!source) return ''
  const candidates = [
    source.client_display_name,
    source.display_name,
    fullName(source.client_first_name, source.client_last_name),
    fullName(source.first_name, source.last_name),
    source.client_name,
    source.client_username,
  ]
  for (const candidate of candidates) {
    const normalized = normalizeClientName(candidate)
    if (normalized) return normalized
  }
  return ''
}

function displayClientName(
  client: Pick<
    ClientState,
    | 'client'
    | 'client_id'
    | 'client_name'
    | 'client_username'
    | 'client_display_name'
    | 'display_name'
    | 'client_first_name'
    | 'client_last_name'
    | 'first_name'
    | 'last_name'
    | 'client_code'
  >
) {
  const id = relationClientId(client)
  const fromChat = chatClientNames.value[id]
  if (fromChat) return fromChat
  const normalized = preferredClientName(client)
  if (normalized) return normalized
  const fromSessions = sessionClientNames.value[id]
  if (fromSessions) return fromSessions
  if (client.client_code) return `Код: ${client.client_code}`
  if (id > 0) return `Клієнт #${id}`
  return '\u041a\u043b\u0456\u0454\u043d\u0442'
}

async function loadChatClientNames() {
  try {
    const threads = await fetchChatThreads()
    rememberChatClientNames(Array.isArray(threads) ? threads : [])
  } catch {
    chatClientNames.value = {}
  }
}

async function loadClients() {
  clientsLoading.value = true
  clientsError.value = ''
  try {
    const resp = await apiGet<ClientState[]>('/cabinet/clients/')
    clients.value = resp || []
    const seededDrafts: Record<number, string> = { ...clientJournalDrafts.value }
    for (const item of clients.value) {
      const id = relationClientId(item)
      if (!id) continue
      if (seededDrafts[id] !== undefined) continue
      seededDrafts[id] = item.client_journal_content || ''
    }
    clientJournalDrafts.value = seededDrafts
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
  rememberSessionClientNames(sessionsCache.value)
  return sessionsCache.value
}

async function loadPendingNotes() {
  notesLoading.value = true
  remindersError.value = ''
  try {
    try {
      const remindersResp = await apiGet<ListResponse<SessionMetadataSource>>('/cabinet/notes/reminders/')
      pendingNotes.value = listFromResponse(remindersResp)
        .map((item) => mapPendingNoteItem(item))
        .filter((item): item is PendingNoteItem => Boolean(item))
        .sort((a, b) => b.slotStart.localeCompare(a.slotStart))
    } catch (primaryErr: any) {
      if (!isMetadataEndpointUnsupported(primaryErr)) throw primaryErr
      const sessions = await loadSessionsIfNeeded()
      pendingNotes.value = sessions
        .filter((item) => item.status === 'COMPLETED' && item.has_note === false)
        .map((item) => mapPendingNoteItem(item))
        .filter((item): item is PendingNoteItem => Boolean(item))
        .sort((a, b) => b.slotStart.localeCompare(a.slotStart))
    }
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
  setJournalLoading(clientId, true)
  error.value = ''
  try {
    const client = clientIndex.value.get(clientId)
    const fromClientsList = client?.client_journal_content
    const hasListValue = typeof fromClientsList === 'string'
    const hasWorkbookByMetadata = resolveHasWorkbookContent(client)
    const journalContent = hasListValue
      ? fromClientsList || ''
      : hasWorkbookByMetadata
        ? await fetchSpecialistClientJournalContentData(clientId)
        : ''
    clientJournalDrafts.value = { ...clientJournalDrafts.value, [clientId]: journalContent }

    try {
      const historyResp = await apiGet<ListResponse<SessionMetadataSource>>(
        `/cabinet/clients/${clientId}/notes/history/`,
        { params: { limit: 10 } }
      )
      clientHistory.value = {
        ...clientHistory.value,
        [clientId]: listFromResponse(historyResp)
          .map((item) => mapHistoryItem(item))
          .filter((item): item is HistoryItem => Boolean(item))
          .sort((a, b) => b.slotStart.localeCompare(a.slotStart)),
      }
    } catch (primaryErr: any) {
      if (!isMetadataEndpointUnsupported(primaryErr)) throw primaryErr
      const sessions = await loadSessionsIfNeeded()
      clientHistory.value = {
        ...clientHistory.value,
        [clientId]: sessions
          .filter((item) => relationSessionClientId(item) === clientId && item.status === 'COMPLETED')
          .map((item) => mapHistoryItem(item))
          .filter((item): item is HistoryItem => Boolean(item))
          .sort((a, b) => b.slotStart.localeCompare(a.slotStart)),
      }
    }
  } catch (err: any) {
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити нотатки клієнта')
  } finally {
    setJournalLoading(clientId, false)
    setHistoryLoading(clientId, false)
  }
}

async function saveClientJournal(clientId: number) {
  if (!clientId) return
  setJournalSaving(clientId, true)
  error.value = ''
  try {
    await saveSpecialistClientJournalAction(clientId, clientJournalDrafts.value[clientId] || '')
    workbookExpanded.value = {
      ...workbookExpanded.value,
      [clientId]: false,
    }
    workbookSavedMessage.value = {
      ...workbookSavedMessage.value,
      [clientId]: 'Дані збережено.',
    }
  } catch (err: any) {
    error.value = getApiErrorMessage(err, 'Не вдалося зберегти робочий зошит клієнта')
  } finally {
    setJournalSaving(clientId, false)
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

async function openClientFromDeepLinkIfNeeded() {
  const deepLinkedClientId = initialDeepLinkClientId
  if (!deepLinkedClientId) return
  const matchingClient = clients.value.find((item) => relationClientId(item) === deepLinkedClientId)
  if (!matchingClient) return

  filter.value = 'ALL'
  searchQuery.value = ''
  expandedClientId.value = deepLinkedClientId
  if (!clientHistory.value[deepLinkedClientId]) {
    await loadHistory(deepLinkedClientId)
  }
  await focusClientCard(deepLinkedClientId)
}

onMounted(async () => {
  await Promise.all([loadClients(), loadChatClientNames()])
  await openClientFromDeepLinkIfNeeded()
  await loadPendingNotes()
})

onBeforeUnmount(() => {
  clearClientCardHighlightTimer()
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
  order: 0;
  background: linear-gradient(135deg, rgba(8, 113, 201, 0.1), rgba(7, 47, 71, 0.03));
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 14px 16px;
}

.clients__title {
  font-size: 26px;
  margin-bottom: 4px;
}

.clients__subtitle {
  max-width: 640px;
  font-size: 15px;
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
  order: 2;
  background: linear-gradient(135deg, rgba(8, 113, 201, 0.05), rgba(7, 47, 71, 0.02));
}

.panel--clients {
  order: 1;
}

.badge--soft {
  background: rgba(8, 113, 201, 0.12);
}

.filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.clients-search {
  display: grid;
  gap: 6px;
  max-width: 360px;
}

.clients-search__label {
  font-size: 12px;
  font-weight: 600;
  color: #5a6772;
}

.clients-search__input {
  width: 100%;
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

.client-card--targeted {
  border-color: #0b4a7d;
  box-shadow: 0 0 0 2px rgba(11, 74, 125, 0.14);
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

.history-list-title {
  font-weight: 600;
  margin-top: 2px;
}

.workbook-block {
  display: grid;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(7, 47, 71, 0.12);
  background: rgba(7, 47, 71, 0.03);
}

.workbook-block__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.workbook-block__title {
  font-weight: 600;
}

.workbook-block__controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.workbook-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.workbook-success {
  color: #1f6f52;
  font-size: 13px;
  font-weight: 600;
}

.workbook-textarea {
  min-height: 220px;
  resize: vertical;
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

.history-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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
