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

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Поточний доступ</div>
          <h2 class="panel__title">{{ planLabel }}</h2>
        </div>
        <div class="access-pill" :class="accessPillClass">{{ accessLabel }}</div>
      </div>
      <div class="muted">{{ accessHint }}</div>
      <div class="request-row">
        <button class="btn" type="button" :disabled="requesting" @click="requestAccess">
          {{ requesting ? 'Надсилання...' : 'Запросити доступ' }}
        </button>
        <div v-if="requestStatus" class="muted">{{ requestStatus }}</div>
      </div>
    </section>

    <section class="plan-grid">
      <article v-for="plan in plans" :key="plan.code" class="plan-card">
        <div class="plan-head">
          <div class="plan-title">{{ plan.title }}</div>
          <div class="plan-price">{{ plan.price }}</div>
        </div>
        <ul class="plan-list">
          <li v-for="item in plan.features" :key="item">{{ item }}</li>
        </ul>
        <div class="plan-foot">
          <div class="muted">{{ plan.note }}</div>
        </div>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { http } from '../lib/http'

const auth = useAuthStore()
const { me } = storeToRefs(auth)
const requesting = ref(false)
const requestStatus = ref('')

const accessLabel = computed(() => {
  const state = me.value?.access_state
  if (!state) return 'Невідомо'
  if (state === 'OK') return 'Повний доступ'
  if (state === 'GRACE') return 'Пільговий період'
  if (state === 'RESTRICTED') return 'Обмежений режим'
  return state
})

const accessPillClass = computed(() => {
  const state = me.value?.access_state
  if (state === 'GRACE') return 'access-pill--warn'
  if (state === 'RESTRICTED') return 'access-pill--danger'
  return 'access-pill--ok'
})

const planLabel = computed(() => {
  const plan = me.value?.effective_entitlements?.plan
  if (plan === 'FREE') return 'Free'
  if (plan === 'BASIC') return 'Basic'
  if (plan === 'PRO') return 'Pro'
  if (plan === 'UNLIMITED') return 'Unlimited'
  return plan || 'Н/Д'
})

const accessHint = computed(() => {
  const state = me.value?.access_state
  if (state === 'GRACE') return 'Оплата потребує уваги. Доступ тимчасово збережено.'
  if (state === 'RESTRICTED') return 'Доступ лише для читання. Нові дії заблоковані.'
  return 'Все працює у штатному режимі.'
})

const plans = [
  {
    code: 'FREE',
    title: 'Free',
    price: '€0/міс',
    features: [
      '3 активні клієнти',
      'Слоти та бронювання',
      'Сесії + нотатки',
      'Публічний профіль',
    ],
    note: 'Стартовий рівень.',
  },
  {
    code: 'BASIC',
    title: 'Basic',
    price: '€20/міс',
    features: [
      '10 активних клієнтів',
      'Участь в каталозі',
      'Розширений профіль',
      'Перенесення/скасування',
    ],
    note: 'Для стабільної практики.',
  },
  {
    code: 'PRO',
    title: 'Pro',
    price: '€30/міс',
    features: [
      '15 активних клієнтів',
      'Групові зустрічі',
      'Ролі учасників + запрошення',
      'Модерація відгуків',
    ],
    note: 'Для інтенсивної роботи.',
  },
  {
    code: 'UNLIMITED',
    title: 'Unlimited',
    price: '€50/міс',
    features: [
      'Безліміт активних клієнтів',
      'Broadcast (трансляції)',
      'Розширені групові ліміти',
      'AI-інструменти (план)',
    ],
    note: 'Для масштабування.',
  },
]

async function requestAccess() {
  requesting.value = true
  requestStatus.value = ''
  try {
    await http.post('/cabinet/billing/request-access/', {})
    requestStatus.value = 'Запит на доступ надіслано.'
  } catch (err: any) {
    requestStatus.value = err?.response?.data?.detail || 'Не вдалося надіслати запит.'
  } finally {
    requesting.value = false
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

.request-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.plan-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.plan-card {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 16px;
  background: #fff;
  display: grid;
  gap: 10px;
}

.plan-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
}

.plan-title {
  font-weight: 700;
  font-family: var(--font-display);
}

.plan-price {
  font-weight: 600;
  color: var(--deep);
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
}

@media (max-width: 860px) {
  .billing__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
