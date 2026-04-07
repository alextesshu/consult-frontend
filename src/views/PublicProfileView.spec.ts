import { fireEvent, render, screen, within } from '@testing-library/vue'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import PublicProfileView from './PublicProfileView.vue'
import { BOOKING_UI_MESSAGES } from '../lib/bookingCopy'
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
  fetchSpecialistProfile,
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
  fetchSpecialistProfile: vi.fn(),
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
const mockedFetchSpecialistProfile = vi.mocked(fetchSpecialistProfile)
const mockedFetchPublicAuthorJournalPosts = vi.mocked(fetchPublicAuthorJournalPosts)
const mockedFetchPublicJournalCollections = vi.mocked(fetchPublicJournalCollections)
const mockedSendInquiryMessage = vi.mocked(sendInquiryMessage)
const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
const clipboardWriteTextSpy = vi.fn().mockResolvedValue(undefined)

async function flushAsyncUpdates() {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

function buildProfile(overrides: Record<string, unknown> = {}) {
  return {
    therapist_id: 12,
    public_slug: 'olena',
    display_name: 'Олена',
    offers_online: true,
    offers_offline: true,
    offline_location: 'Київ, кабінет 14',
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
    contact_actions: [
      {
        channel: 'EMAIL',
        label: 'Email',
        value: 'hello@example.com',
        action_url: 'mailto:hello@example.com',
      },
      {
        channel: 'TELEGRAM',
        label: 'Telegram',
        value: '@olena_help',
        action_url: 'https://t.me/olena_help',
      },
    ],
    photo_url: 'https://example.com/photo.jpg',
    video_url: 'https://example.com/video.mp4',
    profile_documents: [
      {
        id: 41,
        title: 'Сертифікат CBT',
        file_url: 'https://example.com/cbt.pdf',
        document_kind: 'CERTIFICATE',
        uploaded_at: '2026-03-05T09:00:00Z',
        source: 'uploaded_by_specialist',
      },
    ],
    completed_sessions_count: 100,
    platform_setting_text: 'Platform setting',
    setting_text: 'Therapist setting',
    ...overrides,
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

function mockBookingPageDataWithSingleSlot() {
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
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: clipboardWriteTextSpy,
    },
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
    mockToast.warning.mockReset()
    mockToast.info.mockReset()
    mockToast.show.mockReset()
    mockedApiGet.mockReset()
    mockedApiPost.mockReset()
    mockedCreateInquiryThread.mockReset()
    mockedFetchChatThreads.mockReset()
    mockedFetchInquiryMessages.mockReset()
    mockedFetchInquiryState.mockReset()
    mockedFetchPublicSpecialistProfile.mockReset()
    mockedFetchSpecialistProfile.mockReset()
    mockedFetchPublicAuthorJournalPosts.mockReset()
    mockedFetchPublicJournalCollections.mockReset()
    mockedSendInquiryMessage.mockReset()
    mockedFetchInquiryMessages.mockResolvedValue([])
    windowOpenSpy.mockClear()
    clipboardWriteTextSpy.mockReset()
    clipboardWriteTextSpy.mockResolvedValue(undefined)
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
    expect(screen.getByText('Швидкий огляд')).toBeInTheDocument()
    expect(screen.getByText('Документи та сертифікати')).toBeInTheDocument()
    expect(screen.getByText('Сертифікат CBT')).toBeInTheDocument()
    expect(screen.getByText('Зв’язок зі спеціалістом')).toBeInTheDocument()
    expect(screen.getByText('hello@example.com')).toBeInTheDocument()
    expect(await screen.findByText('Профілактика вигорання')).toBeInTheDocument()
    expect(await screen.findByText('Що кажуть клієнти')).toBeInTheDocument()
    expect(
      screen.getByText('Можна почати без реєстрації: оберіть слот і залиште короткий запит з контактом.')
    ).toBeInTheDocument()
    expect(container).toHaveTextContent('Дуже уважний підхід.')
  })

  it('uses sections.publications_preview as primary source for journal preview', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        sections_version: 1,
        sections: {
          publications_preview: {
            enabled: true,
            items: [
              {
                id: 21,
                slug: 'canonical-preview',
                title: 'Канонічний превʼю-матеріал',
                category: 'TIP',
                published_at: '2026-03-12T10:00:00Z',
                is_featured: true,
                cover_image_url: '',
                excerpt: 'Короткий канонічний опис.',
                reading_time_minutes: 4,
              },
            ],
            empty_state: null,
          },
        },
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(await screen.findByText('Канонічний превʼю-матеріал')).toBeInTheDocument()
    expect(mockedFetchPublicAuthorJournalPosts).not.toHaveBeenCalled()
    expect(mockedFetchPublicJournalCollections).not.toHaveBeenCalled()
  })

  it('falls back to legacy journal endpoints when sections.publications_preview is unavailable', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(buildProfile())
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([
      {
        id: 31,
        title: 'Legacy journal post',
        slug: 'legacy-journal-post',
        summary: 'Legacy summary',
        cover_image_url: '',
        is_featured: false,
        featured_order: 0,
        published_at: '2026-03-11T10:00:00Z',
        created_at: '2026-03-11T10:00:00Z',
        category: 'TIP',
      },
    ])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(await screen.findByText('Legacy journal post')).toBeInTheDocument()
    expect(mockedFetchPublicAuthorJournalPosts).toHaveBeenCalledWith('olena')
    expect(mockedFetchPublicJournalCollections).toHaveBeenCalledWith('olena')
  })

  it('renders canonical empty state for NO_PUBLICATIONS', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        sections_version: 1,
        sections: {
          publications_preview: {
            enabled: true,
            items: [],
            empty_state: 'NO_PUBLICATIONS',
          },
        },
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(await screen.findByText('Поки немає публікацій')).toBeInTheDocument()
    expect(
      screen.getByText('Коли зʼявляться нові матеріали, вони будуть доступні у цьому розділі.')
    ).toBeInTheDocument()
    expect(mockedFetchPublicAuthorJournalPosts).not.toHaveBeenCalled()
    expect(mockedFetchPublicJournalCollections).not.toHaveBeenCalled()
  })

  it('uses sections trust/about/topics/formats/contact_actions as primary source when present', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        bio_about: 'Flat about should not be primary.',
        bio_for_whom: 'Flat topics fallback text.',
        contact_actions: [
          {
            channel: 'EMAIL',
            label: 'Email',
            value: 'hello@example.com',
            action_url: 'mailto:hello@example.com',
          },
        ],
        sections_version: 1,
        sections: {
          trust: {
            items: [{ label: 'Section trust label', value: 'Section trust value' }],
          },
          about: {
            items: [{ title: 'Section about title', body: 'Section about body copy.' }],
          },
          topics: {
            who_this_is_for: 'Section topics body.',
            items: ['Section topic chip'],
          },
          formats: {
            meeting_format_label: 'Секційний формат',
            intro_duration_label: '40 хв (section)',
            intro_price_display: '999 грн (section)',
            price_display: '1999 грн (section)',
            standard_session_duration_label: '55 хв (section)',
            location: 'Section City',
          },
          contact_actions: {
            items: [
              {
                channel: 'PHONE',
                label: 'Телефон секції',
                value: '+380441112233',
                action_url: 'tel:+380441112233',
              },
            ],
          },
        },
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect((await screen.findAllByText('Section trust label')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Section trust value').length).toBeGreaterThan(0)
    expect(screen.getByText('Section about title')).toBeInTheDocument()
    expect(screen.getAllByText('Section about body copy.').length).toBeGreaterThan(0)
    expect(screen.getByText('Section topics body.')).toBeInTheDocument()
    expect(screen.getAllByText('Section topic chip').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/999 грн \(section\)/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/40 хв \(section\)/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/1999 грн \(section\)/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/55 хв \(section\)/i).length).toBeGreaterThan(0)
    expect(screen.getByText('Телефон секції')).toBeInTheDocument()
    expect(screen.queryByText('hello@example.com')).not.toBeInTheDocument()
  })

  it('falls back to flat trust/topics/formats/contact_actions when related sections are empty', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        sections_version: 1,
        sections: {
          trust: { items: [] },
          about: { items: [] },
          topics: { items: [], who_this_is_for: '' },
          formats: {},
          contact_actions: { items: [] },
        },
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect((await screen.findAllByText('Формат зустрічей')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Працюю з тривогою.').length).toBeGreaterThan(0)
    expect(screen.getByText('Для людей у стресі.')).toBeInTheDocument()
    expect(screen.getAllByText('Тривога').length).toBeGreaterThan(0)
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('hello@example.com')).toBeInTheDocument()
  })

  it('uses sections.reviews as primary source and skips legacy reviews endpoint', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        sections_version: 1,
        sections: {
          reviews: {
            items: [
              {
                id: 901,
                review_text: 'Section review text',
                created_at: '2026-03-20T10:00:00Z',
              },
            ],
          },
        },
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') {
        throw new Error('Legacy reviews endpoint should not be called when sections.reviews exists')
      }
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(await screen.findByText('Section review text')).toBeInTheDocument()
    const reviewCalls = mockedApiGet.mock.calls.filter((call) => call[0] === '/public/specialists/olena/reviews/')
    expect(reviewCalls).toHaveLength(0)
  })

  it('falls back to legacy reviews endpoint when sections.reviews is unavailable', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(buildProfile())
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') {
        return [
          {
            id: 1,
            review_text: 'Legacy reviews endpoint text',
            created_at: '2026-03-19T10:00:00Z',
          },
        ]
      }
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(await screen.findByText('Legacy reviews endpoint text')).toBeInTheDocument()
    const reviewCalls = mockedApiGet.mock.calls.filter((call) => call[0] === '/public/specialists/olena/reviews/')
    expect(reviewCalls.length).toBeGreaterThan(0)
  })

  it('renders FAQ and media blocks from sections when provided', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        sections_version: 1,
        sections: {
          faq: {
            items: [
              {
                id: 'faq-1',
                question: 'Section FAQ question',
                answer: 'Section FAQ answer',
              },
            ],
          },
          media: {
            items: [
              {
                id: 'media-1',
                title: 'Section media title',
                description: 'Section media description',
                kind: 'ARTICLE',
                url: 'https://example.com/media-item',
              },
            ],
          },
        },
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(await screen.findByRole('heading', { name: 'Поширені запитання' })).toBeInTheDocument()
    expect(screen.getByText('Section FAQ question')).toBeInTheDocument()
    expect(screen.getByText('Section FAQ answer')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Додаткові матеріали' })).toBeInTheDocument()
    expect(screen.getByText('Section media title')).toBeInTheDocument()
  })

  it('keeps FAQ and media blocks hidden when sections are unavailable', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(buildProfile())
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    await screen.findByRole('heading', { name: 'Олена' })
    expect(screen.queryByRole('heading', { name: 'Поширені запитання' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Додаткові матеріали' })).not.toBeInTheDocument()
  })

  it('hides public contact CTA when backend returns zero contact actions', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(buildProfile({ contact_actions: [] }))
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    await screen.findByRole('heading', { name: 'Олена' })
    expect(screen.queryByRole('heading', { name: /зв.?язок зі спеціалістом/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Зв’язатися зі спеціалістом' })).not.toBeInTheDocument()
  })

  it('opens the only contact action directly without chooser', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        contact_actions: [
          {
            channel: 'EMAIL',
            label: 'Email',
            value: 'hello@example.com',
            action_url: 'mailto:hello@example.com',
          },
        ],
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    const contactCta = await screen.findByRole('button', { name: 'Зв’язатися зі спеціалістом' })
    await fireEvent.click(contactCta)

    expect(windowOpenSpy).toHaveBeenCalledWith(
      'mailto:hello@example.com',
      '_blank',
      'noopener,noreferrer'
    )
    expect(screen.queryByText('Оберіть канал зв’язку')).not.toBeInTheDocument()
  })

  it('filters non-allowlisted contact action scheme from CTA/chooser and blocks open', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        contact_actions: [
          {
            channel: 'EMAIL',
            label: 'Email',
            value: 'hello@example.com',
            action_url: 'mailto:hello@example.com',
          },
          {
            channel: 'TELEGRAM',
            label: 'Telegram',
            value: '@olena_help',
            action_url: 'javascript:alert(1)',
          },
        ],
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()

    await screen.findByText('Email')

    const directLinks = Array.from(container.querySelectorAll('a.contact-action')) as HTMLAnchorElement[]
    expect(directLinks).toHaveLength(1)
    expect(directLinks[0]?.getAttribute('href')).toBe('mailto:hello@example.com')
    expect(
      directLinks.some((link) => String(link.getAttribute('href') || '').startsWith('javascript:'))
    ).toBe(false)
    expect(screen.queryByText('Telegram')).not.toBeInTheDocument()
  })

  it('opens chooser and routes to selected action when multiple contact channels exist', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(buildProfile())
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    const contactCta = await screen.findByRole('button', { name: 'Зв’язатися зі спеціалістом' })
    await fireEvent.click(contactCta)

    const chooserTitle = await screen.findByText('Оберіть канал зв’язку')
    expect(chooserTitle).toBeInTheDocument()
    const chooserModal = chooserTitle.closest('.contact-chooser-modal')
    expect(chooserModal).not.toBeNull()
    const chooser = within(chooserModal as HTMLElement)
    expect(chooser.getByText('Оберіть зручний канал: це не бронювання, а прямий контакт для першого діалогу.')).toBeInTheDocument()
    expect(chooser.getByText('Email')).toBeInTheDocument()
    expect(chooser.getByText('Telegram')).toBeInTheDocument()
    expect(chooser.getByText('@olena_help')).toBeInTheDocument()
    expect(screen.queryByText('EMAIL')).not.toBeInTheDocument()
    expect(screen.queryByText('TELEGRAM')).not.toBeInTheDocument()

    const actionButtons = chooser.getAllByRole('button', { name: 'Відкрити' })
    await fireEvent.click(actionButtons[1] as HTMLButtonElement)

    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://t.me/olena_help',
      '_blank',
      'noopener,noreferrer'
    )
  })

  it('shows fallback modal with copy action for direct external contact channels', async () => {
    vi.useFakeTimers()
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        contact_actions: [
          {
            channel: 'VIBER',
            label: 'Viber',
            value: '+380001112233',
            action_url: 'viber://chat?number=%2B380001112233',
          },
        ],
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    try {
      const { container } = renderView()
      await screen.findByText('Viber')

      const directAction = container.querySelector('.contact-action')
      expect(directAction).not.toBeNull()
      await fireEvent.click(directAction as HTMLAnchorElement)

      expect(windowOpenSpy).toHaveBeenCalledWith(
        'viber://chat?number=%2B380001112233',
        '_blank',
        'noopener,noreferrer'
      )
      await vi.advanceTimersByTimeAsync(950)
      const fallbackModal = container.querySelector('.contact-fallback-modal')
      expect(fallbackModal).not.toBeNull()
      const fallback = within(fallbackModal as HTMLElement)
      expect(fallback.getByText('Viber')).toBeInTheDocument()
      expect(fallback.getByText('+380001112233')).toBeInTheDocument()
      const fallbackButtons = fallback.getAllByRole('button')
      await fireEvent.click(fallbackButtons[1] as HTMLButtonElement)
      expect(clipboardWriteTextSpy).toHaveBeenCalledWith('+380001112233')
      expect(mockToast.success).toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })
  it('shows fallback modal for chooser-selected telegram action', async () => {
    vi.useFakeTimers()
    mockedFetchPublicSpecialistProfile.mockResolvedValue(buildProfile())
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    try {
      const { container } = renderView()

      await screen.findByText('Telegram')
      const closingButtons = Array.from(
        container.querySelectorAll('.closing-cta__actions button')
      ) as HTMLButtonElement[]
      expect(closingButtons.length).toBeGreaterThan(1)
      await fireEvent.click(closingButtons[1] as HTMLButtonElement)

      const chooserModal = container.querySelector('.contact-chooser-modal')
      expect(chooserModal).not.toBeNull()
      const chooser = within(chooserModal as HTMLElement)
      const actionButtons = chooser.getAllByRole('button')
      await fireEvent.click(actionButtons[actionButtons.length - 1] as HTMLButtonElement)

      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://t.me/olena_help',
        '_blank',
        'noopener,noreferrer'
      )
      expect(container.querySelector('.contact-chooser-modal')).toBeNull()

      await vi.advanceTimersByTimeAsync(950)
      const fallbackModal = container.querySelector('.contact-fallback-modal')
      expect(fallbackModal).not.toBeNull()
      const fallback = within(fallbackModal as HTMLElement)
      expect(fallback.getByText('Telegram')).toBeInTheDocument()
      expect(fallback.getByText('@olena_help')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
  it('does not crash when contact_actions are missing or partially empty', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        contact_actions: [
          { channel: 'EMAIL', label: null, value: null, action_url: null },
          { channel: 'TELEGRAM', label: 'Telegram', value: '', action_url: '' },
        ],
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(await screen.findByRole('heading', { name: 'Олена' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Зв’язатися зі спеціалістом' })).not.toBeInTheDocument()
    expect(screen.queryByText('Оберіть канал зв’язку')).not.toBeInTheDocument()
  })

  it('does not crash when contact_actions are not returned yet', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(buildProfile({ contact_actions: undefined }))
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(await screen.findByRole('heading', { name: 'Олена' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Зв’язатися зі спеціалістом' })).not.toBeInTheDocument()
  })

  it('shows owner unpublished-profile state instead of raw not-found copy for own slug', async () => {
    mockAuth.accessToken = 'token'
    mockAuth.user = { roles: ['SPECIALIST'] }
    mockAuth.me = { user: { id: 5, roles: ['SPECIALIST'] } }

    mockedFetchPublicSpecialistProfile.mockRejectedValue({
      response: { status: 404, data: { detail: 'Profile not found.' } },
    })
    mockedFetchSpecialistProfile.mockResolvedValue({
      public_slug: 'olena',
      public_profile_enabled: false,
    } as any)

    renderView()

    expect(await screen.findByText('Профіль ще не опубліковано')).toBeInTheDocument()
    expect(
      screen.getByText('Публічний профіль ще не опубліковано. Заповніть профіль і увімкніть його для перегляду.')
    ).toBeInTheDocument()
    expect(screen.getByText('Перейти до налаштувань профілю')).toBeInTheDocument()
    expect(screen.queryByText('Profile not found.')).not.toBeInTheDocument()
  })

  it('shows completed sessions line in the public hero only from 50+ bucket', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(buildProfile({ completed_sessions_count: 120 }))
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(await screen.findByText('Проведено сесій: 100+')).toBeInTheDocument()
  })

  it('does not show completed sessions line when count is below threshold', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(buildProfile({ completed_sessions_count: 34 }))
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    await screen.findByText('Довіра і формат')
    expect(screen.queryByText(/Проведено сесій:/i)).not.toBeInTheDocument()
  })

  it('renders online-only format in public profile', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        offers_online: true,
        offers_offline: false,
        offline_location: 'Київ, кабінет 14',
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(await screen.findByText('Формат визначено профілем: Онлайн')).toBeInTheDocument()
    expect(screen.queryByText(/Локація офлайн-зустрічей:/i)).not.toBeInTheDocument()
  })

  it('renders offline-only format with offline location in public profile', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        offers_online: false,
        offers_offline: true,
        offline_location: 'Львів, кабінет 7',
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(await screen.findByText('Формат визначено профілем: Офлайн')).toBeInTheDocument()
    expect(screen.getByText('Локація офлайн-сесій: Львів, кабінет 7')).toBeInTheDocument()
  })

  it('renders combined online and offline format in public profile', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        offers_online: true,
        offers_offline: true,
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(await screen.findByLabelText('Онлайн')).toBeInTheDocument()
    expect(screen.getByLabelText('Офлайн')).toBeInTheDocument()
  })

  it('explains booking next step and trust markers before client login', async () => {
    mockCommonPublicData()
    mockBookingPageDataWithSingleSlot()

    renderView()

    expect(
      await screen.findAllByText('Після вибору часу відкриється короткий запит: залиште ім’я та контакт без реєстрації.')
    ).toHaveLength(2)
    expect(screen.getAllByText('Натискання кнопки «Записатися» не списує оплату автоматично.')).toHaveLength(1)
  })

  it('opens guest booking request flow from slot click without auth', async () => {
    mockCommonPublicData()
    mockBookingPageDataWithSingleSlot()

    renderView()

    const slotButton = await screen.findByRole('button', { name: 'Записатися' })
    await fireEvent.click(slotButton)

    expect(await screen.findByRole('heading', { name: 'Запит на бронювання' })).toBeInTheDocument()
    expect(screen.getByLabelText('Ім’я')).toBeInTheDocument()
    expect(screen.getByLabelText('Канал зв’язку')).toBeInTheDocument()
    expect(screen.getByLabelText('Контакт')).toBeInTheDocument()
  })

  it('submits a valid guest booking request and renders success state copy', async () => {
    mockCommonPublicData()
    mockBookingPageDataWithSingleSlot()
    mockedApiPost.mockResolvedValue({
      request: {
        id: 501,
        status: 'PENDING',
        created_at: '2026-04-07T10:00:00Z',
        next_step: 'Request sent. Specialist will review and contact you soon.',
      },
    })

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Записатися' }))
    await fireEvent.update(screen.getByLabelText('Ім’я'), 'Ірина')
    await fireEvent.update(screen.getByLabelText('Контакт'), 'iryna@example.com')
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати запит' }))

    expect(mockedApiPost).toHaveBeenCalledWith(
      '/public/specialists/olena/guest-booking-requests/',
      {
        slot_id: 100,
        session_format: 'online',
        guest_name: 'Ірина',
        contact_channel: 'email',
        contact_value: 'iryna@example.com',
      }
    )
    expect(
      await screen.findByText('Запит надіслано. Спеціаліст підтвердить час або зв’яжеться з вами.')
    ).toBeInTheDocument()
    expect(screen.getByText(/Реєстрація не потрібна для цього кроку\./)).toBeInTheDocument()
    expect(
      screen.getByText(/Натискання кнопки не означає автоматичне списання оплати\./)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Спеціаліст перегляне запит і зв’яжеться з вами найближчим часом\./)
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/Request sent\. Specialist will review and contact you soon\./)
    ).not.toBeInTheDocument()
  })

  it('submits guest booking request with canonical telegram contact channel value', async () => {
    mockCommonPublicData()
    mockBookingPageDataWithSingleSlot()
    mockedApiPost.mockResolvedValue({
      request: {
        id: 502,
        status: 'PENDING',
        created_at: '2026-04-07T10:00:00Z',
        next_step: null,
      },
    })

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Записатися' }))
    await fireEvent.update(screen.getByLabelText('Ім’я'), 'Ірина')
    await fireEvent.update(screen.getByLabelText('Канал зв’язку'), 'telegram')
    await fireEvent.update(screen.getByLabelText('Контакт'), '@iryna_help')
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати запит' }))

    expect(mockedApiPost).toHaveBeenCalledWith(
      '/public/specialists/olena/guest-booking-requests/',
      expect.objectContaining({
        contact_channel: 'telegram',
        contact_value: '@iryna_help',
      })
    )
  })

  it('submits guest booking request with canonical phone contact channel value', async () => {
    mockCommonPublicData()
    mockBookingPageDataWithSingleSlot()
    mockedApiPost.mockResolvedValue({
      request: {
        id: 503,
        status: 'PENDING',
        created_at: '2026-04-07T10:00:00Z',
        next_step: null,
      },
    })

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Записатися' }))
    await fireEvent.update(screen.getByLabelText('Ім’я'), 'Ірина')
    await fireEvent.update(screen.getByLabelText('Канал зв’язку'), 'phone')
    await fireEvent.update(screen.getByLabelText('Контакт'), '+380501112233')
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати запит' }))

    expect(mockedApiPost).toHaveBeenCalledWith(
      '/public/specialists/olena/guest-booking-requests/',
      expect.objectContaining({
        contact_channel: 'phone',
        contact_value: '+380501112233',
      })
    )
  })

  it('shows specific validation message for unsupported contact channel choice', async () => {
    mockCommonPublicData()
    mockBookingPageDataWithSingleSlot()
    mockedApiPost.mockRejectedValue({
      response: {
        status: 400,
        data: {
          contact_channel: ['"TELEGRAM" is not a valid choice.'],
        },
      },
    })

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Записатися' }))
    await fireEvent.update(screen.getByLabelText('Ім’я'), 'Ірина')
    await fireEvent.update(screen.getByLabelText('Контакт'), 'iryna@example.com')
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати запит' }))

    expect(
      await screen.findByText('Оберіть канал зв’язку зі списку: Email, Телефон або Telegram.')
    ).toBeInTheDocument()
  })

  it('shows friendly unavailable slot error for guest booking request', async () => {
    mockCommonPublicData()
    mockBookingPageDataWithSingleSlot()
    mockedApiPost.mockRejectedValue({
      response: {
        data: {
          code: 'SLOT_ALREADY_BOOKED',
        },
      },
    })

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Записатися' }))
    await fireEvent.update(screen.getByLabelText('Ім’я'), 'Ірина')
    await fireEvent.update(screen.getByLabelText('Контакт'), 'iryna@example.com')
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати запит' }))

    expect(
      await screen.findByText('Обраний слот уже недоступний. Будь ласка, виберіть інший час.')
    ).toBeInTheDocument()
  })

  it('shows friendly guest-flow restriction error for entitlement limits', async () => {
    mockCommonPublicData()
    mockBookingPageDataWithSingleSlot()
    mockedApiPost.mockRejectedValue({
      response: {
        data: {
          code: 'OVER_LIMIT',
        },
      },
    })

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Записатися' }))
    await fireEvent.update(screen.getByLabelText('Ім’я'), 'Ірина')
    await fireEvent.update(screen.getByLabelText('Контакт'), 'iryna@example.com')
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати запит' }))

    expect(
      await screen.findByText('Наразі нові гостьові запити тимчасово недоступні для цього профілю.')
    ).toBeInTheDocument()
  })

  it('keeps canonical client booking flow and does not open guest request modal', async () => {
    mockAuth.accessToken = 'token'
    mockAuth.me = { user: { id: 7, roles: ['CLIENT'] } }

    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedFetchInquiryState.mockResolvedValue(buildInquiryState())
    mockBookingPageDataWithSingleSlot()
    mockedApiPost.mockResolvedValue({})

    renderView()

    const bookingAgreement = await screen.findByRole('checkbox', {
      name: 'Я ознайомився(-лась) і погоджуюсь з умовами бронювання',
    })
    await fireEvent.click(bookingAgreement)
    await fireEvent.click(screen.getByRole('button', { name: 'Записатися' }))

    expect(mockedApiPost).toHaveBeenCalledWith(
      '/booking/sessions/',
      expect.objectContaining({
        slot_id: 100,
        setting_accepted: true,
      })
    )
    expect(screen.queryByRole('heading', { name: 'Запит на бронювання' })).not.toBeInTheDocument()
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

    expect(await screen.findByText('Для запису потрібно підтвердити умови спеціаліста')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Відкрити умови' })).toBeInTheDocument()
    expect(
      screen.getByText('Без цього підтвердження кнопки бронювання залишаються недоступними.')
    ).toBeInTheDocument()

    const bookButton = await screen.findByRole('button', { name: 'Записатися' })
    await fireEvent.click(bookButton)

    expect(await screen.findByText(BOOKING_UI_MESSAGES.acceptSettingBeforeBooking)).toBeInTheDocument()
    expect(mockedApiPost).not.toHaveBeenCalled()
  })

  it('hides format chooser for online-only specialist and sends online session_format', async () => {
    mockAuth.accessToken = 'token'
    mockAuth.me = { user: { id: 7, roles: ['CLIENT'] } }

    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({ offers_online: true, offers_offline: false })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedFetchInquiryState.mockResolvedValue(buildInquiryState())
    mockBookingPageDataWithSingleSlot()
    mockedApiPost.mockResolvedValue({})

    renderView()

    expect(await screen.findByText('Формат визначено профілем: Онлайн')).toBeInTheDocument()
    expect(screen.queryByLabelText('Онлайн')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Офлайн')).not.toBeInTheDocument()

    const bookingAgreement = screen.getAllByRole('checkbox')[0]!
    await fireEvent.click(bookingAgreement)
    expect(screen.getByText('Умови бронювання підтверджено')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Переглянути умови' })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Записатися' }))

    expect(mockedApiPost).toHaveBeenCalledWith(
      '/booking/sessions/',
      expect.objectContaining({
        slot_id: 100,
        setting_accepted: true,
        session_format: 'online',
      })
    )
  })

  it('hides format chooser for offline-only specialist and sends offline session_format', async () => {
    mockAuth.accessToken = 'token'
    mockAuth.me = { user: { id: 7, roles: ['CLIENT'] } }

    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        offers_online: false,
        offers_offline: true,
        offline_location: 'Львів, кабінет 7',
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedFetchInquiryState.mockResolvedValue(buildInquiryState())
    mockBookingPageDataWithSingleSlot()
    mockedApiPost.mockResolvedValue({})

    renderView()

    expect(await screen.findByText('Формат визначено профілем: Офлайн')).toBeInTheDocument()
    expect(screen.getByText('Локація офлайн-сесій: Львів, кабінет 7')).toBeInTheDocument()
    expect(screen.queryByLabelText('Онлайн')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Офлайн')).not.toBeInTheDocument()

    const bookingAgreement = screen.getAllByRole('checkbox')[0]!
    await fireEvent.click(bookingAgreement)
    await fireEvent.click(screen.getByRole('button', { name: 'Записатися' }))

    expect(mockedApiPost).toHaveBeenCalledWith(
      '/booking/sessions/',
      expect.objectContaining({
        slot_id: 100,
        setting_accepted: true,
        session_format: 'offline',
      })
    )
  })

  it('shows session format chooser when specialist supports both formats', async () => {
    mockAuth.accessToken = 'token'
    mockAuth.me = { user: { id: 7, roles: ['CLIENT'] } }

    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedFetchInquiryState.mockResolvedValue(buildInquiryState())
    mockBookingPageDataWithSingleSlot()

    renderView()

    expect(await screen.findByLabelText('Онлайн')).toBeInTheDocument()
    expect(screen.getByLabelText('Офлайн')).toBeInTheDocument()
    expect(screen.queryByText(/Формат визначено профілем:/)).not.toBeInTheDocument()
  })

  it('sends online session_format when online option is selected for dual-format specialist', async () => {
    mockAuth.accessToken = 'token'
    mockAuth.me = { user: { id: 7, roles: ['CLIENT'] } }

    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedFetchInquiryState.mockResolvedValue(buildInquiryState())
    mockBookingPageDataWithSingleSlot()
    mockedApiPost.mockResolvedValue({})

    renderView()

    const onlineOption = await screen.findByLabelText('Онлайн')
    await fireEvent.click(onlineOption)
    const bookingAgreement = screen.getAllByRole('checkbox')[0]!
    await fireEvent.click(bookingAgreement)
    await fireEvent.click(screen.getByRole('button', { name: 'Записатися' }))

    expect(mockedApiPost).toHaveBeenCalledWith(
      '/booking/sessions/',
      expect.objectContaining({
        slot_id: 100,
        setting_accepted: true,
        session_format: 'online',
      })
    )
  })

  it('sends offline session_format when offline option is selected for dual-format specialist', async () => {
    mockAuth.accessToken = 'token'
    mockAuth.me = { user: { id: 7, roles: ['CLIENT'] } }

    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedFetchInquiryState.mockResolvedValue(buildInquiryState())
    mockBookingPageDataWithSingleSlot()
    mockedApiPost.mockResolvedValue({})

    renderView()

    const offlineOption = await screen.findByLabelText('Офлайн')
    await fireEvent.click(offlineOption)
    const bookingAgreement = screen.getAllByRole('checkbox')[0]!
    await fireEvent.click(bookingAgreement)
    await fireEvent.click(screen.getByRole('button', { name: 'Записатися' }))

    expect(mockedApiPost).toHaveBeenCalledWith(
      '/booking/sessions/',
      expect.objectContaining({
        slot_id: 100,
        setting_accepted: true,
        session_format: 'offline',
      })
    )
  })

  it('shows mapped backend validation message for session format errors', async () => {
    mockAuth.accessToken = 'token'
    mockAuth.me = { user: { id: 7, roles: ['CLIENT'] } }

    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedFetchInquiryState.mockResolvedValue(buildInquiryState())
    mockBookingPageDataWithSingleSlot()
    mockedApiPost.mockRejectedValue({
      response: {
        data: {
          code: 'SESSION_FORMAT_REQUIRED',
        },
      },
    })

    renderView()

    await screen.findByText('Довіра і формат')
    const bookingAgreement = screen.getAllByRole('checkbox')[0]!
    await fireEvent.click(bookingAgreement)
    await fireEvent.click(await screen.findByRole('button', { name: 'Записатися' }))

    expect(await screen.findByText('Оберіть формат сесії перед бронюванням.')).toBeInTheDocument()
  })

  it('shows slots for the selected local day even when the slot starts on the previous UTC date', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-12T10:00:00+02:00'))

    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])

    const selectedLocalDate = '2026-03-12'

    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/slots/') {
        const params = (config as { params?: Record<string, unknown> } | undefined)?.params || {}

        if (params.date_from === selectedLocalDate && params.date_to === selectedLocalDate) {
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
      await flushAsyncUpdates()

      const dateInput = screen.getByLabelText('Оберіть дату')
      await fireEvent.update(dateInput, '2026-03-12')
      await flushAsyncUpdates()

      expect(screen.getByText('00:30')).toBeInTheDocument()
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

    const chatButton = await screen.findByRole('button', { name: 'Написати повідомлення' })
    expect(chatButton).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Написати спеціалісту' })).toBeInTheDocument()
    expect(screen.getAllByText('Мої сесії')).toHaveLength(2)
    expect(screen.queryByText('Поставити запитання')).not.toBeInTheDocument()

    await fireEvent.click(chatButton as HTMLButtonElement)

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

  it('frames inquiry as a low-pressure entry point before booking', async () => {
    mockAuth.accessToken = 'token'
    mockAuth.me = { user: { id: 7, roles: ['CLIENT'] } }

    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedFetchInquiryState.mockResolvedValue(buildInquiryState())
    mockClientPageData()

    renderView()

    expect(await screen.findByText('Почніть із короткого запиту')).toBeInTheDocument()
    expect(
      screen.getAllByText('Після натискання відкриється короткий запит до бронювання. Це м’який старт без фіксації слота.')
    ).toHaveLength(2)
    expect(screen.getByText('Почніть без тиску')).toBeInTheDocument()
    expect(
      screen.getByText('Короткий запит не фіксує слот і не потребує оплати. Можна спокійно уточнити деталі перед рішенням.')
    ).toBeInTheDocument()
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
