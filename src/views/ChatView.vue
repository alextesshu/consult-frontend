<template>
  <section class="chat">
    <header class="chat__hero card">
      <div>
        <div class="eyebrow">Чат</div>
        <h1 class="title">Діалоги</h1>
        <p class="muted">Спілкування доступне лише для активних клієнтів.</p>
      </div>
      <RouterLink class="btn btn--ghost" :to="backRoute">Назад до кабінету</RouterLink>
    </header>

    <div class="chat__grid">
      <aside class="card chat__threads" :class="{ 'chat__pane--hidden-mobile': activeThread }">
        <div class="card__title">Чати</div>
        <div class="chat__thread-tabs" role="tablist" aria-label="Фільтр чатів">
          <button
            class="btn btn--ghost btn--sm"
            :class="{ 'btn--active': threadTab === 'active' }"
            type="button"
            role="tab"
            :aria-selected="threadTab === 'active'"
            @click="threadTab = 'active'"
          >
            Активні
          </button>
          <button
            class="btn btn--ghost btn--sm"
            :class="{ 'btn--active': threadTab === 'archived' }"
            type="button"
            role="tab"
            :aria-selected="threadTab === 'archived'"
            @click="threadTab = 'archived'"
          >
            Архів
          </button>
        </div>

        <div v-if="threadsLoading" class="chat-state muted">Завантажуємо чати...</div>
        <div v-else-if="threadsError" class="chat-state chat-state--error">
          <div>{{ threadsError }}</div>
          <button class="btn btn--ghost btn--sm" type="button" @click="loadThreads()">Спробувати знову</button>
        </div>
        <div v-else-if="visibleThreads.length === 0" class="chat-state muted">
          {{ threadTab === 'active' ? 'Поки що немає активних чатів.' : 'Архівних чатів поки немає.' }}
        </div>

        <article
          v-for="thread in visibleThreads"
          :key="thread.id"
          class="thread-item"
          :class="{ 'thread-item--active': thread.id === activeThreadId }"
        >
          <button type="button" class="thread-item__main" @click="selectThread(thread.id)">
            <div class="thread-item__avatar">
              <img
                v-if="threadAvatarUrl(thread) && !failedThreadAvatarIds.has(thread.id)"
                :src="threadAvatarUrl(thread) || ''"
                alt=""
                @error="markThreadAvatarFailed(thread.id)"
              />
              <span v-else>{{ initials(thread.other_user.display_name) }}</span>
            </div>
            <div class="thread-item__meta">
              <div class="thread-item__name">{{ thread.other_user.display_name }}</div>
              <div class="muted thread-item__preview">
                {{ thread.last_message_preview || 'Ще немає повідомлень' }}
              </div>
            </div>
            <div class="thread-item__side">
              <span class="thread-item__time muted">{{ formatThreadTime(thread.last_message_at) }}</span>
              <span v-if="thread.unread_count" class="thread-item__badge">{{ thread.unread_count }}</span>
            </div>
          </button>

          <div class="thread-item__actions">
            <button
              v-if="threadTab === 'active' || threadTab === 'archived'"
              class="btn btn--ghost btn--sm thread-menu__trigger"
              type="button"
              :aria-label="`Дії чату ${thread.other_user.display_name}`"
              @click.stop="toggleThreadMenu(thread.id)"
            >
              ⋯
            </button>
            <div v-if="openThreadMenuId === thread.id" class="chat-menu" role="menu">
              <button
                v-if="threadTab === 'active'"
                class="chat-menu__item"
                type="button"
                role="menuitem"
                :disabled="archivingThreadId === thread.id"
                @click="requestArchiveThread(thread)"
              >
                Архівувати чат
              </button>
              <button
                v-if="threadTab === 'archived'"
                class="chat-menu__item"
                type="button"
                role="menuitem"
                :disabled="unarchivingThreadId === thread.id"
                @click="requestUnarchiveThread(thread)"
              >
                Розархівувати чат
              </button>
            </div>
          </div>
        </article>
      </aside>

      <section class="card chat__messages" :class="{ 'chat__pane--hidden-mobile': !activeThread }">
        <div class="card__title">Переписка</div>

        <div v-if="!activeThread" class="chat-state muted">Оберіть чат, щоб побачити повідомлення.</div>

        <div v-else class="chat__window">
          <button class="btn btn--ghost btn--sm chat__mobile-back" type="button" @click="backToThreads">
            Назад до чатів
          </button>
          <header class="chat-thread-header">
            <component
              :is="openClientTarget ? RouterLink : 'div'"
              class="chat-thread-header__identity"
              :to="openClientTarget || undefined"
              :aria-label="openClientTarget ? `Перейти до клієнта ${activeCounterpartName}` : undefined"
            >
              <div class="chat-thread-header__avatar">
                <img
                  v-if="activeCounterpartAvatarUrl && !activeHeaderAvatarFailed"
                  :src="activeCounterpartAvatarUrl"
                  alt=""
                  @error="markHeaderAvatarFailed"
                />
                <span v-else>{{ initials(activeCounterpartName) }}</span>
              </div>
              <div class="chat-thread-header__meta">
                <div class="chat-thread-header__name">{{ activeCounterpartName }}</div>
                <div class="chat-thread-header__secondary muted">{{ activeSecondaryLine }}</div>
              </div>
            </component>
            <div class="chat-thread-header__actions">
              <RouterLink
                v-if="openClientTarget"
                class="btn btn--ghost btn--sm chat-thread-header__action-btn chat-thread-header__profile-btn"
                :to="openClientTarget"
              >
                Відкрити клієнта
              </RouterLink>
              <RouterLink
                v-if="openSessionsTarget"
                class="btn btn--ghost btn--sm chat-thread-header__action-btn"
                :to="openSessionsTarget"
                aria-label="Відкрити сесії"
              >
                <span class="chat-thread-header__sessions-label--full">Відкрити сесії</span>
                <span class="chat-thread-header__sessions-label--compact">Сесії</span>
              </RouterLink>
            </div>
          </header>

          <div v-if="detailLoading" class="chat-state muted">Оновлюємо контекст чату...</div>
          <div v-else-if="detailError" class="chat-state chat-state--error">
            <div>{{ detailError }}</div>
            <button class="btn btn--ghost btn--sm" type="button" @click="loadActiveThreadDetail">Спробувати знову</button>
          </div>

          <form ref="composerRef" class="chat__composer" @submit.prevent="sendMessage">
            <textarea
              v-model="draft"
              class="input chat__composer-input"
              rows="1"
              placeholder="Напишіть повідомлення"
              :disabled="sending || activeThreadArchived"
              @keydown="onComposerKeydown"
              @compositionstart="onComposerCompositionStart"
              @compositionend="onComposerCompositionEnd"
            />
            <button class="btn chat__composer-send" type="submit" :disabled="sending || !draft.trim() || activeThreadArchived">
              {{ sending ? 'Надсилаємо...' : 'Надіслати' }}
            </button>
          </form>
          <div v-if="activeThreadArchived" class="muted">Цей чат в архіві. Надсилання повідомлень недоступне.</div>
          <div v-if="sendError" class="chat-state chat-state--error">{{ sendError }}</div>

          <div ref="messagesRef" class="chat__messages-list">
            <div v-if="messagesLoading" class="chat-state muted">Завантажуємо повідомлення...</div>
            <div v-else-if="messagesError" class="chat-state chat-state--error">
              <div>{{ messagesError }}</div>
              <button class="btn btn--ghost btn--sm" type="button" @click="loadMessages()">Спробувати знову</button>
            </div>
            <div v-else-if="orderedMessages.length === 0" class="chat-state muted">У цьому чаті ще немає повідомлень.</div>

            <div
              v-for="message in orderedMessages"
              :key="message.id"
              :class="['chat-message', { 'chat-message--me': isMine(message) }]"
            >
              <div class="chat-message__bubble-wrap">
                <div class="chat-message__bubble" :class="{ 'chat-message__bubble--deleted': isMessageDeleted(message) }">
                  {{ isMessageDeleted(message) ? 'Повідомлення видалено' : message.body }}
                </div>
                <button
                  v-if="canDeleteMessage(message)"
                  class="message-delete-btn"
                  type="button"
                  :aria-label="`Видалити повідомлення ${message.id}`"
                  :disabled="deletingMessageId === message.id"
                  @click.stop="requestDeleteMessage(message)"
                >
                  ×
                </button>
              </div>
              <div class="chat-message__time muted">{{ formatTime(message.created_at) }}</div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <ConfirmModal
      :open="confirmOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      :confirm-text="confirmButtonText"
      cancel-text="Скасувати"
      :tone="confirmTone"
      @confirm="confirmAction"
      @cancel="resetConfirm"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'
