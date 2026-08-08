export type AnalyticsConsentPreference = 'unknown' | 'allowed' | 'denied'

type AnalyticsConsentStorage = Pick<Storage, 'getItem' | 'setItem'>

type StoredAnalyticsConsent = {
  version: 1
  preference: Exclude<AnalyticsConsentPreference, 'unknown'>
}

export const analyticsConsentStorageKey = 'proconsult.product_analytics_consent.v1'

const listeners = new Set<(preference: AnalyticsConsentPreference) => void>()

function browserStorage(): AnalyticsConsentStorage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function isStoredAnalyticsConsent(value: unknown): value is StoredAnalyticsConsent {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<StoredAnalyticsConsent>
  return (
    candidate.version === 1 &&
    (candidate.preference === 'allowed' || candidate.preference === 'denied')
  )
}

export function getAnalyticsConsentPreference(
  storage: AnalyticsConsentStorage | null = browserStorage()
): AnalyticsConsentPreference {
  try {
    const raw = storage?.getItem(analyticsConsentStorageKey)
    if (!raw) return 'unknown'
    const parsed = JSON.parse(raw)
    return isStoredAnalyticsConsent(parsed) ? parsed.preference : 'unknown'
  } catch {
    return 'unknown'
  }
}

export function saveAnalyticsConsentPreference(
  preference: Exclude<AnalyticsConsentPreference, 'unknown'>,
  storage: AnalyticsConsentStorage | null = browserStorage()
): boolean {
  const record: StoredAnalyticsConsent = { version: 1, preference }
  try {
    storage?.setItem(analyticsConsentStorageKey, JSON.stringify(record))
  } catch {
    return false
  }

  if (!storage) return false
  for (const listener of listeners) listener(preference)
  return true
}

export function onAnalyticsConsentPreferenceChange(
  listener: (preference: AnalyticsConsentPreference) => void
): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
