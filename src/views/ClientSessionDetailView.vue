<template>
  <section class="session-detail">
    <header class="detail-hero">
      <div>
        <div class="badge">Сесія клієнта</div>
        <h1 class="title detail-title">Деталі сесії</h1>
        <p class="muted detail-subtitle">Перегляд статусу, скасування або перенесення.</p>
      </div>
      <RouterLink class="btn btn--ghost" to="/client">Назад до кабінету</RouterLink>
    </header>

        <div v-if="loading" class="muted" style="margin-top: 12px;">Завантаження...</div>

    <section v-if="session" class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Статус</div>
          <h2 class="panel__title">{{ statusLabel(session) }}</h2>
        </div>
      </div>
      <div class="detail-grid">
        <div class="detail-card">
          <div class="detail-label">Початок</div>
          <div class="detail-value">{{ formatDateTime(session.slot_start_at) }}</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">Тривалість</div>
          <div class="detail-value">{{ formatDuration(session.slot_start_at, session.slot_end_at) }}</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">Формат</div>
          <div class="detail-value">Формат: {{ sessionFormatLabel }}</div>
          <div v-if="offlineLocation" class="muted" style="font-size: 12px;">
            Локація: {{ offlineLocation }}
          </div>
        </div>
        <div class="detail-card">
          <div class="detail-label">Спеціаліст</div>
          <div class="detail-value">
            {{ specialistLabel(session) }}
            <div v-if="session.specialist_email" class="muted" style="font-size: 12px;">
              {{ session.specialist_email }}
            </div>
            <div class="muted" style="font-size: 12px;">
              ID: #{{ session.specialist_id }}
            </div>
            <div v-if="session.specialist_public_slug" class="detail-actions">
              <RouterLink class="btn btn--ghost btn--sm" :to="`/specialist/${session.specialist_public_slug}`">
                Відкрити профіль
              </RouterLink>
              <button class="btn btn--ghost btn--sm" type="button" @click="copySpecialistLink">
                Скопіювати посилання
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="statusGuidance" class="detail-notice">
        {{ statusGuidance }}
      </div>

      <div v-if="isOfflineSession" class="detail-notice detail-notice--meeting">
        <div class="meeting-row">
          <div>
            <div class="detail-label">Офлайн-сесія</div>
            <div class="detail-value">
              {{ offlineLocation || 'Локацію спеціаліст повідомить додатково.' }}
            </div>
            <div class="muted meeting-hint">Це офлайн-формат, посилання для приєднання не потрібне.</div>
          </div>
        </div>
      </div>

      <div v-if="showMeetingSection" class="detail-notice detail-notice--meeting">
        <div class="meeting-row">
          <div>
            <div class="detail-label">Онлайн-зустріч</div>
            <div class="detail-value">{{ meetingTitle }}</div>
            <div class="muted meeting-hint">{{ meetingHint }}</div>
          </div>
          <div class="meeting-actions">
            <a
              v-if="canJoinMeeting"
              class="btn btn--sm"
              :href="meetingUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              Приєднатися
            </a>
            <button v-if="meetingUrl" class="btn btn--ghost btn--sm" type="button" @click="copyMeetingLink">
              Скопіювати посилання
            </button>
          </div>
        </div>
      </div>

      <div class="action-row">
        <RouterLink
          v-if="followUpBookingLabel && session.specialist_public_slug"
          class="btn"
          :to="`/specialist/${session.specialist_public_slug}`"
        >
          {{ followUpBookingLabel }}
        </RouterLink>
        <button
          v-if="canRequestMeetingLink"
          class="btn btn--ghost"
          type="button"
          :disabled="meetingLinkRequestSending || meetingLinkRequestSent"
          @click="requestMeetingLinkFromSpecialist"
        >
          {{
            meetingLinkRequestSent
              ? 'Запит надіслано'
              : meetingLinkRequestSending
                ? 'Надсилаємо...'
                : 'Попросити лінк зустрічі'
          }}
        </button>
        <button
          class="btn btn--ghost"
          type="button"
          :disabled="actionLoading || !canCancel(session.status)"
          @click="cancelSession"
        >
          Скасувати сесію
        </button>
      </div>
    </section>

    <section v-if="session" class="panel">
      <SessionPaymentProofBlock
        :session-id="session.id"
        role="client"
        :payment-proof="session.payment_proof"
        @updated="onPaymentProofUpdated"
      />
    </section>

    <section v-if="session" class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Перенесення</div>
          <h2 class="panel__title">Обрати новий слот</h2>
        </div>
      </div>
      <div class="detail-notice detail-notice--soft" style="margin-top: 6px;">
        {{ rescheduleGuidance }}
      </div>
      <div class="suggestions-block" style="margin-top: 12px;">
        <div class="muted suggestions-title">Рекомендовані варіанти перенесення</div>
        <div v-if="suggestionsLoading" class="muted">Завантаження рекомендацій...</div>
        <div v-else-if="rescheduleSuggestions.length === 0" class="muted">
          Для цієї сесії зараз немає зручних варіантів перенесення
        </div>
        <div v-else class="suggestions-list">
          <button
            v-for="item in rescheduleSuggestions.slice(0, 5)"
            :key="item.slot_id"
            class="btn btn--ghost btn--sm suggestion-btn"
            :class="{ 'suggestion-btn--active': selectedSuggestionSlotId === item.slot_id }"
            type="button"
            :disabled="actionLoading"
            @click="selectSuggestedSlot(item.slot_id)"
          >
            <span>{{ formatDateTime(item.start_at) }} · {{ formatDuration(item.start_at, item.end_at) }}</span>
            <span class="muted suggestion-meta">{{ suggestionReasonLabel(item.reason_tag) }}</span>
          </button>
        </div>
        <button
          v-if="selectedSuggestionSlotId"
          class="btn btn--sm"
          type="button"
          :disabled="actionLoading || !canReschedule(session.status)"
          @click="applySelectedSuggestion"
        >
          {{ session.status === 'CONFIRMED' ? 'Запросити перенос для обраного варіанта' : 'Перенести на обраний варіант' }}
        </button>
      </div>
      <div v-if="slotsLoading" class="muted" style="margin-top: 10px;">Завантаження слотів...</div>
      <div v-else-if="availableSlots.length === 0" class="muted" style="margin-top: 10px;">
        Немає доступних слотів.
      </div>
        <div v-else class="slot-list">
        <div v-for="slot in availableSlots" :key="slot.id" class="slot-card">
          <div>
            <div class="slot-time">{{ formatDateTime(slot.start_at) }}</div>
            <div class="muted">{{ formatDuration(slot.start_at, slot.end_at) }}</div>
          </div>
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :disabled="actionLoading || !canReschedule(session.status)"
            @click="session.status === 'CONFIRMED' ? requestReschedule(slot.id) : rescheduleTo(slot.id)"
          >
            {{ session.status === 'CONFIRMED' ? 'Запросити перенос' : 'Перенести сюди' }}
          </button>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  apiGet,
  apiPatch,
  apiPost,
  fetchChatThreads,
  sendChatMessage,
  type SessionPaymentProof,
  type BookingSessionCreatePayload,
  type SessionFormat,
} from '../lib/api'
import {
  BOOKING_ERROR_FALLBACKS,
  BOOKING_SUCCESS_MESSAGES,
  getBookingErrorMessage,
  getSuggestionReasonLabel,
} from '../lib/bookingCopy'
import { formatUkDateTimeCompact } from '../lib/dateTime'
import { getApiErrorMessage } from '../lib/errors'
import {
  canJoinExternalMeeting,
  externalMeetingHint,
  externalMeetingProviderLabel,
  normalizeMeetingUrl,
} from '../lib/sessionExecution'
import { useToast } from '../composables/useToast'
import SessionPaymentProofBlock from '../components/SessionPaymentProofBlock.vue'
type SessionDetail = {
  id: number
  status: string
  slot_start_at: string | null
  slot_end_at: string | null
  specialist_id: number
  specialist_name?: string | null
  specialist_username?: string | null
  specialist_email?: string | null
  specialist_public_slug?: string | null
  session_format?: SessionFormat | null
  meeting_mode?: 'ONLINE' | 'OFFLINE' | null
  offline_location?: string | null
  meeting_url?: string | null
  meeting_provider?: string | null
  join_available?: boolean
  client: number
  payment_proof?: SessionPaymentProof | null
}

