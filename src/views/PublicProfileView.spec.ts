import { fireEvent, render, screen } from '@testing-library/vue'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import PublicProfileView from './PublicProfileView.vue'
import { BOOKING_UI_MESSAGES } from '../lib/bookingCopy'
import { toUtcRange } from '../lib/dates'
import {
  apiGet,
  apiPost,
  createInquiryThread,
  fetchChatThreads,
  fetchInquiryMessages,
  fetchInquiryState,
  fetchPublicAuthorJournalPosts,
  fetchPublicJournalCollections,
  fetchPublicSpecialistProfile,
  sendInquiryMessage,
  type InquiryState,
} from '../lib/api'

const mockRoute = {
  params: { slug: 'olena' },
  query: {},
}

const mockRouter = {
  push: vi.fn(),
}

const mockAuth = {
  accessToken: '',
  user: null as null | { roles: string[] },
  me: null as null | { user: { id?: number; roles: string[] } },
}

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  show: vi.fn(),
}

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')

  return {
    ...actual,
    useRoute: () => mockRoute,
    useRouter: () => mockRouter,
  }
})

vi.mock('../stores/auth', () => ({
  useAuthStore: () => mockAuth,
}))

vi.mock('../composables/useToast', () => ({
  useToast: () => mockToast,
}))

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  createInquiryThread: vi.fn(),
  fetchChatThreads: vi.fn(),
  fetchInquiryMessages: vi.fn(),
  fetchInquiryState: vi.fn(),
  fetchPublicSpecialistProfile: vi.fn(),
  fetchPublicAuthorJournalPosts: vi.fn(),
  fetchPublicJournalCollections: vi.fn(),
  sendInquiryMessage: vi.fn(),
}))

const mockedApiGet = vi.mocked(apiGet)
const mockedApiPost = vi.mocked(apiPost)
const mockedCreateInquiryThread = vi.mocked(createInquiryThread)
const mockedFetchChatThreads = vi.mocked(fetchChatThreads)
const mockedFetchInquiryMessages = vi.mocked(fetchInquiryMessages)
const mockedFetchInquiryState = vi.mocked(fetchInquiryState)
const mockedFetchPublicSpecialistProfile = vi.mocked(fetchPublicSpecialistProfile)
const mockedFetchPublicAuthorJournalPosts = vi.mocked(fetchPublicAuthorJournalPosts)
const mockedFetchPublicJournalCollections = vi.mocked(fetchPublicJournalCollections)
const mockedSendInquiryMessage = vi.mocked(sendInquiryMessage)

function buildProfile() {
  return {
    therapist_id: 12,
    public_slug: 'olena',
    display_name: 'Олена',
    bio_about: 'Працюю з тривогою.',
    bio_work: 'Онлайн у вашому темпі.',
    bio_approach: 'CBT та ACT.',
    bio_for_whom: 'Для людей у стресі.',
    specializations: ['Тривога', 'Вигорання'],
    languages: ['Українська', 'English'],
    location: 'Київ',
    experience_years: 5,
    price: '1500',
    price_currency: 'UAH',
    intro_duration_minutes: 30,
    intro_price: '600',
    intro_price_currency: 'UAH',
    contact_email: 'hello@example.com',
    telegram: '@olena_help',
    photo_url: 'https://example.com/photo.jpg',
    video_url: 'https://example.com/video.mp4',
    platform_setting_text: 'Platform setting',
    setting_text: 'Therapist setting',
  }
}

function buildInquiryState(overrides: Partial<InquiryState> = {}): InquiryState {
  return {
    specialist_id: 12,
    inquiry_id: null,
    inquiry_exists: false,
    inquiry_status: 'NOT_CREATED' as const,
    can_create_inquiry: true,
    create_reason_code: null,
    can_client_send: false,
    client_send_reason_code: 'INQUIRY_NOT_FOUND' as const,
    can_specialist_reply: false,
    specialist_reply_reason_code: 'INQUIRY_NOT_FOUND' as const,
    ...overrides,
  }
}

function buildTodayLocalSlot(overrides: Record<string, unknown> = {}) {
  const start = new Date()
  start.setHours(12, 0, 0, 0)
  const end = new Date(start)
  end.setMinutes(end.getMinutes() + 50)

  return {
    id: 100,
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    ...overrides,
  }
}

