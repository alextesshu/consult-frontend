import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminSpecialistDetailView from './AdminSpecialistDetailView.vue'
import {
  applyAdminSpecialistOverrideAction,
  applyAdminSpecialistTrialAction,
  fetchAdminSpecialistAccessHistory,
  fetchAdminSpecialistDetail,
  type AdminSpecialistDetailResponse,
} from '../lib/api'

const mockToast = {
  success: vi.fn(),
}

vi.mock('../composables/useToast', () => ({
  useToast: () => mockToast,
}))

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    applyAdminSpecialistOverrideAction: vi.fn(),
    applyAdminSpecialistTrialAction: vi.fn(),
    fetchAdminSpecialistAccessHistory: vi.fn(),
    fetchAdminSpecialistDetail: vi.fn(),
  }
})

const mockedApplyAdminSpecialistOverrideAction = vi.mocked(applyAdminSpecialistOverrideAction)
const mockedApplyAdminSpecialistTrialAction = vi.mocked(applyAdminSpecialistTrialAction)
const mockedFetchAdminSpecialistAccessHistory = vi.mocked(fetchAdminSpecialistAccessHistory)
const mockedFetchAdminSpecialistDetail = vi.mocked(fetchAdminSpecialistDetail)
const nativeDateTimeInputType = ['datetime', 'local'].join('-')
const meridiemPattern = new RegExp(`\\b${['A', 'M'].join('')}\\b|\\b${['P', 'M'].join('')}\\b`)

function buildDetail(overrides: Partial<AdminSpecialistDetailResponse> = {}): AdminSpecialistDetailResponse {
  return {
    identity: {
      id: 2,
      username: 'olena',
      email: 'olena@example.com',
      display_name: 'Олена Савчук',
      public_display_name: 'Олена К.',
      slug: 'olena',
      public_profile_enabled: true,
      created_at: '2026-06-01T08:00:00Z',
    },
    role_state: {
      role: 'SPECIALIST',
      roles: ['SPECIALIST'],
      specialist_active: true,
      client_status: false,
    },
    tariff_access: {
      base_plan: 'PRO',
      effective_plan: 'PRO',
      effective_entitlements: {},
      current_limits: {
        active_client_limit: null,
        group_room_meeting_limit: null,
        guest_sessions_limit_per_period: null,
      },
      trial: {
        active: false,
        trial_plan: null,
        starts_at: null,
        ends_at: null,
        reason: null,
        actor: null,
      },
      override: {
        active: false,
        override_plan: null,
        override_config: {
          forced_group_room_addon_enabled: null,
          forced_active_client_limit: null,
        },
        starts_at: null,
        ends_at: null,
        reason: null,
        actor: null,
      },
    },
    admin_context: {
      open_billing_admin_requests_count: 0,
      open_admin_inbox_items_count: 0,
      work_queue_summary: {
        open_count: 0,
        in_progress_count: 0,
        resolved_count: 1,
        ignored_count: 0,
        has_active_items: false,
        latest_item: {
          item_key: 'billing_access_request:15',
          item_type: 'billing_access_request',
          status: 'resolved',
          status_changed_at: '2026-06-06T10:00:00Z',
          status_changed_by: { id: 1, username: 'superadmin' },
          resolution_note: 'Billing access request approved in the billing workflow.',
          source_type: 'billing_access_request',
          source_id: '15',
          target_url: '/admin/billing-access-requests/15',
        },
      },
      latest_related_request_summary: null,
      last_access_change_summary: null,
    },
    ...overrides,
  }
}

async function renderView(detail = buildDetail()) {
  mockedFetchAdminSpecialistDetail.mockResolvedValue(detail)
  mockedFetchAdminSpecialistAccessHistory.mockResolvedValue([])

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/admin/specialists/:id(\\d+)',
        name: 'admin-specialist-detail',
        component: AdminSpecialistDetailView,
      },
      { path: '/admin/inbox', component: { template: '<div>Inbox</div>' } },
      { path: '/admin/billing-access-requests', component: { template: '<div>Billing</div>' } },
      { path: '/admin/work-queue', component: { template: '<div>Queue</div>' } },
      { path: '/admin/specialists', component: { template: '<div>Specialists</div>' } },
    ],
  })

  await router.push('/admin/specialists/2')
  await router.isReady()

  render(AdminSpecialistDetailView, {
    global: {
      plugins: [router],
    },
  })

  await waitFor(() => {
    expect(mockedFetchAdminSpecialistDetail).toHaveBeenCalledWith(2)
  })

  return { router }
}

function activeAccessDetail() {
  return buildDetail({
    tariff_access: {
      ...buildDetail().tariff_access,
      base_plan: 'START',
      effective_plan: 'LEADER',
      trial: {
        active: true,
        trial_plan: 'PRO',
        starts_at: '2026-06-06T08:06:00Z',
        ends_at: '2026-06-13T08:06:00Z',
        reason: 'Beta demo',
        actor: 'admin',
      },
      override: {
        active: true,
        override_plan: 'LEADER',
        override_config: {
          forced_group_room_addon_enabled: null,
          forced_active_client_limit: null,
        },
        starts_at: '2026-06-06T08:06:00Z',
        ends_at: '2026-06-20T08:06:00Z',
        reason: 'Service case',
        actor: 'admin',
      },
    },
  })
}

