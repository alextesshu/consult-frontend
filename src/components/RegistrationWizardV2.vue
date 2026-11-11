<template>
  <div class="auth__card pc2-registration-wizard">
    <slot name="account-types" />
    <form class="pc2-registration-form" :aria-busy="busy" @submit.prevent="$emit('next')">
      <header class="pc2-registration-progress">
        <button v-if="compact && step > 0" type="button" class="pc2-registration-back" aria-label="Назад" :disabled="busy" @click="$emit('back')">‹</button><span v-else aria-hidden="true"></span>
        <p role="status" aria-live="polite" aria-atomic="true">Крок {{ step + 1 }} з 3 · {{ labels[step] }}</p>
        <span aria-hidden="true"></span>
      </header>
      <ol class="pc2-registration-bars" aria-label="Прогрес реєстрації">
        <li v-for="(label, index) in labels" :key="label" :aria-current="index === step ? 'step' : undefined">
          <span class="pc2-registration-bar" :class="{ 'is-complete': index <= step }" aria-hidden="true"></span>
          <span class="pc2-registration-sr">{{ index + 1 }}. {{ label }}</span>
        </li>
      </ol>
      <div ref="stage" class="pc2-registration-stage" @focusin="onStageFocus">
        <h1 class="title auth__title">{{ titles[step] }}</h1>
        <p class="pc2-registration-subtitle">{{ subtitles[step] }}</p>
        <slot name="notice" />
        <label v-if="step === 0" class="pc2-registration-field">
          <span>Ім’я</span>
          <input :value="firstName" name="first_name" autocomplete="given-name" aria-required="true" :aria-invalid="!!fieldErrors.first_name" :aria-describedby="fieldErrors.first_name ? 'registration-name-error' : 'registration-name-help'" :disabled="busy" @input="$emit('update:firstName', ($event.target as HTMLInputElement).value)" />
          <small id="registration-name-help">Ваше ім’я для акаунта. Профіль не публікується автоматично.</small>
          <span v-if="fieldErrors.first_name" id="registration-name-error" class="pc2-registration-error" role="alert">{{ fieldErrors.first_name }}</span>
        </label>
        <fieldset v-if="role === 'specialist' && step === 1" class="pc2-registration-practices" :aria-describedby="fieldErrors.professional_focus ? 'registration-focus-error' : undefined">
          <legend>Напрям практики</legend>
          <div class="pc2-registration-chips">
            <label v-for="option in professionalFocusOptions" :key="option.value" class="pc2-registration-chip">
              <input :checked="professionalFocus === option.value" type="radio" name="professional_focus" :value="option.value" :aria-invalid="!!fieldErrors.professional_focus" :disabled="busy" @change="$emit('update:professionalFocus', option.value)" />
              <span>{{ option.label }}</span>
            </label>
          </div>
          <p v-if="fieldErrors.professional_focus" id="registration-focus-error" class="pc2-registration-error" role="alert">{{ fieldErrors.professional_focus }}</p>
        </fieldset>
        <label v-if="role === 'specialist' && step === 2 || role === 'client' && step === 1" class="pc2-registration-field">
          <span>Ел. пошта</span>
          <input :value="email" type="email" name="email" autocomplete="email" placeholder="name@example.com" aria-required="true" :aria-invalid="!!fieldErrors.email" :aria-describedby="fieldErrors.email ? 'registration-email-error' : undefined" :disabled="busy" @input="$emit('update:email', ($event.target as HTMLInputElement).value)" />
          <span v-if="fieldErrors.email" id="registration-email-error" class="pc2-registration-error" role="alert">{{ fieldErrors.email }}</span>
        </label>
        <label v-if="step === 2" class="pc2-registration-field">
          <span>Пароль</span>
          <div class="pc2-registration-password">
            <input :value="password" :type="showPassword ? 'text' : 'password'" name="password" autocomplete="new-password" aria-required="true" :aria-invalid="!!fieldErrors.password" :aria-describedby="fieldErrors.password ? 'registration-password-error' : undefined" :disabled="busy" @input="$emit('update:password', ($event.target as HTMLInputElement).value)" />
            <button type="button" :aria-label="showPassword ? 'Сховати пароль' : 'Показати пароль'" :aria-pressed="showPassword" :disabled="busy" @click="$emit('update:showPassword', !showPassword)">{{ showPassword ? 'Сховати' : 'Показати' }}</button>
          </div>
          <span v-if="fieldErrors.password" id="registration-password-error" class="pc2-registration-error" role="alert">{{ fieldErrors.password }}</span>
        </label>
        <p v-if="error" class="pc2-registration-error" role="alert" aria-atomic="true">{{ error }}</p>
        <p v-if="step === 2" class="pc2-registration-legal">Продовжуючи, ви погоджуєтеся з <RouterLink to="/terms">Умовами користування</RouterLink> та <RouterLink to="/privacy">Політикою конфіденційності</RouterLink>. Профіль не публікується автоматично.</p>
        <p class="pc2-registration-login">Вже маєте акаунт? <RouterLink to="/login">Увійти</RouterLink></p>
      </div>
      <footer class="pc2-registration-actions">
        <button class="pc2-registration-desktop-back" v-if="!compact && step > 0" type="button" :disabled="busy" @click="$emit('back')">Назад</button>
        <button class="pc2-registration-next" type="submit" :disabled="busy">{{ busy ? 'Створення акаунта...' : step < 2 ? 'Далі' : 'Створити акаунт' }}</button>
      </footer>
    </form>
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { professionalFocusOptions, type ProfessionalFocus } from '../constants/professionalFocus'
import type { RegistrationField } from '../lib/api'
import { useRegistrationViewport } from '../composables/useRegistrationViewport'
import '../styles/registrationP6.css'

