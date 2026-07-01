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
    { value: 'boundaries', label: 'Особисті межі' },
    { value: 'loneliness', label: 'Самотність' },
    { value: 'guilt', label: 'Почуття провини' },
    { value: 'decisions', label: 'Складні рішення' },
    { value: 'emotional_exhaustion', label: 'Емоційне виснаження' },
    { value: 'self_discovery', label: 'Пошук себе' },
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
const publicBoundariesHelperText =
  '\u0422\u0443\u0442 \u0441\u043f\u0435\u0446\u0456\u0430\u043b\u0456\u0441\u0442 \u043f\u043e\u044f\u0441\u043d\u044e\u0454, \u0443 \u044f\u043a\u0438\u0445 \u0432\u0438\u043f\u0430\u0434\u043a\u0430\u0445 \u043a\u0440\u0430\u0449\u0435 \u0437\u0432\u0435\u0440\u043d\u0443\u0442\u0438\u0441\u044f \u0434\u043e \u0456\u043d\u0448\u043e\u0433\u043e \u0444\u0430\u0445\u0456\u0432\u0446\u044f \u0430\u0431\u043e \u043e\u0442\u0440\u0438\u043c\u0430\u0442\u0438 \u043c\u0435\u0434\u0438\u0447\u043d\u0443 \u0434\u043e\u043f\u043e\u043c\u043e\u0433\u0443.'

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
    public_display_name: 'Олена',
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
    standard_session_duration_minutes: 50,
    intro_duration_minutes: 30,
    intro_price: '600',
    intro_price_currency: 'UAH',
    couple_session_enabled: false,
    couple_session_price: null,
    couple_session_price_currency: null,
    couple_session_duration_minutes: null,
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

