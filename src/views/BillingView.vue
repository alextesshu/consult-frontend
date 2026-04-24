<template>
  <section class="billing">
    <header class="billing__hero">
      <div>
        <div class="badge">Плани</div>
        <h1 class="title billing__title">Доступ та тарифи</h1>
        <p class="muted billing__subtitle">
          Перевірте поточний тариф, фактичний доступ, ліміти та статус заявки на зміну тарифу.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
    </header>
    <SettingsSubnav active="billing" />

    <section class="panel panel--access">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Огляд доступу</div>
          <h2 class="panel__title">{{ accessSummaryTitle }}</h2>
        </div>
        <div class="access-pill" :class="accessPillClass">{{ accessLabel }}</div>
      </div>
      <div class="muted">{{ accessExplanation }}</div>
      <div class="summary-grid">
        <article class="summary-card">
          <div class="summary-card__label">Поточний тариф</div>
          <div class="summary-card__value">{{ basePlanLabel }}</div>
          <div v-if="basePlanDiffers" class="summary-card__hint">
            Це базовий тариф акаунта.
          </div>
        </article>
        <article class="summary-card">
          <div class="summary-card__label">Фактичний доступ</div>
          <div class="summary-card__value">{{ currentPlanLabel }}</div>
          <div v-if="basePlanDiffers" class="summary-card__hint">
            {{ effectiveAccessHint }}
          </div>
        </article>
        <article class="summary-card">
          <div class="summary-card__label">Стан доступу</div>
          <div class="summary-card__value">{{ accessSourceLabel }}</div>
          <div class="summary-card__hint">{{ accessStateHint }}</div>
        </article>
        <article class="summary-card">
          <div class="summary-card__label">Заявка на зміну тарифу</div>
          <div class="summary-card__value">{{ currentRequestStatusLabel }}</div>
          <div v-if="currentRequestHint" class="summary-card__hint">{{ currentRequestHint }}</div>
        </article>
      </div>
      <div v-if="trialDateLines.length" class="access-meta">
        <div v-for="line in trialDateLines" :key="line" class="access-line">{{ line }}</div>
      </div>
      <div v-if="overrideDateLines.length" class="access-meta">
        <div v-for="line in overrideDateLines" :key="line" class="access-line">{{ line }}</div>
      </div>
      <div v-if="normalizedCurrentRequest" class="request-summary">
        <div class="request-summary__title">{{ currentRequestStatusLabel }}</div>
        <div class="request-summary__meta">
          <span>Тариф: {{ planTitle(normalizedCurrentRequest.requested_plan) }}</span>
          <span v-if="normalizedCurrentRequest.created_at">Створено: {{ formatDateTime(normalizedCurrentRequest.created_at) }}</span>
          <span v-if="normalizedCurrentRequest.reviewed_at">Розглянуто: {{ formatDateTime(normalizedCurrentRequest.reviewed_at) }}</span>
        </div>
        <p v-if="normalizedCurrentRequest.public_note" class="muted request-summary__note">
          {{ normalizedCurrentRequest.public_note }}
        </p>
      </div>
      <div class="limits-grid">
        <article class="limit-card">
          <div class="limit-card__label">Активні клієнти</div>
          <div class="limit-card__value">{{ activeClientsUsageLabel }}</div>
        </article>
        <article class="limit-card">
          <div class="limit-card__label">Гостьові сесії</div>
          <div class="limit-card__value">{{ guestSessionsUsageLabel }}</div>
        </article>
      </div>
      <div v-if="featureRows.length" class="feature-list">
        <div v-for="feature in featureRows" :key="feature.code" class="feature-row">
          <span>{{ featureLabel(feature.code) }}</span>
          <strong :class="{ 'feature-row__state--muted': !feature.available }">
            {{ feature.available ? 'Доступно' : feature.reason || `Доступно у тарифі ${planTitle(feature.required_plan)}` }}
          </strong>
        </div>
      </div>
      <div class="request-row">
        <button
          class="btn"
          type="button"
          :disabled="!nextPlan || isRequesting || (nextPlan ? isRequestActionBlocked(nextPlan) : false)"
          @click="startSelfServeUpgrade"
        >
          {{ upgradeButtonLabel }}
        </button>
        <button
          v-if="nextPlan"
          class="btn btn--ghost"
          type="button"
          :disabled="isRequesting || (nextPlan ? isRequestActionBlocked(nextPlan) : false)"
          @click="requestAccess(nextPlan)"
        >
          Подати заявку на індивідуальні умови
        </button>
        <button class="btn btn--ghost" type="button" :disabled="isRefreshing" @click="refreshBillingState">
          {{ isRefreshing ? 'Оновлюємо…' : 'Оновити стан плану' }}
        </button>
        <div v-if="primaryStatus" class="muted">{{ primaryStatus }}</div>
      </div>
    </section>

    <p class="muted billing__shared-value">
      У кожному плані — публічний профіль, яким можна ділитися, гнучкий функціонал запису та бронювання й
      робота без комісії за сесії.
    </p>
    <section class="panel panel--beta">
      <div class="badge badge--soft">Beta-режим</div>
      <p>
        Зараз Pro Consult працює в beta-режимі. Оплата не стягується. Тарифи показані для прозорості майбутньої моделі доступу.
        Перед запуском платних тарифів ми окремо повідомимо умови переходу.
      </p>
    </section>
    <div class="billing__cycle-toggle" role="group" aria-label="Режим оплати">
      <button
        type="button"
        class="billing__cycle-btn"
        :class="{ 'is-active': billingCycle === 'monthly' }"
        @click="billingCycle = 'monthly'"
      >
        Щомісяця
      </button>
      <button
        type="button"
        class="billing__cycle-btn"
        :class="{ 'is-active': billingCycle === 'annual' }"
        @click="billingCycle = 'annual'"
      >
        Щороку
      </button>
    </div>
    <p class="muted billing__cycle-note">
      Режим оплати застосовується до нового апгрейду і не відображає поточний цикл підписки.
    </p>

    <section class="plan-grid">
      <article
        v-for="plan in plans"
        :key="plan.code"
        class="plan-card"
        :class="{
          'plan-card--current': isCurrentPlan(plan.code),
          'plan-card--highlight': plan.code === 'PRO',
        }"
      >
        <div class="plan-head">
          <div>
            <div class="plan-title">{{ plan.title }}</div>
            <div class="plan-subtitle">{{ plan.subtitle }}</div>
          </div>
          <div class="plan-price">
            <div class="plan-price__main">{{ planDisplayPrice(plan.code) }}</div>
            <div class="plan-price__period">{{ billingCycleLabel }}</div>
          </div>
        </div>
        <div class="plan-price__alt">
          <span class="plan-price__hint">{{ planSecondaryPriceHint(plan.code) }}</span>
        </div>
        <div v-if="plan.badge" class="plan-badges">
          <span v-if="plan.badge" class="plan-chip">{{ plan.badge }}</span>
        </div>
        <ul class="plan-list">
          <li v-for="item in planFeatureList(plan.code)" :key="item">{{ item }}</li>
        </ul>
        <div class="plan-foot">
          <div class="plan-action">
            <button
              v-if="isUpgradePlan(plan.code)"
              class="btn"
              type="button"
              :disabled="!canSelfServePlan(plan.code) || isRequesting || isRequestActionBlocked(plan.code)"
              @click="startSelfServeCheckout(plan.code)"
            >
              {{ planActionLabel(plan.code) }}
            </button>
            <button
              v-if="isUpgradePlan(plan.code)"
              class="btn btn--ghost plan-action__secondary"
              type="button"
              :disabled="isRequesting || isRequestActionBlocked(plan.code)"
              @click="requestAccess(plan.code)"
            >
              Індивідуальні умови
            </button>
            <div v-else-if="isCurrentPlan(plan.code)" class="plan-action__state">Поточний план</div>
            <div v-else-if="isBasePlan(plan.code)" class="plan-action__state plan-action__state--base">Базовий тариф</div>
            <div v-else-if="isUnavailableBetaPlan(plan.code)" class="plan-action__state plan-action__state--base">
              Тариф готується
            </div>
            <div v-if="requestMessageFor(plan.code)" class="muted">
              {{ requestMessageFor(plan.code) }}
            </div>
          </div>
        </div>
      </article>
    </section>

    <p v-if="hasDowngradePlans" class="muted billing__downgrade-note">
      Перехід на нижчий план зараз оформлюється через підтримку.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import {
  apiGet,
  createBillingCheckoutSession,
  createBillingAccessRequest,
  fetchBillingAccessRequestState,
  getApiErrorMessage,
  type BillingAccessRequest,
  type BillingAccessRequestState,
} from '../lib/api'
import SettingsSubnav from '../components/SettingsSubnav.vue'

