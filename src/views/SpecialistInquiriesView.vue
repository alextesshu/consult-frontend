<template>
  <section v-if="uiV2" class="pc2-inquiries" :class="{ 'is-thread-open': detailOpen }" aria-label="Короткі запити клієнтів">
    <aside ref="listPane" class="pc2-inquiries__list" aria-labelledby="inquiries-title">
      <div class="pc2-inquiries__intro">
        <h1 id="inquiries-title">Запити</h1>
        <p>Короткі питання до першої сесії. Це обмежений канал, не повний чат.</p>
        <div class="pc2-inquiries__filters" role="tablist" aria-label="Статуси запитів">
          <button v-for="item in filters" :id="`inquiries-filter-${item.key}`" :key="item.key" type="button" role="tab"
            :data-filter="item.key" :aria-selected="filter === item.key" aria-controls="inquiries-list"
            :tabindex="filter === item.key ? 0 : -1" @click="changeFilter(item.key)" @keydown="filterKeydown($event, item.key)">
            {{ item.label }} <span>{{ counts[item.key] }}</span>
          </button>
        </div>
      </div>
      <div id="inquiries-list" class="pc2-inquiries__rows" role="tabpanel" :aria-labelledby="`inquiries-filter-${filter}`" :aria-busy="threadsLoading">
        <p v-if="threadsLoading" class="pc2-inquiries__notice" role="status">Завантажуємо запити…</p>
        <div v-if="listError" class="pc2-inquiries__error" role="alert">
          <p>{{ listError }}</p><button type="button" :disabled="threadsLoading" @click="loadThreads()">Спробувати ще раз</button>
        </div>
        <p v-if="!threadsLoading && !listError && !visibleThreads.length" class="pc2-inquiries__empty" role="status">
          {{ filter === 'reply' ? 'Немає запитів, що чекають вашої відповіді.' : 'Тут поки немає запитів.' }}
        </p>
        <div v-for="thread in visibleThreads" :key="thread.id" class="pc2-inquiries__row" :class="{ 'is-leaving': leaving[thread.id] === filter && group(thread) !== filter }" :aria-hidden="leaving[thread.id] === filter && group(thread) !== filter ? true : undefined">
          <button :id="`inquiry-thread-${thread.id}`" type="button" class="pc2-inquiries__thread"
            :class="{ 'is-active': activeThreadId === thread.id, 'is-unread': thread.unread_count > 0 }"
            :disabled="leaving[thread.id] === filter && group(thread) !== filter"
            :aria-current="activeThreadId === thread.id ? 'true' : undefined" @click="openThread(thread.id)">
            <span class="pc2-inquiries__avatar" aria-hidden="true">
              <img v-if="threadAvatarUrl(thread) && !failedThreadAvatarIds.has(thread.id)" :src="threadAvatarUrl(thread)" alt="" @error="markThreadAvatarFailed(thread.id)" />
              <span v-else>{{ initials(thread.other_user.display_name) }}</span>
            </span>
            <span class="pc2-inquiries__summary">
              <span class="pc2-inquiries__row-top"><span class="pc2-inquiries__name">{{ thread.other_user.display_name }}</span><time :datetime="thread.last_message_at || thread.created_at">{{ shortTime(thread.last_message_at || thread.created_at) }}</time></span>
              <span class="pc2-inquiries__preview">{{ thread.last_message_preview || 'Ще немає повідомлень' }}</span>
              <span class="pc2-inquiries__row-bottom"><span class="pc2-inquiries__tag" :class="`is-${stateClass(thread)}`">{{ stateLabel(thread) }}</span><span v-if="thread.unread_count > 0" class="pc2-inquiries__unread">Непрочитаних: {{ thread.unread_count }}</span></span>
            </span>
          </button>
        </div>
      </div>
    </aside>
    <section class="pc2-inquiries__detail" aria-label="Деталі запиту" :aria-busy="messagesLoading || sendingForActive">
      <div v-if="!activeThread" class="pc2-inquiries__placeholder">Оберіть запит зі списку</div>
      <template v-else>
        <header class="pc2-inquiries__header">
          <button v-if="compact" type="button" class="pc2-inquiries__back" aria-label="Назад до запитів" @click="backToList()">‹</button>
          <span class="pc2-inquiries__avatar" aria-hidden="true">{{ initials(activeThread.other_user.display_name) }}</span>
          <div class="pc2-inquiries__identity"><h2 ref="threadHeading" tabindex="-1">{{ activeThread.other_user.display_name }}</h2><p>Коротке питання до першої сесії</p></div>
          <RouterLink v-if="activeClientCardTarget" class="pc2-inquiries__client" :to="activeClientCardTarget">Картка клієнта</RouterLink>
        </header>
        <div class="pc2-inquiries__body">
          <div class="pc2-inquiries__state" :class="`is-${stateClass(activeThread)}`"><strong>{{ activeThread.can_specialist_reply ? 'Чекає вашої відповіді' : replyStateCopy.title }}</strong><p>{{ activeThread.can_specialist_reply ? 'Відповідайте коротко: чи працюєте з цим запитом і як записатися. Деталі — вже на сесії.' : replyStateCopy.body }}</p><RouterLink v-if="activeThread.inquiry_status === 'ACTIVE_CLIENT'" to="/cabinet/chat">Перейти в чат →</RouterLink></div>
          <p v-if="messagesLoading" role="status">Завантажуємо повідомлення…</p>
          <div v-else-if="detailError" class="pc2-inquiries__error" role="alert"><p>{{ detailError }}</p><button type="button" @click="loadMessages()">Спробувати ще раз</button></div>
          <template v-else>
            <p v-if="!messages.length" class="pc2-inquiries__notice">Ще немає повідомлень.</p>
            <article v-for="message in messages" :key="message.id" class="pc2-inquiries__message" :class="{ 'is-mine': isMine(message.sender_id) }">
              <header><strong>{{ isMine(message.sender_id) ? 'Ви' : activeThread.other_user.display_name }}</strong><time :datetime="message.created_at">{{ formatTime(message.created_at) }}</time></header>
              <p>{{ message.body }}</p>
            </article>
          </template>
        </div>
        <form v-if="activeThread.can_specialist_reply" class="pc2-inquiries__composer" @submit.prevent="submitReply">
          <label for="inquiry-v2-reply">Коротка відповідь</label>
          <textarea id="inquiry-v2-reply" ref="composer" v-model="draft" rows="3" placeholder="Відповідайте в межах запиту перед сесією."
            :disabled="sendingForActive" :aria-invalid="!!sendError" :aria-describedby="sendError ? 'inquiry-send-error' : undefined" @input="resizeComposer" />
          <p v-if="sendError" id="inquiry-send-error" class="pc2-inquiries__error" role="alert">{{ sendError }}</p>
          <p v-if="refreshRequired.has(activeThread.id)" class="pc2-inquiries__notice">Оновіть запити перед наступною відповіддю.</p>
          <button class="pc2-inquiries__send" type="submit" :disabled="sending || !draft.trim() || refreshRequired.has(activeThread.id)">{{ sendingForActive ? 'Надсилаємо…' : sending ? 'Дочекайтеся завершення надсилання' : 'Надіслати відповідь' }}</button>
        </form>
      </template>
    </section>
    <p v-if="toastMessage" class="pc2-inquiries__toast" role="status">{{ toastMessage }}</p>
  </section>

  <section v-else class="inquiries">
    <header class="inquiries__hero card">
      <div>
        <div class="eyebrow">Перед сесією</div>
        <h1 class="title">Запити клієнтів</h1>
        <p class="muted">
          Тут видно короткі запити перед сесією. Це окремий обмежений канал, не повний чат.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
    </header>

    <div class="inquiries__grid">
      <aside class="card inquiries__threads">
        <div class="card__title">Вхідні запити</div>
        <div v-if="threadsLoading" class="muted">Завантаження...</div>
        <div v-else-if="threads.length === 0" class="muted">
          Поки що немає активних запитів перед сесією.
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
            <img
              v-if="threadAvatarUrl(thread) && !failedThreadAvatarIds.has(thread.id)"
              :src="threadAvatarUrl(thread)"
              alt=""
              @error="markThreadAvatarFailed(thread.id)"
            />
            <span v-else class="thread-item__avatar-fallback" title="Клієнт без фото">
              {{ initials(thread.other_user.display_name) }}
            </span>
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
          <div v-if="activeClientCardTarget" class="inquiry-actions">
            <RouterLink class="btn btn--ghost btn--sm" :to="activeClientCardTarget">
              Відкрити картку клієнта
            </RouterLink>
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
              placeholder="Коротко відповідайте в межах запиту перед сесією."
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatUkDateTime } from '../lib/dateTime'
import { useAuthStore } from '../stores/auth'
import { isUiV2 } from '../lib/uiVersion'
import { fetchInquiryMessages, fetchInquiryThreads, sendInquiryMessage, type InquiryMessage, type InquiryThread } from '../lib/api'
import { getInquiryActionErrorMessage, mapInquiryStateToUi } from '../lib/inquiryCopy'
import '../styles/inquiriesV2.css'

