<template>
  <section class="client-payments-overview">
    <div class="client-payments-overview__head">
      <div>
        <h3>Історія оплат</h3>
        <p class="muted">
          Оплати та підтвердження за сесіями цієї картки. Змінити статус оплати можна в картці конкретної сесії.
        </p>
      </div>
    </div>

    <p v-if="showNoAccountNote" class="client-payments-overview__note">
      Клієнт не має кабінету, тому не може завантажити підтвердження оплати. Ви можете вести оплату в картці сесії.
    </p>

    <EmptyState
      v-if="!recordId"
      title="Робоча картка клієнта ще не створена"
      description="Оплати зʼявляться після її активації."
    />

    <template v-else>
      <LoadingSkeleton v-if="loading && !overview" variant="list" :count="2" />

      <div v-else-if="error" class="client-payments-overview__error">
        <div>
          <h4>Не вдалося завантажити оплати</h4>
          <p class="muted">{{ error }}</p>
        </div>
        <button class="btn btn--ghost btn--sm" type="button" @click="load(true)">
          Спробувати ще раз
        </button>
      </div>

      <template v-else-if="overview">
        <div class="client-payments-overview__summary" aria-label="Підсумок оплат">
          <div
            v-for="item in summaryItems"
            :key="item.key"
            class="client-payments-overview__counter"
            :class="`client-payments-overview__counter--${item.tone}`"
          >
            <span class="client-payments-overview__counter-label">{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>

        <EmptyState
          v-if="!overview.rows.length"
          title="Ще немає сесій для відображення оплат"
          description="Після створення сесій тут зʼявиться історія їхніх оплат."
        />

        <div v-else class="client-payments-overview__rows">
          <article
            v-for="row in overview.rows"
            :key="row.session_id"
            class="client-payment-row"
          >
            <div class="client-payment-row__main">
              <div class="client-payment-row__time">{{ formatRowDate(row) }}</div>
              <div class="client-payment-row__meta">
                <span v-if="formatRowDuration(row)">{{ formatRowDuration(row) }}</span>
                <span>{{ sessionStatusLabel(row.session_status) }}</span>
                <span>{{ sessionFormatLabel(row.session_format) }}</span>
              </div>
            </div>
            <div class="client-payment-row__payment">
              <span class="client-payment-row__price">{{ formatPrice(row.price_amount, row.price_currency) }}</span>
              <span class="client-payment-status" :class="paymentStateClass(row.payment_state)">
                {{ paymentStateLabel(row.payment_state) }}
              </span>
            </div>
            <RouterLink class="btn btn--ghost btn--sm" :to="sessionRoute(row.session_id)">
              Відкрити сесію
            </RouterLink>
          </article>
        </div>
      </template>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ClientRecordPaymentOverview, ClientRecordPaymentRow, ClientRecordPaymentState } from '../lib/api'
import { fetchClientRecordPayments } from '../lib/api'
import { formatUkDateTimeCompact } from '../lib/dateTime'
import { getApiErrorMessage } from '../lib/errors'
import EmptyState from './EmptyState.vue'
import LoadingSkeleton from './LoadingSkeleton.vue'

const props = defineProps<{
  recordId: number | null
  active: boolean
  showNoAccountNote: boolean
}>()

const loading = ref(false)
const error = ref('')
const overview = ref<ClientRecordPaymentOverview | null>(null)
const loadedRecordId = ref<number | null>(null)
const inFlightRecordId = ref<number | null>(null)
let requestSequence = 0

const summaryItems = computed(() => [
  {
    key: 'not_confirmed',
    label: 'Не підтверджено',
    value: overview.value?.summary.not_confirmed_count ?? 0,
    tone: 'neutral',
  },
  {
    key: 'awaiting_client',
    label: 'Очікуємо від клієнта',
    value: overview.value?.summary.awaiting_client_count ?? 0,
    tone: 'info',
  },
  {
    key: 'awaiting_review',
    label: 'На перевірці',
    value: overview.value?.summary.awaiting_review_count ?? 0,
    tone: 'info',
  },
  {
    key: 'needs_attention',
    label: 'Потребує уваги',
    value: overview.value?.summary.needs_attention_count ?? 0,
    tone: 'warning',
  },
  {
    key: 'paid',
    label: 'Оплачено',
    value: overview.value?.summary.paid_count ?? 0,
    tone: 'success',
  },
])

