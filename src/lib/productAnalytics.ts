import posthog from 'posthog-js/dist/module.no-external'
import type { RegistrationAttributionPayload } from './registrationAttribution'
import {
  getAnalyticsConsentPreference,
  type AnalyticsConsentPreference,
} from './analyticsConsent'
import { captureEmailVerificationTokenFromLocation } from './emailVerificationToken'

export type ProductAnalyticsEvent =
  | 'landing_viewed'
  | 'signup_started'
  | 'signup_completed'
  | 'specialist_activated'
  | 'profile_setup_opened'
  | 'profile_section_opened'
  | 'readiness_item_completed'
  | 'profile_became_ready'
  | 'publish_cta_viewed'
  | 'publish_cta_clicked'
  | 'profile_publish_succeeded'
  | 'profile_publish_failed'
  | 'search_visibility_cta_viewed'
  | 'search_visibility_enabled'
  | 'search_visibility_disabled'
  | 'share_profile_clicked'
  | 'client_entry_cta_clicked'
  | 'specialist_discovery_opened'
  | 'specialist_discovery_results_viewed'
  | 'specialist_profile_opened'
  | 'client_contact_cta_engaged'
  | 'client_request_succeeded'
  | 'client_booking_succeeded'

export type AnalyticsAttribution = {
  source_type?: 'direct' | 'campaign' | 'referral' | 'manual'
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  referrer_origin?: string
  first_landing_path?: string
}

export type SpecialistAnalyticsContext = {
  subject_id: string
  attribution: AnalyticsAttribution | null
}

export type ProductAnalyticsProperties = Record<string, string>

export type ProductAnalyticsProvider = {
  init: (token: string, options: Record<string, unknown>) => void
  capture: (event: string, properties?: Record<string, unknown>) => void
  identify: (subjectId: string) => void
  reset: () => void
}

export type ProviderEvent = {
  event?: unknown
  properties?: Record<string, unknown>
  [key: string]: unknown
}

export type ProductAnalyticsConfig = {
  enabled: boolean
  projectToken: string
  apiHost: string
}

export const POSTHOG_EU_INGESTION_HOST = 'https://eu.i.posthog.com'

const UTM_PROPERTY_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'referrer_origin',
  'first_landing_path',
] as const

const EVENT_PROPERTY_ALLOWLIST: Record<ProductAnalyticsEvent, readonly string[]> = {
  landing_viewed: ['landing_route', 'source_type', ...UTM_PROPERTY_KEYS],
  signup_started: [],
  signup_completed: ['source_type', ...UTM_PROPERTY_KEYS],
  specialist_activated: ['source_type', ...UTM_PROPERTY_KEYS],
  profile_setup_opened: ['source_type', ...UTM_PROPERTY_KEYS],
  profile_section_opened: ['section', 'source_type', ...UTM_PROPERTY_KEYS],
  readiness_item_completed: ['item', 'source_type', ...UTM_PROPERTY_KEYS],
  profile_became_ready: ['source_type', ...UTM_PROPERTY_KEYS],
  publish_cta_viewed: ['source_type', ...UTM_PROPERTY_KEYS],
  publish_cta_clicked: ['source_type', ...UTM_PROPERTY_KEYS],
  profile_publish_succeeded: ['source_type', ...UTM_PROPERTY_KEYS],
  profile_publish_failed: ['error_code', 'source_type', ...UTM_PROPERTY_KEYS],
  search_visibility_cta_viewed: ['source_type', ...UTM_PROPERTY_KEYS],
  search_visibility_enabled: ['source_type', ...UTM_PROPERTY_KEYS],
  search_visibility_disabled: ['source_type', ...UTM_PROPERTY_KEYS],
  share_profile_clicked: ['destination', 'source_type', ...UTM_PROPERTY_KEYS],
  client_entry_cta_clicked: [],
  specialist_discovery_opened: [],
  specialist_discovery_results_viewed: [],
  specialist_profile_opened: [],
  client_contact_cta_engaged: ['contact_mode'],
  client_request_succeeded: ['contact_mode'],
  client_booking_succeeded: ['contact_mode'],
}