import ConfirmModal from '../components/ConfirmModal.vue'
import { useAuthStore } from '../stores/auth'
import { formatUkDateTime } from '../lib/dateTime'
import {
  archiveChatThread,
  deleteChatMessage,
  fetchChatMessages,
  fetchChatThreadDetail,
  fetchChatThreads,
  sendChatMessage,
  unarchiveChatThread,
} from '../lib/api'
import type { ChatMessage, ChatThread, ChatThreadRouteTarget } from '../lib/api'

type ThreadTab = 'active' | 'archived'
type ConfirmRequest =
  | { kind: 'delete_message'; messageId: number }
  | { kind: 'archive_thread'; threadId: number }
  | { kind: 'unarchive_thread'; threadId: number }
  | null

const route = useRoute()
const auth = useAuthStore()
const threads = ref<ChatThread[]>([])
const localArchivedThreads = ref<ChatThread[]>([])
const threadsLoading = ref(false)
const threadsError = ref<string | null>(null)
const activeThreadId = ref<number | null>(null)
const activeThreadDetail = ref<ChatThread | null>(null)
const detailLoading = ref(false)
const detailError = ref<string | null>(null)
const messages = ref<ChatMessage[]>([])
const messagesLoading = ref(false)
const messagesError = ref<string | null>(null)
const sendError = ref<string | null>(null)
const draft = ref('')
const sending = ref(false)
const pollId = ref<number | null>(null)
const threadPollId = ref<number | null>(null)
const lastMessageId = ref<number | null>(null)
const messagesRef = ref<HTMLDivElement | null>(null)
const composerRef = ref<HTMLFormElement | null>(null)
const threadTab = ref<ThreadTab>('active')
const openThreadMenuId = ref<number | null>(null)
const localDeletedMessageIds = ref<Set<number>>(new Set())
const localArchivedThreadIds = ref<Set<number>>(new Set())
const confirmRequest = ref<ConfirmRequest>(null)
const deletingMessageId = ref<number | null>(null)
const archivingThreadId = ref<number | null>(null)
const unarchivingThreadId = ref<number | null>(null)
const failedThreadAvatarIds = ref<Set<number>>(new Set())
const failedHeaderAvatarThreadId = ref<number | null>(null)
const composerIsComposing = ref(false)

