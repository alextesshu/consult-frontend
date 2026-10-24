import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useMobileOverlay } from './useMobileOverlay'

function setup() {
  const listeners = new Set<() => void>()
  const media = { matches: true, addEventListener: vi.fn((_: string, fn: () => void) => listeners.add(fn)), removeEventListener: vi.fn((_: string, fn: () => void) => listeners.delete(fn)) }
  vi.stubGlobal('matchMedia', vi.fn(() => media))
  const open = ref(false)
  const wrapper = mount(defineComponent({
    setup() {
      const panel = ref<HTMLElement | null>(null)
      const trigger = ref<HTMLElement | null>(null)
      useMobileOverlay({ open, panel, trigger })
      return () => h('div', [
        h('button', { ref: trigger, id: 'trigger' }, 'open'),
        h('div', { ref: panel, tabindex: -1 }, [h('button', { id: 'first' }, 'a'), h('button', { id: 'last' }, 'b')]),
      ])
    },
  }), { attachTo: document.body })
  return { open, wrapper, media, listeners }
}

describe('useMobileOverlay', () => {
  afterEach(() => { vi.unstubAllGlobals(); document.body.style.overflow = ''; document.documentElement.style.overflow = '' })

  it('locks and restores page scroll, focuses the panel and returns focus to the trigger', async () => {
    document.body.style.overflow = 'auto'
    const { open, wrapper } = setup()
    open.value = true
    await nextTick(); await nextTick()
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(document.activeElement?.id).toBe('first')
    open.value = false
    await nextTick()
    expect(document.body.style.overflow).toBe('auto')
    expect(document.activeElement?.id).toBe('trigger')
    wrapper.unmount()
  })

  it('traps Tab inside the panel and closes on Escape', async () => {
    const { open, wrapper } = setup()
    open.value = true
    await nextTick(); await nextTick()
    ;(document.getElementById('last') as HTMLElement).focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', cancelable: true }))
    expect(document.activeElement?.id).toBe('first')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true }))
    expect(document.activeElement?.id).toBe('last')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }))
    expect(open.value).toBe(false)
    wrapper.unmount()
  })

  it('closes when the viewport leaves the mobile range and cleans up on unmount', async () => {
    const { open, wrapper, media, listeners } = setup()
    open.value = true
    await nextTick()
    media.matches = false
    listeners.forEach((fn) => fn())
    expect(open.value).toBe(false)
    open.value = true
    await nextTick()
    wrapper.unmount()
    expect(document.body.style.overflow).toBe('')
    expect(listeners.size).toBe(0)
  })
})