type PlanCode = 'START' | 'PRO' | 'LEADER'
type BillingCycle = 'monthly' | 'annual'
type AccessSource = 'base_plan' | 'trial' | 'override' | 'billing' | string
type BillingSummaryRequest = {
  id: number
  requested_plan: PlanCode
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string
  created_at: string | null
  reviewed_at?: string | null
  decided_at?: string | null
  public_note?: string | null
  admin_note?: string | null
  applied?: boolean | null
  applied_plan?: PlanCode | string | null
}
type BillingFeature = {
  code: string
  available: boolean
  required_plan: PlanCode | string
  reason?: string | null
}
type BillingAccessSummary = {
  plan?: PlanCode | string | null
  base_plan?: PlanCode | string | null
  effective_plan?: PlanCode | string | null
  access_source?: AccessSource | null
  access_label?: string | null
  access_message?: string | null
  trial?: {
    active?: boolean | null
    plan?: PlanCode | string | null
    starts_at?: string | null
    ends_at?: string | null
  } | null
  override?: {
    active?: boolean | null
    plan?: PlanCode | string | null
    expires_at?: string | null
  } | null
  current_request?: BillingSummaryRequest | null
  latest_request?: BillingSummaryRequest | null
  limits?: {
    active_clients?: {
      used?: number | null
      limit?: number | null
    } | null
    guest_sessions?: {
      used?: number | null
      limit?: number | null
    } | null
  } | null
  features?: BillingFeature[] | null
  active_clients?: number | null
  active_client_limit?: number | null
  guest_sessions_used_in_period?: number | null
  guest_sessions_limit_per_period?: number | null
}
const ACTIVATION_POLL_INTERVAL_MS = 5000
const ACTIVATION_MAX_ATTEMPTS = 12

