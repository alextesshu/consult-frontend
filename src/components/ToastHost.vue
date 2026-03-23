<template>
  <div class="toast-host">
    <div
      v-for="toast in items"
      :key="toast.id"
      class="toast"
      :class="`toast--${toast.type}`"
      @mouseenter="pauseTimer(toast.id)"
      @mouseleave="resumeTimer(toast.id)"
    >
      <div class="toast__content">
        <div v-if="toast.title" class="toast__title">{{ toast.title }}</div>
        <div class="toast__message">{{ toast.message }}</div>
        <div v-if="toast.actions?.length" class="toast__actions">
          <template v-for="action in toast.actions" :key="`${toast.id}-${action.label}`">
            <RouterLink
              v-if="action.to"
              class="toast__action btn btn--ghost btn--sm"
              :to="action.to"
              @click="close(toast.id)"
            >
              {{ action.label }}
            </RouterLink>
            <a
              v-else-if="action.href"
              class="toast__action btn btn--ghost btn--sm"
              :href="action.href"
              :target="action.target || '_self'"
              :rel="action.target === '_blank' ? 'noopener noreferrer' : undefined"
              @click="close(toast.id)"
            >
              {{ action.label }}
            </a>
          </template>
        </div>
      </div>
      <button class="toast__close" type="button" @click="close(toast.id)">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useToastStore } from '../stores/toast'

const store = useToastStore()
const { items } = storeToRefs(store)

const timers = new Map<string, number>()
const remaining = new Map<string, number>()
const startedAt = new Map<string, number>()

function startTimer(id: string, duration: number) {
  clearTimer(id)
  remaining.set(id, duration)
  startedAt.set(id, Date.now())
  const timeout = window.setTimeout(() => close(id), duration)
  timers.set(id, timeout)
}

function clearTimer(id: string) {
  const timeout = timers.get(id)
  if (timeout) {
    window.clearTimeout(timeout)
    timers.delete(id)
  }
}

function pauseTimer(id: string) {
  const start = startedAt.get(id)
  const left = remaining.get(id)
  if (!start || left === undefined) return
  const elapsed = Date.now() - start
  const next = Math.max(0, left - elapsed)
  remaining.set(id, next)
  clearTimer(id)
}

function resumeTimer(id: string) {
  const left = remaining.get(id)
  if (left === undefined) return
  startTimer(id, left)
}

function close(id: string) {
  clearTimer(id)
  remaining.delete(id)
  startedAt.delete(id)
  store.removeToast(id)
}

watch(
  items,
  (next) => {
    const activeIds = new Set(next.map((item) => item.id))
    next.forEach((toast) => {
      if (!timers.has(toast.id)) {
        startTimer(toast.id, toast.duration)
      }
    })
    Array.from(timers.keys()).forEach((id) => {
      if (!activeIds.has(id)) {
        close(id)
      }
    })
  },
  { deep: true }
)

onBeforeUnmount(() => {
  Array.from(timers.keys()).forEach((id) => clearTimer(id))
})
</script>

<style scoped>
.toast-host {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 2000;
  display: grid;
  gap: 10px;
  width: min(360px, 92vw);
}

.toast {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: #ffffff;
  color: #102536;
  box-shadow: var(--shadow);
  animation: toast-in 0.2s ease-out;
}

.toast__title {
  font-weight: 600;
  margin-bottom: 2px;
}

.toast__message {
  line-height: 1.4;
}

.toast__actions {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.toast__action {
  text-decoration: none;
}

.toast__close {
  border: none;
  background: transparent;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  color: inherit;
  padding: 0;
  opacity: 0.8;
}

.toast__close:hover {
  opacity: 1;
}

.toast--success {
  border-color: #b7e2c9;
  background: #e9f7ef;
  color: #0f5a35;
}

.toast--error {
  border-color: #f2b9b6;
  background: #fdeceb;
  color: #8f2d2d;
}

.toast--warning {
  border-color: #f4d6a3;
  background: #fff4df;
  color: #7a5200;
}

.toast--info {
  border-color: #b8d6f0;
  background: #e9f2fb;
  color: #124b77;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 860px) {
  .toast-host {
    bottom: 16px;
    right: 12px;
  }
}
</style>
