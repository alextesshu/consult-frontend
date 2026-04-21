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
  status: 'NEW',
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

const secondaryItem = {
  id: 12,
  code: 'ADMIN_PROFILE_REVIEW_CREATED',
  status: 'IN_PROGRESS',
  title: 'Профіль потребує перевірки',
  message: 'Перевірте дані профілю.',
  created_at: '2026-04-21T09:00:00Z',
  created_by: {
    id: 100,
    display_name: 'Марія І.',
  },
  payload: {},
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
      count: 1,
      unread_count: 12,
      open_count: 4,
      results: [baseItem as any],
    })

    mockedFetchAdminInboxItem.mockReset()
    mockedFetchAdminInboxItem.mockResolvedValue(baseItem as any)

    mockedMarkAdminInboxItemRead.mockReset()
    mockedMarkAdminInboxItemRead.mockResolvedValue({ ...baseItem, status: 'IN_PROGRESS' } as any)

    mockedStartAdminInboxItem.mockReset()
    mockedResolveAdminInboxItem.mockReset()
    mockedDismissAdminInboxItem.mockReset()
  })

  it('renders counters with backend semantics and billing summary', async () => {
    await renderView()

    await waitFor(() => {
      expect(mockedFetchAdminInbox).toHaveBeenCalledWith({})
    })

    expect(screen.getByRole('heading', { name: 'Адмінські запити' })).toBeInTheDocument()

    const countersRegion = screen.getByLabelText('Лічильники inbox')
    expect(within(countersRegion).getByText('Непрочитані')).toBeInTheDocument()
    expect(within(countersRegion).getByText('В роботі')).toBeInTheDocument()
    expect(within(countersRegion).getByText('Усього')).toBeInTheDocument()
    expect(within(countersRegion).getByText('12')).toBeInTheDocument()
    expect(within(countersRegion).getByText('4')).toBeInTheDocument()
    expect(within(countersRegion).getByText('1')).toBeInTheDocument()

    expect(screen.getByText(/Хто подав:/)).toBeInTheDocument()
    expect(screen.getAllByText(/Олена К\./).length).toBeGreaterThan(0)
    expect(screen.getByText(/Поточний план:/)).toBeInTheDocument()
    expect(screen.getByText(/Start/)).toBeInTheDocument()
    expect(screen.getByText(/Запитаний план:/)).toBeInTheDocument()
    expect(screen.getByText(/Pro/)).toBeInTheDocument()

    const operationalLink = screen.getByRole('link', { name: 'Відкрити опрацювання запиту' })
    expect(operationalLink).toHaveAttribute('href', '/admin/billing-access-requests/77')
  })

  it('hydrates filters from route query and fetches backend-filtered set', async () => {
    mockedFetchAdminInbox.mockResolvedValueOnce({
      count: 1,
      unread_count: 10,
      open_count: 3,
      results: [secondaryItem as any],
    })

    await renderView('/admin/inbox?status=IN_PROGRESS&code=ADMIN_PROFILE_REVIEW_CREATED&unread_only=1')

    await waitFor(() => {
      expect(mockedFetchAdminInbox).toHaveBeenCalledWith({
        status: 'IN_PROGRESS',
        code: 'ADMIN_PROFILE_REVIEW_CREATED',
        unread_only: true,
      })
    })

    expect((screen.getByLabelText('Статус') as HTMLSelectElement).value).toBe('IN_PROGRESS')
    expect((screen.getByLabelText('Код події') as HTMLSelectElement).value).toBe('ADMIN_PROFILE_REVIEW_CREATED')
    expect((screen.getByLabelText('Лише непрочитані') as HTMLInputElement).checked).toBe(true)
    expect(screen.getByText('Профіль потребує перевірки')).toBeInTheDocument()
    expect(screen.queryByText('Новий запит на доступ')).not.toBeInTheDocument()
  })

  it('updates and clears route query while keeping API filtering in sync', async () => {
    const { router } = await renderView('/admin/inbox')

    await waitFor(() => {
      expect(mockedFetchAdminInbox).toHaveBeenCalledWith({})
    })

    const statusSelect = screen.getByLabelText('Статус')
    const codeSelect = screen.getByLabelText('Код події')
    const unreadOnlyCheckbox = screen.getByLabelText('Лише непрочитані')

    await fireEvent.update(statusSelect, 'NEW')
    await waitFor(() => {
      expect(router.currentRoute.value.query.status).toBe('NEW')
      expect(mockedFetchAdminInbox).toHaveBeenLastCalledWith({ status: 'NEW' })
    })

    await fireEvent.update(codeSelect, 'BILLING_ACCESS_REQUEST_CREATED')
    await waitFor(() => {
      expect(router.currentRoute.value.query.code).toBe('BILLING_ACCESS_REQUEST_CREATED')
      expect(mockedFetchAdminInbox).toHaveBeenLastCalledWith({
        status: 'NEW',
        code: 'BILLING_ACCESS_REQUEST_CREATED',
      })
    })

    await fireEvent.click(unreadOnlyCheckbox)
    await waitFor(() => {
      expect(router.currentRoute.value.query.unread_only).toBe('1')
      expect(mockedFetchAdminInbox).toHaveBeenLastCalledWith({
        status: 'NEW',
        code: 'BILLING_ACCESS_REQUEST_CREATED',
        unread_only: true,
      })
    })

    await fireEvent.update(statusSelect, '')
    await fireEvent.update(codeSelect, '')
    await fireEvent.click(unreadOnlyCheckbox)
    await waitFor(() => {
      expect(router.currentRoute.value.query.status).toBeUndefined()
      expect(router.currentRoute.value.query.code).toBeUndefined()
      expect(router.currentRoute.value.query.unread_only).toBeUndefined()
      expect(mockedFetchAdminInbox).toHaveBeenLastCalledWith({})
    })
  })

  it('marks item as read and refreshes filtered list without page reload', async () => {
    await renderView('/admin/inbox?status=NEW&code=BILLING_ACCESS_REQUEST_CREATED&unread_only=1')

    const readButton = await screen.findByRole('button', { name: 'Позначити як прочитане' })
    await fireEvent.click(readButton)

    await waitFor(() => {
      expect(mockedMarkAdminInboxItemRead).toHaveBeenCalledWith(11)
    })

    await waitFor(() => {
      expect(mockedFetchAdminInbox).toHaveBeenLastCalledWith({
        status: 'NEW',
        code: 'BILLING_ACCESS_REQUEST_CREATED',
        unread_only: true,
      })
    })
    expect(toastSuccess).toHaveBeenCalledWith('Статус запиту оновлено.')
  })
})
