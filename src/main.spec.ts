import { beforeEach, describe, expect, it, vi } from 'vitest'

const bootstrap = vi.hoisted(() => {
  const steps: string[] = []
  const router = {
    currentRoute: { value: { path: '/verify-email' } },
    isReady: vi.fn(() => Promise.resolve()),
  }
  const app = {
    mount: vi.fn(),
    use: vi.fn((plugin: unknown) => {
      if (plugin === router) steps.push('router')
      return app
    }),
  }
  return {
    app,
    auth: {
      initFromStorage: vi.fn(),
      restoreSession: vi.fn(() => Promise.resolve()),
    },
    pinia: {},
    router,
    steps,
  }
})

vi.mock('vue', () => ({ createApp: vi.fn(() => bootstrap.app) }))
vi.mock('pinia', () => ({ createPinia: vi.fn(() => bootstrap.pinia) }))
vi.mock('./App.vue', () => ({ default: {} }))
vi.mock('./router', () => ({ default: bootstrap.router }))
vi.mock('./stores/auth', () => ({ useAuthStore: vi.fn(() => bootstrap.auth) }))
vi.mock('./lib/emailVerificationToken', () => ({
  captureEmailVerificationTokenFromLocation: vi.fn(() => {
    bootstrap.steps.push('capture')
    return true
  }),
}))
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
    bootstrap.steps.splice(0)
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('captures the verification fragment before Vue Router starts initial navigation', async () => {
    await import('./main')

    expect(bootstrap.steps).toEqual(['capture', 'router'])
  })
})
