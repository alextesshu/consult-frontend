import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminSpecialistsSearchView from './AdminSpecialistsSearchView.vue'
import { formatUkDateTimeCompact } from '../lib/dateTime'
import { fetchAdminSpecialistSearch, type AdminSpecialistSearchItem } from '../lib/api'

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return { ...actual, fetchAdminSpecialistSearch: vi.fn(), getApiErrorMessage: vi.fn(() => 'Request failed') }
})

const mockedFetchAdminSpecialistSearch = vi.mocked(fetchAdminSpecialistSearch)

function buildSpecialist(overrides: Partial<AdminSpecialistSearchItem> = {}): AdminSpecialistSearchItem {
  return {
    id: 2,
    username: 'olena',
    email: 'olena@example.test',
    created_at: '2026-08-30T10:30:00Z',
    display_name: 'Олена К.',
    slug: 'olena',
    public_profile_enabled: true,
    base_plan: 'START',
    effective_plan: 'PRO',
    active_trial: false,
    active_override: false,
    crm_summary: {
      readiness: { is_ready: true, completed_count: 6, total_count: 6, missing_items: [] },
      visibility: { state: 'direct_link_only', public_profile_path: '/s/olena' },
      onboarding: { template_a_sent: true, template_b_sent: false, template_b_variant: null },
    },
    ...overrides,
  }
}

async function renderView(initialPath = '/admin/specialists') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/admin/specialists', name: 'admin-specialists', component: AdminSpecialistsSearchView },
      { path: '/admin/specialists/:id(\\d+)', name: 'admin-specialist-detail', component: { template: '<div>Specialist detail</div>' } },
      { path: '/admin/inbox', name: 'admin-inbox', component: { template: '<div>Inbox</div>' } },
    ],
  })
  await router.push(initialPath)
  await router.isReady()
  render(AdminSpecialistsSearchView, { global: { plugins: [router] } })
  return { router }
}

function rowFor(name: string) {
  return screen.getByRole('heading', { name }).closest('tr') as HTMLElement
}

