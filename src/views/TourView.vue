<template>
  <section class="tour-page">
    <div class="tour-page__container">
      <section class="tour-hero reveal" id="hero">
        <div class="tour-hero__content">
          <p class="tour-hero__eyebrow">Тур по платформі</p>
          <h1 class="tour-hero__title">Подивіться, як PRO CONSULT допомагає вести приватну практику в одному просторі</h1>
          <p class="tour-hero__subtitle">
            Публічний профіль, онлайн-бронювання, сесії, нотатки, робочий зошит, платежі та аналітика — усе в одній
            системі, щоб ви могли фокусуватися на головному: клієнтах.
          </p>
          <div class="tour-hero__actions">
            <button v-if="isAuthenticated" class="btn" type="button" @click="goToCabinet">Перейти в кабінет</button>
            <RouterLink v-else class="btn" to="/signup">Спробувати безкоштовно</RouterLink>
            <RouterLink class="btn btn--ghost" to="/pricing">Переглянути тарифи</RouterLink>
          </div>
          <p class="tour-hero__microcopy">
            30 днів Pro для нових спеціалістів. Потім — безкоштовний Start або перехід на потрібний рівень доступу.
          </p>
        </div>
        <div class="tour-hero__visual">
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
                <img src="/images/tour/payments-block-1.jpg" alt="Підтвердження оплат у кабінеті" loading="lazy" decoding="async" />
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

      <nav class="tour-nav reveal" aria-label="Розділи туру">
        <a
          v-for="anchor in sectionAnchors"
          :key="anchor.id"
          :href="`#${anchor.id}`"
          :class="{ 'is-active': activeSectionId === anchor.id }"
        >
          {{ anchor.label }}
        </a>
      </nav>

      <section class="tour-intro reveal" id="intro">
        <h2 class="tour-section__title">Один робочий простір замість хаосу з різних інструментів</h2>
        <p class="muted">
          PRO CONSULT збирає в одному просторі профіль, запис, сесії, оплати, нотатки й аналітику. Ви ведете практику
          послідовно, без розривів між месенджерами, таблицями та розрізненими файлами.
        </p>
      </section>

      <section
        v-for="(feature, index) in featureSections"
        :id="feature.id"
        :key="feature.id"
        class="tour-feature reveal"
        :class="{ 'tour-feature--reverse': index % 2 === 1 }"
      >
        <div class="tour-feature__media">
          <div class="product-shot">
            <div class="product-shot__top">
              <span></span><span></span><span></span>
              <strong>{{ feature.screenLabel }}</strong>
            </div>
            <div class="product-shot__viewport">
              <img :src="feature.screenSrc" :alt="feature.screenAlt" loading="lazy" decoding="async" />
            </div>
          </div>
        </div>
        <div class="tour-feature__content">
          <h2 class="tour-section__title">{{ feature.title }}</h2>
          <p class="muted">{{ feature.body }}</p>
          <ul>
            <li v-for="point in feature.points" :key="point">{{ point }}</li>
          </ul>
          <p class="tour-feature__tariff">Доступ: {{ feature.tariffNote }}</p>
        </div>
      </section>

      <section class="tour-compare reveal" id="compare">
        <h2 class="tour-section__title">Менше ручної роботи. Більше контролю над практикою.</h2>
        <div class="tour-compare__grid">
          <article class="compare-card">
            <h3>Без PRO CONSULT</h3>
            <ul>
              <li>Запис у листуваннях</li>
              <li>Розклад у кількох місцях</li>
              <li>Нотатки окремо</li>
              <li>Оплати легко губляться</li>
              <li>Аналітики майже немає</li>
            </ul>
          </article>
          <article class="compare-card compare-card--good">
            <h3>З PRO CONSULT</h3>
            <ul>
              <li>Публічний профіль і запис</li>
              <li>Робочі години і слоти</li>
              <li>Сесії, нотатки й робочий зошит</li>
              <li>Статуси оплат і дій</li>
              <li>Аналітика практики</li>
            </ul>
          </article>
        </div>
      </section>

      <section class="tour-pricing reveal" id="pricing-teaser">
        <p class="tour-pricing__eyebrow">Рівні доступу</p>
        <h2 class="tour-section__title">Оберіть рівень доступу для вашої практики</h2>
        <p class="muted">
          Усі нові спеціалісти отримують 30 днів Pro безкоштовно. Після цього можна залишитися на безкоштовному Start
          або перейти на платний рівень для щоденної роботи.
        </p>
        <div class="tour-pricing__grid">
          <article class="tour-plan-card">
            <h3>Start</h3>
            <p class="muted">Для старту приватної практики</p>
            <ul>
              <li>Публічний профіль</li>
              <li>Онлайн-запис</li>
              <li>Базові сесії</li>
              <li>Базова аналітика</li>
              <li>До 5 активних клієнтів одночасно</li>
            </ul>
            <RouterLink class="btn" to="/signup">Почати безкоштовно</RouterLink>
          </article>
          <article class="tour-plan-card tour-plan-card--pro">
            <h3>Pro</h3>
            <p class="muted">Для стабільної щоденної практики</p>
            <ul>
              <li>Усе зі Start, плюс</li>
              <li>Робочий зошит</li>
              <li>Оплати і підтвердження оплат</li>
              <li>Розширена аналітика</li>
              <li>Публікації та більші ліміти</li>
            </ul>
            <RouterLink class="btn" to="/signup">Спробувати Pro 30 днів</RouterLink>
          </article>
          <article class="tour-plan-card">
            <h3>Leader</h3>
            <p class="muted">Для великої та інтенсивної практики</p>
            <ul>
              <li>Усе з Pro, плюс</li>
              <li>Максимальні ліміти</li>
              <li>Пріоритетний супровід</li>
              <li>Доступ для більшого робочого навантаження</li>
            </ul>
            <RouterLink class="btn btn--ghost" to="/support-and-data-requests">Подати запит</RouterLink>
          </article>
        </div>
        <p class="tour-pricing__request">
          Потрібні інші умови? <RouterLink to="/support-and-data-requests">Подайте окремий запит</RouterLink>.
        </p>
      </section>

      <section class="tour-faq reveal" id="faq">
        <h2 class="tour-section__title">FAQ</h2>
        <div class="tour-faq__list">
          <article v-for="(item, index) in faqItems" :key="item.question" class="faq-item">
            <button class="faq-item__question" type="button" @click="toggleFaq(index)">
              <span>{{ item.question }}</span>
              <span>{{ openFaqIndex === index ? '−' : '+' }}</span>
            </button>
            <p v-if="openFaqIndex === index" class="faq-item__answer muted">{{ item.answer }}</p>
          </article>
        </div>
      </section>

      <section class="tour-final-cta reveal" id="final-cta">
        <h2 class="tour-section__title">Подивіться, як може виглядати ваша практика в одному просторі</h2>
        <p class="muted">
          Почніть без комісії з кожної сесії, без хаосу з інструментів і без складного входу.
        </p>
        <div class="tour-final-cta__actions">
          <button v-if="isAuthenticated" class="btn" type="button" @click="goToCabinet">Перейти в кабінет</button>
          <RouterLink v-else class="btn" to="/signup">Спробувати безкоштовно</RouterLink>
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

