import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ExternalSessionsView from './ExternalSessionsView.vue'
import {
  approveCabinetGuestBookingRequest,
  createExternalSession,
  declineCabinetGuestBookingRequest,
  fetchCabinetGuestBookingRequests,
  fetchExternalSessions,
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
    approveCabinetGuestBookingRequest: vi.fn(),
    fetchExternalSessions: vi.fn(),
    fetchCabinetGuestBookingRequests: vi.fn(),
    createExternalSession: vi.fn(),
    declineCabinetGuestBookingRequest: vi.fn(),
    getApiErrorMessage: vi.fn((_error: unknown, fallback: string) => fallback),
  }
})

const mockedApproveCabinetGuestBookingRequest = vi.mocked(approveCabinetGuestBookingRequest)
const mockedFetchExternalSessions = vi.mocked(fetchExternalSessions)
const mockedFetchCabinetGuestBookingRequests = vi.mocked(fetchCabinetGuestBookingRequests)
const mockedCreateExternalSession = vi.mocked(createExternalSession)
const mockedDeclineCabinetGuestBookingRequest = vi.mocked(declineCabinetGuestBookingRequest)

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
    mockedFetchCabinetGuestBookingRequests.mockResolvedValue([])
    mockedCreateExternalSession.mockReset()
    mockedDeclineCabinetGuestBookingRequest.mockResolvedValue({
      id: 51,
      status: 'declined',
    } as any)
  })

  it('renders external sessions list and empty guest requests state', async () => {
    const { container } = renderView()

    expect(await screen.findByText('Ваші зовнішні сесії')).toBeInTheDocument()
    expect(await screen.findByText('Немає нових гостьових запитів.')).toBeInTheDocument()
    const detailLink = await screen.findByRole('link', { name: 'Деталі' })
    expect(container.querySelector('input[type="datetime-local"]')).not.toBeInTheDocument()
    expect(container.querySelector('input[type="date"]')).toBeInTheDocument()
    const timeInput = container.querySelector('input[inputmode="numeric"]')
    expect(timeInput).toBeInTheDocument()
    expect(timeInput).toHaveAttribute('list', 'external-session-time-options')
    const options = Array.from(container.querySelectorAll('datalist#external-session-time-options option')).map((item) =>
      item.getAttribute('value')
    )
    expect(options[0]).toBe('00:00')
    expect(options[1]).toBe('00:15')
    expect(options[95]).toBe('23:45')
    expect(screen.getAllByText('Зовнішні сесії').length).toBeGreaterThan(0)
    expect(detailLink).toHaveAttribute('href', '/cabinet/external-sessions/8')
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
    await screen.findByText('Нова зовнішня сесія')

    const dateInput = container.querySelector('input[type="date"]')
    const timeInput = container.querySelector('input[inputmode="numeric"]')
    if (!dateInput || !timeInput) {
      throw new Error('Missing start date/time fields')
    }

    await fireEvent.update(dateInput, '2099-06-16')
    await fireEvent.update(timeInput, '12:30')
    await fireEvent.update(screen.getByLabelText('Посилання на зустріч'), 'https://meet.google.com/new-room')
    await fireEvent.update(screen.getByLabelText("Ім'я гостя (опційно)"), 'Guest Name')
    await fireEvent.update(screen.getByLabelText('Email гостя (опційно)'), 'guest@example.com')
    await fireEvent.click(screen.getByRole('button', { name: 'Створити зовнішню сесію' }))

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

    const { container } = renderView()
    await screen.findByText('Нова зовнішня сесія')

    const dateInput = container.querySelector('input[type="date"]')
    const timeInput = container.querySelector('input[inputmode="numeric"]')
    if (!dateInput || !timeInput) {
      throw new Error('Missing start date/time fields')
    }

    await fireEvent.update(screen.getByLabelText('Формат'), 'offline')
    await fireEvent.update(dateInput, '2099-06-16')
    await fireEvent.update(timeInput, '12:30')
    await fireEvent.update(screen.getByLabelText('Локація'), 'Kyiv office')
    await fireEvent.click(screen.getByRole('button', { name: 'Створити зовнішню сесію' }))

    await waitFor(() => {
      expect(mockedCreateExternalSession).toHaveBeenCalledTimes(1)
    })

    const payload = mockedCreateExternalSession.mock.calls[0]?.[0]
    expect(payload?.session_format).toBe('offline')
    expect(payload?.meeting_url).toBeNull()
    expect(payload?.offline_location_snapshot).toBe('Kyiv office')
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

    expect(await screen.findByText('Гостьові запити')).toBeInTheDocument()
    expect(await screen.findByText('Очікує рішення')).toBeInTheDocument()
    expect(await screen.findByLabelText('Посилання на онлайн-зустріч')).toBeInTheDocument()
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

    const sessionLink = await screen.findByRole('link', { name: 'Відкрити зовнішню сесію' })
    expect(sessionLink).toHaveAttribute('href', '/cabinet/external-sessions/99')
    expect(screen.getByRole('link', { name: 'Відкрити гостьовий лінк' })).toHaveAttribute(
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
  })
})