const planOrder: PlanCode[] = ['START', 'PRO', 'LEADER']

const plans = [
  {
    code: 'START',
    title: 'Start',
    subtitle: 'Безкоштовний базовий старт',
    price: '0 грн',
    badge: 'Безкоштовний',
    features: ['Публічний профіль і запис', 'Базовий старт практики'],
  },
  {
    code: 'PRO',
    title: 'Pro',
    subtitle: 'Розширений доступ для регулярної роботи',
    price: '990 грн',
    badge: 'Популярний',
    features: [
      'Усе зі Start',
      'Публікації у профілі',
      'Розширена аналітика',
    ],
  },
  {
    code: 'LEADER',
    title: 'Leader',
    subtitle: 'Максимальний доступ для масштабування',
    price: '2 490 грн',
    badge: 'Недоступно під час beta',
    features: ['У розробці', 'Буде доступно пізніше'],
  },
] as const

const planByCode = new Map(plans.map((plan) => [plan.code, plan]))
const specialistSelectablePlans = new Set<PlanCode>(['PRO'])
const hiddenBetaFeatureCodes = new Set(['pair', 'group_room', 'group_room_broadcast', 'public_events'])
const annualCopyByPlan: Record<PlanCode, string> = {
  START: 'Без оплати',
  PRO: 'Майбутня річна модель: 9 900 грн / рік',
  LEADER: 'Майбутня річна модель: 24 900 грн / рік',
}
const annualMonthlyPriceByPlan: Record<PlanCode, string | null> = {
  START: null,
  PRO: '825 грн',
  LEADER: '2 075 грн',
}
const annualOneShotByPlan: Record<PlanCode, string | null> = {
  START: null,
  PRO: '9 900 грн / рік. 12 місяців користування за ціною 10 місяців.',
  LEADER: '24 900 грн / рік. 12 місяців користування за ціною 10 місяців.',
}
const paymentFallbackMessage =
  'Онлайн-оплата для цього плану зараз недоступна. Ви можете залишити запит на індивідуальні умови.'
const paymentUnavailableMessage =
  'Онлайн-оплата для цього плану зараз недоступна. Спробуйте пізніше або скористайтеся «Індивідуальні умови».'

const auth = useAuthStore()
const { me } = storeToRefs(auth)

const requestingPlan = ref<PlanCode | null>(null)
const isRefreshing = ref(false)
const requestState = ref<BillingAccessRequestState | null>(null)
const accessSummary = ref<BillingAccessSummary | null>(null)
const requestFeedback = ref('')
const requestFeedbackPlan = ref<PlanCode | null>(null)
const checkoutFeedback = ref('')
const checkoutFeedbackPlan = ref<PlanCode | null>(null)
const billingCycle = ref<BillingCycle>('monthly')
const activationPendingPlan = ref<PlanCode | null>(null)
const isActivationPolling = ref(false)
const activationPollAttempts = ref(0)
let activationPollTimer: ReturnType<typeof setTimeout> | null = null

function normalizePlan(raw: unknown): PlanCode | null {
  if (raw === 'START' || raw === 'PRO' || raw === 'LEADER') return raw
  return null
}

const currentPlan = computed<PlanCode | null>(() => {
  return (
    normalizePlan(accessSummary.value?.effective_plan) ||
    normalizePlan(accessSummary.value?.plan) ||
    normalizePlan(me.value?.effective_entitlements?.plan)
  )
})

const basePlan = computed<PlanCode | null>(() => {
  return normalizePlan(accessSummary.value?.base_plan) || currentPlan.value
})

const currentPlanLabel = computed(() => {
  if (!currentPlan.value) return 'Не визначено'
  return planTitle(currentPlan.value)
})

const basePlanLabel = computed(() => {
  if (!basePlan.value) return 'Не визначено'
  return planTitle(basePlan.value)
})

const basePlanDiffers = computed(() => {
  return Boolean(basePlan.value && currentPlan.value && basePlan.value !== currentPlan.value)
})

const currentIndex = computed(() => {
  if (!currentPlan.value) return -1
  return planOrder.indexOf(currentPlan.value)
})

const hasDowngradePlans = computed(() => currentIndex.value > 0)

const nextPlan = computed<PlanCode | null>(() => {
  if (currentIndex.value === -1) return null
  return planOrder.slice(currentIndex.value + 1).find((plan) => isSpecialistSelectablePlan(plan)) || null
})

const summaryCurrentRequest = computed(() => accessSummary.value?.current_request || null)
const summaryLatestRequest = computed(() => accessSummary.value?.latest_request || null)
const hasPendingRequest = computed(() => {
  if (summaryCurrentRequest.value?.status === 'PENDING') return true
  return requestState.value?.has_pending_request ?? false
})
const activeRequest = computed(() => requestState.value?.active_request)
const latestRequest = computed(() => requestState.value?.latest_request)

