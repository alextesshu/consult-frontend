<template>
  <div
    v-if="open"
    class="completion-modal"
    tabindex="-1"
    @keydown.esc.prevent="emit('cancel')"
  >
    <div class="completion-modal__backdrop" @click="emit('cancel')"></div>
    <div
      class="completion-modal__content"
      role="dialog"
      aria-modal="true"
      aria-label="Завершення сесії"
    >
      <div class="completion-modal__header">
        <div>
          <h3 class="completion-modal__title">Завершити сесію</h3>
          <p class="muted completion-modal__subtitle">
            Зафіксуйте фактичну тривалість, щоб завершення було коректним.
          </p>
        </div>
        <button class="btn btn--ghost btn--sm" type="button" :disabled="loading" @click="emit('cancel')">
          Закрити
        </button>
      </div>

      <label class="field" for="completion-duration-input">
        <span>Фактична тривалість (хв)</span>
        <input
          id="completion-duration-input"
          ref="inputRef"
          :value="modelValue"
          data-testid="session-completion-duration-input"
          class="input"
          type="number"
          min="1"
          max="480"
          step="1"
          placeholder="Наприклад, 50"
          :disabled="loading"
          @input="onInput"
          @keydown.enter.prevent="emit('confirm')"
        />
      </label>

      <div class="completion-modal__quick-actions">
        <button
          v-if="plannedDurationMinutes"
          class="btn btn--ghost btn--sm"
          type="button"
          :disabled="loading"
          @click="emit('update:modelValue', String(plannedDurationMinutes))"
        >
          Підставити за планом ({{ plannedDurationMinutes }} хв)
        </button>
        <button
          class="btn btn--ghost btn--sm"
          type="button"
          :disabled="loading"
          @click="emit('update:modelValue', '')"
        >
          Залишити порожнім
        </button>
      </div>

      <div v-if="errorMessage" class="form-error" data-testid="session-completion-error">{{ errorMessage }}</div>

      <p class="muted completion-modal__hint">
        Якщо поле порожнє, буде використано стандартну тривалість сесії.
      </p>

      <div class="completion-modal__actions">
        <button
          class="btn btn--sm"
          data-testid="session-completion-submit"
          type="button"
          :disabled="loading"
          @click="emit('confirm')"
        >
          {{ loading ? 'Завершуємо...' : 'Підтвердити завершення' }}
        </button>
        <button class="btn btn--ghost btn--sm" type="button" :disabled="loading" @click="emit('cancel')">
          Скасувати
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

type Props = {
  open: boolean
  loading?: boolean
  modelValue: string
  plannedDurationMinutes?: number | null
  errorMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  plannedDurationMinutes: null,
  errorMessage: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)

function onInput(event: Event) {
  const target = event.target as HTMLInputElement | null
  emit('update:modelValue', target?.value || '')
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    await nextTick()
    inputRef.value?.focus()
    inputRef.value?.select()
  }
)
</script>

<style scoped>
.completion-modal {
  position: fixed;
  inset: 0;
  z-index: 65;
  display: grid;
  place-items: center;
}

.completion-modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(8, 18, 24, 0.4);
}

.completion-modal__content {
  position: relative;
  width: min(560px, 92vw);
  background: #fff;
  border-radius: var(--radius-lg);
  border: 1px solid var(--line);
  padding: 18px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
  display: grid;
  gap: 12px;
}

.completion-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.completion-modal__title {
  margin: 0;
  font-size: 22px;
}

.completion-modal__subtitle {
  margin-top: 4px;
}

.completion-modal__quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.completion-modal__hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
}

.completion-modal__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 640px) {
  .completion-modal__header {
    flex-direction: column;
  }

  .completion-modal__actions {
    justify-content: flex-start;
  }
}
</style>
