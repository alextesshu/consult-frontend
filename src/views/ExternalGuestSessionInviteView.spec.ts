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
      status: 'ACTIVE',
      specialist_name: 'Specialist User',
      starts_at: '2099-06-15T10:00:00Z',
      ends_at: '2099-06-15T11:00:00Z',
      session_format: 'online',
      offline_location_snapshot: null,
    } as any)
  })

  it('renders public resolve state without auth-only UI dependencies', async () => {
    renderView()

    expect(await screen.findByText(/Specialist:/)).toBeInTheDocument()
    expect(screen.getByText(/Specialist User/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Приєднатися до сесії/i })).toBeInTheDocument()
  })

  it('joins online invite via public join endpoint', async () => {
    mockedJoinPublicExternalSessionInvite.mockResolvedValue({
      status: 'JOINED',
      session_format: 'online',
      meeting_url: 'https://meet.google.com/external-room',
      offline_location_snapshot: null,
    } as any)

    renderView()
    await screen.findByRole('button', { name: /Приєднатися до сесії/i })

    await fireEvent.click(screen.getByRole('button', { name: /Приєднатися до сесії/i }))

    await waitFor(() => {
      expect(mockedJoinPublicExternalSessionInvite).toHaveBeenCalledWith('valid-token')
    })
    expect(screen.queryByText('Це офлайн-зустріч. Приходьте у погоджений час за вказаною локацією.')).not.toBeInTheDocument()
  })

  it('renders offline info state after join for offline session', async () => {
    mockedFetchPublicExternalSessionInvite.mockResolvedValue({
      status: 'ACTIVE',
      specialist_name: 'Specialist User',
      starts_at: '2099-06-15T10:00:00Z',
      ends_at: '2099-06-15T11:00:00Z',
      session_format: 'offline',
      offline_location_snapshot: 'Kyiv office',
    } as any)
    mockedJoinPublicExternalSessionInvite.mockResolvedValue({
      status: 'JOINED',
      session_format: 'offline',
      meeting_url: null,
      offline_location_snapshot: 'Kyiv office',
    } as any)

    renderView()
    await screen.findByText('Локація:')
    await fireEvent.click(screen.getByRole('button', { name: 'Переглянути деталі зустрічі' }))

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
