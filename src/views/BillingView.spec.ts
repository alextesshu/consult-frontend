import { render, screen, waitFor } from '@testing-library/vue'
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
    expect(screen.getAllByText('Перехід на нижчий план зараз оформлюється через підтримку.')).toHaveLength(2)
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
})
