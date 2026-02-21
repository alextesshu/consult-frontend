<template>
  <section class="home">
    <div class="container">
      <div class="hero">
        <div class="hero__content">
          <div class="eyebrow">Pro Consult</div>
          <h1 class="hero__title">Pro Consult — Простір для ведення консультацій</h1>
          <p class="hero__subtitle">
            Розклад, клієнти, нотатки, запити та керування сесіями — все в одному робочому просторі.
            Публічний профіль і каталог доступні за бажанням.
          </p>
          <div class="hero__actions">
            <RouterLink v-if="!isAuthenticated" class="btn btn--primary" to="/signup">
              Створити кабінет спеціаліста
            </RouterLink>
            <RouterLink v-if="!isAuthenticated" class="btn btn--ghost" to="/login">
              Увійти
            </RouterLink>
            <button v-if="isAuthenticated" class="btn btn--primary" type="button" @click="goToCabinet">
              Перейти в кабінет
            </button>
            <button v-if="isAuthenticated" class="btn btn--ghost" type="button" @click="onLogout">
              Вийти
            </button>
          </div>
          <div class="hero__catalog">
            <RouterLink class="link" to="/specialists">Шукаєте спеціаліста? → Перейти до каталогу</RouterLink>
            <div class="hint">
              Каталог — за бажанням. Спеціаліст зʼявляється там лише якщо зробить профіль публічним.
            </div>
          </div>
        </div>
        <div class="hero__panel card">
          <div class="panel__title">Який ви спеціаліст?</div>
          <div class="chip-row">
            <button
              v-for="(item, index) in roleCards"
              :key="item.title"
              class="chip"
              :class="{ 'chip--active': index === activeRoleIndex }"
              type="button"
              @click="activeRoleIndex = index"
            >
              {{ item.title }}
            </button>
          </div>
          <p class="panel__text">
            {{ roleCards[activeRoleIndex].description }}
          </p>
        </div>
      </div>

      <div id="features" class="benefits">
        <h2 class="section-title">Ключові можливості</h2>
        <div class="benefits__grid">
          <div v-for="item in benefits" :key="item" class="card benefit-card">
            {{ item }}
          </div>
        </div>
      </div>

      <div class="how">
        <h2 class="section-title">Як це працює</h2>
        <div class="how__grid">
          <div class="card how-card">
            <div class="how-card__step">1</div>
            <div class="how-card__title">Створіть кабінет спеціаліста</div>
            <p class="how-card__text">Додайте базову інформацію та налаштуйте робочий простір.</p>
          </div>
          <div class="card how-card">
            <div class="how-card__step">2</div>
            <div class="how-card__title">Організуйте консультації</div>
            <p class="how-card__text">Розклад, слоти, клієнти та нотатки — в одному місці.</p>
          </div>
          <div class="card how-card">
            <div class="how-card__step">3</div>
            <div class="how-card__title">Каталог — за бажанням</div>
            <p class="how-card__text">
              Зробіть профіль публічним, якщо хочете, щоб вас могли знаходити. Це опційно.
            </p>
            <p class="how-card__note">
              Ми не беремо комісію та не ранжуємо спеціалістів алгоритмами.
            </p>
          </div>
        </div>
      </div>

      <div class="catalog card">
        <div>
          <h2 class="section-title">Каталог — за бажанням</h2>
          <p class="muted">
            Pro Consult — робочий простір для спеціаліста, а каталог доступний лише за бажанням.
            Ви керуєте видимістю профілю, а посиланням можна ділитися напряму з клієнтами.
          </p>
        </div>
        <RouterLink class="btn btn--ghost" to="/specialists">Перейти до каталогу</RouterLink>
      </div>

      <div id="pricing" class="pricing">
        <div class="pricing__header">
          <div>
            <h2 class="section-title">Тарифи</h2>
            <p class="muted">Обирайте план під розмір практики. Без комісій — лише підписка.</p>
          </div>
          <div class="pricing__note">Оновлення плану в будь-який момент</div>
        </div>

        <div class="plan-grid">
          <article
            v-for="plan in pricingPlans"
            :key="plan.code"
            class="plan-card"
            :class="{ 'plan-card--current': isCurrentPlan(plan.code) }"
          >
            <div class="plan-head">
              <div>
                <div class="plan-title">{{ plan.title }}</div>
                <div v-if="plan.subtitle" class="plan-subtitle">{{ plan.subtitle }}</div>
              </div>
              <div class="plan-price">
                <div class="plan-price__main">{{ plan.price }}</div>
                <div v-if="plan.annual" class="plan-price__alt">
                  {{ plan.annual }} <span class="plan-price__hint">{{ plan.annualHint }}</span>
                </div>
              </div>
            </div>
            <div class="plan-badges">
              <span class="badge badge--soft">{{ plan.badge }}</span>
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
                  :disabled="isAuthenticated && isCurrentPlan(plan.code)"
                >
                  {{ planActionLabel(plan.code) }}
                </button>
              </div>
            </div>
          </article>
        </div>

        <details class="plan-compare">
          <summary>Порівняти плани</summary>
          <div class="plan-compare__list">
          <div>START: базовий робочий простір для старту практики.</div>
          <div>PRO: основний план для розвитку практики.</div>
          <div>LEADER: масштабування, публічні події та пріоритетна підтримка.</div>
        </div>
      </details>

        <div class="pricing__disclaimer muted">
          <div>Без комісій. Лише підписка.</div>
          <div>Каталог — опційний. Спеціаліст з’являється там лише якщо зробить профіль публічним.</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const isAuthenticated = computed(() => Boolean(auth.accessToken))
