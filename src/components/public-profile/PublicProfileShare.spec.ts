import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import PublicProfileShare from './PublicProfileShare.vue'

const canonicalUrl = 'https://proconsult.space/s/olena'
const props = { open: true, canonicalUrl, name: 'Олена & Андрій' }
describe('PublicProfileShare', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() { this.open = true } })
    Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value() { this.open = false; this.dispatchEvent(new Event('close')) } })
    Object.defineProperty(document, 'execCommand', { configurable: true, value: vi.fn(() => false) })
  })
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.style.overflow = '' })
  function clipboard(writeText = vi.fn().mockResolvedValue(undefined)) {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } }); return writeText
  }
  it('offers safe social intents and a dedicated copy action with live success feedback', async () => {
    const write = clipboard(), view = render(PublicProfileShare, { props }); await nextTick()
    for (const platform of ['Telegram', 'Facebook', 'Threads']) {
      const link = screen.getByRole('link', { name: platform })
      expect(link).toHaveAttribute('target', '_blank'); expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      const target = new URL(link.getAttribute('href')!)
      expect([...target.searchParams.values()]).toContain(canonicalUrl)
    }
    await fireEvent.click(screen.getByRole('button', { name: 'Копіювати посилання' }))
    expect(write).toHaveBeenCalledWith(canonicalUrl)
    expect(screen.getByRole('status')).toHaveTextContent('Посилання скопійовано')
    expect(view.emitted().shared).toEqual([['copy_link']])
  })
  it('keeps a copy fallback available when the Threads composer is unavailable', async () => {
    clipboard(); render(PublicProfileShare, { props }); await nextTick()
    await fireEvent.click(screen.getByRole('link', { name: 'Threads' }))
    expect(screen.getByRole('status')).toHaveTextContent('Threads не відкрився?')
    expect(screen.getByRole('button', { name: 'Копіювати посилання' })).toBeInTheDocument()
  })
  it('labels Instagram as copy/open, without pretending to publish directly', async () => {
    const write = clipboard(); render(PublicProfileShare, { props }); await nextTick()
    expect(screen.queryByRole('link', { name: 'Instagram' })).not.toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: /Instagram.*Копіювати посилання/ }))
    expect(write).toHaveBeenCalledWith(canonicalUrl)
    expect(screen.getByRole('status')).toHaveTextContent('сторіз')
    expect(screen.getByRole('link', { name: 'Відкрити Instagram' })).toHaveAttribute('href', 'https://www.instagram.com/')
  })
  it('uses an in-dialog DOM fallback and restores the copy control focus', async () => {
    clipboard(vi.fn().mockRejectedValue(new Error('Denied')))
    Object.defineProperty(document, 'execCommand', { configurable: true, value: vi.fn(() => {
      expect(document.activeElement?.closest('dialog')).toBeTruthy()
      expect((document.activeElement as HTMLTextAreaElement).value).toBe(canonicalUrl)
      return true
    }) })
    render(PublicProfileShare, { props }); await nextTick()
    const button = screen.getByRole('button', { name: 'Копіювати посилання' }); button.focus(); await fireEvent.click(button)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Посилання скопійовано'))
    expect(button).toHaveFocus(); expect(document.querySelector('textarea')).toBeNull()
  })
  it('offers a selectable manual URL after both clipboard paths fail, never claiming success', async () => {
    clipboard(vi.fn().mockRejectedValue(new Error('Denied')))
    const view = render(PublicProfileShare, { props }); await nextTick()
    await fireEvent.click(screen.getByRole('button', { name: /Instagram/ }))
    expect(screen.getByRole('alert')).toHaveTextContent('Не вдалося скопіювати')
    expect(screen.getByRole('textbox', { name: 'Посилання профілю' })).toHaveValue(canonicalUrl)
    expect(screen.queryByRole('status')).not.toBeInTheDocument(); expect(view.emitted().shared).toBeUndefined()
    expect(screen.getByRole('link', { name: 'Відкрити Instagram' })).toBeInTheDocument()
  })
  it('ignores late clipboard feedback after canonical-profile change', async () => {
    let done!: () => void; clipboard(vi.fn(() => new Promise<void>(resolve => { done = resolve })))
    const view = render(PublicProfileShare, { props }); await nextTick()
    await fireEvent.click(screen.getByRole('button', { name: 'Копіювати посилання' }))
    await view.rerender({ canonicalUrl: 'https://proconsult.space/s/other' }); done(); await nextTick()
    expect(screen.queryByRole('status')).not.toBeInTheDocument(); expect(view.emitted().shared).toBeUndefined()
    await view.rerender({ open: false })
  })
})
