import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { createPinia } from 'pinia'
import { apiGet, apiPatch, fetchSpecialistProfile } from '../lib/api'
import { BOOKING_SUCCESS_MESSAGES } from '../lib/bookingCopy'
import { formatSessionDateTime } from '../lib/specialistSessions'
import TherapistSessionDetailView from './TherapistSessionDetailView.vue'
import TherapistSessionsView from './TherapistSessionsView.vue'

const mockToast = {
  show: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}

vi.mock('../composables/useToast', () => ({
  useToast: () => mockToast,
}))

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  fetchSpecialistProfile: vi.fn(),
}))

const mockedApiGet = vi.mocked(apiGet)
const mockedApiPatch = vi.mocked(apiPatch)
const mockedFetchSpecialistProfile = vi.mocked(fetchSpecialistProfile)

type SessionRecord = {
  id: number
  status: string
  client: number
  client_name: string
  client_email: string
  therapist: number
  therapist_username: string
  slot: number
  slot_start_at: string
  slot_end_at: string
}

type SlotRecord = {
  id: number
  start_at: string
  end_at: string
  is_booked: boolean
}

type RequestRecord = {
  id: number
  session_id: number
  requested_slot_id: number
  requested_slot_start_at: string
  requested_slot_end_at: string
  client_name: string
  client_email: string
  status: string
}

let sessionsState: Record<number, SessionRecord>
let sessionNoteState: Record<number, string>
let slotsState: SlotRecord[]
let requestsState: RequestRecord[]

function buildSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: 42,
    status: 'CONFIRMED',
    client: 77,
    client_name: 'Flow Client',
    client_email: 'flow@example.com',
    therapist: 3,
    therapist_username: 'specialist',
    slot: 201,
    slot_start_at: '2099-06-15T10:00:00Z',
    slot_end_at: '2099-06-15T10:50:00Z',
    ...overrides,
  }
}

function cloneSession(session: SessionRecord): SessionRecord {
  return {
    ...session,
  }
}

function cloneSlot(slot: SlotRecord): SlotRecord {
  return {
    ...slot,
  }
}

function buildRequest(overrides: Partial<RequestRecord> = {}): RequestRecord {
  return {
    id: 15,
    session_id: 42,
    requested_slot_id: 301,
    requested_slot_start_at: '2099-06-18T12:00:00Z',
    requested_slot_end_at: '2099-06-18T12:50:00Z',
    client_name: 'Flow Client',
    client_email: 'request@example.com',
    status: 'PENDING',
    ...overrides,
  }
}

function cloneRequest(request: RequestRecord): RequestRecord {
  return {
    ...request,
  }
}

function getSessionById(id: number): SessionRecord {
  const session = sessionsState[id]
  if (!session) {
    throw new Error(`Missing session state for ${id}`)
  }
  return session
}

async function openSessionFromCard(card: HTMLElement, sessionId: number) {
  const detailLink = card.querySelector(`a[href="/cabinet/sessions/${sessionId}"]`) as HTMLAnchorElement | null
  expect(detailLink).not.toBeNull()
  await fireEvent.click(detailLink as HTMLAnchorElement)
}

async function openPrivateSessionNote() {
  await fireEvent.click(await screen.findByRole('button', { name: 'Відкрити нотатку' }))
}

function getUpcomingSessions(): SessionRecord[] {
  return Object.values(sessionsState)
    .filter((session) => session.status === 'SCHEDULED' || session.status === 'CONFIRMED')
    .map(cloneSession)
}

function getHistorySessions(): SessionRecord[] {
  return Object.values(sessionsState)
    .filter((session) => session.status !== 'SCHEDULED' && session.status !== 'CONFIRMED')
    .map(cloneSession)
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/cabinet',
        component: { template: '<div>Cabinet</div>' },
      },
      {
        path: '/cabinet/slots',
        component: { template: '<div>Slots</div>' },
      },
      {
        path: '/cabinet/profile',
        component: { template: '<div>Profile</div>' },
      },
      {
        path: '/cabinet/sessions',
        name: 'cabinet-sessions',
        component: TherapistSessionsView,
      },
      {
        path: '/cabinet/sessions/:id(\\d+)',
        name: 'cabinet-session-detail',
        component: TherapistSessionDetailView,
      },
    ],
  })
}

