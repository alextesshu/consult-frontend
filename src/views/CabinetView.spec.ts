import { fireEvent, render, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { apiGet, fetchChatThreads, fetchSpecialistOnboardingState } from '../lib/api'
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

function createWorkQueuePayload(overrides?: Record<string, unknown>) {
  return {
    today_sessions_count: 2,
    notes_reminders_count: 1,
    pending_guest_requests_count: 1,
    today_sessions: [
      {
        id: 501,
        client: 91,
        client_display_name: 'Queue Session Client',
        status: 'CONFIRMED',
        has_note: false,
        session_format: 'online',
        starts_at: '2099-06-05T09:00:00Z',
      },
    ],
    notes_reminders_preview: [
      {
        id: 601,
        client_id: 91,
        client_display_name: 'Queue Notes Client',
        reminder_at: '2099-06-05T11:00:00Z',
      },
    ],
    guest_requests_preview: [
      {
        id: 701,
        client_display_name: 'Queue Guest Client',
        status: 'pending',
        session_format: 'online',
        created_at: '2099-06-05T12:00:00Z',
      },
    ],
    ...(overrides || {}),
  } as any
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
  fetchChatThreads: vi.fn(),
  fetchSpecialistOnboardingState: vi.fn(),
}))

const mockedApiGet = vi.mocked(apiGet)
const mockedFetchChatThreads = vi.mocked(fetchChatThreads)
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

function summaryValue(container: ParentNode, kind: 'sessions' | 'notes' | 'guest') {
  return (
    container.querySelector(`.work-queue-summary-card[data-kind="${kind}"] .work-queue-summary-card__value`)?.textContent || ''
  ).trim()
}