const isSpecialist = computed(() => {
  const roles = auth.me?.user.roles ?? []
  return roles.includes('SPECIALIST') || roles.includes('THERAPIST')
})
const backRoute = computed(() => (isSpecialist.value ? '/cabinet' : '/client'))

const allThreads = computed(() => {
  const byId = new Map<number, ChatThread>()
  for (const thread of threads.value) {
    byId.set(thread.id, thread)
  }
  for (const thread of localArchivedThreads.value) {
    if (!byId.has(thread.id)) {
      byId.set(thread.id, thread)
    }
  }
  return Array.from(byId.values())
})

const activeThreads = computed(() => allThreads.value.filter((thread) => !isThreadArchived(thread)))
const archivedThreads = computed(() => allThreads.value.filter((thread) => isThreadArchived(thread)))
const visibleThreads = computed(() => (threadTab.value === 'active' ? activeThreads.value : archivedThreads.value))
const orderedMessages = computed(() => [...messages.value].reverse())

const activeThread = computed(() => allThreads.value.find((thread) => thread.id === activeThreadId.value) || null)
const activeThreadArchived = computed(() => (activeThread.value ? isThreadArchived(activeThread.value) : false))

const activeHeaderSource = computed(() => activeThreadDetail.value || activeThread.value)
const activeCounterpart = computed(() => activeHeaderSource.value?.header_context?.counterpart || null)
const activeCounterpartName = computed(() => (
  activeCounterpart.value?.display_name?.trim() || activeThread.value?.other_user.display_name || 'Клієнт'
))
const activeCounterpartAvatarUrl = computed(() => (
  normalizeAvatarUrl(activeCounterpart.value?.avatar_url) || normalizeAvatarUrl(activeThread.value?.other_user.photo_url) || ''
))
const activeHeaderAvatarFailed = computed(() => activeThreadId.value !== null && failedHeaderAvatarThreadId.value === activeThreadId.value)

