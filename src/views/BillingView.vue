<template>
  <section class="billing">
    <header class="billing__hero">
      <div>
        <h1 class="title billing__title">Доступ та тарифи</h1>
        <p class="muted billing__subtitle">
          Перевірте ваш доступ, доступні можливості, ліміти та статус заявок.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
    </header>
    <SettingsSubnav active="billing" />

    <section class="panel panel--access">
      <div class="panel__header">
        <div>
          <h2 class="panel__title">Ваш доступ зараз: {{ currentPlanLabel }}</h2>
        </div>
        <div class="access-pill" :class="accessPillClass">{{ accessLabel }}</div>
      </div>
      <div class="muted">{{ mainAccessDescription }}</div>
      <div v-if="secondaryAccessNote" class="muted access-secondary-note">{{ secondaryAccessNote }}</div>
      <div v-if="latestRequestLine" class="muted access-secondary-note">{{ latestRequestLine }}</div>
      <div v-if="trialDateLines.length" class="access-meta">
        <div v-for="line in trialDateLines" :key="line" class="access-line">{{ line }}</div>
      </div>
      <div v-if="overrideDateLines.length" class="access-meta">
        <div v-for="line in overrideDateLines" :key="line" class="access-line">{{ line }}</div>
      </div>
      <div class="limits-grid">
        <article class="limit-card">
          <div class="limit-card__label">Постійні клієнти</div>
          <div class="limit-card__value">{{ activeClientsUsageLabel }}</div>
        </article>
        <article class="limit-card">
          <div class="limit-card__label">Сесії без реєстрації</div>
          <div class="limit-card__value">{{ guestSessionsUsageLabel }}</div>
        </article>
      </div>
      <section v-if="activeClientEntitlement" class="slot-panel" aria-labelledby="extra-slots-title">
        <div>
          <h3 id="extra-slots-title" class="slot-panel__title">Розширення ліміту активних клієнтів</h3>
          <p class="muted slot-panel__text">
            Start включає 3 активні клієнти, PRO — 20. Якщо потрібно більше, можна розширити ліміт: +1 активний клієнт — 200 грн/міс.
          </p>
        </div>
        <dl class="slot-panel__stats">
          <div>
            <dt>Базовий ліміт</dt>
            <dd>{{ formatLimit(activeClientEntitlement.base_limit) }}</dd>
          </div>
          <div>
            <dt>Додаткові активні клієнти</dt>
            <dd>{{ activeClientEntitlement.extra_slots ?? 0 }} / {{ activeClientEntitlement.extra_slots_limit ?? 0 }}</dd>
          </div>
          <div>
            <dt>Доступний ліміт</dt>
            <dd>{{ formatLimit(activeClientEntitlement.effective_limit) }}</dd>
          </div>
          <div>
            <dt>Залишилось</dt>
            <dd>{{ formatLimit(activeClientEntitlement.remaining) }}</dd>
          </div>
        </dl>
        <div class="slot-panel__action">
          <button class="btn btn--ghost" type="button" disabled>{{ extraSlotActionLabel }}</button>
          <p class="muted">{{ extraSlotActionHelper }}</p>
        </div>
      </section>
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
        <button class="btn btn--ghost" type="button" :disabled="isRefreshing" @click="refreshBillingState">
          {{ isRefreshing ? 'Оновлюємо…' : 'Оновити стан плану' }}
        </button>
        <button
          v-if="showSwitchToStartAction"
          class="btn btn--ghost"
          type="button"
          :disabled="isRequesting || hasPendingRequest"
          @click="switchToStart"
        >
          Перейти на Start
        </button>
        <div v-if="primaryStatus" class="muted">{{ primaryStatus }}</div>
      </div>
      <p class="muted billing__limits-helper">
        Постійні клієнти — це клієнти у вашій базі, які займають ліміт тарифу. Сесії без реєстрації рахуються окремо.
      </p>
      <p v-if="showSwitchToStartAction" class="muted">
        Після пробного PRO-періоду можна залишитися на Start, розширити ліміт активних клієнтів або перейти на PRO.
      </p>
    </section>

    <p class="muted billing__shared-value">
      У кожному плані — публічний профіль, яким можна ділитися, гнучкий функціонал запису та бронювання й
      робота без комісії за сесії.
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
            <div v-if="billingCycleLabel" class="plan-price__period">{{ billingCycleLabel }}</div>
          </div>
        </div>
        <div v-if="planSecondaryPriceHint(plan.code)" class="plan-price__alt">
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
              @click="requestAccess(plan.code)"
            >
              {{ planActionLabel(plan.code) }}
            </button>
            <div v-else-if="isCurrentPlan(plan.code)" class="plan-action__state">Поточний доступ</div>
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

    <section class="panel panel--beta">
      <div class="badge badge--soft">Founder Access</div>
      <p>
        Промокод FOUNDER відкриває 1 місяць PRO-доступу без оплати після активації профілю. Після пробного періоду
        можна залишитися на Start, розширити ліміт активних клієнтів або перейти на PRO.
      </p>
    </section>

    <p v-if="hasDowngradePlans" class="muted billing__downgrade-note">
      Перехід на нижчий план зараз оформлюється через підтримку.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import {
  apiGet,
  createBillingAccessRequest,
  fetchBillingAccessRequestState,
  getApiErrorMessage,
  type ActiveClientEntitlement,
  type BillingAccessRequest,
  type BillingAccessRequestState,
} from '../lib/api'
import SettingsSubnav from '../components/SettingsSubnav.vue'