const props = defineProps<{
  role: 'specialist' | 'client'; step: number; busy: boolean; firstName: string; email: string; password: string;
  professionalFocus?: ProfessionalFocus | ''; showPassword: boolean; error: string;
  fieldErrors: Partial<Record<RegistrationField, string>>;
}>()
defineEmits<{
  next: []; back: []; 'update:firstName': [value: string]; 'update:email': [value: string];
  'update:password': [value: string]; 'update:professionalFocus': [value: ProfessionalFocus]; 'update:showPassword': [value: boolean];
}>()
const labels = computed(() => props.role === 'specialist' ? ['Ім’я', 'Напрям', 'Акаунт'] : ['Ім’я', 'Пошта', 'Пароль'])
const compact = useRegistrationViewport()
const titles = computed(() => props.role === 'specialist' ? ['Як вас звати?', 'З чим ви працюєте?', 'Останній крок'] : ['Як вас звати?', 'Ваша електронна пошта', 'Створіть пароль'])
const subtitles = computed(() => props.role === 'specialist'
  ? ['Почнімо з імені для вашого акаунта.', 'Оберіть напрям — решту профілю заповните пізніше.', 'Пошта для входу та сповіщень про нові запити.']
  : ['Почнімо з імені для вашого акаунта.', 'Використовуйте адресу для входу та сповіщень.', 'Збережіть пароль для входу у свій акаунт.'])
const stage = ref<HTMLElement | null>(null)
let animations: Animation[] = []
let media: MediaQueryList | undefined
let disposed = false
let focusFrame = 0
const cancel = () => { animations.forEach(animation => animation.cancel()); animations = [] }
function animate() {
  cancel()
  if (media?.matches || !stage.value?.animate) return
  animations = [
    stage.value.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease' }),
    stage.value.animate([{ transform: 'translateY(8px)' }, { transform: 'translateY(0)' }], { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)' }),
  ]
}
async function focusStep() {
  await nextTick()
  if (disposed || props.busy) return
  const invalid = stage.value?.querySelector<HTMLInputElement>('input[aria-invalid="true"]')
  const field = invalid ?? stage.value?.querySelector<HTMLInputElement>('input:checked') ?? stage.value?.querySelector<HTMLInputElement>('input')
  field?.focus({ preventScroll: true })
  if (field) keepVisible(field)
}
function keepVisible(field: HTMLElement) {
  if (disposed || document.activeElement !== field) return
  const rect = field.getBoundingClientRect()
  if (!rect.height) return
  const footer = stage.value?.parentElement?.querySelector<HTMLElement>('.pc2-registration-actions')?.getBoundingClientRect()
  const top = Math.max(0, document.querySelector('header')?.getBoundingClientRect().bottom ?? 0) + 12
  const bottom = Math.min(window.innerHeight, footer?.top ?? window.innerHeight) - 12
  if (rect.bottom > bottom) window.scrollBy({ top: rect.bottom - bottom, behavior: 'instant' })
  else if (rect.top < top) window.scrollBy({ top: rect.top - top, behavior: 'instant' })
}
function onStageFocus(event: FocusEvent) {
  if (!(event.target instanceof HTMLElement)) return
  const field = event.target
  cancelAnimationFrame(focusFrame)
  focusFrame = requestAnimationFrame(() => keepVisible(field))
}
watch(() => props.step, () => { animate(); void focusStep() }, { flush: 'post' })
watch(() => props.fieldErrors, () => { if (Object.keys(props.fieldErrors).length) void focusStep() }, { flush: 'post' })
watch(() => props.error, error => { if (error) void focusStep() }, { flush: 'post' })
onMounted(() => { media = window.matchMedia?.('(prefers-reduced-motion: reduce)'); media?.addEventListener('change', cancel); animate() })
onBeforeUnmount(() => { disposed = true; cancelAnimationFrame(focusFrame); cancel(); media?.removeEventListener('change', cancel) })
</script>
