<template>
  <section class="home-lite">
    <div class="home-lite__container">
      <section class="home-hero reveal" aria-labelledby="home-hero-title">
        <div class="home-hero__content">
          <p class="home-hero__eyebrow">ДЛЯ СПЕЦІАЛІСТІВ ПРИВАТНОЇ ПРАКТИКИ</p>
          <h1 id="home-hero-title" class="home-hero__title">Простір для ведення консультацій</h1>
          <p class="home-hero__subtitle">
            Публічний профіль, сесії, календар, власний блог та багато іншого — щоб впевнено презентувати себе,
            приймати клієнтів і працювати системно.
          </p>
          <p class="home-hero__support">Без комісій з консультацій і без залежності від зовнішнього майданчика.</p>
          <div class="home-hero__actions">
            <button v-if="isAuthenticated" class="btn" type="button" @click="goToCabinet">Перейти в кабінет</button>
            <RouterLink v-else class="btn" to="/signup">Створити свій простір</RouterLink>
            <a class="btn btn--ghost" href="#features">Подивитися можливості</a>
          </div>
          <ul class="hero-trust" aria-label="Переваги платформи">
            <li v-for="marker in trustMarkers" :key="marker">{{ marker }}</li>
          </ul>
        </div>

        <div class="home-hero__visual" aria-hidden="true">
          <article class="product-story">
            <span class="product-story__accent product-story__accent--peach"></span>
            <span class="product-story__accent product-story__accent--teal"></span>
            <div class="product-story__dashboard-card">
              <header class="product-story__dashboard-header">
                <span class="product-story__dashboard-mark">
                  <i></i><i></i><i></i><i></i>
                </span>
                <strong>Мій кабінет</strong>
                <span class="product-story__top-actions">
                  <i></i>
                  <i></i>
                  <span class="product-story__dashboard-dot"></span>
                </span>
              </header>
              <div class="product-story__dashboard-shell">
                <aside class="product-story__rail">
                  <span class="is-active"></span>
                  <span></span>
                  <span></span>
                </aside>
                <div class="product-story__dashboard-body">
                  <div class="product-story__stat product-story__stat--teal">
                    <span>Нові запити</span>
                    <strong>2</strong>
                  </div>
                  <div class="product-story__stat product-story__stat--peach">
                    <span>Сесії сьогодні</span>
                    <strong>3</strong>
                  </div>
                  <div class="product-story__schedule">
                    <span>Календар</span>
                    <strong>15:00</strong>
                  </div>
                </div>
                <div class="product-story__requests">
                  <span>Останні запити</span>
                  <p><strong>Наталія М.</strong><em>5 хв тому</em></p>
                  <p><strong>Ігор Л.</strong><em>вчора</em></p>
                </div>
              </div>
            </div>

            <div class="product-story__public-card">
              <header class="product-story__header">
                <span>Публічний профіль</span>
              </header>
              <div class="product-story__profile">
                <img
                  class="product-story__portrait-photo"
                  :src="heroSpecialistDemo"
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <div class="product-story__copy">
                  <strong>Олена К.</strong>
                  <span>Психолог, гештальт-терапевт</span>
                  <p>Підтримую у складних емоціях, стосунках і пошуку внутрішньої опори.</p>
                </div>
              </div>
              <div class="product-story__chips">
                <span>Тривога</span>
                <span>Самооцінка</span>
                <span>Стосунки</span>
              </div>
              <div class="product-story__profile-actions">
                <button type="button">Залишити запит</button>
                <span></span>
              </div>
            </div>

            <div class="product-story__request-card">
              <span class="product-story__request-icon"></span>
              <span class="product-story__request-label">Новий запит</span>
              <p>Клієнт залишив контакт і повідомлення.</p>
              <button type="button">Опрацювати</button>
            </div>

            <div class="product-story__calendar-card">
              <span class="product-story__calendar-icon"></span>
              <span class="product-story__calendar-label">Сьогодні</span>
              <strong>15:00</strong>
              <p>консультація з клієнтом</p>
              <div class="product-story__time-rail">
                <span>14:00</span>
                <span class="is-current">15:00</span>
                <span>16:00</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section id="features" class="value-section reveal" aria-labelledby="value-title">
        <div class="section-head section-head--center">
          <p class="section-head__eyebrow">Можливості простору</p>
          <h2 id="value-title" class="section-head__title">Публічний профіль і робочий кабінет в одному просторі</h2>
          <p class="section-head__subtitle">
            Pro Consult допомагає спеціалісту презентувати себе для клієнта й тримати ключові робочі процеси в одному місці.
          </p>
        </div>
        <div class="value-grid" role="list" aria-label="Ключові можливості Pro Consult">
          <article v-for="item in valueCards" :key="item.title" class="value-card" role="listitem">
            <span class="icon-wrap" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path v-for="path in iconPaths[item.icon]" :key="path" :d="path"></path>
              </svg>
            </span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.copy }}</p>
          </article>
        </div>
      </section>

      <section class="how how--merged reveal" aria-labelledby="how-title">
        <div class="section-head section-head--center">
          <p class="section-head__eyebrow">Сценарій роботи</p>
          <h2 id="how-title" class="section-head__title how__title">Від першого запиту до сесії в календарі</h2>
        </div>
        <div class="how__row" role="list" aria-label="Кроки використання платформи">
          <article v-for="step in howSteps" :key="step.title" class="how-step" role="listitem">
            <span class="icon-wrap" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path v-for="path in iconPaths[step.icon]" :key="path" :d="path"></path>
              </svg>
            </span>
            <span class="how-step__connector" aria-hidden="true">→</span>
            <h3>{{ step.title }}</h3>
            <p>{{ step.copy }}</p>
          </article>
        </div>
      </section>

      <section class="differentiation reveal" aria-labelledby="differentiation-title">
        <div class="section-head">
          <p class="section-head__eyebrow">Власна присутність</p>
          <h2 id="differentiation-title" class="section-head__title">Не просто сайт-візитка</h2>
          <p class="section-head__subtitle">
            Pro Consult — це робочий інструмент для зростання власної практики: профіль, запити, сесії, календар,
            матеріали й клієнтський контекст повʼязані між собою.
          </p>
        </div>
        <div class="differentiation__grid" role="list" aria-label="Відмінності Pro Consult">
          <article v-for="item in differentiationCards" :key="item.title" class="difference-card" role="listitem">
            <span class="icon-wrap icon-wrap--soft" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path v-for="path in iconPaths[item.icon]" :key="path" :d="path"></path>
              </svg>
            </span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.copy }}</p>
          </article>
        </div>
      </section>

      <section class="inside-section reveal" aria-labelledby="inside-title">
        <div class="section-head section-head--center">
          <p class="section-head__eyebrow">Що всередині</p>
          <h2 id="inside-title" class="section-head__title">Інструменти, які підтримують консультаційну роботу</h2>
        </div>
        <div class="benefit-chips" role="list" aria-label="Складові Pro Consult">
          <article v-for="item in compactValueStrip" :key="item.title" class="benefit-chip" role="listitem">
            <span class="icon-wrap icon-wrap--soft benefit-chip__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path v-for="path in iconPaths[item.icon]" :key="path" :d="path"></path>
              </svg>
            </span>
            <span class="benefit-chip__label">{{ item.title }}</span>
          </article>
        </div>
      </section>

      <section id="pricing" class="pricing reveal" aria-labelledby="pricing-title">
        <div class="pricing-layout">
          <div class="pricing-layout__left">
            <div class="section-head pricing-head">
              <p class="section-head__eyebrow">Тарифи</p>
              <h2 id="pricing-title" class="section-head__title pricing-title">Прозорі рівні доступу без комісій з консультацій</h2>
              <p class="section-head__subtitle">Ви платите за доступ до інструментів, а не віддаєте відсоток з кожної консультації.</p>
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

            <div class="pricing__grid">
              <article v-for="plan in pricingPlans" :key="plan.name" class="plan-card" :class="{ 'plan-card--pro': plan.name === 'Pro' }">
                <p v-if="plan.name === 'Pro'" class="plan-card__badge">Для активної практики</p>
                <h3>{{ plan.name }}</h3>
                <p class="plan-card__price">{{ plan.price }}</p>
                <p v-if="plan.helper" class="plan-card__helper">{{ plan.helper }}</p>
                <ul>
                  <li v-for="feature in plan.features" :key="feature">{{ feature }}</li>
                </ul>
                <RouterLink class="btn" :class="{ 'btn--ghost': plan.ghostCta }" :to="plan.ctaTo">{{ plan.ctaLabel }}</RouterLink>
              </article>
            </div>
          </div>

          <aside class="pricing-layout__right" aria-label="Переваги профілю і запитів">
            <p class="section-head__eyebrow">Профіль і запити</p>
            <h3 class="pricing-promo__title">Власний профіль без залежності від зовнішнього майданчика</h3>
            <p class="pricing-promo__copy">
              Клієнт відкриває ваш профіль, залишає запит, а далі ви керуєте сесіями, календарем і матеріалами у кабінеті.
            </p>

            <div class="pricing-promo__preview" aria-hidden="true">
              <article class="booking-preview booking-preview--profile pricing-booking-preview--profile">
                <header class="booking-preview__header">Публічний профіль</header>
                <div class="booking-preview__body">
                  <div class="profile-mini">
                    <div class="profile-mini__avatar">ОК</div>
                    <div>
                      <p class="profile-mini__name">Олена Коваль</p>
                      <p class="profile-mini__role">Психолог, гештальт-терапевт</p>
                    </div>
                  </div>
                  <div class="profile-mini__chips">
                    <span>Тривога</span>
                    <span>Самооцінка</span>
                    <span>Відносини</span>
                  </div>
                  <button class="profile-mini__cta" type="button">Залишити запит</button>
                </div>
              </article>

              <article class="booking-preview booking-preview--calendar pricing-booking-preview--calendar">
                <header class="booking-preview__header">Календар сесій</header>
                <div class="booking-preview__body">
                  <div class="calendar-mini__top">
                    <span>Травень 2026</span>
                    <span>15 травня</span>
                  </div>
                  <div class="calendar-mini__grid" aria-label="Календар доступних дат">
                    <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Нд</span>
                    <span>12</span><span>13</span><span>14</span><span class="is-selected">15</span><span>16</span><span>17</span><span>18</span>
                  </div>
                  <div class="session-mini__item">
                    <strong>15:00</strong>
                    <span>Консультація зʼявилась у календарі</span>
                  </div>
                </div>
              </article>
            </div>
          </aside>
        </div>
      </section>

      <section class="final-cta reveal">
        <h2 class="final-cta__title">Створіть простір, у якому вашу роботу легко зрозуміти й зручно продовжити</h2>
        <p>Оформіть публічний профіль, прийміть перший запит і перевірте, як Pro Consult допомагає вести консультації системно.</p>
        <div class="final-cta__actions">
          <RouterLink v-if="!isAuthenticated" class="btn" to="/signup">Створити свій простір</RouterLink>
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
import heroSpecialistDemo from '../assets/home/hero-specialist-demo.png'

