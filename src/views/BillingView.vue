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
        <div class="access-line">
          <span class="access-label">Групові онлайн-події:</span>
          <strong>{{ groupRoomLabel }}</strong>
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

    <section class="plan-grid">
      <article
        v-for="plan in plans"
        :key="plan.code"
        class="plan-card"
        :class="{
          'plan-card--current': isCurrentPlan(plan.code),
          'plan-card--pro': plan.code === 'PRO',
        }"
      >
        <div class="plan-head">
          <div class="plan-meta">
            <div class="plan-title">{{ plan.title }}</div>
            <div class="plan-subtitle">{{ plan.subtitle }}</div>
          </div>
          <div class="plan-price">
            <div class="plan-price__main">{{ plan.price }}</div>
          </div>
          <div class="plan-price__alt">
            <span class="plan-price__hint">{{ planAnnualHint(plan.code) }}</span>
          </div>
        </div>
        <div class="plan-badges">
          <span v-if="plan.code === 'PRO'" class="badge badge--pro">Рекомендовано</span>
          <span v-if="isCurrentPlan(plan.code)" class="badge badge--soft">Поточний план</span>
          <span v-else-if="isUpgradePlan(plan.code)" class="badge badge--outline">Оновлення</span>
        </div>
        <ul class="plan-list">
          <li v-for="item in plan.features" :key="item">{{ item }}</li>
        </ul>
        <div class="plan-foot">
          <div class="muted">{{ plan.note }}</div>
          <div class="plan-action">
            <button
              class="btn"
              type="button"
              :disabled="!canSelfServePlan(plan.code) || isRequesting"
              @click="startSelfServeCheckout(plan.code)"
            >
              {{ planActionLabel(plan.code) }}
            </button>
            <button
              v-if="canSelfServePlan(plan.code)"
              class="btn btn--ghost"
              type="button"
              :disabled="isRequesting"
              @click="requestAccess(plan.code)"
            >
              Індивідуальні умови
            </button>
            <div v-if="requestMessageFor(plan.code)" class="muted">
              {{ requestMessageFor(plan.code) }}
            </div>
          </div>
        </div>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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

const planOrder: PlanCode[] = ['START', 'PRO', 'LEADER']

const plans = [
  {
    code: 'START',
    title: 'Start',
    subtitle: 'Для старту практики',
    price: '€10 / місяць',
    features: [
      'До 5 активних клієнтів',
      'Публічний профіль та запис через вільні вікна',
      'Базові сесії, доступність і Time Off',
      'Базові нагадування та сповіщення',
      'Зовнішнє посилання на онлайн-зустріч',
      'Без комісій за сесії',
    ],
    note: 'Лише щомісячна оплата.',
  },
  {
    code: 'PRO',
    title: 'Pro',
    subtitle: 'Найкращий вибір для стабільної практики',
    price: '€24 / місяць',
    features: [
      '20 активних клієнтів',
      'Recurring sessions',
      'Smart reschedule suggestions',
      'Повний модуль нагадувань і сповіщень',
      'Авторський журнал / Серії',
      'Групові онлайн-події',
      'Базова аналітика',
      'Відео у публічному профілі',
    ],
    note: 'Основний повний стек для регулярної роботи.',
  },
  {
    code: 'LEADER',
    title: 'Leader',
    subtitle: 'Для зростання, масштабу і максимуму можливостей',
    price: '€59 / місяць',
    features: [
      'До 60 активних клієнтів',
      'Усе з PRO',
      'Розширена аналітика',
      'Leader-інсайти та рекомендації',
      'Анонси подій у стрічці — скоро',
      'Пріоритетна підтримка — скоро',
      'Ранній доступ до нових можливостей',
    ],
    note: 'Преміальний план для масштабу, видимості та інсайтів.',
  },
] as const

const planByCode = new Map(plans.map((plan) => [plan.code, plan]))
const annualCopyByPlan: Record<PlanCode, string> = {
  START: 'Лише щомісячна оплата',
  PRO: 'Або €20 / міс, оплата за рік — €240 одним платежем',
  LEADER: 'Або €49 / міс, оплата за рік — €590 одним платежем',
}

const auth = useAuthStore()
const { me } = storeToRefs(auth)

const requestingPlan = ref<PlanCode | null>(null)
const isRefreshing = ref(false)
const requestState = ref<BillingAccessRequestState | null>(null)
const requestFeedback = ref('')
const requestFeedbackPlan = ref<PlanCode | null>(null)
const checkoutFeedback = ref('')
const checkoutFeedbackPlan = ref<PlanCode | null>(null)

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

const accessLabel = computed(() => {
  const state = me.value?.access_state
  if (!state) return 'Невідомо'
  if (state === 'OK') return 'Повний доступ'
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
  if (state === 'RESTRICTED') return 'Доступ лише для читання. Нові дії заблоковані.'
  if (state === 'SUSPENDED') return 'Доступ призупинено адміністрацією.'
  return 'Все працює у штатному режимі.'
})

const activeLimitLabel = computed(() => {
  const limit = me.value?.effective_entitlements?.active_client_limit
  if (limit === null || limit === undefined) return 'Н/Д'
  return Number.isFinite(limit) ? String(limit) : '∞'
})

const groupRoomLabel = computed(() => {
  const enabled = me.value?.effective_entitlements?.group_room_enabled
  if (enabled === null || enabled === undefined) return 'Н/Д'
  return enabled ? 'Доступні' : 'Недоступні'
})

function planTitle(code: PlanCode) {
  return planByCode.get(code)?.title || code
}

function planAnnualHint(code: string) {
  return annualCopyByPlan[code as PlanCode] || ''
}

