import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ExternalSessionsView from './ExternalSessionsView.vue'
import {
  apiGet,
  approveCabinetGuestBookingRequest,
  confirmCabinetGuestBookingRequestSession,
  createCabinetGuestBookingTimeProposal,
  createExternalSession,
  createExternalSessionInvite,
  createSessionFromCabinetGuestBookingRequest,
  declineCabinetGuestBookingRequest,
  fetchCabinetGuestBookingRequests,
  fetchExternalSessions,
  fetchSpecialistProfile,
  getApiErrorMessage,
} from '../lib/api'

const pushMock = vi.fn()
const mockRoute = {
  query: {} as Record<string, unknown>,
  hash: '',
}

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRoute: () => mockRoute,
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
    apiGet: vi.fn(),
    approveCabinetGuestBookingRequest: vi.fn(),
    confirmCabinetGuestBookingRequestSession: vi.fn(),
    createCabinetGuestBookingTimeProposal: vi.fn(),
    fetchExternalSessions: vi.fn(),
    createExternalSessionInvite: vi.fn(),
    fetchCabinetGuestBookingRequests: vi.fn(),
    createExternalSession: vi.fn(),
    declineCabinetGuestBookingRequest: vi.fn(),
    createSessionFromCabinetGuestBookingRequest: vi.fn(),
    fetchSpecialistProfile: vi.fn(),
    getApiErrorMessage: vi.fn((_error: unknown, fallback: string) => fallback),
  }
})

const mockedApproveCabinetGuestBookingRequest = vi.mocked(approveCabinetGuestBookingRequest)
const mockedConfirmCabinetGuestBookingRequestSession = vi.mocked(confirmCabinetGuestBookingRequestSession)
const mockedCreateCabinetGuestBookingTimeProposal = vi.mocked(createCabinetGuestBookingTimeProposal)
const mockedApiGet = vi.mocked(apiGet)
const mockedFetchExternalSessions = vi.mocked(fetchExternalSessions)
const mockedFetchCabinetGuestBookingRequests = vi.mocked(fetchCabinetGuestBookingRequests)
const mockedCreateExternalSession = vi.mocked(createExternalSession)
const mockedCreateExternalSessionInvite = vi.mocked(createExternalSessionInvite)
const mockedDeclineCabinetGuestBookingRequest = vi.mocked(declineCabinetGuestBookingRequest)
const mockedCreateSessionFromCabinetGuestBookingRequest = vi.mocked(createSessionFromCabinetGuestBookingRequest)
const mockedFetchSpecialistProfile = vi.mocked(fetchSpecialistProfile)
const mockedGetApiErrorMessage = vi.mocked(getApiErrorMessage)

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function getGuestRequestCardByName(guestName: string) {
  const title = screen.getByText(guestName)
  const card = title.closest('.request-card')
  if (!card) {
    throw new Error(`Guest request card not found for ${guestName}`)
  }

  const scoped = within(card as HTMLElement)
  const approveButton = scoped.queryByRole('button', { name: 'Погодити' }) as HTMLButtonElement | null
  const declineButton = scoped.queryByRole('button', { name: 'Відхилити запит' }) as HTMLButtonElement | null
  if (!approveButton || !declineButton) {
    throw new Error(`Expected approve/decline buttons for ${guestName}`)
  }

  return {
    card,
    approveButton,
    declineButton,
    meetingInput: card.querySelector('input[type="url"]') as HTMLInputElement | null,
  }
}

function getGuestRequestCardByText(text: string) {
  const card = screen
    .getAllByText(text)
    .map((node) => node.closest('.request-card'))
    .find((candidate) => candidate)
  if (!card) {
    throw new Error(`Guest request card not found for ${text}`)
  }
  return card
}

function buildGuestRequest(overrides: Record<string, unknown>) {
  return {
    id: 51,
    status: 'pending',
    specialist_id: 10,
    slot_id: 301,
    has_slot: true,
    is_slotless_request: false,
    slot: null,
    requested_slot_start: '2099-06-17T13:00:00Z',
    requested_slot_end: '2099-06-17T13:50:00Z',
    duration_minutes: 50,
    session_format: 'online',
    offline_location_snapshot: '',
    client_name: null,
    client_email: null,
    client_phone: null,
    guest_name: 'Guest',
    contact_channel: 'email',
    contact_value: 'guest@example.com',
    request_topics: [],
    message: 'Please confirm',
    source: 'public_profile',
    public_profile_slug_snapshot: 'slug',
    slot_snapshot_timezone: 'Europe/Kyiv',
    approved_at: null,
    declined_at: null,
    cancelled_at: null,
    decline_reason: '',
    external_session_id: null,
    session_id: null,
    created_at: '2099-06-16T10:00:00Z',
    updated_at: '2099-06-16T10:00:00Z',
    ...overrides,
  }
}

