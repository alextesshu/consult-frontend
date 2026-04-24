<template>
  <section class="home-lite">
    <div class="home-lite__container">
      <section class="home-hero reveal">
        <div class="home-hero__content">
          <p class="home-hero__eyebrow">Сервіс для зручного проведення консультацій</p>
          <h1 class="home-hero__title">Приватна практика на власних умовах — без комісій</h1>
          <p class="home-hero__subtitle">
            Профіль, запис, сесії, оплати й робочі матеріали зібрані в одній системі, щоб вам було легше тримати
            практику в порядку.
          </p>
          <div class="home-hero__actions">
            <button v-if="isAuthenticated" class="btn" type="button" @click="goToCabinet">Перейти в кабінет</button>
            <RouterLink v-else class="btn" to="/signup">Спробувати безкоштовно</RouterLink>
            <RouterLink class="btn btn--ghost" to="/pricing">Переглянути тарифи</RouterLink>
          </div>
          <p class="home-hero__microcopy">
            30 днів Pro для нових спеціалістів. Потім — безкоштовний Start або перехід на потрібний рівень доступу.
          </p>
        </div>
        <div class="home-hero__visual">
          <div class="hero-collage">
            <article class="hero-shot hero-shot--primary">
              <div class="hero-shot__top"><span></span><span></span><span></span></div>
              <div class="hero-shot__viewport">
                <img src="/images/tour/public-profile-2.jpg" alt="Публічний профіль спеціаліста" loading="eager" decoding="async" />
              </div>
            </article>
            <article class="hero-shot hero-shot--slots">
              <div class="hero-shot__top"><span></span><span></span><span></span></div>
              <div class="hero-shot__viewport">
                <img src="/images/tour/slots-1.jpg" alt="Доступні вікна для бронювання" loading="lazy" decoding="async" />
              </div>
            </article>
            <article class="hero-shot hero-shot--payments">
              <div class="hero-shot__top"><span></span><span></span><span></span></div>
              <div class="hero-shot__viewport">
                <img src="/images/tour/payments-block-1.jpg" alt="Платежі і підтвердження оплат" loading="lazy" decoding="async" />
              </div>
            </article>
            <article class="hero-shot hero-shot--analytics">
              <div class="hero-shot__top"><span></span><span></span><span></span></div>
              <div class="hero-shot__viewport">
                <img src="/images/tour/analytics-1.jpg" alt="Аналітика практики" loading="lazy" decoding="async" />
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="value-grid reveal" aria-label="Ключові переваги">
        <article
          v-for="(item, index) in valueProps"
          :key="item.title"
          class="value-card"
          :class="{ 'value-card--accent': index < 2 }"
        >
          <h2 class="value-card__title">{{ item.title }}</h2>
          <p class="muted">{{ item.copy }}</p>
        </article>
      </section>

      <section id="how-it-works" class="walkthrough reveal">
        <div class="section-head">
          <p class="section-head__eyebrow">Огляд продукту</p>
          <h2 class="section-head__title">Подивіться, як Pro Consult працює в реальних сценаріях</h2>
          <p class="walkthrough__lead">
            Усі ключові етапи роботи спеціаліста в одному маршруті: від публічного профілю до щоденних операційних
            задач.
          </p>
        </div>

        <div class="walkthrough__chips">
          <a
            v-for="item in coreWalkthroughSections"
            :key="item.id"
            :href="`#${item.id}`"
            :class="{ 'is-active': activeWalkthroughSectionId === item.id }"
            :aria-current="activeWalkthroughSectionId === item.id ? 'true' : undefined"
          >
            {{ item.shortLabel }}
          </a>
        </div>

        <div class="walkthrough__core">
          <section
            v-for="(item, index) in coreWalkthroughSections"
            :id="item.id"
            :key="item.id"
            class="walkthrough-feature"
            :class="{ 'walkthrough-feature--reverse': index % 2 === 1 }"
          >
            <div class="walkthrough-feature__media">
              <div class="product-shot">
                <div class="product-shot__top">
                  <span></span><span></span><span></span>
                  <strong>{{ item.screenLabel }}</strong>
                </div>
                <div class="product-shot__viewport">
                  <img :src="item.screenSrc" :alt="item.screenAlt" loading="lazy" decoding="async" />
                </div>
              </div>
            </div>
            <div class="walkthrough-feature__content">
              <h3 class="walkthrough-feature__title">{{ item.title }}</h3>
              <p class="walkthrough-feature__body">{{ item.body }}</p>
              <ul>
                <li v-for="point in item.points" :key="point">{{ point }}</li>
              </ul>
              <p class="walkthrough-feature__tariff">Доступ: {{ item.tariffNote }}</p>
            </div>
          </section>
        </div>

        <div class="walkthrough__secondary">
          <article v-for="item in secondaryWalkthroughSections" :id="item.id" :key="item.id" class="walkthrough-secondary-card">
            <div class="product-shot product-shot--compact">
              <div class="product-shot__top">
                <span></span><span></span><span></span>
                <strong>{{ item.screenLabel }}</strong>
              </div>
              <div class="product-shot__viewport">
                <img :src="item.screenSrc" :alt="item.screenAlt" loading="lazy" decoding="async" />
              </div>
            </div>
            <h3 class="walkthrough-secondary-card__title">{{ item.title }}</h3>
            <p class="muted">{{ item.body }}</p>
          </article>
        </div>
      </section>

      <section id="pricing" class="pricing-teaser reveal">
        <div class="section-head section-head--center">
          <p class="section-head__eyebrow">Рівні доступу</p>
          <h2 class="section-head__title">Повноцінні тарифи для різних етапів практики</h2>
          <p class="muted">
            Start — безкоштовний. Pro і Leader доступні помісячно або вигідніше при оплаті за рік.
          </p>
        </div>
        <div class="pricing-toggle" role="group" aria-label="Період оплати">
          <button
            class="pricing-toggle__btn"
            :class="{ 'is-active': billingCycle === 'monthly' }"
            type="button"
            @click="billingCycle = 'monthly'"
          >
            Місяць
          </button>
          <button
            class="pricing-toggle__btn"
            :class="{ 'is-active': billingCycle === 'yearly' }"
            type="button"
            @click="billingCycle = 'yearly'"
          >
            Рік
          </button>
        </div>
        <div class="pricing-teaser__grid">
          <article v-for="plan in pricingPlans" :key="plan.name" class="plan-card" :class="{ 'plan-card--pro': plan.name === 'Pro' }">
            <h3 class="plan-card__title">{{ plan.name }}</h3>
            <p class="plan-card__price">{{ plan.price }}</p>
            <p v-if="plan.helper" class="plan-card__helper">{{ plan.helper }}</p>
            <p class="muted">{{ plan.subtitle }}</p>
            <ul>
              <li v-for="feature in plan.features" :key="feature">{{ feature }}</li>
            </ul>
            <RouterLink class="btn" :class="{ 'btn--ghost': plan.ghostCta }" :to="plan.ctaTo">{{ plan.ctaLabel }}</RouterLink>
          </article>
        </div>
        <div class="pricing-teaser__actions">
          <RouterLink class="btn btn--ghost" to="/support-and-data-requests">Потрібні інші умови?</RouterLink>
        </div>
      </section>

      <section id="faq" class="home-faq reveal">
        <div class="section-head">
          <h2 class="section-head__title">Поширені питання</h2>
          <p class="muted">Короткі відповіді перед стартом.</p>
        </div>
        <div class="home-faq__grid">
          <article class="faq-card">
            <h3 class="faq-card__title">Чи є комісія з кожної сесії?</h3>
            <p class="muted">Ні. Pro Consult не забирає відсоток із кожної сесії.</p>
          </article>
          <article class="faq-card">
            <h3 class="faq-card__title">Чи можна почати безкоштовно?</h3>
            <p class="muted">Так. Нові спеціалісти отримують 30 днів Pro, далі можна залишитися на Start.</p>
          </article>
          <article class="faq-card">
            <h3 class="faq-card__title">Кому підходить платформа?</h3>
            <p class="muted">Спеціалістам приватної практики, які працюють через індивідуальні сесії.</p>
          </article>
        </div>
      </section>

      <section class="final-cta reveal">
        <h2 class="final-cta__title">Запустіть робочий простір для вашої практики</h2>
        <p class="muted">Почніть без комісії з кожної сесії, з цілісним процесом і зрозумним маршрутом росту.</p>
        <div class="final-cta__actions">
          <RouterLink v-if="!isAuthenticated" class="btn" to="/signup">Спробувати безкоштовно</RouterLink>
          <button v-else class="btn" type="button" @click="goToCabinet">Перейти в кабінет</button>
          <RouterLink class="btn btn--ghost" to="/pricing">Переглянути тарифи</RouterLink>
        </div>
      </section>
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
const billingCycle = ref<'monthly' | 'yearly'>('monthly')