function mockCommonPublicData() {
  mockedFetchPublicSpecialistProfile.mockResolvedValue(buildProfile())
  mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
  mockedFetchPublicJournalCollections.mockResolvedValue([])
}

function mockClientPageData() {
  mockedApiGet.mockImplementation(async (url, config) => {
    if (url === '/booking/slots/') return []
    if (url === '/booking/sessions/') {
      if ((config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming === true) {
        return []
      }
      return []
    }
    if (url === '/public/specialists/olena/reviews/') return []
    throw new Error(`Unexpected apiGet call: ${url}`)
  })
}

function renderView() {
  return render(PublicProfileView, {
    global: {
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a><slot /></a>',
        },
      },
    },
  })
}

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    value: vi.fn(),
    configurable: true,
  })
})

describe('PublicProfileView', () => {
  beforeEach(() => {
    mockRoute.params.slug = 'olena'
    mockRoute.query = {}
    mockRouter.push.mockReset()
    mockAuth.accessToken = ''
    mockAuth.user = null
    mockAuth.me = null
    mockToast.success.mockReset()
    mockToast.error.mockReset()
    mockedApiGet.mockReset()
    mockedApiPost.mockReset()
    mockedCreateInquiryThread.mockReset()
    mockedFetchChatThreads.mockReset()
    mockedFetchInquiryMessages.mockReset()
    mockedFetchInquiryState.mockReset()
    mockedFetchPublicSpecialistProfile.mockReset()
    mockedFetchPublicAuthorJournalPosts.mockReset()
    mockedFetchPublicJournalCollections.mockReset()
    mockedSendInquiryMessage.mockReset()
    mockedFetchInquiryMessages.mockResolvedValue([])
  })

  it('renders the main public profile sections from loaded data', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(buildProfile())
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([
      {
        id: 1,
        title: 'Профілактика вигорання',
        slug: 'burnout',
        summary: 'Короткий гід для стабілізації.',
        cover_image_url: '',
        is_featured: true,
        featured_order: 1,
        published_at: '2026-03-01T10:00:00Z',
        created_at: '2026-03-01T10:00:00Z',
        category: 'TIP',
      },
    ])
    mockedFetchPublicJournalCollections.mockResolvedValue([
      {
        id: 7,
        title: 'Ресурси',
        slug: 'resources',
        description: 'Selections',
        cover_image_url: '',
        posts_count: 1,
        preview_posts: [{ title: 'Профілактика вигорання', slug: 'burnout' }],
      },
    ])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') {
        return [buildTodayLocalSlot()]
      }

      if (url === '/public/specialists/olena/reviews/') {
        return [
          {
            id: 1,
            review_text: 'Дуже уважний підхід.',
            created_at: '2026-03-01T10:00:00Z',
          },
        ]
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()

    expect(await screen.findByText('Довіра і формат')).toBeInTheDocument()
    expect(screen.getByText('Зв’язок зі спеціалістом')).toBeInTheDocument()
    expect(screen.getByText('hello@example.com')).toBeInTheDocument()
    expect(await screen.findByText('Профілактика вигорання')).toBeInTheDocument()
    expect(await screen.findByText('Що кажуть клієнти')).toBeInTheDocument()
    expect(screen.getByText('Щоб забронювати час, увійдіть у свій кабінет клієнта.')).toBeInTheDocument()
    expect(container).toHaveTextContent('Дуже уважний підхід.')
  })

  it('blocks booking for a client until setting acceptance is confirmed', async () => {
    mockAuth.accessToken = 'token'
    mockAuth.me = { user: { id: 7, roles: ['CLIENT'] } }

    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedFetchInquiryState.mockResolvedValue(buildInquiryState())
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/slots/') {
        return [buildTodayLocalSlot()]
      }

      if (url === '/booking/sessions/') {
        if ((config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming === true) {
          return []
        }
        return []
      }

      if (url === '/public/specialists/olena/reviews/') return []

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    const bookButton = await screen.findByRole('button', { name: 'Записатися' })
    await fireEvent.click(bookButton)

    expect(await screen.findByText(BOOKING_UI_MESSAGES.acceptSettingBeforeBooking)).toBeInTheDocument()
    expect(mockedApiPost).not.toHaveBeenCalled()
  })

  it('shows slots for the selected local day even when the slot starts on the previous UTC date', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-12T10:00:00+02:00'))

    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])

    const utcRange = toUtcRange(new Date('2026-03-12T00:00:00+02:00'), new Date('2026-03-12T23:59:59+02:00'))

    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/slots/') {
        const params = (config as { params?: Record<string, unknown> } | undefined)?.params || {}

        if (params.date_from === utcRange.date_from && params.date_to === utcRange.date_to) {
          return [
            {
              id: 100,
              start_at: '2026-03-11T22:30:00Z',
              end_at: '2026-03-11T23:20:00Z',
            },
          ]
        }

        if (params.therapist_id === 12 && !params.date_from && !params.date_to) {
          return [
            {
              id: 100,
              start_at: '2026-03-11T22:30:00Z',
              end_at: '2026-03-11T23:20:00Z',
            },
          ]
        }

        return []
      }

      if (url === '/public/specialists/olena/reviews/') return []

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    try {
      renderView()

      const dateInput = await screen.findByLabelText('Оберіть дату')
      await fireEvent.update(dateInput, '2026-03-12')

      expect(await screen.findByText('12.03.2026, 00:30')).toBeInTheDocument()
      expect(screen.queryByText('На жаль, у цей день вільних віконець немає.')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('switches public profile CTA to internal chat for an active client relation', async () => {
    mockAuth.accessToken = 'token'
    mockAuth.me = { user: { id: 7, roles: ['CLIENT'] } }

    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([
      {
        id: 44,
        therapist_id: 12,
        client_id: 7,
        last_message_at: null,
        last_message_preview: '',
        unread_count: 0,
        other_user: {
          id: 12,
          role: 'THERAPIST',
          display_name: 'Олена',
          photo_url: '',
        },
      },
    ])
    mockedFetchInquiryState.mockResolvedValue(
      buildInquiryState({
        inquiry_status: 'ACTIVE_CLIENT',
        can_create_inquiry: false,
        create_reason_code: 'ACTIVE_CLIENT_USE_CHAT',
      })
    )
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/slots/') {
        return [buildTodayLocalSlot()]
      }

      if (url === '/booking/sessions/') {
        if ((config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming === true) {
          return [
            {
              id: 201,
              status: 'CONFIRMED',
              therapist: 12,
              therapist_public_slug: 'olena',
              slot_start_at: '2099-06-20T10:00:00Z',
              slot_end_at: '2099-06-20T10:50:00Z',
            },
          ]
        }

        return []
      }

      if (url === '/public/specialists/olena/reviews/') return []

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    const chatButtons = await screen.findAllByRole('button', { name: 'Написати повідомлення' })
    expect(chatButtons).toHaveLength(2)
    expect(screen.getAllByText('Мої сесії')).toHaveLength(2)
    expect(screen.queryByText('Поставити запитання')).not.toBeInTheDocument()

    await fireEvent.click(chatButtons[0] as HTMLButtonElement)

    expect(mockRouter.push).toHaveBeenCalledWith({
      name: 'client-chat',
      query: { therapist_id: '12' },
    })
  })

  it('shows inquiry CTA instead of full-chat CTA for a non-active client', async () => {
    mockAuth.accessToken = 'token'
    mockAuth.me = { user: { id: 7, roles: ['CLIENT'] } }

    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedFetchInquiryState.mockResolvedValue(buildInquiryState())
    mockClientPageData()

    renderView()

    const inquiryButtons = await screen.findAllByRole('button', { name: 'Поставити запитання' })
    expect(inquiryButtons).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Написати повідомлення' })).not.toBeInTheDocument()
    expect(screen.queryByText('Написати спеціалісту')).not.toBeInTheDocument()
  })

  it('creates the first inquiry from the public profile happy path', async () => {
    mockAuth.accessToken = 'token'
    mockAuth.me = { user: { id: 7, roles: ['CLIENT'] } }

    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedFetchInquiryState
      .mockResolvedValueOnce(buildInquiryState())
      .mockResolvedValueOnce(
        buildInquiryState({
          inquiry_id: 91,
          inquiry_exists: true,
          inquiry_status: 'OPEN',
          can_create_inquiry: false,
          create_reason_code: 'INQUIRY_ALREADY_EXISTS',
          can_client_send: false,
          client_send_reason_code: 'FOLLOW_UP_REQUIRES_SPECIALIST_REPLY',
          can_specialist_reply: true,
          specialist_reply_reason_code: null,
        })
      )
    mockedCreateInquiryThread.mockResolvedValue({
      id: 91,
      specialist_id: 12,
      client_id: 7,
      created_at: '2026-03-11T10:00:00Z',
      last_message_at: '2026-03-11T10:00:00Z',
      inquiry_status: 'OPEN',
      closed_reason: null,
      other_user: {
        id: 12,
        role: 'SPECIALIST',
        display_name: 'Олена',
        photo_url: '',
      },
      last_message_preview: 'Чи можна коротко уточнити формат роботи?',
      unread_count: 0,
      can_client_send: false,
      client_send_reason_code: 'FOLLOW_UP_REQUIRES_SPECIALIST_REPLY',
      can_specialist_reply: true,
      specialist_reply_reason_code: null,
    })
    mockedFetchInquiryMessages.mockResolvedValue([
      {
        id: 301,
        thread_id: 91,
        sender_id: 7,
        body: 'Чи можна коротко уточнити формат роботи?',
        created_at: '2026-03-11T10:00:00Z',
      },
    ])
    mockClientPageData()

    renderView()

    const textarea = await screen.findByLabelText('Ваше повідомлення')
    await fireEvent.update(textarea, 'Чи можна коротко уточнити формат роботи?')
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати запит' }))

    expect(mockedCreateInquiryThread).toHaveBeenCalledWith({
      specialist_id: 12,
      body: 'Чи можна коротко уточнити формат роботи?',
    })
    expect(await screen.findByText('Чи можна коротко уточнити формат роботи?')).toBeInTheDocument()
  })

  it('renders the post-follow-up inquiry state as open while waiting for the final specialist reply', async () => {
    mockAuth.accessToken = 'token'
    mockAuth.me = { user: { id: 7, roles: ['CLIENT'] } }

    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedFetchInquiryState.mockResolvedValue(
      buildInquiryState({
        inquiry_id: 91,
        inquiry_exists: true,
        inquiry_status: 'OPEN',
        can_create_inquiry: false,
        create_reason_code: 'INQUIRY_ALREADY_EXISTS',
        can_client_send: false,
        client_send_reason_code: 'FOLLOW_UP_REQUIRES_SPECIALIST_REPLY',
        can_specialist_reply: true,
        specialist_reply_reason_code: null,
      })
    )
    mockedFetchInquiryMessages.mockResolvedValue([
      {
        id: 301,
        thread_id: 91,
        sender_id: 7,
        body: 'Чи працюєте ви з тривогою?',
        created_at: '2026-03-11T10:00:00Z',
      },
      {
        id: 302,
        thread_id: 91,
        sender_id: 12,
        body: 'Так, працюю з такими запитами.',
        created_at: '2026-03-11T10:10:00Z',
      },
      {
        id: 303,
        thread_id: 91,
        sender_id: 7,
        body: 'Маю одне коротке уточнення.',
        created_at: '2026-03-11T10:20:00Z',
      },
    ])
    mockClientPageData()

    renderView()

    expect(await screen.findByText('Маю одне коротке уточнення.')).toBeInTheDocument()
    expect(screen.getByText('Уточнення надіслано')).toBeInTheDocument()
    expect(screen.getByText('Ваше уточнення надіслано. Очікуйте відповіді спеціаліста.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Надіслати уточнення' })).not.toBeInTheDocument()
  })

  it('renders a safe inline explanation for blocked inquiry state', async () => {
    mockAuth.accessToken = 'token'
    mockAuth.me = { user: { id: 7, roles: ['CLIENT'] } }

    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedFetchInquiryState.mockResolvedValue(
      buildInquiryState({
        inquiry_status: 'BLOCKED',
        can_create_inquiry: false,
        create_reason_code: 'RELATION_BLOCKED',
      })
    )
    mockClientPageData()

    renderView()

    expect(await screen.findByText('Запит недоступний')).toBeInTheDocument()
    expect(
      screen.getByText('Для заблокованої взаємодії короткий запит до бронювання недоступний.')
    ).toBeInTheDocument()
  })
})
