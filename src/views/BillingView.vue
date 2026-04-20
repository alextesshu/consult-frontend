<template>
  <section class="billing">
    <header class="billing__hero">
      <div>
        <div class="badge">Плани</div>
        <h1 class="title billing__title">Доступ та тарифи</h1>
        <p class="muted billing__subtitle">
          Оберіть план, перейдіть до оплати, і після підтвердження провайдера доступ
          активується автоматично.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
    </header>
    <SettingsSubnav active="billing" />

    <section class="panel panel--access">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Поточний доступ</div>
          <h2 class="panel__title">{{ currentPlanLabel }}</h2>
        </div>
        <div class="access-pill" :class="accessPillClass">{{ accessLabel }}</div>
      </div>
      <div class="muted">{{ accessHint }}</div>
      <div class="access-meta">
        <div class="access-line">
          <span class="access-label">Ліміт активних клієнтів:</span>
          <strong>{{ activeLimitLabel }}</strong>
        </div>
      </div>
      <div class="request-row">
        <button
          class="btn"
          type="button"
          :disabled="!nextPlan || isRequesting"
          @click="startSelfServeUpgrade"
        >
          {{ upgradeButtonLabel }}
        </button>
        <button
          v-if="nextPlan"
          class="btn btn--ghost"
          type="button"
          :disabled="isRequesting"
          @click="requestAccess(nextPlan)"
        >
          Запросити індивідуальні умови
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
          <li v-for="item in plan.features" :key="item">{{ item }}</li>
        </ul>
        <div class="plan-foot">
          <div class="plan-action">
            <button
              v-if="isUpgradePlan(plan.code)"
              class="btn"
              type="button"
              :disabled="!canSelfServePlan(plan.code) || isRequesting"
              @click="startSelfServeCheckout(plan.code)"
            >
              {{ planActionLabel(plan.code) }}
            </button>
            <button
              v-if="isUpgradePlan(plan.code)"
              class="btn btn--ghost plan-action__secondary"
              type="button"
              :disabled="isRequesting"
              @click="requestAccess(plan.code)"
            >
              Індивідуальні умови
            </button>
            <div v-else-if="isCurrentPlan(plan.code)" class="plan-action__state">Поточний план</div>
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
const ACTIVATION_POLL_INTERVAL_MS = 5000
const ACTIVATION_MAX_ATTEMPTS = 12

const planOrder: PlanCode[] = ['START', 'PRO', 'LEADER']

const plans = [
  {
    code: 'START',
    title: 'Start',
    subtitle: 'Для старту практики',
    price: '€10',
    badge: 'Базовий',
    features: [
      'До 5 активних клієнтів',
      'Публічний профіль і запис',
      'Для старту практики',
    ],
  },
  {
    code: 'PRO',
    title: 'Pro',
    subtitle: 'Для регулярної роботи з клієнтами',
    price: '€24',
    badge: 'Популярний',
    features: [
      'Усе зі Start',
      'До 20 активних клієнтів',
      'Публікації у профілі',
      'Розширена аналітика',
    ],
  },
  {
    code: 'LEADER',
    title: 'Leader',
    subtitle: 'Для зростання, масштабу і максимуму можливостей',
    price: '€59',
    badge: '',
    features: [
      'Усе з Pro',
      'До 60 активних клієнтів',
      'Найглибша аналітика',
    ],
  },
] as const

const planByCode = new Map(plans.map((plan) => [plan.code, plan]))
const annualCopyByPlan: Record<PlanCode, string> = {
  START: 'Лише щомісячна оплата',
  PRO: '€240 / рік одним платежем',
  LEADER: '€590 / рік одним платежем',
}
const annualMonthlyPriceByPlan: Record<PlanCode, string | null> = {
  START: null,
  PRO: '€20',
  LEADER: '€49',
}
const annualOneShotByPlan: Record<PlanCode, string | null> = {
  START: null,
  PRO: '€240 / рік одним платежем',
  LEADER: '€590 / рік одним платежем',
}
const checkoutFallbackMessage =
  'Онлайн-оплата для цього плану зараз недоступна. Ви можете залишити запит на індивідуальні умови.'
const checkoutUnavailableMessage =
  'Онлайн-оплата для цього плану зараз недоступна. Спробуйте пізніше або скористайтеся «Індивідуальні умови».'

const auth = useAuthStore()
const { me } = storeToRefs(auth)

const requestingPlan = ref<PlanCode | null>(null)
const isRefreshing = ref(false)
const requestState = ref<BillingAccessRequestState | null>(null)
const requestFeedback = ref('')
const requestFeedbackPlan = ref<PlanCode | null>(null)
const checkoutFeedback = ref('')
const checkoutFeedbackPlan = ref<PlanCode | null>(null)
const billingCycle = ref<BillingCycle>('monthly')
const activationPendingPlan = ref<PlanCode | null>(null)
const isActivationPolling = ref(false)
const activationPollAttempts = ref(0)
let activationPollTimer: ReturnType<typeof setTimeout> | null = null

const currentPlan = computed<PlanCode | null>(() => {
  const raw = me.value?.effective_entitlements?.plan
  if (!raw) return null
  return planOrder.includes(raw as PlanCode) ? (raw as PlanCode) : null
})

const currentPlanLabel = computed(() => {
  if (!currentPlan.value) return 'Н/Д'
  return planTitle(currentPlan.value)
})

const currentIndex = computed(() => {
  if (!currentPlan.value) return -1
  return planOrder.indexOf(currentPlan.value)
})

const hasDowngradePlans = computed(() => currentIndex.value > 0)

const nextPlan = computed<PlanCode | null>(() => {
  if (currentIndex.value === -1) return null
  return planOrder[currentIndex.value + 1] || null
})

