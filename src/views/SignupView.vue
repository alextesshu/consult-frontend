<template>
  <section class="auth" :class="{ 'pc2-signup': uiV2 }" @focusin="ensureVisibleFocus">
    <div class="auth__card">
      <nav v-if="uiV2" class="pc2-account-types" aria-label="Тип акаунта">
        <RouterLink :to="accountTypeLink('/signup')" class="pc2-account-types__option" active-class="" exact-active-class="" :aria-current="uiV2 ? 'page' : undefined">
          <span class="pc2-account-types__label">Я спеціаліст</span>
          <span class="pc2-account-types__description">Для ведення консультацій і власної практики.</span>
        </RouterLink>
        <RouterLink :to="accountTypeLink('/signup-client')" class="pc2-account-types__option" active-class="" exact-active-class="" :aria-current="undefined">
          <span class="pc2-account-types__label">Я клієнт</span>
          <span class="pc2-account-types__description">Для звернень до спеціалістів і керування запитами.</span>
        </RouterLink>
      </nav>
      <div class="badge">Реєстрація</div>
      <h1 class="title auth__title">{{ uiV2 && !isClientOnly ? ['Як вас звати?', 'З чим ви працюєте?', 'Останній крок'][step] : 'Створіть профіль спеціаліста в Pro Consult.' }}</h1>
      <p v-if="!uiV2 || isClientOnly" class="muted auth__subtitle">
        Ранній доступ активується автоматично після реєстрації. Під час раннього доступу ви можете спробувати
        розширені можливості без промокоду, а далі залишитися на Start, розширити ліміт активних клієнтів або
        перейти на PRO.
      </p>

      <p v-if="uiV2 && !isClientOnly" class="muted auth__subtitle">{{ ['Почнімо з імені для вашого акаунта.', 'Оберіть напрям — решту профілю заповните пізніше.', 'Пошта для входу та сповіщень про нові запити.'][step] }}</p>

      <div v-if="isClientOnly" class="form" :aria-busy="uiV2 ? dualRoleLoading : undefined">
        <p class="muted auth__subtitle">
          Ви вже маєте акаунт клієнта. Увімкніть роль спеціаліста для цього ж акаунта без повторної реєстрації.
        </p>
        <p v-if="dualRoleError" class="form-error" :role="uiV2 ? 'alert' : undefined" :aria-atomic="uiV2 ? true : undefined">{{ dualRoleError }}</p>
        <button class="btn" :class="uiV2 ? 'pc2-btn pc2-btn--primary pc2-btn--lg pc2-btn--block' : undefined" type="button" :disabled="dualRoleLoading" @click="onEnableSpecialist">
          {{ dualRoleLoading ? 'Оновлюємо доступ...' : 'Увімкнути кабінет спеціаліста' }}
        </button>
        <p class="muted auth__footer">
          Після активації відкриється кабінет спеціаліста, акаунт клієнта залишиться доступним.
        </p>
      </div>

      <form v-else class="form" :aria-busy="uiV2 ? loading || signupInFlight : undefined" :aria-describedby="uiV2 && error ? 'signup-error' : undefined" @submit.prevent="onSubmit">
        <div v-if="uiV2" class="pc2-steps" aria-label="Прогрес реєстрації">
          <ol><li v-for="(label, index) in ['Ім’я', 'Практика', 'Акаунт']" :key="label" :aria-current="step === index ? 'step' : undefined" :class="{ 'pc2-steps__complete': step > index }">{{ index + 1 }}. {{ label }}</li></ol>
          <p role="status">Крок {{ step + 1 }} з 3</p>
        </div>
        <label v-if="uiV2 && step === 0" class="field pc2-field">
          <span>Ім’я</span>
          <input v-model="firstName" class="input pc2-input pc2-input--lg" name="first_name" autocomplete="given-name" aria-required="true" :aria-invalid="!!fieldErrors.first_name" :aria-describedby="fieldErrors.first_name ? 'signup-name-error' : 'signup-name-help'" />
          <small id="signup-name-help">Ваше ім’я для акаунта. Профіль не публікується автоматично.</small>
          <span v-if="fieldErrors.first_name" id="signup-name-error" class="form-error" role="alert">{{ fieldErrors.first_name }}</span>
        </label>
        <fieldset v-if="uiV2 && step === 1" class="pc2-practices" :aria-describedby="fieldErrors.professional_focus ? 'signup-focus-error' : undefined">
          <legend>Напрям практики</legend>
          <label v-for="option in professionalFocusOptions" :key="option.value" class="pc2-practices__option">
            <input v-model="professionalFocus" type="radio" name="professional_focus" :value="option.value" :aria-invalid="!!fieldErrors.professional_focus" />
            <span>{{ option.label }}</span>
          </label>
          <p v-if="fieldErrors.professional_focus" id="signup-focus-error" class="form-error" role="alert">{{ fieldErrors.professional_focus }}</p>
        </fieldset>
        <template v-if="!uiV2 || step === 2">
        <label class="field" :class="{ 'pc2-field': uiV2 }">
          <span>Ел. пошта</span>
          <input
            v-model="email"
            class="input" :class="uiV2 ? 'pc2-input pc2-input--lg' : undefined"
            type="email"
            name="email"
            :aria-invalid="uiV2 && fieldErrors.email ? true : undefined"
            :aria-describedby="uiV2 && fieldErrors.email ? 'signup-email-error' : undefined"
            autocomplete="email"
            :aria-required="uiV2 ? true : undefined"
            placeholder="name@example.com"
          />
        </label>
        <label class="field" :class="{ 'pc2-field': uiV2 }">
          <span>Пароль</span>
          <div class="password-input-wrap" :class="{ 'pc2-password': uiV2 }">
            <input
              v-model="password"
              class="input password-input" :class="uiV2 ? 'pc2-input pc2-input--lg' : undefined"
              :type="showPassword ? 'text' : 'password'"
              name="password"
              :aria-invalid="uiV2 && fieldErrors.password ? true : undefined"
              :aria-describedby="uiV2 && fieldErrors.password ? 'signup-password-error' : undefined"
              autocomplete="new-password"
              :aria-required="uiV2 ? true : undefined"
              placeholder="********"
            />
            <button
              class="password-toggle" :class="{ 'pc2-password__toggle': uiV2 }"
              type="button"
              :aria-label="showPassword ? 'Сховати пароль' : 'Показати пароль'"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? 'Сховати' : 'Показати' }}
            </button>
          </div>
        </label>
        <label v-if="!uiV2" class="field" :class="{ 'pc2-field': uiV2 }">
          <span>Підтвердження пароля</span>
          <div class="password-input-wrap" :class="{ 'pc2-password': uiV2 }">
            <input
              v-model="passwordConfirm"
              class="input password-input" :class="uiV2 ? 'pc2-input pc2-input--lg' : undefined"
              :type="showPasswordConfirm ? 'text' : 'password'"
              name="password_confirm"
              autocomplete="new-password"
              :aria-required="uiV2 ? true : undefined"
              placeholder="********"
            />
            <button
              class="password-toggle" :class="{ 'pc2-password__toggle': uiV2 }"
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
        </template>
        <p v-if="uiV2 && step === 2 && fieldErrors.email" class="form-error" role="alert" id="signup-email-error">{{ fieldErrors.email }}</p>
        <p v-if="uiV2 && step === 2 && fieldErrors.password" class="form-error" role="alert" id="signup-password-error">{{ fieldErrors.password }}</p>
        <p v-if="!uiV2 || step === 2" class="muted auth__field-helper">
          Ранній доступ не потребує промокоду: доступні можливості визначаються поточними умовами сервісу.
        </p>
        <p v-if="error" class="form-error" :id="uiV2 ? 'signup-error' : undefined" :role="uiV2 ? 'alert' : undefined" :aria-atomic="uiV2 ? true : undefined">{{ error }}</p>
        <button v-if="uiV2 && step > 0" class="btn pc2-wizard-back" type="button" :disabled="loading || signupInFlight" @click="moveStep(step - 1)">Назад</button>
        <button class="btn" :class="uiV2 ? 'pc2-btn pc2-btn--primary pc2-btn--lg pc2-btn--block' : undefined" type="submit" :disabled="loading || signupInFlight">
          {{ loading || signupInFlight ? 'Створення акаунта...' : uiV2 && step < 2 ? 'Далі' : 'Створити акаунт' }}
        </button>
        <p class="muted auth__reassurance">
          Без картки. Профіль не публікується автоматично. Можна почати зі Start — 0 грн.
        </p>
        <p class="muted auth__footer">
          Вже маєте акаунт?
          <RouterLink class="auth__secondary-link" to="/login">Увійти</RouterLink>
        </p>
        <p v-if="!uiV2" class="muted auth__footer">
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
          <li>За потреби додайте доступний час, який клієнти можуть обрати під час запиту</li>
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
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { enableSpecialist, getApiErrorMessage, normalizeRegistrationName, registrationNameError, RegistrationError, type RegistrationField } from '../lib/api'
import { professionalFocusOptions, professionalFocusValues, type ProfessionalFocus } from '../constants/professionalFocus'
import {
  clearSpecialistRegistrationAttribution,
  getSpecialistRegistrationAttribution,
} from '../lib/registrationAttribution'
import { productAnalytics } from '../lib/productAnalytics'
import { isUiV2 } from '../lib/uiVersion'

