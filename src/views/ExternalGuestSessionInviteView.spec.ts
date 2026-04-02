import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ExternalGuestSessionInviteView from './ExternalGuestSessionInviteView.vue'
import { fetchPublicExternalSessionInvite, joinPublicExternalSessionInvite } from '../lib/api'

const routeParams = { token: 'valid-token' }

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRoute: () => ({
      params: routeParams,
    }),
  }
})

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    fetchPublicExternalSessionInvite: vi.fn(),
    joinPublicExternalSessionInvite: vi.fn(),
    getApiErrorMessage: vi.fn((_error: unknown, fallback: string) => fallback),
  }
})

const mockedFetchPublicExternalSessionInvite = vi.mocked(fetchPublicExternalSessionInvite)
const mockedJoinPublicExternalSessionInvite = vi.mocked(joinPublicExternalSessionInvite)

function renderView() {
  return render(ExternalGuestSessionInviteView)
}

describe('ExternalGuestSessionInviteView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeParams.token = 'valid-token'
    mockedFetchPublicExternalSessionInvite.mockResolvedValue({
      guest_session: {
        status: 'ACTIVE',
        specialist_name: 'Specialist User',
        starts_at: '2099-06-15T10:00:00Z',
        ends_at: '2099-06-15T11:00:00Z',
        session_format: 'online',
        offline_location: null,
        instructions: 'Custom instruction',
        can_join: true,
      },
    } as any)
  })

  it('maps guest_session payload for online state and does not render offline helper text', async () => {
    const { container } = renderView()

    expect(await screen.findByText(/Specialist User/)).toBeInTheDocument()
    expect(container.textContent).toContain('Custom instruction')
    expect(container.textContent).toContain('Спеціаліст:')
    expect(container.textContent).toContain('Початок:')
    expect(container.textContent).toContain('Формат:')
    expect(container.textContent).toContain('Онлайн')
    expect(container.textContent).not.toContain('Це офлайн-зустріч')
  })

  it('joins online invite via public join endpoint', async () => {
    mockedJoinPublicExternalSessionInvite.mockResolvedValue({
      status: 'JOINED',
      session_format: 'online',
      meeting_url: 'https://meet.google.com/external-room',
      offline_location_snapshot: null,
    } as any)

    const { container } = renderView()
    await screen.findByText(/Specialist User/)

    const joinButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('Приєднатися до сесії')
    )
    if (!joinButton) {
      throw new Error('Join button is missing')
    }
    await fireEvent.click(joinButton)

    await waitFor(() => {
      expect(mockedJoinPublicExternalSessionInvite).toHaveBeenCalledWith('valid-token')
    })
    expect(container.textContent).not.toContain('Це офлайн-зустріч')
  })

  it('renders offline details from guest_session payload and shows offline helper only after join', async () => {
    mockedFetchPublicExternalSessionInvite.mockResolvedValue({
      guest_session: {
        status: 'ACTIVE',
        specialist_name: 'Specialist User',
        starts_at: '2099-06-15T10:00:00Z',
        ends_at: '2099-06-15T11:00:00Z',
        session_format: 'offline',
        offline_location: 'Kyiv office',
        instructions: 'Offline instruction',
        can_join: true,
      },
    } as any)
    mockedJoinPublicExternalSessionInvite.mockResolvedValue({
      status: 'JOINED',
      session_format: 'offline',
      meeting_url: null,
      offline_location_snapshot: 'Kyiv office',
    } as any)

    const { container } = renderView()
    await screen.findByText(/Specialist User/)

    expect(container.textContent).toContain('Формат:')
    expect(container.textContent).toContain('Офлайн')
    expect(container.textContent).toContain('Локація:')
    expect(container.textContent).toContain('Kyiv office')
    expect(container.textContent).not.toContain('Це офлайн-зустріч')

    const offlineButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('Переглянути деталі зустрічі')
    )
    if (!offlineButton) {
      throw new Error('Offline details button is missing')
    }
    await fireEvent.click(offlineButton)

    expect(await screen.findByText('Це офлайн-зустріч. Приходьте у погоджений час за вказаною локацією.')).toBeInTheDocument()
  })

  it('handles invalid/expired/revoked/unavailable states from backend code', async () => {
    mockedFetchPublicExternalSessionInvite.mockRejectedValueOnce({
      response: { status: 404, data: { code: 'EXTERNAL_GUEST_INVITE_INVALID' } },
    })
    renderView()
    expect(await screen.findByText('Лінк недійсний')).toBeInTheDocument()

    mockedFetchPublicExternalSessionInvite.mockRejectedValueOnce({
      response: { status: 410, data: { code: 'EXTERNAL_GUEST_INVITE_EXPIRED' } },
    })
    renderView()
    expect(await screen.findByText('Термін дії лінка завершився')).toBeInTheDocument()

    mockedFetchPublicExternalSessionInvite.mockRejectedValueOnce({
      response: { status: 403, data: { code: 'EXTERNAL_GUEST_INVITE_REVOKED' } },
    })
    renderView()
    expect(await screen.findByText('Лінк відкликано')).toBeInTheDocument()

    mockedFetchPublicExternalSessionInvite.mockRejectedValueOnce({
      response: { status: 409, data: { code: 'EXTERNAL_SESSION_UNAVAILABLE' } },
    })
    renderView()
    expect(await screen.findByText('Сесія недоступна')).toBeInTheDocument()
  })
})
