import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminBillingAccessRequestsView from './AdminBillingAccessRequestsView.vue'
import { fetchAdminBillingAccessRequests } from '../lib/api'

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    fetchAdminBillingAccessRequests: vi.fn(),
    getApiErrorMessage: vi.fn(() => 'Request failed'),
  }
})

const mockedFetchAdminBillingAccessRequests = vi.mocked(fetchAdminBillingAccessRequests)

async function renderView(initialPath = '/admin/billing-access-requests') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/admin/billing-access-requests',
        name: 'admin-billing-access-requests',
        component: AdminBillingAccessRequestsView,
      },
      {
        path: '/admin/billing-access-requests/:id(\\d+)',
        name: 'admin-billing-access-request-detail',
        component: AdminBillingAccessRequestsView,
      },
      {
        path: '/admin/inbox',
        name: 'admin-inbox',
        component: AdminBillingAccessRequestsView,
      },
    ],
  })

  await router.push(initialPath)
  await router.isReady()

  render(AdminBillingAccessRequestsView, {
    global: {
      plugins: [router],
    },
  })

  return { router }
}

describe('AdminBillingAccessRequestsView', () => {
  beforeEach(() => {
    mockedFetchAdminBillingAccessRequests.mockReset()
    mockedFetchAdminBillingAccessRequests.mockResolvedValue({
      count: 1,
      results: [
        {
          id: 101,
          status: 'PENDING',
          created_at: '2026-04-21T10:00:00Z',
          current_plan: 'START',
          current_plan_label: 'Start',
          requested_plan: 'PRO',
          requested_plan_label: 'Pro',
          user: {
            id: 7,
            display_name: 'Марія І.',
            email: 'maria@example.com',
          },
          specialist: {
            id: 13,
            display_name: 'Марія І.',
            username: 'maria',
            public_slug: 'maria',
          },
          inbox_relation: {
            linked_items_count: 1,
            open_items_count: 1,
            has_linked_items: true,
            has_open_items: true,
            linked_items: [
              {
                id: 41,
                code: 'BILLING_ACCESS_REQUEST_CREATED',
                status: 'NEW',
                title: 'Billing access request #101',
                created_at: '2026-04-21T10:00:00Z',
              },
            ],
          },
        },
      ],
    } as any)
  })

  it('renders canonical list payload and deep-link to detail route', async () => {
    await renderView()

    await waitFor(() => {
      expect(mockedFetchAdminBillingAccessRequests).toHaveBeenCalledWith({})
    })

    expect(screen.getByRole('heading', { name: 'Запити на доступ до тарифу' })).toBeInTheDocument()
    expect(screen.getByText('Запит №101')).toBeInTheDocument()
    expect(screen.getAllByText('Очікує рішення').length).toBeGreaterThan(0)
    expect(screen.getByText(/Тариф Start → Pro/)).toBeInTheDocument()
    expect(screen.getByText(/Повʼязано: 1. Відкриті: 1./)).toBeInTheDocument()

    const detailLink = screen.getByRole('link', { name: 'Відкрити деталі' })
    expect(detailLink).toHaveAttribute('href', '/admin/billing-access-requests/101')
  })

  it('hydrates filters from route query and fetches backend-filtered set', async () => {
    mockedFetchAdminBillingAccessRequests.mockResolvedValueOnce({
      count: 1,
      results: [
        {
          id: 301,
          status: 'PENDING',
          current_plan_label: 'Start',
          requested_plan_label: 'Pro',
          user: { id: 1, display_name: 'Олена', email: 'olena@example.com' },
          specialist: { id: 1, display_name: 'Олена', username: 'olena' },
          inbox_relation: { has_open_items: true, open_items_count: 1, linked_items_count: 1 },
        },
      ],
    } as any)

    await renderView('/admin/billing-access-requests?status=PENDING&open_inbox_only=1')

    await waitFor(() => {
      expect(mockedFetchAdminBillingAccessRequests).toHaveBeenCalledWith({
        status: 'PENDING',
        open_inbox_only: true,
      })
    })

    expect((screen.getByLabelText('Статус') as HTMLSelectElement).value).toBe('PENDING')
    expect((screen.getByLabelText('Лише з відкритими елементами inbox') as HTMLInputElement).checked).toBe(true)
    expect(screen.getByText('Запит №301')).toBeInTheDocument()
    expect(screen.queryByText('Запит №101')).not.toBeInTheDocument()
  })

  it('updates and clears route query when filters change', async () => {
    const { router } = await renderView('/admin/billing-access-requests')

    await waitFor(() => {
      expect(mockedFetchAdminBillingAccessRequests).toHaveBeenCalledWith({})
    })

    const statusSelect = screen.getByLabelText('Статус')
    const openOnlyCheckbox = screen.getByLabelText('Лише з відкритими елементами inbox')

    await fireEvent.update(statusSelect, 'PENDING')
    await waitFor(() => {
      expect(router.currentRoute.value.query.status).toBe('PENDING')
      expect(mockedFetchAdminBillingAccessRequests).toHaveBeenLastCalledWith({ status: 'PENDING' })
    })

    await fireEvent.click(openOnlyCheckbox)
    await waitFor(() => {
      expect(router.currentRoute.value.query.open_inbox_only).toBe('1')
      expect(mockedFetchAdminBillingAccessRequests).toHaveBeenLastCalledWith({
        status: 'PENDING',
        open_inbox_only: true,
      })
    })

    await fireEvent.update(statusSelect, '')
    await fireEvent.click(openOnlyCheckbox)

    await waitFor(() => {
      expect(router.currentRoute.value.query.status).toBeUndefined()
      expect(router.currentRoute.value.query.open_inbox_only).toBeUndefined()
      expect(mockedFetchAdminBillingAccessRequests).toHaveBeenLastCalledWith({})
    })
  })
})
