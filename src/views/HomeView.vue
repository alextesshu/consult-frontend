<template>
  <section class="home home-agency">
    <div class="container container--agency">
      <section class="hero-agency reveal">
        <div class="hero-agency__text">
          <div class="eyebrow">Pro Consult</div>
          <h1 class="hero-agency__title">
            Все для власної практики і професійних зустрічей
          </h1>
          <p class="hero-agency__subtitle">
            Для психологів, коучів, наставників, викладачів та консультантів. Запис, сесії, доступність, матеріали й робота з клієнтами — в одному місці.
          </p>
          <p class="hero-agency__subtitle">
            Жодних комісій за сесії — лише підписка. Умови співпраці з клієнтом ви
            встановлюєте самі.
          </p>
          <div class="hero-agency__actions">
            <button v-if="isAuthenticated" class="btn btn--primary" type="button" @click="goToCabinet">
              Перейти в кабінет
            </button>
            <RouterLink v-if="!isAuthenticated" class="btn btn--primary" to="/signup">
              Створити кабінет
            </RouterLink>
            <RouterLink v-if="!isAuthenticated" class="btn btn--ghost" to="/login">
              Увійти
            </RouterLink>
          </div>
        </div>
        <div class="hero-agency__media">
          <div class="media-frame">
            <img :src="heroImage" alt="Консультація" />
          </div>
        </div>
      </section>

      <section class="brand-strip">
        <div class="brand-strip__item">Без комісій</div>
        <div class="brand-strip__item">Контроль доступу</div>
        <div class="brand-strip__item">Аналітика практики</div>
        <div class="brand-strip__item">Зашифровані нотатки</div>
      </section>

      <section class="section-block reveal" id="features">
        <div class="section-head">
          <h2 class="section-title">Ключові можливості</h2>
          <p class="muted">
            Інструменти, що перетворюють практику на керований і прозорий процес.
          </p>
        </div>
        <div class="feature-grid">
          <div v-for="item in benefits" :key="item" class="card feature-card">
            <div class="feature-card__icon"></div>
            <div class="feature-card__title">{{ item }}</div>
            <div class="muted">
              Автоматизація рутинних задач без втрати людяності.
            </div>
          </div>
        </div>
      </section>

      <section class="split-block reveal">
        <div class="split-block__media">
          <div class="media-frame media-frame--tall">
            <img :src="workflowImage" alt="Робочий процес спеціаліста" />
          </div>
        </div>
        <div class="split-block__content">
          <h2 class="section-title section-title--left">Як це працює</h2>
          <div class="how-list">
            <div class="how-item">
              <span class="how-item__num">1</span>
              <div>
                <div class="how-item__title">Створіть кабінет спеціаліста</div>
                <div class="muted">Профіль, налаштування й правила роботи — у вашому контролі.</div>
              </div>
            </div>
            <div class="how-item">
              <span class="how-item__num">2</span>
              <div>
                <div class="how-item__title">Організуйте сесії та заявки</div>
                <div class="muted">Розклад, перенос і підтвердження — без хаосу й ручної плутанини.</div>
              </div>
            </div>
            <div class="how-item">
              <span class="how-item__num">3</span>
              <div>
                <div class="how-item__title">Відстежуйте прогрес і розвиток</div>
                <div class="muted">Аналітика, історія й нотатки допомагають зростати системно.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section-block reveal" id="pricing">
        <div class="section-head section-head--center">
          <h2 class="section-title">Оберіть план під свою практику</h2>
          <p class="muted">Без комісій за сесії. Ви самі встановлюєте умови співпраці з клієнтами.</p>
          <p class="pricing__definition">Усі плани включають публічний профіль, запис через вільні вікна та базове керування сесіями.</p>
          <div class="pricing-toggle" role="group" aria-label="Режим оплати">
            <button
              type="button"
              class="pricing-toggle__btn"
              :class="{ 'is-active': billingCycle === 'monthly' }"
              @click="billingCycle = 'monthly'"
            >
              Щомісяця
            </button>
            <button
              type="button"
              class="pricing-toggle__btn"
              :class="{ 'is-active': billingCycle === 'annual' }"
              @click="billingCycle = 'annual'"
            >
              Щороку
            </button>
          </div>
        </div>
        <div class="plan-grid plan-grid--editorial">
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
                <div class="plan-price__main">{{ planDisplayPrice(plan) }}</div>
                <div v-if="billingCycle === 'annual' && plan.annual_monthly_price" class="plan-price__alt">
                  {{ plan.annual_one_shot }} <span class="plan-price__hint">{{ plan.annual_hint }}</span>
                </div>
                <div v-else-if="billingCycle === 'annual'" class="plan-price__alt">
                  {{ plan.annual_fallback_note }}
                </div>
                <div v-else-if="plan.annual_monthly_price" class="plan-price__alt">
                  Або {{ plan.annual_monthly_price }} при оплаті за рік
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
      </section>

      <section class="split-block reveal">
        <div class="split-block__content">
          <h2 class="section-title section-title--left">Цінності</h2>
          <div class="values-list">
            <div class="values-item">
              <div class="values-item__title">Спеціаліст у центрі</div>
              <div class="muted">Ваші правила, ваші умови, ваше рішення.</div>
            </div>
            <div class="values-item">
              <div class="values-item__title">Прозорість</div>
              <div class="muted">Підписка без прихованих комісій та сюрпризів.</div>
            </div>
            <div class="values-item">
              <div class="values-item__title">Системність</div>
              <div class="muted">Структура й аналітика дають опору для розвитку.</div>
            </div>
          </div>
        </div>
        <div class="split-block__media">
          <div class="media-frame media-frame--tall">
            <img :src="valuesImage" alt="Командна робота" />
          </div>
        </div>
      </section>

      <section class="section-block reveal" id="faq">
        <div class="section-head">
          <h2 class="section-title">FAQ</h2>
          <p class="muted">Короткі відповіді на важливі питання.</p>
        </div>
        <div class="faq-grid">
          <div class="card faq-card">
            <div class="faq-card__title">Чи є комісія за сесії?</div>
            <div class="muted">Ні. Сервіс працює за підпискою без відсотків.</div>
          </div>
          <div class="card faq-card">
            <div class="faq-card__title">Як визначається активний клієнт?</div>
            <div class="muted">Це клієнт із завершеною сесією за останні 30 днів.</div>
          </div>
          <div class="card faq-card">
            <div class="faq-card__title">Чи є річна оплата для Start?</div>
            <div class="muted">Ні. Start доступний лише у щомісячному форматі.</div>
          </div>
        </div>
      </section>

    </div>
  </section>
