<template>
  <div
    class="sticky-save-bar"
    :class="{ 'sticky-save-bar--error': error }"
    :role="error ? 'alert' : 'status'"
    aria-live="polite"
  >
    <div class="sticky-save-bar__message" :class="{ 'sticky-save-bar__message--error': error }">
      {{ message }}
    </div>
    <div class="sticky-save-bar__actions">
      <button class="btn btn--ghost" type="button" :disabled="saving" @click="$emit('cancel')">
        {{ secondaryLabel }}
      </button>
      <button class="btn btn--primary" type="button" :disabled="saving" @click="$emit('save')">
        {{ saving ? savingLabel : primaryLabel }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

withDefaults(
  defineProps<{
    message: string
    saving?: boolean
    error?: boolean
    primaryLabel?: string
    secondaryLabel?: string
    savingLabel?: string
  }>(),
  {
    saving: false,
    error: false,
    primaryLabel: 'Зберегти',
    secondaryLabel: 'Скасувати',
    savingLabel: 'Збереження...',
  }
)

defineEmits<{
  save: []
  cancel: []
}>()

const bottomActionBarClass = 'has-bottom-action-bar'
const bottomActionBarCountKey = 'bottomActionBarCount'

onMounted(() => {
  const currentCount = Number(document.body.dataset[bottomActionBarCountKey] || 0)
  document.body.dataset[bottomActionBarCountKey] = String(currentCount + 1)
  document.body.classList.add(bottomActionBarClass)
})

onBeforeUnmount(() => {
  const currentCount = Number(document.body.dataset[bottomActionBarCountKey] || 0)
  const nextCount = Math.max(currentCount - 1, 0)

  if (nextCount > 0) {
    document.body.dataset[bottomActionBarCountKey] = String(nextCount)
    return
  }

  delete document.body.dataset[bottomActionBarCountKey]
  document.body.classList.remove(bottomActionBarClass)
})
</script>

<style scoped>
.sticky-save-bar {
  position: sticky;
  bottom: 14px;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, var(--pc-warning-border) 76%, var(--pc-border));
  border-top: 3px solid var(--pc-warning-border);
  border-radius: var(--radius-md);
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--pc-warning) 12%, transparent), transparent 32%),
    color-mix(in srgb, var(--pc-warning-soft) 92%, #ffffff);
  box-shadow: 0 18px 38px rgba(112, 66, 0, 0.18), 0 2px 0 rgba(255, 255, 255, 0.58) inset;
  backdrop-filter: blur(4px);
}

.sticky-save-bar--error {
  border-color: color-mix(in srgb, var(--pc-danger-border) 78%, var(--pc-border));
  border-top-color: var(--pc-danger-border);
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--pc-danger) 10%, transparent), transparent 32%),
    color-mix(in srgb, var(--pc-danger-soft) 92%, #ffffff);
  box-shadow: 0 18px 38px rgba(132, 32, 32, 0.18), 0 2px 0 rgba(255, 255, 255, 0.58) inset;
}

.sticky-save-bar__message {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-size: 14px;
  font-weight: 700;
  color: var(--pc-warning-text);
}

.sticky-save-bar__message::before {
  content: "";
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: var(--pc-warning);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--pc-warning) 17%, transparent);
  flex: 0 0 auto;
}

.sticky-save-bar__message--error {
  color: var(--pc-danger-text);
}

.sticky-save-bar__message--error::before {
  background: var(--pc-danger);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--pc-danger) 15%, transparent);
}

.sticky-save-bar__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.sticky-save-bar__actions .btn {
  flex-shrink: 0;
  white-space: nowrap;
}

@media (max-width: 980px) {
  .sticky-save-bar {
    bottom: 10px;
    flex-direction: column;
    align-items: stretch;
  }

  .sticky-save-bar__actions {
    width: 100%;
    justify-content: flex-end;
  }

  .sticky-save-bar__actions .btn {
    flex: 1 1 auto;
  }
}
</style>