const roles = computed(() => auth.me?.user.roles ?? auth.user?.roles ?? [])

const resolveCabinetRoute = () => {
  if (roles.value.includes('SPECIALIST') || roles.value.includes('THERAPIST')) return '/cabinet'
  if (roles.value.includes('CLIENT')) return '/client'
  return '/login'
}

const goToCabinet = async () => {
  if (!auth.accessToken) {
    await router.push('/login')
    return
  }
  if (!auth.me) {
    try {
      await auth.loadMe()
    } catch {
      await router.push('/login')
      return
    }
  }
  await router.push(resolveCabinetRoute())
}

function onLogout() {
  auth.logout()
  router.push('/')
}

const roleCards = [
  {
    title: 'Приватна практика',
    description: 'Налаштуйте власний розклад, ведіть клієнтів і керуйте сесіями у зручному темпі.',
  },
  {
    title: 'Коуч / наставник',
    description: 'Заплановані зустрічі, нотатки та історія роботи — все під рукою.',
  },
  {
    title: 'Викладач',
    description: 'Плануйте консультації, ведіть записи та залишайте відкритими лише потрібні слоти.',
  },
  {
    title: 'Консультант',
    description: 'Структуруйте запити, плануйте навантаження та відстежуйте прогрес клієнтів.',
  },
]

const activeRoleIndex = ref(0)

const benefits = [
  'Розклад і слоти',
  'Клієнтська база (CRM)',
  'Заплановані сесії та запити',
  'Публічний профіль (опційно)',
  'Чат і повідомлення',
  'Доступи та плани',
]

type PlanCode = 'START' | 'PRO' | 'LEADER'

const pricingPlans = [
  {
    code: 'START',
    title: 'Start',
    subtitle: '',
    price: '€0/міс',
    annual: '',
    annualHint: '',
    badge: 'Для старту',
    features: ['3 активні клієнти', '1:1 сесії', 'Слоти та бронювання', 'Базовий кабінет'],
    note: 'Для старту та тестування.',
  },
  {
    code: 'PRO',
    title: 'Pro',
    subtitle: '',
    price: '€29 / місяць',
    annual: 'або €290 / рік',
    annualHint: '2 місяці безкоштовно',
    badge: 'Рекомендовано',
    features: [
      '20 активних клієнтів',
      '1:1 + парна терапія',
      'Групові кімнати',
      'Перенесення сесій та нагадування',
      'Авторський журнал (Незабаром)',
      'Розширена аналітика (Незабаром)',
    ],
    note: 'Для стабільної практики та зростання.',
  },
  {
    code: 'LEADER',
    title: 'Leader',
    subtitle: '',
    price: '€49 / місяць',
    annual: 'або €490 / рік',
    annualHint: '2 місяці безкоштовно',
    badge: 'Масштабування',
    features: [
      'Безліміт активних клієнтів',
      'Усе з PRO',
      'Broadcast + публічні події',
      'Пріоритетна підтримка',
    ],
    note: 'Для масштабування та публічних форматів.',
  },
] as const