const normalizedCurrentRequest = computed<BillingSummaryRequest | null>(() => {
  if (summaryCurrentRequest.value) return summaryCurrentRequest.value
  if (summaryLatestRequest.value) return summaryLatestRequest.value
  const fallback = activeRequest.value || latestRequest.value
  if (!fallback) return null
  return {
    id: fallback.id,
    requested_plan: fallback.requested_plan,
    status: fallback.status,
    created_at: fallback.created_at,
    reviewed_at: fallback.decided_at,
    public_note: fallback.admin_note || '',
  }
})

const upgradeButtonLabel = computed(() => {
  if (!nextPlan.value) return 'У вас максимальний план'
  if (hasPendingRequest.value) return 'Заявка очікує розгляду'
  if (hasUnappliedApprovedRequestFor(nextPlan.value)) return 'Очікує активації'
  return `Перейти на ${planTitle(nextPlan.value)}`
})

const isRequesting = computed(() => Boolean(requestingPlan.value))
const requestStatus = computed(() => {
  if (requestFeedback.value) return requestFeedback.value
  return requestMessage(normalizedCurrentRequest.value)
})
const primaryStatus = computed(() => checkoutFeedback.value || requestStatus.value)
const billingCycleLabel = computed(() =>
  billingCycle.value === 'annual' ? 'за місяць у майбутній річній моделі' : 'майбутня модель / міс'
)

const accessLabel = computed(() => {
  if (accessSummary.value?.access_label) return accessSummary.value.access_label
  const state = me.value?.access_state
  if (!state) return 'Невідомо'
  if (state === 'OK') return 'Доступ активний'
  if (state === 'GRACE') return 'Пільговий період'
  if (state === 'RESTRICTED') return 'Обмежений режим'
  if (state === 'SUSPENDED') return 'Призупинено'
  return state
})

const accessSource = computed(() => accessSummary.value?.access_source || 'base_plan')

const accessSourceLabel = computed(() => {
  if (accessSource.value === 'trial') return 'Тестовий доступ'
  if (accessSource.value === 'override') return 'Ручне перевизначення доступу'
  return 'Звичайний доступ за тарифом'
})

const accessSummaryTitle = computed(() => {
  if (basePlanDiffers.value) return `${basePlanLabel.value} → ${currentPlanLabel.value}`
  return currentPlanLabel.value
})

const accessExplanation = computed(() => {
  if (basePlanDiffers.value && accessSource.value === 'trial') {
    return `Ваш базовий тариф — ${basePlanLabel.value}. Зараз активний тестовий доступ ${currentPlanLabel.value}.`
  }
  if (basePlanDiffers.value && accessSource.value === 'override') {
    return `Ваш базовий тариф — ${basePlanLabel.value}. Адміністратор тимчасово надав доступ ${currentPlanLabel.value}.`
  }
  if (accessSummary.value?.access_message) return accessSummary.value.access_message
  return accessHint.value
})

const effectiveAccessHint = computed(() => {
  if (accessSource.value === 'trial') return 'Надано як тестовий доступ.'
  if (accessSource.value === 'override') return 'Тимчасово надано адміністратором.'
  return 'Відповідає поточному тарифу.'
})

const accessStateHint = computed(() => {
  if (accessSource.value === 'trial') return 'Показує тимчасовий тестовий рівень доступу.'
  if (accessSource.value === 'override') return 'Показує тимчасове ручне налаштування доступу.'
  return accessHint.value
})

function formatDateTime(value: string | null | undefined) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const trialDateLines = computed(() => {
  const trial = accessSummary.value?.trial
  if (!trial?.active) return []
  const lines: string[] = []
  if (trial.starts_at) lines.push(`Початок тестового доступу: ${formatDateTime(trial.starts_at)}`)
  if (trial.ends_at) lines.push(`Завершення тестового доступу: ${formatDateTime(trial.ends_at)}`)
  return lines
})

const overrideDateLines = computed(() => {
  const override = accessSummary.value?.override
  if (!override?.active || !override.expires_at) return []
  return [`Ручне налаштування діє до: ${formatDateTime(override.expires_at)}`]
})

const currentRequestStatusLabel = computed(() => {
  const request = normalizedCurrentRequest.value
  if (!request) return 'Немає активної заявки'
  if (request.status === 'PENDING') return 'Заявка очікує розгляду'
  if (request.status === 'APPROVED' && request.applied === false) return 'Заявку схвалено, тариф ще не активовано'
  if (request.status === 'APPROVED') return 'Заявку схвалено'
  if (request.status === 'REJECTED') return 'Заявку відхилено'
  return 'Статус заявки оновлено'
})

