import { cleanup, render } from '@testing-library/vue'
import { defineComponent, h, nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useHomeMotion } from './useHomeMotion'
let hidden = false, reduced = false
let listeners: Set<() => void>
let callbacks: IntersectionObserverCallback[]
const disconnect = vi.fn(), unobserve = vi.fn(), observe = vi.fn()
function mount(enabled = true) {
  const active = ref(enabled)
  let motion!: ReturnType<typeof useHomeMotion>
  const view = render(defineComponent({ setup() {
    const root = ref<HTMLElement | null>(null)
    motion = useHomeMotion(() => active.value, root)
    return () => h('div', { ref: root }, ['band', 'value', 'blog'].map(key => h('section', { 'data-home-reveal': key })))
  } }))
  return { motion, active, root: view.container.firstElementChild as HTMLElement, unmount: view.unmount }
}
function visibility(value: boolean) { hidden = value; document.dispatchEvent(new Event('visibilitychange')) }
function preference(value: boolean) { reduced = value; for (const listener of listeners) listener() }
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(0)
  hidden = reduced = false; listeners = new Set(); callbacks = []
  disconnect.mockClear(); observe.mockClear(); unobserve.mockClear()
  vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden)
  vi.stubGlobal('matchMedia', () => ({ get matches() { return reduced }, addEventListener: (_: string, cb: () => void) => listeners.add(cb), removeEventListener: (_: string, cb: () => void) => listeners.delete(cb) }))
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: IntersectionObserverCallback, options: IntersectionObserverInit) { callbacks.push(cb); expect(options.threshold).toBe(.15) }
    observe = observe; unobserve = unobserve; disconnect = disconnect
  })
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
describe('Home Claude autoplay and lifecycle', () => {
  it('runs exact 3400ms boundaries through all four steps and wraps', () => {
    const { motion } = mount()
    for (let i = 0; i < 8; i++) {
      expect(motion.index.value).toBe(i % 4)
      vi.advanceTimersByTime(3399); expect(motion.index.value).toBe(i % 4)
      vi.advanceTimersByTime(1); expect(motion.index.value).toBe((i + 1) % 4)
    }
  })
  it.each([0, 1, 2, 3])('manual selection %i stops autoplay indefinitely', index => {
    const { motion } = mount(); vi.advanceTimersByTime(500)
    motion.pick(index); vi.advanceTimersByTime(34000)
    expect(motion.index.value).toBe(index); expect(motion.automatic.value).toBe(false); expect(vi.getTimerCount()).toBe(0)
  })
  it('ignores invalid manual indexes', () => {
    const { motion } = mount()
    for (const value of [-1, 4, .5, NaN]) motion.pick(value)
    expect(motion.automatic.value).toBe(true); expect(motion.index.value).toBe(0)
  })
  it('provides explicit pause and resume with a fresh full step', () => {
    const { motion } = mount(); vi.advanceTimersByTime(1200); motion.toggle()
    vi.advanceTimersByTime(10000); expect(motion.index.value).toBe(0)
    motion.toggle(); vi.advanceTimersByTime(3399); expect(motion.index.value).toBe(0)
    vi.advanceTimersByTime(1); expect(motion.index.value).toBe(1)
  })
  it.each([0, 1, 2, 3])('pauses remaining time while hidden at step %i', index => {
    const { motion } = mount(); vi.advanceTimersByTime(index * 3400 + 1200)
    visibility(true); vi.advanceTimersByTime(60000); expect(motion.index.value).toBe(index)
    visibility(false); vi.advanceTimersByTime(2199); expect(motion.index.value).toBe(index)
    vi.advanceTimersByTime(1); expect(motion.index.value).toBe((index + 1) % 4)
  })
  it('does not start while initially hidden', () => {
    hidden = true; const { motion } = mount(); vi.advanceTimersByTime(20000)
    expect(motion.index.value).toBe(0); expect(vi.getTimerCount()).toBe(0)
    visibility(false); vi.advanceTimersByTime(3400); expect(motion.index.value).toBe(1)
  })
  it('does not autoplay or hide content with reduced motion; manual steps remain available', () => {
    reduced = true; const { motion } = mount(); motion.toggle(); motion.toggle()
    vi.advanceTimersByTime(20000); expect(motion.index.value).toBe(0)
    expect(motion.seen.value).toEqual({ band: true, value: true, blog: true }); expect(observe).not.toHaveBeenCalled()
    motion.pick(3); expect(motion.index.value).toBe(3); expect(vi.getTimerCount()).toBe(0)
  })
  it('handles live preference changes without overriding manual pause', () => {
    const { motion } = mount(); vi.advanceTimersByTime(1000); preference(true)
    vi.advanceTimersByTime(10000); expect(motion.index.value).toBe(0)
    preference(false); vi.advanceTimersByTime(3400); expect(motion.index.value).toBe(1)
    motion.pick(2); preference(true); preference(false); expect(vi.getTimerCount()).toBe(0)
  })
  it('reveals each section once at the original threshold', () => {
    const { motion, root } = mount(); expect(observe).toHaveBeenCalledTimes(3)
    const target = root.children[1]!
    callbacks[0]!([{ target, isIntersecting: false }] as IntersectionObserverEntry[], {} as IntersectionObserver)
    expect(motion.seen.value.value).toBe(false)
    callbacks[0]!([{ target, isIntersecting: true }] as IntersectionObserverEntry[], {} as IntersectionObserver)
    expect(motion.seen.value.value).toBe(true); expect(unobserve).toHaveBeenCalledWith(target)
  })
  it('falls back to visible content without observers or matchMedia', () => {
    vi.stubGlobal('IntersectionObserver', undefined); vi.stubGlobal('matchMedia', undefined)
    const { motion } = mount(); expect(motion.reduced.value).toBe(true)
    expect(Object.values(motion.seen.value).every(Boolean)).toBe(true); expect(vi.getTimerCount()).toBe(0)
  })
  it('disposes timers and observers on v1 and unmount; preserves manually selected step', async () => {
    const { motion, active, unmount } = mount(); motion.pick(3)
    active.value = false; await nextTick(); expect(disconnect).toHaveBeenCalled()
    active.value = true; await nextTick(); expect(motion.index.value).toBe(3); expect(vi.getTimerCount()).toBe(0)
    unmount(); expect(listeners.size).toBe(0); visibility(false); expect(vi.getTimerCount()).toBe(0)
  })
  it('does not start motion in v1 and activates safely after opt-in', async () => {
    const { active, motion, unmount } = mount(false)
    expect(observe).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0)
    active.value = true; await nextTick(); expect(observe).toHaveBeenCalledTimes(3); vi.advanceTimersByTime(3400); expect(motion.index.value).toBe(1)
    active.value = false; await nextTick(); expect(vi.getTimerCount()).toBe(0)
    unmount()
  })
  it('pauses and resumes running owned animations, and cancels paused animations on disposal', () => {
    const { root, unmount } = mount()
    const animation = { playState: 'running', pause: vi.fn(() => { animation.playState = 'paused' }), play: vi.fn(() => { animation.playState = 'running' }), cancel: vi.fn() }
    Object.defineProperty(root, 'getAnimations', { value: () => [animation] })
    visibility(true); expect(animation.pause).toHaveBeenCalledOnce()
    visibility(false); expect(animation.play).toHaveBeenCalledOnce()
    visibility(true); unmount(); expect(animation.cancel).toHaveBeenCalledOnce()
  })
})