describe('CabinetView', () => {
  beforeEach(() => {
    mockedApiGet.mockReset()
    mockedFetchChatThreads.mockReset()
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
    mockedFetchChatThreads.mockResolvedValue([])
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

  it('routes plan upgrade CTA to cabinet billing page', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/cabinet/entitlements/') return {}
      if (config?.params?.upcoming === true) return []
      if (config?.params?.upcoming === false) return []
      return []
    })

    const view = renderView()

    await waitFor(() => {
      expect(view.container.querySelector('a[href="/cabinet/billing"]')).toBeInTheDocument()
    })
    expect(view.container.querySelector('a[href="/pricing"]')).not.toBeInTheDocument()
  })

  it('uses Start fallback limit 3 from billing access model instead of stale legacy limit 5', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/cabinet/entitlements/') return { effective_plan: 'START' }
      if (config?.params?.upcoming === true) return []
      if (config?.params?.upcoming === false) return []
      return []
    })

    const view = renderView()

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenCalledWith('/cabinet/entitlements/')
      expect(view.container).toHaveTextContent('Активні клієнти:')
      expect(view.container).toHaveTextContent('3')
    })
    expect(view.container).not.toHaveTextContent('Активні клієнти: 1 з 5')
  })

  it('does not render beta-hidden Leader/internal feature labels on cabinet dashboard', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/cabinet/entitlements/') return { effective_plan: 'START' }
      if (config?.params?.upcoming === true) return []
      if (config?.params?.upcoming === false) return []
      return []
    })

    const view = renderView()

    await waitFor(() => {
      expect(view.container.querySelector('.cabinet__grid')).toBeInTheDocument()
    })
    expect(view.container).not.toHaveTextContent('Broadcast')
    expect(view.container).not.toHaveTextContent('Групові онлайн-події')
    expect(view.container).not.toHaveTextContent('Технічна місткість')
    expect(view.container).not.toHaveTextContent('Ліміт подій')
    expect(view.container).toHaveTextContent('Доступ до практики без комісій за сесію')
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

  it('loads work-queue and renders counts, preview lists, and CTA links', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/cabinet/work-queue/') return createWorkQueuePayload()
      if (url === '/cabinet/entitlements/') return {}
      if (config?.params?.upcoming === true) return []
      if (config?.params?.upcoming === false) return []
      return []
    })

    const view = renderView()

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenCalledWith('/cabinet/work-queue/')
      expect(summaryValue(view.container, 'sessions')).toBe('2')
      expect(summaryValue(view.container, 'notes')).toBe('1')
      expect(summaryValue(view.container, 'guest')).toBe('1')
    })

    expect(view.container.querySelectorAll('.work-queue-list[data-kind="today-sessions"] .work-queue-list__item')).toHaveLength(1)
    expect(view.container.querySelectorAll('.work-queue-list[data-kind="notes-reminders"] .work-queue-list__item')).toHaveLength(1)
    expect(view.container.querySelectorAll('.work-queue-list[data-kind="guest-requests"] .work-queue-list__item')).toHaveLength(1)

    expect(view.container.querySelector('a.work-queue-summary-card[href="/cabinet/sessions"]')).toBeInTheDocument()
    expect(view.container.querySelector('a.work-queue-summary-card[href="/cabinet/clients"]')).toBeInTheDocument()
    expect(view.container.querySelector('a.work-queue-summary-card[href="/cabinet/external-sessions"]')).toBeInTheDocument()
    expect(view.container).toHaveTextContent('Робочий огляд')
    expect(view.container).toHaveTextContent('Сьогоднішні сесії')
    expect(view.container).toHaveTextContent('Нагадування по нотатках')
    expect(view.container).toHaveTextContent('Гостьові заявки')
  })

  it('routes notes reminder preview to session detail when session_id is available', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/cabinet/work-queue/') {
        return createWorkQueuePayload({
          notes_reminders_preview: [
            {
              id: 601,
              session_id: 901,
              client_id: 91,
              client_display_name: 'Queue Notes Client',
              reminder_at: '2099-06-05T11:00:00Z',
            },
          ],
        })
      }
      if (url === '/cabinet/entitlements/') return {}
      if (config?.params?.upcoming === true) return []
      if (config?.params?.upcoming === false) return []
      return []
    })

    const view = renderView()

    await waitFor(() => {
      expect(view.container.querySelector('.work-queue-list[data-kind="notes-reminders"] .work-queue-list__link')).toBeInTheDocument()
    })

    expect(
      view.container.querySelector('.work-queue-list[data-kind="notes-reminders"] .work-queue-list__link[href="/cabinet/sessions/901"]')
    ).toBeInTheDocument()
  })

  it('uses client_display_name in work-queue previews and keeps safe fallback when it is missing', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/cabinet/work-queue/') {
        return createWorkQueuePayload({
          today_sessions: [
            {
              id: 801,
              client: 211,
              client_display_name: 'Canonical Queue Name',
              status: 'SCHEDULED',
              has_note: false,
              starts_at: '2099-06-10T09:00:00Z',
            },
            {
              id: 802,
              client: 212,
              client_display_name: null,
              client_username: 'login.user',
              status: 'CONFIRMED',
              has_note: true,
              starts_at: '2099-06-10T10:00:00Z',
            },
          ],
        })
      }
      if (url === '/cabinet/entitlements/') return {}
      if (config?.params?.upcoming === true) return []
      if (config?.params?.upcoming === false) return []
      return []
    })

    const view = renderView()

    await waitFor(() => {
      expect(view.container).toHaveTextContent('Canonical Queue Name')
    })

    const clients = Array.from(
      view.container.querySelectorAll('.work-queue-list[data-kind="today-sessions"] .work-queue-list__client')
    )
    expect(clients.length).toBeGreaterThanOrEqual(2)
    expect((clients[1]?.textContent || '').trim().length).toBeGreaterThan(0)
    expect(view.container).not.toHaveTextContent('login.user')
  })

  it('renders explicit empty states for work-queue previews', async () => {
    mockMe.value = {
      ...createMePayload(),
      counts: {
        active_clients: 0,
        prospect_clients: 0,
        upcoming_sessions_count: 0,
      },
    }
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/cabinet/work-queue/') {
        return createWorkQueuePayload({
          today_sessions_count: 0,
          notes_reminders_count: 0,
          pending_guest_requests_count: 0,
          today_sessions: [],
          notes_reminders_preview: [],
          guest_requests_preview: [],
        })
      }
      if (url === '/cabinet/entitlements/') return {}
      if (config?.params?.upcoming === true) return []
      if (config?.params?.upcoming === false) return []
      return []
    })

    const view = renderView()

    await waitFor(() => {
      expect(summaryValue(view.container, 'sessions')).toBe('0')
      expect(summaryValue(view.container, 'notes')).toBe('0')
      expect(summaryValue(view.container, 'guest')).toBe('0')
    })

    expect(view.container.querySelectorAll('.work-queue-list__empty')).toHaveLength(4)
    expect(view.container).toHaveTextContent('На сьогодні сесій немає. Перевірте розклад')
    expect(view.container).toHaveTextContent('Нотатки не потребують уваги.')
    expect(view.container).toHaveTextContent('Додати клієнта')
    expect(view.container).toHaveTextContent('Немає гостьових заявок на розгляд.')
    expect(view.container).toHaveTextContent(
      'Клієнтів ще немає. Ви можете додати клієнта вручну без створення кабінету'
    )
    expect(view.container.querySelector('.work-queue-list[data-kind="clients-empty"] a[href="/cabinet/clients"]')).toBeInTheDocument()
  })

  it('shows local work-queue error state and retries successfully', async () => {
    let shouldFailWorkQueue = true
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/cabinet/work-queue/') {
        if (shouldFailWorkQueue) throw new Error('work queue failed')
        return createWorkQueuePayload({ today_sessions_count: 5 })
      }
      if (url === '/cabinet/entitlements/') return {}
      if (config?.params?.upcoming === true) return []
      if (config?.params?.upcoming === false) return []
      return []
    })

    const view = renderView()

    await waitFor(() => {
      expect(view.container.querySelector('.work-queue__state--error')).toBeInTheDocument()
    })

    shouldFailWorkQueue = false
    const retryButton = view.container.querySelector('.work-queue__retry')
    expect(retryButton).toBeInTheDocument()
    await fireEvent.click(retryButton as HTMLButtonElement)

    await waitFor(() => {
      expect(summaryValue(view.container, 'sessions')).toBe('5')
    })
    expect(view.container.querySelector('.work-queue__state--error')).not.toBeInTheDocument()
    expect(mockedApiGet.mock.calls.filter((args) => args[0] === '/cabinet/work-queue/').length).toBeGreaterThanOrEqual(2)
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
    expect(view.container.querySelector('a.hero-signal')).not.toBeInTheDocument()
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
      expect(view.container.querySelector('a.hero-signal--live[href="/cabinet/sessions/88"]')).toBeInTheDocument()
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
      expect(view.container.querySelector('a.hero-signal--live[href="/cabinet/sessions/77"]')).toBeInTheDocument()
    })
    expect(view.container.querySelector('a.hero-signal__join[href="https://meet.google.com/live-hero-room"]')).toBeInTheDocument()
  })

  it('shows pending confirmation hero signal for scheduled in-progress session', async () => {
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
      expect(mockedApiGet).toHaveBeenCalledWith('/booking/sessions/', { params: { upcoming: false } })
    })

    await waitFor(() => {
      expect(
        view.container.querySelector('a.hero-signal--needs_confirmation_now[href="/cabinet/sessions/78"]')
      ).toBeInTheDocument()
    })
    const heroSignal = view.container.querySelector('a.hero-signal--needs_confirmation_now')
    expect(view.container.querySelector('a.hero-signal--live')).not.toBeInTheDocument()
    expect(heroSignal).toHaveTextContent('Потрібне підтвердження')
    expect(heroSignal).toHaveTextContent('Час сесії настав, але її ще не підтверджено.')
  })

  it('shows pending confirmation hero signal for scheduled session starting soon', async () => {
    const start = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    const end = new Date(Date.now() + 90 * 60 * 1000).toISOString()

    mockedApiGet.mockImplementation(async (_url, config) => {
      if (config?.params?.upcoming === true) {
        return [
          {
            id: 80,
            status: 'SCHEDULED',
            client: 46,
            client_name: 'Soon Scheduled Client',
            meeting_url: null,
            join_available: false,
            slot_start_at: start,
            slot_end_at: end,
          },
        ] as any
      }
      if (config?.params?.upcoming === false) return []
      return []
    })

    const view = renderView()

    await waitFor(() => {
      expect(
        view.container.querySelector('a.hero-signal--needs_confirmation_soon[href="/cabinet/sessions/80"]')
      ).toBeInTheDocument()
    })
    const heroSignal = view.container.querySelector('a.hero-signal--needs_confirmation_soon')
    expect(heroSignal).toHaveTextContent('Потрібне підтвердження')
    expect(heroSignal).toHaveTextContent('Сесія починається скоро, але її ще не підтверджено.')
  })

  it('shows missing meeting link hero signal for confirmed online session starting soon', async () => {
    const start = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    const end = new Date(Date.now() + 90 * 60 * 1000).toISOString()

    mockedApiGet.mockImplementation(async (_url, config) => {
      if (config?.params?.upcoming === true) {
        return [
          {
            id: 81,
            status: 'CONFIRMED',
            client: 47,
            client_name: 'Missing Link Client',
            session_format: 'online',
            meeting_url: null,
            join_available: false,
            slot_start_at: start,
            slot_end_at: end,
          },
        ] as any
      }
      if (config?.params?.upcoming === false) return []
      return []
    })

    const view = renderView()

    await waitFor(() => {
      expect(
        view.container.querySelector('a.hero-signal--missing_meeting_link[href="/cabinet/sessions/81"]')
      ).toBeInTheDocument()
    })
    expect(view.getByText('Потрібно додати посилання')).toBeInTheDocument()
    expect(view.getByText('Онлайн-сесія скоро почнеться, але посилання ще не додано.')).toBeInTheDocument()
  })

  it('shows confirmed soon hero signal for confirmed session starting soon', async () => {
    const start = new Date(Date.now() + 20 * 60 * 1000).toISOString()
    const end = new Date(Date.now() + 80 * 60 * 1000).toISOString()

    mockedApiGet.mockImplementation(async (_url, config) => {
      if (config?.params?.upcoming === true) {
        return [
          {
            id: 84,
            status: 'CONFIRMED',
            client: 50,
            client_name: 'Confirmed Soon Client',
            session_format: 'online',
            meeting_url: 'https://meet.google.com/confirmed-soon-room',
            join_available: true,
            slot_start_at: start,
            slot_end_at: end,
          },
        ] as any
      }
      if (config?.params?.upcoming === false) return []
      return []
    })

    const view = renderView()

    await waitFor(() => {
      expect(view.container.querySelector('a.hero-signal--confirmed_soon[href="/cabinet/sessions/84"]')).toBeInTheDocument()
    })
    const heroSignal = view.container.querySelector('a.hero-signal--confirmed_soon')
    expect(heroSignal).toHaveTextContent('Сесія скоро почнеться')
    expect(heroSignal).toHaveTextContent('Confirmed Soon Client')
    expect(heroSignal).not.toHaveTextContent('Потрібне підтвердження')
    expect(view.container.querySelector('a.hero-signal__join[href="https://meet.google.com/confirmed-soon-room"]')).toBeInTheDocument()
  })

  it('prioritizes confirmed live session over scheduled session starting soon', async () => {
    const soonStart = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    const soonEnd = new Date(Date.now() + 90 * 60 * 1000).toISOString()

    mockedApiGet.mockImplementation(async (_url, config) => {
      if (config?.params?.upcoming === true) {
        return [
          {
            id: 82,
            status: 'SCHEDULED',
            client: 48,
            client_name: 'Soon Scheduled Client',
            slot_start_at: soonStart,
            slot_end_at: soonEnd,
          },
        ] as any
      }
      if (config?.params?.upcoming === false) {
        return [
          {
            id: 83,
            status: 'CONFIRMED',
            client: 49,
            client_name: 'Live Priority Client',
            meeting_url: 'https://meet.google.com/live-priority-room',
            join_available: true,
            slot_start_at: '2000-01-01T00:00:00Z',
            slot_end_at: '2100-01-01T00:00:00Z',
          },
        ] as any
      }
      return []
    })

    const view = renderView()

    await waitFor(() => {
      expect(view.container.querySelector('a.hero-signal--live[href="/cabinet/sessions/83"]')).toBeInTheDocument()
    })
    expect(view.container.querySelector('a.hero-signal--needs_confirmation_soon')).not.toBeInTheDocument()
  })

  it('prioritizes scheduled soon warning over confirmed soon signal', async () => {
    const start = new Date(Date.now() + 20 * 60 * 1000).toISOString()
    const end = new Date(Date.now() + 80 * 60 * 1000).toISOString()

    mockedApiGet.mockImplementation(async (_url, config) => {
      if (config?.params?.upcoming === true) {
        return [
          {
            id: 85,
            status: 'CONFIRMED',
            client: 51,
            client_name: 'Confirmed Soon Client',
            session_format: 'online',
            meeting_url: 'https://meet.google.com/confirmed-soon-room',
            slot_start_at: start,
            slot_end_at: end,
          },
          {
            id: 86,
            status: 'SCHEDULED',
            client: 52,
            client_name: 'Scheduled Soon Client',
            slot_start_at: start,
            slot_end_at: end,
          },
        ] as any
      }
      if (config?.params?.upcoming === false) return []
      return []
    })

    const view = renderView()

    await waitFor(() => {
      expect(
        view.container.querySelector('a.hero-signal--needs_confirmation_soon[href="/cabinet/sessions/86"]')
      ).toBeInTheDocument()
    })
    expect(view.container.querySelector('a.hero-signal--confirmed_soon')).not.toBeInTheDocument()
  })

  it('prioritizes missing meeting link warning over confirmed soon signal', async () => {
    const start = new Date(Date.now() + 20 * 60 * 1000).toISOString()
    const end = new Date(Date.now() + 80 * 60 * 1000).toISOString()

    mockedApiGet.mockImplementation(async (_url, config) => {
      if (config?.params?.upcoming === true) {
        return [
          {
            id: 87,
            status: 'CONFIRMED',
            client: 53,
            client_name: 'Confirmed Soon Client',
            session_format: 'online',
            meeting_url: 'https://meet.google.com/confirmed-soon-room',
            slot_start_at: start,
            slot_end_at: end,
          },
          {
            id: 89,
            status: 'CONFIRMED',
            client: 54,
            client_name: 'Missing Link Client',
            session_format: 'online',
            meeting_url: null,
            slot_start_at: start,
            slot_end_at: end,
          },
        ] as any
      }
      if (config?.params?.upcoming === false) return []
      return []
    })

    const view = renderView()

    await waitFor(() => {
      expect(
        view.container.querySelector('a.hero-signal--missing_meeting_link[href="/cabinet/sessions/89"]')
      ).toBeInTheDocument()
    })
    expect(view.container.querySelector('a.hero-signal--confirmed_soon')).not.toBeInTheDocument()
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

    expect(view.container.querySelector('a.hero-signal--live')).not.toBeInTheDocument()
    expect(view.container.querySelector('a.hero-signal__join')).not.toBeInTheDocument()
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
      expect(view.container).toHaveTextContent('Що у вас далі')
      expect(view.container).toHaveTextContent('Nearest Client')
      expect(view.container).toHaveTextContent('Формат')
      expect(view.container).toHaveTextContent('Онлайн')
    })
    expect(view.container.querySelector('a[href="/cabinet/sessions/91"]')).toBeInTheDocument()
    expect(view.container.querySelector('a[href="https://meet.google.com/nearest-room"]')).toBeInTheDocument()
  })

  it('prefers chat display name over login-like session name in nearest session block', async () => {
    mockedApiGet.mockImplementation(async (_url, config) => {
      if (config?.params?.upcoming === true) {
        return [
          {
            id: 91,
            status: 'CONFIRMED',
            client: 45,
            client_name: 'client.prcnslt',
            client_username: 'client.prcnslt',
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
    mockedFetchChatThreads.mockResolvedValue([
      {
        id: 7,
        therapist_id: 10,
        client_id: 45,
        last_message_at: null,
        last_message_preview: '',
        unread_count: 0,
        other_user: {
          id: 45,
          role: 'CLIENT',
          display_name: 'Клієнт Проконсалт тест',
        },
      },
    ] as any)

    const view = renderView()

    await waitFor(() => {
      expect(view.container).toHaveTextContent('Клієнт Проконсалт тест')
    })
    expect(view.container).not.toHaveTextContent('client.prcnslt')
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
      expect(view.container).toHaveTextContent('Що у вас далі')
      expect(view.container).toHaveTextContent('Offline Client')
      expect(view.container).toHaveTextContent('Локація: Київ, офіс 4')
      expect(view.container).toHaveTextContent('Офлайн-сесія без посилання для входу.')
    })
    expect(view.container.querySelector('a[href="https://meet.google.com/ignore-offline"]')).not.toBeInTheDocument()
    expect(view.container.querySelector('a[href="/cabinet/sessions"]')).toBeInTheDocument()
  })

  it('keeps nearest-session and daily quick links inside one action hub', async () => {
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

    expect(view.container.querySelector('a.action-tile[href="/cabinet/slots"]')).toHaveTextContent('Створити слоти / Розклад')
    expect(view.container.querySelector('a.action-tile[href="/cabinet/sessions"]')).toHaveTextContent('Перейти до сесій')
    expect(view.container.querySelector('a.action-tile[href="/cabinet/clients"]')).toHaveTextContent('Перейти до клієнтів')
    expect(view.container.querySelector('a.action-tile[href="/cabinet/external-sessions"]')).toHaveTextContent('Гостьові сесії')
    expect(view.container.querySelector('a.action-tile[href="/cabinet/journal"]')).toHaveTextContent('Авторський журнал')
    expect(view.container.querySelector('a.action-tile[href="/cabinet/billing"]')).toHaveTextContent('Тарифи і доступ')
    expect(view.container.querySelector('a.action-tile[href="/cabinet/group-events"]')).not.toBeInTheDocument()
  })

  it('renders compact billing summary without duplicating detailed tariff logic', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/cabinet/entitlements/') {
        return {
          effective_plan: 'START',
          limits: {
            active_clients: { used: 1, limit: 3 },
          },
        } as any
      }
      if (config?.params?.upcoming === true) return []
      if (config?.params?.upcoming === false) return []
      return []
    })

    const view = renderView()

    await waitFor(() => {
      expect(view.container).toHaveTextContent('Короткий стан доступу')
    })
    expect(view.container.querySelector('.panel--plan a[href="/cabinet/billing"]')).toHaveTextContent(
      'Відкрити тарифи і доступ'
    )
    expect(view.container).toHaveTextContent('Активні клієнти:')
    expect(view.container).not.toHaveTextContent('Тестовий доступ')
    expect(view.container).not.toHaveTextContent('Ручне перевизначення доступу')
  })

  it('does not render obsolete technical labels on cabinet dashboard', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/cabinet/entitlements/') return { effective_plan: 'START' }
      if (config?.params?.upcoming === true) return []
      if (config?.params?.upcoming === false) return []
      return []
    })

    const view = renderView()

    await waitFor(() => {
      expect(view.container.querySelector('.cabinet__grid')).toBeInTheDocument()
    })

    const text = view.container.textContent || ''
    expect(text).not.toMatch(/entitlements|trial|override|request|checkout|webhook|Broadcast/i)
    expect(view.container.querySelector('a[href="/cabinet/group-events"]')).not.toBeInTheDocument()
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
    const profileCoreLink = stepLinks.find((el) => el.getAttribute('href') === '/cabinet/profile')
    const availabilityLink = stepLinks.find((el) => el.getAttribute('href') === '/cabinet/availability-rules')
    const publicProfileLink = stepLinks.find((el) => el.getAttribute('href') === '/public')
    const inboundReadinessLink = stepLinks.find((el) => el.getAttribute('href') === '/cabinet/inquiries')

    expect(profileCoreLink?.getAttribute('href')).toBe('/cabinet/profile')
    expect(availabilityLink?.getAttribute('href')).toBe('/cabinet/availability-rules')
    expect(publicProfileLink?.getAttribute('href')).toBe('/public')
    expect(inboundReadinessLink?.getAttribute('href')).toBe('/cabinet/inquiries')
    expect((profileCoreLink?.textContent || '').trim().length).toBeGreaterThan(0)
    expect((availabilityLink?.textContent || '').trim().length).toBeGreaterThan(0)
    expect((publicProfileLink?.textContent || '').trim().length).toBeGreaterThan(0)
    expect((inboundReadinessLink?.textContent || '').trim().length).toBeGreaterThan(0)
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
    let resolveCanonical: (value: unknown) => void = () => { }
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