type Filter = 'reply' | 'wait' | 'done'
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const uiV2 = computed(isUiV2)
const threads = ref<InquiryThread[]>([])
const threadsLoading = ref(false)
const activeThreadId = ref<number | null>(null)
const messages = ref<InquiryMessage[]>([])
const messagesLoading = ref(false)
const listError = ref('')
const detailError = ref('')
const drafts = ref<Record<number, string>>({})
const sendErrors = ref<Record<number, string>>({})
const draft = computed({ get: () => activeThreadId.value === null ? '' : drafts.value[activeThreadId.value] || '', set: value => { if (activeThreadId.value !== null) drafts.value[activeThreadId.value] = value } })
const sendError = computed(() => activeThreadId.value === null ? '' : sendErrors.value[activeThreadId.value] || '')
const sending = ref(false)
const pendingThreadId = ref<number | null>(null)
const sendingForActive = computed(() => sending.value && pendingThreadId.value === activeThreadId.value)
const refreshRequired = ref(new Set<number>())
const failedThreadAvatarIds = ref<Set<number>>(new Set())
const compact = ref(false)
const reduced = ref(false)
const detailOpen = ref(false)
const filter = ref<Filter>('reply')
const filters: { key: Filter; label: string }[] = [{ key: 'reply', label: 'Чекають відповіді' }, { key: 'wait', label: 'Чекають клієнта' }, { key: 'done', label: 'Завершені' }]
const leaving = ref<Partial<Record<number, Filter>>>({})
const toastMessage = ref('')
const listPane = ref<HTMLElement | null>(null)
const threadHeading = ref<HTMLElement | null>(null)
const composer = ref<HTMLTextAreaElement | null>(null)
let disposed = false
let threadGeneration = 0
let messageGeneration = 0
let media: MediaQueryList | undefined
let motion: MediaQueryList | undefined
let toastTimer: ReturnType<typeof setTimeout> | undefined
const removalTimers = new Map<number, ReturnType<typeof setTimeout>>()

