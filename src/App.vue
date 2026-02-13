<template>
  <div class="shell">
    <header class="topbar">
      <RouterLink class="brand" to="/">
        <div class="brand__mark">Pro Consult</div>
        <div class="brand__tagline">Therapist Workspace</div>
      </RouterLink>
      <nav class="nav">
        <RouterLink v-if="isTherapist" to="/public">Публічний профіль</RouterLink>
        <RouterLink v-if="isAuthenticated" :to="cabinetRoute">Кабінет</RouterLink>
        <RouterLink v-if="!isAuthenticated" to="/login">Вхід</RouterLink>
        <RouterLink v-if="!isAuthenticated" to="/signup">Реєстрація</RouterLink>
        <button v-if="isAuthenticated" class="btn btn--ghost" type="button" @click="onLogout">
          Вийти
        </button>
      </nav>
    </header>

    <main class="main">
      <RouterView />
    </main>

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

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const isAuthenticated = computed(() => Boolean(auth.accessToken))
const roles = computed(() => auth.me?.user.roles ?? [])
const isTherapist = computed(() => roles.value.includes('THERAPIST'))
const isClient = computed(() => roles.value.includes('CLIENT'))
const cabinetRoute = computed(() => {
  if (isTherapist.value) return '/cabinet'
  if (isClient.value) return '/client'
  return '/login'
})

function onLogout() {
  auth.logout()
  if (route.path.startsWith('/cabinet') || route.path.startsWith('/client')) {
    router.push('/login')
  }
}
</script>

<style scoped>
.shell {
  max-width: 1180px;
  margin: 0 auto;
  padding: 24px 24px 48px;
  display: grid;
  gap: 24px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  gap: 20px;
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(245, 247, 248, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(47, 63, 73, 0.1);
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
  color: var(--muted);
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
  color: var(--ink);
}

.nav a.router-link-active {
  border-color: rgba(110, 143, 153, 0.4);
  background: rgba(110, 143, 153, 0.16);
}

.main {
  min-height: 320px;
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
