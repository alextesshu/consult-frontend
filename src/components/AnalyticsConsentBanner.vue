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
      <p>Ми не передаємо в аналітику чутливі дані або інформацію, яку ви вводите у профілі, формах, запитах чи консультаціях.</p>
      <p class="analytics-consent__hint">Аналітика не впливає на роботу Pro Consult. Свій вибір можна змінити будь-коли.</p>
      <div class="analytics-consent__categories">
        <div class="analytics-consent__category">
          <strong>Необхідні технології</strong>
          <span>Завжди активні для входу, безпеки та нормальної роботи сервісу.</span>
        </div>
        <div class="analytics-consent__category">
          <strong>Продуктова аналітика</strong>
          <span>Необов’язкова; працює лише після вашого дозволу.</span>
        </div>
      </div>
      <p v-if="preference !== 'unknown'" class="analytics-consent__current" aria-live="polite">
        Поточний вибір аналітики: {{ preference === 'allowed' ? 'дозволено' : 'вимкнено' }}.
      </p>
      <p v-if="error" class="analytics-consent__error" role="alert">{{ error }}</p>
      <div class="analytics-consent__actions">
        <button class="btn btn--ghost analytics-consent__action" type="button" @click="emit('select', 'denied')">
          Лише необхідні
        </button>
        <button class="btn btn--ghost analytics-consent__action" type="button" @click="emit('select', 'allowed')">
          Дозволити аналітику
        </button>
      </div>
      <RouterLink class="analytics-consent__privacy-link" to="/privacy" @click="emit('close')">
        Налаштування та детальніше
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
  display: flex;
  gap: 16px;
  width: min(620px, calc(100vw - 32px));
  margin-left: auto;
  padding: 18px;
  border: 1px solid color-mix(in srgb, var(--ink, #17324d) 22%, transparent);
  border-radius: 16px;
  background: var(--surface, #fffdf8);
  box-shadow: 0 16px 40px rgb(20 38 58 / 22%);
  color: var(--text, #17324d);
}

.analytics-consent:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--accent, #d9a441) 70%, white);
  outline-offset: 3px;
}

.analytics-consent__content {
  min-width: 0;
}

.analytics-consent__eyebrow,
.analytics-consent__hint,
.analytics-consent__current,
.analytics-consent__error {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.45;
}

.analytics-consent__categories {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.analytics-consent__category {
  display: grid;
  gap: 2px;
  padding: 9px 10px;
  border: 1px solid color-mix(in srgb, var(--ink, #17324d) 14%, transparent);
  border-radius: 10px;
  font-size: 0.88rem;
  line-height: 1.4;
}

.analytics-consent__category span {
  color: var(--muted, #5e6b76);
}

.analytics-consent__eyebrow {
  color: var(--muted, #5e6b76);
  font-weight: 700;
}

.analytics-consent h2 {
  margin: 4px 0 8px;
  font-size: 1.12rem;
}

.analytics-consent p:not(.analytics-consent__eyebrow) {
  margin-top: 8px;
}

.analytics-consent__hint,
.analytics-consent__current {
  color: var(--muted, #5e6b76);
}

.analytics-consent__error {
  color: var(--danger, #a33535);
  font-weight: 600;
}

.analytics-consent__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.analytics-consent__action {
  min-width: 152px;
  border-color: var(--ink, #17324d);
  color: var(--ink, #17324d);
}

.analytics-consent__action:hover,
.analytics-consent__action:focus-visible {
  background: color-mix(in srgb, var(--ink, #17324d) 8%, transparent);
}

.analytics-consent__privacy-link {
  display: inline-block;
  margin-top: 14px;
  color: inherit;
  font-size: 0.9rem;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.analytics-consent__close {
  flex: 0 0 auto;
  align-self: flex-start;
  border: 0;
  padding: 4px;
  background: transparent;
  color: inherit;
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
    gap: 10px;
    padding: 15px;
  }

  .analytics-consent__actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }

  .analytics-consent__action {
    width: 100%;
  }
}
</style>
