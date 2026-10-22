import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PublicTherapistsView from './PublicTherapistsView.vue'
import { applyUiVersion } from '../lib/uiVersion'
import { productAnalytics } from '../lib/productAnalytics'

const discoveryMocks = vi.hoisted(() => {
  const discovery = vi.fn()
  return {
    discovery,
    legacy: vi.fn(),
    discoveryError: vi.fn(),
    rotatedDiscovery: vi.fn((params: Record<string, unknown>) => {
      const { shuffle_seed: _shuffleSeed, ...legacyParams } = params
      return discovery(legacyParams)
    }),
  }
})

vi.mock('../lib/api', () => ({
  fetchPublicSpecialistDiscovery: discoveryMocks.discovery,
  fetchPublicSpecialists: discoveryMocks.legacy,
  getPublicSpecialistDiscoveryError: discoveryMocks.discoveryError,
}))

vi.mock('../lib/specialistDiscoveryApi', () => ({
  fetchRotatedPublicSpecialistDiscovery: discoveryMocks.rotatedDiscovery,
}))

vi.mock('../lib/productAnalytics', () => ({
  productAnalytics: { capture: vi.fn() },
}))

const discovery = discoveryMocks.discovery
const legacy = discoveryMocks.legacy
const discoveryError = discoveryMocks.discoveryError

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
      {
        path: '/specialists/psychological-support',
        component: PublicTherapistsView,
        meta: { discoveryLanding: 'psychological_support' },
      },
      { path: '/s/:slug', component: { template: '<div>Profile</div>' } },
      { path: '/signup-client', component: { template: '<div>Client signup</div>' } },
      { path: '/', component: { template: '<div>Home</div>' } },
    ],
  })
  await router.push(path)
  await router.isReady()
  return { router, ...render(PublicTherapistsView, { global: { plugins: [router] } }) }
}

