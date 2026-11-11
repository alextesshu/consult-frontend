export type RegistrationAttributionPayload = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  referrer?: string
  first_landing_path?: string
}

type StoredRegistrationAttribution = {
  expiresAt: number
  payload: RegistrationAttributionPayload
}

type BrowserAttributionEnvironment = {
  href: string
  origin: string
  referrer: string
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null
  now?: () => number
}

const STORAGE_KEY = 'proconsult.specialist_registration_first_touch.v1'
const TTL_MS = 30 * 24 * 60 * 60 * 1000
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const
const UTM_MAX_LENGTH = 120
const LANDING_PATH_MAX_LENGTH = 300
const REFERRER_MAX_LENGTH = 255
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/g
const EMAIL_PATTERN = /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/
const PHONE_PATTERN = /(?<!\d)(?:\+?380|0\d{9}|[1-9]\d{9,14})(?!\d)/
const SENSITIVE_MARKER_PATTERN = /(?:access[_-]?token|auth(?:orization)?|bearer|password|secret|session[_-]?id)/i
const PRIVATE_PATH_PREFIXES = ['/admin', '/cabinet', '/client', '/guest', '/invite']

let inMemoryAttribution: StoredRegistrationAttribution | null = null

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  return value.replace(CONTROL_CHARACTERS, '').trim().slice(0, maxLength)
}

function cleanUtmValue(value: unknown): string {
  const cleaned = cleanText(value, UTM_MAX_LENGTH)
  if (!cleaned || EMAIL_PATTERN.test(cleaned) || PHONE_PATTERN.test(cleaned) || SENSITIVE_MARKER_PATTERN.test(cleaned)) {
    return ''
  }
  return cleaned
}

function normalizeLandingPath(href: string): string {
  try {
    const parsed = new URL(href)
    const path = cleanText(parsed.pathname || '/', LANDING_PATH_MAX_LENGTH)
    if (!path.startsWith('/') || path.startsWith('//')) return ''
    const normalized = path === '/' ? path : path.replace(/\/+$/, '')
    return PRIVATE_PATH_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`))
      ? ''
      : normalized
  } catch {
    return '/'
  }
}

function normalizeReferrer(referrer: string, currentOrigin: string): string {
  try {
    const parsed = new URL(referrer)
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin === currentOrigin) return ''
    return cleanText(parsed.origin, REFERRER_MAX_LENGTH)
  } catch {
    return ''
  }
}

function payloadFromEnvironment(environment: BrowserAttributionEnvironment): RegistrationAttributionPayload {
  let parsed: URL
  try {
    parsed = new URL(environment.href)
  } catch {
    return { first_landing_path: '/' }
  }

  const payload: RegistrationAttributionPayload = {
    first_landing_path: normalizeLandingPath(environment.href),
  }
  for (const key of UTM_KEYS) {
    const value = cleanUtmValue(parsed.searchParams.get(key))
    if (value) payload[key] = value
  }
  const referrer = normalizeReferrer(environment.referrer, environment.origin)
  if (referrer) payload.referrer = referrer
  return payload
}

function isStoredValue(value: unknown): value is StoredRegistrationAttribution {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<StoredRegistrationAttribution>
  return typeof candidate.expiresAt === 'number' && !!candidate.payload && typeof candidate.payload === 'object'
}

function readStored(environment: BrowserAttributionEnvironment): StoredRegistrationAttribution | null {
  const now = environment.now?.() ?? Date.now()
  if (inMemoryAttribution && inMemoryAttribution.expiresAt > now) return inMemoryAttribution
  if (inMemoryAttribution) inMemoryAttribution = null
  try {
    const raw = environment.storage?.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!isStoredValue(parsed) || parsed.expiresAt <= now) {
      environment.storage?.removeItem(STORAGE_KEY)
      return null
    }
    inMemoryAttribution = parsed
    return parsed
  } catch {
    return null
  }
}

function browserEnvironment(): BrowserAttributionEnvironment | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null
  let storage: BrowserAttributionEnvironment['storage'] = null
  try {
    storage = window.localStorage
  } catch {
    // The property getter can throw before any storage method is called.
  }
  return {
    href: window.location.href,
    origin: window.location.origin,
    referrer: document.referrer,
    storage,
  }
}

export function captureSpecialistRegistrationFirstTouch(
  environment = browserEnvironment()
): RegistrationAttributionPayload | undefined {
  if (!environment) return undefined
  const existing = readStored(environment)
  if (existing) return existing.payload

  const record: StoredRegistrationAttribution = {
    expiresAt: (environment.now?.() ?? Date.now()) + TTL_MS,
    payload: payloadFromEnvironment(environment),
  }
  inMemoryAttribution = record
  try {
    environment.storage?.setItem(STORAGE_KEY, JSON.stringify(record))
  } catch {
    // Storage is optional: first touch remains available for this page lifetime.
  }
  return record.payload
}

export function getSpecialistRegistrationAttribution(): RegistrationAttributionPayload | undefined {
  return captureSpecialistRegistrationFirstTouch()
}

export function clearSpecialistRegistrationAttribution(): void {
  inMemoryAttribution = null
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Browser storage failures must not affect completed registration.
  }
}

export const specialistRegistrationAttributionStorageKey = STORAGE_KEY
