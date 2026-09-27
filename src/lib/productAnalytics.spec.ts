import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  browserAttributionForAnalytics,
  getProductAnalyticsConfig,
  normalizedLandingRoute,
  ProductAnalytics,
  sanitizeProviderEvent,
  type ProductAnalyticsProvider,
} from './productAnalytics'
import { analyticsConsentStorageKey } from './analyticsConsent'

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
  afterEach(() => {
    window.localStorage.clear()
  })

  it('is a no-op without explicit enabled EU configuration', () => {
    const provider = createProvider()
    const analytics = new ProductAnalytics()

    expect(analytics.initialize({ ...enabledConfig, enabled: false }, provider, 'allowed')).toBe(false)
    expect(analytics.capture('signup_started')).toBe(false)
    expect(provider.init).not.toHaveBeenCalled()
    expect(provider.capture).not.toHaveBeenCalled()
  })

  it('contains provider initialization failure without interrupting semantic calls', () => {
    const provider = createProvider()
    provider.init = vi.fn(() => {
      throw new Error('provider unavailable')
    })
    const analytics = new ProductAnalytics()

    expect(analytics.initialize(enabledConfig, provider, 'allowed')).toBe(false)
    expect(() => analytics.capture('signup_started')).not.toThrow()
    expect(provider.capture).not.toHaveBeenCalled()
  })

  it('configures PostHog for reviewed semantic events only', () => {
    const provider = createProvider()
    const analytics = new ProductAnalytics()

    expect(analytics.initialize(enabledConfig, provider, 'allowed')).toBe(true)
    expect(provider.init).toHaveBeenCalledWith(
      'test-public-token',
      expect.objectContaining({
        api_host: 'https://eu.i.posthog.com',
        persistence: 'sessionStorage',
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
        before_send: sanitizeProviderEvent,
      })
    )
  })

  it('deduplicates identify calls per initialized provider runtime', () => {
    const provider = createProvider()
    const analytics = new ProductAnalytics()
    const first = {
      subject_id: 'specialist:4a3bb3e7-6a3f-4ed2-9e7c-0f5a8d5d7436',
      attribution: { source_type: 'direct' as const },
    }
    const second = {
      subject_id: 'specialist:3b2cc3e6-5b2e-4dc1-8d6c-1e4b7c3a9d25',
      attribution: { source_type: 'direct' as const },
    }

    analytics.identify(first)
    expect(provider.identify).not.toHaveBeenCalled()

    expect(analytics.initialize(enabledConfig, provider, 'allowed')).toBe(true)
    analytics.identify(first)
    analytics.identify(first)
    expect(provider.identify).toHaveBeenCalledTimes(1)
    expect(provider.identify).toHaveBeenLastCalledWith(first.subject_id)

    analytics.identify(second)
    expect(provider.identify).toHaveBeenCalledTimes(2)
    expect(provider.identify).toHaveBeenLastCalledWith(second.subject_id)

    analytics.reset()
    expect(analytics.initialize(enabledConfig, provider, 'allowed')).toBe(true)
    expect(provider.identify).toHaveBeenCalledTimes(2)

    analytics.identify(second)
    expect(provider.identify).toHaveBeenCalledTimes(3)
    expect(provider.identify).toHaveBeenLastCalledWith(second.subject_id)
  })

  it('rejects unknown events and arbitrary, PII-like, raw URL properties', () => {
    const provider = createProvider()
    const analytics = new ProductAnalytics()
    analytics.initialize(enabledConfig, provider, 'allowed')

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
        $geoip_disable: true,
      },
    })
  })

  it('disables GeoIP for every event returned by before_send sanitization', () => {
    const captured = sanitizeProviderEvent({
      event: 'landing_viewed',
      properties: {
        landing_route: 'home',
        $current_url: 'https://proconsult.space/?email=private@example.com',
      },
    })
    const identified = sanitizeProviderEvent({
      event: '$identify',
      properties: {
        distinct_id: 'specialist:4a3bb3e7-6a3f-4ed2-9e7c-0f5a8d5d7436',
      },
    })

    expect(captured?.properties?.$geoip_disable).toBe(true)
    expect(identified?.properties?.$geoip_disable).toBe(true)
  })

  it('uses private specialist context, excludes manual source text, and resets on logout', () => {
    const provider = createProvider()
    const analytics = new ProductAnalytics()
    analytics.initialize(enabledConfig, provider, 'allowed')

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
    analytics.initialize(enabledConfig, provider, 'allowed')

    expect(analytics.capture('readiness_item_completed', { item: 'public_name' })).toBe(true)
    expect(analytics.capture('readiness_item_completed', { item: 'photo' })).toBe(false)
    expect(analytics.capture('profile_publish_failed', { error_code: 'server' })).toBe(true)
    expect(analytics.capture('profile_publish_failed', { error_code: 'raw serializer detail' })).toBe(false)
    expect(analytics.capture('share_profile_clicked', { destination: 'telegram' })).toBe(true)
    expect(analytics.capture('share_profile_clicked', { destination: 'mailto:secret@example.com' })).toBe(false)
  })

  it('allows only the reviewed KAN-89 client funnel events and contact modes', () => {
    const provider = createProvider()
    const analytics = new ProductAnalytics()
    analytics.initialize(enabledConfig, provider, 'allowed')

    expect(analytics.capture('client_entry_cta_clicked')).toBe(true)
    expect(analytics.capture('specialist_discovery_opened')).toBe(true)
    expect(analytics.capture('specialist_discovery_results_viewed')).toBe(true)
    expect(analytics.capture('specialist_profile_opened')).toBe(true)
    expect(analytics.capture('client_contact_cta_engaged', { contact_mode: 'request_only' })).toBe(true)
    expect(analytics.capture('client_request_succeeded', { contact_mode: 'direct_booking' })).toBe(true)
    expect(analytics.capture('client_booking_succeeded', { contact_mode: 'direct_booking' })).toBe(true)
    expect(analytics.capture('client_contact_cta_engaged', { contact_mode: 'email' })).toBe(false)
    expect(analytics.capture('client_request_succeeded', { contact_mode: 'request_only', slug: 'olena' })).toBe(false)
    expect(provider.capture).toHaveBeenCalledWith('client_entry_cta_clicked', {})
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

  it('classifies attribution from sanitized campaign evidence only', () => {
    expect(browserAttributionForAnalytics({ utm_source: 'threads' })).toEqual({
      source_type: 'campaign',
      utm_source: 'threads',
    })
    expect(browserAttributionForAnalytics({ utm_source: 'person@example.com' })).toEqual({
      source_type: 'direct',
    })
  })

  it('classifies sanitized external referrers as referral and unsafe referrers as direct', () => {
    expect(browserAttributionForAnalytics({ referrer: 'https://example.org/path?token=private' })).toEqual({
      source_type: 'referral',
      referrer_origin: 'https://example.org',
    })
    expect(browserAttributionForAnalytics({ referrer: 'mailto:person@example.com' })).toEqual({
      source_type: 'direct',
    })
  })

  it('classifies direct landings and keeps private paths out of analytics attribution', () => {
    expect(browserAttributionForAnalytics(undefined)).toEqual({ source_type: 'direct' })
    expect(
      browserAttributionForAnalytics({
        first_landing_path: '/guest/booking-time-proposal/private-token?access_token=private',
      })
    ).toEqual({ source_type: 'direct' })
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

  it('does not initialize or capture while consent is unknown or denied', () => {
    const provider = createProvider()
    const analytics = new ProductAnalytics()

    expect(analytics.initialize(enabledConfig, provider, 'unknown')).toBe(false)
    expect(analytics.capture('signup_started')).toBe(false)
    expect(analytics.setConsentPreference('denied', enabledConfig, provider)).toBe(false)
    expect(provider.init).not.toHaveBeenCalled()
    expect(provider.capture).not.toHaveBeenCalled()
  })

  it('reads a persisted explicit choice before initializing the provider', () => {
    const provider = createProvider()
    const analytics = new ProductAnalytics()

    window.localStorage.setItem(analyticsConsentStorageKey, JSON.stringify({ version: 1, preference: 'denied' }))
    expect(analytics.initialize(enabledConfig, provider)).toBe(false)
    expect(provider.init).not.toHaveBeenCalled()

    window.localStorage.setItem(analyticsConsentStorageKey, JSON.stringify({ version: 1, preference: 'allowed' }))
    expect(analytics.initialize(enabledConfig, provider)).toBe(true)
    expect(provider.init).toHaveBeenCalledOnce()
  })

  it('initializes only after allow, identifies the current specialist, and resets immediately on revoke', () => {
    const provider = createProvider()
    const analytics = new ProductAnalytics()
    const context = {
      subject_id: 'specialist:4a3bb3e7-6a3f-4ed2-9e7c-0f5a8d5d7436',
      attribution: { source_type: 'direct' as const },
    }

    analytics.identify(context)
    expect(analytics.setConsentPreference('allowed', enabledConfig, provider)).toBe(true)
    expect(provider.init).toHaveBeenCalledOnce()
    expect(provider.identify).toHaveBeenCalledWith(context.subject_id)
    expect(analytics.capture('profile_setup_opened')).toBe(true)

    expect(analytics.setConsentPreference('denied', enabledConfig, provider)).toBe(false)
    expect(provider.reset).toHaveBeenCalledOnce()
    expect(analytics.capture('profile_setup_opened')).toBe(false)

    expect(analytics.setConsentPreference('allowed', enabledConfig, provider)).toBe(true)
    expect(provider.init).toHaveBeenCalledTimes(2)
    expect(provider.identify).toHaveBeenCalledTimes(2)
  })
})
