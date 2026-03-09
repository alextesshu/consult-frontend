import { reactive, ref } from 'vue'

type ConfirmTone = 'neutral' | 'danger'

type ConfirmOptions = {
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  tone?: ConfirmTone
  onConfirm?: () => void | Promise<void>
}

export function useConfirmModal() {
  const open = ref(false)
  const title = ref('')
  const message = ref('')
  const confirmText = ref('Підтвердити')
  const cancelText = ref('Скасувати')
  const tone = ref<ConfirmTone>('neutral')
  let confirmHandler: ConfirmOptions['onConfirm'] | null = null

  function openConfirm(options: ConfirmOptions) {
    title.value = options.title
    message.value = options.message || ''
    confirmText.value = options.confirmText || 'Підтвердити'
    cancelText.value = options.cancelText || 'Скасувати'
    tone.value = options.tone || 'neutral'
    confirmHandler = options.onConfirm || null
    open.value = true
  }

  function closeConfirm() {
    open.value = false
    confirmHandler = null
  }

  async function confirm() {
    const handler = confirmHandler
    closeConfirm()
    if (handler) {
      await handler()
    }
  }

  return reactive({
    open,
    title,
    message,
    confirmText,
    cancelText,
    tone,
    openConfirm,
    closeConfirm,
    confirm,
  })
}