const sectionAnchors = [
  { id: 'intro', label: 'Огляд' },
  { id: 'public-profile', label: 'Профіль' },
  { id: 'hours', label: 'Графік' },
  { id: 'booking', label: 'Бронювання' },
  { id: 'sessions-overview', label: 'Сесії' },
  { id: 'session-workflow', label: 'Workflow' },
  { id: 'payments', label: 'Оплати' },
  { id: 'notes', label: 'Нотатки' },
  { id: 'workbook', label: 'Зошит' },
  { id: 'publications', label: 'Публікації' },
  { id: 'analytics', label: 'Аналітика' },
  { id: 'todo', label: 'Todo' },
  { id: 'compare', label: 'Порівняння' },
  { id: 'pricing-teaser', label: 'Доступ' },
  { id: 'faq', label: 'FAQ' },
]

const featureSections = [
  {
    id: 'public-profile',
    title: 'Ваш публічний профіль для довіри й запису',
    body: 'Клієнт бачить спеціаліста, формат роботи, ключову інформацію і зрозумілий шлях до запису.',
    points: ['Окреме публічне посилання', 'Чіткий опис формату та умов', 'Швидкий перехід до бронювання'],
    tariffNote: 'Start / Pro / Leader',
    screenLabel: 'Public Profile',
    screenSrc: '/images/tour/public-profile-2.jpg',
    screenAlt: 'Публічний профіль спеціаліста з CTA для запису',
  },
  {
    id: 'hours',
    title: 'Плануйте робочі години без хаосу',
    body: 'Керуйте доступністю, слотами і ритмом практики без ручного перенесення між інструментами.',
    points: ['Контроль робочих вікон', 'Гнучкі правила доступності', 'Прозорий графік для клієнта'],
    tariffNote: 'Start / Pro / Leader',
    screenLabel: 'Schedule Rules',
    screenSrc: '/images/tour/schedule-rules.jpg',
    screenAlt: 'Налаштування робочих годин та правил доступності',
  },
  {
    id: 'booking',
    title: 'Приймайте записи без накладок',
    body: 'Публічний запис синхронізований з вашим графіком і зменшує ручні підтвердження.',
    points: ['Публічний booking flow', 'Логіка anti-overlap', 'Менше ручних уточнень у чатах'],
    tariffNote: 'Start / Pro / Leader',
    screenLabel: 'Slots',
    screenSrc: '/images/tour/slots-1.jpg',
    screenAlt: 'Доступні дати та вільні вікна для бронювання',
  },
  {
    id: 'sessions-overview',
    title: 'Керуйте майбутніми сесіями',
    body: 'Огляд сесій показує, що потрібно підтвердити зараз і яка зустріч наступна.',
    points: ['Pending confirmations', 'Найближча сесія', 'Операційний контроль щоденного графіка'],
    tariffNote: 'Pro / Leader',
    screenLabel: 'Sessions Overview',
    screenSrc: '/images/tour/booking-sessions-2.jpg',
    screenAlt: 'Кабінет керування запланованими сесіями',
  },
  {
    id: 'session-workflow',
    title: 'Контролюйте сесії в одному робочому потоці',
    body: 'У деталці сесії видно статус, формат, клієнта і наступні дії після зустрічі.',
    points: ['Повний контекст сесії', 'Meeting block і статус', 'Післясесійний workspace summary'],
    tariffNote: 'Pro / Leader',
    screenLabel: 'Session Workflow',
    screenSrc: '/images/tour/session-detail-1.jpg',
    screenAlt: 'Деталка сесії зі статусами та діями після зустрічі',
  },
  {
    id: 'payments',
    title: 'Контролюйте оплати в одному місці',
    body: 'Реквізити, підтвердження оплат і ключові дії зібрані в одному платіжному блоці.',
    points: ['Реквізити оплати', 'Статус підтвердження', 'Швидкі дії для фоллоу-апу'],
    tariffNote: 'Pro / Leader',
    screenLabel: 'Payments',
    screenSrc: '/images/tour/payments-block-1.jpg',
    screenAlt: 'Блок оплати з реквізитами і підтвердженням платежу',
  },
  {
    id: 'notes',
    title: 'Зберігайте приватні нотатки й рекомендації',
    body: 'Внутрішній робочий контекст по клієнту тримається структуровано і конфіденційно.',
    points: ['Нотатки по сесіях', 'Робочі рекомендації', 'Контекст без сторонніх файлів'],
    tariffNote: 'За фактичним рівнем доступу у вашому кабінеті',
    screenLabel: 'Notes',
    screenSrc: '/images/tour/notes-3.jpg',
    screenAlt: 'Конфіденційні приватні нотатки спеціаліста',
  },
  {
    id: 'workbook',
    title: 'Працюйте з клієнтом між сесіями через робочий зошит',
    body: 'Міжсесійна робота стає послідовною: матеріали, рефлексії і continuity в одному потоці.',
    points: ['Матеріали між сесіями', 'Безперервність роботи', 'Підтримка між зустрічами'],
    tariffNote: 'Pro / Leader',
    screenLabel: 'Workbook',
    screenSrc: '/images/tour/workbook-3.jpg',
    screenAlt: 'Робочий зошит клієнта для міжсесійної роботи',
  },
  {
    id: 'publications',
    title: 'Діліться своїми матеріалами й розвивайте власний голос',
    body: 'Публікації допомагають формувати публічну експертність і підтримувати професійне позиціонування.',
    points: ['Авторський журнал', 'Публічний шар експертності', 'Підсилення довіри до профілю'],
    tariffNote: 'Pro / Leader',
    screenLabel: 'Author Journal',
    screenSrc: '/images/tour/author-journal-1.jpg',
    screenAlt: 'Список авторських публікацій спеціаліста',
  },
  {
    id: 'analytics',
    title: 'Бачте базову й розширену картину практики',
    body: 'Аналітика показує ключові показники, динаміку і зрізи, які підтримують щоденні рішення.',
    points: ['Огляд ключових метрик', 'Динаміка по днях', 'Оперативний контроль навантаження'],
    tariffNote: 'Pro / Leader',
    screenLabel: 'Analytics',
    screenSrc: '/images/tour/analytics-1.jpg',
    screenAlt: 'Дашборд аналітики практики',
  },
  {
    id: 'todo',
    title: 'Тримайте робочі задачі під контролем',
    body: 'Todo-дошка допомагає не втрачати операційні задачі в щоденному потоці.',
    points: ['Список робочих задач', 'Фокус на наступних кроках', 'Порядок у поточних справах'],
    tariffNote: 'Pro / Leader',
    screenLabel: 'Todo Board',
    screenSrc: '/images/tour/todo-board-1.jpg',
    screenAlt: 'Робоча дошка задач спеціаліста',
  },
]

