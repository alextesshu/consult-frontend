import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PublicGuestBookingTimeProposalView from './PublicGuestBookingTimeProposalView.vue'
import {
  acceptPublicGuestBookingTimeProposal,
  getPublicGuestBookingTimeProposal,
} from '../lib/api'

const routeParams = { token: 'proposal-token' }

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
    getPublicGuestBookingTimeProposal: vi.fn(),
    acceptPublicGuestBookingTimeProposal: vi.fn(),
    getApiErrorMessage: vi.fn((_error: unknown, fallback: string) => fallback),
  }
})

const mockedGetPublicGuestBookingTimeProposal = vi.mocked(getPublicGuestBookingTimeProposal)
const mockedAcceptPublicGuestBookingTimeProposal = vi.mocked(acceptPublicGuestBookingTimeProposal)

function activeProposal(overrides: Record<string, unknown> = {}) {
  return {
    proposal: {
      public_status: 'sent',
      can_accept: true,
      specialist_name: 'Кендо Фам',
      specialist_profile_path: '/s/kendo',
      specialist_profile_url: 'https://proconsult.test/s/kendo',
      session_format: 'online',
      message: 'Оберіть один із варіантів.',
      expires_at: '2099-06-25T10:00:00Z',
      options: [
        {
          id: 501,
          start_at: '2099-06-18T09:00:00Z',
          end_at: '2099-06-18T09:50:00Z',
          timezone: 'Europe/Kyiv',
          status: 'offered',
        },
      ],
      ...overrides,
    },
  }
}

function renderView() {
  return render(PublicGuestBookingTimeProposalView)
}

describe('PublicGuestBookingTimeProposalView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeParams.token = 'proposal-token'
    mockedGetPublicGuestBookingTimeProposal.mockResolvedValue(activeProposal() as any)
    mockedAcceptPublicGuestBookingTimeProposal.mockResolvedValue({
      proposal: {
        ...activeProposal().proposal,
        public_status: 'accepted',
        can_accept: false,
      },
      selected_option: {
        id: 501,
        status: 'accepted',
      },
      request: {
        status: 'approved',
        session_id: 701,
      },
      session: {
        id: 701,
        starts_at: '2099-06-18T09:00:00Z',
        ends_at: '2099-06-18T09:50:00Z',
        timezone: 'Europe/Kyiv',
        session_format: 'online',
        meeting_url: 'https://meet.example.com/accepted',
        offline_location_snapshot: '',
      },
    } as any)
  })

  it('loads token detail and renders active proposal options', async () => {
    renderView()

    expect(await screen.findByText('Оберіть зручний час')).toBeInTheDocument()
    expect(screen.getByText('Кендо Фам')).toBeInTheDocument()
    expect(screen.getByText('Оберіть один із варіантів.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Обрати цей час' })).toBeInTheDocument()
    expect(mockedGetPublicGuestBookingTimeProposal).toHaveBeenCalledWith('proposal-token')
  })

  it('accepts selected option and shows success state', async () => {
    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Обрати цей час' }))

    await waitFor(() => {
      expect(mockedAcceptPublicGuestBookingTimeProposal).toHaveBeenCalledWith('proposal-token', 501)
    })
    expect(await screen.findByText('Час підтверджено')).toBeInTheDocument()
    expect(screen.getByText('https://meet.example.com/accepted')).toBeInTheDocument()
  })

  it('renders expired state', async () => {
    mockedGetPublicGuestBookingTimeProposal.mockResolvedValue(
      activeProposal({ public_status: 'expired', can_accept: false }) as any
    )

    renderView()

    expect(await screen.findByText('Посилання більше неактивне')).toBeInTheDocument()
  })

  it('renders accepted state without accept action', async () => {
    mockedGetPublicGuestBookingTimeProposal.mockResolvedValue(
      activeProposal({ public_status: 'accepted', can_accept: false }) as any
    )

    renderView()

    expect(await screen.findByText('Час уже підтверджено')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Обрати цей час' })).not.toBeInTheDocument()
  })

  it('renders cancelled state', async () => {
    mockedGetPublicGuestBookingTimeProposal.mockResolvedValue(
      activeProposal({ public_status: 'cancelled', can_accept: false }) as any
    )

    renderView()

    expect(await screen.findByText('Пропозицію скасовано')).toBeInTheDocument()
  })

  it('renders closed state', async () => {
    mockedGetPublicGuestBookingTimeProposal.mockResolvedValue(
      activeProposal({ public_status: 'closed', can_accept: false }) as any
    )

    renderView()

    expect(await screen.findByText('Запит уже закрито')).toBeInTheDocument()
  })

  it('shows safe unavailable error on accept conflict', async () => {
    mockedAcceptPublicGuestBookingTimeProposal.mockRejectedValueOnce({
      response: {
        data: {
          code: 'PROPOSED_SLOT_UNAVAILABLE',
        },
      },
    })

    renderView()
    await fireEvent.click(await screen.findByRole('button', { name: 'Обрати цей час' }))

    expect(
      await screen.findByText('Цей час уже недоступний. Оновіть сторінку або зв’яжіться зі спеціалістом.')
    ).toBeInTheDocument()
  })
})
