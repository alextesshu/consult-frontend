<template>
  <section class="payment-proof">
    <div class="payment-proof__header">
      <div>
        <div class="detail-label">Оплата</div>
        <h3 class="payment-proof__title">Підтвердження оплати</h3>
      </div>
      <div class="status-pill" :class="statusPillClass">
        {{ statusLabel }}
      </div>
    </div>

    <p class="payment-proof__helper muted">{{ helperCopy }}</p>

    <section v-if="paymentInstructions" class="payment-instructions">
      <h4 class="payment-instructions__title">Платіжні реквізити</h4>

      <div class="payment-instructions__grid">
        <div class="payment-instructions__row">
          <span class="muted">Спосіб оплати</span>
          <strong>{{ paymentMethodLabel }}</strong>
        </div>
        <div v-if="snapshotCreatedAtLabel" class="payment-instructions__row">
          <span class="muted">Реквізити зафіксовано</span>
          <span>{{ snapshotCreatedAtLabel }}</span>
        </div>
        <div class="payment-instructions__row">
          <span class="muted">Отримувач</span>
          <strong>{{ paymentInstructions.recipientName }}</strong>
        </div>
        <div class="payment-instructions__row">
          <span class="muted">{{ mainValueLabel }}</span>
          <strong>{{ mainValue }}</strong>
        </div>
        <div v-if="paymentInstructions.bankName" class="payment-instructions__row">
          <span class="muted">Банк</span>
          <span>{{ paymentInstructions.bankName }}</span>
        </div>
        <div v-if="paymentInstructions.paymentPurpose" class="payment-instructions__row">
          <span class="muted">Призначення платежу</span>
          <span>{{ paymentInstructions.paymentPurpose }}</span>
        </div>
        <div v-if="paymentInstructions.comment" class="payment-instructions__row">
          <span class="muted">Коментар</span>
          <span>{{ paymentInstructions.comment }}</span>
        </div>
      </div>

      <div class="payment-proof__actions">
        <button class="btn btn--ghost btn--sm" type="button" @click="copyMainValue">
          {{ copyMainLabel }}
        </button>
        <button
          v-if="paymentInstructions.paymentPurpose"
          class="btn btn--ghost btn--sm"
          type="button"
          @click="copyPaymentPurpose"
        >
          Скопіювати призначення
        </button>
        <button class="btn btn--ghost btn--sm" type="button" @click="copyAllInstructions">
          Скопіювати всі реквізити
        </button>
      </div>
    </section>

    <div v-if="proof.image_url" class="payment-proof__preview">
      <a :href="proof.image_url" target="_blank" rel="noopener noreferrer">
        <img class="payment-proof__image" :src="proof.image_url" alt="Підтвердження оплати" />
      </a>
      <a class="btn btn--ghost btn--sm" :href="proof.image_url" target="_blank" rel="noopener noreferrer">
        Переглянути підтвердження
      </a>
    </div>

    <div class="payment-proof__actions">
      <button
        v-if="isSpecialist && proof.specialist_can_request_proof_now"
        class="btn btn--ghost btn--sm"
        type="button"
        :disabled="isBusy"
        @click="onRequestProof"
      >
        {{ isBusy ? 'Оновлення...' : 'Запросити оплату' }}
      </button>

      <button
        v-if="isSpecialist && proof.specialist_can_mark_paid_now"
        class="btn btn--sm"
        type="button"
        :disabled="isBusy"
        @click="onMarkPaid"
      >
        {{ isBusy ? 'Оновлення...' : 'Позначити як оплачено' }}
      </button>

      <button
        v-if="isSpecialist && proof.specialist_can_request_clarification_now"
        class="btn btn--ghost btn--sm"
        type="button"
        :disabled="isBusy"
        @click="onRequestClarification"
      >
        {{ isBusy ? 'Оновлення...' : 'Потрібне уточнення' }}
      </button>

      <button
        v-if="isClient && proof.client_can_upload_now"
        class="btn btn--sm"
        type="button"
        :disabled="isBusy"
        @click="triggerUpload"
      >
        {{ uploadButtonLabel }}
      </button>

      <input
        ref="fileInputRef"
        class="is-hidden"
        type="file"
        accept="image/*"
        aria-label="Upload payment proof image"
        @change="onFileSelected"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatUkDateTimeCompact } from '../lib/dateTime'
