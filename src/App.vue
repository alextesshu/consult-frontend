<template>
  <div class="page">
    <header class="topbar">
      <div class="brand">Consult</div>
      <nav class="nav">
        <template v-if="!isAuthenticated">
          <RouterLink to="/login">Вхід</RouterLink>
          <RouterLink to="/signup">Реєстрація</RouterLink>
        </template>
        <RouterLink to="/cabinet">Кабінет</RouterLink>
        <RouterLink to="/cabinet/profile">Профіль</RouterLink>
        <button v-if="isAuthenticated" class="btn btn--ghost" type="button" @click="onLogout">
          Вийти
        </button>
      </nav>
    </header>
    <section v-if="showHero" class="hero">
      <div class="hero__card">
        <div class="badge">Професійний кабінет</div>
        <h1 class="title">Професійні інструменти. Без чужих рук у вашій роботі.</h1>
        <p class="subtitle">
          Розклад, клієнти, сесії, нотатки та відео — у системі, що поважає межі.
        </p>
        <div class="hero__actions">
          <RouterLink class="btn" to="/signup">Створити кабінет</RouterLink>
          <RouterLink class="btn btn--ghost" to="/login">Увійти</RouterLink>
        </div>
      </div>
      <div class="hero__scene" aria-hidden="true">
        <div class="scene__glow"></div>
        <div class="scene__desk"></div>
        <div class="scene__lamp">
          <div class="lamp__shade"></div>
          <div class="lamp__stem"></div>
          <div class="lamp__base"></div>
        </div>
        <div class="scene__chair"></div>
        <div class="scene__notebook"></div>
      </div>
    </section>
    <main>
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const showHero = computed(() => !route.path.startsWith('/cabinet'))
const isAuthenticated = computed(() => Boolean(auth.accessToken))

function onLogout() {
  auth.logout()
  if (route.path.startsWith('/cabinet')) {
    router.push('/login')
  }
}
</script>
<style scoped></style>