const activeRelevantSession = computed(() => activeHeaderSource.value?.header_context?.relevant_session || null)
const activeSecondaryLine = computed(() => {
  const session = activeRelevantSession.value
  if (!session) return 'Клієнт у переписці'
  if (session.starts_at) {
    const formatted = formatUkDateTime(
      session.starts_at,
      {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      },
      session.starts_at
    )
    return `Найближча сесія: ${formatted}`
  }
  return 'Найближча сесія запланована'
})

const openClientTarget = computed(() => resolveHeaderTarget('profile'))
const openSessionsTarget = computed(() => resolveHeaderTarget('sessions'))

const preferredThreadId = computed(() => {
  const raw = Number(route.query.thread_id)
  return Number.isInteger(raw) && raw > 0 ? raw : null
})
const preferredTherapistId = computed(() => {
  const raw = Number(route.query.therapist_id)
  return Number.isInteger(raw) && raw > 0 ? raw : null
})

const confirmOpen = computed(() => confirmRequest.value !== null)
const confirmTitle = computed(() => {
  if (confirmRequest.value?.kind === 'delete_message') return 'Видалити повідомлення?'
  if (confirmRequest.value?.kind === 'archive_thread') return 'Архівувати чат?'
  if (confirmRequest.value?.kind === 'unarchive_thread') return 'Розархівувати чат?'
  return ''
})
const confirmMessage = computed(() => {
  if (confirmRequest.value?.kind === 'delete_message') return 'Текст повідомлення буде приховано в чаті.'
  if (confirmRequest.value?.kind === 'archive_thread') return 'Чат зникне зі списку активних і буде доступний в архіві.'
  if (confirmRequest.value?.kind === 'unarchive_thread') return 'Чат повернеться до списку активних.'
  return ''
})
const confirmButtonText = computed(() => {
  if (confirmRequest.value?.kind === 'delete_message') return 'Видалити'
  if (confirmRequest.value?.kind === 'archive_thread') return 'Архівувати'
  if (confirmRequest.value?.kind === 'unarchive_thread') return 'Розархівувати'
  return 'Підтвердити'
})
const confirmTone = computed<'neutral' | 'danger'>(() => (
  confirmRequest.value?.kind === 'delete_message' ? 'danger' : 'neutral'
))

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '...'
  const first = parts[0]
  if (!first) return '...'
  if (parts.length === 1) return first.slice(0, 2).toUpperCase()
  const second = parts[1]
  if (!second) return first.slice(0, 2).toUpperCase()
  return `${first[0]}${second[0]}`.toUpperCase()
}

function normalizeAvatarUrl(raw: unknown) {
  const value = String(raw || '').trim()
  if (!value) return ''
  const normalized = value.toLowerCase()
  if (normalized === 'null' || normalized === 'none' || normalized === 'undefined') return ''
  return value
}

function threadAvatarUrl(thread: ChatThread) {
  return normalizeAvatarUrl(thread.other_user.photo_url)
}

function markThreadAvatarFailed(threadId: number) {
  if (failedThreadAvatarIds.value.has(threadId)) return
  failedThreadAvatarIds.value = new Set([...failedThreadAvatarIds.value, threadId])
}

function markHeaderAvatarFailed() {
  failedHeaderAvatarThreadId.value = activeThreadId.value
}

function isMine(message: ChatMessage) {
  return message.sender_id === auth.me?.user.id
}

function isMessageDeleted(message: ChatMessage) {
  return localDeletedMessageIds.value.has(message.id) || Boolean(message.is_deleted || message.deleted_at)
}

function canDeleteMessage(message: ChatMessage) {
  return isMine(message) && !isMessageDeleted(message) && deletingMessageId.value !== message.id
}

function isThreadArchived(thread: ChatThread) {
  return Boolean(thread.is_archived || thread.archived_at || localArchivedThreadIds.value.has(thread.id))
}

function formatThreadTime(value: string | null) {
  if (!value) return ''
  return formatUkDateTime(
    value,
    {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    },
    value
  )
}