import {
  fetchSessionPaymentProof,
  markSessionPaymentProofPaid,
  requestSessionPaymentProof,
  requestSessionPaymentProofClarification,
  uploadSessionPaymentProof,
  type SessionPaymentInstructions,
  type SessionPaymentProof,
} from '../lib/api'
import { useToast } from '../composables/useToast'

type NormalizedPaymentInstructions = {
  methodType: 'bank_account' | 'card'
  snapshotCreatedAt: string
  recipientName: string
  iban: string
  cardNumber: string
  bankName: string
  paymentPurpose: string
  comment: string
}

const props = defineProps<{
  sessionId: number
  role: 'specialist' | 'client'
  paymentProof: SessionPaymentProof | null | undefined
}>()

const emit = defineEmits<{
  (e: 'updated', value: SessionPaymentProof): void
  (e: 'payment-details-missing', value: string): void
}>()

const toast = useToast()
const actionLoading = ref(false)
const uploadLoading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const isSpecialist = computed(() => props.role === 'specialist')
const isClient = computed(() => props.role === 'client')
const isBusy = computed(() => actionLoading.value || uploadLoading.value)

const fallbackProof: SessionPaymentProof = {
  status: 'NOT_REQUESTED',
  image_url: null,
  requested_by_specialist_at: null,
  submitted_by_client_at: null,
  reviewed_by_specialist_at: null,
  marked_paid_at: null,
  clarification_requested_at: null,
  specialist_note: '',
  client_can_upload_now: false,
  specialist_can_mark_paid_now: false,
  specialist_can_request_clarification_now: false,
  specialist_can_request_proof_now: false,
  payment_instructions: null,
}

const proof = computed<SessionPaymentProof>(() => props.paymentProof || fallbackProof)

const specialistStatusMap: Record<string, string> = {
  NOT_REQUESTED: 'Оплату не запитано',
  REQUESTED: 'Очікується підтвердження оплати',
  PROOF_SUBMITTED: 'Підтвердження оплати надіслано',
  MARKED_PAID: 'Оплату позначено як отриману',
  REQUIRES_CLARIFICATION: 'Потрібне уточнення щодо оплати',
}

const clientStatusMap: Record<string, string> = {
  NOT_REQUESTED: 'Спеціаліст ще не запитував підтвердження оплати',
  REQUESTED: 'Спеціаліст запросив підтвердження оплати',
  PROOF_SUBMITTED: 'Підтвердження оплати надіслано',
  MARKED_PAID: 'Оплату позначено як отриману',
  REQUIRES_CLARIFICATION: 'Потрібно уточнити підтвердження оплати',
}

const statusLabel = computed(() => {
  const status = proof.value.status
  return isSpecialist.value ? specialistStatusMap[status] || status : clientStatusMap[status] || status
})

const helperCopy = computed(() =>
  isSpecialist.value
    ? 'Підтвердження оплати надсилається клієнтом і перевіряється вами вручну.'
    : 'Платформа не перевіряє оплату автоматично. Спеціаліст переглядає підтвердження вручну.'
)

const uploadButtonLabel = computed(() => {
  if (uploadLoading.value) return 'Надсилання...'
  if (proof.value.status === 'REQUIRES_CLARIFICATION') return 'Надіслати повторно'
  if (proof.value.image_url) return 'Замінити підтвердження'
  return 'Надіслати підтвердження оплати'
})

const statusPillClass = computed(() => {
  if (proof.value.status === 'MARKED_PAID') return 'status-pill--ok'
  if (proof.value.status === 'REQUIRES_CLARIFICATION') return 'status-pill--warn'
  if (proof.value.status === 'REQUESTED') return 'status-pill--warn'
  return 'status-pill--muted'
})

