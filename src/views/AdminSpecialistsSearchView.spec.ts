import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminSpecialistsSearchView from './AdminSpecialistsSearchView.vue'
import { fetchAdminSpecialistSearch, type AdminSpecialistSearchItem } from '../lib/api'

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    fetchAdminSpecialistSearch: vi.fn(),
    getApiErrorMessage: vi.fn(() => 'Request failed'),
  }
})

const mockedFetchAdminSpecialistSearch = vi.mocked(fetchAdminSpecialistSearch)

function buildSpecialist(
  overrides: Partial<AdminSpecialistSearchItem> = {}
): AdminSpecialistSearchItem {
  return {
    id: 2,
    username: 'olena',
    email: 'olena@example.test',
    display_name: 'Олена К.',
    slug: 'olena',
    public_profile_enabled: true,
    base_plan: 'START',
    effective_plan: 'PRO',
    active_trial: false,
    active_override: false,
    crm_summary: {
      readiness: {
        is_ready: true,
        completed_count: 6,
        total_count: 6,
        missing_items: [],
      },
      visibility: {
        state: 'unpublished',
        public_profile_path: '/s/olena',
      },
      onboarding: {
        template_a_sent: true,
        template_b_sent: false,
        template_b_variant: null,
      },
    },
    ...overrides,
  }
}

async function renderView(initialPath = '/admin/specialists?q=olena') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/admin/specialists',
        name: 'admin-specialists',
        component: AdminSpecialistsSearchView,
      },
      {
        path: '/admin/specialists/:id(\\d+)',
        name: 'admin-specialist-detail',
        component: { template: '<div>Specialist detail</div>' },
      },
      {
        path: '/admin/inbox',
        name: 'admin-inbox',
        component: { template: '<div>Inbox</div>' },
      },
    ],
  })

  await router.push(initialPath)
  await router.isReady()

  render(AdminSpecialistsSearchView, {
    global: {
      plugins: [router],
    },
  })

  return { router }
}

function cardFor(name: string) {
  return screen.getByRole('heading', { name }).closest('article') as HTMLElement
}

