import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ExternalSessionsView from './ExternalSessionsView.vue'
import {
  apiGet,
  approveCabinetGuestBookingRequest,
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
    apiGet: vi.fn(),
    approveCabinetGuestBookingRequest: vi.fn(),
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

  const buttons = card.querySelectorAll('button')
  if (buttons.length < 2) {
    throw new Error(`Expected approve/decline buttons for ${guestName}`)
  }

  return {
    card,
    approveButton: buttons[0] as HTMLButtonElement,
    declineButton: buttons[1] as HTMLButtonElement,
    meetingInput: card.querySelector('input[type="url"]') as HTMLInputElement | null,
  }
}

function getGuestRequestCardByText(text: string) {
  const node = screen.getByText(text)
  const card = node.closest('.request-card')
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
    mockedApiGet.mockResolvedValue({
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
    } as any)
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([])
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
    expect(screen.getAllByText('Сесії без реєстрації').length).toBeGreaterThan(0)
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
    expect(guestRequestsPanel).toHaveTextContent('Клієнт залишив запит без бронювання конкретного слота.')
    expect(guestRequestsPanel).toHaveTextContent('Тривога')
    expect(guestRequestsPanel).toHaveTextContent('Стосунки')
    expect(within(guestRequestsPanel as HTMLElement).getByRole('button', { name: 'Створити сесію' })).toBeInTheDocument()
    expect(within(guestRequestsPanel as HTMLElement).getByRole('button', { name: 'Закрити запит' })).toBeInTheDocument()
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
    expect(await screen.findByText('Очікує рішення')).toBeInTheDocument()
    const meetingInput = await screen.findByLabelText('Посилання на онлайн-зустріч')
    const approveButton = screen.getByRole('button', { name: 'Погодити' })
    expect(approveButton).toBeDisabled()
    expect(await screen.findByText('Щоб погодити онлайн-запит, додайте посилання на зустріч.')).toBeInTheDocument()

    await fireEvent.update(meetingInput, 'https://meet.google.com/helper-check')

    await waitFor(() => {
      expect(approveButton).not.toBeDisabled()
    })
    expect(screen.queryByText('Щоб погодити онлайн-запит, додайте посилання на зустріч.')).not.toBeInTheDocument()
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
          external_session_id: 99,
          created_at: '2099-06-16T10:00:00Z',
          updated_at: '2099-06-16T11:00:00Z',
        },
      ] as any)

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
        external_session_id: 99,
        created_at: '2099-06-16T10:00:00Z',
        updated_at: '2099-06-16T11:00:00Z',
      },
      external_session: null,
      invite: {
        status: 'active',
        expires_at: '2099-06-18T13:50:00Z',
        created_at: '2099-06-16T11:00:00Z',
        revoked_at: null,
        last_opened_at: null,
        joined_at: null,
        invite_url: 'https://proconsult.space/guest/external-session/token',
      },
    } as any)

    renderView()
    expect(await screen.findByText('Очікує рішення')).toBeInTheDocument()

    await fireEvent.update(
      screen.getByLabelText('Посилання на онлайн-зустріч'),
      'https://meet.google.com/new-guest-link'
    )
    await fireEvent.click(screen.getByRole('button', { name: 'Погодити' }))

    await waitFor(() => {
      expect(mockedApproveCabinetGuestBookingRequest).toHaveBeenCalledWith(51, {
        meeting_url: 'https://meet.google.com/new-guest-link',
      })
    })

    const sessionLink = await screen.findByRole('link', { name: 'Відкрити сесію без реєстрації' })
    expect(sessionLink).toHaveAttribute('href', '/cabinet/external-sessions/99')
    expect(await screen.findByText('На основі цього запиту створено сесію без реєстрації.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Посилання без реєстрації' })).toHaveAttribute(
      'href',
      'https://proconsult.space/guest/external-session/token'
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
    expect(await screen.findByText('Очікує рішення')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Відхилити' }))

    await waitFor(() => {
      expect(mockedDeclineCabinetGuestBookingRequest).toHaveBeenCalledWith(52)
    })
    expect(await screen.findByText('Відхилено')).toBeInTheDocument()
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
    expect(card).toHaveTextContent('Клієнт залишив запит без бронювання конкретного слота. Узгодьте час і створіть сесію вручну.')
    expect(card).toHaveTextContent('Клієнт: Slotless Guest')
    expect(card).toHaveTextContent('Ел. пошта: slotless@example.com')
    expect(card).toHaveTextContent('Телефон: +380501234567')
    expect(card).toHaveTextContent('Коментар: Можу після обіду')
    expect(within(card as HTMLElement).getByRole('button', { name: 'Створити сесію' })).toBeInTheDocument()
    expect(within(card as HTMLElement).getByRole('button', { name: 'Закрити запит' })).toBeInTheDocument()
    expect(within(card as HTMLElement).queryByRole('button', { name: 'Погодити' })).not.toBeInTheDocument()
    expect(card).not.toHaveTextContent('Запитаний слот:')
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
    expect(modal.getByLabelText('Дата')).toBeInTheDocument()

    await fireEvent.update(modal.getByLabelText('Дата'), '2099-06-20')
    await fireEvent.update(modal.getByLabelText('Час початку'), '10:00')
    await fireEvent.update(modal.getByLabelText('Тривалість'), '50')
    await fireEvent.update(modal.getByLabelText('Посилання на онлайн-зустріч'), 'https://meet.google.com/manual')
    await fireEvent.click(modal.getByRole('button', { name: 'Створити сесію' }))

    const expectedStartsAt = new Date('2099-06-20T10:00').toISOString()
    const expectedEndsAt = new Date(new Date('2099-06-20T10:00').getTime() + 50 * 60000).toISOString()

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
    expect(toast.success).toHaveBeenCalledWith('Сесію створено. Запит закрито.')
    expect(mockedFetchCabinetGuestBookingRequests).toHaveBeenCalledTimes(2)
    expect(mockedFetchExternalSessions).toHaveBeenCalledTimes(2)
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

    await fireEvent.click(screen.getByRole('button', { name: 'Закрити запит' }))

    await waitFor(() => {
      expect(mockedDeclineCabinetGuestBookingRequest).toHaveBeenCalledWith(63)
    })
    expect(toast.success).toHaveBeenCalledWith('Запит закрито.')
  })

  it('shows Ukrainian conflict error for slot-less create-session failure', async () => {
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
        data: {
          code: 'MANUAL_SESSION_TIME_CONFLICT',
        },
      },
    })

    renderView()
    await screen.findByText('Запит без обраного часу')
    await fireEvent.click(screen.getByRole('button', { name: 'Створити сесію' }))

    const dialog = await screen.findByRole('dialog', { name: 'Створити сесію' })
    const modal = within(dialog)
    await fireEvent.update(modal.getByLabelText('Дата'), '2099-06-20')
    await fireEvent.update(modal.getByLabelText('Час початку'), '10:00')
    await fireEvent.click(modal.getByRole('button', { name: 'Створити сесію' }))

    expect(
      await screen.findAllByText('Не вдалося створити сесію: цей час перетинається з іншою сесією або недоступністю.')
    ).toHaveLength(2)
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
    mockedApproveCabinetGuestBookingRequest.mockRejectedValueOnce(new Error('approve failed'))

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
    mockedApproveCabinetGuestBookingRequest.mockRejectedValueOnce(new Error('slot unavailable'))
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
    mockedApproveCabinetGuestBookingRequest.mockImplementationOnce(() => pendingApprove.promise)

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
      expect(mockedApproveCabinetGuestBookingRequest).toHaveBeenCalledWith(51, {
        meeting_url: 'https://meet.google.com/pending-approve',
      })
    })

    expect(firstCard.approveButton).toBeDisabled()
    expect(firstCard.declineButton).not.toBeDisabled()
    expect(secondCard.approveButton).not.toBeDisabled()
    expect(secondCard.declineButton).not.toBeDisabled()

    pendingApprove.resolve({
      request: buildGuestRequest({ id: 51, status: 'approved' }),
      external_session: null,
      invite: null,
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