type PublicSlot = {
  id: number
  start_at: string
  end_at: string
}

type RescheduleSuggestion = {
  slot_id: number
  start_at: string
  end_at: string
  label: string
  reason_tag: string
}

const route = useRoute()
const router = useRouter()
const sessionId = computed(() => Number(route.params.id))
const session = ref<SessionDetail | null>(null)
const loading = ref(false)
const error = ref('')
const toast = useToast()
const actionLoading = ref(false)
const slotsLoading = ref(false)
const availableSlots = ref<PublicSlot[]>([])
const suggestionsLoading = ref(false)
const rescheduleSuggestions = ref<RescheduleSuggestion[]>([])
const selectedSuggestionSlotId = ref<number | null>(null)
const meetingLinkRequestSending = ref(false)
const meetingLinkRequestSent = ref(false)
const canReschedule = (status: string) => status === 'SCHEDULED' || status === 'CONFIRMED'

function normalizeSessionFormat(detail: SessionDetail | null): SessionFormat {
  if (!detail) return 'online'
  if (detail.session_format === 'offline') return 'offline'
  if (detail.session_format === 'online') return 'online'
  if (detail.meeting_mode === 'OFFLINE') return 'offline'
  return 'online'
}

const sessionFormat = computed<SessionFormat>(() => normalizeSessionFormat(session.value))
const isOfflineSession = computed(() => sessionFormat.value === 'offline')
const sessionFormatLabel = computed(() => (isOfflineSession.value ? 'Офлайн' : 'Онлайн'))
const offlineLocation = computed(() => {
  if (!isOfflineSession.value) return ''
  return (session.value?.offline_location || '').trim()
})
const meetingUrl = computed(() => normalizeMeetingUrl(session.value?.meeting_url))
const isActiveSession = computed(() =>
  session.value ? ['SCHEDULED', 'CONFIRMED'].includes(session.value.status) : false
)
const showMeetingSection = computed(() =>
  Boolean(session.value && !isOfflineSession.value && (meetingUrl.value || isActiveSession.value))
)
const isJoinUnavailableYet = computed(() =>
  Boolean(
    session.value &&
      !isOfflineSession.value &&
      meetingUrl.value &&
      isActiveSession.value &&
      session.value.join_available === false
  )
)
const canJoinMeeting = computed(() =>
  session.value
    ? !isOfflineSession.value &&
      canJoinExternalMeeting(session.value) &&
      session.value.join_available !== false
    : false
)
const meetingProvider = computed(() =>
  externalMeetingProviderLabel(session.value?.meeting_provider, meetingUrl.value)
)
const meetingTitle = computed(() => {
  if (!meetingUrl.value) return 'Посилання ще не додано'
  return meetingProvider.value
})
const meetingHint = computed(() => {
  if (!session.value || !meetingUrl.value) {
    return 'Посилання на онлайн-зустріч ще не додано. Коли спеціаліст додасть посилання, тут з’явиться кнопка «Приєднатися».'
  }
  const baseHint = externalMeetingHint(session.value)
  if (isJoinUnavailableYet.value) {
    return `${baseHint} Приєднання стане доступним ближче до часу сесії.`
  }
  return baseHint
})
const followUpBookingLabel = computed(() => {
  if (!session.value?.specialist_public_slug) return ''
  if (session.value.status === 'COMPLETED') return 'Записатися повторно'
  if (session.value.status === 'CANCELLED' || session.value.status === 'NO_SHOW') {
    return 'Обрати новий слот'
  }
  return ''
})
const canRequestMeetingLink = computed(() => {
  if (!session.value || isOfflineSession.value || meetingUrl.value || !isActiveSession.value) return false
  return Number.isInteger(session.value.specialist_id) && session.value.specialist_id > 0
})

