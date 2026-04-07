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
  it('keeps contract-aligned copy and route mappings', () => {
    expect(MISSING_ITEM_COPY.MISSING_DISPLAY_NAME).toBeTruthy()
    expect(MISSING_ITEM_COPY.MISSING_SPECIALIZATION).toBeTruthy()
    expect(MISSING_ITEM_COPY.MISSING_CONTACT_CHANNEL).toBeTruthy()
    expect(MISSING_ITEM_COPY.MISSING_SESSION_FORMAT).toBeTruthy()
    expect(MISSING_ITEM_COPY.MISSING_FUTURE_SLOTS).toBeTruthy()
    expect(MISSING_ITEM_COPY.PUBLIC_PROFILE_DISABLED).toBeTruthy()

    expect(WARNING_CODE_COPY.PROFILE_CORE_INCOMPLETE).toBeTruthy()
    expect(WARNING_CODE_COPY.PUBLISHED_WITHOUT_BOOKABLE_TIME).toBeTruthy()
    expect(WARNING_CODE_COPY.NO_BOOKABLE_TIME).toBeTruthy()
    expect(WARNING_CODE_COPY.PUBLIC_PROFILE_OFF).toBeTruthy()

    expect(PRIMARY_CTA_CODE_COPY.COMPLETE_PROFILE).toBeTruthy()
    expect(PRIMARY_CTA_CODE_COPY.ADD_AVAILABILITY).toBeTruthy()
    expect(PRIMARY_CTA_CODE_COPY.OPEN_PUBLIC_PROFILE).toBeTruthy()
    expect(PRIMARY_CTA_CODE_COPY.VIEW_PUBLIC_PROFILE).toBeTruthy()

    expect(CTA_TARGET_ROUTE_KEYS.CABINET_PROFILE).toBe('/cabinet/profile')
    expect(CTA_TARGET_ROUTE_KEYS.CABINET_AVAILABILITY).toBe('/cabinet/availability-rules')
    expect(CTA_TARGET_ROUTE_KEYS.CABINET_PUBLIC_PROFILE).toBe('/cabinet/profile')
    expect(CTA_TARGET_ROUTE_KEYS.PUBLIC_PROFILE_VIEW).toBe('/public')
  })

  it('normalizes canonical payload and renders primary CTA from strict priority data', () => {
    const normalized = normalizeOnboardingState({
      readiness: {
        profile_core_ready: true,
        has_future_slots: false,
        public_profile_enabled: true,
        ready_for_inbound_intent: false,
      },
      missing_items: ['MISSING_FUTURE_SLOTS'],
      warnings: [
        {
          code: 'PUBLISHED_WITHOUT_BOOKABLE_TIME',
          default_message: 'Profile is public, but clients cannot book yet.',
        },
      ],
      next_actions: [{ code: 'ADD_AVAILABILITY', target: 'CABINET_AVAILABILITY', priority: 2 }],
      primary_cta_code: 'ADD_AVAILABILITY',
    })

    expect(normalized).not.toBeNull()
    const viewModel = buildSpecialistOnboardingViewModel(normalized!)
    expect(viewModel.readiness).toBe(false)
    expect(viewModel.primaryCta?.code).toBe('ADD_AVAILABILITY')
    expect(viewModel.primaryCta?.to).toBe('/cabinet/availability-rules')
    expect(viewModel.warnings[0]).toContain('клієнти поки не можуть')
  })

  it('handles state: profile incomplete', () => {
    const vm = buildSpecialistOnboardingViewModel(
      normalizeOnboardingState({
        readiness: {
          profile_core_ready: false,
          has_future_slots: false,
          public_profile_enabled: false,
          ready_for_inbound_intent: false,
        },
        missing_items: [
          'MISSING_DISPLAY_NAME',
          'MISSING_SPECIALIZATION',
          'MISSING_CONTACT_CHANNEL',
          'MISSING_FUTURE_SLOTS',
          'PUBLIC_PROFILE_DISABLED',
        ],
        warnings: [{ code: 'PROFILE_CORE_INCOMPLETE' }],
        next_actions: [
          { code: 'COMPLETE_PROFILE', target: 'CABINET_PROFILE', priority: 1 },
          { code: 'ADD_AVAILABILITY', target: 'CABINET_AVAILABILITY', priority: 2 },
        ],
        primary_cta_code: 'COMPLETE_PROFILE',
      })!
    )

    expect(vm.steps.find((s) => s.key === 'profile_core')?.done).toBe(false)
    expect(vm.steps.find((s) => s.key === 'availability')?.done).toBe(false)
    expect(vm.steps.find((s) => s.key === 'public_profile')?.done).toBe(false)
    expect(vm.steps.find((s) => s.key === 'inbound_readiness')?.done).toBe(false)
    expect(vm.primaryCta?.to).toBe('/cabinet/profile')
  })

  it('handles state: profile ready but missing future slots', () => {
    const vm = buildSpecialistOnboardingViewModel(
      normalizeOnboardingState({
        readiness: {
          profile_core_ready: true,
          has_future_slots: false,
          public_profile_enabled: true,
          ready_for_inbound_intent: false,
        },
        missing_items: ['MISSING_FUTURE_SLOTS'],
        warnings: [{ code: 'PUBLISHED_WITHOUT_BOOKABLE_TIME' }],
        next_actions: [{ code: 'ADD_AVAILABILITY', target: 'CABINET_AVAILABILITY', priority: 2 }],
        primary_cta_code: 'ADD_AVAILABILITY',
      })!
    )

    expect(vm.steps.find((s) => s.key === 'profile_core')?.done).toBe(true)
    expect(vm.steps.find((s) => s.key === 'availability')?.done).toBe(false)
    expect(vm.steps.find((s) => s.key === 'public_profile')?.done).toBe(true)
    expect(vm.steps.find((s) => s.key === 'inbound_readiness')?.done).toBe(false)
    expect(vm.primaryCta?.to).toBe('/cabinet/availability-rules')
  })

  it('handles state: slots ready but public profile disabled', () => {
    const vm = buildSpecialistOnboardingViewModel(
      normalizeOnboardingState({
        readiness: {
          profile_core_ready: true,
          has_future_slots: true,
          public_profile_enabled: false,
          ready_for_inbound_intent: false,
        },
        missing_items: ['PUBLIC_PROFILE_DISABLED'],
        warnings: [{ code: 'PUBLIC_PROFILE_OFF' }],
        next_actions: [{ code: 'OPEN_PUBLIC_PROFILE', target: 'CABINET_PUBLIC_PROFILE', priority: 3 }],
        primary_cta_code: 'OPEN_PUBLIC_PROFILE',
      })!
    )

    expect(vm.steps.find((s) => s.key === 'profile_core')?.done).toBe(true)
    expect(vm.steps.find((s) => s.key === 'availability')?.done).toBe(true)
    expect(vm.steps.find((s) => s.key === 'public_profile')?.done).toBe(false)
    expect(vm.steps.find((s) => s.key === 'inbound_readiness')?.done).toBe(false)
    expect(vm.primaryCta?.to).toBe('/cabinet/profile')
  })

  it('handles state: fully ready for inbound intent', () => {
    const vm = buildSpecialistOnboardingViewModel(
      normalizeOnboardingState({
        readiness: {
          profile_core_ready: true,
          has_future_slots: true,
          public_profile_enabled: true,
          ready_for_inbound_intent: true,
        },
        missing_items: [],
        warnings: [],
        next_actions: [{ code: 'VIEW_PUBLIC_PROFILE', target: 'PUBLIC_PROFILE_VIEW', priority: 1 }],
        primary_cta_code: 'VIEW_PUBLIC_PROFILE',
      })!
    )

    expect(vm.readiness).toBe(true)
    expect(vm.steps.every((step) => step.done)).toBe(true)
    expect(vm.primaryCta?.to).toBe('/public')
  })

  it('normalizes onboarding_summary shell without false-ready fallback', () => {
    const normalized = normalizeOnboardingState({
      ready_for_inbound_intent: false,
      missing_items_count: 3,
      primary_cta_code: 'ADD_AVAILABILITY',
    })

    expect(normalized).not.toBeNull()
    expect(normalized?.readiness).toBe(false)
    expect(normalized?.missingItems).toEqual([])
  })
})
