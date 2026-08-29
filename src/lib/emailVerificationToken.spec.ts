import { createApp, h } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProductAnalytics, type ProductAnalyticsProvider } from './productAnalytics'
import {
  captureEmailVerificationTokenFromLocation,
  resetEmailVerificationTokenForTests,
  takeEmailVerificationToken,
} from './emailVerificationToken'

describe('email verification token handoff', () => {
  afterEach(() => {
    resetEmailVerificationTokenForTests()
    localStorage.clear()
    window.history.replaceState({}, '', '/')
  })

  it('captures the fragment in memory and immediately removes it from the visible URL', () => {
    window.history.replaceState({}, '', '/verify-email#token=raw-verification-token')

    expect(captureEmailVerificationTokenFromLocation()).toBe(true)
    expect(window.location.pathname).toBe('/verify-email')
    expect(window.location.hash).toBe('')
    expect(window.location.href).not.toContain('raw-verification-token')
    expect(localStorage.getItem('token')).toBeNull()
    expect(takeEmailVerificationToken()).toBe('raw-verification-token')
    expect(takeEmailVerificationToken()).toBe('')
  })

  it('sanitizes before Vue Router startup so neither location nor route retains the token', async () => {
    window.history.replaceState({}, '', '/verify-email#token=raw-token-router-startup')

    expect(captureEmailVerificationTokenFromLocation()).toBe(true)

    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/verify-email', component: { render: () => h('div') } }],
    })
    const app = createApp({ render: () => h('div') })
    const mountPoint = document.createElement('div')
    app.use(router)
    app.mount(mountPoint)
    await router.isReady()

    expect(window.location.pathname).toBe('/verify-email')
    expect(window.location.hash).toBe('')
    expect(window.location.href).not.toContain('raw-token-router-startup')
    expect(router.currentRoute.value.hash).toBe('')
    expect(router.currentRoute.value.fullPath).toBe('/verify-email')
    expect(takeEmailVerificationToken()).toBe('raw-token-router-startup')
    expect(takeEmailVerificationToken()).toBe('')

    app.unmount()
  })

  it('sanitizes the verification URL before PostHog provider initialization', () => {
    window.history.replaceState({}, '', '/verify-email#token=private-token')
    const provider: ProductAnalyticsProvider = {
      init: vi.fn(() => {
        expect(window.location.href).not.toContain('private-token')
        expect(window.location.hash).toBe('')
      }),
      capture: vi.fn(),
      identify: vi.fn(),
      reset: vi.fn(),
    }

    const analytics = new ProductAnalytics()
    expect(
      analytics.initialize(
        { enabled: true, projectToken: 'project-token', apiHost: 'https://eu.i.posthog.com' },
        provider,
        'allowed'
      )
    ).toBe(true)
    expect(provider.init).toHaveBeenCalledTimes(1)
    expect(takeEmailVerificationToken()).toBe('private-token')
  })
})
