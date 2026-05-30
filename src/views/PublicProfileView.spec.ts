import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import PublicProfileView from './PublicProfileView.vue'
import { BOOKING_UI_MESSAGES } from '../lib/bookingCopy'
import {
  acceptBookingRules,
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
  type PublicSpecialistProfile,
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
  REQUEST_TOPIC_OPTIONS: [
    { value: 'anxiety', label: 'Тривога' },
    { value: 'stress', label: 'Стрес' },
    { value: 'self_esteem', label: 'Самооцінка' },
    { value: 'relationships', label: 'Стосунки' },
    { value: 'burnout', label: 'Вигорання' },
    { value: 'discipline', label: 'Дисципліна' },
    { value: 'career', label: 'Кар’єра / робота' },
    { value: 'life_changes', label: 'Зміни в житті' },
    { value: 'not_sure', label: 'Не знаю' },
  ],
  acceptBookingRules: vi.fn(),
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
const mockedAcceptBookingRules = vi.mocked(acceptBookingRules)
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
const scrollIntoViewSpy = vi.fn()

async function flushAsyncUpdates() {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

function buildProfile(
  overrides: Partial<PublicSpecialistProfile> & Record<string, unknown> = {}
): PublicSpecialistProfile {
  const base: PublicSpecialistProfile = {
    therapist_id: 12,
    public_slug: 'olena',
    public_booking_mode: 'direct_booking',
    show_public_availability: true,
    public_direct_booking_enabled: true,
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
    booking_rules: {
      show_prompt: false,
      reason_codes: [],
      items: [],
    },
    platform_setting_text: 'Platform setting',
    setting_text: 'Therapist setting',
  }

  return {
    ...base,
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

function buildPendingBookingRules(overrides: Record<string, unknown> = {}) {
  return {
    show_prompt: true,
    reason_codes: ['PLATFORM_NOT_ACCEPTED', 'SPECIALIST_NOT_ACCEPTED'],
    items: [
      {
        scope: 'PLATFORM',
        version: 'platform-v1',
        text: 'Platform rule text.',
        accepted: false,
        accepted_at: null,
      },
      {
        scope: 'SPECIALIST',
        version: 'specialist-v1',
        specialist_id: 12,
        text: 'Specialist rule text.',
        accepted: false,
        accepted_at: null,
      },
    ],
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
    value: scrollIntoViewSpy,
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
    mockedAcceptBookingRules.mockReset()
    mockedCreateInquiryThread.mockReset()
    mockedFetchChatThreads.mockReset()
    mockedFetchInquiryMessages.mockReset()
    mockedFetchInquiryState.mockReset()
    mockedFetchPublicSpecialistProfile.mockReset()
    mockedFetchSpecialistProfile.mockReset()
    mockedFetchPublicAuthorJournalPosts.mockReset()
    mockedFetchPublicJournalCollections.mockReset()
    mockedSendInquiryMessage.mockReset()
    scrollIntoViewSpy.mockClear()
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

    expect(await screen.findByText('Загальна інформація')).toBeInTheDocument()
    expect(screen.queryByText('Профіль спеціаліста')).not.toBeInTheDocument()
    expect(screen.queryByText('Швидкий огляд')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Запишіться на консультацію' })).toBeInTheDocument()
    expect(screen.getByText('Документи та сертифікати')).toBeInTheDocument()
    expect(screen.getByText('Сертифікат CBT')).toBeInTheDocument()
    expect(screen.getByText('Зв’язок зі спеціалістом')).toBeInTheDocument()
    expect(screen.getByText('hello@example.com')).toBeInTheDocument()
    expect(await screen.findByText('Профілактика вигорання')).toBeInTheDocument()
    expect(await screen.findByText('Що кажуть клієнти')).toBeInTheDocument()
    expect(screen.getByText('Правила потрібно підтвердити один раз для цього спеціаліста.')).toBeInTheDocument()
    expect(container).toHaveTextContent('Дуже уважний підхід.')
  })

  it('keeps documents before journal and moves contact block to sticky sidebar', async () => {
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
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    await screen.findByRole('heading', { name: 'Оберіть дату і час' })
    expect(screen.queryByRole('heading', { name: 'Зв’язок зі спеціалістом' })).not.toBeInTheDocument()
    const contactBlockTitle = screen.getByText('Зв’язок зі спеціалістом')
    expect(contactBlockTitle.closest('.identity-rail__contacts')).toBeTruthy()
    const documentsHeading = screen.getByRole('heading', { name: 'Документи та сертифікати' })
    await screen.findByText('Профілактика вигорання')
    const journalHeading = screen.getByRole('heading', { name: 'Статті та матеріали спеціаліста' })

    expect(documentsHeading.compareDocumentPosition(journalHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('keeps session duration labels out of general info and leaves them in quick overview', async () => {
    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    const generalInfo = await screen.findByLabelText('Загальна інформація')
    expect(within(generalInfo).queryByText('Ознайомча сесія')).not.toBeInTheDocument()
    expect(within(generalInfo).queryByText('Стандартна сесія')).not.toBeInTheDocument()
    expect(screen.getAllByText(/Ознайомча сесія:/i).length).toBeGreaterThan(0)
  })

  it('replaces the hero video player with a video business card button that opens a modal', async () => {
    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()

    const videoButton = await screen.findByRole('button', { name: 'Відеовізитка' })
    expect(container.querySelector('.hero-video')).toBeNull()

    await fireEvent.click(videoButton)

    const modalTitle = await screen.findByRole('heading', { name: 'Відеовізитка' })
    const modal = modalTitle.closest('.profile-video-modal')
    expect(modal).not.toBeNull()
    const modalVideo = modal?.querySelector('video')
    expect(modalVideo).not.toBeNull()
    expect(modalVideo).toHaveAttribute('src', 'https://example.com/video.mp4')
  })

  it('does not render the video business card button when profile video is absent', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(buildProfile({ video_url: '' }))
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    await screen.findByText('Загальна інформація')
    expect(screen.queryByRole('button', { name: 'Відеовізитка' })).not.toBeInTheDocument()
  })

  it('shows back-to-top button only after scroll and scrolls to top on click', async () => {
    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })

    renderView()
    await screen.findByText('Загальна інформація')
    expect(screen.queryByRole('button', { name: 'Вгору' })).not.toBeInTheDocument()

    Object.defineProperty(window, 'scrollY', { value: 900, configurable: true })
    window.dispatchEvent(new Event('scroll'))

    const backToTopButton = await screen.findByRole('button', { name: 'Вгору' })
    await fireEvent.click(backToTopButton)

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    scrollToSpy.mockRestore()
  })

  it('does not show the hero read-more link when about section is available below', async () => {
    mockCommonPublicData()
    const profileWithSummary = buildProfile()
    ;(profileWithSummary as Record<string, any>).public_profile_summary = 'Short hero summary for read more action.'
    if ((profileWithSummary as Record<string, any>).sections?.about) {
      ;(profileWithSummary as Record<string, any>).sections.about.public_profile_summary =
        'Short hero summary for read more action.'
    }
    mockedFetchPublicSpecialistProfile.mockResolvedValue(profileWithSummary)
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    await screen.findByRole('heading', { name: 'Про мене' })

    const aboutSection = container.querySelector('#about-me')
    expect(aboutSection).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Докладніше про мене' })).not.toBeInTheDocument()
  })

  it('shows compact specialist terms reminder in booking sidebar when setting_text is present', async () => {
    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(await screen.findByText('Перед записом')).toBeInTheDocument()
    expect(screen.getByText('Умови спеціаліста')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Умови спеціаліста перед записом' })).not.toBeInTheDocument()
    expect(screen.getByText('Therapist setting')).toBeInTheDocument()
  })

  it('keeps profile narrative sections separated without duplicate exclusions in about copy', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        bio_about: 'Окремий опис спеціаліста.',
        bio_approach: 'Окремий опис підходу.',
        bio_for_whom: 'Працюю з тривогою та вигоранням.',
        bio_other: 'Не працюю з кризовими станами.',
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

    expect(await screen.findByRole('heading', { name: 'Про мене' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Формат роботи' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Основні запити' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'З чим я не працюю' })).toBeInTheDocument()
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
    expect(screen.queryByText('Section about title')).not.toBeInTheDocument()
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

    const directLinks = Array.from(container.querySelectorAll('a.identity-rail__contact')) as HTMLAnchorElement[]
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

      const directAction = container.querySelector('.identity-rail__contact')
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

    await screen.findByText('Загальна інформація')
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
    expect(screen.getAllByText('Оплата не списується автоматично.')).toHaveLength(1)
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

  it('allows selecting up to three optional request topics and sends stable values', async () => {
    mockCommonPublicData()
    mockBookingPageDataWithSingleSlot()
    mockedApiPost.mockResolvedValue({
      request: {
        id: 504,
        status: 'PENDING',
        created_at: '2026-04-07T10:00:00Z',
        next_step: null,
      },
    })

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Записатися' }))
    expect(await screen.findByText('Що хочете обговорити?')).toBeInTheDocument()

    const anxiety = screen.getByRole('button', { name: 'Тривога' })
    const stress = screen.getByRole('button', { name: 'Стрес' })
    const relationships = screen.getByRole('button', { name: 'Стосунки' })
    const burnout = screen.getByRole('button', { name: 'Вигорання' })

    await fireEvent.click(anxiety)
    await fireEvent.click(stress)
    await fireEvent.click(relationships)

    expect(anxiety).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Можна обрати до 3 тем.')).toBeInTheDocument()
    expect(burnout).toBeDisabled()

    await fireEvent.click(stress)
    expect(stress).toHaveAttribute('aria-pressed', 'false')
    expect(burnout).not.toBeDisabled()

    await fireEvent.click(burnout)
    await fireEvent.update(screen.getByLabelText('Ім’я'), 'Ірина')
    await fireEvent.update(screen.getByLabelText('Контакт'), 'iryna@example.com')
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати запит' }))

    expect(mockedApiPost).toHaveBeenCalledWith(
      '/public/specialists/olena/guest-booking-requests/',
      expect.objectContaining({
        request_topics: ['anxiety', 'relationships', 'burnout'],
      })
    )
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
        request_topics: [],
      }
    )
    expect(
      await screen.findByText('Запит надіслано. Спеціаліст зв’яжеться з вами, щоб узгодити час.')
    ).toBeInTheDocument()
    expect(screen.getByText(/Реєстрація не потрібна для цього кроку\./)).toBeInTheDocument()
    expect(
      screen.getByText(/Натискання кнопки не означає автоматичне списання оплати\./)
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(/Спеціаліст зв’яжеться з вами, щоб узгодити час\./).length
    ).toBeGreaterThan(0)
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
      await screen.findByText('Наразі нові запити без реєстрації тимчасово недоступні для цього профілю.')
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

    await fireEvent.click(await screen.findByRole('button', { name: 'Записатися' }))

    const confirmHeading = await screen.findByRole('heading', { name: 'Підтвердження запису' })
    expect(confirmHeading).toBeInTheDocument()
    const confirmModal = confirmHeading.closest('.setting-modal__content')
    expect(confirmModal).toBeTruthy()
    expect(within(confirmModal as HTMLElement).getByText('Дата')).toBeInTheDocument()
    expect(within(confirmModal as HTMLElement).getByText('Час')).toBeInTheDocument()
    expect(within(confirmModal as HTMLElement).getByText('Формат')).toBeInTheDocument()
    expect(within(confirmModal as HTMLElement).getByText('Тривалість')).toBeInTheDocument()
    expect(mockedApiPost).not.toHaveBeenCalledWith('/booking/sessions/', expect.anything())

    await fireEvent.click(screen.getByRole('button', { name: 'Підтвердити запис' }))

    expect(mockedApiPost).toHaveBeenCalledWith(
      '/booking/sessions/',
      expect.objectContaining({
        slot_id: 100,
        setting_accepted: true,
      })
    )
    expect(screen.queryByRole('heading', { name: 'Запит на бронювання' })).not.toBeInTheDocument()
  })

  it('blocks double-submit while client booking confirmation is in progress', async () => {
    mockAuth.accessToken = 'token'
    mockAuth.me = { user: { id: 7, roles: ['CLIENT'] } }

    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedFetchInquiryState.mockResolvedValue(buildInquiryState())
    mockBookingPageDataWithSingleSlot()

    let resolveBookingRequest: ((value?: unknown) => void) | undefined
    const bookingRequestPromise = new Promise<unknown>((resolve) => {
      resolveBookingRequest = resolve
    })
    mockedApiPost.mockImplementation(async (url) => {
      if (url === '/booking/sessions/') {
        return bookingRequestPromise
      }
      throw new Error(`Unexpected apiPost call: ${url}`)
    })

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Записатися' }))
    const confirmButton = await screen.findByRole('button', { name: 'Підтвердити запис' })
    await fireEvent.click(confirmButton)
    await fireEvent.click(confirmButton)

    const bookingCalls = mockedApiPost.mock.calls.filter((call) => call[0] === '/booking/sessions/')
    expect(bookingCalls).toHaveLength(1)
    const confirmHeading = await screen.findByRole('heading', { name: 'Підтвердження запису' })
    const confirmModal = confirmHeading.closest('.setting-modal__content')
    expect(confirmModal).toBeTruthy()
    expect(await within(confirmModal as HTMLElement).findByRole('button', { name: 'Бронюємо...' })).toBeDisabled()

    if (resolveBookingRequest) resolveBookingRequest({})
    await flushAsyncUpdates()
  })

  it('shows friendly unavailable slot error for client confirmation booking', async () => {
    mockAuth.accessToken = 'token'
    mockAuth.me = { user: { id: 7, roles: ['CLIENT'] } }

    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedFetchInquiryState.mockResolvedValue(buildInquiryState())
    mockBookingPageDataWithSingleSlot()
    mockedApiPost.mockRejectedValue({
      response: {
        status: 409,
      },
    })

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Записатися' }))
    await fireEvent.click(await screen.findByRole('button', { name: 'Підтвердити запис' }))

    expect(await screen.findByText('Обраний слот уже недоступний. Будь ласка, виберіть інший час.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Підтвердження запису' })).not.toBeInTheDocument()
    const slotCalls = mockedApiGet.mock.calls.filter((call) => call[0] === '/booking/slots/')
    expect(slotCalls.length).toBeGreaterThan(1)
  })

  it('blocks booking for a client until booking rules acceptance is confirmed', async () => {
    mockAuth.accessToken = 'token'
    mockAuth.me = { user: { id: 7, roles: ['CLIENT'] } }

    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        booking_rules: {
          show_prompt: true,
          reason_codes: ['PLATFORM_NOT_ACCEPTED', 'SPECIALIST_NOT_ACCEPTED'],
          items: [
            {
              scope: 'PLATFORM',
              version: 'platform-v1',
              text: 'Platform rule text.',
              accepted: false,
              accepted_at: null,
            },
            {
              scope: 'SPECIALIST',
              version: 'specialist-v1',
              specialist_id: 12,
              text: 'Specialist rule text.',
              accepted: false,
              accepted_at: null,
            },
          ],
        },
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
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
    mockedAcceptBookingRules.mockResolvedValue({
      status: 'ok',
      created_count: 2,
      already_accepted_count: 0,
      booking_rules: {
        show_prompt: false,
        reason_codes: [],
        items: [
          {
            scope: 'PLATFORM',
            version: 'platform-v1',
            text: 'Platform rule text.',
            accepted: true,
            accepted_at: '2026-04-09T08:00:00Z',
          },
          {
            scope: 'SPECIALIST',
            version: 'specialist-v1',
            specialist_id: 12,
            text: 'Specialist rule text.',
            accepted: true,
            accepted_at: '2026-04-09T08:00:00Z',
          },
        ],
      },
    })
    mockedApiPost.mockImplementation(async (url) => {
      if (url === '/booking/sessions/') return {}
      throw new Error(`Unexpected apiPost call: ${url}`)
    })

    renderView()

    expect(await screen.findByText('Підтвердіть правила перед записом')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Щоб продовжити запис до цього спеціаліста, підтвердіть актуальні правила платформи та умови спеціаліста. Повторне підтвердження знадобиться лише тоді, якщо правила платформи або умови спеціаліста оновляться.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Загальні правила платформи')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Правила перед записом')).getByText('Умови спеціаліста')).toBeInTheDocument()

    const bookButton = await screen.findByRole('button', { name: 'Записатися' })
    await fireEvent.click(bookButton)
    expect(await screen.findByRole('heading', { name: 'Підтвердження запису' })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Підтвердити запис' }))

    expect(await screen.findByText(BOOKING_UI_MESSAGES.acceptSettingBeforeBooking)).toBeInTheDocument()
    expect(mockedApiPost).not.toHaveBeenCalledWith('/booking/sessions/', expect.anything())

    await fireEvent.click(screen.getByRole('button', { name: 'Підтвердити правила перед записом' }))

    expect(mockedAcceptBookingRules).toHaveBeenCalledWith({ specialist_id: 12 })
    expect(mockedApiPost).toHaveBeenCalledWith(
      '/booking/sessions/',
      expect.objectContaining({
        slot_id: 100,
        setting_accepted: true,
      })
    )
  })

  it('does not render booking rules prompt when booking_rules has no active items', async () => {
    mockAuth.accessToken = 'token'
    mockAuth.me = { user: { id: 7, roles: ['CLIENT'] } }

    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        booking_rules: {
          show_prompt: false,
          reason_codes: [],
          items: [],
        },
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedFetchInquiryState.mockResolvedValue(buildInquiryState())
    mockBookingPageDataWithSingleSlot()
    mockedApiPost.mockResolvedValue({})

    renderView()

    expect(screen.queryByText('Підтвердіть правила перед записом')).not.toBeInTheDocument()
    await fireEvent.click(await screen.findByRole('button', { name: 'Записатися' }))
    await fireEvent.click(await screen.findByRole('button', { name: 'Підтвердити запис' }))

    expect(mockedApiPost).toHaveBeenCalledWith(
      '/booking/sessions/',
      expect.objectContaining({
        slot_id: 100,
        setting_accepted: true,
      })
    )
  })

  it('renders only platform booking rules section when only platform item is pending', async () => {
    mockAuth.accessToken = 'token'
    mockAuth.me = { user: { id: 7, roles: ['CLIENT'] } }

    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        booking_rules: buildPendingBookingRules({
          reason_codes: ['PLATFORM_NOT_ACCEPTED'],
          items: [
            {
              scope: 'PLATFORM',
              version: 'platform-v1',
              text: 'Platform-only rule.',
              accepted: false,
              accepted_at: null,
            },
          ],
        }),
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedFetchInquiryState.mockResolvedValue(buildInquiryState())
    mockBookingPageDataWithSingleSlot()

    renderView()

    expect(await screen.findByText('Підтвердіть правила перед записом')).toBeInTheDocument()
    expect(screen.getByText('Загальні правила платформи')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Правила перед записом')).queryByText('Умови спеціаліста')).not.toBeInTheDocument()
  })

  it('renders only specialist booking rules section when only specialist item is pending', async () => {
    mockAuth.accessToken = 'token'
    mockAuth.me = { user: { id: 7, roles: ['CLIENT'] } }

    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        booking_rules: buildPendingBookingRules({
          reason_codes: ['SPECIALIST_NOT_ACCEPTED'],
          items: [
            {
              scope: 'SPECIALIST',
              version: 'specialist-v1',
              specialist_id: 12,
              text: 'Specialist-only rule.',
              accepted: false,
              accepted_at: null,
            },
          ],
        }),
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedFetchInquiryState.mockResolvedValue(buildInquiryState())
    mockBookingPageDataWithSingleSlot()

    renderView()

    expect(await screen.findByText('Підтвердіть правила перед записом')).toBeInTheDocument()
    expect(screen.queryByText('Загальні правила платформи')).not.toBeInTheDocument()
    expect(within(screen.getByLabelText('Правила перед записом')).getByText('Умови спеціаліста')).toBeInTheDocument()
  })

  it('does not re-prompt booking rules after successful acceptance for repeated booking actions', async () => {
    mockAuth.accessToken = 'token'
    mockAuth.me = { user: { id: 7, roles: ['CLIENT'] } }

    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        booking_rules: buildPendingBookingRules(),
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedFetchInquiryState.mockResolvedValue(buildInquiryState())
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/slots/') {
        const params = (config as { params?: { therapist_id?: number } } | undefined)?.params || {}
        if (params.therapist_id === 12) {
          const secondStart = new Date()
          secondStart.setHours(13, 0, 0, 0)
          const secondEnd = new Date(secondStart)
          secondEnd.setMinutes(secondEnd.getMinutes() + 50)
          return [
            buildTodayLocalSlot({ id: 100 }),
            buildTodayLocalSlot({
              id: 101,
              start_at: secondStart.toISOString(),
              end_at: secondEnd.toISOString(),
            }),
          ]
        }
        return []
      }
      if (url === '/booking/sessions/') return []
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedAcceptBookingRules.mockResolvedValue({
      status: 'ok',
      created_count: 2,
      already_accepted_count: 0,
      booking_rules: {
        show_prompt: false,
        reason_codes: [],
        items: [],
      },
    })
    mockedApiPost.mockImplementation(async (url) => {
      if (url === '/booking/sessions/') return {}
      throw new Error(`Unexpected apiPost call: ${url}`)
    })

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Підтвердити правила перед записом' }))
    expect(mockedAcceptBookingRules).toHaveBeenCalledWith({ specialist_id: 12 })

    const slotButtons = await screen.findAllByRole('button', { name: 'Записатися' })
    await fireEvent.click(slotButtons[0]!)
    await fireEvent.click(screen.getByRole('button', { name: 'Підтвердити запис' }))
    await fireEvent.click(screen.getAllByRole('button', { name: 'Закрити' })[0]!)
    await fireEvent.click((await screen.findAllByRole('button', { name: 'Записатися' }))[0]!)
    await fireEvent.click(screen.getByRole('button', { name: 'Підтвердити запис' }))

    const acceptCalls = mockedAcceptBookingRules.mock.calls
    const bookingCalls = mockedApiPost.mock.calls.filter((call) => call[0] === '/booking/sessions/')
    expect(acceptCalls).toHaveLength(1)
    expect(bookingCalls).toHaveLength(2)
  })

  it('requires guest booking rules checkbox when active rules are present', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        booking_rules: buildPendingBookingRules(),
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockBookingPageDataWithSingleSlot()
    mockedApiPost.mockResolvedValue({
      request: {
        id: 601,
        status: 'PENDING',
        created_at: '2026-04-07T10:00:00Z',
        next_step: null,
      },
    })

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Записатися' }))
    expect(await screen.findByText('Загальні правила платформи')).toBeInTheDocument()
    expect(screen.getAllByText('Умови спеціаліста').length).toBeGreaterThan(0)
    expect(
      screen.getByText(/Для клієнта без акаунта підтвердження діє лише для поточного запиту/i)
    ).toBeInTheDocument()

    await fireEvent.update(screen.getByLabelText('Ім’я'), 'Ірина')
    await fireEvent.update(screen.getByLabelText('Контакт'), 'iryna@example.com')
    const submitButton = screen.getByRole('button', { name: 'Надіслати запит' })
    expect(submitButton).toBeDisabled()

    await fireEvent.click(screen.getByRole('checkbox', { name: 'Підтверджую правила перед відправкою цього запиту' }))
    expect(submitButton).not.toBeDisabled()

    await fireEvent.click(submitButton)
    expect(mockedApiPost).toHaveBeenCalledWith(
      '/public/specialists/olena/guest-booking-requests/',
      expect.objectContaining({
        slot_id: 100,
      })
    )
  })

  it('does not require guest booking rules checkbox when there are no active booking rules', async () => {
    mockCommonPublicData()
    mockBookingPageDataWithSingleSlot()
    mockedApiPost.mockResolvedValue({
      request: {
        id: 602,
        status: 'PENDING',
        created_at: '2026-04-07T10:00:00Z',
        next_step: null,
      },
    })

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Записатися' }))
    expect(
      screen.queryByRole('checkbox', {
        name: 'Підтверджую правила перед відправкою цього запиту',
      })
    ).not.toBeInTheDocument()
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

    await fireEvent.click(await screen.findByRole('button', { name: 'Записатися' }))
    await fireEvent.click(await screen.findByRole('button', { name: 'Підтвердити запис' }))

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

    await fireEvent.click(await screen.findByRole('button', { name: 'Записатися' }))
    await fireEvent.click(await screen.findByRole('button', { name: 'Підтвердити запис' }))

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
    await fireEvent.click(await screen.findByRole('button', { name: 'Записатися' }))
    await fireEvent.click(await screen.findByRole('button', { name: 'Підтвердити запис' }))

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
    await fireEvent.click(await screen.findByRole('button', { name: 'Записатися' }))
    await fireEvent.click(await screen.findByRole('button', { name: 'Підтвердити запис' }))

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

    await screen.findByText('Загальна інформація')
    await fireEvent.click(await screen.findByRole('button', { name: 'Записатися' }))
    await fireEvent.click(await screen.findByRole('button', { name: 'Підтвердити запис' }))

    const formatErrors = await screen.findAllByText('Оберіть формат сесії перед бронюванням.')
    expect(formatErrors.length).toBeGreaterThan(0)
  })

  it('hides booking calendar and shows request CTA in request-only mode', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        public_booking_mode: 'request_only',
        show_public_availability: false,
        public_direct_booking_enabled: false,
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(await screen.findByRole('heading', { name: 'Залишити запит' })).toBeInTheDocument()
    expect(screen.getByText('Залиште запит на консультацію')).toBeInTheDocument()
    expect(screen.queryByText('Запишіться на консультацію')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Оберіть дату і час' })).not.toBeInTheDocument()
    const requestButtons = screen.getAllByRole('button', { name: 'Залишити запит' })
    expect(requestButtons.length).toBeGreaterThan(0)
    expect(requestButtons[0]).toHaveClass('btn--primary')
    expect(screen.queryByRole('link', { name: 'Переглянути вільні вікна' })).not.toBeInTheDocument()
    const slotCalls = mockedApiGet.mock.calls.filter((call) => call[0] === '/booking/slots/')
    expect(slotCalls).toHaveLength(0)
  })

  it('opens request form from request-only CTA for a guest visitor', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        public_booking_mode: 'request_only',
        show_public_availability: false,
        public_direct_booking_enabled: false,
        booking_rules: buildPendingBookingRules(),
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    await fireEvent.click((await screen.findAllByRole('button', { name: 'Залишити запит' }))[0]!)

    expect(await screen.findByRole('heading', { name: 'Запит до спеціаліста' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Запит на бронювання' })).not.toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', { name: 'Підтверджую правила перед надсиланням цього запиту' })
    ).toBeInTheDocument()
    expect(screen.getByText(/Якщо перед надсиланням запиту є правила/)).toBeInTheDocument()
    expect(screen.getByText('Опишіть коротко ваш запит, і спеціаліст зв’яжеться з вами, щоб узгодити час.')).toBeInTheDocument()
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('uses request-first copy for an authenticated specialist previewing own request-only profile', async () => {
    mockRoute.params.slug = 'specialist-2'
    mockAuth.accessToken = 'token'
    mockAuth.user = { roles: ['SPECIALIST'] }
    mockAuth.me = { user: { id: 12, roles: ['SPECIALIST'] } }

    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        public_slug: 'specialist-2',
        public_booking_mode: 'request_only',
        show_public_availability: false,
        public_direct_booking_enabled: true,
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/public/specialists/specialist-2/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(await screen.findByText('Залиште запит на консультацію')).toBeInTheDocument()
    expect(screen.queryByText('Запишіться на консультацію')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Оберіть дату і час' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Переглянути вільні вікна' })).not.toBeInTheDocument()

    await fireEvent.click((await screen.findAllByRole('button', { name: 'Залишити запит' }))[0]!)

    expect(await screen.findByRole('heading', { name: 'Запит до спеціаліста' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Запит на бронювання' })).not.toBeInTheDocument()
  })

  it('keeps the request modal submit action inside the modal scroll body', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        public_booking_mode: 'request_only',
        show_public_availability: false,
        public_direct_booking_enabled: false,
        booking_rules: buildPendingBookingRules(),
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()

    await fireEvent.click((await screen.findAllByRole('button', { name: 'Залишити запит' }))[0]!)
    await screen.findByRole('heading', { name: 'Запит до спеціаліста' })

    const modal = container.querySelector('.guest-booking-modal')
    const modalBody = modal?.querySelector('.setting-modal__body')
    expect(modal).not.toBeNull()
    expect(modalBody).not.toBeNull()
    expect(within(modalBody as HTMLElement).getByRole('button', { name: 'Надіслати запит' })).toBeInTheDocument()
  })

  it('shows booking calendar and request fallback in direct booking mode', async () => {
    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockBookingPageDataWithSingleSlot()

    renderView()

    expect(await screen.findByRole('heading', { name: 'Оберіть дату і час' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Переглянути вільні вікна' })).toHaveAttribute('href', '#slots')
    expect(screen.getAllByRole('button', { name: 'Залишити запит' }).length).toBeGreaterThan(0)
  })

  it('shows no-slots helper and request CTA when direct booking has no available slots', async () => {
    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return []
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(await screen.findByRole('heading', { name: 'Оберіть дату і час' })).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByText('Завантажуємо вільні вікна')).not.toBeInTheDocument()
    })
    expect(
      screen.getByText(/Наразі немає доступного часу для прямого запису/)
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Залишити запит' }).length).toBeGreaterThan(0)
  })

  it('hides booking calendar when direct booking mode has hidden public availability', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        public_booking_mode: 'direct_booking',
        show_public_availability: false,
        public_direct_booking_enabled: false,
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(await screen.findByRole('heading', { name: 'Залишити запит' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Оберіть дату і час' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Переглянути вільні вікна' })).not.toBeInTheDocument()
    expect(screen.getByText('Спеціаліст зараз не показує вільний час для прямого запису. Залиште запит, щоб узгодити час.')).toBeInTheDocument()
  })

  it('submits request-only guest booking request without slot_id', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        public_booking_mode: 'request_only',
        show_public_availability: false,
        public_direct_booking_enabled: false,
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedApiPost.mockResolvedValue({
      request: {
        id: 1,
        status: 'pending',
        created_at: '2026-05-20T12:00:00Z',
        next_step: 'Request sent.',
      },
    })

    renderView()

    await fireEvent.click((await screen.findAllByRole('button', { name: 'Залишити запит' }))[0]!)
    await screen.findByRole('heading', { name: 'Запит до спеціаліста' })
    await fireEvent.update(screen.getByLabelText('Ім’я'), 'Guest Person')
    await fireEvent.update(screen.getByLabelText('Контакт'), 'guest@example.com')
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати запит' }))

    expect(mockedApiPost).toHaveBeenCalledWith(
      '/public/specialists/olena/guest-booking-requests/',
      expect.objectContaining({
        session_format: 'online',
        guest_name: 'Guest Person',
        contact_channel: 'email',
        contact_value: 'guest@example.com',
      })
    )
    expect(mockedApiPost).not.toHaveBeenCalledWith(
      '/public/specialists/olena/guest-booking-requests/',
      expect.objectContaining({ slot_id: expect.any(Number) })
    )
  })

  it('opens request form from request-only CTA for an active client instead of chat', async () => {
    mockAuth.accessToken = 'token'
    mockAuth.me = { user: { id: 7, roles: ['CLIENT'] } }

    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        public_booking_mode: 'request_only',
        show_public_availability: false,
        public_direct_booking_enabled: false,
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
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
    mockClientPageData()

    renderView()

    const chatButtons = await screen.findAllByRole('button', { name: 'Написати в чат' })
    expect(chatButtons.length).toBeGreaterThan(0)
    expect(chatButtons[0]).toHaveClass('btn--primary')
    expect(
      screen.getAllByRole('button', { name: 'Залишити запит' }).some((button) =>
        button.classList.contains('btn--primary')
      )
    ).toBe(false)
    await fireEvent.click((await screen.findAllByRole('button', { name: 'Залишити запит' }))[0]!)

    expect(await screen.findByRole('heading', { name: 'Запит до спеціаліста' })).toBeInTheDocument()
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('opens request form from request-only CTA for an authenticated client without active chat', async () => {
    mockAuth.accessToken = 'token'
    mockAuth.me = { user: { id: 7, roles: ['CLIENT'] } }

    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        public_booking_mode: 'request_only',
        show_public_availability: false,
        public_direct_booking_enabled: false,
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedFetchInquiryState.mockResolvedValue(buildInquiryState())
    mockClientPageData()

    renderView()

    await fireEvent.click((await screen.findAllByRole('button', { name: 'Залишити запит' }))[0]!)

    expect(await screen.findByRole('heading', { name: 'Запит до спеціаліста' })).toBeInTheDocument()
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('keeps chat as a separate CTA for an active client', async () => {
    mockAuth.accessToken = 'token'
    mockAuth.me = { user: { id: 7, roles: ['CLIENT'] } }

    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        public_booking_mode: 'request_only',
        show_public_availability: false,
        public_direct_booking_enabled: false,
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
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
    mockClientPageData()

    renderView()

    const chatButtons = await screen.findAllByRole('button', { name: 'Написати в чат' })
    expect(chatButtons.length).toBeGreaterThan(0)
    expect(chatButtons[0]).toHaveClass('btn--primary')

    await fireEvent.click(chatButtons[0]!)

    expect(mockRouter.push).toHaveBeenCalledWith({
      name: 'client-chat',
      query: { therapist_id: '12' },
    })
  })

  it('submits active-client request-only booking request without slot_id', async () => {
    mockAuth.accessToken = 'token'
    mockAuth.me = { user: { id: 7, roles: ['CLIENT'] } }

    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        public_booking_mode: 'request_only',
        show_public_availability: false,
        public_direct_booking_enabled: false,
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
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
    mockClientPageData()
    mockedApiPost.mockResolvedValue({
      request: {
        id: 2,
        status: 'pending',
        created_at: '2026-05-20T12:00:00Z',
        next_step: null,
      },
    })

    renderView()

    await fireEvent.click((await screen.findAllByRole('button', { name: 'Залишити запит' }))[0]!)
    await fireEvent.update(await screen.findByLabelText('Ім’я'), 'Client Person')
    await fireEvent.update(screen.getByLabelText('Контакт'), 'client@example.com')
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати запит' }))

    expect(mockedApiPost).toHaveBeenCalledWith(
      '/public/specialists/olena/guest-booking-requests/',
      expect.objectContaining({
        session_format: 'online',
        guest_name: 'Client Person',
        contact_channel: 'email',
        contact_value: 'client@example.com',
      })
    )
    expect(mockedApiPost).not.toHaveBeenCalledWith(
      '/public/specialists/olena/guest-booking-requests/',
      expect.objectContaining({ slot_id: expect.any(Number) })
    )
  })

  it('opens request form from direct booking fallback CTA for an active client instead of chat', async () => {
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
    mockBookingPageDataWithSingleSlot()

    renderView()

    const fallbackButton = await screen.findByRole('button', { name: 'Залишити запит' })
    await fireEvent.click(fallbackButton)

    expect(await screen.findByRole('heading', { name: 'Запит на бронювання' })).toBeInTheDocument()
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('renders a monthly booking calendar and marks available days from month slots', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-12T10:00:00+02:00'))

    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/slots/') {
        const params = (config as { params?: Record<string, unknown> } | undefined)?.params || {}
        expect(params).toEqual(
          expect.objectContaining({
            therapist_id: 12,
            date_from: '2026-03-01',
            date_to: '2026-03-31',
          })
        )
        return [
          {
            id: 310,
            start_at: '2026-03-14T10:00:00+02:00',
            end_at: '2026-03-14T10:50:00+02:00',
          },
        ]
      }
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    try {
      renderView()

      expect(await screen.findByText(/Березень 2026/i)).toBeInTheDocument()
      const availableDay = await screen.findByRole('gridcell', {
        name: /14 березня 2026.*доступно слотів: 1/i,
      })
      expect(availableDay).toHaveClass('booking-calendar__day--available')
      expect(
        screen.getByText('Наразі немає доступного часу для прямого запису. Ви можете залишити запит.')
      ).toBeInTheDocument()

      await fireEvent.click(availableDay)

      expect(availableDay).toHaveClass('booking-calendar__day--selected')
      expect(await screen.findByText('10:00')).toBeInTheDocument()
      expect(
        screen.queryByText('Наразі немає доступного часу для прямого запису. Ви можете залишити запит.')
      ).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('loads previous and next month ranges from calendar navigation', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-12T10:00:00+02:00'))

    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return []
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    try {
      renderView()
      expect(await screen.findByText(/Березень 2026/i)).toBeInTheDocument()

      await fireEvent.click(screen.getByRole('button', { name: 'Наступний місяць' }))
      expect(await screen.findByText(/Квітень 2026/i)).toBeInTheDocument()

      await fireEvent.click(screen.getByRole('button', { name: 'Попередній місяць' }))
      expect(await screen.findByText(/Березень 2026/i)).toBeInTheDocument()

      const slotCalls = mockedApiGet.mock.calls.filter((call) => call[0] === '/booking/slots/')
      expect(slotCalls).toEqual(
        expect.arrayContaining([
          [
            '/booking/slots/',
            expect.objectContaining({
              params: expect.objectContaining({
                therapist_id: 12,
                date_from: '2026-03-01',
                date_to: '2026-03-31',
              }),
            }),
          ],
          [
            '/booking/slots/',
            expect.objectContaining({
              params: expect.objectContaining({
                therapist_id: 12,
                date_from: '2026-04-01',
                date_to: '2026-04-30',
              }),
            }),
          ],
        ])
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it('shows a month-level empty state when the visible month has no slots', async () => {
    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return []
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    await screen.findByRole('heading', { name: 'Оберіть дату і час' })
    await waitFor(() => {
      const slotCalls = mockedApiGet.mock.calls.filter((call) => call[0] === '/booking/slots/')
      expect(slotCalls).toHaveLength(1)
    })
    await flushAsyncUpdates()
    expect(
      screen.getByText('Наразі немає доступного часу для прямого запису. Ви можете залишити запит.')
    ).toBeInTheDocument()
    const slotCalls = mockedApiGet.mock.calls.filter((call) => call[0] === '/booking/slots/')
    expect(slotCalls).toHaveLength(1)
  })

  it('shows slots for the selected local day even when the slot starts on the previous UTC date', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-12T10:00:00+02:00'))

    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])

    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/slots/') {
        const params = (config as { params?: Record<string, unknown> } | undefined)?.params || {}

        if (params.date_from === '2026-03-01' && params.date_to === '2026-03-31') {
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

      expect(await screen.findByText(/Березень 2026/i)).toBeInTheDocument()
      await flushAsyncUpdates()

      expect(screen.getByText('00:30')).toBeInTheDocument()
      expect(
        screen.queryByText('Наразі немає доступного часу для прямого запису. Ви можете залишити запит.')
      ).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('shows internal chat as a separate CTA for an active client relation', async () => {
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

    const chatButtons = await screen.findAllByRole('button', { name: 'Написати в чат' })
    expect(chatButtons.length).toBeGreaterThan(0)
    expect(chatButtons[0]).toHaveClass('btn--primary')
    expect(screen.queryByRole('button', { name: 'Написати повідомлення' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Написати спеціалісту' })).not.toBeInTheDocument()
    expect(screen.getAllByText('Мої сесії')).toHaveLength(2)
    expect(screen.getAllByText('Відгуки').length).toBeGreaterThan(0)
    expect(
      screen.getAllByRole('button', { name: 'Залишити запит' }).some((button) =>
        button.classList.contains('btn--primary')
      )
    ).toBe(false)
    expect(
      screen.getAllByText('Ви вже працюєте з цим спеціалістом. Можете продовжити спілкування або переглянути свої сесії.').length
    ).toBeGreaterThan(0)
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
    expect(screen.queryByRole('button', { name: 'Написати в чат' })).not.toBeInTheDocument()
    expect(screen.queryByText('Відгуки')).not.toBeInTheDocument()
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
