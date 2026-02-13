<template>
  <section class="auth">
    <div class="auth__card">
      <div class="badge">Вхід</div>
      <h1 class="title auth__title">Повернення до кабінету</h1>
      <p class="muted auth__subtitle">
        Використайте електронну пошту або логін. Доступ до кабінету без зайвих кроків.
      </p>

      <form class="form" @submit.prevent="onSubmit">
        <label class="field">
          <span>Ел. пошта або логін</span>
          <input
            v-model="identifier"
            class="input"
            type="text"
            name="identifier"
            autocomplete="username"
            placeholder="name@example.com або логін"
          />
        </label>
        <label class="field">
          <span>Пароль</span>
          <input
            v-model="password"
            class="input"
            type="password"
            name="password"
            autocomplete="current-password"
            placeholder="********"
          />
        </label>
        <p v-if="error" class="form-error">{{ error }}</p>
        <button class="btn" type="submit" :disabled="loading">
          {{ loading ? 'Вхід...' : 'Продовжити' }}
        </button>
        <p class="muted auth__footer">
          Вперше тут?
          <RouterLink to="/signup">Створити акаунт терапевта</RouterLink>
        </p>
      </form>
    </div>

    <aside class="auth__aside">
      <div class="aside-card">
        <div class="aside-title">Чому це безпечно</div>
        <ul class="aside-list">
          <li>Дані належать терапевту, не платформі</li>
          <li>Жодних комісій із сесій</li>
          <li>Контроль доступу на рівні системи</li>
        </ul>
      </div>
      <div class="aside-card aside-card--dark">
        <div class="aside-title">Перший раз?</div>
        <p class="aside-text">
          Створіть профіль і підготуйте кабінет за кілька хвилин.
        </p>
        <RouterLink class="btn btn--ghost" to="/signup">Створити акаунт</RouterLink>
      </div>
    </aside>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'

const identifier = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()
const auth = useAuthStore()
const { loading } = storeToRefs(auth)

function defaultPath() {
  const roles = auth.me?.user.roles ?? auth.user?.roles ?? []
  if (roles.includes('THERAPIST')) return '/cabinet'
  if (roles.includes('CLIENT')) return '/client'
  return '/login'
}

async function onSubmit() {
  error.value = ''
  if (!identifier.value || !password.value) {
    error.value = 'Введіть облікові дані.'
    return
  }
  try {
    await auth.login(identifier.value.trim(), password.value)
    router.push(defaultPath())
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Не вдалося увійти'
  }
}

onMounted(() => {
  if (auth.accessToken) {
    router.replace(defaultPath())
  }
})
</script>

<style scoped>
.auth {
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  align-items: start;
}

.auth__card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 28px;
  box-shadow: var(--shadow);
  color: var(--ink);
}

.auth__title {
  font-size: 32px;
}

.auth__subtitle {
  max-width: 420px;
}

.auth__footer {
  margin-top: 12px;
}

.auth__aside {
  display: grid;
  gap: 16px;
}

.aside-card {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 18px;
  background: #fff;
  color: var(--ink);
}

.aside-card--dark {
  background: #0f2b3a;
  color: #f1f6f9;
  border-color: rgba(255, 255, 255, 0.1);
}

.aside-title {
  font-family: var(--font-display);
  font-size: 18px;
  margin-bottom: 8px;
}

.aside-list {
  margin: 0;
  padding-left: 18px;
  color: var(--muted);
  display: grid;
  gap: 6px;
}

.aside-text {
  margin: 0 0 12px;
  opacity: 0.8;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: 10px;
  padding: 8px 10px;
}

@media (max-width: 900px) {
  .auth {
    grid-template-columns: 1fr;
  }
}
</style>
