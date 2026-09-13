import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import BillingView from './BillingView.vue'
import {
  apiGet,
  createActiveClientLimitIncreaseRequest,
  createBillingAccessRequest,
  fetchBillingAccessRequestState,
} from '../lib/api'

const mockMe = ref<any>(null)
const mockLoadMe = vi.fn()
const mockToast = {
  success: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
}

vi.mock('pinia', () => ({
  storeToRefs: (store: any) => store,
}))

vi.mock('../stores/auth', () => ({
  useAuthStore: () => ({
    me: mockMe,
    loadMe: mockLoadMe,
  }),
}))

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
  createActiveClientLimitIncreaseRequest: vi.fn(),
  fetchBillingAccessRequestState: vi.fn(),
  createBillingAccessRequest: vi.fn(),
  getApiErrorMessage: vi.fn(() => 'Request failed'),
}))

vi.mock('../composables/useToast', () => ({
  useToast: () => mockToast,
}))

const mockedApiGet = vi.mocked(apiGet)
const mockedCreateActiveClientLimitIncreaseRequest = vi.mocked(createActiveClientLimitIncreaseRequest)
const mockedFetchBillingAccessRequestState = vi.mocked(fetchBillingAccessRequestState)
const mockedCreateBillingAccessRequest = vi.mocked(createBillingAccessRequest)

function buildAccessSummary(overrides: Record<string, unknown> = {}) {
  return {
    plan: 'START',
    base_plan: 'START',
    effective_plan: 'START',
    access_source: 'base_plan',
    access_label: 'Поточний тариф',
    access_message: 'Доступ відповідає тарифу Start.',
    trial: { active: false, plan: null, starts_at: null, ends_at: null },
    override: { active: false, plan: null, expires_at: null },
    current_request: null,
    latest_request: null,
    active_client_limit_increase_request: {
      has_pending_request: false,
      current_request: null,
      latest_request: null,
    },
    limits: {
      active_clients: {
        used: 0,
        limit: 3,
        base_limit: 3,
        extra_slots: 0,
        extra_slots_limit: 3,
        effective_limit: 3,
        remaining: 3,
        extra_slot_price_uah: 200,
        can_buy_extra_slot: true,
        requires_pro: false,
        upgrade_required_plan: null,
      },
      guest_sessions: { used: 0, limit: 5 },
    },
    features: [
      {
        code: 'group_room',
        available: false,
        required_plan: 'PRO',
        reason: 'Доступно у тарифі Pro',
      },
    ],
    ...overrides,
  }
}

function setCurrentPlan(plan: 'START' | 'PRO' | 'LEADER', summaryOverrides: Record<string, unknown> = {}) {
  const baseLimit = plan === 'LEADER' ? 60 : plan === 'PRO' ? 20 : 3
  const extraSlotsLimit = plan === 'PRO' ? 6 : plan === 'START' ? 3 : 0
  mockMe.value = {
    access_state: 'OK',
    effective_entitlements: {
      plan,
      active_client_limit: baseLimit,
      active_client_entitlement: {
        used: 0,
        limit: baseLimit,
        base_limit: baseLimit,
        extra_slots: 0,
        extra_slots_limit: extraSlotsLimit,
        effective_limit: baseLimit,
        remaining: baseLimit,
        extra_slot_price_uah: 200,
        can_buy_extra_slot: plan !== 'LEADER',
        requires_pro: false,
        upgrade_required_plan: null,
      },
      group_room_enabled: false,
    },
  }
  mockedApiGet.mockResolvedValue(
    buildAccessSummary({
      plan,
      base_plan: plan,
      effective_plan: plan,
      limits: {
        active_clients: {
          used: 0,
          limit: baseLimit,
          base_limit: baseLimit,
          extra_slots: 0,
          extra_slots_limit: extraSlotsLimit,
          effective_limit: baseLimit,
          remaining: baseLimit,
          extra_slot_price_uah: 200,
          can_buy_extra_slot: plan !== 'LEADER',
          requires_pro: false,
          upgrade_required_plan: null,
        },
        guest_sessions: { used: 0, limit: plan === 'LEADER' ? 60 : plan === 'PRO' ? 20 : 5 },
      },
      ...summaryOverrides,
    }) as any
  )
}

