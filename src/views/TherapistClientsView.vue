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

    <section v-if="showRemindersPanel" class="panel panel--reminders">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Нагадування</div>
          <h2 class="panel__title">Нотатки після сесій</h2>
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
      <div v-else class="reminders-summary">
        <div>
          <p class="reminders-summary__text">{{ pendingNotesSummary }}</p>
          <p class="reminders-summary__hint">Для зручності ведення історії можна додати коротку нотатку після сесії.</p>
        </div>
        <button
          class="btn btn--ghost btn--sm"
          type="button"
          @click="toggleRemindersExpanded"
        >
          {{ remindersExpanded ? 'Сховати сесії' : 'Показати сесії' }}
        </button>
      </div>
      <div v-if="remindersExpanded && pendingNotes.length > 0" class="history-list history-list--reminders">
        <div v-for="item in visiblePendingNotes" :key="item.sessionId" class="history-item history-item--compact">
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
            <button
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="isNoteSkipping(item.sessionId)"
              @click="skipPendingNote(item.sessionId)"
            >
              {{ isNoteSkipping(item.sessionId) ? 'Завершуємо...' : 'Залишити без нотатки' }}
            </button>
          </div>
        </div>
        <button
          v-if="hasMorePendingNotes"
          class="btn btn--ghost btn--sm reminders-more"
          type="button"
          @click="showMorePendingNotes"
        >
          Показати ще
        </button>
      </div>
    </section>

    <section class="panel panel--clients">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Список</div>
          <h2 class="panel__title">Клієнти</h2>
        </div>
      </div>
      <div class="clients-toolbar">
        <div class="filters" aria-label="Фільтр клієнтів">
          <button class="filters__item" :class="{ 'is-active': filter === 'ALL' }" @click="setFilter('ALL')">
            Усі
          </button>
          <button class="filters__item" :class="{ 'is-active': filter === 'ACTIVE' }" @click="setFilter('ACTIVE')">
            Активні
          </button>
          <button class="filters__item" :class="{ 'is-active': filter === 'INACTIVE' }" @click="setFilter('INACTIVE')">
            Неактивні
          </button>
          <button class="filters__item" :class="{ 'is-active': filter === 'ARCHIVED' }" @click="setFilter('ARCHIVED')">
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
        :title="clientsEmptyTitle"
        :description="clientsEmptyDescription"
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
          <div class="client-card__main">
            <div class="client-card__identity">
              <div>
                <div class="client-name">{{ displayClientName(client) }}</div>
                <div v-if="client.client_code" class="client-code">Код клієнта: {{ client.client_code }}</div>
              </div>
              <span class="client-status" :class="clientStatusClass(client.state)">
                {{ clientStatusLabel(client.state) }}
              </span>
            </div>

            <dl class="client-meta">
              <div class="client-meta__item">
                <dt>Остання сесія</dt>
                <dd>{{ optionalDateLabel(client.last_session_at, 'Ще не було') }}</dd>
              </div>
              <div class="client-meta__item">
                <dt>Заплановано</dt>
                <dd>{{ client.upcoming_count ?? 0 }}</dd>
              </div>
              <div class="client-meta__item">
                <dt>Остання нотатка</dt>
                <dd>{{ latestNoteSummary(client) }}</dd>
              </div>
              <div class="client-meta__item">
                <dt>Робочий зошит</dt>
                <dd>{{ workbookSummary(client) }}</dd>
              </div>
              <div class="client-meta__item">
                <dt>Оновлено</dt>
                <dd>{{ clientUpdatedLabel(client) }}</dd>
              </div>
            </dl>
          </div>
          <div class="client-actions">
            <div class="client-actions__primary">
              <RouterLink
                v-if="client.latest_session_note_session_id"
                class="btn btn--sm"
                :to="`/cabinet/sessions#note-${client.latest_session_note_session_id}`"
              >
                Відкрити нотатку
              </RouterLink>
              <button
                v-else
                class="btn btn--sm"
                type="button"
                :disabled="!relationClientId(client) || isHistoryLoading(relationClientId(client))"
                @click="toggleHistory(relationClientId(client))"
              >
                Приватна історія клієнта
              </button>
            </div>
            <div class="client-actions__secondary">
              <button
                v-if="client.latest_session_note_session_id"
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="!relationClientId(client) || isHistoryLoading(relationClientId(client))"
                @click="toggleHistory(relationClientId(client))"
              >
                Приватна історія
              </button>
              <button
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="!relationClientId(client) || isQuickAddLoading(relationClientId(client))"
                @click="openClientPracticeBoardModal(relationClientId(client))"
              >
                {{ isQuickAddLoading(relationClientId(client)) ? 'Додаємо…' : 'Додати на дошку' }}
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
                    {{
                      isWorkbookExpanded(relationClientId(client))
                        ? 'Згорнути робочий зошит'
                        : 'Розгорнути робочий зошит'
                    }}
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
    <PracticeBoardQuickAddModal
      :open="quickAddModalOpen"
      :pending="isQuickAddLoading(quickAddDraftClientId || 0)"
      :error="quickAddModalError"
      subtitle="Сформулюйте наступний крок по клієнту."
      @cancel="closeClientPracticeBoardModal"
      @submit="submitClientPracticeBoardQuickAdd"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { apiGet, apiPatch, fetchChatThreads, type ChatThread } from '../lib/api'
