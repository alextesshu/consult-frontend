<template>
  <section class="verify-email">
    <div class="panel verify-email__panel">
      <h1 class="title">Підтвердження email</h1>
      <p v-if="state === 'confirming'" class="muted">Підтверджуємо email...</p>
      <template v-else-if="state === 'success'">
        <p class="verify-email__success">Адресу email успішно підтверджено.</p>
        <RouterLink v-if="isAuthenticated" class="btn" :to="returnDestination.path">{{ returnDestination.label }}</RouterLink>
        <RouterLink v-else class="btn" to="/login">Увійти</RouterLink>
      </template>
      <template v-else>
        <p class="form-error">{{ message }}</p>
        <RouterLink v-if="isAuthenticated" class="btn btn--ghost" :to="returnDestination.path">{{ returnDestination.label }}</RouterLink>
        <RouterLink v-else class="btn btn--ghost" to="/login">Увійти</RouterLink>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { confirmAccountEmailVerification } from '../lib/api'
import { takeEmailVerificationToken } from '../lib/emailVerificationToken'
import { useAuthStore } from '../stores/auth'
import { hasAdminRole, hasClientRole, hasSpecialistRole, normalizeUserRoles } from '../lib/entitlementReconcile'

type ConfirmationState = 'confirming' | 'success' | 'error'

const auth = useAuthStore()
const state = ref<ConfirmationState>('confirming')
const message = ref('')
const isAuthenticated = computed(() => Boolean(auth.accessToken))
const returnDestination = computed(() => {
  const roles = normalizeUserRoles(auth.me?.user ?? auth.user)
  if (hasAdminRole(roles)) {
    return { path: '/admin/inbox', label: 'Повернутися до адмін-панелі' }
  }
  if (hasSpecialistRole(roles)) {
    return { path: '/cabinet', label: 'Повернутися до кабінету' }
  }
  if (hasClientRole(roles)) {
    return { path: '/client', label: 'Повернутися до кабінету' }
  }
  return { path: '/', label: 'На головну' }
})

function errorMessage(error: unknown): string {
  const code = (error as { response?: { data?: { code?: unknown } } })?.response?.data?.code
  if (code === 'EXPIRED_EMAIL_VERIFICATION_TOKEN') return 'Термін дії посилання минув. Після входу можна запросити новий лист.'
  if (code === 'EMAIL_VERIFICATION_TOKEN_ALREADY_USED' || code === 'ALREADY_VERIFIED') return 'Email уже підтверджено або це посилання вже використано.'
  if (code === 'OBSOLETE_EMAIL_VERIFICATION_TOKEN') return 'Це посилання вже не відповідає поточному email акаунта.'
  if (code === 'EMAIL_VERIFICATION_ACCOUNT_UNAVAILABLE') return 'Акаунт недоступний для підтвердження email.'
  if (code === 'INVALID_EMAIL_VERIFICATION_TOKEN') return 'Посилання для підтвердження недійсне.'
  return 'Не вдалося підтвердити email. Спробуйте ще раз пізніше.'
}

onMounted(async () => {
  const token = takeEmailVerificationToken()
  if (!token) {
    state.value = 'error'
    message.value = 'У посиланні немає токена підтвердження.'
    return
  }
  try {
    await confirmAccountEmailVerification(token)
    state.value = 'success'
    if (auth.accessToken) {
      try {
        await auth.loadMe()
      } catch {
        // Confirmation is complete; a later authenticated request can reconcile identity.
      }
    }
  } catch (error) {
    state.value = 'error'
    message.value = errorMessage(error)
  }
})
</script>

<style scoped>
.verify-email { display: grid; place-items: center; min-height: min(560px, calc(100vh - 120px)); padding: 32px 0; }
.verify-email__panel { width: min(560px, 100%); display: grid; gap: 16px; }
.verify-email__panel .title, .verify-email__success { margin: 0; }
.verify-email__success { color: var(--pc-success-text); }
</style>
