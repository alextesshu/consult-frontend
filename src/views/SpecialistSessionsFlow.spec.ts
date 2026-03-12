import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { createPinia } from 'pinia'
import { apiGet, apiPatch, fetchSpecialistProfile } from '../lib/api'
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

let sessionsState: Record<number, SessionRecord>
let sessionNoteState: Record<number, string>

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

function cloneSession(session: SessionRecord) {
  return {
    ...session,
  }
}

function getSessionById(id: number) {
  const session = sessionsState[id]
  if (!session) {
    throw new Error(`Missing session state for ${id}`)
  }
  return session
}

function getUpcomingSessions() {
  return Object.values(sessionsState)
    .filter((session) => session.status === 'SCHEDULED' || session.status === 'CONFIRMED')
    .map(cloneSession)
}

function getHistorySessions() {
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
        return []
      }

      if (url === '/cabinet/sessions/reschedule-requests/') {
        return []
      }

      if (url === '/booking/sessions/42/reschedule-suggestions/') {
        return { suggestions: [] }
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

      throw new Error(`Unexpected apiPatch call: ${url}`)
    })
  })

  it('keeps list and detail aligned after completing a session from detail and navigating back', async () => {
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('50')

    try {
      const { router } = await renderFlow()

      expect(await screen.findByText(/flow@example\.com/)).toBeInTheDocument()
      expect(router.currentRoute.value.path).toBe('/cabinet/sessions')

      const listCard = screen.getByText(/flow@example\.com/).closest('article')
      expect(listCard).not.toBeNull()
      const detailLink = within(listCard as HTMLElement).getByRole('link')
      await fireEvent.click(detailLink)

      await waitFor(() => {
        expect(router.currentRoute.value.path).toBe('/cabinet/sessions/42')
      })

      expect(await screen.findByText(/ID: #77/)).toBeInTheDocument()
      expect(await screen.findByDisplayValue('Initial flow note')).toBeInTheDocument()

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
      })

      expect(promptSpy).toHaveBeenCalledTimes(1)
      expect(await screen.findByDisplayValue('Completed flow note')).toBeInTheDocument()

      const refreshedStatusPanel = screen.getByText(/ID: #77/).closest('section')
      expect(refreshedStatusPanel).not.toBeNull()
      expect((refreshedStatusPanel as HTMLElement).querySelector('.status-pill--muted')).not.toBeNull()
      expect(within(refreshedStatusPanel as HTMLElement).queryAllByRole('button')).toHaveLength(3)

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
    } finally {
      promptSpy.mockRestore()
    }
  })
})
