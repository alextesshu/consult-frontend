import { render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { apiGet } from '../lib/api'
import CabinetView from './CabinetView.vue'

const mockMe = ref({
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
})

vi.mock('pinia', () => ({
  storeToRefs: (store: any) => store,
}))

vi.mock('../stores/auth', () => ({
  useAuthStore: () => ({
    me: mockMe,
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

    renderView()

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenCalledWith('/booking/sessions/', { params: { upcoming: true } })
      expect(mockedApiGet).toHaveBeenCalledWith('/booking/sessions/', { params: { upcoming: false } })
    })

    const heroLink = await screen.findByRole('link', { name: /Сесія триває/i })
    expect(heroLink).toHaveAttribute('href', '/cabinet/sessions/77')
    expect(screen.getByRole('link', { name: 'Приєднатися' })).toHaveAttribute(
      'href',
      'https://meet.google.com/live-hero-room'
    )
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
})
