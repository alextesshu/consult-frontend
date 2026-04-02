import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ExternalSessionsView from './ExternalSessionsView.vue'
import { createExternalSession, fetchExternalSessions } from '../lib/api'

const pushMock = vi.fn()

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRouter: () => ({
      push: pushMock,
    }),
  }
})

const toast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  show: vi.fn(),
}

vi.mock('../composables/useToast', () => ({
  useToast: () => toast,
}))

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    fetchExternalSessions: vi.fn(),
    createExternalSession: vi.fn(),
    getApiErrorMessage: vi.fn((_error: unknown, fallback: string) => fallback),
  }
})

const mockedFetchExternalSessions = vi.mocked(fetchExternalSessions)
const mockedCreateExternalSession = vi.mocked(createExternalSession)

function renderView() {
  return render(ExternalSessionsView, {
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

describe('ExternalSessionsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedFetchExternalSessions.mockResolvedValue([
      {
        id: 8,
        starts_at: '2099-06-15T10:00:00Z',
        ends_at: '2099-06-15T11:00:00Z',
        duration_minutes: 60,
        session_format: 'online',
        meeting_url: 'https://meet.google.com/demo',
        offline_location_snapshot: null,
        guest_name: 'Guest User',
        guest_email: 'guest@example.com',
        status: 'SCHEDULED',
        cancelled_at: null,
        created_at: '2099-06-01T00:00:00Z',
        updated_at: '2099-06-01T00:00:00Z',
      },
    ] as any)
  })

  it('renders only external sessions list surface', async () => {
    renderView()

    expect(await screen.findByText('Ваші external sessions')).toBeInTheDocument()
    const detailLink = await screen.findByRole('link', { name: 'Деталі' })
    expect(screen.getAllByText('External Sessions').length).toBeGreaterThan(0)
    expect(detailLink).toHaveAttribute('href', '/cabinet/external-sessions/8')
    expect(screen.queryByText('Заплановані сесії')).not.toBeInTheDocument()
  })

  it('creates online external session and navigates to detail page', async () => {
    mockedCreateExternalSession.mockResolvedValue({
      id: 31,
      starts_at: '2099-06-16T10:00:00Z',
      ends_at: '2099-06-16T11:00:00Z',
      duration_minutes: 60,
      session_format: 'online',
      meeting_url: 'https://meet.google.com/new-room',
      offline_location_snapshot: null,
      guest_name: 'Guest Name',
      guest_email: 'guest@example.com',
      status: 'SCHEDULED',
      cancelled_at: null,
      created_at: '2099-06-01T00:00:00Z',
      updated_at: '2099-06-01T00:00:00Z',
    } as any)

    renderView()
    await screen.findByText('Нова external session')

    await fireEvent.update(screen.getByLabelText('Початок'), '2099-06-16T12:30')
    await fireEvent.update(screen.getByLabelText('Meeting URL'), 'https://meet.google.com/new-room')
    await fireEvent.update(screen.getByLabelText('Guest name (опційно)'), 'Guest Name')
    await fireEvent.update(screen.getByLabelText('Guest email (опційно)'), 'guest@example.com')
    await fireEvent.click(screen.getByRole('button', { name: 'Створити external session' }))

    await waitFor(() => {
      expect(mockedCreateExternalSession).toHaveBeenCalledTimes(1)
    })

    const payload = mockedCreateExternalSession.mock.calls[0]?.[0]
    expect(payload?.session_format).toBe('online')
    expect(payload?.meeting_url).toBe('https://meet.google.com/new-room')
    expect(payload?.offline_location_snapshot).toBeNull()
    expect(pushMock).toHaveBeenCalledWith('/cabinet/external-sessions/31')
  })

  it('creates offline external session with location payload', async () => {
    mockedCreateExternalSession.mockResolvedValue({
      id: 44,
      starts_at: '2099-06-16T10:00:00Z',
      ends_at: '2099-06-16T11:00:00Z',
      duration_minutes: 60,
      session_format: 'offline',
      meeting_url: null,
      offline_location_snapshot: 'Kyiv office',
      guest_name: null,
      guest_email: null,
      status: 'SCHEDULED',
      cancelled_at: null,
      created_at: '2099-06-01T00:00:00Z',
      updated_at: '2099-06-01T00:00:00Z',
    } as any)

    renderView()
    await screen.findByText('Нова external session')

    await fireEvent.update(screen.getByLabelText('Формат'), 'offline')
    await fireEvent.update(screen.getByLabelText('Початок'), '2099-06-16T12:30')
    await fireEvent.update(screen.getByLabelText('Локація'), 'Kyiv office')
    await fireEvent.click(screen.getByRole('button', { name: 'Створити external session' }))

    await waitFor(() => {
      expect(mockedCreateExternalSession).toHaveBeenCalledTimes(1)
    })

    const payload = mockedCreateExternalSession.mock.calls[0]?.[0]
    expect(payload?.session_format).toBe('offline')
    expect(payload?.meeting_url).toBeNull()
    expect(payload?.offline_location_snapshot).toBe('Kyiv office')
  })
})