const LANDING_ROUTES = new Set(['home', 'specialist_signup'])
const PROFILE_SECTIONS = new Set([
  'publication',
  'search_visibility',
  'basics',
  'media',
  'public_sections',
  'contacts',
  'documents',
])
const READINESS_ITEMS = new Set([
  'public_name',
  'short_description',
  'topics',
  'work_format',
  'base_price',
  'first_contact_mode',
])
const PUBLICATION_ERROR_CODES = new Set(['not_ready', 'validation', 'network', 'server', 'unknown'])
const SHARE_DESTINATIONS = new Set([
  'copy_link',
  'native_share',
  'telegram',
  'facebook',
  'threads',
  'other_approved',
])
const CONTACT_MODES = new Set(['request_only', 'direct_booking'])
const SOURCE_TYPES = new Set(['direct', 'campaign', 'referral', 'manual'])
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/g
const EMAIL_PATTERN = /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/
const PHONE_PATTERN = /(?<!\d)(?:\+?380|0\d{9}|[1-9]\d{9,14})(?!\d)/
const SENSITIVE_PATTERN = /(?:access[_-]?token|auth(?:orization)?|bearer|password|secret|session[_-]?id)/i
const PROVIDER_SYSTEM_PROPERTIES = new Set([
  'token',
  'distinct_id',
  '$lib',
  '$lib_version',
  '$insert_id',
  '$device_id',
  '$session_id',
  '$window_id',
  '$anon_distinct_id',
  '$identified_state',
  '$process_person_profile',
])
const IDENTIFY_PROVIDER_PROPERTIES = new Set([
  'token',
  'distinct_id',
  '$anon_distinct_id',
  '$process_person_profile',
])

function cleanSafeText(value: unknown, maxLength = 120): string {
  if (typeof value !== 'string') return ''
  const cleaned = value.replace(CONTROL_CHARACTERS, '').trim().slice(0, maxLength)
  if (
    !cleaned ||
    EMAIL_PATTERN.test(cleaned) ||
    PHONE_PATTERN.test(cleaned) ||
    SENSITIVE_PATTERN.test(cleaned) ||
    cleaned.includes('://')
  ) {
    return ''
  }
  return cleaned
}

function normalizeReferrerOrigin(value: unknown): string {
  if (typeof value !== 'string') return ''
  try {
    const parsed = new URL(value)
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) return ''
    return parsed.origin
  } catch {
    return ''
  }
}

function normalizeLandingPath(value: unknown): string {
  if (typeof value !== 'string') return ''
  const pathWithoutQuery = value.split('?', 1)[0] || ''
  const path = (pathWithoutQuery.split('#', 1)[0] || '').trim()
  if (!path.startsWith('/') || path.startsWith('//') || path.length > 300) return ''
  if (/\/(?:invite|guest|client|admin|cabinet)(?:\/|$)/.test(path)) return ''
  if (EMAIL_PATTERN.test(path) || PHONE_PATTERN.test(path) || SENSITIVE_PATTERN.test(path)) return ''
  return path === '/' ? '/' : path.replace(/\/+$/, '')
}

function sanitizeAttribution(value: AnalyticsAttribution | null | undefined): AnalyticsAttribution {
  if (value?.source_type === 'manual') return { source_type: 'manual' }

  const safe: AnalyticsAttribution = {}
  if (!value || typeof value !== 'object') return { source_type: 'direct' }
  for (const key of UTM_PROPERTY_KEYS) {
    const raw = value[key]
    const normalized = key === 'referrer_origin'
      ? normalizeReferrerOrigin(raw)
      : key === 'first_landing_path'
        ? normalizeLandingPath(raw)
        : cleanSafeText(raw)
    if (normalized) safe[key] = normalized
  }
  const hasCampaignEvidence = [
    safe.utm_source,
    safe.utm_medium,
    safe.utm_campaign,
    safe.utm_content,
    safe.utm_term,
  ].some(Boolean)
  return {
    source_type: hasCampaignEvidence
      ? 'campaign'
      : safe.referrer_origin
        ? 'referral'
        : 'direct',
    ...safe,
  }
}

