import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, fetchSpecialistProfile } from '../lib/api'
import {
  fetchSpecialistAvailableSlots,
  fetchSpecialistRescheduleRequests,
} from '../lib/specialistSessions'
import TherapistSessionsView from './TherapistSessionsView.vue'

const mockRoute = {
  hash: '',
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
  fetchSpecialistProfile: vi.fn(),
}))

vi.mock('../lib/specialistSessions', async () => {
  const actual = await vi.importActual<typeof import('../lib/specialistSessions')>('../lib/specialistSessions')

  return {
    ...actual,
    approveSpecialistRescheduleRequest: vi.fn(),
    cancelSpecialistSession: vi.fn(),
    completeSpecialistSession: vi.fn(),
    confirmSpecialistSession: vi.fn(),
    createRecurringSpecialistSessions: vi.fn(),
    declineSpecialistRescheduleRequest: vi.fn(),
    fetchSpecialistAvailableSlots: vi.fn(),
    fetchSpecialistRescheduleRequests: vi.fn(),
    fetchSpecialistRescheduleSuggestions: vi.fn(),
    fetchSpecialistSessionNoteContent: vi.fn(),
    rescheduleSpecialistSession: vi.fn(),
    saveSpecialistSessionNote: vi.fn(),
  }
})

const mockedApiGet = vi.mocked(apiGet)
const mockedFetchSpecialistProfile = vi.mocked(fetchSpecialistProfile)
const mockedFetchSpecialistAvailableSlots = vi.mocked(fetchSpecialistAvailableSlots)
const mockedFetchSpecialistRescheduleRequests = vi.mocked(fetchSpecialistRescheduleRequests)

function buildSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 11,
    status: 'SCHEDULED',
    client: 101,
    client_name: 'Анна',
    client_email: 'anna@example.com',
    therapist: 12,
    therapist_username: 'olena',
    slot: 201,
    slot_start_at: '2099-06-15T10:00:00Z',
    slot_end_at: '2099-06-15T10:50:00Z',
    ...overrides,
  }
}

function buildRescheduleRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: 51,
    session_id: 12,
    requested_slot_id: 301,
    requested_slot_start_at: '2099-06-17T13:00:00Z',
    requested_slot_end_at: '2099-06-17T13:50:00Z',
    client_name: 'Марія',
    client_email: 'maria-request@example.com',
    status: 'PENDING',
    ...overrides,
  }
}

function renderView() {
  return render(TherapistSessionsView, {
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

async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    value: vi.fn(),
    configurable: true,
  })
})

describe('TherapistSessionsView', () => {
  beforeEach(() => {
    mockRoute.hash = ''
    mockedApiGet.mockReset()
    mockedFetchSpecialistProfile.mockReset()
    mockedFetchSpecialistAvailableSlots.mockReset()
    mockedFetchSpecialistRescheduleRequests.mockReset()
    mockToast.show.mockReset()
    mockToast.success.mockReset()
    mockToast.error.mockReset()
    mockToast.warning.mockReset()
    mockToast.info.mockReset()

    mockedFetchSpecialistProfile.mockResolvedValue({
      id: 12,
      photo_url: 'https://example.com/photo.jpg',
    } as Awaited<ReturnType<typeof fetchSpecialistProfile>>)
    mockedFetchSpecialistAvailableSlots.mockResolvedValue([])
    mockedFetchSpecialistRescheduleRequests.mockResolvedValue([])
  })

  it('renders the list-level session surface with filters and pending request context', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming) {
        return [
          buildSession(),
          buildSession({
            id: 12,
            status: 'CONFIRMED',
            client: 102,
            client_name: 'Марія',
            client_email: 'maria@example.com',
            slot: 202,
            slot_start_at: '2099-06-16T12:00:00Z',
            slot_end_at: '2099-06-16T12:50:00Z',
          }),
        ]
      }

      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming === false) {
        return [
          buildSession({
            id: 21,
            status: 'COMPLETED',
            client: 103,
            client_name: 'Ірина',
            client_email: 'history@example.com',
            slot: 203,
            slot_start_at: '2099-05-20T09:00:00Z',
            slot_end_at: '2099-05-20T09:50:00Z',
          }),
        ]
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchSpecialistRescheduleRequests.mockResolvedValue([buildRescheduleRequest()])

    renderView()

    expect(await screen.findByText('Керуйте сесіями')).toBeInTheDocument()

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenCalledWith('/booking/sessions/', { params: { upcoming: true } })
      expect(mockedApiGet).toHaveBeenCalledWith('/booking/sessions/', { params: { upcoming: false } })
    })

    expect(mockedFetchSpecialistAvailableSlots).toHaveBeenCalled()
    expect(mockedFetchSpecialistRescheduleRequests).toHaveBeenCalled()
    expect(mockedFetchSpecialistProfile).toHaveBeenCalled()

    expect(screen.getByText('Очікують підтвердження')).toBeInTheDocument()
    expect(screen.getByText('Є запит на перенос')).toBeInTheDocument()
    expect(screen.getByText(/maria-request@example\.com/)).toBeInTheDocument()
    expect(screen.getByText(/history@example\.com/)).toBeInTheDocument()
    const photos = screen.getAllByRole('img', { name: 'Фото спеціаліста' })
    expect(photos).toHaveLength(2)
    expect(photos[0]).toHaveAttribute('src', 'https://example.com/photo.jpg')

    const mariaCard = screen.getByText(/maria@example\.com/).closest('article')
    expect(mariaCard).not.toBeNull()
    expect(within(mariaCard as HTMLElement).getByRole('button', { name: 'Перенести' })).toBeDisabled()

    await fireEvent.update(screen.getByLabelText('Статус'), 'CONFIRMED')

    await waitFor(() => {
      expect(screen.queryByText(/anna@example\.com/)).not.toBeInTheDocument()
    })
    expect(screen.getByText(/maria@example\.com/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Скинути фільтри' })).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Скинути фільтри' }))

    expect(await screen.findByText(/anna@example\.com/)).toBeInTheDocument()
  })

  it('shows empty states when there are no sessions or transfer requests', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/sessions/') {
        return []
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenCalledTimes(2)
      expect(mockedFetchSpecialistRescheduleRequests).toHaveBeenCalled()
    })
    await flushPromises()
    await flushPromises()

    expect(screen.getByText('Немає майбутніх сесій.')).toBeInTheDocument()
    expect(screen.getByText('Немає нових запитів')).toBeInTheDocument()
    expect(screen.getByText('Історія порожня')).toBeInTheDocument()
    expect(screen.queryByText(/Нові бронювання:/)).not.toBeInTheDocument()
  })
})
