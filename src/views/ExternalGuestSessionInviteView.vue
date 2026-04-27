<template>
  <section class="guest-external-session">
    <div v-if="loading" class="panel">
      <h1 class="title">Доступ до гостьової сесії</h1>
      <p class="muted">Завантажуємо запрошення…</p>
    </div>

    <div v-else-if="errorState" class="panel">
      <h1 class="title">Доступ до гостьової сесії</h1>
      <p class="muted">{{ errorTitle }}</p>
      <p class="muted">{{ errorDescription }}</p>
    </div>

    <div v-else-if="invite" class="panel">
      <h1 class="title">Доступ до гостьової сесії</h1>
      <p class="muted">
        {{ inviteIntroText }}
      </p>

      <div class="details">
        <div><strong>Спеціаліст:</strong> {{ invite.specialist_name || '—' }}</div>
        <div><strong>Початок:</strong> {{ formatDateTime(invite.starts_at) }}</div>
        <div v-if="invite.ends_at"><strong>Завершення:</strong> {{ formatDateTime(invite.ends_at) }}</div>
        <div><strong>Формат:</strong> {{ isOffline ? 'Офлайн' : 'Онлайн' }}</div>
        <div v-if="isOffline"><strong>Локація:</strong> {{ invite.offline_location || 'Уточніть у спеціаліста' }}</div>
      </div>

      <section v-if="shouldShowPaymentBlock" class="guest-payment-card">
        <div class="guest-payment-card__header">
          <div>
            <div class="detail-label">Оплата</div>
            <h2 class="guest-payment-card__title">Оплата гостьової сесії</h2>
          </div>
          <span class="payment-status">{{ paymentStatusLabel }}</span>
        </div>

        <p v-if="paymentAmountLabel" class="guest-payment-card__amount">
          {{ paymentAmountLabel }}
        </p>

        <p v-if="payment?.payment_state === 'paid'" class="muted">
          Оплату вже підтверджено спеціалістом.
        </p>

        <template v-else-if="shouldShowPaymentDetails">
          <p class="muted">
            Спеціаліст надіслав реквізити для оплати. Оберіть зручний спосіб і скопіюйте потрібні дані.
          </p>

          <div v-if="paymentMethods.length > 1" class="payment-method-tabs">
            <button
              v-for="item in paymentMethods"
              :key="item.type"
              class="payment-method-tab"
              :class="{ 'payment-method-tab--active': selectedPaymentMethodType === item.type }"
              type="button"
              @click="selectedPaymentMethodType = item.type"
            >
              {{ item.label }}
            </button>
          </div>

          <div v-if="selectedPaymentMethod" class="payment-method-details">
            <div v-if="selectedPaymentMethod.method.recipient_name" class="payment-field">
              <span>Отримувач</span>
              <strong>{{ selectedPaymentMethod.method.recipient_name }}</strong>
            </div>

            <div v-if="selectedPaymentMethod.method.iban" class="payment-copy-row">
              <div class="payment-field">
                <span>IBAN</span>
                <strong>{{ selectedPaymentMethod.method.iban }}</strong>
              </div>
              <button
                class="btn btn--ghost btn--sm"
                type="button"
                @click="copyPaymentText(selectedPaymentMethod.method.iban, 'IBAN')"
              >
                Скопіювати
              </button>
            </div>

            <div v-if="selectedPaymentMethod.method.card_number" class="payment-copy-row">
              <div class="payment-field">
                <span>Номер картки</span>
                <strong>{{ selectedPaymentMethod.method.card_number }}</strong>
              </div>
              <button
                class="btn btn--ghost btn--sm"
                type="button"
                @click="copyPaymentText(selectedPaymentMethod.method.card_number, 'Номер картки')"
              >
                Скопіювати
              </button>
            </div>

            <div v-if="selectedPaymentMethod.method.bank_name" class="payment-field">
              <span>Банк</span>
              <strong>{{ selectedPaymentMethod.method.bank_name }}</strong>
            </div>

            <div v-if="selectedPaymentMethod.method.payment_purpose" class="payment-copy-row">
              <div class="payment-field">
                <span>Призначення платежу</span>
                <strong>{{ selectedPaymentMethod.method.payment_purpose }}</strong>
              </div>
              <button
                class="btn btn--ghost btn--sm"
                type="button"
                @click="copyPaymentText(selectedPaymentMethod.method.payment_purpose, 'Призначення платежу')"
              >
                Скопіювати
              </button>
            </div>

            <p v-if="selectedPaymentMethod.method.comment" class="muted">
              {{ selectedPaymentMethod.method.comment }}
            </p>
          </div>
        </template>

        <p v-else class="muted">
          Оплату запрошено, але реквізити недоступні. Уточніть деталі у спеціаліста.
        </p>
      </section>

      <div v-if="joinError" class="form-error">{{ joinError }}</div>

      <div class="actions">
        <button v-if="!isOffline" class="btn" type="button" :disabled="joinPending || !invite.can_join" @click="joinInvite">
          {{ joinPending ? 'Підключаємо…' : 'Приєднатися до сесії' }}
        </button>
        <button v-else class="btn" type="button" :disabled="joinPending || !invite.can_join" @click="joinInvite">
          {{ joinPending ? 'Оновлюємо…' : 'Переглянути деталі зустрічі' }}
        </button>
        <RouterLink
          v-if="specialistProfilePath"
          class="btn btn--ghost"
          :to="specialistProfilePath"
        >
          Профіль спеціаліста
        </RouterLink>
        <a
          v-else-if="specialistProfileUrl"
          class="btn btn--ghost"
          :href="specialistProfileUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          Профіль спеціаліста
        </a>
      </div>

      <p v-if="isOffline" class="muted">
        Це офлайн-зустріч. Приходьте у погоджений час за вказаною локацією.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from '../composables/useToast'
