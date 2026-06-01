<template>
  <div v-if="open" class="quick-add-modal" @keydown.esc="emit('cancel')">
    <div class="quick-add-modal__backdrop" @click="emit('cancel')"></div>
    <section class="quick-add-modal__content panel" role="dialog" aria-modal="true" aria-label="Додати задачу">
      <div class="quick-add-modal__header">
        <h3 class="quick-add-modal__title">Додати задачу</h3>
        <p class="muted quick-add-modal__subtitle">{{ subtitle }}</p>
      </div>

      <label class="field">
        <span>Назва задачі</span>
        <input
          ref="inputRef"
          v-model="titleDraft"
          class="input"
          type="text"
          maxlength="255"
          :placeholder="placeholder"
          @keydown.enter.prevent="submit"
        />
      </label>

      <div v-if="fieldError || error" class="form-error">{{ fieldError || error }}</div>

      <div class="quick-add-modal__actions">
        <button class="btn btn--sm" type="button" :disabled="pending" @click="submit">
          {{ pending ? 'Додаємо…' : 'Додати' }}
        </button>
        <button class="btn btn--ghost btn--sm" type="button" :disabled="pending" @click="emit('cancel')">
          Скасувати
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    pending?: boolean
    error?: string
    subtitle?: string
    placeholder?: string
  }>(),
  {
    pending: false,
    error: '',
    subtitle: '',
    placeholder: 'Наприклад, "Підготувати презентацію для клієнта"',
  }
)

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'submit', title: string): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const titleDraft = ref('')
const fieldError = ref('')

function resetForm() {
  titleDraft.value = ''
  fieldError.value = ''
}

function submit() {
  const normalized = titleDraft.value.trim()
  if (!normalized) {
    fieldError.value = 'Вкажіть назву задачі.'
    return
  }
  fieldError.value = ''
  emit('submit', normalized)
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) {
      resetForm()
      return
    }
    fieldError.value = ''
    await nextTick()
    inputRef.value?.focus()
  }
)

watch(
  () => props.error,
  () => {
    fieldError.value = ''
  }
)
</script>

<style scoped>
.quick-add-modal {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: grid;
  place-items: center;
  padding: 16px;
}

.quick-add-modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(7, 47, 71, 0.28);
}

.quick-add-modal__content {
  position: relative;
  width: min(520px, 100%);
  display: grid;
  gap: 12px;
}

.quick-add-modal__header {
  display: grid;
  gap: 4px;
}

.quick-add-modal__title {
  margin: 0;
  font-size: 20px;
}

.quick-add-modal__subtitle {
  margin: 0;
  font-size: 13px;
}

.quick-add-modal__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: var(--radius-sm);
  padding: 8px 10px;
}
</style>
