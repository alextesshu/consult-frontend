import { fireEvent, render, screen } from '@testing-library/vue'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import PublicProfileOverlay from './PublicProfileOverlay.vue'
import PublicProfileShare from './PublicProfileShare.vue'
import PublicProfileFaqSection from './PublicProfileFaqSection.vue'

describe('profile overlay, sharing and accordions', () => {
 beforeAll(() => {
  if (!HTMLDialogElement.prototype.showModal) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, writable: true, value() {} })
  if (!HTMLDialogElement.prototype.close) Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, writable: true, value() {} })
 })
 beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(function (this: HTMLDialogElement) { this.open = true })
  vi.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(function (this: HTMLDialogElement) { this.open = false; this.dispatchEvent(new Event('close')) })
 })
 afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.style.overflow = '' })
 it('contains one native dialog, restores overflow and focus after controlled close', async () => {
  const trigger = document.createElement('button'); document.body.append(trigger); trigger.focus()
  const view = render(PublicProfileOverlay, { props: { open: true, title: 'Про мене', titleId: 'about-test', kind: 'about' } })
  await nextTick(); expect(document.body.style.overflow).toBe('hidden')
  await fireEvent.click(screen.getByRole('button', { name: 'Закрити' })); expect(view.emitted()['update:open']).toEqual([[false]])
  await view.rerender({ open: false }); expect(document.body.style.overflow).toBe(''); expect(document.activeElement).toBe(trigger)
  view.unmount(); trigger.remove()
 })
 it('blocks Escape while the actual request is submitting', async () => {
  const view = render(PublicProfileOverlay, { props: { open: true, title: 'Запит', titleId: 'request-test', kind: 'request', locked: true } }); await nextTick()
  await fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))
  expect(view.emitted()['update:open']).toBeUndefined(); view.unmount()
 })
 it('closes from backdrop only outside the dialog rectangle', async () => {
  const view = render(PublicProfileOverlay, { props: { open: true, title: 'Запит', titleId: 'request-test', kind: 'request' } }); await nextTick()
  const dialog = screen.getByRole('dialog'); vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({ left: 20, right: 100, top: 20, bottom: 100 } as DOMRect)
  await fireEvent.click(dialog, { clientX: 50, clientY: 50 }); expect(view.emitted()['update:open']).toBeUndefined()
  await fireEvent.click(dialog, { clientX: 5, clientY: 5 }); expect(view.emitted()['update:open']).toEqual([[false]]); view.unmount()
 })
 it('does not claim clipboard success after rejection', async () => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) } })
  const view = render(PublicProfileShare, { props: { open: true, canonicalUrl: 'https://example.test/s/olena', name: 'Олена' } }); await nextTick()
  await fireEvent.click(screen.getByRole('button', { name: /Instagram/ })); await nextTick()
  expect(screen.getByRole('alert')).toHaveTextContent('Не вдалося скопіювати'); expect(view.emitted().shared).toBeUndefined(); view.unmount()
 })
 it('copies only canonical URL and exposes real external share links', async () => {
  const copy = vi.fn().mockResolvedValue(undefined); Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: copy } })
  const view = render(PublicProfileShare, { props: { open: true, canonicalUrl: 'https://example.test/s/olena', name: 'Олена' } }); await nextTick()
  await fireEvent.click(screen.getByRole('button', { name: /Instagram/ })); await nextTick()
  expect(copy).toHaveBeenCalledWith('https://example.test/s/olena'); expect(screen.getByRole('status')).toHaveTextContent('сторіз')
  expect(screen.getByRole('link', { name: /Threads/ }).getAttribute('href')).toContain('threads.net/intent/post'); view.unmount()
 })
 it('keeps a single-open v2 FAQ and removes collapsed content from interaction', async () => {
  const view = render(PublicProfileFaqSection, { props: { uiV2: true, faqItems: [{ id: 'a', question: 'Перше?', answer: 'А' }, { id: 'b', question: 'Друге?', answer: 'Б' }] } })
  const first = screen.getByRole('button', { name: 'Перше?' }), second = screen.getByRole('button', { name: 'Друге?' })
  expect(first).toHaveAttribute('aria-expanded', 'true'); await fireEvent.click(second)
  expect(first).toHaveAttribute('aria-expanded', 'false'); expect(second).toHaveAttribute('aria-expanded', 'true')
  expect(view.container.querySelector('#pc2-faq-answer-0')).toHaveAttribute('inert'); view.unmount()
 })
})