type PlanCode = 'START' | 'PRO' | 'LEADER'
type AccessSource = 'base_plan' | 'trial' | 'override' | 'billing' | 'beta_default_pro' | string
type BillingSummaryRequest = {
  id: number
  requested_plan: PlanCode
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string
  created_at: string | null
  reviewed_at?: string | null
  decided_at?: string | null
  public_note?: string | null
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
      base_limit?: number | null
      extra_slots?: number | null
      extra_slots_limit?: number | null
      effective_limit?: number | null
      remaining?: number | null
      extra_slot_price_uah?: number | null
      can_buy_extra_slot?: boolean | null
      requires_pro?: boolean | null
      upgrade_required_plan?: 'PRO' | 'LEADER' | string | null
      is_forced_limit?: boolean | null
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
const planOrder: PlanCode[] = ['START', 'PRO', 'LEADER']

const plans = [
  {
    code: 'START',
    title: 'Start',
    subtitle: 'Безкоштовний старт для невеликої практики',
    price: '0 грн',
    badge: 'Безкоштовний',
    features: [
      'Публічний профіль спеціаліста',
      'Базовий прийом запитів',
      '3 активні клієнти включено',
      'Можна розширити ліміт до 6 клієнтів',
      '+1 активний клієнт — 200 грн/міс',
      'Робота без комісій за консультації',
    ],
  },
  {
    code: 'PRO',
    title: 'Pro',
    subtitle: 'Повний доступ для активнішої практики',
    price: '990 грн',
    badge: 'Для активної практики',
    features: [
      'Усе зі Start',
      '20 активних клієнтів включено',
      'Можна розширити ліміт до 27 клієнтів',
      '+1 активний клієнт — 200 грн/міс',
      'Повний робочий кабінет',
      'Сесії та календар',
      'Матеріали для клієнтів',
      'Власний блог',
      'Приватні робочі записи',
    ],
  },
  {
    code: 'LEADER',
    title: 'Leader',
    subtitle: 'Для масштабної практики',
    price: '2 490 грн',
    badge: 'Недоступно під час beta',
    features: ['Усе з Pro', 'Розширені можливості', 'Індивідуальні умови'],
  },
] as const

const planByCode = new Map(plans.map((plan) => [plan.code, plan]))
const specialistSelectablePlans = new Set<PlanCode>(['PRO'])
const hiddenBetaFeatureCodes = new Set(['pair', 'group_room', 'group_room_broadcast', 'public_events'])
const auth = useAuthStore()
const { me } = storeToRefs(auth)

const requestingPlan = ref<PlanCode | null>(null)
const isRefreshing = ref(false)
const requestState = ref<BillingAccessRequestState | null>(null)
const accessSummary = ref<BillingAccessSummary | null>(null)
const requestFeedback = ref('')
const requestFeedbackPlan = ref<PlanCode | null>(null)

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
  if (summaryCurrentRequest.value?.status === 'PENDING') return summaryCurrentRequest.value
  const fallback = activeRequest.value
  if (!fallback || fallback.status !== 'PENDING') return null
  return {
    id: fallback.id,
    requested_plan: fallback.requested_plan,
    status: fallback.status,
    created_at: fallback.created_at,
    reviewed_at: fallback.decided_at,
  }
})