const statusGuidance = computed(() => {
  if (!session.value) return ''
  if (session.value.status === 'CONFIRMED') {
    if (isOfflineSession.value) {
      return 'Сесію вже підтверджено спеціалістом. Якщо плани зміняться, завчасно надішліть запит на перенесення або скасуйте запис.'
    }
    return 'Сесію вже підтверджено спеціалістом. Якщо плани зміняться, завчасно надішліть запит на перенесення або скасуйте запис. Для входу в онлайн-зустріч відкрийте блок «Онлайн-зустріч» на цій сторінці та натисніть «Приєднатися».'
  }
  if (session.value.status === 'SCHEDULED') {
    if (isOfflineSession.value) {
      return 'Сесія ще очікує підтвердження спеціаліста. До підтвердження ви можете одразу перенести запис на інший слот або скасувати його.'
    }
    return 'Сесія ще очікує підтвердження спеціаліста. До підтвердження ви можете одразу перенести запис на інший слот або скасувати його. Коли спеціаліст додасть посилання, воно з’явиться в блоці «Онлайн-зустріч» на цій сторінці.'
  }
  if (session.value.status === 'COMPLETED') {
    return 'Сесію завершено. Для наступної зустрічі оберіть новий вільний слот у профілі спеціаліста.'
  }
  if (session.value.status === 'CANCELLED') {
    return 'Сесію скасовано. Якщо потрібна нова зустріч, оберіть інший доступний слот у профілі спеціаліста.'
  }
  return ''
})