const currentRequestHint = computed(() => {
  const request = normalizedCurrentRequest.value
  if (!request) return 'Можна подати заявку на зміну тарифу.'
  const plan = planTitle(request.requested_plan)
  if (request.status === 'PENDING') return `Очікує розгляду для тарифу ${plan}.`
  if (request.status === 'APPROVED' && request.applied === false) {
    return `Заявку на ${plan} схвалено, але тариф ще не активовано. Ми оновимо доступ після завершення ручної активації.`
  }
  if (request.status === 'APPROVED' && request.applied) return `Схвалено й активовано для тарифу ${plan}.`
  if (request.status === 'APPROVED') return `Схвалено для тарифу ${plan}.`
  if (request.status === 'REJECTED') return `Відхилено для тарифу ${plan}. За потреби можна подати нову заявку.`
  return `Тариф: ${plan}.`
})

const accessPillClass = computed(() => {
  const state = me.value?.access_state
  if (state === 'GRACE') return 'access-pill--warn'
  if (state === 'RESTRICTED' || state === 'SUSPENDED') return 'access-pill--danger'
  return 'access-pill--ok'
})

const accessHint = computed(() => {
  const state = me.value?.access_state
  if (state === 'GRACE') return 'Оплата потребує уваги. Доступ тимчасово збережено.'
  if (state === 'RESTRICTED') return 'Доступ лише для читання. Нові 䳿 заблоковані.'
  if (state === 'SUSPENDED') return 'Доступ призупинено адміністрацією.'
  return 'Все працює у штатному режимі.'
})

const activeLimitLabel = computed(() => {
  const limit =
    accessSummary.value?.limits?.active_clients?.limit ??
    accessSummary.value?.active_client_limit ??
    me.value?.effective_entitlements?.active_client_limit
  if (limit === null || limit === undefined) return 'Н/Д'
  return Number.isFinite(limit) ? String(limit) : '∞'
})

const activeClientsUsageLabel = computed(() => {
  const used =
    accessSummary.value?.limits?.active_clients?.used ??
    accessSummary.value?.active_clients ??
    me.value?.counts?.active_clients ??
    0
  return `${used} / ${activeLimitLabel.value}`
})

const guestSessionsUsageLabel = computed(() => {
  const used =
    accessSummary.value?.limits?.guest_sessions?.used ??
    accessSummary.value?.guest_sessions_used_in_period
  const limit =
    accessSummary.value?.limits?.guest_sessions?.limit ??
    accessSummary.value?.guest_sessions_limit_per_period
  if (typeof used !== 'number' || typeof limit !== 'number') return 'Немає даних'
  return `${used} / ${limit}`
})

const featureRows = computed(() => {
  if (!Array.isArray(accessSummary.value?.features)) return []
  return accessSummary.value.features.filter((feature) => !hiddenBetaFeatureCodes.has(feature.code))
})

const featureLabels: Record<string, string> = {
  pair: 'Пари',
  group_room: 'Групові зустрічі',
  group_room_broadcast: 'Трансляції',
  reminders: 'Нагадування',
  author_journal: 'Публікації у профілі',
  public_events: 'Публічні події',
  priority_support: 'Пріоритетна підтримка',
  guest_sessions: 'Гостьові сесії',
}

function featureLabel(code: string) {
  return featureLabels[code] || code
}

function planTitle(code: PlanCode | string | null | undefined) {
  if (!code) return 'Не визначено'
  return planByCode.get(code as PlanCode)?.title || String(code)
}

function clearActivationPolling() {
  if (activationPollTimer) {
    clearTimeout(activationPollTimer)
    activationPollTimer = null
  }
  isActivationPolling.value = false
  activationPollAttempts.value = 0
}

function isPlanReached(target: PlanCode) {
  if (currentIndex.value === -1) return false
  return currentIndex.value >= planOrder.indexOf(target)
}

function planDisplayPrice(code: string) {
  const typedCode = code as PlanCode
  if (billingCycle.value === 'annual' && annualMonthlyPriceByPlan[typedCode]) {
    return annualMonthlyPriceByPlan[typedCode] as string
  }
  return planByCode.get(typedCode)?.price || ''
}

function planSecondaryPriceHint(code: string) {
  const typedCode = code as PlanCode
  if (billingCycle.value === 'annual') {
    return annualOneShotByPlan[typedCode] || 'Без оплати'
  }
  return annualCopyByPlan[typedCode] || ''
}

function planActiveClientLimit(code: PlanCode) {
  if (currentPlan.value === code || basePlan.value === code) {
    const currentLimit = accessSummary.value?.limits?.active_clients?.limit
    if (typeof currentLimit === 'number') return currentLimit
  }
  if (code === 'START') return 3
  if (code === 'PRO') return 20
  if (code === 'LEADER') return 60
  return null
}

function planFeatureList(code: PlanCode) {
  const limit = planActiveClientLimit(code)
  const limitLine = typeof limit === 'number' ? [`До ${limit} активних клієнтів`] : []
  return [...limitLine, ...(planByCode.get(code)?.features || [])]
}

function checkoutCycleForPlan(code: PlanCode): BillingCycle {
  if (billingCycle.value === 'annual' && annualMonthlyPriceByPlan[code]) {
    return 'annual'
  }
  return 'monthly'
}

