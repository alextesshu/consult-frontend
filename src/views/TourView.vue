<template>
  <section class="tour-page">
    <div class="tour-page__container">
      <section class="tour-hero reveal" id="hero">
        <p class="tour-hero__eyebrow">Тур по платформі</p>
        <h1 class="tour-hero__title">Подивіться, як PRO CONSULT допомагає вести приватну практику в одному просторі</h1>
        <p class="tour-hero__subtitle">
          Публічний профіль, онлайн-запис, сесії, нотатки, робочий зошит, оплати й аналітика — без комісії з кожної
          сесії.
        </p>
        <div class="tour-hero__actions">
          <button v-if="isAuthenticated" class="btn" type="button" @click="goToCabinet">Перейти в кабінет</button>
          <RouterLink v-else class="btn" to="/signup">Спробувати безкоштовно</RouterLink>
          <RouterLink class="btn btn--ghost" to="/pricing">Переглянути тарифи</RouterLink>
        </div>
        <p class="tour-hero__microcopy">
          30 днів Pro для нових спеціалістів. Потім — безкоштовний Start або перехід на потрібний рівень доступу.
        </p>
      </section>

      <nav class="tour-nav reveal" aria-label="Розділи туру">
        <a v-for="anchor in sectionAnchors" :key="anchor.id" :href="`#${anchor.id}`">{{ anchor.label }}</a>
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
          <div class="product-mockup">
            <div class="product-mockup__top">
              <span></span><span></span><span></span>
              <strong>{{ feature.mockupLabel }}</strong>
            </div>
            <div class="product-mockup__body">
              <div class="product-mockup__line product-mockup__line--strong"></div>
              <div class="product-mockup__line"></div>
              <div class="product-mockup__line product-mockup__line--short"></div>
              <div class="product-mockup__grid">
                <div class="product-mockup__cell" v-for="cell in feature.mockupCells" :key="cell"></div>
              </div>
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
  { id: 'intro', label: 'Intro' },
  { id: 'public-profile', label: 'Профіль' },
  { id: 'hours', label: 'Графік' },
  { id: 'booking', label: 'Бронювання' },
  { id: 'sessions-payments', label: 'Сесії та оплати' },
  { id: 'notes', label: 'Нотатки' },
  { id: 'workbook', label: 'Зошит' },
  { id: 'publications', label: 'Публікації' },
  { id: 'analytics-basic', label: 'Базова аналітика' },
  { id: 'analytics-advanced', label: 'Розширена аналітика' },
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
    mockupLabel: 'Public Profile',
    mockupCells: [1, 2, 3],
  },
  {
    id: 'hours',
    title: 'Плануйте робочі години без хаосу',
    body: 'Керуйте доступністю, слотами і ритмом практики без ручного перенесення між інструментами.',
    points: ['Контроль робочих вікон', 'Гнучкі правила доступності', 'Прозорий графік для клієнта'],
    tariffNote: 'Start / Pro / Leader',
    mockupLabel: 'Availability & Slots',
    mockupCells: [1, 2, 3, 4],
  },
  {
    id: 'booking',
    title: 'Приймайте записи без накладок',
    body: 'Публічний запис синхронізований з вашим графіком і зменшує ручні підтвердження.',
    points: ['Публічний booking flow', 'Логіка anti-overlap', 'Менше ручних уточнень у чатах'],
    tariffNote: 'Start / Pro / Leader',
    mockupLabel: 'Booking Flow',
    mockupCells: [1, 2, 3],
  },
  {
    id: 'sessions-payments',
    title: 'Контролюйте сесії та оплати в одному місці',
    body: 'Статуси сесій і оплат видно в робочому процесі, разом із потрібними діями.',
    points: ['Статуси сесій', 'Статуси оплат', 'Швидкі дії без втрати контексту'],
    tariffNote: 'Pro / Leader',
    mockupLabel: 'Session Detail & Payment',
    mockupCells: [1, 2, 3, 4],
  },
  {
    id: 'notes',
    title: 'Зберігайте приватні нотатки й рекомендації',
    body: 'Внутрішній робочий контекст по клієнту тримається структуровано і конфіденційно.',
    points: ['Нотатки по сесіях', 'Робочі рекомендації', 'Контекст без сторонніх файлів'],
    tariffNote: 'За фактичним рівнем доступу у вашому кабінеті',
    mockupLabel: 'Private Notes Workspace',
    mockupCells: [1, 2, 3],
  },
  {
    id: 'workbook',
    title: 'Працюйте з клієнтом між сесіями через робочий зошит',
    body: 'Міжсесійна робота стає послідовною: матеріали, рефлексії і continuity в одному потоці.',
    points: ['Матеріали між сесіями', 'Безперервність роботи', 'Підтримка між зустрічами'],
    tariffNote: 'Pro / Leader',
    mockupLabel: 'Client Workbook',
    mockupCells: [1, 2, 3, 4],
  },
  {
    id: 'publications',
    title: 'Діліться своїми матеріалами й розвивайте власний голос',
    body: 'Публікації допомагають формувати публічну експертність і підтримувати професійне позиціонування.',
    points: ['Авторський журнал', 'Публічний шар експертності', 'Підсилення довіри до профілю'],
    tariffNote: 'Pro / Leader',
    mockupLabel: 'Publications',
    mockupCells: [1, 2, 3],
  },
  {
    id: 'analytics-basic',
    title: 'Бачте базову картину вашої практики',
    body: 'Швидкий огляд поточного стану практики для щоденних рішень.',
    points: ['Огляд ключових показників', 'Динаміка завантаження', 'Оперативний контроль'],
    tariffNote: 'Start / Pro / Leader',
    mockupLabel: 'Basic Analytics',
    mockupCells: [1, 2, 3, 4],
  },
  {
    id: 'analytics-advanced',
    title: 'Аналізуйте практику глибше',
    body: 'Розширені зрізи допомагають бачити патерни, планувати навантаження і стабілізувати практику.',
    points: ['Глибші графіки', 'Патерни і тренди', 'Підтримка рішень по навантаженню'],
    tariffNote: 'Pro / Leader',
    mockupLabel: 'Advanced Analytics',
    mockupCells: [1, 2, 3, 4],
  },
  {
    id: 'todo',
    title: 'Тримайте робочі задачі під контролем',
    body: 'Todo-дошка допомагає не втрачати операційні задачі в щоденному потоці.',
    points: ['Список робочих задач', 'Фокус на наступних кроках', 'Порядок у поточних справах'],
    tariffNote: 'Pro / Leader',
    mockupLabel: 'Todo Board',
    mockupCells: [1, 2, 3],
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

onMounted(() => {
  const targets = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))
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
    { threshold: 0.14, rootMargin: '0px 0px -8% 0px' }
  )

  targets.forEach((el) => revealObserver?.observe(el))
})

