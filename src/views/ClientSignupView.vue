<template>
  <section class="auth" :class="{ 'pc2-client-signup': uiV2 }" @focusin="ensureVisibleFocus">
    <div class="auth__card">
      <nav v-if="uiV2" class="pc2-account-types" aria-label="Тип акаунта">
        <RouterLink :to="accountTypeLink('/signup')" class="pc2-account-types__option" active-class="" exact-active-class="" :aria-current="undefined">
          <span class="pc2-account-types__label">Я спеціаліст</span>
          <span class="pc2-account-types__description">Для ведення консультацій і власної практики.</span>
        </RouterLink>
        <RouterLink :to="accountTypeLink('/signup-client')" class="pc2-account-types__option" active-class="" exact-active-class="" :aria-current="uiV2 ? 'page' : undefined">
          <span class="pc2-account-types__label">Я клієнт</span>
          <span class="pc2-account-types__description">Для звернень до спеціалістів і керування запитами.</span>
        </RouterLink>
      </nav>
      <div class="badge">Реєстрація</div>
      <h1 class="title auth__title">Створіть клієнтський акаунт</h1>
      <p class="muted auth__subtitle">
        Після реєстрації ви зможете переглядати публічні профілі, надсилати запити та мати доступ до сесій.
      </p>
      <p v-if="isClientInviteRedirect" class="auth__invite-note">
        Ви створюєте акаунт клієнта за запрошенням спеціаліста. Після реєстрації ви зможете підтвердити підключення до клієнтської картки.
      </p>

      <form class="form" :aria-busy="uiV2 ? loading : undefined" @submit.prevent="onSubmit">
        <label v-if="uiV2" class="field">
          <span>Ім’я</span>
          <input v-model="firstName" class="input" name="first_name" autocomplete="given-name" aria-required="true" :aria-invalid="!!fieldErrors.first_name" :aria-describedby="fieldErrors.first_name ? 'client-name-error' : undefined" />
          <span v-if="fieldErrors.first_name" id="client-name-error" class="form-error" role="alert">{{ fieldErrors.first_name }}</span>
        </label>
        <label class="field">
          <span>Ел. пошта</span>
          <input
            v-model="email"
            class="input"
            type="email"
            name="email" :aria-invalid="uiV2 && fieldErrors.email ? true : undefined" :aria-describedby="uiV2 && fieldErrors.email ? 'client-email-error' : undefined"
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
              name="password" :aria-invalid="uiV2 && fieldErrors.password ? true : undefined" :aria-describedby="uiV2 && fieldErrors.password ? 'client-password-error' : undefined"
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
        <label v-if="!uiV2" class="field">
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
        <p v-if="uiV2 && fieldErrors.email" class="form-error" role="alert" id="client-email-error">{{ fieldErrors.email }}</p>
        <p v-if="uiV2 && fieldErrors.password" class="form-error" role="alert" id="client-password-error">{{ fieldErrors.password }}</p>
        <p v-if="error" class="form-error" :role="uiV2 ? 'alert' : undefined" :aria-atomic="uiV2 ? 'true' : undefined">{{ error }}</p>
        <button class="btn" type="submit" :disabled="loading || signupInFlight">
          {{ loading || signupInFlight ? 'Створення акаунта...' : 'Створити акаунт' }}
        </button>
        <p class="muted auth__footer">
          Вже маєте акаунт?
          <RouterLink to="/login">Увійти</RouterLink>
        </p>
        <p v-if="!uiV2" class="muted auth__footer">
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
      <div v-if="uiV2" class="pc2-client-discovery">
        <p>Хочете просто звернутися до спеціаліста? Кабінет для цього не обов’язковий.</p>
        <RouterLink :to="{ path: '/specialists', query: { ui: 'v2' } }">Знайти спеціаліста →</RouterLink>
      </div>
    </div>

    <aside v-if="uiV2" class="pc2-client-preview" aria-labelledby="client-preview-title">
      <div class="pc2-client-preview__content">
        <p class="pc2-client-preview__eyebrow">Приклад кабінету клієнта</p>
        <h2 id="client-preview-title">Ваші запити й сесії — в одному місці</h2>
        <p class="pc2-client-preview__note">Ілюстрація інтерфейсу. Це не ваші дані та не підтверджене бронювання.</p>
        <div class="pc2-client-preview__card pc2-client-preview__card--navy">
          <h3>Сесії</h3>
          <p>Інформація про зустріч з’явиться після погодження зі спеціалістом.</p>
          <div class="pc2-client-preview__lines" aria-hidden="true"><span></span><span></span></div>
        </div>
        <div class="pc2-client-preview__card">
          <h3>Ваші запити</h3>
          <p>Звернення до спеціалістів та відповіді на них.</p>
          <div class="pc2-client-preview__lines" aria-hidden="true"><span></span><span></span></div>
        </div>
        <div class="pc2-client-preview__card">
          <h3>Історія сесій</h3>
          <p>Попередні зустрічі зібрані в кабінеті.</p>
        </div>
        <p class="pc2-client-preview__disclaimer">Це сервіс для організації консультацій. Рішення про співпрацю та вартість приймаються клієнтом і спеціалістом самостійно.</p>
      </div>
    </aside>
    <aside v-else class="auth__aside">
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
import { isUiV2 } from '../lib/uiVersion'
import { normalizeRegistrationName, registrationNameError, RegistrationError, type RegistrationField } from '../lib/api'