type IconKey =
  | 'profile'
  | 'booking'
  | 'session'
  | 'clients'
  | 'payments'
  | 'materials'
  | 'feedback'
  | 'analytics'
  | 'security'
  | 'support'

const router = useRouter()
const auth = useAuthStore()
const isAuthenticated = computed(() => Boolean(auth.accessToken))
const roles = computed(() => auth.me?.user.roles ?? auth.user?.roles ?? [])
const billingCycle = ref<'monthly' | 'yearly'>('monthly')

const iconPaths: Record<IconKey, string[]> = {
  profile: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M4 20a8 8 0 0 1 16 0'],
  booking: ['M7 3v3M17 3v3M4 9h16', 'M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z'],
  session: ['M9 8.5v7l6-3.5-6-3.5Z', 'M4 6h16v12H4z'],
  clients: ['M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z', 'M16 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z', 'M3.5 20a5 5 0 0 1 9 0', 'M13 20a4 4 0 0 1 7 0'],
  payments: ['M3 7h18v10H3z', 'M3 11h18', 'M7 15h3'],
  materials: ['M7 3h7l4 4v14H7z', 'M14 3v4h4', 'M10 13h5M10 17h5'],
  feedback: ['M4 5h16v10H8l-4 4V5z', 'M8 9h8M8 12h5'],
  analytics: ['M5 19V9', 'M12 19V5', 'M19 19v-7'],
  security: ['M12 3l7 3v5c0 4.5-3 7.8-7 10-4-2.2-7-5.5-7-10V6l7-3Z', 'M9.5 12.5 11.2 14.2 14.8 10.6'],
  support: ['M12 18v2', 'M8.5 9.5a3.5 3.5 0 1 1 6.2 2.2c-.9.8-1.7 1.3-1.7 2.3v.5', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z'],
}

const trustMarkers = ['Публічний профіль', 'Запити без реєстрації', 'Сесії та календар', 'Власний блог', 'Без комісій']

const valueCards: Array<{ icon: IconKey; title: string; copy: string }> = [
  {
    icon: 'profile',
    title: 'Публічний профіль',
    copy: 'Сторінка, яку можна впевнено надіслати клієнту: з описом, умовами, форматами роботи й кнопкою запиту.',
  },
  {
    icon: 'booking',
    title: 'Запити від клієнтів',
    copy: 'Клієнт залишає контакт і короткий опис запиту без створення акаунта.',
  },
  {
    icon: 'session',
    title: 'Сесії та календар',
    copy: 'Спеціаліст створює сесію, і вона зʼявляється в робочому календарі.',
  },
  {
    icon: 'materials',
    title: 'Матеріали й нотатки',
    copy: 'Приватні нотатки, клієнтський контекст і матеріали для клієнта залишаються поруч із сесіями.',
  },
]

const compactValueStrip: Array<{ icon: IconKey; title: string }> = [
  { icon: 'profile', title: 'Публічний профіль' },
  { icon: 'booking', title: 'Запити без реєстрації' },
  { icon: 'session', title: 'Сесії та календар' },
  { icon: 'clients', title: 'Клієнти й історія роботи' },
  { icon: 'security', title: 'Приватні нотатки' },
  { icon: 'materials', title: 'Матеріали для клієнта' },
  { icon: 'feedback', title: 'Авторський блог' },
  { icon: 'payments', title: 'Тарифи без комісій' },
]

const howSteps: Array<{ icon: IconKey; title: string; copy: string }> = [
  {
    icon: 'profile',
    title: 'Ви оформлюєте публічний профіль',
    copy: 'Показуєте спеціалізацію, формат роботи, умови консультацій і контакти.',
  },
  {
    icon: 'booking',
    title: 'Клієнт залишає запит',
    copy: 'Без реєстрації: імʼя, контакт і коротке повідомлення.',
  },
  {
    icon: 'support',
    title: 'Ви отримуєте сповіщення',
    copy: 'Email, дзвіночок і підказка в кабінеті допомагають не загубити новий запит.',
  },
  {
    icon: 'session',
    title: 'Ви створюєте сесію',
    copy: 'Узгоджуєте час із клієнтом і додаєте консультацію до календаря.',
  },
  {
    icon: 'materials',
    title: 'Ведете роботу системно',
    copy: 'Сесії, клієнти, нотатки й матеріали залишаються у вашому кабінеті.',
  },
]

const differentiationCards: Array<{ icon: IconKey; title: string; copy: string }> = [
  {
    icon: 'profile',
    title: 'Більше, ніж сторінка з контактами',
    copy: 'Профіль не лише презентує спеціаліста — через нього клієнт може залишити запит і почати шлях до консультації.',
  },
  {
    icon: 'session',
    title: 'Більше, ніж календар',
    copy: 'Сесії повʼязані з клієнтами, запитами, нотатками й матеріалами.',
  },
  {
    icon: 'payments',
    title: 'Без комісій з консультацій',
    copy: 'Ви платите за простір і можливості, а не віддаєте відсоток з кожної сесії.',
  },
  {
    icon: 'security',
    title: 'Власна присутність',
    copy: 'Профіль працює на розвиток вашої практики, а не на стрічку зовнішнього майданчика.',
  },
]

const pricingPlans = computed(() => [
  {
    name: 'Start',
    price: '0 грн',
    helper: '',
    features: [
      'Публічний профіль',
      'Запити без реєстрації',
      'Сесії та календар',
      'Приватні нотатки й матеріали',
      'Без комісій з консультацій',
      'До 3 постійних клієнтів',
    ],
    ctaLabel: 'Почати безкоштовно',
    ctaTo: '/signup',
    ghostCta: false,
  },
  {
    name: 'Pro',
    price: billingCycle.value === 'monthly' ? '990 грн/міс' : '9 900 грн/рік',
    helper: billingCycle.value === 'yearly' ? 'Оплата за рік' : 'Оплата щомісяця',
    features: [
      'Усе зі Start',
      'До 20 постійних клієнтів',
      'Авторський блог у профілі',
      'Розширена аналітика',
      'Більше сесій без реєстрації',
    ],
    ctaLabel: 'Спробувати 30 днів',
    ctaTo: '/signup',
    ghostCta: false,
  },
  {
    name: 'Leader',
    price: billingCycle.value === 'monthly' ? '2 490 грн/міс' : '24 900 грн/рік',
    helper: billingCycle.value === 'yearly' ? 'Оплата за рік' : 'Оплата щомісяця',
    features: [
      'Усе з Pro',
      'До 60 постійних клієнтів',
      'Розширена підтримка',
      'Індивідуальне налаштування',
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

onMounted(() => {
  const targets = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))
  if (!targets.length) return

  const hasHashOnLoad = typeof window !== 'undefined' && Boolean(window.location.hash)
  if (hasHashOnLoad || typeof IntersectionObserver === 'undefined') {
    targets.forEach((el) => el.classList.add('is-visible'))
    return
  }

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
})

onBeforeUnmount(() => {
  revealObserver?.disconnect()
  revealObserver = null
})
</script>

<style scoped>
.home-lite {
  position: relative;
  isolation: isolate;
  padding: 28px 0 68px;
}

.home-lite::before {
  content: '';
  position: absolute;
  inset: -160px 0 0;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(1200px 540px at 16% 8%, rgba(17, 89, 69, 0.11), transparent 72%),
    radial-gradient(960px 420px at 88% 14%, rgba(219, 120, 39, 0.09), transparent 74%),
    linear-gradient(180deg, rgba(245, 247, 242, 0.86) 0%, rgba(247, 248, 251, 0.96) 100%);
}

.home-lite__container {
  width: min(var(--pc-container-wide), calc(100% - 48px));
  margin: 0 auto;
  display: grid;
  gap: 46px;
}

.home-hero {
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-2xl);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), var(--pc-bg-main));
  box-shadow: var(--pc-shadow-card);
  padding: clamp(24px, 3.6vw, 48px);
  display: grid;
  grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);
  gap: clamp(22px, 3vw, 38px);
  align-items: center;
  overflow: hidden;
}