import {
  fetchPublicExternalSessionInvite,
  getApiErrorMessage,
  joinPublicExternalSessionInvite,
  type PublicExternalSessionInviteResolved,
} from '../lib/api'
import { formatUkDateTimeCompact } from '../lib/dateTime'

type GuestErrorState = 'invalid' | 'expired' | 'revoked' | 'unavailable' | 'generic' | null

const route = useRoute()
const toast = useToast()
const token = computed(() => String(route.params.token || '').trim())

const loading = ref(false)
const joinPending = ref(false)
const joinError = ref('')
const invite = ref<PublicExternalSessionInviteResolved | null>(null)
const errorState = ref<GuestErrorState>(null)
const selectedPaymentMethodType = ref('')

const isOffline = computed(() => invite.value?.session_format === 'offline')
const specialistProfilePath = computed(() => String(invite.value?.specialist_profile_path || '').trim())
const specialistProfileUrl = computed(() => String(invite.value?.specialist_profile_url || '').trim())
const payment = computed(() => invite.value?.payment || null)
const paymentDetails = computed(() => payment.value?.payment_details_snapshot || null)

const shouldShowPaymentBlock = computed(() => Boolean(payment.value?.payment_requested))

const paymentStatusLabel = computed(() => {
  const state = String(payment.value?.payment_state || '').toLowerCase()
  if (state === 'paid') return 'Оплачено'
  if (state === 'requested') return 'Очікує оплати'
  if (state === 'awaiting_confirmation') return 'Очікує підтвердження'
  return 'Не оплачено'
})

const paymentAmountLabel = computed(() => {
  const amount = payment.value?.payment_amount
  if (!amount) return ''
  const currency = String(payment.value?.payment_currency || 'UAH').toUpperCase()
  const numericAmount = Number(amount)
  const formattedAmount = Number.isFinite(numericAmount)
    ? new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 }).format(numericAmount)
    : amount
  return `${formattedAmount} ${currency === 'UAH' ? 'грн' : currency}`
})

const paymentMethods = computed(() => {
  const details = paymentDetails.value
  if (!details?.is_available || !details.methods) return []

  return Object.entries(details.methods)
    .filter(([, method]) => {
      return Boolean(
        method?.recipient_name ||
          method?.iban ||
          method?.card_number ||
          method?.bank_name ||
          method?.payment_purpose ||
          method?.comment
      )
    })
    .map(([type, method]) => ({
      type,
      label: paymentMethodLabel(type),
      method,
    }))
})

