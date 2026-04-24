import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminBillingAccessRequestDetailView from './AdminBillingAccessRequestDetailView.vue'
import {
  approveAdminBillingAccessRequest,
  fetchAdminBillingAccessRequest,
  rejectAdminBillingAccessRequest,
} from '../lib/api'

const toastSuccess = vi.fn()
const toastError = vi.fn()

vi.mock('../composables/useToast', () => ({
  useToast: () => ({
    success: toastSuccess,
    error: toastError,
  }),
}))

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    fetchAdminBillingAccessRequest: vi.fn(),
    approveAdminBillingAccessRequest: vi.fn(),
    rejectAdminBillingAccessRequest: vi.fn(),
    getApiErrorMessage: vi.fn(() => 'Request failed'),
  }
})

const mockedFetchAdminBillingAccessRequest = vi.mocked(fetchAdminBillingAccessRequest)
const mockedApproveAdminBillingAccessRequest = vi.mocked(approveAdminBillingAccessRequest)
const mockedRejectAdminBillingAccessRequest = vi.mocked(rejectAdminBillingAccessRequest)

async function renderView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/admin/billing-access-requests/:id(\\d+)',
        name: 'admin-billing-access-request-detail',
        component: AdminBillingAccessRequestDetailView,
      },
      {
        path: '/admin/billing-access-requests',
        name: 'admin-billing-access-requests',
        component: AdminBillingAccessRequestDetailView,
      },
      {
        path: '/admin/inbox',
        name: 'admin-inbox',
        component: AdminBillingAccessRequestDetailView,
      },
      {
        path: '/admin/inbox/:id(\\d+)',
        name: 'admin-inbox-item',
        component: AdminBillingAccessRequestDetailView,
      },
    ],
  })

  await router.push('/admin/billing-access-requests/101')
  await router.isReady()

  render(AdminBillingAccessRequestDetailView, {
    global: {
      plugins: [router],
    },
  })
}

describe('AdminBillingAccessRequestDetailView', () => {
  beforeEach(() => {
    toastSuccess.mockReset()
    toastError.mockReset()

    mockedFetchAdminBillingAccessRequest.mockReset()
    mockedFetchAdminBillingAccessRequest.mockResolvedValue({
      id: 101,
      status: 'PENDING',
      created_at: '2026-04-21T10:00:00Z',
      updated_at: '2026-04-21T10:01:00Z',
      current_plan: 'START',
      current_plan_label: 'Start',
      requested_plan: 'PRO',
      requested_plan_label: 'Pro',
      note: 'Потрібен апгрейд',
      user: {
        id: 7,
        display_name: 'Марія І.',
        email: 'maria@example.com',
      },
      specialist: {
        id: 13,
        display_name: 'Марія І.',
        username: 'maria',
        email: 'maria@example.com',
        public_slug: 'maria',
      },
      inbox_relation: {
        has_linked_items: true,
        linked_items_count: 1,
        open_items_count: 1,
        has_open_items: true,
        linked_items: [
          {
            id: 41,
            code: 'BILLING_ACCESS_REQUEST_CREATED',
            status: 'OPEN',
            title: 'Новий billing-запит',
            created_at: '2026-04-21T10:00:00Z',
            read_at: null,
            resolved_at: null,
          },
        ],
      },
    } as any)

    mockedApproveAdminBillingAccessRequest.mockReset()
    mockedApproveAdminBillingAccessRequest.mockResolvedValue({ id: 101, status: 'APPROVED' } as any)

    mockedRejectAdminBillingAccessRequest.mockReset()
    mockedRejectAdminBillingAccessRequest.mockResolvedValue({ id: 101, status: 'REJECTED' } as any)
  })

  it('approves pending request and refreshes detail state', async () => {
    await renderView()

    await waitFor(() => {
      expect(mockedFetchAdminBillingAccessRequest).toHaveBeenCalledWith(101)
    })

    const approveButton = await screen.findByRole('button', { name: 'Погодити' })
    await fireEvent.click(approveButton)

    await waitFor(() => {
      expect(mockedApproveAdminBillingAccessRequest).toHaveBeenCalledWith(101)
    })

    await waitFor(() => {
      expect(mockedFetchAdminBillingAccessRequest).toHaveBeenCalledTimes(2)
    })

    expect(toastSuccess).toHaveBeenCalledWith('Запит погоджено.')
    expect(screen.getByText(/Поточний тариф/)).toBeInTheDocument()
    expect(screen.getByText(/Start/)).toBeInTheDocument()
    expect(screen.getByText(/Запитаний тариф/)).toBeInTheDocument()
    expect(screen.getByText(/Pro/)).toBeInTheDocument()
    expect(screen.getByText(/Повʼязані:/)).toBeInTheDocument()
    expect(screen.getByText(/Відкриті:/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Відкрити елемент inbox' })).toHaveAttribute('href', '/admin/inbox/41')
  })

  it('keeps detail screen stable when canonical labels are absent', async () => {
    mockedFetchAdminBillingAccessRequest.mockResolvedValueOnce({
      id: 55,
      status: 'PENDING',
      current_plan: 'START',
      requested_plan: 'PRO',
      user: { id: 55, display_name: '', email: 'user55@example.com' },
      specialist: { id: 55, username: 'spec55', public_slug: null },
      inbox_relation: {
        linked_items_count: 1,
        open_items_count: 0,
        has_open_items: false,
        items: [
          { id: 501, code: 'BILLING_ACCESS_REQUEST_CREATED', status: 'RESOLVED', title: 'Закритий item' },
        ],
      },
    } as any)

    await renderView()

    await waitFor(() => {
      expect(mockedFetchAdminBillingAccessRequest).toHaveBeenCalledWith(101)
    })
    expect(screen.getByText('START')).toBeInTheDocument()
    expect(screen.getByText('PRO')).toBeInTheDocument()
    expect(screen.getByText(/Усі повʼязані елементи закриті/)).toBeInTheDocument()
  })
})
