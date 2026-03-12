import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.vue'
import {
  fetchChatUnreadCount,
  fetchMe,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationFeedItem,
} from '../lib/api'
import { useAuthStore } from '../stores/auth'

vi.mock('../composables/useToast', () => ({
  useToast: () => ({
    show: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}))

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')

  return {
    ...actual,
    fetchChatUnreadCount: vi.fn(),
    fetchMe: vi.fn(),
    fetchNotifications: vi.fn(),
    markAllNotificationsRead: vi.fn(),
    markNotificationRead: vi.fn(),
  }
})

const mockedFetchChatUnreadCount = vi.mocked(fetchChatUnreadCount)
const mockedFetchMe = vi.mocked(fetchMe)
const mockedFetchNotifications = vi.mocked(fetchNotifications)
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

async function renderWithProviders(options?: {
  initialPath?: string
  roles?: string[]
  notifications?: NotificationFeedItem[]
}) {
  const routes = [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/login', component: { template: '<div>Login</div>' } },
    { path: '/faq', component: { template: '<div>Faq</div>' } },
    { path: '/cabinet', component: { template: '<div>Cabinet</div>' } },
    { path: '/client', component: { template: '<div>Client</div>' } },
    { path: '/cabinet/sessions/:id', component: { template: '<div>Session</div>' } },
    { path: '/client/sessions/:id', component: { template: '<div>Client Session</div>' } },
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

  mockedFetchChatUnreadCount.mockResolvedValue({ unread_count: 0 })
  mockedFetchMe.mockResolvedValue(mePayload as Awaited<ReturnType<typeof fetchMe>>)
  mockedFetchNotifications.mockResolvedValue({
    count: options?.notifications?.length ?? 0,
    results: options?.notifications ?? [],
  })
  mockedMarkNotificationRead.mockResolvedValue({
    ok: true,
    source_kind: 'session_event',
    source_id: 1,
    read_at: '2026-03-12T10:00:00Z',
  })
  mockedMarkAllNotificationsRead.mockResolvedValue({
    ok: true,
    marked_count: options?.notifications?.length ?? 0,
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
  })

  it('renders footer text', async () => {
    await renderWithProviders()
    expect(screen.getByText(/Без комісій\. Без посередників\./i)).toBeInTheDocument()
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
})
