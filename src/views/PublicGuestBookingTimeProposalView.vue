<template>
  <section class="guest-time-proposal">
    <div v-if="loading" class="panel">
      <h1 class="title">Завантажуємо пропозицію часу…</h1>
    </div>

    <div v-else-if="confirmedSession" class="panel guest-time-proposal__panel">
      <h1 class="title">Час підтверджено</h1>
      <p class="muted">
        Сесію створено. Збережіть це посилання або скопіюйте деталі, щоб не загубити інформацію про зустріч.
      </p>
      <div class="guest-time-proposal__details">
        <div><strong>Час:</strong> {{ formatRange(confirmedSession.starts_at, confirmedSession.ends_at) }}</div>
        <div><strong>Формат:</strong> {{ formatSessionFormat(confirmedSession.session_format) }}</div>
        <div v-if="confirmedSession.session_format === 'online' && confirmedSession.meeting_url" class="guest-time-proposal__meeting">
          <strong>Посилання на зустріч:</strong>
          <div class="guest-time-proposal__meeting-actions">
            <a class="btn" :href="confirmedSession.meeting_url" target="_blank" rel="noopener noreferrer">
              Відкрити зустріч
            </a>
            <button class="btn btn--ghost" type="button" @click="copyMeetingUrl">
              Скопіювати посилання
            </button>
          </div>
          <p class="muted guest-time-proposal__meeting-url">{{ confirmedSession.meeting_url }}</p>
          <p v-if="meetingCopyStatus" class="muted">{{ meetingCopyStatus }}</p>
        </div>
        <div v-if="confirmedSession.session_format === 'offline' && confirmedSession.offline_location_snapshot">
          <strong>Місце зустрічі:</strong> {{ confirmedSession.offline_location_snapshot }}
        </div>
      </div>
    </div>

    <div v-else-if="stateTitle" class="panel guest-time-proposal__panel">
      <h1 class="title">{{ stateTitle }}</h1>
      <p class="muted">{{ stateText }}</p>
    </div>

    <div v-else-if="proposal" class="panel guest-time-proposal__panel">
      <h1 class="title">Оберіть зручний час</h1>
      <p class="muted">
        Спеціаліст пропонує інший час для сесії. Оберіть один із доступних варіантів.
      </p>

      <div class="guest-time-proposal__details">
        <div><strong>Спеціаліст:</strong> {{ proposal.specialist_name || 'Спеціаліст' }}</div>
        <div><strong>Формат:</strong> {{ formatSessionFormat(proposal.session_format) }}</div>
        <div v-if="proposal.expires_at"><strong>Посилання дійсне до:</strong> {{ formatDateTime(proposal.expires_at) }}</div>
      </div>

      <p v-if="proposal.message" class="guest-time-proposal__message">{{ proposal.message }}</p>
      <div v-if="acceptError" class="form-error">{{ acceptError }}</div>

      <div class="guest-time-proposal__options">
        <article
          v-for="option in proposal.options"
          :key="option.id"
          class="guest-time-proposal__option"
        >
          <div>
            <strong>{{ formatRange(option.start_at, option.end_at) }}</strong>
            <p v-if="option.timezone" class="muted">{{ option.timezone }}</p>
          </div>
          <button
            class="btn"
            type="button"
            :disabled="accepting || !proposal.can_accept"
            @click="acceptOption(option.id)"
          >
            {{ acceptingOptionId === option.id ? 'Підтверджуємо…' : 'Обрати цей час' }}
          </button>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  acceptPublicGuestBookingTimeProposal,
  getApiErrorMessage,
  getPublicGuestBookingTimeProposal,
  type AcceptPublicGuestBookingTimeProposalResponse,
  type PublicGuestBookingAcceptedSession,
  type PublicGuestBookingTimeProposal,
} from '../lib/api'
import { formatUkDateTimeCompact, formatUkTime } from '../lib/dateTime'

type PublicState = 'accepted' | 'expired' | 'cancelled' | 'closed' | 'invalid' | null

const route = useRoute()
const token = computed(() => String(route.params.token || '').trim())
const loading = ref(false)
const proposal = ref<PublicGuestBookingTimeProposal | null>(null)
const state = ref<PublicState>(null)
const acceptError = ref('')
const accepting = ref(false)
const acceptingOptionId = ref<number | null>(null)
const successSession = ref<AcceptPublicGuestBookingTimeProposalResponse['session'] | null>(null)
const meetingCopyStatus = ref('')

const confirmedSession = computed<PublicGuestBookingAcceptedSession | null>(
  () => successSession.value || proposal.value?.accepted_session || null
)

const stateTitle = computed(() => {
  if (state.value === 'accepted') return 'Час уже підтверджено'
  if (state.value === 'expired') return 'Посилання більше неактивне'
  if (state.value === 'cancelled') return 'Пропозицію скасовано'
  if (state.value === 'closed') return 'Запит уже закрито'
  if (state.value === 'invalid') return 'Неможливо відкрити пропозицію'
  return ''
})