const valueProps = [
  {
    title: 'Один робочий простір',
    copy: 'Профіль, запис, сесії, оплати, нотатки й аналітика зібрані в одному місці.',
  },
  {
    title: 'Без комісії з кожної сесії',
    copy: 'Ви працюєте на власних умовах і не віддаєте відсоток із кожної консультації.',
  },
  {
    title: 'Для приватної практики',
    copy: 'Побудовано для спеціалістів, які ведуть власну практику й хочуть системний процес.',
  },
]

const walkthroughSections = [
  {
    id: 'public-profile',
    shortLabel: 'Профіль',
    title: 'Публічний профіль',
    body: 'Клієнт одразу бачить вашу спеціалізацію, формат роботи, умови та зрозумілий шлях до запису без зайвих кроків.',
    points: ['Публічне посилання профілю', 'Прозорі умови роботи', 'Швидкий перехід до запису'],
    tariffNote: 'Start / Pro / Leader',
    screenLabel: 'ПУБЛІЧНИЙ ПРОФІЛЬ',
    screenSrc: '/images/tour/public-profile-2.jpg',
    screenAlt: 'Публічний профіль спеціаліста',
    type: 'core',
  },
  {
    id: 'hours',
    shortLabel: 'Графік',
    title: 'Планування робочих годин',
    body: 'Керуйте робочими правилами, доступністю та ритмом практики в одному місці, без ручних перенесень між інструментами.',
    points: ['Налаштування робочих вікон', 'Керування правилами доступності', 'Прозорий календар для клієнта'],
    tariffNote: 'Start / Pro / Leader',
    screenLabel: 'ПРАВИЛА ГРАФІКА',
    screenSrc: '/images/tour/schedule-rules.jpg',
    screenAlt: 'Налаштування робочих годин',
    type: 'core',
  },
  {
    id: 'booking',
    shortLabel: 'Бронювання',
    title: 'Бронювання без накладок',
    body: 'Публічний процес запису синхронізується з вашим графіком і прибирає зайву ручну координацію з клієнтами.',
    points: ['Доступні дати й вікна', 'Логіка без накладок', 'Менше ручних уточнень'],
    tariffNote: 'Start / Pro / Leader',
    screenLabel: 'ВІЛЬНІ ВІКНА',
    screenSrc: '/images/tour/slots-1.jpg',
    screenAlt: 'Слоти для бронювання',
    type: 'core',
  },
  {
    id: 'sessions-overview',
    shortLabel: 'Сесії',
    title: 'Керування майбутніми сесіями',
    body: 'Огляд майбутніх сесій показує підтвердження, найближчі зустрічі й критичні кроки для стабільного робочого ритму.',
    points: ['Сесії, що очікують підтвердження', 'Найближча сесія', 'Операційний контроль графіка'],
    tariffNote: 'Pro / Leader',
    screenLabel: 'СЕСІЇ',
    screenSrc: '/images/tour/booking-sessions-2.jpg',
    screenAlt: 'Список майбутніх сесій',
    type: 'core',
  },
  {
    id: 'session-workflow',
    shortLabel: 'Процес',
    title: 'Контроль сесії в одному робочому процесі',
    body: 'У деталці сесії зібрано статус, формат, дані клієнта та наступні дії, щоб не втрачати контекст між етапами роботи.',
    points: ['Контекст сесії', 'Блок зустрічі і статус', 'Підсумок після сесії'],
    tariffNote: 'Pro / Leader',
    screenLabel: 'ДЕТАЛІ СЕСІЇ',
    screenSrc: '/images/tour/session-detail-1.jpg',
    screenAlt: 'Деталка сесії',
    type: 'core',
  },
  {
    id: 'payments',
    shortLabel: 'Оплати',
    title: 'Оплати та підтвердження оплат',
    body: 'Реквізити, підтвердження оплат і потрібні дії зібрані в одному блоці, щоб ви тримали фінансову частину під контролем.',
    points: ['Платіжні реквізити', 'Підтвердження оплат', 'Швидкі дії для подальших кроків'],
    tariffNote: 'Pro / Leader',
    screenLabel: 'ОПЛАТИ',
    screenSrc: '/images/tour/payments-block-1.jpg',
    screenAlt: 'Платіжний блок',
    type: 'core',
  },
  {
    id: 'workbook',
    shortLabel: 'Зошит',
    title: 'Робочий зошит між сесіями',
    body: 'Міжсесійна робота стає послідовною: матеріали, контекст і безперервність зберігаються в єдиному робочому потоці.',
    points: ['Міжсесійний контекст', 'Структурована робота', 'Безперервність процесу'],
    tariffNote: 'Pro / Leader',
    screenLabel: 'РОБОЧИЙ ЗОШИТ',
    screenSrc: '/images/tour/workbook-3.jpg',
    screenAlt: 'Робочий зошит клієнта',
    type: 'core',
  },
  {
    id: 'analytics',
    shortLabel: 'Аналітика',
    title: 'Аналітика практики',
    body: 'Ключові показники, динаміка та навантаження допомагають щодня приймати рішення на основі реальної картини практики.',
    points: ['Огляд метрик', 'Динаміка по днях', 'Контроль навантаження'],
    tariffNote: 'Start / Pro / Leader',
    screenLabel: 'АНАЛІТИКА',
    screenSrc: '/images/tour/analytics-1.jpg',
    screenAlt: 'Аналітичний дашборд',
    type: 'core',
  },
  {
    id: 'notes',
    shortLabel: 'Нотатки',
    title: 'Приватні нотатки',
    body: 'Конфіденційний робочий контекст по клієнту в захищеній внутрішній зоні.',
    points: [],
    screenLabel: 'НОТАТКИ',
    screenSrc: '/images/tour/notes-3.jpg',
    screenAlt: 'Приватні нотатки',
    type: 'secondary',
  },
  {
    id: 'publications',
    shortLabel: 'Публікації',
    title: 'Авторські публікації',
    body: 'Публічний журнал підсилює експертний голос і довіру до профілю.',
    points: [],
    screenLabel: 'АВТОРСЬКИЙ ЖУРНАЛ',
    screenSrc: '/images/tour/author-journal-1.jpg',
    screenAlt: 'Авторські публікації',
    type: 'secondary',
  },
  {
    id: 'todo',
    shortLabel: 'Справи',
    title: 'Дошка завдань',
    body: 'Операційні задачі та наступні кроки завжди під контролем.',
    points: [],
    screenLabel: 'ДОШКА ЗАВДАНЬ',
    screenSrc: '/images/tour/todo-board-1.jpg',
    screenAlt: 'Todo дошка',
    type: 'secondary',
  },
]

