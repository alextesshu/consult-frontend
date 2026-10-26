import { afterEach, describe, expect, it, vi } from 'vitest'
import { browserDisplayTimeZone, displayTimeZoneLabel, normalizeDisplayTimeZone } from './displayTimezone'

describe('displayTimezone', () => {
  afterEach(() => vi.restoreAllMocks())

  it('treats the legacy Europe/Kiev spelling as Kyiv', () => {
    expect(normalizeDisplayTimeZone('Europe/Kiev')).toBe('Europe/Kyiv')
    expect(normalizeDisplayTimeZone(' Europe/Kyiv ')).toBe('Europe/Kyiv')
    expect(normalizeDisplayTimeZone('Europe/Berlin')).toBe('Europe/Berlin')
    expect(normalizeDisplayTimeZone(undefined)).toBe('')
  })

  it('labels Kyiv and any other zone by the zone the slots are shown in', () => {
    expect(displayTimeZoneLabel('Europe/Kyiv')).toBe('Час за Києвом')
    expect(displayTimeZoneLabel('Europe/Kiev')).toBe('Час за Києвом')
    expect(displayTimeZoneLabel('Europe/Berlin')).toBe('Ваш місцевий час · Europe/Berlin')
    expect(displayTimeZoneLabel('America/New_York')).toBe('Ваш місцевий час · America/New_York')
    expect(displayTimeZoneLabel('')).toBe('Ваш місцевий час')
  })

  it('reads the browser zone (the test setup uses Europe/Kiev) and survives a missing Intl zone', () => {
    expect(browserDisplayTimeZone()).toBe('Europe/Kyiv')
    expect(displayTimeZoneLabel()).toBe('Час за Києвом')
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => ({ resolvedOptions: () => ({ timeZone: 'Asia/Tokyo' }) }) as unknown as Intl.DateTimeFormat)
    expect(displayTimeZoneLabel()).toBe('Ваш місцевий час · Asia/Tokyo')
  })
})
