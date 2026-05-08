<template>
  <section class="home-lite">
    <div class="home-lite__container">
      <section class="home-hero reveal" aria-labelledby="home-hero-title">
        <div class="home-hero__content">
          <p class="home-hero__eyebrow">Платформа для приватної практики</p>
          <h1 id="home-hero-title" class="home-hero__title">Приватна практика на ваших умовах — без комісій</h1>
          <p class="home-hero__subtitle">
            Публічний профіль, онлайн-запис, сесії, контроль оплат, облік клієнтів й робочі матеріали в одному просторі.
          </p>
          <div class="home-hero__actions">
            <button v-if="isAuthenticated" class="btn" type="button" @click="goToCabinet">Перейти в кабінет</button>
            <RouterLink v-else class="btn" to="/signup">Почати безкоштовно</RouterLink>
            <a class="btn btn--ghost" href="#features">Переглянути можливості</a>
          </div>
          <ul class="hero-trust" aria-label="Переваги платформи">
            <li v-for="marker in trustMarkers" :key="marker">{{ marker }}</li>
          </ul>
        </div>

        <div class="home-hero__visual" aria-hidden="true">
          <span class="hero-blob hero-blob--teal"></span>
          <span class="hero-blob hero-blob--peach"></span>
          <span class="hero-dot-grid"></span>

          <article class="preview-card preview-card--dashboard">
            <header>Робочий дашборд</header>
            <img src="/images/tour/booking-sessions-2.jpg" alt="" loading="eager" decoding="async" />
          </article>
          <article class="preview-card preview-card--profile">
            <header>Публічний профіль</header>
            <img src="/images/tour/public-profile-2.jpg" alt="" loading="lazy" decoding="async" />
          </article>
          <article class="preview-card preview-card--booking">
            <header>Онлайн-запис</header>
            <img src="/images/tour/slots-1.jpg" alt="" loading="lazy" decoding="async" />
          </article>
          <article class="preview-card preview-card--payments">
            <header>Оплати</header>
            <img src="/images/tour/payments-block-1.jpg" alt="" loading="lazy" decoding="async" />
          </article>
        </div>
      </section>

      <section id="features" class="how how--merged reveal" aria-labelledby="how-title">
        <div class="section-head section-head--center">
          <p class="section-head__eyebrow">Практика без хаосу</p>
          <h2 id="how-title" class="section-head__title how__title">Як Pro Consult допомагає вести практику</h2>
          <p class="how__intro">
            Від першого запису до матеріалів після сесії — усе зібрано в одному охайному просторі.
          </p>
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
        <div class="benefit-chips" role="list" aria-label="Ключові переваги">
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

      <section class="profile-promo reveal" aria-labelledby="profile-promo-title">
        <div class="profile-promo__copy">
          <p class="section-head__eyebrow">Профіль і запис</p>
          <h2 id="profile-promo-title" class="section-head__title">
            Клієнт одразу бачить, як з вами працювати
          </h2>
          <p>
            Покажіть послуги, умови й доступні години в зрозумілій структурі. Клієнт бачить ключове і записується без зайвого
            шуму.
          </p>
          <div class="profile-promo__points" role="list" aria-label="Переваги профілю і запису">
            <article v-for="item in profileHighlights" :key="item.title" class="profile-point" role="listitem">
              <span class="icon-wrap icon-wrap--soft profile-point__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path v-for="path in iconPaths[item.icon]" :key="path" :d="path"></path>
                </svg>
              </span>
              <span class="profile-point__text">{{ item.title }}</span>
            </article>
          </div>
        </div>
        <div class="profile-promo__preview" aria-hidden="true">
          <article class="booking-preview booking-preview--profile">
            <header class="booking-preview__header">Public profile</header>
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
              <p class="profile-mini__snippet">Формат, умови та доступні години видно одразу перед записом.</p>
              <button class="profile-mini__cta" type="button">Записатися</button>
            </div>
          </article>

          <article class="booking-preview booking-preview--calendar">
            <header class="booking-preview__header">Booking calendar</header>
            <div class="booking-preview__body">
              <div class="calendar-mini__top">
                <span>Травень 2026</span>
                <span>15 травня</span>
              </div>
              <div class="calendar-mini__grid" aria-label="Календар доступних дат">
                <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Нд</span>
                <span>12</span><span>13</span><span>14</span><span class="is-selected">15</span><span>16</span><span>17</span><span>18</span>
              </div>
              <div class="calendar-mini__slots">
                <button type="button">09:00</button>
                <button type="button">11:00</button>
                <button type="button">14:00</button>
                <button type="button">16:00</button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section id="pricing" class="pricing reveal" aria-labelledby="pricing-title">
        <div class="pricing-layout">
          <div class="pricing-layout__left">
            <div class="section-head pricing-head">
              <p class="section-head__eyebrow">Тарифи</p>
              <h2 id="pricing-title" class="section-head__title pricing-title">Прозорі рівні доступу без прихованих умов</h2>
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
                <p v-if="plan.name === 'Pro'" class="plan-card__badge">Найпопулярніший</p>
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

          <aside class="pricing-layout__right" aria-label="Переваги профілю і запису">
            <p class="section-head__eyebrow">Профіль і запис</p>
            <h3 class="pricing-promo__title">Розвивайте практику та довіру клієнтів</h3>
            <p class="pricing-promo__copy">
              Ваш публічний профіль допомагає клієнтам дізнатися про вас і зручно записатися на сесію.
            </p>

            <div class="pricing-promo__preview" aria-hidden="true">
              <article class="booking-preview booking-preview--profile pricing-booking-preview--profile">
                <header class="booking-preview__header">Public profile</header>
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
                  <button class="profile-mini__cta" type="button">Записатися</button>
                </div>
              </article>

              <article class="booking-preview booking-preview--calendar pricing-booking-preview--calendar">
                <header class="booking-preview__header">Booking calendar</header>
                <div class="booking-preview__body">
                  <div class="calendar-mini__top">
                    <span>Травень 2026</span>
                    <span>15 травня</span>
                  </div>
                  <div class="calendar-mini__grid" aria-label="Календар доступних дат">
                    <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Нд</span>
                    <span>12</span><span>13</span><span>14</span><span class="is-selected">15</span><span>16</span><span>17</span><span>18</span>
                  </div>
                  <div class="calendar-mini__slots">
                    <button type="button">09:00</button>
                    <button type="button">11:00</button>
                    <button type="button">14:00</button>
                    <button type="button">16:00</button>
                  </div>
                </div>
              </article>
            </div>
          </aside>
        </div>
      </section>

      <section class="testimonials reveal" aria-labelledby="testimonials-title">
        <div class="section-head section-head--center">
          <p class="section-head__eyebrow">Відгуки про платформу</p>
          <h2 id="testimonials-title" class="section-head__title">Що спеціалісти цінують у Pro Consult</h2>
        </div>
        <div class="testimonials__grid">
          <article v-for="item in testimonials" :key="item.quote" class="testimonial-card">
            <p class="testimonial-card__quote">«{{ item.quote }}»</p>
            <p class="testimonial-card__author">{{ item.author }}</p>
          </article>
        </div>
      </section>

      <section class="final-cta reveal">
        <h2 class="final-cta__title">Ведіть приватну практику в одному просторі</h2>
        <p>Сконцентруйтесь на роботі зі своїми клієнтами, а не на ручній операційці.</p>
        <div class="final-cta__actions">
          <RouterLink v-if="!isAuthenticated" class="btn" to="/signup">Почати безкоштовно</RouterLink>
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

