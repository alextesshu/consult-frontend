import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.vue'
import ClientInquiryRedirectView from '../views/ClientInquiryRedirectView.vue'
import {
  apiGet,
  fetchChatUnreadCount,
  fetchMe,
  fetchNotifications,
  fetchPublicSpecialists,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationFeedItem,
} from '../lib/api'
import { useAuthStore } from '../stores/auth'

const mockToast = {
  show: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}

vi.mock('../composables/useToast', () => ({
  useToast: () => mockToast,
}))

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')

  return {
    ...actual,
    apiGet: vi.fn(),
    fetchChatUnreadCount: vi.fn(),
    fetchMe: vi.fn(),
    fetchNotifications: vi.fn(),
    fetchPublicSpecialists: vi.fn(),
    markAllNotificationsRead: vi.fn(),
    markNotificationRead: vi.fn(),
  }
})

const mockedApiGet = vi.mocked(apiGet)
const mockedFetchChatUnreadCount = vi.mocked(fetchChatUnreadCount)
const mockedFetchMe = vi.mocked(fetchMe)
const mockedFetchNotifications = vi.mocked(fetchNotifications)
const mockedFetchPublicSpecialists = vi.mocked(fetchPublicSpecialists)
const mockedMarkAllNotificationsRead = vi.mocked(markAllNotificationsRead)
const mockedMarkNotificationRead = vi.mocked(markNotificationRead)

function buildMePayload(roles: string[]) {
  return {
    user: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      roles,
    },
    access_state: null,
    effective_entitlements: null,
    counts: null,
    notifications: null,
    server_time: '2026-03-12T10:00:00Z',
  }
}

function buildNotification(overrides: Partial<NotificationFeedItem>): NotificationFeedItem {
  return {
    id: 'session_event:1',
    kind: 'session_event',
    source_kind: 'session_event',
    source_id: 1,
    code: 'RESCHEDULED',
    session_id: 41,
    client_id: 3,
    client_name: 'testclient',
    client_email: 'testclient@example.com',
    slot_start_at: '2026-03-12T17:00:00Z',
    created_at: '2026-03-12T10:00:00Z',
    scheduled_for: null,
    delivered_at: null,
    read_at: null,
    ...overrides,
  }
}

async function renderWithProviders(options?: {
  initialPath?: string
  roles?: string[]
  notifications?: NotificationFeedItem[]
  notificationsState?: { current: NotificationFeedItem[] }
  upcomingSessions?: any[]
}) {
  const routes = [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/login', component: { template: '<div>Login</div>' } },
    { path: '/faq', component: { template: '<div>Faq</div>' } },
    { path: '/terms', component: { template: '<div>Terms</div>' } },
    { path: '/privacy', component: { template: '<div>Privacy</div>' } },
    { path: '/disclaimer', component: { template: '<div>Disclaimer</div>' } },
    { path: '/support-and-data-requests', component: { template: '<div>Support</div>' } },
    {
      path: '/guest/external-session/:token',
      component: { template: '<div>External Guest Session</div>' },
      meta: { minimalShell: true },
    },
    { path: '/cabinet', component: { template: '<div>Cabinet</div>' } },
    { path: '/client', component: { template: '<div>Client</div>' } },
    { path: '/cabinet/inquiries', component: { template: '<div>Cabinet Inquiries</div>' } },
    {
      path: '/client/inquiries/:specialistId',
      name: 'client-inquiry-redirect',
      component: ClientInquiryRedirectView,
    },
    { path: '/cabinet/sessions/:id', component: { template: '<div>Session</div>' } },
    { path: '/client/sessions/:id', component: { template: '<div>Client Session</div>' } },
    {
      path: '/specialist/:slug',
      name: 'public-profile',
      component: { template: '<div>Public Profile</div>' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ]
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  })
  const pinia = createPinia()
  setActivePinia(pinia)

  const roles = options?.roles ?? []
  const mePayload = buildMePayload(roles)
  const notificationsState = options?.notificationsState ?? { current: options?.notifications ?? [] }

  mockedFetchChatUnreadCount.mockResolvedValue({ unread_count: 0 })
  mockedFetchMe.mockResolvedValue(mePayload as Awaited<ReturnType<typeof fetchMe>>)
  mockedFetchNotifications.mockImplementation(async () => ({
    count: notificationsState.current.length,
    results: notificationsState.current,
  }))
  mockedFetchPublicSpecialists.mockResolvedValue({
    results: [],
    page: 1,
    page_size: 100,
    total: 0,
    total_pages: 1,
  })
  mockedMarkNotificationRead.mockImplementation(async (payload) => ({
    ok: true,
    source_kind: payload.source_kind,
    source_id: payload.source_id,
    read_at: '2026-03-12T10:00:00Z',
  }))
  mockedMarkAllNotificationsRead.mockResolvedValue({
    ok: true,
    marked_count: notificationsState.current.filter((item) => !item.read_at).length,
  })
  mockedApiGet.mockImplementation(async (url, config) => {
    if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming) {
      return options?.upcomingSessions ?? []
    }
    return []
  })

  const auth = useAuthStore()
  if (roles.length) {
    auth.accessToken = 'token'
    auth.setMe(mePayload)
  }

  await router.push(options?.initialPath ?? '/')
  await router.isReady()

  const result = render(App, {
    global: {
      plugins: [pinia, router],
    },
  })

  return {
    router,
    ...result,
  }
}