const rescheduleGuidance = computed(() => {
  if (!session.value) return ''
  if (session.value.status === 'CONFIRMED') {
    return 'Для підтвердженої сесії перенесення оформлюється як запит до спеціаліста. Поточний час залишиться чинним, доки запит не погодять.'
  }
  if (session.value.status === 'SCHEDULED') {
    return 'Для непідтвердженої сесії перенесення виконується одразу: новий слот бронюється, а поточний запис скасовується автоматично.'
  }
  return 'Перенесення доступне лише для активних сесій зі статусом "Заплановано" або "Підтверджено".'
})

watch(error, (value) => {
  if (!value) return
  toast.error(value)
  error.value = ''
})

const statusMap: Record<string, string> = {
  SCHEDULED: 'Заплановано',
  CONFIRMED: 'Підтверджено',
  COMPLETED: 'Завершено',
  CANCELLED: 'Скасовано',
  NO_SHOW: 'Не відбулося',
  DRAFT: 'Чернетка',
}

const statusLabel = (detail: SessionDetail) => {
  if (isSessionInProgress(detail)) return 'В процесі'
  return statusMap[detail.status] || detail.status
}

const canCancel = (status: string) => status === 'SCHEDULED' || status === 'CONFIRMED'

function suggestionReasonLabel(reasonTag: string) {
  return getSuggestionReasonLabel(reasonTag)
}

function specialistLabel(detail: SessionDetail) {
  const name = detail.specialist_name || detail.specialist_username
  if (name) return name
  return `#${detail.specialist_id}`
}

function onPaymentProofUpdated(nextPaymentProof: SessionPaymentProof) {
  if (!session.value) return
  session.value = {
    ...session.value,
    payment_proof: nextPaymentProof,
  }
}

async function copySpecialistLink() {
  if (!session.value?.specialist_public_slug) return
  const url = `${window.location.origin}/specialist/${session.value.specialist_public_slug}`
  try {
    await navigator.clipboard.writeText(url)
    toast.success('Посилання скопійовано.')
  } catch {
    toast.error('Не вдалося скопіювати посилання.')
  }
}