const uiV2 = computed(isUiV2)
const signupInFlight = ref(false)
const step = ref(0)
const firstName = ref('')
const professionalFocus = ref<ProfessionalFocus | ''>('')
const fieldErrors = ref<Partial<Record<RegistrationField, string>>>({})
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const showPassword = ref(false)
const showPasswordConfirm = ref(false)
const error = ref('')
const dualRoleError = ref('')
const dualRoleLoading = ref(false)
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { loading } = storeToRefs(auth)
const roles = computed(() => auth.me?.user.roles ?? auth.user?.roles ?? [])
const isClientOnly = computed(
  () => roles.value.includes('CLIENT') && !roles.value.includes('SPECIALIST') && !roles.value.includes('THERAPIST')
)

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

async function onEnableSpecialist() {
  if (dualRoleLoading.value) return
  dualRoleError.value = ''
  dualRoleLoading.value = true
  try {
    await enableSpecialist(getSpecialistRegistrationAttribution())
    clearSpecialistRegistrationAttribution()
    await auth.loadMe()
    productAnalytics.capture('specialist_activated')
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

async function moveStep(value: number) {
  step.value = value
  await nextTick()
  document.querySelector<HTMLElement>('.pc2-signup form input')?.focus()
}

async function onSubmit() {
  if (signupInFlight.value || loading.value) return
  error.value = ''
  fieldErrors.value = {}
  if (uiV2.value) {
    const nameError = registrationNameError(firstName.value)
    if (nameError) {
      fieldErrors.value.first_name = nameError
      await moveStep(0)
      return
    }
    if (step.value === 0) { await moveStep(1); return }
    if (!professionalFocusValues.includes(professionalFocus.value as ProfessionalFocus)) {
      fieldErrors.value.professional_focus = 'Оберіть напрям практики.'
      await moveStep(1)
      return
    }
    if (step.value === 1) { await moveStep(2); return }
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
    await auth.signup(
      email.value.trim(),
      password.value,
      uiV2.value ? undefined : passwordConfirm.value,
      ...uiV2.value ? [{ registration_contract_version: 2 as const, first_name: normalizeRegistrationName(firstName.value), professional_focus: professionalFocus.value as ProfessionalFocus }] as const : []
    )
    router.push('/cabinet')
  } catch (err) {
    if (uiV2.value && err instanceof RegistrationError) {
      fieldErrors.value = err.fields
      if (err.fields.first_name) await moveStep(0)
      else if (err.fields.professional_focus) await moveStep(1)
    }
    error.value = err instanceof Error ? err.message : 'Не вдалося зареєструватися'
  } finally {
    signupInFlight.value = false
  }
}

onMounted(() => {
  productAnalytics.capture('signup_started')
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

<style>
/* Page-only overrides: keep the original form DOM, state and v1 stylesheet. */

html[data-ui="v2"] .pc2-signup .pc2-account-types { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--pc-space-3); margin-bottom: var(--pc-space-6); }
html[data-ui="v2"] .pc2-signup .pc2-account-types__option { display: flex; flex-direction: column; gap: var(--pc-space-2); min-width: 0; padding: var(--pc-space-4) var(--pc-space-3); border: 1.5px solid var(--pc-border); border-radius: var(--pc-radius-md); background: var(--pc-bg-card); color: var(--pc-navy-900); font-family: var(--pc-font); font-weight: var(--pc-fw-medium); text-decoration: none; line-height: var(--pc-lh-body); }
html[data-ui="v2"] .pc2-signup .pc2-account-types__label { font-size: var(--pc-fs-ui); }
html[data-ui="v2"] .pc2-signup .pc2-account-types__description { color: var(--pc-text-body); font-size: var(--pc-fs-meta); font-weight: var(--pc-fw-regular); overflow-wrap: anywhere; }
html[data-ui="v2"] .pc2-signup .pc2-account-types__option[aria-current="page"] { border-color: var(--pc-navy-900); background: var(--pc-bg-soft); }
html[data-ui="v2"] .pc2-signup .pc2-account-types__option:hover { border-color: var(--pc-navy-900); background: var(--pc-bg-soft); color: var(--pc-navy-900); }
html[data-ui="v2"] .pc2-signup .pc2-account-types__option:focus-visible { outline: var(--pc-focus-width) solid var(--pc-navy-900); outline-offset: var(--pc-focus-offset); }

html[data-ui="v2"] .pc2-signup.auth { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--pc-space-12); align-items: start; background: var(--pc-bg-main); color: var(--pc-text-body); font-family: var(--pc-font); padding-block: var(--pc-space-12); }
html[data-ui="v2"] .pc2-signup .auth__card { width: 100%; max-width: calc(var(--pc-space-24) * 5); margin-inline: auto; padding: var(--pc-space-8); border: 1px solid var(--pc-border-hair); border-radius: var(--pc-radius-lg); background: var(--pc-bg-card); color: var(--pc-text-body); box-shadow: none; min-width: 0; }
html[data-ui="v2"] .pc2-signup .badge { display: inline-block; background: var(--pc-bg-soft); border: 0; color: var(--pc-text-muted); font: var(--pc-fw-medium) var(--pc-fs-micro)/var(--pc-lh-body) var(--pc-font); padding: var(--pc-space-1) var(--pc-space-3); border-radius: var(--pc-radius-pill); }
html[data-ui="v2"] .pc2-signup .auth__title { color: var(--pc-text-main); font-size: var(--pc-fs-h1); font-weight: var(--pc-fw-medium); line-height: var(--pc-lh-head); letter-spacing: var(--pc-ls-head); margin-block: var(--pc-space-5) var(--pc-space-4); }
html[data-ui="v2"] .pc2-signup .auth__subtitle { max-width: none; margin-block: 0 var(--pc-space-6); color: var(--pc-text-body); font-size: var(--pc-fs-body); line-height: var(--pc-lh-body); }
html[data-ui="v2"] .pc2-signup .form { display: grid; gap: var(--pc-space-5); }
html[data-ui="v2"] .pc2-signup .field { display: flex; flex-direction: column; gap: var(--pc-space-2); }
html[data-ui="v2"] .pc2-signup .field > span { color: var(--pc-text-main); font-size: var(--pc-fs-small); font-weight: var(--pc-fw-medium); }
html[data-ui="v2"] .pc2-signup .pc2-input { height: var(--pc-control-h-lg); min-height: var(--pc-control-h-lg); width: 100%; min-width: 0; padding: 0 var(--pc-space-4); background: var(--pc-bg-card); color: var(--pc-text-main); border: 1.5px solid var(--pc-border); border-radius: var(--pc-radius-sm); font: var(--pc-fw-regular) var(--pc-fs-body)/var(--pc-lh-body) var(--pc-font); box-shadow: none; }
html[data-ui="v2"] .pc2-signup .pc2-input:hover { border-color: var(--pc-border-strong); }
html[data-ui="v2"] .pc2-signup .pc2-input::placeholder { color: var(--pc-text-muted); opacity: 1; }
html[data-ui="v2"] .pc2-signup .pc2-input:focus { border-color: var(--pc-navy-900); box-shadow: var(--pc-ring); }
html[data-ui="v2"] .pc2-signup .password-input-wrap { position: relative; min-width: 0; }
html[data-ui="v2"] .pc2-signup .pc2-password .pc2-input { padding-right: var(--pc-space-24); }
html[data-ui="v2"] .pc2-signup .password-toggle { position: absolute; right: var(--pc-space-1); top: 50%; transform: translateY(-50%); min-height: var(--pc-control-h); height: var(--pc-control-h); padding: 0 var(--pc-space-3); background: transparent; border: 0; border-radius: var(--pc-radius-xs); color: var(--pc-navy-900); font: var(--pc-fw-medium) var(--pc-fs-meta)/var(--pc-lh-body) var(--pc-font); cursor: pointer; }
html[data-ui="v2"] .pc2-signup .password-toggle:hover { background: var(--pc-bg-soft); color: var(--pc-navy-950); }
html[data-ui="v2"] .pc2-signup .btn { min-height: var(--pc-control-h-lg); padding: var(--pc-space-4) var(--pc-space-6); width: 100%; border: 1px solid var(--pc-navy-900); border-radius: var(--pc-radius-pill); background: var(--pc-navy-900); color: var(--pc-bg-card); font: var(--pc-fw-medium) var(--pc-fs-body)/var(--pc-lh-head) var(--pc-font); box-shadow: none; white-space: normal; text-align: center; }
html[data-ui="v2"] .pc2-signup .btn:hover:not(:disabled) { background: var(--pc-navy-950); border-color: var(--pc-navy-950); }
html[data-ui="v2"] .pc2-signup .btn:active:not(:disabled) { background: var(--pc-navy-800); }
html[data-ui="v2"] .pc2-signup .btn:disabled { opacity: .45; cursor: default; }
html[data-ui="v2"] .pc2-signup .auth__field-helper,
html[data-ui="v2"] .pc2-signup .auth__reassurance,
html[data-ui="v2"] .pc2-signup .auth__footer,
html[data-ui="v2"] .pc2-signup .auth__legal { color: var(--pc-text-muted); font-size: var(--pc-fs-small); line-height: var(--pc-lh-body); margin: 0; }
html[data-ui="v2"] .pc2-signup .auth__legal { overflow-wrap: anywhere; }
html[data-ui="v2"] .pc2-signup a { color: var(--pc-navy-900); font-weight: var(--pc-fw-medium); text-decoration: underline; text-decoration-color: currentColor; text-underline-offset: var(--pc-space-1); }
html[data-ui="v2"] .pc2-signup a:hover { color: var(--pc-navy-950); }
html[data-ui="v2"] .pc2-signup .form-error { margin: 0; padding: var(--pc-space-3) var(--pc-space-4); border: 1px solid var(--pc-danger); border-radius: var(--pc-radius-sm); background: var(--pc-danger-soft); color: var(--pc-danger); font-size: var(--pc-fs-small); line-height: var(--pc-lh-body); overflow-wrap: anywhere; }
html[data-ui="v2"] .pc2-signup .auth__aside { display: flex; flex-direction: column; justify-content: flex-start; gap: var(--pc-space-5); min-width: 0; padding: 0; background: transparent; }
html[data-ui="v2"] .pc2-signup .aside-card { border: 1px solid var(--pc-border-hair); border-radius: var(--pc-radius-md); background: var(--pc-bg-card); color: var(--pc-text-body); padding: var(--pc-space-6); box-shadow: none; }
html[data-ui="v2"] .pc2-signup .aside-title { color: var(--pc-text-main); font: var(--pc-fw-medium) var(--pc-fs-h3)/var(--pc-lh-head) var(--pc-font); margin-bottom: var(--pc-space-4); }
html[data-ui="v2"] .pc2-signup .aside-list { display: grid; gap: var(--pc-space-3); color: var(--pc-text-body); padding-left: var(--pc-space-5); margin: 0; }
html[data-ui="v2"] .pc2-signup .aside-text { opacity: 1; color: var(--pc-text-body); line-height: var(--pc-lh-body); }
html[data-ui="v2"] .pc2-signup .aside-card--dark { background: var(--pc-navy-900); color: var(--pc-bg-card); border-color: var(--pc-navy-900); }
html[data-ui="v2"] .pc2-signup .aside-card--dark .aside-title,
html[data-ui="v2"] .pc2-signup .aside-card--dark .aside-text { color: var(--pc-bg-card); }
html[data-ui="v2"] .pc2-signup :focus-visible { outline: var(--pc-focus-width) solid var(--pc-navy-900); outline-offset: var(--pc-focus-offset); }
html[data-ui="v2"] .pc2-signup :is(input, button, a) { scroll-margin-top: var(--pc-header-anchor-offset); scroll-margin-bottom: var(--pc-space-6); }
@media (max-width: 900px) {
  html[data-ui="v2"] .pc2-signup.auth { grid-template-columns: minmax(0, 1fr); gap: var(--pc-space-6); padding-block: var(--pc-space-6); }
  html[data-ui="v2"] .pc2-signup .auth__card { max-width: calc(var(--pc-space-24) * 6); }
  html[data-ui="v2"] .pc2-signup .auth__aside { width: 100%; max-width: calc(var(--pc-space-24) * 6); margin-inline: auto; }
}
@media (max-width: 600px) {
  html[data-ui="v2"] .pc2-signup .auth__card { padding: var(--pc-space-5); }
}
@media (prefers-reduced-motion: reduce) {
  html[data-ui="v2"] .pc2-signup *,
  html[data-ui="v2"] .pc2-signup *::before,
  html[data-ui="v2"] .pc2-signup *::after { animation: none; transition: none; }
}

html[data-ui="v2"] .pc2-signup .pc2-steps { display: block; }
html[data-ui="v2"] .pc2-signup .pc2-steps ol { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--pc-space-2); list-style: none; padding: 0; margin: 0; font-size: var(--pc-fs-meta); }
html[data-ui="v2"] .pc2-signup .pc2-steps li { border-top: var(--pc-focus-width) solid var(--pc-border); padding-top: var(--pc-space-2); color: var(--pc-text-muted); }
html[data-ui="v2"] .pc2-signup .pc2-steps li[aria-current="step"],
html[data-ui="v2"] .pc2-signup .pc2-steps .pc2-steps__complete { border-color: var(--pc-navy-900); color: var(--pc-navy-900); }
html[data-ui="v2"] .pc2-signup .pc2-steps p,
html[data-ui="v2"] .pc2-signup .field small { color: var(--pc-text-muted); font-size: var(--pc-fs-meta); }
html[data-ui="v2"] .pc2-signup .pc2-practices { display: grid; gap: var(--pc-space-3); min-width: 0; padding: 0; margin: 0; border: 0; }
html[data-ui="v2"] .pc2-signup .pc2-practices legend { margin-bottom: var(--pc-space-3); font-size: var(--pc-fs-small); color: var(--pc-text-main); }
html[data-ui="v2"] .pc2-signup .pc2-practices__option { display: flex; align-items: center; gap: var(--pc-space-3); min-height: var(--pc-control-h-lg); padding: var(--pc-space-3); border: 1px solid var(--pc-border); border-radius: var(--pc-radius-sm); cursor: pointer; }
html[data-ui="v2"] .pc2-signup .pc2-practices__option:has(:checked) { background: var(--pc-bg-soft); border-color: var(--pc-navy-900); }
html[data-ui="v2"] .pc2-signup .pc2-practices__option input { accent-color: var(--pc-navy-900); }
html[data-ui="v2"] .pc2-signup .pc2-wizard-back { background: var(--pc-bg-card); color: var(--pc-navy-900); }
html[data-ui="v2"] .pc2-signup .pc2-wizard-back:hover:not(:disabled),
html[data-ui="v2"] .pc2-signup .pc2-wizard-back:active:not(:disabled) { background: var(--pc-bg-soft); color: var(--pc-navy-950); }
</style>