const paymentInstructions = computed<NormalizedPaymentInstructions | null>(() =>
  normalizePaymentInstructions(proof.value.payment_instructions)
)

const paymentMethodLabel = computed(() =>
  paymentInstructions.value?.methodType === 'card' ? 'Картка' : 'Банківський рахунок (IBAN)'
)
const mainValueLabel = computed(() =>
  paymentInstructions.value?.methodType === 'card' ? 'Номер картки' : 'IBAN'
)
const mainValue = computed(() =>
  paymentInstructions.value?.methodType === 'card'
    ? paymentInstructions.value.cardNumber
    : paymentInstructions.value?.iban || ''
)
const copyMainLabel = computed(() =>
  paymentInstructions.value?.methodType === 'card' ? 'Скопіювати номер картки' : 'Скопіювати IBAN'
)
const snapshotCreatedAtLabel = computed(() =>
  paymentInstructions.value?.snapshotCreatedAt
    ? formatUkDateTimeCompact(paymentInstructions.value.snapshotCreatedAt, '')
    : ''
)

function getStringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeMethod(raw: unknown): 'bank_account' | 'card' {
  return raw === 'card' ? 'card' : 'bank_account'
}

function normalizePaymentInstructions(payload: SessionPaymentInstructions | null | undefined): NormalizedPaymentInstructions | null {
  if (!payload) return null
  const methodType = normalizeMethod(payload.method_type)
  const recipientName = getStringValue(payload.recipient_name)
  const iban = getStringValue(payload.iban)
  const cardNumber = getStringValue(payload.card_number)
  const bankName = getStringValue(payload.bank_name)
  const paymentPurpose = getStringValue(payload.payment_purpose)
  const comment = getStringValue(payload.comment)
  const snapshotCreatedAt = getStringValue(payload.snapshot_created_at)
  const mainValue = methodType === 'card' ? cardNumber : iban
  if (!recipientName || !mainValue) return null
  return {
    methodType,
    snapshotCreatedAt,
    recipientName,
    iban,
    cardNumber,
    bankName,
    paymentPurpose,
    comment,
  }
}

function getPaymentDetailsMissingMessage(err: unknown): string {
  const response = (err as { response?: { data?: unknown } })?.response?.data
  if (!response || typeof response !== 'object') return ''
  const code = (response as { code?: unknown }).code
  if (code !== 'PAYMENT_DETAILS_MISSING') return ''
  const detail = (response as { detail?: unknown }).detail
  if (typeof detail === 'string' && detail.trim()) return detail
  return 'Запит на підтвердження оплати недоступний. Спочатку додайте реквізити для оплати.'
}

async function copyText(value: string) {
  if (!value) return
  try {
    await navigator.clipboard.writeText(value)
    toast.success('Скопійовано')
  } catch {
    toast.error('Не вдалося скопіювати.')
  }
}

async function copyMainValue() {
  await copyText(mainValue.value)
}

async function copyPaymentPurpose() {
  if (!paymentInstructions.value?.paymentPurpose) return
  await copyText(paymentInstructions.value.paymentPurpose)
}

async function copyAllInstructions() {
  if (!paymentInstructions.value) return
  const lines = [
    `Спосіб оплати: ${paymentMethodLabel.value}`,
    `Отримувач: ${paymentInstructions.value.recipientName}`,
    `${mainValueLabel.value}: ${mainValue.value}`,
  ]
  if (paymentInstructions.value.bankName) lines.push(`Банк: ${paymentInstructions.value.bankName}`)
  if (paymentInstructions.value.paymentPurpose) {
    lines.push(`Призначення платежу: ${paymentInstructions.value.paymentPurpose}`)
  }
  if (paymentInstructions.value.comment) lines.push(`Коментар: ${paymentInstructions.value.comment}`)
  await copyText(lines.join('\n'))
}