function isCurrentPlan(code: string) {
  return currentPlan.value === code
}

function isUpgradePlan(code: string) {
  if (currentIndex.value === -1) return false
  return planOrder.indexOf(code as PlanCode) > currentIndex.value
}

function isDowngradePlan(code: string) {
  if (currentIndex.value === -1) return false
  return planOrder.indexOf(code as PlanCode) < currentIndex.value
}

function canSelfServePlan(code: string) {
  return isUpgradePlan(code)
}

function planActionLabel(code: string) {
  if (isCurrentPlan(code)) return 'Поточний план'
  if (isUpgradePlan(code)) return `Перейти на ${planTitle(code as PlanCode)}`
  if (isDowngradePlan(code)) return 'Нижчий план'
  return 'Недоступно'
}

function requestMessageFor(code: string) {
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
  try {
    const response = await createBillingCheckoutSession({
      plan: target === 'LEADER' ? 'LEADER' : 'PRO',
      billing_cycle: 'monthly',
    })
    checkoutFeedback.value = response.message
    if (response.checkout_url) {
      window.open(response.checkout_url, '_blank', 'noopener,noreferrer')
      checkoutFeedback.value =
        'Переходимо до оплати. Після підтвердження оплати план активується автоматично.'
    }
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
    requestFeedback.value = ''
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
  border-radius: 16px;
  padding: 18px;
  background: #fff;
  display: grid;
  gap: 10px;
  position: relative;
  min-height: 500px;
  overflow: hidden;
  transform-origin: center top;
  transition:
    transform 220ms ease,
    box-shadow 260ms ease,
    border-color 220ms ease,
    background 260ms ease;
}

.plan-card::before {
  content: '';
  position: absolute;
  inset: -120% 35% auto -35%;
  height: 210%;
  background: linear-gradient(
    115deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.45) 45%,
    rgba(255, 255, 255, 0) 70%
  );
  transform: translateX(-35%) rotate(5deg);
  opacity: 0;
  pointer-events: none;
}

.plan-card > * {
  position: relative;
  z-index: 1;
}

.plan-card--current {
  border-color: color-mix(in srgb, var(--primary) 35%, var(--line));
  box-shadow: 0 10px 24px rgba(31, 74, 96, 0.12);
}

.plan-card--pro {
  border-color: color-mix(in srgb, var(--primary) 72%, #8db69f);
  background:
    radial-gradient(circle at 85% -10%, rgba(255, 225, 133, 0.42), rgba(255, 225, 133, 0) 45%),
    linear-gradient(180deg, rgba(31, 140, 93, 0.12), rgba(255, 255, 255, 0.96));
  box-shadow:
    0 20px 40px rgba(31, 74, 96, 0.22),
    0 0 0 1px rgba(31, 138, 93, 0.22);
  transform: translateY(-10px) scale(1.02);
  z-index: 1;
}

.plan-head {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    'meta price'
    'annual annual';
  gap: 10px;
}

.plan-meta {
  grid-area: meta;
}

.plan-title {
  font-weight: 700;
  font-family: var(--font-display);
  font-size: 22px;
}

.plan-subtitle {
  min-height: 66px;
  margin-top: 4px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.35;
}

.plan-price {
  grid-area: price;
  font-weight: 600;
  color: var(--deep);
  white-space: nowrap;
  text-align: right;
  display: grid;
  gap: 4px;
}

.plan-price__main {
  font-size: 34px;
}

.plan-price__alt {
  grid-area: annual;
  min-height: 22px;
  font-size: 13px;
  color: var(--muted);
  border-top: 1px dashed rgba(31, 74, 96, 0.18);
  padding-top: 8px;
  margin-top: 2px;
}

.plan-price__hint {
  color: color-mix(in srgb, var(--primary) 92%, #31543f);
  font-weight: 600;
}

.badge--pro {
  background: linear-gradient(90deg, #12563b, #1f8a5d 62%, #36a77b);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 8px 18px rgba(31, 138, 93, 0.3);
}

.plan-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.plan-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 6px;
  color: var(--muted);
}

.plan-foot {
  font-size: 13px;
  color: var(--muted);
  display: grid;
  gap: 10px;
}

.plan-action {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.plan-card .badge {
  transition: transform 180ms ease, box-shadow 220ms ease;
}

.plan-card .btn {
  transition:
    transform 180ms ease,
    box-shadow 220ms ease,
    background-color 180ms ease;
}

@media (hover: hover) {
  .plan-card:hover {
    transform: translateY(-10px);
    border-color: color-mix(in srgb, var(--primary) 42%, var(--line));
    box-shadow: 0 20px 36px rgba(31, 74, 96, 0.2);
  }

  .plan-card:hover::before {
    opacity: 1;
    animation: plan-shimmer 900ms ease;
  }

  .plan-card--pro:hover {
    transform: translateY(-14px) scale(1.025);
    box-shadow:
      0 28px 52px rgba(31, 74, 96, 0.28),
      0 0 0 1px rgba(31, 138, 93, 0.34),
      0 0 28px rgba(49, 173, 119, 0.25);
  }

  .plan-card:hover .badge {
    transform: translateY(-1px);
  }

  .plan-card:hover .plan-title {
    color: color-mix(in srgb, var(--deep) 78%, #0f5c3f);
  }

  .plan-card:hover .btn {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(31, 74, 96, 0.14);
  }
}

@keyframes plan-shimmer {
  0% {
    transform: translateX(-35%) rotate(5deg);
  }
  100% {
    transform: translateX(45%) rotate(5deg);
  }
}

@media (max-width: 860px) {
  .billing__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .plan-card--pro {
    transform: none;
  }

  .plan-card {
    min-height: auto;
  }
}
</style>
