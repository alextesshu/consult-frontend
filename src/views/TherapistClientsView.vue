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
    <div v-if="manualClientsWarning" class="form-warning">{{ manualClientsWarning }}</div>

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
            <RouterLink class="btn btn--ghost btn--sm" :to="noteReminderRoute(item.sessionId)">
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
          <p class="clients-panel-hint">
            Клієнта можна додати вручну без кабінету. Кабінет клієнта можна буде підключити пізніше.
          </p>
        </div>
        <button class="btn btn--sm clients-add-btn" type="button" @click="openManualClientModal">
          Додати клієнта
        </button>
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
          :id="clientCardDomId(client)"
          :key="clientListKey(client)"
          class="client-card"
          :class="{
            'client-card--manual': isManualClient(client),
            'client-card--targeted': !isManualClient(client) && targetedClientId === relationClientId(client),
          }"
          tabindex="-1"
        >
          <div class="client-card__main">
            <div class="client-card__identity">
              <div>
                <div class="client-name">{{ displayClientName(client) }}</div>
                <div v-if="!isManualClient(client) && client.client_code" class="client-code">Код клієнта: {{ client.client_code }}</div>
              </div>
              <div class="client-badges">
                <span class="client-account-badge" :class="{ 'client-account-badge--manual': isManualClient(client) }">
                  {{ isManualClient(client) ? 'Без кабінету' : 'З кабінетом' }}
                </span>
                <span class="client-status" :class="clientStatusClass(clientListState(client))">
                  {{ clientStatusLabel(clientListState(client)) }}
                </span>
              </div>
            </div>

            <dl v-if="isManualClient(client)" class="client-meta client-meta--manual">
              <div v-if="client.email" class="client-meta__item">
                <dt>Email</dt>
                <dd>{{ client.email }}</dd>
              </div>
              <div v-if="client.phone" class="client-meta__item">
                <dt>Телефон</dt>
                <dd>{{ client.phone }}</dd>
              </div>
              <div v-if="client.telegram" class="client-meta__item">
                <dt>Telegram</dt>
                <dd>{{ client.telegram }}</dd>
              </div>
              <div class="client-meta__item">
                <dt>Джерело</dt>
                <dd>Вручну створена картка</dd>
              </div>
              <div class="client-meta__item">
                <dt>Оновлено</dt>
                <dd>{{ manualClientUpdatedLabel(client) }}</dd>
              </div>
            </dl>
            <div v-if="isManualClient(client) && client.internal_note" class="manual-client-note">
              {{ client.internal_note }}
            </div>
            <dl v-if="!isManualClient(client)" class="client-meta">
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
          <div v-if="isManualClient(client)" class="client-actions">
            <div class="client-actions__secondary">
              <button
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="isManualActionLoading(client.id)"
                @click="openManualClientEditModal(client)"
              >
                Редагувати
              </button>

              <button
                v-if="client.status !== 'archived'"
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="isManualActionLoading(client.id)"
                @click="archiveManualClient(client.id)"
              >
                Архівувати
              </button>
              <button
                v-else
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="isManualActionLoading(client.id)"
                @click="restoreManualClient(client.id)"
              >
                Відновити
              </button>
            </div>
          </div>
          <div v-else class="client-actions">
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
          <div v-if="!isManualClient(client) && expandedClientId === relationClientId(client)" class="client-history">
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
    <div v-if="manualClientModalOpen" class="manual-client-modal" role="dialog" aria-modal="true" aria-labelledby="manual-client-title">
      <button
        class="manual-client-modal__backdrop"
        type="button"
        aria-label="Закрити форму додавання клієнта"
        @click="closeManualClientModal"
      ></button>
      <form class="manual-client-modal__content" @submit.prevent="submitManualClient">
        <div class="manual-client-modal__header">
          <div>
            <div class="badge badge--soft">Без кабінету</div>
            <h2 id="manual-client-title" class="manual-client-modal__title">{{ manualClientModalTitle }}</h2>
          </div>
          <button class="btn btn--ghost btn--sm" type="button" @click="closeManualClientModal">
            Закрити
          </button>
        </div>
        <div v-if="manualClientFormError" class="form-error">{{ manualClientFormError }}</div>
        <div class="manual-client-form">
          <label class="field">
            Імʼя клієнта
            <input
              v-model.trim="manualClientForm.display_name"
              class="input"
              type="text"
              autocomplete="name"
              required
            />
          </label>
          <label class="field">
            Email
            <input v-model.trim="manualClientForm.email" class="input" type="email" autocomplete="email" />
          </label>
          <label class="field">
            Телефон
            <input v-model.trim="manualClientForm.phone" class="input" type="tel" autocomplete="tel" />
          </label>
          <label class="field">
            Telegram
            <input v-model.trim="manualClientForm.telegram" class="input" type="text" autocomplete="off" />
          </label>
          <label class="field manual-client-form__note">
            Внутрішня нотатка
            <textarea
              v-model.trim="manualClientForm.internal_note"
              class="input manual-client-form__textarea"
              rows="4"
            ></textarea>
          </label>
        </div>
        <div class="manual-client-modal__actions">
          <button class="btn btn--sm" type="submit" :disabled="manualClientSaving">
            {{ manualClientSubmitLabel }}
          </button>
          <button class="btn btn--ghost btn--sm" type="button" @click="closeManualClientModal">
            Скасувати
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { apiGet, apiPatch, apiPost, fetchChatThreads, type ChatThread } from '../lib/api'
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