function formatTime(value: string) {
  return formatUkDateTime(
    value,
    {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    },
    value
  )
}

function resolvePreferredThreadId(data: ChatThread[]) {
  if (preferredThreadId.value) {
    const direct = data.find((thread) => thread.id === preferredThreadId.value)
    if (direct) return direct.id
  }
  if (preferredTherapistId.value) {
    const byTherapist = data.find((thread) => thread.therapist_id === preferredTherapistId.value)
    if (byTherapist) return byTherapist.id
  }
  return null
}

function toggleThreadMenu(threadId: number) {
  openThreadMenuId.value = openThreadMenuId.value === threadId ? null : threadId
}

function requestDeleteMessage(message: ChatMessage) {
  confirmRequest.value = { kind: 'delete_message', messageId: message.id }
}

function requestArchiveThread(thread: ChatThread) {
  openThreadMenuId.value = null
  confirmRequest.value = { kind: 'archive_thread', threadId: thread.id }
}

function requestUnarchiveThread(thread: ChatThread) {
  openThreadMenuId.value = null
  confirmRequest.value = { kind: 'unarchive_thread', threadId: thread.id }
}

function resetConfirm() {
  confirmRequest.value = null
}

function setThreadArchiveState(threadId: number, archived: boolean) {
  if (archived) {
    localArchivedThreadIds.value.add(threadId)
  } else {
    localArchivedThreadIds.value.delete(threadId)
  }

  threads.value = threads.value.map((thread) =>
    thread.id === threadId ? { ...thread, is_archived: archived, archived_at: archived ? thread.archived_at || new Date().toISOString() : null } : thread
  )

  if (archived) {
    const target = allThreads.value.find((thread) => thread.id === threadId)
    if (target && !localArchivedThreads.value.find((item) => item.id === target.id)) {
      localArchivedThreads.value = [...localArchivedThreads.value, { ...target, is_archived: true }]
    }
    return
  }

  localArchivedThreads.value = localArchivedThreads.value.filter((thread) => thread.id !== threadId)
}

function applyThreadData(data: ChatThread[]) {
  threads.value = data
  if (activeThreadDetail.value) {
    const updated = data.find((thread) => thread.id === activeThreadDetail.value?.id)
    if (updated) {
      activeThreadDetail.value = {
        ...updated,
        header_context: activeThreadDetail.value.header_context || updated.header_context,
      }
    }
  }
}

async function confirmAction() {
  const request = confirmRequest.value
  if (!request) return
  resetConfirm()

  if (request.kind === 'delete_message') {
    deletingMessageId.value = request.messageId
    try {
      await deleteChatMessage(request.messageId)
      localDeletedMessageIds.value.add(request.messageId)
    } finally {
      deletingMessageId.value = null
    }
    return
  }

  if (request.kind === 'unarchive_thread') {
    unarchivingThreadId.value = request.threadId
    try {
      await unarchiveChatThread(request.threadId)
      setThreadArchiveState(request.threadId, false)
    } finally {
      unarchivingThreadId.value = null
    }
    return
  }

  archivingThreadId.value = request.threadId
  try {
    await archiveChatThread(request.threadId)
    setThreadArchiveState(request.threadId, true)
    threadTab.value = 'active'

    if (activeThreadId.value === request.threadId) {
      const next = activeThreads.value.find((thread) => thread.id !== request.threadId)
      if (next) {
        await selectThread(next.id)
      } else {
        activeThreadId.value = null
        activeThreadDetail.value = null
        messages.value = []
      }
    }
  } finally {
    archivingThreadId.value = null
  }
}

async function loadThreads(options?: { silent?: boolean }) {
  if (!options?.silent) {
    threadsLoading.value = true
    threadsError.value = null
  }
  try {
    const data = await fetchChatThreads()
    applyThreadData(data)
    const selectable = data.filter((thread) => !isThreadArchived(thread))
    const preferredId = resolvePreferredThreadId(selectable)
    if (preferredId && preferredId !== activeThreadId.value) {
      await selectThread(preferredId)
      return
    }
    if (!activeThreadId.value && selectable.length > 0) {
      const firstThread = selectable[0]
      if (firstThread) {
        await selectThread(firstThread.id)
      }
    }
  } catch {
    if (!options?.silent) {
      threadsError.value = 'Не вдалося завантажити список чатів.'
      threads.value = []
    }
  } finally {
    if (!options?.silent) {
      threadsLoading.value = false
    }
  }
}