const faqItems = [
  {
    question: 'Чи можна почати безкоштовно?',
    answer:
      'Так. Нові спеціалісти отримують 30 днів Pro, а далі можуть залишитися на безкоштовному Start або перейти на інший рівень доступу.',
  },
  {
    question: 'Чи платформа підходить тільки психологам?',
    answer: 'Ні. Вона підходить спеціалістам приватної практики, які працюють через індивідуальні сесії.',
  },
  {
    question: 'Чи потрібно одразу прив’язувати картку?',
    answer: 'Ні. Вхід має бути м’яким, без жорсткого billing на старті.',
  },
  {
    question: 'Чим PRO CONSULT відрізняється від платформ із комісією?',
    answer: 'PRO CONSULT не забирає відсоток із кожної сесії.',
  },
]

const openFaqIndex = ref<number | null>(0)
const activeSectionId = ref('intro')

const toggleFaq = (index: number) => {
  openFaqIndex.value = openFaqIndex.value === index ? null : index
}

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
let navObserver: IntersectionObserver | null = null

onMounted(() => {
  const targets = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))
  if (targets.length) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            revealObserver?.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' }
    )

    targets.forEach((el) => revealObserver?.observe(el))
  }

  const sectionTargets = sectionAnchors
    .map((anchor) => document.getElementById(anchor.id))
    .filter((section): section is HTMLElement => section instanceof HTMLElement)

  if (!sectionTargets.length) return

  navObserver = new IntersectionObserver(
    (entries) => {
      const mostVisible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        .at(0)
      if (mostVisible) activeSectionId.value = mostVisible.target.id
    },
    { threshold: [0.22, 0.38, 0.6], rootMargin: '-18% 0px -54% 0px' }
  )

  sectionTargets.forEach((section) => navObserver?.observe(section))
})

