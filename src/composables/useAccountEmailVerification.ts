import { computed, reactive } from 'vue'
import { getApiErrorMessage, resendAccountEmailVerification } from '../lib/api'

const RESEND_COOLDOWN_SECONDS = 60
let cooldownTimer: number | null = null

const state = reactive({
  sending: false,
  cooldownSeconds: 0,
  success: '',
  error: '',
})

function stopCooldownTimer() {
  if (cooldownTimer !== null) {
    window.clearInterval(cooldownTimer)
    cooldownTimer = null
  }
}

function beginCooldown(seconds: number) {
  stopCooldownTimer()
  state.cooldownSeconds = Math.max(0, Math.ceil(seconds))
  if (!state.cooldownSeconds) return
  cooldownTimer = window.setInterval(() => {
    state.cooldownSeconds = Math.max(0, state.cooldownSeconds - 1)
    if (!state.cooldownSeconds) stopCooldownTimer()
  }, 1000)
}

function retryAfterSeconds(error: unknown): number | null {
  const raw = (error as { response?: { data?: { retry_after_seconds?: unknown } } })?.response?.data
    ?.retry_after_seconds
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? Math.ceil(value) : null
}

export function useAccountEmailVerification() {
  const canResend = computed(() => !state.sending && state.cooldownSeconds === 0)

  async function resend() {
    if (!canResend.value) return false
    state.sending = true
    state.success = ''
    state.error = ''
    try {
      await resendAccountEmailVerification()
      state.success = 'Лист надіслано. Перевірте пошту.'
      beginCooldown(RESEND_COOLDOWN_SECONDS)
      return true
    } catch (error) {
      const retryAfter = retryAfterSeconds(error)
      if (retryAfter) beginCooldown(retryAfter)
      state.error = getApiErrorMessage(error, 'Не вдалося надіслати лист. Спробуйте ще раз пізніше.')
      return false
    } finally {
      state.sending = false
    }
  }

  return { state, canResend, resend }
}

export function resetAccountEmailVerificationForTests() {
  stopCooldownTimer()
  state.sending = false
  state.cooldownSeconds = 0
  state.success = ''
  state.error = ''
}
