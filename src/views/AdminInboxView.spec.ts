import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminInboxView from './AdminInboxView.vue'
import {
  dismissAdminInboxItem,
  fetchAdminInbox,
  fetchAdminInboxItem,
  markAdminInboxItemRead,
  resolveAdminInboxItem,
  startAdminInboxItem,
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
    fetchAdminInbox: vi.fn(),
    fetchAdminInboxItem: vi.fn(),
    markAdminInboxItemRead: vi.fn(),
    startAdminInboxItem: vi.fn(),
    resolveAdminInboxItem: vi.fn(),
    dismissAdminInboxItem: vi.fn(),
    getApiErrorMessage: vi.fn(() => 'Request failed'),
  }
})

const mockedFetchAdminInbox = vi.mocked(fetchAdminInbox)
const mockedFetchAdminInboxItem = vi.mocked(fetchAdminInboxItem)
const mockedMarkAdminInboxItemRead = vi.mocked(markAdminInboxItemRead)
const mockedStartAdminInboxItem = vi.mocked(startAdminInboxItem)
const mockedResolveAdminInboxItem = vi.mocked(resolveAdminInboxItem)
const mockedDismissAdminInboxItem = vi.mocked(dismissAdminInboxItem)

const baseItem = {
  id: 11,
  code: 'BILLING_ACCESS_REQUEST_CREATED',
  status: 'UNREAD',
  title: 'Новий запит на доступ',
  message: 'Потрібна перевірка запиту.',
  created_at: '2026-04-21T08:00:00Z',
  created_by: {
    id: 99,
    display_name: 'Олена К.',
  },
  payload: {
    billing_access_request_id: 77,
    current_plan_label: 'Start',
    current_plan: 'START',
    requested_plan_label: 'Pro',
    requested_plan: 'PRO',
    created_at: '2026-04-21T08:00:00Z',
  },
}

async function renderView(initialPath = '/admin/inbox') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/admin/inbox',
        name: 'admin-inbox',
        component: AdminInboxView,
      },
      {
        path: '/admin/inbox/:id(\\d+)',
        name: 'admin-inbox-item',
        component: AdminInboxView,
      },
      {
        path: '/admin/billing-access-requests',
        name: 'admin-billing-access-requests',
        component: AdminInboxView,
      },
      {
        path: '/admin/billing-access-requests/:id(\\d+)',
        name: 'admin-billing-access-request-detail',
        component: AdminInboxView,
      },
    ],
  })

  await router.push(initialPath)
  await router.isReady()

  render(AdminInboxView, {
    global: {
      plugins: [router],
    },
  })

  return { router }
}

describe('AdminInboxView', () => {
  beforeEach(() => {
    toastSuccess.mockReset()
    toastError.mockReset()

    mockedFetchAdminInbox.mockReset()
    mockedFetchAdminInbox.mockResolvedValue({
      count: 3,
      unread_count: 2,
      open_count: 1,
      results: [baseItem as any],
    })

    mockedFetchAdminInboxItem.mockReset()
    mockedFetchAdminInboxItem.mockResolvedValue(baseItem as any)

    mockedMarkAdminInboxItemRead.mockReset()
    mockedMarkAdminInboxItemRead.mockResolvedValue({ ...baseItem, status: 'OPEN' } as any)

    mockedStartAdminInboxItem.mockReset()
    mockedResolveAdminInboxItem.mockReset()
    mockedDismissAdminInboxItem.mockReset()
  })

  it('renders counters and billing summary from inbox list payload', async () => {
    await renderView()

    await waitFor(() => {
      expect(mockedFetchAdminInbox).toHaveBeenCalledTimes(1)
    })

    expect(screen.getByRole('heading', { name: 'Адмінські запити' })).toBeInTheDocument()

    const countersRegion = screen.getByLabelText('Лічильники inbox')
    expect(within(countersRegion).getByText('Непрочитані')).toBeInTheDocument()
    expect(within(countersRegion).getByText('В роботі')).toBeInTheDocument()
    expect(within(countersRegion).getByText('Усього')).toBeInTheDocument()
    expect(within(countersRegion).getByText('2')).toBeInTheDocument()
    expect(within(countersRegion).getByText('1')).toBeInTheDocument()
    expect(within(countersRegion).getByText('3')).toBeInTheDocument()

    expect(screen.getByText(/Хто подав:/)).toBeInTheDocument()
    expect(screen.getAllByText(/Олена К\./).length).toBeGreaterThan(0)
    expect(screen.getByText(/Поточний план:/)).toBeInTheDocument()
    expect(screen.getByText(/Start/)).toBeInTheDocument()
    expect(screen.getByText(/Запитаний план:/)).toBeInTheDocument()
    expect(screen.getByText(/Pro/)).toBeInTheDocument()

    const operationalLink = screen.getByRole('link', { name: 'Відкрити опрацювання запиту' })
    expect(operationalLink).toHaveAttribute('href', '/admin/billing-access-requests/77')
  })

  it('marks unread item as read and refreshes list without page reload', async () => {
    await renderView()

    const readButton = await screen.findByRole('button', { name: 'Позначити як прочитане' })
    await fireEvent.click(readButton)

    await waitFor(() => {
      expect(mockedMarkAdminInboxItemRead).toHaveBeenCalledWith(11)
    })
    await waitFor(() => {
      expect(mockedFetchAdminInbox).toHaveBeenCalledTimes(2)
    })
    expect(toastSuccess).toHaveBeenCalledWith('Статус запиту оновлено.')
  })
})
