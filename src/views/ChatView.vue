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
        <div class="card__title">Активні чати</div>
        <div v-if="threadsLoading" class="muted">Завантаження...</div>
        <div v-else-if="threads.length === 0" class="muted">
          Поки що немає активних чатів.
        </div>
        <button
          v-for="thread in threads"
          :key="thread.id"
          type="button"
          class="thread-item"
          :class="{ 'thread-item--active': thread.id === activeThreadId }"
          @click="selectThread(thread.id)"
        >
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
      </aside>

      <section class="card chat__messages">
        <div class="card__title">Переписка</div>
        <div v-if="!activeThread" class="muted">Оберіть чат, щоб побачити повідомлення.</div>
        <div v-else class="chat__window">
          <div ref="messagesRef" class="chat__messages-list">
            <div
              v-for="message in messages"
              :key="message.id"
              :class="['chat-message', { 'chat-message--me': isMine(message) }]"
            >
              <div class="chat-message__bubble">{{ message.body }}</div>
              <div class="chat-message__time muted">{{ formatTime(message.created_at) }}</div>
            </div>
          </div>
          <form class="chat__composer" @submit.prevent="sendMessage">
            <input
              v-model="draft"
              class="input"
              type="text"
              placeholder="Напишіть повідомлення"
              :disabled="sending"
            />
            <button class="btn" type="submit" :disabled="sending || !draft.trim()">
              Надіслати
            </button>
          </form>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import {
  ChatMessage,
  ChatThread,
  fetchChatMessages,
  fetchChatThreads,
  sendChatMessage,
} from '../lib/api'

const auth = useAuthStore()
const threads = ref<ChatThread[]>([])
const threadsLoading = ref(false)
const activeThreadId = ref<number | null>(null)
const messages = ref<ChatMessage[]>([])
const draft = ref('')
const sending = ref(false)
const pollId = ref<number | null>(null)
const threadPollId = ref<number | null>(null)
const lastMessageId = ref<number | null>(null)
const messagesRef = ref<HTMLDivElement | null>(null)

const isTherapist = computed(() => auth.me?.user.roles?.includes('THERAPIST'))
const backRoute = computed(() => (isTherapist.value ? '/cabinet' : '/client'))

const activeThread = computed(() =>
  threads.value.find((thread) => thread.id === activeThreadId.value) || null
)

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '...'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function isMine(message: ChatMessage) {
  return message.sender_id === auth.me?.user.id
}

function formatTime(value: string) {
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return value
  return dt.toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function loadThreads() {
  threadsLoading.value = true
  try {
    const data = await fetchChatThreads()
    threads.value = data
    if (!activeThreadId.value && data.length > 0) {
      await selectThread(data[0].id)
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
    lastMessageId.value = data[data.length - 1].id
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
  if (!activeThreadId.value || !draft.value.trim()) return
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

.thread-item {
  display: grid;
  grid-template-columns: 42px 1fr auto;
  gap: 10px;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 10px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
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
  gap: 10px;
  padding-right: 8px;
}

.chat-message {
  max-width: 72%;
  display: grid;
  gap: 4px;
}

.chat-message--me {
  justify-self: end;
  text-align: right;
}

.chat-message__bubble {
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(7, 47, 71, 0.08);
  color: var(--ink);
}

.chat-message--me .chat-message__bubble {
  background: rgba(31, 74, 96, 0.22);
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
}
</style>
