import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

// Home.dc.html: four steps, 3.4s per step, manual selection stops autoplay.
export function useHomeMotion(active: () => boolean, root: Ref<HTMLElement | null>) {
  const index = ref(0)
  const automatic = ref(true)
  const reduced = ref(true)
  const hidden = ref(false)
  const seen = ref<Record<string, boolean>>({ band: true, value: true, blog: true })
  let mounted = false
  let initialized = false
  let media: MediaQueryList | undefined
  let observer: IntersectionObserver | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let remaining = 3400
  let deadline = 0
  const pausedAnimations = new Set<Animation>()

  function clearTimer() {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  }
  function arm() {
    if (!mounted || !active() || reduced.value || hidden.value || !automatic.value || timer !== undefined) return
    deadline = Date.now() + remaining
    timer = setTimeout(() => {
      timer = undefined
      index.value = (index.value + 1) % 4
      remaining = 3400
      arm()
    }, remaining)
  }
  function pause() { automatic.value = false; clearTimer() }
  function pick(next: number) {
    if (!Number.isInteger(next) || next < 0 || next > 3) return
    pause()
    index.value = next
  }
  function toggle() {
    automatic.value = !automatic.value
    remaining = 3400
    if (automatic.value) arm()
    else clearTimer()
  }
  function reveal() {
    observer?.disconnect()
    observer = undefined
    if (reduced.value || typeof IntersectionObserver === 'undefined') {
      seen.value = { band: true, value: true, blog: true }
      return
    }
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const key = (entry.target as HTMLElement).dataset.homeReveal!
        seen.value = { ...seen.value, [key]: true }
        observer?.unobserve(entry.target)
      }
    }, { threshold: 0.15 })
    root.value?.querySelectorAll<HTMLElement>('[data-home-reveal]').forEach(el => {
      if (!seen.value[el.dataset.homeReveal!]) observer?.observe(el)
    })
  }
  function visibility() {
    hidden.value = document.hidden
    if (hidden.value) {
      if (timer !== undefined) remaining = Math.max(0, deadline - Date.now())
      clearTimer()
      for (const animation of root.value?.getAnimations?.({ subtree: true }) ?? []) {
        if (animation.playState === 'running') { animation.pause(); pausedAnimations.add(animation) }
      }
    } else {
      for (const animation of pausedAnimations) if (animation.playState === 'paused') animation.play()
      pausedAnimations.clear()
      arm()
    }
  }
  function stop() {
    clearTimer()
    observer?.disconnect()
    observer = undefined
    for (const animation of pausedAnimations) animation.cancel()
    pausedAnimations.clear()
  }
  function preference() {
    reduced.value = media?.matches ?? true
    clearTimer()
    remaining = 3400
    if (!active()) { stop(); return }
    if (!initialized) {
      seen.value = { band: reduced.value, value: reduced.value, blog: reduced.value }
      initialized = true
    }
    if (reduced.value) {
      for (const animation of pausedAnimations) animation.cancel()
      pausedAnimations.clear()
    }
    reveal()
    arm()
  }
  onMounted(() => {
    mounted = true
    hidden.value = document.hidden
    media = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : undefined
    media?.addEventListener('change', preference)
    document.addEventListener('visibilitychange', visibility)
    if (active()) {
      const visible = media?.matches ?? true
      seen.value = { band: visible, value: visible, blog: visible }
      preference()
    }
  })
  watch(active, value => {
    if (!mounted) return
    if (!value) stop()
    else { preference(); visibility() }
  }, { flush: 'post' })
  onBeforeUnmount(() => {
    mounted = false
    stop()
    media?.removeEventListener('change', preference)
    document.removeEventListener('visibilitychange', visibility)
  })
  return { index, automatic, reduced, hidden, seen, pick, pause, toggle }
}