const coreWalkthroughSections = walkthroughSections.filter((item) => item.type === 'core')
const secondaryWalkthroughSections = walkthroughSections.filter((item) => item.type === 'secondary')
const activeWalkthroughSectionId = ref(coreWalkthroughSections[0]?.id ?? '')

const pricingPlans = computed(() => [
  {
    name: 'Start',
    price: 'Безкоштовно',
    helper: '',
    subtitle: 'Для старту приватної практики',
    features: [
      'Публічний профіль',
      'Онлайн-запис',
      'Базова аналітика',
      'До 3 активних клієнтів одночасно',
    ],
    ctaLabel: 'Почати безкоштовно',
    ctaTo: '/signup',
    ghostCta: false,
  },
  {
    name: 'Pro',
    price: billingCycle.value === 'monthly' ? '990 грн / міс' : '9900 грн / рік',
    helper: billingCycle.value === 'yearly' ? '2 місяці безкоштовно при оплаті за рік' : 'Річний план вигідніше, ніж помісячно',
    subtitle: 'Для стабільної щоденної практики',
    features: [
      'Все, що у Start +',
      'Робочий зошит',
      'Оплати та підтвердження оплат',
      'Розширена аналітика',
      'Більші ліміти',
      'До 20 активних клієнтів одночасно',
    ],
    ctaLabel: 'Спробувати 30 днів безкоштовно',
    ctaTo: '/signup',
    ghostCta: false,
  },
  {
    name: 'Leader',
    price: billingCycle.value === 'monthly' ? '2490 грн / міс' : '24900 грн / рік',
    helper: billingCycle.value === 'yearly' ? '2 місяці безкоштовно при оплаті за рік' : 'Річний план вигідніше, ніж помісячно',
    subtitle: 'Для великої та інтенсивної практики',
    features: [
      'Все, що у Pro +',
      'Максимальні ліміти',
      'Пріоритетний супровід',
      'Більше робочого навантаження',
      'До 60 активних клієнтів одночасно',
    ],
    ctaLabel: 'Подати запит',
    ctaTo: '/support-and-data-requests',
    ghostCta: true,
  },
])

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

