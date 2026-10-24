import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from './auth'
import { fetchMe, loginWithIdentifier, logoutSession, refreshToken, signupClient, signupSpecialist } from '../lib/api'
import {
  clearSpecialistRegistrationAttribution,
  getSpecialistRegistrationAttribution,
} from '../lib/registrationAttribution'
import { productAnalytics } from '../lib/productAnalytics'

vi.mock('../lib/api', () => ({
  fetchMe: vi.fn(),
  loginWithIdentifier: vi.fn(),
  logoutSession: vi.fn(),
  refreshToken: vi.fn(),
  signupClient: vi.fn(),
  signupSpecialist: vi.fn(),
}))

vi.mock('../lib/registrationAttribution', () => ({
  clearSpecialistRegistrationAttribution: vi.fn(),
  getSpecialistRegistrationAttribution: vi.fn(),
}))

vi.mock('../lib/productAnalytics', () => ({
  productAnalytics: {
    initialize: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
  },
}))

const mockedFetchMe = vi.mocked(fetchMe)
const mockedLoginWithIdentifier = vi.mocked(loginWithIdentifier)
const mockedLogoutSession = vi.mocked(logoutSession)
const mockedRefreshToken = vi.mocked(refreshToken)
const mockedSignupClient = vi.mocked(signupClient)
const mockedSignupSpecialist = vi.mocked(signupSpecialist)
const mockedClearSpecialistRegistrationAttribution = vi.mocked(clearSpecialistRegistrationAttribution)
const mockedGetSpecialistRegistrationAttribution = vi.mocked(getSpecialistRegistrationAttribution)

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('auth store cookie-based flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
    mockedFetchMe.mockResolvedValue({
      user: { id: 1, username: 'u', email: 'u@example.com', roles: ['CLIENT'] },
      access_state: null,
      effective_entitlements: null,
      counts: null,
      server_time: '2026-03-25T10:00:00Z',
    })
    mockedSignupClient.mockResolvedValue({
      access: 'ac',
      refresh: 'rc',
      user: { id: 1, username: 'u', email: null, role: 'CLIENT', roles: ['CLIENT'] },
    })
    mockedSignupSpecialist.mockResolvedValue({
      access: 'as',
      refresh: 'rs',
      user: { id: 1, username: 'u', email: null, role: 'SPECIALIST', roles: ['SPECIALIST'] },
    })
    mockedLogoutSession.mockResolvedValue()
    mockedGetSpecialistRegistrationAttribution.mockReturnValue({
      utm_source: 'threads',
      first_landing_path: '/',
    })
  })

  it('keeps tokens in memory only and uses cookie refresh without refresh payload', async () => {
    const auth = useAuthStore()

    mockedLoginWithIdentifier.mockResolvedValue({
      access: 'access-1',
      refresh: 'refresh-ignored',
    })
    mockedRefreshToken
      .mockResolvedValueOnce({ access: 'access-2' })
      .mockResolvedValueOnce({ access: 'access-3' })
      .mockResolvedValueOnce({ access: 'access-4' })

    await auth.login('user@example.com', 'pass')
    expect(auth.accessToken).toBe('access-1')
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()

    expect(await auth.refreshAccessToken()).toBe('access-2')
    expect(mockedRefreshToken.mock.calls[0]).toEqual([])
    expect(auth.accessToken).toBe('access-2')

    expect(await auth.refreshAccessToken()).toBe('access-3')
    expect(mockedRefreshToken.mock.calls[1]).toEqual([])
    expect(auth.accessToken).toBe('access-3')

    localStorage.setItem('accessToken', 'legacy-access')
    localStorage.setItem('refreshToken', 'legacy-refresh')

    setActivePinia(createPinia())
    const restoredAuth = useAuthStore()
    restoredAuth.initFromStorage()
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()

    await restoredAuth.restoreSession()
    expect(mockedRefreshToken.mock.calls[2]).toEqual([])
    expect(restoredAuth.accessToken).toBe('access-4')
  })

  it.each(['legacy_unknown', 'unverified', 'verified'] as const)(
    'keeps the canonical %s email verification state from /api/me',
    async (emailVerificationState) => {
      const auth = useAuthStore()
      auth.setToken('access-token')
      mockedFetchMe.mockResolvedValueOnce({
        user: {
          id: 1,
          username: 'u',
          email: 'u@example.com',
          roles: ['CLIENT'],
          email_verification_state: emailVerificationState,
          email_verified_at: emailVerificationState === 'verified' ? '2026-08-29T12:00:00Z' : null,
        },
        access_state: null,
        effective_entitlements: null,
        counts: null,
        server_time: '2026-08-29T12:00:00Z',
      })

      await auth.loadMe()

      expect(auth.user?.email_verification_state).toBe(emailVerificationState)
      expect(auth.me?.user.email_verification_state).toBe(emailVerificationState)
    }
  )

  it('does not let stale restoreSession overwrite state after successful login', async () => {
    const auth = useAuthStore()
    const refreshDeferred = deferred<{ access: string }>()

    mockedRefreshToken.mockImplementationOnce(() => refreshDeferred.promise)
    mockedLoginWithIdentifier.mockResolvedValueOnce({
      access: 'new-access',
      refresh: 'ignored',
    })
    mockedFetchMe.mockImplementation(async (accessToken?: string) => {
      if (accessToken === 'old-access') {
        return {
          user: { id: 99, username: 'superadmin', email: 'superadmin@example.com', roles: ['SPECIALIST'] },
          access_state: null,
          effective_entitlements: null,
          counts: null,
          server_time: '2026-03-25T10:00:00Z',
        }
      }
      return {
        user: { id: 7, username: 'new-user', email: 'new@example.com', roles: ['CLIENT'] },
        access_state: null,
        effective_entitlements: null,
        counts: null,
        server_time: '2026-03-25T10:00:00Z',
      }
    })

    const restorePromise = auth.restoreSession()
    await auth.login('new@example.com', 'pass')
    refreshDeferred.resolve({ access: 'old-access' })
    await restorePromise

    expect(auth.accessToken).toBe('new-access')
    expect(auth.user?.username).toBe('new-user')
    expect(auth.user?.username).not.toBe('superadmin')
  })

  it('deduplicates concurrent restoreSession calls into a single refresh request', async () => {
    const auth = useAuthStore()
    const refreshDeferred = deferred<{ access: string }>()

    mockedRefreshToken.mockImplementationOnce(() => refreshDeferred.promise)
    mockedFetchMe.mockResolvedValue({
      user: { id: 11, username: 'restored-user', email: 'restored@example.com', roles: ['SPECIALIST'] },
      access_state: null,
      effective_entitlements: null,
      counts: null,
      server_time: '2026-03-25T10:00:00Z',
    })

    const restoreA = auth.restoreSession()
    const restoreB = auth.restoreSession()
    refreshDeferred.resolve({ access: 'restored-access' })

    const [resultA, resultB] = await Promise.all([restoreA, restoreB])

    expect(resultA).toBe(true)
    expect(resultB).toBe(true)
    expect(mockedRefreshToken).toHaveBeenCalledTimes(1)
    expect(auth.accessToken).toBe('restored-access')
    expect(auth.user?.username).toBe('restored-user')
  })

  it('keeps auth state on transient refresh failure', async () => {
    const auth = useAuthStore()
    auth.setToken('still-valid-in-memory')
    auth.setUser({
      id: 5,
      username: 'specialist',
      email: 's@example.com',
      roles: ['SPECIALIST'],
    })

    mockedRefreshToken.mockRejectedValueOnce(new Error('network down'))

    const refreshed = await auth.refreshAccessToken()

    expect(refreshed).toBeNull()
    expect(auth.accessToken).toBe('still-valid-in-memory')
    expect(auth.user?.username).toBe('specialist')
  })

  it('logs out on terminal refresh failure (401)', async () => {
    const auth = useAuthStore()
    auth.setToken('expired-token')
    auth.setUser({
      id: 9,
      username: 'client',
      email: 'c@example.com',
      roles: ['CLIENT'],
    })

    mockedRefreshToken.mockRejectedValueOnce({
      response: { status: 401 },
    })

    const refreshed = await auth.refreshAccessToken()

    expect(refreshed).toBeNull()
    expect(auth.accessToken).toBe('')
    expect(auth.user).toBeNull()
    expect(auth.me).toBeNull()
    expect(auth.authResolved).toBe(true)
  })

  it('sets a stable anonymous auth state on logout and does not reuse stale resolve promise across login', async () => {
    const auth = useAuthStore()
    const refreshDeferred = deferred<{ access: string }>()

    mockedRefreshToken.mockImplementationOnce(() => refreshDeferred.promise)
    const staleResolve = auth.ensureAuthResolved()

    auth.logout()
    expect(auth.authResolved).toBe(true)
    expect(auth.accessToken).toBe('')
    expect(auth.user).toBeNull()
    expect(auth.me).toBeNull()

    mockedLoginWithIdentifier.mockResolvedValueOnce({
      access: 'fresh-admin-access',
      refresh: 'ignored',
    })
    mockedFetchMe.mockResolvedValueOnce({
      user: { id: 77, username: 'admin', email: 'admin@example.com', role: 'ADMIN', roles: ['ADMIN'] },
      access_state: null,
      effective_entitlements: null,
      counts: null,
      server_time: '2026-03-25T10:00:00Z',
    })

    await auth.login('admin@example.com', 'pass')
    refreshDeferred.resolve({ access: 'stale-access' })
    await staleResolve

    expect(auth.accessToken).toBe('fresh-admin-access')
    expect(auth.user?.role).toBe('ADMIN')
    expect(auth.user?.username).toBe('admin')
  })

  it('supports forced auth resolve to fetch me with active token', async () => {
    const auth = useAuthStore()
    auth.setToken('active-token')
    auth.authResolved = true
    auth.setUser(null)
    auth.me = null

    mockedFetchMe.mockResolvedValueOnce({
      user: { id: 55, username: 'admin', email: 'admin@example.com', role: 'ADMIN', roles: ['ADMIN'] },
      access_state: null,
      effective_entitlements: null,
      counts: null,
      server_time: '2026-03-25T10:00:00Z',
    })

    const resolved = await auth.ensureAuthResolved({ force: true })

    expect(resolved).toBe(true)
    expect(auth.user?.role).toBe('ADMIN')
    expect(mockedFetchMe).toHaveBeenCalledWith('active-token')
  })

  it('persists first-touch attribution with specialist signup and retires it only after success', async () => {
    const auth = useAuthStore()

    await auth.signup('specialist@example.com', 'password123', 'password123')

    expect(mockedSignupSpecialist).toHaveBeenCalledWith('specialist@example.com', 'password123', 'password123', {
      utm_source: 'threads',
      first_landing_path: '/',
    })
    expect(mockedClearSpecialistRegistrationAttribution).toHaveBeenCalledTimes(1)
    expect(productAnalytics.capture).toHaveBeenCalledWith('signup_completed')
  })

  it('deduplicates restored-session and loadMe triggers, then identifies again after logout/login', async () => {
    const { ProductAnalytics } = await vi.importActual<typeof import('../lib/productAnalytics')>('../lib/productAnalytics')
    const runtime = new ProductAnalytics()
    const provider = { init: vi.fn(), identify: vi.fn(), capture: vi.fn(), reset: vi.fn() }
    vi.mocked(productAnalytics.initialize).mockImplementation(() => runtime.initialize({
      enabled: true,
      projectToken: 'test-public-token',
      apiHost: 'https://eu.i.posthog.com',
    }, provider, 'allowed'))
    vi.mocked(productAnalytics.identify).mockImplementation((context) => runtime.identify(context))
    vi.mocked(productAnalytics.reset).mockImplementation(() => runtime.reset())
    const context = {
      subject_id: 'specialist:4a3bb3e7-6a3f-4ed2-9e7c-0f5a8d5d7436',
      attribution: null,
    }
    mockedRefreshToken.mockResolvedValue({ access: 'restored-access' })
    mockedLoginWithIdentifier.mockResolvedValue({ access: 'login-access', refresh: 'ignored' })
    mockedFetchMe.mockResolvedValue({
      user: { id: 1, username: 'specialist', email: null, roles: ['SPECIALIST'] },
      access_state: null, effective_entitlements: null, counts: null,
      analytics_context: context, server_time: '2026-10-03T10:00:00Z',
    })
    try {
      const auth = useAuthStore()
      await auth.restoreSession()
      await auth.loadMe()
      await auth.loadMe()
      expect(provider.init).toHaveBeenCalledOnce()
      expect(provider.identify).toHaveBeenCalledOnce()
      expect(provider.identify).toHaveBeenCalledWith(context.subject_id)
      auth.logout()
      await auth.login('specialist', 'test-password')
      await auth.loadMe()
      expect(provider.identify).toHaveBeenCalledTimes(2)
    } finally {
      vi.mocked(productAnalytics.initialize).mockReset()
      vi.mocked(productAnalytics.identify).mockReset()
      vi.mocked(productAnalytics.reset).mockReset()
    }
  })

  it('identifies only the private analytics context and resets it on logout', () => {
    const auth = useAuthStore()
    auth.setMe({
      user: { id: 1, username: 'specialist', email: 'specialist@example.com', roles: ['SPECIALIST'] },
      access_state: null,
      effective_entitlements: null,
      counts: null,
      analytics_context: {
        subject_id: 'specialist:4a3bb3e7-6a3f-4ed2-9e7c-0f5a8d5d7436',
        attribution: { source_type: 'campaign', utm_source: 'threads' },
      },
      server_time: '2026-08-08T10:00:00Z',
    })

    expect(productAnalytics.identify).toHaveBeenCalledWith({
      subject_id: 'specialist:4a3bb3e7-6a3f-4ed2-9e7c-0f5a8d5d7436',
      attribution: { source_type: 'campaign', utm_source: 'threads' },
    })

    auth.logout()
    expect(productAnalytics.reset).toHaveBeenCalledOnce()
  })
})


