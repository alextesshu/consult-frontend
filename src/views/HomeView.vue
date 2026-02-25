<template>
  <section class="home">
    <div class="container">
      <div class="hero reveal snap-section">
        <div class="hero__content">
          <img class="hero__logo hero__logo--small" src="../assets/consult-logo_2026-02-24-2135_black.png" alt="Pro Consult" />
          <div class="eyebrow">З повагою до практики</div>
          <h1 class="hero__title">Простір для ведення консультацій</h1>
          <p class="hero__subtitle">
            Ми створюємо сервіс для зручної та ефективної взаємодії між спеціалістом та клієнтом.
          </p>
          <p class="hero__slogan">
            Сесії, групи, нотатки, запити та аналітика — в одному кабінеті. Рішення про співпрацю та оплату
            приймаєте ви.
          </p>
          <div class="hero__catalog">
            <RouterLink class="link" :to="catalogRoute">Шукаєте спеціаліста? → Перейти до каталогу</RouterLink>
            <div class="hint">
              Перегляд каталогу доступний лише для авторизованих клієнтів.
            </div>
          </div>
          <div v-if="!isAuthenticated" class="hero__notice card">
            <div class="hero__notice-title">Стартуйте безкоштовно вже сьогодні</div>
            <div class="muted">
              Простір для ведення практики доступний безкоштовно. Коли будете готові масштабуватись,
              підписка відкриє додаткові можливості та дасть відчутний буст.
            </div>
          </div>
        </div>
        <div class="hero__panel card">
          <div class="hero__panel-copy">
            <div class="panel__title">Потужні інструменти для ефективної практики</div>
            <p class="panel__text">
              Плануйте сесії, керуйте клієнтами, фіксуйте історію та бачте прогрес — усе в одному робочому просторі.
            </p>
            <div class="hero__panel-photo" aria-hidden="true">
              <div class="hero__panel-photo-label">Фото буде тут</div>
              <div class="hero__panel-photo-hint">Теплі тони · консультація зі спеціалістом</div>
            </div>
          </div>
          <div class="hero__panel-actions-block">
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
            <p class="panel__text panel__text--muted">
              {{ roleCards[activeRoleIndex]?.description || '' }}
            </p>
            <div class="hero__panel-actions">
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
          </div>
        </div>
      </div>

      <div class="trust reveal snap-section">
        <h2 class="section-title">Чому це безпечно</h2>
        <div class="trust__grid">
          <div v-for="item in trustPoints" :key="item.title" class="card trust-card">
            <div class="trust-card__title">{{ item.title }}</div>
            <div class="muted">{{ item.text }}</div>
          </div>
        </div>
      </div>

      <div class="system-foundation reveal snap-section">
        <div id="features" class="benefits">
          <h2 class="section-title">Система для щоденної практики</h2>
          <div class="benefits__grid">
            <div v-for="item in benefits" :key="item" class="card benefit-card">
              {{ item }}
            </div>
          </div>
        </div>

        <div class="foundation">
          <h2 class="section-title">Міцний фундамент</h2>
          <div class="foundation__grid">
            <div v-for="item in foundationPoints" :key="item.title" class="card foundation-card">
              <span class="foundation-card__badge">{{ item.badge }}</span>
              <div class="foundation-card__title">{{ item.title }}</div>
              <div class="muted">{{ item.text }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="how reveal snap-section">
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
            <div class="how-card__title">Проводьте сесії та приймайте запити</div>
            <p class="how-card__text">
              Сесії фіксуються, нотатки зберігаються, а клієнти бачать статуси у своєму кабінеті.
            </p>
            <p class="how-card__note">
              Каталог і публічність — опційні.
            </p>
          </div>
        </div>
      </div>

      <div class="audience reveal snap-section">
        <h2 class="section-title">Для кого</h2>
        <div class="audience__grid" :class="{ 'audience__grid--four': audienceCards.length === 4 }">
          <div v-for="item in audienceCards" :key="item.title" class="card audience-card">
            <div class="audience-card__title">{{ item.title }}</div>
            <div class="muted">{{ item.description }}</div>
          </div>
        </div>
      </div>

      <div id="pricing" class="pricing reveal snap-section">
        <div class="pricing__header">
          <div>
            <h2 class="section-title">Підписки</h2>
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
          <summary>Порівняти підписки</summary>
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

      <footer class="home-footer">
        <div class="home-footer__content">
          <div class="home-footer__brand">Pro Consult</div>
          <div class="home-footer__meta">
            <span>© 2026</span>
            <span>Організація консультацій без посередників</span>
          </div>
        </div>
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const isAuthenticated = computed(() => Boolean(auth.accessToken))
  const roles = computed(() => auth.me?.user.roles ?? auth.user?.roles ?? [])
  const isClient = computed(() => roles.value.includes('CLIENT'))
  const catalogRoute = computed(() => (isClient.value ? '/specialists' : '/signup-client'))

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
    title: 'Коуч / Наставник',
    description: 'Заплановані зустрічі, нотатки та історія роботи — все під рукою.',
  },
  {
    title: 'Викладання уроків',
    description: 'Плануйте консультації, ведіть записи та залишайте відкритими лише потрібні слоти.',
  },
  {
    title: 'Інші консультації',
    description: 'Структуруйте запити, плануйте навантаження та відстежуйте прогрес клієнтів.',
  },
]

