import { describe, expect, it } from 'vitest'
import {
  buildSpecialistOnboardingViewModel,
  CTA_TARGET_ROUTE_KEYS,
  MISSING_ITEM_COPY,
  normalizeOnboardingState,
  PRIMARY_CTA_CODE_COPY,
  WARNING_CODE_COPY,
} from './specialistOnboarding'

describe('specialist onboarding mapping', () => {
  it('keeps canonical copy mappings for known enums and route keys', () => {
    expect(MISSING_ITEM_COPY.PROFILE_CORE_INCOMPLETE).toBeTruthy()
    expect(WARNING_CODE_COPY.PUBLIC_MEDIA_VISIBILITY_INCONSISTENT).toBeTruthy()
    expect(PRIMARY_CTA_CODE_COPY.COMPLETE_PROFILE_CORE).toBeTruthy()
    expect(CTA_TARGET_ROUTE_KEYS.CABINET_PROFILE).toBe('/cabinet/profile')
  })

  it('normalizes payload and builds a view model with primary cta', () => {
    const normalized = normalizeOnboardingState({
      readiness: false,
      missing_items: [{ code: 'PROFILE_CORE_INCOMPLETE' }],
      warnings: [{ code: 'PUBLIC_MEDIA_VISIBILITY_INCONSISTENT' }],
      next_actions: [{ cta_code: 'CONFIGURE_AVAILABILITY', cta_target: 'CABINET_AVAILABILITY_RULES' }],
      primary_cta_code: 'COMPLETE_PROFILE_CORE',
      cta_target: 'CABINET_PROFILE',
    })

    expect(normalized).not.toBeNull()
    const viewModel = buildSpecialistOnboardingViewModel(normalized!)
    expect(viewModel.readiness).toBe(false)
    expect(viewModel.primaryCta?.label).toBe('Complete profile')
    expect(viewModel.primaryCta?.to).toBe('/cabinet/profile')
    expect(viewModel.nextActions[0]?.to).toBe('/cabinet/availability-rules')
  })

  it('handles state: profile incomplete', () => {
    const vm = buildSpecialistOnboardingViewModel(
      normalizeOnboardingState({
        readiness: false,
        missing_items: [{ code: 'PROFILE_CORE_INCOMPLETE' }],
        warnings: [],
        next_actions: [],
        primary_cta_code: 'COMPLETE_PROFILE_CORE',
        cta_target: 'CABINET_PROFILE',
      })!
    )

    expect(vm.steps.find((s) => s.key === 'profile_core')?.done).toBe(false)
    expect(vm.primaryCta?.to).toBe('/cabinet/profile')
  })

  it('handles state: profile ready but no future slots', () => {
    const vm = buildSpecialistOnboardingViewModel(
      normalizeOnboardingState({
        readiness: false,
        missing_items: [{ code: 'MISSING_FUTURE_SLOTS' }],
        warnings: [],
        next_actions: [],
        primary_cta_code: 'CONFIGURE_AVAILABILITY',
        cta_target: 'CABINET_AVAILABILITY_RULES',
      })!
    )

    expect(vm.steps.find((s) => s.key === 'profile_core')?.done).toBe(true)
    expect(vm.steps.find((s) => s.key === 'availability')?.done).toBe(false)
    expect(vm.primaryCta?.to).toBe('/cabinet/availability-rules')
  })

  it('handles state: slots ready but public profile disabled', () => {
    const vm = buildSpecialistOnboardingViewModel(
      normalizeOnboardingState({
        readiness: false,
        missing_items: [{ code: 'PUBLIC_PROFILE_DISABLED' }],
        warnings: [],
        next_actions: [],
        primary_cta_code: 'ENABLE_PUBLIC_PROFILE',
        cta_target: 'CABINET_PROFILE',
      })!
    )

    expect(vm.steps.find((s) => s.key === 'availability')?.done).toBe(true)
    expect(vm.steps.find((s) => s.key === 'public_profile')?.done).toBe(false)
  })

  it('handles state: fully ready for inbound intent', () => {
    const vm = buildSpecialistOnboardingViewModel(
      normalizeOnboardingState({
        readiness: true,
        missing_items: [],
        warnings: [],
        next_actions: [],
        primary_cta_code: null,
        cta_target: null,
      })!
    )

    expect(vm.readiness).toBe(true)
    expect(vm.steps.every((step) => step.done)).toBe(true)
  })
})