const normalizedLatestRequest = computed<BillingSummaryRequest | null>(() => {
  if (summaryLatestRequest.value && summaryLatestRequest.value.status !== 'PENDING') {
    return summaryLatestRequest.value
  }
  const fallback = latestRequest.value
  if (!fallback || fallback.status === 'PENDING') return null
  return {
    id: fallback.id,
    requested_plan: fallback.requested_plan,
    status: fallback.status,
    created_at: fallback.created_at,
    reviewed_at: fallback.decided_at,
  }
})

const requestForActionState = computed(() => {
  return normalizedCurrentRequest.value || normalizedLatestRequest.value
})

const upgradeButtonLabel = computed(() => {
  if (!nextPlan.value) return 'У вас максимальний план'
  if (hasPendingRequest.value) return 'Заявка очікує розгляду'
  if (hasUnappliedApprovedRequestFor(nextPlan.value)) return 'Очікує активації'
  return `Подати заявку на ${planTitle(nextPlan.value)}`
})

const isRequesting = computed(() => Boolean(requestingPlan.value))
const requestStatus = computed(() => {
  if (requestFeedback.value) return requestFeedback.value
  return requestMessage(normalizedCurrentRequest.value)
})
const primaryStatus = computed(() => requestStatus.value)
const billingCycleLabel = computed(() => '')

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
const isBetaDefaultProAccess = computed(
  () => accessSource.value === 'beta_default_pro' && currentPlan.value === 'PRO'
)
const showSwitchToStartAction = computed(
  () => isBetaDefaultProAccess.value && basePlan.value === 'START'
)

const mainAccessDescription = computed(() => {
  if (isBetaDefaultProAccess.value) {
    return 'Після пробного PRO-періоду можна залишитися на Start, розширити ліміт активних клієнтів або перейти на PRO.'
  }
  if (accessSource.value === 'trial') {
    return `Вам відкрито тестовий доступ до можливостей тарифу ${currentPlanLabel.value}.`
  }
  if (accessSource.value === 'override') {
    return `Адміністратор тимчасово надав доступ до можливостей тарифу ${currentPlanLabel.value}.`
  }
  if (
    normalizedLatestRequest.value?.status === 'APPROVED' &&
    normalizedLatestRequest.value.applied !== false
  ) {
    return `Заявку на ${currentPlanLabel.value} схвалено. Можливості ${currentPlanLabel.value} активні.`
  }
  return `Вам доступні можливості тарифу ${currentPlanLabel.value}.`
})

const secondaryAccessNote = computed(() => {
  if (isBetaDefaultProAccess.value && basePlan.value === 'START') {
    return 'Основний тариф може залишатися Start, але на час beta вам відкрито можливості Pro.'
  }
  return ''
})

