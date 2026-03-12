<template>
  <section class="inquiries">
    <header class="inquiries__hero card">
      <div>
        <div class="eyebrow">До бронювання</div>
        <h1 class="title">Запити клієнтів</h1>
        <p class="muted">
          Тут видно короткі запити до бронювання. Це окремий обмежений канал, не повний чат.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
    </header>

    <div class="inquiries__grid">
      <aside class="card inquiries__threads">
        <div class="card__title">Вхідні запити</div>
        <div v-if="threadsLoading" class="muted">Завантаження...</div>
        <div v-else-if="threads.length === 0" class="muted">
          Поки що немає активних запитів до бронювання.
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
        </button>
      </aside>

      <section class="card inquiries__detail">
        <div class="card__title">Деталі запиту</div>
        <div v-if="detailError" class="form-error">{{ detailError }}</div>
        <div v-else-if="!activeThread" class="muted">
          Оберіть запит, щоб переглянути повідомлення.
        </div>
        <template v-else>
          <div class="inquiry-state" :class="`inquiry-state--${replyStateCopy.tone}`">
            <div class="inquiry-state__title">{{ replyStateCopy.title }}</div>
            <div>{{ replyStateCopy.body }}</div>
          </div>

          <div v-if="messagesLoading" class="muted">Завантажуємо повідомлення...</div>
          <div v-else class="inquiry-thread">
            <article
              v-for="message in messages"
              :key="message.id"
              class="inquiry-message"
              :class="{ 'inquiry-message--me': isMine(message.sender_id) }"
            >
              <div class="inquiry-message__author">
                {{ isMine(message.sender_id) ? 'Ви' : activeThread.other_user.display_name }}
              </div>
              <div class="inquiry-message__body">{{ message.body }}</div>
              <div class="inquiry-message__time muted">{{ formatTime(message.created_at) }}</div>
            </article>
          </div>

          <form
            v-if="activeThread.can_specialist_reply"
            class="inquiry-composer"
            @submit.prevent="submitReply"
          >
            <label class="inquiry-composer__label" for="specialistInquiryReply">Коротка відповідь</label>
            <textarea
              id="specialistInquiryReply"
              v-model="draft"
              class="input inquiry-composer__textarea"
              rows="4"
              placeholder="Коротко відповідайте в межах запиту до бронювання."
              :disabled="sending"
            ></textarea>
            <div v-if="sendError" class="form-error">{{ sendError }}</div>
            <button class="btn btn--primary" type="submit" :disabled="sending || !draft.trim()">
              Надіслати відповідь
            </button>
          </form>
        </template>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { formatUkDateTime } from '../lib/dateTime'
import { useAuthStore } from '../stores/auth'
import {
  fetchInquiryMessages,
  fetchInquiryThreads,
  sendInquiryMessage,
  type InquiryMessage,
  type InquiryThread,
} from '../lib/api'
import { getInquiryActionErrorMessage, mapInquiryStateToUi } from '../lib/inquiryCopy'

const auth = useAuthStore()
const threads = ref<InquiryThread[]>([])
const threadsLoading = ref(false)
const activeThreadId = ref<number | null>(null)
const messages = ref<InquiryMessage[]>([])
const messagesLoading = ref(false)
const detailError = ref('')
const draft = ref('')
const sending = ref(false)
const sendError = ref('')

const activeThread = computed(() =>
  threads.value.find((thread) => thread.id === activeThreadId.value) || null
)

const replyStateCopy = computed(() =>
  mapInquiryStateToUi({
    status: activeThread.value?.inquiry_status,
    reasonCode: activeThread.value?.can_specialist_reply
      ? null
      : activeThread.value?.specialist_reply_reason_code,
    actor: 'specialist',
    mode: 'thread',
  })
)

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '..'
  if (parts.length === 1) return parts[0]?.slice(0, 2).toUpperCase() || '..'
  return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase()
}

function formatTime(value: string) {
  return formatUkDateTime(value, {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }, value)
}

function isMine(senderId: number) {
  return senderId === auth.me?.user.id
}

async function loadThreads() {
  threadsLoading.value = true
  try {
    threads.value = await fetchInquiryThreads()
    if (!activeThreadId.value && threads.value.length > 0) {
      const firstThread = threads.value[0]
      if (firstThread) {
        await selectThread(firstThread.id)
      }
    }
  } catch (err: any) {
    threads.value = []
    detailError.value = getInquiryActionErrorMessage(
      err,
      'specialist',
      'Не вдалося завантажити запити до бронювання.'
    )
  } finally {
    threadsLoading.value = false
  }
}

async function loadMessages() {
  if (!activeThreadId.value) {
    messages.value = []
    return
  }
  messagesLoading.value = true
  detailError.value = ''
  try {
    messages.value = await fetchInquiryMessages(activeThreadId.value, { limit: 50 })
  } catch (err: any) {
    messages.value = []
    detailError.value = getInquiryActionErrorMessage(
      err,
      'specialist',
      'Не вдалося завантажити повідомлення запиту.'
    )
  } finally {
    messagesLoading.value = false
  }
}

async function selectThread(threadId: number) {
  if (activeThreadId.value === threadId) return
  activeThreadId.value = threadId
  draft.value = ''
  sendError.value = ''
  await loadMessages()
}

async function submitReply() {
  if (!activeThread.value?.can_specialist_reply || !draft.value.trim()) return
  sending.value = true
  sendError.value = ''
  try {
    await sendInquiryMessage(activeThread.value.id, draft.value.trim())
    draft.value = ''
    await Promise.all([loadThreads(), loadMessages()])
  } catch (err: any) {
    sendError.value = getInquiryActionErrorMessage(
      err,
      'specialist',
      'Не вдалося надіслати відповідь.'
    )
  } finally {
    sending.value = false
  }
}

onMounted(async () => {
  await loadThreads()
})
</script>

<style scoped>
.inquiries {
  display: grid;
  gap: 18px;
}

.inquiries__grid {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: 16px;
}

.inquiries__threads,
.inquiries__detail {
  display: grid;
  gap: 12px;
  align-content: start;
}

.thread-item {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: #fff;
  text-align: left;
}

.thread-item--active {
  border-color: color-mix(in srgb, var(--primary) 35%, var(--line));
  background: rgba(8, 113, 201, 0.06);
}

.thread-item__avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: rgba(7, 47, 71, 0.08);
  font-weight: 700;
}

.thread-item__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thread-item__meta {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.thread-item__name {
  font-weight: 600;
}

.thread-item__preview {
  font-size: 13px;
}

.inquiry-state {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--line);
  display: grid;
  gap: 6px;
}

.inquiry-state--info {
  background: rgba(8, 113, 201, 0.08);
}

.inquiry-state--warning {
  background: rgba(194, 75, 75, 0.08);
}

.inquiry-state--neutral {
  background: rgba(7, 47, 71, 0.04);
}

.inquiry-state__title {
  font-weight: 600;
}

.inquiry-thread {
  display: grid;
  gap: 10px;
}

.inquiry-message {
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: #fff;
}

.inquiry-message--me {
  background: rgba(8, 113, 201, 0.06);
}

.inquiry-message__author {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}

.inquiry-message__body {
  white-space: pre-line;
  line-height: 1.5;
}

.inquiry-message__time {
  font-size: 12px;
}

.inquiry-composer {
  display: grid;
  gap: 10px;
}

.inquiry-composer__label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
  font-weight: 600;
}

.inquiry-composer__textarea {
  min-height: 120px;
  resize: vertical;
}

@media (max-width: 900px) {
  .inquiries__grid {
    grid-template-columns: 1fr;
  }
}
</style>