onBeforeUnmount(() => {
  revealObserver?.disconnect()
  revealObserver = null
  navObserver?.disconnect()
  navObserver = null
})
</script>

<style scoped>
.tour-page {
  padding: 42px 0 120px;
  position: relative;
  isolation: isolate;
}

.tour-page::before {
  content: '';
  position: absolute;
  inset: -180px 0 0;
  pointer-events: none;
  z-index: -1;
  background:
    radial-gradient(1300px 560px at 18% 20%, rgba(17, 89, 69, 0.12), transparent 72%),
    radial-gradient(980px 460px at 88% 18%, rgba(219, 120, 39, 0.08), transparent 74%),
    linear-gradient(180deg, rgba(245, 247, 242, 0.82) 0%, rgba(247, 248, 251, 0.94) 38%, rgba(247, 248, 251, 0.95) 100%);
}

.tour-page__container {
  width: min(1480px, 96vw);
  margin: 0 auto;
  display: grid;
  gap: 34px;
}

.tour-hero,
.tour-intro,
.tour-final-cta,
.tour-pricing,
.tour-faq,
.tour-compare {
  border: 1px solid color-mix(in srgb, var(--primary) 20%, var(--border));
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, #ffffff 84%, var(--surface));
  padding: clamp(20px, 2.6vw, 32px);
}