function isApprovedPropertyValue(key: string, value: unknown): value is string {
  if (typeof value !== 'string') return false
  if (key === 'landing_route') return LANDING_ROUTES.has(value)
  if (key === 'section') return PROFILE_SECTIONS.has(value)
  if (key === 'item') return READINESS_ITEMS.has(value)
  if (key === 'error_code') return PUBLICATION_ERROR_CODES.has(value)
  if (key === 'destination') return SHARE_DESTINATIONS.has(value)
  if (key === 'contact_mode') return CONTACT_MODES.has(value)
  if (key === 'source_type') return SOURCE_TYPES.has(value)
  if (key === 'referrer_origin') return Boolean(normalizeReferrerOrigin(value))
  if (key === 'first_landing_path') return Boolean(normalizeLandingPath(value))
  return Boolean(cleanSafeText(value))
}

function normalizePropertyValue(key: string, value: string): string {
  if (key === 'referrer_origin') return normalizeReferrerOrigin(value)
  if (key === 'first_landing_path') return normalizeLandingPath(value)
  return value
}

function sanitizeEventProperties(
  event: ProductAnalyticsEvent,
  properties: ProductAnalyticsProperties
): ProductAnalyticsProperties | null {
  const allowed = new Set(EVENT_PROPERTY_ALLOWLIST[event])
  const entries = Object.entries(properties)
  if (entries.some(([key]) => !allowed.has(key))) return null

  const sanitized: ProductAnalyticsProperties = {}
  for (const [key, value] of entries) {
    if (!isApprovedPropertyValue(key, value)) return null
    const normalized = normalizePropertyValue(key, value)
    if (!normalized) return null
    sanitized[key] = normalized
  }
  return sanitized
}

export function sanitizeProviderEvent(event: ProviderEvent): ProviderEvent | null {
  if (event.event === '$identify') {
    const { $set: _setProperties, $set_once: _setOnceProperties, ...eventWithoutPersonProperties } = event
    const properties: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(event.properties || {})) {
      if (!IDENTIFY_PROVIDER_PROPERTIES.has(key)) continue
      if (key === '$process_person_profile') {
        if (typeof value === 'boolean') properties[key] = value
        continue
      }
      if (typeof value === 'string' && cleanSafeText(value)) properties[key] = value
    }
    return {
      ...eventWithoutPersonProperties,
      properties: {
        ...properties,
        $geoip_disable: true,
      },
    }
  }
  if (typeof event.event !== 'string' || !(event.event in EVENT_PROPERTY_ALLOWLIST)) return null
  const eventName = event.event as ProductAnalyticsEvent
  const source = event.properties || {}
  const allowed = new Set(EVENT_PROPERTY_ALLOWLIST[eventName])
  const properties: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(source)) {
    if (PROVIDER_SYSTEM_PROPERTIES.has(key)) {
      properties[key] = value
      continue
    }
    if (!allowed.has(key) || !isApprovedPropertyValue(key, value)) continue
    const normalized = normalizePropertyValue(key, value)
    if (normalized) properties[key] = normalized
  }
  return {
    ...event,
    properties: {
      ...properties,
      $geoip_disable: true,
    },
  }
}

export function getProductAnalyticsConfig(
  environment: Record<string, unknown> = import.meta.env
): ProductAnalyticsConfig {
  const projectToken = String(environment.VITE_POSTHOG_PROJECT_TOKEN || '').trim()
  const enabled = String(environment.VITE_PRODUCT_ANALYTICS_ENABLED || '').toLowerCase() === 'true'
  const mode = String(environment.MODE || '')
  const configuredApiHost = String(environment.VITE_POSTHOG_API_HOST || '').trim()
  const apiHost = configuredApiHost || POSTHOG_EU_INGESTION_HOST
  return {
    enabled:
      enabled &&
      Boolean(projectToken) &&
      Boolean(configuredApiHost) &&
      mode !== 'test' &&
      apiHost === POSTHOG_EU_INGESTION_HOST,
    projectToken,
    apiHost,
  }
}

