import { onScopeDispose, ref, watch, type Ref } from 'vue'

/** One local timer: exact session boundaries plus minute labels; never polls an API. */
export function useCalendarClock(boundaries: Ref<number[]>, clock: () => number = Date.now) {
  const now = ref(clock())
  let timer: ReturnType<typeof setTimeout> | undefined
  function schedule() {
    clearTimeout(timer)
    const current = clock()
    const next = Math.min(current + 60_000, ...boundaries.value.filter((time) => Number.isFinite(time) && time > current))
    timer = setTimeout(tick, Math.max(1, next - current))
  }
  function tick() {
    now.value = clock()
    schedule()
  }
  const stop = watch(boundaries, schedule, { immediate: true })
  function visible() {
    if (document.visibilityState === 'visible') tick()
  }
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', visible)
  onScopeDispose(() => {
    clearTimeout(timer)
    stop()
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', visible)
  })
  return now
}