type ManualClientRecord = {
  id: number
  user_id: null
  display_name: string
  email: string | null
  phone: string | null
  telegram: string | null
  internal_note: string | null
  status: 'active' | 'archived'
  source: 'manual'
  has_account: false
  archived_at: string | null
  created_at: string | null
  updated_at: string | null
}

type ManualClientFormState = {
  display_name: string
  email: string
  phone: string
  telegram: string
  internal_note: string
}

type ClientListItem = ClientState | ManualClientRecord


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
const manualClientRecords = ref<ManualClientRecord[]>([])
const clientsLoading = ref(false)
const clientsError = ref('')
const error = ref('')
const manualClientsWarning = ref('')
const filter = ref<'ALL' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'>('ALL')
const searchQuery = ref('')
const actionLoading = ref<Set<number>>(new Set())
const manualActionLoading = ref<Set<number>>(new Set())
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
const manualClientModalOpen = ref(false)
const manualClientEditingId = ref<number | null>(null)
const manualClientSaving = ref(false)
const manualClientFormError = ref('')
const manualClientForm = ref<ManualClientFormState>({
  display_name: '',
  email: '',
  phone: '',
  telegram: '',
  internal_note: '',
})
const retryLabel = '\u0421\u043f\u0440\u043e\u0431\u0443\u0432\u0430\u0442\u0438 \u0449\u0435 \u0440\u0430\u0437'
const remindersErrorTitle = '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0437\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0438\u0442\u0438 \u043d\u0430\u0433\u0430\u0434\u0443\u0432\u0430\u043d\u043d\u044f'
const initialDeepLinkClientId = parseClientDeepLinkClientId(window.location.search)
let clientCardHighlightTimer: number | null = null
const toast = useToast()

