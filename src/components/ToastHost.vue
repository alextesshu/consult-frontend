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
  top: 20px;
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
  background: #fff;
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

.toast__close {
  border: none;
  background: transparent;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  color: inherit;
  padding: 0;
}

.toast--success {
  border-color: rgba(31, 122, 76, 0.25);
  background: rgba(31, 122, 76, 0.08);
  color: #1f7a4c;
}

.toast--error {
  border-color: rgba(194, 75, 75, 0.3);
  background: rgba(194, 75, 75, 0.12);
  color: #a03838;
}

.toast--warning {
  border-color: rgba(217, 164, 65, 0.3);
  background: rgba(217, 164, 65, 0.12);
  color: #a57011;
}

.toast--info {
  border-color: rgba(15, 85, 140, 0.3);
  background: rgba(15, 85, 140, 0.12);
  color: #0f558c;
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
    top: auto;
    bottom: 16px;
    right: 12px;
  }
}
</style>
