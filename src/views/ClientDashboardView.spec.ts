import { render, screen, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, fetchInquiryState, fetchPublicSpecialistProfile, type InquiryState } from '../lib/api'
import ClientDashboardView from './ClientDashboardView.vue'

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
  fetchInquiryState: vi.fn(),
  fetchPublicSpecialistProfile: vi.fn(),
}))

vi.mock('../composables/useConfirmModal', () => ({
  useConfirmModal: () => ({
    open: false,
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    tone: 'default',
    confirm: vi.fn(),
    closeConfirm: vi.fn(),
    openConfirm: vi.fn(),
  }),
}))

const mockedApiGet = vi.mocked(apiGet)
const mockedFetchInquiryState = vi.mocked(fetchInquiryState)
const mockedFetchPublicSpecialistProfile = vi.mocked(fetchPublicSpecialistProfile)

async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

function buildInquiryState(overrides?: Partial<InquiryState>): InquiryState {
  return {
    specialist_id: 1,
    inquiry_id: null,
    inquiry_exists: false,
    inquiry_status: 'NOT_CREATED',
    can_create_inquiry: true,
    create_reason_code: null,
    can_client_send: false,
    client_send_reason_code: 'INQUIRY_NOT_FOUND',
    can_specialist_reply: false,
    specialist_reply_reason_code: 'WAIT_FOR_CLIENT_MESSAGE',
    ...overrides,
  }
}

function renderView() {
  return render(ClientDashboardView, {
    global: {
      stubs: {
        ConfirmModal: true,
        RouterLink: {
          props: ['to'],
          template: '<a :href="typeof to === \'string\' ? to : \'\'"><slot /></a>',
        },
      },
    },
  })
}