function buildTimeProposalResponse(overrides: Record<string, unknown> = {}) {
  return {
    proposal: {
      id: 77,
      request_id: 51,
      status: 'sent',
      expires_at: '2099-06-25T10:00:00Z',
      message: '',
      session_format: 'online',
      meeting_url: 'https://meet.example.com/proposal',
      offline_location_snapshot: '',
      accepted_at: null,
      cancelled_at: null,
      options_count: 1,
      options: [
        {
          id: 501,
          slot_id: 901,
          start_at: '2099-06-18T09:00:00Z',
          end_at: '2099-06-18T09:50:00Z',
          timezone: 'Europe/Kyiv',
          status: 'offered',
          sort_order: 0,
        },
      ],
      created_at: '2099-06-16T10:00:00Z',
      updated_at: '2099-06-16T10:00:00Z',
      proposal_url: 'https://proconsult.test/guest/booking-time-proposal/proposal-token',
      ...overrides,
    },
  }
}

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
    mockRoute.query = {}
    mockRoute.hash = ''
    Element.prototype.scrollIntoView = vi.fn()
    mockedApproveCabinetGuestBookingRequest.mockResolvedValue({
      request: {
        id: 51,
        status: 'approved',
        specialist_id: 10,
        slot_id: 301,
        requested_slot_start: '2099-06-17T13:00:00Z',
        requested_slot_end: '2099-06-17T13:50:00Z',
        duration_minutes: 50,
        session_format: 'online',
        offline_location_snapshot: '',
        guest_name: 'Guest One',
        contact_channel: 'email',
        contact_value: 'guest.one@example.com',
        message: 'Please confirm',
        source: 'public_profile',
        public_profile_slug_snapshot: 'slug',
        slot_snapshot_timezone: 'Europe/Kyiv',
        approved_at: '2099-06-16T11:00:00Z',
        declined_at: null,
        cancelled_at: null,
        decline_reason: '',
        external_session_id: 88,
        created_at: '2099-06-16T10:00:00Z',
        updated_at: '2099-06-16T11:00:00Z',
      },
      external_session: null,
      invite: null,
    } as any)
    mockedConfirmCabinetGuestBookingRequestSession.mockResolvedValue({
      request: buildGuestRequest({
        id: 51,
        status: 'approved',
        session_id: 701,
        external_session_id: null,
        approved_at: '2099-06-16T11:00:00Z',
      }),
      session: {
        id: 701,
      },
    } as any)
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
    mockedApiGet.mockImplementation(async (path: string) => {
      if (path === '/cabinet/slots/') {
        return [
          {
            id: 901,
            start_at: '2099-06-18T09:00:00Z',
            end_at: '2099-06-18T09:50:00Z',
            is_booked: false,
          },
          {
            id: 902,
            start_at: '2099-06-19T10:00:00Z',
            end_at: '2099-06-19T10:50:00Z',
            is_booked: false,
          },
          {
            id: 903,
            start_at: '2099-06-20T11:00:00Z',
            end_at: '2099-06-20T11:50:00Z',
            is_booked: false,
            status: 'unavailable',
          },
          {
            id: 301,
            start_at: '2099-06-17T13:00:00Z',
            end_at: '2099-06-17T13:50:00Z',
            is_booked: true,
          },
        ] as any
      }
      return {
        guest_sessions_enabled: true,
        guest_sessions_used_in_period: 1,
        guest_sessions_limit_per_period: 5,
        guest_sessions_period_days: 30,
        guest_sessions_remaining: 4,
        guest_sessions_next_available_at: '2099-06-20',
        guest_sessions_quota: {
          used: 1,
          limit: 5,
          remaining: 4,
          window_days: 30,
          next_available_at: '2099-06-20',
        },
      } as any
    })
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([])
    mockedCreateCabinetGuestBookingTimeProposal.mockResolvedValue({
      proposal: {
        id: 77,
        request_id: 51,
        status: 'sent',
        expires_at: '2099-06-25T10:00:00Z',
        message: '',
        session_format: 'online',
        meeting_url: 'https://meet.example.com/proposal',
        offline_location_snapshot: '',
        accepted_at: null,
        cancelled_at: null,
        options_count: 1,
        options: [
          {
            id: 501,
            slot_id: 901,
            start_at: '2099-06-18T09:00:00Z',
            end_at: '2099-06-18T09:50:00Z',
            timezone: 'Europe/Kyiv',
            status: 'offered',
            sort_order: 0,
          },
        ],
        created_at: '2099-06-16T10:00:00Z',
        updated_at: '2099-06-16T10:00:00Z',
        proposal_url: 'https://proconsult.test/guest/booking-time-proposal/proposal-token',
      },
    } as any)
    mockedCreateExternalSession.mockReset()
    mockedCreateExternalSessionInvite.mockResolvedValue({
      invite: {
        id: 99,
        external_session_id: 31,
        status: 'ACTIVE',
        expires_at: '2099-06-16T10:00:00Z',
        opened_at: null,
        last_opened_at: null,
        joined_at: null,
        created_at: null,
        updated_at: null,
      },
      invite_url: 'https://proconsult.space/guest/external-session/test-token',
    } as any)
    mockedDeclineCabinetGuestBookingRequest.mockResolvedValue({
      id: 51,
      status: 'declined',
    } as any)
    mockedCreateSessionFromCabinetGuestBookingRequest.mockResolvedValue({
      request: buildGuestRequest({
        id: 51,
        status: 'approved',
        slot_id: null,
        has_slot: false,
        is_slotless_request: true,
        session_id: 701,
      }),
      session: {
        id: 701,
      },
    } as any)
    mockedFetchSpecialistProfile.mockResolvedValue({
      standard_session_duration_minutes: 50,
      timezone: 'Europe/Kyiv',
    } as any)
  })

  it('renders external sessions list and empty guest requests state', async () => {
    const { container } = renderView()

    const createPanelTitle = await screen.findByText('Нова сесія без реєстрації')
    expect(await screen.findByText('Ваші сесії без реєстрації')).toBeInTheDocument()
    expect(await screen.findByText('Запитів без реєстрації поки немає.')).toBeInTheDocument()

    const panelTitles = Array.from(container.querySelectorAll('.panel__title')).map((node) => node.textContent?.trim())
    expect(panelTitles).toEqual(['Нова сесія без реєстрації', 'Ваші сесії без реєстрації', 'Запити без реєстрації'])
    expect(createPanelTitle).toBeInTheDocument()

    const detailLink = await screen.findByRole('link', { name: 'Деталі' })
    expect(container.querySelector('input[type="datetime-local"]')).not.toBeInTheDocument()
    expect(container.querySelector('input[type="date"]')).toBeInTheDocument()
    const timeInput = container.querySelector('input[inputmode="numeric"]')
    expect(timeInput).toBeInTheDocument()
    expect(screen.getByText('Вартість сесії, грн')).toBeInTheDocument()
    expect(screen.queryByText('Валюта')).not.toBeInTheDocument()
    expect(container.querySelector('input[placeholder="UAH"]')).not.toBeInTheDocument()
    expect(container.querySelector('.external-price-currency__value')).not.toBeInTheDocument()
    expect(timeInput).toHaveAttribute('list', 'external-session-time-options')
    const options = Array.from(container.querySelectorAll('datalist#external-session-time-options option')).map((item) =>
      item.getAttribute('value')
    )
    expect(options[0]).toBe('00:00')
    expect(options[1]).toBe('00:15')
    expect(options[95]).toBe('23:45')
    expect(screen.getByRole('heading', { name: 'Запити та сесії без реєстрації' })).toBeInTheDocument()
    expect(detailLink).toHaveAttribute('href', '/cabinet/external-sessions/8')
    expect(container.querySelector('.external-sessions')).not.toHaveClass('external-sessions--requests-first')
    expect(container.querySelector('#guest-requests')).toBeInTheDocument()
  })

  it('prioritizes guest requests section when a pending slot-less request exists', async () => {
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 61,
        slot_id: null,
        has_slot: false,
        is_slotless_request: true,
        requested_slot_start: null,
        requested_slot_end: null,
        client_name: 'Slotless Guest',
        client_email: 'slotless@example.com',
        request_topics: ['anxiety', 'relationships'],
      }),
    ] as any)

    const { container } = renderView()

    await screen.findByText('Запит без обраного часу')

    const page = container.querySelector('.external-sessions')
    const guestRequestsPanel = container.querySelector('#guest-requests')
    const createPanel = screen.getByText('Нова сесія без реєстрації').closest('.panel')

    expect(page).toHaveClass('external-sessions--requests-first')
    expect(guestRequestsPanel).toHaveClass('external-sessions__guest-requests-panel')
    expect(createPanel).toHaveClass('external-sessions__create-panel')
    expect(guestRequestsPanel).toHaveTextContent('Запит без обраного часу')
    expect(guestRequestsPanel).not.toHaveTextContent('Клієнт залишив запит без підтвердженого часу.')
    expect(guestRequestsPanel).toHaveTextContent('Тривога')
    expect(guestRequestsPanel).toHaveTextContent('Стосунки')
    expect(within(guestRequestsPanel as HTMLElement).getByRole('button', { name: 'Показати деталі' })).toBeInTheDocument()
    expect(within(guestRequestsPanel as HTMLElement).getByRole('button', { name: 'Створити сесію' })).toBeInTheDocument()
    expect(within(guestRequestsPanel as HTMLElement).getByRole('link', { name: 'Обрати час у календарі' })).toHaveAttribute(
      'href',
      '/cabinet/slots?request_id=61&client_name=Slotless+Guest&contact=guest%40example.com&format=online&source=public_guest_request'
    )
    expect(within(guestRequestsPanel as HTMLElement).getByRole('button', { name: 'Відхилити запит' })).toBeInTheDocument()
  })

  it('shows consultation offer type in guest request details when API provides it', async () => {
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 62,
        guest_name: 'Couple Guest',
        offer_type: 'couple',
      }),
    ] as any)

    renderView()

    const card = await screen.findByText('Couple Guest').then((node) => node.closest('.request-card') as HTMLElement)
    expect(card).toHaveTextContent('Тип консультації: Парна консультація')

    await fireEvent.click(within(card).getByRole('button', { name: 'Показати деталі' }))

    expect(card).toHaveTextContent('Тип консультації: Парна консультація')
  })

  it('shows guest quota summary when entitlements are available', async () => {
    renderView()

    expect(await screen.findByText('Сесії без реєстрації: 1 з 5 за останні 30 днів')).toBeInTheDocument()
    expect(
      await screen.findByText('Доступно ще 4. Найближче оновлення ліміту: 20.06.2099.'),
    ).toBeInTheDocument()
    expect(mockedApiGet).toHaveBeenCalledWith('/cabinet/entitlements/')
  })

  it('falls back safely when guest quota renewal date is missing', async () => {
    mockedApiGet.mockResolvedValueOnce({
      guest_sessions_enabled: true,
      guest_sessions_used_in_period: 1,
      guest_sessions_limit_per_period: 5,
      guest_sessions_period_days: 30,
      guest_sessions_remaining: 4,
      guest_sessions_next_available_at: null,
      guest_sessions_quota: {
        used: 1,
        limit: 5,
        remaining: 4,
        window_days: 30,
        next_available_at: null,
      },
    } as any)

    renderView()

    expect(await screen.findByText('Сесії без реєстрації: 1 з 5 за останні 30 днів')).toBeInTheDocument()
    expect(screen.getByText('Доступно ще 4.')).toBeInTheDocument()
    expect(screen.queryByText(/Найближче оновлення ліміту/)).not.toBeInTheDocument()
  })

  it('disables create button and shows exhausted quota message when quota is exhausted', async () => {
    mockedApiGet.mockResolvedValueOnce({
      guest_sessions_enabled: true,
      guest_sessions_used_in_period: 5,
      guest_sessions_limit_per_period: 5,
      guest_sessions_period_days: 30,
      guest_sessions_remaining: 0,
      guest_sessions_next_available_at: '2099-06-20',
      guest_sessions_quota: {
        used: 5,
        limit: 5,
        remaining: 0,
        window_days: 30,
        next_available_at: '2099-06-20',
      },
    } as any)

    renderView()

    expect(await screen.findByText('Сесії без реєстрації: 5 з 5 за останні 30 днів')).toBeInTheDocument()
    expect(await screen.findByText('Ліміт вичерпано. Наступне місце звільниться 20.06.2099.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Створити сесію без реєстрації' })).toBeDisabled()
    expect(screen.getByRole('link', { name: 'Перейти до тарифів' })).toHaveAttribute('href', '/cabinet/billing')
  })

  it('handles GUEST_SESSIONS_LIMIT_REACHED from backend create response', async () => {
    mockedCreateExternalSession.mockRejectedValueOnce({
      response: { data: { code: 'GUEST_SESSIONS_LIMIT_REACHED' } },
    })

    const { container } = renderView()
    await screen.findByText('Сесії без реєстрації: 1 з 5 за останні 30 днів')

    const dateInput = container.querySelector('input[type="date"]')
    const timeInput = container.querySelector('input[inputmode="numeric"]')
    if (!dateInput || !timeInput) {
      throw new Error('Missing start date/time fields')
    }

    await fireEvent.update(dateInput, '2099-06-16')
    await fireEvent.update(timeInput, '12:30')
    await fireEvent.update(screen.getByLabelText('Посилання на зустріч'), 'https://meet.google.com/quota-limit')
    await fireEvent.click(screen.getByRole('button', { name: 'Створити сесію без реєстрації' }))

    expect(await screen.findByText('Ліміт вичерпано. Наступне місце звільниться 20.06.2099.')).toBeInTheDocument()
  })

  it('handles GUEST_SESSIONS_DISABLED from backend create response', async () => {
    mockedCreateExternalSession.mockRejectedValueOnce({
      response: { data: { code: 'GUEST_SESSIONS_DISABLED' } },
    })

    const { container } = renderView()
    await screen.findByText('Сесії без реєстрації: 1 з 5 за останні 30 днів')

    const dateInput = container.querySelector('input[type="date"]')
    const timeInput = container.querySelector('input[inputmode="numeric"]')
    if (!dateInput || !timeInput) {
      throw new Error('Missing start date/time fields')
    }

    await fireEvent.update(dateInput, '2099-06-16')
    await fireEvent.update(timeInput, '12:30')
    await fireEvent.update(screen.getByLabelText('Посилання на зустріч'), 'https://meet.google.com/quota-disabled')
    await fireEvent.click(screen.getByRole('button', { name: 'Створити сесію без реєстрації' }))

    expect(await screen.findByText('Сесії без реєстрації недоступні на вашому тарифі.')).toBeInTheDocument()
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

    const { container } = renderView()
    await screen.findByText('Нова сесія без реєстрації')

    const dateInput = container.querySelector('input[type="date"]')
    const timeInput = container.querySelector('input[inputmode="numeric"]')
    if (!dateInput || !timeInput) {
      throw new Error('Missing start date/time fields')
    }

    await fireEvent.update(dateInput, '2099-06-16')
    await fireEvent.update(timeInput, '12:30')
    await fireEvent.update(screen.getByLabelText('Посилання на зустріч'), 'https://meet.google.com/new-room')
    await fireEvent.update(screen.getByLabelText("Ім'я клієнта (опційно)"), 'Guest Name')
    await fireEvent.update(screen.getByLabelText('Ел. пошта клієнта (опційно)'), 'guest@example.com')
    await fireEvent.click(screen.getByRole('button', { name: 'Створити сесію без реєстрації' }))

    await waitFor(() => {
      expect(mockedCreateExternalSession).toHaveBeenCalledTimes(1)
    })

    const payload = mockedCreateExternalSession.mock.calls[0]?.[0]
    expect(payload?.session_format).toBe('online')
    expect(payload?.meeting_url).toBe('https://meet.google.com/new-room')
    expect(payload?.offline_location_snapshot).toBeNull()
    expect(payload?.price_currency).toBe('UAH')

    await waitFor(() => {
      expect(mockedCreateExternalSessionInvite).toHaveBeenCalledWith(31)
      expect(pushMock).toHaveBeenCalledWith('/cabinet/external-sessions/31')
    })
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

    const { container } = renderView()
    await screen.findByText('Нова сесія без реєстрації')

    const dateInput = container.querySelector('input[type="date"]')
    const timeInput = container.querySelector('input[inputmode="numeric"]')
    if (!dateInput || !timeInput) {
      throw new Error('Missing start date/time fields')
    }

    await fireEvent.update(screen.getByLabelText('Формат'), 'offline')
    await fireEvent.update(dateInput, '2099-06-16')
    await fireEvent.update(timeInput, '12:30')
    await fireEvent.update(screen.getByLabelText('Локація'), 'Kyiv office')
    await fireEvent.click(screen.getByRole('button', { name: 'Створити сесію без реєстрації' }))

    await waitFor(() => {
      expect(mockedCreateExternalSession).toHaveBeenCalledTimes(1)
    })

    const payload = mockedCreateExternalSession.mock.calls[0]?.[0]
    expect(payload?.session_format).toBe('offline')
    expect(payload?.meeting_url).toBeNull()
    expect(payload?.offline_location_snapshot).toBe('Kyiv office')
    expect(payload?.price_currency).toBe('UAH')

    await waitFor(() => {
      expect(mockedCreateExternalSessionInvite).toHaveBeenCalledWith(44)
      expect(pushMock).toHaveBeenCalledWith('/cabinet/external-sessions/44')
    })
  })

  it('renders pending guest request with clear status and required online approve field', async () => {
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      {
        id: 51,
        status: 'pending',
        specialist_id: 10,
        slot_id: 301,
        requested_slot_start: '2099-06-17T13:00:00Z',
        requested_slot_end: '2099-06-17T13:50:00Z',
        duration_minutes: 50,
        session_format: 'online',
        offline_location_snapshot: '',
        guest_name: 'Guest One',
        contact_channel: 'email',
        contact_value: 'guest.one@example.com',
        message: 'Please confirm',
        source: 'public_profile',
        public_profile_slug_snapshot: 'slug',
        slot_snapshot_timezone: 'Europe/Kyiv',
        approved_at: null,
        declined_at: null,
        cancelled_at: null,
        decline_reason: '',
        external_session_id: null,
        created_at: '2099-06-16T10:00:00Z',
        updated_at: '2099-06-16T10:00:00Z',
      },
    ] as any)

    renderView()

    expect(await screen.findByText('Запити без реєстрації')).toBeInTheDocument()
    expect(await screen.findByText('Потребує рішення')).toBeInTheDocument()
    const requestCard = getGuestRequestCardByName('Guest One').card
    expect(requestCard).toHaveTextContent(/Запитаний час\s*\d{2}\.\d{2}\.2099, \d{2}:00–\d{2}:50/)
    expect(requestCard).toHaveTextContent(/Створено:\s*\d{2}\.\d{2}\.2099, \d{2}:00/)
    const meetingInput = await screen.findByLabelText('Посилання на онлайн-зустріч')
    const approveButton = screen.getByRole('button', { name: 'Погодити' })
    expect(screen.getByRole('button', { name: 'Запропонувати інший час' })).toBeInTheDocument()
    expect(approveButton).toBeDisabled()
    expect(await screen.findByText('Щоб погодити онлайн-запит, додайте посилання на зустріч.')).toBeInTheDocument()

    await fireEvent.update(meetingInput, 'https://meet.google.com/helper-check')

    await waitFor(() => {
      expect(approveButton).not.toBeDisabled()
    })
    expect(screen.queryByText('Щоб погодити онлайн-запит, додайте посилання на зустріч.')).not.toBeInTheDocument()
  })

  it('highlights and scrolls guest requests from calendar deep link', async () => {
    mockRoute.query = { request_ids: '51,999' }
    mockRoute.hash = '#guest-requests'
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({ id: 51, guest_name: 'Calendar Guest' }),
      buildGuestRequest({ id: 52, slot_id: 302, guest_name: 'Other Guest' }),
    ] as any)

    renderView()

    expect(await screen.findByRole('status')).toHaveTextContent('Показано запити з календаря')
    const highlightedCard = getGuestRequestCardByName('Calendar Guest').card
    const unrelatedCard = getGuestRequestCardByName('Other Guest').card

    expect(highlightedCard).toHaveClass('request-card--highlighted')
    expect(unrelatedCard).not.toHaveClass('request-card--highlighted')
    expect(highlightedCard).toHaveTextContent(/Запитаний час\s*\d{2}\.\d{2}\.2099, \d{2}:00–\d{2}:50/)
    await waitFor(() => {
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
    })
  })

  it('approves pending online guest request and renders link to resulting external session', async () => {
    mockedFetchCabinetGuestBookingRequests
      .mockResolvedValueOnce([
        {
          id: 51,
          status: 'pending',
          specialist_id: 10,
          slot_id: 301,
          requested_slot_start: '2099-06-17T13:00:00Z',
          requested_slot_end: '2099-06-17T13:50:00Z',
          duration_minutes: 50,
          session_format: 'online',
          offline_location_snapshot: '',
          guest_name: 'Guest One',
          contact_channel: 'email',
          contact_value: 'guest.one@example.com',
          message: 'Please confirm',
          source: 'public_profile',
          public_profile_slug_snapshot: 'slug',
          slot_snapshot_timezone: 'Europe/Kyiv',
          approved_at: null,
          declined_at: null,
          cancelled_at: null,
          decline_reason: '',
          external_session_id: null,
          created_at: '2099-06-16T10:00:00Z',
          updated_at: '2099-06-16T10:00:00Z',
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: 51,
          status: 'approved',
          specialist_id: 10,
          slot_id: 301,
          requested_slot_start: '2099-06-17T13:00:00Z',
          requested_slot_end: '2099-06-17T13:50:00Z',
          duration_minutes: 50,
          session_format: 'online',
          offline_location_snapshot: '',
          guest_name: 'Guest One',
          contact_channel: 'email',
          contact_value: 'guest.one@example.com',
          message: 'Please confirm',
          source: 'public_profile',
          public_profile_slug_snapshot: 'slug',
          slot_snapshot_timezone: 'Europe/Kyiv',
          approved_at: '2099-06-16T11:00:00Z',
          declined_at: null,
          cancelled_at: null,
          decline_reason: '',
          external_session_id: null,
          session_id: 701,
          created_at: '2099-06-16T10:00:00Z',
          updated_at: '2099-06-16T11:00:00Z',
        },
      ] as any)

    mockedConfirmCabinetGuestBookingRequestSession.mockResolvedValue({
      request: {
        id: 51,
        status: 'approved',
        specialist_id: 10,
        slot_id: 301,
        requested_slot_start: '2099-06-17T13:00:00Z',
        requested_slot_end: '2099-06-17T13:50:00Z',
        duration_minutes: 50,
        session_format: 'online',
        offline_location_snapshot: '',
        guest_name: 'Guest One',
        contact_channel: 'email',
        contact_value: 'guest.one@example.com',
        message: 'Please confirm',
        source: 'public_profile',
        public_profile_slug_snapshot: 'slug',
        slot_snapshot_timezone: 'Europe/Kyiv',
        approved_at: '2099-06-16T11:00:00Z',
        declined_at: null,
        cancelled_at: null,
        decline_reason: '',
        external_session_id: null,
        session_id: 701,
        created_at: '2099-06-16T10:00:00Z',
        updated_at: '2099-06-16T11:00:00Z',
      },
      session: { id: 701 },
    } as any)

    renderView()
    expect(await screen.findByText('Потребує рішення')).toBeInTheDocument()

    await fireEvent.update(
      screen.getByLabelText('Посилання на онлайн-зустріч'),
      'https://meet.google.com/new-guest-link'
    )
    await fireEvent.click(screen.getByRole('button', { name: 'Погодити' }))

    await waitFor(() => {
      expect(mockedConfirmCabinetGuestBookingRequestSession).toHaveBeenCalledWith(51, {
        meeting_url: 'https://meet.google.com/new-guest-link',
      })
    })
    expect(mockedApproveCabinetGuestBookingRequest).not.toHaveBeenCalled()

    const sessionLink = await screen.findByRole('link', { name: 'Відкрити сесію' })
    expect(sessionLink).toHaveAttribute('href', '/cabinet/sessions/701')
    expect(await screen.findByText('Запит погоджено. На основі цього запиту створено сесію.')).toBeInTheDocument()
    expect(screen.getByText('Підтвердження сесії та оплата мають окремі статуси.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Відкрити сесію без реєстрації' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Відкрити сторінку сесії' })).not.toBeInTheDocument()
  })

  it('confirms offline slot-based request without requiring meeting URL', async () => {
    mockedFetchCabinetGuestBookingRequests
      .mockResolvedValueOnce([
        buildGuestRequest({
          id: 55,
          guest_name: 'Offline Guest',
          contact_channel: 'phone',
          contact_value: '+380501112233',
          session_format: 'offline',
          offline_location_snapshot: 'Kyiv, Podil Office',
        }),
      ] as any)
      .mockResolvedValueOnce([
        buildGuestRequest({
          id: 55,
          status: 'approved',
          guest_name: 'Offline Guest',
          contact_channel: 'phone',
          contact_value: '+380501112233',
          session_format: 'offline',
          offline_location_snapshot: 'Kyiv, Podil Office',
          approved_at: '2099-06-16T11:00:00Z',
          session_id: 755,
        }),
      ] as any)
    mockedConfirmCabinetGuestBookingRequestSession.mockResolvedValue({
      request: buildGuestRequest({
        id: 55,
        status: 'approved',
        session_format: 'offline',
        offline_location_snapshot: 'Kyiv, Podil Office',
        session_id: 755,
      }),
      session: { id: 755 },
    } as any)

    renderView()
    await screen.findByText('Offline Guest')

    const card = getGuestRequestCardByName('Offline Guest')
    expect(card.meetingInput).toBeNull()
    await fireEvent.click(card.approveButton)

    await waitFor(() => {
      expect(mockedConfirmCabinetGuestBookingRequestSession).toHaveBeenCalledWith(55, {})
    })
    expect(mockedApproveCabinetGuestBookingRequest).not.toHaveBeenCalled()
    expect(await screen.findByRole('link', { name: 'Відкрити сесію' })).toHaveAttribute(
      'href',
      '/cabinet/sessions/755'
    )
  })

  it('declines pending guest request and refreshes request status', async () => {
    mockedFetchCabinetGuestBookingRequests
      .mockResolvedValueOnce([
        {
          id: 52,
          status: 'pending',
          specialist_id: 10,
          slot_id: 302,
          requested_slot_start: '2099-06-18T13:00:00Z',
          requested_slot_end: '2099-06-18T13:50:00Z',
          duration_minutes: 50,
          session_format: 'offline',
          offline_location_snapshot: 'Kyiv',
          guest_name: 'Guest Two',
          contact_channel: 'phone',
          contact_value: '+380501112233',
          message: 'offline request',
          source: 'public_profile',
          public_profile_slug_snapshot: 'slug',
          slot_snapshot_timezone: 'Europe/Kyiv',
          approved_at: null,
          declined_at: null,
          cancelled_at: null,
          decline_reason: '',
          external_session_id: null,
          created_at: '2099-06-16T10:00:00Z',
          updated_at: '2099-06-16T10:00:00Z',
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: 52,
          status: 'declined',
          specialist_id: 10,
          slot_id: 302,
          requested_slot_start: '2099-06-18T13:00:00Z',
          requested_slot_end: '2099-06-18T13:50:00Z',
          duration_minutes: 50,
          session_format: 'offline',
          offline_location_snapshot: 'Kyiv',
          guest_name: 'Guest Two',
          contact_channel: 'phone',
          contact_value: '+380501112233',
          message: 'offline request',
          source: 'public_profile',
          public_profile_slug_snapshot: 'slug',
          slot_snapshot_timezone: 'Europe/Kyiv',
          approved_at: null,
          declined_at: '2099-06-16T11:00:00Z',
          cancelled_at: null,
          decline_reason: '',
          external_session_id: null,
          created_at: '2099-06-16T10:00:00Z',
          updated_at: '2099-06-16T11:00:00Z',
        },
      ] as any)

    mockedDeclineCabinetGuestBookingRequest.mockResolvedValue({
      id: 52,
      status: 'declined',
    } as any)

    renderView()
    expect(await screen.findByText('Потребує рішення')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Відхилити запит' }))
    const cancelDialog = await screen.findByRole('dialog', { name: 'Відхилити запит?' })
    expect(cancelDialog).toHaveTextContent(
      'Запит буде відхилено. Клієнт не побачить автоматичної відповіді, якщо ви не зв’яжетеся з ним окремо.'
    )
    expect(mockedDeclineCabinetGuestBookingRequest).not.toHaveBeenCalled()

    await fireEvent.click(within(cancelDialog).getByRole('button', { name: 'Залишити запит' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Відхилити запит?' })).not.toBeInTheDocument()
    })
    expect(mockedDeclineCabinetGuestBookingRequest).not.toHaveBeenCalled()

    await fireEvent.click(screen.getByRole('button', { name: 'Відхилити запит' }))
    const confirmedDialog = await screen.findByRole('dialog', { name: 'Відхилити запит?' })
    await fireEvent.click(within(confirmedDialog).getByRole('button', { name: 'Відхилити запит' }))

    await waitFor(() => {
      expect(mockedDeclineCabinetGuestBookingRequest).toHaveBeenCalledWith(52)
    })
    expect(await screen.findByText('Відхилено')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Показати деталі' }))

    expect(await screen.findByText(/Відхилено:/)).toBeInTheDocument()
  })

  it('renders slot-less guest request without slot approve action', async () => {
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 61,
        slot_id: null,
        has_slot: false,
        is_slotless_request: true,
        requested_slot_start: null,
        requested_slot_end: null,
        guest_name: 'Fallback Guest',
        client_name: 'Slotless Guest',
        client_email: 'slotless@example.com',
        client_phone: '+380501234567',
        message: 'Можу після обіду',
      }),
    ] as any)

    renderView()
    await screen.findByText('Запит без обраного часу')

    const card = getGuestRequestCardByText('Запит без обраного часу')
    expect(card).toHaveTextContent('Клієнт: Slotless Guest')
    expect(card).toHaveTextContent('Контакт клієнта для відповіді: Ел. пошта · slotless@example.com')
    expect(card).toHaveTextContent(/Статус:\s*Потребує рішення/)
    expect(card).not.toHaveTextContent('Клієнт залишив запит без підтвердженого часу.')
    expect(card).not.toHaveTextContent('Телефон: +380501234567')
    expect(card).not.toHaveTextContent('Коментар: Можу після обіду')
    expect(card.querySelector('.request-topic-row')).toBeNull()
    expect(within(card as HTMLElement).getByRole('button', { name: 'Створити сесію' })).toBeInTheDocument()
    expect(within(card as HTMLElement).getByRole('button', { name: 'Відхилити запит' })).toBeInTheDocument()
    expect(within(card as HTMLElement).queryByRole('button', { name: 'Погодити' })).not.toBeInTheDocument()
    expect(within(card as HTMLElement).queryByRole('button', { name: 'Запропонувати інший час' })).not.toBeInTheDocument()
    expect(card).not.toHaveTextContent('Запитаний час:')

    await fireEvent.click(within(card as HTMLElement).getByRole('button', { name: 'Показати деталі' }))

    expect(card).toHaveTextContent('Клієнт залишив запит без конкретного часу. Узгодьте час і створіть сесію вручну.')
    expect(card).toHaveTextContent('Ел. пошта: slotless@example.com')
    expect(card).toHaveTextContent('Телефон: +380501234567')
    expect(card).toHaveTextContent('Коментар: Можу після обіду')
    expect(within(card as HTMLElement).getByRole('button', { name: 'Сховати деталі' })).toBeInTheDocument()
  })

  it('renders alternative-time state for occupied slot request without approve action', async () => {
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 64,
        guest_name: 'Sibling Guest',
        contact_channel: 'email',
        contact_value: 'sibling@example.com',
        needs_alternative_time: true,
        requested_slot_is_occupied: true,
        conflicting_session_id: 701,
        same_slot_pending_count: 1,
        same_slot_approved_count: 1,
      }),
    ] as any)

    renderView()
    await screen.findByText('Sibling Guest')

    const card = getGuestRequestCardByText('Sibling Guest')
    expect(card).toHaveTextContent('Потрібно запропонувати інший час')
    expect(within(card as HTMLElement).getByRole('button', { name: 'Запропонувати інший час' })).not.toBeDisabled()
    expect(within(card as HTMLElement).getByRole('button', { name: 'Відхилити запит' })).toBeInTheDocument()
    expect(within(card as HTMLElement).queryByRole('button', { name: 'Погодити' })).not.toBeInTheDocument()
    expect(card.querySelector('input[type="url"]')).not.toBeInTheDocument()
    expect(mockedConfirmCabinetGuestBookingRequestSession).not.toHaveBeenCalled()
  })

  it('opens alternative-time proposal modal and requires slot plus meeting URL', async () => {
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 64,
        guest_name: 'Pending Guest',
        contact_channel: 'telegram',
        contact_value: '@pending_guest',
      }),
    ] as any)

    renderView()
    await screen.findByText('Pending Guest')
    await fireEvent.click(screen.getByRole('button', { name: 'Запропонувати інший час' }))

    const dialog = await screen.findByRole('dialog', { name: 'Запропонувати інший час' })
    const modal = within(dialog)
    expect(dialog).toHaveTextContent('Запитаний час')
    expect(dialog).toHaveTextContent('Обрано: 0 з 3')
    expect(dialog).not.toHaveTextContent('20.06.2099')
    expect(modal.getByText('Формат запропонованої сесії')).toBeInTheDocument()
    expect(modal.getByLabelText('Онлайн')).toBeChecked()
    expect(modal.getByRole('button', { name: 'Надіслати пропозицію' })).toBeDisabled()

    await fireEvent.click(modal.getByLabelText(/18\.06\.2099/))
    expect(dialog).toHaveTextContent('Обрано: 1 з 3')
    expect(modal.getByRole('button', { name: 'Надіслати пропозицію' })).toBeDisabled()

    await fireEvent.update(modal.getByLabelText('Посилання на онлайн-зустріч'), 'https://meet.example.com/alternative')
    expect(modal.getByRole('button', { name: 'Надіслати пропозицію' })).not.toBeDisabled()
  })

  it('creates alternative-time proposal and shows share link', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 64,
        guest_name: 'Pending Guest',
        contact_channel: 'telegram',
        contact_value: '@pending_guest',
      }),
    ] as any)

    renderView()
    await screen.findByText('Pending Guest')
    await fireEvent.click(screen.getByRole('button', { name: 'Запропонувати інший час' }))

    const dialog = await screen.findByRole('dialog', { name: 'Запропонувати інший час' })
    const modal = within(dialog)
    await fireEvent.click(modal.getByLabelText(/18\.06\.2099/))
    await fireEvent.update(modal.getByLabelText('Посилання на онлайн-зустріч'), 'https://meet.example.com/alternative')
    await fireEvent.update(
      modal.getByLabelText('Повідомлення для клієнта'),
      'Оберіть один із запропонованих варіантів.'
    )
    await fireEvent.click(modal.getByRole('button', { name: 'Надіслати пропозицію' }))

    await waitFor(() => {
      expect(mockedCreateCabinetGuestBookingTimeProposal).toHaveBeenCalledWith(64, {
        slot_ids: [901],
        session_format: 'online',
        meeting_url: 'https://meet.example.com/alternative',
        offline_location_snapshot: '',
        message: 'Оберіть один із запропонованих варіантів.',
      })
    })
    expect(await screen.findByText('Пропозицію створено')).toBeInTheDocument()
    expect(screen.getByDisplayValue('https://proconsult.test/guest/booking-time-proposal/proposal-token')).toBeInTheDocument()
    expect(dialog).toHaveTextContent('Скопіюйте посилання й надішліть клієнту через обраний канал.')
    expect(dialog).not.toHaveTextContent('Надішліть це посилання клієнту у зручному для вас каналі.')

    const card = getGuestRequestCardByText('Pending Guest')
    expect(card).toHaveTextContent(/Статус:\s*Очікує відповідь клієнта/)
    expect(card).toHaveTextContent('Пропозицію часу створено')
    expect(card).toHaveTextContent('Скопіюйте посилання й надішліть клієнту через обраний канал.')
    expect(card).not.toHaveTextContent('Посилання доступне одразу після створення пропозиції.')
    expect(card).not.toHaveTextContent('Пропозицію часу надіслано')

    await fireEvent.click(within(card as HTMLElement).getByRole('button', { name: 'Скопіювати посилання' }))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://proconsult.test/guest/booking-time-proposal/proposal-token'
    )
    expect(within(card as HTMLElement).queryByRole('button', { name: 'Погодити' })).not.toBeInTheDocument()
    expect(within(card as HTMLElement).queryByRole('button', { name: 'Запропонувати інший час' })).not.toBeInTheDocument()
  })

  it('shows a safe Ukrainian client-record ambiguity error when proposal creation is blocked', async () => {
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 64,
        guest_name: 'Ambiguous Guest',
        contact_channel: 'email',
        contact_value: 'ambiguous@example.com',
      }),
    ] as any)
    mockedCreateCabinetGuestBookingTimeProposal.mockRejectedValueOnce({
      response: {
        data: {
          code: 'CLIENT_RECORD_CONTACT_AMBIGUITY',
          detail: 'Several active client records match this guest contact.',
        },
      },
    })

    renderView()
    await screen.findByText('Ambiguous Guest')
    await fireEvent.click(screen.getByRole('button', { name: 'Запропонувати інший час' }))

    const dialog = await screen.findByRole('dialog', { name: 'Запропонувати інший час' })
    const modal = within(dialog)
    await fireEvent.click(modal.getByLabelText(/18\.06\.2099/))
    await fireEvent.update(
      modal.getByLabelText('Посилання на онлайн-зустріч'),
      'https://meet.example.com/ambiguous'
    )
    await fireEvent.click(modal.getByRole('button', { name: 'Надіслати пропозицію' }))

    const expectedMessage =
      'Не вдалося однозначно визначити картку клієнта: у списку є кілька активних карток із цим контактом. Перевірте дублікати перед надсиланням пропозиції часу.'
    expect(await modal.findByText(expectedMessage)).toBeInTheDocument()
    expect(dialog).not.toHaveTextContent('Several active client records match this guest contact.')
    expect(mockedGetApiErrorMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({
        response: expect.objectContaining({
          data: expect.objectContaining({ code: 'CLIENT_RECORD_CONTACT_AMBIGUITY' }),
        }),
      }),
      expect.any(String)
    )
  })

  it('renders sent email delivery state after creating proposal', async () => {
    mockedCreateCabinetGuestBookingTimeProposal.mockResolvedValueOnce(
      buildTimeProposalResponse({ client_notification_status: 'sent' }) as any
    )
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 64,
        guest_name: 'Email Guest',
        needs_alternative_time: true,
        requested_slot_is_occupied: true,
      }),
    ] as any)

    renderView()
    await screen.findByText('Email Guest')
    await fireEvent.click(screen.getByRole('button', { name: 'Запропонувати інший час' }))

    const dialog = await screen.findByRole('dialog', { name: 'Запропонувати інший час' })
    const modal = within(dialog)
    await fireEvent.click(modal.getByLabelText(/18\.06\.2099/))
    await fireEvent.update(modal.getByLabelText('Посилання на онлайн-зустріч'), 'https://meet.example.com/email-sent')
    await fireEvent.click(modal.getByRole('button', { name: 'Надіслати пропозицію' }))

    expect(await modal.findByText('Лист із посиланням надіслано на email клієнта. Посилання нижче можна скопіювати за потреби.')).toBeInTheDocument()
    expect(dialog).not.toHaveTextContent('Надішліть це посилання клієнту у зручному для вас каналі.')

    const card = await waitFor(() => {
      const resolvedCard = getGuestRequestCardByText('Email Guest') as HTMLElement
      expect(resolvedCard).toHaveTextContent(/Статус:\s*Очікує відповідь клієнта/)
      return resolvedCard
    })
    expect(card).toHaveTextContent('Пропозицію часу надіслано на email клієнта.')
    expect(card).not.toHaveTextContent('email не вдалося надіслати')
    expect(within(card).queryByRole('button', { name: 'Скопіювати посилання' })).not.toBeInTheDocument()
  })

  it('renders failed email delivery state with manual copy action', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
    mockedCreateCabinetGuestBookingTimeProposal.mockResolvedValueOnce(
      buildTimeProposalResponse({ client_notification_status: 'failed' }) as any
    )
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 64,
        guest_name: 'Email Failed Guest',
        needs_alternative_time: true,
        requested_slot_is_occupied: true,
      }),
    ] as any)

    renderView()
    await screen.findByText('Email Failed Guest')
    await fireEvent.click(screen.getByRole('button', { name: 'Запропонувати інший час' }))

    const dialog = await screen.findByRole('dialog', { name: 'Запропонувати інший час' })
    const modal = within(dialog)
    await fireEvent.click(modal.getByLabelText(/18\.06\.2099/))
    await fireEvent.update(modal.getByLabelText('Посилання на онлайн-зустріч'), 'https://meet.example.com/email-failed')
    await fireEvent.click(modal.getByRole('button', { name: 'Надіслати пропозицію' }))

    expect(await modal.findByText('Email не вдалося надіслати. Скопіюйте посилання й надішліть клієнту вручну.')).toBeInTheDocument()
    expect(dialog).not.toHaveTextContent('Надішліть це посилання клієнту у зручному для вас каналі.')

    const card = await waitFor(() => {
      const resolvedCard = getGuestRequestCardByText('Email Failed Guest') as HTMLElement
      expect(resolvedCard).toHaveTextContent(/Статус:\s*Потрібно надіслати посилання/)
      return resolvedCard
    })
    expect(card).toHaveTextContent('Пропозицію часу створено, але email не вдалося надіслати.')
    expect(card).toHaveTextContent('Скопіюйте посилання й надішліть клієнту вручну.')
    expect(card).not.toHaveTextContent('Пропозицію часу надіслано')

    await fireEvent.click(within(card).getByRole('button', { name: 'Скопіювати посилання' }))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://proconsult.test/guest/booking-time-proposal/proposal-token'
    )
  })

  it('defaults offline proposal format from offline request and requires location', async () => {
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 65,
        guest_name: 'Offline Sibling',
        session_format: 'offline',
        offline_location_snapshot: '',
        needs_alternative_time: true,
        requested_slot_is_occupied: true,
      }),
    ] as any)

    renderView()
    await screen.findByText('Offline Sibling')
    await fireEvent.click(screen.getByRole('button', { name: 'Запропонувати інший час' }))

    const dialog = await screen.findByRole('dialog', { name: 'Запропонувати інший час' })
    const modal = within(dialog)
    expect(modal.getByLabelText('Офлайн')).toBeChecked()
    expect(modal.queryByLabelText('Посилання на онлайн-зустріч')).not.toBeInTheDocument()
    await fireEvent.click(modal.getByLabelText(/18\.06\.2099/))
    expect(modal.getByRole('button', { name: 'Надіслати пропозицію' })).toBeDisabled()
    await fireEvent.update(modal.getByLabelText('Адреса / місце зустрічі'), 'Київ, вул. Прикладна, 1')
    expect(modal.getByRole('button', { name: 'Надіслати пропозицію' })).not.toBeDisabled()
  })

  it('creates offline proposal when online request is switched to offline', async () => {
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 66,
        guest_name: 'Switch Offline Guest',
        needs_alternative_time: true,
        requested_slot_is_occupied: true,
      }),
    ] as any)

    renderView()
    await screen.findByText('Switch Offline Guest')
    await fireEvent.click(screen.getByRole('button', { name: 'Запропонувати інший час' }))

    const dialog = await screen.findByRole('dialog', { name: 'Запропонувати інший час' })
    const modal = within(dialog)
    await fireEvent.click(modal.getByLabelText('Офлайн'))
    await fireEvent.click(modal.getByLabelText(/18\.06\.2099/))
    await fireEvent.update(modal.getByLabelText('Адреса / місце зустрічі'), 'Львів, вул. Зустрічна, 2')
    await fireEvent.click(modal.getByRole('button', { name: 'Надіслати пропозицію' }))

    await waitFor(() => {
      expect(mockedCreateCabinetGuestBookingTimeProposal).toHaveBeenCalledWith(66, {
        slot_ids: [901],
        session_format: 'offline',
        meeting_url: '',
        offline_location_snapshot: 'Львів, вул. Зустрічна, 2',
        message: '',
      })
    })
  })

  it('creates online proposal when offline request is switched to online', async () => {
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 67,
        guest_name: 'Switch Online Guest',
        session_format: 'offline',
        offline_location_snapshot: 'Київ, офіс',
        needs_alternative_time: true,
        requested_slot_is_occupied: true,
      }),
    ] as any)

    renderView()
    await screen.findByText('Switch Online Guest')
    await fireEvent.click(screen.getByRole('button', { name: 'Запропонувати інший час' }))

    const dialog = await screen.findByRole('dialog', { name: 'Запропонувати інший час' })
    const modal = within(dialog)
    expect(modal.getByLabelText('Офлайн')).toBeChecked()
    await fireEvent.click(modal.getByLabelText('Онлайн'))
    await fireEvent.click(modal.getByLabelText(/18\.06\.2099/))
    await fireEvent.update(modal.getByLabelText('Посилання на онлайн-зустріч'), 'https://meet.example.com/switched-online')
    await fireEvent.click(modal.getByRole('button', { name: 'Надіслати пропозицію' }))

    await waitFor(() => {
      expect(mockedCreateCabinetGuestBookingTimeProposal).toHaveBeenCalledWith(67, {
        slot_ids: [901],
        session_format: 'online',
        meeting_url: 'https://meet.example.com/switched-online',
        offline_location_snapshot: '',
        message: '',
      })
    })
  })

  it('localizes invalid proposal session format error', async () => {
    mockedCreateCabinetGuestBookingTimeProposal.mockRejectedValueOnce({
      response: { data: { code: 'INVALID_SESSION_FORMAT' } },
    })
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 68,
        guest_name: 'Invalid Format Guest',
        needs_alternative_time: true,
        requested_slot_is_occupied: true,
      }),
    ] as any)

    renderView()
    await screen.findByText('Invalid Format Guest')
    await fireEvent.click(screen.getByRole('button', { name: 'Запропонувати інший час' }))

    const dialog = await screen.findByRole('dialog', { name: 'Запропонувати інший час' })
    const modal = within(dialog)
    await fireEvent.click(modal.getByLabelText(/18\.06\.2099/))
    await fireEvent.update(modal.getByLabelText('Посилання на онлайн-зустріч'), 'https://meet.example.com/invalid-format')
    await fireEvent.click(modal.getByRole('button', { name: 'Надіслати пропозицію' }))

    expect(await modal.findByText('Оберіть формат сесії.')).toBeInTheDocument()
  })

  it('renders neutral active email proposal summary after reload without delivery status', async () => {
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 64,
        guest_name: 'Sibling Guest',
        active_time_proposal_id: 77,
        active_time_proposal_status: 'sent',
        active_time_proposal_options_count: 2,
        active_time_proposal_expires_at: '2099-06-25T10:00:00Z',
      }),
    ] as any)

    renderView()
    await screen.findByText('Sibling Guest')

    const card = getGuestRequestCardByText('Sibling Guest')
    expect(card).toHaveTextContent(/Статус:\s*Очікує відповідь клієнта/)
    expect(card).not.toHaveTextContent('Потрібно запропонувати інший час')
    expect(card).not.toHaveTextContent('очікує рішення')
    expect(card).toHaveTextContent('Пропозицію часу створено для email-контакту.')
    expect(card).toHaveTextContent('Активна пропозиція очікує відповіді клієнта.')
    expect(card).not.toHaveTextContent('Пропозицію часу надіслано')
    expect(card).not.toHaveTextContent('Потрібно надіслати посилання')
    expect(card).toHaveTextContent('Варіантів: 2')
    expect(within(card as HTMLElement).queryByRole('button', { name: 'Скопіювати посилання' })).not.toBeInTheDocument()
    expect(within(card as HTMLElement).queryByRole('button', { name: 'Погодити' })).not.toBeInTheDocument()
    expect(within(card as HTMLElement).queryByRole('button', { name: 'Запропонувати інший час' })).not.toBeInTheDocument()
  })

  it('renders manual-send state for active non-email time proposal', async () => {
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 64,
        guest_name: 'Telegram Guest',
        contact_channel: 'telegram',
        contact_value: '@telegram_guest',
        needs_alternative_time: true,
        requested_slot_is_occupied: true,
        active_time_proposal_id: 77,
        active_time_proposal_status: 'sent',
        active_time_proposal_options_count: 2,
        active_time_proposal_expires_at: '2099-06-25T10:00:00Z',
      }),
    ] as any)

    renderView()
    await screen.findByText('Telegram Guest')

    const card = getGuestRequestCardByText('Telegram Guest')
    expect(card).toHaveTextContent(/Статус:\s*Очікує відповідь клієнта/)
    expect(card).toHaveTextContent('Пропозицію часу створено')
    expect(card).toHaveTextContent('Активна пропозиція очікує відповіді клієнта.')
    expect(within(card as HTMLElement).queryByRole('button', { name: 'Скопіювати посилання' })).not.toBeInTheDocument()
    expect(card).not.toHaveTextContent('Пропозицію часу надіслано')
    expect(card).not.toHaveTextContent('Потрібно запропонувати інший час')
    expect(within(card as HTMLElement).queryByRole('button', { name: 'Погодити' })).not.toBeInTheDocument()
    expect(within(card as HTMLElement).queryByRole('button', { name: 'Запропонувати інший час' })).not.toBeInTheDocument()
  })

  it('creates manual session from slot-less guest request and refreshes data', async () => {
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 62,
        slot_id: null,
        has_slot: false,
        is_slotless_request: true,
        requested_slot_start: null,
        requested_slot_end: null,
        client_name: 'Manual Session Guest',
        client_email: 'manual@example.com',
        session_format: 'online',
      }),
    ] as any)

    renderView()
    await screen.findByText('Запит без обраного часу')

    await fireEvent.click(screen.getByRole('button', { name: 'Створити сесію' }))

    const dialog = await screen.findByRole('dialog', { name: 'Створити сесію' })
    const modal = within(dialog)
    const dateInput = modal.getByLabelText('Дата')
    const timeSelect = modal.getByLabelText('Час початку')
    expect(dateInput).toHaveAttribute('type', 'text')
    expect(dateInput).toHaveAttribute('placeholder', 'ДД.ММ.РРРР')
    expect(dialog.querySelector('input[type="date"]')).not.toBeInTheDocument()
    expect(dialog.querySelector('input[type="time"]')).not.toBeInTheDocument()
    expect((dateInput as HTMLInputElement).value).toMatch(/^\d{2}\.\d{2}\.\d{4}$/)
    expect(timeSelect.tagName).toBe('SELECT')
    expect(within(timeSelect as HTMLElement).getByRole('option', { name: '09:10' })).toBeInTheDocument()
    expect(within(timeSelect as HTMLElement).queryByRole('option', { name: '09:25' })).not.toBeInTheDocument()
    expect(dialog.textContent).not.toMatch(/\b(?:AM|PM)\b/)

    await fireEvent.click(modal.getByRole('button', { name: 'Відкрити календар' }))
    expect(modal.getByRole('button', { name: 'Попередній місяць' })).toBeInTheDocument()
    await fireEvent.focus(timeSelect)
    expect(modal.queryByRole('button', { name: 'Попередній місяць' })).not.toBeInTheDocument()
    await fireEvent.click(modal.getByRole('button', { name: 'Відкрити календар' }))
    const currentDisplayDate = (dateInput as HTMLInputElement).value
    await fireEvent.click(modal.getByRole('button', { name: currentDisplayDate }))
    expect((dateInput as HTMLInputElement).value).toBe(currentDisplayDate)

    await fireEvent.update(dateInput, '5.6.2099')
    await fireEvent.blur(dateInput)
    expect((dateInput as HTMLInputElement).value).toBe('05.06.2099')

    await fireEvent.update(dateInput, '20.06.2099')
    await fireEvent.update(timeSelect, '09:10')
    await fireEvent.update(modal.getByLabelText('Тривалість'), '50')
    await fireEvent.update(modal.getByLabelText('Посилання на онлайн-зустріч'), 'https://meet.google.com/manual')
    await fireEvent.click(modal.getByRole('button', { name: 'Створити сесію' }))

    const expectedStartsAt = new Date('2099-06-20T09:10').toISOString()
    const expectedEndsAt = new Date(new Date('2099-06-20T09:10').getTime() + 50 * 60000).toISOString()

    await waitFor(() => {
      expect(mockedCreateSessionFromCabinetGuestBookingRequest).toHaveBeenCalledWith(62, {
        starts_at: expectedStartsAt,
        ends_at: expectedEndsAt,
        timezone: 'Europe/Kyiv',
        session_format: 'online',
        meeting_url: 'https://meet.google.com/manual',
        offline_location: '',
      })
    })
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Створити сесію' })).not.toBeInTheDocument()
    })
    expect(toast.success).toHaveBeenCalledWith('Запит погоджено. Сесію створено.')
    expect(mockedFetchCabinetGuestBookingRequests).toHaveBeenCalledTimes(2)
    expect(mockedFetchExternalSessions).toHaveBeenCalledTimes(2)
  })

  it('blocks slot-less create-session submit when start time format is invalid', async () => {
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 67,
        slot_id: null,
        has_slot: false,
        is_slotless_request: true,
        requested_slot_start: null,
        requested_slot_end: null,
        client_name: 'Invalid Time Guest',
      }),
    ] as any)

    renderView()
    await screen.findByText('Запит без обраного часу')
    await fireEvent.click(screen.getByRole('button', { name: 'Створити сесію' }))

    const dialog = await screen.findByRole('dialog', { name: 'Створити сесію' })
    const modal = within(dialog)
    await waitFor(() => {
      expect(mockedFetchSpecialistProfile).toHaveBeenCalled()
      expect((modal.getByLabelText('Дата') as HTMLInputElement).value).toMatch(/^\d{2}\.\d{2}\.\d{4}$/)
    })
    await fireEvent.update(modal.getByLabelText('Дата'), '20.06.2099')
    await fireEvent.update(modal.getByLabelText('Час початку'), '')
    await fireEvent.click(modal.getByRole('button', { name: 'Створити сесію' }))

    expect(await screen.findByText('Оберіть час початку.')).toBeInTheDocument()
    expect(mockedCreateSessionFromCabinetGuestBookingRequest).not.toHaveBeenCalled()
  })

  it('blocks slot-less create-session submit when start date format is invalid', async () => {
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 68,
        slot_id: null,
        has_slot: false,
        is_slotless_request: true,
        requested_slot_start: null,
        requested_slot_end: null,
        client_name: 'Invalid Date Guest',
      }),
    ] as any)

    renderView()
    await screen.findByText('Запит без обраного часу')
    await fireEvent.click(screen.getByRole('button', { name: 'Створити сесію' }))

    const dialog = await screen.findByRole('dialog', { name: 'Створити сесію' })
    const modal = within(dialog)
    await waitFor(() => {
      expect(mockedFetchSpecialistProfile).toHaveBeenCalled()
      expect((modal.getByLabelText('Дата') as HTMLInputElement).value).toMatch(/^\d{2}\.\d{2}\.\d{4}$/)
    })
    await fireEvent.update(modal.getByLabelText('Дата'), '31.02.2099')
    await fireEvent.update(modal.getByLabelText('Час початку'), '09:10')
    await fireEvent.click(modal.getByRole('button', { name: 'Створити сесію' }))

    expect(await screen.findByText('Введіть дату у форматі ДД.ММ.РРРР, наприклад 25.06.2026.')).toBeInTheDocument()
    expect(mockedCreateSessionFromCabinetGuestBookingRequest).not.toHaveBeenCalled()
  })

  it('closes slot-less guest request through decline endpoint', async () => {
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 63,
        slot_id: null,
        has_slot: false,
        is_slotless_request: true,
        requested_slot_start: null,
        requested_slot_end: null,
        client_name: 'Close Request Guest',
      }),
    ] as any)

    renderView()
    await screen.findByText('Запит без обраного часу')

    await fireEvent.click(screen.getByRole('button', { name: 'Відхилити запит' }))
    const cancelDialog = await screen.findByRole('dialog', { name: 'Відхилити запит?' })
    expect(mockedDeclineCabinetGuestBookingRequest).not.toHaveBeenCalled()

    await fireEvent.click(within(cancelDialog).getByRole('button', { name: 'Відхилити запит' }))

    await waitFor(() => {
      expect(mockedDeclineCabinetGuestBookingRequest).toHaveBeenCalledWith(63)
    })
    expect(toast.success).toHaveBeenCalledWith('Запит відхилено.')
  })

  it.each(['create', 'confirm'])('shows contact ambiguity without overlap wording for %s-session', async (action) => {
    const isCreate = action === 'create'
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 64, guest_name: 'Ambiguous Guest', client_name: 'Ambiguous Guest',
        ...(isCreate ? { slot_id: null, has_slot: false, is_slotless_request: true,
          requested_slot_start: null, requested_slot_end: null } : {}),
      }),
    ] as any)
    const rejection = { response: { status: 409, data: {
      code: 'CLIENT_RECORD_CONTACT_AMBIGUITY',
      detail: 'Several active client records match this guest contact.',
    } } }
    const mutation = isCreate ? mockedCreateSessionFromCabinetGuestBookingRequest : mockedConfirmCabinetGuestBookingRequestSession
    mutation.mockRejectedValueOnce(rejection)
    renderView()
    await screen.findByText(isCreate ? 'Запит без обраного часу' : 'Ambiguous Guest')
    if (isCreate) {
      await fireEvent.click(screen.getByRole('button', { name: 'Створити сесію' }))
      const modal = within(await screen.findByRole('dialog', { name: 'Створити сесію' }))
      await fireEvent.update(modal.getByLabelText('Дата'), '20.06.2099')
      await fireEvent.update(modal.getByLabelText('Час початку'), '10:00')
      await fireEvent.click(modal.getByRole('button', { name: 'Створити сесію' }))
    } else {
      const card = getGuestRequestCardByName('Ambiguous Guest')
      if (!card.meetingInput) throw new Error('Expected meeting input')
      await fireEvent.update(card.meetingInput, 'https://meet.example.com/ambiguity')
      await fireEvent.click(card.approveButton)
    }
    const copy = 'Не вдалося однозначно визначити картку клієнта: є кілька активних карток із цим контактом. Перевірте дублікати карток клієнта перед створенням сесії.'
    expect(await screen.findAllByText(copy)).toHaveLength(isCreate ? 2 : 1)
    expect(mutation).toHaveBeenCalledTimes(1)
    expect(mutation).toHaveBeenCalledWith(64, expect.any(Object))
    expect(screen.queryByText(/цей час перетинається/)).not.toBeInTheDocument()
    expect(screen.queryByText('Several active client records match this guest contact.')).not.toBeInTheDocument()
    expect(mockedGetApiErrorMessage).not.toHaveBeenCalledWith(rejection, expect.any(String))
    expect(toast.success).not.toHaveBeenCalled()
  })

  it.each(['MANUAL_SESSION_TIME_CONFLICT', 'SESSION_OVERLAP'])('shows Ukrainian conflict error for slot-less create-session %s', async (code) => {
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 64,
        slot_id: null,
        has_slot: false,
        is_slotless_request: true,
        requested_slot_start: null,
        requested_slot_end: null,
        client_name: 'Conflict Guest',
      }),
    ] as any)
    mockedCreateSessionFromCabinetGuestBookingRequest.mockRejectedValueOnce({
      response: {
        status: 409,
        data: {
          code,
        },
      },
    })

    renderView()
    await screen.findByText('Запит без обраного часу')
    await fireEvent.click(screen.getByRole('button', { name: 'Створити сесію' }))

    const dialog = await screen.findByRole('dialog', { name: 'Створити сесію' })
    const modal = within(dialog)
    await fireEvent.update(modal.getByLabelText('Дата'), '20.06.2099')
    await fireEvent.update(modal.getByLabelText('Час початку'), '10:00')
    await fireEvent.click(modal.getByRole('button', { name: 'Створити сесію' }))

    expect(
      await screen.findAllByText('Не вдалося створити сесію: цей час перетинається з іншою сесією або недоступністю.')
    ).toHaveLength(2)
  })

  it('blocks slot-less create-session submit when selected time is in the past', async () => {
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 65,
        slot_id: null,
        has_slot: false,
        is_slotless_request: true,
        requested_slot_start: null,
        requested_slot_end: null,
        client_name: 'Past Time Guest',
      }),
    ] as any)

    renderView()
    await screen.findByText('Запит без обраного часу')
    await fireEvent.click(screen.getByRole('button', { name: 'Створити сесію' }))

    const dialog = await screen.findByRole('dialog', { name: 'Створити сесію' })
    const modal = within(dialog)
    await fireEvent.update(modal.getByLabelText('Дата'), '01.01.2000')
    await fireEvent.update(modal.getByLabelText('Час початку'), '10:00')
    await fireEvent.click(modal.getByRole('button', { name: 'Створити сесію' }))

    expect(
      await screen.findByText('Неможливо створити сесію в минулому. Оберіть майбутню дату або час.')
    ).toBeInTheDocument()
    expect(mockedCreateSessionFromCabinetGuestBookingRequest).not.toHaveBeenCalled()
    expect(screen.queryByText(/detail:/i)).not.toBeInTheDocument()
  })

  it('localizes backend past-time detail for slot-less create-session failure', async () => {
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 66,
        slot_id: null,
        has_slot: false,
        is_slotless_request: true,
        requested_slot_start: null,
        requested_slot_end: null,
        client_name: 'Backend Past Time Guest',
      }),
    ] as any)
    mockedCreateSessionFromCabinetGuestBookingRequest.mockRejectedValueOnce({
      response: {
        data: {
          detail: 'Session time is in the past.',
        },
      },
    })

    renderView()
    await screen.findByText('Запит без обраного часу')
    await fireEvent.click(screen.getByRole('button', { name: 'Створити сесію' }))

    const dialog = await screen.findByRole('dialog', { name: 'Створити сесію' })
    const modal = within(dialog)
    await fireEvent.update(modal.getByLabelText('Дата'), '20.06.2099')
    await fireEvent.update(modal.getByLabelText('Час початку'), '10:00')
    await fireEvent.click(modal.getByRole('button', { name: 'Створити сесію' }))

    expect(
      await screen.findAllByText('Неможливо створити сесію в минулому. Оберіть майбутню дату або час.')
    ).toHaveLength(2)
    expect(screen.queryByText(/Session time is in the past/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/detail:/i)).not.toBeInTheDocument()
  })
})

