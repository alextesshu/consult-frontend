import { fireEvent, render, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { apiGet } from '../lib/api'
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
}))

const mockedApiGet = vi.mocked(apiGet)

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
    mockLoadMe.mockReset()
    mockLoadMe.mockResolvedValue(undefined)
    mockMe.value = createMePayload()
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
})
