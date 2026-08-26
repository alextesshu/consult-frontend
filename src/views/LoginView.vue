<template>
  <section class="auth">
    <div class="auth__card">
      <div class="badge">Вхід</div>
      <h1 class="title auth__title">Повернення до кабінету</h1>
      <p class="muted auth__subtitle">
        Використайте електронну пошту або логін. Доступ до кабінету без зайвих кроків.
      </p>
      <p v-if="isClientInviteRedirect" class="auth__invite-note">
        Ви відкрили запрошення до акаунта клієнта. Увійдіть, щоб продовжити підключення до клієнтської картки.
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
          <div class="password-input-wrap">
            <input
              v-model="password"
              class="input password-input"
              :type="showPassword ? 'text' : 'password'"
              name="password"
              autocomplete="current-password"
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
        <p v-if="error" class="form-error">{{ error }}</p>
        <button class="btn" type="submit" :disabled="loading">
          {{ loading ? 'Вхід...' : 'Продовжити' }}
        </button>
        <RouterLink class="auth__forgot-password" to="/forgot-password">Забули пароль?</RouterLink>
        <p class="muted auth__legal">
          Продовжуючи, ви погоджуєтеся з
          <RouterLink to="/terms">Умовами користування</RouterLink>
          та
          <RouterLink to="/privacy">Політикою конфіденційності</RouterLink>.
        </p>
        <p class="muted auth__helper">
          Шукаєте спеціаліста?
          <RouterLink to="/specialists">Знайти профіль спеціаліста</RouterLink>
        </p>
      </form>
    </div>

    <aside class="auth__aside">
      <div class="aside-card aside-card--onboarding">
        <div class="aside-title">Вперше на платформі?</div>
        <p class="aside-text">
          Оберіть роль і створіть окремий кабінет під ваш сценарій роботи.
        </p>
        <div class="onboarding-grid">
          <article class="onboarding-item onboarding-item--primary">
            <h2 class="onboarding-item__title">Я спеціаліст</h2>
            <p class="onboarding-item__copy">
              Створіть кабінет для ведення приватної практики.
            </p>
            <RouterLink class="btn onboarding-item__cta" to="/signup">Створити кабінет спеціаліста</RouterLink>
          </article>
          <article class="onboarding-item">
            <h2 class="onboarding-item__title">Я клієнт</h2>
            <p class="onboarding-item__copy">
              Створіть акаунт для запитів, оплат і доступу до сесій.
            </p>
            <RouterLink class="btn btn--ghost onboarding-item__cta" to="/signup-client">Створити кабінет клієнта</RouterLink>
          </article>
        </div>
      </div>

      <div class="aside-card">
        <div class="aside-title">Чому це безпечно</div>
        <ul class="aside-list">
          <li>Дані належать спеціалісту, не сервісу</li>
          <li>Жодних комісій із сесій</li>
          <li>Контроль доступу на рівні системи</li>
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
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { hasAdminRole, hasClientRole, hasSpecialistRole, normalizeUserRoles } from '../lib/entitlementReconcile'

const identifier = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const { loading } = storeToRefs(auth)
const isClientInviteRedirect = computed(() => {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect.trim() : ''
  return redirect.startsWith('/client/invite/')
})

const invalidCredentialsMessage = 'Не вдалося увійти з цими даними. Перевірте електронну пошту та пароль.'

function isInvalidCredentialsError(message: string) {
  const normalized = message.trim().toLowerCase().replace(/\s+/g, ' ')
  return (
    (normalized.includes('no active account') && normalized.includes('credentials')) ||
    normalized.includes('invalid credentials') ||
    normalized.includes('provided credentials') ||
    normalized.includes('given credentials') ||
    normalized.includes('невірні облікові дані') ||
    (normalized.includes('невірн') && normalized.includes('облікові дані')) ||
    (normalized.includes('неправильн') && normalized.includes('облікові дані'))
  )
}

function loginErrorMessage(err: unknown) {
  const message = err instanceof Error ? err.message.trim() : ''
  if (message && isInvalidCredentialsError(message)) {
    return invalidCredentialsMessage
  }
  return message || 'Не вдалося увійти. Спробуйте ще раз.'
}