</template>


<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const heroImage = new URL('../assets/therapy/84f4d9fb-6e66-4b3b-bce9-caa039d081a0.jpg', import.meta.url).href
const workflowImage = new URL('../assets/therapy/47b34bc8-1ce4-4ee3-92ff-41c3a0c14f6b.jpg', import.meta.url).href
const valuesImage = new URL('../assets/therapy/f066edb1-65e7-419d-8a0d-0940a3526583.jpg', import.meta.url).href

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


const benefits = [
  'Керування сесіями й слотами',
  'Клієнтська база (CRM)',
  'Бронювання та перенесення',
  'Групові онлайн-події',
  'Приватні нотатки',
  'Аналітика практики',
  'Авторський журнал',
  'Чат і повідомлення',
]


type PlanCode = 'START' | 'PRO' | 'LEADER'
type BillingCycle = 'monthly' | 'annual'
type PricingPlan = {
  code: PlanCode
  title: string
  subtitle: string
  monthly_price: string
  annual_monthly_price: string | null
  annual_one_shot: string | null
  annual_hint: string | null
  annual_fallback_note: string | null
  badge: string
  features: string[]
  note: string
}

const billingCycle = ref<BillingCycle>('monthly')

const pricingPlans: PricingPlan[] = [
  {
    code: 'START',
    title: 'Start',
    subtitle: 'Для старту практики',
    monthly_price: '€10 / міс',
    annual_monthly_price: null,
    annual_one_shot: null,
    annual_hint: null,
    annual_fallback_note: 'Лише щомісячна оплата',
    badge: 'Старт',
    features: [
      'До 5 активних клієнтів',
      'Публічний профіль specialist-а',
      'Запис через вільні вікна',
      'Базові сесії, доступність і Time Off',
      'Базові нагадування та сповіщення',
      'Зовнішнє посилання на онлайн-зустріч',
      'Без комісій за сесії',
    ],
    note: 'Підійде, якщо ви тільки починаєте і хочете приймати перших клієнтів онлайн.',
  },
  {
    code: 'PRO',
    title: 'Pro',
    subtitle: 'Найкращий вибір для стабільної практики',
    monthly_price: '€24 / міс',
    annual_monthly_price: '€20 / міс',
    annual_one_shot: 'Оплата за рік — €240 одним платежем',
    annual_hint: '2 місяці безкоштовно',
    annual_fallback_note: null,
    badge: 'Рекомендовано',
    features: [
      'До 20 активних клієнтів',
      'Recurring sessions',
      'Smart reschedule suggestions',
      'Повний модуль нагадувань і сповіщень',
      'Авторський журнал / Серії',
      'Групові онлайн-події',
      'Базова аналітика',
      'Відео у публічному профілі',
    ],
    note: 'Усе, що потрібно для регулярної роботи з клієнтами, сесіями, перенесеннями та матеріалами.',
  },
  {
    code: 'LEADER',
    title: 'Leader',
    subtitle: 'Для зростання, масштабу і максимуму можливостей',
    monthly_price: '€59 / міс',
    annual_monthly_price: '€49 / міс',
    annual_one_shot: 'Оплата за рік — €590 одним платежем',
    annual_hint: '2 місяці безкоштовно',
    annual_fallback_note: null,
    badge: 'Масштабування',
    features: [
      'До 60 активних клієнтів',
      'Усе з Pro',
      'Розширена аналітика',
      'Leader-інсайти та рекомендації',
      'Анонси подій у стрічці — скоро',
      'Пріоритетна підтримка — скоро',
      'Ранній доступ до нових можливостей',
    ],
    note: 'Для specialist-ів, яким потрібні масштаб, інсайти та преміальні можливості.',
  },
]

