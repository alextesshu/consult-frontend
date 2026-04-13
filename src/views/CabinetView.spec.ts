import { fireEvent, render, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { apiGet, fetchSpecialistOnboardingState } from '../lib/api'
import CabinetView from './CabinetView.vue'

function createMePayload() {
  return {
    access_state: 'OK',
    effective_entitlements: {
      plan: 'START',
      active_client_limit: 5,
      pair_enabled: true,
      group_room_enabled: false,
      group_room_meeting_limit: null,
      group_room_broadcast_enabled: false,
      default_technical_cap: 5,
    },
    counts: {
      active_clients: 1,
      prospect_clients: 0,
      upcoming_sessions_count: 1,
    },
    server_time: '2026-03-18T12:00:00Z',
  }
}

const mockMe = ref(createMePayload())
const mockLoadMe = vi.fn()

vi.mock('pinia', () => ({
  storeToRefs: (store: any) => store,
}))

vi.mock('../stores/auth', () => ({
  useAuthStore: () => ({
    me: mockMe,
    loadMe: mockLoadMe,
    accessToken: 'mock-access-token',
  }),
}))

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
  fetchSpecialistOnboardingState: vi.fn(),
}))

const mockedApiGet = vi.mocked(apiGet)
const mockedFetchSpecialistOnboardingState = vi.mocked(fetchSpecialistOnboardingState)

function renderView() {
  return render(CabinetView, {
    global: {
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a :href="typeof to === \'string\' ? to : \'\'"><slot /></a>',
        },
      },
    },
  })
}

