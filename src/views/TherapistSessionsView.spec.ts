import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, fetchSpecialistProfile } from '../lib/api'
import { BOOKING_SUCCESS_MESSAGES } from '../lib/bookingCopy'
import {
  approveSpecialistRescheduleRequest,
  cancelSpecialistSession,
  completeSpecialistSession,
  confirmSpecialistSession,
  createRecurringSpecialistSessions,
  declineSpecialistRescheduleRequest,
  fetchSpecialistAvailableSlots,
  fetchSpecialistClientWorkbookSnapshot,
  fetchSpecialistRescheduleRequests,
  fetchSpecialistRescheduleSuggestions,
  fetchSpecialistSessionNoteContent,
  formatSessionDateTime,
  rescheduleSpecialistSession,
  saveSpecialistClientJournal,
  saveSpecialistSessionNote,
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
    fetchSpecialistClientWorkbookSnapshot: vi.fn(),
    fetchSpecialistRescheduleRequests: vi.fn(),
    fetchSpecialistRescheduleSuggestions: vi.fn(),
    fetchSpecialistSessionNoteContent: vi.fn(),
    rescheduleSpecialistSession: vi.fn(),
    saveSpecialistClientJournal: vi.fn(),
    saveSpecialistSessionNote: vi.fn(),
  }
})