async function loadActiveThreadDetail() {
  if (!activeThreadId.value) return
  detailLoading.value = true
  detailError.value = null
  try {
    const detail = await fetchChatThreadDetail(activeThreadId.value)
    activeThreadDetail.value = detail
  } catch {
    detailError.value = 'Не вдалося оновити контекст цього чату.'
  } finally {
    detailLoading.value = false
  }
}

async function loadMessages(options?: { since?: number | null }) {
  if (!activeThreadId.value) return
  if (!options?.since) {
    messagesLoading.value = true
    messagesError.value = null
  }

  const shouldStickToTop = options?.since ? isNearTop() : true

  try {
    const params = options?.since ? { since_id: options.since } : { limit: 50 }
    const data = await fetchChatMessages(activeThreadId.value, params)
    if (options?.since) {
      if (data.length) {
        messages.value = [...messages.value, ...data]
      }
    } else {
      messages.value = data
    }
    if (data.length) {
      const last = data[data.length - 1]
      if (last) {
        lastMessageId.value = last.id
      }
    }
    await nextTick()
    if (shouldStickToTop && (options?.since ? data.length > 0 : true)) {
      scrollToTop()
    }
  } catch {
    if (!options?.since) {
      messagesError.value = 'Не вдалося завантажити повідомлення.'
      messages.value = []
    }
  } finally {
    if (!options?.since) {
      messagesLoading.value = false
    }
  }
}

function isNearTop() {
  const el = messagesRef.value
  if (!el) return true
  return el.scrollTop < 72
}

function scrollToTop() {
  const el = messagesRef.value
  if (!el) return
  el.scrollTop = 0
}

function ensureThreadViewportPosition() {
  scrollToTop()
  const composerEl = composerRef.value
  if (composerEl && typeof composerEl.scrollIntoView === 'function') {
    composerEl.scrollIntoView({ block: 'nearest' })
  }
}

async function selectThread(threadId: number) {
  if (activeThreadId.value === threadId && activeThreadDetail.value?.id === threadId) return
  activeThreadId.value = threadId
  activeThreadDetail.value = null
  detailError.value = null
  sendError.value = null
  messagesError.value = null
  messages.value = []
  lastMessageId.value = null

  await Promise.all([loadMessages(), loadActiveThreadDetail()])
  markThreadRead(threadId)
  await nextTick()
  ensureThreadViewportPosition()
}

function markThreadRead(threadId: number) {
  const target = threads.value.find((item) => item.id === threadId)
  if (target) {
    target.unread_count = 0
  }
}

function backToThreads() {
  activeThreadId.value = null
  activeThreadDetail.value = null
}

function onComposerCompositionStart() {
  composerIsComposing.value = true
}

function onComposerCompositionEnd() {
  composerIsComposing.value = false
}

function onComposerKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter') return
  if (event.shiftKey) return
  if (event.isComposing || composerIsComposing.value) return
  event.preventDefault()
  void sendMessage()
}

async function sendMessage() {
  if (!activeThreadId.value || !draft.value.trim() || activeThreadArchived.value) return
  sending.value = true
  sendError.value = null
  try {
    const message = await sendChatMessage(activeThreadId.value, draft.value.trim())
    messages.value = [...messages.value, message]
    lastMessageId.value = message.id
    draft.value = ''
    markThreadRead(activeThreadId.value)
    await nextTick()
    scrollToTop()
  } catch {
    sendError.value = 'Не вдалося надіслати повідомлення. Спробуйте ще раз.'
  } finally {
    sending.value = false
  }
}

function startPolling() {
  if (pollId.value !== null) return
  pollId.value = window.setInterval(async () => {
    if (!activeThreadId.value) return
    await loadMessages({ since: lastMessageId.value })
  }, 5000)
}

function stopPolling() {
  if (pollId.value === null) return
  window.clearInterval(pollId.value)
  pollId.value = null
}

function startThreadPolling() {
  if (threadPollId.value !== null) return
  threadPollId.value = window.setInterval(async () => {
    await loadThreads({ silent: true })
  }, 10000)
}

