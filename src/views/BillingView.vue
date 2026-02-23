<template>
  <section class="billing">
    <header class="billing__hero">
      <div>
        <div class="badge">Плани</div>
        <h1 class="title billing__title">Доступ та тарифи</h1>
        <p class="muted billing__subtitle">
          Показуємо поточний доступ і можливості. Оплата зараз у ручному режимі.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
    </header>

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
          <span class="access-label">Групові кімнати:</span>
          <strong>{{ groupRoomLabel }}</strong>
        </div>
      </div>
      <div class="request-row">
        <button
          class="btn"
          type="button"
          :disabled="!nextPlan || isRequesting"
          @click="requestUpgrade"
        >
          {{ upgradeButtonLabel }}
        </button>
        <div v-if="requestStatus" class="muted">{{ requestStatus }}</div>
      </div>
    </section>

    <section class="plan-grid">
      <article
        v-for="plan in plans"
        :key="plan.code"
        class="plan-card"
        :class="{ 'plan-card--current': isCurrentPlan(plan.code) }"
      >
        <div class="plan-head">
          <div>
            <div class="plan-title">{{ plan.title }}</div>
            <div class="plan-subtitle">{{ plan.subtitle }}</div>
          </div>
          <div class="plan-price">
            <div class="plan-price__main">{{ plan.price }}</div>
            <div v-if="plan.annual" class="plan-price__alt">
              {{ plan.annual }} <span class="plan-price__hint">{{ plan.annualHint }}</span>
            </div>
          </div>
        </div>
        <div class="plan-badges">
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
              class="btn btn--ghost"
              type="button"
              :disabled="!canRequestPlan(plan.code) || isRequesting"
              @click="requestAccess(plan.code)"
            >
              {{ planActionLabel(plan.code) }}
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
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { apiPost } from '../lib/api'

type PlanCode = 'START' | 'PRO' | 'LEADER'

const planOrder: PlanCode[] = ['START', 'PRO', 'LEADER']

const plans = [
  {
    code: 'START',
    title: 'Start',
    subtitle: 'Перші клієнти',
    price: '€0/міс',
    features: [
      '3 активні клієнти',
      '1:1 сесії',
      'Слоти та бронювання',
      'Базовий кабінет',
    ],
    note: 'Для старту та тестування.',
  },
  {
    code: 'PRO',
    title: 'Pro',
    subtitle: 'Стабільний ритм',
    price: '€29/місяць',
    annual: 'або €290 / рік',
    annualHint: '2 місяці безкоштовно',
    features: [
      '20 активних клієнтів',
      '1:1 + парна терапія',
      'Групові кімнати',
      'Перенесення та нагадування',
      'Авторський журнал (Незабаром)',
      'Розширена аналітика (Незабаром)',
    ],
    note: 'Основний тариф для росту практики.',
  },
  {
    code: 'LEADER',
    title: 'Leader',
    subtitle: 'Масштабування',
    price: '€49/місяць',
    annual: 'або €490 / рік',
    annualHint: '2 місяці безкоштовно',
    features: [
      'Безліміт активних клієнтів',
      'Усе з PRO',
      'Broadcast + публічні події',
      'Пріоритетна підтримка',
    ],
    note: 'Для команд і публічних форматів.',
  },
] as const

const planByCode = new Map(plans.map((plan) => [plan.code, plan]))

const auth = useAuthStore()
const { me } = storeToRefs(auth)

const requestingPlan = ref<PlanCode | null>(null)
const requestedPlan = ref<PlanCode | null>(null)
const requestStatus = ref('')

const STORAGE_STATUS_KEY = 'billing_request_status'
const STORAGE_PLAN_KEY = 'billing_request_plan'
const STORAGE_TS_KEY = 'billing_request_timestamp'
const REQUEST_TTL_MS = 7 * 24 * 60 * 60 * 1000

