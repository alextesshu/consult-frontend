<template>
  <section class="auth">
    <div class="auth__card">
      <div class="badge">Реєстрація</div>
      <h1 class="title auth__title">Створіть профіль спеціаліста в Pro Consult.</h1>
      <p class="muted auth__subtitle">
        Ранній доступ активується автоматично після реєстрації. Під час раннього доступу ви можете спробувати
        розширені можливості без промокоду, а далі залишитися на Start, розширити ліміт активних клієнтів або
        перейти на PRO.
      </p>

      <div v-if="isClientOnly" class="form">
        <p class="muted auth__subtitle">
          Ви вже маєте акаунт клієнта. Увімкніть роль спеціаліста для цього ж акаунта без повторної реєстрації.
        </p>
        <p v-if="dualRoleError" class="form-error">{{ dualRoleError }}</p>
        <button class="btn" type="button" :disabled="dualRoleLoading" @click="onEnableSpecialist">
          {{ dualRoleLoading ? 'Оновлюємо доступ...' : 'Увімкнути кабінет спеціаліста' }}
        </button>
        <p class="muted auth__footer">
          Після активації відкриється кабінет спеціаліста, акаунт клієнта залишиться доступним.
        </p>
      </div>

      <form v-else class="form" @submit.prevent="onSubmit">
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
        <p class="muted auth__field-helper">
          Ранній доступ не потребує промокоду: доступні можливості визначаються поточними умовами сервісу.
        </p>
        <p v-if="error" class="form-error">{{ error }}</p>
        <button class="btn" type="submit" :disabled="loading">
          {{ loading ? 'Створення акаунта...' : 'Створити акаунт' }}
        </button>
        <p class="muted auth__reassurance">
          Без картки. Профіль не публікується автоматично. Можна почати зі Start — 0 грн.
        </p>
        <p class="muted auth__footer">
          Вже маєте акаунт?
          <RouterLink class="auth__secondary-link" to="/login">Увійти</RouterLink>
        </p>
        <p class="muted auth__footer">
          Потрібен акаунт клієнта?
          <RouterLink class="auth__secondary-link" to="/signup-client">Зареєструватися як клієнт</RouterLink>
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
          <li>Заповніть базовий профіль</li>
          <li>Увімкніть публічний профіль за прямим посиланням</li>
          <li>Отримуйте запити й створюйте сесії</li>
          <li>За потреби додайте доступний час для прямого бронювання</li>
        </ul>
      </div>
      <div class="aside-card disclaimer">
        <div class="aside-title">Дисклеймер</div>
        <p class="aside-text">
          Це сервіс для організації роботи спеціаліста. Відповідальність за послуги,
          рекомендації та результати несе сам спеціаліст.
        </p>
      </div>
      <div class="aside-card aside-card--dark">
        <div class="aside-title">Довіра з першого дня</div>
        <p class="aside-text">
          Ми не беремо комісій і не втручаємось у вашу практику.
        </p>
      </div>
    </aside>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { enableSpecialist, getApiErrorMessage } from '../lib/api'

const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const error = ref('')
const dualRoleError = ref('')
const dualRoleLoading = ref(false)
const router = useRouter()
const auth = useAuthStore()
const { loading } = storeToRefs(auth)
const roles = computed(() => auth.me?.user.roles ?? auth.user?.roles ?? [])
const isClientOnly = computed(
  () => roles.value.includes('CLIENT') && !roles.value.includes('SPECIALIST') && !roles.value.includes('THERAPIST')
)

async function onEnableSpecialist() {
  dualRoleError.value = ''
  dualRoleLoading.value = true
  try {
    await enableSpecialist()
    await auth.loadMe()
    router.push('/cabinet')
  } catch (err) {
    dualRoleError.value = getApiErrorMessage(
      err,
      'Не вдалося увімкнути роль спеціаліста. Спробуйте ще раз або зверніться в підтримку.'
    )
  } finally {
    dualRoleLoading.value = false
  }
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
    await auth.signup(
      email.value.trim(),
      password.value,
      passwordConfirm.value
    )
    router.push('/cabinet')
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

.auth__secondary-link {
  color: var(--pc-navy-900);
  font-weight: 700;
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--pc-navy-900) 42%, transparent);
  text-decoration-thickness: 1.5px;
  text-underline-offset: 3px;
  cursor: pointer;
}

.auth__secondary-link:hover {
  color: var(--pc-navy-950);
  text-decoration-color: currentcolor;
}

.auth__secondary-link:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--pc-navy-900) 26%, transparent);
  outline-offset: 3px;
  border-radius: 4px;
}

.auth__field-helper {
  margin-top: -8px;
  font-size: 13px;
}

.auth__reassurance {
  margin: -2px 0 0;
  font-size: 13px;
  line-height: 1.45;
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
