import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
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
const canonicalReadinessItems = [
  { key: 'display_name', label: 'Публічне ім’я', complete: true },
  { key: 'about', label: 'Опис', complete: true },
  { key: 'topics', label: 'Спеціалізації', complete: true },
  { key: 'work_format', label: 'Формат роботи', complete: true },
  { key: 'first_contact', label: 'Запис або запит', complete: true },
  { key: 'price_decision', label: 'Вартість консультації', complete: true },
]

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
    admin_crm_state: {
      readiness: {
        is_ready: true,
        completed_count: 6,
        total_count: 6,
        missing_items: [],
        items: canonicalReadinessItems,
      },
      visibility: {
        public_profile_enabled: true,
        is_search_visible: false,
        state: 'direct_link_only',
        public_profile_path: '/s/olena',
      },
      client_entry: {
        mode: 'request_only',
        show_public_availability: false,
        has_future_available_windows: false,
        windows_attention_required: false,
      },
      onboarding: {
        template_a: {
          sent: false,
          sent_at: null,
        },
        template_b: {
          sent: false,
          sent_at: null,
          variant: null,
          variant_label: null,
        },
      },
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
        source: null,
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
        source: 'SIGNUP_COMPLIMENTARY',
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

  it('renders canonical readiness from admin_crm_state', async () => {
    await renderView()

    const panel = screen.getByRole('heading', { name: 'Готовність профілю' }).closest('article') as HTMLElement
    expect(within(panel).getByText('Усі обов’язкові дані заповнені')).toBeInTheDocument()
    expect(within(panel).getByText('6 з 6')).toBeInTheDocument()
    for (const item of canonicalReadinessItems) {
      expect(within(panel).getByText(item.label).parentElement).toHaveTextContent('Готово')
    }
    expect(panel.textContent || '').not.toMatch(/Фото|Основні запити|Теми й запити|Запити/)
    expect(within(panel).queryByText(/Не вистачає:/)).not.toBeInTheDocument()
  })

  it('shows the immutable source of an active automatic trial', async () => {
    await renderView(activeAccessDetail())

    expect(await screen.findByTestId('trial-source')).toHaveTextContent('Автоматично після реєстрації')
    expect(screen.getByTestId('trial-source-summary')).toHaveTextContent('Автоматично після реєстрації')
  })

  it('renders incomplete canonical readiness and missing summary from backend labels', async () => {
    await renderView(buildDetail({
      admin_crm_state: {
        ...buildDetail().admin_crm_state!,
        readiness: {
          is_ready: false,
          completed_count: 4,
          total_count: 6,
          missing_items: ['topics', 'work_format'],
          items: canonicalReadinessItems.map((item) =>
            item.key === 'topics' || item.key === 'work_format'
              ? { ...item, complete: false }
              : item
          ),
        },
      },
    }))

    const panel = screen.getByRole('heading', { name: 'Готовність профілю' }).closest('article') as HTMLElement
    expect(within(panel).getByText('Заповнено 4 з 6')).toBeInTheDocument()
    expect(within(panel).getByText('4 з 6')).toBeInTheDocument()
    expect(within(panel).getByText('Спеціалізації').parentElement).toHaveTextContent('Потрібно доповнити')
    expect(within(panel).getByText('Формат роботи').parentElement).toHaveTextContent('Потрібно доповнити')
    expect(within(panel).getByText('Не вистачає: Спеціалізації, Формат роботи')).toBeInTheDocument()
  })

  it('renders visibility states and controls public profile action from admin_crm_state', async () => {
    const cases = [
      {
        state: 'unpublished',
        badge: 'Не опубліковано',
        text: 'Сторінка ще недоступна клієнтам.',
        path: '/s/olena',
        hasLink: false,
      },
      {
        state: 'direct_link_only',
        badge: 'Доступно за посиланням',
        text: 'Сторінка опублікована, але не показується в пошуку Pro Consult.',
        path: '/s/olena',
        hasLink: true,
      },
      {
        state: 'search_visible',
        badge: 'Показується в пошуку',
        text: 'Сторінка опублікована й доступна в пошуку Pro Consult.',
        path: '/s/olena',
        hasLink: true,
      },
      {
        state: 'invalid',
        badge: 'Некоректний службовий стан',
        text: 'Показ у пошуку увімкнено для неопублікованої сторінки. Потрібна службова перевірка.',
        path: '/s/olena',
        hasLink: false,
      },
      {
        state: 'direct_link_only',
        badge: 'Доступно за посиланням',
        text: 'Сторінка опублікована, але не показується в пошуку Pro Consult.',
        path: null,
        hasLink: false,
        missingPath: true,
      },
    ]

    for (const item of cases) {
      cleanup()
      await renderView(buildDetail({
        admin_crm_state: {
          ...buildDetail().admin_crm_state!,
          visibility: {
            public_profile_enabled: item.state !== 'unpublished',
            is_search_visible: item.state === 'search_visible' || item.state === 'invalid',
            state: item.state,
            public_profile_path: item.path,
          },
        },
      }))

      const panel = screen.getByRole('heading', { name: 'Публікація та пошук' }).closest('article') as HTMLElement
      expect(within(panel).getByText(item.badge)).toBeInTheDocument()
      expect(within(panel).getByText(item.text)).toBeInTheDocument()
      if (item.hasLink) {
        expect(within(panel).getByRole('link', { name: 'Відкрити публічний профіль' })).toHaveAttribute(
          'href',
          '/s/olena'
        )
      } else {
        expect(within(panel).queryByRole('link', { name: 'Відкрити публічний профіль' })).not.toBeInTheDocument()
      }
      if (item.missingPath) {
        expect(within(panel).getByText('Публічне посилання ще не сформоване.')).toBeInTheDocument()
      }
    }
  })

  it('renders client-entry states without treating request-only as missing windows', async () => {
    const cases = [
      {
        mode: 'request_only',
        show_public_availability: false,
        has_future_available_windows: false,
        windows_attention_required: false,
        badge: 'Запит без вибору часу',
        text: 'Клієнти можуть залишати запит, а спеціаліст сам узгоджує час. Вікна для запису не обов’язкові.',
      },
      {
        mode: 'direct_booking',
        show_public_availability: true,
        has_future_available_windows: true,
        windows_attention_required: false,
        badge: 'Запис на доступне вікно',
        text: 'Клієнти можуть обирати доступний час. Майбутні вікна для запису є.',
      },
      {
        mode: 'direct_booking',
        show_public_availability: true,
        has_future_available_windows: false,
        windows_attention_required: true,
        badge: 'Запис на доступне вікно',
        text: 'Прямий запис увімкнено, але майбутніх доступних вікон немає.',
      },
      {
        mode: 'direct_booking',
        show_public_availability: false,
        has_future_available_windows: false,
        windows_attention_required: false,
        badge: 'Запис на доступне вікно',
        text: 'Прямий запис обрано, але показ доступних вікон у публічному профілі вимкнено.',
      },
      {
        mode: 'unknown',
        show_public_availability: false,
        has_future_available_windows: false,
        windows_attention_required: false,
        badge: 'Не налаштовано',
        text: 'Спосіб звернення клієнтів ще не визначено.',
      },
    ]

    for (const item of cases) {
      cleanup()
      await renderView(buildDetail({
        admin_crm_state: {
          ...buildDetail().admin_crm_state!,
          client_entry: item,
        },
      }))

      const panel = screen.getByRole('heading', { name: 'Запис і запити' }).closest('article') as HTMLElement
      expect(within(panel).getByText(item.badge)).toBeInTheDocument()
      expect(within(panel).getByText(item.text)).toBeInTheDocument()
      if (item.mode === 'request_only' || item.show_public_availability === false) {
        expect(panel.textContent || '').not.toMatch(/майбутніх доступних вікон немає/)
      }
    }
  })

  it('renders onboarding state with human Template B label and raw code as metadata', async () => {
    await renderView(buildDetail({
      admin_crm_state: {
        ...buildDetail().admin_crm_state!,
        onboarding: {
          template_a: {
            sent: true,
            sent_at: '2026-06-02T09:30:00Z',
          },
          template_b: {
            sent: true,
            sent_at: '2026-06-04T10:45:00Z',
            variant: 'B4_READY_PUBLIC_FEEDBACK',
            variant_label: 'Опубліковано за прямим посиланням',
          },
        },
      },
    }))

    const panel = screen.getByRole('heading', { name: 'Онбординг' }).closest('article') as HTMLElement
    const templateA = within(panel).getByRole('region', { name: 'Перший лист спеціалісту' })
    expect(within(templateA).getByText('Автоматичний лист після реєстрації надіслано.')).toBeInTheDocument()
    expect(within(templateA).getByText(/Надіслано:/)).toHaveTextContent('2026')
    const templateB = within(panel).getByRole('region', { name: 'Другий лист спеціалісту' })
    expect(within(templateB).getByText('Опубліковано за прямим посиланням')).toBeInTheDocument()
    expect(within(templateB).getByText('Код варіанта: B4_READY_PUBLIC_FEEDBACK')).toBeInTheDocument()
  })

  it('renders Template B fallback label, absent state, and legacy B5 label safely', async () => {
    await renderView(buildDetail({
      admin_crm_state: {
        ...buildDetail().admin_crm_state!,
        onboarding: {
          template_a: { sent: false, sent_at: null },
          template_b: {
            sent: true,
            sent_at: '2026-06-04T10:45:00Z',
            variant: 'UNKNOWN_VARIANT',
            variant_label: null,
          },
        },
      },
    }))

    let panel = screen.getByRole('heading', { name: 'Онбординг' }).closest('article') as HTMLElement
    expect(within(panel).getByText('Зафіксовано варіант: UNKNOWN_VARIANT')).toBeInTheDocument()

    cleanup()
    await renderView(buildDetail({
      admin_crm_state: {
        ...buildDetail().admin_crm_state!,
        onboarding: {
          template_a: { sent: false, sent_at: null },
          template_b: { sent: false, sent_at: null, variant: null, variant_label: null },
        },
      },
    }))

    panel = screen.getByRole('heading', { name: 'Онбординг' }).closest('article') as HTMLElement
    expect(within(panel).getByText('Надсилання першого листа не зафіксовано.')).toBeInTheDocument()
    expect(within(panel).getByText('Надсилання другого листа ще не зафіксовано.')).toBeInTheDocument()

    cleanup()
    await renderView(buildDetail({
      admin_crm_state: {
        ...buildDetail().admin_crm_state!,
        onboarding: {
          template_a: { sent: false, sent_at: null },
          template_b: {
            sent: true,
            sent_at: '2026-06-04T10:45:00Z',
            variant: 'B5_PUBLIC_BUT_INCOMPLETE',
            variant_label: 'Опублікований профіль потребував доповнення',
          },
        },
      },
    }))

    panel = screen.getByRole('heading', { name: 'Онбординг' }).closest('article') as HTMLElement
    expect(within(panel).getByText('Опублікований профіль потребував доповнення')).toBeInTheDocument()
  })

  it('falls back to legacy detail fields when admin_crm_state is absent', async () => {
    const detail = buildDetail({
      admin_crm_state: null,
      admin_context: {
        ...buildDetail().admin_context,
        signup_template_a_email: {
          sent: true,
          sent_at: '2026-06-02T09:30:00Z',
          item_key: 'specialist_signup_template_a_email:2',
        },
        signup_template_b_email: {
          sent: true,
          sent_at: '2026-06-04T10:45:00Z',
          item_key: 'specialist_signup_template_b_email:2',
          variant: 'B6_SEARCH_VISIBLE_FEEDBACK',
        },
      },
    })

    await renderView(detail)

    expect(screen.getByRole('heading', { name: 'Готовність профілю' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Публікація та пошук' })).toBeInTheDocument()
    expect(screen.getByText('Сторінка опублікована. Дані про показ у пошуку недоступні.')).toBeInTheDocument()
    expect(screen.getAllByText('Дані про спосіб звернення недоступні').length).toBeGreaterThan(0)
    const panel = screen.getByRole('heading', { name: 'Онбординг' }).closest('article') as HTMLElement
    expect(within(panel).getByText('Автоматичний лист після реєстрації надіслано.')).toBeInTheDocument()
    expect(within(panel).getByText('Зафіксовано варіант: B6_SEARCH_VISIBLE_FEEDBACK')).toBeInTheDocument()
  })

  it('renders neutral unavailable states for missing optional CRM subobjects', async () => {
    await renderView(buildDetail({
      admin_crm_state: {
        readiness: null,
        visibility: null,
        client_entry: null,
        onboarding: null,
      },
      profile_readiness: undefined,
      admin_context: {
        ...buildDetail().admin_context,
        signup_template_a_email: undefined,
        signup_template_b_email: undefined,
      },
    }))

    expect(screen.getAllByText('Дані про готовність недоступні').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Дані про публікацію недоступні').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Дані про спосіб звернення недоступні').length).toBeGreaterThan(0)
    expect(screen.getByText('Дані про онбординг недоступні')).toBeInTheDocument()
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