describe('App shell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    mockToast.show.mockReset()
    mockToast.success.mockReset()
    mockToast.error.mockReset()
    mockToast.warning.mockReset()
    mockToast.info.mockReset()
  })

  it('renders footer text', async () => {
    await renderWithProviders()
    expect(screen.getByText(/Без комісій\. Без посередників\./i)).toBeInTheDocument()
  })

  it('hides topbar and footer on minimal shell routes', async () => {
    await renderWithProviders({
      initialPath: '/guest/external-session/test-token',
    })

    expect(document.querySelector('header.topbar')).not.toBeInTheDocument()
    expect(document.querySelector('footer.footer')).not.toBeInTheDocument()
    expect(screen.getByText('External Guest Session')).toBeInTheDocument()
  })

  it('refreshes me on visibilitychange when specialist tab becomes visible', async () => {
    await renderWithProviders({
      initialPath: '/cabinet',
      roles: ['SPECIALIST'],
    })

    await waitFor(() => {
      expect(mockedFetchMe.mock.calls.length).toBeGreaterThan(0)
    })
    const callsBefore = mockedFetchMe.mock.calls.length

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
    document.dispatchEvent(new Event('visibilitychange'))

    await waitFor(() => {
      expect(mockedFetchMe.mock.calls.length).toBeGreaterThan(callsBefore)
    })
  })

  it('renders explicit reschedule notification copy in the bell feed', async () => {
    await renderWithProviders({
      initialPath: '/cabinet',
      roles: ['SPECIALIST'],
      notifications: [
        {
          id: 'reschedule_request:15',
          kind: 'reschedule_request',
          source_kind: 'reschedule_request',
          source_id: 15,
          code: 'RESCHEDULE_REQUESTED',
          session_id: 40,
          client_id: 3,
          client_name: 'testclient',
          client_email: 'testclient@example.com',
          slot_start_at: '2026-03-12T15:00:00Z',
          created_at: '2026-03-12T10:05:00Z',
          scheduled_for: null,
          delivered_at: null,
          read_at: null,
        },
        {
          id: 'session_event:22',
          kind: 'session_event',
          source_kind: 'session_event',
          source_id: 22,
          code: 'RESCHEDULED',
          session_id: 41,
          client_id: 3,
          client_name: 'testclient',
          client_email: 'testclient@example.com',
          slot_start_at: '2026-03-12T17:00:00Z',
          created_at: '2026-03-12T10:00:00Z',
          scheduled_for: null,
          delivered_at: null,
          read_at: null,
        },
      ],
    })

    await fireEvent.click(screen.getByRole('button', { name: /Сповіщення/i }))

    expect(
      await screen.findByText(/Перенесення: testclient просить змінити час сесії/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/Запитаний час:/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Перенесення: новий час сесії підтверджено/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/Новий час:/i)).toBeInTheDocument()
  })

  it('routes client session notifications to the client session detail', async () => {
    const { router } = await renderWithProviders({
      initialPath: '/client',
      roles: ['CLIENT'],
      notifications: [
        {
          id: 'session_event:22',
          kind: 'session_event',
          source_kind: 'session_event',
          source_id: 22,
          code: 'RESCHEDULED',
          session_id: 41,
          client_id: 1,
          client_name: 'testuser',
          client_email: 'test@example.com',
          slot_start_at: '2026-03-12T17:00:00Z',
          created_at: '2026-03-12T10:00:00Z',
          scheduled_for: null,
          delivered_at: null,
          read_at: null,
        },
      ],
    })

    await fireEvent.click(screen.getByRole('button', { name: /Сповіщення/i }))
    const notificationLink = (await screen.findByText(/Перенесення: новий час сесії підтверджено/i)).closest('a')

    expect(notificationLink).not.toBeNull()
    expect(notificationLink).toHaveAttribute('href', '/client/sessions/41')

    await fireEvent.click(notificationLink as HTMLAnchorElement)

    await waitFor(() => {
      expect(router.currentRoute.value.fullPath).toBe('/client/sessions/41')
    })
  })

  it('shows a join button for reminder notifications with an external meeting link', async () => {
    await renderWithProviders({
      initialPath: '/client',
      roles: ['CLIENT'],
      notifications: [
        buildNotification({
          id: 'session_reminder:41',
          code: 'session_starts_1h',
          session_id: 41,
          meeting_url: 'https://meet.google.com/abc-defg-hij',
          meeting_provider: 'google_meet',
        }),
      ],
    })

    await fireEvent.click(screen.getByRole('button', { name: /Сповіщення/i }))

    const joinLink = await screen.findByRole('link', { name: 'Приєднатися' })
    expect(joinLink).toHaveAttribute('href', 'https://meet.google.com/abc-defg-hij')

    await fireEvent.click(joinLink)

    await waitFor(() => {
      expect(mockedMarkNotificationRead).toHaveBeenCalledWith({
        source_kind: 'session_event',
        source_id: 1,
      })
    })
  })

  it('shows a 5-minute specialist pre-session toast with details and join actions', async () => {
    const startAt = new Date(Date.now() + 4 * 60 * 1000).toISOString()

    await renderWithProviders({
      initialPath: '/cabinet',
      roles: ['SPECIALIST'],
      upcomingSessions: [
        {
          id: 77,
          status: 'CONFIRMED',
          slot_start_at: startAt,
          meeting_url: 'https://meet.google.com/reminder-room',
          join_available: true,
        },
      ],
    })

    await waitFor(() => {
      expect(mockToast.show).toHaveBeenCalledTimes(1)
    })

    const payload = mockToast.show.mock.calls[0]?.[0]
    expect(payload).toMatchObject({
      type: 'info',
      title: 'Нагадування',
      message: 'За 5 хвилин починається сесія з клієнтом.',
    })
    expect(payload.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Відкрити деталі', to: '/cabinet/sessions/77' }),
        expect.objectContaining({
          label: 'Приєднатися',
          href: 'https://meet.google.com/reminder-room',
          target: '_blank',
        }),
      ])
    )
  })

  it('does not duplicate the same pre-session toast after reload in one browser session', async () => {
    const startAt = new Date(Date.now() + 3 * 60 * 1000).toISOString()
    const options = {
      initialPath: '/client',
      roles: ['CLIENT'],
      upcomingSessions: [
        {
          id: 55,
          status: 'CONFIRMED',
          slot_start_at: startAt,
          meeting_url: 'https://meet.google.com/client-room',
          join_available: false,
        },
      ],
    }

    const firstRender = await renderWithProviders(options)
    await waitFor(() => {
      expect(mockToast.show).toHaveBeenCalledTimes(1)
    })

    firstRender.unmount()
    await renderWithProviders(options)
    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenCalled()
    })

    expect(mockToast.show).toHaveBeenCalledTimes(1)
    const payload = mockToast.show.mock.calls[0]?.[0]
    expect(payload).toMatchObject({
      message: 'За 5 хвилин починається ваша сесія.',
    })
    expect(payload.actions).toEqual([
      expect.objectContaining({ label: 'Відкрити деталі', to: '/client/sessions/55' }),
    ])
  })

  it('shows a new pre-session toast after reschedule with the same session id', async () => {
    const firstStartAt = new Date(Date.now() + 2 * 60 * 1000).toISOString()
    const rescheduledStartAt = new Date(Date.now() + 4 * 60 * 1000).toISOString()

    const firstRender = await renderWithProviders({
      initialPath: '/client',
      roles: ['CLIENT'],
      upcomingSessions: [
        {
          id: 56,
          status: 'CONFIRMED',
          slot_start_at: firstStartAt,
          meeting_url: 'https://meet.google.com/client-room',
          join_available: false,
        },
      ],
    })
    await waitFor(() => {
      expect(mockToast.show).toHaveBeenCalledTimes(1)
    })

    firstRender.unmount()
    await renderWithProviders({
      initialPath: '/client',
      roles: ['CLIENT'],
      upcomingSessions: [
        {
          id: 56,
          status: 'CONFIRMED',
          slot_start_at: rescheduledStartAt,
          meeting_url: 'https://meet.google.com/client-room',
          join_available: false,
        },
      ],
    })

    await waitFor(() => {
      expect(mockToast.show).toHaveBeenCalledTimes(2)
    })

    const secondPayload = mockToast.show.mock.calls[1]?.[0]
    expect(secondPayload.actions).toEqual([
      expect.objectContaining({ to: '/client/sessions/56' }),
    ])
  })

  it('routes specialist inquiry created notifications to the specialist inquiry surface', async () => {
    const { router } = await renderWithProviders({
      initialPath: '/cabinet',
      roles: ['SPECIALIST'],
      notifications: [
        buildNotification({
          id: 'inquiry_message:81',
          kind: 'inquiry_message',
          source_kind: 'inquiry_message',
          source_id: 81,
          code: 'INQUIRY_CREATED',
          session_id: null,
          client_id: 7,
          client_name: 'Ірина',
          client_email: null,
          counterparty_id: 7,
          counterparty_name: 'Ірина',
          specialist_id: 12,
          specialist_name: 'Олена',
          thread_id: 91,
          message_id: 301,
          preview: 'Чи можна уточнити формат першої розмови?',
          slot_start_at: null,
        }),
      ],
    })

    await fireEvent.click(screen.getByRole('button', { name: /Сповіщення/i }))

    expect(await screen.findByText('Запит до бронювання від Ірина')).toBeInTheDocument()
    expect(screen.getByText('Чи можна уточнити формат першої розмови?')).toBeInTheDocument()

    const notificationLink = screen.getByText('Запит до бронювання від Ірина').closest('a')
    expect(notificationLink).not.toBeNull()
    expect(notificationLink).toHaveAttribute('href', '/cabinet/inquiries?thread_id=91')

    await fireEvent.click(notificationLink as HTMLAnchorElement)

    await waitFor(() => {
      expect(mockedMarkNotificationRead).toHaveBeenCalledWith({
        source_kind: 'inquiry_message',
        source_id: 81,
      })
      expect(router.currentRoute.value.fullPath).toBe('/cabinet/inquiries?thread_id=91')
    })
  })

  it('routes client inquiry replied notifications to the bounded inquiry surface', async () => {
    const { router } = await renderWithProviders({
      initialPath: '/client',
      roles: ['CLIENT'],
      notifications: [
        buildNotification({
          id: 'inquiry_message:82',
          kind: 'inquiry_message',
          source_kind: 'inquiry_message',
          source_id: 82,
          code: 'INQUIRY_REPLIED',
          session_id: null,
          client_id: 1,
          client_name: 'testuser',
          client_email: 'test@example.com',
          counterparty_id: 12,
          counterparty_name: 'Олена',
          specialist_id: 12,
          specialist_name: 'Олена',
          thread_id: 91,
          message_id: 302,
          preview: 'Так, можна коротко уточнити запит перед бронюванням.',
          slot_start_at: null,
        }),
      ],
    })
    mockedFetchPublicSpecialists.mockResolvedValue({
      results: [
        {
          therapist_id: 12,
          public_slug: 'olena',
          display_name: 'Олена',
        } as any,
      ],
      page: 1,
      page_size: 100,
      total: 1,
      total_pages: 1,
    })

    await fireEvent.click(screen.getByRole('button', { name: /Сповіщення/i }))

    expect(await screen.findByText('Відповідь на запит від Олена')).toBeInTheDocument()
    expect(screen.getByText('Так, можна коротко уточнити запит перед бронюванням.')).toBeInTheDocument()

    const notificationLink = screen.getByText('Відповідь на запит від Олена').closest('a')
    expect(notificationLink).not.toBeNull()
    expect(notificationLink).toHaveAttribute('href', '/client/inquiries/12')

    await fireEvent.click(notificationLink as HTMLAnchorElement)

    await waitFor(() => {
      expect(mockedMarkNotificationRead).toHaveBeenCalledWith({
        source_kind: 'inquiry_message',
        source_id: 82,
      })
      expect(router.currentRoute.value.fullPath).toBe('/specialist/olena#inquiry')
    })
  })

  it('routes specialist inquiry follow-up notifications to the specialist inquiry surface', async () => {
    const { router } = await renderWithProviders({
      initialPath: '/cabinet',
      roles: ['SPECIALIST'],
      notifications: [
        buildNotification({
          id: 'inquiry_message:83',
          kind: 'inquiry_message',
          source_kind: 'inquiry_message',
          source_id: 83,
          code: 'INQUIRY_FOLLOWED_UP',
          session_id: null,
          client_id: 9,
          client_name: 'Марія',
          client_email: null,
          counterparty_id: 9,
          counterparty_name: 'Марія',
          specialist_id: 12,
          specialist_name: 'Олена',
          thread_id: 92,
          message_id: 303,
          preview: 'Дякую, маю ще одне коротке уточнення.',
          slot_start_at: null,
        }),
      ],
    })

    await fireEvent.click(screen.getByRole('button', { name: /Сповіщення/i }))

    expect(await screen.findByText('Уточнення до запиту від Марія')).toBeInTheDocument()
    expect(screen.getByText('Дякую, маю ще одне коротке уточнення.')).toBeInTheDocument()

    const notificationLink = screen.getByText('Уточнення до запиту від Марія').closest('a')
    expect(notificationLink).not.toBeNull()
    expect(notificationLink).toHaveAttribute('href', '/cabinet/inquiries?thread_id=92')

    await fireEvent.click(notificationLink as HTMLAnchorElement)

    await waitFor(() => {
      expect(mockedMarkNotificationRead).toHaveBeenCalledWith({
        source_kind: 'inquiry_message',
        source_id: 83,
      })
      expect(router.currentRoute.value.fullPath).toBe('/cabinet/inquiries?thread_id=92')
    })
  })

  it('keeps read and read-all behavior working with mixed inquiry and session notifications', async () => {
    const notificationsState = {
      current: [
        buildNotification({
          id: 'inquiry_message:81',
          kind: 'inquiry_message',
          source_kind: 'inquiry_message',
          source_id: 81,
          code: 'INQUIRY_CREATED',
          session_id: null,
          client_id: 7,
          client_name: 'Ірина',
          client_email: null,
          counterparty_id: 7,
          counterparty_name: 'Ірина',
          specialist_id: 12,
          specialist_name: 'Олена',
          thread_id: 91,
          message_id: 301,
          preview: 'Чи можна уточнити формат?',
          slot_start_at: null,
        }),
        buildNotification({
          id: 'session_event:22',
          source_id: 22,
          code: 'RESCHEDULED',
          session_id: 41,
        }),
      ],
    }
    mockedMarkAllNotificationsRead.mockImplementation(async () => {
      notificationsState.current = notificationsState.current.map((item) => ({
        ...item,
        read_at: item.read_at || '2026-03-12T10:10:00Z',
      }))
      return {
        ok: true,
        marked_count: 1,
      }
    })

    await renderWithProviders({
      initialPath: '/cabinet',
      roles: ['SPECIALIST'],
      notificationsState,
    })

    await fireEvent.click(screen.getByRole('button', { name: /Сповіщення/i }))
    const inquiryLink = await screen.findByText('Запит до бронювання від Ірина')

    await fireEvent.click(inquiryLink.closest('a') as HTMLAnchorElement)

    await waitFor(() => {
      expect(mockedMarkNotificationRead).toHaveBeenCalledWith({
        source_kind: 'inquiry_message',
        source_id: 81,
      })
    })

    notificationsState.current = notificationsState.current.map((item) =>
      item.id === 'inquiry_message:81'
        ? {
            ...item,
            read_at: '2026-03-12T10:05:00Z',
          }
        : item
    )

    await fireEvent.click(screen.getByRole('button', { name: /Сповіщення/i }))
    await fireEvent.click(await screen.findByRole('button', { name: 'Прочитати все' }))

    await waitFor(() => {
      expect(mockedMarkAllNotificationsRead).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Прочитати все' })).not.toBeInTheDocument()
    })
  })
})