describe('PublicTherapistsView', () => {
  beforeEach(() => {
    applyUiVersion('v1')
    discovery.mockReset()
    discovery.mockResolvedValue(response())
    discoveryMocks.rotatedDiscovery.mockClear()
    legacy.mockReset()
    discoveryError.mockReset()
    discoveryError.mockReturnValue(null)
    vi.mocked(productAnalytics.capture).mockReset()
  })

  it('keeps v1 markup unchanged by default and adds only opted-in discovery presentation', async () => {
    const { container } = await renderView()
    expect(await screen.findByRole('heading', { name: '1 спеціаліст' })).toBeInTheDocument()
    const before = container.innerHTML
    expect(container.querySelector('.pc2-discovery')).toBeNull()
    expect(screen.queryByText('Кабінет клієнта — за бажанням')).not.toBeInTheDocument()
    applyUiVersion('v2')
    await waitFor(() => expect(container.querySelector('.pc2-discovery')).not.toBeNull())
    expect(screen.getByText('Перше звернення — без реєстрації.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Створити кабінет' })).toHaveAttribute('href', '/signup-client')
    expect(container.querySelectorAll('#discovery-query')).toHaveLength(1)
    expect(container.querySelectorAll('.pc2-chips').length).toBeGreaterThan(1)
    expect(container.querySelector('.pc2-card--interactive')).not.toBeNull()
    expect(discovery).toHaveBeenCalledTimes(1)
    applyUiVersion('v1')
    await waitFor(() => expect(container.innerHTML).toBe(before))
  })

  it('preserves draft, applied filters, validation and explicit-submit behavior across v2/v1', async () => {
    applyUiVersion('v2')
    const { router } = await renderView()
    await screen.findByRole('heading', { name: '1 спеціаліст' })
    const query = () => screen.getByLabelText('Опишіть запит своїми словами')
    await fireEvent.update(query(), 'тр')
    await fireEvent.submit(query().closest('form')!)
    expect(await screen.findByRole('alert')).toHaveTextContent('щонайменше 3 символи')
    expect(discovery).toHaveBeenCalledTimes(1)
    applyUiVersion('v1')
    await waitFor(() => expect(query()).toHaveValue('тр'))
    expect(screen.getByText('Запит має містити щонайменше 3 символи.')).toBeInTheDocument()
    applyUiVersion('v2')
    await fireEvent.update(query(), 'тривога')
    expect(discovery).toHaveBeenCalledTimes(1)
    await fireEvent.submit(query().closest('form')!)
    await waitFor(() => expect(discovery).toHaveBeenLastCalledWith({ q: 'тривога' }))
    await fireEvent.click(screen.getByRole('radio', { name: 'Онлайн' }))
    await waitFor(() => expect(discovery).toHaveBeenLastCalledWith({ q: 'тривога', format: 'online' }))
    expect(router.currentRoute.value.query).toEqual({ q: 'тривога', format: 'online' })
    expect(screen.queryByRole('navigation', { name: 'Сторінки каталогу' })).not.toBeInTheDocument()
  })

  it('retains URL pagination requests in v2 without introducing pagination controls', async () => {
    applyUiVersion('v2')
    discovery.mockResolvedValue(response({ page: 2, total: 51, total_pages: 2 }))
    await renderView('/specialists?page=2')
    expect(await screen.findByRole('heading', { name: '51 спеціаліст' })).toBeInTheDocument()
    expect(discovery).toHaveBeenCalledWith({ page: 2 })
    expect(screen.queryByRole('navigation', { name: 'Сторінки каталогу' })).not.toBeInTheDocument()
  })

  it('retains legacy lookup values and results when switching v2/v1 without duplicate fields', async () => {
    applyUiVersion('v2')
    legacy.mockResolvedValue({ results: [item], total: 1, page: 1, total_pages: 1 })
    const { container } = await renderView()
    await screen.findByRole('heading', { name: '1 спеціаліст' })
    const input = () => screen.getByLabelText('Ім’я або посилання')
    await fireEvent.update(input(), '/s/olena')
    await fireEvent.submit(input().closest('form')!)
    await waitFor(() => expect(legacy).toHaveBeenCalledWith({ name: 'olena', page_size: 5 }))
    expect(container.querySelectorAll('#legacy-specialist-search')).toHaveLength(1)
    await waitFor(() => expect(container.querySelector('.pc2-discovery__lookup .result-card')).not.toBeNull())
    applyUiVersion('v1')
    await waitFor(() => expect(input()).toHaveValue('olena'))
    expect(container.querySelector('.discovery-controls .legacy-lookup .result-card')).not.toBeNull()
    expect(legacy).toHaveBeenCalledTimes(1)
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

  it('loads unfiltered specialists and renders the count and first card without search interaction', async () => {
    await renderView()

    expect(await screen.findByRole('heading', { name: '1 спеціаліст' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Олена Коваль/ })).toBeInTheDocument()
    expect(discovery).toHaveBeenCalledTimes(1)
    expect(discovery).toHaveBeenCalledWith({})
    expect(legacy).not.toHaveBeenCalled()
  })

  it('renders the approved landing copy and reuses direction discovery results', async () => {
    discovery.mockResolvedValue(response({
      applied_filters: { request_group: null, direction: 'psychological_support', format: null },
      groups: [
        { code: 'matches_request', label: 'Працюють із вашим запитом', total: 1, items: [item] },
        { code: 'related_matches', label: 'Також можуть підійти', total: 0, items: [] },
        { code: 'other_specialists', label: 'Інші спеціалісти Pro Consult', total: 1, items: [{ ...item, slug: 'ivan', public_slug: 'ivan', public_profile_path: '/s/ivan' }] },
      ],
    }))

    await renderView('/specialists/psychological-support')

    expect(await screen.findByRole('heading', { level: 1, name: 'Психологічна допомога' })).toBeInTheDocument()
    expect(screen.getByText('Тут зібрані спеціалісти, які працюють у напрямі психологічної допомоги. Ви можете переглянути їхні професійні сторінки, теми роботи, формат і умови консультацій, а потім звернутися до обраного спеціаліста безпосередньо через Pro Consult.')).toBeInTheDocument()
    await waitFor(() => expect(discovery).toHaveBeenLastCalledWith({ direction: 'psychological_support' }))
    expect(screen.getByRole('heading', { level: 2, name: 'Працюють із вашим запитом' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Інші спеціалісти Pro Consult' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Переглянути всіх спеціалістів' })).toHaveAttribute('href', '/specialists')
  })

  it('links the approved direction from general discovery and leaves the landing for another direction', async () => {
    const { router } = await renderView('/specialists')

    await fireEvent.click(screen.getByRole('radio', { name: 'За професійним напрямом' }))
    const landingLink = await screen.findByRole('link', { name: 'Психологічна допомога' })
    expect(landingLink).toHaveAttribute('href', '/specialists/psychological-support')
    await fireEvent.click(landingLink)
    await waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/specialists/psychological-support'))

    await fireEvent.click(await screen.findByRole('radio', { name: 'Наставництво та розвиток' }))
    await waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/specialists?mode=direction&direction=development_guidance'))
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
    const directions = await screen.findAllByRole('radio', { name: /Наставництво та розвиток|Навчання та професійний супровід/ })
    expect(directions.every((radio) => radio.getAttribute('name') === 'specialist-direction')).toBe(true)
    expect(directions.map((radio) => radio.getAttribute('value'))).toContain('development_guidance')
    expect(screen.getByRole('link', { name: 'Психологічна допомога' })).toHaveAttribute('href', '/specialists/psychological-support')
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

  it('does not render pagination even when the API reports more than one page', async () => {
    discovery.mockResolvedValue(response({ page: 1, page_size: 50, total: 51, total_pages: 2 }))
    await renderView()

    expect(await screen.findByRole('heading', { name: '51 спеціаліст' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Сторінки каталогу' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Попередня' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Наступна' })).not.toBeInTheDocument()
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
    await fireEvent.click(details.querySelector('summary')!)
    expect(details.open).toBe(true)
    const input = screen.getByLabelText('Ім’я або посилання')
    await fireEvent.update(input, 'Ол')
    await fireEvent.submit(input.closest('form')!)
    expect(screen.getByText('Введіть щонайменше 3 символи для пошуку.')).toBeInTheDocument()
    expect(legacy).not.toHaveBeenCalled()

    await fireEvent.update(input, 'https://proconsult.space/s/olena')
    await fireEvent.submit(input.closest('form')!)
    await waitFor(() => expect(legacy).toHaveBeenCalledWith({ name: 'olena', page_size: 5 }))
  })

  it('renders one collapsed exact lookup inside discovery controls before the directory results', async () => {
    await renderView()

    const lookups = screen.getAllByText('Знайти конкретного спеціаліста')
    const details = lookups[0]!.closest('details') as HTMLDetailsElement
    const controls = document.querySelector('.discovery-controls')!
    const count = await screen.findByRole('heading', { name: '1 спеціаліст' })
    const card = screen.getByRole('link', { name: /Олена Коваль/ })

    expect(lookups).toHaveLength(1)
    expect(details.parentElement).toBe(controls)
    expect(document.querySelector('.discovery-page > .legacy-lookup')).toBeNull()
    expect(details.open).toBe(false)
    expect(details.compareDocumentPosition(count) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(details.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    await fireEvent.click(details.querySelector('summary')!)
    expect(details.open).toBe(true)
    expect(screen.getByLabelText('Ім’я або посилання')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Знайти профіль' })).toBeInTheDocument()
  })

  it('falls back to public_slug when a discovery path is nullable', async () => {
    discovery.mockResolvedValue(response({
      groups: [{ code: 'all_specialists', label: 'Усі спеціалісти Pro Consult', total: 1, items: [{ ...item, public_profile_path: null, public_profile_url: null, public_slug: 'fallback-slug', slug: '' }] }],
    }))
    await renderView()
    expect((await screen.findByRole('link', { name: /Олена Коваль/ }))).toHaveAttribute('href', '/s/fallback-slug')
  })
})