const hasPendingRequest = computed(() => requestState.value?.has_pending_request ?? false)
const activeRequest = computed(() => requestState.value?.active_request)
const latestRequest = computed(() => requestState.value?.latest_request)

const upgradeButtonLabel = computed(() => {
  if (!nextPlan.value) return 'У вас максимальний план'
  return `Перейти на ${planTitle(nextPlan.value)}`
})

const isRequesting = computed(() => Boolean(requestingPlan.value))
const requestStatus = computed(() => {
  if (requestFeedback.value) return requestFeedback.value
  return requestMessage(activeRequest.value || latestRequest.value || null)
})
const primaryStatus = computed(() => checkoutFeedback.value || requestStatus.value)
const billingCycleLabel = computed(() =>
  billingCycle.value === 'annual' ? 'за місяць при оплаті за рік' : 'за місяць'
)

const accessLabel = computed(() => {
  const state = me.value?.access_state
  if (!state) return 'Невідомо'
  if (state === 'OK') return 'Доступ активний'
  if (state === 'GRACE') return 'Пільговий період'
  if (state === 'RESTRICTED') return 'Обмежений режим'
  if (state === 'SUSPENDED') return 'Призупинено'
  return state
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
  const limit = me.value?.effective_entitlements?.active_client_limit
  if (limit === null || limit === undefined) return 'Н/Д'
  return Number.isFinite(limit) ? String(limit) : '∞'
})

function planTitle(code: PlanCode) {
  return planByCode.get(code)?.title || code
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
    return annualOneShotByPlan[typedCode] || 'Лише щомісячна оплата'
  }
  return annualCopyByPlan[typedCode] || ''
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

function isUpgradePlan(code: string) {
  if (currentIndex.value === -1) return false
  return planOrder.indexOf(code as PlanCode) > currentIndex.value
}

function canSelfServePlan(code: string) {
  return isUpgradePlan(code)
}

function planActionLabel(code: string) {
  if (isCurrentPlan(code)) return 'Поточний план'
  if (isUpgradePlan(code)) return `Перейти на ${planTitle(code as PlanCode)}`
  return 'Недоступно'
}

function requestMessageFor(code: string) {
  if (activationPendingPlan.value === code) {
    if (isActivationPolling.value) {
      return 'Активація в процесі. Підтверджуємо оплату та оновлюємо план.'
    }
    return 'Очікуємо підтвердження оплати. Після webhook-підтвердження план оновиться автоматично.'
  }
  if (checkoutFeedbackPlan.value === code && checkoutFeedback.value) {
    return checkoutFeedback.value
  }
  if (requestFeedbackPlan.value === code && requestFeedback.value) {
    return requestFeedback.value
  }
  const base = activeRequest.value || latestRequest.value
  if (!base || base.requested_plan !== code) return ''
  return requestMessage(base)
}

function requestMessage(request: BillingAccessRequest | null) {
  if (!request) return ''
  const plan = planTitle(request.requested_plan as PlanCode)
  if (request.status === 'PENDING') {
    return `Заявку на перехід на план ${plan} надіслано.`
  }
  if (request.status === 'APPROVED') {
    return `Заявку на перехід на план ${plan} схвалено.`
  }
  if (request.status === 'REJECTED') {
    return `Заявку на перехід на план ${plan} відхилено.`
  }
  return ''
}

async function refreshBillingState() {
  if (isRefreshing.value) return
  isRefreshing.value = true
  try {
    await auth.loadMe()
    await loadRequestState()
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
    'Активація в процесі. Після підтвердження оплати план оновиться автоматично.'

  const tick = async () => {
    if (!isActivationPolling.value) return
    activationPollAttempts.value += 1
    try {
      await auth.loadMe()
      if (isPlanReached(target)) {
        clearActivationPolling()
        activationPendingPlan.value = null
        checkoutFeedbackPlan.value = target
        checkoutFeedback.value = `План ${planTitle(target)} активовано.`
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
        'Оплату обробляємо. Це може тривати кілька хвилин. Натисніть «Оновити стан плану» трохи пізніше.'
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
      plan: target === 'LEADER' ? 'LEADER' : 'PRO',
      billing_cycle: checkoutCycleForPlan(target),
    })
    if (response.checkout_url) {
      const checkoutWindow = window.open(response.checkout_url, '_blank', 'noopener,noreferrer')
      if (!checkoutWindow) {
        checkoutFeedback.value =
          'Не вдалося відкрити сторінку оплати. Дозвольте pop-up або скористайтеся «Індивідуальні умови».'
        return
      }
      checkoutFeedback.value =
        'Переходимо до оплати. Після підтвердження оплати план активується автоматично.'
      await pollPlanActivation(target)
      return
    }
    checkoutFeedback.value = response.fallback_available
      ? checkoutFallbackMessage
      : checkoutUnavailableMessage
    await refreshBillingState()
  } catch (err: any) {
    checkoutFeedback.value = getApiErrorMessage(
      err,
      'Не вдалося створити checkout-сесію. Спробуйте ще раз.'
    )
  } finally {
    requestingPlan.value = null
  }
}

async function requestAccess(planCode: string) {
  if (!planOrder.includes(planCode as PlanCode)) return
  if (requestingPlan.value) return
  if (hasPendingRequest.value) {
    const pendingPlan = activeRequest.value?.requested_plan
    requestFeedbackPlan.value = planOrder.includes(pendingPlan as PlanCode)
      ? (pendingPlan as PlanCode)
      : null
    requestFeedback.value = 'Ви вже маєте активну заявку на цей план.'
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
    requestFeedback.value = 'Запит зафіксовано. Команда обробить його вручну.'
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
      requestFeedback.value = 'Ви вже маєте активну заявку на цей план.'
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

@media (max-width: 860px) {
  .billing__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

