import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, apiPatch, apiPost, updateSpecialistSessionMeeting } from '../lib/api'
import { BOOKING_SUCCESS_MESSAGES } from '../lib/bookingCopy'
import { formatSessionDateTime } from '../lib/specialistSessions'
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
  updateSpecialistSessionMeeting: vi.fn(),
}))

const mockedApiGet = vi.mocked(apiGet)
const mockedApiPatch = vi.mocked(apiPatch)
const mockedApiPost = vi.mocked(apiPost)
const mockedUpdateSpecialistSessionMeeting = vi.mocked(updateSpecialistSessionMeeting)

function buildSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 42,
    status: 'SCHEDULED',
    client: 77,
    client_name: 'Test Client',
    client_email: 'client@example.com',
    therapist: 3,
    slot_start_at: '2099-06-15T10:00:00Z',
    slot_end_at: '2099-06-15T11:00:00Z',
    ...overrides,
  }
}

function buildSlot(overrides: Record<string, unknown> = {}) {
  return {
    id: 9,
    start_at: '2099-06-16T10:00:00Z',
    end_at: '2099-06-16T11:00:00Z',
    is_booked: false,
    ...overrides,
  }
}

function buildSuggestion(overrides: Record<string, unknown> = {}) {
  return {
    slot_id: 9,
    start_at: '2099-06-16T10:00:00Z',
    end_at: '2099-06-16T11:00:00Z',
    label: 'Next slot',
    reason_tag: 'nearest_available',
    ...overrides,
  }
}

function buildRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: 15,
    session_id: 42,
    requested_slot_id: 9,
    requested_slot_start_at: '2099-06-17T10:00:00Z',
    requested_slot_end_at: '2099-06-17T11:00:00Z',
    client_name: 'Test Client',
    client_email: 'request@example.com',
    status: 'PENDING',
    ...overrides,
  }
}

type DetailRequest = ReturnType<typeof buildRequest>

function mockDetailContext(
  getSession: () => Record<string, unknown>,
  options: {
    slots?: Record<string, unknown>[]
    suggestions?: Record<string, unknown>[]
    note?: string
    requests?: Record<string, unknown>[]
  } = {}
) {
  const {
    slots = [buildSlot()],
    suggestions = [buildSuggestion()],
    note = 'Progress note',
    requests = [buildRequest()],
  } = options

  mockedApiGet.mockImplementation(async (url) => {
    if (url === `/booking/sessions/${mockRoute.params.id}/`) {
      return getSession()
    }

    if (url === '/cabinet/slots/') {
      return slots
    }

    if (url === `/booking/sessions/${mockRoute.params.id}/reschedule-suggestions/`) {
      return {
        suggestions,
      }
    }

    if (url === `/cabinet/sessions/${mockRoute.params.id}/note/`) {
      return {
        content: note,
      }
    }

    if (url === '/cabinet/sessions/reschedule-requests/') {
      return requests
    }

    throw new Error(`Unexpected apiGet call: ${url}`)
  })
}