export function normalizedLandingRoute(pathname: string): 'home' | 'specialist_signup' | null {
  const pathWithoutQuery = String(pathname || '').split('?', 1)[0] || ''
  const path = pathWithoutQuery.split('#', 1)[0] || ''
  if (path === '/') return 'home'
  if (path === '/signup') return 'specialist_signup'
  return null
}

export function browserAttributionForAnalytics(
  attribution: RegistrationAttributionPayload | undefined
): AnalyticsAttribution {
  return sanitizeAttribution({
    utm_source: attribution?.utm_source,
    utm_medium: attribution?.utm_medium,
    utm_campaign: attribution?.utm_campaign,
    utm_content: attribution?.utm_content,
    utm_term: attribution?.utm_term,
    referrer_origin: attribution?.referrer,
    first_landing_path: attribution?.first_landing_path,
  })
}

export class ProductAnalytics {
  private provider: ProductAnalyticsProvider | null = null
  private initialized = false
  private specialistContext: SpecialistAnalyticsContext | null = null
  private lastIdentifiedSubjectId: string | null = null

  initialize(
    config = getProductAnalyticsConfig(),
    provider: ProductAnalyticsProvider = posthog as unknown as ProductAnalyticsProvider,
    preference: AnalyticsConsentPreference = getAnalyticsConsentPreference()
  ): boolean {
    captureEmailVerificationTokenFromLocation()
    if (preference !== 'allowed' || !config.enabled) return false
    if (this.initialized) return true
    try {
      provider.init(config.projectToken, {
        api_host: POSTHOG_EU_INGESTION_HOST,
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
      this.provider = provider
      this.initialized = true
      this.identifyCurrentSpecialist()
      return true
    } catch {
      this.provider = null
      this.initialized = false
      return false
    }
  }

  identify(context: SpecialistAnalyticsContext | null | undefined): void {
    if (!context || !/^specialist:[0-9a-f-]{36}$/i.test(context.subject_id)) return
    this.specialistContext = {
      subject_id: context.subject_id,
      attribution: sanitizeAttribution(context.attribution),
    }
    this.identifyCurrentSpecialist()
  }

  private identifyCurrentSpecialist(): void {
    const subjectId = this.specialistContext?.subject_id
    if (!this.initialized || !this.provider || !subjectId || this.lastIdentifiedSubjectId === subjectId) return
    // Reserve before calling the SDK: it may re-enter or throw after sending.
    this.lastIdentifiedSubjectId = subjectId
    try {
      this.provider.identify(subjectId)
    } catch {
      // Analytics must never interfere with authentication or product actions.
    }
  }

  capture(event: ProductAnalyticsEvent, properties: ProductAnalyticsProperties = {}): boolean {
    if (!this.initialized || !this.provider) return false
    const mergedProperties = {
      ...(this.specialistContext?.attribution || {}),
      ...properties,
    }
    const sanitized = sanitizeEventProperties(event, mergedProperties)
    if (!sanitized) return false
    try {
      this.provider.capture(event, sanitized)
      return true
    } catch {
      return false
    }
  }

  reset(): void {
    this.specialistContext = null
    this.disableProvider()
  }

  setConsentPreference(
    preference: AnalyticsConsentPreference,
    config = getProductAnalyticsConfig(),
    provider: ProductAnalyticsProvider = posthog as unknown as ProductAnalyticsProvider
  ): boolean {
    if (preference !== 'allowed') {
      this.disableProvider()
      return false
    }
    return this.initialize(config, provider, preference)
  }

  private disableProvider(): void {
    const provider = this.provider
    this.provider = null
    this.initialized = false
    this.lastIdentifiedSubjectId = null
    try {
      provider?.reset()
    } catch {
      // Consent changes and logout must not affect product actions.
    }
  }
}

export const productAnalytics = new ProductAnalytics()
