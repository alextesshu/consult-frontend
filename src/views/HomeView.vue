<template>
  <section class="home home-agency">
    <div class="container container--agency">
      <section class="hero-agency reveal">
        <div class="hero-agency__text">
          <div class="eyebrow">PRO CONSULT</div>
          <h1 class="hero-agency__title">
            Керування практикою. Простір, що працює на вас
          </h1>
          <p class="hero-agency__subtitle">
            Для психологів, коучів, консультантів, наставників і викладачів, які хочуть вести практику системно,
            красиво представляти себе онлайн і працювати без комісії за сесію.
          </p>
          <div class="hero-agency__actions">
            <button v-if="isAuthenticated" class="btn btn--primary" type="button" @click="goToCabinet">
              Перейти в кабінет
            </button>
            <RouterLink v-else class="btn btn--primary" to="/signup">
              Створити кабінет
            </RouterLink>
            <a class="btn btn--ghost" href="#features">
              Переглянути можливості
            </a>
          </div>
        </div>
        <div class="hero-agency__media">
          <div class="media-frame">
            <img :src="heroImage" alt="Робочий процес спеціаліста" />
          </div>
        </div>
      </section>

      <section class="value-strip reveal" aria-label="Ключова цінність PRO CONSULT">
        <div class="value-strip__item">Без комісії за сесію</div>
        <div class="value-strip__item">Ваші правила роботи</div>
        <div class="value-strip__item">Публічний профіль для клієнтів</div>
        <div class="value-strip__item">Сесії, матеріали й нотатки в одному місці</div>
      </section>

      <section class="section-block section-block--compact reveal" id="for-whom">
        <div class="section-head">
          <h2 class="section-title section-title--mid">
            Для спеціалістів, яким важливо не лише працювати системно, а й бути впізнаваними
          </h2>
        </div>
        <div class="role-list">
          <span v-for="role in specialistRoles" :key="role" class="role-list__item">{{ role }}</span>
        </div>
      </section>

      <section class="profile-showcase reveal" id="public-profile">
        <div class="profile-showcase__media">
          <div class="media-frame media-frame--portrait">
            <img :src="profileImage" alt="Публічний профіль спеціаліста" />
          </div>
        </div>
        <div class="profile-showcase__content">
          <h2 class="section-title section-title--left">
            Ваш публічний профіль — не просто анкета, а простір для знайомства з вами
          </h2>
          <p class="profile-showcase__text">
            Описуйте свій підхід, показуйте формат роботи, діліться матеріалами й давайте клієнтам зрозумілий спосіб
            записатися.
          </p>
          <div class="profile-points">
            <div class="profile-point">
              <div class="profile-point__title">Власна подача</div>
              <div class="muted">Покажіть досвід, стиль роботи й ключові напрямки в єдиній структурі.</div>
            </div>
            <div class="profile-point">
              <div class="profile-point__title">Посилання, яким можна ділитися</div>
              <div class="muted">Надсилайте один лінк у месенджері, соцмережах або на сайті.</div>
            </div>
            <div class="profile-point">
              <div class="profile-point__title">Запис без зайвого тертя</div>
              <div class="muted">Клієнт одразу бачить формат, умови та вільні вікна для запису.</div>
            </div>
          </div>
        </div>
      </section>

      <section class="section-block reveal" id="features">
        <div class="section-head">
          <h2 class="section-title">Можливості, що тримають практику в системі</h2>
          <p class="muted">
            Усі ключові інструменти PRO CONSULT зібрані в одному робочому потоці без дублювання між сервісами.
          </p>
        </div>
        <div class="pillar-grid">
          <article v-for="pillar in valuePillars" :key="pillar.title" class="card pillar-card">
            <h3 class="pillar-card__title">{{ pillar.title }}</h3>
            <p class="muted">{{ pillar.copy }}</p>
          </article>
        </div>
      </section>

      <section class="split-block reveal">
        <div class="split-block__content">
          <h2 class="section-title section-title--left">Як це працює</h2>
          <div class="how-list">
            <div class="how-item">
              <span class="how-item__num">1</span>
              <div>
                <div class="how-item__title">Створіть профіль і налаштуйте практику</div>
                <div class="muted">Додайте формат роботи, графік, правила запису й умови співпраці.</div>
              </div>
            </div>
            <div class="how-item">
              <span class="how-item__num">2</span>
              <div>
                <div class="how-item__title">Діліться профілем і приймайте записи</div>
                <div class="muted">Публічне посилання допомагає клієнтам швидко зрозуміти ваш підхід і записатися.</div>
              </div>
            </div>
            <div class="how-item">
              <span class="how-item__num">3</span>
              <div>
                <div class="how-item__title">Ведіть сесії, матеріали й розвиток системно</div>
                <div class="muted">Працюйте з історією взаємодії, нотатками та аналітикою в одному кабінеті.</div>
              </div>
            </div>
          </div>
        </div>
        <div class="split-block__media">
          <div class="media-frame media-frame--tall">
            <img :src="workflowImage" alt="Системний супровід практики" />
          </div>
        </div>
      </section>

      <section class="section-block reveal" id="pricing">
        <div class="section-head section-head--center">
          <h2 class="section-title">Тарифи для різних етапів практики</h2>
          <p class="muted">Без комісії за сесію. Спеціаліст сам визначає умови роботи з клієнтами.</p>
          <p class="pricing__definition">
            У кожному плані: публічний профіль, запис через вільні вікна та базове керування сесіями.
          </p>
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
        <div class="plan-grid">
          <article
            v-for="plan in pricingPlans"
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
                <div class="plan-price__main">{{ planDisplayPrice(plan) }}</div>
                <div class="plan-price__period">{{ billingCycleLabel }}</div>
              </div>
            </div>
            <div class="plan-badges">
              <span class="badge badge--soft">{{ plan.badge }}</span>
              <span v-if="plan.code === 'PRO'" class="badge badge--pro">Оптимальний</span>
            </div>
            <div v-if="billingCycle === 'annual' && plan.annual_one_shot" class="plan-price__alt">
              {{ plan.annual_one_shot }} <span class="plan-price__hint">{{ plan.annual_hint }}</span>
            </div>
            <div v-else-if="billingCycle === 'annual'" class="plan-price__alt">{{ plan.annual_fallback_note }}</div>
            <div v-else-if="plan.annual_monthly_price" class="plan-price__alt">
              Або {{ plan.annual_monthly_price }} при оплаті за рік
            </div>
            <ul class="plan-list">
              <li v-for="item in plan.features" :key="item">{{ item }}</li>
            </ul>
            <div class="plan-foot">
              <div class="muted">{{ plan.note }}</div>
              <button
                class="btn"
                type="button"
                :disabled="isAuthenticated && isCurrentPlan(plan.code)"
              >
                {{ planActionLabel(plan.code) }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <section class="section-block reveal" id="faq">
        <div class="section-head">
          <h2 class="section-title">FAQ</h2>
          <p class="muted">Короткі відповіді на основні питання про старт і роботу в PRO CONSULT.</p>
        </div>
        <div class="faq-grid">
          <article class="card faq-card">
            <h3 class="faq-card__title">Чи є комісія за проведені сесії?</h3>
            <p class="muted">Ні. Ви оплачуєте підписку, а не відсоток із кожної консультації.</p>
          </article>
          <article class="card faq-card">
            <h3 class="faq-card__title">Чи можна ділитися профілем поза платформою?</h3>
            <p class="muted">Так. Публічний профіль має окреме посилання для швидкого знайомства і запису.</p>
          </article>
          <article class="card faq-card">
            <h3 class="faq-card__title">Хто визначає умови співпраці з клієнтом?</h3>
            <p class="muted">Ви самостійно: формат, тривалість, правила запису і вартість роботи.</p>
          </article>
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
const profileImage = new URL('../assets/therapy/f066edb1-65e7-419d-8a0d-0940a3526583.jpg', import.meta.url).href
const workflowImage = new URL('../assets/therapy/47b34bc8-1ce4-4ee3-92ff-41c3a0c14f6b.jpg', import.meta.url).href

const router = useRouter()
const auth = useAuthStore()
const isAuthenticated = computed(() => Boolean(auth.accessToken))
const roles = computed(() => auth.me?.user.roles ?? auth.user?.roles ?? [])

const specialistRoles = ['психологи', 'коучі', 'консультанти', 'наставники', 'викладачі']

const valuePillars = [
  {
    title: 'Публічний профіль і запис',
    copy: 'Покажіть свій підхід і дайте клієнту зрозумілий шлях від знайомства до підтвердженого запису.',
  },
  {
    title: 'Сесії та доступність',
    copy: 'Керуйте розкладом, вільними вікнами, перенесеннями і правилами доступності без ручного хаосу.',
  },
  {
    title: 'Клієнти й історія роботи',
    copy: 'Тримайте в одному місці історію взаємодії, поточний статус і домовленості по кожному клієнту.',
  },
  {
    title: 'Нотатки та матеріали',
    copy: 'Структуруйте післясесійні нотатки і діліться потрібними матеріалами в межах робочого процесу.',
  },
  {
    title: 'Аналітика практики',
    copy: 'Відстежуйте динаміку завантаження, стабільність практики та точки росту без сторонніх таблиць.',
  },
]

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
const billingCycleLabel = computed(() => (billingCycle.value === 'annual' ? 'за місяць при оплаті за рік' : 'за місяць'))

const pricingPlans: PricingPlan[] = [
  {
    code: 'START',
    title: 'Start',
    subtitle: 'Для старту приватної практики',
    monthly_price: '€10',
    annual_monthly_price: null,
    annual_one_shot: null,
    annual_hint: null,
    annual_fallback_note: 'Доступна тільки щомісячна оплата',
    badge: 'Базовий',
    features: [
      'До 5 активних клієнтів',
      'Публічний профіль із записом через вільні вікна',
      'Базове керування сесіями та доступністю',
      'Нотатки до сесій і матеріали для клієнтів',
      'Без комісії за сесію',
    ],
    note: 'Добрий вибір для запуску практики й перших стабільних записів.',
  },
  {
    code: 'PRO',
    title: 'Pro',
    subtitle: 'Для стабільної та зростаючої практики',
    monthly_price: '€24',
    annual_monthly_price: '€20',
    annual_one_shot: 'Оплата за рік — €240 одним платежем',
    annual_hint: '2 місяці у подарунок',
    annual_fallback_note: null,
    badge: 'Популярний',
    features: [
      'До 20 активних клієнтів',
      'Повторювані сесії та гнучкі перенесення',
      'Розширені нагадування й підтвердження',
      'Відео та матеріали в публічному профілі',
      'Базова аналітика практики',
    ],
    note: 'Оптимальний баланс інструментів для регулярної роботи з клієнтами.',
  },
  {
    code: 'LEADER',
    title: 'Leader',
    subtitle: 'Для масштабу та максимальної керованості',
    monthly_price: '€59',
    annual_monthly_price: '€49',
    annual_one_shot: 'Оплата за рік — €590 одним платежем',
    annual_hint: '2 місяці у подарунок',
    annual_fallback_note: null,
    badge: 'Розширений',
    features: [
      'До 60 активних клієнтів',
      'Усе з плану Pro',
      'Поглиблена аналітика практики',
      'Пріоритетна підтримка',
      'Ранній доступ до нових можливостей',
    ],
    note: 'План для спеціалістів, які масштабують практику і командні процеси.',
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
  if (!isAuthenticated.value) return 'Обрати план'
  if (isCurrentPlan(code)) return 'Поточний'
  if (code === 'PRO') return 'Перейти на Pro'
  if (code === 'LEADER') return 'Перейти на Leader'
  return 'Перейти на Start'
}

let revealObserver: IntersectionObserver | null = null

onMounted(() => {
  const targets = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))
  const staggerGroups = [
    '.value-strip .value-strip__item',
    '.role-list .role-list__item',
    '.profile-points .profile-point',
    '.pillar-grid .pillar-card',
    '.how-list .how-item',
    '.plan-grid .plan-card',
    '.faq-grid .faq-card',
  ]

  staggerGroups.forEach((selector) => {
    document.querySelectorAll<HTMLElement>(selector).forEach((el, index) => {
      el.style.transitionDelay = `${Math.min(index * 70, 280)}ms`
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
    { threshold: 0.18, rootMargin: '0px 0px -10% 0px' }
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
  content: '';
  position: absolute;
  inset: -160px 0;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(1100px 520px at 12% 38%, rgba(2, 54, 97, 0.12), transparent 72%),
    radial-gradient(980px 520px at 88% 42%, rgba(219, 82, 39, 0.1), transparent 72%),
    linear-gradient(
      180deg,
      rgba(247, 248, 251, 0.82) 0%,
      rgba(248, 249, 251, 0.94) 32%,
      rgba(248, 249, 251, 0.94) 72%,
      rgba(247, 248, 251, 0.82) 100%
    );
}

.container--agency {
  width: min(1200px, 92vw);
  margin: 0 auto;
  display: grid;
  gap: 84px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.28em;
  font-size: 11px;
  color: var(--muted);
}

.hero-agency {
  display: grid;
  grid-template-columns: minmax(0, 1.04fr) minmax(0, 0.96fr);
  gap: 60px;
  align-items: center;
}

.hero-agency__title {
  font-size: clamp(34px, 4vw, 60px);
  line-height: 1.13;
  letter-spacing: -0.02em;
  margin: 18px 0 20px;
  max-width: 18ch;
}

.hero-agency__subtitle {
  margin: 0;
  color: var(--muted);
  font-size: 15px;
  line-height: 1.72;
  max-width: 60ch;
}

.hero-agency__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 26px;
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

.hero-agency__actions a.btn--ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.home-agency :global(.muted) {
  font-size: 14px;
}

.media-frame {
  border-radius: var(--radius-lg);
  border: 1px solid color-mix(in srgb, var(--accent) 12%, var(--border));
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(118, 130, 142, 0.12));
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

.media-frame--portrait {
  aspect-ratio: 4 / 3;
  max-width: 520px;
}

.media-frame--tall {
  aspect-ratio: 16 / 9;
  max-width: 520px;
}

.value-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-top: -22px;
}

.value-strip__item {
  border: 1px solid color-mix(in srgb, var(--primary) 20%, var(--border));
  background: color-mix(in srgb, #ffffff 75%, var(--surface));
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: 0.02em;
  color: color-mix(in srgb, var(--text) 88%, #0f2f28);
}

.section-block {
  display: grid;
  gap: 30px;
}

.section-block--compact {
  gap: 18px;
}

.section-head {
  display: grid;
  gap: 10px;
}

.section-title {
  margin: 0;
  font-size: clamp(28px, 3.1vw, 40px);
  line-height: 1.2;
}

.section-title--mid {
  font-size: clamp(26px, 2.7vw, 34px);
}

.section-title--left {
  text-align: left;
}

.section-head--center {
  text-align: center;
}

.role-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.role-list__item {
  border: 1px solid color-mix(in srgb, var(--primary) 25%, var(--border));
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  font-size: 13px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: color-mix(in srgb, var(--primary) 8%, #ffffff);
  color: color-mix(in srgb, var(--ink) 88%, #1f442f);
}

.profile-showcase {
  border: 1px solid color-mix(in srgb, var(--primary) 20%, var(--border));
  border-radius: var(--radius-xl);
  background: linear-gradient(130deg, rgba(255, 255, 255, 0.82), rgba(12, 58, 84, 0.06));
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  gap: 30px;
  padding: 28px;
  box-shadow: var(--shadow-1);
}

.profile-showcase__media {
  display: flex;
  align-items: stretch;
}

.profile-showcase__media .media-frame {
  max-width: none;
  height: 100%;
}

.profile-showcase__content {
  display: grid;
  gap: 14px;
}

.profile-showcase__text {
  margin: 0;
  color: var(--muted);
  line-height: 1.72;
}

.profile-points {
  display: grid;
  gap: 10px;
  margin-top: 4px;
}

.profile-point {
  border: 1px solid color-mix(in srgb, var(--primary) 18%, var(--border));
  background: color-mix(in srgb, #ffffff 74%, var(--surface));
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  display: grid;
  gap: 4px;
}

.profile-point__title {
  font-weight: 700;
  font-size: 15px;
}

.pillar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.pillar-card {
  min-height: 180px;
  padding: 20px;
  display: grid;
  gap: 8px;
  border-radius: var(--radius-md);
}

.pillar-card__title {
  margin: 0;
  font-size: 18px;
  line-height: 1.3;
}

.split-block {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 60px;
  align-items: stretch;
}

.split-block__content {
  display: grid;
  gap: 14px;
}

.split-block__media {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
}

.how-list {
  display: grid;
  gap: 16px;
}

.how-item {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px;
  display: grid;
  grid-template-columns: 30px 1fr;
  gap: 12px;
  align-items: start;
  background: color-mix(in srgb, #ffffff 70%, var(--surface));
}

.how-item__num {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-xs);
  background: color-mix(in srgb, var(--primary) 20%, transparent);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 13px;
}

.how-item__title {
  font-weight: 700;
  margin-bottom: 4px;
}

.pricing__definition {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}

.pricing-toggle {
  margin: 8px auto 0;
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 4px;
  background: #fff;
}

.pricing-toggle__btn {
  border: 1px solid transparent;
  background: transparent;
  border-radius: var(--radius-xs);
  padding: 6px 14px;
  font-size: 13px;
  color: var(--ink);
  cursor: pointer;
}

.pricing-toggle__btn.is-active {
  border-color: color-mix(in srgb, var(--primary) 35%, var(--border));
  background: color-mix(in srgb, var(--primary) 10%, transparent);
  font-weight: 700;
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
  gap: 12px;
}

.plan-card--current {
  border-color: color-mix(in srgb, var(--primary) 46%, var(--line));
  box-shadow: 0 10px 22px rgba(31, 74, 96, 0.14);
}

.plan-card--highlight {
  border-color: color-mix(in srgb, var(--primary) 66%, #8db69f);
  background:
    radial-gradient(circle at 100% -10%, rgba(255, 225, 133, 0.3), rgba(255, 225, 133, 0) 46%),
    linear-gradient(180deg, rgba(31, 140, 93, 0.09), rgba(255, 255, 255, 0.98));
}

.plan-head {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
}

.plan-title {
  font-weight: 700;
  font-size: 22px;
  font-family: var(--font-display);
}

.plan-subtitle {
  margin-top: 3px;
  font-size: 13px;
  color: var(--muted);
}

.plan-price {
  text-align: right;
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
  padding-top: 10px;
}

.plan-price__hint {
  color: color-mix(in srgb, var(--primary) 86%, #31543f);
  font-weight: 600;
}

.plan-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  padding: 0 10px;
  border-radius: var(--radius-pill);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border: 1px solid color-mix(in srgb, var(--primary) 25%, var(--border));
  background: color-mix(in srgb, var(--primary) 15%, transparent);
}

.badge--pro {
  background: linear-gradient(90deg, #12563b, #1f8a5d 62%, #36a77b);
  color: #fff;
  border-color: transparent;
}

.plan-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
  color: var(--muted);
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
  gap: 10px;
}

.plan-foot .btn {
  width: 100%;
}

.faq-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.faq-card {
  min-height: 142px;
  padding: 18px;
  border-radius: var(--radius-md);
}

.faq-card__title {
  margin: 0 0 8px;
  font-size: 16px;
}

@media (max-width: 960px) {
  .hero-agency,
  .profile-showcase,
  .split-block {
    grid-template-columns: 1fr;
    gap: 26px;
  }

  .profile-showcase {
    padding: 20px;
  }

  .value-strip {
    margin-top: -10px;
  }
}

@media (max-width: 640px) {
  .home-agency {
    padding-top: 88px;
  }

  .container--agency {
    gap: 62px;
  }

  .hero-agency__title {
    font-size: clamp(30px, 9.2vw, 44px);
  }

  .plan-price__main {
    font-size: 28px;
  }
}
</style>
