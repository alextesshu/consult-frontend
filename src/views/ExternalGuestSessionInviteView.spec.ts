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
        specialist_name: 'Кендо Фам',
        starts_at: '2099-06-15T10:00:00Z',
        ends_at: '2099-06-15T11:00:00Z',
        session_format: 'online',
        offline_location: null,
        instructions: 'Ваш спеціаліст запросив вас на зовнішню сесію.',
        can_join: true,
      },
    } as any)
  })

  it('renders online resolve state without offline helper text', async () => {
    const { container } = renderView()

    expect(await screen.findByText('Кендо Фам')).toBeInTheDocument()
    expect(container.textContent).toContain('Спеціаліст:')
    expect(container.textContent).toContain('Початок:')
    expect(container.textContent).toContain('Завершення:')
    expect(container.textContent).toContain('Формат:')
    expect(container.textContent).toContain('Онлайн')
    expect(container.textContent).not.toContain('Це офлайн-зустріч')
    expect(container.textContent).not.toContain('Локація:')
  })

  it('renders offline resolve state with offline helper and location', async () => {
    mockedFetchPublicExternalSessionInvite.mockResolvedValue({
      guest_session: {
        status: 'ACTIVE',
        specialist_name: 'Кендо Фам',
        starts_at: '2099-06-15T10:00:00Z',
        ends_at: '2099-06-15T11:00:00Z',
        session_format: 'offline',
        offline_location: 'Київ, офіс 12',
        instructions: 'Офлайн сесія.',
        can_join: true,
      },
    } as any)

    const { container } = renderView()
    expect(await screen.findByText('Кендо Фам')).toBeInTheDocument()

    expect(container.textContent).toContain('Формат:')
    expect(container.textContent).toContain('Офлайн')
    expect(container.textContent).toContain('Локація:')
    expect(container.textContent).toContain('Київ, офіс 12')
    expect(container.textContent).toContain('Це офлайн-зустріч')
  })

  it('opens online meeting URL in a new tab and does not replace current page', async () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)
    mockedJoinPublicExternalSessionInvite.mockResolvedValue({
      status: 'JOINED',
      session_format: 'online',
      meeting_url: 'https://meet.google.com/external-room',
      offline_location_snapshot: null,
    } as any)

    renderView()
    const joinButton = await screen.findByRole('button', { name: 'Приєднатися до сесії' })
    await fireEvent.click(joinButton)

    await waitFor(() => {
      expect(mockedJoinPublicExternalSessionInvite).toHaveBeenCalledWith('valid-token')
      expect(openSpy).toHaveBeenCalledWith(
        'https://meet.google.com/external-room',
        '_blank',
        'noopener,noreferrer'
      )
    })
  })

  it('does not force offline helper for online session when optional fields are missing and keeps can_join mapping', async () => {
    mockedFetchPublicExternalSessionInvite.mockResolvedValue({
      guest_session: {
        status: 'ACTIVE',
        specialist_name: 'Кендо Фам',
        starts_at: '2099-06-15T10:00:00Z',
        ends_at: null,
        session_format: 'online',
        offline_location: null,
        instructions: null,
        can_join: false,
      },
    } as any)

    const { container } = renderView()
    const joinButton = await screen.findByRole('button', { name: 'Приєднатися до сесії' })

    expect(joinButton).toBeDisabled()
    expect(container.textContent).toContain('Онлайн')
    expect(container.textContent).not.toContain('Це офлайн-зустріч')
    expect(container.textContent).not.toContain('Локація:')
  })
})