async function renderFlow(initialPath = '/cabinet/sessions') {
  const router = createTestRouter()
  await router.push(initialPath)
  await router.isReady()

  render(
    {
      components: { RouterView },
      template: '<RouterView />',
    },
    {
      global: {
        plugins: [createPinia(), router],
      },
    }
  )

  return { router }
}

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    value: vi.fn(),
    configurable: true,
  })
})

describe('specialist sessions flow', () => {
  beforeEach(() => {
    sessionsState = {
      42: buildSession(),
    }
    sessionNoteState = {
      42: 'Initial flow note',
    }
    slotsState = [
      {
        id: 201,
        start_at: '2099-06-15T10:00:00Z',
        end_at: '2099-06-15T10:50:00Z',
        is_booked: true,
      },
      {
        id: 301,
        start_at: '2099-06-18T12:00:00Z',
        end_at: '2099-06-18T12:50:00Z',
        is_booked: false,
      },
    ]
    requestsState = []

    mockedApiGet.mockReset()
    mockedApiPatch.mockReset()
    mockedFetchSpecialistProfile.mockReset()
    mockToast.show.mockReset()
    mockToast.success.mockReset()
    mockToast.error.mockReset()
    mockToast.warning.mockReset()
    mockToast.info.mockReset()

    mockedFetchSpecialistProfile.mockResolvedValue({
      id: 3,
      photo_url: 'https://example.com/specialist.jpg',
    } as Awaited<ReturnType<typeof fetchSpecialistProfile>>)

    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming) {
        return getUpcomingSessions()
      }

      if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming === false) {
        return getHistorySessions()
      }

      if (url === '/cabinet/slots/') {
        return slotsState.map(cloneSlot)
      }

      if (url === '/cabinet/sessions/reschedule-requests/') {
        return requestsState.map(cloneRequest)
      }

      if (url === '/booking/sessions/42/reschedule-suggestions/') {
        const suggestionSlot = slotsState.find((slot) => slot.id === 301)
        return {
          suggestions: suggestionSlot
            ? [
                {
                  slot_id: suggestionSlot.id,
                  start_at: suggestionSlot.start_at,
                  end_at: suggestionSlot.end_at,
                  label: 'Nearest available',
                  reason_tag: 'nearest_available',
                },
              ]
            : [],
        }
      }

      if (url === '/cabinet/sessions/42/note/') {
        return { content: sessionNoteState[42] || '' }
      }

      if (url === '/booking/sessions/42/') {
        return cloneSession(getSessionById(42))
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    mockedApiPatch.mockImplementation(async (url, payload) => {
      if (url === '/booking/sessions/42/confirm/') {
        const session = getSessionById(42)
        sessionsState[42] = {
          ...session,
          status: 'CONFIRMED',
        }
        return {}
      }

      if (url === '/booking/sessions/42/cancel/') {
        const session = getSessionById(42)
        sessionsState[42] = {
          ...session,
          status: 'CANCELLED',
        }
        return {}
      }

      if (url === '/booking/sessions/42/complete/') {
        expect(payload).toEqual({ actual_duration_minutes: 50 })
        const session = getSessionById(42)
        sessionsState[42] = {
          ...session,
          status: 'COMPLETED',
        }
        sessionNoteState[42] = 'Completed flow note'
        return {}
      }

      if (url === '/booking/sessions/42/reschedule/') {
        expect(payload).toEqual({ slot_id: 301 })
        const session = getSessionById(42)
        const slot = slotsState.find((item) => item.id === 301)
        if (!slot) {
          throw new Error('Missing reschedule slot state')
        }
        sessionsState[42] = {
          ...session,
          slot: slot.id,
          slot_start_at: slot.start_at,
          slot_end_at: slot.end_at,
        }
        return {}
      }

      if (url === '/cabinet/sessions/reschedule-requests/15/approve/') {
        requestsState = requestsState.map((request) =>
          request.id === 15
            ? {
                ...request,
                status: 'APPROVED',
              }
            : request
        )
        return {}
      }

      if (url === '/cabinet/sessions/reschedule-requests/16/decline/') {
        requestsState = requestsState.map((request) =>
          request.id === 16
            ? {
                ...request,
                status: 'DECLINED',
              }
            : request
        )
        return {}
      }

      throw new Error(`Unexpected apiPatch call: ${url}`)
    })
  })

  it('keeps list and detail aligned after confirming from list and cancelling from detail', async () => {
    sessionsState = {
      42: buildSession({
        status: 'SCHEDULED',
      }),
    }

    const { router } = await renderFlow()

    expect(await screen.findByText(/flow@example\.com/)).toBeInTheDocument()
    expect(router.currentRoute.value.path).toBe('/cabinet/sessions')

    const scheduledCard = screen.getByText(/flow@example\.com/).closest('article')
    expect(scheduledCard).not.toBeNull()

    await fireEvent.click(within(scheduledCard as HTMLElement).getByRole('button', { name: 'Підтвердити сесію' }))

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/booking/sessions/42/confirm/')
      expect(mockToast.success).toHaveBeenCalledWith(BOOKING_SUCCESS_MESSAGES.sessionConfirmed)
    })

    const confirmedCard = screen.getByText(/flow@example\.com/).closest('article')
    expect(confirmedCard).not.toBeNull()
    expect(within(confirmedCard as HTMLElement).queryByRole('button', { name: 'Підтвердити сесію' })).toBeNull()
    expect(within(confirmedCard as HTMLElement).getByRole('button', { name: 'Скасувати' })).not.toBeDisabled()

    await openSessionFromCard(confirmedCard as HTMLElement, 42)

    await waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/cabinet/sessions/42')
    })

    expect(await screen.findByText(/ID: #77/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Підтвердити' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Скасувати' })).not.toBeDisabled()

    await fireEvent.click(screen.getByRole('button', { name: 'Скасувати' }))

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/booking/sessions/42/cancel/')
      expect(mockToast.success).toHaveBeenCalledWith(BOOKING_SUCCESS_MESSAGES.sessionCancelled)
    })

    expect(screen.getByRole('button', { name: 'Скасувати' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Перенести' })).toBeDisabled()

    const backLink = document.querySelector('a[href="/cabinet/sessions"]') as HTMLAnchorElement | null
    expect(backLink).not.toBeNull()
    await fireEvent.click(backLink as HTMLAnchorElement)

    await waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/cabinet/sessions')
    })

    expect(await screen.findByText(/flow@example\.com/)).toBeInTheDocument()

    const historyCard = screen.getByText(/flow@example\.com/).closest('article')
    expect(historyCard).not.toBeNull()
    expect(within(historyCard as HTMLElement).getByText('Скасовано')).toBeInTheDocument()
    expect(within(historyCard as HTMLElement).queryAllByRole('button')).toHaveLength(0)
    expect(within(historyCard as HTMLElement).getByRole('link')).toHaveAttribute('href', '/cabinet/sessions/42')
  })

  it('keeps detail and list aligned after a stale confirm rejection from detail', async () => {
    sessionsState = {
      42: buildSession({
        status: 'SCHEDULED',
      }),
    }

    mockedApiPatch.mockImplementation(async (url) => {
      if (url === '/booking/sessions/42/confirm/') {
        throw {
          response: {
            status: 409,
            data: {
              detail: 'Invalid status transition.',
            },
          },
        }
      }

      throw new Error(`Unexpected apiPatch call: ${url}`)
    })

    const { router } = await renderFlow()

    expect(await screen.findByText(/flow@example\.com/)).toBeInTheDocument()

    const listCard = screen.getByText(/flow@example\.com/).closest('article')
    expect(listCard).not.toBeNull()
    expect(within(listCard as HTMLElement).getByRole('button', { name: 'Підтвердити сесію' })).not.toBeDisabled()

    await openSessionFromCard(listCard as HTMLElement, 42)

    await waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/cabinet/sessions/42')
    })

    expect(await screen.findByText(/ID: #77/)).toBeInTheDocument()

    const confirmButton = screen.getByRole('button', { name: 'Підтвердити' })
    await fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/booking/sessions/42/confirm/')
      expect(mockToast.error).toHaveBeenCalledTimes(1)
    })

    expect(confirmButton).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Скасувати' })).not.toBeDisabled()

    const backLink = document.querySelector('a[href="/cabinet/sessions"]') as HTMLAnchorElement | null
    expect(backLink).not.toBeNull()
    await fireEvent.click(backLink as HTMLAnchorElement)

    await waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/cabinet/sessions')
    })

    expect(await screen.findByText(/flow@example\.com/)).toBeInTheDocument()

    const reloadedListCard = screen.getByText(/flow@example\.com/).closest('article')
    expect(reloadedListCard).not.toBeNull()
    expect(within(reloadedListCard as HTMLElement).getByRole('button', { name: 'Підтвердити сесію' })).not.toBeDisabled()
    expect(within(reloadedListCard as HTMLElement).getByRole('button', { name: 'Скасувати' })).not.toBeDisabled()
  })

  it('keeps list and detail aligned after rescheduling from detail suggestions', async () => {
    const initialTime = formatSessionDateTime('2099-06-15T10:00:00Z')
    const rescheduledTime = formatSessionDateTime('2099-06-18T12:00:00Z')
    const { router } = await renderFlow()

    expect(await screen.findByText(/flow@example\.com/)).toBeInTheDocument()

    const listCard = screen.getByText(/flow@example\.com/).closest('article')
    expect(listCard).not.toBeNull()
    expect(within(listCard as HTMLElement).getByText(initialTime)).toBeInTheDocument()

    await openSessionFromCard(listCard as HTMLElement, 42)

    await waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/cabinet/sessions/42')
    })

    expect(await screen.findByText(/ID: #77/)).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Перенести' }))

    const suggestionButton = screen.getByRole('button', {
      name: new RegExp(rescheduledTime.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    })
    await fireEvent.click(suggestionButton)
    await fireEvent.click(screen.getByRole('button', { name: 'Підтвердити перенос' }))

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/booking/sessions/42/reschedule/', {
        slot_id: 301,
      })
      expect(mockToast.success).toHaveBeenCalledWith(BOOKING_SUCCESS_MESSAGES.sessionRescheduled)
    })

    expect(screen.getAllByText(rescheduledTime).length).toBeGreaterThan(0)

    const backLink = document.querySelector('a[href="/cabinet/sessions"]') as HTMLAnchorElement | null
    expect(backLink).not.toBeNull()
    await fireEvent.click(backLink as HTMLAnchorElement)

    await waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/cabinet/sessions')
    })

    expect(await screen.findByText(/flow@example\.com/)).toBeInTheDocument()

    const updatedListCard = screen.getByText(/flow@example\.com/).closest('article')
    expect(updatedListCard).not.toBeNull()
    expect(within(updatedListCard as HTMLElement).getAllByText(rescheduledTime).length).toBeGreaterThan(0)
    expect(within(updatedListCard as HTMLElement).getByRole('button', { name: 'Перенести' })).not.toBeDisabled()
  })

  it('keeps detail and list aligned after approving a reschedule request from detail', async () => {
    requestsState = [buildRequest()]

    const { router } = await renderFlow()

    expect(await screen.findByText(/flow@example\.com/)).toBeInTheDocument()
    expect(screen.getByText(/request@example\.com/)).toBeInTheDocument()

    const listCard = screen.getByText(/flow@example\.com/).closest('article')
    expect(listCard).not.toBeNull()
    expect(within(listCard as HTMLElement).getByText('Є запит на перенос')).toBeInTheDocument()

    await openSessionFromCard(listCard as HTMLElement, 42)

    await waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/cabinet/sessions/42')
    })

    expect(await screen.findByText(/request@example\.com/)).toBeInTheDocument()

    const requestCard = screen.getByText(/request@example\.com/).closest('article')
    expect(requestCard).not.toBeNull()
    await fireEvent.click(within(requestCard as HTMLElement).getByRole('button', { name: 'Погодити' }))

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/cabinet/sessions/reschedule-requests/15/approve/')
      expect(mockToast.success).toHaveBeenCalledWith(BOOKING_SUCCESS_MESSAGES.rescheduleRequestApproved)
    })

    const updatedDetailRequestCard = screen.getByText(/request@example\.com/).closest('article')
    expect(updatedDetailRequestCard).not.toBeNull()
    expect(within(updatedDetailRequestCard as HTMLElement).getByText('Погоджено')).toBeInTheDocument()
    expect(within(updatedDetailRequestCard as HTMLElement).queryAllByRole('button')).toHaveLength(0)

    const backLink = document.querySelector('a[href="/cabinet/sessions"]') as HTMLAnchorElement | null
    expect(backLink).not.toBeNull()
    await fireEvent.click(backLink as HTMLAnchorElement)

    await waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/cabinet/sessions')
    })

    expect(await screen.findByText(/flow@example\.com/)).toBeInTheDocument()
    expect(screen.getByText(/request@example\.com/)).toBeInTheDocument()

    const refreshedListCard = screen.getByText(/flow@example\.com/).closest('article')
    expect(refreshedListCard).not.toBeNull()
    expect(within(refreshedListCard as HTMLElement).queryByText('Є запит на перенос')).toBeNull()

    const updatedListRequestCard = screen.getByText(/request@example\.com/).closest('article')
    expect(updatedListRequestCard).not.toBeNull()
    expect(within(updatedListRequestCard as HTMLElement).getByText('Погоджено')).toBeInTheDocument()
    expect(within(updatedListRequestCard as HTMLElement).queryByRole('button', { name: 'Погодити' })).toBeNull()
    expect(within(updatedListRequestCard as HTMLElement).queryByRole('button', { name: 'Відхилити' })).toBeNull()
  })

  it('keeps detail and list aligned after declining a reschedule request from detail', async () => {
    requestsState = [
      buildRequest({
        id: 16,
        client_email: 'decline-request@example.com',
      }),
    ]

    const { router } = await renderFlow()

    expect(await screen.findByText(/flow@example\.com/)).toBeInTheDocument()
    expect(screen.getByText(/decline-request@example\.com/)).toBeInTheDocument()

    const listCard = screen.getByText(/flow@example\.com/).closest('article')
    expect(listCard).not.toBeNull()
    expect(within(listCard as HTMLElement).getByText('Є запит на перенос')).toBeInTheDocument()

    await openSessionFromCard(listCard as HTMLElement, 42)

    await waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/cabinet/sessions/42')
    })

    expect(await screen.findByText(/decline-request@example\.com/)).toBeInTheDocument()

    const requestCard = screen.getByText(/decline-request@example\.com/).closest('article')
    expect(requestCard).not.toBeNull()
    await fireEvent.click(within(requestCard as HTMLElement).getByRole('button', { name: 'Відхилити' }))

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/cabinet/sessions/reschedule-requests/16/decline/')
      expect(mockToast.success).toHaveBeenCalledWith(BOOKING_SUCCESS_MESSAGES.rescheduleRequestDeclined)
    })

    const updatedDetailRequestCard = screen.getByText(/decline-request@example\.com/).closest('article')
    expect(updatedDetailRequestCard).not.toBeNull()
    expect(within(updatedDetailRequestCard as HTMLElement).getByText('Відхилено')).toBeInTheDocument()
    expect(within(updatedDetailRequestCard as HTMLElement).queryAllByRole('button')).toHaveLength(0)

    const backLink = document.querySelector('a[href="/cabinet/sessions"]') as HTMLAnchorElement | null
    expect(backLink).not.toBeNull()
    await fireEvent.click(backLink as HTMLAnchorElement)

    await waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/cabinet/sessions')
    })

    expect(await screen.findByText(/flow@example\.com/)).toBeInTheDocument()
    expect(screen.getByText(/decline-request@example\.com/)).toBeInTheDocument()

    const refreshedListCard = screen.getByText(/flow@example\.com/).closest('article')
    expect(refreshedListCard).not.toBeNull()
    expect(within(refreshedListCard as HTMLElement).queryByText('Є запит на перенос')).toBeNull()

    const updatedListRequestCard = screen.getByText(/decline-request@example\.com/).closest('article')
    expect(updatedListRequestCard).not.toBeNull()
    expect(within(updatedListRequestCard as HTMLElement).getByText('Відхилено')).toBeInTheDocument()
    expect(within(updatedListRequestCard as HTMLElement).queryByRole('button', { name: 'Погодити' })).toBeNull()
    expect(within(updatedListRequestCard as HTMLElement).queryByRole('button', { name: 'Відхилити' })).toBeNull()
  })

  it('keeps detail and list aligned after a stale complete rejection from detail', async () => {
    mockedApiPatch.mockImplementation(async (url, payload) => {
      if (url === '/booking/sessions/42/complete/') {
        expect(payload).toEqual({ actual_duration_minutes: 50 })
        throw {
          response: {
            status: 409,
            data: {
              detail: 'Invalid status transition.',
            },
          },
        }
      }

      throw new Error(`Unexpected apiPatch call: ${url}`)
    })

    const { router } = await renderFlow()

    expect(await screen.findByText(/flow@example\.com/)).toBeInTheDocument()

    const listCard = screen.getByText(/flow@example\.com/).closest('article')
    expect(listCard).not.toBeNull()
    expect(within(listCard as HTMLElement).getByRole('button', { name: 'Завершити' })).not.toBeDisabled()

    await openSessionFromCard(listCard as HTMLElement, 42)

    await waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/cabinet/sessions/42')
    })

    expect(await screen.findByText(/ID: #77/)).toBeInTheDocument()
    await openPrivateSessionNote()
    expect(await screen.findByDisplayValue('Initial flow note')).toBeInTheDocument()

    const completionButton = screen.getByRole('button', { name: 'Завершити' })
    await fireEvent.click(completionButton)
    await fireEvent.click(screen.getByTestId('session-completion-submit'))

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/booking/sessions/42/complete/', {
        actual_duration_minutes: 50,
      })
      expect(mockToast.error).toHaveBeenCalledTimes(1)
    })
    expect(completionButton).not.toBeDisabled()
    expect(await screen.findByDisplayValue('Initial flow note')).toBeInTheDocument()

    const backLink = document.querySelector('a[href="/cabinet/sessions"]') as HTMLAnchorElement | null
    expect(backLink).not.toBeNull()
    await fireEvent.click(backLink as HTMLAnchorElement)

    await waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/cabinet/sessions')
    })

    expect(await screen.findByText(/flow@example\.com/)).toBeInTheDocument()

    const reloadedListCard = screen.getByText(/flow@example\.com/).closest('article')
    expect(reloadedListCard).not.toBeNull()
    expect(within(reloadedListCard as HTMLElement).getByRole('button', { name: 'Завершити' })).not.toBeDisabled()
    expect(within(reloadedListCard as HTMLElement).getByRole('button', { name: 'Скасувати' })).not.toBeDisabled()
  })

  it('keeps list and detail aligned after completing a session from detail and navigating back', async () => {
    const { router } = await renderFlow()

    expect(await screen.findByText(/flow@example\.com/)).toBeInTheDocument()
    expect(router.currentRoute.value.path).toBe('/cabinet/sessions')

    const listCard = screen.getByText(/flow@example\.com/).closest('article')
    expect(listCard).not.toBeNull()
    await openSessionFromCard(listCard as HTMLElement, 42)

    await waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/cabinet/sessions/42')
    })

    expect(await screen.findByText(/ID: #77/)).toBeInTheDocument()
    await openPrivateSessionNote()
    expect(await screen.findByDisplayValue('Initial flow note')).toBeInTheDocument()

    const completionButton = screen.getByRole('button', { name: 'Завершити' })
    await fireEvent.click(completionButton)
    await fireEvent.click(screen.getByTestId('session-completion-submit'))

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/booking/sessions/42/complete/', {
        actual_duration_minutes: 50,
      })
    })
    expect(await screen.findByDisplayValue('Completed flow note')).toBeInTheDocument()

    const refreshedStatusPanel = screen.getByText(/ID: #77/).closest('section')
    expect(refreshedStatusPanel).not.toBeNull()
    expect((refreshedStatusPanel as HTMLElement).querySelector('.status-pill--muted')).not.toBeNull()
    const statusActionButtons = within(refreshedStatusPanel as HTMLElement).queryAllByRole('button')
    expect(statusActionButtons).toHaveLength(4)
    expect(statusActionButtons.map((button) => button.textContent?.trim())).toEqual(
      expect.arrayContaining(['Підтвердити', 'Скасувати', 'Перенести', 'Додати на дошку'])
    )

    const backLink = document.querySelector('a[href="/cabinet/sessions"]') as HTMLAnchorElement | null
    expect(backLink).not.toBeNull()
    await fireEvent.click(backLink as HTMLAnchorElement)

    await waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/cabinet/sessions')
    })

    expect(await screen.findByText(/flow@example\.com/)).toBeInTheDocument()

    const historyCard = screen.getByText(/flow@example\.com/).closest('article')
    expect(historyCard).not.toBeNull()
    expect((historyCard as HTMLElement).querySelector('.status-pill--muted')).not.toBeNull()
    expect(within(historyCard as HTMLElement).queryAllByRole('button')).toHaveLength(0)
    expect(within(historyCard as HTMLElement).getByRole('link')).toHaveAttribute('href', '/cabinet/sessions/42')
  })
})