describe('ClientDashboardView', () => {
  beforeEach(() => {
    vi.useRealTimers()
    mockedApiGet.mockReset()
    mockedFetchInquiryState.mockReset()
    mockedFetchPublicSpecialistProfile.mockReset()
    localStorage.clear()
  })

  it('shows join actions for upcoming online sessions when the payload has an external meeting link', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && config?.params?.upcoming === true) {
        return [
          {
            id: 88,
            status: 'CONFIRMED',
            specialist: 14,
            therapist_name: 'Олена',
            therapist_public_slug: 'olena',
            meeting_url: 'https://meet.google.com/room-123',
            meeting_provider: 'google_meet',
            slot: null,
            slot_start_at: '2099-06-15T10:00:00Z',
            slot_end_at: '2099-06-15T11:00:00Z',
          },
        ]
      }
      if (url === '/booking/sessions/' && config?.params?.upcoming === false) {
        return []
      }
      if (url === '/booking/group-events/') {
        return []
      }
      throw new Error(`Unexpected apiGet call: ${url} ${JSON.stringify(config)}`)
    })

    renderView()

    expect(await screen.findAllByText('Онлайн-зустріч: Google Meet')).not.toHaveLength(0)
    expect(screen.getAllByRole('link', { name: 'Приєднатися' })).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: 'Приєднатися' })[0]).toHaveAttribute(
      'href',
      'https://meet.google.com/room-123'
    )
  })

  it('shows offline format badge and hides join action for offline sessions', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && config?.params?.upcoming === true) {
        return [
          {
            id: 188,
            status: 'CONFIRMED',
            specialist: 14,
            specialist_name: 'Олена',
            specialist_public_slug: 'olena',
            session_format: 'offline',
            offline_location: 'Львів, кабінет 7',
            meeting_url: 'https://meet.google.com/offline-ignored',
            meeting_provider: 'google_meet',
            join_available: true,
            slot: null,
            slot_start_at: '2099-06-15T10:00:00Z',
            slot_end_at: '2099-06-15T11:00:00Z',
          },
        ]
      }
      if (url === '/booking/sessions/' && config?.params?.upcoming === false) {
        return []
      }
      if (url === '/booking/group-events/') {
        return []
      }
      throw new Error(`Unexpected apiGet call: ${url} ${JSON.stringify(config)}`)
    })

    renderView()

    expect(await screen.findAllByText('Формат: Офлайн')).not.toHaveLength(0)
    expect(screen.getAllByText('Офлайн-сесія: Львів, кабінет 7')).not.toHaveLength(0)
    expect(screen.queryByRole('link', { name: 'Приєднатися' })).not.toBeInTheDocument()
  })

  it('shows explicit no-link state for active sessions without meeting_url', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && config?.params?.upcoming === true) {
        return [
          {
            id: 89,
            status: 'SCHEDULED',
            specialist: 14,
            specialist_name: 'Олена',
            specialist_public_slug: 'olena',
            meeting_url: null,
            meeting_provider: null,
            join_available: false,
            slot: null,
            slot_start_at: '2099-06-15T10:00:00Z',
            slot_end_at: '2099-06-15T11:00:00Z',
          },
        ]
      }
      if (url === '/booking/sessions/' && config?.params?.upcoming === false) {
        return []
      }
      if (url === '/booking/group-events/') {
        return []
      }
      throw new Error(`Unexpected apiGet call: ${url} ${JSON.stringify(config)}`)
    })

    renderView()

    expect(await screen.findAllByText('Онлайн-зустріч: посилання ще не додано')).not.toHaveLength(0)
    expect(screen.queryByRole('link', { name: 'Приєднатися' })).not.toBeInTheDocument()
  })

  it('shows waiting-to-join state when meeting link exists but join is not available', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && config?.params?.upcoming === true) {
        return [
          {
            id: 90,
            status: 'CONFIRMED',
            specialist: 14,
            specialist_name: 'Олена',
            specialist_public_slug: 'olena',
            meeting_url: 'https://meet.google.com/locked-room',
            meeting_provider: 'google_meet',
            join_available: false,
            slot: null,
            slot_start_at: '2099-06-15T10:00:00Z',
            slot_end_at: '2099-06-15T11:00:00Z',
          },
        ]
      }
      if (url === '/booking/sessions/' && config?.params?.upcoming === false) {
        return []
      }
      if (url === '/booking/group-events/') {
        return []
      }
      throw new Error(`Unexpected apiGet call: ${url} ${JSON.stringify(config)}`)
    })

    renderView()

    expect(
      await screen.findAllByText('Онлайн-зустріч: Google Meet · приєднання стане доступним ближче до часу сесії')
    ).not.toHaveLength(0)
    expect(screen.queryByRole('link', { name: 'Приєднатися' })).not.toBeInTheDocument()
  })

  it('prioritizes a live session card and keeps direct join as primary CTA', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && config?.params?.upcoming === true) {
        return [
          {
            id: 101,
            status: 'CONFIRMED',
            specialist: 14,
            specialist_name: 'Олена',
            specialist_public_slug: 'olena',
            meeting_url: 'https://meet.google.com/live-room',
            meeting_provider: 'google_meet',
            join_available: true,
            join_starts_at: '2000-01-01T00:00:00Z',
            join_ends_at: '2100-01-01T00:00:00Z',
            slot: null,
            slot_start_at: '2000-01-01T00:00:00Z',
            slot_end_at: '2100-01-01T00:00:00Z',
          },
          {
            id: 102,
            status: 'CONFIRMED',
            specialist: 15,
            specialist_name: 'Іван',
            specialist_public_slug: 'ivan',
            meeting_url: 'https://meet.google.com/next-room',
            meeting_provider: 'google_meet',
            join_available: true,
            join_starts_at: '2099-06-16T09:00:00Z',
            join_ends_at: '2099-06-16T10:00:00Z',
            slot: null,
            slot_start_at: '2099-06-16T09:00:00Z',
            slot_end_at: '2099-06-16T10:00:00Z',
          },
        ]
      }
      if (url === '/booking/sessions/' && config?.params?.upcoming === false) {
        return []
      }
      if (url === '/booking/group-events/') {
        return []
      }
      throw new Error(`Unexpected apiGet call: ${url} ${JSON.stringify(config)}`)
    })

    const view = renderView()

    expect(await screen.findByRole('link', { name: 'Сесія триває' })).toHaveAttribute(
      'href',
      '/client/sessions/101'
    )

    const priorityCard = view.container.querySelector('.priority-card')
    expect(priorityCard).toBeInTheDocument()
    expect(within(priorityCard as HTMLElement).getByRole('link', { name: 'Приєднатися' })).toHaveAttribute(
      'href',
      'https://meet.google.com/live-room'
    )
    expect(within(priorityCard as HTMLElement).getByRole('link', { name: 'Деталі сесії' })).toHaveAttribute(
      'href',
      '/client/sessions/101'
    )
    expect(within(priorityCard as HTMLElement).getByRole('link', { name: 'Усі найближчі' })).toHaveAttribute(
      'href',
      '#upcoming-sessions'
    )
    expect(within(priorityCard as HTMLElement).getByRole('link', { name: 'Профіль спеціаліста' })).toHaveAttribute(
      'href',
      '/s/olena'
    )
  })

  it('keeps live marker when active confirmed session is returned in past list', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && config?.params?.upcoming === true) {
        return []
      }
      if (url === '/booking/sessions/' && config?.params?.upcoming === false) {
        return [
          {
            id: 201,
            status: 'CONFIRMED',
            specialist: 14,
            specialist_name: 'Олена',
            specialist_public_slug: 'olena',
            meeting_url: 'https://meet.google.com/live-from-past',
            meeting_provider: 'google_meet',
            join_available: true,
            join_starts_at: '2000-01-01T00:00:00Z',
            join_ends_at: '2100-01-01T00:00:00Z',
            slot: null,
            slot_start_at: '2000-01-01T00:00:00Z',
            slot_end_at: '2100-01-01T00:00:00Z',
          },
        ]
      }
      if (url === '/booking/group-events/') {
        return []
      }
      throw new Error(`Unexpected apiGet call: ${url} ${JSON.stringify(config)}`)
    })

    renderView()

    expect(await screen.findByRole('link', { name: 'Сесія триває' })).toHaveAttribute(
      'href',
      '/client/sessions/201'
    )
    expect(screen.getByRole('link', { name: 'Приєднатися' })).toHaveAttribute(
      'href',
      'https://meet.google.com/live-from-past'
    )
  })

  it('shows live marker for scheduled in-progress session', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && config?.params?.upcoming === true) {
        return []
      }
      if (url === '/booking/sessions/' && config?.params?.upcoming === false) {
        return [
          {
            id: 202,
            status: 'SCHEDULED',
            specialist: 14,
            specialist_name: 'Олена',
            specialist_public_slug: 'olena',
            meeting_url: null,
            meeting_provider: null,
            join_available: false,
            slot: null,
            slot_start_at: '2000-01-01T00:00:00Z',
            slot_end_at: '2100-01-01T00:00:00Z',
          },
        ]
      }
      if (url === '/booking/group-events/') {
        return []
      }
      throw new Error(`Unexpected apiGet call: ${url} ${JSON.stringify(config)}`)
    })

    renderView()

    expect(await screen.findByRole('link', { name: 'Сесія триває' })).toHaveAttribute(
      'href',
      '/client/sessions/202'
    )
  })

  it('does not mark session as live before actual start even when join window is open', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && config?.params?.upcoming === true) {
        return [
          {
            id: 203,
            status: 'CONFIRMED',
            specialist: 14,
            specialist_name: 'Олена',
            specialist_public_slug: 'olena',
            meeting_url: 'https://meet.google.com/wait-room',
            meeting_provider: 'google_meet',
            join_available: true,
            join_starts_at: '2000-01-01T00:00:00Z',
            join_ends_at: '2100-01-01T00:00:00Z',
            slot: null,
            slot_start_at: '2099-06-16T09:00:00Z',
            slot_end_at: '2099-06-16T10:00:00Z',
          },
        ]
      }
      if (url === '/booking/sessions/' && config?.params?.upcoming === false) {
        return []
      }
      if (url === '/booking/group-events/') {
        return []
      }
      throw new Error(`Unexpected apiGet call: ${url} ${JSON.stringify(config)}`)
    })

    renderView()

    expect(await screen.findByRole('link', { name: 'Найближча сесія' })).toHaveAttribute(
      'href',
      '/client/sessions/203'
    )
    expect(screen.queryByRole('link', { name: 'Сесія триває' })).not.toBeInTheDocument()
  })

  it('shows compact same-day summary when more sessions are planned for today', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15T08:00:00Z'))

    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && config?.params?.upcoming === true) {
        return [
          {
            id: 301,
            status: 'CONFIRMED',
            specialist: 14,
            specialist_name: 'Олена',
            specialist_public_slug: 'olena',
            meeting_url: null,
            meeting_provider: null,
            slot: null,
            slot_start_at: '2026-01-15T10:00:00Z',
            slot_end_at: '2026-01-15T11:00:00Z',
          },
          {
            id: 302,
            status: 'SCHEDULED',
            specialist: 15,
            specialist_name: 'Іван',
            specialist_public_slug: 'ivan',
            meeting_url: null,
            meeting_provider: null,
            slot: null,
            slot_start_at: '2026-01-15T12:00:00Z',
            slot_end_at: '2026-01-15T13:00:00Z',
          },
          {
            id: 303,
            status: 'SCHEDULED',
            specialist: 16,
            specialist_name: 'Марія',
            specialist_public_slug: 'maria',
            meeting_url: null,
            meeting_provider: null,
            slot: null,
            slot_start_at: '2026-01-15T16:00:00Z',
            slot_end_at: '2026-01-15T17:00:00Z',
          },
        ]
      }
      if (url === '/booking/sessions/' && config?.params?.upcoming === false) {
        return []
      }
      if (url === '/booking/group-events/') {
        return []
      }
      throw new Error(`Unexpected apiGet call: ${url} ${JSON.stringify(config)}`)
    })

    renderView()

    expect(await screen.findByText('Сьогодні ще 2 зустрічі')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Іван/i })).toHaveAttribute('href', '/client/sessions/302')
    expect(screen.getByRole('link', { name: /Марія/i })).toHaveAttribute('href', '/client/sessions/303')
    expect(screen.getByRole('link', { name: 'Усі найближчі' })).toHaveAttribute('href', '#upcoming-sessions')
  })

  it('shows tomorrow hint when the next extra session is near but not today', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15T08:00:00Z'))

    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && config?.params?.upcoming === true) {
        return [
          {
            id: 401,
            status: 'CONFIRMED',
            specialist: 14,
            specialist_name: 'Олена',
            specialist_public_slug: 'olena',
            meeting_url: null,
            meeting_provider: null,
            slot: null,
            slot_start_at: '2026-01-15T10:00:00Z',
            slot_end_at: '2026-01-15T11:00:00Z',
          },
          {
            id: 402,
            status: 'SCHEDULED',
            specialist: 15,
            specialist_name: 'Іван',
            specialist_public_slug: 'ivan',
            meeting_url: null,
            meeting_provider: null,
            slot: null,
            slot_start_at: '2026-01-16T08:00:00Z',
            slot_end_at: '2026-01-16T09:00:00Z',
          },
        ]
      }
      if (url === '/booking/sessions/' && config?.params?.upcoming === false) {
        return []
      }
      if (url === '/booking/group-events/') {
        return []
      }
      throw new Error(`Unexpected apiGet call: ${url} ${JSON.stringify(config)}`)
    })

    renderView()

    expect(await screen.findByText(/^Далі: завтра о /)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Іван/i })).toHaveAttribute('href', '/client/sessions/402')
    expect(screen.queryByText(/Сьогодні ще/)).not.toBeInTheDocument()
  })

  it('keeps priority block clean when there is only one upcoming session', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && config?.params?.upcoming === true) {
        return [
          {
            id: 501,
            status: 'CONFIRMED',
            specialist: 14,
            specialist_name: 'Олена',
            specialist_public_slug: 'olena',
            meeting_url: null,
            meeting_provider: null,
            slot: null,
            slot_start_at: '2099-06-15T10:00:00Z',
            slot_end_at: '2099-06-15T11:00:00Z',
          },
        ]
      }
      if (url === '/booking/sessions/' && config?.params?.upcoming === false) {
        return []
      }
      if (url === '/booking/group-events/') {
        return []
      }
      throw new Error(`Unexpected apiGet call: ${url} ${JSON.stringify(config)}`)
    })

    renderView()

    expect(await screen.findByRole('link', { name: 'Найближча сесія' })).toHaveAttribute(
      'href',
      '/client/sessions/501'
    )
    expect(screen.queryByText(/Сьогодні ще/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Далі:/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Деталі сесії' })).toHaveAttribute('href', '/client/sessions/501')
    expect(screen.getByRole('link', { name: 'Усі найближчі' })).toHaveAttribute('href', '#upcoming-sessions')
  })

  it('shows inquiry discoverability states for available, existing, and unavailable inquiry flows', async () => {
    localStorage.setItem(
      'selectedSpecialists',
      JSON.stringify([
        { therapist_id: 14, public_slug: 'olena', display_name: 'Олена Коваль' },
        { therapist_id: 15, public_slug: 'ivan', display_name: 'Іван Петренко' },
        { therapist_id: 16, public_slug: 'nina', display_name: 'Ніна Савчук' },
      ])
    )

    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/sessions/') return []
      if (url === '/booking/group-events/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    mockedFetchPublicSpecialistProfile.mockImplementation(async (slug) => ({
      therapist_id: slug === 'olena' ? 14 : slug === 'ivan' ? 15 : 16,
      public_slug: slug,
      display_name: slug === 'olena' ? 'Олена Коваль' : slug === 'ivan' ? 'Іван Петренко' : 'Ніна Савчук',
      location: '',
      languages: [],
      photo_url: '',
      price: '',
      price_currency: 'UAH',
      intro_price: '',
      intro_price_currency: 'UAH',
    } as any))

    mockedFetchInquiryState.mockImplementation(async (specialistId) => {
      if (specialistId === 14) {
        return buildInquiryState({
          specialist_id: 14,
          inquiry_status: 'NOT_CREATED',
          inquiry_exists: false,
          can_create_inquiry: true,
          create_reason_code: null,
        })
      }
      if (specialistId === 15) {
        return buildInquiryState({
          specialist_id: 15,
          inquiry_id: 501,
          inquiry_status: 'OPEN',
          inquiry_exists: true,
          can_create_inquiry: false,
          create_reason_code: 'INQUIRY_ALREADY_EXISTS',
          can_client_send: true,
          client_send_reason_code: null,
        })
      }
      return buildInquiryState({
        specialist_id: 16,
        inquiry_status: 'BLOCKED',
        inquiry_exists: false,
        can_create_inquiry: false,
        create_reason_code: 'RELATION_BLOCKED',
      })
    })

    renderView()
    await flushPromises()
    await flushPromises()

    const inquiryCardTitle = await screen.findByText('Запити перед сесією')
    const inquiryCard = inquiryCardTitle.closest('.card') as HTMLElement
    expect(inquiryCard).toBeInTheDocument()

    expect(within(inquiryCard).getByRole('link', { name: 'Поставити запитання' })).toHaveAttribute(
      'href',
      '/client/inquiries/14'
    )
    expect(within(inquiryCard).getByRole('link', { name: 'Відкрити запит' })).toHaveAttribute(
      'href',
      '/client/inquiries/15'
    )
    expect(inquiryCard.querySelector('a[href="/client/inquiries/16"]')).toBeNull()
    expect(within(inquiryCard).getByText('Запит недоступний')).toBeInTheDocument()
    expect(within(inquiryCard).queryByText(/повний чат/i)).not.toBeInTheDocument()
  })

  it('routes ACTIVE_CLIENT inquiry state to full chat instead of inquiry actions', async () => {
    localStorage.setItem(
      'selectedSpecialists',
      JSON.stringify([{ therapist_id: 17, public_slug: 'maria', display_name: 'Марія' }])
    )

    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/sessions/') return []
      if (url === '/booking/group-events/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchPublicSpecialistProfile.mockResolvedValue({
      therapist_id: 17,
      public_slug: 'maria',
      display_name: 'Марія',
      location: '',
      languages: [],
      photo_url: '',
      price: '',
      price_currency: 'UAH',
      intro_price: '',
      intro_price_currency: 'UAH',
    } as any)
    mockedFetchInquiryState.mockResolvedValue(
      buildInquiryState({
        specialist_id: 17,
        inquiry_id: 777,
        inquiry_status: 'ACTIVE_CLIENT',
        inquiry_exists: true,
        can_create_inquiry: false,
        create_reason_code: 'ACTIVE_CLIENT_USE_CHAT',
      })
    )

    renderView()
    await flushPromises()
    await flushPromises()

    const inquiryCardTitle = await screen.findByText('Запити перед сесією')
    const inquiryCard = inquiryCardTitle.closest('.card') as HTMLElement

    expect(within(inquiryCard).getByRole('link', { name: 'Відкрити повний чат' })).toHaveAttribute(
      'href',
      '/client/chat?therapist_id=17'
    )
    expect(within(inquiryCard).queryByRole('link', { name: 'Поставити запитання' })).not.toBeInTheDocument()
    expect(within(inquiryCard).queryByRole('link', { name: 'Відкрити запит' })).not.toBeInTheDocument()
  })

  it('renders explicit error states for the priority, sessions, and group-events sections', async () => {
    mockedApiGet.mockRejectedValue(new Error('dashboard failed'))

    renderView()

    expect(await screen.findByText('Не вдалося завантажити найближчу сесію')).toBeInTheDocument()
    expect(screen.getByText('Не вдалося завантажити заплановані сесії')).toBeInTheDocument()
    expect(screen.getByText('Не вдалося завантажити історію сесій')).toBeInTheDocument()
    expect(screen.getByText('Не вдалося завантажити групові події')).toBeInTheDocument()
    expect(screen.queryByText('Немає майбутніх сесій.')).not.toBeInTheDocument()
  })

  it('renders explicit empty states when sessions and group events are absent', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/') {
        return []
      }
      if (url === '/booking/group-events/') {
        return []
      }
      throw new Error(`Unexpected apiGet call: ${url} ${JSON.stringify(config)}`)
    })

    renderView()

    await flushPromises()
    await flushPromises()
    expect(screen.getByText('Майбутніх сесій поки немає')).toBeInTheDocument()
    expect(screen.getByText('Запланованих сесій поки немає')).toBeInTheDocument()
    expect(screen.getByText('Історія сесій поки порожня')).toBeInTheDocument()
    expect(screen.getByText('Групових подій поки немає')).toBeInTheDocument()
  })

  it('renders the backend-mapped sessions error description from code fields', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/sessions/') {
        throw {
          response: {
            status: 403,
            data: {
              code: 'OVER_LIMIT',
              detail: 'Action unavailable due to plan limits.',
            },
          },
        }
      }

      if (url === '/booking/group-events/') {
        return []
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(
      await screen.findAllByText('Дія недоступна через обмеження плану. Перевірте доступ у Billing.')
    ).toHaveLength(3)
  })

  it('renders the backend-mapped group-events error description from code fields', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && config?.params?.upcoming === true) {
        return []
      }
      if (url === '/booking/sessions/' && config?.params?.upcoming === false) {
        return []
      }
      if (url === '/booking/group-events/') {
        throw {
          response: {
            status: 403,
            data: {
              code: 'OVER_LIMIT',
              detail: 'Action unavailable due to plan limits.',
            },
          },
        }
      }
      throw new Error(`Unexpected apiGet call: ${url} ${JSON.stringify(config)}`)
    })

    renderView()

    expect(
      await screen.findByText('Дія недоступна через обмеження плану. Перевірте доступ у Billing.')
    ).toBeInTheDocument()
  })

  it('renders payment badges in upcoming and past client cards with expected labels and classes', async () => {
    mockedFetchPublicSpecialistProfile.mockImplementation(async (slug) => ({
      therapist_id: 100,
      public_slug: String(slug),
      display_name: String(slug),
      location: '',
      languages: [],
      photo_url: '',
      price: '',
      price_currency: 'UAH',
      intro_price: '',
      intro_price_currency: 'UAH',
    } as any))

    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && config?.params?.upcoming === true) {
        return [
          {
            id: 991,
            status: 'SCHEDULED',
            specialist: 14,
            specialist_name: 'Paid upcoming',
            specialist_public_slug: 'olena',
            meeting_url: null,
            meeting_provider: null,
            payment_badge_state: 'paid',
            slot: null,
            slot_start_at: '2099-06-15T10:00:00Z',
            slot_end_at: '2099-06-15T11:00:00Z',
          },
          {
            id: 992,
            status: 'CONFIRMED',
            specialist: 15,
            specialist_name: 'Awaiting upcoming',
            specialist_public_slug: 'ivan',
            meeting_url: null,
            meeting_provider: null,
            payment_badge_state: 'awaiting_confirmation',
            slot: null,
            slot_start_at: '2099-06-16T10:00:00Z',
            slot_end_at: '2099-06-16T11:00:00Z',
          },
          {
            id: 993,
            status: 'CONFIRMED',
            specialist: 16,
            specialist_name: 'Unpaid upcoming',
            specialist_public_slug: 'maria',
            meeting_url: null,
            meeting_provider: null,
            payment_badge_state: 'unpaid',
            slot: null,
            slot_start_at: '2099-06-17T10:00:00Z',
            slot_end_at: '2099-06-17T11:00:00Z',
          },
        ]
      }
      if (url === '/booking/sessions/' && config?.params?.upcoming === false) {
        return [
          {
            id: 994,
            status: 'COMPLETED',
            specialist: 17,
            specialist_name: 'Paid past',
            specialist_public_slug: 'nina',
            meeting_url: null,
            meeting_provider: null,
            payment_badge_state: 'paid',
            slot: null,
            slot_start_at: '2099-05-15T10:00:00Z',
            slot_end_at: '2099-05-15T11:00:00Z',
          },
        ]
      }
      if (url === '/booking/group-events/') {
        return []
      }
      throw new Error(`Unexpected apiGet call: ${url} ${JSON.stringify(config)}`)
    })

    renderView()

    const paidUpcomingCard = (await screen.findAllByText(/Paid upcoming/))
      .map((node) => node.closest('li'))
      .find((node) => Boolean(node && node.classList.contains('session-item'))) || null
    expect(paidUpcomingCard).not.toBeNull()
    expect(within(paidUpcomingCard as HTMLElement).getByText('\u041e\u043f\u043b\u0430\u0447\u0435\u043d\u043e')).toHaveClass(
      'status-pill--payment-paid'
    )

    const awaitingUpcomingCard = (await screen.findAllByText(/Awaiting upcoming/))
      .map((node) => node.closest('li'))
      .find((node) => Boolean(node && node.classList.contains('session-item'))) || null
    expect(awaitingUpcomingCard).not.toBeNull()
    expect(
      within(awaitingUpcomingCard as HTMLElement).getByText(
        '\u041e\u0447\u0456\u043a\u0443\u0454 \u043f\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043d\u043d\u044f \u043e\u043f\u043b\u0430\u0442\u0438'
      )
    ).toHaveClass('status-pill--payment-awaiting')

    const unpaidUpcomingCard = (await screen.findAllByText(/Unpaid upcoming/))
      .map((node) => node.closest('li'))
      .find((node) => Boolean(node && node.classList.contains('session-item'))) || null
    expect(unpaidUpcomingCard).not.toBeNull()
    expect(
      within(unpaidUpcomingCard as HTMLElement).getByText('\u041d\u0435 \u043e\u043f\u043b\u0430\u0447\u0435\u043d\u043e')
    ).toHaveClass('status-pill--payment-unpaid')

    const paidPastCard = (await screen.findAllByText(/Paid past/))
      .map((node) => node.closest('li'))
      .find((node) => Boolean(node && node.classList.contains('session-item'))) || null
    expect(paidPastCard).not.toBeNull()
    expect(within(paidPastCard as HTMLElement).getByText('\u041e\u043f\u043b\u0430\u0447\u0435\u043d\u043e')).toHaveClass(
      'status-pill--payment-paid'
    )
  })

  it('keeps clear hero/tips CTAs when specialists are already selected', async () => {
    localStorage.setItem(
      'selectedSpecialists',
      JSON.stringify([
        {
          therapist_id: 14,
          public_slug: 'olena',
          display_name: 'Олена',
        },
      ])
    )

    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/sessions/') return []
      if (url === '/booking/group-events/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchPublicSpecialistProfile.mockResolvedValue({
      therapist_id: 14,
      public_slug: 'olena',
      display_name: 'Олена',
      location: '',
      languages: [],
      photo_url: '',
      price: '',
      price_currency: 'UAH',
      intro_price: '',
      intro_price_currency: 'UAH',
    } as any)

    const view = renderView()
    await flushPromises()
    await flushPromises()

    const heroActions = view.container.querySelector('.client-hero-actions') as HTMLElement
    expect(within(heroActions).getByRole('link', { name: 'Знайти профіль спеціаліста' })).toHaveAttribute(
      'href',
      '/specialists'
    )
    expect(within(heroActions).getByRole('link', { name: 'Мій профіль' })).toHaveAttribute(
      'href',
      '/client/profile'
    )
    expect(within(heroActions).queryByRole('button', { name: 'Мої спеціалісти' })).not.toBeInTheDocument()

    const tipsCard = view.container.querySelector('.tips-card') as HTMLElement
    expect(within(tipsCard).getByRole('link', { name: 'Знайти профіль спеціаліста' })).toHaveAttribute(
      'href',
      '/specialists'
    )
    expect(within(tipsCard).getByRole('link', { name: 'Пошук профілю спеціаліста' })).toHaveAttribute(
      'href',
      '/specialists'
    )
    expect(
      within(tipsCard).getByText('Щоб знайти іншого спеціаліста, скористайтеся пошуком профілю.')
    ).toBeInTheDocument()
  })
})
