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
      <aside class="card chat__threads">
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
        <div v-if="threadsLoading" class="muted">Завантаження...</div>
        <div v-else-if="visibleThreads.length === 0" class="muted">
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
              <img v-if="thread.other_user.photo_url" :src="thread.other_user.photo_url" alt="" />
              <span v-else>{{ initials(thread.other_user.display_name) }}</span>
            </div>
            <div class="thread-item__meta">
              <div class="thread-item__name">{{ thread.other_user.display_name }}</div>
              <div class="muted thread-item__preview">
                {{ thread.last_message_preview || 'Ще немає повідомлень' }}
              </div>
            </div>
            <span v-if="thread.unread_count" class="thread-item__badge">{{ thread.unread_count }}</span>
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

      <section class="card chat__messages">
        <div class="card__title">Переписка</div>
        <div v-if="!activeThread" class="muted">Оберіть чат, щоб побачити повідомлення.</div>
        <div v-else class="chat__window">
          <form class="chat__composer" @submit.prevent="sendMessage">
            <input
              v-model="draft"
              class="input"
              type="text"
              placeholder="Напишіть повідомлення"
              :disabled="sending || activeThreadArchived"
            />
            <button class="btn" type="submit" :disabled="sending || !draft.trim() || activeThreadArchived">
              Надіслати
            </button>
          </form>
          <div v-if="activeThreadArchived" class="muted">Цей чат в архіві. Надсилання повідомлень недоступне.</div>
          <div ref="messagesRef" class="chat__messages-list">
            <div
              v-for="message in messages"
              :key="message.id"
              :class="['chat-message', { 'chat-message--me': isMine(message) }]"
            >
              <div class="chat-message__row">
                <button
                  v-if="canDeleteMessage(message)"
                  class="btn btn--ghost btn--sm message-menu__trigger"
                  type="button"
                  :aria-label="`Дії повідомлення ${message.id}`"
                  @click.stop="toggleMessageMenu(message.id)"
                >
                  ⋯
                </button>
                <div v-if="openMessageMenuId === message.id" class="chat-menu" role="menu">
                  <button
                    class="chat-menu__item"
                    type="button"
                    role="menuitem"
                    :disabled="deletingMessageId === message.id"
                    @click="requestDeleteMessage(message)"
                  >
                    Видалити
                  </button>
                </div>
              </div>
              <div class="chat-message__bubble" :class="{ 'chat-message__bubble--deleted': isMessageDeleted(message) }">
                {{ isMessageDeleted(message) ? 'Повідомлення видалено' : message.body }}
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
import { useRoute } from 'vue-router'
import ConfirmModal from '../components/ConfirmModal.vue'
import { useAuthStore } from '../stores/auth'
import { formatUkDateTime } from '../lib/dateTime'
import {
  archiveChatThread,
  deleteChatMessage,
  fetchChatMessages,
  fetchChatThreads,
  sendChatMessage,
  unarchiveChatThread,
} from '../lib/api'
import type { ChatMessage, ChatThread } from '../lib/api'

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
const activeThreadId = ref<number | null>(null)
const messages = ref<ChatMessage[]>([])
const draft = ref('')
const sending = ref(false)
const pollId = ref<number | null>(null)
const threadPollId = ref<number | null>(null)
const lastMessageId = ref<number | null>(null)
const messagesRef = ref<HTMLDivElement | null>(null)
const threadTab = ref<ThreadTab>('active')
const openMessageMenuId = ref<number | null>(null)
const openThreadMenuId = ref<number | null>(null)
const localDeletedMessageIds = ref<Set<number>>(new Set())
const localArchivedThreadIds = ref<Set<number>>(new Set())
const confirmRequest = ref<ConfirmRequest>(null)
const deletingMessageId = ref<number | null>(null)
const archivingThreadId = ref<number | null>(null)
const unarchivingThreadId = ref<number | null>(null)

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

const activeThread = computed(() => allThreads.value.find((thread) => thread.id === activeThreadId.value) || null)
const activeThreadArchived = computed(() => (activeThread.value ? isThreadArchived(activeThread.value) : false))

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

function toggleMessageMenu(messageId: number) {
  openMessageMenuId.value = openMessageMenuId.value === messageId ? null : messageId
  openThreadMenuId.value = null
}

function toggleThreadMenu(threadId: number) {
  openThreadMenuId.value = openThreadMenuId.value === threadId ? null : threadId
  openMessageMenuId.value = null
}

function requestDeleteMessage(message: ChatMessage) {
  openMessageMenuId.value = null
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
        messages.value = []
      }
    }
  } finally {
    archivingThreadId.value = null
  }
}

async function loadThreads() {
  threadsLoading.value = true
  try {
    const data = await fetchChatThreads()
    threads.value = data
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
    threads.value = []
  } finally {
    threadsLoading.value = false
  }
}

async function loadMessages(options?: { since?: number | null }) {
  if (!activeThreadId.value) return
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
  scrollToBottom()
}

function scrollToBottom() {
  const el = messagesRef.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

async function selectThread(threadId: number) {
  if (activeThreadId.value === threadId) return
  activeThreadId.value = threadId
  messages.value = []
  lastMessageId.value = null
  openMessageMenuId.value = null
  await loadMessages()
  markThreadRead(threadId)
}

function markThreadRead(threadId: number) {
  const target = threads.value.find((item) => item.id === threadId)
  if (target) {
    target.unread_count = 0
  }
}

async function sendMessage() {
  if (!activeThreadId.value || !draft.value.trim() || activeThreadArchived.value) return
  sending.value = true
  try {
    const message = await sendChatMessage(activeThreadId.value, draft.value.trim())
    messages.value = [...messages.value, message]
    lastMessageId.value = message.id
    draft.value = ''
    markThreadRead(activeThreadId.value)
    await nextTick()
    scrollToBottom()
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
    await loadThreads()
  }, 10000)
}

function stopThreadPolling() {
  if (threadPollId.value === null) return
  window.clearInterval(threadPollId.value)
  threadPollId.value = null
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
  grid-template-columns: minmax(220px, 280px) 1fr;
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

.thread-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 8px;
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
  border-color: rgba(31, 74, 96, 0.4);
  box-shadow: 0 10px 18px rgba(16, 33, 50, 0.12);
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
}

.thread-item__name {
  font-weight: 600;
}

.thread-item__preview {
  font-size: 12px;
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
}

.chat__window {
  display: grid;
  gap: 12px;
}

.chat__messages-list {
  height: 440px;
  overflow-y: auto;
  display: grid;
  gap: 6px;
  padding-right: 8px;
}

.chat-message {
  max-width: 72%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.chat-message--me {
  justify-self: end;
  align-items: flex-end;
}

.chat-message__row {
  min-height: 24px;
  position: relative;
}

.message-menu__trigger {
  opacity: 0;
  min-width: 30px;
  padding: 0 8px;
  transition: opacity 0.18s ease;
}

.chat-message:hover .message-menu__trigger,
.chat-message:focus-within .message-menu__trigger {
  opacity: 1;
}

.chat-message__bubble {
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(7, 47, 71, 0.08);
  color: var(--ink);
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
}

.chat__composer {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
}

@media (max-width: 900px) {
  .chat__grid {
    grid-template-columns: 1fr;
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
}
</style>
