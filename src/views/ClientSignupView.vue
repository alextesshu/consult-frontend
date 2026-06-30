<template>
  <section class="auth">
    <div class="auth__card">
      <div class="badge">Реєстрація</div>
      <h1 class="title auth__title">Створіть клієнтський акаунт</h1>
      <p class="muted auth__subtitle">
        Після реєстрації ви зможете переглядати публічні профілі, надсилати запити та мати доступ до сесій.
      </p>
      <p v-if="isClientInviteRedirect" class="auth__invite-note">
        Ви створюєте акаунт клієнта за запрошенням спеціаліста. Після реєстрації ви зможете підтвердити підключення до клієнтської картки.
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
          <div class="password-input-wrap">
            <input
              v-model="password"
              class="input password-input"
              :type="showPassword ? 'text' : 'password'"
              name="password"
              autocomplete="new-password"
              placeholder="********"
            />
            <button
              class="password-toggle"
              type="button"
              :aria-label="showPassword ? 'Сховати пароль' : 'Показати пароль'"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? 'Сховати' : 'Показати' }}
            </button>
          </div>
        </label>
        <label class="field">
          <span>Підтвердження пароля</span>
          <div class="password-input-wrap">
            <input
              v-model="passwordConfirm"
              class="input password-input"
              :type="showPasswordConfirm ? 'text' : 'password'"
              name="password_confirm"
              autocomplete="new-password"
              placeholder="********"
            />
            <button
              class="password-toggle"
              type="button"
              :aria-label="
                showPasswordConfirm
                  ? 'Сховати підтвердження пароля'
                  : 'Показати підтвердження пароля'
              "
              @click="showPasswordConfirm = !showPasswordConfirm"
            >
              {{ showPasswordConfirm ? 'Сховати' : 'Показати' }}
            </button>
          </div>
        </label>
        <p v-if="error" class="form-error">{{ error }}</p>
        <button class="btn" type="submit" :disabled="loading">
          {{ loading ? 'Створення акаунта...' : 'Створити акаунт' }}
        </button>
        <p class="muted auth__footer">
          Вже маєте акаунт?
          <RouterLink to="/login">Увійти</RouterLink>
        </p>
        <p class="muted auth__footer">
          Потрібен акаунт спеціаліста?
          <RouterLink to="/signup">Реєстрація спеціаліста</RouterLink>
        </p>
        <p class="muted auth__legal">
          Продовжуючи, ви погоджуєтеся з
          <RouterLink to="/terms">Умовами користування</RouterLink>
          та
          <RouterLink to="/privacy">Політикою конфіденційності</RouterLink>.
        </p>
      </form>
    </div>

    <aside class="auth__aside">
      <div class="aside-card">
        <div class="aside-title">Що далі</div>
        <ul class="aside-list">
          <li>Знайдіть публічний профіль спеціаліста</li>
          <li>Надішліть запит на зручний час</li>
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
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'

const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const showPassword = ref(false)
const showPasswordConfirm = ref(false)
const error = ref('')
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { loading } = storeToRefs(auth)
const isClientInviteRedirect = computed(() => {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect.trim() : ''
  return redirect.startsWith('/client/invite/')
})

function safeRedirectPath() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect.trim() : ''
  if (!redirect) return '/client'
  if (!redirect.startsWith('/') || redirect.startsWith('//')) return '/client'
  return redirect
}

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
    router.push(safeRedirectPath())
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

.auth__invite-note {
  margin-top: 10px;
  border: 1px solid color-mix(in srgb, var(--primary) 22%, var(--line));
  border-radius: 12px;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--surface) 90%, #ffffff);
  color: var(--ink);
  line-height: 1.45;
}

.auth__footer {
  margin-top: 12px;
}

.auth__legal {
  margin-top: 8px;
  font-size: 13px;
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