onBeforeUnmount(() => {
  revealObserver?.disconnect()
  revealObserver = null
})
</script>

<style scoped>
.tour-page {
  padding: 88px 0 120px;
  position: relative;
  isolation: isolate;
}

.tour-page::before {
  content: '';
  position: absolute;
  inset: -220px 0;
  pointer-events: none;
  z-index: -1;
  background:
    radial-gradient(1200px 540px at 14% 28%, rgba(6, 58, 97, 0.14), transparent 72%),
    radial-gradient(860px 440px at 84% 20%, rgba(219, 120, 39, 0.09), transparent 72%),
    linear-gradient(180deg, rgba(247, 248, 251, 0.74) 0%, rgba(247, 248, 251, 0.92) 32%, rgba(247, 248, 251, 0.9) 100%);
}

.tour-page__container {
  width: min(1200px, 92vw);
  margin: 0 auto;
  display: grid;
  gap: 46px;
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
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.88), rgba(17, 64, 54, 0.06));
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
  font-size: clamp(32px, 3.8vw, 54px);
  line-height: 1.12;
  letter-spacing: -0.02em;
  max-width: 20ch;
}

.tour-hero__subtitle,
.tour-hero__microcopy {
  margin: 0;
  color: var(--muted);
  max-width: 68ch;
}

.tour-hero__microcopy {
  font-size: 13px;
}

.tour-hero__actions,
.tour-final-cta__actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.tour-nav {
  position: sticky;
  top: 78px;
  z-index: 6;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px;
  border: 1px solid color-mix(in srgb, var(--primary) 18%, var(--border));
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, #ffffff 88%, var(--surface));
  backdrop-filter: blur(8px);
}

.tour-nav a {
  border: 1px solid color-mix(in srgb, var(--primary) 20%, var(--border));
  border-radius: var(--radius-xs);
  padding: 6px 10px;
  font-size: 12px;
  color: color-mix(in srgb, var(--text) 86%, #2d5666);
  white-space: nowrap;
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
  gap: 24px;
  align-items: center;
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

.product-mockup {
  border: 1px solid color-mix(in srgb, var(--primary) 24%, var(--border));
  border-radius: var(--radius-lg);
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.92), rgba(18, 65, 55, 0.08));
  overflow: hidden;
  box-shadow: 0 12px 22px rgba(17, 64, 54, 0.1);
}

.product-mockup__top {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--primary) 16%, var(--border));
}

.product-mockup__top span {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--primary) 32%, var(--border));
}

.product-mockup__top strong {
  margin-left: auto;
  font-size: 12px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--text) 62%, #4f616a);
}

.product-mockup__body {
  padding: 12px;
  display: grid;
  gap: 8px;
}

.product-mockup__line {
  height: 7px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--primary) 12%, var(--border));
}

.product-mockup__line--strong {
  width: 84%;
}

.product-mockup__line--short {
  width: 62%;
}

.product-mockup__grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.product-mockup__cell {
  height: 64px;
  border: 1px solid color-mix(in srgb, var(--primary) 16%, var(--border));
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, #ffffff 85%, var(--surface));
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
    padding-top: 102px;
  }

  .tour-nav {
    top: 70px;
    overflow-x: auto;
    flex-wrap: nowrap;
  }

  .tour-nav a {
    flex: 0 0 auto;
  }
}
</style>