async function copyMeetingLink() {
  if (!meetingUrl.value) return
  try {
    await navigator.clipboard.writeText(meetingUrl.value)
    toast.success('Посилання на зустріч скопійовано.')
  } catch {
    toast.error('Не вдалося скопіювати посилання на зустріч.')
  }
}

async function requestMeetingLinkFromSpecialist() {
  if (!session.value || !canRequestMeetingLink.value || meetingLinkRequestSending.value) return
  meetingLinkRequestSending.value = true
  error.value = ''
  try {
    const threads = await fetchChatThreads()
    const thread = threads.find((item) => item.therapist_id === session.value?.specialist_id)
    if (!thread) {
      error.value = 'Не вдалося надіслати запит: активний чат зі спеціалістом не знайдено.'
      return
    }
    const dateLabel = formatDateTime(session.value.slot_start_at)
    const message = dateLabel
      ? `Будь ласка, надішліть посилання на онлайн-зустріч для сесії ${dateLabel}.`
      : 'Будь ласка, надішліть посилання на онлайн-зустріч для нашої сесії.'
    await sendChatMessage(thread.id, message)
    meetingLinkRequestSent.value = true
    toast.success('Запит на посилання надіслано спеціалісту.')
  } catch (err: any) {
    error.value = getApiErrorMessage(err, 'Не вдалося надіслати запит на посилання. Спробуйте ще раз.')
  } finally {
    meetingLinkRequestSending.value = false
  }
}

function formatDateTime(value?: string | null) {
  return formatUkDateTimeCompact(value)
}

function formatDuration(start: string | null, end: string | null) {
  if (!start || !end) return ''
  const startDt = new Date(start)
  const endDt = new Date(end)
  if (Number.isNaN(startDt.getTime()) || Number.isNaN(endDt.getTime())) return ''
  const minutes = Math.max(0, Math.round((endDt.getTime() - startDt.getTime()) / 60000))
  if (!minutes) return '\u0422\u0440\u0438\u0432\u0430\u043b\u0456\u0441\u0442\u044c: 0 \u0445\u0432'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const parts = []
  if (hours) parts.push(`${hours} \u0433\u043e\u0434`)
  if (mins) parts.push(`${mins} \u0445\u0432`)
  return `\u0422\u0440\u0438\u0432\u0430\u043b\u0456\u0441\u0442\u044c: ${parts.join(' ')}`
}

function isSessionInProgress(detail: SessionDetail) {
  if (detail.status !== 'CONFIRMED') return false
  if (detail.join_available) return true
  if (!detail.slot_start_at || !detail.slot_end_at) return false
  const start = new Date(detail.slot_start_at).getTime()
  const end = new Date(detail.slot_end_at).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return false
  const now = Date.now()
  return now >= start && now <= end
}

async function loadSession() {
  if (!sessionId.value) return
  loading.value = true
  error.value = ''
  try {
    const resp = await apiGet<SessionDetail>(`/booking/sessions/${sessionId.value}/`)
    session.value = resp
    if (meetingUrl.value) {
      meetingLinkRequestSent.value = false
    }
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.loadSession)
  } finally {
    loading.value = false
  }
}

async function loadSlots() {
  if (!session.value) return
  slotsLoading.value = true
  try {
    const resp = await apiGet<PublicSlot[]>('/booking/slots/', {
      params: { therapist_id: session.value.specialist_id, date_from: new Date().toISOString().slice(0, 10) },
    })
    availableSlots.value = (resp || []).filter((slot) => slot.id)
  } catch {
    availableSlots.value = []
  } finally {
    slotsLoading.value = false
  }
}

async function loadRescheduleSuggestions() {
  if (!session.value) return
  suggestionsLoading.value = true
  try {
    const resp = await apiGet<{ suggestions?: RescheduleSuggestion[] }>(
      `/booking/sessions/${session.value.id}/reschedule-suggestions/`
    )
    rescheduleSuggestions.value = resp?.suggestions || []
  } catch {
    rescheduleSuggestions.value = []
  } finally {
    suggestionsLoading.value = false
  }
}

