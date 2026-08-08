<template>
  <section
    v-if="open"
    ref="panelRef"
    class="analytics-consent"
    aria-labelledby="analytics-consent-title"
    tabindex="-1"
  >
    <div class="analytics-consent__content">
      <p class="analytics-consent__eyebrow">Налаштування конфіденційності</p>
      <h2 id="analytics-consent-title">Файли cookie та аналітика</h2>
      <p>
        Ми використовуємо необхідні технології для роботи Pro Consult. За вашим дозволом можемо також збирати
        обмежену статистику використання, щоб покращувати сервіс.
      </p>
      <p class="analytics-consent__reassurance">Ми не передаємо в аналітику чутливі дані або інформацію, яку ви вводите у Pro Consult.</p>
      <p v-if="preference !== 'unknown'" class="analytics-consent__current" aria-live="polite">
        Поточний вибір аналітики: {{ preference === 'allowed' ? 'дозволено' : 'вимкнено' }}.
      </p>
      <p v-if="error" class="analytics-consent__error" role="alert">{{ error }}</p>
      <div class="analytics-consent__actions">
        <button class="btn btn--ghost analytics-consent__action" type="button" @click="emit('select', 'denied')">
          Лише необхідні
        </button>
        <button class="btn btn--primary analytics-consent__action analytics-consent__action--primary" type="button" @click="emit('select', 'allowed')">
          Дозволити аналітику
        </button>
      </div>
      <RouterLink class="analytics-consent__privacy-link" to="/privacy" @click="emit('close')">
        Налаштування конфіденційності
      </RouterLink>
    </div>
    <button
      v-if="preference !== 'unknown'"
      class="analytics-consent__close"
      type="button"
      aria-label="Закрити налаштування аналітики"
      @click="emit('close')"
    >
      Закрити
    </button>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import type { AnalyticsConsentPreference } from '../lib/analyticsConsent'

const props = defineProps<{
  open: boolean
  preference: AnalyticsConsentPreference
  error: string
}>()

const emit = defineEmits<{
  select: [preference: Exclude<AnalyticsConsentPreference, 'unknown'>]
  close: []
}>()

const panelRef = ref<HTMLElement | null>(null)

async function focusPanel() {
  await nextTick()
  panelRef.value?.focus()
}

onMounted(() => {
  if (props.open) void focusPanel()
})

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    await focusPanel()
  }
)
</script>

<style scoped>
.analytics-consent {
  position: fixed;
  z-index: 60;
  right: max(16px, env(safe-area-inset-right));
  bottom: max(16px, env(safe-area-inset-bottom));
  left: max(16px, env(safe-area-inset-left));
  width: min(440px, calc(100vw - 32px));
  margin-left: auto;
  max-block-size: calc(100dvh - 32px);
  overflow-y: auto;
  padding: 20px;
  border: 1px solid var(--pc-border, #e6e0d8);
  border-radius: var(--radius-lg, 16px);
  background: var(--pc-bg-card, #ffffff);
  box-shadow: var(--shadow-2, 0 12px 30px rgb(17 64 54 / 14%));
  color: var(--pc-text-main, #12233a);
}

.analytics-consent:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--pc-primary, #12345a) 42%, white);
  outline-offset: 3px;
}

.analytics-consent__content {
  min-width: 0;
  padding-right: 44px;
}

.analytics-consent__eyebrow,
.analytics-consent__current,
.analytics-consent__error,
.analytics-consent__reassurance {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
}

.analytics-consent__eyebrow {
  color: var(--pc-text-muted, #657287);
  font-size: 12px;
  font-weight: 700;
}

.analytics-consent h2 {
  margin: 3px 0 10px;
  color: var(--pc-navy-950, #0e2d52);
  font-size: 18px;
  line-height: 1.25;
}

.analytics-consent p:not(.analytics-consent__eyebrow) {
  margin-top: 7px;
}

.analytics-consent__current {
  color: var(--pc-text-muted, #657287);
  font-size: 13px;
}

.analytics-consent__error {
  color: var(--danger, #a33535);
  font-weight: 600;
}

.analytics-consent__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.analytics-consent__action {
  min-width: 0;
  flex: 1 1 170px;
  font-size: 13px;
}

.analytics-consent__action.btn--ghost {
  border-color: var(--pc-border-strong, #d4ccc2);
  color: var(--pc-navy-900, #12345a);
}

.analytics-consent__action.btn--ghost:hover {
  background: var(--pc-blue-soft, #eef4fa);
  border-color: var(--pc-navy-800, #183e68);
}

.analytics-consent__action--primary {
  border-color: var(--pc-primary, #12345a);
}

.analytics-consent__privacy-link {
  display: inline-block;
  margin-top: 12px;
  color: var(--pc-primary, #12345a);
  font-size: 12px;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.analytics-consent__close {
  position: absolute;
  top: 14px;
  right: 16px;
  border: 0;
  padding: 4px;
  background: transparent;
  color: var(--pc-text-muted, #657287);
  cursor: pointer;
  font: inherit;
  text-decoration: underline;
  text-underline-offset: 3px;
}

@media (max-width: 480px) {
  .analytics-consent {
    right: max(10px, env(safe-area-inset-right));
    bottom: max(10px, env(safe-area-inset-bottom));
    left: max(10px, env(safe-area-inset-left));
    width: calc(100vw - 20px);
    max-block-size: calc(100dvh - 20px);
    padding: 17px;
  }

  .analytics-consent__actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }

  .analytics-consent__action {
    width: 100%;
    flex-basis: auto;
  }
}
</style>