const activeRoleIndex = ref(0)

const benefits = [
  'Керована система сесій',
  'Клієнтська база (CRM)',
  'Запити на бронювання та перенессення',
  'Ваш особистий сетінг',
  'Аналітика вашої практики',
  'Авторський журнал',
  'Групові кімнати',
  'Приватні нотатки',
  'Чат і повідомлення',
]

const trustPoints = [
  {
    title: 'Дані належать спеціалісту',
    text: 'Сервіс не втручається у стосунки з клієнтами та не впливає на рішення.',
  },
  {
    title: 'Ніяких комісій',
    text: 'Лише підписка. Оплата й умови співпраці — між вами та клієнтом.',
  },
  {
    title: 'Контроль доступу',
    text: 'Ролі, доступи, приватні нотатки й обмеження керуються вами.',
  },
]

const foundationPoints = [
  {
    badge: 'ДОСТУПИ',
    title: 'Доступи та ліміти під контролем',
    text: 'Система чітко показує, що доступно саме вам, і не ламає вже створені сесії.',
  },
  {
    badge: 'БІЛІНГ',
    title: 'Оплати та запити працюють стабільно',
    text: 'Платіжні події не губляться, а звернення можна повторювати без ризику.',
  },
  {
    badge: 'ПОДІЇ',
    title: 'Прозора історія дій',
    text: 'Усі важливі зміни фіксуються, тому система поводиться передбачувано.',
  },
]

const audienceCards = roleCards

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
.home {
  padding: 32px 0 64px;
  font-size: 14px;
}

:global(html),
:global(body) {
  scroll-snap-type: y proximity;
  scroll-behavior: smooth;
  scroll-padding-top: 72px;
}

.container {
  width: 80%;
  max-width: 80vw;
  margin: 0 auto;
  padding: 0 24px;
  display: grid;
  gap: 0;
}

.reveal {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.35s ease, transform 0.35s ease;
  will-change: opacity, transform;
}

.reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.snap-section {
  scroll-snap-align: start;
  scroll-snap-stop: always;
  min-height: auto;
}

.snap-section:not(.hero) {
  display: grid;
  align-content: center;
  padding: 0;
}

.reveal.is-visible .trust-card,
.reveal.is-visible .benefit-card,
.reveal.is-visible .how-card,
.reveal.is-visible .foundation-card,
.reveal.is-visible .audience-card,
.reveal.is-visible .plan-card {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .trust-card,
  .benefit-card,
  .how-card,
  .foundation-card,
  .audience-card,
  .plan-card {
    opacity: 1;
    transform: none;
    transition: none;
  }
}

.hero {
  display: grid;
  gap: 32px;
  grid-template-columns: 1fr;
  align-items: center;
  justify-items: center;
  min-height: auto;
  padding-bottom: 0;
}

.hero__content {
  display: grid;
  gap: 16px;
  text-align: center;
  justify-items: center;
  max-width: 820px;
  padding-top: 48px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.24em;
  font-size: 12px;
  color: var(--muted);
}

