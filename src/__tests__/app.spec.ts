import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.vue'
import appRouter from '../router'
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
  meOverrides?: Partial<ReturnType<typeof buildMePayload>>
  notifications?: NotificationFeedItem[]
  notificationsState?: { current: NotificationFeedItem[] }
  upcomingSessions?: any[]
}) {
  const routes = [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/login', component: { template: '<div>Login</div>' } },
    { path: '/signup', component: { template: '<div>Signup</div>' } },
    { path: '/pricing', component: { template: '<div>Pricing</div>' } },
    { path: '/admin/work-queue', component: { template: '<div>Admin Work Queue</div>' } },
    { path: '/admin/inbox', component: { template: '<div>Admin Inbox</div>' } },
    { path: '/admin/billing-access-requests', component: { template: '<div>Admin Billing Requests</div>' } },
    { path: '/admin/specialists', component: { template: '<div>Admin Specialists</div>' } },
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
    { path: '/cabinet/chat', component: { template: '<div>Cabinet Chat</div>' } },
    { path: '/cabinet/profile', component: { template: '<div>Cabinet Profile</div>' } },
    { path: '/cabinet/slots', component: { template: '<div>Cabinet Slots</div>' } },
    { path: '/cabinet/sessions', component: { template: '<div>Cabinet Sessions</div>' } },
    { path: '/cabinet/practice-board', component: { template: '<div>Cabinet Practice Board</div>' } },
    { path: '/cabinet/clients', component: { template: '<div>Cabinet Clients</div>' } },
    { path: '/cabinet/reviews', component: { template: '<div>Cabinet Reviews</div>' } },
    { path: '/cabinet/external-sessions', component: { template: '<div>Cabinet External Sessions</div>' } },
    { path: '/cabinet/analytics', component: { template: '<div>Cabinet Analytics</div>' } },
    { path: '/cabinet/billing', component: { template: '<div>Cabinet Billing</div>' } },
    { path: '/cabinet/journal', component: { template: '<div>Cabinet Journal</div>' } },
    { path: '/cabinet/settings', component: { template: '<div>Cabinet Settings</div>' } },
    { path: '/cabinet/settings/notifications', component: { template: '<div>Cabinet Notifications</div>' } },
    { path: '/public', component: { template: '<div>Public Redirect</div>' } },
    { path: '/specialists', component: { template: '<div>Public Specialists</div>' } },
    { path: '/client', component: { template: '<div>Client</div>' } },
    { path: '/client/materials', component: { template: '<div>Client Materials</div>' } },
    { path: '/client/chat', component: { template: '<div>Client Chat</div>' } },
    { path: '/cabinet/inquiries', component: { template: '<div>Cabinet Inquiries</div>' } },
    {
      path: '/client/inquiries/:specialistId',
      name: 'client-inquiry-redirect',
      component: ClientInquiryRedirectView,
    },
    { path: '/cabinet/sessions/:id', component: { template: '<div>Session</div>' } },
    { path: '/client/sessions/:id', component: { template: '<div>Client Session</div>' } },
    {
      path: '/s/:slug',
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
  const mePayload = {
    ...buildMePayload(roles),
    ...(options?.meOverrides || {}),
  }
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

  it('uses specialist-focused header CTA copy on public specialist profiles', async () => {
    await renderWithProviders({ initialPath: '/s/olena' })

    expect(screen.getByRole('link', { name: 'Для спеціалістів' })).toHaveAttribute(
      'href',
      '/signup'
    )
    expect(
      screen.queryByRole('link', { name: 'Спробувати безкоштовно' })
    ).not.toBeInTheDocument()
  })

  it('allows guests to open /specialists without redirect to signup-client', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)

    await appRouter.push('/specialists')
    await appRouter.isReady()

    expect(appRouter.currentRoute.value.fullPath).toBe('/specialists')
  })

  it('renders product footer on public routes', async () => {
    await renderWithProviders()

    const footer = document.querySelector('footer.footer--public') as HTMLElement | null
    expect(footer).toBeInTheDocument()
    expect(within(footer as HTMLElement).getByText('PRO CONSULT')).toBeInTheDocument()
    expect(within(footer as HTMLElement).getByText('Простір для ведення консультацій.')).toBeInTheDocument()
    expect(within(footer as HTMLElement).getByText(/Публічний профіль, запити, сесії, календар/i)).toBeInTheDocument()
    expect(within(footer as HTMLElement).getByRole('link', { name: 'Можливості' })).toHaveAttribute(
      'href',
      '/#features'
    )
    expect(within(footer as HTMLElement).getByRole('link', { name: 'Знайти профіль спеціаліста' })).toHaveAttribute(
      'href',
      '/specialists'
    )
    expect(within(footer as HTMLElement).getByRole('link', { name: 'Тарифи' })).toHaveAttribute('href', '/pricing')
    expect(within(footer as HTMLElement).getByRole('link', { name: 'Підтримка та запити щодо даних' })).toHaveAttribute(
      'href',
      '/support-and-data-requests'
    )
    expect(footer?.textContent || '').not.toContain('вашої справи')
  })

  it('keeps the public home header in normal document flow', async () => {
    await renderWithProviders()

    const topbar = document.querySelector('header.topbar') as HTMLElement | null
    expect(topbar).toBeInTheDocument()
    expect(topbar).toHaveClass('topbar--guest')
    expect(topbar).not.toHaveClass('topbar--overlay')
  })

  it('keeps the specialist home header out of overlay mode', async () => {
    await renderWithProviders({
      initialPath: '/',
      roles: ['SPECIALIST'],
    })

    const topbar = document.querySelector('header.topbar') as HTMLElement | null
    expect(topbar).toBeInTheDocument()
    expect(topbar).toHaveClass('topbar--specialist')
    expect(topbar).not.toHaveClass('topbar--overlay')
  })

  it('renders compact service footer on cabinet routes', async () => {
    await renderWithProviders({
      initialPath: '/cabinet',
      roles: ['SPECIALIST'],
    })

    const footer = document.querySelector('footer.footer--cabinet') as HTMLElement | null
    expect(footer).toBeInTheDocument()
    expect(within(footer as HTMLElement).getByText('Pro Consult')).toBeInTheDocument()
    expect(within(footer as HTMLElement).getByText(/Без комісій\. Без посередників\./i)).toBeInTheDocument()
    expect(within(footer as HTMLElement).getByRole('link', { name: 'Умови користування' })).toHaveAttribute(
      'href',
      '/terms'
    )
    expect(within(footer as HTMLElement).getByRole('link', { name: 'Підтримка' })).toHaveAttribute(
      'href',
      '/support-and-data-requests'
    )
    expect(within(footer as HTMLElement).queryByText('Продукт')).not.toBeInTheDocument()
    expect(within(footer as HTMLElement).queryByRole('link', { name: 'Створити простір' })).not.toBeInTheDocument()
  })

  it('renders technical build probe for deploy verification', async () => {
    await renderWithProviders()
    const probe = document.querySelector('#fe-build-probe') as HTMLDivElement | null
    expect(probe).not.toBeNull()
    expect(probe?.dataset.buildMarker).toBeTruthy()
    expect(probe?.dataset.deployEnv).toBeTruthy()
  })

  it('hides topbar and footer on minimal shell routes', async () => {
    await renderWithProviders({
      initialPath: '/guest/external-session/test-token',
    })

    expect(document.querySelector('header.topbar')).not.toBeInTheDocument()
    expect(document.querySelector('footer.footer')).not.toBeInTheDocument()
    expect(screen.getByText('External Guest Session')).toBeInTheDocument()
  })

  it('keeps specialist top mobile menu focused on account actions', async () => {
    await renderWithProviders({
      initialPath: '/cabinet',
      roles: ['SPECIALIST'],
    })

    await fireEvent.click(screen.getByRole('button', { name: 'Меню' }))

    const mobileMenu = document.querySelector('.mobile-menu') as HTMLElement
    expect(mobileMenu).toBeInTheDocument()
    const publicPreviewLink = await screen.findByRole('link', { name: 'Публічний профіль (перегляд)' })

    expect(publicPreviewLink).toHaveAttribute('href', '/public')
    expect(within(mobileMenu).getByRole('link', { name: 'Налаштування' })).toHaveAttribute(
      'href',
      '/cabinet/settings'
    )
    expect(within(mobileMenu).getByRole('button', { name: 'Вийти' })).toBeInTheDocument()
    expect(within(mobileMenu).queryByRole('link', { name: 'Керування профілем' })).not.toBeInTheDocument()
    expect(within(mobileMenu).queryByRole('link', { name: 'Чат' })).not.toBeInTheDocument()
    expect(within(mobileMenu).queryByRole('link', { name: 'Мій кабінет' })).not.toBeInTheDocument()
  })

  it('uses a functional specialist mobile settings link instead of a dead CTA', async () => {
    const { router } = await renderWithProviders({
      initialPath: '/cabinet',
      roles: ['SPECIALIST'],
    })

    await fireEvent.click(screen.getByRole('button', { name: 'Меню' }))

    const mobileMenu = document.querySelector('.mobile-menu') as HTMLElement
    expect(mobileMenu).toBeInTheDocument()
    const settingsLink = within(mobileMenu).getByRole('link', { name: 'Налаштування' })
    expect(settingsLink).toHaveAttribute('href', '/cabinet/settings')
    expect(within(mobileMenu).queryByRole('button', { name: 'Налаштування' })).not.toBeInTheDocument()

    await fireEvent.click(settingsLink)

    await waitFor(() => {
      expect(router.currentRoute.value.fullPath).toBe('/cabinet/settings')
    })
  })

  it('shows specialist sidebar on cabinet routes with main workspace links', async () => {
    await renderWithProviders({
      initialPath: '/cabinet',
      roles: ['SPECIALIST'],
    })

    const sidebar = screen.getByRole('navigation', { name: 'Навігація кабінету спеціаліста' })
    expect(sidebar).toBeInTheDocument()
    expect(within(sidebar).getByRole('link', { name: 'Головна' })).toHaveAttribute('href', '/cabinet')
    expect(within(sidebar).getByRole('link', { name: 'Профіль' })).toHaveAttribute('href', '/cabinet/profile')
    expect(within(sidebar).getByRole('link', { name: 'Розклад' })).toHaveAttribute('href', '/cabinet/slots')
    expect(within(sidebar).getByRole('link', { name: 'Сесії' })).toHaveAttribute('href', '/cabinet/sessions')
    expect(within(sidebar).getByRole('link', { name: 'Задачі' })).toHaveAttribute(
      'href',
      '/cabinet/practice-board'
    )
    expect(within(sidebar).getByRole('link', { name: 'Клієнти' })).toHaveAttribute('href', '/cabinet/clients')
    expect(within(sidebar).getByRole('link', { name: 'Відгуки' })).toHaveAttribute('href', '/cabinet/reviews')
    expect(within(sidebar).queryByRole('link', { name: 'Сесії без реєстрації' })).not.toBeInTheDocument()
    expect(within(sidebar).getByRole('link', { name: 'Чати' })).toHaveAttribute('href', '/cabinet/chat')
    expect(within(sidebar).getByRole('link', { name: 'Власний блог' })).toHaveAttribute(
      'href',
      '/cabinet/journal'
    )
    expect(within(sidebar).getByRole('link', { name: 'Аналітика' })).toHaveAttribute('href', '/cabinet/analytics')
    expect(within(sidebar).getByRole('link', { name: 'Тарифи і доступ' })).toHaveAttribute(
      'href',
      '/cabinet/billing'
    )
    expect(within(sidebar).getByRole('link', { name: 'Налаштування' })).toHaveAttribute('href', '/cabinet/settings')
    const linkLabels = within(sidebar)
      .getAllByRole('link')
      .map((link) => (link.textContent || '').trim())
    expect(linkLabels.indexOf('Задачі')).toBe(linkLabels.indexOf('Сесії') + 1)
    expect(linkLabels.indexOf('Клієнти')).toBe(linkLabels.indexOf('Задачі') + 1)
  })

  it('highlights active specialist sidebar item for nested cabinet routes', async () => {
    await renderWithProviders({
      initialPath: '/cabinet/sessions/42',
      roles: ['SPECIALIST'],
    })

    const sidebar = screen.getByRole('navigation', { name: 'Навігація кабінету спеціаліста' })
    expect(within(sidebar).getByRole('link', { name: 'Сесії' })).toHaveClass('is-active')
    expect(within(sidebar).getByRole('link', { name: 'Головна' })).not.toHaveClass('is-active')
  })

  it('highlights the specialist chat sidebar item on chat route', async () => {
    await renderWithProviders({
      initialPath: '/cabinet/chat',
      roles: ['SPECIALIST'],
    })

    const sidebar = screen.getByRole('navigation', { name: 'Навігація кабінету спеціаліста' })
    expect(within(sidebar).getByRole('link', { name: 'Чати' })).toHaveClass('is-active')
  })

  it('highlights the specialist practice board sidebar item on board route', async () => {
    await renderWithProviders({
      initialPath: '/cabinet/practice-board',
      roles: ['SPECIALIST'],
    })

    const sidebar = screen.getByRole('navigation', { name: 'Навігація кабінету спеціаліста' })
    expect(within(sidebar).getByRole('link', { name: 'Задачі' })).toHaveClass('is-active')
    expect(within(sidebar).getByRole('link', { name: 'Сесії' })).not.toHaveClass('is-active')
  })

  it('highlights the specialist author journal sidebar item on journal route', async () => {
    await renderWithProviders({
      initialPath: '/cabinet/journal',
      roles: ['SPECIALIST'],
    })

    const sidebar = screen.getByRole('navigation', { name: 'Навігація кабінету спеціаліста' })
    expect(within(sidebar).getByRole('link', { name: 'Власний блог' })).toHaveClass('is-active')
  })

  it('does not show specialist sidebar for client users', async () => {
    await renderWithProviders({
      initialPath: '/client',
      roles: ['CLIENT'],
    })

    expect(screen.queryByRole('navigation', { name: 'Навігація кабінету спеціаліста' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Розділи кабінету' })).not.toBeInTheDocument()
  })

  it('does not show specialist sidebar for pure ADMIN users', async () => {
    await renderWithProviders({
      initialPath: '/admin/inbox',
      roles: ['ADMIN'],
    })

    expect(screen.queryByRole('navigation', { name: 'Навігація кабінету спеціаліста' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Розділи кабінету' })).not.toBeInTheDocument()
  })

  it('opens a specialist mobile drawer with cabinet links', async () => {
    await renderWithProviders({
      initialPath: '/cabinet',
      roles: ['SPECIALIST'],
    })

    await fireEvent.click(screen.getByRole('button', { name: 'Розділи кабінету' }))

    const drawer = await screen.findByRole('dialog', { name: 'Розділи кабінету спеціаліста' })
    expect(within(drawer).getByRole('link', { name: 'Головна' })).toHaveAttribute('href', '/cabinet')
    expect(within(drawer).getByRole('link', { name: 'Профіль' })).toHaveAttribute('href', '/cabinet/profile')
    expect(within(drawer).getByRole('link', { name: 'Розклад' })).toHaveAttribute('href', '/cabinet/slots')
    expect(within(drawer).getByRole('link', { name: 'Сесії' })).toHaveAttribute('href', '/cabinet/sessions')
    expect(within(drawer).getByRole('link', { name: 'Задачі' })).toHaveAttribute(
      'href',
      '/cabinet/practice-board'
    )
    expect(within(drawer).getByRole('link', { name: 'Клієнти' })).toHaveAttribute('href', '/cabinet/clients')
    expect(within(drawer).getByRole('link', { name: 'Відгуки' })).toHaveAttribute('href', '/cabinet/reviews')
    expect(within(drawer).queryByRole('link', { name: 'Сесії без реєстрації' })).not.toBeInTheDocument()
    expect(within(drawer).getByRole('link', { name: 'Чати' })).toHaveAttribute('href', '/cabinet/chat')
    expect(within(drawer).getByRole('link', { name: 'Власний блог' })).toHaveAttribute(
      'href',
      '/cabinet/journal'
    )
    expect(within(drawer).getByRole('link', { name: 'Аналітика' })).toHaveAttribute('href', '/cabinet/analytics')
    expect(within(drawer).getByRole('link', { name: 'Тарифи і доступ' })).toHaveAttribute('href', '/cabinet/billing')
    expect(within(drawer).getByRole('link', { name: 'Налаштування' })).toHaveAttribute('href', '/cabinet/settings')
    const drawerLinkLabels = within(drawer)
      .getAllByRole('link')
      .map((link) => (link.textContent || '').trim())
    expect(drawerLinkLabels.indexOf('Задачі')).toBe(drawerLinkLabels.indexOf('Сесії') + 1)
    expect(drawerLinkLabels.indexOf('Клієнти')).toBe(drawerLinkLabels.indexOf('Задачі') + 1)
  })

  it('keeps existing cabinet routes rendering inside the specialist shell', async () => {
    await renderWithProviders({
      initialPath: '/cabinet/billing',
      roles: ['SPECIALIST'],
    })

    expect(screen.getByText('Cabinet Billing')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Навігація кабінету спеціаліста' })).toBeInTheDocument()
  })

  it('renders restricted-access notification without broken characters', async () => {
    await renderWithProviders({
      initialPath: '/cabinet',
      roles: ['SPECIALIST'],
      meOverrides: {
        access_state: 'RESTRICTED',
        effective_entitlements: {
          plan: 'START',
          active_client_limit: 3,
          pair_enabled: false,
          group_room_enabled: false,
          group_room_meeting_limit: null,
          group_room_broadcast_enabled: false,
          default_technical_cap: 3,
        },
        counts: {
          active_clients: 0,
          prospect_clients: 0,
          upcoming_sessions_count: 0,
        },
      } as any,
    })

    await fireEvent.click(screen.getByRole('button', { name: 'Сповіщення' }))

    expect(await screen.findByText('Обмежений режим доступу')).toBeInTheDocument()
    expect(screen.getByText('Нові дії тимчасово заблоковані.')).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent('䳿')
  })

  it('uses active-client slot payload for over-limit notification copy', async () => {
    await renderWithProviders({
      initialPath: '/cabinet',
      roles: ['SPECIALIST'],
      meOverrides: {
        effective_entitlements: {
          plan: 'PRO',
          active_client_limit: 20,
          active_client_entitlement: {
            used: 20,
            limit: 20,
            base_limit: 20,
            extra_slots: 0,
            extra_slots_limit: 6,
            effective_limit: 20,
            remaining: 0,
            extra_slot_price_uah: 200,
            can_buy_extra_slot: true,
            requires_pro: false,
            upgrade_required_plan: null,
          },
          pair_enabled: true,
          group_room_enabled: true,
          group_room_meeting_limit: 12,
          group_room_broadcast_enabled: false,
          default_technical_cap: 100,
        },
        counts: {
          active_clients: 21,
          prospect_clients: 0,
          upcoming_sessions_count: 0,
        },
      } as any,
    })

    await fireEvent.click(screen.getByRole('button', { name: 'Сповіщення' }))

    expect(await screen.findByText('Досягнуто ліміт активних клієнтів')).toBeInTheDocument()
    expect(screen.getByText('Можна розширити ліміт: +1 активний клієнт — 200 грн/міс.')).toBeInTheDocument()
  })

  it('shows only admin header navigation for pure ADMIN', async () => {
    await renderWithProviders({
      initialPath: '/admin/inbox',
      roles: ['ADMIN'],
    })

    const nav = document.querySelector('header.topbar .nav') as HTMLElement
    expect(nav).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Черга роботи' })).toHaveAttribute('href', '/admin/work-queue')
    expect(within(nav).getByRole('link', { name: 'Адмін-запити' })).toHaveAttribute('href', '/admin/inbox')
    expect(within(nav).getByRole('link', { name: 'Спеціалісти' })).toHaveAttribute('href', '/admin/specialists')
    expect(nav.querySelector('a[href="/specialists"]')).not.toBeInTheDocument()
    expect(nav.querySelector('a[href="/public"]')).not.toBeInTheDocument()
    expect(nav.querySelector('a[href="/client/chat"]')).not.toBeInTheDocument()
    expect(nav.querySelector('a[href="/cabinet/chat"]')).not.toBeInTheDocument()
    expect(nav.querySelector('.nav__settings')).not.toBeInTheDocument()
    expect(nav.querySelector('button.btn.btn--ghost.nav__desktop-only')).toBeInTheDocument()
  })

  it('shows additional client navigation for hybrid ADMIN + CLIENT', async () => {
    await renderWithProviders({
      initialPath: '/client',
      roles: ['ADMIN', 'CLIENT'],
    })

    const nav = document.querySelector('header.topbar .nav') as HTMLElement
    expect(within(nav).getByRole('link', { name: 'Черга роботи' })).toHaveAttribute('href', '/admin/work-queue')
    expect(within(nav).getByRole('link', { name: 'Адмін-запити' })).toHaveAttribute('href', '/admin/inbox')
    expect(nav.querySelector('a[href="/specialists"]')).toBeInTheDocument()
    expect(nav.querySelector('a[href="/client/materials"]')).toBeInTheDocument()
    expect(nav.querySelector('a[href="/client/chat"]')).toBeInTheDocument()
  })

  it('shows additional specialist navigation for hybrid ADMIN + SPECIALIST', async () => {
    await renderWithProviders({
      initialPath: '/cabinet',
      roles: ['ADMIN', 'SPECIALIST'],
    })

    const nav = document.querySelector('header.topbar .nav') as HTMLElement
    expect(within(nav).getByRole('link', { name: 'Черга роботи' })).toHaveAttribute('href', '/admin/work-queue')
    expect(within(nav).getByRole('link', { name: 'Адмін-запити' })).toHaveAttribute('href', '/admin/inbox')
    expect(nav.querySelector('a[href="/public"]')).toBeInTheDocument()
    expect(nav.querySelector('a[href="/cabinet/chat"]')).toBeInTheDocument()
    expect(nav.querySelector('.nav__settings')).toBeInTheDocument()
  })

  it('does not show admin work queue navigation for non-admin users', async () => {
    await renderWithProviders({
      initialPath: '/cabinet',
      roles: ['SPECIALIST'],
    })

    const nav = document.querySelector('header.topbar .nav') as HTMLElement
    expect(nav).toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: 'Черга роботи' })).not.toBeInTheDocument()
    expect(nav.querySelector('a[href="/admin/work-queue"]')).not.toBeInTheDocument()
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

  it('renders public guest request notifications without a selected slot and routes to external sessions', async () => {
    const { router } = await renderWithProviders({
      initialPath: '/cabinet',
      roles: ['SPECIALIST'],
      notifications: [
        buildNotification({
          id: 'public_guest_request:501',
          kind: 'public_guest_request',
          source_kind: 'public_guest_request',
          source_id: 501,
          code: 'PUBLIC_GUEST_REQUEST_SLOTLESS_CREATED',
          session_id: null,
          title: 'Новий запит без реєстрації',
          body: 'Клієнт залишив запит без вибору часу. Узгодьте час і створіть сесію або закрийте запит.',
          target_url: '/cabinet/external-sessions',
          slot_start_at: null,
          scheduled_for: null,
        }),
      ],
    })

    const notificationsButton = document.querySelector('.nav__notifications .icon-btn') as HTMLButtonElement | null
    expect(notificationsButton).not.toBeNull()
    await fireEvent.click(notificationsButton as HTMLButtonElement)

    expect(await screen.findByText('Новий запит без реєстрації')).toBeInTheDocument()
    expect(
      screen.getByText('Клієнт залишив запит без вибору часу. Узгодьте час і створіть сесію або закрийте запит.')
    ).toBeInTheDocument()

    const panelText = document.querySelector('.notif-panel')?.textContent || ''
    expect(panelText).not.toContain('Нагадування про сесію')
    expect(panelText).not.toContain('Перевірте деталі сесії')

    const notificationLink = screen.getByText('Новий запит без реєстрації').closest('a')
    expect(notificationLink).not.toBeNull()
    expect(notificationLink).toHaveAttribute('href', '/cabinet/external-sessions')

    await fireEvent.click(notificationLink as HTMLAnchorElement)

    await waitFor(() => {
      expect(mockedMarkNotificationRead).toHaveBeenCalledWith({
        source_kind: 'public_guest_request',
        source_id: 501,
      })
      expect(router.currentRoute.value.fullPath).toBe('/cabinet/external-sessions')
    })
  })

  it('renders payment-proof request notification for client and routes to session detail after refresh', async () => {
    const { router } = await renderWithProviders({
      initialPath: '/client',
      roles: ['CLIENT'],
      notifications: [
        buildNotification({
          id: 'payment_proof_event:91',
          kind: 'payment_proof_event',
          source_kind: 'payment_proof_event',
          source_id: 91,
          code: 'PAYMENT_PROOF_REQUESTED',
          session_id: 55,
          client_id: 1,
          client_name: 'testuser',
          client_email: 'test@example.com',
          specialist_id: 14,
          specialist_name: 'Олена',
          counterparty_id: 14,
          counterparty_name: 'Олена',
          slot_start_at: null,
          created_at: '2026-03-12T10:00:00Z',
          scheduled_for: '2026-03-12T19:00:00Z',
          delivered_at: null,
          read_at: null,
        }),
      ],
    })

    await waitFor(() => {
      expect(mockedFetchNotifications).toHaveBeenCalled()
    })
    const refreshCallsBeforeOpen = mockedFetchNotifications.mock.calls.length

    const notificationsButton = document.querySelector('.nav__notifications .icon-btn') as HTMLButtonElement | null
    expect(notificationsButton).not.toBeNull()
    await fireEvent.click(notificationsButton as HTMLButtonElement)

    await waitFor(() => {
      expect(mockedFetchNotifications.mock.calls.length).toBeGreaterThan(refreshCallsBeforeOpen)
    })

    await waitFor(() => {
      expect(document.querySelector('.notif-panel a[href="/client/sessions/55"]')).not.toBeNull()
    })
    const notificationLink = document.querySelector('.notif-panel a[href="/client/sessions/55"]') as HTMLAnchorElement | null
    expect(notificationLink).not.toBeNull()
    expect(notificationLink).toHaveAttribute('href', '/client/sessions/55')
    expect(notificationLink?.textContent || '').toContain('\u041E\u043F\u043B\u0430\u0442\u0430:')
    expect(notificationLink?.textContent || '').toContain('\u0421\u0435\u0441\u0456\u044F:')
    expect(notificationLink?.textContent || '').not.toContain('Invalid Date')
    expect(notificationLink?.textContent || '').toContain(
      '\u043F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043D\u043D\u044F \u043E\u043F\u043B\u0430\u0442\u0438'
    )

    await fireEvent.click(notificationLink as HTMLAnchorElement)

    await waitFor(() => {
      expect(mockedMarkNotificationRead).toHaveBeenCalledWith({
        source_kind: 'payment_proof_event',
        source_id: 91,
      })
      expect(router.currentRoute.value.fullPath).toBe('/client/sessions/55')
    })
  })

  it('routes meeting-link request notifications via target context with meeting-link focus', async () => {
    const { router } = await renderWithProviders({
      initialPath: '/cabinet',
      roles: ['SPECIALIST'],
      notifications: [
        buildNotification({
          id: 'session_event:402',
          source_id: 402,
          code: 'SESSION_MEETING_LINK_REQUESTED',
          session_id: 402,
          target_type: 'session_detail',
          target_id: 402,
          focus: 'meeting_link',
          client_name: 'Ірина',
        }),
      ],
    })

    const notificationsButton = document.querySelector('.nav__notifications .icon-btn') as HTMLButtonElement | null
    expect(notificationsButton).not.toBeNull()
    await fireEvent.click(notificationsButton as HTMLButtonElement)

    const notificationLink = (await screen.findByText('Клієнт попросив додати посилання на зустріч.')).closest('a')
    expect(notificationLink).not.toBeNull()
    expect(notificationLink).toHaveAttribute('href', '/cabinet/sessions/402?focus=meeting_link')

    await fireEvent.click(notificationLink as HTMLAnchorElement)

    await waitFor(() => {
      expect(router.currentRoute.value.fullPath).toBe('/cabinet/sessions/402?focus=meeting_link')
    })
  })

  it('renders localized copy for new notification event codes without raw code leakage', async () => {
    await renderWithProviders({
      initialPath: '/client',
      roles: ['CLIENT'],
      notifications: [
        buildNotification({
          id: 'session_event:300',
          source_id: 300,
          code: 'SESSION_MEETING_LINK_UPDATED',
          session_id: 300,
        }),
        buildNotification({
          id: 'payment_proof_event:301',
          kind: 'payment_proof_event',
          source_kind: 'payment_proof_event',
          source_id: 301,
          code: 'PAYMENT_PROOF_SUBMITTED',
          session_id: 301,
        }),
        buildNotification({
          id: 'payment_proof_event:302',
          kind: 'payment_proof_event',
          source_kind: 'payment_proof_event',
          source_id: 302,
          code: 'PAYMENT_CONFIRMED',
          session_id: 302,
        }),
        buildNotification({
          id: 'payment_proof_event:303',
          kind: 'payment_proof_event',
          source_kind: 'payment_proof_event',
          source_id: 303,
          code: 'PAYMENT_CLARIFICATION_REQUESTED',
          session_id: 303,
        }),
      ],
    })

    const notificationsButton = document.querySelector('.nav__notifications .icon-btn') as HTMLButtonElement | null
    expect(notificationsButton).not.toBeNull()
    await fireEvent.click(notificationsButton as HTMLButtonElement)

    expect(await screen.findByText('Посилання на онлайн-зустріч оновлено.')).toBeInTheDocument()
    expect(screen.getByText('Підтвердження оплати надіслано.')).toBeInTheDocument()
    expect(screen.getByText('Вашу оплату підтверджено.')).toBeInTheDocument()
    expect(screen.getByText('Потрібне уточнення щодо оплати.')).toBeInTheDocument()

    const panelText = (document.querySelector('.notif-panel')?.textContent || '').toUpperCase()
    expect(panelText).not.toContain('SESSION_MEETING_LINK_UPDATED')
    expect(panelText).not.toContain('PAYMENT_PROOF_SUBMITTED')
    expect(panelText).not.toContain('PAYMENT_CONFIRMED')
    expect(panelText).not.toContain('PAYMENT_CLARIFICATION_REQUESTED')
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
      expect(router.currentRoute.value.fullPath).toBe('/s/olena#inquiry')
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