const uiV2 = computed(isUiV2)
const firstName = ref('')
const signupInFlight = ref(false)
const fieldErrors = ref<Partial<Record<RegistrationField, string>>>({})
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

// Forward only query values consumed by these flows; never copy credential parameters.
function accountTypeLink(path: '/signup' | '/signup-client') {
  const query: Record<string, string> = { ui: 'v2' }
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    const value = route.query[key]
    if (typeof value === 'string') query[key] = value
  }
  const redirect = route.query.redirect
  if (typeof redirect === 'string') {
    const trimmed = redirect.trim()
    if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !/[\\\u0000-\u001f\u007f]/.test(trimmed)) {
      query.redirect = trimmed
    }
  }
  return { path, query }
}

function ensureVisibleFocus(event: FocusEvent) {
  const target = event.target
  if (!uiV2.value || !(target instanceof HTMLElement) || !target.matches(':focus-visible')) return
  // Native focus scrolling can place a field behind the existing sticky header.
  requestAnimationFrame(() => {
    if (!uiV2.value || document.activeElement !== target) return
    const offset = parseFloat(getComputedStyle(target).scrollMarginTop) || 0
    const top = target.getBoundingClientRect().top
    if (top < offset) window.scrollBy({ top: top - offset, behavior: 'instant' })
  })
}

function safeRedirectPath() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect.trim() : ''
  if (!redirect) return '/client'
  if (!redirect.startsWith('/') || redirect.startsWith('//')) return '/client'
  return redirect
}