describe('AdminSpecialistsSearchView', () => {
  beforeEach(() => {
    mockedFetchAdminSpecialistSearch.mockReset()
    mockedFetchAdminSpecialistSearch.mockResolvedValue({ count: 1, results: [buildSpecialist()] })
  })

  it('loads the registry request and renders the server-delivered newest-first table order', async () => {
    const newest = buildSpecialist({ id: 4, username: 'maria', display_name: 'Марія І.', created_at: '2026-08-30T11:30:00Z' })
    const older = buildSpecialist({ id: 2, username: 'olena', display_name: 'Олена К.' })
    mockedFetchAdminSpecialistSearch.mockResolvedValue({ count: 2, results: [newest, older] })

    await renderView()
    await screen.findByRole('heading', { name: 'Марія І.' })

    expect(mockedFetchAdminSpecialistSearch).toHaveBeenCalledWith({ limit: 100 })
    expect(screen.getByText('Спеціалістів: 2')).toBeInTheDocument()
    expect(screen.getByText('Показано: 2 із 2')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual(['Марія І.', 'Олена К.'])
    for (const header of ['Спеціаліст', 'Реєстрація', 'Готовність', 'Видимість', 'Тариф', 'Онбординг', 'Дії']) {
      expect(screen.getByRole('columnheader', { name: header })).toBeInTheDocument()
    }
    expect(within(rowFor('Марія І.')).getByText(formatUkDateTimeCompact(newest.created_at))).toBeInTheDocument()
  })

  it('renders compact readiness, visibility, effective plan, onboarding, and public profile action', async () => {
    await renderView()
    const row = await waitFor(() => rowFor('Олена К.'))

    expect(within(row).getByText('6/6 ✓')).toHaveClass('status-pill--ok')
    expect(within(row).getByText('За прямим посиланням')).toHaveClass('status-pill--ok')
    expect(within(row).getByText('PRO')).toBeInTheDocument()
    expect(within(row).getByText('A ✓')).toBeInTheDocument()
    expect(within(row).getByText('B —')).toBeInTheDocument()
    expect(within(row).getByRole('link', { name: 'Профіль' })).toHaveAttribute('href', '/s/olena')
  })

  it('keeps all filters and their filtered count', async () => {
    mockedFetchAdminSpecialistSearch.mockResolvedValue({
      count: 3,
      results: [
        buildSpecialist(),
        buildSpecialist({
          id: 3, username: 'maria', display_name: 'Марія І.', effective_plan: 'LEADER',
          crm_summary: {
            ...buildSpecialist().crm_summary!,
            readiness: { is_ready: false, completed_count: 2, total_count: 6, missing_items: [] },
            visibility: { state: 'search_visible', public_profile_path: '/s/maria' },
          },
        }),
        buildSpecialist({
          id: 4, username: 'ira', display_name: 'Ірина П.', effective_plan: 'START',
          crm_summary: { ...buildSpecialist().crm_summary!, visibility: { state: 'unpublished', public_profile_path: null } },
        }),
      ],
    })
    await renderView()
    await screen.findByRole('heading', { name: 'Олена К.' })

    await fireEvent.update(screen.getByLabelText('Готовність'), 'not_ready')
    expect(screen.getByText('Показано: 1 із 3')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Марія І.' })).toBeInTheDocument()
    expect(within(rowFor('Марія І.')).getByText('2/6')).toHaveClass('status-pill--warn')

    await fireEvent.update(screen.getByLabelText('Готовність'), 'all')
    await fireEvent.update(screen.getByLabelText('Видимість профілю'), 'unpublished')
    expect(screen.getByRole('heading', { name: 'Ірина П.' })).toBeInTheDocument()

    await fireEvent.update(screen.getByLabelText('Видимість профілю'), 'all')
    await fireEvent.update(screen.getByLabelText('Фактичний тариф'), 'LEADER')
    expect(screen.getByRole('heading', { name: 'Марія І.' })).toBeInTheDocument()
  })

  it('keeps search deep links and restores the full registry when cleared', async () => {
    const { router } = await renderView('/admin/specialists?q=olena')
    await waitFor(() => expect(mockedFetchAdminSpecialistSearch).toHaveBeenCalledWith({ q: 'olena', limit: 100 }))

    const input = screen.getByLabelText('Введіть email, логін, слаг або ім’я')
    await fireEvent.update(input, 'maria')
    await fireEvent.click(screen.getByRole('button', { name: 'Знайти' }))
    await waitFor(() => expect(mockedFetchAdminSpecialistSearch).toHaveBeenLastCalledWith({ q: 'maria', limit: 100 }))
    expect(router.currentRoute.value.query.q).toBe('maria')

    await fireEvent.click(screen.getByRole('button', { name: 'Очистити' }))
    await waitFor(() => expect(mockedFetchAdminSpecialistSearch).toHaveBeenLastCalledWith({ limit: 100 }))
    expect(router.currentRoute.value.query.q).toBeUndefined()
  })

  it('keeps distinct no-search-results and no-filter-results empty states', async () => {
    mockedFetchAdminSpecialistSearch.mockResolvedValueOnce({ count: 0, results: [] })
    await renderView('/admin/specialists?q=missing')
    expect(await screen.findByText('За запитом нічого не знайдено')).toBeInTheDocument()

    mockedFetchAdminSpecialistSearch.mockResolvedValueOnce({ count: 1, results: [buildSpecialist()] })
    await renderView()
    await screen.findByRole('heading', { name: 'Олена К.' })
    await fireEvent.update(screen.getByLabelText('Фактичний тариф'), 'LEADER')
    expect(screen.getByText('За активними фільтрами нічого не знайдено')).toBeInTheDocument()
  })

  it('navigates from a row and its detail control without creating a public action for invalid visibility', async () => {
    mockedFetchAdminSpecialistSearch.mockResolvedValue({
      count: 1,
      results: [buildSpecialist({ crm_summary: { ...buildSpecialist().crm_summary!, visibility: { state: 'invalid', public_profile_path: '/s/olena' } } })],
    })
    const { router } = await renderView()
    const row = await waitFor(() => rowFor('Олена К.'))

    expect(within(row).getByText('Некоректний стан')).toHaveClass('status-pill--warn')
    expect(within(row).queryByRole('link', { name: 'Профіль' })).not.toBeInTheDocument()
    await fireEvent.keyDown(row, { key: 'Enter' })
    await waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/admin/specialists/2'))
  })

  it('navigates from the compact detail action without bubbling through the row', async () => {
    const { router } = await renderView()
    const row = await waitFor(() => rowFor('Олена К.'))

    await fireEvent.click(within(row).getByRole('button', { name: 'Деталка' }))

    await waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/admin/specialists/2'))
  })

  it('keeps loading and error handling', async () => {
    let resolveSearch: (value: { count: number; results: AdminSpecialistSearchItem[] }) => void = () => {}
    mockedFetchAdminSpecialistSearch.mockReturnValue(new Promise((resolve) => { resolveSearch = resolve }))
    await renderView()
    expect(screen.getByText('Завантаження…')).toBeInTheDocument()
    resolveSearch({ count: 1, results: [buildSpecialist()] })
    await screen.findByRole('heading', { name: 'Олена К.' })

    mockedFetchAdminSpecialistSearch.mockRejectedValueOnce(new Error('boom'))
    await fireEvent.click(screen.getByRole('button', { name: 'Знайти' }))
    expect(await screen.findByText('Request failed')).toBeInTheDocument()
  })
})