const trustMarkers = ['Без комісій з оплат', 'Для індивідуальної практики', 'Онлайн і офлайн сесії']

const compactValueStrip: Array<{ icon: IconKey; title: string }> = [
  { icon: 'payments', title: 'Без комісій з оплат' },
  { icon: 'security', title: 'Захищені робочі дані' },
  { icon: 'materials', title: 'Матеріали й нотатки під рукою' },
  { icon: 'support', title: 'Підтримка, що допомагає' },
  { icon: 'session', title: 'Онлайн і офлайн сесії' },
]

const howSteps: Array<{ icon: IconKey; title: string; copy: string }> = [
  { icon: 'profile', title: 'Налаштуйте профіль', copy: 'Опишіть послуги, формат роботи й доступні години.' },
  { icon: 'booking', title: 'Клієнт записується онлайн', copy: 'Клієнт бачить вільні слоти й бронює без зайвого листування.' },
  { icon: 'session', title: 'Ви проводите сесію', copy: 'Усі деталі зустрічі, статуси й матеріали залишаються під рукою.' },
  { icon: 'payments', title: 'Отримайте оплату', copy: 'Фінансові кроки зрозумілі й не губляться в повідомленнях.' },
  { icon: 'analytics', title: 'Зростайте легко', copy: 'Аналітика, приватні відгуки й порядок допомагають розвивати практику.' },
]

const profileHighlights: Array<{ icon: IconKey; title: string }> = [
  { icon: 'profile', title: 'Послуги й умови в одному місці' },
  { icon: 'booking', title: 'Видимі вільні слоти для запису' },
  { icon: 'session', title: 'Спокійна точка входу для нового клієнта' },
]

const testimonials = [
  {
    quote: 'Раніше я вела запис і платежі в різних таблицях. Тепер усе в одному місці.',
    author: 'Психологиня, приватна практика',
  },
  {
    quote: 'Публічний профіль став зрозумілішим для клієнта, і менше уточнень перед записом.',
    author: 'Психотерапевт, онлайн та офлайн сесії',
  },
  {
    quote: 'Платформа прибрала зайву ручну роботу, і я повернула фокус на роботу з людьми.',
    author: 'Сімейний консультант',
  },
]

const pricingPlans = computed(() => [
  {
    name: 'Start',
    price: '0 грн',
    helper: '',
    features: ['Публічний профіль', 'Нотатки, робочий зошит і матеріали',  'Гнучкий функціонал запису та бронювання', 'Робота без комісії за сесії', 'До 3 постійних клієнтів'],
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
      'Свій блог у профілі',
      'Розширена аналітика',
      'Приватні відгуки клієнтів',
      'Більше гостьових сесій',
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
.pricing__grid,
.testimonials__grid {
  display: grid;
  gap: 14px;
}

.how-step,
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
.plan-card h3,
.section-head__title,
.final-cta__title {
  margin: 0;
  color: var(--pc-navy-950);
}

.benefit-chip__label,
.how-step h3,
.plan-card h3 {
  font-size: 16px;
  line-height: 1.2;
}

.how-step p,
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

.how,
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
    min-height: 320px;
  }

  .preview-card--dashboard {
    inset: 0 0 27% 0;
  }

  .preview-card--profile {
    width: 42%;
  }

  .preview-card--booking,
  .preview-card--payments {
    width: 44%;
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

  .hero-blob,
  .hero-dot-grid {
    display: none;
  }

  .preview-card {
    position: relative;
    inset: auto;
    width: 100%;
  }

  .preview-card img {
    aspect-ratio: 16 / 10;
  }

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
