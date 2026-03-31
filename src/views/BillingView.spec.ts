import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import BillingView from './BillingView.vue'
import {
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
  fetchBillingAccessRequestState: vi.fn(),
  createBillingAccessRequest: vi.fn(),
  createBillingCheckoutSession: vi.fn(),
  getApiErrorMessage: vi.fn(() => 'Request failed'),
}))

const mockedFetchBillingAccessRequestState = vi.mocked(fetchBillingAccessRequestState)
const mockedCreateBillingAccessRequest = vi.mocked(createBillingAccessRequest)
const mockedCreateBillingCheckoutSession = vi.mocked(createBillingCheckoutSession)

function setCurrentPlan(plan: 'START' | 'PRO' | 'LEADER') {
  mockMe.value = {
    access_state: 'OK',
    effective_entitlements: {
      plan,
      active_client_limit: 5,
      group_room_enabled: false,
    },
  }
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

  it('shows downgrade note once for PRO and keeps upgrade path to LEADER', async () => {
    setCurrentPlan('PRO')
    renderView()

    await waitFor(() => {
      expect(mockedFetchBillingAccessRequestState).toHaveBeenCalled()
    })

    expect(screen.queryByText('Нижчий план')).not.toBeInTheDocument()
    expect(screen.getAllByText('Перехід на нижчий план зараз оформлюється через підтримку.')).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Перейти на Leader' }).length).toBeGreaterThan(0)
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

    const requestButtons = screen.getAllByRole('button', { name: 'Запросити індивідуальні умови' })
    await fireEvent.click(requestButtons[0]!)

    await waitFor(() => {
      expect(mockedCreateBillingAccessRequest).toHaveBeenCalledWith({
        requested_plan: 'PRO',
        note: 'upgrade_from:START',
      })
    })

    expect(screen.getAllByText('Запит зафіксовано. Команда обробить його вручну.').length).toBeGreaterThan(
      0
    )
  })
})
