import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  analyticsConsentStorageKey,
  getAnalyticsConsentPreference,
  onAnalyticsConsentPreferenceChange,
  saveAnalyticsConsentPreference,
} from './analyticsConsent'

describe('analytics consent preference', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it('defaults to unknown and rejects malformed persisted data', () => {
    expect(getAnalyticsConsentPreference()).toBe('unknown')
    window.localStorage.setItem(analyticsConsentStorageKey, JSON.stringify({ version: 1, preference: 'enabled' }))
    expect(getAnalyticsConsentPreference()).toBe('unknown')
  })

  it('persists only an explicit allowed or denied choice', () => {
    expect(saveAnalyticsConsentPreference('allowed')).toBe(true)
    expect(getAnalyticsConsentPreference()).toBe('allowed')

    expect(saveAnalyticsConsentPreference('denied')).toBe(true)
    expect(getAnalyticsConsentPreference()).toBe('denied')
  })

  it('fails closed when browser storage cannot save the choice', () => {
    const failingStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new Error('storage unavailable')
      }),
    }

    expect(saveAnalyticsConsentPreference('allowed', failingStorage)).toBe(false)
    expect(getAnalyticsConsentPreference(failingStorage)).toBe('unknown')
  })

  it('notifies the application only after a stored explicit choice', () => {
    const listener = vi.fn()
    const unsubscribe = onAnalyticsConsentPreferenceChange(listener)

    saveAnalyticsConsentPreference('allowed')
    unsubscribe()
    saveAnalyticsConsentPreference('denied')

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith('allowed')
  })
})
