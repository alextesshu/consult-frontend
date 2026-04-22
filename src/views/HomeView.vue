<template>
  <section class="home-lite">
    <div class="home-lite__container">
      <section class="home-hero reveal">
        <p class="home-hero__eyebrow">PRO CONSULT</p>
        <h1 class="home-hero__title">Приватна практика в одному робочому просторі</h1>
        <p class="home-hero__subtitle">
          Для спеціалістів приватної практики: публічний профіль, онлайн-запис, сесії, нотатки й аналітика без комісії
          з кожної сесії.
        </p>
        <div class="home-hero__actions">
          <button v-if="isAuthenticated" class="btn" type="button" @click="goToCabinet">Перейти в кабінет</button>
          <RouterLink v-else class="btn" to="/signup">Спробувати безкоштовно</RouterLink>
          <RouterLink class="btn btn--ghost" to="/tour">Подивитися тур</RouterLink>
          <RouterLink class="btn btn--ghost" to="/pricing">Переглянути тарифи</RouterLink>
        </div>
        <p class="home-hero__microcopy">
          Нові спеціалісти отримують 30 днів Pro. Потім можна залишитися на безкоштовному Start або перейти на Pro чи
          Leader.
        </p>
      </section>

      <section class="value-grid reveal" aria-label="Ключові переваги">
        <article v-for="item in valueProps" :key="item.title" class="value-card">
          <h2 class="value-card__title">{{ item.title }}</h2>
          <p class="muted">{{ item.copy }}</p>
        </article>
      </section>

      <section id="features" class="feature-preview reveal">
        <div class="section-head">
          <p class="section-head__eyebrow">Що є в продукті</p>
          <h2 class="section-head__title">Ключові можливості для щоденної роботи</h2>
          <p class="muted">Короткий preview. Детальний сценарний розбір доступний на сторінці туру.</p>
        </div>
        <div class="feature-preview__grid">
          <article v-for="item in previewFeatures" :key="item.title" class="preview-card">
            <h3 class="preview-card__title">{{ item.title }}</h3>
            <p class="muted">{{ item.copy }}</p>
          </article>
        </div>
        <RouterLink class="feature-preview__cta" to="/tour">Перейти до повного туру по платформі</RouterLink>
      </section>

      <section id="pricing" class="pricing-teaser reveal">
        <div class="section-head section-head--center">
          <p class="section-head__eyebrow">Рівні доступу</p>
          <h2 class="section-head__title">Start, Pro, Leader</h2>
          <p class="muted">
            Start — безкоштовний. Усі нові спеціалісти отримують 30 днів Pro. Для спеціальних умов доступний окремий
            запит.
          </p>
        </div>
        <div class="pricing-teaser__grid">
          <article class="plan-card">
            <h3 class="plan-card__title">Start</h3>
            <p class="muted">Для старту приватної практики</p>
            <ul>
              <li>Публічний профіль</li>
              <li>Онлайн-запис</li>
              <li>Базова аналітика</li>
            </ul>
          </article>
          <article class="plan-card plan-card--pro">
            <h3 class="plan-card__title">Pro</h3>
            <p class="muted">Для стабільної щоденної практики</p>
            <ul>
              <li>Робочий зошит</li>
              <li>Оплати та підтвердження оплат</li>
              <li>Розширена аналітика</li>
            </ul>
          </article>
          <article class="plan-card">
            <h3 class="plan-card__title">Leader</h3>
            <p class="muted">Для великої та інтенсивної практики</p>
            <ul>
              <li>Максимальні ліміти</li>
              <li>Пріоритетний супровід</li>
              <li>Більше робочого навантаження</li>
            </ul>
          </article>
        </div>
        <div class="pricing-teaser__actions">
          <RouterLink class="btn" to="/pricing">Переглянути тарифи</RouterLink>
          <RouterLink class="btn btn--ghost" to="/support-and-data-requests">Потрібні інші умови?</RouterLink>
        </div>
      </section>

      <section id="faq" class="home-faq reveal">
        <div class="section-head">
          <h2 class="section-head__title">FAQ</h2>
          <p class="muted">Короткі відповіді перед стартом.</p>
        </div>
        <div class="home-faq__grid">
          <article class="faq-card">
            <h3 class="faq-card__title">Чи є комісія з кожної сесії?</h3>
            <p class="muted">Ні. PRO CONSULT не забирає відсоток із кожної сесії.</p>
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
        <h2 class="final-cta__title">Далі: подивіться, як продукт працює в реальних сценаріях</h2>
        <p class="muted">Tour показує продукт глибше: екрани, робочі кроки і логіку щоденної практики.</p>
        <div class="final-cta__actions">
          <RouterLink class="btn" to="/tour">Подивитися тур</RouterLink>
          <RouterLink v-if="!isAuthenticated" class="btn btn--ghost" to="/signup">Спробувати безкоштовно</RouterLink>
          <button v-else class="btn btn--ghost" type="button" @click="goToCabinet">Перейти в кабінет</button>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const isAuthenticated = computed(() => Boolean(auth.accessToken))