const activeThread = computed(() => threads.value.find(thread => thread.id === activeThreadId.value) || null)
const activeClientCardTarget = computed(() => activeThread.value ? clientCardTarget(activeThread.value) : null)
const replyStateCopy = computed(() => mapInquiryStateToUi({ status: activeThread.value?.inquiry_status, reasonCode: activeThread.value?.can_specialist_reply ? null : activeThread.value?.specialist_reply_reason_code, actor: 'specialist', mode: 'thread' }))
function group(thread: InquiryThread): Filter {
  if (['ACTIVE_CLIENT', 'CLOSED', 'ARCHIVED', 'BLOCKED'].includes(thread.inquiry_status)) return 'done'
  return thread.can_specialist_reply ? 'reply' : 'wait'
}
const counts = computed(() => threads.value.reduce((result, thread) => { result[group(thread)]++; return result }, { reply: 0, wait: 0, done: 0 }))
const visibleThreads = computed(() => threads.value.filter(thread => group(thread) === filter.value || leaving.value[thread.id] === filter.value))
function stateClass(thread: InquiryThread) { return thread.inquiry_status === 'ACTIVE_CLIENT' ? 'active' : group(thread) }
function stateLabel(thread: InquiryThread) {
  if (thread.inquiry_status === 'ACTIVE_CLIENT') return 'Став клієнтом'
  if (thread.inquiry_status === 'BLOCKED') return 'Заблоковано'
  if (thread.inquiry_status === 'ARCHIVED') return 'Архівний'
  if (thread.inquiry_status === 'CLOSED') return 'Закрито'
  return thread.can_specialist_reply ? 'Чекає відповіді' : 'Очікується клієнт'
}
function preferredThreadIdFromRoute() {
  const raw = Array.isArray(route.query.thread_id) ? route.query.thread_id[0] : route.query.thread_id
  const parsed = Number(raw)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}