.hero__logo {
  width: clamp(160px, 20vw, 260px);
  height: auto;
  margin-bottom: 10px;
}

.hero__logo--small {
  width: clamp(80px, 10vw, 130px);
}

.hero__title {
  font-size: clamp(40px, 5vw, 78px);
  line-height: 1.05;
  margin: 0;
  font-weight: 300;
}

.hero__subtitle {
  margin: 0;
  color: var(--muted);
  max-width: 640px;
  font-size: clamp(16px, 1.6vw, 22px);
}

.hero__slogan {
  margin: 0;
  max-width: 640px;
  color: var(--muted);
  display: grid;
  gap: 6px;
  font-size: clamp(15px, 1.4vw, 20px);
}

.hero__panel-actions {
  display: grid;
  gap: 12px;
  align-items: center;
  justify-items: stretch;
  margin-top: 0;
}

.hero__catalog {
  display: grid;
  gap: 6px;
  justify-items: center;
}

.hero__notice {
  display: grid;
  gap: 8px;
  text-align: center;
  max-width: 640px;
  padding: 18px 22px;
  background: color-mix(in srgb, var(--surface) 60%, #ffffff);
  border: 1px solid color-mix(in srgb, var(--border) 55%, #ffffff);
  box-shadow: 0 16px 32px rgba(19, 32, 46, 0.1);
}

.hero__notice-title {
  font-weight: 600;
  font-size: 18px;
}

.link {
  color: var(--primary-hover);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.hint {
  color: var(--muted);
  font-size: 12px;
}

.hero__panel {
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  align-items: center;
  width: 100%;
  max-width: 980px;
  background: color-mix(in srgb, var(--surface) 75%, #ffffff);
  border: 1px solid color-mix(in srgb, var(--border) 70%, #ffffff);
  box-shadow: 0 18px 45px rgba(19, 32, 46, 0.12);
  padding: 28px 32px;
}

.hero__panel-copy {
  display: grid;
  gap: 12px;
}

.hero__panel-actions-block {
  display: grid;
  gap: 14px;
}

.panel__title {
  font-family: var(--font-display);
  font-size: 22px;
  text-align: left;
}

.panel__text {
  margin: 0;
  color: var(--muted);
  text-align: left;
  font-size: 15px;
  line-height: 1.6;
}

.panel__text--muted {
  color: color-mix(in srgb, var(--muted) 85%, transparent);
  font-size: 14px;
}

.hero__panel-photo {
  border-radius: 18px;
  border: 1px dashed color-mix(in srgb, var(--accent) 22%, var(--border));
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.5), rgba(253, 240, 213, 0.7));
  min-height: 160px;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 16px;
  color: var(--muted);
}

.hero__panel-photo-label {
  font-weight: 600;
  color: var(--ink);
}

.hero__panel-photo-hint {
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.chip {
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--accent) 18%, var(--border));
  background: #ffffff;
  padding: 10px 20px;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
  box-shadow: 0 10px 22px rgba(19, 32, 46, 0.08);
}

.chip--active {
  border-color: color-mix(in srgb, var(--accent) 35%, var(--border));
  background: color-mix(in srgb, var(--primary-soft) 55%, #ffffff);
}

.benefits {
  display: grid;
  gap: 20px;
  align-content: start;
}

.system-foundation {
  display: grid;
  gap: 16px;
  align-content: start;
  padding: 12px 0;
}

.trust {
  display: grid;
  gap: 12px;
  align-content: start;
  padding: 12px 0;
}

.trust__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 22px;
  align-items: stretch;
  grid-auto-rows: 1fr;
}

.trust-card {
  padding: 28px;
  display: grid;
  gap: 8px;
  min-height: 260px;
  width: 100%;
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.trust-card__title {
  font-weight: 600;
  font-size: 18px;
}

.section-title {
  margin: 22px 0;
  font-size: clamp(30px, 3vw, 40px);
  font-weight: 500;
  text-align: center;
}

.benefits__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 22px;
  align-items: stretch;
  grid-auto-rows: 1fr;
}

.benefit-card {
  padding: 26px;
  font-weight: 500;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 200px;
  width: 100%;
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.how {
  display: grid;
  gap: 12px;
  align-content: start;
  padding: 12px 0;
}

.how__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 22px;
  align-items: stretch;
  grid-auto-rows: 1fr;
}

.how-card {
  padding: 26px;
  display: grid;
  gap: 10px;
  min-height: 260px;
  width: 100%;
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.how-card__step {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(77, 122, 157, 0.12);
  color: var(--accent);
  display: grid;
  place-items: center;
  font-weight: 400;
}

.how-card__title {
  font-weight: 400;
  font-size: 18px;
}

.how-card__text {
  margin: 0;
  color: var(--muted);
}

.how-card__note {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}

.foundation {
  display: grid;
  gap: 20px;
  align-content: start;
}

.foundation__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 22px;
  align-items: stretch;
  grid-auto-rows: 1fr;
}

.foundation-card {
  padding: 28px;
  display: grid;
  gap: 8px;
  min-height: 260px;
  width: 100%;
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.foundation-card__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(77, 122, 157, 0.35);
  background: rgba(77, 122, 157, 0.12);
  color: var(--ink);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  width: fit-content;
}

.foundation-card__title {
  font-weight: 600;
  font-size: 18px;
}

.audience {
  display: grid;
  gap: 12px;
  align-content: start;
  padding: 12px 0;
}

.audience__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 22px;
  align-items: stretch;
  grid-auto-rows: 1fr;
}

.audience__grid--four {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  max-width: 900px;
  margin: 0 auto;
}

.audience-card {
  padding: 28px;
  display: grid;
  gap: 8px;
  min-height: 260px;
  width: 100%;
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.audience-card__title {
  font-weight: 600;
  font-size: 18px;
}

.muted {
  color: var(--muted);
}

.pricing {
  display: grid;
  gap: 12px;
  align-content: start;
  padding: 12px 0;
}

.pricing__header {
  display: grid;
  gap: 8px;
  justify-items: center;
  text-align: center;
}

.pricing__note {
  font-size: 12px;
  color: var(--muted);
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(77, 122, 157, 0.12);
  justify-self: center;
}

.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 22px;
  align-items: stretch;
  grid-auto-rows: 1fr;
}

.plan-card {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--card);
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: var(--shadow-1);
  min-height: 420px;
  width: 100%;
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.trust-card,
.benefit-card,
.how-card,
.foundation-card,
.audience-card,
.plan-card {
  position: relative;
}

.trust-card:hover,
.benefit-card:hover,
.how-card:hover,
.foundation-card:hover,
.audience-card:hover,
.plan-card:hover {
  transform: translateY(-6px) rotate(-0.6deg) scale(1.01);
  border-color: rgba(77, 122, 157, 0.45);
  box-shadow: 0 20px 36px rgba(16, 33, 50, 0.18);
  animation: card-wiggle 0.4s ease-in-out;
}

.trust-card:hover::after,
.benefit-card:hover::after,
.how-card:hover::after,
.foundation-card:hover::after,
.audience-card:hover::after,
.plan-card:hover::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  border: 1px solid rgba(77, 122, 157, 0.35);
  pointer-events: none;
}

@keyframes card-wiggle {
  0% {
    transform: translateY(-4px) rotate(0deg) scale(1.01);
  }
  40% {
    transform: translateY(-7px) rotate(-0.8deg) scale(1.01);
  }
  70% {
    transform: translateY(-5px) rotate(0.5deg) scale(1.01);
  }
  100% {
    transform: translateY(-6px) rotate(-0.6deg) scale(1.01);
  }
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

.home-footer {
  margin-top: 48px;
  padding: 18px 0 28px;
  border-top: 1px solid rgba(0, 48, 73, 0.12);
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(6px);
}

.home-footer__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: var(--muted);
}

.home-footer__brand {
  font-weight: 600;
  color: var(--ink);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 11px;
}

.home-footer__meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 980px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .hero__panel {
    grid-template-columns: 1fr;
  }

  .panel__title,
  .panel__text {
    text-align: center;
  }

  .hero__panel-copy,
  .hero__panel-actions-block {
    justify-items: center;
    text-align: center;
  }

  .hero__panel-actions {
    justify-items: center;
  }

  .pricing__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .home-footer__content {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