const roles = computed(() => auth.me?.user.roles ?? auth.user?.roles ?? [])

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

const previewFeatures = [
  {
    title: 'Публічний профіль і запис',
    copy: 'Окреме посилання для знайомства, довіри та запису без зайвих кроків.',
  },
  {
    title: 'Сесії, оплати й статуси',
    copy: 'Управління сесіями та підтвердженням оплат у єдиному робочому потоці.',
  },
  {
    title: 'Нотатки та робочий зошит',
    copy: 'Контекст клієнта і міжсесійна робота в структурованому форматі.',
  },
  {
    title: 'Базова і розширена аналітика',
    copy: 'Огляд практики та глибші патерни для планування навантаження.',
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
    { threshold: 0.16, rootMargin: '0px 0px -10% 0px' }
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
  padding: 88px 0 120px;
  position: relative;
  isolation: isolate;
}

.home-lite::before {
  content: '';
  position: absolute;
  inset: -200px 0;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(980px 520px at 12% 34%, rgba(6, 70, 98, 0.12), transparent 72%),
    radial-gradient(920px 480px at 86% 22%, rgba(219, 120, 39, 0.08), transparent 72%),
    linear-gradient(180deg, rgba(248, 249, 251, 0.74) 0%, rgba(247, 248, 251, 0.92) 32%, rgba(247, 248, 251, 0.9) 100%);
}

.home-lite__container {
  width: min(1160px, 92vw);
  margin: 0 auto;
  display: grid;
  gap: 58px;
}

.home-hero {
  border: 1px solid color-mix(in srgb, var(--primary) 24%, var(--border));
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.84), rgba(17, 64, 54, 0.06));
  padding: clamp(22px, 3vw, 38px);
  display: grid;
  gap: 16px;
}

.home-hero__eyebrow,
.section-head__eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--text) 62%, #48606b);
}

.home-hero__title {
  margin: 0;
  font-size: clamp(34px, 4vw, 56px);
  line-height: 1.1;
  letter-spacing: -0.02em;
  max-width: 16ch;
}

.home-hero__subtitle {
  margin: 0;
  color: var(--muted);
  line-height: 1.65;
  max-width: 66ch;
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
  gap: 10px;
  flex-wrap: wrap;
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
  font-size: clamp(28px, 3vw, 40px);
  line-height: 1.2;
}

.value-grid,
.feature-preview__grid,
.home-faq__grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.value-card,
.preview-card,
.faq-card,
.plan-card {
  border: 1px solid color-mix(in srgb, var(--primary) 20%, var(--border));
  border-radius: var(--radius-md);
  background: color-mix(in srgb, #ffffff 82%, var(--surface));
  padding: 18px;
}

.value-card__title,
.preview-card__title,
.faq-card__title,
.plan-card__title {
  margin: 0 0 8px;
  font-size: 18px;
  line-height: 1.3;
}

.feature-preview,
.pricing-teaser,
.home-faq,
.final-cta {
  display: grid;
  gap: 22px;
}

.feature-preview__cta {
  justify-self: start;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
  color: color-mix(in srgb, var(--text) 82%, #234b59);
}

.pricing-teaser__grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.plan-card ul {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 6px;
  color: color-mix(in srgb, var(--text) 72%, #4f616a);
}

.plan-card--pro {
  background: linear-gradient(180deg, rgba(17, 64, 54, 0.1), rgba(255, 255, 255, 0.9));
}

.final-cta {
  border: 1px solid color-mix(in srgb, var(--primary) 24%, var(--border));
  border-radius: var(--radius-lg);
  padding: clamp(20px, 3vw, 30px);
  background: linear-gradient(140deg, rgba(255, 255, 255, 0.86), rgba(219, 120, 39, 0.08));
}

.final-cta__title {
  margin: 0;
  font-size: clamp(28px, 3vw, 42px);
  line-height: 1.18;
  max-width: 19ch;
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
  .value-grid,
  .feature-preview__grid,
  .home-faq__grid,
  .pricing-teaser__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .home-lite {
    padding-top: 100px;
  }

  .home-lite__container {
    gap: 46px;
  }

  .value-grid,
  .feature-preview__grid,
  .home-faq__grid,
  .pricing-teaser__grid {
    grid-template-columns: 1fr;
  }
}
</style>