function isCurrentPlan(code: string) {
  return currentPlan.value === code
}

function isBasePlan(code: string) {
  return basePlanDiffers.value && basePlan.value === code
}

function isUpgradePlan(code: string) {
  if (currentIndex.value === -1) return false
  return isSpecialistSelectablePlan(code) && planOrder.indexOf(code as PlanCode) > currentIndex.value
}

function canSelfServePlan(code: string) {
  return isUpgradePlan(code) && isSpecialistSelectablePlan(code) && !hasUnappliedApprovedRequestFor(code)
}

function planActionLabel(code: string) {
  if (isCurrentPlan(code)) return 'Поточний план'
  if (isUnavailableBetaPlan(code)) return 'Тариф готується'
  if (hasUnappliedApprovedRequestFor(code)) return 'Очікує активації'
  if (isUpgradePlan(code)) return `Перейти на ${planTitle(code as PlanCode)}`
  return 'Недоступно'
}

function isSpecialistSelectablePlan(code: string): code is PlanCode {
  return specialistSelectablePlans.has(code as PlanCode)
}

function isUnavailableBetaPlan(code: string) {
  return code === 'LEADER' && !isCurrentPlan(code) && !isBasePlan(code)
}

function hasUnappliedApprovedRequestFor(code: string) {
  const request = normalizedCurrentRequest.value
  return Boolean(
    request &&
      request.status === 'APPROVED' &&
      request.applied === false &&
      request.requested_plan === code
  )
}

function isRequestActionBlocked(code: string) {
  return hasPendingRequest.value || hasUnappliedApprovedRequestFor(code)
}

function requestMessageFor(code: string) {
  if (activationPendingPlan.value === code) {
    if (isActivationPolling.value) {
      return 'Оновлення доступу в процесі. Перевіряємо стан тарифу.'
    }
    return 'Очікуємо підтвердження зміни. Тариф оновиться автоматично.'
  }
  if (checkoutFeedbackPlan.value === code && checkoutFeedback.value) {
    return checkoutFeedback.value
  }
  if (requestFeedbackPlan.value === code && requestFeedback.value) {
    return requestFeedback.value
  }
  const summary = normalizedCurrentRequest.value
  if (summary?.requested_plan === code) return requestMessage(summary)
  const base = activeRequest.value || latestRequest.value
  if (!base || base.requested_plan !== code) return ''
  return requestMessage(base)
}

function requestMessage(request: BillingSummaryRequest | BillingAccessRequest | null) {
  if (!request) return ''
  const plan = planTitle(request.requested_plan as PlanCode)
  if (request.status === 'PENDING') {
    return `Заявка на перехід на тариф ${plan} очікує розгляду.`
  }
  if (request.status === 'APPROVED') {
    if ('applied' in request && request.applied === false) {
      return `Заявку на ${plan} схвалено, але тариф ще не активовано.`
    }
    return `Заявку на перехід на тариф ${plan} схвалено.`
  }
  if (request.status === 'REJECTED') {
    return `Заявку на перехід на тариф ${plan} відхилено.`
  }
  return ''
}

async function refreshBillingState() {
  if (isRefreshing.value) return
  isRefreshing.value = true
  try {
    await auth.loadMe()
    await Promise.all([loadAccessSummary(), loadRequestState()])
    if (activationPendingPlan.value && isPlanReached(activationPendingPlan.value)) {
      const activatedPlan = activationPendingPlan.value
      clearActivationPolling()
      activationPendingPlan.value = null
      checkoutFeedbackPlan.value = activatedPlan
      checkoutFeedback.value = `План ${planTitle(activatedPlan)} активовано.`
    }
  } finally {
    isRefreshing.value = false
  }
}

async function pollPlanActivation(target: PlanCode) {
  clearActivationPolling()
  activationPendingPlan.value = target
  isActivationPolling.value = true
  activationPollAttempts.value = 0
  checkoutFeedbackPlan.value = target
  checkoutFeedback.value =
    'Оновлення доступу в процесі. Тариф оновиться автоматично після підтвердження.'

  const tick = async () => {
    if (!isActivationPolling.value) return
    activationPollAttempts.value += 1
    try {
      await auth.loadMe()
      if (isPlanReached(target)) {
        clearActivationPolling()
        activationPendingPlan.value = null
        checkoutFeedbackPlan.value = target
        checkoutFeedback.value = `Тариф ${planTitle(target)} активовано.`
        await loadRequestState()
        return
      }
    } catch {
      // Keep calm UX: polling can continue even on transient errors.
    }

    if (activationPollAttempts.value >= ACTIVATION_MAX_ATTEMPTS) {
      clearActivationPolling()
      checkoutFeedbackPlan.value = target
      checkoutFeedback.value =
        'Зміну тарифу обробляємо. Це може тривати кілька хвилин. Натисніть «Оновити стан плану» трохи пізніше.'
      return
    }

    activationPollTimer = setTimeout(tick, ACTIVATION_POLL_INTERVAL_MS)
  }

  activationPollTimer = setTimeout(tick, ACTIVATION_POLL_INTERVAL_MS)
}

