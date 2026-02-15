<template>
  <div :class="['shell', { 'shell--home': isHome }]">
    <header v-if="!isHome" :class="topbarClass">
      <RouterLink class="brand" to="/">
        <div class="brand__mark">Pro Consult</div>
        <div class="brand__tagline">Therapist Workspace</div>
      </RouterLink>
      <nav class="nav">
        <RouterLink v-if="isTherapist" to="/public">Публічний профіль</RouterLink>
        <RouterLink v-if="!isTherapist" to="/public/therapists">Каталог</RouterLink>
        <RouterLink v-if="isAuthenticated" :to="cabinetRoute">Кабінет</RouterLink>
        <RouterLink v-if="!isAuthenticated" to="/login">Вхід</RouterLink>
        <RouterLink v-if="!isAuthenticated" to="/signup">Реєстрація</RouterLink>
        <button v-if="isAuthenticated" class="btn btn--ghost" type="button" @click="onLogout">
          Вийти
        </button>
      </nav>
    </header>

    <main :class="['main', { 'main--home': isHome }]">
      <RouterView />
    </main>
    <ToastHost />

    <footer class="footer">
      <div>Pro Consult · Professional therapist workspace</div>
      <div class="footer__meta">Без комісій. Без посередників. З повагою до практики.</div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import ToastHost from './components/ToastHost.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const isAuthenticated = computed(() => Boolean(auth.accessToken))
const isHome = computed(() => route.path === '/')
const roles = computed(() => auth.me?.user.roles ?? [])
const isTherapist = computed(() => roles.value.includes('THERAPIST'))
const isClient = computed(() => roles.value.includes('CLIENT'))
const cabinetRoute = computed(() => {
  if (isTherapist.value) return '/cabinet'
  if (isClient.value) return '/client'
  return '/login'
})

const topbarClass = computed(() => [
  'topbar',
  {
    'topbar--therapist': isTherapist.value,
    'topbar--client': isClient.value,
  },
])

function onLogout() {
  auth.logout()
  if (route.path.startsWith('/cabinet') || route.path.startsWith('/client')) {
    router.push('/login')
  }
}

</script>

<style scoped>
.shell {
  max-width: none;
  margin: 0 auto;
  padding: 0 24px 48px;
  display: grid;
  gap: 24px;
}

.shell--home {
  max-width: none;
  padding: 0;
  display: block;
}

.shell--home .topbar {
  display: none;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  position: relative;
  z-index: 10;
  background: rgba(15, 27, 43, 0.32);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  color: #f1f6f9;
  width: 100%;
  padding: 12px 24px;
}

.topbar--therapist {
  background: linear-gradient(120deg, rgba(9, 36, 52, 0.82), rgba(19, 60, 82, 0.7));
  border-bottom-color: rgba(145, 190, 212, 0.28);
}

.topbar--client {
  background: linear-gradient(120deg, rgba(42, 24, 56, 0.82), rgba(86, 41, 85, 0.7));
  border-bottom-color: rgba(227, 176, 219, 0.28);
}

.topbar--overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.brand {
  display: grid;
  gap: 2px;
  color: inherit;
}

.brand__mark {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 22px;
  letter-spacing: 0.4px;
}

.brand__tagline {
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(241, 246, 249, 0.7);
}

.topbar--overlay .brand {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}

.topbar--overlay .nav {
  margin-left: auto;
}

.nav {
  display: flex;
  gap: 12px;
  font-weight: 500;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.nav a {
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid transparent;
  color: #f1f6f9;
}

.nav a.router-link-active {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.18);
}

.main {
  min-height: 320px;
  width: 80%;
  margin: 0 auto;
}

.main--home {
  min-height: 100vh;
  width: 100%;
  margin: 0;
}

.footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(47, 63, 73, 0.12);
  color: var(--muted);
  font-size: 12px;
  flex-wrap: wrap;
}
</style>
