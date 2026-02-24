<template>
  <section class="auth">
    <div class="auth__card">
      <div class="badge">Реєстрація</div>
      <h1 class="title auth__title">Створіть клієнтський акаунт</h1>
      <p class="muted auth__subtitle">
        Після реєстрації ви зможете переглядати каталог та бронювати сесії.
      </p>

      <form class="form" @submit.prevent="onSubmit">
        <label class="field">
          <span>Ел. пошта</span>
          <input
            v-model="email"
            class="input"
            type="email"
            name="email"
            autocomplete="email"
            placeholder="name@example.com"
          />
        </label>
        <label class="field">
          <span>Пароль</span>
          <input
            v-model="password"
            class="input"
            type="password"
            name="password"
            autocomplete="new-password"
            placeholder="********"
          />
        </label>
        <label class="field">
          <span>Підтвердження пароля</span>
          <input
            v-model="passwordConfirm"
            class="input"
            type="password"
            name="password_confirm"
            autocomplete="new-password"
            placeholder="********"
          />
        </label>
        <p v-if="error" class="form-error">{{ error }}</p>
        <button class="btn" type="submit" :disabled="loading">
          {{ loading ? 'Створення акаунта...' : 'Створити акаунт' }}
        </button>
        <p class="muted auth__footer">
          Вже маєте акаунт?
          <RouterLink to="/login">Увійти</RouterLink>
        </p>
      </form>
    </div>

    <aside class="auth__aside">
      <div class="aside-card">
        <div class="aside-title">Що далі</div>
        <ul class="aside-list">
          <li>Знайдіть спеціаліста у каталозі</li>
          <li>Забронюйте зручний час</li>
          <li>Отримуйте нагадування та історію сесій</li>
        </ul>
      </div>
      <div class="aside-card disclaimer">
        <div class="aside-title">Дисклеймер</div>
        <p class="aside-text">
          Це сервіс для організації консультацій. Рішення про співпрацю та вартість
          приймаються клієнтом і спеціалістом самостійно.
        </p>
      </div>
    </aside>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'

const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const error = ref('')
const router = useRouter()
const auth = useAuthStore()
const { loading } = storeToRefs(auth)

async function onSubmit() {
  error.value = ''
  if (!email.value || !password.value || !passwordConfirm.value) {
    error.value = 'Заповніть усі поля.'
    return
  }
  if (password.value !== passwordConfirm.value) {
    error.value = 'Паролі не збігаються.'
    return
  }
  try {
    await auth.signupClient(email.value.trim(), password.value, passwordConfirm.value)
    router.push('/client')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Не вдалося зареєструватися'
  }
}
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
  margin: 0;
  opacity: 0.8;
}

.disclaimer {
  background: rgba(7, 47, 71, 0.04);
}

.disclaimer .aside-text {
  color: var(--muted);
  opacity: 1;
  line-height: 1.5;
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