describe('ExternalSessionsView guest request micro-polish', () => {
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
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([])
    mockedApproveCabinetGuestBookingRequest.mockResolvedValue({
      request: buildGuestRequest({
        id: 51,
        status: 'approved',
        external_session_id: 99,
        approved_at: '2099-06-16T11:00:00Z',
      }),
      external_session: null,
      invite: null,
    } as any)
    mockedConfirmCabinetGuestBookingRequestSession.mockResolvedValue({
      request: buildGuestRequest({
        id: 51,
        status: 'approved',
        session_id: 701,
        external_session_id: null,
        approved_at: '2099-06-16T11:00:00Z',
      }),
      session: {
        id: 701,
      },
    } as any)
    mockedDeclineCabinetGuestBookingRequest.mockResolvedValue({
      id: 51,
      status: 'declined',
    } as any)
  })

  it('shows approve failure inline only on the affected card', async () => {
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 51,
        guest_name: 'Guest One',
        session_format: 'online',
        contact_channel: 'email',
      }),
      buildGuestRequest({
        id: 52,
        guest_name: 'Guest Two',
        session_format: 'offline',
        contact_channel: 'phone',
        contact_value: '+380501112233',
        offline_location_snapshot: 'Kyiv',
      }),
    ] as any)
    mockedConfirmCabinetGuestBookingRequestSession.mockRejectedValueOnce(new Error('approve failed'))

    renderView()
    await screen.findByText('Guest One')

    const firstCard = getGuestRequestCardByName('Guest One')
    const secondCard = getGuestRequestCardByName('Guest Two')
    if (!firstCard.meetingInput) {
      throw new Error('Expected online meeting input for Guest One')
    }

    await fireEvent.update(firstCard.meetingInput, 'https://meet.google.com/failure-case')
    await fireEvent.click(firstCard.approveButton)

    await waitFor(() => {
      expect(firstCard.card.querySelector('.request-card__error')).not.toBeNull()
    })
    expect(secondCard.card.querySelector('.request-card__error')).toBeNull()
    expect(secondCard.approveButton).not.toBeDisabled()
    expect(secondCard.declineButton).not.toBeDisabled()
  })

  it('localizes known slot-unavailable backend message for inline approve error', async () => {
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 51,
        guest_name: 'Guest One',
        session_format: 'online',
        contact_channel: 'email',
      }),
    ] as any)
    mockedConfirmCabinetGuestBookingRequestSession.mockRejectedValueOnce(new Error('slot unavailable'))
    mockedGetApiErrorMessage.mockReturnValueOnce('Requested slot is no longer available.')

    renderView()
    await screen.findByText('Guest One')

    const firstCard = getGuestRequestCardByName('Guest One')
    if (!firstCard.meetingInput) {
      throw new Error('Expected online meeting input for Guest One')
    }

    await fireEvent.update(firstCard.meetingInput, 'https://meet.google.com/slot-unavailable')
    await fireEvent.click(firstCard.approveButton)

    expect(await screen.findByText('Цей слот більше недоступний.')).toBeInTheDocument()
    expect(screen.queryByText('Цей слот більше недоступний. Оновіть список запитів без реєстрації.')).not.toBeInTheDocument()
    expect(screen.queryByText('Requested slot is no longer available.')).not.toBeInTheDocument()
  })

  it('shows decline failure inline only on the affected card', async () => {
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 52,
        guest_name: 'Guest One',
        session_format: 'offline',
        contact_channel: 'phone',
        contact_value: '+380501112233',
        offline_location_snapshot: 'Kyiv',
      }),
      buildGuestRequest({
        id: 53,
        slot_id: 303,
        requested_slot_start: '2099-06-18T15:00:00Z',
        requested_slot_end: '2099-06-18T15:50:00Z',
        guest_name: 'Guest Two',
        session_format: 'offline',
        contact_channel: 'phone',
        contact_value: '+380501113344',
        offline_location_snapshot: 'Lviv',
      }),
    ] as any)
    mockedDeclineCabinetGuestBookingRequest.mockRejectedValueOnce(new Error('decline failed'))

    renderView()
    await screen.findByText('Guest One')

    const firstCard = getGuestRequestCardByName('Guest One')
    const secondCard = getGuestRequestCardByName('Guest Two')

    await fireEvent.click(firstCard.declineButton)
    const cancelDialog = await screen.findByRole('dialog', { name: 'Відхилити запит?' })
    expect(mockedDeclineCabinetGuestBookingRequest).not.toHaveBeenCalled()
    await fireEvent.click(within(cancelDialog).getByRole('button', { name: 'Відхилити запит' }))

    await waitFor(() => {
      expect(firstCard.card.querySelector('.request-card__error')).not.toBeNull()
    })
    expect(secondCard.card.querySelector('.request-card__error')).toBeNull()
    expect(secondCard.approveButton).not.toBeDisabled()
    expect(secondCard.declineButton).not.toBeDisabled()
  })

  it('keeps approve loading/disabled local to one card and one action', async () => {
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 51,
        guest_name: 'Guest One',
        session_format: 'online',
      }),
      buildGuestRequest({
        id: 52,
        guest_name: 'Guest Two',
        session_format: 'offline',
        contact_channel: 'phone',
        contact_value: '+380501112233',
        offline_location_snapshot: 'Kyiv',
      }),
    ] as any)

    const pendingApprove = createDeferred<any>()
    mockedConfirmCabinetGuestBookingRequestSession.mockImplementationOnce(() => pendingApprove.promise)

    renderView()
    await screen.findByText('Guest One')

    const firstCard = getGuestRequestCardByName('Guest One')
    const secondCard = getGuestRequestCardByName('Guest Two')
    if (!firstCard.meetingInput) {
      throw new Error('Expected online meeting input for Guest One')
    }

    await fireEvent.update(firstCard.meetingInput, 'https://meet.google.com/pending-approve')
    await fireEvent.click(firstCard.approveButton)

    await waitFor(() => {
      expect(mockedConfirmCabinetGuestBookingRequestSession).toHaveBeenCalledWith(51, {
        meeting_url: 'https://meet.google.com/pending-approve',
      })
    })
    expect(mockedApproveCabinetGuestBookingRequest).not.toHaveBeenCalled()

    expect(firstCard.approveButton).toBeDisabled()
    expect(firstCard.declineButton).not.toBeDisabled()
    expect(secondCard.approveButton).not.toBeDisabled()
    expect(secondCard.declineButton).not.toBeDisabled()

    pendingApprove.resolve({
      request: buildGuestRequest({ id: 51, status: 'approved' }),
      session: { id: 701 },
    } as any)

    await waitFor(() => {
      expect(mockedFetchCabinetGuestBookingRequests).toHaveBeenCalledTimes(2)
    })
  })

  it('keeps decline loading/disabled local to one card and one action', async () => {
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([
      buildGuestRequest({
        id: 51,
        guest_name: 'Guest One',
        session_format: 'offline',
        contact_channel: 'phone',
        contact_value: '+380501112233',
        offline_location_snapshot: 'Kyiv',
      }),
      buildGuestRequest({
        id: 52,
        guest_name: 'Guest Two',
        session_format: 'offline',
        contact_channel: 'phone',
        contact_value: '+380501113344',
        offline_location_snapshot: 'Lviv',
      }),
    ] as any)

    const pendingDecline = createDeferred<any>()
    mockedDeclineCabinetGuestBookingRequest.mockImplementationOnce(() => pendingDecline.promise)

    renderView()
    await screen.findByText('Guest One')

    const firstCard = getGuestRequestCardByName('Guest One')
    const secondCard = getGuestRequestCardByName('Guest Two')

    await fireEvent.click(firstCard.declineButton)
    const cancelDialog = await screen.findByRole('dialog', { name: 'Відхилити запит?' })
    expect(mockedDeclineCabinetGuestBookingRequest).not.toHaveBeenCalled()
    await fireEvent.click(within(cancelDialog).getByRole('button', { name: 'Відхилити запит' }))

    await waitFor(() => {
      expect(mockedDeclineCabinetGuestBookingRequest).toHaveBeenCalledWith(51)
    })

    expect(firstCard.declineButton).toBeDisabled()
    expect(firstCard.approveButton).not.toBeDisabled()
    expect(secondCard.approveButton).not.toBeDisabled()
    expect(secondCard.declineButton).not.toBeDisabled()

    pendingDecline.resolve({
      id: 51,
      status: 'declined',
    } as any)

    await waitFor(() => {
      expect(mockedFetchCabinetGuestBookingRequests).toHaveBeenCalledTimes(2)
    })
  })
})
