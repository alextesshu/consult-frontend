import { afterEach, describe, expect, it } from 'vitest'
import {
  captureClientAcquisitionContext,
  clearClientAcquisitionContext,
  clientAcquisitionAttributionStorageKey,
  getClientAcquisitionContext,
  markClientAcquisitionDiscoveryUsed,
} from './clientAcquisitionAttribution'

describe('client acquisition first touch', () => {
  afterEach(() => {
    clearClientAcquisitionContext()
    sessionStorage.clear()
  })

  it('captures campaign attribution and preserves it across SPA navigation', () => {
    const first = captureClientAcquisitionContext({
      href: 'https://proconsult.space/?utm_source=instagram&utm_campaign=summer',
      origin: 'https://proconsult.space', referrer: '',
    })
    const later = captureClientAcquisitionContext({
      href: 'https://proconsult.space/s/olena', origin: 'https://proconsult.space', referrer: '',
    })
    expect(first).toMatchObject({ utm_source: 'instagram', utm_campaign: 'summer', first_landing_path: '/' })
    expect(later).toEqual(first)
  })

  it('captures direct profile UTM, accepts an external origin only, and marks discovery without replacing campaign', () => {
    captureClientAcquisitionContext({
      href: 'https://proconsult.space/s/olena?utm_medium=cpc',
      origin: 'https://proconsult.space', referrer: 'https://example.org/path?private=value',
    })
    expect(markClientAcquisitionDiscoveryUsed()).toMatchObject({
      utm_medium: 'cpc', referrer: 'https://example.org', first_landing_path: '/s/olena', used_proconsult_discovery: true,
    })
  })

  it('does not persist unsafe fields or private routes', () => {
    captureClientAcquisitionContext({
      href: 'https://proconsult.space/cabinet?utm_source=person@example.com&utm_campaign=access_token',
      origin: 'https://proconsult.space', referrer: 'https://proconsult.space/private',
    })
    expect(getClientAcquisitionContext()).toBeNull()
    expect(sessionStorage.getItem(clientAcquisitionAttributionStorageKey)).toBeNull()
  })
})