const filteredClients = computed(() => {
  const items: ClientListItem[] = [...clients.value, ...manualClientRecords.value]
  const byStatus =
    filter.value === 'ALL' ? items : items.filter((client) => clientListState(client) === filter.value)
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

const isManualClientEditMode = computed(() => manualClientEditingId.value !== null)

const manualClientModalTitle = computed(() =>
  isManualClientEditMode.value ? 'Редагувати клієнта' : 'Додати клієнта'
)

const manualClientSubmitLabel = computed(() => {
  if (manualClientSaving.value) {
    return isManualClientEditMode.value ? 'Зберігаємо...' : 'Додаємо...'
  }

  return isManualClientEditMode.value ? 'Зберегти зміни' : 'Додати клієнта'
})

const isActionLoading = (id: number) => actionLoading.value.has(id)
const isManualActionLoading = (id: number) => manualActionLoading.value.has(id)
const isHistoryLoading = (id: number) => historyLoading.value.has(id)
const isJournalLoading = (id: number) => journalLoading.value.has(id)
const isJournalSaving = (id: number) => journalSaving.value.has(id)
const isQuickAddLoading = (id: number) => quickAddLoading.value.has(id)
const isNoteSkipping = (id: number) => noteSkipping.value.has(id)
const isWorkbookExpanded = (id: number) => Boolean(workbookExpanded.value[id])
function isManualClient(client: ClientListItem): client is ManualClientRecord {
  return (client as ManualClientRecord).source === 'manual' && (client as ManualClientRecord).has_account === false
}

function clientListState(client: ClientListItem): ClientState['state'] {
  if (isManualClient(client)) return client.status === 'archived' ? 'ARCHIVED' : 'ACTIVE'
  return client.state
}

function clientListKey(client: ClientListItem) {
  return isManualClient(client) ? `manual-${client.id}` : `registered-${relationClientId(client)}`
}

function clientCardDomId(client: ClientListItem | number) {
  if (typeof client === 'number') return `client-card-${client}`
  return isManualClient(client) ? `manual-client-record-${client.id}` : `client-card-${relationClientId(client)}`
}

function relationClientId(client: Pick<ClientState, 'client' | 'client_id'> | ClientListItem) {
  if (isManualClient(client as ClientListItem)) return 0
  const relation = client as Pick<ClientState, 'client' | 'client_id'>
  return Number(relation.client ?? relation.client_id ?? 0)
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

function matchesClientSearch(client: ClientListItem, query: string) {
  if (isManualClient(client)) {
    const searchable = [
      client.display_name,
      client.email,
      client.phone,
      client.telegram,
      client.internal_note,
      client.id,
    ]
    return searchable.map((item) => normalizeSearchValue(item)).some((item) => item.includes(query))
  }
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

function noteReminderRoute(sessionId: number) {
  return {
    path: '/cabinet/sessions',
    query: { returnTo: '/cabinet/clients' },
    hash: `#note-${sessionId}`,
  }
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

function setManualActionLoading(id: number, value: boolean) {
  const next = new Set(manualActionLoading.value)
  if (value) {
    next.add(id)
  } else {
    next.delete(id)
  }
  manualActionLoading.value = next
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

function workbookSummary(client: ClientListItem) {
  if (isManualClient(client)) return 'Недоступний без кабінету'
  const clientId = relationClientId(client)
  if (workbookMissingByClient.value[clientId] === true) return 'Відсутній'
  if (!resolveHasWorkbookContent(client)) return 'Відсутній'
  const updatedAt = workbookUpdatedAt(client)
  if (!updatedAt) return 'Заповнений'
  return `Заповнений, оновлено ${formatDateTime(updatedAt)}`
}

function latestNoteSummary(client: ClientListItem) {
  if (isManualClient(client)) return 'Нотаток ще немає'
  if (!client.latest_session_note_at) return '\u041d\u043e\u0442\u0430\u0442\u043e\u043a \u0449\u0435 \u043d\u0435\u043c\u0430\u0454'
  return formatDateTime(client.latest_session_note_at)
}

function optionalDateLabel(value: string | null | undefined, fallback: string) {
  if (!value) return fallback
  const label = formatDateTime(value)
  return label && label !== '—' ? label : fallback
}

function clientUpdatedLabel(client: ClientListItem) {
  if (isManualClient(client)) return manualClientUpdatedLabel(client)
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
  client: ClientListItem
) {
  if (isManualClient(client)) return normalizeClientName(client.display_name) || `Клієнт #${client.id}`
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

function manualClientUpdatedLabel(client: ManualClientRecord) {
  return optionalDateLabel(client.updated_at || client.created_at, 'Немає оновлень')
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

async function loadManualClientRecords() {
  manualClientsWarning.value = ''
  try {
    const resp = await apiGet<ListResponse<ManualClientRecord>>('/cabinet/client-records/')
    manualClientRecords.value = listFromResponse(resp)
  } catch (err: any) {
    manualClientRecords.value = []
    manualClientsWarning.value = getApiErrorMessage(
      err,
      'Не вдалося завантажити клієнтів без кабінету. Зареєстровані клієнти залишаються доступними.'
    )
  }
}

function resetManualClientForm() {
  manualClientForm.value = {
    display_name: '',
    email: '',
    phone: '',
    telegram: '',
    internal_note: '',
  }
  manualClientFormError.value = ''
}

function openManualClientModal() {
  manualClientEditingId.value = null
  resetManualClientForm()
  manualClientModalOpen.value = true
}

function openManualClientEditModal(client: ManualClientRecord) {
  manualClientEditingId.value = client.id
  manualClientFormError.value = ''
  manualClientForm.value = {
    display_name: client.display_name || '',
    email: client.email || '',
    phone: client.phone || '',
    telegram: client.telegram || '',
    internal_note: client.internal_note || '',
  }
  manualClientModalOpen.value = true
}

function closeManualClientModal() {
  if (manualClientSaving.value) return
  manualClientModalOpen.value = false
  manualClientEditingId.value = null
  resetManualClientForm()
}

function manualClientPayload() {
  const form = manualClientForm.value
  return {
    display_name: form.display_name.trim(),
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    telegram: form.telegram.trim() || null,
    internal_note: form.internal_note.trim() || null,
  }
}

function manualClientErrorMessage(err: unknown, fallback: string) {
  const data = (err as { response?: { data?: any } })?.response?.data
  const raw = [
    data?.detail,
    data?.code,
    data?.non_field_errors?.[0],
    data?.display_name?.[0],
    typeof data === 'string' ? data : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (raw.includes('limit') || raw.includes('active_client')) {
    return 'Досягнуто ліміт активних клієнтів для вашого тарифу.'
  }
  return getApiErrorMessage(err, fallback)
}

async function submitManualClient() {
  const payload = manualClientPayload()

  if (!payload.display_name) {
    manualClientFormError.value = 'Вкажіть імʼя клієнта.'
    return
  }

  const editingId = manualClientEditingId.value

  manualClientSaving.value = true
  manualClientFormError.value = ''
  error.value = ''

  try {
    const saved = editingId
      ? await apiPatch<ManualClientRecord>(`/cabinet/client-records/${editingId}/`, payload)
      : await apiPost<ManualClientRecord>('/cabinet/client-records/', payload)

    manualClientRecords.value = editingId
      ? manualClientRecords.value.map((item) => (item.id === saved.id ? saved : item))
      : [saved, ...manualClientRecords.value.filter((item) => item.id !== saved.id)]

    manualClientModalOpen.value = false
    manualClientEditingId.value = null
    resetManualClientForm()
  } catch (err: any) {
    manualClientFormError.value = manualClientErrorMessage(
      err,
      editingId ? 'Не вдалося зберегти зміни.' : 'Не вдалося додати клієнта.'
    )
  } finally {
    manualClientSaving.value = false
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

async function archiveManualClient(id: number) {
  if (!id) return
  setManualActionLoading(id, true)
  error.value = ''
  try {
    const updated = await apiPost<ManualClientRecord | null>(`/cabinet/client-records/${id}/archive/`, {})
    if (updated?.id) {
      manualClientRecords.value = manualClientRecords.value.map((item) => (item.id === id ? updated : item))
    } else {
      await loadManualClientRecords()
    }
  } catch (err: any) {
    error.value = manualClientErrorMessage(err, 'Не вдалося архівувати клієнта.')
  } finally {
    setManualActionLoading(id, false)
  }
}

async function restoreManualClient(id: number) {
  if (!id) return
  setManualActionLoading(id, true)
  error.value = ''
  try {
    const updated = await apiPost<ManualClientRecord | null>(`/cabinet/client-records/${id}/restore/`, {})
    if (updated?.id) {
      manualClientRecords.value = manualClientRecords.value.map((item) => (item.id === id ? updated : item))
    } else {
      await loadManualClientRecords()
    }
  } catch (err: any) {
    error.value = manualClientErrorMessage(err, 'Не вдалося відновити клієнта.')
  } finally {
    setManualActionLoading(id, false)
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
  await Promise.all([loadClients(), loadManualClientRecords(), loadChatClientNames()])
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
  gap: 18px;
  min-width: 0;
}

.panel--clients > .panel__header {
  padding: 14px 16px;
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at 100% 0, rgba(221, 241, 239, 0.72), transparent 36%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(255, 250, 239, 0.78));
}

.panel--clients > .panel__header > div {
  min-width: 0;
}

.clients-add-btn {
  flex: 0 0 auto;
  min-height: 42px;
  border-color: var(--pc-navy-900);
  background: var(--pc-navy-900);
  color: #fff;
  box-shadow: 0 12px 26px rgba(18, 52, 90, 0.18);
}

.clients-add-btn:hover {
  border-color: var(--pc-navy-950);
  background: var(--pc-navy-950);
  color: #fff;
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
  gap: 14px;
  align-items: end;
  padding: 12px;
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-lg);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 250, 239, 0.78));
  box-shadow: 0 8px 18px rgba(18, 52, 90, 0.06);
}

.clients-panel-hint {
  max-width: 620px;
  margin: 6px 0 0;
  color: var(--pc-text-muted);
  font-size: 14px;
  line-height: 1.45;
}

.filters {
  display: inline-flex;
  width: fit-content;
  gap: 5px;
  flex-wrap: wrap;
  padding: 5px;
  border: 1px solid color-mix(in srgb, var(--pc-border) 82%, #ffffff);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.82);
}

.filters__item {
  min-height: 36px;
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  padding: 7px 12px;
  background: transparent;
  color: var(--pc-navy-900);
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}

.filters__item:hover,
.filters__item:focus-visible {
  border-color: color-mix(in srgb, var(--pc-navy-900) 22%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-blue-soft) 62%, #ffffff);
  color: var(--pc-navy-950);
  outline: none;
}

.filters__item.is-active {
  border-color: var(--pc-navy-900);
  background: var(--pc-navy-900);
  color: #fff;
  box-shadow: 0 8px 18px rgba(18, 52, 90, 0.16);
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
  gap: 7px;
  min-width: 0;
}

.clients-search__label {
  font-size: 12px;
  font-weight: 700;
  color: color-mix(in srgb, var(--pc-navy-900) 62%, var(--pc-text-muted));
}

.clients-search__input {
  width: 100%;
  min-height: 42px;
  border-color: color-mix(in srgb, var(--pc-border) 82%, #ffffff);
  background: rgba(255, 255, 255, 0.94);
}

.clients-search__input:focus {
  border-color: color-mix(in srgb, var(--pc-navy-900) 36%, var(--pc-border));
  box-shadow: 0 0 0 3px rgba(18, 52, 90, 0.1);
}

.client-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
  margin-top: 10px;
}

.client-card {
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-lg);
  padding: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 253, 248, 0.94));
  display: grid;
  gap: 14px;
  align-content: start;
  box-shadow: var(--pc-shadow-soft);
  min-width: 0;
}

.client-card--targeted {
  border-color: var(--pc-navy-900);
  box-shadow:
    0 0 0 2px rgba(18, 52, 90, 0.14),
    var(--pc-shadow-soft);
}

.client-card--manual {
  border-color: color-mix(in srgb, var(--pc-teal-500) 26%, var(--pc-border));
  background:
    radial-gradient(circle at 100% 0, rgba(221, 241, 239, 0.78), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 253, 248, 0.94));
}

.client-card__main {
  display: grid;
  gap: 13px;
  min-width: 0;
}

.client-card__identity {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  min-width: 0;
}

.client-badges {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.client-name {
  color: var(--pc-navy-950);
  font-size: 19px;
  font-weight: 700;
  line-height: 1.18;
  overflow-wrap: anywhere;
}

.client-code {
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
}

.client-status,
.client-account-badge {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  border-radius: var(--radius-pill);
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.client-status {
  border: 1px solid transparent;
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

.client-account-badge {
  border: 1px solid color-mix(in srgb, var(--pc-navy-900) 18%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-blue-soft) 72%, #ffffff);
  color: var(--pc-navy-900);
}

.client-account-badge--manual {
  border-color: color-mix(in srgb, var(--pc-peach-200) 80%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-peach-100) 82%, #ffffff);
  color: var(--pc-navy-900);
}

.client-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
  margin: 0;
}

.client-meta__item {
  min-width: 0;
  border: 1px solid color-mix(in srgb, var(--pc-border) 76%, #ffffff);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  background: color-mix(in srgb, var(--pc-bg-main) 72%, #ffffff);
}

.client-meta__item dt {
  margin: 0 0 5px;
  color: color-mix(in srgb, var(--pc-navy-900) 56%, var(--pc-text-muted));
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.045em;
  text-transform: uppercase;
}

.client-meta__item dd {
  margin: 0;
  color: var(--pc-navy-900);
  font-size: 13px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.client-meta--manual {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.manual-client-note {
  border: 1px solid color-mix(in srgb, var(--pc-border) 82%, #ffffff);
  border-radius: var(--radius-md);
  padding: 11px 12px;
  background: color-mix(in srgb, var(--pc-bg-main) 82%, #ffffff);
  color: var(--pc-text-muted);
  font-size: 13px;
  line-height: 1.45;
  white-space: pre-wrap;
}

.client-actions {
  display: grid;
  gap: 8px;
  border-top: 1px solid color-mix(in srgb, var(--pc-border) 72%, #ffffff);
  padding-top: 13px;
}

.client-actions__primary,
.client-actions__secondary {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.client-actions__secondary .btn {
  min-height: 34px;
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

.form-warning {
  color: var(--pc-warning);
  background: var(--pc-yellow-soft);
  border: 1px solid color-mix(in srgb, var(--pc-warning) 24%, var(--pc-border));
  border-radius: 10px;
  padding: 8px 10px;
}

.manual-client-modal {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: start center;
  padding: min(6vh, 48px) 16px 24px;
}

.manual-client-modal__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background:
    radial-gradient(circle at 50% 0, rgba(221, 241, 239, 0.22), transparent 36%),
    rgba(18, 35, 58, 0.46);
}

.manual-client-modal__content {
  position: relative;
  width: min(720px, 100%);
  max-height: min(90vh, 820px);
  overflow: auto;
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-xl);
  background:
    radial-gradient(circle at 100% 0, rgba(221, 241, 239, 0.7), transparent 32%),
    var(--pc-bg-card);
  box-shadow: var(--pc-shadow-float);
  padding: 22px;
  display: grid;
  gap: 18px;
}

.manual-client-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
}

.manual-client-modal__header > div {
  min-width: 0;
}

.manual-client-modal__title {
  margin: 8px 0 0;
  color: var(--pc-navy-950);
  font-family: var(--font-display);
  font-size: 26px;
  line-height: 1.16;
}

.manual-client-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 13px;
}

.manual-client-form .field {
  min-width: 0;
}

.manual-client-form .input {
  width: 100%;
  background: rgba(255, 255, 255, 0.94);
  border-color: color-mix(in srgb, var(--pc-border) 82%, #ffffff);
}

.manual-client-form .input:focus {
  border-color: color-mix(in srgb, var(--pc-navy-900) 36%, var(--pc-border));
  box-shadow: 0 0 0 3px rgba(18, 52, 90, 0.1);
}

.manual-client-form__note {
  grid-column: 1 / -1;
}

.manual-client-form__textarea {
  min-height: 120px;
  resize: vertical;
}

.manual-client-modal__actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 2px;
}

.manual-client-modal__actions .btn[type='submit'] {
  border-color: var(--pc-navy-900);
  background: var(--pc-navy-900);
  color: #fff;
  box-shadow: 0 12px 26px rgba(18, 52, 90, 0.18);
}

.manual-client-modal__actions .btn[type='submit']:hover {
  border-color: var(--pc-navy-950);
  background: var(--pc-navy-950);
  color: #fff;
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

  .client-badges {
    justify-content: flex-start;
  }

  .client-meta {
    grid-template-columns: 1fr;
  }

  .manual-client-modal {
    padding: 14px;
    place-items: start center;
  }

  .manual-client-modal__content {
    max-height: calc(100vh - 28px);
    padding: 18px;
    border-radius: var(--radius-lg);
  }

  .manual-client-modal__header {
    flex-direction: column;
  }

  .manual-client-modal__title {
    font-size: 23px;
  }

  .manual-client-form {
    grid-template-columns: 1fr;
  }

  .manual-client-modal__actions {
    flex-direction: column;
  }

  .manual-client-modal__actions .btn {
    width: 100%;
  }
}
</style>
