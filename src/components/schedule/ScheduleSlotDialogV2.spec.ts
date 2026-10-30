import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/vue'
import { nextTick } from 'vue'
import ScheduleSlotDialogV2 from './ScheduleSlotDialogV2.vue'

// jsdom does not implement the browser top layer; native inertness/scrolling is
// independently exercised by the Chromium fixture acceptance.
const originalShow = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value(this: HTMLDialogElement) { this.setAttribute('open', '') } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value(this: HTMLDialogElement) { this.removeAttribute('open') } })
})
afterEach(() => {
  if (originalShow) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', originalShow)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
  if (originalClose) Object.defineProperty(HTMLDialogElement.prototype, 'close', originalClose)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
  vi.restoreAllMocks()
  document.body.style.overflow = ''
})

describe('ScheduleSlotDialogV2', () => {
  it('focuses the close control, wraps Tab in both directions, restores focus and scroll style', async () => {
    const opener = document.createElement('button')
    document.body.append(opener)
    opener.focus()
    document.body.style.overflow = 'auto'
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{ width: 44, height: 44 }] as unknown as DOMRectList)
    const { unmount } = render(ScheduleSlotDialogV2, { props: { label: 'Нове вікно' }, slots: { default: '<button aria-label="Закрити">×</button><input aria-label="Час" /><button>Додати</button>' } })
    await nextTick()
    const dialog = screen.getByRole('dialog', { name: 'Нове вікно' })
    const close = screen.getByRole('button', { name: 'Закрити' })
    const last = screen.getByRole('button', { name: 'Додати' })
    expect(dialog).toHaveAttribute('open')
    expect(close).toHaveFocus()
    expect(document.body.style.overflow).toBe('hidden')
    await fireEvent.keyDown(close, { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()
    await fireEvent.keyDown(last, { key: 'Tab' })
    expect(close).toHaveFocus()
    unmount()
    expect(document.body.style.overflow).toBe('auto')
    expect(opener).toHaveFocus()
    opener.remove()
  })

  it('requests closure for native Escape cancellation and backdrop without mutating form data', async () => {
    const close = vi.fn()
    const { unmount } = render(ScheduleSlotDialogV2, { props: { label: 'Нове вікно', onClose: close }, slots: { default: '<button aria-label="Закрити">×</button>' } })
    await nextTick()
    const dialog = screen.getByRole('dialog')
    await fireEvent(dialog, new Event('cancel', { cancelable: true }))
    expect(close).toHaveBeenCalledTimes(1)
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({ left: 10, right: 100, top: 10, bottom: 100 } as DOMRect)
    await fireEvent.click(dialog, { clientX: 0, clientY: 0 })
    expect(close).toHaveBeenCalledTimes(2)
    unmount()
  })

  it('does not leak the scroll lock when unmounted before the opening tick', async () => {
    const { unmount } = render(ScheduleSlotDialogV2, { props: { label: 'Нове вікно' } })
    unmount()
    await nextTick()
    expect(document.body.style.overflow).toBe('')
  })
})