describe('AdminSpecialistDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedApplyAdminSpecialistOverrideAction.mockResolvedValue({} as any)
    mockedApplyAdminSpecialistTrialAction.mockResolvedValue({} as any)
  })

  it('explains the difference between test access and service override', async () => {
    await renderView()

    expect(await screen.findByRole('heading', { name: 'Олена К.' })).toBeInTheDocument()
    expect(screen.getByText('Публічне ім’я:').parentElement).toHaveTextContent('Олена К.')
    expect(screen.getByText('Логін:').parentElement).toHaveTextContent('@olena')
    expect(screen.getByText('Email:').parentElement).toHaveTextContent('olena@example.com')
    expect(screen.getByRole('button', { name: 'Керувати тестовим доступом' })).toBeInTheDocument()
    expect(screen.getByText('Тестовий доступ — тимчасовий Pro-доступ для beta, демо або перевірки.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Службове перевизначення' })).toBeInTheDocument()
    expect(screen.getByText(/Ручна службова дія для виняткових випадків/)).toBeInTheDocument()
    expect(screen.getByText('Тестовий доступ неактивний')).toBeInTheDocument()
    expect(screen.getByText('Службове перевизначення неактивне')).toBeInTheDocument()
    expect(screen.getByText(/Базовий тариф:/)).toBeInTheDocument()
    expect(screen.getByText(/Фактичний тариф:/)).toBeInTheDocument()
    expect(screen.getByText(/Службове перевизначення:/)).toBeInTheDocument()
    expect(screen.getByText(/Фактичний доступ зараз:/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Операційний стан' })).toBeInTheDocument()
    expect(screen.getByText('Активних операційних проблем немає.')).toBeInTheDocument()
    expect(screen.getByText('Вирішено')).toBeInTheDocument()
    expect(screen.getByText('superadmin')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Відкрити в черзі' })).toHaveAttribute(
      'href',
      '/admin/work-queue?status=all&item_key=billing_access_request%3A15'
    )
  })

  it('renders active operational counts and specialist-scoped queue link', async () => {
    await renderView(buildDetail({
      admin_context: {
        ...buildDetail().admin_context,
        work_queue_summary: {
          open_count: 2,
          in_progress_count: 1,
          resolved_count: 3,
          ignored_count: 1,
          has_active_items: true,
          latest_item: {
            item_key: 'specialist_access_review:2',
            item_type: 'specialist_beta_access_review',
            status: 'in_progress',
            status_changed_at: '2026-06-07T10:00:00Z',
            status_changed_by: { id: 1, username: 'admin' },
            resolution_note: '',
            source_type: 'specialist',
            source_id: '2',
            target_url: '/admin/specialists/2',
          },
        },
      },
    }))

    expect(screen.getByText('Відкриті:').parentElement).toHaveTextContent('2')
    expect(screen.getByText('В роботі:').parentElement).toHaveTextContent('1')
    expect(screen.getByText('Вирішені:').parentElement).toHaveTextContent('3')
    expect(screen.getByText('Ігноровані:').parentElement).toHaveTextContent('1')
    expect(screen.queryByText('Активних операційних проблем немає.')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Відкрити активні елементи' })).toHaveAttribute(
      'href',
      '/admin/work-queue?status=active&specialist_id=2'
    )
  })

  it('uses service override copy in the button and modal', async () => {
    await renderView()

    await fireEvent.click(screen.getByRole('button', { name: 'Службове перевизначення' }))

    const dialog = await screen.findByRole('dialog', { name: 'Службове перевизначення доступу' })
    expect(within(dialog).getByRole('heading', { name: 'Службове перевизначення доступу' })).toBeInTheDocument()
    expect(within(dialog).getByText(/примусово змінює фактичний доступ незалежно від тарифу/)).toBeInTheDocument()
    expect(within(dialog).getByRole('option', { name: 'Увімкнути службове перевизначення' })).toBeInTheDocument()
    expect(within(dialog).getByRole('option', { name: 'Оновити службове перевизначення' })).toBeInTheDocument()
    expect(within(dialog).getByRole('option', { name: 'Вимкнути службове перевизначення' })).toBeInTheDocument()
  })

  it('renders test access modal dates as DD.MM.YYYY and times as HH:mm without meridiem markers', async () => {
    await renderView(activeAccessDetail())

    await fireEvent.click(screen.getByRole('button', { name: 'Керувати тестовим доступом' }))
    const dialog = await screen.findByRole('dialog', { name: 'Керувати тестовим доступом' })
    await fireEvent.update(within(dialog).getByLabelText('Дія'), 'START')

    expect(dialog.textContent || '').not.toMatch(meridiemPattern)
    expect(dialog.querySelector(`input[type="${nativeDateTimeInputType}"]`)).toBeNull()
    expect(within(dialog).getByLabelText('Дата початку')).toHaveValue('06.06.2026')
    expect(within(dialog).getByLabelText('Дата завершення')).toHaveValue('13.06.2026')
    expect((within(dialog).getByLabelText('Час початку') as HTMLInputElement).value).toMatch(/^\d{2}:\d{2}$/)
    expect((within(dialog).getByLabelText('Час завершення') as HTMLInputElement).value).toMatch(/^\d{2}:\d{2}$/)
  })

  it('renders service override modal dates as DD.MM.YYYY and times as HH:mm without meridiem markers', async () => {
    await renderView(activeAccessDetail())

    await fireEvent.click(screen.getByRole('button', { name: 'Службове перевизначення' }))
    const dialog = await screen.findByRole('dialog', { name: 'Службове перевизначення доступу' })

    expect(dialog.textContent || '').not.toMatch(meridiemPattern)
    expect(dialog.querySelector(`input[type="${nativeDateTimeInputType}"]`)).toBeNull()
    expect(within(dialog).getByLabelText('Дата початку')).toHaveValue('06.06.2026')
    expect(within(dialog).getByLabelText('Дата завершення')).toHaveValue('20.06.2026')
    expect((within(dialog).getByLabelText('Час початку') as HTMLInputElement).value).toMatch(/^\d{2}:\d{2}$/)
    expect((within(dialog).getByLabelText('Час завершення') as HTMLInputElement).value).toMatch(/^\d{2}:\d{2}$/)
  })

  it('shows Ukrainian validation errors for invalid visible date and time without submitting', async () => {
    await renderView()

    await fireEvent.click(screen.getByRole('button', { name: 'Керувати тестовим доступом' }))
    const dialog = await screen.findByRole('dialog', { name: 'Керувати тестовим доступом' })
    await fireEvent.update(within(dialog).getByLabelText('Причина'), 'Manual beta check')

    await fireEvent.update(within(dialog).getByLabelText('Дата початку'), '2026-06-06')
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Застосувати' }))

    expect(await within(dialog).findByText('Вкажіть дату у форматі ДД.ММ.РРРР.')).toBeInTheDocument()
    expect(mockedApplyAdminSpecialistTrialAction).not.toHaveBeenCalled()

    await fireEvent.update(within(dialog).getByLabelText('Дата початку'), '06.06.2026')
    await fireEvent.update(within(dialog).getByLabelText('Час початку'), '11 ранку')
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Застосувати' }))

    expect(await within(dialog).findByText('Вкажіть час у форматі HH:mm.')).toBeInTheDocument()
    expect(mockedApplyAdminSpecialistTrialAction).not.toHaveBeenCalled()
  })

  it('submits test access with the existing API payload fields and ISO datetimes', async () => {
    await renderView()

    await fireEvent.click(screen.getByRole('button', { name: 'Керувати тестовим доступом' }))
    const dialog = await screen.findByRole('dialog', { name: 'Керувати тестовим доступом' })
    await fireEvent.update(within(dialog).getByLabelText('Дата початку'), '06.06.2026')
    await fireEvent.update(within(dialog).getByLabelText('Час початку'), '11:06')
    await fireEvent.update(within(dialog).getByLabelText('Дата завершення'), '13.06.2026')
    await fireEvent.update(within(dialog).getByLabelText('Час завершення'), '11:06')
    await fireEvent.update(within(dialog).getByLabelText('Причина'), 'Manual beta check')
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Застосувати' }))

    await waitFor(() => {
      expect(mockedApplyAdminSpecialistTrialAction).toHaveBeenCalledWith(2, {
        action: 'START',
        trial_plan: 'PRO',
        starts_at: new Date(2026, 5, 6, 11, 6).toISOString(),
        ends_at: new Date(2026, 5, 13, 11, 6).toISOString(),
        reason: 'Manual beta check',
      })
    })
  })

  it('submits service override with the existing API payload fields and ISO datetimes', async () => {
    await renderView()

    await fireEvent.click(screen.getByRole('button', { name: 'Службове перевизначення' }))
    const dialog = await screen.findByRole('dialog', { name: 'Службове перевизначення доступу' })
    await fireEvent.update(within(dialog).getByLabelText('Дата початку'), '06.06.2026')
    await fireEvent.update(within(dialog).getByLabelText('Час початку'), '11:06')
    await fireEvent.update(within(dialog).getByLabelText('Дата завершення'), '20.06.2026')
    await fireEvent.update(within(dialog).getByLabelText('Час завершення'), '11:06')
    await fireEvent.update(within(dialog).getByLabelText('Причина'), 'Exceptional service case')
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Застосувати' }))

    await waitFor(() => {
      expect(mockedApplyAdminSpecialistOverrideAction).toHaveBeenCalledWith(2, {
        action: 'ENABLE',
        forced_plan: 'PRO',
        starts_at: new Date(2026, 5, 6, 11, 6).toISOString(),
        expires_at: new Date(2026, 5, 20, 11, 6).toISOString(),
        reason: 'Exceptional service case',
      })
    })
  })
})
