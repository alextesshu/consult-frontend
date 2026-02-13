<template>
  <div class="shell">
    <header class="topbar">
      <div class="brand">
        <div class="brand__mark">Consult</div>
        <div class="brand__tagline">Therapist Workspace</div>
      </div>
      <nav class="nav">
        <RouterLink to="/">Головна</RouterLink>
        <RouterLink to="/public">Публічний профіль</RouterLink>
        <RouterLink v-if="isAuthenticated" to="/cabinet">Кабінет</RouterLink>
        <RouterLink v-if="!isAuthenticated" to="/login">Вхід</RouterLink>
        <RouterLink v-if="!isAuthenticated" to="/signup">Реєстрація</RouterLink>
        <button v-if="isAuthenticated" class="btn btn--ghost" type="button" @click="onLogout">
          Вийти
        </button>
      </nav>
    </header>

    <section v-if="showHero" class="hero">
      <div class="hero__card">
        <div class="badge">Професійний кабінет</div>
        <h1 class="title">Терапевтична практика без хаосу</h1>
        <p class="subtitle">
          Розклад, сесії, клієнти й нотатки — у системі, де контроль залишається у терапевта.
        </p>
        <div class="hero__actions">
          <RouterLink class="btn" to="/signup">Створити кабінет</RouterLink>
          <RouterLink class="btn btn--ghost" to="/login">Увійти</RouterLink>
        </div>
      </div>
      <div class="hero__scene" aria-hidden="true">
        <div class="scene__glow"></div>
        <div class="scene__panel"></div>
        <div class="scene__lines">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div class="scene__chip"></div>
      </div>
    </section>

    <main class="main">
      <RouterView />
    </main>

    <footer class="footer">
      <div>Consult · Professional therapist workspace</div>
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
const showHero = computed(() => route.path === '/')
const isAuthenticated = computed(() => Boolean(auth.accessToken))

function onLogout() {
  auth.logout()
  if (route.path.startsWith('/cabinet')) {
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

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: 24px;
}

.hero__card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 26px;
  box-shadow: var(--shadow);
  color: var(--ink);
}

.hero__scene {
  position: relative;
  min-height: 260px;
  border-radius: var(--radius);
  background: linear-gradient(140deg, #eef4f5, #dce6e8);
  border: 1px solid rgba(47, 63, 73, 0.18);
  overflow: hidden;
  box-shadow: var(--shadow);
}

.scene__glow {
  position: absolute;
  top: -40px;
  right: -20px;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(159, 192, 198, 0.55), transparent 70%);
}

.scene__panel {
  position: absolute;
  bottom: 40px;
  left: 24px;
  width: 68%;
  height: 14px;
  background: #b8c6cb;
  border-radius: 999px;
}

.scene__lines {
  position: absolute;
  top: 24px;
  left: 24px;
  display: grid;
  gap: 10px;
}

.scene__lines span {
  display: block;
  width: 120px;
  height: 10px;
  border-radius: 999px;
  background: rgba(47, 63, 73, 0.12);
}

.scene__chip {
  position: absolute;
  bottom: 56px;
  right: 36px;
  width: 80px;
  height: 80px;
  border-radius: 18px;
  background: rgba(159, 192, 198, 0.35);
  box-shadow: inset 0 0 0 1px rgba(47, 63, 73, 0.14);
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

@media (max-width: 960px) {
  .hero {
    grid-template-columns: 1fr;
  }
}
</style>
