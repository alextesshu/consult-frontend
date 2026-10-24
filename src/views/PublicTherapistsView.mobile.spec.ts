import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PublicTherapistsView from './PublicTherapistsView.vue'
import { applyUiVersion } from '../lib/uiVersion'

const mocks = vi.hoisted(() => ({ discovery: vi.fn() }))

vi.mock('../lib/api', () => ({
  fetchPublicSpecialistDiscovery: mocks.discovery,
  fetchPublicSpecialists: vi.fn(),
  getPublicSpecialistDiscoveryError: vi.fn(() => null),
}))
vi.mock('../lib/specialistDiscoveryApi', () => ({
  fetchRotatedPublicSpecialistDiscovery: (params: Record<string, unknown>) => {
    const { shuffle_seed: _seed, ...rest } = params
    return mocks.discovery(rest)
  },
}))
vi.mock('../lib/productAnalytics', () => ({ productAnalytics: { capture: vi.fn() } }))

const item = {
  slug: 'olena', public_slug: 'olena', public_profile_path: '/s/olena', display_name: 'Олена Коваль',
  public_display_name: 'Олена Коваль', public_profile_summary: 'Працюю з тривогою.', specializations: ['Психологиня', 'тривога', 'вигорання', 'стосунки'],
  location: 'Київ', offers_online: true, offers_offline: true, price: '900.00', price_currency: 'UAH', photo_url: null, match_kind: null,
}
function response(total: number) {
  return {
    query: null, resolved_request_groups: [], applied_filters: { request_group: null, direction: null, format: null },
    groups: [{ code: 'all_specialists', label: 'Усі спеціалісти Pro Consult', total, items: total ? [item] : [] }],
    page: 1, page_size: 12, total, total_pages: total ? 1 : 0,
  }
}

async function renderView(path = '/specialists') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/specialists', component: PublicTherapistsView },
      { path: '/s/:slug', component: { template: '<div>Profile</div>' } },
      { path: '/signup-client', component: { template: '<div>Client signup</div>' } },
      { path: '/', component: { template: '<div>Home</div>' } },
    ],
  })
  await router.push(path)
  await router.isReady()
  return { router, ...render(PublicTherapistsView, { global: { plugins: [router] } }) }
}
const sheet = () => document.querySelector('.pc2-discovery-sheet') as HTMLElement
const dialog = () => document.getElementById('discovery-filter-sheet') as HTMLElement

describe('Discovery mobile P4 (Public-Mobile.dc.html)', () => {
  beforeEach(() => {
    applyUiVersion('v2')
    mocks.discovery.mockReset()
    mocks.discovery.mockResolvedValue(response(7))
  })
  afterEach(() => {
    applyUiVersion('v1')
    document.documentElement.style.overflow = ''
    document.body.style.overflow = ''
  })

  it('renders a filter button whose counter reflects only real applied filters', async () => {
    await renderView('/specialists?request_group=emotional_state&format=online')
    await screen.findByRole('heading', { name: '7 спеціалістів' })
    const toggle = screen.getByRole('button', { name: 'Фільтри, активних: 2' })
    expect(toggle).toHaveAttribute('aria-haspopup', 'dialog')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle.querySelector('.pc2-discovery__filters-count')).toHaveTextContent('2')
  })

  it('opens the sheet, locks scroll, focuses inside, and closes with Escape returning focus', async () => {
    await renderView()
    await screen.findByRole('heading', { name: '7 спеціалістів' })
    const toggle = screen.getByRole('button', { name: 'Фільтри' })
    expect(sheet()).not.toHaveClass('is-open')
    expect(dialog()).toHaveAttribute('aria-hidden', 'true')
    await fireEvent.click(toggle)
    expect(sheet()).toHaveClass('is-open')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(dialog()).toHaveAttribute('aria-modal', 'true')
    expect(document.body.style.overflow).toBe('hidden')
    await waitFor(() => expect(dialog().contains(document.activeElement)).toBe(true))
    await fireEvent.keyDown(document, { key: 'Escape' })
    expect(sheet()).not.toHaveClass('is-open')
    expect(document.body.style.overflow).toBe('')
    await waitFor(() => expect(document.activeElement).toBe(toggle))
  })

  it('offers only API-supported filter groups and no invented availability or sort claims', async () => {
    await renderView()
    await screen.findByRole('heading', { name: '7 спеціалістів' })
    const groups = Array.from(dialog().querySelectorAll('legend')).map((legend) => legend.textContent)
    expect(groups).toEqual(['Спосіб пошуку', 'Формат'])
    expect(document.body.textContent).not.toMatch(/Ціна за сесію|Мова|Цього тижня|Найближче|найближчим вільним часом/)
  })

  it('applies format through the existing route state and shows the live API total', async () => {
    const { router } = await renderView()
    await screen.findByRole('heading', { name: '7 спеціалістів' })
    await fireEvent.click(screen.getByRole('button', { name: 'Фільтри' }))
    expect(screen.getByRole('button', { name: 'Показати 7 спеціалістів' })).toBeInTheDocument()
    mocks.discovery.mockResolvedValueOnce(response(3))
    await fireEvent.click(screen.getByLabelText('Онлайн', { selector: 'input[name="sheet-format"]' }))
    await waitFor(() => expect(router.currentRoute.value.query.format).toBe('online'))
    expect(mocks.discovery).toHaveBeenLastCalledWith(expect.objectContaining({ format: 'online' }))
    expect(await screen.findByRole('button', { name: 'Показати 3 спеціалісти' })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Показати 3 спеціалісти' }))
    expect(sheet()).not.toHaveClass('is-open')
  })

  it('closes from the backdrop, resets through the shared reset, and closes on navigation', async () => {
    const { router } = await renderView('/specialists?format=offline')
    await screen.findByRole('heading', { name: '7 спеціалістів' })
    await fireEvent.click(screen.getByRole('button', { name: 'Фільтри, активних: 1' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Скинути' }))
    await waitFor(() => expect(router.currentRoute.value.query.format).toBeUndefined())
    await fireEvent.click(document.querySelector('.pc2-discovery-sheet__backdrop')!)
    expect(sheet()).not.toHaveClass('is-open')
    await fireEvent.click(screen.getByRole('button', { name: 'Фільтри' }))
    await router.push('/s/olena')
    await waitFor(() => expect(document.body.style.overflow).toBe(''))
  })

  it('renders compact card data from the API only', async () => {
    const { container } = await renderView()
    await screen.findByRole('heading', { name: '7 спеціалістів' })
    expect(container.querySelector('.pc2-specialist-card__line')).toHaveTextContent('Онлайн та офлайн · Київ · 900 грн')
    expect(container.querySelector('.pc2-specialist-card__open')).toHaveTextContent('Профіль →')
    expect(container.querySelector('.pc2-specialist-card')).toHaveAttribute('href', '/s/olena')
  })

  it('does not mount the sheet in UI v1', async () => {
    applyUiVersion('v1')
    await renderView()
    await screen.findByRole('heading', { name: '7 спеціалістів' })
    expect(document.querySelector('.pc2-discovery-sheet')).toBeNull()
    expect(screen.queryByRole('button', { name: /^Фільтри/ })).toBeNull()
  })
})
