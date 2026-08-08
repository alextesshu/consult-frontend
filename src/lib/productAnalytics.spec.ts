import { describe, expect, it, vi } from 'vitest'
import {
  browserAttributionForAnalytics,
  getProductAnalyticsConfig,
  normalizedLandingRoute,
  ProductAnalytics,
  sanitizeProviderEvent,
  type ProductAnalyticsProvider,
} from './productAnalytics'

function createProvider(): ProductAnalyticsProvider {
  return {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
  }
}

const enabledConfig = {
  enabled: true,
  projectToken: 'test-public-token',
  apiHost: 'https://eu.i.posthog.com',
}

describe('ProductAnalytics', () => {
  it('is a no-op without explicit enabled EU configuration', () => {
    const provider = createProvider()
    const analytics = new ProductAnalytics()

    expect(analytics.initialize({ ...enabledConfig, enabled: false }, provider)).toBe(false)
    expect(analytics.capture('signup_started')).toBe(true)
    expect(provider.init).not.toHaveBeenCalled()
    expect(provider.capture).not.toHaveBeenCalled()
  })

  it('contains provider initialization failure without interrupting semantic calls', () => {
    const provider = createProvider()
    provider.init = vi.fn(() => {
      throw new Error('provider unavailable')
    })
    const analytics = new ProductAnalytics()

    expect(analytics.initialize(enabledConfig, provider)).toBe(false)
    expect(() => analytics.capture('signup_started')).not.toThrow()
    expect(provider.capture).not.toHaveBeenCalled()
  })

  it('configures PostHog for reviewed semantic events only', () => {
    const provider = createProvider()
    const analytics = new ProductAnalytics()

    expect(analytics.initialize(enabledConfig, provider)).toBe(true)
    expect(provider.init).toHaveBeenCalledWith(
      'test-public-token',
      expect.objectContaining({
        api_host: 'https://eu.i.posthog.com',
        persistence: 'memory',
        save_campaign_params: false,
        save_referrer: false,
        disable_capture_url_hashes: true,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        capture_dead_clicks: false,
        capture_exceptions: false,
        capture_heatmaps: false,
        capture_performance: false,
        disable_session_recording: true,
        disable_surveys: true,
        advanced_disable_flags: true,
      })
    )
  })

  it('rejects unknown events and arbitrary, PII-like, raw URL properties', () => {
    const provider = createProvider()
    const analytics = new ProductAnalytics()
    analytics.initialize(enabledConfig, provider)

    expect(analytics.capture('signup_started', { button_text: 'Register' })).toBe(false)
    expect(analytics.capture('landing_viewed', { landing_route: 'home', email: 'name@example.com' })).toBe(false)
    expect(analytics.capture('landing_viewed', { landing_route: 'home', utm_source: 'https://example.com/path' })).toBe(false)
    expect(provider.capture).not.toHaveBeenCalled()
  })

  it('keeps identify provider-internal fields minimal and strips SDK URL, browser, and person properties', () => {
    const sanitized = sanitizeProviderEvent({
      event: '$identify',
      properties: {
        token: 'test-public-token',
        distinct_id: 'specialist:4a3bb3e7-6a3f-4ed2-9e7c-0f5a8d5d7436',
        $anon_distinct_id: 'anonymous-device-id',
        $process_person_profile: true,
        $current_url: 'https://proconsult.space/signup?email=private@example.com',
        $pathname: '/signup',
        $referring_domain: 'https://private-referrer.example',
        $browser: 'Chrome',
        email: 'private@example.com',
      },
      $set: { email: 'private@example.com' },
      $set_once: { initial_url: 'https://proconsult.space/signup?token=secret' },
    })

    expect(sanitized).toEqual({
      event: '$identify',
      properties: {
        token: 'test-public-token',
        distinct_id: 'specialist:4a3bb3e7-6a3f-4ed2-9e7c-0f5a8d5d7436',
        $anon_distinct_id: 'anonymous-device-id',
        $process_person_profile: true,
      },
    })
  })

  it('uses private specialist context, excludes manual source text, and resets on logout', () => {
    const provider = createProvider()
    const analytics = new ProductAnalytics()
    analytics.initialize(enabledConfig, provider)

    analytics.identify({
      subject_id: 'specialist:4a3bb3e7-6a3f-4ed2-9e7c-0f5a8d5d7436',
      attribution: { source_type: 'manual' },
    })
    expect(analytics.capture('profile_setup_opened')).toBe(true)
    expect(provider.identify).toHaveBeenCalledWith('specialist:4a3bb3e7-6a3f-4ed2-9e7c-0f5a8d5d7436')
    expect(provider.capture).toHaveBeenCalledWith('profile_setup_opened', { source_type: 'manual' })

    analytics.reset()
    expect(provider.reset).toHaveBeenCalledOnce()
  })

  it('limits readiness, publication, search, and share properties to their approved enums', () => {
    const provider = createProvider()
    const analytics = new ProductAnalytics()
    analytics.initialize(enabledConfig, provider)

    expect(analytics.capture('readiness_item_completed', { item: 'public_name' })).toBe(true)
    expect(analytics.capture('readiness_item_completed', { item: 'photo' })).toBe(false)
    expect(analytics.capture('profile_publish_failed', { error_code: 'server' })).toBe(true)
    expect(analytics.capture('profile_publish_failed', { error_code: 'raw serializer detail' })).toBe(false)
    expect(analytics.capture('share_profile_clicked', { destination: 'telegram' })).toBe(true)
    expect(analytics.capture('share_profile_clicked', { destination: 'mailto:secret@example.com' })).toBe(false)
  })

  it('normalizes only meaningful route names and safe KAN-5 dimensions', () => {
    expect(normalizedLandingRoute('/')).toBe('home')
    expect(normalizedLandingRoute('/signup?token=secret')).toBe('specialist_signup')
    expect(normalizedLandingRoute('/guest/booking-time-proposal/private-token')).toBeNull()
    expect(
      browserAttributionForAnalytics({
        utm_source: 'threads',
        referrer: 'https://www.threads.com/@specialist?private=ignored',
        first_landing_path: '/signup?code=private',
      })
    ).toEqual({
      source_type: 'campaign',
      utm_source: 'threads',
      referrer_origin: 'https://www.threads.com',
      first_landing_path: '/signup',
    })
  })

  it('keeps test mode disabled even with a configured token', () => {
    expect(
      getProductAnalyticsConfig({
        MODE: 'test',
        VITE_PRODUCT_ANALYTICS_ENABLED: 'true',
        VITE_POSTHOG_PROJECT_TOKEN: 'test-token',
        VITE_POSTHOG_API_HOST: 'https://eu.i.posthog.com',
      })
    ).toMatchObject({ enabled: false })
  })

  it('fails closed for a missing required setting or a non-EU ingestion host', () => {
    expect(
      getProductAnalyticsConfig({
        MODE: 'production',
        VITE_PRODUCT_ANALYTICS_ENABLED: 'true',
        VITE_POSTHOG_API_HOST: 'https://eu.i.posthog.com',
      })
    ).toMatchObject({ enabled: false })
    expect(
      getProductAnalyticsConfig({
        MODE: 'production',
        VITE_PRODUCT_ANALYTICS_ENABLED: 'true',
        VITE_POSTHOG_PROJECT_TOKEN: 'test-public-token',
      })
    ).toMatchObject({ enabled: false })
    expect(
      getProductAnalyticsConfig({
        MODE: 'production',
        VITE_PRODUCT_ANALYTICS_ENABLED: 'true',
        VITE_POSTHOG_PROJECT_TOKEN: 'test-public-token',
        VITE_POSTHOG_API_HOST: 'https://us.i.posthog.com',
      })
    ).toMatchObject({ enabled: false })
  })
})
