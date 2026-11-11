import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { forClientsDemos } from '../lib/forClientsDemos'

export type ClientDemoPhase = 'type' | 'listen' | 'show' | 'hide'

export function useForClientsMotion(options: {
  active: () => boolean
  root: Ref<HTMLElement | null>
  steps: Ref<HTMLElement | null>
  cabinet: Ref<HTMLElement | null>
}) {
  const index = ref(0)
  const count = ref(0)
  const phase = ref<ClientDemoPhase>('type')
  const automatic = ref(true)
  const manuallySelected = ref(false)
  const focused = ref(false)
  const reduced = ref(true)
  const paused = ref(false)
  const stepsSeen = ref(true)
  const cabinetSeen = ref(true)
  const demo = computed(() => forClientsDemos[index.value]!)
  const typed = computed(() => demo.value.query.slice(0, count.value))
  let mounted = false
  let media: MediaQueryList | undefined
  let observer: IntersectionObserver | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let deadline = 0
  let remaining = 0
  let continuation: (() => void) | undefined
  const pausedAnimations = new Set<Animation>()

  function clear() {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    continuation = undefined
    remaining = 0
  }

  function arm() {
    if (!continuation || paused.value || !mounted || !options.active() || reduced.value) return
    deadline = Date.now() + remaining
    timer = setTimeout(() => {
      timer = undefined
      const next = continuation
      continuation = undefined
      next?.()
    }, remaining)
  }

  function schedule(delay: number, next: () => void) {
    clear()
    remaining = delay
    continuation = next
    arm()
  }

  function run() {
    if (!mounted || !options.active() || reduced.value) return
    if (phase.value === 'type') {
      if (count.value < demo.value.query.length) {
        schedule(42 + Math.random() * 40, () => { count.value++; run() })
      } else {
        schedule(250, () => { phase.value = 'listen'; run() })
      }
    } else if (phase.value === 'listen') {
      schedule(900, () => { phase.value = 'show'; run() })
    } else if (phase.value === 'show' && automatic.value) {
      schedule(5200, () => { phase.value = 'hide'; run() })
    } else if (phase.value === 'hide') {
      schedule(450, () => {
        index.value = (index.value + 1) % forClientsDemos.length
        count.value = 0
        phase.value = 'type'
        run()
      })
    }
  }

  function pick(nextIndex: number) {
    if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex >= forClientsDemos.length) return
    clear()
    automatic.value = false
    manuallySelected.value = true
    index.value = nextIndex
    count.value = reduced.value ? demo.value.query.length : 0
    phase.value = reduced.value ? 'show' : 'type'
    run()
  }

  function focus() {
    clear()
    focused.value = true
    automatic.value = false
    count.value = demo.value.query.length
    phase.value = 'show'
  }

  function blur() { focused.value = false }

  function reveal() {
    observer?.disconnect()
    observer = undefined
    if (reduced.value || typeof IntersectionObserver === 'undefined') {
      stepsSeen.value = cabinetSeen.value = true
      return
    }
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        if (entry.target === options.steps.value) stepsSeen.value = true
        if (entry.target === options.cabinet.value) cabinetSeen.value = true
        observer?.unobserve(entry.target)
      }
    }, { threshold: 0.2 })
    if (!stepsSeen.value && options.steps.value) observer.observe(options.steps.value)
    if (!cabinetSeen.value && options.cabinet.value) observer.observe(options.cabinet.value)
  }

  function visibility() {
    const hidden = document.hidden
    paused.value = hidden
    if (hidden) {
      if (timer !== undefined) {
        remaining = Math.max(0, deadline - Date.now())
        clearTimeout(timer)
        timer = undefined
      }
      for (const animation of options.root.value?.getAnimations?.({ subtree: true }) ?? []) {
        if (animation.playState === 'running') {
          animation.pause()
          pausedAnimations.add(animation)
        }
      }
    } else {
      for (const animation of pausedAnimations) {
        if (animation.playState === 'paused') animation.play()
      }
      pausedAnimations.clear()
      if (timer === undefined) arm()
    }
  }

  function preference() {
    reduced.value = media?.matches ?? true
    clear()
    if (!options.active()) { stop(); return }
    if (reduced.value) {
      phase.value = 'show'
      count.value = demo.value.query.length
      for (const animation of pausedAnimations) animation.cancel()
      pausedAnimations.clear()
    }
    reveal()
    if (!reduced.value) run()
  }

  function stop() {
    clear()
    observer?.disconnect()
    observer = undefined
    for (const animation of pausedAnimations) animation.cancel()
    pausedAnimations.clear()
  }

  onMounted(() => {
    mounted = true
    paused.value = document.hidden
    media = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : undefined
    media?.addEventListener('change', preference)
    document.addEventListener('visibilitychange', visibility)
    if (options.active()) {
      reduced.value = media?.matches ?? true
      stepsSeen.value = cabinetSeen.value = reduced.value
      preference()
    }
  })
  watch(options.active, (active) => {
    if (!mounted) return
    if (!active) stop()
    else { preference(); visibility() }
  }, { flush: 'post' })
  onBeforeUnmount(() => {
    mounted = false
    stop()
    media?.removeEventListener('change', preference)
    document.removeEventListener('visibilitychange', visibility)
  })

  return { index, count, phase, automatic, manuallySelected, focused, reduced, paused,
    stepsSeen, cabinetSeen, demo, typed, pick, focus, blur }
}
