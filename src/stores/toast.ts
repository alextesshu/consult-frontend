import { defineStore } from 'pinia'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export type ToastItem = {
  id: string
  type: ToastType
  message: string
  title?: string
  duration: number
  createdAt: number
}

const MAX_TOASTS = 4
const DEFAULT_DURATION = 5000

export const useToastStore = defineStore('toast', {
  state: () => ({
    items: [] as ToastItem[],
  }),
  actions: {
    addToast(payload: Omit<ToastItem, 'id' | 'createdAt'>) {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
      const toast: ToastItem = {
        id,
        createdAt: Date.now(),
        duration: payload.duration ?? DEFAULT_DURATION,
        ...payload,
      }
      this.items = [toast, ...this.items].slice(0, MAX_TOASTS)
      return toast.id
    },
    removeToast(id: string) {
      this.items = this.items.filter((item) => item.id !== id)
    },
    clearAll() {
      this.items = []
    },
  },
})