const mockedApiGet = vi.mocked(apiGet)
const mockedFetchSpecialistProfile = vi.mocked(fetchSpecialistProfile)
const mockedApproveSpecialistRescheduleRequest = vi.mocked(approveSpecialistRescheduleRequest)
const mockedCancelSpecialistSession = vi.mocked(cancelSpecialistSession)
const mockedCompleteSpecialistSession = vi.mocked(completeSpecialistSession)
const mockedConfirmSpecialistSession = vi.mocked(confirmSpecialistSession)
const mockedCreateRecurringSpecialistSessions = vi.mocked(createRecurringSpecialistSessions)
const mockedDeclineSpecialistRescheduleRequest = vi.mocked(declineSpecialistRescheduleRequest)
const mockedFetchSpecialistAvailableSlots = vi.mocked(fetchSpecialistAvailableSlots)
const mockedFetchSpecialistClientWorkbookSnapshot = vi.mocked(fetchSpecialistClientWorkbookSnapshot)
const mockedFetchSpecialistRescheduleRequests = vi.mocked(fetchSpecialistRescheduleRequests)
const mockedFetchSpecialistRescheduleSuggestions = vi.mocked(fetchSpecialistRescheduleSuggestions)
const mockedFetchSpecialistSessionNoteContent = vi.mocked(fetchSpecialistSessionNoteContent)
const mockedRescheduleSpecialistSession = vi.mocked(rescheduleSpecialistSession)
const mockedSaveSpecialistClientJournal = vi.mocked(saveSpecialistClientJournal)
const mockedSaveSpecialistSessionNote = vi.mocked(saveSpecialistSessionNote)

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
    mockedApproveSpecialistRescheduleRequest.mockReset()
    mockedCancelSpecialistSession.mockReset()
    mockedCompleteSpecialistSession.mockReset()
    mockedConfirmSpecialistSession.mockReset()
    mockedCreateRecurringSpecialistSessions.mockReset()
    mockedDeclineSpecialistRescheduleRequest.mockReset()
    mockedFetchSpecialistAvailableSlots.mockReset()
    mockedFetchSpecialistClientWorkbookSnapshot.mockReset()
    mockedFetchSpecialistRescheduleRequests.mockReset()
    mockedFetchSpecialistRescheduleSuggestions.mockReset()
    mockedFetchSpecialistSessionNoteContent.mockReset()
    mockedRescheduleSpecialistSession.mockReset()
    mockedSaveSpecialistClientJournal.mockReset()
    mockedSaveSpecialistSessionNote.mockReset()
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
    mockedFetchSpecialistClientWorkbookSnapshot.mockResolvedValue({ content: '', isMissing: true })
    mockedFetchSpecialistRescheduleRequests.mockResolvedValue([])
    mockedFetchSpecialistRescheduleSuggestions.mockResolvedValue([])
    mockedFetchSpecialistSessionNoteContent.mockResolvedValue('')
    mockedSaveSpecialistSessionNote.mockResolvedValue(undefined)
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

  it('renders payment badges from payment_badge_state without replacing lifecycle status badges', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming) {
        return [
          buildSession({
            id: 31,
            client: 131,
            client_name: 'Paid upcoming',
            client_email: 'paid-upcoming@example.com',
            payment_badge_state: 'paid',
          }),
          buildSession({
            id: 32,
            status: 'CONFIRMED',
            client: 132,
            client_name: 'Awaiting upcoming',
            client_email: 'awaiting-upcoming@example.com',
            payment_badge_state: 'awaiting_confirmation',
          }),
          buildSession({
            id: 33,
            client: 133,
            client_name: 'No payment badge',
            client_email: 'no-payment-badge@example.com',
            payment_badge_state: null,
          }),
          buildSession({
            id: 34,
            status: 'CONFIRMED',
            client: 134,
            client_name: 'Unpaid upcoming',
            client_email: 'unpaid-upcoming@example.com',
            payment_badge_state: 'unpaid',
          }),
        ]
      }

      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming === false) {
        return [
          buildSession({
            id: 41,
            status: 'COMPLETED',
            client: 141,
            client_name: 'Paid history',
            client_email: 'paid-history@example.com',
            slot_start_at: '2099-05-10T10:00:00Z',
            slot_end_at: '2099-05-10T10:50:00Z',
            payment_badge_state: 'paid',
          }),
        ]
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(
      await screen.findByText((_, element) =>
        Boolean(
          element?.classList.contains('muted') &&
            element.textContent?.trim().endsWith('paid-upcoming@example.com') &&
            !element.textContent.includes('unpaid-upcoming@example.com')
        )
      )
    ).toBeInTheDocument()
    expect(await screen.findByText(/paid-history@example\.com/)).toBeInTheDocument()

    const paidUpcomingCard = screen
      .getByText((_, element) =>
        Boolean(
          element?.classList.contains('muted') &&
            element.textContent?.trim().endsWith('paid-upcoming@example.com') &&
            !element.textContent.includes('unpaid-upcoming@example.com')
        )
      )
      .closest('article')
    expect(paidUpcomingCard).not.toBeNull()
    expect(within(paidUpcomingCard as HTMLElement).getByText('Оплачено')).toBeInTheDocument()
    expect(within(paidUpcomingCard as HTMLElement).getByText('Заплановано')).toBeInTheDocument()
    expect(within(paidUpcomingCard as HTMLElement).getByText('Оплачено')).toHaveClass('status-pill--payment-paid')

    const awaitingUpcomingCard = screen.getByText(/awaiting-upcoming@example\.com/).closest('article')
    expect(awaitingUpcomingCard).not.toBeNull()
    expect(
      within(awaitingUpcomingCard as HTMLElement).getByText('Очікує підтвердження оплати')
    ).toBeInTheDocument()
    expect(within(awaitingUpcomingCard as HTMLElement).getByText('Підтверджено')).toBeInTheDocument()
    expect(
      within(awaitingUpcomingCard as HTMLElement).getByText('Очікує підтвердження оплати')
    ).toHaveClass('status-pill--payment-awaiting')

    const unpaidUpcomingCard = screen.getByText(/unpaid-upcoming@example\.com/).closest('article')
    expect(unpaidUpcomingCard).not.toBeNull()
    expect(within(unpaidUpcomingCard as HTMLElement).getByText('Не оплачено')).toBeInTheDocument()
    expect(within(unpaidUpcomingCard as HTMLElement).getByText('Не оплачено')).toHaveClass('status-pill--payment-unpaid')

    const noPaymentCard = screen.getByText(/no-payment-badge@example\.com/).closest('article')
    expect(noPaymentCard).not.toBeNull()
    expect(within(noPaymentCard as HTMLElement).queryByText('Оплачено')).not.toBeInTheDocument()
    expect(
      within(noPaymentCard as HTMLElement).queryByText('Очікує підтвердження оплати')
    ).not.toBeInTheDocument()

    const paidHistoryCard = screen.getByText(/paid-history@example\.com/).closest('article')
    expect(paidHistoryCard).not.toBeNull()
    expect(within(paidHistoryCard as HTMLElement).getByText('Оплачено')).toBeInTheDocument()
    expect(within(paidHistoryCard as HTMLElement).getByText('Оплачено')).toHaveClass('status-pill--payment-paid')
    expect(within(paidHistoryCard as HTMLElement).getByText('Завершено')).toBeInTheDocument()
  })

  it('opens the date picker when clicking anywhere in the date filter field', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/sessions/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const showPickerMock = vi.fn()
    const originalShowPicker = (HTMLInputElement.prototype as HTMLInputElement & { showPicker?: () => void }).showPicker
    Object.defineProperty(HTMLInputElement.prototype, 'showPicker', {
      configurable: true,
      value: showPickerMock,
    })

    try {
      renderView()
      await screen.findByText('Керуйте сесіями')

      const dateField = screen.getByText('Дата').closest('label')
      expect(dateField).not.toBeNull()
      await fireEvent.click(dateField as HTMLElement)

      expect(showPickerMock).toHaveBeenCalled()
    } finally {
      Object.defineProperty(HTMLInputElement.prototype, 'showPicker', {
        configurable: true,
        value: originalShowPicker,
      })
    }
  })

  it('prioritizes live session in the top card and exposes direct join CTA', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming) {
        return [
          buildSession({
            id: 31,
            status: 'CONFIRMED',
            meeting_url: 'https://meet.google.com/live-specialist-room',
            join_available: true,
            join_starts_at: '2000-01-01T00:00:00Z',
            join_ends_at: '2100-01-01T00:00:00Z',
            slot_start_at: '2000-01-01T00:00:00Z',
            slot_end_at: '2100-01-01T00:00:00Z',
          }),
          buildSession({
            id: 32,
            status: 'SCHEDULED',
            slot_start_at: '2099-06-16T10:00:00Z',
            slot_end_at: '2099-06-16T10:50:00Z',
          }),
        ]
      }

      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming === false) {
        return []
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const view = renderView()
    await screen.findByText('Керуйте сесіями')

    await waitFor(() => {
      const priorityMain = view.container.querySelector('.priority-next__main') as HTMLAnchorElement | null
      expect(priorityMain).not.toBeNull()
      expect(priorityMain?.getAttribute('href')).toBe('/cabinet/sessions/31')
    })

    await waitFor(() => {
      const joinLink = view.container.querySelector(
        '.priority-next__actions a[href=\"https://meet.google.com/live-specialist-room\"]'
      ) as HTMLAnchorElement | null
      expect(joinLink).not.toBeNull()
    })
  })

  it('shows offline format badge and does not render join CTA for offline sessions', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming) {
        return [
          buildSession({
            id: 36,
            status: 'CONFIRMED',
            session_format: 'offline',
            offline_location: 'Київ, офіс 12',
            meeting_url: 'https://meet.google.com/offline-ignored',
            join_available: true,
            join_starts_at: '2000-01-01T00:00:00Z',
            join_ends_at: '2100-01-01T00:00:00Z',
            slot_start_at: '2000-01-01T00:00:00Z',
            slot_end_at: '2100-01-01T00:00:00Z',
          }),
        ]
      }

      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming === false) {
        return []
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()
    await screen.findByText('Керуйте сесіями')

    expect(await screen.findAllByText('Формат: Офлайн')).not.toHaveLength(0)
    expect(screen.queryByRole('link', { name: 'Приєднатися' })).not.toBeInTheDocument()
  })

  it('shows scheduled status before start even if join window is already open', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming) {
        return [
          buildSession({
            id: 33,
            status: 'CONFIRMED',
            meeting_url: 'https://meet.google.com/wait-room',
            join_available: true,
            join_starts_at: '2000-01-01T00:00:00Z',
            join_ends_at: '2100-01-01T00:00:00Z',
            slot_start_at: '2099-06-16T10:00:00Z',
            slot_end_at: '2099-06-16T10:50:00Z',
          }),
          buildSession({
            id: 34,
            status: 'SCHEDULED',
            slot_start_at: '2099-06-16T09:00:00Z',
            slot_end_at: '2099-06-16T09:50:00Z',
          }),
        ]
      }
      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming === false) {
        return []
      }
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const view = renderView()
    await screen.findByText('Керуйте сесіями')

    await waitFor(() => {
      const priorityMain = view.container.querySelector('.priority-next__main') as HTMLAnchorElement | null
      expect(priorityMain).not.toBeNull()
      expect(priorityMain?.getAttribute('href')).toBe('/cabinet/sessions/34')
    })

    const priorityCards = view.container.querySelectorAll('.priority-card')
    const nextSessionCard = priorityCards[1] as HTMLElement
    expect(within(nextSessionCard).queryByText('Сесія триває')).not.toBeInTheDocument()
    expect(within(nextSessionCard).getByText('Заплановано')).toBeInTheDocument()
  })

  it('shows past confirmed session in history with complete action', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming) {
        return []
      }

      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming === false) {
        return [
          buildSession({
            id: 41,
            status: 'CONFIRMED',
            client: 120,
            client_name: 'Past Confirmed',
            client_email: 'past-confirmed@example.com',
            slot_start_at: '2000-01-01T10:00:00Z',
            slot_end_at: '2000-01-01T10:50:00Z',
          }),
        ]
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(await screen.findByText(/past-confirmed@example\.com/)).toBeInTheDocument()
    expect(document.querySelector('.history-grid')).not.toBeNull()
    expect(document.querySelector('.history-grid .history-tile')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Завершити' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Деталі' })).toHaveAttribute('href', '/cabinet/sessions/41')
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
      expect(mockToast.success).toHaveBeenCalledWith(BOOKING_SUCCESS_MESSAGES.sessionConfirmed)
    })

    const updatedScheduledCard = screen.getByText(/anna@example\.com/).closest('article')
    expect(updatedScheduledCard).not.toBeNull()
    expect(within(updatedScheduledCard as HTMLElement).queryByRole('button', { name: 'Підтвердити' })).not.toBeInTheDocument()
    expect(within(updatedScheduledCard as HTMLElement).getByRole('link', { name: 'Відкрити сесію' })).toBeInTheDocument()

    const confirmedCard = screen.getByText(/maria@example\.com/).closest('article')
    expect(confirmedCard).not.toBeNull()
    await fireEvent.click(within(confirmedCard as HTMLElement).getByRole('button', { name: 'Скасувати' }))

    await waitFor(() => {
      expect(mockedCancelSpecialistSession).toHaveBeenCalledWith(12)
      expect(mockToast.success).toHaveBeenCalledWith(BOOKING_SUCCESS_MESSAGES.sessionCancelled)
    })

    const updatedConfirmedCard = screen.getAllByText(/maria@example\.com/)[0]?.closest('article')
    expect(updatedConfirmedCard).not.toBeNull()
    expect(within(updatedConfirmedCard as HTMLElement).getByText('Скасовано')).toBeInTheDocument()
    expect(within(updatedConfirmedCard as HTMLElement).getByRole('button', { name: 'Скасувати' })).toBeDisabled()
    expect(mockedApiGet).toHaveBeenCalledTimes(6)
  })

  it('surfaces a stale confirm target error without reloading the list context', async () => {
    const scheduledSession = buildSession()

    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming) {
        return [scheduledSession]
      }

      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming === false) {
        return []
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    mockedConfirmSpecialistSession.mockRejectedValue({
      response: {
        status: 409,
        data: {
          code: 'STATE_TRANSITION_INVALID',
          reason_code: 'SESSION_STATUS_INVALID',
          detail: 'Invalid status transition.',
        },
      },
    })

    renderView()

    expect(await screen.findByText(/anna@example\.com/)).toBeInTheDocument()

    const scheduledCard = screen.getByText(/anna@example\.com/).closest('article')
    expect(scheduledCard).not.toBeNull()
    const actionButtons = within(scheduledCard as HTMLElement).getAllByRole('button')
    const confirmButton = actionButtons[0]
    if (!confirmButton) {
      throw new Error('Confirm button not found')
    }
    await fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockedConfirmSpecialistSession).toHaveBeenCalledWith(11)
    })

    expect(screen.getByText(/Цю дію неможливо виконати/)).toBeInTheDocument()
    expect(confirmButton).not.toBeDisabled()
    expect(mockedApiGet).toHaveBeenCalledTimes(2)
  })

  it('completes a confirmed session, reloads the list, and opens the note modal with refreshed content', async () => {
    const confirmedSession = buildSession({
      id: 15,
      status: 'CONFIRMED',
      client: 105,
      client_name: 'Liliia',
      client_email: 'completed@example.com',
      slot: 205,
      slot_start_at: '2099-06-19T08:00:00Z',
      slot_end_at: '2099-06-19T08:50:00Z',
    })

    let upcomingSessions = [confirmedSession]

    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming) {
        return upcomingSessions
      }

      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming === false) {
        return []
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    mockedCompleteSpecialistSession.mockImplementation(async (sessionId, payload) => {
      expect(sessionId).toBe(15)
      expect(payload).toEqual({ actual_duration_minutes: 55 })
      upcomingSessions = [
        {
          ...confirmedSession,
          status: 'COMPLETED',
        },
      ]
    })
    mockedFetchSpecialistSessionNoteContent.mockImplementation(async (sessionId) => {
      expect(sessionId).toBe(15)
      return 'Updated completion note'
    })
    mockedFetchSpecialistClientWorkbookSnapshot.mockImplementation(async (clientId) => {
      expect(clientId).toBe(105)
      return { content: 'Client journal note', isMissing: false }
    })

    renderView()

    expect(await screen.findByText(/completed@example\.com/)).toBeInTheDocument()

    const sessionCard = screen.getByText(/completed@example\.com/).closest('article')
    expect(sessionCard).not.toBeNull()
    const completionButton = within(sessionCard as HTMLElement)
      .getAllByRole('button')
      .find((button) => button.textContent?.includes('Завершити'))
    if (!completionButton) {
      throw new Error('Complete button not found')
    }
    await fireEvent.click(completionButton)
    const completionInput = await screen.findByTestId('session-completion-duration-input')
    await fireEvent.update(completionInput, '55')
    await fireEvent.click(screen.getByTestId('session-completion-submit'))

    await waitFor(() => {
      expect(mockedCompleteSpecialistSession).toHaveBeenCalledWith(15, { actual_duration_minutes: 55 })
      expect(mockToast.success).toHaveBeenCalledWith(BOOKING_SUCCESS_MESSAGES.sessionCompleted)
    })
    expect(mockedFetchSpecialistSessionNoteContent).toHaveBeenCalledWith(15)
    expect(mockedFetchSpecialistClientWorkbookSnapshot).toHaveBeenCalledWith(105)
    expect(await screen.findByDisplayValue('Updated completion note')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('Client journal note')).toBeInTheDocument()
    expect(document.querySelector('a[href="/cabinet/clients?client=105&autoOpen=1"]')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Відкрити робочий зошит' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Додати / відкрити нотатку' })).not.toBeInTheDocument()
    expect(screen.getByText('Нотатки після сесії')).toBeInTheDocument()

    const updatedCard = screen.getAllByText(/completed@example\.com/)[0]?.closest('article')
    expect(updatedCard).not.toBeNull()
    expect((updatedCard as HTMLElement).querySelector('.status-pill--muted')).not.toBeNull()
    expect(
      within(updatedCard as HTMLElement)
        .queryAllByRole('button')
        .some((button) => button.textContent?.includes('Завершити'))
    ).toBe(false)
    expect(mockedApiGet).toHaveBeenCalledTimes(4)
  })

  it('surfaces a stale complete target error without reloading the list or opening the note modal', async () => {
    const confirmedSession = buildSession({
      id: 16,
      status: 'CONFIRMED',
      client: 106,
      client_name: 'Solomiia',
      client_email: 'stale-complete@example.com',
      slot: 206,
      slot_start_at: '2099-06-20T08:00:00Z',
      slot_end_at: '2099-06-20T08:50:00Z',
    })
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming) {
        return [confirmedSession]
      }

      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming === false) {
        return []
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    mockedCompleteSpecialistSession.mockRejectedValue({
      response: {
        status: 409,
        data: {
          code: 'STATE_TRANSITION_INVALID',
          reason_code: 'SESSION_STATUS_INVALID',
          detail: 'Invalid status transition.',
        },
      },
    })

    renderView()

    expect(await screen.findByText(/stale-complete@example\.com/)).toBeInTheDocument()

    const sessionCard = screen.getByText(/stale-complete@example\.com/).closest('article')
    expect(sessionCard).not.toBeNull()
    const completionButton = within(sessionCard as HTMLElement).getByRole('button', { name: 'Завершити' })
    if (!completionButton) {
      throw new Error('Complete button not found')
    }
    await fireEvent.click(completionButton)
    await fireEvent.click(screen.getByTestId('session-completion-submit'))

    await waitFor(() => {
      expect(mockedCompleteSpecialistSession).toHaveBeenCalledWith(16, {
        actual_duration_minutes: 50,
      })
    })
    expect(document.querySelector('.form-error')).not.toBeNull()
    expect(mockedFetchSpecialistSessionNoteContent).not.toHaveBeenCalled()
    expect(mockedFetchSpecialistClientWorkbookSnapshot).not.toHaveBeenCalled()
    expect(completionButton).not.toBeDisabled()
    expect(mockedApiGet).toHaveBeenCalledTimes(2)
  })

  it('keeps completion note modal open after saving session note', async () => {
    const confirmedSession = buildSession({
      id: 17,
      status: 'CONFIRMED',
      client: 107,
      client_name: 'Iryna',
      client_email: 'keep-open@example.com',
      slot: 207,
      slot_start_at: '2099-06-21T08:00:00Z',
      slot_end_at: '2099-06-21T08:50:00Z',
    })
    let upcomingSessions = [confirmedSession]
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming) {
        return upcomingSessions
      }
      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming === false) {
        return []
      }
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedCompleteSpecialistSession.mockImplementation(async () => {
      upcomingSessions = [{ ...confirmedSession, status: 'COMPLETED' }]
    })
    mockedFetchSpecialistSessionNoteContent.mockResolvedValue('Initial note')
    mockedFetchSpecialistClientWorkbookSnapshot.mockResolvedValue({ content: 'Initial workbook', isMissing: false })

    renderView()

    expect(await screen.findByText(/keep-open@example\.com/)).toBeInTheDocument()
    const sessionCard = screen.getByText(/keep-open@example\.com/).closest('article')
    expect(sessionCard).not.toBeNull()
    const completionButton = within(sessionCard as HTMLElement).getByRole('button', {
      name: 'Завершити',
    }) as HTMLButtonElement
    expect(completionButton).toBeTruthy()
    await fireEvent.click(completionButton)
    await fireEvent.click(screen.getByTestId('session-completion-submit'))

    expect(await screen.findByDisplayValue('Initial note')).toBeInTheDocument()
    await fireEvent.update(screen.getByDisplayValue('Initial note'), 'Updated note')
    const saveSessionNoteButton = document.querySelector(
      '.note-panel .note-actions .btn--sm',
    ) as HTMLButtonElement | null
    expect(saveSessionNoteButton).not.toBeNull()
    await fireEvent.click(saveSessionNoteButton as HTMLButtonElement)

    await waitFor(() => {
      expect(mockedSaveSpecialistSessionNote).toHaveBeenCalledWith(17, 'Updated note')
    })
    expect(screen.getByDisplayValue('Updated note')).toBeInTheDocument()
    expect(document.querySelectorAll('.note-save-feedback').length).toBeGreaterThan(0)

    const saveButtons = Array.from(document.querySelectorAll('.note-panel .note-actions .btn--sm')) as HTMLButtonElement[]
    const saveWorkbookButton = saveButtons[1]
    expect(saveWorkbookButton).toBeTruthy()
    await fireEvent.click(saveWorkbookButton as HTMLButtonElement)
    await waitFor(() => {
      expect(mockedSaveSpecialistClientJournal).toHaveBeenCalledWith(107, 'Initial workbook')
    })
    expect(document.querySelectorAll('.note-save-feedback').length).toBeGreaterThan(1)
  })

  it('confirms before closing note modal when there are unsaved changes', async () => {
    const confirmedSession = buildSession({
      id: 18,
      status: 'CONFIRMED',
      client: 108,
      client_name: 'Guarded',
      client_email: 'guarded@example.com',
      slot: 208,
      slot_start_at: '2099-06-22T08:00:00Z',
      slot_end_at: '2099-06-22T08:50:00Z',
    })
    let upcomingSessions = [confirmedSession]
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming) {
        return upcomingSessions
      }
      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming === false) {
        return []
      }
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedCompleteSpecialistSession.mockImplementation(async () => {
      upcomingSessions = [{ ...confirmedSession, status: 'COMPLETED' }]
    })
    mockedFetchSpecialistSessionNoteContent.mockResolvedValue('Initial guarded note')
    mockedFetchSpecialistClientWorkbookSnapshot.mockResolvedValue({ content: 'Initial guarded workbook', isMissing: false })

    const confirmSpy = vi.spyOn(window, 'confirm')
    confirmSpy.mockReturnValueOnce(false).mockReturnValueOnce(true)

    renderView()

    expect(await screen.findByText(/guarded@example\.com/)).toBeInTheDocument()
    const sessionCard = screen.getByText(/guarded@example\.com/).closest('article')
    expect(sessionCard).not.toBeNull()
    const completionButton = within(sessionCard as HTMLElement).getByRole('button', {
      name: 'Завершити',
    }) as HTMLButtonElement
    await fireEvent.click(completionButton)
    await fireEvent.click(screen.getByTestId('session-completion-submit'))

    const noteField = await screen.findByDisplayValue('Initial guarded note')
    await fireEvent.update(noteField, 'Unsaved guarded note')

    const closeButton = document.querySelector('.note-modal__primary-action') as HTMLButtonElement | null
    expect(closeButton).toBeTruthy()
    await fireEvent.click(closeButton as HTMLButtonElement)
    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(document.querySelector('.note-modal')).toBeInTheDocument()

    await fireEvent.click(closeButton as HTMLButtonElement)
    await waitFor(() => {
      expect(document.querySelector('.note-modal')).not.toBeInTheDocument()
    })
    confirmSpy.mockRestore()
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

    expect(await screen.findByLabelText('Нове вільне віконце')).toBeInTheDocument()
    expect(mockedFetchSpecialistRescheduleSuggestions).toHaveBeenCalledWith(13)

    await fireEvent.update(screen.getByLabelText('Нове вільне віконце'), '401')
    await fireEvent.click(screen.getByRole('button', { name: 'Підтвердити перенос' }))

    await waitFor(() => {
      expect(mockedRescheduleSpecialistSession).toHaveBeenCalledWith(13, 401)
      expect(mockToast.success).toHaveBeenCalledWith(BOOKING_SUCCESS_MESSAGES.sessionRescheduled)
    })

    await waitFor(() => {
      expect(screen.queryByLabelText('Нове вільне віконце')).not.toBeInTheDocument()
    })
    expect(screen.getAllByText(formatSessionDateTime(nextSlot.start_at))).toHaveLength(2)
    expect(mockedFetchSpecialistAvailableSlots).toHaveBeenCalledTimes(2)
    expect(mockedApiGet).toHaveBeenCalledTimes(4)
  })

  it('approves and declines reschedule requests with the expected cross-view reload behavior', async () => {
    const pendingSession = buildSession({
      id: 12,
      status: 'CONFIRMED',
      client: 102,
      client_name: 'Марія',
      client_email: 'maria@example.com',
      slot: 202,
      slot_start_at: '2099-06-16T12:00:00Z',
      slot_end_at: '2099-06-16T12:50:00Z',
    })
    const approvedRequest = buildRescheduleRequest({
      id: 51,
      session_id: 12,
      client_name: 'Марія',
      client_email: 'maria-request@example.com',
      status: 'APPROVED',
    })
    const pendingDeclineRequest = buildRescheduleRequest({
      id: 52,
      session_id: 12,
      requested_slot_id: 302,
      requested_slot_start_at: '2099-06-18T13:00:00Z',
      requested_slot_end_at: '2099-06-18T13:50:00Z',
      client_name: 'Олена',
      client_email: 'olena-request@example.com',
      status: 'PENDING',
    })
    const declinedRequest = {
      ...pendingDeclineRequest,
      status: 'DECLINED',
    }

    let requests = [buildRescheduleRequest(), pendingDeclineRequest]

    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming) {
        return [pendingSession]
      }

      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming === false) {
        return []
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    mockedFetchSpecialistRescheduleRequests.mockImplementation(async () => requests)
    mockedApproveSpecialistRescheduleRequest.mockImplementation(async (requestId) => {
      expect(requestId).toBe(51)
      requests = [approvedRequest, pendingDeclineRequest]
    })
    mockedDeclineSpecialistRescheduleRequest.mockImplementation(async (requestId) => {
      expect(requestId).toBe(52)
      requests = [approvedRequest, declinedRequest]
    })

    renderView()

    expect(await screen.findByText(/maria-request@example\.com/)).toBeInTheDocument()

    const approveCard = screen.getByText(/maria-request@example\.com/).closest('article')
    expect(approveCard).not.toBeNull()
    const approveButtons = within(approveCard as HTMLElement).getAllByRole('button')
    const approveButton = approveButtons[0]
    if (!approveButton) {
      throw new Error('Approve button not found')
    }
    await fireEvent.click(approveButton)

    await waitFor(() => {
      expect(mockedApproveSpecialistRescheduleRequest).toHaveBeenCalledWith(51)
      expect(mockToast.success).toHaveBeenCalledWith(BOOKING_SUCCESS_MESSAGES.rescheduleRequestApproved)
    })

    expect(within(screen.getByText(/maria-request@example\.com/).closest('article') as HTMLElement).getByText('Погоджено')).toBeInTheDocument()

    const declineCard = screen.getByText(/olena-request@example\.com/).closest('article')
    expect(declineCard).not.toBeNull()
    const declineButtons = within(declineCard as HTMLElement).getAllByRole('button')
    const declineButton = declineButtons[1]
    if (!declineButton) {
      throw new Error('Decline button not found')
    }
    await fireEvent.click(declineButton)

    await waitFor(() => {
      expect(mockedDeclineSpecialistRescheduleRequest).toHaveBeenCalledWith(52)
      expect(mockToast.success).toHaveBeenCalledWith(BOOKING_SUCCESS_MESSAGES.rescheduleRequestDeclined)
    })

    expect(within(screen.getByText(/olena-request@example\.com/).closest('article') as HTMLElement).getByText('Відхилено')).toBeInTheDocument()

    expect(mockedFetchSpecialistRescheduleRequests).toHaveBeenCalledTimes(3)
    expect(mockedFetchSpecialistAvailableSlots).toHaveBeenCalledTimes(2)
    expect(mockedFetchSpecialistProfile).toHaveBeenCalledTimes(2)
    expect(mockedApiGet).toHaveBeenCalledTimes(4)
  })

  it('prefers client_display_name and shows note metadata in history tiles', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming) {
        return []
      }
      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming === false) {
        return [
          buildSession({
            id: 61,
            status: 'COMPLETED',
            client: 161,
            client_name: 'Client #161',
            client_username: 'client.161',
            client_display_name: 'Display Session Client',
            slot_start_at: '2099-05-20T09:00:00Z',
            slot_end_at: '2099-05-20T09:50:00Z',
            has_note: true,
            note_updated_at: '2099-05-20T11:00:00Z',
          }),
        ]
      }
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(await screen.findByText(/Display Session Client/)).toBeInTheDocument()
    expect(screen.getByText(/Нотатку оновлено/)).toBeInTheDocument()
    expect(screen.queryByText('Client #161')).not.toBeInTheDocument()
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
    expect(screen.getByText(formatSessionDateTime('2099-07-08T08:00:00Z'))).toBeInTheDocument()
    expect(
      screen.getByText(
        `${formatSessionDateTime('2099-07-29T08:00:00Z')} - На цю дату вже немає вільного вікна`
      )
    ).toBeInTheDocument()
    expect(mockedFetchSpecialistAvailableSlots).toHaveBeenCalledTimes(2)
    expect(mockedApiGet).toHaveBeenCalledTimes(4)
  })
})