function stopThreadPolling() {
  if (threadPollId.value === null) return
  window.clearInterval(threadPollId.value)
  threadPollId.value = null
}

function normalizeParams(params: Record<string, string | number> | undefined) {
  if (!params) return {}
  const normalized: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      normalized[key] = value
    }
  }
  return normalized
}

function fallbackClientTarget(clientId: number | null): RouteLocationRaw | null {
  if (!isSpecialist.value || !clientId || clientId <= 0) return null
  return `/cabinet/clients?client=${clientId}&autoOpen=1`
}

function fallbackSessionsTarget(clientId: number | null): RouteLocationRaw | null {
  if (!isSpecialist.value || !clientId || clientId <= 0) return null
  return {
    name: 'cabinet-sessions',
    query: { client: String(clientId) },
  }
}

function resolveKnownHeaderRoute(target: ChatThreadRouteTarget | null | undefined, fallbackClientId: number | null) {
  if (!target?.route_name) return null
  const params = normalizeParams(target.params)
  const fromParams = Number(params.clientId ?? params.client_id ?? fallbackClientId ?? 0)

  if (target.route_name === 'client-detail') {
    return fallbackClientTarget(fromParams > 0 ? fromParams : fallbackClientId)
  }
  if (target.route_name === 'client-sessions') {
    return fallbackSessionsTarget(fromParams > 0 ? fromParams : fallbackClientId)
  }

  return {
    name: target.route_name,
    params,
  }
}

function resolveHeaderTarget(kind: 'profile' | 'sessions') {
  const counterpart = activeCounterpart.value
  const fallbackClientId = Number(counterpart?.client_id || activeThread.value?.client_id || 0) || null
  const target = kind === 'profile' ? counterpart?.profile_target : counterpart?.sessions_target
  const known = resolveKnownHeaderRoute(target, fallbackClientId)
  if (known) return known
  return kind === 'profile' ? fallbackClientTarget(fallbackClientId) : fallbackSessionsTarget(fallbackClientId)
}

watch(activeThreadId, () => {
  if (activeThreadId.value) {
    startPolling()
  }
})

watch([preferredThreadId, preferredTherapistId], async () => {
  if (!threads.value.length) return
  const preferredId = resolvePreferredThreadId(activeThreads.value)
  if (!preferredId || preferredId === activeThreadId.value) return
  await selectThread(preferredId)
})

onMounted(async () => {
  await loadThreads()
  startThreadPolling()
})

onBeforeUnmount(() => {
  stopPolling()
  stopThreadPolling()
})
</script>

<style scoped>
.chat {
  display: grid;
  gap: 20px;
}

.chat__hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.chat__grid {
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(290px, 360px) 1fr;
}

.chat__threads {
  display: grid;
  gap: 12px;
  align-content: start;
}

.chat__thread-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chat-state {
  border: 1px dashed var(--line);
  border-radius: 10px;
  padding: 12px;
}

.chat-state--error {
  display: grid;
  gap: 8px;
  color: #8f2f2f;
  border-style: solid;
  border-color: rgba(177, 70, 70, 0.35);
  background: rgba(177, 70, 70, 0.06);
}

.thread-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 9px;
  background: #fff;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.thread-item__main {
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
  width: 100%;
  display: grid;
  grid-template-columns: 42px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 2px;
}

.thread-item--active {
  border-color: rgba(31, 74, 96, 0.44);
  box-shadow: 0 10px 18px rgba(16, 33, 50, 0.12);
  background: rgba(31, 74, 96, 0.05);
}

.thread-item:hover {
  transform: translateY(-1px);
}

.thread-item__avatar {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(7, 47, 71, 0.08);
  display: grid;
  place-items: center;
  font-weight: 600;
  color: var(--ink);
}