function renderView() {
  return render(BillingView, {
    global: {
      stubs: {
        SettingsSubnav: { template: '<div data-testid="settings-subnav" />' },
        RouterLink: {
          template: '<a><slot /></a>',
        },
      },
    },
  })
}

describe('BillingView downgrade semantics', () => {
  beforeEach(() => {
    mockLoadMe.mockReset()
    mockLoadMe.mockResolvedValue(undefined)

    mockedApiGet.mockReset()
    mockedFetchBillingAccessRequestState.mockReset()
    mockedFetchBillingAccessRequestState.mockResolvedValue({
      has_pending_request: false,
      active_request: null,
      latest_request: null,
    })

    mockedCreateBillingAccessRequest.mockReset()
    mockedCreateActiveClientLimitIncreaseRequest.mockReset()
    mockToast.success.mockReset()
    mockToast.info.mockReset()
    mockToast.warning.mockReset()
    mockToast.error.mockReset()
  })

  it('shows explanatory downgrade copy and no broken downgrade CTA for LEADER', async () => {
    setCurrentPlan('LEADER')
    renderView()

    await waitFor(() => {
      expect(mockedFetchBillingAccessRequestState).toHaveBeenCalled()
    })

    expect(screen.queryByText('Нижчий план')).not.toBeInTheDocument()
    expect(screen.getAllByText('Перехід на нижчий план зараз оформлюється через підтримку.')).toHaveLength(1)
  })

  it('shows downgrade note once for PRO and marks Leader as unavailable during beta', async () => {
    setCurrentPlan('PRO')
    renderView()

    await waitFor(() => {
      expect(mockedFetchBillingAccessRequestState).toHaveBeenCalled()
    })

    expect(screen.queryByText('Нижчий план')).not.toBeInTheDocument()
    expect(screen.getAllByText('Перехід на нижчий план зараз оформлюється через підтримку.')).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'Перейти на Leader' })).not.toBeInTheDocument()
    expect(screen.getAllByText('Тариф готується').length).toBeGreaterThan(0)
    expect(screen.getByText('Недоступно під час beta')).toBeInTheDocument()
  })

  it('does not render downgrade note for START', async () => {
    setCurrentPlan('START')
    renderView()

    await waitFor(() => {
      expect(mockedFetchBillingAccessRequestState).toHaveBeenCalled()
    })

    expect(screen.queryByText('Нижчий план')).not.toBeInTheDocument()
    expect(screen.queryByText('Перехід на нижчий план зараз оформлюється через підтримку.')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Подати заявку на Pro' }).length).toBeGreaterThan(0)
  })

  it('shows active client slot model for Start and PRO', async () => {
    setCurrentPlan('PRO')
    renderView()

    await waitFor(() => {
      expect(mockedFetchBillingAccessRequestState).toHaveBeenCalled()
    })

    expect(screen.getByText('Розширення ліміту активних клієнтів')).toBeInTheDocument()
    expect(screen.getByText(/Start включає 3 активні клієнти, PRO — 20/)).toBeInTheDocument()
    expect(screen.getByText('20 активних клієнтів включено')).toBeInTheDocument()
    expect(screen.getByText('Можна розширити ліміт до 26 клієнтів')).toBeInTheDocument()
    expect(screen.getAllByText('+1 активний клієнт — 200 грн/міс').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Запросити розширення ліміту' })).toBeEnabled()
    expect(screen.getByLabelText('Кількість')).toBeInTheDocument()
    expect(screen.getAllByRole('option').map((option) => option.textContent?.trim())).toEqual([
      '+1',
      '+2',
      '+3',
      '+4',
      '+5',
      '+6',
    ])
    expect(screen.getAllByText('+1 активний клієнт — 200 грн/міс').length).toBeGreaterThan(0)
  })

  it('creates active client limit increase request with selected quantity from billing panel', async () => {
    setCurrentPlan('PRO')
    mockedCreateActiveClientLimitIncreaseRequest.mockResolvedValue({
      id: 44,
      status: 'PENDING',
      requested_extra_slots: 3,
      plan_snapshot: 'PRO',
      base_active_client_limit_snapshot: 20,
      current_extra_active_client_slots_snapshot: 0,
      max_extra_active_client_slots_snapshot: 6,
      price_uah_per_month_snapshot: '600.00',
      specialist_note: '',
      created_at: '2026-06-19T10:00:00Z',
      updated_at: '2026-06-19T10:00:00Z',
      decided_at: null,
    })
    renderView()

    await waitFor(() => {
      expect(mockedFetchBillingAccessRequestState).toHaveBeenCalled()
    })

    await fireEvent.update(screen.getByLabelText('Кількість'), '3')

    await waitFor(() => {
      expect(screen.getByText('+3 активні клієнти — 600 грн/міс')).toBeInTheDocument()
    })
    expect(screen.getByText('Разом після схвалення: 1 590 грн/міс')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Запросити розширення ліміту' }))

    await waitFor(() => {
      expect(mockedCreateActiveClientLimitIncreaseRequest).toHaveBeenCalledWith({
        requested_extra_slots: 3,
      })
    })
    expect(screen.getByText('Запит на +3 активні клієнти надіслано адміністратору.')).toBeInTheDocument()
    expect(mockToast.success).toHaveBeenCalledWith('Запит на +3 активні клієнти надіслано адміністратору.')
    expect(screen.getByRole('button', { name: 'Запросити розширення ліміту' })).toBeDisabled()
  })

  it('shows pending toast when active client limit request already exists', async () => {
    setCurrentPlan('PRO')
    mockedCreateActiveClientLimitIncreaseRequest.mockRejectedValue({
      response: {
        data: {
          code: 'PENDING_ACTIVE_CLIENT_LIMIT_REQUEST_EXISTS',
          current_request: {
            id: 55,
            status: 'PENDING',
            requested_extra_slots: 4,
            plan_snapshot: 'PRO',
            base_active_client_limit_snapshot: 20,
            current_extra_active_client_slots_snapshot: 0,
            max_extra_active_client_slots_snapshot: 6,
            price_uah_per_month_snapshot: '800.00',
            specialist_note: '',
            created_at: '2026-06-19T10:00:00Z',
            updated_at: '2026-06-19T10:00:00Z',
            decided_at: null,
          },
        },
      },
    })
    renderView()

    await waitFor(() => {
      expect(mockedFetchBillingAccessRequestState).toHaveBeenCalled()
    })

    await fireEvent.update(screen.getByLabelText('Кількість'), '4')
    await fireEvent.click(screen.getByRole('button', { name: 'Запросити розширення ліміту' }))

    await waitFor(() => {
      expect(screen.getByText('Запит на +4 активні клієнти очікує розгляду.')).toBeInTheDocument()
    })
    expect(mockToast.info).toHaveBeenCalledWith('Запит на +4 активні клієнти очікує розгляду.')
  })

  it('shows total monthly price after approval for START active client increase', async () => {
    setCurrentPlan('START')
    renderView()

    await waitFor(() => {
      expect(mockedFetchBillingAccessRequestState).toHaveBeenCalled()
    })

    await fireEvent.update(screen.getByLabelText('Кількість'), '3')

    expect(screen.getByText('+3 активні клієнти — 600 грн/міс')).toBeInTheDocument()
    expect(screen.getByText('Разом після схвалення: 600 грн/міс')).toBeInTheDocument()
  })

  it('shows total monthly price after approval for PRO active client increase', async () => {
    setCurrentPlan('PRO')
    renderView()

    await waitFor(() => {
      expect(mockedFetchBillingAccessRequestState).toHaveBeenCalled()
    })

    await fireEvent.update(screen.getByLabelText('Кількість'), '6')

    expect(screen.getByText('+6 активних клієнтів — 1 200 грн/міс')).toBeInTheDocument()
    expect(screen.getByText('Разом після схвалення: 2 190 грн/міс')).toBeInTheDocument()
  })

  it('shows pending state for active client limit request', async () => {
    setCurrentPlan('START', {
      active_client_limit_increase_request: {
        has_pending_request: true,
        current_request: {
          id: 45,
          status: 'PENDING',
          requested_extra_slots: 3,
          plan_snapshot: 'START',
          base_active_client_limit_snapshot: 3,
          current_extra_active_client_slots_snapshot: 0,
          max_extra_active_client_slots_snapshot: 3,
          price_uah_per_month_snapshot: '600.00',
          created_at: '2026-06-19T10:00:00Z',
          updated_at: '2026-06-19T10:00:00Z',
          decided_at: null,
        },
        latest_request: null,
      },
    })
    renderView()

    await waitFor(() => {
      expect(screen.getByText('Запит на +3 активні клієнти очікує розгляду.')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Запросити розширення ліміту' })).toBeDisabled()
  })

  it('shows max reached state for active client limit request', async () => {
    setCurrentPlan('START', {
      limits: {
        active_clients: {
          used: 0,
          limit: 6,
          base_limit: 3,
          extra_slots: 3,
          extra_slots_limit: 3,
          effective_limit: 6,
          remaining: 6,
          extra_slot_price_uah: 200,
          can_buy_extra_slot: false,
          requires_pro: true,
          upgrade_required_plan: 'PRO',
        },
        guest_sessions: { used: 0, limit: 5 },
      },
    })
    renderView()

    await waitFor(() => {
      expect(screen.getByText('Максимальний ліміт для вашого тарифу вже використано.')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Запросити розширення ліміту' })).toBeDisabled()
  })

  it('uses neutral active-access label for OK state', async () => {
    setCurrentPlan('START')
    renderView()

    await waitFor(() => {
      expect(mockedFetchBillingAccessRequestState).toHaveBeenCalled()
    })

    expect(screen.getByText('Доступ активний')).toBeInTheDocument()
    expect(screen.queryByText('Повний доступ')).not.toBeInTheDocument()
  })

  it('uses beta access request flow instead of checkout payment wording', async () => {
    setCurrentPlan('START')
    mockedCreateBillingAccessRequest.mockResolvedValue({
      has_pending_request: true,
      request: {
        id: 101,
        therapist: 77,
        requested_plan: 'PRO',
        status: 'PENDING',
        note: 'upgrade_from:START',
        admin_note: 'Internal note must stay hidden',
        created_at: '2026-03-31T10:00:00Z',
        updated_at: '2026-03-31T10:00:00Z',
        decided_at: null,
        decided_by: null,
      },
    })
    renderView()

    await waitFor(() => {
      expect(mockedFetchBillingAccessRequestState).toHaveBeenCalled()
    })

    const upgradeButton = screen.getAllByRole('button', { name: 'Подати заявку на Pro' })[0]!
    await fireEvent.click(upgradeButton)

    await waitFor(() => {
      expect(mockedCreateBillingAccessRequest).toHaveBeenCalledWith({
        requested_plan: 'PRO',
        note: 'upgrade_from:START',
      })
    })

    expect(screen.getAllByText('Заявку зафіксовано. Команда розгляне її вручну.').length).toBeGreaterThan(0)
    expect(screen.queryByText(/онлайн-оплата/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/сторінка оплати/i)).not.toBeInTheDocument()
    expect(screen.queryByText('Internal note must stay hidden')).not.toBeInTheDocument()
  })

  it('shows visible success feedback after requesting individual terms', async () => {
    setCurrentPlan('START')
    mockedCreateBillingAccessRequest.mockResolvedValue({
      has_pending_request: true,
      request: {
        id: 101,
        therapist: 77,
        requested_plan: 'PRO',
        status: 'PENDING',
        note: 'upgrade_from:START',
        admin_note: '',
        created_at: '2026-03-31T10:00:00Z',
        updated_at: '2026-03-31T10:00:00Z',
        decided_at: null,
        decided_by: null,
      },
    })
    renderView()

    await waitFor(() => {
      expect(mockedFetchBillingAccessRequestState).toHaveBeenCalled()
    })

    const requestButtons = screen.getAllByRole('button', { name: 'Подати заявку на Pro' })
    await fireEvent.click(requestButtons[0]!)

    await waitFor(() => {
      expect(mockedCreateBillingAccessRequest).toHaveBeenCalledWith({
        requested_plan: 'PRO',
        note: 'upgrade_from:START',
      })
    })

    expect(screen.getAllByText('Заявку зафіксовано. Команда розгляне її вручну.').length).toBeGreaterThan(
      0
    )
  })

  it('does not expose Leader request or checkout actions in specialist billing UI', async () => {
    setCurrentPlan('START')
    renderView()

    await waitFor(() => {
      expect(mockedFetchBillingAccessRequestState).toHaveBeenCalled()
    })

    expect(screen.queryByRole('button', { name: 'Перейти на Leader' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Подати заявку на Leader' })).not.toBeInTheDocument()
    expect(screen.getAllByText('Тариф готується').length).toBeGreaterThan(0)

    const requestButtons = screen.getAllByRole('button', { name: 'Подати заявку на Pro' })
    await fireEvent.click(requestButtons[0]!)

    await waitFor(() => {
      expect(mockedCreateBillingAccessRequest).toHaveBeenCalledWith({
        requested_plan: 'PRO',
        note: 'upgrade_from:START',
      })
    })
    expect(mockedCreateBillingAccessRequest).not.toHaveBeenCalledWith(
      expect.objectContaining({ requested_plan: 'LEADER' })
    )
  })

  it('shows base tariff summary for START without trial or override', async () => {
    setCurrentPlan('START')
    renderView()

    await waitFor(() => {
      expect(screen.getByText('Ваш доступ зараз: Start')).toBeInTheDocument()
    })

    expect(screen.getByText('Вам доступні можливості тарифу Start.')).toBeInTheDocument()
  })

  it('shows Start as free with 3 active clients and no outdated euro prices', async () => {
    setCurrentPlan('START')
    const view = renderView()

    await waitFor(() => {
      expect(screen.getAllByText('0 грн').length).toBeGreaterThan(0)
    })

    expect(screen.getAllByText('3 активні клієнти включено').length).toBeGreaterThan(0)
    expect(screen.getByText('Можна розширити ліміт до 6 клієнтів')).toBeInTheDocument()
    expect(screen.getByText(/Ранній доступ активується автоматично після реєстрації/)).toBeInTheDocument()
    expect(screen.getByText(/розширені можливості без промокоду/)).toBeInTheDocument()
    expect(view.container).not.toHaveTextContent('FOUNDER')
    expect(screen.queryByText('До 5 постійних клієнтів')).not.toBeInTheDocument()
    expect(view.container).not.toHaveTextContent('€10')
    expect(view.container).not.toHaveTextContent('€24')
    expect(view.container).not.toHaveTextContent('€59')
    expect(view.container).not.toHaveTextContent('€240')
    expect(view.container).not.toHaveTextContent('€590')
  })

  it('explains START base with active PRO trial', async () => {
    setCurrentPlan('START', {
      plan: 'PRO',
      base_plan: 'START',
      effective_plan: 'PRO',
      access_source: 'trial',
      access_label: 'Тестовий доступ',
      trial: {
        active: true,
        plan: 'PRO',
        starts_at: '2026-04-24T10:00:00Z',
        ends_at: '2026-05-24T10:00:00Z',
      },
    })
    renderView()

    await waitFor(() => {
      expect(screen.getByText('Ваш доступ зараз: Pro')).toBeInTheDocument()
    })
    expect(screen.getByText('Вам відкрито тестовий доступ до можливостей тарифу Pro.')).toBeInTheDocument()
    expect(screen.getByText(/Початок тестового доступу:/)).toBeInTheDocument()
    expect(screen.getByText(/Завершення тестового доступу:/)).toBeInTheDocument()
  })

  it('shows no complimentary trial expiry warning with more than three days remaining', async () => {
    setCurrentPlan('START', {
      plan: 'PRO',
      effective_plan: 'PRO',
      access_source: 'trial',
      complimentary_trial_warning: null,
    })
    renderView()

    await waitFor(() => {
      expect(screen.getByText('Ваш доступ зараз: Pro')).toBeInTheDocument()
    })

    expect(screen.queryByText('Тестовий доступ до Pro завершується')).not.toBeInTheDocument()
  })

  it('shows an expiring complimentary trial warning with local date and Pro CTA', async () => {
    setCurrentPlan('START', {
      plan: 'PRO',
      effective_plan: 'PRO',
      access_source: 'trial',
      complimentary_trial_warning: {
        state: 'EXPIRING',
        ends_at: '2026-09-15T10:30:00Z',
      },
    })
    renderView()

    await waitFor(() => {
      expect(screen.getByText('Тестовий доступ до Pro завершується')).toBeInTheDocument()
    })

    expect(screen.getByText(/15\.09\.2026.*13:30/)).toBeInTheDocument()
    const button = screen.getByRole('button', { name: 'Перейти на Pro' })
    await fireEvent.click(button)
    expect(mockedCreateBillingAccessRequest).toHaveBeenCalledWith({
      requested_plan: 'PRO',
      note: 'upgrade_from:PRO',
    })
  })

  it('shows continuity copy after a complimentary trial expires', async () => {
    setCurrentPlan('START', {
      access_state: 'START_SOFT_RESTRICTED',
      complimentary_trial_warning: {
        state: 'EXPIRED',
        ends_at: '2026-09-10T10:30:00Z',
      },
    })
    mockMe.value.access_state = 'START_SOFT_RESTRICTED'
    renderView()

    await waitFor(() => {
      expect(screen.getByText('Тестовий доступ до Pro завершився')).toBeInTheDocument()
    })

    expect(
      screen.getAllByText(/Поточна практика, клієнти та сесії збережені/)
    ).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Продовжити Pro' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Перейти на Pro' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Подати заявку на Pro' })).not.toBeInTheDocument()
  })

  it('disables the complimentary trial CTA while a Pro request is pending', async () => {
    setCurrentPlan('START', {
      plan: 'PRO',
      effective_plan: 'PRO',
      access_source: 'trial',
      complimentary_trial_warning: {
        state: 'EXPIRING',
        ends_at: '2026-09-15T10:30:00Z',
      },
      current_request: {
        id: 77,
        requested_plan: 'PRO',
        status: 'PENDING',
        created_at: '2026-09-12T10:30:00Z',
        reviewed_at: null,
      },
    })
    renderView()

    await waitFor(() => {
      expect(screen.getByText('Тестовий доступ до Pro завершується')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: 'Заявка очікує розгляду' })).toBeDisabled()
    expect(mockedCreateBillingAccessRequest).not.toHaveBeenCalled()
  })

  it('does not show a complimentary trial warning when paid Pro is active', async () => {
    setCurrentPlan('PRO', {
      billing: {
        active: true,
        status: 'ACTIVE',
        source: 'MANUAL',
        paid_through: '2026-10-15T10:30:00Z',
        grace_ends_at: '2026-11-14T10:30:00Z',
      },
      complimentary_trial_warning: null,
    })
    renderView()

    await waitFor(() => {
      expect(screen.getByText('Ваш доступ зараз: Pro')).toBeInTheDocument()
    })

    expect(screen.queryByText('Тестовий доступ до Pro завершується')).not.toBeInTheDocument()
    expect(screen.queryByText('Тестовий доступ до Pro завершився')).not.toBeInTheDocument()
  })

  it('explains START base with active Leader override', async () => {
    setCurrentPlan('START', {
      plan: 'LEADER',
      base_plan: 'START',
      effective_plan: 'LEADER',
      access_source: 'override',
      access_label: 'Ручне перевизначення доступу',
      override: {
        active: true,
        plan: 'LEADER',
        expires_at: '2026-05-24T10:00:00Z',
      },
    })
    renderView()

    await waitFor(() => {
      expect(screen.getByText('Ваш доступ зараз: Leader')).toBeInTheDocument()
    })
    expect(screen.getByText('Адміністратор тимчасово надав доступ до можливостей тарифу Leader.')).toBeInTheDocument()
    expect(screen.getByText(/Ручне налаштування діє до:/)).toBeInTheDocument()
  })

  it('disables duplicate tariff actions when current request is pending', async () => {
    setCurrentPlan('START', {
      current_request: {
        id: 7,
        requested_plan: 'PRO',
        status: 'PENDING',
        created_at: '2026-04-24T10:00:00Z',
        reviewed_at: null,
        public_note: '',
      },
    })
    renderView()

    await waitFor(() => {
      expect(screen.getAllByText('Заявка очікує розгляду').length).toBeGreaterThan(0)
    })
    expect(screen.getAllByRole('button', { name: 'Заявка очікує розгляду' })[0]).toBeDisabled()
    expect(screen.getAllByRole('button', { name: 'Подати заявку на Pro' })[0]).toBeDisabled()
  })

  it('does not treat resolved current_request as active pending state', async () => {
    setCurrentPlan('START', {
      current_request: {
        id: 18,
        requested_plan: 'PRO',
        status: 'REJECTED',
        created_at: '2026-04-20T10:00:00Z',
        reviewed_at: '2026-04-21T10:00:00Z',
        public_note: 'Safe public note from invalid current request.',
      },
    })
    renderView()

    await waitFor(() => {
      expect(screen.getByText('Ваш доступ зараз: Start')).toBeInTheDocument()
    })
    expect(screen.queryByText('Safe public note from invalid current request.')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Подати заявку на Pro' })[0]).not.toBeDisabled()
  })

  it('shows rejected latest request and keeps new request available', async () => {
    setCurrentPlan('START', {
      latest_request: {
        id: 8,
        requested_plan: 'PRO',
        status: 'REJECTED',
        created_at: '2026-04-20T10:00:00Z',
        reviewed_at: '2026-04-21T10:00:00Z',
        public_note: 'Спробуйте пізніше.',
      },
    })
    renderView()

    await waitFor(() => {
      expect(screen.getByText(/Остання заявка: Pro, відхилено/)).toBeInTheDocument()
    })
    expect(screen.getAllByRole('button', { name: 'Подати заявку на Pro' })[0]).not.toBeDisabled()
  })

  it('does not present approved but unapplied Leader request as active access', async () => {
    setCurrentPlan('PRO', {
      latest_request: {
        id: 9,
        requested_plan: 'LEADER',
        status: 'APPROVED',
        created_at: '2026-04-20T10:00:00Z',
        reviewed_at: '2026-04-21T10:00:00Z',
        public_note: '',
        applied: false,
        applied_plan: null,
      },
    })
    renderView()

    await waitFor(() => {
      expect(screen.getByText(/Остання заявка: Leader, схвалено/)).toBeInTheDocument()
    })
    expect(screen.getByText('Ваш доступ зараз: Pro')).toBeInTheDocument()
    expect(screen.getAllByText('Поточний доступ').length).toBe(1)
    expect(screen.queryByRole('button', { name: 'Очікує активації' })).not.toBeInTheDocument()
    expect(screen.getAllByText('Тариф готується').length).toBeGreaterThan(0)
  })

  it('marks Leader as current when approved request is already applied', async () => {
    setCurrentPlan('LEADER', {
      latest_request: {
        id: 10,
        requested_plan: 'LEADER',
        status: 'APPROVED',
        created_at: '2026-04-20T10:00:00Z',
        reviewed_at: '2026-04-21T10:00:00Z',
        public_note: '',
        applied: true,
        applied_plan: 'LEADER',
      },
    })
    renderView()

    await waitFor(() => {
      expect(screen.getByText('Ваш доступ зараз: Leader')).toBeInTheDocument()
    })
    expect(screen.getAllByText('Поточний доступ').length).toBe(1)
    expect(screen.queryByRole('button', { name: 'Перейти на Leader' })).not.toBeInTheDocument()
  })

  it('does not render raw technical billing copy in key state', async () => {
    setCurrentPlan('START', {
      plan: 'PRO',
      base_plan: 'START',
      effective_plan: 'PRO',
      access_source: 'trial',
      access_label: 'Тестовий доступ',
      trial: { active: true, plan: 'PRO', starts_at: null, ends_at: null },
    })
    const view = renderView()

    await waitFor(() => {
      expect(screen.getAllByText('Тестовий доступ').length).toBeGreaterThan(0)
    })
    expect(view.container).not.toHaveTextContent('checkout')
    expect(view.container).not.toHaveTextContent('онлайн-оплата')
    expect(view.container).not.toHaveTextContent('сторінка оплати')
    expect(view.container).not.toHaveTextContent('webhook')
    expect(view.container).not.toHaveTextContent('entitlements')
    expect(view.container).not.toHaveTextContent('effective plan')
    expect(view.container).not.toHaveTextContent('base plan')
  })

  it('explains grace and offers a Pro renewal without implying data loss', async () => {
    setCurrentPlan('PRO', {
      plan: 'PRO',
      effective_plan: 'PRO',
      access_source: 'billing',
      access_label: 'Платний доступ',
      billing: {
        active: true,
        status: 'ACTIVE',
        source: 'MANUAL',
        paid_through: '2026-09-01T00:00:00Z',
        grace_ends_at: '2026-10-01T00:00:00Z',
      },
    })
    mockMe.value.access_state = 'GRACE'
    renderView()

    await waitFor(() => {
      expect(screen.getByText(/Практика та можливості Pro тимчасово збережені/)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Продовжити Pro' })).toBeInTheDocument()
  })
})
