import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, type Component } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.vue'
import { applyUiVersion } from '../lib/uiVersion'
import appRouter from '../router'
import ClientInquiryRedirectView from '../views/ClientInquiryRedirectView.vue'
import {
  apiGet,
  fetchChatUnreadCount,
  fetchInquiryThreads,
  fetchMe,
  fetchNotifications,
  fetchPublicSpecialists,
  markAllNotificationsRead,
  markNotificationRead,
  type InquiryThread,
  type NotificationFeedItem,
} from '../lib/api'
import { useAuthStore } from '../stores/auth'
import { formatUkDateTimeCompact } from '../lib/dateTime'
import { analyticsConsentStorageKey } from '../lib/analyticsConsent'

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
    fetchInquiryThreads: vi.fn(),
    fetchMe: vi.fn(),
    fetchNotifications: vi.fn(),
    fetchPublicSpecialists: vi.fn(),
    markAllNotificationsRead: vi.fn(),
    markNotificationRead: vi.fn(),
  }
})

const mockedApiGet = vi.mocked(apiGet)
const mockedFetchChatUnreadCount = vi.mocked(fetchChatUnreadCount)
const mockedFetchInquiryThreads = vi.mocked(fetchInquiryThreads)
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

function buildNotification(
  overrides: Partial<NotificationFeedItem> & Record<string, unknown>
): NotificationFeedItem {
  return {
    id: 'session_event:1',
    source_kind: 'session_event',
    source_id: 1,
    code: 'RESCHEDULED',
    counterparty_name: 'testclient',
    target_url: '/cabinet/sessions/41',
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
  notificationUnreadCount?: number
  upcomingSessions?: any[]
  workQueue?: Record<string, unknown>
  publicProfileComponent?: Component
}) {
  const routes = [
    { path: '/', component: { template: '<div>Home</div>' }, meta: { publicSurface: 'neutral' } },
    { path: '/for-clients', name: 'for-clients', component: { template: '<div>For Clients</div>' }, meta: { publicSurface: 'neutral' } },
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
    { path: '/specialists', component: { template: '<div>Public Specialists</div>' }, meta: { publicSurface: 'neutral' } },
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
      component: options?.publicProfileComponent ?? { template: '<div>Public Profile</div>' },
      alias: ['/t/:slug', '/specialist/:slug'],
      meta: { publicSurface: 'specialist-owned' },
    },
    {
      path: '/s/:slug/feedback',
      component: { template: '<div>Specialist Feedback</div>' },
      alias: ['/specialist/:slug/feedback'],
      meta: { publicSurface: 'specialist-owned' },
    },
    {
      path: '/s/:slug/journal',
      component: { template: '<div>Specialist Journal</div>' },
      alias: ['/t/:slug/journal', '/specialist/:slug/journal'],
      meta: { publicSurface: 'specialist-owned' },
    },
    {
      path: '/s/:slug/journal/:postSlug',
      component: { template: '<div>Specialist Article</div>' },
      alias: ['/:slug/journal/:postSlug', '/t/:slug/journal/:postSlug', '/specialist/:slug/journal/:postSlug'],
      meta: { publicSurface: 'specialist-owned' },
    },
    {
      path: '/s/:specialist_slug/journal/collections/:collection_slug',
      component: { template: '<div>Specialist Collection</div>' },
      alias: [
        '/:specialist_slug/journal/collections/:collection_slug',
        '/t/:specialist_slug/journal/collections/:collection_slug',
        '/specialist/:specialist_slug/journal/collections/:collection_slug',
      ],
      meta: { publicSurface: 'specialist-owned' },
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
  mockedFetchInquiryThreads.mockResolvedValue([])
  mockedFetchMe.mockResolvedValue(mePayload as Awaited<ReturnType<typeof fetchMe>>)
  mockedFetchNotifications.mockImplementation(async () => ({
    count: notificationsState.current.length,
    unread_count:
      options?.notificationUnreadCount ?? notificationsState.current.filter((item) => !item.read_at).length,
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
    unread_count: Math.max(
      0,
      (options?.notificationUnreadCount ?? notificationsState.current.filter((item) => !item.read_at).length) - 1,
    ),
  }))
  mockedMarkAllNotificationsRead.mockResolvedValue({
    ok: true,
    marked_count: notificationsState.current.filter((item) => !item.read_at).length,
    unread_count: 0,
  })
  mockedApiGet.mockImplementation(async (url, config) => {
    if (url === '/booking/sessions/' && (config as { params?: { upcoming?: boolean } } | undefined)?.params?.upcoming) {
      return options?.upcomingSessions ?? []
    }
    if (url === '/cabinet/work-queue/') {
      return options?.workQueue ?? {
        pending_guest_requests_count: 0,
        pending_slotless_guest_requests_count: 0,
      }
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
    applyUiVersion('v1')
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    mockToast.show.mockReset()
    mockToast.success.mockReset()
    mockToast.error.mockReset()
    mockToast.warning.mockReset()
    mockToast.info.mockReset()
  })

  it('keeps v1 guest markup free of the new public header', async () => {
    await renderWithProviders()
    expect(document.querySelector('header.pc2-header')).toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Для кого Pro Consult' })).not.toBeInTheDocument()
    expect(document.querySelector('.brand__logo--full')).not.toHaveClass('pc2-header__logo')
  })

  it('adds accessible v2 audience links while preserving guest destinations and CTA wording', async () => {
    applyUiVersion('v2')
    await renderWithProviders()
    const header = document.querySelector('header.pc2-header') as HTMLElement
    const audience = within(header).getByRole('navigation', { name: 'Для кого Pro Consult' })
    expect(within(audience).getByRole('link', { name: 'Для спеціалістів' })).toHaveAttribute('href', '/')
    expect(within(audience).getByRole('link', { name: 'Для клієнтів' })).toHaveAttribute('href', '/for-clients')
    expect(within(header).getByRole('link', { name: 'Вхід' })).toHaveAttribute('href', '/login')
    expect(within(header).getByRole('link', { name: 'Тарифи' })).toHaveAttribute('href', '/pricing')
    expect(within(header).getByRole('link', { name: 'Знайти спеціаліста' })).toHaveAttribute('href', '/specialists')
    expect(within(header).getByRole('link', { name: /Спробувати безкоштовно/ })).toHaveClass('pc2-btn', 'pc2-btn--primary')
    expect(header.querySelector('.pc2-header__logo')?.getAttribute('src')).toContain('proconsult-fennec-header.svg')
    expect(within(header).queryByRole('button', { name: 'Меню' })).not.toBeInTheDocument()
  })

  it('uses the approved v2 lockup in public chrome and retains legal/privacy destinations', async () => {
    applyUiVersion('v2')
    await renderWithProviders()
    const footer = document.querySelector('footer.pc2-footer') as HTMLElement
    expect(footer).toBeInTheDocument()
    expect(within(footer).getByRole('img', { name: 'Pro Consult' }).getAttribute('src')).toContain('proconsult-fennec-lockup.svg')
    for (const href of ['/terms', '/privacy', '/disclaimer', '/support-and-data-requests', '/faq', '/pricing', '/signup', '/login']) {
      expect(footer.querySelector(`a[href="${href}"]`)).toBeInTheDocument()
    }
    expect(document.querySelector('a[href="/for-clients"]')).toBeInTheDocument()
    expect(document.querySelector('header img[src="/brand/proconsult-logo-dark.png"]')).toBeNull()
    await fireEvent.click(within(footer).getByRole('button', { name: 'Налаштування конфіденційності' }))
    expect(screen.getByRole('heading', { name: 'Файли cookie та аналітика' })).toBeInTheDocument()
    applyUiVersion('v1')
    await waitFor(() => expect(document.querySelector('footer.pc2-footer')).toBeNull())
    expect(document.querySelector('header .brand__logo--full')).toHaveAttribute('src', '/brand/proconsult-logo-dark.png')
    expect(document.querySelector('footer .footer__logo--light')).toHaveAttribute('src', '/brand/proconsult-logo-light.png')
  })

  it('provides public navigation disclosure with Escape focus return and closes after navigation', async () => {
    applyUiVersion('v2')
    const { router } = await renderWithProviders()
    const button = screen.getByRole('button', { name: 'Меню сайту' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    await fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    const nav = screen.getByRole('navigation', { name: 'Мобільна навігація сайту' })
    const pricing = within(nav).getByRole('link', { name: 'Тарифи' })
    pricing.focus()
    await fireEvent.keyDown(pricing, { key: 'Escape' })
    expect(button).toHaveFocus()
    expect(screen.queryByRole('navigation', { name: 'Мобільна навігація сайту' })).toBeNull()
    await fireEvent.click(button)
    await fireEvent.click(within(screen.getByRole('navigation', { name: 'Мобільна навігація сайту' })).getByRole('link', { name: 'Тарифи' }))
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/pricing'))
    expect(button).toHaveAttribute('aria-expanded', 'false')
    await fireEvent.click(button)
    await fireEvent.click(document.body)
    expect(button).toHaveAttribute('aria-expanded', 'false')
    await fireEvent.click(button)
    await router.push('/?ui=v2#client-entry-title')
    expect(button).toHaveAttribute('aria-expanded', 'false')
    await fireEvent.click(button)
    applyUiVersion('v1')
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Меню сайту' })).toBeNull())
    applyUiVersion('v2')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Меню сайту' })).toHaveAttribute('aria-expanded', 'false'))
  })

  describe('Public-Mobile P2 header and menu (< 768px)', () => {
    function stubViewport(mobile: boolean) {
      const listeners = new Set<() => void>()
      const media = {
        matches: mobile,
        addEventListener: vi.fn((_: string, fn: () => void) => listeners.add(fn)),
        removeEventListener: vi.fn((_: string, fn: () => void) => listeners.delete(fn)),
      }
      vi.stubGlobal('matchMedia', vi.fn(() => media))
      return { change(next: boolean) { media.matches = next; listeners.forEach((fn) => fn()) } }
    }
    afterEach(() => {
      vi.unstubAllGlobals()
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    })

    it('opens the full-screen menu from the burger and closes it with Escape, backdrop and navigation', async () => {
      stubViewport(true)
      applyUiVersion('v2')
      const { router } = await renderWithProviders()
      const header = document.querySelector('header.pc2-header') as HTMLElement
      expect(within(header).getByRole('link', { name: 'Створити' })).toHaveAttribute('href', '/signup')
      const button = screen.getByRole('button', { name: 'Меню сайту' })
      expect(button).toHaveAttribute('aria-controls', 'public-mobile-menu-v2')
      expect(button).toHaveAttribute('aria-haspopup', 'dialog')
      await fireEvent.click(button)
      const dialog = await screen.findByRole('dialog', { name: 'Меню сайту' })
      expect(button).toHaveAttribute('aria-expanded', 'true')
      expect(screen.queryByRole('navigation', { name: 'Мобільна навігація сайту' })).toBeNull()
      expect(document.body.style.overflow).toBe('hidden')
      await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Закрити меню' })).toHaveFocus())
      expect(within(dialog).getByRole('link', { name: 'Створити простір' })).toHaveAttribute('href', '/signup')
      await fireEvent.keyDown(document, { key: 'Escape' })
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      expect(button).toHaveAttribute('aria-expanded', 'false')
      expect(button).toHaveFocus()
      expect(document.body.style.overflow).toBe('')
      await fireEvent.click(button)
      await fireEvent.click(document.querySelector('.pc2-mobile-menu__backdrop')!)
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      await fireEvent.click(button)
      await fireEvent.click(within(await screen.findByRole('dialog')).getByRole('link', { name: /Часті питання/ }))
      await waitFor(() => expect(router.currentRoute.value.path).toBe('/faq'))
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      expect(document.body.style.overflow).toBe('')
    })

    it('matches the header action and menu audience to the client context', async () => {
      stubViewport(true)
      applyUiVersion('v2')
      const { router } = await renderWithProviders({ initialPath: '/for-clients' })
      const header = document.querySelector('header.pc2-header') as HTMLElement
      expect(within(header).getByRole('link', { name: 'Увійти' })).toHaveAttribute('href', '/login')
      expect(within(header).queryByRole('link', { name: 'Створити' })).toBeNull()
      await fireEvent.click(screen.getByRole('button', { name: 'Меню сайту' }))
      const dialog = await screen.findByRole('dialog')
      expect(within(dialog).getByRole('link', { name: 'Для клієнтів' })).toHaveAttribute('aria-current', 'page')
      expect(within(dialog).getByRole('link', { name: 'Створити кабінет клієнта' })).toHaveAttribute('href', '/signup-client')
      await fireEvent.keyDown(document, { key: 'Escape' })
      await router.push('/login')
      await waitFor(() => expect(within(header).queryByRole('link', { name: 'Увійти' })).toBeNull())
      expect(within(header).getByRole('link', { name: 'Створити' })).toHaveAttribute('href', '/signup')
      await router.push('/specialists')
      await waitFor(() => expect(within(header).getByRole('link', { name: 'Увійти' })).toBeInTheDocument())
    })

    it('keeps specialist-owned pages free of product promotion on mobile', async () => {
      stubViewport(true)
      applyUiVersion('v2')
      await renderWithProviders({ initialPath: '/s/olena' })
      const header = document.querySelector('header.pc2-header') as HTMLElement
      expect(within(header).getByRole('link', { name: 'Увійти' })).toHaveAttribute('href', '/login')
      await fireEvent.click(screen.getByRole('button', { name: 'Меню сайту' }))
      expect(screen.queryByRole('dialog')).toBeNull()
      const nav = screen.getByRole('navigation', { name: 'Мобільна навігація сайту' })
      expect(within(nav).queryByRole('link', { name: 'Тарифи' })).toBeNull()
      expect(within(nav).getByRole('link', { name: 'Вхід' })).toHaveAttribute('href', '/login')
    })

    it('falls back to the existing inline menu at 768px and closes the dialog when the viewport widens', async () => {
      const viewport = stubViewport(true)
      applyUiVersion('v2')
      await renderWithProviders()
      const button = screen.getByRole('button', { name: 'Меню сайту' })
      await fireEvent.click(button)
      await screen.findByRole('dialog')
      viewport.change(false)
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      expect(document.body.style.overflow).toBe('')
      expect(button).toHaveAttribute('aria-controls', 'public-navigation-v2')
      await fireEvent.click(button)
      expect(screen.getByRole('navigation', { name: 'Мобільна навігація сайту' })).toBeInTheDocument()
    })

    it('leaves v1 guest chrome without the mobile action or dialog', async () => {
      stubViewport(true)
      await renderWithProviders()
      expect(document.querySelector('.pc2-header__mobile-action')).toBeNull()
      expect(screen.queryByRole('button', { name: 'Меню сайту' })).toBeNull()
      expect(document.querySelector('.pc2-mobile-menu')).toBeNull()
    })
  })

  it('reactively switches header versions and tracks the client landing and legacy hash', async () => {
    const { router } = await renderWithProviders()
    applyUiVersion('v2')
    await waitFor(() => expect(document.querySelector('header.pc2-header')).toBeInTheDocument())
    const audience = screen.getByRole('navigation', { name: 'Для кого Pro Consult' })
    await router.push('/#client-entry-title')
    expect(within(audience).getByRole('link', { name: 'Для клієнтів' })).toHaveAttribute('aria-current', 'location')
    expect(within(audience).getByRole('link', { name: 'Для спеціалістів' })).toHaveAttribute('aria-current', 'false')
    await router.push('/for-clients')
    expect(document.querySelector('main')).toHaveClass('main--for-clients-v2')
    expect(within(audience).getByRole('link', { name: 'Для клієнтів' })).toHaveAttribute('aria-current', 'location')
    expect(document.querySelector('a.nav__guest-cta')).toHaveAttribute('href', '/signup-client?ui=v2')
    expect(document.querySelector('.nav__guest-cta-full')).toHaveTextContent('Створити кабінет')
    await fireEvent.click(screen.getByRole('button', { name: 'Меню сайту' }))
    const mobile = screen.getByRole('navigation', { name: 'Мобільна навігація сайту' })
    expect(within(mobile).getByRole('link', { name: 'Для клієнтів' })).toHaveAttribute('aria-current', 'page')
    applyUiVersion('v1')
    await waitFor(() => expect(document.querySelector('header.pc2-header')).toBeNull())
    expect(document.querySelector('main')).not.toHaveClass('main--for-clients-v2')
    expect(screen.queryByRole('navigation', { name: 'Для кого Pro Consult' })).not.toBeInTheDocument()
  })

  it.each([['CLIENT'], ['SPECIALIST'], ['ADMIN'], ['CLIENT', 'SPECIALIST'], ['CLIENT', 'SPECIALIST', 'ADMIN']])(
    'retains authenticated header controls with v2 for roles %j', async (...roles) => {
      applyUiVersion('v2')
      await renderWithProviders({ roles })
      const header = document.querySelector('header.topbar') as HTMLElement
      expect(header).not.toHaveClass('pc2-header')
      expect(header.querySelector('.pc2-brand-lockup')).toBeNull()
      expect(document.querySelector('footer.pc2-footer')).toBeNull()
      expect(within(header).getByRole('button', { name: 'Сповіщення' })).toBeInTheDocument()
      await fireEvent.click(within(header).getByRole('button', { name: 'Меню' }))
      expect(header.querySelector('.mobile-menu')).toBeInTheDocument()
      await fireEvent.keyDown(document, { key: 'Escape' })
      expect(header.querySelector('.mobile-menu')).toBeNull()
    }
  )

  it('retains v2 specialist-owned promotion restrictions and minimal-shell boundaries', async () => {
    applyUiVersion('v2')
    const { router } = await renderWithProviders({ initialPath: '/s/olena' })
    const header = document.querySelector('header.pc2-header') as HTMLElement
    expect(within(header).getByRole('link', { name: 'Вхід' })).toBeInTheDocument()
    expect(header.querySelector('.pc2-header__audience')).toBeNull()
    expect(header.querySelector('.nav__guest-cta')).toBeNull()
    expect(within(header).queryByRole('link', { name: 'Знайти спеціаліста' })).not.toBeInTheDocument()
    await router.push('/guest/external-session/test-token')
    expect(document.querySelector('header')).toBeNull()
  })

  it('removes catalog and product promotion from a guest specialist profile header', async () => {
    await renderWithProviders({ initialPath: '/s/olena' })

    expect(screen.queryByRole('link', { name: 'Знайти спеціаліста' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Пошук профілю' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Тарифи' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Для спеціалістів' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Спробувати безкоштовно' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Вхід' })).toHaveAttribute('href', '/login')
  })

  it('shows the catalog link to guests on neutral pages without desktop-only hiding', async () => {
    await renderWithProviders()

    const catalogLink = screen.getByRole('link', { name: 'Знайти спеціаліста' })
    expect(catalogLink).toHaveAttribute('href', '/specialists')
    expect(catalogLink).toHaveClass('nav__guest-catalog')
    expect(catalogLink).not.toHaveClass('nav__desktop-only')
  })

  it.each([
    '/s/olena/journal',
    '/s/olena/journal/article',
    '/s/olena/journal/collections/featured',
    '/s/olena/feedback',
    '/t/olena',
  ])('keeps catalog and product promotion off specialist-owned surface %s', async (initialPath) => {
    await renderWithProviders({ initialPath })

    expect(screen.queryByRole('link', { name: 'Знайти спеціаліста' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Тарифи' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Спробувати безкоштовно' })).not.toBeInTheDocument()
  })

  it('keeps catalog and specialist signup off an authenticated client specialist profile mobile menu', async () => {
    await renderWithProviders({ initialPath: '/s/olena', roles: ['CLIENT'] })

    expect(screen.queryByRole('link', { name: 'Пошук профілю' })).not.toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Меню' }))

    const mobileMenu = document.querySelector('.mobile-menu') as HTMLElement
    expect(mobileMenu).toBeInTheDocument()
    expect(within(mobileMenu).queryByRole('link', { name: 'Стати спеціалістом' })).not.toBeInTheDocument()
  })

  it('keeps specialist signup available in the authenticated client mobile menu on neutral pages', async () => {
    await renderWithProviders({ roles: ['CLIENT'] })
    await fireEvent.click(screen.getByRole('button', { name: 'Меню' }))

    const mobileMenu = document.querySelector('.mobile-menu') as HTMLElement
    expect(mobileMenu).toBeInTheDocument()
    expect(within(mobileMenu).getByRole('link', { name: 'Стати спеціалістом' })).toHaveAttribute('href', '/signup')
  })

  it('keeps analytics off by default and lets a visitor change the saved choice from the footer', async () => {
    await renderWithProviders()

    expect(screen.getByRole('region', { name: 'Файли cookie та аналітика' })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Лише необхідні' }))

    expect(screen.queryByRole('region', { name: 'Файли cookie та аналітика' })).not.toBeInTheDocument()
    expect(window.localStorage.getItem(analyticsConsentStorageKey)).toContain('denied')

    await fireEvent.click(screen.getByRole('button', { name: 'Налаштування конфіденційності' }))
    expect(screen.getByText('Поточний вибір аналітики: вимкнено.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Дозволити аналітику' })).toBeEnabled()
  })

  it('keeps a public profile mounted when only its query changes', async () => {
    const mounted = vi.fn()
    const PublicProfileProbe = defineComponent({
      setup() {
        mounted()
      },
      template: '<div>Public Profile Probe</div>',
    })
    const { router } = await renderWithProviders({
      initialPath: '/s/olena?intent=request',
      publicProfileComponent: PublicProfileProbe,
    })

    expect(mounted).toHaveBeenCalledTimes(1)

    await router.replace({ path: '/s/olena', query: { source: 'recovery' } })

    await waitFor(() => {
      expect(router.currentRoute.value.fullPath).toBe('/s/olena?source=recovery')
    })
    expect(mounted).toHaveBeenCalledTimes(1)
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
    const productColumn = within(footer as HTMLElement)
      .getByRole('heading', { name: 'Продукт' })
      .closest('section') as HTMLElement
    const productFooterLinks = [
      ['Можливості', '/#features'],
      ['Без комісій', '/pricing'],
    ] as const
    for (const [label, href] of productFooterLinks) {
      expect(within(productColumn).getByRole('link', { name: label })).toHaveAttribute('href', href)
    }
    const descriptiveProductItems = [
      'Публічний профіль',
      'Запити без реєстрації',
      'Сесії та календар',
      'Власний блог',
      'Задачі',
    ] as const
    for (const label of descriptiveProductItems) {
      expect(within(productColumn).getByText(label)).toBeInTheDocument()
      expect(within(productColumn).queryByRole('link', { name: label })).not.toBeInTheDocument()
    }
    expect(within(productColumn).queryByRole('link', { name: 'Знайти профіль спеціаліста' })).not.toBeInTheDocument()
    expect(within(productColumn).queryByText('Знайти профіль спеціаліста')).not.toBeInTheDocument()
    expect(within(footer as HTMLElement).getByRole('link', { name: 'Тарифи' })).toHaveAttribute('href', '/pricing')
    expect(within(footer as HTMLElement).getByRole('link', { name: 'Питання та відповіді' })).toHaveAttribute(
      'href',
      '/faq'
    )
    expect(within(footer as HTMLElement).getByRole('link', { name: 'Підтримка та запити щодо даних' })).toHaveAttribute(
      'href',
      '/support-and-data-requests'
    )
    expect(footer?.textContent || '').not.toContain('вашої справи')
  })

  it('renders only the neutral legal footer on specialist-owned pages', async () => {
    await renderWithProviders({ initialPath: '/s/olena' })

    const footer = document.querySelector('footer.footer--specialist-owned') as HTMLElement | null
    expect(footer).toBeInTheDocument()
    expect(within(footer as HTMLElement).getByText('Pro Consult')).toBeInTheDocument()
    expect(within(footer as HTMLElement).getByRole('link', { name: 'Умови користування' })).toHaveAttribute(
      'href',
      '/terms'
    )
    expect(within(footer as HTMLElement).getByRole('link', { name: 'Політика конфіденційності' })).toHaveAttribute(
      'href',
      '/privacy'
    )
    expect(within(footer as HTMLElement).getByRole('link', { name: 'Підтримка' })).toHaveAttribute(
      'href',
      '/support-and-data-requests'
    )
    expect(within(footer as HTMLElement).queryByRole('link', { name: 'Тарифи' })).not.toBeInTheDocument()
    expect(within(footer as HTMLElement).queryByRole('link', { name: 'Створити простір' })).not.toBeInTheDocument()
    expect(within(footer as HTMLElement).queryByRole('link', { name: 'Знайти спеціаліста' })).not.toBeInTheDocument()
    expect(footer?.querySelector('a[href="/specialists"]')).not.toBeInTheDocument()
    expect(footer?.querySelector('a[href="/signup"]')).not.toBeInTheDocument()
    expect(footer?.querySelector('a[href="/pricing"]')).not.toBeInTheDocument()
    expect(within(footer as HTMLElement).queryByText('Продукт')).not.toBeInTheDocument()
  })

  it('renders the staging deploy marker in the specialist-owned footer without marketing links', async () => {
    vi.stubEnv('VITE_DEPLOY_ENV', 'staging')
    try {
      await renderWithProviders({ initialPath: '/s/olena' })

      const footer = document.querySelector('footer.footer--specialist-owned') as HTMLElement | null
      expect(footer).toBeInTheDocument()
      expect(within(footer as HTMLElement).getByLabelText('staging-deploy-marker')).toBeInTheDocument()
      expect(footer?.querySelector('a[href="/specialists"]')).not.toBeInTheDocument()
      expect(footer?.querySelector('a[href="/signup"]')).not.toBeInTheDocument()
      expect(footer?.querySelector('a[href="/pricing"]')).not.toBeInTheDocument()
    } finally {
      vi.unstubAllEnvs()
    }
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
    expect(within(footer as HTMLElement).getByRole('link', { name: 'Питання та відповіді' })).toHaveAttribute(
      'href',
      '/faq'
    )
    expect(within(footer as HTMLElement).getByRole('link', { name: 'Підтримка' })).toHaveAttribute(
      'href',
      '/support-and-data-requests'
    )
    expect(within(footer as HTMLElement).queryByText('Продукт')).not.toBeInTheDocument()
    expect(within(footer as HTMLElement).queryByRole('link', { name: 'Створити простір' })).not.toBeInTheDocument()
  })

  describe('KAN-161 specialist cabinet shell UI v2', () => {
    afterEach(() => { vi.unstubAllGlobals(); document.body.style.overflow = ''; document.documentElement.style.overflow = '' })

    it('replaces the legacy cabinet header and sidebar for a v2 specialist', async () => {
      applyUiVersion('v2')
      await renderWithProviders({ initialPath: '/cabinet/clients', roles: ['SPECIALIST'] })
      const header = document.querySelector('header.topbar') as HTMLElement
      expect(header).toHaveClass('pc2-cabinet-header')
      expect(header.querySelector('.pc2-brand-lockup')?.getAttribute('src')).toContain('proconsult-fennec-header.svg')
      expect(document.querySelector('.shell')).toHaveClass('shell--cabinet-v2')
      expect(document.querySelector('.specialist-shell')).toBeNull()
      const sidebar = document.querySelector('.pc2-cabinet-sidebar') as HTMLElement
      expect(within(sidebar).getByRole('link', { name: 'Клієнти' })).toHaveAttribute('aria-current', 'page')
      expect(within(sidebar).getByRole('link', { name: 'Групові події' })).toHaveAttribute('href', '/cabinet/group-events')
      // Header keeps working account actions.
      expect(within(header).getByRole('link', { name: 'Публічний профіль' })).toHaveAttribute('href', '/public')
      expect(within(header).getByRole('button', { name: 'Вийти' })).toBeInTheDocument()
      expect(within(header).getByRole('button', { name: 'Сповіщення' })).toBeInTheDocument()
    })

    it('opens the «Ще» sheet from the mobile account button and closes it on navigation', async () => {
      vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
      applyUiVersion('v2')
      const { router } = await renderWithProviders({ initialPath: '/cabinet', roles: ['SPECIALIST'] })
      const account = screen.getByRole('button', { name: 'Акаунт та інші розділи кабінету' })
      await fireEvent.click(account)
      const sheet = document.querySelector('.pc2-cabinet-more') as HTMLElement
      expect(sheet).toHaveClass('is-open')
      expect(account).toHaveAttribute('aria-expanded', 'true')
      expect(document.body.style.overflow).toBe('hidden')
      await router.push('/cabinet/sessions')
      await waitFor(() => expect(sheet).not.toHaveClass('is-open'))
      expect(document.body.style.overflow).toBe('')
    })

    it('keeps v1 specialists, v2 clients and public pages on their existing chrome', async () => {
      await renderWithProviders({ initialPath: '/cabinet', roles: ['SPECIALIST'] })
      expect(document.querySelector('.specialist-shell')).not.toBeNull()
      expect(document.querySelector('.pc2-cabinet-shell')).toBeNull()
      expect(document.querySelector('header.topbar')).not.toHaveClass('pc2-cabinet-header')
      document.body.innerHTML = ''
      applyUiVersion('v2')
      await renderWithProviders({ initialPath: '/client', roles: ['CLIENT'] })
      expect(document.querySelector('.pc2-cabinet-shell')).toBeNull()
      expect(document.querySelector('header.topbar')).not.toHaveClass('pc2-cabinet-header')
    })
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
    expect(within(sidebar).getByRole('link', { name: 'Кабінет' })).toHaveAttribute('href', '/cabinet')
    expect(within(sidebar).getByRole('link', { name: 'Профіль' })).toHaveAttribute('href', '/cabinet/profile')
    expect(within(sidebar).getByRole('link', { name: 'Розклад' })).toHaveAttribute('href', '/cabinet/slots')
    expect(within(sidebar).getByRole('link', { name: 'Сесії' })).toHaveAttribute('href', '/cabinet/sessions')
    expect(within(sidebar).getByRole('link', { name: 'Запити' })).toHaveAttribute(
      'href',
      '/cabinet/external-sessions#guest-requests'
    )
    expect(within(sidebar).getByRole('link', { name: 'Задачі' })).toHaveAttribute(
      'href',
      '/cabinet/practice-board'
    )
    expect(within(sidebar).getByRole('link', { name: 'Клієнти' })).toHaveAttribute('href', '/cabinet/clients')
    expect(within(sidebar).getByRole('link', { name: 'Відгуки' })).toHaveAttribute('href', '/cabinet/reviews')
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
    expect(linkLabels.indexOf('Клієнти')).toBe(linkLabels.indexOf('Профіль') + 1)
    expect(linkLabels.indexOf('Розклад')).toBe(linkLabels.indexOf('Клієнти') + 1)
    expect(linkLabels.indexOf('Запити')).toBe(linkLabels.indexOf('Сесії') + 1)
    expect(linkLabels.indexOf('Задачі')).toBe(linkLabels.indexOf('Запити') + 1)
  })

  it('uses all pending guest requests count for the specialist requests sidebar badge', async () => {
    await renderWithProviders({
      initialPath: '/cabinet/external-sessions',
      roles: ['SPECIALIST'],
      notifications: [
        buildNotification({
          id: 'public_guest_request:501',
          kind: 'public_guest_request',
          source_kind: 'public_guest_request',
          source_id: 501,
          code: 'PUBLIC_GUEST_REQUEST_SLOTLESS_CREATED',
          session_id: null,
          title: 'Unread guest request',
          body: 'Unread notification subset.',
          target_url: '/cabinet/external-sessions#guest-requests',
          slot_start_at: null,
          scheduled_for: null,
        }),
      ],
      workQueue: {
        pending_guest_requests_count: 4,
        pending_slotless_guest_requests_count: 2,
      },
    })

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenCalledWith('/cabinet/work-queue/')
    })

    const sidebar = screen.getByRole('navigation', { name: 'Навігація кабінету спеціаліста' })
    const requestsLink = within(sidebar).getByRole('link', { name: 'Запити' })
    expect(requestsLink).toHaveTextContent('4')
    expect(requestsLink).not.toHaveTextContent('2')
    expect(requestsLink).not.toHaveTextContent('1')
  })

  it('shows pending scheduled sessions count on the specialist sessions sidebar badge', async () => {
    await renderWithProviders({
      initialPath: '/cabinet',
      roles: ['SPECIALIST'],
      upcomingSessions: [
        { id: 101, status: 'SCHEDULED', slot_start_at: '2099-03-12T10:00:00Z' },
        { id: 102, status: 'SCHEDULED', slot_start_at: '2099-03-12T11:00:00Z' },
        { id: 103, status: 'CONFIRMED', slot_start_at: '2099-03-12T12:00:00Z' },
        { id: 104, status: 'COMPLETED', slot_start_at: '2099-03-12T13:00:00Z' },
        { id: 105, status: 'CANCELLED', slot_start_at: '2099-03-12T14:00:00Z' },
      ],
      workQueue: {
        pending_guest_requests_count: 3,
        pending_slotless_guest_requests_count: 1,
      },
    })

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenCalledWith('/booking/sessions/', { params: { upcoming: true } })
    })

    const sidebar = screen.getByRole('navigation', { name: 'Навігація кабінету спеціаліста' })
    const sessionsLink = within(sidebar).getByRole('link', { name: 'Сесії' })
    expect(sessionsLink).toHaveAttribute('href', '/cabinet/sessions')
    expect(sessionsLink).toHaveTextContent('2')
    expect(within(sidebar).getByRole('link', { name: 'Запити' })).toHaveTextContent('3')
  })

  it('hides the specialist sessions sidebar badge when there are no scheduled sessions', async () => {
    await renderWithProviders({
      initialPath: '/cabinet',
      roles: ['SPECIALIST'],
      upcomingSessions: [
        { id: 201, status: 'CONFIRMED', slot_start_at: '2099-03-12T12:00:00Z' },
        { id: 202, status: 'COMPLETED', slot_start_at: '2099-03-12T13:00:00Z' },
        { id: 203, status: 'CANCELLED', slot_start_at: '2099-03-12T14:00:00Z' },
      ],
    })

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenCalledWith('/booking/sessions/', { params: { upcoming: true } })
    })

    const sidebar = screen.getByRole('navigation', { name: 'Навігація кабінету спеціаліста' })
    const sessionsLink = within(sidebar).getByRole('link', { name: 'Сесії' })
    expect((sessionsLink.textContent || '').trim()).toBe('Сесії')
  })

  it('does not use unread session notifications for the specialist sessions sidebar badge', async () => {
    await renderWithProviders({
      initialPath: '/cabinet',
      roles: ['SPECIALIST'],
      notifications: [
        buildNotification({
          id: 'session_event:301',
          source_id: 301,
          code: 'SESSION_CREATED',
          session_id: 301,
          title: 'Бронювання: нова сесія',
          body: 'Unread notification should not drive the sidebar badge.',
          target_url: '/cabinet/sessions/301',
        }),
      ],
      upcomingSessions: [],
    })

    const notificationsButton = document.querySelector('.nav__notifications .icon-btn') as HTMLButtonElement | null
    expect(notificationsButton).not.toBeNull()
    await waitFor(() => {
      expect(notificationsButton).toHaveTextContent('1')
    })

    const sidebar = screen.getByRole('navigation', { name: 'Навігація кабінету спеціаліста' })
    const sessionsLink = within(sidebar).getByRole('link', { name: 'Сесії' })
    expect((sessionsLink.textContent || '').trim()).toBe('Сесії')
  })

  it('highlights active specialist sidebar item for nested cabinet routes', async () => {
    await renderWithProviders({
      initialPath: '/cabinet/sessions/42',
      roles: ['SPECIALIST'],
    })

    const sidebar = screen.getByRole('navigation', { name: 'Навігація кабінету спеціаліста' })
    expect(within(sidebar).getByRole('link', { name: 'Сесії' })).toHaveClass('is-active')
    expect(within(sidebar).getByRole('link', { name: 'Кабінет' })).not.toHaveClass('is-active')
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
    expect(within(drawer).getByRole('link', { name: 'Кабінет' })).toHaveAttribute('href', '/cabinet')
    expect(within(drawer).getByRole('link', { name: 'Профіль' })).toHaveAttribute('href', '/cabinet/profile')
    expect(within(drawer).getByRole('link', { name: 'Розклад' })).toHaveAttribute('href', '/cabinet/slots')
    expect(within(drawer).getByRole('link', { name: 'Сесії' })).toHaveAttribute('href', '/cabinet/sessions')
    expect(within(drawer).getByRole('link', { name: 'Запити' })).toHaveAttribute(
      'href',
      '/cabinet/external-sessions#guest-requests'
    )
    expect(within(drawer).getByRole('link', { name: 'Задачі' })).toHaveAttribute(
      'href',
      '/cabinet/practice-board'
    )
    expect(within(drawer).getByRole('link', { name: 'Клієнти' })).toHaveAttribute('href', '/cabinet/clients')
    expect(within(drawer).getByRole('link', { name: 'Відгуки' })).toHaveAttribute('href', '/cabinet/reviews')
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
    expect(drawerLinkLabels.indexOf('Клієнти')).toBe(drawerLinkLabels.indexOf('Профіль') + 1)
    expect(drawerLinkLabels.indexOf('Розклад')).toBe(drawerLinkLabels.indexOf('Клієнти') + 1)
    expect(drawerLinkLabels.indexOf('Запити')).toBe(drawerLinkLabels.indexOf('Сесії') + 1)
    expect(drawerLinkLabels.indexOf('Задачі')).toBe(drawerLinkLabels.indexOf('Запити') + 1)
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

  it.each([
    { role: 'SPECIALIST', full: 'Мій кабінет', compact: 'Кабінет', href: '/cabinet' },
    { role: 'ADMIN', full: 'Черга роботи', compact: 'Черга', href: '/admin/work-queue' },
    { role: 'CLIENT', full: 'Кабінет', compact: 'Кабінет', href: '/client' },
  ])('preserves the full accessible cabinet label for $role with compact mobile copy', async ({ role, full, compact, href }) => {
    await renderWithProviders({ initialPath: '/specialists', roles: [role] })

    const nav = document.querySelector('header.topbar .nav') as HTMLElement
    const action = within(nav).getByRole('link', { name: full })
    expect(action).toHaveAttribute('href', href)
    expect(action).toHaveAttribute('aria-label', full)
    expect(action.querySelector('.nav__primary-label--full')).toHaveTextContent(full)
    expect(action.querySelector('.nav__primary-label--compact')).toHaveTextContent(compact)
    expect(within(nav).getByRole('button', { name: 'Сповіщення' })).toBeInTheDocument()
    expect(within(nav).getByRole('button', { name: 'Меню' })).toBeInTheDocument()
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
          counterparty_name: 'testclient',
          target_url: '/cabinet/sessions/40',
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
          counterparty_name: 'testclient',
          target_url: '/cabinet/sessions/41',
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
          counterparty_name: 'testuser',
          target_url: '/client/sessions/41',
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

  it('renders and routes an unread specialist-created session notification', async () => {
    const startsAt = '2026-07-22T18:30:00Z'
    const { router } = await renderWithProviders({
      initialPath: '/client',
      roles: ['CLIENT'],
      notifications: [
        buildNotification({
          id: 'reminder_delivery:91',
          kind: 'reminder_event',
          source_kind: 'reminder_delivery',
          source_id: 91,
          code: 'SESSION_CREATED_BY_SPECIALIST',
          target_url: '/client/sessions/70',
          slot_start_at: startsAt,
        }),
      ],
    })

    const notificationsButton = screen.getByRole('button', { name: /Сповіщення/i })
    await waitFor(() => {
      expect(notificationsButton).toHaveTextContent('1')
    })
    await fireEvent.click(notificationsButton)

    const title = await screen.findByText('Додано нову сесію')
    expect(
      screen.getByText(
        `Спеціаліст додав нову сесію на ${formatUkDateTimeCompact(startsAt, '')}.`
      )
    ).toBeInTheDocument()
    const notificationLink = title.closest('a')
    expect(notificationLink).toHaveAttribute('href', '/client/sessions/70')

    await fireEvent.click(notificationLink as HTMLAnchorElement)

    await waitFor(() => {
      expect(mockedMarkNotificationRead).toHaveBeenCalledWith({
        source_kind: 'reminder_delivery',
        source_id: 91,
      })
      expect(router.currentRoute.value.fullPath).toBe('/client/sessions/70')
    })
  })

  it('renders, reads, and routes an action-required product update from the bell', async () => {
    const { router } = await renderWithProviders({
      initialPath: '/cabinet',
      roles: ['SPECIALIST'],
      notifications: [
        buildNotification({
          id: 'product_update:31',
          kind: 'product_update',
          source_kind: 'product_update',
          source_id: 31,
          update_key: 'specialist_request_groups',
          code: 'SPECIALIST_REQUEST_GROUPS_REQUIRED',
          title: 'Доповніть профіль для точнішого пошуку',
          body:
            'У Pro Consult з’явився пошук за основними запитами клієнтів. Виберіть теми, з якими ви працюєте, щоб ваш профіль потрапляв у відповідні результати пошуку.',
          target_url: '/cabinet/profile?focus=request_groups',
          cta_label: 'Вибрати теми',
          tone: 'warning',
          slot_start_at: null,
        }),
      ],
    })

    const notificationsButton = screen.getByRole('button', { name: /Сповіщення/i })
    await waitFor(() => expect(notificationsButton).toHaveTextContent('1'))
    await fireEvent.click(notificationsButton)

    const title = await screen.findByText('Доповніть профіль для точнішого пошуку')
    expect(
      screen.getByText(
        'У Pro Consult з’явився пошук за основними запитами клієнтів. Виберіть теми, з якими ви працюєте, щоб ваш профіль потрапляв у відповідні результати пошуку.'
      )
    ).toBeInTheDocument()
    const notificationLink = title.closest('a')
    expect(notificationLink).toHaveAttribute('href', '/cabinet/profile?focus=request_groups')

    await fireEvent.click(notificationLink as HTMLAnchorElement)

    await waitFor(() => {
      expect(mockedMarkNotificationRead).toHaveBeenCalledWith({
        source_kind: 'product_update',
        source_id: 31,
      })
      expect(notificationsButton).not.toHaveTextContent('1')
      expect(router.currentRoute.value.fullPath).toBe('/cabinet/profile?focus=request_groups')
    })
  })

  it('does not count a read specialist-created session notification', async () => {
    await renderWithProviders({
      initialPath: '/client',
      roles: ['CLIENT'],
      notifications: [
        buildNotification({
          id: 'reminder_delivery:92',
          kind: 'reminder_event',
          source_kind: 'reminder_delivery',
          source_id: 92,
          code: 'SESSION_CREATED_BY_SPECIALIST',
          session_id: 71,
          read_at: '2026-07-22T18:00:00Z',
        }),
      ],
    })

    const notificationsButton = screen.getByRole('button', { name: /Сповіщення/i })
    expect(notificationsButton).not.toHaveTextContent('1')
    await fireEvent.click(notificationsButton)
    expect(screen.queryByText('Додано нову сесію')).not.toBeInTheDocument()
  })

  it('uses the server global unread count when the loaded page is partial', async () => {
    await renderWithProviders({
      initialPath: '/cabinet',
      roles: ['SPECIALIST'],
      notificationUnreadCount: 27,
      workQueue: {
        pending_guest_requests_count: 4,
        pending_slotless_guest_requests_count: 2,
      },
      notifications: [
        buildNotification({ source_id: 201, id: 'session_event:201' }),
        buildNotification({ source_id: 202, id: 'session_event:202' }),
      ],
    })

    const notificationsButton = screen.getByRole('button', { name: /Сповіщення/i })
    const requestsLink = screen.getByRole('link', { name: /Запити/i })
    await waitFor(() => expect(notificationsButton).toHaveTextContent('27'))
    expect(requestsLink).toHaveTextContent('4')

    await fireEvent.click(notificationsButton)
    const notification = (await screen.findAllByText('Перенесення: новий час сесії підтверджено'))[0]!
    await fireEvent.click(notification.closest('a') as HTMLAnchorElement)

    await waitFor(() => expect(notificationsButton).toHaveTextContent('26'))
    expect(requestsLink).toHaveTextContent('4')
  })

  it('renders proposed-time acceptance copy and routes to the canonical session target', async () => {
    const { router } = await renderWithProviders({
      initialPath: '/cabinet',
      roles: ['SPECIALIST'],
      notifications: [
        buildNotification({
          id: 'session_event:303',
          source_id: 303,
          code: 'PROPOSED_TIME_ACCEPTED',
          session_id: 88,
          client_id: null,
          client_name: null,
          client_email: null,
          title: 'Клієнт прийняв запропонований час',
          body: 'Нову сесію створено. Відкрийте її, щоб переглянути деталі.',
          target_url: '/cabinet/sessions/88',
        }),
      ],
    })

    await fireEvent.click(screen.getByRole('button', { name: /Сповіщення/i }))
    const title = await screen.findByText('Клієнт прийняв запропонований час')
    expect(screen.getByText('Нову сесію створено. Відкрийте її, щоб переглянути деталі.')).toBeInTheDocument()
    expect(title.closest('a')).toHaveAttribute('href', '/cabinet/sessions/88')

    await fireEvent.click(title.closest('a') as HTMLAnchorElement)
    await waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/cabinet/sessions/88'))
  })

  it('keeps read-all and unknown fallback behavior for reminder events', async () => {
    await renderWithProviders({
      initialPath: '/client',
      roles: ['CLIENT'],
      notifications: [
        buildNotification({
          id: 'reminder_delivery:93',
          kind: 'reminder_event',
          source_kind: 'reminder_delivery',
          source_id: 93,
          code: 'SESSION_CREATED_BY_SPECIALIST',
          session_id: 72,
        }),
        buildNotification({
          id: 'reminder_delivery:94',
          kind: 'reminder_event',
          source_kind: 'reminder_delivery',
          source_id: 94,
          code: 'UNKNOWN_REMINDER_CODE',
          session_id: 73,
        }),
      ],
    })

    await fireEvent.click(screen.getByRole('button', { name: /Сповіщення/i }))
    expect(await screen.findByText('Додано нову сесію')).toBeInTheDocument()
    expect(screen.getByText(/Нагадування про сесію/)).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Прочитати все' }))
    await waitFor(() => {
      expect(mockedMarkAllNotificationsRead).toHaveBeenCalledTimes(1)
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
          target_url: '/cabinet/external-sessions#guest-requests',
          slot_start_at: null,
          scheduled_for: null,
        }),
      ],
      workQueue: {
        pending_guest_requests_count: 1,
        pending_slotless_guest_requests_count: 1,
      },
    })

    const notificationsButton = document.querySelector('.nav__notifications .icon-btn') as HTMLButtonElement | null
    expect(notificationsButton).not.toBeNull()
    await fireEvent.click(notificationsButton as HTMLButtonElement)

    expect(await screen.findByText('Новий запит без реєстрації')).toBeInTheDocument()
    const sidebar = screen.getByRole('navigation', { name: 'Навігація кабінету спеціаліста' })
    expect(within(sidebar).getByRole('link', { name: 'Запити' })).toHaveTextContent('1')
    expect(
      screen.getByText('Клієнт залишив запит без вибору часу. Узгодьте час і створіть сесію або закрийте запит.')
    ).toBeInTheDocument()

    const panelText = document.querySelector('.notif-panel')?.textContent || ''
    expect(panelText).not.toContain('Нагадування про сесію')
    expect(panelText).not.toContain('Перевірте деталі сесії')

    const notificationLink = screen.getByText('Новий запит без реєстрації').closest('a')
    expect(notificationLink).not.toBeNull()
    expect(notificationLink).toHaveAttribute('href', '/cabinet/external-sessions#guest-requests')

    await fireEvent.click(notificationLink as HTMLAnchorElement)

    await waitFor(() => {
      expect(mockedMarkNotificationRead).toHaveBeenCalledWith({
        source_kind: 'public_guest_request',
        source_id: 501,
      })
      expect(router.currentRoute.value.fullPath).toBe('/cabinet/external-sessions#guest-requests')
    })
  })

  it('routes admin work queue notification targets through Vue Router without a hard link', async () => {
    const { router } = await renderWithProviders({
      initialPath: '/admin/work-queue',
      roles: ['ADMIN'],
      notifications: [
        buildNotification({
          id: 'admin_inbox_item:701',
          kind: 'admin_inbox_item',
          source_kind: 'admin_inbox_item',
          source_id: 701,
          code: 'ACTIVE_CLIENT_LIMIT_INCREASE_REQUEST_CREATED',
          session_id: null,
          title: 'Active client limit increase request',
          body: 'Request requires admin review.',
          target_url: '/admin/work-queue?status=active&item_key=active_client_limit_increase_request:1',
          slot_start_at: null,
          scheduled_for: null,
        }),
      ],
    })

    const notificationsButton = document.querySelector('.nav__notifications .icon-btn') as HTMLButtonElement | null
    expect(notificationsButton).not.toBeNull()
    await fireEvent.click(notificationsButton as HTMLButtonElement)

    const notificationButton = await screen.findByRole('button', {
      name: /Active client limit increase request/i,
    })
    expect(document.querySelector('a[href="/admin/work-queue?status=active&item_key=active_client_limit_increase_request:1"]')).toBeNull()

    await fireEvent.click(notificationButton)

    await waitFor(() => {
      expect(mockedMarkNotificationRead).toHaveBeenCalledWith({
        source_kind: 'admin_inbox_item',
        source_id: 701,
      })
      expect(router.currentRoute.value.fullPath).toBe(
        '/admin/work-queue?status=active&item_key=active_client_limit_increase_request:1'
      )
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
          target_url: '/client/sessions/55',
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
          target_url: '/cabinet/sessions/402?focus=meeting_link',
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

  it('renders and routes a manual Pro payment confirmation notification', async () => {
    const { router } = await renderWithProviders({
      initialPath: '/cabinet',
      roles: ['SPECIALIST'],
      notifications: [
        buildNotification({
          id: 'billing_payment:81',
          kind: 'billing_payment',
          source_kind: 'billing_payment',
          source_id: 81,
          code: 'PRO_PAYMENT_RECORDED',
          title: 'Оплату Pro підтверджено',
          body: 'Ваш доступ Pro активний до 14 жовтня 2026 р., 12:00.',
          target_url: '/cabinet/billing',
          session_id: null,
        }),
      ],
    })

    const notificationsButton = document.querySelector('.nav__notifications .icon-btn') as HTMLButtonElement | null
    expect(notificationsButton).not.toBeNull()
    await fireEvent.click(notificationsButton as HTMLButtonElement)

    const title = await screen.findByText('Оплату Pro підтверджено')
    expect(screen.getByText('Ваш доступ Pro активний до 14 жовтня 2026 р., 12:00.')).toBeInTheDocument()
    await fireEvent.click(title.closest('a') as HTMLAnchorElement)

    await waitFor(() => {
      expect(mockedMarkNotificationRead).toHaveBeenCalledWith({
        source_kind: 'billing_payment',
        source_id: 81,
      })
      expect(router.currentRoute.value.fullPath).toBe('/cabinet/billing')
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
          target_url: '/cabinet/inquiries?thread_id=91',
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

    expect(await screen.findByText('Запит перед сесією від Ірина')).toBeInTheDocument()
    expect(screen.getByText('Чи можна уточнити формат першої розмови?')).toBeInTheDocument()

    const notificationLink = screen.getByText('Запит перед сесією від Ірина').closest('a')
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
          target_url: '/client/inquiries/12',
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
          preview: 'Так, можна коротко уточнити запит перед надсиланням.',
          slot_start_at: null,
        }),
      ],
    })
    mockedFetchInquiryThreads.mockResolvedValue([
      {
        id: 91,
        specialist_id: 12,
        specialist_public_slug: 'olena',
        created_at: '2026-03-12T10:00:00Z',
        last_message_at: '2026-03-12T10:01:00Z',
        inquiry_status: 'OPEN',
        closed_reason: null,
        other_user: { id: 12, role: 'SPECIALIST', display_name: 'Олена' },
        last_message_preview: '',
        unread_count: 0,
        can_client_send: true,
        client_send_reason_code: null,
        can_specialist_reply: true,
        specialist_reply_reason_code: null,
      } satisfies InquiryThread,
    ])

    await fireEvent.click(screen.getByRole('button', { name: /Сповіщення/i }))

    expect(await screen.findByText('Відповідь на запит від Олена')).toBeInTheDocument()
    expect(screen.getByText('Так, можна коротко уточнити запит перед надсиланням.')).toBeInTheDocument()

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
    expect(mockedFetchInquiryThreads).toHaveBeenCalledOnce()
    expect(mockedFetchPublicSpecialists).not.toHaveBeenCalled()
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
          target_url: '/cabinet/inquiries?thread_id=92',
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
        unread_count: 0,
      }
    })

    await renderWithProviders({
      initialPath: '/cabinet',
      roles: ['SPECIALIST'],
      notificationsState,
    })

    await fireEvent.click(screen.getByRole('button', { name: /Сповіщення/i }))
    const inquiryLink = await screen.findByText('Запит перед сесією від Ірина')

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
