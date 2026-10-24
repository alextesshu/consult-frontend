import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

// Own only profile presentation timing; business requests never depend on motion.
export function useProfileMotion(enabled: Ref<boolean>) {
  const reduced = ref(true)
  const highlighted = ref(false)
  let media: MediaQueryList | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let remaining = 0
  let started = 0
  let pending: (() => void) | undefined
  function cancel() {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    pending = undefined
    remaining = 0
  }
  function resume() {
    if (!pending || document.hidden) return
    started = performance.now()
    timer = setTimeout(() => { const fn = pending; cancel(); fn?.() }, remaining)
  }
  function schedule(fn: () => void, delay: number) {
    cancel()
    if (reduced.value || !enabled.value) { fn(); return }
    pending = fn
    remaining = delay
    resume()
  }
  function preference() {
    reduced.value = media?.matches ?? true
    if (reduced.value) { const fn = pending; cancel(); fn?.(); highlighted.value = false }
  }
  function visibility() {
    if (document.hidden && timer !== undefined) {
      clearTimeout(timer); timer = undefined
      remaining = Math.max(0, remaining - (performance.now() - started))
    } else if (!document.hidden && timer === undefined) resume()
  }
  function highlight() {
    if (!enabled.value || reduced.value) return
    highlighted.value = true
    schedule(() => { highlighted.value = false }, 1400)
  }
  watch(enabled, value => { if (!value) { cancel(); highlighted.value = false } })
  onMounted(() => {
    media = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    preference()
    media?.addEventListener('change', preference)
    document.addEventListener('visibilitychange', visibility)
  })
  onBeforeUnmount(() => {
    cancel()
    media?.removeEventListener('change', preference)
    document.removeEventListener('visibilitychange', visibility)
  })
  return { reduced, highlighted, highlight, schedule, cancel }
}
