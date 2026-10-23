import { cleanup, render } from '@testing-library/vue'
import { defineComponent, h, nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useForClientsMotion } from './useForClientsMotion'
import { forClientsDemos } from '../lib/forClientsDemos'

let hidden = false
let reduced = false
let mediaListeners: Set<() => void>
let callbacks: IntersectionObserverCallback[]
const disconnect = vi.fn()
const unobserve = vi.fn()

function mount(activeInitially = true) {
  const active = ref(activeInitially)
  let motion!: ReturnType<typeof useForClientsMotion>
  let steps!: HTMLElement
  let cabinet!: HTMLElement
  const view = render(defineComponent({ setup() {
    const root = ref<HTMLElement | null>(null)
    const stepsRef = ref<HTMLElement | null>(null)
    const cabinetRef = ref<HTMLElement | null>(null)
    motion = useForClientsMotion({ active: () => active.value, root, steps: stepsRef, cabinet: cabinetRef })
    return () => h('div', { ref: root }, [
      h('section', { ref: (el) => { stepsRef.value = steps = el as HTMLElement } }),
      h('section', { ref: (el) => { cabinetRef.value = cabinet = el as HTMLElement } }),
    ])
  } }))
  return { motion, active, steps, cabinet, root: view.container.firstElementChild as HTMLElement, unmount: view.unmount }
}

function visibility(value: boolean) {
  hidden = value
  document.dispatchEvent(new Event('visibilitychange'))
}

function preference(value: boolean) {
  reduced = value
  for (const listener of mediaListeners) listener()
}

function intersection(target: HTMLElement): IntersectionObserverEntry {
  return { target, isIntersecting: true, intersectionRatio: 1, rootBounds: null,
    boundingClientRect: target.getBoundingClientRect(), intersectionRect: target.getBoundingClientRect(), time: 0 }
}