let revealObserver: IntersectionObserver | null = null
let walkthroughSectionObserver: IntersectionObserver | null = null

onMounted(() => {
  const targets = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))
  if (targets.length) {
    const hasHashOnLoad = typeof window !== 'undefined' && Boolean(window.location.hash)
    if (hasHashOnLoad || typeof IntersectionObserver === 'undefined') {
      targets.forEach((el) => el.classList.add('is-visible'))
    } else {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible')
              revealObserver?.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.02, rootMargin: '0px 0px 14% 0px' }
      )

      targets.forEach((el) => revealObserver?.observe(el))
    }
  }

  const sectionTargets = coreWalkthroughSections
    .map((item) => document.getElementById(item.id))
    .filter((item): item is HTMLElement => item instanceof HTMLElement)

  if (!sectionTargets.length) return

  const hashId = typeof window !== 'undefined' ? window.location.hash.replace('#', '').trim() : ''
  if (hashId && coreWalkthroughSections.some((item) => item.id === hashId)) {
    activeWalkthroughSectionId.value = hashId
  }

  if (typeof IntersectionObserver === 'undefined') return

  walkthroughSectionObserver = new IntersectionObserver(
    (entries) => {
      const mostVisible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        .at(0)
      if (mostVisible?.target?.id) {
        activeWalkthroughSectionId.value = mostVisible.target.id
      }
    },
    { threshold: [0.22, 0.4, 0.62], rootMargin: '-12% 0px -48% 0px' }
  )

  sectionTargets.forEach((section) => walkthroughSectionObserver?.observe(section))
})

