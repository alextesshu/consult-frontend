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
      public_slug: 'olena',
      public_profile_enabled: true,
      created_at: '2026-06-01T08:00:00Z',
    },
    profile_readiness: {
      public_profile_enabled: true,
      public_display_name_exists: true,
      profile_slug_exists: true,
      basic_description_exists: true,
      standard_price_configured: true,
      client_entry_path_exists: true,
      public_profile_link_available: true,
      public_booking_mode: 'request_only',
      show_public_availability: false,
      has_future_availability_windows: false,
      missing_items: [],
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
      signup_template_a_email: {
        sent: false,
        sent_at: null,
        item_key: 'specialist_signup_template_a_email:2',
      },
      signup_template_b_email: {
        sent: false,
        sent_at: null,
        item_key: 'specialist_signup_template_b_email:2',
        variant: '',
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

  it('renders the profile readiness panel with a ready status when critical fields pass', async () => {
    await renderView()

    const panel = screen.getByRole('heading', { name: 'Готовність профілю' }).closest('section') as HTMLElement
    expect(panel).toBeTruthy()
    expect(within(panel).getByText('Швидка перевірка, чи спеціаліст готовий приймати перші запити.')).toBeInTheDocument()
    expect(within(panel).getByText('Готовий до перших запитів')).toBeInTheDocument()
    expect(within(panel).getByText('Публічний профіль увімкнено').parentElement).toHaveTextContent('Так')
    expect(within(panel).getByText('Публічне ім’я заповнене').parentElement).toHaveTextContent('Так')
    expect(within(panel).getByText('Слаг профілю налаштовано').parentElement).toHaveTextContent('Так')
    expect(within(panel).queryByText(/Що варто доповнити перед публікацією:/)).not.toBeInTheDocument()
  })

  it('shows that the profile is not open when the public profile is disabled', async () => {
    await renderView(buildDetail({
      identity: {
        ...buildDetail().identity,
        public_profile_enabled: false,
      },
      profile_readiness: {
        ...buildDetail().profile_readiness!,
        public_profile_enabled: false,
        public_profile_link_available: false,
        missing_items: ['public_profile_enabled', 'public_profile_link_available'],
      },
    }))

    const panel = screen.getByRole('heading', { name: 'Готовність профілю' }).closest('section') as HTMLElement
    expect(within(panel).getByText('Профіль ще не відкритий')).toBeInTheDocument()
    expect(within(panel).getByText('Публічний профіль увімкнено').parentElement).toHaveTextContent('Ні')
    const missingSummary = within(panel).getByText(/Що варто доповнити перед публікацією:/)
    expect(missingSummary).toHaveTextContent('публічне посилання')
    expect(missingSummary).not.toHaveTextContent('публічний профіль')
  })

  it('shows that an open profile needs completion when readiness fields are missing', async () => {
    await renderView(buildDetail({
      profile_readiness: {
        ...buildDetail().profile_readiness!,
        basic_description_exists: false,
        standard_price_configured: false,
        client_entry_path_exists: false,
        missing_items: [
          'basic_description_exists',
          'standard_price_configured',
          'client_entry_path_exists',
        ],
      },
    }))

    const panel = screen.getByRole('heading', { name: 'Готовність профілю' }).closest('section') as HTMLElement
    expect(within(panel).getByText('Профіль відкритий, але потребує доповнення')).toBeInTheDocument()
    expect(within(panel).getByText('Опис профілю заповнений').parentElement).toHaveTextContent('Ні')
    expect(within(panel).getByText('Базова ціна налаштована').parentElement).toHaveTextContent('Ні')
    expect(within(panel).getByText('Є шлях для першого звернення').parentElement).toHaveTextContent('Ні')
    expect(within(panel).getByText(/Що варто доповнити перед публікацією:/)).toHaveTextContent(
      'опис профілю, базову ціну, доступність для звернень'
    )
  })

  it('renders minimum public profile readiness items when backend provides them', async () => {
    await renderView(buildDetail({
      profile_readiness: {
        ...buildDetail().profile_readiness!,
        public_profile_enabled: false,
        minimum_public_profile_ready: false,
        minimum_public_profile_readiness: {
          is_ready: false,
          completed_count: 5,
          total_count: 7,
          missing_items: ['photo', 'topics'],
          items: [
            { key: 'display_name', label: 'Публічне ім’я', complete: true },
            { key: 'photo', label: 'Фото', complete: false },
            { key: 'about', label: 'Опис', complete: true },
            { key: 'topics', label: 'Запити', complete: false },
          ],
        },
      },
    }))

    const panel = screen.getByRole('heading', { name: 'Готовність профілю' }).closest('section') as HTMLElement
    expect(within(panel).getByText('Публічний профіль увімкнено').parentElement).toHaveTextContent('Ні')
    expect(within(panel).getByText('Фото')).toBeInTheDocument()
    expect(within(panel).getByText('Запити')).toBeInTheDocument()
    const missingSummary = within(panel).getByText(/Що варто доповнити перед публікацією:/)
    expect(missingSummary).toHaveTextContent('Фото, Запити')
    expect(missingSummary).not.toHaveTextContent('Публічний профіль')
  })

  it('does not fail public link readiness when search visibility is false', async () => {
    await renderView(buildDetail({
      profile_readiness: {
        ...buildDetail().profile_readiness!,
        public_profile_link_available: true,
      },
    }))

    const panel = screen.getByRole('heading', { name: 'Готовність профілю' }).closest('section') as HTMLElement
    expect(within(panel).getByText('Публічне посилання доступне').parentElement).toHaveTextContent('Так')
  })

  it('does not render marketplace or rating wording in readiness panel', async () => {
    await renderView()

    const panel = screen.getByRole('heading', { name: 'Готовність профілю' }).closest('section') as HTMLElement
    expect(panel.textContent || '').not.toMatch(/рейтинг|топ|рекомендац|верифікац/i)
  })

  it('shows an empty state when the automatic first email is not recorded', async () => {
    await renderView()

    const panel = screen.getByRole('heading', { name: 'Перший лист спеціалісту' }).closest('section') as HTMLElement
    expect(panel).toBeTruthy()
    expect(within(panel).getByText('Автоматичний лист після реєстрації. Цей блок не надсилає листи.')).toBeInTheDocument()
    expect(within(panel).getByText('Не зафіксовано')).toBeInTheDocument()
    expect(within(panel).getByText('Автоматичний лист ще не зафіксовано.')).toBeInTheDocument()
    expect(within(panel).getByText(/За потреби перевірити спеціаліста вручну/)).toBeInTheDocument()
  })

  it('shows the automatic first email sent state and timestamp', async () => {
    await renderView(buildDetail({
      admin_context: {
        ...buildDetail().admin_context,
        signup_template_a_email: {
          sent: true,
          sent_at: '2026-06-02T09:30:00Z',
          item_key: 'specialist_signup_template_a_email:2',
        },
      },
    }))

    const panel = screen.getByRole('heading', { name: 'Перший лист спеціалісту' }).closest('section') as HTMLElement
    expect(within(panel).getByText('Надіслано автоматично')).toBeInTheDocument()
    expect(within(panel).getByText('Template A надіслано після реєстрації.')).toBeInTheDocument()
    expect(within(panel).getByText('Надіслано:').parentElement).toHaveTextContent('2026')
    expect(within(panel).getByText(/Дочекатися заповнення профілю/)).toBeInTheDocument()
  })

  it('shows an empty state when Template B is not recorded', async () => {
    await renderView()

    const panel = screen.getByRole('heading', { name: 'Другий лист спеціалісту' }).closest('section') as HTMLElement
    expect(panel).toBeTruthy()
    expect(within(panel).getByText('Статус відображає зафіксоване надсилання Template B. Цей блок не надсилає листи.')).toBeInTheDocument()
    expect(within(panel).getByText('Не зафіксовано')).toBeInTheDocument()
    expect(within(panel).getByText('Надсилання другого листа ще не зафіксовано.')).toBeInTheDocument()
    expect(within(panel).queryByText('Другий автоматичний лист ще не зафіксовано.')).not.toBeInTheDocument()
    expect(within(panel).getByText('Надіслано:').parentElement).toHaveTextContent('—')
    expect(within(panel).getByText('Варіант:').parentElement).toHaveTextContent('—')
    expect(panel.textContent || '').not.toMatch(/48|заплановано|worker|буде автоматично|автоматичне надсилання/i)
  })

  it('shows Template B sent state, timestamp, and variant', async () => {
    await renderView(buildDetail({
      admin_context: {
        ...buildDetail().admin_context,
        signup_template_b_email: {
          sent: true,
          sent_at: '2026-06-04T10:45:00Z',
          item_key: 'specialist_signup_template_b_email:2',
          variant: 'B6_SEARCH_VISIBLE_FEEDBACK',
        },
      },
    }))

    const panel = screen.getByRole('heading', { name: 'Другий лист спеціалісту' }).closest('section') as HTMLElement
    expect(within(panel).getByText('Надіслано')).toBeInTheDocument()
    expect(within(panel).getByText('Template B надіслано.')).toBeInTheDocument()
    expect(within(panel).getByText('Надіслано:').parentElement).toHaveTextContent('2026')
    expect(within(panel).getByText('Варіант:').parentElement).toHaveTextContent('B6_SEARCH_VISIBLE_FEEDBACK')
  })

  it('does not crash when Template B status is absent from a compatibility payload', async () => {
    const detail = buildDetail({
      admin_context: {
        ...buildDetail().admin_context,
      },
    })
    delete detail.admin_context.signup_template_b_email

    await renderView(detail)

    const firstEmailPanel = screen.getByRole('heading', { name: 'Перший лист спеціалісту' }).closest('section') as HTMLElement
    expect(within(firstEmailPanel).getByText('Автоматичний лист ще не зафіксовано.')).toBeInTheDocument()
    const secondEmailPanel = screen.getByRole('heading', { name: 'Другий лист спеціалісту' }).closest('section') as HTMLElement
    expect(within(secondEmailPanel).getByText('Надсилання другого листа ще не зафіксовано.')).toBeInTheDocument()
    expect(within(secondEmailPanel).queryByText('Другий автоматичний лист ще не зафіксовано.')).not.toBeInTheDocument()
  })

  it('renders a safe new-tab link to the public profile when enabled and slug exists', async () => {
    await renderView()

    const link = await screen.findByRole('link', { name: 'Відкрити публічний профіль' })
    expect(link).toHaveAttribute('href', '/s/olena')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('does not render an active public profile link when the public profile is disabled', async () => {
    await renderView(buildDetail({
      identity: {
        ...buildDetail().identity,
        public_profile_enabled: false,
        slug: 'olena',
      },
    }))

    expect(screen.queryByRole('link', { name: 'Відкрити публічний профіль' })).not.toBeInTheDocument()
    expect(await screen.findByText('Публічний профіль вимкнено')).toBeInTheDocument()
  })

  it('does not render an active public profile link when slug is missing', async () => {
    await renderView(buildDetail({
      identity: {
        ...buildDetail().identity,
        public_profile_enabled: true,
        slug: '',
        public_slug: '',
      },
    }))

    expect(screen.queryByRole('link', { name: 'Відкрити публічний профіль' })).not.toBeInTheDocument()
    expect(await screen.findByText('Слаг профілю не налаштовано')).toBeInTheDocument()
  })

  it('does not require search visibility for the public profile link', async () => {
    await renderView(buildDetail({
      identity: {
        ...buildDetail().identity,
        public_profile_enabled: true,
        slug: 'olena-hidden-search',
        is_search_visible: false,
      } as any,
    }))

    expect(await screen.findByRole('link', { name: 'Відкрити публічний профіль' })).toHaveAttribute(
      'href',
      '/s/olena-hidden-search'
    )
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