.home-hero__content {
  display: grid;
  gap: 14px;
}

.home-hero__eyebrow,
.section-head__eyebrow {
  margin: 0;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--pc-text-muted);
  font-weight: 700;
}

.home-hero__title {
  margin: 0;
  font-size: clamp(36px, 4.2vw, 62px);
  line-height: 1.08;
  letter-spacing: -0.025em;
  color: var(--pc-navy-950);
  max-width: 16ch;
}

.home-hero__subtitle {
  margin: 0;
  max-width: 58ch;
  line-height: 1.58;
  color: var(--muted);
}

.home-hero__support {
  margin: 0;
  max-width: 52ch;
  line-height: 1.45;
  color: color-mix(in srgb, var(--pc-navy-900) 82%, #38515f);
  font-weight: 650;
}

.home-hero__actions,
.final-cta__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.home-hero__actions .btn,
.final-cta .btn,
.plan-card .btn {
  min-height: 44px;
  padding: 0 18px;
  border-radius: var(--radius-sm);
  font-weight: 700;
}

.home-hero__actions .btn,
.final-cta .btn,
.plan-card .btn:not(.btn--ghost) {
  background: var(--pc-navy-900);
  border-color: var(--pc-navy-900);
  color: #fff;
  box-shadow: 0 12px 26px rgba(18, 52, 90, 0.16);
}

.home-hero__actions .btn--ghost,
.final-cta .btn--ghost,
.plan-card .btn--ghost {
  background: rgba(255, 255, 255, 0.82);
  border-color: var(--pc-border-strong);
  color: var(--pc-navy-900);
  box-shadow: none;
}

.hero-trust {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hero-trust li {
  font-size: 13px;
  color: var(--pc-navy-900);
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-pill);
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.78);
}

