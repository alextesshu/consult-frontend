import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import BillingView from './BillingView.vue'
import {
  apiGet,
  createBillingAccessRequest,
  createBillingCheckoutSession,
  fetchBillingAccessRequestState,
} from '../lib/api'

const mockMe = ref<any>(null)
const mockLoadMe = vi.fn()

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
  fetchBillingAccessRequestState: vi.fn(),
  createBillingAccessRequest: vi.fn(),
  createBillingCheckoutSession: vi.fn(),
  getApiErrorMessage: vi.fn(() => 'Request failed'),
}))

const mockedApiGet = vi.mocked(apiGet)
const mockedFetchBillingAccessRequestState = vi.mocked(fetchBillingAccessRequestState)
const mockedCreateBillingAccessRequest = vi.mocked(createBillingAccessRequest)
const mockedCreateBillingCheckoutSession = vi.mocked(createBillingCheckoutSession)

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
    limits: {
      active_clients: { used: 0, limit: 3 },
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
  mockMe.value = {
    access_state: 'OK',
    effective_entitlements: {
      plan,
      active_client_limit: plan === 'LEADER' ? 60 : plan === 'PRO' ? 20 : 3,
      group_room_enabled: false,
    },
  }
  mockedApiGet.mockResolvedValue(
    buildAccessSummary({
      plan,
      base_plan: plan,
      effective_plan: plan,
      limits: {
        active_clients: { used: 0, limit: plan === 'LEADER' ? 60 : plan === 'PRO' ? 20 : 3 },
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
    mockedCreateBillingCheckoutSession.mockReset()
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
    expect(screen.getAllByRole('button', { name: 'Перейти на Pro' }).length).toBeGreaterThan(0)
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

  it('shows calm fallback copy instead of raw checkout backend message', async () => {
    setCurrentPlan('START')
    mockedCreateBillingCheckoutSession.mockResolvedValue({
      plan: 'PRO',
      billing_cycle: 'monthly',
      checkout_url: null,
      activation_source: 'VERIFIED_BILLING_WEBHOOK',
      fallback_available: true,
      message: 'Checkout URL не налаштований. Використайте fallback запит.',
    })
    renderView()

    await waitFor(() => {
      expect(mockedFetchBillingAccessRequestState).toHaveBeenCalled()
    })

    const upgradeButton = screen.getAllByRole('button', { name: 'Перейти на Pro' })[0]!
    await fireEvent.click(upgradeButton)

    await waitFor(() => {
      expect(mockedCreateBillingCheckoutSession).toHaveBeenCalledWith({
        plan: 'PRO',
        billing_cycle: 'monthly',
      })
    })

    expect(
      screen.getAllByText(
        'Онлайн-оплата для цього плану зараз недоступна. Ви можете залишити запит на індивідуальні умови.'
      ).length
    ).toBeGreaterThan(0)
    expect(
      screen.queryByText('Checkout URL не налаштований. Використайте fallback запит.')
    ).not.toBeInTheDocument()
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

    const requestButtons = screen.getAllByRole('button', { name: 'Подати заявку на індивідуальні умови' })
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

    const requestButtons = screen.getAllByRole('button', { name: 'Подати заявку на індивідуальні умови' })
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
      expect(screen.getByText('Доступ відповідає тарифу Start.')).toBeInTheDocument()
    })

    expect(screen.getAllByText('Поточний тариф').length).toBeGreaterThan(0)
    expect(screen.getByText('Фактичний доступ')).toBeInTheDocument()
    expect(screen.getByText('Стан доступу')).toBeInTheDocument()
    expect(screen.getByText('Заявка на зміну тарифу')).toBeInTheDocument()
    expect(screen.getByText('Немає активної заявки')).toBeInTheDocument()
  })

  it('shows Start as free with 3 active clients and no outdated euro prices', async () => {
    setCurrentPlan('START')
    const view = renderView()

    await waitFor(() => {
      expect(screen.getAllByText('0 грн').length).toBeGreaterThan(0)
    })

    expect(screen.getAllByText('До 3 активних клієнтів').length).toBeGreaterThan(0)
    expect(screen.queryByText('До 5 активних клієнтів')).not.toBeInTheDocument()
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
      expect(screen.getByText('Ваш базовий тариф — Start. Зараз активний тестовий доступ Pro.')).toBeInTheDocument()
    })
    expect(screen.getAllByText('Тестовий доступ').length).toBeGreaterThan(0)
    expect(screen.getByText(/Початок тестового доступу:/)).toBeInTheDocument()
    expect(screen.getByText(/Завершення тестового доступу:/)).toBeInTheDocument()
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
      expect(screen.getByText('Ваш базовий тариф — Start. Адміністратор тимчасово надав доступ Leader.')).toBeInTheDocument()
    })
    expect(screen.getAllByText('Ручне перевизначення доступу').length).toBeGreaterThan(0)
    expect(screen.getByText(/Ручне налаштування діє до:/)).toBeInTheDocument()
    expect(screen.getByText('Базовий тариф')).toBeInTheDocument()
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
    expect(screen.getAllByRole('button', { name: 'Подати заявку на індивідуальні умови' })[0]).toBeDisabled()
  })

  it('shows rejected current request and keeps new request available', async () => {
    setCurrentPlan('START', {
      current_request: {
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
      expect(screen.getAllByText('Заявку відхилено').length).toBeGreaterThan(0)
    })
    expect(screen.getByText('Спробуйте пізніше.')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Подати заявку на індивідуальні умови' })[0]).not.toBeDisabled()
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
      expect(screen.getAllByText('Заявку схвалено, тариф ще не активовано').length).toBeGreaterThan(0)
    })
    expect(screen.getAllByText('Заявку на Leader схвалено, але тариф ще не активовано.').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Поточний план').length).toBe(1)
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
      expect(screen.getAllByText('Схвалено й активовано для тарифу Leader.').length).toBeGreaterThan(0)
    })
    expect(screen.getAllByText('Поточний план').length).toBe(1)
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
    expect(view.container).not.toHaveTextContent('webhook')
    expect(view.container).not.toHaveTextContent('entitlements')
    expect(view.container).not.toHaveTextContent('effective plan')
    expect(view.container).not.toHaveTextContent('base plan')
  })
})
