import { onBeforeUnmount, onMounted, ref } from 'vue'

export function useRegistrationViewport() {
  const compact = ref(false)
  let media: MediaQueryList | undefined
  const sync = () => { compact.value = media?.matches ?? false }
  onMounted(() => {
    media = window.matchMedia?.('(max-width: 767px)')
    sync()
    media?.addEventListener('change', sync)
  })
  onBeforeUnmount(() => media?.removeEventListener('change', sync))
  return compact
}