.home-hero__visual {
  min-width: 0;
  min-height: 420px;
  position: relative;
}

.product-story {
  position: relative;
  z-index: 2;
  display: grid;
  width: min(100%, 690px);
  min-height: 520px;
  margin-left: auto;
  background:
    radial-gradient(420px 240px at 94% 18%, rgba(143, 203, 200, 0.34), transparent 70%),
    radial-gradient(360px 230px at 6% 92%, rgba(247, 183, 126, 0.26), transparent 72%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0));
}

.product-story__accent {
  position: absolute;
  z-index: 0;
  pointer-events: none;
  border-radius: 999px;
}

.product-story__accent--peach {
  width: 156px;
  height: 156px;
  top: 14px;
  right: -28px;
  background: radial-gradient(circle, rgba(247, 183, 126, 0.42), rgba(247, 183, 126, 0.06) 70%);
}

.product-story__accent--teal {
  width: 118px;
  height: 118px;
  right: -18px;
  bottom: 122px;
  background: radial-gradient(circle, rgba(143, 203, 200, 0.38), rgba(143, 203, 200, 0.06) 72%);
}

.product-story__dashboard-card,
.product-story__public-card,
.product-story__request-card,
.product-story__calendar-card {
  border: 1px solid color-mix(in srgb, var(--pc-border) 86%, #fff);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 26px 70px rgba(18, 35, 58, 0.16);
}

.product-story__dashboard-card {
  position: absolute;
  z-index: 1;
  top: 0;
  right: 0;
  display: grid;
  gap: 16px;
  width: min(92%, 560px);
  min-height: 360px;
  border-radius: 22px;
  padding: 18px 18px 18px 72px;
  background:
    radial-gradient(380px 190px at 84% 20%, rgba(170, 183, 228, 0.24), transparent 70%),
    radial-gradient(340px 180px at 22% 0%, rgba(143, 203, 200, 0.18), transparent 68%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(245, 247, 242, 0.9));
  backdrop-filter: blur(8px);
}

.product-story__dashboard-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  color: var(--pc-navy-950);
}

.product-story__dashboard-mark {
  width: 34px;
  height: 34px;
  display: grid;
  grid-template-columns: repeat(2, 5px);
  gap: 4px;
  place-items: center;
  border-radius: var(--radius-sm);
  background: rgba(143, 203, 200, 0.18);
  color: var(--pc-navy-900);
}

.product-story__dashboard-mark i {
  width: 5px;
  height: 5px;
  border-radius: 2px;
  background: var(--pc-navy-900);
}