function defaultPath() {
  const roles = normalizeUserRoles(auth.me?.user ?? auth.user)
  if (hasSpecialistRole(roles)) return '/cabinet'
  if (hasClientRole(roles)) return '/client'
  if (hasAdminRole(roles)) return '/admin/inbox'
  console.warn('[admin-guard-deny]', {
    reason: 'login-default-role-missing',
    source: 'login-default-path',
    normalizedRoles: roles,
    userRole: auth.user?.role ?? null,
    userRoles: auth.user?.roles ?? [],
    meUserRole: auth.me?.user?.role ?? null,
    meUserRoles: auth.me?.user?.roles ?? [],
  })
  return '/403?reason=login-default-role-missing'
}

function resolvePostLoginPath() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect.trim() : ''
  if (!redirect) return defaultPath()
  if (redirect === '/login' || redirect.startsWith('/login?')) return defaultPath()
  return redirect
}

async function onSubmit() {
  error.value = ''
  if (!identifier.value || !password.value) {
    error.value = 'Введіть облікові дані.'
    return
  }
  try {
    await auth.login(identifier.value.trim(), password.value)
    router.push(resolvePostLoginPath())
  } catch (err) {
    error.value = loginErrorMessage(err)
  }
}

onMounted(() => {
  if (auth.accessToken) {
    router.replace(resolvePostLoginPath())
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

.auth__invite-note {
  margin-top: 10px;
  border: 1px solid color-mix(in srgb, var(--primary) 22%, var(--line));
  border-radius: 12px;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--surface) 90%, #ffffff);
  color: var(--ink);
  line-height: 1.45;
}

.auth__legal {
  margin-top: 8px;
  font-size: 13px;
}

.auth__forgot-password {
  width: fit-content;
  color: var(--primary);
  font-weight: 600;
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

.aside-card--onboarding {
  border-color: color-mix(in srgb, var(--primary) 28%, var(--line));
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.96), rgba(17, 64, 54, 0.06));
  box-shadow: 0 16px 30px rgba(16, 40, 34, 0.12);
  display: grid;
  gap: 12px;
}

.onboarding-grid {
  display: grid;
  gap: 10px;
}

.onboarding-item {
  border: 1px solid color-mix(in srgb, var(--primary) 18%, var(--line));
  border-radius: 12px;
  padding: 14px;
  background: color-mix(in srgb, #ffffff 88%, var(--surface));
  display: grid;
  gap: 10px;
}

.onboarding-item--primary {
  background: linear-gradient(180deg, rgba(17, 64, 54, 0.12), rgba(255, 255, 255, 0.94));
  border-color: color-mix(in srgb, var(--primary) 30%, var(--line));
}

.onboarding-item__title {
  margin: 0;
  font-size: 20px;
  line-height: 1.2;
}

.onboarding-item__copy {
  margin: 0;
  color: var(--muted);
  line-height: 1.45;
}

.onboarding-item__cta {
  justify-self: start;
}

.aside-card--dark {
  background: linear-gradient(145deg, #0f2b3a 0%, #123447 45%, #0d2633 100%);
  color: #f1f6f9;
  border-color: rgba(255, 255, 255, 0.14);
  box-shadow: 0 20px 35px rgba(7, 31, 42, 0.28);
  padding: 20px 22px;
  display: grid;
  gap: 12px;
}

.aside-card--dark .aside-title {
  color: #f4f8fb;
  font-size: 20px;
  letter-spacing: 0.2px;
}

.aside-card--dark .aside-text {
  color: rgba(241, 246, 249, 0.82);
  line-height: 1.5;
  margin: 0;
}

.aside-card--dark .aside-list {
  color: rgba(241, 246, 249, 0.8);
}

.aside-card--dark .btn--ghost {
  color: #f6fbff;
  border-color: rgba(241, 246, 249, 0.5);
  background: rgba(241, 246, 249, 0.1);
  box-shadow: inset 0 0 0 1px rgba(241, 246, 249, 0.08);
}

.aside-card--dark .btn--ghost:hover {
  background: rgba(241, 246, 249, 0.2);
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

.disclaimer {
  background: rgba(7, 47, 71, 0.04);
}

.disclaimer .aside-text {
  margin: 0;
  color: var(--muted);
  opacity: 1;
  line-height: 1.5;
}

.password-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.password-input {
  width: 100%;
  min-width: 0;
  padding-right: 92px;
}

.password-toggle {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  min-height: 30px;
  padding: 4px 8px;
  border: 1px solid transparent;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--primary);
  font: inherit;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
}

.password-toggle:hover {
  background: color-mix(in srgb, var(--primary) 8%, #ffffff);
}

.password-toggle:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--primary) 55%, #ffffff);
  outline-offset: 2px;
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