function endpointCalls(url: string) {
  return mockedApiGet.mock.calls.filter(([calledUrl]) => calledUrl === url).length
}

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
    mockedApiPatch.mockReset()
    mockedApiPost.mockReset()
    mockedUpdateSpecialistSessionMeeting.mockReset()
    mockToast.show.mockReset()
    mockToast.success.mockReset()
    mockToast.error.mockReset()
    mockToast.warning.mockReset()
    mockToast.info.mockReset()
  })

  it('renders the session detail happy path with related context', async () => {
    let sessionDetail = buildSession({
      status: 'CONFIRMED',
      meeting_mode: 'ONLINE',
      meeting_url: 'https://meet.google.com/therapist-room',
      meeting_provider: 'google_meet',
      meeting_link_ready: true,
      join_available: true,
      join_starts_at: '2099-06-14T10:00:00Z',
      join_ends_at: '2099-06-15T11:30:00Z',
    })
    mockDetailContext(() => sessionDetail)

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
    expect(screen.getByText('Google Meet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Приєднатися' })).toHaveAttribute(
      'href',
      'https://meet.google.com/therapist-room'
    )
    expect(sessionDetail.status).toBe('CONFIRMED')
  })

  it('confirms a scheduled session and refreshes the detail context', async () => {
    let sessionDetail = buildSession({ status: 'SCHEDULED' })
    mockDetailContext(() => sessionDetail)

    mockedApiPatch.mockImplementation(async (url) => {
      if (url === '/booking/sessions/42/confirm/') {
        sessionDetail = {
          ...sessionDetail,
          status: 'CONFIRMED',
        }
        return {}
      }

      throw new Error(`Unexpected apiPatch call: ${url}`)
    })

    renderView()

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Підтвердити' }))

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/booking/sessions/42/confirm/')
      expect(mockToast.success).toHaveBeenCalledWith('Сесію підтверджено.')
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Підтвердити' })).toBeDisabled()
    })

    expect(endpointCalls('/booking/sessions/42/')).toBe(2)
    expect(endpointCalls('/cabinet/slots/')).toBe(2)
    expect(endpointCalls('/booking/sessions/42/reschedule-suggestions/')).toBe(2)
    expect(endpointCalls('/cabinet/sessions/reschedule-requests/')).toBe(2)
  })

  it('surfaces a stale confirm target error without reloading the page context', async () => {
    let sessionDetail = buildSession({ status: 'SCHEDULED' })
    mockDetailContext(() => sessionDetail)

    mockedApiPatch.mockRejectedValue({
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

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Підтвердити' }))

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/booking/sessions/42/confirm/')
      expect(mockToast.error).toHaveBeenCalledWith(
        'Цю дію неможливо виконати для поточного статусу сесії.'
      )
    })

    expect(endpointCalls('/booking/sessions/42/')).toBe(1)
    expect(screen.getByRole('button', { name: 'Підтвердити' })).not.toBeDisabled()
  })

  it('cancels a confirmed session and disables further cancellation after reload', async () => {
    let sessionDetail = buildSession({ status: 'CONFIRMED' })
    mockDetailContext(() => sessionDetail)

    mockedApiPatch.mockImplementation(async (url) => {
      if (url === '/booking/sessions/42/cancel/') {
        sessionDetail = {
          ...sessionDetail,
          status: 'CANCELLED',
        }
        return {}
      }

      throw new Error(`Unexpected apiPatch call: ${url}`)
    })

    renderView()

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Скасувати' }))

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/booking/sessions/42/cancel/')
      expect(mockToast.success).toHaveBeenCalledWith('Сесію скасовано.')
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Скасувати' })).toBeDisabled()
    })

    expect(screen.getByRole('button', { name: 'Перенести' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Повторювати щотижня' })).not.toBeInTheDocument()
    expect(endpointCalls('/booking/sessions/42/')).toBe(2)
  })

  it('completes a confirmed session, refreshes the detail context, and reloads the private note', async () => {
    let sessionDetail = buildSession({ status: 'CONFIRMED' })
    let noteContent = 'Completed session note'
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('50')

    mockedApiGet.mockImplementation(async (url) => {
      if (url === `/booking/sessions/${mockRoute.params.id}/`) {
        return sessionDetail
      }

      if (url === '/cabinet/slots/') {
        return [buildSlot()]
      }

      if (url === `/booking/sessions/${mockRoute.params.id}/reschedule-suggestions/`) {
        return {
          suggestions: [buildSuggestion()],
        }
      }

      if (url === `/cabinet/sessions/${mockRoute.params.id}/note/`) {
        return {
          content: noteContent,
        }
      }

      if (url === '/cabinet/sessions/reschedule-requests/') {
        return []
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    mockedApiPatch.mockImplementation(async (url, payload) => {
      if (url === '/booking/sessions/42/complete/') {
        expect(payload).toEqual({ actual_duration_minutes: 50 })
        sessionDetail = {
          ...sessionDetail,
          status: 'COMPLETED',
        }
        noteContent = 'Completed session note (reloaded)'
        return {}
      }

      throw new Error(`Unexpected apiPatch call: ${url}`)
    })

    try {
      renderView()

      expect(await screen.findByText('client@example.com')).toBeInTheDocument()
      expect(await screen.findByDisplayValue('Completed session note')).toBeInTheDocument()

      const statusPanel = screen.getByText(/ID: #77/).closest('section')
      expect(statusPanel).not.toBeNull()
      const completionButton = within(statusPanel as HTMLElement)
        .getAllByRole('button')
        .find((button) => button.textContent?.includes('Завершити'))
      if (!completionButton) {
        throw new Error('Complete button not found')
      }
      await fireEvent.click(completionButton)

      await waitFor(() => {
        expect(mockedApiPatch).toHaveBeenCalledWith('/booking/sessions/42/complete/', {
          actual_duration_minutes: 50,
        })
        expect(mockToast.success).toHaveBeenCalledWith(BOOKING_SUCCESS_MESSAGES.sessionCompleted)
      })

      expect(promptSpy).toHaveBeenCalledTimes(1)
      const updatedStatusPanel = screen.getByText(/ID: #77/).closest('section')
      expect(updatedStatusPanel).not.toBeNull()
      const remainingActionButtons = within(updatedStatusPanel as HTMLElement).queryAllByRole('button')
      expect(remainingActionButtons).toHaveLength(3)
      expect(remainingActionButtons.every((button) => button.hasAttribute('disabled'))).toBe(true)
      expect((updatedStatusPanel as HTMLElement).querySelector('.status-pill--muted')).not.toBeNull()
      expect(
        within(updatedStatusPanel as HTMLElement)
          .queryAllByRole('button')
          .some((button) => button.textContent?.includes('Завершити'))
      ).toBe(false)
      expect(await screen.findByDisplayValue('Completed session note (reloaded)')).toBeInTheDocument()
      expect(endpointCalls('/booking/sessions/42/')).toBe(2)
      expect(endpointCalls('/cabinet/slots/')).toBe(2)
      expect(endpointCalls('/booking/sessions/42/reschedule-suggestions/')).toBe(2)
      expect(endpointCalls('/cabinet/sessions/reschedule-requests/')).toBe(2)
      expect(endpointCalls('/cabinet/sessions/42/note/')).toBe(2)
    } finally {
      promptSpy.mockRestore()
    }
  })

  it('keeps stale complete rejection inline without reloading detail context or note', async () => {
    let sessionDetail = buildSession({ status: 'CONFIRMED' })
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('50')
    mockDetailContext(() => sessionDetail, {
      requests: [],
    })

    mockedApiPatch.mockRejectedValue({
      response: {
        status: 409,
        data: {
          code: 'STATE_TRANSITION_INVALID',
          reason_code: 'SESSION_STATUS_INVALID',
          detail: 'Invalid status transition.',
        },
      },
    })

    try {
      renderView()

      expect(await screen.findByText('client@example.com')).toBeInTheDocument()
      expect(await screen.findByDisplayValue('Progress note')).toBeInTheDocument()

      const statusPanel = screen.getByText(/ID: #77/).closest('section')
      expect(statusPanel).not.toBeNull()
      const completionButton = within(statusPanel as HTMLElement).getAllByRole('button')[1]
      if (!completionButton) {
        throw new Error('Complete button not found')
      }
      await fireEvent.click(completionButton)

      await waitFor(() => {
        expect(mockedApiPatch).toHaveBeenCalledWith('/booking/sessions/42/complete/', {
          actual_duration_minutes: 50,
        })
        expect(mockToast.error).toHaveBeenCalledTimes(1)
      })

      expect(promptSpy).toHaveBeenCalledTimes(1)
      expect(completionButton).not.toBeDisabled()
      expect(await screen.findByDisplayValue('Progress note')).toBeInTheDocument()
      expect(endpointCalls('/booking/sessions/42/')).toBe(1)
      expect(endpointCalls('/cabinet/slots/')).toBe(1)
      expect(endpointCalls('/booking/sessions/42/reschedule-suggestions/')).toBe(1)
      expect(endpointCalls('/cabinet/sessions/reschedule-requests/')).toBe(1)
      expect(endpointCalls('/cabinet/sessions/42/note/')).toBe(1)
    } finally {
      promptSpy.mockRestore()
    }
  })

  it('keeps confirm, cancel, and reschedule guarded for non-actionable statuses', async () => {
    let sessionDetail = buildSession({ status: 'COMPLETED' })
    mockDetailContext(() => sessionDetail, {
      requests: [],
    })

    renderView()

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Підтвердити' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Скасувати' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Перенести' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Повторювати щотижня' })).not.toBeInTheDocument()
    expect(mockedApiPatch).not.toHaveBeenCalled()
  })

  it('toggles the reschedule panel only for actionable sessions', async () => {
    let sessionDetail = buildSession({ status: 'CONFIRMED' })
    mockDetailContext(() => sessionDetail)

    renderView()

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Перенести' }))
    expect(await screen.findByText('Новий слот для сесії')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Сховати перенос' })).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Сховати перенос' }))

    await waitFor(() => {
      expect(screen.queryByText('Новий слот для сесії')).not.toBeInTheDocument()
    })
  })

  it('reschedules a confirmed session from detail suggestions and refreshes the session context', async () => {
    const updatedSlot = buildSlot({
      id: 10,
      start_at: '2099-06-18T10:00:00Z',
      end_at: '2099-06-18T11:00:00Z',
    })
    const updatedSuggestion = buildSuggestion({
      slot_id: updatedSlot.id,
      start_at: updatedSlot.start_at,
      end_at: updatedSlot.end_at,
    })
    let sessionDetail = buildSession({ status: 'CONFIRMED' })

    mockedApiGet.mockImplementation(async (url) => {
      if (url === `/booking/sessions/${mockRoute.params.id}/`) {
        return sessionDetail
      }

      if (url === '/cabinet/slots/') {
        return [updatedSlot]
      }

      if (url === `/booking/sessions/${mockRoute.params.id}/reschedule-suggestions/`) {
        return {
          suggestions: [updatedSuggestion],
        }
      }

      if (url === `/cabinet/sessions/${mockRoute.params.id}/note/`) {
        return {
          content: 'Progress note',
        }
      }

      if (url === '/cabinet/sessions/reschedule-requests/') {
        return []
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    mockedApiPatch.mockImplementation(async (url, payload) => {
      if (url === '/booking/sessions/42/reschedule/') {
        expect(payload).toEqual({ slot_id: 10 })
        sessionDetail = {
          ...sessionDetail,
          slot_start_at: updatedSlot.start_at,
          slot_end_at: updatedSlot.end_at,
        }
        return {}
      }

      throw new Error(`Unexpected apiPatch call: ${url}`)
    })

    renderView()

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()

    const statusPanel = screen.getByText(/ID: #77/).closest('section')
    expect(statusPanel).not.toBeNull()
    const summaryButtons = within(statusPanel as HTMLElement).getAllByRole('button')
    const rescheduleButton = summaryButtons[3]
    if (!rescheduleButton) {
      throw new Error('Reschedule button not found')
    }

    await fireEvent.click(rescheduleButton)
    await waitFor(() => {
      expect(document.querySelector('.slot-list')).not.toBeNull()
    })
    const reschedulePanel = document.querySelector('.slot-list')?.closest('section')
    expect(reschedulePanel).not.toBeNull()

    const panelButtons = within(reschedulePanel as HTMLElement).getAllByRole('button')
    const suggestionButton = panelButtons[0]
    if (!suggestionButton) {
      throw new Error('Suggestion button not found')
    }
    await fireEvent.click(suggestionButton)

    const confirmRescheduleButton = within(reschedulePanel as HTMLElement).getAllByRole('button')[1]
    if (!confirmRescheduleButton) {
      throw new Error('Confirm reschedule button not found')
    }
    await fireEvent.click(confirmRescheduleButton)

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/booking/sessions/42/reschedule/', {
        slot_id: 10,
      })
      expect(mockToast.success).toHaveBeenCalledWith(BOOKING_SUCCESS_MESSAGES.sessionRescheduled)
    })

    expect(screen.getAllByText(formatSessionDateTime(updatedSlot.start_at))).not.toHaveLength(0)
    expect(endpointCalls('/booking/sessions/42/')).toBe(2)
    expect(endpointCalls('/cabinet/slots/')).toBe(2)
    expect(endpointCalls('/booking/sessions/42/reschedule-suggestions/')).toBe(2)
    expect(endpointCalls('/cabinet/sessions/reschedule-requests/')).toBe(2)
    expect(endpointCalls('/cabinet/sessions/42/note/')).toBe(1)
  })

  it('approves and declines reschedule requests from the detail view with the expected refresh behavior', async () => {
    let sessionDetail = buildSession({ status: 'CONFIRMED' })
    let requests: [DetailRequest, DetailRequest] = [
      buildRequest({
        id: 15,
        client_email: 'approve-request@example.com',
        status: 'PENDING',
      }),
      buildRequest({
        id: 16,
        requested_slot_id: 10,
        requested_slot_start_at: '2099-06-18T10:00:00Z',
        requested_slot_end_at: '2099-06-18T11:00:00Z',
        client_email: 'decline-request@example.com',
        status: 'PENDING',
      }),
    ]

    mockedApiGet.mockImplementation(async (url) => {
      if (url === `/booking/sessions/${mockRoute.params.id}/`) {
        return sessionDetail
      }

      if (url === '/cabinet/slots/') {
        return [buildSlot()]
      }

      if (url === `/booking/sessions/${mockRoute.params.id}/reschedule-suggestions/`) {
        return {
          suggestions: [buildSuggestion()],
        }
      }

      if (url === `/cabinet/sessions/${mockRoute.params.id}/note/`) {
        return {
          content: 'Progress note',
        }
      }

      if (url === '/cabinet/sessions/reschedule-requests/') {
        return requests.map((request) => ({ ...request }))
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    mockedApiPatch.mockImplementation(async (url) => {
      if (url === '/cabinet/sessions/reschedule-requests/15/approve/') {
        const [approveRequest, declineRequest] = requests
        requests = [
          {
            ...approveRequest,
            status: 'APPROVED',
          },
          declineRequest,
        ]
        return {}
      }

      if (url === '/cabinet/sessions/reschedule-requests/16/decline/') {
        const [approveRequest, declineRequest] = requests
        requests = [
          approveRequest,
          {
            ...declineRequest,
            status: 'DECLINED',
          },
        ]
        return {}
      }

      throw new Error(`Unexpected apiPatch call: ${url}`)
    })

    renderView()

    expect(await screen.findByText('approve-request@example.com')).toBeInTheDocument()

    const approveCard = screen.getByText('approve-request@example.com').closest('article')
    expect(approveCard).not.toBeNull()
    await fireEvent.click((approveCard as HTMLElement).querySelectorAll('button')[0] as HTMLButtonElement)

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/cabinet/sessions/reschedule-requests/15/approve/')
      expect(mockToast.success).toHaveBeenCalledWith(BOOKING_SUCCESS_MESSAGES.rescheduleRequestApproved)
    })

    await waitFor(() => {
      expect((screen.getByText('approve-request@example.com').closest('article') as HTMLElement).querySelectorAll('button')).toHaveLength(0)
    })

    const declineCard = screen.getByText('decline-request@example.com').closest('article')
    expect(declineCard).not.toBeNull()
    await fireEvent.click((declineCard as HTMLElement).querySelectorAll('button')[1] as HTMLButtonElement)

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/cabinet/sessions/reschedule-requests/16/decline/')
      expect(mockToast.success).toHaveBeenCalledWith(BOOKING_SUCCESS_MESSAGES.rescheduleRequestDeclined)
    })

    await waitFor(() => {
      expect((screen.getByText('decline-request@example.com').closest('article') as HTMLElement).querySelectorAll('button')).toHaveLength(0)
    })

    expect(endpointCalls('/booking/sessions/42/')).toBe(2)
    expect(endpointCalls('/cabinet/slots/')).toBe(2)
    expect(endpointCalls('/booking/sessions/42/reschedule-suggestions/')).toBe(2)
    expect(endpointCalls('/cabinet/sessions/reschedule-requests/')).toBe(3)
    expect(endpointCalls('/cabinet/sessions/42/note/')).toBe(1)
  })

  it('shows recurring controls for eligible sessions and blocks invalid custom occurrences client-side', async () => {
    let sessionDetail = buildSession({
      status: 'CONFIRMED',
      slot_start_at: '2099-07-15T10:00:00Z',
      slot_end_at: '2099-07-15T11:00:00Z',
    })
    mockDetailContext(() => sessionDetail, {
      requests: [],
    })

    renderView()

    expect(await screen.findByText('client@example.com')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Повторювати щотижня' }))
    expect(await screen.findByText('Створити повторювані сесії')).toBeInTheDocument()

    await fireEvent.update(screen.getByLabelText('Кількість повторів'), 'custom')
    await fireEvent.update(screen.getByLabelText('Власне число'), '0')
    await fireEvent.click(screen.getByRole('button', { name: 'Створити серію' }))

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Вкажіть кількість повторів від 1 до 52.')
    })

    expect(mockedApiPost).not.toHaveBeenCalled()
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
              code: 'SESSION_NOT_FOUND',
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

    expect(container).toHaveTextContent('Сесію не знайдено.')
    expect(mockedApiGet).toHaveBeenCalledTimes(1)
    expect(mockedApiGet).toHaveBeenCalledWith('/booking/sessions/42/')
  })

  it('allows editing the meeting link and reloads the session on success', async () => {
    const oldUrl = 'https://meet.example.com/old-link'
    const newUrl = 'https://meet.example.com/new-link'
    let sessionDetail: Record<string, unknown> = buildSession({
      status: 'CONFIRMED',
      meeting_mode: 'ONLINE',
      meeting_url: oldUrl,
      meeting_provider: 'GOOGLE_MEET',
      meeting_link_ready: true,
      join_available: true,
      join_starts_at: '2099-06-14T10:00:00Z',
      join_ends_at: '2099-06-15T11:30:00Z',
    })
    mockDetailContext(() => sessionDetail)

    mockedUpdateSpecialistSessionMeeting.mockImplementation(async (_sessionId, payload) => {
      expect(_sessionId).toBe(42)
      expect(payload).toEqual({
        meeting_mode: 'ONLINE',
        meeting_url: newUrl,
      })

      sessionDetail = {
        ...sessionDetail,
        meeting_mode: 'ONLINE',
        meeting_url: newUrl,
        meeting_provider: 'EXTERNAL',
        meeting_link_ready: true,
        join_available: true,
      }

      return sessionDetail as any
    })

    renderView()

    const meetingCard = (await screen.findByText('Приєднатися')).closest('.meeting-card')
    expect(meetingCard).toBeInTheDocument()

    const editButton = within(meetingCard as HTMLElement).getByRole('button', { name: 'Редагувати' })
    await fireEvent.click(editButton)

    const input = (await within(meetingCard as HTMLElement).findByLabelText(
      'Посилання на онлайн-зустріч'
    )) as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input.value).toBe(oldUrl)

    await fireEvent.update(input, newUrl)

    const saveButton = within(meetingCard as HTMLElement).getByRole('button', { name: 'Зберегти' })
    await fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockedUpdateSpecialistSessionMeeting).toHaveBeenCalledWith(42, {
        meeting_mode: 'ONLINE',
        meeting_url: newUrl,
      })
    })

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Посилання на зустріч оновлено.')
    })

    expect(endpointCalls('/booking/sessions/42/')).toBe(2)
  })
})