describe('CabinetView', () => {
  beforeEach(() => {
    mockedApiGet.mockReset()
    mockedFetchSpecialistOnboardingState.mockReset()
    mockLoadMe.mockReset()
    mockLoadMe.mockResolvedValue(undefined)
    mockMe.value = createMePayload()
    mockedFetchSpecialistOnboardingState.mockResolvedValue({
      readiness: true,
      missing_items: [],
      warnings: [],
      next_actions: [],
      primary_cta_code: null,
      cta_target: null,
    } as any)
  })

  it('renders guest quota row in plan metrics when guest entitlement fields are available', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/cabinet/entitlements/') {
        return {
          guest_sessions_enabled: true,
          guest_sessions_used_in_period: 2,
          guest_sessions_limit_per_period: 5,
        } as any
      }
      if (config?.params?.upcoming === true) return []
      if (config?.params?.upcoming === false) return []
      return []
    })

    const view = renderView()

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenCalledWith('/cabinet/entitlements/')
      expect(view.container).toHaveTextContent('Гостьові сесії:')
      expect(view.container).toHaveTextContent('2 / 5')
    })
  })

  it('renders guest quota zero state without breaking plan metrics', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/cabinet/entitlements/') {
        return {
          guest_sessions_enabled: true,
          guest_sessions_used_in_period: 0,
          guest_sessions_limit_per_period: 5,
        } as any
      }
      if (config?.params?.upcoming === true) return []
      if (config?.params?.upcoming === false) return []
      return []
    })

    const view = renderView()

    await waitFor(() => {
      expect(view.container).toHaveTextContent('Гостьові сесії:')
      expect(view.container).toHaveTextContent('0 / 5')
    })
  })

  it('hides guest quota row when guest entitlement fields are missing', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/cabinet/entitlements/') {
        return {
          guest_sessions_enabled: true,
          guest_sessions_limit_per_period: 5,
        } as any
      }
      if (config?.params?.upcoming === true) return []
      if (config?.params?.upcoming === false) return []
      return []
    })

    const view = renderView()

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenCalledWith('/cabinet/entitlements/')
    })
    expect(view.container).not.toHaveTextContent('Гостьові сесії:')
  })

  it('hides guest quota row when guest sessions are not enabled for the plan', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/cabinet/entitlements/') {
        return {
          guest_sessions_enabled: false,
          guest_sessions_used_in_period: 2,
          guest_sessions_limit_per_period: 5,
        } as any
      }
      if (config?.params?.upcoming === true) return []
      if (config?.params?.upcoming === false) return []
      return []
    })

    const view = renderView()

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenCalledWith('/cabinet/entitlements/')
    })
    expect(view.container).not.toHaveTextContent('Гостьові сесії:')
  })

  it('shows explicit profile error state with retry when cabinet profile bootstrap fails', async () => {
    mockMe.value = null as any
    mockLoadMe.mockRejectedValue(new Error('profile bootstrap failed'))
    mockedApiGet.mockResolvedValue([])

    const view = renderView()

    await waitFor(() => {
      expect(view.container.querySelector('.cabinet__loading--error')).toBeInTheDocument()
    })
    expect(view.container.querySelector('button.cabinet__loading-action')).toBeInTheDocument()
  })

  it('retries cabinet profile bootstrap and renders grid after success', async () => {
    mockMe.value = null as any
    let shouldFail = true
    mockLoadMe.mockImplementation(async () => {
      if (shouldFail) {
        throw new Error('profile bootstrap failed')
      }
      mockMe.value = createMePayload()
    })
    mockedApiGet.mockResolvedValue([])

    const view = renderView()
    await waitFor(() => {
      expect(view.container.querySelector('.cabinet__loading--error')).toBeInTheDocument()
    })

    shouldFail = false
    const retryButton = view.container.querySelector('button.cabinet__loading-action')
    expect(retryButton).toBeInTheDocument()
    await fireEvent.click(retryButton as HTMLButtonElement)

    await waitFor(() => {
      expect(view.container.querySelector('.cabinet__grid')).toBeInTheDocument()
    })
    expect(mockLoadMe).toHaveBeenCalledTimes(2)
    expect(view.container.querySelector('.cabinet__loading--error')).not.toBeInTheDocument()
  })

  it('shows explicit cabinet access snapshot error state with retry when secondary me fields stay missing', async () => {
    mockMe.value = {
      ...createMePayload(),
      counts: null,
      effective_entitlements: null,
    } as any
    mockLoadMe.mockResolvedValue(undefined)
    mockedApiGet.mockResolvedValue([])

    const view = renderView()

    await waitFor(() => {
      expect(view.container.querySelector('.cabinet__details-state--error')).toBeInTheDocument()
    })
    expect(view.container.querySelector('button.cabinet__details-action')).toBeInTheDocument()
  })

  it('retries cabinet access snapshot bootstrap and renders grid after success', async () => {
    mockMe.value = {
      ...createMePayload(),
      counts: null,
      effective_entitlements: null,
    } as any
    let shouldStayIncomplete = true
    mockLoadMe.mockImplementation(async () => {
      if (shouldStayIncomplete) return
      mockMe.value = createMePayload()
    })
    mockedApiGet.mockResolvedValue([])

    const view = renderView()
    await waitFor(() => {
      expect(view.container.querySelector('.cabinet__details-state--error')).toBeInTheDocument()
    })

    shouldStayIncomplete = false
    const retryButton = view.container.querySelector('button.cabinet__details-action')
    expect(retryButton).toBeInTheDocument()
    await fireEvent.click(retryButton as HTMLButtonElement)

    await waitFor(() => {
      expect(view.container.querySelector('.cabinet__grid')).toBeInTheDocument()
    })
    expect(mockLoadMe).toHaveBeenCalledTimes(2)
    expect(view.container.querySelector('.cabinet__details-state--error')).not.toBeInTheDocument()
  })

  it('shows explicit hero error state with retry when sessions fetch fails', async () => {
    mockedApiGet.mockRejectedValue(new Error('hero sessions failed'))

    const view = renderView()

    await waitFor(() => {
      expect(view.container.querySelector('.hero-status--error')).toBeInTheDocument()
    })
    expect(view.container.querySelector('.hero-status--error button')).toBeInTheDocument()
    expect(view.container.querySelector('a.hero-live')).not.toBeInTheDocument()
  })

  it('retries hero sessions fetch and clears the error state', async () => {
    let shouldFail = true
    mockedApiGet.mockImplementation(async (_url, config) => {
      if (shouldFail) {
        throw new Error('hero sessions failed')
      }
      if (config?.params?.upcoming === true) {
        return [
          {
            id: 88,
            status: 'CONFIRMED',
            client: 52,
            client_name: 'Retry Client',
            meeting_url: 'https://meet.google.com/retry-room',
            join_available: true,
            slot_start_at: '2000-01-01T00:00:00Z',
            slot_end_at: '2100-01-01T00:00:00Z',
          },
        ] as any
      }
      if (config?.params?.upcoming === false) return []
      return []
    })

    const view = renderView()
    await waitFor(() => {
      expect(view.container.querySelector('.hero-status--error')).toBeInTheDocument()
    })

    shouldFail = false
    const retryButton = view.container.querySelector('.hero-status--error button')
    expect(retryButton).toBeInTheDocument()
    await fireEvent.click(retryButton as HTMLButtonElement)

    await waitFor(() => {
      expect(view.container.querySelector('a.hero-live[href="/cabinet/sessions/88"]')).toBeInTheDocument()
    })
    expect(view.container.querySelector('.hero-status--error')).not.toBeInTheDocument()
  })

  it('shows live session marker and direct join in hero', async () => {
    mockedApiGet.mockImplementation(async (_url, config) => {
      if (config?.params?.upcoming === true) return []
      if (config?.params?.upcoming === false) {
        return [
          {
            id: 77,
            status: 'CONFIRMED',
            client: 42,
            client_name: 'Test Client',
            meeting_url: 'https://meet.google.com/live-hero-room',
            join_available: true,
            join_starts_at: '2000-01-01T00:00:00Z',
            join_ends_at: '2100-01-01T00:00:00Z',
          },
        ] as any
      }
      return []
    })

    const view = renderView()

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenCalledWith('/booking/sessions/', { params: { upcoming: true } })
      expect(mockedApiGet).toHaveBeenCalledWith('/booking/sessions/', { params: { upcoming: false } })
    })

    await waitFor(() => {
      expect(view.container.querySelector('a.hero-live[href="/cabinet/sessions/77"]')).toBeInTheDocument()
    })
    expect(view.container.querySelector('a.hero-live__join[href="https://meet.google.com/live-hero-room"]')).toBeInTheDocument()
  })

  it('shows live session marker for scheduled in-progress session', async () => {
    mockedApiGet.mockImplementation(async (_url, config) => {
      if (config?.params?.upcoming === true) return []
      if (config?.params?.upcoming === false) {
        return [
          {
            id: 78,
            status: 'SCHEDULED',
            client: 43,
            client_name: 'Scheduled Client',
            meeting_url: null,
            join_available: false,
            slot_start_at: '2000-01-01T00:00:00Z',
            slot_end_at: '2100-01-01T00:00:00Z',
          },
        ] as any
      }
      return []
    })

    const view = renderView()

    await waitFor(() => {
      expect(view.container.querySelector('a.hero-live[href="/cabinet/sessions/78"]')).toBeInTheDocument()
    })
  })

  it('does not show live marker before actual slot start even if join window already opened', async () => {
    mockedApiGet.mockImplementation(async (_url, config) => {
      if (config?.params?.upcoming === true) {
        return [
          {
            id: 79,
            status: 'CONFIRMED',
            client: 44,
            client_name: 'Future Client',
            meeting_url: 'https://meet.google.com/wait-room',
            join_available: true,
            join_starts_at: '2000-01-01T00:00:00Z',
            join_ends_at: '2100-01-01T00:00:00Z',
            slot_start_at: '2099-01-01T10:00:00Z',
            slot_end_at: '2099-01-01T11:00:00Z',
          },
        ] as any
      }
      if (config?.params?.upcoming === false) return []
      return []
    })

    const view = renderView()

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenCalledWith('/booking/sessions/', { params: { upcoming: true } })
      expect(mockedApiGet).toHaveBeenCalledWith('/booking/sessions/', { params: { upcoming: false } })
    })

    expect(view.container.querySelector('a.hero-live')).not.toBeInTheDocument()
    expect(view.container.querySelector('a.hero-live__join')).not.toBeInTheDocument()
  })

  it('renders nearest upcoming session block with join readiness and direct actions', async () => {
    mockedApiGet.mockImplementation(async (_url, config) => {
      if (config?.params?.upcoming === true) {
        return [
          {
            id: 91,
            status: 'CONFIRMED',
            client: 45,
            client_name: 'Nearest Client',
            session_format: 'online',
            meeting_url: 'https://meet.google.com/nearest-room',
            join_available: true,
            slot_start_at: '2099-06-01T10:00:00Z',
            slot_end_at: '2099-06-01T10:50:00Z',
          },
        ] as any
      }
      if (config?.params?.upcoming === false) return []
      if (_url === '/cabinet/entitlements/') return {}
      return []
    })

    const view = renderView()

    await waitFor(() => {
      expect(view.container).toHaveTextContent('Найближча сесія')
      expect(view.container).toHaveTextContent('Nearest Client')
      expect(view.container).toHaveTextContent('Формат')
      expect(view.container).toHaveTextContent('Онлайн')
    })
    expect(view.container.querySelector('a[href="/cabinet/sessions/91"]')).toBeInTheDocument()
    expect(view.container.querySelector('a[href="https://meet.google.com/nearest-room"]')).toBeInTheDocument()
  })

  it('renders offline nearest session context with location and without join action', async () => {
    mockedApiGet.mockImplementation(async (_url, config) => {
      if (config?.params?.upcoming === true) {
        return [
          {
            id: 92,
            status: 'SCHEDULED',
            client: 46,
            client_name: 'Offline Client',
            session_format: 'offline',
            offline_location: 'Київ, офіс 4',
            meeting_url: 'https://meet.google.com/ignore-offline',
            join_available: true,
            slot_start_at: '2099-06-02T11:00:00Z',
            slot_end_at: '2099-06-02T11:50:00Z',
          },
        ] as any
      }
      if (config?.params?.upcoming === false) return []
      if (_url === '/cabinet/entitlements/') return {}
      return []
    })

    const view = renderView()

    await waitFor(() => {
      expect(view.container).toHaveTextContent('Найближча сесія')
      expect(view.container).toHaveTextContent('Offline Client')
      expect(view.container).toHaveTextContent('Локація: Київ, офіс 4')
      expect(view.container).toHaveTextContent('Офлайн-сесія без посилання для входу.')
    })
    expect(view.container.querySelector('a[href="https://meet.google.com/ignore-offline"]')).not.toBeInTheDocument()
    expect(view.container.querySelector('a[href="/cabinet/sessions"]')).toBeInTheDocument()
  })

  it('keeps nearest-session and workflow links inside one action hub with full-tile links', async () => {
    mockedApiGet.mockImplementation(async (_url, config) => {
      if (config?.params?.upcoming === true) {
        return [
          {
            id: 94,
            status: 'CONFIRMED',
            client: 49,
            client_name: 'Hub Client',
            session_format: 'online',
            meeting_url: 'https://meet.google.com/hub-room',
            join_available: true,
            slot_start_at: '2099-06-04T08:00:00Z',
            slot_end_at: '2099-06-04T08:50:00Z',
          },
        ] as any
      }
      if (config?.params?.upcoming === false) return []
      if (_url === '/cabinet/entitlements/') return {}
      return []
    })

    const view = renderView()

    await waitFor(() => {
      expect(view.container.querySelector('.panel--action-hub')).toBeInTheDocument()
      expect(view.container.querySelector('.panel--action-hub .panel--nearest-session')).toBeInTheDocument()
    })

    const sessionsTile = view.container.querySelector('a.action-tile[href="/cabinet/sessions"]')
    const clientsTile = view.container.querySelector('a.action-tile[href="/cabinet/clients"]')

    expect(sessionsTile).toBeInTheDocument()
    expect(clientsTile).toBeInTheDocument()
  })

  it('renders compact nearest-session fallback when there are no upcoming sessions', async () => {
    mockedApiGet.mockImplementation(async (_url, config) => {
      if (config?.params?.upcoming === true) return []
      if (config?.params?.upcoming === false) return []
      if (_url === '/cabinet/entitlements/') return {}
      return []
    })

    const view = renderView()

    await waitFor(() => {
      expect(view.container.querySelector('.action-hub.action-hub--fallback')).toBeInTheDocument()
      expect(view.container.querySelector('.action-hub__nearest--compact')).toBeInTheDocument()
      expect(view.container).toHaveTextContent('Немає майбутніх сесій.')
    })

    expect(view.container.querySelector('.action-hub__nearest--compact a[href="/cabinet/sessions"]')).toBeInTheDocument()
  })

  it('renders onboarding readiness with pending steps and primary cta from backend enums', async () => {
    mockedApiGet.mockResolvedValue([])
    mockedFetchSpecialistOnboardingState.mockResolvedValue({
      readiness: {
        profile_core_ready: false,
        has_future_slots: false,
        public_profile_enabled: false,
        ready_for_inbound_intent: false,
      },
      missing_items: ['MISSING_DISPLAY_NAME', 'MISSING_FUTURE_SLOTS', 'PUBLIC_PROFILE_DISABLED'],
      warnings: [{ code: 'PROFILE_CORE_INCOMPLETE' }],
      next_actions: [{ code: 'COMPLETE_PROFILE', target: 'CABINET_PROFILE', priority: 1 }],
      primary_cta_code: 'COMPLETE_PROFILE',
    } as any)

    const view = renderView()

    await waitFor(() => {
      expect(view.container.querySelector('.panel--onboarding')).toBeInTheDocument()
      expect(view.container.querySelector('a[href="/cabinet/profile"]')).toBeInTheDocument()
    })
    expect(view.container.querySelector('.onboarding-step--pending')).toBeInTheDocument()
    expect((view.container.querySelector('a[href="/cabinet/profile"]')?.textContent || '').trim().length).toBeGreaterThan(0)
  })

  it('renders onboarding steps as full clickable links to operational destinations', async () => {
    mockedApiGet.mockResolvedValue([])
    mockedFetchSpecialistOnboardingState.mockResolvedValue({
      readiness: {
        profile_core_ready: false,
        has_future_slots: false,
        public_profile_enabled: false,
        ready_for_inbound_intent: false,
      },
      missing_items: ['MISSING_DISPLAY_NAME', 'MISSING_FUTURE_SLOTS', 'PUBLIC_PROFILE_DISABLED'],
      warnings: [],
      next_actions: [],
      primary_cta_code: null,
      cta_target: null,
    } as any)

    const view = renderView()

    await waitFor(() => {
      expect(view.container.querySelectorAll('a.onboarding-step--link').length).toBeGreaterThanOrEqual(4)
    })

    const stepLinks = Array.from(view.container.querySelectorAll('a.onboarding-step--link'))
    const profileCoreLink = stepLinks.find((el) => (el.textContent || '').includes('Базовий профіль'))
    const availabilityLink = stepLinks.find((el) => (el.textContent || '').includes('Доступність'))
    const publicProfileLink = stepLinks.find((el) => (el.textContent || '').includes('Публічний профіль'))
    const inboundReadinessLink = stepLinks.find((el) => (el.textContent || '').includes('Готовність до звернень'))

    expect(profileCoreLink?.getAttribute('href')).toBe('/cabinet/profile')
    expect(availabilityLink?.getAttribute('href')).toBe('/cabinet/availability-rules')
    expect(publicProfileLink?.getAttribute('href')).toBe('/public')
    expect(inboundReadinessLink?.getAttribute('href')).toBe('/cabinet/inquiries')
    expect(profileCoreLink?.textContent).toContain('Керувати профілем')
    expect(availabilityLink?.textContent).toContain('Налаштувати доступність')
    expect(publicProfileLink?.textContent).toContain('Відкрити публічний профіль')
    expect(inboundReadinessLink?.textContent).toContain('Перейти до звернень')
  })

  it('uses canonical public profile path from me payload for public-profile onboarding step', async () => {
    mockMe.value = {
      ...createMePayload(),
      public_profile_path: '/s/olena-koval',
    } as any
    mockedApiGet.mockResolvedValue([])
    mockedFetchSpecialistOnboardingState.mockResolvedValue({
      readiness: {
        profile_core_ready: true,
        has_future_slots: true,
        public_profile_enabled: true,
        ready_for_inbound_intent: true,
      },
      missing_items: [],
      warnings: [],
      next_actions: [],
      primary_cta_code: null,
      cta_target: null,
    } as any)

    const view = renderView()

    await waitFor(() => {
      expect(view.container.querySelectorAll('a.onboarding-step--link').length).toBeGreaterThanOrEqual(4)
    })

    const stepLinks = Array.from(view.container.querySelectorAll('a.onboarding-step--link'))
    const publicProfileLink = stepLinks[2]

    expect(publicProfileLink?.getAttribute('href')).toBe('/s/olena-koval')
  })

  it('uses onboarding_summary only as initial shell before canonical onboarding-state arrives', async () => {
    mockedApiGet.mockResolvedValue([])
    let resolveCanonical: (value: unknown) => void = () => {}
    mockedFetchSpecialistOnboardingState.mockReturnValue(
      new Promise((resolve) => {
        resolveCanonical = resolve
      }) as any
    )
    mockMe.value = {
      ...createMePayload(),
      onboarding_summary: {
        ready_for_inbound_intent: false,
        missing_items_count: 3,
        primary_cta_code: 'ADD_AVAILABILITY',
      },
    } as any

    const view = renderView()
    let shellStatus = ''

    await waitFor(() => {
      const status = view.container.querySelector('.onboarding-status')
      expect(status).toBeInTheDocument()
      shellStatus = (status?.textContent || '').trim()
      expect(shellStatus).toBe('Потрібні дії')
    })

    resolveCanonical({
      readiness: {
        profile_core_ready: true,
        has_future_slots: true,
        public_profile_enabled: false,
        ready_for_inbound_intent: false,
      },
      missing_items: ['PUBLIC_PROFILE_DISABLED'],
      warnings: [{ code: 'PUBLIC_PROFILE_OFF' }],
      next_actions: [{ code: 'OPEN_PUBLIC_PROFILE', target: 'CABINET_PUBLIC_PROFILE', priority: 3 }],
      primary_cta_code: 'OPEN_PUBLIC_PROFILE',
    })

    await waitFor(() => {
      const list = view.container.querySelector('.onboarding-list')
      expect(list).toBeInTheDocument()
      expect((list?.textContent || '').length).toBeGreaterThan(0)
      expect(view.container.querySelector('a[href="/public"]')).toBeInTheDocument()
      expect((view.container.querySelector('.onboarding-status')?.textContent || '').trim()).toBe(shellStatus)
    })
  })

  it('renders CTA for add availability via route-key mapping', async () => {
    mockedApiGet.mockResolvedValue([])
    mockedFetchSpecialistOnboardingState.mockResolvedValue({
      readiness: {
        profile_core_ready: true,
        has_future_slots: false,
        public_profile_enabled: true,
        ready_for_inbound_intent: false,
      },
      missing_items: ['MISSING_FUTURE_SLOTS'],
      warnings: [{ code: 'PUBLISHED_WITHOUT_BOOKABLE_TIME' }],
      next_actions: [{ code: 'ADD_AVAILABILITY', target: 'CABINET_AVAILABILITY', priority: 2 }],
      primary_cta_code: 'ADD_AVAILABILITY',
    } as any)

    const view = renderView()
    await waitFor(() => {
      expect(view.container.querySelector('a[href="/cabinet/availability-rules"]')).toBeInTheDocument()
    })
  })

  it('renders CTA for view public profile via route-key mapping', async () => {
    mockedApiGet.mockResolvedValue([])
    mockedFetchSpecialistOnboardingState.mockResolvedValue({
      readiness: {
        profile_core_ready: true,
        has_future_slots: true,
        public_profile_enabled: true,
        ready_for_inbound_intent: true,
      },
      missing_items: [],
      warnings: [],
      next_actions: [{ code: 'VIEW_PUBLIC_PROFILE', target: 'PUBLIC_PROFILE_VIEW', priority: 1 }],
      primary_cta_code: 'VIEW_PUBLIC_PROFILE',
    } as any)

    const view = renderView()
    await waitFor(() => {
      expect(view.container.querySelector('a[href="/public"]')).toBeInTheDocument()
    })
  })
})
