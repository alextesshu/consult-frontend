import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchPublicGuestSessionInvite,
  joinPublicGuestSessionInvite,
} from '../lib/api'
import GuestSessionInviteView from './GuestSessionInviteView.vue'

const mockRoute = {
  params: {
    token: 'guest-token',
  },
}

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRoute: () => mockRoute,
  }
})

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    fetchPublicGuestSessionInvite: vi.fn(),
    joinPublicGuestSessionInvite: vi.fn(),
  }
})

const mockedFetchPublicGuestSessionInvite = vi.mocked(fetchPublicGuestSessionInvite)
const mockedJoinPublicGuestSessionInvite = vi.mocked(joinPublicGuestSessionInvite)

function renderView() {
  return render(GuestSessionInviteView)
}

describe('GuestSessionInviteView', () => {
  beforeEach(() => {
    mockRoute.params.token = 'guest-token'
    mockedFetchPublicGuestSessionInvite.mockReset()
    mockedJoinPublicGuestSessionInvite.mockReset()
  })

  it('renders public guest page for valid online invite and joins via meeting link', async () => {
    mockedFetchPublicGuestSessionInvite.mockResolvedValue({
      status: 'ACTIVE',
      specialist_name: 'Dr. Ivanna',
      slot_start_at: '2099-06-15T10:00:00Z',
      slot_end_at: '2099-06-15T11:00:00Z',
      session_format: 'online',
      offline_location: null,
    })
    mockedJoinPublicGuestSessionInvite.mockResolvedValue({
      status: 'JOINED',
      session_format: 'online',
      meeting_url: 'https://meet.google.com/guest-room',
      offline_location: null,
    })

    renderView()

    expect(await screen.findByText(/Dr. Ivanna/)).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Приєднатися до сесії' }))

    await waitFor(() => {
      expect(mockedJoinPublicGuestSessionInvite).toHaveBeenCalledWith('guest-token')
    })
  })

  it('renders offline invite details without online join UI', async () => {
    mockedFetchPublicGuestSessionInvite.mockResolvedValue({
      status: 'ACTIVE',
      specialist_name: 'Dr. Oksana',
      slot_start_at: '2099-06-15T10:00:00Z',
      slot_end_at: '2099-06-15T11:00:00Z',
      session_format: 'offline',
      offline_location: 'Київ, вул. Хрещатик, 1',
    })
    mockedJoinPublicGuestSessionInvite.mockResolvedValue({
      status: 'JOINED',
      session_format: 'offline',
      meeting_url: null,
      offline_location: 'Київ, вул. Хрещатик, 1',
    })

    renderView()

    expect(await screen.findByText('Формат:')).toBeInTheDocument()
    expect(screen.getByText('Офлайн')).toBeInTheDocument()
    expect(screen.getByText(/Київ, вул\. Хрещатик, 1/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Приєднатися до сесії' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Переглянути деталі зустрічі' })).toBeInTheDocument()
  })

  it('shows safe invalid-token state', async () => {
    mockedFetchPublicGuestSessionInvite.mockRejectedValue({
      response: { status: 404, data: { code: 'INVITE_NOT_FOUND' } },
    })

    renderView()

    expect(await screen.findByText('Лінк недійсний')).toBeInTheDocument()
  })

  it('shows revoked state for revoked invite', async () => {
    mockedFetchPublicGuestSessionInvite.mockRejectedValue({
      response: { status: 403, data: { code: 'INVITE_REVOKED' } },
    })

    renderView()

    expect(await screen.findByText('Лінк відкликано')).toBeInTheDocument()
  })
})