const latestRequestLine = computed(() => {
  const request = normalizedLatestRequest.value
  if (!request || request.status === 'PENDING') return ''
  const statusLabel =
    request.status === 'APPROVED'
      ? 'схвалено'
      : request.status === 'REJECTED'
        ? 'відхилено'
        : 'розглянуто'
  const reviewedAt = request.reviewed_at || request.decided_at || request.created_at
  const datePart = reviewedAt ? formatDateTime(reviewedAt) : ''
  return `Остання заявка: ${planTitle(request.requested_plan)}, ${statusLabel}${datePart ? ` ${datePart}` : ''}`
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

const accessPillClass = computed(() => {
  const state = me.value?.access_state
  if (state === 'GRACE') return 'access-pill--warn'
  if (state === 'RESTRICTED' || state === 'SUSPENDED') return 'access-pill--danger'
  return 'access-pill--ok'
})

const activeLimitLabel = computed(() => {
  const limit =
    accessSummary.value?.limits?.active_clients?.effective_limit ??
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

const activeClientEntitlement = computed<ActiveClientEntitlement | null>(() => {
  return (
    accessSummary.value?.limits?.active_clients ||
    me.value?.effective_entitlements?.active_client_entitlement ||
    null
  )
})

const extraSlotActionLabel = computed(() => {
  const snapshot = activeClientEntitlement.value
  if (!snapshot) return 'Розширити ліміт активних клієнтів'
  if (snapshot.can_buy_extra_slot) return 'Розширити ліміт активних клієнтів'
  if (snapshot.upgrade_required_plan === 'PRO') return 'Перейти на PRO'
  if (snapshot.upgrade_required_plan === 'LEADER') return 'Перейти на Leader'
  return 'Доступно в межах тарифу'
})

const extraSlotActionHelper = computed(() => {
  const snapshot = activeClientEntitlement.value
  if (!snapshot) return ''
  if (snapshot.can_buy_extra_slot) {
    return 'Розширення ліміту поки оформлюється через адміністратора.'
  }
  if (snapshot.upgrade_required_plan === 'PRO') {
    return 'На Start можна мати до 6 активних клієнтів. Для більшої кількості перейдіть на PRO.'
  }
  if (snapshot.upgrade_required_plan === 'LEADER') {
    return 'На PRO можна мати до 27 активних клієнтів. Для більшої кількості потрібні умови Leader.'
  }
  return 'Поточний тариф не потребує додаткової дії.'
})

function formatLimit(value: number | null | undefined) {
  if (value === null || value === undefined) return 'Н/Д'
  return Number.isFinite(value) ? String(value) : '∞'
}

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
  priority_support: 'Розширена підтримка',
  guest_sessions: 'Сесії без реєстрації',
}

function featureLabel(code: string) {
  return featureLabels[code] || code
}

function planTitle(code: PlanCode | string | null | undefined) {
  if (!code) return 'Не визначено'
  return planByCode.get(code as PlanCode)?.title || String(code)
}

function planDisplayPrice(code: string) {
  const typedCode = code as PlanCode
  return planByCode.get(typedCode)?.price || ''
}

function planSecondaryPriceHint(_code: string) {
  return ''
}

function planFeatureList(code: PlanCode) {
  return [...(planByCode.get(code)?.features || [])]
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
  if (isCurrentPlan(code)) return 'Поточний доступ'
  if (isUnavailableBetaPlan(code)) return 'Тариф готується'
  if (hasUnappliedApprovedRequestFor(code)) return 'Очікує активації'
  if (isUpgradePlan(code)) return `Подати заявку на ${planTitle(code as PlanCode)}`
  return 'Недоступно'
}

function isSpecialistSelectablePlan(code: string): code is PlanCode {
  return specialistSelectablePlans.has(code as PlanCode)
}

function isUnavailableBetaPlan(code: string) {
  return code === 'LEADER' && !isCurrentPlan(code) && !isBasePlan(code)
}

function hasUnappliedApprovedRequestFor(code: string) {
  const request = requestForActionState.value
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
  if (requestFeedbackPlan.value === code && requestFeedback.value) {
    return requestFeedback.value
  }
  const summary = requestForActionState.value
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
  } finally {
    isRefreshing.value = false
  }
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
  await requestAccess(nextPlan.value)
}

async function switchToStart() {
  await requestAccess('START')
}

async function requestAccess(planCode: string) {
  if (!planOrder.includes(planCode as PlanCode)) return
  if (!isSpecialistSelectablePlan(planCode) && !(showSwitchToStartAction.value && planCode === 'START')) return
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
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 92% 70%, color-mix(in srgb, var(--pc-peach-100) 70%, transparent) 0 120px, transparent 121px),
    linear-gradient(135deg, #ffffff 0%, color-mix(in srgb, var(--pc-primary-soft) 70%, #ffffff) 54%, color-mix(in srgb, var(--pc-yellow-soft) 45%, #ffffff) 100%);
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-panel);
  padding: 24px;
  box-shadow: var(--pc-shadow-soft);
}

.billing__hero > * {
  position: relative;
  z-index: 1;
}

.billing__hero::after {
  content: "";
  position: absolute;
  right: -44px;
  bottom: -58px;
  width: 180px;
  height: 180px;
  border-radius: 999px;
  background: rgba(247, 183, 126, 0.18);
  pointer-events: none;
}

.billing__title {
  margin: 8px 0 8px;
  color: var(--pc-navy-950);
  font-size: 32px;
  line-height: 1.15;
}

.billing__subtitle {
  max-width: 520px;
  color: var(--pc-text-muted);
  line-height: 1.55;
}

.billing__hero .btn {
  border-radius: var(--pc-radius-control);
  font-weight: 700;
}

.billing__hero .btn--ghost {
  border-color: var(--pc-border);
  background: #fff;
  color: var(--pc-navy-900);
}

.billing :deep(.settings-subnav__link) {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
  background: #fff;
  color: var(--pc-text-muted);
  font-weight: 700;
}

.billing :deep(.settings-subnav__link:hover),
.billing :deep(.settings-subnav__link:focus-visible) {
  border-color: color-mix(in srgb, var(--pc-navy-900) 28%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-blue-soft) 76%, #ffffff);
  color: var(--pc-navy-900);
}

.billing :deep(.settings-subnav__link.is-active) {
  border-color: color-mix(in srgb, var(--pc-navy-900) 36%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-primary-soft) 80%, #ffffff);
  color: var(--pc-navy-900);
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
  background: #fff;
}

.panel--beta p {
  margin: 0;
  color: var(--ink);
  line-height: 1.5;
}

.panel {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-panel);
  padding: 18px;
  background: #fff;
  box-shadow: var(--pc-shadow-soft);
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
  background: color-mix(in srgb, var(--pc-blue-soft) 82%, #ffffff);
  border-color: color-mix(in srgb, var(--pc-navy-900) 22%, var(--pc-border));
  color: var(--pc-navy-900);
}

.badge--outline {
  background: transparent;
  border: 1px solid rgba(31, 74, 96, 0.25);
  color: var(--ink);
}

.access-pill {
  border: 1px solid color-mix(in srgb, var(--pc-navy-900) 28%, var(--pc-border));
  padding: 6px 12px;
  border-radius: var(--pc-radius-control);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: color-mix(in srgb, var(--pc-primary-soft) 82%, #ffffff);
  color: var(--pc-navy-900);
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

.access-secondary-note {
  font-size: 13px;
}

.summary-grid,
.limits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.summary-card,
.limit-card {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-card);
  background: #fff;
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
  border: 1px solid color-mix(in srgb, var(--pc-warning) 32%, var(--pc-border));
  border-radius: var(--pc-radius-card);
  background: color-mix(in srgb, var(--pc-yellow-soft) 55%, #ffffff);
  color: var(--pc-navy-900);
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

.slot-panel {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-card);
  background: #fff;
  padding: 16px;
  display: grid;
  gap: 14px;
}

.slot-panel__title {
  margin: 0 0 4px;
  font-size: 17px;
}

.slot-panel__text {
  margin: 0;
}

.slot-panel__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  margin: 0;
}

.slot-panel__stats div {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
  padding: 10px 12px;
}

.slot-panel__stats dt {
  color: var(--muted);
  font-size: 12px;
}

.slot-panel__stats dd {
  margin: 4px 0 0;
  font-weight: 700;
}

.slot-panel__action {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
}

.slot-panel__action .muted {
  margin: 0;
}

.feature-list {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-card);
  overflow: hidden;
}

.feature-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  font-size: 14px;
  border-bottom: 1px solid var(--pc-border);
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
    padding: 14px 16px;
    gap: 10px;
  }

  .billing__hero::after {
    display: none;
  }

  .billing__title {
    font-size: 26px;
    margin: 4px 0;
    line-height: 1.16;
  }

  .billing__subtitle {
    margin: 0;
    font-size: 13px;
    line-height: 1.32;
    max-width: 100%;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
</style>