.product-story__top-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.product-story__top-actions > i {
  width: 16px;
  height: 16px;
  border: 2px solid color-mix(in srgb, var(--pc-navy-900) 70%, #fff);
  border-radius: 999px;
}

.product-story__top-actions > i:nth-child(2) {
  position: relative;
  border-radius: 4px 4px 7px 7px;
}

.product-story__top-actions > i:nth-child(2)::after {
  content: '';
  position: absolute;
  top: -7px;
  right: -7px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 0 2px #fff;
}

.product-story__dashboard-dot {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 34%, #fff 0 13%, transparent 14%),
    linear-gradient(145deg, #f2b37b, #8fcbc8);
  box-shadow: 0 10px 22px rgba(18, 35, 58, 0.12);
}

.product-story__dashboard-shell {
  display: grid;
  grid-template-columns: 1fr minmax(170px, 0.76fr);
  gap: 14px;
}

.product-story__rail {
  position: absolute;
  left: 18px;
  top: 74px;
  bottom: 20px;
  display: grid;
  align-content: start;
  gap: 14px;
  width: 38px;
  border-radius: 16px;
  padding: 10px 7px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: inset 0 0 0 1px rgba(18, 52, 90, 0.06);
}

.product-story__rail span {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background:
    linear-gradient(90deg, transparent 45%, color-mix(in srgb, var(--pc-navy-900) 60%, #fff) 45% 55%, transparent 55%),
    linear-gradient(0deg, transparent 45%, color-mix(in srgb, var(--pc-navy-900) 60%, #fff) 45% 55%, transparent 55%);
  opacity: 0.42;
}

.product-story__rail span.is-active {
  background:
    linear-gradient(90deg, transparent 45%, #2255ff 45% 55%, transparent 55%),
    linear-gradient(0deg, transparent 45%, #2255ff 45% 55%, transparent 55%),
    color-mix(in srgb, var(--pc-teal-100) 76%, #fff);
  opacity: 1;
}

.product-story__dashboard-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.product-story__stat,
.product-story__schedule {
  display: grid;
  gap: 4px;
  border-radius: var(--radius-lg);
  padding: 14px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(18, 52, 90, 0.06);
}

.product-story__stat--teal {
  background: linear-gradient(145deg, color-mix(in srgb, var(--pc-teal-100) 78%, #fff), rgba(255, 255, 255, 0.92));
}

.product-story__stat--peach {
  background: linear-gradient(145deg, color-mix(in srgb, var(--pc-peach-100) 78%, #fff), rgba(255, 255, 255, 0.92));
}

.product-story__stat span,
.product-story__schedule span,
.product-story__requests span {
  color: var(--pc-text-muted);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.product-story__stat strong,
.product-story__schedule strong {
  color: var(--pc-navy-950);
  font-size: 28px;
  line-height: 1;
}

.product-story__schedule {
  grid-column: 1 / -1;
  grid-template-columns: 1fr auto;
  align-items: center;
}

.product-story__requests {
  display: grid;
  gap: 9px;
  border-radius: var(--radius-lg);
  padding: 12px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(18, 52, 90, 0.06);
}

.product-story__requests p {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: center;
  margin: 0;
  border-radius: 12px;
  padding: 9px 10px;
  background: color-mix(in srgb, #eef3ff 72%, #fff);
  color: var(--pc-navy-900);
  font-size: 13px;
}

.product-story__requests p strong {
  font-weight: 700;
}

.product-story__requests p em {
  color: var(--pc-text-muted);
  font-size: 11px;
  font-style: normal;
}

.product-story__public-card {
  position: absolute;
  z-index: 3;
  left: 0;
  bottom: 40px;
  display: grid;
  gap: 16px;
  width: min(68%, 430px);
  border-radius: 24px;
  padding: clamp(16px, 2.2vw, 24px);
  background:
    radial-gradient(420px 220px at 90% 0%, rgba(143, 203, 200, 0.2), transparent 70%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(250, 247, 242, 0.9));
  box-shadow: 0 34px 90px rgba(18, 35, 58, 0.22);
}

.product-story__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.product-story__header span {
  display: inline-flex;
  width: max-content;
  border-radius: var(--radius-pill);
  padding: 7px 10px;
  background: color-mix(in srgb, var(--pc-teal-100) 72%, #fff);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--pc-navy-900) 82%, #008375);
  font-weight: 700;
}

.product-story__profile {
  display: grid;
  grid-template-columns: minmax(132px, 0.44fr) minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
}

.product-story__portrait-photo {
  display: block;
  width: clamp(132px, 13vw, 176px);
  aspect-ratio: 4 / 5;
  object-fit: cover;
  object-position: center 28%;
  flex: 0 0 auto;
  border-radius: 22px;
  background: #f7efe7;
  border: 1px solid rgba(13, 47, 83, 0.08);
  box-shadow:
    0 24px 54px rgba(18, 35, 58, 0.16),
    inset 0 0 0 1px rgba(255, 255, 255, 0.42);
}

.product-story__copy {
  min-width: 0;
  display: grid;
  align-content: center;
  gap: 6px;
}

.product-story__copy strong {
  color: var(--pc-navy-950);
  font-size: clamp(24px, 2.2vw, 34px);
  line-height: 1;
}

.product-story__copy span,
.product-story__copy p {
  margin: 0;
  color: color-mix(in srgb, var(--text) 76%, #445966);
  line-height: 1.45;
}

.product-story__copy span {
  font-weight: 700;
  color: var(--pc-navy-900);
}

.product-story__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.product-story__chips span {
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  border: 1px solid color-mix(in srgb, var(--pc-border) 84%, #fff);
  border-radius: var(--radius-pill);
  padding: 0 10px;
  background: rgba(255, 255, 255, 0.78);
  color: var(--pc-navy-900);
  font-size: 12px;
  font-weight: 700;
}

.product-story__profile-actions {
  display: grid;
  grid-template-columns: 1fr 42px;
  gap: 10px;
}

.product-story__profile-actions button {
  min-height: 42px;
  border: 1px solid var(--pc-navy-900);
  border-radius: var(--radius-sm);
  background: var(--pc-navy-900);
  color: #fff;
  font-weight: 800;
  box-shadow: 0 14px 26px rgba(18, 52, 90, 0.18);
}

.product-story__profile-actions span {
  border: 1px solid color-mix(in srgb, var(--pc-border) 82%, #fff);
  border-radius: var(--radius-sm);
  background:
    linear-gradient(90deg, transparent 42%, var(--pc-navy-900) 42% 58%, transparent 58%),
    linear-gradient(0deg, transparent 42%, var(--pc-navy-900) 42% 58%, transparent 58%),
    rgba(255, 255, 255, 0.78);
}

.product-story__request-card {
  position: absolute;
  z-index: 4;
  right: 132px;
  bottom: 92px;
  display: grid;
  gap: 8px;
  width: 210px;
  border-radius: 22px;
  padding: 16px;
  background:
    radial-gradient(180px 110px at 100% 0%, rgba(143, 203, 200, 0.24), transparent 70%),
    rgba(255, 255, 255, 0.96);
  box-shadow: 0 28px 62px rgba(18, 35, 58, 0.18);
}

.product-story__calendar-card {
  position: absolute;
  z-index: 4;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  border-radius: 22px;
  padding: 16px;
}

.product-story__request-icon,
.product-story__calendar-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: color-mix(in srgb, var(--pc-teal-100) 82%, #fff);
}

.product-story__request-icon::before,
.product-story__calendar-icon::before {
  content: '';
  width: 18px;
  height: 18px;
  border: 2px solid var(--pc-navy-900);
}

.product-story__request-icon::before {
  border-radius: 50% 50% 46% 46%;
  border-top-color: transparent;
}

.product-story__calendar-icon {
  background: color-mix(in srgb, #ede8ff 80%, #fff);
}

.product-story__calendar-icon::before {
  border-radius: 5px;
}

.product-story__request-label,
.product-story__calendar-label {
  color: var(--pc-text-muted);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.product-story__request-card strong,
.product-story__calendar-card strong {
  color: var(--pc-navy-950);
  line-height: 1.25;
}

.product-story__calendar-card strong {
  grid-column: 1;
  font-size: 34px;
  letter-spacing: -0.04em;
}

.product-story__calendar-card p {
  grid-column: 1;
  margin: 0;
  color: var(--pc-navy-900);
  font-weight: 700;
  line-height: 1.35;
}

.product-story__request-card p {
  margin: 0;
  color: color-mix(in srgb, var(--text) 74%, #445966);
  line-height: 1.45;
  font-size: 13px;
}

.product-story__request-card button {
  min-height: 34px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--pc-teal-100) 82%, #fff);
  color: var(--pc-navy-900);
  font-weight: 700;
}

.product-story__calendar-card {
  right: 0;
  bottom: 4px;
  width: 250px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(245, 247, 242, 0.9));
  box-shadow: 0 28px 62px rgba(83, 71, 140, 0.16);
}

.product-story__time-rail {
  grid-column: 2;
  grid-row: 1 / span 4;
  display: grid;
  gap: 8px;
  align-content: center;
  padding-left: 12px;
  border-left: 1px solid color-mix(in srgb, var(--pc-border) 74%, #fff);
}

.product-story__time-rail span {
  color: var(--pc-text-muted);
  font-size: 12px;
}

.product-story__time-rail .is-current {
  color: var(--pc-navy-900);
  font-weight: 800;
}

.hero-blob {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
}

.hero-blob--teal {
  width: 180px;
  height: 180px;
  top: -12px;
  right: 4%;
  background: radial-gradient(circle at 30% 30%, rgba(143, 203, 200, 0.6), rgba(143, 203, 200, 0.14));
}

.hero-blob--peach {
  width: 210px;
  height: 210px;
  left: 8%;
  bottom: 2%;
  background: radial-gradient(circle at 32% 32%, rgba(247, 183, 126, 0.48), rgba(247, 183, 126, 0.12));
}

.hero-dot-grid {
  position: absolute;
  right: 18%;
  bottom: 4%;
  width: 120px;
  height: 94px;
  background-image: radial-gradient(rgba(18, 52, 90, 0.26) 1.1px, transparent 1.1px);
  background-size: 12px 12px;
  opacity: 0.3;
}

.preview-card {
  position: absolute;
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 20px 44px rgba(18, 35, 58, 0.12);
  overflow: hidden;
}

.preview-card header {
  border-bottom: 1px solid var(--pc-border);
  padding: 10px 12px;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--pc-text-muted);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(250, 247, 242, 0.8));
}

.preview-card img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-card--dashboard {
  inset: 0 10% 26% 0;
  z-index: 3;
}

.preview-card--profile {
  width: 36%;
  top: 7%;
  right: 0;
  z-index: 4;
}

.preview-card--booking {
  width: 40%;
  right: 2%;
  bottom: 4%;
  z-index: 5;
}

.preview-card--payments {
  width: 39%;
  left: 9%;
  bottom: -2%;
  z-index: 4;
}

.how__row,
.value-grid,
.differentiation__grid,
.pricing__grid,
.testimonials__grid {
  display: grid;
  gap: 14px;
}

.how-step,
.value-card,
.difference-card,
.plan-card,
.testimonial-card {
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--pc-shadow-soft);
}

.icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(143, 203, 200, 0.18);
  color: var(--pc-navy-900);
  border: 1px solid rgba(18, 52, 90, 0.14);
  flex: 0 0 auto;
}

.icon-wrap--soft {
  background: linear-gradient(145deg, rgba(143, 203, 200, 0.2), rgba(247, 183, 126, 0.16));
}

.icon-wrap svg {
  width: 20px;
  height: 20px;
}

.icon-wrap path {
  stroke: currentcolor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.benefit-chip__label,
.how-step h3,
.value-card h3,
.difference-card h3,
.plan-card h3,
.section-head__title,
.final-cta__title {
  margin: 0;
  color: var(--pc-navy-950);
}

.benefit-chip__label,
.how-step h3,
.value-card h3,
.difference-card h3,
.plan-card h3 {
  font-size: 16px;
  line-height: 1.2;
}

.how-step p,
.value-card p,
.difference-card p,
.testimonial-card p,
.profile-promo__copy p,
.final-cta p {
  margin: 0;
  line-height: 1.55;
  color: color-mix(in srgb, var(--text) 78%, #445966);
}

.section-head {
  display: grid;
  gap: 8px;
}

.section-head--center {
  text-align: center;
}

.section-head__title {
  font-size: clamp(30px, 2.8vw, 42px);
  line-height: 1.14;
  letter-spacing: -0.028em;
}

.section-head__subtitle {
  margin: 0;
  max-width: 66ch;
  color: color-mix(in srgb, var(--text) 80%, #465f6b);
  line-height: 1.5;
}

.section-head--center .section-head__subtitle {
  margin-inline: auto;
}

.how,
.value-section,
.differentiation,
.inside-section,
.pricing,
.testimonials,
.final-cta,
.profile-promo {
  display: grid;
  gap: 22px;
}

.how {
  gap: 14px;
}

.value-grid,
.differentiation__grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.value-card,
.difference-card {
  display: grid;
  align-content: start;
  gap: 12px;
  min-height: 100%;
  padding: 18px;
}

.difference-card {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.94), rgba(245, 247, 242, 0.78));
}

.how__row {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 4px;
  align-items: start;
}

.how-step {
  padding: 4px 2px;
  display: grid;
  gap: 7px;
  text-align: center;
  place-items: center;
  position: relative;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.how-step .icon-wrap {
  width: 80px;
  height: 80px;
  background: #fff;
  border-color: color-mix(in srgb, var(--pc-navy-900) 20%, #dfe8ef);
}

.how-step .icon-wrap svg {
  width: 32px;
  height: 32px;
}

.how-step__connector {
  position: absolute;
  top: 31px;
  right: -12px;
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
  color: color-mix(in srgb, var(--pc-navy-900) 56%, #99adba);
}

.how-step:last-child .how-step__connector {
  display: none;
}

.how__title {
  font-size: clamp(24px, 2vw, 30px);
  letter-spacing: -0.02em;
}

.how__intro {
  margin: 0 auto;
  max-width: 66ch;
  text-align: center;
  color: color-mix(in srgb, var(--text) 80%, #465f6b);
  line-height: 1.5;
}

.benefit-chips {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}

.benefit-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 6px 12px;
  border: 1px solid color-mix(in srgb, var(--pc-border) 85%, #fff);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
}

.benefit-chip__icon {
  width: 24px;
  height: 24px;
}

.benefit-chip__icon svg {
  width: 14px;
  height: 14px;
}

.benefit-chip__label {
  font-size: 13px;
  line-height: 1.3;
  white-space: nowrap;
}

.how-step h3 {
  max-width: 20ch;
  font-size: 15px;
  line-height: 1.25;
}

.how-step p {
  max-width: 22ch;
  font-size: 13px;
  line-height: 1.45;
}

.profile-promo {
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  align-items: center;
  gap: clamp(16px, 2.6vw, 28px);
  padding: clamp(10px, 1.8vw, 16px) 0;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.profile-promo__copy {
  display: grid;
  gap: 10px;
}

.profile-promo__copy p {
  max-width: 56ch;
}

.profile-promo__points {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 220px));
  gap: 10px;
}

.profile-point {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 6px 10px;
  border: 1px solid color-mix(in srgb, var(--pc-border) 84%, #fff);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.74);
}

.profile-point__icon {
  width: 24px;
  height: 24px;
}

.profile-point__icon svg {
  width: 14px;
  height: 14px;
}

.profile-point__text {
  font-size: 13px;
  line-height: 1.3;
  color: var(--pc-navy-950);
}

.profile-promo__preview {
  position: relative;
  min-width: 0;
  min-height: 340px;
}

.booking-preview {
  border: 1px solid color-mix(in srgb, var(--pc-border) 88%, #fff);
  border-radius: var(--radius-xl);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.94), rgba(245, 247, 242, 0.9));
  box-shadow: var(--pc-shadow-soft);
  overflow: hidden;
}

.booking-preview__header {
  border-bottom: 1px solid var(--pc-border);
  padding: 10px 12px;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--pc-text-muted);
  background: rgba(255, 255, 255, 0.88);
}

.booking-preview__body {
  padding: 12px;
  display: grid;
  gap: 10px;
}

.booking-preview--profile {
  width: min(100%, 480px);
}

.booking-preview--calendar {
  position: absolute;
  right: 0;
  bottom: -18px;
  width: min(86%, 370px);
}

.profile-mini {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 10px;
  align-items: center;
}

.profile-mini__avatar {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-weight: 700;
  color: #1d7f84;
  background: linear-gradient(145deg, rgba(143, 203, 200, 0.25), rgba(170, 183, 228, 0.25));
  border: 1px solid rgba(18, 52, 90, 0.12);
}

.profile-mini__name,
.profile-mini__role,
.profile-mini__snippet {
  margin: 0;
}

.profile-mini__name {
  font-size: 15px;
  line-height: 1.25;
  color: var(--pc-navy-950);
  font-weight: 700;
}

.profile-mini__role {
  font-size: 12px;
  line-height: 1.4;
  color: var(--pc-text-muted);
}

.profile-mini__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.profile-mini__chips span {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--pc-border) 82%, #fff);
  background: rgba(255, 255, 255, 0.82);
  font-size: 11px;
  color: var(--pc-navy-900);
}

.profile-mini__snippet {
  font-size: 12px;
  line-height: 1.45;
  color: color-mix(in srgb, var(--text) 80%, #445966);
}

.profile-mini__cta {
  min-height: 34px;
  width: 100%;
  border-radius: var(--radius-sm);
  border: 1px solid var(--pc-navy-900);
  background: var(--pc-navy-900);
  color: #fff;
  font-weight: 600;
}

.calendar-mini__top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  color: var(--pc-navy-900);
  font-weight: 600;
}

.calendar-mini__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
  font-size: 11px;
  color: var(--pc-text-muted);
}

.calendar-mini__grid span {
  min-height: 22px;
  display: grid;
  place-items: center;
}

.calendar-mini__grid .is-selected {
  color: #fff;
  background: var(--pc-navy-900);
  border-radius: 999px;
  font-weight: 700;
}

.calendar-mini__slots {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.calendar-mini__slots button {
  min-height: 30px;
  border: 1px solid color-mix(in srgb, var(--pc-border) 80%, #fff);
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.86);
  color: var(--pc-navy-900);
  font-size: 12px;
  font-weight: 600;
}

.session-mini__item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  align-items: center;
  min-height: 36px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--pc-teal-100) 72%, #fff);
  color: var(--pc-navy-900);
}

.session-mini__item strong {
  font-size: 13px;
}

.session-mini__item span {
  font-size: 12px;
  line-height: 1.35;
}

.pricing-toggle {
  justify-self: start;
  display: inline-flex;
  gap: 6px;
  padding: 4px;
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.86);
}

.pricing-toggle__btn {
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--pc-text-muted);
  cursor: pointer;
}

.pricing-toggle__btn.is-active {
  border-color: var(--pc-teal-500);
  background: var(--pc-teal-100);
  color: var(--pc-navy-900);
  font-weight: 700;
}

.pricing__grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.plan-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px;
  min-height: 100%;
}

.plan-card ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 6px;
  color: color-mix(in srgb, var(--text) 76%, #415763);
}

.plan-card li {
  position: relative;
  padding-left: 20px;
}

.plan-card li::before {
  content: '✓';
  position: absolute;
  left: 0;
  top: 0;
  color: #2c7f7b;
  font-weight: 700;
}

.plan-card__price {
  margin: 0;
  font-size: 32px;
  line-height: 1.08;
  font-weight: 800;
  color: var(--pc-navy-950);
}

.plan-card__helper {
  margin: 0;
  font-size: 12px;
  color: var(--pc-text-muted);
}

.plan-card__badge {
  margin: -18px -18px 4px;
  min-height: 30px;
  display: grid;
  place-items: center;
  border-top-left-radius: var(--radius-lg);
  border-top-right-radius: var(--radius-lg);
  background: var(--pc-navy-900);
  color: #fff;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
}

.plan-card--pro {
  border-color: rgba(18, 52, 90, 0.32);
  background:
    radial-gradient(220px 120px at 90% 10%, rgba(143, 203, 200, 0.2), transparent 70%),
    #fff;
  box-shadow: 0 16px 34px rgba(15, 45, 80, 0.16);
}

.pricing-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr);
  gap: clamp(18px, 2.2vw, 28px);
  align-items: start;
}

.pricing-layout__left {
  display: grid;
  gap: 12px;
}

.pricing-head {
  gap: 6px;
}

.pricing-title {
  font-size: clamp(24px, 2vw, 30px);
  line-height: 1.2;
  letter-spacing: -0.02em;
  max-width: 22ch;
}

.pricing-layout__right {
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-xl);
  background: linear-gradient(140deg, rgba(255, 255, 255, 0.95), rgba(245, 247, 242, 0.88));
  box-shadow: var(--pc-shadow-soft);
  padding: 14px;
  display: grid;
  gap: 10px;
}

.pricing-promo__title {
  margin: 0;
  color: var(--pc-navy-950);
  font-size: clamp(24px, 2vw, 30px);
  line-height: 1.2;
}

.pricing-promo__copy {
  margin: 0;
  color: color-mix(in srgb, var(--text) 80%, #445966);
  line-height: 1.5;
}

.pricing-promo__preview {
  position: relative;
  min-height: 300px;
}

.pricing-booking-preview--profile {
  width: min(100%, 420px);
}

.pricing-booking-preview--calendar {
  width: min(85%, 320px);
  right: -2px;
  bottom: -8px;
}

.testimonials__grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.testimonial-card {
  display: grid;
  gap: 12px;
  padding: 20px;
}

.testimonial-card__quote {
  font-size: 18px;
  line-height: 1.5;
}

.testimonial-card__author {
  font-size: 14px;
  color: var(--pc-text-muted);
}

.final-cta {
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-2xl);
  padding: clamp(24px, 3.2vw, 40px);
  background:
    radial-gradient(440px 220px at 86% 16%, rgba(143, 203, 200, 0.2), transparent 72%),
    radial-gradient(460px 250px at 12% 90%, rgba(247, 183, 126, 0.18), transparent 72%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), var(--pc-bg-main));
  box-shadow: var(--pc-shadow-card);
}

.final-cta__title {
  font-size: clamp(30px, 3vw, 44px);
  line-height: 1.1;
  letter-spacing: -0.03em;
  max-width: 18ch;
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
  .how__row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .value-grid,
  .differentiation__grid,
  .pricing__grid,
  .testimonials__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .pricing-layout {
    grid-template-columns: 1fr;
  }

  .pricing-layout__right {
    order: 2;
  }

  .pricing-layout__left {
    order: 1;
  }

  .pricing-promo__preview {
    min-height: auto;
    display: grid;
    gap: 10px;
  }

  .pricing-booking-preview--profile,
  .pricing-booking-preview--calendar {
    position: relative;
    width: 100%;
    right: auto;
    bottom: auto;
    margin: 0;
  }

  .profile-promo {
    grid-template-columns: 1fr;
    padding: 6px 0 2px;
  }

  .profile-promo__points {
    grid-template-columns: 1fr;
  }

  .profile-promo__preview {
    min-height: auto;
  }

  .booking-preview--calendar {
    position: relative;
    right: auto;
    bottom: auto;
    width: min(100%, 370px);
    margin-top: 10px;
    margin-left: auto;
  }

  .how-step .icon-wrap {
    width: 74px;
    height: 74px;
  }

  .how-step__connector {
    display: none;
  }
}

@media (max-width: 1024px) {
  .product-story__portrait-photo {
    width: clamp(120px, 18vw, 150px);
    border-radius: 20px;
  }
}

@media (max-width: 820px) {
  .benefit-chip__label {
    white-space: normal;
  }
}

@media (max-width: 920px) {
  .home-hero {
    grid-template-columns: 1fr;
  }

  .home-hero__visual {
    min-height: auto;
  }

  .product-story {
    margin: 0;
    width: 100%;
    min-height: 430px;
  }

  .product-story__dashboard-card {
    width: min(100%, 560px);
  }

  .product-story__public-card {
    width: min(78%, 430px);
  }
}

@media (max-width: 720px) {
  .product-story__portrait-photo {
    width: min(42vw, 150px);
    border-radius: 18px;
  }
}

@media (max-width: 680px) {
  .home-lite {
    padding: 14px 0 48px;
  }

  .home-lite__container {
    width: min(100% - 24px, var(--pc-container-wide));
    gap: 30px;
  }

  .home-hero {
    padding: 20px 16px;
  }

  .home-hero__title {
    font-size: clamp(33px, 11vw, 42px);
  }

  .home-hero__actions,
  .final-cta__actions {
    width: 100%;
  }

  .home-hero__actions .btn,
  .final-cta .btn {
    width: 100%;
  }

  .home-hero__visual {
    min-height: auto;
    display: grid;
    gap: 10px;
  }

  .product-story {
    display: grid;
    gap: 12px;
    min-height: auto;
  }

  .product-story__dashboard-card,
  .product-story__request-card,
  .product-story__calendar-card {
    position: relative;
    inset: auto;
    width: 100%;
  }

  .product-story__dashboard-card {
    min-height: auto;
    order: 2;
  }

  .product-story__dashboard-body {
    grid-template-columns: 1fr;
  }

  .product-story__schedule {
    grid-column: auto;
  }

  .product-story__requests {
    width: 100%;
  }

  .product-story__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .product-story__public-card {
    position: relative;
    inset: auto;
    order: 1;
    width: 100%;
    padding: 14px;
  }

  .product-story__profile {
    grid-template-columns: 1fr;
  }

  .product-story__avatar {
    max-height: 220px;
    width: min(100%, 180px);
  }

  .product-story__request-card {
    order: 3;
  }

  .product-story__calendar-card {
    order: 4;
  }

  .value-grid,
  .differentiation__grid,
  .pricing__grid,
  .testimonials__grid,
  .how__row {
    grid-template-columns: 1fr;
  }

  .pricing-layout__right {
    padding: 12px;
  }

  .how-step {
    border: 1px solid var(--pc-border);
    border-radius: var(--radius-xl);
    background: rgba(255, 255, 255, 0.92);
    box-shadow: var(--pc-shadow-soft);
    padding: 14px 10px;
  }

  .how-step__connector {
    display: none;
  }

  .benefit-chips {
    justify-content: flex-start;
  }

  .profile-promo__preview {
    display: grid;
    gap: 10px;
  }

  .booking-preview--profile,
  .booking-preview--calendar {
    width: 100%;
    position: relative;
    margin: 0;
  }
}

</style>
