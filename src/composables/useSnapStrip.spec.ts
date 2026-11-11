import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useSnapStrip } from './useSnapStrip'

function setup(reduced = false) {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: reduced, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { queueMicrotask(() => cb(0)); return 1 })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  let api!: ReturnType<typeof useSnapStrip>
  const wrapper = mount(defineComponent({
    setup() {
      const track = ref<HTMLElement | null>(null)
      api = useSnapStrip(track)
      return () => h('ol', { ref: track }, [0, 1, 2, 3].map((i) => h('li', { key: i })))
    },
  }), { attachTo: document.body })
  const el = wrapper.element as HTMLElement
  Array.from(el.children).forEach((child, i) => Object.defineProperty(child, 'offsetLeft', { value: 20 + i * 300 }))
  Object.defineProperty(el, 'clientWidth', { value: 375, configurable: true })
  Object.defineProperty(el, 'scrollWidth', { value: 1260, configurable: true })
  el.scrollTo = vi.fn() as any
  return { wrapper, el, api }
}

describe('useSnapStrip', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('derives the active dot from the real scroll position, including the scroll end', async () => {
    const { el, api, wrapper } = setup()
    el.scrollLeft = 290
    api.onScroll()
    await nextTick()
    expect(api.index.value).toBe(1)
    el.scrollLeft = 890
    api.onScroll()
    await nextTick()
    expect(api.index.value).toBe(3)
    wrapper.unmount()
  })

  it('scrolls to a card smoothly, or instantly under reduced motion', async () => {
    const first = setup(false)
    first.api.scrollTo(2)
    expect(first.el.scrollTo).toHaveBeenCalledWith({ left: 600, behavior: 'smooth' })
    expect(first.api.index.value).toBe(2)
    first.wrapper.unmount()
    const reduced = setup(true)
    reduced.api.scrollTo(1)
    await nextTick()
    expect(reduced.el.scrollTo).toHaveBeenCalledWith({ left: 300, behavior: 'auto' })
    reduced.api.scrollTo(9)
    expect(reduced.api.index.value).toBe(1)
    reduced.wrapper.unmount()
  })
})