onBeforeUnmount(() => {
  revealObserver?.disconnect()
  revealObserver = null
  walkthroughSectionObserver?.disconnect()
  walkthroughSectionObserver = null
})
</script>

<style scoped>
.home-lite {
  padding: 42px 0 120px;
  position: relative;
  isolation: isolate;
}

.home-lite::before {
  content: '';
  position: absolute;
  inset: -180px 0 0;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(1300px 560px at 18% 20%, rgba(17, 89, 69, 0.12), transparent 72%),
    radial-gradient(980px 460px at 88% 18%, rgba(219, 120, 39, 0.08), transparent 74%),
    linear-gradient(180deg, rgba(245, 247, 242, 0.82) 0%, rgba(247, 248, 251, 0.94) 38%, rgba(247, 248, 251, 0.95) 100%);
}

.home-lite__container {
  width: min(var(--pc-container-wide), calc(100% - 48px));
  margin: 0 auto;
  display: grid;
  gap: 52px;
}

.home-hero {
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-2xl);
  background:
    radial-gradient(720px 420px at 92% 12%, rgba(143, 203, 200, 0.18), transparent 72%),
    radial-gradient(620px 380px at 76% 92%, rgba(247, 183, 126, 0.2), transparent 74%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.92), var(--pc-bg-main));
  padding: clamp(28px, 4vw, 56px);
  display: grid;
  grid-template-columns: minmax(0, 0.84fr) minmax(0, 1.16fr);
  gap: clamp(22px, 3vw, 44px);
  align-items: center;
  box-shadow: var(--pc-shadow-card);
  overflow: hidden;
}

.home-hero__content {
  display: grid;
  gap: 14px;
  align-content: center;
}

.home-hero__eyebrow,
.section-head__eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--pc-text-muted);
}

.home-hero__title {
  margin: 0;
  font-size: clamp(37px, 4vw, 66px);
  line-height: 1.12;
  letter-spacing: -0.02em;
  max-width: 16ch;
  color: var(--pc-navy-950);
}

.home-hero__subtitle {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
  max-width: 60ch;
}

.home-hero__microcopy {
  margin: 0;
  font-size: 13px;
  color: color-mix(in srgb, var(--text) 62%, #50606a);
}

.home-hero__actions,
.final-cta__actions,
.pricing-teaser__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.home-hero__actions .btn {
  min-height: 48px;
  padding: 0 22px;
  border-radius: var(--radius-md);
  background: var(--pc-navy-900);
  border-color: var(--pc-navy-900);
  color: #fff;
  box-shadow: 0 12px 26px rgba(18, 52, 90, 0.18);
  font-weight: 700;
}

.home-hero__actions .btn:hover {
  background: var(--pc-navy-950);
  border-color: var(--pc-navy-950);
  box-shadow: 0 16px 32px rgba(18, 52, 90, 0.22);
}

.home-hero__actions .btn--ghost {
  background: rgba(255, 255, 255, 0.72);
  border-color: var(--pc-border-strong);
  color: var(--pc-navy-900);
  box-shadow: none;
}

.home-hero__actions .btn--ghost:hover {
  background: #fff;
  border-color: var(--pc-navy-900);
  color: var(--pc-navy-950);
}

.home-hero__visual {
  min-width: 0;
}

.hero-collage {
  position: relative;
  min-height: clamp(460px, 36vw, 580px);
  padding: 6px 6px;
}

.hero-shot {
  position: absolute;
  border: 1px solid rgba(18, 52, 90, 0.16);
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.9);
  overflow: hidden;
  box-shadow: 0 22px 54px rgba(18, 35, 58, 0.12);
  backdrop-filter: blur(10px);
}

