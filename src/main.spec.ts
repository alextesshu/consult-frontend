import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const bootVersions = vi.hoisted(() => [] as Array<string | undefined>)
vi.mock('vue', async (importOriginal) => {
  const original = await importOriginal<typeof import('vue')>()
  return {
    ...original,
    createApp: (...args: Parameters<typeof original.createApp>) => {
      bootVersions.push(document.documentElement.dataset.ui)
      return original.createApp(...args)
    },
  }
})

const auth = vi.hoisted(() => ({
  accessToken: '',
  authResolved: true,
  ensureAuthResolved: vi.fn(async () => false),
  initFromStorage: vi.fn(),
  loadMe: vi.fn(),
  me: null,
  restoreSession: vi.fn(() => Promise.resolve()),
  user: null,
}))

vi.mock('./App.vue', () => ({ default: { render: () => null } }))
vi.mock('./stores/auth', () => ({ useAuthStore: vi.fn(() => auth) }))
vi.mock('./lib/registrationAttribution', () => ({
  captureSpecialistRegistrationFirstTouch: vi.fn(),
  getSpecialistRegistrationAttribution: vi.fn(() => null),
}))
vi.mock('./lib/productAnalytics', () => ({
  browserAttributionForAnalytics: vi.fn(() => ({})),
  normalizedLandingRoute: vi.fn(() => ''),
  productAnalytics: { capture: vi.fn(), setConsentPreference: vi.fn() },
}))
vi.mock('./lib/clientAcquisitionAttribution', () => ({ captureClientAcquisitionContext: vi.fn() }))
vi.mock('./lib/analyticsConsent', () => ({
  getAnalyticsConsentPreference: vi.fn(() => 'unknown'),
  onAnalyticsConsentPreferenceChange: vi.fn(),
}))

describe('application bootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.stubEnv('VITE_UI_V2', '')
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    bootVersions.length = 0
    window.localStorage.clear()
    delete document.documentElement.dataset.ui
    auth.accessToken = ''
    auth.initFromStorage.mockReset()
    auth.me = null
    auth.user = null
    window.history.replaceState({}, '', '/verify-email#token=raw-import-time-token')
    document.body.innerHTML = '<div id="app"></div>'
  })

  afterEach(async () => {
    const { default: router } = await import('./router')
    router.options.history.destroy()
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    window.localStorage.clear()
    delete document.documentElement.dataset.ui
    document.body.innerHTML = ''
    window.history.replaceState({}, '', '/')
  })

  it('sanitizes the real import-time URL before the router module is created', async () => {
    await import('./main')
    const { default: router } = await import('./router')
    await router.isReady()
    const { takeEmailVerificationToken } = await import('./lib/emailVerificationToken')

    expect(window.location.pathname).toBe('/verify-email')
    expect(window.location.hash).toBe('')
    expect(window.location.href).not.toContain('raw-import-time-token')
    expect(router.currentRoute.value.hash).toBe('')
    expect(router.currentRoute.value.fullPath).not.toContain('raw-import-time-token')
    expect(takeEmailVerificationToken()).toBe('raw-import-time-token')
    expect(takeEmailVerificationToken()).toBe('')
  })

  it('creates the router normally for a direct cabinet URL', async () => {
    window.history.replaceState({}, '', '/cabinet')

    await import('./main')
    const { default: router } = await import('./router')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('applies UI selection before createApp and survives verification URL sanitization', async () => {
    window.history.replaceState({}, '', '/verify-email?ui=v2#token=raw-import-time-token')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Denied') })
    await import('./main')
    const { default: router } = await import('./router')
    await router.isReady()
    expect(bootVersions).toEqual(['v2'])
    expect(window.location.search).toBe('')
    expect(window.location.hash).toBe('')
    expect(document.documentElement.dataset.ui).toBe('v2')
    const { takeEmailVerificationToken } = await import('./lib/emailVerificationToken')
    expect(takeEmailVerificationToken()).toBe('raw-import-time-token')
  })

  it('keeps successful query navigation and browser history synchronized', async () => {
    window.history.replaceState({}, '', '/login')
    await import('./main')
    const { default: router } = await import('./router')
    await router.isReady()
    expect(bootVersions).toEqual(['v1'])
    await router.push('/login?ui=v2')
    expect(document.documentElement.dataset.ui).toBe('v2')
    await router.push('/login?ui=v1')
    expect(document.documentElement.dataset.ui).toBe('v1')
    const go = (delta: number) => new Promise<void>((resolve) => {
      const remove = router.afterEach(() => { remove(); resolve() })
      router.go(delta)
    })
    await go(-1)
    expect(document.documentElement.dataset.ui).toBe('v2')
    await go(1)
    expect(document.documentElement.dataset.ui).toBe('v1')
    const removeGuard = router.beforeEach((to) => to.query.ui === 'v2' ? false : undefined)
    await router.push('/login?ui=v2')
    expect(document.documentElement.dataset.ui).toBe('v1')
    expect(window.localStorage.getItem('pc.ui')).toBe('v1')
    removeGuard()
  })

  it('boots when the storage accessor is unavailable', async () => {
    window.history.replaceState({}, '', '/login?ui=v2')
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })
    auth.initFromStorage.mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })
    await import('./main')
    const { default: router } = await import('./router')
    await router.isReady()
    expect(bootVersions).toEqual(['v2'])
    expect(auth.restoreSession).toHaveBeenCalled()
    await router.push('/login')
    expect(document.documentElement.dataset.ui).toBe('v2')
  })
})