async function onSubmit() {
  if (signupInFlight.value || loading.value) return
  error.value = ''
  fieldErrors.value = {}
  if (uiV2.value) {
    const nameError = registrationNameError(firstName.value)
    if (nameError) { fieldErrors.value.first_name = nameError; return }
  }
  if (!email.value || !password.value || (!uiV2.value && !passwordConfirm.value)) {
    error.value = 'Заповніть усі поля.'
    return
  }
  if (!uiV2.value && password.value !== passwordConfirm.value) {
    error.value = 'Паролі не збігаються.'
    return
  }
  signupInFlight.value = true
  try {
    await auth.signupClient(email.value.trim(), password.value, uiV2.value ? undefined : passwordConfirm.value,
      ...uiV2.value ? [{ registration_contract_version: 2 as const, first_name: normalizeRegistrationName(firstName.value) }] as const : [])
    router.push(safeRedirectPath())
  } catch (err) {
    if (uiV2.value && err instanceof RegistrationError) fieldErrors.value = err.fields
    error.value = err instanceof Error ? err.message : 'Не вдалося зареєструватися'
  } finally {
    signupInFlight.value = false
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

<style>
/* Page-only overrides; the original v1 stylesheet and submission contract stay intact. */

html[data-ui="v2"] .pc2-client-signup .pc2-account-types { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--pc-space-3); margin-bottom: var(--pc-space-6); }
html[data-ui="v2"] .pc2-client-signup .pc2-account-types__option { display: flex; flex-direction: column; gap: var(--pc-space-2); min-width: 0; padding: var(--pc-space-4) var(--pc-space-3); border: 1.5px solid var(--pc-border); border-radius: var(--pc-radius-md); background: var(--pc-bg-card); color: var(--pc-navy-900); font-family: var(--pc-font); font-weight: var(--pc-fw-medium); text-decoration: none; line-height: var(--pc-lh-body); }
html[data-ui="v2"] .pc2-client-signup .pc2-account-types__label { font-size: var(--pc-fs-ui); }
html[data-ui="v2"] .pc2-client-signup .pc2-account-types__description { color: var(--pc-text-body); font-size: var(--pc-fs-meta); font-weight: var(--pc-fw-regular); overflow-wrap: anywhere; }
html[data-ui="v2"] .pc2-client-signup .pc2-account-types__option[aria-current="page"] { border-color: var(--pc-navy-900); background: var(--pc-bg-soft); }
html[data-ui="v2"] .pc2-client-signup .pc2-account-types__option:hover { border-color: var(--pc-navy-900); background: var(--pc-bg-soft); color: var(--pc-navy-900); }
html[data-ui="v2"] .pc2-client-signup .pc2-account-types__option:focus-visible { outline: var(--pc-focus-width) solid var(--pc-navy-900); outline-offset: var(--pc-focus-offset); }

html[data-ui="v2"] .pc2-client-signup.auth { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: stretch; gap: var(--pc-space-10); padding-block: var(--pc-space-8); background: var(--pc-bg-main); color: var(--pc-text-body); font-family: var(--pc-font); }
html[data-ui="v2"] .pc2-client-signup .auth__card { width: 100%; max-width: calc(var(--pc-space-24) * 5); margin-inline: auto; padding: var(--pc-space-6) 0; border: 0; border-radius: 0; box-shadow: none; background: transparent; color: var(--pc-text-body); min-width: 0; }
html[data-ui="v2"] .pc2-client-signup .badge { display: none; }
html[data-ui="v2"] .pc2-client-signup .auth__title { color: var(--pc-text-main); font-size: var(--pc-fs-h1); font-weight: var(--pc-fw-medium); line-height: var(--pc-lh-head); letter-spacing: var(--pc-ls-head); margin-block: var(--pc-space-5) var(--pc-space-4); }
html[data-ui="v2"] .pc2-client-signup .auth__subtitle { max-width: none; margin-block: 0 var(--pc-space-6); color: var(--pc-text-body); font-size: var(--pc-fs-body); line-height: var(--pc-lh-body); }
html[data-ui="v2"] .pc2-client-signup .form { display: grid; gap: var(--pc-space-5); }
html[data-ui="v2"] .pc2-client-signup .field { display: flex; flex-direction: column; gap: var(--pc-space-2); }
html[data-ui="v2"] .pc2-client-signup .field > span { color: var(--pc-text-main); font-size: var(--pc-fs-small); font-weight: var(--pc-fw-medium); }
html[data-ui="v2"] .pc2-client-signup .input { height: var(--pc-control-h-lg); min-height: var(--pc-control-h-lg); width: 100%; min-width: 0; padding: 0 var(--pc-space-4); background: var(--pc-bg-card); color: var(--pc-text-main); border: 1.5px solid var(--pc-border); border-radius: var(--pc-radius-sm); font: var(--pc-fw-regular) var(--pc-fs-body)/var(--pc-lh-body) var(--pc-font); box-shadow: none; }
html[data-ui="v2"] .pc2-client-signup .input:hover { border-color: var(--pc-border-strong); }
html[data-ui="v2"] .pc2-client-signup .input::placeholder { color: var(--pc-text-muted); opacity: 1; }
html[data-ui="v2"] .pc2-client-signup .input:focus { border-color: var(--pc-navy-900); box-shadow: var(--pc-ring); }
html[data-ui="v2"] .pc2-client-signup .password-input-wrap { position: relative; min-width: 0; }
html[data-ui="v2"] .pc2-client-signup .password-input { padding-right: var(--pc-space-24); }
html[data-ui="v2"] .pc2-client-signup .password-toggle { position: absolute; right: var(--pc-space-1); top: 50%; transform: translateY(-50%); min-height: var(--pc-control-h); height: var(--pc-control-h); padding: 0 var(--pc-space-3); background: transparent; border: 0; border-radius: var(--pc-radius-xs); color: var(--pc-navy-900); font: var(--pc-fw-medium) var(--pc-fs-meta)/var(--pc-lh-body) var(--pc-font); cursor: pointer; }
html[data-ui="v2"] .pc2-client-signup .password-toggle:hover { background: var(--pc-bg-soft); color: var(--pc-navy-950); }
html[data-ui="v2"] .pc2-client-signup .btn { min-height: var(--pc-control-h-lg); padding: var(--pc-space-4) var(--pc-space-6); width: 100%; border: 1px solid var(--pc-navy-900); border-radius: var(--pc-radius-pill); background: var(--pc-navy-900); color: var(--pc-bg-card); font: var(--pc-fw-medium) var(--pc-fs-body)/var(--pc-lh-head) var(--pc-font); box-shadow: none; white-space: normal; text-align: center; }
html[data-ui="v2"] .pc2-client-signup .btn:hover:not(:disabled) { background: var(--pc-navy-950); border-color: var(--pc-navy-950); }
html[data-ui="v2"] .pc2-client-signup .btn:active:not(:disabled) { background: var(--pc-navy-800); }
html[data-ui="v2"] .pc2-client-signup .btn:disabled { opacity: .45; cursor: default; }
html[data-ui="v2"] .pc2-client-signup .auth__footer,
html[data-ui="v2"] .pc2-client-signup .auth__legal { color: var(--pc-text-muted); font-size: var(--pc-fs-small); line-height: var(--pc-lh-body); margin: 0; }
html[data-ui="v2"] .pc2-client-signup .auth__legal { overflow-wrap: anywhere; }
html[data-ui="v2"] .pc2-client-signup a { color: var(--pc-navy-900); font-weight: var(--pc-fw-medium); text-decoration: underline; text-decoration-color: currentColor; text-underline-offset: var(--pc-space-1); }
html[data-ui="v2"] .pc2-client-signup a:hover { color: var(--pc-navy-950); }
html[data-ui="v2"] .pc2-client-signup .form-error { margin: 0; padding: var(--pc-space-3) var(--pc-space-4); border: 1px solid var(--pc-danger); border-radius: var(--pc-radius-sm); background: var(--pc-danger-soft); color: var(--pc-danger); font-size: var(--pc-fs-small); line-height: var(--pc-lh-body); overflow-wrap: anywhere; }

html[data-ui="v2"] .pc2-client-signup .auth__invite-note { margin-block: 0 var(--pc-space-6); padding: var(--pc-space-4); border: 1px solid var(--pc-teal-200); border-radius: var(--pc-radius-md); background: var(--pc-teal-100); color: var(--pc-teal-ink); }
html[data-ui="v2"] .pc2-client-signup .pc2-client-discovery { margin-top: var(--pc-space-6); padding-top: var(--pc-space-6); border-top: 1px solid var(--pc-border-hair); font-size: var(--pc-fs-small); }
html[data-ui="v2"] .pc2-client-signup .pc2-client-discovery p { margin: 0 0 var(--pc-space-3); }
html[data-ui="v2"] .pc2-client-signup .pc2-client-discovery a { display: inline-flex; align-items: center; min-height: var(--pc-control-h); }
html[data-ui="v2"] .pc2-client-signup .pc2-client-preview { display: flex; align-items: center; min-width: 0; padding: var(--pc-space-10); border-radius: var(--pc-radius-lg); background: var(--pc-teal-100); }
html[data-ui="v2"] .pc2-client-signup .pc2-client-preview__content { display: grid; gap: var(--pc-space-4); width: 100%; max-width: calc(var(--pc-space-24) * 4); margin-inline: auto; }
html[data-ui="v2"] .pc2-client-signup .pc2-client-preview__eyebrow { color: var(--pc-teal-ink); font-size: var(--pc-fs-meta); margin: 0; }
html[data-ui="v2"] .pc2-client-signup .pc2-client-preview h2 { margin: 0; color: var(--pc-teal-ink); font-size: var(--pc-fs-h2); }
html[data-ui="v2"] .pc2-client-signup .pc2-client-preview__note,
html[data-ui="v2"] .pc2-client-signup .pc2-client-preview__disclaimer { color: var(--pc-teal-ink); font-size: var(--pc-fs-meta); margin: 0; }
html[data-ui="v2"] .pc2-client-signup .pc2-client-preview__card { padding: var(--pc-space-6); border: 1px solid var(--pc-border-hair); border-radius: var(--pc-radius-md); background: var(--pc-bg-card); color: var(--pc-text-body); }
html[data-ui="v2"] .pc2-client-signup .pc2-client-preview__card h3 { margin: 0 0 var(--pc-space-3); font-size: var(--pc-fs-h3); color: var(--pc-text-main); }
html[data-ui="v2"] .pc2-client-signup .pc2-client-preview__card p { margin: 0; font-size: var(--pc-fs-small); }
html[data-ui="v2"] .pc2-client-signup .pc2-client-preview__card--navy { background: var(--pc-navy-900); border-color: var(--pc-navy-900); color: var(--pc-bg-card); }
html[data-ui="v2"] .pc2-client-signup .pc2-client-preview__card--navy h3 { color: var(--pc-bg-card); }
html[data-ui="v2"] .pc2-client-signup .pc2-client-preview__lines { display: grid; gap: var(--pc-space-2); margin-top: var(--pc-space-5); }
html[data-ui="v2"] .pc2-client-signup .pc2-client-preview__lines span { display: block; height: var(--pc-space-2); border-radius: var(--pc-radius-pill); background: var(--pc-teal-200); }
html[data-ui="v2"] .pc2-client-signup .pc2-client-preview__lines span:last-child { width: 60%; }
html[data-ui="v2"] .pc2-client-signup :focus-visible { outline: var(--pc-focus-width) solid var(--pc-navy-900); outline-offset: var(--pc-focus-offset); }
html[data-ui="v2"] .pc2-client-signup :is(input, button, a) { scroll-margin-top: var(--pc-header-anchor-offset); scroll-margin-bottom: var(--pc-space-6); }
@media (max-width: 900px) {
  html[data-ui="v2"] .pc2-client-signup.auth { grid-template-columns: minmax(0, 1fr); gap: var(--pc-space-6); padding-block: var(--pc-space-6); }
  html[data-ui="v2"] .pc2-client-signup .pc2-client-preview { width: 100%; max-width: calc(var(--pc-space-24) * 6); margin-inline: auto; }
}
@media (max-width: 600px) {
  html[data-ui="v2"] .pc2-client-signup .pc2-client-preview { padding: var(--pc-space-5); }
}
@media (prefers-reduced-motion: reduce) {
  html[data-ui="v2"] .pc2-client-signup *,
  html[data-ui="v2"] .pc2-client-signup *::before,
  html[data-ui="v2"] .pc2-client-signup *::after { animation: none; transition: none; }
}
</style>
