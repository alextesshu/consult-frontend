import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useDashboardMotion } from './useDashboardMotion'

function setup(reduced: boolean, readyInitially = false) {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: reduced, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  const ready = ref(readyInitially)
  let api!: ReturnType<typeof useDashboardMotion>
  const wrapper = mount(defineComponent({ setup() { api = useDashboardMotion({ ready: () => ready.value }); return () => h('div') } }))
  return { ready, wrapper, api: () => api }
}

describe('useDashboardMotion', () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

  it('reveals 50ms after data is ready and counts up over 900ms', async () => {
    const { ready, wrapper, api } = setup(false)
    expect(api().revealed.value).toBe(false)
    ready.value = true
    await nextTick()
    vi.advanceTimersByTime(49)
    expect(api().revealed.value).toBe(false)
    vi.advanceTimersByTime(1)
    expect(api().revealed.value).toBe(true)
    expect(api().progress.value).toBe(0)
    vi.advanceTimersByTime(1000)
    expect(api().progress.value).toBe(1)
    wrapper.unmount()
  })

  it('pulses and ticks every second, and stops on unmount', () => {
    const { wrapper, api } = setup(false)
    const first = api().pulse.value
    vi.advanceTimersByTime(1000)
    expect(api().pulse.value).toBe(!first)
    const t = api().now.value
    vi.advanceTimersByTime(1000)
    expect(api().now.value).toBeGreaterThan(t)
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('under reduced motion shows final values at once and never pulses', async () => {
    const { wrapper, api } = setup(true, true)
    await nextTick()
    expect(api().revealed.value).toBe(true)
    expect(api().progress.value).toBe(1)
    vi.advanceTimersByTime(3000)
    expect(api().pulse.value).toBe(true)
    api().count()
    expect(api().progress.value).toBe(1)
    wrapper.unmount()
  })
})