function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '..'
  return parts.length === 1 ? parts[0]?.slice(0, 2).toUpperCase() || '..' : `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase()
}
function threadAvatarUrl(thread: InquiryThread) {
  const value = String(thread.other_user.photo_url || '').trim()
  return ['null', 'none', 'undefined'].includes(value.toLowerCase()) ? '' : value
}
function markThreadAvatarFailed(id: number) { failedThreadAvatarIds.value = new Set([...failedThreadAvatarIds.value, id]) }
function clientCardTarget(thread: InquiryThread) { const id = Number(thread.client_id); return Number.isInteger(id) && id > 0 ? `/cabinet/clients?client=${id}&autoOpen=1` : null }
function formatTime(value: string) { return formatUkDateTime(value, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }, value) }
function shortTime(value: string) { return formatUkDateTime(value, { day: 'numeric', month: 'short' }, value) }
function isMine(senderId: number) { return senderId === auth.me?.user.id }
function syncQuery(id: number | null) {
  if (!uiV2.value || preferredThreadIdFromRoute() === id) return
  const query = { ...route.query }
  if (id === null) delete query.thread_id
  else query.thread_id = String(id)
  void router?.push({ query })
}
async function focusHeading(id: number) {
  await nextTick()
  if (!disposed && activeThreadId.value === id && (!compact.value || detailOpen.value)) threadHeading.value?.focus({ preventScroll: true })
}
async function backToList(updateRoute = true) {
  const id = activeThreadId.value
  detailOpen.value = false
  activeThreadId.value = null
  messages.value = []
  messagesLoading.value = false
  detailError.value = ''
  messageGeneration++
  if (updateRoute) syncQuery(null)
  await nextTick()
  if (!disposed && id !== null) (listPane.value?.querySelector<HTMLElement>(`#inquiry-thread-${id}`) ?? listPane.value?.querySelector<HTMLElement>(`[data-filter="${filter.value}"]`))?.focus({ preventScroll: true })
}
function openThread(id: number) { void selectThread(id, true); syncQuery(id) }
function changeFilter(value: Filter) {
  filter.value = value
  if (!compact.value) {
    const first = visibleThreads.value.find(thread => !leaving.value[thread.id])
    if (first) void selectThread(first.id, false)
    else { activeThreadId.value = null; messages.value = []; messageGeneration++ }
  }
  syncQuery(null)
}
function filterKeydown(event: KeyboardEvent, current: Filter) {
  const index = filters.findIndex(item => item.key === current)
  const next = event.key === 'ArrowRight' ? (index + 1) % 3 : event.key === 'ArrowLeft' ? (index + 2) % 3 : event.key === 'Home' ? 0 : event.key === 'End' ? 2 : null
  if (next === null) return
  event.preventDefault()
  const item = filters[next]!
  changeFilter(item.key)
  listPane.value?.querySelector<HTMLElement>(`[data-filter="${item.key}"]`)?.focus()
}
function resizeComposer() {
  const field = composer.value
  if (!field) return
  field.style.height = 'auto'
  field.style.height = `${Math.min(field.scrollHeight, 200)}px`
}
async function loadThreads(select = true): Promise<boolean> {
  const generation = ++threadGeneration
  threadsLoading.value = true
  listError.value = ''
  try {
    const result = await fetchInquiryThreads()
    if (disposed || generation !== threadGeneration) return false
    threads.value = result
    refreshRequired.value = new Set()
    const preferred = result.find(thread => thread.id === preferredThreadIdFromRoute())
    const current = result.find(thread => thread.id === activeThreadId.value)
    if (select && preferred && preferred.id !== activeThreadId.value) {
      if (uiV2.value) filter.value = group(preferred)
      await selectThread(preferred.id, true)
    } else if (!current) {
      messageGeneration++
      messages.value = []
      activeThreadId.value = null
      if (select && (!uiV2.value || !compact.value) && result.length) {
        const first = uiV2.value ? visibleThreads.value[0] : result[0]
        if (first) await selectThread(first.id, false)
      } else if (!result.length) detailOpen.value = false
    }
    return true
  } catch (error) {
    if (disposed || generation !== threadGeneration) return false
    listError.value = getInquiryActionErrorMessage(error, 'specialist', 'Не вдалося завантажити запити перед сесією.')
    if (!uiV2.value) { threads.value = []; detailError.value = listError.value }
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status === 401 || status === 403) { threads.value = []; activeThreadId.value = null; messages.value = []; messageGeneration++ }
    return false
  } finally { if (!disposed && generation === threadGeneration) threadsLoading.value = false }
}
async function loadMessages(): Promise<void> {
  const id = activeThreadId.value
  const generation = ++messageGeneration
  if (id === null) { messages.value = []; return }
  messagesLoading.value = true
  detailError.value = ''
  try {
    const result = await fetchInquiryMessages(id, { limit: 50 })
    if (disposed || generation !== messageGeneration || activeThreadId.value !== id) return
    messages.value = result
    const thread = threads.value.find(item => item.id === id)
    if (thread) thread.unread_count = 0
  } catch (error) {
    if (disposed || generation !== messageGeneration || activeThreadId.value !== id) return
    messages.value = []
    detailError.value = getInquiryActionErrorMessage(error, 'specialist', 'Не вдалося завантажити повідомлення запиту.')
  } finally { if (!disposed && generation === messageGeneration) messagesLoading.value = false }
}
async function selectThread(id: number, focus = false) {
  if (!threads.value.some(thread => thread.id === id)) return
  detailOpen.value = true
  if (activeThreadId.value === id) { if (focus && uiV2.value) void focusHeading(id); return }
  activeThreadId.value = id
  messages.value = []
  if (focus && uiV2.value) void focusHeading(id)
  await loadMessages()
  if (!disposed && activeThreadId.value === id) { await nextTick(); resizeComposer() }
}
async function submitReply() {
  const thread = activeThread.value
  if (sending.value || !thread?.can_specialist_reply || !draft.value.trim() || refreshRequired.value.has(thread.id)) return
  const id = thread.id, text = draft.value.trim(), from = group(thread)
  sending.value = true
  pendingThreadId.value = id
  sendErrors.value[id] = ''
  try {
    await sendInquiryMessage(id, text)
    if (disposed) return
    if ((drafts.value[id] || '').trim() === text) drafts.value[id] = ''
    refreshRequired.value = new Set([...refreshRequired.value, id])
    if (uiV2.value && !reduced.value) leaving.value[id] = from
    const refreshed = await loadThreads(false)
    if (disposed) return
    if (activeThreadId.value === id) { await loadMessages(); if (uiV2.value) void focusHeading(id) }
    if (disposed) return
    const updated = threads.value.find(item => item.id === id)
    if (refreshed && updated && group(updated) !== from && leaving.value[id]) {
      removalTimers.set(id, setTimeout(() => { delete leaving.value[id]; removalTimers.delete(id) }, 800))
    } else delete leaving.value[id]
    if (uiV2.value) { toastMessage.value = 'Відповідь надіслано.'; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastMessage.value = '' }, 3200) }
  } catch (error) {
    if (disposed) return
    sendErrors.value[id] = getInquiryActionErrorMessage(error, 'specialist', 'Не вдалося надіслати відповідь.')
    // Eligibility may have changed while the draft was being written.
    await loadThreads(false)
  } finally { if (!disposed) { sending.value = false; pendingThreadId.value = null } }
}
function syncViewport() { compact.value = media?.matches ?? false }
function syncMotion() {
  reduced.value = motion?.matches ?? false
  if (reduced.value) { removalTimers.forEach(clearTimeout); removalTimers.clear(); leaving.value = {} }
}
onMounted(() => {
  media = window.matchMedia?.('(max-width: 1023px)'); syncViewport(); media?.addEventListener('change', syncViewport)
  motion = window.matchMedia?.('(prefers-reduced-motion: reduce)'); syncMotion(); motion?.addEventListener('change', syncMotion)
  void loadThreads()
})
watch(() => route.query.thread_id, () => {
  const id = preferredThreadIdFromRoute()
  const thread = threads.value.find(item => item.id === id)
  if (thread) { if (uiV2.value) filter.value = group(thread); void selectThread(thread.id, uiV2.value) }
  else if (!id && uiV2.value && compact.value) void backToList(false)
  else if (!id && uiV2.value) {
    const first = visibleThreads.value.find(item => !leaving.value[item.id])
    if (first) void selectThread(first.id, true)
  }
})
onBeforeUnmount(() => {
  disposed = true; threadGeneration++; messageGeneration++
  media?.removeEventListener('change', syncViewport); motion?.removeEventListener('change', syncMotion)
  clearTimeout(toastTimer); removalTimers.forEach(clearTimeout); removalTimers.clear()
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

.thread-item__avatar-fallback {
  color: var(--ink);
}

.inquiry-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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