const currentPlan = computed<PlanCode | null>(() => {
  const raw = auth.me?.effective_entitlements?.plan
  if (!raw) return null
  return ['START', 'PRO', 'LEADER'].includes(raw) ? (raw as PlanCode) : null
})

const isCurrentPlan = (code: PlanCode) => currentPlan.value === code

const planDisplayPrice = (plan: PricingPlan) => {
  if (billingCycle.value === 'annual' && plan.annual_monthly_price) {
    return plan.annual_monthly_price
  }
  return plan.monthly_price
}

const planActionLabel = (code: PlanCode) => {
  if (!isAuthenticated.value) {
    if (code === 'START') return 'Почати'
    if (code === 'PRO') return 'Обрати Pro'
    return 'Перейти на Leader'
  }
  if (isCurrentPlan(code)) return 'Поточний'
  if (code === 'PRO') return 'Обрати Pro'
  if (code === 'LEADER') return 'Перейти на Leader'
  return 'Почати'
}

let revealObserver: IntersectionObserver | null = null

onMounted(() => {
  const targets = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))
  const staggerGroups = [
    '.trust__grid .trust-card',
    '.benefits__grid .benefit-card',
    '.how__grid .how-card',
    '.foundation__grid .foundation-card',
    '.audience__grid .audience-card',
    '.plan-grid .plan-card',
  ]
  staggerGroups.forEach((selector) => {
    document.querySelectorAll<HTMLElement>(selector).forEach((el, index) => {
      el.style.transitionDelay = `${Math.min(index * 80, 320)}ms`
    })
  })
  if (!targets.length) return
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          revealObserver?.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
  )
  targets.forEach((el) => revealObserver?.observe(el))
})

onBeforeUnmount(() => {
  revealObserver?.disconnect()
  revealObserver = null
})
</script>

<style scoped>
.home-agency {
  padding: 72px 0 120px;
  font-size: 15px;
  position: relative;
  isolation: isolate;
}

.home-agency::before {
  content: "";
  position: absolute;
  inset: -160px 0;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(1100px 520px at 12% 38%, rgba(2, 54, 97, 0.12), transparent 72%),
    radial-gradient(980px 520px at 88% 42%, rgba(219, 82, 39, 0.12), transparent 72%),
    linear-gradient(
      180deg,
      rgba(247, 248, 251, 0.8) 0%,
      rgba(248, 249, 251, 0.92) 28%,
      rgba(248, 249, 251, 0.92) 72%,
      rgba(247, 248, 251, 0.8) 100%
    );
}

.container--agency {
  width: min(1200px, 92vw);
  margin: 0 auto;
  display: grid;
  gap: 96px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.32em;
  font-size: 11px;
  color: var(--muted);
}

.hero-agency {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 64px;
  align-items: center;
}

.hero-agency__title {
  font-size: clamp(36px, 4.2vw, 64px);
  line-height: 1.12;
  letter-spacing: -0.02em;
  margin: 20px 0 20px;
  max-width: 18ch;
}

.hero-agency__subtitle {
  margin: 0 0 16px;
  color: var(--muted);
  font-size: 15px;
  line-height: 1.7;
  max-width: 52ch;
}

.hero-agency__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 24px;
}

