import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  captureSpecialistRegistrationFirstTouch,
  clearSpecialistRegistrationAttribution,
  getSpecialistRegistrationAttribution,
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
    vi.restoreAllMocks()
    clearSpecialistRegistrationAttribution()
    window.localStorage.clear()
    window.history.replaceState({}, '', '/')
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

  it('preserves first touch in memory when the localStorage getter throws', () => {
    window.history.replaceState({}, '', '/signup?utm_source=threads')
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('Storage denied', 'SecurityError')
    })

    expect(captureSpecialistRegistrationFirstTouch()).toEqual({
      first_landing_path: '/signup', utm_source: 'threads',
    })
    window.history.replaceState({}, '', '/login?utm_source=facebook')
    expect(getSpecialistRegistrationAttribution()).toEqual({
      first_landing_path: '/signup', utm_source: 'threads',
    })
    expect(() => clearSpecialistRegistrationAttribution()).not.toThrow()
  })

  it('still writes first touch when reading storage throws', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Read denied', 'SecurityError')
    })
    window.history.replaceState({}, '', '/signup?utm_source=threads')

    const payload = captureSpecialistRegistrationFirstTouch()
    expect(setItem).toHaveBeenCalledWith(specialistRegistrationAttributionStorageKey, expect.any(String))
    const record = JSON.parse(setItem.mock.calls[0]![1])
    expect(record.payload).toEqual(payload)
    expect(record.expiresAt).toBeGreaterThan(Date.now())
  })

  it('still reads storage and retains memory when writing storage throws', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Write denied', 'SecurityError')
    })
    window.history.replaceState({}, '', '/signup?utm_source=threads')

    const first = captureSpecialistRegistrationFirstTouch()
    expect(getItem).toHaveBeenCalledWith(specialistRegistrationAttributionStorageKey)
    window.history.replaceState({}, '', '/login?utm_source=facebook')
    expect(getSpecialistRegistrationAttribution()).toEqual(first)
  })

  it('reads an unexpired stored record without replacing first touch or extending its TTL', () => {
    const record = {
      expiresAt: Date.now() + 60_000,
      payload: { first_landing_path: '/specialists', utm_source: 'threads' },
    }
    const raw = JSON.stringify(record)
    window.localStorage.setItem(specialistRegistrationAttributionStorageKey, raw)
    window.history.replaceState({}, '', '/signup?utm_source=facebook')
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    expect(captureSpecialistRegistrationFirstTouch()).toEqual(record.payload)
    expect(setItem).not.toHaveBeenCalled()
    expect(window.localStorage.getItem(specialistRegistrationAttributionStorageKey)).toBe(raw)
  })

  it('does not swallow unrelated environment errors', () => {
    const failure = new Error('Clock failure')
    expect(() => captureSpecialistRegistrationFirstTouch(environment({ now: () => { throw failure } }))).toThrow(failure)
  })

  it.each(['v1', 'v2'])('mounts the application with a denied storage getter in %s', async (version) => {
    vi.resetModules()
    const { h } = await import('vue')
    const { createRouter, createWebHistory } = await import('vue-router')
    window.history.replaceState({}, '', `/login?utm_source=threads${version === 'v2' ? '&ui=v2' : ''}`)
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/login', component: { render: () => null } }],
    })
    const restoreSession = vi.fn(() => Promise.resolve())
    vi.doMock('../App.vue', () => ({ default: { render: () => h('main', { id: 'attribution-bootstrap-mounted' }, 'Mounted') } }))
    vi.doMock('../router', () => ({ default: router }))
    vi.doMock('../stores/auth', () => ({ useAuthStore: () => ({
      initFromStorage: () => window.localStorage.removeItem('legacy'), restoreSession,
    }) }))
    vi.doMock('./productAnalytics', () => ({
      browserAttributionForAnalytics: () => ({}), normalizedLandingRoute: () => null,
      productAnalytics: { capture: vi.fn(), setConsentPreference: vi.fn() },
    }))
    document.body.innerHTML = '<div id="app"></div>'
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('Storage denied', 'SecurityError')
    })
    try {
      // Keep the real attribution module on the actual main.ts bootstrap path.
      await import('../main')
      await vi.waitFor(() => expect(document.querySelector('#app #attribution-bootstrap-mounted')).not.toBeNull())
      expect(document.documentElement.dataset.ui).toBe(version)
      expect(restoreSession).toHaveBeenCalledOnce()
      const attribution = await import('./registrationAttribution')
      expect(attribution.getSpecialistRegistrationAttribution()).toEqual({
        first_landing_path: '/login', utm_source: 'threads',
      })
      attribution.clearSpecialistRegistrationAttribution()
    } finally {
      router.options.history.destroy()
      document.body.innerHTML = ''
      delete document.documentElement.dataset.ui
      for (const module of ['../App.vue', '../router', '../stores/auth', './productAnalytics']) vi.doUnmock(module)
      vi.resetModules()
    }
  })
})