const selectedPaymentMethod = computed(() => {
  return paymentMethods.value.find((item) => item.type === selectedPaymentMethodType.value) || paymentMethods.value[0] || null
})

const shouldShowPaymentDetails = computed(() => {
  return shouldShowPaymentBlock.value && payment.value?.payment_state !== 'paid' && paymentMethods.value.length > 0
})
const defaultGuestIntroText =
  'Ваш спеціаліст запросив вас на сесію. Це обмежене посилання лише для цієї зустрічі без реєстрації.'
const inviteIntroText = computed(() => localizeGuestInstruction(invite.value?.instructions))

const errorTitle = computed(() => {
  if (errorState.value === 'invalid') return 'Лінк недійсний'
  if (errorState.value === 'expired') return 'Термін дії лінка завершився'
  if (errorState.value === 'revoked') return 'Лінк відкликано'
  if (errorState.value === 'unavailable') return 'Сесія недоступна'
  return 'Неможливо відкрити запрошення'
})

const errorDescription = computed(() => {
  if (errorState.value === 'invalid') return 'Перевірте посилання або попросіть спеціаліста надіслати нове.'
  if (errorState.value === 'expired') return 'Попросіть спеціаліста створити нове гостьове посилання для цієї сесії.'
  if (errorState.value === 'revoked') return 'Спеціаліст відкликав це гостьове посилання.'
  if (errorState.value === 'unavailable') return 'Ця сесія зараз недоступна за цим запрошенням.'
  return 'Спробуйте відкрити лінк трохи пізніше.'
})

function paymentMethodLabel(type: string) {
  if (type === 'bank_account') return 'IBAN'
  if (type === 'card') return 'Картка'
  return type
}

async function copyPaymentText(value: string | null | undefined, label = 'Дані') {
  const normalized = String(value || '').trim()
  if (!normalized) return

  try {
    await navigator.clipboard.writeText(normalized)
    toast.success(`${label} скопійовано.`)
  } catch {
    toast.error('Не вдалося скопіювати.')
  }
}

function syncSelectedPaymentMethod() {
  const details = paymentDetails.value
  const defaultMethod = String(details?.default_method_type || '').trim()
  const availableDefault = paymentMethods.value.some((item) => item.type === defaultMethod)

  if (availableDefault) {
    selectedPaymentMethodType.value = defaultMethod
    return
  }

  selectedPaymentMethodType.value = paymentMethods.value[0]?.type || ''
}

function formatDateTime(value: string | null | undefined) {
  return formatUkDateTimeCompact(value)
}

function classifyError(err: unknown): GuestErrorState {
  const status = (err as { response?: { status?: number } })?.response?.status
  const data = (err as { response?: { data?: { code?: string; reason_code?: string; detail?: string } } })?.response?.data
  const code = String(data?.code || data?.reason_code || '').toUpperCase()
  const detail = String(data?.detail || '').toUpperCase()

  if (status === 404 || code === 'EXTERNAL_GUEST_INVITE_INVALID') return 'invalid'
  if (code === 'EXTERNAL_GUEST_INVITE_EXPIRED' || status === 410 || detail.includes('EXPIRED')) return 'expired'
  if (code === 'EXTERNAL_GUEST_INVITE_REVOKED' || detail.includes('REVOKED')) return 'revoked'
  if (code === 'EXTERNAL_SESSION_UNAVAILABLE' || detail.includes('UNAVAILABLE')) return 'unavailable'
  return 'generic'
}

function classifyResolvedStatus(statusRaw: string | null | undefined): GuestErrorState {
  const status = String(statusRaw || '').toUpperCase()
  if (status.includes('REVOKED')) return 'revoked'
  if (status.includes('EXPIRED')) return 'expired'
  if (status.includes('UNAVAILABLE')) return 'unavailable'
  return null
}

function localizeGuestInstruction(value: string | null | undefined) {
  const trimmed = String(value || '').trim()
  if (!trimmed) return defaultGuestIntroText
  if (trimmed === 'Your specialist invited you to an external session.') {
    return defaultGuestIntroText
  }
  return trimmed
}