.tour-hero {
  background: linear-gradient(132deg, rgba(255, 255, 255, 0.88), rgba(18, 64, 54, 0.06));
  display: grid;
  grid-template-columns: minmax(0, 0.84fr) minmax(0, 1.16fr);
  gap: clamp(18px, 2.2vw, 34px);
  align-items: center;
}

.tour-hero__content {
  display: grid;
  gap: 14px;
}

.tour-hero__eyebrow,
.tour-pricing__eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--text) 62%, #50606a);
}

.tour-hero__title {
  margin: 0;
  font-size: clamp(37px, 4vw, 66px);
  line-height: 1.12;
  letter-spacing: -0.02em;
  max-width: 16ch;
}

.tour-hero__subtitle,
.tour-hero__microcopy {
  margin: 0;
  color: var(--muted);
  max-width: 60ch;
}

.tour-hero__microcopy {
  font-size: 13px;
}

.tour-hero__actions,
.tour-final-cta__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.tour-hero__visual {
  min-width: 0;
}

.hero-collage {
  position: relative;
  min-height: clamp(520px, 42vw, 670px);
  padding: 20px 6px 8px;
}

.hero-shot {
  position: absolute;
  border: 1px solid color-mix(in srgb, var(--primary) 20%, var(--border));
  border-radius: var(--radius-lg);
  background: linear-gradient(168deg, rgba(255, 255, 255, 0.94), rgba(18, 65, 55, 0.06));
  overflow: hidden;
  box-shadow: 0 16px 32px rgba(17, 64, 54, 0.13);
}

.hero-shot__top {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 11px;
  border-bottom: 1px solid color-mix(in srgb, var(--primary) 14%, var(--border));
}

.hero-shot__top span {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--primary) 32%, var(--border));
}

.hero-shot__viewport {
  padding: 8px;
  background: linear-gradient(180deg, rgba(10, 30, 45, 0.03), rgba(10, 30, 45, 0.01));
}