describe('For Clients Claude motion lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    vi.spyOn(Math, 'random').mockReturnValue(0)
    hidden = reduced = false
    mediaListeners = new Set()
    callbacks = []
    disconnect.mockClear()
    unobserve.mockClear()
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden)
    vi.stubGlobal('matchMedia', () => ({
      get matches() { return reduced },
      addEventListener: (_event: string, listener: () => void) => mediaListeners.add(listener),
      removeEventListener: (_event: string, listener: () => void) => mediaListeners.delete(listener),
    }))
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit) {
        callbacks.push(callback)
        expect(options.threshold).toBe(0.2)
      }
      observe = vi.fn()
      unobserve = unobserve
      disconnect = disconnect
    })
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('runs every exact Claude phase and all five demos, then wraps to the first', () => {
    const { motion } = mount()
    for (let index = 0; index < 5; index++) {
      expect(motion.index.value).toBe(index)
      expect(motion.phase.value).toBe('type')
      expect(motion.typed.value).toBe('')
      vi.advanceTimersByTime(forClientsDemos[index]!.query.length * 42)
      expect(motion.typed.value).toBe(forClientsDemos[index]!.query)
      vi.advanceTimersByTime(249)
      expect(motion.phase.value).toBe('type')
      vi.advanceTimersByTime(1)
      expect(motion.phase.value).toBe('listen')
      vi.advanceTimersByTime(899)
      expect(motion.phase.value).toBe('listen')
      vi.advanceTimersByTime(1)
      expect(motion.phase.value).toBe('show')
      vi.advanceTimersByTime(5199)
      expect(motion.phase.value).toBe('show')
      vi.advanceTimersByTime(1)
      expect(motion.phase.value).toBe('hide')
      vi.advanceTimersByTime(449)
      expect(motion.phase.value).toBe('hide')
      vi.advanceTimersByTime(1)
    }
    expect(motion.index.value).toBe(0)
    expect(vi.getTimerCount()).toBe(1)
  })

  it.each([0, 0.5, 1])('uses the source randomized 42–82ms typing cadence (random %s)', (random) => {
    vi.mocked(Math.random).mockReturnValue(random)
    const { motion } = mount()
    vi.advanceTimersByTime(41 + random * 40)
    expect(motion.count.value).toBe(0)
    vi.advanceTimersByTime(1)
    expect(motion.count.value).toBe(1)
  })

  it.each([0, 1, 2, 3, 4])('manual choice %s completes typing/listening and holds indefinitely', (index) => {
    const { motion } = mount()
    vi.advanceTimersByTime(100)
    motion.pick(index)
    expect(motion.automatic.value).toBe(false)
    expect(motion.manuallySelected.value).toBe(true)
    vi.advanceTimersByTime(forClientsDemos[index]!.query.length * 42 + 1150)
    expect(motion.phase.value).toBe('show')
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(600_000)
    expect(motion.index.value).toBe(index)
  })

  it('focus takes precedence and blur never restarts automatic cycling', () => {
    const { motion } = mount()
    motion.focus()
    expect(motion.phase.value).toBe('show')
    expect(motion.focused.value).toBe(true)
    expect(motion.automatic.value).toBe(false)
    motion.blur()
    vi.advanceTimersByTime(600_000)
    expect(motion.index.value).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it.each(['type', 'listen', 'show', 'hide'] as const)('background pauses the remaining %s timer without catching up', (phase) => {
    const { motion } = mount()
    if (phase !== 'type') vi.advanceTimersByTime(motion.demo.value.query.length * 42 + 250)
    if (phase === 'show' || phase === 'hide') vi.advanceTimersByTime(900)
    if (phase === 'hide') vi.advanceTimersByTime(5200)
    expect(motion.phase.value).toBe(phase)
    vi.advanceTimersByTime(10)
    const count = motion.count.value
    visibility(true)
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(60_000)
    expect(motion.phase.value).toBe(phase)
    expect(motion.count.value).toBe(count)
    visibility(false)
    expect(vi.getTimerCount()).toBe(1)
  })

  it('resumes exactly the remaining typing interval after repeated visibility events', () => {
    const { motion } = mount()
    vi.advanceTimersByTime(20)
    visibility(true)
    visibility(true)
    vi.advanceTimersByTime(10000)
    visibility(false)
    visibility(false)
    vi.advanceTimersByTime(21)
    expect(motion.count.value).toBe(0)
    vi.advanceTimersByTime(1)
    expect(motion.count.value).toBe(1)
  })

  it('reduced motion is immediately static and visible with zero timers/observers/loops', () => {
    reduced = true
    const { motion } = mount()
    expect(motion.reduced.value).toBe(true)
    expect(motion.phase.value).toBe('show')
    expect(motion.typed.value).toBe(motion.demo.value.query)
    expect(motion.stepsSeen.value && motion.cabinetSeen.value).toBe(true)
    expect(callbacks).toHaveLength(0)
    motion.pick(4)
    vi.advanceTimersByTime(600_000)
    expect(motion.index.value).toBe(4)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('responds immediately to changing OS preference and resumes without overriding manual choice', () => {
    const { motion } = mount()
    preference(true)
    expect(vi.getTimerCount()).toBe(0)
    expect(motion.stepsSeen.value).toBe(true)
    motion.pick(2)
    preference(false)
    expect(motion.index.value).toBe(2)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('reveals sections once at 20% intersection, independently', () => {
    const { motion, steps, cabinet } = mount()
    expect(motion.stepsSeen.value || motion.cabinetSeen.value).toBe(false)
    callbacks[0]!([intersection(steps)], {} as IntersectionObserver)
    expect(motion.stepsSeen.value).toBe(true)
    expect(motion.cabinetSeen.value).toBe(false)
    callbacks[0]!([intersection(cabinet)], {} as IntersectionObserver)
    expect(motion.cabinetSeen.value).toBe(true)
    expect(unobserve).toHaveBeenCalledTimes(2)
  })

  it('falls back to visible sections when IntersectionObserver is unavailable', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const { motion } = mount()
    expect(motion.stepsSeen.value && motion.cabinetSeen.value).toBe(true)
  })

  it('falls back to static reduced presentation when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined)
    const { motion } = mount()
    expect(motion.reduced.value).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('stops timers and observers on navigation/version change and cleans listeners on unmount', async () => {
    const { active, unmount } = mount()
    active.value = false
    await nextTick()
    expect(vi.getTimerCount()).toBe(0)
    expect(disconnect).toHaveBeenCalled()
    preference(false)
    expect(vi.getTimerCount()).toBe(0)
    unmount()
    expect(mediaListeners.size).toBe(0)
    visibility(false)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not start the motion system for a v1/inactive surface', () => {
    mount(false)
    preference(false)
    visibility(false)
    expect(vi.getTimerCount()).toBe(0)
    expect(callbacks).toHaveLength(0)
  })

  it('cleans the active timer on direct unmount during typing', () => {
    const { unmount } = mount()
    expect(vi.getTimerCount()).toBe(1)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('mounts in a background tab without starting a timer until visible', () => {
    hidden = true
    const { motion } = mount()
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(10000)
    expect(motion.count.value).toBe(0)
    visibility(false)
    vi.advanceTimersByTime(42)
    expect(motion.count.value).toBe(1)
  })

  it('pauses/resumes owned CSS animations and cancels paused animations on unmount', () => {
    const { root, unmount } = mount()
    let state = 'running'
    const animation = { get playState() { return state },
      pause: vi.fn(() => { state = 'paused' }), play: vi.fn(() => { state = 'running' }), cancel: vi.fn() }
    Object.defineProperty(root, 'getAnimations', { value: () => [animation] })
    visibility(true)
    expect(animation.pause).toHaveBeenCalledOnce()
    visibility(false)
    expect(animation.play).toHaveBeenCalledOnce()
    visibility(true)
    unmount()
    expect(animation.cancel).toHaveBeenCalledOnce()
  })

  it('does not restart a transition canceled while the tab was hidden', () => {
    const { root } = mount()
    const animation = { playState: 'running', pause: vi.fn(), play: vi.fn(), cancel: vi.fn() }
    Object.defineProperty(root, 'getAnimations', { value: () => [animation] })
    visibility(true)
    animation.playState = 'idle'
    visibility(false)
    expect(animation.play).not.toHaveBeenCalled()
  })
})
