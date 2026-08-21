import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchPublicSpecialistDiscovery, fetchPublicSpecialists, getPublicSpecialistDiscoveryError } from '../lib/api'
import PublicTherapistsView from './PublicTherapistsView.vue'
import { productAnalytics } from '../lib/productAnalytics'

vi.mock('../lib/api', () => ({
  fetchPublicSpecialistDiscovery: vi.fn(),
  fetchPublicSpecialists: vi.fn(),
  getPublicSpecialistDiscoveryError: vi.fn(),
}))

vi.mock('../lib/productAnalytics', () => ({
  productAnalytics: { capture: vi.fn() },
}))

const discovery = vi.mocked(fetchPublicSpecialistDiscovery)
const legacy = vi.mocked(fetchPublicSpecialists)
const discoveryError = vi.mocked(getPublicSpecialistDiscoveryError)

const item = {
  slug: 'olena',
  public_slug: 'olena',
  public_profile_path: '/s/olena',
  public_profile_url: 'https://example.test/s/olena',
  display_name: 'Олена Коваль',
  public_display_name: 'Олена Коваль',
  public_profile_summary: 'Працюю з тривогою.',
  specializations: ['Тривога'],
  location: 'Київ',
  offers_online: true,
  offers_offline: false,
  photo_url: null,
  match_kind: null,
}

function response(overrides: Record<string, unknown> = {}) {
  return {
    query: null,
    resolved_request_groups: [],
    applied_filters: { request_group: null, direction: null, format: null },
    groups: [{ code: 'all_specialists', label: 'Усі спеціалісти Pro Consult', total: 1, items: [item] }],
    page: 1,
    page_size: 12,
    total: 1,
    total_pages: 1,
    ...overrides,
  } as any
}

async function renderView(path = '/specialists') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/specialists', component: PublicTherapistsView },
      { path: '/s/:slug', component: { template: '<div>Profile</div>' } },
      { path: '/', component: { template: '<div>Home</div>' } },
    ],
  })
  await router.push(path)
  await router.isReady()
  return { router, ...render(PublicTherapistsView, { global: { plugins: [router] } }) }
}