async function loadRequestState() {
  try {
    requestState.value = await fetchBillingAccessRequestState()
  } catch {
    // Keep UI usable even if request state fails to load.
    requestState.value = null
  }
}

async function loadAccessSummary() {
  try {
    accessSummary.value = await apiGet<BillingAccessSummary>('/cabinet/entitlements/')
  } catch {
    accessSummary.value = null
  }
}

async function startSelfServeUpgrade() {
  if (!nextPlan.value) return
  await startSelfServeCheckout(nextPlan.value)
}

async function startSelfServeCheckout(planCode: string) {
  if (!planOrder.includes(planCode as PlanCode)) return
  if (!canSelfServePlan(planCode)) return
  if (requestingPlan.value) return
  const target = planCode as PlanCode
  requestingPlan.value = target
  checkoutFeedbackPlan.value = target
  checkoutFeedback.value = ''
  clearActivationPolling()
  activationPendingPlan.value = null
  try {
    const response = await createBillingCheckoutSession({
      plan: target as 'PRO' | 'LEADER',
      billing_cycle: checkoutCycleForPlan(target),
    })
    if (response.checkout_url) {
      const checkoutWindow = window.open(response.checkout_url, '_blank', 'noopener,noreferrer')
      if (!checkoutWindow) {
        checkoutFeedback.value =
          'Не вдалося відкрити сторінку оплати. Дозвольте pop-up або скористайтеся варіантом «Індивідуальні умови».'
        return
      }
      checkoutFeedback.value =
        'Переходимо до оплати. Після підтвердження тариф активується автоматично.'
      await pollPlanActivation(target)
      return
    }
    checkoutFeedback.value = response.fallback_available
      ? paymentFallbackMessage
      : paymentUnavailableMessage
    await refreshBillingState()
  } catch (err: any) {
    checkoutFeedback.value = getApiErrorMessage(
      err,
      'Не вдалося відкрити оплату. Спробуйте ще раз.'
    )
  } finally {
    requestingPlan.value = null
  }
}

async function requestAccess(planCode: string) {
  if (!planOrder.includes(planCode as PlanCode)) return
  if (!isSpecialistSelectablePlan(planCode)) return
  if (requestingPlan.value) return
  if (hasPendingRequest.value) {
    const pendingPlan = activeRequest.value?.requested_plan
    requestFeedbackPlan.value = planOrder.includes(pendingPlan as PlanCode)
      ? (pendingPlan as PlanCode)
      : null
    requestFeedback.value = 'Ви вже маєте активну заявку на цей тариф.'
    return
  }
  const target = planCode as PlanCode
  requestingPlan.value = target
  requestFeedbackPlan.value = target
  requestFeedback.value = ''
  checkoutFeedback.value = ''
  checkoutFeedbackPlan.value = null
  try {
    const note = currentPlan.value ? `upgrade_from:${currentPlan.value}` : undefined
    const result = await createBillingAccessRequest({
      requested_plan: target,
      note,
    })
    requestState.value = {
      has_pending_request: result.has_pending_request,
      active_request: result.request,
      latest_request: result.request,
    }
    accessSummary.value = {
      ...(accessSummary.value || {}),
      current_request: {
        id: result.request.id,
        requested_plan: result.request.requested_plan,
        status: result.request.status,
        created_at: result.request.created_at,
        reviewed_at: result.request.decided_at,
        public_note: result.request.admin_note || '',
      },
    }
    requestFeedback.value = 'Заявку зафіксовано. Команда розгляне її вручну.'
  } catch (err: any) {
    const existingRequest = err?.response?.data?.active_request as
      | BillingAccessRequest
      | undefined
    if (err?.response?.status === 409 && existingRequest) {
      requestState.value = {
        has_pending_request: true,
        active_request: existingRequest,
        latest_request: existingRequest,
      }
      requestFeedback.value = 'Ви вже маєте активну заявку на цей тариф.'
    } else {
      requestFeedback.value = getApiErrorMessage(
        err,
        'Не вдалося надіслати заявку. Спробуйте ще раз.'
      )
    }
  } finally {
    requestingPlan.value = null
  }
}

onMounted(() => {
  refreshBillingState()
})

onBeforeUnmount(() => {
  clearActivationPolling()
})
</script>

<style scoped>
.billing {
  display: grid;
  gap: 18px;
}

