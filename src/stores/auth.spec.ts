import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from './auth'
import { fetchMe, loginWithIdentifier, logoutSession, refreshToken, signupClient, signupSpecialist } from '../lib/api'

vi.mock('../lib/api', () => ({
  fetchMe: vi.fn(),
  loginWithIdentifier: vi.fn(),
  logoutSession: vi.fn(),
  refreshToken: vi.fn(),
  signupClient: vi.fn(),
  signupSpecialist: vi.fn(),
}))

const mockedFetchMe = vi.mocked(fetchMe)
const mockedLoginWithIdentifier = vi.mocked(loginWithIdentifier)
const mockedLogoutSession = vi.mocked(logoutSession)
const mockedRefreshToken = vi.mocked(refreshToken)
const mockedSignupClient = vi.mocked(signupClient)
const mockedSignupSpecialist = vi.mocked(signupSpecialist)

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
})