.hero-shot__top {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 13px;
  border-bottom: 1px solid var(--pc-border);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(250, 247, 242, 0.84));
}

.hero-shot__top span {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-pill);
  background: var(--pc-teal-500);
  opacity: 0.82;
}

.hero-shot__viewport {
  padding: 10px;
  background:
    radial-gradient(460px 240px at 85% 18%, rgba(143, 203, 200, 0.14), transparent 70%),
    radial-gradient(420px 220px at 18% 88%, rgba(247, 183, 126, 0.16), transparent 74%),
    #fff;
  aspect-ratio: 16 / 10;
}

.hero-shot__viewport img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: var(--radius-md);
}

.hero-shot--primary {
  top: 0;
  left: 4%;
  width: 92%;
  z-index: 2;
}

.hero-shot--slots {
  left: -1%;
  bottom: 10%;
  width: 30%;
  z-index: 4;
}

.hero-shot--payments {
  left: 33%;
  bottom: 6%;
  width: 34%;
  z-index: 5;
}

.hero-shot--analytics {
  right: -1%;
  bottom: 6%;
  width: 34%;
  z-index: 4;
}

.walkthrough,
.pricing-teaser,
.home-faq,
.final-cta {
  display: grid;
  gap: 22px;
}

.walkthrough__chips {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding: 4px 0 0;
}

.walkthrough__chips a {
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-pill);
  padding: 8px 13px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  color: var(--pc-text-muted);
  background: rgba(255, 255, 255, 0.74);
  box-shadow: 0 8px 20px rgba(18, 35, 58, 0.04);
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.walkthrough__chips a:hover {
  border-color: rgba(18, 52, 90, 0.24);
  color: var(--pc-navy-900);
  background: #fff;
  transform: translateY(-1px);
}

.walkthrough__chips a.is-active {
  border-color: var(--pc-navy-900);
  color: #fff;
  background: var(--pc-navy-900);
  box-shadow: 0 10px 24px rgba(18, 52, 90, 0.16);
}

.walkthrough__core {
  display: grid;
  gap: 28px;
}

.walkthrough-feature {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.98fr);
  gap: clamp(22px, 2.4vw, 36px);
  align-items: center;
  max-width: 1180px;
  margin-inline: auto;
  width: 100%;
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-2xl);
  background:
    radial-gradient(520px 280px at 92% 10%, rgba(143, 203, 200, 0.14), transparent 72%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(250, 247, 242, 0.82));
  padding: clamp(18px, 2.4vw, 30px);
  box-shadow: var(--pc-shadow-soft);
  overflow: hidden;
}

.walkthrough-feature--reverse {
  direction: rtl;
}

.walkthrough-feature--reverse > * {
  direction: ltr;
}

.walkthrough-feature__media {
  min-width: 0;
}

.walkthrough-feature__content {
  display: grid;
  gap: 16px;
}

.walkthrough-feature__title {
  margin: 0;
  font-size: clamp(28px, 2.8vw, 42px);
  line-height: 1.14;
  letter-spacing: -0.03em;
  color: var(--pc-navy-950);
}

.walkthrough-secondary-card__title {
  margin: 0;
  font-size: clamp(22px, 2vw, 28px);
  line-height: 1.18;
  letter-spacing: -0.02em;
  color: var(--pc-navy-950);
}

.walkthrough-feature__body {
  margin: 0;
  font-size: clamp(16px, 1.25vw, 20px);
  line-height: 1.68;
  color: color-mix(in srgb, var(--text) 82%, #415763);
}

.walkthrough-feature__content ul {
  margin: 0;
  padding-left: 20px;
  display: grid;
  gap: 10px;
  font-size: clamp(15px, 1.05vw, 17px);
  line-height: 1.5;
  color: color-mix(in srgb, var(--text) 74%, #4f616a);
}

.walkthrough-feature__tariff {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: color-mix(in srgb, var(--primary) 72%, #295f54);
}

.product-shot {
  border: 1px solid color-mix(in srgb, var(--primary) 24%, var(--border));
  border-radius: var(--radius-lg);
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.94), rgba(18, 65, 55, 0.06));
  overflow: hidden;
  box-shadow: 0 14px 24px rgba(17, 64, 54, 0.1);
}

.walkthrough-feature .product-shot {
  border-color: rgba(18, 52, 90, 0.14);
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 42px rgba(18, 35, 58, 0.1);
}

.product-shot__top {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 11px 13px;
  border-bottom: 1px solid var(--pc-border);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(250, 247, 242, 0.86));
}

