import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, fetchSpecialistProfile } from '../lib/api'
import {
  cancelSpecialistSession,
  confirmSpecialistSession,
  createRecurringSpecialistSessions,
  fetchSpecialistAvailableSlots,
  fetchSpecialistRescheduleRequests,
  fetchSpecialistRescheduleSuggestions,
  rescheduleSpecialistSession,
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
const mockedCancelSpecialistSession = vi.mocked(cancelSpecialistSession)
const mockedConfirmSpecialistSession = vi.mocked(confirmSpecialistSession)
const mockedCreateRecurringSpecialistSessions = vi.mocked(createRecurringSpecialistSessions)
const mockedFetchSpecialistAvailableSlots = vi.mocked(fetchSpecialistAvailableSlots)
const mockedFetchSpecialistRescheduleRequests = vi.mocked(fetchSpecialistRescheduleRequests)
const mockedFetchSpecialistRescheduleSuggestions = vi.mocked(fetchSpecialistRescheduleSuggestions)
const mockedRescheduleSpecialistSession = vi.mocked(rescheduleSpecialistSession)

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
    mockedCancelSpecialistSession.mockReset()
    mockedConfirmSpecialistSession.mockReset()
    mockedCreateRecurringSpecialistSessions.mockReset()
    mockedFetchSpecialistAvailableSlots.mockReset()
    mockedFetchSpecialistRescheduleRequests.mockReset()
    mockedFetchSpecialistRescheduleSuggestions.mockReset()
    mockedRescheduleSpecialistSession.mockReset()
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
    mockedFetchSpecialistRescheduleSuggestions.mockResolvedValue([])
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

  it('confirms and cancels sessions with a list reload after each mutation', async () => {
    const scheduledSession = buildSession()
    const confirmedSession = buildSession({
      id: 12,
      status: 'CONFIRMED',
      client: 102,
      client_name: 'Марія',
      client_email: 'maria@example.com',
      slot: 202,
      slot_start_at: '2099-06-16T12:00:00Z',
      slot_end_at: '2099-06-16T12:50:00Z',
    })
    const cancelledSession = {
      ...confirmedSession,
      status: 'CANCELLED',
    }

    let upcomingSessions = [scheduledSession, confirmedSession]

    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming) {
        return upcomingSessions
      }

      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming === false) {
        return []
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    mockedConfirmSpecialistSession.mockImplementation(async (sessionId) => {
      expect(sessionId).toBe(11)
      upcomingSessions = [{ ...scheduledSession, status: 'CONFIRMED' }, confirmedSession]
    })

    mockedCancelSpecialistSession.mockImplementation(async (sessionId) => {
      expect(sessionId).toBe(12)
      upcomingSessions = [{ ...scheduledSession, status: 'CONFIRMED' }, cancelledSession]
    })

    renderView()

    expect(await screen.findByText(/anna@example\.com/)).toBeInTheDocument()

    const scheduledCard = screen.getByText(/anna@example\.com/).closest('article')
    expect(scheduledCard).not.toBeNull()
    await fireEvent.click(within(scheduledCard as HTMLElement).getByRole('button', { name: 'Підтвердити' }))

    await waitFor(() => {
      expect(mockedConfirmSpecialistSession).toHaveBeenCalledWith(11)
      expect(mockToast.success).toHaveBeenCalledWith('Сесію підтверджено.')
    })

    const updatedScheduledCard = screen.getByText(/anna@example\.com/).closest('article')
    expect(updatedScheduledCard).not.toBeNull()
    expect(within(updatedScheduledCard as HTMLElement).getByRole('button', { name: 'Підтвердити' })).toBeDisabled()

    const confirmedCard = screen.getByText(/maria@example\.com/).closest('article')
    expect(confirmedCard).not.toBeNull()
    await fireEvent.click(within(confirmedCard as HTMLElement).getByRole('button', { name: 'Скасувати' }))

    await waitFor(() => {
      expect(mockedCancelSpecialistSession).toHaveBeenCalledWith(12)
      expect(mockToast.success).toHaveBeenCalledWith('Сесію скасовано.')
    })

    const updatedConfirmedCard = screen.getAllByText(/maria@example\.com/)[0]?.closest('article')
    expect(updatedConfirmedCard).not.toBeNull()
    expect(within(updatedConfirmedCard as HTMLElement).getByText('Скасовано')).toBeInTheDocument()
    expect(within(updatedConfirmedCard as HTMLElement).getByRole('button', { name: 'Скасувати' })).toBeDisabled()
    expect(mockedApiGet).toHaveBeenCalledTimes(6)
  })

  it('submits a reschedule request from the list and closes the inline panel after reload', async () => {
    const rescheduledSession = buildSession({
      id: 13,
      status: 'CONFIRMED',
      client: 103,
      client_name: 'Олена',
      client_email: 'reschedule@example.com',
      slot: 203,
      slot_start_at: '2099-06-18T09:00:00Z',
      slot_end_at: '2099-06-18T09:50:00Z',
    })
    const nextSlot = {
      id: 401,
      start_at: '2099-06-20T11:00:00Z',
      end_at: '2099-06-20T11:50:00Z',
      is_booked: false,
    }
    const suggestedSlot = {
      slot_id: 401,
      start_at: '2099-06-20T11:00:00Z',
      end_at: '2099-06-20T11:50:00Z',
      label: 'Nearest available',
      reason_tag: 'nearest_available',
    }

    let upcomingSessions = [rescheduledSession]

    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming) {
        return upcomingSessions
      }

      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming === false) {
        return []
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    mockedFetchSpecialistAvailableSlots.mockResolvedValue([nextSlot])
    mockedFetchSpecialistRescheduleSuggestions.mockResolvedValue([suggestedSlot])
    mockedRescheduleSpecialistSession.mockImplementation(async (sessionId, slotId) => {
      expect(sessionId).toBe(13)
      expect(slotId).toBe(401)
      upcomingSessions = [
        {
          ...rescheduledSession,
          slot: 401,
          slot_start_at: nextSlot.start_at,
          slot_end_at: nextSlot.end_at,
        },
      ]
    })

    renderView()

    expect(await screen.findByText(/reschedule@example\.com/)).toBeInTheDocument()

    const sessionCard = screen.getByText(/reschedule@example\.com/).closest('article')
    expect(sessionCard).not.toBeNull()
    await fireEvent.click(within(sessionCard as HTMLElement).getByRole('button', { name: 'Перенести' }))

    expect(await screen.findByText('Рекомендовані варіанти перенесення')).toBeInTheDocument()
    expect(mockedFetchSpecialistRescheduleSuggestions).toHaveBeenCalledWith(13)

    await fireEvent.update(screen.getByLabelText('Нове вільне віконце'), '401')
    await fireEvent.click(screen.getByRole('button', { name: 'Підтвердити перенос' }))

    await waitFor(() => {
      expect(mockedRescheduleSpecialistSession).toHaveBeenCalledWith(13, 401)
      expect(mockToast.success).toHaveBeenCalledWith('Сесію перенесено.')
    })

    await waitFor(() => {
      expect(screen.queryByText('Рекомендовані варіанти перенесення')).not.toBeInTheDocument()
    })
    expect(screen.getAllByText('20.06.2099, 14:00')).toHaveLength(2)
    expect(mockedFetchSpecialistAvailableSlots).toHaveBeenCalledTimes(2)
    expect(mockedApiGet).toHaveBeenCalledTimes(4)
  })

  it('creates a recurring series from the list and renders the returned summary', async () => {
    const recurringSession = buildSession({
      id: 14,
      status: 'CONFIRMED',
      client: 104,
      client_name: 'Ірина',
      client_email: 'recurring@example.com',
      slot: 204,
      slot_start_at: '2099-07-01T08:00:00Z',
      slot_end_at: '2099-07-01T08:50:00Z',
    })

    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming) {
        return [recurringSession]
      }

      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming === false) {
        return []
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    mockedCreateRecurringSpecialistSessions.mockResolvedValue({
      created_count: 3,
      skipped_count: 1,
      created_dates: [
        '2099-07-08T08:00:00Z',
        '2099-07-15T08:00:00Z',
        '2099-07-22T08:00:00Z',
      ],
      skipped_reasons: [{ reason: 'SLOT_UNAVAILABLE', count: 1 }],
      skipped: [{ start_at: '2099-07-29T08:00:00Z', reason: 'SLOT_UNAVAILABLE' }],
    })

    renderView()

    expect(await screen.findByText(/recurring@example\.com/)).toBeInTheDocument()

    const sessionCard = screen.getByText(/recurring@example\.com/).closest('article')
    expect(sessionCard).not.toBeNull()
    await fireEvent.click(within(sessionCard as HTMLElement).getByRole('button', { name: 'Повторювати щотижня' }))

    expect(await screen.findByText('Кількість повторів')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Створити серію' }))

    await waitFor(() => {
      expect(mockedCreateRecurringSpecialistSessions).toHaveBeenCalledWith(14, 4)
      expect(mockToast.success).toHaveBeenCalledWith('Створено 3 сесій, пропущено 1.')
    })

    expect(await screen.findByText('Створено 3 сесій')).toBeInTheDocument()
    expect(screen.getByText('Пропущено 1 через конфлікти')).toBeInTheDocument()
    expect(screen.getByText('08.07.2099, 11:00')).toBeInTheDocument()
    expect(screen.getByText('29.07.2099, 11:00 - На цю дату вже немає вільного вікна')).toBeInTheDocument()
    expect(mockedFetchSpecialistAvailableSlots).toHaveBeenCalledTimes(2)
    expect(mockedApiGet).toHaveBeenCalledTimes(4)
  })
})
