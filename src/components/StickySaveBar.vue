<template>
  <div class="sticky-save-bar" :class="{ 'sticky-save-bar--error': error }">
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
  border: 1px solid #e4d7c8;
  border-radius: var(--radius-md);
  background: rgba(253, 250, 246, 0.97);
  box-shadow: 0 12px 28px rgba(24, 32, 38, 0.12);
  backdrop-filter: blur(4px);
}

.sticky-save-bar--error {
  border-color: #f0c3bf;
}

.sticky-save-bar__message {
  font-size: 14px;
  font-weight: 600;
  color: #3f4a54;
}

.sticky-save-bar__message--error {
  color: #b3261e;
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
