import { fireEvent, render, screen } from '@testing-library/vue'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import PublicProfileView from './PublicProfileView.vue'
import { BOOKING_UI_MESSAGES } from '../lib/bookingCopy'
import {
  apiGet,
  apiPost,
  fetchPublicAuthorJournalPosts,
  fetchPublicJournalCollections,
  fetchPublicSpecialistProfile,
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
  me: null as null | { user: { roles: string[] } },
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
  fetchPublicSpecialistProfile: vi.fn(),
  fetchPublicAuthorJournalPosts: vi.fn(),
  fetchPublicJournalCollections: vi.fn(),
}))

const mockedApiGet = vi.mocked(apiGet)
const mockedApiPost = vi.mocked(apiPost)
const mockedFetchPublicSpecialistProfile = vi.mocked(fetchPublicSpecialistProfile)
const mockedFetchPublicAuthorJournalPosts = vi.mocked(fetchPublicAuthorJournalPosts)
const mockedFetchPublicJournalCollections = vi.mocked(fetchPublicJournalCollections)

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
    mockedFetchPublicSpecialistProfile.mockReset()
    mockedFetchPublicAuthorJournalPosts.mockReset()
    mockedFetchPublicJournalCollections.mockReset()
  })

  it('renders the main public profile sections from loaded data', async () => {
    mockedFetchPublicSpecialistProfile.mockResolvedValue({
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
    })
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
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/slots/') {
        return [
          {
            id: 100,
            start_at: '2099-06-15T10:00:00Z',
            end_at: '2099-06-15T10:50:00Z',
          },
        ]
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
    mockAuth.me = { user: { roles: ['CLIENT'] } }

    mockedFetchPublicSpecialistProfile.mockResolvedValue({
      therapist_id: 12,
      public_slug: 'olena',
      display_name: 'Олена',
      bio_about: '',
      bio_work: '',
      bio_approach: '',
      bio_for_whom: '',
      specializations: [],
      languages: [],
      location: '',
      experience_years: 3,
      price: '1200',
      price_currency: 'UAH',
      intro_duration_minutes: 30,
      intro_price: '500',
      intro_price_currency: 'UAH',
      contact_email: '',
      photo_url: '',
      video_url: '',
    })
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    mockedFetchPublicJournalCollections.mockResolvedValue([])
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/slots/') {
        return [
          {
            id: 100,
            start_at: '2099-06-15T10:00:00Z',
            end_at: '2099-06-15T10:50:00Z',
          },
        ]
      }

      if (url === '/booking/sessions/') {
        if ((config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming === true) {
          return []
        }

        return []
      }

      if (url === '/public/specialists/olena/reviews/') {
        return []
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    const bookButton = await screen.findByRole('button', { name: 'Записатися' })
    await fireEvent.click(bookButton)

    expect(await screen.findByText(BOOKING_UI_MESSAGES.acceptSettingBeforeBooking)).toBeInTheDocument()
    expect(mockedApiPost).not.toHaveBeenCalled()
  })
})