.billing__hero {
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

.billing__title {
  font-size: 32px;
}

.billing__subtitle {
  max-width: 520px;
}

.billing__shared-value {
  margin: 0;
}

.billing__cycle-toggle {
  width: fit-content;
  margin: 0 auto;
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 4px;
  background: #fff;
}

.billing__cycle-btn {
  border: 1px solid transparent;
  background: transparent;
  border-radius: var(--radius-xs);
  padding: 6px 14px;
  font-size: 13px;
  color: var(--ink);
  cursor: pointer;
}

.billing__cycle-btn.is-active {
  border-color: color-mix(in srgb, var(--primary) 35%, var(--border));
  background: color-mix(in srgb, var(--primary) 10%, transparent);
  font-weight: 700;
}

.billing__downgrade-note {
  margin: -2px 0 0;
}

.billing__cycle-note {
  margin: -8px 0 0;
  text-align: center;
  font-size: 12px;
}

.panel--beta {
  gap: 8px;
  background: rgba(31, 122, 76, 0.06);
}

.panel--beta p {
  margin: 0;
  color: var(--ink);
  line-height: 1.5;
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
  align-items: center;
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

.badge--outline {
  background: transparent;
  border: 1px solid rgba(31, 74, 96, 0.25);
  color: var(--ink);
}

.access-pill {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: rgba(31, 122, 76, 0.16);
  color: #1f7a4c;
}

.access-pill--warn {
  background: rgba(217, 164, 65, 0.2);
  color: #a57011;
}

.access-pill--danger {
  background: rgba(194, 75, 75, 0.2);
  color: #a03838;
}

.access-meta {
  display: grid;
  gap: 6px;
  font-size: 14px;
}

.summary-grid,
.limits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.summary-card,
.limit-card {
  border: 1px solid rgba(7, 47, 71, 0.1);
  border-radius: var(--radius-md);
  background: rgba(7, 47, 71, 0.03);
  padding: 12px 14px;
  display: grid;
  gap: 5px;
}

.summary-card__label,
.limit-card__label {
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.summary-card__value,
.limit-card__value {
  font-weight: 700;
}

.summary-card__hint {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.35;
}

.request-summary {
  border: 1px solid rgba(217, 164, 65, 0.35);
  border-radius: var(--radius-md);
  background: rgba(217, 164, 65, 0.09);
  padding: 12px 14px;
  display: grid;
  gap: 6px;
}

.request-summary__title {
  font-weight: 700;
}

.request-summary__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  font-size: 13px;
  color: var(--muted);
}

.request-summary__note {
  margin: 0;
}

.feature-list {
  border: 1px solid rgba(7, 47, 71, 0.1);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.feature-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  font-size: 14px;
  border-bottom: 1px solid rgba(7, 47, 71, 0.08);
}

.feature-row:last-child {
  border-bottom: 0;
}

.feature-row__state--muted {
  color: var(--muted);
  font-weight: 500;
}

.access-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.access-label {
  color: var(--muted);
}

.request-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.plan-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.plan-card {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 20px;
  background: #fff;
  display: grid;
  gap: 8px;
  transition: border-color 180ms ease, box-shadow 180ms ease;
}

.plan-card--current {
  border-color: color-mix(in srgb, var(--primary) 35%, var(--line));
  box-shadow: 0 6px 14px rgba(31, 74, 96, 0.1);
}

.plan-card--highlight {
  border-color: color-mix(in srgb, var(--primary) 66%, #8db69f);
  background:
    radial-gradient(circle at 100% -10%, rgba(255, 225, 133, 0.3), rgba(255, 225, 133, 0) 46%),
    linear-gradient(180deg, rgba(31, 140, 93, 0.09), rgba(255, 255, 255, 0.98));
}

.plan-head {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
  align-items: center;
  text-align: center;
}

.plan-title {
  font-weight: 700;
  font-family: var(--font-display);
  font-size: 22px;
}

.plan-subtitle {
  margin-top: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.3;
  min-height: 0;
}

.plan-price {
  text-align: center;
  white-space: nowrap;
  margin-top: 2px;
}

.plan-price__main {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
}

.plan-price__period {
  margin-top: 4px;
  font-size: 12px;
  color: var(--muted);
}

.plan-price__alt {
  font-size: 12px;
  color: var(--muted);
  border-top: 1px dashed rgba(31, 74, 96, 0.2);
  padding-top: 8px;
  min-height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.plan-price__hint {
  color: color-mix(in srgb, var(--primary) 86%, #31543f);
  font-weight: 600;
}

.plan-badges {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 0;
}

.plan-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--primary) 35%, var(--line));
  background: color-mix(in srgb, var(--primary) 14%, transparent);
  color: var(--ink);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  line-height: 1.2;
  white-space: nowrap;
  width: 100%;
}

.plan-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;
  color: color-mix(in srgb, var(--text) 76%, #4f616a);
  font-size: 14px;
  line-height: 1.35;
}

.plan-list li {
  position: relative;
  padding-left: 14px;
}

.plan-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: color-mix(in srgb, var(--primary) 65%, #346449);
}

.plan-foot {
  display: grid;
  gap: 0;
}

.plan-action {
  display: grid;
  gap: 8px;
  justify-items: center;
}

.plan-action .btn {
  width: 100%;
}

.plan-action__secondary {
  justify-content: center;
}

.plan-action__state {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 34px;
  padding: 6px 12px;
  border: 1px solid color-mix(in srgb, var(--primary) 35%, var(--line));
  border-radius: 999px;
  background: color-mix(in srgb, var(--primary) 14%, transparent);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink);
  line-height: 1.2;
}

.plan-action__state--base {
  background: rgba(7, 47, 71, 0.04);
  border-color: rgba(7, 47, 71, 0.14);
}

@media (max-width: 860px) {
  .billing__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
