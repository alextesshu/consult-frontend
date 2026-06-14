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
      {
        path: '/admin/work-queue',
        name: 'admin-work-queue',
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
      work_queue_summary: {
        open_count: 1,
        in_progress_count: 0,
        resolved_count: 0,
        ignored_count: 0,
        has_active_items: true,
        domain_status: 'PENDING',
        auto_closed: false,
        conflict_code: null,
        latest_item: {
          item_key: 'billing_access_request:101',
          item_type: 'billing_access_request_pending',
          status: 'open',
          persisted_status: null,
          status_changed_at: '2026-04-21T10:01:00Z',
          status_changed_by: null,
          resolution_note: '',
          source_type: 'billing_access_request',
          source_id: '101',
          target_url: '/admin/billing-access-requests/101',
        },
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
    expect(screen.getByText('Доменний статус')).toBeInTheDocument()
    expect(screen.getByText('Операційний статус')).toBeInTheDocument()
    expect(screen.getByText('Відкрите')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Відкрити в черзі' })).toHaveAttribute(
      'href',
      '/admin/work-queue?status=all&item_key=billing_access_request%3A101'
    )
  })

  it('shows automatic operational resolution after billing approval', async () => {
    mockedFetchAdminBillingAccessRequest.mockResolvedValueOnce({
      id: 101,
      status: 'APPROVED',
      work_queue_summary: {
        open_count: 0,
        in_progress_count: 0,
        resolved_count: 1,
        ignored_count: 0,
        has_active_items: false,
        domain_status: 'APPROVED',
        auto_closed: true,
        conflict_code: null,
        latest_item: {
          item_key: 'billing_access_request:101',
          item_type: 'billing_access_request',
          status: 'resolved',
          persisted_status: 'resolved',
          status_changed_at: '2026-04-23T19:23:00Z',
          status_changed_by: { id: 1, username: 'superadmin' },
          resolution_note: 'Billing access request approved in the billing workflow.',
        },
      },
    } as any)

    await renderView()

    expect(await screen.findByText('Вирішено автоматично')).toBeInTheDocument()
    expect(screen.getByText('superadmin')).toBeInTheDocument()
    expect(screen.getByText('Billing access request approved in the billing workflow.')).toBeInTheDocument()
  })

  it('shows warning when operational item is closed but billing remains pending', async () => {
    mockedFetchAdminBillingAccessRequest.mockResolvedValueOnce({
      id: 101,
      status: 'PENDING',
      work_queue_summary: {
        open_count: 0,
        in_progress_count: 0,
        resolved_count: 1,
        ignored_count: 0,
        has_active_items: false,
        conflict_code: 'DOMAIN_PENDING_OPERATIONAL_CLOSED',
        latest_item: {
          item_key: 'billing_access_request:101',
          item_type: 'billing_access_request_pending',
          status: 'resolved',
          persisted_status: 'resolved',
        },
      },
    } as any)

    await renderView()
    expect(
      await screen.findByText('Увага: елемент черги закрито, але запит на тариф ще очікує рішення.')
    ).toBeInTheDocument()
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