.thread-item__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thread-item__meta {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.thread-item__name {
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.thread-item__preview {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.thread-item__side {
  display: grid;
  justify-items: end;
  gap: 6px;
}

.thread-item__time {
  font-size: 11px;
}

.thread-item__badge {
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #e56b6f;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: grid;
  place-items: center;
}

.thread-item__actions {
  position: relative;
}

.thread-menu__trigger {
  min-width: 30px;
  padding: 0 8px;
}

.chat-menu {
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 152px;
  margin-top: 6px;
  padding: 6px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: #fff;
  box-shadow: 0 8px 18px rgba(15, 35, 48, 0.14);
  z-index: 4;
  display: grid;
  gap: 4px;
}

.chat-menu__item {
  border: 0;
  background: transparent;
  text-align: left;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  color: var(--ink);
}

.chat-menu__item:hover {
  background: rgba(7, 47, 71, 0.08);
}

.chat-menu__item:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.chat__messages {
  display: grid;
  gap: 12px;
  align-content: start;
}

.chat__window {
  display: grid;
  gap: 12px;
}

.chat-thread-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px;
}

.chat-thread-header__identity {
  min-width: 0;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  color: inherit;
  text-decoration: none;
}

.chat-thread-header__avatar {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(7, 47, 71, 0.08);
  display: grid;
  place-items: center;
  font-weight: 600;
}

.chat-thread-header__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chat-thread-header__meta {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.chat-thread-header__name {
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-thread-header__secondary {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-thread-header__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.chat-thread-header__action-btn {
  white-space: nowrap;
}

.chat-thread-header__sessions-label--compact {
  display: none;
}

.chat__messages-list {
  height: 450px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px 10px 8px 0;
}

.chat-message {
  max-width: 74%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.chat-message--me {
  align-self: flex-end;
  align-items: flex-end;
}

.chat-message__bubble-wrap {
  position: relative;
  display: inline-flex;
}

.chat-message__bubble {
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(7, 47, 71, 0.08);
  color: var(--ink);
  line-height: 1.4;
}

.message-delete-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--muted);
  font-size: 13px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.chat-message__bubble-wrap:hover .message-delete-btn,
.chat-message__bubble-wrap:focus-within .message-delete-btn,
.message-delete-btn:focus-visible {
  opacity: 1;
}

.message-delete-btn:hover {
  color: #a33939;
  border-color: #d4aaaa;
}

.message-delete-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.chat-message__bubble--deleted {
  background: rgba(7, 47, 71, 0.05);
  color: var(--muted);
  font-style: italic;
}

.chat-message--me .chat-message__bubble {
  background: rgba(31, 74, 96, 0.22);
}

.chat-message--me .chat-message__bubble--deleted {
  background: rgba(31, 74, 96, 0.12);
}

.chat-message__time {
  font-size: 11px;
  line-height: 1.2;
}

.chat__composer {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
}

.chat__composer-input {
  min-height: 42px;
  max-height: 120px;
  resize: vertical;
  line-height: 1.4;
  padding-top: 10px;
  padding-bottom: 10px;
}

.chat__composer-send {
  min-width: 124px;
  min-height: 42px;
}

.chat__mobile-back {
  display: none;
}

@media (max-width: 900px) {
  .chat__grid {
    grid-template-columns: 1fr;
  }

  .chat__pane--hidden-mobile {
    display: none;
  }

  .chat__messages-list {
    height: 360px;
  }

  .thread-item {
    grid-template-columns: 1fr;
  }

  .thread-item__actions {
    justify-self: end;
  }

  .chat-thread-header {
    gap: 8px;
    padding: 8px;
  }

  .chat-thread-header__actions {
    justify-content: flex-start;
    gap: 6px;
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 2px;
  }

  .chat-thread-header__action-btn {
    height: 30px;
    padding: 4px 10px;
    font-size: 13px;
    flex: 0 0 auto;
  }

  .chat-thread-header__profile-btn {
    display: none;
  }

  .chat-thread-header__sessions-label--full {
    display: none;
  }

  .chat-thread-header__sessions-label--compact {
    display: inline;
  }

  .chat-thread-header__avatar {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .chat-thread-header__identity {
    grid-template-columns: 36px minmax(0, 1fr);
    gap: 8px;
  }

  .chat-thread-header__name {
    font-size: 18px;
    line-height: 1.1;
  }

  .chat-thread-header__secondary {
    font-size: 11px;
  }

  .chat__mobile-back {
    display: inline-flex;
    justify-self: start;
  }

  .chat__composer {
    grid-template-columns: 1fr auto;
    gap: 8px;
  }

  .chat__composer-send {
    min-width: 104px;
  }
}
</style>
