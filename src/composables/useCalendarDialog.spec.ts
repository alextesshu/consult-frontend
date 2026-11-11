import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { defineComponent, ref } from 'vue'
import { useCalendarDialog } from './useCalendarDialog'

const Harness = defineComponent({
  setup() {
    const open = ref(false), panel = ref<HTMLElement | null>(null)
    useCalendarDialog({ open, panel, close: () => { open.value = false } })
    return { open, panel }
  },
  template: `<div><button @click="open = true">Open</button><a href="#">Background</a><template v-if="open"><div class="pc2-cal__backdrop" @click="open = false"></div><div ref="panel" role="dialog" tabindex="-1"><button>First</button><fieldset disabled><button>Disabled field</button></fieldset><button @click="open = false">Last</button></div></template></div>`,
})
afterEach(() => { document.documentElement.style.overflow = ''; document.body.style.overflow = '' })

describe('calendar modal lifecycle', () => {
  it('restores focus to the live trigger when rendering replaces the original element', async () => {
    const generation = ref(0)
    const ReplacementHarness = defineComponent({
      setup() {
        const open = ref(false), panel = ref<HTMLElement | null>(null), trigger = ref<HTMLElement | null>(null)
        useCalendarDialog({ open, panel, trigger: () => trigger.value, close: () => { open.value = false } })
        return { open, panel, trigger, generation }
      },
      template: `<div><div><button ref="trigger" :key="generation" @click="open = true">Open replacement</button></div><div v-if="open" ref="panel" role="dialog" tabindex="-1"><button>Inside</button></div></div>`,
    })
    render(ReplacementHarness)
    const original = screen.getByRole('button', { name: 'Open replacement' })
    original.focus()
    await fireEvent.click(original)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Inside' })).toHaveFocus())
    generation.value++
    await waitFor(() => expect(original.isConnected).toBe(false))
    await fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(screen.getByRole('button', { name: 'Open replacement' })).toHaveFocus()
  })

  it('contains Tab, Shift+Tab and programmatic focus, inerts background, locks scroll and restores on Escape', async () => {
    document.documentElement.style.overflow = 'auto'
    document.body.style.overflow = 'scroll'
    render(Harness)
    const trigger = screen.getByRole('button', { name: 'Open' })
    trigger.focus()
    await fireEvent.click(trigger)
    const dialog = await screen.findByRole('dialog')
    const first = screen.getByRole('button', { name: 'First' }), last = screen.getByRole('button', { name: 'Last' })
    await waitFor(() => expect(first).toHaveFocus())
    expect(trigger).toHaveAttribute('inert')
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(document.body.style.overflow).toBe('hidden')
    await fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()
    await fireEvent.keyDown(last, { key: 'Tab' })
    expect(first).toHaveFocus()
    trigger.focus()
    expect(first).toHaveFocus()
    await fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(trigger).toHaveFocus()
    expect(trigger).not.toHaveAttribute('inert')
    expect(document.documentElement.style.overflow).toBe('auto')
    expect(document.body.style.overflow).toBe('scroll')
  })

  it('preserves pre-existing inert attributes, closes by backdrop, reopens and cleans up on unmount', async () => {
    const outside = document.createElement('div')
    outside.setAttribute('inert', 'preserved')
    document.body.append(outside)
    const view = render(Harness)
    const trigger = screen.getByRole('button', { name: 'Open' })
    trigger.focus()
    await fireEvent.click(trigger)
    await screen.findByRole('dialog')
    await fireEvent.click(view.container.querySelector('.pc2-cal__backdrop')!)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(trigger).toHaveFocus()
    await fireEvent.click(trigger)
    await screen.findByRole('dialog')
    view.unmount()
    expect(outside.getAttribute('inert')).toBe('preserved')
    expect(document.documentElement.style.overflow).toBe('')
    expect(document.body.style.overflow).toBe('')
    outside.remove()
  })
})