describe('AdminSpecialistsSearchView', () => {
  beforeEach(() => {
    mockedFetchAdminSpecialistSearch.mockReset()
    mockedFetchAdminSpecialistSearch.mockResolvedValue({
      count: 1,
      results: [buildSpecialist()],
    })
  })

  it('renders ready unpublished CRM summary without public profile action', async () => {
    await renderView()

    await waitFor(() => {
      expect(mockedFetchAdminSpecialistSearch).toHaveBeenCalledWith({ q: 'olena', limit: 50 })
    })

    const card = cardFor('Олена К.')
    expect(within(card).getByText('Профіль готовий')).toBeInTheDocument()
    expect(within(card).getByText('Не опубліковано')).toBeInTheDocument()
    expect(within(card).getByText('Лист A: надіслано')).toBeInTheDocument()
    expect(within(card).getByText('Лист B: не зафіксовано')).toBeInTheDocument()
    expect(within(card).queryByRole('link', { name: 'Відкрити публічний профіль' })).not.toBeInTheDocument()
  })

  it('renders incomplete direct-link summary and active public profile action', async () => {
    mockedFetchAdminSpecialistSearch.mockResolvedValue({
      count: 1,
      results: [
        buildSpecialist({
          crm_summary: {
            readiness: {
              is_ready: false,
              completed_count: 2,
              total_count: 6,
              missing_items: ['about', 'topics', 'work_format', 'price_decision'],
            },
            visibility: {
              state: 'direct_link_only',
              public_profile_path: '/s/olena',
            },
            onboarding: {
              template_a_sent: false,
              template_b_sent: false,
              template_b_variant: null,
            },
          },
        }),
      ],
    })

    await renderView()

    const card = await screen.findByRole('heading', { name: 'Олена К.' })
    const article = card.closest('article') as HTMLElement
    expect(within(article).getByText('Заповнено 2 з 6')).toBeInTheDocument()
    expect(within(article).getByText('За прямим посиланням')).toBeInTheDocument()
    expect(within(article).getByRole('link', { name: 'Відкрити публічний профіль' })).toHaveAttribute(
      'href',
      '/s/olena'
    )
    expect(article.textContent || '').not.toMatch(/Основні запити|Теми й запити|Перший контакт/)
  })

  it('renders search-visible summary with public profile action', async () => {
    mockedFetchAdminSpecialistSearch.mockResolvedValue({
      count: 1,
      results: [
        buildSpecialist({
          crm_summary: {
            ...buildSpecialist().crm_summary!,
            visibility: {
              state: 'search_visible',
              public_profile_path: '/s/olena',
            },
          },
        }),
      ],
    })

    await renderView()

    const card = await screen.findByRole('heading', { name: 'Олена К.' })
    const article = card.closest('article') as HTMLElement
    expect(within(article).getByText('У пошуку')).toBeInTheDocument()
    expect(within(article).getByRole('link', { name: 'Відкрити публічний профіль' })).toHaveAttribute(
      'href',
      '/s/olena'
    )
  })

  it('renders invalid visibility as warning without public profile action', async () => {
    mockedFetchAdminSpecialistSearch.mockResolvedValue({
      count: 1,
      results: [
        buildSpecialist({
          crm_summary: {
            ...buildSpecialist().crm_summary!,
            visibility: {
              state: 'invalid',
              public_profile_path: '/s/olena',
            },
          },
        }),
      ],
    })

    await renderView()

    const article = cardFor('Олена К.')
    const invalidBadge = within(article).getByText('Некоректний стан')
    expect(invalidBadge).toBeInTheDocument()
    expect(invalidBadge).toHaveClass('status-pill--warn')
    expect(within(article).queryByRole('link', { name: 'Відкрити публічний профіль' })).not.toBeInTheDocument()
  })

  it('does not render a broken public profile action when published path is missing', async () => {
    mockedFetchAdminSpecialistSearch.mockResolvedValue({
      count: 1,
      results: [
        buildSpecialist({
          crm_summary: {
            ...buildSpecialist().crm_summary!,
            visibility: {
              state: 'direct_link_only',
              public_profile_path: null,
            },
          },
        }),
      ],
    })

    await renderView()

    const article = cardFor('Олена К.')
    expect(within(article).getByText('За прямим посиланням')).toBeInTheDocument()
    expect(within(article).queryByRole('link', { name: 'Відкрити публічний профіль' })).not.toBeInTheDocument()
  })

  it('renders neutral unavailable states when crm_summary is missing', async () => {
    mockedFetchAdminSpecialistSearch.mockResolvedValue({
      count: 1,
      results: [buildSpecialist({ crm_summary: null })],
    })

    await renderView()

    const article = cardFor('Олена К.')
    expect(within(article).getByText('Готовність недоступна')).toBeInTheDocument()
    expect(within(article).getByText('Видимість недоступна')).toBeInTheDocument()
    expect(within(article).getAllByText('Дані про листи недоступні')).toHaveLength(2)
    expect(within(article).getByRole('button', { name: 'Відкрити деталку' })).toBeInTheDocument()
  })

  it('renders onboarding statuses and raw Template B variant only as secondary metadata', async () => {
    mockedFetchAdminSpecialistSearch.mockResolvedValue({
      count: 1,
      results: [
        buildSpecialist({
          crm_summary: {
            ...buildSpecialist().crm_summary!,
            onboarding: {
              template_a_sent: false,
              template_b_sent: true,
              template_b_variant: 'B4_READY_PUBLIC_FEEDBACK',
            },
          },
        }),
      ],
    })

    await renderView()

    const article = cardFor('Олена К.')
    expect(within(article).getByText('Лист A: не зафіксовано')).toBeInTheDocument()
    expect(within(article).getByText('Лист B: надіслано')).toBeInTheDocument()
    const variant = within(article).getByText('Варіант: B4_READY_PUBLIC_FEEDBACK')
    expect(variant).toHaveClass('crm-summary__meta')
    expect(within(article).getByText('Лист B: надіслано')).not.toHaveTextContent('B4_READY_PUBLIC_FEEDBACK')
  })

  it('keeps each row CRM summary isolated', async () => {
    mockedFetchAdminSpecialistSearch.mockResolvedValue({
      count: 2,
      results: [
        buildSpecialist(),
        buildSpecialist({
          id: 3,
          username: 'maria',
          email: 'maria@example.test',
          display_name: 'Марія І.',
          slug: 'maria',
          crm_summary: null,
        }),
      ],
    })

    await renderView()

    const readyCard = cardFor('Олена К.')
    const missingCard = cardFor('Марія І.')
    expect(within(readyCard).getByText('Профіль готовий')).toBeInTheDocument()
    expect(within(missingCard).getByText('Готовність недоступна')).toBeInTheDocument()
  })

  it('preserves search, loading, empty, error, and detail navigation behavior', async () => {
    let resolveSearch: (value: { count: number; results: AdminSpecialistSearchItem[] }) => void = () => {}
    mockedFetchAdminSpecialistSearch.mockReturnValue(
      new Promise((resolve) => {
        resolveSearch = resolve
      })
    )

    const { router } = await renderView('/admin/specialists?q=loading')
    expect(screen.getByText('Завантаження…')).toBeInTheDocument()

    resolveSearch({ count: 0, results: [] })
    expect(await screen.findByText('Нічого не знайдено')).toBeInTheDocument()

    mockedFetchAdminSpecialistSearch.mockRejectedValueOnce(new Error('boom'))
    const input = screen.getByLabelText('Введіть email, логін, слаг або ім’я')
    await fireEvent.update(input, 'error')
    await fireEvent.click(screen.getByRole('button', { name: 'Знайти' }))
    expect(await screen.findByText('Request failed')).toBeInTheDocument()

    mockedFetchAdminSpecialistSearch.mockResolvedValueOnce({
      count: 1,
      results: [buildSpecialist()],
    })
    await fireEvent.update(input, 'olena')
    await fireEvent.click(screen.getByRole('button', { name: 'Знайти' }))
    expect(await screen.findByRole('heading', { name: 'Олена К.' })).toBeInTheDocument()

    const detailButton = screen.getByRole('button', { name: 'Відкрити деталку' })
    await fireEvent.click(detailButton)
    await waitFor(() => {
      expect(router.currentRoute.value.fullPath).toBe('/admin/specialists/2')
    })
  })
})