import EmptyState from '../components/EmptyState.vue'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'
import PracticeBoardQuickAddModal from '../components/PracticeBoardQuickAddModal.vue'
import { formatUkDateTimeCompact } from '../lib/dateTime'
import { getApiErrorMessage } from '../lib/errors'
import { openClientWorkbookWindow } from '../lib/workbookWindow'
import { useToast } from '../composables/useToast'
import {
  createPracticeBoardItem,
  fetchPracticeBoards,
  resolveDefaultPracticeBoardId,
} from '../lib/specialistPracticeBoard'
import {
  fetchSpecialistClientWorkbookSnapshot as fetchSpecialistClientWorkbookSnapshotData,
  saveSpecialistClientJournal as saveSpecialistClientJournalAction,
  skipSpecialistSessionNote as skipSpecialistSessionNoteAction,
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
const workbookMissingByClient = ref<Record<number, boolean>>({})
const sessionsCache = ref<SessionItem[] | null>(null)
const sessionClientNames = ref<Record<number, string>>({})
const chatClientNames = ref<Record<number, string>>({})
const journalLoading = ref<Set<number>>(new Set())
const journalSaving = ref<Set<number>>(new Set())
const quickAddLoading = ref<Set<number>>(new Set())
const quickAddModalOpen = ref(false)
const quickAddModalError = ref('')
const quickAddDraftClientId = ref<number | null>(null)
const notesLoading = ref(false)
const remindersError = ref('')
const pendingNotes = ref<PendingNoteItem[]>([])
const remindersExpanded = ref(false)
const pendingNotesVisibleLimit = ref(3)
const noteSkipping = ref<Set<number>>(new Set())
const retryLabel = '\u0421\u043f\u0440\u043e\u0431\u0443\u0432\u0430\u0442\u0438 \u0449\u0435 \u0440\u0430\u0437'
const remindersErrorTitle = '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0437\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0438\u0442\u0438 \u043d\u0430\u0433\u0430\u0434\u0443\u0432\u0430\u043d\u043d\u044f'
const initialDeepLinkClientId = parseClientDeepLinkClientId(window.location.search)
let clientCardHighlightTimer: number | null = null
const toast = useToast()

const filteredClients = computed(() => {
  const byStatus =
    filter.value === 'ALL' ? clients.value : clients.value.filter((client) => client.state === filter.value)
  const query = normalizeSearchValue(searchQuery.value)
  if (!query) return byStatus
  return byStatus.filter((client) => matchesClientSearch(client, query))
})

const clientsEmptyTitle = computed(() => {
  if (searchQuery.value.trim()) return 'Нічого не знайдено'
  if (filter.value === 'ACTIVE') return 'Активних клієнтів поки немає'
  if (filter.value === 'INACTIVE') return 'Неактивних клієнтів поки немає'
  if (filter.value === 'ARCHIVED') return 'Архів порожній'
  return 'Клієнтів поки немає'
})

const clientsEmptyDescription = computed(() => {
  if (searchQuery.value.trim()) return 'Перевірте написання або змініть фільтр, щоб побачити більше клієнтів.'
  if (filter.value === 'ACTIVE') return 'Активні клієнти з’являться тут після підтверджених або поточних консультацій.'
  if (filter.value === 'INACTIVE') return 'Клієнти без поточної роботи з’являться тут, коли не буде запланованих сесій.'
  if (filter.value === 'ARCHIVED') return 'Архівовані клієнти зберігатимуться тут, якщо ви приберете їх з активної роботи.'
  return 'Клієнти з’являться після перших консультацій або гостьових сесій.'
})

const showRemindersPanel = computed(() => notesLoading.value || Boolean(remindersError.value) || pendingNotes.value.length > 0)

const pendingNotesSummary = computed(() => {
  const count = pendingNotes.value.length
  if (count === 1) return 'Є 1 завершена сесія, до якої можна додати нотатку.'
  return `Є ${count} завершені сесії, до яких можна додати нотатку.`
})

const visiblePendingNotes = computed(() => pendingNotes.value.slice(0, pendingNotesVisibleLimit.value))

const hasMorePendingNotes = computed(() => pendingNotesVisibleLimit.value < pendingNotes.value.length)

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
const isQuickAddLoading = (id: number) => quickAddLoading.value.has(id)
const isNoteSkipping = (id: number) => noteSkipping.value.has(id)
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

function toggleRemindersExpanded() {
  remindersExpanded.value = !remindersExpanded.value
}

function showMorePendingNotes() {
  pendingNotesVisibleLimit.value += 3
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

const CLIENT_STATUS_LABELS: Record<ClientState['state'], string> = {
  CREATED: 'Неактивний',
  ACTIVE: 'Активний',
  INACTIVE: 'Неактивний',
  ARCHIVED: 'Архів',
}

function clientStatusLabel(status: ClientState['state']) {
  return CLIENT_STATUS_LABELS[status] || 'Неактивний'
}

function clientStatusClass(status: ClientState['state']) {
  if (status === 'ACTIVE') return 'client-status--active'
  if (status === 'ARCHIVED') return 'client-status--archived'
  return 'client-status--inactive'
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

function setQuickAddLoading(id: number, value: boolean) {
  const next = new Set(quickAddLoading.value)
  if (value) {
    next.add(id)
  } else {
    next.delete(id)
  }
  quickAddLoading.value = next
}

function setNoteSkipping(id: number, value: boolean) {
  const next = new Set(noteSkipping.value)
  if (value) {
    next.add(id)
  } else {
    next.delete(id)
  }
  noteSkipping.value = next
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
  const clientId = relationClientId(client)
  if (workbookMissingByClient.value[clientId] === true) return 'Відсутній'
  if (!resolveHasWorkbookContent(client)) return 'Відсутній'
  const updatedAt = workbookUpdatedAt(client)
  if (!updatedAt) return 'Заповнений'
  return `Заповнений, оновлено ${formatDateTime(updatedAt)}`
}

function latestNoteSummary(client: ClientState) {
  if (!client.latest_session_note_at) return '\u041d\u043e\u0442\u0430\u0442\u043e\u043a \u0449\u0435 \u043d\u0435\u043c\u0430\u0454'
  return formatDateTime(client.latest_session_note_at)
}

function optionalDateLabel(value: string | null | undefined, fallback: string) {
  if (!value) return fallback
  const label = formatDateTime(value)
  return label && label !== '—' ? label : fallback
}

function clientUpdatedLabel(client: ClientState) {
  const value = client.workbook_updated_at || client.client_journal_updated_at || client.latest_session_note_at || client.last_session_at
  return optionalDateLabel(value, 'Немає оновлень')
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
      workbookMissingByClient.value = {
        ...workbookMissingByClient.value,
        [id]: !resolveHasWorkbookContent(item),
      }
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
    if (!remindersError.value) {
      remindersExpanded.value = false
      pendingNotesVisibleLimit.value = 3
    }
    notesLoading.value = false
  }
}

async function skipPendingNote(sessionId: number) {
  if (!sessionId) return
  setNoteSkipping(sessionId, true)
  remindersError.value = ''
  try {
    await skipSpecialistSessionNoteAction(sessionId)
    pendingNotes.value = pendingNotes.value.filter((item) => item.sessionId !== sessionId)
    if (pendingNotesVisibleLimit.value > 3 && pendingNotesVisibleLimit.value > pendingNotes.value.length) {
      pendingNotesVisibleLimit.value = Math.max(3, pendingNotes.value.length)
    }
  } catch (err: any) {
    remindersError.value = getApiErrorMessage(err, 'Не вдалося завершити крок без нотатки. Спробуйте ще раз.')
  } finally {
    setNoteSkipping(sessionId, false)
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
    let journalContent = hasListValue ? fromClientsList || '' : ''
    let workbookMissing = !hasWorkbookByMetadata && !Boolean(journalContent.trim())

    if (!hasListValue && hasWorkbookByMetadata) {
      const snapshot = await fetchSpecialistClientWorkbookSnapshotData(clientId)
      journalContent = snapshot.content
      workbookMissing = snapshot.isMissing
    }

    if (!hasListValue && !hasWorkbookByMetadata) {
      workbookMissing = true
    }

    clientJournalDrafts.value = { ...clientJournalDrafts.value, [clientId]: journalContent }
    workbookMissingByClient.value = { ...workbookMissingByClient.value, [clientId]: workbookMissing }

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
    workbookMissingByClient.value = {
      ...workbookMissingByClient.value,
      [clientId]: !Boolean((clientJournalDrafts.value[clientId] || '').trim()),
    }
  } catch (err: any) {
    error.value = getApiErrorMessage(err, 'Не вдалося зберегти робочий зошит клієнта')
  } finally {
    setJournalSaving(clientId, false)
  }
}

function openClientPracticeBoardModal(clientId: number) {
  if (!clientId || isQuickAddLoading(clientId)) return
  quickAddDraftClientId.value = clientId
  quickAddModalError.value = ''
  quickAddModalOpen.value = true
}

function closeClientPracticeBoardModal() {
  if (isQuickAddLoading(quickAddDraftClientId.value || 0)) return
  quickAddModalError.value = ''
  quickAddModalOpen.value = false
  quickAddDraftClientId.value = null
}

async function submitClientPracticeBoardQuickAdd(title: string) {
  const clientId = quickAddDraftClientId.value || 0
  await addClientToPracticeBoard(clientId, title)
}

async function addClientToPracticeBoard(clientId: number, title: string) {
  if (!clientId || isQuickAddLoading(clientId)) return
  setQuickAddLoading(clientId, true)
  quickAddModalError.value = ''
  try {
    const boards = await fetchPracticeBoards()
    const boardId = resolveDefaultPracticeBoardId(boards)
    await createPracticeBoardItem({
      ...(boardId ? { board_id: boardId } : {}),
      title: title.trim(),
      related_client_id: clientId,
      source_type: 'manual',
    })
    quickAddModalOpen.value = false
    quickAddDraftClientId.value = null
    toast.success('\u0417\u0430\u0434\u0430\u0447\u0443 \u0434\u043e\u0434\u0430\u043d\u043e \u043d\u0430 \u0434\u043e\u0448\u043a\u0443')
  } catch (err: any) {
    quickAddModalError.value = getApiErrorMessage(
      err,
      '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0434\u043e\u0434\u0430\u0442\u0438 \u0437\u0430\u0434\u0430\u0447\u0443 \u043d\u0430 \u0434\u043e\u0448\u043a\u0443.'
    )
  } finally {
    setQuickAddLoading(clientId, false)
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
  border-color: color-mix(in srgb, var(--line) 86%, #ffffff);
  background: color-mix(in srgb, var(--surface) 78%, #ffffff);
}

.panel--clients {
  order: 1;
}

.badge--soft {
  background: rgba(8, 113, 201, 0.12);
}

.clients-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 360px);
  gap: 12px;
  align-items: end;
  padding: 10px;
  border: 1px solid color-mix(in srgb, var(--line) 78%, #ffffff);
  border-radius: 12px;
  background: color-mix(in srgb, var(--surface) 80%, #ffffff);
}

.filters {
  display: inline-flex;
  width: fit-content;
  gap: 4px;
  flex-wrap: wrap;
  padding: 4px;
  border: 1px solid color-mix(in srgb, var(--line) 78%, #ffffff);
  border-radius: 10px;
  background: #fff;
}

.filters__item {
  min-height: 34px;
  border: 1px solid transparent;
  border-radius: 7px;
  padding: 6px 10px;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-weight: 500;
  cursor: pointer;
}

.filters__item:hover,
.filters__item:focus-visible {
  border-color: color-mix(in srgb, var(--primary) 22%, var(--line));
  background: color-mix(in srgb, var(--primary) 6%, #ffffff);
  outline: none;
}

.filters__item.is-active {
  border-color: color-mix(in srgb, var(--primary) 34%, var(--line));
  background: color-mix(in srgb, var(--primary) 12%, #ffffff);
  color: var(--color-primary-600);
}

.reminders-summary {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  border: 1px solid color-mix(in srgb, var(--line) 74%, #ffffff);
  border-radius: 10px;
  padding: 12px;
  background: #fff;
}

.reminders-summary__text {
  margin: 0;
  color: var(--text);
  font-weight: 600;
}

.reminders-summary__hint {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.4;
}

.history-list--reminders {
  margin-top: 10px;
}

.history-item--compact {
  padding: 10px 12px;
}

.reminders-more {
  justify-self: flex-start;
}

.clients-search {
  display: grid;
  gap: 6px;
}

.clients-search__label {
  font-size: 12px;
  font-weight: 600;
  color: #5a6772;
}

.clients-search__input {
  width: 100%;
}

.client-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 14px;
  margin-top: 10px;
}

.client-card {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 16px;
  background: #fff;
  display: grid;
  gap: 14px;
  align-content: start;
  box-shadow: 0 8px 18px rgba(17, 64, 54, 0.08);
}

.client-card--targeted {
  border-color: #0b4a7d;
  box-shadow: 0 0 0 2px rgba(11, 74, 125, 0.14);
}

.client-card__main {
  display: grid;
  gap: 12px;
}

.client-card__identity {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.client-name {
  color: var(--text);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
}

.client-code {
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
}

.client-status {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.client-status--active {
  border-color: color-mix(in srgb, var(--success) 28%, var(--line));
  background: color-mix(in srgb, var(--success) 12%, #ffffff);
  color: #1f6f52;
}

.client-status--inactive {
  border-color: color-mix(in srgb, var(--muted) 22%, var(--line));
  background: color-mix(in srgb, var(--muted) 8%, #ffffff);
  color: var(--muted);
}

.client-status--archived {
  border-color: color-mix(in srgb, var(--warning) 32%, var(--line));
  background: color-mix(in srgb, var(--warning) 14%, #ffffff);
  color: #8a640b;
}

.client-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
}

.client-meta__item {
  min-width: 0;
  border: 1px solid color-mix(in srgb, var(--line) 72%, #ffffff);
  border-radius: 10px;
  padding: 9px 10px;
  background: color-mix(in srgb, var(--surface) 62%, #ffffff);
}

.client-meta__item dt {
  margin: 0 0 4px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.client-meta__item dd {
  margin: 0;
  color: var(--text);
  font-size: 13px;
  line-height: 1.35;
}

.client-actions {
  display: grid;
  gap: 8px;
  border-top: 1px solid color-mix(in srgb, var(--line) 70%, #ffffff);
  padding-top: 12px;
}

.client-actions__primary,
.client-actions__secondary {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.client-actions__secondary .btn {
  min-height: 32px;
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

  .clients-toolbar {
    grid-template-columns: 1fr;
  }

  .filters {
    width: 100%;
  }

  .filters__item {
    flex: 1 1 auto;
  }

  .reminders-summary {
    align-items: flex-start;
    flex-direction: column;
  }

  .client-list {
    grid-template-columns: 1fr;
  }

  .client-card__identity {
    flex-direction: column;
  }

  .client-meta {
    grid-template-columns: 1fr;
  }
}
</style>