function loadRequestState() {
  const storedStatus = localStorage.getItem(STORAGE_STATUS_KEY) || ''
  const storedPlan = localStorage.getItem(STORAGE_PLAN_KEY) || ''
  const storedTsRaw = localStorage.getItem(STORAGE_TS_KEY)
  const storedTs = storedTsRaw ? Number(storedTsRaw) : 0
  const isExpired = storedTs && Date.now() - storedTs > REQUEST_TTL_MS
  if (isExpired) {
    localStorage.removeItem(STORAGE_STATUS_KEY)
    localStorage.removeItem(STORAGE_PLAN_KEY)
    localStorage.removeItem(STORAGE_TS_KEY)
    return
  }
  if (storedStatus) {
    requestStatus.value = storedStatus
  }
  if (planOrder.includes(storedPlan as PlanCode)) {
    requestedPlan.value = storedPlan as PlanCode
  }
}

function persistRequestState() {
  if (requestStatus.value) {
    localStorage.setItem(STORAGE_STATUS_KEY, requestStatus.value)
    localStorage.setItem(STORAGE_TS_KEY, String(Date.now()))
  } else {
    localStorage.removeItem(STORAGE_STATUS_KEY)
    localStorage.removeItem(STORAGE_TS_KEY)
  }
  if (requestedPlan.value) {
    localStorage.setItem(STORAGE_PLAN_KEY, requestedPlan.value)
  } else {
    localStorage.removeItem(STORAGE_PLAN_KEY)
  }
}

loadRequestState()

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

const upgradeButtonLabel = computed(() => {
  if (!nextPlan.value) return 'У вас максимальний план'
  return `Розширити практику до ${planTitle(nextPlan.value)}`
})

const isRequesting = computed(() => Boolean(requestingPlan.value))

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

function canRequestPlan(code: string) {
  return isUpgradePlan(code)
}

function planActionLabel(code: string) {
  if (isCurrentPlan(code)) return 'Поточний план'
  if (isUpgradePlan(code)) return 'Розширити практику'
  if (isDowngradePlan(code)) return 'Нижчий план'
  return 'Недоступно'
}

function requestMessageFor(code: string) {
  if (!requestStatus.value) return ''
  return requestedPlan.value === code ? requestStatus.value : ''
}

async function requestUpgrade() {
  if (!nextPlan.value) return
  await requestAccess(nextPlan.value)
}

async function requestAccess(planCode: string) {
  if (!planOrder.includes(planCode as PlanCode)) return
  if (requestingPlan.value) return
  const target = planCode as PlanCode
  requestingPlan.value = target
  requestedPlan.value = target
  requestStatus.value = ''
  persistRequestState()
  try {
    const note = currentPlan.value ? `upgrade_from:${currentPlan.value}` : undefined
    await apiPost('/cabinet/billing/request-access/', {
      requested_plan: target,
      note,
    })
    requestStatus.value = `Запит на розширення до ${planTitle(target)} надіслано.`
  } catch (err: any) {
    requestStatus.value =
      err?.response?.data?.detail || 'Не вдалося надіслати запит.'
  } finally {
    requestingPlan.value = null
    persistRequestState()
  }
}
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
  padding: 16px;
  background: #fff;
  display: grid;
  gap: 10px;
  position: relative;
}

.plan-card--current {
  border-color: color-mix(in srgb, var(--primary) 35%, var(--line));
  box-shadow: 0 10px 24px rgba(31, 74, 96, 0.12);
}

.plan-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.plan-title {
  font-weight: 700;
  font-family: var(--font-display);
}

.plan-subtitle {
  margin-top: 4px;
  color: var(--muted);
  font-size: 13px;
}

.plan-price {
  font-weight: 600;
  color: var(--deep);
  white-space: nowrap;
  text-align: right;
  display: grid;
  gap: 4px;
}

.plan-price__main {
  font-size: 18px;
}

.plan-price__alt {
  font-size: 12px;
  color: var(--muted);
}

.plan-price__hint {
  color: var(--primary);
  font-weight: 600;
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
  font-size: 12px;
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

@media (max-width: 860px) {
  .billing__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