const currentPlan = computed<PlanCode | null>(() => {
  const raw = auth.me?.effective_entitlements?.plan
  if (!raw) return null
  return ['START', 'PRO', 'LEADER'].includes(raw) ? (raw as PlanCode) : null
})

const isCurrentPlan = (code: PlanCode) => currentPlan.value === code

const planActionLabel = (code: PlanCode) => {
  if (!isAuthenticated.value) {
    if (code === 'START') return 'Почати'
    return 'Розширити практику'
  }
  if (isCurrentPlan(code)) return 'Поточний'
  return 'Розширити практику'
}
</script>

<style scoped>
.home {
  padding: 32px 0 64px;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
  display: grid;
  gap: 32px;
}

.hero {
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 0.9fr);
  align-items: stretch;
}

.hero__content {
  display: grid;
  gap: 16px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.24em;
  font-size: 11px;
  color: var(--muted);
}

.hero__title {
  font-size: clamp(28px, 3.2vw, 44px);
  line-height: 1.1;
  margin: 0;
}

.hero__subtitle {
  margin: 0;
  color: var(--muted);
  max-width: 560px;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.hero__catalog {
  display: grid;
  gap: 6px;
}

.link {
  color: var(--primary-hover);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.hint {
  color: var(--muted);
  font-size: 13px;
}

.hero__panel {
  display: grid;
  gap: 16px;
}

.panel__title {
  font-family: var(--font-display);
  font-size: 18px;
}

.panel__text {
  margin: 0;
  color: var(--muted);
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.chip {
  border-radius: 999px;
  border: 1px solid var(--line);
  background: #fff;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}

.chip--active {
  border-color: var(--accent-soft);
  background: rgba(77, 122, 157, 0.12);
}

.benefits {
  display: grid;
  gap: 16px;
}

.section-title {
  margin: 0;
  font-size: 24px;
}

.benefits__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.benefit-card {
  padding: 16px;
  font-weight: 600;
}

.how {
  display: grid;
  gap: 16px;
}

.how__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.how-card {
  padding: 16px;
  display: grid;
  gap: 10px;
}

.how-card__step {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(77, 122, 157, 0.12);
  color: var(--accent);
  display: grid;
  place-items: center;
  font-weight: 700;
}

.how-card__title {
  font-weight: 700;
}

.how-card__text {
  margin: 0;
  color: var(--muted);
}

.how-card__note {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}

.catalog {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.muted {
  color: var(--muted);
}

.pricing {
  display: grid;
  gap: 16px;
}

.pricing__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.pricing__note {
  font-size: 13px;
  color: var(--muted);
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(77, 122, 157, 0.12);
}

.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.plan-card {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--card);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: var(--shadow-1);
}

.plan-card--current {
  background: var(--surface-2);
  border-color: color-mix(in srgb, var(--primary) 30%, var(--border));
}

.plan-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.plan-title {
  font-weight: 700;
  font-size: 18px;
}

.plan-subtitle {
  color: var(--muted);
  font-size: 14px;
  margin-top: 4px;
}

.plan-price {
  font-weight: 700;
  font-size: 18px;
  color: var(--ink);
  white-space: nowrap;
}

.plan-price__main {
  font-weight: 700;
}

.plan-price__alt {
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
}

.plan-price__hint {
  color: #8a6b2f;
  font-weight: 600;
}

.plan-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.badge--soft {
  background: rgba(77, 122, 157, 0.12);
  color: var(--ink);
}

.badge--outline {
  border: 1px solid color-mix(in srgb, var(--primary) 35%, var(--border));
  color: var(--ink);
  background: transparent;
}

.plan-list {
  display: grid;
  gap: 8px;
  padding-left: 16px;
  margin: 0;
  color: var(--muted);
  flex: 1;
}

.plan-foot {
  display: grid;
  gap: 12px;
}

.plan-action .btn {
  width: 100%;
}

.plan-compare {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 12px 16px;
  background: var(--surface-2);
}

.plan-compare summary {
  cursor: pointer;
  font-weight: 600;
}

.plan-compare__list {
  display: grid;
  gap: 6px;
  margin-top: 10px;
  color: var(--muted);
}

.pricing__disclaimer {
  margin: 0;
}

@media (max-width: 980px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .catalog {
    flex-direction: column;
    align-items: flex-start;
  }

  .pricing__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