.product-shot__top span {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-pill);
  background: var(--pc-teal-500);
  opacity: 0.82;
}

.product-shot__top strong {
  margin-left: auto;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--pc-text-muted);
}

.product-shot__viewport {
  background:
    radial-gradient(460px 240px at 86% 16%, rgba(143, 203, 200, 0.12), transparent 72%),
    radial-gradient(420px 220px at 16% 90%, rgba(247, 183, 126, 0.14), transparent 74%),
    #ffffff;
  padding: 10px;
  aspect-ratio: 16 / 10;
}

.product-shot__viewport img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: var(--radius-md);
}

.walkthrough__secondary {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.walkthrough-secondary-card {
  border: 1px solid color-mix(in srgb, var(--primary) 17%, var(--border));
  border-radius: var(--radius-md);
  background: color-mix(in srgb, #ffffff 86%, var(--surface));
  padding: 14px;
  display: grid;
  gap: 12px;
}

.product-shot--compact {
  box-shadow: 0 10px 18px rgba(17, 64, 54, 0.08);
}

.section-head {
  display: grid;
  gap: 8px;
}

.section-head--center {
  text-align: center;
}

.section-head__title {
  margin: 0;
  font-size: clamp(30px, 3vw, 44px);
  line-height: 1.16;
  letter-spacing: -0.03em;
  color: var(--pc-navy-950);
}

.walkthrough__lead {
  margin: 0;
  font-size: 17px;
  line-height: 1.62;
  color: color-mix(in srgb, var(--text) 72%, #4f616a);
}

.value-grid,
.home-faq__grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.value-card {
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.86);
  padding: 22px;
  box-shadow: var(--pc-shadow-soft);
}

.faq-card {
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.88);
  padding: 22px;
  box-shadow: var(--pc-shadow-soft);
}

.plan-card {
  border: 1px solid color-mix(in srgb, var(--primary) 20%, var(--border));
  border-radius: var(--radius-md);
  background: color-mix(in srgb, #ffffff 82%, var(--surface));
  padding: 18px;
}

.plan-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-radius: var(--radius-xl);
  border-color: var(--pc-border);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--pc-shadow-soft);
  padding: 24px;
}

.value-card {
  position: relative;
  overflow: hidden;
}

.value-card::before {
  content: '';
  position: absolute;
  top: 18px;
  right: 18px;
  width: 42px;
  height: 42px;
  border-radius: var(--radius-pill);
  background: var(--pc-teal-100);
  opacity: 0.9;
}

.value-card--accent {
  background:
    radial-gradient(220px 140px at 88% 12%, rgba(143, 203, 200, 0.2), transparent 72%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), var(--pc-bg-card));
  border-color: rgba(18, 52, 90, 0.14);
}

.value-card--accent:nth-child(2)::before {
  background: var(--pc-peach-100);
}

.value-card__title {
  margin: 0 0 8px;
  font-size: 19px;
  line-height: 1.3;
  color: var(--pc-navy-950);
}

.faq-card__title {
  margin: 0 0 8px;
  font-size: 19px;
  line-height: 1.3;
  color: var(--pc-navy-950);
}

.plan-card__title {
  margin: 0 0 8px;
  font-size: 18px;
  line-height: 1.3;
}

.pricing-teaser__grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  max-width: 1040px;
  width: 100%;
  margin-inline: auto;
}

.pricing-toggle {
  justify-self: center;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px;
  border: 1px solid color-mix(in srgb, var(--primary) 22%, var(--border));
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, #ffffff 88%, var(--surface));
}