describe('PublicTherapistsView', () => {
  beforeEach(() => {
    discovery.mockReset()
    discovery.mockResolvedValue(response())
    legacy.mockReset()
    discoveryError.mockReset()
    discoveryError.mockReturnValue(null)
    vi.mocked(productAnalytics.capture).mockReset()
  })

  it('captures the discovery open and each non-empty route state without filter properties', async () => {
    discovery.mockReset()
    discovery.mockResolvedValueOnce(response()).mockResolvedValueOnce(response())
    const { router } = await renderView('/specialists?q=тривога')

    await waitFor(() => expect(productAnalytics.capture).toHaveBeenCalledWith('specialist_discovery_opened'))
    await waitFor(() => expect(productAnalytics.capture).toHaveBeenCalledWith('specialist_discovery_results_viewed'))
    expect(productAnalytics.capture).toHaveBeenCalledTimes(2)

    await router.replace('/specialists?q=тривога')
    expect(productAnalytics.capture).toHaveBeenCalledTimes(2)

    await router.push('/specialists?format=online')
    await waitFor(() => expect(productAnalytics.capture).toHaveBeenCalledTimes(3))
    expect(productAnalytics.capture).toHaveBeenLastCalledWith('specialist_discovery_results_viewed')
  })

  it('does not capture results for empty or failed discovery responses', async () => {
    discovery.mockResolvedValueOnce(response({ total: 1, total_pages: 1, groups: [{ code: 'all_specialists', label: 'All', total: 1, items: [] }] }))
    await renderView()
    await waitFor(() => expect(productAnalytics.capture).toHaveBeenCalledWith('specialist_discovery_opened'))
    expect(productAnalytics.capture).not.toHaveBeenCalledWith('specialist_discovery_results_viewed')

    vi.mocked(productAnalytics.capture).mockReset()
    discovery.mockRejectedValueOnce(new Error('network'))
    await renderView()
    await waitFor(() => expect(screen.getByText('Не вдалося завантажити спеціалістів')).toBeInTheDocument())
    expect(productAnalytics.capture).toHaveBeenCalledWith('specialist_discovery_opened')
    expect(productAnalytics.capture).not.toHaveBeenCalledWith('specialist_discovery_results_viewed')
  })

  it('renders native desktop radios and a mobile request-group select with canonical values', async () => {
    await renderView()
    const modes = screen.getAllByRole('radio', { name: /За запитом|За професійним напрямом/ })
    expect(modes.map((radio) => radio.getAttribute('name'))).toEqual(['specialist-discovery-mode', 'specialist-discovery-mode'])
    expect(modes.map((radio) => radio.getAttribute('value'))).toEqual(['request', 'direction'])

    const requestGroups = screen.getAllByRole('radio', { name: /Емоційний стан|Стосунки та сім’я|Інший запит/ })
    expect(requestGroups.every((radio) => radio.getAttribute('name') === 'specialist-request-group')).toBe(true)
    expect(requestGroups.map((radio) => radio.getAttribute('value'))).toContain('emotional_state')
    expect(requestGroups).not.toHaveLength(0)
    expect(requestGroups[0]!.closest('.request-group-controls__desktop')).not.toBeNull()

    const select = screen.getByLabelText('Оберіть категорію запиту') as HTMLSelectElement
    expect(select.closest('.request-group-controls__mobile')).not.toBeNull()
    expect([...select.options].map((option) => [option.value, option.text])).toEqual([
      ['', 'Усі запити'],
      ['emotional_state', 'Емоційний стан'],
      ['relationships_family', 'Стосунки та сім’я'],
      ['self_esteem_change', 'Самооцінка та особисті зміни'],
      ['work_career_burnout', 'Робота, кар’єра та вигорання'],
      ['loss_life_changes', 'Втрата та життєві зміни'],
      ['professional_development', 'Професійний розвиток і навчання'],
      ['other_request', 'Інший запит'],
    ])

    await fireEvent.click(screen.getByRole('radio', { name: 'За професійним напрямом' }))
    const directions = await screen.findAllByRole('radio', { name: /Психологічна допомога|Наставництво та розвиток|Навчання та професійний супровід/ })
    expect(directions.every((radio) => radio.getAttribute('name') === 'specialist-direction')).toBe(true)
    expect(directions.map((radio) => radio.getAttribute('value'))).toContain('psychological_support')
  })

  it('reflects native selected states and allows request-group clearing', async () => {
    await renderView()
    const group = screen.getByRole('radio', { name: 'Емоційний стан' }) as HTMLInputElement
    await fireEvent.click(group)
    await waitFor(() => expect(group.checked).toBe(true))
    await fireEvent.click(
      await screen.findByRole('button', { name: 'Очистити категорію' }),
    )
    await waitFor(() => expect(group.checked).toBe(false))

    const directionMode = screen.getByRole('radio', { name: 'За професійним напрямом' }) as HTMLInputElement
    await fireEvent.click(directionMode)
    expect(directionMode.checked).toBe(true)
  })

  it('binds the mobile select to the same request-group state and clearing transition', async () => {
    await renderView('/specialists?q=тривога')
    const select = screen.getByLabelText('Оберіть категорію запиту') as HTMLSelectElement
    await fireEvent.update(select, 'emotional_state')
    await waitFor(() => expect(discovery).toHaveBeenLastCalledWith({ q: 'тривога', request_group: 'emotional_state' }))
    expect(screen.getByRole('radio', { name: 'Емоційний стан' })).toBeChecked()

    await fireEvent.update(select, '')
    await waitFor(() => expect(discovery).toHaveBeenLastCalledWith({ q: 'тривога' }))
  })

  it('submits q with Enter and sets then clears aria-invalid for local errors', async () => {
    await renderView()
    const input = screen.getByLabelText('Опишіть запит своїми словами') as HTMLInputElement
    await fireEvent.update(input, 'тр')
    await fireEvent.keyDown(input, { key: 'Enter' })
    await fireEvent.submit(input.closest('form')!)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby', 'discovery-query-error')

    discovery.mockClear()
    await fireEvent.update(input, 'тривога')
    await fireEvent.submit(input.closest('form')!)
    await waitFor(() => expect(discovery).toHaveBeenCalledWith({ q: 'тривога' }))
    expect(input).not.toHaveAttribute('aria-invalid')
  })

  it('renders returned group order, hides empty groups, and shows totals', async () => {
    discovery.mockResolvedValue(response({
      groups: [
        { code: 'matches_request', label: 'Працюють із вашим запитом', total: 3, items: [item] },
        { code: 'related_matches', label: 'Також можуть підійти', total: 0, items: [] },
        { code: 'other_specialists', label: 'Інші спеціалісти Pro Consult', total: 9, items: [{ ...item, slug: 'ivan', public_slug: 'ivan', public_profile_path: '/s/ivan', display_name: 'Іван' }] },
      ],
      total: 12,
      total_pages: 1,
    }))
    await renderView('/specialists?q=тривога')
    await screen.findByText('Працюють із вашим запитом')
    const headings = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    expect(headings.indexOf('Працюють із вашим запитом')).toBeLessThan(headings.indexOf('Інші спеціалісти Pro Consult'))
    expect(screen.queryByText('Також можуть підійти')).not.toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('9')).toBeInTheDocument()
  })

  it('renders one all-empty state', async () => {
    discovery.mockResolvedValue(response({ groups: [{ code: 'all_specialists', label: 'Усі спеціалісти Pro Consult', total: 0, items: [] }], total: 0, total_pages: 0 }))
    await renderView()
    expect(await screen.findByText('Каталог спеціалістів поки порожній')).toBeInTheDocument()
    expect(screen.queryByText('Усі спеціалісти Pro Consult')).not.toBeInTheDocument()
  })

  it('shows a pending direction instruction without results, totals, pagination, or an API request', async () => {
    await renderView('/specialists?mode=direction')

    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${window.location.origin}/specialists`
    )

    expect(await screen.findByText('Оберіть професійний напрям, щоб переглянути спеціалістів.')).toBeInTheDocument()
    expect(discovery).not.toHaveBeenCalled()
    expect(screen.queryAllByRole('heading', { level: 2 }).some((heading) => heading.textContent?.includes('спеціаліст'))).toBe(false)
    expect(screen.queryByRole('navigation', { name: 'Сторінки каталогу' })).not.toBeInTheDocument()
    expect(screen.queryByText('За вашим запитом поки немає результатів')).not.toBeInTheDocument()
  })

  it('renders the genuine active-search empty state only after a discovery response', async () => {
    discovery.mockResolvedValue(response({ total: 0, total_pages: 0, groups: [{ code: 'all_specialists', label: 'Усі спеціалісти Pro Consult', total: 0, items: [] }] }))
    await renderView('/specialists?q=тривога')
    expect(await screen.findByText('За вашим запитом поки немає результатів')).toBeInTheDocument()
    expect(screen.getByText('Спробуйте змінити категорію, опис запиту або формат роботи.')).toBeInTheDocument()
  })

  it.each([
    [0, '0 спеціалістів'],
    [1, '1 спеціаліст'],
    [2, '2 спеціалісти'],
    [5, '5 спеціалістів'],
    [11, '11 спеціалістів'],
    [21, '21 спеціаліст'],
    [22, '22 спеціалісти'],
    [25, '25 спеціалістів'],
  ])('inflects the specialist count for %i', async (total, label) => {
    discovery.mockResolvedValue(response({ total, total_pages: total ? 1 : 0 }))
    await renderView()
    expect(await screen.findByRole('heading', { name: label })).toBeInTheDocument()
  })

  it('keeps the compact home link accessible', async () => {
    await renderView()
    expect(screen.getByRole('link', { name: '← На головну' })).toHaveAttribute('href', '/')
  })

  it('uses global pagination controls and focuses only after explicit navigation', async () => {
    const focus = vi.spyOn(HTMLElement.prototype, 'focus')
    const scroll = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scroll,
    })
    discovery
      .mockResolvedValueOnce(response({ page: 1, total: 24, total_pages: 2 }))
      .mockResolvedValueOnce(response({ page: 2, total: 24, total_pages: 2 }))
    await renderView()
    expect(screen.getByRole('button', { name: 'Попередня' })).toBeDisabled()
    await fireEvent.click(screen.getByRole('button', { name: 'Наступна' }))
    await waitFor(() => expect(discovery).toHaveBeenLastCalledWith({ page: 2 }))
    await waitFor(() => expect(focus).toHaveBeenCalled())
    expect(scroll).toHaveBeenCalled()
    focus.mockRestore()
  })

  it('does not focus results after format, reset, or history changes', async () => {
    const focus = vi.spyOn(HTMLElement.prototype, 'focus')
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    })
    const { router } = await renderView()
    focus.mockClear()
    await fireEvent.click(screen.getByRole('radio', { name: 'Онлайн' }))
    await waitFor(() => expect(discovery).toHaveBeenLastCalledWith({ format: 'online' }))
    expect(focus).not.toHaveBeenCalled()
    await fireEvent.click(screen.getByRole('button', { name: 'Скинути пошук' }))
    await waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/specialists'))
    expect(focus).not.toHaveBeenCalled()
    await router.push('/specialists?q=тривога')
    await waitFor(() => expect(discovery).toHaveBeenLastCalledWith({ q: 'тривога' }))
    expect(focus).not.toHaveBeenCalled()
    focus.mockRestore()
  })

  it('renders structured q errors next to the search field', async () => {
    discovery.mockRejectedValueOnce(new Error('structured'))
    discoveryError.mockReturnValueOnce({ code: 'QUERY_TOO_SHORT', detail: 'Короткий запит.', field: 'q' })
    await renderView()
    const input = await screen.findByLabelText('Опишіть запит своїми словами')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Короткий запит.')).toBeInTheDocument()

  })

  it('renders a generic network error and retries the directory request', async () => {
    discovery.mockRejectedValueOnce(new Error('network'))
    discoveryError.mockReturnValueOnce(null)
    await renderView()

    expect(await screen.findByText('Не вдалося завантажити спеціалістів')).toBeInTheDocument()

    discovery.mockResolvedValueOnce(response())
    await fireEvent.click(screen.getByRole('button', { name: 'Спробувати ще раз' }))
    await waitFor(() => expect(discovery).toHaveBeenLastCalledWith({}))
  })

  it('keeps legacy lookup collapsed, validates short values, and normalizes pasted URLs', async () => {
    legacy.mockResolvedValue({ results: [], page: 1, page_size: 5, total: 0, total_pages: 0 })
    await renderView()
    const details = screen.getByText('Знайти конкретного спеціаліста').closest('details') as HTMLDetailsElement
    expect(details.open).toBe(false)
    details.open = true
    await fireEvent.click(details.querySelector('summary')!)
    const input = screen.getByLabelText('Ім’я або посилання')
    await fireEvent.update(input, 'Ол')
    await fireEvent.submit(input.closest('form')!)
    expect(screen.getByText('Введіть щонайменше 3 символи для пошуку.')).toBeInTheDocument()
    expect(legacy).not.toHaveBeenCalled()

    await fireEvent.update(input, 'https://proconsult.space/s/olena')
    await fireEvent.submit(input.closest('form')!)
    await waitFor(() => expect(legacy).toHaveBeenCalledWith({ name: 'olena', page_size: 5 }))
  })

  it('renders one collapsed exact lookup above the directory count and cards', async () => {
    await renderView()

    const lookups = screen.getAllByText('Знайти конкретного спеціаліста')
    const details = lookups[0]!.closest('details') as HTMLDetailsElement
    const count = await screen.findByRole('heading', { name: '1 спеціаліст' })
    const card = screen.getByRole('link', { name: /Олена Коваль/ })

    expect(lookups).toHaveLength(1)
    expect(details.open).toBe(false)
    expect(details.compareDocumentPosition(count) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(details.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    details.open = true
    expect(details).toHaveAttribute('open')
    expect(screen.getByLabelText('Ім’я або посилання')).toBeInTheDocument()
  })

  it('falls back to public_slug when a discovery path is nullable', async () => {
    discovery.mockResolvedValue(response({
      groups: [{ code: 'all_specialists', label: 'Усі спеціалісти Pro Consult', total: 1, items: [{ ...item, public_profile_path: null, public_profile_url: null, public_slug: 'fallback-slug', slug: '' }] }],
    }))
    await renderView()
    expect((await screen.findByRole('link', { name: /Олена Коваль/ }))).toHaveAttribute('href', '/s/fallback-slug')
  })
})