watch(
  () => [props.active, props.recordId] as const,
  (current, previous) => {
    const [active, recordId] = current
    const previousRecordId = previous?.[1]
    if (recordId !== previousRecordId) {
      requestSequence += 1
      overview.value = null
      error.value = ''
      loadedRecordId.value = null
      inFlightRecordId.value = null
      loading.value = false
    }
    if (active) void load()
  },
  { immediate: true }
)

async function load(force = false) {
  const recordId = props.recordId
  if (!props.active || !recordId) return
  if (inFlightRecordId.value === recordId) return
  if (!force && loadedRecordId.value === recordId && overview.value) return
  const requestId = requestSequence + 1
  requestSequence = requestId
  inFlightRecordId.value = recordId
  loading.value = true
  error.value = ''
  try {
    const result = await fetchClientRecordPayments(recordId)
    if (requestId !== requestSequence || props.recordId !== recordId) return
    overview.value = result
    loadedRecordId.value = recordId
  } catch (err: unknown) {
    if (requestId !== requestSequence || props.recordId !== recordId) return
    error.value = getApiErrorMessage(err, 'Спробуйте ще раз або оновіть сторінку.')
  } finally {
    if (requestId !== requestSequence || props.recordId !== recordId) return
    loading.value = false
    inFlightRecordId.value = null
  }
}

function formatRowDate(row: ClientRecordPaymentRow) {
  return row.starts_at ? formatUkDateTimeCompact(row.starts_at, 'Час не вказано') : 'Час не вказано'
}

