import { cleanup, render } from '@testing-library/vue'
import { defineComponent, h, nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDiscoveryMotion, discoveryPlaceholders } from './useDiscoveryMotion'
let hidden = false, reduced = false
let mediaListeners: Set<() => void>, frames: Map<number, FrameRequestCallback>, nextFrame: number
function mount(enabled = true, busy = false) {
  const active = ref(enabled), query = ref(''), loading = ref(busy)
  let motion!: ReturnType<typeof useDiscoveryMotion>
  const view = render(defineComponent({ setup() {
    const root = ref<HTMLElement | null>(null)
    motion = useDiscoveryMotion({ active: () => active.value, query: () => query.value, loading: () => loading.value, root })
    return () => h('div', { ref: root })
  } }))
  return { motion, active, query, loading, unmount: view.unmount, root: view.container.firstElementChild as HTMLElement }
}
function visibility(value: boolean) { hidden = value; document.dispatchEvent(new Event('visibilitychange')) }
function preference(value: boolean) { reduced = value; for (const cb of mediaListeners) cb() }
async function paint() {
  await nextTick()
  for (let n = 0; n < 3; n++) { const pending = Array.from(frames); frames.clear(); for (const [,cb] of pending) cb(0); await nextTick() }
}
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(0); hidden = reduced = false; mediaListeners = new Set(); frames = new Map(); nextFrame = 0
  vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden)
  vi.stubGlobal('matchMedia', () => ({ get matches() { return reduced }, addEventListener: (_: string, cb: () => void) => mediaListeners.add(cb), removeEventListener: (_: string, cb: () => void) => mediaListeners.delete(cb) }))
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.set(++nextFrame, cb); return nextFrame })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
describe('Discovery source motion and production lifecycle', () => {
  it('uses the four source examples and exact 3200ms tick / 400ms placeholder transition', () => {
    const { motion, query } = mount()
    expect(discoveryPlaceholders).toHaveLength(4)
    vi.advanceTimersByTime(3199); expect(motion.placeholderShown.value).toBe(true)
    vi.advanceTimersByTime(1); expect(motion.placeholderShown.value).toBe(false)
    vi.advanceTimersByTime(399); expect(motion.placeholderIndex.value).toBe(0)
    vi.advanceTimersByTime(1); expect(motion.placeholderIndex.value).toBe(1); expect(motion.placeholderShown.value).toBe(true)
    for (let index = 2; index < 6; index++) {
      vi.advanceTimersByTime(2799); expect(motion.placeholderShown.value).toBe(true)
      vi.advanceTimersByTime(1); expect(motion.placeholderShown.value).toBe(false)
      vi.advanceTimersByTime(400); expect(motion.placeholderIndex.value).toBe(index % 4)
    }
    expect(query.value).toBe('')
  })
  it('stops rotation on focus and resumes on blur without changing the input', () => {
    const { motion, query } = mount(); vi.advanceTimersByTime(3200); motion.focus()
    vi.advanceTimersByTime(20000); expect(motion.placeholderIndex.value).toBe(0); expect(motion.placeholderShown.value).toBe(true)
    motion.blur(); vi.advanceTimersByTime(3600); expect(motion.placeholderIndex.value).toBe(1); expect(query.value).toBe('')
  })
  it('holds the placeholder while real text exists; clearing restarts the presentation only', async () => {
    const { motion, query } = mount(); query.value = 'real query'; await nextTick()
    vi.advanceTimersByTime(20000); expect(motion.placeholderIndex.value).toBe(0); expect(query.value).toBe('real query')
    query.value = ''; await nextTick(); vi.advanceTimersByTime(3600); expect(motion.placeholderIndex.value).toBe(1)
  })
  it.each([1200, 3300])('pauses and resumes the exact remaining interval at %i ms', elapsed => {
    const { motion } = mount(); vi.advanceTimersByTime(elapsed)
    const index = motion.placeholderIndex.value, shown = motion.placeholderShown.value
    visibility(true); vi.advanceTimersByTime(60000); expect(motion.placeholderIndex.value).toBe(index); expect(motion.placeholderShown.value).toBe(shown)
    visibility(false); const left = elapsed < 3200 ? 3200 - elapsed : 3600 - elapsed
    vi.advanceTimersByTime(left - 1); expect(motion.placeholderIndex.value).toBe(index); expect(motion.placeholderShown.value).toBe(shown)
    vi.advanceTimersByTime(1); expect(shown ? motion.placeholderShown.value : motion.placeholderIndex.value).toBe(shown ? false : 1)
  })
  it('does not autoplay when initially hidden', () => {
    hidden = true; const { motion } = mount(); vi.advanceTimersByTime(10000); expect(vi.getTimerCount()).toBe(0)
    visibility(false); vi.advanceTimersByTime(3600); expect(motion.placeholderIndex.value).toBe(1)
  })
  it('reveals real results after a paint boundary without an artificial 800ms delay', async () => {
    const { motion, loading } = mount(true, true); expect(motion.cardsReady.value).toBe(false)
    loading.value = false; await nextTick(); expect(motion.cardsReady.value).toBe(false)
    await paint(); expect(motion.cardsReady.value).toBe(true)
    expect(Date.now()).toBe(0)
  })
  it('cancels a pending reveal when the next request starts and ignores superseded callbacks', async () => {
    const { motion, loading } = mount(); await nextTick(); const stale = Array.from(frames.values())[0]!
    loading.value = true; await nextTick(); stale(0)
    expect(motion.cardsReady.value).toBe(false); expect(frames.size).toBe(0)
    loading.value = false; await paint(); expect(motion.cardsReady.value).toBe(true)
  })
  it('shows results immediately with reduced motion and owns no timers/frames', async () => {
    reduced = true; const { motion, loading } = mount(true, true); loading.value = false; await nextTick()
    vi.advanceTimersByTime(10000); expect(motion.cardsReady.value).toBe(true); expect(motion.placeholderIndex.value).toBe(0)
    expect(vi.getTimerCount()).toBe(0); expect(frames.size).toBe(0)
  })
  it('handles live OS preferences and exposes all loaded content while hidden', async () => {
    const { motion, loading } = mount(true, true); preference(true)
    loading.value = false; await nextTick(); expect(motion.cardsReady.value).toBe(true); expect(vi.getTimerCount()).toBe(0)
    preference(false); vi.advanceTimersByTime(3600); expect(motion.placeholderIndex.value).toBe(1)
    loading.value = true; await nextTick(); visibility(true); loading.value = false; await paint(); expect(motion.cardsReady.value).toBe(true)
  })
  it('defaults to an accessible static presentation if matchMedia is absent', () => {
    vi.stubGlobal('matchMedia', undefined); const { motion } = mount(); expect(motion.reduced.value).toBe(true); expect(vi.getTimerCount()).toBe(0)
  })
  it('does not start in v1; cleans timers, frames and media listeners on version exit/unmount', async () => {
    const { active, motion, unmount } = mount(false); expect(vi.getTimerCount()).toBe(0)
    active.value = true; await paint(); vi.advanceTimersByTime(3600); expect(motion.placeholderIndex.value).toBe(1)
    motion.focus(); active.value = false; await nextTick(); expect(vi.getTimerCount()).toBe(0); expect(frames.size).toBe(0)
    expect(motion.focused.value).toBe(false)
    active.value = true; await paint(); vi.advanceTimersByTime(3600); expect(motion.placeholderIndex.value).toBe(2)
    unmount(); expect(mediaListeners.size).toBe(0); visibility(false); expect(vi.getTimerCount()).toBe(0)
  })
  it('cancels pending async reveal work on immediate unmount', async () => {
    const { unmount } = mount(); unmount(); await paint(); expect(frames.size).toBe(0); expect(vi.getTimerCount()).toBe(0)
  })
  it('pauses/resumes owned animations and does not revive canceled animations', () => {
    const { root, unmount } = mount()
    const a = { playState: 'running', pause: vi.fn(() => { a.playState = 'paused' }), play: vi.fn(), cancel: vi.fn() }
    Object.defineProperty(root, 'getAnimations', { value: () => [a] })
    visibility(true); expect(a.pause).toHaveBeenCalledOnce(); a.playState = 'idle'; visibility(false); expect(a.play).not.toHaveBeenCalled()
    a.playState = 'running'; visibility(true); unmount(); expect(a.cancel).toHaveBeenCalledOnce()
  })
})