function buildTodayLocalSlotWithDuration(id: number, hour: number, durationMinutes: number) {
  const start = new Date()
  start.setHours(hour, 0, 0, 0)
  const end = new Date(start)
  end.setMinutes(end.getMinutes() + durationMinutes)
  return buildTodayLocalSlot({
    id,
    start_at: start.toISOString(),
    end_at: end.toISOString(),
  })
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

function mockBookingPageDataWithSlots(publicSlots: Array<Record<string, unknown>>) {
  mockedApiGet.mockImplementation(async (url, config) => {
    if (url === '/booking/slots/') {
      return publicSlots
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

async function findClientBookingConfirmModal() {
  const heading = await screen.findByRole('heading', { name: 'Запит на час' })
  const modal = heading.closest('.setting-modal__content')
  expect(modal).toBeTruthy()
  return modal as HTMLElement
}

async function clickClientBookingConfirmButton() {
  const modal = await findClientBookingConfirmModal()
  await fireEvent.click(within(modal).getByRole('button', { name: 'Надіслати запит на цей час' }))
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
    const bookingCard = within(screen.getByTestId('public-profile-booking-card'))
    expect(bookingCard.getByRole('heading', { name: 'Оберіть час' })).toBeInTheDocument()
    expect(screen.getByText('Документи та сертифікати')).toBeInTheDocument()
    expect(screen.getByText('Сертифікат CBT')).toBeInTheDocument()
    expect(screen.getByText('Контакти спеціаліста')).toBeInTheDocument()
    expect(screen.getByText('hello@example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Скопіювати Email: hello@example.com' })).toBeInTheDocument()
    expect(screen.queryByText('Скопіювати')).not.toBeInTheDocument()
    const generalInfo = screen.getByLabelText('Загальна інформація')
    expect(within(generalInfo).getByText('Локація')).toBeInTheDocument()
    expect(within(generalInfo).queryByText('Офлайн локація')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Спеціалізації')).toBeInTheDocument()
    expect(screen.queryByText('Тривога, Вигорання · Київ')).not.toBeInTheDocument()
    expect(await screen.findByText('Профілактика вигорання')).toBeInTheDocument()
    expect(await screen.findByText('Що кажуть клієнти')).toBeInTheDocument()
    expect(screen.getByText('Правила потрібно підтвердити один раз для цього спеціаліста.')).toBeInTheDocument()
    expect(container).toHaveTextContent('Дуже уважний підхід.')
  })

  it('renders the exact public display name without automatic shortening', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        public_display_name: 'Олена Коваль, психолог',
        display_name: 'Олена Коваль, психолог',
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

    expect(
      await screen.findByRole('heading', { name: 'Олена Коваль, психолог' })
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Олена П.' })).not.toBeInTheDocument()
  })

  it('falls back to the legacy display name when the alias is empty', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        public_display_name: '',
        display_name: 'Олена Коваль',
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

    expect(await screen.findByRole('heading', { name: 'Олена Коваль' })).toBeInTheDocument()
  })

  it('copies a visible specialist contact without opening an external app', async () => {
    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    await fireEvent.click(
      await screen.findByRole('button', { name: 'Скопіювати Email: hello@example.com' })
    )

    expect(clipboardWriteTextSpy).toHaveBeenCalledWith('hello@example.com')
    expect(windowOpenSpy).not.toHaveBeenCalled()
    expect(await screen.findByText('Скопійовано')).toBeInTheDocument()
  })

  it('keeps documents before journal and moves contact block to sticky sidebar', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        education_summary: 'Маю профільну психологічну освіту.',
        education_items: ['Магістр психології'],
        professional_development_items: ['Навчання з когнітивно-поведінкової терапії'],
      })
    )
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

    await screen.findByRole('heading', { name: 'Оберіть час для запиту' })
    expect(screen.queryByText('Зв’язок зі спеціалістом')).not.toBeInTheDocument()
    const contactBlockTitle = screen.getByText('Контакти спеціаліста')
    expect(contactBlockTitle.closest('.identity-rail__contacts')).toBeTruthy()
    const documentsHeading = screen.getByRole('heading', { name: 'Документи та сертифікати' })
    expect(screen.getByText('Маю профільну психологічну освіту.')).toBeInTheDocument()
    expect(screen.getByText('Магістр психології')).toBeInTheDocument()
    expect(screen.getByText('Навчання з когнітивно-поведінкової терапії')).toBeInTheDocument()
    expect(screen.getByText('Сертифікат CBT')).toBeInTheDocument()
    expect(
      screen.queryByText(
        'Коротко про професійну підготовку спеціаліста та матеріали, які він додав для ознайомлення.'
      )
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/матеріали, які він додав/i)).not.toBeInTheDocument()
    expect(
      screen.queryByText(/Матеріали, завантажені спеціалістом для ознайомлення/i)
    ).not.toBeInTheDocument()
    await screen.findByText('Профілактика вигорання')
    const journalHeading = screen.getByRole('heading', { name: 'Блог спеціаліста' })
    expect(screen.queryByText('Власний блог')).not.toBeInTheDocument()

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

  it('renders couple consultation offer only when it is enabled and configured', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        couple_session_enabled: true,
        couple_session_price: '2200',
        couple_session_price_currency: 'UAH',
        couple_session_duration_minutes: 75,
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

    expect(await screen.findByText('Парна консультація: 2200 грн')).toBeInTheDocument()
    expect(screen.getByText('75 хв')).toBeInTheDocument()
  })

  it('hides incomplete couple offer and intro offer without public price', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        intro_price: null,
        intro_price_currency: null,
        couple_session_enabled: true,
        couple_session_price: null,
        couple_session_price_currency: null,
        couple_session_duration_minutes: 75,
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

    expect(await screen.findByText('Консультація: 1500 грн')).toBeInTheDocument()
    expect(screen.queryByText(/Ознайомча сесія:/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Парна консультація:/i)).not.toBeInTheDocument()
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

    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => { })
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

  it('removes the standalone about section and opens expanded about text from the hero', async () => {
    mockCommonPublicData()
    const profileWithSummary = buildProfile()
      ; (profileWithSummary as Record<string, any>).public_profile_summary = 'Short hero summary for read more action.'
    if ((profileWithSummary as Record<string, any>).sections?.about) {
      ; (profileWithSummary as Record<string, any>).sections.about.public_profile_summary =
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
    const aboutButton = await screen.findByRole('button', { name: 'Детальніше про мене' })

    expect(container.querySelector('#about-me')).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Про мене' })).not.toBeInTheDocument()

    await fireEvent.click(aboutButton)

    expect(await screen.findByRole('heading', { name: 'Про мене' })).toBeInTheDocument()
    expect(screen.getByText('Працюю з тривогою.')).toBeInTheDocument()
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

    expect(await screen.findByText('Перед запитом на час')).toBeInTheDocument()
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

    expect(await screen.findByRole('button', { name: 'Детальніше про мене' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Про мене' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Формат роботи' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Основні запити' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'З чим я не працюю' })).toBeInTheDocument()
    expect(screen.getByText('Не працюю з кризовими станами.')).toBeInTheDocument()
    expect(screen.queryByText(publicBoundariesHelperText)).not.toBeInTheDocument()
  })

  it('hides work boundaries when the public profile has no authored content', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(buildProfile({ bio_other: '' }))
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    await screen.findByRole('button', { name: 'Детальніше про мене' })
    expect(screen.queryByRole('heading', { name: 'З чим я не працюю' })).not.toBeInTheDocument()
    expect(screen.queryByText(publicBoundariesHelperText)).not.toBeInTheDocument()
  })

  it('preserves public work boundary paragraph breaks from profile data', async () => {
    const boundaryParagraphs = [
      '\u042f \u043d\u0435 \u043f\u0440\u0430\u0446\u044e\u044e \u0437 \u0433\u043e\u0441\u0442\u0440\u0438\u043c\u0438 \u043a\u0440\u0438\u0437\u043e\u0432\u0438\u043c\u0438 \u0441\u0442\u0430\u043d\u0430\u043c\u0438.',
      '\u0422\u0430\u043a\u043e\u0436 \u044f \u043d\u0435 \u043f\u0440\u043e\u0432\u043e\u0434\u0436\u0443 \u043a\u043e\u043d\u0441\u0443\u043b\u044c\u0442\u0430\u0446\u0456\u0457 \u043f\u0456\u0434 \u0447\u0430\u0441 \u0441\u043f\u02bc\u044f\u043d\u0456\u043d\u043d\u044f.',
      '\u042f\u043a\u0449\u043e \u043f\u043e\u0442\u0440\u0456\u0431\u043d\u0430 \u0434\u043e\u043f\u043e\u043c\u043e\u0433\u0430 \u0456\u043d\u0448\u043e\u0433\u043e \u0444\u0430\u0445\u0456\u0432\u0446\u044f, \u044f \u0447\u0435\u0441\u043d\u043e \u0441\u043a\u0430\u0436\u0443 \u043f\u0440\u043e \u0446\u0435.',
    ]
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        bio_other: boundaryParagraphs.join('\n\n'),
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

    const heading = await screen.findByRole('heading', {
      name: '\u0417 \u0447\u0438\u043c \u044f \u043d\u0435 \u043f\u0440\u0430\u0446\u044e\u044e',
    })
    const section = heading.closest('section') as HTMLElement
    const paragraphs = Array.from(section.querySelectorAll('.scope-text')).map((item) => item.textContent)

    expect(paragraphs).toEqual(boundaryParagraphs)
    expect(section.querySelector('.scope-list')).toBeNull()
    expect(container).toHaveTextContent(boundaryParagraphs[0]!)
    expect(screen.queryByText(publicBoundariesHelperText)).not.toBeInTheDocument()
  })

  it('renders public work style blank lines as separate paragraph elements', async () => {
    const workStyleParagraphs = [
      'Під час консультацій ми досліджуємо ваш досвід і знаходимо внутрішню опору.',
      'Мій формат роботи — онлайн, у комфортному для вас темпі.',
    ]
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        bio_work: workStyleParagraphs.join('\n\n'),
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

    const heading = await screen.findByRole('heading', { name: 'Формат роботи' })
    const section = heading.closest('section') as HTMLElement
    const paragraphs = Array.from(section.querySelectorAll('.scope-text'))

    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[0]).toHaveTextContent(workStyleParagraphs[0]!)
    expect(paragraphs[1]).toHaveTextContent(workStyleParagraphs[1]!)
  })

  it('preserves public about paragraph breaks from profile data', async () => {
    const aboutParagraphs = [
      '\u042f \u043f\u0441\u0438\u0445\u043e\u043b\u043e\u0433 \u0442\u0430 \u0433\u0435\u0448\u0442\u0430\u043b\u044c\u0442-\u0442\u0435\u0440\u0430\u043f\u0435\u0432\u0442.',
      '\u0414\u043e \u043c\u0435\u043d\u0435 \u0447\u0430\u0441\u0442\u043e \u0437\u0432\u0435\u0440\u0442\u0430\u044e\u0442\u044c\u0441\u044f \u0437 \u0442\u0435\u043c\u0430\u043c\u0438 \u0442\u0440\u0438\u0432\u043e\u0433\u0438.',
      '\u042f \u043d\u0435 \u0434\u0430\u044e \u0443\u043d\u0456\u0432\u0435\u0440\u0441\u0430\u043b\u044c\u043d\u0438\u0445 \u043f\u043e\u0440\u0430\u0434.',
    ]
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        bio_about: aboutParagraphs.join('\n\n'),
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

    await fireEvent.click(
      await screen.findByRole('button', { name: 'Детальніше про мене' })
    )
    const aboutText = container.querySelector('.about-modal__text')

    expect(aboutText).not.toBeNull()
    expect(aboutText?.textContent).toBe(aboutParagraphs.join('\n\n'))
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
    await fireEvent.click(screen.getByRole('button', { name: 'Детальніше про мене' }))
    expect(screen.getByText('Section about body copy.')).toBeInTheDocument()
    expect(screen.getByText('Section topics body.')).toBeInTheDocument()
    expect(screen.getAllByText('Section topic chip').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/999 грн \(section\)/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/40 хв \(section\)/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/1999 грн \(section\)/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/55 хв \(section\)/i).length).toBeGreaterThan(0)
    expect(screen.getByText('Телефон секції')).toBeInTheDocument()
    expect(screen.queryByText('hello@example.com')).not.toBeInTheDocument()
  })

  it('renders concrete request chips in main requests without category chips or duplicated text suffix', async () => {
    const heading = '\u041e\u0441\u043d\u043e\u0432\u043d\u0456 \u0437\u0430\u043f\u0438\u0442\u0438'
    const goalSetting = '\u041f\u043e\u0441\u0442\u0430\u043d\u043e\u0432\u043a\u0430 \u0446\u0456\u043b\u0435\u0439'
    const motivation = '\u041c\u043e\u0442\u0438\u0432\u0430\u0446\u0456\u044f'
    const selfDiscipline = '\u0421\u0430\u043c\u043e\u0434\u0438\u0441\u0446\u0438\u043f\u043b\u0456\u043d\u0430'
    const coaching = '\u041a\u043e\u0443\u0447\u0438\u043d\u0433'
    const psychology = '\u041f\u0441\u0438\u0445\u043e\u043b\u043e\u0433\u0456\u044f / \u0442\u0435\u0440\u0430\u043f\u0456\u044f'
    const authoredText =
      '\u042f \u043f\u0440\u0430\u0446\u044e\u044e \u0437 \u043b\u044e\u0434\u044c\u043c\u0438, ' +
      '\u044f\u043a\u0456 \u043f\u0435\u0440\u0435\u0436\u0438\u0432\u0430\u044e\u0442\u044c ' +
      '\u0442\u0440\u0438\u0432\u043e\u0433\u0443.'

    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        specializations: [psychology],
        sections_version: 1,
        sections: {
          topics: {
            chips: [coaching],
            specializations: [psychology],
            who_this_is_for: `${authoredText}\n\u2022 ${goalSetting} \u2022 ${motivation} \u2022 ${selfDiscipline}`,
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

    const section = (await screen.findByRole('heading', { name: heading })).closest('section') as HTMLElement
    const chipTexts = Array.from(section.querySelectorAll('.work-with__chip')).map((item) => item.textContent)
    const bodyText = section.querySelector('.scope-text')?.textContent || ''

    expect(chipTexts).toEqual([goalSetting, motivation, selfDiscipline])
    expect(chipTexts).not.toContain(coaching)
    expect(chipTexts).not.toContain(psychology)
    expect(bodyText).toBe(authoredText)
    expect(bodyText).not.toContain(goalSetting)
    expect(bodyText).not.toContain(motivation)
    expect(bodyText).not.toContain(selfDiscipline)
  })

  it('deduplicates structured request chips from an appended text tail', async () => {
    const heading = '\u041e\u0441\u043d\u043e\u0432\u043d\u0456 \u0437\u0430\u043f\u0438\u0442\u0438'
    const goalSetting = '\u041f\u043e\u0441\u0442\u0430\u043d\u043e\u0432\u043a\u0430 \u0446\u0456\u043b\u0435\u0439'
    const motivation = '\u041c\u043e\u0442\u0438\u0432\u0430\u0446\u0456\u044f'
    const selfDiscipline = '\u0421\u0430\u043c\u043e\u0434\u0438\u0441\u0446\u0438\u043f\u043b\u0456\u043d\u0430'
    const authoredText =
      '\u042f \u043f\u0440\u0430\u0446\u044e\u044e \u0437 \u043b\u044e\u0434\u044c\u043c\u0438, ' +
      '\u044f\u043a\u0456 \u0445\u043e\u0447\u0443\u0442\u044c \u0441\u0444\u043e\u043a\u0443\u0441\u0443\u0432\u0430\u0442\u0438\u0441\u044f.'

    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        sections_version: 1,
        sections: {
          topics: {
            request_chips: [goalSetting, motivation, selfDiscipline],
            who_this_is_for: `${authoredText} \u2022 ${goalSetting} \u2022 ${motivation} \u2022 ${selfDiscipline}`,
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

    const section = (await screen.findByRole('heading', { name: heading })).closest('section') as HTMLElement
    const chipTexts = Array.from(section.querySelectorAll('.work-with__chip')).map((item) => item.textContent)
    const bodyText = section.querySelector('.scope-text')?.textContent || ''

    expect(chipTexts).toEqual([goalSetting, motivation, selfDiscipline])
    expect(bodyText).toBe(authoredText)
    expect(bodyText).not.toContain(goalSetting)
  })

  it('keeps author-written bullet content as text and does not fall back to category chips', async () => {
    const heading = '\u041e\u0441\u043d\u043e\u0432\u043d\u0456 \u0437\u0430\u043f\u0438\u0442\u0438'
    const coaching = '\u041a\u043e\u0443\u0447\u0438\u043d\u0433'
    const authorBulletText =
      '\u0423 \u0440\u043e\u0431\u043e\u0442\u0456 \u043c\u043e\u0436\u0443 ' +
      '\u0432\u0438\u043a\u043e\u0440\u0438\u0441\u0442\u043e\u0432\u0443\u0432\u0430\u0442\u0438 \u2022 ' +
      '\u043a\u043e\u0440\u043e\u0442\u043a\u0435 \u0444\u043e\u0440\u043c\u0443\u043b\u044e\u0432\u0430\u043d\u043d\u044f ' +
      '\u0437\u0430\u043f\u0438\u0442\u0443 \u0431\u0435\u0437 \u0442\u0438\u0441\u043a\u0443.'

    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        sections_version: 1,
        sections: {
          topics: {
            chips: [coaching],
            who_this_is_for: authorBulletText,
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

    const section = (await screen.findByRole('heading', { name: heading })).closest('section') as HTMLElement

    expect(section.querySelectorAll('.work-with__chip')).toHaveLength(0)
    expect(section.querySelector('.scope-text')).toHaveTextContent(authorBulletText)
  })

  it('preserves mixed paragraph and bullet formatting from section topics text', async () => {
    const heading = '\u041e\u0441\u043d\u043e\u0432\u043d\u0456 \u0437\u0430\u043f\u0438\u0442\u0438'
    const firstParagraph = '\u041f\u0435\u0440\u0448\u0438\u0439 \u0430\u0431\u0437\u0430\u0446 \u0442\u0435\u043a\u0441\u0442\u0443.'
    const secondParagraph = '\u0414\u0440\u0443\u0433\u0438\u0439 \u0430\u0431\u0437\u0430\u0446 \u0442\u0435\u043a\u0441\u0442\u0443.'
    const goalSetting = '\u041f\u043e\u0441\u0442\u0430\u043d\u043e\u0432\u043a\u0430 \u0446\u0456\u043b\u0435\u0439'
    const motivation = '\u041c\u043e\u0442\u0438\u0432\u0430\u0446\u0456\u044f'
    const selfDiscipline = '\u0421\u0430\u043c\u043e\u0434\u0438\u0441\u0446\u0438\u043f\u043b\u0456\u043d\u0430'

    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        sections_version: 1,
        sections: {
          topics: {
            who_this_is_for:
              `${firstParagraph}\n\n${secondParagraph}\n\n` +
              `\u2022 ${goalSetting}\n\u2022 ${motivation}\n\u2022 ${selfDiscipline}`,
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

    const section = (await screen.findByRole('heading', { name: heading })).closest('section') as HTMLElement
    const paragraphs = Array.from(section.querySelectorAll('.scope-text')).map((item) => item.textContent)
    const items = within(section).getAllByRole('listitem')

    expect(paragraphs).toEqual([firstParagraph, secondParagraph])
    expect(items.map((item) => item.textContent)).toEqual([goalSetting, motivation, selfDiscipline])
    expect(paragraphs.join(' ')).not.toContain(goalSetting)
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
    await fireEvent.click(screen.getByRole('button', { name: 'Детальніше про мене' }))
    expect(screen.getByText('Працюю з тривогою.')).toBeInTheDocument()
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

    renderView()

    await screen.findByText('Email')

    expect(
      screen.getAllByRole('button', { name: 'Скопіювати Email: hello@example.com' })
    ).toHaveLength(1)
    expect(screen.queryByText('Telegram')).not.toBeInTheDocument()
  })

  it('copies Email, Telegram, Viber, and Phone values from the contact chooser without opening apps', async () => {
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
            action_url: 'https://t.me/olena_help',
          },
          {
            channel: 'VIBER',
            label: 'Viber',
            value: '+380001112233',
            action_url: 'viber://chat?number=%2B380001112233',
          },
          {
            channel: 'PHONE',
            label: 'Телефон',
            value: '+380009998877',
            action_url: 'tel:+380009998877',
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

    const chooserTitle = await screen.findByText('Оберіть канал зв’язку')
    expect(chooserTitle).toBeInTheDocument()
    const chooserModal = chooserTitle.closest('.contact-chooser-modal')
    expect(chooserModal).not.toBeNull()
    const chooser = within(chooserModal as HTMLElement)
    expect(chooser.getByText('Оберіть зручний канал: це не підтверджена сесія, а прямий контакт для першого діалогу.')).toBeInTheDocument()
    expect(chooser.getByText('Email')).toBeInTheDocument()
    expect(chooser.getByText('Telegram')).toBeInTheDocument()
    expect(chooser.getByText('Viber')).toBeInTheDocument()
    expect(chooser.getByText('Телефон')).toBeInTheDocument()
    expect(chooser.getByText('hello@example.com')).toBeInTheDocument()
    expect(chooser.getByText('@olena_help')).toBeInTheDocument()
    expect(chooser.getByText('+380001112233')).toBeInTheDocument()
    expect(chooser.getByText('+380009998877')).toBeInTheDocument()
    expect(screen.queryByText('EMAIL')).not.toBeInTheDocument()
    expect(screen.queryByText('TELEGRAM')).not.toBeInTheDocument()
    expect(chooser.queryByRole('button', { name: 'Відкрити' })).not.toBeInTheDocument()

    const expectedContacts = [
      ['Email', 'hello@example.com'],
      ['Telegram', '@olena_help'],
      ['Viber', '+380001112233'],
      ['Телефон', '+380009998877'],
    ] as const

    for (const [channel, value] of expectedContacts) {
      const row = chooser.getByText(channel).closest('.contact-chooser-modal__item')
      expect(row).not.toBeNull()
      await fireEvent.click(within(row as HTMLElement).getByRole('button', { name: 'Скопіювати' }))
      expect(clipboardWriteTextSpy).toHaveBeenLastCalledWith(value)
      expect(within(row as HTMLElement).getByRole('button', { name: 'Скопійовано' })).toBeInTheDocument()
    }

    expect(windowOpenSpy).not.toHaveBeenCalled()
    expect(chooserModal).toBeInTheDocument()
    expect(screen.queryByText('Застосунок не відкрився?')).not.toBeInTheDocument()
  })

  it('copies direct external contact channels without opening an app', async () => {
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
    renderView()
    await fireEvent.click(
      await screen.findByRole('button', { name: 'Скопіювати Viber: +380001112233' })
    )

    expect(clipboardWriteTextSpy).toHaveBeenCalledWith('+380001112233')
    expect(windowOpenSpy).not.toHaveBeenCalled()
    expect(screen.queryByText('Застосунок не відкрився?')).not.toBeInTheDocument()
  })
  it('returns chooser copy feedback to the default label after a short delay', async () => {
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
      const contactButton = closingButtons.find((button) => button.textContent?.includes('Зв’язатися зі спеціалістом'))
      expect(contactButton).toBeDefined()
      await fireEvent.click(contactButton as HTMLButtonElement)

      const chooserModal = container.querySelector('.contact-chooser-modal')
      expect(chooserModal).not.toBeNull()
      const chooser = within(chooserModal as HTMLElement)
      const telegramRow = chooser.getByText('Telegram').closest('.contact-chooser-modal__item')
      expect(telegramRow).not.toBeNull()
      await fireEvent.click(
        within(telegramRow as HTMLElement).getByRole('button', { name: 'Скопіювати' })
      )

      expect(clipboardWriteTextSpy).toHaveBeenCalledWith('@olena_help')
      expect(
        within(telegramRow as HTMLElement).getByRole('button', { name: 'Скопійовано' })
      ).toBeInTheDocument()
      expect(windowOpenSpy).not.toHaveBeenCalled()
      expect(container.querySelector('.contact-chooser-modal')).not.toBeNull()

      await vi.advanceTimersByTimeAsync(1800)
      expect(
        within(telegramRow as HTMLElement).getByRole('button', { name: 'Скопіювати' })
      ).toBeInTheDocument()
      expect(container.querySelector('.contact-fallback-modal')).toBeNull()
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
      await screen.findAllByText('Оберіть доступне вікно у профілі. Спеціаліст має підтвердити цей час.')
    ).toHaveLength(3)
    expect(screen.getAllByText('Оплата не списується автоматично.')).toHaveLength(1)
  })

  it('opens guest booking request flow from slot click without auth', async () => {
    mockCommonPublicData()
    mockBookingPageDataWithSingleSlot()

    const { container } = renderView()

    const slotButton = await screen.findByRole('button', { name: 'Надіслати запит на цей час' })
    await fireEvent.click(slotButton)

    const modal = container.querySelector('.guest-booking-modal')
    expect(modal).not.toBeNull()
    expect(within(modal as HTMLElement).getByRole('heading', { name: 'Запит на сесію' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Запит на бронювання' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Ім’я')).toBeInTheDocument()
    expect(screen.getByLabelText('Канал зв’язку')).toBeInTheDocument()
    expect(screen.getByLabelText('Як спеціаліст може з вами зв’язатися?')).toBeInTheDocument()
  })

  it('shows consultation offer selector and submits standard offer_type by default', async () => {
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

    const { container } = renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Надіслати запит на цей час' }))
    expect(await screen.findByText('Тип консультації')).toBeInTheDocument()
    const modal = container.querySelector('.guest-booking-modal') as HTMLElement
    const standardOffer = within(modal).getByRole('button', { name: /^Консультація/i })
    expect(standardOffer).toHaveAttribute('aria-pressed', 'true')
    expect(standardOffer).not.toBeDisabled()
    expect(within(modal).getByRole('button', { name: /Ознайомча сесія/i })).toBeInTheDocument()

    await fireEvent.update(screen.getByLabelText('Ім’я'), 'Ірина')
    await fireEvent.update(screen.getByLabelText('Як спеціаліст може з вами зв’язатися?'), 'iryna@example.com')
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати запит' }))

    expect(mockedApiPost).toHaveBeenCalledWith(
      '/public/specialists/olena/guest-booking-requests/',
      expect.objectContaining({
        offer_type: 'standard',
      })
    )
  })

  it('submits intro offer_type when intro offer is selected', async () => {
    mockCommonPublicData()
    mockBookingPageDataWithSingleSlot()
    mockedApiPost.mockResolvedValue({
      request: {
        id: 505,
        status: 'PENDING',
        created_at: '2026-04-07T10:00:00Z',
        next_step: null,
      },
    })

    const { container } = renderView()

    await fireEvent.click((await screen.findAllByRole('button', { name: 'Залишити запит' }))[0]!)
    const modal = container.querySelector('.guest-booking-modal') as HTMLElement
    await fireEvent.click(await within(modal).findByRole('button', { name: /Ознайомча сесія/i }))
    await fireEvent.update(screen.getByLabelText('Ім’я'), 'Ірина')
    await fireEvent.update(screen.getByLabelText('Як спеціаліст може з вами зв’язатися?'), 'iryna@example.com')
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати запит' }))

    expect(mockedApiPost).toHaveBeenCalledWith(
      '/public/specialists/olena/guest-booking-requests/',
      expect.objectContaining({
        offer_type: 'intro',
      })
    )
  })

  it('submits couple offer_type only when couple offer is public', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        couple_session_enabled: true,
        couple_session_price: '2200',
        couple_session_price_currency: 'UAH',
        couple_session_duration_minutes: 90,
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockBookingPageDataWithSingleSlot()
    mockedApiPost.mockResolvedValue({
      request: {
        id: 506,
        status: 'PENDING',
        created_at: '2026-04-07T10:00:00Z',
        next_step: null,
      },
    })

    const { container } = renderView()

    await fireEvent.click((await screen.findAllByRole('button', { name: 'Залишити запит' }))[0]!)
    const modal = container.querySelector('.guest-booking-modal') as HTMLElement
    await fireEvent.click(await within(modal).findByRole('button', { name: /Парна консультація/i }))
    await fireEvent.update(screen.getByLabelText('Ім’я'), 'Ірина')
    await fireEvent.update(screen.getByLabelText('Як спеціаліст може з вами зв’язатися?'), 'iryna@example.com')
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати запит' }))

    expect(mockedApiPost).toHaveBeenCalledWith(
      '/public/specialists/olena/guest-booking-requests/',
      expect.objectContaining({
        offer_type: 'couple',
      })
    )
  })

  it('does not offer couple selection when couple offer is not public', async () => {
    mockCommonPublicData()
    mockBookingPageDataWithSingleSlot()

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Надіслати запит на цей час' }))

    expect(await screen.findByText('Тип консультації')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Парна консультація/i })).not.toBeInTheDocument()
  })

  it('allows shorter intro offer for a selected 50-minute slot and hides longer couple offer in modal', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        couple_session_enabled: true,
        couple_session_price: '2200',
        couple_session_price_currency: 'UAH',
        couple_session_duration_minutes: 90,
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockBookingPageDataWithSingleSlot()
    mockedApiPost.mockResolvedValue({
      request: {
        id: 508,
        status: 'PENDING',
        created_at: '2026-04-07T10:00:00Z',
        next_step: null,
      },
    })

    const { container } = renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Надіслати запит на цей час' }))

    const modal = container.querySelector('.guest-booking-modal') as HTMLElement
    expect(await within(modal).findByText('Тип консультації')).toBeInTheDocument()
    expect(within(modal).getByRole('button', { name: /^Консультація/i })).not.toBeDisabled()
    expect(within(modal).getByRole('button', { name: /^Ознайомча сесія/i })).not.toBeDisabled()
    expect(within(modal).queryByRole('button', { name: /^Парна консультація/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/Потрібне вікно/)).not.toBeInTheDocument()

    await fireEvent.click(within(modal).getByRole('button', { name: /^Ознайомча сесія/i }))
    await fireEvent.update(screen.getByLabelText('Ім’я'), 'Ірина')
    await fireEvent.update(screen.getByLabelText('Як спеціаліст може з вами зв’язатися?'), 'iryna@example.com')
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати запит' }))

    expect(mockedApiPost).toHaveBeenCalledWith(
      '/public/specialists/olena/guest-booking-requests/',
      expect.objectContaining({
        slot_id: 100,
        offer_type: 'intro',
      })
    )
  })

  it('filters available times by selected offer duration', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        couple_session_enabled: true,
        couple_session_price: '2200',
        couple_session_price_currency: 'UAH',
        couple_session_duration_minutes: 90,
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockBookingPageDataWithSlots([
      buildTodayLocalSlotWithDuration(101, 9, 30),
      buildTodayLocalSlotWithDuration(102, 10, 40),
      buildTodayLocalSlotWithDuration(103, 11, 50),
      buildTodayLocalSlotWithDuration(104, 12, 90),
    ])

    renderView()

    expect(await screen.findByRole('button', { name: /^Консультація/i })).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Надіслати запит на цей час' })).toHaveLength(2)
    })

    await fireEvent.click(screen.getByRole('button', { name: /^Ознайомча сесія/i }))
    expect(screen.getByRole('button', { name: /^Ознайомча сесія/i })).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Надіслати запит на цей час' })).toHaveLength(4)
    })

    await fireEvent.click(screen.getByRole('button', { name: /^Парна консультація/i }))
    expect(screen.getByRole('button', { name: /^Парна консультація/i })).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Надіслати запит на цей час' })).toHaveLength(1)
    })

    await fireEvent.click(screen.getByRole('button', { name: /^Консультація/i }))
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Надіслати запит на цей час' })).toHaveLength(2)
    })
  })

  it('does not show 50-minute slots after selecting 90-minute couple offer', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({
        couple_session_enabled: true,
        couple_session_price: '2200',
        couple_session_price_currency: 'UAH',
        couple_session_duration_minutes: 90,
      })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockBookingPageDataWithSingleSlot()

    renderView()

    expect(await screen.findByRole('button', { name: 'Надіслати запит на цей час' })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: /^Парна консультація/i }))

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Надіслати запит на цей час' })).not.toBeInTheDocument()
    })
    expect(mockedApiPost).not.toHaveBeenCalled()
  })

  it('shows calm Ukrainian copy for backend offer duration mismatch', async () => {
    mockCommonPublicData()
    mockBookingPageDataWithSingleSlot()
    mockedApiPost.mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          code: 'PUBLIC_GUEST_REQUEST_OFFER_DURATION_MISMATCH',
          detail: 'Selected consultation type does not match the selected time window duration.',
        },
      },
    })

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Надіслати запит на цей час' }))
    await fireEvent.update(screen.getByLabelText('Ім’я'), 'Ірина')
    await fireEvent.update(screen.getByLabelText('Як спеціаліст може з вами зв’язатися?'), 'iryna@example.com')
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати запит' }))

    expect(
      await screen.findByText(
        'Обраний тип консультації не відповідає тривалості вибраного часу. Оберіть інший час або залиште запит без вибору часу.'
      )
    ).toBeInTheDocument()
  })

  it('shows compact Ukrainian validation instead of native browser required tooltips', async () => {
    mockCommonPublicData()
    mockBookingPageDataWithSingleSlot()

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Надіслати запит на цей час' }))

    const submitButton = screen.getByRole('button', { name: 'Надіслати запит' })
    const form = submitButton.closest('form')
    expect(form).toHaveAttribute('novalidate')

    await fireEvent.click(submitButton)

    expect(mockedApiPost).not.toHaveBeenCalled()
    expect(screen.getByText('Вкажіть ім’я.')).toBeInTheDocument()
    expect(screen.getByText('Вкажіть контакт для відповіді.')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Ім’я/i })).toHaveFocus()
    expect(screen.queryByText('Please fill out this field.')).not.toBeInTheDocument()
  })

  it('renders simplified request topic and message copy while keeping topic selection stable', async () => {
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

    await fireEvent.click(await screen.findByRole('button', { name: 'Надіслати запит на цей час' }))
    expect(await screen.findByText('Що хочете обговорити?')).toBeInTheDocument()
    const expectedTopicLabels = [
      'Тривога',
      'Стрес',
      'Самооцінка',
      'Стосунки',
      'Вигорання',
      'Дисципліна',
      'Кар’єра / робота',
      'Зміни в житті',
      'Особисті межі',
      'Самотність',
      'Почуття провини',
      'Складні рішення',
      'Емоційне виснаження',
      'Пошук себе',
      'Не знаю',
      'Інше',
    ]
    expectedTopicLabels.forEach((label) => {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    })
    expect(screen.getByText('Оберіть до 3 тем.')).toBeInTheDocument()
    const messageField = screen.getByRole('textbox', { name: /Опишіть запит/i })
    expect(messageField).toHaveAttribute('maxlength', '300')
    expect(messageField).toHaveAttribute(
      'placeholder',
      'Кілька речень про те, з чим хочете звернутися.'
    )
    expect(screen.queryByText('Можна обрати тему вище або коротко описати свій запит тут.')).not.toBeInTheDocument()
    expect(screen.getByText('0 / 300')).toBeInTheDocument()

    const anxiety = screen.getByRole('button', { name: 'Тривога' })
    const stress = screen.getByRole('button', { name: 'Стрес' })
    const relationships = screen.getByRole('button', { name: 'Стосунки' })
    const burnout = screen.getByRole('button', { name: 'Вигорання' })
    const boundaries = screen.getByRole('button', { name: 'Особисті межі' })

    await fireEvent.click(anxiety)
    await fireEvent.click(stress)
    await fireEvent.click(relationships)

    expect(anxiety).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Можна обрати до 3 тем.')).toBeInTheDocument()
    expect(burnout).toBeDisabled()

    await fireEvent.click(stress)
    expect(stress).toHaveAttribute('aria-pressed', 'false')
    expect(boundaries).not.toBeDisabled()

    await fireEvent.click(boundaries)
    await fireEvent.update(screen.getByLabelText('Ім’я'), 'Ірина')
    await fireEvent.update(screen.getByLabelText('Як спеціаліст може з вами зв’язатися?'), 'iryna@example.com')
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати запит' }))

    expect(mockedApiPost).toHaveBeenCalledWith(
      '/public/specialists/olena/guest-booking-requests/',
      expect.objectContaining({
        request_topics: ['anxiety', 'relationships', 'boundaries'],
      })
    )
  })

  it('keeps the request input simple when the Other topic is selected', async () => {
    mockCommonPublicData()
    mockBookingPageDataWithSingleSlot()

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Надіслати запит на цей час' }))
    await fireEvent.click(await screen.findByRole('button', { name: 'Інше' }))

    expect(screen.queryByText('Опишіть свій запит у полі нижче.')).not.toBeInTheDocument()
    expect(screen.queryByText('Можна обрати тему вище або коротко описати свій запит тут.')).not.toBeInTheDocument()
    const messageField = screen.getByRole('textbox', { name: /Опишіть запит/i })
    await fireEvent.update(messageField, 'Коротко')
    expect(screen.getByText('7 / 300')).toBeInTheDocument()

    await fireEvent.update(screen.getByLabelText('Ім’я'), 'Ірина')
    await fireEvent.update(screen.getByLabelText('Як спеціаліст може з вами зв’язатися?'), 'iryna@example.com')
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати запит' }))

    expect(mockedApiPost).toHaveBeenCalledWith(
      '/public/specialists/olena/guest-booking-requests/',
      expect.objectContaining({
        request_topics: [],
        message: 'Коротко',
      })
    )
  })

  it('renders one concise pre-submit consent block without repeated instructions', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue(
      buildProfile({ booking_rules: buildPendingBookingRules() })
    )
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockBookingPageDataWithSingleSlot()

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Надіслати запит на цей час' }))

    expect(screen.getAllByRole('heading', { name: 'Перед надсиланням' })).toHaveLength(1)
    expect(
      screen.getByText(
        'Ваш запит отримає спеціаліст. Він зможе відповісти, запропонувати час консультації або уточнити деталі.'
      )
    ).toBeInTheDocument()
    expect(
      screen.queryByText(
        'Перед надсиланням переконайтеся, що вам підходять формат, вартість і опис роботи спеціаліста в цьому профілі.'
      )
    ).not.toBeInTheDocument()
    expect(screen.getByText('Цей запит не є екстреною допомогою.')).toBeInTheDocument()
    expect(
      screen.queryByText(/Надсилаючи запит, ви погоджуєтеся з умовами роботи спеціаліста/i)
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/Ознайомтесь з умовами спеціаліста/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/умови роботи спеціаліста/i)).not.toBeInTheDocument()
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

    await fireEvent.click(await screen.findByRole('button', { name: 'Надіслати запит на цей час' }))
    await fireEvent.update(screen.getByLabelText('Ім’я'), 'Ірина')
    await fireEvent.update(screen.getByLabelText('Як спеціаліст може з вами зв’язатися?'), 'iryna@example.com')
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати запит' }))

    expect(mockedApiPost).toHaveBeenCalledWith(
      '/public/specialists/olena/guest-booking-requests/',
      {
        slot_id: 100,
        session_format: 'online',
        offer_type: 'standard',
        guest_name: 'Ірина',
        contact_channel: 'email',
        contact_value: 'iryna@example.com',
        request_topics: [],
      }
    )
    expect(await screen.findByText('Запит на обраний час надіслано')).toBeInTheDocument()
    expect(
      await screen.findByText('Спеціаліст підтвердить сесію або запропонує інший час.')
    ).toBeInTheDocument()
    expect(screen.getByText(/Реєстрація не потрібна для цього кроку\./)).toBeInTheDocument()
    expect(screen.getByText(/Це ще не підтверджена сесія\./)).toBeInTheDocument()
    expect(
      screen.getByText(/Спеціаліст побачить обраний вами час у кабінеті\./)
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(/Спеціаліст підтвердить сесію або запропонує інший час\./).length
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

    await fireEvent.click(await screen.findByRole('button', { name: 'Надіслати запит на цей час' }))
    await fireEvent.update(screen.getByLabelText('Ім’я'), 'Ірина')
    await fireEvent.update(screen.getByLabelText('Канал зв’язку'), 'telegram')
    await fireEvent.update(screen.getByLabelText('Як спеціаліст може з вами зв’язатися?'), '@iryna_help')
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

    await fireEvent.click(await screen.findByRole('button', { name: 'Надіслати запит на цей час' }))
    await fireEvent.update(screen.getByLabelText('Ім’я'), 'Ірина')
    await fireEvent.update(screen.getByLabelText('Канал зв’язку'), 'phone')
    await fireEvent.update(screen.getByLabelText('Як спеціаліст може з вами зв’язатися?'), '+380501112233')
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

    await fireEvent.click(await screen.findByRole('button', { name: 'Надіслати запит на цей час' }))
    await fireEvent.update(screen.getByLabelText('Ім’я'), 'Ірина')
    await fireEvent.update(screen.getByLabelText('Як спеціаліст може з вами зв’язатися?'), 'iryna@example.com')
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

    await fireEvent.click(await screen.findByRole('button', { name: 'Надіслати запит на цей час' }))
    await fireEvent.update(screen.getByLabelText('Ім’я'), 'Ірина')
    await fireEvent.update(screen.getByLabelText('Як спеціаліст може з вами зв’язатися?'), 'iryna@example.com')
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

    await fireEvent.click(await screen.findByRole('button', { name: 'Надіслати запит на цей час' }))
    await fireEvent.update(screen.getByLabelText('Ім’я'), 'Ірина')
    await fireEvent.update(screen.getByLabelText('Як спеціаліст може з вами зв’язатися?'), 'iryna@example.com')
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

    await fireEvent.click(await screen.findByRole('button', { name: 'Надіслати запит на цей час' }))

    const confirmHeading = await screen.findByRole('heading', { name: 'Запит на час' })
    expect(confirmHeading).toBeInTheDocument()
    const confirmModal = confirmHeading.closest('.setting-modal__content')
    expect(confirmModal).toBeTruthy()
    expect(within(confirmModal as HTMLElement).getByText('Дата')).toBeInTheDocument()
    expect(within(confirmModal as HTMLElement).getByText('Час')).toBeInTheDocument()
    expect(within(confirmModal as HTMLElement).getByText('Формат')).toBeInTheDocument()
    expect(within(confirmModal as HTMLElement).getByText('Тривалість')).toBeInTheDocument()
    expect(mockedApiPost).not.toHaveBeenCalledWith('/booking/sessions/', expect.anything())

    await clickClientBookingConfirmButton()

    expect(mockedApiPost).toHaveBeenCalledWith(
      '/booking/sessions/',
      expect.objectContaining({
        slot_id: 100,
        setting_accepted: true,
      })
    )
    expect(screen.queryByRole('heading', { name: 'Запит на сесію' })).not.toBeInTheDocument()
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

    await fireEvent.click(await screen.findByRole('button', { name: 'Надіслати запит на цей час' }))
    const confirmModal = await findClientBookingConfirmModal()
    const confirmButton = within(confirmModal).getByRole('button', { name: 'Надіслати запит на цей час' })
    await fireEvent.click(confirmButton)
    await fireEvent.click(confirmButton)

    const bookingCalls = mockedApiPost.mock.calls.filter((call) => call[0] === '/booking/sessions/')
    expect(bookingCalls).toHaveLength(1)
    expect(await within(confirmModal as HTMLElement).findByRole('button', { name: 'Надсилаємо запит...' })).toBeDisabled()

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

    await fireEvent.click(await screen.findByRole('button', { name: 'Надіслати запит на цей час' }))
    await clickClientBookingConfirmButton()

    expect(await screen.findByText('Обраний слот уже недоступний. Будь ласка, виберіть інший час.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Запит на час' })).not.toBeInTheDocument()
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

    expect(await screen.findByText('Підтвердіть правила перед запитом на час')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Щоб надіслати запит на час до цього спеціаліста, підтвердіть актуальні правила платформи та умови спеціаліста. Повторне підтвердження знадобиться лише тоді, якщо правила платформи або умови спеціаліста оновляться.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Загальні правила платформи')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Правила перед запитом на час')).getByText('Умови спеціаліста')).toBeInTheDocument()

    const bookButton = await screen.findByRole('button', { name: 'Надіслати запит на цей час' })
    await fireEvent.click(bookButton)
    expect(await screen.findByRole('heading', { name: 'Запит на час' })).toBeInTheDocument()
    await clickClientBookingConfirmButton()

    expect(await screen.findByText(BOOKING_UI_MESSAGES.acceptSettingBeforeBooking)).toBeInTheDocument()
    expect(mockedApiPost).not.toHaveBeenCalledWith('/booking/sessions/', expect.anything())

    await fireEvent.click(screen.getByRole('button', { name: 'Підтвердити правила перед запитом' }))

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

    expect(screen.queryByText('Підтвердіть правила перед запитом на час')).not.toBeInTheDocument()
    await fireEvent.click(await screen.findByRole('button', { name: 'Надіслати запит на цей час' }))
    await clickClientBookingConfirmButton()

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

    expect(await screen.findByText('Підтвердіть правила перед запитом на час')).toBeInTheDocument()
    expect(screen.getByText('Загальні правила платформи')).toBeInTheDocument()
    expect(within(screen.getByLabelText('Правила перед запитом на час')).queryByText('Умови спеціаліста')).not.toBeInTheDocument()
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

    expect(await screen.findByText('Підтвердіть правила перед запитом на час')).toBeInTheDocument()
    expect(screen.queryByText('Загальні правила платформи')).not.toBeInTheDocument()
    expect(within(screen.getByLabelText('Правила перед запитом на час')).getByText('Умови спеціаліста')).toBeInTheDocument()
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

    await fireEvent.click(await screen.findByRole('button', { name: 'Підтвердити правила перед запитом' }))
    expect(mockedAcceptBookingRules).toHaveBeenCalledWith({ specialist_id: 12 })

    const slotButtons = await screen.findAllByRole('button', { name: 'Надіслати запит на цей час' })
    await fireEvent.click(slotButtons[0]!)
    await clickClientBookingConfirmButton()
    await fireEvent.click(screen.getAllByRole('button', { name: 'Закрити' })[0]!)
    await fireEvent.click((await screen.findAllByRole('button', { name: 'Надіслати запит на цей час' }))[0]!)
    await clickClientBookingConfirmButton()

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

    await fireEvent.click(await screen.findByRole('button', { name: 'Надіслати запит на цей час' }))
    expect(await screen.findByText('Правила Pro Consult')).toBeInTheDocument()
    expect(screen.getByText('Правила спеціаліста')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Перед надсиланням' })).toBeInTheDocument()

    await fireEvent.update(screen.getByLabelText('Ім’я'), 'Ірина')
    await fireEvent.update(screen.getByLabelText('Як спеціаліст може з вами зв’язатися?'), 'iryna@example.com')
    const submitButton = screen.getByRole('button', { name: 'Надіслати запит' })
    expect(submitButton).toBeDisabled()

    await fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'Погоджуюся з правилами платформи та правилами спеціаліста',
      })
    )
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

    await fireEvent.click(await screen.findByRole('button', { name: 'Надіслати запит на цей час' }))
    expect(
      screen.queryByRole('checkbox', {
        name: 'Погоджуюся з правилами платформи та правилами спеціаліста',
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

    await fireEvent.click(await screen.findByRole('button', { name: 'Надіслати запит на цей час' }))
    await clickClientBookingConfirmButton()

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

    await fireEvent.click(await screen.findByRole('button', { name: 'Надіслати запит на цей час' }))
    await clickClientBookingConfirmButton()

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
    await fireEvent.click(await screen.findByRole('button', { name: 'Надіслати запит на цей час' }))
    await clickClientBookingConfirmButton()

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
    await fireEvent.click(await screen.findByRole('button', { name: 'Надіслати запит на цей час' }))
    await clickClientBookingConfirmButton()

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
    await fireEvent.click(await screen.findByRole('button', { name: 'Надіслати запит на цей час' }))
    await clickClientBookingConfirmButton()

    const formatErrors = await screen.findAllByText('Оберіть формат сесії перед надсиланням запиту.')
    expect(formatErrors.length).toBeGreaterThan(0)
  })

  it('hides the booking calendar and mid-page request section while keeping sidebar and final CTAs', async () => {
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

    expect(await screen.findByRole('heading', { name: 'Готові зробити перший крок?' })).toBeInTheDocument()
    const bookingCard = within(screen.getByTestId('public-profile-booking-card'))
    expect(bookingCard.getByRole('heading', { name: 'Залиште запит' })).toBeInTheDocument()
    expect(bookingCard.getByRole('button', { name: 'Залишити запит' })).toBeInTheDocument()
    expect(bookingCard.queryByRole('button', { name: 'Обрати час' })).not.toBeInTheDocument()
    expect(screen.queryByText('Запит на сесію')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Оберіть час для запиту' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Запит до мене' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Залишити запит' })).not.toBeInTheDocument()
    const requestButtons = screen.getAllByRole('button', { name: 'Залишити запит' })
    expect(requestButtons).toHaveLength(2)
    expect(requestButtons.some((button) => Boolean(button.closest('.identity-rail')))).toBe(true)
    expect(requestButtons.some((button) => Boolean(button.closest('.closing-cta')))).toBe(true)
    const sidebarRequestButton = requestButtons.find((button) => Boolean(button.closest('.identity-rail')))
    expect(sidebarRequestButton).toBeDefined()
    expect(sidebarRequestButton).toHaveClass('btn--primary')
    const requestHelper =
      'Опишіть коротко, з чим хочете звернутися. Спеціаліст відповість у кабінеті й допоможе узгодити формат та час.'
    const requestTooltip =
      'Запит — якщо хочете консультацію. Питання — якщо потрібно щось уточнити перед запитом.'
    expect(screen.getAllByText(requestHelper).length).toBeGreaterThan(0)
    expect(
      screen.getAllByText('Запит — якщо хочете консультацію. Питання — якщо потрібно щось уточнити перед запитом.')
        .length
    ).toBeGreaterThan(0)
    expect(requestHelper.toLowerCase()).toContain('кабінет')
    expect(requestHelper.toLowerCase()).toContain('узгодити формат та час')
    expect(
      screen.queryByText(
        'Після натискання відкриється форма запиту: залиште контакт і коротко опишіть запит.'
      )
    ).not.toBeInTheDocument()
    expect(sidebarRequestButton).toHaveAttribute(
      'aria-describedby',
      'public-profile-request-helper public-profile-request-tooltip'
    )
    await fireEvent.focus(sidebarRequestButton!)
    expect(screen.getByRole('tooltip')).toHaveTextContent(requestTooltip)
    await fireEvent.blur(sidebarRequestButton!)
    await fireEvent.mouseEnter(sidebarRequestButton!.parentElement as HTMLElement)
    expect(screen.getByRole('tooltip')).toHaveTextContent(requestTooltip)
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

    expect(await screen.findByRole('heading', { name: 'Запит до мене' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Запит на сесію' })).not.toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', {
        name: 'Погоджуюся з правилами платформи та правилами спеціаліста',
      })
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Перед надсиланням' })).toBeInTheDocument()
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('uses request-only copy for an authenticated specialist previewing own request-only profile', async () => {
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

    expect(await screen.findByText('Залиште запит')).toBeInTheDocument()
    expect(screen.queryByText('Запит на сесію')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Оберіть час для запиту' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Переглянути вільні вікна' })).not.toBeInTheDocument()

    await fireEvent.click((await screen.findAllByRole('button', { name: 'Залишити запит' }))[0]!)

    expect(await screen.findByRole('heading', { name: 'Запит до мене' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Запит на сесію' })).not.toBeInTheDocument()
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
    await screen.findByRole('heading', { name: 'Запит до мене' })

    const modal = container.querySelector('.guest-booking-modal')
    const modalBody = modal?.querySelector('.setting-modal__body')
    expect(modal).not.toBeNull()
    expect(modalBody).not.toBeNull()
    expect(within(modalBody as HTMLElement).getByRole('button', { name: 'Надіслати запит' })).toBeInTheDocument()
  })

  it('shows booking calendar without generic request CTA when slots are available', async () => {
    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockBookingPageDataWithSingleSlot()

    renderView()

    expect(await screen.findByRole('heading', { name: 'Оберіть час для запиту' })).toBeInTheDocument()
    const bookingCard = within(screen.getByTestId('public-profile-booking-card'))
    expect(bookingCard.getByRole('heading', { name: 'Оберіть час' })).toBeInTheDocument()
    expect(bookingCard.getByRole('button', { name: 'Обрати час' })).toBeInTheDocument()
    expect(bookingCard.getByRole('button', { name: 'Залишити запит без вибору часу' })).toBeInTheDocument()
    expect(bookingCard.queryByRole('button', { name: 'Залишити запит' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Переглянути вільні вікна' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Залишити запит на консультацію' })).not.toBeInTheDocument()
    expect(
      screen.getAllByText('Оберіть доступне вікно у профілі. Спеціаліст має підтвердити цей час.').length
    ).toBeGreaterThan(0)
  })

  it('keeps right booking card in slot mode while public slots are loading', async () => {
    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return await new Promise(() => {})
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    const bookingCard = within(await screen.findByTestId('public-profile-booking-card'))
    expect(bookingCard.getByRole('heading', { name: 'Оберіть час' })).toBeInTheDocument()
    expect(bookingCard.getByRole('button', { name: 'Обрати час' })).toBeInTheDocument()
    expect(bookingCard.queryByRole('button', { name: 'Залишити запит' })).not.toBeInTheDocument()
    expect(
      bookingCard.getByText('Оберіть доступне вікно у профілі. Спеціаліст має підтвердити цей час.')
    ).toBeInTheDocument()
  })

  it('keeps slot CTA and auto-shifts calendar when current month is empty but horizon has next-month slots', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-30T09:00:00+03:00'))

    const julySlot = {
      id: 7301,
      start_at: '2026-07-01T10:00:00+03:00',
      end_at: '2026-07-01T10:50:00+03:00',
      is_booked: false,
      therapist_id: 12,
    }

    try {
      mockCommonPublicData()
      mockedFetchChatThreads.mockResolvedValue([])
      mockedApiGet.mockImplementation(async (url, config) => {
        if (url === '/booking/slots/') {
          const params = (config as { params?: Record<string, unknown> } | undefined)?.params || {}
          if (params.date_from === '2026-06-30' && params.date_to === '2026-07-14') return [julySlot]
          if (params.date_from === '2026-07-01' && params.date_to === '2026-07-31') return [julySlot]
          if (params.date_from === '2026-06-01' && params.date_to === '2026-06-30') return []
          throw new Error(`Unexpected slot range: ${JSON.stringify(params)}`)
        }
        if (url === '/public/specialists/olena/reviews/') return []
        throw new Error(`Unexpected apiGet call: ${url}`)
      })

      renderView()

      const bookingCard = within(await screen.findByTestId('public-profile-booking-card'))
      expect(bookingCard.getByRole('heading', { name: 'Оберіть час' })).toBeInTheDocument()
      expect(bookingCard.getByRole('button', { name: 'Обрати час' })).toBeInTheDocument()
      expect(bookingCard.queryByRole('heading', { name: 'Немає доступних вікон' })).not.toBeInTheDocument()
      expect(bookingCard.queryByRole('button', { name: 'Залишити запит' })).not.toBeInTheDocument()

      expect(await screen.findByText(/Липень 2026/)).toBeInTheDocument()
      expect(await screen.findByRole('button', { name: 'Надіслати запит на цей час' })).toBeInTheDocument()
      expect(screen.getByText('10:00')).toBeInTheDocument()

      await waitFor(() => {
        const slotCalls = mockedApiGet.mock.calls.filter((call) => call[0] === '/booking/slots/')
        expect(slotCalls).toHaveLength(2)
      })
      expect(
        mockedApiGet.mock.calls.some((call) => {
          const params = (call[1] as { params?: Record<string, unknown> } | undefined)?.params
          return params?.date_from === '2026-06-01' && params?.date_to === '2026-06-30'
        })
      ).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('scrolls to slots from primary slot-mode CTA without opening generic request modal', async () => {
    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockBookingPageDataWithSingleSlot()

    renderView()

    await screen.findByRole('heading', { name: 'Оберіть час для запиту' })
    const primaryButtons = screen.getAllByRole('button', { name: 'Обрати час' })
    const railButton = primaryButtons.find((button) => Boolean(button.closest('.identity-rail')))
    expect(railButton).toBeDefined()

    await fireEvent.click(railButton!)

    expect(scrollIntoViewSpy).toHaveBeenCalled()
    expect(screen.queryByLabelText('Ім’я')).not.toBeInTheDocument()
  })

  it('opens generic request modal from secondary slot-mode CTA', async () => {
    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockBookingPageDataWithSingleSlot()

    const { container } = renderView()

    await screen.findByRole('heading', { name: 'Оберіть час для запиту' })
    const secondaryButtons = screen.getAllByRole('button', { name: 'Залишити запит без вибору часу' })
    const railButton = secondaryButtons.find((button) => Boolean(button.closest('.identity-rail')))
    expect(railButton).toBeDefined()

    await fireEvent.click(railButton!)

    const modal = container.querySelector('.guest-booking-modal')
    expect(modal).not.toBeNull()
    expect(within(modal as HTMLElement).getByRole('heading', { name: 'Запит на сесію' })).toBeInTheDocument()
    expect(screen.getByLabelText('Ім’я')).toBeInTheDocument()
  })

  it('shows no-slots helper and request CTA when no public slots are available', async () => {
    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') return []
      if (url === '/public/specialists/olena/reviews/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(await screen.findByRole('heading', { name: 'Оберіть час для запиту' })).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByText('Завантажуємо вільні вікна')).not.toBeInTheDocument()
    })
    const bookingCard = within(screen.getByTestId('public-profile-booking-card'))
    expect(bookingCard.getByRole('heading', { name: 'Немає доступних вікон' })).toBeInTheDocument()
    expect(bookingCard.getByRole('button', { name: 'Залишити запит' })).toBeInTheDocument()
    expect(bookingCard.queryByRole('button', { name: 'Обрати час' })).not.toBeInTheDocument()
    expect(bookingCard.getByText('Наразі немає доступних вікон. Ви можете залишити запит, і спеціаліст узгодить час окремо.')).toBeInTheDocument()
    expect(screen.getByText(/У цьому місяці немає доступних вікон/)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Залишити запит' }).length).toBeGreaterThan(0)
  })

  it('hides booking calendar when public availability is hidden', async () => {
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

    expect(await screen.findByRole('heading', { name: 'Готові зробити перший крок?' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Оберіть час для запиту' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Запит до мене' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Залишити запит' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Переглянути вільні вікна' })).not.toBeInTheDocument()
    const requestButtons = screen.getAllByRole('button', { name: 'Залишити запит' })
    expect(requestButtons.some((button) => Boolean(button.closest('.identity-rail')))).toBe(true)
    expect(requestButtons.some((button) => Boolean(button.closest('.closing-cta')))).toBe(true)
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
    await screen.findByRole('heading', { name: 'Запит до мене' })
    await fireEvent.update(screen.getByLabelText('Ім’я'), 'Guest Person')
    await fireEvent.update(screen.getByLabelText('Як спеціаліст може з вами зв’язатися?'), 'guest@example.com')
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
    expect(await screen.findByText('Запит надіслано')).toBeInTheDocument()
    expect(
      screen.getByText('Спеціаліст отримає ваш запит і зможе зв’язатися з вами для узгодження часу та деталей.')
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Спеціаліст відповість у зручному для вас каналі, якщо ви залишили контакт\./)
    ).toBeInTheDocument()
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

    expect(await screen.findByRole('heading', { name: 'Запит до мене' })).toBeInTheDocument()
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

    expect(await screen.findByRole('heading', { name: 'Запит до мене' })).toBeInTheDocument()
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
    await fireEvent.update(screen.getByLabelText('Як спеціаліст може з вами зв’язатися?'), 'client@example.com')
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

  it('opens request form from no-slots fallback CTA for an active client instead of chat', async () => {
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

    renderView()

    const fallbackButtons = await screen.findAllByRole('button', { name: 'Залишити запит' })
    expect(fallbackButtons[0]).toBeDefined()
    await fireEvent.click(fallbackButtons[0]!)

    expect(await screen.findByRole('heading', { name: 'Запит на сесію' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Запит на бронювання' })).not.toBeInTheDocument()
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
      expect(availableDay).toHaveClass('booking-calendar__day--selected')
      expect(await screen.findByText('10:00')).toBeInTheDocument()
      expect(
        screen.queryByText(/На обрану дату немає вільного часу/)
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

    await screen.findByRole('heading', { name: 'Оберіть час для запиту' })
    await waitFor(() => {
      const slotCalls = mockedApiGet.mock.calls.filter((call) => call[0] === '/booking/slots/')
      expect(slotCalls).toHaveLength(2)
    })
    await flushAsyncUpdates()
    expect(screen.getByText(/У цьому місяці немає доступних вікон/)).toBeInTheDocument()
    const slotCalls = mockedApiGet.mock.calls.filter((call) => call[0] === '/booking/slots/')
    expect(slotCalls).toHaveLength(2)
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
        screen.queryByText(/На обрану дату немає вільного часу/)
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
    expect(screen.queryByText('Відгуки')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Залишити запит на консультацію' })).not.toBeInTheDocument()
    expect(
      screen.getAllByText('Ви вже працюєте з цим спеціалістом. Можете продовжити спілкування або переглянути свої сесії.').length
    ).toBeGreaterThan(0)
    expect(screen.queryByText('Поставити питання перед запитом')).not.toBeInTheDocument()

    await fireEvent.click(chatButtons[0] as HTMLButtonElement)

    expect(mockRouter.push).toHaveBeenCalledWith({
      name: 'client-chat',
      query: { therapist_id: '12' },
    })
  })

  it('shows feedback CTA only when the client has a completed session with this specialist', async () => {
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
      if (url === '/booking/slots/') return [buildTodayLocalSlot()]

      if (url === '/booking/sessions/') {
        if ((config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming === true) {
          return []
        }

        return [
          {
            id: 202,
            status: 'COMPLETED',
            therapist: 12,
            therapist_public_slug: 'olena',
            slot_start_at: '2026-05-20T10:00:00Z',
            slot_end_at: '2026-05-20T10:50:00Z',
          },
        ]
      }

      if (url === '/public/specialists/olena/reviews/') return []

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(await screen.findAllByText('Відгуки')).toHaveLength(1)
  })

  it('shows inquiry CTA instead of full-chat CTA for a non-active client', async () => {
    mockAuth.accessToken = 'token'
    mockAuth.me = { user: { id: 7, roles: ['CLIENT'] } }

    mockCommonPublicData()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedFetchInquiryState.mockResolvedValue(buildInquiryState())
    mockBookingPageDataWithSingleSlot()

    renderView()

    const inquiryButtons = await screen.findAllByRole('button', { name: 'Поставити питання перед запитом' })
    expect(inquiryButtons).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'Поставити запитання' })).not.toBeInTheDocument()
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
    mockBookingPageDataWithSingleSlot()

    renderView()

    const bookingCard = within(await screen.findByTestId('public-profile-booking-card'))
    expect(bookingCard.getByRole('heading', { name: 'Оберіть час' })).toBeInTheDocument()
    expect(await screen.findByText('Коротке питання перед запитом')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Поставити питання перед запитом' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Поставити запитання' })).not.toBeInTheDocument()
    expect(screen.getByText('Почніть без тиску')).toBeInTheDocument()
    expect(
      screen.getByText('Коротке питання не фіксує слот і не потребує оплати. Можна спокійно уточнити деталі перед рішенням.')
    ).toBeInTheDocument()
  })

  it('does not introduce marketplace or guarantee wording on public profile CTAs', async () => {
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

    expect((await screen.findAllByRole('button', { name: 'Залишити запит' })).length).toBeGreaterThan(0)
    const text = document.body.textContent || ''
    expect(text).not.toContain('маркетплейс')
    expect(text).not.toContain('рейтинг')
    expect(text).not.toContain('оберіть найкращого')
    expect(text).not.toContain('гарантовані клієнти')
    expect(text).not.toContain('миттєве бронювання')
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
    mockBookingPageDataWithSingleSlot()

    renderView()

    const textarea = await screen.findByLabelText('Ваше повідомлення')
    await fireEvent.update(textarea, 'Чи можна коротко уточнити формат роботи?')
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати питання' }))

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
    mockBookingPageDataWithSingleSlot()

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
    mockBookingPageDataWithSingleSlot()

    renderView()

    expect(await screen.findByText('Запит недоступний')).toBeInTheDocument()
    expect(
      screen.getByText('Для заблокованої взаємодії короткий запит перед сесією недоступний.')
    ).toBeInTheDocument()
  })
})
