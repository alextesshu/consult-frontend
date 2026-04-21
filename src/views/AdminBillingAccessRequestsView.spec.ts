import { render, screen, waitFor } from '@testing-library/vue'
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

async function renderView() {
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

  await router.push('/admin/billing-access-requests')
  await router.isReady()

  render(AdminBillingAccessRequestsView, {
    global: {
      plugins: [router],
    },
  })
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
    })
  })

  it('renders canonical list payload and deep-link to detail route', async () => {
    await renderView()

    await waitFor(() => {
      expect(mockedFetchAdminBillingAccessRequests).toHaveBeenCalledTimes(1)
    })

    expect(screen.getByRole('heading', { name: 'Запити на доступ до тарифу' })).toBeInTheDocument()
    expect(screen.getByText('Запит №101')).toBeInTheDocument()
    expect(screen.getAllByText('Очікує рішення').length).toBeGreaterThan(0)
    expect(screen.getByText(/Тариф Start → Pro/)).toBeInTheDocument()
    expect(screen.getByText(/Повʼязано: 1. Відкриті: 1./)).toBeInTheDocument()

    const detailLink = screen.getByRole('link', { name: 'Відкрити деталі' })
    expect(detailLink).toHaveAttribute('href', '/admin/billing-access-requests/101')
  })

  it('falls back to plan codes when canonical labels are missing', async () => {
    mockedFetchAdminBillingAccessRequests.mockResolvedValueOnce({
      count: 1,
      results: [
        {
          id: 202,
          status: 'PENDING',
          current_plan: 'START',
          requested_plan: 'PRO',
          user: { id: 2, display_name: 'Ірина', email: '' },
          specialist: { id: 2, username: 'iryna' },
          inbox_relation: { has_open_items: false, linked_items_count: 0, open_items_count: 0 },
        },
      ],
    } as any)

    await renderView()

    await waitFor(() => {
      expect(screen.getByText('Запит №202')).toBeInTheDocument()
    })
    expect(screen.getByText(/Тариф START → PRO/)).toBeInTheDocument()
  })
})