.hero-agency__actions .btn {
  min-height: 41px;
  padding: 0 18px;
  font-size: 14px;
  border-radius: 10px;
}

.hero-agency__actions .btn--primary {
  border-radius: 10px;
  box-shadow: none;
  background: #114036;
  border-color: color-mix(in srgb, #114036 65%, transparent);
}

.hero-agency__actions .btn--primary:hover,
.hero-agency__actions .btn--primary:focus-visible {
  background: color-mix(in srgb, #114036 88%, #000000);
  box-shadow: none;
}


.home-agency :global(.muted) {
  font-size: 14px;
}

.media-frame {
  border-radius: var(--radius-lg);
  border: 1px solid color-mix(in srgb, var(--accent) 12%, var(--border));
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.7), rgba(118, 130, 142, 0.12));
  aspect-ratio: 16 / 9;
  max-width: 560px;
  width: 100%;
  overflow: hidden;
  box-shadow: var(--shadow);
}

.media-frame img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.media-frame--tall {
  aspect-ratio: 16 / 9;
  max-width: 520px;
}

.brand-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 11px;
  margin-top: -32px;
}

.brand-strip__item {
  border-top: 1px solid var(--border);
  padding-top: 12px;
  color: var(--muted);
}

.section-block {
  display: grid;
  gap: 32px;
}

.section-head {
  display: grid;
  gap: 12px;
}

.section-title {
  margin: 0;
  font-size: clamp(28px, 3.2vw, 40px);
  line-height: 1.2;
}

.section-title--left {
  text-align: left;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 22px;
}

.feature-card {
  padding: 26px;
  display: grid;
  gap: 12px;
  min-height: 180px;
}

.feature-card__icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--accent) 20%, transparent);
}

.feature-card__title {
  font-weight: 600;
}

.split-block {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 64px;
  align-items: stretch;
}

.split-block__content {
  display: grid;
  gap: 16px;
}

.split-block__media {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
}

.how-list {
  display: grid;
  gap: 20px;
}

.how-item {
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 12px;
}

.how-item__num {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--primary) 20%, transparent);
  display: grid;
  place-items: center;
  font-weight: 600;
}

.how-item__title {
  font-weight: 600;
}

.plan-grid--editorial {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.pricing__definition {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}

.section-head--center {
  text-align: center;
}

.pricing-toggle {
  margin: 10px auto 0;
  display: inline-flex;
  gap: 6px;
  padding: 4px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: #fff;
  width: fit-content;
}

.pricing-toggle__btn {
  border: 1px solid transparent;
  background: transparent;
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 13px;
  color: var(--ink);
  cursor: pointer;
}

.pricing-toggle__btn.is-active {
  border-color: color-mix(in srgb, var(--primary) 35%, var(--border));
  background: color-mix(in srgb, var(--primary) 10%, transparent);
  font-weight: 600;
}

.plan-grid {
  display: grid;
  gap: 18px;
}

.plan-card {
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 22px;
  background: color-mix(in srgb, var(--surface) 80%, #ffffff);
  display: grid;
  gap: 12px;
  box-shadow: var(--shadow-1);
}

.plan-card--current {
  border-color: color-mix(in srgb, var(--primary) 45%, var(--border));
  box-shadow: 0 12px 24px rgba(2, 54, 97, 0.18);
}

.plan-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.plan-title {
  font-weight: 700;
  font-size: 18px;
}

.plan-price {
  font-weight: 700;
  text-align: right;
}

.plan-price__alt {
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
}

.plan-price__hint {
  color: var(--accent);
  font-weight: 600;
}

.plan-badges {
  display: flex;
  gap: 8px;
}

.plan-list {
  display: grid;
  gap: 6px;
  margin: 0;
  padding-left: 16px;
  color: var(--muted);
}

.plan-foot {
  display: grid;
  gap: 10px;
}

.plan-action .btn {
  width: 100%;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border: 1px solid color-mix(in srgb, var(--primary) 25%, var(--border));
  background: color-mix(in srgb, var(--primary) 15%, transparent);
}

.values-list {
  display: grid;
  gap: 20px;
}

.values-item {
  padding: 16px 18px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: color-mix(in srgb, var(--surface) 75%, #fff);
}

.values-item__title {
  font-weight: 600;
  margin-bottom: 6px;
}

.faq-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.faq-card {
  padding: 18px;
  min-height: 140px;
}

.faq-card__title {
  font-weight: 600;
  margin-bottom: 6px;
}

@media (max-width: 960px) {
  .hero-agency,
  .split-block {
    grid-template-columns: 1fr;
  }
}
</style>