.hero-shot__viewport img {
  display: block;
  width: 100%;
  height: auto;
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

.tour-nav {
  position: sticky;
  top: 84px;
  z-index: 6;
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
  padding: 8px;
  border: 1px solid color-mix(in srgb, var(--primary) 14%, var(--border));
  border-radius: var(--radius-md);
  background: color-mix(in srgb, #ffffff 74%, var(--surface));
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 22px rgba(17, 64, 54, 0.08);
}

.tour-nav a {
  border: 1px solid color-mix(in srgb, var(--primary) 16%, var(--border));
  border-radius: var(--radius-xs);
  padding: 5px 10px;
  font-size: 11.5px;
  color: color-mix(in srgb, var(--text) 82%, #2d5666);
  background: color-mix(in srgb, #ffffff 80%, var(--surface));
  white-space: nowrap;
  transition: border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.tour-nav a.is-active {
  border-color: color-mix(in srgb, var(--primary) 56%, var(--border));
  color: color-mix(in srgb, var(--primary) 78%, #1f4f5e);
  background: color-mix(in srgb, #ffffff 68%, var(--surface));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary) 26%, transparent);
}

.tour-section__title {
  margin: 0;
  font-size: clamp(27px, 2.8vw, 38px);
  line-height: 1.2;
}

.tour-intro {
  display: grid;
  gap: 10px;
}

.tour-feature {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 26px;
  align-items: start;
}

.tour-feature--reverse {
  direction: rtl;
}

.tour-feature--reverse > * {
  direction: ltr;
}

.tour-feature__content {
  display: grid;
  gap: 12px;
}

.tour-feature__content ul,
.compare-card ul,
.tour-plan-card ul {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 6px;
  color: color-mix(in srgb, var(--text) 72%, #4f616a);
}

.tour-feature__tariff {
  margin: 0;
  font-size: 13px;
  color: color-mix(in srgb, var(--text) 64%, #50606a);
}

.tour-feature__media {
  min-width: 0;
}

.product-shot {
  border: 1px solid color-mix(in srgb, var(--primary) 24%, var(--border));
  border-radius: var(--radius-lg);
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.94), rgba(18, 65, 55, 0.06));
  overflow: hidden;
  box-shadow: 0 14px 24px rgba(17, 64, 54, 0.1);
}

.product-shot__top {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--primary) 16%, var(--border));
}

.product-shot__top span {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--primary) 32%, var(--border));
}

.product-shot__top strong {
  margin-left: auto;
  font-size: 12px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--text) 62%, #4f616a);
}

.product-shot__viewport {
  background: linear-gradient(180deg, rgba(10, 30, 45, 0.04), rgba(10, 30, 45, 0.01));
  padding: 10px;
}

.product-shot__viewport img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: var(--radius-md);
}

.tour-compare__grid,
.tour-pricing__grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.tour-pricing {
  display: grid;
  gap: 12px;
}

.tour-plan-card {
  border: 1px solid color-mix(in srgb, var(--primary) 22%, var(--border));
  border-radius: var(--radius-md);
  padding: 18px;
  background: color-mix(in srgb, #ffffff 84%, var(--surface));
  display: grid;
  gap: 10px;
}

.tour-plan-card--pro {
  background: linear-gradient(180deg, rgba(17, 64, 54, 0.1), rgba(255, 255, 255, 0.9));
}

.tour-pricing__request {
  margin: 0;
  color: color-mix(in srgb, var(--text) 68%, #4f616a);
}

.tour-pricing__request a {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.compare-card {
  border: 1px solid color-mix(in srgb, var(--primary) 18%, var(--border));
  border-radius: var(--radius-md);
  padding: 16px;
  background: color-mix(in srgb, #ffffff 86%, var(--surface));
}

.compare-card h3,
.tour-plan-card h3 {
  margin: 0;
  font-size: 20px;
}

.compare-card--good {
  background: linear-gradient(180deg, rgba(17, 64, 54, 0.1), rgba(255, 255, 255, 0.92));
}

.tour-faq {
  display: grid;
  gap: 12px;
}

.tour-faq__list {
  display: grid;
  gap: 8px;
}

.faq-item {
  border: 1px solid color-mix(in srgb, var(--primary) 18%, var(--border));
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, #ffffff 88%, var(--surface));
}

.faq-item__question {
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
  font: inherit;
  color: inherit;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
}

.faq-item__answer {
  margin: 0;
  padding: 0 14px 12px;
}

.tour-final-cta {
  display: grid;
  gap: 10px;
  background: linear-gradient(140deg, rgba(255, 255, 255, 0.88), rgba(219, 120, 39, 0.08));
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

@media (max-width: 1080px) {
  .tour-hero {
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

  .tour-feature {
    grid-template-columns: 1fr;
  }

  .tour-feature--reverse {
    direction: ltr;
  }
}

@media (max-width: 900px) {
  .tour-pricing__grid,
  .tour-compare__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .tour-page {
    padding-top: 26px;
  }

  .tour-nav {
    top: 70px;
    overflow-x: auto;
    flex-wrap: nowrap;
  }

  .tour-nav a {
    flex: 0 0 auto;
  }

  .hero-collage {
    grid-template-columns: 1fr;
  }
}
</style>