describe('registration v2 store integration', () => {
  beforeEach(() => { setActivePinia(createPinia()); vi.clearAllMocks() })
  it('forwards specialist v2 plus attribution and preserves token/me/analytics sequence', async () => {
    const acquisition = { utm_source: 'fixture', first_landing_path: '/' }
    const contract = { registration_contract_version: 2 as const, first_name: 'Олена', professional_focus: 'other' as const }
    mockedGetSpecialistRegistrationAttribution.mockReturnValue(acquisition)
    mockedSignupSpecialist.mockResolvedValueOnce({ access: 'v2-access', user: { id: 1, username: 's', email: 's@example.test' } })
    mockedFetchMe.mockResolvedValueOnce({ user: { id: 1, username: 's', roles: ['SPECIALIST'], email_verification_state: 'unverified' } })
    const auth = useAuthStore()
    await auth.signup('s@example.test', 'password123', undefined, contract)
    expect(mockedSignupSpecialist).toHaveBeenCalledWith('s@example.test', 'password123', undefined, acquisition, contract)
    expect(auth.accessToken).toBe('v2-access')
    expect(auth.me?.user.email_verification_state).toBe('unverified')
    expect(mockedClearSpecialistRegistrationAttribution).toHaveBeenCalledTimes(1)
    expect(productAnalytics.capture).toHaveBeenCalledWith('signup_completed')
  })
  it('forwards client v2 without specialist activation or analytics', async () => {
    const contract = { registration_contract_version: 2 as const, first_name: 'Олена' }
    mockedSignupClient.mockResolvedValueOnce({ access: 'v2-access', user: { id: 2, username: 'c', email: 'c@example.test' } })
    mockedFetchMe.mockResolvedValueOnce({ user: { id: 2, username: 'c', roles: ['CLIENT'] } })
    const auth = useAuthStore()
    await auth.signupClient('c@example.test', 'password123', undefined, contract)
    expect(mockedSignupClient).toHaveBeenCalledWith('c@example.test', 'password123', undefined, contract)
    expect(auth.user?.roles).toEqual(['CLIENT'])
    expect(productAnalytics.capture).not.toHaveBeenCalled()
    expect(mockedClearSpecialistRegistrationAttribution).not.toHaveBeenCalled()
  })
})
