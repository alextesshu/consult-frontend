import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { defineComponent, h, ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SpecialistCabinetShellV2 from './SpecialistCabinetShellV2.vue'
import { CABINET_NAV } from '../../lib/specialistCabinetNav'
import { applyUiVersion } from '../../lib/uiVersion'

async function renderShell(path = '/cabinet') {
  const router = createRouter({ history: createMemoryHistory(), routes: [...new Set(CABINET_NAV.map((item) => item.to.split('#')[0]!)), '/public', '/cabinet/sessions/:id', '/cabinet/slots', '/cabinet/schedule', '/cabinet/availability-exceptions'].map((p) => ({ path: p, component: { template: '<div>page</div>' } })) })
  await router.push(path)
  await router.isReady()
  const moreOpen = ref(false)
  const onLogout = vi.fn()
  const Harness = defineComponent({
    setup: () => () => h(SpecialistCabinetShellV2, {
      path: router.currentRoute.value.path, badges: { sessions: 3, requests: 2, chats: 1 }, moreOpen: moreOpen.value,
      accountTitle: 'specialist@example.com', accountSubtitle: 'Тариф Pro', accountInitials: 'SP',
      'onUpdate:moreOpen': (value: boolean) => { moreOpen.value = value }, onLogout,
    }, () => h('p', 'content')),
  })
  return { router, moreOpen, onLogout, ...render(Harness, { global: { plugins: [router] } }) }
}
const sheet = () => document.querySelector('.pc2-cabinet-more') as HTMLElement
const dialog = () => document.getElementById('cabinet-more-sheet') as HTMLElement

describe('SpecialistCabinetShellV2', () => {
  beforeEach(() => {
    applyUiVersion('v2')
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  })
  afterEach(() => { vi.unstubAllGlobals(); applyUiVersion('v1'); document.body.style.overflow = ''; document.documentElement.style.overflow = '' })

  it('renders the 13-item sidebar with the active page and real badges', async () => {
    const { container } = await renderShell('/cabinet/sessions/42')
    const sidebar = container.querySelector('.pc2-cabinet-sidebar') as HTMLElement
    const links = within(sidebar).getAllByRole('link').filter((link) => link.classList.contains('pc2-cabinet-sidebar__link'))
    expect(links).toHaveLength(13)
    expect(within(sidebar).getByRole('link', { name: /^Календар/ })).toHaveAttribute('aria-current', 'page')
    expect(within(sidebar).getByRole('link', { name: /^Календар/ })).toHaveTextContent('нових: 3')
    expect(within(sidebar).getByRole('link', { name: /^Групові події/ })).toHaveAttribute('href', '/cabinet/group-events')
    expect(within(sidebar).getByRole('link', { name: /^Запити/ })).toHaveAttribute('href', '/cabinet/external-sessions#guest-requests')
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(2) // sidebar + tab bar
    expect(screen.getByText('content')).toBeInTheDocument()
  })

  it.each(['/cabinet/slots?tab=settings', '/cabinet/schedule', '/cabinet/availability-exceptions'])('activates Calendar in sidebar and mobile tabs for %s', async (path) => {
    const { container } = await renderShell(path)
    for (const selector of ['.pc2-cabinet-sidebar__nav', '.pc2-cabinet-tabbar']) {
      const nav = container.querySelector(selector) as HTMLElement
      expect(within(nav).getByRole('link', { name: /^Календар/ })).toHaveAttribute('aria-current', 'page')
      expect(within(nav).queryByRole('link', { name: /^Розклад|^Сесії/ })).toBeNull()
    }
    expect(within(dialog()).queryByRole('link', { name: 'Розклад', hidden: true })).toBeNull()
  })

  it('renders the M1 tab bar with «Ще» carrying the sum of badges inside it', async () => {
    const { container } = await renderShell('/cabinet')
    const tabbar = container.querySelector('.pc2-cabinet-tabbar') as HTMLElement
    expect(within(tabbar).getAllByRole('link').map((link) => link.textContent?.replace(/, нових.*$/, '').replace(/\d+$/, '').trim())).toEqual(['Кабінет', 'Календар', 'Клієнти', 'Запити'])
    const more = within(tabbar).getByRole('button', { name: /^Ще/ })
    expect(more).toHaveTextContent('нових: 1')
    expect(more).toHaveAttribute('aria-haspopup', 'dialog')
  })

  it('opens «Ще», locks scroll, traps focus and closes with Escape returning focus', async () => {
    const { container } = await renderShell('/cabinet')
    const more = within(container.querySelector('.pc2-cabinet-tabbar') as HTMLElement).getByRole('button', { name: /^Ще/ })
    expect(dialog()).toHaveAttribute('aria-hidden', 'true')
    await fireEvent.click(more)
    expect(sheet()).toHaveClass('is-open')
    expect(more).toHaveAttribute('aria-expanded', 'true')
    expect(document.body.style.overflow).toBe('hidden')
    await waitFor(() => expect(document.activeElement).toBe(dialog()))
    expect(within(dialog()).getAllByRole('link').filter((link) => link.classList.contains('pc2-cabinet-more__item'))).toHaveLength(9)
    await fireEvent.keyDown(document, { key: 'Escape' })
    expect(sheet()).not.toHaveClass('is-open')
    expect(document.body.style.overflow).toBe('')
    await waitFor(() => expect(document.activeElement).toBe(more))
  })

  it('closes from the backdrop, a downward swipe, item navigation and logs out', async () => {
    const { container, router, onLogout } = await renderShell('/cabinet')
    const more = within(container.querySelector('.pc2-cabinet-tabbar') as HTMLElement).getByRole('button', { name: /^Ще/ })
    await fireEvent.click(more)
    await fireEvent.click(document.querySelector('.pc2-cabinet-more__backdrop')!)
    expect(sheet()).not.toHaveClass('is-open')
    await fireEvent.click(more)
    await fireEvent.touchStart(dialog(), { touches: [{ clientY: 400 }] })
    await fireEvent.touchMove(dialog(), { touches: [{ clientY: 440 }] })
    await fireEvent.touchEnd(dialog())
    expect(sheet()).toHaveClass('is-open')
    await fireEvent.touchStart(dialog(), { touches: [{ clientY: 400 }] })
    await fireEvent.touchMove(dialog(), { touches: [{ clientY: 520 }] })
    await fireEvent.touchEnd(dialog())
    expect(sheet()).not.toHaveClass('is-open')
    await fireEvent.click(more)
    await fireEvent.click(within(dialog()).getByRole('link', { name: 'Профіль' }))
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/cabinet/profile'))
    expect(sheet()).not.toHaveClass('is-open')
    await fireEvent.click(more)
    await fireEvent.click(within(dialog()).getByRole('button', { name: 'Вийти' }))
    expect(onLogout).toHaveBeenCalledTimes(1)
    expect(sheet()).not.toHaveClass('is-open')
  })
})