function formatRowDuration(row: ClientRecordPaymentRow) {
  if (!row.starts_at || !row.ends_at) return ''
  const start = new Date(row.starts_at)
  const end = new Date(row.ends_at)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return ''
  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000))
  if (!minutes) return ''
  if (minutes < 60) return `${minutes} хв`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} год ${rest} хв` : `${hours} год`
}

const SESSION_STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Завершено',
  CONFIRMED: 'Підтверджено',
  SCHEDULED: 'Заплановано',
  CANCELLED: 'Скасовано',
  NO_SHOW: 'Не відбулося',
}

function sessionStatusLabel(status: string) {
  const normalized = String(status || '').toUpperCase()
  return SESSION_STATUS_LABELS[normalized] || status || 'Статус не вказано'
}

function sessionFormatLabel(value: string | null | undefined) {
  const normalized = String(value || '').toLowerCase()
  if (normalized === 'online') return 'Формат: онлайн'
  if (normalized === 'offline') return 'Формат: офлайн'
  return 'Формат не вказано'
}

function formatPrice(amount: string | null, currency: string | null | undefined) {
  if (amount === null || amount === undefined || String(amount).trim() === '') return 'Без ціни'
  const normalizedAmount = String(amount).trim().replace(/\.00$/, '')
  const normalizedCurrency = String(currency || 'UAH').toUpperCase()
  if (normalizedCurrency === 'UAH') return `${normalizedAmount} грн`
  return `${normalizedAmount} ${normalizedCurrency}`
}

const PAYMENT_STATE_LABELS: Record<ClientRecordPaymentState, string> = {
  NOT_CONFIRMED: 'Не підтверджено',
  AWAITING_CLIENT: 'Очікуємо від клієнта',
  AWAITING_REVIEW: 'На перевірці',
  NEEDS_CLARIFICATION: 'Потрібне уточнення',
  PAID: 'Оплачено',
  NO_PRICE: 'Без ціни',
  CANCELLED: 'Скасовано',
  PAYMENT_DECISION_REQUIRED: 'Потрібне рішення щодо оплати',
  RESOLVED_CANCELLED: 'Рішення щодо оплати зафіксовано',
}

function paymentStateLabel(state: string) {
  return PAYMENT_STATE_LABELS[state as ClientRecordPaymentState] || 'Статус не визначено'
}

function paymentStateClass(state: string) {
  const normalized = String(state || '').toUpperCase()
  if (normalized === 'PAID') return 'client-payment-status--success'
  if (normalized === 'AWAITING_CLIENT' || normalized === 'AWAITING_REVIEW') return 'client-payment-status--info'
  if (normalized === 'NEEDS_CLARIFICATION' || normalized === 'PAYMENT_DECISION_REQUIRED') {
    return 'client-payment-status--warning'
  }
  if (normalized === 'NOT_CONFIRMED') return 'client-payment-status--unpaid'
  return 'client-payment-status--muted'
}

function sessionRoute(sessionId: number) {
  return `/cabinet/sessions/${sessionId}`
}
</script>

<style scoped>
.client-payments-overview {
  display: grid;
  gap: 14px;
}

.client-payments-overview__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.client-payments-overview__head h3,
.client-payments-overview__error h4 {
  margin: 0;
  color: var(--pc-navy-900);
  font-size: 18px;
}

.client-payments-overview__note,
.client-payments-overview__error {
  margin: 0;
  border: 1px solid color-mix(in srgb, var(--pc-info-border) 55%, var(--pc-border));
  border-radius: var(--radius-sm, 10px);
  background: var(--pc-info-soft);
  color: var(--pc-info-text);
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.45;
}

.client-payments-overview__summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  gap: 8px;
}

.client-payments-overview__counter {
  display: grid;
  gap: 4px;
  min-height: 72px;
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-xs, 6px);
  background: #fff;
  padding: 9px 10px;
}

.client-payments-overview__counter-label {
  color: var(--pc-text-muted);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.25;
}

.client-payments-overview__counter strong {
  color: var(--pc-navy-900);
  font-size: 22px;
  line-height: 1;
}

.client-payments-overview__counter--info {
  border-color: color-mix(in srgb, var(--pc-info-border) 64%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-info-soft) 68%, #ffffff);
}

.client-payments-overview__counter--warning {
  border-color: color-mix(in srgb, var(--pc-warning-border) 72%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-warning-soft) 72%, #ffffff);
}

.client-payments-overview__counter--success {
  border-color: color-mix(in srgb, var(--pc-success-border) 64%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-success-soft) 72%, #ffffff);
}

.client-payments-overview__error {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  border-color: color-mix(in srgb, var(--pc-danger-border) 64%, var(--pc-border));
  background: var(--pc-danger-soft);
  color: var(--pc-danger-text);
}

.client-payments-overview__rows {
  display: grid;
  gap: 10px;
}

.client-payment-row {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(180px, 0.85fr) auto;
  gap: 12px;
  align-items: center;
  border: 1px solid color-mix(in srgb, var(--pc-border) 82%, #ffffff);
  border-radius: var(--radius-sm, 10px);
  background: rgba(255, 255, 255, 0.94);
  padding: 12px;
}

.client-payment-row__main,
.client-payment-row__payment {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.client-payment-row__time {
  color: var(--pc-navy-900);
  font-size: 14px;
  font-weight: 800;
}

.client-payment-row__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  color: var(--pc-text-muted);
  font-size: 12px;
}

.client-payment-row__price {
  color: var(--pc-navy-900);
  font-weight: 800;
}

.client-payment-status {
  display: inline-flex;
  width: fit-content;
  max-width: 100%;
  align-items: center;
  border: 1px solid transparent;
  border-radius: var(--radius-xs, 6px);
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
}

.client-payment-status--success {
  border-color: var(--pc-success-border);
  background: var(--pc-success-soft);
  color: var(--pc-success-text);
}

.client-payment-status--info {
  border-color: var(--pc-info-border);
  background: var(--pc-info-soft);
  color: var(--pc-info-text);
}

.client-payment-status--warning {
  border-color: var(--pc-warning-border);
  background: var(--pc-warning-soft);
  color: var(--pc-warning-text);
}

.client-payment-status--unpaid {
  border-color: color-mix(in srgb, var(--pc-border) 82%, #ffffff);
  background: var(--pc-blue-soft);
  color: var(--pc-navy-800);
}

.client-payment-status--muted {
  border-color: color-mix(in srgb, var(--pc-border) 82%, #ffffff);
  background: color-mix(in srgb, var(--pc-bg-main) 72%, #ffffff);
  color: var(--pc-text-muted);
}

@media (max-width: 760px) {
  .client-payments-overview__error,
  .client-payment-row {
    grid-template-columns: 1fr;
  }
}
</style>
