import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
    auth.accessToken = ''
    auth.me = null
    auth.user = null
    window.history.replaceState({}, '', '/verify-email#token=raw-import-time-token')
    document.body.innerHTML = '<div id="app"></div>'
  })

  afterEach(() => {
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
})