async function cancelSession() {
  if (!session.value) return
  actionLoading.value = true
  error.value = ''
  try {
    await apiPatch(`/booking/sessions/${session.value.id}/cancel/`)
    await loadSession()
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.cancelSession)
    return
  } finally {
    actionLoading.value = false
  }
  toast.success(BOOKING_SUCCESS_MESSAGES.sessionCancelled)
}

async function rescheduleTo(slotId: number) {
  if (!session.value) return
  actionLoading.value = true
  error.value = ''
  try {
    const payload: BookingSessionCreatePayload = {
      slot_id: slotId,
      session_format: sessionFormat.value,
    }
    await apiPost('/booking/sessions/', payload)
    await apiPatch(`/booking/sessions/${session.value.id}/cancel/`)
    toast.success(BOOKING_SUCCESS_MESSAGES.sessionRescheduled)
    await loadSession()
    router.push('/client')
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.rescheduleSession)
  } finally {
    actionLoading.value = false
  }
}

async function requestReschedule(slotId: number) {
  if (!session.value) return
  actionLoading.value = true
  error.value = ''
  try {
    await apiPost(`/booking/sessions/${session.value.id}/reschedule-request/`, {
      slot_id: slotId,
    })
    toast.success(BOOKING_SUCCESS_MESSAGES.rescheduleRequestSent)
    router.push('/client')
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, BOOKING_ERROR_FALLBACKS.sendRescheduleRequest)
  } finally {
    actionLoading.value = false
  }
}

function selectSuggestedSlot(slotId: number) {
  selectedSuggestionSlotId.value = slotId
}

async function applySelectedSuggestion() {
  if (!session.value || !selectedSuggestionSlotId.value) return
  if (session.value.status === 'CONFIRMED') {
    await requestReschedule(selectedSuggestionSlotId.value)
    return
  }
  await rescheduleTo(selectedSuggestionSlotId.value)
}

onMounted(async () => {
  await loadSession()
  await Promise.all([loadSlots(), loadRescheduleSuggestions()])
})
</script>

<style scoped>
.session-detail {
  display: grid;
  gap: 18px;
}

.detail-hero {
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

.detail-title {
  font-size: 32px;
}

.detail-subtitle {
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

.badge--soft {
  background: rgba(8, 113, 201, 0.12);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.detail-card {
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(7, 47, 71, 0.1);
  background: rgba(7, 47, 71, 0.04);
}

.detail-label {
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.detail-value {
  margin-top: 6px;
  font-weight: 600;
}

.detail-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.meeting-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.meeting-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.meeting-hint {
  margin-top: 4px;
}

.detail-notice {
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(8, 113, 201, 0.18);
  background: rgba(8, 113, 201, 0.08);
  color: var(--text);
}

.detail-notice--soft {
  border-color: rgba(7, 47, 71, 0.1);
  background: rgba(7, 47, 71, 0.04);
}

.detail-notice--meeting {
  border-color: rgba(31, 122, 76, 0.22);
  background: rgba(31, 122, 76, 0.08);
}

.suggestions-block {
  display: grid;
  gap: 8px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid rgba(7, 47, 71, 0.12);
  background: rgba(7, 47, 71, 0.03);
}

.suggestions-title {
  font-weight: 600;
}

.suggestions-list {
  display: grid;
  gap: 8px;
}

.suggestion-btn {
  display: grid;
  gap: 2px;
  text-align: left;
}

.suggestion-btn--active {
  border-color: rgba(8, 113, 201, 0.45);
  background: rgba(8, 113, 201, 0.08);
}

.suggestion-meta {
  font-size: 11px;
}

.slot-list {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.slot-card {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 12px;
  background: rgba(7, 47, 71, 0.04);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.slot-time {
  font-weight: 600;
}

.btn--sm {
  padding: 6px 10px;
  font-size: 13px;
}

@media (max-width: 860px) {
  .detail-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
