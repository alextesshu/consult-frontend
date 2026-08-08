import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  captureSpecialistRegistrationFirstTouch,
  clearSpecialistRegistrationAttribution,
  specialistRegistrationAttributionStorageKey,
} from './registrationAttribution'

type TestStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function environment(options: Partial<{ href: string; origin: string; referrer: string; storage: TestStorage; now: () => number }> = {}) {
  return {
    href: 'https://proconsult.space/?utm_source=threads&utm_medium=organic_social&utm_campaign=sasha_profile&utm_content=threads_post',
    origin: 'https://proconsult.space',
    referrer: '',
    storage: window.localStorage,
    now: () => 1_000,
    ...options,
  }
}

describe('specialist registration first-touch attribution', () => {
  afterEach(() => {
    clearSpecialistRegistrationAttribution()
    window.localStorage.clear()
  })

  it('keeps UTM first touch after later navigation removes or changes query parameters', () => {
    const first = captureSpecialistRegistrationFirstTouch(environment())
    const later = captureSpecialistRegistrationFirstTouch(
      environment({ href: 'https://proconsult.space/signup?utm_source=facebook', now: () => 2_000 })
    )

    expect(first).toMatchObject({
      utm_source: 'threads',
      utm_medium: 'organic_social',
      utm_campaign: 'sasha_profile',
      utm_content: 'threads_post',
      first_landing_path: '/',
    })
    expect(later).toEqual(first)
  })

  it('stores a privacy-safe external referrer without UTM values', () => {
    const payload = captureSpecialistRegistrationFirstTouch(
      environment({ href: 'https://proconsult.space/specialists?token=ignored', referrer: 'https://example.org/a?email=private#fragment' })
    )

    expect(payload).toEqual({ referrer: 'https://example.org', first_landing_path: '/specialists' })
  })

  it('does not classify internal navigation as an external referrer', () => {
    expect(
      captureSpecialistRegistrationFirstTouch(
        environment({ href: 'https://proconsult.space/signup', referrer: 'https://proconsult.space/?utm_source=threads' })
      )
    ).toEqual({ first_landing_path: '/signup' })
  })

  it('drops sensitive UTM values and private first-landing paths', () => {
    expect(
      captureSpecialistRegistrationFirstTouch(
        environment({
          href: 'https://proconsult.space/guest/booking-time-proposal/private-token?utm_source=person%40example.com&utm_medium=0961292405&utm_campaign=access_token_value',
        })
      )
    ).toEqual({ first_landing_path: '' })
  })

  it('uses a bounded direct record and tolerates browser storage failures', () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new Error('blocked')
      }),
      removeItem: vi.fn(),
    }

    expect(captureSpecialistRegistrationFirstTouch(environment({ href: 'https://proconsult.space/register', storage }))).toEqual({
      first_landing_path: '/register',
    })
  })

  it('expires and retires the stored first-touch record', () => {
    captureSpecialistRegistrationFirstTouch(environment())
    expect(window.localStorage.getItem(specialistRegistrationAttributionStorageKey)).not.toBeNull()

    const afterExpiry = captureSpecialistRegistrationFirstTouch(
      environment({ href: 'https://proconsult.space/signup', now: () => 31 * 24 * 60 * 60 * 1000 })
    )
    expect(afterExpiry).toEqual({ first_landing_path: '/signup' })
  })
})
