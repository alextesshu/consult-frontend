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

@media (max-width: 980px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .catalog {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
