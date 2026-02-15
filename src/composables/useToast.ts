import { useToastStore, type ToastType } from '../stores/toast'

type ToastPayload = {
  type: ToastType
  message: string
  title?: string
  duration?: number
}

export function useToast() {
  const store = useToastStore()

  function show(payload: ToastPayload) {
    return store.addToast({
      type: payload.type,
      message: payload.message,
      title: payload.title,
      duration: payload.duration ?? (payload.type === 'error' ? 8000 : 5000),
    })
  }

  return {
    show,
    success: (message: string, title?: string) => show({ type: 'success', message, title }),
    error: (message: string, title?: string) => show({ type: 'error', message, title }),
    warning: (message: string, title?: string) => show({ type: 'warning', message, title }),
    info: (message: string, title?: string) => show({ type: 'info', message, title }),
  }
}
