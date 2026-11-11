import { nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

export const discoveryPlaceholders = [
  'Наприклад: не можу впоратися з тривогою',
  'Наприклад: постійно сваримося з партнером',
  'Наприклад: втратила сенс у роботі',
  'Наприклад: важко після переїзду',
] as const

// Presentation only. Never submits, mutates a query, or delays an API response.
export function useDiscoveryMotion(options: {
  active: () => boolean
  query: () => string
  loading: () => boolean
  root: Ref<HTMLElement | null>
}) {
  const placeholderIndex = ref(0)
  const placeholderShown = ref(true)
  const focused = ref(false)
  const reduced = ref(true)
  const hidden = ref(false)
  const cardsReady = ref(true)
  let mounted = false
  let media: MediaQueryList | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let frame: number | undefined
  let revealGeneration = 0
  let remaining = 3200
  let deadline = 0
  let continuation: (() => void) | undefined
  const pausedAnimations = new Set<Animation>()

  function clearTimer() {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  }
  function cancelFrame() {
    revealGeneration++
    if (frame !== undefined) cancelAnimationFrame(frame)
    frame = undefined
  }
  function arm() {
    if (!mounted || !options.active() || reduced.value || hidden.value || focused.value || options.query() || !continuation) return
    deadline = Date.now() + remaining
    timer = setTimeout(() => { timer = undefined; const next = continuation; continuation = undefined; next?.() }, remaining)
  }
  function schedule(delay: number, next: () => void) {
    clearTimer(); remaining = delay; continuation = next; arm()
  }
  function rotate() {
    schedule(3200, () => {
      placeholderShown.value = false
      schedule(400, () => {
        placeholderIndex.value = (placeholderIndex.value + 1) % discoveryPlaceholders.length
        placeholderShown.value = true
        // Original interval ticks every 3200ms, including the 400ms transition.
        schedule(2800, hideNext)
      })
    })
  }
  function hideNext() {
    placeholderShown.value = false
    schedule(400, () => {
      placeholderIndex.value = (placeholderIndex.value + 1) % discoveryPlaceholders.length
      placeholderShown.value = true
      schedule(2800, hideNext)
    })
  }
  function inputState() {
    clearTimer(); continuation = undefined; placeholderShown.value = true
    if (!focused.value && !options.query()) rotate()
  }
  function focus() { focused.value = true; inputState() }
  function blur() { focused.value = false; inputState() }
  async function revealCards() {
    cancelFrame()
    const generation = revealGeneration
    if (!options.active() || reduced.value || hidden.value) { cardsReady.value = true; return }
    cardsReady.value = false
    if (options.loading()) return
    await nextTick()
    if (generation !== revealGeneration) return
    if (!mounted || !options.active() || reduced.value || hidden.value || options.loading()) { cardsReady.value = true; return }
    frame = requestAnimationFrame(() => {
      if (generation !== revealGeneration || !mounted) return
      frame = requestAnimationFrame(() => {
        if (generation !== revealGeneration || !mounted) return
        frame = undefined; cardsReady.value = true
      })
    })
  }
  function visibility() {
    hidden.value = document.hidden
    if (hidden.value) {
      if (timer !== undefined) remaining = Math.max(0, deadline - Date.now())
      clearTimer(); cancelFrame(); cardsReady.value = true
      for (const animation of options.root.value?.getAnimations?.({ subtree: true }) ?? []) {
        if (animation.playState === 'running') { animation.pause(); pausedAnimations.add(animation) }
      }
    } else {
      for (const animation of pausedAnimations) if (animation.playState === 'paused') animation.play()
      pausedAnimations.clear(); arm()
    }
  }
  function stop() {
    clearTimer(); continuation = undefined; cancelFrame(); cardsReady.value = true
    for (const animation of pausedAnimations) animation.cancel()
    pausedAnimations.clear()
  }
  function preference() {
    stop(); reduced.value = media?.matches ?? true
    placeholderShown.value = true
    if (options.active() && !reduced.value) { inputState(); void revealCards() }
  }
  onMounted(() => {
    mounted = true; hidden.value = document.hidden
    media = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : undefined
    media?.addEventListener('change', preference)
    document.addEventListener('visibilitychange', visibility)
    preference()
  })
  watch(options.query, inputState)
  watch(options.loading, () => { if (mounted) void revealCards() }, { flush: 'post' })
  watch(options.active, active => {
    if (!mounted) return
    if (active) preference()
    else { focused.value = false; stop() }
  }, { flush: 'post' })
  onBeforeUnmount(() => {
    mounted = false; stop()
    media?.removeEventListener('change', preference)
    document.removeEventListener('visibilitychange', visibility)
  })
  return { placeholderIndex, placeholderShown, focused, reduced, hidden, cardsReady, focus, blur }
}
