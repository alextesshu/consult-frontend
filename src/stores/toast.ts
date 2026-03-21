import { defineStore } from 'pinia'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export type ToastAction = {
  label: string
  to?: string
  href?: string
  target?: '_self' | '_blank'
}

export type ToastItem = {
  id: string
  type: ToastType
  message: string
  title?: string
  actions?: ToastAction[]
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
    addToast(payload: Omit<ToastItem, 'id' | 'createdAt' | 'duration'> & { duration?: number }) {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
      const toast: ToastItem = {
        id,
        createdAt: Date.now(),
        ...payload,
        duration: payload.duration ?? DEFAULT_DURATION,
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