.pricing-toggle__btn {
  border: 1px solid transparent;
  border-radius: var(--radius-xs);
  padding: 6px 12px;
  min-height: 32px;
  font: inherit;
  font-size: 13px;
  color: color-mix(in srgb, var(--text) 78%, #2d5666);
  background: transparent;
  cursor: pointer;
}

.pricing-toggle__btn.is-active {
  border-color: var(--pc-teal-500);
  color: var(--pc-navy-900);
  background: var(--pc-teal-100);
  font-weight: 700;
  box-shadow: 0 6px 14px rgba(18, 35, 58, 0.06);
}

.plan-card__price {
  margin: -2px 0 0;
  font-size: 30px;
  line-height: 1.15;
  font-weight: 800;
  color: var(--pc-navy-950);
}

.plan-card__helper {
  margin: 0;
  font-size: 12px;
  color: var(--pc-teal-500);
  font-weight: 600;
}

.plan-card ul {
  margin: 2px 0 0;
  padding-left: 18px;
  display: grid;
  gap: 6px;
  color: color-mix(in srgb, var(--text) 72%, #4f616a);
}

.plan-card .btn {
  margin-top: auto;
  align-self: flex-start;
}

.pricing-teaser .plan-card .btn {
  min-height: 46px;
  padding: 0 18px;
  border-radius: var(--radius-md);
  background: var(--pc-navy-900);
  border-color: var(--pc-navy-900);
  color: #fff;
  box-shadow: 0 12px 26px rgba(18, 52, 90, 0.16);
  font-weight: 700;
}

.pricing-teaser .plan-card .btn:hover {
  background: var(--pc-navy-950);
  border-color: var(--pc-navy-950);
  box-shadow: 0 16px 32px rgba(18, 52, 90, 0.2);
}

.pricing-teaser .plan-card .btn--ghost {
  background: #fff;
  border-color: var(--pc-border-strong);
  color: var(--pc-navy-900);
  box-shadow: none;
}

.pricing-teaser .plan-card .btn--ghost:hover {
  background: var(--pc-bg-main);
  border-color: var(--pc-navy-900);
  color: var(--pc-navy-950);
}

.plan-card--pro {
  position: relative;
  border-color: rgba(18, 52, 90, 0.28);
  background:
    radial-gradient(260px 160px at 88% 10%, rgba(143, 203, 200, 0.22), transparent 72%),
    linear-gradient(180deg, #ffffff, var(--pc-bg-main));
  box-shadow: 0 20px 48px rgba(18, 35, 58, 0.12);
}

.plan-card--pro::before {
  content: 'Найпопулярніший';
  position: absolute;
  top: -16px;
  left: 24px;
  right: 24px;
  min-height: 28px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-pill);
  background: var(--pc-navy-900);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  box-shadow: 0 10px 22px rgba(18, 52, 90, 0.16);
}

.final-cta {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-2xl);
  padding: clamp(28px, 4vw, 48px);
  background:
    radial-gradient(520px 260px at 88% 18%, rgba(143, 203, 200, 0.22), transparent 72%),
    radial-gradient(520px 280px at 8% 92%, rgba(247, 183, 126, 0.22), transparent 74%),
    linear-gradient(135deg, #ffffff, var(--pc-bg-main));
  box-shadow: var(--pc-shadow-card);
}

.final-cta__title {
  margin: 0;
  font-size: clamp(30px, 3vw, 46px);
  line-height: 1.12;
  letter-spacing: -0.03em;
  max-width: 20ch;
  color: var(--pc-navy-950);
}

.final-cta .btn {
  min-height: 48px;
  padding: 0 22px;
  border-radius: var(--radius-md);
  background: var(--pc-navy-900);
  border-color: var(--pc-navy-900);
  color: #fff;
  box-shadow: 0 12px 26px rgba(18, 52, 90, 0.16);
  font-weight: 700;
}

.final-cta .btn:hover {
  background: var(--pc-navy-950);
  border-color: var(--pc-navy-950);
}

.final-cta .btn--ghost {
  background: rgba(255, 255, 255, 0.78);
  border-color: var(--pc-border-strong);
  color: var(--pc-navy-900);
  box-shadow: none;
}

.final-cta .btn--ghost:hover {
  background: #fff;
  border-color: var(--pc-navy-900);
}

.reveal {
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.45s ease, transform 0.45s ease;
}

.reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 980px) {
  .home-hero {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .hero-collage {
    min-height: auto;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .hero-shot {
    position: relative;
    inset: auto;
    width: auto;
  }

  .hero-shot--primary {
    grid-column: 1 / -1;
  }

  .walkthrough-feature {
    grid-template-columns: 1fr;
  }

  .walkthrough-feature--reverse {
    direction: ltr;
  }

  .walkthrough__secondary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .value-grid,
  .home-faq__grid,
  .pricing-teaser__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .home-lite {
    padding-top: 26px;
  }

  .home-lite__container {
    width: min(100% - 24px, var(--pc-container-wide));
    gap: 46px;
  }

  .value-grid,
  .walkthrough__secondary,
  .home-faq__grid,
  .pricing-teaser__grid {
    grid-template-columns: 1fr;
  }

  .hero-collage {
    grid-template-columns: 1fr;
  }
}
</style>