function normalizeResolvedInvite(
  payload: PublicExternalSessionInviteResolved | { guest_session?: PublicExternalSessionInviteResolved | null } | null
): PublicExternalSessionInviteResolved | null {
  if (!payload || typeof payload !== 'object') return null
  if ('guest_session' in payload) return payload.guest_session || null
  return payload as PublicExternalSessionInviteResolved
}

function resolveJoinMeetingUrl(payload: unknown) {
  const source = payload as
    | { meeting_url?: string | null; join?: { meeting_url?: string | null } | null }
    | null
    | undefined
  const nested = source?.join?.meeting_url
  if (typeof nested === 'string' && nested.trim()) return nested
  const topLevel = source?.meeting_url
  if (typeof topLevel === 'string' && topLevel.trim()) return topLevel
  return ''
}

async function loadInvite() {
  if (!token.value) {
    invite.value = null
    errorState.value = 'invalid'
    return
  }

  loading.value = true
  joinError.value = ''

  try {
    const payload = await fetchPublicExternalSessionInvite(token.value)
    const normalized = normalizeResolvedInvite(payload as any)
    if (!normalized) {
      invite.value = null
      errorState.value = 'invalid'
      return
    }
    const resolvedError = classifyResolvedStatus(normalized.status)
    if (resolvedError) {
      invite.value = null
      errorState.value = resolvedError
      return
    }

    invite.value = normalized
    errorState.value = null
  } catch (err) {
    invite.value = null
    errorState.value = classifyError(err)
  } finally {
    loading.value = false
  }
}

async function joinInvite() {
  if (!token.value || !invite.value) return
  joinPending.value = true
  joinError.value = ''
  try {
    const payload = await joinPublicExternalSessionInvite(token.value)
    if (invite.value.session_format === 'online') {
      const meetingUrl = resolveJoinMeetingUrl(payload)
      if (!meetingUrl) {
        joinError.value = 'Не вдалося отримати посилання на онлайн-зустріч.'
        return
      }
      window.open(meetingUrl, '_blank', 'noopener,noreferrer')
      return
    }
  } catch (err) {
    joinError.value = getApiErrorMessage(err, 'Не вдалося виконати приєднання до сесії.')
  } finally {
    joinPending.value = false
  }
}

watch(
  paymentMethods,
  () => {
    syncSelectedPaymentMethod()
  },
  { immediate: true }
)

watch(
  token,
  () => {
    void loadInvite()
  },
  { immediate: true }
)
</script>

<style scoped>
.guest-external-session {
  width: min(760px, 92vw);
  margin: 48px auto;
}

.panel {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 20px;
  background: #fff;
  display: grid;
  gap: 12px;
}

.title {
  margin: 0;
  font-size: 30px;
}

.details {
  display: grid;
  gap: 8px;
  padding: 10px 0 4px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.detail-label {
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
}

.guest-payment-card {
  display: grid;
  gap: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 14px;
  background: #f8fafc;
}

.guest-payment-card__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.guest-payment-card__title {
  margin: 2px 0 0;
  font-size: 20px;
}

.guest-payment-card__amount {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
}

.payment-status {
  width: fit-content;
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  background: rgba(217, 164, 65, 0.18);
  color: #8a5b08;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.payment-method-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.payment-method-tab {
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  background: #fff;
  cursor: pointer;
  font-weight: 700;
}

.payment-method-tab--active {
  border-color: rgba(8, 113, 201, 0.45);
  background: rgba(8, 113, 201, 0.1);
  color: #0b5cad;
}

.payment-method-details {
  display: grid;
  gap: 10px;
}

.payment-field {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.payment-field span {
  color: var(--muted);
  font-size: 13px;
}

.payment-field strong {
  overflow-wrap: anywhere;
}

.payment-copy-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

@media (max-width: 640px) {
  .guest-payment-card__header,
  .payment-copy-row {
    flex-direction: column;
    align-items: flex-start;
  }
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: var(--radius-sm);
  padding: 8px 10px;
}
</style>