async function refreshProofState() {
  const latest = await fetchSessionPaymentProof(props.sessionId)
  emit('updated', latest)
  return latest
}

async function runSpecialistAction(
  action: () => Promise<SessionPaymentProof>,
  successMessage: string,
  fallbackError: string
) {
  actionLoading.value = true
  try {
    await action()
    await refreshProofState()
    toast.success(successMessage)
  } catch (err) {
    const paymentDetailsMissingMessage = getPaymentDetailsMissingMessage(err)
    if (paymentDetailsMissingMessage) {
      emit('payment-details-missing', paymentDetailsMissingMessage)
      return
    }
    toast.error(readPaymentProofError(err, fallbackError))
  } finally {
    actionLoading.value = false
  }
}

async function onRequestProof() {
  await runSpecialistAction(
    () => requestSessionPaymentProof(props.sessionId),
    'Запит на підтвердження оплати надіслано.',
    'Не вдалося запросити підтвердження оплати.'
  )
}

async function onMarkPaid() {
  await runSpecialistAction(
    () => markSessionPaymentProofPaid(props.sessionId),
    'Оплату позначено як отриману.',
    'Не вдалося позначити оплату як отриману.'
  )
}

async function onRequestClarification() {
  await runSpecialistAction(
    () => requestSessionPaymentProofClarification(props.sessionId),
    'Запит на уточнення надіслано.',
    'Не вдалося запросити уточнення щодо оплати.'
  )
}

function triggerUpload() {
  fileInputRef.value?.click()
}

async function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    toast.error('Дозволено завантажувати лише зображення.')
    input.value = ''
    return
  }

  uploadLoading.value = true
  const hadPreviousProof = Boolean(proof.value.image_url)
  try {
    await uploadSessionPaymentProof(props.sessionId, file)
    await refreshProofState()
    toast.success(hadPreviousProof ? 'Підтвердження оплати оновлено.' : 'Підтвердження оплати надіслано.')
  } catch (err) {
    toast.error(readPaymentProofError(err, 'Не вдалося надіслати підтвердження оплати.'))
  } finally {
    uploadLoading.value = false
    input.value = ''
  }
}

function readPaymentProofError(err: unknown, fallback: string): string {
  const response = (err as { response?: { data?: unknown } })?.response?.data
  if (response && typeof response === 'object') {
    const detail = (response as { detail?: unknown }).detail
    if (typeof detail === 'string' && detail.trim()) {
      return detail
    }
  }
  return fallback
}
</script>

<style scoped>
.payment-proof {
  display: grid;
  gap: 10px;
  border: 1px solid rgba(7, 47, 71, 0.14);
  border-radius: var(--radius-md);
  background: rgba(7, 47, 71, 0.03);
  padding: 12px 14px;
}

.payment-proof__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.payment-proof__title {
  margin: 0;
  font-size: 16px;
}

.payment-proof__helper {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
}

.payment-instructions {
  display: grid;
  gap: 8px;
  border: 1px solid rgba(7, 47, 71, 0.12);
  border-radius: var(--radius-sm);
  background: #fff;
  padding: 10px;
}

.payment-instructions__title {
  margin: 0;
  font-size: 14px;
}

.payment-instructions__grid {
  display: grid;
  gap: 6px;
}

.payment-instructions__row {
  display: grid;
  gap: 2px;
}

.payment-proof__preview {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.payment-proof__image {
  width: 88px;
  height: 88px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  object-fit: cover;
  display: block;
}

.payment-proof__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.status-pill {
  width: fit-content;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.status-pill--ok {
  background: rgba(31, 122, 76, 0.18);
  color: #1f7a4c;
}

.status-pill--warn {
  background: rgba(217, 164, 65, 0.18);
  color: #a57011;
}

.status-pill--muted {
  background: rgba(7, 47, 71, 0.08);
  color: #13455e;
}

.detail-label {
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.is-hidden {
  display: none;
}
</style>
