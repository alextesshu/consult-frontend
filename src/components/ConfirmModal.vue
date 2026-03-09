<template>
  <div
    v-if="open"
    class="confirm-modal"
    :class="toneClass"
    tabindex="-1"
    @keydown.esc.prevent="emit('cancel')"
  >
    <div class="confirm-modal__backdrop" @click="emit('cancel')"></div>
    <div
      ref="contentRef"
      class="confirm-modal__content"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
      @keydown="onKeydown"
    >
      <div class="confirm-modal__header">
        <div class="confirm-modal__title-wrap">
          <span v-if="tone === 'danger'" class="confirm-modal__danger-badge" aria-hidden="true">!</span>
          <h3 class="confirm-modal__title">{{ title }}</h3>
        </div>
        <button class="btn btn--ghost btn--sm" type="button" @click="emit('cancel')">
          Закрити
        </button>
      </div>
      <div v-if="message" class="confirm-modal__body">
        <p class="muted">{{ message }}</p>
      </div>
      <div class="confirm-modal__footer">
        <button
          ref="confirmBtnRef"
          class="btn confirm-modal__confirm"
          :class="confirmButtonClass"
          type="button"
          @click="emit('confirm')"
        >
          {{ confirmText }}
        </button>
        <button class="btn btn--ghost" type="button" @click="emit('cancel')">
          {{ cancelText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
type Props = {
  open: boolean
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  tone?: 'neutral' | 'danger'
}

const props = withDefaults(defineProps<Props>(), {
  message: '',
  confirmText: 'Підтвердити',
  cancelText: 'Скасувати',
  tone: 'neutral',
})

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const toneClass = computed(() => (props.tone === 'danger' ? 'confirm-modal--danger' : ''))
const confirmButtonClass = computed(() => (props.tone === 'danger' ? 'btn--danger' : ''))
const contentRef = ref<HTMLElement | null>(null)
const confirmBtnRef = ref<HTMLButtonElement | null>(null)

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function getFocusableElements() {
  if (!contentRef.value) return []
  return Array.from(contentRef.value.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
  )
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Tab') return
  const focusable = getFocusableElements()
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (!first || !last) return
  const active = document.activeElement as HTMLElement | null
  if (event.shiftKey && active === first) {
    event.preventDefault()
    last.focus()
    return
  }
  if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    await nextTick()
    const focusable = getFocusableElements()
    if (focusable[0]) {
      focusable[0].focus()
      return
    }
    confirmBtnRef.value?.focus()
  }
)
</script>

<style scoped>
.confirm-modal {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: grid;
  place-items: center;
}

.confirm-modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(7, 24, 33, 0.45);
}

.confirm-modal__content {
  position: relative;
  z-index: 1;
  width: min(560px, 92vw);
  background: #fff;
  border-radius: 16px;
  border: 1px solid var(--line);
  padding: 20px;
  display: grid;
  gap: 16px;
  box-shadow: 0 18px 40px rgba(15, 35, 48, 0.2);
}

.confirm-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.confirm-modal__title {
  margin: 0;
  font-size: 20px;
}

.confirm-modal__title-wrap {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.confirm-modal__danger-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  background: rgba(194, 75, 75, 0.12);
  color: #c24b4b;
  border: 1px solid rgba(194, 75, 75, 0.35);
}

.confirm-modal__body {
  display: grid;
  gap: 8px;
  font-size: 14px;
}

.confirm-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.confirm-modal__confirm {
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease;
}
</style>
