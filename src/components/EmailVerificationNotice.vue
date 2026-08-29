<template>
  <aside v-if="isUnverified" class="email-verification-notice" role="status" aria-live="polite">
    <div>
      <strong>Підтвердьте email</strong>
      <p>{{ noticeText }}</p>
    </div>
    <div class="email-verification-notice__actions">
      <button class="btn btn--sm" type="button" :disabled="!verification.canResend.value" @click="verification.resend">
        {{ resendLabel }}
      </button>
      <RouterLink class="btn btn--ghost btn--sm" :to="settingsPath">Змінити email</RouterLink>
    </div>
    <p v-if="verification.state.success" class="email-verification-notice__success">{{ verification.state.success }}</p>
    <p v-if="verification.state.error" class="form-error">{{ verification.state.error }}</p>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useAccountEmailVerification } from '../composables/useAccountEmailVerification'
import { hasSpecialistRole, normalizeUserRoles } from '../lib/entitlementReconcile'

const auth = useAuthStore()
const verification = useAccountEmailVerification()
const user = computed(() => auth.me?.user ?? auth.user)
const isUnverified = computed(() => user.value?.email_verification_state === 'unverified')
const isSpecialist = computed(() => hasSpecialistRole(normalizeUserRoles(user.value)))
const noticeText = computed(() =>
  isSpecialist.value
    ? 'Підтвердьте email, щоб опублікувати профіль і приймати звернення через Pro Consult.'
    : 'Підтвердьте email, щоб бронювати консультації через Pro Consult.'
)
const settingsPath = computed(() => (isSpecialist.value ? '/cabinet/settings' : '/client/settings'))
const resendLabel = computed(() => {
  if (verification.state.sending) return 'Надсилаємо...'
  if (verification.state.cooldownSeconds > 0) return `Ще раз через ${verification.state.cooldownSeconds} с`
  return 'Надіслати лист ще раз'
})
</script>

<style scoped>
.email-verification-notice { display: grid; gap: 10px; margin: 0 0 16px; padding: 14px 16px; border: 1px solid color-mix(in srgb, #d9a441 34%, var(--pc-border)); border-radius: var(--pc-radius-panel); background: color-mix(in srgb, #f4e2ae 18%, #ffffff); }
.email-verification-notice p { margin: 4px 0 0; line-height: 1.45; }
.email-verification-notice__actions { display: flex; flex-wrap: wrap; gap: 8px; }
.email-verification-notice__success { color: var(--pc-success-text); }
</style>
