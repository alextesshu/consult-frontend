import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

// Cabinet-Dashboard.dc.html motion: a 1s pulse/clock, reveal 50ms after data is ready and a 900ms
// easeOutCubic count-up for practice numbers. Reduced motion and hidden tabs stop every timer.
export function useDashboardMotion(options: { ready: () => boolean }) {
  const reduced = ref(false)
  const pulse = ref(true)
  const now = ref(Date.now())
  const revealed = ref(false)
  const progress = ref(0)
  let tick: number | undefined
  let revealTimer: number | undefined
  let frame: number | undefined
  let media: MediaQueryList | undefined

  function stopTick() {
    if (tick !== undefined) window.clearInterval(tick)
    tick = undefined
  }
  function startTick() {
    stopTick()
    now.value = Date.now()
    if (document.hidden) return
    tick = window.setInterval(() => {
      now.value = Date.now()
      if (!reduced.value) pulse.value = !pulse.value
    }, 1000)
  }
  function count() {
    if (frame !== undefined) cancelAnimationFrame(frame)
    frame = undefined
    if (reduced.value || typeof requestAnimationFrame !== 'function') { progress.value = 1; return }
    progress.value = 0
    let start: number | undefined
    const step = (t: number) => {
      start ??= t
      progress.value = Math.min(1, (t - start) / 900)
      frame = progress.value < 1 ? requestAnimationFrame(step) : undefined
    }
    frame = requestAnimationFrame(step)
  }
  function reveal() {
    if (revealTimer !== undefined) window.clearTimeout(revealTimer)
    if (!options.ready()) { revealed.value = false; return }
    if (reduced.value) { revealed.value = true; progress.value = 1; return }
    revealTimer = window.setTimeout(() => { revealed.value = true; count() }, 50)
  }
  function onPreference() {
    reduced.value = Boolean(media?.matches)
    if (reduced.value) { pulse.value = true; revealed.value = options.ready(); progress.value = 1 }
  }
  function onVisibility() {
    if (document.hidden) stopTick()
    else startTick()
  }
  watch(options.ready, reveal)
  onMounted(() => {
    media = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : undefined
    media?.addEventListener('change', onPreference)
    onPreference()
    document.addEventListener('visibilitychange', onVisibility)
    startTick()
    reveal()
  })
  onBeforeUnmount(() => {
    stopTick()
    if (revealTimer !== undefined) window.clearTimeout(revealTimer)
    if (frame !== undefined) cancelAnimationFrame(frame)
    media?.removeEventListener('change', onPreference)
    document.removeEventListener('visibilitychange', onVisibility)
  })
  return { reduced, pulse, now, revealed, progress, count }
}
