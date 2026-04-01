import { describe, expect, it } from 'vitest'
import {
  hasSpecialistRole,
  isEntitlementOrCapabilityDeny,
  isSpecialistCriticalReconcileRoute,
} from './entitlementReconcile'

describe('entitlement reconcile helpers', () => {
  it('detects entitlement deny by code', () => {
    expect(
      isEntitlementOrCapabilityDeny({
        response: {
          status: 403,
          data: { code: 'OVER_LIMIT' },
        },
      })
    ).toBe(true)
  })

  it('detects capability deny by known detail', () => {
    expect(
      isEntitlementOrCapabilityDeny({
        response: {
          status: 403,
          data: { detail: 'Author journal is not enabled for current plan.' },
        },
      })
    ).toBe(true)
  })

  it('ignores unrelated deny errors', () => {
    expect(
      isEntitlementOrCapabilityDeny({
        response: {
          status: 403,
          data: { code: 'SESSION_NOT_FOUND' },
        },
      })
    ).toBe(false)
  })

  it('ignores non-403 statuses', () => {
    expect(
      isEntitlementOrCapabilityDeny({
        response: {
          status: 400,
          data: { code: 'OVER_LIMIT' },
        },
      })
    ).toBe(false)
  })

  it('marks only critical specialist routes for one-shot reconcile', () => {
    expect(isSpecialistCriticalReconcileRoute('/cabinet')).toBe(true)
    expect(isSpecialistCriticalReconcileRoute('/cabinet/billing')).toBe(true)
    expect(isSpecialistCriticalReconcileRoute('/cabinet/group-events')).toBe(true)
    expect(isSpecialistCriticalReconcileRoute('/cabinet/journal')).toBe(true)
    expect(isSpecialistCriticalReconcileRoute('/')).toBe(true)
    expect(isSpecialistCriticalReconcileRoute('/cabinet/sessions')).toBe(false)
    expect(isSpecialistCriticalReconcileRoute('/client')).toBe(false)
  })

  it('detects specialist role aliases', () => {
    expect(hasSpecialistRole(['SPECIALIST'])).toBe(true)
    expect(hasSpecialistRole(['THERAPIST'])).toBe(true)
    expect(hasSpecialistRole(['CLIENT'])).toBe(false)
    expect(hasSpecialistRole(null)).toBe(false)
  })
})