const stateText = computed(() => {
  if (state.value === 'accepted') {
    return 'Цю пропозицію вже прийнято. Якщо потрібні деталі сесії, зв’яжіться зі спеціалістом.'
  }
  if (state.value === 'expired') {
    return 'Термін дії цієї пропозиції минув. Зв’яжіться зі спеціалістом, щоб отримати нові варіанти часу.'
  }
  if (state.value === 'cancelled') return 'Ця пропозиція часу більше неактивна.'
  if (state.value === 'closed') return 'Цей запит уже було вирішено або закрито.'
  if (state.value === 'invalid') return 'Перевірте посилання або попросіть спеціаліста надіслати нове.'
  return ''
})

function formatDateTime(value: string | null | undefined) {
  return formatUkDateTimeCompact(value)
}

function formatRange(start: string | null | undefined, end: string | null | undefined) {
  const endTime = formatUkTime(end, '')
  return endTime ? `${formatDateTime(start)}–${endTime}` : formatDateTime(start)
}

function formatSessionFormat(value: string | null | undefined) {
  return String(value || '').toLowerCase() === 'offline' ? 'Офлайн' : 'Онлайн'
}

function publicStateForStatus(status: string | null | undefined): PublicState {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'accepted') return 'accepted'
  if (normalized === 'expired') return 'expired'
  if (normalized === 'cancelled') return 'cancelled'
  if (normalized === 'closed') return 'closed'
  return null
}

async function loadProposal() {
  if (!token.value) {
    state.value = 'invalid'
    proposal.value = null
    return
  }
  loading.value = true
  acceptError.value = ''
  meetingCopyStatus.value = ''
  successSession.value = null
  try {
    const payload = await getPublicGuestBookingTimeProposal(token.value)
    proposal.value = payload.proposal
    state.value = publicStateForStatus(payload.proposal.public_status)
  } catch {
    proposal.value = null
    state.value = 'invalid'
  } finally {
    loading.value = false
  }
}

function acceptErrorMessage(err: unknown) {
  const data = (err as { response?: { data?: { code?: unknown } } })?.response?.data
  const code = typeof data?.code === 'string' ? data.code : ''
  if (code === 'PROPOSED_SLOT_UNAVAILABLE') {
    return 'Цей час уже недоступний. Оновіть сторінку або зв’яжіться зі спеціалістом.'
  }
  if (code === 'TIME_PROPOSAL_EXPIRED') {
    state.value = 'expired'
    return ''
  }
  if (code === 'TIME_PROPOSAL_NOT_ACTIVE') {
    state.value = 'cancelled'
    return ''
  }
  if (code === 'PUBLIC_GUEST_REQUEST_NOT_PENDING') {
    state.value = 'closed'
    return ''
  }
  return getApiErrorMessage(err, 'Не вдалося підтвердити цей час. Спробуйте ще раз або зв’яжіться зі спеціалістом.')
}

async function acceptOption(optionId: number) {
  if (!proposal.value?.can_accept || accepting.value) return
  accepting.value = true
  acceptingOptionId.value = optionId
  acceptError.value = ''
  try {
    const payload = await acceptPublicGuestBookingTimeProposal(token.value, optionId)
    proposal.value = payload.proposal
    successSession.value = payload.session
    meetingCopyStatus.value = ''
    state.value = null
  } catch (err) {
    const message = acceptErrorMessage(err)
    acceptError.value = message
    if (message.includes('недоступний')) {
      await loadProposal()
      acceptError.value = message
    }
  } finally {
    accepting.value = false
    acceptingOptionId.value = null
  }
}

async function copyMeetingUrl() {
  const url = confirmedSession.value?.meeting_url || ''
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
    meetingCopyStatus.value = 'Посилання скопійовано.'
  } catch {
    meetingCopyStatus.value = 'Не вдалося скопіювати посилання. Виділіть і скопіюйте його вручну.'
  }
}

watch(token, () => void loadProposal(), { immediate: true })
</script>

<style scoped>
.guest-time-proposal {
  display: grid;
  gap: 18px;
  max-width: 760px;
  margin: 0 auto;
  padding: 24px;
}

.guest-time-proposal__panel {
  display: grid;
  gap: 16px;
}

.guest-time-proposal__details {
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
  background: color-mix(in srgb, var(--pc-blue-soft) 58%, #ffffff);
}

.guest-time-proposal__message {
  margin: 0;
  color: var(--pc-navy-900);
  line-height: 1.55;
}

.guest-time-proposal__meeting {
  display: grid;
  gap: 8px;
}

.guest-time-proposal__meeting-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.guest-time-proposal__meeting-url {
  overflow-wrap: anywhere;
}

.guest-time-proposal__options {
  display: grid;
  gap: 10px;
}

.guest-time-proposal__option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-card);
  background: #fff;
}

@media (max-width: 640px) {
  .guest-time-proposal {
    padding: 16px;
  }

  .guest-time-proposal__option {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
