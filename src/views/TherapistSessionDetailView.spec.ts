import { render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet } from '../lib/api'
import TherapistSessionDetailView from './TherapistSessionDetailView.vue'

const mockRoute = {
  params: {
    id: '42',
  },
}

const mockToast = {
  show: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')

  return {
    ...actual,
    useRoute: () => mockRoute,
  }
})

vi.mock('../composables/useToast', () => ({
  useToast: () => mockToast,
}))

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}))

const mockedApiGet = vi.mocked(apiGet)

function renderView() {
  return render(TherapistSessionDetailView, {
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

describe('TherapistSessionDetailView', () => {
  beforeEach(() => {
    mockRoute.params.id = '42'
    mockedApiGet.mockReset()
    mockToast.show.mockReset()
    mockToast.success.mockReset()
    mockToast.error.mockReset()
    mockToast.warning.mockReset()
    mockToast.info.mockReset()
  })

  it('renders the session detail happy path with related context', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/sessions/42/') {
        return {
          id: 42,
          status: 'SCHEDULED',
          client: 77,
          client_name: 'Test Client',
          client_email: 'client@example.com',
          therapist: 3,
          slot_start_at: '2099-06-15T10:00:00Z',
          slot_end_at: '2099-06-15T11:00:00Z',
        }
      }

      if (url === '/cabinet/slots/') {
        return [
          {
            id: 9,
            start_at: '2099-06-16T10:00:00Z',
            end_at: '2099-06-16T11:00:00Z',
            is_booked: false,
          },
        ]
      }

      if (url === '/booking/sessions/42/reschedule-suggestions/') {
        return {
          suggestions: [
            {
              slot_id: 9,
              start_at: '2099-06-16T10:00:00Z',
              end_at: '2099-06-16T11:00:00Z',
              label: 'Next slot',
              reason_tag: 'nearest_available',
            },
          ],
        }
      }

      if (url === '/cabinet/sessions/42/note/') {
        return {
          content: 'Progress note',
        }
      }

      if (url === '/cabinet/sessions/reschedule-requests/') {
        return [
          {
            id: 15,
            session_id: 42,
            requested_slot_id: 9,
            requested_slot_start_at: '2099-06-17T10:00:00Z',
            requested_slot_end_at: '2099-06-17T11:00:00Z',
            client_name: 'Test Client',
            client_email: 'request@example.com',
            status: 'PENDING',
          },
        ]
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenCalledTimes(5)
    })

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()
    expect(screen.getByText(/ID: #77/)).toBeInTheDocument()
    expect(await screen.findByText('request@example.com')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('Progress note')).toBeInTheDocument()

    expect(mockedApiGet).toHaveBeenCalledWith('/booking/sessions/42/')
    expect(mockedApiGet).toHaveBeenCalledWith('/cabinet/slots/')
    expect(mockedApiGet).toHaveBeenCalledWith('/booking/sessions/42/reschedule-suggestions/')
    expect(mockedApiGet).toHaveBeenCalledWith('/cabinet/sessions/42/note/')
    expect(mockedApiGet).toHaveBeenCalledWith('/cabinet/sessions/reschedule-requests/')
    expect(container.querySelector('.empty-state')).not.toBeInTheDocument()
  })

  it('shows an inline empty state and skips API loading for an invalid route id', async () => {
    mockRoute.params.id = 'not-a-number'

    const { container } = renderView()

    await waitFor(() => {
      expect(container.querySelector('.empty-state')).toBeInTheDocument()
    })

    expect(mockedApiGet).not.toHaveBeenCalled()
    expect(container.querySelector('a[href="/cabinet/sessions"]')).toBeInTheDocument()
  })

  it('shows the stale session error state when the detail request fails', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/sessions/42/') {
        throw {
          response: {
            status: 404,
            data: {
              detail: 'Session missing.',
            },
          },
        }
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()

    await waitFor(() => {
      expect(container.querySelector('.empty-state')).toBeInTheDocument()
    })

    expect(container).toHaveTextContent('Session missing.')
    expect(mockedApiGet).toHaveBeenCalledTimes(1)
    expect(mockedApiGet).toHaveBeenCalledWith('/booking/sessions/42/')
  })
})
